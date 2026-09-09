import React, { useState, useEffect, useId } from "react";
import {
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Switch,
  Body1Strong,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
  Toaster,
  Body1,
  Spinner,
  Field,
  Card,
  Text,
  Badge,
  Subtitle2,
  Caption1,
  FluentProvider,
  Textarea,
  SearchBox,
} from "@fluentui/react-components";
import {
  Delete20Regular,
  Add12Filled,
  Save20Regular,
  CheckmarkCircle20Regular,
  ErrorCircle20Regular,
  ChevronUpRegular,
  ChevronDownRegular,
  CalendarRegular,
  TaskListAddRegular,
  TextDescriptionRegular,
} from "@fluentui/react-icons";
import { nanoid } from "nanoid";
import { useAuth } from "../../Auth/AuthProvider";
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  Activity as APIActivity,
  ActivityStatus,
  CreateActivityData,
  UpdateActivityData,
} from "../../Services/ITActivitiesManagement";

interface Activity
  extends Omit<APIActivity, "id" | "createdByUserId" | "modifiedByUserId"> {
  id: string;
  title: string;
  description: string;
  status: ActivityStatus | undefined;
  createdByUserId?: string;
  modifiedByUserId?: string;
  createdAt: string;
  modifiedAt?: string;
  isNew?: boolean;
}

interface ActivityError {
  title?: string;
}

interface SortConfig {
  key: keyof Activity;
  direction: "asc" | "desc";
}

function ITActivitiesManagement() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: ActivityError }>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(true);
  const { accessToken, currentUser }: any = useAuth();

  useEffect(() => {
    fetchActivities();
  }, [accessToken]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      const response: any = await getActivities(
        { pageSize: 100, sortBy: "CreatedAt", sortDirection: "DESC" },
        accessToken
      );
      if (response.success && response.data) {
        const activitiesWithTimestamps = response.data.activities.map(
          (activity: any) => ({
            ...activity,
            createdByUserID: activity.createdByUserId,
            modifiedByUserID: activity.modifiedByUserId,
            createdAt: activity.createdAt || new Date().toISOString(),
            modifiedAt: activity.modifiedAt || new Date().toISOString(),
            status: activity.status || ("Active" as ActivityStatus),
          })
        );
        setActivities(activitiesWithTimestamps);
      } else {
        showToast("error", "Error fetching activities", response.message);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      showToast("error", "Error fetching activities", "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addActivity = () => {
    const newActivity: Activity = {
      id: nanoid(),
      title: "",
      description: "",
      isNew: true,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      status: "Active" as ActivityStatus,
    };
    // setActivities([...activities, newActivity]);
    setActivities([newActivity, ...activities]);
    setIsEditMode(true);
    showToast("success", "New activity added");
  };

  const showToast = (
    intent: "success" | "error" = "success",
    title: string,
    body?: string
  ) => {
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
      { intent, toastId, timeout: 5000 }
    );
  };

  const validateActivityTitle = (id: string, title: string): boolean => {
    if (!title.trim()) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: { ...prevErrors[id], title: "Activity title cannot be empty" },
      }));
      return false;
    }

    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (specialCharRegex.test(title)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: {
          ...prevErrors[id],
          title: "Special characters are not allowed in the activity title",
        },
      }));
      return false;
    }

    const isDuplicate = activities.some(
      (activity) =>
        activity.id !== id &&
        activity.title.toLowerCase() === title.toLowerCase()
    );

    if (isDuplicate) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: { ...prevErrors[id], title: "Activity title already exists" },
      }));
      return false;
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      if (newErrors[id]) {
        delete newErrors[id].title;
        if (Object.keys(newErrors[id]).length === 0) {
          delete newErrors[id];
        }
      }
      return newErrors;
    });

    return true;
  };

  const validateAllActivities = () => {
    let isValid = true;
    activities.forEach((activity) => {
      if (!validateActivityTitle(activity.id, activity.title)) {
        isValid = false;
      }
    });
    setIsFormValid(isValid);
    return isValid;
  };

  useEffect(() => {
    validateAllActivities();
  }, [activities]);

  const handleInputChange = (
    id: string,
    field: keyof Activity,
    value: string
  ) => {
    const updatedActivities = activities.map((activity) =>
      activity.id === id
        ? {
            ...activity,
            [field]: value,
            modifiedAt: new Date().toISOString(),
          }
        : activity
    );
    setActivities(updatedActivities);

    if (field === "title") {
      validateActivityTitle(id, value);
    }
  };

  const saveAllActivities = async () => {
    if (!validateAllActivities()) {
      showToast(
        "error",
        "Validation Error",
        "Please fix the errors before saving."
      );
      return;
    }

    setIsSaving(true);
    let hasErrors = false;

    for (const activity of activities) {
      try {
        if (activity.isNew) {
          const createData: CreateActivityData = {
            title: activity.title,
            description: activity.description || "",
            status: "Active" as ActivityStatus,
            createdByUserId: currentUser?.userID || "",
          };
          const response = await createActivity(createData, accessToken);
          if (!response.success) throw new Error(response.message);
        } else {
          const updateData: UpdateActivityData = {
            title: activity.title,
            description: activity.description || "",
            status: activity.status || ("Active" as ActivityStatus),
            modifiedByUserId: currentUser?.userID || "",
          };
          const response = await updateActivity(
            activity.id,
            updateData,
            accessToken
          );
          if (!response.success) throw new Error(response.message);
        }
      } catch (error) {
        showToast(
          "error",
          "Error",
          `Error saving activity "${activity.title}": ${error}`
        );
        hasErrors = true;
      }
    }

    if (!hasErrors) {
      showToast("success", "Success", "All activities saved successfully.");
    }
    await fetchActivities();
    setIsSaving(false);
    setIsEditMode(false);
  };

  const handleDeleteActivity = async (id: string) => {
    setDeletingId(id);
    const activityToDelete = activities.find((activity) => activity.id === id);

    if (activityToDelete?.isNew) {
      setActivities((prevActivities) =>
        prevActivities.filter((activity) => activity.id !== id)
      );
      showToast("success", "Success", "New activity removed successfully.");
    } else {
      try {
        const response = await deleteActivity(
          id,
          currentUser?.userID || "",
          accessToken
        );
        if (response.success) {
          await fetchActivities();
          showToast("success", "Success", "Activity deleted successfully.");
        } else {
          throw new Error(response.message);
        }
      } catch (error) {
        console.error("Error deleting activity:", error);
        showToast("error", "Error", `Error deleting activity: ${error}`);
      }
    }
    setDeletingId(null);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleSort = (key: keyof Activity) => {
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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 150);
  };

  const filteredActivities = activities.filter(
    (activity) =>
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSortedActivities = () => {
    if (!sortConfig) return filteredActivities;
    return [...filteredActivities].sort((a, b) => {
      const aValue: any = a[sortConfig.key];
      const bValue: any = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const sortedActivities = getSortedActivities();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">
          Loading IT Head Activities...
        </Body1Strong>
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
              <div className="flex items-center gap-2 mb-1">
                <Subtitle2 className="text-[#063762]">
                  IT Head Activities Management
                </Subtitle2>
              </div>
              <div>
                {" "}
                <Caption1 className="text-gray-600">
                  Manage IT head activities for your organization
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
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(_, data) => handleSearchChange(data.value)}
                />
                {isTransitioning && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse pointer-events-none rounded" />
                )}
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isEditMode}
                  onChange={toggleEditMode}
                  label={
                    <span className="text-sm font-medium">
                      {isEditMode ? "Edit Mode" : "View Mode"}
                    </span>
                  }
                />
              </div>
              <Button
                appearance="primary"
                onClick={addActivity}
                disabled={!isEditMode}
                shape="circular"
                icon={
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] flex items-center justify-center text-white">
                    <Add12Filled />
                  </div>
                }
                className="hover:bg-indigo-700 shadow !bg-white/50 !text-[#626262] border-1 !border-white"
              >
                Add Activity
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4">
            {sortedActivities.length > 0 ? (
              <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0">
                <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <Table sortable className="w-full">
                    <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                      <TableRow className="border-b-2 border-gray-100">
                        <TableHeaderCell className="!py-3 !px-6 w-16">
                          <Body1Strong className="text-gray-900">#</Body1Strong>
                        </TableHeaderCell>
                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-6"
                          onClick={() => handleSort("title")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Title
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "title" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>
                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-6"
                          onClick={() => handleSort("description")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Description
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "description" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>
                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-6"
                          onClick={() => handleSort("modifiedAt")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Updated
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "modifiedAt" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>
                        <TableHeaderCell className="!py-3 !px-6 w-20">
                          <Body1Strong className="text-gray-900">
                            Actions
                          </Body1Strong>
                        </TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedActivities.map(
                        (activity: Activity, index: number) => (
                          <TableRow
                            key={activity.id}
                            className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            } ${activity.isNew ? "bg-yellow-50/50" : ""}`}
                          >
                            <TableCell className="px-6 py-4">
                              <Badge
                                appearance="filled"
                                color={activity.isNew ? "warning" : "brand"}
                                size="medium"
                                className={`font-semibold ${
                                  activity.isNew
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {activity.isNew ? "NEW" : index + 1}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              {isEditMode ? (
                                <Field
                                  validationState={
                                    errors[activity.id]?.title
                                      ? "error"
                                      : "none"
                                  }
                                  validationMessage={errors[activity.id]?.title}
                                >
                                  <Textarea
                                    value={activity.title}
                                    onChange={(e) =>
                                      handleInputChange(
                                        activity.id,
                                        "title",
                                        e.target.value
                                      )
                                    }
                                    className="w-full"
                                  />
                                </Field>
                              ) : (
                                <Text className="text-gray-800 font-medium">
                                  {activity.title || "No title"}
                                </Text>
                              )}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              {isEditMode ? (
                                <Textarea
                                  value={activity.description}
                                  placeholder="Description"
                                  onChange={(e) =>
                                    handleInputChange(
                                      activity.id,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  className="w-full"
                                />
                              ) : (
                                <Body1>{activity.description || "-"}</Body1>
                              )}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <CalendarRegular className="w-4 h-4 text-gray-400" />
                                <Text
                                  size={200}
                                  className="text-gray-700 font-medium"
                                >
                                  {formatDate(activity.modifiedAt)}
                                </Text>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <Button
                                onClick={() =>
                                  handleDeleteActivity(activity.id)
                                }
                                icon={
                                  deletingId === activity.id ? (
                                    <Spinner size="tiny" />
                                  ) : (
                                    <Delete20Regular />
                                  )
                                }
                                disabled={
                                  !isEditMode || deletingId === activity.id
                                }
                                appearance="subtle"
                                className="w-8 h-8 hover:bg-red-100 hover:text-red-700 transition-all duration-200 rounded-lg"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Footer */}
                {sortedActivities.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-100 px-2 py-4">
                    <div className="flex items-center justify-between">
                      <Caption1 className="text-gray-600 font-medium">
                        Showing {sortedActivities.length} of {activities.length}{" "}
                        activities
                      </Caption1>
                      {isEditMode && (
                        <Button
                          icon={
                            isSaving ? (
                              <Spinner size="tiny" />
                            ) : (
                              <Save20Regular />
                            )
                          }
                          appearance="primary"
                          onClick={saveAllActivities}
                          disabled={isSaving || !isFormValid}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSaving ? "Saving..." : "Save All"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-lg shadow-sm border border-white">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <TaskListAddRegular className="w-10 h-10 text-blue-600" />
                </div>
                <Subtitle2 className="mb-3 text-gray-700">
                  No activities found
                </Subtitle2>
                <div className="text-center">
                  <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    {searchTerm
                      ? "We couldn't find any activities matching your criteria. Try adjusting your search."
                      : "Get started by creating your first IT head activity to manage your organization's IT initiatives."}
                  </Text>
                </div>
                {searchTerm ? (
                  <Button
                    appearance="primary"
                    onClick={() => setSearchTerm("")}
                    className="mt-6 px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    Clear Search
                  </Button>
                ) : (
                  <Button
                    appearance="primary"
                    onClick={addActivity}
                    className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    icon={<Add12Filled />}
                  >
                    Add Your First Activity
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </FluentProvider>
  );
}

export default ITActivitiesManagement;
