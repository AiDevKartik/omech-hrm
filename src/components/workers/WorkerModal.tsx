/**
 * Worker Add / Edit Modal
 * Supports comprehensive employee profiling:
 * Category (Staff vs Contractual), statutory details (PF, ESI, UAN),
 * bank credentials, and shift/department mappings.
 */

import React, { useState } from 'react';
import { Employee, Department, Shift, WorkforceCategory } from '../../types';
import { useCreateEmployee, useUpdateEmployee } from '../../hooks/useHRM';
import { useToast } from '../../context/ToastContext';
import { X, UserCheck, HardHat, Building, CreditCard } from 'lucide-react';

interface WorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  shifts: Shift[];
  editingWorker?: Employee | null;
}

export function WorkerModal({
  isOpen,
  onClose,
  departments,
  shifts,
  editingWorker,
}: WorkerModalProps) {
  const { success, error } = useToast();
  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee();

  const isEdit = Boolean(editingWorker);

  // Form State
  const [name, setName] = useState(editingWorker?.name || '');
  const [designation, setDesignation] = useState(editingWorker?.designation || 'Pipe Mill Operator');
  const [category, setCategory] = useState<WorkforceCategory>(
    editingWorker?.category || 'contractual_worker'
  );
  const [departmentId, setDepartmentId] = useState<number>(
    editingWorker?.departmentId || departments[0]?.id || 1
  );
  const [shiftId, setShiftId] = useState<number>(
    editingWorker?.shiftId || shifts[0]?.id || 1
  );
  const [basicSalaryOrWage, setBasicSalaryOrWage] = useState<number>(
    editingWorker?.basicSalaryOrWage || 650
  );
  const [joiningDate, setJoiningDate] = useState(
    editingWorker?.dateOfJoining || editingWorker?.joiningDate || '2026-01-10'
  );

  // Statutory & Bank
  const [accountNumber, setAccountNumber] = useState(
    editingWorker?.bankDetails?.accountNumber || '40998811223'
  );
  const [bankName, setBankName] = useState(
    editingWorker?.bankDetails?.bankName || 'State Bank of India'
  );
  const [ifsc, setIfsc] = useState(editingWorker?.bankDetails?.ifsc || 'SBIN0001234');
  const [uan, setUan] = useState(editingWorker?.statutory?.uan || '101299884433');
  const [pfNumber, setPfNumber] = useState(
    editingWorker?.statutory?.pfNumber || 'MH/PUN/0012345/000'
  );
  const [esiNumber, setEsiNumber] = useState(
    editingWorker?.statutory?.esiNumber || '31000988776655443'
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Employee name is required.');
      return;
    }

    try {
      if (isEdit && editingWorker) {
        await updateMutation.mutateAsync({
          id: editingWorker.id,
          updates: {
            name: name.trim(),
            designation: designation.trim(),
            category,
            departmentId,
            shiftId,
            basicSalaryOrWage: Number(basicSalaryOrWage),
            dateOfJoining: joiningDate,
            joiningDate,
            bankDetails: { accountNumber, bankName, ifsc },
            statutory: { uan, pfNumber, esiNumber },
          },
        });
        success(`Worker ${name} updated successfully.`);
      } else {
        await createMutation.mutateAsync({
          name: name.trim(),
          designation: designation.trim(),
          category,
          departmentId,
          shiftId,
          basicSalaryOrWage: Number(basicSalaryOrWage),
          dateOfJoining: joiningDate,
          joiningDate,
          email: `${name.toLowerCase().replace(/\s+/g, '.')}@omech.com`,
          phone: '+91-9822001122',
          weeklyOffDay: 0,
          isActive: true,
          bankDetails: { accountNumber, bankName, ifsc },
          statutory: { uan, pfNumber, esiNumber },
        });
        success(`Worker ${name} enrolled with auto-generated sequence code.`);
      }
      onClose();
    } catch (err: any) {
      error(err.message || 'Operation failed');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-950 px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
              Workforce Master
            </div>
            <h3 className="font-display font-bold text-lg text-stone-100">
              {isEdit ? `Edit Worker: ${editingWorker?.name}` : 'Enrol New Workforce Member'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-200 border border-stone-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Section 1: Basic Identity */}
          <div className="space-y-3">
            <div className="text-stone-400 font-mono uppercase text-[11px] font-semibold flex items-center gap-1.5 pb-1 border-b border-stone-800">
              <HardHat className="w-3.5 h-3.5 text-amber-500" />
              <span>Identity & Plant Placement</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Baburao Yadav"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Plant Designation</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Boiler Operator Grade II"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Workforce Category</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const cat = e.target.value as WorkforceCategory;
                    setCategory(cat);
                    if (cat === 'permanent_staff' && basicSalaryOrWage < 5000) {
                      setBasicSalaryOrWage(28000);
                    } else if ((cat === 'contractual' || (cat as string) === 'contractual_worker') && basicSalaryOrWage > 2000) {
                      setBasicSalaryOrWage(650);
                    }
                  }}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 text-xs font-semibold"
                >
                  <option value="contractual">Contractual Floor Worker</option>
                  <option value="permanent_staff">Permanent Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Assigned Department</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 text-xs"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Default Shift</label>
                <select
                  value={shiftId}
                  onChange={(e) => setShiftId(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 text-xs"
                >
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">
                  {category === 'permanent_staff' ? 'Monthly Gross Salary (INR)' : 'Daily Wage Rate (INR / Day)'}
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  value={basicSalaryOrWage}
                  onChange={(e) => setBasicSalaryOrWage(Number(e.target.value))}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-amber-400 font-mono font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Joining Date</label>
                <input
                  type="date"
                  required
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Statutory Numbers */}
          <div className="space-y-3 pt-2">
            <div className="text-stone-400 font-mono uppercase text-[11px] font-semibold flex items-center gap-1.5 pb-1 border-b border-stone-800">
              <Building className="w-3.5 h-3.5 text-amber-500" />
              <span>Statutory Compliance Numbers (Indian Labour Codes)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Universal A/C (UAN)</label>
                <input
                  type="text"
                  placeholder="12 digit UAN"
                  value={uan}
                  onChange={(e) => setUan(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">PF Number</label>
                <input
                  type="text"
                  placeholder="e.g. MH/PUN/0012345/000"
                  value={pfNumber}
                  onChange={(e) => setPfNumber(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">ESI IP Number</label>
                <input
                  type="text"
                  placeholder="17 digit ESI"
                  value={esiNumber}
                  onChange={(e) => setEsiNumber(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bank Disbursal Details */}
          <div className="space-y-3 pt-2">
            <div className="text-stone-400 font-mono uppercase text-[11px] font-semibold flex items-center gap-1.5 pb-1 border-b border-stone-800">
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
              <span>Direct Bank Disbursal Account</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. Bank of Baroda"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Account Number</label>
                <input
                  type="text"
                  placeholder="Account Number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. BARB0PIMPRI"
                  value={ifsc}
                  onChange={(e) => setIfsc(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-stone-400 hover:text-stone-200 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isEdit ? 'Save Changes' : 'Complete Enrollment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
