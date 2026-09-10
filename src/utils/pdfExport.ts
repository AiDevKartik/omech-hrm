/**
 * PDF Export Utilities using jsPDF & autoTable
 * Generates formal industrial payslips and compliance muster rolls
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PayrollEmployeeRecord, PayrollRun } from '../types';
import { STRINGS } from '../constants/strings';

/**
 * Generate formal Indian statutory payslip PDF
 */
export function generatePayslipPDF(record: PayrollEmployeeRecord, run: PayrollRun) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[run.month - 1];

  // Header Box
  doc.setFillColor(38, 38, 38);
  doc.rect(14, 12, 182, 28, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text(STRINGS.COMPANY_NAME, 20, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(214, 211, 209);
  doc.text(STRINGS.COMPANY_ADDRESS, 20, 28);
  doc.text(`CIN: ${STRINGS.CIN} | ${STRINGS.FACTORY_LOCATION}`, 20, 34);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(28, 25, 23);
  doc.text(`PAYSLIP FOR THE MONTH OF ${monthName.toUpperCase()} ${run.year}`, 14, 48);

  // Employee Metadata Grid
  const metaData = [
    [
      { content: 'Employee Code:', styles: { fontStyle: 'bold' } },
      record.employeeCode,
      { content: 'Employee Name:', styles: { fontStyle: 'bold' } },
      record.employeeName,
    ],
    [
      { content: 'Department:', styles: { fontStyle: 'bold' } },
      record.departmentName,
      { content: 'Designation:', styles: { fontStyle: 'bold' } },
      record.designation,
    ],
    [
      { content: 'Workforce Category:', styles: { fontStyle: 'bold' } },
      record.category === 'permanent_staff' ? 'Permanent Staff' : 'Contractual Floor Worker',
      { content: 'UAN / PF Number:', styles: { fontStyle: 'bold' } },
      `${record.uan || 'N/A'} / ${record.pfNumber || 'N/A'}`,
    ],
    [
      { content: 'Bank Name & A/C:', styles: { fontStyle: 'bold' } },
      `${record.bankName} - ${record.accountNumber}`,
      { content: 'ESI IP Number:', styles: { fontStyle: 'bold' } },
      record.esiNumber || 'N/A',
    ],
    [
      { content: 'Days Payable:', styles: { fontStyle: 'bold' } },
      `${record.payableDays} Days (Present: ${record.presentDays}, L: ${record.paidLeaveDays}, WO: ${record.weeklyOffDays}, H: ${record.paidHolidayDays})`,
      { content: 'Overtime Worked:', styles: { fontStyle: 'bold' } },
      `${record.overtimeHours} Hrs (OT Pay: ₹${record.overtimePay.toLocaleString('en-IN')})`,
    ],
  ];

  autoTable(doc, {
    startY: 52,
    body: metaData as any,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 1.5, textColor: [38, 38, 38] },
  });

  const currentY = (doc as any).lastAutoTable.finalY + 4;

  // Earnings vs Deductions Table
  const tableData = [
    [
      'Basic Salary',
      `₹ ${record.basic.toLocaleString('en-IN')}`,
      'Provident Fund (PF 12%)',
      `₹ ${record.pfEmployee.toLocaleString('en-IN')}`,
    ],
    [
      'House Rent Allowance (HRA)',
      `₹ ${record.hra.toLocaleString('en-IN')}`,
      'Employee State Insurance (ESI)',
      `₹ ${record.esiEmployee.toLocaleString('en-IN')}`,
    ],
    [
      'Dearness Allowance (DA)',
      `₹ ${record.da.toLocaleString('en-IN')}`,
      'Professional Tax (PT)',
      `₹ ${record.professionalTax.toLocaleString('en-IN')}`,
    ],
    [
      'Other Special Allowances',
      `₹ ${record.otherAllowances.toLocaleString('en-IN')}`,
      'Late-Mark Policy Deduction',
      `₹ ${record.lateMarkDeductionAmount.toLocaleString('en-IN')} (${record.lateMarkCount} late marks)`,
    ],
    [
      'Overtime Allowance',
      `₹ ${record.overtimePay.toLocaleString('en-IN')}`,
      '-',
      '-',
    ],
    [
      { content: 'Total Gross Earnings', styles: { fontStyle: 'bold', fillColor: [245, 245, 244] } },
      { content: `₹ ${(record.grossPayable + record.overtimePay).toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', fillColor: [245, 245, 244] } },
      { content: 'Total Deductions', styles: { fontStyle: 'bold', fillColor: [245, 245, 244] } },
      { content: `₹ ${record.totalDeductions.toLocaleString('en-IN')}`, styles: { fontStyle: 'bold', fillColor: [245, 245, 244] } },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['EARNINGS', 'AMOUNT (INR)', 'DEDUCTIONS', 'AMOUNT (INR)']],
    body: tableData as any,
    theme: 'grid',
    headStyles: { fillColor: [41, 37, 36], textColor: [255, 255, 255], fontSize: 8.5 },
    styles: { fontSize: 8.5, cellPadding: 2.2 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 6;

  // Net Salary Highlight Box
  doc.setFillColor(245, 245, 244);
  doc.rect(14, finalY, 182, 16, 'F');
  doc.setDrawColor(214, 211, 209);
  doc.rect(14, finalY, 182, 16, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(180, 83, 9); // Amber accent
  doc.text('NET TAKE-HOME SALARY:', 20, finalY + 10);
  doc.setFontSize(13);
  doc.setTextColor(28, 25, 23);
  doc.text(`INR ${record.netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 100, finalY + 10);

  // Signatures
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(87, 83, 78);
  doc.text('Employer Contribution: PF ₹' + record.pfEmployer + ' | ESI ₹' + record.esiEmployer, 14, finalY + 24);

  doc.text('_____________________________', 20, finalY + 45);
  doc.text('Employee Signature', 20, finalY + 50);

  doc.text('_____________________________', 130, finalY + 45);
  doc.text('Authorized Signatory (Plant HR)', 130, finalY + 50);

  doc.save(`Payslip_${record.employeeCode}_${monthName}_${run.year}.pdf`);
}

/**
 * Export generic table report to PDF
 */
export function exportReportToPDF(title: string, columns: string[], rows: (string | number)[][], fileName: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(STRINGS.COMPANY_NAME, 14, 15);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${title} | Generated: ${new Date().toLocaleString('en-IN')}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [columns],
    body: rows as any,
    theme: 'grid',
    headStyles: { fillColor: [41, 37, 36], textColor: [255, 255, 255], fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 1.5 },
  });

  doc.save(`${fileName}.pdf`);
}
