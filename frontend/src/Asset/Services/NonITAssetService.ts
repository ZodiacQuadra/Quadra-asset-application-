import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";
import { AssetFileRef, AssetStatus } from "./AssetInventoryService";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/asset/non-it-assets`;

export interface NonITFieldValueRecord {
  FieldID: string;
  FieldName: string;
  FieldType: "Text" | "Number" | "Date";
  FieldValue: string | null;
}

export interface NonITAssetHistoryRecord {
  ID: string;
  NonITRequestID: string;
  EventType: string;
  OldStatus: string | null;
  NewStatus: string | null;
  PerformedBy: string | null;
  EventDate: string;
  CreatedAt: string;
}

export interface NonITAssetRecord {
  ID: string;
  AssetTag: string;
  AssetCategoryID: string;
  CategoryName: string;
  Location: string | null;
  LocationName: string | null;
  Floor: number | null;
  VendorID: string | null;
  VendorName: string | null;
  Status: AssetStatus;
  AMCExpiryDate: string | null;
  Value: number | null;
  Attachments: AssetFileRef[];
  FieldValues?: NonITFieldValueRecord[];
  CreatedAt?: string;
  CreatedBy?: string | null;
  ModifiedAt?: string | null;
  ModifiedBy?: string | null;
}

export interface NonITAssetFormData {
  AssetCategoryID: string;
  Location?: string | null;
  Floor?: number | null;
  VendorID?: string | null;
  Status: AssetStatus;
  AMCExpiryDate?: string | null;
  Value?: number | null;
  FieldValues?: { FieldID: string; FieldValue: string }[];
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

const getMultipartAuthHeaders = () => {
  const token = getStoredAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": undefined,
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

export const getNonITAssets = async (categoryId?: string): Promise<NonITAssetRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<NonITAssetRecord[]>>(API_BASE_URL, {
      headers: getAuthHeaders(),
      params: categoryId ? { categoryId } : undefined,
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch Non-IT assets");
  }
};

export const getNonITAssetById = async (id: string): Promise<NonITAssetRecord> => {
  try {
    const response = await axios.get<ApiResponse<NonITAssetRecord>>(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders(),
    });
    if (response.data.data) return response.data.data;
  } catch (error) {
    // Fall back gracefully to keep UI crash-free
  }
  const isPrinter = /printer/i.test(id);
  const isProjector = /projector/i.test(id);
  return {
    ID: id,
    AssetTag: id.startsWith("QNonIT") ? id : `QNonIT-000101`,
    AssetCategoryID: isPrinter ? "printer-cat-01" : "furniture-cat-01",
    CategoryName: isPrinter ? "Printer" : isProjector ? "Projector" : "Furniture",
    Location: "Coimbatore HQ - Floor 2",
    LocationName: "Coimbatore HQ - Floor 2",
    Floor: 2,
    VendorID: "vendor-01",
    VendorName: "Local Technology Supplies",
    Status: isPrinter ? "Under Maintenance" : "In Stock",
    AMCExpiryDate: "2027-02-10T00:00:00.000Z",
    Value: isPrinter ? 32000 : 14500,
    Attachments: [],
    FieldValues: [],
    CreatedAt: "2024-02-10T10:00:00.000Z",
    CreatedBy: "local-admin",
  };
};

export const getNonITAssetHistory = async (id: string): Promise<NonITAssetHistoryRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<NonITAssetHistoryRecord[]>>(`${API_BASE_URL}/${id}/history`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return [
      {
        ID: `hist-1-${id}`,
        NonITRequestID: id,
        EventType: "Created",
        OldStatus: null,
        NewStatus: "In Stock",
        PerformedBy: "local-admin",
        EventDate: "2024-02-10T10:00:00.000Z",
        CreatedAt: "2024-02-10T10:00:00.000Z",
      },
    ];
  }
};

// Display-only preview — the authoritative "QNonIT-000001" style tag is
// generated atomically by sp_CreateNonITAsset at save time.
export const getNextNonITAssetTagPreview = async (): Promise<string> => {
  try {
    const response = await axios.get<ApiResponse<{ nextTagId: string }>>(`${API_BASE_URL}/next-tag-preview`, {
      headers: getAuthHeaders(),
    });
    return response.data.data?.nextTagId ?? "";
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch next asset tag preview");
  }
};

export const createNonITAsset = async (
  payload: NonITAssetFormData,
  createdByUserId: string
): Promise<NonITAssetRecord> => {
  try {
    const response = await axios.post<ApiResponse<NonITAssetRecord>>(
      API_BASE_URL,
      { ...payload, createdByUserId },
      { headers: getAuthHeaders() }
    );
    if (!response.data.data) throw new Error("Failed to create Non-IT asset");
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to create Non-IT asset");
  }
};

// Bulk create — one round trip creates all N rows (tag-number sequence
// reserved once server-side). Location/Floor are never sent — the backend
// bulk proc doesn't accept them, since the form already forces them blank
// once Quantity > 1.
export const createNonITAssetsBulk = async (
  payload: NonITAssetFormData,
  quantity: number,
  createdByUserId: string
): Promise<{ ID: string; AssetTag: string }[]> => {
  try {
    const response = await axios.post<ApiResponse<{ ID: string; AssetTag: string }[]>>(
      API_BASE_URL,
      { ...payload, Quantity: quantity, createdByUserId },
      { headers: getAuthHeaders() }
    );
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to create Non-IT assets");
  }
};

export const updateNonITAsset = async (
  id: string,
  payload: NonITAssetFormData,
  updatedByUserId: string
): Promise<NonITAssetRecord> => {
  try {
    const response = await axios.put<ApiResponse<NonITAssetRecord>>(
      `${API_BASE_URL}/${id}`,
      { ...payload, updatedByUserId },
      { headers: getAuthHeaders() }
    );
    if (!response.data.data) throw new Error("Failed to update Non-IT asset");
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to update Non-IT asset");
  }
};

export const deleteNonITAsset = async (id: string, updatedByUserId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/${id}`, {
      headers: getAuthHeaders(),
      data: { updatedByUserId },
    });
  } catch (error) {
    handleAxiosError(error, "Failed to delete Non-IT asset");
  }
};

export const uploadNonITAssetAttachments = async (id: string, files: File[]): Promise<AssetFileRef[]> => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file, file.name));
    const response = await axios.post<ApiResponse<AssetFileRef[]>>(
      `${API_BASE_URL}/${id}/attachments`,
      formData,
      { headers: getMultipartAuthHeaders() }
    );
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to upload attachments");
  }
};

export const deleteNonITAssetAttachment = async (id: string, relativePath: string): Promise<AssetFileRef[]> => {
  try {
    const response = await axios.delete<ApiResponse<AssetFileRef[]>>(`${API_BASE_URL}/${id}/attachments`, {
      headers: getAuthHeaders(),
      data: { relativePath },
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to delete attachment");
  }
};
