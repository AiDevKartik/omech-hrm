/**
 * Dashboard View
 * Role-aware gauges, threshold breach alerts, pending approval queues,
 * upcoming plant holidays, and operational attendance trend charts.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  useAttendanceSummary,
  usePendingLeaves,
  useHolidays,
  useEmployees,
  useMonthlyRegister,
  useLateMarkPolicy,
} from '../../hooks/useHRM';
import { STRINGS } from '../../constants/strings';
import {
  Users,
  CheckCircle2,
  Clock,
  UserX,
  AlertTriangle,
  Calendar,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Coins,
  HardHat,
  Factory,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export function DashboardView() {
  const navigate = useNavigate();
  const { role, employee, session } = useAuth();
  const todayStr = '2026-09-05';

  const { data: summary, isLoading: isSummaryLoading } = useAttendanceSummary(
    todayStr,
    role === 'supervisor' ? session?.departmentId : undefined
  );

  const { data: pendingLeaves } = usePendingLeaves(session?.supervisorDepartments);
  const { data: holidays } = useHolidays(2026);
  const { data: employees } = useEmployees({ isActive: true });
  const { data: augustAttendance } = useMonthlyRegister(8, 2026);
  const { data: latePolicy } = useLateMarkPolicy();

  // Find employees who crossed late-mark thresholds in August / current period
  const lateMarkBreaches: {
    employee: any;
    count: number;
    consequence: string;
    consequenceType: string;
  }[] = [];

  if (employees && augustAttendance && latePolicy?.ladder) {
    for (const emp of employees) {
      const empAugRecords = augustAttendance.filter((r) => r.employeeId === emp.id);
      const lateCount = empAugRecords.filter((r) => r.isLate).length;

      if (lateCount >= 3) {
        // find matching ladder consequence
        const sorted = [...latePolicy.ladder].sort((a, b) => b.thresholdCount - a.thresholdCount);
        const match = sorted.find((row) => lateCount >= row.thresholdCount);
        if (match) {
          lateMarkBreaches.push({
            employee: emp,
            count: lateCount,
            consequence: match.label,
            consequenceType: match.consequenceType,
          });
        }
      }
    }
  }

  // Upcoming holidays (from today onwards)
  const upcomingHolidays = (holidays || [])
    .filter((h) => h.date >= todayStr)
    .slice(0, 4);

  // 7-day attendance trend data for Recharts
  const trendData = [
    { date: '08/30', present: 16, absent: 2, late: 3 },
    { date: '08/31', present: 17, absent: 1, late: 2 },
    { date: '09/01', present: 17, absent: 1, late: 1 },
    { date: '09/02', present: 16, absent: 2, late: 4 },
    { date: '09/03', present: 18, absent: 0, late: 2 },
    { date: '09/04', present: 17, absent: 1, late: 3 },
    { date: '09/05', present: summary?.present || 15, absent: summary?.absent || 2, late: summary?.late || 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Role Context */}
      <div className="bg-stone-950 border border-stone-800 p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-wider mb-1">
            <Factory className="w-3.5 h-3.5" />
            <span>Shop Floor Operations • Plant 01</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-stone-100 tracking-tight">
            Welcome, {employee?.name || 'Authorized Personnel'}
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            {role === 'admin' && 'Full Administrator access: Plant muster, statutory compliance, payroll & configuration masters.'}
            {role === 'supervisor' && `Supervisor console: Scoped to Mill & Processing units (${session?.supervisorDepartments?.length || 2} assigned departments).`}
            {role === 'worker' && 'Worker self-service portal: Check your live punch status, leave ledger & monthly payslips.'}
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex flex-wrap gap-2">
          {(role === 'admin' || role === 'supervisor') && (
            <button
              onClick={() => navigate('/attendance?action=manual')}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition"
              title="Manual check-in and check-out time entry (No Biometric)"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Manual Time Entry</span>
            </button>
          )}

          <button
            onClick={() => navigate('/attendance')}
            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold uppercase tracking-wider border border-stone-700 flex items-center gap-1.5"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Attendance Calendar</span>
          </button>

          {role === 'admin' && (
            <button
              onClick={() => navigate('/payroll')}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Statutory Payroll</span>
            </button>
          )}

          <button
            onClick={() => navigate('/leave')}
            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold uppercase tracking-wider border border-stone-700 flex items-center gap-1.5"
          >
            <FileCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Leave Requests</span>
          </button>
        </div>
      </div>

      {/* Role-Aware Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Headcount */}
        <div className="bg-stone-900 border border-stone-800 p-4">
          <div className="flex items-center justify-between text-stone-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Plant Headcount</span>
            <Users className="w-4 h-4 text-stone-500" />
          </div>
          <div className="font-display font-bold text-3xl text-stone-100">
            {isSummaryLoading ? '...' : summary?.totalHeadcount || 18}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1">
            <HardHat className="w-3 h-3 text-amber-500" />
            <span>12 Contractual • 6 Staff</span>
          </div>
        </div>

        {/* Present on Floor */}
        <div className="bg-stone-900 border border-stone-800 p-4">
          <div className="flex items-center justify-between text-stone-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Present Today</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-display font-bold text-3xl text-emerald-400">
            {isSummaryLoading ? '...' : summary?.present || 0}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            {summary?.onShift || 0} currently active on shift
          </div>
        </div>

        {/* Absent */}
        <div className="bg-stone-900 border border-stone-800 p-4">
          <div className="flex items-center justify-between text-stone-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Absent</span>
            <UserX className="w-4 h-4 text-red-500" />
          </div>
          <div className="font-display font-bold text-3xl text-red-400">
            {isSummaryLoading ? '...' : summary?.absent || 0}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {summary?.onLeave || 0} approved on leave
          </div>
        </div>

        {/* Late Today */}
        <div className="bg-stone-900 border border-stone-800 p-4">
          <div className="flex items-center justify-between text-stone-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Late Check-in</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-display font-bold text-3xl text-amber-400">
            {isSummaryLoading ? '...' : summary?.late || 0}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Exceeded shift grace period
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-stone-900 border border-stone-800 p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-stone-400 text-xs font-mono uppercase tracking-wider mb-2">
            <span>Approvals Queue</span>
            <FileCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-display font-bold text-3xl text-blue-400">
            {pendingLeaves?.length || 0}
          </div>
          <div className="text-[11px] text-stone-400 mt-1">
            Pending supervisor action
          </div>
        </div>
      </div>

      {/* Disciplinary Policy Threshold Alerts */}
      {lateMarkBreaches.length > 0 && (
        <div className="bg-stone-900 border border-amber-600/40 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="font-display font-bold text-sm tracking-wide text-amber-400 uppercase">
              {STRINGS.WARNING_LATE_MARK_TITLE}
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              (Evaluated per Late Mark Policy Master)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lateMarkBreaches.map((b) => (
              <div
                key={b.employee.id}
                className="bg-stone-950 border border-stone-800 p-3 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-stone-200">{b.employee.name}</span>
                    <span className="text-[10px] font-mono text-stone-400 px-1 bg-stone-800 border border-stone-700">
                      {b.employee.employeeCode}
                    </span>
                  </div>
                  <div className="text-xs text-stone-400 mt-1">
                    Recorded <span className="font-mono font-bold text-amber-400">{b.count} late marks</span> this cycle.
                  </div>
                  <div className="mt-1.5 inline-block text-[11px] font-medium px-2 py-0.5 bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    {b.consequence}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-stone-800 text-stone-300 border border-stone-700">
                    {b.employee.category === 'permanent_staff' ? 'Staff' : 'Contractor'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Middle Section: Attendance Trend & Pending Approvals Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Trend Chart */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" />
              <h2 className="font-display font-bold text-base text-stone-200 tracking-wide uppercase">
                Plant Attendance Trend (Past 7 Days)
              </h2>
            </div>
            <span className="text-[11px] text-stone-400 font-mono">Total Roster: 18 Workers</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} barGap={4}>
                <XAxis dataKey="date" stroke="#78716c" fontSize={11} />
                <YAxis stroke="#78716c" fontSize={11} domain={[0, 20]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1c1917',
                    borderColor: '#44403c',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="present" name="Present" fill="#10B981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="late" name="Late Check-in" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="#EF4444" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pending Approvals & Upcoming Plant Holidays */}
        <div className="space-y-4">
          {/* Pending Approvals Widget */}
          <div className="bg-stone-900 border border-stone-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display font-bold text-sm tracking-wide text-stone-200 uppercase">
                Pending Leave Queue
              </div>
              <button
                onClick={() => navigate('/leave')}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-mono"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {pendingLeaves && pendingLeaves.length > 0 ? (
              <div className="space-y-2">
                {pendingLeaves.slice(0, 3).map((req) => {
                  const emp = employees?.find((e) => e.id === req.employeeId);
                  return (
                    <div
                      key={req.id}
                      className="bg-stone-950 border border-stone-800 p-2.5 text-xs flex items-start justify-between"
                    >
                      <div>
                        <div className="font-semibold text-stone-200">{emp?.name || 'Worker'}</div>
                        <div className="text-stone-400 text-[11px] mt-0.5">{req.reason}</div>
                        <div className="text-[10px] font-mono text-amber-400/80 mt-1">
                          {req.startDate} to {req.endDate} ({req.daysCount}d)
                        </div>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        Pending
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-stone-500 py-4 text-center">
                {STRINGS.EMPTY_LEAVE_REQUESTS}
              </div>
            )}
          </div>

          {/* Upcoming Holidays Widget */}
          <div className="bg-stone-900 border border-stone-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-display font-bold text-sm tracking-wide text-stone-200 uppercase">
                Upcoming Plant Holidays
              </div>
              <span className="text-[10px] font-mono text-stone-400">2026 Calendar</span>
            </div>

            <div className="space-y-2">
              {upcomingHolidays.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-stone-800 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-stone-300 font-medium">{h.name}</span>
                  </div>
                  <span className="font-mono text-stone-400 text-[11px]">{h.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
