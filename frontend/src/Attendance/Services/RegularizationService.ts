/**
 * Service for handling attendance regularization requests.
 */
import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/regularization`;

// =============================================
// Type Definitions
// =============================================

export interface RegularizationRecord {
  ID: string;
  UserID: string;
  UserName: string | null;
  IsCheckIn: boolean;              // true = Scenario 1: Late Check-In
  IsLeave: boolean;                // true = Scenario 2: Forgot Check-In & Check-Out
  RegularizeDate: string;          // DATE — the past date being regularized
  Reason: string | null;
  ActualStartTime: string | null;  // The time the user claims they started
  OriginalStartTime: string | null;// The user's configured shift start time (snapshotted)
  ManagerID: string | null;
  ManagerName: string | null;
  OptionalManagerID: string | null;
  ManagerApprovalStatus: "Pending" | "Approved" | "Rejected";
  IsActive: boolean;
  CreatedOn: string;
  ModifiedOn: string | null;
  CreatedBy: string;
  ModifiedBy: string | null;
  ActualEndTime: string | null;
  OriginalEndTime: string | null
}

export interface RegularizationPayload {
  userID: string;
  userName: string;
  isCheckIn: boolean;
  isLeave: boolean;
  regularizeDate: string;       // ISO date string: "YYYY-MM-DD"
  reason: string;
  actualStartTime: string;      // ISO datetime string
  actualEndTime:string | null
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

/**
 * Submit a new regularization request.
 */
export const submitRegularizationRequest = async (
  payload: RegularizationPayload
): Promise<ApiResponse<RegularizationRecord>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/request`, payload, {
      headers: getAuthHeaders(payload.userID),
    });
    return response.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to submit regularization request");
  }
};

/**
 * Fetch regularization history for a user.
 */
export const getRegularizationHistory = async (
  userId: string
): Promise<ApiResponse<RegularizationRecord[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/history/${userId}`, {
      headers: getAuthHeaders(userId),
    });
    return response.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch regularization history");
  }
};

/**
 * Fetch pending regularization requests for a manager.
 */
export const getPendingRegularizationRequests = async (
  managerId: string
): Promise<ApiResponse<RegularizationRecord[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/pending/${managerId}`, {
      headers: getAuthHeaders(managerId),
    });
    return response.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch pending regularization requests");
  }
};

/**
 * Fetch pending regularization requests for a optional manager.
 */
export const getOptionalPendingRegularizationRequests = async (
  managerId: string
): Promise<ApiResponse<RegularizationRecord[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/optional/pending/${managerId}`, {
      headers: getAuthHeaders(managerId),
    });
    return response.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch pending regularization requests");
  }
};

/**
 * Fetch regularization requests for a manager filtered by status.
 */
export const getRegularizationByStatus = async (
  managerId: string,
  status: string
): Promise<ApiResponse<RegularizationRecord[]>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/pending/${managerId}?status=${encodeURIComponent(status)}`,
      { headers: getAuthHeaders(managerId) }
    );
    return response.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch regularization requests by status");
  }
};

/**
 * Fetch regularization requests for an optional manager filtered by status.
 */
export const getOptionalRegularizationByStatus = async (
  managerId: string,
  status: string
): Promise<ApiResponse<RegularizationRecord[]>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/optional/pending/${managerId}?status=${encodeURIComponent(status)}`,
      { headers: getAuthHeaders(managerId) }
    );
    return response.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch regularization requests by status (optional)");
  }
};

/**
 * Approve or reject a regularization request (manager action).
 */
export const updateRegularizationStatus = async (
  id: string,
  managerApprovalStatus: "Approved" | "Rejected",
  modifiedBy: string,
  comment : string | null
): Promise<ApiResponse<RegularizationRecord>> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/approve/${id}`,
      { managerApprovalStatus, modifiedBy, comment},
      { headers: getAuthHeaders(modifiedBy) }
    );
    return response.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to update regularization status");
  }
};
