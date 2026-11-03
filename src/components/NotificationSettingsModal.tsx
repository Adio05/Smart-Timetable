import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Clock,
  Sparkles,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import {
  requestNotificationPermission,
  sendPushNotification,
  playNotificationSound,
  getNotificationPermission,
} from '../lib/notifications';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationsEnabled: boolean;
  notificationLeadMinutes: number;
  soundEnabled: boolean;
  onUpdateSettings: (settings: {
    notificationsEnabled: boolean;
    notificationLeadMinutes: number;
    soundEnabled: boolean;
  }) => void;
}

const LEAD_TIME_OPTIONS = [
  { value: 0, label: 'At class start (0 min)' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before (Recommended)' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
];

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  notificationsEnabled,
  notificationLeadMinutes,
  soundEnabled,
  onUpdateSettings,
}) => {
  const [permission, setPermission] = useState<NotificationPermission>(getNotificationPermission());
  const [testSent, setTestSent] = useState(false);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    if (granted) {
      onUpdateSettings({
        notificationsEnabled: true,
        notificationLeadMinutes,
        soundEnabled,
      });
    }
  };

  const handleTestNotification = () => {
    sendPushNotification(
      'Engra Lecture Alert (Test)',
      {
        body: 'Upcoming Lecture: CSC 301 starts in 10 minutes in Turing Hall. Lecture notifications are active!',
      },
      soundEnabled
    );
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Lecture Push Notifications
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Never miss an upcoming class
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

        <div className="mt-5 space-y-5">
          {/* Permission Status Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Browser Push Permission
                </span>
                <p className="text-[11px] text-slate-500">
                  Status:{' '}
                  <span
                    className={`font-semibold capitalize ${
                      permission === 'granted'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : permission === 'denied'
                        ? 'text-rose-600'
                        : 'text-amber-600'
                    }`}
                  >
                    {permission}
                  </span>
                </p>
              </div>

              {permission !== 'granted' && (
                <button
                  onClick={handleRequestPermission}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow transition"
                >
                  Enable Now
                </button>
              )}
            </div>

            {permission === 'denied' && (
              <div className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Notifications are blocked in your browser. Tap the padlock icon in your address bar to allow notifications for this site.
                </span>
              </div>
            )}
          </div>

          {/* Toggle Notifications */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                Enable Upcoming Lecture Alerts
              </span>
              <p className="text-[11px] text-slate-500">
                Push alert sent to your device before each lecture begins
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) =>
                  onUpdateSettings({
                    notificationsEnabled: e.target.checked,
                    notificationLeadMinutes,
                    soundEnabled,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Lead Time Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 dark:text-white mb-1.5">
              Notification Lead Time
            </label>
            <div className="space-y-1.5">
              {LEAD_TIME_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                    notificationLeadMinutes === opt.value
                      ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                      : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{opt.label}</span>
                  </div>
                  <input
                    type="radio"
                    name="leadTime"
                    value={opt.value}
                    checked={notificationLeadMinutes === opt.value}
                    onChange={() =>
                      onUpdateSettings({
                        notificationsEnabled,
                        notificationLeadMinutes: opt.value,
                        soundEnabled,
                      })
                    }
                    className="accent-indigo-600"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Sound alert chime */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-slate-400" />
              )}
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-900 dark:text-white">
                  Audio Chime
                </span>
                <p className="text-[11px] text-slate-500">
                  Pleasant chime sound when alert triggers
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                if (next) playNotificationSound();
                onUpdateSettings({
                  notificationsEnabled,
                  notificationLeadMinutes,
                  soundEnabled: next,
                });
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
                soundEnabled
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {soundEnabled ? 'Enabled' : 'Muted'}
            </button>
          </div>

          {/* Test Notification Trigger */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>{testSent ? '✓ Alert Sent!' : 'Send Test Notification to This Device'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
