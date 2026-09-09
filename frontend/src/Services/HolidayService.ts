import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/holidays`;

// =============================================
// Type Definitions
// =============================================

export interface Holiday {
  ID: number;
  HolidayName: string;
  HolidayDate: string; // ISO date string from server
  HolidayType: "Government" | "Festival" | "Company" | "Others" | "Optional";
  Year: number;
  IsActive: boolean;
  IsLocationSpecific:boolean;
  Locations: { id: string; Name: string, locationId:string }[];
  LocationNames?: string | null;
  CreatedAt?: string;
  CreatedBy?: string;
  ModifiedAt?: string;
  ModifiedBy?: string;
}

export interface UpsertHolidayData {
  id?: number | null;
  HolidayName: string;
  HolidayDate: string; // YYYY-MM-DD
  HolidayType: "Government" | "Festival" | "Company" | "Others" | "Optional";
  IsLocationSpecific: boolean;
  Locations: string[]
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: string[];
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
      errors: axiosError.response?.data?.errors,
      error: axiosError.response?.data || axiosError.message,
    };
  }
  if (error instanceof Error) {
    return { success: false, message: error.message, error: error.message };
  }
  return { success: false, message: defaultMessage, error: String(error) };
};

// =============================================
// GET /getByYear/:year — Fetch all holidays for a year
// =============================================
export const getHolidaysByYear = async (year: number): Promise<ApiResponse<Holiday[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/getByYear/${year}`, {
      headers: getAuthHeaders(),
    });
    return { success: true, data: response.data.data, message: "Holidays fetched successfully" };
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return handleAxiosError(error, "Failed to fetch holidays");
  }
};

// =============================================
// GET /getYears — Fetch all distinct years with holiday data
// =============================================
export const getHolidayYears = async (): Promise<ApiResponse<number[]>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/getYears`, {
      headers: getAuthHeaders(),
    });
    return { success: true, data: response.data.data, message: "Years fetched successfully" };
  } catch (error) {
    console.error("Error fetching holiday years:", error);
    return handleAxiosError(error, "Failed to fetch holiday years");
  }
};

// =============================================
// POST /upsert — Create or update a single holiday
// =============================================
export const upsertHoliday = async (
  data: UpsertHolidayData,
  userId: string
): Promise<ApiResponse<Holiday>> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/upsert`, data, {
      headers: {
        ...getAuthHeaders(),
        userid: userId,
      },
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Holiday saved successfully",
    };
  } catch (error) {
    console.error("Error upserting holiday:", error);
    return handleAxiosError(error, "Failed to save holiday");
  }
};

// =============================================
// POST /bulkUpload — Upload Excel file for a year
// =============================================
export const bulkUploadHolidays = async (
  file: File,
  year: number,
  userId: string,
  mode: "overwrite" | "merge" = "overwrite"
): Promise<ApiResponse<{ year: number; count: number }>> => {
  try {
    const formData = new FormData();
    formData.append("holidayFile", file);
    formData.append("year", year.toString());
    formData.append("mode", mode);

    const token = getStoredAuthToken();
    const response = await axios.post(`${API_BASE_URL}/bulkUpload`, formData, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        "Content-Type": "multipart/form-data",
        userid: userId,
      },
    });
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Holidays uploaded successfully",
    };
  } catch (error) {
    console.error("Error bulk uploading holidays:", error);
    return handleAxiosError(error, "Failed to upload holidays");
  }
};

// =============================================
// DELETE /:id — Soft-delete a single holiday
// =============================================
export const deleteHoliday = async (
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
    return { success: true, message: response.data.message || "Holiday deleted successfully" };
  } catch (error) {
    console.error("Error deleting holiday:", error);
    return handleAxiosError(error, "Failed to delete holiday");
  }
};

export default { getHolidaysByYear, getHolidayYears, upsertHoliday, bulkUploadHolidays, deleteHoliday };
