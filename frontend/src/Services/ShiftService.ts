import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/Shifts`;

// =============================================
// Type Definitions
// =============================================

export interface Shift {
  ID: number;
  ShiftName: string;
  StartTime: string; // "HH:mm:ss" from the server
  EndTime: string;   // "HH:mm:ss" from the server
  IsActive: boolean;
  ExpiryDate?: string; // ISO string from server
  CreatedOn?: string;
  ModifiedOn?: string;
  CreatedBy?: string;
  ModifiedBy?: string;
}

export interface UpsertShiftData {
  id?: number | null;
  ShiftName: string;
  StartTime: string; // "HH:mm" format to send
  EndTime: string;   // "HH:mm" format to send
  IsActive?: boolean;
  ExpiryDate?: string | null; // ISO string to send
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
const getAuthHeaders = () => {
  const token = getStoredAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
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
// GET /getAll — Fetch all shifts
// =============================================
export const getAllShifts = async (): Promise<ApiResponse<Shift[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/getAll`, {
      headers: getAuthHeaders(),
    });
    return { success: true, data: response.data.data, message: "Shifts fetched successfully" };
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return handleAxiosError(error, "Failed to fetch shifts");
  }
};

// =============================================
// POST /upsert — Create or update a shift
// =============================================
export const upsertShift = async (
  shiftData: UpsertShiftData,
  userId: string
): Promise<ApiResponse<{ ID: number; Action: string }>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/upsert`, shiftData, {
      headers: {
        ...getAuthHeaders(),
        userid: userId,
      },
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Shift saved successfully",
    };
  } catch (error) {
    console.error("Error upserting shift:", error);
    return handleAxiosError(error, "Failed to save shift");
  }
};

// =============================================
// DELETE /:id — Soft delete a shift
// =============================================
export const deleteShift = async (
  id: number,
  userId: string
): Promise<ApiResponse<void>> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/${id}`, {
      headers: {
        ...getAuthHeaders(),
        userid: userId,
      },
    });
    return { success: true, message: response.data.message || "Shift deleted successfully" };
  } catch (error) {
    console.error("Error deleting shift:", error);
    return handleAxiosError(error, "Failed to delete shift");
  }
};

export default { getAllShifts, upsertShift, deleteShift };
 