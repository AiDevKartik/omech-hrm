/**
 * Leave Management View
 * Features:
 * - Pending Approvals Queue (scoped to supervisor's departments)
 * - Complete Leave Ledger per worker (Opening, Accrued, Taken, Balance)
 * - Pure rule-engine balance recalculation with transparent audit breakdown
 */

import React, { useState } from 'react';
import {
  useLeaveTypes,
  useAllLeaves,
  useAllLeaveBalances,
  useEmployees,
  useHolidays,
  useApproveLeave,
  useRejectLeave,
  useRecalculateLeaveBalances,
} from '../../hooks/useHRM';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ApplyLeaveModal } from './ApplyLeaveModal';
import {
  FileSpreadsheet,
  PlusCircle,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';

export function LeaveView() {
  const { role, employee, session } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'pending' | 'ledger' | 'history'>('pending');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [rejectComments, setRejectComments] = useState<{ [id: number]: string }>({});
  const [selectedLedgerEmpId, setSelectedLedgerEmpId] = useState<number | 'all'>('all');

  // Queries
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: employees = [] } = useEmployees({ isActive: true });
  const { data: allLeaves = [] } = useAllLeaves(
    role === 'worker' ? { employeeId: employee?.id } : undefined
  );
  const { data: allBalances = [] } = useAllLeaveBalances(2026);
  const { data: holidays = [] } = useHolidays(2026);

  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();
  const recalculateMutation = useRecalculateLeaveBalances();

  // Filter pending leaves based on supervisor scoped departments
  const pendingLeaves = allLeaves.filter((l) => {
    if (l.status !== 'pending') return false;
    if (role === 'admin') return true;
    if (role === 'supervisor') {
      const applicant = employees.find((e) => e.id === l.employeeId);
      return applicant && session?.supervisorDepartments?.includes(applicant.departmentId);
    }
    return l.employeeId === employee?.id;
  });

  const handleApprove = async (id: number) => {
    if (!employee) return;
    try {
      await approveMutation.mutateAsync({
        id,
        actionedBy: employee.id,
        comments: 'Approved per department shift balance.',
      });
      success('Leave request approved. Daily attendance updated.');
    } catch (err: any) {
      error(err.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    if (!employee) return;
    try {
      const comment = rejectComments[id] || 'Production load constraints.';
      await rejectMutation.mutateAsync({
        id,
        actionedBy: employee.id,
        comments: comment,
      });
      success('Leave request rejected.');
    } catch (err: any) {
      error(err.message || 'Failed to reject');
    }
  };

  const handleRecalculateAll = async () => {
    try {
      const updated = await recalculateMutation.mutateAsync(2026);
      success(
        `Leave Rule Engine executed: Re-scanned attendance records across ${employees.length} workers. Accrual rules applied.`
      );
    } catch (err: any) {
      error(err.message || 'Recalculation failed');
    }
  };

  // Filter ledger records
  const filteredBalances = allBalances.filter((b) =>
    selectedLedgerEmpId === 'all' ? true : b.employeeId === selectedLedgerEmpId
  );

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950 border border-stone-800 p-4">
        <div>
          <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
            Statutory & Factory Leave
          </div>
          <h1 className="font-display font-bold text-xl text-stone-100 tracking-tight">
            Leave Ledger & Approval Center
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Recalculate balances (Admin action) */}
          {role === 'admin' && (
            <button
              onClick={handleRecalculateAll}
              disabled={recalculateMutation.isPending}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-700 text-xs font-semibold uppercase font-mono tracking-wider flex items-center gap-1.5"
              title="Run rule-engine scan over attendance to update earned leave streaks"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculateMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{recalculateMutation.isPending ? 'Recalculating...' : 'Recalculate Balances'}</span>
            </button>
          )}

          <button
            onClick={() => setShowApplyModal(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Apply for Leave</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-stone-800 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'pending'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals</span>
          {pendingLeaves.length > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono">
              {pendingLeaves.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'ledger'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Leave Ledger Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition ${
            activeTab === 'history'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>All Leave Applications</span>
        </button>
      </div>

      {/* TAB 1: PENDING APPROVALS QUEUE */}
      {activeTab === 'pending' && (
        <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-stone-800 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-stone-200 text-sm uppercase tracking-wide">
                Leave Requests Requiring Action
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {role === 'supervisor'
                  ? 'Showing workers from your supervised department shifts.'
                  : 'Global supervisory queue across all departments.'}
              </p>
            </div>
            <span className="font-mono text-xs text-amber-400">
              {pendingLeaves.length} pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
                  <th className="p-3">Worker Info</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Date Range</th>
                  <th className="p-3">Days</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3 text-right">Supervisory Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {pendingLeaves.length > 0 ? (
                  pendingLeaves.map((req) => {
                    const emp = employees.find((e) => e.id === req.employeeId);
                    const lt = leaveTypes.find((t) => t.id === req.leaveTypeId);
                    const canAction = role === 'admin' || role === 'supervisor';

                    return (
                      <tr key={req.id} className="hover:bg-stone-900/40">
                        <td className="p-3">
                          <div className="font-semibold text-stone-200">{emp?.name || 'Worker'}</div>
                          <div className="text-[10px] text-stone-500 font-mono">
                            {emp?.employeeCode} • {emp?.designation}
                          </div>
                        </td>

                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 bg-stone-900 text-stone-300 border border-stone-700 text-[10px] font-mono uppercase">
                            {lt?.name || lt?.label || 'Casual Leave'}
                          </span>
                        </td>

                        <td className="p-3 font-mono text-stone-300">
                          {req.startDate} to {req.endDate}
                        </td>

                        <td className="p-3 font-mono font-bold text-amber-400">
                          {req.daysCount} d
                        </td>

                        <td className="p-3 text-stone-400 max-w-xs">{req.reason}</td>

                        <td className="p-3 text-right">
                          {canAction ? (
                            <div className="flex items-center justify-end gap-2">
                              <input
                                type="text"
                                placeholder="Comment..."
                                value={rejectComments[req.id] || ''}
                                onChange={(e) =>
                                  setRejectComments({ ...rejectComments, [req.id]: e.target.value })
                                }
                                className="bg-stone-900 border border-stone-700 px-2 py-1 text-[11px] text-stone-200 w-28"
                              />
                              <button
                                onClick={() => handleApprove(req.id)}
                                disabled={approveMutation.isPending}
                                className="px-2.5 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold flex items-center gap-1"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                disabled={rejectMutation.isPending}
                                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] font-semibold flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-stone-500 text-[11px] font-mono">
                              Awaiting Supervisor Action
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-stone-500">
                      No leave requests pending supervisory approval.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: LEAVE LEDGER MATRIX */}
      {activeTab === 'ledger' && (
        <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-hidden space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-400 font-mono">Filter Worker:</span>
              <select
                value={selectedLedgerEmpId}
                onChange={(e) =>
                  setSelectedLedgerEmpId(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200"
              >
                <option value="all">All Workforce ({employees.length} workers)</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-stone-900 border border-stone-800 px-3 py-1 text-[11px] text-stone-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-500" />
              <span>Calculated via pure rule engine: Opening + Accrued - Consumed</span>
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
                  <th className="p-3">Worker</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3 text-center">Opening Balance</th>
                  <th className="p-3 text-center text-emerald-400">Accrued YTD</th>
                  <th className="p-3 text-center text-red-400">Consumed / Taken</th>
                  <th className="p-3 text-center text-amber-400 font-bold">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {filteredBalances.map((b) => {
                  const emp = employees.find((e) => e.id === b.employeeId);
                  const lt = leaveTypes.find((t) => t.id === b.leaveTypeId);
                  return (
                    <tr key={`${b.employeeId}-${b.leaveTypeId}`} className="hover:bg-stone-900/40">
                      <td className="p-3">
                        <div className="font-sans font-semibold text-stone-200">{emp?.name}</div>
                        <div className="text-[10px] text-stone-500">
                          {emp?.employeeCode} • {emp?.category === 'permanent_staff' ? 'Staff' : 'Contractor'}
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-sans font-medium text-stone-300">
                          {lt?.name || lt?.label} ({lt?.code})
                        </span>
                      </td>

                      <td className="p-3 text-center text-stone-400">{b.openingBalance} d</td>
                      <td className="p-3 text-center text-emerald-400">+{b.accrued} d</td>
                      <td className="p-3 text-center text-red-400">-{b.taken} d</td>
                      <td className="p-3 text-center font-bold text-amber-400 text-sm">
                        {b.currentBalance ?? b.closingBalance ?? 0} d
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ALL LEAVE HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
                  <th className="p-3">Application ID</th>
                  <th className="p-3">Worker</th>
                  <th className="p-3">Leave Type</th>
                  <th className="p-3">Range</th>
                  <th className="p-3">Days</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Remarks / Comments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {allLeaves.map((l) => {
                  const emp = employees.find((e) => e.id === l.employeeId);
                  const lt = leaveTypes.find((t) => t.id === l.leaveTypeId);
                  return (
                    <tr key={l.id} className="hover:bg-stone-900/40">
                      <td className="p-3 font-mono text-stone-500">#LV-{l.id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-stone-200">{emp?.name}</div>
                        <div className="text-[10px] text-stone-500 font-mono">{emp?.employeeCode}</div>
                      </td>
                      <td className="p-3 font-medium text-stone-300">{lt?.name || lt?.label}</td>
                      <td className="p-3 font-mono text-stone-400">
                        {l.startDate} to {l.endDate}
                      </td>
                      <td className="p-3 font-mono text-stone-200">{l.daysCount} d</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase border ${
                            l.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : l.status === 'rejected'
                              ? 'bg-red-500/10 text-red-400 border-red-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3 text-stone-400 text-xs">
                        {l.comments || l.reason}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showApplyModal && (
        <ApplyLeaveModal
          isOpen={showApplyModal}
          onClose={() => setShowApplyModal(false)}
          employees={employees}
          leaveTypes={leaveTypes}
          holidays={holidays}
        />
      )}
    </div>
  );
}
