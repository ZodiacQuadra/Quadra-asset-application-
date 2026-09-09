import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Button,
  Text,
  Body1Strong,
  Caption1,
  Avatar,
  OverlayDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Subtitle1,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Tooltip,
  FluentProvider,
  Card,
  Subtitle2,
  Spinner,
  Body1,
} from "@fluentui/react-components";
import {
  EditRegular,
  CheckmarkRegular,
  DismissRegular,
  HistoryRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  DocumentTextRegular,
  CalendarRegular,
  StarRegular,
  BriefcaseRegular,
  Eye20Regular,
  MoreHorizontal20Regular,
  Briefcase16Regular,
  Building20Regular,
} from "@fluentui/react-icons";
import { EditJobModal } from "./EditJobModal";
import { ApprovalModal } from "./ApprovalModal";
import { ChangeLogModal } from "./ChangeLogModal";
import { SuggestDescriptionModal } from "./SuggestDescriptionModal";
import type { JobPosting, ChangeLog } from "../../Pages/JobPosting";
import CustomPagination from "../../../Recruit/Components/CustomPagination";
import React from "react";

interface JobPostingTableProps {
  jobs: JobPosting[];
  onUpdate: (job: JobPosting) => void;
  onApproveSuggestion: (
    jobId: string,
    suggestionId: string,
    approvedBy: string
  ) => void;
  onRejectSuggestion: (jobId: string, suggestionId: string) => void;
  onSort?: (key: keyof JobPosting, direction: "asc" | "desc") => void;
  sortConfig?: {
    key: keyof JobPosting;
    direction: "asc" | "desc";
  } | null;
  isLoading?: boolean;
}

const NoJobsState = () => {
  return (
    <div className="text-center py-20 flex flex-col items-center bg-gradient-to-br from-gray-50 to-white">
      <div className="bg-gray-100 rounded-full p-6 mb-6">
        <BriefcaseRegular className="w-16 h-16 text-gray-400" />
      </div>
      <Subtitle2 className="mb-3 text-gray-700 font-semibold">
        No job postings found
      </Subtitle2>
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-gray-500 max-w-md leading-relaxed mb-4">
          No job postings have been created yet. Create your first job posting
          to start attracting talented candidates.
        </div>
      </div>
    </div>
  );
};

export const JobPostingTable = ({
  jobs,
  onUpdate,
  onApproveSuggestion,
  onRejectSuggestion,
  onSort,
  sortConfig,
  isLoading = false,
}: JobPostingTableProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isChangeLogModalOpen, setIsChangeLogModalOpen] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [isDescriptionDialogOpen, setIsDescriptionDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [selectedSuggestionId, setSelectedSuggestionId] = useState<
    string | null
  >(null);

  // Implementing the pagination
  const [paginatedPostings, setPaginatedPostings] = useState<JobPosting[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 0,
  });
  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      totalCount: jobs.length,
      totalPages: Math.ceil(jobs.length / prev.pageSize),
    }));
  }, [jobs, pagination.pageSize]);
  useEffect(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginated = jobs.slice(startIndex, endIndex);
    setPaginatedPostings(paginated);
  }, [jobs, pagination.currentPage, pagination.pageSize]);

  const handleReviewSuggestion = (job: JobPosting, suggestionId: string) => {
    setSelectedJob(job);
    setSelectedSuggestionId(suggestionId);
    setIsApprovalModalOpen(true);
  };

  const handleRejectSuggestion = (job: JobPosting, suggestionId: any) => {
    onRejectSuggestion(job.id, suggestionId);
  };

  const handleSort = (key: keyof JobPosting) => {
    if (onSort) {
      const direction =
        sortConfig?.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc";
      onSort(key, direction);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return {
          appearance: "ghost" as const,
          color: "success" as const,
          className: "bg-green-100 text-green-800 border-green-200",
          dotColor: "bg-green-500",
        };
      case "draft":
        return {
          appearance: "ghost" as const,
          color: "warning" as const,
          className: "bg-amber-100 text-amber-800 border-amber-200",
          dotColor: "bg-amber-500",
        };
      default:
        return {
          appearance: "ghost" as const,
          color: "informative" as const,
          className: "bg-gray-100 text-gray-800 border-gray-200",
          dotColor: "bg-gray-500",
        };
    }
  };

  const handleEdit = (job: JobPosting) => {
    setSelectedJob(job);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (job: JobPosting) => {
    setSelectedJob(job);
    setIsChangeLogModalOpen(true);
  };

  const handleViewDetails = (job: JobPosting) => {
    setSelectedJob(job);
    setIsDescriptionDialogOpen(true);
  };

  const stripHtmlTags = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(date);
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg rounded-xl border-0 overflow-hidden bg-white">
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <Body1Strong className="ml-3 text-gray-600">
            Loading job postings...
          </Body1Strong>
        </div>
      </Card>
    );
  }

  return (
    <>
      <FluentProvider style={{ background: "transparent" }}>
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0">
          <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Table sortable className="w-full">
              <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                <TableRow className="border-b-2 border-gray-100">
                  <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-3"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-2 ml-5">
                      <Body1Strong className="text-gray-900">
                        Title
                      </Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === "title" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell align="center" className="flex justify-center items-center">
                    <Body1Strong className="text-gray-900">Code</Body1Strong>
                  </TableHeaderCell>

                  <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-3"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-900">
                        Status
                      </Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === "status" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell className="!py-3 !px-3">
                    <Body1Strong className="text-gray-900">Skills</Body1Strong>
                  </TableHeaderCell>

                  <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-3"
                    onClick={() => handleSort("createdBy")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-900">
                        Created By
                      </Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === "createdBy" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell className="!py-3 !px-3">
                    <Body1Strong className="text-gray-900">
                      Suggestions
                    </Body1Strong>
                  </TableHeaderCell>

                  <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-3"
                    onClick={() => handleSort("modifiedAt")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-900">
                        Last Modified
                      </Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === "modifiedAt" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell className="!py-3 !px-3">
                    <Body1Strong className="text-gray-900">Actions</Body1Strong>
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedPostings.map((job, index) => {
                  const statusColors = getStatusColor(job.status);
                  const pendingSuggestionsCount =
                    job.pendingSuggestions?.filter(
                      (s) => s.Status === "pending"
                    ).length || 0;

                  return (
                    <TableRow
                      key={job.id}
                      className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                        }`}
                    >
                      <TableCell className="px-6 !py-5">
                        <div className="flex items-center gap-3">
                          {/* <div className="p-2 bg-blue-100 rounded-lg">
                            <BriefcaseRegular className="w-5 h-5 text-blue-600" />
                          </div> */}
                          <div className="space-y-1 ml-5">
                            <Text className="font-semibold text-gray-900 leading-tight">
                              {job.title}
                            </Text>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">

                          <Badge appearance="outline" className="font-medium text-gray-800 leading-tight !border-none">{job.jobCode ? job.jobCode : "-"}</Badge>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Badge
                            {...statusColors}
                            className={`font-medium shadow-none ${statusColors.className}`}
                          >
                            <div
                              className={`w-2 h-2 rounded-full ${statusColors.dotColor} mr-2`}
                            />
                            {job.status.charAt(0).toUpperCase() +
                              job.status.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-64">
                          {job.skills.slice(0, 3).map((skill, skillIndex) => (
                            <Badge
                              key={skill}
                              appearance="outline"
                              size="medium"
                              className={`
                                !px-2 !py-1 text-xs font-medium shadow-sm transition-all duration-200 hover:shadow-md
                                ${skillIndex % 3 === 0
                                  ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                  : skillIndex % 3 === 1
                                    ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                }
                              `}
                            >
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 3 && (
                            <Tooltip
                              content={
                                <div className="space-y-1 flex flex-col gap-1">
                                  {job.skills.slice(3).map((skill, index) => (
                                    <Badge
                                      key={skill}
                                      appearance="outline"
                                      size="medium"
                                      className={`!px-2 !py-1 text-xs font-medium shadow-sm transition-all duration-200 hover:shadow-md
                                        ${index % 3 === 0
                                          ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                          : index % 3 === 1
                                            ? "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                                            : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                        }`}
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                </div>
                              }
                              relationship="label"
                            >
                              <Badge
                                appearance="outline"
                                size="medium"
                                className="!bg-gradient-to-br !from-[#0153A5] !to-[#2FC2FE] !text-white !border-0 hover:bg-gray-200 transition-colors cursor-pointer shadow-sm  text-xs font-medium"
                              >
                                +{job.skills.length - 3}
                              </Badge>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            color="colorful"
                            size={36}
                            name={job.createdBy}
                            className="shadow-sm"
                          />
                          <div className="space-y-0.5">
                            <Text className="font-medium text-gray-800 leading-tight">
                              {job.createdBy}
                            </Text>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        {job.hasPendingSuggestions ? (
                          <div className="space-y-2">
                            {/* <div className="flex items-center gap-2">
                              <div className="relative">
                                <Badge
                                  appearance="filled"
                                  color="important"
                                  className="animate-pulse shadow-sm bg-orange-100 text-orange-800 border-orange-200"
                                >
                                  {pendingSuggestionsCount} pending
                                </Badge>
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping opacity-75" />
                              </div>
                            </div> */}
                            <div className="space-y-1">
                              {job.pendingSuggestions
                                ?.filter((s) => s.Status === "pending")
                                .slice(0, 2)
                                .map((suggestion) => (
                                  <div
                                    key={suggestion.ID}
                                    className="flex gap-1"
                                  >
                                    <Button
                                      size="small"
                                      appearance="primary"
                                      onClick={() =>
                                        handleReviewSuggestion(
                                          job,
                                          suggestion.ID
                                        )
                                      }
                                      className="!bg-green-600 hover:!bg-green-700 !border-0 !text-xs !shadow-sm transition-all duration-200 hover:shadow-md !rounded-lg"
                                    >
                                      {/* <CheckmarkRegular className="w-3 h-3 mr-1" /> */}
                                      Review
                                    </Button>
                                    {/* <Button
                                      size="small"
                                      appearance="outline"
                                      onClick={() =>
                                        handleRejectSuggestion(
                                          job,
                                          suggestion.ID
                                        )
                                      }
                                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 text-xs shadow-sm transition-all duration-200"
                                    >
                                      <DismissRegular className="w-3 h-3" />
                                    </Button> */}
                                  </div>
                                ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-300 rounded-full" />
                            <Caption1 className="text-gray-500 font-medium">
                              None
                            </Caption1>
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CalendarRegular className="w-4 h-4 text-gray-400" />
                            <Text
                              size={200}
                              className="text-gray-700 font-medium"
                            >
                              {formatDate(job.modifiedAt)}
                            </Text>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-6 py-4">
                        <div className="flex gap-2 ">
                          <Tooltip content="View Details" relationship="label">
                            <Eye20Regular
                              onClick={() => handleViewDetails(job)}
                              className="cursor-pointer"
                            />
                          </Tooltip>
                          <Menu>
                            <MenuTrigger disableButtonEnhancement>
                              <MoreHorizontal20Regular className="cursor-pointer" />
                            </MenuTrigger>
                            <MenuPopover>
                              <MenuList>
                                <MenuItem
                                  icon={<EditRegular />}
                                  onClick={() => handleEdit(job)}
                                  className="hover:bg-blue-50 transition-colors"
                                >
                                  Edit Job
                                </MenuItem>
                                <MenuItem
                                  icon={<HistoryRegular />}
                                  onClick={() => handleViewHistory(job)}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  View History
                                </MenuItem>
                              </MenuList>
                            </MenuPopover>
                          </Menu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {paginatedPostings.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-100 px-2 py-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <Caption1 className="text-gray-600 font-medium">
                      Showing{" "}
                      {jobs.length > 0
                        ? (pagination.currentPage - 1) * pagination.pageSize + 1
                        : 0}{" "}
                      to{" "}
                      {Math.min(
                        pagination.currentPage * pagination.pageSize,
                        jobs.length
                      )}{" "}
                      of {jobs.length} job postings
                    </Caption1>
                  </div>
                  <CustomPagination
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={(page) =>
                      setPagination((prev) => ({ ...prev, currentPage: page }))
                    }
                    itemsPerPage={pagination.pageSize}
                    onItemsPerPageChange={(size) =>
                      setPagination((prev) => ({
                        ...prev,
                        pageSize: size,
                        currentPage: 1,
                      }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Empty State */}
          {jobs.length === 0 && !isLoading && <NoJobsState />}

          {/* Table Footer with Stats */}
        </Card>
      </FluentProvider>

      {/* Job Details Dialog - Enhanced */}
      <OverlayDrawer
        open={isDescriptionDialogOpen}
        onOpenChange={(event, data) => setIsDescriptionDialogOpen(data.open)}
        size="large"
        position="end"
        className="rounded-l-xl"
      >
        <DrawerHeader className="!bg-white">
          <DrawerHeaderTitle
            action={
              <div className="flex gap-3">
                <Button
                  icon={<EditRegular />}
                  onClick={() => {
                    setIsDescriptionDialogOpen(false);
                    if (selectedJob) {
                      handleEdit(selectedJob);
                    }
                  }}
                  className="!shadow-none !rounded-2xl !text-xs !font-semibold !text-[#4F46E5] border-1 border-[#4F46E5]"
                >
                  Edit Description
                </Button>

                <Button
                  appearance="subtle"
                  icon={<DismissRegular />}
                  onClick={() => setIsDescriptionDialogOpen(false)}
                />
              </div>
            }
          >
            <div className="flex w-full justify-between">
              <div className="flex gap-3 items-center">
                <div className="h-10 w-10 bg-[#0C59A4] flex items-center justify-center shadow-md rounded-lg text-white items-center">
                  <Briefcase16Regular />
                </div>
                <Subtitle1 className="!text-sm !font-semibold">
                  {selectedJob?.title}
                </Subtitle1>
              </div>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody className="!p-0">
          <div className="space-y-8 p-4">
            {selectedJob && (
              <>
                {/* Job Description */}
                <div className="space-y-0 ">
                  <div className="flex items-center gap-3  bg-gradient-to-br from-[#EEF2FF] to-[#FAF5FF] p-3 rounded-t-lg">
                    <DocumentTextRegular className="w-5 h-5 text-gray-600" />
                    <Body1Strong className="text-gray-900">
                      Job Description
                    </Body1Strong>
                  </div>
                  <div className="prose prose-sm max-w-none ">
                    <div className="p-4 bg-gray-50/50 rounded-b-lg">
                      <Text className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedJob.description
                          ?.split("\n")
                          .map((line, index) => (
                            <React.Fragment key={index}>
                              {line}
                              <br />
                            </React.Fragment>
                          ))}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Skills Required */}
                <div className="space-y-0">
                  <div className="flex items-center gap-3 bg-gradient-to-br from-[#FFFBEB] to-[#FFF7ED] p-2 rounded-t-lg">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center">
                      <StarRegular className="w-5 h-5 text-gray-600" />
                    </div>
                    <Body1Strong className="text-gray-900">
                      Required Skills
                    </Body1Strong>
                  </div>
                  <div className="flex flex-wrap gap-3 p-4 bg-gray-50/50 rounded-b-lg ">
                    {selectedJob.skills.map((skill, index) => (
                      <Badge
                        key={skill}
                        appearance="ghost"
                        className="!bg-[#F1F8FC] !text-[#007ED5] !shadow-sm"
                        size="large"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Additional Job Requirement */}
                {selectedJob.additionalResponsibilities &&
                  selectedJob.additionalResponsibilities.length > 0 && (
                    <div className="space-y-0 ">
                      <div className="flex items-center gap-3  bg-gradient-to-br from-[#EEF2FF] to-[#FAF5FF] p-3 rounded-t-lg">
                        <CheckmarkRegular className="w-5 h-5 text-gray-600" />
                        <Body1Strong className="text-gray-900">
                          Additional Job Requirement
                        </Body1Strong>
                      </div>
                      <div className="grid grid-cols-2 gap-2 ">
                        {selectedJob.additionalResponsibilities.map(
                          (resp, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200 transition-all duration-200 hover:shadow-sm"
                            >
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              <Text className="text-gray-700 leading-relaxed">
                                {resp}
                              </Text>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Skills Required */}
                {/* <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                      <StarRegular className="w-5 h-5 text-gray-600" />
                      <Body1Strong className="text-gray-900">
                        Required Skills
                      </Body1Strong>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {selectedJob.skills.map((skill, index) => (
                        <Badge
                          key={skill}
                          appearance="filled"
                          className={`
                            px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 hover:shadow-md
                            ${index % 3 === 0
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : index % 3 === 1
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : "bg-emerald-100 text-emerald-800 border-emerald-200"
                            }
                          `}
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div> */}

                {/* Job Metadata */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Avatar
                        color="colorful"
                        name={selectedJob.createdBy}
                        size={40}
                        className="shadow-sm"
                      />
                      <div>
                        <Caption1 className="text-gray-600 font-medium">
                          Created by
                        </Caption1>
                        <br />
                        <Text className="font-semibold text-gray-800">
                          {selectedJob.createdBy}
                        </Text>
                      </div>
                    </div>

                    {/* Add Department Card */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Building20Regular className="w-5 h-5 text-blue-600" /> {/* Add this import */}
                      </div>
                      <div>
                        <Caption1 className="text-gray-600 font-medium">
                          Department
                        </Caption1>
                        <br />
                        <Text className="font-semibold text-gray-800">
                          {selectedJob.department || "Not specified"}
                        </Text>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CalendarRegular className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <Caption1 className="text-gray-600 font-medium">
                          Last updated
                        </Caption1>
                        <br />
                        <Text className="font-semibold text-gray-800">
                          {selectedJob.modifiedAt.toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* <DialogActions className="pt-6 border-t border-gray-100">
              <Button
                appearance="secondary"
                onClick={() => setIsDescriptionDialogOpen(false)}
                className="shadow-sm"
              >
                Close
              </Button>
              <Button
                appearance="primary"
                icon={<EditRegular />}
                onClick={() => {
                  setIsDescriptionDialogOpen(false);
                  if (selectedJob) {
                    handleEdit(selectedJob);
                  }
                }}
                className="shadow-sm"
              >
                Edit Description
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog> */}
        </DrawerBody>
      </OverlayDrawer>

      {/* Keep all existing modals */}
      {selectedJob && (
        <>
          <EditJobModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedJob(null);
            }}
            job={selectedJob}
            onSubmit={onUpdate}
          />

          <ApprovalModal
            isOpen={isApprovalModalOpen}
            onClose={() => {
              setIsApprovalModalOpen(false);
              setSelectedSuggestionId(null);
              setSelectedJob(null);
            }}
            job={selectedJob}
            selectedSuggestionId={selectedSuggestionId}
            onApprove={onApproveSuggestion}
            onReject={onRejectSuggestion}
          />

          <ChangeLogModal
            isOpen={isChangeLogModalOpen}
            onClose={() => {
              setIsChangeLogModalOpen(false);
              setSelectedJob(null);
            }}
            job={selectedJob}
          />
        </>
      )}
    </>
  );
};
