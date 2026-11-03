import { ClassItem, ClashConflict, DayOfWeek } from '../types/timetable';

export const TIMETABLE_START_MINUTES = 9 * 60;   // 09:00 (540 mins)
export const TIMETABLE_END_MINUTES = 16 * 60;    // 16:00 (960 mins)

export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
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

/**
 * Validates that class times strictly fit within the 9am-4pm boundary
 */
export function validateTimetableBounds(startTime: string, endTime: string): { isValid: boolean; error?: string } {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  if (startMin < TIMETABLE_START_MINUTES) {
    return {
      isValid: false,
      error: 'Classes cannot start before 9:00 AM (Timetable range: 9:00 AM - 4:00 PM).',
    };
  }

  if (endMin > TIMETABLE_END_MINUTES) {
    return {
      isValid: false,
      error: 'Classes cannot end after 4:00 PM (Timetable range: 9:00 AM - 4:00 PM).',
    };
  }

  if (endMin <= startMin) {
    return {
      isValid: false,
      error: 'End time must be after start time.',
    };
  }

  if (endMin - startMin < 30) {
    return {
      isValid: false,
      error: 'Class duration must be at least 30 minutes.',
    };
  }

  return { isValid: true };
}

/**
 * Strict Clash Detection Algorithm
 * Ensures NO TWO CLASSES are scheduled at the same time on the same day.
 */
export function detectClash(
  targetClass: {
    id?: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    courseCode?: string;
    courseTitle?: string;
  },
  allClasses: ClassItem[],
  ignoreClassId?: string
): ClashConflict {
  if (!targetClass.startTime || !targetClass.endTime || !targetClass.dayOfWeek) {
    return { hasClash: false, conflictingClasses: [] };
  }

  const newStart = timeToMinutes(targetClass.startTime);
  const newEnd = timeToMinutes(targetClass.endTime);

  // Filter other classes on the exact same day
  const sameDayClasses = allClasses.filter((c) => {
    if (ignoreClassId && c.id === ignoreClassId) return false;
    if (targetClass.id && c.id === targetClass.id) return false;
    return c.dayOfWeek === targetClass.dayOfWeek;
  });

  const conflictingClasses: ClassItem[] = [];

  for (const c of sameDayClasses) {
    const existStart = timeToMinutes(c.startTime);
    const existEnd = timeToMinutes(c.endTime);

    // Overlap condition:
    // (newStart < existEnd) AND (newEnd > existStart)
    const overlaps = newStart < existEnd && newEnd > existStart;

    if (overlaps) {
      conflictingClasses.push(c);
    }
  }

  if (conflictingClasses.length > 0) {
    const names = conflictingClasses
      .map((c) => `"${c.courseCode || c.courseTitle}" (${formatTime12h(c.startTime)} – ${formatTime12h(c.endTime)})`)
      .join(', ');

    const duration = newEnd - newStart;
    const suggestions = findSuggestedAvailableSlots(
      targetClass.dayOfWeek,
      duration > 0 ? duration : 60,
      allClasses,
      ignoreClassId || targetClass.id
    );

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
 * Suggests open collision-free time slots between 9am-4pm for a given duration.
 */
export function findSuggestedAvailableSlots(
  dayOfWeek: DayOfWeek,
  durationMinutes: number,
  allClasses: ClassItem[],
  ignoreClassId?: string
): { startTime: string; endTime: string }[] {
  const suggestions: { startTime: string; endTime: string }[] = [];
  const duration = Math.max(30, Math.min(durationMinutes, 180)); // 30 mins to 3 hours

  // Candidate start times in 30-min steps from 09:00 up to (16:00 - duration)
  for (let start = TIMETABLE_START_MINUTES; start + duration <= TIMETABLE_END_MINUTES; start += 30) {
    const end = start + duration;
    const sTime = minutesToTime(start);
    const eTime = minutesToTime(end);

    const check = detectClash(
      {
        dayOfWeek,
        startTime: sTime,
        endTime: eTime,
      },
      allClasses,
      ignoreClassId
    );

    if (!check.hasClash) {
      suggestions.push({ startTime: sTime, endTime: eTime });
      if (suggestions.length >= 4) break; // Offer top 4 suggestions
    }
  }

  return suggestions;
}
