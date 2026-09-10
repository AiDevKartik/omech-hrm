/**
 * Configuration Masters & Audit Log Service
 * Manages admin-editable statutory, policy, shift, and department rules.
 * All mutations append immutable change log entries for audit compliance.
 */

import {
  PayrollConfig,
  LeaveType,
  LateMarkPolicyConfig,
  Department,
  Shift,
  Holiday,
  WeeklyOffRule,
  ConfigAuditLog,
} from '../types';
import { getStoreItem, setStoreItem, nextSequence, STORE_KEYS } from '../data/localStore';

/**
 * Log a configuration change
 */
function recordAuditEntry(
  changedBy: string,
  entity: ConfigAuditLog['entity'],
  fieldChanged: string,
  oldValue: unknown,
  newValue: unknown
) {
  const logs = getStoreItem<ConfigAuditLog[]>(STORE_KEYS.AUDIT_LOGS, []);
  logs.unshift({
    id: nextSequence('auditLog'),
    changedBy,
    entity,
    fieldChanged,
    oldValue: typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue),
    newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue),
    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
  });
  setStoreItem(STORE_KEYS.AUDIT_LOGS, logs);
}

export const configService = {
  // 1. Payroll Configuration Master
  async getPayrollConfig(): Promise<PayrollConfig> {
    return getStoreItem<PayrollConfig>(STORE_KEYS.PAYROLL_CONFIG, {
      basicPercentOfGross: 45,
      hraPercentOfBasic: 20,
      daPercentOfBasic: 15,
      pfEmployeePercent: 12,
      pfEmployerPercent: 12,
      pfWageCeiling: 15000,
      esiEmployeePercent: 0.75,
      esiEmployerPercent: 3.25,
      esiWageCeiling: 21000,
      professionalTaxSlabs: [],
      overtimeRatePerHour: 120,
      overtimeDailyHoursThreshold: 8.0,
      standardWorkingDays: 26,
      allowNegativeLeaveBalance: false,
    });
  },

  async updatePayrollConfig(
    updates: Partial<PayrollConfig>,
    changedBy: string
  ): Promise<PayrollConfig> {
    const current = await this.getPayrollConfig();
    const updated = { ...current, ...updates };

    for (const key of Object.keys(updates) as (keyof PayrollConfig)[]) {
      if (JSON.stringify(current[key]) !== JSON.stringify(updates[key])) {
        recordAuditEntry(changedBy, 'payroll', key, current[key], updates[key]);
      }
    }

    setStoreItem(STORE_KEYS.PAYROLL_CONFIG, updated);
    return updated;
  },

  // 2. Leave Policy Master
  async getLeavePolicies(): Promise<LeaveType[]> {
    return getStoreItem<LeaveType[]>(STORE_KEYS.LEAVE_TYPES, []);
  },

  async updateLeaveType(
    id: number,
    updates: Partial<LeaveType>,
    changedBy: string
  ): Promise<LeaveType> {
    const list = await this.getLeavePolicies();
    const index = list.findIndex((l) => l.id === id);
    if (index === -1) throw new Error(`Leave policy ${id} not found.`);

    const oldItem = list[index];
    const updated = { ...oldItem, ...updates, id };

    recordAuditEntry(
      changedBy,
      'leave',
      `LeaveType[${oldItem.code}]`,
      oldItem,
      updated
    );

    list[index] = updated;
    setStoreItem(STORE_KEYS.LEAVE_TYPES, list);
    return updated;
  },

  async createLeaveType(
    data: Omit<LeaveType, 'id'>,
    changedBy: string
  ): Promise<LeaveType> {
    const list = await this.getLeavePolicies();
    const newId = nextSequence('leaveType');
    const newItem: LeaveType = { ...data, id: newId };

    recordAuditEntry(changedBy, 'leave', `Created[${newItem.code}]`, 'None', newItem);

    list.push(newItem);
    setStoreItem(STORE_KEYS.LEAVE_TYPES, list);
    return newItem;
  },

  async deleteLeaveType(id: number, changedBy: string): Promise<void> {
    let list = await this.getLeavePolicies();
    const item = list.find((l) => l.id === id);
    if (!item) return;

    recordAuditEntry(changedBy, 'leave', `Deleted[${item.code}]`, item, 'Deleted');
    list = list.filter((l) => l.id !== id);
    setStoreItem(STORE_KEYS.LEAVE_TYPES, list);
  },

  // 3. Late Mark / Discipline Policy Master
  async getLateMarkPolicy(): Promise<LateMarkPolicyConfig> {
    return getStoreItem<LateMarkPolicyConfig>(STORE_KEYS.LATE_MARK_POLICY_CONFIG, {
      graceMinutes: 15,
      resetCycle: 'monthly',
      ladder: [],
    });
  },

  async updateLateMarkPolicy(
    updates: Partial<LateMarkPolicyConfig>,
    changedBy: string
  ): Promise<LateMarkPolicyConfig> {
    const current = await this.getLateMarkPolicy();
    const updated = { ...current, ...updates };

    recordAuditEntry(changedBy, 'late_mark', 'Policy & Ladder update', current, updated);

    setStoreItem(STORE_KEYS.LATE_MARK_POLICY_CONFIG, updated);
    return updated;
  },

  // 4. Other Masters: Departments, Shifts, Holidays, Weekly Offs
  async getDepartments(): Promise<Department[]> {
    return getStoreItem<Department[]>(STORE_KEYS.DEPARTMENTS, []);
  },

  async updateDepartment(
    id: number,
    updates: Partial<Department>,
    changedBy: string
  ): Promise<Department> {
    const list = await this.getDepartments();
    const idx = list.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error(`Department ${id} not found.`);

    const oldVal = list[idx];
    const updated = { ...oldVal, ...updates, id };
    recordAuditEntry(changedBy, 'department', `Dept[${oldVal.code}]`, oldVal, updated);

    list[idx] = updated;
    setStoreItem(STORE_KEYS.DEPARTMENTS, list);
    return updated;
  },

  async createDepartment(data: Omit<Department, 'id'>, changedBy: string): Promise<Department> {
    const list = await this.getDepartments();
    const newId = nextSequence('department');
    const newDept: Department = { ...data, id: newId };
    recordAuditEntry(changedBy, 'department', `Created[${newDept.code}]`, 'None', newDept);
    list.push(newDept);
    setStoreItem(STORE_KEYS.DEPARTMENTS, list);
    return newDept;
  },

  async getShifts(): Promise<Shift[]> {
    return getStoreItem<Shift[]>(STORE_KEYS.SHIFTS, []);
  },

  async updateShift(id: number, updates: Partial<Shift>, changedBy: string): Promise<Shift> {
    const list = await this.getShifts();
    const idx = list.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`Shift ${id} not found.`);

    const oldVal = list[idx];
    const updated = { ...oldVal, ...updates, id };
    recordAuditEntry(changedBy, 'shift', `Shift[${oldVal.code}]`, oldVal, updated);

    list[idx] = updated;
    setStoreItem(STORE_KEYS.SHIFTS, list);
    return updated;
  },

  async getHolidays(year?: number): Promise<Holiday[]> {
    const list = getStoreItem<Holiday[]>(STORE_KEYS.HOLIDAYS, []);
    if (year) {
      return list.filter((h) => h.date.startsWith(`${year}`));
    }
    return list;
  },

  async createHoliday(data: Omit<Holiday, 'id'>, changedBy: string): Promise<Holiday> {
    const list = await this.getHolidays();
    const newId = nextSequence('holiday');
    const newHoliday: Holiday = { ...data, id: newId };
    recordAuditEntry(changedBy, 'holiday', `Created Holiday[${data.name}]`, 'None', newHoliday);
    list.push(newHoliday);
    setStoreItem(STORE_KEYS.HOLIDAYS, list);
    return newHoliday;
  },

  async deleteHoliday(id: number, changedBy: string): Promise<void> {
    let list = await this.getHolidays();
    const item = list.find((h) => h.id === id);
    if (!item) return;
    recordAuditEntry(changedBy, 'holiday', `Deleted Holiday[${item.name}]`, item, 'Deleted');
    list = list.filter((h) => h.id !== id);
    setStoreItem(STORE_KEYS.HOLIDAYS, list);
  },

  async getWeeklyOffs(): Promise<WeeklyOffRule[]> {
    return getStoreItem<WeeklyOffRule[]>(STORE_KEYS.WEEKLY_OFF_CONFIG, []);
  },

  async updateWeeklyOff(
    id: number,
    updates: Partial<WeeklyOffRule>,
    changedBy: string
  ): Promise<WeeklyOffRule> {
    const list = await this.getWeeklyOffs();
    const idx = list.findIndex((w) => w.id === id);
    if (idx === -1) throw new Error(`Weekly off rule ${id} not found.`);

    const oldVal = list[idx];
    const updated = { ...oldVal, ...updates, id };
    recordAuditEntry(changedBy, 'shift', `WeeklyOff[${oldVal.name}]`, oldVal, updated);

    list[idx] = updated;
    setStoreItem(STORE_KEYS.WEEKLY_OFF_CONFIG, list);
    return updated;
  },

  // 5. Audit Logs
  async getAuditLogs(): Promise<ConfigAuditLog[]> {
    return getStoreItem<ConfigAuditLog[]>(STORE_KEYS.AUDIT_LOGS, []);
  },
};
