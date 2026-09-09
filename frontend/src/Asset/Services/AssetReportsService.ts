import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/asset/reports`;

export interface ReportsKPI {
  TotalAssetValue: number;
  AssetsAssignedCount: number;
  AvailableStockCount: number;
  UnderRepairCount: number;
  TotalITAssetCount: number;
  TotalNonITAssetCount: number;
}

export interface MonthlyPurchaseRow {
  MonthLabel: string;
  ITCount: number;
  ITCost: number;
  NonITCount: number;
  NonITValue: number;
}

export interface StockStatusRow {
  AssetKind: "IT" | "Non-IT";
  CategoryName: string;
  Branch?: string;
  Status: string;
  AssetCount: number;
  TotalCost: number;
}

export interface DepartmentAssignmentSummaryRow {
  Department: string;
  AssignedCount: number;
}

export interface RequestVolume {
  NewRequestCount: number;
  RepairRequestCount: number;
  UpgradeRequestCount: number;
  HRRequestCount: number;
}

export interface BranchDistributionRow {
  branch: string;
  totalAssets: number;
  assignedAssets: number;
  inStockAssets: number;
  utilizationRate: number;
}

export interface AssetReportsOverview {
  kpi: ReportsKPI | null;
  monthlyPurchases: MonthlyPurchaseRow[];
  stockStatusSummary: StockStatusRow[];
  assignmentByDepartment: DepartmentAssignmentSummaryRow[];
  requestVolume: RequestVolume | null;
  branchDistribution?: BranchDistributionRow[];
}

export interface DepartmentAssignmentRecord {
  UserID: string;
  DisplayName: string;
  Mail: string | null;
  Department: string | null;
  Branch?: string;
  AssetID: string;
  AssetName: string;
  AssetTagID: string;
  Category: string;
  Status: string;
  AssignedAt: string;
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

const handleAxiosError = (error: unknown, defaultMessage: string): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const message = axiosError.response?.data?.message || axiosError.message || defaultMessage;
    throw new Error(message);
  }
  throw error instanceof Error ? error : new Error(defaultMessage);
};

// Single round trip for everything the page's KPI cards, Monthly Purchases,
// Stock Status summary, and Assignments summary need
export const getAssetReportsOverview = async (branch?: string): Promise<AssetReportsOverview> => {
  try {
    const params: Record<string, string> = {};
    if (branch && branch !== "All Branches" && branch !== "All") {
      params.branch = branch;
    }
    const response = await axios.get<ApiResponse<AssetReportsOverview>>(API_BASE_URL, {
      headers: getAuthHeaders(),
      params,
    });
    if (!response.data.data) throw new Error("Failed to load reports overview");
    return response.data.data;
  } catch (error) {
    return handleAxiosError(error, "Failed to load reports overview");
  }
};

export const getDepartmentAssignments = async (department: string, branch?: string): Promise<DepartmentAssignmentRecord[]> => {
  try {
    const params: Record<string, string> = { department };
    if (branch && branch !== "All Branches" && branch !== "All") {
      params.branch = branch;
    }
    const response = await axios.get<ApiResponse<DepartmentAssignmentRecord[]>>(
      `${API_BASE_URL}/department-assignments`,
      { headers: getAuthHeaders(), params }
    );
    return response.data.data ?? [];
  } catch (error) {
    return handleAxiosError(error, "Failed to load department assignments");
  }
};
