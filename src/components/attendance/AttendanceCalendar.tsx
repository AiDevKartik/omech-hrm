/**
 * Rich Attendance Calendar
 * Flagship interactive scheduling component supporting:
 * - Month / Week / Day views
 * - Company-wide heatmap mode vs Single-worker mode
 * - Overlay filters (Holidays, Weekly Offs, Leaves)
 * - Click to inspect/edit punch in DayDetailModal
 * - Date range selection for bulk marking
 */

import React, { useState } from 'react';
import {
  Employee,
  AttendanceRecord,
  Holiday,
  WeeklyOffRule,
  Shift,
} from '../../types';
import { DayDetailModal } from './DayDetailModal';
import { BulkMarkModal } from './BulkMarkModal';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Filter,
  Check,
  Clock,
  AlertTriangle,
  Flame,
  Layers,
  Sparkles,
} from 'lucide-react';

interface AttendanceCalendarProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  holidays: Holiday[];
  weeklyOffs: WeeklyOffRule[];
  shifts: Shift[];
}

type CalendarViewMode = 'month' | 'week' | 'day';
type DisplayMode = 'company' | 'employee';

export function AttendanceCalendar({
  employees,
  attendanceRecords,
  holidays,
  weeklyOffs,
  shifts,
}: AttendanceCalendarProps) {
  // Calendar Navigation State
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(8); // 8 = August (1-indexed)
  const [selectedDay, setSelectedDay] = useState<number>(5); // 5th

  // Views & Mode
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('company');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number>(employees[0]?.id || 1);

  // Overlay Toggles
  const [showHolidays, setShowHolidays] = useState(true);
  const [showWeeklyOffs, setShowWeeklyOffs] = useState(true);
  const [showLeaves, setShowLeaves] = useState(true);

  // Selection for Range Actions / Bulk Mark
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangeEnd, setRangeEnd] = useState<string | null>(null);
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Detail Modal State
  const [activeModalData, setActiveModalData] = useState<{
    date: string;
    record: AttendanceRecord | null;
    employee: Employee | null;
  } | null>(null);

  // Helper: Days in current month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sunday

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const jumpToToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9); // September 2026 in prototype context
    setSelectedDay(5);
  };

  const formatDateStr = (year: number, month: number, day: number) => {
    const m = month < 10 ? `0${month}` : `${month}`;
    const d = day < 10 ? `0${day}` : `${day}`;
    return `${year}-${m}-${d}`;
  };

  // Day Cell click handler
  const handleCellClick = (dateStr: string) => {
    if (isSelectingRange) {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(dateStr);
        setRangeEnd(null);
      } else {
        if (dateStr < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(dateStr);
        } else {
          setRangeEnd(dateStr);
        }
      }
      return;
    }

    // Open detail modal
    if (displayMode === 'employee') {
      const emp = employees.find((e) => e.id === selectedEmployeeId) || employees[0];
      const rec = attendanceRecords.find(
        (r) => r.employeeId === selectedEmployeeId && r.date === dateStr
      ) || null;
      setActiveModalData({ date: dateStr, record: rec, employee: emp });
    } else {
      // In company mode, pick the first record or open summary for the date
      const rec = attendanceRecords.find((r) => r.date === dateStr) || null;
      const emp = rec ? employees.find((e) => e.id === rec.employeeId) || null : null;
      setActiveModalData({ date: dateStr, record: rec, employee: emp });
    }
  };

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const employeeShift = shifts.find((s) => s.id === selectedEmployee?.shiftId);

  return (
    <div className="space-y-4">
      {/* Calendar Control Bar */}
      <div className="bg-stone-950 border border-stone-800 p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Navigator & Today */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-stone-900 border border-stone-700">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-stone-800 text-stone-300"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 py-1 font-display font-bold text-sm text-stone-100 tracking-wide min-w-[140px] text-center">
              {monthNames[currentMonth - 1]} {currentYear}
            </div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-stone-800 text-stone-300"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={jumpToToday}
            className="px-2.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold uppercase tracking-wider border border-stone-700"
          >
            Today (Sep 5)
          </button>
        </div>

        {/* Center: Mode Toggles (Company Heatmap vs Worker) & View Mode */}
        <div className="flex items-center gap-2">
          {/* Company Heatmap vs Single Worker */}
          <div className="flex bg-stone-900 border border-stone-800 p-0.5">
            <button
              onClick={() => setDisplayMode('company')}
              className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                displayMode === 'company'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Company Heatmap
            </button>
            <button
              onClick={() => setDisplayMode('employee')}
              className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider transition ${
                displayMode === 'employee'
                  ? 'bg-amber-500 text-stone-950 shadow-xs'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Worker Calendar
            </button>
          </div>

          {/* If Single Worker, Worker Selector */}
          {displayMode === 'employee' && (
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              className="bg-stone-900 border border-stone-700 text-xs text-stone-200 p-1.5 font-medium max-w-[200px]"
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employeeCode})
                </option>
              ))}
            </select>
          )}

          {/* Month / Week / Day view toggle */}
          <div className="hidden sm:flex bg-stone-900 border border-stone-800 p-0.5">
            {(['month', 'week', 'day'] as CalendarViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-2.5 py-1 text-xs uppercase font-mono transition ${
                  viewMode === v
                    ? 'bg-stone-800 text-stone-100 font-bold border border-stone-700'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Range Selection & Bulk Mark Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsSelectingRange(!isSelectingRange);
              if (isSelectingRange) {
                setRangeStart(null);
                setRangeEnd(null);
              }
            }}
            className={`px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider border flex items-center gap-1.5 transition ${
              isSelectingRange
                ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border-stone-700'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>{isSelectingRange ? 'Selecting Range...' : 'Range Select'}</span>
          </button>

          {rangeStart && rangeEnd && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase tracking-wider animate-pulse"
            >
              Bulk Mark ({rangeStart.slice(5)} to {rangeEnd.slice(5)})
            </button>
          )}
        </div>
      </div>

      {/* Layer / Overlay Filter Bar */}
      <div className="bg-stone-950/60 border border-stone-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4">
          <span className="text-stone-500 uppercase font-mono text-[10px] flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            <span>Overlays:</span>
          </span>

          <label className="flex items-center gap-1.5 cursor-pointer text-stone-300 select-none">
            <input
              type="checkbox"
              checked={showHolidays}
              onChange={(e) => setShowHolidays(e.target.checked)}
              className="rounded-none bg-stone-900 border-stone-700 text-amber-500 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Plant Holidays</span>
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-stone-300 select-none">
            <input
              type="checkbox"
              checked={showWeeklyOffs}
              onChange={(e) => setShowWeeklyOffs(e.target.checked)}
              className="rounded-none bg-stone-900 border-stone-700 text-amber-500 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-stone-500" />
              <span>Weekly Offs</span>
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-stone-300 select-none">
            <input
              type="checkbox"
              checked={showLeaves}
              onChange={(e) => setShowLeaves(e.target.checked)}
              className="rounded-none bg-stone-900 border-stone-700 text-amber-500 focus:ring-0"
            />
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Approved Leaves</span>
            </span>
          </label>
        </div>

        {isSelectingRange && (
          <div className="text-amber-400 font-mono text-[11px]">
            {rangeStart && !rangeEnd
              ? `Range start: ${rangeStart} (Now click second date)`
              : rangeStart && rangeEnd
              ? `Range: ${rangeStart} to ${rangeEnd}`
              : 'Click any start date cell on calendar'}
          </div>
        )}
      </div>

      {/* Main Calendar Matrix Grid */}
      <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-stone-900/90 border-b border-stone-800 text-center text-[11px] font-mono uppercase tracking-wider text-stone-400 py-2">
          <div className="text-red-400 font-semibold">Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Cells Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-stone-800/80 bg-stone-950">
          {/* Pre-padding empty cells for month start */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-28 bg-stone-900/20 opacity-40 p-2" />
          ))}

          {/* Actual days in month */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = formatDateStr(currentYear, currentMonth, dayNum);
            const isToday = dateStr === '2026-09-05';
            const dayOfWeek = new Date(currentYear, currentMonth - 1, dayNum).getDay();
            const isSunday = dayOfWeek === 0;

            // Check if holiday
            const holiday = showHolidays
              ? holidays.find((h) => h.date === dateStr)
              : null;

            // Check range highlight
            const isInSelectedRange =
              rangeStart && rangeEnd
                ? dateStr >= rangeStart && dateStr <= rangeEnd
                : rangeStart === dateStr;

            // Gather attendance for this date
            const dateRecords = attendanceRecords.filter((r) => r.date === dateStr);
            const presentCount = dateRecords.filter((r) => r.status === 'present').length;
            const absentCount = dateRecords.filter((r) => r.status === 'absent').length;
            const leaveCount = dateRecords.filter((r) => r.status === 'on_leave').length;
            const lateCount = dateRecords.filter((r) => r.isLate).length;

            // In Single Employee Mode:
            const empRecord = displayMode === 'employee'
              ? dateRecords.find((r) => r.employeeId === selectedEmployeeId)
              : null;

            return (
              <div
                key={dateStr}
                onClick={() => handleCellClick(dateStr)}
                className={`min-h-[110px] p-2 transition cursor-pointer relative group flex flex-col justify-between ${
                  isInSelectedRange
                    ? 'bg-amber-500/15 ring-2 ring-inset ring-amber-500/60'
                    : isToday
                    ? 'bg-stone-900 border-l-2 border-l-amber-500'
                    : 'hover:bg-stone-900/60'
                }`}
              >
                {/* Cell Header: Date Number & Badges */}
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono font-bold text-xs ${
                      isToday
                        ? 'bg-amber-500 text-stone-950 px-1.5 py-0.2'
                        : isSunday
                        ? 'text-red-400'
                        : 'text-stone-300'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {isToday && (
                    <span className="text-[9px] font-mono uppercase bg-amber-500/20 text-amber-300 px-1 border border-amber-500/30">
                      TODAY
                    </span>
                  )}

                  {holiday && (
                    <span className="text-[9px] font-medium bg-purple-500/20 text-purple-300 px-1 border border-purple-500/30 truncate max-w-[80px]">
                      {holiday.name}
                    </span>
                  )}
                </div>

                {/* Content: Mode Specific */}
                {displayMode === 'company' ? (
                  /* Company-Wide Heatmap Mini Summary */
                  <div className="my-1.5 space-y-1 text-[10px] font-mono">
                    {dateRecords.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between text-emerald-400">
                          <span>Present</span>
                          <span className="font-bold">{presentCount}</span>
                        </div>
                        {absentCount > 0 && (
                          <div className="flex items-center justify-between text-red-400">
                            <span>Absent</span>
                            <span className="font-bold">{absentCount}</span>
                          </div>
                        )}
                        {showLeaves && leaveCount > 0 && (
                          <div className="flex items-center justify-between text-blue-400">
                            <span>On Leave</span>
                            <span className="font-bold">{leaveCount}</span>
                          </div>
                        )}
                        {lateCount > 0 && (
                          <div className="flex items-center justify-between text-amber-400">
                            <span>Late</span>
                            <span className="font-bold">{lateCount}</span>
                          </div>
                        )}
                      </>
                    ) : isSunday ? (
                      <div className="text-stone-500 text-center py-2">Weekly Off</div>
                    ) : (
                      <div className="text-stone-600 text-center py-2">No data</div>
                    )}
                  </div>
                ) : (
                  /* Per-Employee Day View */
                  <div className="my-1 text-xs">
                    {empRecord ? (
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-1.5 py-0.2 text-[10px] font-semibold uppercase border ${
                            empRecord.status === 'present'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : empRecord.status === 'on_leave'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                              : empRecord.status === 'holiday'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                              : empRecord.status === 'weekly_off'
                              ? 'bg-stone-800 text-stone-400 border-stone-700'
                              : 'bg-red-500/20 text-red-300 border-red-500/30'
                          }`}
                        >
                          {empRecord.status}
                        </span>

                        {empRecord.checkIn && (
                          <div className="font-mono text-[10px] text-stone-300 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-amber-400" />
                            <span>{empRecord.checkIn} - {empRecord.checkOut || 'Active'}</span>
                          </div>
                        )}

                        {empRecord.isLate && (
                          <div className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>Late +{empRecord.lateMinutes}m</span>
                          </div>
                        )}
                      </div>
                    ) : isSunday ? (
                      <span className="text-[10px] font-mono text-stone-500">Weekly Off</span>
                    ) : (
                      <span className="text-[10px] font-mono text-stone-600">—</span>
                    )}
                  </div>
                )}

                {/* Footer hint */}
                <div className="text-[9px] text-stone-500 opacity-0 group-hover:opacity-100 transition text-right">
                  Click to inspect
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-stone-950 border border-stone-800 p-3 flex flex-wrap items-center justify-between text-xs text-stone-400 gap-3">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-mono text-[10px] uppercase text-stone-500">Legend:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-emerald-500" />
            <span>Present</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-amber-500" />
            <span>Late Check-in</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-blue-500" />
            <span>On Leave</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-purple-500" />
            <span>Plant Holiday</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-red-500" />
            <span>Absent</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-stone-700" />
            <span>Weekly Off</span>
          </span>
        </div>

        <div className="font-mono text-[11px] text-stone-500">
          Showing {monthNames[currentMonth - 1]} 2026 data
        </div>
      </div>

      {/* Day Detail & Inline Correction Modal */}
      {activeModalData && (
        <DayDetailModal
          isOpen={!!activeModalData}
          onClose={() => setActiveModalData(null)}
          date={activeModalData.date}
          record={activeModalData.record}
          employee={activeModalData.employee}
          shift={employeeShift}
        />
      )}

      {/* Bulk Mark Range Modal */}
      {showBulkModal && rangeStart && rangeEnd && (
        <BulkMarkModal
          isOpen={showBulkModal}
          onClose={() => {
            setShowBulkModal(false);
            setRangeStart(null);
            setRangeEnd(null);
            setIsSelectingRange(false);
          }}
          employees={employees}
          defaultStartDate={rangeStart}
          defaultEndDate={rangeEnd}
        />
      )}
    </div>
  );
}
