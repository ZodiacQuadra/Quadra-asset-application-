import axios from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/managerDashboard`;

// =============================================
// Type Definitions
// =============================================

export interface TeamMember {
  userId: string
  name: string;
  department: string | null;
  shiftName: string | null;
  startTime: string | null;
  checkIn: string | null;
  checkOut: string | null;
  violationType: "Early" | "Late" | "Location" | "Both" | null;
  isOnLeave?: boolean;
  leaveType?: string | null;
  accountEnabled?: boolean;
}

export interface PendingCounts {
  PendingLeaveCount: number;
  PendingPermissionCount: number;
  PendingLocationCount: number;
}

export interface ManagerDashboardData {
  team: TeamMember[];
  pendingCounts: PendingCounts;
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

export const getManagerDashboard = async (
  managerId: string
): Promise<ManagerDashboardData> => {
  const response = await axios.get(`${API_BASE_URL}/${managerId}`, {
    headers: getAuthHeaders(managerId),
  });

  const data = response.data.data;
  return {
    team: data.team ?? [],
    pendingCounts: data.pendingCounts ?? {
      PendingLeaveCount: 0,
      PendingPermissionCount: 0,
      PendingLocationCount: 0,
    },
  };
};
