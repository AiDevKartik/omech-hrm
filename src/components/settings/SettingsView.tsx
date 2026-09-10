/**
 * Configuration & Policy Masters View
 * Full CRUD over:
 * - Indian Statutory Payroll parameters (PF, ESI, PT slabs, OT rate)
 * - Late-Mark Policy & Grace Ladder
 * - Plant Shifts
 * - Declared Holidays
 * - Leave Entitlements
 * - Chronological Audit Logs
 */

import React, { useState } from 'react';
import {
  usePayrollConfig,
  useLateMarkPolicy,
  useHolidays,
  useShifts,
  useLeaveTypes,
  useAuditLogs,
  useUpdatePayrollConfig,
  useUpdateLateMarkPolicy,
  useCreateHoliday,
  useDeleteHoliday,
  useUpdateShift,
} from '../../hooks/useHRM';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Sliders,
  Clock,
  Calendar,
  Layers,
  FileCheck,
  History,
  Save,
  PlusCircle,
  Trash2,
  ShieldCheck,
  Info,
  Sun,
  Moon,
  Monitor,
  Palette,
} from 'lucide-react';

export function SettingsView() {
  const { role, session, employee } = useAuth();
  const { success, error } = useToast();
  const { theme, setTheme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<
    'payroll' | 'latemark' | 'shifts' | 'holidays' | 'leaves' | 'audit' | 'appearance'
  >('payroll');

  // Queries
  const { data: payrollConfig } = usePayrollConfig();
  const { data: lateMarkPolicy } = useLateMarkPolicy();
  const { data: holidays = [] } = useHolidays(2026);
  const { data: shifts = [] } = useShifts();
  const { data: leaveTypes = [] } = useLeaveTypes();
  const { data: auditLogs = [] } = useAuditLogs();

  // Mutations
  const updatePayrollMutation = useUpdatePayrollConfig();
  const updateLateMarkMutation = useUpdateLateMarkPolicy();
  const createHolidayMutation = useCreateHoliday();
  const deleteHolidayMutation = useDeleteHoliday();

  // Local form states
  const [payrollForm, setPayrollForm] = useState(payrollConfig);
  const [lateMarkForm, setLateMarkForm] = useState(lateMarkPolicy);

  // Sync state if queries update
  React.useEffect(() => {
    if (payrollConfig) setPayrollForm(payrollConfig);
  }, [payrollConfig]);

  React.useEffect(() => {
    if (lateMarkPolicy) setLateMarkForm(lateMarkPolicy);
  }, [lateMarkPolicy]);

  // Holiday Modal State
  const [newHolName, setNewHolName] = useState('');
  const [newHolDate, setNewHolDate] = useState('2026-10-02');
  const [newHolType, setNewHolType] = useState<'gazetted' | 'restricted'>('gazetted');

  const handleSavePayrollConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payrollForm) return;
    try {
      await updatePayrollMutation.mutateAsync({
        config: payrollForm,
        changedBy: session?.name || employee?.name || 'admin',
      });
      success('Statutory payroll parameters saved and audit-logged.');
    } catch (err: any) {
      error(err.message || 'Save failed');
    }
  };

  const handleSaveLateMarkPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lateMarkForm) return;
    try {
      await updateLateMarkMutation.mutateAsync({
        config: lateMarkForm,
        changedBy: session?.name || employee?.name || 'admin',
      });
      success('Late mark grace window & penalty ladder saved.');
    } catch (err: any) {
      error(err.message || 'Save failed');
    }
  };

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHolName.trim()) return;
    try {
      await createHolidayMutation.mutateAsync({
        data: {
          name: newHolName.trim(),
          date: newHolDate,
          isPaid: true,
          year: 2026,
          isGazetted: newHolType === 'gazetted',
        },
        changedBy: session?.name || employee?.name || 'admin',
      });
      success(`Holiday "${newHolName}" added.`);
      setNewHolName('');
    } catch (err: any) {
      error(err.message || 'Failed to add holiday');
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    try {
      await deleteHolidayMutation.mutateAsync({
        id,
        changedBy: session?.name || employee?.name || 'admin',
      });
      success('Holiday removed from calendar.');
    } catch (err: any) {
      error(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950 border border-stone-800 p-4">
        <div>
          <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
            Enterprise Governance
          </div>
          <h1 className="font-display font-bold text-xl text-stone-100 tracking-tight">
            Factory Policies & Statutory Configuration
          </h1>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center border-b border-stone-800 gap-1 text-xs">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'payroll'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Statutory Payroll</span>
        </button>

        <button
          onClick={() => setActiveTab('latemark')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'latemark'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Late-Mark & Grace Policy</span>
        </button>

        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'shifts'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Plant Shifts</span>
        </button>

        <button
          onClick={() => setActiveTab('holidays')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'holidays'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Declared Holidays</span>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'leaves'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Leave Entitlements</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'audit'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Audit Log History</span>
        </button>

        <button
          onClick={() => setActiveTab('appearance')}
          className={`px-4 py-2.5 font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition ${
            activeTab === 'appearance'
              ? 'border-amber-500 text-amber-400 bg-stone-950/60'
              : 'border-transparent text-stone-400 hover:text-stone-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Appearance & Theme</span>
        </button>
      </div>

      {/* TAB 1: PAYROLL CONFIG */}
      {activeTab === 'payroll' && payrollForm && (
        <form onSubmit={handleSavePayrollConfig} className="bg-stone-950 border border-stone-800 p-5 space-y-5 text-xs shadow-xl">
          <div>
            <h3 className="font-display font-bold text-stone-200 text-base uppercase">
              Statutory Contributions & Rates (Indian Labour Standards)
            </h3>
            <p className="text-stone-400 text-xs">
              Directly influences the real-time calculation engine during monthly payroll runs.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-stone-900 border border-stone-800 p-3">
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                PF Employee Share (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={payrollForm.pfEmployeeRatePercent}
                onChange={(e) =>
                  setPayrollForm({ ...payrollForm, pfEmployeeRatePercent: Number(e.target.value) })
                }
                className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono font-bold"
              />
            </div>

            <div className="bg-stone-900 border border-stone-800 p-3">
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                PF Wage Ceiling (INR)
              </label>
              <input
                type="number"
                value={payrollForm.pfWageCeiling}
                onChange={(e) =>
                  setPayrollForm({ ...payrollForm, pfWageCeiling: Number(e.target.value) })
                }
                className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono font-bold"
              />
            </div>

            <div className="bg-stone-900 border border-stone-800 p-3">
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                ESI Employee Share (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={payrollForm.esiEmployeeRatePercent}
                onChange={(e) =>
                  setPayrollForm({ ...payrollForm, esiEmployeeRatePercent: Number(e.target.value) })
                }
                className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono font-bold"
              />
            </div>

            <div className="bg-stone-900 border border-stone-800 p-3">
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                ESI Wage Ceiling (INR)
              </label>
              <input
                type="number"
                value={payrollForm.esiWageCeiling}
                onChange={(e) =>
                  setPayrollForm({ ...payrollForm, esiWageCeiling: Number(e.target.value) })
                }
                className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-stone-900 border border-stone-800 p-3">
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                Overtime Multiplier (Rate)
              </label>
              <input
                type="number"
                step="0.1"
                value={payrollForm.overtimeRateMultiplier}
                onChange={(e) =>
                  setPayrollForm({ ...payrollForm, overtimeRateMultiplier: Number(e.target.value) })
                }
                className="w-full bg-stone-950 border border-stone-700 p-2 text-amber-400 font-mono font-bold"
              />
              <span className="text-[10px] text-stone-500 mt-1 block">Factories Act 2x default</span>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-3">
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                Standard Daily Shift Hours
              </label>
              <input
                type="number"
                value={payrollForm.standardDailyHours}
                onChange={(e) =>
                  setPayrollForm({ ...payrollForm, standardDailyHours: Number(e.target.value) })
                }
                className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono font-bold"
              />
            </div>

            <div className="bg-stone-900 border border-stone-800 p-3">
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                Days in Month Formula
              </label>
              <select
                value={payrollForm.daysInMonthFormula}
                onChange={(e) =>
                  setPayrollForm({ ...payrollForm, daysInMonthFormula: e.target.value as any })
                }
                className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 text-xs"
              >
                <option value="calendar_days">Calendar Days (28, 30, 31)</option>
                <option value="fixed_26">Fixed 26 Working Days (Factories Act)</option>
                <option value="fixed_30">Fixed 30 Days Standard</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-stone-800">
            <button
              type="submit"
              disabled={updatePayrollMutation.isPending}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Audit-Log Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: LATE MARK POLICY */}
      {activeTab === 'latemark' && lateMarkForm && (
        <form onSubmit={handleSaveLateMarkPolicy} className="bg-stone-950 border border-stone-800 p-5 space-y-5 text-xs shadow-xl">
          <div>
            <h3 className="font-display font-bold text-stone-200 text-base uppercase">
              Late Mark & Grace Window Configuration
            </h3>
            <p className="text-stone-400 text-xs">
              Automated disciplinary ladder applied during daily punch evaluations.
            </p>
          </div>

          <div className="bg-stone-900 border border-stone-800 p-4 max-w-md">
            <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
              Grace Window (Minutes after shift start)
            </label>
            <input
              type="number"
              value={lateMarkForm.graceMinutes}
              onChange={(e) =>
                setLateMarkForm({ ...lateMarkForm, graceMinutes: Number(e.target.value) })
              }
              className="w-full bg-stone-950 border border-stone-700 p-2 text-amber-400 font-mono font-bold text-sm"
            />
            <span className="text-[10px] text-stone-500 mt-1 block">
              Punches within this buffer are marked on-time without disciplinary penalty.
            </span>
          </div>

          <div>
            <div className="text-[11px] font-mono text-stone-300 uppercase font-semibold mb-2">
              Monthly Cumulative Late Marks Consequence Ladder:
            </div>
            <div className="space-y-2 border border-stone-800 divide-y divide-stone-800 bg-stone-900/40">
              {(lateMarkForm.ladder || []).map((rule, idx) => (
                <div key={rule.id || idx} className="p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 font-mono text-[10px] uppercase">Threshold:</span>
                    <span className="font-mono text-stone-200">
                      ≥ <span className="text-amber-400 font-bold">{rule.thresholdCount} late marks</span> in a month
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-stone-400 uppercase font-mono text-[10px]">Action / Penalty:</span>
                    <select
                      value={rule.consequenceType}
                      onChange={(e) => {
                        const val = e.target.value as 'warning' | 'half_day_deduction' | 'full_day_deduction';
                        const updated = [...(lateMarkForm.ladder || [])];
                        updated[idx] = {
                          ...updated[idx],
                          consequenceType: val,
                          consequenceValue: val === 'warning' ? 0 : val === 'half_day_deduction' ? 0.5 : 1.0,
                          label:
                            val === 'warning'
                              ? 'Formal Warning (No pay deduction)'
                              : val === 'half_day_deduction'
                              ? 'Half-day salary deduction'
                              : 'Full-day salary deduction',
                        };
                        setLateMarkForm({ ...lateMarkForm, ladder: updated });
                      }}
                      className="bg-stone-950 border border-stone-700 p-1.5 text-stone-200 font-semibold"
                    >
                      <option value="warning">Formal Warning (No Deductions)</option>
                      <option value="half_day_deduction">Half-Day Wage Deduction</option>
                      <option value="full_day_deduction">Full-Day Wage Deduction</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-stone-800">
            <button
              type="submit"
              disabled={updateLateMarkMutation.isPending}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Late Policy</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: SHIFTS MASTER */}
      {activeTab === 'shifts' && (
        <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-hidden p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-stone-200 text-sm uppercase">
                Plant Shift Master
              </h3>
              <p className="text-xs text-stone-400">Continuous 24-hour pipe mill rotation shifts</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-stone-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
                  <th className="p-3">Shift Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Start Time</th>
                  <th className="p-3">End Time</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Grace Buffer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {shifts.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-900/40">
                    <td className="p-3 text-amber-400 font-bold">{s.code}</td>
                    <td className="p-3 text-stone-200 font-sans font-medium">{s.name}</td>
                    <td className="p-3 text-stone-300">{s.startTime}</td>
                    <td className="p-3 text-stone-300">{s.endTime}</td>
                    <td className="p-3 text-stone-400">8.0 hrs</td>
                    <td className="p-3 text-emerald-400">+{s.graceMinutes} mins</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: DECLARED HOLIDAYS */}
      {activeTab === 'holidays' && (
        <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-hidden p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-stone-200 text-sm uppercase">
                Year 2026 Declared Holidays
              </h3>
              <p className="text-xs text-stone-400">Gazetted and plant-restricted paid holidays</p>
            </div>

            <form onSubmit={handleAddHoliday} className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                required
                placeholder="Holiday name..."
                value={newHolName}
                onChange={(e) => setNewHolName(e.target.value)}
                className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200 text-xs"
              />
              <input
                type="date"
                required
                value={newHolDate}
                onChange={(e) => setNewHolDate(e.target.value)}
                className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200 font-mono text-xs"
              />
              <select
                value={newHolType}
                onChange={(e) => setNewHolType(e.target.value as any)}
                className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200 text-xs"
              >
                <option value="gazetted">Gazetted (Mandatory)</option>
                <option value="restricted">Restricted (Plant)</option>
              </select>
              <button
                type="submit"
                disabled={createHolidayMutation.isPending}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase tracking-wider flex items-center gap-1"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Holiday</span>
              </button>
            </form>
          </div>

          <div className="overflow-x-auto border border-stone-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
                  <th className="p-3">Holiday Name</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {holidays.map((h) => (
                  <tr key={h.id} className="hover:bg-stone-900/40">
                    <td className="p-3 font-sans font-semibold text-stone-200">{h.name}</td>
                    <td className="p-3 text-stone-300">{h.date}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] uppercase font-semibold border ${
                          h.isGazetted
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                            : 'bg-stone-800 text-stone-400 border-stone-700'
                        }`}
                      >
                        {h.isGazetted ? 'Gazetted' : 'Restricted'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteHoliday(h.id)}
                        className="p-1 text-stone-500 hover:text-red-400"
                        title="Delete holiday"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: LEAVE TYPES */}
      {activeTab === 'leaves' && (
        <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-hidden p-4 space-y-4">
          <div>
            <h3 className="font-display font-bold text-stone-200 text-sm uppercase">
              Factory Leave Types & Accrual Rules
            </h3>
            <p className="text-xs text-stone-400">Statutory entitlements under Factories Act</p>
          </div>

          <div className="overflow-x-auto border border-stone-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
                  <th className="p-3">Leave Code</th>
                  <th className="p-3">Type Name</th>
                  <th className="p-3">Days / Year</th>
                  <th className="p-3">Carry Forward Max</th>
                  <th className="p-3">Encashable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono">
                {leaveTypes.map((lt) => (
                  <tr key={lt.id} className="hover:bg-stone-900/40">
                    <td className="p-3 font-bold text-amber-400">{lt.code}</td>
                    <td className="p-3 font-sans font-semibold text-stone-200">{lt.name || lt.label}</td>
                    <td className="p-3 text-stone-300">{lt.annualEntitlement ?? lt.daysPerYear ?? 0} days</td>
                    <td className="p-3 text-stone-400">{lt.maxCarryForwardDays ?? lt.carryForwardMax ?? 0} days</td>
                    <td className="p-3 text-emerald-400">{lt.carryForwardAllowed ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOG HISTORY */}
      {activeTab === 'audit' && (
        <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-hidden p-4 space-y-4">
          <div>
            <h3 className="font-display font-bold text-stone-200 text-sm uppercase">
              Configuration Change Audit Trail
            </h3>
            <p className="text-xs text-stone-400">
              Immutable log tracking every administrative adjustment to statutory parameters.
            </p>
          </div>

          <div className="overflow-x-auto border border-stone-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Field / Action</th>
                  <th className="p-3">Diff / Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-mono text-xs">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-900/40">
                    <td className="p-3 text-stone-400">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-amber-400 font-semibold">{log.changedBy}</td>
                    <td className="p-3 text-stone-200">{log.entity}</td>
                    <td className="p-3 text-stone-300 uppercase">{log.fieldChanged || log.action || 'Updated'}</td>
                    <td className="p-3 text-stone-400 max-w-md truncate">
                      {log.oldValue !== undefined && log.newValue !== undefined
                        ? `${log.oldValue} → ${log.newValue}`
                        : JSON.stringify(log.details || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: APPEARANCE & THEME */}
      {activeTab === 'appearance' && (
        <div className="bg-stone-950 border border-stone-800 p-5 space-y-6 text-xs shadow-xl">
          <div>
            <h3 className="font-display font-bold text-stone-200 text-base uppercase">
              Terminal Interface & Visual Theme
            </h3>
            <p className="text-stone-400 text-xs">
              Configure display modes for high-ambient shop floors, daylight control rooms, or night shifts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
            {/* Dark Mode Card */}
            <div
              onClick={() => setTheme('dark')}
              className={`p-4 border cursor-pointer transition-all space-y-3 ${
                theme === 'dark'
                  ? 'border-amber-500 bg-stone-900/90 ring-1 ring-amber-500/30'
                  : 'border-stone-800 bg-stone-900/30 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-stone-800 border border-stone-700 text-amber-400">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-200 text-sm">Dark Theme</div>
                    <div className="text-[10px] text-stone-400 font-mono">Factory Shop-Floor Standard</div>
                  </div>
                </div>
                {theme === 'dark' && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500 text-stone-950">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-stone-400 text-xs leading-relaxed">
                Engineered for low glare, low power consumption, and maximum contrast in industrial mills and night shifts.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-4 h-4 bg-[#0c0a09] border border-stone-700" title="#0c0a09" />
                <span className="w-4 h-4 bg-[#1c1917] border border-stone-700" title="#1c1917" />
                <span className="w-4 h-4 bg-[#292524] border border-stone-700" title="#292524" />
                <span className="w-4 h-4 bg-amber-500" title="Amber 500" />
                <span className="w-4 h-4 bg-emerald-500" title="Emerald 500" />
              </div>
            </div>

            {/* Light Mode Card */}
            <div
              onClick={() => setTheme('light')}
              className={`p-4 border cursor-pointer transition-all space-y-3 ${
                theme === 'light'
                  ? 'border-amber-500 bg-stone-900/90 ring-1 ring-amber-500/30'
                  : 'border-stone-800 bg-stone-900/30 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-stone-800 border border-stone-700 text-amber-500">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-stone-200 text-sm">Light Theme</div>
                    <div className="text-[10px] text-stone-400 font-mono">Daylight Office & Admin</div>
                  </div>
                </div>
                {theme === 'light' && (
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500 text-stone-950">
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="text-stone-400 text-xs leading-relaxed">
                Clean, high-contrast light surfaces optimized for brightly illuminated plant cabins, HR offices, and print-friendly displays.
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="w-4 h-4 bg-[#ffffff] border border-stone-300" title="#ffffff" />
                <span className="w-4 h-4 bg-[#f5f5f4] border border-stone-300" title="#f5f5f4" />
                <span className="w-4 h-4 bg-[#e7e5e4] border border-stone-300" title="#e7e5e4" />
                <span className="w-4 h-4 bg-[#d97706]" title="Deep Amber" />
                <span className="w-4 h-4 bg-[#059669]" title="Emerald Green" />
              </div>
            </div>
          </div>

          {/* Quick Toggle Bar */}
          <div className="p-3 bg-stone-900/60 border border-stone-800 flex items-center justify-between max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-stone-300 font-medium">Quick Toggle:</span>
              <span className="font-mono text-stone-400 capitalize">Currently {theme} mode</span>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 bg-stone-950 hover:bg-stone-800 border border-stone-700 text-stone-200 font-semibold flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-blue-500" />}
              <span>Switch to {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
