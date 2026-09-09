import React, { useState, useEffect } from "react";
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
  Persona,
  Body1,
  FluentProvider,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  Divider,
  Avatar,
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
  Info20Regular,
  Calendar20Regular,
  Dismiss24Regular,
  MoreHorizontal20Regular,
} from "@fluentui/react-icons";
import CustomStatsCard from "../../Recruit/Components/CustomStatsCard";

import { useAuth } from "../../Auth/AuthProvider";
import CustomPagination from "../../Recruit/Components/CustomPagination"; // Import CustomPagination component
import { useNavigate } from "react-router-dom";
import { getFinanceDashboardExits } from "../../Services/Offboarding";
import VerticalCustomStepper from "../Component/VerticalCustomStepper";

// Types
export interface EmployeeExit {
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
  ROWVERSION?: {
    type: string;
    data: number[];
  };
  ManagerUserIDDetails?: UserDetails;
  CreatedByUserIDDetails?: UserDetails;
  HeadUserIDDetails?: UserDetails;
  ITUserIDDetails?: UserDetails;
  AdminUserIDDetails?: UserDetails;
  HrUserIDDetails?: UserDetails;
  FinanceUserIDDetails?: UserDetails;
  ActivitiesCount?: number;
}

export interface UserDetails {
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

const EmployeeExitsDashboard = () => {
  const [allExits, setAllExits] = useState<EmployeeExit[]>([]);
  const [filteredExits, setFilteredExits] = useState<EmployeeExit[]>([]);
  const [paginatedExits, setPaginatedExits] = useState<EmployeeExit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const { currentUser, accessToken }: any = useAuth();
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{
    key: keyof EmployeeExit;
    direction: "asc" | "desc";
  } | null>({ key: "CreatedAt", direction: "desc" });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 0,
  });

  const [stats, setStats] = useState<ExitStats>({
    total: 0,
    pending: 0,
    locked: 0,
    completed: 0,
  });

  // Get unique values for filters
  const uniqueDepartments = Array.from(
    new Set(allExits.map((exit) => exit.GroupName).filter(Boolean))
  ).sort();

  const uniqueLocations = Array.from(
    new Set(allExits.map((exit) => exit.WorkLocation).filter(Boolean))
  ).sort();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedExit, setSelectedExit] = useState<EmployeeExit | null>(null);
  const handleInfoClick = (exit: EmployeeExit) => {
    setSelectedExit(exit);
    setIsDrawerOpen(true);
  };
  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedExit(null);
  };

  // API call based on dashboard type
  const loadExits = async () => {
    try {
      setIsLoading(true);

      const response = await getFinanceDashboardExits(accessToken);

      if (response.data) {
        setAllExits(response.data);
        calculateStats(response.data);
      }
    } catch (error) {
      console.error("Error loading Offboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics based on dashboard type
  const calculateStats = (data: EmployeeExit[]) => {
    const stats = {
      total: data.length,
      pending: data.filter(
        (exit: EmployeeExit) =>
          exit.FinanceStatus === "Pending" && exit.HRStatus === "Completed"
      ).length,
      locked: data.filter(
        (exit: EmployeeExit) => exit.FinanceStatus === "Locked"
      ).length,
      completed: data.filter(
        (exit: EmployeeExit) => exit.FinanceStatus === "Completed"
      ).length,
    };

    setStats(stats);
  };

  // Client-side filtering
  useEffect(() => {
    let filtered = [...allExits];

    // Search filter
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
          exit.ManagerUserIDDetails?.displayName,
        ];
        return searchableFields.some(
          (field) => field && field.toString().toLowerCase().includes(query)
        );
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((exit) => exit.FinanceStatus === statusFilter);
    }

    // Department filter
    if (departmentFilter !== "all") {
      filtered = filtered.filter((exit) => exit.GroupName === departmentFilter);
    }

    // Location filter
    if (locationFilter !== "all") {
      filtered = filtered.filter(
        (exit) => exit.WorkLocation === locationFilter
      );
    }

    // Sorting
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
  }, []);

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // const getStatusBadge = (status: string) => {
  //   switch (status) {
  //     case "Completed":
  //       return { appearance: "filled" as const, color: "success" as const };

  //     case "Pending":
  //       return { appearance: "filled" as const, color: "important" as const };
  //     default:
  //       return {
  //         appearance: "outline" as const,
  //         color: "informative" as const,
  //       };
  //   }
  // };

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-500";
      case "locked":
        return "text-blue-500";
      case "pending":
        return "text-red-500";
      default:
        return "text-gray-500";
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

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setLocationFilter("all");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleViewDetails = (id: string) => {
    navigate(`/offboard/FinanceClearance/${id}`);
  };

  const handleStatusCardClick = (status: string) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const isStatusCardActive = (status: string) => {
    return statusFilter === status;
  };

  // Pagination handlers
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

  return (
    <div className="space-y-4 min-h-screen mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Subtitle2 className="text-[#902D0F] font-bold">
            Finance Department - Employee Offboarding
          </Subtitle2>
          {/* <div>
            <Caption1 className="text-gray-600">
              Manage final settlements and clearances
            </Caption1>
          </div> */}
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

      {/* Search and Filters */}
      <FluentProvider
        style={{ background: "transparent" }}
        className="flex gap-4 items-end"
      >
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white">
          <div className="overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex flex-col gap-4">
            <div className="flex justify-between items-center gap-[3%] w-[100%]">
              <div className="flex col-span-6 xs:col-span-12 !w-[40%]">
                <SearchBox
                  placeholder="Search by Offboarding ID, name, email, designation..."
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
                <TableRow className="border-b-2 border-gray-100 ">
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
                      Employee
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
                    <Body1Strong className="text-gray-600">Manager</Body1Strong>
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
                  const currentStatus = exit.FinanceStatus;
                  return (
                    <TableRow
                      key={exit.ID}
                      className="group hover:bg-blue-25 transition-all border-b border-gray-50"
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
                          <Avatar
                            name={`${exit.Name}`}
                            size={32}
                            color="colorful"
                          />
                          <div>
                            <Body1 className="!font-semibold !text-[#007ED5] !text-xs">
                              {exit.Name}
                            </Body1>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Text className="font-medium !text-xs">
                          {exit.GroupName}
                        </Text>
                      </TableCell>

                      <TableCell>
                        <Text className="text-gray-600 !text-xs">
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
                          {/* <Badge
                            {...getStatusBadge(currentStatus)}
                            className="px-3 py-1"
                          >
                            {currentStatus}
                          </Badge> */}
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
                        {exit.ManagerUserIDDetails ? (
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={`${exit.ManagerUserIDDetails.displayName}`}
                              size={32}
                              color="colorful"
                            />
                            <div>
                              <Body1 className="!font-semibold !text-[#007ED5] !text-xs">
                                {exit.ManagerUserIDDetails.displayName}
                              </Body1>
                            </div>
                          </div>
                        ) : (
                          <Text className="text-gray-400">Not assigned</Text>
                        )}
                      </TableCell>

                      <TableCell>
                        <FluentProvider
                          style={{ background: "transparent" }}
                          className="flex gap-2"
                        >
                          <Tooltip content="View Details" relationship="label">
                            <Eye20Regular
                              onClick={() => handleViewDetails(exit.ID)}
                            />
                          </Tooltip>

                          <Tooltip content="View Info" relationship="label">
                            <MoreHorizontal20Regular
                              onClick={() => handleInfoClick(exit)}
                              className="cursor-pointer"
                            />
                          </Tooltip>
                          {/* <TeachingPopover>
                            <TeachingPopoverTrigger>
                              <Info20Regular />
                            </TeachingPopoverTrigger>
                            <TeachingPopoverSurface>
                              <TeachingPopoverHeader>
                                {exit.ExitSequence}
                              </TeachingPopoverHeader>
                              <TeachingPopoverBody
                                style={{
                                  overflow: "auto",
                                  height: "250px",
                                  overflowX: "hidden",
                                }}
                              >
                                <TeachingPopoverTitle>
                                  {exit.Name}
                                </TeachingPopoverTitle>
                                <VerticalCustomStepper data={exit} />
                              </TeachingPopoverBody>
                              <TeachingPopoverFooter primary="Got it" />
                            </TeachingPopoverSurface>
                          </TeachingPopover> */}
                        </FluentProvider>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Drawer
              position="end"
              open={isDrawerOpen}
              onOpenChange={(_, { open }) => !open && handleDrawerClose()}
              size="large"
              className="!rounded-l-xl"
            >
              <DrawerHeader className="!bg-[#FFF] border-b-1 border-b-[#E5E7EB] !pb-3">
                <DrawerHeaderTitle
                  action={
                    <Button
                      appearance="subtle"
                      aria-label="Close"
                      icon={<Dismiss24Regular />}
                      onClick={handleDrawerClose}
                    />
                  }
                >
                  <Persona
                    name={selectedExit?.Name}
                    primaryText={selectedExit?.Name}
                    textAlignment="center"
                    className="!font-semibold"
                    size="extra-large"
                  />
                </DrawerHeaderTitle>
              </DrawerHeader>

              <DrawerBody>
                {selectedExit && (
                  <div className="p-4">
                    <VerticalCustomStepper data={selectedExit} />
                  </div>
                )}
              </DrawerBody>
            </Drawer>
          </div>

          {/* Empty State */}
          {paginatedExits.length === 0 && !isLoading && (
            <div className="text-center py-20 flex flex-col items-center bg-gradient-to-b from-gray-50 to-white">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                <PersonRegular className="w-10 h-10 text-blue-600" />
              </div>
              <Subtitle2 className="mb-3 text-gray-700">
                No Offboarding found
              </Subtitle2>
              <div className="text-center">
                <Body1 className="text-gray-500 max-w-md mx-auto leading-relaxed">
                  {searchQuery ||
                    statusFilter !== "all" ||
                    departmentFilter !== "all" ||
                    locationFilter !== "all"
                    ? "We couldn't find any Offboarding matching your criteria. Try adjusting your search or filters to see more results."
                    : "There are no employee Offboarding to display at the moment."}
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

          {/* Custom Pagination Footer */}
          {paginatedExits.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-100 px-4">
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
    </div>
  );
};

// Example Usage Component
const FinanceClearanceDashboard = () => {
  return (
    <>
      <EmployeeExitsDashboard />
    </>
  );
};

export default FinanceClearanceDashboard;
