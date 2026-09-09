import {
  CalendarLtr20Regular,
  SearchRegular,
  FilterRegular,
  ChevronUpRegular,
  ChevronDownRegular,
  EyeRegular,
  AddRegular,
  Document20Regular,
  ApprovalsApp20Regular,
  CalendarCancel20Regular,
  Flag20Regular,
  PeopleTeam20Regular,
  Alert20Regular,
  DeleteRegular,
  MoreHorizontal20Regular,
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
  CardPreview,
  MessageBar,
  MessageBarBody,
  SearchBox,
  Dropdown,
  Option,
  Badge,
  Body1Strong,
  Tooltip,
  FluentProvider,
  Body1,
  Avatar,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Toaster,
  Toast,
  ToastTitle,
  useToastController,
  useId,
} from "@fluentui/react-components";

import { useEffect, useState } from "react";
import {
  deleteBGVRequest,
  getBGVRequestsList,
  getMyBGVRequestsList,
} from "../../Services/BGVServices";
import { useNavigate } from "react-router-dom";
import CustomPagination from "../../Recruit/Components/CustomPagination";
import CustomStatsCard from "../../Recruit/Components/CustomStatsCard";
import { useAuth } from "../../Auth/AuthProvider";

type RequestStatus = 'Approved' | 'Rejected' | 'Draft' | 'Completed';


interface BGVRequest {
  BGVRequestID: string;
  EmployeeID: string;
  FullName: string;
  EmailID: string;
  ExperienceLevel: string;
  PersonalEmail: string;
  Gender: string;
  Status: RequestStatus;
  SubmittedDate: string;
  ApprovedDate: string | null;
  RejectedDate: string | null;
  CompletedDate: string | null;
  CreatedDate: string;
  CreatedBy: string;
  BGVFormattedID: string;
}

interface Pagination {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface BGVStats {
  total: number;
  draft: number;
  approved: number;
  rejected: number;
  completed: number;
}

type StatusType = "all" | "draft" | "approved" | "rejected" | "completed";

interface NoRequestsStateProps {
  statusFilter: string;
  onCreateNew: () => void;
  searchQuery: string;
  experienceFilter: string;
  genderFilter: string;
  onClearFilters: () => void;
  viewMode: "ALL" | "MY";
}

const NoRequestsState = ({
  statusFilter,
  onCreateNew,
  searchQuery,
  experienceFilter,
  genderFilter,
  onClearFilters,
  viewMode,
}: NoRequestsStateProps) => {
  const hasFilters =
    searchQuery ||
    statusFilter !== "all" ||
    experienceFilter !== "all" ||
    genderFilter !== "all";

  const getMainMessage = (status: string): string => {
    const labelMap: Record<string, string> = {
      draft: `No draft BGV requests${viewMode === "MY" ? " created by you" : ""
        }`,
      approved: `No approved BGV requests${viewMode === "MY" ? " created by you" : ""
        }`,
      rejected: `No rejected BGV requests${viewMode === "MY" ? " created by you" : ""
        }`,
      completed: `No completed BGV requests${viewMode === "MY" ? " created by you" : ""
        }`,
      all: `No BGV requests found${viewMode === "MY" ? " created by you" : ""}`,
    };
    return labelMap[status] ?? "No records found";
  };

  const getSubMessage = (status: string): string => {
    if (hasFilters) {
      return "We couldn't find any BGV requests matching your criteria. Try adjusting your search or filters to see more results.";
    }

    const messages: Record<string, string> = {
      draft: "Start by submitting BGV requests from employee records.",
      approved: "Approved requests will appear here.",
      rejected: "Rejected BGVs are shown here.",
      completed: "Successfully completed BG checks will appear.",
      all: "No requests available. Submit a request to begin.",
    };
    return messages[status] || "No available records.";
  };

  return (
    <div className="text-center py-20 flex flex-col items-center bg-gradient-to-b from-gray-50 to-white">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
        <CalendarLtr20Regular
          style={{ fontSize: "40px" }}
          className="text-blue-600"
        />
      </div>
      <Subtitle2 className="mb-3 text-gray-700">
        {getMainMessage(statusFilter)}
      </Subtitle2>
      <div className="text-center">
        <Body1 className="text-gray-500 max-w-md mx-auto leading-relaxed mb-4">
          {getSubMessage(statusFilter)}
        </Body1>
      </div>
      {hasFilters ? (
        <Button
          appearance="primary"
          size="medium"
          onClick={onClearFilters}
          className="px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 !mt-2"
        >
          Clear All Filters
        </Button>
      ) : (
        statusFilter === "all" && (
          <Button
            appearance="primary"
            size="medium"
            icon={<SearchRegular />}
            onClick={onCreateNew}
            className="px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 !mt-2"
          >
            Create New BGV Request
          </Button>
        )
      )}
    </div>
  );
};

export default function EmployeeDashboard() {
  const [statusFilter, setStatusFilter] = useState<StatusType>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<BGVRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BGVRequest[]>([]);
  const [paginatedRequests, setPaginatedRequests] = useState<BGVRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 1,
  });
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [experienceFilter, setExperienceFilter] = useState<string>("all");
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof BGVRequest;
    direction: "asc" | "desc";
  } | null>({ key: "SubmittedDate", direction: "desc" });
  const { accessToken, currentUser }: any = useAuth();
  const [bgvStats, setBgvStats] = useState<BGVStats>({
    total: 0,
    draft: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<BGVRequest | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const statusMap = {
    "Approved": "In-Progress",
    "Rejected": "Re-Progress",
    "Draft": "Created",
    "Completed": "Completed"
  }

  const showToast = (
    message: string,
    intent: "success" | "error" = "success"
  ) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{message}</ToastTitle>
      </Toast>,
      { intent, position: "bottom-end" }
    );
  };

  // Get unique values for filters
  const uniqueExperienceLevels = Array.from(
    new Set(requests.map((req) => req.ExperienceLevel).filter(Boolean))
  ).sort();

  const uniqueGenders = Array.from(
    new Set(requests.map((req) => req.Gender).filter(Boolean))
  ).sort();

  // Helper function to check permissions
  const checkPermission = (permissionPath: string): boolean => {
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

  const canDeleteBGV = checkPermission(
    "background_verification.bgv_manage.delete_bgv"
  );

  const canCreateBGV = checkPermission(
    "background_verification.bgv_manage.create_bgv"
  );

  // Determine view mode based on permissions
  const getViewMode = (): "ALL" | "MY" => {
    const canViewAll = checkPermission(
      "background_verification.bgv_view.view_all_bgv"
    );
    const canViewMy = checkPermission(
      "background_verification.bgv_view.view_my_bgv"
    );

    if (canViewAll) {
      return "ALL";
    } else if (canViewMy) {
      return "MY";
    }

    // Default to 'MY' if no permissions
    return "MY";
  };

  const viewMode = getViewMode();

  useEffect(() => {
    fetchData();
    localStorage.removeItem("inductionPagination");

  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        status: undefined,
        pageNumber: 1,
        pageSize: 1000,
      };

      let response: any;

      // Call the appropriate API based on view mode
      if (viewMode === "ALL") {
        response = await getBGVRequestsList(filters, accessToken);
      } else {
        // For 'MY' view, add createdBy parameter
        filters.createdBy = currentUser?.userID;
        response = await getMyBGVRequestsList(filters, accessToken);
      }

      if (response.success) {
        setRequests(response.data.requests || []);

        // Calculate stats
        const allRequests = response.data.requests || [];
        const stats: BGVStats = {
          total: allRequests.length,
          draft: allRequests.filter(
            (req: BGVRequest) => req.Status.toLowerCase() === "draft"
          ).length,
          approved: allRequests.filter(
            (req: BGVRequest) => req.Status.toLowerCase() === "approved"
          ).length,
          rejected: allRequests.filter(
            (req: BGVRequest) => req.Status.toLowerCase() === "rejected"
          ).length,
          completed: allRequests.filter(
            (req: BGVRequest) => req.Status.toLowerCase() === "completed"
          ).length,
        };
        setBgvStats(stats);
      } else {
        setError("Failed to fetch BGV data");
      }
    } catch (e) {
      setError("Something went wrong!");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort data
  useEffect(() => {
    let filtered = [...requests];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((request) => {
        const searchableFields = [
          request.FullName,
          request.EmailID,
          request.PersonalEmail,
          request.ExperienceLevel,
          request.Gender,
          request.Status,
          request.BGVRequestID,
          request.EmployeeID,
          request.BGVFormattedID,
        ];

        return searchableFields.some(
          (field) => field && field.toString().toLowerCase().includes(query)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (request) => request.Status.toLowerCase() === statusFilter
      );
    }

    // Apply experience filter
    if (experienceFilter !== "all") {
      filtered = filtered.filter(
        (request) => request.ExperienceLevel === experienceFilter
      );
    }

    // Apply gender filter
    if (genderFilter !== "all") {
      filtered = filtered.filter((request) => request.Gender === genderFilter);
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
          sortConfig.key === "SubmittedDate" ||
          sortConfig.key === "CreatedDate"
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

    setFilteredRequests(filtered);

    // Update pagination
    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    setPagination((prev) => ({
      ...prev,
      totalCount,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }));
  }, [
    requests,
    searchQuery,
    statusFilter,
    experienceFilter,
    genderFilter,
    sortConfig,
    pagination.pageSize,
  ]);

  // Pagination
  useEffect(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    setPaginatedRequests(filteredRequests.slice(startIndex, endIndex));
  }, [filteredRequests, pagination.currentPage, pagination.pageSize]);

  const handleCardClick = (status: StatusType) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const isStatusCardActive = (status: string): boolean => {
    return (
      statusFilter === status || (status === "all" && statusFilter === "all")
    );
  };

  const handleCreateNew = () => {
    navigate("/BGV/BGVForm");
  };

  const handleSort = (key: keyof BGVRequest) => {
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

  const getStatusBadgeAppearance = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return { appearance: "ghost" as const, color: "success" as const };
      case "draft":
        return { appearance: "ghost" as const, color: "warning" as const };
      case "submitted":
        return { appearance: "ghost" as const, color: "brand" as const };
      case "rejected":
        return { appearance: "ghost" as const, color: "danger" as const };
      case "completed":
        return { appearance: "ghost" as const, color: "success" as const };
      default:
        return {
          appearance: "ghost" as const,
          color: "informative" as const,
        };
    }
  };

  const handleDelete = async () => {
    if (!requestToDelete || !canDeleteBGV) return;

    setIsDeleting(true);
    try {
      const response = await deleteBGVRequest(
        requestToDelete.BGVRequestID,
        currentUser.userID,
        accessToken
      );

      if (response.success) {
        showToast(
          response.message || "BGV request deleted successfully",
          "success"
        );
        await fetchData();
        setDeleteDialogOpen(false);
        setRequestToDelete(null);
      } else {
        showToast(response.message || "Failed to delete BGV request", "error");
      }
    } catch (error) {
      console.error("Error deleting BGV request:", error);
      showToast("Failed to delete BGV request", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const canDeleteRequest = (request: any): boolean => {
    // console.log(request);

    return (
      request &&
      canDeleteBGV &&
      (request.Status.toLowerCase() === "draft" ||
        request.Status.toLowerCase() === "rejected" ||
        request.Status.toLowerCase() === "submitted")
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setExperienceFilter("all");
    setGenderFilter("all");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleRefresh = () => {
    fetchData();
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: itemsPerPage,
      currentPage: 1,
    }));
  };

  // Check if user has permission to view BGV requests
  const canViewBGV =
    checkPermission("background_verification.bgv_view.view_all_bgv") ||
    checkPermission("background_verification.bgv_view.view_my_bgv");

  if (!canViewBGV) {
    return (
      <div className="mx-auto">
        <div className="flex flex-col justify-center items-center h-64 space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Alert20Regular className="w-8 h-8 text-gray-500" />
          </div>
          <Text size={400} className="text-gray-600">
            You don't have permission to view BGV requests.
          </Text>
          <Button appearance="primary" onClick={() => navigate("/")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Requests...</Body1Strong>
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Subtitle2 className="text-[#1D4586] font-bold">
            Background Verification Dashboard
          </Subtitle2>
        </div>
        <div className="flex gap-2">
          {canCreateBGV && (
            <Button
              appearance="primary"
              shape="circular"
              onClick={handleCreateNew}
              style={{
                color: "#626262",
                backgroundColor: "#FFFFFF4F",
                border: "1px solid #fff",
                fontWeight: 500,
                padding: "10px 18px",
                display: "flex",
                gap: "6px",
              }}
            >
              <span
                className="rounded-full p-[6px] flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)",
                }}
              >
                <AddRegular style={{ color: "#fff", fontSize: "18px" }} />
              </span>
              Initiate Background Check
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards with CustomStatsCard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <CustomStatsCard
          style={isStatusCardActive("draft") ? "ring-2 ring-blue-500" : ""}
          onClick={() => handleCardClick("draft")}
        >
          <CardPreview className="py-[17px] px-[20px]">
            <div className="!flex flex-row items-center justify-between">
              <div className="flex flex-col gap-[11px]">
                <div>
                  <Text size={300} weight="semibold" className="!text-gray-700">
                    {statusMap["Draft"]}
                  </Text>
                </div>
                <div>
                  <Text
                    size={600}
                    weight="semibold"
                    className="text-2xl font-bold"
                  >
                    {bgvStats.draft}
                  </Text>
                </div>
              </div>
              <div>
                <Avatar
                  color="marigold"
                  size={36}
                  icon={
                    <div className="bg-[#FAF2E4] rounded-full p-[15px]">
                      <Document20Regular
                        style={{
                          height: "30px",
                          width: "30px",
                          color: "#E99000",
                        }}
                      />
                    </div>
                  }
                />
              </div>
            </div>
          </CardPreview>
        </CustomStatsCard>

        <CustomStatsCard
          style={isStatusCardActive("approved") ? "ring-2 ring-blue-500" : ""}
          onClick={() => handleCardClick("approved")}
        >
          <CardPreview className="py-[17px] px-[20px]">
            <div className="!flex flex-row items-center justify-between">
              <div className="flex flex-col gap-[11px]">
                <div>
                  <Text size={300} weight="semibold" className="!text-gray-700">
                    {statusMap["Approved"]}
                  </Text>
                </div>
                <div>
                  <Text
                    size={600}
                    weight="semibold"
                    className="text-2xl font-bold"
                  >
                    {bgvStats.approved}
                  </Text>
                </div>
              </div>
              <div>
                <Avatar
                  color="seafoam"
                  size={36}
                  icon={
                    <div className="bg-[#EFFFF9] rounded-full p-[15px]">
                      <ApprovalsApp20Regular
                        style={{
                          height: "30px",
                          width: "30px",
                          color: "#15803D",
                        }}
                      />
                    </div>
                  }
                />
              </div>
            </div>
          </CardPreview>
        </CustomStatsCard>

        <CustomStatsCard
          style={isStatusCardActive("rejected") ? "ring-2 ring-blue-500" : ""}
          onClick={() => handleCardClick("rejected")}
        >
          <CardPreview className="py-[17px] px-[20px]">
            <div className="!flex flex-row items-center justify-between">
              <div className="flex flex-col gap-[11px]">
                <div>
                  <Text size={300} weight="semibold" className="!text-gray-700">
                    {statusMap["Rejected"]}
                  </Text>
                </div>
                <div>
                  <Text
                    size={600}
                    weight="semibold"
                    className="text-2xl font-bold"
                  >
                    {bgvStats.rejected}
                  </Text>
                </div>
              </div>
              <div>
                <Avatar
                  color="cranberry"
                  size={36}
                  icon={
                    <div className="bg-[#FFEBEB] rounded-full p-[15px]">
                      <CalendarCancel20Regular
                        style={{
                          height: "30px",
                          width: "30px",
                          color: "#DC2626",
                        }}
                      />
                    </div>
                  }
                />
              </div>
            </div>
          </CardPreview>
        </CustomStatsCard>

        <CustomStatsCard
          style={isStatusCardActive("completed") ? "ring-2 ring-blue-500" : ""}
          onClick={() => handleCardClick("completed")}
        >
          <CardPreview className="py-[17px] px-[20px]">
            <div className="!flex flex-row items-center justify-between">
              <div className="flex flex-col gap-[11px]">
                <div>
                  <Text size={300} weight="semibold" className="!text-gray-700">
                    Completed
                  </Text>
                </div>
                <div>
                  <Text
                    size={600}
                    weight="semibold"
                    className="text-2xl font-bold"
                  >
                    {bgvStats.completed}
                  </Text>
                </div>
              </div>
              <div>
                <Avatar
                  color="colorful"
                  size={36}
                  icon={
                    <div className="bg-[#F1E8FF] rounded-full p-[15px]">
                      <Flag20Regular
                        style={{
                          height: "30px",
                          width: "30px",
                          color: "#6A3AB9",
                        }}
                      />
                    </div>
                  }
                />
              </div>
            </div>
          </CardPreview>
        </CustomStatsCard>

        <CustomStatsCard
          style={isStatusCardActive("all") ? "ring-2 ring-blue-500" : ""}
          onClick={() => handleCardClick("all")}
        >
          <CardPreview className="py-[17px] px-[20px]">
            <div className="!flex flex-row items-center justify-between">
              <div className="flex flex-col gap-[11px]">
                <div>
                  <Text size={300} weight="semibold" className="!text-gray-700">
                    Total
                  </Text>
                </div>
                <div>
                  <Text
                    size={600}
                    weight="semibold"
                    className="text-2xl font-bold"
                  >
                    {bgvStats.total}
                  </Text>
                </div>
              </div>
              <div>
                <Avatar
                  color="colorful"
                  size={36}
                  icon={
                    <div className="bg-[#ECFEFF] rounded-full p-[15px]">
                      <PeopleTeam20Regular
                        style={{
                          height: "30px",
                          width: "30px",
                          color: "#0078D4",
                        }}
                      />
                    </div>
                  }
                />
              </div>
            </div>
          </CardPreview>
        </CustomStatsCard>
      </div>

      {/* Info Message if Filter Applied */}
      {statusFilter !== "all" && (
        <MessageBar intent="info">
          <MessageBarBody>
            Showing only <b>{statusFilter}</b> BGV requests. Click "Total" to
            view all requests.
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Search and Filters */}
      <FluentProvider
        style={{ background: "transparent" }}
        className="flex gap-4 items-end"
      >
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white">
          <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex flex-col gap-4">
            <div className="grid grid-cols-12 gap-2 ">
              <div className="flex col-span-5 xs:col-span-12">
                <SearchBox
                  placeholder="Search by name, email, employee ID, or BGV ID..."
                  value={searchQuery}
                  onChange={(_, data) => setSearchQuery(data.value)}
                  className="!w-full"
                  size="medium"
                />
              </div>
              <div className="col-span-2"></div>
              <FluentProvider className="grid grid-cols-4  col-span-5 xs:col-span-12 gap-2">
                <div className="col-span-1"></div>
                <Dropdown
                  placeholder="All Experience Levels"
                  // value={experienceFilter}
                  value={experienceFilter === "all" ? "All Experience Levels" : experienceFilter}
                  selectedOptions={[experienceFilter]}
                  onOptionSelect={(_, data) =>
                    setExperienceFilter(data.optionValue || "all")
                  }
                  className="col-span-2 "
                  size="medium"
                >
                  <Option value="all">All Experience Levels</Option>
                  {uniqueExperienceLevels.map((level) => (
                    <Option key={level} value={level}>
                      {level}
                    </Option>
                  ))}
                </Dropdown>

                <Button
                  appearance="subtle"
                  className="col-span-1"
                  icon={<FilterRegular />}
                  onClick={clearFilters}
                  disabled={
                    searchQuery === "" &&
                    statusFilter === "all" &&
                    experienceFilter === "all" &&
                    genderFilter === "all"
                  }
                >
                  Clear
                </Button>
              </FluentProvider>
            </div>

            <Table sortable className="w-full">
              <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                <TableRow className="border-b-2 border-gray-100">
                  {/* <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                    onClick={() => handleSort("BGVRequestID")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong>BGV ID</Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === "BGVRequestID" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell> */}

                  <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                    onClick={() => handleSort("FullName")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong>Employee Details</Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === "FullName" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                    onClick={() => handleSort("ExperienceLevel")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong>Experience</Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === "ExperienceLevel" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                    onClick={() => handleSort("Gender")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong>Gender</Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === "Gender" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                    onClick={() => handleSort("SubmittedDate")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong>Submitted Date</Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === "SubmittedDate" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
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

                  <TableHeaderCell style={{ padding: "15px 5px" }}>
                    <Body1Strong>Actions</Body1Strong>
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedRequests.map((req) => (
                  <TableRow
                    key={req.BGVFormattedID}
                    className="group hover:bg-gradient-to-r hover:from-blue-25 hover:to-indigo-25 transition-all duration-200 border-b border-gray-50 hover:shadow-sm"
                  >
                    {/* BGV ID Column */}
                    {/* <TableCell>
                      <Badge
                        appearance="tint"
                        color="brand"
                        // className="font-semibold px-3 py-1 rounded-lg shadow-sm"
                        className="
                          !text-[#007ED5]
                          !text-xs
                          cursor-pointer 
                          hover:scale-105 
                          transition-transform 
                          duration-200 
                          font-semibold 
                          !p-4 
                          rounded-lg 
                          shadow-none
                          !border-b-none 
                          !border-none 
                          !bg-gradient-to-r from-[#EEF2FF] to-[#FAF5FF]
                          after:!border-none
                          "
                      >
                        {req.BGVFormattedID}
                      </Badge>
                    </TableCell> */}

                    {/* Employee Details Column - Now with Persona */}
                    <TableCell>
                      <TableCell className="!px-2 !py-2 *:truncate">
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={`${req.FullName}`}
                            size={32}
                            color="colorful"
                          />
                          <div>
                            <Body1 className="!font-semibold !text-[#007ED5] !text-xs">
                              {req.FullName}
                            </Body1>
                          </div>
                        </div>
                      </TableCell>
                    </TableCell>

                    {/* Experience Column */}
                    <TableCell>
                      <Body1 className="font-medium text-gray-900 !text-xs">
                        {req.ExperienceLevel ? req.ExperienceLevel : "-"}
                      </Body1>
                    </TableCell>

                    {/* Gender Column */}
                    <TableCell>
                      <Body1 className="text-gray-600 !text-xs">
                        {req.Gender ? req.Gender : "-"}
                      </Body1>
                    </TableCell>

                    {/* Submitted Date Column */}
                    <TableCell>
                      {req.SubmittedDate ? (
                        <Body1 className="!text-xs">
                          {formatDate(req.SubmittedDate)}
                        </Body1>
                      ) : (
                        <Body1 className="text-gray-400 !text-xs">
                          Not submitted
                        </Body1>
                      )}
                    </TableCell>

                    {/* Status Column */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${req.Status.toLowerCase() === "approved"
                              ? "bg-[#15803D] animate-pulse"
                              : req.Status.toLowerCase() === "draft"
                                ? "bg-[#A16207] animate-pulse"
                                : req.Status.toLowerCase() === "submitted"
                                  ? "bg-[#007ED5] animate-pulse"
                                  : req.Status.toLowerCase() === "rejected"
                                    ? "bg-[#DC2626] animate-pulse"
                                    : req.Status.toLowerCase() === "completed"
                                      ? "bg-[#15803D] animate-pulse"
                                      : "bg-gray-400"
                            }`}
                        ></div>
                        <Badge
                          {...getStatusBadgeAppearance(req.Status)}
                          className="px-3 py-1 font-medium"
                        >
                          {statusMap[req.Status] ? statusMap[req.Status] : req.Status}
                        </Badge>
                      </div>
                    </TableCell>

                    {/* Actions Column */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Tooltip content="View Details" relationship="label">
                          <Button
                            appearance="subtle"
                            icon={<EyeRegular />}
                            onClick={() => {
                              if (req.Status.toLowerCase() === "draft") {
                                navigate(`/BGV/${req.BGVRequestID}`);
                              } else if (
                                req.Status.toLowerCase() === "submitted"
                              ) {
                                navigate(
                                  `/BGV/${req.BGVRequestID}?approve=true`
                                );
                              } else if (
                                req.Status.toLowerCase() === "approved"
                              ) {
                                navigate(
                                  `/BGV/${req.BGVRequestID}?approve=true`
                                );
                              } else navigate(`/BGV/${req.BGVRequestID}`);
                            }}
                            size="small"
                          />
                        </Tooltip>

                        {canDeleteBGV && (
                          <Menu>
                            <MenuTrigger disableButtonEnhancement>
                              <MenuButton
                                appearance="subtle"
                                icon={<MoreHorizontal20Regular />}
                                size="small"
                              />
                            </MenuTrigger>
                            <MenuPopover>
                              <MenuList>
                                <MenuItem
                                  icon={<DeleteRegular />}
                                  onClick={() => {
                                    setRequestToDelete(req);
                                    setDeleteDialogOpen(true);
                                  }}
                                  disabled={!canDeleteRequest(req)}
                                >
                                  Delete Request
                                </MenuItem>
                              </MenuList>
                            </MenuPopover>
                          </Menu>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Enhanced Empty State */}
          {paginatedRequests.length === 0 && !loading && (
            <NoRequestsState
              statusFilter={statusFilter}
              onCreateNew={handleCreateNew}
              searchQuery={searchQuery}
              experienceFilter={experienceFilter}
              genderFilter={genderFilter}
              onClearFilters={clearFilters}
              viewMode={getViewMode()}
            />
          )}

          {/* Custom Pagination Footer */}
          {paginatedRequests.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-100 px-4">
              <div className="flex items-center justify-between">
                <Caption1 className="text-gray-600 font-medium">
                  Showing{" "}
                  {filteredRequests.length > 0
                    ? (pagination.currentPage - 1) * pagination.pageSize + 1
                    : 0}{" "}
                  to{" "}
                  {Math.min(
                    pagination.currentPage * pagination.pageSize,
                    filteredRequests.length
                  )}{" "}
                  of {filteredRequests.length} filtered results
                  {filteredRequests.length !== bgvStats.total &&
                    ` (${bgvStats.total} total)`}
                </Caption1>
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
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(_, data) => setDeleteDialogOpen(data.open)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Delete BGV Request</DialogTitle>
              <DialogContent>
                <MessageBar intent="warning">
                  <MessageBarBody>
                    Are you sure you want to delete the BGV request for{" "}
                    <strong>{requestToDelete?.FullName}</strong> (
                    {requestToDelete?.BGVFormattedID})? This action cannot be
                    undone.
                    {requestToDelete?.Status.toLowerCase() !== "draft" &&
                      requestToDelete?.Status.toLowerCase() !== "rejected" && (
                        <div className="mt-2">
                          <strong>Note:</strong> Only Draft and Rejected
                          requests can be deleted.
                        </div>
                      )}
                  </MessageBarBody>
                </MessageBar>
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary">Cancel</Button>
                </DialogTrigger>
                <Button
                  appearance="primary"
                  disabled={isDeleting || !canDeleteRequest(requestToDelete!)}
                  onClick={handleDelete}
                  style={{ backgroundColor: "#DC2626" }}
                >
                  {isDeleting ? <Spinner size="tiny" /> : "Delete"}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
        <Toaster toasterId={toasterId} />
      </FluentProvider>
    </div>
  );
}
