import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/asset/role-templates`;

export interface AssetRoleTemplateRecord {
  ID: string;
  RoleName: string;
  Description: string | null;
  CreatedAt: string;
  CreatedBy: string | null;
  ModifiedAt: string | null;
  ModifiedBy: string | null;
  CategoryCount: number;
  AssignedEmployeeCount: number;
}

export interface AssetRoleTemplateItem {
  ID: string;
  CategoryID: string;
  CategoryName: string;
  Quantity: number;
}

export interface AssetRoleTemplateDetail {
  template: Omit<AssetRoleTemplateRecord, "CategoryCount" | "AssignedEmployeeCount">;
  items: AssetRoleTemplateItem[];
}

export interface AssetRoleCategoryUsageItem {
  CategoryID: string;
  CategoryName: string;
  RoleQuantity: number;
  HeldCount: number;
  PendingCount: number;
  Remaining: number;
}

export interface AssetRoleCategoryUsage {
  roleTemplateId: string | null;
  roleName: string | null;
  items: AssetRoleCategoryUsageItem[];
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

export const getAssetRoleTemplates = async (): Promise<AssetRoleTemplateRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetRoleTemplateRecord[]>>(API_BASE_URL, { headers: getAuthHeaders() });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch asset roles");
  }
};

export const getAssetRoleTemplateDetail = async (id: string): Promise<AssetRoleTemplateDetail> => {
  try {
    const response = await axios.get<ApiResponse<AssetRoleTemplateDetail>>(`${API_BASE_URL}/${id}`, { headers: getAuthHeaders() });
    return response.data.data as AssetRoleTemplateDetail;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch role details");
  }
};

export const createAssetRoleTemplate = async (payload: {
  roleName: string;
  description?: string;
  items: { CategoryID: string; Quantity: number }[];
  createdBy: string;
}): Promise<{ ID: string }> => {
  try {
    const response = await axios.post<ApiResponse<{ ID: string }>>(API_BASE_URL, payload, { headers: getAuthHeaders() });
    return response.data.data as { ID: string };
  } catch (error) {
    return handleAxiosError(error, "Failed to create role");
  }
};

export const updateAssetRoleTemplate = async (
  id: string,
  payload: { roleName: string; description?: string; items: { CategoryID: string; Quantity: number }[]; modifiedBy: string }
): Promise<void> => {
  try {
    await axios.put(`${API_BASE_URL}/${id}`, payload, { headers: getAuthHeaders() });
  } catch (error) {
    handleAxiosError(error, "Failed to update role");
  }
};

export const deleteAssetRoleTemplate = async (id: string, modifiedBy: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/${id}`, { headers: getAuthHeaders(), data: { modifiedBy } });
  } catch (error) {
    handleAxiosError(error, "Failed to delete role");
  }
};

export const assignAssetRole = async (payload: {
  userId: string;
  roleTemplateId: string | null;
  assignedByUserId: string;
}): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/assign`, payload, { headers: getAuthHeaders() });
  } catch (error) {
    handleAxiosError(error, "Failed to assign role");
  }
};

export const bulkAssignAssetRole = async (payload: {
  userIds: string[];
  roleTemplateId: string | null;
  assignedByUserId: string;
}): Promise<{ updatedCount: number }> => {
  try {
    const response = await axios.post<ApiResponse<{ updatedCount: number }>>(`${API_BASE_URL}/bulk-assign`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data as { updatedCount: number };
  } catch (error) {
    return handleAxiosError(error, "Failed to bulk-assign role");
  }
};

export const getAssetRoleCategoryUsage = async (userId: string): Promise<AssetRoleCategoryUsage> => {
  try {
    const response = await axios.get<ApiResponse<AssetRoleCategoryUsage>>(`${API_BASE_URL}/category-usage/${userId}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as AssetRoleCategoryUsage;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch role usage");
  }
};

// Role Mismatch — assets an employee still holds that their CURRENT role no
// longer covers (category removed from the role, quantity reduced below what
// they hold, or their role reassigned/cleared). Computed live server-side.
export interface AssetRoleMismatchGroup {
  RoleTemplateID: string | null;
  RoleName: string | null;
  CategoryName: string;
  AffectedEmployeeCount: number;
  ExcessUnitCount: number;
}

export interface AssetRoleMismatchDetailRow {
  MappingID: string;
  AssetID: string;
  AssetName: string;
  AssetTagID: string;
  CategoryName: string;
  UserID: string;
  DisplayName: string;
  Mail: string;
  AssignedAt: string;
  IsExcess: boolean;
}

export interface AssetRoleMismatchForUser {
  CategoryName: string;
  HeldCount: number;
  EntitledQuantity: number;
}

export const getAssetRoleMismatchSummary = async (): Promise<AssetRoleMismatchGroup[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetRoleMismatchGroup[]>>(`${API_BASE_URL}/mismatches`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch role mismatches");
  }
};

// categoryName omitted (or null) returns every category for this role/
// no-role bucket in one call — used for the consolidated "No Role" view so
// it doesn't need one call per category.
export const getAssetRoleMismatchDetails = async (
  roleTemplateId: string | null,
  categoryName?: string | null
): Promise<AssetRoleMismatchDetailRow[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetRoleMismatchDetailRow[]>>(`${API_BASE_URL}/mismatches/details`, {
      headers: getAuthHeaders(),
      params: { roleTemplateId: roleTemplateId || undefined, categoryName: categoryName || undefined },
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch mismatch details");
  }
};

export const bulkReturnMismatchedAssets = async (payload: {
  roleTemplateId: string | null;
  categoryName?: string | null;
  performedByUserId: string;
}): Promise<{ returnedCount: number }> => {
  try {
    const response = await axios.post<ApiResponse<{ returnedCount: number }>>(`${API_BASE_URL}/mismatches/return-all`, payload, {
      headers: getAuthHeaders(),
    });
    return response.data.data as { returnedCount: number };
  } catch (error) {
    return handleAxiosError(error, "Failed to return mismatched assets");
  }
};

export const getAssetRoleMismatchesForUser = async (userId: string): Promise<AssetRoleMismatchForUser[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetRoleMismatchForUser[]>>(`${API_BASE_URL}/mismatches/user/${userId}`, {
      headers: getAuthHeaders(),
      timeout: 2500,
    });
    return response.data.data ?? [];
  } catch (error) {
    return [];
  }
};
