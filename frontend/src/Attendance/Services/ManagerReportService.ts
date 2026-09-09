import axios from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/managerReport`;

// =============================================
// Type Definitions
// =============================================

export interface ReportSummary {
  TotalMembers: number;
  TotalExpectedDays: number;       // across all members
  TotalPresentDays: number;
  AvgAttendancePct: number;        // 0–100
  TotalLeaveDays: number;
  CasualLeaveDays: number;
  SickLeaveDays: number;
  EarnedLeaveDays: number;
  TotalLocationExceptions: number;
  WFHDays: number;
  CustomerLocDays: number;
  TotalLateArrivals: number;
  AvgLateMinutes: number;          // average late delay in minutes
}

export interface EmployeeReportRow {
  employeeId: string;
  name: string;
  department: string | null;
  expectedDays: number;
  daysWorked: number;
  leaveDays: number;
  lateDays: number;
  wfhDays: number;
  locationExceptions: number;
  attendancePct: number;           // 0–100
  avgDurationMinutes: number | null;
  accountEnabled?: boolean;
}

export interface ManagerReportData {
  summary: ReportSummary | null;
  employees: EmployeeReportRow[];
}

// =============================================
// Date Range Helpers (IST)
// =============================================

// Returns today's date in IST as a local Date object
function todayIST(): Date {
  const now = new Date();
  // IST = UTC+5:30
  const istOffset = 5.5 * 60 * 60 * 1000;
  const utc = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + istOffset);
}

export type DatePreset = "thisWeek" | "thisMonth" | "thisQuarter" | "custom";

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
    case "thisWeek": {
      const dow = today.getDay(); // 0=Sun
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
// Helper
// =============================================

const getAuthHeaders = (userId?: string) => {
  const token = getStoredAuthToken();
  const headers: Record<string, string> = {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
  if (userId) headers.userid = userId;
  return headers;
};

// =============================================
// Service Method
// =============================================

export const getManagerReport = async (
  managerId: string,
  startDate: Date,
  endDate: Date
): Promise<ManagerReportData> => {
  const response = await axios.get(`${API_BASE_URL}/${managerId}`, {
    headers: getAuthHeaders(managerId),
    params: {
      startDate: fmtDate(startDate),
      endDate:   fmtDate(endDate),
    },
  });
  const data = response.data.data;
  return {
    summary:   data.summary   ?? null,
    employees: data.employees ?? [],
  };
};
