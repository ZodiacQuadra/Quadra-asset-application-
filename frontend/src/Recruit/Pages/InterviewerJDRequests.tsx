// components/Recruit/InterviewerJDRequestsTable.tsx

import React, { useState, useEffect, useId } from "react";
import {
    Table,
    TableHeader,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Card,
    SearchBox,
    Dropdown,
    Option,
    Button,
    Badge,
    Text,
    Body1Strong,
    Body1,
    Subtitle2,
    Caption1,
    Spinner,
    Tooltip,
    Menu,
    MenuTrigger,
    MenuButton,
    MenuPopover,
    MenuList,
    MenuItem,
    OverlayDrawer,
    DrawerHeader,
    DrawerHeaderTitle,
    DrawerBody,
    Toaster,
    FluentProvider,
    CardPreview,
    Avatar,
    Divider,
    makeStyles,
} from "@fluentui/react-components";
import {
    FilterRegular,
    ChevronUpRegular,
    ChevronDownRegular,
    EyeRegular,
    MoreHorizontal20Regular,
    PersonRegular,
    EditRegular,
    DismissRegular,
    DeleteRegular,
    AddRegular,
    People20Regular,
    ArrowSyncCheckmark20Regular,
    DocumentTextRegular,
    LockClosedRegular,
    History20Regular,
    ArrowClockwise20Regular,
    ApprovalsApp20Regular,
    PersonCircleRegular,
} from "@fluentui/react-icons";
import { useToastController } from "@fluentui/react-components";
import PreviewJDForm from "./PreviewJDForm";
import { useNavigate } from "react-router-dom";
import CustomPagination from "../Components/CustomPagination";
import { useAuth } from "../../Auth/AuthProvider";
import CustomStatsCard from "../Components/CustomStatsCard";
import { fetchProfilePicture, getUserByID } from "../../Services/GraphAPI";

const useStyles = makeStyles({
    avatarIcon: {
        "& .fui-Avatar__icon": {
            padding: "4px",
            borderRadius: "50%",
        },
    },
    active: {
        "& .fui-Avatar__icon": {
            backgroundColor: "#EFF6FF",
        },
    },
    inactive: {
        "& .fui-Avatar__icon": {
            backgroundColor: "#FFFCE0",
        },
    },
    published: {
        "& .fui-Avatar__icon": {
            backgroundColor: "#FEF2F2",
        },
    },
    total: {
        "& .fui-Avatar__icon": {
            backgroundColor: "#FFFFFF",
        },
    },
    noAccessContainer: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
    },
    noAccessIcon: {
        fontSize: "64px",
        color: "#D13438",
        marginBottom: "24px",
    },
    noAccessTitle: {
        fontSize: "24px",
        fontWeight: "600",
        marginBottom: "12px",
        color: "#323130",
    },
    noAccessDescription: {
        fontSize: "14px",
        color: "#605e5c",
        maxWidth: "500px",
        marginBottom: "24px",
    },
    interviewerAvatar: {
        width: "32px",
        height: "32px",
        fontSize: "14px",
    },
});

interface JDRequest {
    ID: string;
    JDSequence: number;
    JDCode: string;
    JobID: string;
    JobRole: string;
    JobNature: string;
    Department: string;
    TargetDate: string;
    NumPositions: number;
    minWorkExperience?: number;
    maxWorkExperience?: number;
    MinSalaryRange?: number;
    MaxSalaryRange?: number;
    SalaryRange?: number;
    JobLocation: string;
    JobDescription: string;
    Status: string;
    CreatedByUserID: string;
    ModifiedByUserID?: string;
    CreatedAt: string;
    ModifiedAt?: string;
    isDeleted: boolean;
    ReportingManagerID?: string;
    isActive?: boolean;
    isPublished?: boolean;
    InActiveReason?: string;
    LatestVersion: number;
    TotalVersions: number;
    Skills: Array<{ SkillName: string; Rating: number }>;
    HiredApplicantsCount?: number;
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
    reportingManager?: {
        id: string;
        displayName: string;
        email: string;
    };
    TotalCount?: number;
    InterviewerID?: string;
    interviewer?: {
        id: string;
        displayName: string;
        email: string;
        avatar?: string;
    };
}

interface InterviewerJDRequestsTableProps {
    interviewerData: JDRequest[];
    refreshTrigger?: number;
}

interface JDStats {
    active: number;
    inactive: number;
    published: number;
    total: number;
    openPositions: number;
    closedPositions: number;
}
interface InterviewerInfo {
  id: string;
  displayName: string;
  email: string;
  department?: string;
  position?: string;
  profilePicture?: string; // Add profile picture URL
}

const InterviewerJDRequestsTable: React.FC<InterviewerJDRequestsTableProps> = ({
    interviewerData,
    refreshTrigger,
}) => {
    //   const { currentUser, accessToken } = useAuth();
    const classes = useStyles();

    // State management
    const [allRequests, setAllRequests] = useState<JDRequest[]>([]);
    const [filteredRequests, setFilteredRequests] = useState<JDRequest[]>([]);
    const [paginatedRequests, setPaginatedRequests] = useState<JDRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [jobNatureFilter, setJobNatureFilter] = useState<string>("all");
    const [selectedJDRequest, setSelectedJDRequest] = useState<JDRequest | null>(
        null
    );
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { accessToken }: any = useAuth();

    const navigate = useNavigate();
    const toasterId = useId();
    const { dispatchToast } = useToastController(toasterId);

    const [sortConfig, setSortConfig] = useState<{
        key: keyof JDRequest;
        direction: "asc" | "desc";
    } | null>({ key: "CreatedAt", direction: "desc" });

    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 5,
        totalCount: 0,
        totalPages: 0,
    });

    const [jdStats, setJdStats] = useState<JDStats>({
        active: 0,
        inactive: 0,
        published: 0,
        total: 0,
        openPositions: 0,
        closedPositions: 0,
    });
    const [positionStatusFilter, setPositionStatusFilter] = useState<string>("all");

     const [interviewersMap, setInterviewersMap] = useState<Map<string, InterviewerInfo>>(new Map());
  const [profilePictureMap, setProfilePictureMap] = useState<Map<string, string>>(new Map());
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [loadingProfilePictures, setLoadingProfilePictures] = useState<Set<string>>(new Set());

    // Function to fetch and cache profile picture
  const fetchAndCacheProfilePicture = async (userId: string) => {
    if (!userId || loadingProfilePictures.has(userId)) {
      return;
    }

    try {
      // Mark as loading
      setLoadingProfilePictures(prev => new Set(prev).add(userId));
      
      const pictureUrl = await fetchProfilePicture(userId, accessToken);
      
      // Update profile picture map
      setProfilePictureMap(prev => new Map(prev).set(userId, pictureUrl));
      
      // Also update interviewers map with profile picture
      setInterviewersMap(prev => {
        const updated = new Map(prev);
        const existing = updated.get(userId);
        if (existing) {
          updated.set(userId, { ...existing, profilePicture: pictureUrl });
        }
        return updated;
      });
      
    } catch (error) {
      console.error(`Error fetching profile picture for user ${userId}:`, error);
      // Don't cache errors, allow retry later
    } finally {
      // Remove from loading set
      setLoadingProfilePictures(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };
  
    // Helper function to fetch interviewer details one by one
  const fetchInterviewerDetails = async (data: JDRequest[]) => {
    try {
      setIsLoadingUsers(true);
      
      // Extract unique interviewer IDs
      const uniqueInterviewerIds = Array.from(
        new Set(
          data
            .map(req => req.InterviewerID)
            .filter(id => id && id.trim() !== "")
        )
      ) as string[];

      if (uniqueInterviewerIds.length === 0) {
        setInterviewersMap(new Map());
        setIsLoadingUsers(false);
        return;
      }

      // Fetch each user individually
      const userPromises = uniqueInterviewerIds.map(async (id) => {
        try {
          const user = await getUserByID(id, accessToken);
          return { id, user };
        } catch (error) {
          console.error(`Error fetching user ${id}:`, error);
          return { id, user: null };
        }
      });

      const userResults = await Promise.all(userPromises);
      
      // Create a map of user ID to user details
      const map = new Map<string, InterviewerInfo>();
      
      userResults.forEach(({ id, user }) => {
        if (user) {
          const interviewerInfo: InterviewerInfo = {
            id: user.id || id,
            displayName: user.displayName || user.name || user.email || `User ${id.substring(0, 8)}`,
            email: user.email || "",
            department: user.department || "",
            position: user.position || "",
            // profilePicture will be fetched separately
          };
          map.set(id, interviewerInfo);
          
          // Start fetching profile picture in background
          fetchAndCacheProfilePicture(id);
        } else {
          // Fallback if user fetch fails
          map.set(id, {
            id,
            displayName: `User ${id.substring(0, 8)}`,
            email: "",
          });
        }
      });
      
      setInterviewersMap(map);
      
    } catch (error) {
      console.error("Error fetching interviewer details:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };


    // Helper function to get interviewer information
    const getInterviewerInfo = (request: JDRequest) => {
        const interviewerId = request.InterviewerID;

        if (!interviewerId) {
            return null;
        }

        // Get interviewer from the map
        const interviewer = interviewersMap.get(interviewerId);

        if (interviewer) {
            return interviewer;
        }

        // If still loading or not found, return null to show loading/placeholder
        return null;
    };

    // Helper function to get avatar initials
    const getInitials = (name: string): string => {
        if (!name) return "U";
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    };

    // Helper function to get avatar color based on ID
    const getAvatarColor = (id: string): "cornflower" | "blue" | "brand" | "teal" | "success" | "forest" | "seafoam" | "dark-green" | "light-teal" | "cyan" | "steel" | "light-blue" | "navy" | "indigo" | "cornflower" | "purple" | "grape" | "lavender" | "pink" | "magenta" | "plum" | "beige" | "mink" | "platinum" | "anchor" | undefined => {
        if (!id) return "brand";

        const colors: Array<"cornflower" | "blue" | "brand" | "teal" | "success" | "forest" | "seafoam" | "dark-green" | "light-teal" | "cyan" | "steel" | "light-blue" | "navy" | "indigo" | "cornflower" | "purple" | "grape" | "lavender" | "pink" | "magenta" | "plum" | "beige" | "mink" | "platinum" | "anchor"> = [
            "cornflower", "blue", "brand", "teal", "forest", "seafoam",
            "cyan", "steel", "navy", "indigo", "purple", "grape",
            "lavender", "pink", "magenta", "plum", "mink", "anchor"
        ];

        // Simple hash function to get consistent color for same ID
        let hash = 0;
        for (let i = 0; i < id.length; i++) {
            hash = id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    // Helper function to determine actual status based on flags
    const determineActualStatus = (request: JDRequest): string => {
        if (request.isActive === false) return "Inactive";
        if (request.isPublished === true) return "Published";
        return "Active";
    };

    // Load data from props
    useEffect(() => {
        if (interviewerData && interviewerData.length > 0) {
            processInterviewerData(interviewerData);
        } else {
            setIsLoading(false);
            setAllRequests([]);
            setInterviewersMap(new Map());
            setJdStats({
                active: 0,
                inactive: 0,
                published: 0,
                total: 0,
                openPositions: 0,
                closedPositions: 0,
            });
        }
    }, [interviewerData, refreshTrigger]);

    const processInterviewerData = async (data: JDRequest[]) => {
        try {
            setIsLoading(true);

            // Process the requests first
            const mappedRequests = data.map((req: any) => {
                let skills = [];

                if (Array.isArray(req.Skills)) {
                    skills = req.Skills;
                } else if (typeof req.Skills === 'string' && req.Skills.trim()) {
                    try {
                        skills = JSON.parse(req.Skills);
                    } catch (e) {
                        console.error(`Failed to parse skills for JD ${req.JDCode}:`, e);
                        skills = [];
                    }
                }

                return {
                    ...req,
                    Status: determineActualStatus(req),
                    Skills: skills,
                    LatestVersion: req.LatestVersion || 0,
                    TotalVersions: req.TotalVersions || 0,
                };
            });

            setAllRequests(mappedRequests);

            // Then fetch interviewer details in background
            fetchInterviewerDetails(mappedRequests);

            // Calculate stats
            const stats = {
                active: mappedRequests.filter(
                    (req: JDRequest) => req.Status === "Active"
                ).length,
                inactive: mappedRequests.filter(
                    (req: JDRequest) => req.Status === "Inactive"
                ).length,
                published: mappedRequests.filter(
                    (req: JDRequest) => req.Status === "Published"
                ).length,
                total: mappedRequests.length,
                openPositions: mappedRequests.filter(
                    (req: JDRequest) => req.HiredApplicantsCount !== undefined &&
                        req.HiredApplicantsCount < req.NumPositions
                ).length,
                closedPositions: mappedRequests.filter(
                    (req: JDRequest) => req.HiredApplicantsCount !== undefined &&
                        req.HiredApplicantsCount >= req.NumPositions
                ).length,
            };

            setJdStats(stats);
        } catch (error) {
            console.error("Error processing interviewer data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Client-side filtering and sorting
    useEffect(() => {
        let filtered = [...allRequests];

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter((request) => {
                const searchableFields = [
                    request.JDCode,
                    request.JobRole,
                    request.Department,
                    request.JobLocation,
                    request.JobNature,
                    request.createdBy?.displayName,
                    request.createdBy?.email,
                    request.reportingManager?.displayName,
                    request.reportingManager?.email,
                    ...(request.Skills || []).map((skill) => skill.SkillName),
                ];

                return searchableFields.some(
                    (field) => field && field.toString().toLowerCase().includes(query)
                );
            });
        }

        // Apply status filter
        if (statusFilter !== "all") {
            filtered = filtered.filter((request) => request.Status === statusFilter);
        }

        // Apply department filter
        if (departmentFilter !== "all") {
            filtered = filtered.filter(
                (request) => request.Department === departmentFilter
            );
        }

        // Apply job nature filter
        if (jobNatureFilter !== "all") {
            filtered = filtered.filter(
                (request) => request.JobNature === jobNatureFilter
            );
        }

        // Apply position status filter
        if (positionStatusFilter !== "all") {
            filtered = filtered.filter((request) => {
                if (request.HiredApplicantsCount === undefined) return false;

                if (positionStatusFilter === "open") {
                    return request.HiredApplicantsCount < request.NumPositions;
                } else if (positionStatusFilter === "closed") {
                    return request.HiredApplicantsCount >= request.NumPositions;
                }
                return true;
            });
        }

        // Apply sorting
        if (sortConfig) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                let comparison = 0;

                if (sortConfig.key === "CreatedAt" || sortConfig.key === "TargetDate") {
                    comparison =
                        new Date(aValue as string).getTime() -
                        new Date(bValue as string).getTime();
                } else if (typeof aValue === "string" && typeof bValue === "string") {
                    comparison = aValue.localeCompare(bValue);
                } else if (typeof aValue === "number" && typeof bValue === "number") {
                    comparison = aValue - bValue;
                } else {
                    comparison = String(aValue).localeCompare(String(bValue));
                }

                return sortConfig.direction === "desc" ? -comparison : comparison;
            });
        }

        setFilteredRequests(filtered);

        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / pagination.pageSize);

        setPagination((prev) => ({
            ...prev,
            totalCount,
            totalPages,
            currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
        }));
    }, [
        allRequests,
        searchQuery,
        statusFilter,
        departmentFilter,
        jobNatureFilter,
        positionStatusFilter,
        sortConfig,
        pagination.pageSize,
    ]);

    // Client-side pagination
    useEffect(() => {
        const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
        const endIndex = startIndex + pagination.pageSize;
        const paginated = filteredRequests.slice(startIndex, endIndex);
        setPaginatedRequests(paginated);
    }, [filteredRequests, pagination.currentPage, pagination.pageSize]);

    // Helper functions
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getStatusBadgeAppearance = (status: string) => {
        switch (status) {
            case "Active":
                return { appearance: "ghost" as const, color: "success" as const };
            case "Inactive":
                return { appearance: "ghost" as const, color: "warning" as const };
            case "Published":
                return { appearance: "ghost" as const, color: "brand" as const };
            default:
                return {
                    appearance: "ghost" as const,
                    color: "informative" as const,
                };
        }
    };

    const handleSort = (key: keyof JDRequest) => {
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

    const handleViewDetails = (request: JDRequest) => {
        setSelectedJDRequest(request);
        setIsDrawerOpen(true);
    };

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("all");
        setDepartmentFilter("all");
        setJobNatureFilter("all");
        setPositionStatusFilter("all");
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const handlePositionStatusCardClick = (status: string) => {
        setPositionStatusFilter(status);
        setStatusFilter("all");
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const isPositionStatusCardActive = (status: string) => {
        return (
            positionStatusFilter === status &&
            statusFilter === "all"
        );
    };

    const handleStatusCardClick = (status: string) => {
        setStatusFilter(status === "all" ? "all" : status);
        setPositionStatusFilter("all");
        setPagination((prev) => ({ ...prev, currentPage: 1 }));
    };

    const isStatusCardActive = (status: string) => {
        return (
            statusFilter === status &&
            positionStatusFilter === "all"
        );
    };

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
            currentPage: 1,
            totalPages: Math.ceil(prev.totalCount / itemsPerPage),
        }));
    };

    // Get unique departments and job natures for filters
    const uniqueDepartments = Array.from(
        new Set(allRequests.map((req) => req.Department).filter(Boolean))
    ).sort();

    const uniqueJobNatures = Array.from(
        new Set(allRequests.map((req) => req.JobNature).filter(Boolean))
    ).sort();

    const calculateDaysRemaining = (targetDate: string): {
        days: number;
        status: 'remaining' | 'today' | 'overdue';
        text: string;
        color: string;
        badgeColor: 'success' | 'warning' | 'error' | 'informative';
    } => {
        const target = new Date(targetDate);
        const today = new Date();

        target.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = target.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return {
                days: 0,
                status: 'today',
                text: '0 days remaining',
                color: 'orange',
                badgeColor: 'warning'
            };
        } else if (diffDays > 0) {
            return {
                days: diffDays,
                status: 'remaining',
                text: `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`,
                color: 'green',
                badgeColor: 'success'
            };
        } else {
            const overdueDays = Math.abs(diffDays);
            return {
                days: overdueDays,
                status: 'overdue',
                text: `${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`,
                color: 'red',
                badgeColor: 'error'
            };
        }
    };

    const handleRequestStatus = (hiredCandidate: number | undefined, numPositions: number, daysStatus: { days: number; status: 'remaining' | 'today' | 'overdue'; text: string; color: string; badgeColor: 'success' | 'warning' | 'error' | 'informative'; }) => {
        if (hiredCandidate === undefined) {
            return { text: 'Not Started', color: '#9CA3AF', background: '#c5c5c5ff' };
        }

        if (hiredCandidate >= numPositions && daysStatus.status !== 'overdue') {
            return { text: 'Completed', color: '#047857', background: '#D1FAE5' };
        } else if (hiredCandidate < numPositions && daysStatus.status !== 'overdue') {
            return { text: 'Pending', color: '#B45309', background: '#FEF3C7' };
        } else if (hiredCandidate < numPositions && daysStatus.status === 'overdue') {
            return { text: 'Overdue', color: '#BE123C', background: '#FFE4E6' }
        } else {
            return { text: 'Completed', color: '#047857', background: '#D1FAE5' };
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-8 h-full">
                <Spinner />
                <Body1Strong className="mt-2">Loading Interviewer Job Requests...</Body1Strong>
            </div>
        );
    }

    return (
        <FluentProvider className="!p-0 !bg-transparent">
            <div className="space-y-4 mx-auto">
                {/* Header with Search and Filters */}
                <div className="flex justify-between items-center">
                    <div>
                        <Subtitle2 className="text-[#152460] font-bold">
                            My Interview Assignments
                        </Subtitle2>
                        <Caption1 className="text-gray-600">
                            View and manage job descriptions assigned to you for interviews
                        </Caption1>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                    <CustomStatsCard
                        style={
                            isStatusCardActive("Published") ? "ring-2 ring-blue-500" : ""
                        }
                        onClick={() => handleStatusCardClick("Published")}
                    >
                        <CardPreview className="py-[17px] px-[20px]">
                            <div className="!flex flex-row items-center justify-between">
                                <div className="flex flex-col gap-[11px]">
                                    <div>
                                        <Text
                                            size={300}
                                            weight="semibold"
                                            className="!text-gray-700"
                                        >
                                            Published
                                        </Text>
                                    </div>
                                    <div>
                                        <Text
                                            size={600}
                                            weight="semibold"
                                            className="text-2xl font-bold"
                                        >
                                            {jdStats.published}
                                        </Text>
                                    </div>
                                </div>
                                <div className={classes.published}>
                                    <Avatar
                                        color="lavender"
                                        size={36}
                                        icon={
                                            <div className="bg-[#F1E8FF] rounded-full p-[15px]">
                                                <ArrowSyncCheckmark20Regular
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
                        style={isPositionStatusCardActive("open") ? "ring-2 ring-blue-500" : ""}
                        onClick={() => handlePositionStatusCardClick("open")}
                    >
                        <CardPreview className="py-[17px] px-[20px]">
                            <div className="!flex flex-row items-center justify-between">
                                <div className="flex flex-col gap-[11px]">
                                    <div>
                                        <Text size={300} weight="semibold" className="!text-gray-700">
                                            Open
                                        </Text>
                                    </div>
                                    <div>
                                        <Text size={600} weight="semibold" className="text-2xl font-bold">
                                            {jdStats.openPositions}
                                        </Text>
                                    </div>
                                </div>
                                <div className={classes.active}>
                                    <Avatar
                                        color="blue"
                                        size={36}
                                        icon={
                                            <div className="bg-[#E0F2FE] rounded-full p-[15px]">
                                                <People20Regular
                                                    style={{
                                                        height: "30px",
                                                        width: "30px",
                                                        color: "#0284C7",
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
                        style={isPositionStatusCardActive("closed") ? "ring-2 ring-blue-500" : ""}
                        onClick={() => handlePositionStatusCardClick("closed")}
                    >
                        <CardPreview className="py-[17px] px-[20px]">
                            <div className="!flex flex-row items-center justify-between">
                                <div className="flex flex-col gap-[11px]">
                                    <div>
                                        <Text size={300} weight="semibold" className="!text-gray-700">
                                            Closed
                                        </Text>
                                    </div>
                                    <div>
                                        <Text size={600} weight="semibold" className="text-2xl font-bold">
                                            {jdStats.closedPositions}
                                        </Text>
                                    </div>
                                </div>
                                <div className={classes.published}>
                                    <Avatar
                                        size={36}
                                        icon={
                                            <div className="bg-[#DCFCE7] rounded-full p-[15px]">
                                                <ArrowSyncCheckmark20Regular
                                                    style={{
                                                        height: "30px",
                                                        width: "30px",
                                                        color: "#16A34A",
                                                    }}
                                                />
                                            </div>
                                        }
                                    />
                                </div>
                            </div>
                        </CardPreview>
                    </CustomStatsCard>

                    <Divider vertical />

                    <CustomStatsCard
                        style={
                            isStatusCardActive("all") && positionStatusFilter === "all"
                                ? "ring-2 ring-blue-500"
                                : ""
                        }
                        onClick={() => {
                            setStatusFilter("all");
                            setPositionStatusFilter("all");
                            setPagination((prev) => ({ ...prev, currentPage: 1 }));
                        }}
                    >
                        <CardPreview className="py-[17px] px-[20px]">
                            <div className="!flex flex-row items-center justify-between">
                                <div className="flex flex-col gap-[11px]">
                                    <div>
                                        <Text
                                            size={300}
                                            weight="semibold"
                                            className="!text-gray-700"
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
                                            {jdStats.total}
                                        </Text>
                                    </div>
                                </div>
                                <div className={classes.total}>
                                    <Avatar
                                        color="blue"
                                        size={36}
                                        icon={
                                            <div className="bg-[#ECFEFF] rounded-full p-[15px]">
                                                <People20Regular
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

                {/* Table */}
                <Card className="w-full shadow-lg !rounded-xl border-0 overflow-scroll bg-white">
                    {/* Search and Filters */}
                    <div className="grid grid-cols-12 gap-2 ">
                        <div className="flex col-span-6 xs:col-span-12">
                            <SearchBox
                                placeholder="Search by JD code, job role, department or location..."
                                value={searchQuery}
                                onChange={(_, data) => setSearchQuery(data.value)}
                                className="!w-full !max-w-full !min-w-0 "
                            />
                        </div>
                        <div className="grid-cols-1"></div>
                        <div className="grid grid-cols-6  col-span-5 xs:col-span-12 gap-2">
                            <Dropdown
                                placeholder="All Departments"
                                value={departmentFilter}
                                selectedOptions={[departmentFilter]}
                                onOptionSelect={(_, data) =>
                                    setDepartmentFilter(data.optionValue || "all")
                                }
                                className=" col-span-2 w-full !max-w-full !min-w-0 "
                            >
                                <Option value="all">All Departments</Option>
                                {uniqueDepartments.map((dept) => (
                                    <Option key={dept} value={dept}>
                                        {dept}
                                    </Option>
                                ))}
                            </Dropdown>

                            <Dropdown
                                placeholder="All Job Types"
                                value={jobNatureFilter}
                                selectedOptions={[jobNatureFilter]}
                                onOptionSelect={(_, data) =>
                                    setJobNatureFilter(data.optionValue || "all")
                                }
                                className="col-span-2 w-full !max-w-full !min-w-0 "
                            >
                                <Option value="all">All Job Types</Option>
                                {uniqueJobNatures.map((nature) => (
                                    <Option key={nature} value={nature}>
                                        {nature}
                                    </Option>
                                ))}
                            </Dropdown>

                            <Button
                                appearance="subtle"
                                icon={<FilterRegular />}
                                onClick={clearFilters}
                                disabled={
                                    searchQuery === "" &&
                                    statusFilter === "all" &&
                                    departmentFilter === "all" &&
                                    jobNatureFilter === "all"
                                }
                                className="col-span-2 !text-red-500 disabled:!text-gray-400 "
                            >
                                Clear
                            </Button>
                        </div>
                    </div>

                    {/* Scrollable Table Container */}
                    <div className="max-h-[500px] w-full overflow-scroll scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        <Table sortable className="w-full" >
                            <TableHeader className="sticky top-0 z-20 bg-gray-100">
                                <TableRow style={{ flex: "1 1 auto" }} className="border-b-2 border-gray-100 ">
                                    <TableHeaderCell
                                        className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group py-2 px-6"
                                        onClick={() => handleSort("JobRole")}
                                        colSpan={window.innerWidth > 1400 ? 1 : 2}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Body1Strong className="text-gray-600">
                                                Job Position
                                            </Body1Strong>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                {sortConfig?.key === "JobRole" &&
                                                    (sortConfig.direction === "asc" ? (
                                                        <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                                                    ) : (
                                                        <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                                                    ))}
                                            </div>
                                        </div>
                                    </TableHeaderCell>

                                    <TableHeaderCell className="py-2 px-6 w-[200px]">
                                        <Body1Strong className="text-gray-600">
                                            Hiring Progress
                                        </Body1Strong>
                                    </TableHeaderCell>

                                    {/* NEW: Interviewer Column */}
                                    <TableHeaderCell
                                        className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group py-2 px-6"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Body1Strong className="text-gray-600">
                                                HR
                                            </Body1Strong>
                                        </div>
                                    </TableHeaderCell>

                                    <TableHeaderCell
                                        className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group py-2 px-6"
                                        onClick={() => handleSort("CreatedAt")}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Body1Strong className="text-gray-600">
                                                Requested On
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

                                    <TableHeaderCell
                                        className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group py-2 px-6"
                                        onClick={() => handleSort("TargetDate")}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Body1Strong className="text-gray-600">
                                                Due Date
                                            </Body1Strong>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                {sortConfig?.key === "TargetDate" &&
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
                                        onClick={() => handleSort("LatestVersion")}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Body1Strong className="text-gray-600">
                                                Remaining
                                            </Body1Strong>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                {sortConfig?.key === "LatestVersion" &&
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
                                        onClick={() => handleSort("LatestVersion")}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Body1Strong className="text-gray-600">
                                                Version
                                            </Body1Strong>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                {sortConfig?.key === "LatestVersion" &&
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
                                        onClick={() => handleSort("Status")}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Body1Strong className="text-gray-600">
                                                Status
                                            </Body1Strong>
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

                                    <TableHeaderCell className="py-2 px-6">
                                        <Body1Strong className="text-gray-600">Actions</Body1Strong>
                                    </TableHeaderCell>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {paginatedRequests.map((request) => {
                                    const daysStatus = calculateDaysRemaining(request.TargetDate);
                                    const interviewerInfo = getInterviewerInfo(request);

                                    return (
                                        <TableRow
                                            key={request.ID}
                                            className="group hover:bg-gradient-to-r hover:from-blue-25 hover:to-indigo-25 transition-all duration-200 border-b border-gray-50 hover:shadow-sm"
                                        >
                                            <TableCell colSpan={window.innerWidth > 1400 ? 1 : 2} style={{ width: '200px', minWidth: '600px', maxWidth: '400px' }} className="!py-2 px-6 !w-auto !min-w-[400px]">
                                                <div className="flex flex-col items-start justify-start gap-2">
                                                    <span style={{ fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }} onClick={() =>
                                                        navigate(`/recruit/jdOverview/${request.ID}`)}>{request.JobRole}</span>
                                                    <span style={{ fontSize: 'smaller' }} className="flex gap-2">{request.Department} . {request.JDCode}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-5 px-6">
                                                <div className="space-y-2">
                                                    {request.HiredApplicantsCount !== undefined && (
                                                        <>
                                                            <div className="flex items-center gap-2 mb-0">
                                                                <div className="!font-semibold !text-xs w-full px-3 py-3 rounded-2xl flex justify-between items-center">
                                                                    <Text className="!font-semibold !text-xs">
                                                                        {request.HiredApplicantsCount} of {request.NumPositions} completed
                                                                    </Text>
                                                                    <Text>
                                                                        {Math.round(
                                                                            Math.min(
                                                                                (request.HiredApplicantsCount / request.NumPositions) * 100,
                                                                                100
                                                                            )
                                                                        )}
                                                                        %
                                                                    </Text>
                                                                </div>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                                <div
                                                                    className="bg-green-600 h-1.5 rounded-full"
                                                                    style={{
                                                                        width: `${Math.min(
                                                                            ((request.HiredApplicantsCount / request.NumPositions) * 100),
                                                                            100
                                                                        )}%`
                                                                    }}
                                                                ></div>
                                                            </div>
                                                        </>
                                                    )}
                                                    <div className="flex gap-2 items-center">
                                                        <span className="h-[10px] w-[10px] rounded-[50%]" style={{ backgroundColor: `${request.Status === 'Published' ? '#047857' : '#B45309'}` }}></span>
                                                        <span className="text-[10px]">{request.Status}</span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* NEW: Interviewer Cell with Avatar */}
                                            <TableCell className="py-5 px-6">
                                                <div className="flex items-center gap-3">
                                                    {interviewerInfo ? (
                                                        <>
                                                            <Tooltip
                                                                content={<div className="flex flex-col gap-1">
                                                                    <span>{interviewerInfo.displayName}</span>

                                                                    {interviewerInfo.email && (
                                                                        <span>({interviewerInfo.email})</span>
                                                                    )}

                                                                    {interviewerInfo.department && (
                                                                        <span>{interviewerInfo.department}</span>
                                                                    )}
                                                                </div>}
                                                                relationship="label"
                                                            >
                                                                <Avatar
                                                                    className={classes.interviewerAvatar}
                                                                    // color={getAvatarColor(interviewerInfo.id)}
                                                                    name={interviewerInfo.displayName}
                                                                    initials={getInitials(interviewerInfo.displayName)}
                                                                    size={32}
                                                                    badge={{
                                                                        status: "available",
                                                                        outOfOffice: false
                                                                    }}
                                                                />
                                                            </Tooltip>
                                                            {/* <div className="flex flex-col">
                                                                <Text className="!font-semibold !text-xs text-gray-900">
                                                                    {interviewerInfo.displayName}
                                                                </Text>
                                                                {interviewerInfo.email && (
                                                                    <Caption1 className="text-gray-500">
                                                                        {interviewerInfo.email}
                                                                    </Caption1>
                                                                )}
                                                                {interviewerInfo.department && (
                                                                    <Caption1 className="text-gray-400 text-xs">
                                                                        {interviewerInfo.department}
                                                                    </Caption1>
                                                                )}
                                                            </div> */}
                                                        </>
                                                    ) : request.InterviewerID ? (
                                                        // Show loading/placeholder while fetching
                                                        <div className="flex items-center gap-2">
                                                            <Spinner size="tiny" />
                                                            <Caption1 className="text-gray-500">
                                                                Loading...
                                                            </Caption1>
                                                        </div>
                                                    ) : (
                                                        // No interviewer assigned
                                                        <div className="flex items-center gap-2">
                                                            <Avatar
                                                                className={classes.interviewerAvatar}
                                                                //   color="gray"
                                                                icon={<PersonCircleRegular />}
                                                                size={32}
                                                            />
                                                            <Caption1 className="text-gray-500 italic">
                                                                Not assigned
                                                            </Caption1>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-5 px-6 flex !justify-start">
                                                <div className="space-y-2 flex items-start justify-start gap-2 h-[40px] w-[full]">
                                                    <Badge
                                                        appearance="ghost"
                                                        color="brand"
                                                        className="cursor-pointer !text-gray-600 font-width-light flex flex-col !items-start !justify-start gap-1 !h-[45px]"
                                                    >
                                                        {formatDate(request.CreatedAt)}
                                                    </Badge>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-5 px-6 flex !justify-start">
                                                <div className="space-y-2 flex items-start justify-start gap-2 h-[40px] w-[full]">
                                                    <Badge
                                                        appearance="ghost"
                                                        color="brand"
                                                        className="cursor-pointer !text-gray-600 font-width-light flex flex-col !items-start !justify-start gap-1 !h-[45px]"
                                                    >
                                                        {formatDate(request.TargetDate)}
                                                    </Badge>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-5 px-6">
                                                <div className="flex items-center justify-start">
                                                    <Tooltip content={`${daysStatus.text}`} relationship={'label'}>
                                                        <Text
                                                            className={`
                                cursor-pointer font-medium !text-xs
                                ${daysStatus.status === 'today' ? '!text-orange-600' :
                                                                    daysStatus.status === 'remaining' ? '!text-green-600' :
                                                                        '!text-red-600'}
                              `}>
                                                            {(handleRequestStatus(request.HiredApplicantsCount, request.NumPositions, daysStatus)?.text === 'Completed') ? (
                                                                <span style={{ color: '#047857' }}>Completed</span>
                                                            ) : (<span>{daysStatus.text}</span>)}
                                                        </Text>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-5 px-6">
                                                <div className="flex items-center justify-start">
                                                    <Tooltip content={"View History"} relationship={'label'}>
                                                        <Text className="!text-xs !font-bold bg-[#F1F5F9] !px-[15px] !py-[8px] rounded-[5px] flex items-center !gap-[6px] cursor-pointer">
                                                            <ApprovalsApp20Regular style={{ height: '15px', width: '15px' }} />v{request.LatestVersion > 0 ? request.LatestVersion : 0}
                                                        </Text>
                                                    </Tooltip>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-5 px-6">
                                                <div className="flex items-center justify-start"
                                                    style={{
                                                        backgroundColor: `${handleRequestStatus(request.HiredApplicantsCount, request.NumPositions, daysStatus)?.background}`,
                                                        color: `${handleRequestStatus(request.HiredApplicantsCount, request.NumPositions, daysStatus)?.color}`,
                                                        display: 'flex',
                                                        justifyContent: 'center',
                                                        alignItems: 'center',
                                                        padding: '8px 6px',
                                                        borderRadius: '30px',
                                                        border: `1px solid ${handleRequestStatus(request.HiredApplicantsCount, request.NumPositions, daysStatus)?.color}40`
                                                    }}>
                                                    <span>{handleRequestStatus(request.HiredApplicantsCount, request.NumPositions, daysStatus)?.text}</span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-5 px-6">
                                                <div className="flex gap-2 transition-all duration-200">
                                                    <Tooltip content="View Details" relationship="label">
                                                        <Button
                                                            appearance="subtle"
                                                            icon={<EyeRegular />}
                                                            size="small"
                                                            onClick={() => handleViewDetails(request)}
                                                        />
                                                    </Tooltip>

                                                    <Menu>
                                                        <MenuTrigger disableButtonEnhancement>
                                                            <MenuButton
                                                                appearance="subtle"
                                                                icon={
                                                                    <MoreHorizontal20Regular color="#9CA3AF" />
                                                                }
                                                                size="small"
                                                            />
                                                        </MenuTrigger>
                                                        <MenuPopover>
                                                            <MenuList>
                                                                <MenuItem
                                                                    icon={<DocumentTextRegular />}
                                                                    onClick={() =>
                                                                        navigate(
                                                                            `/recruit/jdOverview/${request.ID}`
                                                                        )
                                                                    }
                                                                >
                                                                    View Full Details
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
                    </div>

                    {/* Empty State */}
                    {paginatedRequests.length === 0 && !isLoading && (
                        <div className="text-center py-20 flex flex-col items-center bg-gradient-to-b from-gray-50 to-white">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                                <PersonRegular className="w-10 h-10 text-blue-600" />
                            </div>
                            <Subtitle2 className="mb-3 text-gray-700">
                                No interview assignments found
                            </Subtitle2>
                            <div className="text-center">
                                <Body1 className="text-gray-500 max-w-md mx-auto leading-relaxed flex flex-row items-center justify-center">
                                    {searchQuery ||
                                        statusFilter !== "all" ||
                                        departmentFilter !== "all" ||
                                        jobNatureFilter !== "all"
                                        ? "No interview assignments match your search criteria."
                                        : "You don't have any interview assignments at the moment."}
                                </Body1>
                            </div>

                            {(searchQuery ||
                                statusFilter !== "all" ||
                                departmentFilter !== "all" ||
                                jobNatureFilter !== "all") && (
                                    <Button
                                        appearance="primary"
                                        onClick={clearFilters}
                                        className="mt-4 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        Clear All Filters
                                    </Button>
                                )}
                        </div>
                    )}

                    {/* Table Footer with Pagination */}
                    {paginatedRequests.length > 0 && (
                        <div className="bg-gray-50 border-t border-gray-100 px-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
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
                                        of {filteredRequests.length} assignments
                                    </Caption1>
                                </div>

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

                {/* Drawer for JD Details */}
                <OverlayDrawer
                    open={isDrawerOpen}
                    onOpenChange={(_, data) => setIsDrawerOpen(data.open)}
                    position="end"
                    size="large"
                >
                    <DrawerHeader style={{ paddingBottom: "20px" }}>
                        <DrawerHeaderTitle
                            action={
                                <Button
                                    appearance="subtle"
                                    icon={<DismissRegular />}
                                    onClick={() => setIsDrawerOpen(false)}
                                />
                            }
                        >
                            Job Description
                        </DrawerHeaderTitle>
                    </DrawerHeader>
                    <DrawerBody>
                        {selectedJDRequest && (
                            <PreviewJDForm id={selectedJDRequest.ID} isNeedControls={false} />
                        )}
                    </DrawerBody>
                </OverlayDrawer>
            </div>
            <Toaster toasterId={toasterId} />
        </FluentProvider>
    );
};

export default InterviewerJDRequestsTable;