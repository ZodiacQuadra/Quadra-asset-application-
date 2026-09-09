import * as React from "react";
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  Badge,
  Button,
  SearchBox,
  Dropdown,
  Option,
  Text,
  Subtitle2,
  Body1,
  Body1Strong,
  Caption1,
  Divider,
  Spinner,
  Card,
  CardHeader,
  Persona,
  Tooltip,
  MenuButton,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  useId,
  useToastController,
  Toaster,
  Toast,
  ToastTitle,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogBody,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  FluentProvider,
  Avatar,
} from "@fluentui/react-components";
import {
  MoreHorizontal20Regular,
  DocumentPdfRegular,
  PersonRegular,
  MailRegular,
  CalendarRegular,
  ChevronUpRegular,
  ChevronDownRegular,
  DeleteRegular,
  EyeRegular,
  FilterRegular,
  DismissRegular,
  Mail20Regular,
  Share20Regular,
} from "@fluentui/react-icons";
import { useState, useEffect } from "react";
import { getApplicantsByJobId, deleteApplicant, getApplicantsByJobWithParams } from "../../Services/Resume";
import { ApplicantDrawer } from "../Pages/ApplicantDrawer";
import CustomPagination from "../Components/CustomPagination"; // Import the CustomPagination component
import { useAuth } from "../../Auth/AuthProvider";
import { InterviewStage } from "../../Types/interview";
import { getHiringPipeline } from "../../Services/JDRequests";
import { useLocation } from "react-router-dom";
import { triggerMaterialSendEmail } from "../../Services/Applicant";

// Define the Applicant interface
interface Applicant {
  ID: string;
  ApplicantCode: string;
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  education: string;
  experienced: boolean;
  experienceDetails: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  blobUrl: string;
  blobPath: string;
  Status: string;
  CreatedAt: string;
  ModifiedAt: string | null;
  skills: Array<{ value: string }>;
  IsMaterialShared: boolean;
  Source: string | null;
  createdByUser?:{name:string,email:string} | null
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
}

interface ApplicantsTableProps {
  jdId: string
  jobId: string;
  refreshTrigger?: number; // Add this prop to trigger refresh
  hasMaterial: boolean;
  source:string
}

const NoApplicantsState = ({
  searchQuery,
  statusFilter,
  experienceFilter,
  onClearFilters,
}: {
  searchQuery: string;
  statusFilter: string;
  experienceFilter: string;
  onClearFilters: () => void;
}) => {
  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || experienceFilter !== "all";

  return (
    <div className="text-center py-20 flex flex-col items-center bg-gradient-to-br from-gray-50 to-white">
      <div className="bg-gray-100 rounded-full p-6 mb-6">
        <PersonRegular className="w-16 h-16 text-gray-400" />
      </div>
      <Subtitle2 className="mb-3 text-gray-700 font-semibold">
        No applicants found
      </Subtitle2>
      <div className="flex flex-col items-center justify-center text-center">
        <div className="text-gray-500 max-w-md leading-relaxed mb-4">
          {hasActiveFilters
            ? "Try adjusting your filters or search terms to discover more candidates."
            : "No applicants have applied for this position yet. Share your job posting to attract talented candidates."}
        </div>
      </div>

      {hasActiveFilters && (
        <Button
          appearance="outline"
          className="hover:bg-blue-50 hover:border-blue-300 transition-colors !mt-2"
          onClick={onClearFilters}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
};

const ApplicantsTable = ({ jdId, jobId, refreshTrigger, hasMaterial ,source}: ApplicantsTableProps) => {
  // All data states
  const [allApplicants, setAllApplicants] = useState<Applicant[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
  const [paginatedApplicants, setPaginatedApplicants] = useState<Applicant[]>(
    []
  );

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(
    null
  );
  const [stages, setStages] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [applicantToDelete, setApplicantToDelete] = useState<Applicant | null>(
    null
  );
  const [JDData, setJDData] = React.useState<JDData | null>(null);
  const { currentUser, accessToken }: any = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Applicant;
    direction: "asc" | "desc";
  } | null>({ key: "CreatedAt", direction: "desc" });

  // Client-side pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 0,
  });

  const [isLoadingShare, setIsloadingShare] = useState(false)



  const location = useLocation()

  const toasterId = useId("applicants-toaster");
  const { dispatchToast } = useToastController(toasterId);

  // Permission checks
  const canManageApplicant =
    currentUser?.permissions?.recruit?.candidate_app?.manage_app === true;

  const canApproveRejectApplicant =
    currentUser?.permissions?.recruit?.candidate_app?.approve_reject_app ===
    true;


  const canDeleteApplicant = () => {
    return canManageApplicant && JDData?.status === "Active";
  };

  const fetchPipelineStages = async (jobId: string) => {
    if (!jobId) return;

    try {
      const result = await getHiringPipeline(jobId, accessToken);
      // console.log(result?.data);
      if (result?.data) {
        setStages(
          result?.data
            .filter((val) => val.InterviewName != "Applied")
            .map((val) => val.InterviewName)
        );
      }
    } catch (error) {
      console.error("Error fetching pipeline stages:", error);
      const errorMessage = "Failed to load pipeline stages";
    }
  };

  const handleSendMaterial = async (jobID: string, applicantID: string, email: string) => {
    try {
      setIsloadingShare(true)
      const result = await triggerMaterialSendEmail(accessToken, jobID, applicantID, email)


      // console.log("result", result)

      if (result.data && result.data.success && result?.data?.message) {
        dispatchToast(
          <Toast>
            <ToastTitle>{result.data.message?result.data.message:"Material shared successfully"}</ToastTitle>
          </Toast>,
          { intent: "success" }
        );



        loadApplicants()
      }
    }
    catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to share material</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
    finally {
      setIsloadingShare(false)
    }
  }

  const loadApplicants = async () => {
    try {
      setIsLoading(true);
      await fetchPipelineStages(jobId);
      const result: any = await getApplicantsByJobWithParams(jobId,source);

      if (result.success && result.data) {
        setAllApplicants(result.data);
      } else {
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to load applicants</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      }
    } catch (error) {
      console.error("Error loading applicants:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Error loading applicants</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load applicants data on initial mount and jobId change
  useEffect(() => {
    if (jobId) {
      loadApplicants();
    }
  }, [jobId,source]);

  // Add effect to handle refresh trigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && jobId) {
      loadApplicants();
    }
  }, [refreshTrigger, jobId]);

  // Client-side filtering and sorting
  useEffect(() => {
    let filtered = [...allApplicants];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((applicant) => {
        const fullName = `${applicant.firstName} ${applicant.lastName}`.toLowerCase();
        const email = applicant.email.toLowerCase();
        const code = applicant.ApplicantCode.toLowerCase();
        const skills =
          applicant.skills
            ?.map((skill) => skill.value.toLowerCase())
            .join(" ") || "";
        const education = applicant.education?.toLowerCase() || "";

        return (
          fullName.includes(query) ||
          email.includes(query) ||
          code.includes(query) ||
          skills.includes(query) ||
          education.includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (applicant) => applicant.Status === statusFilter
      );
    }

    // Apply experience filter
    if (experienceFilter !== "all") {
      const isExperienced = experienceFilter === "experienced";
      filtered = filtered.filter(
        (applicant) => applicant.experienced === isExperienced
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

        if (sortConfig.key === "CreatedAt") {
          comparison =
            new Date(aValue as string).getTime() -
            new Date(bValue as string).getTime();
        } else if (typeof aValue === "string" && typeof bValue === "string") {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
          comparison = Number(aValue) - Number(bValue);
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return sortConfig.direction === "desc" ? -comparison : comparison;
      });
    }

    setFilteredApplicants(filtered);

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
    allApplicants,
    searchQuery,
    statusFilter,
    experienceFilter,
    sortConfig,
    pagination.pageSize,
  ]);

  // Client-side pagination
  useEffect(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    const paginated = filteredApplicants.slice(startIndex, endIndex);
    setPaginatedApplicants(paginated);
  }, [filteredApplicants, pagination.currentPage, pagination.pageSize]);

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (sizeInBytes: string) => {
    const bytes = parseInt(sizeInBytes);
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getStatusBadgeAppearance = (status: string) => {
    switch (status) {
      case "Applied":
        return { appearance: "ghost" as const, color: "success" as const };
      case "Phone Interview":
        return { appearance: "ghost" as const, color: "warning" as const };
      case "Rejected":
        return { appearance: "ghost" as const, color: "danger" as const };
      case "Technical Interview":
        return { appearance: "ghost" as const, color: "warning" as const };
      case "Hired":
        return { appearance: "ghost" as const, color: "success" as const };
      case "Final Interview":
        return { appearance: "ghost" as const, color: "brand" as const };
      case "Management Interview":
        return { appearance: "ghost" as const, color: "brand" as const };
      case "onboard-pending":
        return { appearance: "ghost" as const, color: "warning" as const }
      default:
        return { appearance: "ghost" as const, color: "important" as const };
    }
  };

  const handleSort = (key: keyof Applicant) => {
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

  // console.log("hasMaterial",hasMaterial)

  const handleViewResume = (blobUrl: string) => {
    window.open(blobUrl, "_blank");
  };

  const handleContactApplicant = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleViewDetails = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setIsDrawerOpen(true);
  };

  const handleDeleteClick = (applicant: Applicant) => {
    if (!canDeleteApplicant()) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            You don't have permission to delete applicants
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }
    setApplicantToDelete(applicant);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!applicantToDelete) return;

    try {
      setIsDeleting(true);
      const result = await deleteApplicant(applicantToDelete.ID);

      if (result.success) {
        // Remove from local state
        setAllApplicants((prev) =>
          prev.filter((a) => a.ID !== applicantToDelete.ID)
        );

        dispatchToast(
          <Toast>
            <ToastTitle>Applicant deleted successfully</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else {
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to delete applicant</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      }
    } catch (error) {
      console.error("Error deleting applicant:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Error deleting applicant</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setApplicantToDelete(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setExperienceFilter("all");
    setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to first page when clearing filters
  };

  const handleUpdate = () => {
    loadApplicants();
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Submissions...</Body1Strong>
      </div>
    );
  }

  const hasApplicantAccess = canManageApplicant || canApproveRejectApplicant;

  if (!hasApplicantAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 h-full">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
          <PersonRegular className="w-10 h-10 text-blue-600" />
        </div>
        <Subtitle2 className="mb-3 text-gray-700">No Access</Subtitle2>
        <Body1 className="text-gray-500 max-w-md mx-auto text-center leading-relaxed">
          You don't have permission to manage applicants. Please contact your
          administrator to request access.
        </Body1>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        style={{ background: "white" }}
        className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white"
      >
        <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex flex-col gap-2">
          <div className="grid grid-cols-12 gap-2 bg-white">
            <div className="flex col-span-5 xs:col-span-12">
              <SearchBox
                placeholder="Search by name, email, code, skills, or education..."
                value={searchQuery}
                onChange={(_, data) => setSearchQuery(data.value)}
                className="!w-full !max-w-full !min-w-0 "
              />
            </div>
            <div className="col-span-1"></div>
            <FluentProvider
              style={{ background: "transparent" }}
              className="grid grid-cols-5  col-span-6 xs:col-span-12 gap-2"
            >
              <Dropdown
                placeholder="All Status"
                value={statusFilter}
                selectedOptions={[statusFilter]}
                onOptionSelect={(_, data) =>
                  setStatusFilter(data.optionValue || "all")
                }
                className="col-span-2 w-full !max-w-full !min-w-0"
              >
                {stages.length > 0 && (
                  <>
                    <Option value="all">All Status</Option>
                    {stages.map((stage, index) => (
                      <Option key={index} value={stage}>
                        {stage}
                      </Option>
                    ))}
                  </>
                )}
              </Dropdown>

              <Dropdown
                placeholder="All Experience"
                value={experienceFilter}
                selectedOptions={[experienceFilter]}
                onOptionSelect={(_, data) =>
                  setExperienceFilter(data.optionValue || "all")
                }
                className="col-span-2 w-full !max-w-full !min-w-0"
              >
                <Option value="all">All Experience</Option>
                <Option value="experienced">Experienced</Option>
                <Option value="fresher">Fresher</Option>
              </Dropdown>

              <Button
                appearance="subtle"
                icon={<FilterRegular />}
                className=" col-span-1 !text-red-500 disabled:!text-gray-400"
                onClick={clearFilters}
                disabled={
                  searchQuery === "" &&
                  statusFilter === "all" &&
                  experienceFilter === "all"
                }
              >
                Clear
              </Button>
            </FluentProvider>
          </div>

          <Table sortable className="w-full">
            <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
              <TableRow className="border-b-2 border-gray-100">
                <TableHeaderCell
                  className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-2 px-6"
                  onClick={() => handleSort("firstName")}
                >
                  <div className="flex items-center gap-2">
                    <Body1Strong className="text-gray-600">
                      Applicant
                    </Body1Strong>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig?.key === "firstName" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                        ))}
                    </div>
                  </div>
                </TableHeaderCell>

                <TableHeaderCell className="!py-2 px-6">
                  <Body1Strong className="text-gray-600">
                    Contact Info
                  </Body1Strong>
                </TableHeaderCell>

                <TableHeaderCell
                  className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-2 px-6"
                  onClick={() => handleSort("experienced")}
                >
                  <div className="flex items-center gap-2">
                    <Body1Strong className="text-gray-600">
                      Experience
                    </Body1Strong>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig?.key === "experienced" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                        ))}
                    </div>
                  </div>
                </TableHeaderCell>

                {/* <TableHeaderCell className="py-4 px-6">
                    <Body1Strong>Skills</Body1Strong>
                  </TableHeaderCell> */}

                <TableHeaderCell
                  className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-2 px-6"
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
                  className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-2 px-6"
                  onClick={() => handleSort("CreatedAt")}
                >
                  <div className="flex items-center gap-2">
                    <Body1Strong className="text-gray-600">
                      Applied Date
                    </Body1Strong>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      {sortConfig?.key === "CreatedAt" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                        ))}
                    </div>
                  </div>
                </TableHeaderCell>

                <TableHeaderCell className="!py-2 px-6">
                  <Body1Strong className="text-gray-600">Learning Plan Shared</Body1Strong>
                </TableHeaderCell>

                <TableHeaderCell className="!py-2 px-6">
                  <Body1Strong className="text-gray-600">{source==="referral"?"Referred By":"Source"}</Body1Strong>
                </TableHeaderCell>

                <TableHeaderCell className="!py-2 px-6">
                  <Body1Strong className="text-gray-600">Actions</Body1Strong>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>

            <TableBody>
              {paginatedApplicants.map((applicant, index) => (
                <TableRow
                  key={applicant.ID}
                  className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                >
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        color="colorful"
                        name={`${applicant.firstName} ${applicant.lastName}`}
                        size={32}
                      />
                      <Text className="!font-semibold !text-[#007ED5] !text-xs">
                        {applicant.firstName} {applicant.lastName}
                      </Text>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Tooltip content={applicant.email} relationship="label">
                          <Text className="truncate max-w-32 text-gray-700 hover:text-blue-600 transition-colors">
                            {applicant.email.length > 15
                              ? `${applicant.email.substring(0, 15)}...`
                              : applicant.email}
                          </Text>
                        </Tooltip>
                      </div>
                      {/* <div className="flex items-center gap-2">
                          <Text size={200} className="text-gray-600">
                            {applicant.phone}
                          </Text>
                        </div> */}
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <Badge
                      appearance={applicant.experienced ? "filled" : "outline"}
                      color={applicant.experienced ? "success" : "informative"}
                      className="font-medium"
                    >
                      {applicant.experienced ? "Experienced" : "Fresher"}
                    </Badge>
                  </TableCell>

                  {/* <TableCell className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-48">
                        {applicant.skills?.slice(0, 2).map((skill, index) => (
                          <Badge
                            key={index}
                            appearance="outline"
                            size="small"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            {skill.value}
                          </Badge>
                        ))}
                        {applicant.skills?.length > 2 && (
                          <Tooltip
                            content={
                              <div className="space-y-1">
                                {applicant.skills
                                  .slice(2)
                                  .map((skill, index) => (
                                    <div key={index} className="text-sm">
                                      {skill.value}
                                    </div>
                                  ))}
                              </div>
                            }
                            relationship="label"
                          >
                            <Badge
                              appearance="outline"
                              size="small"
                              className="bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 transition-colors cursor-pointer"
                            >
                              +{applicant.skills.length - 2}
                            </Badge>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell> */}

                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${applicant.Status.toLowerCase() === "applied"
                            ? "bg-[#15803D]"
                            : applicant.Status.toLowerCase() ===
                              "phone interview" || applicant.Status.toLowerCase() === "onboard-pending"
                              ? "bg-[#E97548] animate-pulse"
                              : applicant.Status.toLowerCase() === "hired"
                                ? "bg-[#13cc57ff] animate-pulse"
                                : applicant.Status.toLowerCase() ===
                                  "final interview" ||
                                  applicant.Status.toLowerCase() ===
                                  "management interview"
                                  ? "bg-[#1e48d1ff] animate-pulse"
                                  : applicant.Status.toLowerCase() === "rejected"
                                    ? "bg-[#DC2626] animate-pulse"
                                    : applicant.Status.toLowerCase() ===
                                      "technical interview"
                                      ? "bg-[#f6d43bff] animate-pulse"
                                      : "bg-gray-400 animate-pulse"
                          }`}
                      ></div>
                      <Badge
                        {...getStatusBadgeAppearance(applicant.Status)}
                        className="font-medium"
                      >
                        {applicant.Status}
                      </Badge>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CalendarRegular className="w-4 h-4 text-gray-400" />
                      <Text size={200} className="text-gray-600">
                        {formatDate(applicant.CreatedAt)}
                      </Text>
                    </div>
                  </TableCell>

                  <TableCell className="px-6 py-4">

                    <Badge appearance="tint" color={applicant.IsMaterialShared ? "success" : "warning"} className="text-gray-600">
                      {applicant.IsMaterialShared ? "Yes" : "No"}
                    </Badge>
                  </TableCell>

                   <TableCell className="px-6 py-4">
                    {
                      source === "referral"?
                       <Tooltip content={
                        <table>
                          <tr>
                            <td>Name</td>
                            <td>{applicant.createdByUser?.name}</td>
                          </tr>
                          <tr>
                            <td>Email</td>
                            <td>{applicant.createdByUser?.email}</td>
                          </tr>
                        </table>
                       } relationship="label" >
                            <Avatar  
                              name={applicant.createdByUser?.name ?? "NA"}
                              title={applicant.createdByUser?.email ?? "NA"}
                              color="colorful"
                            />
                              
                        </Tooltip>
                        :
                        <Badge appearance="tint" color="brand" className="text-gray-600">
                      {applicant.Source ? applicant.Source : "NA"}
                    </Badge>
                    }
                    
                  </TableCell>

                  <TableCell className="px-6 py-4">
                    <div className="flex gap-1">
                      <Tooltip content="View Details" relationship="label">
                        <Button
                          appearance="subtle"
                          icon={<EyeRegular />}
                          size="small"
                          onClick={() => handleViewDetails(applicant)}
                          className="w-8 h-8 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 rounded-lg"
                        />
                      </Tooltip>
                      <Menu>
                        <MenuTrigger disableButtonEnhancement>
                          <MenuButton
                            appearance="subtle"
                            icon={<MoreHorizontal20Regular />}
                            size="small"
                            className="w-8 h-8 hover:bg-gray-100 transition-all duration-200 rounded-lg"
                          />
                        </MenuTrigger>
                        <FluentProvider style={{ background: "transparent" }}>
                          <MenuPopover>
                            <MenuList>
                              <MenuItem
                                onClick={() =>
                                  handleViewResume(applicant.blobUrl)
                                }
                                className="hover:bg-blue-50 transition-colors"
                              >
                                <DocumentPdfRegular className="w-4 h-4 mr-2 text-red-500" />
                                View Resume
                              </MenuItem>
                              <MenuItem
                                onClick={() =>
                                  handleContactApplicant(applicant.email)
                                }
                                className="hover:bg-green-50 transition-colors"
                              >
                                <MailRegular className="w-4 h-4 mr-2 text-green-600" />
                                Contact
                              </MenuItem>
                              {canDeleteApplicant() && (
                                <MenuItem
                                  onClick={() => handleDeleteClick(applicant)}
                                  className="hover:bg-red-50 text-red-600 transition-colors"
                                >
                                  <DeleteRegular className="w-4 h-4 mr-2" />
                                  Delete
                                </MenuItem>
                              )}

                              {

                                applicant.IsMaterialShared === false && hasMaterial && (
                                  isLoadingShare ? (
                                    <MenuItem>
                                      <Spinner /> Loading...
                                    </MenuItem>
                                  )
                                    :
                                    <MenuItem
                                      onClick={() => handleSendMaterial(jdId, applicant.ID, applicant.email)}
                                      className="hover:bg-red-50 text-red-600 transition-colors"
                                    >
                                      <Share20Regular className="w-4 h-4 mr-2" />
                                      Share Material
                                    </MenuItem>
                                )

                              }
                            </MenuList>
                          </MenuPopover>
                        </FluentProvider>
                      </Menu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Enhanced Empty State */}
        {paginatedApplicants.length === 0 && !isLoading && (
          <NoApplicantsState
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            experienceFilter={experienceFilter}
            onClearFilters={clearFilters}
          />
        )}

        {/* Table Footer with Stats and Pagination */}
        {paginatedApplicants.length > 0 && (
          <div className="bg-gray-50 border-t border-gray-100 px-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Caption1 className="text-gray-600 font-medium">
                  Showing{" "}
                  {filteredApplicants.length > 0
                    ? (pagination.currentPage - 1) * pagination.pageSize + 1
                    : 0}{" "}
                  to{" "}
                  {Math.min(
                    pagination.currentPage * pagination.pageSize,
                    filteredApplicants.length
                  )}{" "}
                  of {filteredApplicants.length} filtered results
                  {filteredApplicants.length !== allApplicants.length &&
                    ` (${allApplicants.length} total)`}
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
              <span className="flex flex-row items-start gap-5">
                <Persona
                  size="huge"
                  name={`${selectedApplicant?.firstName} ${selectedApplicant?.lastName}`}
                  secondaryText={`${selectedApplicant?.ApplicantCode}`}
                  avatar={{ color: "colorful" }}
                />
                <Badge className="mt-1">{selectedApplicant?.Status}</Badge>
              </span>
            </DrawerHeaderTitle>
          </DrawerHeader>

          <DrawerBody>
            {selectedApplicant && (
              <ApplicantDrawer
                jobId={jobId}
                applicant={selectedApplicant}
                onUpdate={handleUpdate}
              />
            )}
          </DrawerBody>
        </OverlayDrawer>
      </FluentProvider>

      <FluentProvider style={{ background: "transparent" }}>
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(event, data) => setDeleteDialogOpen(data.open)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogContent>
                <div className="space-y-4">
                  <Text>
                    Are you sure you want to delete this Applicant "
                    {applicantToDelete
                      ? `${applicantToDelete.firstName} ${applicantToDelete.lastName}`
                      : ""}
                    "?
                  </Text>
                  <div className="p-3 my-2 bg-red-50 border border-red-200 rounded-md">
                    <Text className="text-red-800 text-sm">
                      This action will mark the Applicant as deleted and it will
                      no longer be available. This action cannot be undone.
                    </Text>
                  </div>
                </div>
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
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
};

export default ApplicantsTable;
