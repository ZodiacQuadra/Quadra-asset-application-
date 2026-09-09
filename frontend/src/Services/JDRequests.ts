import axios from "axios";
import { UserDetails } from "./Offboarding";
import { HrMapping } from "./HrMapping";

// Configure your base URL here
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/jdRequest`; // Update this to your actual API base URL

// Type definitions (if using TypeScript)
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: any;
}

// Add this to your Services/Offboarding.ts or create a new service file

export interface DepartmentUser {
  id: string;
  displayName: string;
  email: string;
  jobTitle: string | null;
  department: string;
  officeLocation: string | null;
}

export interface HRreportDetails {
  selectedUserId: string;
  dateFilterType: string;
  selectedDate: Date;
  accessToken: string;
}

interface TranscriptDetails {
  url: string;
  createdDateTime: string;
  id: string;
  hasMultiple?: boolean;
  count?: number;
}

export interface JDRequestUpdateData {
  jobId: string;
  jobRole: string;
  jobNature: string;
  department: string;
  departmentCode: string; // NEW
  targetDate: string | undefined;
  numPositions: number;
  minWorkExperience?: number;
  maxWorkExperience?: number;
  MinSalaryRange?: number;
  MaxSalaryRange?: number;
  jobLocation: string;
  locationCode: string; // NEW
  jobDescription: string;
  modifiedByUserId: string;
  skills: Array<{ name: string; rating: number }>;
  status: string;
  updateSkills: boolean;
  reportingManager: { id: string };
  isActive: boolean;
  isPublished: boolean;
  inActiveReason: string | null;
  designation: string;
  interviewerId?: string | null;
  subordinateId?:string | null;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: any;
}

interface JDRequestFilters {
  includeDeleted?: boolean;
  status?: string;
  department?: string;
  pageNumber?: number;
  pageSize?: number;
}

interface HiringPipelineStage {
  ID: string;
  StageSequence: number;
  JobPostingID: string;
  InterviewName: string;
  Description: string;
  Order: number;
  isDefault: boolean;
  CreatedByUserID: string;
  ModifiedByUserID?: string;
  CreatedAt: string;
  ModifiedAt?: string;
  CreatedByUserName?: string;
  ModifiedByUserName?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: any;
  message?: string;
}


interface JDRequestVersion {
  JDRequestID: string;
  LatestVersion: number;
  LastModifiedAt: string;
  LastModifiedBy: string;
  TotalVersions: number;
}

interface VersionHistoryItem {
  VersionID: string;
  OriginalJDRequestID: string;
  VersionNumber: number;
  VersionCreatedAt: string;
  ModifiedByUserName: string;
  ModifiedByUserEmail: string;
  ChangeSummary: string;
  TotalChanges: number;
  JobRole: string;
  Department: string;
  Status: string;
  SkillCount: number;
  // Change flags
  JobRole_Changed: boolean;
  JobNature_Changed: boolean;
  Department_Changed: boolean;
  Status_Changed: boolean;
  Skills_Changed: boolean;
  JobLocation_Changed: boolean;
  NumPositions_Changed: boolean;
  isActive_Changed: boolean;
  isPublished_Changed: boolean;
}


export const deleteJDRequest = async (
  id: string,
  deleted: boolean,
  modifiedByUserId: string,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/deleteJDRequest/${id}`,
      {
        data: {
          modifiedByUserId: modifiedByUserId,
          confirmDelete: deleted,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if(!response.data.success){
      return {
        success: false,
        error: response.data.message,
      };
    }

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error deleting JD request:", error);
    return {
      success: false,
      error: error,
    };
  }
};

/**
 * 7. Restore deleted JD request
 */
export const restoreJDRequest = async (
  id: string,
  modifiedByUserId: string,
  newStatus: string = "Draft",
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/restoreJDRequest/${id}/restore`,
      {
        modifiedByUserId: modifiedByUserId,
        newStatus: newStatus,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error restoring JD request:", error);
    return {
      success: false,
      error: error,
    };
  }
};

/**
 * 1. Get all JD requests with optional filtering and pagination
 */
export const getJDRequests = async (
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const params = new URLSearchParams();

    // Object.entries(filters).forEach(([key, value]) => {
    //   if (value !== null && value !== undefined && value !== "") {
    //     params.append(key, value.toString());
    //   }
    // });

    const response = await axios.get(
      `${API_BASE_URL}/getJDRequests?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching JD requests:", error);
    return {
      success: false,
      error: error,
    };
  }
};

/**
 * 2. Get JD request by ID
 */
export const getJDRequestById = async (
  id: string,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/getJDRequestByID/${id}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error fetching JD request:", error);
    return {
      success: false,
      error: error,
    };
  }
};

// In your frontend service file (e.g., api.ts)

// You will likely need to update your JDRequestData interface
export interface JDRequestData {
  jobId: string;
  jobRole: string;
  jobNature: string;
  jobCode:string; // NEW
  department: string;
  departmentCode: string; // NEW
  targetDate: Date;
  numPositions: number;
  minWorkExperience: number;
  maxWorkExperience: number;
  MinSalaryRange?: number;
  MaxSalaryRange?: number;
  jobLocation: string;
  locationCode: string; // NEW
  jobDescription: string;
  createdByUserId: string;
  skills: any[]; // Define a proper Skill type
  status: string;
  reportingManager: { id: string }; // Assuming this is how you pass it
  // jobLevel: number; // NEW
  // quarter: number; // NEW
  // internalTeam: string; // NEW
  isOtherSelected:boolean,
  newJobRoleName?:string,
  departmentId:string,
  interviewer?: { id: string } | null;
  subordinate?:{id:string} | null;
  designation:string
}

export const getUserDetailforJd = async (
  userId: any,
  accessToken: string
): Promise<any> => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/graphapi/userDetails/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data, // FIX HERE
    };
  } catch (error) {
    console.error("Error fetching user details:", error);
    const apiError = error as any;
    return {
      success: false,
      error: apiError.response?.data?.message || "An unknown error occurred.",
    };
  }
};


export const createJDRequest = async (
  requestData: JDRequestData,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    let payLoad = {
      jobId: requestData.jobId,
      jobRole: requestData.jobRole,
      jobNature: requestData.jobNature,
      jobCode: requestData.jobCode,
      department: requestData.department,
      departmentCode: requestData.departmentCode,
      targetDate: requestData.targetDate,
      numPositions: requestData.numPositions,
      minWorkExperience: requestData.minWorkExperience,
      maxWorkExperience: requestData.maxWorkExperience,
      MinSalaryRange: requestData.MinSalaryRange,
      MaxSalaryRange: requestData.MaxSalaryRange,
      jobLocation: requestData.jobLocation,
      locationCode: requestData.locationCode,
      jobDescription: requestData.jobDescription,
      createdByUserId: requestData.createdByUserId,
      skills: requestData.skills,
      status: requestData.status,
      reportingManagerID: requestData.reportingManager.id,
      isNewJD: requestData.isOtherSelected,
      departmentId: requestData.departmentId,
      interviewerID: requestData.interviewer?.id || null, // NEW FIELD
      subordinateID: requestData.subordinate?.id || null,
      designation: requestData.designation
    };

    if (requestData.isOtherSelected && requestData.newJobRoleName) {
      payLoad["jobRole"] = requestData.newJobRoleName;
    }

    const response = await axios.post(
      `${API_BASE_URL}/createJDRequest`,
      payLoad,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error creating JD request:", error);
    const apiError = error as any;
    return {
      success: false,
      error: apiError.response?.data?.message || "An unknown error occurred.",
    };
  }
};

/**
 * 4. Update JD request
 */
export const updateJDRequest = async (
  id: string,
  updateData: JDRequestUpdateData,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/updateJDRequest/requests/${id}`,
      {
        jobId: updateData.jobId,
        jobRole: updateData.jobRole,
        jobNature: updateData.jobNature,
        department: updateData.department,
        departmentCode: updateData.departmentCode, // NEW
        targetDate: updateData.targetDate,
        numPositions: updateData.numPositions,
        minWorkExperience: updateData.minWorkExperience,
        maxWorkExperience: updateData.maxWorkExperience,
        MinSalaryRange: updateData.MinSalaryRange,
        MaxSalaryRange: updateData.MaxSalaryRange,
        jobLocation: updateData.jobLocation,
        locationCode: updateData.locationCode, // NEW
        jobDescription: updateData.jobDescription,
        modifiedByUserId: updateData.modifiedByUserId,
        skills: updateData.skills,
        status: updateData.status,
        updateSkills: updateData.updateSkills,
        reportingManagerID: updateData.reportingManager.id,
        isActive: updateData.isActive,
        isPublished: updateData.isPublished,
        inActiveReason: updateData.inActiveReason,
        designation: updateData.designation,
        subordinateId: updateData.subordinateId,
        interviewerId: updateData.interviewerId

      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error updating JD request:", error);
    return {
      success: false,
      error: error,
    };
  }
};



export const updateJDRequestStatus = async (
  id: string,
  status: string,
  modifiedByUserId: string,
  accessToken: string,
  isActive?: boolean,
  isPublished?: boolean,
  inActiveReason?: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/updateJDRequestStatus/${id}/status`,
      {
        status: status,
        modifiedByUserId: modifiedByUserId,
        isActive: isActive,
        isPublished: isPublished,
        inActiveReason: inActiveReason,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Error updating JD request status:", error);
    return {
      success: false,
      error: error,
    };
  }
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Format skills for API submission
 */
export const formatSkills = (
  skills: Array<{ name: string; rating: number }>
): Array<{ name: string; rating: number }> => {
  if (!Array.isArray(skills)) return [];

  return skills
    .map((skill) => ({
      name: skill.name?.trim(),
      rating: parseInt(skill.rating.toString()),
    }))
    .filter((skill) => skill.name && skill.rating >= 1 && skill.rating <= 5);
};

/**
 * Valid status values
 */
export const VALID_STATUSES = ["Draft", "Active", "InActive", "Published"];

/**
 * Check if status is valid
 */
export const isValidStatus = (status: string): boolean => {
  return VALID_STATUSES.includes(status);
};

export const createHiringPipeline = async (
  jobPostingId: string,
  createdByUserId: string,
  accessToken: string
): Promise<ApiResponse<HiringPipelineStage[]>> => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/stagemaster/createHiringPipeline`,
      {
        jobPostingId,
        createdByUserId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating hiring pipeline:", error);
    return {
      success: false,
      error: error,
      message: "Failed to create hiring pipeline",
    };
  }
};

export const getHiringPipeline = async (
  jobPostingId: string,
  accessToken: string
): Promise<ApiResponse<HiringPipelineStage[]>> => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/stagemaster/getHiringPipeline/${jobPostingId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error retrieving hiring pipeline:", error);
    return {
      success: false,
      error: error,
      message: "Failed to retrieve hiring pipeline",
    };
  }
};

export const fetchPipelineData = async (
  applicantId: string,
  accessToken: string
) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}t/applicant/getApplicantPipelineSteps/${applicantId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();

    if (data.success)
      return {
        success: true,
        data: data.data,
        message: data.message,
      };
  } catch (err) {
    return {
      success: false,
      error: err,
      message: "Failed to retrieve appliant pipeline",
    };
  }
};

export const getApplicantPipelineDetails = async (
  applicantId: any,
  token: string,
  calendarId: string
): Promise<ApiResponse<HiringPipelineStage[]>> => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/applicant/getApplicantPipelineDetails`,
      {
        applicantId,
        calendarId,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error creating hiring pipeline:", error);
    return {
      success: false,
      error: error,
      message: "Failed to create hiring pipeline",
    };
  }
};

export const searchUsersWithDepartmentId = async (
  query: string,
  accessToken: string
): Promise<ApiResponse<HrMapping[]>> => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/hrMapping/getUserwithDepartmentId/${query}`,
      {
       
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

export const searchSubordinateWithDepartmentId = async (
  query: string,
  accessToken: string
): Promise<ApiResponse<HrMapping[]>> => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/hrMapping/getSubordinatewithDepartmentId/${query}`,
      {
       
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

export const sendCreatedJDNotification = async (
  JD: any,
  UserDetails: any,
  accessToken: string
) => {
  try {
    if (!JD || !UserDetails || !accessToken) {
      return {
        success: false,
        message: "Missing required parameters: JD, UserDetails, or accessToken",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/created-notification`,
      {
        JD: JD,
        UserDetails: UserDetails,
        accessToken: accessToken,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error sending created JD notification:", error);
    return {
      success: false,
      message: "Failed to send created JD notification",
    };
  }
};

/**
 * Send notification when a JD is edited
 */
export const sendEditedJDNotification = async (
  FormData: any,
  UserDetails: any,
  accessToken: string
) => {
  try {
    if (!FormData || !UserDetails || !accessToken) {
      return {
        success: false,
        message:
          "Missing required parameters: FormData, UserDetails, or accessToken",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/edited-notification`,
      {
        FormData: FormData,
        UserDetails: UserDetails,
        accessToken: accessToken,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error sending edited JD notification:", error);
    return {
      success: false,
      message: "Failed to send edited JD notification",
    };
  }
};

/**
 * Send notification when a JD is deleted
 */
export const sendDeletedJDNotification = async (
  FormData: any,
  UserDetails: any,
  accessToken: string
) => {
  try {
    if (!FormData || !UserDetails || !accessToken) {
      return {
        success: false,
        message:
          "Missing required parameters: FormData, UserDetails, or accessToken",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/deleted-notification`,
      {
        FormData: FormData,
        UserDetails: UserDetails,
        accessToken: accessToken,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error sending deleted JD notification:", error);
    return {
      success: false,
      message: "Failed to send deleted JD notification",
    };
  }
};

/**
 * Send notification for suggesting a new JD
 */
export const sendSuggestNewJDNotification = async (
  FormData: any,
  UserDetails: any,
  content: string,
  accessToken: string
) => {
  try {
    if (!FormData || !UserDetails || !content || !accessToken) {
      return {
        success: false,
        message:
          "Missing required parameters: FormData, UserDetails, content, or accessToken",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/suggest-new-notification`,
      {
        FormData: FormData,
        UserDetails: UserDetails,
        content: content,
        accessToken: accessToken,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error sending suggest new JD notification:", error);
    return {
      success: false,
      message: "Failed to send suggest new JD notification",
    };
  }
};

/**
 * Send notification for suggesting edits to an existing JD
 */
export const sendSuggestEditJDNotification = async (
  FormData: any,
  UserDetails: any,
  content: string,
  accessToken: string
) => {
  try {
    if (!FormData || !UserDetails || !content || !accessToken) {
      return {
        success: false,
        message:
          "Missing required parameters: FormData, UserDetails, content, or accessToken",
      };
    }

    const response = await axios.post(
      `${API_BASE_URL}/suggest-edit-notification`,
      {
        FormData: FormData,
        UserDetails: UserDetails,
        content: content,
        accessToken: accessToken,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: response.data.success,
      message: response.data.message,
    };
  } catch (error) {
    console.error("Error sending suggest edit JD notification:", error);
    return {
      success: false,
      message: "Failed to send suggest edit JD notification",
    };
  }
};


export const getDataForExcelExport = async(status:string,department:string,accessToken:string) => {
  try{
    // Request the file as a blob so axios doesn't try to parse it as JSON
    const response = await axios.get(`${API_BASE_URL}/exportAllJDRequest`, {
      params: {
        status,
        department,
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: 'blob',
    });

    const fileBlob = response.data;

    let filename = 'JD_Report.xlsx';
    try {
      const contentDisposition = response.headers?.['content-disposition'] as string | undefined;
      if (contentDisposition) {
        const match = /filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/.exec(contentDisposition);
        if (match) filename = decodeURIComponent(match[1] || match[2]);
      }
    } catch (e) {
      // ignore and use default
    }

    const url = window.URL.createObjectURL(fileBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return { success: true };
  }
  catch(error: any){
    console.error('Error exporting JD requests:', error);
    return { success: false, error: error?.response?.data || error };
  }
}

/**
 * Fetch the latest version number for a specific JD request
 * @param jdRequestId - The ID of the JD request
 * @param accessToken - Bearer token for authentication
 */
export const getLatestJDVersion = async (
  jdRequestId: string,
  accessToken: string
): Promise<ApiResponse<JDRequestVersion>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/getLatestVersion/${jdRequestId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Error fetching latest JD version:", error);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: "Failed to fetch latest version",
    };
  }
};

/**
 * Fetch version history for a specific JD request
 * @param jdRequestId - The ID of the JD request
 * @param accessToken - Bearer token for authentication
 */
export const getJDVersionHistory = async (
  jdRequestId: string,
  accessToken: string
): Promise<ApiResponse<{ versionHistory: VersionHistoryItem[] }>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/getVersionHistory/${jdRequestId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Error fetching JD version history:", error);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: "Failed to fetch version history",
    };
  }
};

/**
 * Fetch latest versions for multiple JD requests (batch)
 * @param jdRequestIds - Array of JD request IDs
 * @param accessToken - Bearer token for authentication
 */
export const getLatestVersionsBatch = async (
  jdRequestIds: string[],
  accessToken: string
): Promise<ApiResponse<JDRequestVersion[]>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/getLatestVersionsBatch`,
      { jdRequestIds },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error: any) {
    console.error("Error fetching latest versions batch:", error);
    return {
      success: false,
      error: error.response?.data || error.message,
      message: "Failed to fetch versions",
    };
  }
};
export const searchUsersWithDetails = async (
  query: string,
  accessToken: string,
  department?: string
): Promise<UserDetails[]> => {
  try {
    if (!accessToken) {
      return [];
    }

    // Build query parameters
    const params = new URLSearchParams();
    
    if (query && query.trim()) {
      params.append('query', query.trim());
    }
    
    if (department && department.trim()) {
      params.append('department', department.trim());
    }
    
    // If no query and no department, return empty
    if (!params.toString()) {
      return [];
    }

    // Call backend API endpoint
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/graphapi/searchusersbydept?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      return response.data.data;
    }

    return [];
  } catch (error: any) {
    console.error('Error searching users:', error.response?.data || error.message);
    
    // Log specific error for debugging
    if (error.response?.status === 403) {
      console.error('Permission Error: The application needs User.Read.All or Directory.Read.All permissions');
    }
    
    return [];
  }
};


export const searchUsersWithoutDetails = async (
  query: string,
  accessToken: string,
  department?: string
): Promise<UserDetails[]> => {
  try {
    if (!accessToken) {
      return [];
    }

    // Build query parameters
    const params = new URLSearchParams();


     if( department && department.trim()) {
      params.append('department', department.trim());
    }
    
    if (query && query.trim()) {
      params.append('query', query.trim());
    }
    

   
  
    
    // If no query and no department, return empty
    if (!params.toString()) {
      return [];
    }

    // Call backend API endpoint
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/graphapi/searchUsers?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    // console.log("response",response)
    if (response.data) {
      return response.data;
    }

    return [];
  } catch (error: any) {
    console.error('Error searching users:', error.response?.data || error.message);
    
    // Log specific error for debugging
    if (error.response?.status === 403) {
      console.error('Permission Error: The application needs User.Read.All or Directory.Read.All permissions');
    }
    
    return [];
  }
};


/**
 * Get users by department - Alternative endpoint
 */
export const getUsersByDepartment = async (
  department: string,
  accessToken: string
): Promise<UserDetails[]> => {
  try {
    if (!department || !accessToken) {
      return [];
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/jdRequest/department/${encodeURIComponent(department)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      return response.data.data;
    }

    return [];
  } catch (error: any) {
    console.error('Error fetching department users:', error.response?.data || error.message);
    return [];
  }
};

export const searchUsersByDepartment = async (
  query: string,
  accessToken: string,
  department: string
): Promise<UserDetails[]> => {
  try {
    if (!department || !accessToken) {
      return [];
    }

    // Build query parameters
    const params = new URLSearchParams();


     if( department && department.trim()) {
      params.append('department', department.trim());
    }
    
    if (query && query.trim()) {
      params.append('query', query.trim());
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/graphapi/searchusersbydept?department=${encodeURIComponent(department)}&query=${encodeURIComponent(query)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      return response.data.data;
    }

    return [];
  } catch (error: any) {
    console.error('Error fetching department users:', error.response?.data || error.message);
    return [];
  }
};
/**
 * Fetch HR department users (TAG department) for HR selection dropdowns
 * @param accessToken - Bearer token for authentication
 */
export const getHRDepartmentUsers = async (
  accessToken: string
): Promise<UserDetails[]> => {
  try {
    if (!accessToken) {
      return [];
    }

    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/graphapi/users-by-department?department=${import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success && response.data.data) {
      // Map the response to UserDetails format
      return response.data.data.map((user: any) => ({
        id: user.id,
        displayName: user.name,
        email: user.email,
        department: user.department,
        jobTitle: user.designation,
        officeLocation: user.location,
      }));
    }

    return [];
  } catch (error: any) {
    console.error('Error fetching HR department users:', error.response?.data || error.message);
    return [];
  }
};

export const reassignHr = async (jdId:string,hrId:string,accessToken:string) =>{
  try{
    const response = await axios.patch(`${API_BASE_URL}/reassignHr`,{
      hrId,
      jdId
    },{
      headers: {
          Authorization: `Bearer ${accessToken}`,
        },
    })

    return {
      success: true,
      data: response.data,
    };
  }
  catch (error) {
    console.error("reassigning Hr", error);
    return {
      success: false,
      error: error,
    };
  }
}
// HR Info details 
// In your Services/JDRequests.ts file:
export const getHrJDRequests = async (
  accessToken: string,
  params?: {
    IncludeDeleted?: boolean;
    Status?: string;
    Department?: string;
    PageNumber?: number;
    PageSize?: number;
  }
): Promise<ApiResponse<any>> => {
  try {
    const queryParams = new URLSearchParams();
    
    // Add optional parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await axios.get(
      `${API_BASE_URL}/getHrAllJDRequest?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching JD requests:", error);
    return {
      success: false,
      error: error,
    };
  }
};


// Send Email To Management 
export const sendEmailToManagement = async (payload:HRreportDetails) =>{
  try{
    const response = await axios.post(
      `${API_BASE_URL}/triggerReportMail`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payload.accessToken}`,
        },
      }
    );
    return response.data;
  }
  catch(error){
    console.error("Error sending email to management:", error);
    return {
      success: false,
      message: "Failed to send email to management",
    };
  }
}


export const getAllApplicantDetails = async (
  accessToken: string,
): Promise<ApiResponse<any>> => {
  try {

    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/applicant/getAllApplicantDetails`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching JD requests:", error);
    return {
      success: false,
      error: error,
    };
  }
};


export const getAllnterviewPendingDetails = async (
  accessToken: string,
): Promise<ApiResponse<any>> => {
  try {

    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/interview/getAllInterviewDetails`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error fetching JD requests:", error);
    return {
      success: false,
      error: error,
    };
  }
};



// Add this to your Services/JDRequests.ts or create a new service file

export interface AdminDashboardData {
  hrTeamMembers: Array<{
    UserId: string;
    displayName: string;
    email: string;
    jobTitle: string | null;
    department: string;
    officeLocation: string | null;
    ActiveJobCount: number;
    ScheduledInterviewCount: number;
    CompletedInterviewCount: number;
  }>;
  dashboardStats: {
    scheduledInterviews: any[];
    completedInterviews: any[];
    hiredCandidates: any[];
    materialSharedCandidates: any[];
    pendingActionInterviews: any[];
    totalApplicants: any[];
  };
  allData: {
    interviews: any[];
    applicants: any[];
    jdRequests: any[];
    pendingInterviews: any[];
  };
}

// Update the frontend service function
export const getAdminDashboardData = async (
  accessToken: string,
  params?: {
    selectedUserId?: string | null;
    dateFilterType?: any;
    selectedDate?: Date;
  }
): Promise<ApiResponse<any>> => {
  try {
    const queryParams = new URLSearchParams();
    
    if (params) {
      // Handle selectedUserId - only add if not null/undefined
      if (params.selectedUserId !== undefined && params.selectedUserId !== null) {
        queryParams.append('selectedUserId', params.selectedUserId);
      }
      
      if (params.dateFilterType) {
        queryParams.append('dateFilterType', params.dateFilterType);
      }
      
      if (params.selectedDate) {
        queryParams.append('selectedDate', params.selectedDate.toISOString());
      }
    }

    // console.log('Fetching dashboard data with params:', Object.fromEntries(queryParams));

    const response = await axios.get(
      `${API_BASE_URL}/getAdminDashboardData?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 60000, // 60 second timeout
      }
    );

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error: any) {
    console.error("Error fetching admin dashboard data:", error);
    
    // Return a more detailed error
    return {
      success: false,
      error: {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      },
    };
  }
};