import React, { useState, useEffect, FC } from "react";
import {
  Button,
  Input,
  Combobox,
  ComboboxProps,
  useComboboxFilter,
  Field,
  Spinner,
  Body1Strong,
  Text,
  Caption1,
  useId,
  useToastController,
  Toaster,
  Toast,
  ToastTitle,
  Subtitle2,
  Body1,
  FluentProvider,
  Option,
  Persona,
  Card,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Label,
  CardFooter,
  Tooltip,
} from "@fluentui/react-components";
import {
  CalendarLtr20Regular,
  Mail20Regular,
  Phone20Regular,
  ArrowExportRtlRegular,
  Person20Regular,
  Info20Regular,
  Document20Regular,
  Briefcase20Regular,
  Building20Regular,
  Location20Regular,
  People20Regular,
} from "@fluentui/react-icons";

// Import your API functions
import {
  searchUsersWithDetails,
  createEmployeeExit,
  UserDetails,
  EmployeeExitCreate,
  uploadMultipleFiles,
  getExitFiles,
  deleteFile,
  downloadFile,
  FileAttachment,
  createEmployeeExitNotification,
} from "../../Services/Offboarding";
import { FileUpload } from "../Component/FileUpload";
import { getCombinedDepartments } from "../../Services/Department";
import { getCombinedLocations } from "../../Services/Location";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { useAuth } from "../../Auth/AuthProvider";
import { useNavigate } from "react-router-dom";

interface FormData {
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  workLocation: string;
  groupName: string;
  managerUserID?: string;
  joiningDate?: string;
  resignationDate: string;
  relievingDate: string;
  noticePeriod: string;
  personalMailID: string;
}

interface ValidationErrors {
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  workLocation?: string;
  groupName?: string;
  managerUserID?: string;
  joiningDate?: string;
  resignationDate?: string;
  relievingDate?: string;
  personalMailID?: string;
}

interface UserComboboxProps {
  label: string;
  placeholder: string;
  value: string;
  onUserSelect: (user: UserDetails | null) => void;
  required?: boolean;
  disabled?: boolean;
  validationState?: "error" | "warning" | "success" | "none";
  validationMessage?: string;
  icon?: React.ReactNode;
}

interface FilterComboboxProps {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  validationState?: "error" | "warning" | "success" | "none";
  validationMessage?: string;
  icon?: React.ReactNode;
}


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
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { accessToken, refreshToken }: any = useAuth();
  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.length < 2 || disabled) {
        setUsers([]);
        return;
      }

      setLoading(true);
      try {
        const results = await searchUsersWithDetails(query, accessToken);
        setUsers(results);
        setIsOpen(true);
      } catch (error) {
        console.error("Error searching users:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const onOptionSelect: ComboboxProps["onOptionSelect"] = (e, data) => {
    const selectedUser = users.find((u) => u.id === data.optionValue);
    if (selectedUser) {
      setQuery(selectedUser.displayName);
      onUserSelect(selectedUser);
      setIsOpen(false);
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
    // console.log("loading");
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
    // console.log("Field is disabled");
    if (disabled) {
      return (
        <Option text="Field is disabled" disabled>
          Field is disabled
        </Option>
      );
    }
    // console.log("Type at least 2");
    if (query.length < 2) {
      return (
        <Option text="Type at least 2 characters to search" disabled>
          Type at least 2 characters to search
        </Option>
      );
    }

    if (users.length === 0 && query.length >= 2) {
      // console.log(users);
      return (
        <Option text="No users found matching" disabled>
          No users found matching
        </Option>
      );
    }
    // console.log("found");
    return users.map((user) => (
      <Option key={user.id} value={user.id} text={user.displayName}>
        <Persona
          avatar={{ color: "colorful", "aria-hidden": true }}
          name={user.displayName}
          secondaryText={user.email}
        />
      </Option>
    ));
  };

  return (
    <Field
      orientation="vertical"
      label={
        <>
          {icon} {label}
        </>
      }
      required={required}
      className="flex-1 w-full"
      validationState={validationState}
      validationMessage={validationMessage}
    >
      {/* <Label required={required}>{icon} {label}</Label> */}
      <Combobox
        className="w-full min-w-[100px]"
        onOptionSelect={onOptionSelect}
        placeholder={placeholder}
        onChange={handleInputChange}
        value={query}
        disabled={disabled}
        open={
          isOpen &&
          (users.length > 0 ||
            loading ||
            query.length < 2 ||
            (users.length === 0 && query.length >= 2))
        }
        onOpenChange={(e, data) => setIsOpen(data.open)}
      >
        {renderContent()}
      </Combobox>
    </Field>
  );
};

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
  icon,
}) => {
  const [query, setQuery] = useState<string>(value || "");

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
    <Field
      orientation="vertical"
      label={
        <>
          {icon} {label}
        </>
      }
      required={required}
      className="flex-1 w-full"
      validationState={validationState}
      validationMessage={validationMessage}
    >
      {/* <Label required={required}>{icon} {label}</Label> */}
      <Combobox
        className="w-full min-w-[100px]"
        onOptionSelect={onOptionSelect}
        placeholder={placeholder}
        onChange={handleInputChange}
        value={query}
        disabled={disabled}
      >
        {children}
      </Combobox>
    </Field>
  );
};

const OffboardingForm: FC = () => {
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    designation: "",
    workLocation: "",
    groupName: "",
    managerUserID: "",
    joiningDate: "",
    resignationDate: "",
    relievingDate: "",
    noticePeriod: "",
    personalMailID: "",
  });

  const [managerDetails, setManagerDetails] = useState<UserDetails | null>(
    null
  );
  const [departments, setDepartments] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState<boolean>(
    true
  );
  const navigate = useNavigate()
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(true);
  let { currentUser, accessToken, refreshToken }: any = useAuth();
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [exitId, setExitId] = useState<string | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState<boolean>(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); // Store files before submission
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Load departments and locations on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [depts, locs] = await Promise.all([
          getCombinedDepartments(accessToken),
          getCombinedLocations(accessToken),
        ]);
        setDepartments(depts.map((d: any) => d.Name));
        setLocations(locs.map((l: any) => l.Name));
      } catch (error) {
        console.error("Error loading data:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to load departments and locations</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setIsLoadingDepartments(false);
        setIsLoadingLocations(false);
      }
    };
    loadData();
  }, []);

  // Load existing files when exitId is set
  useEffect(() => {
    const loadExistingFiles = async () => {
      if (exitId) {
        try {
          const files = await getExitFiles(exitId, accessToken);
          setAttachments(files);
        } catch (error) {
          console.error("Error loading existing files:", error);
        }
      }
    };
    loadExistingFiles();
  }, [exitId]);

  const handleUserSelect = (user: UserDetails | null) => {
    if (!user) {
      setFormData({
        ...formData,
        name: "",
        email: "",
        phone: "",
        designation: "",
        workLocation: "",
        groupName: "",
        managerUserID: "",
        joiningDate: "",
      });
      setManagerDetails(null);
      return;
    }

    setFormData({
      ...formData,
      name: user.displayName,
      email: user.email ,
      phone: user.phone || "",
      designation: user.designation || "",
      workLocation: user.location || "",
      groupName: user.department || "",
      managerUserID: user.managerUserID || "",
      joiningDate: user.joiningDate ? user.joiningDate.split("T")[0] : "",
    });
    setManagerDetails(user.managerDetails || null);

    if (isSubmitted) {
      const newErrors = { ...errors };
      if (user.displayName) delete newErrors.name;
      if (user.email) delete newErrors.email;
      if (user.designation) delete newErrors.designation;
      if (user.location) delete newErrors.workLocation;
      if (user.department) delete newErrors.groupName;
      if (user.managerUserID) delete newErrors.managerUserID;
      if (user.joiningDate) delete newErrors.joiningDate;
      setErrors(newErrors);
    }






    dispatchToast(
      <Toast>
        <ToastTitle>Employee details loaded successfully</ToastTitle>
      </Toast>,
      { intent: "success" }
    );
  };

  const handleManagerSelect = (manager: UserDetails | null) => {
    if (!manager) {
      setFormData({
        ...formData,
        managerUserID: "",
      });
      setManagerDetails(null);
      return;
    }

    setFormData({
      ...formData,
      managerUserID: manager.id,
    });
    setManagerDetails(manager);

    if (isSubmitted && errors.managerUserID) {
      setErrors({
        ...errors,
        managerUserID: undefined,
      });
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });

    if (isSubmitted) {
      setErrors({
        ...errors,
        [field]: undefined,
      });
    }
  };

  useEffect(() => {
    if (formData.resignationDate && formData.relievingDate) {
      const resign = new Date(formData.resignationDate);
      const relieve = new Date(formData.relievingDate);
      const diffTime = Math.abs(relieve.getTime() - resign.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setFormData((prev) => ({ ...prev, noticePeriod: diffDays.toString() }));
    }
  }, [formData.resignationDate, formData.relievingDate]);

  const handleFileUpload = async (files: File[]) => {
    if (!exitId) {
      dispatchToast(
        <Toast>
          <ToastTitle>Please create the Offboarding record first</ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
      return;
    }

    if (!currentUser?.userID) {
      dispatchToast(
        <Toast>
          <ToastTitle>User information not available</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    setIsUploadingFiles(true);
    try {
      const result = await uploadMultipleFiles(
        exitId,
        files,
        currentUser.userID,
        accessToken
      );

      if (result.success) {
        // Refresh file list
        const updatedFiles = await getExitFiles(exitId, accessToken);
        setAttachments(updatedFiles);

        dispatchToast(
          <Toast>
            <ToastTitle>
              {result.files?.length || files.length} file(s) uploaded
              successfully
            </ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to upload files</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleFileDelete = async (blobPath: string) => {
    if (!exitId) return;

    try {
      await deleteFile(exitId, blobPath, accessToken);

      // Refresh file list
      const updatedFiles = await getExitFiles(exitId, accessToken);
      setAttachments(updatedFiles);

      dispatchToast(
        <Toast>
          <ToastTitle>File deleted successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } catch (error) {
      console.error("Error deleting file:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to delete file</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  const handleFileDownload = async (blobPath: string, filename: string) => {
    try {
      const blob = await downloadFile(blobPath, accessToken);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      dispatchToast(
        <Toast>
          <ToastTitle>File downloaded successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } catch (error) {
      console.error("Error downloading file:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to download file</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

const validateForm = (): boolean => {
  try {
    const newErrors: ValidationErrors = {};

    // Required field validations
    if (!formData.name?.trim()) {
      newErrors.name = "Employee name is required";
    }

    if (!formData.email?.trim()) {
      newErrors.email = "Employee email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!formData.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.designation?.trim()) {
      newErrors.designation = "Designation is required";
    }

    if (!formData.workLocation?.trim()) {
      newErrors.workLocation = "Work location is required";
    }

    if (!formData.groupName?.trim()) {
      newErrors.groupName = "Department is required";
    }

    if (!formData.managerUserID?.trim()) {
      newErrors.managerUserID = "Reporting manager is required";
    }

    if (!formData.joiningDate) {
      newErrors.joiningDate = "Date of joining is required";
    }

    if (!formData.resignationDate) {
      newErrors.resignationDate = "Resignation date is required";
    }

    if (!formData.relievingDate) {
      newErrors.relievingDate = "Relieving date is required";
    } else if (formData.resignationDate && formData.relievingDate) {
      const resign = new Date(formData.resignationDate);
      const relieve = new Date(formData.relievingDate);
      if (relieve < resign) {
        newErrors.relievingDate =
          "Relieving date must be after resignation date";
      }
    }

    // Optional field validation
    if (formData.personalMailID) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.personalMailID)) {
        newErrors.personalMailID =
          "Please enter a valid personal email address";
      }
    }

    setErrors(newErrors);
    setIsSubmitted(true);

    if (Object.keys(newErrors).length > 0) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            Please fill in all required fields correctly
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error during form validation:", error);
    dispatchToast(
      <Toast>
        <ToastTitle>Unable to submit the form</ToastTitle>
      </Toast>,
      { intent: "error" }
    );
    return false;
  }
};

  const handleFileSelect = (files: File[]) => {
    setPendingFiles((prev) => [...prev, ...files]);

    dispatchToast(
      <Toast>
        <ToastTitle>{files.length} file(s) selected for upload</ToastTitle>
      </Toast>,
      { intent: "success" }
    );
  };

  // Remove file from pending list
  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create Offboarding record
      const payload: EmployeeExitCreate = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        designation: formData.designation || undefined,
        workLocation: formData.workLocation || undefined,
        groupName: formData.groupName || undefined,
        managerUserID: formData.managerUserID || undefined,
        joiningDate: formData.joiningDate || undefined,
        resignationDate: formData.resignationDate || undefined,
        relievingDate: formData.relievingDate || undefined,
        noticePeriod: formData.noticePeriod
          ? parseInt(formData.noticePeriod)
          : undefined,
        personalMailID: formData.personalMailID || undefined,
        createdByUserID: currentUser.userID,
      };

      const response = await createEmployeeExit(payload, accessToken);

      if (!response.data?.ID) {
        throw new Error("Failed to create Offboarding record - no ID returned");
      }

      const newExitId = response.data.ID;
      await refreshToken().then(async (result: any) => {
        const notification = await createEmployeeExitNotification(
          response.data?.ExitID,
          {...formData,ID: newExitId},
          managerDetails,
          currentUser,
          accessToken
        );
      });
      dispatchToast(
        <Toast>
          <ToastTitle>
            Employee Offboarding record created successfully. Offboarding ID:{" "}
            {response.data?.ExitID || "N/A"}
          </ToastTitle>
        </Toast>,
        { intent: "success" }
      );

      // Step 2: Upload files if any
      if (pendingFiles.length > 0) {
        dispatchToast(
          <Toast>
            <ToastTitle>Uploading {pendingFiles.length} file(s)...</ToastTitle>
          </Toast>,
          { intent: "info" }
        );

        try {
          const uploadResult = await uploadMultipleFiles(
            newExitId,
            pendingFiles,
            currentUser.userID,
            accessToken
          );

          if (uploadResult.success) {
            dispatchToast(
              <Toast>
                <ToastTitle>All files uploaded successfully!</ToastTitle>
              </Toast>,
              { intent: "success" }
            );
          }
        } catch (uploadError) {
          console.error("Error uploading files:", uploadError);
          dispatchToast(
            <Toast>
              <ToastTitle>
                Offboarding record created but some files failed to upload
              </ToastTitle>
            </Toast>,
            { intent: "warning" }
          );
        }
      }

      // Step 3: Reset form and navigate
      dispatchToast(
        <Toast>
          <ToastTitle>Offboarding process completed successfully!</ToastTitle>
        </Toast>,
        { intent: "success" }
      );

      setTimeout(() => {
        window.history.back();
      }, 1500);
    } catch (error) {
      console.error("Error creating employee Offboarding:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to create employee Offboarding record</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      designation: "",
      workLocation: "",
      groupName: "",
      managerUserID: "",
      joiningDate: "",
      resignationDate: "",
      relievingDate: "",
      noticePeriod: "",
      personalMailID: "",
    });
    setManagerDetails(null);
    setErrors({});
    setIsSubmitted(false);
    setPendingFiles([]); // Clear pending files
    setAttachments([]);
  };

  const getValidationState = (
    field: keyof ValidationErrors
  ): "error" | "none" => {
    return errors[field] ? "error" : "none";
  };


  if(isSubmitting){
    return(
      <div className="flex flex-col items-center justify-center py-8 h-full">
          <Spinner />
          <Body1Strong className="mt-2">
            {" "}
            {pendingFiles.length > 0
              ? "Creating Offboarding record and uploading files..."
              : "Submitting form..."}
          </Body1Strong>
        </div>
    )
  }

  return (
    <FluentProvider
      style={{ background: "transparent" }}
      className="flex flex-col gap-5"
    >
      

      {/* Header */}
      {/* <div className="mb-2">
        <Subtitle2>Employee Offboarding Clearance Form</Subtitle2>
        <br />
        <Body1 className="text-gray-600">
          Fill in employee Offboarding details to initiate the offboarding process
        </Body1>
      </div> */}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-10  overflow-y-auto p-1"
      >
        {/* Employee Basic Information */}
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0 !gap-0">
          <div className="flex gap-2 p-4 bg-[#E9F3FF] border-b-2 border-b-[#E5E7EB]">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0C59A4] text-white rounded-full ">
              <Person20Regular />
            </div>
            <div className="flex flex-col">
              <Subtitle2 className="text-gray-900">
                Employee Details
              </Subtitle2>
              <Caption1 className="text-gray-500">
                Basic employee details and contact information
              </Caption1>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1  gap-5">
              <UserCombobox
                label="Employee"
                placeholder="Type name or email to search"
                value={formData.name}
                onUserSelect={handleUserSelect}
                required
                disabled={loading}
                validationState={getValidationState("name")}
                validationMessage={errors.name}
                icon={<Person20Regular />}
              />

              {/* <Field
              orientation="horizontal"
              label="Employee Email"
              required
              className="flex-1 w-full"
              validationState={getValidationState("email")}
              validationMessage={errors.email}
            >
              <Input
                className="w-full min-w-[100px]"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="employee@company.com"
                contentBefore={<Mail20Regular />}
                disabled={loading}
              />
            </Field> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
              <Field
                orientation="vertical"
                label={
                  <>
                    <Phone20Regular /> Phone number
                  </>
                }
                required
                className="flex-1 w-full "
                validationState={getValidationState("phone")}
                validationMessage={errors.phone}
              >
                {/* <Label required></Label> */}
                <Input
                  className="w-full min-w-[100px]"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1234567890"
                  // contentBefore={<Phone20Regular />}
                  disabled={loading}
                />
              </Field>

              <Field
                orientation="vertical"
                label={
                  <>
                    <Briefcase20Regular /> Designation
                  </>
                }
                required
                className="flex-1 w-full "
                validationState={getValidationState("designation")}
                validationMessage={errors.designation}
              >
                {/* <Label required><Briefcase20Regular /> Designation</Label> */}
                <Input
                  className="w-full min-w-[100px]"
                  value={formData.designation}
                  onChange={(e) =>
                    handleInputChange("designation", e.target.value)
                  }
                  placeholder="Enter designation"
                  disabled={loading}
                />
              </Field>


               <FilterCombobox
                label="Department"
                options={departments}
                value={formData.groupName}
                onChange={(value) => handleInputChange("groupName", value)}
                placeholder={
                  isLoadingDepartments ? "Loading..." : "Select department"
                }
                required
                disabled={loading || isLoadingDepartments}
                validationState={getValidationState("groupName")}
                validationMessage={errors.groupName}
                icon={<Building20Regular />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
             

              <FilterCombobox
                label="Work Location"
                options={locations}
                value={formData.workLocation}
                onChange={(value) => handleInputChange("workLocation", value)}
                placeholder={
                  isLoadingLocations ? "Loading..." : "Select location"
                }
                required
                disabled={loading || isLoadingLocations}
                validationState={getValidationState("workLocation")}
                validationMessage={errors.workLocation}
                icon={<Location20Regular />}
              />

              <div>
                <UserCombobox
                  label="Reporting Manager"
                  placeholder="Search and select manager"
                  value={managerDetails?.displayName || ""}
                  onUserSelect={handleManagerSelect}
                  required
                  disabled={loading}
                  validationState={getValidationState("managerUserID")}
                  validationMessage={errors.managerUserID}
                  icon={<People20Regular />}
                />
              </div>

              <Field
                orientation="vertical"
                label={
                  <>
                    <Mail20Regular /> Work Email Address
                  </>
                }
                className="flex-1 w-full"
                validationState={getValidationState("personalMailID")}
                validationMessage={errors.personalMailID}
              >
                {/* <Label required> <Mail20Regular /> Personal Email ID</Label> */}
                <Input
                  className="w-full min-w-[100px]"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    handleInputChange("email", e.target.value)
                  }
                  placeholder="work@email.com"
                  // contentBefore={<Mail20Regular />}
                  // disabled={true}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
              

              <Field
                orientation="vertical"
                label={
                  <>
                    <Mail20Regular /> Personal Email Address
                  </>
                }
                className="flex-1 w-full"
                validationState={getValidationState("personalMailID")}
                validationMessage={errors.personalMailID}
              >
                {/* <Label required> <Mail20Regular /> Personal Email ID</Label> */}
                <Input
                  className="w-full min-w-[100px]"
                  type="email"
                  value={formData.personalMailID}
                  onChange={(e) =>
                    handleInputChange("personalMailID", e.target.value)
                  }
                  placeholder="personal@email.com"
                  // contentBefore={<Mail20Regular />}
                  disabled={loading}
                />
              </Field>
            </div>
          </div>
        </Card>

        {/* Offboarding Details Section */}
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0 !gap-0">
          <div className="flex gap-2 p-4 bg-[#E9F3FF] border-b-2 border-b-[#E5E7EB]">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0C59A4] text-white rounded-full">
              <CalendarLtr20Regular />
            </div>
            <div className="flex flex-col">
              <Subtitle2 className="text-gray-900">
                Offboarding Timeline
              </Subtitle2>
              <Caption1 className="text-gray-500">
                Important dates for the offboarding process
              </Caption1>
            </div>
          </div>

          <div className="p-4 flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <Field
                orientation="vertical"
                label={
                  <>
                    <CalendarLtr20Regular /> Date of Joining
                  </>
                }
                required
                className="flex-1 w-full "
                validationState={getValidationState("joiningDate")}
                validationMessage={errors.joiningDate}
              >
                {/* <Label required> <CalendarLtr20Regular /> Date of Joining</Label> */}
                <DatePicker
                  className="w-full min-w-[100px]"
                  placeholder="Select joining date"
                  value={
                    formData.joiningDate
                      ? new Date(formData.joiningDate + "T00:00:00")
                      : null
                  }
                  onSelectDate={(date: any) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateStr = `${year}-${month}-${day}`;
                      handleInputChange("joiningDate", dateStr);
                    } else {
                      handleInputChange("joiningDate", "");
                    }
                  }}
                  disabled={loading}
                />
              </Field>

              <Field
                orientation="vertical"
                label={
                  <>
                    <CalendarLtr20Regular /> Resignation Submission Date
                  </>
                }
                required
                className="flex-1 w-full "
                validationState={getValidationState("resignationDate")}
                validationMessage={errors.resignationDate}
              >
                {/* <Label required> <CalendarLtr20Regular /> Resignation Date</Label> */}
                <DatePicker
                  className="w-full min-w-[100px]"
                  placeholder="Select Resignation Submission Date"
                  value={
                    formData.resignationDate
                      ? new Date(formData.resignationDate + "T00:00:00")
                      : null
                  }
                  onSelectDate={(date: any) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateStr = `${year}-${month}-${day}`;
                      handleInputChange("resignationDate", dateStr);
                    } else {
                      handleInputChange("resignationDate", "");
                    }
                  }}
                  disabled={loading}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <Field
                orientation="vertical"
                label={
                  <>
                    <CalendarLtr20Regular /> Last Working Day
                  </>
                }
                required
                className="flex-1 w-full "
                validationState={getValidationState("relievingDate")}
                validationMessage={errors.relievingDate}
              >
                {/* <Label required></Label> */}
                <DatePicker
                  className="w-full min-w-[100px] !h-fit"
                  placeholder="Select Last Working Day"
                  value={
                    formData.relievingDate
                      ? new Date(formData.relievingDate + "T00:00:00")
                      : null
                  }
                  onSelectDate={(date: any) => {
                    if (date) {
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(
                        2,
                        "0"
                      );
                      const day = String(date.getDate()).padStart(2, "0");
                      const dateStr = `${year}-${month}-${day}`;
                      handleInputChange("relievingDate", dateStr);
                    } else {
                      handleInputChange("relievingDate", "");
                    }
                  }}
                  minDate={
                    formData.resignationDate
                      ? new Date(formData.resignationDate + "T00:00:00")
                      : undefined
                  }
                  disabled={loading}
                />
              </Field>

              <Field
                orientation="vertical"
                label={
                  <>
                    <Tooltip
                      relationship={"label"}
                      content="Automatically calculated from resignation and relieving dates"
                    >
                      <Info20Regular />
                    </Tooltip>{" "}
                    Notice Period (Days)
                  </>
                }
                className="flex-1 w-full "
                validationState="none"
                validationMessage=""
              >
                {/* <Label> <Info20Regular /> Notice Period (Days)</Label> */}
                <Input
                  className="w-full min-w-[100px] !p-1"
                  type="number"
                  value={formData.noticePeriod}
                  placeholder="Calculated automatically"
                  disabled
                />
              </Field>
            </div>
          </div>
        </Card>

        {/* File Upload Section */}
        {/* <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0 !gap-0 !min-h-[30vh]">
          <div className="flex gap-2 p-4 bg-[#E9F3FF] border-b-2 border-b-[#E5E7EB]">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0C59A4] text-white rounded-full">
              <Document20Regular />
            </div>
            <div className="flex flex-col">
              <Subtitle2 className="text-gray-900">
                Knowledge Transfer Documents
              </Subtitle2>
              <Caption1 className="text-gray-500">
                Upload relevant documents for the Offboarding clearance
              </Caption1>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4">
            <div id="file-upload-section">
              {!exitId && (
                <MessageBar
                  icon={null}
                  shape="rounded"
                  className="!bg-yellow-100/30 !mb-2 !p-3 !rounded-xl !border-1 !border-yellow-200"
                >
                  <MessageBarBody className="flex flex-row gap-2" color="">
                    <Info20Regular className="!text-yellow-800" />
                    <div className="flex flex-col gap-1">
                      <MessageBarTitle className="!text-yellow-800 !text-sm">
                        Submit the form first to enable file uploads
                      </MessageBarTitle>
                      <Text className="!text-yellow-700 !text-xs">
                        You'll be able to upload documents after submitting the
                        initial form details
                      </Text>
                    </div>
                  </MessageBarBody>
                </MessageBar>
              )}
              <Field
                label="Knowledge Transfer Documents"
                validationMessage={
                  !exitId
                    ? "Submit the form first to enable file uploads"
                    : undefined
                }
                validationState={!exitId ? "warning" : "none"}
              >
                <FileUpload
                  onFilesSelected={handleFileSelect} // Just collect files, don't upload
                  attachments={pendingFiles.map((file, index) => ({
                    id: `pending-${index}`,
                    filename: file.name,
                    size: file.size,
                    mimeType: file.type,
                    uploadedAt: new Date().toISOString(),
                    blobPath: "", // Not uploaded yet
                    url: "", // Not uploaded yet
                  }))}
                  onDelete={(blobPath) => {
                    // Extract index from id
                    const index = parseInt(blobPath.replace("pending-", ""));
                    handleRemovePendingFile(index);
                  }}
                  onDownload={() => {
                    dispatchToast(
                      <Toast>
                        <ToastTitle>Files not uploaded yet</ToastTitle>
                      </Toast>,
                      { intent: "info" }
                    );
                  }}
                  disabled={isSubmitting}
                  maxFiles={10}
                  maxFileSize={10 * 1024 * 1024}
                  acceptedFileTypes={[
                    ".pdf",
                    ".doc",
                    ".docx",
                    ".xls",
                    ".xlsx",
                    ".png",
                    ".jpg",
                    ".jpeg",
                  ]}
                />
              </Field>

              {exitId && attachments.length === 0 && (
                <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-md">
                  <Text className="text-green-800">
                    ✓ Offboarding record created. You can now upload documents.
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Card> */}

        {/* Information message when exitId is not available */}

        {/* Action Buttons */}
        <div className="flex justify-between bg-white  w-full items-center p-4">
          <div>
            <Button
              appearance="subtle"
              onClick={() => window.history.back()}
              disabled={loading || isUploadingFiles}
              icon={<ArrowExportRtlRegular />}
              type="button"
            >
              Back
            </Button>
          </div>
          <CardFooter>
            <div className="flex justify-end gap-2 .5 ">
              <Button
                onClick={handleReset}
                disabled={loading || isUploadingFiles}
                type="button"
                className="!rounded-3xl"
                size="large"
              >
                Reset
              </Button>
              {loading || isUploadingFiles ? (
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={loading || isUploadingFiles}
                  className="!bg-gray-200 !text-gray-100 !rounded-3xl !border-0"
                  size="large"
                >
                  {loading ? "Submitting..." : exitId ? "Update" : "Submit"}
                </Button>
              ) : (
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={loading || isUploadingFiles}
                  className="!bg-gradient-to-r !from-[#0153A5] !to-[#2FC2FE] !text-white !rounded-3xl !border-0"
                  size="large"
                >
                  {loading ? "Submitting..." : exitId ? "Update" : "Submit"}
                </Button>
              )}
            </div>
          </CardFooter>
        </div>
      </form>

      <Toaster toasterId={toasterId} />
    </FluentProvider>
  );
};

export default OffboardingForm;
