import axios, { AxiosError, AxiosResponse } from "axios";

// Base URL for the API (adjust according to your setup)
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/FinanceActivityManagement`;

// =============================================
// Type Definitions
// =============================================

export interface FinanceActivity {
  id: string;
  title: string;
  description: string;
  status: FinanceActivityStatus | undefined;
  createdByUserId: string;
  modifiedByUserId?: string;
  createdAt: string;
  modifiedAt?: string;
}

export type FinanceActivityStatus =
  | "Active"
  | "Inactive"
  | "Draft"
  | "Archived";

export type SortDirection = "ASC" | "DESC";

export type SortBy = "Title" | "CreatedAt" | "ModifiedAt" | "Status";

export interface GetFinanceActivitiesOptions {
  status?: FinanceActivityStatus;
  createdByUserId?: string;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortBy;
  sortDirection?: SortDirection;
}

export interface CreateFinanceActivityData {
  title: string;
  description?: string;
  status?: FinanceActivityStatus;
  createdByUserId: string;
}

export interface UpdateFinanceActivityData {
  title: string;
  description?: string;
  status?: FinanceActivityStatus;
  modifiedByUserId: string;
}

export interface SearchOptions {
  searchTerm: string;
  status?: FinanceActivityStatus;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortBy;
  sortDirection?: SortDirection;
}

export interface FinanceActivityStatsOptions {
  createdByUserId?: string;
  dateRange?: string;
}

export interface FinanceActivityStats {
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
  status?: FinanceActivityStatus;
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
// Get Finance Activities with pagination and filtering
// =============================================
export const getFinanceActivities = async (
  options: GetFinanceActivitiesOptions = {},
  accessToken: string
): Promise<ApiResponse<PaginatedResponse<FinanceActivity>>> => {
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
      data: PaginatedResponse<FinanceActivity>;
    }> = await axios.get(
      `${API_BASE_URL}/financeActivities?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Finance Activities fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching finance activity:", error);
    return handleAxiosError(error, "Failed to fetch finance activity");
  }
};

// =============================================
// Create Finance Activity
// =============================================
export const createFinanceActivity = async (
  activityData: CreateFinanceActivityData,
  accessToken: string
): Promise<ApiResponse<FinanceActivity>> => {
  try {
    const {
      title,
      description,
      status = "Active",
      createdByUserId,
    } = activityData;

    if (!title?.trim()) {
      throw new Error("Finance Activity title is required");
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
      data: FinanceActivity;
      message?: string;
    }> = await axios.post(`${API_BASE_URL}/financeActivities`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Finance Activity created successfully",
    };
  } catch (error) {
    console.error("Error creating finance activity:", error);
    return handleAxiosError(error, "Failed to create finance activity");
  }
};

// =============================================
// Update Finance Activity
// =============================================
export const updateFinanceActivity = async (
  activityId: string,
  activityData: UpdateFinanceActivityData,
  accessToken: string
): Promise<ApiResponse<FinanceActivity>> => {
  try {
    if (!activityId) {
      throw new Error("Finance Activity ID is required");
    }

    const { title, description, status, modifiedByUserId } = activityData;

    if (!title?.trim()) {
      throw new Error("Finance Activity title is required");
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
      data: FinanceActivity;
      message?: string;
    }> = await axios.put(
      `${API_BASE_URL}/financeActivities/${activityId}`,
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
      message: response.data.message || "Finance Activity updated successfully",
    };
  } catch (error) {
    console.error("Error updating finance activity:", error);
    return handleAxiosError(error, "Failed to update finance activity");
  }
};

// =============================================
// Delete Finance Activity
// =============================================
export const deleteFinanceActivity = async (
  activityId: string,
  modifiedByUserId: string,
  accessToken: string
): Promise<ApiResponse<void>> => {
  try {
    if (!activityId) {
      throw new Error("Finance Activity ID is required");
    }

    if (!modifiedByUserId) {
      throw new Error("Modified by user ID is required");
    }

    const response: AxiosResponse<{ message?: string }> = await axios.delete(
      `${API_BASE_URL}/financeActivities/${activityId}`,
      {
        data: { modifiedByUserId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      message: response.data.message || "Finance Activity deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting finance activity:", error);
    return handleAxiosError(error, "Failed to delete finance activity");
  }
};

// =============================================
// Search Finance Activities
// =============================================
export const searchFinanceActivities = async (
  searchOptions: SearchOptions,
  accessToken: string
): Promise<ApiResponse<PaginatedResponse<FinanceActivity>>> => {
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
      data: PaginatedResponse<FinanceActivity>;
    }> = await axios.get(
      `${API_BASE_URL}/financeActivities/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Finance Activities searched successfully",
    };
  } catch (error) {
    console.error("Error searching finance activities:", error);
    return handleAxiosError(error, "Failed to search finance activities");
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
    }> = await axios.post(`${API_BASE_URL}/financeActivities/bulk`, payload, {
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
// Bulk Delete Finance Activities
// =============================================
export const bulkDeleteFinanceActivities = async (
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
export const bulkUpdateFinanceActivityStatus = async (
  activityIds: string[],
  status: FinanceActivityStatus,
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
// Get Finance Activity Statistics
// =============================================
export const getFinanceActivityStats = async (
  options: FinanceActivityStatsOptions = {},
  accessToken: string
): Promise<ApiResponse<FinanceActivityStats>> => {
  try {
    const { createdByUserId, dateRange } = options;

    const params = new URLSearchParams();

    if (createdByUserId) params.append("createdByUserId", createdByUserId);
    if (dateRange) params.append("dateRange", dateRange);

    const response: AxiosResponse<{
      data: FinanceActivityStats;
    }> = await axios.get(
      `${API_BASE_URL}/financeActivities/stats?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Finance Activity statistics fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching finance activity statistics:", error);
    return handleAxiosError(
      error,
      "Failed to fetch finance activity statistics"
    );
  }
};

export const getFinanceActivityById = async (
  activityId: string,
  accessToken: string
): Promise<any> => {
  try {
    if (!activityId) {
      throw new Error("Finance Activity ID is required");
    }

    const response: any = await axios.get(
      `${API_BASE_URL}/financeActivities/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Finance Activity fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching Activity:", error);
    return handleAxiosError(error, "Failed to fetch Activity");
  }
};

export default {
  getFinanceActivities,
  getFinanceActivityById,
  createFinanceActivity,
  updateFinanceActivity,
  deleteFinanceActivity,
  searchFinanceActivities,
  bulkOperations,
  bulkDeleteFinanceActivities,
  bulkUpdateFinanceActivityStatus,
  getFinanceActivityStats,
};
