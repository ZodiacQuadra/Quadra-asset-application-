import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/asset/lost-requests`;

export type LostRequestStatus = "Pending" | "InProgress" | "Completed";
export type LostRequestItemStatus = "PendingManagerApproval" | "Pending" | "Rejected" | "AwaitingReplacement" | "Replaced";
export type LostRequestReportedByRole = "Employee" | "Manager" | "Admin";
export type LostRequestManagerApprovalStatus = "Pending" | "Approved" | "Rejected";

export interface AssetLostRequestRecord {
  ID: string;
  RequestNumber: string | null;

  EmployeeUserID: string;
  EmployeeName: string | null;
  EmployeeMail: string | null;

  ReportedByUserID: string;
  ReportedByName: string | null;
  ReportedByMail: string | null;
  ReportedByRole: LostRequestReportedByRole;

  LostDate: string;
  HowLost: string;
  AdditionalDetails: string | null;

  AssignedAdminID: string | null;
  AssignedAdminName: string | null;
  AssignedAdminMail: string | null;

  ManagerID: string | null;
  ManagerName: string | null;
  ManagerMail: string | null;
  ManagerApprovalStatus: LostRequestManagerApprovalStatus | null;
  ManagerActionReason: string | null;

  RequestStatus: LostRequestStatus;
  ItemCount: number;
  PendingItemCount: number;

  CreatedAt: string;
}

export interface AssetLostRequestItemRecord {
  ID: string;
  LostRequestID: string;
  AssetID: string;
  AssetName: string;
  AssetTagID: string;
  Category: string | null;

  ItemStatus: LostRequestItemStatus;
  RejectionReason: string | null;
  ReplacementAssetID: string | null;
  ReplacementAssetName: string | null;
  ReplacementAssetTagID: string | null;
  IsAdminOverride: boolean;

  ActionedByUserID: string | null;
  ActionedByName: string | null;
  ActionedAt: string | null;

  CreatedAt: string;
}

export interface PendingLostItemRecord {
  ItemID: string;
  AssetID: string;
  Category: string | null;
  ItemStatus: LostRequestItemStatus;
  RequestNumber: string | null;
  LostDate: string;
}

interface ApiResponse<T> {
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

const handleAxiosError = (error: unknown, defaultMessage: string): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const message = axiosError.response?.data?.message || axiosError.message || defaultMessage;
    throw new Error(message);
  }
  throw error instanceof Error ? error : new Error(defaultMessage);
};

export const createAssetLostRequest = async (payload: {
  employeeUserId: string;
  reportedByUserId: string;
  reportedByRole: LostRequestReportedByRole;
  lostDate: string;
  howLost: string;
  additionalDetails?: string;
  items: { assetId: string; replacementAssetId?: string | null }[];
}): Promise<{ ID: string; RequestNumber: string }> => {
  try {
    const response = await axios.post<ApiResponse<{ ID: string; RequestNumber: string }>>(API_BASE_URL, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data as { ID: string; RequestNumber: string };
  } catch (error) {
    return handleAxiosError(error, "Failed to submit lost asset request");
  }
};

export const getAssetLostRequests = async (params: {
  employeeId?: string;
  reportedByUserId?: string;
  adminId?: string;
  managerId?: string;
}): Promise<AssetLostRequestRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetLostRequestRecord[]>>(API_BASE_URL, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch lost asset requests");
  }
};

export const getAssetLostRequestById = async (
  id: string
): Promise<{ request: AssetLostRequestRecord; items: AssetLostRequestItemRecord[] }> => {
  try {
    const response = await axios.get<ApiResponse<{ request: AssetLostRequestRecord; items: AssetLostRequestItemRecord[] }>>(
      `${API_BASE_URL}/${id}`,
      { headers: getAuthHeaders() }
    );
    return response.data.data as { request: AssetLostRequestRecord; items: AssetLostRequestItemRecord[] };
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch lost asset request");
  }
};

export const getPendingLostItemsForUser = async (userId: string): Promise<PendingLostItemRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<PendingLostItemRecord[]>>(`${API_BASE_URL}/lookup/pending/${userId}`, {
      headers: getAuthHeaders(),
      timeout: 2500,
    });
    return response.data.data ?? [];
  } catch (error) {
    return [];
  }
};

export const adminActionOnLostRequestItem = async (
  itemId: string,
  action: "Approve" | "Reject",
  actedByUserId: string,
  actedByName?: string,
  replacementAssetId?: string | null,
  reason?: string,
  isOverride?: boolean
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/items/${itemId}/admin-action`,
      { action, replacementAssetId, reason, actedByUserId, actedByName, isOverride },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    handleAxiosError(error, "Failed to record admin decision");
  }
};

export const managerActionOnLostRequest = async (
  requestId: string,
  action: "Approve" | "Reject",
  actedByUserId: string,
  actedByName?: string,
  reason?: string
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/${requestId}/manager-action`,
      { action, reason, actedByUserId, actedByName },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    handleAxiosError(error, "Failed to record manager decision");
  }
};

export const assignReplacementForLostItem = async (
  itemId: string,
  replacementAssetId: string,
  actedByUserId: string,
  actedByName?: string
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/items/${itemId}/assign-replacement`,
      { replacementAssetId, actedByUserId, actedByName },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    handleAxiosError(error, "Failed to assign replacement");
  }
};
