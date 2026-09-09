import {
  Card,
  CardHeader,
  Button,
  SearchBox,
  Badge,
  Text,
  Subtitle2,
  Caption1,
  Spinner,
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
  Body1Strong,
  Body1,
  FluentProvider,
} from "@fluentui/react-components";
import {
  Building20Regular,
  Add20Regular,
  Edit20Regular,
  Delete20Regular,
  Location48Regular,
  ErrorCircle20Regular,
  CheckmarkCircle20Regular,
  ChevronUpRegular,
  ChevronDownRegular,
  CalendarRegular,
} from "@fluentui/react-icons";
import React, { useState, useEffect } from "react";
import {
  AppDepartment,
  DepartmentFormData,
  getAppDepartments,
  createAppDepartment,
  updateAppDepartment,
  deleteAppDepartment,
} from "../../../Services/Department";
import DepartmentForm from "./DepartmentForm";
import { useAuth } from "../../../Auth/AuthProvider";

interface SortConfig {
  key: keyof AppDepartment;
  direction: "asc" | "desc";
}

const AppDepartments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDepartmentForm, setShowDepartmentForm] = useState<boolean>(false);
  const [
    editingDepartment,
    setEditingDepartment,
  ] = useState<AppDepartment | null>(null);
  const [departments, setDepartments] = useState<AppDepartment[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { currentUser, accessToken }: any = useAuth();

  // Toast controller
  const { dispatchToast } = useToastController();

  // Fetch departments on component mount
  useEffect(() => {
    fetchDepartments();
  }, []);

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

  const fetchDepartments = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const data = await getAppDepartments(accessToken);
      setDepartments(data);
    } catch (err) {
      showToast("error", "Error", "Unable to fetch departments.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (department: AppDepartment): void => {
    // Transform AppDepartment to DepartmentFormData format
    const formData: DepartmentFormData = {
      name: department.Name,
      description: department.Description,
      status: department.Status,
    };

    setEditingDepartment(department);
    setShowDepartmentForm(true);
  };

  const handleDelete = async (departmentId: string): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }

    setDeletingId(departmentId);

    try {
      await deleteAppDepartment(departmentId, currentUser.userID, accessToken);
      setDepartments(departments.filter((dept) => dept.Id !== departmentId));
      showToast("success", "Success", "Department deleted successfully");
    } catch (err) {
      showToast("error", "Error", "Unable to delete the department.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleFormClose = (): void => {
    setShowDepartmentForm(false);
    setEditingDepartment(null);
  };

  const handleSave = async (
    departmentData: DepartmentFormData
  ): Promise<void> => {
    if (editingDepartment) {
      // Update existing department
      setIsUpdating(true);

      try {
        const updatedDepartment = await updateAppDepartment(
          editingDepartment.Id,
          departmentData,
          currentUser.userID,
          accessToken
        );

        setDepartments(
          departments.map((dept) =>
            dept.Id === editingDepartment.Id ? updatedDepartment : dept
          )
        );

        showToast("success", "Success", "Department updated successfully");
        handleFormClose();
      } catch (err) {
        showToast("error", "Error", "Unable to update the department.");
      } finally {
        setIsUpdating(false);
      }
    } else {
      // Create new department
      setIsCreating(true);

      try {
        const newDepartment = await createAppDepartment(
          departmentData,
          currentUser.userID,
          accessToken
        );
        setDepartments([...departments, newDepartment]);
        showToast("success", "Success", "Department created successfully");
        handleFormClose();
      } catch (err) {
        showToast("error", "Error", "Unable to create the department.");
      } finally {
        setIsCreating(false);
      }
    }
  };

  const handleSort = (key: keyof AppDepartment) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Filter departments based on search term
  const filteredDepartments = departments.filter(
    (department) =>
      department.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      department.Description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSortedDepartments = () => {
    if (!sortConfig) return filteredDepartments;

    return [...filteredDepartments].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const getStatusBadgeAppearance: any = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return { appearance: "filled" as const, color: "success" as const };
      case "inactive":
        return { appearance: "outline" as const, color: "warning" as const };
      default:
        return { appearance: "outline" as const, color: "neutral" as const };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get sorted departments
  const sortedDepartments = getSortedDepartments();

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        <Toaster />
        <div className="flex items-center justify-center py-8">
          <Spinner />
          <Text className="ml-2">Loading departments...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 py-4">
      <Toaster />

      {/* Header Actions */}
      <div className="flex items-center justify-between w-full">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Subtitle2>
              Application Managed Departments &nbsp; (
              {filteredDepartments.length})
            </Subtitle2>
          </div>
          <Caption1 className="text-gray-600">
            Departments that can be added, edited, and deleted within this
            application
          </Caption1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            appearance="primary"
            onClick={() => setShowDepartmentForm(true)}
            className="bg-purple-600 hover:bg-purple-700"
            icon={<Add20Regular />}
          >
            Add Department
          </Button>
        </div>
      </div>

      <div className="gap-4 flex justify-end align-baseline">
        <div>
          <SearchBox
            placeholder="Search by Name or Description..."
            value={searchTerm}
            onChange={(e: any) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {/* Table */}
      <FluentProvider style={{ background: "transparent" }}>
        <Card className="shadow-lg rounded-xl border-0 overflow-hidden bg-white">
          <div className="max-h-96 overflow-auto">
            <Table sortable className="w-full">
              <TableHeader className="sticky top-0 z-10 bg-white border-b border-gray-200">
                <TableRow className="bg-gray-50/80 backdrop-blur-sm">
                  <TableHeaderCell
                    className="cursor-pointer hover:bg-gray-100/80 transition-colors px-6 py-4"
                    onClick={() => handleSort("Name")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-700">
                        Department
                      </Body1Strong>
                      {sortConfig?.key === "Name" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                        ))}
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell
                    className="cursor-pointer hover:bg-gray-100/80 transition-colors px-6 py-4"
                    onClick={() => handleSort("Status")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-700">
                        Status
                      </Body1Strong>
                      {sortConfig?.key === "Status" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                        ))}
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className="px-6 py-4">
                    <Body1Strong className="text-gray-700">
                      Description
                    </Body1Strong>
                  </TableHeaderCell>
                  <TableHeaderCell
                    className="cursor-pointer hover:bg-gray-100/80 transition-colors px-6 py-4"
                    onClick={() => handleSort("CreatedAt")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-700">
                        Created
                      </Body1Strong>
                      {sortConfig?.key === "CreatedAt" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                        ))}
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell
                    className="cursor-pointer hover:bg-gray-100/80 transition-colors px-6 py-4"
                    onClick={() => handleSort("UpdatedAt")}
                  >
                    <div className="flex items-center gap-2">
                      <Body1Strong className="text-gray-700">
                        Updated
                      </Body1Strong>
                      {sortConfig?.key === "UpdatedAt" &&
                        (sortConfig.direction === "asc" ? (
                          <ChevronUpRegular className="w-4 h-4 text-purple-600" />
                        ) : (
                          <ChevronDownRegular className="w-4 h-4 text-purple-600" />
                        ))}
                    </div>
                  </TableHeaderCell>
                  <TableHeaderCell className="px-6 py-4">
                    <Body1Strong className="text-gray-700">Actions</Body1Strong>
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDepartments.map((department, index) => (
                  <TableRow
                    key={department.Id}
                    className={`hover:bg-purple-50/50 transition-all duration-200 border-b border-gray-100 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                    }`}
                  >
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building20Regular className="text-purple-600" />
                        <Body1Strong>{department.Name}</Body1Strong>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Badge
                        {...getStatusBadgeAppearance(department.Status)}
                        className="font-medium"
                      >
                        {department.Status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <Text
                        size={300}
                        className="text-gray-600 max-w-48 truncate"
                      >
                        {department.Description || "No description"}
                      </Text>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarRegular className="w-4 h-4 text-gray-400" />
                        <Text size={200} className="text-gray-600">
                          {formatDate(department.CreatedAt)}
                        </Text>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarRegular className="w-4 h-4 text-gray-400" />
                        <Text size={200} className="text-gray-600">
                          {formatDate(department.UpdatedAt)}
                        </Text>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          appearance="subtle"
                          onClick={() => handleEdit(department)}
                          icon={<Edit20Regular />}
                          className="w-8 h-8 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 rounded-lg"
                          disabled={isUpdating || deletingId === department.Id}
                        />
                        <Button
                          appearance="subtle"
                          onClick={() => handleDelete(department.Id)}
                          icon={
                            deletingId === department.Id ? (
                              <Spinner size="tiny" />
                            ) : (
                              <Delete20Regular />
                            )
                          }
                          className="w-8 h-8 hover:bg-red-100 hover:text-red-700 transition-all duration-200 rounded-lg"
                          disabled={isUpdating || deletingId === department.Id}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Footer Section */}
          {filteredDepartments.length > 0 && (
            <div className="border-t border-gray-200 px-2 py-4">
              <div className="flex items-center justify-between">
                <Caption1 className="text-gray-700 font-semibold">
                  Showing {filteredDepartments.length} departments
                </Caption1>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredDepartments.length === 0 && (
            <div className="text-center py-20 flex flex-col items-center bg-gradient-to-br from-gray-50 to-white">
              <div className="bg-gray-100 rounded-full p-6 mb-6">
                <Building20Regular className="w-16 h-16 text-gray-400" />
              </div>
              <Subtitle2 className="mb-3 text-gray-700 font-semibold">
                No departments found
              </Subtitle2>
              <div className="flex flex-col items-center justify-center text-center">
                <div className="text-gray-500 max-w-md leading-relaxed">
                  {searchTerm
                    ? "Try adjusting your search criteria."
                    : "Get started by creating a new department."}
                </div>
              </div>
              {!searchTerm && (
                <Button
                  appearance="primary"
                  onClick={() => setShowDepartmentForm(true)}
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                  icon={<Add20Regular />}
                >
                  Add Your First Department
                </Button>
              )}
            </div>
          )}
        </Card>
      </FluentProvider>

      {/* Department Form Modal */}
      {/* {showDepartmentForm && (
        <DepartmentForm
          isOpen={showDepartmentForm}
          onClose={handleFormClose}
          department={
            editingDepartment
              ? {
                  name: editingDepartment.Name,
                  description: editingDepartment.Description,
                  status: editingDepartment.Status,
                }
              : null
          }
          onSave={handleSave}
          isLoading={isCreating || isUpdating}
        />
      )} */}
    </div>
  );
};

export default AppDepartments;
