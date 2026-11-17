import { ClassItem, ClashConflict, DayOfWeek } from '../types/timetable';

export const TIMETABLE_START_MINUTES = 0; // 00:00 (12:00 AM)
export const TIMETABLE_END_MINUTES = 24 * 60; // 24:00 (12:00 AM end of day)

export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(':')) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(minutes: number): string {
  const clamped = Math.max(TIMETABLE_START_MINUTES, Math.min(TIMETABLE_END_MINUTES, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  if (timeStr === '24:00') return '12:00 AM';
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

  if (startMin < TIMETABLE_START_MINUTES || endMin > TIMETABLE_END_MINUTES) {
    return {
      isValid: false,
      error: 'Classes must be scheduled within the 24-hour day (12:00 AM to 11:59 PM).',
    };
  }

  if (endMin <= startMin) {
    return {
      isValid: false,
      error: 'End time must be after start time.',
    };
  }

  if (endMin - startMin < 15) {
    return {
      isValid: false,
      error: 'Class duration must be at least 15 minutes.',
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

  const targetStart = timeToMinutes(targetClass.startTime);
  const targetEnd = timeToMinutes(targetClass.endTime);

  const conflictingClasses = allClasses.filter((c) => {
    if (ignoreClassId && c.id === ignoreClassId) return false;
    if (targetClass.id && c.id === targetClass.id) return false;
    if (c.dayOfWeek !== targetClass.dayOfWeek) return false;

    const existingStart = timeToMinutes(c.startTime);
    const existingEnd = timeToMinutes(c.endTime);

    return targetStart < existingEnd && targetEnd > existingStart;
  });

  if (conflictingClasses.length > 0) {
    const names = conflictingClasses
      .map((c) => `"${c.courseCode || c.courseTitle}" (${formatTime12h(c.startTime)} – ${formatTime12h(c.endTime)})`)
      .join(', ');

    const duration = targetEnd - targetStart;
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
 * Suggests open collision-free time slots across the 24-hour day for a given duration.
 * Prioritizes standard daytime hours first, then early morning / late evening.
 * Computes overlaps directly without calling detectClash to avoid mutual recursion.
 */
export function findSuggestedAvailableSlots(
  dayOfWeek: DayOfWeek,
  durationMinutes: number,
  allClasses: ClassItem[],
  ignoreClassId?: string
): { startTime: string; endTime: string }[] {
  const suggestions: { startTime: string; endTime: string }[] = [];
  const duration = Math.max(15, Math.min(durationMinutes, 180));
  const maxEnd = 23 * 60 + 59; // Keep within valid <input type="time"> bounds

  const dayIntervals = allClasses
    .filter((c) => c.dayOfWeek === dayOfWeek && (!ignoreClassId || c.id !== ignoreClassId))
    .map((c) => ({
      start: timeToMinutes(c.startTime),
      end: timeToMinutes(c.endTime),
    }));

  const candidateStarts: number[] = [];
  for (let start = 7 * 60; start <= 22 * 60; start += 30) {
    candidateStarts.push(start);
  }
  for (let start = 0; start < 7 * 60; start += 30) {
    candidateStarts.push(start);
  }
  for (let start = 22 * 60 + 30; start < TIMETABLE_END_MINUTES; start += 30) {
    candidateStarts.push(start);
  }

  for (const start of candidateStarts) {
    const end = start + duration;
    if (end > maxEnd) continue;

    const overlaps = dayIntervals.some((iv) => start < iv.end && end > iv.start);
    if (!overlaps) {
      suggestions.push({
        startTime: minutesToTime(start),
        endTime: minutesToTime(end),
      });
      if (suggestions.length >= 4) break;
    }
  }

  return suggestions;
}
