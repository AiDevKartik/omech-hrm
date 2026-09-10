/**
 * Local Data Store for Omech HRM
 * Acts as the in-browser database abstraction layer using namespaced localStorage keys.
 * Implements auto-increment sequence generators matching SQL IDENTITY/sequences.
 */

import {
  Department,
  Shift,
  Employee,
  LeaveType,
  LateMarkPolicyConfig,
  PayrollConfig,
  Holiday,
  WeeklyOffRule,
  AttendanceRecord,
  LeaveBalance,
  LeaveRequest,
  RegularizationRequest,
  PayrollRun,
  ConfigAuditLog,
  ShiftRosterAssignment,
} from '../types';

import {
  INITIAL_DEPARTMENTS,
  INITIAL_SHIFTS,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_TYPES,
  INITIAL_LATE_MARK_POLICY,
  INITIAL_PAYROLL_CONFIG,
  INITIAL_HOLIDAYS,
  INITIAL_WEEKLY_OFF,
  INITIAL_LEAVE_REQUESTS,
  generateSeedAttendance,
  generateSeedLeaveBalances,
} from './seedData';

// Namespaced LocalStorage Keys
export const STORE_KEYS = {
  EMPLOYEES: 'omech.employees',
  ATTENDANCE: 'omech.attendance',
  LEAVE_TYPES: 'omech.leaveTypes',
  LEAVE_BALANCES: 'omech.leaveBalances',
  LEAVE_REQUESTS: 'omech.leaveRequests',
  REGULARIZATIONS: 'omech.regularizationRequests',
  PAYROLL_RUNS: 'omech.payrollRuns',
  PAYROLL_CONFIG: 'omech.payrollConfig',
  LEAVE_POLICY_CONFIG: 'omech.leavePolicyConfig',
  LATE_MARK_POLICY_CONFIG: 'omech.lateMarkPolicyConfig',
  DEPARTMENTS: 'omech.departments',
  SHIFTS: 'omech.shifts',
  HOLIDAYS: 'omech.holidays',
  WEEKLY_OFF_CONFIG: 'omech.weeklyOffConfig',
  AUDIT_LOGS: 'omech.auditLogs',
  SHIFT_ROSTER: 'omech.shiftRoster',
  SEQUENCES: 'omech.sequences',
} as const;

/**
 * Low-level storage getter
 */
export function getStoreItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`[LocalStore] Failed to parse key ${key}:`, err);
    return defaultValue;
  }
}

/**
 * Low-level storage setter
 */
export function setStoreItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`[LocalStore] Failed to write key ${key}:`, err);
  }
}

/**
 * Generic Auto-Increment Sequence Generator
 * Matches SQL Server IDENTITY / SEQUENCE behavior
 */
export function nextSequence(entityName: string): number {
  const sequences = getStoreItem<Record<string, number>>(STORE_KEYS.SEQUENCES, {});
  const current = sequences[entityName] ?? 0;
  const next = current + 1;
  sequences[entityName] = next;
  setStoreItem(STORE_KEYS.SEQUENCES, sequences);
  return next;
}

/**
 * Set sequence explicitly (e.g. after seeding)
 */
export function setSequence(entityName: string, value: number): void {
  const sequences = getStoreItem<Record<string, number>>(STORE_KEYS.SEQUENCES, {});
  sequences[entityName] = Math.max(sequences[entityName] ?? 0, value);
  setStoreItem(STORE_KEYS.SEQUENCES, sequences);
}

/**
 * Seed initial database if empty
 */
export function initializeLocalStore(force = false): void {
  const isInitialized = localStorage.getItem('omech.db_initialized');
  if (isInitialized && !force) {
    return;
  }

  console.log('[LocalStore] Seeding starter factory data for Omech Pipes & Tubes...');

  const attendanceRecords = generateSeedAttendance();
  const leaveBalances = generateSeedLeaveBalances();

  setStoreItem<Department[]>(STORE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
  setStoreItem<Shift[]>(STORE_KEYS.SHIFTS, INITIAL_SHIFTS);
  setStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
  setStoreItem<LeaveType[]>(STORE_KEYS.LEAVE_TYPES, INITIAL_LEAVE_TYPES);
  setStoreItem<LateMarkPolicyConfig>(STORE_KEYS.LATE_MARK_POLICY_CONFIG, INITIAL_LATE_MARK_POLICY);
  setStoreItem<PayrollConfig>(STORE_KEYS.PAYROLL_CONFIG, INITIAL_PAYROLL_CONFIG);
  setStoreItem<Holiday[]>(STORE_KEYS.HOLIDAYS, INITIAL_HOLIDAYS);
  setStoreItem<WeeklyOffRule[]>(STORE_KEYS.WEEKLY_OFF_CONFIG, INITIAL_WEEKLY_OFF);
  setStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, attendanceRecords);
  setStoreItem<LeaveBalance[]>(STORE_KEYS.LEAVE_BALANCES, leaveBalances);
  setStoreItem<LeaveRequest[]>(STORE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
  setStoreItem<RegularizationRequest[]>(STORE_KEYS.REGULARIZATIONS, [
    {
      id: 1,
      employeeId: 8,
      date: '2026-08-28',
      requestedCheckIn: '06:00',
      requestedCheckOut: '14:00',
      reason: 'Biometric fingerprint reader timed out at Mill Gate #2',
      status: 'pending',
      appliedAt: '2026-08-29 08:30',
    },
  ]);
  setStoreItem<PayrollRun[]>(STORE_KEYS.PAYROLL_RUNS, []);
  setStoreItem<ConfigAuditLog[]>(STORE_KEYS.AUDIT_LOGS, [
    {
      id: 1,
      changedBy: 'Rajesh Sharma (Admin)',
      entity: 'payroll',
      fieldChanged: 'overtimeRatePerHour',
      oldValue: '100',
      newValue: '120',
      timestamp: '2026-07-01 10:00:00',
    },
    {
      id: 2,
      changedBy: 'Rajesh Sharma (Admin)',
      entity: 'late_mark',
      fieldChanged: 'graceMinutes',
      oldValue: '10',
      newValue: '15',
      timestamp: '2026-07-01 10:05:00',
    },
  ]);
  setStoreItem<ShiftRosterAssignment[]>(STORE_KEYS.SHIFT_ROSTER, []);

  // Update sequences
  setSequence('employee', 18);
  setSequence('department', 8);
  setSequence('shift', 4);
  setSequence('leaveType', 4);
  setSequence('holiday', 9);
  setSequence('attendance', attendanceRecords.length);
  setSequence('leaveBalance', leaveBalances.length);
  setSequence('leaveRequest', 3);
  setSequence('regularization', 1);
  setSequence('auditLog', 2);
  setSequence('payrollRun', 0);

  localStorage.setItem('omech.db_initialized', 'true');
}

/**
 * Reset local store to default seed state
 */
export function resetLocalStore(): void {
  localStorage.clear();
  initializeLocalStore(true);
}

// Auto-run initialization
initializeLocalStore();
