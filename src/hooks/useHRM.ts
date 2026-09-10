/**
 * Unified React Query (TanStack Query) Hooks
 * All UI reads and mutations execute strictly through these hooks,
 * establishing a drop-in ready boundary for a .NET Core Web API backend.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService, EmployeeFilters } from '../services/employee.service';
import { attendanceService } from '../services/attendance.service';
import { leaveService } from '../services/leave.service';
import { payrollService } from '../services/payroll.service';
import { configService } from '../services/config.service';
import { rosterService } from '../services/roster.service';
import {
  Employee,
  AttendanceStatus,
  LeaveType,
  PayrollConfig,
  LateMarkPolicyConfig,
  Holiday,
  WeeklyOffRule,
  Shift,
  Department,
} from '../types';

export const QUERY_KEYS = {
  EMPLOYEES: 'employees',
  EMPLOYEE_DETAIL: 'employee_detail',
  ATTENDANCE_DAILY: 'attendance_daily',
  ATTENDANCE_MONTHLY: 'attendance_monthly',
  ATTENDANCE_SUMMARY: 'attendance_summary',
  REGULARIZATIONS: 'regularizations',
  LEAVE_TYPES: 'leave_types',
  LEAVE_BALANCES: 'leave_balances',
  LEAVE_REQUESTS: 'leave_requests',
  PAYROLL_CONFIG: 'payroll_config',
  LATE_MARK_POLICY: 'late_mark_policy',
  PAYROLL_RUNS: 'payroll_runs',
  PAYROLL_RUN_DETAIL: 'payroll_run_detail',
  PAYSLIP_HISTORY: 'payslip_history',
  DEPARTMENTS: 'departments',
  SHIFTS: 'shifts',
  HOLIDAYS: 'holidays',
  WEEKLY_OFFS: 'weekly_offs',
  AUDIT_LOGS: 'audit_logs',
  ROSTER: 'roster',
};

// ==================== EMPLOYEES ====================
export function useEmployees(filters?: EmployeeFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEES, filters],
    queryFn: () => employeeService.getEmployees(filters),
  });
}

export function useEmployee(id: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.EMPLOYEE_DETAIL, id],
    queryFn: () => employeeService.getEmployeeById(id),
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Employee, 'id' | 'employeeCode'>) => employeeService.createEmployee(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<Employee> }) =>
      employeeService.updateEmployee(id, updates),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEE_DETAIL, variables.id] });
    },
  });
}

export function useDeactivateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => employeeService.deactivateEmployee(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
    },
  });
}

export function useBulkImportEmployees() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (records: Partial<Employee>[]) => employeeService.bulkImportEmployees(records),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
    },
  });
}

// ==================== ATTENDANCE ====================
export function useDailyAttendance(date: string, departmentId?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE_DAILY, date, departmentId],
    queryFn: () => attendanceService.getDailyRecords(date, departmentId),
  });
}

export function useMonthlyRegister(
  month: number,
  year: number,
  departmentId?: number,
  employeeId?: number
) {
  return useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE_MONTHLY, month, year, departmentId, employeeId],
    queryFn: () => attendanceService.getMonthlyRegister(month, year, departmentId, employeeId),
  });
}

export function useAttendanceSummary(date: string, departmentId?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.ATTENDANCE_SUMMARY, date, departmentId],
    queryFn: () => attendanceService.getAttendanceSummary(date, departmentId),
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, time, date }: { employeeId: number; time?: string; date?: string }) =>
      attendanceService.checkIn(employeeId, time, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_DAILY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_MONTHLY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_SUMMARY] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, time, date }: { employeeId: number; time?: string; date?: string }) =>
      attendanceService.checkOut(employeeId, time, date),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_DAILY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_MONTHLY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_SUMMARY] });
    },
  });
}

export function useBulkMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeIds,
      startDate,
      endDate,
      status,
      remarks,
    }: {
      employeeIds: number[];
      startDate: string;
      endDate: string;
      status: AttendanceStatus;
      remarks?: string;
    }) => attendanceService.markAttendanceRange(employeeIds, startDate, endDate, status, remarks),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_DAILY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_MONTHLY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_SUMMARY] });
    },
  });
}

export function useUpdateAttendanceRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) =>
      attendanceService.updateAttendanceRecord(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_DAILY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_MONTHLY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_SUMMARY] });
    },
  });
}

export function useRecordManualAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      employeeId: number;
      date: string;
      checkIn?: string | null;
      checkOut?: string | null;
      status?: AttendanceStatus;
      remarks?: string;
    }) => attendanceService.recordManualAttendance(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_DAILY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_MONTHLY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_SUMMARY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL_RUNS] });
    },
  });
}

export function useBatchManualAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      entries: Array<{
        employeeId: number;
        date: string;
        checkIn?: string | null;
        checkOut?: string | null;
        status?: AttendanceStatus;
        remarks?: string;
      }>
    ) => attendanceService.recordBulkManualAttendance(entries),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_DAILY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_MONTHLY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_SUMMARY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL_RUNS] });
    },
  });
}

export function useRegularizationRequests(status?: string, supervisorDepartments?: number[]) {
  return useQuery({
    queryKey: [QUERY_KEYS.REGULARIZATIONS, status, supervisorDepartments],
    queryFn: () => attendanceService.getRegularizationRequests(status, supervisorDepartments),
  });
}

export function useCreateRegularization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => attendanceService.createRegularizationRequest(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.REGULARIZATIONS] });
    },
  });
}

export function useApproveRegularization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actionedBy, comments }: { id: number; actionedBy: number; comments?: string }) =>
      attendanceService.approveRegularization(id, actionedBy, comments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.REGULARIZATIONS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_DAILY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_MONTHLY] });
    },
  });
}

export function useRejectRegularization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actionedBy, comments }: { id: number; actionedBy: number; comments?: string }) =>
      attendanceService.rejectRegularization(id, actionedBy, comments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.REGULARIZATIONS] });
    },
  });
}

// ==================== LEAVE ====================
export function useLeaveTypes() {
  return useQuery({
    queryKey: [QUERY_KEYS.LEAVE_TYPES],
    queryFn: () => leaveService.getLeaveTypes(),
  });
}

export function useEmployeeLeaveBalances(employeeId: number, year = 2026) {
  return useQuery({
    queryKey: [QUERY_KEYS.LEAVE_BALANCES, employeeId, year],
    queryFn: () => leaveService.getEmployeeBalances(employeeId, year),
    enabled: !!employeeId,
  });
}

export function useAllLeaveBalances(year = 2026) {
  return useQuery({
    queryKey: [QUERY_KEYS.LEAVE_BALANCES, 'all', year],
    queryFn: () => leaveService.getAllBalances(year),
  });
}

export function usePendingLeaves(supervisorDepartments?: number[]) {
  return useQuery({
    queryKey: [QUERY_KEYS.LEAVE_REQUESTS, 'pending', supervisorDepartments],
    queryFn: () => leaveService.getPendingRequests(supervisorDepartments),
  });
}

export function useAllLeaves(filters?: { employeeId?: number; status?: string; departmentId?: number }) {
  return useQuery({
    queryKey: [QUERY_KEYS.LEAVE_REQUESTS, 'all', filters],
    queryFn: () => leaveService.getAllRequests(filters),
  });
}

export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      employeeId: number;
      leaveTypeId: number;
      startDate: string;
      endDate: string;
      daysCount: number;
      reason: string;
    }) => leaveService.applyLeave(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_REQUESTS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_BALANCES] });
    },
  });
}

export function useApproveLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actionedBy, comments }: { id: number; actionedBy: number; comments?: string }) =>
      leaveService.approveLeave(id, actionedBy, comments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_REQUESTS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_BALANCES] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_DAILY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ATTENDANCE_MONTHLY] });
    },
  });
}

export function useRejectLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, actionedBy, comments }: { id: number; actionedBy: number; comments?: string }) =>
      leaveService.rejectLeave(id, actionedBy, comments),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_REQUESTS] });
    },
  });
}

export function useRecalculateLeaveBalances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (year?: number) => leaveService.recalculateAllBalances(year),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_BALANCES] });
    },
  });
}

// ==================== PAYROLL ====================
export function usePayrollConfig() {
  return useQuery({
    queryKey: [QUERY_KEYS.PAYROLL_CONFIG],
    queryFn: () => payrollService.getPayrollConfig(),
  });
}

export function useLateMarkPolicy() {
  return useQuery({
    queryKey: [QUERY_KEYS.LATE_MARK_POLICY],
    queryFn: () => payrollService.getLateMarkPolicy(),
  });
}

export function usePayrollRuns() {
  return useQuery({
    queryKey: [QUERY_KEYS.PAYROLL_RUNS],
    queryFn: () => payrollService.getPayrollRuns(),
  });
}

export function usePayrollRun(id: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.PAYROLL_RUN_DETAIL, id],
    queryFn: () => payrollService.getPayrollRunById(id),
    enabled: !!id,
  });
}

export function useRunPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) =>
      payrollService.runPayroll(month, year),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL_RUNS] });
    },
  });
}

export function useFinalizePayrollRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => payrollService.finalizePayrollRun(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL_RUNS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL_RUN_DETAIL, id] });
    },
  });
}

export function useEmployeePayslipHistory(employeeId: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.PAYSLIP_HISTORY, employeeId],
    queryFn: () => payrollService.getEmployeePayslipHistory(employeeId),
    enabled: !!employeeId,
  });
}

// ==================== CONFIG MASTERS ====================
export function useDepartments() {
  return useQuery({
    queryKey: [QUERY_KEYS.DEPARTMENTS],
    queryFn: () => configService.getDepartments(),
  });
}

export function useShifts() {
  return useQuery({
    queryKey: [QUERY_KEYS.SHIFTS],
    queryFn: () => configService.getShifts(),
  });
}

export function useHolidays(year?: number) {
  return useQuery({
    queryKey: [QUERY_KEYS.HOLIDAYS, year],
    queryFn: () => configService.getHolidays(year),
  });
}

export function useWeeklyOffs() {
  return useQuery({
    queryKey: [QUERY_KEYS.WEEKLY_OFFS],
    queryFn: () => configService.getWeeklyOffs(),
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: [QUERY_KEYS.AUDIT_LOGS],
    queryFn: () => configService.getAuditLogs(),
  });
}

export function useUpdatePayrollConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ config, changedBy }: { config: Partial<PayrollConfig>; changedBy: string }) =>
      configService.updatePayrollConfig(config, changedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.PAYROLL_CONFIG] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUDIT_LOGS] });
    },
  });
}

export function useUpdateLateMarkPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ config, changedBy }: { config: Partial<LateMarkPolicyConfig>; changedBy: string }) =>
      configService.updateLateMarkPolicy(config, changedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LATE_MARK_POLICY] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUDIT_LOGS] });
    },
  });
}

export function useUpdateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates, changedBy }: { id: number; updates: Partial<LeaveType>; changedBy: string }) =>
      configService.updateLeaveType(id, updates, changedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_TYPES] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUDIT_LOGS] });
    },
  });
}

export function useCreateLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, changedBy }: { data: Omit<LeaveType, 'id'>; changedBy: string }) =>
      configService.createLeaveType(data, changedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_TYPES] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUDIT_LOGS] });
    },
  });
}

export function useDeleteLeaveType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changedBy }: { id: number; changedBy: string }) =>
      configService.deleteLeaveType(id, changedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.LEAVE_TYPES] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUDIT_LOGS] });
    },
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates, changedBy }: { id: number; updates: Partial<Shift>; changedBy: string }) =>
      configService.updateShift(id, updates, changedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.SHIFTS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUDIT_LOGS] });
    },
  });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, changedBy }: { data: Omit<Holiday, 'id'>; changedBy: string }) =>
      configService.createHoliday(data, changedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.HOLIDAYS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUDIT_LOGS] });
    },
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, changedBy }: { id: number; changedBy: string }) =>
      configService.deleteHoliday(id, changedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.HOLIDAYS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUDIT_LOGS] });
    },
  });
}

export function useUpdateWeeklyOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates, changedBy }: { id: number; updates: Partial<WeeklyOffRule>; changedBy: string }) =>
      configService.updateWeeklyOff(id, updates, changedBy),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.WEEKLY_OFFS] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.AUDIT_LOGS] });
    },
  });
}

// ==================== ROSTER ====================
export function useRoster(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.ROSTER, startDate, endDate],
    queryFn: () => rosterService.getRoster(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useAssignShiftRange() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeIds,
      startDate,
      endDate,
      shiftId,
    }: {
      employeeIds: number[];
      startDate: string;
      endDate: string;
      shiftId: number;
    }) => rosterService.assignShiftRange(employeeIds, startDate, endDate, shiftId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.ROSTER] });
      qc.invalidateQueries({ queryKey: [QUERY_KEYS.EMPLOYEES] });
    },
  });
}
