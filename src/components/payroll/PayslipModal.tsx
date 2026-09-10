/**
 * Official Indian Statutory Payslip Modal
 * Formal industrial payslip preview with one-click PDF download
 */

import React from 'react';
import { PayrollEmployeeRecord, PayrollRun } from '../../types';
import { generatePayslipPDF } from '../../utils/pdfExport';
import { STRINGS } from '../../constants/strings';
import { X, Download, Printer, Factory, Building, ShieldCheck } from 'lucide-react';

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: PayrollEmployeeRecord;
  run: PayrollRun;
}

export function PayslipModal({ isOpen, onClose, record, run }: PayslipModalProps) {
  if (!isOpen) return null;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[run.month - 1];

  const handleDownloadPDF = () => {
    generatePayslipPDF(record, run);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header Bar */}
        <div className="bg-stone-950 px-5 py-3 border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Factory className="w-4 h-4 text-amber-500" />
            <span className="font-mono text-xs text-stone-300 font-semibold uppercase">
              Statutory Payslip • {monthName} {run.year}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase font-mono tracking-wider flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-200">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Payslip Document Body */}
        <div className="p-6 space-y-4 overflow-y-auto bg-stone-950 text-xs flex-1">
          {/* Company Letterhead */}
          <div className="border-b border-stone-800 pb-4 flex items-start justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-stone-100 uppercase tracking-wide">
                {STRINGS.COMPANY_NAME}
              </h2>
              <div className="text-[11px] text-stone-400">{STRINGS.COMPANY_ADDRESS}</div>
              <div className="text-[10px] text-stone-500 font-mono">
                CIN: {STRINGS.CIN} • {STRINGS.FACTORY_LOCATION}
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-amber-400 text-xs block">
                PAYSLIP: {monthName.toUpperCase()} {run.year}
              </span>
              <span className="text-[10px] font-mono text-stone-500">
                Run #{run.id} • {run.status === 'finalized' ? 'Locked' : 'Draft'}
              </span>
            </div>
          </div>

          {/* Employee Metadata Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-900/60 p-3 border border-stone-800 font-mono text-[11px]">
            <div>
              <span className="text-stone-500 block text-[10px] uppercase">Emp Code</span>
              <span className="text-stone-200 font-bold">{record.employeeCode}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px] uppercase">Emp Name</span>
              <span className="text-stone-200 font-semibold">{record.employeeName}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px] uppercase">Department</span>
              <span className="text-stone-300">{record.departmentName}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px] uppercase">Designation</span>
              <span className="text-stone-300">{record.designation}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px] uppercase">Workforce Type</span>
              <span className="text-amber-400 font-semibold">
                {record.category === 'permanent_staff' ? 'Staff' : 'Contractor'}
              </span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px] uppercase">Payable Days</span>
              <span className="text-stone-200">{record.payableDays} Days</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px] uppercase">UAN Number</span>
              <span className="text-stone-300">{record.uan || 'N/A'}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px] uppercase">PF Number</span>
              <span className="text-stone-300">{record.pfNumber || 'N/A'}</span>
            </div>
          </div>

          {/* Earnings & Deductions Tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Earnings Column */}
            <div className="border border-stone-800">
              <div className="bg-stone-900 px-3 py-1.5 font-mono text-[11px] font-bold text-stone-200 uppercase tracking-wider border-b border-stone-800">
                Earnings
              </div>
              <div className="divide-y divide-stone-800/60 font-mono text-xs">
                <div className="p-2 flex justify-between">
                  <span className="text-stone-400">Basic Wage/Salary</span>
                  <span className="text-stone-200">₹{record.basic.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-stone-400">House Rent (HRA)</span>
                  <span className="text-stone-200">₹{record.hra.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-stone-400">Dearness (DA)</span>
                  <span className="text-stone-200">₹{record.da.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-stone-400">Other Allowances</span>
                  <span className="text-stone-200">₹{record.otherAllowances.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-stone-400">Overtime Pay ({record.overtimeHours}h)</span>
                  <span className="text-amber-400">₹{record.overtimePay.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 bg-stone-900/50 flex justify-between font-bold text-stone-100">
                  <span>Gross Earnings</span>
                  <span>₹{(record.grossPayable + record.overtimePay).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Deductions Column */}
            <div className="border border-stone-800">
              <div className="bg-stone-900 px-3 py-1.5 font-mono text-[11px] font-bold text-stone-200 uppercase tracking-wider border-b border-stone-800">
                Deductions
              </div>
              <div className="divide-y divide-stone-800/60 font-mono text-xs">
                <div className="p-2 flex justify-between">
                  <span className="text-stone-400">Provident Fund (PF 12%)</span>
                  <span className="text-stone-200">₹{record.pfEmployee.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-stone-400">ESI (0.75%)</span>
                  <span className="text-stone-200">₹{record.esiEmployee.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-stone-400">Professional Tax (PT)</span>
                  <span className="text-stone-200">₹{record.professionalTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-2 flex justify-between">
                  <span className="text-stone-400">Late Mark Deduction</span>
                  <span className="text-red-400 font-bold">
                    ₹{record.lateMarkDeductionAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="p-2 flex justify-between text-[10px] text-stone-500">
                  <span>Late Discipline Rule</span>
                  <span>{record.lateMarkConsequenceLabel}</span>
                </div>
                <div className="p-2 bg-stone-900/50 flex justify-between font-bold text-red-400">
                  <span>Total Deductions</span>
                  <span>₹{record.totalDeductions.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Salary Highlight Box */}
          <div className="bg-stone-900 border border-amber-500/40 p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-stone-400 uppercase">Net Disbursal Take-Home</div>
              <div className="text-xs text-stone-300">Credited to {record.bankName} - {record.accountNumber}</div>
            </div>
            <div className="font-display font-bold text-2xl text-amber-400">
              ₹ {record.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Employer Contribution Notes */}
          <div className="text-[10px] font-mono text-stone-500 flex justify-between pt-1">
            <span>Employer Contribution: PF ₹{record.pfEmployer} | ESI ₹{record.esiEmployer}</span>
            <span>Generated from Omech HRM Rule Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
