import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/leaveRequest`;

export interface LeaveRequestPayload {
  RequestorID: string;
  RequestorName: string;
  Start_Date: string; // YYYY-MM-DD
  End_Date: string;   // YYYY-MM-DD
  LeaveNameType: string;
  Reason?: string;
  ManagerID?: string;
  ManagerName?: string;
  ManagerEmail?: string; // used specifically for sending email on the backend
  HalfDay?: boolean;
  HalfSession?:string

}

export interface LeaveBalance {
  LeaveNameType: string;
  LeaveType: string;
  TotalDays: number;
  UsedDays: number;
  AvailableDays: number;
  color?: string;
  IsDisabled:boolean;
  IsOptional: boolean
}

export interface LeaveOnTheDate {
  RequestorName: string;
  ApprovalStatus: string;
  Reason: string
}

export interface LeaveImpact {
  data: LeaveOnTheDate[]
  
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

const getAuthHeaders = () => {
  const token = getStoredAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
};

const handleAxiosError = (error: unknown, defaultMessage: string): ApiResponse => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    return {
      success: false,
      message: axiosError.response?.data?.message || axiosError.message || defaultMessage,
      error: axiosError.response?.data || axiosError.message,
    };
  }
  if (error instanceof Error) {
    return { success: false, message: error.message, error: error.message };
  }
  return { success: false, message: defaultMessage, error: String(error) };
};

export const submitLeaveRequest = async (
  payload: LeaveRequestPayload,
  userId: string
): Promise<ApiResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/request`, payload, {
      headers: {
        ...getAuthHeaders(),
        userid: userId,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error submitting leave request:", error);
    return handleAxiosError(error, "Failed to submit leave request");
  }
};

export interface LeaveRequestRecord {
  ID: string;
  RequestorID: string;
  RequestorName: string;
  Start_Date: string;
  End_Date: string;
  LeaveName: string;
  Reason: string | null;
  ManagerID: string | null;
  ManagerName: string | null;
  OptionalManagerID: string | null;
  ApprovalStatus: string;
  CreatedOn: string;
  TotalDays?: number;
  ExtendedDays?: number;
  Halfday?: boolean;
  HalfSession?: string;
  LeaveNameType: string
}

export const getLeaveHistory = async (userId: string): Promise<ApiResponse<LeaveRequestRecord[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/history/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching leave history:", error);
    return handleAxiosError(error, "Failed to fetch leave history");
  }
};

export const getPendingLeaveApprovals = async (managerId: string): Promise<LeaveRequestRecord[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/approvals/manager/${managerId}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching pending leave approvals:", error);
    throw new Error("Failed to load leave approvals.");
  }
};

export const getOptionalPendingLeaveApprovals = async (managerId: string): Promise<LeaveRequestRecord[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/approvals/optional/${managerId}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching pending leave approvals:", error);
    throw new Error("Failed to load leave approvals.");
  }
};

export const getLeaveApprovalsByStatus = async (managerId: string, status: string): Promise<LeaveRequestRecord[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/approvals/manager/${managerId}?status=${encodeURIComponent(status)}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching leave approvals by status:", error);
    throw new Error("Failed to load leave approvals.");
  }
};

export const getOptionalLeaveApprovalsByStatus = async (managerId: string, status: string): Promise<LeaveRequestRecord[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/approvals/optional/${managerId}?status=${encodeURIComponent(status)}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching leave approvals by status (optional):", error);
    throw new Error("Failed to load leave approvals.");
  }
};

export const updateLeaveApprovalStatus = async (
  requestId: string,
  managerId: string,
  status: "Approved" | "Rejected",
  modifiedBy: string,
  comments: string | null
): Promise<any> => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/${requestId}/approval`,
      { managerId, status, modifiedBy ,comments},
      { headers: getAuthHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating leave approval status:", error);
    throw new Error("Failed to process leave approval request.");
  }
};

export const getLeaveBalances = async (userId: string): Promise<ApiResponse<LeaveBalance[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/balances/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching leave balances:", error);
    return handleAxiosError(error, "Failed to fetch leave balances");
  }
};

export const getLeaveImpact = async (managerId: string,date:string): Promise<ApiResponse<LeaveBalance[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/leaveImpact/${managerId}?date=${date}`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching leave balances:", error);
    return handleAxiosError(error, "Failed to fetch leave balances");
  }
};



export const withdrawLeaveRequest = async (leaveId: string, userId: string): Promise<ApiResponse> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${leaveId}`, {
      headers: { ...getAuthHeaders(), userid: userId },
    });
    return response.data;
  } catch (error) {
    console.error("Error withdrawing leave request:", error);
    return handleAxiosError(error, "Failed to withdraw leave request");
  }
};



