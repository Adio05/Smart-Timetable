import React, { useState } from 'react';
import {
  ClassItem,
  DayOfWeek,
  WORKDAYS,
  DAYS_OF_WEEK,
  COLOR_PALETTES,
} from '../types/timetable';
import { formatTime12h, timeToMinutes } from '../lib/clashDetector';
import { Search, Clock, MapPin, User, Plus, BookOpen, Layers } from 'lucide-react';

interface AgendaViewProps {
  classes: ClassItem[];
  showWeekends: boolean;
  onSelectClass: (c: ClassItem) => void;
  onAddClass: () => void;
}

export const AgendaView: React.FC<AgendaViewProps> = ({
  classes,
  showWeekends,
  onSelectClass,
  onAddClass,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const activeDays = showWeekends ? DAYS_OF_WEEK : WORKDAYS;

  // Filter classes
  const filtered = classes.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.courseCode.toLowerCase().includes(q) ||
      c.courseTitle.toLowerCase().includes(q) ||
      (c.instructor && c.instructor.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q))
    );
  });

  // Calculate statistics
  const totalMinutes = classes.reduce((acc, c) => {
    return acc + (timeToMinutes(c.endTime) - timeToMinutes(c.startTime));
  }, 0);
  const totalWeeklyHours = (totalMinutes / 60).toFixed(1);

  // Find busiest day
  let busiestDay: string = 'None';
  let maxCount = 0;
  activeDays.forEach((day) => {
    const count = classes.filter((c) => c.dayOfWeek === day).length;
    if (count > maxCount) {
      maxCount = count;
      busiestDay = `${day} (${count})`;
    }
  });

  const getColorToken = (colorHex?: string) => {
    const found = COLOR_PALETTES.find((p) => p.hex.toLowerCase() === colorHex?.toLowerCase());
    return found || COLOR_PALETTES[0];
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {classes.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Lectures</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">
              {totalWeeklyHours} hrs
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Weekly Lecture Time</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900 dark:text-white truncate">
              {busiestDay}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Busiest Day</div>
          </div>
        </div>
      </div>

      {/* Search and Action Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search course, professor, or room..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        <button
          onClick={onAddClass}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Lecture</span>
        </button>
      </div>

      {/* Day Groupings */}
      <div className="space-y-6">
        {activeDays.map((day) => {
          const dayItems = filtered
            .filter((c) => c.dayOfWeek === day)
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

          if (searchTerm && dayItems.length === 0) {
            return null;
          }

          return (
            <div
              key={day}
              className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              <div className="p-4 bg-slate-100 dark:bg-slate-850 border-b-2 border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">{day}</h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold">
                    {dayItems.length}
                  </span>
                </div>
              </div>

              <div className="divide-y-2 divide-slate-100 dark:divide-slate-800">
                {dayItems.length === 0 ? (
                  <div className="p-4 text-center text-xs font-semibold text-slate-400">
                    No classes scheduled for {day}
                  </div>
                ) : (
                  dayItems.map((item) => {
                    const colorToken = getColorToken(item.color);
                    return (
                      <div
                        key={item.id}
                        onClick={() => onSelectClass(item)}
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start sm:items-center gap-3">
                          <div
                            className="w-2.5 h-10 rounded-full shrink-0"
                            style={{ backgroundColor: colorToken.hex }}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-slate-950 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                {item.courseCode}
                              </span>
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                                {item.courseTitle}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-300 mt-1.5">
                              {item.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 stroke-[2.5] text-indigo-600 dark:text-indigo-400" />
                                  {item.location}
                                </span>
                              )}
                              {item.instructor && (
                                <span className="flex items-center gap-1">
                                  <User className="w-3.5 h-3.5 stroke-[2.5] text-indigo-600 dark:text-indigo-400" />
                                  {item.instructor}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className="inline-flex items-center gap-1 text-xs font-black bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-3 py-1.5 rounded-lg shadow-xs">
                            <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                            {formatTime12h(item.startTime)} – {formatTime12h(item.endTime)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
