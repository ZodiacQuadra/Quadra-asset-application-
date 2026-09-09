import axios, { AxiosError } from "axios";
import { ApiResponse } from "./UserAssignments"; // Assuming ApiResponse is here

export interface AssetSLAConfigItem {
  ID: string;
  RequestTypeName: string;
  ManagerApproval: boolean;
  AdminApproval: boolean;
  ManagerApprovalDays: number;
  AdminApprovalDays: number;
  IsActive: boolean;
  CreatedBy: string;
  CreatedAt: string;
  ModifiedBy: string | null;
  ModifiedAt: string | null;
}

export interface CreateAssetSLAConfigPayload {
  RequestTypeName: string;
  ManagerApproval: boolean;
  AdminApproval: boolean;
  ManagerApprovalDays: number;
  AdminApprovalDays: number;
  CreatedBy: string;
}

export interface UpdateAssetSLAConfigPayload {
  ID: string;
  ManagerApprovalDays?: number;
  AdminApprovalDays?: number;
  ManagerApproval?: boolean;
  AdminApproval?: boolean;
  IsActive?: boolean;
  ModifiedBy: string;
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/asset/sla-configuration`;

const handleAxiosError = (error: unknown, defaultMessage: string): ApiResponse<any> => {
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

export const GetAssetSLAConfigurations = async (
  accessToken: string
): Promise<ApiResponse<AssetSLAConfigItem[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    throw handleAxiosError(error, "Failed to fetch Asset SLA configurations");
  }
};

export const CreateAssetSLAConfiguration = async (
  payload: CreateAssetSLAConfigPayload,
  accessToken: string
): Promise<ApiResponse<AssetSLAConfigItem>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  } catch (error) {
    throw handleAxiosError(error, "Failed to create Asset SLA configuration");
  }
};

export const UpdateAssetSLAConfiguration = async (
  payload: UpdateAssetSLAConfigPayload,
  accessToken: string
): Promise<ApiResponse<AssetSLAConfigItem>> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/${payload.ID}`,
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return response.data;
  } catch (error) {
    throw handleAxiosError(error, "Failed to update Asset SLA configuration");
  }
};
