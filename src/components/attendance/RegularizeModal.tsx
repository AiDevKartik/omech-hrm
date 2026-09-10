/**
 * Punch Regularization Request Modal
 * Enables workers to submit regularization for missed or erratic biometric punches
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCreateRegularization } from '../../hooks/useHRM';
import { useToast } from '../../context/ToastContext';
import { X, Clock } from 'lucide-react';

interface RegularizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export function RegularizeModal({
  isOpen,
  onClose,
  defaultDate = '2026-09-04',
}: RegularizeModalProps) {
  const { employee } = useAuth();
  const { success, error } = useToast();
  const createMutation = useCreateRegularization();

  const [date, setDate] = useState(defaultDate);
  const [requestedCheckIn, setRequestedCheckIn] = useState('06:00');
  const [requestedCheckOut, setRequestedCheckOut] = useState('14:00');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee) return;
    if (!reason.trim()) {
      error('Please provide a reason for the punch regularization.');
      return;
    }

    try {
      await createMutation.mutateAsync({
        employeeId: employee.id,
        date,
        requestedCheckIn,
        requestedCheckOut,
        reason: reason.trim(),
      });
      success(`Regularization request submitted for ${date}. Awaiting supervisor approval.`);
      onClose();
    } catch (err: any) {
      error(err.message || 'Failed to submit regularization request');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-stone-950 px-5 py-4 border-b border-stone-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-amber-500 uppercase tracking-wider">
              Self-Service Request
            </div>
            <h3 className="font-display font-bold text-lg text-stone-100">
              Attendance Regularization
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-200 border border-stone-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="bg-stone-950 p-2.5 border border-stone-800 text-stone-400">
            Employee: <span className="font-semibold text-stone-200">{employee?.name}</span> ({employee?.employeeCode})
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Date of Missed Punch</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Actual In Time</label>
              <input
                type="time"
                required
                value={requestedCheckIn}
                onChange={(e) => setRequestedCheckIn(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Actual Out Time</label>
              <input
                type="time"
                required
                value={requestedCheckOut}
                onChange={(e) => setRequestedCheckOut(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-stone-400 uppercase mb-1">Reason for Missing Biometric Punch</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Biometric reader unpowered at Gate 2, Gatekeeper manual entry recorded in slip"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 p-2 text-stone-200 text-xs"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-stone-400 hover:text-stone-200 text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{createMutation.isPending ? 'Submitting...' : 'Submit Regularization'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
