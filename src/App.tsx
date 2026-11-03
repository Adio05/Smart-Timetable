import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ClassItem,
  UserProfile,
  DayOfWeek,
  WORKDAYS,
  DAYS_OF_WEEK,
} from './types/timetable';
import {
  auth,
  db,
  loginAsGuest,
  testFirestoreConnection,
  handleFirestoreError,
  OperationType,
} from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import {
  getLocalClasses,
  saveLocalClasses,
  getLocalProfile,
  saveLocalProfile,
  getQueuedMutations,
  enqueueMutation,
  flushOfflineQueue,
  SAMPLE_COMPUTER_SCIENCE_CLASSES,
} from './lib/offlineStorage';
import {
  checkAndTriggerUpcomingClassNotifications,
  getLectureStatus,
  getNotificationPermission,
  playNotificationSound,
} from './lib/notifications';
import { detectClash } from './lib/clashDetector';
import { useOnlineStatus } from './hooks/useOnlineStatus';

import { Header, ViewMode } from './components/Header';
import { OfflineBanner } from './components/OfflineBanner';
import { UpcomingLectureCard } from './components/UpcomingLectureCard';
import { TimetableGrid } from './components/TimetableGrid';
import { DayView } from './components/DayView';
import { AgendaView } from './components/AgendaView';
import { ClassModal } from './components/ClassModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { SyncModal } from './components/SyncModal';
import { PresetsModal } from './components/PresetsModal';
import { Bell, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // Core state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    const local = getLocalClasses();
    if (local && local.length > 0) return local;
    return [];
  });
  const [profile, setProfile] = useState<UserProfile>(getLocalProfile);
  const [queuedCount, setQueuedCount] = useState<number>(() => getQueuedMutations().length);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Modal controls
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [modalSlot, setModalSlot] = useState<{ day: DayOfWeek; startTime: string }>({
    day: 'Monday',
    startTime: '09:00',
  });
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPresetsModalOpen, setIsPresetsModalOpen] = useState(false);

  // In-app toast alerts
  const [toast, setToast] = useState<{ id: string; title: string; message: string } | null>(null);

  const showToast = useCallback((message: string, title: string = 'Notification') => {
    setToast({ id: `${Date.now()}`, title, message });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  }, []);

  // 1. Initial Connection test & Auth Setup
  useEffect(() => {
    testFirestoreConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        // Automatically initialize guest session for friction-free access
        try {
          const guest = await loginAsGuest();
          setCurrentUser(guest);
        } catch (err) {
          console.warn('Anonymous sign-in skipped, working in local mode:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore sync & initial preset seeding
  useEffect(() => {
    if (!currentUser) return;

    const userClassesRef = collection(db, 'users', currentUser.uid, 'classes');
    const pathForSnapshot = `users/${currentUser.uid}/classes`;

    const unsubscribeSnapshot = onSnapshot(
      userClassesRef,
      (snapshot) => {
        const loaded: ClassItem[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push(docSnap.data() as ClassItem);
        });

        if (loaded.length === 0 && snapshot.metadata.fromCache === false) {
          // If completely new user vault, seed initial sample classes so user has an active timetable
          const local = getLocalClasses();
          const initialSeed = local.length > 0 ? local : SAMPLE_COMPUTER_SCIENCE_CLASSES.map((item, idx) => ({
            ...item,
            id: `cls_${Date.now()}_${idx}`,
            userId: currentUser.uid,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          const batch = writeBatch(db);
          initialSeed.forEach((item) => {
            const classDoc = doc(db, 'users', currentUser.uid, 'classes', item.id);
            batch.set(classDoc, item);
          });
          batch.commit().catch((e) => console.warn('Seed commit failed', e));

          setClasses(initialSeed);
          saveLocalClasses(initialSeed);
        } else if (loaded.length > 0) {
          setClasses(loaded);
          saveLocalClasses(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathForSnapshot);
      }
    );

    return () => unsubscribeSnapshot();
  }, [currentUser]);

  // 3. Flush offline queue when reconnected online
  useEffect(() => {
    if (isOnline && currentUser) {
      setIsSyncing(true);
      flushOfflineQueue(currentUser.uid)
        .then((flushed) => {
          setQueuedCount(getQueuedMutations().length);
          if (flushed > 0) {
            showToast(`Synchronized ${flushed} offline schedule change${flushed > 1 ? 's' : ''}!`, 'Cloud Sync');
          }
        })
        .finally(() => setIsSyncing(false));
    }
  }, [isOnline, currentUser, showToast]);

  // 4. Periodic Upcoming Lecture Alert Dispatcher
  useEffect(() => {
    if (!profile.notificationsEnabled) return;

    const intervalId = setInterval(() => {
      checkAndTriggerUpcomingClassNotifications(
        classes,
        profile.notificationLeadMinutes,
        profile.soundEnabled,
        (msg, title) => showToast(msg, title)
      );
    }, 30000); // Check every 30 seconds

    // Initial check
    checkAndTriggerUpcomingClassNotifications(
      classes,
      profile.notificationLeadMinutes,
      profile.soundEnabled,
      (msg, title) => showToast(msg, title)
    );

    return () => clearInterval(intervalId);
  }, [classes, profile.notificationsEnabled, profile.notificationLeadMinutes, profile.soundEnabled, showToast]);

  // Calculate lecture status (Now & Next)
  const lectureStatus = useMemo(() => {
    return getLectureStatus(classes);
  }, [classes]);

  // Handlers for classes
  const handleOpenAddModal = (day: DayOfWeek = 'Monday', startTime: string = '09:00') => {
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
    // Strict Clash Prevention validation before saving
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

    const userId = currentUser?.uid || 'guest_user';
    const classId = editId || `cls_${Date.now()}`;
    const timestamp = new Date().toISOString();

    const fullClass: ClassItem = {
      ...data,
      id: classId,
      userId,
      createdAt: editId ? editingClass?.createdAt || timestamp : timestamp,
      updatedAt: timestamp,
    };

    // Update local state immediately for instant feedback
    const updatedList = editId
      ? classes.map((c) => (c.id === editId ? fullClass : c))
      : [...classes, fullClass];

    setClasses(updatedList);
    saveLocalClasses(updatedList);

    // Save to Firestore or Queue if offline
    if (isOnline && currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid, 'classes', classId), fullClass);
      } catch (error) {
        console.warn('Firestore write failed, enqueuing offline mutation:', error);
        enqueueMutation({
          id: `mut_${Date.now()}`,
          type: editId ? 'update' : 'create',
          item: fullClass,
          timestamp: Date.now(),
        });
        setQueuedCount(getQueuedMutations().length);
      }
    } else {
      enqueueMutation({
        id: `mut_${Date.now()}`,
        type: editId ? 'update' : 'create',
        item: fullClass,
        timestamp: Date.now(),
      });
      setQueuedCount(getQueuedMutations().length);
    }

    showToast(
      editId ? `Updated ${fullClass.courseCode}` : `Scheduled ${fullClass.courseCode} (${fullClass.dayOfWeek} ${fullClass.startTime})`,
      'Class Saved'
    );
  };

  const handleDeleteClass = async (id: string) => {
    const target = classes.find((c) => c.id === id);
    const updatedList = classes.filter((c) => c.id !== id);
    setClasses(updatedList);
    saveLocalClasses(updatedList);

    if (isOnline && currentUser) {
      try {
        await deleteDoc(doc(db, 'users', currentUser.uid, 'classes', id));
      } catch (err) {
        console.warn('Firestore delete failed, enqueuing:', err);
        if (target) {
          enqueueMutation({
            id: `mut_${Date.now()}`,
            type: 'delete',
            item: target,
            timestamp: Date.now(),
          });
          setQueuedCount(getQueuedMutations().length);
        }
      }
    } else if (target) {
      enqueueMutation({
        id: `mut_${Date.now()}`,
        type: 'delete',
        item: target,
        timestamp: Date.now(),
      });
      setQueuedCount(getQueuedMutations().length);
    }

    showToast(`Removed lecture from schedule`, 'Class Deleted');
  };

  const handleApplyPreset = async (preset: Omit<ClassItem, 'id' | 'userId'>[]) => {
    const userId = currentUser?.uid || 'guest_user';
    const timestamp = new Date().toISOString();
    const newItems: ClassItem[] = preset.map((item, idx) => ({
      ...item,
      id: `cls_${Date.now()}_${idx}`,
      userId,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    setClasses(newItems);
    saveLocalClasses(newItems);

    if (isOnline && currentUser) {
      try {
        const batch = writeBatch(db);
        // Delete old classes
        classes.forEach((c) => {
          batch.delete(doc(db, 'users', currentUser.uid, 'classes', c.id));
        });
        // Set new preset classes
        newItems.forEach((c) => {
          batch.set(doc(db, 'users', currentUser.uid, 'classes', c.id), c);
        });
        await batch.commit();
      } catch (err) {
        console.warn('Batch preset commit failed:', err);
      }
    }

    showToast(`Applied preset schedule with ${newItems.length} lectures!`, 'Preset Loaded');
  };

  const handleClearAll = async () => {
    const oldClasses = [...classes];
    setClasses([]);
    saveLocalClasses([]);

    if (isOnline && currentUser) {
      try {
        const batch = writeBatch(db);
        oldClasses.forEach((c) => {
          batch.delete(doc(db, 'users', currentUser.uid, 'classes', c.id));
        });
        await batch.commit();
      } catch (e) {
        console.warn(e);
      }
    }
    showToast('All classes cleared. Your timetable is now empty.', 'Schedule Cleared');
  };

  const handleImportClasses = async (imported: ClassItem[]) => {
    const userId = currentUser?.uid || 'guest_user';
    const timestamp = new Date().toISOString();

    const formatted: ClassItem[] = imported.map((item, idx) => ({
      ...item,
      id: item.id || `cls_imp_${Date.now()}_${idx}`,
      userId,
      createdAt: item.createdAt || timestamp,
      updatedAt: timestamp,
    }));

    setClasses(formatted);
    saveLocalClasses(formatted);

    if (isOnline && currentUser) {
      try {
        const batch = writeBatch(db);
        formatted.forEach((c) => {
          batch.set(doc(db, 'users', currentUser.uid, 'classes', c.id), c);
        });
        await batch.commit();
      } catch (err) {
        console.warn('Import batch commit error:', err);
      }
    }
  };

  const handleUpdateNotificationSettings = (settings: {
    notificationsEnabled: boolean;
    notificationLeadMinutes: number;
    soundEnabled: boolean;
  }) => {
    const updated: UserProfile = {
      ...profile,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    setProfile(updated);
    saveLocalProfile(updated);

    if (isOnline && currentUser) {
      setDoc(doc(db, 'users', currentUser.uid), updated).catch((err) =>
        console.warn('Profile sync error:', err)
      );
    }

    showToast(
      settings.notificationsEnabled
        ? `Alerts set to ${settings.notificationLeadMinutes} mins before lecture`
        : 'Push alerts disabled',
      'Settings Updated'
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Offline Status & Sync Queue Banner */}
      <OfflineBanner
        isOnline={isOnline}
        queuedCount={queuedCount}
        isSyncing={isSyncing}
        onSyncNow={() => {
          if (currentUser) {
            setIsSyncing(true);
            flushOfflineQueue(currentUser.uid)
              .then((flushed) => {
                setQueuedCount(getQueuedMutations().length);
                if (flushed > 0) {
                  showToast(`Synchronized ${flushed} items!`, 'Sync Complete');
                }
              })
              .finally(() => setIsSyncing(false));
          }
        }}
      />

      {/* Main Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenAddModal={() => handleOpenAddModal('Monday', '09:00')}
        onOpenNotificationsModal={() => setIsNotificationsModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenPresetsModal={() => setIsPresetsModalOpen(true)}
        isOnline={isOnline}
        isSyncing={isSyncing}
        currentUser={currentUser}
        notificationsEnabled={profile.notificationsEnabled}
        notificationPermission={getNotificationPermission()}
        classCount={classes.length}
        activeSemester={profile.activeSemester || 'Fall 2026'}
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
            onSelectClass={handleOpenEditModal}
            onAddClassAtSlot={handleOpenAddModal}
          />
        )}

        {viewMode === 'day' && (
          <DayView
            classes={classes}
            showWeekends={profile.showWeekends || false}
            onSelectClass={handleOpenEditModal}
            onAddClassAtSlot={handleOpenAddModal}
          />
        )}

        {viewMode === 'agenda' && (
          <AgendaView
            classes={classes}
            showWeekends={profile.showWeekends || false}
            onSelectClass={handleOpenEditModal}
            onAddClass={() => handleOpenAddModal('Monday', '09:00')}
          />
        )}
      </main>

      {/* In-app Toast Alert */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-4 shadow-2xl border border-slate-700 dark:border-slate-200 flex items-start gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold">{toast.title}</h4>
            <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-md text-slate-400 hover:text-white dark:hover:text-slate-900"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Class Modal (Create / Edit with live clash detection) */}
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

      {/* Multi-Device Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        currentUser={currentUser}
        classes={classes}
        isOnline={isOnline}
        onImportClasses={handleImportClasses}
        onManualSync={() => {
          if (currentUser) {
            setIsSyncing(true);
            flushOfflineQueue(currentUser.uid).finally(() => setIsSyncing(false));
          }
        }}
        isSyncing={isSyncing}
      />

      {/* Presets & Sample Schedules Modal */}
      <PresetsModal
        isOpen={isPresetsModalOpen}
        onClose={() => setIsPresetsModalOpen(false)}
        onApplyPreset={handleApplyPreset}
        onClearAll={handleClearAll}
        classCount={classes.length}
      />
    </div>
  );
}
