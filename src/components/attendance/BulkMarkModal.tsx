/**
 * Bulk Attendance Marking Modal
 * Allows Admin or Supervisor to mark attendance over a date range
 * (e.g. plant maintenance shutdown, mass weekly off, declared local holiday)
 */

import React, { useState } from 'react';
import { Employee, AttendanceStatus } from '../../types';
import { useBulkMarkAttendance } from '../../hooks/useHRM';
import { useToast } from '../../context/ToastContext';
import { X, Calendar, CheckSquare } from 'lucide-react';

interface BulkMarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  defaultStartDate?: string;
  defaultEndDate?: string;
}

export function BulkMarkModal({
  isOpen,
  onClose,
  employees,
  defaultStartDate = '2026-09-01',
  defaultEndDate = '2026-09-05',
}: BulkMarkModalProps) {
  const { success, error } = useToast();
  const bulkMarkMutation = useBulkMarkAttendance();

  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [status, setStatus] = useState<AttendanceStatus>('holiday');
  const [remarks, setRemarks] = useState('Plant maintenance shutdown');
  const safeEmployees = employees || [];
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>(() => safeEmployees.map((e) => e.id));

  if (!isOpen) return null;

  const toggleSelectAll = () => {
    if (selectedEmpIds.length === safeEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(safeEmployees.map((e) => e.id));
    }
  };

  const toggleEmp = (id: number) => {
    if (selectedEmpIds.includes(id)) {
      setSelectedEmpIds(selectedEmpIds.filter((i) => i !== id));
    } else {
      setSelectedEmpIds([...selectedEmpIds, id]);
    }
  };

  const handleApply = async () => {
    if (selectedEmpIds.length === 0) {
      error('Please select at least one employee.');
      return;
    }
    if (!startDate || !endDate || startDate > endDate) {
      error('Invalid date range.');
      return;
    }

    try {
      await bulkMarkMutation.mutateAsync({
        employeeIds: selectedEmpIds,
        startDate,
        endDate,
        status,
        remarks,
      });
      success(`Marked ${selectedEmpIds.length} workers as ${status.replace('_', ' ')} from ${startDate} to ${endDate}.`);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to bulk mark attendance');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-950 px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
              Shop Floor Operations
            </div>
            <h3 className="font-display font-bold text-lg text-stone-100">
              Bulk Attendance Marking
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-200 border border-stone-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Date Range & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-950 p-3 border border-stone-800">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Target Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                className="w-full bg-stone-900 border border-stone-700 p-2 text-stone-200 text-xs font-medium"
              >
                <option value="holiday">Plant Holiday</option>
                <option value="weekly_off">Weekly Off</option>
                <option value="on_leave">Approved Leave</option>
                <option value="present">Mark Present</option>
                <option value="absent">Mark Absent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Operation Remarks / Reason</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Factory maintenance shut-down, boiler overhaul"
              className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 text-xs"
            />
          </div>

          {/* Employee Selection List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono text-stone-400 uppercase">
                Select Workforce Target ({selectedEmpIds.length} of {employees.length} Selected)
              </span>
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-amber-400 hover:text-amber-300 text-[11px] flex items-center gap-1 font-mono"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{selectedEmpIds.length === employees.length ? 'Deselect All' : 'Select All'}</span>
              </button>
            </div>

            <div className="bg-stone-950 border border-stone-800 max-h-48 overflow-y-auto divide-y divide-stone-800/60 p-1">
              {employees.map((emp) => {
                const isSelected = selectedEmpIds.includes(emp.id);
                return (
                  <label
                    key={emp.id}
                    className="flex items-center justify-between p-2 hover:bg-stone-900/60 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleEmp(emp.id)}
                        className="rounded-none bg-stone-900 border-stone-700 text-amber-500 focus:ring-0"
                      />
                      <div>
                        <div className="font-medium text-stone-200">{emp.name}</div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {emp.employeeCode} • {emp.designation}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-stone-800 text-stone-400">
                      {emp.category === 'permanent_staff' ? 'Staff' : 'Contractor'}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-950 px-5 py-3 border-t border-stone-800 flex items-center justify-between">
          <button onClick={onClose} className="px-3 py-1.5 text-stone-400 hover:text-stone-200 text-xs">
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={bulkMarkMutation.isPending}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase tracking-wider"
          >
            {bulkMarkMutation.isPending ? 'Executing...' : `Apply Bulk Status to ${selectedEmpIds.length} Workers`}
          </button>
        </div>
      </div>
    </div>
  );
}
