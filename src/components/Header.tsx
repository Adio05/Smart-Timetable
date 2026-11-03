import React from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Cloud,
  CloudOff,
  Bell,
  BellOff,
  LayoutGrid,
  CalendarDays,
  ListFilter,
  Sparkles,
  Smartphone,
  User as UserIcon,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { User } from 'firebase/auth';

export type ViewMode = 'grid' | 'day' | 'agenda';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAddModal: () => void;
  onOpenNotificationsModal: () => void;
  onOpenSyncModal: () => void;
  onOpenPresetsModal: () => void;
  isOnline: boolean;
  isSyncing: boolean;
  currentUser: User | null;
  notificationsEnabled: boolean;
  notificationPermission: NotificationPermission;
  classCount: number;
  activeSemester: string;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenAddModal,
  onOpenNotificationsModal,
  onOpenSyncModal,
  onOpenPresetsModal,
  isOnline,
  isSyncing,
  currentUser,
  notificationsEnabled,
  notificationPermission,
  classCount,
  activeSemester,
}) => {
  const isGuest = currentUser?.isAnonymous;
  const isGoogle = currentUser && !currentUser.isAnonymous;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Branding & Tagline */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  Chronos
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
                  9 AM – 4 PM
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {activeSemester}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Zero-Clash Smart Lecture Timetable
              </p>
            </div>
          </div>

          {/* Center: View Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Week Grid</span>
            </button>
            <button
              onClick={() => onViewModeChange('day')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Today</span>
            </button>
            <button
              onClick={() => onViewModeChange('agenda')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Agenda ({classCount})</span>
            </button>
          </div>

          {/* Right: Actions, Sync & Add */}
          <div className="flex items-center gap-2">
            {/* Sync & Device Cloud Status */}
            <button
              onClick={onOpenSyncModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              title={
                isOnline
                  ? isGoogle
                    ? `Synced to ${currentUser.email}`
                    : 'Synced across devices (Guest session). Click to connect Google account.'
                  : 'Offline (Changes cached locally)'
              }
            >
              {isOnline ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden lg:inline text-slate-700 dark:text-slate-300">
                    {isGoogle ? 'Synced' : 'Device Sync'}
                  </span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="hidden lg:inline text-amber-600 dark:text-amber-400">Offline</span>
                </>
              )}
            </button>

            {/* Notification button */}
            <button
              onClick={onOpenNotificationsModal}
              className={`relative p-2 rounded-lg border transition ${
                notificationsEnabled && notificationPermission === 'granted'
                  ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Push notifications for upcoming lectures"
            >
              {notificationsEnabled && notificationPermission === 'granted' ? (
                <Bell className="w-4 h-4" />
              ) : (
                <BellOff className="w-4 h-4 text-slate-400" />
              )}
              {notificationsEnabled && notificationPermission === 'granted' && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Presets Button */}
            <button
              onClick={onOpenPresetsModal}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition hidden sm:inline-flex"
              title="Load sample schedules or reset"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Add Class Primary CTA */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Class</span>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher Tab Bar */}
        <div className="flex sm:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              viewMode === 'grid'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Week Grid</span>
          </button>
          <button
            onClick={() => onViewModeChange('day')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              viewMode === 'day'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Today</span>
          </button>
          <button
            onClick={() => onViewModeChange('agenda')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              viewMode === 'agenda'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Agenda</span>
          </button>
        </div>
      </div>
    </header>
  );
};
