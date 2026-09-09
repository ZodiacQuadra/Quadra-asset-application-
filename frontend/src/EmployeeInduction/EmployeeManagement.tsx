import { useState, useEffect, useId, useRef } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Card,
  SearchBox,
  Button,
  Text,
  Body1,
  Body1Strong,
  Subtitle2,
  Caption1,
  Spinner,
  Tooltip,
  Avatar,
  CardPreview,
  Dropdown,
  Option,
  Toast,
  ToastTitle,
  Toaster,
  FluentProvider,
  useToastController,
} from "@fluentui/react-components";
import {
  EyeRegular,
  PeopleRegular,
  PersonRegular,
  BriefcaseRegular,
  People20Regular,
  PlayCircle20Regular,
  BuildingMultiple20Regular,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";
import {
  getAllEntraUsers,
  EntraADUser,
} from "../Services/EntraADUserService";
import { getCombinedDepartments } from "../Services/Department";
import { useAuth } from "../Auth/AuthProvider";
import CustomPagination from "../Recruit/Components/CustomPagination";
import CustomStatsCard from "../Recruit/Components/CustomStatsCard";

const PAGE_SIZE = 50;

const EmployeeManagement = () => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [staff, setStaff] = useState<EntraADUser[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: PAGE_SIZE,
    totalCount: 0,
    totalPages: 0,
  });

  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const notify = (message: string, intent: "success" | "error") =>
    dispatchToast(
      <Toast>
        <ToastTitle>{message}</ToastTitle>
      </Toast>,
      { intent }
    );

  // =============================================
  // Data loading — server-side pagination (50 per page)
  // =============================================
  const loadStaff = async () => {
    try {
      setIsLoading(true);
      const res = await getAllEntraUsers(
        pagination.currentPage,
        pagination.pageSize,
        searchQuery.trim() || null,
        null,
        departmentFilter === "all" ? null : departmentFilter
      );

      if (res.success && res.data) {
        setStaff(res.data.users);
        const summary = res.data.stats?.summary;
        setStats({
          totalUsers: summary?.TotalUsers ?? res.data.totalCount ?? 0,
          activeUsers: summary?.ActiveUsers ?? 0,
        });
        const count =
          res.data.filteredCount ??
          res.data.totalCount ??
          res.data.users.length;
        setPagination((prev) => ({
          ...prev,
          totalCount: count,
          totalPages: Math.max(1, Math.ceil(count / prev.pageSize)),
        }));
      } else {
        notify(res.message || "Failed to load employees", "error");
      }
    } catch (error) {
      console.error("Error loading employees:", error);
      notify("Error loading employees", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.currentPage, pagination.pageSize, searchQuery, departmentFilter]);

  // Load department options for the filter
  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await getCombinedDepartments(accessToken || "");
        if (data) setDepartmentOptions(data);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };
    loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // =============================================
  // Debounced server-side search
  // =============================================
  function debounce<T extends (...args: any[]) => void>(fn: T, delay = 500) {
    let timeoutId: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  }

  const debouncedSearch = useRef(
    debounce((value: string) => {
      setSearchQuery(value);
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    })
  ).current;

  // =============================================
  // Actions
  // =============================================
  const handleView = (member: EntraADUser) =>
    navigate(`/Induction/EmployeeManagement/preview/${member.ID}`);

  const handlePageChange = (page: number) =>
    setPagination((prev) => ({ ...prev, currentPage: page }));

  const handleItemsPerPageChange = (itemsPerPage: number) =>
    setPagination((prev) => ({
      ...prev,
      pageSize: itemsPerPage,
      currentPage: 1,
    }));

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Employees...</Body1Strong>
      </div>
    );
  }

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <div className="space-y-4 min-h-screen mx-auto">
        <div className="flex justify-between items-center">
          <Subtitle2 className="text-[#1D4586] font-bold">
            Employee Management
          </Subtitle2>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <CustomStatsCard onClick={() => {}}>
            <CardPreview className="py-[17px] px-[20px]">
              <div className="!flex flex-row items-center justify-between">
                <div className="flex flex-col gap-[11px]">
                  <Text size={300} weight="semibold" className="!text-gray-700">
                    Total Users
                  </Text>
                  <Text
                    size={600}
                    weight="semibold"
                    className="text-2xl font-bold"
                  >
                    {stats.totalUsers}
                  </Text>
                </div>
                <Avatar
                  color="brand"
                  size={36}
                  icon={
                    <div className="bg-[#E1EFFF] rounded-full p-[15px]">
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
            </CardPreview>
          </CustomStatsCard>

          {/* <CustomStatsCard onClick={() => {}}>
            <CardPreview className="py-[17px] px-[20px]">
              <div className="!flex flex-row items-center justify-between">
                <div className="flex flex-col gap-[11px]">
                  <Text size={300} weight="semibold" className="!text-gray-700">
                    Active Users
                  </Text>
                  <Text
                    size={600}
                    weight="semibold"
                    className="text-2xl font-bold"
                  >
                    {stats.activeUsers}
                  </Text>
                </div>
                <Avatar
                  color="seafoam"
                  size={36}
                  icon={
                    <div className="bg-[#dafac5] rounded-full p-[15px]">
                      <PlayCircle20Regular
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
            </CardPreview>
          </CustomStatsCard> */}

          <CustomStatsCard onClick={() => {}}>
            <CardPreview className="py-[17px] px-[20px]">
              <div className="!flex flex-row items-center justify-between">
                <div className="flex flex-col gap-[11px]">
                  <Text size={300} weight="semibold" className="!text-gray-700">
                    Departments
                  </Text>
                  <Text
                    size={600}
                    weight="semibold"
                    className="text-2xl font-bold"
                  >
                    {departmentOptions.length}
                  </Text>
                </div>
                <Avatar
                  color="colorful"
                  size={36}
                  icon={
                    <div className="bg-[#F1E8FF] rounded-full p-[15px]">
                      <BuildingMultiple20Regular
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
            </CardPreview>
          </CustomStatsCard>
        </div>

        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[200px]">
                <SearchBox
                  placeholder="Search by name, job role, department, or manager..."
                  value={searchInput}
                  onChange={(_, data) => {
                    setSearchInput(data.value);
                    debouncedSearch(data.value);
                  }}
                  className="!w-full !max-w-full !min-w-0"
                />
              </div>
              <Dropdown
                placeholder="All Departments"
                value={
                  departmentFilter === "all"
                    ? "All Departments"
                    : departmentFilter
                }
                selectedOptions={[departmentFilter]}
                onOptionSelect={(_, data) => {
                  setDepartmentFilter(data.optionValue || "all");
                  setPagination((prev) => ({ ...prev, currentPage: 1 }));
                }}
                className="!min-w-[180px] !max-w-[220px]"
              >
                <Option value="all">All Departments</Option>
                {departmentOptions.map((dept) => (
                  <Option key={dept.Id} value={dept.Name}>
                    {dept.Name}
                  </Option>
                ))}
              </Dropdown>
            </div>

            <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
              <Table className="w-full">
                <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                  <TableRow className="border-b-2 border-gray-100">
                    <TableHeaderCell style={{ padding: "15px 5px" }}>
                      <Body1Strong>Display Name</Body1Strong>
                    </TableHeaderCell>
                    <TableHeaderCell style={{ padding: "15px 5px" }}>
                      <Body1Strong>Job Role</Body1Strong>
                    </TableHeaderCell>
                    <TableHeaderCell style={{ padding: "15px 5px" }}>
                      <Body1Strong>Department</Body1Strong>
                    </TableHeaderCell>
                    <TableHeaderCell style={{ padding: "15px 5px" }}>
                      <Body1Strong>Manager</Body1Strong>
                    </TableHeaderCell>
                    <TableHeaderCell style={{ padding: "15px 5px" }}>
                      <Body1Strong>Actions</Body1Strong>
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {staff.map((member) => (
                    <TableRow
                      key={member.ID}
                      className="group hover:bg-blue-25 transition-all duration-200 border-b border-gray-50 hover:shadow-sm"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar
                            name={member.DisplayName}
                            size={32}
                            color="colorful"
                          />
                          <Body1 className="!font-semibold !text-[#007ED5] !text-xs">
                            {member.DisplayName}
                          </Body1>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <BriefcaseRegular className="w-4 h-4 text-blue-600" />
                          <Text className="!text-xs text-gray-900">
                            {member.JobTitle || "—"}
                          </Text>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PeopleRegular className="w-4 h-4 text-blue-600" />
                          <Text className="!text-xs text-gray-900">
                            {member.Department || "—"}
                          </Text>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PersonRegular className="w-4 h-4 text-[#0153A5]" />
                          <Text className="!text-xs text-gray-900">
                            {member.ManagerDisplayName || "—"}
                          </Text>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Tooltip content="View Details" relationship="label">
                            <Button
                              appearance="subtle"
                              icon={<EyeRegular />}
                              size="small"
                              onClick={() => handleView(member)}
                            />
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {staff.length === 0 && !isLoading && (
              <div className="text-center py-20 flex flex-col items-center bg-gradient-to-b from-gray-50 to-white">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <PeopleRegular className="w-10 h-10 text-blue-600" />
                </div>
                <Subtitle2 className="mb-3 text-gray-700">
                  No employees found
                </Subtitle2>
                <Body1 className="text-gray-500 max-w-md mx-auto leading-relaxed">
                  {searchQuery
                    ? "We couldn't find any employees matching your search. Try adjusting your search."
                    : "There are no employee records to display at the moment."}
                </Body1>
              </div>
            )}

            {staff.length > 0 && (
              <div className="bg-gray-50 border-t border-gray-100 px-2">
                <div className="flex items-center justify-between">
                  <Caption1 className="text-gray-600 font-medium">
                    Showing{" "}
                    {(pagination.currentPage - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.pageSize,
                      pagination.totalCount
                    )}{" "}
                    of {pagination.totalCount} employees
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
          </div>
        </Card>
      </div>

      <Toaster toasterId={toasterId} />
    </FluentProvider>
  );
};

export default EmployeeManagement;
