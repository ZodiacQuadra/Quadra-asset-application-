import axios from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/adminAttendanceReport`;

// =============================================
// Type Definitions
// =============================================

export interface AdminReportSummary {
  TotalMembers: number;
  TotalExpectedDays: number;
  TotalPresentDays: number;
  AvgAttendancePct: number;
  TotalLeaveDays: number;
  CasualLeaveDays: number;
  SickLeaveDays: number;
  EarnedLeaveDays: number;
  TotalLocationExceptions: number;
  WFHDays: number;
  CustomerLocDays: number;
  TotalLateArrivals: number;
  AvgLateMinutes: number;
}

export interface AdminEmployeeReportRow {
  employeeId: string;
  name: string;
  department: string | null;
  expectedDays: number;
  daysWorked: number;
  leaveDays: number;
  lateDays: number;
  wfhDays: number;
  locationExceptions: number;
  attendancePct: number;
  avgDurationMinutes: number | null;
}

export interface AdminReportData {
  summary: AdminReportSummary | null;
  employees: AdminEmployeeReportRow[];
}

export interface AdminReportFilters {
  departments: string[];
  managers: { id: string; name: string }[];
}

// =============================================
// Date Range Helpers (IST)
// =============================================

function todayIST(): Date {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + istOffset);
}

export type DatePreset = "thisDay" | "thisWeek" | "thisMonth" | "thisQuarter" | "thisYear" | "custom";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function getPresetRange(preset: DatePreset): DateRange {
  const today = todayIST();
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  switch (preset) {
    case "thisDay":
      return { startDate: today, endDate: today };
    case "thisWeek": {
      const dow = today.getDay();
      const start = new Date(y, m, d - dow);
      const end   = new Date(y, m, d - dow + 6);
      return { startDate: start, endDate: end > today ? today : end };
    }
    case "thisMonth":
      return { startDate: new Date(y, m, 1), endDate: today };
    case "thisQuarter": {
      const q = Math.floor(m / 3);
      return { startDate: new Date(y, q * 3, 1), endDate: today };
    }
    case "thisYear":
      return { startDate: new Date(y, 0, 1), endDate: today };
    default:
      return { startDate: new Date(y, m, 1), endDate: today };
  }
}

export function fmtDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// =============================================
// Auth Helper
// =============================================

const getAuthHeaders = () => {
  const token = getStoredAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

// =============================================
// Dashboard Summary Types
// =============================================

export interface StatusCounts {
  Pending: number;
  Approved: number;
  Rejected: number;
}

export interface DepartmentStat {
  department: string;
  empCount: number;
  presentDays: number;
  expectedDays: number;
  leaveDays: number;
  presentPct: number;   // 0–100
  absentPct: number;    // 0–100
  leavePct: number;     // 0–100
}

export interface EmployeeStat {
  employeeId: string;
  displayName: string;
  department: string;
  presentDays: number;
  expectedDays: number;
  attendancePct: number;
}

export interface StatusBreakdownEntry {
  count: number;
  pct: number;
}

export interface StatusBreakdown {
  onTime:    StatusBreakdownEntry;
  late:      StatusBreakdownEntry;
  onLeave:   StatusBreakdownEntry;
  absent:    StatusBreakdownEntry;
  exception: StatusBreakdownEntry;
  blocked:   StatusBreakdownEntry;
}

export interface AdminDashboardSummaryData {
  totalEmployees: number;
  leaveRequests: StatusCounts;
  permissionRequests: StatusCounts;
  lateArrivals: StatusCounts;
  geoFencing: StatusCounts;
  regularizeRequests: StatusCounts;
  departmentStats: DepartmentStat[];
  employees: EmployeeStat[];
  statusBreakdown: StatusBreakdown;
}

// =============================================
// Service Methods
// =============================================

// Normalises the Pending/Approved/Rejected counts regardless of whether the
// backend sends PascalCase ("Pending") or camelCase ("pending") keys.
function normalizeStatusCounts(raw: any): StatusCounts {
  return {
    Pending:  raw?.Pending  ?? raw?.pending  ?? 0,
    Approved: raw?.Approved ?? raw?.approved ?? 0,
    Rejected: raw?.Rejected ?? raw?.rejected ?? 0,
  };
}

// =============================================
// Request Details (for card drawer)
// =============================================

export type RequestType = "leave" | "permission" | "late" | "geofence" | "regularize";

export interface LeaveRequestRow {
  id: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
}

export interface PermissionRequestRow {
  id: string;
  employeeName: string;
  department: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
  status: string;
}

export interface LateArrivalRow {
  id: string;
  employeeName: string;
  department: string;
  date: string;
  checkInTime: string;
  shiftStart: string | null;
  violationType: string;
  status: string;
}

export interface GeoFenceRow {
  id: string;
  employeeName: string;
  department: string;
  date: string;
  checkInTime: string;
  workLocationType: string | null;
  currentLocation: string | null;
  officeLocation: string | null;
  violationType: string;
  status: string;
}

export interface RegularizeRow {
  id: string;
  employeeName: string;
  department: string;
  date: string;
  isCheckIn: boolean | number;
  isLeave: boolean | number;
  reason: string | null;
  actualStartTime: string | null;
  status: string;
}

export type AnyRequestRow =
  | LeaveRequestRow
  | PermissionRequestRow
  | LateArrivalRow
  | GeoFenceRow
  | RegularizeRow;

export interface RequestDetailsResponse {
  rows: AnyRequestRow[];
  total: number;
  page: number;
  pageSize: number;
}

export const getAdminRequestDetails = async (params: {
  type: RequestType;
  startDate: Date;
  endDate: Date;
  status?: string;
  department?: string;
  page?: number;
  pageSize?: number;
}): Promise<RequestDetailsResponse> => {
  const query: Record<string, string | number> = {
    type:      params.type,
    startDate: fmtDate(params.startDate),
    endDate:   fmtDate(params.endDate),
  };
  if (params.status && params.status !== "All") query.status = params.status;
  if (params.department && params.department !== "All") query.department = params.department;
  if (params.page)     query.page     = params.page;
  if (params.pageSize) query.pageSize = params.pageSize;

  const response = await axios.get(`${API_BASE_URL}/requests`, {
    headers: getAuthHeaders(),
    params:  query,
  });
  return response.data.data as RequestDetailsResponse;
};


export const exportAdminReport = async (
  startDate: Date,
  endDate: Date,
  department?: string
): Promise<void> => {
  const body: Record<string, string> = {
    startDate: fmtDate(startDate),
    endDate:   fmtDate(endDate),
  };
  if (department && department !== "All") body.department = department;

  const response = await axios.post(`${API_BASE_URL}/export-report`,{...body}, {
    headers: { ...getAuthHeaders(), "Content-Type": undefined },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  const disposition = response.headers["content-disposition"] as string | undefined;
  const match = disposition?.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
  link.download = match?.[1]?.replace(/['"]/g, "") ?? `attendance-report-${fmtDate(startDate)}-to-${fmtDate(endDate)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/**
 * Send the admin attendance report summary email.
 */
export const shareAdminReport = async (
  startDate: Date,
  endDate: Date
): Promise<void> => {
  await axios.post(
    `${API_BASE_URL}/share-report`,
    {
      startDate: fmtDate(startDate),
      endDate:   fmtDate(endDate),
    },
    { headers: getAuthHeaders() }
  );
};

/**
 * Fetch organisation-wide dashboard summary (cards data).
 */
export const getAdminDashboardSummary = async (
  startDate: Date,
  endDate: Date,
  department?: string,
): Promise<AdminDashboardSummaryData> => {
  const params: Record<string, string> = {
    startDate: fmtDate(startDate),
    endDate:   fmtDate(endDate),
  };
  if (department) params.department = department;
  const response = await axios.get(`${API_BASE_URL}/`, {
    headers: getAuthHeaders(),
    params,
  });
  const raw = response.data.data;
  return {
    totalEmployees:     raw.totalEmployees     ?? 0,
    leaveRequests:      normalizeStatusCounts(raw.leaveRequests),
    permissionRequests: normalizeStatusCounts(raw.permissionRequests),
    lateArrivals:       normalizeStatusCounts(raw.lateArrivals),
    geoFencing:         normalizeStatusCounts(raw.geoFencing),
    regularizeRequests: normalizeStatusCounts(raw.regularizeRequests),
    departmentStats:    raw.departmentStats    ?? [],
    employees:          raw.employees          ?? [],
    statusBreakdown:    raw.statusBreakdown    ?? null,
  };
};

// =============================================
// Org Attendance — daily org-wide view
// =============================================

export type OrgAttendanceStatus = "on_time" | "late" | "exception" | "on_leave" | "absent" | "blocked";

export interface OrgAttendanceRow {
  employeeId:            string;
  name:                  string;
  department:            string;
  managerName:           string | null;
  shiftName:             string | null;
  shiftStart:            string | null;   // "HH:mm:ss" or ISO
  shiftEnd:              string | null;
  checkIn:               string | null;   // ISO timestamp
  checkOut:              string | null;
  workLocationType:      string | null;
  officeLocation:        string | null;
  currentLocation:       string | null;
  violationType:         string | null;
  managerApprovalStatus: string | null;
  durationMinutes:       number | null;
  leaveName:             string | null;
  leaveStatus:           string | null;
  status:                OrgAttendanceStatus;
}

export interface OrgAttendanceCounts {
  all:       number;
  on_time:   number;
  late:      number;
  exception: number;
  on_leave:  number;
  absent:    number;
  blocked:   number;
}

export interface OrgAttendanceResponse {
  rows:       OrgAttendanceRow[];
  counts:     OrgAttendanceCounts;
  pagination: { page: number; pageSize: number; total: number };
}

export const getOrgAttendance = async (params: {
  date?:       string;   // "YYYY-MM-DD"
  department?: string;
  status?:     string;
  search?:     string;
  page?:       number;
  pageSize?:   number;
}): Promise<OrgAttendanceResponse> => {
  const query: Record<string, string | number> = {};
  if (params.date)       query.date       = params.date;
  if (params.department) query.department = params.department;
  if (params.status && params.status !== "all") query.status = params.status;
  if (params.search)     query.search     = params.search;
  if (params.page)       query.page       = params.page;
  if (params.pageSize)   query.pageSize   = params.pageSize;

  const response = await axios.get(`${API_BASE_URL}/org-attendance`, {
    headers: getAuthHeaders(),
    params: query,
  });
  return response.data.data as OrgAttendanceResponse;
};

// =============================================
// Admin history panel — employee list
// =============================================

export interface AdminEmployeeListItem {
  employeeId: string;
  name: string;
  department: string | null;
  jobTitle: string | null;
  User_24_7: boolean;
  OffDays: string | null;
  shiftEndTime: string | null;
}

/**
 * Fetch all active employees for the admin history panel left panel.
 * Pass a department string to filter, or omit for all employees.
 */
export const getAllEmployeesForAdmin = async (
  department?: string
): Promise<AdminEmployeeListItem[]> => {
  const params: Record<string, string> = {};
  if (department) params.department = department;
  const response = await axios.get(`${API_BASE_URL}/employees`, {
    headers: getAuthHeaders(),
    params,
  });
  return response.data.data ?? [];
};

/**
 * Fetch distinct departments and managers for filter dropdowns.
 */
export const getAdminReportFilters = async (): Promise<AdminReportFilters> => {
  const response = await axios.get(`${API_BASE_URL}/filters`, {
    headers: getAuthHeaders(),
  });
  const data = response.data.data;
  return {
    departments: data.departments ?? [],
    managers:    data.managers    ?? [],
  };
};

/**
 * Fetch organisation-wide attendance report.
 * department and managerId are optional — omit to see all employees.
 */
export const getAdminAttendanceReport = async (
  startDate:  Date,
  endDate:    Date,
  department?: string,
  managerId?:  string
): Promise<AdminReportData> => {
  const params: Record<string, string> = {
    startDate: fmtDate(startDate),
    endDate:   fmtDate(endDate),
  };
  if (department) params.department = department;
  if (managerId)  params.managerId  = managerId;

  const response = await axios.get(`${API_BASE_URL}/`, {
    headers: getAuthHeaders(),
    params,
  });
  const data = response.data.data;
  return {
    summary:   data.summary   ?? null,
    employees: data.employees ?? [],
  };
};

// =============================================
// Bulk Upload Attendance
// =============================================

export const bulkUploadAttendance = async (
  startDate: string,
  endDate: string,
  shiftId: string,
  file: File
): Promise<void> => {
  const formData = new FormData();
  formData.append("startDate", startDate);
  formData.append("endDate", endDate);
  formData.append("shiftId", shiftId);
  formData.append("file", file);

  await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/admin/attendance/bulk`,
    formData,
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

// =============================================
// Bulk Import Regularization Requests
// =============================================

/** One row that failed validation during the regularization bulk import. */
export interface RegularizationImportError {
  row: number;
  email?: string;
  message: string;
}

/** Result summary returned by the regularization bulk-import endpoint. */
export interface RegularizationImportResult {
  totalRows: number;
  imported: number;
  skipped: number;
  errors: RegularizationImportError[];
}

/**
 * Bulk import regularization requests from an Excel file.
 * Hits POST /adminAttendanceReport/regularization/bulk-import.
 */
export const bulkImportRegularization = async (
  file: File
): Promise<RegularizationImportResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post(
    `${API_BASE_URL}/regularization/bulk-import`,
    formData,
    {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    }
  );

  const data = response.data?.data ?? {};
  return {
    totalRows: data.totalRows ?? 0,
    imported:  data.imported  ?? 0,
    skipped:   data.skipped   ?? 0,
    errors:    data.errors    ?? [],
  };
};
