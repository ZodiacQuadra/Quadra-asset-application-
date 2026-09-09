import React, {
  useState,
  useEffect,
  useId,
  useRef,
  useMemo,
  ComponentProps,
  SetStateAction,
} from "react";
import {
  makeStyles,
  Input,
  Dropdown,
  Option,
  Button,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Checkbox,
  tokens,
  Field,
  Textarea,
  Subtitle2,
  Body1,
  Body1Strong,
  Toast,
  ToastBody,
  ToastTitle,
  useToastController,
  Toaster,
  Avatar,
  Tag,
  Spinner,
  FluentProvider,
  Caption1,
  Tooltip,
} from "@fluentui/react-components";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../Auth/AuthProvider";
import inductionAPI, { ApiWarning, InductionTask } from "../Services/EmployeeInduction";
import { getCombinedDepartments } from "../Services/Department";
import { fetchDesignation } from "../Services/GraphAPI";
import { getCombinedLocations } from "../Services/Location";

const useStyles = makeStyles({
  truncatedText: {
    overflowX: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: "8px",
    border: "1px solid #E5E7EB",
    paddingBottom: "15px",
  },
  table: {
    width: "100%",
    minWidth: "600px",
  },
  formRow: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    "@media (min-width: 768px)": {
      flexDirection: "row",
    },
  },
  cell: {
    padding: "8px",
    verticalAlign: "top",
  },
  formField: {
    flex: 1,
    width: "100%",
    "@media (min-width: 768px)": {
      minWidth: "0",
    },
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  },
  input: {
    width: "100%",
    minWidth: "100px",
  },
  mobileRow: {
    display: "flex",
    flexDirection: "column",
    borderBottom: "1px solid #ccc",
    padding: "10px 0",
  },
  mobileCell: {
    display: "flex",
    padding: "5px 0",
  },
  mobileLabel: {
    fontWeight: "bold",
    marginRight: "10px",
    minWidth: "40%",
  },
  mobileContent: {
    flex: 1,
  },
  mobileButtonContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    marginTop: "4px",
  },
  loadingOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    backdropFilter: "blur(2px)",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
    flexDirection: "column",
    gap: "16px",
  },
  fields: {
    padding: "0",

    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  combobox: {
    width: "100%",
    // height: '40px',
    "& input": {
      width: "100%",
      backgroundColor: tokens.colorNeutralBackground1,
    },
  },
  comboboxListbox: {
    maxHeight: "300px",
    zIndex: 1000,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "4px",
    boxShadow: tokens.shadow16,
  },
});

interface FormData {
  employeeName: string;
  group: string;
  designation: string;
  location: string;
  mailId: string;
  doj: string;
  status: string;
  workEmail?: string;
}

interface TaskDetail extends InductionTask {
  taskDetailId?: string;
  completedAt?: Date | null;
}

// Loading skeleton component
const ExistingInductionSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-center py-8 h-full">
      <Spinner />
      <Body1Strong className="mt-2">
        Loading employee onboarding form...
      </Body1Strong>
    </div>
  );
};

import {
  Combobox,
  ComboboxProps,
  useComboboxFilter,
} from "@fluentui/react-components";
import { FC } from "react";
import {
  Briefcase20Regular,
  Calendar20Regular,
  CheckmarkCircle20Regular,
  Edit20Regular,
  Location20Regular,
  Mail20Regular,
  People20Regular,
  Person20Regular,
  Tag20Regular,
} from "@fluentui/react-icons";
import { ConfigurationDialog } from "./Components/ConfigurationModal";
import { AxiosError } from "axios";
import { acquireAdminToken } from "../Auth/adminAuth";

interface FilterComboboxProps {
  label: ComponentProps<typeof Field>["label"];
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  validationState?: "error" | "warning" | "success" | "none";
  validationMessage?: string;
}

const FilterCombobox: FC<FilterComboboxProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  validationState = "none",
  validationMessage,
}) => {
  const [query, setQuery] = useState<string>(value || "");
  const styles = useStyles();
  const comboOptions = options.map((opt) => ({
    children: opt,
    value: opt,
  }));

  const children = useComboboxFilter(query, comboOptions, {
    noOptionsMessage: "No options found",
  });

  const onOptionSelect: ComboboxProps["onOptionSelect"] = (e, data) => {
    const selectedValue = data.optionText ?? "";
    setQuery(selectedValue);
    onChange(selectedValue);
  };

  const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = ev.target.value;
    setQuery(newValue);

    if (!newValue) {
      onChange("");
    }
  };

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  return (
    <FluentProvider style={{ background: "transparent" }}>
      {" "}
      <Field
        orientation="vertical"
        label={label}
        required={required}
        className="flex-1 w-full"
        validationState={validationState}
        validationMessage={validationMessage}
      >
        <Combobox
          style={{ padding: "0" }}
          // className="w-full min-w-[100px]"
          onOptionSelect={onOptionSelect}
          placeholder={placeholder}
          onChange={handleInputChange}
          value={query}
          disabled={disabled}
          className={styles.combobox}
        >
          {children}
        </Combobox>
      </Field>
    </FluentProvider>
  );
};

const ExistingInductionForm = () => {
  const styles = useStyles();
  const formRef = useRef<HTMLFormElement>(null);
  const { Id } = useParams();
  const navigate = useNavigate();
  const { accessToken, currentUser }: any = useAuth();
  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);

  const [formData, setFormData] = useState<FormData>({
    employeeName: "",
    group: "",
    designation: "",
    location: "",
    mailId: "",
    doj: "",
    status: "Yet to Onboard",
    workEmail: ""
  });

  const [tasks, setTasks] = useState<TaskDetail[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [departmentsContext, setDepartmentsContext] = useState<any[]>([]);
  const [locationsContext, setLocationsContext] = useState<any[]>([]);
  const [designationsContext, setDesignationsContext] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [inductionId, setInductionId] = useState<string>("");
  const [inductionCode, setInductionCode] = useState<string>("");
  const [initialStatus, setInitialStatus] = useState<string>("Yet to Onboard");
  const [statusChanged, setStatusChanged] = useState<boolean>(false);
  const [savedStatus, setSavedStatus] = useState<string>("Yet to Onboard");
  const [OpenConfigurationModel, setOpenConfigurationModal] = useState<{ open: boolean, task: TaskDetail | null, editMode?: boolean }>({ open: false, task: null, editMode: false })
  const [loadingConfiguration, setLoadingConfiguration] = useState(false)
  const [ApplicantId,setApplicantId] = useState<string>("");


  // handle close for configuration field modal
  const handleCloseConfigurationModal = () => {
    setOpenConfigurationModal({
      open: false,
      task: null,
      editMode: false
    })
  }

  // Create a safe user info accessor function
  const getUserInfo = () => {
    // console.log(currentUser);
    if (!currentUser) {
      return {
        userID: "",
        userName: "Unknown User",
        userEmailID: "",
        permissions: {
          onboarding_tasks: {
            view_all_tasks: false,
            view_my_tasks: false,
          },
          manage_onboarding: {
            create_onboarding: false,
            edit_onboarding: false,
            delete_onboarding: false,
          },
        },
      };
    }

    return {
      userID: currentUser.userID || currentUser.id || "",
      userName: currentUser.displayName || currentUser.name || "Unknown User",
      userEmailID: currentUser.email || currentUser.mail || "",
      permissions: {
        onboarding_tasks: {
          view_all_tasks:
            currentUser.permissions?.onboarding?.onboarding_tasks
              ?.view_all_tasks || false,
          view_my_tasks:
            currentUser.permissions?.onboarding?.onboarding_tasks
              ?.view_my_tasks || false,
        },
        manage_onboarding: {
          create_onboarding:
            currentUser.permissions?.onboarding?.manage_onboarding
              ?.create_onboarding || false,
          edit_onboarding:
            currentUser.permissions?.onboarding?.manage_onboarding
              ?.edit_onboarding || false,
          delete_onboarding:
            currentUser.permissions?.onboarding?.manage_onboarding
              ?.delete_onboarding || false,
        },
      },
    };
  };

  // Flatten whatever the API put in warning.details (string, string[] or Graph
  // error objects) into one readable line for the toast subtitle.
  const formatWarningDetails = (details: unknown): string | undefined => {
    if (!details) return undefined;
    const parts = (Array.isArray(details) ? details : [details]).map((detail) => {
      if (typeof detail === "string") return detail;
      if (detail && typeof detail === "object") {
        const anyDetail = detail as any;
        return anyDetail.message || anyDetail.error || JSON.stringify(detail);
      }
      return String(detail);
    });
    return parts.filter(Boolean).join(" | ") || undefined;
  };

  // The API completes the task even when part of it only half-succeeded (AD user
  // created but licences not assigned, for instance) and reports it in `warnings`.
  // Show those instead of the plain success toast, and keep them on screen until
  // dismissed — the operator has to fix it manually, not repeat the step.
  const showApiWarnings = (warnings?: ApiWarning[]): boolean => {
    if (!warnings || warnings.length === 0) return false;

    warnings.forEach((warning) => {
      const details = formatWarningDetails(warning.details);
      dispatchToast(
        <Toast>
          <ToastTitle>Completed with warnings</ToastTitle>
          <ToastBody subtitle={details}>
            {warning.message || warning.code || "The action completed with a warning"}
          </ToastBody>
        </Toast>,
        { intent: "warning", timeout: -1 }
      );
    });

    return true;
  };

  const handleCompleteTaskWithConfiguration = async (value: any) => {

    try {
      setLoadingConfiguration(true)
      const user = getUserInfo();
      const task = OpenConfigurationModel.task

      if (!value) {
        dispatchToast(
          <Toast>
            <ToastTitle>Error</ToastTitle>
            <ToastBody>Required configuring parameter is not given</ToastBody>
          </Toast>,
          { intent: "error" }
        );

      }

      if (task && task.taskDetailId) {
        // Completing the email task creates an Entra AD user — that requires the
        // delegated admin token (User.ReadWrite.All), same as the Recruit flow.
        let adminToken: string | undefined = undefined;
        if (task.configurationType?.toLowerCase() === "email" && canManageAdUser) {
          try {
            adminToken = await acquireAdminToken(user.userEmailID);
          } catch (adminAuthError: any) {
            if (adminAuthError?.message?.includes("Redirecting")) {
              dispatchToast(
                <Toast>
                  <ToastTitle>Authentication Required</ToastTitle>
                  <ToastBody>Signing in to admin account. Please re-submit after the page reloads.</ToastBody>
                </Toast>,
                { intent: "info" }
              );
              return;
            }
            throw adminAuthError;
          }
        }

        const response = await inductionAPI.updateTaskStatus(
          task.taskDetailId,
          {
            isCompleted: true,
            completedByUserID: user.userID,
            completedByName: user.userName,
            completedByEmail: user.userEmailID,
            remarks: task.remarks,
            isConfiguration: true,
            configurationKey: task.configurationType || "",
            configurationValue: value
          },
          accessToken,
          adminToken
        );

        // Check if all required tasks are completed


        // if (allRequiredTasksCompleted) {
        // Reload to get updated status
        await loadInductionDetails();
        // }

        // Warnings (e.g. LICENSE_ASSIGNMENT_FAILED) mean the task did commit — show
        // the warning in place of the success toast, not on top of it.
        if (!showApiWarnings(response?.warnings)) {
          dispatchToast(
            <Toast>
              <ToastTitle>Success</ToastTitle>
              <ToastBody>Task updated successfully</ToastBody>
            </Toast>,
            { intent: "success" }
          );
        }
        handleCloseConfigurationModal()
      }
    } catch (error: unknown) {
      console.error("Error updating task:", error);
      let errorMessage;
      if(error instanceof AxiosError && error.response?.data?.error){
        errorMessage = error.response?.data?.error
      }
      else if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>{errorMessage ? errorMessage : "Failed to update task"}</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      setLoadingConfiguration(false)
      // Revert the change
      // await loadInductionDetails();
      // 

    }

    finally {
      setLoadingConfiguration(false)
    }

  }
  // Update details of an already-created User ID (edit mode of the configuration modal)
  const handleUpdateConfiguredUser = async (value: any) => {
    try {
      setLoadingConfiguration(true)
      const user = getUserInfo();
      const task = OpenConfigurationModel.task

      if (!value) {
        dispatchToast(
          <Toast>
            <ToastTitle>Error</ToastTitle>
            <ToastBody>Required configuring parameter is not given</ToastBody>
          </Toast>,
          { intent: "error" }
        );
        return;
      }

      if (task && task.taskDetailId) {
        // Entra AD writes need the delegated admin token (User.ReadWrite.All),
        // acquired the same way as AD user creation in the Recruit flow.
        let adminToken: string;
        try {
          adminToken = await acquireAdminToken(user.userEmailID);
        } catch (adminAuthError: any) {
          if (adminAuthError?.message?.includes("Redirecting")) {
            dispatchToast(
              <Toast>
                <ToastTitle>Authentication Required</ToastTitle>
                <ToastBody>Signing in to admin account. Please re-submit after the page reloads.</ToastBody>
              </Toast>,
              { intent: "info" }
            );
            return;
          }
          throw adminAuthError;
        }

        const response = await inductionAPI.updateConfiguredADUser(
          task.taskDetailId,
          {
            configurationValue: value,
            modifiedByUserID: user.userID,
          },
          accessToken,
          adminToken
        );

        await loadInductionDetails();

        if (!showApiWarnings(response?.warnings)) {
          dispatchToast(
            <Toast>
              <ToastTitle>Success</ToastTitle>
              <ToastBody>{response?.message || "User details updated successfully"}</ToastBody>
            </Toast>,
            { intent: "success" }
          );
        }
        handleCloseConfigurationModal()
      }
    } catch (error: unknown) {
      console.error("Error updating user details:", error);
      let errorMessage;
      if (error instanceof AxiosError && error.response?.data?.error) {
        errorMessage = typeof error.response.data.error === "string" ? error.response.data.error : error.response.data.message;
      }
      else if (error instanceof AxiosError && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>{errorMessage ? errorMessage : "Failed to update user details"}</ToastBody>
        </Toast>,
        { intent: "error" }
      );
    }
    finally {
      setLoadingConfiguration(false)
    }
  }

  // Only users allowed to create AD accounts may edit a created User ID
  const canManageAdUser = useMemo(() => {
    const permissions: any = currentUser?.permissions;
    return permissions?.recruit?.create_ad === true;
  }, [currentUser]);

  // Check if user can edit induction details
  const canEditInduction = useMemo(() => {
    const user = getUserInfo();

    // console.log(savedStatus);
    // console.log(user.permissions.manage_onboarding.edit_onboarding);
    return (
      user.permissions.manage_onboarding.edit_onboarding &&
      !["Cancelled", "Onboarded"].includes(savedStatus)
    );
  }, [currentUser, savedStatus]);

  // Check if tasks should be disabled
  const isTasksDisabled = useMemo(() => {
    return ["Cancelled", "Onboarded"].includes(savedStatus);
  }, [savedStatus]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (!Id || !accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Load induction details first
        await loadInductionDetails();

        // Load dropdown data in parallel
        const [locations] = await Promise.all([
          // getCombinedDepartments(accessToken),
          getCombinedLocations(accessToken),
          // fetchDesignation(accessToken),
        ]);

        // setDepartmentsContext(departments);
        setLocationsContext(locations);
        // setDesignationsContext(designations);
      } catch (error) {
        console.error("Error loading data:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Error</ToastTitle>
            <ToastBody>Failed to load data</ToastBody>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [Id, accessToken]);

  const loadInductionDetails = async () => {
    if (!Id) return;

    try {
      const response = await inductionAPI.getInductionById(Id, accessToken);

      if (response.success && response.data) {
        const { induction, tasks: taskDetails } = response.data;

        // Set form data
        setFormData({
          employeeName: induction.EmployeeName || "",
          group: induction.Department || "",
          designation: induction.Designation || "",
          location: induction.Location || "",
          mailId: induction.EmployeeEmail || "",
          doj: induction.DateOfJoining || "",
          status: induction.Status || "Yet to Onboard",
          workEmail: induction.WorkEmail || ""
        });

        setApplicantId(induction?.EmployeeId || "");

        setInductionId(induction.ID);
        setInductionCode(induction.InductionCode);
        setInitialStatus(induction.Status);
        setSavedStatus(induction.Status); // Set the saved status

        // Set tasks with proper mapping
        if (taskDetails && Array.isArray(taskDetails)) {
          // In the loadInductionDetails function, update the task mapping:
          const mappedTasks: TaskDetail[] = taskDetails.map((task: any) => {
            let assignedUsers = [];

            // Handle AssignedUsers field (capital A) from the API
            const assignedUsersData = task.AssignedUsers || task.assignedUsers;

            if (assignedUsersData) {
              if (typeof assignedUsersData === "string") {
                try {
                  assignedUsers = JSON.parse(assignedUsersData);
                } catch (e) {
                  console.error("Error parsing assignedUsers:", e);
                  assignedUsers = [];
                }
              } else if (Array.isArray(assignedUsersData)) {
                assignedUsers = assignedUsersData;
              } else if (typeof assignedUsersData === "object") {
                assignedUsers = [assignedUsersData];
              }
            }

            return {
              id: task.InductionTaskID,
              taskDetailId: task.ID,
              taskDescription: task.TaskDescription,
              isQuantity: task.Quantity > 0,
              quantity: task.Quantity || 0,
              isRequired: task.IsRequired,
              completed: task.IsCompleted,
              remarks: task.Remarks || "",
              assignedTo: task.AssignedTo || "",
              emailID: task.EmailID || "",
              assignedUsers,
              isConfiguration: task.IsConfiguration,
              configurationType: task.ConfigureType,
              remainderDate: task.ReminderDate
                ? new Date(task.ReminderDate)
                : null,
              remainderCount: task.ReminderCount || 0,
              completedByName: task.CompletedByName || "",
              completedByEmailID: task.CompletedByEmail || "",
              completedAt: task.CompletedAt,
              isConfigured: task.IsConfigured
            };
          });

          // console.log("Mapped tasks:", mappedTasks);
          setTasks(mappedTasks);
        } else {
          console.warn("No tasks found or taskDetails is not an array");
          setTasks([]);
        }
      }
    } catch (error) {
      console.error("Error loading induction details:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>Failed to load induction details</ToastBody>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  const calculateRemainderDate = (doj: Date, remainderCount: number) => {
    const remainderDate = new Date(doj);
    remainderDate.setDate(remainderDate.getDate() + remainderCount);
    return remainderDate;
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | Date | null
  ) => {
    if (field === "employeeName" && typeof value === "string") {
      if (isValidName(value) || value === "") {
        setFormData((prevData) => ({ ...prevData, [field]: value }));
        setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [field]: "Please enter only alphabets",
        }));
      }
    } else {
      setFormData((prevData) => ({ ...prevData, [field]: value }));
      setErrors((prevErrors) => ({ ...prevErrors, [field]: "" }));
    }

    if (field === "status") {
      setStatusChanged(true);
    }

    if (field === "doj" && value) {
      const dojDate = new Date(value);
      setTasks((prevTasks) =>
        prevTasks.map((task) => ({
          ...task,
          remainderDate: calculateRemainderDate(dojDate, task.remainderCount),
        }))
      );
    }
  };

  // Add this helper function after getUserInfo
  const isTaskAssignedToUser = (task: TaskDetail) => {
    const user = getUserInfo();

    // Check assignedUsers array
    if (task.assignedUsers && Array.isArray(task.assignedUsers)) {
      return task.assignedUsers.some((assignedUser: any) => {
        if (!assignedUser) return false;

        const assignedUserId = (
          assignedUser.id ||
          assignedUser.userID ||
          ""
        ).toLowerCase();
        const currentUserId = user.userID.toLowerCase();

        const assignedUserEmail = (assignedUser.email || "").toLowerCase();
        const currentUserEmail = user.userEmailID.toLowerCase();

        return (
          (assignedUserId &&
            currentUserId &&
            assignedUserId === currentUserId) ||
          (assignedUserEmail &&
            currentUserEmail &&
            assignedUserEmail === currentUserEmail)
        );
      });
    }

    // Check emailID field
    if (task.emailID && user.userEmailID) {
      const emails = task.emailID
        .toLowerCase()
        .split(";")
        .map((e) => e.trim());
      return emails.includes(user.userEmailID.toLowerCase());
    }

    // Check assignedTo field by name
    if (task.assignedTo && user.userName) {
      const assignedNames = task.assignedTo
        .split(";")
        .map((name) => name.trim().toLowerCase());
      const userName = user.userName.toLowerCase();
      return assignedNames.some(
        (name) =>
          name === userName ||
          name.includes(userName) ||
          userName.includes(name)
      );
    }

    return false;
  };

  // Add this helper function to check if user can edit a specific task
  const canEditTask = (task: TaskDetail) => {
    const user = getUserInfo();
    const hasViewAllPermission =
      user.permissions.onboarding_tasks.view_all_tasks;
    const canEdit = user.permissions.manage_onboarding.edit_onboarding;

    if (task.completed) return false;
    if (isTasksDisabled) return false;

    const isAssigned = isTaskAssignedToUser(task);
    if (isAssigned) return true;

    if (hasViewAllPermission && canEdit) {
      return true;
    }

    return false;
  };

  const handleTaskChange = async (
    index: number,
    field: keyof TaskDetail,
    value: string | number | boolean
  ) => {
    // Prevent changes during submission
    if (isSubmitting) return;

    const task = filteredTasks[index];
    if (!task.taskDetailId) return;

    const user = getUserInfo();

    // Update local state immediately
    setTasks((prevTasks) => {
      // Find the actual index in the full tasks array
      const actualIndex = prevTasks.findIndex(
        t => t.taskDetailId === task.taskDetailId
      );

      if (actualIndex === -1) return prevTasks;

      const updatedTasks = [...prevTasks];
      const updatedTask = { ...updatedTasks[actualIndex] };

      if (field === "quantity") {
        updatedTask.quantity = Math.max(0, Number(value));
      } else if (field === "completed") {
        if (!updatedTask.isConfiguration) {
          updatedTask.completed = value as boolean;
          if (updatedTask.completed) {
            updatedTask.completedByName = user.userName;
            updatedTask.completedByEmailID = user.userEmailID;
            updatedTask.completedAt = new Date();

            // If status is "Yet to Onboard" and a task is completed, change to "In Progress"
            if (formData.status === "Yet to Onboard") {
              setFormData((prev) => ({ ...prev, status: "In Progress" }));
              setStatusChanged(true);
            }
          } else {
            updatedTask.completedByName = "";
            updatedTask.completedByEmailID = "";
            updatedTask.completedAt = undefined;
          }
        }

      } else if (field === "remarks") {
        updatedTask.remarks = value as string;
      } else {
        (updatedTask[field] as any) = value;
      }

      updatedTasks[actualIndex] = updatedTask;
      return updatedTasks;
    });

    // If task is being marked as completed, update in backend
    if (field === "completed" && value === true) {
      // console.log("tasks", task);
      if (task.isConfiguration) {
        setOpenConfigurationModal({ open: true, task: task })
      }
      else {
        try {
          await inductionAPI.updateTaskStatus(
            task.taskDetailId,
            {
              isCompleted: true,
              completedByUserID: user.userID,
              completedByName: user.userName,
              completedByEmail: user.userEmailID,
              remarks: task.remarks,
            },
            accessToken
          );

          // Check if all required tasks are completed
          const allRequiredTasksCompleted = tasks
            .filter((t) => t.isRequired)
            .every((t) => t.completed || (t === task && value === true));

          if (allRequiredTasksCompleted) {
            // Reload to get updated status
            await loadInductionDetails();
          }

          dispatchToast(
            <Toast>
              <ToastTitle>Success</ToastTitle>
              <ToastBody>Task updated successfully</ToastBody>
            </Toast>,
            { intent: "success" }
          );
        } catch (error) {
          console.error("Error updating task:", error);
          dispatchToast(
            <Toast>
              <ToastTitle>Error</ToastTitle>
              <ToastBody>Failed to update task</ToastBody>
            </Toast>,
            { intent: "error" }
          );
          // Revert the change
          await loadInductionDetails();
        }
      }

    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidName = (name: string): boolean => {
    const nameRegex = /^[A-Za-z\s]+$/;
    return nameRegex.test(name);
  };

  const validateForm = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.employeeName.trim()) {
      newErrors.employeeName = "Employee name is required";
    } else if (!isValidName(formData.employeeName)) {
      newErrors.employeeName = "Please enter only alphabets";
    }
    if (!formData.group) newErrors.group = "Group is required";
    if (!formData.designation)
      newErrors.designation = "Designation is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.mailId) {
      newErrors.mailId = "Email Address is required";
    } else if (!isValidEmail(formData.mailId)) {
      newErrors.mailId = "Please enter a valid email address";
    }
    if (!formData.doj) newErrors.doj = "Date of Joining is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) return;

    if (!validateForm() || !inductionId) return;

    setIsSubmitting(true);
    try {
      const user = getUserInfo();

      // Update induction details
      const updateData = {
        employeeName: formData.employeeName,
        department: formData.group,
        designation: formData.designation,
        location: formData.location,
        dateOfJoining: formData.doj,
        status: formData.status,
        modifiedByUserId: user.userID,
      };

      await inductionAPI.updateInduction(inductionId, updateData, accessToken);

      // If status is being changed to "Onboarded", mark all tasks as completed
      if (formData.status === "Onboarded" && initialStatus !== "Onboarded") {
        const updatePromises = tasks
          .filter((task) => !task.completed && task.taskDetailId)
          .map((task) =>
            inductionAPI.updateTaskStatus(
              task.taskDetailId!,
              {
                isCompleted: true,
                completedByUserID: user.userID,
                completedByName: user.userName,
                completedByEmail: user.userEmailID,
                remarks:
                  task.remarks ||
                  "Marked as completed when status changed to Onboarded",
              },
              accessToken
            )
          );

        await Promise.all(updatePromises);
      }

      dispatchToast(
        <Toast>
          <ToastTitle>Success</ToastTitle>
          <ToastBody>Induction updated successfully</ToastBody>
        </Toast>,
        { intent: "success", timeout: 3000 }
      );

      // Reload the data to get the latest state
      await loadInductionDetails();
      setStatusChanged(false);
      setSavedStatus(formData.status); // Update saved status after successful save
    } catch (error) {
      console.error("Error updating induction:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>Failed to update induction</ToastBody>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tasks based on user permissions
  const filteredTasks = useMemo(() => {
    const user = getUserInfo();
    const hasViewAllPermission =
      user.permissions.onboarding_tasks.view_all_tasks;
    const hasViewMyPermission = user.permissions.onboarding_tasks.view_my_tasks;

    // console.log("Current user:", {
    //   userID: user.userID,
    //   userName: user.userName,
    //   userEmailID: user.userEmailID,
    //   hasViewAllPermission,
    //   hasViewMyPermission,
    //   canEdit: user.permissions.manage_onboarding.edit_onboarding,
    // });
    // console.log("All tasks:", tasks);

    if (hasViewAllPermission) {
      // console.log("User has viewAll permission - showing all tasks");
      return tasks;
    }

    if (hasViewMyPermission) {
      const filteredTasksList = tasks.filter((task) => {
        // First, try to parse assignedUsers if it exists
        let assignedUsersList = [];

        // Handle the assignedUsers field which might be an array or need parsing
        if (task.assignedUsers) {
          if (Array.isArray(task.assignedUsers)) {
            assignedUsersList = task.assignedUsers;
          } else if (typeof task.assignedUsers === "string") {
            try {
              assignedUsersList = JSON.parse(task.assignedUsers);
            } catch (e) {
              console.error("Error parsing assignedUsers:", e);
            }
          }
        }

        // Check if current user is in the assigned users list
        const isUserAssigned = assignedUsersList.some((assignedUser: any) => {
          if (!assignedUser) return false;

          // Check by user ID (case-insensitive)
          const assignedUserId = (
            assignedUser.id ||
            assignedUser.userID ||
            ""
          ).toLowerCase();
          const currentUserId = user.userID.toLowerCase();

          if (
            assignedUserId &&
            currentUserId &&
            assignedUserId === currentUserId
          ) {
            return true;
          }

          // Check by email (case-insensitive)
          const assignedUserEmail = (assignedUser.email || "").toLowerCase();
          const currentUserEmail = user.userEmailID.toLowerCase();

          if (
            assignedUserEmail &&
            currentUserEmail &&
            assignedUserEmail === currentUserEmail
          ) {
            return true;
          }

          return false;
        });

        if (isUserAssigned) {
          // console.log(
          //   `Task "${task.taskDescription}" is assigned to current user`
          // );
          return true;
        }

        // Fallback: Check the emailID field if it exists
        if (task.emailID && user.userEmailID) {
          const emails = task.emailID
            .toLowerCase()
            .split(";")
            .map((e) => e.trim());
          const userEmail = user.userEmailID.toLowerCase();
          const isAssignedByEmail = emails.includes(userEmail);

          if (isAssignedByEmail) {
            // console.log(
            //   `Task "${task.taskDescription}" is assigned to user by email`
            // );
            return true;
          }
        }

        // Fallback: Check assignedTo field by name
        if (task.assignedTo && user.userName) {
          const assignedNames = task.assignedTo
            .split(";")
            .map((name) => name.trim().toLowerCase());
          const userName = user.userName.toLowerCase();

          const isAssignedByName = assignedNames.some(
            (name) =>
              name === userName ||
              name.includes(userName) ||
              userName.includes(name)
          );

          if (isAssignedByName) {
            // console.log(
            //   `Task "${task.taskDescription}" is assigned to user by name`
            // );
            return true;
          }
        }

        return false;
      });

      // console.log(
      //   `Filtered ${filteredTasksList.length} tasks for viewMy permission`
      // );
      return filteredTasksList;
    }

    // console.log("No matching permission, returning empty array");
    return [];
  }, [tasks, currentUser]);

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <ExistingInductionSkeleton />;
  }

  // Show error if no ID provided
  if (!Id) {
    return (
      <div className={styles.loadingContainer}>
        <Body1>Invalid induction ID</Body1>
        <Button appearance="primary" onClick={() => navigate("/inductions")}>
          Back to Inductions
        </Button>
      </div>
    );
  }

  if (isSubmitting) {
    <div className="flex flex-col items-center justify-center py-8 h-full">
      <Spinner />
      <Body1Strong className="mt-2">Updating induction...</Body1Strong>
    </div>
  }

  // console.log("tasks", filteredTasks)

  return (
    <div className="flex flex-col gap-[16px]">
      <form ref={formRef}>
        <div className={styles.formContainer}>
          <div
            className="flex items-center justify-start gap-[8px] h-[60px] px-[20px] py-[40px] w-[100%]"
            style={{
              background: "linear-gradient(90deg, #EEF2FF 0%, #FAF5FF 100%)",
              border: "1px solid #E5E7EB",
              borderRadius: "8px 8px 0px 0px",
            }}
          >
            <Avatar
              size={32}
              icon={
                <People20Regular
                  color="#fff"
                  style={{ height: "60%", width: "60%" }}
                />
              }
              color="brand"
              style={{
                backgroundColor: "#0C59A4",
                height: "42px",
                width: "42px",
              }}
            />
            <div>
              <Subtitle2>Employee Onboarding Details</Subtitle2>
              <br />
              <Body1 className="text-gray-500">
                View and update employee onboarding information
              </Body1>
              {/* {inductionCode && (
            <Body1 className="text-gray-500">
              Induction Code: {inductionCode}
            </Body1>
          )} */}
            </div>
          </div>

          <div className="grid md:grid-cols-2 grid-cols-1 gap-6 w-[97%]">
            <Field
              key={`employeeName-${resetKey}`}
              orientation="vertical"
              label={
                <>
                  <Person20Regular
                    className="h-5 w-5"
                    style={{
                      marginRight: 6,
                      color: "#0C59A4",
                      fontWeight: 700,
                    }}
                  />{" "}
                  Employee Name
                </>
              }
              required
              className={styles.formField}
              validationState={errors.employeeName ? "error" : "none"}
              validationMessage={errors.employeeName}
            >
              <Input
                placeholder="Enter Employee Name"
                value={formData.employeeName}
                onChange={(e) =>
                  handleInputChange("employeeName", e.target.value)
                }
                disabled={true}
                className={styles.fields}
              />
            </Field>

            <FilterCombobox
              key={`group-${resetKey}`}
              label={
                <>
                  <People20Regular
                    style={{ marginRight: 6, color: "#0C59A4" }}
                  />{" "}
                  Department
                </>
              }
              options={departmentsContext.map((group: any) => group.Name)}
              value={formData.group}
              onChange={(value) => handleInputChange("group", value)}
              placeholder="Select or type group"
              required
              disabled={true}
              validationState={errors.group ? "error" : "none"}
              validationMessage={errors.group}
            />
          </div>

          <div className="grid md:grid-cols-2 grid-cols-1 gap-6 w-[97%]">
            {/* <FilterCombobox
              key={`designation-${resetKey}`}
              label={
                <>
                  <Briefcase20Regular
                    style={{ marginRight: 6, color: "#0C59A4" }}
                  />{" "}
                  Designation
                </>
              }
              options={designationsContext.map(
                (designation: any) => designation.title
              )}
              value={formData.designation}
              onChange={(value) => handleInputChange("designation", value)}
              placeholder="Select or type designation"
              required
              disabled={true}
              validationState={errors.designation ? "error" : "none"}
              validationMessage={errors.designation}
            /> */}

            <Field
              label={
                <>
                  <Briefcase20Regular
                    style={{ marginRight: 6, color: "#0C59A4" }}
                  />{" "}
                  Designation
                </>
              }
              required
              validationState={errors.designation ? "error" : "none"}
              validationMessage={errors.designation}
            >
              <Input
                onChange={(e) => handleInputChange("designation", e.target.value)}
                placeholder="Enter designation"
                value={formData.designation}
                disabled
              />
            </Field>

            <FilterCombobox
              key={`location-${resetKey}`}
              label={
                <>
                  <Location20Regular
                    style={{ marginRight: 6, color: "#0C59A4" }}
                  />{" "}
                  Job Location
                </>
              }
              options={locationsContext.map((location: any) => location.Name)}
              value={formData.location}
              onChange={(value) => handleInputChange("location", value)}
              placeholder="Select or type location"
              required
              disabled={true}
              validationState={errors.location ? "error" : "none"}
              validationMessage={errors.location}
            />
          </div>

          <div className="grid md:grid-cols-2 grid-cols-1 gap-6 w-[97%]">
            <Field
              key={`mailId-${resetKey}`}
              orientation="vertical"
              label={
                <>
                  <Mail20Regular style={{ marginRight: 6, color: "#0C59A4" }} />{" "}
                  Email Address
                </>
              }
              required
              className={styles.formField}
              validationState={errors.mailId ? "error" : "none"}
              validationMessage={errors.mailId}
            >
              <Input
                placeholder="Enter Personal Email Address"
                value={formData.mailId}
                onChange={(e) => handleInputChange("mailId", e.target.value)}
                disabled={true} // Email should not be editable
                className={styles.fields}
              />
            </Field>

            {
              formData.workEmail && <Field
                key={`mailId-${resetKey}`}
                orientation="vertical"
                label={
                  <>
                    <Mail20Regular style={{ marginRight: 6, color: "#0C59A4" }} />{" "}
                    Organization Email Address
                  </>
                }

                className={styles.formField}
                validationState={errors.workEmail ? "error" : "none"}
                validationMessage={errors.workEmail}
              >
                <Input
                  value={formData.workEmail}
                  onChange={(e) => handleInputChange("workEmail", e.target.value)}
                  disabled={true}
                  className={styles.fields}
                />
              </Field>

            }

            {
              !formData.workEmail && <Field
                key={`doj-${resetKey}`}
                orientation="vertical"
                label={
                  <>
                    <Calendar20Regular
                      style={{ marginRight: 6, color: "#0C59A4" }}
                    />{" "}
                    Date of Joining
                  </>
                }
                required
                className={styles.formField}
                validationState={errors.doj ? "error" : "none"}
                validationMessage={errors.doj}
              >
                <FluentProvider style={{ background: "transparent" }}>
                  <DatePicker
                    // className="w-full"
                    style={{ width: "100%" }}
                    placeholder="Select Date of Joining"
                    onSelectDate={(date) =>
                      handleInputChange("doj", date ? new Date(date) : "")
                    }
                    value={formData.doj ? new Date(formData.doj) : null}
                    disabled={!canEditInduction || isSubmitting}
                    className={styles.fields}
                  />
                </FluentProvider>
              </Field>
            }


          </div>

          <div className="grid md:grid-cols-2 grid-cols-1 gap-6 w-[97%]">

            {formData.workEmail && <Field
              key={`doj-${resetKey}`}
              orientation="vertical"
              label={
                <>
                  <Calendar20Regular
                    style={{ marginRight: 6, color: "#0C59A4" }}
                  />{" "}
                  Date of Joining
                </>
              }
              required
              className={styles.formField}
              validationState={errors.doj ? "error" : "none"}
              validationMessage={errors.doj}
            >
              <FluentProvider style={{ background: "transparent" }}>
                <DatePicker
                  // className="w-full"
                  style={{ width: "100%" }}
                  placeholder="Select Date of Joining"
                  onSelectDate={(date) =>
                    handleInputChange("doj", date ? new Date(date) : "")
                  }
                  value={formData.doj ? new Date(formData.doj) : null}
                  disabled={!canEditInduction || isSubmitting}
                  className={styles.fields}
                />
              </FluentProvider>
            </Field>
            }
            <Field
              key={`status-${resetKey}`}
              orientation="vertical"
              label={
                <>
                  <Tag20Regular style={{ marginRight: 6, color: "#0C59A4" }} />{" "}
                  Status
                </>
              }
              className={styles.formField}
              validationState={errors.status ? "error" : "none"}
              validationMessage={errors.status}
            >
              <FluentProvider style={{ background: "transparent" }}>
                <Dropdown
                  // className="w-full"
                  className={styles.fields}
                  style={{ width: "100%", padding: "0" }}
                  value={formData.status}
                  selectedOptions={[formData.status]}
                  onOptionSelect={(e, data) =>
                    handleInputChange("status", data.optionValue || "")
                  }
                  disabled={!canEditInduction || isSubmitting}
                >
                  <Option key="Yet to Onboard" value="Yet to Onboard">
                    Yet to Onboard
                  </Option>
                  <Option key="In Progress" value="In Progress">
                    In Progress
                  </Option>
                  
                  <Option disabled={
                    filteredTasks.every((item)=>((!item.isConfiguration)||(item.isConfiguration && item.completed)))
                  } key="Onboarded" value="Onboarded">
                    Onboarded
                  </Option>
                  <Option key="Cancelled" value="Cancelled">
                    Cancelled
                  </Option>
                </Dropdown>
              </FluentProvider>
            </Field>
            <div></div>
          </div>
        </div>
      </form>

      <div
        className="space-y-2"
        style={{
          border: "1px solid #E5E7EB",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          className="flex items-center justify-start gap-[10px] h-[60px] px-[20px] w-[100%]"
          style={{
            background: "linear-gradient(90deg, #EEF2FF 0%, #FAF5FF 100%)",
            border: "1px solid #E5E7EB",
            borderRadius: "8px 8px 0px 0px",
          }}
        >
          <div className="bg-[#0C59A4] flex justify-center items-center h-[38px] w-[38px] rounded-[50%]">
            <CheckmarkCircle20Regular color="#fff" />
          </div>
          <Subtitle2>Task Status ({filteredTasks.length} tasks)</Subtitle2>

          {filteredTasks.length === 0 && (
            <Caption1 className="text-gray-500 !block">
              {tasks.length === 0
                ? "No tasks found for this induction."
                : "No tasks assigned to you or no permission to view tasks."}
            </Caption1>
          )}
        </div>

        <div
          className="w-[97%] rounded-[8px] mb-[10px]"
          style={{ border: "1px solid #e5e7eb" }}
        >
          <Table size="small" className={styles.table}>
            <TableHeader
              style={{
                background: "linear-gradient(90deg, #F9FAFB 0%, #F3F4F6 100%)",
                borderRadius: "8px",
              }}
            >
              <TableRow>
                <TableHeaderCell
                  style={{ width: "200px" }}
                  className={styles.cell}
                >
                  <Body1Strong>Task Description</Body1Strong>
                </TableHeaderCell>
                <TableHeaderCell
                  style={{ width: "200px" }}
                  className={styles.cell}
                >
                  <Body1Strong>Task Owner</Body1Strong>
                </TableHeaderCell>
                <TableHeaderCell
                  style={{ width: "80px" }}
                  className={styles.cell}
                >
                  <Body1Strong>Items/Units</Body1Strong>
                </TableHeaderCell>
                <TableHeaderCell
                  style={{ width: "150px" }}
                  className={styles.cell}
                >
                  <Body1Strong>Completed By</Body1Strong>
                </TableHeaderCell>

                <TableHeaderCell
                  style={{ width: "200px" }}
                  className={styles.cell}
                >
                  <Body1Strong>Remarks</Body1Strong>
                </TableHeaderCell>
                <TableHeaderCell
                  style={{ width: "100px" }}
                  className={styles.cell}
                >
                  <Body1Strong>Completed</Body1Strong>
                </TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task, index) => {
                return (
                  <TableRow key={task.taskDetailId || task.id}>
                    <TableCell
                      style={{ width: "200px" }}
                      className={styles.cell}
                    >
                      <Body1Strong>{task.taskDescription}</Body1Strong>
                    </TableCell>
                    <TableCell
                      style={{ width: "200px" }}
                      className={styles.cell}
                    >
                      <div className="flex gap-1 flex-col">
                        {task.assignedUsers && task.assignedUsers.length > 0 ? (
                          task.assignedUsers.map((user: any) => (
                            <Tag
                              style={{
                                backgroundColor: "transparent",
                                height: "auto",
                              }}
                              size="small"
                              key={
                                user.id ||
                                user.email ||
                                Math.random().toString()
                              }
                              shape="rounded"
                              media={
                                <Avatar
                                  aria-hidden
                                  name={user.name || "Unknown"}
                                  color="colorful"
                                  style={{
                                    borderRadius: "50%",
                                    height: "28px",
                                    width: "28px",
                                  }}
                                />
                              }
                              value={user.name || "Unknown"}
                            >
                              <span style={{ fontSize: "smaller" }}>
                                {user.name || "Unknown"}
                              </span>
                            </Tag>
                          ))
                        ) : task.assignedTo ? (
                          task.assignedTo
                            .split(";")
                            .filter((name: string) => name.trim())
                            .map((name: string) => (
                              <Tag
                                size="small"
                                style={{
                                  backgroundColor: "transparent",
                                  height: "auto",
                                }}
                                key={name}
                                shape="rounded"
                                media={
                                  <Avatar
                                    aria-hidden
                                    name={name}
                                    color="colorful"
                                    style={{
                                      borderRadius: "50%",
                                      height: "28px",
                                      width: "28px",
                                    }}
                                  />
                                }
                                value={name}
                              >
                                <span style={{ fontSize: "smaller" }}>
                                  {name}
                                </span>
                              </Tag>
                            ))
                        ) : (
                          <span>No assignees</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell
                      style={{ width: "80px" }}
                      className={styles.cell}
                    >
                      <Body1>{task.quantity || "-"}</Body1>
                    </TableCell>
                    <TableCell
                      style={{ width: "150px" }}
                      className={styles.cell}
                    >
                      {task.completedByName ? (
                        <Tag
                          size="small"
                          shape="rounded"
                          style={{
                            backgroundColor: "transparent",
                            height: "auto",
                          }}
                          media={
                            <Avatar
                              aria-hidden
                              name={task.completedByName}
                              color="colorful"
                              style={{
                                borderRadius: "50%",
                                height: "28px",
                                width: "28px",
                              }}
                            />
                          }
                        >
                          <span style={{ fontSize: "smaller" }}>
                            {task.completedByName}
                          </span>
                        </Tag>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell
                      style={{ width: "200px" }}
                      className={styles.cell}
                    >
                      <Textarea
                        className={styles.input}
                        value={task.remarks || ""}
                        placeholder="Comments"
                        onChange={(e) =>
                          handleTaskChange(index, "remarks", e.target.value)
                        }
                        disabled={!canEditTask(task) || (task.isConfiguration && task.configurationType === 'shift' && !formData.workEmail)}
                      />
                    </TableCell>
                    <TableCell
                      style={{ width: "100px" }}
                      className={styles.cell}
                    >
                      {task.completed ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Body1>
                            {task.completedAt
                              ? new Date(task.completedAt).toLocaleDateString()
                              : "Completed"}
                          </Body1>
                          {task.isConfiguration &&
                            task.configurationType?.toLowerCase() === "email" &&
                            canManageAdUser && (
                              <Tooltip content="Edit user details" relationship="label">
                                <Button
                                  appearance="subtle"
                                  size="small"
                                  icon={<Edit20Regular />}
                                  onClick={() =>
                                    setOpenConfigurationModal({ open: true, task: task, editMode: true })
                                  }
                                />
                              </Tooltip>
                            )}
                        </div>
                      ) : (
                        <Checkbox
                          checked={task.completed}
                          onChange={(e, data) =>
                            handleTaskChange(index, "completed", data.checked)
                          }
                          disabled={!canEditTask(task) || (task.isConfiguration && task.configurationType === 'shift' && !formData.workEmail)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className={styles.buttonContainer}>
        <Button
          appearance="secondary"
          style={{ borderRadius: "30px" }}
          onClick={() => navigate("/Induction")}
        >
          Back
        </Button>
        <Button
          appearance="primary"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            !canEditInduction ||
            (!statusChanged && initialStatus !== "Yet to Onboard")
          }
          style={{
            background: `${isSubmitting ||
                !canEditInduction ||
                (!statusChanged && initialStatus !== "Yet to Onboard")
                ? "#ddd"
                : "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)"
              }`,
            borderRadius: "30px",
          }}
        >
          {isSubmitting ? "Updating..." : "Update"}
        </Button>
      </div>
      <Toaster toasterId={toastId} />
      <ConfigurationDialog
        isLoading={loadingConfiguration}
        open={OpenConfigurationModel.open}
        task={OpenConfigurationModel.task}
        handleClose={handleCloseConfigurationModal}
        handleSubmit={OpenConfigurationModel.editMode ? handleUpdateConfiguredUser : handleCompleteTaskWithConfiguration}
        applicantId={ApplicantId}
        editMode={OpenConfigurationModel.editMode ?? false}
      />
    </div>
  );
};

export default ExistingInductionForm;
