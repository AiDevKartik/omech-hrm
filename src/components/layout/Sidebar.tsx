/**
 * Sidebar Component
 * Industrial navigation menu with role-based link guards and pending notification counters
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { STRINGS } from '../../constants/strings';
import { usePendingLeaves, useRegularizationRequests } from '../../hooks/useHRM';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard,
  CalendarCheck,
  FileSpreadsheet,
  Users,
  CalendarDays,
  Coins,
  BarChart3,
  FileText,
  Sliders,
  HardHat,
  Factory,
  Sun,
  Moon,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { role, employee, session } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const { data: pendingLeaves } = usePendingLeaves(session?.supervisorDepartments);
  const { data: pendingRegs } = useRegularizationRequests('pending', session?.supervisorDepartments);

  const pendingLeavesCount = pendingLeaves?.length || 0;
  const pendingRegsCount = pendingRegs?.length || 0;

  const navItems = [
    {
      to: '/',
      label: STRINGS.NAV_DASHBOARD,
      icon: LayoutDashboard,
      roles: ['admin', 'supervisor', 'worker'],
    },
    {
      to: '/attendance',
      label: STRINGS.NAV_ATTENDANCE,
      icon: CalendarCheck,
      roles: ['admin', 'supervisor', 'worker'],
      badge: pendingRegsCount > 0 && role !== 'worker' ? `${pendingRegsCount} req` : undefined,
    },
    {
      to: '/leave',
      label: STRINGS.NAV_LEAVE,
      icon: FileSpreadsheet,
      roles: ['admin', 'supervisor', 'worker'],
      badge: pendingLeavesCount > 0 && role !== 'worker' ? `${pendingLeavesCount} pend` : undefined,
    },
    {
      to: '/workers',
      label: STRINGS.NAV_WORKERS,
      icon: Users,
      roles: ['admin', 'supervisor'],
    },
    {
      to: '/roster',
      label: STRINGS.NAV_ROSTER,
      icon: CalendarDays,
      roles: ['admin', 'supervisor'],
    },
    {
      to: '/payroll',
      label: STRINGS.NAV_PAYROLL,
      icon: Coins,
      roles: ['admin', 'worker'], // workers can view payslip history
    },
    {
      to: '/analytics',
      label: STRINGS.NAV_ANALYTICS,
      icon: BarChart3,
      roles: ['admin', 'supervisor'],
    },
    {
      to: '/reports',
      label: STRINGS.NAV_REPORTS,
      icon: FileText,
      roles: ['admin', 'supervisor'],
    },
    {
      to: '/settings',
      label: STRINGS.NAV_SETTINGS,
      icon: Sliders,
      roles: ['admin'],
    },
  ];

  const filteredNavItems = navItems.filter((item) =>
    role ? item.roles.includes(role) : false
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 h-screen w-60 bg-stone-950 border-r border-stone-800 flex flex-col justify-between z-40 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div>
          {/* Plant Identification Banner */}
          <div className="p-4 border-b border-stone-800/80 bg-stone-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-stone-800 text-amber-500 border border-stone-700">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-bold text-sm tracking-wider text-stone-200">
                  {STRINGS.COMPANY_NAME}
                </div>
                <div className="text-[10px] text-stone-500 font-mono tracking-tight uppercase">
                  Manufacturing ERP Layer
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-2 space-y-0.5" onClick={() => onClose()}>
            <div className="px-3 py-1.5 text-[10px] font-mono text-stone-500 uppercase tracking-wider font-semibold">
              Operational Modules
            </div>

            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors border-l-2 ${
                      isActive
                        ? 'bg-stone-900 text-amber-400 border-amber-500 font-semibold'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/50 border-transparent'
                    }`
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card at bottom */}
        <div className="p-3 border-t border-stone-800 bg-stone-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-none bg-stone-800 border border-stone-700 flex items-center justify-center font-mono font-bold text-amber-400 text-xs shrink-0">
              {employee?.name ? employee.name[0] : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-stone-200 truncate">
                {employee?.name || 'Authorized User'}
              </div>
              <div className="text-[10px] text-stone-500 font-mono truncate">
                {employee?.designation || role}
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 transition-colors shrink-0"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-blue-500" />
              )}
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-stone-800/60 flex items-center justify-between text-[10px] font-mono text-stone-400">
            <span className="flex items-center gap-1">
              <HardHat className="w-3 h-3 text-amber-500" />
              <span className="capitalize">{employee?.category?.replace('_', ' ') || role}</span>
            </span>
            <span className="text-stone-500">{employee?.employeeCode}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
