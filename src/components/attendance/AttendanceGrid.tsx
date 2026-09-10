/**
 * Attendance Muster-Roll Grid (Matrix View)
 * Displays Employees × Days of Month matrix, color-coded with status codes,
 * sticky employee column, legend, and full Excel & PDF export.
 */

import React, { useState } from 'react';
import { Employee, AttendanceRecord, Department } from '../../types';
import { exportToExcel } from '../../utils/excelExport';
import { exportReportToPDF } from '../../utils/pdfExport';
import { useToast } from '../../context/ToastContext';
import { Download, FileSpreadsheet, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface AttendanceGridProps {
  employees: Employee[];
  attendanceRecords: AttendanceRecord[];
  departments: Department[];
}

export function AttendanceGrid({ employees, attendanceRecords, departments }: AttendanceGridProps) {
  const { success } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(8); // August 2026 default
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedDeptId, setSelectedDeptId] = useState<number | 'all'>('all');

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const monthPrefix = `${selectedYear}-${selectedMonth < 10 ? `0${selectedMonth}` : selectedMonth}`;

  // Filter employees
  const filteredEmployees = employees.filter((e) =>
    selectedDeptId === 'all' ? true : e.departmentId === selectedDeptId
  );

  // Month attendance
  const monthRecords = attendanceRecords.filter((r) => r.date.startsWith(monthPrefix));

  // Export to Excel
  const handleExportExcel = () => {
    const dataRows = filteredEmployees.map((emp) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      const row: Record<string, any> = {
        'Employee Code': emp.employeeCode,
        'Employee Name': emp.name,
        'Department': dept ? dept.name : '',
        'Category': emp.category === 'permanent_staff' ? 'Staff' : 'Contractor',
      };

      let presentCount = 0;
      let lateCount = 0;
      let absentCount = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const dStr = `${monthPrefix}-${day < 10 ? `0${day}` : day}`;
        const rec = monthRecords.find((r) => r.employeeId === emp.id && r.date === dStr);

        let code = '—';
        if (rec) {
          if (rec.status === 'present') {
            code = rec.isLate ? 'LT' : 'P';
            presentCount++;
            if (rec.isLate) lateCount++;
          } else if (rec.status === 'absent') {
            code = 'A';
            absentCount++;
          } else if (rec.status === 'on_leave') {
            code = 'L';
          } else if (rec.status === 'holiday') {
            code = 'H';
          } else if (rec.status === 'weekly_off') {
            code = 'WO';
          } else if (rec.status === 'half_day') {
            code = 'HD';
          }
        }
        row[`Day ${day}`] = code;
      }

      row['Total Present'] = presentCount;
      row['Late Marks'] = lateCount;
      row['Total Absent'] = absentCount;
      return row;
    });

    exportToExcel(dataRows, `Muster_Roll_${selectedMonth}_${selectedYear}`, 'Muster Roll');
    success('Muster-Roll exported to Excel (.xlsx)');
  };

  // Export to PDF
  const handleExportPDF = () => {
    const headers = ['Code', 'Name', 'Dept', ...Array.from({ length: Math.min(daysInMonth, 15) }, (_, i) => `${i + 1}`), 'Pres', 'Late'];
    const rows = filteredEmployees.map((emp) => {
      const dept = departments.find((d) => d.id === emp.departmentId);
      const dayCodes = [];
      let pCount = 0;
      let lCount = 0;

      for (let day = 1; day <= Math.min(daysInMonth, 15); day++) {
        const dStr = `${monthPrefix}-${day < 10 ? `0${day}` : day}`;
        const rec = monthRecords.find((r) => r.employeeId === emp.id && r.date === dStr);
        let c = '-';
        if (rec) {
          if (rec.status === 'present') {
            c = rec.isLate ? 'LT' : 'P';
            pCount++;
            if (rec.isLate) lCount++;
          } else if (rec.status === 'absent') c = 'A';
          else if (rec.status === 'on_leave') c = 'L';
          else if (rec.status === 'holiday') c = 'H';
          else if (rec.status === 'weekly_off') c = 'WO';
        }
        dayCodes.push(c);
      }

      return [
        emp.employeeCode,
        emp.name,
        dept ? dept.code : '',
        ...dayCodes,
        pCount,
        lCount,
      ];
    });

    exportReportToPDF(
      `MUSTER ROLL REGISTER - ${selectedMonth}/${selectedYear}`,
      headers,
      rows,
      `Muster_Roll_${selectedMonth}_${selectedYear}`
    );
    success('Muster-Roll summary exported to PDF');
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-stone-950 border border-stone-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-stone-900 border border-stone-700">
            <button
              onClick={() => setSelectedMonth((m) => (m === 1 ? 12 : m - 1))}
              className="p-1 hover:bg-stone-800 text-stone-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-display font-bold text-stone-100 min-w-[100px] text-center">
              Month {selectedMonth}/{selectedYear}
            </span>
            <button
              onClick={() => setSelectedMonth((m) => (m === 12 ? 1 : m + 1))}
              className="p-1 hover:bg-stone-800 text-stone-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-mono">Department:</span>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200"
            >
              <option value="all">All Departments ({filteredEmployees.length})</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-emerald-400 border border-stone-700 font-semibold uppercase font-mono tracking-wider flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-400 border border-stone-700 font-semibold uppercase font-mono tracking-wider flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Muster</span>
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Matrix Table */}
      <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
              {/* Sticky Employee Column */}
              <th className="p-2.5 sticky left-0 bg-stone-900 z-10 min-w-[200px] border-r border-stone-800">
                Worker Name & Code
              </th>
              <th className="p-2.5 min-w-[80px] border-r border-stone-800 text-center">
                Dept
              </th>
              {/* 31 Days Columns */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const d = new Date(selectedYear, selectedMonth - 1, dayNum);
                const isSun = d.getDay() === 0;
                return (
                  <th
                    key={dayNum}
                    className={`p-1.5 min-w-[32px] text-center border-r border-stone-800/80 ${
                      isSun ? 'bg-stone-900/90 text-red-400' : ''
                    }`}
                  >
                    {dayNum}
                  </th>
                );
              })}
              <th className="p-2 text-center text-emerald-400 min-w-[40px] border-l border-stone-800">P</th>
              <th className="p-2 text-center text-amber-400 min-w-[40px] border-r border-stone-800">LT</th>
              <th className="p-2 text-center text-red-400 min-w-[40px]">A</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60 font-mono text-xs">
            {filteredEmployees.map((emp) => {
              const dept = departments.find((d) => d.id === emp.departmentId);
              let pCount = 0;
              let ltCount = 0;
              let aCount = 0;

              return (
                <tr key={emp.id} className="hover:bg-stone-900/40">
                  {/* Sticky Employee Name */}
                  <td className="p-2.5 sticky left-0 bg-stone-950 z-10 border-r border-stone-800">
                    <div className="font-sans font-semibold text-stone-200 truncate max-w-[190px]">
                      {emp.name}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {emp.employeeCode} • {emp.category === 'permanent_staff' ? 'Staff' : 'Contract'}
                    </div>
                  </td>

                  <td className="p-2 text-center border-r border-stone-800 text-stone-400 text-[11px]">
                    {dept?.code || 'SHOP'}
                  </td>

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dStr = `${monthPrefix}-${dayNum < 10 ? `0${dayNum}` : dayNum}`;
                    const rec = monthRecords.find((r) => r.employeeId === emp.id && r.date === dStr);
                    const d = new Date(selectedYear, selectedMonth - 1, dayNum);
                    const isSun = d.getDay() === 0;

                    let label = '—';
                    let cellClass = 'text-stone-600';

                    if (rec) {
                      if (rec.status === 'present') {
                        if (rec.isLate) {
                          label = 'LT';
                          cellClass = 'bg-amber-500/20 text-amber-300 font-bold';
                          ltCount++;
                          pCount++;
                        } else {
                          label = 'P';
                          cellClass = 'bg-emerald-500/20 text-emerald-400 font-semibold';
                          pCount++;
                        }
                      } else if (rec.status === 'absent') {
                        label = 'A';
                        cellClass = 'bg-red-500/20 text-red-400 font-bold';
                        aCount++;
                      } else if (rec.status === 'on_leave') {
                        label = 'L';
                        cellClass = 'bg-blue-500/20 text-blue-300';
                      } else if (rec.status === 'holiday') {
                        label = 'H';
                        cellClass = 'bg-purple-500/20 text-purple-300';
                      } else if (rec.status === 'weekly_off') {
                        label = 'WO';
                        cellClass = 'bg-stone-900 text-stone-400';
                      } else if (rec.status === 'half_day') {
                        label = 'HD';
                        cellClass = 'bg-amber-500/10 text-amber-400';
                      }
                    } else if (isSun) {
                      label = 'WO';
                      cellClass = 'text-stone-600 bg-stone-900/30';
                    }

                    return (
                      <td
                        key={dayNum}
                        className={`p-1 text-center text-[11px] border-r border-stone-800/80 ${cellClass}`}
                        title={`${emp.name} - ${dStr}: ${rec?.status || (isSun ? 'Weekly Off' : 'No data')}`}
                      >
                        {label}
                      </td>
                    );
                  })}

                  {/* Summary Totals */}
                  <td className="p-2 text-center text-emerald-400 font-bold border-l border-stone-800">
                    {pCount}
                  </td>
                  <td className="p-2 text-center text-amber-400 font-bold border-r border-stone-800">
                    {ltCount}
                  </td>
                  <td className="p-2 text-center text-red-400 font-bold">
                    {aCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Status Codes Legend */}
      <div className="bg-stone-950 border border-stone-800 p-3 flex flex-wrap items-center gap-4 text-xs text-stone-400">
        <span className="font-mono text-[10px] uppercase text-stone-500">Muster Legend:</span>
        <span className="flex items-center gap-1.5 font-mono">
          <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 font-bold">P</span>
          <span>Present</span>
        </span>
        <span className="flex items-center gap-1.5 font-mono">
          <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-bold">LT</span>
          <span>Late Check-in</span>
        </span>
        <span className="flex items-center gap-1.5 font-mono">
          <span className="px-1.5 py-0.2 bg-red-500/20 text-red-400 font-bold">A</span>
          <span>Absent</span>
        </span>
        <span className="flex items-center gap-1.5 font-mono">
          <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300">L</span>
          <span>Approved Leave</span>
        </span>
        <span className="flex items-center gap-1.5 font-mono">
          <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-300">H</span>
          <span>Plant Holiday</span>
        </span>
        <span className="flex items-center gap-1.5 font-mono">
          <span className="px-1.5 py-0.2 bg-stone-900 text-stone-400">WO</span>
          <span>Weekly Off</span>
        </span>
      </div>
    </div>
  );
}
