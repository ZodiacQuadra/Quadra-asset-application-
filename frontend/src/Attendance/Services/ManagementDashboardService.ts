import axios from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/managementDashboard`;

// =============================================
// Date Range Helpers
//
// Deliberately independent from AdminAttendanceReportService's
// getPresetRange — that one clamps "This Week" conditionally
// (`end > today ? today : end`), which is fragile. Here every preset's
// end date is always set directly to today (date-only, no time-of-day
// component), so today's record is guaranteed to be included whenever
// it falls within the selected period, for every preset consistently.
// =============================================

export type DatePreset = "thisWeek" | "thisMonth" | "thisQuarter" | "thisYear" | "custom";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getPresetRange(preset: DatePreset): DateRange {
  const today = startOfDay(new Date());
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();

  switch (preset) {
    case "thisWeek": {
      const dow = today.getDay();
      return { startDate: new Date(y, m, d - dow), endDate: today };
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

const getAuthHeaders = () => {
  const token = getStoredAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

export interface ManagementDashboardRow {
  employeeId: string;
  displayName: string;
  email: string;
  department: string;
  expectedDays: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
  permissionDays: number;
  regularizeDays: number;
  attendancePct: number;
}

export interface ManagementDashboardResponse {
  rows: ManagementDashboardRow[];
  pagination: { page: number; pageSize: number; total: number };
}

export type ManagementDashboardSortField =
  | "displayName"
  | "email"
  | "department"
  | "expectedDays"
  | "presentDays"
  | "absentDays"
  | "leaveDays"
  | "permissionDays"
  | "regularizeDays"
  | "attendancePct";

export const getManagementDashboardReport = async (params: {
  startDate: Date;
  endDate: Date;
  department?: string;
  search?: string;
  sortBy?: ManagementDashboardSortField;
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}): Promise<ManagementDashboardResponse> => {
  const query: Record<string, string | number> = {
    startDate: fmtDate(params.startDate),
    endDate: fmtDate(params.endDate),
  };
  if (params.department && params.department !== "All") query.department = params.department;
  if (params.search) query.search = params.search;
  if (params.sortBy) query.sortBy = params.sortBy;
  if (params.sortDir) query.sortDir = params.sortDir;
  if (params.page) query.page = params.page;
  if (params.pageSize) query.pageSize = params.pageSize;

  const response = await axios.get(`${API_BASE_URL}/report`, {
    headers: getAuthHeaders(),
    params: query,
  });
  return response.data.data as ManagementDashboardResponse;
};

// =============================================
// Drill-down detail types + fetchers — one per count column
// =============================================

export interface PresentDetailRow {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  shiftStartTime: string | null;
  assignedLocation: string | null;
  fetchedLocation: string | null;
  isLate: "Yes" | "No";
  isGeoFence: "Yes" | "No";
}

export interface AbsentDetailRow {
  date: string;
}

export interface LeaveDetailRow {
  startDate: string;
  endDate: string;
  reason: string | null;
  approvedBy: string | null;
}

export interface PermissionDetailRow {
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
  approvedBy: string | null;
}

export interface RegularizeDetailRow {
  date: string;
  type: string;
  reason: string | null;
  approvedBy: string | null;
}

async function fetchDetail<T>(
  path: string,
  params: { employeeId: string; startDate: Date; endDate: Date }
): Promise<T[]> {
  const response = await axios.get(`${API_BASE_URL}/${path}`, {
    headers: getAuthHeaders(),
    params: {
      employeeId: params.employeeId,
      startDate: fmtDate(params.startDate),
      endDate: fmtDate(params.endDate),
    },
  });
  return (response.data.data?.rows ?? []) as T[];
}

export const getPresentDetails = (params: { employeeId: string; startDate: Date; endDate: Date }) =>
  fetchDetail<PresentDetailRow>("present-details", params);

export const getAbsentDetails = (params: { employeeId: string; startDate: Date; endDate: Date }) =>
  fetchDetail<AbsentDetailRow>("absent-details", params);

export const getLeaveDetails = (params: { employeeId: string; startDate: Date; endDate: Date }) =>
  fetchDetail<LeaveDetailRow>("leave-details", params);

export const getPermissionDetails = (params: { employeeId: string; startDate: Date; endDate: Date }) =>
  fetchDetail<PermissionDetailRow>("permission-details", params);

export const getRegularizeDetails = (params: { employeeId: string; startDate: Date; endDate: Date }) =>
  fetchDetail<RegularizeDetailRow>("regularize-details", params);
