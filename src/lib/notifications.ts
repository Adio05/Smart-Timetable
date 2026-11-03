import { ClassItem, DayOfWeek, DAYS_OF_WEEK } from '../types/timetable';
import { formatTime12h, timeToMinutes } from './clashDetector';

export interface UpcomingClassAlert {
  classItem: ClassItem;
  startsInMinutes: number;
  isNow: boolean;
}

// Gentle pleasant chime synthesizer using Web Audio API
export function playNotificationSound(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First tone (E5 ~ 659Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second harmonious tone (B5 ~ 987Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(987.77, now + 0.15);
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.8);
  } catch (e) {
    console.debug('Audio play failed (user interaction needed first):', e);
  }
}

/**
 * Checks Notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Requests Notification permission from browser
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return false;
  }
}

/**
 * Sends a browser push notification
 */
export function sendPushNotification(
  title: string,
  options?: NotificationOptions,
  playSound = true
): boolean {
  if (playSound) {
    playNotificationSound();
  }

  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    if (Notification.permission === 'granted') {
      const notif = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/icon.svg',
        ...options,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    }
  } catch (e) {
    console.warn('Direct notification error (falling back to ServiceWorker if available):', e);
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(title, {
              icon: '/pwa-192x192.png',
              badge: '/icon.svg',
              ...options,
            }).catch(() => {});
          })
          .catch(() => {});
        return true;
      }
    } catch {}
  }

  return false;
}

/**
 * Gets the current day of the week as 'Monday'..'Sunday'
 */
export function getCurrentDayOfWeek(): DayOfWeek {
  const dayIndex = new Date().getDay(); // 0 is Sunday, 1 is Monday ...
  const map: Record<number, DayOfWeek> = {
    0: 'Sunday',
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
  };
  return map[dayIndex] || 'Monday';
}

/**
 * Finds the currently active class or the next upcoming class today
 */
export function getLectureStatus(classes: ClassItem[]): {
  currentClass: ClassItem | null;
  nextClass: ClassItem | null;
  progressPercent: number;
  minutesRemainingInCurrent: number;
  minutesUntilNext: number;
} {
  const now = new Date();
  const currentDay = getCurrentDayOfWeek();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayClasses = classes
    .filter((c) => c.dayOfWeek === currentDay)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  let currentClass: ClassItem | null = null;
  let nextClass: ClassItem | null = null;
  let progressPercent = 0;
  let minutesRemainingInCurrent = 0;
  let minutesUntilNext = 0;

  for (const c of todayClasses) {
    const start = timeToMinutes(c.startTime);
    const end = timeToMinutes(c.endTime);

    if (currentMinutes >= start && currentMinutes < end) {
      currentClass = c;
      const duration = end - start;
      const elapsed = currentMinutes - start;
      progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / duration) * 100)));
      minutesRemainingInCurrent = end - currentMinutes;
    } else if (currentMinutes < start && !nextClass) {
      nextClass = c;
      minutesUntilNext = start - currentMinutes;
    }
  }

  return {
    currentClass,
    nextClass,
    progressPercent,
    minutesRemainingInCurrent,
    minutesUntilNext,
  };
}

/**
 * Triggered on interval to notify user of upcoming classes based on lead time
 */
const notifiedClassTokens = new Set<string>();

export function checkAndTriggerUpcomingClassNotifications(
  classes: ClassItem[],
  leadMinutes: number,
  soundEnabled = true,
  onInAppToast?: (msg: string, title: string) => void
): void {
  const now = new Date();
  const currentDay = getCurrentDayOfWeek();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const dateKey = now.toISOString().split('T')[0];

  const todayClasses = classes.filter((c) => c.dayOfWeek === currentDay);

  for (const c of todayClasses) {
    const startMin = timeToMinutes(c.startTime);
    const diff = startMin - currentMinutes;
    const alertToken = `${dateKey}_${c.id}_${leadMinutes}`;

    // If within alert window (e.g., diff == leadMinutes or <= leadMinutes and > 0)
    if (diff > 0 && diff <= leadMinutes && !notifiedClassTokens.has(alertToken)) {
      notifiedClassTokens.add(alertToken);

      const title = `Upcoming Lecture: ${c.courseCode}`;
      const body = `Starts in ${diff} min (${formatTime12h(c.startTime)}) in ${c.location || 'Lecture Hall'}. Instructor: ${c.instructor || 'TBD'}`;

      sendPushNotification(
        title,
        {
          body,
          tag: alertToken,
        },
        soundEnabled
      );

      if (onInAppToast) {
        onInAppToast(body, title);
      }
    }
  }
}
