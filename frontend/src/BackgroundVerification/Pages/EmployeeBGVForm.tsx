import React, { FC, useEffect, useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import {
  Input,
  Dropdown,
  Checkbox,
  Button,
  Field,
  makeStyles,
  Subtitle2,
  Option,
  CheckboxOnChangeData,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Body1Strong,
  Spinner,
  tokens,
  Toast,
  ToastTitle,
  useToastController,
  Toaster,
  useId,
  Body1,
  Text,
  ToastBody,
  Dialog,
  DialogActions,
  DialogBody,
  DialogSurface,
  DialogTitle,
  Card,
  Caption1,
  Badge,
  Textarea,
  FluentProvider,
  DialogContent,
  MessageBar,
  MessageBarBody,
  Avatar,
  Combobox,
  Persona,
  ComboboxProps,
  Menu,
  MenuTrigger,
  MenuButtonProps,
  SplitButton,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import {
  AddCircle20Regular,
  BookRegular,
  DocumentRegular,
  DeleteRegular,
  CloudAddRegular,
  DocumentPdfRegular,
  ImageRegular,
  DocumentTextRegular,
  Person24Regular,
  Building24Regular,
  CheckmarkCircle24Regular,
  Dismiss24Regular,
  Comment24Regular,
  Document24Regular,
  Location24Regular,
  Edit24Regular,
  ArrowRight20Filled,
  Save20Regular,
  CloudArrowUp48Regular,
  CheckmarkCircle20Regular,
  Briefcase24Regular,
  EyeRegular,
} from "@fluentui/react-icons";
import { v4 as uuidv4 } from "uuid";
import { DatePicker } from "@fluentui/react-datepicker-compat";

// Import API functions and types
import {
  addUpdateEmploymentHistory,
  submitBGVRequest,
  approveBGVRequest,
  completeBGVRequest,
  getBGVRequestDetails,
  uploadDocument,
  deleteEmploymentHistory,
  getEmploymentHistory,
  getBGVDocuments,
  deleteDocument,
  createBGVRequest,
  saveAsDraftBGVRequest,
  updateBGVRequest,
  ApproveBGVRequestNotification,
  CompletedBGVRequestNotification,
  createBGVRequestNotification,
  RejectBGVRequestNotification,
  GetHiredCandidatesForBgv,
  InitiateBGVEmail,
  GetAllBGVEmailTriggers,
} from "../../Services/BGVServices";
import type { EmploymentHistoryData } from "../../Services/BGVServices";
import { useAuth } from "../../Auth/AuthProvider";
import { getDocuments } from "../../Services/DocumentManagement";
import BackgroundVerificationPDFDialog from "./BackgroundVerificationPDFDialog";
import BGVHorizontalStepper from "../Component/BGVHorizontalStepper";
import BGVMainStepper from "../Component/BGVMainStepper";
import ViewBgvDetails from "../Component/ViewBgvDetails";
import DocumentConfirmation from "../Component/DocumentConfirmationSideWindow";
import { Applicant } from "../../Types/interview";

// Interfaces
interface ExperienceData {
  id: string;
  companyName: string;
  position: string;
  headOfficeAddress: string;
  headOfficePhone: string;
  branchOfficeAddress: string;
  branchOfficePhone: string;
  employmentFrom: Date | undefined;
  employmentTo: Date | undefined;
  employeeCode: string;
  employmentNature: string;
  agencyDetails: string;
  responsibilities: string;
  lastCTC: string;
  reasonForLeaving: string;
  hrName: string;
  hrPosition: string;
  hrLandline: string;
  hrMobile: string;
  hrEmail: string;
  reportingAuthorityName: string;
  reportingAuthorityPosition: string;
  reportingAuthorityLandline: string;
  reportingAuthorityMobile: string;
  reportingAuthorityEmail: string;
  isNew: boolean;
}

interface ApprovalHistoryItem {
  ApprovalHistoryID: string;
  BGVRequestID: string;
  Action: string;
  ActionBy: string;
  ActionDate: string;
  Comments: string;
}

interface DocumentManagementProps {
  currentID: string | null;
  onFileUpload: (folderName: string, files: FileData[]) => void;
  onFileRemove: (folderName: string, fileId: string) => void;
  uploadedFiles: { [key: string]: FileData[] };
  documentCategories: DocumentCategory[]; // ✅ Add this
  isReadOnly?: boolean;
}

export interface DocumentCategory {
  name: string; // e.g., "Aadhar Card"
  required: boolean; // true or false
  icon?: string; // Optional: e.g., "DocumentRegular"
}

export interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
  uploadedAt: string;
  uploaded?: boolean;
  documentId?: string;
  uploadError?: boolean;
  blobStoragePath?: string;
}

interface TriggeredHistoryType {
  name: string;
  email: string;
  createdAt: string;
}
interface FormData {
  firstName: string;
  lastName: string;
  emailID: string;
  fatherName: string;
  gender: string;
  maritalStatus: string;
  dateOfBirth: Date | undefined;
  nationality: string;
  employeeCode: string;
  experienceLevel: string;
  gmailAddress: string;
  criminalCheckCurrentAddress: string;
  currentFromDate: Date | undefined;
  currentToDate: Date | undefined;
  currentTelephone: string;
  currentMobile: string;
  permanentAddressSame: boolean;
  criminalCheckPermanentAddress: string;
  permanentFromDate: Date | undefined;
  permanentToDate: Date | undefined;
  permanentTelephone: string;
  permanentMobile: string;
  currentGmail: string;
  permanentGmail: string;
  year: string;
  candidateId: string;
}

interface UserComboboxProps {
  label: string;
  placeholder: string;
  value: string;
  onUserSelect: (user: Applicant | null) => void;
  required?: boolean;
  disabled?: boolean;
  validationState?: "error" | "warning" | "success" | "none";
  validationMessage?: string;
  icon?: React.ReactNode;
}

// Approval/Rejection Dialog Component
interface ApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (comments: string) => void;
  onReject: (comments: string) => void;
  isLoading: boolean;
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
  const [users, setUsers] = useState<Applicant[]>([]);
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
        const results = await GetHiredCandidatesForBgv(query, accessToken);
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
    const selectedUser = users.find((u) => u.ID === data.optionValue);
    if (selectedUser) {
      setQuery(selectedUser.fileName);
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
      <Option key={user.ID} value={user.ID} text={user.firstName}>
        <Persona
          avatar={{ color: "colorful", "aria-hidden": true }}
          name={user.firstName + ' ' + user.lastName}
          secondaryText={user.email}
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
        className="!text-sm !font-semibold"
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

const ApprovalDialog: React.FC<ApprovalDialogProps> = ({
  isOpen,
  onClose,
  onApprove,
  onReject,
  isLoading,
}) => {
  const [comments, setComments] = useState("");
  const [action, setAction] = useState<"APPROVE" | "REJECT" | null>(null);
  const [commentError, setCommentError] = useState<string | undefined>(
    undefined
  );

  // Document confirmation dialog


  // Reset state when dialog opens
  useEffect(() => {
    if (!isOpen) {
      setComments("");
      setAction(null);
      setCommentError(undefined);
    }
  }, [isOpen]);

  const validateForm = () => {
    // Clear previous errors
    setCommentError(undefined);

    // Validation rules: Comments required only for rejection
    if (action === "REJECT" && !comments.trim()) {
      setCommentError("Comments are required when rejecting a request");
      return false;
    }

    return true;
  };

  const handleAction = () => {
    if (!validateForm()) return;

    if (action === "APPROVE") {
      onApprove(comments);
    } else if (action === "REJECT") {
      onReject(comments);
    }
  };

  const handleClose = () => {
    setComments("");
    setAction(null);
    setCommentError(undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(event, data) => !data.open && handleClose()}
    >
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {action === "APPROVE"
              ? "Approve BGV Request"
              : action === "REJECT"
                ? "Reject BGV Request"
                : "BGV Request Action"}
          </DialogTitle>

          <DialogContent>
            {!action && (
              <div className="space-y-4">
                <Text>Please select an action for this BGV request:</Text>
              </div>
            )}

            {action && (
              <div className="space-y-4">
                <Field
                  label={`Comments ${action === "REJECT" ? "(Required)" : "(Optional)"
                    }`}
                  validationState={commentError ? "error" : undefined}
                  validationMessage={commentError}
                >
                  <Textarea
                    placeholder="Enter your comments here..."
                    value={comments}
                    onChange={(e) => {
                      setComments(e.target.value);
                      if (commentError) validateForm();
                    }}
                    resize="vertical"
                  />
                </Field>
              </div>
            )}
          </DialogContent>
        </DialogBody>

        <DialogActions className="pt-1">
          <Button appearance="transparent" onClick={handleClose}>
            Cancel
          </Button>
          {!action && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button
                  // appearance="primary"
                  className="!bg-[#00C505] !text-[#fff] !rounded-[30px] !py-2 !px-3"
                  icon={<CheckmarkCircle24Regular />}
                  onClick={() => setAction("APPROVE")}
                >
                  Approve
                </Button>
                <Button
                  appearance="secondary"
                  icon={<Dismiss24Regular />}
                  onClick={() => setAction("REJECT")}
                  className="!py-2 !px-3 !rounded-[30px]"
                >
                  Reject
                </Button>
              </div>
            </div>
          )}
          {action && (
            <Button
              appearance="primary"
              onClick={handleAction}
              disabled={isLoading || (action === "REJECT" && !comments.trim())}
            >
              {isLoading ? (
                <Spinner size="tiny" />
              ) : (
                `Confirm ${action === "APPROVE" ? "Approval" : "Rejection"}`
              )}
            </Button>
          )}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

// Employment History Dialog Component
interface EmploymentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (experience: ExperienceData) => void;
  experience?: ExperienceData | null;
  isEditMode?: boolean;
  readOnly?: boolean;
}

interface Errors {
  [key: string]: string;
}

const EmploymentHistoryDialog: React.FC<EmploymentHistoryDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  experience = null,
  isEditMode = false,
  readOnly = false, // Make sure this prop is used
}) => {
  const [formData, setFormData] = useState<ExperienceData>({
    id: uuidv4(),
    companyName: "",
    position: "",
    headOfficeAddress: "",
    headOfficePhone: "",
    branchOfficeAddress: "",
    branchOfficePhone: "",
    employmentFrom: undefined,
    employmentTo: undefined,
    employeeCode: "",
    employmentNature: "",
    agencyDetails: "",
    responsibilities: "",
    lastCTC: "",
    reasonForLeaving: "",
    hrName: "",
    hrPosition: "",
    hrLandline: "",
    hrMobile: "",
    hrEmail: "",
    reportingAuthorityName: "",
    reportingAuthorityPosition: "",
    reportingAuthorityLandline: "",
    reportingAuthorityMobile: "",
    reportingAuthorityEmail: "",
    isNew: true,
  });
  const [errors, setErrors] = useState<Errors>({});



  useEffect(() => {
    if (experience) {
      setFormData(experience);
    } else {
      setFormData({
        id: uuidv4(),
        companyName: "",
        position: "",
        headOfficeAddress: "",
        headOfficePhone: "",
        branchOfficeAddress: "",
        branchOfficePhone: "",
        employmentFrom: undefined,
        employmentTo: undefined,
        employeeCode: "",
        employmentNature: "",
        agencyDetails: "",
        responsibilities: "",
        lastCTC: "",
        reasonForLeaving: "",
        hrName: "",
        hrPosition: "",
        hrLandline: "",
        hrMobile: "",
        hrEmail: "",
        reportingAuthorityName: "",
        reportingAuthorityPosition: "",
        reportingAuthorityLandline: "",
        reportingAuthorityMobile: "",
        reportingAuthorityEmail: "",
        isNew: true,
      });
    }
  }, [experience, isOpen]);

  const clearError = (name: keyof ExperienceData) => {
    if (readOnly) return; // Don't clear errors in read-only mode
    setErrors((prev: any) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (readOnly) return; // Prevent changes in read-only mode

    const { name, value } = event.target;
    setFormData((prevData: any) => ({ ...prevData, [name]: value }));
    clearError(name as keyof ExperienceData);
  };

  const handleDateChange = (
    date: Date | null | undefined,
    name: keyof ExperienceData
  ) => {
    if (readOnly) return; // Prevent changes in read-only mode

    setFormData((prevData: any) => ({
      ...prevData,
      [name]: date || undefined,
    }));
    clearError(name);
  };

  const handleDropdownChange = (
    event: React.SyntheticEvent<HTMLElement>,
    data: { name?: string; optionValue?: string }
  ) => {
    if (readOnly) return; // Prevent changes in read-only mode

    const { name, optionValue } = data;
    if (name && optionValue) {
      setFormData((prevData: any) => ({
        ...prevData,
        [name]: optionValue,
      }));
      clearError(name as keyof ExperienceData);
    }
  };

  const validate = (): boolean => {
    if (readOnly) return true; // Skip validation in read-only mode

    const newErrors: Errors = {};
    if (!formData.companyName)
      newErrors.companyName = "Company Name is required";
    if (!formData.position) newErrors.position = "Position is required";
    if (!formData.headOfficeAddress)
      newErrors.headOfficeAddress = "Head Office Address is required";
    if (!formData.headOfficePhone)
      newErrors.headOfficePhone = "Head Office Phone is required";
    if (!formData.employmentFrom)
      newErrors.employmentFrom = "Employment From date is required";
    if (!formData.employmentTo)
      newErrors.employmentTo = "Employment To date is required";
    if (!formData.employmentNature)
      newErrors.employmentNature = "Employment Nature is required";
    if (!formData.lastCTC || isNaN(Number(formData.lastCTC)))
      newErrors.lastCTC = "Valid Last CTC is required";

    if (formData.employmentFrom && formData.employmentTo) {
      if (formData.employmentTo <= formData.employmentFrom) {
        newErrors.employmentTo =
          "Employment To date must be greater than Employment From date";
      }
    }

    if (formData.employmentNature === "Temporary" && !formData.agencyDetails) {
      newErrors.agencyDetails =
        "Agency details are required for temporary employment";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (readOnly) return; // Prevent submit in read-only mode

    if (validate()) {
      onAdd(formData);
      handleCancel();
    }
  };

  const handleCancel = () => {
    if (!readOnly) {
      setFormData({
        id: uuidv4(),
        companyName: "",
        position: "",
        headOfficeAddress: "",
        headOfficePhone: "",
        branchOfficeAddress: "",
        branchOfficePhone: "",
        employmentFrom: undefined,
        employmentTo: undefined,
        employeeCode: "",
        employmentNature: "",
        agencyDetails: "",
        responsibilities: "",
        lastCTC: "",
        reasonForLeaving: "",
        hrName: "",
        hrPosition: "",
        hrLandline: "",
        hrMobile: "",
        hrEmail: "",
        reportingAuthorityName: "",
        reportingAuthorityPosition: "",
        reportingAuthorityLandline: "",
        reportingAuthorityMobile: "",
        reportingAuthorityEmail: "",
        isNew: true,
      });
      setErrors({});
    }
    onClose();
  };

  if (!isOpen) return null;

  // Update dialog title based on mode
  const dialogTitle = readOnly
    ? "View Employment History"
    : isEditMode
      ? "Edit Employment History"
      : "Add Employment History";

  const submitButtonText = isEditMode
    ? "Update Employment History"
    : "Add Employment History";

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(event, data) => !data.open && onClose()}
      modalType="alert"
    >
      <DialogSurface style={{ maxWidth: "800px", width: "90vw" }}>
        <DialogBody>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {/* Company Details Section */}
              <Card className="mb-8 p-6 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-300">
                  <Building24Regular className="text-blue-600" />
                  <Subtitle2>Company Details</Subtitle2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <Field
                    label="Company Name"
                    required={!readOnly}
                    validationState={errors.companyName ? "error" : undefined}
                    validationMessage={errors.companyName}
                  >
                    <Input
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      placeholder="Enter Company Name"
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field
                    label="Position Held & Department"
                    required={!readOnly}
                    validationState={errors.position ? "error" : undefined}
                    validationMessage={errors.position}
                  >
                    <Input
                      name="position"
                      placeholder="Enter Designation"
                      value={formData.position}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field
                    label="Employment From"
                    required={!readOnly}
                    validationState={
                      errors.employmentFrom ? "error" : undefined
                    }
                    validationMessage={errors.employmentFrom}
                  >
                    <FluentProvider>
                      <DatePicker
                        style={{ width: "100%" }}
                        placeholder="Select From Date"
                        value={formData.employmentFrom}
                        onSelectDate={(date) =>
                          handleDateChange(date, "employmentFrom")
                        }
                        disabled={readOnly}
                        className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                      />
                    </FluentProvider>
                  </Field>

                  <Field
                    label="Employment To"
                    required={!readOnly}
                    validationState={errors.employmentTo ? "error" : undefined}
                    validationMessage={errors.employmentTo}
                  >
                    <FluentProvider>
                      <DatePicker
                        style={{ width: "100%" }}
                        placeholder="Select To Date"
                        value={formData.employmentTo}
                        onSelectDate={(date) =>
                          handleDateChange(date, "employmentTo")
                        }
                        disabled={readOnly}
                        className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                      />
                    </FluentProvider>
                  </Field>

                  <Field
                    label="Head Office Address"
                    required={!readOnly}
                    validationState={
                      errors.headOfficeAddress ? "error" : undefined
                    }
                    validationMessage={errors.headOfficeAddress}
                    className="col-span-full"
                  >
                    <Input
                      name="headOfficeAddress"
                      placeholder="Enter Head Office Address"
                      value={formData.headOfficeAddress}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field
                    label="Head Office Phone"
                    required={!readOnly}
                    validationState={
                      errors.headOfficePhone ? "error" : undefined
                    }
                    validationMessage={errors.headOfficePhone}
                  >
                    <Input
                      name="headOfficePhone"
                      placeholder="Enter Phone Number"
                      value={formData.headOfficePhone}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field label="Branch Office Address">
                    <Input
                      name="branchOfficeAddress"
                      placeholder="Enter Branch Office Address"
                      value={formData.branchOfficeAddress}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field
                    label="Employment Nature"
                    required={!readOnly}
                    validationState={
                      errors.employmentNature ? "error" : undefined
                    }
                    validationMessage={errors.employmentNature}
                  >
                    <FluentProvider>
                      <Dropdown
                        style={{ width: "100%" }}
                        placeholder="Select Employment Nature"
                        value={formData.employmentNature}
                        onOptionSelect={(event, data) =>
                          handleDropdownChange(event, {
                            ...data,
                            name: "employmentNature",
                          })
                        }
                        disabled={readOnly}
                        className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                      >
                        <Option value="Temporary">Temporary</Option>
                        <Option value="Permanent">Permanent</Option>
                      </Dropdown>
                    </FluentProvider>
                  </Field>

                  <Field
                    label="Last CTC Per Annum"
                    required={!readOnly}
                    validationState={errors.lastCTC ? "error" : undefined}
                    validationMessage={errors.lastCTC}
                  >
                    <Input
                      name="lastCTC"
                      value={formData.lastCTC}
                      placeholder="Enter CTC (in numbers)"
                      onChange={handleInputChange}
                      type="number"
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  {formData.employmentNature === "Temporary" && (
                    <Field
                      label="Agency Details"
                      required={!readOnly}
                      validationState={
                        errors.agencyDetails ? "error" : undefined
                      }
                      validationMessage={errors.agencyDetails}
                    >
                      <Input
                        name="agencyDetails"
                        placeholder="Enter Agency Details"
                        value={formData.agencyDetails}
                        onChange={handleInputChange}
                        disabled={readOnly}
                        className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                      />
                    </Field>
                  )}

                  <Field label="Reason for Leaving" className="col-span-full">
                    <Input
                      name="reasonForLeaving"
                      placeholder="Enter Reason for Leaving"
                      value={formData.reasonForLeaving}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field label="Responsibilities" className="col-span-full">
                    <Textarea
                      name="responsibilities"
                      placeholder="Enter your key responsibilities..."
                      value={formData.responsibilities}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>
                </div>
              </Card>

              {/* HR Contact Details */}
              <Card className="mb-8 p-6 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-300">
                  <Person24Regular className="text-blue-600" />
                  <Subtitle2>HR Contact Details</Subtitle2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <Field label="HR Name">
                    <Input
                      name="hrName"
                      placeholder="Enter HR Name"
                      value={formData.hrName}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field label="HR Position">
                    <Input
                      name="hrPosition"
                      placeholder="Enter HR Position"
                      value={formData.hrPosition}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field label="HR Landline">
                    <Input
                      name="hrLandline"
                      placeholder="Enter HR Landline"
                      value={formData.hrLandline}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field label="HR Mobile">
                    <Input
                      name="hrMobile"
                      placeholder="Enter HR Mobile"
                      value={formData.hrMobile}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field label="HR Email">
                    <Input
                      name="hrEmail"
                      placeholder="Enter HR Email"
                      value={formData.hrEmail}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>
                </div>
              </Card>
              <Card className="mb-8 p-6 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-300">
                  <Person24Regular className="text-blue-600" />
                  <Subtitle2>Reporting Authority Details</Subtitle2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                  <Field label="Reporting Authority Name">
                    <Input
                      name="reportingAuthorityName"
                      placeholder="Enter Reporting Authority Name"
                      value={formData.reportingAuthorityName}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field label="Reporting Authority Position">
                    <Input
                      name="reportingAuthorityPosition"
                      placeholder="Enter Reporting Authority Position"
                      value={formData.reportingAuthorityPosition}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field label="Reporting Authority Landline">
                    <Input
                      name="reportingAuthorityLandline"
                      placeholder="Enter Landline Number"
                      value={formData.reportingAuthorityLandline}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field label="Reporting Authority Mobile">
                    <Input
                      name="reportingAuthorityMobile"
                      placeholder="Enter Mobile Number"
                      value={formData.reportingAuthorityMobile}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>

                  <Field label="Reporting Authority Email">
                    <Input
                      name="reportingAuthorityEmail"
                      placeholder="Enter Email Address"
                      value={formData.reportingAuthorityEmail}
                      onChange={handleInputChange}
                      disabled={readOnly}
                      className=" !rounded-lg !border !border-[#e8e7e6] col-span-2 w-full !max-w-full !min-w-0 after:!border-none"
                    />
                  </Field>
                </div>
              </Card>
            </div>
          </DialogContent>
        </DialogBody>

        <DialogActions>
          <Button className="!rounded-2xl" onClick={handleCancel}>
            {readOnly ? "Close" : "Cancel"}
          </Button>
          {!readOnly && (
            <Button
              appearance="primary"
              className="!bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] !text-white !rounded-2xl !border-0 !px-3 !py-2 !font-medium"
              onClick={handleSubmit}
            >
              {submitButtonText}
            </Button>
          )}
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

const useStyles = makeStyles({
  container: {
    backgroundColor: tokens.colorNeutralBackground1,
    // minHeight: "100vh",
  },
  pageWrapper: {
    display: "flex",
    flexDirection: "column",
    height: "87vh",
    overflowY: "auto",
  },
  headerSection: {
    flexShrink: 0,
    paddingBottom: tokens.spacingVerticalM,
  },
  formContentContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXL,
    flex: 1,
    // overflowY: "auto",
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL} ${tokens.spacingVerticalXXL} ${tokens.spacingHorizontalL}`,
    // Custom scrollbar styling
    "&::-webkit-scrollbar": {
      width: "8px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: tokens.colorNeutralBackground3,
      borderRadius: tokens.borderRadiusMedium,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.colorNeutralStroke1,
      borderRadius: tokens.borderRadiusMedium,
      "&:hover": {
        backgroundColor: tokens.colorNeutralStroke2,
      },
    },
  },
  sectionCard: {
    gap: "0px !important",
    padding: "0px !important",
    borderRadius: "10px",
    boxShadow: "none",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: "20px",
    backgroundColor: "#E9F3FF"
  },
  headerContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
  },
  headerCaption: {
    color: tokens.colorNeutralForeground3,
  },
  fields: {
    // borderRadius: "10px",
    // border: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: "0px",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    alignItems: "start",
    padding: "20px"
  },
  innerformGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
    alignItems: "start",
  },
  fullWidthField: {
    gridColumn: "1 / -1",
    fontWeight: "550",
    fontSize: "14px",
  },
  addressSection: {
    background: tokens.colorNeutralBackground1,
    borderRadius: "12px",
    padding: "20px",
  },
  addressHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  addressTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: tokens.colorBrandForeground1,
  },
  documentGrid: {
    display: "grid",
    gridTemplateColumns: "50% 50%",
    gap: "20px",
    "@media screen and (min-width: 1400px)": {
      gridTemplateColumns: "repeat(3, 32.3%)",
    },
  },
  documentSection: {
    // maxHeight: "500px",
    // overflowY: "auto",

    // Custom scrollbar styling
    "&::-webkit-scrollbar": {
      width: "8px",
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: tokens.colorNeutralBackground3,
      borderRadius: tokens.borderRadiusMedium,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: tokens.colorNeutralStroke1,
      borderRadius: tokens.borderRadiusMedium,
      "&:hover": {
        backgroundColor: tokens.colorNeutralStroke2,
      },
    },
  },
  documentCategory: {
    background: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "12px",
    padding: "0px !important",
    transition: "all 0.3s ease",
    "&:hover": {
      boxShadow: tokens.shadow8,
      transform: "translateY(-2px)",
    },
    boxShadow: "none",
  },
  uploadArea: {
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: "8px",
    padding: "5px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    minHeight: "150px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    margin: "20px",
    height: "100%",
    "&:hover": {
      backgroundColor: tokens.colorBrandBackground2,
    },
  },
  uploadAreaActive: {
    backgroundColor: tokens.colorBrandBackground2,
  },
  fileList: {
    width: "100%",
    marginTop: "16px",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: "8px",
    justifyContent: "start",
  },
  fileItem: {
    display: "flex",
    alignItems: "center",
    minWidth: "250px",
    maxWidth: "250px",
    justifyContent: "space-between",
    padding: "12px",
    background: tokens.colorNeutralBackground2,
    borderRadius: "8px",
    border: `1px solid ${tokens.colorNeutralStroke3}`,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: "13px",
    fontWeight: "500",
    color: tokens.colorNeutralForeground1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fileSize: {
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
  },
  categoryHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "16px",
    backgroundColor: "#F9FAFB !important",
    padding: "12px",
  },
  categoryTitle: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  requiredBadge: {
    background: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
  },
  optionalBadge: {
    background: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
  },
  uploadProgress: {
    marginTop: "12px",
    padding: "8px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: "6px",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: tokens.colorNeutralBackground2,
    borderRadius: "12px",
    border: `2px dashed ${tokens.colorNeutralStroke2}`,
  },
  experienceCard: {
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "12px",
    overflow: "hidden",
    marginTop: "10px",
  },
  experienceItem: {
    padding: "16px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "8px",
    backgroundColor: tokens.colorNeutralBackground1,
  },
  loadingOverlay: {
    background: "rgba(255, 255, 255, 0.9)",
    backdropFilter: "blur(8px)",
  },
  buttonContainer: {
    display: "flex",
    flexDirection: "row",
    gap: tokens.spacingVerticalM,
    padding: `24px 10px 10px 10px`,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    // boxShadow: tokens.shadow8,
    position: "sticky",
    bottom: 0,
    zIndex: 10,
    justifyContent: "space-between",
    "@media screen and (max-width: 1000px)": {
      flexDirection: "column",
      gap: tokens.spacingVerticalS,
    },
  },
  iconColor: {
    color: tokens.colorBrandForeground1,
  },
  dialogContent: {
    minWidth: "500px",
  },
  uploadAreaWithFiles: {
    padding: "12px",
    minHeight: "80px",
  },
  statusBadge: {
    marginBottom: "16px",
  },
});

const genderOptions = [
  { text: "Male", value: "Male" },
  { text: "Female", value: "Female" },
  { text: "Other", value: "Other" },
];

const maritalStatusOptions = [
  { text: "Single", value: "Single" },
  { text: "Married", value: "Married" },
  { text: "Divorced", value: "Divorced" },
  { text: "Widowed", value: "Widowed" },
];

const experienceOptions = [
  { text: "Experienced", value: "Experienced" },
  { text: "Fresher", value: "Fresher" },
];

// const documentCategories = [
//   { name: "Aadhar Card", required: true, icon: <DocumentRegular /> },
//   { name: "Driving License", required: false, icon: <DocumentRegular /> },
//   { name: "Bank Account Details", required: true, icon: <DocumentRegular /> },
//   {
//     name: "Experience Certificate",
//     required: false,
//     icon: <DocumentRegular />,
//   },
//   {
//     name: "Last 3 Months Bank Statement",
//     required: true,
//     icon: <DocumentRegular />,
//   },
//   {
//     name: "Letter of Authorization",
//     required: true,
//     icon: <DocumentRegular />,
//   },
//   { name: "PAN Card", required: true, icon: <DocumentRegular /> },
//   { name: "Payslip", required: false, icon: <DocumentRegular /> },
//   {
//     name: "Previous Employment Resignation and Relieving Letter",
//     required: false,
//     icon: <DocumentRegular />,
//   },
//   { name: "Photo", required: true, icon: <ImageRegular /> },
// ];

// Enhanced Document Management Component

const DocumentManagement: React.FC<DocumentManagementProps> = ({
  currentID,
  onFileUpload,
  onFileRemove,
  uploadedFiles = {},
  isReadOnly = false,
  documentCategories,
}) => {
  // console.log(isReadOnly);
  const styles = useStyles();
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, category: string) => {
    if (isReadOnly) return;
    e.preventDefault();
    setDraggedCategory(category);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedCategory(null);
  };

  const handleDrop = (e: React.DragEvent, category: string) => {
    if (isReadOnly) return;
    e.preventDefault();
    setDraggedCategory(null);
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    handleFileUpload(files, category);
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string
  ) => {
    if (isReadOnly) return;

    if (e.target.files && e.target.files.length > 0) {
      const fileArray: File[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        fileArray.push(e.target.files[i]);
      }

      handleFileUpload(fileArray, category);
      e.target.value = "";
    }
  };

 

  const handleFileUpload = (files: File[], category: string) => {
    const validFiles = files.filter((file: File) => {
      const isValidType =
        file.type.includes("image") ||
        file.type.includes("pdf") ||
        file.type.includes("document") ||
        file.name.toLowerCase().includes(".jpg") ||
        file.name.toLowerCase().includes(".jpeg") ||
        file.name.toLowerCase().includes(".png") ||
        file.name.toLowerCase().includes(".pdf") ||
        file.name.toLowerCase().includes(".doc") ||
        file.name.toLowerCase().includes(".docx");
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length > 0) {
      const fileObjects: FileData[] = validFiles.map((file: File) => ({
        id: uuidv4(),
        name: file.name,
        size: file.size,
        type: file.type,
        file: file,
        uploadedAt: new Date().toISOString(),
      }));

      onFileUpload(category, fileObjects);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getFileIcon = (fileName: string, fileType: string) => {
    if (
      fileType.includes("image") ||
      fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)
    ) {
      return <ImageRegular style={{ color: "#0078d4", fontSize: "30px" }} />;
    } else if (
      fileType.includes("pdf") ||
      fileName.toLowerCase().endsWith(".pdf")
    ) {
      return (
        <DocumentPdfRegular style={{ color: "#d13438", fontSize: "30px" }} />
      );
    } else {
      return (
        <DocumentTextRegular style={{ color: "#107c10", fontSize: "30px" }} />
      );
    }
  };

  return (
    <div className={styles.documentGrid}>
      {documentCategories.map((category) => {
        const categoryFiles = uploadedFiles[category.name] || [];
        const isDragged = draggedCategory === category.name;
        const hasFiles = categoryFiles.length > 0;

        return (
          <Card key={category.name} className={styles.documentCategory}>
            <div className={styles.categoryHeader}>
              <div className={styles.categoryTitle}>
                <Document24Regular />
                <Body1Strong>{category.name}</Body1Strong>
              </div>
              <Badge
                className={
                  category.required
                    ? styles.requiredBadge
                    : styles.optionalBadge
                }
                size="small"
              >
                {category.required ? "Required" : "Optional"}
              </Badge>
            </div>

            <div
              className={`${styles.uploadArea} ${isDragged ? styles.uploadAreaActive : ""
                } ${hasFiles ? styles.uploadAreaWithFiles : ""}`}
              onDragOver={(e) => handleDragOver(e, category.name)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, category.name)}
              onClick={() =>
                !isReadOnly &&
                document.getElementById(`file-${category.name}`)?.click()
              }
              style={{ cursor: isReadOnly ? "default" : "pointer" }}
            >
              <input
                id={`file-${category.name}`}
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e, category.name)}
                disabled={isReadOnly}
              />

              {!hasFiles && !isReadOnly && (
                <div
                  style={{
                    textAlign: "center",
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "column",
                  }}
                >
                  <CloudArrowUp48Regular
                    style={{
                      fontSize: "48px",
                      color: "#939495ff",
                      marginBottom: "8px",
                    }}
                  />
                  <Body1Strong
                    style={{ display: "block", marginBottom: "4px" }}
                  >
                    Drag and drop or click to browse
                  </Body1Strong>

                  <Caption1 style={{ color: "#8a8886", marginTop: "4px" }}>
                    Supports: JPG, PNG, PDF, DOCX (Max 5MB)
                  </Caption1>
                </div>
              )}

              {!hasFiles && isReadOnly && (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Caption1 style={{ color: "#8a8886" }}>
                    No files uploaded
                  </Caption1>
                </div>
              )}

              {hasFiles && !isReadOnly && (
                <div
                  style={{
                    width: "100%",
                    textAlign: "center",
                    marginBottom: "8px",
                  }}
                >
                  <CloudAddRegular
                    style={{ fontSize: "24px", color: "#0078d4" }}
                  />
                  <Caption1 style={{ color: "#605e5c", marginLeft: "8px" }}>
                    Click to add more files
                  </Caption1>
                </div>
              )}

              {hasFiles && (
                <div className={styles.fileList}>
                  {categoryFiles.map((file: FileData) => (
                    <div onClick={(e) => e.stopPropagation()} key={file.id} className={styles.fileItem}>
                      <div className={styles.fileInfo}>
                        {getFileIcon(file.name, file.type)}
                        <div className="flex flex-col items-baseline justify-start">
                          <a
                            className={styles.fileName}
                            href={
                              file.blobStoragePath ||
                              (file.file ? URL.createObjectURL(file.file) : "#")
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {file.name?.length > 25
                              ? file.name.slice(0, 25) + "..."
                              : file.name}
                          </a>
                          <div className={styles.fileSize}>
                            {formatFileSize(file.size)}
                          </div>
                        </div>
                      </div>
                      {/* Only show delete button when not in read-only mode */}
                      <a
                        className={styles.fileName}
                        href={
                          file.blobStoragePath ||
                          (file.file ? URL.createObjectURL(file.file) : "#")
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          icon={<EyeRegular />}
                          appearance="subtle"
                          size="small"
                          className="mr-1"
                          onClick={(e) => {
                            if (file.blobStoragePath) {
                              try {
                                const { protocol } = new URL(file.blobStoragePath);
                                if (["https:", "http:"].includes(protocol)) {
                                  window.open(file.blobStoragePath, "_blank", "noopener,noreferrer");
                                }
                              } catch {
                                // invalid URL — do nothing
                              }
                            }
                            else {
                              const fileURL = URL.createObjectURL(file.file);
                              window.open(fileURL, "_blank", "noopener,noreferrer");
                            }
                          }}
                        />
                      </a>

                      {!isReadOnly && (
                        <Button
                          icon={<DeleteRegular />}
                          appearance="subtle"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            onFileRemove(category.name, file.id);
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const EmployeeBGVForm: React.FC = () => {
  const { Id } = useParams<{ Id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // console.log("Current Location:",  location.pathname.endsWith('/view'));

  const isView = location.pathname.endsWith("/view");

  // State declarations
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    emailID: "",
    fatherName: "",
    gender: "",
    maritalStatus: "",
    dateOfBirth: undefined,
    nationality: "india",
    employeeCode: "",
    experienceLevel: "",
    gmailAddress: "",
    criminalCheckCurrentAddress: "",
    currentFromDate: undefined,
    currentToDate: undefined,
    currentTelephone: "",
    currentMobile: "",
    permanentAddressSame: false,
    criminalCheckPermanentAddress: "",
    permanentFromDate: undefined,
    permanentToDate: undefined,
    permanentTelephone: "",
    permanentMobile: "",
    currentGmail: "",
    permanentGmail: "",
    year: String(new Date().getFullYear()),
    candidateId: ""
  });

  const [
    isEmploymentHistoryDialogOpen,
    setIsEmploymentHistoryDialogOpen,
  ] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const toastId = useId("toaster");
  const { dispatchToast } = useToastController(toastId);
  // const [currentID, setCurrentID] = useState<string | null>(Id || null);
  const [currentID, setCurrentID] = useState<string | null>(
    Id && Id !== "BGVForm" ? Id : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [employmentHistory, setEmploymentHistory] = useState<ExperienceData[]>(
    []
  );


  // State for open dialog for preview
  const [OpenDialog, setOpenDialog] = useState(false)


  let { currentUser, accessToken, refreshToken }: any = useAuth();

  // Helper function to safely check permissions
  const checkPermission = (permissionPath: string): boolean => {
    const paths = permissionPath.split(".");
    let current = currentUser?.permissions;

    for (const path of paths) {
      if (!current || current[path] === undefined) {
        return false;
      }
      current = current[path];
    }

    return current === true;
  };

  // Check BGV Permissions
  const canCreateBGV = checkPermission(
    "background_verification.bgv_manage.create_bgv"
  );
  const canEditBGV = checkPermission(
    "background_verification.bgv_manage.edit_bgv"
  );
  const canApproveBGV = checkPermission("background_verification.bgv_approve");
  const canCloseBGV = checkPermission("background_verification.bgv_close");

  const isNewForm = !currentID || currentID === "BGVForm";
  const isEditingExisting = Boolean(currentID && currentID !== "BGVForm");

  const [uploadedFiles, setUploadedFiles] = useState<{
    [key: string]: FileData[];
  }>({});
  const [requestStatus, setRequestStatus] = useState<string>("DRAFT");
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [approvalHistory, setApprovalHistory] = useState<ApprovalHistoryItem[]>(
    []
  );
  const [TriggeredHisTory, setTriggeredHistory] = useState<TriggeredHistoryType[]>([]);
  // Add the missing state for editing experience
  const [
    editingExperience,
    setEditingExperience,
  ] = useState<ExperienceData | null>(null);
  const [
    viewingExperience,
    setViewingExperience,
  ] = useState<ExperienceData | null>(null);
  const [isViewingExperienceOpen, setIsViewingExperienceOpen] = useState(false);
  // Handle query parameters
  const isPreviewMode = searchParams.get("preview") === "true";
  const isApprovalMode = searchParams.get("approve") === "true";
  const [documentCategories, setDocumentCategories] = useState<
    DocumentCategory[]
  >([]);
  const [IsLoadingInitiateMail, setIsLoadingInitiateMail] = useState(false);  
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  // Update this block to include all non-editable states

  // Also add this check to use in places where you need more specific control
  const isStatusLocked =
    requestStatus === "Rejected" || requestStatus === "Completed";
  const isEditMode = Boolean(currentID && currentID !== "BGVForm");
  // Enhanced read-only logic with permission checks
  const isReadOnly =
    isPreviewMode ||
    (!isApprovalMode && isStatusLocked) ||
    !(isEditMode && !canEditBGV && requestStatus === "DRAFT");

  const canApprove =
    isApprovalMode && requestStatus === "Submitted" && canApproveBGV;
  const canComplete = requestStatus === "Approved" && canCloseBGV;
  // const isEditMode = Boolean(Id);

  // Main Steps
  const [activeStep, setActiveStep] = useState<number>(0);



  const handleNextStep = () => {
    setActiveStep((prevStep) => prevStep + 1);
  };

  // console.log("Status", isStatusLocked)

  const handleFormDisable = () => {
    // console.log("userData",isEditMode,canEditBGV,currentUser?.permissions)
    return (isEditMode && canEditBGV) || (!isEditMode && canCreateBGV) || !isReadOnly
  }

  useEffect(() => {
    const loadCategories = async () => {
      const response: any = await getDocuments(
        {
          pageSize: 100, // Get all documents for now
          sortBy: "CreatedAt",
          sortDirection: "DESC",
        },
        accessToken
      );

      if (response.data.documents) {
        // console.log(response.data.documents);
        setDocumentCategories(
          response.data.documents.map((doc: any) => ({
            name: doc.title,
            required: doc.isRequired,
            icon: <DocumentRegular />,
          }))
        );
      } else {
      }
      setIsLoadingCategories(false);
    };
    loadCategories();
  }, []);

  const onClick = async() => {
    try{
      setIsLoadingInitiateMail(true);
      if(!currentID){
        console.error("Current ID is null or undefined.");
        // console.log("debug: toastId=", toastId, "dispatchToastExists=", !!dispatchToast);
        if(!dispatchToast) console.error("dispatchToast is falsy");
        dispatchToast(
          <Toast >
            <ToastTitle>Unable to initiate email. Please try again.</ToastTitle>
            
          </Toast>,
          { intent: "error" }
        )
        return;
      }
      // console.log("debug: initiating email for id=", currentID);
      const response: any = await InitiateBGVEmail(currentID, accessToken)
      // console.log("debug: InitiateBGVEmail response=", response);
      
      if(response.success){
        // console.log("debug: dispatching success toast, dispatchToastExists=", !!dispatchToast);
        dispatchToast(
          <Toast >
            <ToastTitle>Email sent succesfully</ToastTitle>
            
          </Toast>,
          { intent: "success" }
        )

        if(response.data && response.data.data){
          setTriggeredHistory((prev) => [...prev, ...response.data.data])
        }
      }
      else {
        console.error("Error initiating email, response=", response);
        // console.log("debug: toastId=", toastId, "dispatchToastExists=", !!dispatchToast);
        if(!dispatchToast) console.error("dispatchToast is falsy");
        dispatchToast(
          <Toast >
            <ToastTitle>Unable to initiate email. Please try again.</ToastTitle>
            </Toast>
        )
      }

    }
    catch(err){
      console.error("Error in onClick:", err);
      // console.log("debug: toastId=", toastId, "dispatchToastExists=", !!dispatchToast);
      if(!dispatchToast) console.error("dispatchToast is falsy");
      dispatchToast(
          <Toast >
            <ToastTitle>Unable to initiate email. Please try again.</ToastTitle>
            
          </Toast>,
          { intent: "error" }
        )
    }
    finally{
      setIsLoadingInitiateMail(false);
    }
  };

    const primaryActionButtonProps = {
      onClick,
      
    };

  useEffect(() => {
    if (Id && Id !== "BGVForm" ? false : true) {
      // window.location.reload()
      setFormData({
        firstName: "",
        lastName: "",
        emailID: "",
        fatherName: "",
        gender: "",
        maritalStatus: "",
        dateOfBirth: undefined,
        nationality: "India",
        employeeCode: "",
        experienceLevel: "",
        gmailAddress: "",
        criminalCheckCurrentAddress: "",
        currentFromDate: undefined,
        currentToDate: undefined,
        currentTelephone: "",
        currentMobile: "",
        permanentAddressSame: false,
        criminalCheckPermanentAddress: "",
        permanentFromDate: undefined,
        permanentToDate: undefined,
        permanentTelephone: "",
        permanentMobile: "",
        currentGmail: "",
        permanentGmail: "",
        year: String(new Date().getFullYear()),
        candidateId: ""
      })

      setIsEmploymentHistoryDialogOpen(false)
      setIsInitialLoading(false)
      setEmploymentHistory([])
      setRequestStatus("DRAFT")
      setRequestDetails(null)
      setEditingExperience(null)
      setCurrentID(null)
      setUploadedFiles({})
    }
  }, [location])

  // Function to render employment history
  const renderEmploymentHistory = () => {
    if (employmentHistory.length === 0) {
      return (
        <div className={styles.emptyState}>
          <BookRegular
            style={{
              fontSize: "48px",
              color: tokens.colorNeutralForeground3,
              marginBottom: "16px",
            }}
          />
          <Subtitle2
            style={{
              color: tokens.colorNeutralForeground2,
              marginBottom: "8px",
            }}
          >
            No Employment History
          </Subtitle2>
          <Body1 style={{ color: tokens.colorNeutralForeground3 }}>
            {formData.experienceLevel === "Experienced"
              ? "Add your work experience to continue"
              : "No employment history required for freshers"}
          </Body1>
        </div>
      );
    }

    

    return (
      <div className="space-y-4">
        <Table className="mt-1">
          <TableHeader className="bg-gray-100 !text-gray-700">
            <TableRow>
              <TableHeaderCell className="!text-gray-600 !font-medium">
                Company Name
              </TableHeaderCell>
              <TableHeaderCell className="!text-gray-600 !font-medium">
                Position
              </TableHeaderCell>
              <TableHeaderCell className="!text-gray-600 !font-medium">
                Employment Period
              </TableHeaderCell>
              <TableHeaderCell className="!text-gray-600 !font-medium">
                Employment Nature
              </TableHeaderCell>
              <TableHeaderCell className="!text-gray-600 !font-medium">
                Last CTC
              </TableHeaderCell>
              <TableHeaderCell className="!text-gray-600 !font-medium">
                Reason for Leaving
              </TableHeaderCell>
              <TableHeaderCell>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employmentHistory.map((experience) => (
              <TableRow key={experience.id}>
                <TableCell>
                  <Body1Strong>{experience.companyName}</Body1Strong>
                </TableCell>

                <TableCell>{experience.position}</TableCell>

                <TableCell>
                  {formatDate(experience.employmentFrom)} -{" "}
                  {formatDate(experience.employmentTo)}
                </TableCell>

                <TableCell>
                  <Badge appearance="outline">
                    {experience.employmentNature}
                  </Badge>
                </TableCell>

                <TableCell>₹{experience.lastCTC}</TableCell>

                <TableCell>
                  {experience.reasonForLeaving || (
                    <span className="text-gray-400">–</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    {/* View Button */}
                    <Button
                      appearance="subtle"
                      icon={<BookRegular />}
                      size="small"
                      onClick={() => {
                        setViewingExperience(experience);
                        setIsViewingExperienceOpen(true);
                      }}
                    >
                      View
                    </Button>

                    {handleFormDisable() && !isStatusLocked && (
                      <>
                        {/* Edit Button */}
                        <Button
                          icon={<Edit24Regular />}
                          appearance="subtle"
                          size="small"
                          onClick={() => handleEditExperience(experience)}
                        />

                        {/* Delete Button */}
                        <Button
                          icon={<DeleteRegular />}
                          appearance="subtle"
                          size="small"
                          onClick={() => handleRemoveExperience(experience)}
                        />
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Handle edit experience
  const handleEditExperience = (experience: ExperienceData) => {
    if (isStatusLocked) return;
    setEditingExperience(experience);
    setIsEmploymentHistoryDialogOpen(true);
  };

  // Updated function to handle both add and update
  const handleAddOrUpdateExperience = async (experience: ExperienceData) => {

    if (editingExperience) {
      // Update existing experience
      setEmploymentHistory((prev) =>
        prev.map((exp) =>
          exp.id === editingExperience.id
            ? { ...experience, isNew: exp.isNew }
            : exp
        )
      );
    } else {
      // Add new experience - use uuidv4 instead of nanoid for proper GUID format
      const newExperience = {
        ...experience,
        isNew: true,
        id: uuidv4(), // This ensures proper GUID format
      };
      setEmploymentHistory((prev) => [...prev, newExperience]);
    }

    // Save to server if editing existing BGV request
    if (currentID && currentID !== "BGVForm") {
      try {
        const empData: EmploymentHistoryData = {
          employmentHistoryId: editingExperience ? editingExperience.id : null,
          bgvRequestId: currentID,
          companyName: experience.companyName,
          position: experience.position,
          headOfficeAddress: experience.headOfficeAddress,
          headOfficePhone: experience.headOfficePhone,
          branchOfficeAddress: experience.branchOfficeAddress,
          branchOfficePhone: experience.branchOfficePhone,
          // Fix date handling - send proper ISO string or null
          employmentFrom: experience.employmentFrom?.toISOString() || "",
          employmentTo: experience.employmentTo?.toISOString() || "",
          employeeCode: experience.employeeCode,
          employmentNature: experience.employmentNature,
          agencyDetails: experience.agencyDetails,
          responsibilities: experience.responsibilities,
          lastCTC: parseFloat(experience.lastCTC) || 0,
          reasonForLeaving: experience.reasonForLeaving,
          hrName: experience.hrName,
          hrPosition: experience.hrPosition,
          hrLandline: experience.hrLandline,
          hrMobile: experience.hrMobile,
          hrEmail: experience.hrEmail,
          reportingAuthorityName: experience.reportingAuthorityName,
          reportingAuthorityPosition: experience.reportingAuthorityPosition,
          reportingAuthorityLandline: experience.reportingAuthorityLandline,
          reportingAuthorityMobile: experience.reportingAuthorityMobile,
          reportingAuthorityEmail: experience.reportingAuthorityEmail,
        };

        // console.log("Sending employment data:", empData); // Add logging for debugging

        const response = await addUpdateEmploymentHistory(empData, accessToken);

        if (!response.success) {
          throw new Error(
            response.message || "Failed to save employment history"
          );
        }

        // Update the employment history with the returned ID if it's a new record
        if (!editingExperience && response.data?.EmploymentHistoryID) {
          setEmploymentHistory((prev) =>
            prev.map((exp) =>
              exp.id === experience.id
                ? {
                  ...exp,
                  id: response.data.EmploymentHistoryID,
                  isNew: false,
                }
                : exp
            )
          );
        }

        dispatchToast(
          <Toast>
            <ToastTitle>
              {editingExperience ? "Experience Updated" : "Experience Added"}
            </ToastTitle>
            <ToastBody>
              Employment experience has been{" "}
              {editingExperience ? "updated" : "saved"} successfully
            </ToastBody>
          </Toast>,
          { intent: "success" }
        );
      } catch (error) {
        console.error("Error saving employment history:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Error</ToastTitle>
            <ToastBody>Failed to save employment history: </ToastBody>
          </Toast>,
          { intent: "error" }
        );

        // Revert the state change on error
        if (!editingExperience) {
          setEmploymentHistory((prev) =>
            prev.filter((exp) => exp.id !== experience.id)
          );
        }
      }
    }

    // Clear editing state
    setEditingExperience(null);
  };

  // Load existing data if ID is provided

  const loadExistingData = async () => {
    if (Id && Id !== "BGVForm") {
      try {
        const response: any = await getBGVRequestDetails(Id, accessToken);
        if (response.success && response.data) {
          const data = response.data;
          const bgvData = data.bgvRequest || data;

          setRequestDetails(data);
          setRequestStatus(bgvData.Status || bgvData.status || "DRAFT");
          setApprovalHistory(data.approvalHistory);
          setFormData({
            firstName: bgvData.FirstName || "",
            lastName: bgvData.LastName || "",
            emailID: bgvData.EmailID || "",
            fatherName: bgvData.FatherName || "",
            gender: bgvData.Gender || "",
            maritalStatus: bgvData.MaritalStatus || "",
            dateOfBirth: bgvData.DateOfBirth
              ? new Date(bgvData.DateOfBirth)
              : undefined,
            nationality: bgvData.Nationality || "India",
            employeeCode: bgvData.EmployeeCode,
            experienceLevel: bgvData.ExperienceLevel || "",
            gmailAddress: bgvData.PersonalEmail || "",
            criminalCheckCurrentAddress: bgvData.CurrentAddress || "",
            currentFromDate: bgvData.CurrentFromDate
              ? new Date(bgvData.CurrentFromDate)
              : undefined,
            currentToDate: bgvData.CurrentToDate
              ? new Date(bgvData.CurrentToDate)
              : undefined,
            currentTelephone: bgvData.CurrentTelephone || "",
            currentMobile: bgvData.CurrentMobile || "",
            permanentAddressSame: bgvData.PermanentAddressSame || false,
            criminalCheckPermanentAddress: bgvData.PermanentAddress || "",
            permanentFromDate: bgvData.PermanentFromDate
              ? new Date(bgvData.PermanentFromDate)
              : undefined,
            permanentToDate: bgvData.PermanentToDate
              ? new Date(bgvData.PermanentToDate)
              : undefined,
            permanentTelephone: bgvData.PermanentTelephone || "",
            permanentMobile: bgvData.PermanentMobile || "",
            currentGmail: bgvData.PersonalEmail || "",
            permanentGmail: bgvData.PersonalEmail || "",
            year: String(new Date().getFullYear()),
            candidateId: bgvData.CandidateID || ""
          });

          setCurrentID(bgvData.BGVRequestID || Id);
        }

        // Load employment history
        const empHistoryResponse = await getEmploymentHistory(
          Id,
          accessToken
        );
        if (empHistoryResponse.success && empHistoryResponse.data) {
          const empData = empHistoryResponse.data;
          if (Array.isArray(empData)) {
            const mappedHistory: ExperienceData[] = empData.map(
              (emp: any) => ({
                id: emp.EmploymentHistoryID,
                companyName: emp.CompanyName,
                position: emp.Position,
                headOfficeAddress: emp.HeadOfficeAddress || "",
                headOfficePhone: emp.HeadOfficePhone || "",
                branchOfficeAddress: emp.BranchOfficeAddress || "",
                branchOfficePhone: emp.BranchOfficePhone || "",
                employmentFrom: emp.EmploymentFrom
                  ? new Date(emp.EmploymentFrom)
                  : undefined,
                employmentTo: emp.EmploymentTo
                  ? new Date(emp.EmploymentTo)
                  : undefined,
                employeeCode: emp.EmployeeCode || "",
                employmentNature: emp.EmploymentNature || "",
                agencyDetails: emp.AgencyDetails || "",
                responsibilities: emp.Responsibilities || "",
                lastCTC: emp.LastCTC?.toString() || "",
                reasonForLeaving: emp.ReasonForLeaving || "",
                hrName: emp.HRName || "",
                hrPosition: emp.HRPosition || "",
                hrLandline: emp.HRLandline || "",
                hrMobile: emp.HRMobile || "",
                hrEmail: emp.HREmail || "",
                reportingAuthorityName: emp.ReportingAuthorityName || "",
                reportingAuthorityPosition:
                  emp.ReportingAuthorityPosition || "",
                reportingAuthorityLandline:
                  emp.ReportingAuthorityLandline || "",
                reportingAuthorityMobile: emp.ReportingAuthorityMobile || "",
                reportingAuthorityEmail: emp.ReportingAuthorityEmail || "",
                isNew: false,
              })
            );
            setEmploymentHistory(mappedHistory);
          }
        }

        // Load documents
        const documentsResponse = await getBGVDocuments(Id, accessToken);
        if (documentsResponse.success && documentsResponse.data) {
          const docsData = documentsResponse.data;
          if (Array.isArray(docsData)) {
            const groupedFiles: { [key: string]: FileData[] } = {};
            docsData.forEach((doc: any) => {
              // Use the actual field names from your API response
              const category = doc.DocumentCategory;
              if (!groupedFiles[category]) {
                groupedFiles[category] = [];
              }

              // Create a proper File object - since we have blob storage path, we can create a reference
              const fileBlob = new Blob([], {
                type: doc.FileType || "application/octet-stream",
              });
              const file = new File([fileBlob], doc.FileName, {
                type: doc.FileType,
              });

              groupedFiles[category].push({
                id: doc.DocumentID,
                name: doc.FileName,
                size: parseInt(doc.FileSize) || 0,
                type: doc.FileType || "",
                file: file,
                uploadedAt: doc.UploadedDate,
                uploaded: true,
                documentId: doc.DocumentID,
                blobStoragePath: doc.BlobStoragePath, // Store the blob path for downloads/previews
              });
            });
            setUploadedFiles(groupedFiles);
          }
        }
      } catch (error) {
        console.error("Error loading existing data:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Error loading data</ToastTitle>
            <ToastBody>Failed to load existing BGV request data</ToastBody>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setIsInitialLoading(false);
      }
    } else {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {


    loadExistingData();
  }, [Id, dispatchToast]);

  const validateDates = () => {
    const errors: { [key: string]: string } = {};
    if (formData.currentFromDate && formData.currentToDate) {
      if (formData.currentFromDate > formData.currentToDate) {
        errors.currentToDate = "To Date must be after From Date";
      }
    }
    if (!formData.permanentAddressSame) {
      if (formData.permanentFromDate && formData.permanentToDate) {
        if (formData.permanentFromDate > formData.permanentToDate) {
          errors.permanentToDate = "To Date must be after From Date";
        }
      }
    }
    return errors;
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {

    const { name, value } = event.target;
    let newValue = value;
    let error = "";

    if (name === "fatherName" || name === "firstName" || name === "lastName") {
      newValue = value.replace(/[^a-zA-Z \.]/g, "");
      if (newValue !== value) {
        error = "Name should only contain alphabets, spaces, and periods";
      }
    }

    if (name === "nationality") {
      newValue = value.replace(/[^a-zA-Z]/g, "");
      if (newValue !== value) {
        error = "Nationality should only contain alphabets";
      }
    }

    setFormData((prevData) => {
      const newData = { ...prevData, [name]: newValue };

      if (prevData.permanentAddressSame) {
        if (name === "criminalCheckCurrentAddress")
          newData.criminalCheckPermanentAddress = value;
        if (name === "currentFromDate")
          newData.permanentFromDate = new Date(value);
        if (name === "currentToDate") newData.permanentToDate = new Date(value);
        if (name === "currentTelephone") newData.permanentTelephone = value;
        if (name === "currentMobile") newData.permanentMobile = value;
        if (name === "currentGmail") newData.permanentGmail = value;
      }

      return newData;
    });

    setFormErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      if (error) {
        newErrors[name] = error;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  const handleDropdownChange = (event: any, data: any) => {

    const { name, optionValue } = data;
    setFormData((prevData) => ({
      ...prevData,
      [name]: optionValue,
    }));

    if (name === "experienceLevel" && optionValue === "Fresher") {
      setEmploymentHistory([]);
    }

    setFormErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[name];
      return newErrors;
    });
  };

  const handleDateChange = (
    date: Date | null | undefined,
    name: keyof FormData
  ) => {

    setFormData((prevData) => ({
      ...prevData,
      [name]: date || undefined,
    }));

    const dateErrors = validateDates();
    setFormErrors((prevErrors: any) => ({
      ...prevErrors,
      ...dateErrors,
      [name]: undefined,
    }));
  };

  const handleCheckboxChange = (
    ev: React.ChangeEvent<HTMLInputElement>,
    data: CheckboxOnChangeData
  ) => {

    const { name } = ev.target;
    const { checked } = data;
    setFormData((prevData: any) => {
      if (name === "permanentAddressSame" && checked) {
        setFormErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors["criminalCheckPermanentAddress"];
          return newErrors;
        });
        return {
          ...prevData,
          [name]: checked,
          criminalCheckPermanentAddress: prevData.criminalCheckCurrentAddress,
          permanentFromDate: prevData.currentFromDate,
          permanentToDate: prevData.currentToDate,
          permanentTelephone: prevData.currentTelephone,
          permanentMobile: prevData.currentMobile,
          permanentGmail: prevData.currentGmail,
        };
      } else if (name === "permanentAddressSame" && !checked) {
        setFormErrors((prevErrors) => {
          const newErrors = { ...prevErrors };
          delete newErrors["criminalCheckPermanentAddress"];
          return newErrors;
        });

        return {
          ...prevData,
          [name]: checked,
          criminalCheckPermanentAddress: "",
          permanentFromDate: undefined,
          permanentToDate: undefined,
          permanentTelephone: "",
          permanentMobile: "",
          permanentGmail: "",
        };
      }
      return { ...prevData, [name]: checked };
    });
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const handleFileUpload = async (folderName: string, files: FileData[]) => {

    const newFiles = files.map((file) => ({
      ...file,
      uploaded: false,
      id: uuidv4(),
    }));

    setUploadedFiles((prevFiles) => ({
      ...prevFiles,
      [folderName]: [...(prevFiles[folderName] || []), ...newFiles],
    }));

    // Only upload if we have an existing BGV request
    if (currentID && currentID !== "BGVForm") {
      try {
        // Upload files sequentially to avoid overwhelming the server
        for (let i = 0; i < newFiles.length; i++) {
          const fileData = newFiles[i];

          try {
            // console.log(
            //   `Uploading file ${i + 1}/${newFiles.length}: ${fileData.name
            //   } to ${folderName}`
            // );

            const response = await uploadDocument(
              currentID,
              folderName,
              currentUser?.userID,
              fileData.file,
              accessToken
            );

            if (response.success) {
              // Update file status to uploaded
              setUploadedFiles((prevFiles) => ({
                ...prevFiles,
                [folderName]: prevFiles[folderName].map((f) =>
                  f.id === fileData.id
                    ? {
                      ...f,
                      uploaded: true,
                      documentId:
                        response.data?.id || response.data?.documentId,
                    }
                    : f
                ),
              }));

              // console.log(`Successfully uploaded: ${fileData.name}`);
            } else {
              throw new Error(response.message || "Upload failed");
            }
          } catch (fileError) {
            console.error(`Error uploading file ${fileData.name}:`, fileError);

            // Mark this specific file as failed
            setUploadedFiles((prevFiles) => ({
              ...prevFiles,
              [folderName]: prevFiles[folderName].map((f) =>
                f.id === fileData.id ? { ...f, uploadError: true } : f
              ),
            }));

            dispatchToast(
              <Toast>
                <ToastTitle>Upload Error</ToastTitle>
                <ToastBody>Failed to upload {fileData.name}</ToastBody>
              </Toast>,
              { intent: "error" }
            );
          }

          // Add small delay between uploads to prevent overwhelming the server
          if (i < newFiles.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }

        // Show success message for successfully uploaded files
        const successfulUploads = newFiles.filter((_, index) => {
          const currentFile =
            uploadedFiles[folderName]?.[
            (uploadedFiles[folderName]?.length || 0) - newFiles.length + index
            ];
          return currentFile?.uploaded;
        });

        if (successfulUploads.length > 0) {
          dispatchToast(
            <Toast>
              <ToastTitle>Upload Successful</ToastTitle>
              <ToastBody>
                {successfulUploads.length} file(s) uploaded to {folderName}
              </ToastBody>
            </Toast>,
            { intent: "success" }
          );
        }
      } catch (error) {
        console.error("Error in file upload process:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Upload Error</ToastTitle>
            <ToastBody>Failed to upload some files</ToastBody>
          </Toast>,
          { intent: "error" }
        );
      }
    } else {
      // For new requests, files will be uploaded when form is submitted
      dispatchToast(
        <Toast>
          <ToastTitle>Files Added</ToastTitle>
          <ToastBody>Files will be uploaded when you submit the form</ToastBody>
        </Toast>,
        { intent: "info" }
      );
    }
  };

  const handleFileRemove = async (folderName: string, fileId: string) => {

    const fileToRemove = uploadedFiles[folderName]?.find(
      (f) => f.id === fileId
    );

    // Remove from state immediately
    setUploadedFiles((prevFiles) => ({
      ...prevFiles,
      [folderName]: prevFiles[folderName].filter(
        (file: FileData) => file.id !== fileId
      ),
    }));

    // If file was uploaded to server, delete it
    if (fileToRemove?.documentId && currentID) {
      try {
        await deleteDocument(fileToRemove.documentId, accessToken);
      } catch (error) {
        console.error("Error deleting file from server:", error);
      }
    }
  };

  const handleRemoveExperience = async (experience: any) => {
    let experienceId = experience.id;
    // console.log("Removing experience with ID:", experience);
    const experienceToRemove = employmentHistory.find(
      (exp) => exp.id === experienceId
    );

    setEmploymentHistory((prev) =>
      prev.filter((exp) => exp.id !== experienceId)
    );

    // If this was an existing employment record, delete from server
    if (experienceToRemove && !experienceToRemove.isNew && currentID) {
      try {
        // Make sure we're passing both IDs to the delete function
        await deleteEmploymentHistory(currentID, experienceId, accessToken);
      } catch (error) {
        console.error("Error deleting employment history:", error);

        // Add user feedback on error
        dispatchToast(
          <Toast>
            <ToastTitle>Error</ToastTitle>
            <ToastBody>Failed to delete employment history</ToastBody>
          </Toast>,
          { intent: "error" }
        );

        // Restore the deleted entry in the UI if server deletion fails
        setEmploymentHistory((prev) => [...prev, experienceToRemove]);
      }
    }

    dispatchToast(
      <Toast>
        <ToastTitle>Experience Removed</ToastTitle>
        <ToastBody>Employment experience has been removed</ToastBody>
      </Toast>,
      { intent: "info" }
    );
  };

  const formatDate = (date: Date | undefined): string => {
    if (!date) return "";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Updated saveOrUpdateRequest function
  const saveOrUpdateRequest = async (
    shouldSubmit: boolean = false,
    isDraft: boolean = false
  ) => {
    try {
      let response: any;
      let returnedBgvRequestId: string;

      const requestData: any = {
        // For new requests, don't send bgvRequestId
        ...(currentID && currentID !== "BGVForm"
          ? { bgvRequestId: currentID }
          : {}),

        employeeId: uuidv4(),
        firstName: formData.firstName,
        lastName: formData.lastName,
        emailId: formData.emailID,
        fatherName: formData.fatherName,
        gender: formData.gender,
        maritalStatus: formData.maritalStatus,
        dateOfBirth: formData.dateOfBirth
          ? formData.dateOfBirth.toISOString()
          : "",
        nationality: formData.nationality,
        employeeCode: formData.employeeCode,
        experienceLevel: formData.experienceLevel,
        personalEmail: formData.gmailAddress,
        currentAddress: formData.criminalCheckCurrentAddress,
        currentFromDate: formData.currentFromDate
          ? formData.currentFromDate.toISOString()
          : "",
        currentToDate: formData.currentToDate
          ? formData.currentToDate.toISOString()
          : "",
        currentTelephone: formData.currentTelephone,
        currentMobile: formData.currentMobile,
        permanentAddressSame: formData.permanentAddressSame,
        permanentAddress: formData.criminalCheckPermanentAddress,
        permanentFromDate: formData.permanentFromDate
          ? formData.permanentFromDate.toISOString()
          : "",
        permanentToDate: formData.permanentToDate
          ? formData.permanentToDate.toISOString()
          : "",
        permanentTelephone: formData.permanentTelephone,
        permanentMobile: formData.permanentMobile,
        status: shouldSubmit ? "Submitted" : "DRAFT",
        createdBy: currentUser?.userID || "",
        modifiedBy: currentUser?.userID || "",
        department: "",
        position: "",
        requestedBy: currentUser?.userID || "",
        candidateId: formData.candidateId || ""
      };

      // Determine which API call to make
      if (currentID && currentID !== "BGVForm") {
        // Existing request - use update
        response = await updateBGVRequest(requestData, accessToken);
        returnedBgvRequestId = currentID;
      } else {
        // New request - use appropriate create method
        if (isDraft) {
          response = await saveAsDraftBGVRequest(requestData, accessToken);
        } else {
          response = await createBGVRequest(requestData, accessToken);
        }

        // Extract the BGV request ID from response
        returnedBgvRequestId =
          response.data?.BGVRequestID ||
          response.data?.bgvRequestId ||
          response.data?.id;
        // console.log(response.data);
        // console.log(requestData);
        await refreshToken().then(async (result: any) => {
          await createBGVRequestNotification(
            response.data,
            requestData,
            currentUser,
            accessToken
          );
        });
      }

      if (!response.success) {
        throw new Error(response.message || "Failed to save BGV request");
      }

      if (!returnedBgvRequestId) {
        throw new Error("No BGV request ID returned from server");
      }

      // Update the current ID state
      setCurrentID(returnedBgvRequestId);

      // Now save all employment history with the correct BGV request ID
      for (const experience of employmentHistory) {
        if (!isDraft || experience.isNew) {
          const empData: EmploymentHistoryData = {
            bgvRequestId: returnedBgvRequestId,
            employmentHistoryId: experience.isNew ? null : experience.id,
            companyName: experience.companyName,
            position: experience.position,
            headOfficeAddress: experience.headOfficeAddress,
            headOfficePhone: experience.headOfficePhone,
            branchOfficeAddress: experience.branchOfficeAddress,
            branchOfficePhone: experience.branchOfficePhone,
            employmentFrom: experience.employmentFrom
              ? experience.employmentFrom.toISOString()
              : "",
            employmentTo: experience.employmentTo
              ? experience.employmentTo.toISOString()
              : "",
            employeeCode: experience.employeeCode,
            employmentNature: experience.employmentNature,
            agencyDetails: experience.agencyDetails,
            responsibilities: experience.responsibilities,
            lastCTC: parseFloat(experience.lastCTC) || 0,
            reasonForLeaving: experience.reasonForLeaving,
            hrName: experience.hrName,
            hrPosition: experience.hrPosition,
            hrLandline: experience.hrLandline,
            hrMobile: experience.hrMobile,
            hrEmail: experience.hrEmail,
            reportingAuthorityName: experience.reportingAuthorityName,
            reportingAuthorityPosition: experience.reportingAuthorityPosition,
            reportingAuthorityLandline: experience.reportingAuthorityLandline,
            reportingAuthorityMobile: experience.reportingAuthorityMobile,
            reportingAuthorityEmail: experience.reportingAuthorityEmail,
          };

          await addUpdateEmploymentHistory(empData, accessToken);

          // Mark experience as no longer new
          experience.isNew = false;
        }
      }

      // Upload any pending files with the correct BGV request ID
      for (const [category, files] of Object.entries(uploadedFiles)) {
        for (const file of files) {
          if (!file.uploaded && file.file) {
            try {
              await uploadDocument(
                returnedBgvRequestId,
                category,
                currentUser?.userID,
                file.file,
                accessToken
              );

              // Mark file as uploaded
              setUploadedFiles((prevFiles) => ({
                ...prevFiles,
                [category]: prevFiles[category].map((f) =>
                  f.id === file.id ? { ...f, uploaded: true } : f
                ),
              }));
            } catch (uploadError) {
              console.error(`Failed to upload file ${file.name}:`, uploadError);
            }
          }
        }
      }

      // If this is a submission, update the status
      if (shouldSubmit) {
        await submitBGVRequest(
          returnedBgvRequestId,
          currentUser?.userID,
          accessToken
        );
        setRequestStatus("Submitted");
      }

      return returnedBgvRequestId;
    } catch (error) {
      console.error("Error saving request:", error);
      throw error;
    }
  };

   const handleFetchTriggerEmailDetails = async() =>{
    if(currentID){
      try{
        setIsLoadingInitiateMail(true);
        const response = await GetAllBGVEmailTriggers(accessToken, currentID);
        // console.log("Email Trigger Details:", response);
        if(response && response.success && response.data && response.data.data){
          // Process and utilize the fetched email trigger details as needed
          setTriggeredHistory(response.data.data|| []);
        }
      }catch(error){
        console.error("Error fetching email trigger details:", error);
      }
      finally{
        setIsLoadingInitiateMail(false);
      }
      }
    }

  const handleNext = () => {



    // Check edit permission for draft updates
    if (isEditMode && requestStatus === "DRAFT" && !canEditBGV) {
      dispatchToast(
        <Toast>
          <ToastTitle>Permission Denied</ToastTitle>
          <ToastBody>You don't have permission to edit BGV requests</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    const errors: { [key: string]: string } = {};

    const requiredFields = [
      "firstName",
      "lastName",
      "fatherName",
      "gender",
      // "maritalStatus",
      "dateOfBirth",
      "nationality",
      "gmailAddress",
      "criminalCheckCurrentAddress",
      "currentFromDate",
      "currentToDate",
      "currentMobile",
      "criminalCheckPermanentAddress",
      "permanentMobile",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field as keyof FormData]) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)
          } is required`;
      }
    });

    // Validate required document categories
    const requiredDocuments = documentCategories.filter((cat) => cat.required);
    requiredDocuments.forEach((category) => {
      if (
        !uploadedFiles[category.name] ||
        uploadedFiles[category.name].length === 0
      ) {
        errors[`document_${category.name}`] = `${category.name} is required`;
      }
    });

    if (formData.gmailAddress && !validateEmail(formData.gmailAddress)) {
      errors.gmailAddress = "Invalid email format";
    }

    const dateErrors = validateDates();
    Object.assign(errors, dateErrors);

    if (formData.experienceLevel === "") {
      errors.experienceLevel = "Please provide experience level";
    }

    // Only validate employment history for experienced candidates
    if (
      formData.experienceLevel === "Experienced" &&
      employmentHistory.length === 0
    ) {
      errors.employmentHistory =
        "At least one employment experience is required for experienced candidates";
    }

    if (Object.keys(errors).length > 0) {
      dispatchToast(
        <Toast>
          <ToastTitle>Please validate fields</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      setFormErrors(errors);
      setIsSubmitting(false);
    } else {
      setOpenDialog(true)
    }

  };


  const handleFormSubmit = () => {
    handleSubmit()
  }

  const handlePrevious = () => {
    activeStep > 0 && setActiveStep((prevStep) => prevStep - 1);
  };

  const handleStep = (index: number) => {
    // Don't allow forward navigation without validation
    if (index > activeStep) {
      // Call handleNext repeatedly until we reach the target step
      // This ensures all intermediate steps are validated
      handleNext();
      return;
    }

    // Allow backward navigation without validation
    if (index < activeStep) {
      setActiveStep(index);
      return;
    }

    // If clicking the current step, do nothing
  };

  const handleSubmit = async () => {

    // Check edit permission for draft updates
    if (isEditMode && requestStatus === "DRAFT" && !canEditBGV) {
      dispatchToast(
        <Toast>
          <ToastTitle>Permission Denied</ToastTitle>
          <ToastBody>You don't have permission to edit BGV requests</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    setIsSubmitting(true);
    const errors: { [key: string]: string } = {};

    const requiredFields = [
      "firstName",
      "lastName",
      "fatherName",
      "gender",
      // "maritalStatus",
      "dateOfBirth",
      "nationality",
      "gmailAddress",
      "criminalCheckCurrentAddress",
      "currentFromDate",
      "currentToDate",
      "currentMobile",
      "criminalCheckPermanentAddress",
      "permanentMobile",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field as keyof FormData]) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)
          } is required`;
      }
    });

    // Validate required document categories
    const requiredDocuments = documentCategories.filter((cat) => cat.required);
    requiredDocuments.forEach((category) => {
      if (
        !uploadedFiles[category.name] ||
        uploadedFiles[category.name].length === 0
      ) {
        errors[`document_${category.name}`] = `${category.name} is required`;
      }
    });

    if (formData.gmailAddress && !validateEmail(formData.gmailAddress)) {
      errors.gmailAddress = "Invalid email format";
    }

    const dateErrors = validateDates();
    Object.assign(errors, dateErrors);

    if (formData.experienceLevel === "") {
      errors.experienceLevel = "Please provide experience level";
    }

    // Only validate employment history for experienced candidates
    if (
      formData.experienceLevel === "Experienced" &&
      employmentHistory.length === 0
    ) {
      errors.employmentHistory =
        "At least one employment experience is required for experienced candidates";
    }

    if (Object.keys(errors).length > 0) {
      dispatchToast(
        <Toast>
          <ToastTitle>Please validate fields</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      setFormErrors(errors);
      setIsSubmitting(false);
    } else {
      try {
        await saveOrUpdateRequest(true); // true = submit

        dispatchToast(
          <Toast>
            <ToastTitle>BGV Request submitted successfully</ToastTitle>
          </Toast>,
          { intent: "success", timeout: 5000 }
        );

        setIsSubmitted(true);
        setOpenDialog(false)
        // Navigate to requests list or dashboard
        setTimeout(() => {
          navigate("/BGV");
        }, 1500);
      } catch (error) {
        console.error("Error submitting form:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to submit request</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSaveAsDraft = async () => {

    setIsUpdating(true);
    try {
      await saveOrUpdateRequest(false, true); // false = don't submit, true = is draft

      dispatchToast(
        <Toast>
          <ToastTitle>BGV Request saved as draft</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setTimeout(() => {
        navigate("/BGV");
      }, 2000);
    } catch (error) {
      console.error("Error saving draft:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to save draft</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApprove = async (comments: string) => {
    if (!currentID) return;

    if (!canApproveBGV) {
      dispatchToast(
        <Toast>
          <ToastTitle>Permission Denied</ToastTitle>
          <ToastBody>
            You don't have permission to approve BGV requests
          </ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    setIsApproving(true);

    try {
      await approveBGVRequest(
        currentID,
        "Approve",
        currentUser?.userID,
        comments,
        accessToken
      );
      // console.log(formData);
      await refreshToken().then(async (result: any) => {
        await ApproveBGVRequestNotification(
          "Approve",
          comments,
          formData,
          currentUser,
          accessToken
        );
      });

      setRequestStatus("Approved");
      loadExistingData()
      setIsApprovalDialogOpen(false);

      dispatchToast(
        <Toast>
          <ToastTitle>BGV Request Approved</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } catch (error) {
      console.error("Error approving request:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to approve request</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (comments: string) => {
    if (!currentID) return;

    setIsApproving(true);
    try {
      await approveBGVRequest(
        currentID,
        "Reject",
        currentUser?.userID,
        comments,
        accessToken
      );
      // console.log(formData);
      await refreshToken().then(async (result: any) => {
        await RejectBGVRequestNotification(
          "Reject",
          comments,
          formData,
          currentUser,
          accessToken
        );
      });

      setRequestStatus("Rejected");
      loadExistingData()
      setIsApprovalDialogOpen(false);

      dispatchToast(
        <Toast>
          <ToastTitle>BGV Request Rejected</ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
    } catch (error) {
      console.error("Error rejecting request:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to reject request</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsApproving(false);
    }
  };

  const handleComplete = async () => {
    if (!currentID) return;

    if (!canCloseBGV) {
      dispatchToast(
        <Toast>
          <ToastTitle>Permission Denied</ToastTitle>
          <ToastBody>You don't have permission to close BGV requests</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    setIsUpdating(true);
    try {
      await completeBGVRequest(currentID, currentUser?.userID, accessToken);
      setRequestStatus("Completed");
      await refreshToken().then(async (result: any) => {
        await CompletedBGVRequestNotification(
          "Completed",
          formData,
          currentUser,
          accessToken
        );
      });

      dispatchToast(
        <Toast>
          <ToastTitle>BGV Request Completed</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      loadExistingData()
    } catch (error) {
      console.error("Error completing request:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to complete request</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // console.log("uploadedFiles", uploadedFiles)

  const handleCancel = () => {
    if (isReadOnly) {

      navigate(-1); // Go back to previous page
    }
    else {
      navigate("/BGV")
    }
  };

  const styles = useStyles();

  const handleBgvSelect = (employee: Applicant | null) => {
    if (employee) {
      setFormData((prev) => ({
        ...prev,

        firstName: employee.firstName || "",
        lastName: employee.lastName || "",
        emailID: employee.email || "",
        gmailAddress: employee.email || "",
        currentGmail: employee.email || "",
        permanentGmail: employee.email || "",

        employeeCode: employee.ApplicantCode || "",
        candidateId: employee.ID,

        experienceLevel: employee.experienced ? "Experienced" : "Fresher",

        criminalCheckCurrentAddress: employee.address || "",

        currentMobile: employee.phone || "",

        // defaults / untouched fields
        permanentAddressSame: false,

      }));
    } else {
      // Reset form if no employee selected
      setFormData({
        firstName: "",
        lastName: "",
        emailID: "",
        fatherName: "",
        gender: "",
        maritalStatus: "",
        dateOfBirth: undefined,
        nationality: "Indian",
        employeeCode: "",
        experienceLevel: "",
        gmailAddress: "",
        criminalCheckCurrentAddress: "",
        currentFromDate: undefined,
        currentToDate: undefined,
        currentTelephone: "",
        currentMobile: "",
        permanentAddressSame: false,
        criminalCheckPermanentAddress: "",
        permanentFromDate: undefined,
        permanentToDate: undefined,
        permanentTelephone: "",
        permanentMobile: "",
        currentGmail: "",
        permanentGmail: "",
        year: "",
        candidateId: "",
      });
    }
  };


  // Get status badge appearance
  const getStatusBadge = () => {
    switch (requestStatus) {
      case "DRAFT":
        return (
          <Badge appearance="outline" color="subtle">
            Draft
          </Badge>
        );
      case "Submitted":
        return (
          <Badge appearance="filled" color="informative">
            Submitted
          </Badge>
        );
      case "Approved":
        return (
          <Badge appearance="filled" color="success">
            Approved
          </Badge>
        );
      case "Rejected":
        return (
          <Badge appearance="filled" color="danger">
            Rejected
          </Badge>
        );
      case "Completed":
        return (
          <Badge appearance="filled" color="success">
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isInitialLoading) {
    return (
      <FluentProvider>
        <Toaster toasterId={toastId} />
        <div className="flex flex-col items-center justify-center py-8 h-full">
          <Spinner />
          <Body1Strong className="mt-2">Loading form data...</Body1Strong>
        </div>
      </FluentProvider>
    );
  }

  if ((isSubmitting || isUpdating)) {
    return (
      <FluentProvider>
        <Toaster toasterId={toastId} />
        <div className="flex flex-col items-center justify-center py-8 h-screen">
          <Spinner />
          <Body1Strong className="mt-2">
            {isSubmitting ? "Submitting form..." : "Updating..."}
          </Body1Strong>
        </div>
      </FluentProvider>
    )
  }

  return (
    <FluentProvider>
      <Toaster toasterId={toastId} />
      <div className={styles.pageWrapper}>
        {!isInitialLoading && (
          <>
            {/* {(isSubmitting || isUpdating) && (
            
          )} */}

            {/* Header */}

            {isView === false && (
              <div className={styles.headerSection}>
                {requestDetails && (
                  <div className="mb-6">
                    <BGVHorizontalStepper
                      bgvRequest={requestDetails.bgvRequest}
                      approvalHistory={approvalHistory || []}
                    />
                  </div>
                )}
                {/* <div>
                <BGVMainStepper
                  handleStep={handleStep}
                  activeStep={activeStep}
                  steps={[
                    { label: "Personal Details", icon: <Person24Regular /> },
                    { label: "Address Details", icon: <Location24Regular /> },
                    {
                      label: "Employment Details",
                      icon: <Briefcase24Regular />,
                    },
                    { label: "Documents", icon: <Document24Regular /> },
                  ]}
                />
              </div> */}
              </div>
            )}

            {isView === false && (
              <div className={styles.formContentContainer}>
                {/* Personal Details Section */}

                <div className="border-1 border-gray-200 rounded-xl">
                  <Card className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0C59A4] text-white">
                          <Person24Regular />
                        </div>
                        <div className={styles.headerContent}>
                          <Subtitle2>Candidate Information</Subtitle2>
                          <Caption1 className={styles.headerCaption}>
                            Please fill the candidate information
                          </Caption1>
                        </div>
                      </div>


                    </div>

                    <div className={styles.formGrid}>
                      <UserCombobox
                        label="Full Name"
                        placeholder="Enter Employee Name"
                        required
                        value={formData.firstName}
                        onUserSelect={handleBgvSelect}
                        disabled={!handleFormDisable() || isStatusLocked}

                      />
                      <Field
                        label="First Name"
                        required
                        validationState={
                          formErrors.firstName ? "error" : undefined
                        }
                        validationMessage={formErrors.firstName}
                        className="!text-sm !font-semibold"
                      >
                        <Input
                          name="firstName"
                          placeholder="Enter First Name"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          disabled={true}
                          className={styles.fields}
                        />
                      </Field>

                      <Field
                        label="Last Name"
                        required
                        validationState={
                          formErrors.lastName ? "error" : undefined
                        }
                        validationMessage={formErrors.lastName}
                        className="!text-sm !font-semibold"
                      >
                        <Input
                          name="lastName"
                          placeholder="Enter Last Name"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          disabled={true}
                          className={styles.fields}
                        />
                      </Field>

                      <Field
                        label="Father's Name"
                        required
                        validationState={
                          formErrors.fatherName ? "error" : undefined
                        }
                        validationMessage={formErrors.fatherName}
                        className="!text-sm !font-semibold"
                      >
                        <Input
                          name="fatherName"
                          placeholder="Enter Father's Name"
                          value={formData.fatherName}
                          onChange={handleInputChange}
                          disabled={!handleFormDisable() || isStatusLocked}
                          className={styles.fields}
                        />
                      </Field>

                      <Field
                        label="Gender"
                        required
                        validationState={
                          formErrors.gender ? "error" : undefined
                        }
                        validationMessage={formErrors.gender}
                        className="!text-sm !font-semibold"
                      >
                        <FluentProvider>
                          {" "}
                          <Dropdown
                            style={{ width: "100%" }}
                            placeholder="Select Gender"
                            value={formData.gender}
                            onOptionSelect={(event, data) =>
                              handleDropdownChange(event, {
                                ...data,
                                name: "gender",
                              })
                            }
                            disabled={!handleFormDisable() || isStatusLocked}
                            className={styles.fields}
                          >
                            {genderOptions.map((option) => (
                              <Option key={option.value} value={option.value}>
                                {option.text}
                              </Option>
                            ))}
                          </Dropdown>
                        </FluentProvider>
                      </Field>

                      {/* <Field
                        label="Marital Status"
                        required
                        validationState={
                          formErrors.maritalStatus ? "error" : undefined
                        }
                        validationMessage={formErrors.maritalStatus}
                        className="!text-sm !font-semibold"
                      >
                        <FluentProvider>
                          {" "}
                          <Dropdown
                            style={{ width: "100%" }}
                            placeholder="Select Marital Status"
                            value={formData.maritalStatus}
                            onOptionSelect={(event, data) =>
                              handleDropdownChange(event, {
                                ...data,
                                name: "maritalStatus",
                              })
                            }
                            disabled={!handleFormDisable() || isStatusLocked}
                            className={styles.fields}
                          >
                            {maritalStatusOptions.map((option) => (
                              <Option key={option.value} value={option.value}>
                                {option.text}
                              </Option>
                            ))}
                          </Dropdown>
                        </FluentProvider>
                      </Field> */}

                      <Field
                        label="Date of Birth"
                        required
                        validationState={
                          formErrors.dateOfBirth ? "error" : undefined
                        }
                        validationMessage={formErrors.dateOfBirth}
                        className="!text-sm !font-semibold"
                      >
                        <FluentProvider>
                          <DatePicker
                            style={{ width: "100%" }}
                            maxDate={new Date()}
                            placeholder="Select Date of Birth"
                            value={formData.dateOfBirth}
                            onSelectDate={(date) =>
                              handleDateChange(date, "dateOfBirth")
                            }
                            disabled={!handleFormDisable() || isStatusLocked}
                            className={styles.fields}
                          />
                        </FluentProvider>
                      </Field>

                      <Field
                        label="Country of Citizenship"
                        required
                        validationState={
                          formErrors.nationality ? "error" : undefined
                        }
                        validationMessage={formErrors.nationality}
                        className="!text-sm !font-semibold"
                      >
                        <Input
                          name="nationality"
                          placeholder="Enter Nationality"
                          value={formData.nationality}
                          onChange={handleInputChange}
                          disabled={!handleFormDisable() || isStatusLocked}
                          className={styles.fields}
                        />
                      </Field>

                      <Field
                        label="Employee Code"
                        validationState={
                          formErrors.employeeCode ? "error" : undefined
                        }
                        validationMessage={formErrors.employeeCode}
                        className="!text-sm !font-semibold"
                      >
                        <Input
                          name="employeeCode"
                          placeholder="Enter Employee Code"
                          value={formData.employeeCode}
                          onChange={handleInputChange}
                          disabled={!handleFormDisable() || isStatusLocked}
                          className={styles.fields}
                        />
                      </Field>

                      <Field
                        label="Email Address"
                        required
                        validationState={
                          formErrors.gmailAddress ? "error" : undefined
                        }
                        validationMessage={formErrors.gmailAddress}
                        className="!text-sm !font-semibold"

                      >
                        <Input
                          type="email"
                          name="gmailAddress"
                          placeholder="Enter Personal Email Address"
                          value={formData.gmailAddress}
                          onChange={handleInputChange}
                          disabled={true}
                          className={styles.fields}
                        />
                      </Field>
                    </div>
                  </Card>
                </div>


                {/* Address Details Section */}
                <div className="flex flex-col gap-5">
                  <div className="border-1 border-gray-200 rounded-xl">
                    <Card className={styles.sectionCard}>
                      <div className={styles.sectionHeader}>
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0C59A4] text-white">
                            <Location24Regular />
                          </div>
                          <div className={styles.headerContent}>
                            <Subtitle2>Current Address</Subtitle2>
                            <Caption1 className={styles.headerCaption}>
                              Please fill the Current address details
                            </Caption1>
                          </div>
                        </div>


                      </div>

                      <div className={styles.addressSection}>
                        <div className="space-y-4">
                          <Field
                            label="Current Address for Verification"
                            required
                            validationState={
                              formErrors.criminalCheckCurrentAddress
                                ? "error"
                                : undefined
                            }
                            validationMessage={
                              formErrors.criminalCheckCurrentAddress
                            }
                            className={`${styles.fullWidthField} !text-sm !font-semibold`}
                          >
                            <Textarea
                              placeholder="Enter Current Address"
                              name="criminalCheckCurrentAddress"
                              value={formData.criminalCheckCurrentAddress}
                              onChange={handleInputChange}
                              resize="vertical"
                              disabled={!handleFormDisable() || isStatusLocked}
                              className={styles.fields}
                            />
                          </Field>

                          <div className={styles.innerformGrid}>
                            <Field
                              label="From Date"
                              required
                              validationState={
                                formErrors.currentFromDate ? "error" : undefined
                              }
                              validationMessage={formErrors.currentFromDate}
                              className="!text-sm !font-semibold"
                            >
                              <FluentProvider>
                                <DatePicker
                                  style={{ width: "100%" }}
                                  placeholder="Select From Date"
                                  value={formData.currentFromDate}
                                  onSelectDate={(date) =>
                                    handleDateChange(date, "currentFromDate")
                                  }
                                  disabled={!handleFormDisable() || isStatusLocked}
                                  className={styles.fields}
                                />
                              </FluentProvider>
                            </Field>

                            <Field
                              label="To Date"
                              required
                              validationState={
                                formErrors.currentToDate ? "error" : undefined
                              }
                              validationMessage={formErrors.currentToDate}
                              className="!text-sm !font-semibold"
                            >
                              <FluentProvider>
                                <DatePicker
                                  style={{ width: "100%" }}
                                  placeholder="Select To Date"
                                  value={formData.currentToDate}
                                  onSelectDate={(date) =>
                                    handleDateChange(date, "currentToDate")
                                  }
                                  disabled={!handleFormDisable() || isStatusLocked}
                                  className={styles.fields}
                                />
                              </FluentProvider>
                            </Field>

                            <Field
                              label="Telephone (Optional)"
                              validationState={
                                formErrors.currentTelephone
                                  ? "error"
                                  : undefined
                              }
                              validationMessage={formErrors.currentTelephone}
                              className="!text-sm !font-semibold"
                            >
                              <Input
                                type="tel"
                                placeholder="Enter Telephone Number"
                                name="currentTelephone"
                                value={formData.currentTelephone}
                                onChange={handleInputChange}
                                disabled={!handleFormDisable() || isStatusLocked}
                                className={styles.fields}
                              />
                            </Field>

                            <Field
                              label="Mobile"
                              required
                              validationState={
                                formErrors.currentMobile ? "error" : undefined
                              }
                              validationMessage={formErrors.currentMobile}
                              className="!text-sm !font-semibold"
                            >
                              <Input
                                name="currentMobile"
                                placeholder="Enter Mobile Number"
                                value={formData.currentMobile}
                                onChange={handleInputChange}
                                type="tel"
                                disabled={!handleFormDisable() || isStatusLocked}
                                className={styles.fields}
                              />
                            </Field>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>

                  <div className="border-1 border-gray-200 rounded-xl ">
                    <Card className={styles.sectionCard}>
                      <div className={styles.sectionHeader}>
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0C59A4] text-white">
                            <Location24Regular />
                          </div>
                          <div className={styles.headerContent}>
                            <Subtitle2>Permanent Address</Subtitle2>
                            <Caption1 className={styles.headerCaption}>
                              Please fill the Permanent address details
                            </Caption1>
                          </div>
                        </div>

                      </div>

                      <div className="p-2 rounded-xl bg-gray-100 border-1 border-gray-200" style={{ margin: "20px 20px 0px 20px" }}>
                        <Checkbox
                          label="Same as current address"
                          name="permanentAddressSame"
                          checked={formData.permanentAddressSame}
                          onChange={(ev, data) =>
                            handleCheckboxChange(ev, data)
                          }
                          disabled={!handleFormDisable() || isStatusLocked}
                          className="!text-gray-800 !font-medium"
                        />
                      </div>

                      <div className={styles.addressSection}>
                        <div className="space-y-4">
                          <Field
                            label="Permanent Address for Verification"
                            required
                            validationState={
                              formErrors.criminalCheckPermanentAddress
                                ? "error"
                                : undefined
                            }
                            validationMessage={
                              formErrors.criminalCheckPermanentAddress
                            }
                            className={styles.fullWidthField}
                          >
                            <Textarea
                              placeholder="Enter Permanent Address"
                              name="criminalCheckPermanentAddress"
                              value={formData.criminalCheckPermanentAddress}
                              onChange={handleInputChange}
                              disabled={
                                formData.permanentAddressSame || !handleFormDisable() || isStatusLocked
                              }
                              resize="vertical"
                              className={styles.fields}
                            />
                          </Field>

                          <div className={styles.innerformGrid}>
                            <Field
                              label="From Date"
                              validationState={
                                formErrors.permanentFromDate
                                  ? "error"
                                  : undefined
                              }
                              validationMessage={formErrors.permanentFromDate}
                              className="!text-sm !font-semibold"
                            >
                              <FluentProvider>
                                {" "}
                                <DatePicker
                                  style={{ width: "100%" }}
                                  placeholder="Select From Date"
                                  value={formData.permanentFromDate}
                                  onSelectDate={(date) =>
                                    handleDateChange(date, "permanentFromDate")
                                  }
                                  disabled={
                                    formData.permanentAddressSame || !handleFormDisable() || isStatusLocked
                                  }
                                  className={styles.fields}
                                />
                              </FluentProvider>
                            </Field>

                            <Field
                              label="To Date"
                              validationState={
                                formErrors.permanentToDate ? "error" : undefined
                              }
                              validationMessage={formErrors.permanentToDate}
                              className="!text-sm !font-semibold"
                            >
                              <FluentProvider>
                                <DatePicker
                                  style={{ width: "100%" }}
                                  placeholder="Select To Date"
                                  value={formData.permanentToDate}
                                  onSelectDate={(date) =>
                                    handleDateChange(date, "permanentToDate")
                                  }
                                  disabled={
                                    formData.permanentAddressSame || !handleFormDisable() || isStatusLocked
                                  }
                                  className={styles.fields}
                                />
                              </FluentProvider>
                            </Field>

                            <Field
                              label="Telephone (Optional)"
                              validationState={
                                formErrors.permanentTelephone
                                  ? "error"
                                  : undefined
                              }
                              validationMessage={formErrors.permanentTelephone}
                              className="!text-sm !font-semibold"
                            >
                              <Input
                                type="tel"
                                placeholder="Enter Telephone Number"
                                name="permanentTelephone"
                                value={formData.permanentTelephone}
                                onChange={handleInputChange}
                                disabled={
                                  formData.permanentAddressSame || !handleFormDisable() || isStatusLocked
                                }
                                className={styles.fields}
                              />
                            </Field>

                            <Field
                              label="Mobile"
                              required
                              validationState={
                                formErrors.permanentMobile ? "error" : undefined
                              }
                              validationMessage={formErrors.permanentMobile}
                              className="!text-sm !font-semibold"
                            >
                              <Input
                                type="tel"
                                placeholder="Enter Mobile Number"
                                name="permanentMobile"
                                value={formData.permanentMobile}
                                onChange={handleInputChange}
                                disabled={
                                  formData.permanentAddressSame || !handleFormDisable() || isStatusLocked
                                }
                                className={styles.fields}
                              />
                            </Field>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>


                {/* Employment Details Section */}

                <div className="border-1 border-gray-200 rounded-xl">
                  <Card className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0C59A4] text-white">
                          <Briefcase24Regular />
                        </div>
                        <div className={styles.headerContent}>
                          <Subtitle2>Employment history</Subtitle2>
                          <Caption1 className={styles.headerCaption}>
                            Please fill the employement details
                          </Caption1>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: "20px" }}>
                      <Field
                        label="Experience Level"
                        required
                        validationState={
                          formErrors.experienceLevel ? "error" : undefined
                        }
                        validationMessage={formErrors.experienceLevel}
                        className="!text-sm !font-semibold mb-2"
                      >
                        <FluentProvider>
                          {" "}
                          <Dropdown
                            style={{ width: "100%" }}
                            placeholder="Select Experience Level"
                            value={formData.experienceLevel}
                            onOptionSelect={(event, data) =>
                              handleDropdownChange(event, {
                                ...data,
                                name: "experienceLevel",
                              })
                            }
                            disabled={false}
                            className={styles.fields}
                          >
                            {experienceOptions.map((option) => (
                              <Option key={option.value} value={option.value}>
                                {option.text}
                              </Option>
                            ))}
                          </Dropdown>
                        </FluentProvider>
                      </Field>

                      {formErrors.employmentHistory && (
                        <div className="mb-1 p-2 bg-red-50 border border-red-200 rounded-lg">
                          <Body1Strong className="text-red-700">
                            {formErrors.employmentHistory}
                          </Body1Strong>
                        </div>
                      )}

                      {/* Employment History Section - Only show for Experienced */}
                      {formData.experienceLevel === "Experienced" && (
                        <div>
                          <div className="flex items-center justify-between w-full m-1">
                            <div></div>
                            {formData.experienceLevel === "Experienced" &&
                              handleFormDisable() && !isStatusLocked && (
                                <Button
                                  icon={<AddCircle20Regular />}
                                  appearance="primary"
                                  onClick={() => {
                                    setEditingExperience(null);
                                    setIsEmploymentHistoryDialogOpen(true);
                                  }}
                                  className="!bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] !text-white !rounded-2xl !border-0 !px-3 !py-2 !font-medium"
                                >
                                  Add Employment History
                                </Button>
                              )}
                          </div>

                          {renderEmploymentHistory()}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>


                {/* Documents Section */}
                <div className="border-1 border-gray-200 rounded-xl">
                  <Card className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0C59A4] text-white">
                          <Document24Regular />
                        </div>
                        <div className={styles.headerContent}>
                          <Subtitle2>Documents</Subtitle2>
                          <Caption1 className={styles.headerCaption}>
                            Please attach documents
                          </Caption1>
                        </div>
                      </div>


                    </div>

                    <div style={{ padding: "20px" }}>
                      {Object.keys(formErrors).some((key) =>
                        key.startsWith("document_")
                      ) && (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <Body1Strong className="text-red-700">
                              Missing Required Documents:
                            </Body1Strong>
                            <ul className="mt-2 text-red-600">
                              {Object.entries(formErrors)
                                .filter(([key]) => key.startsWith("document_"))
                                .map(([key, message]) => (
                                  <li key={key} className="ml-4">
                                    • {message}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}

                      <div className={styles.documentSection}>
                        <DocumentManagement
                          currentID={currentID}
                          onFileUpload={handleFileUpload}
                          onFileRemove={handleFileRemove}
                          uploadedFiles={uploadedFiles}
                          isReadOnly={!handleFormDisable() || isStatusLocked}
                          documentCategories={documentCategories}
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            <DocumentConfirmation
              open={OpenDialog}
              setOpen={setOpenDialog}
              uploadedFiles={uploadedFiles}
              handleFormSubmit={handleFormSubmit}
            />

            {isView && <ViewBgvDetails data={formData} />}

            {/* Action Buttons - Fixed Footer */}
            <div
              className={styles.buttonContainer}
              style={{
                justifyContent: "space-between",
                width: "100%"
              }}
            >
              <div className="flex gap-3">

                <Button
                  onClick={handleCancel}
                  appearance="subtle"
                  icon={<Dismiss24Regular />}
                >
                  {isReadOnly ? "Back" : "Cancel"}
                </Button>
                {!isReadOnly && requestStatus === "DRAFT" && (
                  <MessageBar
                    icon={<CheckmarkCircle20Regular />}
                    key={"info"}
                    intent={"success"}
                    className="!border-0 !rounded-xl"
                  >
                    <MessageBarBody className="!text-[#15803D]">
                      Draft Mode: You can save your progress or submit when ready
                    </MessageBarBody>
                  </MessageBar>
                )}

                {/* Permission Denied Messages */}
                {isEditMode && requestStatus === "DRAFT" && !canEditBGV && (
                  <MessageBar
                    key={"permission-denied"}
                    intent={"warning"}
                    className="!border-0 !rounded-xl"
                  >
                    <MessageBarBody>
                      You don't have permission to edit this BGV request. Please
                      contact your administrator.
                    </MessageBarBody>
                  </MessageBar>
                )}

                {isApprovalMode && requestStatus === "Submitted" && !canApproveBGV && (
                  <MessageBar
                    key={"approval-permission-denied"}
                    intent={"warning"}
                    className="!border-0 !rounded-xl "
                  >
                    <MessageBarBody>
                      You don't have permission to approve/reject BGV requests.
                      Please contact your administrator.
                    </MessageBarBody>
                  </MessageBar>
                )}

                {requestStatus === "Approved" && !canCloseBGV && (
                  <MessageBar
                    key={"close-permission-denied"}
                    intent={"warning"}
                    className="!border-0 !rounded-xl"
                  >
                    <MessageBarBody>
                      You don't have permission to close/complete BGV requests.
                      Please contact your administrator.
                    </MessageBarBody>
                  </MessageBar>
                )}
              </div>
              {/* Action buttons with improved layout */}
              <div className="flex  justify-between gap-4 w-fit">
                {/* Navigation/Cancel */}


                {/* Submit Request - only show for draft status and not for locked statuses */}
                <div className="flex gap-3 items-center">
                  {
                    requestStatus === "DRAFT" &&
                    !isStatusLocked &&
                    (canEditBGV || canCreateBGV) && (
                      <Button
                        onClick={handleSaveAsDraft}
                        disabled={isUpdating || isSubmitting}
                        className="border-blue-600 text-blue-600 !rounded-2xl"
                        icon={
                          isUpdating ? <Spinner size="tiny" /> : <Save20Regular />
                        }
                      >
                        {isEditMode ? "Update Draft" : "Save Draft"}
                      </Button>
                    )}

                  <div
                    className={`${"bg-white !p-0 !border-0"

                      }   rounded-3xl`}
                  >
                    {handleFormDisable() && !isStatusLocked && (
                      <Button
                        appearance="primary"
                        className={`${"!bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] !text-white"

                          } !rounded-2xl `}
                        onClick={handleNext}
                        disabled={isSubmitting || isUpdating || isSubmitted}
                        icon={activeStep === 3 ? null : <ArrowRight20Filled />}
                        iconPosition="after"
                      >
                        {isEditMode
                          ? "Update"
                          :
                          "Submit"
                        }
                      </Button>
                    )}
                  </div>

                  {/* Approval actions */}
                  {canApprove && (
                    <Button
                      appearance="transparent"
                      icon={<Comment24Regular />}
                      onClick={() => setIsApprovalDialogOpen(true)}
                      className="bg-blue-600"
                    >
                      Review Request
                    </Button>
                  )}

                  

                  

                  {/* Complete action */}
                  {canComplete && (
                    <Button
                      appearance="primary"
                      className={`${activeStep === 3
                          ? "!bg-gradient-to-br from-[#0153A5] to-[#2FC2FE] !text-white"
                          : "!bg-white !text-gray-800"
                        } !rounded-2xl !border-1 !border-gray-300`}
                      icon={
                        isUpdating ? (
                          <Spinner size="tiny" />
                        ) : (
                          <CheckmarkCircle24Regular />
                        )
                      }
                      onClick={handleComplete}
                      disabled={isUpdating}
                    >
                      Mark as Completed
                    </Button>
                  )}

                  {/* Trigger Email */}

                  {
                    canComplete && (
                      <Menu positioning="above-end" onOpenChange={()=>handleFetchTriggerEmailDetails()}>
                        <MenuTrigger disableButtonEnhancement>
                          {(triggerProps: MenuButtonProps) => (
                            <SplitButton
                              menuButton={triggerProps}
                              primaryActionButton={primaryActionButtonProps}
                              shape = "circular"
                              disabled={IsLoadingInitiateMail}
                              
                            >
                              {IsLoadingInitiateMail ? (
                                <Spinner size="tiny" />
                              ) : (
                                "Initiate"
                              )}
                            </SplitButton>
                          )}
                        </MenuTrigger>

                        <MenuPopover>
                          <MenuList className="max-h-[300px] overflow-y-auto">
                            {TriggeredHisTory.length > 0 ? (
                                TriggeredHisTory.map((item, index) => (
                                  <MenuItem key={index} disabled>
                                    <Persona
                                      name={item.name}
                                      
                                      tertiaryText={formatDate(new Date(item.createdAt))}
                                    />
                                  </MenuItem>
                                ))
                              )
                                 : 
                                (<MenuItem disabled>No emails triggered yet</MenuItem>
                              )
                                 

                            }
                           
                          </MenuList>
                        </MenuPopover>
                      </Menu>
                    )
                  }

                  {Id != null && isEditMode ? (
                    <>
                      <BackgroundVerificationPDFDialog code={Id} />
                    </>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            </div>

            <EmploymentHistoryDialog
              isOpen={isViewingExperienceOpen}
              onClose={() => {
                setIsViewingExperienceOpen(false);
                setViewingExperience(null);
              }}
              onAdd={() => { }} // Empty function since this is read-only
              experience={viewingExperience}
              isEditMode={false}
              readOnly={true}
            />

            {/* Dialogs */}
            <EmploymentHistoryDialog
              isOpen={isEmploymentHistoryDialogOpen}
              onClose={() => {
                setIsEmploymentHistoryDialogOpen(false);
                setEditingExperience(null); // Clear editing state when closing
              }}
              onAdd={handleAddOrUpdateExperience}
              experience={editingExperience}
              isEditMode={!!editingExperience}
              readOnly={false}
            />

            <ApprovalDialog
              isOpen={isApprovalDialogOpen}
              onClose={() => setIsApprovalDialogOpen(false)}
              onApprove={handleApprove}
              onReject={handleReject}
              isLoading={isApproving}
            />

          </>
        )}
      </div>
    </FluentProvider>
  );
};

export default EmployeeBGVForm;
