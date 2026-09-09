import React, { useState, useEffect, useId, useCallback, useRef } from "react";
import {
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Input,
  Switch,
  Body1Strong,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
  Toaster,
  Body1,
  Checkbox,
  Avatar,
  Dropdown,
  Spinner,
  Field,
  Card,
  Text,
  Badge,
  Subtitle2,
  Caption1,
  Popover,
  PopoverTrigger,
  PopoverSurface,
  tokens,
  makeStyles,
  FluentProvider,
  Textarea,
  SearchBox,
  Select,
  Option,
} from "@fluentui/react-components";
import {
  DismissFilled,
  Delete20Regular,
  Add12Filled,
  Save20Regular,
  CheckmarkCircle20Regular,
  ErrorCircle20Regular,
  ChevronUpRegular,
  ChevronDownRegular,
  CalendarRegular,
  TaskListAddRegular,
  PeopleRegular,
  BuildingRegular,
  ClockRegular,
  NumberSymbolRegular,
  DismissRegular,
  PersonAddRegular,
  PersonRegular,
  Search20Regular,
  TaskListAdd24Regular,
} from "@fluentui/react-icons";

import {
  createInductionTask,
  updateInductionTask,
  getInductionTasks,
  getInductionTaskById,
  deleteInductionTask,
  searchInductionTasks,
} from "../../Services/InductionTasks";
import { useAuth } from "../../Auth/AuthProvider";
import { fetchUsers } from "../../Services/GraphAPI";

interface User {
  id: string;
  displayName: string;
  email: string;
}

interface Person {
  id: string;
  displayName: string;
  email: string;
  jobTitle?: string;
  department?: string;
}

interface InductionTask {
  id: string;
  taskCode?: string;
  taskDescription: string;
  group?: string;
  assignedUsers: Person[];
  days: number;
  quantity: boolean;
  status?: string;
  isNew?: boolean;
  createdAt?: string;
  modifiedAt?: string;
  createdByUserID?: string;
  modifiedByUserID?: string;
  isConfiguration: boolean;
  configurationType: string
}

interface SortConfig {
  key: keyof InductionTask;
  direction: "asc" | "desc";
}

interface EnhancedPeoplePickerProps {
  selectedPersons: Person[];
  onPersonsChanged: (persons: Person[]) => void;
  disabled?: boolean;
  placeholder?: string;
  searchFunction: (query: string) => Promise<Person[]>;
  maxSelections?: number;
}

const useStyles = makeStyles({
  peoplePickerContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    width: "100%",
    minWidth: "280px",
  },
  selectedPersonsContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    maxHeight: "120px",
    overflowY: "auto",
    padding: "2px",
  },
  selectedPersonsGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
  },
  searchInputContainer: {
    position: "relative",
    width: "100%",
    padding: "5px",
  },
  searchInput: {
    width: "250px",
    transition: "all 0.2s ease",
    "&:focus": {
      boxShadow: `0 0 0 2px ${tokens.colorBrandBackground2}`,
    },
  },
  searchResults: {
    maxHeight: "240px",
    overflowY: "auto",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow16,
    minWidth: "300px",
  },
  personItem: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    cursor: "pointer",
    transition: "all 0.15s ease",
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    "&:hover": {
      backgroundColor: tokens.colorBrandBackground2,
      transform: "translateX(4px)",
    },
    "&:last-child": {
      borderBottom: "none",
    },
  },
  emptyState: {
    textAlign: "center",
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalM}`,
    color: tokens.colorNeutralForeground3,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalS,
  },
  loadingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingVerticalM,
    gap: tokens.spacingHorizontalS,
  },
  removeButton: {
    minWidth: "18px",
    height: "18px",
    borderRadius: "50%",
    padding: "0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    "&:hover": {
      pointer: "cursor",
    },
  },
});

const EnhancedPeoplePicker: React.FC<EnhancedPeoplePickerProps> = ({
  selectedPersons = [],
  onPersonsChanged,
  disabled = false,
  placeholder = "Search and add people...",
  searchFunction,
  maxSelections = 10,
}) => {
  const styles = useStyles();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchPeople = async (query: string) => {
    if (query.length < 2 || disabled) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await searchFunction(query);
      const filteredResults = results.filter(
        (person) =>
          !selectedPersons.some((selected) => selected.id === person.id)
      );
      setSearchResults(filteredResults);
      setIsOpen(true);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchPeople(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setIsOpen(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, selectedPersons]);

  const handlePersonSelect = (person: Person) => {
    if (selectedPersons.length >= maxSelections) return;
    const newPersons = [...selectedPersons, person];
    onPersonsChanged(newPersons);
    setSearchQuery("");
    setIsOpen(false);
    setSearchResults([]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handlePersonRemove = (personId: string) => {
    const newPersons = selectedPersons.filter((p) => p.id !== personId);
    onPersonsChanged(newPersons);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <div className={styles.peoplePickerContainer}>
      {selectedPersons.length > 0 && (
        <div className={styles.selectedPersonsContainer}>
          <div className={styles.selectedPersonsGrid}>
            {selectedPersons.map((person) => (
              <Badge appearance="tint" key={person.id} className="space-x-2">
                <Avatar
                  name={person.displayName}
                  size={16}
                  color="colorful"
                  style={{ fontSize: "8px" }}
                />
                <Text
                  size={200}
                  truncate
                  title={`${person.displayName} (${person.email})`}
                  style={{
                    maxWidth: "140px",
                    fontWeight: tokens.fontWeightMedium,
                  }}
                >
                  {person.displayName}
                </Text>
                {!disabled && (
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<DismissRegular style={{ fontSize: "20px" }} />}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePersonRemove(person.id);
                    }}
                    className={styles.removeButton}
                    title={`Remove ${person.displayName}`}
                  />
                )}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {!disabled && selectedPersons.length < maxSelections && (
        <div className={styles.searchInputContainer}>
          <Popover
            open={
              isOpen && (searchQuery.length > 0 || searchResults.length > 0)
            }
            onOpenChange={(_, data) => setIsOpen(data.open)}
          >
            <PopoverTrigger disableButtonEnhancement>
              <Input
                ref={inputRef}
                className={styles.searchInput}
                placeholder={placeholder}
                value={searchQuery}
                size="small"
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => searchQuery.length >= 2 && setIsOpen(true)}
                contentBefore={
                  isLoading ? (
                    <Spinner size="tiny" />
                  ) : (
                    <Search20Regular
                      style={{ color: tokens.colorBrandForeground1 }}
                    />
                  )
                }
                disabled={disabled}
              />
            </PopoverTrigger>

            <PopoverSurface style={{ padding: 0, minWidth: "320px" }}>
              <div className={styles.searchResults}>
                {isLoading && (
                  <div className={styles.loadingState}>
                    <Spinner size="tiny" />
                    <Text style={{ color: tokens.colorNeutralForeground2 }}>
                      Searching people...
                    </Text>
                  </div>
                )}

                {!isLoading && searchResults.length > 0 && (
                  <>
                    {searchResults.slice(0, 8).map((person) => (
                      <div
                        key={person.id}
                        className={styles.personItem}
                        onClick={() => handlePersonSelect(person)}
                        title={`Add ${person.displayName}`}
                      >
                        <Avatar
                          name={person.displayName}
                          size={32}
                          color="colorful"
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            weight="semibold"
                            style={{
                              display: "block",
                              color: tokens.colorNeutralForeground1,
                            }}
                            truncate
                          >
                            {person.displayName}
                          </Text>
                          <Text
                            size={200}
                            style={{
                              color: tokens.colorNeutralForeground3,
                              display: "block",
                            }}
                            truncate
                          >
                            {person.email}
                          </Text>
                        </div>
                        <PersonAddRegular
                          style={{
                            fontSize: "16px",
                            color: tokens.colorBrandForeground1,
                            opacity: 0.7,
                          }}
                        />
                      </div>
                    ))}
                    {searchResults.length > 8 && (
                      <div
                        style={{
                          padding: tokens.spacingVerticalS,
                          textAlign: "center",
                          backgroundColor: tokens.colorNeutralBackground2,
                          borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
                          color: tokens.colorNeutralForeground3,
                        }}
                      >
                        <Text size={200}>
                          +{searchResults.length - 8} more results available
                        </Text>
                      </div>
                    )}
                  </>
                )}

                {!isLoading &&
                  searchQuery.length >= 2 &&
                  searchResults.length === 0 && (
                    <div className={styles.emptyState}>
                      <PersonRegular
                        style={{ fontSize: "32px", opacity: 0.5 }}
                      />
                      <Text weight="semibold">No people found</Text>
                      <Text size={200}>No results for "{searchQuery}"</Text>
                    </div>
                  )}

                {searchQuery.length > 0 && searchQuery.length < 2 && (
                  <div className={styles.emptyState}>
                    <Search20Regular
                      style={{ fontSize: "24px", opacity: 0.5 }}
                    />
                    <Text>Type at least 2 characters to search</Text>
                  </div>
                )}
              </div>
            </PopoverSurface>
          </Popover>
        </div>
      )}
    </div>
  );
};

function InductionTasks() {
  const [inductionTasks, setInductionTasks] = useState<InductionTask[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { accessToken, currentUser }: any = useAuth();
  const [errors, setErrors] = useState<{
    [key: string]: { taskDescription?: string };
  }>({});
  const [pagination, setPagination] = useState({
    pageNumber: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 0,
  });

  const generateId = () =>
    `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const fetchUsersa = async (query: string): Promise<Person[]> => {
    return await fetchUsers(query, accessToken).then((result) => result);
  };

  useEffect(() => {
    fetchInductionTasks();
  }, []);

  const fetchInductionTasks = async () => {
    setIsLoading(true);
    try {
      const response = await getInductionTasks(
        {
          pageNumber: pagination.pageNumber,
          pageSize: pagination.pageSize,
          sortBy: "CreatedAt",
          sortDirection: "DESC",
        },
        accessToken
      );

      if (response.success) {
        const transformedTasks = response.data.tasks.map((task: any) => ({
          id: task.id,
          taskCode: task.taskCode,
          taskDescription: task.taskDescription,
          assignedUsers: task.assignedUsers || [],
          days: task.days,
          quantity: task.quantity,
          status: task.status,
          isConfiguration : task.isConfiguration,
          configurationType: task.configurationType,
          createdAt: task.createdAt,
          modifiedAt: task.modifiedAt,
          createdByUserID: task.createdByUserID,
          modifiedByUserID: task.modifiedByUserID,
        }));

        setInductionTasks(transformedTasks);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.message || "Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching induction tasks:", error);
      showToast("error", "Error fetching induction tasks", "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const addInductionTask = () => {
    const newInductionTask: InductionTask = {
      id: generateId(),
      taskDescription: "",
      assignedUsers: [],
      days: 0,
      quantity: false,
      status: "Draft",
      isNew: true,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      isConfiguration: false,
      configurationType: ""
    };
    // setInductionTasks([...inductionTasks, newInductionTask]);
    setInductionTasks([newInductionTask, ...inductionTasks]);
    setIsEditMode(true);
    showToast("success", "New induction task added");
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

  const saveAllInductionTasks = async () => {
    let hasError = false;
    const updatedTasks = [...inductionTasks];
    const tempSet = new Set()

    for (let i = 0; i < updatedTasks.length; i++) {
      const task = updatedTasks[i];
      const trimmedDescription = task.taskDescription.trim();
      const isValid = validateTaskDescription(task.id, task.taskDescription);
      if (!isValid) hasError = true;


      if (task.isConfiguration && !task.configurationType) {
        showToast("error", "There is a system configuration parameter unset")

        hasError = true
      }

      if (task.isConfiguration) {
        if (tempSet.has(task.configurationType)) {
          showToast("error", "Duplicate configuration tasks found")
          hasError = true
        }
        tempSet.add(task.configurationType)
      }

      if (task.assignedUsers.length === 0) {
        showToast(
          "error",
          "Validation Error",
          `At least one person must be assigned to task ${trimmedDescription || `#${i + 1}`
          }.`
        );
        hasError = true;
      }

      updatedTasks[i] = { ...task, taskDescription: trimmedDescription };
    }

    if (hasError) return;

    setIsSaving(true);
    const savedTasks = [];

    try {
      for (let i = 0; i < updatedTasks.length; i++) {
        const task = updatedTasks[i];

        if (task.isNew) {
          const createData = {
            taskDescription: task.taskDescription,
            days: task.days,
            quantity: task.quantity,
            status: "Active",
            createdByUserId: currentUser.userID,
            assignedUsers: task.assignedUsers.map((user) => ({ id: user.id })),
            isConfiguration: task.isConfiguration,
            configurationType: task.configurationType
          };

          const response = await createInductionTask(createData, accessToken);
          if (response.success) {
            savedTasks.push({
              ...task,
              id: response.data.id,
              isNew: false,
              assignedUsers: response.data.assignedUsers || task.assignedUsers,
            });
          } else {
            throw new Error(response.message || "Failed to create task");
          }
        } else {
          const updateData = {
            taskDescription: task.taskDescription,
            days: task.days,
            quantity: task.quantity,
            status: task.status || "Active",
            modifiedByUserId: currentUser.userID,
            isConfiguration: task.isConfiguration,
            configurationType: task.configurationType,
            assignedUsers: task.assignedUsers.map((user) => ({ id: user.id })),
            
          };

          const response = await updateInductionTask(
            task.id,
            updateData,
            accessToken
          );
          if (response.success) {
            savedTasks.push({
              ...task,
              assignedUsers: response.data.assignedUsers || task.assignedUsers,
            });
          } else {
            throw new Error(response.message || "Failed to update task");
          }
        }
      }

      setInductionTasks(savedTasks);
      showToast(
        "success",
        "Success",
        "All induction tasks saved successfully."
      );
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving induction tasks:", error);
      showToast("error", "Error", "Error saving induction tasks.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteInductionTaskHandler = async (id: string) => {
    setDeletingId(id);
    const taskToDelete = inductionTasks.find((task) => task.id === id);

    if (taskToDelete?.isNew) {
      setInductionTasks((prevTasks) =>
        prevTasks.filter((task) => task.id !== id)
      );
      showToast(
        "success",
        "Success",
        "New induction task removed successfully."
      );
    } else {
      try {
        const response = await deleteInductionTask(
          id,
          currentUser.userID,
          accessToken
        );
        if (response.success) {
          setInductionTasks((prevTasks) =>
            prevTasks.filter((task) => task.id !== id)
          );
          showToast(
            "success",
            "Success",
            "Induction task deleted successfully."
          );
        } else {
          throw new Error(response.message || "Failed to delete task");
        }
      } catch (error) {
        console.error("Error deleting induction task:", error);
        showToast("error", "Error", "Error deleting induction task.");
      }
    }
    setDeletingId(null);
  };

  const validateTaskDescription = (
    id: string,
    description: string
  ): boolean => {
    if (!description.trim()) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: {
          ...prevErrors[id],
          taskDescription: "Task description cannot be empty",
        },
      }));
      return false;
    }

    const isDuplicate = inductionTasks.some(
      (task) =>
        task.id !== id &&
        task.taskDescription.toLowerCase() === description.toLowerCase()
    );

    if (isDuplicate) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: {
          ...prevErrors[id],
          taskDescription: "Task description already exists",
        },
      }));
      return false;
    }

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      if (newErrors[id]) {
        delete newErrors[id].taskDescription;
        if (Object.keys(newErrors[id]).length === 0) delete newErrors[id];
      }
      return newErrors;
    });

    return true;
  };

  const handleInputChange = (
    index: number,
    field: keyof InductionTask,
    value: any
  ) => {
    setInductionTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];

      if (field === "days") {
        const numericValue = value === "" ? 0 : parseInt(value, 10);
        value = isNaN(numericValue)
          ? 0
          : Math.max(-60, Math.min(365, numericValue));
      }

      updatedTasks[index] = {
        ...updatedTasks[index],
        [field]: value,
        modifiedAt: new Date().toISOString(),
      };

      if (field === "taskDescription") {
        validateTaskDescription(updatedTasks[index].id, value);
      }

      if (field === "isConfiguration") {
        if (!value) {
          updatedTasks[index]["isConfiguration"] = value
          updatedTasks[index]["configurationType"] = ""
        }
        else {
          updatedTasks[index]["isConfiguration"] = value
        }
      }

      return updatedTasks;
    });
  };

  const handlePersonsChange = (taskId: string, persons: Person[]) => {
    setInductionTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === taskId) {
          return {
            ...task,
            assignedUsers: persons,
            modifiedAt: new Date().toISOString(),
          };
        }
        return task;
      })
    );
  };

  const handleSort = (key: keyof InductionTask) => {
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

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredTasks = inductionTasks.filter(
    (task) =>
      task.taskDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedUsers.some((user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const getSortedTasks = () => {
    if (!sortConfig) return filteredTasks;
    return [...filteredTasks].sort((a, b) => {
      const aValue: any = a[sortConfig.key];
      const bValue: any = b[sortConfig.key];
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const sortedTasks = getSortedTasks();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Onboarding Tasks...</Body1Strong>
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
                Onboarding Task Templates
              </Subtitle2>
              <div>
                <Caption1 className="text-gray-600">
                  Manage induction tasks for new employee onboarding
                </Caption1>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
            <div className="flex items-center gap-4 w-full md:w-1/4">
              <div className="relative w-full">
                <SearchBox
                  className={`w-full transition-all duration-200 ${isTransitioning
                      ? "opacity-70 scale-[0.99]"
                      : "opacity-100 scale-100"
                    } !border-1 !border-[#E5E7EB] after:!border-0 !rounded-3xl`}
                  disabled={isLoading}
                  placeholder="Search tasks or people..."
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
                onClick={addInductionTask}
                disabled={!isEditMode}
                shape="circular"
                icon={
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] flex items-center justify-center text-white">
                    <Add12Filled />
                  </div>
                }
                className="hover:bg-indigo-700 shadow !bg-white/50 !text-[#626262] border-1 !border-white"
              >
                Add Induction Task
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4">
            {sortedTasks.length > 0 ? (
              <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0">
                <div className="max-h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <Table sortable className="w-full">
                    <TableHeader className="sticky top-0 z-20 bg-gray-100 shadow-sm">
                      <TableRow className="border-b-2 border-gray-100">
                        <TableHeaderCell className="!py-3 !px-6 w-16">
                          <Body1Strong className="text-gray-900">#</Body1Strong>
                        </TableHeaderCell>
                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-6 "
                          onClick={() => handleSort("taskDescription")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Task Description
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "taskDescription" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell colSpan={2} className="!py-3 !px-6 ">
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Assigned To
                            </Body1Strong>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-6"
                          onClick={() => handleSort("days")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Days
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "days" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-6 "
                          onClick={() => handleSort("quantity")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Quantity
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "quantity" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-6 "
                          onClick={() => handleSort("quantity")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Configuration
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "quantity" &&
                                (sortConfig.direction === "asc" ? (
                                  <ChevronUpRegular className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <ChevronDownRegular className="w-4 h-4 text-blue-600" />
                                ))}
                            </div>
                          </div>
                        </TableHeaderCell>

                        <TableHeaderCell
                          className="cursor-pointer transition-all duration-200 hover:bg-blue-50 group !py-3 !px-6 "
                          onClick={() => handleSort("quantity")}
                        >
                          <div className="flex items-center gap-2">
                            <Body1Strong className="text-gray-900">
                              Parameter
                            </Body1Strong>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              {sortConfig?.key === "quantity" &&
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
                      {sortedTasks.map((inductionTask, index) => (
                        <TableRow
                          key={inductionTask.id || index}
                          className={`hover:bg-blue-50/50 transition-all duration-200 border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                            } ${inductionTask.isNew ? "bg-yellow-50/50" : ""}`}
                        >
                          <TableCell className="px-6 py-4">
                            <Badge
                              appearance="filled"
                              color={inductionTask.isNew ? "warning" : "brand"}
                              size="medium"
                              className={`font-semibold ${inductionTask.isNew
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-blue-100 text-blue-800"
                                }`}
                            >
                              {inductionTask.isNew ? "NEW" : index + 1}
                            </Badge>
                          </TableCell>

                          <TableCell className="px-6 py-4">
                            {isEditMode ? (
                              <Field
                                validationState={
                                  errors[inductionTask.id]?.taskDescription
                                    ? "error"
                                    : "none"
                                }
                                validationMessage={
                                  errors[inductionTask.id]?.taskDescription
                                }
                              >
                                <Textarea
                                  value={inductionTask.taskDescription}
                                  onChange={(e) =>
                                    handleInputChange(
                                      index,
                                      "taskDescription",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter task description..."
                                  style={{ width: "100%" }}
                                />
                              </Field>
                            ) : (
                              <Text className="text-gray-800 font-medium">
                                {inductionTask.taskDescription ||
                                  "No description"}
                              </Text>
                            )}
                          </TableCell>

                          <TableCell colSpan={2} className="px-6 py-4" >
                            <EnhancedPeoplePicker
                              selectedPersons={inductionTask.assignedUsers}
                              onPersonsChanged={(persons) =>
                                handlePersonsChange(inductionTask.id, persons)
                              }
                              disabled={!isEditMode}
                              searchFunction={fetchUsersa}
                              maxSelections={5}
                              placeholder={
                                isEditMode ? "Search and add people..." : ""
                              }
                            />
                          </TableCell>

                          <TableCell className="px-6 py-4">
                            {isEditMode ? (
                              <Input
                                type="number"
                                value={String(inductionTask.days)}
                                onChange={(e) =>
                                  handleInputChange(
                                    index,
                                    "days",
                                    e.target.value
                                  )
                                }
                                className="w-full max-w-[80px]"
                                min="-60"
                                max="365"
                              />
                            ) : (
                              <Badge
                                appearance="outline"
                                size="medium"
                                className="text-orange-700 border-orange-200 font-medium"
                              >
                                {inductionTask.days}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="px-6 py-4">
                            {isEditMode ? (
                              <Checkbox
                                checked={inductionTask.quantity}
                                onChange={(e, data) =>
                                  handleInputChange(
                                    index,
                                    "quantity",
                                    data.checked
                                  )
                                }
                                className="mx-auto block"
                              />
                            ) : (
                              <Badge
                                appearance={
                                  inductionTask.quantity ? "filled" : "outline"
                                }
                                size="medium"
                                className={
                                  inductionTask.quantity
                                    ? "bg-teal-100 text-teal-800"
                                    : "text-gray-600 border-gray-300"
                                }
                              >
                                {inductionTask.quantity ? "Yes" : "No"}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell className="px-6 py-4">
                            {isEditMode ? (
                              <Checkbox
                                checked={inductionTask.isConfiguration}
                                onChange={(e, data) =>
                                  handleInputChange(
                                    index,
                                    "isConfiguration",
                                    data.checked
                                  )
                                }
                                className="mx-auto block"
                              />
                            ) : (
                              <Badge
                                appearance={
                                  inductionTask.isConfiguration ? "filled" : "outline"
                                }
                                size="medium"
                                className={
                                  inductionTask.isConfiguration
                                    ? "bg-teal-100 text-teal-800"
                                    : "text-gray-600 border-gray-300"
                                }
                              >
                                {inductionTask.isConfiguration ? "Yes" : "No"}
                              </Badge>
                            )}
                          </TableCell>

                          <TableCell>
                            {
                              isEditMode && inductionTask.isConfiguration ?
                                <Field>
                                  <Select
                                    value={inductionTask.configurationType}
                                    onChange={(e) =>
                                      handleInputChange(
                                        index,
                                        "configurationType",
                                        e.target.value
                                      )
                                    }
                                  >
                                    <option style={{ display: "none" }}></option>
                                    <option value="email">Email</option>
                                    <option value="shift">Shift</option>
                                  </Select>
                                </Field>
                                :
                                <Text>{inductionTask.configurationType ?? "-"}</Text>

                            }


                          </TableCell>

                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <CalendarRegular className="w-4 h-4 text-gray-400" />
                              <Text
                                size={200}
                                className="text-gray-700 font-medium"
                              >
                                {formatDate(inductionTask.modifiedAt)}
                              </Text>
                            </div>
                          </TableCell>

                          <TableCell className="px-6 py-4">
                            <Button
                              onClick={() =>
                                deleteInductionTaskHandler(inductionTask.id)
                              }
                              icon={
                                deletingId === inductionTask.id ? (
                                  <Spinner size="tiny" />
                                ) : (
                                  <Delete20Regular />
                                )
                              }
                              disabled={
                                !isEditMode || deletingId === inductionTask.id
                              }
                              appearance="subtle"
                              className="w-8 h-8 hover:bg-red-100 hover:text-red-700 transition-all duration-200 rounded-lg"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Footer */}
                {sortedTasks.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-100 px-2 py-4">
                    <div className="flex items-center justify-between">
                      <Caption1 className="text-gray-600 font-medium">
                        Showing {sortedTasks.length} of {inductionTasks.length}{" "}
                        induction tasks
                        {pagination.totalCount > inductionTasks.length &&
                          ` (${pagination.totalCount} total)`}
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
                          onClick={saveAllInductionTasks}
                          disabled={isSaving}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSaving ? "Saving..." : "Save All Tasks"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <div className="text-center py-20 flex flex-col items-center bg-white/50 rounded-lg shadow-sm border border-white">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                  <TaskListAdd24Regular className="w-10 h-10 text-blue-600" />
                </div>
                <Subtitle2 className="mb-3 text-gray-700">
                  No induction tasks found
                </Subtitle2>
                <div className="text-center">
                  <Text className="text-gray-500 max-w-md mx-auto leading-relaxed">
                    {searchTerm
                      ? "We couldn't find any tasks matching your criteria. Try adjusting your search."
                      : "Get started by creating your first induction task to streamline the onboarding process."}
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
                    onClick={addInductionTask}
                    className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    icon={<Add12Filled />}
                  >
                    Add Your First Task
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4">
              <Button
                appearance="subtle"
                onClick={() => {
                  if (pagination.pageNumber > 1) {
                    setPagination((prev) => ({
                      ...prev,
                      pageNumber: prev.pageNumber - 1,
                    }));
                    fetchInductionTasks();
                  }
                }}
                disabled={pagination.pageNumber <= 1}
                className="px-4 py-2"
              >
                Previous
              </Button>
              <Text className="px-4 font-medium">
                Page {pagination.pageNumber} of {pagination.totalPages}
              </Text>
              <Button
                appearance="subtle"
                onClick={() => {
                  if (pagination.pageNumber < pagination.totalPages) {
                    setPagination((prev) => ({
                      ...prev,
                      pageNumber: prev.pageNumber + 1,
                    }));
                    fetchInductionTasks();
                  }
                }}
                disabled={pagination.pageNumber >= pagination.totalPages}
                className="px-4 py-2"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </FluentProvider>
  );
}

export default InductionTasks;
