import axios from "axios";

// API base URL - adjust this to match your backend URL
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

// Interface for applicant data
interface ApplicantData {
  ID: string;
  email: string;
  firstName: string;
  lastName: string;
  // Add other applicant fields as needed
}

// Interface for API response
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Function to get applicant details
const getApplicantById = async (
  applicantId: string,
  accessToken: string
): Promise<ApplicantData> => {
  try {
    const response = await axios.get<ApiResponse<ApplicantData>>(
      `${API_BASE_URL}/applicant/getApplicant/${applicantId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(
        response.data.message || "Failed to fetch applicant details"
      );
    }
    // console.log(response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching applicant:", error);
    throw error;
  }
};

// In InterviewScheduling service file

// Update the ScheduledInterview interface to properly handle multiple interviewers
interface ScheduledInterview {
  applicantId: string;
  interviewers: {
    id: string;
    email: string;
    displayName: string;
    role?: string;
    isPrimary?: boolean;
  }[];
  stage: string;
  type: string;
  dateTime: string;
  duration: number;
  timeZone: string;
  location?: string;
  meetingLink?: string;
  notes?: string;
  stageId: string;
  isTeamsMeeting: boolean;
}

// Update the scheduleInterview function
const scheduleInterview = async (
  scheduleData: any,
  jobId: string,
  currentUserId: string,
  accessToken: string,
  calendarId: string,
  displayName: string,
  email: string,
  title: string
): Promise<any> => {
  try {
    // console.log(scheduleData);
    // First, get applicant details to fetch email
    const applicantData = await getApplicantById(
      scheduleData.applicantId,
      accessToken
    );
    // console.log(title);

       // Add current user to interviewers list if not already present
    const allInterviewers = [...scheduleData.interviewers];
    
    // Check if current user is already in the interviewers list
    const isCurrentUserInInterviewers = scheduleData.interviewers.some(
      (interviewer: any) => interviewer.id === currentUserId
    );
    
    // If not, add current user as an interviewer
    if (!isCurrentUserInInterviewers) {
      allInterviewers.push({
        id: currentUserId,
        displayName: displayName,
        email: email,
        role: "Scheduler/Interviewer", // Or whatever role you prefer
        isPrimary: false // Or true if you want them to be primary
      });
    }

    // Prepare attendees array
    const attendees = [
      {
        emailAddress: {
          address: applicantData.email,
          name: `${applicantData.firstName} ${applicantData.lastName}`.trim(),
        },
        type: "required",
      },
      // Add all interviewers as required attendees
      ...allInterviewers.map((interviewer: any) => ({
        emailAddress: {
          address: interviewer.email,
          name: interviewer.displayName,
        },
        type: "required",
      })),
    ];

    // Prepare request payload - matching your API structure
    const requestPayload = {
      applicantId: scheduleData.applicantId,
      jobPostingId: jobId,
      pipelineStageId: scheduleData.stageId,
      interviewTitle:
        title ||
        `Interview scheduled for ${applicantData.firstName} ${applicantData.lastName}`,
      interviewDescription: `Interview scheduled for ${
        applicantData.firstName
      } ${applicantData.lastName}\n\nStage: ${scheduleData.stage}\nType: ${
        scheduleData.type
      }\n\nNotes: ${scheduleData.notes || "No additional notes"}`,
      interviewType: scheduleData.type,
      scheduledDateTime: scheduleData.dateTime,
      duration: scheduleData.duration,
      isTeamsMeeting: scheduleData.isTeamsMeeting,
      timeZone: scheduleData.timeZone,
      location: scheduleData.location,
      applicantEmail: applicantData.email,
      applicantName: `${applicantData.firstName} ${applicantData.lastName}`.trim(),
      companyName: "Quadrasystems.net India Pvt Ltd",
      meetingLink: scheduleData.meetingLink,
      notes: scheduleData.notes,
      createdByUserId: currentUserId,
      attendees: attendees,
      calendarUserId: currentUserId,
      calendarId: calendarId,
      displayName: displayName,
      email: email,
      // Send interviewers array directly - API will handle JSON conversion
      interviewers: allInterviewers.map(
        (interviewer: any, index: number) => ({
          id: interviewer.id,
          displayName: interviewer.displayName,
          email: interviewer.email,
          role: interviewer.role || "Interviewer",
          isPrimary: interviewer.isPrimary || index === 0, // First interviewer is primary by default
        })
      ),
    };

    // Make API call to schedule interview
    const response = await axios.post<ApiResponse<any>>(
      `${API_BASE_URL}/interview/schedule-interview`,
      requestPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Failed to schedule interview");
    }

    return response.data.data;
  } catch (error) {
    console.error("Error scheduling interview:", error);
    throw error;
  }
};

// Interface for bulk scheduling data
interface ScheduleData {
  interviews: ScheduledInterview[];
}

export const getApplicantsByJobId = async (
  jobId: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/applicant/getApplicantsStatusByJob/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data || [],
        message: response.data.message || "Applicants fetched successfully",
      };
    } else {
      return {
        success: false,
        data: [],
        message: response.data.message || "Failed to fetch applicants",
      };
    }
  } catch (error) {
    console.error("Error fetching applicants:", error);
    return {
      success: false,
      data: [],
      message: "Failed to fetch applicants",
    };
  }
};

// Function to schedule multiple interviews (bulk scheduling)
const scheduleBulkInterviews = async (
  scheduleData: any,
  jobId: string,
  currentUserId: string,
  accessToken: string,
  calendarId: string,
  displayName: string,
  email: string
): Promise<any[]> => {
  // console.log(scheduleData);
  const results = [];
  const errors = [];

  for (const interview of scheduleData.interviews) {
    // console.log(interview);
    try {
      const result = await scheduleInterview(
        interview,
        jobId,
        currentUserId,
        accessToken,
        calendarId,
        displayName,
        email,
        scheduleData.title
      );
      results.push({
        applicantId: interview.applicantId,
        success: true,
        data: result,
      });
    } catch (error) {
      console.error(
        `Failed to schedule interview for applicant ${interview.applicantId}:`,
        error
      );
      errors.push({
        applicantId: interview.applicantId,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Log results
  // console.log(
  //   `Bulk scheduling completed: ${results.length} successful, ${errors.length} failed`
  // );

  if (errors.length > 0) {
    console.error("Scheduling errors:", errors);
  }

  return [...results, ...errors];
};

interface RescheduleInterviewData {
  interviewId: string;
  newScheduledDateTime: string;
  newDuration?: number;
  newLocation?: string;
  newMeetingLink?: string;
  reason?: string;
  modifiedByUserId: string;
  attendees?: Array<{
    emailAddress: {
      address: string;
      name: string;
    };
    type: string;
  }>;
  // Additional fields for the request
  applicantEmail?: string;
  applicantName?: string;
  companyName?: string;
  interviewerName?: string;
  interviewTitle?: string;
  interviewDescription?: string;
  timeZone?: string;
  isTeamsMeeting?: boolean;
  calendarUserId?: string;
  interviewers?: Interviewer[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface RescheduleResponse {
  interviewId: string;
  outlookEventId?: string;
  meetingLink?: string;
  newScheduledDateTime: string;
  emailSent?: boolean;
}

// First, define the Interviewer interface if not already defined
interface Interviewer {
  id: string;
  displayName: string;
  email: string;
  role?: string;
  isPrimary?: boolean;
}

export const rescheduleInterview = async (
  rescheduleData: any,
  accessToken: string,
  calendarId: string,
  displayName: string,
  email: string
): Promise<RescheduleResponse> => {
  // console.log("Reschedule data:", rescheduleData);

  try {
    const response = await axios.patch<ApiResponse<RescheduleResponse>>(
      `${API_BASE_URL}/interview/reschedule-interview/${rescheduleData.interviewId}`,
      {
        newScheduledDateTime: rescheduleData.newScheduledDateTime,
        newDuration: rescheduleData.newDuration,
        newLocation: rescheduleData.newLocation,
        newMeetingLink: rescheduleData.newMeetingLink,
        reason: rescheduleData.reason,
        modifiedByUserId: rescheduleData.modifiedByUserId,
        attendees: rescheduleData.attendees,
        displayName: displayName,
        email: email,
        newType: rescheduleData.newType,
        interviewers: rescheduleData.interviewers,
        applicantEmail: rescheduleData.applicantEmail,
        applicantName: rescheduleData.applicantName,
        companyName: rescheduleData.companyName,
        interviewTitle: rescheduleData.interviewTitle,
        interviewDescription: rescheduleData.interviewDescription,
        timeZone: rescheduleData.timeZone || "Asia/Kolkata",
        isTeamsMeeting: rescheduleData.isTeamsMeeting,
        calendarId: calendarId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Failed to reschedule interview"
      );
    }

    return response.data.data!;
  } catch (error) {
    console.error("Error rescheduling interview:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to reschedule interview"
      );
    }
    throw error;
  }
};

// Get interview details function
export const getInterviewDetails = async (
  interviewId: string,
  accessToken: string,
  calendarId: string
): Promise<any> => {
  try {
    const response = await axios.get<ApiResponse<any>>(
      `${API_BASE_URL}/interview/details/${interviewId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.success) {
      throw new Error(
        response.data.message || "Failed to fetch interview details"
      );
    }

    return response.data.data;
  } catch (error) {
    console.error("Error fetching interview details:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || "Failed to fetch interview details"
      );
    }
    throw error;
  }
};

export const cancelInterview = async (
  cancelData: any,
  accessToken: string,
  calendarId: string
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/interview/cancel-interview/${cancelData.interviewId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reason: cancelData.reason,
          modifiedByUserId: cancelData.modifiedByUserId,
          applicantEmail: cancelData.applicantEmail,
          applicantName: cancelData.applicantName,
          companyName: cancelData.companyName,
          interviewerName: cancelData.interviewerName,
          interviewTitle: cancelData.interviewTitle,
          scheduledDateTime: cancelData.scheduledDateTime,
          location: cancelData.location,
          interviewers: cancelData.interviewers,
          calendarId: calendarId,
          iCalUId: cancelData.iCalUId,
          // Add interviewers array
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to cancel interview");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};
export const approveApplicant = async (
  approvalData: any,
  accessToken: string
) => {
  const response = await fetch(`${API_BASE_URL}/applicant/approveApplicant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(approvalData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const rejectApplicant = async (
  rejectionData: any,
  accessToken: string
) => {
  const response = await fetch(`${API_BASE_URL}/applicant/rejectApplicant`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(rejectionData),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const getAllInterviewDetails = async (
  accessToken: string,
  page: number = 1,
  pageSize: number = 20,
  status?: string,
  search?: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/interview/getAllInterviewDetails`,
      {
        params: { page, pageSize, ...(status ? { status } : {}), ...(search ? { search } : {}) },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching all interview details:", error);
    throw error;
  }
};

// Get candidate-wise (grouped by candidate/pipeline) interview details.
// Used only by users with view-all access on the Hiring Dashboard. One row per
// candidate with an overall status (In-Progress/Hired/Rejected) and
// candidate-based pagination + statusCounts. Does not affect the view-my flow.
export const getCandidateWiseInterviewDetails = async (
  accessToken: string,
  page: number = 1,
  pageSize: number = 20,
  status?: string,
  search?: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/interview/getCandidateWiseInterviewDetails`,
      {
        params: { page, pageSize, ...(status ? { status } : {}), ...(search ? { search } : {}) },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching candidate-wise interview details:", error);
    throw error;
  }
};

// 2. Get Interview Details by Interview ID
export const getInterviewDetailsById = async (
  interviewId: string,
  accessToken: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/interview/getInterviewDetails/${interviewId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching interview details by ID:", error);
    throw error;
  }
};

// 3. Get Interview Details by Interviewer ID
export const getInterviewDetailsByInterviewer = async (
  interviewerId: string,
  accessToken: string,
  page: number = 1,
  pageSize: number = 20,
  status?: string,
  search?: string
) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/interview/getInterviewDetailsByInterviewer/${interviewerId}`,
      {
        params: { page, pageSize, ...(status ? { status } : {}), ...(search ? { search } : {}) },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching interview details by interviewer:", error);
    throw error;
  }
};

// Add this function to your InterviewScheduling service
export const getInterviewDetailsByTeam = async (
  groupId: string,
  accessToken: string
) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/interview/getInterviewDetailsByDepartment/${groupId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch interview details");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching interview details by team:", error);
    throw error;
  }
};

export const submitInterviewFeedback = async (
  feedbackData: any,
  accessToken: string
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/interview/submitinterviewfeedback`,
      feedbackData,
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
    console.error("Error submitting interview feedback:", error);

    // Extract error message from response
    const errorMessage = "Failed to submit interview feedback";

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const submitInterviewFeedbackNotification = async (
  InterviewForm: any,
  feedbackData: any,
  accessToken: string,
  UserDetails: any
) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/interview/submitinterviewfeedbackNotification`,
      {
        InterviewForm, // Interview details object
        feedbackData, // Feedback data object
        accessToken, // MS Graph API token
        UserDetails, // Submitter details
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
    console.error("Error submitting interview feedback:", error);

    // Extract error message from response
    const errorMessage = "Failed to submit interview feedback";

    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const getInterviewFeedback = async (
  interviewId: string,
  accessToken: string
) => {
  try {
    // Validate input
    if (!interviewId) {
      return {
        success: false,
        error: "Interview ID is required",
        status: 400,
      };
    }

    const response = await axios.get(
      `${API_BASE_URL}/interview/interview-feedback/${interviewId}`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    return {
      success: true,
      data: response.data.data,
      message: response.data.message,
      status: response.status,
    };
  } catch (error) {
    console.error("Error fetching interview feedback:", error);

    if (error) {
      // Server responded with an error status
      return {
        success: false,
        error: "Server error occurred",
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: "Request failed",
        status: 500,
      };
    }
  }
};
// Export individual functions for direct use
export { getApplicantById, scheduleInterview, scheduleBulkInterviews };
