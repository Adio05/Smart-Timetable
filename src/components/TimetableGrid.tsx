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
import { Clock, MapPin, User, AlertTriangle, Plus } from 'lucide-react';

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
  const hourHeightPx = 80; // 80px per 1 hour slot
  const totalGridHeightPx = 7 * hourHeightPx; // 560px

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
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
      {/* Timetable Header Bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Weekly Schedule Grid
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Official class hours: 9:00 AM – 4:00 PM • Click any open cell to schedule a lecture
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Active Session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Scheduled</span>
          </div>
        </div>
      </div>

      {/* Overflow container for mobile scroll */}
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Day Headers */}
          <div className="grid grid-cols-[80px_repeat(auto-fit,minmax(120px,1fr))] border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 sticky top-0 z-20">
            <div className="py-3 px-2 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400 border-r border-slate-200 dark:border-slate-800">
              Time
            </div>
            {activeDays.map((day) => {
              const isToday = day === currentDay;
              const countForDay = classes.filter((c) => c.dayOfWeek === day).length;
              return (
                <div
                  key={day}
                  className={`py-3 px-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${
                    isToday
                      ? 'bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 font-semibold'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs uppercase tracking-wide">{day}</span>
                    {isToday && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-600 text-white">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-normal text-slate-400 dark:text-slate-500">
                    {countForDay} class{countForDay === 1 ? '' : 'es'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid Body */}
          <div className="relative grid grid-cols-[80px_repeat(auto-fit,minmax(120px,1fr))]">
            {/* Time labels column */}
            <div className="relative border-r border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40 select-none">
              {TIMETABLE_HOURS.slice(0, 7).map((slot, index) => (
                <div
                  key={slot.hour}
                  style={{ height: `${hourHeightPx}px` }}
                  className="border-b border-slate-200/60 dark:border-slate-800/60 p-2 text-right text-xs font-semibold text-slate-400 dark:text-slate-500 relative"
                >
                  <span className="relative -top-3 inline-block bg-white dark:bg-slate-900 px-1 rounded text-[11px]">
                    {slot.label}
                  </span>
                </div>
              ))}
              {/* Final 4:00 PM boundary label */}
              <div className="p-2 text-right text-xs font-semibold text-slate-400 relative">
                <span className="relative -top-3 inline-block bg-white dark:bg-slate-900 px-1 rounded text-[11px]">
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
                  className={`relative border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${
                    isToday ? 'bg-indigo-50/15 dark:bg-indigo-950/10' : ''
                  }`}
                >
                  {/* Hour background guide lines & clickable slots */}
                  {TIMETABLE_HOURS.slice(0, 7).map((slot) => (
                    <div
                      key={slot.hour}
                      style={{ height: `${hourHeightPx}px` }}
                      onClick={() => onAddClassAtSlot(day, slot.time24)}
                      className="border-b border-slate-200/50 dark:border-slate-800/50 relative group cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition-colors"
                      title={`Click to add class on ${day} at ${slot.label}`}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 pointer-events-none transition-opacity">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Class</span>
                      </div>
                      {/* Half-hour dashed line */}
                      <div className="absolute top-1/2 left-0 right-0 border-b border-dashed border-slate-100 dark:border-slate-850 pointer-events-none" />
                    </div>
                  ))}

                  {/* Render Scheduled Class Cards */}
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
                          height: `${Math.max(heightPercent, 7.5)}%`,
                        }}
                        className={`absolute left-1 right-1 rounded-xl p-2 sm:p-2.5 transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.01] z-10 flex flex-col justify-between overflow-hidden border ${
                          colorToken.border
                        } ${colorToken.bg} ${
                          isClassActive ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {item.courseCode}
                            </span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 shrink-0">
                              {formatTime12h(item.startTime)}
                            </span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 line-clamp-1 leading-tight">
                            {item.courseTitle}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 text-[10px] text-slate-600 dark:text-slate-400 mt-1">
                          {item.location && (
                            <span className="flex items-center gap-0.5 truncate">
                              <MapPin className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{item.location}</span>
                            </span>
                          )}
                          {item.instructor && (
                            <span className="hidden sm:flex items-center gap-0.5 truncate">
                              <User className="w-2.5 h-2.5 shrink-0" />
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
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1 ring-2 ring-white dark:ring-slate-900" />
                      <div className="flex-1 border-t-2 border-rose-500" />
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
