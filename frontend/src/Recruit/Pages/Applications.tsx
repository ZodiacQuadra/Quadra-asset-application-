import {
  CalendarLtr20Regular,
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
  Alert20Regular,
  ArrowCounterclockwise20Regular,
  SearchRegular,
  FilterRegular,
  ChevronUpRegular,
  ChevronDownRegular,
  EyeRegular,
  MoreHorizontal20Regular,
  PersonRegular,
  ArrowClockwiseRegular,
  DocumentRegular,
  MailRegular,
  PhoneRegular,
  ClockRegular,
  CommentRegular,
  ArrowDownloadRegular,
  CheckmarkRegular,
  DismissRegular,
  Dismiss24Regular,
  DocumentPdf24Regular,
  CalendarRegular,
} from "@fluentui/react-icons";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell,
  Spinner,
  Text,
  Button,
  Subtitle2,
  Caption1,
  Card,
  Badge,
  Body1Strong,
  Tooltip,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerHeaderNavigation,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Textarea,
  Label,
  Divider,
  Avatar,
  Body1,
  Caption2,
  Title3,
  makeStyles,
  tokens,
  shorthands,
  DrawerFooter,
  Persona,
  ProgressBar,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  useToastController,
  useId,
  MessageBar,
  MessageBarBody,
  SearchBox,
  Dropdown,
  Option,
  FluentProvider,
} from "@fluentui/react-components";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getApplicationsByJobId,
  getApplicationById,
  reviewApplication,
  downloadResume,
  getJobById,
} from "../../../Public_src/Services/JobApplications";
import { useAuth } from "../../Auth/AuthProvider";
import { AzureAIService } from "../../Services/AzureAIService";
import { AzureBlobService } from "../../Services/AzureBlobService";
import { createApplicant } from "../../Services/Resume";
import { ResumeMetadata } from "../../Types/resume";
import ResumeForm from "../Components/ResumeForm";
import CustomPagination from "../Components/CustomPagination"; // Import the CustomPagination component
import React from "react";
import { getJDRequestById } from "../../Services/JDRequests";

interface Application {
  ID: string;
  JobID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  PhoneNumber: string;
  ResumeFileName: string;
  ResumeFilePath: string;
  Status: string;
  CreatedDate: string;
  ModifiedDate: string;
  ResumeDownloadUrl: string | null;
  Comments?:string,
  reviewer?: {
    id: string;
    displayName: string;
    email: string;
  };
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
  workExperience: number;
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
}

interface ApplicationDetails {
  application: Application & {
    createdBy?: {
      id: string;
      displayName: string;
      email: string;
    };
    modifiedBy?: {
      id: string;
      displayName: string;
      email: string;
    };
  };
  reviews: Array<{
    ID: string;
    ReviewStatus: string;
    Comments: string;
    ReviewDate: string;
    reviewer?: {
      id: string;
      displayName: string;
      email: string;
    };
  }>;
}

interface JobDetails {
  id: string;
  title: string;
  department: string;
  location: string;
  jobNature: string;
  status: string;
}

interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  underReview: number;
}

type StatusType = "all" | "pending" | "approved" | "rejected" | "under review";

const useStyles = makeStyles({
  drawer: {
    width: "700px",
  },
  drawerContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  reviewCard: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
  },
  timeline: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  timelineItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
  },
  uploadedFile: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    ...shorthands.padding("12px"),
    ...shorthands.border("1px", "solid", "#e5e7eb"),
    ...shorthands.borderRadius("6px"),
    backgroundColor: "#f9fafb",
    marginTop: "4px",
    width: "fit-content",
  },
  fileIcon: {
    color: "#dc2626",
  },
  fileName: {
    flex: 1,
    fontSize: "14px",
    color: "#374151",
  },
  removeFileButton: {
    color: "#6b7280",
    cursor: "pointer",
    ":hover": {
      color: "#374151",
    },
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalL,
    ...shorthands.padding(tokens.spacingVerticalXXL),
    background: `linear-gradient(145deg, ${tokens.colorNeutralBackground1} 0%, ${tokens.colorNeutralBackground2} 100%)`,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: `inset ${tokens.colorNeutralShadowAmbient}`,
  },
  processingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalL),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.margin(tokens.spacingVerticalM, "0", "0", "0"),
  },
  messageBarEnhanced: {
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    boxShadow: tokens.shadow8,
    ...shorthands.border("1px", "solid", tokens.colorTransparentStroke),
  },
});

const NoApplicationsState = ({ statusFilter }: { statusFilter: string }) => {
  const getMainMessage = (status: string) => {
    const labelMap: Record<string, string> = {
      pending: "No pending applications",
      approved: "No approved applications",
      rejected: "No rejected applications",
      "under review": "No applications under review",
      all: "No applications found",
    };
    return labelMap[status] ?? "No records found";
  };

  const getSubMessage = (status: string) => {
    const messages: Record<string, string> = {
      pending: "New applications will appear here.",
      approved: "Approved applications will be shown here.",
      rejected: "Rejected applications are displayed here.",
      "under review": "Applications being reviewed will appear here.",
      all: "No applications have been submitted for this job yet.",
    };
    return messages[status] || "No available records.";
  };

  return (
    <div className="text-center py-20 flex flex-col items-center bg-gradient-to-b from-gray-50 to-white">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
        <DocumentRegular
          style={{ fontSize: "40px" }}
          className="text-blue-600"
        />
      </div>
      <Text size={500} weight="semibold" className="mb-3 text-gray-700">
        {getMainMessage(statusFilter)}
      </Text>
      <Text
        size={300}
        className="text-gray-500 max-w-md mx-auto leading-relaxed mb-4"
      >
        {getSubMessage(statusFilter)}
      </Text>
    </div>
  );
};

export default function ApplicationsComponent({
  jobId,
  refreshTrigger,
}: {
  jobId: string;
  refreshTrigger?: number;
}) {
  const styles = useStyles();
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const [JDData, setJDData] = useState<JDData | null>(null);
  // All data states
  const [allApplications, setAllApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<
    Application[]
  >([]);
  const [paginatedApplications, setPaginatedApplications] = useState<
    Application[]
  >([]);

  const [statusFilter, setStatusFilter] = useState<StatusType>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser, accessToken }: any = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Application;
    direction: "asc" | "desc";
  } | null>({ key: "CreatedDate", direction: "desc" });

  // Client-side pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 0,
  });

  const [applicationStats, setApplicationStats] = useState<ApplicationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    underReview: 0,
  });

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [
    selectedApplication,
    setSelectedApplication,
  ] = useState<ApplicationDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(
    null
  );
  const [reviewComments, setReviewComments] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // New states for AI processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ResumeMetadata | null>(
    null
  );
  const [processingProgress, setProcessingProgress] = useState(0);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [dataSaved, setDataSaved] = useState(false);

  const blobService = new AzureBlobService();
  const aiService = new AzureAIService();

  const canApproveRejectApplication =
    currentUser?.permissions?.recruit?.candidate_app?.approve_reject_app ===
    true;

  const canManageApplication =
    currentUser?.permissions?.recruit?.candidate_app?.manage_app === true;

  const canApproveResume = () => {
    return canApproveRejectApplication && JDData?.status === "Published";
  };

  const canViewApplications = () => {
    return canManageApplication || canApproveRejectApplication;
  };

  const handleToggleSaveExtractedData = async (
    data: ResumeMetadata
  ): Promise<boolean> => {
    if (!selectedApplication) return false;

    try {
      // Update the local state
      setExtractedData(data);
      
      showToast(
        "success",
        "Data Updated",
        "Resume data updated successfully!"
      );
      setMessage({
        type: "success",
        text: "Data updated successfully!",
      });
      setTimeout(() => setMessage(null), 3000);

      return true;
    } catch (error) {
      console.error("Update error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update data";
      showToast("error", "Update Failed", errorMessage);
      setMessage({ type: "error", text: errorMessage });
      setTimeout(() => setMessage(null), 5000);
      return false;
    }
  };

  React.useEffect(() => {
    const loadJDRequestData = async () => {
      if (!jobId) {
        setError("No JD Request ID provided");

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
            workExperience: data.WorkExperience || 0,
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
          };

          setJDData(formattedData);
        } else {
          setError("Failed to load JD request data");
        }
      } catch (error) {
        console.error("Error loading JD request:", error);
        setError("Failed to load JD request data");
      }
    };

    loadJDRequestData();
  }, [jobId]);

  const showToast = (
    type: "success" | "error",
    title: string,
    message: string
  ) => {
    dispatchToast(
      <Toast>
        <ToastTitle
          media={
            type === "success" ? (
              <CheckmarkCircle20Regular />
            ) : (
              <Alert20Regular />
            )
          }
        >
          {title}
        </ToastTitle>
        <ToastBody subtitle={message} />
      </Toast>,
      { intent: type, timeout: type === "error" ? 8000 : 4000 }
    );
  };

  const processResumeWithAI = async (application: Application) => {
    if (!application.ResumeFilePath) {
      showToast(
        "error",
        "No Resume",
        "No resume file found for this application."
      );
      return;
    }

    if (!canApproveResume()) {
      showToast(
        "error",
        "Permission Denied",
        "You don't have permission to process resumes with AI"
      );
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setMessage({ type: "success", text: "Starting AI processing..." });

    try {
      // Step 1: Extract resume data using Azure AI
      setProcessingProgress(20);
      setMessage({ type: "success", text: "Extracting data with Azure AI..." });

      const extractedData = await aiService.extractResumeData(
        application.ResumeFilePath,
        application.ResumeFileName,
        accessToken
      );

      // Step 2: Validate and enhance extracted data
      setProcessingProgress(60);
      setMessage({ type: "success", text: "Validating extracted data..." });

      const validatedData = await aiService.validateResumeData(
        extractedData,
        accessToken
      );
      // console.log("Validated Data:", validatedData);

      // Step 3: Prepare final data
      setProcessingProgress(80);
      setMessage({ type: "success", text: "Preparing data for review..." });

      const finalData: ResumeMetadata = {
        ...validatedData,
        // Override with application data if available
        firstName: application.FirstName || validatedData.firstName,
        lastName: application.LastName || validatedData.lastName,
        email: application.Email || validatedData.email,
        phone: application.PhoneNumber || validatedData.phone,
        jobPostingId: application.JobID,
        fileName: application.ResumeFileName,
        uploadDate: new Date(application.CreatedDate),
        blobUrl: application.ResumeFilePath,
      };

      setProcessingProgress(100);
      setExtractedData(finalData);
      setMessage({
        type: "success",
        text: "AI processing completed successfully!",
      });
      showToast(
        "success",
        "Processing Complete",
        "Resume data has been extracted and validated."
      );
    } catch (error) {
      console.error("AI processing error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to process resume with AI";
      setMessage({ type: "error", text: errorMessage });
      showToast("error", "Processing Failed", errorMessage);
    } finally {
      setIsProcessing(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const [resumeHasUnsavedChanges, setResumeHasUnsavedChanges] = useState(false);

  const handleSaveTemp = (data:ResumeMetadata) =>{
    setExtractedData(data)
  }

  const handleSaveExtractedData = async (
    data: ResumeMetadata
  ) => {
    if (!selectedApplication) return false;

    try {
      setMessage({ type: "success", text: "Saving processed data..." });

      // Save to SQL database
      const result = await createApplicant({
        ...data,
        blobUrl: selectedApplication.application.ResumeFilePath,
        blobPath: selectedApplication.application.ResumeFilePath,
        createdByUserID: currentUser.userID,
      });

      if (
        result &&
        typeof result === "object" &&
        "success" in result &&
        !result.success
      ) {
        throw new Error("Failed to save resume to database");
      }

      setDataSaved(true);
      showToast(
        "success",
        "Data Saved",
        "Processed resume data saved successfully!"
      );
      setMessage({
        type: "success",
        text: "Processed data saved successfully!",
      });
      setTimeout(() => setMessage(null), 3000);

      return true;

      // setExtractedData(data)
    } catch (error) {
      console.error("Save error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save processed data";
      showToast("error", "Save Failed", errorMessage);
      setMessage({ type: "error", text: errorMessage });
      setTimeout(() => setMessage(null), 5000);
      return false;
    }
  };

  const handleApproveWithSave = async () => {
    if (!selectedApplication || !extractedData) return;

    if (!canApproveResume()) {
      showToast(
        "error",
        "Permission Denied",
        "You don't have permission to approve applications or job is not published"
      );
      return;
    }

    try {
      setSubmittingReview(true);

      //First save the extracted data
      const saveSuccess = await handleSaveExtractedData(extractedData);

      if (!saveSuccess) {
        showToast(
          "error",
          "Save Failed",
          "Failed to save extracted data. Application approval cancelled."
        );
        return;
      }

      // Then approve the application
      const reviewStatus = "Approved";
      const response = await reviewApplication(
        selectedApplication.application.ID,
        currentUser.userID,
        reviewStatus,
        reviewComments,
        accessToken
      );

      if (response.success) {
        await fetchApplications();
        setDialogOpen(false);
        setDrawerOpen(false);
        setReviewComments("");
        setReviewAction(null);
        setExtractedData(null);
        setDataSaved(false);
        showToast(
          "success",
          "Application Approved",
          "Application approved and data saved successfully"
        );
      }
    } catch (error) {
      console.error("Error approving application:", error);
      showToast(
        "error",
        "Approval Failed",
        "Failed to approve application. Please try again."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  // Load all applications once
  const fetchApplications = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      setError(null);
      const response: any = await getApplicationsByJobId(jobId, accessToken);

      if (response.success) {
        setAllApplications(response.data || []);

        const stats = {
          total: response.data.length,
          pending: response.data.filter(
            (app: Application) => app.Status.toLowerCase() === "pending"
          ).length,
          approved: response.data.filter(
            (app: Application) => app.Status.toLowerCase() === "approved"
          ).length,
          rejected: response.data.filter(
            (app: Application) => app.Status.toLowerCase() === "rejected"
          ).length,
          underReview: response.data.filter(
            (app: Application) => app.Status.toLowerCase() === "under review"
          ).length,
        };
        setApplicationStats(stats);
      } else {
        setError("Failed to fetch applications");
      }
    } catch (e) {
      setError("Something went wrong!");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Client-side filtering and sorting
  useEffect(() => {
    let filtered = [...allApplications];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((application) => {
        const searchableFields = [
          application.FirstName,
          application.LastName,
          application.Email,
          application.PhoneNumber,
          application.Status,
        ];

        return searchableFields.some(
          (field) => field && field.toString().toLowerCase().includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (application) => application.Status.toLowerCase() === statusFilter
      );
    }

    // Apply sorting
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;

        if (
          sortConfig.key === "CreatedDate" ||
          sortConfig.key === "ModifiedDate"
        ) {
          comparison =
            new Date(aValue as string).getTime() -
            new Date(bValue as string).getTime();
        } else if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.direction === "desc" ? -comparison : comparison;
      });
    }

    setFilteredApplications(filtered);

    // Update pagination info
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);

    setPagination((prev) => ({
      ...prev,
      totalCount,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }));
  }, [
    allApplications,
    searchQuery,
    statusFilter,
    sortConfig,
    pagination.pageSize,
  ]);

  // Client-side pagination
  useEffect(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginated = filteredApplications.slice(startIndex, endIndex);
    setPaginatedApplications(paginated);
  }, [filteredApplications, pagination.currentPage, pagination.pageSize]);

  // Original methods remain the same
  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchApplications();
    }
  }, [jobId, refreshTrigger]);

  useEffect(() => {
    // Reset states when drawer closes
    if (!drawerOpen) {
      setExtractedData(null);
      setDataSaved(false);
      setIsProcessing(false);
      setProcessingProgress(0);
      setMessage(null);
      setResumeHasUnsavedChanges(false);
    }
  }, [drawerOpen]);

  const fetchJobDetails = async () => {
    if (!jobId) return;

    try {
      const response = await getJobById(jobId);
      if (response.success && response.data) {
        setJobDetails(response.data);
      }
    } catch (error) {
      console.error("Error fetching job details:", error);
    }
  };

  const fetchApplicationDetails = async (applicationId: string) => {
    try {
      setLoadingDetails(true);
      const response = await getApplicationById(applicationId, accessToken);

      if (response.success && response.data) {
        setSelectedApplication(response.data);
        setDrawerOpen(true);
        // Reset processing states when opening new application
        setExtractedData(null);
        setIsProcessing(false);
        setProcessingProgress(0);
        setDataSaved(false);
      }
    } catch (error) {
      console.error("Error fetching application details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (!selectedApplication || !reviewAction) return;

    if (!canApproveRejectApplication) {
      showToast(
        "error",
        "Permission Denied",
        "You don't have permission to review applications"
      );
      return;
    }

    try {
      setSubmittingReview(true);

      const reviewStatus = reviewAction === "approve" ? "Approved" : "Rejected";
      const response = await reviewApplication(
        selectedApplication.application.ID,
        currentUser.userID,
        reviewStatus,
        reviewComments,
        accessToken
      );

      if (response.success) {
        await fetchApplications();
        setDialogOpen(false);
        setDrawerOpen(false);
        setReviewComments("");
        setReviewAction(null);
        showToast(
          "success",
          "Review Submitted",
          `Application ${reviewStatus.toLowerCase()} successfully`
        );
      }
    } catch (error) {
      console.error("Error reviewing application:", error);
      showToast(
        "error",
        "Review Failed",
        "Failed to submit review. Please try again."
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCardClick = (status: StatusType) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page when filtering
  };

  const handleSort = (key: keyof Application) => {
    setSortConfig((prevSort) => {
      if (prevSort && prevSort.key === key) {
        return {
          key,
          direction: prevSort.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeAppearance = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return { appearance: "filled" as const, color: "success" as const };
      case "pending":
        return { appearance: "filled" as const, color: "warning" as const };
      case "rejected":
        return { appearance: "filled" as const, color: "danger" as const };
      case "under review":
        return { appearance: "filled" as const, color: "informative" as const };
      default:
        return { appearance: "outline" as const, color: "subtle" as const };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Alert20Regular />;
      case "approved":
        return <CheckmarkCircle20Regular />;
      case "rejected":
        return <DismissCircle20Regular />;
      case "under review":
        return <ArrowCounterclockwise20Regular />;
      default:
        return <DocumentRegular />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "text-yellow-500";
      case "approved":
        return "text-green-500";
      case "rejected":
        return "text-red-500";
      case "under review":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const handleRefresh = () => {
    fetchApplications();
  };

  // Client-side pagination handlers
  const handlePageChange = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: page,
    }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: itemsPerPage,
      currentPage: 1, // Reset to first page when changing page size
      totalPages: Math.ceil(prev.totalCount / itemsPerPage),
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Applications...</Body1Strong>
      </div>
    );
  }

  if (!canViewApplications()) {
    return (
      <div className="flex flex-col items-center justify-center py-16 h-full">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
          <DocumentRegular
            style={{ fontSize: "40px" }}
            className="text-blue-600"
          />
        </div>
        <Text size={500} weight="semibold" className="mb-3 text-gray-700">
          No Access
        </Text>
        <Text className="text-gray-500 max-w-md mx-auto text-center leading-relaxed">
          You don't have permission to view applications. Please contact your
          administrator to request access.
        </Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <Text size={400} className="text-red-600">
            {error}
          </Text>
          <Button appearance="primary" onClick={handleRefresh}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto space-y-4">
      <Toaster toasterId={toasterId} />

      {/* Search and Filters */}
      <Card className="shadow-lg !rounded-xl border-0 overflow-hidden !bg-white">
        <div className="max-h-[600px] space-y-2 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          <div className="grid grid-cols-12 gap-2 bg-white">
            <div className="flex col-span-5 xs:col-span-12">
              <SearchBox
                placeholder="Search by name, email, phone, or status..."
                value={searchQuery}
                onChange={(_, data) => setSearchQuery(data.value)}
                className="!w-full  !max-w-full !min-w-0 "
                size="medium"
              />
            </div>
            <div className="col-span-2"></div>
            <FluentProvider className="grid grid-cols-4  col-span-5 xs:col-span-12 gap-2">
              <div className="col-span-1"></div>
              <Dropdown
                placeholder="All Statuses"
                value={statusFilter}
                selectedOptions={[statusFilter]}
                onOptionSelect={(_, data) =>
                  setStatusFilter((data.optionValue as StatusType) || "all")
                }
                className="col-span-2 w-full !max-w-full !min-w-0"
                size="medium"
              >
                <Option value="all">All Statuses</Option>
                <Option value="pending">Pending</Option>
                <Option value="approved">Approved</Option>
                <Option value="rejected">Rejected</Option>
                <Option value="under review">Under Review</Option>
              </Dropdown>

              <Button
                appearance="subtle"
                icon={<FilterRegular />}
                onClick={clearFilters}
                disabled={searchQuery === "" && statusFilter === "all"}
                className="col-span-1 !text-red-500 disabled:!text-gray-400 "
              >
                Clear
              </Button>
            </FluentProvider>
          </div>

          <Table sortable className="w-full">
            <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
              <TableRow className="border-b-2 !border-gray-100">
                <TableHeaderCell
                  className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-2 px-6"
                  onClick={() => handleSort("FirstName")}
                >
                  <div className="flex items-center gap-2">
                    <Body1Strong>Applicant</Body1Strong>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig?.key === "FirstName" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                        ))}
                    </div>
                  </div>
                </TableHeaderCell>

                <TableHeaderCell className="py-2 px-6">
                  <Body1Strong>Contact Information</Body1Strong>
                </TableHeaderCell>

                <TableHeaderCell className="py-2 px-6">
                  <Body1Strong>Reviewed By</Body1Strong>
                </TableHeaderCell>

                <TableHeaderCell
                  className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group py-2 px-6"
                  onClick={() => handleSort("Status")}
                >
                  <div className="flex items-center gap-2">
                    <Body1Strong>Status</Body1Strong>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig?.key === "Status" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                        ))}
                    </div>
                  </div>
                </TableHeaderCell>

                <TableHeaderCell
                  className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group py-2 px-6"
                  onClick={() => handleSort("CreatedDate")}
                >
                  <div className="flex items-center gap-2">
                    <Body1Strong>Applied Date</Body1Strong>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig?.key === "CreatedDate" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                        ))}
                    </div>
                  </div>
                </TableHeaderCell>

                <TableHeaderCell className="py-2 px-6">
                  <Body1Strong>Actions</Body1Strong>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedApplications.map((app, index) => (
                <TableRow
                  key={app.ID}
                  className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  }`}
                >
                  <TableCell className="!px-2 !py-2 *:truncate">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={`${app.FirstName} ${app.LastName}`}
                        size={32}
                        color="colorful"
                      />
                      <div>
                        <Text className="!font-semibold !text-[#007ED5] !text-xs">
                          {app.FirstName} {app.LastName}
                        </Text>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4 *:truncate">
                    <div className="space-y-1 ">
                      <div className="flex items-center gap-2 ">
                        {/* <MailRegular className="w-4 h-4 text-gray-400" /> */}
                        <Tooltip content={app.Email} relationship="label">
                          <Text className="truncate max-w-32 text-gray-700 hover:text-blue-600 transition-colors">
                            {app.Email.length > 15
                              ? `${app.Email.substring(0, 15)}...`
                              : app.Email}
                          </Text>
                        </Tooltip>
                      </div>
                      {/* <div className="flex items-center gap-2">
                        <PhoneRegular className="w-4 h-4 text-gray-400" />
                        <Text size={200} className="text-gray-600">
                          {app.PhoneNumber}
                        </Text>
                      </div> */}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    {(app.reviewer && (
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={`${app.reviewer.displayName}`}
                          size={32}
                          color="colorful"
                        />
                        <div>
                          <Text className="!font-semibold !text-[#007ED5] !text-xs">
                            {app.reviewer.displayName}
                          </Text>
                        </div>
                      </div>
                    )) ||
                      "-"}
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          app.Status.toLowerCase() === "approved"
                            ? "bg-green-400"
                            : app.Status.toLowerCase() === "pending"
                            ? "bg-yellow-400 animate-pulse"
                            : app.Status.toLowerCase() === "rejected"
                            ? "bg-red-400"
                            : app.Status.toLowerCase() === "under review"
                            ? "bg-blue-400"
                            : "bg-gray-400"
                        }`}
                      ></div>
                      <Badge
                        {...getStatusBadgeAppearance(app.Status)}
                        className="px-3 py-1 font-medium shadow-sm"
                      >
                        {app.Status}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CalendarRegular className="w-4 h-4 text-gray-400" />
                      <Text size={200} className="text-gray-600">
                        {formatDate(app.CreatedDate)}
                      </Text>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <div className="flex-col gap-8 transition-all duration-200">
                      <Tooltip content="View Details" relationship="label">
                        <Button
                          appearance="subtle"
                          icon={<EyeRegular />}
                          onClick={() => fetchApplicationDetails(app.ID)}
                          size="small"
                        />
                      </Tooltip>
                      &nbsp; &nbsp;&nbsp;
                      {app.ResumeFileName && (
                        <Tooltip content="Download Resume" relationship="label">
                          <Button
                            appearance="subtle"
                            icon={<ArrowDownloadRegular />}
                            size="small"
                            onClick={() => downloadResume(app.ID, accessToken)}
                          ></Button>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Enhanced Empty State */}
        {paginatedApplications.length === 0 && !loading && (
          <NoApplicationsState statusFilter={statusFilter} />
        )}

        {/* Table Footer with Stats and Pagination */}
        {paginatedApplications.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-100 px-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Caption1 className="text-gray-600 font-medium">
                  Showing{" "}
                  {filteredApplications.length > 0
                    ? (pagination.currentPage - 1) * pagination.pageSize + 1
                    : 0}{" "}
                  to{" "}
                  {Math.min(
                    pagination.currentPage * pagination.pageSize,
                    filteredApplications.length
                  )}{" "}
                  of {filteredApplications.length} filtered results
                  {filteredApplications.length !== applicationStats.total &&
                    ` (${applicationStats.total} total)`}
                </Caption1>
              </div>

              {/* Custom Pagination Component */}
              <CustomPagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={pagination.pageSize}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Enhanced Application Details Drawer */}
      <Drawer
        type="overlay"
        separator
        open={drawerOpen}
        onOpenChange={(_, { open }) => setDrawerOpen(open)}
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
                onClick={() => setDrawerOpen(false)}
              />
            }
          >
            Application Details & AI Processing
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody>
          {/* Enhanced Message Bar */}
          {message && (
            <MessageBar
              intent={message.type === "success" ? "success" : "error"}
              className={styles.messageBarEnhanced}
            >
              <MessageBarBody>
                <div className="flex items-center gap-2">{message.text}</div>
              </MessageBarBody>
            </MessageBar>
          )}

          {loadingDetails ? (
            <div className="flex flex-col items-center justify-center py-8 h-full">
              <Spinner />
              <Body1Strong className="mt-2">Loading...</Body1Strong>
            </div>
          ) : selectedApplication ? (
            <div className={styles.drawerContent}>
              {/* Applicant Information */}
              <div className={styles.section}>
                <div className="p-2">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-4">
                      <Avatar
                        name={`${selectedApplication.application.FirstName} ${selectedApplication.application.LastName}`}
                        size={56}
                        color="colorful"
                      />
                      <div>
                        <div>
                          <Text size={400} weight="semibold">
                            {selectedApplication.application.FirstName}{" "}
                            {selectedApplication.application.LastName}
                          </Text>
                        </div>
                        <Text>{selectedApplication.application.Email}</Text>
                      </div>
                    </div>
                    <div>
                      <Badge
                        {...getStatusBadgeAppearance(
                          selectedApplication.application.Status
                        )}
                        className="mt-1"
                      >
                        {selectedApplication.application.Status}
                      </Badge>
                    </div>
                  </div>

                  <Divider alignContent="start" className="py-2">
                    <Subtitle2>Personal Details</Subtitle2>
                  </Divider>

                  <div
                    className={styles.infoGrid}
                    style={{ marginTop: "16px" }}
                  >
                    <div className={styles.infoItem}>
                      <Label size="small">Phone</Label>
                      <Text>{selectedApplication.application.PhoneNumber}</Text>
                    </div>
                    <div className={styles.infoItem}>
                      <Label size="small">Applied On</Label>
                      <Text>
                        {formatDateTime(
                          selectedApplication.application.CreatedDate
                        )}
                      </Text>
                    </div>
                    <div className={styles.infoItem}>
                      <Label size="small">Last Modified</Label>
                      <Text>
                        {formatDateTime(
                          selectedApplication.application.ModifiedDate
                        )}
                      </Text>
                    </div>
                  </div>

                  <Divider alignContent="start" className="py-2 mt-4">
                    <Subtitle2>Resume & AI Processing</Subtitle2>
                  </Divider>

                  <div className="pt-4">
                    {selectedApplication.application.ResumeFileName ? (
                      <div className="space-y-4">
                        <div className={styles.uploadedFile}>
                          <DocumentPdf24Regular className={styles.fileIcon} />
                          <div className="flex flex-col">
                            <span className={styles.fileName}>
                              <a
                                href={
                                  selectedApplication.application.ResumeFilePath
                                }
                                target="_blank"
                              >
                                {selectedApplication.application.ResumeFileName}
                              </a>
                            </span>
                            <Caption2 className="text-gray-500">
                              Uploaded on{" "}
                              {formatDate(
                                selectedApplication.application.CreatedDate
                              )}
                            </Caption2>
                          </div>
                          <Button
                            appearance="subtle"
                            className={styles.removeFileButton}
                            icon={<ArrowDownloadRegular />}
                            onClick={() =>
                              downloadResume(selectedApplication.application.ID, accessToken)
                            }
                          />
                        </div>

                        {/* AI Processing Section */}
                        {canApproveResume() &&
                          selectedApplication.application.Status.toLowerCase() ===
                            "pending" &&
                          !extractedData &&
                          !isProcessing && (
                            <Card>
                              <div className="p-4 flex flex-col items-center justify-center">
                                <Text
                                  size={200}
                                  className="text-gray-600 mb-4 !block"
                                >
                                  Extract and validate resume data using Azure
                                  AI services
                                </Text>
                                <button
                                  onClick={() =>
                                    processResumeWithAI(
                                      selectedApplication.application
                                    )
                                  }
                                  disabled={isProcessing}
                                  className="group/name relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium cursor-pointer"
                                >
                                  <span
                                    className="relative px-5 py-2.5 transition-all ease-in duration-75 rounded-[30px] text-white border-none"
                                    style={{
                                      background:
                                        "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)",
                                      padding: "14px 20px",
                                    }}
                                  >
                                    <div className="text-[#ffffff]">
                                      Process Resume with AI
                                    </div>
                                  </span>
                                </button>
                              </div>
                            </Card>
                          )}

                        {/* Processing Progress */}
                        {isProcessing && (
                          <div className={styles.processingContainer}>
                            <div className="flex items-center gap-3">
                              <Spinner size="tiny" />
                              <Text size={400} weight="medium">
                                Processing with AI...
                              </Text>
                            </div>
                            <ProgressBar
                              value={processingProgress / 100}
                              className="w-full"
                            />
                            <Text size={200} className="opacity-70">
                              {processingProgress}% Complete - Extracting and
                              validating resume data
                            </Text>
                          </div>
                        )}

                        {/* Extracted Data Display (Read-only) */}
                        {extractedData && !isProcessing && (
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <Text size={400} weight="semibold">
                                AI Extracted Data
                              </Text>
                              <Badge appearance="filled" color="success">
                                Ready for Approval
                              </Badge>
                            </div>

                            <ResumeForm
                              resumeData={extractedData}
                              onSave={handleSaveExtractedData}
                              onDelete={() => setExtractedData(null)}
                              isEditing={
                                selectedApplication.application.Status.toLowerCase() ===
                                "pending"
                                  ? true
                                  : false
                              }
                              onToggleEdit={handleSaveTemp}
                              mode="career"
                              onDirtyChange={setResumeHasUnsavedChanges}
                            />
                          </div>
                        )}

                        {/* Candidate comments section */}
                        {selectedApplication.application.Comments &&
                          <>
                          <Divider alignContent="start" className="py-2">
                            <Subtitle2>Candidate Message</Subtitle2>
                          </Divider>
                          <Text  >{selectedApplication.application.Comments}</Text>
                          </>
                        }
                         
                      </div>
                    ) : (
                      <Text className="text-gray-500">No resume uploaded</Text>
                    )}
                  </div>
                </div>
              </div>

              {/* Review History */}
              {selectedApplication.reviews &&
                selectedApplication.reviews.length > 0 && (
                  <div className={styles.section}>
                    <Divider alignContent="start" className="py-2">
                      <Subtitle2>Review History</Subtitle2>
                    </Divider>
                    <div className={styles.timeline}>
                      {selectedApplication.reviews.map((review) => (
                        <Card key={review.ID} className={styles.reviewCard}>
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <Persona
                                  name={
                                    review.reviewer?.displayName || "Unknown"
                                  }
                                  secondaryText={formatDateTime(
                                    review.ReviewDate
                                  )}
                                />
                                <Badge
                                  {...getStatusBadgeAppearance(
                                    review.ReviewStatus
                                  )}
                                  size="small"
                                >
                                  {review.ReviewStatus}
                                </Badge>
                              </div>

                              {review.Comments && (
                                <div className="p-3">
                                  <div className="flex items-start gap-2">
                                    <CommentRegular className="w-4 h-4 text-gray-400 mt-0.5" />
                                    <Text size={200}>{review.Comments}</Text>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : null}
        </DrawerBody>

        {/* Enhanced Footer with AI Processing Actions */}
        {!loadingDetails && selectedApplication && (
          <DrawerFooter>
            {selectedApplication.application.Status.toLowerCase() ===
              "pending" &&
              canApproveRejectApplication && (
                <div className="flex gap-3">
                  <Dialog
                    open={dialogOpen}
                    onOpenChange={(_, data) => setDialogOpen(data.open)}
                  >
                    <Tooltip
                      content="Save resume changes before approving"
                      relationship="label"
                      visible={resumeHasUnsavedChanges ? undefined : false}
                    >
                      <span>
                        <Button
                          appearance="primary"
                          icon={<CheckmarkRegular />}
                          onClick={() => {
                            setReviewAction("approve");
                            setDialogOpen(true);
                          }}
                          disabled={!extractedData || resumeHasUnsavedChanges}
                        >
                          Approve
                        </Button>
                      </span>
                    </Tooltip>
                    <DialogSurface>
                      <DialogBody>
                        <DialogTitle>
                          {reviewAction === "approve" ? "Approve" : "Reject"}{" "}
                          Application
                        </DialogTitle>
                        <DialogContent>
                          <div className="space-y-4">
                            <div>
                              <Text>
                                Are you sure you want to {reviewAction} this
                                application from{" "}
                                <strong>
                                  {extractedData?.firstName}{" "}
                                  {extractedData?.lastName}
                                </strong>
                                ?
                              </Text>
                              {reviewAction === "approve" && extractedData && (
                                <MessageBar intent="info" className="mt-3">
                                  <MessageBarBody>
                                    The AI-extracted data will be saved to the
                                    database upon approval.
                                  </MessageBarBody>
                                </MessageBar>
                              )}
                            </div>
                            <div>
                              <Label
                                htmlFor="comments"
                                required={reviewAction === "reject"}
                              >
                                Comments{" "}
                                {reviewAction === "reject" && "(Required)"}
                              </Label>
                              <Textarea
                                id="comments"
                                placeholder={`Enter ${
                                  reviewAction === "approve"
                                    ? "optional"
                                    : "rejection reason"
                                } comments...`}
                                value={reviewComments}
                                onChange={(_, data) =>
                                  setReviewComments(data.value)
                                }
                                rows={4}
                                className="w-full mt-1"
                              />
                            </div>
                          </div>
                        </DialogContent>
                        <DialogActions>
                          <DialogTrigger disableButtonEnhancement>
                            <Button appearance="secondary">Cancel</Button>
                          </DialogTrigger>
                          <Button
                            appearance={
                              reviewAction === "approve"
                                ? "primary"
                                : "secondary"
                            }
                            icon={
                              reviewAction === "approve" ? (
                                <CheckmarkRegular />
                              ) : (
                                <DismissRegular />
                              )
                            }
                            onClick={
                              reviewAction === "approve" && extractedData
                                ? handleApproveWithSave
                                : handleReviewSubmit
                            }
                            disabled={
                              submittingReview ||
                              (reviewAction === "reject" &&
                                !reviewComments.trim()) ||
                              (reviewAction === "approve" && !extractedData)
                            }
                          >
                            {submittingReview ? (
                              <Spinner size="tiny" />
                            ) : (
                              `${
                                reviewAction === "approve"
                                  ? "Approve"
                                  : "Reject"
                              }`
                            )}
                          </Button>
                        </DialogActions>
                      </DialogBody>
                    </DialogSurface>
                  </Dialog>

                  <Button
                    appearance="secondary"
                    icon={<DismissRegular />}
                    onClick={() => {
                      setReviewAction("reject");
                      setDialogOpen(true);
                    }}
                    disabled={!canApproveRejectApplication}
                  >
                    Reject
                  </Button>

                  {!extractedData && canApproveRejectApplication && (
                    <Tooltip
                      content="Please process the resume with AI before approving"
                      relationship="label"
                    >
                      <div>
                        <Badge
                          appearance="tint"
                          color="warning"
                          className="px-3 py-2"
                        >
                          AI Processing Required
                        </Badge>
                      </div>
                    </Tooltip>
                  )}
                </div>
              )}
          </DrawerFooter>
        )}
      </Drawer>
    </div>
  );
}
