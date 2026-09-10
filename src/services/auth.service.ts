/**
 * Authentication & Session Service
 * Cookie-backed session management using js-cookie
 */

import Cookies from 'js-cookie';
import { UserSession, Role } from '../types';
import { getStoreItem, STORE_KEYS } from '../data/localStore';
import { Employee } from '../types';

const SESSION_COOKIE_NAME = 'omech_session';
const SESSION_EXPIRY_DAYS = 7;

export const authService = {
  /**
   * Restore current session from cookie
   */
  async getCurrentSession(): Promise<UserSession | null> {
    const raw = Cookies.get(SESSION_COOKIE_NAME);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as UserSession;
      if (session.expiresAt && Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  /**
   * Login with employee code or ID
   */
  async login(identifier: string, rememberMe = true): Promise<UserSession> {
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    const cleanId = identifier.trim().toLowerCase();
    const rawClean = identifier.trim().replace(/[-_ ]/g, '').toLowerCase();

    // 1. Check quick aliases for demo roles
    let targetEmployeeId: number | null = null;
    let targetRole: Role | null = null;

    if (['admin', 'administrator', 'hr', 'om1001', '1001', 'emp001', 'emp1', '1'].includes(cleanId) || rawClean === 'om1001') {
      targetEmployeeId = 1;
      targetRole = 'admin';
    } else if (['supervisor', 'om1002', '1002', 'emp002', 'emp2', '2'].includes(cleanId) || rawClean === 'om1002') {
      targetEmployeeId = 2;
      targetRole = 'supervisor';
    } else if (['worker', 'om2001', '2001', 'emp007', 'emp7', '7'].includes(cleanId) || rawClean === 'om2001') {
      targetEmployeeId = 7;
      targetRole = 'worker';
    }

    // Find employee
    let employee: Employee | undefined;
    if (targetEmployeeId !== null) {
      employee = employees.find((e) => e.id === targetEmployeeId);
    }

    if (!employee) {
      employee = employees.find(
        (e) =>
          e.employeeCode.toLowerCase() === cleanId ||
          e.employeeCode.replace(/[-_ ]/g, '').toLowerCase() === rawClean ||
          e.email.toLowerCase() === cleanId ||
          String(e.id) === identifier.trim() ||
          e.name.toLowerCase().includes(cleanId)
      );
    }

    if (!employee) {
      throw new Error(
        `Invalid credentials. No employee record found matching '${identifier}'. Try 'admin', 'supervisor', 'worker' or badge ID 'OM-1001'.`
      );
    }

    if (!employee.isActive) {
      throw new Error('This employee account has been deactivated. Please contact Plant HR.');
    }

    // Determine role:
    let role: Role = targetRole || 'worker';
    if (!targetRole) {
      if (employee.id === 1 || employee.departmentId === 8) {
        role = 'admin';
      } else if (employee.supervisorDepartments && employee.supervisorDepartments.length > 0) {
        role = 'supervisor';
      }
    }

    const issuedAt = Date.now();
    const expiresAt = issuedAt + (rememberMe ? SESSION_EXPIRY_DAYS : 1) * 24 * 60 * 60 * 1000;

    const session: UserSession = {
      userId: employee.id,
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      name: employee.name,
      role,
      departmentId: employee.departmentId,
      supervisorDepartments: employee.supervisorDepartments || [],
      issuedAt,
      expiresAt,
    };

    Cookies.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
      expires: rememberMe ? SESSION_EXPIRY_DAYS : 1,
      sameSite: 'lax',
    });

    return session;
  },

  /**
   * Switch role or active demo user on demand
   */
  async switchUser(employeeId: number, forcedRole?: Role): Promise<UserSession> {
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) throw new Error('Employee not found');

    let role: Role = forcedRole || 'worker';
    if (!forcedRole) {
      if (employee.id === 1 || employee.departmentId === 8) {
        role = 'admin';
      } else if (employee.supervisorDepartments && employee.supervisorDepartments.length > 0) {
        role = 'supervisor';
      }
    }

    const issuedAt = Date.now();
    const expiresAt = issuedAt + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const session: UserSession = {
      userId: employee.id,
      employeeId: employee.id,
      employeeCode: employee.employeeCode,
      name: employee.name,
      role,
      departmentId: employee.departmentId,
      supervisorDepartments: employee.supervisorDepartments || [],
      issuedAt,
      expiresAt,
    };

    Cookies.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
      expires: SESSION_EXPIRY_DAYS,
      sameSite: 'lax',
    });

    return session;
  },

  /**
   * Logout user and clear session cookie
   */
  async logout(): Promise<void> {
    Cookies.remove(SESSION_COOKIE_NAME);
  },

  /**
   * List demo test personas for fast switching
   */
  async getDemoAccounts(): Promise<{ employee: Employee; suggestedRole: Role }[]> {
    const employees = getStoreItem<Employee[]>(STORE_KEYS.EMPLOYEES, []);
    return [
      { employee: employees.find((e) => e.id === 1)!, suggestedRole: 'admin' as Role },
      { employee: employees.find((e) => e.id === 2)!, suggestedRole: 'supervisor' as Role },
      { employee: employees.find((e) => e.id === 3)!, suggestedRole: 'supervisor' as Role },
      { employee: employees.find((e) => e.id === 7)!, suggestedRole: 'worker' as Role },
      { employee: employees.find((e) => e.id === 8)!, suggestedRole: 'worker' as Role },
    ].filter((item) => Boolean(item.employee));
  },
};
