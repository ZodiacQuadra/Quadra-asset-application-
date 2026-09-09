import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/asset/masters/non-it-fields`;

export type NonITFieldType = "Text" | "Number" | "Date";

export interface NonITCategoryFieldRecord {
  ID: string;
  CategoryID: string;
  CategoryName: string;
  FieldName: string;
  FieldType: NonITFieldType;
  CreatedAt?: string;
  CreatedBy?: string | null;
  ModifiedAt?: string | null;
  ModifiedBy?: string | null;
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

export const getNonITCategoryFields = async (categoryId?: string): Promise<NonITCategoryFieldRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<NonITCategoryFieldRecord[]>>(API_BASE_URL, {
      headers: getAuthHeaders(),
      params: categoryId ? { categoryId } : undefined,
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch Non-IT fields");
  }
};

// categoryIds can be one or many — the same field name is created as a
// separate row per category (existing categories with a matching name are
// silently skipped, so re-submitting an overlapping selection is safe).
export const createNonITCategoryField = async (
  categoryIds: string[],
  fieldName: string,
  fieldType: NonITFieldType,
  createdByUserId: string
): Promise<NonITCategoryFieldRecord[]> => {
  try {
    const response = await axios.post<ApiResponse<NonITCategoryFieldRecord[]>>(
      API_BASE_URL,
      { CategoryIDs: categoryIds, FieldName: fieldName, FieldType: fieldType, createdByUserId },
      { headers: getAuthHeaders() }
    );
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to create field");
  }
};

export const updateNonITCategoryField = async (
  id: string,
  categoryId: string,
  fieldName: string,
  fieldType: NonITFieldType,
  updatedByUserId: string
): Promise<NonITCategoryFieldRecord> => {
  try {
    const response = await axios.put<ApiResponse<NonITCategoryFieldRecord>>(
      `${API_BASE_URL}/${id}`,
      { CategoryID: categoryId, FieldName: fieldName, FieldType: fieldType, updatedByUserId },
      { headers: getAuthHeaders() }
    );
    return response.data.data as NonITCategoryFieldRecord;
  } catch (error) {
    return handleAxiosError(error, "Failed to update field");
  }
};

export const deleteNonITCategoryField = async (id: string, updatedByUserId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders(),
      data: { updatedByUserId },
    });
  } catch (error) {
    handleAxiosError(error, "Failed to delete field");
  }
};
