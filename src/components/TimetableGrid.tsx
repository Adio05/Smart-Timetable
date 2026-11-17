import React, { useEffect, useRef } from 'react';
import {
  ClassItem,
  DayOfWeek,
  WORKDAYS,
  DAYS_OF_WEEK,
  TIMETABLE_HOURS,
  COLOR_PALETTES,
} from '../types/timetable';
import {
  timeToMinutes,
  formatTime12h,
  TIMETABLE_START_MINUTES,
  TIMETABLE_END_MINUTES,
} from '../lib/clashDetector';
import { getCurrentDayOfWeek } from '../lib/notifications';
import { MapPin, User, Plus } from 'lucide-react';

interface TimetableGridProps {
  classes: ClassItem[];
  showWeekends: boolean;
  isAdmin: boolean;
  onSelectClass: (c: ClassItem) => void;
  onAddClassAtSlot: (day: DayOfWeek, startTime: string) => void;
}

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  classes,
  showWeekends,
  isAdmin,
  onSelectClass,
  onAddClassAtSlot,
}) => {
  const activeDays = showWeekends ? DAYS_OF_WEEK : WORKDAYS;
  const currentDay = getCurrentDayOfWeek();
  const scrollRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const totalHours = 24;
  const hourHeightPx = 68;
  const totalGridHeightPx = totalHours * hourHeightPx;

  // Scroll to 8:00 AM on initial mount for immediate daytime focus across the 24h grid
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * hourHeightPx;
    }
  }, []);

  const getPositionProps = (startTime: string, endTime: string) => {
    const startMin = Math.max(TIMETABLE_START_MINUTES, timeToMinutes(startTime));
    const endMin = Math.min(TIMETABLE_END_MINUTES, timeToMinutes(endTime));
    const totalRange = TIMETABLE_END_MINUTES - TIMETABLE_START_MINUTES;

    const topPercent = ((startMin - TIMETABLE_START_MINUTES) / totalRange) * 100;
    const heightPercent = Math.max(((endMin - startMin) / totalRange) * 100, 2.2);

    return {
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
    };
  };

  const getColorToken = (colorHex?: string) => {
    const found = COLOR_PALETTES.find((p) => p.hex.toLowerCase() === colorHex?.toLowerCase());
    return found || COLOR_PALETTES[0];
  };

  const hourRows = TIMETABLE_HOURS.slice(0, 24);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header Legend */}
      <div className="p-4 border-b-2 border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
            Weekly Schedule Grid
          </h2>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active Session</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span>Scheduled</span>
          </div>
        </div>
      </div>

      {/* Scrollable 24-hour Grid */}
      <div ref={scrollRef} className="overflow-auto max-h-[75vh]">
        <div className="min-w-[780px]">
          {/* Column Headers (Days) */}
          <div
            className="grid border-b-2 border-[#071A40] dark:border-slate-700 bg-[#0B2559] sticky top-0 z-30"
            style={{
              gridTemplateColumns: `88px repeat(${activeDays.length}, minmax(0, 1fr))`,
            }}
          >
            <div className="py-3.5 px-2 text-center text-xs font-black uppercase tracking-wider bg-[#071A40] text-indigo-100 border-r-2 border-indigo-800/70 flex items-center justify-center">
              Time
            </div>
            {activeDays.map((day) => {
              const isToday = day === currentDay;
              const dayClassesCount = classes.filter((c) => c.dayOfWeek === day).length;
              return (
                <div
                  key={day}
                  className={`py-3.5 px-2 text-center border-r-2 border-indigo-800/70 last:border-r-0 transition-colors ${
                    isToday
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#0B2559] text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs font-black tracking-wider uppercase text-white">
                      {day}
                    </span>
                    {isToday && (
                      <span className="px-1.5 py-0.5 text-[10px] font-black bg-white text-indigo-700 rounded-md shadow-xs">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[11px] font-extrabold ${
                      isToday ? 'text-indigo-100' : 'text-indigo-200'
                    }`}
                  >
                    {dayClassesCount} {dayClassesCount === 1 ? 'class' : 'classes'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Grid Body */}
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `88px repeat(${activeDays.length}, minmax(0, 1fr))`,
            }}
          >
            {/* Time Labels Column */}
            <div
              className="relative border-r-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 select-none"
              style={{ height: `${totalGridHeightPx}px` }}
            >
              {hourRows.map((slot) => (
                <div
                  key={slot.hour}
                  style={{ height: `${hourHeightPx}px` }}
                  className="border-b-2 border-slate-200 dark:border-slate-800 p-2 text-right text-xs font-extrabold text-slate-700 dark:text-slate-300 relative"
                >
                  <span className="relative -top-2.5 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                    {slot.label}
                  </span>
                </div>
              ))}
              <div className="absolute bottom-1 right-2 text-[10px] font-extrabold text-slate-500 dark:text-slate-400">
                12:00 AM
              </div>
            </div>

            {/* Day Columns */}
            {activeDays.map((day) => {
              const isToday = day === currentDay;
              const dayClasses = classes.filter((c) => c.dayOfWeek === day);

              return (
                <div
                  key={day}
                  className={`relative border-r-2 border-slate-200 dark:border-slate-800 last:border-r-0 ${
                    isToday ? 'bg-indigo-50/25 dark:bg-indigo-950/20' : ''
                  }`}
                  style={{ height: `${totalGridHeightPx}px` }}
                >
                  {/* Solid Grid Hour Lines & Admin Slot Click Overlay */}
                  {hourRows.map((slot) => (
                    <div
                      key={slot.hour}
                      onClick={() => {
                        if (isAdmin) {
                          onAddClassAtSlot(day, slot.time24);
                        }
                      }}
                      style={{ height: `${hourHeightPx}px` }}
                      className={`border-b-2 border-slate-200 dark:border-slate-800 relative transition-colors ${
                        isAdmin
                          ? 'group cursor-pointer hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40'
                          : ''
                      }`}
                    >
                      {isAdmin && (
                        <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full shadow-xs border-2 border-indigo-200 dark:border-indigo-700">
                            <Plus className="w-3 h-3 stroke-[2.5]" /> Add
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Scheduled Class Blocks */}
                  {dayClasses.map((item) => {
                    const pos = getPositionProps(item.startTime, item.endTime);
                    const colorToken = getColorToken(item.color);
                    const startMin = timeToMinutes(item.startTime);
                    const endMin = timeToMinutes(item.endTime);
                    const durationMins = endMin - startMin;
                    const isActiveNow =
                      isToday && currentMinutes >= startMin && currentMinutes < endMin;

                    return (
                      <div
                        key={item.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClass(item);
                        }}
                        style={{
                          top: pos.top,
                          height: pos.height,
                        }}
                        className={`absolute left-1 right-1 rounded-xl p-2 cursor-pointer transition-all hover:scale-[1.01] hover:z-20 shadow-md z-10 overflow-hidden flex flex-col justify-between border-2 ${colorToken.border} ${colorToken.bg} ${
                          isActiveNow ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                        }`}
                      >
                        <div className="min-h-0">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="text-[11px] font-black tracking-tight px-1.5 py-0.5 rounded-md truncate shadow-xs"
                              style={{ backgroundColor: colorToken.hex, color: '#fff' }}
                            >
                              {item.courseCode}
                            </span>
                            <span className="text-[10px] font-extrabold text-slate-700 dark:text-slate-200 whitespace-nowrap">
                              {formatTime12h(item.startTime)}
                            </span>
                          </div>
                          <h4 className="text-xs font-extrabold text-slate-950 dark:text-white mt-1 leading-tight line-clamp-2">
                            {item.courseTitle}
                          </h4>
                        </div>

                        {durationMins >= 45 && (
                          <div className="mt-1 space-y-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            {item.location && (
                              <div className="flex items-center gap-1 truncate">
                                <MapPin className="w-2.5 h-2.5 shrink-0 stroke-[2.5]" />
                                <span className="truncate">{item.location}</span>
                              </div>
                            )}
                            {item.instructor && durationMins >= 60 && (
                              <div className="flex items-center gap-1 truncate">
                                <User className="w-2.5 h-2.5 shrink-0 stroke-[2.5]" />
                                <span className="truncate">{item.instructor}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Current Time Red Line Indicator */}
                  {isToday && (
                    <div
                      style={{
                        top: `${((currentMinutes - TIMETABLE_START_MINUTES) / (TIMETABLE_END_MINUTES - TIMETABLE_START_MINUTES)) * totalGridHeightPx}px`,
                      }}
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shadow-sm" />
                      <div className="h-[2px] w-full bg-rose-500 shadow-xs" />
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
