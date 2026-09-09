import axios from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/teamView`;

// =============================================
// Type Definitions
// =============================================

export interface TeamViewMember {
  employeeId: string;
  name: string;
  department: string | null;
  officeLocation: string | null;      // assigned / geofenced office location
  recordedLocation: string | null;    // location captured at check-in (present on location-exception rows)
  shiftName: string | null;
  shiftStartTime: string | null;  // "HH:mm:ss"
  shiftEndTime: string | null;    // "HH:mm:ss"
  checkIn: string | null;
  checkOut: string | null;
  violationType: "Early" | "Late" | "Location" | "Both" | null;
  managerApprovalStatus: "Pending" | "Approved" | "Rejected" | null;
  attendanceStatus: string | null;
  workLocationType: string | null;
  leaveId: string | null;
  leaveTypeName: string | null;
  leaveStartDate: string | null;
  leaveEndDate: string | null;
  User_24_7: boolean;
  OffDays: string | null;
  halfDay: boolean | null;
  halfSession: string | null;
}

export interface CalendarAttendanceRecord {
  date: string;         // "YYYY-MM-DD"
  checkIn: string | null;
  checkOut: string | null;
  violationType: string | null;
  attendanceStatus: string | null;
  workLocationType: string | null;
}

export interface CalendarLeaveRecord {
  leaveStartDate: string;
  leaveEndDate: string;
  leaveTypeName: string | null;
  approvalStatus: string;
}

export interface EmployeeCalendarData {
  attendance: CalendarAttendanceRecord[];
  leaves: CalendarLeaveRecord[];
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
// Service Methods
// =============================================

export const getTeamView = async (
  managerId: string,
  date: Date
): Promise<TeamViewMember[]> => {
  const dateStr = date.toISOString().split("T")[0];
  const response = await axios.get(`${API_BASE_URL}/${managerId}`, {
    headers: getAuthHeaders(managerId),
    params: { date: dateStr },
  });
  return response.data.data ?? [];
};

// ─── Team Attendance Calendar types ─────────────────────────────────────────────────────

export interface TeamCalendarMember {
  employeeId: string;
  name: string;
  department: string | null;
  shiftName: string | null;
  shiftStartTime: string | null; // "HH:mm:ss"
  shiftEndTime: string | null;
}

export interface TeamCalendarAttendanceRow {
  employeeId: string;
  date: string;                  // "YYYY-MM-DD"
  checkIn: string | null;
  checkOut: string | null;
  workLocationType: string | null; // "Office" | "Home" | "WorkFromHome" | "CustomerLoc" | "Other"
  violationType: string | null;
  managerApprovalStatus: string | null;
}

export interface TeamCalendarLeaveRow {
  employeeId: string;
  leaveStartDate: string;        // "YYYY-MM-DD"
  leaveEndDate: string;          // "YYYY-MM-DD"
  leaveTypeName: string | null;
  approvalStatus: string;        // "Approved" | "Pending"
}

export interface TeamCalendarData {
  members: TeamCalendarMember[];
  attendance: TeamCalendarAttendanceRow[];
  leaves: TeamCalendarLeaveRow[];
}

export const getTeamCalendar = async (
  managerId: string,
  startDate: Date,
  endDate: Date
): Promise<TeamCalendarData> => {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const response = await axios.get(`${API_BASE_URL}/${managerId}/teamCalendar`, {
    headers: getAuthHeaders(managerId),
    params: { startDate: fmt(startDate), endDate: fmt(endDate) },
  });
  const data = response.data.data;
  // attendance rows carry all member info — extract unique members from it
  const memberMap = new Map<string, TeamCalendarMember>();
  (data?.attendance ?? []).forEach((r: any) => {
    if (!memberMap.has(r.employeeId)) {
      memberMap.set(r.employeeId, {
        employeeId:     r.employeeId,
        name:           r.name,
        department:     r.department,
        shiftName:      r.shiftName,
        shiftStartTime: r.shiftStartTime,
        shiftEndTime:   r.shiftEndTime,
      });
    }
  });
  // Also pick up members who have no attendance rows (only leaves or absent all range)
  (data?.leaves ?? []).forEach((r: any) => {
    if (!memberMap.has(r.employeeId)) {
      memberMap.set(r.employeeId, {
        employeeId: r.employeeId,
        name:       r.name,
        department: r.department ?? null,
        shiftName:  null,
        shiftStartTime: null,
        shiftEndTime:   null,
      });
    }
  });
  return {
    members:    Array.from(memberMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    attendance: data?.attendance ?? [],
    leaves:     data?.leaves ?? [],
  };
};

// ─── Employee Detail Panel types ─────────────────────────────────────────────

export interface EmpDetailProfile {
  displayName: string;
  department: string;
  jobTitle: string;
  managerName: string;
  shiftName: string;
  shiftStart: string | null;   // "HH:mm:ss"
  shiftEnd: string | null;
  officeLocation: string;
}

export interface EmpLeaveBalance {
  leaveType: string;
  total: number;
  used: number;
  remaining: number;
}

export interface EmpEvent {
  eventType: string;   // 'Leave'|'Late'|'WFH'|'Regularized'|'Permission'
  label: string;
  detail: string;
  status: string;
  eventDate: string;
  createdOn: string;
}

export interface EmpStats {
  attendancePct: number;
  avgHoursPerDay: number;
  lateArrivals: number;
  regularizations: number;
  presentDays: number;
  expectedDays: number;
}

export interface EmpHeatmapDay {
  date: string;           // "YYYY-MM-DD"
  classification: string; // 'Early'|'OnTime'|'Late'|'WFH'|'Absent'|'Weekend'|'Leave'
}

export interface EmployeeDetailData {
  profile: EmpDetailProfile;
  leaveBalance: EmpLeaveBalance[];
  recentEvents: EmpEvent[];
  fullHistory: EmpEvent[];
  stats: EmpStats;
  heatmap: EmpHeatmapDay[];
}

export const getEmployeeDetail = async (
  managerId: string,
  employeeId: string,
  startDate: Date,
  endDate: Date
): Promise<EmployeeDetailData> => {
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const response = await axios.get(
    `${API_BASE_URL}/${managerId}/employee/${employeeId}/detail`,
    {
      headers: getAuthHeaders(managerId),
      params: { startDate: fmt(startDate), endDate: fmt(endDate) },
    }
  );
  return response.data.data as EmployeeDetailData;
};

export const getEmployeeCalendar = async (
  managerId: string,
  employeeId: string,
  month: number,
  year: number
): Promise<EmployeeCalendarData> => {
  const response = await axios.get(
    `${API_BASE_URL}/${managerId}/employee/${employeeId}/calendar`,
    {
      headers: getAuthHeaders(managerId),
      params: { month, year },
    }
  );
  const data = response.data.data;
  return {
    attendance: data?.attendance ?? [],
    leaves: data?.leaves ?? [],
  };
};
