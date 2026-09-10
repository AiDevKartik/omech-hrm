/**
 * Attendance Daily List View
 * Live shop-floor check-in/out records against system time, auto-flags late marks,
 * and allows quick punch recording or inspection.
 */

import React, { useState } from 'react';
import { Employee, AttendanceRecord, Department, Shift } from '../../types';
import { useCheckIn, useCheckOut } from '../../hooks/useHRM';
import { useToast } from '../../context/ToastContext';
import { DayDetailModal } from './DayDetailModal';
import { Clock, Search, LogIn, LogOut, AlertTriangle, ShieldCheck, Edit3 } from 'lucide-react';

interface AttendanceListProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  departments: Department[];
  shifts: Shift[];
  currentDate: string;
  onDateChange: (d: string) => void;
  onOpenManualAttendance?: (employeeId?: number) => void;
}

export function AttendanceList({
  employees,
  attendanceRecords,
  departments,
  shifts,
  currentDate,
  onDateChange,
  onOpenManualAttendance,
}: AttendanceListProps) {
  const { success, error } = useToast();
  const [search, setSearch] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState<number | 'all'>('all');
  const [activeModalData, setActiveModalData] = useState<{
    date: string;
    record: AttendanceRecord | null;
    employee: Employee | null;
  } | null>(null);

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  // Records for current date
  const dateRecords = attendanceRecords.filter((r) => r.date === currentDate);

  const filteredEmployees = employees.filter((emp) => {
    const matchDept = selectedDeptId === 'all' || emp.departmentId === selectedDeptId;
    const matchSearch =
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeCode.toLowerCase().includes(search.toLowerCase()) ||
      emp.designation.toLowerCase().includes(search.toLowerCase());
    return matchDept && matchSearch;
  });

  const handleQuickCheckIn = async (employeeId: number) => {
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      await checkInMutation.mutateAsync({ employeeId, time: timeStr, date: currentDate });
      success(`Checked in worker at ${timeStr}`);
    } catch (err: any) {
      error(err.message || 'Check-in failed');
    }
  };

  const handleQuickCheckOut = async (employeeId: number) => {
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      await checkOutMutation.mutateAsync({ employeeId, time: timeStr, date: currentDate });
      success(`Checked out worker at ${timeStr}`);
    } catch (err: any) {
      error(err.message || 'Check-out failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="bg-stone-950 border border-stone-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-mono">Date:</span>
            <input
              type="date"
              value={currentDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200 font-mono"
            />
          </div>

          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search by worker name, code, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 pl-8 pr-3 py-1.5 text-stone-200 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-mono">Department:</span>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onOpenManualAttendance && (
            <button
              onClick={() => onOpenManualAttendance()}
              className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
              title="Manually log in/out with custom times (No Biometric)"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Manual Time Log</span>
            </button>
          )}

          <div className="font-mono text-stone-400">
            Showing <span className="text-stone-100 font-bold">{filteredEmployees.length}</span> Workers
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
              <th className="p-3">Worker Info</th>
              <th className="p-3">Department</th>
              <th className="p-3">Assigned Shift</th>
              <th className="p-3">Check-In</th>
              <th className="p-3">Check-Out</th>
              <th className="p-3">Status</th>
              <th className="p-3">Discipline</th>
              <th className="p-3 text-right">Shop Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60">
            {filteredEmployees.map((emp) => {
              const dept = departments.find((d) => d.id === emp.departmentId);
              const shift = shifts.find((s) => s.id === emp.shiftId);
              const rec = dateRecords.find((r) => r.employeeId === emp.id);

              const hasPunchedIn = Boolean(rec?.checkIn);
              const hasPunchedOut = Boolean(rec?.checkOut);

              return (
                <tr key={emp.id} className="hover:bg-stone-900/40 transition">
                  <td className="p-3">
                    <div className="font-semibold text-stone-200">{emp.name}</div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      {emp.employeeCode} • {emp.designation}
                    </div>
                  </td>

                  <td className="p-3 text-stone-400">{dept?.name || 'Shop Floor'}</td>

                  <td className="p-3 font-mono text-stone-300">
                    {shift ? `${shift.name} (${shift.startTime}-${shift.endTime})` : 'General'}
                  </td>

                  <td className="p-3 font-mono text-stone-200">
                    {rec?.checkIn ? (
                      <span className="text-stone-100 font-semibold">{rec.checkIn}</span>
                    ) : (
                      <span className="text-stone-600">—</span>
                    )}
                  </td>

                  <td className="p-3 font-mono text-stone-200">
                    {rec?.checkOut ? (
                      <span className="text-stone-100 font-semibold">{rec.checkOut}</span>
                    ) : (
                      <span className="text-stone-600">—</span>
                    )}
                  </td>

                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase border ${
                        rec?.status === 'present'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : rec?.status === 'on_leave'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : rec?.status === 'holiday'
                          ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                          : rec?.status === 'weekly_off'
                          ? 'bg-stone-800 text-stone-400 border-stone-700'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {rec?.status || 'No record'}
                    </span>
                  </td>

                  <td className="p-3">
                    {rec?.isLate ? (
                      <span className="text-amber-400 flex items-center gap-1 font-mono text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Late +{rec.lateMinutes}m</span>
                      </span>
                    ) : rec?.checkIn ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>On-time</span>
                      </span>
                    ) : (
                      <span className="text-stone-600">—</span>
                    )}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!hasPunchedIn ? (
                        <button
                          onClick={() => handleQuickCheckIn(emp.id)}
                          disabled={checkInMutation.isPending}
                          className="px-2 py-1 bg-stone-900 hover:bg-stone-800 text-emerald-400 border border-stone-700 font-mono text-[10px] uppercase font-semibold flex items-center gap-1"
                          title="Register punch-in"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>In</span>
                        </button>
                      ) : !hasPunchedOut ? (
                        <button
                          onClick={() => handleQuickCheckOut(emp.id)}
                          disabled={checkOutMutation.isPending}
                          className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono text-[10px] uppercase font-semibold flex items-center gap-1"
                          title="Register punch-out"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Out</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-stone-500 px-1.5 py-0.5">Completed</span>
                      )}

                      {onOpenManualAttendance ? (
                        <button
                          onClick={() => onOpenManualAttendance(emp.id)}
                          className="p-1 hover:bg-amber-500/20 text-stone-400 hover:text-amber-300 border border-stone-800 hover:border-amber-500/40"
                          title="Enter custom Log In & Log Out time"
                        >
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                      ) : null}

                      <button
                        onClick={() =>
                          setActiveModalData({
                            date: currentDate,
                            record: rec || null,
                            employee: emp,
                          })
                        }
                        className="p-1 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800"
                        title="Inspect or Correct Record"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {activeModalData && (
        <DayDetailModal
          isOpen={!!activeModalData}
          onClose={() => setActiveModalData(null)}
          date={activeModalData.date}
          record={activeModalData.record}
          employee={activeModalData.employee}
          shift={shifts.find((s) => s.id === activeModalData.employee?.shiftId)}
        />
      )}
    </div>
  );
}
