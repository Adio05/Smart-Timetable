import React from 'react';
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
import { MapPin, User, Plus } from 'lucide-react';

interface TimetableGridProps {
  classes: ClassItem[];
  showWeekends: boolean;
  onSelectClass: (c: ClassItem) => void;
  onAddClassAtSlot: (day: DayOfWeek, startTime: string) => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  classes,
  showWeekends,
  onSelectClass,
  onAddClassAtSlot,
}) => {
  const activeDays = showWeekends ? DAYS_OF_WEEK : WORKDAYS;
  const currentDay = getCurrentDayOfWeek();

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isWithinHours = currentMinutes >= TIMETABLE_START_MINUTES && currentMinutes <= TIMETABLE_END_MINUTES;

  // Total minutes from 9am to 4pm is 7 hours * 60 = 420 minutes
  const totalMinutes = TIMETABLE_END_MINUTES - TIMETABLE_START_MINUTES; // 420
  const hourHeightPx = 84; // 84px per 1 hour slot for clearer, bolder visual layout
  const totalGridHeightPx = 7 * hourHeightPx; // 588px

  // Calculate current time line offset
  const currentTimeTopPx = isWithinHours
    ? ((currentMinutes - TIMETABLE_START_MINUTES) / totalMinutes) * totalGridHeightPx
    : null;

  // Helper to get color style
  const getColorToken = (colorHex?: string) => {
    const found = COLOR_PALETTES.find((p) => p.hex.toLowerCase() === colorHex?.toLowerCase());
    return found || COLOR_PALETTES[0];
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Timetable Header Bar */}
      <div className="p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Weekly Schedule Grid
          </h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            9:00 AM – 4:00 PM • Click any open cell to schedule a lecture
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
            <span>Active Session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-600 shadow-xs" />
            <span>Scheduled</span>
          </div>
        </div>
      </div>

      {/* Overflow container for mobile scroll */}
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Day Headers */}
          <div className="grid grid-cols-[88px_repeat(auto-fit,minmax(120px,1fr))] border-b-2 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 sticky top-0 z-20">
            <div className="py-3.5 px-2 text-center text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 border-r-2 border-slate-200 dark:border-slate-800">
              Time
            </div>
            {activeDays.map((day) => {
              const isToday = day === currentDay;
              const countForDay = classes.filter((c) => c.dayOfWeek === day).length;
              return (
                <div
                  key={day}
                  className={`py-3.5 px-3 text-center border-r-2 border-slate-200 dark:border-slate-800 last:border-r-0 ${
                    isToday
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-200'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs font-black uppercase tracking-wide">{day}</span>
                    {isToday && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-indigo-600 text-white shadow-xs">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {countForDay} class{countForDay === 1 ? '' : 'es'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid Body */}
          <div className="relative grid grid-cols-[88px_repeat(auto-fit,minmax(120px,1fr))]">
            {/* Time labels column */}
            <div className="relative border-r-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 select-none">
              {TIMETABLE_HOURS.slice(0, 7).map((slot) => (
                <div
                  key={slot.hour}
                  style={{ height: `${hourHeightPx}px` }}
                  className="border-b-2 border-slate-200 dark:border-slate-800 p-2 text-right text-xs font-extrabold text-slate-700 dark:text-slate-300 relative"
                >
                  <span className="relative -top-3 inline-block bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 font-extrabold text-[11px] shadow-xs">
                    {slot.label}
                  </span>
                </div>
              ))}
              {/* Final 4:00 PM boundary label */}
              <div className="p-2 text-right text-xs font-extrabold text-slate-700 dark:text-slate-300 relative">
                <span className="relative -top-3 inline-block bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 font-extrabold text-[11px] shadow-xs">
                  4:00 PM
                </span>
              </div>
            </div>

            {/* Days Columns */}
            {activeDays.map((day) => {
              const dayClasses = classes.filter((c) => c.dayOfWeek === day);
              const isToday = day === currentDay;

              return (
                <div
                  key={day}
                  style={{ height: `${totalGridHeightPx}px` }}
                  className={`relative border-r-2 border-slate-200 dark:border-slate-800 last:border-r-0 ${
                    isToday ? 'bg-indigo-50/25 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  {/* Hour background guide lines & clickable slots (solid clean lines, NO dashed/dotted lines) */}
                  {TIMETABLE_HOURS.slice(0, 7).map((slot) => (
                    <div
                      key={slot.hour}
                      style={{ height: `${hourHeightPx}px` }}
                      onClick={() => onAddClassAtSlot(day, slot.time24)}
                      className="border-b-2 border-slate-200 dark:border-slate-800 relative group cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 transition-colors"
                      title={`Click to add class on ${day} at ${slot.label}`}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 pointer-events-none transition-opacity bg-indigo-50/30 dark:bg-indigo-950/20">
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Add Class</span>
                      </div>
                    </div>
                  ))}

                  {/* Render Scheduled Class Cards (Bolder typography, solid 2px borders, vibrant badges) */}
                  {dayClasses.map((item) => {
                    const startMin = timeToMinutes(item.startTime);
                    const endMin = timeToMinutes(item.endTime);
                    const duration = endMin - startMin;

                    // Calculate top and height relative to 9:00 AM (540 mins)
                    const topPercent = ((startMin - TIMETABLE_START_MINUTES) / totalMinutes) * 100;
                    const heightPercent = (duration / totalMinutes) * 100;
                    const colorToken = getColorToken(item.color);

                    const isClassActive =
                      isToday && currentMinutes >= startMin && currentMinutes < endMin;

                    return (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClass(item);
                        }}
                        style={{
                          top: `${topPercent}%`,
                          height: `${Math.max(heightPercent, 8)}%`,
                        }}
                        className={`absolute left-1 right-1 rounded-xl p-2.5 transition-all cursor-pointer shadow-md hover:shadow-lg hover:scale-[1.01] z-10 flex flex-col justify-between overflow-hidden border-2 ${
                          colorToken.border
                        } ${colorToken.bg} ${
                          isClassActive ? 'ring-3 ring-emerald-500 ring-offset-1' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xs font-black text-slate-950 dark:text-white tracking-tight truncate">
                              {item.courseCode}
                            </span>
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
                              {formatTime12h(item.startTime)}
                            </span>
                          </div>
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-tight">
                            {item.courseTitle}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1.5 pt-1 border-t border-slate-300/40 dark:border-slate-700/40">
                          {item.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 stroke-[2.5] text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </span>
                          )}
                          {item.instructor && (
                            <span className="hidden sm:flex items-center gap-1 truncate">
                              <User className="w-3 h-3 stroke-[2.5] text-indigo-600 dark:text-indigo-400 shrink-0" />
                              <span className="truncate">{item.instructor}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Current Time Indicator on today's column */}
                  {isToday && currentTimeTopPx !== null && (
                    <div
                      style={{ top: `${currentTimeTopPx}px` }}
                      className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                    >
                      <div className="w-3 h-3 rounded-full bg-rose-500 -ml-1.5 ring-2 ring-white dark:ring-slate-900 shadow-md" />
                      <div className="flex-1 border-t-2 border-rose-500 shadow-xs" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
