// Services/HiringPipelineService.ts
import axios, { AxiosError } from "axios";
import { ApiUtils } from "./StageMaster";
import { Person } from "../Types/interview";

export interface HiringPipelineStage {
  ID: string;
  StageSequence: number;
  JobPostingID: string;
  InterviewName: string;
  Description: string;
  Order: number;
  isDefault: boolean;
  Show: boolean;
  IsManual: boolean;
  CreatedByUserID: string;
  ModifiedByUserID?: string;
  CreatedAt: string;
  ModifiedAt?: string;
  ApplicantCount: number;
}

export interface CreatePipelineStageData {
  jobPostingId: string;
  interviewName: string;
  description?: string;
  show?: boolean;
  isManual?: boolean;
  createdByUserId: string;
}

export interface UpdatePipelineStageData {
  interviewName?: string;
  description?: string;
  show?: boolean;
  isManual?: boolean;
  notify:boolean;
  notifyUsers?:Person[]
  modifiedByUserId: string;
}

export interface DeletePipelineStageData {
  modifiedByUserId: string;
}

export interface ReorderPipelineStageData {
  stages: Array<{
    id: string;
    order: number;
  }>;
  modifiedByUserId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Base URL configuration
const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/stagemaster`;

// Helper function to get headers
const getHeaders = (accessToken: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${accessToken}`,
});

// Helper function to handle API responses
const handleApiResponse = async <T>(
  apiCall: Promise<any>
): Promise<ApiResponse<T>> => {
  try {
    const response = await apiCall;
    return {
      success: true,
      message: response.data.message || "Success",
      data: response.data.data || response.data,
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    console.error("API call failed:", axiosError);

    return {
      success: false,
      message:
        axiosError.response?.data?.message ||
        axiosError.message ||
        "An error occurred",
      error: axiosError.response?.data?.error || axiosError.message,
    };
  }
};

// Service functions
export const fetchPipelineByJobId = async (
  jobPostingId: string,
  accessToken: string
): Promise<ApiResponse<HiringPipelineStage[]>> => {
  return handleApiResponse<HiringPipelineStage[]>(
    axios.get(`${BASE_URL}/hiringPipeline/${jobPostingId}`, {
      headers: getHeaders(accessToken),
    })
  );
};

export const createPipelineStage = async (
  data: CreatePipelineStageData,
  accessToken: string
): Promise<ApiResponse<HiringPipelineStage>> => {
  return handleApiResponse<HiringPipelineStage>(
    axios.post(`${BASE_URL}/hiringPipeline/stage`, data, {
      headers: getHeaders(accessToken),
    })
  );
};

export const updatePipelineStage = async (
  stageId: string,
  data: UpdatePipelineStageData,
  accessToken: string
): Promise<ApiResponse<HiringPipelineStage>> => {
  return handleApiResponse<HiringPipelineStage>(
    axios.put(`${BASE_URL}/hiringPipeline/stage/${stageId}`, data, {
      headers: getHeaders(accessToken),
    })
  );
};

export const deletePipelineStage = async (
  stageId: string,
  data: DeletePipelineStageData,
  accessToken: string
): Promise<ApiResponse<void>> => {
  return handleApiResponse<void>(
    axios.delete(`${BASE_URL}/hiringPipeline/stage/${stageId}`, {
      headers: getHeaders(accessToken),
      data,
    })
  );
};

// export const sendManagementNotification = async(pipeleineId:string,candidateCount:number,redirectUrl:string,accessToken: string,userId:string,jobRole:string) =>{
//   const data = {
//     "redirectUrl":redirectUrl,
//     "userId":userId,
//     "applicantCount":candidateCount,
//     "jobTitle":jobRole
//   }
//   return handleApiResponse<ApiResponse<null>>(
//     axios.post(`${BASE_URL}/pipeline-notification/${pipeleineId}`,data , {
//       headers: getHeaders(accessToken),
//     })
//   )
// }

export const sendManagementNotification = async(
  pipeleineId: string,
  mappedData: {name:string,date:string|null}[],
  redirectUrl: string,
  accessToken: string,
  userId: string,
  jobRole: string,
  jobId:string,
) => {
  const data = {
    "redirectUrl": redirectUrl,
    "userId": userId,
    "mappedData": mappedData,
    "jobTitle": jobRole,
    "jobId":jobId
  }
  
  try {
    const response = await axios.post(
      `${BASE_URL}/pipeline-notification/${pipeleineId}`,
      data,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}

export const reorderPipelineStages = async (
  jobPostingId: string,
  data: ReorderPipelineStageData,
  accessToken: string
): Promise<ApiResponse<HiringPipelineStage[]>> => {
  return handleApiResponse<HiringPipelineStage[]>(
    axios.put(`${BASE_URL}/hiringPipeline/${jobPostingId}/reorder`, data, {
      headers: getHeaders(accessToken),
    })
  );
};

// Hook for using the hiring pipeline API with retry logic
export const useHiringPipelineApi = (accessToken: string = "") => {
  return {
    fetchPipelineByJobId: (jobPostingId: string) =>
      ApiUtils.retry(
        () => fetchPipelineByJobId(jobPostingId, accessToken),
        3,
        1000
      ),

    createPipelineStage: (data: CreatePipelineStageData) =>
      ApiUtils.retry(() => createPipelineStage(data, accessToken), 2, 500),

    updatePipelineStage: (stageId: string, data: UpdatePipelineStageData) =>
      ApiUtils.retry(
        () => updatePipelineStage(stageId, data, accessToken),
        2,
        500
      ),

    deletePipelineStage: (stageId: string, data: DeletePipelineStageData) =>
      ApiUtils.retry(
        () => deletePipelineStage(stageId, data, accessToken),
        2,
        500
      ),

    reorderPipelineStages: (
      jobPostingId: string,
      data: ReorderPipelineStageData
    ) =>
      ApiUtils.retry(
        () => reorderPipelineStages(jobPostingId, data, accessToken),
        2,
        500
      ),
  };
};
