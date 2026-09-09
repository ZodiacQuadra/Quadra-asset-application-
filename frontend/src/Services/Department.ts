import axios from "axios";

// Base URL for your API
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/department`; // Adjust this to your actual API base URL

// Types
export interface AppDepartment {
  Id: string;
  Name: string;
  Description: string;
  Status: "active" | "inactive";
  CreatedAt: string;
  UpdatedAt: string;
}

export interface EntraDepartmentUpdateData {
  Code: string;
  Description: string;
}

export interface EntraDepartment {
  Id: string;
  Name: string;
  Code: string;
  Description: string;
  LastSynced: string;
  Status: "active" | "inactive";
  CreatedAt?:string;
  UpdatedAt?:string;
  EntraId?:string
}

export interface DepartmentFormData {
  name: string;
  description: string;
  status: string;
}

export interface SyncResult {
  RecordsProcessed: number;
  RecordsAdded: number;
  RecordsUpdated: number;
  RecordsDeactivated: number;
}

export interface SchedulerStatus {
  isRunning: boolean;
  nextRunTime: string;
  lastRunTime: string;
  status: string;
}

export interface SyncHistoryItem {
  id: string;
  syncStartTime: string;
  syncEndTime: string;
  status: string;
  recordsProcessed: number;
  recordsAdded: number;
  recordsUpdated: number;
  recordsDeactivated: number;
  errorMessage: string;
  createdAt: string;
}

// =============================================
// App Managed Departments API Functions
// =============================================

export const createAppDepartment = async (
  departmentData: DepartmentFormData,
  createdByUserId: string,
  accesstoken: string
): Promise<AppDepartment> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/app-departments`,
      {
        ...departmentData,
        createdByUserId,
      },
      {
        headers: {
          Authorization: `Bearer ${accesstoken}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to create department");
    }
  } catch (error) {
    throw new Error("Failed to create department");
  }
};

export const updateAppDepartment = async (
  id: string,
  departmentData: DepartmentFormData,
  updatedByUserId: string,
  accesstoken: string
): Promise<AppDepartment> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/app-departments/${id}`,
      {
        ...departmentData,
        updatedByUserId,
      },
      {
        headers: {
          Authorization: `Bearer ${accesstoken}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to update department");
    }
  } catch (error) {
    throw new Error("Failed to update department");
  }
};

export const deleteAppDepartment = async (
  id: string,
  updatedByUserId: string,
  accesstoken: string
): Promise<void> => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/app-departments/${id}`,
      {
        data: { updatedByUserId },
        headers: {
          Authorization: `Bearer ${accesstoken}`,
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to delete department");
    }
  } catch (error) {
    throw new Error("Failed to delete department");
  }
};

export const getAppDepartments = async (
  accesstoken: string
): Promise<AppDepartment[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/app-departments`, {
      headers: {
        Authorization: `Bearer ${accesstoken}`,
      },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch departments");
    }
  } catch (error) {
    throw new Error("Failed to fetch departments");
  }
};

// =============================================
// Entra Departments API Functions
// =============================================

export const getEntraDepartments = async (
  accesstoken: string
): Promise<EntraDepartment[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/entra-departments`, {
      headers: {
        Authorization: `Bearer ${accesstoken}`,
      },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to fetch Entra departments"
      );
    }
  } catch (error) {
    throw new Error("Failed to fetch Entra departments");
  }
};

export const getEntraDepartmentsWithoutHr = async (
  accesstoken: string
): Promise<EntraDepartment[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/entra-departments-without-hr`, {
      headers: {
        Authorization: `Bearer ${accesstoken}`,
      },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to fetch Entra departments"
      );
    }
  } catch (error) {
    throw new Error("Failed to fetch Entra departments");
  }
};

export const updateEntraDepartmentStatus = async (
  id: string,
  status: "active" | "inactive",
  accesstoken: string
): Promise<EntraDepartment> => {
  // console.log(id, status);
  try {
    const response = await axios.put(
      `${API_BASE_URL}/entra-departments/${id}/status`,
      {
        status,
      },
      {
        headers: {
          Authorization: `Bearer ${accesstoken}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to update department status"
      );
    }
  } catch (error) {
    throw new Error("Failed to update department status");
  }
};

export const syncEntraDepartments = async (
  accesstoken: string
): Promise<SyncResult> => {
  try {
    // console.log(accesstoken);
    const response = await axios.post(
      `${API_BASE_URL}/entra-departments/sync`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accesstoken}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to sync Entra departments"
      );
    }
  } catch (error) {
    throw new Error("Failed to sync Entra departments");
  }
};

// =============================================
// Combined Departments API Functions
// =============================================

export const getCombinedDepartments = async (
  accesstoken: string
): Promise<any[]> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/entra-departmentswithactivecode`,
      {
        headers: {
          Authorization: `Bearer ${accesstoken}`,
        },
      }
    );

    if (response.data.success) {
      // console.log(response.data.data);
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to fetch combined departments"
      );
    }
  } catch (error) {
    throw new Error("Failed to fetch combined departments");
  }
};

// =============================================
// Scheduler Management API Functions
// =============================================

export const getSchedulerStatus = async (
  accesstoken: string
): Promise<SchedulerStatus> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/scheduler/status`, {
      headers: {
        Authorization: `Bearer ${accesstoken}`,
      },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to fetch scheduler status"
      );
    }
  } catch (error) {
    throw new Error("Failed to fetch scheduler status");
  }
};

export const triggerManualSync = async (accesstoken: string): Promise<void> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/scheduler/sync`, {
      headers: {
        Authorization: `Bearer ${accesstoken}`,
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to trigger manual sync");
    }
  } catch (error) {
    throw new Error("Failed to trigger manual sync");
  }
};

export const getSyncHistory = async (
  limit: number = 50,
  offset: number = 0,
  accesstoken: string
): Promise<SyncHistoryItem[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/scheduler/history`, {
      params: { limit, offset },
      headers: {
        Authorization: `Bearer ${accesstoken}`,
      },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch sync history");
    }
  } catch (error) {
    throw new Error("Failed to fetch sync history");
  }
};

export const updateEntraDepartmentDetails = async (
  id: string,
  departmentData: EntraDepartmentUpdateData,
  accesstoken: string
): Promise<EntraDepartment> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/entra-departments/${id}`,
      departmentData,
      {
        headers: {
          Authorization: `Bearer ${accesstoken}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to update department details"
      );
    }
  } catch (error) {
    // Pass the specific error message from the backend
    const errorMessage = "Failed to update department details";
    throw new Error(errorMessage);
  }
};
