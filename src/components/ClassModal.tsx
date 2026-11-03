import React, { useState, useEffect, useMemo } from 'react';
import {
  ClassItem,
  DayOfWeek,
  WORKDAYS,
  DAYS_OF_WEEK,
  COLOR_PALETTES,
} from '../types/timetable';
import {
  detectClash,
  validateTimetableBounds,
  formatTime12h,
  minutesToTime,
  TIMETABLE_START_MINUTES,
  TIMETABLE_END_MINUTES,
} from '../lib/clashDetector';
import {
  X,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classData: Omit<ClassItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>, editId?: string) => void;
  onDelete?: (id: string) => void;
  allClasses: ClassItem[];
  editingClass?: ClassItem | null;
  initialDay?: DayOfWeek;
  initialStartTime?: string;
  showWeekends?: boolean;
}

// Generate valid time select options between 09:00 and 16:00
const TIME_OPTIONS: { value: string; label: string }[] = [];
for (let m = TIMETABLE_START_MINUTES; m <= TIMETABLE_END_MINUTES; m += 30) {
  const val = minutesToTime(m);
  TIME_OPTIONS.push({ value: val, label: formatTime12h(val) });
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  allClasses,
  editingClass,
  initialDay = 'Monday',
  initialStartTime = '09:00',
  showWeekends = false,
}) => {
  const days = showWeekends ? DAYS_OF_WEEK : WORKDAYS;

  // Form states
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(initialDay);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [instructor, setInstructor] = useState('');
  const [color, setColor] = useState(COLOR_PALETTES[0].hex);
  const [notes, setNotes] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Sync state when editingClass or initial params change
  useEffect(() => {
    if (editingClass) {
      setCourseCode(editingClass.courseCode);
      setCourseTitle(editingClass.courseTitle);
      setDayOfWeek(editingClass.dayOfWeek);
      setStartTime(editingClass.startTime);
      setEndTime(editingClass.endTime);
      setLocation(editingClass.location || '');
      setInstructor(editingClass.instructor || '');
      setColor(editingClass.color || COLOR_PALETTES[0].hex);
      setNotes(editingClass.notes || '');
      setConfirmDelete(false);
    } else {
      setCourseCode('');
      setCourseTitle('');
      setDayOfWeek(initialDay);
      setStartTime(initialStartTime);

      // Default end time is 1 hour after start time if within bounds
      const [h, m] = initialStartTime.split(':').map(Number);
      const nextHour = Math.min(16, (h || 9) + 1);
      const defEnd = `${nextHour.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
      setEndTime(defEnd > '16:00' ? '16:00' : defEnd);

      setLocation('');
      setInstructor('');
      setColor(COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)].hex);
      setNotes('');
      setConfirmDelete(false);
    }
  }, [editingClass, initialDay, initialStartTime, isOpen]);

  // Real-time Clash Detection
  const clashResult = useMemo(() => {
    return detectClash(
      {
        id: editingClass?.id,
        dayOfWeek,
        startTime,
        endTime,
        courseCode,
        courseTitle,
      },
      allClasses,
      editingClass?.id
    );
  }, [dayOfWeek, startTime, endTime, courseCode, courseTitle, allClasses, editingClass]);

  // Boundary validation
  const boundaryCheck = useMemo(() => {
    return validateTimetableBounds(startTime, endTime);
  }, [startTime, endTime]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clashResult.hasClash || !boundaryCheck.isValid || !courseCode.trim() || !courseTitle.trim()) {
      return;
    }

    onSave(
      {
        courseCode: courseCode.trim().toUpperCase(),
        courseTitle: courseTitle.trim(),
        dayOfWeek,
        startTime,
        endTime,
        location: location.trim(),
        instructor: instructor.trim(),
        color,
        notes: notes.trim(),
      },
      editingClass?.id
    );
    onClose();
  };

  const handleApplySuggestion = (s: { startTime: string; endTime: string }) => {
    setStartTime(s.startTime);
    setEndTime(s.endTime);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingClass ? 'Edit Scheduled Lecture' : 'Schedule New Class'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official Timetable (9:00 AM – 4:00 PM) with Automatic Clash Prevention
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Real-time Clash Warning Banner */}
          {clashResult.hasClash && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl space-y-2.5 text-xs text-rose-900 dark:text-rose-200 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Schedule Conflict Detected:</strong>
                  <p className="mt-0.5">{clashResult.message}</p>
                </div>
              </div>

              {/* Conflict resolution suggestions */}
              {clashResult.suggestedSlots && clashResult.suggestedSlots.length > 0 && (
                <div className="pt-2 border-t border-rose-200 dark:border-rose-800/80">
                  <div className="flex items-center gap-1 font-semibold text-rose-800 dark:text-rose-300 mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Suggested Available Slots on {dayOfWeek}:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {clashResult.suggestedSlots.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplySuggestion(s)}
                        className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-300 dark:border-rose-700 text-slate-800 dark:text-slate-200 rounded-lg text-[11px] font-semibold transition"
                      >
                        {formatTime12h(s.startTime)} – {formatTime12h(s.endTime)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Boundary validation error */}
          {!boundaryCheck.isValid && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{boundaryCheck.error}</span>
            </div>
          )}

          {/* Validated OK Banner */}
          {!clashResult.hasClash && boundaryCheck.isValid && startTime && endTime && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>No scheduling conflicts detected. This slot is clear!</span>
            </div>
          )}

          {/* Course Code & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS101"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course / Subject Title *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. Operating Systems & Architecture"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Day of Week */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Day of Week *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {days.map((day) => (
                <button
                  type="button"
                  key={day}
                  onClick={() => setDayOfWeek(day)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold transition ${
                    dayOfWeek === day
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection (09:00 - 16:00) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Time (9:00 AM - 3:30 PM) *
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {TIME_OPTIONS.slice(0, -1).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Time (Up to 4:00 PM) *
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                >
                  {TIME_OPTIONS.slice(1).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Location & Instructor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Room / Lecture Hall
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={100}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Turing Lab 304"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instructor / Lecturer
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={80}
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder="e.g. Dr. Alan Turing"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>
          </div>

          {/* Color Tag Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject Color Theme
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTES.map((p) => (
                <button
                  type="button"
                  key={p.name}
                  onClick={() => setColor(p.hex)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition active:scale-95 ${
                    color.toLowerCase() === p.hex.toLowerCase()
                      ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: p.hex }}
                  title={p.name}
                >
                  {color.toLowerCase() === p.hex.toLowerCase() && (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Class Notes & Preparation (Optional)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring lab coat, project presentation slides, or calculator..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {editingClass && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                    Confirm delete?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(editingClass.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Class</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={clashResult.hasClash || !boundaryCheck.isValid}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-md transition active:scale-95 ${
                  clashResult.hasClash || !boundaryCheck.isValid
                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingClass ? 'Save Changes' : 'Schedule Class'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
