import axios from "axios";
import { getStoredAuthToken } from "../Auth/tokenStorage";

// Base URL for your API
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/location`;

/** Helper to get standardized authentication headers */
const getAuthHeaders = (token?: string) => {
  const authToken = token || getStoredAuthToken();
  return {
    Authorization: authToken ? `Bearer ${authToken}` : "",
    "Content-Type": "application/json",
  };
};

// Types
export interface AppLocation {
  Id: string;
  Name: string;
  Country: string;
  Code: string;
  Coordinates?: string;
  Street?: string;
  City?: string;
  State?: string;
  Zipcode?: string;
  NumberOfFloors?: number | null;
  Type: "Office" | "Remote" | "Temporary" | "Coworking";
  Description: string;
  Status: "active" | "inactive";
  CreatedAt: string;
  UpdatedAt: string;
}

export interface EntraLocation {
  Id: string;
  Name: string;
  Country: string;
  Code?: string; // NEW: Added Code field
  LastSynced: string;
  Status: "active" | "inactive";
}

export interface LocationFormData {
  Name: string;
  Country: string;
  Code?: string;
  Coordinates?: string;
  Street?: string;
  City?: string;
  State?: string;
  Zipcode?: string;
  NumberOfFloors?: number | null;
  Type: string;
  Description: string;
  Status: string;
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
// App Managed Locations API Functions
// =============================================

export const createAppLocation = async (
  locationData: LocationFormData,
  createdByUserId: string,
  accessToken: string
): Promise<AppLocation> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/app-locations`,
      {
        ...locationData,
        createdByUserId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to create location");
    }
  } catch (error) {
    throw new Error("Failed to create location");
  }
};

export const updateAppLocation = async (
  id: string,
  locationData: LocationFormData,
  updatedByUserId: string,
  accessToken: string
): Promise<AppLocation> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/app-locations/${id}`,
      {
        ...locationData,
        updatedByUserId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to update location");
    }
  } catch (error) {
    throw new Error("Failed to update location");
  }
};

export const deleteAppLocation = async (
  id: string,
  updatedByUserId: string,
  accessToken: string
): Promise<void> => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/app-locations/${id}`, {
      data: { updatedByUserId },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to delete location");
    }
  } catch (error) {
    throw new Error("Failed to delete location");
  }
};

/** Fetch all office locations managed by the app */
export const getAppLocations = async (
  accessToken?: string
): Promise<AppLocation[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/app-locations`, {
      headers: getAuthHeaders(accessToken),
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch locations");
    }
  } catch (error) {
    console.error("Error in getAppLocations:", error);
    throw new Error("Failed to fetch locations");
  }
};

// =============================================
// Entra Locations API Functions
// =============================================

export const getEntraLocations = async (
  accessToken: string
): Promise<EntraLocation[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/entra-locations`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to fetch Entra locations"
      );
    }
  } catch (error) {
    throw new Error("Failed to fetch Entra locations");
  }
};

export const updateEntraLocationStatus = async (
  id: string,
  Status: "active" | "inactive",
  accessToken: string
): Promise<EntraLocation> => {
  // console.log(id, Status);
  try {
    const response = await axios.put(
      `${API_BASE_URL}/entra-locations/${id}/Status`,
      {
        Status,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to update location Status"
      );
    }
  } catch (error) {
    throw new Error("Failed to update location Status");
  }
};

export const syncEntraLocations = async (
  accessToken: string
): Promise<SyncResult> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/entra-locations/sync`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to sync Entra locations"
      );
    }
  } catch (error) {
    throw new Error("Failed to sync Entra locations");
  }
};

// =============================================
// Combined Locations API Functions
// =============================================

export const getCombinedLocations = async (
  accessToken: string
): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/app-locations`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to fetch combined locations"
      );
    }
  } catch (error) {
    throw new Error("Failed to fetch combined locations");
  }
};

// =============================================
// Scheduler Management API Functions
// =============================================

export const getSchedulerStatus = async (
  accessToken: string
): Promise<SchedulerStatus> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/scheduler/Status`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(
        response.data.message || "Failed to fetch scheduler Status"
      );
    }
  } catch (error) {
    throw new Error("Failed to fetch scheduler Status");
  }
};

export const triggerManualSync = async (accessToken: string): Promise<void> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/scheduler/sync`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
  accessToken: string
): Promise<SyncHistoryItem[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/scheduler/history`, {
      params: { limit, offset },
      headers: {
        Authorization: `Bearer ${accessToken}`,
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
