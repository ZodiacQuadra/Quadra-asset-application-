import React, { useState, useEffect, useId, useMemo, useRef } from "react";
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
  Persona,
  Toast,
  ToastTitle,
  Toaster,
  FluentProvider,
  CardPreview,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
  Avatar,
  AvatarGroup,
  AvatarGroupItem,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from "@fluentui/react-components";
import {
  FilterRegular,
  ChevronUpRegular,
  ChevronDownRegular,
  EyeRegular,
  MoreHorizontal20Regular,
  CalendarRegular,
  DeleteRegular,
  LocationRegular,
  PeopleRegular,
  CheckmarkCircle20Regular,
  DismissCircle20Regular,
  PersonAdd20Regular,
  TaskListAdd20Regular,
  Calendar20Regular,
  Warning20Regular,
  AddRegular,
} from "@fluentui/react-icons";
import { useToastController } from "@fluentui/react-components";
import { useNavigate } from "react-router-dom";
import CustomPagination from "../Recruit/Components/CustomPagination";
import CustomStatsCard from "../Recruit/Components/CustomStatsCard";
import { useAuth } from "../Auth/AuthProvider";
import axios from "axios";


interface AssignedUser{
  AssignedUserID: string;
  AssignedUserName: string
}

interface Induction {
  id: string;
  inductionCode: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  designation: string;
  location: string;
  dateOfJoining: string;
  status: string;
  userTaskStatus?: string;
  createdAt: string;
  pendingTasksCount?: number;
  TotalCount?: number;
  TaskDescription?:string;
  completedByName?:string;
  isCompleted:boolean;
  AssignedUser:AssignedUser[]
}

interface InductionsTableProps {
  refreshTrigger?: number;
}

interface InductionStats {
 
  total: number;
  pendingTasks?: number;
  completedTasks?: number;
  discontinuedTask?:number
}

const InductionsTable = ({ refreshTrigger }: InductionsTableProps) => {
  const { currentUser } = useAuth();
  const [allInductions, setAllInductions] = useState<Induction[]>([]);
  const [filteredInductions, setFilteredInductions] = useState<Induction[]>([]);
  const [paginatedInductions, setPaginatedInductions] = useState<Induction[]>(
    []
  );
  
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>("all");
  const [deleteInduction, setDeleteInduction] = useState<Induction | null>(
    null
  );
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Induction;
    direction: "asc" | "desc";
  } | null>({ key: "createdAt", direction: "desc" });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 0,
  });

  const [FetchFilter,setFetchFilter] = useState<"viewAll"|"viewMy">("viewAll")

  const [searchInput,setSearchInput] = useState("")

  const [inductionStats, setInductionStats] = useState<InductionStats>({
    
    total: 0,
    pendingTasks: 0,
    completedTasks: 0,
    discontinuedTask:0
  });

  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const canCreateInduction =
    currentUser?.permissions?.onboarding?.manage_onboarding
      ?.create_onboarding === true;

  const canEditInduction =
    currentUser?.permissions?.onboarding?.manage_onboarding?.edit_onboarding ===
    true;

  const canDeleteInduction =
    currentUser?.permissions?.onboarding?.manage_onboarding
      ?.delete_onboarding === true;

  const inductionDashboardPermission = (() => {
    if (
      currentUser?.permissions?.onboarding?.onboarding_tasks?.view_all_tasks
    ) {
      return "viewAll";
    } else if (
      currentUser?.permissions?.onboarding?.onboarding_tasks?.view_my_tasks
    ) {
      return "viewMy";
    }
    return "none";
  })();

   const isRestoringState = useRef(false);
    const hasLoadedOnce = useRef(false);

  // Restore state BEFORE first load
  // useEffect(() => {
  //   const savedState = localStorage.getItem("inductionPagination");
    
  //   if (savedState) {
  //     isRestoringState.current = true;
      
  //     // Restore all state synchronously
  //     setPagination(JSON.parse(savedState));
      
 
  //     localStorage.removeItem("inductionPagination");
  //   }
  // }, []);

  const inductionAPI = {
    getAllInductions: async (page:number,pageSize:number,statusFilter:string,searchQuery:string) => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/Induction/inductions/${page}/${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params:{
            status:statusFilter === "all"?"":statusFilter,
            searchTerm:searchQuery,
            location:locationFilter==="all"?"":locationFilter,
            department:departmentFilter === "all"?"":departmentFilter
          }
        }
      );
      return response.data;
    },
    getMyInductions: async (userId: string | undefined,page:number,pageSize:number,statusFilter:string,searchQuery:string) => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/Induction/inductions/viewmy/${userId}/${page}/${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params:{
            status:statusFilter === "all"?"":statusFilter,
            searchTerm:searchQuery,
            location:locationFilter==="all"?"":locationFilter,
            department:departmentFilter === "all"?"":departmentFilter
          }
        }
      );
      return response.data;
    },
    deleteInduction: async (
      inductionId: string,
      deletedByUserId: string | undefined
    ) => {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/Induction/induction/${inductionId}`,
        {
          data: { deletedByUserId },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      return response.data;
    },
  };

  const uniqueDepartments = Array.from(
    new Set(
      allInductions.map((induction) => induction.department).filter(Boolean)
    )
  ).sort();

  const uniqueLocations = Array.from(
    new Set(
      allInductions.map((induction) => induction.location).filter(Boolean)
    )
  ).sort();

  const loadInductions = async () => {
    try {
      setIsLoading(true);
      let result;
      // console.log("hello",currentUser.userID,pagination.currentPage,pagination.pageSize)
      switch (inductionDashboardPermission) {
        case "viewMy":
          result = await inductionAPI.getMyInductions(currentUser.userID,pagination.currentPage,pagination.pageSize,statusFilter,searchQuery);
          break;
        case "viewAll":
          result = FetchFilter === "viewAll"? await inductionAPI.getAllInductions(pagination.currentPage,pagination.pageSize,statusFilter,searchQuery) : await inductionAPI.getMyInductions(currentUser.userID,pagination.currentPage,pagination.pageSize,statusFilter,searchQuery);
          break;
        default:
          result = []
          break;
      }

      if (result.success && result.data) {
        const inductionsData = result.data.inductions || result.data;
        const paginationData={
          currentPage: result.data.currentPage ?? 1,
          pageSize: result.data.pageSize ??5,
          totalCount: result.data.totalCount,
          totalPages: result.data.totalPages,
        }
        const statsData=result.data.statsCount
        
        setAllInductions(inductionsData);

        setFilteredInductions(inductionsData);
        

        setPagination(paginationData)

        const stats: InductionStats = {
          pendingTasks: (statsData["Pending"]??0) ,
          discontinuedTask: (statsData["Discontinued"]??0 ),
          completedTasks: (statsData["Completed"]??0 ),
          total: (statsData["Pending"] ? statsData["Pending"] : 0) + 
       (statsData["Discontinued"] ? statsData["Discontinued"] : 0) + 
       (statsData["Completed"] ? statsData["Completed"] : 0)        };

        // if (inductionDashboardPermission === "viewMy") {
        //   stats.pendingTasks = inductionsData.reduce(
        //     (total: number, i: Induction) => total + (i.pendingTasksCount || 0),
        //     0
        //   );
        //   stats.completedTasks = inductionsData.filter(
        //     (i: Induction) => i.userTaskStatus === "Completed"
        //   ).length;
        // }

        setInductionStats(stats);
      } else {
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to load inductions</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      }
    } catch (error) {
      console.error("Error loading inductions:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Error loading inductions</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   let filtered = [...allInductions];

  //   if (searchQuery.trim()) {
  //     const query = searchQuery.toLowerCase().trim();
  //     filtered = filtered.filter((induction) => {
  //       const searchableFields = [
  //         induction.inductionCode,
  //         induction.employeeName,
  //         induction.employeeEmail,
  //         induction.department,
  //         induction.designation,
  //         induction.location,
  //       ];
  //       return searchableFields.some(
  //         (field) => field && field.toString().toLowerCase().includes(query)
  //       );
  //     });
  //   }



  //   if (departmentFilter !== "all") {
  //     filtered = filtered.filter(
  //       (induction) => induction.department === departmentFilter
  //     );
  //   }

  //   if (locationFilter !== "all") {
  //     filtered = filtered.filter(
  //       (induction) => induction.location === locationFilter
  //     );
  //   }

  //   if (
  //     taskStatusFilter !== "all" &&
  //     inductionDashboardPermission === "viewMy"
  //   ) {
  //     filtered = filtered.filter(
  //       (induction) => induction.userTaskStatus === taskStatusFilter
  //     );
  //   }

  //   if (sortConfig) {
  //     filtered.sort((a, b) => {
  //       const aValue = a[sortConfig.key];
  //       const bValue = b[sortConfig.key];
  //       if (aValue === null || aValue === undefined) return 1;
  //       if (bValue === null || bValue === undefined) return -1;
  //       let comparison = 0;
  //       if (
  //         sortConfig.key === "createdAt" ||
  //         sortConfig.key === "dateOfJoining"
  //       ) {
  //         comparison =
  //           new Date(aValue as string).getTime() -
  //           new Date(bValue as string).getTime();
  //       } else if (typeof aValue === "string" && typeof bValue === "string") {
  //         comparison = aValue.localeCompare(bValue);
  //       } else {
  //         comparison = String(aValue).localeCompare(String(bValue));
  //       }
  //       return sortConfig.direction === "desc" ? -comparison : comparison;
  //     });
  //   }

  //   setFilteredInductions(filtered);
   
  // }, [
  //   allInductions,
  //   searchQuery,
  //   // statusFilter,
  //   departmentFilter,
  //   locationFilter,
  //   taskStatusFilter,
  //   sortConfig,
  //   pagination.pageSize,
  //   inductionDashboardPermission,
  // ]);

  useEffect(() => {
    // Skip the first load if we're restoring state
    if (isRestoringState.current && !hasLoadedOnce.current) {
      hasLoadedOnce.current = true;
      return;
    }
    
    loadInductions();
  }, [pagination.currentPage, pagination.pageSize, statusFilter, searchQuery, locationFilter, departmentFilter,FetchFilter]);

 

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadgeAppearance = (status: boolean) => {
    switch (status) {
      case true:
        return { appearance: "ghost" as const, color: "success" as const };
      
      default:
        return { appearance: "ghost" as const, color: "important" as const };
    }
  };

  const handleSort = (key: keyof Induction) => {
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

  const handleViewDetails = (induction: Induction) => {
    navigate(`/Induction/ExistingInductionForm/${induction.id}`);
    localStorage.setItem("inductionPagination",JSON.stringify(pagination!))
  };

  const handleDeleteClick = (induction: Induction) => {
    setDeleteInduction(induction);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteInduction) return;
    try {
      setIsDeleting(true);
      const result = await inductionAPI.deleteInduction(
        deleteInduction.id,
        currentUser.userID
      );
      if (result.success) {
        dispatchToast(
          <Toast>
            <ToastTitle>Induction deleted successfully</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
        loadInductions();
      } else {
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to delete induction</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      }
    } catch (error) {
      console.error("Error deleting induction:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Error deleting induction</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setDeleteInduction(null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSearchInput("")
    setStatusFilter("all");
    setDepartmentFilter("all");
    setLocationFilter("all");
    setTaskStatusFilter("all");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // const handleStatusCardClick = (status: string) => {
  //   setStatusFilter(status === "all" ? "all" : status);
  //   setPagination((prev) => ({ ...prev, currentPage: 1 }));
  // };

    const handleStatusCardClick = (status: string) => {
    if (status === "In Progress") {
      // When clicking "In Progress" card, show both "Yet to Onboard" and "In Progress" records
      setStatusFilter("In Progress");
    } else if (status === "Yet to Onboard") {
      // When clicking "Yet to Onboard" card, show both "Yet to Onboard" and "In Progress" records
      setStatusFilter("Yet to Onboard");
    } else if (status === "all") {
      setStatusFilter("all");
    } else {
      setStatusFilter(status);
    }
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  // const isStatusCardActive = (status: string) => {
  //   return (
  //     statusFilter === status || (status === "all" && statusFilter === "all")
  //   );
  // };
    const isStatusCardActive = (status: string) => {
    if (status === "Yet to Onboard" || status === "In Progress") {
      // Both "Yet to Onboard" and "In Progress" should be active when filtering for either
      return statusFilter === "Yet to Onboard" || statusFilter === "In Progress";
    }
    return (
      statusFilter === status || (status === "all" && statusFilter === "all")
    );
  };

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: itemsPerPage,
      currentPage: 1,
      totalPages: Math.ceil(prev.totalCount / itemsPerPage),
    }));
  };

  function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}


const debouncedSearch = useRef(
  debounce((value: string) => {
    setSearchQuery(value);
  }, 500)
).current;





  const getDashboardTitle = () => {
    switch (inductionDashboardPermission) {
      case "viewMy":
        return "My Onboarding Tasks";
      case "viewAll":
        return "Onboarding Dashboard";
      default:
        return "Onboarding Dashboard";
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">
          Loading Onboarding Requests...
        </Body1Strong>
      </div>
    );
  }

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <div className="space-y-4 min-h-screen mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <Subtitle2 className="text-[#1D4586] font-bold">
              {getDashboardTitle()}
            </Subtitle2>
          </div>
          <div>

            {canCreateInduction && (
              <Button
                appearance="primary"
                size="medium"
                shape="circular"
                onClick={() => navigate("/Induction/NewInductionForm")}
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
               Initiate Onboarding
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards with CustomStatsCard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <CustomStatsCard
            style={
              isStatusCardActive("Pending") ? "!bg-white" : ""
            }
            onClick={() => handleStatusCardClick("Pending")}
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
                      Pending
                    </Text>
                  </div>
                  <div>
                    <Text
                      size={600}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      {inductionStats.pendingTasks}
                    </Text>
                  </div>
                </div>
                <div>
                  <Avatar
                    color="marigold"
                    size={36}
                    icon={
                      <div className="bg-[#faf6c5] rounded-full p-[15px]">
                        <Calendar20Regular
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
            style={
              isStatusCardActive("Completed") ? "ring-2 ring-blue-500" : ""
            }
            onClick={() => handleStatusCardClick("Completed")}
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
                      Completed
                    </Text>
                  </div>
                  <div>
                    <Text
                      size={600}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      {inductionStats.completedTasks}
                    </Text>
                  </div>
                </div>
                <div>
                  <Avatar
                    color="seafoam"
                    size={36}
                    icon={
                      <div className="bg-[#dafac5] rounded-full p-[15px]">
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
            style={
              isStatusCardActive("Discontinued") ? "ring-2 ring-blue-500" : ""
            }
            onClick={() => handleStatusCardClick("Discontinued")}
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
                      Discontinued
                    </Text>
                  </div>
                  <div>
                    <Text
                      size={600}
                      weight="semibold"
                      className="text-2xl font-bold"
                    >
                      {inductionStats.discontinuedTask}
                    </Text>
                  </div>
                </div>
                <div>
                  <Avatar
                    color="seafoam"
                    size={36}
                    icon={
                      <div className="bg-[#fad5c5] rounded-full p-[15px]">
                           <TaskListAdd20Regular
                          style={{
                            height: "30px",
                            width: "30px",
                            color: "#a81c03ff",
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
            onClick={() => handleStatusCardClick("all")}
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
                      {inductionStats.total}
                    </Text>
                  </div>
                </div>
                <div>
                  <Avatar
                    color="colorful"
                    size={36}
                    icon={
                      <div className="bg-[#F1E8FF] rounded-full p-[15px]">
                        <PersonAdd20Regular
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

        
        {statusFilter !=="all"&&
          <MessageBar shape="rounded">
        <MessageBarBody>
          <MessageBarTitle>Filter</MessageBarTitle>
          showing results for the filter <strong>{statusFilter}</strong>.
        </MessageBarBody>
      </MessageBar>
        }

        <FluentProvider
          style={{ background: "transparent" }}
          className="flex gap-4 items-end"
        >
          <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white">
            <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[200px]">
                  <SearchBox
                    placeholder="Search by onboarding code, employee name, email, department, or designation..."
                    value={searchInput}
                    onChange={(_, data) =>{
                      setSearchInput(data.value)
                       debouncedSearch(data.value)
                      }}
                    className="!w-full !max-w-full !min-w-0"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Dropdown
                    placeholder="All Departments"
                    value={departmentFilter==="all"?"All Departments":departmentFilter}
                    selectedOptions={[departmentFilter]}
                    onOptionSelect={(_, data) =>
                      setDepartmentFilter(data.optionValue || "all")
                    }
                    className="!min-w-[140px] !max-w-[180px] !text-[10px]"
                    style={{fontSize:'10px !important'}}
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
                    value={locationFilter==="all"?"All Locations":locationFilter}
                    selectedOptions={[locationFilter]}
                    onOptionSelect={(_, data) =>
                      setLocationFilter(data.optionValue || "all")
                    }
                    className="!min-w-[140px] !max-w-[180px] !text-[10px]"
                  >
                    <Option value="all">All Locations</Option>
                    {uniqueLocations.map((location) => (
                      <Option key={location} value={location}>
                        {location}
                      </Option>
                    ))}
                  </Dropdown>
                  {inductionDashboardPermission === "viewAll" && (
                    <Dropdown
                      placeholder=""
                      value={FetchFilter}
                      onOptionSelect={(_, data) =>{
                        setFetchFilter((data.optionValue as "viewAll" | "viewMy") ?? "viewAll")
                        setPagination((prev) => ({
                          ...prev,
                          currentPage: 1,
                        }));
                      }}
                      className="!min-w-[120px] !max-w-[150px] !text-[10px]"
                    >
                      <Option value="viewAll">View All</Option>
                      <Option value="viewMy">View My</Option>
                    </Dropdown>
                  )}
                  <Button
                    appearance="subtle"
                    icon={<FilterRegular />}
                    onClick={clearFilters}
                    disabled={
                      searchQuery === "" &&
                      statusFilter === "all" &&
                      departmentFilter === "all" &&
                      locationFilter === "all" &&
                      taskStatusFilter === "all"
                    }
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <Table sortable className="w-full">
                <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                  <TableRow className="border-b-2 border-gray-100">
                    {/* <TableHeaderCell
                      style={{ padding: "15px 5px" }}
                      className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                      onClick={() => handleSort("inductionCode")}
                    >
                      <div className="flex items-center gap-2">
                        <Body1Strong className="transition-colors">
                          Induction Code
                        </Body1Strong>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {sortConfig?.key === "inductionCode" &&
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
                      onClick={() => handleSort("employeeName")}
                    >
                      <div className="flex items-center gap-2">
                        <Body1Strong className="transition-colors">
                          Employee Details
                        </Body1Strong>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {sortConfig?.key === "employeeName" &&
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
                      onClick={() => handleSort("TaskDescription")}
                    >
                      <div className="flex items-center gap-2">
                        <Body1Strong className="transition-colors">
                          Task Name
                        </Body1Strong>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {sortConfig?.key === "TaskDescription" &&
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
                      onClick={() => handleSort("TaskDescription")}
                    >
                      <div className="flex items-center gap-2">
                        <Body1Strong className="transition-colors">
                          Assigned Users
                        </Body1Strong>
                        
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell
                      style={{ padding: "15px 5px" }}
                      className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                      onClick={() => handleSort("department")}
                    >
                      <div className="flex items-center gap-2">
                        <Body1Strong className="transition-colors">
                          Department
                        </Body1Strong>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {sortConfig?.key === "department" &&
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
                    >
                      <Body1Strong>Location</Body1Strong>
                    </TableHeaderCell>
                    {inductionDashboardPermission === "viewMy" && (
                      <TableHeaderCell
                        style={{ padding: "15px 5px" }}
                        className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                      >
                        <Body1Strong>My Pending Tasks</Body1Strong>
                      </TableHeaderCell>
                    )}
                    <TableHeaderCell
                      style={{ padding: "15px 5px" }}
                      className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                      onClick={() => handleSort("status")}
                    >
                      <div className="flex items-center gap-2">
                        <Body1Strong className="transition-colors">
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
                    <TableHeaderCell
                      style={{ padding: "15px 5px" }}
                      className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group"
                      onClick={() => handleSort("dateOfJoining")}
                    >
                      <div className="flex items-center gap-2">
                        <Body1Strong className="transition-colors">
                          Joining Date
                        </Body1Strong>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          {sortConfig?.key === "dateOfJoining" &&
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
                    >
                      <Body1Strong>Actions</Body1Strong>
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredInductions.map((induction) => (
                    <TableRow
                      key={induction.id}
                      className="group hover:bg-gradient-to-r hover:from-blue-25 hover:to-indigo-25 transition-all duration-200 border-b border-gray-50 hover:shadow-sm"
                    >
                      {/* <TableCell>
                        <div className="space-y-2">
                          <Badge
                            appearance="tint"
                            color="brand"
                            // className="cursor-pointer hover:scale-105 transition-transform duration-200 font-semibold px-3 py-1 rounded-lg shadow-sm"
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
                            {induction.inductionCode}
                          </Badge>
                        </div>
                      </TableCell> */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={`${induction.employeeName}`}
                            size={32}
                            color="colorful"
                          />
                          <div>
                            <Body1 className="!font-semibold !text-[#007ED5] !text-xs">
                              {induction.employeeName}
                            </Body1>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          
                          <div>
                            <Text className="!text-xs text-gray-900 ">
                              {induction.TaskDescription}
                            </Text>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-3">
                          
                          <AvatarGroup
                                 layout="stack"
                                 size={24} 
                                >
                            {
                              induction.AssignedUser?.map((item)=>(
                                <Tooltip key={item.AssignedUserName} content={item.AssignedUserName} relationship="label">
                                  <AvatarGroupItem
                                    name={item.AssignedUserName}
                                    color="colorful"
                                  />
                                </Tooltip>
                              ))
                            }
                          </AvatarGroup>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className=" rounded-lg flex items-center justify-center">
                            <PeopleRegular className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <Text className="!text-xs text-gray-900 ">
                              {induction.department}
                            </Text>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-1 rounded-lg">
                            <LocationRegular className="w-5 h-5 text-[#0153A5]" />
                            <div>
                              <Text
                                size={300}
                                className="!text-xs text-gray-900"
                              >
                                {induction.location}
                              </Text>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      {inductionDashboardPermission === "viewMy" && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {induction.status === "Cancelled" ? (
                              <>
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                <Badge
                                  appearance="ghost"
                                  color="danger"
                                  className="px-3 py-2 font-medium "
                                >
                                  Cancelled
                                </Badge>
                              </>
                            ) : induction.pendingTasksCount &&
                              induction.pendingTasksCount > 0 ? (
                              <>
                                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                                <Badge
                                  appearance="ghost"
                                  color="important"
                                  className="px-3 py-2 font-medium"
                                >
                                  {induction.pendingTasksCount} Pending
                                </Badge>
                              </>
                            ) : (
                              <>
                                <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                <Badge
                                  appearance="ghost"
                                  color="success"
                                  className="px-3 py-2 font-medium"
                                >
                                  All Complete
                                </Badge>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              induction.status==="Cancelled"?
                              "!bg-[#c90b04] animate-pulse"
                              :
                              induction.isCompleted 
                                ? "bg-[#15803D] animate-pulse"
                                :  "bg-[#A16207] animate-pulse"
                                
                            }`}
                          ></div>
                          <Badge
                            {...getStatusBadgeAppearance(induction.isCompleted)}
                            // className="px-3 py-1 font-medium shadow-sm"
                          >
                            {induction.status==="Cancelled"?"Discontinued":induction.isCompleted?"Completed":"Pending"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-1 rounded-lg">
                            <CalendarRegular className="w-4 h-4" />
                            <div>
                              <Text
                                size={300}
                                className="!text-xs text-gray-900"
                              >
                                {formatDate(induction.dateOfJoining)}
                              </Text>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 transition-all duration-200">
                          <Tooltip content="View Details" relationship="label">
                            <Button
                              appearance="subtle"
                              icon={<EyeRegular />}
                              size="small"
                              onClick={() => handleViewDetails(induction)}
                            />
                          </Tooltip>
                          {canDeleteInduction && (
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
                                    className="hover:bg-red-50 rounded-lg transition-all duration-200"
                                    onClick={() => handleDeleteClick(induction)}
                                  >
                                    <DeleteRegular className="w-4 h-4 mr-3 text-red-600" />
                                    <Text className="font-medium text-red-600">
                                      Delete Induction
                                    </Text>
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

            {filteredInductions.length === 0 && !isLoading && (
              <div className="text-center py-20 flex flex-col items-center bg-gradient-to-b from-gray-50 to-white">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <PersonAdd20Regular className="w-10 h-10 text-blue-600" />
                </div>
                <Subtitle2 className="mb-3 text-gray-700">
                  No inductions found
                </Subtitle2>
                <div className="text-center">
                  <Body1 className="text-gray-500 max-w-md mx-auto leading-relaxed flex flex-row items-center justify-center">
                    {searchQuery ||
                    statusFilter !== "all" ||
                    departmentFilter !== "all" ||
                    locationFilter !== "all" ||
                    taskStatusFilter !== "all"
                      ? "We couldn't find any inductions matching your criteria. Try adjusting your search or filters to see more results."
                      : inductionDashboardPermission === "viewMy"
                      ? "You don't have any induction tasks assigned at the moment."
                      : "There are no induction records to display at the moment. Create your first induction to get started."}
                  </Body1>
                </div>
                {(searchQuery ||
                  statusFilter !== "all" ||
                  departmentFilter !== "all" ||
                  locationFilter !== "all" ||
                  taskStatusFilter !== "all") && (
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

            {filteredInductions.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-100 px-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <Caption1 className="text-gray-600 font-medium">
                      Showing{" "}
                      {allInductions.length > 0
                        ? (pagination.currentPage - 1) * pagination.pageSize + 1
                        : 0}{" "}
                      to{" "}
                      {Math.min(
                        pagination.currentPage * pagination.pageSize,
                        pagination.totalCount
                      )}{" "}
                      {/* of {allInductions.length} filtered results */}
                      {allInductions.length !== inductionStats.total &&
                        ` (${inductionStats.total} total)`}
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
        </FluentProvider>

        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(_, data) => setIsDeleteDialogOpen(data.open)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <Warning20Regular className="text-red-600" />
                  Delete Induction{" "}
                  <Badge>
                    <Text className="font-semibold !block">
                      {deleteInduction && <>{deleteInduction.inductionCode}</>}
                    </Text>
                  </Badge>
                </div>
              </DialogTitle>
              <DialogContent>
                <div className="space-y-4">
                  <Text>
                    Are you sure you want to delete this induction? This action
                    cannot be undone.
                  </Text>
                  {deleteInduction && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="space-y-1">
                        <Persona
                          avatar={deleteInduction.employeeName}
                          name={deleteInduction.employeeName}
                          secondaryText={deleteInduction.employeeEmail}
                        ></Persona>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
              <DialogActions>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary" disabled={isDeleting}>
                    Cancel
                  </Button>
                </DialogTrigger>
                <Button
                  appearance="primary"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  icon={
                    isDeleting ? <Spinner size="tiny" /> : <DeleteRegular />
                  }
                  className="bg-red-600 hover:bg-red-700 border-red-600"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
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

export default InductionsTable;
