/**
 * Centralized UI Copy and Constants for Omech HRM
 * Indian Pipe Manufacturing Operations
 */

export const STRINGS = {
  APP_NAME: "OMECH HRM",
  APP_TAGLINE: "Industrial Workforce & Operations Management",
  COMPANY_NAME: "Omech Pipes & Tubes Ltd.",
  COMPANY_ADDRESS: "Plot 42-45, Industrial Area Phase II, Sanaswadi, Pune, Maharashtra 412208",
  CIN: "U27100PN2008PLC134890",
  FACTORY_LOCATION: "Plant 01 - Pune Rolling & Galvanizing Mills",
  
  // Navigation
  NAV_DASHBOARD: "Dashboard",
  NAV_ATTENDANCE: "Attendance",
  NAV_LEAVE: "Leave Management",
  NAV_WORKERS: "Workers Directory",
  NAV_ROSTER: "Shift Roster",
  NAV_PAYROLL: "Statutory Payroll",
  NAV_ANALYTICS: "Operations Analytics",
  NAV_REPORTS: "Compliance Reports",
  NAV_SETTINGS: "Configuration Masters",
  
  // Roles
  ROLE_ADMIN: "Plant HR Administrator",
  ROLE_SUPERVISOR: "Shop Floor Supervisor",
  ROLE_WORKER: "Worker / Self-Service",
  
  // Attendance Statuses
  STATUS_PRESENT: "Present",
  STATUS_ABSENT: "Absent",
  STATUS_HALF_DAY: "Half Day",
  STATUS_ON_LEAVE: "On Leave",
  STATUS_HOLIDAY: "Plant Holiday",
  STATUS_WEEKLY_OFF: "Weekly Off",
  STATUS_LATE: "Late Check-in",
  
  // Common Actions
  ACTION_CHECK_IN: "Punch In",
  ACTION_CHECK_OUT: "Punch Out",
  ACTION_SAVE: "Save Configuration",
  ACTION_CANCEL: "Cancel",
  ACTION_DELETE: "Deactivate",
  ACTION_EDIT: "Edit",
  ACTION_APPROVE: "Approve",
  ACTION_REJECT: "Reject",
  ACTION_EXPORT_EXCEL: "Export to Excel (.xlsx)",
  ACTION_EXPORT_PDF: "Export to PDF",
  ACTION_GENERATE_PAYROLL: "Compute Payroll Run",
  ACTION_FINALIZE_PAYROLL: "Lock & Finalize Run",
  ACTION_RECALCULATE_LEAVE: "Recalculate Balances",
  ACTION_BULK_MARK: "Bulk Mark Attendance",
  ACTION_REGULARIZE: "Request Regularization",
  
  // Badges & Notices
  NOTICE_PROTOTYPE_API: "Ready for .NET Core Web API + SQL Server stored procedures",
  NOTICE_AUDIT_LOGGED: "All master changes are immutably logged for audit compliance",
  WARNING_LATE_MARK_TITLE: "Discipline Policy Threshold Alert",
  
  // Form Labels
  LABEL_EMPLOYEE_ID: "Employee Code",
  LABEL_NAME: "Full Name",
  LABEL_DEPARTMENT: "Department / Shop Floor Unit",
  LABEL_DESIGNATION: "Designation",
  LABEL_CATEGORY: "Workforce Category",
  LABEL_SHIFT: "Assigned Shift",
  LABEL_JOINING_DATE: "Date of Joining",
  LABEL_GROSS_SALARY: "Monthly Gross / Daily Wage (₹)",
  LABEL_BANK_NAME: "Bank Name",
  LABEL_ACCOUNT_NO: "Account Number",
  LABEL_IFSC: "IFSC Code",
  LABEL_UAN: "UAN (Universal Account No.)",
  LABEL_PF_NO: "PF Account No.",
  LABEL_ESI_NO: "ESI IP Number",
  LABEL_STATUS: "Status",
  
  // Empty & Loading States
  LOADING_DATA: "Loading operational records...",
  EMPTY_ATTENDANCE: "No punch records found for this period.",
  EMPTY_LEAVE_REQUESTS: "No pending leave approval requests.",
  EMPTY_WORKERS: "No active workers found matching criteria.",
  EMPTY_PAYROLL: "No payroll run has been computed for this cycle.",
} as const;
