/**
 * Attendance Main View
 * Tabbed operational view connecting:
 * - Flagship Rich Calendar
 * - Muster-Roll Grid Matrix
 * - Daily Punch List
 * - Punch Regularization Approval Queue
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useEmployees,
  useMonthlyRegister,
  useHolidays,
  useWeeklyOffs,
  useShifts,
  useDepartments,
  useRegularizationRequests,
  useApproveRegularization,
  useRejectRegularization,
} from '../../hooks/useHRM';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AttendanceCalendar } from './AttendanceCalendar';
import { AttendanceGrid } from './AttendanceGrid';
import { AttendanceList } from './AttendanceList';
import { RegularizeModal } from './RegularizeModal';
import { BulkMarkModal } from './BulkMarkModal';
import { ManualAttendanceModal } from './ManualAttendanceModal';
import {
  CalendarDays,
  Grid,
  List,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export function AttendanceView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, employee, session } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'calendar' | 'grid' | 'list' | 'regularize'>('calendar');
  const [currentDate, setCurrentDate] = useState('2026-09-05');
  const [showRegularizeModal, setShowRegularizeModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualModalInitialEmpId, setManualModalInitialEmpId] = useState<number | undefined>(undefined);

  // Check URL query param for quick manual entry trigger
  useEffect(() => {
    if (searchParams.get('action') === 'manual') {
      setShowManualModal(true);
      // Clean query param
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Dynamic month & year from selected date
  const [currYear, currMonth] = currentDate.split('-').map(Number);

  // Queries
  const { data: employees = [] } = useEmployees({ isActive: true });
  const { data: attendanceRecords = [] } = useMonthlyRegister(currMonth || 9, currYear || 2026);
  const { data: holidays = [] } = useHolidays(currYear || 2026);
  const { data: weeklyOffs = [] } = useWeeklyOffs();
  const { data: shifts = [] } = useShifts();
  const { data: departments = [] } = useDepartments();

  const { data: regularizationRequests = [] } = useRegularizationRequests(
    undefined,
    session?.supervisorDepartments
  );

  const approveRegMutation = useApproveRegularization();
  const rejectRegMutation = useRejectRegularization();

  const pendingRegsCount = regularizationRequests.filter((r) => r.status === 'pending').length;

  const handleApproveReg = async (id: number) => {
    if (!employee) return;
    try {
      await approveRegMutation.mutateAsync({
        id,
        actionedBy: employee.id,
        comments: 'Verified with manual log register & approved.',
      });
      success('Punch regularization approved. Attendance updated.');
    } catch (err: any) {
      error(err.message || 'Failed to approve');
    }
  };

  const handleRejectReg = async (id: number) => {
    if (!employee) return;
    try {
      await rejectRegMutation.mutateAsync({
        id,
        actionedBy: employee.id,
        comments: 'Discrepancy in gate register log.',
      });
      success('Punch regularization rejected.');
    } catch (err: any) {
      error(err.message || 'Failed to reject');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950 border border-stone-800 p-4">
        <div>
          <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
            Biometric & Floor Attendance
          </div>
          <h1 className="font-display font-bold text-xl text-stone-100 tracking-tight">
            Attendance & Muster Operations
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Manual Attendance Entry (Admin & HR / Supervisor - No Biometric) */}
          {(role === 'admin' || role === 'supervisor') && (
            <button
              onClick={() => {
                setManualModalInitialEmpId(undefined);
                setShowManualModal(true);
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition"
              title="Manual check-in and check-out time entry for shop floor workers without biometric device"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Manual Time Entry (In & Out)</span>
            </button>
          )}

          {/* Raise Regularization (Available to all, especially workers) */}
          <button
            onClick={() => setShowRegularizeModal(true)}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Regularize Missed Punch</span>
          </button>

          {/* Bulk Mark Attendance (Admin & Supervisor) */}
          {(role === 'admin' || role === 'supervisor') && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-stone-400" />
              <span>Bulk Status Mark</span>
            </button>
          )}
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center border-b border-stone-800 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'calendar'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Interactive Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('grid')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'grid'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Grid className="w-4 h-4" />
          <span>Muster-Roll Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'list'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <List className="w-4 h-4" />
          <span>Daily Punch List</span>
        </button>

        <button
          onClick={() => setActiveTab('regularize')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'regularize'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Regularization Requests</span>
          {pendingRegsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
              {pendingRegsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'calendar' && (
        <AttendanceCalendar
          employees={employees}
          attendanceRecords={attendanceRecords}
          holidays={holidays}
          weeklyOffs={weeklyOffs}
          shifts={shifts}
        />
      )}

      {activeTab === 'grid' && (
        <AttendanceGrid
          employees={employees}
          attendanceRecords={attendanceRecords}
          departments={departments}
        />
      )}

      {activeTab === 'list' && (
        <AttendanceList
          employees={employees}
          attendanceRecords={attendanceRecords}
          departments={departments}
          shifts={shifts}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onOpenManualAttendance={(empId) => {
            setManualModalInitialEmpId(empId);
            setShowManualModal(true);
          }}
        />
      )}

      {activeTab === 'regularize' && (
        <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-stone-800 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-stone-200 text-base uppercase tracking-wide">
                Punch Regularization Workflow
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                Workers submit missed or faulty biometric punches for supervisory verification.
              </p>
            </div>
            <button
              onClick={() => setShowRegularizeModal(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase font-mono tracking-wider flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Raise Request</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
                  <th className="p-3">Worker Info</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Requested In / Out</th>
                  <th className="p-3">Worker Reason</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {regularizationRequests.length > 0 ? (
                  regularizationRequests.map((req) => {
                    const emp = employees.find((e) => e.id === req.employeeId);
                    const canAction = role === 'admin' || role === 'supervisor';
                    return (
                      <tr key={req.id} className="hover:bg-stone-900/40">
                        <td className="p-3">
                          <div className="font-semibold text-stone-200">{emp?.name || 'Worker'}</div>
                          <div className="text-[10px] text-stone-500 font-mono">
                            {emp?.employeeCode} • {emp?.designation}
                          </div>
                        </td>
                        <td className="p-3 font-mono text-stone-300">{req.date}</td>
                        <td className="p-3 font-mono text-stone-300">
                          {req.requestedCheckIn} — {req.requestedCheckOut}
                        </td>
                        <td className="p-3 text-stone-400 max-w-xs">{req.reason}</td>
                        <td className="p-3">
                          <span
                            className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase border ${
                              req.status === 'approved'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : req.status === 'rejected'
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {req.status === 'pending' && canAction ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveReg(req.id)}
                                disabled={approveRegMutation.isPending}
                                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleRejectReg(req.id)}
                                disabled={rejectRegMutation.isPending}
                                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] font-semibold flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-stone-500 text-[11px] font-mono">
                              {req.comments || 'Resolved'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-stone-500">
                      No punch regularization requests submitted.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showRegularizeModal && (
        <RegularizeModal
          isOpen={showRegularizeModal}
          onClose={() => setShowRegularizeModal(false)}
        />
      )}

      {showBulkModal && (
        <BulkMarkModal
          isOpen={showBulkModal}
          onClose={() => setShowBulkModal(false)}
          employees={employees}
        />
      )}

      {showManualModal && (
        <ManualAttendanceModal
          isOpen={showManualModal}
          onClose={() => {
            setShowManualModal(false);
            setManualModalInitialEmpId(undefined);
          }}
          employees={employees}
          shifts={shifts}
          departments={departments}
          defaultDate={currentDate}
          initialEmployeeId={manualModalInitialEmpId}
        />
      )}
    </div>
  );
}
