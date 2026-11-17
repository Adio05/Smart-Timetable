import assert from 'node:assert/strict';
import { detectClash, getClassSegmentsOnDay, getDurationMinutes, validateTimetableBounds } from '../src/lib/clashDetector.ts';
import type { ClassItem } from '../src/types/timetable.ts';

const classItem = (overrides: Partial<ClassItem>): ClassItem => ({
  id: 'class-1', userId: 'test', courseCode: 'TEST', courseTitle: 'Test class', dayOfWeek: 'Monday',
  startTime: '09:00', endTime: '10:00', location: '', instructor: '', color: '#000', ...overrides,
});

assert.equal(validateTimetableBounds('00:00', '23:30').isValid, true, 'full-day time range is accepted');
assert.equal(validateTimetableBounds('22:00', '01:00').isValid, true, 'overnight time range is accepted');
assert.equal(getDurationMinutes('22:00', '01:00'), 180, 'overnight duration crosses midnight');

const overnight = classItem({ id: 'overnight', dayOfWeek: 'Monday', startTime: '22:00', endTime: '02:00' });
assert.deepEqual(getClassSegmentsOnDay(overnight, 'Monday'), [{ start: 1320, end: 1440 }]);
assert.deepEqual(getClassSegmentsOnDay(overnight, 'Tuesday'), [{ start: 0, end: 120 }]);
assert.equal(detectClash({ dayOfWeek: 'Tuesday', startTime: '01:00', endTime: '03:00' }, [overnight]).hasClash, true, 'next-day clash is detected');
assert.equal(detectClash({ dayOfWeek: 'Tuesday', startTime: '02:00', endTime: '03:00' }, [overnight]).hasClash, false, 'touching boundaries do not clash');

const recurring = classItem({ id: 'recurring', dayOfWeek: 'Monday', daysOfWeek: ['Monday', 'Wednesday'], startTime: '14:00', endTime: '16:00' });
assert.equal(detectClash({ dayOfWeek: 'Wednesday', startTime: '15:00', endTime: '17:00' }, [recurring]).hasClash, true, 'multi-day recurrence clashes on every selected day');
assert.equal(detectClash({ dayOfWeek: 'Tuesday', startTime: '15:00', endTime: '17:00' }, [recurring]).hasClash, false, 'multi-day recurrence does not spill to unrelated days');

console.log('Scheduling tests passed');
