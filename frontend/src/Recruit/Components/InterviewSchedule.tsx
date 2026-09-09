import React, { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  Badge,
  Button,
  Input,
  Dropdown,
  Option,
  Avatar,
  Tooltip,
  FluentProvider,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  Label,
  Card,
  Caption1,
  Body1Strong,
  Subtitle2,
  AvatarGroup,
  AvatarGroupItem,
  AvatarGroupPopover,
  partitionAvatarGroupItems,
  Menu,
  MenuTrigger,
  MenuButton,
  MenuPopover,
  MenuList,
  MenuItem,
  Subtitle1,
  Spinner,
} from "@fluentui/react-components";
import {
  DismissCircle20Regular,
  ArrowCounterclockwise20Regular,
  Video20Regular,
  Eye20Regular,
  CalendarDateRegular,
  PersonFeedbackRegular,
  SearchRegular,
  FilterRegular,
  BuildingRegular,
  DismissRegular,
  Video16Regular,
  Person16Regular,
  Phone16Regular,
  ChevronDownRegular,
  ChevronUpRegular,
  PersonRegular,
} from "@fluentui/react-icons";
import FeedbackForm from "./FeedbackForm";
import { useAuth } from "../../Auth/AuthProvider";
import FeedbackPreviewDialog from "./FeedbackPreviewDialog";
import { CancelInterviewDialog } from "./CancelInterviewDialog";

import { fetchApplicantDetailByID } from "../../Services/Applicant";
import { getInterviewDetailsById } from "../../Services/InterviewScheduling";
import RescheduleDialog from "./Interview Schedular/RescheduleFormData ";
import { ApplicantDrawer } from "../Pages/ApplicantDrawer";
import PreviewJDForm from "../Pages/PreviewJDForm";
import CustomPagination from "../Components/CustomPagination";
import { useNavigate, useSearchParams } from "react-router-dom";

// Enhanced Interviewer interface
interface Interviewer {
  id: string;
  displayName: string;
  email: string;
  role?: string;
  isPrimary?: boolean;
}

// Enhanced Interview interface with proper interviewer handling
interface Interview {
  ID: string;
  InterviewTitle: string;
  InterviewType: string;
  ScheduledDateTime: string;
  Duration: number;
  Status: string;
  Location?: string;
  MeetingLink?: string;
  ApplicantName: string;
  JobRole: string;
  Notes: string;
  Department: string;
  JobLocation: string;
  ApplicantCode: string;
  ApplicantEmail: string;
  ApplicantPhone: string;
  PipelineStage: string;
  JobSkills: string[];
  Email: string;
  ApplicantID: string;
  JobPostingID: string;
  ApplicantPipelineID: string;
  interviewers?: Interviewer[];
  OutlookEventID?: string;
  isTeamsmeeting?: boolean;
  meetingLink?: string;
  // Array of interviewers with proper typing
}

interface ScheduledInterview {
  interviewId: string;
  applicantId: string;
  title: string;
  type: "phone" | "virtual" | "in-person";
  scheduledDateTime: string;
  duration: number;
  location: string;
  meetingLink?: string;
  isTeamsMeeting: boolean; // Keep only this one
  status: "Scheduled" | "Completed" | "Cancelled" | "Rescheduled";
  notes: string;
  timeZone?: string;
  stageId?: string;
  interviewers?: Interviewer[];
  outlookEventId?: string;
  originalDateTime?: string;
  rescheduleCount?: number;
  rescheduleReason?: string;
  lastRescheduledAt?: string;
  stage?: string;
  interviewerId?: string;
  // Remove these duplicate properties:
  // isTeamsmeeting?: boolean;
  // OutlookEventID?: string;
}

interface InterviewScheduleProps {
  interviews: Interview[];
  onSelectInterview: (interview: Interview) => void;
  statusFilter?: string;
  onRefresh?: () => void;
  onCancelInterview?: (details: any) => any;
  onRescheduleInterview?: (details: any) => any;
  stages?: any[];
  serverPagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  showFeedBack:boolean;
  onServerPageChange?: (page: number) => void;
  onServerPageSizeChange?: (pageSize: number) => void;
  onStatusFilterChange?: (status: string) => void;
  // When provided, search is performed server-side: the (debounced) term is
  // sent to the parent to re-fetch, instead of filtering the current page.
  onSearchChange?: (search: string) => void;
  // Server mode: reset status + search + page in a single parent fetch.
  onClearFilters?: () => void;
  // Shows a loader inside the table body while the parent re-fetches.
  isLoading?: boolean;
}

interface CancelInterviewData {
  interviewId: string;
  reason: string;
  applicantId: string;
}

interface Applicant {
  ID: string;
  firstName: string;
  lastName: string;
  email: string;
  ApplicantCode: string;
}

export default function InterviewSchedule({
  interviews,
  onSelectInterview,
  statusFilter = "all",
  onRefresh,
  onCancelInterview,
  onRescheduleInterview,
  stages = [],
  serverPagination,
  onServerPageChange,
  onServerPageSizeChange,
  onStatusFilterChange,
  onSearchChange,
  onClearFilters,
  showFeedBack = false,
  isLoading = false,
}: InterviewScheduleProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // console.log(interviews);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(
    null
  );
  const [jdData, setJDOverview] = useState<string>("");

  const [sortConfig, setSortConfig] = useState({
    key: "date",
    direction: "asc" as "asc" | "desc",
  });
  const { currentUser, accessToken }: any = useAuth();

  // Keep the latest onSearchChange without retriggering the debounce effect
  const onSearchChangeRef = React.useRef(onSearchChange);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  // Debounce server-side search — the term is sent to the parent to re-fetch.
  // Skips the initial mount so we don't fire a redundant fetch for the empty
  // term the parent already loads on start.
  const isFirstSearchRun = React.useRef(true);
  // Last term actually sent to the parent — used to dedupe so clearing (or any
  // no-op change) doesn't fire a redundant fetch that could race a Clear.
  const lastEmittedSearchRef = React.useRef("");
  useEffect(() => {
    if (!onSearchChangeRef.current) return; // client-side mode: local filter handles it
    if (isFirstSearchRun.current) {
      isFirstSearchRun.current = false;
      return;
    }
    const handler = setTimeout(() => {
      const value = searchTerm.trim();
      if (value === lastEmittedSearchRef.current) return;
      lastEmittedSearchRef.current = value;
      onSearchChangeRef.current?.(value);
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm]);
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 0,
  });

  const [typeFilter, setTypeFilter] = useState("all");
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [
    selectedInterviewForCancel,
    setSelectedInterviewForCancel,
  ] = useState<Interview | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isJDPreviewOpen, setIsJDPreviewOpen] = useState(false);

  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [
    selectedInterviewForReschedule,
    setSelectedInterviewForReschedule,
  ] = useState<Interview | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [
    rescheduleInterviewData,
    setRescheduleInterviewData,
  ] = useState<ScheduledInterview | null>(null);
  const [
    rescheduleApplicantData,
    setRescheduleApplicantData,
  ] = useState<Applicant | null>(null);

  useEffect(() => {
    if (statusFilter && statusFilter !== "all") {
      setFilterStatus(statusFilter);
    } else {
      setFilterStatus("all");
    }
  }, [statusFilter]);

  const [pendingFeedbackId, setPendingFeedbackId] = useState<string | null>(null);

  // Modified useEffect to handle URL-based dialog opening with loading state
  useEffect(() => {
    const feedbackInterviewId = searchParams.get('feedback');

    if (feedbackInterviewId) {
      // If interviews are loaded, open the dialog
      if (interviews && interviews.length > 0) {
        const interviewToOpen = interviews.find(int => int.ID === feedbackInterviewId);
        if (interviewToOpen) {
          setSelectedInterview(interviewToOpen);
          setShowFeedbackForm(true);
          setPendingFeedbackId(null); // Clear pending state
        } else {
          // Interview not found in current list, keep waiting
          setPendingFeedbackId(feedbackInterviewId);
        }
      } else {
        // Interviews not loaded yet, store the ID to open later
        setPendingFeedbackId(feedbackInterviewId);
      }
    } else {
      // No feedback parameter in URL, clear pending state
      setPendingFeedbackId(null);
    }
  }, [searchParams, interviews]);

  // Update handleAddFeedback to include URL parameter
  const handleAddFeedback = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowFeedbackForm(true);

    // Update URL to include feedback parameter
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('feedback', interview.ID);
    navigate(`?${newSearchParams.toString()}`, { replace: true });
  };

  const generateShareableLink = (interview: Interview) => {
    const shareUrl = `${import.meta.env.VITE_FRONTEND_URL}/#/recruit/HiringDashboard?feedback=${interview.ID}`;
    return shareUrl;
  };

  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
  const [previewInterview, setPreviewInterview] = useState(null);

  const handlePreviewFeedback = (interview: any) => {
    setPreviewInterview(interview);
    setShowPreviewDrawer(true);
  };

  const handleViewDetails = (applicant: any) => {
    // console.log(applicant);
    setSelectedApplicant({
      ID: applicant.ApplicantID,
      ApplicantName: applicant.ApplicantName,
      ApplicantCode: applicant.ApplicantCode,
      status: applicant.Status,
    });
    setIsDrawerOpen(true);
  };

  const handleClosePreview = () => {
    setShowPreviewDrawer(false);
    setPreviewInterview(null);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    setTypeFilter("all");
    if (onClearFilters) {
      // Server mode: reset status + search + page in a single parent fetch.
      // Mark "" as already-emitted so the search debounce won't fire a second,
      // racing fetch for the cleared term.
      lastEmittedSearchRef.current = "";
      onClearFilters();
    } else if (onStatusFilterChange) {
      onStatusFilterChange("all");
    }
  };

  // Enhanced filter function to include interviewer names in search
const paginatedInterviews = useMemo(() => {

  
  const uniqueById = Object.values(
    interviews.reduce((acc, item) => {
      acc[item.ID] = item;
      return acc;
    }, {} as Record<string, typeof interviews[number]>)
  );

  let data = [...uniqueById];

  // FILTER
  data = data.filter((interview) => {
  const status = interview.Status?.toLowerCase();

  const interviewerNames = (interview.interviewers || [])
    .map((i) => i.displayName)
    .join(" ")
    .toLowerCase();

  const search = searchTerm.toLowerCase();

  return (
    (!!serverPagination || filterStatus === "all" || status === filterStatus) &&
    (typeFilter === "all" ||
      interview.InterviewType?.toLowerCase() === typeFilter) &&
    (
      // Server mode: search is applied server-side, skip client filtering
      !!serverPagination ||
      interview.InterviewTitle?.toLowerCase().includes(search) ||
      interview.ApplicantName?.toLowerCase().includes(search) ||
      interview.JobRole?.toLowerCase().includes(search) ||
      interview.Department?.toLowerCase().includes(search) ||
      interview.ApplicantCode?.toLowerCase().includes(search) ||
      interviewerNames.includes(search)
    )
  );
});


  // SORT
  data.sort((a, b) => {
    switch (sortConfig.key) {
      case "date":
        return (
          new Date(b.ScheduledDateTime).getTime() -
          new Date(a.ScheduledDateTime).getTime()
        );
      case "name":
        return a.ApplicantName.localeCompare(b.ApplicantName);
      case "role":
        return a.JobRole.localeCompare(b.JobRole);
      case "status":
        return a.Status.localeCompare(b.Status);
      default:
        return 0;
    }
  });

  // PAGINATE
  if (serverPagination) {
    // Data already paginated by server; return as-is
    return {
      pageData: data,
      totalCount: serverPagination.total,
      totalPages: serverPagination.totalPages,
    };
  }

  const totalCount = data.length;
  const totalPages = Math.ceil(totalCount / pagination.pageSize);
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const pageData = data.slice(start, start + pagination.pageSize);

  return {
    pageData,
    totalCount,
    totalPages,
  };
}, [
  interviews,
  filterStatus,
  searchTerm,
  typeFilter,
  sortConfig,
  pagination.currentPage,
  pagination.pageSize,
  serverPagination,
]);



  const formatDateTime = (dateString: string) => {
    if (!dateString) return { date: "N/A", time: "N/A" };

    try {
      const cleanDateString = dateString.replace("Z", "");
      const date = new Date(cleanDateString);

      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();

      const istDate = new Date(year, month, day, hour, minute);

      const now = new Date();
      const isToday = istDate.toDateString() === now.toDateString();
      const isTomorrow =
        new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() ===
        istDate.toDateString();

      let dateDisplay = istDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      if (isToday) dateDisplay = "Today";
      else if (isTomorrow) dateDisplay = "Tomorrow";

      const hours = istDate.getHours();
      const minutes = istDate.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");

      return {
        date: dateDisplay,
        time: `${displayHours}:${displayMinutes} ${ampm}`,
        isUpcoming: istDate > now,
        isPast: istDate < now,
      };
    } catch (error) {
      console.warn("Invalid date format:", dateString);
      return {
        date: "Invalid Date",
        time: "",
        isUpcoming: false,
        isPast: false,
      };
    }
  };

  const isInterviewPast = (scheduledDateTime: string) => {
    if (!scheduledDateTime) return false;

    try {
      const cleanDateString = scheduledDateTime.replace("Z", "");
      const date = new Date(cleanDateString);

      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();

      const istDate = new Date(year, month, day, hour, minute);
      const currentDate = new Date();

      return istDate < currentDate;
    } catch (error) {
      console.warn("Error parsing date:", scheduledDateTime);
      return false;
    }
  };

  const getWorkflowStatus = (interview: Interview) => {
    const isPast = isInterviewPast(interview.ScheduledDateTime);
    const status = interview.Status.toLowerCase();

    if (status === "cancelled") {
      return "cancelled";
    } else if (status === "completed") {
      return "completed";
    } else if (isPast) {
      return "awaiting_feedback";
    } else if (!isPast) {
      return "upcoming";
    } else if (status === "rescheduled") {
      return "rescheduled";
    }
    return "unknown";
  };

  const shouldShowFeedbackButton = (interview: Interview) => {
    return getWorkflowStatus(interview) === "awaiting_feedback";
  };

  const shouldShowPreviewFeedbackButton = (interview: Interview) => {
    return getWorkflowStatus(interview) === "completed";
  };

  const shouldShowRescheduleButtons = (interview: Interview) => {
    const workflowStatus = getWorkflowStatus(interview);
    return (
      workflowStatus === "upcoming" ||
      workflowStatus === "rescheduled" ||
      workflowStatus === "awaiting_feedback"
    );
  };

  // const handleAddFeedback = (interview: Interview) => {
  //   setSelectedInterview(interview);
  //   setShowFeedbackForm(true);
  // };

  // Update handleCloseFeedback to clear pending state
  const handleCloseFeedback = () => {
    setShowFeedbackForm(false);
    setSelectedInterview(null);
    setPendingFeedbackId(null); // Add this line

    // Remove feedback parameter from URL when closing
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('feedback');
    navigate(`?${newSearchParams.toString()}`, { replace: true });
  };

  const handleFeedbackSubmit = async (feedbackData: any) => {
    // console.log("Feedback submitted:", feedbackData);

    if (feedbackData.apiResponse?.success) {
      const {
        isRejected,
        isApproved,
        recommendation,
      } = feedbackData.apiResponse.data;
      console.log("Interview feedback processed:", {
        isRejected,
        isApproved,
        recommendation,
      });
    }

    setShowFeedbackForm(false);
    setSelectedInterview(null);
    handleCloseFeedback()

    if (onRefresh) {
      onRefresh();
    }
  };

  const convertToScheduledInterview = async (
    interview: Interview
  ): Promise<any> => {
    try {
      // console.log(interview);

      // Enhanced interviewer handling - try multiple sources and formats
      let interviewers: Interviewer[] = [];

      // console.log("Final processed interviewers:", interview.isTeamsmeeting);

      return {
        interviewId: interview.ID,
        applicantId: interview?.ApplicantID || interview.ApplicantID,
        title: interview?.InterviewTitle || interview.InterviewTitle,
        type: (
          interview?.InterviewType || interview.InterviewType
        ).toLowerCase() as "phone" | "virtual" | "in-person",
        scheduledDateTime:
          interview?.ScheduledDateTime || interview.ScheduledDateTime,
        duration: interview?.Duration || interview.Duration,
        location: interview?.Location || interview.Location || "",
        meetingLink: interview?.MeetingLink || interview.MeetingLink || "",
        isTeamsMeeting: interview.isTeamsmeeting,
        status: interview.Status as
          | "Scheduled"
          | "Completed"
          | "Cancelled"
          | "Rescheduled",
        notes: interview?.Notes || interview.Notes || "",
        timeZone: "Asia/Kolkata",
        stage: interview?.PipelineStage || interview.PipelineStage,
        stageId:
          interview?.ApplicantPipelineID || interview.ApplicantPipelineID,
        outlookEventId: interview?.OutlookEventID || interview?.OutlookEventID,
        interviewers: interview.interviewers,
        rescheduleCount: 0,
        originalDateTime: interview?.ScheduledDateTime,
        interviewerId: interviewers[0]?.id || currentUser?.userID,
      };
    } catch (error) {
      console.error("Error fetching interview details:", error);

      // Enhanced fallback - preserve all interview data
      const fallbackInterviewers = interview.interviewers || [];
      // console.log("Fallback interviewers:", fallbackInterviewers);

      // Fallback isTeamsMeeting detection
      const fallbackIsTeamsMeeting = Boolean(
        interview.isTeamsmeeting ||
        interview.MeetingLink?.toLowerCase().includes("teams") ||
        interview.meetingLink?.toLowerCase().includes("teams")
      );

      return {
        interviewId: interview.ID,
        applicantId: interview.ApplicantID,
        title: interview.InterviewTitle,
        type: interview.InterviewType.toLowerCase() as
          | "phone"
          | "virtual"
          | "in-person",
        scheduledDateTime: interview.ScheduledDateTime,
        duration: interview.Duration,
        location: interview.Location || "",
        meetingLink: interview.MeetingLink || "",
        isTeamsMeeting: fallbackIsTeamsMeeting,
        status: interview.Status as
          | "Scheduled"
          | "Completed"
          | "Cancelled"
          | "Rescheduled",
        notes: interview.Notes || "",
        stage: interview.PipelineStage,
        stageId: interview.ApplicantPipelineID,
        interviewers: fallbackInterviewers,
        interviewerId: fallbackInterviewers[0]?.id || currentUser?.userID,
        timeZone: "Asia/Kolkata",
        rescheduleCount: 0,
        originalDateTime: interview.ScheduledDateTime,
        outlookEventId: interview.OutlookEventID, // Add this for fallback
      };
    }
  };

  const convertToApplicant = async (
    interview: Interview
  ): Promise<Applicant> => {
    try {
      const applicantDetails = await fetchApplicantDetailByID(
        interview.ApplicantID,
        accessToken
      );

      return {
        ID: applicantDetails.ID,
        firstName: applicantDetails.firstName,
        lastName: applicantDetails.lastName,
        email: applicantDetails.email,
        ApplicantCode: applicantDetails.ApplicantCode,
      };
    } catch (error) {
      console.error("Error fetching applicant details:", error);
      const nameParts = interview.ApplicantName.split(" ");
      return {
        ID: interview.ApplicantID,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        email: interview.ApplicantEmail,
        ApplicantCode: interview.ApplicantCode,
      };
    }
  };

  const handleReschedule = async (interview: Interview) => {
    // console.log("Opening reschedule dialog for interview:", interview);
    setSelectedInterviewForReschedule(interview);

    try {
      const [interviewData, applicantData] = await Promise.all([
        convertToScheduledInterview(interview),
        convertToApplicant(interview),
      ]);

      // Log the data to debug
      // console.log("Interview data for reschedule:", interviewData);
      // console.log("Interviewers:", interviewData.interviewers);
      // console.log("isTeamsMeeting:", interviewData.isTeamsMeeting);

      setRescheduleInterviewData(interviewData);
      setRescheduleApplicantData(applicantData);
      setIsRescheduleOpen(true);
    } catch (error) {
      console.error("Error preparing reschedule data:", error);
      // Still open the dialog with the original interview data
      setRescheduleInterviewData({
        interviewId: interview.ID,
        applicantId: interview.ApplicantID,
        title: interview.InterviewTitle,
        type: interview.InterviewType.toLowerCase() as
          | "phone"
          | "virtual"
          | "in-person",
        scheduledDateTime: interview.ScheduledDateTime,
        duration: interview.Duration,
        location: interview.Location || "",
        meetingLink: interview.MeetingLink || "",
        isTeamsMeeting: interview.MeetingLink?.includes("teams") || false,
        status: "Scheduled",
        notes: interview.Notes || "",
        interviewers: interview.interviewers || [],
        stage: interview.PipelineStage,
        stageId: interview.ApplicantPipelineID,
      });
      setRescheduleApplicantData({
        ID: interview.ApplicantID,
        firstName: interview.ApplicantName.split(" ")[0] || "",
        lastName: interview.ApplicantName.split(" ").slice(1).join(" ") || "",
        email: interview.ApplicantEmail,
        ApplicantCode: interview.ApplicantCode,
      });
      setIsRescheduleOpen(true);
    }
  };

  const handleRescheduleSuccess = async (
    updatedInterview: ScheduledInterview
  ) => {
    setIsRescheduling(true);

    try {
      // console.log("Processing reschedule request:", updatedInterview);
      // console.log("Interviewers in reschedule:", updatedInterview.interviewers);
      // console.log("Teams meeting status:", updatedInterview.isTeamsMeeting);

      const applicantDetails = await fetchApplicantDetailByID(
        updatedInterview.applicantId,
        accessToken
      );

      // Ensure we have all interviewers with proper structure
      const interviewers = (updatedInterview.interviewers || []).map(
        (interviewer: Interviewer) => ({
          id: interviewer.id,
          displayName: interviewer.displayName,
          email: interviewer.email,
          role: interviewer.role || "Interviewer",
          isPrimary: interviewer.isPrimary || false,
        })
      );

      // console.log("Processed interviewers for API:", interviewers);

      const attendees = [
        {
          emailAddress: {
            address: applicantDetails.email || "",
            name: `${applicantDetails.firstName} ${applicantDetails.lastName}`.trim(),
          },
          type: "required",
        },
        ...interviewers.map((interviewer: Interviewer) => ({
          emailAddress: {
            address: interviewer.email,
            name: interviewer.displayName,
          },
          type: interviewer.isPrimary ? "required" : "optional",
        })),
      ];

      const rescheduleRequest = {
        interviewId: updatedInterview.interviewId,
        newScheduledDateTime: updatedInterview.scheduledDateTime,
        newDuration: updatedInterview.duration,
        type: updatedInterview.type,
        newLocation: updatedInterview.location,
        newMeetingLink: updatedInterview.meetingLink,
        reason: updatedInterview.rescheduleReason || "Interview rescheduled",
        attendees: attendees,
        status: "Rescheduled",
        isTeamsMeeting: Boolean(updatedInterview.isTeamsMeeting), // Ensure boolean
        interviewerId: interviewers[0]?.id || currentUser?.userID,
        modifiedByUserId: currentUser?.userID,
        interviewers: interviewers, // Pass all interviewers
        applicantEmail: applicantDetails.email,
        applicantName: `${applicantDetails.firstName} ${applicantDetails.lastName}`.trim(),
        companyName: "Quadrasystems.net India Pvt Ltd",
        interviewerName:
          interviewers.length > 1
            ? interviewers.map((i) => i.displayName).join(", ")
            : interviewers[0]?.displayName ||
            currentUser?.displayName ||
            "Interview Team",
        interviewTitle: updatedInterview.title,
        interviewDescription: `Interview rescheduled for ${updatedInterview.scheduledDateTime} at ${updatedInterview.location}`,
        outlookEventId: updatedInterview.outlookEventId, // Include outlook event ID
        timeZone: updatedInterview.timeZone || "Asia/Kolkata",
        // Add these fields to ensure data registration
        notes: updatedInterview.notes,
        rescheduleCount: (updatedInterview.rescheduleCount || 0) + 1,
        lastRescheduledAt: new Date().toISOString(),
      };

      // console.log("Final reschedule request:", rescheduleRequest);

      if (onRescheduleInterview) {
        const result = await onRescheduleInterview(rescheduleRequest);
        // console.log("Reschedule API result:", result);
      }

      setIsRescheduleOpen(false);
      setSelectedInterviewForReschedule(null);
      setRescheduleInterviewData(null);
      setRescheduleApplicantData(null);
      setIsRescheduling(false);

      if (onRefresh) {
        onRefresh();
      }

      // console.log("Interview rescheduled successfully");
    } catch (error) {
      setIsRescheduling(false);
      console.error("Failed to reschedule interview:", error);
      throw error;
    }
  };

  const handleCancel = (interview: Interview) => {
    // console.log("Opening cancel dialog for interview:", interview);
    setSelectedInterviewForCancel(interview);
    setIsCancelOpen(true);
  };

  const handleCancelSuccess = async (cancelData: CancelInterviewData) => {
    setIsCancelling(true);

    try {
      // console.log("Processing cancel request:", cancelData);

      const applicantDetails = await fetchApplicantDetailByID(
        cancelData.applicantId,
        accessToken
      );
      const interviewDetails = await getInterviewDetailsById(
        cancelData.interviewId,
        accessToken
      );
      // console.log(interviewDetails);
      const cancelRequest = {
        interviewId: cancelData.interviewId,
        reason: cancelData.reason,
        modifiedByUserId: currentUser?.userID,
        applicantEmail: applicantDetails.email,
        applicantName: `${applicantDetails.firstName} ${applicantDetails.lastName}`.trim(),
        companyName: "Quadrasystems.net India Pvt Ltd",
        interviewerName: currentUser?.displayName || "Interview Team",
        interviewTitle:
          selectedInterviewForCancel?.InterviewTitle ||
          interviewDetails.data[0]?.InterviewTitle,
        scheduledDateTime:
          selectedInterviewForCancel?.ScheduledDateTime ||
          interviewDetails.data[0]?.ScheduledDateTime,
        location:
          selectedInterviewForCancel?.Location ||
          interviewDetails.data[0]?.Location ||
          "Online",
        interviewers: selectedInterviewForCancel?.interviewers || [],
        iCalUId: interviewDetails.data[0]?.iCalUId,
      };
      // console.log("Final cancel request:", cancelRequest);

      if (onCancelInterview) {
        await onCancelInterview(cancelRequest);
      }

      setIsCancelOpen(false);
      setSelectedInterviewForCancel(null);
      setIsCancelling(false);

      if (onRefresh) {
        onRefresh();
      }

      // console.log("Interview cancelled successfully");
    } catch (error) {
      setIsCancelling(false);
      console.error("Failed to cancel interview:", error);
      throw error;
    }
  };

  const handleJoinMeeting = (meetingLink: string) => {
    try {
      const { protocol } = new URL(meetingLink);
      if (["https:", "http:"].includes(protocol)) {
        window.open(meetingLink, "_blank", "noopener,noreferrer");
      }
    } catch {
      // invalid or empty URL — do nothing
    }
  };

  const getWorkflowStatusBadge = (interview: Interview) => {
    const workflowStatus = getWorkflowStatus(interview);

    switch (workflowStatus) {
      case "upcoming":
        return (
          <Badge
            appearance="tint"
            size="small"
            color="brand"
            style={{ padding: "15px 12px", fontSize: "smaller" }}
          >
            Upcoming
          </Badge>
        );
      case "awaiting_feedback":
        return (
          <Badge
            appearance="tint"
            size="small"
            color="warning"
            style={{ padding: "15px 12px", fontSize: "smaller" }}
          >
            Awaiting Feedback
          </Badge>
        );
      case "completed":
        return (
          <Badge
            appearance="tint"
            size="small"
            color="success"
            style={{ padding: "15px 12px", fontSize: "smaller" }}
          >
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            appearance="tint"
            size="small"
            color="danger"
            style={{ padding: "15px 12px", fontSize: "smaller" }}
          >
            Cancelled
          </Badge>
        );
      case "rescheduled":
        return (
          <Badge
            appearance="tint"
            size="small"
            color="warning"
            style={{ padding: "15px 12px", fontSize: "smaller" }}
          >
            Rescheduled
          </Badge>
        );
      default:
        return (
          <Badge
            appearance="tint"
            size="small"
            style={{ padding: "15px 12px", fontSize: "smaller" }}
          >
            {interview.Status}
          </Badge>
        );
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "virtual":
        return <Video16Regular />;
      case "in-person":
        return <Person16Regular />;
      case "phone":
        return <Phone16Regular />;
      default:
        return <Person16Regular />;
    }
  };

  const handleJobPosting = (id: string) => {
    setJDOverview(id);
  };

  const handleSortChange = (column: string) => {
    setSortConfig((prev) => ({
      key: column,
      direction:
        prev.key === column && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handlePageChange = (page: number) => {
    if (onServerPageChange) {
      onServerPageChange(page);
    } else {
      setPagination((prev) => ({ ...prev, currentPage: page }));
    }
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    if (onServerPageSizeChange) {
      onServerPageSizeChange(itemsPerPage);
    } else {
      setPagination((prev) => ({
        ...prev,
        pageSize: itemsPerPage,
        currentPage: 1,
      }));
    }
  };

  useEffect(() => {
  if (serverPagination) return;
  setPagination((prev) => ({
    ...prev,
    totalCount: paginatedInterviews.totalCount,
    totalPages: paginatedInterviews.totalPages,
    currentPage:
      prev.currentPage > paginatedInterviews.totalPages ? 1 : prev.currentPage,
  }));
}, [paginatedInterviews.totalCount, paginatedInterviews.totalPages, serverPagination]);


// console.log("paginatedData",paginatedInterviews)


  return (
    <FluentProvider
      style={{ background: "transparent" }}
      className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white"
    >
      <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white">
        <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex flex-col gap-4">
          <div className="grid grid-cols-12 gap-2">
            <div className="flex col-span-5 xs:col-span-12">
              <Input
                placeholder="Search applicants, roles, departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                contentAfter={<SearchRegular />}
                className="!w-full !max-w-full !min-w-0 "
              />
            </div>
            <div className="col-span-1"></div>
            <FluentProvider className="grid grid-cols-5  col-span-6 xs:col-span-12 gap-2">
              <Dropdown
                placeholder="All Status"
                 value={filterStatus === "all" ? undefined : filterStatus}
                selectedOptions={[filterStatus]}
                onOptionSelect={(_, data) => {
                  const newStatus = data.optionValue || "all";
                  setFilterStatus(newStatus);
                  if (onStatusFilterChange) {
                    onStatusFilterChange(newStatus);
                  }
                }}
                className="col-span-2 w-full !max-w-full !min-w-0 "
              >
                <Option value="all">All Status</Option>
                <Option value="scheduled">Scheduled</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
                <Option value="rescheduled">Rescheduled</Option>
              </Dropdown>

           {/* <Dropdown
  placeholder="Interview Types"
  value={typeFilter === "all" ? undefined : typeFilter}
  selectedOptions={typeFilter === "all" ? [] : [typeFilter]}
  onOptionSelect={(_, data) =>
    setTypeFilter(data.optionValue || "all")
  }
  className="col-span-2 w-full !max-w-full !min-w-0 "
>
  <Option value="all">All Types</Option>
  <Option value="virtual">Virtual</Option>
  <Option value="phone">Phone</Option>
  <Option value="in-person">In-Person</Option>
</Dropdown> */}

              <Button
                appearance="subtle"
                icon={<FilterRegular />}
                className="col-span-1 !text-red-500 disabled:!text-gray-400 "
                onClick={handleClearFilters}
                disabled={
                  searchTerm === "" &&
                  statusFilter === "all" &&
                  typeFilter === "all" &&
                  filterStatus === "all"
                }
              >
                Clear
              </Button>
            </FluentProvider>
          </div>

          <Table aria-label="Interview schedule table" className="w-full">
            <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
              <TableRow className="border-b-2 border-gray-100">
                <TableHeaderCell
                  onClick={() => handleSortChange("name")}
                  className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-2 px-6"
                >
                  <div className="flex items-center gap-2">
                    <Body1Strong style={{fontSize:"12px"}}>Applicant</Body1Strong>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                        ))}
                    </div>
                  </div>
                </TableHeaderCell>

                <TableHeaderCell
                  onClick={() => handleSortChange("role")}
                  className="cursor-pointer min-w-[200px] group"
                >
                  <div className="flex items-center gap-2">
                    <Body1Strong style={{fontSize:"12px"}}>Job Role</Body1Strong>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig.key === "role" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                        ))}
                    </div>
                  </div>
                </TableHeaderCell>

                <TableHeaderCell
                  onClick={() => handleSortChange("date")}
                  className="cursor-pointer min-w-[180px] group"
                >
                  <div className="flex items-center gap-2">
                    <Body1Strong style={{fontSize:"12px"}}>Date & Time</Body1Strong>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig.key === "date" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                        ))}
                    </div>
                  </div>
                </TableHeaderCell>

                <TableHeaderCell className="min-w-[200px]">
                  <Body1Strong style={{fontSize:"12px"}}>Interviewers</Body1Strong>
                </TableHeaderCell>

                <TableHeaderCell className="min-w-[150px]">
                  <Body1Strong style={{fontSize:"12px"}}>Location</Body1Strong>
                </TableHeaderCell>

                <TableHeaderCell
                  onClick={() => handleSortChange("status")}
                  className="cursor-pointer min-w-[120px] group"
                >
                  <div className="flex items-center gap-2">
                    <Body1Strong style={{fontSize:"12px"}}>Status</Body1Strong>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig.key === "status" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                        ))}
                    </div>
                  </div>
                </TableHeaderCell>

                <TableHeaderCell className="min-w-[180px]">
                  <Body1Strong style={{fontSize:"12px"}}>Actions</Body1Strong>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <Spinner />
                      <Text className="mt-3 text-gray-500">Loading interviews...</Text>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInterviews.pageData.map((interview: any) => (
                <TableRow
                  key={interview.ID}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onSelectInterview(interview)}
                >
                  {/* Applicant Cell */}
                  <TableCell style={{ padding: "15px 5px" }}>
                    <div
                      className="flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(interview);
                      }}
                    >
                      <Avatar
                        name={interview.ApplicantName}
                        size={32}
                        className="flex-shrink-0"
                      />
                      <div>
                        <Text weight="medium" style={{ color: "#007ED5" }}>
                          {interview.ApplicantName}
                        </Text>
                        {/* <div className="text-xs text-gray-500">
                          {interview.ApplicantCode}
                        </div> */}
                      </div>
                    </div>
                  </TableCell>

                  {/* Job Role Cell */}
                  <TableCell style={{ padding: "15px 5px" }}>
                    <div className="space-y-1">
                      {/* <Text weight="semibold">{interview.InterviewTitle}</Text> */}
                      <div
                        className="flex items-center text-xs text-gray-600 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsJDPreviewOpen(true);
                          handleJobPosting(interview.JobPostingID);
                        }}
                      >
                        {/* <BriefcaseRegular className="w-3 h-3 mr-1" /> */}
                        <span style={{fontSize:"14px"}} className="text-[#1F2937] font-semibold text-sm">
                          {interview.JobRole}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-gray-600">
                        {/* <BuildingRegular className="w-3 h-3 mr-1" /> */}
                        <span className="text-[#9DA3AA]">
                          {interview.Department}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Date & Time Cell */}
                  <TableCell style={{ padding: "15px 5px" }}>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center bg-[#DEEEFA] rounded-[5px] p-[8px]">
                        <CalendarDateRegular className="w-5 h-5 text-[#0078D4]" />
                      </div>
                      <Text className="!text-xs">
                        {formatDateTime(interview.ScheduledDateTime).date} |{" "}
                        <Caption1 className="!text-xs">
                          {formatDateTime(interview.ScheduledDateTime).time}
                        </Caption1>
                      </Text>
                    </div>

                    {/* <div className="flex items-center text-xs text-gray-600">
                        <Clock20Regular className="w-3 h-3 mr-1" />
                        <span>{interview.Duration} minutes</span>
                      </div> */}
                  </TableCell>

                  {/* Enhanced Interviewers Cell */}
                  <TableCell style={{ padding: "15px 5px" }}>
                    {interview.interviewers &&
                      interview.interviewers.length > 0 && (
                        <div className="flex items-center gap-3">
                          {(() => {
                            // Extract display names for avatars
                            const interviewerNames = interview.interviewers.map(
                              (i: {
                                id: string;
                                displayName: string;
                                email: string;
                              }) => i.displayName
                            );

                            const {
                              inlineItems,
                              overflowItems,
                            }: any = partitionAvatarGroupItems({
                              items: interviewerNames,
                              layout: "stack",
                            });

                            return (
                              <FluentProvider className="!bg-transparent">
                                <div className="flex flex-col gap-2 text-xs">
                                  <div>
                                    <Badge
                                      appearance="tint"
                                      size="small"
                                      color="brand"
                                      style={{
                                        padding: "15px 12px",
                                        fontSize: "smaller",
                                      }}
                                    >
                                      {interview.PipelineStage}
                                    </Badge>
                                  </div>
                                  <AvatarGroup
                                    size={24}
                                    layout="stack"
                                    key="interviewers"
                                  >
                                    {inlineItems.map((name: string) => (
                                      <AvatarGroupItem name={name} key={name} />
                                    ))}
                                    {overflowItems && (
                                      <AvatarGroupPopover>
                                        {overflowItems.map((name: string) => (
                                          <AvatarGroupItem
                                            name={name}
                                            key={name}
                                          />
                                        ))}
                                      </AvatarGroupPopover>
                                    )}
                                  </AvatarGroup>
                                </div>
                              </FluentProvider>
                            );
                          })()}
                        </div>
                      )}
                  </TableCell>

                  {/* Location Cell */}
                  <TableCell style={{ padding: "15px 5px" }}>
                    <div className="space-y-1">
                      {/* <div className="flex items-center text-xs text-gray-600">
                        <div
                          className={`mr-1 ${getInterviewTypeIcon(interview.InterviewType)
                            ? "text-blue-500"
                            : ""
                            }`}
                        >
                          {getInterviewTypeIcon(interview.InterviewType)}
                        </div>
                        <span>{interview.InterviewType}</span>
                      </div> */}
                      {interview.Location && (
                        <div className="flex items-center text-xs text-gray-600">
                          <BuildingRegular className="w-6 h-6 mr-1" />
                          <span>{interview.Location}</span>
                        </div>
                      )}
                      {interview.MeetingLink && (
                        <div
                          className="flex items-center text-xs text-blue-600 hover:underline cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinMeeting(interview.MeetingLink || "");
                          }}
                        >
                          <Video20Regular className="w-6 h-6 mr-1" />
                          <span>Join Meeting</span>
                        </div>
                      )}
                    </div>
                  </TableCell>

                  {/* Status Cell */}
                  <TableCell style={{ padding: "15px 5px" }}>
                    {getWorkflowStatusBadge(interview)}
                  </TableCell>

                  {/* Actions Cell */}
                  <TableCell className="py-3">
                    {shouldShowPreviewFeedbackButton(interview) && (
                              <Button
                                appearance="subtle"
                                style={{ color: "#0078D4" }}
                                size="small"
                                icon={<PersonFeedbackRegular color="#0078D4" />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewFeedback(interview);
                                }}
                              >
                                Preview
                              </Button>
                            )}

                    {(shouldShowFeedbackButton(interview)||(shouldShowRescheduleButtons(interview)&&currentUser?.calendarId !== null)) 
                    &&(
                    <FluentProvider className="!bg-transparent">
                    <Menu>
                      <MenuTrigger  >
                        <MenuButton
                          style={{ borderRadius: "30px", border: "1px solid #E5E7EB" ,alignItems:"center"}} 
                          size="small"
                          menuIcon={<div className="flex justify-center items-center"><ChevronDownRegular /></div>}
                        >
                          <Subtitle1 className="!text-xs !font-medium !text-[#374151]">Action</Subtitle1>
                          </MenuButton>
                      </MenuTrigger>
                      <MenuPopover>
                        <MenuList>
                            {shouldShowFeedbackButton(interview) && (
                              <MenuItem>
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<PersonFeedbackRegular />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddFeedback(interview);
                                }}
                              >
                                Add Feedback
                              </Button>
                            </MenuItem>
                            )}

                            {shouldShowRescheduleButtons(interview) && (
                              <>
                                {currentUser?.calendarId == null ? (
                                  <></>
                                ) : (
                                  
                                  <>
                                  <MenuItem>
                                    <Button
                                      appearance="subtle"
                                      size="small"
                                      icon={<ArrowCounterclockwise20Regular />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReschedule(interview);
                                      }}
                                      disabled={isRescheduling}
                                    >
                                      Reschedule
                                    </Button>
                                    </MenuItem>
                                    <MenuItem>
                                    <Button
                                      appearance="subtle"
                                      size="small"
                                      style={{ color: "#DC2626" }}
                                      icon={
                                        <DismissCircle20Regular color="#DC2626" />
                                      }
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCancel(interview);
                                      }}
                                      disabled={isCancelling}
                                    >
                                      Cancel
                                    </Button>
                                </MenuItem>
                                  </>
                                )}
                              </>
                            )}
                          
                        </MenuList>
                      </MenuPopover>
                    </Menu>
                    </FluentProvider>
                    )
                    }

                  </TableCell>
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </div>

        {/* Empty state */}
        {!isLoading && paginatedInterviews.pageData.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center bg-gradient-to-br from-gray-50 to-white">
            <div className="bg-gray-100 rounded-full p-6 mb-6">
              <PersonRegular className="w-16 h-16 text-gray-400" />
            </div>
            <Subtitle2 className="mb-3 text-gray-700 font-semibold">
              No Interviews or Applicant found
            </Subtitle2>
            <div className="flex flex-col items-center justify-center text-center">
              <div className="text-gray-500 max-w-md leading-relaxed mb-4">
                {paginatedInterviews.pageData
                  ? "Try adjusting your filters or search terms to discover more details."
                  : "No Interviews Scheduled yet."}
              </div>
            </div>
            {paginatedInterviews.pageData && (
              <Button
                appearance="outline"
                className="hover:bg-blue-50 hover:border-blue-300 transition-colors !mt-2"
                onClick={handleClearFilters}
              >
                Clear all filters
              </Button>
            )}
          </div>
        )}

        {/* Pagination - Using CustomPagination component */}
        {paginatedInterviews.pageData.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-100 px-2">
            <div className="flex flex-row  items-center justify-between">
              <div className="flex items-center gap-6">
                <Caption1 className="text-gray-600 font-medium">
                  Showing {paginatedInterviews.pageData.length} of{" "}
                  {serverPagination ? serverPagination.total : interviews.length}{" "}
                  requests
                </Caption1>
              </div>

              {/* Custom Pagination Component */}
              <CustomPagination
                currentPage={serverPagination ? serverPagination.page : pagination.currentPage}
                totalPages={serverPagination ? serverPagination.totalPages : pagination.totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={serverPagination ? serverPagination.pageSize : pagination.pageSize}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Feedback Form Modal */}
      {showFeedbackForm && selectedInterview && (
        <FeedbackForm
          interview={selectedInterview}
          onClose={handleCloseFeedback}
          onSubmit={handleFeedbackSubmit}
          onGenerateShareLink={generateShareableLink}
        />
      )}

      {/* Feedback Preview Drawer */}
      <OverlayDrawer
        open={showPreviewDrawer}
        onOpenChange={(_, { open }) => setShowPreviewDrawer(open)}
        position="end"
        size="large"
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<DismissRegular />}
                onClick={() => setShowPreviewDrawer(false)}
              />
            }
          >
            Interview Feedback Preview
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody>
          {previewInterview && (
            <FeedbackPreviewDialog interview={previewInterview} />
          )}
        </DrawerBody>
      </OverlayDrawer>

      {/* Reschedule Interview Dialog */}
      {isRescheduleOpen && selectedInterviewForReschedule && (
        <FluentProvider style={{ background: "transparent" }}>
          <RescheduleDialog
            isOpen={isRescheduleOpen}
            onOpenChange={setIsRescheduleOpen}
            interview={rescheduleInterviewData}
            applicant={rescheduleApplicantData}
            onRescheduleSuccess={handleRescheduleSuccess}
            stages={stages}
          />
        </FluentProvider>
      )}

      {/* Cancel Interview Dialog */}
      {isCancelOpen && selectedInterviewForCancel && (
        <CancelInterviewDialog
          isOpen={isCancelOpen}
          onOpenChange={setIsCancelOpen}
          interview={{
            interviewId: selectedInterviewForCancel.ID,
            title: selectedInterviewForCancel.InterviewTitle,
            scheduledDateTime: selectedInterviewForCancel.ScheduledDateTime,
            interviewers: selectedInterviewForCancel.interviewers || [],
          }}
          applicant={{
            ID: selectedInterviewForCancel.ApplicantID,
            firstName:
              selectedInterviewForCancel.ApplicantName.split(" ")[0] || "",
            lastName:
              selectedInterviewForCancel.ApplicantName.split(" ")
                .slice(1)
                .join(" ") || "",
            email: selectedInterviewForCancel.ApplicantEmail,
          }}
          onCancelSuccess={handleCancelSuccess}
          isLoading={isCancelling}
        />
      )}

      <FluentProvider style={{ background: "transparent" }}>
        <OverlayDrawer
          open={isDrawerOpen}
          onOpenChange={(_, { open }) => setIsDrawerOpen(open)}
          position="end"
          size="large"
        >
          <DrawerHeader>
            <DrawerHeaderTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="Close"
                  icon={<DismissRegular />}
                  onClick={() => setIsDrawerOpen(false)}
                />
              }
            >
              {/* <span>
                {selectedApplicant?.ApplicantName} (
                {selectedApplicant?.ApplicantCode})
              </span> */}
              <div className="flex justify-center items-center gap-[10px]">
                <Avatar
                  name={selectedApplicant?.ApplicantName}
                  // size={32}
                  style={{ height: "40px", width: "40px" }}
                  className="flex-shrink-0"
                />
                <div>
                  <Text
                    weight="semibold"
                    style={{ color: "#111827", fontSize: "large" }}
                  >
                    {selectedApplicant?.ApplicantName}
                  </Text>
                  <div className="text-xs text-gray-500">
                    {selectedApplicant?.ApplicantCode}
                  </div>
                </div>
              </div>
            </DrawerHeaderTitle>
          </DrawerHeader>

          <DrawerBody style={{ paddingTop: "10px" }}>
            {selectedApplicant && (
              <ApplicantDrawer
                applicant={selectedApplicant}
                jobId=""
                showlifecycle={showFeedBack}
              />
            )}
          </DrawerBody>
        </OverlayDrawer>

        <OverlayDrawer
          open={isJDPreviewOpen}
          onOpenChange={(_, { open }) => setIsJDPreviewOpen(open)}
          position="end"
          size="large"
        >
          <DrawerHeader>
            <DrawerHeaderTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="Close"
                  icon={<DismissRegular />}
                  onClick={() => setIsJDPreviewOpen(false)}
                />
              }
            >
              Job Description
            </DrawerHeaderTitle>
          </DrawerHeader>

          <DrawerBody>
            {jdData && <PreviewJDForm id={jdData} isNeedControls={false} />}
          </DrawerBody>
        </OverlayDrawer>
      </FluentProvider>
    </FluentProvider>
  );
}
