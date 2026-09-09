// services/permissionApi.ts
import axios from "axios";
import { getStoredAuthToken } from "../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/permissions`;

export interface SubAction {
  id: string;
  name: string;
  checked: boolean;
  permissionKey?: string;
}

export interface Action {
  id: string;
  name: string;
  description?: string;
  checked: boolean;
  expanded: boolean;
  subActions?: SubAction[];
  permissionKey?: string;
}

export interface Entity {
  id: string;
  name: string;
  description: string;
  checked: boolean;
  expanded: boolean;
  hasActions: boolean;
  actions?: Action[];
  subActions?: SubAction[]; // For entities with direct sub-actions
  permissionKey?: string; // For standalone entities
}

export interface Module {
  id: string;
  name: string;
  description: string;
  checked: boolean;
  expanded: boolean;
  entities: Entity[];
}

export interface Role {
  roleId: number;
  name: string;
  description: string;
  isAdmin: boolean;
  isPredefined: boolean;
  permissionCount?: number;
  modules?: Module[];
  createdAt: string;
  modifiedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

const getAuthHeaders = () => {
  const token = getStoredAuthToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  };
};

export const getPermissionStructure = async (): Promise<
  ApiResponse<Module[]>
> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/permissions/structure`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching permission structure:", error);
    throw error;
  }
};

export const getRoles = async (): Promise<ApiResponse<Role[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/roles`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

export const getRole = async (roleId: number): Promise<ApiResponse<Role>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/roles/${roleId}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching role ${roleId}:`, error);
    throw error;
  }
};

export const createRole = async (roleData: {
  name: string;
  description?: string;
  isAdmin?: boolean;
  modules?: Module[];
  createdBy: string;
}): Promise<ApiResponse<{ roleId: number }>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/roles`,
      roleData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

export const updateRole = async (
  roleId: number,
  roleData: {
    name: string;
    description?: string;
    isAdmin?: boolean;
    modules?: Module[];
    modifiedBy: string;
  }
): Promise<ApiResponse<{ roleId: number }>> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/roles/${roleId}`,
      roleData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating role ${roleId}:`, error);
    throw error;
  }
};

export const deleteRole = async (
  roleId: number,
  deletedBy: string
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/roles/${roleId}`, {
      ...getAuthHeaders(),
      data: { deletedBy },
    });
    return response.data;
  } catch (error) {
    console.error(`Error deleting role ${roleId}:`, error);
    throw error;
  }
};
