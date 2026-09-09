import React, { useState, useEffect, FC } from "react";
import {
  Button,
  Input,
  Combobox,
  ComboboxProps,
  useComboboxFilter,
  Field,
  Spinner,
  Text,
  useId,
  useToastController,
  Toaster,
  Toast,
  ToastTitle,
  Subtitle2,
  Body1,
  FluentProvider,
  Option,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Checkbox,
  Body1Strong,
  Persona,
  Card,
  Tooltip,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  CardFooter,
  Caption1,
} from "@fluentui/react-components";
import {
  Mail20Regular,
  Phone20Regular,
  ArrowExportRtlRegular,
  Delete20Regular,
  Person20Regular,
  Info20Regular,
  Info12Regular,
  CalendarLtr20Regular,
  Document20Regular,
  Briefcase20Regular,
  Building20Regular,
  Location20Regular,
  People20Regular,
} from "@fluentui/react-icons";
import { useNavigate, useParams } from "react-router-dom";

// Import your API functions
import {
  searchUsersWithDetails,
  updateEmployeeExit,
  UserDetails,
  EmployeeExitUpdate,
  uploadMultipleFiles,
  getExitFiles,
  deleteFile,
  downloadFile,
  FileAttachment,
  getEmployeeExitByID,
  updateDepartmentApproval,
  sendHRKTValidatedNotification,
} from "../../Services/Offboarding";
import { FileUpload } from "../Component/FileUpload";
import { getCombinedDepartments } from "../../Services/Department";
import { getCombinedLocations } from "../../Services/Location";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { useAuth } from "../../Auth/AuthProvider";
import HorizontalCustomStepper from "../Component/HorizontalCustomStepper";

interface FormData {
  name: string;
  email: string;
  phone: string;
  designation: string;
  workLocation: string;
  groupName: string;
  managerUserID: string;
  joiningDate: string;
  resignationDate: string;
  relievingDate: string;
  noticePeriod: string;
  personalMailID: string;
  status: string;
  hrStatus: string;
  iTStatus: string;
  adminStatus: string;
  financeStatus: string;
  headKtStatus: string;
  headStatus: string;
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
  ManagerUserIDDetails?: UserDetailsmain;
  CreatedByUserIDDetails?: UserDetailsmain;
  HeadUserIDDetails?: UserDetailsmain;
  ITUserIDDetails?: UserDetailsmain;
  AdminUserIDDetails?: UserDetailsmain;
  HrUserIDDetails?: UserDetailsmain;
  FinanceUserIDDetails?: UserDetailsmain;
  ActivitiesCount?: number;
}

export interface UserDetailsmain {
  id: string;
  displayName: string;
  email: string;
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

    if (users.length === 0 && query.length >= 2) {
      return (
        <Option text="No users found matching" disabled>
          No users found matching
        </Option>
      );
    }

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
      className="flex-1 w-full "
      validationState={validationState}
      validationMessage={validationMessage}
    >
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

const ExistingOffboardingClearance: FC = () => {
  const { Id }: any = useParams();
  const navigate = useNavigate();
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
    status: "Pending",
    hrStatus: "Pending",
    headStatus: "Pending",
    headKtStatus: "Pending",
    iTStatus: "Pending",
    adminStatus: "Pending",
    financeStatus: "Pending",
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
  const [Exits, setExits] = useState<EmployeeExit>();
  const [isLoadingLocations, setIsLoadingLocations] = useState<boolean>(true);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);
  let { currentUser, accessToken, refreshToken }: any = useAuth();
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState<boolean>(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isKTDialogOpen, setIsKTDialogOpen] = useState(false);

  const canEditOffboarding =
    currentUser?.permissions?.offboarding?.offboarding_manage
      ?.edit_offboarding === true;
  const canDeleteOffboarding =
    currentUser?.permissions?.offboarding?.offboarding_manage
      ?.delete_offboarding === true;
  const isHRSectionDisabled =
    formData.adminStatus !== "Completed" ||
    formData.hrStatus === "Completed" ||
    !canEditOffboarding; // Add this line
  const isEditingDisabled =
    formData.status === "Completed" ||
    formData.status === "Locked" ||
    !canEditOffboarding;
  useEffect(() => {
    const loadExistingData = async () => {
      if (!Id) return;

      setIsLoadingData(true);
      try {
        const response = await getEmployeeExitByID(Id, accessToken);
        const exitData = response.data || response;

        setExits(exitData);
        setFormData({
          name: exitData.Name || "",
          email: exitData.Email || "",
          phone: exitData.Phone || "",
          designation: exitData.Designation || "",
          workLocation: exitData.WorkLocation || "",
          groupName: exitData.GroupName || "",
          managerUserID: exitData.ManagerUserID || "",
          joiningDate: exitData.JoiningDate
            ? exitData.JoiningDate.split("T")[0]
            : "",
          resignationDate: exitData.ResignationDate
            ? exitData.ResignationDate.split("T")[0]
            : "",
          relievingDate: exitData.RelievingDate
            ? exitData.RelievingDate.split("T")[0]
            : "",
          noticePeriod: exitData.NoticePeriod?.toString() || "",
          personalMailID: exitData.PersonalMailID || "",
          status: exitData.Status || "Pending",
          hrStatus: exitData.HRStatus || "Pending",
          iTStatus: exitData.ITStatus || "Pending",
          adminStatus: exitData.AdminStatus || "Pending",
          financeStatus: exitData.FinanceStatus || "Pending",
          headKtStatus: exitData.HeadKtStatus || "Pending",
          headStatus: exitData.HeadStatus || "Pending"
        });

        if (exitData.ManagerUserIDDetails) {
          setManagerDetails({
            id: exitData.ManagerUserIDDetails.id,
            displayName: exitData.ManagerUserIDDetails.displayName || "",
            email: exitData.ManagerUserIDDetails.email || "",
          });
        } else if (exitData.ManagerUserID) {
          setManagerDetails({
            id: exitData.ManagerUserID,
            displayName: "",
            email: "",
          });
        }

        dispatchToast(
          <Toast>
            <ToastTitle>Offboarding record loaded successfully</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } catch (error) {
        console.error("Error loading Offboarding data:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to load Offboarding record</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setIsLoadingData(false);
      }
    };

    loadExistingData();
  }, [Id]);

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

  useEffect(() => {
    const loadExistingFiles = async () => {
      if (Id) {
        try {
          setIsUploadingFiles(true);
          const files = await getExitFiles(Id, accessToken);
          setAttachments(files);
        } catch (error) {
          console.error("Error loading existing files:", error);
        } finally {
          setIsUploadingFiles(false);
        }
      }
    };
    loadExistingFiles();
  }, [Id]);

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
      email: user.email,
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

  const handleFileDelete = async (blobPath: string) => {
    if (!Id) return;

    try {
      await deleteFile(Id, blobPath, accessToken);
      const updatedFiles = await getExitFiles(Id, accessToken);
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


  const handleDialogOpen = () => {
    // console.log("trigger dialog open")
    setIsKTDialogOpen(true)
  }

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Employee name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Employee email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }

    if (!formData.designation.trim()) {
      newErrors.designation = "Designation is required";
    }

    if (!formData.workLocation.trim()) {
      newErrors.workLocation = "Work location is required";
    }

    if (!formData.groupName.trim()) {
      newErrors.groupName = "Department is required";
    }

    if (!formData.managerUserID.trim()) {
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
          <ToastTitle>Please fill in all required fields correctly</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return false;
    }

    return true;
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

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!canEditOffboarding) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            You don't have permission to edit offboarding records
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    if (!validateForm()) {
      return;
    }
    if (!Id) {
      dispatchToast(
        <Toast>
          <ToastTitle>Offboarding ID not found</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: EmployeeExitUpdate = {
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
        modifiedByUserID: currentUser.userID,
      };

      const response = await updateEmployeeExit(Id, payload, accessToken);

      dispatchToast(
        <Toast>
          <ToastTitle>
            Employee Offboarding record updated successfully
          </ToastTitle>
        </Toast>,
        { intent: "success" }
      );

      if (pendingFiles.length > 0) {
        dispatchToast(
          <Toast>
            <ToastTitle>Uploading {pendingFiles.length} file(s)...</ToastTitle>
          </Toast>,
          { intent: "info" }
        );

        try {
          const uploadResult = await uploadMultipleFiles(
            Id,
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

            const updatedFiles = await getExitFiles(Id, accessToken);
            setAttachments(updatedFiles);
            setPendingFiles([]);
          }
        } catch (uploadError) {
          console.error("Error uploading files:", uploadError);
          dispatchToast(
            <Toast>
              <ToastTitle>
                Offboarding record updated but some files failed to upload
              </ToastTitle>
            </Toast>,
            { intent: "warning" }
          );
        }
      }

      dispatchToast(
        <Toast>
          <ToastTitle>Update completed successfully!</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } catch (error) {
      console.error("Error updating employee Offboarding:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to update employee Offboarding record</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (Id) {
      window.location.reload();
    }
  };

  const handleDelete = async () => {
    if (!canDeleteOffboarding) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            You don't have permission to delete offboarding records
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      setIsDeleteDialogOpen(false);
      return;
    }
    setIsDeleteDialogOpen(false);
    dispatchToast(
      <Toast>
        <ToastTitle>Delete functionality not yet implemented</ToastTitle>
      </Toast>,
      { intent: "info" }
    );
  };

  const handleHRKTConfirm = async () => {
    if (!canEditOffboarding) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            You don't have permission to confirm HR clearance
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      setIsKTDialogOpen(false);
      return;
    }

    // if (attachments.length === 0 && pendingFiles.length === 0) {
    //   dispatchToast(
    //     <Toast>
    //       <ToastTitle>Please attach KT documents before confirming</ToastTitle>
    //     </Toast>,
    //     { intent: "warning" }
    //   );
    //   return;
    // } commenting since KT clearence is a separate stage

    setIsSubmitting(true);
    try {
      if (pendingFiles.length > 0 && Id) {
        await uploadMultipleFiles(
          Id,
          pendingFiles,
          currentUser.userID,
          accessToken
        );
        setPendingFiles([]);
        const updatedFiles = await getExitFiles(Id, accessToken);
        setAttachments(updatedFiles);
      }

      await updateDepartmentApproval(
        Id,
        "HR",
        {
          approverUserID: currentUser.userID,
          remarks: "Knowledge Transfer documents verified and approved",
        },
        accessToken
      );

      await refreshToken().then(async (result: any) => {
        await sendHRKTValidatedNotification(Exits, currentUser, accessToken);
      });

      dispatchToast(
        <Toast>
          <ToastTitle>HR clearance confirmed successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );

      setIsKTDialogOpen(false);

      const response = await getEmployeeExitByID(Id, accessToken);
      const exitData = response.data || response;
      setExits(exitData);
      setFormData({
        name: exitData.Name || "",
        email: exitData.Email || "",
        phone: exitData.Phone || "",
        designation: exitData.Designation || "",
        workLocation: exitData.WorkLocation || "",
        groupName: exitData.GroupName || "",
        managerUserID: exitData.ManagerUserID || "",
        joiningDate: exitData.JoiningDate
          ? exitData.JoiningDate.split("T")[0]
          : "",
        resignationDate: exitData.ResignationDate
          ? exitData.ResignationDate.split("T")[0]
          : "",
        relievingDate: exitData.RelievingDate
          ? exitData.RelievingDate.split("T")[0]
          : "",
        noticePeriod: exitData.NoticePeriod?.toString() || "",
        personalMailID: exitData.PersonalMailID || "",
        status: exitData.Status || "Pending",
        hrStatus: exitData.HRStatus || "Pending",
        headKtStatus: exitData.HeadKtStatus || "Pending",
        iTStatus: exitData.ITStatus || "Pending",
        adminStatus: exitData.AdminStatus || "Pending",
        financeStatus: exitData.FinanceStatus || "Pending",
        headStatus: exitData.HeadStatus
      });
    } catch (error) {
      console.error("Error confirming HR status:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to confirm HR clearance</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getValidationState = (
    field: keyof ValidationErrors
  ): "error" | "none" => {
    return errors[field] ? "error" : "none";
  };

  const allFiles: FileAttachment[] = [
    ...attachments,
    ...pendingFiles.map((file, index) => ({
      id: `pending-${index}`,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      blobPath: `pending-${index}`,
      url: "",
    })),
  ];

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">
          Loading Offboarding record...
        </Body1Strong>
      </div>
    );
  }

  return (
    <FluentProvider
      style={{ background: "transparent" }}
      className="flex flex-col gap-5"
    >
      {isSubmitting && (
        <div className="flex flex-col items-center justify-center py-8 h-full">
          <Spinner />
          <Body1Strong className="mt-2">
            {pendingFiles.length > 0
              ? "Updating Offboarding record and uploading files..."
              : "Updating form..."}
          </Body1Strong>
        </div>
      )}

      <div>
        <HorizontalCustomStepper activeStep={3} data={Exits} />
      </div>
      {!canEditOffboarding && (
        <MessageBar
          icon={<Info20Regular />}
          shape="rounded"
          className="!bg-blue-100/30 !mb-4 !p-3 !rounded-xl !border-1 !border-blue-200"
        >
          <MessageBarBody className="flex flex-row gap-2">
            <div className="flex flex-col gap-1">
              <MessageBarTitle className="!text-blue-800 !text-sm">
                View-Only Mode
              </MessageBarTitle>
              <Text className="!text-blue-700 !text-xs">
                You don't have permission to edit this offboarding record.
                Contact your administrator for edit permissions.
              </Text>
            </div>
          </MessageBarBody>
        </MessageBar>
      )}
      <div className="flex flex-col gap-10 overflow-y-auto p-1">
        {/* Employee Basic Information */}
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0 !gap-0">
          <div className="flex gap-2 p-4 bg-[#E9F3FF] border-b-2 border-b-[#E5E7EB]">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0C59A4] text-white rounded-full">
              <Person20Regular />
            </div>
            <div className="flex flex-col">
              <Subtitle2 className="text-gray-900">
                Employee Basic Information
              </Subtitle2>
              <Caption1 className="text-gray-500">
                Basic employee details and contact information
              </Caption1>
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 gap-5">
              <UserCombobox
                label="Employee"
                placeholder="Type name or email to search"
                value={formData.name}
                onUserSelect={handleUserSelect}
                required
                disabled={loading || isEditingDisabled}
                validationState={getValidationState("name")}
                validationMessage={errors.name}
                icon={<Person20Regular />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <Field
                orientation="vertical"
                label={
                  <>
                    <Phone20Regular /> Phone Number
                  </>
                }
                required
                className="flex-1 w-full "
                validationState={getValidationState("phone")}
                validationMessage={errors.phone}
              >
                <Input
                  className="w-full min-w-[100px]"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1234567890"
                  disabled={loading || isEditingDisabled}
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
                <Input
                  className="w-full min-w-[100px]"
                  value={formData.designation}
                  onChange={(e) =>
                    handleInputChange("designation", e.target.value)
                  }
                  placeholder="Enter designation"
                  disabled={loading || isEditingDisabled}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <FilterCombobox
                label="Department"
                options={departments}
                value={formData.groupName}
                onChange={(value) => handleInputChange("groupName", value)}
                placeholder={
                  isLoadingDepartments ? "Loading..." : "Select department"
                }
                required
                disabled={loading || isLoadingDepartments || isEditingDisabled}
                validationState={getValidationState("groupName")}
                validationMessage={errors.groupName}
                icon={<Building20Regular />}
              />

              <FilterCombobox
                label="Work Location"
                options={locations}
                value={formData.workLocation}
                onChange={(value) => handleInputChange("workLocation", value)}
                placeholder={
                  isLoadingLocations ? "Loading..." : "Select location"
                }
                required
                disabled={loading || isLoadingLocations || isEditingDisabled}
                validationState={getValidationState("workLocation")}
                validationMessage={errors.workLocation}
                icon={<Location20Regular />}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <UserCombobox
                label="Reporting Manager"
                placeholder="Search and select manager"
                value={managerDetails?.displayName || ""}
                onUserSelect={handleManagerSelect}
                required
                disabled={loading || isEditingDisabled}
                validationState={getValidationState("managerUserID")}
                validationMessage={errors.managerUserID}
                icon={<People20Regular />}
              />

              <Field
                orientation="vertical"
                label={
                  <>
                    <Mail20Regular /> Personal Email Address
                  </>
                }
                className="flex-1 w-full "
                validationState={getValidationState("personalMailID")}
                validationMessage={errors.personalMailID}
              >
                <Input
                  className="w-full min-w-[100px]"
                  type="email"
                  value={formData.personalMailID}
                  onChange={(e) =>
                    handleInputChange("personalMailID", e.target.value)
                  }
                  placeholder="personal@email.com"
                  disabled={loading || isEditingDisabled}
                />
              </Field>
            </div>
          </div>
        </Card>

        {/* Offboarding Timeline Section */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                  disabled={loading || isEditingDisabled}
                />
              </Field>

              <Field
                orientation="vertical"
                label={
                  <>
                    <CalendarLtr20Regular /> Resignation Date
                  </>
                }
                required
                className="flex-1 w-full "
                validationState={getValidationState("resignationDate")}
                validationMessage={errors.resignationDate}
              >
                <DatePicker
                  className="w-full min-w-[100px]"
                  placeholder="Select resignation date"
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
                  disabled={loading || isEditingDisabled}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <Field
                orientation="vertical"
                label={
                  <>
                    <CalendarLtr20Regular /> Relieving Date
                  </>
                }
                required
                className="flex-1 w-full "
                validationState={getValidationState("relievingDate")}
                validationMessage={errors.relievingDate}
              >
                <DatePicker
                  className="w-full min-w-[100px]"
                  placeholder="Select relieving date"
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
                  disabled={loading || isEditingDisabled}
                />
              </Field>

              <Field
                orientation="vertical"
                label={
                  <>
                    <Tooltip
                      relationship="label"
                      content="Automatically calculated from resignation and relieving dates"
                    >
                      <Info20Regular />
                    </Tooltip>{" "}
                    Notice Period (Days)
                  </>
                }
                className="flex-1 w-full "
                validationState="none"
              >
                <Input
                  className="w-full min-w-[100px]"
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
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0 !gap-0 !min-h-[30vh]">
          <div className="flex gap-2 p-4 bg-[#E9F3FF] border-b-2 border-b-[#E5E7EB]">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0C59A4] text-white rounded-full">
              <Document20Regular />
            </div>
            <div className="flex flex-col">
              <Subtitle2 className="text-gray-900">
                Knowledge Transfer Documents
              </Subtitle2>
              <Caption1 className="text-gray-500">
                Upload relevant documents for the offboarding clearance
              </Caption1>
            </div>
          </div>

          <div className="flex flex-col gap-2 p-4">
            {isHRSectionDisabled && (
              <MessageBar
                icon={null}
                shape="rounded"
                className="!bg-yellow-100/30 !mb-2 !p-3 !rounded-xl !border-1 !border-yellow-200"
              >
                <MessageBarBody className="flex flex-row gap-2">
                  <Info20Regular className="!text-yellow-800" />
                  <div className="flex flex-col gap-1">
                    <MessageBarTitle className="!text-yellow-800 !text-sm">
                      Complete Admin clearance to enable file uploads
                    </MessageBarTitle>
                    <Text className="!text-yellow-700 !text-xs">
                      You'll be able to upload documents after Admin clearance
                      is completed
                    </Text>
                  </div>
                </MessageBarBody>
              </MessageBar>
            )}

            <Field
              label="Knowledge Transfer Documents"
              
              validationMessage={
                isHRSectionDisabled
                  ? "Complete Admin clearance to enable file uploads"
                  : undefined
              }
              validationState={isHRSectionDisabled ? "warning" : "none"}
            >
              <FileUpload
                onFilesSelected={handleFileSelect}
                attachments={allFiles}
                onDelete={(blobPath) => {
                  if (blobPath.startsWith("pending-")) {
                    const index = parseInt(blobPath.replace("pending-", ""));
                    handleRemovePendingFile(index);
                  } else {
                    handleFileDelete(blobPath);
                  }
                }}
                onDownload={(blobPath, filename) => {
                  if (blobPath.startsWith("pending-")) {
                    dispatchToast(
                      <Toast>
                        <ToastTitle>Files not uploaded yet</ToastTitle>
                      </Toast>,
                      { intent: "info" }
                    );
                  } else {
                    handleFileDownload(blobPath, filename);
                  }
                }}
                disabled={isSubmitting || isHRSectionDisabled}
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

            {pendingFiles.length > 0 && (
              <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <Text className="text-blue-800">
                  ℹ️ {pendingFiles.length} file(s) pending upload. Click "Update
                  Offboarding Form" to save changes and upload files.
                </Text>
              </div>
            )}
          </div>
        </Card>

        {/* HR Knowledge Transfer Confirmation */}
        {formData.adminStatus === "Completed" && (
          <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-4">
            <Checkbox
              label={
                <Body1Strong>
                  I hereby confirm that I have validated the knowledge documents
                  and proceed with the approval for Finance.
                </Body1Strong>
              }
              onChange={() =>handleDialogOpen()}
              checked={formData.hrStatus === "Completed"}
              disabled={isHRSectionDisabled}
            />
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between bg-white w-full items-center p-4">
          <div>
            <Button
              appearance="subtle"
              onClick={() => navigate(-1)}
              disabled={loading || isUploadingFiles || isSubmitting}
              icon={<ArrowExportRtlRegular />}
              type="button"
            >
              Back
            </Button>
          </div>
          <CardFooter>
            <div className="flex justify-end gap-2.5">
              <Button
                onClick={handleReset}
                disabled={
                  loading ||
                  isUploadingFiles ||
                  isSubmitting ||
                  isEditingDisabled // This now includes !canEditOffboarding
                }
                type="button"
                className="!rounded-3xl"
              >
                Reset
              </Button>
              <Tooltip
                content={
                  !canDeleteOffboarding
                    ? "You don't have permission to delete offboarding records"
                    : "Delete offboarding record"
                }
                relationship="label"
              >
                <Button
                  appearance="secondary"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={
                    loading ||
                    isUploadingFiles ||
                    isSubmitting ||
                    !canDeleteOffboarding // Add this line
                  }
                  icon={<Delete20Regular />}
                  type="button"
                  className="!rounded-3xl"
                >
                  Delete
                </Button>
              </Tooltip>
              {loading || isUploadingFiles || isSubmitting ? (
                <Button
                  appearance="primary"
                  disabled
                  className="!bg-gray-200 !text-gray-100 !rounded-3xl !border-0"
                >
                  {isSubmitting ? "Updating..." : "Update Offboarding Form"}
                </Button>
              ) : (
                <Tooltip
                  content={
                    !canEditOffboarding
                      ? "You don't have permission to edit offboarding records"
                      : isEditingDisabled
                      ? "Cannot edit completed or locked offboarding"
                      : "Update offboarding form"
                  }
                  relationship="label"
                >
                  <Button
                    appearance="primary"
                    onClick={handleSubmit}
                    disabled={
                      loading ||
                      isUploadingFiles ||
                      isSubmitting ||
                      isEditingDisabled // This now includes !canEditOffboarding
                    }
                    className="!bg-gradient-to-r !from-[#0153A5] !to-[#2FC2FE] !text-white !rounded-3xl !border-0"
                    size="large"
                  >
                    Update Offboarding Form
                  </Button>
                </Tooltip>
              )}
            </div>
          </CardFooter>
        </div>
      </div>

      <Toaster toasterId={toasterId} />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(event, data) => setIsDeleteDialogOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
              Are you sure you want to delete this clearance request? This
              action cannot be undone.
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" className="!rounded-3xl">
                  Cancel
                </Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                onClick={handleDelete}
                className="!rounded-3xl"
              >
                Delete
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* HR KT Confirmation Dialog */}
      <Dialog
        open={isKTDialogOpen}
        onOpenChange={(event, data) => setIsKTDialogOpen(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm KT Documents</DialogTitle>
            <DialogContent>
              Are you sure you want to submit this clearance request? This
              action cannot be undone. 
              {/* Please ensure all knowledge transfer
              documents have been uploaded. */}
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" className="!rounded-3xl">
                  Cancel
                </Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                onClick={handleHRKTConfirm}
                className="!bg-gradient-to-r !from-[#0153A5] !to-[#2FC2FE] !text-white !rounded-3xl !border-0"
              >
                Confirm
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </FluentProvider>
  );
};

export default ExistingOffboardingClearance;
