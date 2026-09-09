import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";
import { AssetFileRef } from "./AssetInventoryService";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/asset/repair-requests`;

export type RepairRequestStatus = "Pending" | "Approved" | "Rejected" | "Unrepairable" | "Re-Progress";
export type RepairReprogressStatus = "Pending" | "Responded";

export interface RepairAdminReprogressRecord {
  ID: string;
  RequestID: string;
  ReprogressedAdminID: string | null;
  ReprogressedAdminName: string | null;
  ReprogressedAdminMail: string | null;
  ReprogressedDate: string | null;
  AdminReason: string | null;
  ReprogressStatus: RepairReprogressStatus;
  ReprogressSubmitBy: string | null;
  EmployeeResponse: string | null;
  CreatedAt: string;
}

export interface AssetRepairRequestRecord {
  ID: string;
  RequestNumber: string | null;
  AssetID: string;
  AssetName: string;
  AssetTagID: string;

  IssueType: string;
  ProblemCategory: string;
  Problem: string;
  AttachmentURL: AssetFileRef[];

  RequestedByID: string;
  RequestedByName: string | null;
  RequestedByEmail: string | null;

  AssignedAdminID: string | null;
  AssignedAdminEmail: string | null;
  AssignedAdminName: string | null;

  RequestStatus: RepairRequestStatus;
  AdminRejectionReason: string | null;

  ApprovedAdminID: string | null;
  ApprovedAdminEmail: string | null;
  ApprovedAdminName: string | null;
  ApprovedDate: string | null;

  ReplacementRequestID: string | null;
  ReplacementRequestNumber: string | null;

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

const getMultipartAuthHeaders = () => {
  const token = getStoredAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": undefined,
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

export const createAssetRepairRequest = async (payload: {
  AssetID: string;
  IssueType: string;
  ProblemCategory: string;
  Problem: string;
  requestedByUserId: string;
}): Promise<{ ID: string; RequestNumber: string }> => {
  try {
    const response = await axios.post<ApiResponse<{ ID: string; RequestNumber: string }>>(API_BASE_URL, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data as { ID: string; RequestNumber: string };
  } catch (error) {
    return handleAxiosError(error, "Failed to submit repair request");
  }
};

export const getAssetRepairRequests = async (params: {
  userId?: string;
  adminId?: string;
}): Promise<AssetRepairRequestRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetRepairRequestRecord[]>>(API_BASE_URL, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch repair requests");
  }
};

export const adminActionOnRepairRequest = async (
  id: string,
  action: "Approve" | "Reject" | "Unrepairable",
  actedByUserId: string,
  actedByName?: string,
  actedByMail?: string,
  reason?: string
): Promise<{ replacementRequestId: string; replacementRequestNumber: string } | undefined> => {
  try {
    const response = await axios.post<ApiResponse<{ replacementRequestId: string; replacementRequestNumber: string }>>(
      `${API_BASE_URL}/${id}/admin-action`,
      { action, actedByUserId, actedByName, actedByMail, reason },
      { headers: getAuthHeaders() }
    );
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to record admin decision");
  }
};

export const adminReprogressRepairRequest = async (
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

export const respondToRepairReprogress = async (
  reprogressId: string,
  respondedByUserId: string,
  payload: { EmployeeResponse?: string; Problem?: string }
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

export const getRepairReprogressHistory = async (id: string): Promise<RepairAdminReprogressRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<RepairAdminReprogressRecord[]>>(`${API_BASE_URL}/${id}/reprogress`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch re-progress history");
  }
};

export const uploadRepairRequestAttachments = async (id: string, files: File[]): Promise<AssetFileRef[]> => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file, file.name));
    const response = await axios.post<ApiResponse<AssetFileRef[]>>(`${API_BASE_URL}/${id}/attachments`, formData, {
      headers: getMultipartAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to upload attachments");
  }
};
