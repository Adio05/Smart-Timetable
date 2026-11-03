import React from 'react';
import {
  Calendar,
  Plus,
  Bell,
  BellOff,
  LayoutGrid,
  CalendarDays,
  ListFilter,
  Sparkles,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type ViewMode = 'grid' | 'day' | 'agenda';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenAddModal: () => void;
  onOpenNotificationsModal: () => void;
  onOpenPresetsModal: () => void;
  notificationsEnabled: boolean;
  notificationPermission: NotificationPermission;
  classCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  onOpenAddModal,
  onOpenNotificationsModal,
  onOpenPresetsModal,
  notificationsEnabled,
  notificationPermission,
  classCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Branding "Engra" */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
              <Calendar className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Engra
              </h1>
            </div>
          </div>

          {/* Center: View Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
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
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
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
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'agenda'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Agenda ({classCount})</span>
            </button>
          </div>

          {/* Right: Notifications, Presets, PWA & Add Class */}
          <div className="flex items-center gap-2">
            {/* Notification button */}
            <button
              onClick={onOpenNotificationsModal}
              className={`relative p-2 rounded-xl border transition ${
                notificationsEnabled && notificationPermission === 'granted'
                  ? 'border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title="Lecture notifications"
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
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition hidden sm:inline-flex"
              title="Schedule Presets"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
            </button>

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Add Class Primary CTA */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Class</span>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher Tab Bar */}
        <div className="flex sm:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onViewModeChange('grid')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
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
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
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
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
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
