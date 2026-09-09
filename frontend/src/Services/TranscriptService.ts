const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/transcript`;

export interface TranscriptAnalysisRequest {
  transcriptUrl: string;
  jobPostingId: string;
  applicantId: string;
  interviewType: string;
  interviewId?: string;
  recordingId?: string;
  forceRefresh?: boolean; // Set to true to bypass cache
}

export interface TranscriptAnalysisResponse {
  success: boolean;
  message: string;
  data: {
    analysis: {
      overallScore: number;
      relevanceMetrics: {
        jobDescriptionRelevance: number;
        resumeRelevance: number;
        skillsRelevance: number;
        irrelevantQuestions: number;
      };
      questionAnalysis: Array<{
        question: string;
        isRelevant: boolean;
        relevantTo: string[];
        reason: string;
        betterAlternative?: string;
      }>;
      coverageAssessment: {
        coveredSkills: string[];
        missedSkills: string[];
        coveredExperiences: string[];
        missedExperiences: string[];
      };
      interviewerPerformance: {
        questionQuality: string;
        probingDepth: string;
        biasDetected: boolean;
        candidateSpaceProvided: string;
      };
      candidatePerformance: {
        responseQuality: string;
        alignment: string;
        technicalDepth: string;
        communication: string;
      };
      redFlags: Array<{
        type: string;
        description: string;
        severity: string;
      }>;
      recommendations: string[];
      complianceCheck: {
        discriminatoryQuestions: boolean;
        professionalStandards: boolean;
        concerns: string[];
      };
      summary: {
        effectiveness: string;
        strengths: string[];
        weaknesses: string[];
        recommendation: string;
      };
      _combinedAnalysis?: {
        numberOfTranscripts: number;
        combinationMode: string;
        individualLengths: number[];
        totalLength: number;
      };
    };
    transcriptLength: number;
    analyzedAt: string;
    cached?: boolean; // Indicates if result is from cache
  };
}

export const analyzeTranscript = async (
  request: TranscriptAnalysisRequest,
  accessToken: string
): Promise<TranscriptAnalysisResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/analyze-interview-transcript`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error analyzing transcript:", error);
    throw error;
  }
};

export interface CombinedTranscriptAnalysisRequest {
  transcriptUrls: string[];
  jobPostingId: string;
  applicantId: string;
  interviewType: string;
  interviewId?: string;
  recordingIds?: string[];
  combinationMode: "merge" | "sequential";
  forceRefresh?: boolean;
}

export const analyzeCombinedTranscripts = async (
  request: CombinedTranscriptAnalysisRequest,
  accessToken: string
): Promise<TranscriptAnalysisResponse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/analyze-combined-transcripts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error analyzing combined transcripts:", error);
    throw error;
  }
};

// Get cached transcript by recording ID
export const getCachedTranscript = async (
  recordingId: string,
  accessToken: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/get-transcript/${recordingId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Transcript not found in cache
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting cached transcript:", error);
    return null;
  }
};

// Get cached analysis by interview ID
export const getCachedAnalysis = async (
  interviewId: string,
  analysisType: "single" | "combined",
  accessToken: string
): Promise<any> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/get-analysis/${interviewId}?analysisType=${analysisType}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Analysis not found in cache
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting cached analysis:", error);
    return null;
  }
};

// Invalidate/delete cached analysis
export const invalidateAnalysisCache = async (
  interviewId: string,
  accessToken: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/delete-analysis/${interviewId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error("Error invalidating analysis cache:", error);
    return false;
  }
};

// Batch analysis for multiple interviews (legacy - kept for compatibility)
export interface BatchAnalysisRequest {
  interviews: Array<{
    transcriptUrl: string;
    jobPostingId: string;
    applicantId: string;
    interviewId: string;
    interviewType: string;
    recordingId?: string;
  }>;
}

export const analyzeBatchTranscripts = async (
  request: BatchAnalysisRequest,
  accessToken: string
): Promise<any> => {
  try {
    // Use the new caching endpoint for each interview
    const results = await Promise.all(
      request.interviews.map(async (interview) => {
        try {
          const result = await analyzeTranscript(
            {
              transcriptUrl: interview.transcriptUrl,
              jobPostingId: interview.jobPostingId,
              applicantId: interview.applicantId,
              interviewType: interview.interviewType,
              interviewId: interview.interviewId,
              recordingId: interview.recordingId,
            },
            accessToken
          );
          return {
            interviewId: interview.interviewId,
            ...result,
          };
        } catch (error) {
          return {
            interviewId: interview.interviewId,
            success: false,
            error: "Unable to analyze transcript",
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return {
      success: true,
      message: "Batch analysis completed",
      data: {
        totalAnalyzed: successCount,
        totalFailed: failCount,
        analyses: results,
      },
    };
  } catch (error) {
    console.error("Error analyzing batch transcripts:", error);
    throw error;
  }
};
