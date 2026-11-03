import React, { useState } from 'react';
import {
  ClassItem,
  DayOfWeek,
  WORKDAYS,
  DAYS_OF_WEEK,
  TIMETABLE_HOURS,
  COLOR_PALETTES,
} from '../types/timetable';
import {
  formatTime12h,
  timeToMinutes,
  TIMETABLE_START_MINUTES,
  TIMETABLE_END_MINUTES,
} from '../lib/clashDetector';
import { getCurrentDayOfWeek } from '../lib/notifications';
import { Clock, MapPin, User, FileText, Plus, CheckCircle2 } from 'lucide-react';

interface DayViewProps {
  classes: ClassItem[];
  showWeekends: boolean;
  onSelectClass: (c: ClassItem) => void;
  onAddClassAtSlot: (day: DayOfWeek, startTime: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  classes,
  showWeekends,
  onSelectClass,
  onAddClassAtSlot,
}) => {
  const activeDays = showWeekends ? DAYS_OF_WEEK : WORKDAYS;
  const currentDay = getCurrentDayOfWeek();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(
    activeDays.includes(currentDay) ? currentDay : 'Monday'
  );

  const dayClasses = classes
    .filter((c) => c.dayOfWeek === selectedDay)
    .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isToday = selectedDay === currentDay;

  // Calculate total class hours
  const totalClassMinutes = dayClasses.reduce((acc, c) => {
    return acc + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime));
  }, 0);
  const totalHours = (totalClassMinutes / 60).toFixed(1);

  const getColorToken = (colorHex?: string) => {
    const found = COLOR_PALETTES.find((p) => p.hex.toLowerCase() === colorHex?.toLowerCase());
    return found || COLOR_PALETTES[0];
  };

  return (
    <div className="space-y-6">
      {/* Day Selector Pill Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
        {activeDays.map((day) => {
          const isSelected = day === selectedDay;
          const isCurrentToday = day === currentDay;
          const dayCount = classes.filter((c) => c.dayOfWeek === day).length;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>{day}</span>
              {isCurrentToday && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {dayCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day Header Summary */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {selectedDay}'s Lecture Schedule
            </h2>
            {isToday && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500 text-white">
                TODAY
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {dayClasses.length} lectures scheduled • {totalHours} total class hours between 9:00 AM and 4:00 PM
          </p>
        </div>

        <button
          onClick={() => onAddClassAtSlot(selectedDay, '09:00')}
          className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-xs px-3.5 py-2 rounded-xl transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Lecture on {selectedDay}</span>
        </button>
      </div>

      {/* Hourly Timeline Stack */}
      <div className="space-y-3">
        {dayClasses.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              No classes scheduled for {selectedDay}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Your 9am-4pm schedule is completely open on this day. Click below to add a lecture.
            </p>
            <button
              onClick={() => onAddClassAtSlot(selectedDay, '09:00')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule 9:00 AM Class</span>
            </button>
          </div>
        ) : (
          dayClasses.map((item) => {
            const startMin = timeToMinutes(item.startTime);
            const endMin = timeToMinutes(item.endTime);
            const isOngoing = isToday && currentMinutes >= startMin && currentMinutes < endMin;
            const isPast = isToday && currentMinutes >= endMin;
            const colorToken = getColorToken(item.color);

            return (
              <div
                key={item.id}
                onClick={() => onSelectClass(item)}
                className={`relative bg-white dark:bg-slate-900 rounded-2xl p-5 border transition-all cursor-pointer shadow-xs hover:shadow-md ${
                  isOngoing
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/10'
                    : isPast
                    ? 'border-slate-200 dark:border-slate-800 opacity-80'
                    : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Time Box */}
                    <div className="w-24 text-left sm:text-right shrink-0">
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatTime12h(item.startTime)}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatTime12h(item.endTime)}
                      </div>
                      <span className="inline-block mt-1 text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {endMin - startMin} mins
                      </span>
                    </div>

                    {/* Color bar */}
                    <div
                      className="w-1.5 self-stretch rounded-full shrink-0"
                      style={{ backgroundColor: colorToken.hex }}
                    />

                    {/* Class Details */}
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {item.courseCode}
                        </span>
                        {isOngoing && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                            IN SESSION
                          </span>
                        )}
                        {isPast && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Completed
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                        {item.courseTitle}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {item.location}
                          </span>
                        )}
                        {item.instructor && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {item.instructor}
                          </span>
                        )}
                      </div>

                      {item.notes && (
                        <div className="flex items-start gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl mt-2">
                          <FileText className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                          <span className="line-clamp-2">{item.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                      Edit Class →
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
