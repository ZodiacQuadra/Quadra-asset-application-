import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/EntraADUsers`;

// =============================================
// Type Definitions
// =============================================

export interface AdditionalApprover {
  ApproverId: string;
  DisplayName?: string;
  RequestType: string;
}

export interface EscalationReviewer {
  ReviewerId: string;
  DisplayName?: string;
}

export interface EntraADUser {
  ID: string;
  DisplayName: string;
  Mail: string;
  JobTitle: string;
  Department: string;
  AccountEnabled: boolean;
  ADAccountEnabled: boolean;
  ShiftID: number | null;
  ShiftName: string | null;
  StartTime?: string | null;
  EndTime?: string | null;
  ExpiryDate?: string | null;
  Office_Location?: string | null;
  Office_Location_Coordinates?: string | null;
  WorkLocationType?: string | null;
  EmployeeId?: string | null;
  ManagerID?: string | null;
  ManagerDisplayName?: string | null;
  ManagerEmail?: string | null;
  OptionalManager?: string | null;
  User_24_7: boolean;
  OffDays?: string | null;
  IncludeInEscalation?: boolean | null;
  AdditionalApprovers?: string | null; // JSON: AdditionalApprover[]
  EscalationReviewers?: string | null; // JSON: EscalationReviewer[]
  LastSyncedAt: string;
  EmpLeaveTypeID?: string | null;
  EmpRoleName?: string | null;
  // Pending (scheduled) shift change
  NextShiftName?: string | null;
  NextShiftStartTime?: string | null;
  NextShiftEndTime?: string | null;
  EffectiveDate?: string | null;
}

export interface EntraADUserStats {
  summary: {
    TotalUsers: number;
    ActiveUsers: number;
    DisabledUsers: number;
    UsersWithManager: number;
    ShiftsAssigned: number;
    ShiftsUnassigned: number;
    LastSyncTime: string;
  };
  departmentBreakdown: Array<{ Department: string; UserCount: number }>;
  locationBreakdown: Array<{ UsageLocation: string; UserCount: number }>;
}

export interface AttendanceRecord {
  ID: string;
  UserID: string;

  CheckIn: string;          // ISO date string
  CheckOut: string | null;  // nullable

  Office_Location: string;
  Office_Coordinates: string | null;

  Employee_CurrentLocation: string;
  Employee_CurrentCoordinates: string; // "lat,long"

  WorkLocationType: "Office" | "Work from Home" | string;
  IsLocationChanged: boolean;

  ManagerID: string;
  ManagerApprovalStatus: string | null;

  IsActive: boolean;

  ShiftStartTime: string;   // ISO date (time only stored)
  ShiftEndTime: string;

  IsPresent: boolean | null;

  CreatedOn: string;
  CreatedBy: string;

  ModifiedOn: string | null;
  ModifiedBy: string | null;

  ViolationType: string | null;
  AttendanceStatus: string | null;

  DurationMinutes: number;
}

export interface EntraDataResponse {
  users: EntraADUser[];
  stats: EntraADUserStats;
  totalCount: number;
  filteredCount: number;
  OffDays: null | string
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

// =============================================
// Helper
// =============================================
const getAuthHeaders = (userId?: string) => {
  const token = getStoredAuthToken();
  const headers: any = {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
  if (userId) {
    headers.userid = userId;
  }
  return headers;
};

const handleAxiosError = (error: unknown, defaultMessage: string): ApiResponse => {
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

// =============================================
// API Functions
// =============================================

/** Fetch all Entra AD users and stats with pagination and search */
export const getAllEntraUsers = async (
  page: number = 1,
  limit: number = 10,
  search: string | null = null,
  managerId: string | null = null,
  department: string | null = null,
  shiftId: number | string | null = null,
  statusFilter: string | null = null
): Promise<ApiResponse<EntraDataResponse>> => {
  try {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    if (search) params.append("search", search);
    if (managerId) params.append("managerId", managerId);
    if (department) params.append("department", department);
    if (shiftId !== null && shiftId !== undefined) params.append("shiftId", shiftId.toString());
    if (statusFilter && statusFilter !== "all") params.append("statusFilter", statusFilter);

    const response = await axios.get(`${API_BASE_URL}/getAll?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return {
      success: true,
      data: response.data.data,
      message: "Entra users fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching Entra users:", error);
    return handleAxiosError(error, "Failed to fetch Entra users");
  }
};

/** Sync users from Microsoft Graph to local SQL */
export const syncEntraUsers = async (userId: string): Promise<ApiResponse<EntraDataResponse>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/syncUsers`, {}, {
      headers: getAuthHeaders(userId),
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Sync completed successfully",
    };
  } catch (error) {
    console.error("Error syncing Entra users:", error);
    return handleAxiosError(error, "Failed to sync Entra users");
  }
};

/** Update a user's shift assignment */
export const updateUserShift = async (
  userId: string,
  shiftId: number | null,
  currentAdminId: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/updateUserShift`,
      { userId, shiftId },
      {
        headers: getAuthHeaders(currentAdminId),
      }
    );
    return {
      success: true,
      message: response.data.message || "User shift updated successfully",
    };
  } catch (error) {
    console.error("Error updating user shift:", error);
    return handleAxiosError(error, "Failed to update user shift");
  }
};

/** Update shifts for multiple users */
export const bulkUpdateUserShifts = async (
  userIds: string[],
  shiftId: number | null,
  currentAdminId: string,
  includeSelfEscalation: boolean = false,
  assignNow:boolean  = false,
  shiftEffectiveDate: string | null
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/bulkUpdateUserShifts`,
      { userIds, shiftId, includeSelfEscalation, assignNow, shiftEffectiveDate },
      {
        headers: getAuthHeaders(currentAdminId),
      }
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Bulk shift update completed",
    };
  } catch (error) {
    console.error("Error in bulk update user shifts:", error);
    return handleAxiosError(error, "Failed to perform bulk shift update");
  }
};

/** Update locations for multiple users */
export const bulkUpdateUserLocations = async (
  userIds: string[],
  location: string | null,
  currentAdminId: string,
  isWfh: boolean,
  locationString: string,
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/bulkUpdateUserLocations`,
      { userIds, location, isWfh, locationString },
      {
        headers: getAuthHeaders(currentAdminId),
      }
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Bulk location update completed",
    };
  } catch (error) {
    console.error("Error in bulk update user locations:", error);
    return handleAxiosError(error, "Failed to perform bulk location update");
  }
};

export interface WeekOffConfig {
  configId: number;
  isRotationalOff: boolean;
  offDays: string | null;
  startDate: string;    // "YYYY-MM-DD"
  endDate: string | null;
  isActive: boolean;
}

/** Fetch weekoff config history for a user overlapping the given date range */
export const getUserWeekOffConfigs = async (
  userId: string,
  startDate: string,
  endDate: string
): Promise<WeekOffConfig[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/${userId}/weekoffConfigs`,
      {
        headers: getAuthHeaders(),
        params: { startDate, endDate },
      }
    );
    return response.data.data ?? [];
  } catch {
    return [];
  }
};

/** Update leave role for multiple users */
export const bulkUpdateUserLeaveRole = async (
  userIds: string[],
  empLeaveTypeID: string | null,
  currentAdminId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/bulkUpdateUserLeaveRole`,
      { userIds, empLeaveTypeID },
      { headers: getAuthHeaders(currentAdminId) }
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Bulk leave role update completed",
    };
  } catch (error) {
    console.error("Error in bulk update user leave role:", error);
    return handleAxiosError(error, "Failed to perform bulk leave role update");
  }
};

/** Update week off settings for multiple users */
export const bulkUpdateUserWeekOff = async (
  userIds: string[],
  isRotationalOff: boolean,
  offDays: string[],
  currentAdminId: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/bulkUpdateUserWeekOff`,
      { userIds, isRotationalOff, offDays, currentAdminId },
      {
        headers: getAuthHeaders(currentAdminId),
      }
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Bulk week off update completed",
    };
  } catch (error) {
    console.error("Error in bulk update user week off:", error);
    return handleAxiosError(error, "Failed to perform bulk week off update");
  }
};

/** Update a user's location assignment */
export const updateUserLocation = async (
  userId: string,
  location: string | null,
  currentAdminId: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/updateUserLocation`,
      { userId, location },
      {
        headers: getAuthHeaders(currentAdminId),
      }
    );
    return {
      success: true,
      message: response.data.message || "User location updated successfully",
    };
  } catch (error) {
    console.error("Error updating user location:", error);
    return handleAxiosError(error, "Failed to update user location");
  }
};

/** Fetch a single Entra AD user by ID */
export const getEntraUserById = async (id: string): Promise<ApiResponse<EntraADUser>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/getUser/${id}`, {
      headers: getAuthHeaders(),
    });
    return {
      success: true,
      data: response.data.data, // Accessing user directly from response
      message: "User fetched successfully",
    };
  } catch (error) {
    console.error(`Error fetching user ${id}:`, error);
    return handleAxiosError(error, `Failed to fetch user ${id}`);
  }
};


export const updateUserStatus = async (id: string, status: boolean,accessToken:string) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/status/${id}`, {
      status,
    },{
      headers:{ Authorization: `Bearer ${accessToken}` },
    });
    return {
      success: true,
      data: response.data.data, // Accessing user directly from response
      message: "User status updated successfully",
    };
  } catch (error) {
    console.error(`Error updating user ${id} status:`, error);
    return handleAxiosError(error, `Failed to update user ${id} status`);
  }
}


export const getUserAccountStatus = async (accessToken:string) => {
  try{
    const response = await axios.get(`${API_BASE_URL}/status`, {
    headers:{ Authorization: `Bearer ${accessToken}` },
  });

    return {
      success: true,
      data: response.data?.data, 
      message: "User account status fetched successfully",
    };
  }
  catch(error){
    console.error(`Error fetching user account status:`, error);
    return handleAxiosError(error, `Failed to fetch user account status`);
  }
  
}

/** Upsert additional approvers (and escalation reviewers) for a user's leave/permission requests */
export const upsertAdditionalApprovers = async (
  sourceUserId: string,
  requestType: string | null,
  approverIds: string[],
  escalationReviewers: string[],
  userId: string
): Promise<ApiResponse> => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/EntraADUsers/upsertAdditionalApprovers`,
      { sourceUserId, requestType, approverIds, escalationReviewers },
      { headers: getAuthHeaders(userId) }
    );
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Additional approvers updated successfully",
    };
  } catch (error) {
    return handleAxiosError(error, "Failed to update additional approvers");
  }
};

export default {
  getAllEntraUsers,
  getEntraUserById,
  syncEntraUsers,
  updateUserShift,
  bulkUpdateUserShifts,
  bulkUpdateUserLocations,
  updateUserLocation,
  bulkUpdateUserWeekOff,
  upsertAdditionalApprovers,
};
