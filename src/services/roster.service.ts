/**
 * Shift Roster Domain Service
 * Handles shift assignments by date range and weekly shop-floor scheduling
 */

import { ShiftRosterAssignment, Shift, Employee } from '../types';
import { getStoreItem, setStoreItem, nextSequence, STORE_KEYS } from '../data/localStore';

export const rosterService = {
  async getRoster(startDate: string, endDate: string): Promise<ShiftRosterAssignment[]> {
    const list = getStoreItem<ShiftRosterAssignment[]>(STORE_KEYS.SHIFT_ROSTER, []);
    return list.filter((r) => r.date >= startDate && r.date <= endDate);
  },

  async assignShiftRange(
    employeeIds: number[],
    startDate: string,
    endDate: string,
    shiftId: number
  ): Promise<number> {
    const list = getStoreItem<ShiftRosterAssignment[]>(STORE_KEYS.SHIFT_ROSTER, []);
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    let count = 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      for (const empId of employeeIds) {
        const existingIdx = list.findIndex((r) => r.employeeId === empId && r.date === dateStr);
        if (existingIdx >= 0) {
          list[existingIdx].shiftId = shiftId;
        } else {
          list.push({
            id: nextSequence('shiftRoster'),
            employeeId: empId,
            date: dateStr,
            shiftId,
          });
        }
        count++;
      }
    }

    // Also update current default shift for the employee if ongoing
    for (const empId of employeeIds) {
      const emp = employees.find((e) => e.id === empId);
      if (emp) {
        emp.shiftId = shiftId;
      }
    }

    setStoreItem(STORE_KEYS.SHIFT_ROSTER, list);
    setStoreItem(STORE_KEYS.EMPLOYEES, employees);
    return count;
  },
};
