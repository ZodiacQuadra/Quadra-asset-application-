// Services/JDHistory.ts
import axios from "axios";

export interface VersionHistory {
  VersionID: string;
  OriginalJDRequestID: string;
  VersionNumber: number;
  VersionCreatedAt: string;
  VersionCreatedBy: string;
  ModifiedByUserName: string | null;
  ModifiedByUserEmail: string | null;
  JobRole: string;
  JobNature: string;
  Department: string;
  TargetDate: string;
  NumPositions: number;
  minWorkExperience: number;
  maxWorkExperience: number;
  MinSalaryRange: number;
  MaxSalaryRange: number;
  JobLocation: string;
  JobDescription: string;
  Status: string;
  isActive: boolean;
  isPublished: boolean;
  InActiveReason: string;
  JDCode: string;
  ChangeSummary: string;
  TotalChanges: number;
  SkillsSnapshot: string;
  SkillCount: number;
  // Change flags
  JobRole_Changed: boolean;
  JobNature_Changed: boolean;
  Department_Changed: boolean;
  TargetDate_Changed: boolean;
  NumPositions_Changed: boolean;
  minWorkExperience_Changed: boolean;
  maxWorkExperience_Changed: boolean;
  MinSalaryRange_Changed: boolean;
  MaxSalaryRange_Changed: boolean;
  JobLocation_Changed: boolean;
  JobDescription_Changed: boolean;
  ReportingManagerID_Changed: boolean;
  Status_Changed: boolean;
  isActive_Changed: boolean;
  isPublished_Changed: boolean;
  InActiveReason_Changed: boolean;
  JDCode_Changed: boolean;
  Skills_Changed: boolean;
  
}

export interface HistorySummary {
  VersionNumber: number;
  VersionCreatedAt: string;
  ModifiedByUserName: string;
  ChangeSummary: string;
  TotalChanges: number;
  SkillCount: number;
  Skills_Changed: boolean;
  Status: string;
  isActive: boolean;
  isPublished: boolean;
}

export interface VersionHistoryResponse {
  success: boolean;
  message: string;
  data: {
    jdInfo: {
      ID: string;
      JobRole: string;
      Department: string;
      JDCode: string;
      CreatedAt: string;
      CreatedByUserID: string;
    };
    versionHistory: VersionHistory[];
    currentSkills: Array<{
      SkillName: string;
      Rating: number;
    }>;
  };
}

export interface HistorySummaryResponse {
  success: boolean;
  message: string;
  data: HistorySummary[];
}

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/jdRequest`; 

// Get detailed version history
export const getJDRequestVersionHistory = async (
  jdRequestId: string,
  accessToken: string | null
): Promise<VersionHistoryResponse> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/getJDRequestVersionHistory/${jdRequestId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching version history:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch version history"
    );
  }
};

// Get history summary
export const getJDRequestHistorySummary = async (
  jdRequestId: string,
  accessToken: string
): Promise<HistorySummaryResponse> => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/getJDRequestHistorySummary/${jdRequestId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching history summary:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch history summary"
    );
  }
};


