/**
 * Manual Attendance Entry Modal
 * Designed specifically for industrial setups without biometric hardware.
 * Enables Admin and HR to take and log manual attendance with exact check-in (log in)
 * and check-out (log out) times, supporting both single-worker entries and
 * fast daily floor roster (batch) recording.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Employee,
  Shift,
  Department,
  AttendanceRecord,
  AttendanceStatus,
} from '../../types';
import {
  useRecordManualAttendance,
  useBatchManualAttendance,
  useMonthlyRegister,
} from '../../hooks/useHRM';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Clock,
  User,
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Save,
  CheckSquare,
  Square,
  Search,
} from 'lucide-react';

interface ManualAttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  shifts: Shift[];
  departments: Department[];
  defaultDate?: string;
  initialEmployeeId?: number;
}

interface BatchRowState {
  employeeId: number;
  selected: boolean;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  remarks: string;
}

export function ManualAttendanceModal({
  isOpen,
  onClose,
  employees,
  shifts,
  departments,
  defaultDate = '2026-09-05',
  initialEmployeeId,
}: ManualAttendanceModalProps) {
  const { employee: currentEmployee } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [selectedDate, setSelectedDate] = useState<string>(defaultDate);

  // Queries to load existing records for pre-filling
  const dateParts = selectedDate.split('-');
  const selYear = Number(dateParts[0]) || 2026;
  const selMonth = Number(dateParts[1]) || 9;
  const { data: monthlyAttendance = [] } = useMonthlyRegister(selMonth, selYear);

  const existingDateRecords = useMemo(
    () => monthlyAttendance.filter((r) => r.date === selectedDate),
    [monthlyAttendance, selectedDate]
  );

  // Mutations
  const recordManualMutation = useRecordManualAttendance();
  const batchManualMutation = useBatchManualAttendance();

  // ==========================================
  // SINGLE WORKER STATE
  // ==========================================
  const [singleEmpId, setSingleEmpId] = useState<number>(
    initialEmployeeId || (employees.length > 0 ? employees[0].id : 0)
  );
  const [singleCheckIn, setSingleCheckIn] = useState<string>('08:00');
  const [singleCheckOut, setSingleCheckOut] = useState<string>('17:00');
  const [singleStatus, setSingleStatus] = useState<AttendanceStatus>('present');
  const [singleRemarks, setSingleRemarks] = useState<string>('Manual gate register entry');
  const [empSearch, setEmpSearch] = useState('');

  // Selected employee object & shift
  const selectedEmp = useMemo(
    () => employees.find((e) => e.id === singleEmpId) || employees[0],
    [employees, singleEmpId]
  );

  const selectedShift = useMemo(
    () => shifts.find((s) => s.id === selectedEmp?.shiftId) || shifts[0],
    [shifts, selectedEmp]
  );

  // Existing record for selected single employee on this date
  const singleExistingRecord = useMemo(
    () => existingDateRecords.find((r) => r.employeeId === singleEmpId),
    [existingDateRecords, singleEmpId]
  );

  // When selected single employee or date changes, prefill with existing or shift defaults
  useEffect(() => {
    if (singleExistingRecord) {
      setSingleCheckIn(singleExistingRecord.checkIn || selectedShift?.startTime || '08:00');
      setSingleCheckOut(singleExistingRecord.checkOut || selectedShift?.endTime || '17:00');
      setSingleStatus(singleExistingRecord.status || 'present');
      setSingleRemarks(singleExistingRecord.remarks || 'Manual time entry');
    } else if (selectedShift) {
      setSingleCheckIn(selectedShift.startTime);
      setSingleCheckOut(selectedShift.endTime);
      setSingleStatus('present');
      setSingleRemarks('Manual entry - No biometric');
    }
  }, [singleEmpId, selectedDate, singleExistingRecord, selectedShift]);

  // Synchronize initialEmployeeId prop when modal opens
  useEffect(() => {
    if (initialEmployeeId) {
      setSingleEmpId(initialEmployeeId);
      setActiveTab('single');
    }
  }, [initialEmployeeId, isOpen]);

  // Calculations for single mode
  const singleCalculation = useMemo(() => {
    let workingHours = 0;
    let overtimeHours = 0;
    let isLate = false;
    let lateMinutes = 0;

    if (singleCheckIn && selectedShift) {
      const [sH, sM] = selectedShift.startTime.split(':').map(Number);
      const [iH, iM] = singleCheckIn.split(':').map(Number);
      const shiftStartMinutes = sH * 60 + sM;
      const inMinutes = iH * 60 + iM;
      const grace = selectedShift.graceMinutes || 15;
      if (inMinutes > shiftStartMinutes + grace) {
        isLate = true;
        lateMinutes = inMinutes - shiftStartMinutes;
      }
    }

    if (singleCheckIn && singleCheckOut) {
      const [iH, iM] = singleCheckIn.split(':').map(Number);
      const [oH, oM] = singleCheckOut.split(':').map(Number);
      let diff = oH * 60 + oM - (iH * 60 + iM);
      if (diff < 0) diff += 24 * 60; // night shift crossover
      workingHours = Number((diff / 60).toFixed(1));
      overtimeHours = workingHours > 8.0 ? Number((workingHours - 8.0).toFixed(1)) : 0;
    }

    return { workingHours, overtimeHours, isLate, lateMinutes };
  }, [singleCheckIn, singleCheckOut, selectedShift]);

  // Handle single submit
  const handleSaveSingle = async () => {
    if (!selectedEmp) {
      error('Please select an employee.');
      return;
    }

    try {
      const isPresentType = singleStatus === 'present' || singleStatus === 'half_day';
      await recordManualMutation.mutateAsync({
        employeeId: selectedEmp.id,
        date: selectedDate,
        checkIn: isPresentType ? singleCheckIn : null,
        checkOut: isPresentType ? singleCheckOut : null,
        status: singleStatus,
        remarks: `${singleRemarks} (Manual Log by ${currentEmployee?.name || 'HR'})`,
      });

      success(`Manual attendance recorded for ${selectedEmp.name} on ${selectedDate}.`);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save manual attendance');
    }
  };

  // ==========================================
  // BATCH FLOOR REGISTER STATE
  // ==========================================
  const [batchDeptFilter, setBatchDeptFilter] = useState<number | 'all'>('all');
  const [batchShiftFilter, setBatchShiftFilter] = useState<number | 'all'>('all');
  const [batchSearch, setBatchSearch] = useState<string>('');
  const [batchCommonIn, setBatchCommonIn] = useState<string>('08:00');
  const [batchCommonOut, setBatchCommonOut] = useState<string>('17:00');

  // Filtered employees for batch
  const batchEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchDept = batchDeptFilter === 'all' || emp.departmentId === batchDeptFilter;
      const matchShift = batchShiftFilter === 'all' || emp.shiftId === batchShiftFilter;
      const matchSearch =
        emp.name.toLowerCase().includes(batchSearch.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(batchSearch.toLowerCase()) ||
        emp.designation.toLowerCase().includes(batchSearch.toLowerCase());
      return matchDept && matchShift && matchSearch;
    });
  }, [employees, batchDeptFilter, batchShiftFilter, batchSearch]);

  const [batchRows, setBatchRows] = useState<Record<number, BatchRowState>>({});

  // Initialize batch rows whenever batch employees, date or existing records change
  useEffect(() => {
    const nextRows: Record<number, BatchRowState> = {};
    for (const emp of employees) {
      const rec = existingDateRecords.find((r) => r.employeeId === emp.id);
      const empShift = shifts.find((s) => s.id === emp.shiftId) || shifts[0];

      if (rec) {
        nextRows[emp.id] = {
          employeeId: emp.id,
          selected: true,
          checkIn: rec.checkIn || empShift?.startTime || '08:00',
          checkOut: rec.checkOut || empShift?.endTime || '17:00',
          status: rec.status,
          remarks: rec.remarks || 'Manual Entry',
        };
      } else {
        nextRows[emp.id] = {
          employeeId: emp.id,
          selected: true,
          checkIn: empShift?.startTime || '08:00',
          checkOut: empShift?.endTime || '17:00',
          status: 'present',
          remarks: 'Daily manual floor register',
        };
      }
    }
    setBatchRows(nextRows);
  }, [employees, shifts, selectedDate, existingDateRecords]);

  // Update a single batch row field
  const updateBatchRow = (empId: number, field: keyof BatchRowState, value: any) => {
    setBatchRows((prev) => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: value,
      },
    }));
  };

  // Batch bulk actions
  const handleSelectAllBatch = (select: boolean) => {
    setBatchRows((prev) => {
      const updated = { ...prev };
      for (const emp of batchEmployees) {
        if (updated[emp.id]) {
          updated[emp.id] = { ...updated[emp.id], selected: select };
        }
      }
      return updated;
    });
  };

  const handleApplyShiftTimingsAll = () => {
    setBatchRows((prev) => {
      const updated = { ...prev };
      for (const emp of batchEmployees) {
        const empShift = shifts.find((s) => s.id === emp.shiftId) || shifts[0];
        if (updated[emp.id] && updated[emp.id].selected && empShift) {
          updated[emp.id] = {
            ...updated[emp.id],
            checkIn: empShift.startTime,
            checkOut: empShift.endTime,
            status: 'present',
          };
        }
      }
      return updated;
    });
    success('Applied standard shift timings to all selected workers.');
  };

  const handleApplyCommonTimings = () => {
    setBatchRows((prev) => {
      const updated = { ...prev };
      for (const emp of batchEmployees) {
        if (updated[emp.id] && updated[emp.id].selected) {
          updated[emp.id] = {
            ...updated[emp.id],
            checkIn: batchCommonIn,
            checkOut: batchCommonOut,
            status: 'present',
          };
        }
      }
      return updated;
    });
    success(`Applied ${batchCommonIn} - ${batchCommonOut} to all selected workers.`);
  };

  const handleSetSelectedStatus = (status: AttendanceStatus) => {
    setBatchRows((prev) => {
      const updated = { ...prev };
      for (const emp of batchEmployees) {
        if (updated[emp.id] && updated[emp.id].selected) {
          updated[emp.id] = {
            ...updated[emp.id],
            status,
          };
        }
      }
      return updated;
    });
    success(`Marked selected workers as ${status.replace('_', ' ').toUpperCase()}.`);
  };

  // Handle batch save
  const handleSaveBatch = async () => {
    const selectedList = batchEmployees.filter((emp) => batchRows[emp.id]?.selected);
    if (selectedList.length === 0) {
      error('No employees selected to save.');
      return;
    }

    try {
      const entries = selectedList.map((emp) => {
        const row = batchRows[emp.id];
        const isPresent = row.status === 'present' || row.status === 'half_day';
        return {
          employeeId: emp.id,
          date: selectedDate,
          checkIn: isPresent ? row.checkIn : null,
          checkOut: isPresent ? row.checkOut : null,
          status: row.status,
          remarks: `${row.remarks} (Batch Log by ${currentEmployee?.name || 'HR'})`,
        };
      });

      await batchManualMutation.mutateAsync(entries);
      success(`Saved manual attendance for ${entries.length} workers on ${selectedDate}.`);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to save batch attendance');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Modal Header */}
        <div className="bg-stone-950 px-5 py-4 border-b border-stone-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500 text-stone-950 uppercase">
                Manual Attendance Entry
              </span>
              <span className="text-stone-400 font-mono text-xs">
                No Biometric Hardware Mode
              </span>
            </div>
            <h2 className="font-display font-bold text-lg text-stone-100 mt-1">
              Shop Floor Log In & Log Out Time Register
            </h2>
            <p className="text-stone-400 text-xs mt-0.5">
              Admin & HR manual attendance punch entry with calculated work hours, overtime, and grace-period late mark detection.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-200 border border-stone-800 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Date Toolbar & Mode Tabs */}
        <div className="bg-stone-950/80 px-5 py-2.5 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-stone-900 border border-stone-700 px-2.5 py-1 text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-stone-400 font-mono">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-stone-100 font-mono text-xs focus:outline-none"
              />
            </div>

            <span className="text-[11px] font-mono text-stone-500 hidden sm:inline">
              ({existingDateRecords.length} records currently logged on this date)
            </span>
          </div>

          <div className="flex items-center gap-1 bg-stone-900 border border-stone-800 p-0.5">
            <button
              onClick={() => setActiveTab('single')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition ${
                activeTab === 'single'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Single Worker Punch</span>
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition ${
                activeTab === 'batch'
                  ? 'bg-amber-500 text-stone-950'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Daily Floor Roster (Batch Entry)</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* ========================================== */}
          {/* TAB 1: SINGLE WORKER PUNCH ENTRY */}
          {/* ========================================== */}
          {activeTab === 'single' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {/* Worker Selection */}
              <div className="bg-stone-950 p-4 border border-stone-800 space-y-3">
                <label className="block text-[11px] font-mono text-stone-300 uppercase tracking-wider">
                  1. Select Employee / Worker
                </label>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter employee list by code or name..."
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-700 pl-9 pr-3 py-1.5 text-stone-200 text-xs mb-2"
                  />
                </div>

                <select
                  value={singleEmpId}
                  onChange={(e) => setSingleEmpId(Number(e.target.value))}
                  className="w-full bg-stone-900 border border-stone-700 p-2 text-stone-100 text-xs font-medium"
                >
                  {employees
                    .filter(
                      (e) =>
                        !empSearch ||
                        e.name.toLowerCase().includes(empSearch.toLowerCase()) ||
                        e.employeeCode.toLowerCase().includes(empSearch.toLowerCase()) ||
                        e.designation.toLowerCase().includes(empSearch.toLowerCase())
                    )
                    .map((emp) => {
                      const dept = departments.find((d) => d.id === emp.departmentId);
                      const sh = shifts.find((s) => s.id === emp.shiftId);
                      return (
                        <option key={emp.id} value={emp.id}>
                          {emp.employeeCode} - {emp.name} ({emp.designation} | {dept?.name || 'Shop Floor'} | Shift: {sh?.name || 'General'})
                        </option>
                      );
                    })}
                </select>

                {/* Worker & Shift Information Card */}
                {selectedEmp && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-800/80 text-[11px]">
                    <div className="p-2 bg-stone-900/60 border border-stone-800">
                      <span className="text-stone-500 block font-mono uppercase text-[10px]">Worker Name & Code</span>
                      <span className="text-stone-200 font-semibold">{selectedEmp.name}</span>
                      <div className="text-[10px] text-stone-400 font-mono">{selectedEmp.employeeCode}</div>
                    </div>
                    <div className="p-2 bg-stone-900/60 border border-stone-800">
                      <span className="text-stone-500 block font-mono uppercase text-[10px]">Assigned Shift</span>
                      <span className="text-stone-200 font-semibold">{selectedShift?.name || 'Standard'}</span>
                      <div className="text-[10px] text-stone-400 font-mono">
                        {selectedShift?.startTime} - {selectedShift?.endTime} (Grace: {selectedShift?.graceMinutes || 15}m)
                      </div>
                    </div>
                    <div className="p-2 bg-stone-900/60 border border-stone-800">
                      <span className="text-stone-500 block font-mono uppercase text-[10px]">Current Status on {selectedDate}</span>
                      {singleExistingRecord ? (
                        <span className="text-amber-400 font-semibold uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {singleExistingRecord.status} ({singleExistingRecord.checkIn || '—'} to {singleExistingRecord.checkOut || '—'})
                        </span>
                      ) : (
                        <span className="text-stone-400 italic">No entry yet (Pending)</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Timing Entry Form */}
              <div className="bg-stone-950 p-4 border border-stone-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-stone-300 uppercase tracking-wider">
                    2. Attendance Status & Punch Times
                  </label>

                  {/* Pre-fill Shortcut Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedShift) {
                        setSingleCheckIn(selectedShift.startTime);
                        setSingleCheckOut(selectedShift.endTime);
                        setSingleStatus('present');
                        success(`Set standard shift timings: ${selectedShift.startTime} - ${selectedShift.endTime}`);
                      }
                    }}
                    className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[11px] flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Fill Shift Standard Times</span>
                  </button>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                    Attendance Status
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {(['present', 'half_day', 'absent', 'on_leave', 'weekly_off', 'holiday'] as AttendanceStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSingleStatus(st)}
                          className={`p-2 border text-center font-mono text-[11px] uppercase transition ${
                            singleStatus === st
                              ? 'border-amber-500 bg-amber-500/20 text-amber-300 font-bold'
                              : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:border-stone-700'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Punch Time Inputs (Only active for present & half_day) */}
                {(singleStatus === 'present' || singleStatus === 'half_day') && (
                  <div className="space-y-3 pt-2 border-t border-stone-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Log In (Check-in) */}
                      <div className="p-3 bg-stone-900 border border-stone-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-xs text-stone-300 uppercase font-semibold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Log In Time (Check-In)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              setSingleCheckIn(
                                `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
                              );
                            }}
                            className="text-[10px] text-amber-400 hover:underline font-mono"
                          >
                            Set Now
                          </button>
                        </div>
                        <input
                          type="time"
                          value={singleCheckIn}
                          onChange={(e) => setSingleCheckIn(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-100 font-mono text-base font-semibold focus:border-amber-500 focus:outline-none"
                        />
                        <div className="text-[10px] font-mono text-stone-400">
                          Shift Start: {selectedShift?.startTime} (Grace +{selectedShift?.graceMinutes || 15}m)
                        </div>
                      </div>

                      {/* Log Out (Check-out) */}
                      <div className="p-3 bg-stone-900 border border-stone-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="font-mono text-xs text-stone-300 uppercase font-semibold flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            <span>Log Out Time (Check-Out)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const now = new Date();
                              setSingleCheckOut(
                                `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
                              );
                            }}
                            className="text-[10px] text-amber-400 hover:underline font-mono"
                          >
                            Set Now
                          </button>
                        </div>
                        <input
                          type="time"
                          value={singleCheckOut}
                          onChange={(e) => setSingleCheckOut(e.target.value)}
                          className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-100 font-mono text-base font-semibold focus:border-amber-500 focus:outline-none"
                        />
                        <div className="text-[10px] font-mono text-stone-400">
                          Shift End: {selectedShift?.endTime}
                        </div>
                      </div>
                    </div>

                    {/* Calculated Metrics Badges */}
                    <div className="grid grid-cols-3 gap-3 p-3 bg-stone-900/50 border border-stone-800 font-mono text-center">
                      <div>
                        <span className="text-[10px] text-stone-500 block uppercase">Working Hours</span>
                        <span className="text-sm font-bold text-stone-100">
                          {singleCalculation.workingHours} Hours
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 block uppercase">Overtime Hours</span>
                        <span
                          className={`text-sm font-bold ${
                            singleCalculation.overtimeHours > 0 ? 'text-amber-400' : 'text-stone-400'
                          }`}
                        >
                          {singleCalculation.overtimeHours > 0
                            ? `+${singleCalculation.overtimeHours} Hours OT`
                            : '0.0 OT'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-500 block uppercase">Punctuality</span>
                        {singleCalculation.isLate ? (
                          <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Late (+{singleCalculation.lateMinutes}m)</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>On-Time</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Remarks / Logbook note */}
                <div>
                  <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                    Entry Remarks / Physical Logbook Note
                  </label>
                  <input
                    type="text"
                    value={singleRemarks}
                    onChange={(e) => setSingleRemarks(e.target.value)}
                    placeholder="e.g. Gate register page 14 entry, manual shift swap, manager verbal approval"
                    className="w-full bg-stone-900 border border-stone-700 p-2 text-stone-200 text-xs focus:outline-none focus:border-stone-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* TAB 2: DAILY FLOOR ROSTER (BATCH ENTRY) */}
          {/* ========================================== */}
          {activeTab === 'batch' && (
            <div className="space-y-4">
              {/* Batch Filters & Fast Action Toolbar */}
              <div className="bg-stone-950 p-3.5 border border-stone-800 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Filters */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-400 font-mono text-[11px]">Department:</span>
                      <select
                        value={batchDeptFilter}
                        onChange={(e) =>
                          setBatchDeptFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                        }
                        className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200 text-xs"
                      >
                        <option value="all">All Departments ({employees.length})</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-stone-400 font-mono text-[11px]">Shift:</span>
                      <select
                        value={batchShiftFilter}
                        onChange={(e) =>
                          setBatchShiftFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                        }
                        className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200 text-xs"
                      >
                        <option value="all">All Shifts</option>
                        {shifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.startTime}-{s.endTime})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="relative min-w-[160px]">
                      <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2 top-2" />
                      <input
                        type="text"
                        placeholder="Search worker..."
                        value={batchSearch}
                        onChange={(e) => setBatchSearch(e.target.value)}
                        className="bg-stone-900 border border-stone-700 pl-7 pr-2 py-1 text-stone-200 text-xs w-full"
                      />
                    </div>
                  </div>

                  {/* Selection Counter */}
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <button
                      onClick={() => handleSelectAllBatch(true)}
                      className="text-amber-400 hover:underline flex items-center gap-1"
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Select All ({batchEmployees.length})</span>
                    </button>
                    <span className="text-stone-600">|</span>
                    <button
                      onClick={() => handleSelectAllBatch(false)}
                      className="text-stone-400 hover:underline flex items-center gap-1"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Deselect All</span>
                    </button>
                  </div>
                </div>

                {/* Batch Rapid Application Toolbar */}
                <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-xs bg-stone-900/40 p-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-stone-400 font-mono text-[11px]">Mass Actions on Selected:</span>
                    <button
                      onClick={handleApplyShiftTimingsAll}
                      className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-200 text-[11px] font-medium flex items-center gap-1"
                      title="Apply each worker's assigned shift start and end time"
                    >
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>Apply Respective Shift Timings</span>
                    </button>

                    <div className="flex items-center gap-1 bg-stone-950 border border-stone-700 px-2 py-0.5">
                      <span className="text-stone-400 text-[10px] font-mono">In:</span>
                      <input
                        type="time"
                        value={batchCommonIn}
                        onChange={(e) => setBatchCommonIn(e.target.value)}
                        className="bg-transparent text-stone-200 font-mono text-xs w-16"
                      />
                      <span className="text-stone-400 text-[10px] font-mono">Out:</span>
                      <input
                        type="time"
                        value={batchCommonOut}
                        onChange={(e) => setBatchCommonOut(e.target.value)}
                        className="bg-transparent text-stone-200 font-mono text-xs w-16"
                      />
                      <button
                        onClick={handleApplyCommonTimings}
                        className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[10px] uppercase font-mono"
                      >
                        Apply Times
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-stone-500 text-[10px] font-mono">Set Status:</span>
                    <button
                      onClick={() => handleSetSelectedStatus('present')}
                      className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono uppercase"
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleSetSelectedStatus('half_day')}
                      className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px] font-mono uppercase"
                    >
                      Half Day
                    </button>
                    <button
                      onClick={() => handleSetSelectedStatus('absent')}
                      className="px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-500/40 text-[10px] font-mono uppercase"
                    >
                      Absent
                    </button>
                  </div>
                </div>
              </div>

              {/* Roster Table */}
              <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
                      <th className="p-2.5 w-10 text-center">Sel</th>
                      <th className="p-2.5">Worker</th>
                      <th className="p-2.5">Shift</th>
                      <th className="p-2.5">Log In (In Time)</th>
                      <th className="p-2.5">Log Out (Out Time)</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Calculated Hours</th>
                      <th className="p-2.5 text-right">Quick Reset</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/60 font-mono">
                    {batchEmployees.map((emp) => {
                      const row = batchRows[emp.id] || {
                        employeeId: emp.id,
                        selected: false,
                        checkIn: '08:00',
                        checkOut: '17:00',
                        status: 'present',
                        remarks: 'Manual floor register',
                      };
                      const empShift = shifts.find((s) => s.id === emp.shiftId) || shifts[0];
                      const dept = departments.find((d) => d.id === emp.departmentId);

                      // Calculate hours for this row
                      let calcHours = 0;
                      let calcOt = 0;
                      let isLate = false;
                      let lateMin = 0;

                      if (row.checkIn && empShift) {
                        const [sH, sM] = empShift.startTime.split(':').map(Number);
                        const [iH, iM] = row.checkIn.split(':').map(Number);
                        const shiftMin = sH * 60 + sM;
                        const inMin = iH * 60 + iM;
                        if (inMin > shiftMin + (empShift.graceMinutes || 15)) {
                          isLate = true;
                          lateMin = inMin - shiftMin;
                        }
                      }

                      if (row.checkIn && row.checkOut && (row.status === 'present' || row.status === 'half_day')) {
                        const [iH, iM] = row.checkIn.split(':').map(Number);
                        const [oH, oM] = row.checkOut.split(':').map(Number);
                        let diff = oH * 60 + oM - (iH * 60 + iM);
                        if (diff < 0) diff += 24 * 60;
                        calcHours = Number((diff / 60).toFixed(1));
                        calcOt = calcHours > 8.0 ? Number((calcHours - 8.0).toFixed(1)) : 0;
                      }

                      return (
                        <tr
                          key={emp.id}
                          className={`hover:bg-stone-900/40 transition ${
                            row.selected ? 'bg-stone-900/20' : 'opacity-60'
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              onChange={(e) => updateBatchRow(emp.id, 'selected', e.target.checked)}
                              className="accent-amber-500 cursor-pointer"
                            />
                          </td>

                          <td className="p-2.5 font-sans">
                            <div className="font-semibold text-stone-200">{emp.name}</div>
                            <div className="text-[10px] text-stone-500 font-mono">
                              {emp.employeeCode} • {dept?.name || 'Shop Floor'}
                            </div>
                          </td>

                          <td className="p-2.5 text-stone-300">
                            <span className="text-[11px] block">{empShift?.name}</span>
                            <span className="text-[10px] text-stone-500">
                              {empShift?.startTime}-{empShift?.endTime}
                            </span>
                          </td>

                          <td className="p-2.5">
                            <input
                              type="time"
                              value={row.checkIn}
                              disabled={!row.selected || row.status === 'absent' || row.status === 'on_leave'}
                              onChange={(e) => updateBatchRow(emp.id, 'checkIn', e.target.value)}
                              className="bg-stone-900 border border-stone-700 p-1 text-stone-100 font-mono text-xs w-28 disabled:opacity-30"
                            />
                            {isLate && (
                              <span className="block text-[9px] text-amber-400 font-sans mt-0.5">
                                Late +{lateMin}m
                              </span>
                            )}
                          </td>

                          <td className="p-2.5">
                            <input
                              type="time"
                              value={row.checkOut}
                              disabled={!row.selected || row.status === 'absent' || row.status === 'on_leave'}
                              onChange={(e) => updateBatchRow(emp.id, 'checkOut', e.target.value)}
                              className="bg-stone-900 border border-stone-700 p-1 text-stone-100 font-mono text-xs w-28 disabled:opacity-30"
                            />
                          </td>

                          <td className="p-2.5">
                            <select
                              value={row.status}
                              disabled={!row.selected}
                              onChange={(e) =>
                                updateBatchRow(emp.id, 'status', e.target.value as AttendanceStatus)
                              }
                              className="bg-stone-900 border border-stone-700 p-1 text-stone-200 text-xs font-sans disabled:opacity-30"
                            >
                              <option value="present">Present</option>
                              <option value="half_day">Half Day</option>
                              <option value="absent">Absent</option>
                              <option value="on_leave">On Leave</option>
                              <option value="weekly_off">Weekly Off</option>
                              <option value="holiday">Holiday</option>
                            </select>
                          </td>

                          <td className="p-2.5">
                            {row.status === 'present' || row.status === 'half_day' ? (
                              <div>
                                <span className="font-bold text-stone-200">{calcHours} hrs</span>
                                {calcOt > 0 && (
                                  <span className="text-[10px] text-amber-400 block">
                                    (+{calcOt}h OT)
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-stone-500">—</span>
                            )}
                          </td>

                          <td className="p-2.5 text-right font-sans">
                            <button
                              type="button"
                              onClick={() => {
                                if (empShift) {
                                  updateBatchRow(emp.id, 'checkIn', empShift.startTime);
                                  updateBatchRow(emp.id, 'checkOut', empShift.endTime);
                                  updateBatchRow(emp.id, 'status', 'present');
                                }
                              }}
                              className="px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] border border-stone-700 font-mono"
                              title="Reset row to shift standard timing"
                            >
                              Shift Time
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Bar */}
        <div className="bg-stone-950 px-5 py-3 border-t border-stone-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-stone-400 font-mono">
            {activeTab === 'single' ? (
              <span>Target: {selectedEmp ? `${selectedEmp.name} (${selectedDate})` : 'None'}</span>
            ) : (
              <span>
                Selected: {batchEmployees.filter((e) => batchRows[e.id]?.selected).length} of{' '}
                {batchEmployees.length} workers on {selectedDate}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold"
            >
              Cancel
            </button>

            {activeTab === 'single' ? (
              <button
                type="button"
                onClick={handleSaveSingle}
                disabled={recordManualMutation.isPending}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {recordManualMutation.isPending
                    ? 'Saving Record...'
                    : 'Save Single Attendance Entry'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveBatch}
                disabled={batchManualMutation.isPending}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {batchManualMutation.isPending
                    ? 'Saving Roster...'
                    : `Save Daily Attendance (${batchEmployees.filter((e) => batchRows[e.id]?.selected).length} Records)`}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
