import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/asset/masters`;

export interface RepairMasterRecord {
  ID: string;
  Name: string;
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

// Shared implementation for both Issue Type and Problem Category — same
// plain Name-only master data shape, just a different endpoint path.
const buildMasterService = (path: string, label: string) => ({
  list: async (): Promise<RepairMasterRecord[]> => {
    try {
      const response = await axios.get<ApiResponse<RepairMasterRecord[]>>(`${BASE_URL}/${path}`, {
        headers: getAuthHeaders(),
      });
      return response.data.data ?? [];
    } catch (error) {
      return handleAxiosError(error, `Failed to fetch ${label}`);
    }
  },
  create: async (name: string, createdByUserId: string): Promise<RepairMasterRecord> => {
    try {
      const response = await axios.post<ApiResponse<RepairMasterRecord>>(
        `${BASE_URL}/${path}`,
        { Name: name, createdByUserId },
        { headers: getAuthHeaders() }
      );
      if (!response.data.data) throw new Error(`Failed to create ${label}`);
      return response.data.data;
    } catch (error) {
      return handleAxiosError(error, `Failed to create ${label}`);
    }
  },
  update: async (id: string, name: string, updatedByUserId: string): Promise<RepairMasterRecord> => {
    try {
      const response = await axios.put<ApiResponse<RepairMasterRecord>>(
        `${BASE_URL}/${path}/${id}`,
        { Name: name, updatedByUserId },
        { headers: getAuthHeaders() }
      );
      if (!response.data.data) throw new Error(`Failed to update ${label}`);
      return response.data.data;
    } catch (error) {
      return handleAxiosError(error, `Failed to update ${label}`);
    }
  },
  remove: async (id: string, updatedByUserId: string): Promise<void> => {
    try {
      await axios.delete(`${BASE_URL}/${path}/${id}`, {
        headers: getAuthHeaders(),
        data: { updatedByUserId },
      });
    } catch (error) {
      handleAxiosError(error, `Failed to delete ${label}`);
    }
  },
});

export const RepairIssueTypeService = buildMasterService("repair-issue-types", "issue type");
export const RepairProblemCategoryService = buildMasterService("repair-problem-categories", "problem category");
