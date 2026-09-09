// components/Recruit/JDRequestsTable.tsx

import React, { useState, useEffect, useCallback, useRef, FC } from "react";
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
  useId,
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
  Toast,
  ToastTitle,
  Toaster,
  FluentProvider,
  CardPreview,
  Avatar,
  Divider,
  makeStyles,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Persona,
  Field,
  Combobox,
  ComboboxProps,
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
  CalendarLtr20Regular,
  PeopleProhibited16Regular,
  Person20Regular,
  Briefcase16Regular,
  Building16Regular,
  Briefcase16Filled,
  Building16Filled,
} from "@fluentui/react-icons";
import { useToastController } from "@fluentui/react-components";
import PreviewJDForm from "./PreviewJDForm";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CustomPagination from "../Components/CustomPagination";
import { useAuth } from "../../Auth/AuthProvider";
import CustomStatsCard from "../Components/CustomStatsCard";
import { getDataForExcelExport, reassignHr, searchUsersByDepartment, searchUsersWithDetails, searchUsersWithoutDetails } from "../../Services/JDRequests";
import { getJDRequestVersionHistory, VersionHistory } from "../../Services/JDRequestVHistory";
import { fetchProfilePicture1, getUserByID } from "../../Services/GraphAPI";
import { UserDetails } from "../../Services/Offboarding";
import JobDescriptionRenderer from "../Components/JobDescriptionRenderer";

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
});

interface InterviewerInfo {
  id: string;
  displayName: string;
  email: string;
  department?: string;
  position?: string;
  profilePicture?: string;
}

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
  LatestVersion: number;  // Add this - it's already in your interface
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
  InterviewerID?: string | null;
  interviewer?: InterviewerInfo;
  SubordinateID?: string
}

interface JDRequestsTableProps {
  refreshTrigger?: number;
}

interface JDStats {
  active: number;
  inactive: number;
  published: number;
  total: number;
  openPositions: number;      // NEW
  closedPositions: number;
  // closedJds: number;
}

export interface UserPermissions {
  recruit?: {
    job_posting?: {
      view_job?: {
        view_all?: boolean;
        view_my?: boolean;
      };
      create_job?: boolean;
      edit_job?: boolean;
      delete_job?: boolean;
    };
    hiring_template?: boolean;
    location?: boolean;
    department?: boolean;
    candidate_app?: {
      manage_app?: boolean;
      approve_reject_app?: boolean;
    };
    interview_schedule?: {
      create_interview?: boolean;
      modify_interview?: boolean;
    };
    interview_feedback?: {
      view_all_feedback?: boolean;
      view_my_feedback?: boolean;
    };
  };
  onboarding?: {
    manage_onboarding?: {
      create_onboarding?: boolean;
      edit_onboarding?: boolean;
      delete_onboarding?: boolean;
    };
    onboarding_tasks?: {
      view_all_tasks?: boolean;
      view_my_tasks?: boolean;
    };
    induction_tasks?: boolean;
  };
  background_verification?: {
    bgv_view?: {
      view_all_bgv?: boolean;
      view_my_bgv?: boolean;
    };
    bgv_manage?: {
      create_bgv?: boolean;
      edit_bgv?: boolean;
      delete_bgv?: boolean;
    };
    bgv_approve?: boolean;
    bgv_close?: boolean;
    document_management?: boolean;
  };
  offboarding?: {
    offboarding_manage?: {
      create_offboarding?: boolean;
      edit_offboarding?: boolean;
      delete_offboarding?: boolean;
    };
    offboarding_view?: {
      view_all_offboarding?: boolean;
      view_my_offboarding?: boolean;
    };
    lead_clearance?: boolean;
    it_clearance?: boolean;
    asset_clearance?: boolean;
    finance_clearance?: boolean;
    it_activity_management?: boolean;
    admin_activity_management?: boolean;
    finance_activity_management?: boolean;
  };
  permissions?: {
    permission_matrix?: boolean;
    user_role_management?: boolean;
  };
}

interface InterviewerInfo {
  id: string;
  displayName: string;
  email: string;
  department?: string;
  position?: string;
  profilePicture?: string; // Add profile picture URL
}

interface UserComboboxProps {
  label: string;
  placeholder: string;
  value: string;
  onUserSelect: (user: UserDetails | null) => void;
  required?: boolean;
  disabled?: boolean;
  validationState?: "error" | "warning" | "success" | "none";
  validationMessage?: string;
  icon?: React.ReactNode;


  currentUser?: any;
  userId?: string; // Add this for direct user lookup
  handleDisableField?: () => void
  handleEnableField?: () => void
}


const UserCombobox: FC<UserComboboxProps> = ({
  label,
  placeholder,
  value,
  onUserSelect,
  required = false,
  disabled = false,
  validationState = "none",
  validationMessage,
  icon,

  currentUser,
}) => {
  const [query, setQuery] = useState<string>("");
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { accessToken }: any = useAuth();
  const componentId = useId("user-combobox");



  // Load department users when combobox opens
  const loadDepartmentUsers = async () => {


    try {
      setLoading(true);
      setError("");

      // Use backend API endpoint
      const departmentUsers = await searchUsersWithoutDetails(
        query, // Empty query to get all users
        accessToken,
        import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"
      );

      setUsers(departmentUsers);
      // test

      // Auto-select current user if they're in the department and no manager is set
      if (currentUser && departmentUsers.length > 0) {
        const currentUserInDept = departmentUsers.find(
          (user) => user.id === currentUser.userID
        );
        if (currentUserInDept) {
          onUserSelect(currentUserInDept);
          setQuery(currentUserInDept.displayName);
        }
      }
    } catch (error: any) {
      console.error("Error loading department users:", error);
      setError("Failed to load users. Please try again.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Search users with department filter
  useEffect(() => {
    const searchUsers = async () => {


      // If no query, load all department users when opened
      if (!query || query.length < 2) {
        if (isOpen && !query) {
          loadDepartmentUsers();
        }
        return;
      }

      setLoading(true);
      setError("");

      try {
        const results = await searchUsersByDepartment(
          query,
          accessToken,
          "Talent Acquisition"
        );
        setUsers(results);

        if (results.length === 0 && query.length >= 2) {
          setError(`No users found matching "${query}"`);
        }
      } catch (error: any) {
        console.error("Error searching users:", error);
        setError("Search failed. Please try again.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query, accessToken, isOpen]);

  const onOptionSelect: ComboboxProps["onOptionSelect"] = (e, data) => {
    const selectedUser = users.find((u) => u.id === data.optionValue);
    if (selectedUser) {
      setQuery(selectedUser.displayName);
      onUserSelect(selectedUser);
      setIsOpen(false);
      setError("");
    }
  };

  const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = ev.target.value;
    setQuery(newValue);
    setError("");

    if (!newValue) {
      onUserSelect(null);
      setIsOpen(true);
    }
  };

  const handleOpenChange = (e: any, data: any) => {
    setIsOpen(data.open);
    if (data.open && !query) {
      loadDepartmentUsers();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Option key={`${componentId}-loading`} text="Loading..." disabled>
          <div className="flex items-center gap-2">
            <Spinner size="tiny" />
            Loading users...
          </div>
        </Option>
      );
    }



    if (error) {
      return (
        <Option key={`${componentId}-error`} text={error} disabled>
          <div className="flex flex-col">
            <Text className="text-red-600">{error}</Text>
            <Caption1 className="text-gray-500">
              Try adjusting your search or contact support
            </Caption1>
          </div>
        </Option>
      );
    }

    if (users.length === 0 && query.length >= 2) {
      return (
        <Option
          key={`${componentId}-no-results`}
          text={`No users found `}
          disabled
        >
          <div className="flex flex-col">
            <Text>No users found matching "{query}"</Text>

          </div>
        </Option>
      );
    }

    if (users.length === 0) {
      return (
        <Option
          key={`${componentId}-empty`}
          text="Type to search or open to see all"
          disabled
        >
          <div className="flex flex-col">
            <Text>Open dropdown to see all users</Text>
            <Caption1 className="text-blue-500 mt-1">
              Or type to search
            </Caption1>
          </div>
        </Option>
      );
    }

    return users.map((user, index) => (
      <Option
        key={`${componentId}-${user.id}-${index}`}
        value={user.id}
        text={user.displayName}
      >
        <div className="flex flex-col py-1">
          <Persona
            avatar={{ color: "colorful", "aria-hidden": true }}
            name={user.displayName}
            secondaryText={user.email}
          />
          {user.department && (
            <Caption1 className="text-blue-600 mt-0.5 ml-10">
              {user.department}
            </Caption1>
          )}
        </div>
      </Option>
    ));
  };

  return (
    <Field
      orientation="vertical"
      label={<>
        <Person20Regular /> {label}</>
      }
      required={required}
      className="flex-1 w-full"
      validationState={validationState}
      validationMessage={validationMessage}
    >
      <Combobox
        className="w-full min-w-[100px]"
        onOptionSelect={onOptionSelect}
        placeholder={

          `Search or select user...`
        }
        onChange={handleInputChange}
        value={query}
        disabled={disabled}
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        {renderContent()}
      </Combobox>
    </Field>
  );
};

const JDRequestsTable: React.FC<JDRequestsTableProps> = ({
  refreshTrigger,
}) => {
  const { currentUser, accessToken } = useAuth();
  const classes = useStyles();

  // State management
  const [allRequests, setAllRequests] = useState<JDRequest[]>([]);
  const [paginatedRequests, setPaginatedRequests] = useState<JDRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching,setIsSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [jobNatureFilter, setJobNatureFilter] = useState<string>("all");
  const [selectedJDRequest, setSelectedJDRequest] = useState<JDRequest | null>(
    null
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<JDRequest | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const params = useLocation();
  const hrUserId = params.search?.split('=')[1];
  console.log("Search Params:", params.search?.split('=')[1]);
  const navigate = useNavigate();
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);
  const today = new Date()

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
    openPositions: 0,     // NEW
    closedPositions: 0,
    // closedJds: 0,
  });
  const [tempjdStats, setTempJdStats] = useState<JDStats>({
    active: 0,
    inactive: 0,
    published: 0,
    total: 0,
    openPositions: 0,     // NEW
    closedPositions: 0,
    // closedJds: 0,
  });
  const [positionStatusFilter, setPositionStatusFilter] = useState<string>("all");

  const [interviewerProfiles, setInterviewerProfiles] = useState<Record<string, InterviewerInfo>>({});
  const [profileCache, setProfileCache] = useState<Record<string, InterviewerInfo>>({});

  // Add this state variable with your other filters
  const [hrFilter, setHrFilter] = useState<string | undefined>(hrUserId || undefined);
  const [showFilterAlert, setShowFilterAlert] = useState<boolean>(true);
  const [uniqueHRs,setUniqueHrs] = useState<{id:string,displayName:string,email:string}[]>([])

  // Keep the filter alert visible when filters are active
  useEffect(() => {
    const anyActive = statusFilter !== "all" || positionStatusFilter !== "all" || hrFilter !== undefined;
    if (anyActive) {
      setShowFilterAlert(true);
    }
  }, [statusFilter, positionStatusFilter, hrFilter]);

  // Add to your existing state variables
  // Date filter states
  type DateFilterType = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';
  const [dateFilterType, setDateFilterType] = useState<DateFilterType>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialMount = useRef(true);
  const fetchingProfilesRef = useRef<Set<string>>(new Set());



  const [OpenReassignDialog, setOpenReassignDialog] = useState(false)
  const [ReassignData, setReassignData] = useState<JDRequest | null>(null)
  const [ReassignedHr, setReassignHr] = useState<{ id: string, displayName: string, email: string } | null>(null)
  const [IsLoadingReassign, setIsLoadingReassign] = useState(false)

  // Handle open reassign

  const handleOpenReassignDialog = (request: JDRequest) => {
    setReassignData(request)
    setOpenReassignDialog(true)
    setReassignHr(null)
  }

  const handleCloseReassignDialog = () => {
    setReassignData(null)
    setOpenReassignDialog(false)
  }



  // Get date range based on filter type and selected date
  const getDateRange = (): { startDate: Date | null; endDate: Date | null } => {
    if (dateFilterType === 'all') {
      return { startDate: null, endDate: null };
    }

    const baseDate = new Date(selectedDate);
    baseDate.setHours(0, 0, 0, 0);

    switch (dateFilterType) {
      case 'today':
        const startOfDay = new Date(baseDate);
        const endOfDay = new Date(baseDate);
        endOfDay.setDate(endOfDay.getDate() + 1);
        return { startDate: startOfDay, endDate: endOfDay };

      case 'week':
        const startOfWeek = new Date(baseDate);
        startOfWeek.setDate(baseDate.getDate() - baseDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return { startDate: startOfWeek, endDate: endOfWeek };

      case 'month':
        const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        const endOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 1);
        return { startDate: startOfMonth, endDate: endOfMonth };

      case 'quarter':
        const quarter = Math.floor(baseDate.getMonth() / 3);
        const startOfQuarter = new Date(baseDate.getFullYear(), quarter * 3, 1);
        const endOfQuarter = new Date(baseDate.getFullYear(), quarter * 3 + 3, 1);
        return { startDate: startOfQuarter, endDate: endOfQuarter };

      case 'year':
        const startOfYear = new Date(baseDate.getFullYear(), 0, 1);
        const endOfYear = new Date(baseDate.getFullYear() + 1, 0, 1);
        return { startDate: startOfYear, endDate: endOfYear };

      default:
        return { startDate: null, endDate: null };
    }
  };

  // Check if a date falls within the filter range
  const isWithinDateRange = (dateString: string | null | undefined): boolean => {
    if (dateFilterType === 'all') return true;
    if (!dateString) return false;

    const { startDate, endDate } = getDateRange();
    if (!startDate && !endDate) return false;

    const date = new Date(dateString);
    date.setHours(0, 0, 0, 0);

    if (startDate && endDate) {
      return date >= startDate && date < endDate;
    }

    return false;
  };



  // CalendarToggleButton component (update lines 100-130)
  const CalendarToggleButton = () => {
    const getDateFilterDisplay = () => {
      if (dateFilterType === 'all') return 'Select Date Range';

      const { startDate, endDate } = getDateRange();
      if (!startDate || !endDate) return 'Select Date';

      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      };

      switch (dateFilterType) {
        case 'today':
          return `Today: ${formatDate(startDate)}`;
        case 'week':
          const weekEnd = new Date(endDate);
          weekEnd.setDate(weekEnd.getDate() - 1);
          return `${formatDate(startDate)} - ${formatDate(weekEnd)}`;
        case 'month':
          return startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        case 'quarter':
          const quarter = Math.floor(startDate.getMonth() / 3) + 1;
          return `Q${quarter} ${startDate.getFullYear()}`;
        case 'year':
          return startDate.getFullYear().toString();
        default:
          return formatDate(startDate);
      }
    };

    return (
      <button
        onClick={() => setShowCalendar(!showCalendar)}
        style={{
          border: '1px solid #e5e7eb',
          background: showCalendar ? '#0C59A4' : '#ffffff',
          color: showCalendar ? 'white' : '#374151'
        }}
        className="cursor-pointer px-4 py-2 rounded-[30px] hover:shadow-md transition-all flex items-center gap-2 text-sm font-medium"
      >
        <CalendarLtr20Regular />
        <span>{getDateFilterDisplay()}</span>
      </button>
    );
  };

  // Update the renderCalendar function (lines 132-230)
  const renderCalendar = () => {
    const currentMonth = selectedDate.getMonth();
    const currentYear = selectedDate.getFullYear();

    if (dateFilterType === 'today' || dateFilterType === 'all') {
      // Daily calendar - standard month view with day selection
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const days = [];

      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="p-2"></div>);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const isSelected = selectedDate.toDateString() === date.toDateString();
        const isToday = new Date().toDateString() === date.toDateString();

        days.push(
          <button
            key={day}
            onClick={() => {
              setSelectedDate(date);
              setShowCalendar(false);
            }}
            className={`p-2 text-sm rounded hover:bg-blue-100 ${isSelected ? 'bg-[#0C59A4] text-white hover:bg-blue-700' : ''
              } ${isToday && !isSelected ? 'border border-blue-600' : ''}`}
          >
            {day}
          </button>
        );
      }

      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
              className="px-2 py-1 hover:bg-gray-100 rounded"
            >
              ‹
            </button>
            <Text weight="semibold">
              {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <button
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
              className="px-2 py-1 hover:bg-gray-100 rounded"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-semibold p-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{days}</div>
        </div>
      );
    } else if (dateFilterType === 'week') {
      // Weekly calendar - show weeks of the month
      const weeks = [];
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

      let currentWeekStart = new Date(startOfMonth);
      currentWeekStart.setDate(1 - startOfMonth.getDay());

      while (currentWeekStart <= endOfMonth) {
        const weekStart = new Date(currentWeekStart);
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const selectedWeekStart = new Date(selectedDate);
        selectedWeekStart.setDate(selectedDate.getDate() - selectedDate.getDay());

        const isSelected = weekStart.toDateString() === selectedWeekStart.toDateString();

        weeks.push(
          <button
            key={weekStart.toISOString()}
            onClick={() => handleCalendarDateSelect(weekStart)}
            className={`p-3 text-sm rounded border hover:bg-blue-100 ${isSelected ? 'bg-[#0C59A4] text-white border-blue-600 hover:bg-blue-700' : 'border-gray-200'
              }`}
          >
            <div className="font-semibold">Week {Math.ceil((weekStart.getDate() + startOfMonth.getDay()) / 7)}</div>
            <div className="text-xs mt-1">
              {weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          </button>
        );

        currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      }

      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
              className="px-2 py-1 hover:bg-gray-100 rounded"
            >
              ‹
            </button>
            <Text weight="semibold">
              {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <button
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
              className="px-2 py-1 hover:bg-gray-100 rounded"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2">{weeks}</div>
        </div>
      );
    } else if (dateFilterType === 'month') {
      // Monthly calendar - show all months of the year
      const months = [];
      for (let month = 0; month < 12; month++) {
        const monthDate = new Date(currentYear, month, 1);
        const isSelected = selectedDate.getMonth() === month && selectedDate.getFullYear() === currentYear;

        months.push(
          <button
            key={month}
            onClick={() => handleCalendarDateSelect(monthDate)}
            className={`p-3 text-sm rounded border hover:bg-blue-100 ${isSelected ? 'bg-[#0C59A4] text-white border-blue-600 hover:bg-blue-700' : 'border-gray-200'
              }`}
          >
            {monthDate.toLocaleDateString('en-US', { month: 'long' })}
          </button>
        );
      }

      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setSelectedDate(new Date(currentYear - 1, 0, 1))}
              className="px-2 py-1 hover:bg-gray-100 rounded"
            >
              ‹
            </button>
            <Text weight="semibold">{currentYear}</Text>
            <button
              onClick={() => setSelectedDate(new Date(currentYear + 1, 0, 1))}
              className="px-2 py-1 hover:bg-gray-100 rounded"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">{months}</div>
        </div>
      );
    } else if (dateFilterType === 'quarter') {
      // Quarterly calendar - show all quarters of the year
      const quarters = [
        { label: 'Q1', months: 'Jan - Mar', month: 0 },
        { label: 'Q2', months: 'Apr - Jun', month: 3 },
        { label: 'Q3', months: 'Jul - Sep', month: 6 },
        { label: 'Q4', months: 'Oct - Dec', month: 9 }
      ];

      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setSelectedDate(new Date(currentYear - 1, 0, 1))}
              className="px-2 py-1 hover:bg-gray-100 rounded"
            >
              ‹
            </button>
            <Text weight="semibold">{currentYear}</Text>
            <button
              onClick={() => setSelectedDate(new Date(currentYear + 1, 0, 1))}
              className="px-2 py-1 hover:bg-gray-100 rounded"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quarters.map((quarter) => {
              const quarterDate = new Date(currentYear, quarter.month, 1);
              const selectedQuarter = Math.floor(selectedDate.getMonth() / 3);
              const currentQuarterIndex = Math.floor(quarter.month / 3);
              const isSelected = selectedQuarter === currentQuarterIndex && selectedDate.getFullYear() === currentYear;

              return (
                <button
                  key={quarter.label}
                  onClick={() => handleCalendarDateSelect(quarterDate)}
                  className={`p-4 text-sm rounded border hover:bg-blue-100 ${isSelected ? 'bg-[#0C59A4] text-white border-blue-600 hover:bg-blue-700' : 'border-gray-200'
                    }`}
                >
                  <div className="font-semibold text-lg">{quarter.label}</div>
                  <div className="text-xs mt-1">{quarter.months}</div>
                </button>
              );
            })}
          </div>
        </div>
      );
    } else if (dateFilterType === 'year') {
      // Annual calendar - show years
      const startYear = Math.floor(currentYear / 10) * 10;
      const years = [];

      for (let year = startYear; year < startYear + 12; year++) {
        const yearDate = new Date(year, 0, 1);
        const isSelected = selectedDate.getFullYear() === year;

        years.push(
          <button
            key={year}
            onClick={() => handleCalendarDateSelect(yearDate)}
            className={`p-3 text-sm rounded border hover:bg-blue-100 ${isSelected ? 'bg-[#0C59A4] text-white border-blue-600 hover:bg-blue-700' : 'border-gray-200'
              }`}
          >
            {year}
          </button>
        );
      }

      return (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setSelectedDate(new Date(startYear - 10, 0, 1))}
              className="px-2 py-1 hover:bg-gray-100 rounded"
            >
              ‹
            </button>
            <Text weight="semibold">{startYear} - {startYear + 11}</Text>
            <button
              onClick={() => setSelectedDate(new Date(startYear + 10, 0, 1))}
              className="px-2 py-1 hover:bg-gray-100 rounded"
            >
              ›
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">{years}</div>
        </div>
      );
    }

    return null;
  };

  // Helper function to safely check permissions
  const checkPermission = (permissionPath: string) => {
    const paths = permissionPath.split(".");
    let current: any = currentUser?.permissions;

    for (const path of paths) {
      if (!current || current[path] === undefined) {
        return false;
      }
      current = current[path];
    }

    return current === true;
  };

  // Add this helper function
  const handleCalendarDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowCalendar(false);
  };

  // Add this useEffect with your other useEffect hooks
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node) &&
        showCalendar
      ) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  // Get unique HR/interviewers for filter
  

  const fetchInterviewerProfile = useCallback(async (userId: string) => {
    // Use a ref to guard against duplicate in-flight requests (avoids stale-closure race condition)
    if (!userId || fetchingProfilesRef.current.has(userId)) {
      return;
    }
    fetchingProfilesRef.current.add(userId);

    try {
      if (!accessToken) {
        console.error("Access token is not available");
        fetchingProfilesRef.current.delete(userId);
        return;
      }
      const profile = await fetchProfilePicture1(userId, accessToken);

      // Update both cache and state
      setProfileCache(prev => ({ ...prev, [userId]: profile }));
      setInterviewerProfiles(prev => ({ ...prev, [userId]: profile }));
    } catch (error) {
      console.error(`Failed to fetch profile for ${userId}:`, error);
      // Set a placeholder to avoid retrying
      const placeholder: InterviewerInfo = {
        id: userId,
        displayName: 'Unknown User',
        email: 'No email available',
        profilePicture: ''
      };
      setProfileCache(prev => ({ ...prev, [userId]: placeholder }));
      setInterviewerProfiles(prev => ({ ...prev, [userId]: placeholder }));
    }
  }, [accessToken]); // removed profileCache and interviewerProfiles — ref guards duplicates

  // utils/permissionHelpers.ts

  const checkRecruitPermission = (
    permissions: UserPermissions | undefined,
    permissionPath: string
  ): boolean => {
    if (!permissions) return false;

    const paths = permissionPath.split(".");
    let current: any = permissions;

    for (const path of paths) {
      if (!current || current[path] === undefined) {
        return false;
      }
      current = current[path];
    }

    return current === true;
  };

  const getViewPermissionType = (
    permissions: UserPermissions | undefined
  ): "view_all" | "view_my" | "none" => {
    if (!permissions?.recruit?.job_posting?.view_job) return "none";

    const viewJob = permissions.recruit.job_posting.view_job;

    if (viewJob.view_all) return "view_all";
    if (viewJob.view_my) return "view_my";

    return "none";
  };

  const getFeedbackViewPermissionType = (
    permissions: UserPermissions | undefined
  ): "view_all" | "view_my" | "none" => {
    if (!permissions?.recruit?.interview_feedback) return "none";

    const feedback = permissions.recruit.interview_feedback;

    if (feedback.view_all_feedback) return "view_all";
    if (feedback.view_my_feedback) return "view_my";

    return "none";
  };

  // Check if user has any recruit permissions
  const hasAnyRecruitPermission = (
    permissions: UserPermissions | undefined
  ): boolean => {
    if (!permissions?.recruit) return false;

    const recruitPerms = permissions.recruit;

    return !!(
      recruitPerms.job_posting?.view_job?.view_all ||
      recruitPerms.job_posting?.view_job?.view_my ||
      recruitPerms.job_posting?.create_job ||
      recruitPerms.job_posting?.edit_job ||
      recruitPerms.job_posting?.delete_job ||
      recruitPerms.candidate_app?.manage_app ||
      recruitPerms.candidate_app?.approve_reject_app ||
      recruitPerms.interview_schedule?.create_interview ||
      recruitPerms.interview_schedule?.modify_interview ||
      recruitPerms.interview_feedback?.view_all_feedback ||
      recruitPerms.interview_feedback?.view_my_feedback ||
      recruitPerms.hiring_template ||
      recruitPerms.location ||
      recruitPerms.department
    );
  };

  // Permission checks

  const viewPermissionType = getViewPermissionType(currentUser?.permissions);
  const canViewJobs = viewPermissionType !== "none";
  const canCreateJob = checkRecruitPermission(
    currentUser?.permissions,
    "recruit.job_posting.create_job"
  );
  const canEditJob: boolean = checkRecruitPermission(
    currentUser?.permissions,
    "recruit.job_posting.edit_job"
  );
  const canDeleteJob = checkRecruitPermission(
    currentUser?.permissions,
    "recruit.job_posting.delete_job"
  );
  const canManageApplications = checkRecruitPermission(
    currentUser?.permissions,
    "recruit.candidate_app.manage_app"
  );
  const canApproveRejectApplications = checkRecruitPermission(
    currentUser?.permissions,
    "recruit.candidate_app.approve_reject_app"
  );
  const canCreateInterview = checkRecruitPermission(
    currentUser?.permissions,
    "recruit.interview_schedule.create_interview"
  );
  const canModifyInterview = checkRecruitPermission(
    currentUser?.permissions,
    "recruit.interview_schedule.modify_interview"
  );
  const feedbackPermissionType = getFeedbackViewPermissionType(
    currentUser?.permissions
  );
  const canViewFeedback = feedbackPermissionType !== "none";
  const hasAnyPermission = hasAnyRecruitPermission(currentUser?.permissions);

  // Get unique departments and job natures for filters
  const uniqueDepartments = Array.from(
    new Set(allRequests.map((req) => req.Department).filter(Boolean))
  ).sort();

  const uniqueJobNatures = Array.from(
    new Set(allRequests.map((req) => req.JobNature).filter(Boolean))
  ).sort();

  // Helper function to determine actual status based on flags
  const determineActualStatus = (request: JDRequest): string => {
    if (request.isActive === false) return "Inactive";
    if (request.isPublished === true) return "Published";
    return "Active";
  };

  // Add this function to fetch versions for all JDs
  const fetchAndUpdateVersions = async (requests: JDRequest[]) => {
    try {
      if (requests.length === 0) return requests;

      // Create an array to store all promises
      const versionPromises = requests.map(async (req) => {
        try {
          // Use the same API that your popup uses
          const response = await getJDRequestVersionHistory(req.ID, accessToken);

          if (response.success && response.data?.versionHistory?.length > 0) {
            // Get the latest version from the history
            const latestVersion = Math.max(
              ...response.data.versionHistory.map(v => v.VersionNumber)
            );
            return {
              ...req,
              LatestVersion: latestVersion,
              TotalVersions: response.data.versionHistory.length
            };
          }

          // If no history, default to version 1
          return {
            ...req,
            LatestVersion: 0,
            TotalVersions: 0
          };
        } catch (error) {
          console.error(`Error fetching version for ${req.JDCode}:`, error);
          return req; // Return original request if error
        }
      });

      // Wait for all promises to resolve
      return await Promise.all(versionPromises);

    } catch (error) {
      console.error("Error in fetchAndUpdateVersions:", error);
      return requests;
    }
  };

  // Update your loadJDRequests function:
  // const loadJDRequests = async () => {
  //   try {
  //     setIsLoading(true);

  //     if (!canViewJobs) {
  //       setIsLoading(false);
  //       return;
  //     }

  //     let apiUrl = "";

  //     if (viewPermissionType === "view_all") {
  //       apiUrl = `${"https://qpeoplebackenddev.azurewebsites.net"}/jdRequest/getJDRequests?includeDeleted=false&pageSize=10000`;
  //     } else if (viewPermissionType === "view_my") {
  //       apiUrl = `${"https://qpeoplebackenddev.azurewebsites.net"}/jdRequest/getPeerUsers?userId=${currentUser.userID}`;
  //     }

  //     const response = await fetch(apiUrl, {
  //       headers: {
  //         Authorization: `Bearer ${accessToken}`,
  //         "Content-Type": "application/json",
  //       },
  //     });

  //     const result = await response.json();

  //     if (result.success && result.data) {
  //       let filteredData = result.data;

  //       // First, map basic data
  //       const mappedRequests = filteredData.map((req: any) => ({
  //         ...req,
  //         Status: determineActualStatus(req),
  //         Skills: req.Skills ? JSON.parse(req.Skills) : [],
  //         LatestVersion: 0, // Temporary placeholder
  //         TotalVersions: 0, // Temporary placeholder
  //       }));

  //       // Then fetch and update versions
  //       const requestsWithVersions = await fetchAndUpdateVersions(mappedRequests);

  //       setAllRequests(requestsWithVersions);

  //       // Calculate stats
  //       const stats = {
  //         active: requestsWithVersions.filter(
  //           (req: JDRequest) => req.Status === "Active"
  //         ).length,
  //         inactive: requestsWithVersions.filter(
  //           (req: JDRequest) => req.Status === "Inactive"
  //         ).length,
  //         published: requestsWithVersions.filter(
  //           (req: JDRequest) => req.Status === "Published"
  //         ).length,
  //         total: requestsWithVersions.length,
  //       };
  //       setJdStats(stats);

  //       // Debug: Log versions
  //       console.log("Final requests with versions:");
  //       requestsWithVersions.forEach((req, idx) => {
  //         console.log(`${idx + 1}. ${req.JDCode}: v${req.LatestVersion}`);
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Error loading JD requests:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };


  useEffect(()=>{
    if(currentUser && currentUser.permissions){
      if(checkPermission("recruit.job_posting.view_job.view_all") ||  checkPermission("recruit.job_posting.view_job.view_my") ){
          return ;
      }
      else if (checkPermission("recruit.recruit_dashboard.view_my")){
        navigate("/recruit/hrinfodashboard")
      }
      else if(checkPermission("recruit.recruit_dashboard.view_all")){
        navigate("/recruit//managementdashboard")
      }    
      else if(checkPermission("recruit.interview_feedback.view_all_feedback")  || checkPermission("recruit.interview_feedback.view_my_feedback")){
        navigate("/recruit/HiringDashboard")
      }
      else if(checkPermission("onboarding.onboarding_tasks.view_all_tasks") || checkPermission("onboarding.onboarding_tasks.view_my_tasks")){
        navigate("/Induction")
      }
      else if(checkPermission("background_verification.bgv_view.view_all_bgv") ||
          checkPermission("background_verification.bgv_view.view_my_bgv")){
            navigate("/BGV")
      }
      else if(checkPermission("offboarding.offboarding_view.view_all_offboarding") ||
          checkPermission("offboarding.offboarding_view.view_my_offboarding")){
            navigate("/offboard")
      }
      else if(checkPermission("offboarding.lead_clearance")){
        navigate("/offboard/LeadClearance")
      }
      else if(checkPermission("offboarding.it_clearance")){
        navigate("/offboard/ITClearance")
      }
      else if(checkPermission("offboarding.asset_clearance")){
        navigate("/offboard/AdminClearance")
      }
      else if(checkPermission("offboarding.finance_clearance")){
        navigate("/offboard/FinanceClearance")
      }
    }

  },[currentUser])

  const loadJDRequests = async (page: number = 1, pageSize: number = pagination.pageSize, isSearching:boolean) => {
    try {
      if(isSearching){
        setIsSearching(true)
      }
      else{

        setIsLoading(true);
      }

      if (!canViewJobs) {
        setIsLoading(false);
        setIsSearching(false)
        return;
      }

      let apiUrl = "";

      const filterParams = new URLSearchParams({
        includeDeleted: "false",
        pageNumber: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchQuery.trim()) filterParams.append("search", searchQuery.trim());
      if (statusFilter !== "all") filterParams.append("status", statusFilter);
      if (departmentFilter !== "all") filterParams.append("department", departmentFilter);
      if (jobNatureFilter !== "all") filterParams.append("jobNature", jobNatureFilter);
      if (hrFilter) filterParams.append("hrFilter", hrFilter);
      if (positionStatusFilter !== "all") filterParams.append("positionStatus", positionStatusFilter);
      if (dateFilterType !== "all") {
        filterParams.append("dateFilterType", dateFilterType);
        const { startDate, endDate } = getDateRange();
        if (startDate) filterParams.append("startDate", startDate.toISOString());
        if (endDate) filterParams.append("endDate", endDate.toISOString());
      }
      if (sortConfig) {
        filterParams.append("sortField", sortConfig.key as string);
        filterParams.append("sortDirection", sortConfig.direction);
      }

      if (viewPermissionType === "view_all") {
        apiUrl = `${import.meta.env.VITE_API_BASE_URL}/jdRequest/getJDRequests?${filterParams.toString()}`;
      } else if (viewPermissionType === "view_my") {
        filterParams.append("userId", currentUser.userID as string);
        apiUrl = `${import.meta.env.VITE_API_BASE_URL}/jdRequest/getPeerUsers?${filterParams.toString()}`;
      }

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        let filteredData = result.data;

        const mappedRequests = filteredData.map((req: any) => {
          let skills = [];

          // console.log(`   Hired: ${req.HiredApplicantsCount}`);
          // console.log(`   Positions: ${req.NumPositions}`);

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
            LatestVersion: 0,
            TotalVersions: 0,
          };
        });

        const requestsWithVersions = await fetchAndUpdateVersions(mappedRequests);

        setAllRequests(requestsWithVersions);
        setPaginatedRequests(requestsWithVersions);

        // Update pagination from server response
        const serverTotalCount = result.pagination?.totalCount ?? result.total ?? requestsWithVersions.length;
        setPagination(prev => ({
          ...prev,
          currentPage: page,
          pageSize: pageSize,
          totalCount: serverTotalCount,
          totalPages: Math.ceil(serverTotalCount / pageSize),
        }));

        // Calculate stats including position status
        const openPositions = result?.stats?.remainingOpenPositions ?? 0

        const closedPositions = result?.stats?.filledPositions ?? 0

        const stats = {
          active: requestsWithVersions.filter(
            (req: JDRequest) => req.Status === "Active"
          ).length,
          inactive: requestsWithVersions.filter(
            (req: JDRequest) => req.Status === "Inactive"
          ).length,
          published: result?.stats?.publishedJDs ?? 0,
          total: closedPositions + openPositions,
          openPositions,
          closedPositions,
        };
        setJdStats(stats);
        setTempJdStats(stats)

        setUniqueHrs(result?.hrs ?? [])

      }
    } catch (error) {
      console.error("Error loading JD requests:", error);
    } finally {
      setIsLoading(false);
      setIsSearching(false)
    }
  };

  // Handle delete JD
  const handleDeleteJD = async (jdId: string) => {
    if (!canDeleteJob) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            You don't have permission to delete job postings
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/jdRequest/deleteJDRequest/${jdId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            modifiedByUserId: currentUser.userID,
            confirmDelete: true
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        dispatchToast(
          <Toast>
            <ToastTitle>Job posting deleted successfully</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
        setTimeout(() => {
          loadJDRequests(1, pagination.pageSize,false); // Reload the data from page 1
          localStorage.removeItem("inductionPagination");
          setDeleteDialogOpen(false);
          setRequestToDelete(null);
        }, 1500)

      } else {
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to delete job posting</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      }
    } catch (error) {
      console.error("Error deleting JD request:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Error deleting job posting</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // In your component, add this state
  const [fetchedEmails, setFetchedEmails] = useState<Record<string, string>>({});

  // Modify handleInterviewerId to update state
  const handleInterviewerId = async (interviewerId: string | null) => {
    if (!interviewerId || !accessToken) {
      return '-';
    }

    try {
      const response = await getUserByID(interviewerId, accessToken);
      const email = response.email || response.userPrincipalName || response.mail || 'N/A';

      // Update state
      setFetchedEmails(prev => ({
        ...prev,
        [interviewerId]: email
      }));

      return email;
    } catch (error) {
      console.error('Error fetching email:', error);
      return 'Error fetching';
    }
  };

  // Then use it with useEffect
  useEffect(() => {
    // Trigger fetching for each unique interviewer
    const uniqueInterviewerIds = Array.from(
      new Set(
        paginatedRequests
          .map(req => req.InterviewerID)
          .filter(Boolean) as string[]
      )
    );

    uniqueInterviewerIds.forEach(id => {
      if (!fetchedEmails[id]) {
        handleInterviewerId(id);
      }
    });
  }, [paginatedRequests]);

  // Replace the two separate useEffects with this single one:
  useEffect(() => {
    // Fetch profiles for all users (InterviewerID and SubordinateID)
    // The ref inside fetchInterviewerProfile deduplicates concurrent calls
    paginatedRequests.forEach(request => {
      if (request.InterviewerID) fetchInterviewerProfile(request.InterviewerID);
      if (request.SubordinateID) fetchInterviewerProfile(request.SubordinateID);
    });
  }, [paginatedRequests, fetchInterviewerProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ensure the HR prefilled via path query has its profile fetched
  useEffect(() => {
    if (hrFilter) fetchInterviewerProfile(hrFilter);
  }, [hrFilter, fetchInterviewerProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search — re-fetch from page 1 when search text changes
  useEffect(() => {
    if (isInitialMount.current) return;
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      if (canViewJobs) loadJDRequests(1, pagination.pageSize,true);
    }, 1000);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch from page 1 whenever any non-search filter or sort changes
  useEffect(() => {
    if (isInitialMount.current) return;
    if (canViewJobs) loadJDRequests(1, pagination.pageSize, false);
  }, [statusFilter, departmentFilter, jobNatureFilter, hrFilter, positionStatusFilter, dateFilterType, selectedDate, sortConfig]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load data on initial mount and refresh trigger
  // Restore page position from localStorage when navigating back from edit
  useEffect(() => {
    isInitialMount.current = false;
    if (canViewJobs) {
      const savedPagination = localStorage.getItem("recruitPagination");
      if (savedPagination) {
        const parsed = JSON.parse(savedPagination);
        localStorage.removeItem("recruitPagination");
        loadJDRequests(parsed.currentPage ?? 1, parsed.pageSize ?? pagination.pageSize,false);
      } else {
        loadJDRequests(1, pagination.pageSize,false);
      }
    }
  }, [refreshTrigger]);


  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const checkSLAStatus = (targetDate: string, status: string) => {
    if (status === "Inactive") {
      return { isOverdue: false, daysOverdue: 0 };
    }

    const target = new Date(targetDate);
    const today = new Date();
    const diffTime = today.getTime() - target.getTime();
    const daysOverdue = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      isOverdue: daysOverdue > 0,
      daysOverdue: daysOverdue,
    };
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
    setHrFilter(undefined);  // Changed from "all" to undefined
    setPositionStatusFilter("all");
    setDateFilterType("all"); // Reset date filter to 'all'
    setSelectedDate(new Date());
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    window.location.href = "#/recruit"
    setJdStats(tempjdStats)
  };


  // Update handleStatusCardClick to handle position status
  const handlePositionStatusCardClick = (status: string) => {
    setPositionStatusFilter(status);
    setStatusFilter("all"); // Reset status filter when clicking position cards
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const isPositionStatusCardActive = (status: string) => {
    return (
      positionStatusFilter === status &&
      statusFilter === "all" // Only active if no status filter is selected
    );
  };

  // const handleStatusCardClick = (status: string) => {
  //   setStatusFilter(status === "all" ? "all" : status);
  //   setPagination((prev) => ({ ...prev, currentPage: 1 }));
  // };

  const handleStatusCardClick = (status: string) => {
    setStatusFilter(status === "all" ? "all" : status);
    setPositionStatusFilter("all"); // Reset position status when clicking status cards
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleExportExcel = async () => {
    try {
      const status = statusFilter === "all" ? "" : statusFilter
      const department = departmentFilter === "all" ? "" : departmentFilter
      if (accessToken) {

        const result = await getDataForExcelExport(status, department, accessToken)
      }
    }
    catch (error) {
      console.log(error)
    }
  }

  const isStatusCardActive = (status: string) => {
    return (
      statusFilter === status &&
      positionStatusFilter === "all" // Only active if no position filter is selected
    );
  };

  const handlePageChange = (page: number) => {
    loadJDRequests(page, pagination.pageSize,true);
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    loadJDRequests(1, itemsPerPage,true);
  };

  const getDashboardTitle = () => {
    if (viewPermissionType === "view_my") {
      return "Requisition Dashboard";
    } else if (viewPermissionType === "view_all") {
      return "Requisition Dashboard";
    }
    return "Job Opening Requests";
  };

  const getDashboardDescription = () => {
    if (viewPermissionType === "view_my") {
      return "View and manage job descriptions created by you";
    } else if (viewPermissionType === "view_all") {
      return "Manage all job descriptions, track recruitment progress, and monitor hiring pipeline";
    }
    return "Manage job descriptions and track recruitment progress";
  };

  // Add this state variable
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([]);
  const [currentSkills, setCurrentSkills] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistoryJD, setSelectedHistoryJD] = useState<JDRequest | null>(null);

  // Add this function to fetch history - FIXED VERSION
  const fetchVersionHistory = async (jdRequestId: string) => {
    try {
      setHistoryLoading(true);
      const response = await getJDRequestVersionHistory(jdRequestId, accessToken);

      if (response.success && response.data.versionHistory) {
        setVersionHistory(response.data.versionHistory);
        // console.log("Version History for JD:", response.data);
        setCurrentSkills(response.data.currentSkills || []);

        // Log detailed information
        response.data.versionHistory.forEach((version, index) => {
          // console.log(`=== Version ${version.VersionNumber} ===`);
          // console.log(`Date: ${new Date(version.VersionCreatedAt).toLocaleString()}`);
          // console.log(`Modified By: ${version.ModifiedByUserName}`);
          // console.log(`Changes: ${version.ChangeSummary}`);
          // console.log(`Total Changes: ${version.TotalChanges}`);

          // Log specific field changes
          if (version.JobRole_Changed) console.log(`- Job Role changed: ${version.JobRole}`);
          if (version.Department_Changed) console.log(`- Department changed: ${version.Department}`);
          if (version.Status_Changed) console.log(`- Status changed: ${version.Status}`);
          if (version.Skills_Changed) console.log(`- Skills changed (${version.SkillCount} skills)`);
          console.log(""); // Empty line for readability
        });
      }
    } catch (error) {
      console.error("Error fetching version history:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to load version history</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // Function to open history dialog for a specific JD
  const handleOpenHistoryDialog = (jdRequest: JDRequest) => {
    setSelectedHistoryJD(jdRequest);
    setShowHistoryDialog(true);
    fetchVersionHistory(jdRequest.ID);
  };

  // Function to refresh history
  const handleRefreshHistory = () => {
    if (selectedHistoryJD) {
      fetchVersionHistory(selectedHistoryJD.ID);
    }
  };

  //  =================

  // Check if user has no permissions at all
  if (!hasAnyPermission) {
    return (
      <div className={classes.noAccessContainer}>
        <LockClosedRegular className={classes.noAccessIcon} />
        <Text className={classes.noAccessTitle}>No Recruiting Permissions</Text>
        <Text className={classes.noAccessDescription}>
          You don't have any permissions to access the recruiting module. Please
          contact your administrator to request access to job posting, candidate
          management, or interview scheduling features.
        </Text>
        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          <Button appearance="secondary" onClick={() => navigate("/")}>
            Go to Dashboard
          </Button>
          <Button
            appearance="primary"
            onClick={() => (window.location.href = "mailto:jisha@quadrasystems.net")}
          >
            Contact Administrator
          </Button>
        </div>
      </div>
    );
  }

  // If user has some permissions but not view permissions
  if (!canViewJobs && hasAnyPermission) {
    return (
      <div className={classes.noAccessContainer}>
        <PersonRegular className={classes.noAccessIcon} />
        <Text className={classes.noAccessTitle}>Limited Access</Text>
        <Text className={classes.noAccessDescription}>
          You have recruiting permissions but cannot view job postings. You may
          have access to other recruiting features like interview feedback.
        </Text>
        <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
          {checkRecruitPermission(
            currentUser?.permissions,
            "recruit.hiring_template"
          ) && (
              <Button
                appearance="secondary"
                onClick={() => navigate("/recruit/templates")}
              >
                Manage Templates
              </Button>
            )}
          {checkRecruitPermission(
            currentUser?.permissions,
            "recruit.department"
          ) && (
              <Button
                appearance="secondary"
                onClick={() => navigate("/recruit/departments")}
              >
                Manage Departments
              </Button>
            )}
          {checkRecruitPermission(
            currentUser?.permissions,
            "recruit.location"
          ) && (
              <Button
                appearance="secondary"
                onClick={() => navigate("/recruit/locations")}
              >
                Manage Locations
              </Button>
            )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Requisition Dashboard...</Body1Strong>
      </div>
    );
  }

  const handleHrChange = (data: { id: string, displayName: string, email: string } | null) => {
    if (data && data.id)
      setReassignHr(data)
    else
      setReassignHr(null)
  }

  const handleReassignHr = async () => {
    if (!ReassignData || !ReassignedHr || !ReassignedHr.id) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            Select HR to proceed
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    if (ReassignData.InterviewerID?.trim().toLowerCase() === ReassignedHr.id?.trim().toLowerCase()) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            Current HR and New HR cannot be same
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    try {
      if (accessToken) {
        setIsLoadingReassign(true)
        const response = await reassignHr(ReassignData.ID, ReassignedHr.id, accessToken)

        if (response.success) {
          dispatchToast(
            <Toast>
              <ToastTitle>
                Hr Reassigned successfully
              </ToastTitle>
            </Toast>,
            { intent: "success" }
          );
          setTimeout(() => {
            loadJDRequests(1,50,false)
            handleCloseReassignDialog()
          }, 1500)

        }
      }
    }
    catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            Unable to reassign HR
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
    finally {
      setIsLoadingReassign(false)
    }
  }

  const handleRequestStatus = (hiredCandidate: number | undefined, numPositions: number, daysStatus: { days: number; status: 'remaining' | 'today' | 'overdue'; text: string; color: string; badgeColor: 'success' | 'warning' | 'error' | 'informative'; }) => {
    // Handle undefined case
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

  // Add this helper function to format change summaries
  const formatChangeSummary = (summary: string): React.ReactNode => {
    if (!summary || summary === "No changes detected") {
      return summary;
    }

    // Split the summary into individual changes
    const changes = summary.split('; ').filter(change => change.trim());

    return (
      <div className="space-y-1">
        {changes.map((change, index) => {
          // Check for patterns like "Min Experience: 0 ? 1"
          const match = change.match(/^(.+?):\s*(.+?)\s*\?\s*(.+)$/);

          if (match) {
            const [, field, oldValue, newValue] = match;
            return (
              <div key={index} className="flex items-center">
                {field !== 'Is Published' && (
                  <span className="text-black-700" style={{ fontSize: '12px' }}>{field}:</span>
                )}
                {field !== 'Is Published' && (
                  <div className="flex items-center gap-2">
                    <Badge appearance="ghost" color="danger" size="medium">
                      {oldValue.trim()}
                    </Badge>
                    <span className="text-gray-400">→</span>
                    <Badge appearance="ghost" color="success" size="medium">
                      {newValue.trim()}
                    </Badge>
                  </div>
                )}
              </div>
            );
          }

          // Handle other patterns
          return (
            <div key={index} className="text-gray-700">
              {change}
            </div>
          );
        })}
      </div>
    );
  };

  const calculateDaysRemaining = (targetDate: string): {
    days: number;
    status: 'remaining' | 'today' | 'overdue';
    text: string;
    color: string;
    badgeColor: 'success' | 'warning' | 'error' | 'informative';
  } => {
    const target = new Date(targetDate);
    const today = new Date();

    // Set both dates to start of day for accurate comparison
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



  // Alternative: Create a detailed change display for each version
  const renderDetailedChanges = (version: VersionHistory) => {
    const changes: any[] = [];

    // Map of field names to display names
    const fieldDisplayNames: Record<string, string> = {
      'JobRole': 'Job Role',
      'Department': 'Department',
      'JobNature': 'Job Nature',
      'TargetDate': 'Target Date',
      'NumPositions': 'Number of Positions',
      'minWorkExperience': 'Minimum Experience',
      'maxWorkExperience': 'Maximum Experience',
      'MinSalaryRange': 'Minimum Salary',
      'MaxSalaryRange': 'Maximum Salary',
      'JobLocation': 'Job Location',
      'Status': 'Status',
      'isActive': 'Active Status',
      'isPublished': 'Published Status',
    };

    // Check each field that has changed
    Object.entries(version).forEach(([key, value]) => {
      if (key.endsWith('_Changed') && value === true) {
        const baseField = key.replace('_Changed', '');
        const oldField = `Old${baseField}`;
        const newField = `New${baseField}`;

        const oldValue = version[oldField as keyof VersionHistory];
        const newValue = version[newField as keyof VersionHistory];
        const currentValue = version[baseField as keyof VersionHistory];

        const displayName = fieldDisplayNames[baseField] || baseField;

        if (oldValue !== undefined && newValue !== undefined) {
          changes.push({
            field: displayName,
            oldValue: oldValue,
            newValue: newValue,
          });
        } else if (currentValue !== undefined) {
          changes.push({
            field: displayName,
            newValue: currentValue,
          });
        }
      }
    });

    return (
      <div className="space-y-3">
        {changes.map((change, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <Body1 className="text-gray-700 font-medium">{change.field}</Body1>
            <div className="flex items-center gap-2">
              {change.oldValue !== undefined && (
                <>
                  <Badge appearance="outline" color="warning" size="small">
                    {formatFieldValue(change.field, change.oldValue)}
                  </Badge>
                  <span className="text-gray-400">→</span>
                </>
              )}
              <Badge appearance="outline" color="success" size="small">
                {formatFieldValue(change.field, change.newValue)}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to format values
  const formatFieldValue = (field: string, value: any): string => {
    if (value === null || value === undefined) return 'N/A';

    switch (field) {
      case 'Minimum Experience':
      case 'Maximum Experience':
        return `${value} year${value !== 1 ? 's' : ''}`;
      case 'Minimum Salary':
      case 'Maximum Salary':
        return `₹${value}00000`;
      case 'Target Date':
        return formatDate(value);
      case 'Active Status':
        return value ? 'Active' : 'Inactive';
      case 'Published Status':
        return value ? 'Published' : 'Not Published';
      default:
        return value.toString();
    }
  };

  //   // Add this state near your other state declarations
  // const [interviewerEmails, setInterviewerEmails] = useState<Record<string, string>>({});
  // const handleInterviewerId = async (interviewerId: string | null) => {
  //   if (!interviewerId || !accessToken) {
  //     console.log('No interviewer ID or access token available');
  //     return;
  //   }

  //   try {
  //     // Check if we already have this email cached
  //     if (interviewerEmails[interviewerId]) {
  //       return interviewerEmails[interviewerId];
  //     }

  //     const response = await getUserByID(interviewerId, accessToken);
  //     const email = response.email || response.userPrincipalName || response.mail || 'N/A';

  //     // Update state with the fetched email
  //     setInterviewerEmails(prev => ({
  //       ...prev,
  //       [interviewerId]: email
  //     }));

  //     return email;
  //   } catch (error) {
  //     console.error('Error fetching user details:', error);
  //     // Set a placeholder in state
  //     setInterviewerEmails(prev => ({
  //       ...prev,
  //       [interviewerId]: 'Error fetching'
  //     }));
  //     return 'Error fetching';
  //   }
  // };

  return (
    <FluentProvider className="!p-0 !bg-transparent">
      <div className="space-y-4 mx-auto">



        {/* Dialog for reassign Hr */}



        <Dialog open={OpenReassignDialog} onOpenChange={handleCloseReassignDialog}>

          <DialogSurface style={{ maxWidth: "700px" }}>
            <DialogTitle>Reassign HR</DialogTitle>
            <DialogBody >
              <DialogContent className="!w-full">
                <div className="bg-yellow-100/50 p-5 rounded-lg flex flex-col border-1 border-yellow-600 mb-3">
                  <div className="flex gap-3 !font-semibold !text-yellow-800">
                    <Briefcase16Filled />
                    <div className="flex flex-col ">
                      <Text className="!font-semibold !text-yellow-800">{ReassignData?.JobRole}</Text>
                      <Text className="!font-small !text-xs !text-yellow-800">{ReassignData?.JDCode} | {ReassignData?.Department}</Text>

                    </div>
                  </div>

                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-2">
                    <Text className="!font-medium">Current HR</Text>
                    <Persona
                      primaryText={ReassignData && ReassignData.InterviewerID ? interviewerProfiles[ReassignData?.InterviewerID as string]?.displayName : ""}
                      secondaryText={ReassignData && ReassignData.InterviewerID ? interviewerProfiles[ReassignData?.InterviewerID as string]?.email : ""}
                    />
                  </div>

                  <div className="flex flex-col gap-5">
                    <UserCombobox
                      label="New HR"
                      placeholder="Search for New HR..."
                      value={ReassignedHr?.displayName ?? ""}
                      onUserSelect={(user) => {
                        if (user) {
                          handleHrChange({
                            id: user.id,
                            displayName: user.displayName,
                            email: user.email,
                          });
                        } else {
                          handleHrChange(null);
                        }
                      }}
                      required={true}
                      disabled={false}

                      icon={<People20Regular />}
                      currentUser={currentUser}
                    />
                  </div>
                </div>
              </DialogContent>
              <DialogActions>
                <Button disabled={IsLoadingReassign} appearance="primary" onClick={() => handleReassignHr()}>{IsLoadingReassign ? "Processing..." : "Reassign"}</Button>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary" onClick={() => handleCloseReassignDialog()}>Close</Button>
                </DialogTrigger>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

        {/* Header with Search and Filters */}
        <div className="flex justify-between items-center">
          <div>
            <Subtitle2 className="text-[#152460] font-bold">
              {getDashboardTitle()}
            </Subtitle2>
            {/* <div>
              {" "}
              <Caption1 className="text-gray-600">
                {getDashboardDescription()}
              </Caption1>
            </div> */}
          </div>

          {/* Date Filter Section - Right side */}
          <div className="flex flex-col md:flex-row col-span-12 md:col-span-6 gap-3 items-center justify-end">
            {/* Date Filter Tabs */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Calendar Toggle Button */}
              {dateFilterType !== 'all' && (
                <div className="relative">
                  <CalendarToggleButton />

                  {showCalendar && (
                    <div
                      ref={calendarRef}
                      className='absolute top-full left-0 mt-1 bg-white rounded-lg shadow-xl border z-50'
                      style={{ minWidth: '300px' }}
                    >
                      {renderCalendar()}
                    </div>
                  )}
                </div>
              )}

              {/* Date Filter Tabs */}
              <div className='flex gap-2 rounded-[30px] bg-[#ffffff56] px-[8px] py-[8px]' style={{ border: '1px solid #fff' }}>
                <div className='flex flex-wrap gap-1'>
                  {/* <button
            className={`px-3 py-1.5 text-sm font-medium rounded-[20px] ${dateFilterType === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
            onClick={() => {
              setDateFilterType('all');
              setShowCalendar(false);
            }}
          >
            All
          </button> */}
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-[20px] ${dateFilterType === 'today' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
                    onClick={() => {
                      setDateFilterType('today');
                      setSelectedDate(new Date());
                    }}
                  >
                    Daily
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-[20px] ${dateFilterType === 'week' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
                    onClick={() => {
                      setDateFilterType('week');
                      setSelectedDate(new Date());
                    }}
                  >
                    Weekly
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-[20px] ${dateFilterType === 'month' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
                    onClick={() => {
                      setDateFilterType('month');
                      setSelectedDate(new Date());
                    }}
                  >
                    Monthly
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-[20px] ${dateFilterType === 'quarter' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
                    onClick={() => {
                      setDateFilterType('quarter');
                      setSelectedDate(new Date());
                    }}
                  >
                    Quarterly
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm font-medium rounded-[20px] ${dateFilterType === 'year' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900 cursor-pointer'}`}
                    onClick={() => {
                      setDateFilterType('year');
                      setSelectedDate(new Date());
                    }}
                  >
                    Annual
                  </button>
                </div>
              </div>
            </div>

            <div>
              {canCreateJob && (
                <Button
                  appearance="primary"
                  size="medium"
                  icon={
                    <div
                      className="rounded-full p-1 flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)",
                      }}
                    >
                      <AddRegular style={{ color: "#fff" }} />
                    </div>
                  }
                  style={{
                    color: "#626262",
                    backgroundColor: "#FFFFFF4F",
                    border: "1px solid #fff",
                    fontWeight: 500,
                    padding: "13px 18px",
                    display: "flex",
                    gap: "6px",
                  }}
                  shape="circular"
                  onClick={() => navigate("/recruit/newJDForm")}
                >
                  Create Requisition
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
          {/* <CustomStatsCard
            style={isStatusCardActive("Active") ? "ring-2 ring-blue-500" : ""}
            onClick={() => handleStatusCardClick("Active")}
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
                      Active
                    </Text>
                  </div>
                  <div>
                    <Text
                      size={600}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      {jdStats.active}
                    </Text>
                  </div>
                </div>
                <div className={classes.active}>
                  <Avatar
                    color="seafoam"
                    size={36}
                    icon={
                      <div className="bg-[#EFFFF9] rounded-full p-[15px]">
                        <PlayCircle20Regular
                          style={{
                            height: "26px",
                            width: "26px",
                            color: "#15803D",
                          }}
                        />
                      </div>
                    }
                  />
                </div>
              </div>
            </CardPreview>
          </CustomStatsCard> */}

          {/* <CustomStatsCard
            style={isStatusCardActive("Inactive") ? "ring-2 ring-blue-500" : ""}
            onClick={() => handleStatusCardClick("Inactive")}
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
                      Inactive
                    </Text>
                  </div>
                  <div>
                    <Text
                      size={600}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      {jdStats.inactive}
                    </Text>
                  </div>
                </div>
                <div className={classes.inactive}>
                  <Avatar
                    color="marigold"
                    size={36}
                    icon={
                      <div className="bg-[#FAF2E4] rounded-full p-[15px]">
                        <PauseCircle20Regular
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
          </CustomStatsCard> */}

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
                      Published JD
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
                      Open Positions
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

          {/* NEW: Closed Positions Card */}
          <CustomStatsCard
            style={isPositionStatusCardActive("closed") ? "ring-2 ring-blue-500" : ""}
            onClick={() => handlePositionStatusCardClick("closed")}
          >
            <CardPreview className="py-[17px] px-[20px]">
              <div className="!flex flex-row items-center justify-between">
                <div className="flex flex-col gap-[11px]">
                  <div>
                    <Text size={300} weight="semibold" className="!text-gray-700">
                      Closed Positions
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
            }}    >
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

        {/* Filter Status Alert */}
          {(statusFilter !== "all" || positionStatusFilter !== "all" || hrFilter !== undefined) && showFilterAlert && (
            <div className="mb-3 p-3 rounded bg-gray-50 border border-gray-200 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Text weight="semibold">Active Filters:</Text>
                {statusFilter !== "all" && <Badge size="small" className="!bg-blue-100 !text-blue-800">{statusFilter} status</Badge>}
                {positionStatusFilter !== "all" && <Badge size="small" className="!bg-yellow-100 !text-yellow-800">{positionStatusFilter} positions</Badge>}
                {hrFilter !== undefined && (
                  <Badge size="small" className="!bg-green-100 !text-green-800">
                    HR: {interviewerProfiles[hrFilter as string]?.displayName || hrFilter}
                  </Badge>
                )}
              </div>
              {/* <div className="flex items-center gap-2">
                <Button appearance="subtle" onClick={() => { setStatusFilter("all"); setPositionStatusFilter("all"); setPagination(prev => ({ ...prev, currentPage: 1 })); }}>
                  Clear Status
                </Button>
                <Button appearance="subtle" icon={<DismissRegular />} onClick={() => setShowFilterAlert(false)}>
                  Dismiss
                </Button>
                <Button appearance="primary" onClick={() => { clearFilters(); setShowFilterAlert(false); }}>
                  Clear All
                </Button>
              </div> */}
            </div>
          )}

        {/* Table */}
        <Card className="w-full shadow-lg !rounded-xl border-0 overflow-scroll bg-white">
          {/* Search and Filters */}
          <div className="flex justify-between w-[100%]">
            <div className="flex col-span-6 xs:col-span-12 w-[40%]">
              <SearchBox
                placeholder="Search by JD code, job role, department or location..."
                value={searchQuery}
                onChange={(_, data) => setSearchQuery(data.value)}
                className="!w-full !max-w-full !min-w-0 "
                style={{ fontSize: "11px" }}
              />
            </div>



            {/* <div className="grid-cols-1"></div> */}
            <div className="grid grid-cols-8  col-span-5 xs:col-span-12 gap-2 w-[55%]">
              <Dropdown
                placeholder="All Departments"
                // value={departmentFilter}
                value={departmentFilter === "all" ? undefined : departmentFilter}
                selectedOptions={[departmentFilter]}
                onOptionSelect={(_, data) =>
                  setDepartmentFilter(data.optionValue || "all")
                }
                className=" col-span-2 w-full !max-w-full !min-w-0 "
                style={{ fontSize: "11px !important" }}
              >
                <Option value="all">All Departments</Option>
                {uniqueDepartments.map((dept) => (
                  <Option key={dept} value={dept}>
                    {dept}
                  </Option>
                ))}
              </Dropdown>


              <style>{`
  .col-span-2 input::placeholder {
    font-size: 11px !important;
  }
  .col-span-2 button {
    font-size: 11px !important;
  }
`}</style>

              <Dropdown
                placeholder="All Job Types"
                value={jobNatureFilter === "all" ? undefined : jobNatureFilter}
                selectedOptions={
                  jobNatureFilter === "all" ? [] : [jobNatureFilter]
                }
                onOptionSelect={(_, data) =>
                  setJobNatureFilter(data.optionValue || "all")
                }
                className="col-span-2 w-full !max-w-full !min-w-0 "
                style={{ fontSize: "11px !important" }}
              >
                <Option value="all">All Job Types</Option>

                {uniqueJobNatures
                  .filter(
                    (nature) =>
                      !["contract", "part-time"].includes(nature.toLowerCase())
                  )
                  .map((nature) => (
                    <Option key={nature} value={nature}>
                      {nature}
                    </Option>
                  ))}
              </Dropdown>


              <Dropdown
                placeholder="All HR"
                selectedOptions={hrFilter ? [hrFilter] : []}
                onOptionSelect={(_, data) => {
                  if (data.optionValue === "all") {
                    setHrFilter(undefined);
                  } else {
                    setHrFilter(data.optionValue as string);
                  }
                }}
                className="col-span-2 w-full !max-w-full !min-w-0"
              >
                <Option value="all">All HR</Option>
                {hrFilter && !uniqueHRs.some(hr => hr.id === hrFilter) && (() => {
                  const hrProfile = interviewerProfiles[hrFilter as string];
                  const displayName = hrProfile?.displayName || `${hrFilter}`;
                  const email = hrProfile?.email;
                  return (
                    <Option key={hrFilter} value={hrFilter} text={displayName}>
                      <div className="flex items-center gap-2">
                        {hrProfile?.profilePicture ? (
                          <Avatar size={20} image={{ src: hrProfile.profilePicture }} name={displayName} />
                        ) : (
                          <Avatar size={20} name={displayName} color="colorful" />
                        )}
                        <div className="flex flex-col">
                          <span>{displayName}</span>
                          {email && <span className="text-xs text-gray-500 truncate">{email}</span>}
                        </div>
                      </div>
                    </Option>
                  );
                })()}
                {uniqueHRs
                  .filter(Boolean)
                  .map((hrId) => {
                    const hrProfile = interviewerProfiles[hrId?.id as string];
                    const displayName = hrProfile?.displayName || `${hrId?.displayName}`;
                    const email = hrProfile?.email;
                    return (
                      <Option key={hrId.id} value={hrId.id} text={displayName}>
                        <div className="flex items-center gap-2">
                          {hrProfile?.profilePicture ? (
                            <Avatar size={20} image={{ src: hrProfile.profilePicture }} name={displayName} />
                          ) : (
                            <Avatar size={20} name={displayName} color="colorful" />
                          )}
                          <div className="flex flex-col">
                            <span>{displayName}</span>
                            {email && <span className="text-xs text-gray-500 truncate">{email}</span>}
                          </div>
                        </div>
                      </Option>
                    );
                  })}
              </Dropdown>


              <Button
                appearance="subtle"
                icon={<FilterRegular />}
                onClick={clearFilters}
                disabled={
                  searchQuery === "" &&
                  statusFilter === "all" &&
                  departmentFilter === "all" &&
                  hrFilter === undefined &&
                  jobNatureFilter === "all" &&
                  dateFilterType === "all" // Add this
                }
                className="col-span-2 !text-red-500 disabled:!text-gray-400"
              >
                Clear
              </Button>
              {/* <Button className="col-span-1" onClick={() => handleExportExcel()}>Export</Button> */}
            </div>
          </div>

          

          {/* Scrollable Table Container */}
          <div className="max-h-[500px] w-full overflow-scroll scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <Table sortable className="w-full" >
              <TableHeader className="sticky top-0 z-20 bg-gray-100">
                <TableRow style={{ flex: "1 1 auto" }} className="border-b-2 border-gray-100 ">
                  {/* <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-2 px-6"
                    onClick={() => handleSort("JDCode")}
                    colSpan={window.innerWidth > 1400 ? 1 : 2}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-600">
                        JD Code
                      </Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === "JDCode" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell> */}

                  <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group py-2 px-6"
                    onClick={() => handleSort("JobRole")}
                    colSpan={window.innerWidth > 1400 ? 1 : 2}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong style={{ fontSize: "12px" }} className="text-gray-600">
                        Job Posting
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

                  {/* <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group py-2 px-6"
                    onClick={() => handleSort("Department")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-600">
                        Department
                      </Body1Strong>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === "Department" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                          ) : (
                            <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                          ))}
                      </div>
                    </div>
                  </TableHeaderCell> */}

                  <TableHeaderCell align="center" className="py-2 px-6 w-[200px] flex !items-center !justify-start">
                    <Body1Strong style={{ fontSize: "12px" }} className="text-gray-600 !text-center w-full">
                      Hiring Progress
                    </Body1Strong>
                  </TableHeaderCell>

                  {/* <TableHeaderCell
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
                  </TableHeaderCell> */}

                  <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group py-2 px-6"
                    onClick={() => handleSort("CreatedAt")}  // Sort by CreatedAt for Requested On
                  >
                    <div className="flex items-center gap-2 justify-center w-full">
                      <Body1Strong style={{ fontSize: "12px" }} className="text-gray-600">
                        Req. On
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
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group py-2 px-6 !w-[120px] flex !items-center !justify-center"
                    onClick={() => handleSort("TargetDate")}
                  >
                    <div className="flex items-center gap-2 justify-center w-full">
                      <Body1Strong style={{ fontSize: "12px" }} className="text-gray-600">
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
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-2 px-6 flex !items-center !justify-center"
                    onClick={() => handleSort("LatestVersion")}
                  >
                    <div className="flex items-center gap-2 justify-center w-full">
                      <Body1Strong style={{ fontSize: "12px" }} className="text-gray-600">
                        Due in (Days)
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

                  <TableHeaderCell className="!py-2 px-6 flex !items-center !justify-center">
                    <Body1Strong style={{ fontSize: "12px" }} className="text-gray-600 w-full !text-center">Assigned</Body1Strong>
                  </TableHeaderCell>

                  {/* <TableHeaderCell
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
                  </TableHeaderCell> */}

                  <TableHeaderCell
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group py-2 px-6"
                    onClick={() => handleSort("Status")}
                  >
                    <div className="flex items-center gap-2 justify-center w-full">
                      <Body1Strong style={{ fontSize: "12px" }} className="text-gray-600 !text-center w-full">
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

                  <TableHeaderCell className="py-2 px-6 flex !items-center !justify-center">
                    <Body1Strong style={{ fontSize: "12px" }} className="text-gray-600 !text-center w-full">Actions</Body1Strong>
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                
                {
                  isSearching?
                  <TableRow className="min-h-[220px]">
                    <TableCell colSpan={8} className="w-full px-6 py-10">
                      <div className="h-full min-h-[220px] flex flex-col justify-center items-center gap-5">
                        <Spinner />
                        <Text>Loading...</Text>
                      </div>
                    </TableCell>
                  </TableRow>
                  :
                paginatedRequests.map((request) => {
                  const daysStatus = calculateDaysRemaining(request.TargetDate);
                  return (
                    <TableRow
                      key={request.ID}
                      className="group hover:bg-gradient-to-r hover:from-blue-25 hover:to-indigo-25 transition-all duration-200 border-b border-gray-50 hover:shadow-sm"

                    >
                      <TableCell colSpan={window.innerWidth > 1400 ? 1 : 2} style={{ width: '200px', minWidth: '600px', maxWidth: '400px' }} className="!py-2 px-6 !w-auto !min-w-[400px]">
                        {/* <Badge
                          appearance="tint"
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
                            inline-block
                          "
                          onClick={() =>
                            navigate(`/recruit/jdOverview/${request.ID}`)
                          }
                          size="small"
                        >
                          {request.JDCode}
                        </Badge> */}
                        <div className="flex flex-col items-start justify-start gap-2">
                          <span style={{ fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer' }} onClick={() =>
                            navigate(`/recruit/jdOverview/${request.ID}`)}>{request.JobRole}</span>
                          <span style={{ fontSize: 'smaller' }} className="flex gap-2">{request.Department} . {request.JDCode}</span>
                        </div>
                      </TableCell>

                      {/* <TableCell colSpan={window.innerWidth > 1400 ? 1 : 2} className="py-5 px-6">
                        <div className="space-y-3 max-w-72">
                          <div>
                            <Text className=" text-gray-900 !font-semibold !text-xs leading-tight">
                              {request.JobRole}
                            </Text>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-5 px-6">
                        <div className="flex items-center gap-3">
                          <div>
                            <Text className="!font-semibold !text-xs text-gray-500">
                              {request.Department}
                            </Text>
                          </div>
                        </div>
                      </TableCell> */}

                      <TableCell className="py-5 px-6 w-[200px] flex flex-col items-center justify-center">
                        <div className="space-y-2 w-full">
                          {request.HiredApplicantsCount !== undefined && (
                            <div className="flex items-center gap-2 mb-0 w-full">
                              <div
                                className={`!font-semibold !text-xs w-full px-3 py-3 rounded-2xl flex justify-between items-center
                                  ${request.HiredApplicantsCount >= request.NumPositions
                                  }`} >
                                <Text className="!font-semibold !text-xs text-center">
                                  {request.HiredApplicantsCount} of {request.NumPositions} completed </Text>
                                <Text>
                                  {Math.round(
                                    Math.min(
                                      (request.HiredApplicantsCount / request.NumPositions) * 100,
                                      100
                                    )
                                  )}
                                  % </Text>
                              </div>
                            </div>
                          )}
                          {request.HiredApplicantsCount !== undefined && (
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
                          )}
                          <div className="flex gap-2 items-center">
                            <span className="h-[10px] w-[10px] rounded-[50%]" style={{ backgroundColor: `${request.Status === 'Published' ? '#047857' : request.Status === 'Active' ? '#0970b4ff' : '#b43409ff'}` }}></span>
                            <span className="text-[10px]">{request.Status}</span>
                          </div>
                        </div>
                      </TableCell>
                      {/* 
                      <TableCell className="py-5 px-6">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full !border-none !border-0 ${request.Status === "Published"
                              ? "bg-[#5b5fc7] animate-pulse !shadow-none"
                              : request.Status === "Active"
                                ? "bg-green-400 !shadow-none"
                                : request.Status === "Inactive"
                                  ? "bg-yellow-400 !shadow-none"
                                  : "bg-gray-400 !shadow-none"
                              }`}
                          ></div>
                          <Badge
                            {...getStatusBadgeAppearance(request.Status)}
                            className="px-3 py-1 font-medium !shadow-none !border-none !border-0"
                          >
                            {request.Status}
                          </Badge>
                        </div>
                      </TableCell> */}

                      <TableCell className="py-5 px-6 flex !justify-center">
                        <div className="space-y-2 flex items-start justify-center gap-2 h-[40px] w-[full]">
                          <Badge
                            appearance="ghost"
                            color="brand"
                            className="cursor-pointer !text-gray-600 font-width-light flex flex-col !items-start !justify-start gap-1 !h-[45px]"
                          >
                            {formatDate(request.CreatedAt)} {/* Use CreatedAt for Requested On */}
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
                            {formatDate(request.TargetDate)} &nbsp;{" "}
                            {checkSLAStatus(request.TargetDate, request.Status)
                              .isOverdue && (
                                <Tooltip
                                  content="SLA Exceeded - Target date has passed"
                                  relationship="label"
                                ></Tooltip>
                              )}
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="py-5 px-6 flex !justify-center w-full">
                        <div className="flex items-center justify-center">
                          <Tooltip content={`${daysStatus.text}`} relationship={'label'}>
                            <Text
                              className={`
                                  cursor-pointer font-medium !text-xs
                                    ${daysStatus.status === 'today' ? '!text-orange-600' :
                                  daysStatus.status === 'remaining' ? '!text-green-600' :
                                    '!text-red-600'}
                                  `} >
                              {(handleRequestStatus(request.HiredApplicantsCount, request.NumPositions, daysStatus)?.text === 'Completed') ? (
                                <span style={{ color: '#047857' }}>Completed</span>
                              ) : (<span>{daysStatus.text}</span>)}

                            </Text>
                          </Tooltip>
                        </div>
                      </TableCell>

                      <TableCell className="!py-2 px-6 w-full">
                        <div className="flex items-center justify-center">
                          {/* Check if either profile is still loading */}
                          {(request.InterviewerID && !interviewerProfiles[request.InterviewerID]) ||
                            (request.SubordinateID && !interviewerProfiles[request.SubordinateID]) ? (
                            // Combined loading state
                            <div className="flex flex-col items-center justify-center gap-1 py-2">
                              <Spinner size="extra-tiny" />
                              <Caption1 className="!text-xs text-gray-500">Loading...</Caption1>
                            </div>
                          ) : (
                            // Both profiles loaded or not needed
                            <>
                              {/* Primary Interviewer */}
                              <div className="flex items-center justify-center gap-2">
                                {request.InterviewerID ? (
                                  <>
                                    {interviewerProfiles[request.InterviewerID] ? (
                                      <Tooltip
                                        relationship="label"
                                        content={
                                          <div className="flex flex-col">
                                            <Text className="!text-xs !font-semibold text-gray-900">
                                              {interviewerProfiles[request.InterviewerID].displayName}
                                            </Text>
                                            <Text className="!text-xs text-gray-600">
                                              {interviewerProfiles[request.InterviewerID].email}
                                            </Text>
                                          </div>
                                        }
                                      >
                                        {interviewerProfiles[request.InterviewerID].profilePicture ? (
                                          <Avatar
                                            size={28}
                                            image={{
                                              src: interviewerProfiles[request.InterviewerID].profilePicture
                                            }}
                                            name={interviewerProfiles[request.InterviewerID].displayName}
                                            className={classes.avatarIcon}
                                          />
                                        ) : (
                                          <Avatar
                                            size={28}
                                            name={interviewerProfiles[request.InterviewerID].displayName}
                                            className={classes.avatarIcon}
                                            color="colorful"
                                          />
                                        )}
                                      </Tooltip>
                                    ) : null}
                                  </>
                                ) : (
                                  // No interviewer assigned
                                  <Tooltip content="No Primary Interviewer Assigned" relationship="label">
                                    <Avatar
                                      size={28}
                                      icon={<PeopleProhibited16Regular />}
                                      className={`${classes.avatarIcon} opacity-50`}
                                    />
                                  </Tooltip>
                                )}
                              </div>

                              {/* Subordinate User */}
                              {request.SubordinateID && (
                                <div className="flex items-center justify-center gap-2">
                                  {interviewerProfiles[request.SubordinateID] && (
                                    <Tooltip
                                      relationship="label"
                                      content={
                                        <div className="flex flex-col">
                                          <Text className="!text-xs !font-semibold text-gray-900">
                                            {interviewerProfiles[request.SubordinateID].displayName}
                                          </Text>
                                          <Text className="!text-xs text-gray-600">
                                            {interviewerProfiles[request.SubordinateID].email}
                                          </Text>
                                        </div>
                                      }
                                    >
                                      {interviewerProfiles[request.SubordinateID].profilePicture ? (
                                        <Avatar
                                          size={24}
                                          image={{
                                            src: interviewerProfiles[request.SubordinateID].profilePicture
                                          }}
                                          name={interviewerProfiles[request.SubordinateID].displayName}
                                          className={`${classes.avatarIcon} border border-green-300`}
                                        />
                                      ) : (
                                        <Avatar
                                          size={24}
                                          name={interviewerProfiles[request.SubordinateID].displayName}
                                          className={`${classes.avatarIcon} border border-green-300`}
                                          color="colorful"
                                        />
                                      )}
                                    </Tooltip>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>

                      {/* <TableCell className="py-5 px-6">
                        <div className="flex items-center justify-start">
                          <Tooltip content={"View History"} relationship={'label'}>
                            <Text className="!text-xs !font-bold bg-[#F1F5F9] !px-[15px] !py-[8px] rounded-[5px] flex items-center !gap-[6px] cursor-pointer" onClick={() => handleOpenHistoryDialog(request)}>
                              <ApprovalsApp20Regular style={{ height: '15px', width: '15px' }} />v{request.LatestVersion > 0 ? request.LatestVersion : 0}
                            </Text></Tooltip>
                        </div>
                      </TableCell> */}

                      <TableCell width={50} className="py-5 px-6">
                        <div className="flex items-center justify-start"
                          style={{
                            backgroundColor: `${handleRequestStatus(request.HiredApplicantsCount, request.NumPositions, daysStatus)?.background}`, color: `${handleRequestStatus(request.HiredApplicantsCount, request.NumPositions, daysStatus)?.color}`,
                            display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5px 3px', borderRadius: '30px', border: `1px solid ${handleRequestStatus(request.HiredApplicantsCount, request.NumPositions, daysStatus)?.color}40`
                          }}>
                          <span>{handleRequestStatus(request.HiredApplicantsCount, request.NumPositions, daysStatus)?.text}</span>
                        </div>
                      </TableCell>

                      <TableCell className="py-5 px-6 flex !justify-center">
                        <div className="flex gap-2 transition-all duration-200 justify-center items-center">
                          <Tooltip content="View Details" relationship="label">
                            <Button
                              appearance="subtle"
                              icon={<EyeRegular />}
                              size="small"
                              onClick={() => handleViewDetails(request)}
                            />
                          </Tooltip>

                          {(canEditJob ||
                            canDeleteJob ||
                            canManageApplications ||
                            canCreateInterview ||
                            canViewFeedback
                          ) && (
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
                                    {canEditJob && (viewPermissionType === 'view_all'||currentUser?.userID?.toLowerCase() !== request?.SubordinateID?.toLowerCase()) && (
                                      <MenuItem
                                        icon={<EditRegular />}
                                        onClick={() =>{
                                          navigate(`/recruit/editJD/${request.ID}`)
                                          localStorage.setItem("recruitPagination",JSON.stringify(pagination))
                                        }}
                                      >
                                        Edit JD
                                      </MenuItem>
                                    )}
 
                                    {canEditJob && (viewPermissionType === 'view_all'||currentUser?.userID?.toLowerCase() !== request?.SubordinateID?.toLowerCase()) &&(
                                      <MenuItem
                                        icon={<People20Regular />}
                                        onClick={() =>
                                          handleOpenReassignDialog(request)
                                        }
                                      >
                                        Reassign HR
                                      </MenuItem>
                                    )}
 
                                    {canDeleteJob && (
                                      <MenuItem
                                        icon={<DeleteRegular />}
                                        onClick={() => {
                                          setRequestToDelete(request);
                                          setDeleteDialogOpen(true);
                                        }}
                                      >
                                        Delete JD
                                      </MenuItem>
                                    )}
 
                                    {/* <MenuItem
                                      icon={<DocumentTextRegular />}
                                      onClick={() =>
                                        navigate(
                                          `/recruit/jdOverview/${request.ID}`
                                        )
                                      }
                                    >
                                      View Full Details
                                    </MenuItem> */}
 
                                    {/* <MenuItem
                                    onClick={() => handleOpenHistoryDialog(request)}
                                    disabled={isDeleting}
                                    icon={<History20Regular />}
                                  >
                                    View History
                                  </MenuItem> */}
                                  </MenuList>
                                </MenuPopover>
                              </Menu>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
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
                No JD requests found
              </Subtitle2>
              <div className="text-center">
                <Body1 className="text-gray-500 max-w-md mx-auto leading-relaxed flex flex-row items-center justify-center">
                  {searchQuery ||
                    statusFilter !== "all" ||
                    departmentFilter !== "all" ||
                    jobNatureFilter !== "all"
                    ? "We couldn't find any requests matching your criteria. Try adjusting your search or filters to see more results."
                    : "There are no JD requests to display at the moment. Create your first job description request to get started."}
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
                    {pagination.totalCount > 0
                      ? (pagination.currentPage - 1) * pagination.pageSize + 1
                      : 0}{" "}
                    to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.pageSize,
                      pagination.totalCount
                    )}{" "}
                    of {pagination.totalCount} filtered results
                    {pagination.totalCount !== jdStats.total &&
                      ` (${jdStats.total} total)`}
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

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onOpenChange={(_, data) => setDeleteDialogOpen(data.open)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Delete Job Posting</DialogTitle>
              <DialogContent>
                Are you sure you want to delete the job posting "
                {requestToDelete?.JobRole}" ({requestToDelete?.JDCode})? This
                action cannot be undone.
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary">Cancel</Button>
                </DialogTrigger>
                <Button
                  appearance="primary"
                  disabled={isDeleting}
                  onClick={() =>
                    requestToDelete && handleDeleteJD(requestToDelete.ID)
                  }
                >
                  {isDeleting ? <Spinner size="tiny" /> : "Delete"}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

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

        {/* Version History Dialog */}
        <Dialog
          open={showHistoryDialog}
          onOpenChange={(event, data) => setShowHistoryDialog(data.open)}
        >
          <DialogSurface style={{ maxWidth: "90vw", width: "1200px", maxHeight: "90vh" }}>
            <DialogBody>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <History20Regular />
                  Version History - {selectedHistoryJD?.JobRole || "JD Request"}
                  {selectedHistoryJD?.JDCode && ` (${selectedHistoryJD.JDCode})`}
                </div>
              </DialogTitle>
              <DialogContent className="overflow-y-auto max-h-[70vh]">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Spinner />
                    <Body1Strong className="mt-2">Loading version history...</Body1Strong>
                  </div>
                ) : versionHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <ArrowClockwise20Regular className="text-gray-400" style={{ fontSize: "48px" }} />
                    <Body1Strong className="mt-4">No Version History Found</Body1Strong>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Current Version Info */}
                    <Card className="!bg-blue-50 !border-blue-200">
                      <div className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex gap-2">
                            <Body1Strong className="text-blue-900">Current Version</Body1Strong>
                            <Caption1 className="text-blue-700">
                              JD Code: {selectedHistoryJD?.JDCode}
                            </Caption1>
                          </div>
                          <Badge appearance="filled" color="brand">
                            v{versionHistory[0]?.VersionNumber || 1}
                          </Badge>
                        </div>
                      </div>
                    </Card>

                    {/* Version History List */}
                    {versionHistory.map((version) => {
                      // Get changed fields
                      const changedFields = [];
                      if (version.JobRole_Changed && version.JobRole) {
                        changedFields.push({ field: "Job Role", value: version.JobRole });
                      }
                      if (version.Department_Changed && version.Department) {
                        changedFields.push({ field: "Department", value: version.Department });
                      }
                      if (version.JobNature_Changed && version.JobNature) {
                        changedFields.push({ field: "Job Nature", value: version.JobNature });
                      }
                      if (version.TargetDate_Changed && version.TargetDate) {
                        changedFields.push({
                          field: "Target Date",
                          value: formatDate(version.TargetDate)
                        });
                      }
                      if (version.NumPositions_Changed && version.NumPositions !== undefined) {
                        changedFields.push({ field: "Number of Positions", value: version.NumPositions });
                      }
                      if (version.minWorkExperience_Changed && version.minWorkExperience !== undefined) {
                        changedFields.push({ field: "Min Experience", value: `${version.minWorkExperience} years` });
                      }
                      if (version.maxWorkExperience_Changed && version.maxWorkExperience !== undefined) {
                        changedFields.push({ field: "Max Experience", value: `${version.maxWorkExperience} years` });
                      }
                      if (version.MinSalaryRange_Changed && version.MinSalaryRange !== undefined) {
                        changedFields.push({ field: "Min Salary", value: `₹${version.MinSalaryRange}00000` });
                      }
                      if (version.MaxSalaryRange_Changed && version.MaxSalaryRange !== undefined) {
                        changedFields.push({ field: "Max Salary", value: `₹${version.MaxSalaryRange}00000` });
                      }
                      if (version.JobLocation_Changed && version.JobLocation) {
                        changedFields.push({ field: "Job Location", value: version.JobLocation });
                      }
                      if (version.Status_Changed && version.Status) {
                        changedFields.push({ field: "Status", value: version.Status });
                      }
                      if (version.isActive_Changed && version.isActive !== undefined) {
                        changedFields.push({ field: "Active Status", value: version.isActive ? "Active" : "Inactive" });
                      }
                      if (version.isPublished_Changed && version.isPublished !== undefined) {
                        changedFields.push({ field: "Published", value: version.isPublished ? "Yes" : "No" });
                      }
                      if (version.InActiveReason_Changed && version.InActiveReason) {
                        changedFields.push({ field: "Inactive Reason", value: version.InActiveReason });
                      }

                      // Parse skills if they changed
                      let skillsData = [];
                      if (version.Skills_Changed && version.SkillsSnapshot) {
                        try {
                          skillsData = typeof version.SkillsSnapshot === 'string'
                            ? JSON.parse(version.SkillsSnapshot)
                            : version.SkillsSnapshot;
                        } catch (e) {
                          console.error("Error parsing skills:", e);
                          skillsData = [];
                        }
                      }

                      return (
                        <Card key={version.VersionID} className="!border !border-gray-200">
                          <div className="p-4">
                            {/* Version Header */}
                            <div className="flex flex-col justify-between items-start mb-4 gap-3">
                              <div className="flex justify-between items-center w-[100%]">
                                <div className="flex flex-col items-center gap-2 mb-2">
                                  <Badge appearance="outline" shape="rounded">
                                    Version {version.VersionNumber}
                                  </Badge>
                                  <Badge appearance="filled" color="informative">
                                    {version.TotalChanges || changedFields.length} change{(version.TotalChanges || changedFields.length) !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                                <div className="flex flex-col">
                                  <Caption1 className="text-gray-500">
                                    {new Date(version.VersionCreatedAt).toLocaleString()}
                                  </Caption1>
                                  <Caption1 className="text-gray-500">
                                    Modified by: {version.ModifiedByUserName || "System"}
                                  </Caption1></div>
                              </div>
                              {version.ChangeSummary && version.ChangeSummary !== "No changes detected" && (
                                <div className="mb-4">
                                  {/* <Body1Strong className="text-gray-700 mb-2">Change Summary:</Body1Strong> */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                      <Caption1 className="text-blue-800 font-semibold mb-1">Original Summary</Caption1>
                                      <Body1 className="text-blue-900">{version.ChangeSummary}</Body1>
                                    </div> */}
                                    <div className="p-3 bg-[#fff] border border-gray-200 rounded-lg w-[100%]">
                                      <Text className="text-black text-[15px] font-bold mb-2">Request Changes are:</Text>
                                      {formatChangeSummary(version.ChangeSummary)}
                                    </div>
                                  </div>
                                </div>
                              )}
                              {/* Inside the version card */}
                              {/* <div className="mb-4">
                                <Body1Strong className="text-gray-700 mb-2">Detailed Changes:</Body1Strong>
                                {renderDetailedChanges(version)}
                              </div> */}
                            </div>

                            {/* Changed Fields Grid */}
                            {/* {changedFields.length > 0 && (
                              <div className="mb-4">
                                <Body1Strong className="text-gray-700 mb-2">Changed Fields:</Body1Strong>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {changedFields.map((field, idx) => (
                                    <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                      <Caption1 className="text-gray-600 font-semibold">{field.field}</Caption1>
                                      <Body1 className="text-gray-900 mt-1">{field.value}</Body1>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )} */}

                            {/* Job Description Changes */}
                            {version.JobDescription_Changed && version.JobDescription && (
                              <div className="mb-4">
                                <Body1Strong className="text-gray-700 mb-2">Job Description:</Body1Strong>
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <Body1 className="text-gray-900 whitespace-pre-line">
                                    <JobDescriptionRenderer content={version.JobDescription} />
                                  </Body1>
                                </div>
                              </div>
                            )}

                            {/* Skills Changes */}
                            {skillsData.length > 0 && (
                              <div className="mb-4">
                                <Body1Strong className="text-gray-700 mb-2">Skills ({skillsData.length}):</Body1Strong>
                                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {/* Compare skills for the current version */}
                                    {(() => {
                                      // Create maps for easy comparison
                                      const currentSkillsMap = new Map(
                                        currentSkills.map(skill => [
                                          skill.SkillName?.toLowerCase().trim(),
                                          { ...skill, found: false }
                                        ])
                                      );

                                      const versionSkillsMap = new Map(
                                        skillsData.map((skill: any) => [
                                          (skill.name || skill.SkillName)?.toLowerCase().trim(),
                                          { ...skill, found: false }
                                        ])
                                      );

                                      // Find differences
                                      const results: Array<{
                                        skill: any;
                                        type: 'added' | 'removed' | 'unchanged' | 'rating-changed';
                                        currentRating?: number;
                                        versionRating?: number;
                                      }> = [];

                                      // Check current skills against version skills
                                      currentSkills.forEach(currentSkill => {
                                        const skillKey = currentSkill.SkillName?.toLowerCase().trim();
                                        const versionSkill = versionSkillsMap.get(skillKey);

                                        if (versionSkill) {
                                          // Skill exists in both versions
                                          const currentRating = currentSkill.Rating || 0;
                                          const versionRating = (versionSkill as any).Rating || (versionSkill as any).rating || 0;

                                          if (currentRating !== versionRating) {
                                            // Rating changed
                                            results.push({
                                              skill: currentSkill,
                                              type: 'rating-changed',
                                              currentRating,
                                              versionRating
                                            });
                                          } else {
                                            // Unchanged
                                            results.push({
                                              skill: currentSkill,
                                              type: 'unchanged'
                                            });
                                          }

                                          // Mark as found
                                          // versionSkill.found = true;
                                        } else {
                                          // Skill added in current version (not in this version history)
                                          results.push({
                                            skill: currentSkill,
                                            type: 'added'
                                          });
                                        }
                                      });

                                      // Check for skills that were removed (in version but not in current)
                                      skillsData.forEach((versionSkill: any) => {
                                        const skillKey = (versionSkill.name || versionSkill.SkillName)?.toLowerCase().trim();
                                        if (!currentSkillsMap.has(skillKey)) {
                                          results.push({
                                            skill: versionSkill,
                                            type: 'removed'
                                          });
                                        }
                                      });

                                      // Sort results: added (green), removed (red), rating-changed, unchanged
                                      const sortedResults = results.sort((a, b) => {
                                        const order = { 'added': 1, 'removed': 2, 'rating-changed': 3, 'unchanged': 4 };
                                        return (order[a.type] || 5) - (order[b.type] || 5);
                                      });

                                      return sortedResults.map((item, idx) => {
                                        const skillName = item.skill.name || item.skill.SkillName || "Skill";
                                        const versionRating = item.skill.rating || item.skill.Rating || 0;

                                        // Determine styles based on type
                                        let borderColor = "border-gray-100";
                                        let bgColor = "bg-white";
                                        let textColor = "text-gray-900";
                                        let badgeColor: "informative" | "success" | "danger" | "warning" = "informative";
                                        let badgeText = "";

                                        switch (item.type) {
                                          case 'added':
                                            borderColor = "border-green-200";
                                            bgColor = "bg-green-50";
                                            textColor = "text-green-800";
                                            badgeColor = "success";
                                            badgeText = "New";
                                            break;

                                          case 'removed':
                                            borderColor = "border-red-200";
                                            bgColor = "bg-red-50";
                                            textColor = "text-red-800";
                                            badgeColor = "danger";
                                            badgeText = "Removed";
                                            break;

                                          case 'rating-changed':
                                            borderColor = "border-yellow-200";
                                            bgColor = "bg-yellow-50";
                                            textColor = "text-yellow-800";
                                            badgeColor = "warning";
                                            badgeText = `Rating changed: ${item.versionRating} → ${item.currentRating}/5`;
                                            break;

                                          case 'unchanged':
                                          default:
                                            borderColor = "border-gray-100";
                                            bgColor = "bg-white";
                                            textColor = "text-gray-700";
                                            badgeColor = "informative";
                                            badgeText = `Rating: ${versionRating}/5`;
                                            break;
                                        }

                                        return (
                                          <div
                                            key={idx}
                                            className={`flex items-center justify-between p-2 ${bgColor} border ${borderColor} rounded`}
                                          >
                                            <Body1 className={textColor}>
                                              {skillName}
                                              {item.type === 'added' && (
                                                <span className="ml-2 text-xs text-green-600">(New)</span>
                                              )}
                                              {item.type === 'removed' && (
                                                <span className="ml-2 text-xs text-red-600">(Removed)</span>
                                              )}
                                            </Body1>

                                            <div className="flex items-center gap-2">
                                              {item.type === 'rating-changed' && (
                                                <div className="flex items-center gap-1">
                                                  <Badge appearance="ghost" color="warning" size="small">
                                                    {item.versionRating}/5
                                                  </Badge>
                                                  <span className="text-gray-400">→</span>
                                                  <Badge appearance="ghost" color="success" size="small">
                                                    {item.currentRating}/5
                                                  </Badge>
                                                </div>
                                              )}

                                              <Badge appearance="outline" color={badgeColor} size="small">
                                                {badgeText}
                                              </Badge>
                                            </div>
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>

                                  {/* Legend for colors */}
                                  <div className="mt-4 pt-3 border-t border-gray-200">
                                    <Text className="text-gray mb-3" style={{ fontWeight: '600' }}>Color Legend:</Text>
                                    <div className="flex flex-wrap gap-3">
                                      <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                                        <Caption1 className="text-green-700">Green = New skill added</Caption1>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                                        <Caption1 className="text-red-700">Red = Skill removed</Caption1>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                                        <Caption1 className="text-yellow-700">Yellow = Skill rating changed</Caption1>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Remove this old comparison code: */}
                            {/* {currentSkills.map((skill: any) => (
  <span>{skill.SkillName}</span>
))} */}

                            {/* Reporting Manager Changes */}
                            {version.ReportingManagerID_Changed && (
                              <div className="mb-2">
                                <Caption1 className="text-gray-600">Reporting Manager ID updated</Caption1>
                              </div>
                            )}

                            {/* Empty State if no specific changes */}
                            {changedFields.length === 0 &&
                              !version.JobDescription_Changed &&
                              skillsData.length === 0 &&
                              !version.ReportingManagerID_Changed && (
                                <div className="p-3 bg-gray-50 rounded-lg text-center">
                                  <Body1 className="text-gray-500">No specific field changes detected in this version</Body1>
                                </div>
                              )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => setShowHistoryDialog(false)}
                >
                  Close
                </Button>
                <Button
                  appearance="primary"
                  icon={<ArrowClockwise20Regular />}
                  onClick={handleRefreshHistory}
                  disabled={historyLoading}
                >
                  {historyLoading ? "Refreshing..." : "Refresh History"}
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>

      </div>
      <Toaster toasterId={toasterId} />
    </FluentProvider>
  );
};

export default JDRequestsTable;
