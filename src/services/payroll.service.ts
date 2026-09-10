/**
 * Payroll Domain Service
 * Pure configuration-driven calculation engine for mixed workforce:
 * Permanent Staff (prorated monthly salary) and Contractual Workers (daily wage + OT).
 * Evaluates Late Mark Discipline Policy ladder and Statutory Slabs dynamically.
 */

import {
  PayrollConfig,
  LateMarkPolicyConfig,
  PayrollRun,
  PayrollEmployeeRecord,
  Employee,
  AttendanceRecord,
  Department,
} from '../types';
import { getStoreItem, setStoreItem, nextSequence, STORE_KEYS } from '../data/localStore';

/**
 * Pure helper: Evaluate late-mark consequence for an employee
 */
export function evaluateLateMarkConsequence(
  lateCount: number,
  latePolicy: LateMarkPolicyConfig,
  perDaySalary: number
): { deductionAmount: number; label: string; consequenceType: string } {
  if (lateCount === 0 || !latePolicy.ladder || latePolicy.ladder.length === 0) {
    return { deductionAmount: 0, label: 'Clean Record', consequenceType: 'none' };
  }

  // Sort ladder descending by threshold
  const sortedLadder = [...latePolicy.ladder].sort((a, b) => b.thresholdCount - a.thresholdCount);
  const matchingRule = sortedLadder.find((row) => lateCount >= row.thresholdCount);

  if (!matchingRule) {
    return {
      deductionAmount: 0,
      label: `${lateCount} Late mark${lateCount > 1 ? 's' : ''} (Within limits)`,
      consequenceType: 'none',
    };
  }

  let deduction = 0;
  if (matchingRule.consequenceType === 'warning') {
    deduction = 0;
  } else if (matchingRule.consequenceType === 'half_day_deduction') {
    deduction = Number((perDaySalary * 0.5).toFixed(2));
  } else if (matchingRule.consequenceType === 'full_day_deduction') {
    deduction = Number((perDaySalary * 1.0).toFixed(2));
  } else if (matchingRule.consequenceType === 'custom_amount') {
    deduction = matchingRule.consequenceValue;
  }

  return {
    deductionAmount: deduction,
    label: `${matchingRule.label} (${lateCount} late marks)`,
    consequenceType: matchingRule.consequenceType,
  };
}

/**
 * Pure helper: Compute Professional Tax based on config slabs
 */
export function calculateProfessionalTax(gross: number, config: PayrollConfig): number {
  if (!config.professionalTaxSlabs || config.professionalTaxSlabs.length === 0) {
    return 0;
  }
  for (const slab of config.professionalTaxSlabs) {
    if (gross >= slab.fromAmount && gross <= slab.toAmount) {
      return slab.taxAmount;
    }
  }
  return 0;
}

export const payrollService = {
  async getPayrollConfig(): Promise<PayrollConfig> {
    return getStoreItem<PayrollConfig>(STORE_KEYS.PAYROLL_CONFIG, {
      basicPercentOfGross: 45,
      hraPercentOfBasic: 20,
      daPercentOfBasic: 15,
      pfEmployeePercent: 12,
      pfEmployerPercent: 12,
      pfWageCeiling: 15000,
      esiEmployeePercent: 0.75,
      esiEmployerPercent: 3.25,
      esiWageCeiling: 21000,
      professionalTaxSlabs: [],
      overtimeRatePerHour: 120,
      overtimeDailyHoursThreshold: 8.0,
      standardWorkingDays: 26,
      allowNegativeLeaveBalance: false,
    });
  },

  async getLateMarkPolicy(): Promise<LateMarkPolicyConfig> {
    return getStoreItem<LateMarkPolicyConfig>(STORE_KEYS.LATE_MARK_POLICY_CONFIG, {
      graceMinutes: 15,
      resetCycle: 'monthly',
      ladder: [],
    });
  },

  /**
   * Run payroll computation for a specified month and year
   * Pulls attendance, leaves, late marks, and applies config rules dynamically.
   */
  async runPayroll(month: number, year: number): Promise<PayrollRun> {
    const config = await this.getPayrollConfig();
    const latePolicy = await this.getLateMarkPolicy();
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []).filter((e) => e.isActive);
    const departments = getStoreItem<Department[]>(STORE_KEYS.DEPARTMENTS, []);
    const attendanceRecords = getStoreItem<AttendanceRecord[]>(STORE_KEYS.ATTENDANCE, []);

    const monthPrefix = `${year}-${month < 10 ? `0${month}` : `${month}`}`;
    const monthAttendance = attendanceRecords.filter((r) => r.date.startsWith(monthPrefix));

    const records: PayrollEmployeeRecord[] = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let staffCount = 0;
    let contractualCount = 0;

    for (const emp of employees) {
      const dept = departments.find((d) => d.id === emp.departmentId);
      const empAttendance = monthAttendance.filter((r) => r.employeeId === emp.id);

      // Attendance statistics
      const presentDays = empAttendance.filter((r) => r.status === 'present').length;
      const paidLeaveDays = empAttendance.filter((r) => r.status === 'on_leave').length;
      const unpaidLeaveDays = empAttendance.filter((r) => r.status === 'absent').length;
      const weeklyOffDays = empAttendance.filter((r) => r.status === 'weekly_off').length;
      const paidHolidayDays = empAttendance.filter((r) => r.status === 'holiday').length;
      const lateMarkCount = empAttendance.filter((r) => r.isLate).length;

      // Sum overtime hours
      const overtimeHours = Number(
        empAttendance.reduce((sum, r) => sum + (r.overtimeHours || 0), 0).toFixed(1)
      );
      const overtimePay = Number((overtimeHours * config.overtimeRatePerHour).toFixed(2));

      let payableDays = 0;
      let perDaySalary = 0;
      let grossPayable = 0;

      if (emp.category === 'permanent_staff') {
        staffCount++;
        // Standard basis for day wage
        const standardDays = config.standardWorkingDays || 26;
        perDaySalary = Number((emp.basicSalaryOrWage / standardDays).toFixed(2));

        // Permanent staff is paid for Present + Paid Leave + Weekly Offs + Holidays
        payableDays = presentDays + paidLeaveDays + weeklyOffDays + paidHolidayDays;

        if (payableDays >= standardDays) {
          grossPayable = emp.basicSalaryOrWage;
        } else {
          // Prorated
          grossPayable = Number(((emp.basicSalaryOrWage / standardDays) * payableDays).toFixed(2));
        }
      } else {
        contractualCount++;
        // Contractual workers: daily wage * (present days + paid holidays)
        perDaySalary = emp.basicSalaryOrWage;
        payableDays = presentDays + paidHolidayDays;
        grossPayable = Number((payableDays * perDaySalary).toFixed(2));
      }

      // Late mark consequence from config
      const lateEval = evaluateLateMarkConsequence(lateMarkCount, latePolicy, perDaySalary);
      const lateMarkDeductionAmount = lateEval.deductionAmount;

      // Statutory Breakdown using dynamic config percentages:
      const basic = Number((grossPayable * (config.basicPercentOfGross / 100)).toFixed(2));
      const hra = Number((basic * (config.hraPercentOfBasic / 100)).toFixed(2));
      const da = Number((basic * (config.daPercentOfBasic / 100)).toFixed(2));
      const otherAllowances = Math.max(0, Number((grossPayable - (basic + hra + da)).toFixed(2)));

      // PF calculation: 12% on (Basic + DA), capped at pfWageCeiling
      const pfWageBase = Math.min(basic + da, config.pfWageCeiling);
      const pfEmployee = Number((pfWageBase * (config.pfEmployeePercent / 100)).toFixed(2));
      const pfEmployer = Number((pfWageBase * (config.pfEmployerPercent / 100)).toFixed(2));

      // ESI calculation: Only if gross <= esiWageCeiling
      let esiEmployee = 0;
      let esiEmployer = 0;
      if (grossPayable <= config.esiWageCeiling) {
        esiEmployee = Number((grossPayable * (config.esiEmployeePercent / 100)).toFixed(2));
        esiEmployer = Number((grossPayable * (config.esiEmployerPercent / 100)).toFixed(2));
      }

      // Professional Tax from slab table
      const professionalTax = calculateProfessionalTax(grossPayable, config);

      // Total deductions & net salary
      const deductions = Number(
        (pfEmployee + esiEmployee + professionalTax + lateMarkDeductionAmount).toFixed(2)
      );
      const netSalary = Number((grossPayable + overtimePay - deductions).toFixed(2));

      totalGross += grossPayable + overtimePay;
      totalDeductions += deductions;
      totalNet += netSalary;

      records.push({
        employeeId: emp.id,
        employeeCode: emp.employeeCode,
        employeeName: emp.name,
        departmentName: dept ? dept.name : 'Shop Floor',
        designation: emp.designation,
        category: emp.category,
        presentDays,
        paidLeaveDays,
        unpaidLeaveDays,
        weeklyOffDays,
        paidHolidayDays,
        payableDays,
        lateMarkCount,
        lateMarkDeductionAmount,
        lateMarkConsequenceLabel: lateEval.label,
        overtimeHours,
        overtimePay,
        grossPayable,
        basic,
        hra,
        da,
        otherAllowances,
        pfEmployee,
        pfEmployer,
        esiEmployee,
        esiEmployer,
        professionalTax,
        totalDeductions: deductions,
        netSalary,
        bankName: emp.bankDetails.bankName,
        accountNumber: emp.bankDetails.accountNumber,
        ifsc: emp.bankDetails.ifsc,
        uan: emp.statutory.uan,
        pfNumber: emp.statutory.pfNumber,
        esiNumber: emp.statutory.esiNumber,
      });
    }

    const runs = getStoreItem<PayrollRun[]>(STORE_KEYS.PAYROLL_RUNS, []);
    // Replace draft if already generated for same month/year
    const existingIndex = runs.findIndex(
      (r) => r.month === month && r.year === year && r.status === 'draft'
    );

    const newRun: PayrollRun = {
      id: existingIndex >= 0 ? runs[existingIndex].id : nextSequence('payrollRun'),
      month,
      year,
      status: 'draft',
      totalGross: Number(totalGross.toFixed(2)),
      totalDeductions: Number(totalDeductions.toFixed(2)),
      totalNet: Number(totalNet.toFixed(2)),
      employeeCount: records.length,
      staffCount,
      contractualCount,
      generatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      records,
    };

    if (existingIndex >= 0) {
      runs[existingIndex] = newRun;
    } else {
      runs.push(newRun);
    }

    setStoreItem(STORE_KEYS.PAYROLL_RUNS, runs);
    return newRun;
  },

  async getPayrollRuns(): Promise<PayrollRun[]> {
    return getStoreItem<PayrollRun[]>(STORE_KEYS.PAYROLL_RUNS, []);
  },

  async getPayrollRunById(id: number): Promise<PayrollRun | null> {
    const runs = getStoreItem<PayrollRun[]>(STORE_KEYS.PAYROLL_RUNS, []);
    return runs.find((r) => r.id === id) || null;
  },

  async finalizePayrollRun(id: number): Promise<PayrollRun> {
    const runs = getStoreItem<PayrollRun[]>(STORE_KEYS.PAYROLL_RUNS, []);
    const run = runs.find((r) => r.id === id);
    if (!run) throw new Error(`Payroll run ${id} not found.`);

    run.status = 'finalized';
    run.finalizedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

    setStoreItem(STORE_KEYS.PAYROLL_RUNS, runs);
    return run;
  },

  async getEmployeePayslip(
    payrollRunId: number,
    employeeId: number
  ): Promise<PayrollEmployeeRecord | null> {
    const run = await this.getPayrollRunById(payrollRunId);
    if (!run) return null;
    return run.records.find((r) => r.employeeId === employeeId) || null;
  },

  /**
   * Get latest payslip history for a specific worker
   */
  async getEmployeePayslipHistory(employeeId: number): Promise<{
    run: PayrollRun;
    payslip: PayrollEmployeeRecord;
  }[]> {
    const runs = getStoreItem<PayrollRun[]>(STORE_KEYS.PAYROLL_RUNS, []);
    const history: { run: PayrollRun; payslip: PayrollEmployeeRecord }[] = [];

    for (const r of runs) {
      const rec = r.records.find((rec) => rec.employeeId === employeeId);
      if (rec) {
        history.push({ run: r, payslip: rec });
      }
    }

    return history.sort((a, b) => b.run.year - a.run.year || b.run.month - a.run.month);
  },
};
