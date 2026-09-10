/**
 * Day Detail & Punch Correction Modal
 * Shows full punch details for a specific day and provides inline correction for Admin/Supervisor
 */

import React, { useState } from 'react';
import { AttendanceRecord, Employee, Shift, AttendanceStatus } from '../../types';
import { useUpdateAttendanceRecord, useRecordManualAttendance } from '../../hooks/useHRM';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { X, Clock, AlertTriangle, ShieldCheck, PlusCircle } from 'lucide-react';

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record?: AttendanceRecord | null;
  employee?: Employee | null;
  date: string;
  shift?: Shift | null;
}

export function DayDetailModal({
  isOpen,
  onClose,
  record,
  employee,
  date,
  shift,
}: DayDetailModalProps) {
  const { role, employee: currentEmployee } = useAuth();
  const { success, error } = useToast();
  const updateMutation = useUpdateAttendanceRecord();
  const manualRecordMutation = useRecordManualAttendance();

  const [status, setStatus] = useState<AttendanceStatus>(record?.status || 'present');
  const [checkIn, setCheckIn] = useState<string>(record?.checkIn || shift?.startTime || '08:00');
  const [checkOut, setCheckOut] = useState<string>(record?.checkOut || shift?.endTime || '17:00');
  const [remarks, setRemarks] = useState<string>(record?.remarks || '');
  const [isEditing, setIsEditing] = useState(!record);

  if (!isOpen) return null;

  const canEdit = role === 'admin' || role === 'supervisor';

  const handleSaveCorrection = async () => {
    if (!employee) {
      error('No employee context available.');
      return;
    }
    try {
      if (record) {
        await updateMutation.mutateAsync({
          id: record.id,
          updates: {
            status,
            checkIn: (status === 'present' || status === 'half_day') ? checkIn : null,
            checkOut: (status === 'present' || status === 'half_day') ? checkOut : null,
            remarks: remarks ? `${remarks} (Updated by ${currentEmployee?.name || 'HR'})` : `Manual entry by ${currentEmployee?.name || 'HR'}`,
          },
        });
        success(`Attendance for ${date} updated successfully.`);
      } else {
        await manualRecordMutation.mutateAsync({
          employeeId: employee.id,
          date,
          status,
          checkIn: (status === 'present' || status === 'half_day') ? checkIn : null,
          checkOut: (status === 'present' || status === 'half_day') ? checkOut : null,
          remarks: remarks || `Manual entry by ${currentEmployee?.name || 'Admin/HR'} (No Biometric)`,
        });
        success(`Manual attendance recorded for ${employee.name} on ${date}.`);
      }
      setIsEditing(false);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save attendance record');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-stone-950 px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
              Punch & Attendance Record
            </div>
            <h3 className="font-display font-bold text-lg text-stone-100">
              {employee?.name || 'Shop Floor Worker'}
            </h3>
            <div className="text-xs text-stone-400 font-mono">
              Date: <span className="text-stone-200 font-semibold">{date}</span> • Code: {employee?.employeeCode}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-200 border border-stone-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Shift Details */}
          <div className="grid grid-cols-2 gap-3 bg-stone-950 p-3 border border-stone-800">
            <div>
              <span className="text-stone-500 block text-[10px] uppercase font-mono">Assigned Shift</span>
              <span className="text-stone-200 font-medium">
                {shift ? `${shift.name} (${shift.startTime} - ${shift.endTime})` : 'Standard 8h Shift'}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px] uppercase font-mono">Grace Period</span>
              <span className="text-stone-200 font-medium font-mono">{shift?.graceMinutes || 15} minutes</span>
            </div>
          </div>

          {!isEditing ? (
            /* View Mode */
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-stone-950 border border-stone-800">
                  <span className="text-stone-500 block text-[10px] uppercase font-mono">Status</span>
                  <span
                    className={`inline-block mt-1 font-semibold uppercase px-2 py-0.5 text-[11px] border ${
                      record?.status === 'present'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : record?.status === 'on_leave'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : record?.status === 'holiday'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                        : record?.status === 'weekly_off'
                        ? 'bg-stone-800 text-stone-300 border-stone-700'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {record?.status || 'No punch record'}
                  </span>
                </div>

                <div className="p-3 bg-stone-950 border border-stone-800">
                  <span className="text-stone-500 block text-[10px] uppercase font-mono">Discipline / Late</span>
                  <span className="font-mono text-sm block mt-1">
                    {record?.isLate ? (
                      <span className="text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Late ({record.lateMinutes} mins)</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>On Time</span>
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-stone-950 border border-stone-800">
                  <span className="text-stone-500 block text-[10px] uppercase font-mono">Check-in Time</span>
                  <span className="font-mono text-sm text-stone-200 block mt-1">
                    {record?.checkIn || '—'}
                  </span>
                </div>
                <div className="p-3 bg-stone-950 border border-stone-800">
                  <span className="text-stone-500 block text-[10px] uppercase font-mono">Check-out Time</span>
                  <span className="font-mono text-sm text-stone-200 block mt-1">
                    {record?.checkOut || '—'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-stone-950 border border-stone-800">
                  <span className="text-stone-500 block text-[10px] uppercase font-mono">Working Hours</span>
                  <span className="font-mono text-sm text-stone-200 block mt-1">
                    {record?.workingHours || 0} Hours
                  </span>
                </div>
                <div className="p-3 bg-stone-950 border border-stone-800">
                  <span className="text-stone-500 block text-[10px] uppercase font-mono">Overtime Hours</span>
                  <span className="font-mono text-sm text-amber-400 block mt-1">
                    {record?.overtimeHours || 0} Hours
                  </span>
                </div>
              </div>

              {record?.remarks && (
                <div className="p-2.5 bg-stone-950 border border-stone-800 text-stone-400 text-xs">
                  <span className="text-stone-500 block text-[10px] font-mono uppercase">Remarks</span>
                  {record.remarks}
                </div>
              )}
            </div>
          ) : (
            /* Inline Edit / Correction Mode (Admin / Supervisor) */
            <div className="space-y-3 bg-stone-950 p-4 border border-stone-700">
              <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Supervisory Correction Form</span>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                  className="w-full bg-stone-900 border border-stone-700 p-2 text-stone-200 text-xs"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                  <option value="on_leave">On Leave</option>
                  <option value="holiday">Plant Holiday</option>
                  <option value="weekly_off">Weekly Off</option>
                </select>
              </div>

              {status === 'present' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Check-in (HH:mm)</label>
                    <input
                      type="time"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Check-out (HH:mm)</label>
                    <input
                      type="time"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full bg-stone-900 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Reason for Correction</label>
                <input
                  type="text"
                  placeholder="e.g. Biometric reader missed punch, manual verification"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 p-2 text-stone-200 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-950 px-5 py-3 border-t border-stone-800 flex items-center justify-between">
          <div>
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-xs border border-amber-500/40 flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{record ? 'Correct / Edit Manual Punch' : 'Enter Manual Punch'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                {record && (
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 text-stone-400 hover:text-stone-200 text-xs"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleSaveCorrection}
                  disabled={updateMutation.isPending || manualRecordMutation.isPending}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase tracking-wider disabled:opacity-50"
                >
                  {updateMutation.isPending || manualRecordMutation.isPending
                    ? 'Saving...'
                    : record
                    ? 'Apply Correction'
                    : 'Save Manual Punch'}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
