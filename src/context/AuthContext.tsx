/**
 * Authentication Context & Session Provider
 * Restores session from js-cookie on boot and exposes role-aware helpers
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserSession, Role, Employee } from '../types';
import { authService } from '../services/auth.service';
import { employeeService } from '../services/employee.service';

interface AuthContextType {
  session: UserSession | null;
  employee: Employee | null;
  role: Role | null;
  isLoading: boolean;
  login: (identifier: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  switchUser: (employeeId: number, forcedRole?: Role) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from cookie on initial mount
  useEffect(() => {
    async function initSession() {
      try {
        const storedSession = await authService.getCurrentSession();
        if (storedSession) {
          setSession(storedSession);
          const emp = await employeeService.getEmployeeById(storedSession.employeeId);
          setEmployee(emp);
        } else {
          // Auto-login to Admin by default on prototype first visit for immediate exploration, or redirect to login
          // Let's restore or offer clean login
          const adminSession = await authService.login('OM-1001', true);
          setSession(adminSession);
          const emp = await employeeService.getEmployeeById(adminSession.employeeId);
          setEmployee(emp);
        }
      } catch (err) {
        console.error('[AuthContext] Failed to restore session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initSession();
  }, []);

  const login = async (identifier: string, rememberMe = true) => {
    setIsLoading(true);
    try {
      const newSession = await authService.login(identifier, rememberMe);
      setSession(newSession);
      const emp = await employeeService.getEmployeeById(newSession.employeeId);
      setEmployee(emp);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setSession(null);
    setEmployee(null);
  };

  const switchUser = async (employeeId: number, forcedRole?: Role) => {
    setIsLoading(true);
    try {
      const newSession = await authService.switchUser(employeeId, forcedRole);
      setSession(newSession);
      const emp = await employeeService.getEmployeeById(newSession.employeeId);
      setEmployee(emp);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        employee,
        role: session?.role || null,
        isLoading,
        login,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
