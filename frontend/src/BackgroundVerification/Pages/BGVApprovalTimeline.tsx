import React from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  Badge,
  Text,
  Caption1,
  Body1,
  Subtitle2,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Regular,
  DismissCircle24Regular,
  Clock24Regular,
  Document24Regular,
  Person24Regular,
  Send24Regular,
} from "@fluentui/react-icons";

interface ApprovalHistoryItem {
  ApprovalHistoryID: string;
  BGVRequestID: string;
  Action: string;
  ActionBy: string;
  ActionDate: string;
  Comments: string;
}

interface BGVTimelineProps {
  bgvRequest: any;
  approvalHistory: ApprovalHistoryItem[];
  className?: string;
}

interface TimelineStage {
  id: string;
  name: string;
  status: "completed" | "current" | "pending" | "rejected";
  date?: string;
  actionBy?: string;
  comments?: string;
  icon: React.ReactNode;
  order: number;
  historyItems?: ApprovalHistoryItem[];
}

export const BGVApprovalTimeline: React.FC<BGVTimelineProps> = ({
  bgvRequest,
  approvalHistory,
  className = "",
}) => {
  // Define the standard BGV workflow stages - exactly 4 steps
  const getTimelineStages = (): TimelineStage[] => {
    const currentStatus = bgvRequest.Status?.toLowerCase();

    // Step 1: Created (always completed if we have the request)
    const createdStage: TimelineStage = {
      id: "created",
      name: "Request Created",
      status: "completed",
      date: bgvRequest.CreatedDate,
      actionBy: bgvRequest.CreatedBy,
      comments: "",
      icon: <Document24Regular />,
      order: 1,
      historyItems: [],
    };

    // Step 2: Submitted - Show as pending if not approved/rejected yet
    const isReviewed = bgvRequest.ApprovedDate || bgvRequest.RejectedDate;
    const submittedStage: TimelineStage = {
      id: "submitted",
      name: "Request Submitted",
      status: isReviewed
        ? "completed"
        : bgvRequest.SubmittedDate
        ? "current"
        : "pending",
      date: bgvRequest.SubmittedDate,
      actionBy: bgvRequest.SubmittedDate ? bgvRequest.CreatedBy : undefined,
      comments: "",
      icon: <Send24Regular />,
      order: 2,
      historyItems: [],
    };

    // Step 3: Approved/Rejected - Include approval history
    let reviewStage: TimelineStage;
    const reviewHistory = approvalHistory.filter(
      (h) =>
        h.Action.toLowerCase() === "approve" ||
        h.Action.toLowerCase() === "reject"
    );

    if (currentStatus === "approved" || bgvRequest.ApprovedDate) {
      reviewStage = {
        id: "approved",
        name: "Request Approved",
        status: "completed",
        date: bgvRequest.ApprovedDate,
        actionBy: bgvRequest.ApprovedBy,
        comments:
          approvalHistory.find((h) => h.Action.toLowerCase() === "approve")
            ?.Comments || "",
        icon: <CheckmarkCircle24Regular />,
        order: 3,
        historyItems: reviewHistory,
      };
    } else if (currentStatus === "rejected" || bgvRequest.RejectedDate) {
      reviewStage = {
        id: "rejected",
        name: "Request Rejected",
        status: "rejected",
        date: bgvRequest.RejectedDate,
        actionBy: bgvRequest.RejectedBy,
        comments:
          bgvRequest.RejectionReason ||
          approvalHistory.find((h) => h.Action.toLowerCase() === "reject")
            ?.Comments ||
          "",
        icon: <DismissCircle24Regular />,
        order: 3,
        historyItems: reviewHistory,
      };
    } else if (bgvRequest.SubmittedDate) {
      // Submitted but pending review
      reviewStage = {
        id: "pending_review",
        name: "Under Review",
        status: "pending",
        date: undefined,
        actionBy: undefined,
        comments: "",
        icon: <Person24Regular />,
        order: 3,
        historyItems: [],
      };
    } else {
      // Not yet submitted
      reviewStage = {
        id: "pending_review",
        name: "Pending Review",
        status: "pending",
        date: undefined,
        actionBy: undefined,
        comments: "",
        icon: <Person24Regular />,
        order: 3,
        historyItems: [],
      };
    }

    // Step 4: Completed
    const completedStage: TimelineStage = {
      id: "completed",
      name: "BGV Completed",
      status:
        currentStatus === "completed" || bgvRequest.CompletedDate
          ? "completed"
          : "pending",
      date: bgvRequest.CompletedDate,
      actionBy: bgvRequest.CompletedDate ? bgvRequest.ModifiedBy : undefined,
      comments: "",
      icon: <CheckmarkCircle24Regular />,
      order: 4,
      historyItems: [],
    };

    return [createdStage, submittedStage, reviewStage, completedStage];
  };

  const stages = getTimelineStages();

  const getStageStyles = (stage: TimelineStage) => {
    switch (stage.status) {
      case "completed":
        return {
          circle: "bg-green-500 border-green-500 text-white shadow-lg",
          connector: "bg-green-300",
          text: "text-green-700 font-semibold",
          badge: "bg-green-100 text-green-800 border-green-200",
        };
      case "current":
        return {
          circle:
            "bg-blue-500 border-blue-500 text-white shadow-lg ring-4 ring-blue-200 animate-pulse",
          connector: "bg-gray-300",
          text: "text-blue-700 font-semibold",
          badge: "bg-blue-100 text-blue-800 border-blue-200",
        };
      case "rejected":
        return {
          circle: "bg-red-500 border-red-500 text-white shadow-lg",
          connector: "bg-red-300",
          text: "text-red-700 font-semibold",
          badge: "bg-red-100 text-red-800 border-red-200",
        };
      case "pending":
      default:
        return {
          circle: "bg-gray-300 border-gray-400 text-gray-600 shadow-sm",
          connector: "bg-gray-200",
          text: "text-gray-600",
          badge: "bg-gray-100 text-gray-600 border-gray-200",
        };
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserDisplayName = (userId?: string) => {
    if (!userId || userId === "00000000-0000-0000-0000-000000000000") {
      return "";
    }
    // You can replace this with actual user name lookup logic
    return `User ${userId.substring(0, 8)}...`;
  };

  const getCompletedStagesCount = () => {
    return stages.filter((stage) => stage.status === "completed").length;
  };

  const progressPercentage = Math.max(
    0,
    Math.min(100, (getCompletedStagesCount() / stages.length) * 100)
  );

  return (
    <Card
      className={`bg-gradient-to-br from-gray-50 to-white shadow-sm border border-gray-200 ${className}`}
    >
      <CardHeader
        header={
          <div className="flex justify-between items-center w-full">
            <Subtitle2>Request Timeline</Subtitle2>
            <Badge appearance="outline" className="text-xs">
              Step {getCompletedStagesCount()} of {stages.length}
            </Badge>
          </div>
        }
      />

      <CardPreview>
        <div className="relative px-6 pb-6">
          {/* Progress Line Background */}
          <div
            className="absolute top-8 h-1 bg-gray-200 rounded-full"
            style={{
              left: "3rem",
              right: "3rem",
              zIndex: 0,
            }}
          />

          {/* Active Progress Line */}
          <div
            className="absolute top-8 h-1 rounded-full transition-all duration-700 ease-in-out"
            style={{
              left: "3rem",
              width:
                progressPercentage > 0
                  ? `calc(${progressPercentage}% - 1.5rem)`
                  : "0%",
              backgroundColor: stages.some((s) => s.status === "rejected")
                ? "#ef4444"
                : "#22c55e",
              zIndex: 1,
            }}
          />

          {/* Timeline Steps */}
          <div className="flex justify-between items-start relative z-10">
            {stages.map((stage, index) => {
              const styles = getStageStyles(stage);

              return (
                <div
                  key={stage.id}
                  className="flex flex-col items-center"
                  style={{ width: "25%" }}
                >
                  {/* Step Number and Icon */}
                  <div className="relative mb-4">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${styles.circle}`}
                    >
                      <div className="flex flex-col items-center">
                        {React.cloneElement(stage.icon as React.ReactElement, {
                          style: { fontSize: "20px" },
                        })}
                        <Caption1 className="text-xs mt-1 font-bold">
                          {index + 1}
                        </Caption1>
                      </div>
                    </div>
                  </div>

                  {/* Stage Information */}
                  <div className="text-center px-2 max-w-[180px]">
                    {/* Stage Name */}
                    <div
                      className={`text-sm font-semibold mb-2 ${styles.text}`}
                    >
                      {stage.name}
                    </div>

                    {/* Date and Action By - Only show for completed stages */}
                    {stage.status === "completed" && stage.date && (
                      <>
                        <div className="mb-2">
                          <Badge
                            appearance="outline"
                            size="small"
                            className={`text-xs ${styles.badge}`}
                          >
                            {formatDate(stage.date)}
                          </Badge>
                        </div>

                        {stage.actionBy &&
                          stage.actionBy !==
                            "00000000-0000-0000-0000-000000000000" && (
                            <Caption1 className="text-gray-500 text-xs italic">
                              by {getUserDisplayName(stage.actionBy)}
                            </Caption1>
                          )}
                      </>
                    )}

                    {/* Action History for Review Stage */}
                    {(stage.id === "approved" || stage.id === "rejected") &&
                      stage.historyItems &&
                      stage.historyItems.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {stage.historyItems.map((history) => (
                            <div
                              key={history.ApprovalHistoryID}
                              className="bg-white border border-gray-200 rounded-md p-2 text-left shadow-sm"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <div
                                  className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    history.Action.toLowerCase() === "approve"
                                      ? "bg-green-100"
                                      : "bg-red-100"
                                  }`}
                                >
                                  {history.Action.toLowerCase() ===
                                  "approve" ? (
                                    <CheckmarkCircle24Regular
                                      className="text-green-600"
                                      style={{ fontSize: "12px" }}
                                    />
                                  ) : (
                                    <DismissCircle24Regular
                                      className="text-red-600"
                                      style={{ fontSize: "12px" }}
                                    />
                                  )}
                                </div>
                                <Badge
                                  appearance="tint"
                                  size="small"
                                  className={`text-xs ${
                                    history.Action.toLowerCase() === "approve"
                                      ? "bg-green-50 text-green-700"
                                      : "bg-red-50 text-red-700"
                                  }`}
                                >
                                  {history.Action}
                                </Badge>
                              </div>

                              {history.Comments && (
                                <Caption1 className="text-gray-600 text-xs block mb-1">
                                  "{history.Comments}"
                                </Caption1>
                              )}

                              <Caption1 className="text-gray-400 text-xs">
                                {formatDate(history.ActionDate)}
                              </Caption1>

                              {history.ActionBy &&
                                history.ActionBy !==
                                  "00000000-0000-0000-0000-000000000000" && (
                                  <Caption1 className="text-gray-400 text-xs">
                                    by {getUserDisplayName(history.ActionBy)}
                                  </Caption1>
                                )}
                            </div>
                          ))}
                        </div>
                      )}

                    {/* Comments - Only show for review stage if no history items */}
                    {(stage.id === "approved" || stage.id === "rejected") &&
                      stage.comments &&
                      (!stage.historyItems ||
                        stage.historyItems.length === 0) && (
                        <Caption1 className="text-gray-600 block mt-2 leading-tight">
                          "{stage.comments}"
                        </Caption1>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardPreview>
    </Card>
  );
};
