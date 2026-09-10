/**
 * Employee Domain Service
 * Encapsulates worker records, bank & statutory compliance details
 */

import { Employee, WorkforceCategory } from '../types';
import { getStoreItem, setStoreItem, nextSequence, STORE_KEYS } from '../data/localStore';

export interface EmployeeFilters {
  departmentId?: number;
  category?: WorkforceCategory;
  search?: string;
  isActive?: boolean;
}

export const employeeService = {
  async getEmployees(filters?: EmployeeFilters): Promise<Employee[]> {
    let list = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);

    if (filters) {
      if (filters.departmentId !== undefined && filters.departmentId > 0) {
        list = list.filter((e) => e.departmentId === filters.departmentId);
      }
      if (filters.category) {
        list = list.filter((e) => e.category === filters.category);
      }
      if (filters.isActive !== undefined) {
        list = list.filter((e) => e.isActive === filters.isActive);
      }
      if (filters.search && filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        list = list.filter(
          (e) =>
            e.name.toLowerCase().includes(query) ||
            e.employeeCode.toLowerCase().includes(query) ||
            e.designation.toLowerCase().includes(query) ||
            e.phone.includes(query)
        );
      }
    }

    return list;
  },

  async getEmployeeById(id: number): Promise<Employee | null> {
    const list = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    return list.find((e) => e.id === id) || null;
  },

  async createEmployee(data: Omit<Employee, 'id' | 'employeeCode'>): Promise<Employee> {
    const list = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    const newId = nextSequence('employee');
    const prefix = data.category === 'permanent_staff' ? 'OM-1' : 'OM-2';
    const codeNumber = 100 + newId;
    const employeeCode = `${prefix}${codeNumber}`;

    const newEmployee: Employee = {
      ...data,
      id: newId,
      employeeCode,
      isActive: true,
    };

    list.push(newEmployee);
    setStoreItem(STORE_KEYS.EMPLOYEES, list);
    return newEmployee;
  },

  async updateEmployee(id: number, updates: Partial<Employee>): Promise<Employee> {
    const list = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) {
      throw new Error(`Employee with ID ${id} not found.`);
    }

    const updated = {
      ...list[index],
      ...updates,
      id: list[index].id, // Prevent ID overwrite
      employeeCode: list[index].employeeCode, // Keep primary code immutable
    };

    list[index] = updated;
    setStoreItem(STORE_KEYS.EMPLOYEES, list);
    return updated;
  },

  /**
   * Deactivate instead of hard delete for audit compliance
   */
  async deactivateEmployee(id: number): Promise<void> {
    const list = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    const employee = list.find((e) => e.id === id);
    if (!employee) throw new Error(`Employee with ID ${id} not found.`);
    employee.isActive = false;
    setStoreItem(STORE_KEYS.EMPLOYEES, list);
  },

  async reactivateEmployee(id: number): Promise<void> {
    const list = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    const employee = list.find((e) => e.id === id);
    if (!employee) throw new Error(`Employee with ID ${id} not found.`);
    employee.isActive = true;
    setStoreItem(STORE_KEYS.EMPLOYEES, list);
  },

  /**
   * Bulk import from CSV rows
   */
  async bulkImportEmployees(records: Partial<Employee>[]): Promise<number> {
    const list = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    let count = 0;

    for (const row of records) {
      if (!row.name || !row.category) continue;
      const newId = nextSequence('employee');
      const prefix = row.category === 'permanent_staff' ? 'OM-1' : 'OM-2';
      const employeeCode = `${prefix}${100 + newId}`;

      const newEmp: Employee = {
        id: newId,
        employeeCode,
        name: row.name,
        email: row.email || `${row.name.toLowerCase().replace(/\s+/g, '.')}@omechpipes.com`,
        phone: row.phone || '+91 90000 00000',
        departmentId: Number(row.departmentId) || 1,
        shiftId: Number(row.shiftId) || 1,
        category: (row.category as WorkforceCategory) || 'contractual',
        designation: row.designation || 'Floor Operator',
        dateOfJoining: row.dateOfJoining || '2026-01-01',
        basicSalaryOrWage: Number(row.basicSalaryOrWage) || (row.category === 'permanent_staff' ? 35000 : 650),
        bankDetails: row.bankDetails || {
          bankName: 'State Bank of India',
          accountNumber: '30001122334',
          ifsc: 'SBIN0004122',
        },
        statutory: row.statutory || {
          uan: '100999888111',
          pfNumber: `MH/PUN/0041289/000/${newId}`,
          esiNumber: `3100000000${newId}`,
        },
        weeklyOffDay: 0,
        isActive: true,
      };

      list.push(newEmp);
      count++;
    }

    setStoreItem(STORE_KEYS.EMPLOYEES, list);
    return count;
  },
};
