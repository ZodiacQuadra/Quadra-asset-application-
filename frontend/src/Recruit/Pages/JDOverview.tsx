import * as React from "react";
import {
  Button,
  Spinner,
  Body1Strong,
  SkeletonItem,
  useId,
  useToastController,
  Toaster,
  Toast,
  ToastTitle,
  Badge,
  Divider,
  Text,
  Subtitle2Stronger,
  Body1,
  Subtitle2,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  OverlayDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  FluentProvider,
  Persona,
  SelectTabData,
  SelectTabEvent,
  Tab,
  TabList,
  TabValue,
  Caption1,
  Tooltip,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from "@fluentui/react-components";
import {
  ArrowExportRtlRegular,
  bundleIcon,
  BuildingRegular,
  InfoRegular,
  InfoFilled,
  DeleteRegular,
  DeleteFilled,
  EditRegular,
  EditFilled,
  DismissRegular,
  LocationRegular,
  CalendarLtrRegular,
  PlanetColor,
  Planet24Color,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  People16Filled,
  PersonAccount16Filled,
  Pipeline20Filled,
  AddRegular,
  ChevronLeft24Regular,
  PersonRegular,
  CheckmarkCircleSquare20Regular,
} from "@fluentui/react-icons";
import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getJDRequestById, deleteJDRequest } from "../../Services/JDRequests";
import { getApplicantsByJobId } from "../../Services/Resume";
import { useAuth } from "../../Auth/AuthProvider";

import PreviewJDForm from "./PreviewJDForm";
import { EnhancedResumeUpload } from "./EnhancedResumeUpload";
import ApplicantsTable from "../Components/ApplicantsTable";
import DynamicInterviewPipeline from "./DynamicInterviewPipeline";
import Applications from "./Applications";

// Updated interface for form data
interface FormData {
  id: string;
  jobId: string;
  jobSequence: string;
  jobRole: string;
  jobNature: string;
  department: string;
  targetDate: Date | null | undefined;
  numPositions: number;
  minWorkExperience?: number;
  maxWorkExperience?: number;
  MinSalaryRange?: number;
  MaxSalaryRange?: number;
  salaryRange?: number;
  jobLocation: string;
  status: string;
  skills: Array<{ name: string; rating: number }>;
  jobDescription: string;
  reportingManager: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  createdBy: any;
  createdByUserID?: string;
  isActive?: boolean;
  isPublished?: boolean;
  inActiveReason?: string;
  OptionalUser?: string
  hasMaterial?: boolean
  SubordinateID?:string
}

// Skeleton components
const PreviewSkeleton = () => (
  <div className="flex flex-col items-center justify-center py-8 h-full">
    <Spinner />
    <Body1Strong className="mt-2">Loading Requests...</Body1Strong>
  </div>
);

const Preview = bundleIcon(InfoFilled, InfoRegular);
const Edit = bundleIcon(EditFilled, EditRegular);
const Delete = bundleIcon(DeleteFilled, DeleteRegular);

export default function JDOverview() {
  const [JDData, setJDData] = React.useState<FormData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string>("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // Delete functionality states
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // Preview drawer state
  const [isJDPreviewOpen, setIsJDPreviewOpen] = React.useState(false);
  const [isResumeUploadOpen, setIsResumeUploadOpen] = React.useState(false);
  const [isSubordinate, setIsSubordinate] = useState(false)

  interface ApplicantDetail {
    Status: string;
    [key: string]: any;
  }

  const [ApplicantDetails, setApplicantDetails] = React.useState<ApplicantDetail[]>([]);

  const { Id } = useParams();
  const navigate = useNavigate();
  const { currentUser, accessToken }: any = useAuth();

  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [selectedValue, setSelectedValue] = React.useState<TabValue>(
    "SubmittedResumes"
  );


  const locationCurrent = useLocation()

  React.useEffect(()=>{
    // console.log("location",locationCurrent.search.includes("management"))
    if(locationCurrent.search.includes("management")){
      setSelectedValue("InterviewPipeline")
       // Remove the search params
      // window.history.replaceState({}, '', locationCurrent.pathname)
    }
  },[])

  const onTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
    setSelectedValue(data.value);
  };

  const handleResumeUploaded = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Helper function to determine actual status
  const determineActualStatus = (data: any): string => {
    if (data.isActive === false) return "Inactive";
    if (data.isPublished === true) return "Published";
    return "Active";
  };

  // Permission checking functions
  const canViewJob = () => {
    // console.log("currentzuser", currentUser)
    return (
      currentUser?.permissions?.recruit?.job_posting?.view_job?.view_all === true
      ||
      currentUser?.permissions?.recruit?.job_posting?.view_job?.view_my === true
    );
  };

  const canViewThisJob = () => {
    const canViewAll =
      currentUser?.permissions?.recruit?.job_posting?.view_job?.view_all ===
      true;
    const canViewMy =
      currentUser?.permissions?.recruit?.job_posting?.view_job?.view_my ===
      true;
    const isCreator =
      JDData?.createdByUserID?.toLowerCase() ===
      currentUser?.userID?.toLowerCase();

    if (canViewAll) return true;
    if (canViewMy && isCreator) return true;

    return false;
  };

  const canEditJob = () => {
    const hasEditPermission =
      currentUser?.permissions?.recruit?.job_posting?.edit_job === true;
    const isCreator =
      JDData?.createdByUserID?.toLowerCase() ===
      currentUser?.userID?.toLowerCase();
    const canViewAll =
      currentUser?.permissions?.recruit?.job_posting?.view_job?.view_all ===
      true;
    const isSubordinate = JDData?.SubordinateID?.toLowerCase() ===
      currentUser?.userID?.toLowerCase();
    // console.log("isSubordinate",isSubordinate)
    // Can edit if has edit permission AND (is creator OR can view all jobs)
    return hasEditPermission && (isCreator || canViewAll) && isSubordinate === false;
  };

  const canDeleteJob = () => {
    const hasDeletePermission =
      currentUser?.permissions?.recruit?.job_posting?.delete_job === true;
    const isCreator =
      JDData?.createdByUserID?.toLowerCase() ===
      currentUser?.userID?.toLowerCase();
    const canViewAll =
      currentUser?.permissions?.recruit?.job_posting?.view_job?.view_all ===
      true;

    // Can delete if has delete permission AND (is creator OR can view all jobs) AND job status is Inactive
    return (
      hasDeletePermission &&
      (isCreator || canViewAll) &&
      JDData?.status === "Inactive"
    );
  };


  // React.useEffect(()=>{
  //   if(JDData){
  //     const isSubordinate = JDData && JDData.OptionalUser && JDData.OptionalUser?.toLowerCase() === currentUser?.userID?.toLowerCase() && JDData && JDData.OptionalUser && JDData.createdByUserID?.toLowerCase() !== currentUser?.userID?.toLowerCase()
  //     console.log("check optional permission",JDData,isSubordinate)
  //     setIsSubordinate(isSubordinate?isSubordinate:false)
  //   }
  // },[JDData])

  const canAddResume = () => {

    // console.log("isSubordinate", isSubordinate)

    return (
      currentUser?.permissions?.recruit?.candidate_app?.manage_app === true &&
      JDData?.isPublished === true // Only allow resume upload when published
      && isSubordinate === false
    );
  };

  const canViewLeadSubmission = () => {
    return (
      currentUser?.permissions?.recruit?.candidate_app?.approve_reject_app ===
      true
    );
  };

  const canViewInterviewPipeline = () => {
    return (
      currentUser?.permissions?.recruit?.interview_schedule
        ?.create_interview === true ||
      currentUser?.permissions?.recruit?.interview_schedule
        ?.modify_interview === true
    );
  };

  const canViewAllFeedback = () => {
    return (
      currentUser?.permissions?.recruit?.interview_feedback
        ?.view_all_feedback === true
    );
  };

  const canViewMyFeedback = () => {
    return (
      currentUser?.permissions?.recruit?.interview_feedback
        ?.view_my_feedback === true
    );
  };

  React.useEffect(() => {
    const fetchApplicantDetails = async () => {
      const result = await getApplicantsByJobId(Id || "");
      // console.log('applicants data', result);

      // Check if result was successful before accessing data
      if (result.success && 'data' in result) {
        setApplicantDetails(result.data);
      }
    }
    fetchApplicantDetails();
  }, [Id]) // Also add Id to the dependency array

  const handleStatusValue = () => {
    const hiredApplicants = handleCalHiredApplicants();
    const noOfPositions = JDData?.numPositions || 0;
    if (hiredApplicants >= noOfPositions) {
      return "Filled";
    } else {
      return "Open";
    }
  }

  const handleCalHiredApplicants = () => {
    const hiredApplicants = ApplicantDetails.filter(item => item.Status === 'Hired');
    return hiredApplicants.length;
  }

  const handleCalRejectApplicants = () => {
    const hiredApplicants = ApplicantDetails.filter(item => item.Status === "Rejected");
    return hiredApplicants.length;
  }

  const handleCalPendingApplicants = () => {
    const hiredApplicants = ApplicantDetails.filter(item => (item.Status !== 'Hired') && (item.Status !== "Rejected") && (item.Status !== "Offboarded"));
    return hiredApplicants.length;
  }

  React.useEffect(() => {
    const loadJDRequestData = async () => {
      if (!Id) {
        setError("No JD Request ID provided");
        setIsLoading(false);
        return;
      }

      // Check view permission first
      if (!canViewJob()) {
        // console.log("canView", canViewJob())
        setError("You don't have permission to view job requests");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const result = await getJDRequestById(Id, accessToken);

        if (result.success && result.data) {
          const data = result.data;

          // Determine the actual status based on flags
          const actualStatus = determineActualStatus(data);

          const formattedData = {
            id: data.ID,
            jobId: data.JobID || "",
            jobSequence: data.JDCode || "",
            jobRole: data.JobRole || "",
            jobNature: data.JobNature || "",
            department: data.Department || "",
            targetDate: data.TargetDate ? new Date(data.TargetDate) : null,
            numPositions: data.NumPositions || 1,
            minWorkExperience: data.MinWorkExperience || 0,
            maxWorkExperience: data.MaxWorkExperience || 1,
            MinSalaryRange: data.MinSalaryRange || 10,
            MaxSalaryRange: data.MaxSalaryRange || 20,
            salaryRange: data.SalaryRange || 10,
            jobLocation: data.JobLocation || "",
            jobDescription: data.JobDescription || "",
            status: actualStatus,
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
            createdBy: data.createdBy,
            createdByUserID: data.CreatedByUserID || data.createdBy?.userID,
            isActive: data.isActive ?? true,
            isPublished: data.isPublished ?? false,
            inActiveReason: data.InActiveReason || "",
            hasMaterial: data.HasMaterial || false

          };

          setJDData(formattedData);

          // After setting JDData, check if user can view this specific job
          const isHR = (data.InterviewerID)?.toLowerCase() === currentUser?.userID?.toLowerCase(); // New check for assigned HR
          const isCreator =
            (data.CreatedByUserID || data.createdBy?.userID)?.toLowerCase() ===
            currentUser?.userID?.toLowerCase();
          const canViewAll =
            currentUser?.permissions?.recruit?.job_posting?.view_job
              ?.view_all === true;
          const canViewMy =
            currentUser?.permissions?.recruit?.job_posting?.view_job
              ?.view_my === true;

          const isSubordinate = data.SubordinateID && data.SubordinateID?.toLowerCase() === currentUser?.userID?.toLowerCase() && isCreator === false

          // console.log("isSubordinate", isSubordinate)

          setIsSubordinate(isSubordinate ? isSubordinate : false)

          if (!canViewAll && !((canViewMy && (isCreator || isHR)) || (canViewMy && isSubordinate))) {
            setError("You don't have permission to view this job request");
            setJDData(null);
            return;
          }
        } else {
          setError("Failed to load JD request data");
        }
      } catch (error) {
        console.error("Error loading JD request:", error);
        setError("Failed to load JD request data");
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to load JD request data</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadJDRequestData();
  }, [Id, dispatchToast, currentUser]);

  // Delete JD request function
  const handleDelete = async () => {
    if (!Id || !currentUser) return;

    // Check if status is Inactive
    if (JDData?.status !== "Inactive") {
      dispatchToast(
        <Toast>
          <ToastTitle>JD request must be inactive before deletion</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      setShowDeleteDialog(false);
      return;
    }

    setIsDeleting(true);

    try {
      // console.log("Deleting JD request", Id);
      await deleteJDRequest(Id, true, currentUser.userID, accessToken);

      dispatchToast(
        <Toast>
          <ToastTitle>JD Request deleted successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );

      setShowDeleteDialog(false);

      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error deleting JD request:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to delete JD request</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }

    setIsDeleting(false);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    setShowDeleteDialog(true);
  };

  // Handle preview
  const handlePreview = () => {
    setIsJDPreviewOpen(true);
  };

  const formatDate = (date: Date | null | undefined): string => {
    if (!date) return "Not specified";
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Updated helper function to get status badge appearance
  const getStatusBadgeAppearance = (status: string) => {
    switch (status) {
      case "Active":
        return { appearance: "filled" as const, color: "success" as const };
      case "Inactive":
        return { appearance: "filled" as const, color: "warning" as const };
      case "Published":
        return { appearance: "filled" as const, color: "brand" as const };
      default:
        return {
          appearance: "outline" as const,
          color: "informative" as const,
        };
    }
  };

  if (isLoading) {
    return (
      <>
        <PreviewSkeleton />
      </>
    );
  }

  const handleSaveComplete = (savedResumes: any[]) => {
    // console.log("Saved resumes:", savedResumes);

    // Close the resume upload drawer
    setIsResumeUploadOpen(false);
    handleResumeUploaded();
    // Show success toast
    dispatchToast(
      <Toast>
        <ToastTitle>
          {savedResumes.length === 1
            ? "Resume uploaded successfully"
            : `${savedResumes.length} resumes uploaded successfully`}
        </ToastTitle>
      </Toast>,
      { intent: "success" }
    );
  };

  // Add this helper function after your other helper functions
  const calculateDaysFromTarget = (targetDate: Date | null | undefined): string => {
    if (!targetDate) return "Not specified";

    const today = new Date();
    const target = new Date(targetDate);

    // Reset time parts to compare only dates
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return diffDays.toString();
  };

  // Helper function to get status text based on days difference
  const getTargetDateStatusText = (targetDate: Date | null | undefined): string => {
    if (!targetDate) return "Not specified";

    const daysDiff = calculateDaysFromTarget(targetDate);

    if (daysDiff === "Not specified") return daysDiff;

    const diffNum = parseInt(daysDiff);

    if (diffNum > 0) {
      return `${diffNum} day${diffNum !== 1 ? 's' : ''} Left`;
    } else if (diffNum === 0) {
      return "Target date is today";
    } else {
      return `Overdue By ${Math.abs(diffNum)} day${Math.abs(diffNum) !== 1 ? 's' : ''}`;
    }
  };

  // Helper function to get color based on days difference
  const getTargetDateColor = (targetDate: Date | null | undefined): string => {
    if (!targetDate) return "text-gray-600";

    const daysDiff = calculateDaysFromTarget(targetDate);

    if (daysDiff === "Not specified") return "text-gray-600";

    const diffNum = parseInt(daysDiff);

    if (diffNum > 7) {
      return "text-green-600"; // Far future (more than 7 days)
    } else if (diffNum > 0) {
      return "text-yellow-600"; // Near future (1-7 days)
    } else if (diffNum === 0) {
      return "text-orange-600"; // Today
    } else {
      return "text-red-600"; // Past date
    }
  };

  if (error || !JDData) {
    return (
      <div className="mx-auto max-w-2xl">
        <Divider alignContent="start">Error</Divider>
        <div className="p-4 text-center">
          <Subtitle2Stronger className="text-red-600 mb-2">
            Error
          </Subtitle2Stronger>
          <Body1>{error || "JD Request not found"}</Body1>
          <div className="mt-4">
            <Button
              appearance="primary"
              onClick={() => navigate("/dashboard")}
              icon={<ArrowExportRtlRegular />}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusBadgeProps = getStatusBadgeAppearance(JDData.status);

  return (
    <div  className="mx-auto space-y-2 overflow-auto">
      {/* Header Section */}
      <div>
        {/* Header with Job Title and Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              role="button"
              className=" bg-transparent rounded-lg flex items-center justify-center cursor-pointer"
              onClick={() => navigate("/recruit")}
            >
              <span className="text-[#063762] text-sm font-medium">
                <ChevronLeft24Regular />
              </span>
            </div>
            <div className="flex flex-row items-center justify-center gap-3">
              <h1 className="text-xl font-semibold text-[#063762] first-letter:capitalize !p-0 !m-0">
                {JDData.jobRole}
              </h1>
              <Badge {...statusBadgeProps} size="large">
                {JDData.status}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {Id && canEditJob() && (
              <>
                <Button
                  appearance="secondary"
                  style={{
                    backgroundColor: "#FFFFFF4F",
                    border: "1px solid #fff",
                    fontWeight: 500,
                  }}
                  onClick={() => navigate(`/recruit/editJD/${Id}`)}
                  icon={<Edit className="w-4 h-4 text-[#0078D4]" />}
                />
                {canDeleteJob() && (
                  <Tooltip
                    content={
                      JDData.status !== "Inactive"
                        ? "Can only delete when status is Inactive"
                        : "Delete job request"
                    }
                    relationship="label"
                  >
                    <Button
                      appearance="secondary"
                      onClick={handleDeleteConfirm}
                      disabled={isDeleting || JDData.status !== "Inactive"}
                      style={{
                        backgroundColor: "#FFFFFF4F",
                        border: "1px solid #fff",
                        fontWeight: 500,
                      }}
                      icon={<Delete className="w-4 h-4 text-red-600" />}
                    />
                  </Tooltip>
                )}
              </>
            )}
            <Button
              appearance="primary"
              style={{
                backgroundColor: "#FFFFFF4F",
                border: "1px solid #fff",
                fontWeight: 500,
              }}
              onClick={handlePreview}
              icon={<Preview className="w-4 h-4 !text-gray-800" />}
            />
              {canAddResume() && (
            <Tooltip
              content={
                JDData.status !== "Published"
                  ? "Can only add resumes when job is published"
                  : "Add candidate resumes"
              }
              relationship="label"
            >
              <Button
                appearance="outline"
                size="medium"
                shape="circular"
                className="h-8"
                style={{
                  color: "#626262",
                  backgroundColor: "#FFFFFF4F",
                  border: "1px solid #fff",
                  fontWeight: 500,
                  padding: "20px 18px",
                  display: "flex",
                  gap: "6px",
                }}
                icon={
                  <div className="bg-gradient-to-r from-[#0153A5] bg-[#2FC2FE] rounded-full p-1 flex items-center justify-center">
                    <AddRegular className="w-4 h-4 text-white color-white" />
                  </div>
                }
                onClick={() => setIsResumeUploadOpen(true)}
                disabled={JDData.status !== "Published"}
              >
                Add Resume
              </Button>
            </Tooltip>
              )} 
          </div>
        </div>

        {/* Status Alert/Banner */}
        {JDData.status === "Inactive" && JDData.inActiveReason && (
          <div className="my-4">
            <MessageBar intent="warning">
              <MessageBarBody>
                <MessageBarTitle>Job Request Inactive</MessageBarTitle>
                Reason: {JDData.inActiveReason}
              </MessageBarBody>
            </MessageBar>
          </div>
        )}

        {/* Three Column Layout */}
        <div className="my-4">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {/* Status Card */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/50">
              <div className="text-xs text-blue-700 font-semibold mb-1 uppercase tracking-wide">Status</div>
              <div className="text-lg font-bold text-gray-900">{handleStatusValue()}</div>
            </div>

            {/* Total Applied */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/50">
              <div className="text-xs text-purple-700 font-semibold mb-1 uppercase tracking-wide">Applied</div>
              <div className="text-lg font-bold text-gray-900">{ApplicantDetails.length}</div>
            </div>

            {/* Hired */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/50">
              <div className="text-xs text-green-700 font-semibold mb-1 uppercase tracking-wide">Hired</div>
              <div className="text-lg font-bold text-gray-900">{handleCalHiredApplicants()}</div>
            </div>

            {/* Rejected */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/50">
              <div className="text-xs text-red-700 font-semibold mb-1 uppercase tracking-wide">Rejected</div>
              <div className="text-lg font-bold text-gray-900">{handleCalRejectApplicants()}</div>
            </div>

            {/* Pending */}
            <div className="bg-white/40 backdrop-blur-md rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/50">
              <div className="text-xs text-amber-700 font-semibold mb-1 uppercase tracking-wide">Pending</div>
              <div className="text-lg font-bold text-gray-900">{handleCalPendingApplicants()}</div>
            </div>

            {/* Target Date */}
            {handleStatusValue() !== 'Filled' && (
              <div className="bg-white/40 backdrop-blur-md rounded-xl p-4 border border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/50">
                <div className="text-xs text-slate-700 font-semibold mb-1 flex items-center gap-1 uppercase tracking-wide">
                  <CalendarLtrRegular className="w-3 h-3" />
                  Target Date
                </div>
                <div className="text-sm font-bold text-gray-900 mb-1">{formatDate(JDData.targetDate)}</div>
                {JDData.targetDate && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {parseInt(calculateDaysFromTarget(JDData.targetDate)) < 0 && (
                      <Badge appearance="filled" color="danger" size="extra-small">
                        Overdue
                      </Badge>
                    )}
                    {parseInt(calculateDaysFromTarget(JDData.targetDate)) === 0 && (
                      <Badge appearance="filled" color="warning" size="extra-small">
                        Today
                      </Badge>
                    )}
                    {parseInt(calculateDaysFromTarget(JDData.targetDate)) > 0 && (
                      <span className={`text-xs ${getTargetDateColor(JDData.targetDate)}`}>
                        {getTargetDateStatusText(JDData.targetDate)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Job Details Card */}
            <div className="bg-white/30 backdrop-blur-lg rounded-xl p-5 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-white/40">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckmarkCircleSquare20Regular className="w-4 h-4 text-gray-700" />
                Fulfillment Status
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 font-medium">Total Vacancies</span>
                  <span className="text-sm font-bold text-gray-900">{JDData.numPositions}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 font-medium">Hired</span>
                  <span className="text-sm font-bold text-green-600">{handleCalHiredApplicants()}</span>
                </div>
              </div>
            </div>

            {/* Created By Card */}
            <div className="bg-white/30 backdrop-blur-lg rounded-xl p-5 border border-white/50 shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-white/40 md:col-span-1 lg:col-span-2">
              <div className="grid grid-cols-3 xs:grid-cols-2 gap-10">
                <div className="flex flex-col gap-3">
                  <div className="flex gap-3 items-center">
                    <PersonRegular width={4} height={4} />
                    <h3 className="text-sm font-semibold text-gray-900 ">Created By</h3>
                  </div>
                  <Persona
                    name={JDData.createdBy?.displayName || "Unknown"}
                    secondaryText={JDData.createdBy?.email || ""}
                    avatar={{
                      name: JDData.createdBy?.displayName || "Unknown",
                      color: "brand",
                    }}
                    size="small"
                  />
                </div>

                <div className="flex flex-col items-start gap-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <BuildingRegular className="w-4 h-4" />
                    <span className="text-sm font-semibold text-gray-900 ">Department:</span>
                  </div>
                  <span className="text-sm font-small text-gray-900">{JDData.department}</span>
                </div>

                <div className="flex flex-col items-start gap-3">
                  <div className="flex items-center gap-2 text-gray-700">
                    <LocationRegular className="w-4 h-4" />
                    <span className="text-sm font-semibold text-gray-900 ">Location:</span>
                  </div>
                  <span className="text-sm font-small text-gray-900">{JDData.jobLocation}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section - Only show if job is published */}
      {JDData.status === "Published" && (
        <div className="my-4 space-y-4">
          <div className="flex justify-between items-center xs:flex-col">
            <div className="w-fit xs:w-full">
              <TabList
                vertical={window.screen.width < 550 ? true : false}
                size="small"
                appearance="transparent"
                className="bg-white/46 rounded-lg border-1 border-white after:!bg-white p-2.5 :after:!bg-none w-fit xs:w-full shadow-lg"
                selectedValue={selectedValue}
                onTabSelect={onTabSelect}
              >
                <Tab
                  id="SubmittedResumes"
                  value="SubmittedResumes"
                  icon={
                    <People16Filled
                      className={`${selectedValue === "SubmittedResumes"
                        ? "!text-[#007ED5]"
                        : "text-gray-800"
                        } `}
                    />
                  }
                  className={`${selectedValue === "SubmittedResumes"
                    ? ":after:!text-[#007ED5] after:!bg-transparent !bg-white after:!border-none"
                    : ":after:text-gray-800 after:!bg-transparent after:!border-none p-4"
                    } `}
                >
                  <span
                    className={`${selectedValue === "SubmittedResumes"
                      ? "!text-[#007ED5]"
                      : "text-gray-800"
                      }`}
                  >
                    Career Portal
                  </span>
                </Tab>
                {canViewLeadSubmission() && (
                  <Tab
                    id="Applicant"
                    value="Applicant"
                    className={`${selectedValue === "Applicant"
                      ? ":after:!text-[#007ED5] !bg-white after:!bg-transparent"
                      : ":after:text-gray-800 bg-transparent after:!bg-transparent"
                      } `}
                    icon={
                      <PersonAccount16Filled
                        className={`${selectedValue === "Applicant"
                          ? "!text-[#007ED5] after:!bg-transparent"
                          : "text-gray-800"
                          } `}
                      />
                    }
                  >
                    <span
                      className={`${selectedValue === "Applicant"
                        ? "!text-[#007ED5] after:!bg-transparent"
                        : "text-gray-800 after:!bg-transparent"
                        } `}
                    >
                      Job Portal
                    </span>
                  </Tab>
                )}
                {canViewLeadSubmission() && (
                  <Tab
                    id="Referral"
                    value="Referral"
                    className={`${selectedValue === "Referral"
                      ? ":after:!text-[#007ED5] !bg-white after:!bg-transparent"
                      : ":after:text-gray-800 bg-transparent after:!bg-transparent"
                      } `}
                    icon={
                      <PersonAccount16Filled
                        className={`${selectedValue === "Referral"
                          ? "!text-[#007ED5] after:!bg-transparent"
                          : "text-gray-800"
                          } `}
                      />
                    }
                  >
                    <span
                      className={`${selectedValue === "Referral"
                        ? "!text-[#007ED5] after:!bg-transparent"
                        : "text-gray-800 after:!bg-transparent"
                        } `}
                    >
                      Referral
                    </span>
                  </Tab>
                )}
                {canViewInterviewPipeline() && (
                  <Tab
                    id="InterviewPipeline"
                    value="InterviewPipeline"
                    icon={
                      <Pipeline20Filled
                        className={`${selectedValue === "InterviewPipeline"
                          ? "!text-[#007ED5]"
                          : "text-gray-800"
                          } `}
                      />
                    }
                    className={`${selectedValue === "InterviewPipeline"
                      ? ":after:!text-[#007ED5] !bg-white after:!bg-transparent"
                      : ":after:text-gray-800 bg-transparent after:!bg-transparent"
                      } `}
                  >
                    <span
                      className={`${selectedValue === "InterviewPipeline"
                        ? "!text-[#007ED5] after:!bg-transparent"
                        : "text-gray-800 after:!bg-transparent"
                        } `}
                    >
                      Interview Pipeline
                    </span>
                  </Tab>
                )}
              </TabList>
            </div>
          </div>

          {(selectedValue === "Applicant" || selectedValue === "Referral") && canViewLeadSubmission() && (
            <ApplicantsTable
              jdId={JDData.jobId}
              jobId={JDData.id}
              key={`applicants-${JDData.id}`}
              refreshTrigger={refreshTrigger}
              hasMaterial={JDData.hasMaterial ? JDData.hasMaterial : false}
              source={selectedValue === "Referral" ? "referral" : 'non-refferal'}
            />
          )}
          {selectedValue === "SubmittedResumes" && (
            <Applications jobId={JDData.id} refreshTrigger={refreshTrigger} />
          )}
          {selectedValue === "InterviewPipeline" &&
            canViewInterviewPipeline() && (
              <DynamicInterviewPipeline
                jobId={JDData.id}
                jobRole={JDData.jobRole}
                jobSequence={JDData.jobSequence}
                refreshTrigger={refreshTrigger}
                isSubordiante={isSubordinate}
              />
            )}
        </div>
      )}

      {/* Show message when job is not published */}
      {JDData.status !== "Published" && (
        <div className="my-8 p-6 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-center flex-col gap-3">
            {JDData.status === "Active" ? (
              <>
                <CheckmarkCircleRegular className="w-12 h-12 text-green-600" />
                <Text className="text-gray-700 font-semibold">
                  Job Request is Active
                </Text>
                <Caption1 className="text-gray-600 !text-center max-w-md">
                  This job request is active but not yet published. To start
                  accepting applications, please publish the job request from
                  the edit page.
                </Caption1>
              </>
            ) : (
              <>
                <DismissCircleRegular className="w-12 h-12 text-yellow-600" />
                <Text className="text-gray-700 font-semibold">
                  Job Request is Inactive
                </Text>
                <Caption1 className="text-gray-600 text-center max-w-md">
                  This job request is currently inactive and not accepting
                  applications.
                  {JDData.inActiveReason && (
                    <div className="mt-2">
                      <strong>Reason:</strong> {JDData.inActiveReason}
                    </div>
                  )}
                </Caption1>
              </>
            )}
            {canEditJob() && (
              <Button
                appearance="primary"
                onClick={() => navigate(`/recruit/editJD/${Id}`)}
                icon={<EditRegular />}
                className="mt-3"
              >
                Go to Edit Page
              </Button>
            )}
          </div>
        </div>
      )}

      <FluentProvider className="!bg-transparent">
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
            {JDData && <PreviewJDForm id={JDData.id} isNeedControls={false} />}
          </DrawerBody>
        </OverlayDrawer>

        {canAddResume() && JDData.status === "Published" && (
          <OverlayDrawer
            open={isResumeUploadOpen}
            onOpenChange={(_, { open }) => setIsResumeUploadOpen(open)}
            position="end"
            size="large"
          >
            <DrawerHeader
              style={{
                backgroundColor: "#EEF2FF",
                border: "1px solid #E5E7EB",
              }}
            >
              <DrawerHeaderTitle
                action={
                  <Button
                    appearance="subtle"
                    aria-label="Close"
                    icon={<DismissRegular />}
                    onClick={() => setIsResumeUploadOpen(false)}
                  />
                }
              >
                <div className="flex flex-col gap-2">
                  <Subtitle2>Upload & Process Resumes</Subtitle2>
                  <Text>{JDData.jobRole}</Text>
                </div>
              </DrawerHeaderTitle>
            </DrawerHeader>

            <DrawerBody className="!p-0">
              {JDData && (
                <EnhancedResumeUpload
                  jobPosting={JDData}
                  onSaveComplete={handleSaveComplete}
                />
              )}
            </DrawerBody>
          </OverlayDrawer>
        )}
      </FluentProvider>

      <FluentProvider style={{ background: "transparent" }}>
        <Dialog
          open={showDeleteDialog}
          onOpenChange={(event, data) => setShowDeleteDialog(data.open)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogContent>
                <div className="space-y-4">
                  <Text>
                    Are you sure you want to delete this JD request for{" "}
                    <strong>{JDData.jobRole}</strong>?
                  </Text>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <Text className="text-red-800 text-sm">
                      This action will permanently delete the JD request. This
                      action cannot be undone.
                    </Text>
                  </div>
                  {JDData.inActiveReason && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <Text className="text-yellow-800 text-sm font-semibold">
                        Inactive Reason:
                      </Text>
                      <Text className="text-yellow-800 text-sm mt-1">
                        {JDData.inActiveReason}
                      </Text>
                    </div>
                  )}
                  {JDData.status !== "Inactive" && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <Text className="text-blue-800 text-sm">
                        Note: This JD request must be set to Inactive status
                        before it can be deleted.
                      </Text>
                    </div>
                  )}
                </div>
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button

                  onClick={handleDelete}
                  disabled={isDeleting || JDData.status !== "Inactive"}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </FluentProvider>

      <Toaster toasterId={toasterId} />
    </div>
  );
}
