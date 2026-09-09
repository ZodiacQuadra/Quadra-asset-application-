// api/jobPostingService.ts
import axios from "axios";
import { PreparationMaterial } from "../Management/Components/JobPosting/CreateJobModal";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`; // Adjust based on your backend URL

// Types for better type safety
interface JobData {
  title: string;
  description: string;
  code: string;
  department: string;
  departmentCode: string;
  status: string;
  createdByUserId: string;
  modifiedByUserId?: string;
  skills: string[];
  additionalResponsibilities: string[];
  OptionalUser:string,
  departmentId:string
  preparationMaterial:PreparationMaterial[]
}

interface JobData1 {
  title: string;
  description: string;
  code: string;
  department: string;
  departmentId: string;
  departmentCode: string;
  status: string;
  createdByUserId: string;
  skills: string[];
  additionalResponsibilities: string[];
  OptionalUser?: string;
  interviewerUserId?: string | null; // ADD THIS LINE
  preparationMaterial:PreparationMaterial[]
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: any;
}

interface Filters {
  status?: string;
  search?: string;
}

// Update createJobPosting API function
export const createJobPosting = async (
  jobData: JobData1,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/jobposting/createjobposting`,
      {
        title: jobData.title,
        description: jobData.description,
        code: jobData.code,
        department: jobData.department,
        status: jobData.status,
        createdByUserId: jobData.createdByUserId,
        skills: jobData.skills,
        responsibilities: jobData.additionalResponsibilities,
        OptionalUser: jobData.OptionalUser,
        departmentID: jobData.departmentId,
        interviewerUserId: jobData.interviewerUserId, // ADD THIS LINE
        preparationMaterial: jobData.preparationMaterial
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
    console.error("Error creating job posting:", error);
    let errorMessage = "An unknown error occurred.";
    if (axios.isAxiosError(error) && error.response) {
      errorMessage = error.response.data.error || errorMessage;
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
};


// Check jobcode exist
export const checkJobCodeExist = async (jobCode:string,accessToken:string) => {
  try {
      const response = await axios.get(
          `${API_BASE_URL}/jobposting/checkJobCodeExist/${jobCode}`,
          {
              headers: {
                  Authorization: `Bearer ${accessToken}`,
              },
          }
      );
      // console.log("Job code existence response:", response.data);
      return response.data?.data?.exists;
  }
  catch (error) {
      console.error("Error checking job code existence:", error);
      return true;
  }
}

export const createSuggestions = async (
  accessToken: string,
  jobData?: any
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/jobposting/createjobsuggestion`,
      {
        ...jobData,
      },
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
    console.error("Error creating job posting:", error);
    return {
      success: false,
      error: error,
    };
  }
};

// Update an existing job posting
export const updateJobPosting = async (
  jobId: string | number,
  jobData: JobData,
  changeReason: string = "",
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/jobposting/updatejobposting/${jobId}`,
      {
        title: jobData.title,
        description: jobData.description,
        department: jobData.department,
        departmentCode: jobData.departmentCode,
        status: jobData.status,
        modifiedByUserId: jobData.modifiedByUserId || jobData.createdByUserId,
        skills: jobData.skills,
        responsibilities: jobData.additionalResponsibilities,
        OptionalUser:jobData.OptionalUser??null,
        changeReason,
        preparationMaterial: jobData.preparationMaterial || [],
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
    console.error("Error updating job posting:", error);
    return {
      success: false,
      error: error,
    };
  }
};

// Get all job postings with optional filters
export const getAllJobPostings = async (
  filters: Filters = {},
  accessToken: string
): Promise<ApiResponse<any[]>> => {
  try {
    const params = new URLSearchParams();

    if (filters.status && filters.status !== "all") {
      params.append("status", filters.status);
    }

    if (filters.search) {
      params.append("search", filters.search);
    }

    const response = await axios.get(
      `${API_BASE_URL}/jobposting/getalljobpostings?${params}`,
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
    console.error("Error fetching job postings:", error);
    return {
      success: false,
      error: error,
    };
  }
};

// Get a specific job posting by ID
export const getJobPostingById = async (
  jobPostingId: number,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/jobposting/getjobposting/${jobPostingId}`,
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
    console.error("Error fetching job posting:", error);
    return {
      success: false,
      error: error,
    };
  }
};

/**
 * Approve a job suggestion
 * @param {string} suggestionId - The ID of the suggestion to approve
 * @param {string} approvedByUserId - The ID of the user approving the suggestion
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const approveSuggestion = async (
  suggestionId: string,
  approvedByUserId: string,
  accessToken: string
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/jobposting/suggestions/${suggestionId}/approve`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ approvedByUserId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to approve suggestion");
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error approving suggestion:", error);

    return {
      success: false,
      error: error || "Failed to approve suggestion",
    };
  }
};

/**
 * Reject a job suggestion
 * @param {string} suggestionId - The ID of the suggestion to reject
 * @param {string} rejectedByUserId - The ID of the user rejecting the suggestion
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const rejectSuggestion = async (
  suggestionId: string,
  rejectedByUserId: string,
  accessToken: string
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/jobposting/suggestions/${suggestionId}/reject`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ rejectedByUserId }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to reject suggestion");
    }

    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error("Error rejecting suggestion:", error);

    return {
      success: false,
      error: error || "Failed to reject suggestion",
    };
  }
};

/**
 * Get change logs for a specific job posting
 * @param {string} jobId - The ID of the job posting
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export const getJobChangeLogs = async (jobId: string, accessToken: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/jobposting/jobs/${jobId}/changelogs`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch change logs");
    }

    return {
      success: true,
      data: data.data || [],
    };
  } catch (error) {
    console.error("Error fetching change logs:", error);

    return {
      success: false,
      error: error || "Failed to fetch change logs",
    };
  }
};

// Utility functions for data transformation
export const transformApiJobPosting = (apiData: any) => {
  return {
    id: apiData.id,
    title: apiData.title,
    description: apiData.description,
    skills: apiData.skills || [],
    additionalResponsibilities: apiData.additionalResponsibilities || [],
    status: apiData.status,
    createdAt: new Date(apiData.createdAt),
    modifiedAt: new Date(apiData.modifiedAt),
    createdBy: apiData.userName || "Unknown User", // This might need adjustment based on your user data
    createdByUserId: apiData.createdByUserId,
    modifiedByUserId: apiData.modifiedByUserId,
    hasPendingSuggestions: apiData.hasPendingSuggestions || false,
  };
};

export const transformApiChangeLog = (apiData: any) => {
  return {
    id: apiData.id,
    jobPostingId: apiData.jobPostingId,
    type: apiData.type,
    oldValue: apiData.oldValue,
    newValue: apiData.newValue,
    changedBy: apiData.userName || "Unknown User",
    changedAt: new Date(apiData.changedAt),
    suggestedBy: apiData.suggestedBy,
  };
};



export interface UserDepartmentMapping {
  Id: number;
  UserId: string;
  DepartmentId: string;
  IsActive: boolean;
  CreatedAt: string;
  CreatedBy: string;
  ModifiedBy: string;
  ModifiedAt: string;
}

// Function to get user-department mappings for a specific user
export const getUserDepartmentMappings = async (
  userId: string,
  accessToken: string
): Promise<{ success: boolean; data?: UserDepartmentMapping[]; error?: string }> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/jobposting/department/userdata/${userId}`,
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
    console.error("Error fetching user department mappings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// Function to get all user-department mappings (optional)
export const getAllUserDepartmentMappings = async (
  accessToken: string
): Promise<{ success: boolean; data?: UserDepartmentMapping[]; error?: string }> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/jobposting/department/allusersdata`,
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
    console.error("Error fetching all user department mappings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};