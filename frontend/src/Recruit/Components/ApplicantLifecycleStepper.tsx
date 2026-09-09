import React, { useState, useEffect } from "react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardPreview,
  Title1,
  Title2,
  Title3,
  Body1,
  Body2,
  Caption1,
  Spinner,
  MessageBar,
  MessageBarBody,
  tokens,
  Divider,
  Body1Strong,
  Subtitle2,
  Caption1Strong,
  Subtitle2Stronger,
  Link,
  AvatarGroup,
  AvatarGroupItem,
  AvatarGroupPopover,
  partitionAvatarGroupItems,
  Text,
  Toast,
  ToastTitle,
  Toaster,
  useId,
  useToastController,
  Tooltip,
  Subtitle1,
} from "@fluentui/react-components";
import {
  CheckmarkCircle20Regular,
  Clock20Regular,
  Calendar20Regular,
  VideoClip20Regular,
  Copy20Regular,
  Timer20Regular,
  Star20Filled,
  Circle20Regular,
  ChevronRight20Regular,
  ChevronDown20Regular,
  Person20Regular,
  Video20Regular,
  Record20Regular,
  ArrowDownload20Regular,
  Mail20Regular,
  Document20Regular,
  VideoOff20Regular,
  People20Regular,
  MoreHorizontal20Regular,
} from "@fluentui/react-icons";
import { getApplicantPipelineDetails } from "../../Services/JDRequests";
import { useAuth } from "../../Auth/AuthProvider";
import TranscriptAnalysisDialog from "./TranscriptAnalysisDialog";
import CombinedTranscriptAnalysisDialog from "./CombinedTranscriptAnalysisDialog";

// Type definitions
interface ApplicantInfo {
  applicantId: string;
  applicantCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  applicantStatus: string;
  applicantCreatedAt: string;
  jobPostingId: string;
  JobRole: string;
  JobLocation: string;
  currentPipelineId: string;
  pipelineInfo: {
    applicantPipelineId: string;
    pipelineStatus: string;
    holdReason: string | null;
    rejectedReason: string | null;
    pipelineCreatedAt: string;
    pipelineModifiedAt: string;
    interviewPipelineId: string;
    currentStage: {
      stageId: string;
      stageName: string;
      stageDescription: string;
      stageOrder: number;
    };
  };
  progress: {
    stagesCompleted: number;
    totalStages: number;
    progressPercentage: number;
  };
}

interface InterviewerDetails {
  id: string;
  interviewerId: string;
  role: string;
  isPrimary: boolean;
  addedAt: string;
  userDetails: {
    id: string;
    displayName: string;
    email: string;
    jobTitle?: string;
    department?: string;
  };
}

interface RecordingDetails {
  url?: string;
  createdDateTime: string;
  duration?: number;
  id: string;
  hasMultiple?: boolean;
  count?: number;
  recordingContentUrl?: string;
  fullRecordingData?: any;
}

interface TranscriptDetails {
  url?: string;
  createdDateTime: string;
  id: string;
  hasMultiple?: boolean;
  count?: number;
  transcriptContentUrl?: string;
  fullTranscriptData?: any;
}

interface JobSkill {
  skillName: string;
  rating: number;
}

interface Feedback {
  feedbackId: string;
  feedbackSequence: string;
  interviewId: string;
  applicantId: string;
  jobPostingId: string;
  applicantPipelineId: string;
  ratings: {
    overallRating: number;
    technicalSkills: number;
    communicationSkills: number;
    problemSolving: number;
    culturalFit: number;
    averageRating: number;
  };
  recommendation: string;
  strengths: string;
  weaknesses: string;
  additionalComments: string;
  feedbackCreatedBy: string;
  feedbackModifiedBy: string | null;
  feedbackCreatedAt: string;
  feedbackModifiedAt: string | null;
  interviewTitle: string;
  interviewType: string;
  scheduledDateTime: string;
  interviewStatus: string;
  stageName: string;
  stageOrder: number;
  jobSkills?: JobSkill[];
}

interface ManualFeedback {
  feedbackId: string;
  feedbackSequence: string;
  interviewId: string;
  applicantId: string;
  jobPostingId: string;
  applicantPipelineId: string;
  ratings: {
    overallRating: number;
    technicalSkills: number;
    communicationSkills: number;
    problemSolving: number;
    culturalFit: number;
    averageRating: number;
  };
  recommendation: string;
  strengths: string;
  weaknesses: string;
  additionalComments: string;
  feedbackCreatedBy: string;
  feedbackModifiedBy: string | null;
  feedbackCreatedAt: string;
  feedbackModifiedAt: string | null;
  interviewTitle: string;
  interviewType: string;
  scheduledDateTime: string;
  interviewStatus: string;
  stageName: string;
  stageOrder: number;
  jobSkills?: JobSkill[];
  recommendedSalary: number
}

interface Interview {
  interviewId: string;
  applicantId: string;
  jobPostingId: string;
  pipelineStageId: string;
  interviewTitle: string;
  interviewDescription: string;
  interviewType: string;
  scheduledDateTime: string;
  duration: number;
  timeZone: string;
  location: string;
  meetingLink: string;
  outlookEventId?: string;
  interviewStatus: string;
  interviewNotes: string;
  isTeamsMeeting: boolean;
  interviewerId?: string;
  interviewCreatedAt: string;
  interviewModifiedAt: string;
  interviewHistoryStatus: string;
  stageName: string;
  stageOrder: number;
  stageDescription: string;
  feedback: Feedback[];
  interviewers?: InterviewerDetails[];
  recording?: RecordingDetails;
  recordings?: RecordingDetails[];
  transcript?: TranscriptDetails;
  transcripts?: TranscriptDetails[];
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
}

interface Stage {
  stageId: string;
  jobPostingId: string;
  stageName: string;
  stageDescription: string;
  stageOrder: number;
  isDefault: boolean;
  show: boolean;
  isManual: boolean;
  stageCreatedAt: string;
  stageStatus: string;
  applicantPipelineId: string;
  applicantStageStatus: string;
  applicantStageCreatedAt: string;
  applicantStageModifiedAt: string | null;
  interviews: Interview[];
  manualFeedback: ManualFeedback[]
}

interface PipelineData {
  success: boolean;
  message?: string;
  data: {
    applicants: {
      applicantInfo: ApplicantInfo;
      stages: Stage[];

    }[];
    summary: {
      TotalApplicants: number;
      TotalPipelineEntries: number;
      TotalInterviews: number;
      TotalFeedbacks: number;
      ScheduledInterviews: number;
      CompletedInterviews: number;
      CancelledInterviews: number;
      PositiveFeedbacks: number;
      NegativeFeedbacks: number;
      AverageOverallRating: number;
      AverageTechnicalRating: number;
      AverageCommunicationRating: number;
      AverageProblemSolvingRating: number;
      AverageCulturalFitRating: number;
    };
  };
}

interface ApplicantLifecycleStepperProps {
  applicantId?: string;
  showlifecycle?: boolean;
}

const ApplicantLifecycleStepper: React.FC<ApplicantLifecycleStepperProps> = ({
  applicantId = "demo-123",
  showlifecycle = true,
}) => {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(
    {}
  );
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const { currentUser, accessToken, refreshToken }: any = useAuth();
  const [expandedInterviews, setExpandedInterviews] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result: any = await getApplicantPipelineDetails(
          applicantId,
          accessToken,
          currentUser.calendarId
        );
        // console.log("Pipeline data:", result.data);
        setData(result);

        // Auto-expand the current stage
        if (result?.data?.applicants?.[0]?.stages) {
          const currentStage = result.data.applicants[0].stages.find(
            (stage: any) => stage.applicantStageStatus === "In Progress"
          );
          if (currentStage) {
            setExpandedStages((prev) => ({
              ...prev,
              [currentStage.stageId]: true,
            }));
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching pipeline data:", err);
        setError("Failed to load pipeline data. Please try again later.");
        setLoading(false);
      }
    };

    fetchData();
  }, [applicantId]);

  useEffect(() => {
    (async () => {
      await refreshToken();
    })();
  }, []);

  // Handle copying email content to clipboard
  const handleCopyToClipboard = async () => {
    try {
      const emailContent = generateEmailContent();
      await navigator.clipboard.writeText(emailContent);

      dispatchToast(
        <Toast>
          <ToastTitle>
            Email content copied to clipboard successfully!
          </ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to copy to clipboard</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  // Toggle stage expansion
  const toggleStageExpansion = (stageId: string) => {
    setExpandedStages((prev) => ({
      ...prev,
      [stageId]: !prev[stageId],
    }));
  };

  // Toggle interview expansion
  const toggleInterviewExpansion = (interviewId: string) => {
    setExpandedInterviews((prev) => ({
      ...prev,
      [interviewId]: !prev[interviewId],
    }));
  };

  // Get stage icon based on status
  const getStageIcon = (stageStatus: string) => {
    switch (stageStatus) {
      case "Completed":
        return (
          <CheckmarkCircle20Regular
            style={{ color: tokens.colorPaletteGreenForeground1 }}
          />
        );
      case "In Progress":
        return (
          <Clock20Regular
            style={{ color: tokens.colorPaletteBlueForeground2 }}
          />
        );
      case "On Hold":
        return (
          <Clock20Regular
            style={{ color: tokens.colorPaletteYellowForeground2 }}
          />
        );
      case "Rejected":
        return (
          <Circle20Regular
            style={{ color: tokens.colorPaletteRedForeground1 }}
          />
        );
      default:
        return (
          <Circle20Regular style={{ color: tokens.colorNeutralForeground3 }} />
        );
    }
  };

  // Get interview icon based on status
  const getInterviewIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return (
          <CheckmarkCircle20Regular
            style={{ color: tokens.colorPaletteGreenForeground1 }}
          />
        );
      case "Scheduled":
        return (
          <Calendar20Regular
            style={{ color: tokens.colorPaletteBlueForeground2 }}
          />
        );
      case "Cancelled":
        return (
          <VideoOff20Regular
            style={{ color: tokens.colorPaletteRedForeground1 }}
          />
        );
      default:
        return (
          <Clock20Regular style={{ color: tokens.colorNeutralForeground3 }} />
        );
    }
  };

  // Get status badge with appropriate color
  const getStatusBadge = (status: string) => {
    let color: "success" | "brand" | "subtle" | "warning" | "danger" = "subtle";
    switch (status) {
      case "Completed":
        color = "success";
        break;
      case "Scheduled":
      case "In Progress":
        color = "brand";
        break;
      case "On Hold":
        color = "warning";
        break;
      case "Cancelled":
      case "Rejected":
        color = "danger";
        break;
      case "Skipped":
        color = "warning";
        break;
      default:
        color = "subtle";
    }

    return (
      <Badge appearance="filled" color={color}>
        <Caption1>{status}</Caption1>
      </Badge>
    );
  };

  // Get recommendation badge
  const getRecommendationBadge = (recommendation: string) => {
    const isHire = recommendation?.toLowerCase().includes("Recommend");

    return (
      <Badge appearance="filled" color={isHire ? "success" : "danger"}>
        <Caption1>{recommendation}</Caption1>
      </Badge>
    );
  };

  // Get rating stars visualization
  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star20Filled
        key={i}
        style={{
          color:
            i < rating
              ? tokens.colorPaletteYellowForeground2
              : tokens.colorNeutralForeground4,
        }}
      />
    ));
  };

  const formatScheduledDateTime = (dateString: string): string => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      const offsetDate = new Date(date.getTime() - 5.5 * 60 * 60 * 1000);

      return offsetDate.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const formatDateTime = (dateString: string): string => {
    if (!dateString) return "N/A";

    try {
      let date = new Date(dateString);

      if (isNaN(date.getTime())) {
        const cleanDateString = dateString.replace(/[+-]\d{2}:\d{2}$/, "");
        date = new Date(cleanDateString + "Z");
      }

      if (isNaN(date.getTime())) {
        const cleanDateString = dateString.replace(/[+-]\d{2}:\d{2}$/, "");
        date = new Date(cleanDateString);
      }

      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  // Handle report download
  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      await refreshToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/applicant/generatePipelineReport`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            applicantId: applicantId,
            format: "word",
            calendarId: currentUser.calendarId,
          }),
        }
      );

      setLoading(false);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Pipeline_Report_${data?.data.applicants[0].applicantInfo.applicantCode
          }_${new Date().toISOString().split("T")[0]}.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        dispatchToast(
          <Toast>
            <ToastTitle>Report downloaded successfully!</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else {
        setError("Failed to download report");
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to download report</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      }
    } catch (error) {
      setLoading(false);
      setError("Error downloading report");
      console.error("Error downloading report:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Error downloading report</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  const DownloadRecording = async (recordingUrl: string) => {
    if (!recordingUrl) {
      setError("Recording URL not available");
      return;
    }

    try {
      setLoading(true);
      await refreshToken();
      // Fetch the recording content from Microsoft Graph API
      const response = await fetch(recordingUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download recording: ${response.statusText}`);
      }

      // Get the blob data
      const blob = await response.blob();

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Recording_${new Date().toISOString().split("T")[0]}.mp4`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setLoading(false);
    } catch (error) {
      console.error("Error downloading recording:", error);
      setError("Failed to download recording. Please try again.");
      setLoading(false);
    }
  };

  const DownloadTranscript = async (transcriptUrl: string) => {
    if (!transcriptUrl) {
      setError("Transcript URL not available");
      return;
    }

    dispatchToast(
      <Toast>
        <ToastTitle>Transcript download initiated (demo mode)</ToastTitle>
      </Toast>,
      { intent: "info" }
    );
  };

  const generateEmailContent = () => {
    if (!data || !data.data.applicants.length) return "";

    const applicant = data.data.applicants[0];
    const { applicantInfo, stages } = applicant;

    const completedInterviews: any[] = [];
    stages.forEach((stage) => {
      stage.interviews.forEach((interview) => {
        if (
          interview.interviewStatus === "Completed" &&
          interview.feedback.length > 0
        ) {
          completedInterviews.push({
            stage: stage.stageName,
            interview,
            feedback: interview.feedback,
          });
        }
      });
    });

    let emailBody = `Dear Sir/Madam,\n\n`;
    emailBody += `Source: ${applicantInfo.applicantStatus}\n\n`;
    // emailBody += `Need your approval for the candidate ${applicantInfo.firstName} ${applicantInfo.lastName} who has been shortlisted for ${applicantInfo.JobRole}.\n\n`;

    completedInterviews.forEach((item, index) => {
      emailBody += `* Interview ${index + 1}: ${item.interview.interviewTitle
        } (${item.stage})\n`;
    });

    emailBody += `* Work Location: ${applicantInfo?.JobLocation || "To be determined"
      }\n`;
    emailBody += `* Role: ${applicantInfo.JobRole}\n`;
    emailBody += `* Current Status: ${applicantInfo.applicantStatus}\n\n`;

    emailBody += `Interview Recordings:\n\n`;
    emailBody += `<To be Filled by HR Team>:\n\n`;

    completedInterviews.forEach((item, itemIndex) => {
      item.feedback.forEach((feedback: Feedback, feedbackIndex: number) => {
        const interviewerName =
          item.interview.interviewers?.[feedbackIndex]?.userDetails
            ?.displayName || "Interviewer";
        emailBody += `${interviewerName} Feedback:\n\n`;

        emailBody += `* Overall Rating: ${feedback.ratings.overallRating}/5\n`;
        emailBody += `* Technical Skills: ${feedback.ratings.technicalSkills}/5\n`;
        emailBody += `* Communication Skills: ${feedback.ratings.communicationSkills}/5\n`;
        emailBody += `* Problem Solving: ${feedback.ratings.problemSolving}/5\n`;
        emailBody += `* Cultural Fit: ${feedback.ratings.culturalFit}/5\n`;
        emailBody += `* Recommendation: ${feedback.recommendation}\n\n`;

        if (feedback.strengths) {
          emailBody += `Strengths: ${feedback.strengths}\n\n`;
        }

        if (feedback.weaknesses) {
          emailBody += `Weaknesses: ${feedback.weaknesses}\n\n`;
        }

        if (feedback.additionalComments) {
          emailBody += `Additional Comments: ${feedback.additionalComments}\n\n`;
        }
      });
    });

    emailBody += `\nOverall Assessment: `;
    emailBody += `Average Rating: ${data.data.summary.AverageOverallRating?.toFixed(
      1
    ) || 0}/5, `;
    emailBody += `Completed Interviews: ${data.data.summary.CompletedInterviews}, `;
    emailBody += `Positive Feedbacks: ${data.data.summary.PositiveFeedbacks}\n`;

    return emailBody;
  };

  const handleSendEmail = () => {
    const emailAddress = currentUser.email;

    if (!emailAddress) {
      dispatchToast(
        <Toast>
          <ToastTitle>No email address available</ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
      return;
    }

    const emailContent = generateEmailContent();
    const applicant = data?.data.applicants[0];
    const applicantInfo = applicant?.applicantInfo;
    const subject = `Candidate Approval Request - ${applicantInfo?.firstName} ${applicantInfo?.lastName}`;

    const estimatedEncodedLength = (subject.length + emailContent.length) * 3;

    if (estimatedEncodedLength > 2000 || emailContent.length > 1000) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            Email content is too large for mailto protocol. Please use Copy to
            Clipboard instead.
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(emailContent);
    const mailtoUrl = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;

    window.location.href = mailtoUrl;

    dispatchToast(
      <Toast>
        <ToastTitle>Opening email client...</ToastTitle>
      </Toast>,
      { intent: "info" }
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading pipeline data...</Body1Strong>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <MessageBar intent="error">
        <MessageBarBody>
          <Body1>{error}</Body1>
        </MessageBarBody>
      </MessageBar>
    );
  }

  // No data state
  if (!data || !data.data.applicants.length) {
    return (
      <div className="text-center p-8">
        <Body1>No pipeline data available</Body1>
      </div>
    );
  }

  const applicant = data.data.applicants[0];
  const { applicantInfo, stages } = applicant;

  return (
    <div className="p-2">
      {/* Header with report actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Body2>
            <Body1Strong>Status:</Body1Strong> {applicantInfo.applicantStatus}
          </Body2>
          <Body1>
            <Body1Strong>Progress:</Body1Strong>{" "}
            {applicantInfo.progress.stagesCompleted}/
            {applicantInfo.progress.totalStages} stages
          </Body1>
        </div>
        <div className="flex gap-2">
          <Tooltip content="Download Report" relationship="label">
            <Button
              appearance="primary"
              icon={<Document20Regular />}
              onClick={handleDownloadReport}
            />
          </Tooltip>
          <Tooltip content="Mail Report" relationship="label">
            <Button
              appearance="outline"
              icon={<Mail20Regular />}
              onClick={handleSendEmail}
            />
          </Tooltip>
          <Tooltip content="Copy to Clipboard" relationship="label">
            <Button
              appearance="outline"
              icon={<Copy20Regular />}
              onClick={handleCopyToClipboard}
            />
          </Tooltip>
        </div>
      </div>

      {/* Summary Card */}
      <Card className="my-5 shadow-sm">
        <CardHeader
          header={<Subtitle2Stronger>Pipeline Summary</Subtitle2Stronger>}
        />
        <CardPreview>
          <div className="px-4 pb-4">
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <Subtitle2>
                  {data.data.summary.CompletedInterviews || 0}
                </Subtitle2>
                <div>
                  <Body1>Completed Interviews</Body1>
                </div>
              </div>
              <div className="text-center">
                <Subtitle2>
                  {data.data.summary.AverageOverallRating?.toFixed(1) || 0}
                </Subtitle2>
                <div>
                  <Body1>Average Rating</Body1>
                </div>
              </div>
              <div className="text-center">
                <Subtitle2>
                  {data.data.summary.PositiveFeedbacks || 0}
                </Subtitle2>
                <div>
                  <Body1>Positive Feedbacks</Body1>
                </div>
              </div>
            </div>
          </div>
        </CardPreview>
      </Card>

      {/* Pipeline Stages */}
      <div className="relative">
        {stages.map((stage, index, filteredStages) => {
          const isExpanded = expandedStages[stage.stageId];
          const hasInterviews = stage.interviews.length > 0;
          const hasManualFeedback = stage.manualFeedback.length > 0
          const isLastStage = index === filteredStages.length - 1;
          const stageNumber = index + 1;

          return (
            <div key={stage.stageId} className="relative">
              {/* Stage */}
              <div className="flex items-start gap-4 mb-2">
                {/* Stage Icon and Connector */}
                <div className="flex flex-col items-center">
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white shadow-md"
                    style={{
                      borderColor:
                        stage.applicantStageStatus === "Completed"
                          ? tokens.colorPaletteGreenBorder2
                          : stage.applicantStageStatus === "In Progress"
                            ? tokens.colorPaletteRedBorder2
                            : stage.applicantStageStatus === "On Hold"
                              ? tokens.colorPaletteYellowBorder2
                              : stage.applicantStageStatus === "Rejected"
                                ? tokens.colorPaletteRedBorder2
                                : tokens.colorNeutralStroke2,
                    }}
                  >
                    {getStageIcon(stage.applicantStageStatus)}
                  </div>
                  {!isLastStage && (
                    <div
                      className="w-0.5 h-16 mt-2"
                      style={{
                        backgroundColor:
                          stage.applicantStageStatus === "Completed"
                            ? tokens.colorPaletteGreenBorder2
                            : tokens.colorNeutralStroke2,
                      }}
                    />
                  )}
                </div>

                {/* Stage Content */}
                <div className="flex-1">
                  <Card className="shadow-sm">
                    <CardHeader
                      header={
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            <Subtitle2>
                              Stage {stageNumber}: {stage.stageName}
                            </Subtitle2>
                            {getStatusBadge(stage.applicantStageStatus)}
                            {stage.isManual && (
                              <Badge
                                appearance="outline"
                                color="warning"
                                size="small"
                              >
                                Manual
                              </Badge>
                            )}
                          </div>
                          {hasInterviews && (
                            <Button
                              appearance="subtle"
                              icon={
                                isExpanded ? (
                                  <ChevronDown20Regular />
                                ) : (
                                  <ChevronRight20Regular />
                                )
                              }
                              onClick={() =>
                                toggleStageExpansion(stage.stageId)
                              }
                            >
                              {stage.interviews.length} Interview
                              {stage.interviews.length !== 1 ? "s" : ""}
                            </Button>
                          )}

                          {hasManualFeedback && (
                            <Button
                              appearance="subtle"
                              icon={
                                isExpanded ? (
                                  <ChevronDown20Regular />
                                ) : (
                                  <ChevronRight20Regular />
                                )
                              }
                              onClick={() =>
                                toggleStageExpansion(stage.stageId)
                              }
                            >

                            </Button>
                          )}
                        </div>
                      }
                    />
                    <CardPreview>
                      <div className="px-4 pb-4">
                        {stage.stageDescription && (
                          <Body1 className="mb-2">
                            {stage.stageDescription}
                          </Body1>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-600 ">
                          <span>
                            Created: {formatDateTime(stage.applicantStageCreatedAt)}
                          </span>
                          {stage.applicantStageModifiedAt && (
                            <span>
                              {stage.applicantStageStatus === "Completed"
                                ? "Completed"
                                : "Modified"}
                              : {formatDateTime(stage.applicantStageModifiedAt)}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardPreview>
                  </Card>

                  {/* Interviews */}
                  {isExpanded && hasInterviews && (
                    <div className="mt-4 ml-6">
                      {stage.interviews.map(
                        (interview: any, interviewIndex) => {
                          const isInterviewExpanded =
                            expandedInterviews[interview.interviewId];
                          const hasFeedback = interview.feedback.length > 0;
                          const isLastInterview =
                            interviewIndex === stage.interviews.length - 1;

                          return (
                            <div
                              key={interview.interviewId}
                              className="relative"
                            >
                              <div className="flex items-start gap-4 mb-4">
                                {/* Interview Icon and Connector */}
                                <div className="flex flex-col items-center">
                                  <div
                                    className="flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white"
                                    style={{
                                      borderColor:
                                        interview.interviewStatus ===
                                          "Completed"
                                          ? tokens.colorPaletteGreenBorder2
                                          : interview.interviewStatus ===
                                            "Scheduled"
                                            ? tokens.colorPaletteRedBorder2
                                            : interview.interviewStatus ===
                                              "Cancelled"
                                              ? tokens.colorPaletteRedBorder2
                                              : tokens.colorNeutralStroke2,
                                    }}
                                  >
                                    {getInterviewIcon(
                                      interview.interviewStatus
                                    )}
                                  </div>
                                  {!isLastInterview && (
                                    <div
                                      className="w-0.5 h-12 mt-2"
                                      style={{
                                        backgroundColor:
                                          tokens.colorNeutralStroke2,
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Interview Content */}
                                <div className="flex-1">
                                  <Card className="shadow-sm">
                                    <CardHeader
                                      header={
                                        <div className="flex items-center justify-between w-full">
                                          <div className="flex items-center gap-3">
                                            <Subtitle2>
                                              Interview {interviewIndex + 1}
                                            </Subtitle2>
                                            {getStatusBadge(
                                              interview.interviewStatus
                                            )}
                                            <Badge
                                              appearance="outline"
                                              color="brand"
                                              size="small"
                                            >
                                              {interview.interviewType}
                                            </Badge>
                                          </div>
                                          {showlifecycle && hasFeedback && (
                                            <Button
                                              appearance="subtle"
                                              icon={
                                                isInterviewExpanded ? (
                                                  <ChevronDown20Regular />
                                                ) : (
                                                  <ChevronRight20Regular />
                                                )
                                              }
                                              onClick={() =>
                                                toggleInterviewExpansion(
                                                  interview.interviewId
                                                )
                                              }
                                            >
                                              {interview.feedback.length}{" "}
                                              Feedback
                                              {interview.feedback.length !== 1
                                                ? "s"
                                                : ""}
                                            </Button>
                                          )}
                                        </div>
                                      }
                                    />
                                    <CardPreview>
                                      <div className="px-4 pb-4">
                                        <Body1 className="mb-2">
                                          {interview.interviewTitle}
                                        </Body1>
                                        <div></div>
                                        <Caption1Strong>
                                          Description :
                                        </Caption1Strong>
                                        &nbsp;
                                        {interview.interviewDescription && (
                                          <Caption1 className="mb-2 text-gray-600">
                                            {interview.interviewDescription}
                                          </Caption1>
                                        )}
                                        <div className="grid grid-cols-3 gap-4 text-sm text-gray-600 mt-4">
                                          <div className="flex items-center gap-2">
                                            <Calendar20Regular />
                                            <Caption1>
                                              {formatScheduledDateTime(
                                                interview.scheduledDateTime
                                              )}
                                            </Caption1>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Timer20Regular />
                                            <Caption1>
                                              {interview.duration} minutes
                                            </Caption1>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Video20Regular />
                                            <Caption1>
                                              {interview.interviewType}
                                            </Caption1>
                                          </div>
                                        </div>
                                        {/* Recording and Transcript information */}
                                        {interview.recordings &&
                                          interview.recordings.length > 0 && (
                                            <div className="mt-3 p-2 bg-gray-50 rounded">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                  <Record20Regular
                                                    style={{
                                                      color:
                                                        tokens.colorPaletteRedForeground1,
                                                    }}
                                                  />
                                                  <Caption1Strong>
                                                    Recording
                                                    {interview.recordings
                                                      .length > 1
                                                      ? "s"
                                                      : ""}{" "}
                                                    Available (
                                                    {
                                                      interview.recordings
                                                        .length
                                                    }
                                                    )
                                                  </Caption1Strong>
                                                </div>
                                                <div className="flex gap-2">
                                                  {/* Single Recording Analysis */}
                                                  {interview.recordings
                                                    .length === 1 &&
                                                    interview.recordings[0]
                                                      ?.fullRecordingData
                                                      ?.recordingContentUrl && (
                                                      <TranscriptAnalysisDialog
                                                        transcriptUrl={
                                                          interview
                                                            ?.transcripts?.[0]
                                                            ?.fullTranscriptData
                                                            ?.transcriptContentUrl
                                                        }
                                                        jobPostingId={
                                                          applicantInfo.jobPostingId
                                                        }
                                                        applicantId={
                                                          applicantInfo.applicantId
                                                        }
                                                        interviewType={
                                                          interview.interviewType
                                                        }
                                                        interviewTitle={
                                                          interview.interviewTitle
                                                        }
                                                        // Add these required IDs for caching
                                                        interviewId={
                                                          interview.interviewId
                                                        }
                                                        recordingId={
                                                          interview
                                                            .recordings[0].id
                                                        }
                                                      />
                                                    )}

                                                  {/* Multiple Recordings - Combined Analysis */}
                                                  {interview.recordings.length >
                                                    1 && (
                                                      <CombinedTranscriptAnalysisDialog
                                                        recordings={
                                                          interview.transcripts
                                                        }
                                                        jobPostingId={
                                                          applicantInfo.jobPostingId
                                                        }
                                                        applicantId={
                                                          applicantInfo.applicantId
                                                        }
                                                        interviewType={
                                                          interview.interviewType
                                                        }
                                                        interviewTitle={
                                                          interview.interviewTitle
                                                        }
                                                        // Add the interviewId for caching
                                                        interviewId={
                                                          interview.interviewId
                                                        }
                                                      />
                                                    )}
                                                </div>
                                              </div>
                                              <div className="ml-6 mt-1 space-y-2">
                                                {interview.recordings.map(
                                                  (
                                                    recording: any,
                                                    recordingIndex: number
                                                  ) => (
                                                    <div
                                                      key={recording.id}
                                                      className="border-l-2 border-gray-200 pl-3"
                                                    >
                                                      <Card
                                                        size="small"
                                                        role="listitem"
                                                      >
                                                        <CardHeader
                                                          header={
                                                            <Text weight="semibold">
                                                              <Caption1Strong>
                                                                Recording{" "}
                                                                {recordingIndex +
                                                                  1}
                                                              </Caption1Strong>
                                                            </Text>
                                                          }
                                                          description={
                                                            <Caption1>
                                                              {formatDateTime(
                                                                recording.createdDateTime
                                                              )}
                                                              {recording
                                                                .fullRecordingData
                                                                ?.endDateTime &&
                                                                recording
                                                                  .fullRecordingData
                                                                  ?.createdDateTime && (
                                                                  <Caption1 className="mt-1 text-gray-600">
                                                                    {" - "}
                                                                    {(() => {
                                                                      const durationMilliseconds =
                                                                        new Date(
                                                                          recording.fullRecordingData.endDateTime
                                                                        ).getTime() -
                                                                        new Date(
                                                                          recording.fullRecordingData.createdDateTime
                                                                        ).getTime();
                                                                      const durationMinutes = Math.floor(
                                                                        durationMilliseconds /
                                                                        60000
                                                                      );
                                                                      const durationSeconds = Math.floor(
                                                                        (durationMilliseconds %
                                                                          60000) /
                                                                        1000
                                                                      );
                                                                      return `${durationMinutes}m ${durationSeconds}s`;
                                                                    })()}
                                                                  </Caption1>
                                                                )}
                                                            </Caption1>
                                                          }
                                                          action={
                                                            <Button
                                                              appearance="transparent"
                                                              aria-label="Download recording"
                                                              onClick={() =>
                                                                DownloadRecording(
                                                                  recording
                                                                    .fullRecordingData
                                                                    .recordingContentUrl
                                                                )
                                                              }
                                                              icon={
                                                                <ArrowDownload20Regular />
                                                              }
                                                            />
                                                          }
                                                        />
                                                      </Card>
                                                    </div>
                                                  )
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        {/* Interviewers section */}
                                        {interview.interviewers &&
                                          interview.interviewers.length > 0 && (
                                            <div className="mt-3">
                                              <div className="flex items-center gap-2">
                                                <People20Regular />
                                                <Caption1Strong>
                                                  Interviewers
                                                </Caption1Strong>
                                              </div>
                                              <div className="ml-6 mt-1">
                                                {interview.interviewers &&
                                                  interview.interviewers
                                                    .length > 0 && (
                                                    <div className="flex items-center gap-3">
                                                      <div className="flex items-center gap-3">
                                                        {(() => {
                                                          const interviewerNames = interview.interviewers.map(
                                                            (i: any) =>
                                                              i?.userDetails
                                                                ?.displayName ||
                                                              i?.displayName ||
                                                              i?.name ||
                                                              "Unknown User"
                                                          );

                                                          const {
                                                            inlineItems,
                                                            overflowItems,
                                                          }: any = partitionAvatarGroupItems(
                                                            {
                                                              items: interviewerNames,
                                                              layout: "stack",
                                                            }
                                                          );

                                                          return (
                                                            <AvatarGroup
                                                              size={24}
                                                              layout="stack"
                                                              key="interviewers"
                                                            >
                                                              {inlineItems.map(
                                                                (
                                                                  name: string
                                                                ) => (
                                                                  <Tooltip relationship="label" content={<Text>{name}</Text>}>
                                                                    <AvatarGroupItem
                                                                      name={name}
                                                                      key={name}
                                                                    />
                                                                  </Tooltip>
                                                                )
                                                              )}
                                                              {overflowItems && (
                                                                <AvatarGroupPopover>
                                                                  {overflowItems.map(
                                                                    (
                                                                      name: string
                                                                    ) => (
                                                                      <Tooltip relationship="label" content={<Text>{name}</Text>}>
                                                                        <AvatarGroupItem
                                                                          name={
                                                                            name
                                                                          }

                                                                          key={
                                                                            name
                                                                          }
                                                                        />
                                                                      </Tooltip>
                                                                    )
                                                                  )}
                                                                </AvatarGroupPopover>
                                                              )}
                                                            </AvatarGroup>
                                                          );
                                                        })()}
                                                      </div>
                                                    </div>
                                                  )}
                                              </div>
                                            </div>
                                          )}
                                        {/* Meeting link */}
                                        {interview.meetingLink && (
                                          <div className="mt-3">
                                            <div className="flex items-center gap-2">
                                              <Video20Regular />
                                              <Caption1Strong>
                                                Meeting Link
                                              </Caption1Strong>
                                            </div>
                                            <div className="ml-6 mt-1">
                                              <Link
                                                href={interview.meetingLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                              >
                                                <Caption1>
                                                  Join Meeting
                                                </Caption1>
                                              </Link>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </CardPreview>
                                  </Card>

                                  {/* Feedback */}

                                  {showlifecycle &&
                                    isInterviewExpanded &&
                                    hasFeedback && (
                                      <div className="mt-4 ml-8">
                                        {interview.feedback.map(
                                          (
                                            feedback: any,
                                            feedbackIndex: number
                                          ) => (
                                            <div
                                              key={feedback.feedbackId}
                                              className="relative"
                                            >
                                              <div className="flex items-start gap-4 mb-4">
                                                {/* Feedback Icon */}
                                                <div className="flex flex-col items-center">
                                                  <div
                                                    className="flex items-center justify-center w-8 h-8 rounded-full border-2 bg-white"
                                                    style={{
                                                      borderColor: feedback.recommendation
                                                        ?.toLowerCase()
                                                        .includes("hire")
                                                        ? tokens.colorPaletteGreenBorder2
                                                        : tokens.colorPaletteRedBorder2,
                                                    }}
                                                  >
                                                    <Document20Regular
                                                      style={{
                                                        color: feedback.recommendation
                                                          ?.toLowerCase()
                                                          .includes("hire")
                                                          ? tokens.colorPaletteGreenForeground1
                                                          : tokens.colorPaletteRedForeground1,
                                                      }}
                                                    />
                                                  </div>
                                                </div>

                                                {/* Feedback Content */}
                                                <div className="flex-1">
                                                  <Card className="shadow-sm">
                                                    <CardHeader
                                                      header={
                                                        <div className="flex items-center justify-between w-full">
                                                          <div className="flex items-center gap-3">
                                                            <Subtitle2>
                                                              Feedback{" "}
                                                              {feedbackIndex +
                                                                1}
                                                            </Subtitle2>
                                                            {getRecommendationBadge(
                                                              feedback.recommendation
                                                            )}
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                            <Body2>
                                                              Rating:{" "}
                                                              {
                                                                feedback.ratings
                                                                  .overallRating
                                                              }
                                                              /5
                                                            </Body2>
                                                            <div className="flex">
                                                              {getRatingStars(
                                                                feedback.ratings
                                                                  .overallRating
                                                              )}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      }
                                                    />
                                                    <CardPreview>
                                                      <div className="px-4 pb-4">
                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                          <div>
                                                            <Caption1 className="font-semibold">
                                                              Technical Skills
                                                            </Caption1>
                                                            <div className="flex items-center gap-2">
                                                              <Body2>
                                                                {
                                                                  feedback
                                                                    .ratings
                                                                    .technicalSkills
                                                                }
                                                                /5
                                                              </Body2>
                                                              <div className="flex">
                                                                {getRatingStars(
                                                                  feedback
                                                                    .ratings
                                                                    .technicalSkills
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>
                                                          <div>
                                                            <Caption1 className="font-semibold">
                                                              Communication
                                                            </Caption1>
                                                            <div className="flex items-center gap-2">
                                                              <Body2>
                                                                {
                                                                  feedback
                                                                    .ratings
                                                                    .communicationSkills
                                                                }
                                                                /5
                                                              </Body2>
                                                              <div className="flex">
                                                                {getRatingStars(
                                                                  feedback
                                                                    .ratings
                                                                    .communicationSkills
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>
                                                          <div>
                                                            <Caption1 className="font-semibold">
                                                              Problem Solving
                                                            </Caption1>
                                                            <div className="flex items-center gap-2">
                                                              <Body2>
                                                                {
                                                                  feedback
                                                                    .ratings
                                                                    .problemSolving
                                                                }
                                                                /5
                                                              </Body2>
                                                              <div className="flex">
                                                                {getRatingStars(
                                                                  feedback
                                                                    .ratings
                                                                    .problemSolving
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>
                                                          <div>
                                                            <Caption1 className="font-semibold">
                                                              Cultural Fit
                                                            </Caption1>
                                                            <div className="flex items-center gap-2">
                                                              <Body2>
                                                                {
                                                                  feedback
                                                                    .ratings
                                                                    .culturalFit
                                                                }
                                                                /5
                                                              </Body2>
                                                              <div className="flex">
                                                                {getRatingStars(
                                                                  feedback
                                                                    .ratings
                                                                    .culturalFit
                                                                )}
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </div>

                                                        {/* Job Skills Ratings */}
                                                        {feedback.jobSkills &&
                                                          feedback.jobSkills
                                                            .length > 0 && (
                                                            <>
                                                              <Caption1Strong className="mb-2">
                                                                Job-Specific
                                                                Skills
                                                              </Caption1Strong>
                                                              <div className="grid grid-cols-2 gap-4 mb-4">
                                                                {feedback.jobSkills.map(
                                                                  (
                                                                    skill: any,
                                                                    idx: number
                                                                  ) => (
                                                                    <div
                                                                      key={idx}
                                                                    >
                                                                      <Caption1 className="font-semibold">
                                                                        {
                                                                          skill.skillName
                                                                        }
                                                                      </Caption1>
                                                                      <div className="flex items-center gap-2">
                                                                        <Body2>
                                                                          {
                                                                            skill.rating
                                                                          }
                                                                          /5
                                                                        </Body2>
                                                                        <div className="flex">
                                                                          {getRatingStars(
                                                                            skill.rating
                                                                          )}
                                                                        </div>
                                                                      </div>
                                                                    </div>
                                                                  )
                                                                )}
                                                              </div>
                                                            </>
                                                          )}

                                                        <Divider className="my-4" />

                                                        {
                                                          (feedback.recommendation==='Not Recommend' || feedback.recommendation==='Strongly Not Recommend') && (
                                                            <div className="grid grid-cols-1 gap-4">
                                                              <div>
                                                                <Caption1Strong>
                                                                  Rejected Reason:
                                                                </Caption1Strong>
                                                                <Caption1 className="ml-1">
                                                                  {feedback.rejectedReason || "Not provided"}
                                                                </Caption1>
                                                              </div>
                                                            </div>
                                                          )
                                                        }

                                                        {(feedback.recommendation==='Recommend' || feedback.recommendation==='Strongly Recommend') && (
                                                          <div className="grid grid-cols-1 gap-4">
                                                            <div>
                                                              <Caption1Strong>
                                                                Strengths / Weaknesses:
                                                              </Caption1Strong>
                                                              <Caption1 className="ml-1">
                                                              {feedback.strengths ||
                                                                "Not provided"}
                                                            </Caption1>
                                                          </div>
                                                          {/* <div>
                                                            <Caption1Strong>
                                                              Weaknesses:
                                                            </Caption1Strong>
                                                            <Caption1 className="ml-1">
                                                              {feedback.weaknesses ||
                                                                "Not provided"}
                                                            </Caption1>
                                                          </div> */}
                                                          <div>
                                                            <Caption1Strong>
                                                              Recommended Salary:
                                                            </Caption1Strong>
                                                            <Caption1 className="ml-1">
                                                              {feedback.recommendedSalary?`₹${feedback.recommendedSalary}`:"Not provided" }
                                                            </Caption1>
                                                          </div>
                                                          <div>
                                                            <Caption1Strong>
                                                              Additional
                                                              Comments:
                                                            </Caption1Strong>
                                                            <Caption1 className="ml-1">
                                                              {feedback.additionalComments ||
                                                                "None"}
                                                            </Caption1>
                                                          </div>
                                                        </div>)}
                                                        <div className="mt-4 text-xs text-gray-600">
                                                          <span>
                                                            Created:{" "}
                                                            {formatDateTime(
                                                              feedback.feedbackCreatedAt
                                                            )}
                                                          </span>
                                                          {feedback.feedbackModifiedAt && (
                                                            <span className="ml-2">
                                                              Modified:{" "}
                                                              {formatDateTime(
                                                                feedback.feedbackModifiedAt
                                                              )}
                                                            </span>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </CardPreview>
                                                  </Card>
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}

                  {/* Manual Feedback */}

                  {isExpanded && hasManualFeedback && (
                    <div className="mt-4 ml-6 overflow-hidden">
                      {stage.manualFeedback.map(
                        (interview: any, interviewIndex) => {


                          return (
                            <div
                              key={interview.interviewId}
                              className="relative overflow-hidden"
                            >
                              <div className="flex items-start gap-4 mb-4 overflow-hidden">


                                {/* Interview Content */}
                                <div className="flex-1 min-w-0">
                                  <Card className="shadow-sm w-full">

                                    <CardPreview>
                                      <div className="px-4 py-4 overflow-hidden w-full">
                                        <div className="flex flex-col gap-3 mb-3">
                                          <Subtitle2>
                                            Feedback
                                          </Subtitle2>
                                          <Body1 style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
                                            {interview.additionalComments?.split("\n").map((line: string, i: number) => (
                                              <span key={i}>{line}{i < (interview.additionalComments?.split("\n").length ?? 1) - 1 && <br />}</span>
                                            ))}
                                          </Body1>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                          <Subtitle2>Recommended Salary</Subtitle2>
                                          <Body1>{interview.recommendedSalary}</Body1>
                                        </div>
                                      </div>
                                    </CardPreview>
                                  </Card>


                                </div>
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <Toaster toasterId={toasterId} />
    </div>
  );
};

export default ApplicantLifecycleStepper;
