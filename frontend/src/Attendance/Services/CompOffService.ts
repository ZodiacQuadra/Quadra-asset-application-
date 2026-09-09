/**
 * Service for handling Comp-off requests.
 */
import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/compoff`;

// =============================================
// Type Definitions
// =============================================

export interface CompOffRequest {
  CompOffRequestId: string;
  AttendanceId: string;
  WorkedDate: string | null;   // Date of the weekend/overtime work
  Reason: string | null;
  Status: "Pending" | "Approved" | "Rejected" | "Consumed";
  CreatedBy: string;               // EntraObjectId of the employee
  EmployeeName: string;
  EmployeeJobTitle: string | null;
  ManagerID: string | null;
  Comments: string | null;
  CreatedAt: string;
  ModifiedOn: string | null;
  IsConsumed: boolean | null;
  ManagerApprovalStatus: any;
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
  if (userId) headers.userid = userId;
  return headers;
};

const handleAxiosError = (error: unknown, defaultMessage: string): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const message =
      axiosError.response?.data?.message || axiosError.message || defaultMessage;
    throw new Error(message);
  }
  throw error instanceof Error ? error : new Error(defaultMessage);
};

// =============================================
// Service Methods
// =============================================



export const getUserCompOffRequests = async (
  managerId: string
): Promise<CompOffRequest[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}`, {
      headers: getAuthHeaders(managerId),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch comp-off requests");
  }
};

/**
 * Fetch pending comp-off requests for a direct manager.
 */
export const getManagerCompOffRequests = async (
  managerId: string
): Promise<CompOffRequest[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/manager`, {
      headers: getAuthHeaders(managerId),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch comp-off requests");
  }
};

/**
 * Fetch pending comp-off requests for an indirect / optional manager.
 */
export const getOptionalManagerCompOffRequests = async (
  managerId: string
): Promise<CompOffRequest[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/optional/manager`, {
      headers: getAuthHeaders(managerId),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch indirect comp-off requests");
  }
};

/**
 * Approve or reject a comp-off request (manager action).
 */
export const updateCompOffRequestStatus = async (
  id: string,
  managerId: string,
  action: "Approve" | "Reject",
  comments: string | null
): Promise<void> => {
  try {
    await axios.patch(
      `${API_BASE_URL}/${id}/status`,
      { action, comments },
      { headers: getAuthHeaders(managerId) }
    );
  } catch (error) {
    return handleAxiosError(error, "Failed to update comp-off request status");
  }
};
