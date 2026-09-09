import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/asset/handover-requests`;

export type HandoverRequestStatus = "Pending" | "InProgress" | "Completed";
export type HandoverItemStatus = "Pending" | "Good condition" | "Damaged" | "Not Applicable" | "Removed" | "Collected";

export const HANDOVER_ITEM_STATUS_OPTIONS: Exclude<HandoverItemStatus, "Pending">[] = [
  "Good condition",
  "Damaged",
  "Not Applicable",
  "Removed",
  "Collected",
];

export const HANDOVER_REASON_OPTIONS = ["Resignation", "Role Change", "Other"];

export interface AssetHandoverRequestRecord {
  ID: string;
  HandoverRequestID: string;
  RequestedUserID: string;
  RequestedUserName: string | null;
  RequestedUserMailID: string | null;
  Reason: string;
  AdditionalNotes: string | null;
  Status: HandoverRequestStatus;
  AssignedAdminID: string | null;
  AssignedAdminName: string | null;
  AssignedAdminMailID: string | null;
  ExitID: string | null;
  CreatedAt: string;
  CreatedBy: string | null;
  ModifiedAt: string | null;
  ModifiedBy: string | null;
  ItemCount?: number;
  ActionedItemCount?: number;
}

export interface AssetHandoverRequestItem {
  ID: string;
  HandoverRequestID: string;
  AssetID: string;
  AssetName: string | null;
  AssetTagID: string | null;
  Status: HandoverItemStatus;
  Remarks: string | null;
  ActionedByUserID: string | null;
  ActionedAt: string | null;
  CreatedAt: string;
}

export interface AssetHandoverRequestDetail {
  request: AssetHandoverRequestRecord;
  items: AssetHandoverRequestItem[];
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

export const getAssetHandoverRequests = async (adminId?: string): Promise<AssetHandoverRequestRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetHandoverRequestRecord[]>>(API_BASE_URL, {
      headers: getAuthHeaders(),
      params: adminId ? { adminId } : undefined,
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch handover requests");
  }
};

export const getAssetHandoverRequestDetail = async (id: string): Promise<AssetHandoverRequestDetail> => {
  try {
    const response = await axios.get<ApiResponse<AssetHandoverRequestDetail>>(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as AssetHandoverRequestDetail;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch handover request details");
  }
};

export const getAssetHandoverRequestByExit = async (exitId: string): Promise<AssetHandoverRequestDetail | null> => {
  try {
    const response = await axios.get<ApiResponse<AssetHandoverRequestDetail | null>>(`${API_BASE_URL}/by-exit/${exitId}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? null;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch linked handover request");
  }
};

export const createAssetHandoverRequest = async (payload: {
  requestedByUserId: string;
  requestedByName?: string;
  requestedByMail?: string;
  reason: string;
  additionalNotes?: string;
  assetIds: string[];
}): Promise<{ ID: string; HandoverRequestID: string; ExitID: string | null }> => {
  try {
    const response = await axios.post<ApiResponse<{ ID: string; HandoverRequestID: string; ExitID: string | null }>>(
      API_BASE_URL,
      payload,
      { headers: getAuthHeaders() }
    );
    return response.data.data as { ID: string; HandoverRequestID: string; ExitID: string | null };
  } catch (error) {
    return handleAxiosError(error, "Failed to submit handover request");
  }
};

export const updateAssetHandoverRequestItem = async (
  itemId: string,
  payload: { status: Exclude<HandoverItemStatus, "Pending">; remarks?: string; actionedByUserId: string }
): Promise<{ request: AssetHandoverRequestRecord }> => {
  try {
    const response = await axios.put<ApiResponse<{ request: AssetHandoverRequestRecord }>>(
      `${API_BASE_URL}/items/${itemId}`,
      payload,
      { headers: getAuthHeaders() }
    );
    return response.data.data as { request: AssetHandoverRequestRecord };
  } catch (error) {
    return handleAxiosError(error, "Failed to update handover item");
  }
};
