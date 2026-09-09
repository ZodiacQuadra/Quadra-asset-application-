import React, { useState, useEffect } from "react";
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
  FluentProvider,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  Card,
  Caption1,
  Body1Strong,
  Subtitle2,
  Spinner,
  Menu,
  MenuTrigger,
  MenuButton,
  MenuPopover,
  MenuList,
  MenuItem,
  Label,
  Switch,
} from "@fluentui/react-components";
import {
  SearchRegular,
  FilterRegular,
  DismissRegular,
  PersonRegular,
  Eye20Regular,
  CalendarDateRegular,
  Video16Regular,
  PersonFeedbackRegular,
} from "@fluentui/react-icons";
import CustomPagination from "./CustomPagination";
import { ApplicantDrawer } from "../Pages/ApplicantDrawer";
import FeedbackForm from "./FeedbackForm";

// One row per candidate (grouped by applicant pipeline) for view-all users.
export interface CandidateRow {
  ApplicantID: string;
  ApplicantPipelineID: string;
  ApplicantCode: string;
  ApplicantName: string;
  Email: string;
  Phone: string;
  JobRole: string;
  Department: string;
  JobPostingID: string;
  JobLocation: string;
  CurrentStage: string;
  InterviewCount: number;
  LatestInterviewDateTime: string;
  // Normalised upstream to "In-Progress" | "Hired" | "Rejected".
  OverallStatus: string;
  // Set when the current (view-all) user is an interviewer on one of this
  // candidate's interviews and an action is pending: "join" (upcoming) or
  // "feedback" (past, awaiting feedback). null/undefined when no action.
  myActionType?: "join" | "feedback" | null;
  // Meeting link of the candidate's latest interview — drives the always-shown
  // "Join Meeting" link, independent of whether the user is an interviewer.
  latestMeetingLink?: string;
  // Awaiting-feedback interviews (past, not completed/cancelled) mapped to the
  // shape FeedbackForm expects. Drives the "Add Feedback" action.
  feedbackInterviews?: any[];
}

interface CandidateScheduleProps {
  candidates: CandidateRow[];
  statusFilter?: string;
  onRefresh?: () => void;
  serverPagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  onServerPageChange?: (page: number) => void;
  onServerPageSizeChange?: (pageSize: number) => void;
  onStatusFilterChange?: (status: string) => void;
  // Debounced term is sent to the parent to re-fetch (server-side search).
  onSearchChange?: (search: string) => void;
  onClearFilters?: () => void;
  isLoading?: boolean;
}

export default function CandidateSchedule({
  candidates,
  statusFilter = "all",
  onRefresh,
  onStatusFilterChange,
  onSearchChange,
  onClearFilters,
  serverPagination,
  onServerPageChange,
  onServerPageSizeChange,
  isLoading = false,
}: CandidateScheduleProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRow | null>(
    null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Feedback submission (view-all users can add feedback for awaiting-feedback
  // interviews, mirroring the interview-wise table's Add Feedback action).
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedFeedbackInterview, setSelectedFeedbackInterview] = useState<
    any | null
  >(null);

  const openFeedback = (interview: any) => {
    // The candidate row already carries the job's skills (parsed from the
    // JobSkills CSV), so the form opens immediately with the "Job-Specific
    // Skills Assessment" section ready — no fetch needed.
    setSelectedFeedbackInterview(interview);
    setShowFeedbackForm(true);
  };

  const handleFeedbackClose = () => {
    setShowFeedbackForm(false);
    setSelectedFeedbackInterview(null);
  };

  const handleFeedbackSubmit = () => {
    handleFeedbackClose();
    onRefresh?.();
  };

  const generateShareableLink = (interview: any) =>
    `${import.meta.env.VITE_FRONTEND_URL}/#/recruit/HiringDashboard?feedback=${
      interview?.ID
    }`;

  // Keep the dropdown in sync with the parent-driven status filter.
  useEffect(() => {
    setFilterStatus(statusFilter && statusFilter !== "all" ? statusFilter : "all");
  }, [statusFilter]);

  // Debounce server-side search — mirrors InterviewSchedule so behaviour is
  // consistent. Skips the initial mount and dedupes repeat terms.
  const onSearchChangeRef = React.useRef(onSearchChange);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);
  const isFirstSearchRun = React.useRef(true);
  const lastEmittedSearchRef = React.useRef("");
  useEffect(() => {
    if (!onSearchChangeRef.current) return;
    if (isFirstSearchRun.current) {
      isFirstSearchRun.current = false;
      return;
    }
    const handler = setTimeout(() => {
      const value = searchTerm.trim();
      if (value === lastEmittedSearchRef.current) return;
      lastEmittedSearchRef.current = value;
      onSearchChangeRef.current?.(value);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
    if (onClearFilters) {
      lastEmittedSearchRef.current = "";
      onClearFilters();
    } else if (onStatusFilterChange) {
      onStatusFilterChange("all");
    }
  };

  const handlePageChange = (page: number) => {
    onServerPageChange?.(page);
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    onServerPageSizeChange?.(itemsPerPage);
  };

  const openLifecycle = (candidate: CandidateRow) => {
    setSelectedCandidate(candidate);
    setIsDrawerOpen(true);
  };

  const handleJoinMeeting = (meetingLink?: string) => {
    if (!meetingLink) return;
    try {
      const { protocol } = new URL(meetingLink);
      if (["https:", "http:"].includes(protocol)) {
        window.open(meetingLink, "_blank", "noopener,noreferrer");
      }
    } catch {
      // invalid or empty URL — do nothing
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString.replace("Z", ""));
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  // "Action required" cue shown when the logged-in view-all user is an
  // interviewer on one of this candidate's pending interviews.
  const getMyActionBadge = (type?: "join" | "feedback" | null) => {
    if (!type) return null;
    if (type === "join") {
      return (
        <Badge
          appearance="filled"
          size="small"
          color="warning"
          icon={<Video16Regular />}
          style={{ fontSize: "smaller" }}
        >
          Join required
        </Badge>
      );
    }
    return (
      <Badge
        appearance="filled"
        size="small"
        color="warning"
        icon={<PersonFeedbackRegular />}
        style={{ fontSize: "smaller" }}
      >
        Feedback pending
      </Badge>
    );
  };

  const getOverallStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    let color: "success" | "brand" | "danger" | "subtle" = "brand";
    if (s === "hired") color = "success";
    else if (s === "rejected") color = "danger";
    else color = "brand"; // In-Progress
    return (
      <Badge
        appearance="tint"
        size="small"
        color={color}
        style={{ padding: "15px 12px", fontSize: "smaller" }}
      >
        {status || "In-Progress"}
      </Badge>
    );
  };

  return (
    <FluentProvider
      style={{ background: "transparent" }}
      className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white"
    >
      <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white">
        <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-1 min-w-[200px]">
              <Input
                placeholder="Search candidates, roles, departments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                contentAfter={<SearchRegular />}
                className="!w-full !max-w-full !min-w-0 "
              />
            </div>
            <FluentProvider className="flex items-center gap-2">
              <Dropdown
                placeholder="All Status"
                value={filterStatus === "all" ? undefined : filterStatus}
                selectedOptions={[filterStatus]}
                onOptionSelect={(_, data) => {
                  const newStatus = data.optionValue || "all";
                  setFilterStatus(newStatus);
                  onStatusFilterChange?.(newStatus);
                }}
                className="!min-w-[160px]"
              >
                <Option value="all">All Status</Option>
                <Option value="in-progress">In-Progress</Option>
                <Option value="hired">Hired</Option>
                <Option value="rejected">Rejected</Option>
              </Dropdown>

              <Button
                appearance="subtle"
                icon={<FilterRegular />}
                className="!text-red-500 disabled:!text-gray-400 "
                onClick={handleClearFilters}
                disabled={searchTerm === "" && filterStatus === "all"}
              >
                Clear
              </Button>
            </FluentProvider>

            
          </div>

          <Table aria-label="Candidate hiring table" className="w-full">
            <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
              <TableRow className="border-b-2 border-gray-100">
                <TableHeaderCell className="!py-2 px-6">
                  <Body1Strong style={{ fontSize: "12px" }}>Candidate</Body1Strong>
                </TableHeaderCell>
                <TableHeaderCell className="min-w-[200px]">
                  <Body1Strong style={{ fontSize: "12px" }}>Job Role</Body1Strong>
                </TableHeaderCell>
                <TableHeaderCell className="min-w-[150px]">
                  <Body1Strong style={{ fontSize: "12px" }}>Current Stage</Body1Strong>
                </TableHeaderCell>
                <TableHeaderCell className="min-w-[160px]">
                  <Body1Strong style={{ fontSize: "12px" }}>Interviews</Body1Strong>
                </TableHeaderCell>
                <TableHeaderCell className="min-w-[130px]">
                  <Body1Strong style={{ fontSize: "12px" }}>Overall Status</Body1Strong>
                </TableHeaderCell>
                <TableHeaderCell className="min-w-[140px]">
                  <Body1Strong style={{ fontSize: "12px" }}>Actions</Body1Strong>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <div className="flex flex-col items-center justify-center py-16">
                      <Spinner />
                      <Text className="mt-3 text-gray-500">Loading candidates...</Text>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                candidates.map((candidate) => (
                  <TableRow
                    key={candidate.ApplicantPipelineID || candidate.ApplicantID}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      candidate.myActionType ? "bg-[#FFF8EC]" : ""
                    }`}
                    style={
                      candidate.myActionType
                        ? { boxShadow: "inset 3px 0 0 0 #E9A100" }
                        : undefined
                    }
                    onClick={() => openLifecycle(candidate)}
                  >
                    {/* Candidate Cell */}
                    <TableCell style={{ padding: "15px 5px" }}>
                      <div className="flex items-center gap-2">
                        <Avatar
                          name={candidate.ApplicantName}
                          size={32}
                          className="flex-shrink-0"
                        />
                        <div>
                          <Text weight="medium" style={{ color: "#007ED5" }}>
                            {candidate.ApplicantName}
                          </Text>
                          {candidate.ApplicantCode && (
                            <div className="text-xs text-gray-500">
                              {candidate.ApplicantCode}
                            </div>
                          )}
                          {candidate.myActionType === "feedback" && (
                            <div className="mt-1">
                              {getMyActionBadge("feedback")}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Job Role Cell */}
                    <TableCell style={{ padding: "15px 5px" }}>
                      <div className="space-y-1">
                        <span
                          style={{ fontSize: "14px" }}
                          className="text-[#1F2937] font-semibold text-sm"
                        >
                          {candidate.JobRole}
                        </span>
                        <div className="flex items-center text-xs text-gray-600">
                          <span className="text-[#9DA3AA]">
                            {candidate.Department}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Current Stage Cell */}
                    <TableCell style={{ padding: "15px 5px" }}>
                      {candidate.CurrentStage ? (
                        <Badge
                          appearance="tint"
                          size="small"
                          color="brand"
                          style={{ padding: "15px 12px", fontSize: "smaller" }}
                        >
                          {candidate.CurrentStage}
                        </Badge>
                      ) : (
                        <Text className="!text-xs text-gray-400">—</Text>
                      )}
                    </TableCell>

                    {/* Interviews Cell */}
                    <TableCell style={{ padding: "15px 5px" }}>
                      <div className="flex flex-col gap-1">
                        <Text className="!text-xs">
                          {candidate.InterviewCount || 0} interview
                          {candidate.InterviewCount === 1 ? "" : "s"}
                        </Text>
                        {candidate.LatestInterviewDateTime && (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            <CalendarDateRegular className="w-4 h-4 text-[#0078D4]" />
                            <Caption1 className="!text-xs">
                              {formatDate(candidate.LatestInterviewDateTime)}
                            </Caption1>
                          </div>
                        )}
                        {candidate.latestMeetingLink ? (
                          <div
                            className="flex items-center text-xs text-blue-600 hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinMeeting(candidate.latestMeetingLink);
                            }}
                          >
                            <Video16Regular className="w-4 h-4 mr-1" />
                            <span>Join Meeting</span>
                          </div>
                        ) : (
                          candidate.myActionType === "join" &&
                          getMyActionBadge("join")
                        )}
                      </div>
                    </TableCell>

                    {/* Overall Status Cell */}
                    <TableCell style={{ padding: "15px 5px" }}>
                      {getOverallStatusBadge(candidate.OverallStatus)}
                    </TableCell>

                    {/* Actions Cell */}
                    <TableCell className="py-3">
                      <div className="flex flex-col items-start gap-1">
                        {candidate.feedbackInterviews &&
                          candidate.feedbackInterviews.length > 0 &&
                          (candidate.feedbackInterviews.length === 1 ? (
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<PersonFeedbackRegular color="#B36A00" />}
                              style={{ color: "#B36A00" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                openFeedback(candidate.feedbackInterviews![0]);
                              }}
                            >
                              Add Feedback
                            </Button>
                          ) : (
                            <FluentProvider className="!bg-transparent">
                              <Menu>
                                <MenuTrigger>
                                  <MenuButton
                                    appearance="subtle"
                                    size="small"
                                    icon={<PersonFeedbackRegular color="#B36A00" />}
                                    style={{ color: "#B36A00" }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    Add Feedback
                                  </MenuButton>
                                </MenuTrigger>
                                <MenuPopover>
                                  <MenuList>
                                    {candidate.feedbackInterviews!.map((iv) => (
                                      <MenuItem
                                        key={iv.ID}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openFeedback(iv);
                                        }}
                                      >
                                        {iv.PipelineStage || iv.InterviewTitle}
                                      </MenuItem>
                                    ))}
                                  </MenuList>
                                </MenuPopover>
                              </Menu>
                            </FluentProvider>
                          ))}

                        <Button
                          appearance="subtle"
                          style={{ color: "#0078D4" }}
                          size="small"
                          icon={<Eye20Regular color="#0078D4" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            openLifecycle(candidate);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Empty state */}
        {!isLoading && candidates.length === 0 && (
          <div className="text-center py-20 flex flex-col items-center bg-gradient-to-br from-gray-50 to-white">
            <div className="bg-gray-100 rounded-full p-6 mb-6">
              <PersonRegular className="w-16 h-16 text-gray-400" />
            </div>
            <Subtitle2 className="mb-3 text-gray-700 font-semibold">
              No candidates found
            </Subtitle2>
            <div className="text-gray-500 max-w-md leading-relaxed mb-4">
              Try adjusting your filters or search terms to discover more candidates.
            </div>
            <Button
              appearance="outline"
              className="hover:bg-blue-50 hover:border-blue-300 transition-colors !mt-2"
              onClick={handleClearFilters}
            >
              Clear all filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {candidates.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-100 px-2">
            <div className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-6">
                <Caption1 className="text-gray-600 font-medium">
                  Showing {candidates.length} of{" "}
                  {serverPagination ? serverPagination.total : candidates.length}{" "}
                  candidates
                </Caption1>
              </div>

              <CustomPagination
                currentPage={serverPagination ? serverPagination.page : 1}
                totalPages={serverPagination ? serverPagination.totalPages : 1}
                onPageChange={handlePageChange}
                itemsPerPage={serverPagination ? serverPagination.pageSize : 20}
                onItemsPerPageChange={handleItemsPerPageChange}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Candidate Lifecycle Drawer — feedback is shown per interview inside the
          ApplicantLifecycleStepper (showlifecycle enabled). */}
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
              <div className="flex justify-center items-center gap-[10px]">
                <Avatar
                  name={selectedCandidate?.ApplicantName}
                  style={{ height: "40px", width: "40px" }}
                  className="flex-shrink-0"
                />
                <div>
                  <Text
                    weight="semibold"
                    style={{ color: "#111827", fontSize: "large" }}
                  >
                    {selectedCandidate?.ApplicantName}
                  </Text>
                  <div className="text-xs text-gray-500">
                    {selectedCandidate?.ApplicantCode}
                  </div>
                </div>
              </div>
            </DrawerHeaderTitle>
          </DrawerHeader>

          <DrawerBody style={{ paddingTop: "10px" }}>
            {selectedCandidate && (
              <ApplicantDrawer
                applicant={
                  {
                    ID: selectedCandidate.ApplicantID,
                    ApplicantCode: selectedCandidate.ApplicantCode,
                    firstName: selectedCandidate.ApplicantName?.split(" ")[0] || "",
                    lastName:
                      selectedCandidate.ApplicantName?.split(" ").slice(1).join(" ") ||
                      "",
                    email: selectedCandidate.Email,
                    Status: selectedCandidate.OverallStatus,
                  } as any
                }
                jobId={selectedCandidate.JobPostingID || ""}
                showlifecycle={true}
              />
            )}
          </DrawerBody>
        </OverlayDrawer>
      </FluentProvider>

      {/* Feedback Form Modal */}
      {showFeedbackForm && selectedFeedbackInterview && (
        <FeedbackForm
          interview={selectedFeedbackInterview}
          onClose={handleFeedbackClose}
          onSubmit={handleFeedbackSubmit}
          onGenerateShareLink={generateShareableLink}
        />
      )}
    </FluentProvider>
  );
}
