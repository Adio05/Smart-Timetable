import React, { useState } from 'react';
import {
  Cloud,
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle2,
  X,
  LogIn,
  LogOut,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logoutUser } from '../lib/firebase';
import { ClassItem } from '../types/timetable';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  classes: ClassItem[];
  isOnline: boolean;
  onImportClasses: (imported: ClassItem[]) => void;
  onManualSync?: () => void;
  isSyncing?: boolean;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  classes,
  isOnline,
  onImportClasses,
  onManualSync,
  isSyncing,
}) => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isGoogle = currentUser && !currentUser.isAnonymous;

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error(err);
    }
  };

  // Export JSON timetable
  const handleExportJson = () => {
    const dataStr = JSON.stringify(classes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chronos_timetable_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON timetable
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImportClasses(parsed);
          alert(`Successfully imported ${parsed.length} lectures!`);
          onClose();
        } else {
          alert('Invalid timetable file format: expected array of classes.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const copyAppUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Multi-Device Synchronization
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access your timetable seamlessly from any smartphone, laptop, or tablet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* How Multi-Device Sync Works Infographic */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-around py-2 text-center text-slate-700 dark:text-slate-300">
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-indigo-600">
                  <Laptop className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium">Laptop</span>
              </div>
              <div className="flex items-center text-slate-300 dark:text-slate-600">
                <span className="h-0.5 w-8 bg-current" />
                <Cloud className="w-4 h-4 mx-1 text-emerald-500 animate-pulse" />
                <span className="h-0.5 w-8 bg-current" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-indigo-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium">Phone</span>
              </div>
              <div className="flex items-center text-slate-300 dark:text-slate-600">
                <span className="h-0.5 w-8 bg-current" />
                <Cloud className="w-4 h-4 mx-1 text-emerald-500 animate-pulse" />
                <span className="h-0.5 w-8 bg-current" />
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center text-indigo-600">
                  <Tablet className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium">Tablet</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-2 leading-relaxed">
              When logged into your account, changes update in real time across every browser, phone, and tablet instantly with zero clash risk.
            </p>
          </div>

          {/* Account Status Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            {isGoogle ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Synchronized via Google Account</span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium mt-0.5">
                    {currentUser.email}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white">
                    Currently: Guest Device Session
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Your timetable is saved locally and synced on this browser. Sign in with Google to automatically mirror this schedule onto your other devices.
                  </p>
                </div>

                {authError && (
                  <div className="text-xs text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-800">
                    {authError}
                  </div>
                )}

                <button
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow transition active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Connect Google Account for Seamless Cross-Device Access</span>
                </button>
              </div>
            )}
          </div>

          {/* Share App URL with other devices */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Open on Your Other Devices
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-300 select-all"
              />
              <button
                onClick={copyAppUrl}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold shrink-0 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Export / Import JSON Backup */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Schedule JSON</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer transition">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Schedule JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
