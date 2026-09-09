import axios, { AxiosResponse, AxiosError } from "axios";
import { Person } from "../Types/interview";
import { authEvents, getRegisteredRefreshFn } from "../Auth/authEvents";
import { getStoredAuthToken } from "../Auth/tokenStorage";

// Types
export interface InterviewStage {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  order: number;
  show: boolean;
  isManual: boolean;
  notify: boolean;
  notifyUsers: Person[]
}

export interface StageFormData {
  name: string;
  description: string;
  show: boolean;
  isManual: boolean;
}

export interface CreateStageData extends StageFormData {
  createdByUserID?: string;
}

export interface UpdateStageData extends StageFormData {
  modifiedByUserID?: string;
}

export interface DeleteStageData {
  modifiedByUserID?: string;
}

export interface ReorderStageData {
  stages: {
    id: string;
    order: number;
    name: string;
    description: string;
  }[];
  modifiedByUserID: string;
}

export interface ReorderStagesRequest {
  stages: {
    id: string;
    order: number;
    name: string;
    description: string;
  }[];
  modifiedByUserID: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface CreateStageResponse {
  stageId: string;
}

export interface UpdateStageResponse {
  stageId: string;
}

// API Configuration
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/stagemaster`;

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth tokens if needed
apiClient.interceptors.request.use(
  (config) => {
    const token = getStoredAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as typeof error.config & { _retryAttempted?: boolean };

    if (error.response?.status === 401 && !config?._retryAttempted) {
      config!._retryAttempted = true;
      const refreshFn = getRegisteredRefreshFn();
      if (refreshFn) {
        try {
          const newToken = await refreshFn();
          if (newToken) {
            const token = getStoredAuthToken() ?? newToken;
            config!.headers!.Authorization = `Bearer ${token}`;
            return apiClient.request(config!);
          }
        } catch {
          // refresh failed — fall through to session-timeout
        }
      }
      authEvents.emit("session-timeout");
    } else if (error.response?.status !== 401) {
      console.error("Server error:", error.message);
    }

    return Promise.reject(error);
  }
);

// API Service Class
export class InterviewStagesApiService {
  /**
   * Get all interview stages
   */
  static async getAllStages(accessToken: string): Promise<InterviewStage[]> {
    try {
      const response: AxiosResponse<ApiResponse<
        InterviewStage[]
      >> = await apiClient.get("/interview-stages", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Failed to fetch interview stages"
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to fetch interview stages: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Get interview stage by ID
   */
  static async getStageById(
    stageId: string,
    accessToken: string
  ): Promise<InterviewStage> {
    try {
      const response: AxiosResponse<ApiResponse<
        InterviewStage
      >> = await apiClient.get(`/interview-stages/${stageId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Failed to fetch interview stage"
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to fetch interview stage: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Create a new interview stage
   */
  static async createStage(
    stageData: CreateStageData,
    accessToken: string
  ): Promise<CreateStageResponse> {
    try {
      const response: AxiosResponse<ApiResponse<
        CreateStageResponse
      >> = await apiClient.post("/interview-stages", stageData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Failed to create interview stage"
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to create interview stage: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Update an existing interview stage
   */
  static async updateStage(
    stageId: string,
    stageData: UpdateStageData,
    accessToken: string
  ): Promise<UpdateStageResponse> {
    try {
      const response: AxiosResponse<ApiResponse<
        UpdateStageResponse
      >> = await apiClient.put(`/interview-stages/${stageId}`, stageData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(
          response.data.message || "Failed to update interview stage"
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to update interview stage: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Delete an interview stage
   */
  static async deleteStage(
    stageId: string,
    deleteData: DeleteStageData,
    accessToken: string
  ): Promise<void> {
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.delete(
        `/interview-stages/${stageId}`,
        {
          data: deleteData,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to delete interview stage"
        );
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to delete interview stage: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Reorder interview stages
   */
  static async reorderStages(
    reorderData: ReorderStagesRequest,
    accessToken: string
  ): Promise<void> {
    try {
      // console.log("API Service - Reordering stages:", reorderData); // Debug log

      const response: AxiosResponse<ApiResponse> = await apiClient.put(
        "/interview-stagesorder/reorder",
        reorderData,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // console.log("API Service - Response:", response.data); // Debug log

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Failed to reorder interview stages"
        );
      }
    } catch (error) {
      console.error("API Service - Reorder error:", error); // Debug log
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message || error.message;
        throw new Error(`Failed to reorder interview stages: ${message}`);
      }
      throw error;
    }
  }

  /**
   * Health check
   */
}

// Custom hooks for React components
export const useInterviewStagesApi = () => {
  /**
   * Hook for fetching all stages with loading and error states
   */
  const fetchAllStages = async (accessToken: string) => {
    try {
      const stages = await InterviewStagesApiService.getAllStages(accessToken);
      return { data: stages, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  /**
   * Hook for creating a stage with proper error handling
   */
  const createStage = async (
    stageData: CreateStageData,
    accessToken: string
  ) => {
    try {
      const result = await InterviewStagesApiService.createStage(
        stageData,
        accessToken
      );
      return { data: result, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  /**
   * Hook for updating a stage with proper error handling
   */
  const updateStage = async (
    stageId: string,
    stageData: UpdateStageData,
    accessToken: string
  ) => {
    try {
      const result = await InterviewStagesApiService.updateStage(
        stageId,
        stageData,
        accessToken
      );
      return { data: result, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  /**
   * Hook for deleting a stage with proper error handling
   */
  const deleteStage = async (
    stageId: string,
    deleteData: DeleteStageData,
    accessToken: string
  ) => {
    try {
      await InterviewStagesApiService.deleteStage(
        stageId,
        deleteData,
        accessToken
      );
      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  /**
   * Hook for reordering stages with proper error handling
   */
  const reorderStages = async (
    reorderData: ReorderStagesRequest,
    accessToken: string
  ) => {
    try {
      await InterviewStagesApiService.reorderStages(reorderData, accessToken);
      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  };

  return {
    fetchAllStages,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
  };
};

// Utility functions for API operations
export const ApiUtils = {
  /**
   * Retry function for failed API calls
   */
  async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        if (i === maxRetries) break;
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, i))
        );
      }
    }

    throw lastError!;
  },

  /**
   * Batch operations helper
   */
  async batchOperation<T, R>(
    items: T[],
    operation: (item: T) => Promise<R>,
    batchSize: number = 5
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(operation));
      results.push(...batchResults);
    }

    return results;
  },

  /**
   * Format error messages for display
   */
  formatErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "An unexpected error occurred";
  },
};

export default InterviewStagesApiService;
