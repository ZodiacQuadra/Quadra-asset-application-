import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/asset/upgrade-requests`;

export type UpgradeManagerStatus = "Pending" | "Approved" | "Rejected" | "Re-Progress";
export type UpgradeAdminStatus = "Pending" | "Approved" | "Rejected" | "Re-Progress";
export type UpgradeReqStatus =
  | "Pending"
  | "ManagerRejected"
  | "ManagerReprogress"
  | "AdminApprovalPending"
  | "AdminReprogress"
  | "Completed"
  | "Rejected";

export type UpgradeReprogressStatus = "Pending" | "Responded";

export interface UpgradeManagerReprogressRecord {
  ID: string;
  RequestID: string;
  ReprogressedManagerID: string | null;
  ReprogressedManagerName: string | null;
  ReprogressedManagerMail: string | null;
  ReprogressedDate: string | null;
  ManagerReason: string | null;
  ReprogressStatus: UpgradeReprogressStatus;
  ReprogressSubmitBy: string | null;
  EmployeeResponse: string | null;
  CreatedAt: string;
}

export interface UpgradeAdminReprogressRecord {
  ID: string;
  RequestID: string;
  ReprogressedAdminID: string | null;
  ReprogressedAdminName: string | null;
  ReprogressedAdminMail: string | null;
  ReprogressedDate: string | null;
  AdminReason: string | null;
  ReprogressStatus: UpgradeReprogressStatus;
  ReprogressSubmitBy: string | null;
  EmployeeResponse: string | null;
  CreatedAt: string;
}

export interface AssetUpgradeRequestRecord {
  ID: string;
  RequestNumber: string | null;
  CategoryID: string;
  CategoryName: string;
  ComponentName: string; // FK id column name (see backend note) — display text is ComponentDisplayName
  ComponentDisplayName: string;
  CurrentSpecification: string;
  RequiredSpecfication: string;
  ReasonForUpgrade: string | null;

  RequestedByID: string;
  RequestedByName: string | null;
  RequestedByEmail: string | null;
  RequestedDate: string | null;

  ManagerID: string | null;
  ManagerName: string | null;
  ManagerEmail: string | null;
  ManagerApprovedDate: string | null;
  ManagerApprovalStatus: UpgradeManagerStatus;

  AssignedAdminID: string | null;
  AssignedAdminMailID: string | null;
  AssignedAdminName: string | null;

  ApprovedAdminID: string | null;
  ApprovedAdminName: string | null;
  ApprovedAdminEmail: string | null;
  ApprovedAdminDate: string | null;
  AdminApprovalStatus: UpgradeAdminStatus;
  IsAdminOverride: boolean;

  ReqStatus: UpgradeReqStatus;
  OverallStatus?: UpgradeReqStatus;
  CreatedAt: string;
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

export const createAssetUpgradeRequest = async (payload: {
  CategoryID: string;
  ComponentID: string;
  CurrentSpecification: string;
  RequiredSpecfication: string;
  ReasonForUpgrade?: string;
  requestedByUserId: string;
  AssetID: string;
}): Promise<{ ID: string; RequestNumber: string }> => {
  try {
    const response = await axios.post<ApiResponse<{ ID: string; RequestNumber: string }>>(API_BASE_URL, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data as { ID: string; RequestNumber: string };
  } catch (error) {
    return handleAxiosError(error, "Failed to submit upgrade request");
  }
};

export const getAssetUpgradeRequests = async (params: {
  userId?: string;
  managerId?: string;
  adminId?: string;
}): Promise<AssetUpgradeRequestRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetUpgradeRequestRecord[]>>(API_BASE_URL, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch upgrade requests");
  }
};

export const getAssetUpgradeRequestById = async (id: string): Promise<AssetUpgradeRequestRecord> => {
  try {
    const response = await axios.get<ApiResponse<AssetUpgradeRequestRecord>>(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as AssetUpgradeRequestRecord;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch upgrade request");
  }
};

export const managerActionOnUpgradeRequest = async (
  id: string,
  action: "Approve" | "Reject",
  actedByUserId: string,
  actedByName?: string,
  actedByMail?: string
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/${id}/manager-action`,
      { action, actedByUserId, actedByName, actedByMail },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    handleAxiosError(error, "Failed to record manager decision");
  }
};

export const adminActionOnUpgradeRequest = async (
  id: string,
  action: "Approve" | "Reject",
  actedByUserId: string,
  actedByName?: string,
  actedByMail?: string,
  isOverride?: boolean
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/${id}/admin-action`,
      { action, actedByUserId, actedByName, actedByMail, isOverride },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    handleAxiosError(error, "Failed to record admin decision");
  }
};

export const managerReprogressUpgradeRequest = async (
  id: string,
  reason: string,
  actedByUserId: string,
  actedByName?: string,
  actedByMail?: string
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/${id}/manager-reprogress`,
      { reason, actedByUserId, actedByName, actedByMail },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    handleAxiosError(error, "Failed to send request back for re-progress");
  }
};

export const adminReprogressUpgradeRequest = async (
  id: string,
  reason: string,
  actedByUserId: string,
  actedByName?: string,
  actedByMail?: string
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/${id}/admin-reprogress`,
      { reason, actedByUserId, actedByName, actedByMail },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    handleAxiosError(error, "Failed to send request back for re-progress");
  }
};

export const respondToUpgradeReprogress = async (
  reprogressId: string,
  respondedByUserId: string,
  payload: { EmployeeResponse?: string; RequiredSpecfication?: string; ReasonForUpgrade?: string }
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/reprogress/${reprogressId}/respond`,
      { ...payload, respondedByUserId },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    handleAxiosError(error, "Failed to submit response");
  }
};

export const respondToUpgradeAdminReprogress = async (
  reprogressId: string,
  respondedByUserId: string,
  payload: { EmployeeResponse?: string; RequiredSpecfication?: string; ReasonForUpgrade?: string }
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/admin-reprogress/${reprogressId}/respond`,
      { ...payload, respondedByUserId },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    handleAxiosError(error, "Failed to submit response");
  }
};

export const getUpgradeReprogressHistory = async (id: string): Promise<UpgradeManagerReprogressRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<UpgradeManagerReprogressRecord[]>>(`${API_BASE_URL}/${id}/reprogress`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch re-progress history");
  }
};

export const getUpgradeAdminReprogressHistory = async (id: string): Promise<UpgradeAdminReprogressRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<UpgradeAdminReprogressRecord[]>>(`${API_BASE_URL}/${id}/admin-reprogress`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch re-progress history");
  }
};
