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
  courseCode: string;
  courseTitle: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00" to "16:00"
  endTime: string;   // "09:30" to "16:00"
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

export const TIMETABLE_HOURS = [
  { hour: 9, label: '9:00 AM', time24: '09:00' },
  { hour: 10, label: '10:00 AM', time24: '10:00' },
  { hour: 11, label: '11:00 AM', time24: '11:00' },
  { hour: 12, label: '12:00 PM', time24: '12:00' },
  { hour: 13, label: '1:00 PM', time24: '13:00' },
  { hour: 14, label: '2:00 PM', time24: '14:00' },
  { hour: 15, label: '3:00 PM', time24: '15:00' },
  { hour: 16, label: '4:00 PM', time24: '16:00' },
];

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
