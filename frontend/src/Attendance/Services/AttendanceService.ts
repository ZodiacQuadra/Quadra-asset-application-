import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/attendance`;

// =============================================
// Type Definitions
// =============================================

export interface AttendanceRecord {
  ID: string;
  UserID: string;
  CheckIn: string;
  CheckOut: string | null;
  Office_Location: string | null;
  Office_Coordinates: string | null;
  Employee_CurrentLocation: string | null;
  Employee_CurrentCoordinates: string | null;
  WorkLocationType: string | null;
  IsLocationChanged: boolean;
  ManagerID: string | null;
  ManagerApprovalStatus: "Pending" | "Approved" | "Rejected" | null;
  ShiftStartTime: string | null;
  ShiftEndTime: string | null;
  IsPresent: boolean | null;         // null until checkout
  ViolationType?: 'Early' | 'Late' | 'Location' | 'Both' | null;
  IsActive: boolean;
  CreatedOn: string;
  CreatedBy: string;
  ModifiedOn: string | null;
  ModifiedBy: string | null;
  DurationMinutes?: number;          // computed by sp_GetAttendanceByUser
  EscalationReason?:string | null;
  AttendanceStatus?:string;
  IsWeekend?:boolean
}

export interface PendingApproval extends AttendanceRecord {
  EmployeeName: string;
  EmployeeMail: string;
  EmployeeJobTitle: string | null;
  EmployeeDepartment: string | null;
}

export interface AttendanceSummary {
  TotalDays: number;
  PresentDays: number;
  AbsentDays: number;
  RemoteDays: number;
  PendingApprovals: number;
  LateArrivals: number;
}

export interface PermissionRequest {
  ID: string;
  EmpID: string;
  EmpName: string;
  Reason: string;
  Date: string;
  StartTime: string;
  EndTime: string;
  ManagerID: string;
  ManagerName: string;
  ApprovalStatus: "Pending" | "Approved" | "Rejected";
  CreatedOn: string;
  ModifiedOn: string | null;
  CreatedBy: string;
  ModifiedBy: string | null;
  IsNightShift: boolean | null
}

export interface CheckInPayload {
  userId: string;
  createdBy: string;
  currentLocation?: string | null;
  currentCoordinates?: string | null;
  workLocation?: string | null;
  isWeekend?: boolean;
  weekendReason?: string;
  isLate?: boolean;
  lateReason?: string | null
}

export interface CheckOutPayload {
  userId: string;
  modifiedBy: string;
  isEarlyCheckOut?: boolean;
  earlyCheckoutReason?: string;
}

export interface CheckInResponse {
  success: boolean;
  isLocationChanged: boolean;
  violationType?: 'Early' | 'Late' | 'Location' | 'Both' | null;
  isPermission: boolean;
  data: AttendanceRecord;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

// =============================================
// Helper
// =============================================
const getAuthHeaders = (userId?: string) => {
  const token = getStoredAuthToken();
  const headers: any = {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
  if (userId) {
    headers.userid = userId;
  }
  
  return headers;
};

const handleSessionExpiry = () => {
  alert("Session expired. Please sign in again.");
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = "/";
};

const handleAxiosError = (error: unknown, defaultMessage: string): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const status = axiosError.response?.status;
    if (status === 401 || status === 403) {
      handleSessionExpiry();
    }
    const message = axiosError.response?.data?.message || axiosError.message || defaultMessage;
    throw new Error(message);
  }
  throw error instanceof Error ? error : new Error(defaultMessage);
};
// =============================================
// Service Methods
// =============================================

export const checkIn = async (payload: CheckInPayload,setIsLateDialogOpen:(state:boolean)=>void,setWeekendDialogOpen:(state:boolean)=>void): Promise<CheckInResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/checkIn`, payload, {
      headers: getAuthHeaders(payload.userId),
    });
    return response.data;
  } catch (error:unknown) {
    if(axios.isAxiosError(error) && error.response && error.response.data.isWeekend){
      setWeekendDialogOpen(true)
    }
    if(axios.isAxiosError(error) && error.response && error.response.data.isLate){
      setIsLateDialogOpen(true)
    }
    return handleAxiosError(error, "Failed to check in");
  }
};

export const checkOut = async (payload: CheckOutPayload): Promise<AttendanceRecord> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/checkOut`, payload, {
      headers: getAuthHeaders(payload.userId),
    });
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to check out");
  }
};

export const getAttendanceHistory = async (
  userId: string,
  month?: number,
  year?: number,
  page = 1,
  pageSize = 31
): Promise<AttendanceRecord[]> => {
  try {
    const params: Record<string, string | number> = { page, pageSize };
    if (month) params.month = month;
    if (year)  params.year  = year;
    
    const response = await axios.get(`${API_BASE_URL}/${userId}/history`, { 
      params,
      headers:{ 
        ...getAuthHeaders(userId),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma":        "no-cache",

      },
      
      
    });
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch Attendance Log");
  }
};

export const getAttendanceSummary = async (
  userId: string,
  month: number,
  year: number
): Promise<AttendanceSummary> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${userId}/summary`, {
      params: { month, year },
      headers: getAuthHeaders(userId),
    });
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch attendance summary");
  }
};

export const getPendingApprovals = async (
  managerId: string
): Promise<PendingApproval[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/approvals/manager/${managerId}`, {
      headers: getAuthHeaders(managerId),
    });
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch pending approvals");
  }
};


export const getOptionalPendingApprovals = async (
  managerId: string
): Promise<PendingApproval[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/approvals/optional/${managerId}`, {
      headers: getAuthHeaders(managerId),
    });
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch pending approvals");
  }
};

export const updateApprovalStatus = async (
  attendanceId: string,
  managerId: string,
  status: "Approved" | "Rejected",
  modifiedBy: string,
  comments: string | null
): Promise<AttendanceRecord> => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/${attendanceId}/approval`, {
      managerId,
      status,
      modifiedBy,
      comments
    }, {
      headers: getAuthHeaders(managerId),
    });
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to update approval status");
  }
};

// =============================================
// Permission Service Methods
// =============================================

export const createPermissionRequest = async (payload: {
  empId: string;
  reason: string;
  date: string;
  startTime: string;
  endTime: string;
  createdBy: string;
  isNightShift?: boolean;
}): Promise<PermissionRequest> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/permission`, payload, {
      headers: getAuthHeaders(payload.empId),
    });
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to create permission request");
  }
};

export const getPermissionHistory = async (empId: string): Promise<PermissionRequest[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/permission/${empId}`, {
      headers: getAuthHeaders(empId),
    });
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch permission history");
  }
};

export const getTodayPermissionStatus = async (empId: string): Promise<PermissionRequest | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/permission/today/${empId}`, {
      headers: getAuthHeaders(empId),
    });
    return response.data.data; // This might be null if no request found
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch today's permission status");
  }
};

export const getPendingPermissionRequests = async (managerId: string): Promise<PermissionRequest[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/approvals/manager/${managerId}/permissions`, {
      headers: getAuthHeaders(managerId),
    });
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch pending permission requests");
  }
};

export const getOptionalPendingPermissionRequests = async (managerId: string): Promise<PermissionRequest[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/approvals/optional/${managerId}/permissions`, {
      headers: getAuthHeaders(managerId),
    });
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch pending permission requests");
  }
};

export const getPermissionRequestsByStatus = async (managerId: string, status: string): Promise<PermissionRequest[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/approvals/manager/${managerId}/permissions?status=${encodeURIComponent(status)}`, {
      headers: getAuthHeaders(managerId),
    });
    return response.data.data || [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch permission requests by status");
  }
};

export const getOptionalPermissionRequestsByStatus = async (managerId: string, status: string): Promise<PermissionRequest[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/approvals/optional/${managerId}/permissions?status=${encodeURIComponent(status)}`, {
      headers: getAuthHeaders(managerId),
    });
    return response.data.data || [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch permission requests by status (optional)");
  }
};

// =============================================
// Recent Attendance (last N days)
// =============================================

export interface RecentAttendanceDay {
  AttDate: string;                  // "YYYY-MM-DD"
  CheckIn: string | null;
  CheckOut: string | null;
  ViolationType: "Early" | "Late" | "Location" | "Both" | null;
  WorkLocationType: string | null;
  ManagerApprovalStatus: "Pending" | "Approved" | "Rejected" | null;
  IsPresent: boolean | null;
}

export const getRecentAttendance = async (
  userId: string,
  days = 7
): Promise<RecentAttendanceDay[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${userId}/recent`, {
      params: { days },
      headers: getAuthHeaders(userId),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch recent attendance");
  }
};

export const updatePermissionApprovalStatus = async (
  id: string,
  managerId: string,
  status: "Approved" | "Rejected",
  modifiedBy: string,
  comments: string | null
): Promise<PermissionRequest> => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/permission/${id}/approval`, {
      managerId,
      status,
      modifiedBy,
      comments
    }, {
      headers: getAuthHeaders(managerId),
    });
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to update permission approval status");
  }
};
