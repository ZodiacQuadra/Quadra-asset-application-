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
  Subtitle2,
  Caption1,
  Spinner,
  Tooltip,
  CardPreview,
  Avatar,
  Body1,
  FluentProvider,
  Toast,
  ToastTitle,
  useToastController,
  Toaster,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerFooter,
  Divider,
  Menu,
  MenuTrigger,
  MenuButton,
  MenuPopover,
  MenuList,
  MenuItem,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Persona,
} from "@fluentui/react-components";
import {
  ChevronUpRegular,
  ChevronDownRegular,
  FilterRegular,
  CheckmarkCircle20Regular,
  Clock20Regular,
  PersonSearch20Regular,
  PersonRegular,
  Eye20Regular,
  AddRegular,
  LockClosedRegular,
  LockOpenRegular,
  Dismiss20Regular,
  Calendar20Regular,
  ApprovalsApp20Regular,
  Alert20Regular,
  MoreHorizontal20Regular,
  EditRegular,
  DeleteRegular,
  Info20Regular,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";
import {
  getAllEmployeeExits,
  getMyEmployeeExits,
  deleteEmployeeExit,
  toggleExitLock,
  sendDepartmentReminder,
  sendOffboardingReminder,
} from "../../Services/Offboarding";
import CustomStatsCard from "../../Recruit/Components/CustomStatsCard";
import VerticalCustomStepper from "../Component/VerticalCustomStepper";
import { useAuth } from "../../Auth/AuthProvider";

// Mock Navigate Hook

// Types
interface EmployeeExit {
  ID: string;
  ExitSequence: string;
  ExitID: string;
  Name: string;
  Email: string;
  Phone: string;
  Designation: string;
  WorkLocation: string;
  GroupName: string;
  ManagerUserID: string;
  JoiningDate: string;
  ResignationDate: string;
  RelievingDate: string;
  NoticePeriod: number;
  PersonalMailID?: string;
  Status: string;
  IsCompleted: boolean;
  HeadStatus: string;
  HeadUserID?: string;
  HeadDate?: string | null;
  HeadRemainder?: string | null;
  HRStatus: string;
  HRUserID?: string | null;
  HRDate?: string | null;
  ITStatus: string;
  ITUserID?: string | null;
  ITDate?: string | null;
  ITRemainder?: string | null;
  AdminStatus: string;
  AdminUserID?: string | null;
  AdminDate?: string | null;
  AdminRemarks?: string | null;
  AdminDraftStatus?: string | null;
  AdminRemainder?: string | null;
  AddDeduction?: string | null;
  DeductionAmount?: number | null;
  FinanceStatus: string;
  FinanceUserID?: string | null;
  FinanceDate?: string | null;
  FinanceRemarks?: string | null;
  FinanceDraftStatus?: string | null;
  FinanceRemainder?: string | null;
  CreatedByUserID: string;
  ModifiedByUserID?: string;
  CreatedAt: string;
  ModifiedAt?: string;
  IsDeleted?: boolean;
  DeletedAt?: string | null;
  DeletedByUserID?: string | null;
  ManagerUserIDDetails?: UserDetails;
  CreatedByUserIDDetails?: UserDetails;
  HeadUserIDDetails?: UserDetails;
  ITUserIDDetails?: UserDetails;
  AdminUserIDDetails?: UserDetails;
  HrUserIDDetails?: UserDetails;
  FinanceUserIDDetails?: UserDetails;
  ActivitiesCount?: number;
}

interface UserDetails {
  id: string;
  displayName: string;
  email: string;
}

interface ExitStats {
  total: number;
  pending: number;
  locked: number;
  completed: number;
}

// Mock Data

const EmployeeExitsDashboard = () => {
  const [allExits, setAllExits] = useState<EmployeeExit[]>([]);
  const [filteredExits, setFilteredExits] = useState<EmployeeExit[]>([]);
  const [paginatedExits, setPaginatedExits] = useState<EmployeeExit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const { currentUser, accessToken, refreshToken }: any = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof EmployeeExit;
    direction: "asc" | "desc";
  } | null>({ key: "CreatedAt", direction: "desc" });
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 0,
  });

  // Permission checks
  const canCreateOffboarding =
    currentUser?.permissions?.offboarding?.offboarding_manage
      ?.create_offboarding === true;
  const canEditOffboarding =
    currentUser?.permissions?.offboarding?.offboarding_manage
      ?.edit_offboarding === true;
  const canDeleteOffboarding =
    currentUser?.permissions?.offboarding?.offboarding_manage
      ?.delete_offboarding === true;
  const canViewAllOffboarding =
    currentUser?.permissions?.offboarding?.offboarding_view
      ?.view_all_offboarding === true;
  const canViewMyOffboarding =
    currentUser?.permissions?.offboarding?.offboarding_view
      ?.view_my_offboarding === true;

  const [stats, setStats] = useState<ExitStats>({
    total: 0,
    pending: 0,
    locked: 0,
    completed: 0,
  });

  const [remainderNotifications, setRemainderNotifications] = useState<
    string[]
  >([]);

  
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

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exitToDelete, setExitToDelete] = useState<EmployeeExit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedExit, setSelectedExit] = useState<EmployeeExit | null>(null);

  // Get unique values for filters
  const uniqueDepartments = Array.from(
    new Set(allExits.map((exit) => exit.GroupName).filter(Boolean))
  ).sort();

  const uniqueLocations = Array.from(
    new Set(allExits.map((exit) => exit.WorkLocation).filter(Boolean))
  ).sort();

  // Load exits based on permissions
  const loadExits = async () => {
    try {
      setIsLoading(true);

      let response;

      // Call appropriate API endpoint based on permissions
      if (canViewAllOffboarding) {
        // Call API for all exits
        response = await getAllEmployeeExits(accessToken);
      } else if (canViewMyOffboarding) {
        // Call API for only user's related exits
        response = await getMyEmployeeExits(currentUser.userID, accessToken);
      } else {
        // No permission to view any exits
        setIsLoading(false);
        return;
      }

      if (response.success && response.data) {
        setAllExits(response.data);
        calculateStats(response.data);
      } else {
        showToast(
          response.message || "Failed to load offboarding records",
          "error"
        );
      }
    } catch (error) {
      console.error("Error loading offboarding:", error);
      showToast("Failed to load offboarding records", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (data: EmployeeExit[]) => {
    const stats = {
      total: data.length,
      pending: data.filter((exit: EmployeeExit) => exit.Status === "Pending")
        .length,
      locked: data.filter((exit: EmployeeExit) => exit.Status === "Locked")
        .length,
      completed: data.filter(
        (exit: EmployeeExit) => exit.Status === "Completed"
      ).length,
    };
    setStats(stats);
  };

  // Check permissions

    useEffect(()=>{
      if(checkPermission("offboarding.offboarding_view.view_all_offboarding") ||
            checkPermission("offboarding.offboarding_view.view_my_offboarding") ){
              return
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
          navigate("/offboard/LeadKtClearance")
        }
    },[])

  // Client-side filtering
  useEffect(() => {
    let filtered = [...allExits];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((exit) => {
        const searchableFields = [
          exit.ExitID,
          exit.Name,
          exit.Email,
          exit.Designation,
          exit.GroupName,
          exit.WorkLocation,
        ];
        return searchableFields.some(
          (field) => field && field.toString().toLowerCase().includes(query)
        );
      });
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((exit) => exit.Status === statusFilter);
    }

    if (departmentFilter !== "all") {
      filtered = filtered.filter((exit) => exit.GroupName === departmentFilter);
    }

    if (locationFilter !== "all") {
      filtered = filtered.filter(
        (exit) => exit.WorkLocation === locationFilter
      );
    }

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;
        if (sortConfig.key.includes("Date")) {
          comparison =
            new Date(aValue as string).getTime() -
            new Date(bValue as string).getTime();
        } else if (typeof aValue === "string") {
          comparison = aValue.localeCompare(bValue as string);
        } else if (typeof aValue === "number") {
          comparison = aValue - (bValue as number);
        }

        return sortConfig.direction === "desc" ? -comparison : comparison;
      });
    }

    setFilteredExits(filtered);

    const totalCount = filtered.length;
    const totalPages = Math.ceil(totalCount / pagination.pageSize);
    setPagination((prev) => ({
      ...prev,
      totalCount,
      totalPages,
      currentPage: prev.currentPage > totalPages ? 1 : prev.currentPage,
    }));
  }, [
    allExits,
    searchQuery,
    statusFilter,
    departmentFilter,
    locationFilter,
    sortConfig,
    pagination.pageSize,
  ]);

  // Pagination
  useEffect(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    setPaginatedExits(filteredExits.slice(startIndex, endIndex));
  }, [filteredExits, pagination.currentPage, pagination.pageSize]);

  useEffect(() => {
    loadExits();
    localStorage.removeItem("inductionPagination");

  }, []);

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Completed":
        return "text-green-600 font-semibold";
      case "Pending":
        return "text-[#DFB200] font-semibold";
      case "Locked":
        return "text-red-600 font-semibold";
      default:
        return "text-gray-800 font-semibold";
    }
  };

  const handleSort = (key: keyof EmployeeExit) => {
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

  const showToast = (message: string, intent: any = "success") => {
    dispatchToast(
      <Toast>
        <ToastTitle>{message}</ToastTitle>
      </Toast>,
      { intent, position: "bottom-end" }
    );
  };

  const handleLockToggle = async (exit: EmployeeExit) => {
    if (!canEditOffboarding) {
      showToast("You don't have permission to lock/unlock", "error");
      return;
    }

    try {
      setIsProcessing(true);

      const isCurrentlyLocked = exit.Status === "Locked";

      const lockData = {
        currentStatus: exit.Status,
        headStatus: exit.HeadStatus,
        itStatus: exit.ITStatus,
        adminStatus: exit.AdminStatus,
        financeStatus: exit.FinanceStatus,
        isUnlocking: isCurrentlyLocked,
      };

      // Call the API
      const response = await toggleExitLock(exit.ID, lockData, accessToken);

      if (response.success) {
        // Reload offboarding to get updated data
        await loadExits();

        showToast(
          isCurrentlyLocked
            ? "Offboarding unlocked successfully"
            : "Offboarding locked successfully",
          "success"
        );
      } else {
        showToast(response.message || "Failed to update lock status", "error");
      }
    } catch (error) {
      console.error("Error updating lock status:", error);
      showToast("Failed to update status. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseDrawer = () => {
    setRemainderNotifications([]);
    setIsDrawerOpen(false);
  };

  const handleClearSelection = () => {
    setRemainderNotifications([]);
  };

  const handleReminderToggle = async (
    exitId: string,
    department: string,
    data: any
  ) => {
    // console.log(data);
    try {
      setIsProcessing(true);

      // Send reminder to the department with current timestamp
      const reminderValue = new Date().toISOString();
      const response = await sendDepartmentReminder(
        exitId,
        department as "Head" | "IT" | "Admin" | "Finance" | "HeadKt",
        reminderValue,
        accessToken
      );
      await refreshToken().then(async (result: any) => {
        const responsea = await sendOffboardingReminder(
          exitId,
          data,
          department as "Head" | "IT" | "Admin" | "Finance" | "HeadKt",
          currentUser, // UserDetails from auth context
          accessToken // Get from your auth context
        )
          .then(async (result) => {
            setTimeout(() => {
              (async () => {
                // await loadExits();
              })();
            }, 1000);

            return result;
          })
          .catch((error) => {
            console.error("Error sending reminder:", error);
          });
      });

      if (response.success) {
        // Reload Offboarding to get updated data

        showToast(`Reminder sent to ${department} successfully`, "success");
      } else {
        showToast(response.message || "Failed to send reminder", "error");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      showToast("Failed to send reminder. Please try again.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedRemainder = async () => {
    if (remainderNotifications.length > 0 && selectedExit) {
      const promises = remainderNotifications.map(async (department) => {
        let currentDept;

        switch (department) {
          case "Manager Clearance":
            currentDept = "Head";
            break;
          case "IT Clearance":
            currentDept = "IT";
            break;
          case "Admin Clearance":
            currentDept = "Admin";
            break;
          case "HR Clearance":
            currentDept = "HR";
            break;
          case "Knowledge Transfer Clearance":
            currentDept = "HeadKt";
            break
          case "Finance Clearance":
            currentDept = "Finance";
            break;
        }

        if (!currentDept) return;

        return handleReminderToggle(selectedExit.ID, currentDept, selectedExit);
      });

      try {
        await Promise.all(promises);
        showToast("All reminders sent successfully", "success");
        handleCloseDrawer();
      } catch (error) {
        console.error("Error sending reminders:", error);
        showToast("Failed to send some reminders", "error");
      }
    }
  };

  const handleDelete = async () => {
    if (!exitToDelete || !canDeleteOffboarding) return;

    setIsDeleting(true);
    try {
      const response = await deleteEmployeeExit(
        exitToDelete.ID,
        currentUser.userID,
        accessToken
      );

      if (response.success) {
        showToast(
          response.message || "Offboarding record deleted successfully",
          "success"
        );

        // Reload the data
        await loadExits();

        setDeleteDialogOpen(false);
        setExitToDelete(null);
      } else {
        showToast(
          response.message || "Failed to delete offboarding record",
          "error"
        );
      }
    } catch (error) {
      console.error("Error deleting offboarding:", error);
      showToast("Failed to delete offboarding record", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const isLockDisabled = (exit: any) => {
    return exit.Status === "Completed";
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setLocationFilter("all");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleViewDetails = (id: string) => {
    // console.log("View details:", id);
  };

  const handleStatusCardClick = (status: string) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const isStatusCardActive = (status: string) => {
    return statusFilter === status;
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const hasOffboardingAccess = canViewAllOffboarding || canViewMyOffboarding;

  const getDashboardTitle = () => {
    if (canViewMyOffboarding && !canViewAllOffboarding) {
      return "Offboarding Dashboard";
    }
    return "Offboarding Dashboard";
  };

  const getDashboardDescription = () => {
    if (canViewMyOffboarding && !canViewAllOffboarding) {
      return "View and manage offboarding processes for employees you're involved with";
    }
    return "View and manage all employee offboarding processes";
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">
          Loading Offboarding Requests...
        </Body1Strong>
      </div>
    );
  }

  if (!hasOffboardingAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 h-full">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
          <LockClosedRegular className="w-10 h-10 text-blue-600" />
        </div>
        <Subtitle2 className="mb-3 text-gray-700">No Access</Subtitle2>
        <Body1 className="text-gray-500 max-w-md mx-auto text-center leading-relaxed">
          You don't have permission to view offboarding records. Please contact
          your administrator to request access.
        </Body1>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-screen mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Subtitle2 className="text-[#902D0F] font-bold">
            {getDashboardTitle()}
          </Subtitle2>
          <div>
            {" "}
            <Caption1 className="text-gray-600">
              {getDashboardDescription()}
            </Caption1>
          </div>
        </div>
        <div>
          {canCreateOffboarding && (
            <Button
              appearance="primary"
              shape="circular"
              onClick={() => navigate("/offboard/offboardForm")}
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
              Initiate Exit Process
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        <CustomStatsCard
          style={isStatusCardActive("Pending") ? "ring-2 ring-blue-500" : ""}
          onClick={() => handleStatusCardClick("Pending")}
        >
          <CardPreview className="py-[17px] px-[20px]">
            <div className="!flex flex-row items-center justify-between">
              <div className="flex flex-col gap-[11px]">
                <div>
                  <Text size={300} weight="semibold" className="!text-gray-700">
                    Pending
                  </Text>
                </div>
                <div>
                  <Text
                    size={600}
                    weight="semibold"
                    className="text-2xl font-bold"
                  >
                    {stats.pending}
                  </Text>
                </div>
              </div>
              <div>
                <Avatar
                  color="marigold"
                  size={36}
                  icon={
                    <div className="bg-[#FAF2E4] rounded-full p-[15px]">
                      <Clock20Regular
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
          style={isStatusCardActive("Completed") ? "ring-2 ring-blue-500" : ""}
          onClick={() => handleStatusCardClick("Completed")}
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
                    {stats.completed}
                  </Text>
                </div>
              </div>
              <div>
                <Avatar
                  color="seafoam"
                  size={36}
                  icon={
                    <div className="bg-[#EFFFF9] rounded-full p-[15px]">
                      <CheckmarkCircle20Regular
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
          style={isStatusCardActive("Locked") ? "ring-2 ring-blue-500" : ""}
          onClick={() => handleStatusCardClick("Locked")}
        >
          <CardPreview className="py-[17px] px-[20px]">
            <div className="!flex flex-row items-center justify-between">
              <div className="flex flex-col gap-[11px]">
                <div>
                  <Text size={300} weight="semibold" className="!text-gray-700">
                    Locked
                  </Text>
                </div>
                <div>
                  <Text
                    size={600}
                    weight="semibold"
                    className="text-2xl font-bold"
                  >
                    {stats.locked}
                  </Text>
                </div>
              </div>
              <div>
                <Avatar
                  color="cranberry"
                  size={36}
                  icon={
                    <div className="bg-[#FFEBEB] rounded-full p-[15px]">
                      <CheckmarkCircle20Regular
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
        <Divider vertical />
        <CustomStatsCard
          style={isStatusCardActive("all") ? "ring-2 ring-blue-500" : ""}
          onClick={() => handleStatusCardClick("all")}
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
                    {stats.total}
                  </Text>
                </div>
              </div>
              <div>
                <Avatar
                  color="colorful"
                  size={36}
                  icon={
                    <div className="bg-[#F1E8FF] rounded-full p-[15px]">
                      <PersonSearch20Regular
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
      </div>

      {/* Table Card */}
      <FluentProvider style={{ background: "transparent" }}>
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white">
          <div className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex flex-col gap-4">
            <div className="flex justify-between items-center gap-[3%] w-[100%]">
              <div className="flex col-span-6 xs:col-span-12 !w-[40%]">
                <SearchBox
                  placeholder="Search by ID, name, email, designation..."
                  value={searchQuery}
                  onChange={(_, data) => setSearchQuery(data.value)}
                  className="!w-full !h-fit"
                />
              </div>

              <div className="flex gap-2">
                <Dropdown
                  placeholder="All Departments"
                  // value={departmentFilter}
                  // selectedOptions={[departmentFilter]}
                  value={departmentFilter === "all" ? "All Departments" : departmentFilter}
                  selectedOptions={[departmentFilter]}
                  onOptionSelect={(_, data) =>
                    setDepartmentFilter(data.optionValue || "all")
                  }
                >
                  <Option value="all">All Departments</Option>
                  {uniqueDepartments.map((dept) => (
                    <Option key={dept} value={dept}>
                      {dept}
                    </Option>
                  ))}
                </Dropdown>

                <Dropdown
                  placeholder="All Locations"
                  // value={locationFilter}
                  // selectedOptions={[locationFilter]}
                  value={locationFilter === "all" ? "All Locations" : locationFilter}
                  selectedOptions={[locationFilter]}
                  onOptionSelect={(_, data) =>
                    setLocationFilter(data.optionValue || "all")
                  }
                >
                  <Option value="all">All Locations</Option>
                  {uniqueLocations.map((loc) => (
                    <Option key={loc} value={loc}>
                      {loc}
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
                    locationFilter === "all"
                  }
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Table */}
            <Table sortable className="w-full">
              <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                <TableRow className="border-b-2 border-gray-100">
                  {/* <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                    onClick={() => handleSort("ExitID")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-600">
                        Offboarding ID
                      </Body1Strong>
                      {sortConfig?.key === "ExitID" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4" />
                        ))}
                    </div>
                  </TableHeaderCell> */}

                  <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                  >
                    <Body1Strong className="text-gray-600">
                      Employee Details
                    </Body1Strong>
                  </TableHeaderCell>

                  <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                  >
                    <Body1Strong className="text-gray-600">
                      Department
                    </Body1Strong>
                  </TableHeaderCell>

                  <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                  >
                    <Body1Strong className="text-gray-600">
                      Location
                    </Body1Strong>
                  </TableHeaderCell>

                  <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                    onClick={() => handleSort("RelievingDate")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-600">
                        Relieving Date
                      </Body1Strong>
                      {sortConfig?.key === "RelievingDate" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4" />
                        ))}
                    </div>
                  </TableHeaderCell>

                  <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                  >
                    <Body1Strong className="text-gray-600">Status</Body1Strong>
                  </TableHeaderCell>

                  <TableHeaderCell
                    style={{ padding: "15px 5px" }}
                    className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                  >
                    <Body1Strong className="text-gray-600">Actions</Body1Strong>
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedExits.map((exit) => {
                  const currentStatus = exit.Status;
                  return (
                    <TableRow
                      key={exit.ID}
                      className="group hover:bg-gradient-to-r hover:from-blue-25 hover:to-indigo-25 transition-all duration-200 border-b border-gray-50 hover:shadow-sm"
                    >
                      {/* <TableCell>
                        <Badge
                          appearance="tint"
                          className="
                          !text-[#007ED5]
                          !text-xs
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
                          {exit.ExitID}
                        </Badge>
                      </TableCell> */}

                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={exit.Name} size={32} color="colorful" />
                          <div>
                            <Body1 className="!font-semibold !text-[#007ED5] !text-xs">
                              {exit.Name}
                            </Body1>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Text className="text-gray-600">{exit.GroupName}</Text>
                      </TableCell>

                      <TableCell>
                        <Text size={200} className="text-gray-600">
                          {exit.WorkLocation}
                        </Text>
                      </TableCell>

                      <TableCell>
                        <Text className="!text-xs">
                          <Calendar20Regular /> {formatDate(exit.RelievingDate)}
                        </Text>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${currentStatus === "Completed"
                                ? "bg-green-400"
                                : currentStatus === "Pending"
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                              }`}
                          />
                          <Text
                            className={`px-3 py-1 !text-xs ${getStatusBadge(
                              currentStatus
                            )}`}
                          >
                            {currentStatus}
                          </Text>
                        </div>
                      </TableCell>

                      <TableCell>
                        <FluentProvider
                          style={{ background: "transparent" }}
                          className="flex gap-2 items-center"
                        >
                          <Tooltip content="View Details" relationship="label">
                            <Button
                              appearance="subtle"
                              icon={<Eye20Regular />}
                              onClick={() => navigate(`/offboard/${exit.ID}`)}
                            />
                          </Tooltip>

                          <Tooltip
                            content={
                              !canEditOffboarding
                                ? "You don't have permission to lock/unlock"
                                : isLockDisabled(exit)
                                  ? "Cannot lock completed offboarding"
                                  : currentStatus === "Locked"
                                    ? "Unlock offboarding"
                                    : "Lock offboarding"
                            }
                            relationship="label"
                          >
                            <Button
                              appearance="subtle"
                              icon={
                                currentStatus === "Locked" ? (
                                  <LockClosedRegular className="text-red-600" />
                                ) : (
                                  <LockOpenRegular className="text-red-600" />
                                )
                              }
                              onClick={() => handleLockToggle(exit)}
                              disabled={
                                isProcessing ||
                                isLockDisabled(exit) ||
                                !canEditOffboarding
                              }
                            />
                          </Tooltip>

                          {(canEditOffboarding || canDeleteOffboarding) && (
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
                                  {/* {canEditOffboarding && (
                                    <MenuItem
                                      icon={<EditRegular />}
                                      onClick={() =>
                                        navigate(`/offboard/${exit.ID}`)
                                      }
                                    >
                                      Edit Offboarding
                                    </MenuItem>
                                  )} */}

                                  {canDeleteOffboarding && (
                                    <MenuItem
                                      icon={<DeleteRegular />}
                                      onClick={() => {
                                        setExitToDelete(exit);
                                        setDeleteDialogOpen(true);
                                      }}
                                      disabled={exit.Status === "Completed"}
                                    >
                                      Delete Offboarding
                                    </MenuItem>
                                  )}

                                  <MenuItem
                                    icon={<ApprovalsApp20Regular />}
                                    onClick={() => {
                                      setSelectedExit(exit);
                                      setIsDrawerOpen(true);
                                    }}
                                  >
                                    View Process Details
                                  </MenuItem>
                                </MenuList>
                              </MenuPopover>
                            </Menu>
                          )}
                        </FluentProvider>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Empty State */}
          {paginatedExits.length === 0 && !isLoading && (
            <div className="text-center py-20 flex flex-col items-center bg-gradient-to-b from-gray-50 to-white">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <PersonRegular className="w-10 h-10 text-blue-600" />
              </div>
              <Subtitle2 className="mb-3 text-gray-700">
                No offboarding found
              </Subtitle2>
              <div className="text-center">
                <Body1 className="text-gray-500 max-w-md mx-auto leading-relaxed">
                  {searchQuery ||
                    statusFilter !== "all" ||
                    departmentFilter !== "all" ||
                    locationFilter !== "all"
                    ? "We couldn't find any offboarding matching your criteria. Try adjusting your search or filters to see more results."
                    : "There are no employee offboarding to display at the moment."}
                </Body1>
              </div>
              {(searchQuery ||
                statusFilter !== "all" ||
                departmentFilter !== "all" ||
                locationFilter !== "all") && (
                  <Button
                    appearance="primary"
                    onClick={clearFilters}
                    className="mt-4 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 !mt-2"
                  >
                    Clear All Filters
                  </Button>
                )}
            </div>
          )}

          {/* Pagination Footer */}
          {paginatedExits.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-100 px-4 py-3">
              <div className="flex items-center justify-between">
                <Caption1 className="text-gray-600 font-medium">
                  Showing{" "}
                  {filteredExits.length > 0
                    ? (pagination.currentPage - 1) * pagination.pageSize + 1
                    : 0}{" "}
                  to{" "}
                  {Math.min(
                    pagination.currentPage * pagination.pageSize,
                    filteredExits.length
                  )}{" "}
                  of {filteredExits.length} filtered results
                  {filteredExits.length !== stats.total &&
                    ` (${stats.total} total)`}
                </Caption1>
                <div className="flex gap-2">
                  <Button
                    appearance="subtle"
                    disabled={pagination.currentPage === 1}
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Text className="px-3 py-2">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </Text>
                  <Button
                    appearance="subtle"
                    disabled={pagination.currentPage === pagination.totalPages}
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </FluentProvider>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(_, data) => setDeleteDialogOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete Offboarding Record</DialogTitle>
            <DialogContent>
              <MessageBar intent="warning">
                <MessageBarBody>
                  <MessageBarTitle>Warning</MessageBarTitle>
                  Are you sure you want to delete the offboarding record for{" "}
                  <strong>{exitToDelete?.Name}</strong> ({exitToDelete?.ExitID}
                  )? This action cannot be undone.
                </MessageBarBody>
              </MessageBar>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                disabled={isDeleting}
                onClick={handleDelete}
                style={{ backgroundColor: "#DC2626" }}
              >
                {isDeleting ? <Spinner size="tiny" /> : "Delete"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <Drawer
        open={isDrawerOpen}
        onOpenChange={(_, { open }) => !open && handleCloseDrawer()}
        position="end"
        size="large"
        className="!rounded-l-xl"
      >
        <DrawerHeader className="!bg-[#FFF] border-b-1 border-b-[#E5E7EB] ">
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<Dismiss20Regular />}
                onClick={handleCloseDrawer}
              />
            }
          >
            <div>
              <Persona
                name={selectedExit?.Name}
                primaryText={selectedExit?.Name}
                textAlignment="center"
                className="!font-semibold"
                size="extra-large"
              />
              {/* <Subtitle2 className="text-gray-800 mb-2">
                {selectedExit?.Name}
              </Subtitle2> */}
              {/* <div className="flex flex-wrap gap-2 ">
                <Badge appearance="outline" color="brand">
                  {selectedExit?.ExitID}
                </Badge>
              </div> */}
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody>
          {selectedExit && (
            <div className="p-4">
              <div className="mb-6">
                {/* <Subtitle2 className="text-gray-800 mb-2">
                  {selectedExit.Name}
                </Subtitle2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge appearance="outline" color="brand">
                    {selectedExit.ExitID}
                  </Badge>
                  <Badge
                    className={`${getStatusBadge(selectedExit.Status)} px-3 py-1`}
                  >
                    {selectedExit.Status}
                  </Badge>
                </div> */}

                {/* Stepper component */}
                {/* <VerticalCustomStepper data={selectedExit} /> */}

                <VerticalCustomStepper
                  data={selectedExit}
                  remainderNotifications={remainderNotifications}
                  setRemainderNotifications={setRemainderNotifications}
                />

                {/* Additional Offboarding information */}
                {/* <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <Subtitle2 className="mb-3">Employee Information</Subtitle2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Text
                        size={200}
                        weight="semibold"
                        className="text-gray-600"
                      >
                        Designation
                      </Text>
                      <Text size={300}>{selectedExit.Designation}</Text>
                    </div>
                    <div>
                      <Text
                        size={200}
                        weight="semibold"
                        className="text-gray-600"
                      >
                        Department
                      </Text>
                      <Text size={300}>{selectedExit.GroupName}</Text>
                    </div>
                    <div>
                      <Text
                        size={200}
                        weight="semibold"
                        className="text-gray-600"
                      >
                        Work Location
                      </Text>
                      <Text size={300}>{selectedExit.WorkLocation}</Text>
                    </div>
                    <div>
                      <Text
                        size={200}
                        weight="semibold"
                        className="text-gray-600"
                      >
                        Relieving Date
                      </Text>
                      <Text size={300}>
                        {formatDate(selectedExit.RelievingDate)}
                      </Text>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          )}
        </DrawerBody>

        <DrawerFooter>
          <div className="flex justify-end gap-2 w-full">
            <Button
              appearance="secondary"
              onClick={() => handleClearSelection()}
              className="!rounded-2xl"
              disabled={remainderNotifications.length === 0}
            >
              Clear
            </Button>
            <Button
              appearance="primary"
              onClick={() => handleProceedRemainder()}
              disabled={isProcessing || remainderNotifications.length === 0}
              className={
                isProcessing || remainderNotifications.length === 0
                  ? "!bg-gray-200 !text-gray-400 !rounded-2xl !border-0 !px-3 !py-2 !font-medium "
                  : "!bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] !text-white !rounded-2xl !border-0 !px-3 !py-2 !font-medium "
              }
            >
              <div className="flex gap-2">
                <Alert20Regular />
                Send Remainder
              </div>
            </Button>
          </div>
        </DrawerFooter>
      </Drawer>

      <Toaster toasterId={toasterId} />
    </div>
  );
};

export default EmployeeExitsDashboard;
