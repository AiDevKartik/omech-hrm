/**
 * Statutory & Operational Reports View
 * Indian Compliance Reports:
 * - Muster Roll (Form II, Factories Act, 1948)
 * - Overtime Register (Form IV, Minimum Wages Act)
 * - PF Electronic Challan cum Return (ECR)
 * - ESI Monthly Contribution Return
 * - Late Mark Disciplinary Report
 * - Form 16 / TDS Summary
 * All filterable and exportable to Excel (.xlsx) and printable.
 */

import React, { useState } from 'react';
import {
  useEmployees,
  useDepartments,
  useMonthlyRegister,
  usePayrollRuns,
} from '../../hooks/useHRM';
import { exportToExcel } from '../../utils/excelExport';
import { useToast } from '../../context/ToastContext';
import { STRINGS } from '../../constants/strings';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Filter,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

export function ReportsView() {
  const { success } = useToast();
  const [reportType, setReportType] = useState<
    'muster_form_2' | 'overtime_form_4' | 'pf_ecr' | 'esi_return' | 'late_disciplinary' | 'form_16'
  >('muster_form_2');

  const [selectedMonth, setSelectedMonth] = useState(8);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedDeptId, setSelectedDeptId] = useState<number | 'all'>('all');

  const { data: employees = [] } = useEmployees({ isActive: true });
  const { data: departments = [] } = useDepartments();
  const { data: attendance = [] } = useMonthlyRegister(selectedMonth, selectedYear);
  const { data: payrollRuns = [] } = usePayrollRuns();

  const currentRun = payrollRuns.find((r) => r.month === selectedMonth && r.year === selectedYear) || payrollRuns[0];

  const filteredEmployees = employees.filter((e) =>
    selectedDeptId === 'all' ? true : e.departmentId === selectedDeptId
  );

  // Generate Report Datasets based on selected type
  const generateReportData = () => {
    switch (reportType) {
      case 'muster_form_2': {
        return filteredEmployees.map((emp, index) => {
          const empAttendance = attendance.filter((a) => a.employeeId === emp.id);
          const presentCount = empAttendance.filter((a) => a.status === 'present').length;
          const leaveCount = empAttendance.filter((a) => a.status === 'on_leave').length;
          const holidayCount = empAttendance.filter((a) => a.status === 'holiday').length;
          const weeklyOffCount = empAttendance.filter((a) => a.status === 'weekly_off').length;
          const absentCount = empAttendance.filter((a) => a.status === 'absent').length;

          return {
            'Sr No': index + 1,
            'Worker Code': emp.employeeCode,
            'Name': emp.name,
            'Designation': emp.designation,
            'Category': emp.category === 'permanent_staff' ? 'Permanent' : 'Contractual',
            'Present Days': presentCount,
            'Paid Leaves': leaveCount,
            'Holidays': holidayCount,
            'Weekly Offs': weeklyOffCount,
            'Absences': absentCount,
            'Total Payable': presentCount + leaveCount + holidayCount + weeklyOffCount,
          };
        });
      }

      case 'overtime_form_4': {
        const rows: any[] = [];
        attendance
          .filter((a) => (a.overtimeHours || 0) > 0)
          .forEach((rec, idx) => {
            const emp = employees.find((e) => e.id === rec.employeeId);
            if (emp && (selectedDeptId === 'all' || emp.departmentId === selectedDeptId)) {
              rows.push({
                'Sr No': idx + 1,
                'Date': rec.date,
                'Worker Code': emp.employeeCode,
                'Name': emp.name,
                'Category': emp.category === 'permanent_staff' ? 'Staff' : 'Contractor',
                'Normal Working Hours': rec.workingHours,
                'Overtime Hours Logged': rec.overtimeHours,
                'OT Hourly Rate (INR)': 120,
                'Total OT Payable (INR)': (rec.overtimeHours || 0) * 120,
              });
            }
          });
        return rows;
      }

      case 'pf_ecr': {
        if (!currentRun) return [];
        return currentRun.records.map((r, idx) => ({
          'Member ID / UAN': r.uan || 'N/A',
          'Member Name': r.employeeName,
          'Gross Wages': r.grossPayable,
          'EPF Wages (Capped 15k)': Math.min(15000, r.basic),
          'EPS Wages': Math.min(15000, r.basic),
          'EDLI Wages': Math.min(15000, r.basic),
          'EE Share (12%)': r.pfEmployee,
          'ER EPS Share (8.33%)': Math.round(Math.min(15000, r.basic) * 0.0833),
          'ER EPF Share (3.67%)': r.pfEmployer - Math.round(Math.min(15000, r.basic) * 0.0833),
          'Non-Contributory Days': 31 - r.payableDays,
        }));
      }

      case 'esi_return': {
        if (!currentRun) return [];
        return currentRun.records.map((r, idx) => ({
          'IP Number': r.esiNumber || 'N/A',
          'IP Name': r.employeeName,
          'No of Days Paid': r.payableDays,
          'Total Monthly Wages': r.grossPayable + r.overtimePay,
          'IP Contribution (0.75%)': r.esiEmployee,
          'Employer Contribution (3.25%)': r.esiEmployer,
          'Total ESI Remitted': r.esiEmployee + r.esiEmployer,
        }));
      }

      case 'late_disciplinary': {
        const rows: any[] = [];
        attendance
          .filter((a) => a.isLate)
          .forEach((rec, idx) => {
            const emp = employees.find((e) => e.id === rec.employeeId);
            if (emp && (selectedDeptId === 'all' || emp.departmentId === selectedDeptId)) {
              rows.push({
                'Sr No': idx + 1,
                'Date': rec.date,
                'Worker Code': emp.employeeCode,
                'Worker Name': emp.name,
                'Designation': emp.designation,
                'Punch-In Time': rec.checkIn,
                'Late Minutes': rec.lateMinutes,
                'Disciplinary Note': 'Auto-flagged against 15m grace window',
              });
            }
          });
        return rows;
      }

      case 'form_16': {
        if (!currentRun) return [];
        return currentRun.records
          .filter((r) => r.category === 'permanent_staff')
          .map((r, idx) => ({
            'PAN / Emp Code': r.employeeCode,
            'Employee Name': r.employeeName,
            'Designation': r.designation,
            'Gross Annual Projection': (r.grossPayable + r.overtimePay) * 12,
            'Standard Deduction (u/s 16)': 50000,
            'Professional Tax (Sec 16iii)': r.professionalTax * 12,
            'Net Taxable Income': (r.grossPayable + r.overtimePay) * 12 - 50000 - r.professionalTax * 12,
            'TDS Deducted': 0,
          }));
      }
    }
  };

  const reportData = generateReportData();

  const handleExportExcel = () => {
    exportToExcel(reportData, `${reportType}_${selectedMonth}_${selectedYear}`, 'Statutory Report');
    success('Report exported to Excel (.xlsx)');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950 border border-stone-800 p-4">
        <div>
          <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
            Indian Statutory Compliance
          </div>
          <h1 className="font-display font-bold text-xl text-stone-100 tracking-tight">
            Government Compliance & Factory Registers
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export to Excel</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official Form</span>
          </button>
        </div>
      </div>

      {/* Selector & Filters */}
      <div className="bg-stone-950 border border-stone-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Report Selection */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-mono">Statutory Register:</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="bg-stone-900 border border-stone-700 p-1.5 text-stone-100 font-semibold"
            >
              <option value="muster_form_2">Muster Roll (Form II - Factories Act)</option>
              <option value="overtime_form_4">Overtime Register (Form IV - Minimum Wages)</option>
              <option value="pf_ecr">PF Electronic Challan cum Return (ECR)</option>
              <option value="esi_return">ESI Monthly Contribution Return</option>
              <option value="late_disciplinary">Late Mark Disciplinary Register</option>
              <option value="form_16">Form 16 / TDS Salary Projections</option>
            </select>
          </div>

          {/* Department */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-mono">Department:</span>
            <select
              value={selectedDeptId}
              onChange={(e) =>
                setSelectedDeptId(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200"
            >
              <option value="all">All Plant Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="font-mono text-stone-400 text-[11px]">
          {reportData.length} records generated
        </div>
      </div>

      {/* Official Header Form Paper */}
      <div className="bg-stone-950 border border-stone-800 p-6 shadow-2xl space-y-4">
        {/* Printable Letterhead */}
        <div className="border-b border-stone-800 pb-4 text-center">
          <h2 className="font-display font-bold text-lg text-stone-100 uppercase tracking-wider">
            {STRINGS.COMPANY_NAME}
          </h2>
          <div className="text-stone-400 text-xs">{STRINGS.COMPANY_ADDRESS}</div>
          <div className="text-[10px] text-stone-500 font-mono mt-0.5">
            CIN: {STRINGS.CIN} • Reg No: MH/FAC/99882/2026
          </div>
          <div className="mt-2 text-amber-400 font-mono font-bold text-xs uppercase underline">
            {reportType === 'muster_form_2' && 'Muster Roll — Prescribed Under Rule 105 (Form No. II)'}
            {reportType === 'overtime_form_4' && 'Register of Overtime — Prescribed Under Rule 25 (Form IV)'}
            {reportType === 'pf_ecr' && 'Employees Provident Fund Electronic Challan cum Return (ECR)'}
            {reportType === 'esi_return' && 'Employees State Insurance Corporation Monthly Contribution Sheet'}
            {reportType === 'late_disciplinary' && 'Plant Floor Late Attendance & Grace Window Log'}
            {reportType === 'form_16' && 'Form 16 Tax Deduction at Source Annual Summary (Sec 192)'}
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto">
          {reportData.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
                  {Object.keys(reportData[0]).map((header) => (
                    <th key={header} className="p-2.5 whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono text-xs">
                {reportData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-stone-900/40">
                    {Object.values(row).map((val: any, i) => (
                      <td key={i} className="p-2.5 whitespace-nowrap text-stone-200">
                        {typeof val === 'number' && !String(val).includes('.')
                          ? val.toLocaleString('en-IN')
                          : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-stone-500 font-mono text-xs">
              No statutory records available for the selected parameters.
            </div>
          )}
        </div>

        <div className="border-t border-stone-800 pt-4 flex items-center justify-between text-[10px] font-mono text-stone-500">
          <span>Omech HRM Statutory Engine • Compliant with Indian Labour Codes</span>
          <span>Authorized Factory Inspector Copy</span>
        </div>
      </div>
    </div>
  );
}
