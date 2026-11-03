import React from 'react';
import { ClassItem } from '../types/timetable';
import { formatTime12h } from '../lib/clashDetector';
import { Clock, MapPin, User, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';

interface UpcomingLectureCardProps {
  currentClass: ClassItem | null;
  nextClass: ClassItem | null;
  progressPercent: number;
  minutesRemainingInCurrent: number;
  minutesUntilNext: number;
  onSelectClass: (c: ClassItem) => void;
}

export const UpcomingLectureCard: React.FC<UpcomingLectureCardProps> = ({
  currentClass,
  nextClass,
  progressPercent,
  minutesRemainingInCurrent,
  minutesUntilNext,
  onSelectClass,
}) => {
  if (!currentClass && !nextClass) {
    return null;
  }

  if (currentClass) {
    return (
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-5 shadow-lg border border-indigo-700/50 relative overflow-hidden mb-6">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/20 to-transparent pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white shadow-xs animate-pulse">
                NOW IN SESSION
              </span>
              <span className="text-xs text-indigo-200">
                Ends in {minutesRemainingInCurrent} min
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight truncate">
              {currentClass.courseCode}: {currentClass.courseTitle}
            </h2>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-bold text-indigo-100">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 stroke-[2.5] text-indigo-300" />
                {formatTime12h(currentClass.startTime)} – {formatTime12h(currentClass.endTime)}
              </span>
              {currentClass.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 stroke-[2.5] text-indigo-300" />
                  {currentClass.location}
                </span>
              )}
              {currentClass.instructor && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 stroke-[2.5] text-indigo-300" />
                  {currentClass.instructor}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:items-end gap-2 shrink-0">
            <button
              onClick={() => onSelectClass(currentClass)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-white text-indigo-900 text-xs font-bold hover:bg-indigo-50 shadow transition active:scale-95"
            >
              <span>Class Details</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Live progress bar */}
        <div className="mt-4 pt-3 border-t border-indigo-700/60">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-200 mb-1">
            <span>Lecture Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-indigo-950/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-1000 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (nextClass) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border-2 border-slate-200 dark:border-slate-800 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                Next Up Today
              </span>
              <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                Starts in {minutesUntilNext} min ({formatTime12h(nextClass.startTime)})
              </span>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white truncate">
              {nextClass.courseCode}: {nextClass.courseTitle}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
              {nextClass.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {nextClass.location}
                </span>
              )}
              {nextClass.instructor && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {nextClass.instructor}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onSelectClass(nextClass)}
          className="self-start sm:self-center inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 px-3.5 py-2 rounded-xl transition"
        >
          <span>View</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return null;
};
