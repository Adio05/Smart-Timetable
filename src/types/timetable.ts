export type DayOfWeek =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const WORKDAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
];

export interface ClassItem {
  id: string;
  userId: string;
  visibility?: 'shared';
  courseCode: string;
  courseTitle: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "00:00" to "23:59"
  endTime: string; // "00:15" to "24:00"
  location: string;
  instructor: string;
  color: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  id: string;
  notificationsEnabled: boolean;
  notificationLeadMinutes: number; // 0, 5, 10, 15, 30
  activeSemester?: string;
  showWeekends?: boolean;
  soundEnabled?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClashConflict {
  hasClash: boolean;
  conflictingClasses: ClassItem[];
  message?: string;
  suggestedSlots?: { startTime: string; endTime: string }[];
}

export interface TimeSlotOption {
  time: string;
  label: string;
  minutes: number;
}

export const TIMETABLE_HOURS = Array.from({ length: 25 }, (_, hour) => {
  if (hour === 24) {
    return { hour: 24, label: '12:00 AM', time24: '24:00' };
  }
  const suffix = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 || 12;
  return {
    hour,
    label: `${displayHour}:00 ${suffix}`,
    time24: `${hour.toString().padStart(2, '0')}:00`,
  };
});

export const COLOR_PALETTES = [
  { name: 'Indigo', bg: 'bg-indigo-500/15', border: 'border-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', badge: 'bg-indigo-500 text-white', hex: '#6366f1' },
  { name: 'Emerald', bg: 'bg-emerald-500/15', border: 'border-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500 text-white', hex: '#10b981' },
  { name: 'Violet', bg: 'bg-purple-500/15', border: 'border-purple-500', text: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-500 text-white', hex: '#a855f7' },
  { name: 'Amber', bg: 'bg-amber-500/15', border: 'border-amber-500', text: 'text-amber-600 dark:text-amber-400', badge: 'bg-amber-500 text-white', hex: '#f59e0b' },
  { name: 'Sky', bg: 'bg-sky-500/15', border: 'border-sky-500', text: 'text-sky-600 dark:text-sky-400', badge: 'bg-sky-500 text-white', hex: '#0ea5e9' },
  { name: 'Rose', bg: 'bg-rose-500/15', border: 'border-rose-500', text: 'text-rose-600 dark:text-rose-400', badge: 'bg-rose-500 text-white', hex: '#f43f5e' },
  { name: 'Teal', bg: 'bg-teal-500/15', border: 'border-teal-500', text: 'text-teal-600 dark:text-teal-400', badge: 'bg-teal-500 text-white', hex: '#14b8a6' },
  { name: 'Slate', bg: 'bg-slate-500/15', border: 'border-slate-500', text: 'text-slate-600 dark:text-slate-400', badge: 'bg-slate-500 text-white', hex: '#64748b' },
];
