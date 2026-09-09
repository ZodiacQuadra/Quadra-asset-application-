import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FluentProvider,
  Toaster,
  useToastController,
  Toast,
  useId,
  ToastTitle,
  ToastBody,
  ToastIntent,
  Skeleton,
  SkeletonItem,
  Spinner,
  Text,
  Button,
  Body1Strong,
} from "@fluentui/react-components";

import { InterviewStage, Applicant, ViewMode } from "../../Types/interview";
import { AddStageDialog } from "../Components/AddStageDialog";
import { BulkActionsBar } from "../Components/BulkActionsBar";
import { KanbanView } from "../Components/KanbanView";
import { PipelineHeader } from "../Components/PipelineHeader";
import { PipelineStepper } from "../Components/PipelineStepper";
import ScheduleDialog from "../Components/Interview Schedular/ScheduleDialog";
import { StepperView } from "../Components/StepperView";
import { useAuth } from "../../Auth/AuthProvider";
import {
  approveApplicant,
  cancelInterview,
  rejectApplicant,
  rescheduleInterview,
  scheduleBulkInterviews,
  getApplicantsByJobId,
} from "../../Services/InterviewScheduling";
import RescheduleDialog from "../Components/Interview Schedular/RescheduleFormData ";
import CancelInterviewDialog from "../Components/CancelInterviewDialog";
import { getHiringPipeline, getJDRequestById } from "../../Services/JDRequests";

// Define the scheduled interview data structure
interface ScheduledInterview {
  applicantId: string;
  dateTime: string;
  duration: number;
  type: string;
  stage: string;
  interviewers: Array<{
    id: string;
    displayName: string;
    email: string;
    role?: string;
    isPrimary?: boolean;
  }>;
  location: string;
  meetingLink: string;
  isTeamsMeeting: boolean;
  notes: string;
  timeZone: string;
  stageId: string;
}

interface ReScheduledInterview {
  interviewId: string;
  applicantId: string;
  title: string;
  type: "phone" | "virtual" | "in-person";
  scheduledDateTime: string;
  duration: number;
  location: string;
  meetingLink?: string;
  isTeamsMeeting: boolean;
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled";
  notes: string;
  timeZone?: string;
  stageId?: string;
  interviewers?: Array<{
    id: string;
    displayName: string;
    email: string;
    role?: string;
    isPrimary?: boolean;
  }>;
  outlookEventId?: string;
  originalDateTime?: string;
  rescheduleCount?: number;
  rescheduleReason?: string;
  lastRescheduledAt?: string;
}

interface JDData {
  id: string;
  jobId: string;
  jobSequence: string;
  jobRole: string;
  jobNature: string;
  department: string;
  targetDate: Date | null | undefined;
  numPositions: number;
  // workExperience: number;
  minWorkExperience?: number;
  maxWorkExperience?: number;
  salaryRange: number;
  jobLocation: string;
  status: string;
  skills: Array<{ name: string; rating: number }>;
  jobDescription: string;
  reportingManager: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  holdReason?: string;
  cancelledReason?: string;
  createdBy: any;
  createdByUserID?: string; // Add this field for permission checking
  designation?:string
  departmentId?:string
}

interface ScheduleData {
  title: string;
  description: string;
  interviews: ScheduledInterview[];
}

interface DynamicInterviewPipelineProps {
  jobId: string;
  jobRole: string;
  jobSequence: string;
  onApplicantsUpdate?: (applicants: Applicant[]) => void;
  refreshTrigger?: number;
  isSubordiante:boolean
}

const DynamicInterviewPipeline: React.FC<DynamicInterviewPipelineProps> = ({
  jobId,
  jobRole,
  jobSequence,
  onApplicantsUpdate,
  refreshTrigger,
  isSubordiante = false
}) => {
  const navigate = useNavigate();
  const { currentUser, accessToken, refreshToken }: any = useAuth();
  const toasterId = useId("applicants-toaster");
  const { dispatchToast } = useToastController(toasterId);
  const [JDData, setJDData] = useState<JDData | null>(null);
  // State management
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [stages, setStages] = useState<InterviewStage[]>([]);
  const [isLoadingApplicants, setIsLoadingApplicants] = useState(false);
  const [isLoadingStages, setIsLoadingStages] = useState(false);
  const [applicantsError, setApplicantsError] = useState<string>("");
  const [stagesError, setStagesError] = useState<string>("");

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false); // Added for scheduling operations

  // Dialog states
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isAddStageOpen, setIsAddStageOpen] = useState(false);
  const [isBulkScheduleOpen, setIsBulkScheduleOpen] = useState(false);
  const [isIndividualScheduleOpen, setIsIndividualScheduleOpen] = useState(
    false
  );
  const [SelectedStage,setSelectedStage] = useState({
    stageId:"",
    stageName:""
  })

  // Selection and interaction states
  const [selectedApplicants, setSelectedApplicants] = useState<Set<string>>(
    new Set()
  );
  const [draggedApplicant, setDraggedApplicant] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("stepper");
  const [currentStage, setCurrentStage] = useState<string | undefined>();

  // Interview management states
  const [selectedInterviewForCancel, setSelectedInterviewForCancel] = useState<
    any
  >(null);
  const [selectedApplicantForCancel, setSelectedApplicantForCancel] = useState<
    any
  >(null);
  const [
    selectedInterview,
    setSelectedInterview,
  ] = useState<ReScheduledInterview | null>(null);
  const [
    selectedApplicantForReschedule,
    setSelectedApplicantForReschedule,
  ] = useState<Applicant | null>(null);

  // Add stage states
  const [newStageName, setNewStageName] = useState("");
  const [newStageDescription, setNewStageDescription] = useState("");

  // Helper function to show toast notifications
  const showToast = (
    title: string,
    body?: string,
    intent: ToastIntent = "success"
  ) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent }
    );
  };

  const loadJDRequestData = async () => {
      if (!jobId) {
        console.error("No JD Request ID provided");
        return;
      }

      try {
        const result = await getJDRequestById(jobId, accessToken);

        if (result.success && result.data) {
          const data = result.data;
          const formattedData = {
            id: data.ID,
            jobId: data.JobID || "",
            jobSequence: data.JDCode || "",
            jobRole: data.JobRole || "",
            jobNature: data.JobNature || "",
            department: data.Department || "",
            targetDate: data.TargetDate ? new Date(data.TargetDate) : null,
            numPositions: data.NumPositions || 1,
            // workExperience: data.WorkExperience || 0,
            minWorkExperience: data.minWorkExperience || 0,
            maxWorkExperience: data.maxWorkExperience || 1,
            salaryRange: data.SalaryRange || 10,
            jobLocation: data.JobLocation || "",
            jobDescription: data.JobDescription || "",
            status: data.Status || "Active",
            skills: Array.isArray(data.Skills)
              ? data.Skills.map((skill: any) => ({
                  name: skill.Name || "",
                  rating: skill.Rating || 0,
                }))
              : [],
            reportingManager: data.reportingManager
              ? {
                  id: data.reportingManager.id,
                  displayName: data.reportingManager.displayName,
                  email: data.reportingManager.email,
                }
              : null,
            holdReason: data.HoldReason || "",
            cancelledReason: data.CancelledReason || "",
            createdBy: data.createdBy,
            createdByUserID: data.CreatedByUserID || data.createdBy?.userID, // Handle different possible field names
            designation:data.Designation,
            departmentId: data.DepartmentID
          };

          setJDData(formattedData);
        } else {
          console.error("Failed to load JD request data");
        }
      } catch (error) {
        console.error("Error loading JD request:", error);
      }
    };


  React.useEffect(() => {
    
    loadJDRequestData();
  }, [jobId]);

  // Function to fetch applicants data
  const fetchApplicantsData = async (jobId: string) => {
    if (!jobId) return;

    setIsLoadingApplicants(true);
    setApplicantsError("");

    try {
      const result = await getApplicantsByJobId(jobId, accessToken);

      if (result.success) {
        setApplicants(result.data || []);
        onApplicantsUpdate?.(result.data || []);
      } else {
        setApplicantsError(result.message || "Failed to load applicants");
        showToast("Failed to load applicants data", result.message, "error");
      }
    } catch (error) {
      console.error("Error fetching applicants:", error);
      const errorMessage = "Failed to load applicants data";
      setApplicantsError(errorMessage);
      showToast(errorMessage, "Please try refreshing the page", "error");
    } finally {
      setIsLoadingApplicants(false);
    }
  };

  // Function to fetch pipeline stages
  const fetchPipelineStages = async (jobId: string) => {
    if (!jobId) return;

    setIsLoadingStages(true);
    setStagesError("");

    try {
      const result = await getHiringPipeline(jobId, accessToken);

      if (result?.data) {
        // Helper to pick a random color class
        const getRandomColor = () => {
          const colors = [
            {
              bg: "bg-[#6366F1]",
              border: "border-[#6366F1]",
              text: "text-[#6366F1]",
            },
            {
              bg: "bg-[#F79D02]",
              border: "border-[#F79D02]",
              text: "text-[#F79D02]",
            },
            {
              bg: "bg-[#0047C2]",
              border: "border-[#0047C2]",
              text: "text-[#0047C2]",
            },
            {
              bg: "bg-[#10B981]",
              border: "border-[#10B981]",
              text: "text-[#10B981]",
            },
            // { bg: "bg-red-400", border: "border-red-400" ,text:"text-red-400"},
            // { bg: "bg-purple-400", border: "border-purple-400" ,text:"text-purple-400"},
            // { bg: "bg-pink-400", border: "border-pink-400" ,text:"text-pink-400"},
            // { bg: "bg-indigo-400", border: "border-indigo-400" ,text:"text-indigo-400"},
            // { bg: "bg-teal-400", border: "border-teal-400" ,text:"text-teal-400"},
            // { bg: "bg-orange-400", border: "border-orange-400" ,text:"text-orange-400"},
          ];
          const idx = Math.floor(Math.random() * colors.length);
          return `${colors[idx].bg} ${colors[idx].border} ${colors[idx].text}`;
        };

        const stagesWithColor = result.data.map((stage: any) => ({
          ...stage,
          color: getRandomColor(),
        }));

        setStages(stagesWithColor);
      } else {
        setStagesError("Failed to load pipeline stages");
        showToast("Failed to load pipeline stages", undefined, "error");
      }
    } catch (error) {
      console.error("Error fetching pipeline stages:", error);
      const errorMessage = "Failed to load pipeline stages";
      setStagesError(errorMessage);
      showToast(errorMessage, "Please try refreshing the page", "error");
    } finally {
      setIsLoadingStages(false);
    }
  };

  // Function to refresh all data
  const refreshData = () => {
    if (jobId) {
      fetchApplicantsData(jobId);
      fetchPipelineStages(jobId);
    }
  };

  // Helper functions
  const getApplicantsByStage = (stageId: string): Applicant[] => {
    return applicants.filter(
      (applicant) => applicant.currentPipeline?.stage?.stageId === stageId
    );
  };

  // Interview management handlers
  const handleRescheduleInterview = async (
    applicantId: string,
    interviewId: string
  ) => {
    try {
      const applicant = applicants.find((app) => app.ID === applicantId);
      const interview: any = applicant?.scheduledInterviews?.find(
        (int) => int.interviewId === interviewId
      );

      if (applicant && interview) {
        const processedInterview = {
          ...interview,
          interviewers: interview.interviewers || [],
        };
        // console.log(processedInterview);
        setSelectedApplicantForReschedule(applicant);
        setSelectedInterview(processedInterview);
        setIsRescheduleOpen(true);
      } else {
        showToast(
          "Error",
          "Interview details not found. Please refresh and try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error opening reschedule dialog:", error);
      showToast(
        "Error",
        "Failed to open reschedule dialog. Please try again.",
        "error"
      );
    }
  };

  const handleRescheduleSuccess = async (
    updatedInterview: ReScheduledInterview
  ) => {
    setIsRescheduling(true);
    // console.log(updatedInterview);
    try {
      const applicant = selectedApplicantForReschedule;
      if (!applicant) {
        throw new Error("Applicant information not available");
      }
      await refreshToken();
      showToast(
        "Rescheduling Interview",
        "Please wait while we reschedule the interview...",
        "info"
      );

      const rescheduleRequest = {
        interviewId: updatedInterview.interviewId,
        newScheduledDateTime: updatedInterview.scheduledDateTime,
        newDuration: updatedInterview.duration,
        newLocation: updatedInterview.location,
        newMeetingLink: updatedInterview.meetingLink,
        reason: "Interview rescheduled",
        modifiedByUserId: currentUser?.userID,

        isTeamsMeeting: updatedInterview.isTeamsMeeting,
        status: "Rescheduled",
        newType: updatedInterview.type,
        // JUST PASS THE INTERVIEWERS DIRECTLY!
        interviewers: updatedInterview.interviewers || [],
        applicantEmail: applicant.email,
        applicantName: `${applicant.firstName} ${applicant.lastName}`.trim(),
        companyName: "Quadrasystems.net India Pvt Ltd",
        interviewTitle: updatedInterview.title,
        interviewDescription: `Interview rescheduled for ${updatedInterview.scheduledDateTime} at ${updatedInterview.location}`,
        timeZone: "Asia/Kolkata",
      };

      await rescheduleInterview(
        rescheduleRequest,
        accessToken,
        currentUser.calendarId,
        currentUser.displayName,
        currentUser.email
      );

      setIsRescheduleOpen(false);
      setSelectedInterview(null);
      setSelectedApplicantForReschedule(null);

      refreshData();
      showToast("Success", "Interview rescheduled successfully!");
    } catch (error) {
      console.error("Failed to reschedule interview:", error);
      showToast(
        "Error",
        `Failed to reschedule interview: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleCancelInterview = async (
    applicantId: string,
    interviewId: string
  ) => {
    try {
      const applicant = applicants.find((app) => app.ID === applicantId);
      const interview = applicant?.scheduledInterviews?.find(
        (int) => int.interviewId === interviewId
      );

      if (applicant && interview) {
        const processedInterview = {
          ...interview,
          interviewers: interview.interviewers || [],
        };

        setSelectedApplicantForCancel(applicant);
        setSelectedInterviewForCancel(processedInterview);
        setIsCancelOpen(true);
      } else {
        showToast(
          "Error",
          "Interview details not found. Please refresh and try again.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error opening cancel dialog:", error);
      showToast(
        "Error",
        "Failed to open cancel dialog. Please try again.",
        "error"
      );
    }
  };

  const handleCancelSuccess = async (cancelData: any) => {
    setIsCancelling(true);

    try {
      const applicant = selectedApplicantForCancel;
      if (!applicant) {
        throw new Error("Applicant information not available");
      }

      // Show loading toast
      showToast(
        "Cancelling Interview",
        "Please wait while we cancel the interview...",
        "info"
      );
      // console.log(selectedInterviewForCancel);
      // Get primary interviewer name from the interviewers array
      const interviewers = selectedInterviewForCancel.interviewers || [];
      await refreshToken();

      // Format interviewers for display in email
      const interviewersList = interviewers
        .map((i: any) => `${i.displayName}${i.isPrimary ? " (Primary)" : ""}`)
        .join(", ");

      const cancelRequest = {
        interviewId: cancelData.interviewId,
        reason: cancelData.reason,
        modifiedByUserId: currentUser?.userID,
        applicantEmail: applicant.email,
        applicantName: `${applicant.firstName} ${applicant.lastName}`.trim(),
        companyName: "Quadrasystems.net India Pvt Ltd",
        interviewerName: interviewersList, // Send full list of interviewers
        interviewTitle: selectedInterviewForCancel.title,
        scheduledDateTime: selectedInterviewForCancel.scheduledDateTime,
        location: selectedInterviewForCancel.location,
        iCalUId: selectedInterviewForCancel.iCalUId,
        // Add interviewers array for the API
        interviewers: interviewers.map((interviewer: any) => ({
          id: interviewer.id,
          displayName: interviewer.displayName,
          email: interviewer.email,
          role: interviewer.role || "Interviewer",
          isPrimary: interviewer.isPrimary || false,
        })),
      };

      await cancelInterview(cancelRequest, accessToken, currentUser.calendarId);

      setIsCancelOpen(false);
      setSelectedInterviewForCancel(null);
      setSelectedApplicantForCancel(null);

      refreshData();
      showToast("Success", "Interview cancelled successfully!");
    } catch (error) {
      console.error("Failed to cancel interview:", error);
      showToast(
        "Error",
        `Failed to cancel interview: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsCancelling(false);
    }
  };

  // Stage management handlers
  const addStage = () => {
    if (!newStageName.trim()) {
      showToast("Error", "Stage name is required", "error");
      return;
    }

    const finalInterviewStage = stages.find((s) => s.ID === "final-interview");
    const insertOrder = finalInterviewStage
      ? finalInterviewStage.Order
      : Math.max(...stages.map((s) => s.Order), 0) + 1;

    const updatedStages = stages.map((stage) => {
      if (stage.Order >= insertOrder) {
        return { ...stage, Order: stage.Order + 1 };
      }
      return stage;
    });

    const newStage: InterviewStage = {
      ID: `stage-${Date.now()}`,
      InterviewName: newStageName,
      Description: newStageDescription || "Custom interview stage",
      isDefault: false,
      Order: insertOrder,
      IsManual: false,
      Show: true,
      color: "bg-slate-50 border-slate-200",
      JobPostingID: jobId,
      StageSequence: updatedStages.length + 1,
      CreatedByUserID: currentUser?.userID,
      CreatedAt: new Date().toISOString(),
      notify: false,
      notifyUser: []
    };

    setStages([...updatedStages, newStage]);
    setNewStageName("");
    setNewStageDescription("");
    setIsAddStageOpen(false);
    showToast("Success", `Stage "${newStageName}" added successfully!`);
  };

  const removeStage = (stageId: string) => {
    const stage = stages.find((s) => s.ID === stageId);

    if (stage && ["applied", "hired"].includes(stage.ID)) {
      showToast("Warning", "Cannot remove essential stages", "warning");
      return;
    }

    const applicantsInStage = getApplicantsByStage(stageId);
    if (applicantsInStage.length > 0) {
      showToast(
        "Warning",
        `Deleting stage ${stage?.InterviewName} with ${applicantsInStage.length} applicants`,
        "warning"
      );
    }

    setStages(stages.filter((s) => s.ID !== stageId));
    showToast(
      "Success",
      `Stage "${stage?.InterviewName}" removed successfully!`
    );
  };

  // Drag and drop handlers
  const handleDragStart = (applicantId: string) => {
    setDraggedApplicant(applicantId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (draggedApplicant) {
      const updatedApplicants: any = applicants.map((applicant) =>
        applicant.ID === draggedApplicant
          ? {
              ...applicant,
              currentPipeline: {
                ...applicant.currentPipeline,
                stage: { ...applicant.currentPipeline?.stage, stageId },
              },
            }
          : applicant
      );

      setApplicants(updatedApplicants);
      onApplicantsUpdate?.(updatedApplicants);
      setDraggedApplicant(null);
      showToast("Success", "Applicant moved successfully!");
    }
  };

  // Selection handlers
  const handleApplicantSelect = (applicantId: string, checked: boolean) => {
    const newSelection = new Set(selectedApplicants);
    if (checked) {
      newSelection.add(applicantId);
    } else {
      newSelection.delete(applicantId);
    }
    setSelectedApplicants(newSelection);
  };

  const selectAllInStage = (stageId: string) => {
    const stageApplicants = getApplicantsByStage(stageId);
    const newSelection = new Set(selectedApplicants);
    stageApplicants.forEach((applicant) => newSelection.add(applicant.ID));
    setSelectedApplicants(newSelection);
  };

  const deselectAllInStage = (stageId: string) => {
    const stageApplicants = getApplicantsByStage(stageId);
    const newSelection = new Set(selectedApplicants);
    stageApplicants.forEach((applicant) => newSelection.delete(applicant.ID));
    setSelectedApplicants(newSelection);
  };

  const clearSelection = () => {
    setSelectedApplicants(new Set());
  };

  // Scheduling handlers
  const openBulkSchedule = async() => {
    await refreshToken()
    setIsBulkScheduleOpen(true);
  };

  const openIndividualSchedule = (applicantId: string,stageId:string,stageName:string) => {
    // console.log("open paramas",applicantId,stageId,stageName)
    const newSelection = new Set<string>();
    newSelection.add(applicantId);
    setSelectedApplicants(newSelection);
    setIsIndividualScheduleOpen(true);
    setSelectedStage({
      stageId,stageName
    })
  
  };

  const handleScheduleDialogClose = (open: boolean) => {
    if (!open) {
      setIsBulkScheduleOpen(false);
      setIsIndividualScheduleOpen(false);
      if (isIndividualScheduleOpen) {
        setSelectedApplicants(new Set());
      }
    }
  };

        // console.log("Current user",currentUser)


  const handleScheduleSubmit = async (scheduleData: ScheduleData) => {
    // console.log(scheduleData);
    setIsScheduling(true);

    try {
     const freshToken = await refreshToken()

      if (!freshToken) {
        throw new Error("Failed to refresh authentication token");
      }
      showToast(
        "Scheduling Interviews",
        `Scheduling ${scheduleData.interviews.length} interview(s)...`,
        "info"
      );

      if(!currentUser.calendarId){
        // console.log("calender error")
        showToast(
          "Error",
          "Couldn't access calendar",
          "error"
        )
        return;
      }


      const apiResults = await scheduleBulkInterviews(
        scheduleData,
        jobId,
        currentUser?.userID,
        freshToken,
        currentUser.calendarId,
        currentUser.displayName,
        currentUser.email
      );

      const successfulSchedules = apiResults.filter((result) => result.success);
      const failedSchedules = apiResults.filter((result) => !result.success);

      if (failedSchedules.length > 0) {
        showToast(
          "Warning",
          `${successfulSchedules.length} interviews scheduled successfully, ${failedSchedules.length} failed. Check console for details.`,
          "warning"
        );
      } else if (successfulSchedules.length > 0) {
        showToast(
          "Success",
          `All ${successfulSchedules.length} interview(s) scheduled successfully!`
        );
      }

      setIsBulkScheduleOpen(false);
      setIsIndividualScheduleOpen(false);
      setSelectedApplicants(new Set());
      refreshData();
      handleScheduleDialogClose(false)

    } catch (error) {
      console.error("Failed to schedule interview:", error);
      showToast(
        "Error",
        `Failed to schedule interview: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsScheduling(false);
    }
  };

  // Navigation handler
  const handleNavigateToApplicant = (applicantId: string) => {
    navigate(`/applicant/${applicantId}`);
  };

  // Approval and rejection handlers
  const handleApprove = async (applicant: Applicant, feedback:string, salary:string,shouldSaveFeedback:boolean=false) => {
    setIsProcessing(true);

    try {
      const approvalRequest = {
        applicantId: applicant.ID,
        jobPostingId: jobId,
        currentPipelineId: applicant.currentPipelineId,
        modifiedByUserID: currentUser?.userID,
        notes: null,
        feedback:feedback,
        salary:salary,
        shouldSaveFeedback:shouldSaveFeedback
      };

      const response = await approveApplicant(approvalRequest, accessToken);

      if (response.success) {
        showToast("Success", response.message);
        refreshData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Failed to approve applicant:", error);
      showToast(
        "Error",
        `Failed to approve applicant: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (applicant: Applicant, reason: string) => {
    if (!reason || reason.trim().length === 0) {
      showToast("Error", "Please provide a reason for rejection.", "error");
      return;
    }

    setIsProcessing(true);

    try {
      const rejectionRequest = {
        applicantId: applicant.ID,
        jobPostingId: jobId,
        currentPipelineId: applicant.currentPipelineId,
        rejectionReason: reason.trim(),
        modifiedByUserID: currentUser?.userID,
        notes: null,
      };

      const response = await rejectApplicant(rejectionRequest, accessToken);

      if (response.success) {
        showToast("Success", response.message);
        refreshData();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("Failed to reject applicant:", error);
      showToast(
        "Error",
        `Failed to reject applicant: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Bulk operations
  const isSelectionInManualStage = () => {
    const selectedApplicantIds = Array.from(selectedApplicants);
    const selectedApplicantObjects = applicants.filter((applicant) =>
      selectedApplicantIds.includes(applicant.ID)
    );

    return selectedApplicantObjects.some((applicant) => {
      const currentStage = stages.find(
        (stage) => applicant.currentPipeline?.stage?.stageId === stage.ID
      );
      return currentStage?.IsManual === true;
    });
  };

  const handleBulkApprove = async () => {
    setIsProcessing(true);

    try {
      const selectedApplicantIds = Array.from(selectedApplicants);
      const applicantsToApprove = applicants.filter((applicant) =>
        selectedApplicantIds.includes(applicant.ID)
      );

      const results = await Promise.all(
        applicantsToApprove.map((applicant) =>
          approveApplicant(
            {
              applicantId: applicant.ID,
              jobPostingId: jobId,
              currentPipelineId: applicant.currentPipelineId,
              modifiedByUserID: currentUser?.userID,
              notes: "Bulk approved",
            },
            accessToken
          )
        )
      );

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (failCount > 0) {
        showToast(
          "Warning",
          `${successCount} applicants approved successfully, ${failCount} failed`,
          "warning"
        );
      } else {
        showToast(
          "Success",
          `${successCount} applicants approved successfully`
        );
      }

      refreshData();
      clearSelection();
    } catch (error) {
      console.error("Bulk approval failed:", error);
      showToast(
        "Error",
        "Failed to approve applicants. Please try again.",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    const reason = prompt(
      "Please enter reason for rejecting these applicants:"
    );
    if (!reason || reason.trim().length === 0) {
      showToast("Error", "Rejection reason is required", "error");
      return;
    }

    setIsProcessing(true);

    try {
      const selectedApplicantIds = Array.from(selectedApplicants);
      const applicantsToReject = applicants.filter((applicant) =>
        selectedApplicantIds.includes(applicant.ID)
      );

      const results = await Promise.all(
        applicantsToReject.map((applicant) =>
          rejectApplicant(
            {
              applicantId: applicant.ID,
              jobPostingId: jobId,
              currentPipelineId: applicant.currentPipelineId,
              rejectionReason: reason,
              modifiedByUserID: currentUser?.userID,
              notes: "Bulk rejected",
            },
            accessToken
          )
        )
      );

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.length - successCount;

      if (failCount > 0) {
        showToast(
          "Warning",
          `${successCount} applicants rejected successfully, ${failCount} failed`,
          "warning"
        );
      } else {
        showToast(
          "Success",
          `${successCount} applicants rejected successfully`
        );
      }

      refreshData();
      clearSelection();
    } catch (error) {
      console.error("Bulk rejection failed:", error);
      showToast(
        "Error",
        "Failed to reject applicants. Please try again.",
        "error"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // Pipeline update callback
  const handlePipelineUpdate = () => {
    fetchPipelineStages(jobId);
  };

  // Initial data loading
  useEffect(() => {
    if (jobId) {
      fetchApplicantsData(jobId);
      fetchPipelineStages(jobId);
    }
  }, [jobId, refreshTrigger]);

  // Loading state
  if (isLoadingApplicants || isLoadingStages) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">
          Loading Pipeline and Interviews...
        </Body1Strong>
      </div>
    );
  }

  // Error state
  if (applicantsError || stagesError) {
    return (
      <div className="p-4 text-center flex flex-col items-center justify-center">
        <Text className="text-red-600 mb-2">
          {applicantsError || stagesError}
        </Text>
        <Button
          appearance="primary"
          onClick={refreshData}
          disabled={isLoadingApplicants || isLoadingStages}
        >
          {isLoadingApplicants || isLoadingStages ? (
            <>
              <Spinner size="tiny" className="mr-2" />
              Retrying...
            </>
          ) : (
            "Retry"
          )}
        </Button>
      </div>
    );
  }

  return (
    <FluentProvider className="relative !bg-transparent">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Loading overlay for interview operations */}
        {(isScheduling || isRescheduling || isCancelling) && (
          <div className="flex flex-col items-center justify-center py-8 h-full">
            <Spinner />
            <Body1Strong className="mt-2">
              {isScheduling && "Scheduling interviews..."}
              {isRescheduling && "Rescheduling interview..."}
              {isCancelling && "Cancelling interview..."}
            </Body1Strong>
          </div>
        )}

        {!isScheduling && !isRescheduling && !isCancelling && (
          <>
            <PipelineHeader
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              isAddStageOpen={isAddStageOpen}
              onAddStageOpenChange={setIsAddStageOpen}
              newStageName={newStageName}
              onNewStageNameChange={setNewStageName}
              newStageDescription={newStageDescription}
              onNewStageDescriptionChange={setNewStageDescription}
              onAddStage={addStage}
            />

            {/* Bulk Actions Bar */}
            {selectedApplicants.size > 0 && (
              <BulkActionsBar
                selectedCount={selectedApplicants.size}
                onClearSelection={clearSelection}
                onBulkSchedule={openBulkSchedule}
                onBulkApprove={handleBulkApprove}
                onBulkReject={handleBulkReject}
                isManualStage={isSelectionInManualStage()}
              />
            )}

            {stages.length > 0 ? (
              <>
                <PipelineStepper
                  applicants={applicants}
                  stages={stages}
                  getApplicantsByStage={getApplicantsByStage}
                  currentStage={currentStage}
                  jobId={jobId}
                  onPipelineUpdate={handlePipelineUpdate}
                />
              </>
            ) : (
              <>
                <div className="flex flex-col items-center justify-center py-8 h-full">
                  <Spinner />
                  <Body1Strong className="mt-2">
                    Loading pipeline stages...
                  </Body1Strong>
                </div>
              </>
            )}

            {/* Pipeline Views */}
            {stages.length > 0 ? (
              <div className="flex-1 min-h-0 overflow-hidden">
                {viewMode === "kanban" ? (
                  <KanbanView
                    jobRole={jobRole}
                    designation={JDData?.designation}
                    jobId={jobId}
                    stages={stages}
                    selectedApplicants={selectedApplicants}
                    onApplicantSelect={handleApplicantSelect}
                    onSelectAllInStage={selectAllInStage}
                    onDeselectAllInStage={deselectAllInStage}
                    onRemoveStage={removeStage}
                    onScheduleApplicant={openIndividualSchedule}
                    onNavigateToApplicant={handleNavigateToApplicant}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                    getApplicantsByStage={getApplicantsByStage}
                    onRescheduleInterview={handleRescheduleInterview}
                    onCancelInterview={handleCancelInterview}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onBulkApprove={handleBulkApprove}
                    onBulkReject={handleBulkReject}
                    isProcessing={isProcessing} // Pass loading state to kanban view
                    refreshData={refreshData}
                    isSubordinate={isSubordiante}
                  />
                ) : (
                  <StepperView
                    jobRole={jobRole}
                    jobId={jobId}
                    designation={JDData?.designation}
                    stages={stages}
                    selectedApplicants={selectedApplicants}
                    onApplicantSelect={handleApplicantSelect}
                    onSelectAllInStage={selectAllInStage}
                    onDeselectAllInStage={deselectAllInStage}
                    onRemoveStage={removeStage}
                    onScheduleApplicant={openIndividualSchedule}
                    onNavigateToApplicant={handleNavigateToApplicant}
                    getApplicantsByStage={getApplicantsByStage}
                    onRescheduleInterview={handleRescheduleInterview}
                    onCancelInterview={handleCancelInterview}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onBulkApprove={handleBulkApprove}
                    onBulkReject={handleBulkReject}
                    isProcessing={isProcessing} // Pass loading state to stepper view
                    refreshData={refreshData}
                    isSubordinate={isSubordiante}
                    departmentId={JDData?.departmentId}
                    SelectedStage={SelectedStage}
                  />
                )}
              </div>
            ) : (
              <></>
            )}
          </>
        )}
        {/* Header */}

        {/* Dialogs */}
        <AddStageDialog
          isOpen={isAddStageOpen}
          onOpenChange={setIsAddStageOpen}
          newStageName={newStageName}
          onNewStageNameChange={setNewStageName}
          newStageDescription={newStageDescription}
          onNewStageDescriptionChange={setNewStageDescription}
          onAddStage={addStage}
        />

        <ScheduleDialog
          isOpen={isBulkScheduleOpen || isIndividualScheduleOpen}
          onOpenChange={handleScheduleDialogClose}
          selectedApplicants={selectedApplicants}
          applicants={applicants}
          stages={stages}
          onScheduleSuccess={handleScheduleSubmit}
          isLoading={isScheduling}
          jobRole={jobRole}
          jobSequence={jobSequence} // Pass loading state to schedule dialog
          currentStage={SelectedStage}
        />

        <RescheduleDialog
          isOpen={isRescheduleOpen}
          onOpenChange={setIsRescheduleOpen}
          interview={selectedInterview}
          applicant={selectedApplicantForReschedule}
          onRescheduleSuccess={handleRescheduleSuccess}
        />

        <CancelInterviewDialog
          isOpen={isCancelOpen}
          onOpenChange={setIsCancelOpen}
          interview={selectedInterviewForCancel}
          applicant={selectedApplicantForCancel}
          onCancelSuccess={handleCancelSuccess}
          isLoading={isCancelling} // Pass loading state to cancel dialog
        />
      </div>
      <Toaster toasterId={toasterId} />
    </FluentProvider>
  );
};

export default DynamicInterviewPipeline;
