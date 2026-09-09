import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/offboarding`;

// =============================================
// Types & Interfaces
// =============================================

export interface UserDetails {
  id: string;
  displayName: string;
  email: string;
  department?: string;
  designation?: string;
  location?: string;
  phone?: string;
  joiningDate?: string;
  managerUserID?: string;
  managerDetails?: {
    id: string;
    displayName: string;
    email: string;
  };
}

export interface EmployeeExitCreate {
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  workLocation?: string;
  groupName?: string;
  managerUserID?: string;
  joiningDate?: string;
  resignationDate?: string;
  relievingDate?: string;
  noticePeriod?: number;
  personalMailID?: string;
  createdByUserID: string;
}

export interface EmployeeExitUpdate {
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  workLocation?: string;
  groupName?: string;
  managerUserID?: string;
  joiningDate?: string;
  resignationDate?: string;
  relievingDate?: string;
  noticePeriod?: number;
  personalMailID?: string;
  status?: string;
  modifiedByUserID: string;
}

export interface Activity {
  activity: string;
  status: string;
  createdByUserID: string;
}

export interface HandingOver {
  handoverUserID: string;
  designation?: string;
  functionalHeadUserID?: string;
  createdByUserID: string;
}

export interface EmailForwarding {
  forwardToUserID: string;
  timePeriod?: string;
  remarks?: string;
  createdByUserID: string;
}

export interface ITActivity {
  title: string;
  completed?: boolean;
  remarks?: string;
  createdByUserID: string;
}

export interface FinanceActivity {
  title: string;
  verified?: boolean;
  date?: string;
  remarks?: string;
  createdByUserID: string;
}

export interface AdminActivity {
  title: string;
  applicable?: boolean;
  status: string;
  createdByUserID: string;
}

export interface DepartmentApproval {
  approverUserID: string;
  remarks?: string;
  draftStatus?: boolean;
  addDeduction?: boolean;
  deductionAmount?: number;
}

export interface AdminDraftUpdate {
  approverUserID: string;
  remarks?: string;
  addDeduction?: boolean;
  deductionAmount?: number;
}

export interface LockExitRequest {
  currentStatus: string;
  headStatus: string;
  itStatus: string;
  adminStatus: string;
  financeStatus: string;
  isUnlocking: boolean;
}

interface NotificationResponse {
  success: boolean;
  message: string;
  emailsSent?: any;
  error?: string;
}

// =============================================
// Graph API Functions
// =============================================

export const searchUsersByID = async (
  query: string,
  accessToken: string
): Promise<UserDetails[]> => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/graphapi/searchUsersByID`,
      {
        params: { query },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching users by ID:", error);
    throw error;
  }
};

export const searchUsersWithDetails = async (
  query: string,
  accessToken: string
): Promise<UserDetails[]> => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/graphapi/searchUsersWithDetails`,
      {
        params: { query },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching users with details:", error);
    throw error;
  }
};

export const getUserDetailsByID = async (
  userId: string,
  accessToken: string
): Promise<UserDetails> => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/graphapi/userDetails/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
};

// =============================================
// Employee Exit CRUD Operations
// =============================================

export const createEmployeeExit = async (
  data: EmployeeExitCreate,
  accessToken: string
) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/exit/create`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to create employee Offboarding");
  }
};

export const getMyEmployeeExits = async (
  userID: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exit/my/${userID}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch my employee exits");
  }
};

export const getAllEmployeeExits = async (accessToken: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exit/all`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch employee Offboarding");
  }
};

export const getEmployeeExitByID = async (
  exitId: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exit/${exitId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch employee Offboarding");
  }
};

export const getEmployeeExitByCode = async (
  exitCode: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exit/code/${exitCode}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch employee Offboarding");
  }
};

export const validateOffboardDetails = async (
  email: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exit/validate`, {
      params: { email },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to validate offboard details");
  }
};

export const updateEmployeeExit = async (
  exitId: string,
  data: EmployeeExitUpdate,
  accessToken: string
) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/exit/${exitId}`, data, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to update employee Offboarding");
  }
};

export const deleteEmployeeExit = async (
  exitId: string,
  deletedByUserID: string,
  accessToken: string
) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/exit/${exitId}`, {
      data: { deletedByUserID },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete employee Offboarding");
  }
};

// =============================================
// Complete Offboarding Details
// =============================================

export const getCompleteExitDetails = async (
  exitId: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/exit/${exitId}/complete`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch complete Offboarding details");
  }
};

// =============================================
// Activities (Lead Clearance)
// =============================================

export const submitActivity = async (
  exitId: string,
  data: Activity,
  accessToken: string
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/exit/${exitId}/activity`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to submit activity");
  }
};

export const getActivitiesByExitID = async (
  exitId: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/exit/${exitId}/activities`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch activities");
  }
};

export const deleteActivity = async (
  activityId: string,
  accessToken: string
) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/exit/activity/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete activity");
  }
};

// =============================================
// Handing Over
// =============================================

export const submitHandingOver = async (
  exitId: string,
  data: HandingOver,
  accessToken: string
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/exit/${exitId}/handing-over`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to submit handing over");
  }
};

export const getHandingOver = async (exitId: string, accessToken: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/exit/${exitId}/handing-over`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch handing over details");
  }
};

// =============================================
// Email Forwarding
// =============================================

export const submitEmailForwarding = async (
  exitId: string,
  data: EmailForwarding,
  accessToken: string
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/exit/${exitId}/email-forwarding`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to submit email forwarding");
  }
};

export const getEmailForwarding = async (
  exitId: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/exit/${exitId}/email-forwarding`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch email forwarding details");
  }
};

// =============================================
// IT Activities
// =============================================

export const submitITActivity = async (
  exitId: string,
  data: ITActivity,
  accessToken: string
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/exit/${exitId}/it-activity`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to submit IT activity");
  }
};

export const updateITActivity = async (
  activityId: string,
  data: Partial<ITActivity> & { modifiedByUserID: string },
  accessToken: string
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/exit/it-activity/${activityId}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to update IT activity");
  }
};

export const getITActivities = async (exitId: string, accessToken: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/exit/${exitId}/it-activities`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch IT activities");
  }
};

export const deleteITActivity = async (
  activityId: string,
  accessToken: string
) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/exit/it-activity/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete IT activity");
  }
};

// =============================================
// Finance Activities
// =============================================

export const submitFinanceActivity = async (
  exitId: string,
  data: FinanceActivity,
  accessToken: string
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/exit/${exitId}/finance-activity`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to submit finance activity");
  }
};

export const updateFinanceActivity = async (
  activityId: string,
  data: Partial<FinanceActivity> & { modifiedByUserID: string },
  accessToken: string
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/exit/finance-activity/${activityId}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to update finance activity");
  }
};

export const getFinanceActivities = async (
  exitId: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/exit/${exitId}/finance-activities`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch finance activities");
  }
};

export const deleteFinanceActivity = async (
  activityId: string,
  accessToken: string
) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/exit/finance-activity/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete finance activity");
  }
};

// =============================================
// Admin Activities
// =============================================

export const submitAdminActivity = async (
  exitId: string,
  data: AdminActivity,
  accessToken: string
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/exit/${exitId}/admin-activity`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to submit admin activity");
  }
};

export const updateAdminActivity = async (
  activityId: string,
  data: Partial<AdminActivity> & { modifiedByUserID: string },
  accessToken: string
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/exit/admin-activity/${activityId}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to update admin activity");
  }
};

export const getAdminActivities = async (
  exitId: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/exit/${exitId}/admin-activities`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch admin activities");
  }
};

export const deleteAdminActivity = async (
  activityId: string,
  accessToken: string
) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/exit/admin-activity/${activityId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete admin activity");
  }
};

// =============================================
// Department Approval
// =============================================

export const updateDepartmentApproval = async (
  exitId: string,
  department: "Head" | "HR" | "IT" | "Admin" | "Finance" | "HeadKt",
  data: DepartmentApproval,
  accessToken: string
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/exit/${exitId}/approval/${department}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to update department approval");
  }
};

// =============================================
// Reminder Status
// =============================================

export const updateReminderStatus = async (
  exitId: string,
  department: "Head" | "IT" | "Admin" | "Finance",
  reminderValue: string,
  accessToken: string
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/exit/${exitId}/reminder/${department}`,
      {
        reminderValue,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to update reminder status");
  }
};

// =============================================
// Statistics & Filtering
// =============================================

export const getDashboardStats = async (accessToken: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exit/stats/dashboard`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch dashboard statistics");
  }
};

export const getExitsByStatus = async (status: string, accessToken: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exit/status/${status}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch Offboarding by status");
  }
};

export const getExitsByDepartmentStatus = async (
  department: "Head" | "HR" | "IT" | "Admin" | "Finance",
  status: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/exit/department/${department}/status/${status}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch Offboarding by department status");
  }
};

export interface FileAttachment {
  id: string;
  filename: string;
  url: string;
  blobPath: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy?: string;
  category?: string;
  description?: string;
}

// Upload single file
export const uploadFile = async (
  exitId: string,
  file: File,
  uploadedByUserID: string,
  accessToken: string
) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadedByUserID", uploadedByUserID);

    const response = await axios.post(
      `${API_BASE_URL}/exit/${exitId}/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Upload error:", error);
    throw new Error("Failed to upload file");
  }
};

// Get all files for an exit
export const getExitFiles = async (
  exitId: string,
  accessToken: string
): Promise<FileAttachment[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exit/${exitId}/files`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data.files || [];
  } catch (error) {
    console.error("Get files error:", error);
    throw new Error("Failed to fetch files");
  }
};

// Delete a file
export const deleteFile = async (
  exitId: string,
  blobPath: string,
  accessToken: string
) => {
  try {
    const encodedPath = encodeURIComponent(blobPath);
    const response = await axios.delete(
      `${API_BASE_URL}/exit/${exitId}/files/${encodedPath}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Delete error:", error);
    throw new Error("Failed to delete file");
  }
};

// Download a file
export const downloadFile = async (blobPath: string, accessToken: string) => {
  try {
    const encodedPath = encodeURIComponent(blobPath);
    const response = await axios.get(
      `${API_BASE_URL}/exit/files/${encodedPath}/download`,
      {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Download error:", error);
    throw new Error("Failed to download file");
  }
};

// Services/Offboarding.ts

export const uploadMultipleFiles = async (
  exitId: string,
  files: File[],
  uploadedByUserID: string,
  accessToken: string
): Promise<{
  success: boolean;
  files?: FileAttachment[];
  message?: string;
}> => {
  try {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    formData.append("uploadedByUserID", uploadedByUserID);
    formData.append("category", "Exit Documents");

    const response = await axios.post(
      `${API_BASE_URL}/exit/${exitId}/upload-multiple`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return {
      success: true,
      files: response.data.files,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error uploading files:", error);
    throw error;
  }
};

// Add to your Offboarding services file
export const updateActivity = async (
  activityId: string,
  data: {
    activity: string;
    status: string;
    modifiedByUserID: string;
  },
  accessToken: string
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/exit/activity/${activityId}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to update activity");
  }
};

export const updateAdminDraft = async (
  exitId: string,
  data: AdminDraftUpdate,
  accessToken: string
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/exit/${exitId}/admin-draft`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to update admin draft");
  }
};

export interface FinanceDraftUpdate {
  approverUserID: string;
  remarks?: string;
}

// Add this function to Services/Offboarding.ts after updateAdminDraft

export const updateFinanceDraft = async (
  exitId: string,
  data: FinanceDraftUpdate,
  accessToken: string
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/exit/${exitId}/finance-draft`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to update finance draft");
  }
};

export const getEmployeeExitsByManager = async (
  managerUserId: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/exit/manager/${managerUserId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch employee Offboarding by manager");
  }
};

export const getEmployeeExitsByManagerForKt = async (
  managerUserId: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/exit/managerKt/${managerUserId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch employee Offboarding by manager");
  }
};

export const getITDashboardExits = async (accessToken: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exit/dashboard/it`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch IT dashboard Offboarding");
  }
};

export const getAdminDashboardExits = async (accessToken: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exit/dashboard/admin`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch Admin dashboard Offboarding");
  }
};

export const getFinanceDashboardExits = async (accessToken: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exit/dashboard/finance`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch Finance dashboard Offboarding");
  }
};

export const getHRDashboardExits = async (accessToken: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/exit/dashboard/hr`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch HR dashboard Offboarding");
  }
};

export const toggleExitLock = async (
  exitId: string,
  data: LockExitRequest,
  accessToken: string
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/exit/${exitId}/lock`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error toggling Offboarding lock:", error);
    throw new Error("Failed to update Offboarding lock status");
  }
};

// Send Reminder to Department
export const sendDepartmentReminder = async (
  exitId: string,
  department: "Head" | "IT" | "Admin" | "Finance" | "HeadKt",
  reminderValue: string = new Date().toISOString(),
  accessToken: string
) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/exit/${exitId}/reminder/${department}`,
      { reminderValue },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`Error sending reminder to ${department}:`, error);
    throw new Error(`Failed to send reminder to ${department}`);
  }
};

export const sendOffboardingReminder = async (
  exitId: string,
  exitData: any,
  department: "Head" | "IT" | "Admin" | "Finance" | "HeadKt",
  UserDetails: any,
  accessToken: string
) => {
  try {
    if (!exitId || !exitData || !department || !UserDetails || !accessToken) {
      console.error("Missing required parameters:", {
        exitId,
        exitData: !!exitData,
        department,
        UserDetails: !!UserDetails,
        accessToken: !!accessToken,
      });
      return {
        success: false,
        message:
          "Missing required parameters: exitId, exitData, department, UserDetails, or accessToken",
      };
    }
    const response = await axios.post(
      `${API_BASE_URL}/offboarding-reminder-notification`,
      {
        exitData: exitData,
        department: department,
        UserDetails: UserDetails,
        accessToken: accessToken,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
      recipientEmail: response.data.recipientEmail,
    };
  } catch (error) {
    console.error("Error sending offboarding reminder:", error);
    return {
      success: false,
      message: "Failed to send offboarding reminder notification",
      error: "Error",
    };
  }
};

export const createEmployeeExitNotification = async (
  ExitID: string,
  exitData: any,
  managerDetails: any,
  UserDetails: any,
  accessToken: string
) => {
  try {
    if (!exitData || !UserDetails || !accessToken) {
      console.warn("Missing parameters for Offboarding notification:", {
        exitData,
        UserDetails,
      });
      return {
        success: false,
        message: "Missing required parameters for notification",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/created-employee-exit-notification`,
      {
        exitData: exitData,
        managerDetails: managerDetails || null,
        UserDetails: UserDetails,
        accessToken: accessToken,
        ExitID: ExitID,
      },
      {
        headers:{
          Authorization: `Bearer ${accessToken}`,
        }
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
      emailsSent: response.data.emailsSent,
    };
  } catch (error) {
    console.error("Error sending Offboarding creation notification:", error);
    return {
      success: false,
      message: "Failed to send exit creation notification",
      error: "Error",
    };
  }
};

export const sendLeadSubmitNotification = async (
  exitData: any,
  userDetails: any,
  accessToken: string
): Promise<NotificationResponse> => {
  try {
    if (!exitData || !accessToken) {
      console.warn("Missing parameters for lead submit notification");
      return {
        success: false,
        message: "Missing required parameters for notification",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/lead-submit-notification`,
      {
        exitData: exitData,
        userDetails: userDetails,
        accessToken: accessToken,
      },
      {
        headers:{
          Authorization: `Bearer ${accessToken}`,
        }
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
      emailsSent: response.data.emailsSent,
    };
  } catch (error) {
    console.error("Error sending lead submit notification:", error);
    return {
      success: false,
      message: "Failed to send lead submit notification",
      error: "Network or server error",
    };
  }
};

// 2. IT Head Submit Notification
export const sendITHeadSubmitNotification = async (
  exitData: any,
  userDetails: any,
  accessToken: string
): Promise<NotificationResponse> => {
  try {
    if (!exitData || !accessToken) {
      console.warn("Missing parameters for IT Head submit notification");
      return {
        success: false,
        message: "Missing required parameters for notification",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/ithead-submit-notification`,
      {
        exitData: exitData,
        userDetails: userDetails,
        accessToken: accessToken,
      },
      {
        headers:{
          Authorization: `Bearer ${accessToken}`,
        }
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
      emailsSent: response.data.emailsSent,
    };
  } catch (error) {
    console.error("Error sending IT Head submit notification:", error);
    return {
      success: false,
      message: "Failed to send IT Head submit notification",
      error: "Network or server error",
    };
  }
};

// 3. Admin Submit Notification
export const sendAdminSubmitNotification = async (
  exitData: any,
  userDetails: any,

  accessToken: string
): Promise<NotificationResponse> => {
  try {
    if (!exitData || !accessToken) {
      console.warn("Missing parameters for Admin submit notification");
      return {
        success: false,
        message: "Missing required parameters for notification",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/admin-submit-notification`,
      {
        exitData: exitData,
        userDetails: userDetails,
        accessToken: accessToken,
      },
      {
        headers:{
          Authorization: `Bearer ${accessToken}`,
        }
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
      emailsSent: response.data.emailsSent,
    };
  } catch (error) {
    console.error("Error sending Admin submit notification:", error);
    return {
      success: false,
      message: "Failed to send Admin submit notification",
      error: "Network or server error",
    };
  }
};

// 4. HR KT Validated Notification
export const sendHRKTValidatedNotification = async (
  exitData: any,
  userDetails: any,

  accessToken: string
): Promise<NotificationResponse> => {
  try {
    if (!exitData || !accessToken) {
      console.warn("Missing parameters for HR KT validated notification");
      return {
        success: false,
        message: "Missing required parameters for notification",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/hr-kt-validated-notification`,
      {
        exitData: exitData,
        userDetails: userDetails,
        accessToken: accessToken,
      },
      {
        headers:{
          Authorization: `Bearer ${accessToken}`,
        }
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
      emailsSent: response.data.emailsSent,
    };
  } catch (error) {
    console.error("Error sending HR KT validated notification:", error);
    return {
      success: false,
      message: "Failed to send HR KT validated notification",
      error: "Network or server error",
    };
  }
};

// 5. Finance Submit Notification (Process Completion)
export const sendFinanceSubmitNotification = async (
  exitData: any,
  userDetails: any,

  accessToken: string
): Promise<NotificationResponse> => {
  try {
    if (!exitData || !accessToken) {
      console.warn("Missing parameters for Finance submit notification");
      return {
        success: false,
        message: "Missing required parameters for notification",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/finance-submit-notification`,
      {
        exitData: exitData,
        userDetails: userDetails,
        accessToken: accessToken,
      },
      {
        headers:{
          Authorization: `Bearer ${accessToken}`,
        }
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
      emailsSent: response.data.emailsSent,
    };
  } catch (error) {
    console.error("Error sending Finance submit notification:", error);
    return {
      success: false,
      message: "Failed to send Finance submit notification",
      error: "Network or server error",
    };
  }
};
