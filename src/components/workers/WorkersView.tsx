/**
 * Workers Directory View
 * Comprehensive management of Permanent Staff & Contractual Floor Workers.
 * Features filters, add/edit modal, CSV bulk import, and active status toggles.
 */

import React, { useState } from 'react';
import {
  useEmployees,
  useDepartments,
  useShifts,
  useUpdateEmployee,
  useDeactivateEmployee,
} from '../../hooks/useHRM';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Employee, WorkforceCategory } from '../../types';
import { WorkerModal } from './WorkerModal';
import { BulkImportModal } from './BulkImportModal';
import {
  Users,
  UserPlus,
  Upload,
  Search,
  Building,
  CreditCard,
  Edit2,
  Power,
  PowerOff,
  HardHat,
  BadgeCheck,
} from 'lucide-react';

export function WorkersView() {
  const { role } = useAuth();
  const { success, error } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | WorkforceCategory>('all');
  const [deptFilter, setDeptFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<Employee | null>(null);

  // Queries
  const { data: employees = [] } = useEmployees({
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    departmentId: deptFilter === 'all' ? undefined : deptFilter,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
  });
  const { data: departments = [] } = useDepartments();
  const { data: shifts = [] } = useShifts();

  const updateMutation = useUpdateEmployee();
  const deactivateMutation = useDeactivateEmployee();

  const filteredEmployees = employees.filter((e) => {
    const s = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(s) ||
      e.employeeCode.toLowerCase().includes(s) ||
      e.designation.toLowerCase().includes(s) ||
      e.statutory.uan?.includes(s)
    );
  });

  const handleToggleActive = async (emp: Employee) => {
    try {
      if (emp.isActive) {
        await deactivateMutation.mutateAsync(emp.id);
        success(`Worker ${emp.name} deactivated.`);
      } else {
        await updateMutation.mutateAsync({
          id: emp.id,
          updates: { isActive: true },
        });
        success(`Worker ${emp.name} reactivated.`);
      }
    } catch (err: any) {
      error(err.message || 'Status update failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-950 border border-stone-800 p-4">
        <div>
          <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
            Workforce Directory
          </div>
          <h1 className="font-display font-bold text-xl text-stone-100 tracking-tight">
            Permanent Staff & Contractual Floor Workers
          </h1>
        </div>

        {role === 'admin' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkOpen(true)}
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Bulk CSV Import</span>
            </button>

            <button
              onClick={() => {
                setEditingWorker(null);
                setIsModalOpen(true);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Enrol Worker</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-stone-950 border border-stone-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] max-w-xs flex-1">
            <Search className="w-3.5 h-3.5 text-stone-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search name, code, designation, UAN..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 pl-8 pr-3 py-1.5 text-stone-200 text-xs"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-mono">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as any)}
              className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200"
            >
              <option value="all">All Workforce Types</option>
              <option value="contractual_worker">Contractual Floor Workers</option>
              <option value="permanent_staff">Permanent Staff</option>
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-mono">Department:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-stone-400 font-mono">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-stone-900 border border-stone-700 p-1.5 text-stone-200"
            >
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="all">All Workers</option>
            </select>
          </div>
        </div>

        <div className="font-mono text-stone-400 text-[11px]">
          Displaying <span className="text-stone-100 font-bold">{filteredEmployees.length}</span> Records
        </div>
      </div>

      {/* Workers Table */}
      <div className="bg-stone-950 border border-stone-800 shadow-xl overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-stone-900 border-b border-stone-800 text-stone-300 font-mono text-[11px] uppercase">
              <th className="p-3">Worker Info</th>
              <th className="p-3">Category</th>
              <th className="p-3">Department & Shift</th>
              <th className="p-3">Wage / Salary Basis</th>
              <th className="p-3">Statutory (UAN / PF)</th>
              <th className="p-3">Bank Details</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60">
            {filteredEmployees.map((emp) => {
              const dept = departments.find((d) => d.id === emp.departmentId);
              const shift = shifts.find((s) => s.id === emp.shiftId);
              return (
                <tr key={emp.id} className="hover:bg-stone-900/40 transition">
                  <td className="p-3">
                    <div className="font-semibold text-stone-200 flex items-center gap-1.5">
                      <span>{emp.name}</span>
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      {emp.employeeCode} • {emp.designation}
                    </div>
                  </td>

                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase font-semibold border ${
                        emp.category === 'permanent_staff'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-stone-800 text-stone-300 border-stone-700'
                      }`}
                    >
                      {emp.category === 'permanent_staff' ? 'Permanent Staff' : 'Contractor'}
                    </span>
                  </td>

                  <td className="p-3">
                    <div className="text-stone-300 font-medium">{dept?.name || 'Shop Floor'}</div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      {shift?.name || 'Shift A'} ({shift?.startTime}-{shift?.endTime})
                    </div>
                  </td>

                  <td className="p-3 font-mono text-stone-200">
                    {emp.category === 'permanent_staff' ? (
                      <div>
                        <span className="font-bold text-stone-100">₹{emp.basicSalaryOrWage.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-stone-500 block">/ month (Gross)</span>
                      </div>
                    ) : (
                      <div>
                        <span className="font-bold text-amber-400">₹{emp.basicSalaryOrWage.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-stone-500 block">/ day + OT (₹120/h)</span>
                      </div>
                    )}
                  </td>

                  <td className="p-3 font-mono text-[11px] text-stone-400">
                    <div>UAN: <span className="text-stone-200">{emp.statutory.uan || '—'}</span></div>
                    <div>PF: <span className="text-stone-300">{emp.statutory.pfNumber || '—'}</span></div>
                  </td>

                  <td className="p-3 text-[11px]">
                    <div className="text-stone-300 font-medium">{emp.bankDetails.bankName}</div>
                    <div className="font-mono text-stone-500 text-[10px]">
                      A/C: {emp.bankDetails.accountNumber}
                    </div>
                  </td>

                  <td className="p-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-mono uppercase font-semibold border ${
                        emp.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-stone-800 text-stone-500 border-stone-700'
                      }`}
                    >
                      {emp.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {role === 'admin' && (
                        <>
                          <button
                            onClick={() => {
                              setEditingWorker(emp);
                              setIsModalOpen(true);
                            }}
                            className="p-1 hover:bg-stone-800 text-stone-400 hover:text-stone-200 border border-stone-800"
                            title="Edit Worker Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleActive(emp)}
                            className={`p-1 border ${
                              emp.isActive
                                ? 'hover:bg-red-500/20 text-stone-500 hover:text-red-400 border-stone-800'
                                : 'hover:bg-emerald-500/20 text-stone-500 hover:text-emerald-400 border-stone-800'
                            }`}
                            title={emp.isActive ? 'Deactivate Worker' : 'Reactivate Worker'}
                          >
                            {emp.isActive ? (
                              <PowerOff className="w-3.5 h-3.5" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <WorkerModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingWorker(null);
          }}
          departments={departments}
          shifts={shifts}
          editingWorker={editingWorker}
        />
      )}

      {isBulkOpen && (
        <BulkImportModal
          isOpen={isBulkOpen}
          onClose={() => setIsBulkOpen(false)}
        />
      )}
    </div>
  );
}
