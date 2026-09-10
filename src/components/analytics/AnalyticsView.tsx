/**
 * Analytics & Insights Dashboard
 * Executive industrial intelligence: Headcount trends, department absenteeism hotspots,
 * overtime expenditure, and employer statutory liability distributions.
 */

import React from 'react';
import {
  useEmployees,
  useDepartments,
  useShifts,
  usePayrollRuns,
  useMonthlyRegister,
} from '../../hooks/useHRM';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Users,
  HardHat,
  Clock,
  AlertTriangle,
  Building,
  Coins,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export function AnalyticsView() {
  const { isDark } = useTheme();
  const { data: employees = [] } = useEmployees();
  const { data: departments = [] } = useDepartments();
  const { data: shifts = [] } = useShifts();
  const { data: payrollRuns = [] } = usePayrollRuns();
  const { data: attendance = [] } = useMonthlyRegister(8, 2026);

  const chartTheme = {
    grid: isDark ? '#292524' : '#e7e5e4',
    axis: isDark ? '#78716c' : '#78716c',
    tooltip: {
      backgroundColor: isDark ? '#1c1917' : '#ffffff',
      borderColor: isDark ? '#44403c' : '#d6d3d1',
      color: isDark ? '#f5f5f4' : '#1c1917',
      fontSize: '11px',
      borderRadius: '2px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    },
  };

  // 1. Department Breakdown (Staff vs Contractual)
  const deptData = departments.map((dept) => {
    const deptEmps = employees.filter((e) => e.departmentId === dept.id);
    const staffCount = deptEmps.filter((e) => e.category === 'permanent_staff').length;
    const contractCount = deptEmps.filter(
      (e) => e.category === 'contractual' || (e.category as string) === 'contractual_worker'
    ).length;
    return {
      name: dept.code,
      fullName: dept.name,
      Staff: staffCount,
      Contractors: contractCount,
      Total: deptEmps.length,
    };
  });

  // 2. Absenteeism Hotspots & Overtime by Department
  const deptAbsenteeism = departments.map((dept) => {
    const deptEmps = employees.filter((e) => e.departmentId === dept.id);
    const empIds = deptEmps.map((e) => e.id);
    const records = attendance.filter((a) => empIds.includes(a.employeeId));

    const absentCount = records.filter((r) => r.status === 'absent').length;
    const totalRecords = records.length || 1;
    const absentRate = Number(((absentCount / totalRecords) * 100).toFixed(1));
    const totalOT = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

    return {
      department: dept.code,
      absentRate,
      overtimeHours: totalOT,
    };
  });

  // 3. Monthly Payroll Liability Trends
  const payrollTrend = [
    { month: 'Jun', basicGross: 340000, overtime: 28000, statutoryLiability: 48000 },
    { month: 'Jul', basicGross: 355000, overtime: 32000, statutoryLiability: 51000 },
    { month: 'Aug', basicGross: 368000, overtime: 36000, statutoryLiability: 53500 },
    { month: 'Sep (Proj)', basicGross: 372000, overtime: 38000, statutoryLiability: 54000 },
  ];

  // 4. Workforce Category Distribution
  const staffTotal = employees.filter((e) => e.category === 'permanent_staff').length;
  const contractorTotal = employees.filter(
    (e) => e.category === 'contractual' || (e.category as string) === 'contractual_worker'
  ).length;
  const workforcePie = [
    { name: 'Permanent Staff', value: staffTotal, color: '#f59e0b' },
    { name: 'Contractual Floor Workers', value: contractorTotal, color: '#3b82f6' },
  ];

  const totalHeadcount = employees.length;
  const activeHeadcount = employees.filter((e) => e.isActive).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950 border border-stone-800 p-4">
        <div>
          <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
            Industrial Business Intelligence
          </div>
          <h1 className="font-display font-bold text-xl text-stone-100 tracking-tight">
            Workforce Metrics & Cost Analytics
          </h1>
        </div>
      </div>

      {/* Top Level Metric Badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-stone-900 border border-stone-800 p-4">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Total Enrolled Workforce</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-display font-bold text-2xl text-stone-100">{totalHeadcount}</div>
          <div className="text-[10px] text-stone-500 mt-1 font-mono">
            {activeHeadcount} Active on Mill Roster
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Permanent Staff</span>
            <Building className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-display font-bold text-2xl text-amber-400">{staffTotal}</div>
          <div className="text-[10px] text-stone-500 mt-1 font-mono">
            {((staffTotal / (totalHeadcount || 1)) * 100).toFixed(0)}% of total workforce
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Contractual Workers</span>
            <HardHat className="w-4 h-4 text-blue-400" />
          </div>
          <div className="font-display font-bold text-2xl text-blue-400">{contractorTotal}</div>
          <div className="text-[10px] text-stone-500 mt-1 font-mono">
            Daily-wage mill labor
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 p-4">
          <div className="flex items-center justify-between text-stone-400 mb-1">
            <span className="text-[10px] font-mono uppercase">Total Overtime Logged</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-display font-bold text-2xl text-emerald-400">
            {attendance.reduce((sum, r) => sum + (r.overtimeHours || 0), 0)} hrs
          </div>
          <div className="text-[10px] text-stone-500 mt-1 font-mono">
            August Shop-floor cycles
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Department Workforce Distribution */}
        <div className="bg-stone-950 border border-stone-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-stone-200 text-sm uppercase tracking-wide">
              Workforce Allocation by Department
            </h3>
            <span className="text-[10px] font-mono text-stone-500">Staff vs Contractor</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="name" stroke={chartTheme.axis} fontSize={11} />
                <YAxis stroke={chartTheme.axis} fontSize={11} />
                <Tooltip
                  contentStyle={chartTheme.tooltip}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Staff" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Contractors" stackId="a" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Absenteeism Hotspot Analysis */}
        <div className="bg-stone-950 border border-stone-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-stone-200 text-sm uppercase tracking-wide">
              Department Absenteeism Hotspots (%)
            </h3>
            <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Plant Absence Rate</span>
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptAbsenteeism} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="department" stroke={chartTheme.axis} fontSize={11} />
                <YAxis stroke={chartTheme.axis} fontSize={11} unit="%" />
                <Tooltip
                  contentStyle={chartTheme.tooltip}
                />
                <Bar dataKey="absentRate" fill="#ef4444" name="Absent Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Monthly Payroll Cost Breakdown */}
        <div className="bg-stone-950 border border-stone-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-stone-200 text-sm uppercase tracking-wide">
              Monthly Cost Trends & Statutory Liability
            </h3>
            <span className="text-[10px] font-mono text-stone-500">Gross + OT + PF/ESI</span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={payrollTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="month" stroke={chartTheme.axis} fontSize={11} />
                <YAxis stroke={chartTheme.axis} fontSize={11} />
                <Tooltip
                  formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`}
                  contentStyle={chartTheme.tooltip}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="basicGross" stroke="#f59e0b" strokeWidth={2} name="Gross Wages" />
                <Line type="monotone" dataKey="overtime" stroke="#10b981" strokeWidth={2} name="Overtime Pay" />
                <Line type="monotone" dataKey="statutoryLiability" stroke="#8b5cf6" strokeWidth={2} name="Employer PF/ESI" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Workforce Classification */}
        <div className="bg-stone-950 border border-stone-800 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-stone-200 text-sm uppercase tracking-wide">
              Permanent vs Contractual Ratio
            </h3>
            <span className="text-[10px] font-mono text-stone-500">Total Factory Strength</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={workforcePie}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {workforcePie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTheme.tooltip}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
