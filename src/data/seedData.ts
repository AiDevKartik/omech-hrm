/**
 * Realistic Starter Seed Data for Omech Pipes & Tubes Ltd.
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
} from '../types';

export const INITIAL_DEPARTMENTS: Department[] = [
  { id: 1, code: 'MILL-01', name: 'Tube Mill #1 (ERW High Frequency)', headSupervisorId: 2 },
  { id: 2, code: 'MILL-02', name: 'Tube Mill #2 (Seamless Heavy Gauge)', headSupervisorId: 2 },
  { id: 3, code: 'GALV-01', name: 'Galvanizing & Zinc Coating Unit', headSupervisorId: 3 },
  { id: 4, code: 'PICK-01', name: 'Pickling & Chemical Treatment', headSupervisorId: 3 },
  { id: 5, code: 'QA-HYDRO', name: 'Hydro-Testing & Ultrasonic QA', headSupervisorId: 4 },
  { id: 6, code: 'MAINT-01', name: 'Maintenance & Electrical Utilities', headSupervisorId: 5 },
  { id: 7, code: 'LOG-YARD', name: 'Logistics, Yard & Pipe Bundling', headSupervisorId: 6 },
  { id: 8, code: 'ADMIN-HR', name: 'Plant Administration & Accounts', headSupervisorId: 1 },
];

export const INITIAL_SHIFTS: Shift[] = [
  { id: 1, code: 'SH-A', name: 'Shift A (Morning)', startTime: '06:00', endTime: '14:00', graceMinutes: 15 },
  { id: 2, code: 'SH-B', name: 'Shift B (Evening)', startTime: '14:00', endTime: '22:00', graceMinutes: 15 },
  { id: 3, code: 'SH-C', name: 'Shift C (Night)', startTime: '22:00', endTime: '06:00', graceMinutes: 15 },
  { id: 4, code: 'SH-GEN', name: 'General Shift (Office)', startTime: '09:00', endTime: '17:30', graceMinutes: 15 },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 1,
    employeeCode: 'OM-1001',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@omechpipes.com',
    phone: '+91 98220 11234',
    departmentId: 8,
    shiftId: 4,
    category: 'permanent_staff',
    designation: 'General Manager (Plant Operations)',
    dateOfJoining: '2018-03-15',
    basicSalaryOrWage: 85000,
    bankDetails: { bankName: 'State Bank of India', accountNumber: '30981122334', ifsc: 'SBIN0004122' },
    statutory: { uan: '100912384711', pfNumber: 'MH/PUN/0041289/000/1001', esiNumber: '31000984712' },
    weeklyOffDay: 0,
    isActive: true,
  },
  {
    id: 2,
    employeeCode: 'OM-1002',
    name: 'Anil Kulkarni',
    email: 'anil.k@omechpipes.com',
    phone: '+91 98221 44556',
    departmentId: 1,
    shiftId: 1,
    category: 'permanent_staff',
    designation: 'Shift Superintendent (Mills 1 & 2)',
    dateOfJoining: '2019-07-01',
    basicSalaryOrWage: 48000,
    bankDetails: { bankName: 'Bank of Maharashtra', accountNumber: '60124488991', ifsc: 'MAHB0000123' },
    statutory: { uan: '100912384712', pfNumber: 'MH/PUN/0041289/000/1002', esiNumber: '31000984713' },
    weeklyOffDay: 0,
    supervisorDepartments: [1, 2],
    isActive: true,
  },
  {
    id: 3,
    employeeCode: 'OM-1003',
    name: 'Vikram Patil',
    email: 'vikram.p@omechpipes.com',
    phone: '+91 98222 77889',
    departmentId: 3,
    shiftId: 1,
    category: 'permanent_staff',
    designation: 'Process Incharge (Galv & Pickling)',
    dateOfJoining: '2020-01-10',
    basicSalaryOrWage: 45000,
    bankDetails: { bankName: 'HDFC Bank', accountNumber: '501002883344', ifsc: 'HDFC0000456' },
    statutory: { uan: '100912384713', pfNumber: 'MH/PUN/0041289/000/1003', esiNumber: '31000984714' },
    weeklyOffDay: 0,
    supervisorDepartments: [3, 4],
    isActive: true,
  },
  {
    id: 4,
    employeeCode: 'OM-1004',
    name: 'Santosh Shinde',
    email: 'santosh.s@omechpipes.com',
    phone: '+91 98223 99001',
    departmentId: 5,
    shiftId: 1,
    category: 'permanent_staff',
    designation: 'Sr. Quality Assurance Engineer',
    dateOfJoining: '2020-11-15',
    basicSalaryOrWage: 42000,
    bankDetails: { bankName: 'ICICI Bank', accountNumber: '001205001122', ifsc: 'ICIC0000012' },
    statutory: { uan: '100912384714', pfNumber: 'MH/PUN/0041289/000/1004', esiNumber: '31000984715' },
    weeklyOffDay: 0,
    supervisorDepartments: [5],
    isActive: true,
  },
  {
    id: 5,
    employeeCode: 'OM-1005',
    name: 'Manoj Deshmukh',
    email: 'manoj.d@omechpipes.com',
    phone: '+91 98224 22334',
    departmentId: 6,
    shiftId: 1,
    category: 'permanent_staff',
    designation: 'Plant Electrical Maintenance Lead',
    dateOfJoining: '2021-02-01',
    basicSalaryOrWage: 40000,
    bankDetails: { bankName: 'State Bank of India', accountNumber: '30882233441', ifsc: 'SBIN0004122' },
    statutory: { uan: '100912384715', pfNumber: 'MH/PUN/0041289/000/1005', esiNumber: '31000984716' },
    weeklyOffDay: 0,
    supervisorDepartments: [6],
    isActive: true,
  },
  {
    id: 6,
    employeeCode: 'OM-1006',
    name: 'Pooja Iyer',
    email: 'pooja.iyer@omechpipes.com',
    phone: '+91 98225 55667',
    departmentId: 8,
    shiftId: 4,
    category: 'permanent_staff',
    designation: 'HR & Statutory Compliance Officer',
    dateOfJoining: '2021-08-16',
    basicSalaryOrWage: 36000,
    bankDetails: { bankName: 'Axis Bank', accountNumber: '918010045566', ifsc: 'UTIB0000188' },
    statutory: { uan: '100912384716', pfNumber: 'MH/PUN/0041289/000/1006', esiNumber: '31000984717' },
    weeklyOffDay: 0,
    isActive: true,
  },
  // Contractual Workers & Floor Technicians
  {
    id: 7,
    employeeCode: 'OM-2001',
    name: 'Ramesh Yadav',
    email: 'ramesh.yadav@omech-contractor.in',
    phone: '+91 97650 11223',
    departmentId: 1,
    shiftId: 1,
    category: 'contractual',
    designation: 'High-Frequency Welder Operator',
    dateOfJoining: '2022-04-01',
    basicSalaryOrWage: 750, // daily wage
    bankDetails: { bankName: 'Bank of Baroda', accountNumber: '241100012234', ifsc: 'BARB0SANASW' },
    statutory: { uan: '100922381101', pfNumber: 'MH/PUN/0041289/000/2001', esiNumber: '31000881101' },
    weeklyOffDay: 0,
    isActive: true,
  },
  {
    id: 8,
    employeeCode: 'OM-2002',
    name: 'Sunil Pawar',
    email: 'sunil.p@omech-contractor.in',
    phone: '+91 97651 22334',
    departmentId: 1,
    shiftId: 1,
    category: 'contractual',
    designation: 'Mill Sizing Roll Helper',
    dateOfJoining: '2022-05-15',
    basicSalaryOrWage: 620,
    bankDetails: { bankName: 'State Bank of India', accountNumber: '30771122998', ifsc: 'SBIN0004122' },
    statutory: { uan: '100922381102', pfNumber: 'MH/PUN/0041289/000/2002', esiNumber: '31000881102' },
    weeklyOffDay: 0,
    isActive: true,
  },
  {
    id: 9,
    employeeCode: 'OM-2003',
    name: 'Mahesh More',
    email: 'mahesh.m@omech-contractor.in',
    phone: '+91 97652 33445',
    departmentId: 2,
    shiftId: 2,
    category: 'contractual',
    designation: 'Seamless Extrusion Technician',
    dateOfJoining: '2022-06-01',
    basicSalaryOrWage: 780,
    bankDetails: { bankName: 'Canara Bank', accountNumber: '110022334455', ifsc: 'CNRB0001122' },
    statutory: { uan: '100922381103', pfNumber: 'MH/PUN/0041289/000/2003', esiNumber: '31000881103' },
    weeklyOffDay: 0,
    isActive: true,
  },
  {
    id: 10,
    employeeCode: 'OM-2004',
    name: 'Deepak Sawant',
    email: 'deepak.s@omech-contractor.in',
    phone: '+91 97653 44556',
    departmentId: 3,
    shiftId: 1,
    category: 'contractual',
    designation: 'Zinc Bath Galvanizing Operator',
    dateOfJoining: '2022-08-10',
    basicSalaryOrWage: 720,
    bankDetails: { bankName: 'Union Bank of India', accountNumber: '045510022334', ifsc: 'UBIN0545511' },
    statutory: { uan: '100922381104', pfNumber: 'MH/PUN/0041289/000/2004', esiNumber: '31000881104' },
    weeklyOffDay: 0,
    isActive: true,
  },
  {
    id: 11,
    employeeCode: 'OM-2005',
    name: 'Kailash Rathod',
    email: 'kailash.r@omech-contractor.in',
    phone: '+91 97654 55667',
    departmentId: 3,
    shiftId: 2,
    category: 'contractual',
    designation: 'Quenching & Blow-Out Handler',
    dateOfJoining: '2022-09-01',
    basicSalaryOrWage: 640,
    bankDetails: { bankName: 'Bank of Maharashtra', accountNumber: '60128833441', ifsc: 'MAHB0000123' },
    statutory: { uan: '100922381105', pfNumber: 'MH/PUN/0041289/000/2005', esiNumber: '31000881105' },
    weeklyOffDay: 0,
    isActive: true,
  },
  {
    id: 12,
    employeeCode: 'OM-2006',
    name: 'Ganesh Shingate',
    email: 'ganesh.s@omech-contractor.in',
    phone: '+91 97655 66778',
    departmentId: 4,
    shiftId: 1,
    category: 'contractual',
    designation: 'Acid Bath Pickling Helper',
    dateOfJoining: '2022-10-15',
    basicSalaryOrWage: 630,
    bankDetails: { bankName: 'State Bank of India', accountNumber: '30665544332', ifsc: 'SBIN0004122' },
    statutory: { uan: '100922381106', pfNumber: 'MH/PUN/0041289/000/2006', esiNumber: '31000881106' },
    weeklyOffDay: 0,
    isActive: true,
  },
  {
    id: 13,
    employeeCode: 'OM-2007',
    name: 'Babu Chavan',
    email: 'babu.c@omech-contractor.in',
    phone: '+91 97656 77889',
    departmentId: 5,
    shiftId: 1,
    category: 'contractual',
    designation: 'Hydro-Pressure Test Rig Helper',
    dateOfJoining: '2023-01-05',
    basicSalaryOrWage: 650,
    bankDetails: { bankName: 'Bank of Baroda', accountNumber: '241100033445', ifsc: 'BARB0SANASW' },
    statutory: { uan: '100922381107', pfNumber: 'MH/PUN/0041289/000/2007', esiNumber: '31000881107' },
    weeklyOffDay: 0,
    isActive: true,
  },
  {
    id: 14,
    employeeCode: 'OM-2008',
    name: 'Ajay Gaikwad',
    email: 'ajay.g@omech-contractor.in',
    phone: '+91 97657 88990',
    departmentId: 6,
    shiftId: 3,
    category: 'contractual',
    designation: 'Shift Electrician (Motor Overhaul)',
    dateOfJoining: '2023-02-12',
    basicSalaryOrWage: 760,
    bankDetails: { bankName: 'HDFC Bank', accountNumber: '501004991122', ifsc: 'HDFC0000456' },
    statutory: { uan: '100922381108', pfNumber: 'MH/PUN/0041289/000/2008', esiNumber: '31000881108' },
    weeklyOffDay: 0,
    isActive: true,
  },
  {
    id: 15,
    employeeCode: 'OM-2009',
    name: 'Tukaram Jadhav',
    email: 'tukaram.j@omech-contractor.in',
    phone: '+91 97658 99001',
    departmentId: 7,
    shiftId: 1,
    category: 'contractual',
    designation: 'Overhead EOT Crane Operator',
    dateOfJoining: '2023-03-20',
    basicSalaryOrWage: 740,
    bankDetails: { bankName: 'State Bank of India', accountNumber: '30554433221', ifsc: 'SBIN0004122' },
    statutory: { uan: '100922381109', pfNumber: 'MH/PUN/0041289/000/2009', esiNumber: '31000881109' },
    weeklyOffDay: 0,
    isActive: true,
  },
  {
    id: 16,
    employeeCode: 'OM-2010',
    name: 'Sachin Kamble',
    email: 'sachin.k@omech-contractor.in',
    phone: '+91 97659 00112',
    departmentId: 7,
    shiftId: 2,
    category: 'contractual',
    designation: 'Pipe Bundling & Stenciling Rigger',
    dateOfJoining: '2023-04-10',
    basicSalaryOrWage: 620,
    bankDetails: { bankName: 'Canara Bank', accountNumber: '110044556677', ifsc: 'CNRB0001122' },
    statutory: { uan: '100922381110', pfNumber: 'MH/PUN/0041289/000/2010', esiNumber: '31000881110' },
    weeklyOffDay: 0,
    isActive: true,
  },
  {
    id: 17,
    employeeCode: 'OM-1007',
    name: 'Suresh Bhosale',
    email: 'suresh.b@omechpipes.com',
    phone: '+91 98226 66778',
    departmentId: 7,
    shiftId: 4,
    category: 'permanent_staff',
    designation: 'Yard & Dispatch Superintendent',
    dateOfJoining: '2021-11-01',
    basicSalaryOrWage: 39000,
    bankDetails: { bankName: 'Bank of Maharashtra', accountNumber: '60129988776', ifsc: 'MAHB0000123' },
    statutory: { uan: '100912384717', pfNumber: 'MH/PUN/0041289/000/1007', esiNumber: '31000984718' },
    weeklyOffDay: 0,
    supervisorDepartments: [7],
    isActive: true,
  },
  {
    id: 18,
    employeeCode: 'OM-2011',
    name: 'Pandurang Naik',
    email: 'pandurang.n@omech-contractor.in',
    phone: '+91 97660 11223',
    departmentId: 2,
    shiftId: 1,
    category: 'contractual',
    designation: 'Tube End Facing & Beveling Helper',
    dateOfJoining: '2023-05-18',
    basicSalaryOrWage: 630,
    bankDetails: { bankName: 'State Bank of India', accountNumber: '30443322110', ifsc: 'SBIN0004122' },
    statutory: { uan: '100922381111', pfNumber: 'MH/PUN/0041289/000/2011', esiNumber: '31000881111' },
    weeklyOffDay: 0,
    isActive: true,
  },
];

export const INITIAL_LEAVE_TYPES: LeaveType[] = [
  {
    id: 1,
    code: 'CL',
    label: 'Casual Leave',
    color: '#3B82F6', // blue
    annualEntitlement: 8,
    accrualMethod: 'yearly-upfront',
    carryForwardAllowed: false,
    maxCarryForwardDays: 0,
    applicableTo: 'both',
  },
  {
    id: 2,
    code: 'SL',
    label: 'Sick / Medical Leave',
    color: '#EF4444', // red
    annualEntitlement: 7,
    accrualMethod: 'monthly-credit',
    carryForwardAllowed: true,
    maxCarryForwardDays: 14,
    applicableTo: 'both',
  },
  {
    id: 3,
    code: 'PL',
    label: 'Privilege / Earned Leave',
    color: '#10B981', // green
    annualEntitlement: 15,
    accrualMethod: 'attendance-based',
    attendanceBasedDaysRequired: 20, // 20 consecutive present days with 0 leave -> +1 PL
    carryForwardAllowed: true,
    maxCarryForwardDays: 30,
    applicableTo: 'both',
  },
  {
    id: 4,
    code: 'CO',
    label: 'Compensatory Off',
    color: '#F59E0B', // amber
    annualEntitlement: 0,
    accrualMethod: 'attendance-based',
    carryForwardAllowed: false,
    maxCarryForwardDays: 0,
    applicableTo: 'both',
  },
];

export const INITIAL_LATE_MARK_POLICY: LateMarkPolicyConfig = {
  graceMinutes: 15,
  resetCycle: 'monthly',
  ladder: [
    {
      id: 1,
      thresholdCount: 3,
      consequenceType: 'warning',
      consequenceValue: 0,
      label: 'Formal Warning (No pay deduction)',
    },
    {
      id: 2,
      thresholdCount: 6,
      consequenceType: 'half_day_deduction',
      consequenceValue: 0.5,
      label: 'Half-day salary deduction',
    },
    {
      id: 3,
      thresholdCount: 9,
      consequenceType: 'full_day_deduction',
      consequenceValue: 1.0,
      label: 'Full-day salary deduction',
    },
  ],
};

export const INITIAL_PAYROLL_CONFIG: PayrollConfig = {
  basicPercentOfGross: 45,
  hraPercentOfBasic: 20,
  daPercentOfBasic: 15,
  pfEmployeePercent: 12,
  pfEmployerPercent: 12,
  pfWageCeiling: 15000,
  esiEmployeePercent: 0.75,
  esiEmployerPercent: 3.25,
  esiWageCeiling: 21000,
  professionalTaxSlabs: [
    { fromAmount: 0, toAmount: 7500, taxAmount: 0 },
    { fromAmount: 7501, toAmount: 10000, taxAmount: 175 },
    { fromAmount: 10001, toAmount: 9999999, taxAmount: 200 },
  ],
  overtimeRatePerHour: 120,
  overtimeDailyHoursThreshold: 8.0,
  standardWorkingDays: 26,
  allowNegativeLeaveBalance: false,
};

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 1, date: '2026-01-26', name: 'Republic Day', isPaid: true },
  { id: 2, date: '2026-03-03', name: 'Holi / Dhulivandan', isPaid: true },
  { id: 3, date: '2026-05-01', name: 'Maharashtra Day / May Day', isPaid: true },
  { id: 4, date: '2026-08-15', name: 'Independence Day', isPaid: true },
  { id: 5, date: '2026-08-27', name: 'Raksha Bandhan', isPaid: true },
  { id: 6, date: '2026-10-02', name: 'Mahatma Gandhi Jayanti', isPaid: true },
  { id: 7, date: '2026-10-20', name: 'Dussehra (Vijayadashami)', isPaid: true },
  { id: 8, date: '2026-11-08', name: 'Diwali (Laxmi Pujan)', isPaid: true },
  { id: 9, date: '2026-11-10', name: 'Diwali (Balipratipada)', isPaid: true },
];

export const INITIAL_WEEKLY_OFF: WeeklyOffRule[] = [
  { id: 1, name: 'Standard Sunday Off', dayOfWeek: 0, isRotational: false },
  { id: 2, name: 'Maintenance Monday Off (Shift C)', dayOfWeek: 1, shiftId: 3, isRotational: false },
];

/**
 * Generate full prior month (August 2026) and current month (September 1-5, 2026) attendance
 */
export function generateSeedAttendance(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  let recordId = 1;

  // August 2026 has 31 days (2026-08-01 to 2026-08-31)
  // September 2026 has 5 days seeded (2026-09-01 to 2026-09-05)
  const daysInAugust = 31;
  const daysInSeptember = 5;

  const holidayDates = new Set(['2026-08-15', '2026-08-27']);

  // Employee-specific test scenarios:
  // Employee 8 (Sunil Pawar) will have 7 late marks in August -> crosses row 2 (Half day deduction!)
  // Employee 11 (Kailash Rathod) will have 4 late marks in August -> crosses row 1 (Warning)
  // Employee 7 (Ramesh Yadav) will have 22 consecutive present days -> earns +1 PL!
  // Employee 14 (Ajay Gaikwad) will have 24 OT hours in August

  for (let day = 1; day <= daysInAugust; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `2026-08-${dayStr}`;
    const dateObj = new Date(2026, 7, day); // month 7 is August
    const dayOfWeek = dateObj.getDay(); // 0 is Sunday

    for (const emp of INITIAL_EMPLOYEES) {
      const isSunday = dayOfWeek === 0;
      const isHoliday = holidayDates.has(dateStr);

      if (isHoliday) {
        records.push({
          id: recordId++,
          employeeId: emp.id,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          status: 'holiday',
          isLate: false,
          lateMinutes: 0,
          overtimeHours: 0,
          workingHours: 0,
          regularized: false,
          remarks: 'Plant Holiday',
        });
        continue;
      }

      if (isSunday) {
        records.push({
          id: recordId++,
          employeeId: emp.id,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          status: 'weekly_off',
          isLate: false,
          lateMinutes: 0,
          overtimeHours: 0,
          workingHours: 0,
          regularized: false,
          remarks: 'Sunday Weekly Off',
        });
        continue;
      }

      // Specific absences / leaves
      if (emp.id === 9 && (day === 10 || day === 11)) {
        // Mahesh More took 2 days Casual Leave
        records.push({
          id: recordId++,
          employeeId: emp.id,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          status: 'on_leave',
          isLate: false,
          lateMinutes: 0,
          overtimeHours: 0,
          workingHours: 0,
          leaveTypeId: 1, // CL
          regularized: false,
          remarks: 'Approved Casual Leave',
        });
        continue;
      }

      if (emp.id === 12 && day === 18) {
        // Ganesh Shingate unexcused absence
        records.push({
          id: recordId++,
          employeeId: emp.id,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          status: 'absent',
          isLate: false,
          lateMinutes: 0,
          overtimeHours: 0,
          workingHours: 0,
          regularized: false,
          remarks: 'Uninformed Absence',
        });
        continue;
      }

      // Check-in / check-out times based on shift
      let checkIn = '05:55';
      let checkOut = '14:05';
      let isLate = false;
      let lateMinutes = 0;
      let overtimeHours = 0;
      let workingHours = 8;
      let status: 'present' | 'half_day' = 'present';

      if (emp.shiftId === 1) {
        // Morning 06:00
        checkIn = '05:52';
        checkOut = '14:04';
      } else if (emp.shiftId === 2) {
        // Evening 14:00
        checkIn = '13:50';
        checkOut = '22:08';
      } else if (emp.shiftId === 3) {
        // Night 22:00
        checkIn = '21:50';
        checkOut = '06:05';
      } else {
        // General 09:00
        checkIn = '08:55';
        checkOut = '17:35';
        workingHours = 8.5;
      }

      // Sunil Pawar (Emp 8) frequent late arrival scenario
      if (emp.id === 8 && [3, 6, 8, 12, 17, 21, 25].includes(day)) {
        checkIn = '06:28'; // 28 mins after 06:00 (grace is 15 mins)
        isLate = true;
        lateMinutes = 28;
      }

      // Kailash Rathod (Emp 11) late arrival scenario
      if (emp.id === 11 && [4, 7, 13, 22].includes(day)) {
        checkIn = '14:25'; // 25 mins after 14:00
        isLate = true;
        lateMinutes = 25;
      }

      // Ajay Gaikwad (Emp 14) Overtime scenario
      if (emp.id === 14 && day % 3 === 0) {
        overtimeHours = 3;
        workingHours = 11;
        checkOut = '09:05'; // stayed extra for line maintenance
      }

      records.push({
        id: recordId++,
        employeeId: emp.id,
        date: dateStr,
        checkIn,
        checkOut,
        status,
        isLate,
        lateMinutes,
        overtimeHours,
        workingHours,
        regularized: false,
        remarks: isLate ? `Late by ${lateMinutes}m` : undefined,
      });
    }
  }

  // September 1 to 5 (Current Month)
  for (let day = 1; day <= daysInSeptember; day++) {
    const dayStr = `0${day}`;
    const dateStr = `2026-09-${dayStr}`;
    const dateObj = new Date(2026, 8, day);
    const dayOfWeek = dateObj.getDay();

    for (const emp of INITIAL_EMPLOYEES) {
      if (dayOfWeek === 0) {
        records.push({
          id: recordId++,
          employeeId: emp.id,
          date: dateStr,
          checkIn: null,
          checkOut: null,
          status: 'weekly_off',
          isLate: false,
          lateMinutes: 0,
          overtimeHours: 0,
          workingHours: 0,
          regularized: false,
          remarks: 'Sunday Weekly Off',
        });
        continue;
      }

      // For today (September 5, 2026): Some already checked in, some checked out, one marked late
      let checkIn: string | null = '05:54';
      let checkOut: string | null = '14:02';
      let isLate = false;
      let lateMinutes = 0;
      let status: 'present' | 'absent' = 'present';

      if (day === 5) {
        // Today!
        if (emp.id === 8) {
          checkIn = '06:22'; // late today
          isLate = true;
          lateMinutes = 22;
          checkOut = null; // currently on floor!
        } else if (emp.id === 9 || emp.id === 11) {
          // Shift B (starts at 14:00) -> not yet checked in or pending
          checkIn = null;
          checkOut = null;
          status = 'absent';
        } else if (emp.id === 13) {
          checkIn = '05:50';
          checkOut = null; // on shift
        }
      }

      records.push({
        id: recordId++,
        employeeId: emp.id,
        date: dateStr,
        checkIn,
        checkOut,
        status: checkIn ? 'present' : status,
        isLate,
        lateMinutes,
        overtimeHours: 0,
        workingHours: checkIn ? 8 : 0,
        regularized: false,
        remarks: isLate ? `Late by ${lateMinutes}m` : undefined,
      });
    }
  }

  return records;
}

export function generateSeedLeaveBalances(): LeaveBalance[] {
  const balances: LeaveBalance[] = [];
  let id = 1;

  for (const emp of INITIAL_EMPLOYEES) {
    // CL: 8
    balances.push({
      id: id++,
      employeeId: emp.id,
      leaveTypeId: 1, // CL
      year: 2026,
      openingBalance: 8,
      accrued: 8,
      taken: emp.id === 9 ? 2 : 1,
      carriedForward: 0,
      currentBalance: emp.id === 9 ? 6 : 7,
    });

    // SL: 7
    balances.push({
      id: id++,
      employeeId: emp.id,
      leaveTypeId: 2, // SL
      year: 2026,
      openingBalance: 7,
      accrued: 7,
      taken: 0,
      carriedForward: 3,
      currentBalance: 10,
    });

    // PL: 15
    balances.push({
      id: id++,
      employeeId: emp.id,
      leaveTypeId: 3, // PL
      year: 2026,
      openingBalance: 10,
      accrued: 1, // auto accrued from attendance
      taken: 0,
      carriedForward: 10,
      currentBalance: 11,
    });

    // CO: 0
    balances.push({
      id: id++,
      employeeId: emp.id,
      leaveTypeId: 4, // CO
      year: 2026,
      openingBalance: 0,
      accrued: 1,
      taken: 0,
      carriedForward: 0,
      currentBalance: 1,
    });
  }

  return balances;
}

export const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 1,
    employeeId: 7, // Ramesh Yadav (contractual)
    leaveTypeId: 1,
    startDate: '2026-09-12',
    endDate: '2026-09-13',
    daysCount: 2,
    reason: 'Family wedding at native village in Satara',
    status: 'pending',
    appliedAt: '2026-09-04 11:30',
  },
  {
    id: 2,
    employeeId: 10, // Deepak Sawant
    leaveTypeId: 2,
    startDate: '2026-09-15',
    endDate: '2026-09-16',
    daysCount: 2,
    reason: 'Dental surgery and rest',
    status: 'pending',
    appliedAt: '2026-09-03 16:45',
  },
  {
    id: 3,
    employeeId: 9, // Mahesh More
    leaveTypeId: 1,
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    daysCount: 2,
    reason: 'Urgent household repair',
    status: 'approved',
    appliedAt: '2026-08-05 09:00',
    actionedBy: 2,
    actionedAt: '2026-08-06 10:15',
    comments: 'Approved by Shift Superintendent Anil Kulkarni',
  },
];
