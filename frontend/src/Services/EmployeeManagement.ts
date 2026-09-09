import axios, { AxiosError } from "axios";
import { getStoredAuthToken } from "../Auth/tokenStorage";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/EmployeeManagement`;

// =============================================
// Type Definitions
// =============================================

// Shape returned by GET /EmployeeManagement/:id — a Microsoft Graph user
// (with manager + org data expanded).
export interface EmployeeManager {
  id: string;
  displayName: string;
  mail: string | null;
  userPrincipalName: string;
}

export interface EmployeeOrgData {
  costCenter: string | null;
  division: string | null;
}

export interface Employee {
  id: string;
  displayName: string;
  givenName: string | null;
  surname: string | null;
  mail: string | null;
  userPrincipalName: string;
  employeeId: string | null;
  jobTitle: string | null;
  department: string | null;
  mobilePhone: string | null;
  businessPhones: string[];
  officeLocation: string | null;
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  usageLocation: string | null;
  employeeHireDate: string | null;
  accountEnabled: boolean;
  otherMails: string[];
  faxNumber: string | null;
  createdDateTime: string | null;
  employeeOrgData: EmployeeOrgData | null;
  manager: EmployeeManager | null;
  assignedLicenses: any[];
}

// Editable subset sent to PUT /EmployeeManagement/:id
export interface UpdateEmployeePayload {
  displayName?: string;
  givenName?: string | null;
  surname?: string | null;
  mail?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  mobilePhone?: string | null;
  officeLocation?: string | null;
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  employeeId?: string | null;
  accountEnabled?: boolean;
  managerId?: string | null;
  division?: string | null;
  costCenter?: string | null;
  assignLicenses?: boolean;
  licenses?: string[]; // selected licence skuIds
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: any;
}

// =============================================
// Helpers
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
// GET /:employeeId — Fetch a single employee's data by ID
// adminToken (optional): delegated admin token (User.ReadWrite.All) forwarded as
// x-admin-token — required to read user details from Entra AD, same as the
// /confirm-joining flow.
// =============================================
export const getEmployeeById = async (
  employeeId: string,
  adminToken?: string
): Promise<ApiResponse<Employee>> => {
  try {
    if (!employeeId) {
      throw new Error("Employee ID is required");
    }
    const headers: Record<string, string> = getAuthHeaders();
    if (adminToken) {
      headers["x-admin-token"] = adminToken;
    }
    const response = await axios.get(
      `${API_BASE_URL}/${encodeURIComponent(employeeId)}`,
      { headers }
    );
    // Backend may return HTTP 200 with a failure envelope
    // (e.g. "Admin authorisation is required to fetch user details from Entra AD.")
    if (response.data?.success === false) {
      return {
        success: false,
        message: response.data.message || "Failed to fetch employee",
        error: response.data,
      };
    }
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Employee fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching employee:", error);
    return handleAxiosError(error, "Failed to fetch employee");
  }
};

// =============================================
// PUT /:employeeId — Update an employee's Entra AD details
// adminToken (optional): delegated admin token (User.ReadWrite.All) forwarded as
// x-admin-token — required to write user details to Entra AD.
// =============================================
export const updateEmployee = async (
  employeeId: string,
  payload: UpdateEmployeePayload,
  adminToken?: string
): Promise<ApiResponse<Employee>> => {
  try {
    if (!employeeId) {
      throw new Error("Employee ID is required");
    }
    const headers: Record<string, string> = getAuthHeaders();
    if (adminToken) {
      headers["x-admin-token"] = adminToken;
    }
    const response = await axios.put(
      `${API_BASE_URL}/${encodeURIComponent(employeeId)}`,
      payload,
      { headers }
    );
    if (response.data?.success === false) {
      return {
        success: false,
        message: response.data.message || "Failed to update employee",
        error: response.data,
      };
    }
    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Employee updated successfully",
    };
  } catch (error) {
    console.error("Error updating employee:", error);
    return handleAxiosError(error, "Failed to update employee");
  }
};

export default { getEmployeeById, updateEmployee };
