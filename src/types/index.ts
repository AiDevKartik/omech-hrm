/**
 * Type Definitions for Omech HRM System
 */

export type Role = 'admin' | 'supervisor' | 'worker';

export type WorkforceCategory = 'permanent_staff' | 'contractual' | 'contractual_worker';

export type AttendanceStatus =
  | 'present'
  | 'absent'
  | 'half_day'
  | 'on_leave'
  | 'holiday'
  | 'weekly_off';

export interface Department {
  id: number;
  code: string;
  name: string;
  headSupervisorId?: number;
}

export interface Shift {
  id: number;
  code: string;
  name: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  graceMinutes: number;
}

export interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  departmentId: number;
  shiftId: number;
  category: WorkforceCategory;
  designation: string;
  dateOfJoining: string; // "YYYY-MM-DD"
  joiningDate?: string;
  basicSalaryOrWage: number; // Monthly gross for staff, daily wage for contractual
  bankDetails: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
  };
  statutory: {
    uan: string;
    pfNumber: string;
    esiNumber: string;
  };
  weeklyOffDay: number; // 0 = Sunday, 1 = Monday, etc.
  supervisorDepartments?: number[]; // IDs of supervised departments
  isActive: boolean;
}

export interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string; // "YYYY-MM-DD"
  checkIn: string | null;  // "HH:mm"
  checkOut: string | null; // "HH:mm"
  status: AttendanceStatus;
  isLate: boolean;
  lateMinutes: number;
  overtimeHours: number;
  workingHours: number;
  leaveTypeId?: number;
  regularized: boolean;
  remarks?: string;
}

export interface RegularizationRequest {
  id: number;
  employeeId: number;
  attendanceId?: number;
  date: string;
  requestedCheckIn: string;
  requestedCheckOut: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  actionedBy?: number;
  actionedAt?: string;
  comments?: string;
}

export type LeaveAccrualMethod = 'yearly-upfront' | 'monthly-credit' | 'attendance-based';

export interface LeaveType {
  id: number;
  code: string;
  label: string;
  name?: string;
  color: string;
  annualEntitlement: number;
  daysPerYear?: number;
  accrualMethod: LeaveAccrualMethod;
  attendanceBasedDaysRequired?: number; // e.g. 20 consecutive present days
  carryForwardAllowed: boolean;
  maxCarryForwardDays: number;
  carryForwardMax?: number;
  isEncashable?: boolean;
  applicableTo: 'staff' | 'contractual' | 'both';
}

export interface LeaveBalance {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  year: number;
  openingBalance: number;
  accrued: number;
  taken: number;
  carriedForward: number;
  currentBalance: number;
  closingBalance?: number;
}

export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: string;
  actionedBy?: number;
  actionedAt?: string;
  comments?: string;
}

export interface LateMarkConsequence {
  id: number;
  thresholdCount: number;
  consequenceType: 'warning' | 'half_day_deduction' | 'full_day_deduction' | 'custom_amount';
  consequenceValue: number; // 0, 0.5 (half-day wage), 1.0 (full-day wage), or fixed amount
  label: string;
}

export interface LateMarkPolicyConfig {
  graceMinutes: number;
  resetCycle: 'monthly' | 'yearly';
  ladder: LateMarkConsequence[];
}

export interface ProfessionalTaxSlab {
  fromAmount: number;
  toAmount: number;
  taxAmount: number;
}

export interface PayrollConfig {
  basicPercentOfGross: number; // e.g. 45
  hraPercentOfBasic: number;    // e.g. 20
  daPercentOfBasic: number;     // e.g. 15
  pfEmployeePercent: number;    // e.g. 12
  pfEmployerPercent: number;    // e.g. 12
  pfWageCeiling: number;        // e.g. 15000
  esiEmployeePercent: number;   // e.g. 0.75
  esiEmployerPercent: number;   // e.g. 3.25
  esiWageCeiling: number;       // e.g. 21000
  professionalTaxSlabs: ProfessionalTaxSlab[];
  overtimeRatePerHour: number;  // e.g. 120
  overtimeDailyHoursThreshold: number; // e.g. 8.0
  standardWorkingDays: number;  // e.g. 26
  allowNegativeLeaveBalance: boolean;
}

export interface Holiday {
  id: number;
  date: string; // "YYYY-MM-DD"
  name: string;
  isPaid: boolean;
  year?: number;
  isGazetted?: boolean;
}

export interface WeeklyOffRule {
  id: number;
  name: string;
  dayOfWeek: number; // 0=Sun, 1=Mon, ..., 6=Sat
  shiftId?: number;
  isRotational: boolean;
}

export interface ConfigAuditLog {
  id: number;
  changedBy: string;
  entity: 'payroll' | 'leave' | 'late_mark' | 'shift' | 'holiday' | 'department';
  fieldChanged?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  action?: string;
  details?: any;
}

export interface PayrollEmployeeRecord {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  designation: string;
  category: WorkforceCategory;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  weeklyOffDays: number;
  paidHolidayDays: number;
  payableDays: number;
  lateMarkCount: number;
  lateMarkDeductionAmount: number;
  lateMarkConsequenceLabel: string;
  overtimeHours: number;
  overtimePay: number;
  grossPayable: number;
  basic: number;
  hra: number;
  da: number;
  otherAllowances: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  professionalTax: number;
  totalDeductions: number;
  netSalary: number;
  bankName: string;
  accountNumber: string;
  ifsc: string;
  uan: string;
  pfNumber: string;
  esiNumber: string;
}

export interface PayrollRun {
  id: number;
  month: number; // 1-12
  year: number;  // e.g. 2026
  status: 'draft' | 'finalized';
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  employeeCount: number;
  staffCount: number;
  contractualCount: number;
  generatedAt: string;
  finalizedAt?: string;
  records: PayrollEmployeeRecord[];
}

export interface ShiftRosterAssignment {
  id: number;
  employeeId: number;
  date: string; // YYYY-MM-DD
  shiftId: number;
}

export interface UserSession {
  userId: number;
  employeeId: number;
  employeeCode: string;
  name: string;
  role: Role;
  departmentId: number;
  supervisorDepartments: number[];
  issuedAt: number;
  expiresAt: number;
}
