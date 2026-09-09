import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Text,
  Button,
  Caption1,
  Subtitle2,
  CardPreview,
  MessageBar,
  MessageBarBody,
  Spinner,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  FluentProvider,
  Body1Strong,
} from "@fluentui/react-components";
import {
  CalendarEmptyRegular,
  AddRegular,
  Dismiss24Regular,
  CalendarLtr20Filled,
  People16Regular,
  PlayCircle20Regular,
  PauseCircle20Regular,
  ApprovalsApp16Regular,
  CalendarCancel20Regular,
} from "@fluentui/react-icons";
import InterviewSchedule from "../Components/InterviewSchedule";
import CalendarView from "../Components/CalendarView";
import { useNavigate } from "react-router-dom";
import {
  cancelInterview,
  getAllInterviewDetails,
  getInterviewDetailsByInterviewer,
  getInterviewDetailsByTeam,
  rescheduleInterview,
} from "../../Services/InterviewScheduling";
import { useAuth } from "../../Auth/AuthProvider";
import CustomStatsCard from "../Components/CustomStatsCard";

interface InterviewData {
  InterviewID: string;
  InterviewTitle: string;
  InterviewType: string;
  ScheduledDateTime: string;
  Duration: number;
  InterviewStatus: string;
  Location?: string;
  MeetingLink?: string;
  InterviewNotes: string;
  ApplicantID: string;
  ApplicantCode: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  JobPostingID: string;
  JobRole: string;
  Department: string;
  JobLocation: string;
  PipelineStageName: string;
  JobSkills: string;
  ApplicantPipelineID: string;
}

interface TransformedInterview {
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
}

const NoInterviewsState = ({
  statusFilter,
  onCreateNewJob,
}: {
  statusFilter: string;
  onCreateNewJob: () => void;
}) => {
  const getMessageForFilter = (filter: string) => {
    switch (filter) {
      case "scheduled":
        return "No scheduled interviews found";
      case "completed":
        return "No completed interviews found";
      case "cancelled":
        return "No cancelled interviews found";
      case "rescheduled":
        return "No rescheduled interviews found";
      default:
        return "No interviews available";
    }
  };

  const getSubMessageForFilter = (filter: string) => {
    switch (filter) {
      case "scheduled":
        return "You don't have any upcoming scheduled interviews at the moment.";
      case "completed":
        return "You haven't completed any interviews yet.";
      case "cancelled":
        return "No interviews have been cancelled.";
      case "rescheduled":
        return "No interviews have been rescheduled.";
      default:
        return "Start by creating a new job posting to begin scheduling interviews.";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="text-gray-400">
        <CalendarEmptyRegular style={{ fontSize: "64px" }} />
      </div>
      <div className="text-center space-y-2">
        <div>
          <Text size={500} weight="semibold" className="text-gray-700">
            {getMessageForFilter(statusFilter)}
          </Text>
        </div>

        <Text size={300} className="text-gray-500 max-w-md">
          {getSubMessageForFilter(statusFilter)}
        </Text>
      </div>
      {statusFilter === "all" && (
        <Button
          appearance="primary"
          size="medium"
          onClick={onCreateNewJob}
          icon={<AddRegular />}
        >
          Create New Job Posting
        </Button>
      )}
    </div>
  );
};

export default function HiringDashboard() {
  const [
    selectedInterview,
    setSelectedInterview,
  ] = useState<TransformedInterview | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [interviews, setInterviews] = useState<TransformedInterview[]>([]);
  const [loading, setLoading] = useState(true);
  // Full-page spinner only for the very first load; later fetches (search,
  // pagination, status change) show the loader inside the table instead.
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [paginationMeta, setPaginationMeta] = useState({ total: 0, totalPages: 0 });
  const [statusCounts, setStatusCounts] = useState({
    total: 0, scheduled: 0, completed: 0, cancelled: 0, rescheduled: 0,
  });
  const navigate = useNavigate();
  const { currentUser, accessToken, refreshToken }: any = useAuth();
  // Helper function to safely check permissions
  const checkPermission = (permissionPath: string) => {
    const paths = permissionPath.split(".");
    let current = currentUser?.permissions;

    for (const path of paths) {
      if (!current || current[path] === undefined) {
        return false;
      }
      current = current[path];
    }

    return current === true;
  };

  // Permission checks
  const canCreateJob = checkPermission("recruit.job_posting.create_job");

  const canModifyInterview = checkPermission(
    "recruit.interview_schedule.modify_interview"
  );

  // Dashboard view permissions - determine which interviews user can view
  const canViewAllInterviews = checkPermission(
    "recruit.interview_feedback.view_all_feedback"
  );
  const canViewMyInterviews = checkPermission(
    "recruit.interview_feedback.view_my_feedback"
  );

  // Determine hiring dashboard permission level

  // Check if user has any access to hiring dashboard
  const hasHiringDashboardAccess = canViewAllInterviews || canViewMyInterviews;

  const transformInterviewData = (
    apiData: InterviewData[]
  ): TransformedInterview[] => {
    return apiData.map((item: any) => {
      // console.log(item);
      let interviewers = [];

      if (item.interviewers && Array.isArray(item.interviewers)) {
        interviewers = item.interviewers;
      } else if (item.Interviewers && Array.isArray(item.Interviewers)) {
        interviewers = item.Interviewers;
      } else if (item.InterviewersJson) {
        try {
          const parsed = JSON.parse(item.InterviewersJson);
          interviewers = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          console.warn("Error parsing InterviewersJson:", error);
          interviewers = [];
        }
      }

      const normalizedInterviewers = interviewers.map((interviewer: any) => ({
        id: interviewer.id || interviewer.interviewerId || interviewer.ID,
        displayName:
          interviewer.displayName ||
          interviewer.name ||
          interviewer.DisplayName ||
          "Unknown User",
        email: interviewer.email || interviewer.Email || "unknown@email.com",
        role: interviewer.role || interviewer.Role || "Interviewer",
        isPrimary:
          interviewer.isPrimary === true ||
          interviewer.isPrimary === "true" ||
          interviewer.IsPrimary === true,
      }));

      // console.log(
      //   "Transformed interview interviewers:",
      //   normalizedInterviewers
      // );

      return {
        ID: item.InterviewID,
        InterviewTitle: item.InterviewTitle,
        InterviewType: item.InterviewType,
        ScheduledDateTime: item.ScheduledDateTime,
        Duration: item.Duration,
        Status: item.InterviewStatus,
        Location: item.Location || undefined,
        MeetingLink: item.MeetingLink || undefined,
        ApplicantName: `${item.FirstName} ${item.LastName}`,
        JobRole: item.JobRole,
        Notes: item.InterviewNotes || "",
        Department: item.Department,
        JobLocation: item.JobLocation,
        ApplicantCode: item.ApplicantCode,
        ApplicantEmail: item.Email,
        ApplicantPhone: item.Phone,
        PipelineStage: item.PipelineStageName,
        JobSkills: item.JobSkills
          ? item.JobSkills.replace(" ", "").split(",")
          : [],
        Email: item.Email,
        ApplicantID: item.ApplicantID,
        JobPostingID: item.JobPostingID,
        MinSalaryRange: item.MinSalaryRange,
        MaxSalaryRange: item.MaxSalaryRange,
        ApplicantPipelineID: item.CurrentPipelineID,
        interviewers: normalizedInterviewers,
        isTeamsmeeting: item.IsTeamsMeeting,
        OutlookEventID: item.OutlookEventID || item.outlookEventId,
      };
    });
  };

  const fetchInterviews = useCallback(
    async (fetchPage: number, fetchPageSize: number, fetchStatus?: string, fetchSearch?: string) => {
      if (!hasHiringDashboardAccess) {
        setLoading(false);
        setInitialLoad(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        let response;

        if (canViewAllInterviews) {
          response = await getAllInterviewDetails(accessToken, fetchPage, fetchPageSize, fetchStatus, fetchSearch);
        } else if (canViewMyInterviews) {
          response = await getInterviewDetailsByInterviewer(
            currentUser.userID,
            accessToken,
            fetchPage,
            fetchPageSize,
            fetchStatus,
            fetchSearch
          );
        }

        if (response?.success) {
          const transformedData = transformInterviewData(response.data || []);
          setInterviews(transformedData);
          if (response.pagination) {
            setPaginationMeta({
              total: response.pagination.total,
              totalPages: response.pagination.totalPages,
            });
            setPage(response.pagination.page);
            setPageSize(response.pagination.pageSize);
          }
          if (response.statusCounts) {
            setStatusCounts(response.statusCounts);
          }
        } else {
          setInterviews([]);
        }
      } catch (err) {
        console.error("Error fetching interviews:", err);
        setError("Error loading interviews. Please try again.");
      } finally {
        setLoading(false);
        setInitialLoad(false);
      }
    },
    [
      hasHiringDashboardAccess,
      canViewAllInterviews,
      canViewMyInterviews,
      accessToken,
      currentUser?.userID,
    ]
  );

  useEffect(() => {
    if (currentUser?.userID) {
      fetchInterviews(1, 20);
    }
  }, [
    currentUser?.userID,
    canViewAllInterviews,
    canViewMyInterviews,
    hasHiringDashboardAccess,
    fetchInterviews,
  ]);

  const interviewStats = {
    total:       statusCounts.total,
    scheduled:   statusCounts.scheduled,
    completed:   statusCounts.completed,
    cancelled:   statusCounts.cancelled,
    rescheduled: statusCounts.rescheduled,
  };

  const handleCardClick = (status: string) => {
    const newFilter = status.toLowerCase();
    setStatusFilter(newFilter);
    setPage(1);
    fetchInterviews(1, pageSize, newFilter === "all" ? undefined : newFilter, search);
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    fetchInterviews(1, pageSize, status === "all" ? undefined : status, search);
  };

  // Server-side search — called (debounced) from InterviewSchedule
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchInterviews(1, pageSize, activeStatus, value);
  };

  // Clear all filters — reset status + search + page in a single fetch so the
  // Clear button reflects immediately (no stale-search race).
  const handleClearFilters = () => {
    setStatusFilter("all");
    setSearch("");
    setPage(1);
    fetchInterviews(1, pageSize, undefined, "");
  };

  const onCancelInterview = async (cancelRequest: any) => {
    // Add permission check
    if (!canModifyInterview) {
      throw new Error("You don't have permission to cancel interviews");
    }

    try {
      return await refreshToken().then(async (aa: any) => {
        // console.log(cancelRequest);
        const result = await cancelInterview(
          cancelRequest,
          accessToken,
          currentUser.calendarId
        );

        return result;
      });
    } catch (error) {
      console.error("Error cancelling interview:", error);
      throw error;
    }
  };
  const onRescheduleInterview = async (updatedInterview: any) => {
    // Add permission check
    if (!canModifyInterview) {
      throw new Error("You don't have permission to reschedule interviews");
    }

    try {
      return await refreshToken().then(async (aa: any) => {
        // console.log(updatedInterview);
        const result = await rescheduleInterview(
          { ...updatedInterview, newType: updatedInterview.type },
          accessToken,
          currentUser.calendarId,
          currentUser.displayName,
          currentUser.email
        );

        return result;
      });
    } catch (error) {
      console.error("Error rescheduling interview:", error);
      throw error;
    }
  };

  const activeStatus = statusFilter === "all" ? undefined : statusFilter;

  const handleRefresh = () => {
    fetchInterviews(page, pageSize, activeStatus, search);
  };

  const handleServerPageChange = (newPage: number) => {
    setPage(newPage);
    fetchInterviews(newPage, pageSize, activeStatus, search);
  };

  const handleServerPageSizeChange = (newPageSize: number) => {
    setPage(1);
    setPageSize(newPageSize);
    fetchInterviews(1, newPageSize, activeStatus, search);
  };

  const handleCreateNewJob = () => {
    navigate("/recruit/newJDForm");
  };

  const filteredInterviews = useMemo(() => {
  return interviews.filter((interview) => {
    if (statusFilter === "all") return true;
    return interview.Status.toLowerCase() === statusFilter;
  });
}, [interviews, statusFilter]);

  if (initialLoad) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">
          Loading Hiring Dashboard...
        </Body1Strong>
      </div>
    );
  }

  if (!hasHiringDashboardAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 h-full">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
          <CalendarEmptyRegular
            style={{ fontSize: "64px" }}
            className="text-blue-600"
          />
        </div>
        <Subtitle2 className="mb-3 text-gray-700">No Access</Subtitle2>
        <Text className="text-gray-500 max-w-md mx-auto text-center leading-relaxed">
          You don't have permission to view the hiring dashboard. Please contact
          your administrator to request access.
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
    <div className="mx-auto">
      <div className="mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex justify-between items-center w-full">
            <Subtitle2 className="text-[#063762]">Hiring Dashboard</Subtitle2>
            <Button
              appearance="outline"
              size="medium"
              shape="circular"
              onClick={() => setIsCalendarOpen(true)}
              style={{
                color: "#626262",
                backgroundColor: "#FFFFFF4F",
                border: "1px solid #fff",
                fontWeight: 500,
                padding: "13px 18px",
                display: "flex",
                gap: "6px",
              }}

              icon={<div
                className="rounded-full p-1 flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)",
                }}
              >
                <CalendarLtr20Filled
                  style={{

                    color: "#FFF",

                  }}

                />                    </div>}
            >
              {/* Calendar View */}
              Interview Calendar

            </Button>
            {/* <div>
              <Caption1 className="text-gray-600">
                Manage interviews, track applicants, and provide feedback
              </Caption1>
            </div> */}
          </div>
          {/* <div className="flex gap-2">
            {canCreateJob && (
              <Button
                appearance="primary"
                size="medium"
                shape="circular"
                style={{ padding: "8px 15px" }}
                className="!text-[#626262] !bg-[#ffffff30] !border-[#ffffff90] hover:!bg-[#ffffff10] gap-[6px]"
                onClick={handleCreateNewJob}
              >
                <span
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(1, 83, 165, 1) 0%, rgba(47, 194, 254, 1) 100%)",
                    height: "30px",
                    width: "30px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AddRegular
                    style={{ height: "20px", width: "20px", color: "fff" }}
                  />
                </span>{" "}
                New Job Request
              </Button>
            )}
          </div> */}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <CustomStatsCard
            style={`${statusFilter === "scheduled"
                ? "ring-2 ring-blue-500 shadow-lg"
                : ""
              }`}
            onClick={() => handleCardClick("scheduled")}
          >
            <CardPreview className="py-[17px] px-[20px]">
              <div className="!flex flex-row items-center justify-between">
                <div className="flex flex-col gap-[11px]">
                  <div>
                    <Text
                      size={300}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      Scheduled
                    </Text>
                  </div>
                  <div>
                    <Text
                      size={600}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      {interviewStats.scheduled}
                    </Text>
                  </div>
                </div>
                <div className="bg-[#EFF6FF] rounded-full p-[15px]">
                  <PlayCircle20Regular
                    style={{ height: "30px", width: "30px", color: "#00C448" }}
                  />
                </div>
              </div>
            </CardPreview>
          </CustomStatsCard>

          <CustomStatsCard
            style={`${statusFilter === "completed"
                ? "ring-2 ring-green-500 shadow-lg"
                : ""
              }`}
            onClick={() => handleCardClick("completed")}
          >
            <CardPreview className="py-[17px] px-[20px]">
              <div className="!flex flex-row items-center justify-between">
                <div className="flex flex-col gap-[11px]">
                  <div>
                    <Text
                      size={300}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      Completed
                    </Text>
                  </div>
                  <div>
                    <Text
                      size={600}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      {interviewStats.completed}
                    </Text>
                  </div>
                </div>
                <div className="bg-[#FFFCE0] rounded-full p-[15px]">
                  <PauseCircle20Regular
                    style={{ height: "30px", width: "30px", color: "#E97548" }}
                  />
                </div>
              </div>
            </CardPreview>
          </CustomStatsCard>

          <CustomStatsCard
            style={`${statusFilter === "rescheduled"
                ? "ring-2 ring-yellow-500 shadow-lg"
                : ""
              }`}
            onClick={() => handleCardClick("rescheduled")}
          >
            <CardPreview className="py-[17px] px-[20px]">
              <div className="!flex flex-row items-center justify-between">
                <div className="flex flex-col gap-[11px]">
                  <div>
                    <Text
                      size={300}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      Re-Scheduled
                    </Text>
                  </div>
                  <div>
                    <Text
                      size={600}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      {interviewStats.rescheduled}
                    </Text>
                  </div>
                </div>
                <div className="bg-[#FEF2F2] rounded-full p-[15px]">
                  <ApprovalsApp16Regular
                    style={{ height: "30px", width: "30px", color: "#A855F7" }}
                  />
                </div>
              </div>
            </CardPreview>
          </CustomStatsCard>

          <CustomStatsCard
            style={`${statusFilter === "cancelled"
                ? "ring-2 ring-red-500 shadow-lg"
                : ""
              }`}
            onClick={() => handleCardClick("cancelled")}
          >
            <CardPreview className="py-[17px] px-[20px]">
              <div className="!flex flex-row items-center justify-between">
                <div className="flex flex-col gap-[11px]">
                  <div>
                    <Text
                      size={300}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      Cancelled
                    </Text>
                  </div>
                  <div>
                    <Text
                      size={600}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      {interviewStats.cancelled}
                    </Text>
                  </div>
                </div>
                <div className="bg-[#FFFEFE] rounded-full p-[15px]">
                  <CalendarCancel20Regular
                    style={{ height: "30px", width: "30px", color: "#E73550" }}
                  />
                </div>
              </div>
            </CardPreview>
          </CustomStatsCard>
          <CustomStatsCard
            style={`${statusFilter === "all" ? "ring-2 ring-purple-500 shadow-lg" : ""
              }`}
            onClick={() => handleCardClick("all")}
          >
            <CardPreview className="py-[17px] px-[20px]">
              <div className="!flex flex-row items-center justify-between">
                <div className="flex flex-col gap-[11px]">
                  <div>
                    <Text
                      size={300}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      Total
                    </Text>
                  </div>
                  <div>
                    <Text
                      size={600}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      {interviewStats.total}
                    </Text>
                  </div>
                </div>
                <div className="bg-[#F1F9FF] rounded-full p-[15px]">
                  <People16Regular
                    style={{ height: "30px", width: "30px", color: "#0078D4" }}
                  />
                </div>
              </div>
            </CardPreview>
          </CustomStatsCard>
        </div>

        {/* Filter indicator */}
        {/* {statusFilter !== "all" && (
          <MessageBar key={"info"} intent={"info"}>
            <MessageBarBody>
              <div className="flex items-center gap-2 p-2 rounded-lg">
                <Caption1 className="text-blue-800">
                  Showing {statusFilter} interviews only. Click "Total" card to
                  view all interviews.
                </Caption1>
              </div>
            </MessageBarBody>
          </MessageBar>
        )} */}

        {/* Main Content - Interview Schedule */}
        <div className="space-y-4">
          {/* Genuinely-empty dashboard (no interviews, no active search, not
              loading) shows the create-job CTA. Otherwise render the table so
              the search box + in-table loader + "no results" state stay visible. */}
          {!loading && !search && filteredInterviews.length === 0 ? (
            <Card className="p-6">
              <NoInterviewsState
                statusFilter={statusFilter}
                onCreateNewJob={handleCreateNewJob}
              />
            </Card>
          ) : (
            <InterviewSchedule
              interviews={interviews}
              onSelectInterview={setSelectedInterview}
              statusFilter={statusFilter}
              onRefresh={handleRefresh}
              onCancelInterview={onCancelInterview}
              onRescheduleInterview={onRescheduleInterview}
              isLoading={loading}
              serverPagination={(canViewAllInterviews || canViewMyInterviews) ? {
                page,
                pageSize,
                total: paginationMeta.total,
                totalPages: paginationMeta.totalPages,
              } : undefined}
              showFeedBack={canViewAllInterviews}
              onServerPageChange={(canViewAllInterviews || canViewMyInterviews) ? handleServerPageChange : undefined}
              onServerPageSizeChange={(canViewAllInterviews || canViewMyInterviews) ? handleServerPageSizeChange : undefined}
              onStatusFilterChange={(canViewAllInterviews || canViewMyInterviews) ? handleStatusFilterChange : undefined}
              onSearchChange={(canViewAllInterviews || canViewMyInterviews) ? handleSearchChange : undefined}
              onClearFilters={(canViewAllInterviews || canViewMyInterviews) ? handleClearFilters : undefined}
            />
          )}
        </div>

        {/* Calendar Drawer */}
        <Drawer
          type="overlay"
          separator
          open={isCalendarOpen}
          onOpenChange={(_, { open }) => setIsCalendarOpen(open)}
          position="end"
          size="large"
        >
          <DrawerHeader>
            <DrawerHeaderTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="Close"
                  icon={<Dismiss24Regular />}
                  onClick={() => setIsCalendarOpen(false)}
                />
              }
            >
              Interview Calendar
            </DrawerHeaderTitle>
          </DrawerHeader>

          <DrawerBody>
            {interviews.length === 0 ? (
              <NoInterviewsState
                statusFilter="all"
                onCreateNewJob={handleCreateNewJob}
              />
            ) : (
              <CalendarView interviews={interviews} />
            )}
          </DrawerBody>
        </Drawer>
      </div>
    </div>
  );
}
