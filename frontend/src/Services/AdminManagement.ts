import axios, { AxiosError, AxiosResponse } from "axios";

// Base URL for the API (adjust according to your setup)
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/AdminActivities`;

// =============================================
// Type Definitions
// =============================================

export interface AdminActivity {
  id: string;
  title: string;
  description: string;
  status: ActivityStatus | undefined;
  createdByUserId: string;
  modifiedByUserId?: string;
  createdAt: string;
  modifiedAt?: string;
}

export type ActivityStatus = "Active" | "Inactive" | "Draft" | "Archived";

export type SortDirection = "ASC" | "DESC";

export type SortBy = "Title" | "CreatedAt" | "ModifiedAt" | "Status";

export interface GetAdminActivitiesOptions {
  status?: ActivityStatus;
  createdByUserId?: string;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortBy;
  sortDirection?: SortDirection;
}

export interface CreateAdminActivityData {
  title: string;
  description?: string;
  status?: ActivityStatus;
  createdByUserId: string;
}

export interface UpdateAdminActivityData {
  title: string;
  description?: string;
  status?: ActivityStatus;
  modifiedByUserId: string;
}

export interface SearchOptions {
  searchTerm: string;
  status?: ActivityStatus;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortBy;
  sortDirection?: SortDirection;
}

export interface AdminActivityStatsOptions {
  createdByUserId?: string;
  dateRange?: string;
}

export interface AdminActivityStats {
  totalActivities: number;
  activeActivities: number;
  inactiveActivities: number;
  draftActivities: number;
  archivedActivities: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export type BulkOperation = "delete" | "updateStatus";

export interface BulkOperationData {
  status?: ActivityStatus;
  [key: string]: any;
}

export interface AuthHeaders {
  Authorization: string;
  "Content-Type": string;
}

// =============================================
// Helper Functions
// =============================================

// Helper function to handle Axios errors consistently
const handleAxiosError = (
  error: unknown,
  defaultMessage: string
): ApiResponse => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    return {
      success: false,
      message:
        axiosError.response?.data?.message ||
        axiosError.message ||
        defaultMessage,
      error: axiosError.response?.data || axiosError.message,
    };
  }

  // Handle non-Axios errors (like validation errors we throw)
  if (error instanceof Error) {
    return {
      success: false,
      message: error.message,
      error: error.message,
    };
  }

  // Handle unknown error types
  return {
    success: false,
    message: defaultMessage,
    error: String(error),
  };
};

// =============================================
// Get Admin Activities with pagination and filtering
// =============================================
export const getAdminActivities = async (
  options: GetAdminActivitiesOptions = {},
  accessToken: string
): Promise<ApiResponse<PaginatedResponse<AdminActivity>>> => {
  try {
    const {
      status,
      createdByUserId,
      searchTerm,
      pageNumber = 1,
      pageSize = 50,
      sortBy = "CreatedAt",
      sortDirection = "DESC",
    } = options;

    const params = new URLSearchParams();

    if (status) params.append("status", status);
    if (createdByUserId) params.append("createdByUserId", createdByUserId);
    if (searchTerm) params.append("searchTerm", searchTerm);

    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", sortBy);
    params.append("sortDirection", sortDirection);

    const response: AxiosResponse<{
      data: PaginatedResponse<AdminActivity>;
    }> = await axios.get(
      `${API_BASE_URL}/adminActivities?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Admin Activities fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching admin activities:", error);
    return handleAxiosError(error, "Failed to fetch admin activities");
  }
};

// =============================================
// Get Admin Activity by ID
// =============================================
export const getAdminActivityById = async (
  activityId: string,
  accessToken: string
): Promise<ApiResponse<AdminActivity>> => {
  try {
    if (!activityId) {
      throw new Error("Admin Activity ID is required");
    }

    const response: AxiosResponse<{ data: AdminActivity }> = await axios.get(
      `${API_BASE_URL}/adminActivities/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Admin Activity fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching admin activity:", error);
    return handleAxiosError(error, "Failed to fetch admin activity");
  }
};

// =============================================
// Create Admin Activity
// =============================================
export const createAdminActivity = async (
  activityData: CreateAdminActivityData,
  accessToken: string
): Promise<ApiResponse<AdminActivity>> => {
  try {
    const {
      title,
      description,
      status = "Active",
      createdByUserId,
    } = activityData;

    if (!title?.trim()) {
      throw new Error("Admin Activity title is required");
    }

    if (!createdByUserId) {
      throw new Error("Created by user ID is required");
    }

    const payload = {
      title: title.trim(),
      description: description?.trim() || "",
      status,
      createdByUserId,
    };

    const response: AxiosResponse<{
      data: AdminActivity;
      message?: string;
    }> = await axios.post(`${API_BASE_URL}/adminActivities`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Admin Activity created successfully",
    };
  } catch (error) {
    console.error("Error creating admin activity:", error);
    return handleAxiosError(error, "Failed to create admin activity");
  }
};

// =============================================
// Update Admin Activity
// =============================================
export const updateAdminActivity = async (
  activityId: string,
  activityData: UpdateAdminActivityData,
  accessToken: string
): Promise<ApiResponse<AdminActivity>> => {
  try {
    if (!activityId) {
      throw new Error("Admin Activity ID is required");
    }

    const { title, description, status, modifiedByUserId } = activityData;

    if (!title?.trim()) {
      throw new Error("Admin Activity title is required");
    }

    if (!modifiedByUserId) {
      throw new Error("Modified by user ID is required");
    }

    const payload = {
      title: title.trim(),
      description: description?.trim() || "",
      status,
      modifiedByUserId,
    };

    const response: AxiosResponse<{
      data: AdminActivity;
      message?: string;
    }> = await axios.put(
      `${API_BASE_URL}/adminActivities/${activityId}`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Admin Activity updated successfully",
    };
  } catch (error) {
    console.error("Error updating admin activity:", error);
    return handleAxiosError(error, "Failed to update admin activity");
  }
};

// =============================================
// Delete Admin Activity
// =============================================
export const deleteAdminActivity = async (
  activityId: string,
  modifiedByUserId: string,
  accessToken: string
): Promise<ApiResponse<void>> => {
  try {
    if (!activityId) {
      throw new Error("Admin Activity ID is required");
    }

    if (!modifiedByUserId) {
      throw new Error("Modified by user ID is required");
    }

    const response: AxiosResponse<{ message?: string }> = await axios.delete(
      `${API_BASE_URL}/adminActivities/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: { modifiedByUserId },
      }
    );

    return {
      success: true,
      message: response.data.message || "Admin Activity deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting admin activity:", error);
    return handleAxiosError(error, "Failed to delete admin activity");
  }
};

// =============================================
// Search Admin Activities
// =============================================
export const searchAdminActivities = async (
  searchOptions: SearchOptions,
  accessToken: string
): Promise<ApiResponse<PaginatedResponse<AdminActivity>>> => {
  try {
    const {
      searchTerm,
      status,
      pageNumber = 1,
      pageSize = 20,
      sortBy = "Title",
      sortDirection = "ASC",
    } = searchOptions;

    if (!searchTerm?.trim()) {
      throw new Error("Search term is required");
    }

    const params = new URLSearchParams();
    params.append("searchTerm", searchTerm.trim());

    if (status) params.append("status", status);
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", sortBy);
    params.append("sortDirection", sortDirection);

    const response: AxiosResponse<{
      data: PaginatedResponse<AdminActivity>;
    }> = await axios.get(
      `${API_BASE_URL}/adminActivities/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Admin Activities searched successfully",
    };
  } catch (error) {
    console.error("Error searching admin activities:", error);
    return handleAxiosError(error, "Failed to search admin activities");
  }
};

// =============================================
// Bulk Operations
// =============================================
export const bulkOperations = async (
  operation: BulkOperation,
  activityIds: string[],
  modifiedByUserId: string,
  additionalData: BulkOperationData = {},
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    if (!operation) {
      throw new Error("Operation type is required");
    }

    if (
      !activityIds ||
      !Array.isArray(activityIds) ||
      activityIds.length === 0
    ) {
      throw new Error("Activity IDs array is required");
    }

    if (!modifiedByUserId) {
      throw new Error("Modified by user ID is required");
    }

    const payload = {
      operation,
      activityIds,
      modifiedByUserId,
      data: additionalData,
    };

    const response: AxiosResponse<{
      success: boolean;
      data: any;
      message?: string;
    }> = await axios.post(`${API_BASE_URL}/adminActivities/bulk`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message || "Bulk operation completed",
    };
  } catch (error) {
    console.error("Error in bulk operation:", error);
    return handleAxiosError(error, "Failed to perform bulk operation");
  }
};

// =============================================
// Bulk Delete Admin Activities
// =============================================
export const bulkDeleteAdminActivities = async (
  activityIds: string[],
  modifiedByUserId: string,
  accessToken: string
): Promise<ApiResponse<any>> => {
  return await bulkOperations(
    "delete",
    activityIds,
    modifiedByUserId,
    {},
    accessToken
  );
};

// =============================================
// Bulk Update Status
// =============================================
export const bulkUpdateAdminActivityStatus = async (
  activityIds: string[],
  status: ActivityStatus,
  modifiedByUserId: string,
  accessToken: string
): Promise<ApiResponse<any>> => {
  return await bulkOperations(
    "updateStatus",
    activityIds,
    modifiedByUserId,
    {
      status,
    },
    accessToken
  );
};

// =============================================
// Get Admin Activity Statistics
// =============================================
export const getAdminActivityStats = async (
  options: AdminActivityStatsOptions = {},
  accessToken: string
): Promise<ApiResponse<AdminActivityStats>> => {
  try {
    const { createdByUserId, dateRange } = options;

    const params = new URLSearchParams();

    if (createdByUserId) params.append("createdByUserId", createdByUserId);
    if (dateRange) params.append("dateRange", dateRange);

    const response: AxiosResponse<{
      data: AdminActivityStats;
    }> = await axios.get(
      `${API_BASE_URL}/adminActivities/stats?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Admin Activity statistics fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching admin activity statistics:", error);
    return handleAxiosError(error, "Failed to fetch admin activity statistics");
  }
};

// =============================================
// Export All Functions
// =============================================
export default {
  getAdminActivities,
  getAdminActivityById,
  createAdminActivity,
  updateAdminActivity,
  deleteAdminActivity,
  searchAdminActivities,
  bulkOperations,
  bulkDeleteAdminActivities,
  bulkUpdateAdminActivityStatus,
  getAdminActivityStats,
};
