/**
 * Statutory Payroll View
 * Configuration-driven calculation engine for mixed workforce.
 * Separates Permanent Staff (prorated monthly salary) and Contractual Workers (daily wage + OT).
 * Full Excel export, finalize locking, and formal PDF payslips.
 */

import React, { useState } from 'react';
import {
  usePayrollRuns,
  useRunPayroll,
  useFinalizePayrollRun,
  useEmployeePayslipHistory,
} from '../../hooks/useHRM';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { exportToExcel } from '../../utils/excelExport';
import { PayslipModal } from './PayslipModal';
import { PayrollEmployeeRecord, PayrollRun } from '../../types';
import {
  Coins,
  Play,
  Lock,
  Download,
  FileSpreadsheet,
  FileText,
  Users,
  HardHat,
  ChevronRight,
  Printer,
  ShieldCheck,
} from 'lucide-react';

export function PayrollView() {
  const { role, employee } = useAuth();
  const { success, error } = useToast();

  const [selectedMonth, setSelectedMonth] = useState(8); // August 2026 default
  const [selectedYear, setSelectedYear] = useState(2026);
  const [categoryTab, setCategoryTab] = useState<'all' | 'staff' | 'contractual'>('all');
  const [activePayslipRecord, setActivePayslipRecord] = useState<{
    record: PayrollEmployeeRecord;
    run: PayrollRun;
  } | null>(null);

  // Queries
  const { data: runs = [], refetch } = usePayrollRuns();
  const runMutation = useRunPayroll();
  const finalizeMutation = useFinalizePayrollRun();

  // If worker role, get personal payslip history
  const { data: workerHistory = [] } = useEmployeePayslipHistory(
    role === 'worker' && employee ? employee.id : 0
  );

  // Active or latest payroll run for the selected month/year
  const currentRun = runs.find((r) => r.month === selectedMonth && r.year === selectedYear) || runs[0];

  const handleGeneratePayroll = async () => {
    try {
      await runMutation.mutateAsync({ month: selectedMonth, year: selectedYear });
      success(`Payroll calculation completed for ${selectedMonth}/${selectedYear}.`);
    } catch (err: any) {
      error(err.message || 'Payroll generation failed');
    }
  };

  const handleFinalize = async (runId: number) => {
    try {
      await finalizeMutation.mutateAsync(runId);
      success(`Payroll Run #${runId} finalized and locked for statutory filing.`);
    } catch (err: any) {
      error(err.message || 'Failed to finalize');
    }
  };

  const handleExportExcel = () => {
    if (!currentRun || !currentRun.records) return;

    const data = currentRun.records.map((r) => ({
      'Employee Code': r.employeeCode,
      'Name': r.employeeName,
      'Department': r.departmentName,
      'Category': r.category === 'permanent_staff' ? 'Staff' : 'Contractor',
      'Payable Days': r.payableDays,
      'OT Hours': r.overtimeHours,
      'OT Pay': r.overtimePay,
      'Gross Payable': r.grossPayable + r.overtimePay,
      'Basic': r.basic,
      'HRA': r.hra,
      'DA': r.da,
      'Allowances': r.otherAllowances,
      'PF (12%)': r.pfEmployee,
      'ESI (0.75%)': r.esiEmployee,
      'Professional Tax': r.professionalTax,
      'Late Marks': r.lateMarkCount,
      'Late Mark Deduction': r.lateMarkDeductionAmount,
      'Late Mark Policy Rule': r.lateMarkConsequenceLabel,
      'Total Deductions': r.totalDeductions,
      'Net Salary': r.netSalary,
      'Bank': r.bankName,
      'Account Number': r.accountNumber,
      'IFSC': r.ifsc,
      'UAN': r.uan,
      'PF Number': r.pfNumber,
      'ESI Number': r.esiNumber,
    }));

    exportToExcel(data, `Payroll_Register_${currentRun.month}_${currentRun.year}`, 'Payroll Register');
    success('Payroll register exported to Excel (.xlsx)');
  };

  // Filter records by category
  const filteredRecords = (currentRun?.records || []).filter((r) => {
    if (categoryTab === 'staff') return r.category === 'permanent_staff';
    if (categoryTab === 'contractual') return r.category === 'contractual' || (r.category as string) === 'contractual_worker';
    return true;
  });

  // If Worker Role, render self-service payslip history
  if (role === 'worker') {
    return (
      <div className="space-y-4">
        <div className="bg-stone-950 border border-stone-800 p-4">
          <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
            Worker Self-Service Portal
          </div>
          <h1 className="font-display font-bold text-xl text-stone-100 tracking-tight">
            My Monthly Payslips
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Download your formal salary and wage disbursal slips with statutory PF & ESI numbers.
          </p>
        </div>

        <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
                  <th className="p-3">Period</th>
                  <th className="p-3">Payable Days</th>
                  <th className="p-3">OT Hours</th>
                  <th className="p-3">Gross Earnings</th>
                  <th className="p-3">Deductions (PF/ESI/PT)</th>
                  <th className="p-3">Net Take-Home</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {workerHistory.length > 0 ? (
                  workerHistory.map((item) => (
                    <tr key={item.run.id} className="hover:bg-stone-900/40">
                      <td className="p-3 text-stone-200 font-bold">
                        Month {item.run.month} / {item.run.year}
                      </td>
                      <td className="p-3 text-stone-300">{item.payslip.payableDays} Days</td>
                      <td className="p-3 text-amber-400">{item.payslip.overtimeHours} Hrs</td>
                      <td className="p-3 text-stone-200">
                        ₹{(item.payslip.grossPayable + item.payslip.overtimePay).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-red-400">
                        ₹{item.payslip.totalDeductions.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-amber-400 font-bold text-sm">
                        ₹{item.payslip.netSalary.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 text-right font-sans">
                        <button
                          onClick={() =>
                            setActivePayslipRecord({ record: item.payslip, run: item.run })
                          }
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold uppercase font-mono tracking-wider"
                        >
                          View & Download PDF
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-stone-500 font-sans">
                      No payslips generated for your profile yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {activePayslipRecord && (
          <PayslipModal
            isOpen={!!activePayslipRecord}
            onClose={() => setActivePayslipRecord(null)}
            record={activePayslipRecord.record}
            run={activePayslipRecord.run}
          />
        )}
      </div>
    );
  }

  // Admin / HR View
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950 border border-stone-800 p-4">
        <div>
          <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
            Payroll & Statutory Disbursal
          </div>
          <h1 className="font-display font-bold text-xl text-stone-100 tracking-tight">
            Indian Statutory Payroll Engine
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month/Year selector */}
          <div className="flex items-center bg-stone-900 border border-stone-700 p-1">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-stone-200 text-xs font-medium px-2 py-0.5"
            >
              <option value={8}>August (08)</option>
              <option value={9}>September (09)</option>
              <option value={10}>October (10)</option>
            </select>
            <span className="text-stone-500 font-mono">/</span>
            <span className="text-stone-200 text-xs font-mono px-2">{selectedYear}</span>
          </div>

          <button
            onClick={handleGeneratePayroll}
            disabled={runMutation.isPending}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{runMutation.isPending ? 'Calculating...' : 'Run Computation'}</span>
          </button>

          {currentRun && currentRun.status === 'draft' && (
            <button
              onClick={() => handleFinalize(currentRun.id)}
              disabled={finalizeMutation.isPending}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-emerald-400 border border-stone-700 text-xs font-semibold uppercase font-mono tracking-wider flex items-center gap-1.5"
              title="Lock payroll for bank disbursal and statutory PF filing"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Finalize & Lock</span>
            </button>
          )}

          {currentRun && (
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold uppercase font-mono tracking-wider flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel Register</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {currentRun ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-stone-900 border border-stone-800 p-4">
            <span className="text-[10px] font-mono uppercase text-stone-500 block mb-1">
              Gross Wage Disbursal
            </span>
            <div className="font-display font-bold text-2xl text-stone-100">
              ₹{currentRun.totalGross.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-stone-500 mt-1 font-mono">
              Includes OT & allowances
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4">
            <span className="text-[10px] font-mono uppercase text-stone-500 block mb-1">
              Total Deductions
            </span>
            <div className="font-display font-bold text-2xl text-red-400">
              ₹{currentRun.totalDeductions.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-stone-500 mt-1 font-mono">
              PF + ESI + PT + Late Marks
            </div>
          </div>

          <div className="bg-stone-900 border border-amber-500/40 p-4 col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
              Net Disbursal (Bank)
            </span>
            <div className="font-display font-bold text-2xl text-amber-400">
              ₹{currentRun.totalNet.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 font-mono">
              Ready for NEFT batch
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4">
            <span className="text-[10px] font-mono uppercase text-stone-500 block mb-1">
              Permanent Staff
            </span>
            <div className="font-display font-bold text-2xl text-stone-200">
              {currentRun.staffCount}
            </div>
            <div className="text-[10px] text-stone-500 mt-1">
              Monthly prorated basis
            </div>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4">
            <span className="text-[10px] font-mono uppercase text-stone-500 block mb-1">
              Contractual Workers
            </span>
            <div className="font-display font-bold text-2xl text-amber-500">
              {currentRun.contractualCount}
            </div>
            <div className="text-[10px] text-stone-500 mt-1">
              Daily wage × days + OT
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-stone-900 border border-stone-800 p-8 text-center text-stone-400 text-xs">
          No payroll run computed yet for {selectedMonth}/{selectedYear}. Click "Run Computation" to execute the rule engine.
        </div>
      )}

      {/* Workforce Category Switcher Tab */}
      <div className="flex items-center justify-between border-b border-stone-800 text-xs">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCategoryTab('all')}
            className={`px-4 py-2.5 font-semibold uppercase tracking-wider border-b-2 transition ${
              categoryTab === 'all'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            All Workers ({currentRun?.records?.length || 0})
          </button>

          <button
            onClick={() => setCategoryTab('staff')}
            className={`px-4 py-2.5 font-semibold uppercase tracking-wider border-b-2 transition ${
              categoryTab === 'staff'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Permanent Staff ({currentRun?.staffCount || 0})
          </button>

          <button
            onClick={() => setCategoryTab('contractual')}
            className={`px-4 py-2.5 font-semibold uppercase tracking-wider border-b-2 transition ${
              categoryTab === 'contractual'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            Contractual Floor Workers ({currentRun?.contractualCount || 0})
          </button>
        </div>

        <div className="text-[10px] font-mono text-stone-500">
          Run Status:{' '}
          <span
            className={`uppercase font-bold ${
              currentRun?.status === 'finalized' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {currentRun?.status || 'Draft'}
          </span>
        </div>
      </div>

      {/* Payroll Register Table */}
      {currentRun && (
        <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
                  <th className="p-3">Worker Info</th>
                  <th className="p-3">Payable Days</th>
                  <th className="p-3">OT Pay</th>
                  <th className="p-3">Gross Payable</th>
                  <th className="p-3">PF (12%)</th>
                  <th className="p-3">ESI</th>
                  <th className="p-3">PT</th>
                  <th className="p-3">Late Deduct</th>
                  <th className="p-3">Total Deduct</th>
                  <th className="p-3 text-amber-400 font-bold">Net Salary</th>
                  <th className="p-3 text-right">Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono text-xs">
                {filteredRecords.map((r) => (
                  <tr key={r.employeeId} className="hover:bg-stone-900/40 transition">
                    <td className="p-3 font-sans">
                      <div className="font-semibold text-stone-200">{r.employeeName}</div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        {r.employeeCode} • {r.category === 'permanent_staff' ? 'Staff' : 'Contractor'}
                      </div>
                    </td>

                    <td className="p-3 text-stone-300">
                      {r.payableDays} d
                      <span className="text-[10px] text-stone-500 block font-mono">
                        (P:{r.presentDays} L:{r.paidLeaveDays} H:{r.paidHolidayDays})
                      </span>
                    </td>

                    <td className="p-3 text-amber-400">
                      ₹{r.overtimePay}
                      <span className="text-[10px] text-stone-500 block font-mono">
                        {r.overtimeHours} hrs
                      </span>
                    </td>

                    <td className="p-3 text-stone-100 font-bold">
                      ₹{(r.grossPayable + r.overtimePay).toLocaleString('en-IN')}
                    </td>

                    <td className="p-3 text-stone-400">₹{r.pfEmployee}</td>
                    <td className="p-3 text-stone-400">₹{r.esiEmployee}</td>
                    <td className="p-3 text-stone-400">₹{r.professionalTax}</td>

                    <td className="p-3">
                      {r.lateMarkDeductionAmount > 0 ? (
                        <span className="text-red-400 font-bold">
                          ₹{r.lateMarkDeductionAmount}
                          <span className="text-[10px] text-stone-500 block font-mono">
                            {r.lateMarkCount} late marks
                          </span>
                        </span>
                      ) : (
                        <span className="text-stone-600">—</span>
                      )}
                    </td>

                    <td className="p-3 text-red-400 font-semibold">
                      ₹{r.totalDeductions.toLocaleString('en-IN')}
                    </td>

                    <td className="p-3 text-amber-400 font-bold text-sm">
                      ₹{r.netSalary.toLocaleString('en-IN')}
                    </td>

                    <td className="p-3 text-right font-sans">
                      <button
                        onClick={() => setActivePayslipRecord({ record: r, run: currentRun })}
                        className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-[11px] font-semibold flex items-center gap-1 ml-auto"
                        title="Generate official statutory PDF payslip"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" />
                        <span>Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payslip Modal */}
      {activePayslipRecord && (
        <PayslipModal
          isOpen={!!activePayslipRecord}
          onClose={() => setActivePayslipRecord(null)}
          record={activePayslipRecord.record}
          run={activePayslipRecord.run}
        />
      )}
    </div>
  );
}
