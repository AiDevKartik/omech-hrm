/**
 * Leave Domain Service
 * Pure rule engine for dynamic leave accrual (including the attendance-based
 * consecutive present days credit rule) and leave request approvals.
 */

import {
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  Employee,
  AttendanceRecord,
  PayrollConfig,
} from '../types';
import { getStoreItem, setStoreItem, nextSequence, STORE_KEYS } from '../data/localStore';

/**
 * Pure function: Calculate leave balances for a single employee
 * Evaluates attendance history against dynamic leave policy rules (e.g. 20 consecutive days -> +1 PL)
 */
export function calculateEmployeeLeaveBalances(
  employee: Employee,
  attendanceHistory: AttendanceRecord[],
  leaveTypes: LeaveType[],
  existingBalances: LeaveBalance[],
  year = 2026
): LeaveBalance[] {
  // Sort attendance chronologically
  const sortedAttendance = [...attendanceHistory]
    .filter((a) => a.employeeId === employee.id && a.date.startsWith(`${year}`))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Count taken leaves by leave type
  const takenCountByType: Record<number, number> = {};
  for (const att of sortedAttendance) {
    if (att.status === 'on_leave' && att.leaveTypeId) {
      takenCountByType[att.leaveTypeId] = (takenCountByType[att.leaveTypeId] || 0) + 1;
    }
  }

  const updatedBalances: LeaveBalance[] = [];

  for (const lt of leaveTypes) {
    // Check applicability
    if (
      lt.applicableTo !== 'both' &&
      ((lt.applicableTo === 'staff' && employee.category !== 'permanent_staff') ||
        (lt.applicableTo === 'contractual' && employee.category !== 'contractual'))
    ) {
      continue;
    }

    const existing = existingBalances.find(
      (b) => b.employeeId === employee.id && b.leaveTypeId === lt.id && b.year === year
    );

    const openingBalance = existing?.openingBalance ?? lt.annualEntitlement;
    const carriedForward = existing?.carriedForward ?? 0;
    let accrued = 0;

    if (lt.accrualMethod === 'yearly-upfront') {
      accrued = lt.annualEntitlement;
    } else if (lt.accrualMethod === 'monthly-credit') {
      // Pro-rate based on elapsed months in the year
      const currentMonth = 9; // September
      accrued = Number(((lt.annualEntitlement / 12) * currentMonth).toFixed(1));
    } else if (lt.accrualMethod === 'attendance-based') {
      // Rule engine: Credit 1 day for every N consecutive present days with zero leave taken
      const requiredConsecutiveDays = lt.attendanceBasedDaysRequired || 20;
      let consecutivePresentDays = 0;
      let earnedCredits = 0;

      for (const att of sortedAttendance) {
        if (att.status === 'present') {
          consecutivePresentDays++;
          if (consecutivePresentDays >= requiredConsecutiveDays) {
            earnedCredits += 1;
            consecutivePresentDays = 0; // reset for next milestone
          }
        } else if (att.status === 'on_leave' || att.status === 'absent') {
          consecutivePresentDays = 0; // reset streak on absence or leave
        }
        // Weekly off and holiday do not break the present streak in factory practice
      }

      accrued = earnedCredits;
    }

    const taken = takenCountByType[lt.id] ?? (existing?.taken ?? 0);
    const currentBalance = Number((openingBalance + accrued + carriedForward - taken).toFixed(1));

    updatedBalances.push({
      id: existing?.id ?? nextSequence('leaveBalance'),
      employeeId: employee.id,
      leaveTypeId: lt.id,
      year,
      openingBalance,
      accrued,
      taken,
      carriedForward,
      currentBalance,
    });
  }

  return updatedBalances;
}

export const leaveService = {
  async getLeaveTypes(): Promise<LeaveType[]> {
    return getStoreItem<LeaveType[]>(STORE_KEYS.LEAVE_TYPES, []);
  },

  async getEmployeeBalances(employeeId: number, year = 2026): Promise<LeaveBalance[]> {
    const all = getStoreItem<LeaveBalance[]>(STORE_KEYS.LEAVE_BALANCES, []);
    return all.filter((b) => b.employeeId === employeeId && b.year === year);
  },

  async getAllBalances(year = 2026): Promise<LeaveBalance[]> {
    const all = getStoreItem<LeaveBalance[]>(STORE_KEYS.LEAVE_BALANCES, []);
    return all.filter((b) => b.year === year);
  },

  /**
   * Submit a new leave application
   * Validates live balance against policy (blocks if insufficient unless negative balance allowed)
   */
  async applyLeave(data: {
    employeeId: number;
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    daysCount: number;
    reason: string;
  }): Promise<LeaveRequest> {
    const payrollConfig = getStoreItem<PayrollConfig>(STORE_KEYS.PAYROLL_CONFIG, {
      allowNegativeLeaveBalance: false,
    } as PayrollConfig);

    const balances = await this.getEmployeeBalances(data.employeeId);
    const balanceObj = balances.find((b) => b.leaveTypeId === data.leaveTypeId);
    const available = balanceObj ? balanceObj.currentBalance : 0;

    if (!payrollConfig.allowNegativeLeaveBalance && available < data.daysCount) {
      throw new Error(
        `Insufficient leave balance. Requested ${data.daysCount} days, but available balance is only ${available} days.`
      );
    }

    const requests = getStoreItem<LeaveRequest[]>(STORE_KEYS.LEAVE_REQUESTS, []);
    const newRequest: LeaveRequest = {
      ...data,
      id: nextSequence('leaveRequest'),
      status: 'pending',
      appliedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    requests.push(newRequest);
    setStoreItem(STORE_KEYS.LEAVE_REQUESTS, requests);
    return newRequest;
  },

  async getPendingRequests(supervisorDepartmentIds?: number[]): Promise<LeaveRequest[]> {
    const all = getStoreItem<LeaveRequest[]>(STORE_KEYS.LEAVE_REQUESTS, []);
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    let pending = all.filter((r) => r.status === 'pending');

    if (supervisorDepartmentIds && supervisorDepartmentIds.length > 0) {
      const allowedDeptIds = new Set(supervisorDepartmentIds);
      const allowedEmpIds = new Set(
        employees.filter((e) => allowedDeptIds.has(e.departmentId)).map((e) => e.id)
      );
      pending = pending.filter((r) => allowedEmpIds.has(r.employeeId));
    }

    return pending;
  },

  async getAllRequests(filters?: {
    employeeId?: number;
    status?: string;
    departmentId?: number;
  }): Promise<LeaveRequest[]> {
    let all = getStoreItem<LeaveRequest[]>(STORE_KEYS.LEAVE_REQUESTS, []);
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);

    if (filters) {
      if (filters.employeeId) {
        all = all.filter((r) => r.employeeId === filters.employeeId);
      }
      if (filters.status) {
        all = all.filter((r) => r.status === filters.status);
      }
      if (filters.departmentId) {
        const empIdsInDept = new Set(
          employees.filter((e) => e.departmentId === filters.departmentId).map((e) => e.id)
        );
        all = all.filter((r) => empIdsInDept.has(r.employeeId));
      }
    }

    return all;
  },

  async approveLeave(
    id: number,
    actionedBy: number,
    comments?: string
  ): Promise<LeaveRequest> {
    const requests = getStoreItem<LeaveRequest[]>(STORE_KEYS.LEAVE_REQUESTS, []);
    const attendanceRecords = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []);
    const req = requests.find((r) => r.id === id);

    if (!req) throw new Error(`Leave request ${id} not found.`);

    req.status = 'approved';
    req.actionedBy = actionedBy;
    req.actionedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    req.comments = comments || 'Approved by Manager';

    // Mark attendance records as 'on_leave' across start to end date
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existing = attendanceRecords.find(
        (a) => a.employeeId === req.employeeId && a.date === dateStr
      );

      if (existing) {
        existing.status = 'on_leave';
        existing.leaveTypeId = req.leaveTypeId;
        existing.checkIn = null;
        existing.checkOut = null;
        existing.isLate = false;
        existing.lateMinutes = 0;
        existing.workingHours = 0;
        existing.overtimeHours = 0;
        existing.remarks = `Leave: ${req.reason}`;
      } else {
        attendanceRecords.push({
          id: nextSequence('attendance'),
          employeeId: req.employeeId,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          status: 'on_leave',
          leaveTypeId: req.leaveTypeId,
          isLate: false,
          lateMinutes: 0,
          overtimeHours: 0,
          workingHours: 0,
          regularized: false,
          remarks: `Leave: ${req.reason}`,
        });
      }
    }

    setStoreItem(STORE_KEYS.LEAVE_REQUESTS, requests);
    setStoreItem(STORE_KEYS.ATTENDANCE, attendanceRecords);

    // Trigger recalculation of balances
    await this.recalculateAllBalances();

    return req;
  },

  async rejectLeave(
    id: number,
    actionedBy: number,
    comments?: string
  ): Promise<LeaveRequest> {
    const requests = getStoreItem<LeaveRequest[]>(STORE_KEYS.LEAVE_REQUESTS, []);
    const req = requests.find((r) => r.id === id);
    if (!req) throw new Error(`Leave request ${id} not found.`);

    req.status = 'rejected';
    req.actionedBy = actionedBy;
    req.actionedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    req.comments = comments || 'Rejected by Manager';

    setStoreItem(STORE_KEYS.LEAVE_REQUESTS, requests);
    return req;
  },

  /**
   * Recalculate balances across all active employees using the pure rule engine
   * Admin callable on demand via "Recalculate balances" button
   */
  async recalculateAllBalances(year = 2026): Promise<{
    processedEmployees: number;
    creditsAwarded: number;
    summary: string;
  }> {
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []).filter((e) => e.isActive);
    const leaveTypes = getStoreItem<LeaveType[]>(STORE_KEYS.LEAVE_TYPES, []);
    const attendance = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []);
    const currentBalances = getStoreItem<LeaveBalance[]>(STORE_KEYS.LEAVE_BALANCES, []);

    let allUpdatedBalances: LeaveBalance[] = [];
    let totalCredits = 0;

    for (const emp of employees) {
      const updated = calculateEmployeeLeaveBalances(emp, attendance, leaveTypes, currentBalances, year);
      allUpdatedBalances.push(...updated);

      // count attendance based credits
      for (const b of updated) {
        const lt = leaveTypes.find((t) => t.id === b.leaveTypeId);
        if (lt?.accrualMethod === 'attendance-based') {
          totalCredits += b.accrued;
        }
      }
    }

    setStoreItem(STORE_KEYS.LEAVE_BALANCES, allUpdatedBalances);

    return {
      processedEmployees: employees.length,
      creditsAwarded: totalCredits,
      summary: `Successfully recalculated leave balances for ${employees.length} employees using statutory and attendance-streak rules (Awarded ${totalCredits} attendance credits).`,
    };
  },
};
