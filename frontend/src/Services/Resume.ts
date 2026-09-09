// =============================================
// FRONTEND API FUNCTIONS - APPLICANT MANAGEMENT
// =============================================

import axios from "axios";
import { getStoredAuthToken } from "../Auth/tokenStorage";

// Base URL for your API
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/applicant`;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = getStoredAuthToken();
  return {
    "Content-Type": "application/json",
    Authorization: token ? `Bearer ${token}` : "",
  };
};

// Helper function to handle API errors
const handleApiError = (error: any) => {
  console.error("API Error:", error.response?.data || error.message);
  return {
    success: false,
    error: error.response?.data?.message || error.message,
    details: error.response?.data,
  };
};

// =============================================
// CREATE APPLICANT
// =============================================
export const createApplicant = async (applicantData: any) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/createApplicant`,
      {
        jobPostingId: applicantData.jobPostingId,
        firstName: applicantData.firstName,
        lastName: applicantData.lastName,
        email: applicantData.email,
        phone: applicantData.phone || null,
        address: applicantData.address || null,
        education: applicantData.education || null,
        experienced: applicantData.experienced || false,
        experienceDetails: applicantData.experienceDetails || null,
        fileName: applicantData.fileName || null,
        fileSize: applicantData.fileSize || null,
        uploadDate: applicantData.uploadDate || null,
        blobUrl: applicantData.blobUrl || null,
        blobPath: applicantData.blobPath || null,
        skills: applicantData.skills || [],
        createdByUserID: applicantData.createdByUserID || null,
        source: applicantData.source || 'Referral' || null
      },
      {
        headers: getAuthHeaders(),
        timeout: 30000,
      }
    );

    return {
      success: true,
      data: response.data,
      message: response.data.message,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// Add this to your Resume service file
export const updateApplicantBlobUrl = async (
  applicantId: string,
  blobData: { blobUrl: string; blobPath: string },
  accessToken: string
) => {
  try {
    const response = await fetch(`${API_BASE_URL}/updateApplicantBlobUrl`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        // Add auth headers if needed
      },
      body: JSON.stringify({
        applicantId,
        blobUrl: blobData.blobUrl,
        blobPath: blobData.blobPath,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || "Failed to update blob URL");
    }

    return result;
  } catch (error) {
    console.error("Error updating blob URL:", error);
    throw error;
  }
};

// =============================================
// UPDATE APPLICANT
// =============================================
export const updateApplicant = async (applicantId: any, updateData: any) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/updateApplicant/${applicantId}`,
      {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email,
        phone: updateData.phone,
        address: updateData.address,
        education: updateData.education,
        experienced: updateData.experienced,
        experienceDetails: updateData.experienceDetails,
        fileName: updateData.fileName,
        fileSize: updateData.fileSize,
        uploadDate: updateData.uploadDate,
        blobUrl: updateData.blobUrl,
        blobPath: updateData.blobPath,
        skills: updateData.skills.map((skill: any) => skill.value),
        status: updateData.status,
        modifiedByUserID: updateData.modifiedByUserID,
      },
      {
        headers: getAuthHeaders(),
        timeout: 30000,
      }
    );

    return {
      success: true,
      data: response.data,
      message: response.data.message,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// =============================================
// DELETE APPLICANT (SOFT DELETE)
// =============================================
export const deleteApplicant = async (
  applicantId: any,
  deletedByUserID = null
) => {
  try {
    const response = await axios.delete(
      `${API_BASE_URL}/deleteApplicant/${applicantId}`,
      {
        headers: getAuthHeaders(),
        timeout: 30000,
        data: {
          deletedByUserID: deletedByUserID,
        },
      }
    );

    return {
      success: true,
      data: response.data,
      message: response.data.message,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// =============================================
// GET APPLICANT BY ID
// =============================================
export const getApplicantById = async (applicantId: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/getApplicant/${applicantId}`,
      {
        headers: getAuthHeaders(),
        timeout: 30000,
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// =============================================
// GET APPLICANTS BY JOB ID
// =============================================
export const getApplicantsByJobId = async (jobPostingId: string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/getApplicantsByJob/${jobPostingId}`,
      {
        headers: getAuthHeaders(),
        timeout: 30000,
      }
    );

    return {
      success: true,
      data: response.data.data,
      count: response.data.count,
      message: response.data.message,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

export const getApplicantsByJobWithParams = async (jobPostingId: string,filter:string) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/getApplicantsByJob/${jobPostingId}/${filter}`,
      {
        headers: getAuthHeaders(),
        timeout: 30000,
      }
    );

    return {
      success: true,
      data: response.data.data,
      count: response.data.count,
      message: response.data.message,
    };
  } catch (error) {
    return handleApiError(error);
  }
};

// Export all functions as default
export default {
  createApplicant,
  updateApplicant,
  deleteApplicant,
  getApplicantById,
  getApplicantsByJobId,
};
