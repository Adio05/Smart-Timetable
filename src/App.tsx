import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import {
  ClassItem,
  UserProfile,
  DayOfWeek,
} from './types/timetable';
import {
  getLocalClasses,
  saveLocalClasses,
  getLocalProfile,
  saveLocalProfile,
} from './lib/offlineStorage';
import {
  checkAndTriggerUpcomingClassNotifications,
  getLectureStatus,
  getNotificationPermission,
} from './lib/notifications';
import { detectClash } from './lib/clashDetector';
import { ADMIN_EMAIL, isAdminUser } from './lib/access';
import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  resendVerificationEmail,
  logoutUser,
  testFirestoreConnection,
  subscribeToSharedClasses,
  createSharedClass,
  updateSharedClass,
  deleteSharedClass,
  replaceAllSharedClasses,
  subscribeToUserProfile,
  saveRemoteUserProfile,
} from './lib/firebase';

import { Header, ViewMode } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { UpcomingLectureCard } from './components/UpcomingLectureCard';
import { TimetableGrid } from './components/TimetableGrid';
import { DayView } from './components/DayView';
import { AgendaView } from './components/AgendaView';
import { ClassModal } from './components/ClassModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { PresetsModal } from './components/PresetsModal';
import { Bell, X } from 'lucide-react';

export default function App() {
  // Core timetable state (cached locally for offline support, updated in real time from Firestore when signed in)
  const [classes, setClasses] = useState<ClassItem[]>(() => getLocalClasses());
  const [profile, setProfile] = useState<UserProfile>(getLocalProfile);
  const [hasRemoteProfile, setHasRemoteProfile] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const isAdmin = useMemo(() => isAdminUser(user), [user]);

  // Modal controls
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [modalSlot, setModalSlot] = useState<{ day: DayOfWeek; startTime: string }>({
    day: 'Monday',
    startTime: '09:00',
  });
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);

  // In-app toast alerts
  const [toast, setToast] = useState<{ id: string; title: string; message: string } | null>(null);

  const showToast = useCallback((message: string, title: string = 'Notification') => {
    setToast({ id: `${Date.now()}`, title, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  // Test Firestore connection on boot and listen to Firebase Auth token state
  useEffect(() => {
    testFirestoreConnection();
    const unsubAuth = onIdTokenChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  // Subscribe to shared timetable and user preferences when signed in
  useEffect(() => {
    if (!user || !user.emailVerified) {
      return;
    }

    const unsubClasses = subscribeToSharedClasses(
      (remoteClasses) => {
        setClasses(remoteClasses);
        saveLocalClasses(remoteClasses);
      },
      (err) => {
        console.error('Failed to subscribe to classes:', err);
      }
    );

    const unsubProfile = subscribeToUserProfile(
      user.uid,
      (remoteProfile) => {
        if (remoteProfile) {
          setHasRemoteProfile(true);
          setProfile(remoteProfile);
          saveLocalProfile(remoteProfile);
        } else {
          setHasRemoteProfile(false);
        }
      },
      (err) => {
        console.error('Failed to subscribe to user profile:', err);
      }
    );

    return () => {
      unsubClasses();
      unsubProfile();
    };
  }, [user]);

  // Periodic Upcoming Lecture Alert Dispatcher
  useEffect(() => {
    if (!profile.notificationsEnabled) return;

    const intervalId = setInterval(() => {
      checkAndTriggerUpcomingClassNotifications(
        classes,
        profile.notificationLeadMinutes,
        profile.soundEnabled,
        (msg, title) => showToast(msg, title)
      );
    }, 30000);

    checkAndTriggerUpcomingClassNotifications(
      classes,
      profile.notificationLeadMinutes,
      profile.soundEnabled,
      (msg, title) => showToast(msg, title)
    );

    return () => clearInterval(intervalId);
  }, [classes, profile.notificationsEnabled, profile.notificationLeadMinutes, profile.soundEnabled, showToast]);

  const lectureStatus = useMemo(() => {
    return getLectureStatus(classes);
  }, [classes]);

  const handleGoogleSignIn = async () => {
    try {
      const signedInUser = await loginWithGoogle();
      if (isAdminUser(signedInUser)) {
        showToast(`Signed in as Admin (${signedInUser.email}). You can add and edit classes at any time.`, 'Welcome Admin');
      } else {
        showToast(`Signed in as ${signedInUser.email}.`, 'Signed In');
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
      throw error;
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    const signedInUser = await loginWithEmail(email, password);
    if (isAdminUser(signedInUser)) {
      showToast(`Signed in as Admin (${signedInUser.email}). You can add and edit classes at any time.`, 'Welcome Admin');
    } else if (signedInUser.emailVerified) {
      showToast(`Signed in as ${signedInUser.email}.`, 'Signed In');
    }
  };

  const handleRefreshVerification = async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    const refreshed = auth.currentUser;
    if (refreshed.emailVerified) {
      await refreshed.getIdToken(true);
      setUser(refreshed);
      showToast(`Email verified for ${refreshed.email}!`, 'Verified');
    } else {
      throw new Error('Email is not verified yet. Please click the verification link in your inbox first.');
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
      setHasRemoteProfile(false);
      showToast('Signed out of Google account.', 'Signed Out');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  // Handlers for classes
  const handleOpenAddModal = (day: DayOfWeek = 'Monday', startTime: string = '09:00') => {
    if (!isAdmin) {
      showToast(`Only admin (${ADMIN_EMAIL}) can schedule new classes.`, 'Admin Access Required');
      return;
    }
    setEditingClass(null);
    setModalSlot({ day, startTime });
    setIsClassModalOpen(true);
  };

  const handleOpenEditModal = (c: ClassItem) => {
    setEditingClass(c);
    setModalSlot({ day: c.dayOfWeek, startTime: c.startTime });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (
    data: Omit<ClassItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    if (!user || !isAdmin) {
      showToast(`Only admin (${ADMIN_EMAIL}) can modify classes.`, 'Permission Denied');
      return;
    }

    const clashCheck = detectClash(
      {
        id: editId,
        dayOfWeek: data.dayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        courseCode: data.courseCode,
        courseTitle: data.courseTitle,
      },
      classes,
      editId
    );

    if (clashCheck.hasClash) {
      showToast(clashCheck.message || 'Schedule clash detected!', 'Cannot Save Class');
      return;
    }

    const classId = editId || `cls_${Date.now()}`;

    try {
      if (editId) {
        await updateSharedClass(editId, data);
      } else {
        await createSharedClass(classId, user.uid, data);
      }

      showToast(
        editId
          ? `Updated ${data.courseCode}`
          : `Scheduled ${data.courseCode} (${data.dayOfWeek} ${data.startTime})`,
        'Class Saved'
      );
    } catch (error) {
      console.error('Error saving class:', error);
      showToast('Failed to save class to Firestore. Check permissions and connection.', 'Save Error');
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!user || !isAdmin) {
      showToast(`Only admin (${ADMIN_EMAIL}) can delete classes.`, 'Permission Denied');
      return;
    }
    try {
      await deleteSharedClass(id);
      showToast('Removed lecture from schedule', 'Class Deleted');
    } catch (error) {
      console.error('Error deleting class:', error);
      showToast('Failed to delete class.', 'Delete Error');
    }
  };

  const handleApplyPreset = async (preset: Omit<ClassItem, 'id' | 'userId'>[]) => {
    if (!user || !isAdmin) {
      showToast(`Only admin (${ADMIN_EMAIL}) can load presets.`, 'Permission Denied');
      return;
    }
    try {
      await replaceAllSharedClasses(preset, user.uid);
      showToast(`Applied preset schedule with ${preset.length} lectures!`, 'Preset Loaded');
    } catch (error) {
      console.error('Error applying preset:', error);
      showToast('Failed to apply preset schedule.', 'Preset Error');
    }
  };

  const handleClearAll = async () => {
    if (!user || !isAdmin) {
      showToast(`Only admin (${ADMIN_EMAIL}) can clear the schedule.`, 'Permission Denied');
      return;
    }
    try {
      await replaceAllSharedClasses([], user.uid);
      showToast('All classes cleared. The timetable is now empty.', 'Schedule Cleared');
    } catch (error) {
      console.error('Error clearing schedule:', error);
      showToast('Failed to clear schedule.', 'Clear Error');
    }
  };

  const handleUpdateNotificationSettings = async (settings: {
    notificationsEnabled: boolean;
    notificationLeadMinutes: number;
    soundEnabled: boolean;
  }) => {
    const updated: UserProfile = {
      ...profile,
      ...settings,
      id: user?.uid || profile.id,
      updatedAt: new Date().toISOString(),
    };
    setProfile(updated);
    saveLocalProfile(updated);

    if (user && user.emailVerified) {
      try {
        await saveRemoteUserProfile(user.uid, updated, hasRemoteProfile);
        setHasRemoteProfile(true);
      } catch (error) {
        console.error('Error saving user settings:', error);
      }
    }

    showToast(
      settings.notificationsEnabled
        ? `Alerts set to ${settings.notificationLeadMinutes} mins before lecture`
        : 'Push alerts disabled',
      'Settings Updated'
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || !user.emailVerified) {
    return (
      <LoginScreen
        onGoogleSignIn={handleGoogleSignIn}
        onEmailSignIn={handleEmailSignIn}
        pendingVerificationEmail={user && !user.emailVerified ? user.email || 'your email' : null}
        onResendVerification={resendVerificationEmail}
        onRefreshVerification={handleRefreshVerification}
        onSignOut={handleSignOut}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Main Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAddModal={() => handleOpenAddModal('Monday', '09:00')}
        onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
        onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        notificationsEnabled={profile.notificationsEnabled}
        notificationPermission={getNotificationPermission()}
        classCount={classes.length}
        user={user}
        isAdmin={isAdmin}
        authLoading={authLoading}
        onGoogleSignIn={handleGoogleSignIn}
        onSignOut={handleSignOut}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Real-time lecture tracker: Now in session or Up next */}
        <UpcomingLectureCard
          currentClass={lectureStatus.currentClass}
          nextClass={lectureStatus.nextClass}
          progressPercent={lectureStatus.progressPercent}
          minutesRemainingInCurrent={lectureStatus.minutesRemainingInCurrent}
          minutesUntilNext={lectureStatus.minutesUntilNext}
          onSelectClass={handleOpenEditModal}
        />

        {/* View Switch Content */}
        {viewMode === 'grid' && (
          <TimetableGrid
            classes={classes}
            showWeekends={profile.showWeekends || false}
            isAdmin={isAdmin}
            onSelectClass={handleOpenEditModal}
            onAddClassAtSlot={handleOpenAddModal}
          />
        )}

        {viewMode === 'day' && (
          <DayView
            classes={classes}
            showWeekends={profile.showWeekends || false}
            isAdmin={isAdmin}
            onSelectClass={handleOpenEditModal}
            onAddClassAtSlot={handleOpenAddModal}
          />
        )}

        {viewMode === 'agenda' && (
          <AgendaView
            classes={classes}
            showWeekends={profile.showWeekends || false}
            isAdmin={isAdmin}
            onSelectClass={handleOpenEditModal}
            onAddClass={() => handleOpenAddModal('Monday', '09:00')}
          />
        )}
      </main>

      {/* In-app Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl bg-slate-950 text-white p-4 shadow-2xl border-2 border-slate-700 flex items-start gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Bell className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-black tracking-tight">{toast.title}</h4>
            <p className="text-xs font-semibold opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-md text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Class Modal (Create / Edit for Admin, Read-only Details for Viewers) */}
      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onSave={handleSaveClass}
        onDelete={handleDeleteClass}
        allClasses={classes}
        editingClass={editingClass}
        initialDay={modalSlot.day}
        initialStartTime={modalSlot.startTime}
        showWeekends={profile.showWeekends || false}
        isAdmin={isAdmin}
      />

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        notificationsEnabled={profile.notificationsEnabled}
        notificationLeadMinutes={profile.notificationLeadMinutes}
        soundEnabled={profile.soundEnabled ?? true}
        onUpdateSettings={handleUpdateNotificationSettings}
      />

      {/* Presets & Sample Schedules Modal (Admin only) */}
      {isAdmin && (
        <PresetsModal
          isOpen={isPresetsModalOpen}
          onClose={() => setIsPresetsModalOpen(false)}
          onApplyPreset={handleApplyPreset}
          onClearAll={handleClearAll}
          classCount={classes.length}
        />
      )}
    </div>
  );
}
