import React, { useState, useEffect, useRef, FC } from "react";
import {
  Button,
  Input,
  Textarea,
  Dropdown,
  Option,
  Field,
  Spinner,
  Text,
  useId,
  useToastController,
  Toaster,
  Toast,
  ToastTitle,
  Subtitle2,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Combobox,
  ComboboxProps,
  Persona,
  FluentProvider,
  Body1,
  Body1Strong,
  Card,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  CardFooter,
} from "@fluentui/react-components";
import {
  Delete24Regular,
  CloudAdd24Regular,
  Image24Regular,
  DocumentPdf24Regular,
  DocumentText24Regular,
  ArrowDownload24Regular,
  ArrowExportRtlRegular,
  Attach32Regular,
  CheckmarkCircle20Regular,
  Document20Regular,
  Person20Regular,
  Mail20Regular,
  Add20Regular,
  Briefcase20Regular,
  BuildingPeople20Regular,
  Info24Regular,
} from "@fluentui/react-icons";
import { useNavigate, useParams } from "react-router-dom";
import {
  searchUsersWithDetails,
  getCompleteExitDetails,
  getExitFiles,
  deleteFile,
  downloadFile,
  submitActivity,
  submitHandingOver,
  submitEmailForwarding,
  uploadMultipleFiles,
  updateDepartmentApproval,
  deleteActivity as deleteActivityAPI,
  updateActivity,
  getEmployeeExitByID,
  sendLeadSubmitNotification,
} from "../../Services/Offboarding";
import { useAuth } from "../../Auth/AuthProvider";
import HorizontalCustomStepper from "../Component/HorizontalCustomStepper";

// Types
interface UserDetails {
  id: string;
  displayName: string;
  email: string;
  department?: string;
  designation?: string;
  location?: string;
  phone?: string;
}

interface Activity {
  id?: string;
  activity: string;
  status: string;
  isNew: boolean;
  isModified?: boolean;
  originalActivity?: string;
  originalStatus?: string;
}

interface HandingOver {
  handoverUserID: string;
  designation: string;
  functionalHeadUserID: string;
  isNew: boolean;
}

interface EmailForwarding {
  forwardToUserID: string;
  timePeriod: string;
  remarks: string;
  isNew: boolean;
}

interface FormData {
  activities: Activity[];
  handingOver: HandingOver;
  emailForwarding: EmailForwarding;
}

interface FileAttachment {
  id: string;
  filename: string;
  url: string;
  blobPath: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  isPending?: boolean;
}

interface EmployeeExitData {
  status: string;
  headKtStatus: string;
  managerUserID: string;
  name: string;
  email: string;
  designation: string;
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

// UserCombobox Component
const UserCombobox: FC<{
  label: string;
  placeholder: string;
  value: string;
  onUserSelect: (user: UserDetails | null) => void;
  required?: boolean;
  disabled?: boolean;
  validationState?: "error" | "warning" | "success" | "none";
  validationMessage?: string;
  icon?: React.ReactNode;
}> = ({
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
  const { accessToken }: any = useAuth();

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
        <Option text={`No users found matching "${query}"`} disabled>
          No users found matching "{query}"
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
      validationState={validationState}
      validationMessage={validationMessage}
      className="!font-semibold"
    >
      <Combobox
        className="w-full min-w-[100px]"
        onOptionSelect={onOptionSelect}
        placeholder={placeholder}
        onChange={handleInputChange}
        value={query}
        disabled={disabled}
        open={isOpen && (users.length > 0 || loading || query.length < 2)}
        onOpenChange={(e, data) => setIsOpen(data.open)}
      >
        {renderContent()}
      </Combobox>
    </Field>
  );
};

// FileUpload Component
const FileUpload: FC<{
  onFilesSelected: (files: File[]) => void;
  attachments: FileAttachment[];
  onDelete: (id: string) => void;
  onDownload: (blobPath: string, filename: string) => void;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
}> = ({
  onFilesSelected,
  attachments,
  onDelete,
  onDownload,
  disabled = false,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024,
  acceptedFileTypes = [
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".png",
    ".jpg",
    ".jpeg",
  ],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = (
    files: File[]
  ): { valid: File[]; errors: string[] } => {
    const errors: string[] = [];
    const valid: File[] = [];

    if (attachments.length + files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
      return { valid: [], errors };
    }

    files.forEach((file) => {
      if (file.size > maxFileSize) {
        errors.push(
          `${file.name} exceeds maximum size of ${(
            maxFileSize /
            1024 /
            1024
          ).toFixed(0)}MB`
        );
        return;
      }

      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      if (!acceptedFileTypes.includes(fileExtension)) {
        errors.push(
          `${
            file.name
          } has unsupported file type. Allowed: ${acceptedFileTypes.join(", ")}`
        );
        return;
      }

      valid.push(file);
    });

    return { valid, errors };
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      setError(errors.join("; "));
      setTimeout(() => setError(null), 5000);
    }

    if (valid.length > 0) {
      setError(null);
      onFilesSelected(valid);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split(".").pop();
    if (["jpg", "jpeg", "png", "gif"].includes(ext || "")) {
      return <Image24Regular style={{ color: "#0078d4" }} />;
    } else if (ext === "pdf") {
      return <DocumentPdf24Regular style={{ color: "#d13438" }} />;
    } else {
      return <DocumentText24Regular style={{ color: "#107c10" }} />;
    }
  };

  const hasFiles = attachments.length > 0;

  return (
    <div style={{height:"100%"}}>
      <div
        style={{
          border: "2px dashed #ccc",
          borderRadius: "8px",
          padding: hasFiles ? "12px" : "32px",
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          backgroundColor: isDragging
            ? "#f0f8ff"
            : disabled
            ? "#f5f5f5"
            : "white",
          minHeight: "150px",
        }}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFileTypes.join(",")}
          style={{ display: "none" }}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
        />

        {!hasFiles && !disabled && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <CloudAdd24Regular style={{ fontSize: "48px", color: "#0078d4" }} />
            <Text weight="semibold">Upload files</Text>
            <Text size={200}>Drag and drop or click to browse</Text>
            <Text size={100} style={{ color: "#666" }}>
              Max {maxFiles} files • Max{" "}
              {(maxFileSize / 1024 / 1024).toFixed(0)}MB per file
            </Text>
          </div>
        )}

        {!hasFiles && disabled && (
          <div>
            <Attach32Regular style={{ color: "#666" }} />
            <br />
            <Text style={{ color: "#666" }}>No files selected</Text>
          </div>
        )}

        {hasFiles && !disabled && (
          <div style={{ textAlign: "center", marginBottom: "8px" }}>
            <CloudAdd24Regular
              style={{
                fontSize: "24px",
                color: "#0078d4",
                verticalAlign: "middle",
              }}
            />
            <Text size={200} style={{ color: "#666", marginLeft: "8px" }}>
              Click to add more files
            </Text>
          </div>
        )}

        {hasFiles && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginTop: "8px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {attachments.map((file) => (
              <div
                key={file.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minWidth: "250px",
                  maxWidth: "250px",
                  padding: "12px",
                  backgroundColor: (file as any).isPending
                    ? "#fff4e6"
                    : "#f9f9f9",
                  borderRadius: "8px",
                  border: (file as any).isPending
                    ? "1px solid #ffa94d"
                    : "1px solid #e0e0e0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {getFileIcon(file.filename)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {(file as any).isPending ? (
                      <>
                        <Text
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#333",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={file.filename}
                        >
                          {file.filename.length > 25
                            ? file.filename.slice(0, 25) + "..."
                            : file.filename}
                        </Text>
                        <Text size={100} style={{ color: "#d97706" }}>
                          Pending upload
                        </Text>
                      </>
                    ) : (
                      <>
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "#0078d4",
                            textDecoration: "none",
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={file.filename}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {file.filename.length > 25
                            ? file.filename.slice(0, 25) + "..."
                            : file.filename}
                        </a>
                        <Text size={100} style={{ color: "#666" }}>
                          {formatFileSize(file.size)}
                        </Text>
                      </>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    marginLeft: "8px",
                  }}
                >
                  {!(file as any).isPending && (
                    <Button
                      appearance="subtle"
                      icon={<ArrowDownload24Regular />}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload(file.blobPath, file.filename);
                      }}
                      disabled={disabled}
                      title="Download file"
                    />
                  )}
                  {!disabled && (
                    <Button
                      appearance="subtle"
                      icon={<Delete24Regular />}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(file.id);
                      }}
                      title="Delete file"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div
          style={{
            marginTop: "8px",
            padding: "8px",
            backgroundColor: "#fff4f4",
            border: "1px solid #ffcccc",
            borderRadius: "4px",
          }}
        >
          <Text style={{ color: "#c00" }}>⚠️ {error}</Text>
        </div>
      )}
    </div>
  );
};

// Main LeadClearance Component
const LeadKtClearance: FC = () => {
  const { Id }: any = useParams();
  const navigate = useNavigate();
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);
  const { currentUser, accessToken, refreshToken }: any = useAuth();
  const [Exits, setExits] = useState<EmployeeExit>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFormDisabled, setIsFormDisabled] = useState(false);
  const [employeeData, setEmployeeData] = useState<EmployeeExitData>({
    status: "",
    headKtStatus: "",
    managerUserID: "",
    name: "",
    email: "",
    designation: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState<FormData>({
    activities: [{ id: "1", activity: "", status: "", isNew: true }],
    handingOver: {
      handoverUserID: "",
      designation: "",
      functionalHeadUserID: "",
      isNew: true,
    },
    emailForwarding: {
      forwardToUserID: "",
      timePeriod: "",
      remarks: "",
      isNew: true,
    },
  });

  const [errors, setErrors] = useState<any>({
    activities: [],
    handingOver: {},
    emailForwarding: {},
    files: "",
  });

  const [userSelections, setUserSelections] = useState({
    handover: { name: "", email: "" },
    functionalHead: { name: "", email: "" },
    emailForward: { name: "", email: "" },
  });

  // Load employee Offboarding data
  useEffect(() => {
    const loadEmployeeExitData = async () => {
      if (!Id) return;

      try {
        const response = await getEmployeeExitByID(Id, accessToken);
        const exitData = response.data || response;
        setExits(exitData);
        setEmployeeData({
          status: exitData.Status || "",
          headKtStatus: exitData.HeadKtStatus || "",
          managerUserID: exitData.ManagerUserID || "",
          name: exitData.Name || "",
          email: exitData.Email || "",
          designation: exitData.Designation || "",
        });
      } catch (error) {
        console.error("Error loading employee Offboarding data:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to load employee data</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      }
    };

    loadEmployeeExitData();
  }, [Id]);

  // Update form disabled status based on conditions
  useEffect(() => {
    if (employeeData.status && currentUser) {
      updateFormDisabledStatus(
        currentUser.permissions?.offboarding?.lead_clearance
      );
    }
  }, [employeeData, currentUser, formData]);

  const updateFormDisabledStatus = (userRole: boolean) => {
    const isDisabled =
      employeeData.status === "Locked" ||
      employeeData.status === "Completed" &&
      employeeData.headKtStatus !== "Pending" ||
      currentUser.userID.toLowerCase() !=
        employeeData.managerUserID.toLowerCase() ||
      !userRole;

    setIsFormDisabled(isDisabled);
  };

  useEffect(() => {
    loadExitData();
    loadFiles();
  }, [Id]);

  const loadFiles = async () => {
    try {
      const files = await getExitFiles(Id, accessToken);
      setUploadedFiles(files);
    } catch (error) {
      console.error("Error loading files:", error);
    }
  };

  const handleActivityChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updatedActivities = [...formData.activities];
    const currentActivity = updatedActivities[index];

    if (currentActivity.originalActivity === undefined) {
      updatedActivities[index] = {
        ...currentActivity,
        originalActivity: currentActivity.activity,
        originalStatus: currentActivity.status,
      };
    }

    updatedActivities[index] = {
      ...updatedActivities[index],
      [field]: value,
    };

    const hasChanges =
      updatedActivities[index].activity !==
        (updatedActivities[index].originalActivity ??
          updatedActivities[index].activity) ||
      updatedActivities[index].status !==
        (updatedActivities[index].originalStatus ??
          updatedActivities[index].status);

    updatedActivities[index].isModified = !currentActivity.isNew && hasChanges;

    setFormData({ ...formData, activities: updatedActivities });

    const updatedErrors = [...errors.activities];
    if (updatedErrors[index]) {
      updatedErrors[index] = { ...updatedErrors[index], [field]: "" };
      setErrors({ ...errors, activities: updatedErrors });
    }
  };

  const loadExitData = async () => {
    try {
      setIsLoading(true);
      const response = await getCompleteExitDetails(Id, accessToken);
      const data: any = response.data;

      const handingOverData = data.handingOver
        ? {
            handoverUserID:
              data.handingOver.handoverUserID ||
              data.handingOver.HandoverUserID ||
              "",
            designation:
              data.handingOver.designation ||
              data.handingOver.Designation ||
              "",
            functionalHeadUserID:
              data.handingOver.functionalHeadUserID ||
              data.handingOver.FunctionalHeadUserID ||
              "",
            isNew: false,
          }
        : {
            handoverUserID: "",
            designation: "",
            functionalHeadUserID: "",
            isNew: true,
          };

      const emailForwardingData = data.emailForwarding
        ? {
            forwardToUserID:
              data.emailForwarding.forwardToUserID ||
              data.emailForwarding.ForwardToUserID ||
              "",
            timePeriod:
              data.emailForwarding.timePeriod ||
              data.emailForwarding.TimePeriod ||
              "",
            remarks:
              data.emailForwarding.remarks ||
              data.emailForwarding.Remarks ||
              "",
            isNew: false,
          }
        : {
            forwardToUserID: "",
            timePeriod: "",
            remarks: "",
            isNew: true,
          };

      const activitiesData: Activity[] =
        data.activities && data.activities.length > 0
          ? data.activities.map((a: any) => {
              const activityValue = a.activity || a.Activity || "";
              const statusValue = a.status || a.Status || "";

              return {
                id: a.id || a.ID,
                activity: activityValue,
                status: statusValue,
                isNew: false,
                isModified: false,
                originalActivity: activityValue,
                originalStatus: statusValue,
              };
            })
          : [
              {
                id: "1",
                activity: "",
                status: "",
                isNew: true,
                isModified: false,
                originalActivity: "",
                originalStatus: "",
              },
            ];

      setFormData({
        activities: activitiesData,
        handingOver: handingOverData,
        emailForwarding: emailForwardingData,
      });

      if (data.handingOver?.HandoverUserIDDetails) {
        setUserSelections((prev) => ({
          ...prev,
          handover: {
            name: data.handingOver.HandoverUserIDDetails.displayName || "",
            email: data.handingOver.HandoverUserIDDetails.email || "",
          },
        }));
      }

      if (data.handingOver?.FunctionalHeadUserIDDetails) {
        setUserSelections((prev) => ({
          ...prev,
          functionalHead: {
            name:
              data.handingOver.FunctionalHeadUserIDDetails.displayName || "",
            email: data.handingOver.FunctionalHeadUserIDDetails.email || "",
          },
        }));
      }

      if (data.emailForwarding?.ForwardToUserIDDetails) {
        setUserSelections((prev) => ({
          ...prev,
          emailForward: {
            name: data.emailForwarding.ForwardToUserIDDetails.displayName || "",
            email: data.emailForwarding.ForwardToUserIDDetails.email || "",
          },
        }));
      }
    } catch (error) {
      console.error("Error loading Offboarding data:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to load Offboarding data</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!isDraft && !validateForm()) {
        // console.log("not valid")
      dispatchToast(
        <Toast>
          <ToastTitle>Please correct the errors in the form</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    try {
      if (isDraft) {
        setIsSavingDraft(true);
      } else {
        setIsSubmitting(true);
      }

      

      if (pendingFiles.length > 0) {
        dispatchToast(
          <Toast>
            <ToastTitle>Uploading {pendingFiles.length} file(s)...</ToastTitle>
          </Toast>,
          { intent: "info" }
        );

        try {
          await uploadMultipleFiles(
            Id,
            pendingFiles,
            currentUser.userID,
            accessToken
          );
          setPendingFiles([]);
          await loadFiles();

          dispatchToast(
            <Toast>
              <ToastTitle>Files uploaded successfully</ToastTitle>
            </Toast>,
            { intent: "success" }
          );
        } catch (uploadError) {
          console.error("Error uploading files:", uploadError);
          dispatchToast(
            <Toast>
              <ToastTitle>
                Form submitted but some files failed to upload
              </ToastTitle>
            </Toast>,
            { intent: "warning" }
          );
        }
      }

      if (!isDraft) {
        await updateDepartmentApproval(
          Id,
          "HeadKt",
          {
            approverUserID: currentUser.userID,
            draftStatus: false,
          },
          accessToken
        );

        await refreshToken().then(async (result: any) => {
        await sendLeadSubmitNotification(Exits, currentUser, accessToken);
        });
      }

      dispatchToast(
        <Toast>
          <ToastTitle>
            {isDraft
              ? "Draft saved successfully"
              : "Form submitted successfully"}
          </ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      if (!isDraft) {
        setTimeout(() => {
          navigate("/offboard/LeadClearance");
        }, 1500);
      } else {
        await loadExitData();
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>
            {isDraft ? "Failed to save draft" : "Failed to submit form"}
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSubmitting(false);
      setIsSavingDraft(false);
    }
  };

  const addActivity = () => {
    const newActivity = {
      id: `new-${Date.now()}`,
      activity: "",
      status: "",
      isNew: true,
    };

    setFormData({
      ...formData,
      activities: [...formData.activities, newActivity],
    });

    setErrors({
      ...errors,
      activities: [...errors.activities, { activity: "", status: "" }],
    });
  };

  const deleteActivity = async (index: number) => {
    const activity = formData.activities[index];

    if (!activity.isNew && activity.id) {
      try {
        await deleteActivityAPI(activity.id, accessToken);
        dispatchToast(
          <Toast>
            <ToastTitle>Activity deleted successfully</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } catch (error) {
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to delete activity</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
        return;
      }
    }

    setFormData({
      ...formData,
      activities: formData.activities.filter((_, i) => i !== index),
    });
    setErrors({
      ...errors,
      activities: errors.activities.filter((_: any, i: number) => i !== index),
    });
  };

  const handleHandoverUserSelect = (user: UserDetails | null) => {
    if (user) {
      setFormData({
        ...formData,
        handingOver: {
          ...formData.handingOver,
          handoverUserID: user.id,
          designation: user.designation || "",
        },
      });
      setUserSelections({
        ...userSelections,
        handover: { name: user.displayName, email: user.email },
      });
      setErrors({
        ...errors,
        handingOver: {
          ...errors.handingOver,
          handoverUserID: "",
          designation: "",
        },
      });
    }
  };

  const handleFunctionalHeadSelect = (user: UserDetails | null) => {
    if (user) {
      setFormData({
        ...formData,
        handingOver: {
          ...formData.handingOver,
          functionalHeadUserID: user.id,
        },
      });
      setUserSelections({
        ...userSelections,
        functionalHead: { name: user.displayName, email: user.email },
      });
      setErrors({
        ...errors,
        handingOver: { ...errors.handingOver, functionalHeadUserID: "" },
      });
    }
  };

  const handleEmailForwardUserSelect = (user: UserDetails | null) => {
    if (user) {
      setFormData({
        ...formData,
        emailForwarding: {
          ...formData.emailForwarding,
          forwardToUserID: user.id,
        },
      });
      setUserSelections({
        ...userSelections,
        emailForward: { name: user.displayName, email: user.email },
      });
      setErrors({
        ...errors,
        emailForwarding: { ...errors.emailForwarding, forwardToUserID: "" },
      });
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setPendingFiles((prev) => [...prev, ...files]);
    dispatchToast(
      <Toast>
        <ToastTitle>{files.length} file(s) selected for upload</ToastTitle>
      </Toast>,
      { intent: "success" }
    );
  };

  const handleRemovePendingFile = (id: string) => {
    const index = parseInt(id.replace("pending-", ""));
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileDelete = async (id: string) => {
    if (id.startsWith("pending-")) {
      handleRemovePendingFile(id);
      return;
    }

    try {
      const file = uploadedFiles.find((f) => f.id === id);
      if (file) {
        await deleteFile(Id, file.blobPath, accessToken);
        await loadFiles();
        dispatchToast(
          <Toast>
            <ToastTitle>File deleted successfully</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      }
    } catch (error) {
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
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to download file</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  const validateForm = (): boolean => {
    const newErrors: any = {
      
      files:
        uploadedFiles.length + pendingFiles.length > 0
          ? ""
          : "Please attach KT documents",
    };

    setErrors(newErrors);

    const hasErrors =
      
      newErrors.files !== "";

    return !hasErrors;
  };

  const pendingFileAttachments: FileAttachment[] = pendingFiles.map(
    (file, index) => ({
      id: `pending-${index}`,
      filename: file.name,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      blobPath: "",
      url: "",
      isPending: true,
    })
  );

  const allFileAttachments = [
    ...uploadedFiles,
    ...pendingFileAttachments,
  ] as any[];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2"> Loading clearance form...</Body1Strong>
      </div>
    );
  }

  if(isSubmitting || isSavingDraft){
    return(
      <div className="flex flex-col items-center justify-center py-8 h-full">
          <Spinner />
          <Body1Strong className="mt-2">
            {" "}
            {pendingFiles.length > 0
              ? "Submitting form and uploading files..."
              : isSubmitting
              ? "Submitting form..."
              : "Saving draft..."}
          </Body1Strong>
        </div>
    )
  }

  return (
    <FluentProvider
      style={{ background: "transparent" }}
      className="flex flex-col gap-5"
    >
      <Toaster toasterId={toasterId} />

      

      {/* Header - Removed as per your original code */}
      <div>
        <HorizontalCustomStepper data={Exits} activeStep={5}/>
      </div>

      <div className="flex flex-col justify-between xl:h-[calc(100vh-40vh)] 2xl:h-[calc(100vh-30vh)] overflow-y-auto p-1">
        {/* Info Banner */}
        <div className="flex flex-col gap-10">
        {isFormDisabled && (
          <MessageBar
            icon={null}
            shape="rounded"
            className="!bg-yellow-100/30 !p-3 !rounded-xl !border-1 !border-yellow-200"
          >
            <MessageBarBody className="flex flex-row gap-2">
              <Info24Regular className="!text-yellow-800" />
              <div className="flex flex-col gap-1">
                <MessageBarTitle className="!text-yellow-800 !text-sm">
                  Form is currently disabled
                </MessageBarTitle>
                <Text className="!text-yellow-700 !text-xs">
                  This form cannot be edited due to current status or
                  permissions.
                </Text>
              </div>
            </MessageBarBody>
          </MessageBar>
        )}

      
       

        {/* Knowledge Transfer Documents Section */}
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0 !gap-0 !min-h-[30vh]">
          <div className="flex gap-2 p-4 bg-[#E9F3FF] border-b-2 border-b-[#E5E7EB] ">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0C59A4] text-white rounded-full">
              <Document20Regular />
            </div>
            <div className="flex flex-col">
              <Subtitle2 className="text-gray-900">
                Knowledge Transfer Documents
              </Subtitle2>
              <Body1 className="text-gray-500">
                Upload relevant KT documentation
              </Body1>
            </div>
          </div>

          <div className="p-4">
            <Field
              validationState={errors.files ? "error" : "none"}
              validationMessage={errors.files}
            >
              <FileUpload
                onFilesSelected={handleFilesSelected}
                attachments={allFileAttachments}
                onDelete={handleFileDelete}
                onDownload={handleFileDownload}
                disabled={isFormDisabled}
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
                  ℹ️ {pendingFiles.length} file(s) pending upload. Click
                  "Proceed" to save changes and upload files.
                </Text>
              </div>
            )}
          </div>
        </Card>

        </div>

       

        {/* Action Buttons */}
        <div className="flex justify-between bg-white w-full items-center p-4">
          <div>
            <Button
              appearance="subtle"
              onClick={() => navigate("/offboard/LeadClearance")}
              disabled={isSavingDraft || isSubmitting}
              icon={<ArrowExportRtlRegular />}
            >
              Back
            </Button>
          </div>
          <CardFooter>
            <div className="flex justify-end gap-2.5">
              <Button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting || isSavingDraft || isFormDisabled}
                className="!rounded-3xl"
                size="large"
              >
                {isSavingDraft ? "Saving..." : "Save as Draft"}
              </Button>

              <Dialog
                open={isDialogOpen}
                onOpenChange={(_, data) => setIsDialogOpen(data.open)}
              >
                <DialogTrigger disableButtonEnhancement>
                  {isSubmitting || isSavingDraft || isFormDisabled? (
                    <Button
                      appearance="primary"
                      disabled
                      className="!bg-gray-200 !text-gray-100 !rounded-3xl !border-0"
                      size="large"
                    >
                      {isSubmitting ? "Submitting..." : "Proceed"}
                    </Button>
                  ) : (
                    <Button
                      appearance="primary"
                      disabled={isSubmitting || isSavingDraft || isFormDisabled}
                      className="!bg-gradient-to-r !from-[#0153A5] !to-[#2FC2FE] !text-white !rounded-3xl !border-0"
                      size="large"
                    >
                      Proceed
                    </Button>
                  )}
                </DialogTrigger>
                <DialogSurface>
                  <DialogBody>
                    <DialogTitle>Confirm Submission</DialogTitle>
                    <DialogContent>
                      <div style={{ marginBottom: "12px" }}>
                        Are you sure you want to submit the clearance form? This
                        action cannot be undone.
                      </div>
                      {pendingFiles.length > 0 && (
                        <div
                          style={{
                            padding: "8px 12px",
                            backgroundColor: "#fff4e6",
                            border: "1px solid #ffa94d",
                            borderRadius: "4px",
                          }}
                        >
                          <Text style={{ color: "#d97706", fontSize: "14px" }}>
                            Note: {pendingFiles.length} file(s) will be uploaded
                            during submission.
                          </Text>
                        </div>
                      )}
                    </DialogContent>
                    <DialogActions>
                      <Button
                        appearance="secondary"
                        onClick={() => setIsDialogOpen(false)}
                        className="!rounded-3xl"
                      >
                        Cancel
                      </Button>
                      <Button
                        appearance="primary"
                        onClick={() => {
                          setIsDialogOpen(false);
                          handleSubmit(false);
                        }}
                        className="!bg-gradient-to-r !from-[#0153A5] !to-[#2FC2FE] !text-white !rounded-3xl !border-0"
                      >
                        Confirm
                      </Button>
                    </DialogActions>
                  </DialogBody>
                </DialogSurface>
              </Dialog>
            </div>
          </CardFooter>
        </div>
      </div>
    </FluentProvider>
  );
};

export default LeadKtClearance;
