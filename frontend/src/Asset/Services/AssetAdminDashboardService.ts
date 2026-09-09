import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/asset/admin-dashboard`;

export type AdminActivityType = "Assigned" | "Approved" | "Rejected" | "Reprogress" | "Requested" | "Added" | "Updated";

export interface AdminActivityRecord {
  ActivityType: AdminActivityType;
  Description: string;
  OccurredAt: string;
  ReferenceID?: string;
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

export const getAdminRecentActivities = async (adminId: string, top: number = 5): Promise<AdminActivityRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AdminActivityRecord[]>>(`${API_BASE_URL}/recent-activities`, {
      headers: getAuthHeaders(),
      params: { adminId, top },
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch recent activities");
  }
};
