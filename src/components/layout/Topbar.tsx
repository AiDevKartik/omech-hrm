/**
 * Topbar Component
 * Industrial navigation bar with live clock, persona fast-switch, and shop-floor punch
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { LiveClock } from './LiveClock';
import { STRINGS } from '../../constants/strings';
import { useCheckIn, useCheckOut, useDailyAttendance } from '../../hooks/useHRM';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { LogIn, LogOut, Shield, User, Users, Bell, AlertTriangle, Sun, Moon } from 'lucide-react';

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const { session, employee, role, logout, switchUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { success, warning, error } = useToast();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const todayStr = '2026-09-05';
  const { data: todayRecords } = useDailyAttendance(todayStr);
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const currentRecord = todayRecords?.find((r) => r.employeeId === employee?.id);
  const isPunchedIn = Boolean(currentRecord?.checkIn && !currentRecord?.checkOut);

  const handleLivePunch = async () => {
    if (!employee) return;
    try {
      if (!currentRecord?.checkIn) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        await checkInMutation.mutateAsync({ employeeId: employee.id, time: timeStr, date: todayStr });
        success(`Punch-in recorded at ${timeStr} for ${employee.name}`);
      } else if (!currentRecord.checkOut) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        await checkOutMutation.mutateAsync({ employeeId: employee.id, time: timeStr, date: todayStr });
        success(`Punch-out recorded at ${timeStr}. Work shift completed.`);
      } else {
        warning(`Both punch-in (${currentRecord.checkIn}) and punch-out (${currentRecord.checkOut}) already recorded for today.`);
      }
    } catch (err: any) {
      error(err.message || 'Failed to record punch');
    }
  };

  return (
    <header className="h-14 bg-stone-900 border-b border-stone-800 flex items-center justify-between px-4 sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & Plant Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 text-stone-400 hover:text-stone-200 border border-stone-800"
          aria-label="Toggle Navigation"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-amber-500 ring-2 ring-amber-500/20" />
          <div>
            <div className="font-display font-bold tracking-wider text-sm text-stone-100 flex items-center gap-2">
              <span>{STRINGS.APP_NAME}</span>
              <span className="text-[10px] font-sans font-semibold px-1.5 py-0.2 bg-amber-500/10 text-amber-400 border border-amber-500/30">
                PROTOTYPE
              </span>
            </div>
            <div className="text-[10px] text-stone-400 font-mono hidden sm:block">
              {STRINGS.FACTORY_LOCATION}
            </div>
          </div>
        </div>
      </div>

      {/* Middle: Live Shop-Floor Clock */}
      <div className="hidden lg:block">
        <LiveClock />
      </div>

      {/* Right: Quick Punch, Persona Switcher & Profile */}
      <div className="flex items-center gap-2.5">
        {/* Quick Punch Button */}
        {employee && (
          <button
            onClick={handleLivePunch}
            disabled={checkInMutation.isPending || checkOutMutation.isPending}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-1.5 border ${
              isPunchedIn
                ? 'bg-amber-500 text-stone-950 hover:bg-amber-400 border-amber-400'
                : 'bg-stone-800 text-stone-200 hover:bg-stone-700 border-stone-700'
            }`}
            title="Register biometric or live attendance punch"
          >
            {isPunchedIn ? (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Punch Out ({currentRecord?.checkIn})</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentRecord?.checkOut ? 'Shift Done' : 'Punch In'}</span>
              </>
            )}
          </button>
        )}

        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 text-xs text-stone-300 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono text-[11px] hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-mono text-[11px] hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        {/* Fast Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-800 text-xs text-stone-300"
            title="Switch demo persona for testing permissions"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500" />
            <span className="capitalize font-medium hidden sm:inline">{role || 'Role'}</span>
            <span className="text-[10px] text-stone-500 font-mono">({employee?.employeeCode})</span>
          </button>

          {showRoleMenu && (
            <div
              className="absolute right-0 mt-1 w-64 bg-stone-900 border border-stone-700 shadow-2xl p-2 z-50 text-xs"
              onMouseLeave={() => setShowRoleMenu(false)}
            >
              <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider pb-1.5 mb-1.5 border-b border-stone-800 flex items-center justify-between">
                <span>Switch Role Persona</span>
                <span className="text-[10px] text-amber-400 font-mono">Click to test</span>
              </div>

              <div className="space-y-1">
                <button
                  onClick={() => {
                    switchUser(1, 'admin');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left p-2 flex items-start gap-2 hover:bg-stone-800 transition ${
                    role === 'admin' ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                  }`}
                >
                  <Shield className="w-4 h-4 text-amber-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-stone-200">Rajesh Sharma (Admin)</div>
                    <div className="text-[10px] text-stone-400">Plant GM • Full access to Masters & Payroll</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    switchUser(2, 'supervisor');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left p-2 flex items-start gap-2 hover:bg-stone-800 transition ${
                    role === 'supervisor' && employee?.id === 2
                      ? 'bg-amber-500/10 border-l-2 border-amber-500'
                      : ''
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-stone-200">Anil Kulkarni (Supervisor)</div>
                    <div className="text-[10px] text-stone-400">Scoped to Mills #1 & #2 • Approvals</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    switchUser(7, 'worker');
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left p-2 flex items-start gap-2 hover:bg-stone-800 transition ${
                    role === 'worker' && employee?.id === 7
                      ? 'bg-amber-500/10 border-l-2 border-amber-500'
                      : ''
                  }`}
                >
                  <User className="w-4 h-4 text-emerald-400 mt-0.5" />
                  <div>
                    <div className="font-semibold text-stone-200">Ramesh Yadav (Worker)</div>
                    <div className="text-[10px] text-stone-400">Contractual Welder • Self-service only</div>
                  </div>
                </button>
              </div>

              <div className="mt-2 pt-2 border-t border-stone-800 flex justify-between">
                <button
                  onClick={() => {
                    logout();
                    setShowRoleMenu(false);
                  }}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px]"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Logout Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
