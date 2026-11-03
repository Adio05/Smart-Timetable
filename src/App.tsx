import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  SAMPLE_COMPUTER_SCIENCE_CLASSES,
} from './lib/offlineStorage';
import {
  checkAndTriggerUpcomingClassNotifications,
  getLectureStatus,
  getNotificationPermission,
} from './lib/notifications';
import { detectClash } from './lib/clashDetector';

import { Header, ViewMode } from './components/Header';
import { UpcomingLectureCard } from './components/UpcomingLectureCard';
import { TimetableGrid } from './components/TimetableGrid';
import { DayView } from './components/DayView';
import { AgendaView } from './components/AgendaView';
import { ClassModal } from './components/ClassModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { PresetsModal } from './components/PresetsModal';
import { Bell, X } from 'lucide-react';

export default function App() {
  // Core timetable state (stored locally on device, offline-ready)
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    const local = getLocalClasses();
    if (local && local.length > 0) return local;

    // Seed default schedule on first launch
    const timestamp = new Date().toISOString();
    const initialSeed = SAMPLE_COMPUTER_SCIENCE_CLASSES.map((item, idx) => ({
      ...item,
      id: `cls_${Date.now()}_${idx}`,
      userId: 'local_user',
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    saveLocalClasses(initialSeed);
    return initialSeed;
  });

  const [profile, setProfile] = useState<UserProfile>(getLocalProfile);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

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

  const handleSaveClass = (
    data: Omit<ClassItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    editId?: string
  ) => {
    // Strict Clash Prevention validation
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
    const timestamp = new Date().toISOString();

    const fullClass: ClassItem = {
      ...data,
      id: classId,
      userId: 'local_user',
      createdAt: editId ? editingClass?.createdAt || timestamp : timestamp,
      updatedAt: timestamp,
    };

    // Save directly to local storage
    const updatedList = editId
      ? classes.map((c) => (c.id === editId ? fullClass : c))
      : [...classes, fullClass];

    setClasses(updatedList);
    saveLocalClasses(updatedList);

    showToast(
      editId
        ? `Updated ${fullClass.courseCode}`
        : `Scheduled ${fullClass.courseCode} (${fullClass.dayOfWeek} ${fullClass.startTime})`,
      'Class Saved'
    );
  };

  const handleDeleteClass = (id: string) => {
    const updatedList = classes.filter((c) => c.id !== id);
    setClasses(updatedList);
    saveLocalClasses(updatedList);
    showToast(`Removed lecture from schedule`, 'Class Deleted');
  };

  const handleApplyPreset = (preset: Omit<ClassItem, 'id' | 'userId'>[]) => {
    const timestamp = new Date().toISOString();
    const newItems: ClassItem[] = preset.map((item, idx) => ({
      ...item,
      id: `cls_${Date.now()}_${idx}`,
      userId: 'local_user',
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    setClasses(newItems);
    saveLocalClasses(newItems);
    showToast(`Applied preset schedule with ${newItems.length} lectures!`, 'Preset Loaded');
  };

  const handleClearAll = () => {
    setClasses([]);
    saveLocalClasses([]);
    showToast('All classes cleared. Your timetable is now empty.', 'Schedule Cleared');
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

    showToast(
      settings.notificationsEnabled
        ? `Alerts set to ${settings.notificationLeadMinutes} mins before lecture`
        : 'Push alerts disabled',
      'Settings Updated'
    );
  };

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
