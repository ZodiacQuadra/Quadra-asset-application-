import {
  Card,
  Button,
  Spinner,
  SearchBox,
  Badge,
  Text,
  Switch,
  Caption1,
  Subtitle2,
  Body1Strong,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  useToastController,
  ToastIntent,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableBody,
  TableCell,
  FluentProvider,
  useId,
} from "@fluentui/react-components";
import {
  ArrowSync20Regular,
  Building20Regular,
  CheckmarkCircle20Regular,
  ErrorCircle20Regular,
  ChevronUpRegular,
  ChevronDownRegular,
  CalendarRegular,
  Edit20Regular,
  TagRegular,
  Building48Regular,
  Add12Filled,
} from "@fluentui/react-icons";
import React, { useState, useEffect } from "react";
import {
  EntraDepartment,
  getEntraDepartments,
  updateEntraDepartmentStatus,
  syncEntraDepartments,
  SyncResult,
  updateEntraDepartmentDetails,
  EntraDepartmentUpdateData,
} from "../../../Services/Department";
import { useAuth } from "../../../Auth/AuthProvider";
import DepartmentForm from "./DepartmentForm";

interface SortConfig {
  key: keyof EntraDepartment;
  direction: "asc" | "desc";
}

const EntraDepartments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [departments, setDepartments] = useState<EntraDepartment[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { accessToken }: any = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  const [showEditForm, setShowEditForm] = useState<boolean>(false);
  const [
    editingDepartment,
    setEditingDepartment,
  ] = useState<EntraDepartment | null>(null);

  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);

  // useEffect(() => {
  //   loadDepartments();
  // }, []);

  const loadDepartments = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const data = await getEntraDepartments(accessToken);
      setDepartments(data);
    } catch (error) {
      console.error("Error loading departments:", error);
      showToast(
        "error",
        "Error",
        "Failed to load departments. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (intent: ToastIntent, title: string, body?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle
          media={
            intent === "success" ? (
              <CheckmarkCircle20Regular />
            ) : (
              <ErrorCircle20Regular />
            )
          }
        >
          {title}
        </ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent, timeout: 5000 }
    );
  };

  const handleSync = async (): Promise<void> => {
    setIsSyncing(true);
    try {
      const syncResult: SyncResult = await syncEntraDepartments(accessToken);
      await loadDepartments();
      showToast(
        "success",
        "Sync Completed",
        `Processed ${syncResult.RecordsProcessed} records: ${syncResult.RecordsAdded} added, ${syncResult.RecordsUpdated} updated, ${syncResult.RecordsDeactivated} deactivated.`
      );
    } catch (error) {
      showToast("error", "Sync Failed", "Unable to sync with Entra ID.");
    } finally {
      setIsSyncing(false);
    }
  };


  useEffect(()=>{
    handleSync()
  },[])

  const handleStatusToggle = async (
    departmentId: string,
    newStatus: boolean
  ): Promise<void> => {
    setUpdatingStatusId(departmentId);
    try {
      const status: "active" | "inactive" = newStatus ? "active" : "inactive";
      const updatedDepartment = await updateEntraDepartmentStatus(
        departmentId,
        status,
        accessToken
      );
      setDepartments((prev) =>
        prev.map((dept) =>
          dept.Id === departmentId ? updatedDepartment : dept
        )
      );
      showToast("success", "Success", `Status updated to ${status}.`);
    } catch (error) {
      showToast("error", "Error", "Unable to update status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleEdit = (department: EntraDepartment) => {
    setEditingDepartment(department);
    setShowEditForm(true);
  };

  const handleFormClose = () => {
    setShowEditForm(false);
    setEditingDepartment(null);
  };

  const handleSave = async (data: EntraDepartmentUpdateData) => {
    if (!editingDepartment) return;
    setIsUpdating(true);
    try {
      const updatedDept = await updateEntraDepartmentDetails(
        editingDepartment.Id,
        data,
        accessToken
      );
      setDepartments((prev) =>
        prev.map((d) => (d.Id === updatedDept.Id ? updatedDept : d))
      );
      showToast("success", "Success", "Department details updated.");
      handleFormClose();
    } catch (err) {
      showToast("error", "Update Failed", "Failed to update department.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSort = (key: keyof EntraDepartment) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const getSortedDepartments = () => {
    if (!sortConfig) return filteredDepartments;
    return [...filteredDepartments].sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return {
          appearance: "ghost" as const,
          color: "success" as const,
          className: "bg-green-100 text-green-800 border-green-200",
          dotColor: "bg-green-500",
        };
      case "inactive":
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredDepartments = departments.filter(
    (department) =>
      department.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (department.Code &&
        department.Code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedDepartments = getSortedDepartments();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Departments...</Body1Strong>
      </div>
    );
  }

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <div className="min-h-screen">
        <Toaster toasterId={toastId} />
        <div className="mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center pb-4">
            <div>
              <Subtitle2 className="text-[#063762]">
                Quadra Departments
              </Subtitle2>
              <div>
                {" "}
                <Caption1 className="text-gray-600">
                  Synced from Entra ID. Status and local details can be edited
                  here.
                </Caption1>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
            <div className="flex items-center gap-4 w-full md:w-1/4">
              <div className="relative w-full">
                <SearchBox
                  className={`w-full transition-all duration-200 ${
                    isTransitioning
                      ? "opacity-70 scale-[0.99]"
                      : "opacity-100 scale-100"
                  } !border-1 !border-[#E5E7EB] after:!border-0 !rounded-3xl`}
                  disabled={isLoading}
                  placeholder="Search by name or code..."
                  value={searchTerm}
                  onChange={(_, data) => handleSearchChange(data.value)}
                />
                {isTransitioning && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse pointer-events-none rounded" />
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <Button
                appearance="primary"
                onClick={handleSync}
                disabled={isSyncing}
                shape="circular"
                icon={
                  isSyncing ? (
                    <Spinner size="tiny" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center text-white">
                      <ArrowSync20Regular />
                    </div>
                  )
                }
                className="hover:bg-green-700 shadow !bg-white/50 !text-[#626262] border-1 !border-white"
              >
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4">
            {sortedDepartments.length > 0 ? (
              <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0">
                <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <Table sortable className="w-full">
                    <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                      <TableRow className="border-b-2 border-gray-100">
                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-green-50 group !py-3 !px-3"
                          onClick={() => handleSort("Name")}
                        >
                          <div className="flex items-center gap-2 ml-5">
                            <Body1Strong className="text-gray-900">
                              Department
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "Name" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-green-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-green-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-green-50 group !py-3 !px-3"
                          onClick={() => handleSort("Code")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Code
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "Code" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-green-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-green-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-green-50 group !py-3 !px-3"
                          onClick={() => handleSort("Status")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Status
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "Status" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-green-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-green-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-green-50 group !py-3 !px-3"
                          onClick={() => handleSort("LastSynced")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Last Synced
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "LastSynced" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-green-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-green-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell className="!py-3 !px-3">
                          <Body1Strong className="text-gray-900">
                            Actions
                          </Body1Strong>
                        </TableHeaderCell>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {sortedDepartments.map((dept, index) => {
                        const statusColors = getStatusColor(dept.Status);
                        return (
                          <TableRow
                            key={dept.Id}
                            className={`hover:bg-green-50/50 transition-all duration-200 border-b border-gray-100 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            }`}
                          >
                            <TableCell className="px-6 !py-5">
                              <div className="flex items-center gap-3">
                                <Building20Regular className="w-5 h-5 text-green-600" />
                                <div className="space-y-1 ml-2">
                                  <Text className="font-semibold text-gray-900 leading-tight">
                                    {dept.Name}
                                  </Text>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="px-6 py-4">
                              {dept.Code ? (
                                <div className="flex items-center gap-2">
                                  <Badge
                                    appearance="outline"
                                    className="font-mono bg-blue-50 border-blue-200 text-blue-700"
                                  >
                                    {dept.Code}
                                  </Badge>
                                </div>
                              ) : (
                                <Text className="text-gray-400 italic">
                                  No code
                                </Text>
                              )}
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
                                  {dept.Status}
                                </Badge>
                              </div>
                            </TableCell>

                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <CalendarRegular className="w-4 h-4 text-gray-400" />
                                <Text
                                  size={200}
                                  className="text-gray-700 font-medium"
                                >
                                  {formatDate(dept.LastSynced)}
                                </Text>
                              </div>
                            </TableCell>

                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  appearance="subtle"
                                  icon={<Edit20Regular />}
                                  onClick={() => handleEdit(dept)}
                                  disabled={isUpdating || !!updatingStatusId}
                                  className="w-8 h-8 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 rounded-lg"
                                  aria-label={`Edit ${dept.Name}`}
                                />
                                {updatingStatusId === dept.Id && (
                                  <Spinner size="tiny" />
                                )}
                                <Switch
                                  checked={dept.Status === "active"}
                                  onChange={(ev, data) =>
                                    handleStatusToggle(dept.Id, data.checked)
                                  }
                                  disabled={
                                    isUpdating || updatingStatusId === dept.Id
                                  }
                                  aria-label={`Toggle status for ${dept.Name}`}
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Footer */}
                {sortedDepartments.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-100 px-2 py-4">
                    <div className="flex items-center justify-between">
                      <Caption1 className="text-gray-600 font-medium">
                        Showing {sortedDepartments.length} of{" "}
                        {departments.length} departments
                      </Caption1>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-lg shadow-sm border border-white">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <Building48Regular className="w-10 h-10 text-green-600" />
                </div>
                <Subtitle2 className="mb-3 text-gray-700">
                  No departments found
                </Subtitle2>
                <div className="text-center">
                  <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    {searchTerm
                      ? "We couldn't find any departments matching your criteria. Try adjusting your search."
                      : "No Entra departments are currently synced. Click 'Sync Now' to import from Entra ID."}
                  </Text>
                </div>
                {searchTerm && (
                  <Button
                    appearance="primary"
                    onClick={() => setSearchTerm("")}
                    className="mt-6 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showEditForm && (
        <DepartmentForm
          isOpen={showEditForm}
          onClose={handleFormClose}
          department={editingDepartment}
          onSave={handleSave}
          isLoading={isUpdating}
        />
      )}
    </FluentProvider>
  );
};

export default EntraDepartments;
