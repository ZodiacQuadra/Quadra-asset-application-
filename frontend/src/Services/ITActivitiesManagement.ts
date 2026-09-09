import axios, { AxiosError, AxiosResponse } from "axios";
import { access } from "fs";

// Base URL for the API (adjust according to your setup)
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/ITActivitiesManagement`;

// =============================================
// Type Definitions
// =============================================

export interface Activity {
  id: string;
  title: string;
  description: string;
  status: ActivityStatus | undefined;
  createdByUserId: string;
  modifiedByUserId?: string;
  createdAt: string;
  modifiedAt?: string;
}

export type ActivityStatus = "Active" | "Inactive" | "Completed" | "Archived";

export type SortDirection = "ASC" | "DESC";

export type SortBy = "Title" | "CreatedAt" | "ModifiedAt" | "Status";

export interface GetActivitiesOptions {
  status?: ActivityStatus;
  createdByUserId?: string;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortBy;
  sortDirection?: SortDirection;
}

export interface CreateActivityData {
  title: string;
  description?: string;
  status?: ActivityStatus;
  createdByUserId: string;
}

export interface UpdateActivityData {
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

export interface ActivityStatsOptions {
  createdByUserId?: string;
  dateRange?: string;
}

export interface ActivityStats {
  totalActivities: number;
  activeActivities: number;
  inactiveActivities: number;
  completedActivities: number;
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
// Get Activities with pagination and filtering
// =============================================
export const getActivities = async (
  options: GetActivitiesOptions = {},
  accessToken: string
): Promise<ApiResponse<PaginatedResponse<Activity>>> => {
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
      data: PaginatedResponse<Activity>;
    }> = await axios.get(`${API_BASE_URL}/activities?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: "Activities fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching activities:", error);
    return handleAxiosError(error, "Failed to fetch activities");
  }
};

// =============================================
// Get Activity by ID
// =============================================
export const getActivityById = async (
  activityId: string,
  accessToken: string
): Promise<ApiResponse<Activity>> => {
  try {
    if (!activityId) {
      throw new Error("Activity ID is required");
    }

    const response: AxiosResponse<{ data: Activity }> = await axios.get(
      `${API_BASE_URL}/activities/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Activity fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching activity:", error);
    return handleAxiosError(error, "Failed to fetch activity");
  }
};

// =============================================
// Create Activity
// =============================================
export const createActivity = async (
  activityData: CreateActivityData,
  accessToken: string
): Promise<ApiResponse<Activity>> => {
  try {
    const {
      title,
      description,
      status = "Active",
      createdByUserId,
    } = activityData;

    if (!title?.trim()) {
      throw new Error("Activity title is required");
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
      data: Activity;
      message?: string;
    }> = await axios.post(`${API_BASE_URL}/activities`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Activity created successfully",
    };
  } catch (error) {
    console.error("Error creating activity:", error);
    return handleAxiosError(error, "Failed to create activity");
  }
};

// =============================================
// Update Activity
// =============================================
export const updateActivity = async (
  activityId: string,
  activityData: UpdateActivityData,
  accessToken: string
): Promise<ApiResponse<Activity>> => {
  try {
    if (!activityId) {
      throw new Error("Activity ID is required");
    }

    const { title, description, status, modifiedByUserId } = activityData;

    if (!title?.trim()) {
      throw new Error("Activity title is required");
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
      data: Activity;
      message?: string;
    }> = await axios.put(`${API_BASE_URL}/activities/${activityId}`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Activity updated successfully",
    };
  } catch (error) {
    console.error("Error updating activity:", error);
    return handleAxiosError(error, "Failed to update activity");
  }
};

// =============================================
// Delete Activity
// =============================================
export const deleteActivity = async (
  activityId: string,
  modifiedByUserId: string,
  accessToken: string
): Promise<ApiResponse<void>> => {
  try {
    if (!activityId) {
      throw new Error("Activity ID is required");
    }

    if (!modifiedByUserId) {
      throw new Error("Modified by user ID is required");
    }

    const response: AxiosResponse<{ message?: string }> = await axios.delete(
      `${API_BASE_URL}/activities/${activityId}`,
      {
        data: { modifiedByUserId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      message: response.data.message || "Activity deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting activity:", error);
    return handleAxiosError(error, "Failed to delete activity");
  }
};

// =============================================
// Search Activities
// =============================================
export const searchActivities = async (
  searchOptions: SearchOptions,
  accessToken: string
): Promise<ApiResponse<PaginatedResponse<Activity>>> => {
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
      data: PaginatedResponse<Activity>;
    }> = await axios.get(
      `${API_BASE_URL}/activities/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Activities searched successfully",
    };
  } catch (error) {
    console.error("Error searching activities:", error);
    return handleAxiosError(error, "Failed to search activities");
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
    }> = await axios.post(`${API_BASE_URL}/activities/bulk`, payload, {
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
// Bulk Delete Activities
// =============================================
export const bulkDeleteActivities = async (
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
export const bulkUpdateActivityStatus = async (
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
// Get Activity Statistics
// =============================================
export const getActivityStats = async (
  options: ActivityStatsOptions = {},
  accessToken: string
): Promise<ApiResponse<ActivityStats>> => {
  try {
    const { createdByUserId, dateRange } = options;

    const params = new URLSearchParams();

    if (createdByUserId) params.append("createdByUserId", createdByUserId);
    if (dateRange) params.append("dateRange", dateRange);

    const response: AxiosResponse<{ data: ActivityStats }> = await axios.get(
      `${API_BASE_URL}/activities/stats?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Activity statistics fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching activity statistics:", error);
    return handleAxiosError(error, "Failed to fetch activity statistics");
  }
};

// =============================================
// Export All Functions
// =============================================
export default {
  getActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  searchActivities,
  bulkOperations,
  bulkDeleteActivities,
  bulkUpdateActivityStatus,
  getActivityStats,
};
