import { DAYS_OF_WEEK } from '../types/timetable.ts';
import type { ClassItem, ClashConflict, DayOfWeek } from '../types/timetable.ts';

export const TIMETABLE_START_MINUTES = 0;
export const TIMETABLE_END_MINUTES = 24 * 60;

export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(minutes: number): string {
  const normalized = ((minutes % TIMETABLE_END_MINUTES) + TIMETABLE_END_MINUTES) % TIMETABLE_END_MINUTES;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

export function validateTimetableBounds(startTime: string, endTime: string): { isValid: boolean; error?: string } {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime)) {
    return {
      isValid: false,
      error: 'Use valid 24-hour times between 00:00 and 23:59.',
    };
  }

  const duration = getDurationMinutes(startTime, endTime);
  if (duration < 30) {
    return {
      isValid: false,
      error: 'Class duration must be at least 30 minutes.',
    };
  }

  return { isValid: true };
}

export function getDurationMinutes(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return end > start ? end - start : end + TIMETABLE_END_MINUTES - start;
}

export function getClassDays(item: Pick<ClassItem, 'dayOfWeek' | 'daysOfWeek'>): DayOfWeek[] {
  return Array.from(new Set(item.daysOfWeek?.length ? item.daysOfWeek : [item.dayOfWeek]));
}

export function nextDay(day: DayOfWeek): DayOfWeek {
  return DAYS_OF_WEEK[(DAYS_OF_WEEK.indexOf(day) + 1) % DAYS_OF_WEEK.length];
}

/** Segments where a recurring class occupies a particular day (including overnight carry-over). */
export function getClassSegmentsOnDay(item: ClassItem, day: DayOfWeek): { start: number; end: number }[] {
  const start = timeToMinutes(item.startTime);
  const end = timeToMinutes(item.endTime);
  const overnight = end <= start;
  const segments: { start: number; end: number }[] = [];
  for (const classDay of getClassDays(item)) {
    if (classDay === day) segments.push({ start, end: overnight ? TIMETABLE_END_MINUTES : end });
    if (overnight && nextDay(classDay) === day) segments.push({ start: 0, end });
  }
  return segments;
}

/**
 * Strict Clash Detection Algorithm
 * Ensures NO TWO CLASSES are scheduled at the same time on the same day.
 */
export function detectClash(
  targetClass: {
    id?: string;
    dayOfWeek: DayOfWeek;
    daysOfWeek?: DayOfWeek[];
    startTime: string;
    endTime: string;
    courseCode?: string;
    courseTitle?: string;
  },
  allClasses: ClassItem[],
  ignoreClassId?: string,
  includeSuggestions = true
): ClashConflict {
  if (!targetClass.startTime || !targetClass.endTime || !targetClass.dayOfWeek) {
    return { hasClash: false, conflictingClasses: [] };
  }

  const target: ClassItem = { ...targetClass, id: targetClass.id || '__candidate__', userId: '', courseCode: targetClass.courseCode || '', courseTitle: targetClass.courseTitle || '', location: '', instructor: '', color: '', daysOfWeek: targetClass.daysOfWeek };
  const targetDays = getClassDays(target);
  const conflictingClasses: ClassItem[] = [];

  for (const c of allClasses) {
    if (ignoreClassId && c.id === ignoreClassId) continue;
    if (targetClass.id && c.id === targetClass.id) continue;
    const overlaps = targetDays.some((day) => getClassSegmentsOnDay(target, day).some((candidate) =>
      getClassSegmentsOnDay(c, day).some((existing) => candidate.start < existing.end && candidate.end > existing.start)
    ));
    if (overlaps) conflictingClasses.push(c);
  }

  if (conflictingClasses.length > 0) {
    const names = conflictingClasses
      .map((c) => `"${c.courseCode || c.courseTitle}" (${formatTime12h(c.startTime)} – ${formatTime12h(c.endTime)})`)
      .join(', ');

    const duration = getDurationMinutes(targetClass.startTime, targetClass.endTime);
    const suggestions = includeSuggestions
      ? findSuggestedAvailableSlots(targetClass.dayOfWeek, duration > 0 ? duration : 60, allClasses, ignoreClassId || targetClass.id)
      : [];

    return {
      hasClash: true,
      conflictingClasses,
      message: `Schedule Clash Detected: Conflicts with ${names} on ${targetClass.dayOfWeek}. Two classes cannot run at the same time!`,
      suggestedSlots: suggestions,
    };
  }

  return { hasClash: false, conflictingClasses: [] };
}

/**
 * Suggests open collision-free time slots across the full day for a given duration.
 */
export function findSuggestedAvailableSlots(
  dayOfWeek: DayOfWeek,
  durationMinutes: number,
  allClasses: ClassItem[],
  ignoreClassId?: string
): { startTime: string; endTime: string }[] {
  const suggestions: { startTime: string; endTime: string }[] = [];
  const duration = Math.max(30, Math.min(durationMinutes, 180));

  for (let start = TIMETABLE_START_MINUTES; start < TIMETABLE_END_MINUTES; start += 30) {
    const end = (start + duration) % TIMETABLE_END_MINUTES;
    const sTime = minutesToTime(start);
    const eTime = minutesToTime(end);

    const check = detectClash(
      {
        dayOfWeek,
        startTime: sTime,
        endTime: eTime,
      },
      allClasses,
      ignoreClassId,
      false
    );

    if (!check.hasClash) {
      suggestions.push({ startTime: sTime, endTime: eTime });
      if (suggestions.length >= 4) break; // Offer top 4 suggestions
    }
  }

  return suggestions;
}
