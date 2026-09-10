/**
 * Attendance Domain Service
 * Manages daily punches, muster-roll registers, grace-period evaluation,
 * date-range bulk markings, and regularization requests.
 */

import {
  AttendanceRecord,
  AttendanceStatus,
  RegularizationRequest,
  Employee,
  Shift,
  LateMarkPolicyConfig,
} from '../types';
import { getStoreItem, setStoreItem, nextSequence, STORE_KEYS } from '../data/localStore';

export const attendanceService = {
  /**
   * Get all attendance records for a specific date
   */
  async getDailyRecords(date: string, departmentId?: number): Promise<AttendanceRecord[]> {
    const all = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []);
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);

    let filtered = all.filter((r) => r.date === date);

    if (departmentId && departmentId > 0) {
      const deptEmployeeIds = new Set(
        employees.filter((e) => e.departmentId === departmentId).map((e) => e.id)
      );
      filtered = filtered.filter((r) => deptEmployeeIds.has(r.employeeId));
    }

    return filtered;
  },

  /**
   * Get monthly register (muster roll matrix data)
   */
  async getMonthlyRegister(
    month: number, // 1-12
    year: number,
    departmentId?: number,
    employeeId?: number
  ): Promise<AttendanceRecord[]> {
    const all = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []);
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);

    const monthPrefix = `${year}-${month < 10 ? `0${month}` : `${month}`}`;
    let filtered = all.filter((r) => r.date.startsWith(monthPrefix));

    if (employeeId) {
      filtered = filtered.filter((r) => r.employeeId === employeeId);
    } else if (departmentId && departmentId > 0) {
      const deptEmployeeIds = new Set(
        employees.filter((e) => e.departmentId === departmentId).map((e) => e.id)
      );
      filtered = filtered.filter((r) => deptEmployeeIds.has(r.employeeId));
    }

    return filtered;
  },

  /**
   * Check in an employee (live punch or manual punch)
   * Evaluates grace period from shift & LateMarkPolicy
   */
  async checkIn(employeeId: number, checkInTime?: string, date?: string): Promise<AttendanceRecord> {
    const records = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []);
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    const shifts = getStoreItem<Shift[]>(STORE_KEYS.SHIFTS, []);
    const latePolicy = getStoreItem<LateMarkPolicyConfig>(STORE_KEYS.LATE_MARK_POLICY_CONFIG, {
      graceMinutes: 15,
      resetCycle: 'monthly',
      ladder: [],
    });

    const targetDate = date || new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = checkInTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) throw new Error(`Employee ${employeeId} not found.`);

    const shift = shifts.find((s) => s.id === employee.shiftId) || shifts[0];
    const graceMinutes = shift.graceMinutes || latePolicy.graceMinutes || 15;

    // Check if late
    const [startH, startM] = shift.startTime.split(':').map(Number);
    const [inH, inM] = timeStr.split(':').map(Number);
    const shiftStartTotalMinutes = startH * 60 + startM;
    const checkInTotalMinutes = inH * 60 + inM;

    let isLate = false;
    let lateMinutes = 0;

    if (checkInTotalMinutes > shiftStartTotalMinutes + graceMinutes) {
      isLate = true;
      lateMinutes = checkInTotalMinutes - shiftStartTotalMinutes;
    }

    const existingIndex = records.findIndex(
      (r) => r.employeeId === employeeId && r.date === targetDate
    );

    if (existingIndex >= 0) {
      records[existingIndex].checkIn = timeStr;
      records[existingIndex].status = 'present';
      records[existingIndex].isLate = isLate;
      records[existingIndex].lateMinutes = lateMinutes;
      if (isLate) {
        records[existingIndex].remarks = `Late arrival by ${lateMinutes}m`;
      }
      setStoreItem(STORE_KEYS.ATTENDANCE, records);
      return records[existingIndex];
    } else {
      const newRecord: AttendanceRecord = {
        id: nextSequence('attendance'),
        employeeId,
        date: targetDate,
        checkIn: timeStr,
        checkOut: null,
        status: 'present',
        isLate,
        lateMinutes,
        overtimeHours: 0,
        workingHours: 0,
        regularized: false,
        remarks: isLate ? `Late arrival by ${lateMinutes}m` : undefined,
      };
      records.push(newRecord);
      setStoreItem(STORE_KEYS.ATTENDANCE, records);
      return newRecord;
    }
  },

  /**
   * Check out an employee
   */
  async checkOut(employeeId: number, checkOutTime?: string, date?: string): Promise<AttendanceRecord> {
    const records = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []);
    const targetDate = date || new Date().toISOString().split('T')[0];
    const now = new Date();
    const timeStr = checkOutTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const record = records.find((r) => r.employeeId === employeeId && r.date === targetDate);
    if (!record) {
      throw new Error(`Cannot punch out. No check-in found for employee on ${targetDate}.`);
    }

    record.checkOut = timeStr;

    // Calculate working hours
    if (record.checkIn) {
      const [inH, inM] = record.checkIn.split(':').map(Number);
      const [outH, outM] = timeStr.split(':').map(Number);
      let diffMinutes = outH * 60 + outM - (inH * 60 + inM);
      if (diffMinutes < 0) diffMinutes += 24 * 60; // night shift crossover

      const hours = Number((diffMinutes / 60).toFixed(1));
      record.workingHours = hours;

      // Check overtime if > 8.0 hours
      if (hours > 8.0) {
        record.overtimeHours = Number((hours - 8.0).toFixed(1));
      } else {
        record.overtimeHours = 0;
      }
    }

    setStoreItem(STORE_KEYS.ATTENDANCE, records);
    return record;
  },

  /**
   * Bulk mark attendance across a date range for specified employees
   * e.g., company declared holiday, planned shutdown, mass weekly off
   */
  async markAttendanceRange(
    employeeIds: number[],
    startDate: string,
    endDate: string,
    status: AttendanceStatus,
    remarks?: string
  ): Promise<number> {
    const records = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []);
    let count = 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      for (const empId of employeeIds) {
        const index = records.findIndex((r) => r.employeeId === empId && r.date === dateStr);
        if (index >= 0) {
          records[index].status = status;
          if (status === 'absent' || status === 'on_leave' || status === 'holiday' || status === 'weekly_off') {
            records[index].checkIn = null;
            records[index].checkOut = null;
            records[index].isLate = false;
            records[index].lateMinutes = 0;
            records[index].workingHours = 0;
            records[index].overtimeHours = 0;
          }
          if (remarks) records[index].remarks = remarks;
          count++;
        } else {
          records.push({
            id: nextSequence('attendance'),
            employeeId: empId,
            date: dateStr,
            checkIn: null,
            checkOut: null,
            status,
            isLate: false,
            lateMinutes: 0,
            overtimeHours: 0,
            workingHours: 0,
            regularized: false,
            remarks,
          });
          count++;
        }
      }
    }

    setStoreItem(STORE_KEYS.ATTENDANCE, records);
    return count;
  },

  /**
   * Update or correct a specific attendance record inline
   */
  async updateAttendanceRecord(
    recordId: number,
    updates: Partial<AttendanceRecord>
  ): Promise<AttendanceRecord> {
    const records = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []);
    const index = records.findIndex((r) => r.id === recordId);
    if (index === -1) {
      throw new Error(`Attendance record ${recordId} not found.`);
    }

    const updated = {
      ...records[index],
      ...updates,
      id: records[index].id,
      employeeId: records[index].employeeId,
      date: records[index].date,
    };

    // recalculate working hours if punches changed
    if (updated.checkIn && updated.checkOut) {
      const [inH, inM] = updated.checkIn.split(':').map(Number);
      const [outH, outM] = updated.checkOut.split(':').map(Number);
      let diffMinutes = outH * 60 + outM - (inH * 60 + inM);
      if (diffMinutes < 0) diffMinutes += 24 * 60;
      const hours = Number((diffMinutes / 60).toFixed(1));
      updated.workingHours = hours;
      updated.overtimeHours = hours > 8.0 ? Number((hours - 8.0).toFixed(1)) : 0;
    }

    records[index] = updated;
    setStoreItem(STORE_KEYS.ATTENDANCE, records);
    return updated;
  },

  /**
   * Manually record or update an attendance entry with custom login and logout times.
   * Designed for non-biometric environments where Admin/HR inputs attendance by manual time log.
   */
  async recordManualAttendance(params: {
    employeeId: number;
    date: string;
    checkIn?: string | null;
    checkOut?: string | null;
    status?: AttendanceStatus;
    remarks?: string;
  }): Promise<AttendanceRecord> {
    const records = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []);
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    const shifts = getStoreItem<Shift[]>(STORE_KEYS.SHIFTS, []);
    const latePolicy = getStoreItem<LateMarkPolicyConfig>(STORE_KEYS.LATE_MARK_POLICY_CONFIG, {
      graceMinutes: 15,
      resetCycle: 'monthly',
      ladder: [],
    });

    const employee = employees.find((e) => e.id === params.employeeId);
    if (!employee) throw new Error(`Employee ${params.employeeId} not found.`);

    const shift = shifts.find((s) => s.id === employee.shiftId) || shifts[0];
    const graceMinutes = shift?.graceMinutes ?? latePolicy.graceMinutes ?? 15;

    let isLate = false;
    let lateMinutes = 0;

    if (params.checkIn && shift) {
      const [startH, startM] = shift.startTime.split(':').map(Number);
      const [inH, inM] = params.checkIn.split(':').map(Number);
      const shiftStartMinutes = startH * 60 + startM;
      const inMinutes = inH * 60 + inM;
      if (inMinutes > shiftStartMinutes + graceMinutes) {
        isLate = true;
        lateMinutes = inMinutes - shiftStartMinutes;
      }
    }

    let workingHours = 0;
    let overtimeHours = 0;
    if (params.checkIn && params.checkOut) {
      const [inH, inM] = params.checkIn.split(':').map(Number);
      const [outH, outM] = params.checkOut.split(':').map(Number);
      let diffMinutes = outH * 60 + outM - (inH * 60 + inM);
      if (diffMinutes < 0) diffMinutes += 24 * 60; // overnight shift crossover
      workingHours = Number((diffMinutes / 60).toFixed(1));
      overtimeHours = workingHours > 8.0 ? Number((workingHours - 8.0).toFixed(1)) : 0;
    }

    let resolvedStatus: AttendanceStatus = params.status || 'present';
    if (!params.status) {
      if (params.checkIn || params.checkOut) {
        resolvedStatus = workingHours > 0 && workingHours < 4 ? 'half_day' : 'present';
      } else {
        resolvedStatus = 'absent';
      }
    }

    const existingIndex = records.findIndex(
      (r) => r.employeeId === params.employeeId && r.date === params.date
    );

    let resultRecord: AttendanceRecord;

    if (existingIndex >= 0) {
      records[existingIndex] = {
        ...records[existingIndex],
        checkIn: params.checkIn !== undefined ? params.checkIn : records[existingIndex].checkIn,
        checkOut: params.checkOut !== undefined ? params.checkOut : records[existingIndex].checkOut,
        status: resolvedStatus,
        isLate,
        lateMinutes,
        workingHours,
        overtimeHours,
        remarks:
          params.remarks !== undefined
            ? params.remarks
            : records[existingIndex].remarks || 'Manual Entry by Admin/HR',
      };
      resultRecord = records[existingIndex];
    } else {
      resultRecord = {
        id: nextSequence('attendance'),
        employeeId: params.employeeId,
        date: params.date,
        checkIn: params.checkIn || null,
        checkOut: params.checkOut || null,
        status: resolvedStatus,
        isLate,
        lateMinutes,
        workingHours,
        overtimeHours,
        regularized: false,
        remarks: params.remarks || 'Manual Entry by Admin/HR',
      };
      records.push(resultRecord);
    }

    setStoreItem(STORE_KEYS.ATTENDANCE, records);
    return resultRecord;
  },

  /**
   * Bulk record multiple manual attendance entries (e.g. daily muster book entry)
   */
  async recordBulkManualAttendance(
    entries: Array<{
      employeeId: number;
      date: string;
      checkIn?: string | null;
      checkOut?: string | null;
      status?: AttendanceStatus;
      remarks?: string;
    }>
  ): Promise<AttendanceRecord[]> {
    const results: AttendanceRecord[] = [];
    for (const entry of entries) {
      const rec = await this.recordManualAttendance(entry);
      results.push(rec);
    }
    return results;
  },

  /**
   * Overview summary for dashboard gauges
   */
  async getAttendanceSummary(date: string, departmentId?: number) {
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    let activeEmployees = employees.filter((e) => e.isActive);

    if (departmentId && departmentId > 0) {
      activeEmployees = activeEmployees.filter((e) => e.departmentId === departmentId);
    }

    const activeIds = new Set(activeEmployees.map((e) => e.id));
    const records = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []).filter(
      (r) => r.date === date && activeIds.has(r.employeeId)
    );

    const totalHeadcount = activeEmployees.length;
    let present = 0;
    let onShift = 0;
    let absent = 0;
    let late = 0;
    let onLeave = 0;

    for (const emp of activeEmployees) {
      const rec = records.find((r) => r.employeeId === emp.id);
      if (!rec) {
        absent++;
      } else if (rec.status === 'present') {
        present++;
        if (rec.checkIn && !rec.checkOut) onShift++;
        if (rec.isLate) late++;
      } else if (rec.status === 'on_leave') {
        onLeave++;
      } else if (rec.status === 'absent') {
        absent++;
      }
    }

    return {
      totalHeadcount,
      present,
      onShift,
      absent,
      late,
      onLeave,
    };
  },

  /**
   * Get employee's late mark count in month
   */
  async getLateMarksForPeriod(employeeId: number, month: number, year: number): Promise<number> {
    const monthPrefix = `${year}-${month < 10 ? `0${month}` : `${month}`}`;
    const records = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []);
    return records.filter(
      (r) => r.employeeId === employeeId && r.date.startsWith(monthPrefix) && r.isLate
    ).length;
  },

  // Regularization Workflow
  async createRegularizationRequest(
    data: Omit<RegularizationRequest, 'id' | 'status' | 'appliedAt'>
  ): Promise<RegularizationRequest> {
    const list = getStoreItem<RegularizationRequest[]>(STORE_KEYS.REGULARIZATIONS, []);
    const newReq: RegularizationRequest = {
      ...data,
      id: nextSequence('regularization'),
      status: 'pending',
      appliedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };
    list.push(newReq);
    setStoreItem(STORE_KEYS.REGULARIZATIONS, list);
    return newReq;
  },

  async getRegularizationRequests(
    status?: string,
    supervisorDepartmentIds?: number[]
  ): Promise<RegularizationRequest[]> {
    let list = getStoreItem<RegularizationRequest[]>(STORE_KEYS.REGULARIZATIONS, []);
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);

    if (status) {
      list = list.filter((r) => r.status === status);
    }

    if (supervisorDepartmentIds && supervisorDepartmentIds.length > 0) {
      const allowedDeptIds = new Set(supervisorDepartmentIds);
      const allowedEmpIds = new Set(
        employees.filter((e) => allowedDeptIds.has(e.departmentId)).map((e) => e.id)
      );
      list = list.filter((r) => allowedEmpIds.has(r.employeeId));
    }

    return list;
  },

  async approveRegularization(
    id: number,
    actionedBy: number,
    comments?: string
  ): Promise<RegularizationRequest> {
    const list = getStoreItem<RegularizationRequest[]>(STORE_KEYS.REGULARIZATIONS, []);
    const records = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []);

    const req = list.find((r) => r.id === id);
    if (!req) throw new Error(`Request ${id} not found.`);

    req.status = 'approved';
    req.actionedBy = actionedBy;
    req.actionedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    req.comments = comments || 'Approved by Supervisor';

    // Update attendance record
    const record = records.find((r) => r.employeeId === req.employeeId && r.date === req.date);
    if (record) {
      record.checkIn = req.requestedCheckIn;
      record.checkOut = req.requestedCheckOut;
      record.status = 'present';
      record.isLate = false;
      record.lateMinutes = 0;
      record.regularized = true;
      record.remarks = `Regularized: ${req.reason}`;

      const [inH, inM] = req.requestedCheckIn.split(':').map(Number);
      const [outH, outM] = req.requestedCheckOut.split(':').map(Number);
      let diff = outH * 60 + outM - (inH * 60 + inM);
      if (diff < 0) diff += 24 * 60;
      const hours = Number((diff / 60).toFixed(1));
      record.workingHours = hours;
      record.overtimeHours = hours > 8.0 ? Number((hours - 8.0).toFixed(1)) : 0;
    } else {
      records.push({
        id: nextSequence('attendance'),
        employeeId: req.employeeId,
        date: req.date,
        checkIn: req.requestedCheckIn,
        checkOut: req.requestedCheckOut,
        status: 'present',
        isLate: false,
        lateMinutes: 0,
        overtimeHours: 0,
        workingHours: 8,
        regularized: true,
        remarks: `Regularized: ${req.reason}`,
      });
    }

    setStoreItem(STORE_KEYS.REGULARIZATIONS, list);
    setStoreItem(STORE_KEYS.ATTENDANCE, records);
    return req;
  },

  async rejectRegularization(
    id: number,
    actionedBy: number,
    comments?: string
  ): Promise<RegularizationRequest> {
    const list = getStoreItem<RegularizationRequest[]>(STORE_KEYS.REGULARIZATIONS, []);
    const req = list.find((r) => r.id === id);
    if (!req) throw new Error(`Request ${id} not found.`);

    req.status = 'rejected';
    req.actionedBy = actionedBy;
    req.actionedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    req.comments = comments || 'Rejected by Supervisor';

    setStoreItem(STORE_KEYS.REGULARIZATIONS, list);
    return req;
  },
};
