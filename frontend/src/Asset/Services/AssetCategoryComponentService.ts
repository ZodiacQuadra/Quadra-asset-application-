import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/asset/masters/category-components`;

export interface AssetCategoryComponentRecord {
  ID: string;
  CategoryID: string;
  CategoryName: string;
  ComponentName: string;
  ComponentID?: string;
  DefaultSpec?: string | null;
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

export const getAssetCategoryComponents = async (categoryId?: string): Promise<AssetCategoryComponentRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetCategoryComponentRecord[]>>(API_BASE_URL, {
      headers: getAuthHeaders(),
      params: categoryId ? { categoryId } : undefined,
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch category components");
  }
};

// categoryIds can be one or many — the same component name is created as a
// separate row per category (existing categories with a matching name are
// silently skipped, so re-submitting an overlapping selection is safe).
export const createAssetCategoryComponent = async (
  categoryIds: string[],
  componentName: string,
  createdByUserId: string
): Promise<AssetCategoryComponentRecord[]> => {
  try {
    const response = await axios.post<ApiResponse<AssetCategoryComponentRecord[]>>(
      API_BASE_URL,
      { CategoryIDs: categoryIds, ComponentName: componentName, createdByUserId },
      { headers: getAuthHeaders() }
    );
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to create component");
  }
};

export const updateAssetCategoryComponent = async (
  id: string,
  categoryId: string,
  componentName: string,
  updatedByUserId: string
): Promise<AssetCategoryComponentRecord> => {
  try {
    const response = await axios.put<ApiResponse<AssetCategoryComponentRecord>>(
      `${API_BASE_URL}/${id}`,
      { CategoryID: categoryId, ComponentName: componentName, updatedByUserId },
      { headers: getAuthHeaders() }
    );
    return response.data.data as AssetCategoryComponentRecord;
  } catch (error) {
    return handleAxiosError(error, "Failed to update component");
  }
};

export const deleteAssetCategoryComponent = async (id: string, updatedByUserId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders(),
      data: { updatedByUserId },
    });
  } catch (error) {
    handleAxiosError(error, "Failed to delete component");
  }
};
