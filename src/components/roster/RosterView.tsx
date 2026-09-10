/**
 * Shift Roster View
 * Visual shift scheduling matrix by week/date-range with bulk shift assignments
 */

import React, { useState } from 'react';
import { useEmployees, useShifts, useDepartments, useAssignShiftRange } from '../../hooks/useHRM';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Shift } from '../../types';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Clock,
  Layers,
  X,
  Check,
} from 'lucide-react';

export function RosterView() {
  const { role } = useAuth();
  const { success, error } = useToast();

  const [startDate, setStartDate] = useState('2026-09-01');
  const [selectedShiftId, setSelectedShiftId] = useState<number>(1);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);

  const { data: employees = [] } = useEmployees({ isActive: true });
  const { data: shifts = [] } = useShifts();
  const { data: departments = [] } = useDepartments();
  const assignMutation = useAssignShiftRange();

  // Generate 7 days from startDate
  const start = new Date(startDate);
  const days: { dateStr: string; label: string; dayName: string }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push({
      dateStr: d.toISOString().split('T')[0],
      label: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
      dayName: d.toLocaleString('default', { weekday: 'short' }),
    });
  }

  const handleNextWeek = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + 7);
    setStartDate(d.toISOString().split('T')[0]);
  };

  const handlePrevWeek = () => {
    const d = new Date(startDate);
    d.setDate(d.getDate() - 7);
    setStartDate(d.toISOString().split('T')[0]);
  };

  const handleExecuteAssignment = async () => {
    if (selectedEmpIds.length === 0) {
      error('Please select at least one worker.');
      return;
    }
    const endDate = days[6].dateStr;
    try {
      await assignMutation.mutateAsync({
        employeeIds: selectedEmpIds,
        startDate,
        endDate,
        shiftId: selectedShiftId,
      });
      const s = shifts.find((sh) => sh.id === selectedShiftId);
      success(`Assigned ${selectedEmpIds.length} workers to ${s?.name} for week ${startDate} to ${endDate}.`);
      setIsAssignModalOpen(false);
      setSelectedEmpIds([]);
    } catch (err: any) {
      error(err.message || 'Assignment failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950 border border-stone-800 p-4">
        <div>
          <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
            Shop Floor Scheduling
          </div>
          <h1 className="font-display font-bold text-xl text-stone-100 tracking-tight">
            Weekly Shift Roster
          </h1>
        </div>

        {(role === 'admin' || role === 'supervisor') && (
          <button
            onClick={() => {
              setSelectedEmpIds(employees.map((e) => e.id));
              setIsAssignModalOpen(true);
            }}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Assign Shifts in Bulk</span>
          </button>
        )}
      </div>

      {/* Week Navigator & Shift Legend */}
      <div className="bg-stone-950 border border-stone-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center bg-stone-900 border border-stone-700">
          <button onClick={handlePrevWeek} className="p-1 hover:bg-stone-800 text-stone-300">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 font-display font-bold text-stone-100 min-w-[200px] text-center">
            {days[0]?.label} — {days[6]?.label} (7-Day Block)
          </span>
          <button onClick={handleNextWeek} className="p-1 hover:bg-stone-800 text-stone-300">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Shift Legend */}
        <div className="flex items-center gap-3">
          {shifts.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 font-mono text-[11px]">
              <span
                className={`w-2.5 h-2.5 ${
                  s.code === 'S-A'
                    ? 'bg-amber-500'
                    : s.code === 'S-B'
                    ? 'bg-blue-500'
                    : 'bg-purple-500'
                }`}
              />
              <span className="text-stone-300">{s.name}</span>
              <span className="text-stone-500">({s.startTime}-{s.endTime})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
              <th className="p-3 sticky left-0 bg-stone-900 z-10 min-w-[200px] border-r border-stone-800">
                Worker Info
              </th>
              <th className="p-3 min-w-[100px] border-r border-stone-800">
                Department
              </th>
              {days.map((d) => (
                <th key={d.dateStr} className="p-3 text-center min-w-[110px] border-r border-stone-800/80">
                  <div className="text-stone-200">{d.dayName}</div>
                  <div className="text-[10px] text-stone-500 font-mono">{d.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60 font-mono">
            {employees.map((emp) => {
              const dept = departments.find((d) => d.id === emp.departmentId);
              const defaultShift = shifts.find((s) => s.id === emp.shiftId) || shifts[0];

              return (
                <tr key={emp.id} className="hover:bg-stone-900/40">
                  <td className="p-3 sticky left-0 bg-stone-950 z-10 border-r border-stone-800 font-sans">
                    <div className="font-semibold text-stone-200">{emp.name}</div>
                    <div className="text-[10px] text-stone-500 font-mono">{emp.employeeCode}</div>
                  </td>

                  <td className="p-3 border-r border-stone-800 text-stone-400 font-sans">
                    {dept?.name}
                  </td>

                  {/* 7 Days shift assignments */}
                  {days.map((d) => {
                    const isSunday = new Date(d.dateStr).getDay() === 0;
                    return (
                      <td key={d.dateStr} className="p-2.5 text-center border-r border-stone-800/80">
                        {isSunday ? (
                          <span className="text-[10px] text-stone-500 uppercase px-1.5 py-0.5 bg-stone-900 border border-stone-800">
                            Weekly Off
                          </span>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-semibold border ${
                              defaultShift.code === 'S-A'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : defaultShift.code === 'S-B'
                                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {defaultShift.name}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bulk Shift Assignment Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-stone-900 border border-stone-700 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-stone-950 px-5 py-4 border-b border-stone-800 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
                  Scheduling Action
                </div>
                <h3 className="font-display font-bold text-lg text-stone-100">
                  Assign Shift Range
                </h3>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-200 border border-stone-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Target Shift</label>
                <select
                  value={selectedShiftId}
                  onChange={(e) => setSelectedShiftId(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 text-xs font-semibold"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-stone-950 border border-stone-800 text-stone-400">
                Active Week: <span className="font-mono text-stone-200">{startDate}</span> to{' '}
                <span className="font-mono text-stone-200">{days[6].dateStr}</span>
              </div>

              <div>
                <div className="text-[11px] font-mono text-stone-400 uppercase mb-2">
                  Select Workers ({selectedEmpIds.length} Selected)
                </div>
                <div className="bg-stone-950 border border-stone-800 max-h-48 overflow-y-auto divide-y divide-stone-800 p-1">
                  {employees.map((emp) => {
                    const isSelected = selectedEmpIds.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className="flex items-center gap-2 p-2 hover:bg-stone-900 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setSelectedEmpIds(selectedEmpIds.filter((i) => i !== emp.id));
                            } else {
                              setSelectedEmpIds([...selectedEmpIds, emp.id]);
                            }
                          }}
                          className="rounded-none bg-stone-900 border-stone-700 text-amber-500 focus:ring-0"
                        />
                        <span className="font-medium text-stone-200">{emp.name}</span>
                        <span className="text-[10px] text-stone-500 font-mono">({emp.employeeCode})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-stone-950 px-5 py-3 border-t border-stone-800 flex items-center justify-between">
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="px-3 py-1.5 text-stone-400 hover:text-stone-200 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAssignment}
                disabled={assignMutation.isPending || selectedEmpIds.length === 0}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase tracking-wider"
              >
                {assignMutation.isPending ? 'Assigning...' : 'Confirm Shift Roster'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
