import axios, { AxiosError, AxiosResponse } from "axios";

// Base URL for the API (adjust according to your setup)
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/DocumentManagement`;

// =============================================
// Type Definitions
// =============================================

export interface Document {
  id: string;
  title: string;
  description: string;
  status: DocumentStatus | undefined;
  createdByUserId: string;
  modifiedByUserId?: string;
  createdAt: string;
  modifiedAt?: string;
}

export type DocumentStatus = "Active" | "Inactive" | "Draft" | "Archived";

export type SortDirection = "ASC" | "DESC";

export type SortBy = "Title" | "CreatedAt" | "ModifiedAt" | "Status";

export interface GetDocumentsOptions {
  status?: DocumentStatus;
  createdByUserId?: string;
  searchTerm?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortBy;
  sortDirection?: SortDirection;
}

export interface CreateDocumentData {
  title: string;
  description?: string;
  status?: DocumentStatus;
  createdByUserId: string;
  isRequired: boolean;
}

export interface UpdateDocumentData {
  title: string;
  description?: string;
  status?: DocumentStatus;
  modifiedByUserId: string;
  isRequired: boolean;
}

export interface SearchOptions {
  searchTerm: string;
  status?: DocumentStatus;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortBy;
  sortDirection?: SortDirection;
}

export interface DocumentStatsOptions {
  createdByUserId?: string;
  dateRange?: string;
}

export interface DocumentStats {
  totalDocuments: number;
  activeDocuments: number;
  inactiveDocuments: number;
  draftDocuments: number;
  archivedDocuments: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: any;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export type BulkOperation = "delete" | "updateStatus";

export interface BulkOperationData {
  status?: DocumentStatus;
  [key: string]: any;
}

export interface AuthHeaders {
  Authorization: string;
  "Content-Type": string;
}

// =============================================
// Helper Functions
// =============================================

// Helper function to handle Axios errors consistently
const handleAxiosError = (
  error: unknown,
  defaultMessage: string
): ApiResponse => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    return {
      success: false,
      message:
        axiosError.response?.data?.message ||
        axiosError.message ||
        defaultMessage,
      error: axiosError.response?.data || axiosError.message,
    };
  }

  // Handle non-Axios errors (like validation errors we throw)
  if (error instanceof Error) {
    return {
      success: false,
      message: error.message,
      error: error.message,
    };
  }

  // Handle unknown error types
  return {
    success: false,
    message: defaultMessage,
    error: String(error),
  };
};

// =============================================
// Get Documents with pagination and filtering
// =============================================
export const getDocuments = async (
  options: GetDocumentsOptions = {},
  accessToken: string
): Promise<ApiResponse<PaginatedResponse<Document>>> => {
  try {
    const {
      status,
      createdByUserId,
      searchTerm,
      pageNumber = 1,
      pageSize = 50,
      sortBy = "CreatedAt",
      sortDirection = "DESC",
    } = options;

    const params = new URLSearchParams();

    if (status) params.append("status", status);
    if (createdByUserId) params.append("createdByUserId", createdByUserId);
    if (searchTerm) params.append("searchTerm", searchTerm);

    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", sortBy);
    params.append("sortDirection", sortDirection);

    const response: AxiosResponse<{
      data: PaginatedResponse<Document>;
    }> = await axios.get(`${API_BASE_URL}/documents?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // console.log(response.data.data);
    return {
      success: true,
      data: response.data.data,
      message: "Documents fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching documents:", error);
    return handleAxiosError(error, "Failed to fetch documents");
  }
};

// =============================================
// Get Document by ID
// =============================================
export const getDocumentById = async (
  documentId: string,
  accessToken: string
): Promise<ApiResponse<Document>> => {
  try {
    if (!documentId) {
      throw new Error("Document ID is required");
    }

    const response: AxiosResponse<{ data: Document }> = await axios.get(
      `${API_BASE_URL}/documents/${documentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Document fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching document:", error);
    return handleAxiosError(error, "Failed to fetch document");
  }
};

// =============================================
// Create Document
// =============================================
export const createDocument = async (
  documentData: CreateDocumentData,
  accessToken: string
): Promise<ApiResponse<Document>> => {
  try {
    const {
      title,
      description,
      status = "Active",
      createdByUserId,
      isRequired,
    } = documentData;

    if (!title?.trim()) {
      throw new Error("Document title is required");
    }

    if (!createdByUserId) {
      throw new Error("Created by user ID is required");
    }

    const payload = {
      title: title.trim(),
      description: description?.trim() || "",
      status,
      createdByUserId,
      isRequired,
    };

    const response: AxiosResponse<{
      data: Document;
      message?: string;
    }> = await axios.post(`${API_BASE_URL}/documents`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Document created successfully",
    };
  } catch (error) {
    console.error("Error creating document:", error);
    return handleAxiosError(error, "Failed to create document");
  }
};

// =============================================
// Update Document
// =============================================
export const updateDocument = async (
  documentId: string,
  documentData: UpdateDocumentData,
  accessToken: string
): Promise<ApiResponse<Document>> => {
  try {
    if (!documentId) {
      throw new Error("Document ID is required");
    }

    const {
      title,
      description,
      status,
      modifiedByUserId,
      isRequired,
    } = documentData;

    if (!title?.trim()) {
      throw new Error("Document title is required");
    }

    if (!modifiedByUserId) {
      throw new Error("Modified by user ID is required");
    }

    const payload = {
      title: title.trim(),
      description: description?.trim() || "",
      status,
      modifiedByUserId,
      isRequired,
    };

    const response: AxiosResponse<{
      data: Document;
      message?: string;
    }> = await axios.put(`${API_BASE_URL}/documents/${documentId}`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      success: true,
      data: response.data.data,
      message: response.data.message || "Document updated successfully",
    };
  } catch (error) {
    console.error("Error updating document:", error);
    return handleAxiosError(error, "Failed to update document");
  }
};

// =============================================
// Delete Document
// =============================================
export const deleteDocument = async (
  documentId: string,
  modifiedByUserId: string,
  accessToken: string
): Promise<ApiResponse<void>> => {
  try {
    if (!documentId) {
      throw new Error("Document ID is required");
    }

    if (!modifiedByUserId) {
      throw new Error("Modified by user ID is required");
    }

    const response: AxiosResponse<{ message?: string }> = await axios.delete(
      `${API_BASE_URL}/documents/${documentId}`,
      {
        data: { modifiedByUserId },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      message: response.data.message || "Document deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting document:", error);
    return handleAxiosError(error, "Failed to delete document");
  }
};

// =============================================
// Search Documents
// =============================================
export const searchDocuments = async (
  searchOptions: SearchOptions,
  accessToken: string
): Promise<ApiResponse<PaginatedResponse<Document>>> => {
  try {
    const {
      searchTerm,
      status,
      pageNumber = 1,
      pageSize = 20,
      sortBy = "Title",
      sortDirection = "ASC",
    } = searchOptions;

    if (!searchTerm?.trim()) {
      throw new Error("Search term is required");
    }

    const params = new URLSearchParams();
    params.append("searchTerm", searchTerm.trim());

    if (status) params.append("status", status);
    params.append("pageNumber", pageNumber.toString());
    params.append("pageSize", pageSize.toString());
    params.append("sortBy", sortBy);
    params.append("sortDirection", sortDirection);

    const response: AxiosResponse<{
      data: PaginatedResponse<Document>;
    }> = await axios.get(
      `${API_BASE_URL}/documents/search?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Documents searched successfully",
    };
  } catch (error) {
    console.error("Error searching documents:", error);
    return handleAxiosError(error, "Failed to search documents");
  }
};

// =============================================
// Bulk Operations
// =============================================
export const bulkOperations = async (
  operation: BulkOperation,
  documentIds: string[],
  modifiedByUserId: string,
  additionalData: BulkOperationData = {},
  accessToken: string
): Promise<ApiResponse<any>> => {
  try {
    if (!operation) {
      throw new Error("Operation type is required");
    }

    if (
      !documentIds ||
      !Array.isArray(documentIds) ||
      documentIds.length === 0
    ) {
      throw new Error("Document IDs array is required");
    }

    if (!modifiedByUserId) {
      throw new Error("Modified by user ID is required");
    }

    const payload = {
      operation,
      documentIds,
      modifiedByUserId,
      data: additionalData,
    };

    const response: AxiosResponse<{
      success: boolean;
      data: any;
      message?: string;
    }> = await axios.post(`${API_BASE_URL}/documents/bulk`, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message || "Bulk operation completed",
    };
  } catch (error) {
    console.error("Error in bulk operation:", error);
    return handleAxiosError(error, "Failed to perform bulk operation");
  }
};

// =============================================
// Bulk Delete Documents
// =============================================
export const bulkDeleteDocuments = async (
  documentIds: string[],
  modifiedByUserId: string,
  accessToken: string
): Promise<ApiResponse<any>> => {
  return await bulkOperations(
    "delete",
    documentIds,
    modifiedByUserId,
    {},
    accessToken
  );
};

// =============================================
// Bulk Update Status
// =============================================
export const bulkUpdateDocumentStatus = async (
  documentIds: string[],
  status: DocumentStatus,
  modifiedByUserId: string,
  accessToken: string
): Promise<ApiResponse<any>> => {
  return await bulkOperations(
    "updateStatus",
    documentIds,
    modifiedByUserId,
    {
      status,
    },
    accessToken
  );
};

// =============================================
// Get Document Statistics
// =============================================
export const getDocumentStats = async (
  options: DocumentStatsOptions = {},
  accessToken: string
): Promise<ApiResponse<DocumentStats>> => {
  try {
    const { createdByUserId, dateRange } = options;

    const params = new URLSearchParams();

    if (createdByUserId) params.append("createdByUserId", createdByUserId);
    if (dateRange) params.append("dateRange", dateRange);

    const response: AxiosResponse<{ data: DocumentStats }> = await axios.get(
      `${API_BASE_URL}/documents/stats?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: "Document statistics fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching document statistics:", error);
    return handleAxiosError(error, "Failed to fetch document statistics");
  }
};

// =============================================
// Export All Functions
// =============================================
export default {
  getDocuments,
  getDocumentById,
  createDocument,
  updateDocument,
  deleteDocument,
  searchDocuments,
  bulkOperations,
  bulkDeleteDocuments,
  bulkUpdateDocumentStatus,
  getDocumentStats,
};
