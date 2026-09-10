/**
 * Omech HRM Main Application Entry
 * Configuration-driven Human Resource Management for Indian Pipe Manufacturing
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardView } from './components/dashboard/DashboardView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { LeaveView } from './components/leave/LeaveView';
import { WorkersView } from './components/workers/WorkersView';
import { RosterView } from './components/roster/RosterView';
import { PayrollView } from './components/payroll/PayrollView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { LoginView } from './components/auth/LoginView';

// Create a single TanStack QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoutes() {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}

function PublicAuthRoute() {
  const { session } = useAuth();

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <LoginView />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Auth Route */}
                <Route path="/login" element={<PublicAuthRoute />} />

                {/* Protected Operational Routes inside AppLayout */}
                <Route element={<ProtectedRoutes />}>
                  <Route index element={<DashboardView />} />
                  <Route path="attendance" element={<AttendanceView />} />
                  <Route path="leave" element={<LeaveView />} />
                  <Route path="workers" element={<WorkersView />} />
                  <Route path="roster" element={<RosterView />} />
                  <Route path="payroll" element={<PayrollView />} />
                  <Route path="analytics" element={<AnalyticsView />} />
                  <Route path="reports" element={<ReportsView />} />
                  <Route path="settings" element={<SettingsView />} />
                </Route>

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
