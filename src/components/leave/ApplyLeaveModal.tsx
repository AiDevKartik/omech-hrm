/**
 * Apply Leave Modal
 * Features live balance checking against policy rules and visual warning
 * if requested dates overlap declared holidays or weekly-offs.
 */

import React, { useState } from 'react';
import { Employee, LeaveType, Holiday } from '../../types';
import { useApplyLeave, useEmployeeLeaveBalances } from '../../hooks/useHRM';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { X, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  leaveTypes: LeaveType[];
  holidays: Holiday[];
}

export function ApplyLeaveModal({
  isOpen,
  onClose,
  employees,
  leaveTypes,
  holidays,
}: ApplyLeaveModalProps) {
  const { role, employee: currentEmployee } = useAuth();
  const { success, error } = useToast();
  const applyMutation = useApplyLeave();

  // If worker, force own ID. If admin/supervisor, can apply on behalf of any worker
  const [selectedEmpId, setSelectedEmpId] = useState<number>(
    role === 'worker' && currentEmployee ? currentEmployee.id : employees[0]?.id || 1
  );

  const [leaveTypeId, setLeaveTypeId] = useState<number>(leaveTypes[0]?.id || 1);
  const [startDate, setStartDate] = useState('2026-09-08');
  const [endDate, setEndDate] = useState('2026-09-09');
  const [reason, setReason] = useState('');

  // Fetch balances for selected employee
  const { data: balances = [] } = useEmployeeLeaveBalances(selectedEmpId, 2026);
  const targetBalance = balances.find((b) => b.leaveTypeId === leaveTypeId);
  const currentAvailableBalance = targetBalance?.currentBalance ?? targetBalance?.closingBalance ?? 0;

  if (!isOpen) return null;

  // Calculate days count
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  const rawDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);

  // Check if requested date range spans declared holidays or Sundays
  const overlappingHolidays: { date: string; name: string }[] = [];
  let sundayCount = 0;

  if (startDate && endDate && startDate <= endDate) {
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dStr = d.toISOString().split('T')[0];
      if (d.getDay() === 0) sundayCount++;
      const h = holidays.find((hol) => hol.date === dStr);
      if (h) overlappingHolidays.push({ date: dStr, name: h.name });
    }
  }

  const effectiveLeaveDays = Math.max(1, rawDays - overlappingHolidays.length - sundayCount);
  const isBalanceExceeded = effectiveLeaveDays > currentAvailableBalance;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      error('Please provide a reason for leave application.');
      return;
    }
    if (startDate > endDate) {
      error('Start date cannot be after end date.');
      return;
    }

    try {
      await applyMutation.mutateAsync({
        employeeId: selectedEmpId,
        leaveTypeId,
        startDate,
        endDate,
        daysCount: effectiveLeaveDays,
        reason: reason.trim(),
      });
      success(`Leave application submitted for ${effectiveLeaveDays} day(s).`);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to submit leave');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-stone-950 px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
              Leave Management
            </div>
            <h3 className="font-display font-bold text-lg text-stone-100">
              Apply for Leave
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-200 border border-stone-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Employee Selection (locked if role === worker) */}
          {role !== 'worker' ? (
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Select Employee</label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(Number(e.target.value))}
                className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200"
              >
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.employeeCode}) • {e.category === 'permanent_staff' ? 'Staff' : 'Contractor'}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="bg-stone-950 p-2.5 border border-stone-800 text-stone-400">
              Applicant: <span className="font-semibold text-stone-200">{currentEmployee?.name}</span> ({currentEmployee?.employeeCode})
            </div>
          )}

          {/* Leave Type & Live Balance Check */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Leave Category</label>
              <select
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(Number(e.target.value))}
                className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-medium"
              >
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.name || lt.label} ({lt.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-stone-950 p-2 border border-stone-800 flex flex-col justify-center">
              <span className="text-stone-500 uppercase font-mono text-[10px]">Available Policy Balance</span>
              <span className={`font-mono text-base font-bold ${currentAvailableBalance > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {currentAvailableBalance} Days
              </span>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">From Date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">To Date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
              />
            </div>
          </div>

          {/* Overlap & Holiday Warning Banner */}
          {(overlappingHolidays.length > 0 || sundayCount > 0) && (
            <div className="bg-stone-950 border border-amber-500/40 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px] uppercase tracking-wider font-mono">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Holiday / Weekly Off Overlap Detected</span>
              </div>
              <div className="text-stone-300 text-[11px]">
                Range spans {rawDays} calendar days.
                {overlappingHolidays.length > 0 && ` Excluded declared holiday: ${overlappingHolidays.map((h) => h.name).join(', ')}.`}
                {sundayCount > 0 && ` Excluded ${sundayCount} weekly-off Sunday(s).`}
              </div>
              <div className="text-amber-300 font-mono font-bold text-xs pt-1">
                Net Debit against Leave Balance: {effectiveLeaveDays} Days
              </div>
            </div>
          )}

          {/* Balance exceeded warning */}
          {isBalanceExceeded && (
            <div className="p-2.5 bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                Requested {effectiveLeaveDays} days exceeds current balance ({currentAvailableBalance} days). May be converted to unpaid leave or rejected.
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Reason for Leave</label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Family medical emergency, agricultural harvest"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 text-xs"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-stone-400 hover:text-stone-200 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={applyMutation.isPending}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{applyMutation.isPending ? 'Submitting...' : 'Submit Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
