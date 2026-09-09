// services/userRoleApi.ts
import axios from "axios";
import { getStoredAuthToken } from "../Auth/tokenStorage";
import { SelectedUserDepartments, UserDepartmentResponse } from "../Management/Pages/UserRoleManagement";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/User`;

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
  subActions?: SubAction[];
  permissionKey?: string;
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
  permissionCount?: number;
  createdAt?: string;
}

export interface RoleWithPermissions {
  roleId: number;
  roleName: string;
  roleDescription: string;
  isAdmin: boolean;
  modules: Module[];
}

export interface UserRole {
  userRoleId: number;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  roleId: number;
  roleName: string;
  roleDescription?: string;
  isAdmin: boolean;
  isCustomRole: boolean;
  baseRoleId?: number;
  assignedBy: string;
  assignedByName: string;
  assignedAt: string;
  modifiedBy?: string;
  modifiedByName?: string;
  modifiedAt?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface ReassignRoleRequest {
  userRoleId: number;
  newRoleId: number;
  reassignedBy: string;
  isCustomRole?: boolean;
  customPermissions?: Module[];
  customRoleName?: string;
  isDepartmentRestricted:boolean;
  restrictedDepartments:SelectedUserDepartments[]
}

export interface ConvertToBaseRoleRequest {
  userRoleId: number;
  newRoleId: number;
  updatedBy: string;
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

// Get all available roles
export const getRoles = async (): Promise<ApiResponse<Role[]>> => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/permissions/roles`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching roles:", error);
    throw error;
  }
};

// Get role with full permission structure for assignment/customization
export const getRolePermissionsForAssignment = async (
  roleId: number
): Promise<ApiResponse<RoleWithPermissions>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/roles/${roleId}/permissions-for-assignment`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    throw error;
  }
};

// Get all user role assignments
export const getAllUserRoles = async (): Promise<ApiResponse<UserRole[]>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/users/roles`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user roles:", error);
    throw error;
  }
};

// Get next custom role number for a user
export const getNextCustomRoleNumber = async (
  userId: string
): Promise<ApiResponse<{ nextNumber: number }>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/users/${userId}/next-custom-role-number`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching next custom role number:", error);
    throw error;
  }
};

// Assign role with optional custom permissions
export const assignRoleWithCustomPermissions = async (request: {
  userRoleId?: number; // Optional - if provided, updates existing role
  userId: string;
  roleId: number;
  assignedBy: string;
  isCustomRole: boolean;
  customPermissions?: Module[];
  customRoleName?: string;
  isDepartmentRestricted:boolean;
  restrictedDepartments:SelectedUserDepartments[]
}): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/users/roles/assign-with-custom`,
      request,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error assigning/updating role:", error);
    throw error;
  }
};

// Remove role from user
export const removeUserRole = async (
  userRoleId: number,
  modifiedBy: string
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/users/roles/${userRoleId}`,
      {
        ...getAuthHeaders(),
        data: { modifiedBy },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error removing user role:", error);
    throw error;
  }
};

// Get user's effective permissions
export const getUserEffectivePermissions = async (
  userId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/users/${userId}/permissions`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    throw error;
  }
};

export const getCustomPermissionDetails = async (
  customPermissionId: number
): Promise<
  ApiResponse<{
    customPermissionId: number;
    userId: string;
    baseRoleId: number;
    baseRoleName: string;
    baseRoleDescription: string;
    customRoleName: string;
    permissions: Module[];
    createdBy: string;
    createdAt: string;
    modifiedBy?: string;
    modifiedAt?: string;
  }>
> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/custom-permissions/${customPermissionId}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching custom permission details:", error);
    throw error;
  }
};

// Update custom permission
export const updateCustomPermission = async (
  customPermissionId: number,
  permissionStructure: Module[],
  modifiedBy: string,
  isDepartmentalRestriction:boolean,
  selectedDepartmets:SelectedUserDepartments[]
): Promise<ApiResponse<boolean>> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/custom-permissions/${customPermissionId}`,
      {
        permissionStructure,
        modifiedBy,
        isDepartmentalRestriction,
        selectedDepartmets
      },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error updating custom permission:", error);
    throw error;
  }
};

// Get user role details with custom permissions
export const getUserRoleDetails = async (
  userRoleId: number
): Promise<
  ApiResponse<{
    userRole: UserRole;
    customPermissions?: Module[];
    baseRolePermissions?: Module[];
  }>
> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/users/roles/details/${userRoleId}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user role details:", error);
    throw error;
  }
};

//Get user department permission

export const getUserDepartment = async(userId:string):Promise<UserDepartmentResponse> =>{
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user/department-access/${userId}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user role details:", error);
    throw error;
  }
}

export const reassignUserRole = async (
  request: ReassignRoleRequest
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/users/roles/reassign`,
      request,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error reassigning role:", error);
    throw error;
  }
};

// Convert custom role to base role
export const convertToBaseRole = async (
  request: ConvertToBaseRoleRequest
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/users/roles/convert-to-base`,
      request,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error converting to base role:", error);
    throw error;
  }
};
