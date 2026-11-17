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
  timeToMinutes,
  minutesToTime,
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
  FileText,
  Calendar,
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
  isAdmin: boolean;
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
  isAdmin,
}) => {
  const baseDays = showWeekends ? DAYS_OF_WEEK : WORKDAYS;
  const days =
    editingClass && !baseDays.includes(editingClass.dayOfWeek)
      ? DAYS_OF_WEEK
      : baseDays;

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

  useEffect(() => {
    if (editingClass) {
      setCourseCode(editingClass.courseCode);
      setCourseTitle(editingClass.courseTitle);
      setDayOfWeek(editingClass.dayOfWeek);
      setStartTime(editingClass.startTime);
      setEndTime(editingClass.endTime === '24:00' ? '23:59' : editingClass.endTime);
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

      const startMinutes = timeToMinutes(initialStartTime);
      const endMinutes = Math.min(23 * 60 + 59, startMinutes + 60);
      setEndTime(minutesToTime(endMinutes));

      setLocation('');
      setInstructor('');
      setColor(COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)].hex);
      setNotes('');
      setConfirmDelete(false);
    }
  }, [editingClass, initialDay, initialStartTime, isOpen]);

  const clashResult = useMemo(() => {
    if (!isAdmin) return { hasClash: false, conflictingClasses: [] };
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
  }, [isAdmin, dayOfWeek, startTime, endTime, courseCode, courseTitle, allClasses, editingClass]);

  const boundaryCheck = useMemo(() => {
    return validateTimetableBounds(startTime, endTime);
  }, [startTime, endTime]);

  if (!isOpen) return null;

  // Read-only details modal for non-admin viewers
  if (!isAdmin && editingClass) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
        <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
                style={{ backgroundColor: editingClass.color || COLOR_PALETTES[0].hex }}
              >
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {editingClass.courseCode}
                </span>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                  {editingClass.courseTitle}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-3.5 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 font-bold">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>{editingClass.dayOfWeek}</span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 font-bold">
              <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>
                {formatTime12h(editingClass.startTime)} – {formatTime12h(editingClass.endTime)}
              </span>
            </div>

            {editingClass.location && (
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 font-bold">
                <MapPin className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{editingClass.location}</span>
              </div>
            )}

            {editingClass.instructor && (
              <div className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200 font-bold">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>{editingClass.instructor}</span>
              </div>
            )}

            {editingClass.notes && (
              <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-xl text-slate-600 dark:text-slate-300 font-medium">
                <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{editingClass.notes}</span>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (clashResult.hasClash || !boundaryCheck.isValid || !courseCode.trim() || !courseTitle.trim()) {
      return;
    }

    onSave(
      {
        visibility: 'shared',
        courseCode: courseCode.trim().toUpperCase().slice(0, 30),
        courseTitle: courseTitle.trim().slice(0, 100),
        dayOfWeek,
        startTime,
        endTime,
        location: location.trim().slice(0, 100),
        instructor: instructor.trim().slice(0, 80),
        color,
        notes: notes.trim().slice(0, 500),
      },
      editingClass?.id
    );
    onClose();
  };

  const handleApplySuggestion = (s: { startTime: string; endTime: string }) => {
    setStartTime(s.startTime);
    setEndTime(s.endTime === '24:00' ? '23:59' : s.endTime);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {editingClass ? 'Edit Scheduled Lecture' : 'Schedule New Class'}
              </h2>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Full 24-hour scheduling with real-time clash prevention
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
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>No scheduling conflicts detected. This slot is clear!</span>
            </div>
          )}

          {/* Course Code & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Course Code *
              </label>
              <input
                type="text"
                required
                maxLength={30}
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                placeholder="e.g. CS101"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold uppercase text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Course / Subject Title *
              </label>
              <input
                type="text"
                required
                maxLength={100}
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="e.g. Operating Systems & Architecture"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Day Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Day of Week *
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {days.map((day) => (
                <button
                  type="button"
                  key={day}
                  onClick={() => setDayOfWeek(day)}
                  className={`py-2 px-2 rounded-xl text-xs font-black uppercase tracking-wide transition ${
                    dayOfWeek === day
                      ? 'bg-[#0B2559] text-white shadow-sm ring-2 ring-indigo-500'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-950/60'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* 24-Hour Time Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Start Time *
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                End Time *
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Location & Instructor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
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
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Color Tag Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Class Notes & Preparation (Optional)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bring lab coat, project presentation slides, or calculator..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            {editingClass && onDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                    Confirm delete?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(editingClass.id);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition"
                  >
                    Yes, Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition"
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
                className="px-4 py-2 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={clashResult.hasClash || !boundaryCheck.isValid}
                className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition active:scale-95 ${
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
