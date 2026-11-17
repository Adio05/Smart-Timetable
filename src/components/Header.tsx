import React from 'react';
import { User } from 'firebase/auth';
import {
  Plus,
  Bell,
  BellOff,
  LayoutGrid,
  CalendarDays,
  ListFilter,
  Sparkles,
  LogOut,
  ShieldCheck,
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
  user: User | null;
  isAdmin: boolean;
  authLoading: boolean;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
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
  user,
  isAdmin,
  authLoading,
  onGoogleSignIn,
  onSignOut,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Branding "Engra" */}
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/assets/aistudio/engra-logo_25c5e3c2.png"
              alt="Engra Logo"
              className="h-10 w-auto rounded-lg bg-white px-1 py-0.5 object-contain border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
            />
            <div className="min-w-0">
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Engra
              </h1>
            </div>
          </div>

          {/* Center: View Switcher */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
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

          {/* Right: Notifications, Presets (Admin), PWA, Account, Add Class (Admin) */}
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

            {/* Presets Button (Admin only) */}
            {isAdmin && (
              <button
                onClick={onOpenPresetsModal}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition hidden sm:inline-flex"
                title="Schedule Presets"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
              </button>
            )}

            {/* PWA Install Button */}
            <PWAInstallButton />

            {/* Google / Email Auth Status */}
            {!authLoading &&
              (user ? (
                <div className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || user.email || 'User'}
                      className="w-6 h-6 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[11px] font-black uppercase shrink-0">
                      {(user.email || 'U')[0]}
                    </div>
                  )}
                  <div className="hidden lg:flex flex-col leading-none pr-1">
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white max-w-[140px] truncate">
                      {user.displayName || user.email}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider flex items-center gap-0.5 mt-0.5 ${
                        isAdmin ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isAdmin && <ShieldCheck className="w-2.5 h-2.5" />}
                      {isAdmin ? 'Admin' : 'Viewer'}
                    </span>
                  </div>
                  <button
                    onClick={onSignOut}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 transition"
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onGoogleSignIn}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition shadow-xs"
                >
                  <span>Sign In</span>
                </button>
              ))}

            {/* Add Class Primary CTA (Admin only) */}
            {isAdmin && (
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Class</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile View Switcher Tab Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100 dark:border-slate-800">
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
