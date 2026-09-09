import axios, { AxiosResponse } from "axios";
import { Applicant } from "../Types/interview";

// Base API URL - update this to match your backend URL
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/bgvRequest`;

// Configure axios defaults
axios.defaults.headers.common["Content-Type"] = "application/json";

// Type definitions
export interface BGVRequestData {
  bgvRequestId: string | null | undefined;
  employeeId: string;
  firstName: string;
  lastName: string;
  emailId: string;
  fatherName: string;
  gender: string;
  maritalStatus: string;
  dateOfBirth: string;
  nationality: string;
  employeeCode: string;
  experienceLevel: string;
  personalEmail: string;
  currentAddress: string;
  currentFromDate: string;
  currentToDate: string;
  currentTelephone: string;
  currentMobile: string;
  permanentAddressSame: boolean;
  permanentAddress: string;
  permanentFromDate?: string;
  permanentToDate?: string;
  permanentTelephone: string;
  permanentMobile: string;
  status?: string;
  createdBy: string;
  modifiedBy?: string;
  department?: string;
  position?: string;
  requestedBy?: string;
}

export interface EmploymentHistoryData {
  employmentHistoryId?: string | null;
  bgvRequestId: string;
  companyName: string;
  position: string;
  headOfficeAddress: string;
  headOfficePhone: string;
  branchOfficeAddress?: string;
  branchOfficePhone?: string;
  employmentFrom: string;
  employmentTo: string;
  employeeCode?: string;
  employmentNature: string;
  agencyDetails?: string;
  responsibilities?: string;
  lastCTC: number;
  reasonForLeaving?: string;
  hrName?: string;
  hrPosition?: string;
  hrLandline?: string;
  hrMobile?: string;
  hrEmail?: string;
  reportingAuthorityName?: string;
  reportingAuthorityPosition?: string;
  reportingAuthorityLandline?: string;
  reportingAuthorityMobile?: string;
  reportingAuthorityEmail?: string;
  startDate?: string; // Alias for employmentFrom
  endDate?: string; // Alias for employmentTo
  salary?: number; // Alias for lastCTC
  reason?: string; // Alias for reasonForLeaving
}

export interface BGVFilters {
  status?: string;
  employeeId?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface BGVRequestDetails {
  bgvRequestId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  employeeName: string;
  emailId: string;
  fatherName: string;
  gender: string;
  maritalStatus: string;
  dateOfBirth: string;
  nationality: string;
  employeeCode: string;
  experienceLevel: string;
  personalEmail: string;
  currentAddress: string;
  currentFromDate: string;
  currentToDate: string;
  currentTelephone: string;
  currentMobile: string;
  permanentAddressSame: boolean;
  permanentAddress: string;
  permanentFromDate?: string;
  permanentToDate?: string;
  permanentTelephone: string;
  permanentMobile: string;
  status: string;
  createdBy: string;
  createdDate: string;
  modifiedBy?: string;
  modifiedDate?: string;
  submittedBy?: string;
  submittedDate?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  completedBy?: string;
  completedDate?: string;
  createdAt: string; // Alias for createdDate
  updatedAt: string; // Alias for modifiedDate
  id: string; // Alias for bgvRequestId
}

export interface EmploymentHistory {
  employmentHistoryId: string;
  id: string; // Alias for employmentHistoryId
  bgvRequestId: string;
  companyName: string;
  position: string;
  headOfficeAddress: string;
  headOfficePhone: string;
  branchOfficeAddress?: string;
  branchOfficePhone?: string;
  employmentFrom: string;
  employmentTo: string;
  employeeCode?: string;
  employmentNature: string;
  agencyDetails?: string;
  responsibilities?: string;
  lastCTC: number;
  reasonForLeaving?: string;
  hrName?: string;
  hrPosition?: string;
  hrLandline?: string;
  hrMobile?: string;
  hrEmail?: string;
  reportingAuthorityName?: string;
  reportingAuthorityPosition?: string;
  reportingAuthorityLandline?: string;
  reportingAuthorityMobile?: string;
  reportingAuthorityEmail?: string;
  isActive: boolean;
  createdDate: string;
  modifiedDate?: string;
  startDate: string; // Alias for employmentFrom
  endDate?: string; // Alias for employmentTo
}

interface BGVMyFilters extends BGVFilters {
  createdBy: string; // Required for "My" requests
}

export interface DocumentInfo {
  documentId: string;
  id: string; // Alias for documentId
  bgvRequestId: string;
  documentCategory: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  blobStoragePath: string;
  uploadedBy: string;
  uploadedDate: string;
  uploadedAt: string; // Alias for uploadedDate
  isActive: boolean;
  createdDate: string;
  modifiedDate?: string;
}

// 1. Create/Update BGV Request
export const createBGVRequest = async (
  requestData: BGVRequestData,
  accessToken: string
): Promise<ApiResponse> => {
  try {
    const response: AxiosResponse<ApiResponse> = await axios.post(
      `${BASE_URL}/createBGVRequest`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to create BGV request");
  }
};

export const updateBGVRequest = async (
  requestData: BGVRequestData,
  accessToken: string
): Promise<ApiResponse> => {
  try {
    const response: AxiosResponse<ApiResponse> = await axios.put(
      `${BASE_URL}/updateBGVRequest`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to update BGV request");
  }
};

export const GetHiredCandidatesForBgv = async (
  query: string,
  accessToken: string
): Promise<ApiResponse> => {
  try {
    const response: AxiosResponse<ApiResponse<Applicant[]>> = await axios.get(
      `${BASE_URL}/getApplicantList/${query}`,
      
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to update BGV request");
  }
};



export const saveAsDraftBGVRequest = async (
  requestData: BGVRequestData,
  accessToken: string
): Promise<ApiResponse> => {
  try {
    const response: AxiosResponse<ApiResponse> = await axios.post(
      `${BASE_URL}/saveAsDraftBGVRequest`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to save BGV request as draft");
  }
};
// 2. Add/Update Employment History
export const addUpdateEmploymentHistory = async (
  data: EmploymentHistoryData,
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    // console.log("Received employment history data:", data); // Debug logging
    // Ensure proper GUID format for employment history ID
    const employmentHistoryId =
      data.employmentHistoryId && data.employmentHistoryId.length === 36
        ? data.employmentHistoryId
        : null; // Let SQL generate new GUID

    const payload = {
      EmploymentHistoryID: employmentHistoryId, // Use PascalCase for SQL
      BGVRequestID: data.bgvRequestId,
      CompanyName: data.companyName,
      Position: data.position,
      HeadOfficeAddress: data.headOfficeAddress,
      HeadOfficePhone: data.headOfficePhone,
      BranchOfficeAddress: data.branchOfficeAddress || null,
      BranchOfficePhone: data.branchOfficePhone || null,
      EmploymentFrom: data.employmentFrom || null, // Send null instead of empty string
      EmploymentTo: data.employmentTo || null,
      EmployeeCode: data.employeeCode || null,
      EmploymentNature: data.employmentNature,
      AgencyDetails: data.agencyDetails || null,
      Responsibilities: data.responsibilities || null,
      LastCTC: data.lastCTC,
      ReasonForLeaving: data.reasonForLeaving || null,
      HRName: data.hrName || null,
      HRPosition: data.hrPosition || null,
      HRLandline: data.hrLandline || null,
      HRMobile: data.hrMobile || null,
      HREmail: data.hrEmail || null,
      ReportingAuthorityName: data.reportingAuthorityName || null,
      ReportingAuthorityPosition: data.reportingAuthorityPosition || null,
      ReportingAuthorityLandline: data.reportingAuthorityLandline || null,
      ReportingAuthorityMobile: data.reportingAuthorityMobile || null,
      ReportingAuthorityEmail: data.reportingAuthorityEmail || null,
    };

    // console.log("Sending employment history payload:", payload); // Debug logging

    const response = await axios.post(
      `${BASE_URL}/addUpdateEmploymentHistory`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 30000, // 30 second timeout
      }
    );
    // console.log("API response:", response); // Debug logging
    // Axios automatically parses JSON response
    return {
      success: true,
      message: "Employment history saved successfully",
      data: response.data,
    };
  } catch (error) {
    console.error("Error in addUpdateEmploymentHistory:", error);

    // Handle axios-specific errors
    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          error.response.statusText ||
          `Server error: ${error.response.status}`;

        return {
          success: false,
          message: `HTTP ${error.response.status}: ${errorMessage}`,
          data: null,
        };
      } else if (error.request) {
        // Request was made but no response received
        return {
          success: false,
          message: "Network error - no response from server",
          data: null,
        };
      } else {
        // Something else happened
        return {
          success: false,
          message: `Request setup error: ${error.message}`,
          data: null,
        };
      }
    }

    // Non-axios error
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      data: null,
    };
  }
};

// 3. Submit BGV Request
export const submitBGVRequest = async (
  bgvRequestId: string,
  submittedBy: string,
  accessToken: string
): Promise<ApiResponse> => {
  try {
    const response: AxiosResponse<ApiResponse> = await axios.post(
      `${BASE_URL}/submitBGVRequest`,
      {
        bgvRequestId,
        submittedBy,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to submit BGV request");
  }
};

// 4. Approve/Reject BGV Request
export const approveBGVRequest = async (
  bgvRequestId: string,
  action: "Approve" | "Reject",
  actionBy: string,
  comments: string = "",
  accessToken: string
): Promise<ApiResponse> => {
  try {
    const response: AxiosResponse<ApiResponse> = await axios.post(
      `${BASE_URL}/approveBGVRequest`,
      {
        bgvRequestId,
        action,
        actionBy,
        comments,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error(`Failed to ${action.toLowerCase()} BGV request`);
  }
};

// 5. Complete BGV Request
export const completeBGVRequest = async (
  bgvRequestId: string,
  completedBy: string,
  accessToken: string
): Promise<ApiResponse> => {
  try {
    const response: AxiosResponse<ApiResponse> = await axios.post(
      `${BASE_URL}/completeBGVRequest`,
      {
        bgvRequestId,
        completedBy,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to complete BGV request");
  }
};

// 6. Get BGV Request Details
export const getBGVRequestDetails = async (
  bgvRequestId: string,
  accessToken: string
): Promise<ApiResponse<BGVRequestDetails>> => {
  try {
    const response: AxiosResponse<ApiResponse<
      BGVRequestDetails
    >> = await axios.get(`${BASE_URL}/getBGVRequestDetails/${bgvRequestId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to get BGV request details");
  }
};

// 7. Get BGV Requests List
export const getBGVRequestsList = async (
  filters: BGVFilters = {},
  accessToken: string
): Promise<ApiResponse<BGVRequestDetails[]>> => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.status) queryParams.append("status", filters.status);
    if (filters.employeeId)
      queryParams.append("employeeId", filters.employeeId);
    if (filters.pageNumber)
      queryParams.append("pageNumber", filters.pageNumber.toString());
    if (filters.pageSize)
      queryParams.append("pageSize", filters.pageSize.toString());

    const response: AxiosResponse<ApiResponse<
      BGVRequestDetails[]
    >> = await axios.get(
      `${BASE_URL}/getBGVRequestsList?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to get BGV requests list");
  }
};

export const deleteBGVRequest = async (
  bgvRequestId: string,
  deletedBy: string,
  token: string
): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    const response = await fetch(
      `${BASE_URL}/deleteBGVRequest/${bgvRequestId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deletedBy }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Failed to delete BGV request",
      };
    }

    return {
      success: true,
      message: data.message || "BGV request deleted successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Error deleting BGV request:", error);
    return {
      success: false,
      message: "Failed to delete BGV request. Please try again.",
    };
  }
};

export const getMyBGVRequestsList = async (
  filters: BGVMyFilters,
  accessToken: string
): Promise<ApiResponse<BGVRequestDetails[]>> => {
  try {
    if (!filters.createdBy) {
      throw new Error(
        "CreatedBy is required for fetching personal BGV requests"
      );
    }

    const queryParams = new URLSearchParams();

    queryParams.append("createdBy", filters.createdBy);
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.employeeId)
      queryParams.append("employeeId", filters.employeeId);
    if (filters.pageNumber)
      queryParams.append("pageNumber", filters.pageNumber.toString());
    if (filters.pageSize)
      queryParams.append("pageSize", filters.pageSize.toString());

    const response: any = await axios.get(
      `${BASE_URL}/getMyBGVRequestsList?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to get my BGV requests list");
  }
};
// 8. Upload Document
// Improved uploadDocument service function
export const uploadDocument = async (
  bgvRequestId: string,
  documentCategory: string,
  uploadedBy: string,
  file: File,
  accessToken: string
): Promise<ApiResponse<DocumentInfo>> => {
  try {
    // console.log("Starting upload:", {
    //   bgvRequestId,
    //   documentCategory,
    //   fileName: file.name,
    //   fileSize: file.size,
    //   uploadedBy,
    // });

    const formData = new FormData();
    formData.append("bgvRequestId", bgvRequestId);
    formData.append("documentCategory", documentCategory);
    formData.append("uploadedBy", uploadedBy);
    formData.append("file", file);

    // Log FormData contents
    for (let [key, value] of formData.entries()) {
      console.log(`FormData ${key}:`, value);
    }

    const response: AxiosResponse<ApiResponse<DocumentInfo>> = await axios.post(
      `${BASE_URL}/uploadDocument`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 30000, // 30 second timeout
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            // console.log(
            //   `Upload progress for ${file.name}: ${progress.toFixed(2)}%`
            // );
          }
        },
      }
    );

    // console.log("Upload response:", response.data);

    if (!response.data.success) {
      throw new Error(
        response.data.message || response.data.error || "Upload failed"
      );
    }

    return response.data;
  } catch (error) {
    console.error("Upload error:", error);

    if (axios.isAxiosError(error)) {
      if (error.response) {
        // Server responded with error status
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          error.message;
        throw new Error(errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error(
          "No response from server. Please check your connection."
        );
      } else {
        // Something else went wrong
        throw new Error(error.message);
      }
    }

    throw new Error("Failed to upload document");
  }
};

// 9. Delete Employment History
export const deleteEmploymentHistory = async (
  currentid: string,
  employmentHistoryId: string,
  accessToken: string
): Promise<ApiResponse> => {
  try {
    const response: AxiosResponse<ApiResponse> = await axios.delete(
      `${BASE_URL}/deleteEmploymentHistory/${employmentHistoryId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete employment history");
  }
};

// 10. Get Employment History
export const getEmploymentHistory = async (
  bgvRequestId: string,
  accessToken: string
): Promise<ApiResponse<EmploymentHistory[]>> => {
  try {
    const response: AxiosResponse<ApiResponse<
      EmploymentHistory[]
    >> = await axios.get(`${BASE_URL}/getEmploymentHistory/${bgvRequestId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to get employment history");
  }
};

// 11. Get Documents
export const getBGVDocuments = async (
  bgvRequestId: string,
  accessToken: string
): Promise<ApiResponse<DocumentInfo[]>> => {
  try {
    const response: AxiosResponse<ApiResponse<
      DocumentInfo[]
    >> = await axios.get(`${BASE_URL}/getDocuments/${bgvRequestId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.data;
  } catch (error) {
    throw new Error("Failed to get documents");
  }
};

// 12. Delete Document
export const deleteDocument = async (
  documentId: string,
  accessToken: string
): Promise<ApiResponse> => {
  try {
    const response: AxiosResponse<ApiResponse> = await axios.delete(
      `${BASE_URL}/deleteDocument/${documentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to delete document");
  }
};

// Utility function to upload multiple files for a category
export const uploadMultipleDocuments = async (
  bgvRequestId: string,
  documentCategory: string,
  uploadedBy: string,
  files: File[],
  accessToken: string
): Promise<ApiResponse<DocumentInfo[]>> => {
  try {
    const uploadPromises = files.map((file) =>
      uploadDocument(
        bgvRequestId,
        documentCategory,
        uploadedBy,
        file,
        accessToken
      )
    );

    const results = await Promise.all(uploadPromises);
    const data = results
      .map((result) => result.data)
      .filter(Boolean) as DocumentInfo[];

    return {
      success: true,
      message: `${files.length} files uploaded successfully`,
      data,
    };
  } catch (error) {
    throw new Error(`Failed to upload multiple files`);
  }
};

// services/BGVTokenService.ts
export interface BGVTokenData {
  TokenID: string;
  Token: string;
  ExpiryDate: string;
  BGVRequestID: string;
  bgvUrl: string;
}

export interface TokenValidationData {
  TokenID: string;
  BGVRequestID: string;
  Token: string;
  IsUsed: boolean;
  ExpiryDate: string;
  UsedDate?: string;
  TokenStatus: "VALID" | "USED" | "EXPIRED" | "INACTIVE";
  FirstName?: string;
  LastName?: string;
  EmailID?: string;
  BGVStatus?: string;
}

export interface TokenValidationResponse {
  success: boolean;
  data?: TokenValidationData;
  message?: string;
}

export const generateBGVToken = async (
  bgvRequestId: string,
  expiryDays: number = 30,
  accessToken: string
): Promise<{ success: boolean; data?: BGVTokenData; message?: string }> => {
  try {
    const response = await fetch(`${BASE_URL}/generateBGVToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        bgvRequestId,
        expiryDays,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error generating BGV token:", error);
    return {
      success: false,
      message: "Failed to generate BGV token",
    };
  }
};

export interface BGVTokenData {
  TokenID: string;
  Token: string;
  ExpiryDate: string;
  BGVRequestID: string;
  BGVFormattedID: string;
  bgvUrl: string;
}

export interface TokenValidationData {
  TokenID: string;
  BGVRequestID: string;
  Token: string;
  IsUsed: boolean;
  ExpiryDate: string;
  UsedDate?: string;
  TokenStatus: "VALID" | "USED" | "EXPIRED" | "INACTIVE";
  FirstName?: string;
  LastName?: string;
  PersonalEmail?: string;
  BGVStatus?: string;
}

export interface TokenValidationResponse {
  success: boolean;
  data?: TokenValidationData;
  message?: string;
}

// Keep existing functions unchanged
export const validateBGVToken = async (
  token: string,
  accessToken: string
): Promise<TokenValidationResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/validateBGVToken/${token}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error validating BGV token:", error);
    return {
      success: false,
      message: "Failed to validate token",
    };
  }
};

// First, define the interfaces
interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  uploadedAt: string;
  uploaded?: boolean;
  documentId?: string;
  uploadError?: boolean;
  blobStoragePath?: string;
}

interface BGVSubmissionResult {
  success: boolean;
  message: string;
  data: {
    bgvRequestId: string;
    BGVFormattedID: string;
    [key: string]: any;
  };
}

export const submitBGVRequestWithAllData = async (
  token: string,
  formData: any,
  accessToken: string,
  currentUserId?: string
): Promise<BGVSubmissionResult> => {
  try {
    // Step 1: Submit the BGV request and get the BGV Request ID
    const bgvResponse = await fetch(`${BASE_URL}/submitBGVRequestViaToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token,
        ...formData,
        // Don't include employmentHistory and uploadedFiles here
      }),
    });

    const bgvResult = await bgvResponse.json();

    // Check multiple possible field names for BGV Request ID
    const bgvRequestId =
      bgvResult.data?.bgvRequestId ||
      bgvResult.data?.BGVRequestID ||
      bgvResult.BGVRequestID;

    if (!bgvResult.success || !bgvRequestId) {
      throw new Error(bgvResult.message || "Failed to create BGV request");
    }

    // Step 2: Save all employment history records
    // if (formData.employmentHistory && formData.employmentHistory.length > 0) {
    //   for (const emp of formData.employmentHistory) {
    //     // Convert dates to ISO strings if they're Date objects
    //     const employmentFrom =
    //       emp.employmentFrom instanceof Date
    //         ? emp.employmentFrom.toISOString()
    //         : emp.employmentFrom;

    //     const employmentTo =
    //       emp.employmentTo instanceof Date
    //         ? emp.employmentTo.toISOString()
    //         : emp.employmentTo;

    //     const empData = {
    //       BGVRequestID: bgvRequestId,
    //       CompanyName: emp.companyName,
    //       Position: emp.position,
    //       HeadOfficeAddress: emp.headOfficeAddress,
    //       HeadOfficePhone: emp.headOfficePhone,
    //       BranchOfficeAddress: emp.branchOfficeAddress,
    //       BranchOfficePhone: emp.branchOfficePhone,
    //       EmploymentFrom: employmentFrom,
    //       EmploymentTo: employmentTo,
    //       EmployeeCode: emp.employeeCode,
    //       EmploymentNature: emp.employmentNature,
    //       AgencyDetails: emp.agencyDetails,
    //       Responsibilities: emp.responsibilities,
    //       LastCTC: parseFloat(emp.lastCTC) || 0,
    //       ReasonForLeaving: emp.reasonForLeaving,
    //       HRName: emp.hrName,
    //       HRPosition: emp.hrPosition,
    //       HRLandline: emp.hrLandline,
    //       HRMobile: emp.hrMobile,
    //       HREmail: emp.hrEmail,
    //       ReportingAuthorityName: emp.reportingAuthorityName,
    //       ReportingAuthorityPosition: emp.reportingAuthorityPosition,
    //       ReportingAuthorityLandline: emp.reportingAuthorityLandline,
    //       ReportingAuthorityMobile: emp.reportingAuthorityMobile,
    //       ReportingAuthorityEmail: emp.reportingAuthorityEmail,
    //     };

    //     try {
    //       const empResponse = await axios.post(
    //         `${BASE_URL}/addUpdateEmploymentHistory`,
    //         empData,
    //         {
    //           headers: { "Content-Type": "application/json" },
    //         }
    //       );

    //       if (!empResponse.data.success) {
    //         console.error(
    //           "Failed to save employment history:",
    //           empResponse.data.message
    //         );
    //       }
    //     } catch (empError) {
    //       console.error("Error saving employment history:", empError);
    //     }
    //   }
    // }

    // Step 3: Upload all documents
    if (formData.uploadedFiles) {
      for (const [category, files] of Object.entries(formData.uploadedFiles)) {
        for (const file of files as FileData[]) {
          if (file.file && !file.uploaded) {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file.file);
            uploadFormData.append("bgvRequestId", bgvRequestId);
            uploadFormData.append("documentCategory", category);
            uploadFormData.append(
              "uploadedBy",
              currentUserId || formData.employeeId || ""
            );

            try {
              const uploadResponse = await axios.post(
                `${BASE_URL}/uploadDocument`,
                uploadFormData,
                {
                  headers: { "Content-Type": "multipart/form-data" },
                }
              );

              if (!uploadResponse.data.success) {
                console.error(
                  "Failed to upload document:",
                  uploadResponse.data.message
                );
              }
            } catch (uploadError) {
              console.error("Error uploading document:", uploadError);
            }
          }
        }
      }
    }

    // Return the proper structure
    return {
      success: true,
      message: "BGV request submitted successfully with all data",
      data: {
        bgvRequestId: bgvRequestId,
        BGVFormattedID: bgvResult.data?.BGVFormattedID || bgvRequestId,
        ...bgvResult.data,
      },
    };
  } catch (error) {
    console.error("Error in comprehensive submission:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
      data: {
        bgvRequestId: "",
        BGVFormattedID: "",
      },
    };
  }
};
export interface ExistingTokenData {
  hasExistingToken: boolean;
  tokenData?: {
    TokenID: string;
    BGVRequestID: string;
    Token: string;
    IsUsed: boolean;
    ExpiryDate: string;
    UsedDate?: string;
    CreatedDate: string;
    TokenStatus: "VALID" | "USED" | "EXPIRED" | "INACTIVE";
    BGVFormattedID: string;
    FirstName: string;
    LastName: string;
    EmailID: string;
    BGVStatus: string;
  } | null;
}

// Check if applicant already has a BGV token
export const checkExistingBGVToken = async (
  applicantId: string,
  accessToken: string
): Promise<{
  success: boolean;
  data?: ExistingTokenData;
  message?: string;
}> => {
  try {
    const response = await fetch(`${BASE_URL}/checkBGVToken/${applicantId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error checking existing BGV token:", error);
    return {
      success: false,
      message: "Failed to check existing BGV token",
    };
  }
};

export const extendExpiredBGVToken = async (
  applicantId: string,
  expiryDays: number = 30,
  accessToken: string
): Promise<{ success: boolean; data?: BGVTokenData; message?: string }> => {
  try {
    const response = await fetch(`${BASE_URL}/extendBGVToken`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        applicantId,
        expiryDays,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error extending BGV token:", error);
    return {
      success: false,
      message: "Failed to extend BGV token",
    };
  }
};
// Updated function with force regenerate option
export const generateBGVTokenForApplicant = async (
  applicantId: string,
  firstName: string,
  lastName: string,
  personalEmail: string,
  expiryDays: number = 30,
  forceRegenerate: boolean = false,
  accessToken: string
): Promise<{
  success: boolean;
  data?: BGVTokenData;
  message?: string;
  isExtended?: boolean;
}> => {
  try {
    const response = await fetch(`${BASE_URL}/generateBGVTokenForApplicant`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        applicantId,
        firstName,
        lastName,
        personalEmail,
        expiryDays,
        forceRegenerate,
      }),
    });

    const result = await response.json();

    // Check if the token was extended
    if (result.success && result.message?.includes("extended")) {
      return {
        ...result,
        isExtended: true,
      };
    }

    return result;
  } catch (error) {
    console.error("Error generating BGV token for applicant:", error);
    return {
      success: false,
      message: "Failed to generate BGV token",
    };
  }
};

export const createBGVRequestNotification = async (
  responseData: any,
  requestData: any,
  currentUser: any,
  accessToken: string
) => {
  try {
    const response = await axios.post(`${BASE_URL}/create-notification`, {
      responseData,
      requestData,
      UserDetails: {
        userID: currentUser.userID,
        displayName: currentUser.displayName,
        email: currentUser.email,
      },
      accessToken,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    }
    );
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error sending BGV creation notification:", error);
    return {
      success: false,
      error: "Failed to send notification",
    };
  }
};

// Approve BGV Request Notification
export const ApproveBGVRequestNotification = async (
  action: string,
  comments: string,
  formData: any,
  currentUser: any,
  accessToken: string
) => {
  try {
    const response = await axios.post(`${BASE_URL}/approve-notification`, {
      action,
      comments,
      formData,
      UserDetails: {
        userID: currentUser.userID,
        displayName: currentUser.displayName,
        email: currentUser.email,
      },
      accessToken,
    },{
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error sending BGV approval notification:", error);
    return {
      success: false,
      error: "Failed to send notification",
    };
  }
};

// Reject BGV Request Notification
export const RejectBGVRequestNotification = async (
  action: string,
  comments: string,
  formData: any,
  currentUser: any,
  accessToken: string
) => {
  try {
    const response = await axios.post(`${BASE_URL}/reject-notification`, {
      action,
      comments,
      formData,
      UserDetails: {
        userID: currentUser.userID,
        displayName: currentUser.displayName,
        email: currentUser.email,
      },
      accessToken,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error sending BGV rejection notification:", error);
    return {
      success: false,
      error: "Failed to send notification",
    };
  }
};

// Initiate BGV Email

export const InitiateBGVEmail = async (BgvId: string, accessToken: string) =>{
  try{
    const response = await axios.post(`${BASE_URL}/initiateManualMailTrigger`, {
      bgvRequestId : BgvId
    },{
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    // console.log("Initiate BGV Email Response:", response);
    return {
      success: true,
      data: response.data,
    };
  } 
  catch (error) {
    console.error("Error sending BGV completion notification:", error);
    return {
      success: false,
      error: "Failed to trigger email",
    };
  }
}

// Get All bgv email triggers
export const GetAllBGVEmailTriggers = async (accessToken: string, bgvId: string) => {
  try{
    const response = await axios.get(`${BASE_URL}/getAllBGVEmailTriggers/${bgvId}`,{
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });
    // console.log("Get All BGV Email Triggers Response:", response);
    return {
      success: true,
      data: response.data,
    };
  }
  catch (error) {
    console.error("Error fetching BGV email triggers:", error);
    return {
      success: false,
      error: "Failed to fetch email triggers",
    };
  }
};

// Complete BGV Request Notification
export const CompletedBGVRequestNotification = async (
  status: string,
  formData: any,
  currentUser: any,
  accessToken: string
) => {
  try {
    const response = await axios.post(`${BASE_URL}/complete-notification`, {
      status,
      formData,
      UserDetails: {
        userID: currentUser.userID,
        displayName: currentUser.displayName,
        email: currentUser.email,
      },
      accessToken,
    });
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error sending BGV completion notification:", error);
    return {
      success: false,
      error: "Failed to send notification",
    };
  }
};
