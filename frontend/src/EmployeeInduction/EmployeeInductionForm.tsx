import React, { useState, useEffect, useId, useRef } from "react";
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
  SpinButton,
  Toast,
  ToastBody,
  ToastTitle,
  useToastController,
  Toaster,
  Avatar,
  Tag,
  Spinner,
  FluentProvider,
  Persona,
} from "@fluentui/react-components";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth/AuthProvider";
import inductionAPI, {
  createInductionNotification,
  HiredEmployee,
  InductionTask,
} from "../Services/EmployeeInduction";
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
    zIndex: 1,
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
    padding: "0px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  combobox: {
    width: "100%",
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

interface UserComboboxProps {
  label: string;
  placeholder: string;
  value: string;
  onUserSelect: (user: HiredEmployee | null) => void;
  required?: boolean;
  disabled?: boolean;
  validationState?: "error" | "warning" | "success" | "none";
  validationMessage?: string;
  icon?: React.ReactNode;
}



interface FormData {
  employeeName: string;
  group: string;
  designation: string;
  location: string;
  mailId: string;
  doj: string;
  status: string;
  userId: string
}



// Loading skeleton component
const EmployeeInductionSkeleton = () => {
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
  Location20Regular,
  Mail20Regular,
  People20Regular,
  Person20Regular,
  Tag20Regular,
} from "@fluentui/react-icons";

interface FilterComboboxProps {
  label: React.ReactNode;
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
      <Field
        orientation="vertical"
        label={label as any}
        required={required}
        className="flex-1 w-full"
        validationState={validationState}
        validationMessage={validationMessage}
      >
        <Combobox
          style={{ padding: "0" }}
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
}) => {
  const [query, setQuery] = useState<string>(value);
  const [users, setUsers] = useState<HiredEmployee[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { accessToken } = useAuth();

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.length < 2 || disabled || !accessToken) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const results = await inductionAPI.getHiredUsers(query, accessToken);
        if (results.data) {
          setUsers(results.data);
        } else {
          setUsers([]);
        }
      } catch (error) {
        console.error("Error searching users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query, disabled, accessToken]);

  const onOptionSelect: ComboboxProps["onOptionSelect"] = (e, data) => {
    const selectedUser = users.find((u) => u.CandidateID === data.optionValue);
    if (selectedUser) {
      setQuery(selectedUser.CandidateName);
      onUserSelect(selectedUser);
    }
  };

  const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = ev.target.value;
    setQuery(newValue);

    if (!newValue) {
      onUserSelect(null);
      setUsers([]);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Option text="Searching..." disabled>
          <div className="flex items-center gap-2">
            <Spinner size="tiny" />
            Searching...
          </div>
        </Option>
      );
    }

    if (disabled) {
      return (
        <Option text="Field is disabled" disabled>
          Field is disabled
        </Option>
      );
    }

    if (query.length < 2) {
      return (
        <Option text="Type at least 2 characters to search" disabled>
          Type at least 2 characters to search
        </Option>
      );
    }

    if (users.length === 0 && query.length >= 2 && !loading) {
      return (
        <Option text={`No users found matching "${query}"`} disabled>
          No users found matching "{query}"
        </Option>
      );
    }

    return users.map((user) => (
      <Option key={user.CandidateID} value={user.CandidateID} text={user.CandidateName}>
        <Persona
          avatar={{ color: "colorful", "aria-hidden": true }}
          name={user.CandidateName}
          secondaryText={(user.Desination?user.Desination:user.JobRole?user.JobRole:"NA")+" | "+user.Department}
        />
      </Option>
    ));
  };

  return (
  <FluentProvider style={{ background: "transparent" }}>
    <Field
      orientation="vertical"
      label={
        <>
          {icon} {label}
        </>
      }
      required={required}
      style={{
        flex: 1,
        width: '100%',
      }}
      validationState={validationState}
      validationMessage={validationMessage}
    >
      <Combobox
        style={{ width: '100%' }}
        onOptionSelect={onOptionSelect}
        placeholder={placeholder}
        onChange={handleInputChange}
        value={query}
        disabled={disabled}
        freeform
      >
        {renderContent()}
      </Combobox>
    </Field>
  </FluentProvider>
);
};

const EmployeeInductionForm = () => {
  const styles = useStyles();
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState<FormData>({
    employeeName: "",
    group: "",
    designation: "",
    location: "",
    mailId: "",
    doj: "",
    status: "Yet to Onboard",
    userId: ""
  });
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<InductionTask[]>([]);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [departmentsContext, setDepartmentsContext] = useState<any[]>([]);
  const [locationsContext, setLocationsContext] = useState<any[]>([]);
  const [designationsContext, setDesignationsContext] = useState<any[]>([]);
  const toastId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const { dispatchToast } = useToastController(toastId);
  const { accessToken, currentUser, refreshToken }: any = useAuth();




  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        setFormData((prevData: any) => ({
          ...prevData,
        }));

        // Fetch tasks using the API
        const tasksData = await inductionAPI.getInductionTasks(accessToken);

        setTasks(
          tasksData.map((task: any) => ({
            id: task.id,
            taskDescription: task.taskDescription,
            isQuantity: task.quantity,
            quantity: task.quantity ? 1 : 0,
            isRequired: true,
            completed: false,
            remarks: "",
            isConfiguration: task.isConfiguration ?? false,
            configurationType:task.configurationType ?? null,
            assignedTo: task.assignedTo || "",
            emailID: task.emailID || "",
            assignedUsers: task.assignedUsers || [],
            remainderDate: null,
            remainderCount: task.days,
            completedByName: "",
            completedByEmailID: "",
            completedByUserID: "",
            completedAt: null,
            isConfigured: task.isConfigured ?? false,
          }))
        );

        // Fetch departments, locations, and designations in parallel
        const [ locations] = await Promise.all([
          // getCombinedDepartments(accessToken),
          getCombinedLocations(accessToken),
          // fetchDesignation(accessToken),
        ]);

        // setDepartmentsContext(departments);
        setLocationsContext(locations);
        // setDesignationsContext(designations);
      } catch (error) {
        console.error("Error fetching data:", error);
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

    if (accessToken) {
      fetchData();
    }
  }, [accessToken]);

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

  const handleTaskChange = (
    index: number,
    field: keyof InductionTask,
    value: string | number | boolean
  ) => {
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      const updatedTask = { ...updatedTasks[index] };
      // console.log(field);
      // console.log(currentUser);
      if (field === "quantity") {
        updatedTask.quantity = Math.max(0, Number(value));
      } else if (field === "completed") {
        updatedTask.completed = value as boolean;
        if (updatedTask.completed) {
          updatedTask.completedByName = currentUser.displayName;
          updatedTask.completedByEmailID = currentUser.email;
          updatedTask.completedByUserID = currentUser.userID;
          updatedTask.completedAt = new Date();
        } else {
          updatedTask.completedByName = "";
          updatedTask.completedByEmailID = "";
          updatedTask.completedByUserID = "";
          updatedTask.completedAt = null;
        }
      } else {
        (updatedTask[field] as any) = value;
      }

      updatedTasks[index] = updatedTask;
      return updatedTasks;
    });
  };

  const resetForm = () => {
    setFormData({
      employeeName: "",
      group: "",
      designation: "",
      location: "",
      mailId: "",
      doj: "",
      status: "Yet to Onboard",
      userId: ""
    });

    // Reset tasks
    setTasks((prevTasks) =>
      prevTasks.map((task) => ({
        ...task,
        quantity: task.isQuantity ? 1 : 0,
        isRequired: true,
        completed: false,
        completedByName: "",
        completedByEmailID: "",
        remarks: "",
        remainderDate: null,
      }))
    );

    // Clear errors
    setErrors({});

    // Reset form fields
    setResetKey((prevKey) => prevKey + 1);
    if (formRef.current) {
      formRef.current.reset();
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

    // Check if at least one task is required
    const hasRequiredTask = tasks.some((task) => task.isRequired);
    if (!hasRequiredTask) {
      dispatchToast(
        <Toast>
          <ToastTitle>Validation Error</ToastTitle>
          <ToastBody>At least one task must be marked as required</ToastBody>
        </Toast>,
        { intent: "warning" }
      );
      return false;
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleHiredEmployeeSelect = (employee: HiredEmployee | null) => {
    if (employee) {
      setFormData((prevValue) => ({
        ...prevValue,
        employeeName: employee.CandidateName,
        mailId: employee.CandidateEmail,
        group: employee.Department,
        designation: employee.Desination,
        userId: employee.CandidateID,
        location:employee.Location,
        doj: employee.DateOfJoining 
  ? new Date(employee.DateOfJoining).toISOString() 
  : ""
        
      }))
    }
    else{
     setFormData((prevValue) => ({
        ...prevValue,
        employeeName: "",
        mailId: "",
        group: "",
        designation: "",
        userId: "",
        location:"",
        doj:""
      }))
    }

  }

  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        // Validate email first
        const validationResponse = await inductionAPI.validateInductionDetails(
          formData.userId,
          
          accessToken
        );

        if (validationResponse && validationResponse.length > 0) {
          dispatchToast(
            <Toast>
              <ToastTitle>Error</ToastTitle>
              <ToastBody>
                An Induction request for this email already exists. Please check
                and try again.
              </ToastBody>
            </Toast>,
            { intent: "error" }
          );
          return;
        }

        // Filter tasks that are required
        const filteredTasks = tasks.filter((task) => task.isRequired);
        await refreshToken().then(async (result: any) => {
          const response = await inductionAPI.submitInduction(
            formData,
            filteredTasks,
            currentUser.userID,
            accessToken
          );

          if (response.success) {
            dispatchToast(
              <Toast>
                <ToastTitle>Success</ToastTitle>
                <ToastBody>Induction request submitted successfully</ToastBody>
              </Toast>,
              { timeout: 5000, intent: "success" }
            );

            resetForm();
            setTimeout(() => {
              navigate("/Induction");
            }, 3000);
          }
          // console.log(formData);
          // console.log(currentUser);

          await createInductionNotification(formData, currentUser, accessToken);
        });
      } catch (error) {
        console.error("Error submitting form:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Error</ToastTitle>
            <ToastBody>
              An error occurred while submitting the induction request
            </ToastBody>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      dispatchToast(
        <Toast>
          <ToastTitle>Validation Error</ToastTitle>
          <ToastBody>Please fill in all required fields</ToastBody>
        </Toast>,
        { intent: "warning" }
      );
    }
  };

  // Show loading skeleton while data is being fetched
  if (isLoading) {
    return <EmployeeInductionSkeleton />;
  }

  return (
    <div>
      <div className="flex flex-col gap-[16px]">
        {isSubmitting && (
          <div className={styles.loadingOverlay}>
            <Spinner
              label="Submitting induction request..."
              labelPosition="below"
            />
          </div>
        )}

        <form ref={formRef}>
          <div className={styles.formContainer}>
            <div
              className="flex items-center justify-start gap-[6px] h-[60px] px-[20px] w-[100%]"
              style={{
                background: "linear-gradient(90deg, #EEF2FF 0%, #FAF5FF 100%)",
                border: "1px solid #E5E7EB",
                borderRadius: "8px 8px 0px 0px",
              }}
            >
              <Avatar
                size={32}
                icon={<People20Regular color="#fff" />}
                color="brand"
                style={{ backgroundColor: "#0C59A4" }}
              />
              <Subtitle2>Employee Onboarding Details</Subtitle2>
            </div>

            <div className="grid md:grid-cols-2 grid-col-1 gap-6 w-[97%]" style={{ overflow: "visible", position: "relative", zIndex: 100 }}>
              <div style={{ overflow: "visible", position: "relative", zIndex: 100 }}>
                <UserCombobox
                  label="Employee Name"
                  placeholder="Enter Employee Name"
                  required
                  value={formData.employeeName}
                  onUserSelect={handleHiredEmployeeSelect}
                  disabled={false}

                />
              </div>

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
                placeholder="Select Employee Department"
                required
                disabled={true}
                validationState={errors.group ? "error" : "none"}
                validationMessage={errors.group}
              />
            </div>
            <div className="grid md:grid-cols-2 grid-col-1  gap-6 w-[97%]">
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
                placeholder="Employee Designation"
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
                placeholder="Job Location"
                required
                disabled={true}
                validationState={errors.location ? "error" : "none"}
                validationMessage={errors.location}
              />
            </div>
            <div className="grid md:grid-cols-2 grid-col-1  gap-6 w-[97%]">
              <Field
                key={`mailId-${resetKey}`}
                orientation="vertical"
                label={
                  <>
                    <Mail20Regular
                      style={{ marginRight: 6, color: "#0C59A4" }}
                    />{" "}
                    Email Address
                  </>
                }
                required
                className={styles.formField}
                validationState={errors.mailId ? "error" : "none"}
                validationMessage={errors.mailId}
              >
                <Input
                  placeholder="Personal Email Address"
                  value={formData.mailId}
                  onChange={(e) => handleInputChange("mailId", e.target.value)}
                  disabled={true}
                  className={styles.fields}
                />
              </Field>
              <Field
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
                  {" "}
                  <DatePicker
                    placeholder="Select Date of Joining"
                    onSelectDate={(date) =>
                      handleInputChange("doj", date ? new Date(date) : "")
                    }
                    style={{ width: "100%" }}
                    value={formData.doj ? new Date(formData.doj) : null}
                    disabled={isSubmitting}
                    className={styles.fields}
                  />
                </FluentProvider>
              </Field>
            </div>
            <div className="grid md:grid-cols-2 grid-col-1  gap-6 w-[97%]">
              <Field
                key={`status-${resetKey}`}
                orientation="vertical"
                label={
                  <>
                    <Tag20Regular
                      style={{ marginRight: 6, color: "#0C59A4" }}
                    />{" "}
                    Status
                  </>
                }
                className={styles.formField}
                validationState={errors.status ? "error" : "none"}
                validationMessage={errors.status}
              >
                <FluentProvider style={{ background: "transparent" }}>
                  <Dropdown
                    value={formData.status}
                    className={styles.fields}
                    style={{ width: "100%" }}
                    disabled
                    onOptionSelect={(e, data) =>
                      handleInputChange("status", data.selectedOptions[0])
                    }
                  >
                    <Option key="Yet to Onboard" value="Yet to Onboard">
                      Yet to Onboard
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
          {/* <div>
            <Subtitle2>Task Status</Subtitle2>
          </div> */}

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
            <Subtitle2>Onboarding tasks</Subtitle2>
          </div>

          <div
            className="w-[97%] rounded-[8px] mb-[10px]"
            style={{ border: "1px solid #e5e7eb" }}
          >
            <Table size="small" className={styles.table}>
              <TableHeader
                style={{
                  background:
                    "linear-gradient(90deg, #F9FAFB 0%, #F3F4F6 100%)",
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
                    style={{ width: "70px" }}
                    className={styles.cell}
                  >
                    <Body1Strong>Required</Body1Strong>
                  </TableHeaderCell>
                  <TableHeaderCell
                    style={{ width: "70px" }}
                    className={styles.cell}
                  >
                    <Body1Strong>Completed</Body1Strong>
                  </TableHeaderCell>
                  <TableHeaderCell
                    style={{ width: "200px" }}
                    className={styles.cell}
                  >
                    <Body1Strong>Remarks</Body1Strong>
                  </TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task, index) => (
                  <TableRow key={task.id}>
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
                      <div className="flex gap-3 flex-col">
                        {task.assignedUsers && task.assignedUsers.length > 0
                          ? task.assignedUsers.map((user: any) => (
                            <Tag
                              // size="small"
                              key={user.id}
                              shape="rounded"
                              style={{
                                backgroundColor: "transparent",
                                height: "auto",
                              }}
                              media={
                                <Avatar
                                  aria-hidden
                                  name={user.name}
                                  color="colorful"
                                  style={{
                                    borderRadius: "50%",
                                    height: "28px",
                                    width: "28px",
                                  }}
                                />
                              }
                              value={user.name}
                            >
                              <span style={{ fontSize: "smaller" }}>
                                {user.name}
                              </span>
                            </Tag>
                          ))
                          : task.assignedTo
                            .split(";")
                            .filter((name: string) => name.trim())
                            .map((name: string) => (
                              <Tag
                                // size="small"
                                key={name}
                                shape="rounded"
                                style={{
                                  backgroundColor: "transparent",
                                  height: "auto",
                                }}
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
                            ))}
                      </div>
                    </TableCell>
                    <TableCell
                      style={{ width: "80px" }}
                      className={styles.cell}
                    >
                      <SpinButton
                        value={task.quantity}
                        min={1}
                        step={1}
                        disabled={!task.isQuantity || isSubmitting}
                        onChange={(e, data) =>
                          handleTaskChange(
                            index,
                            "quantity",
                            Number(data.value) || 0
                          )
                        }
                      />
                    </TableCell>
                    <TableCell
                      style={{ width: "70px" }}
                      className={styles.cell}
                    >
                      <Checkbox
                        checked={task.isRequired}
                        disabled={isSubmitting}
                        onChange={(e, data) =>
                          handleTaskChange(index, "isRequired", data.checked)
                        }
                      />
                    </TableCell>
                    <TableCell
                      style={{ width: "70px" }}
                      className={styles.cell}
                    >
                      <Checkbox
                        checked={task.completed}
                        disabled={isSubmitting}
                        onChange={(e, data) =>
                          handleTaskChange(index, "completed", data.checked)
                        }
                      />
                    </TableCell>
                    <TableCell
                      style={{ width: "200px" }}
                      className={styles.cell}
                    >
                      <Textarea
                        className={styles.input}
                        value={task.remarks}
                        placeholder="Comments"
                        disabled={isSubmitting}
                        onChange={(e) =>
                          handleTaskChange(index, "remarks", e.target.value)
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className={styles.buttonContainer}>
          <Button
            appearance="secondary"
            onClick={resetForm}
            disabled={isSubmitting}
            style={{ borderRadius: "30px" }}
          >
            Reset
          </Button>
          <Button
            appearance="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{
              background: "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)",
              borderRadius: "30px",
            }}
          >
            {isSubmitting ? (
              <>
                <Spinner size="tiny" style={{ marginRight: "8px" }} />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </div>
      <Toaster toasterId={toastId} />
    </div>
  );
};

export default EmployeeInductionForm;
