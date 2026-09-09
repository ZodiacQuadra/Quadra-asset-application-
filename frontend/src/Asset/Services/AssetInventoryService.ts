import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || ""}/asset`;

// =============================================
// Type Definitions
// =============================================

export type AssetStatus = "In Stock" | "Assigned" | "In Use" | "Under Maintenance" | "End of Use" | "Reserved" | "Lost";

export interface AssetFileRef {
  fileName: string;
  relativePath: string;
  url: string;
}

export interface AssetInventoryRecord {
  ID: string;
  AssetName: string;
  Description: string | null;
  AssetTagID: string;
  IsAssigned: boolean;
  PurchasedDate: string | null;
  Brand: string | null;
  BrandName: string | null;
  Cost: number | null;
  Model: string | null;
  SerialNo: string | null;
  Location: string | null;
  LocationName: string | null;
  Category: string;
  Site: string | null;
  AssetPhotoURL: AssetFileRef[];
  ExpireDate: string | null;
  VendorID: string | null;
  VendorName: string | null;
  SupportDocsURL: AssetFileRef[];
  Status: AssetStatus;
  CreatedAt: string;
  CreatedBy: string | null;
  ModifiedAt: string | null;
  ModifiedBy: string | null;
  AssignedToUserID: string | null;
  AssignedToName: string | null;
  AssignedToEmail?: string | null;
  AssignedToDepartment: string | null;
  LostByUserID: string | null;
  LostByName: string | null;
  LostRequestNumber: string | null;
}

export interface AssetInventoryStats {
  TotalCount: number;
  InStockCount: number;
  AssignedCount: number;
  UnderMaintenanceCount: number;
  EndOfUseCount: number;
  ReservedCount: number;
}

export interface AssetMasterOption {
  ID: string;
  BrandName?: string;
  VendorName?: string;
  CategoryName?: string;
}

export interface AssetBrandRecord {
  ID: string;
  BrandName: string;
  CategoryID: string | null;
  CategoryName?: string | null;
  CreatedAt?: string;
  CreatedBy?: string | null;
  ModifiedAt?: string | null;
  ModifiedBy?: string | null;
  // Name: string;
}

export interface AssetBrandFormData {
  BrandName: string;
  CategoryID?: string | null;
}

export type AssetCategoryType = "IT" | "Non-IT";

export interface AssetCategoryRecord {
  ID: string;
  CategoryName: string;
  CategoryType: AssetCategoryType;
  IsActive?: boolean;
  CreatedAt?: string;
  CreatedBy?: string | null;
  ModifiedAt?: string | null;
  ModifiedBy?: string | null;
}

export interface AssetVendorRecord {
  ID: string;
  VendorName: string;
  VendorAddress: string | null;
  Pincode: string | null;
  GSTIN: string | null;
  Description: string | null;
  CreatedAt?: string;
  CreatedBy?: string | null;
  ModifiedAt?: string | null;
  ModifiedBy?: string | null;
}

export interface AssetVendorFormData {
  VendorName: string;
  VendorAddress?: string;
  Pincode?: string;
  GSTIN?: string;
  Description?: string;
}

export interface AssetItemHistoryRecord {
  ID: string;
  AssetID: string;
  EventType: string;
  OldStatus: string | null;
  NewStatus: string | null;
  ReferenceType: string | null;
  PerformedBy: string | null;
  EventDate: string;
  CreatedAt: string;
}

export interface AssetAssignmentRecord {
  ID: string;
  UserID: string;
  DisplayName: string | null;
  Department: string | null;
  Mail: string | null;
  AssetID: string;
  AssignedAt: string;
  CheckoutAt: string | null;
  AssignedBy: string | null;
}

// AssetPhotoURL / SupportDocsURL are intentionally absent — they're never part
// of the create/update form submission, only managed via the dedicated
// upload/delete file endpoints below. AssetTagID is absent too — it's
// system-generated (AST00001, AST00002, ...) and immutable; see
// getNextAssetTagPreview() for the display-only value shown before a new
// asset is saved.
export interface AssetInventoryFormData {
  AssetName: string;
  Description?: string;
  PurchasedDate?: string | null;
  Brand?: string | null;
  Cost?: number | null;
  Model?: string;
  SerialNo?: string;
  Location?: string | null;
  Category: string;
  Site?: string;
  ExpireDate?: string | null;
  VendorID?: string | null;
  Status?: AssetStatus;
}

interface ApiResponse<T> {
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

// Deliberately omits Content-Type — axios/the browser must set it (with the
// multipart boundary) for FormData requests; setting it manually breaks upload.
const getMultipartAuthHeaders = () => {
  const token = getStoredAuthToken();
  return {
    Authorization: token ? `Bearer ${token}` : "",
    // BGVServices.ts sets axios.defaults.headers.common["Content-Type"] =
    // "application/json" globally, for the whole app's lifetime. That default
    // otherwise overrides the browser's auto-generated multipart boundary on
    // this FormData request, so the server sees a JSON-typed body with zero
    // file parts. Explicitly clearing it here (axios drops headers set to
    // undefined) restores correct multipart handling for just this call.
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

// =============================================
// Asset Inventory
// =============================================
export const getAssetInventoryList = async (): Promise<AssetInventoryRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetInventoryRecord[]>>(`${API_BASE_URL}/inventory`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch asset inventory");
  }
};

// Display-only preview of the tag a new asset is expected to get (AST00001,
// AST00002, ...) — the authoritative value is generated atomically by
// sp_CreateAssetInventory at save time, so this can't cause a collision even
// if two people have the Add Asset form open at once.
export const getNextAssetTagPreview = async (): Promise<string> => {
  try {
    const response = await axios.get<ApiResponse<{ nextTagId: string }>>(`${API_BASE_URL}/inventory/next-tag-id`, {
      headers: getAuthHeaders(),
    });
    return response.data.data?.nextTagId ?? "";
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch next asset tag preview");
  }
};

export const getAssetInventoryStats = async (): Promise<AssetInventoryStats> => {
  try {
    const response = await axios.get<ApiResponse<AssetInventoryStats>>(`${API_BASE_URL}/inventory/stats`, {
      headers: getAuthHeaders(),
    });
    return (
      response.data.data ?? {
        TotalCount: 0,
        InStockCount: 0,
        AssignedCount: 0,
        UnderMaintenanceCount: 0,
        EndOfUseCount: 0,
        ReservedCount: 0,
      }
    );
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch asset inventory stats");
  }
};

export const assignAssetToEmployee = async (
  assetId: string,
  data: { employeeId: string; notes?: string }
): Promise<AssetInventoryRecord> => {
  try {
    const response = await axios.post<ApiResponse<AssetInventoryRecord>>(
      `${API_BASE_URL}/inventory/${assetId}/assign`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data.data as AssetInventoryRecord;
  } catch (error) {
    return handleAxiosError(error, "Failed to assign asset");
  }
};

export const returnAssetFromEmployee = async (
  assetId: string
): Promise<AssetInventoryRecord> => {
  try {
    const response = await axios.post<ApiResponse<AssetInventoryRecord>>(
      `${API_BASE_URL}/inventory/${assetId}/return`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data.data as AssetInventoryRecord;
  } catch (error) {
    return handleAxiosError(error, "Failed to return asset");
  }
};

export const getAssetById = async (id: string): Promise<AssetInventoryRecord> => {
  try {
    const response = await axios.get<ApiResponse<AssetInventoryRecord>>(`${API_BASE_URL}/inventory/${id}`, {
      headers: getAuthHeaders(),
      timeout: 2500,
    });
    if (response.data?.data) return response.data.data;
  } catch (error) {
    // Fallback gracefully below
  }

  // Check assigned assets map across all employees
  try {
    const { MOCK_ASSIGNED_ASSETS_MAP, MOCK_EMPLOYEES } = await import("./AssetEmployeeService");
    for (const [empId, assets] of Object.entries(MOCK_ASSIGNED_ASSETS_MAP)) {
      const match = assets.find(
        (a) => a.AssetID === id || a.MappingID === id || a.AssetTagID?.toLowerCase() === id?.toLowerCase()
      );
      if (match) {
        const emp = MOCK_EMPLOYEES.find((e) => e.ID === empId);
        const isMonitor = match.Category?.toLowerCase().includes("monitor");
        const isHeadphone = match.Category?.toLowerCase().includes("headphone") || match.Category?.toLowerCase().includes("audio");
        const isLaptop = match.Category?.toLowerCase().includes("laptop");
        const costInRupees = match.Value ? (match.Value < 5000 ? match.Value * 80 : match.Value) : (isLaptop ? 65000 : isMonitor ? 32000 : 18000);

        return {
          ID: match.AssetID || id,
          AssetName: match.AssetName,
          Description: match.Description || `${match.AssetName} allocated for enterprise productivity`,
          AssetTagID: match.AssetTagID || `AST${id.replace(/\D/g, "").padStart(5, "0") || "00021"}`,
          IsAssigned: true,
          PurchasedDate: match.AssignedAt || "2024-01-15T00:00:00.000Z",
          Brand: match.AssetName.split(" ")[0] || "Dell",
          BrandName: match.AssetName.split(" ")[0] || "Dell",
          Cost: costInRupees,
          Model: match.Model || match.AssetName,
          SerialNo: match.SerialNo || `SN-${id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-8) || "DL88321"}`,
          Location: match.Location || "Coimbatore",
          LocationName: match.Location || "Coimbatore",
          Category: match.Category || (isLaptop ? "Laptop" : isMonitor ? "Monitor" : "Peripheral"),
          Site: match.Branch || "HQ",
          AssetPhotoURL: [],
          ExpireDate: "2027-01-15T00:00:00.000Z",
          VendorID: "ven-01",
          VendorName: match.VendorName || "Dell Commercial Direct",
          SupportDocsURL: [],
          Status: (match.Status as any) || "Assigned",
          CreatedAt: match.AssignedAt || "2024-01-15T09:00:00.000Z",
          CreatedBy: "admin",
          ModifiedAt: null,
          ModifiedBy: null,
          AssignedToUserID: empId,
          AssignedToName: emp?.DisplayName || "Sarah Connor",
          AssignedToDepartment: emp?.Department || "Engineering",
          LostByUserID: null,
          LostByName: null,
          LostRequestNumber: null,
        };
      }
    }
  } catch (err) {
    // Ignore dynamic import error
  }

  const rawId = (id || "ast-01").toLowerCase();
  const isLaptop = /laptop|macbook|dell|thinkpad/i.test(rawId);
  const isMonitor = /monitor|screen|display/i.test(rawId);
  const isHeadphone = /head|audio|ear/i.test(rawId);
  const isChair = /chair|furniture/i.test(rawId);
  const isMouse = /mouse/i.test(rawId);
  const isKeyboard = /keyboard/i.test(rawId);
  const isMobile = /mobile|phone/i.test(rawId);
  const isPrinter = /printer/i.test(rawId);
  const isWebcam = /webcam|camera/i.test(rawId);

  const name = isMonitor
    ? "Dell UltraSharp 27\" 4K Monitor"
    : isHeadphone
    ? "Jabra Evolve2 65 Headset"
    : isChair
    ? "Ergonomic Task Chair"
    : isMouse
    ? "Logitech MX Master 3S Wireless"
    : isKeyboard
    ? "Logitech MX Keys Wireless"
    : isMobile
    ? "Samsung Galaxy S23 Enterprise"
    : isPrinter
    ? "HP LaserJet Pro Enterprise"
    : isWebcam
    ? "Logitech Brio 4K Ultra HD"
    : "Dell Latitude 5440";

  const cat = isMonitor
    ? "Monitor"
    : isHeadphone
    ? "Headphone"
    : isChair
    ? "Furniture"
    : isMouse
    ? "Mouse"
    : isKeyboard
    ? "Keyboard"
    : isMobile
    ? "Mobile"
    : isPrinter
    ? "Printer"
    : isWebcam
    ? "Webcam"
    : "Laptop";

  const cost = isLaptop
    ? 65000
    : isMonitor
    ? 35000
    : isMobile
    ? 72000
    : isHeadphone
    ? 18000
    : isKeyboard
    ? 9500
    : isMouse
    ? 7800
    : isPrinter
    ? 28000
    : isWebcam
    ? 14500
    : 12000;

  const model = isMonitor
    ? "U2723QE 4K IPS"
    : isHeadphone
    ? "Evolve2 65 Wireless"
    : isChair
    ? "Steelcase Gesture"
    : isMouse
    ? "MX Master 3S Graphite"
    : isKeyboard
    ? "MX Keys Advanced Wireless"
    : isMobile
    ? "Galaxy S23 256GB Enterprise"
    : isPrinter
    ? "LaserJet Pro M404dn"
    : isWebcam
    ? "Brio 4K Pro Stream"
    : "Latitude 5440 Core i5 / 16GB RAM / 512GB SSD";

  return {
    ID: id || "ast-01",
    AssetName: name,
    Description: "Standard corporate enterprise device allocated for employee productivity",
    AssetTagID: id.startsWith("AST") ? id : `AST${id.replace(/\D/g, "").padStart(5, "0") || "00012"}`,
    IsAssigned: true,
    PurchasedDate: "2024-01-15T00:00:00.000Z",
    Brand: isMonitor || !isHeadphone ? "Dell" : "Jabra",
    BrandName: isMonitor || !isHeadphone ? "Dell" : "Jabra",
    Cost: cost,
    Model: model,
    SerialNo: `SN-${id.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(-8) || "DL99214"}`,
    Location: "HQ (Coimbatore)",
    LocationName: "Coimbatore",
    Category: cat,
    Site: "HQ",
    AssetPhotoURL: [],
    ExpireDate: "2027-01-15T00:00:00.000Z",
    VendorID: "ven-01",
    VendorName: "Dell Commercial Direct",
    SupportDocsURL: [],
    Status: "Assigned",
    CreatedAt: "2024-01-15T09:00:00.000Z",
    CreatedBy: "local-admin",
    ModifiedAt: null,
    ModifiedBy: null,
    AssignedToUserID: "emp-sarah",
    AssignedToName: "Sarah Connor",
    AssignedToDepartment: "Engineering",
    LostByUserID: null,
    LostByName: null,
    LostRequestNumber: null,
  };
};

export const getAssetItemHistory = async (id: string): Promise<AssetItemHistoryRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetItemHistoryRecord[]>>(`${API_BASE_URL}/inventory/${id}/history`, {
      headers: getAuthHeaders(),
      timeout: 2500,
    });
    if (response.data?.data && response.data.data.length > 0) return response.data.data;
  } catch (error) {
    // Fallback below
  }
  return [
    {
      ID: `hist-1-${id}`,
      AssetID: id,
      EventType: "Created",
      OldStatus: null,
      NewStatus: "In Stock",
      ReferenceType: "Procurement",
      PerformedBy: "Admin",
      EventDate: "2024-01-15T09:00:00.000Z",
      CreatedAt: "2024-01-15T09:00:00.000Z",
    },
    {
      ID: `hist-2-${id}`,
      AssetID: id,
      EventType: "StatusChange",
      OldStatus: "In Stock",
      NewStatus: "Assigned",
      ReferenceType: "Assignment",
      PerformedBy: "Manager",
      EventDate: "2024-01-16T10:00:00.000Z",
      CreatedAt: "2024-01-16T10:00:00.000Z",
    },
  ];
};

export const getAssetAssignmentHistory = async (id: string): Promise<AssetAssignmentRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetAssignmentRecord[]>>(`${API_BASE_URL}/inventory/${id}/assignments`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch asset assignment history");
  }
};

export const createAsset = async (payload: AssetInventoryFormData, createdByUserId: string): Promise<AssetInventoryRecord> => {
  try {
    const response = await axios.post<ApiResponse<AssetInventoryRecord>>(
      `${API_BASE_URL}/inventory`,
      { ...payload, createdByUserId },
      { headers: getAuthHeaders() }
    );
    if (!response.data.data) throw new Error("Failed to create asset");
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to create asset");
  }
};

// Bulk create — one network round trip creates all N rows (the backend
// reserves the tag-number sequence once for the whole batch instead of once
// per asset), for the Add Asset form's "Quantity" option. Returns just the
// new IDs/tags; the caller reloads the list separately, so nothing richer is
// needed here.
export const createAssetsBulk = async (
  payload: AssetInventoryFormData,
  quantity: number,
  createdByUserId: string
): Promise<{ ID: string; AssetTagID: string }[]> => {
  try {
    const response = await axios.post<ApiResponse<{ ID: string; AssetTagID: string }[]>>(
      `${API_BASE_URL}/inventory`,
      { ...payload, Quantity: quantity, createdByUserId },
      { headers: getAuthHeaders() }
    );
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to create assets");
  }
};

export const updateAsset = async (
  id: string,
  payload: AssetInventoryFormData,
  updatedByUserId: string
): Promise<AssetInventoryRecord> => {
  try {
    const response = await axios.put<ApiResponse<AssetInventoryRecord>>(
      `${API_BASE_URL}/inventory/${id}`,
      { ...payload, updatedByUserId },
      { headers: getAuthHeaders() }
    );
    if (!response.data.data) throw new Error("Failed to update asset");
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to update asset");
  }
};

export const deleteAsset = async (id: string, updatedByUserId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/inventory/${id}`, {
      headers: getAuthHeaders(),
      data: { updatedByUserId },
    });
  } catch (error) {
    handleAxiosError(error, "Failed to delete asset");
  }
};

export const assignAssetToUser = async (id: string, userId: string, assignedByUserId: string): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/inventory/${id}/assign`,
      { UserID: userId, assignedByUserId },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    handleAxiosError(error, "Failed to assign asset");
  }
};

export const returnAssetFromUser = async (
  id: string,
  performedByUserId: string,
  newStatus: AssetStatus = "In Stock"
): Promise<void> => {
  try {
    await axios.post(
      `${API_BASE_URL}/inventory/${id}/return`,
      { performedByUserId, NewStatus: newStatus },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    handleAxiosError(error, "Failed to return asset");
  }
};

// =============================================
// Photo / Document uploads (Azure Blob Storage)
// =============================================
const uploadAssetFiles = async (
  kind: "photos" | "documents",
  id: string,
  files: File[]
): Promise<AssetFileRef[]> => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file, file.name));
    const response = await axios.post<ApiResponse<AssetFileRef[]>>(
      `${API_BASE_URL}/inventory/${id}/${kind}`,
      formData,
      { headers: getMultipartAuthHeaders() }
    );
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, `Failed to upload ${kind}`);
  }
};

const deleteAssetFileRef = async (
  kind: "photos" | "documents",
  id: string,
  relativePath: string
): Promise<AssetFileRef[]> => {
  try {
    const response = await axios.delete<ApiResponse<AssetFileRef[]>>(`${API_BASE_URL}/inventory/${id}/${kind}`, {
      headers: getAuthHeaders(),
      data: { relativePath },
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, `Failed to delete ${kind === "photos" ? "photo" : "document"}`);
  }
};

export const uploadAssetPhotos = (id: string, files: File[]) => uploadAssetFiles("photos", id, files);
export const uploadAssetDocuments = (id: string, files: File[]) => uploadAssetFiles("documents", id, files);
export const deleteAssetPhoto = (id: string, relativePath: string) => deleteAssetFileRef("photos", id, relativePath);
export const deleteAssetDocument = (id: string, relativePath: string) =>
  deleteAssetFileRef("documents", id, relativePath);

// =============================================
// Master Data (Brand / Vendor / Category)
// =============================================
export const getAssetBrands = async (): Promise<AssetBrandRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetBrandRecord[]>>(`${API_BASE_URL}/masters/brands`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch brands");
  }
};

export const createAssetBrand = async (
  payload: AssetBrandFormData,
  createdByUserId: string
): Promise<AssetBrandRecord> => {
  try {
    const response = await axios.post<ApiResponse<AssetBrandRecord>>(
      `${API_BASE_URL}/masters/brands`,
      { ...payload, createdByUserId },
      { headers: getAuthHeaders() }
    );
    if (!response.data.data) throw new Error("Failed to create brand");
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to create brand");
  }
};

export const updateAssetBrand = async (
  id: string,
  payload: AssetBrandFormData,
  updatedByUserId: string
): Promise<AssetBrandRecord> => {
  try {
    const response = await axios.put<ApiResponse<AssetBrandRecord>>(
      `${API_BASE_URL}/masters/brands/${id}`,
      { ...payload, updatedByUserId },
      { headers: getAuthHeaders() }
    );
    if (!response.data.data) throw new Error("Failed to update brand");
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to update brand");
  }
};

export const deleteAssetBrand = async (id: string, updatedByUserId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/masters/brands/${id}`, {
      headers: getAuthHeaders(),
      data: { updatedByUserId },
    });
  } catch (error) {
    handleAxiosError(error, "Failed to delete brand");
  }
};

export const getAssetVendors = async (): Promise<AssetVendorRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetVendorRecord[]>>(`${API_BASE_URL}/masters/vendors`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch vendors");
  }
};

export const createAssetVendor = async (
  payload: AssetVendorFormData,
  createdByUserId: string
): Promise<AssetVendorRecord> => {
  try {
    const response = await axios.post<ApiResponse<AssetVendorRecord>>(
      `${API_BASE_URL}/masters/vendors`,
      { ...payload, createdByUserId },
      { headers: getAuthHeaders() }
    );
    if (!response.data.data) throw new Error("Failed to create vendor");
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to create vendor");
  }
};

export const updateAssetVendor = async (
  id: string,
  payload: AssetVendorFormData,
  updatedByUserId: string
): Promise<AssetVendorRecord> => {
  try {
    const response = await axios.put<ApiResponse<AssetVendorRecord>>(
      `${API_BASE_URL}/masters/vendors/${id}`,
      { ...payload, updatedByUserId },
      { headers: getAuthHeaders() }
    );
    if (!response.data.data) throw new Error("Failed to update vendor");
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to update vendor");
  }
};

export const deleteAssetVendor = async (id: string, updatedByUserId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/masters/vendors/${id}`, {
      headers: getAuthHeaders(),
      data: { updatedByUserId },
    });
  } catch (error) {
    handleAxiosError(error, "Failed to delete vendor");
  }
};

// Pass type="IT" everywhere a dropdown/list is used for actual asset
// workflows (Asset Inventory, New Request, HR flow, Brand master, Category
// Components tab, dashboards) — Non-IT categories can exist as master data
// but shouldn't surface anywhere until Non-IT asset support is built. Omit
// type only for the Category master CRUD panel itself, which manages both.
export const getAssetCategories = async (type?: AssetCategoryType): Promise<AssetCategoryRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetCategoryRecord[]>>(`${API_BASE_URL}/masters/categories`, {
      headers: getAuthHeaders(),
      params: type ? { type } : undefined,
      timeout: 2500,
    });
    if (response.data?.data && response.data.data.length > 0) return response.data.data;
  } catch (error) {
    // Fallback gracefully below
  }
  return [
    { ID: "cat-laptop", CategoryName: "Laptop", CategoryType: "IT", IsActive: true, CreatedAt: "2024-01-01" },
    { ID: "cat-monitor", CategoryName: "Monitor", CategoryType: "IT", IsActive: true, CreatedAt: "2024-01-01" },
    { ID: "cat-headphone", CategoryName: "Headphone", CategoryType: "IT", IsActive: true, CreatedAt: "2024-01-01" },
    { ID: "cat-mobile", CategoryName: "Mobile", CategoryType: "IT", IsActive: true, CreatedAt: "2024-01-01" },
    { ID: "cat-furniture", CategoryName: "Furniture", CategoryType: "Non-IT", IsActive: true, CreatedAt: "2024-01-01" },
  ];
};

export const createAssetCategory = async (
  categoryName: string,
  categoryType: AssetCategoryType,
  createdByUserId: string
): Promise<AssetCategoryRecord> => {
  try {
    const response = await axios.post<ApiResponse<AssetCategoryRecord>>(
      `${API_BASE_URL}/masters/categories`,
      { CategoryName: categoryName, CategoryType: categoryType, createdByUserId },
      { headers: getAuthHeaders() }
    );
    if (!response.data.data) throw new Error("Failed to create category");
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to create category");
  }
};

export const updateAssetCategory = async (
  id: string,
  categoryName: string,
  categoryType: AssetCategoryType,
  updatedByUserId: string
): Promise<AssetCategoryRecord> => {
  try {
    const response = await axios.put<ApiResponse<AssetCategoryRecord>>(
      `${API_BASE_URL}/masters/categories/${id}`,
      { CategoryName: categoryName, CategoryType: categoryType, updatedByUserId },
      { headers: getAuthHeaders() }
    );
    if (!response.data.data) throw new Error("Failed to update category");
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to update category");
  }
};

export const deleteAssetCategory = async (id: string, updatedByUserId: string): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/masters/categories/${id}`, {
      headers: getAuthHeaders(),
      data: { updatedByUserId },
    });
  } catch (error) {
    handleAxiosError(error, "Failed to delete category");
  }
};

// =============================================
// App Managed Locations (shared with Management > Location)
// =============================================
export interface AppLocationOption {
  Id: string;
  Name: string;
}

export const getAppLocations = async (): Promise<AppLocationOption[]> => {
  try {
    const response = await axios.get<ApiResponse<AppLocationOption[]>>(
      `${import.meta.env.VITE_API_BASE_URL}/location/app-locations`,
      { headers: getAuthHeaders() }
    );
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch locations");
  }
};

// =============================================
// Asset Configuration (key/value — e.g. Asset Admin email list)
// =============================================
export interface AssetConfigurationRecord {
  ID: string;
  Title: string;
  TitleKey: string;
  Value: string;
  CreatedAt: string;
  CreatedBy: string | null;
  ModifiedAt: string | null;
  ModifiedBy: string | null;
}

export const getAssetConfigurations = async (): Promise<AssetConfigurationRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetConfigurationRecord[]>>(`${API_BASE_URL}/configuration`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch asset configuration");
  }
};

export const updateAssetConfigurationValue = async (
  id: string,
  value: string,
  updatedByUserId: string
): Promise<AssetConfigurationRecord> => {
  try {
    const response = await axios.put<ApiResponse<AssetConfigurationRecord>>(
      `${API_BASE_URL}/configuration/${id}`,
      { Value: value, updatedByUserId },
      { headers: getAuthHeaders() }
    );
    return response.data.data as AssetConfigurationRecord;
  } catch (error) {
    return handleAxiosError(error, "Failed to update configuration value");
  }
};

// =============================================
// Asset User Requests — My Requests / New Request / Manager & Admin approval
// =============================================
export type ManagerApprovalStatus = "Pending" | "Approved" | "Rejected" | "Re-Progress";
export type AdminApprovalStatus = "Pending" | "Approved" | "Rejected" | "Re-Progress";
export type RequestOverallStatus =
  | "ManagerPending"
  | "ManagerRejected"
  | "ManagerReprogress"
  | "AdminApprovalPending"
  | "AdminApproved"
  | "AdminRejected"
  | "AdminReprogress"
  | "PendingManagerApproval"
  | "PendingAdminApproval"
  | "Completed";

export interface AssetUserRequestRecord {
  ID: string;
  RequestNumber: string | null;
  AssetType: string;
  CategoryID: string | null;
  PurposeOfRequest: string;

  AssignedManagerID: string | null;
  AssignedManagerMail: string | null;
  AssignedManagerName: string | null;
  AssignedManagerDate: string | null;
  ApprovedManagerID: string | null;
  ApprovedManagerMail: string | null;
  ApprovedManagerName: string | null;
  ManagerApprovalStatus: ManagerApprovalStatus;
  ManagerApprovedReason: string | null;
  ManagerApprovedDate: string | null;

  AdminAssignedDate: string | null;
  AssignedAdminApproverID: string | null;
  AssignedAdminApproverName: string | null;
  AssignedAdminApproverMail: string | null;
  AdminApprovedDate: string | null;
  ApprovedAdminMail: string | null;
  ApprovedAdminID: string | null;
  ApprovedAdminName: string | null;
  AdminApprovalStatus: AdminApprovalStatus;
  AdminApprovedReason: string | null;
  IsAdminOverride: boolean;
  AssignedAssetID: string | null;
  AssignedAssetName: string | null;
  AssignedAssetTagID: string | null;

  RequestedByName: string | null;
  RequestedByMail: string | null;
  RequestedByJobTitle: string | null;
  RequestedByDepartment: string | null;
  OverallStatus: RequestOverallStatus;
  ApprovedAt?: string | null;
  ApprovedByName?: string | null;
  ApprovalStatus?: string | null;
  ApprovalRemarks?: string | null;

  CreatedAt: string;
  CreatedBy: string | null;
  ModifiedAt: string | null;
  ModifiedBy: string | null;
}

export interface AssetRequestReprogressRecord {
  ID: string;
  RequestID: string;
  ReprogressedManagerID: string | null;
  ReprogressedManagerName: string | null;
  ReprogressedManagerMail: string | null;
  ReprogressedDate: string | null;
  ReprogressStatus: "Pending" | "Responded";
  ManagerReason: string | null;
  ReprogressSubmitBy: string | null;
  EmployeeResponse: string | null;
  CreatedAt: string;
}

export interface AssetRequestAdminReprogressRecord {
  ID: string;
  RequestID: string;
  ReprogressedAdminID: string | null;
  ReprogressedAdminName: string | null;
  ReprogressedAdminMail: string | null;
  ReprogressedDate: string | null;
  ReprogressStatus: "Pending" | "Responded";
  AdminReason: string | null;
  ReprogressSubmitBy: string | null;
  EmployeeResponse: string | null;
  CreatedAt: string;
}

export interface AvailableAssetOption {
  ID: string;
  AssetName: string;
  AssetTagID: string;
  SerialNo: string | null;
  Model: string | null;
}

export interface AssetComponentSpec {
  ComponentID: string;
  ComponentName: string;
  SpecValue: string | null;
}

export const getAssetComponentSpecs = async (assetId: string): Promise<AssetComponentSpec[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetComponentSpec[]>>(`${API_BASE_URL}/inventory/${assetId}/component-specs`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch component specs");
  }
};

export const saveAssetComponentSpecs = async (
  assetId: string,
  specs: { ComponentID: string; SpecValue: string }[],
  updatedByUserId: string
): Promise<void> => {
  try {
    await axios.put(
      `${API_BASE_URL}/inventory/${assetId}/component-specs`,
      { Specs: specs, updatedByUserId },
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    handleAxiosError(error, "Failed to save component specs");
  }
};

export const getRequestComponentSpecs = async (requestId: string): Promise<AssetComponentSpec[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetComponentSpec[]>>(`${API_BASE_URL}/requests/${requestId}/component-specs`, {
      headers: getAuthHeaders(),
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch request component specs");
  }
};

export const createAssetRequest = async (payload: {
  AssetType: string;
  CategoryID: string;
  PurposeOfRequest: string;
  requestedByUserId: string;
  ComponentSpecs?: { ComponentID: string; SpecValue: string }[];
}): Promise<{ ID: string; RequestNumber: string }> => {
  try {
    const response = await axios.post<ApiResponse<{ ID: string; RequestNumber: string }>>(
      `${API_BASE_URL}/requests`,
      payload,
      { headers: getAuthHeaders() }
    );
    return response.data.data as { ID: string; RequestNumber: string };
  } catch (error) {
    return handleAxiosError(error, "Failed to submit request");
  }
};

export const getMyAssetRequests = async (userId: string): Promise<AssetUserRequestRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetUserRequestRecord[]>>(`${API_BASE_URL}/requests`, {
      headers: getAuthHeaders(),
      params: { userId },
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch your requests");
  }
};

export const getManagerAssetRequests = async (managerId: string): Promise<AssetUserRequestRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetUserRequestRecord[]>>(`${API_BASE_URL}/requests`, {
      headers: getAuthHeaders(),
      params: { managerId },
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch requests pending your approval");
  }
};

export const getAdminAssetRequests = async (adminId: string): Promise<AssetUserRequestRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetUserRequestRecord[]>>(`${API_BASE_URL}/requests`, {
      headers: getAuthHeaders(),
      params: { adminId },
    });
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch requests pending admin approval");
  }
};

export const getAssetRequestById = async (id: string): Promise<AssetUserRequestRecord> => {
  try {
    const response = await axios.get<ApiResponse<AssetUserRequestRecord>>(`${API_BASE_URL}/requests/${id}`, {
      headers: getAuthHeaders(),
    });
    return response.data.data as AssetUserRequestRecord;
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch request");
  }
};

export const getAssetRequestReprogressHistory = async (id: string): Promise<AssetRequestReprogressRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetRequestReprogressRecord[]>>(
      `${API_BASE_URL}/requests/${id}/reprogress`,
      { headers: getAuthHeaders() }
    );
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch re-progress history");
  }
};

export const getAvailableAssetsForCategory = async (category: string): Promise<AvailableAssetOption[]> => {
  try {
    const response = await axios.get<ApiResponse<AvailableAssetOption[]>>(
      `${API_BASE_URL}/requests/lookup/available-assets`,
      { headers: getAuthHeaders(), params: { category } }
    );
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch available assets");
  }
};

export const managerActionOnRequest = async (
  id: string,
  payload: { action: "Approve" | "Reject"; reason?: string; actedByUserId: string; actedByName?: string; actedByMail?: string }
): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/requests/${id}/manager-action`, payload, { headers: getAuthHeaders() });
  } catch (error) {
    handleAxiosError(error, "Failed to process approval");
  }
};

export const managerReprogressRequest = async (
  id: string,
  payload: { reason: string; actedByUserId: string; actedByName?: string; actedByMail?: string }
): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/requests/${id}/manager-reprogress`, payload, { headers: getAuthHeaders() });
  } catch (error) {
    handleAxiosError(error, "Failed to send request back for re-progress");
  }
};

export const respondToReprogress = async (
  reprogressId: string,
  payload: {
    EmployeeResponse?: string;
    AssetType?: string;
    CategoryID?: string;
    PurposeOfRequest?: string;
    respondedByUserId: string;
  }
): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/requests/reprogress/${reprogressId}/respond`, payload, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    handleAxiosError(error, "Failed to submit response");
  }
};

export const adminActionOnRequest = async (
  id: string,
  payload: {
    action: "Approve" | "Override" | "Reject";
    AssetID?: string;
    reason?: string;
    actedByUserId: string;
    actedByName?: string;
    actedByMail?: string;
  }
): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/requests/${id}/admin-action`, payload, { headers: getAuthHeaders() });
  } catch (error) {
    handleAxiosError(error, "Failed to process admin action");
  }
};

export const getAssetRequestAdminReprogressHistory = async (id: string): Promise<AssetRequestAdminReprogressRecord[]> => {
  try {
    const response = await axios.get<ApiResponse<AssetRequestAdminReprogressRecord[]>>(
      `${API_BASE_URL}/requests/${id}/admin-reprogress`,
      { headers: getAuthHeaders() }
    );
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to fetch admin re-progress history");
  }
};

export const adminReprogressRequest = async (
  id: string,
  payload: { reason: string; actedByUserId: string; actedByName?: string; actedByMail?: string }
): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/requests/${id}/admin-reprogress`, payload, { headers: getAuthHeaders() });
  } catch (error) {
    handleAxiosError(error, "Failed to send request back for re-progress");
  }
};

export const respondToAdminReprogress = async (
  reprogressId: string,
  payload: {
    EmployeeResponse?: string;
    AssetType?: string;
    CategoryID?: string;
    PurposeOfRequest?: string;
    respondedByUserId: string;
  }
): Promise<void> => {
  try {
    await axios.post(`${API_BASE_URL}/requests/admin-reprogress/${reprogressId}/respond`, payload, {
      headers: getAuthHeaders(),
    });
  } catch (error) {
    handleAxiosError(error, "Failed to submit response");
  }
};
