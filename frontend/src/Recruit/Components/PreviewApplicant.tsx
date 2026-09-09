import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Input,
  Field,
  Textarea,
  Badge,
  Switch,
  Button,
  makeStyles,
  tokens,
  shorthands,
  MessageBar,
  MessageBarBody,
  Spinner,
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogBody,
  ProgressBar,
  FluentProvider,
  useId,
  useToastController,
  Toast,
  ToastTitle,
  Toaster,
  Caption2,
  TabList,
  Tab,
  createLightTheme,
} from "@fluentui/react-components";
import {
  PersonRegular,
  EditRegular,
  SaveRegular,
  DismissRegular,
  CloudArrowUpRegular,
  DocumentBulletList20Regular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  FireRegular,
  ArrowResetRegular,
  BriefcaseRegular,
  BookRegular,
  Certificate20Regular,
  Eye20Filled,
} from "@fluentui/react-icons";
import { AzureAIService } from "../../Services/AzureAIService";
import { AzureBlobService } from "../../Services/AzureBlobService";
import { updateApplicant, deleteApplicant } from "../../Services/Resume";
import { getJDRequestById } from "../../Services/JDRequests";
import { useAuth } from "../../Auth/AuthProvider";

interface Applicant {
  ID: string;
  ApplicantCode: string;
  jobPostingId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string | null;
  education: string;
  experienced: boolean;
  experienceDetails: string;
  fileName: string;
  fileSize: string;
  uploadDate: string;
  blobUrl: string;
  blobPath: string;
  Status: string;
  CreatedAt: string;
  ModifiedAt: string | null;
  skills: Array<{ value: string }>;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  education?: string;
  experienceDetails?: string;
  skills?: string;
  duplicate?: string;
}

interface JDData {
  id: string;
  jobId: string;
  jobSequence: string;
  jobRole: string;
  jobNature: string;
  department: string;
  targetDate: Date | null | undefined;
  numPositions: number;
  workExperience: number;
  salaryRange: number;
  jobLocation: string;
  status: string;
  skills: Array<{ name: string; rating: number }>;
  jobDescription: string;
  reportingManager: {
    id: string;
    displayName: string;
    email: string;
  } | null;
  holdReason?: string;
  cancelledReason?: string;
  createdBy: any;
  createdByUserID?: string; // Add this field for permission checking
}

interface PreviewApplicantProps {
  jobId: string;
  applicant: Applicant;
  onUpdate?: (updatedData: Partial<Applicant>) => void;
  onClose?: () => void;
}

const useStyles = makeStyles({
  container: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  uploadedFile: {
    display: "flex",
    alignItems: "center",
    ...shorthands.gap("12px"),
    ...shorthands.padding("12px"),
    ...shorthands.border("1px", "solid", "#e5e7eb"),
    ...shorthands.borderRadius("6px"),
    backgroundColor: "#DAE6EF",
    marginTop: "4px",
    // width: "300px",
  },
  fileIcon: {
    color: "#ffffff",
    height: "25px",
    width: "25px",
  },
  fileName: {
    flex: 1,
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },
  removeFileButton: {
    color: "#6b7280",
    cursor: "pointer",
    ":hover": {
      color: "#374151",
    },
  },
  formContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: "none",
  },

  fieldGroup: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: tokens.spacingVerticalL,
    marginBottom: tokens.spacingVerticalXL,
  },

  fullWidthField: {
    gridColumn: "1 / -1",
  },

  skillsContainer: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    border: `none`,
    backgroundColor: "transparent",
    transition: "all 0.2s ease",
  },

  skillsContainerActive: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
  },

  skillBadge: {
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: tokens.colorPaletteRedBackground1,
      color: tokens.colorPaletteRedForeground1,
      transform: "scale(1.05)",
    },
  },

  actionButton: {
    minWidth: "120px",
    fontWeight: tokens.fontWeightSemibold,
  },

  reprocessButton: {
    background: `linear-gradient(135deg, ${tokens.colorPaletteDarkOrangeBackground2} 0%, ${tokens.colorPaletteDarkOrangeBorderActive} 100%)`,
    border: "none",
  },
  statusMessage: {
    marginBottom: tokens.spacingVerticalM,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },

  metadataCard: {
    boxShadow: "none",
    backgroundColor: "transparent",
    padding: "10px 0 !important",
    ...shorthands.padding(tokens.spacingVerticalM),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },

  metadataItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: tokens.spacingVerticalXS,
    paddingBottom: tokens.spacingVerticalXS,
  },
});

const myBrandColors = {
  10: "#020305",
  20: "#111823",
  30: "#16263d",
  40: "#193253",
  50: "#1b3f6a",
  60: "#1b4c82",
  70: "#18599b",
  80: "#1267b4",
  90: "#3174c2",
  100: "#0078D4",
  110: "#6790ce",
  120: "#7f9fd4",
  130: "#96aeda",
  140: "#adbde0",
  150: "#c5cde6",
  160: "#dcddec",
};

export const PreviewApplicant: React.FC<PreviewApplicantProps> = ({
  jobId,
  applicant,
  onUpdate,
  onClose,
}) => {
  const lightTheme = createLightTheme(myBrandColors);
  // const darkTheme = createDarkTheme(myBrandColors);
  const styles = useStyles();
  type FormData = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string | null;
    education: string;
    experienced: boolean;
    experienceDetails: string;
    skills: string[];
    blobUrl?: string;
    blobPath?: string;
    fileName?: string;
    fileSize?: string;
    uploadDate?: string;
  };
  const [JDData, setJDData] = useState<JDData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    firstName: applicant.firstName || "",
    lastName: applicant.lastName || "",
    email: applicant.email || "",
    phone: applicant.phone || "",
    address: applicant.address || "",
    education: applicant.education || "",
    experienced: applicant.experienced || false,
    experienceDetails: applicant.experienceDetails || "",
    skills: applicant.skills?.map((s) => s.value) || [],
    blobUrl: applicant.blobUrl,
    blobPath: applicant.blobPath,
    fileName: applicant.fileName,
    fileSize: applicant.fileSize,
    uploadDate: applicant.uploadDate,
  });

  const [newSkill, setNewSkill] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [showReprocessDialog, setShowReprocessDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // Resume update states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUpdatingResume, setIsUpdatingResume] = useState(false);
  const [showUpdateResumeDialog, setShowUpdateResumeDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const toasterId = useId("applicants-toaster");
  const { dispatchToast } = useToastController(toasterId);
  const { currentUser, accessToken }: any = useAuth();
  // Permission checks
  const canManageApplicant =
    currentUser?.permissions?.recruit?.candidate_app?.manage_app === true;

  const canApproveRejectApplicant =
    currentUser?.permissions?.recruit?.candidate_app?.approve_reject_app ===
    true;

  const canManageResume = () => {
    return canManageApplicant && JDData?.status === "Active";
  };
  const hasApplicantAccess = canManageApplicant || canApproveRejectApplicant;

  const canEditApplicant = () => {
    return canManageApplicant && JDData?.status === "Active";
  };
  React.useEffect(() => {
    const loadJDRequestData = async () => {
      if (!jobId) {
        console.error("No JD Request ID provided");

        return;
      }

      try {
        const result = await getJDRequestById(jobId, accessToken);

        if (result.success && result.data) {
          const data = result.data;
          const formattedData = {
            id: data.ID,
            jobId: data.JobID || "",
            jobSequence: data.JDCode || "",
            jobRole: data.JobRole || "",
            jobNature: data.JobNature || "",
            department: data.Department || "",
            targetDate: data.TargetDate ? new Date(data.TargetDate) : null,
            numPositions: data.NumPositions || 1,
            workExperience: data.WorkExperience || 0,
            salaryRange: data.SalaryRange || 10,
            jobLocation: data.JobLocation || "",
            jobDescription: data.JobDescription || "",
            status: data.Status || "Active",
            skills: Array.isArray(data.Skills)
              ? data.Skills.map((skill: any) => ({
                  name: skill.Name || "",
                  rating: skill.Rating || 0,
                }))
              : [],
            reportingManager: data.reportingManager
              ? {
                  id: data.reportingManager.id,
                  displayName: data.reportingManager.displayName,
                  email: data.reportingManager.email,
                }
              : null,
            holdReason: data.HoldReason || "",
            cancelledReason: data.CancelledReason || "",
            createdBy: data.createdBy,
            createdByUserID: data.CreatedByUserID || data.createdBy?.userID, // Handle different possible field names
          };

          setJDData(formattedData);
        } else {
          // console.log("Failed to load JD request data");
        }
      } catch (error) {
        console.error("Error loading JD request:", error);
      }
    };

    loadJDRequestData();
  }, [jobId]);

  // useEffect(() => {
  //   console.log(formData);
  // }, [formData]);

  useEffect(() => {
    setFormData({
      firstName: applicant.firstName || "",
      lastName: applicant.lastName || "",
      email: applicant.email || "",
      phone: applicant.phone || "",
      address: applicant.address || "",
      education: applicant.education || "",
      experienced: applicant.experienced || false,
      experienceDetails: applicant.experienceDetails || "",
      skills: applicant.skills?.map((s) => s.value) || [],
      blobUrl: applicant.blobUrl,
      blobPath: applicant.blobPath,
      fileName: applicant.fileName,
      fileSize: applicant.fileSize,
      uploadDate: applicant.uploadDate,
    });
  }, [applicant]); // ✅ React to changes in applicant prop

  // Temp storage states
  const [tempBlobData, setTempBlobData] = useState<{
    url: string;
    blobPath: string;
  } | null>(null);

  // Services
  const blobService = new AzureBlobService();
  const aiService = new AzureAIService();

  // Enhanced validation patterns
  const validationPatterns = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/,
    name: /^[a-zA-Z\s\-']{0,50}$/,
  };

  const validateField = (field: string, value: string): string | undefined => {
    if (!value || value.trim().length === 0) {
      if (["firstName", "email", "phone"].includes(field)) {
        return `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
      return undefined;
    }

    const trimmedValue = value.trim();

    switch (field) {
      case "firstName":
      case "lastName":
        if (!validationPatterns.name.test(trimmedValue)) {
          return "Name must contain only letters, spaces, hyphens, and apostrophes";
        }

        break;
      case "email":
        if (!validationPatterns.email.test(trimmedValue)) {
          return "Please enter a valid email address";
        }
        break;
      case "phone":
        if (!validationPatterns.phone.test(trimmedValue)) {
          return "Please enter a valid phone number";
        }
        break;
      case "education":
        if (trimmedValue.length < 10) {
          return "Please provide more detailed education information";
        }
        break;
      case "experienceDetails":
        if (formData.experienced && trimmedValue.length < 20) {
          return "Please provide more detailed experience information";
        }
        break;
    }
    return undefined;
  };

  // Check for duplicate applicant by name or email
  const checkForDuplicateApplicant = async (
    firstName: string,
    lastName: string,
    email: string
  ): Promise<string | null> => {
    try {
      // This would be an API call to check for duplicates
      // For now, implementing a placeholder - replace with actual API call
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/applicant/check-duplicate`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            excludeId: applicant.ID, // Exclude current applicant from duplicate check
          }),
        }
      );

      const result = await response.json();

      if (result.isDuplicate) {
        if (result.duplicateType === "name") {
          return `An applicant with the name "${firstName} ${lastName}" already exists.`;
        } else if (result.duplicateType === "email") {
          return `An applicant with the email "${email}" already exists.`;
        } else {
          return `An applicant with this name and email already exists.`;
        }
      }

      return null;
    } catch (error) {
      console.error("Error checking for duplicates:", error);
      return null; // Don't block save if duplicate check fails
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (saveStatus === "saved") {
      setSaveStatus("idle");
      setStatusMessage("");
    }

    // Clear duplicate error when user changes relevant fields
    if (field === "firstName" || field === "lastName" || field === "email") {
      setValidationErrors((prev) => {
        const { duplicate, ...rest } = prev;
        return rest;
      });
    }

    if (typeof value === "string") {
      const error = validateField(field, value);
      setValidationErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const errors: ValidationErrors = {};
    let isValid = true;

    const requiredFields = ["firstName", "email", "phone"];
    requiredFields.forEach((field) => {
      const error = validateField(
        field,
        (formData[field as keyof typeof formData] as string) || ""
      );
      if (error) {
        errors[field as keyof ValidationErrors] = error;
        isValid = false;
      }
    });

    const optionalFields = ["lastName", "education"];
    optionalFields.forEach((field) => {
      if (formData[field as keyof typeof formData]) {
        const error = validateField(
          field,
          formData[field as keyof typeof formData] as string
        );
        if (error) {
          errors[field as keyof ValidationErrors] = error;
          isValid = false;
        }
      }
    });

    if (formData.experienced && formData.experienceDetails) {
      const error = validateField(
        "experienceDetails",
        formData.experienceDetails
      );
      if (error) {
        errors.experienceDetails = error;
        isValid = false;
      }
    }

    if (formData.skills && formData.skills.length === 0) {
      errors.skills = "Please add at least one skill";
      isValid = false;
    }

    // Check for duplicate applicant
    if (isValid) {
      const duplicateError = await checkForDuplicateApplicant(
        formData.firstName,
        formData.lastName,
        formData.email
      );
      if (duplicateError) {
        errors.duplicate = duplicateError;
        isValid = false;
      }
    }

    setValidationErrors(errors);
    return isValid;
  };

  const addSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !formData.skills.includes(trimmedSkill)) {
      if (trimmedSkill.length < 2) {
        setValidationErrors((prev) => ({
          ...prev,
          skills: "Skill must be at least 2 characters long",
        }));
        return;
      }

      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmedSkill],
      }));
      setNewSkill("");

      setValidationErrors((prev) => {
        const { skills, ...rest } = prev;
        return rest;
      });
    } else if (formData.skills.includes(trimmedSkill)) {
      setValidationErrors((prev) => ({
        ...prev,
        skills: "This skill has already been added",
      }));
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));

    if (saveStatus === "saved") {
      setSaveStatus("idle");
      setStatusMessage("");
    }
  };
  const handleSave = async () => {
    // Add permission check at the start
    if (!canEditApplicant()) {
      dispatchToast(
        <Toast>
          <ToastTitle>You don't have permission to edit applicants</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    // Validate the form before attempting to save
    if (!(await validateForm())) {
      setSaveStatus("error");
      setStatusMessage("Please fix the validation errors before saving.");
      return;
    }
    try {
      // Check for duplicates before save
      const duplicateError = await checkForDuplicateApplicant(
        formData.firstName,
        formData.lastName,
        formData.email
      );

      if (duplicateError) {
        setValidationErrors((prev) => ({ ...prev, duplicate: duplicateError }));
        setSaveStatus("error");
        setStatusMessage(duplicateError);
        return;
      }

      // Proceed with saving if no duplicates are found
      setSaveStatus("saving");
      setStatusMessage("Saving applicant data...");

      // Handle file storage logic and update applicant data as appropriate
      let finalBlobData = { ...formData };

      if (tempBlobData) {
        setStatusMessage("Moving resume to permanent storage...");
        const permanentResult = await blobService.moveToPermStorage(
          tempBlobData.blobPath,
          applicant.jobPostingId,
          selectedFile?.name || applicant.fileName,
          accessToken
        );
        // console.log(permanentResult);
        // console.log(selectedFile);
        // console.log(tempBlobData);
        // Ensure old file is replaced with the new data
        if (applicant.blobPath) {
          await blobService.deleteFromBlob(
            applicant.blobPath,
            false,
            accessToken
          );
        }

        finalBlobData = {
          ...finalBlobData,
          blobUrl: permanentResult.url,
          blobPath: permanentResult.blobPath,
          fileName: selectedFile?.name || applicant.fileName,
          fileSize: selectedFile?.size.toString() || applicant.fileSize,
          uploadDate: new Date().toISOString(),
        };

        setTempBlobData(null);
      }

      const updateData = {
        ...formData,
        ...finalBlobData,
        ModifiedAt: new Date().toISOString(),
        skills: formData.skills.map((skill) => ({ value: skill })),
      };

      const result = await updateApplicant(applicant.ID, updateData);
      if (!result.success) throw new Error("Failed to update applicant");

      await onUpdate?.(updateData);

      setSaveStatus("saved");
      setStatusMessage("Applicant data saved successfully!");
      setIsEditing(false);

      setTimeout(() => {
        setSaveStatus("idle");
        setStatusMessage("");
      }, 3000);
    } catch (error) {
      setSaveStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save applicant data"
      );
    }
  };

  const handleCancel = async () => {
    // Clean up temp files if they exist
    if (tempBlobData) {
      try {
        await blobService.deleteFromBlob(
          tempBlobData.blobPath,
          true,
          accessToken
        );
        setTempBlobData(null);
      } catch (error) {
        console.error("Error cleaning up temp file:", error);
      }
    }

    setFormData({
      firstName: applicant.firstName || "",
      lastName: applicant.lastName || "",
      email: applicant.email || "",
      phone: applicant.phone || "",
      address: applicant.address || "",
      education: applicant.education || "",
      experienced: applicant.experienced || false,
      experienceDetails: applicant.experienceDetails || "",
      skills: applicant.skills?.map((s) => s.value) || [],
    });
    setValidationErrors({});
    setSaveStatus("idle");
    setStatusMessage("");
    setIsEditing(false);
    setSelectedFile(null);
  };

  // Handle resume file update with temp storage
  const handleUpdateResume = async () => {
    if (!canManageResume()) {
      dispatchToast(
        <Toast>
          <ToastTitle>You don't have permission to update resumes</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    if (!selectedFile) {
      setStatusMessage("Please select a resume file to upload.");
      return;
    }

    try {
      setIsUpdatingResume(true);
      setStatusMessage("Uploading resume to temporary storage...");
      setUpdateProgress(10);

      // Step 1: Upload new file to temporary storage
      const tempUploadResult = await blobService.uploadToTemp(
        selectedFile,
        applicant.jobPostingId,
        `update-${applicant.ID}-${Date.now()}`,
        accessToken
      );
      setUpdateProgress(30);

      // Step 2: Extract data from new resume using AI
      setStatusMessage("Processing new resume with AI...");
      const extractedData = await aiService.extractResumeData(
        tempUploadResult.url,
        selectedFile.name,
        accessToken
      );
      setUpdateProgress(80);

      // Step 3: Update form data with extracted information
      setFormData({
        firstName: extractedData.firstName || "",
        lastName: extractedData.lastName || "",
        email: extractedData.email || "",
        phone: extractedData.phone || "",
        address: extractedData.address || "",
        education: extractedData.education || "",
        experienced: extractedData.experienced || false,
        experienceDetails: extractedData.experienceDetails || "",
        skills:
          extractedData.skills?.map((s: string | { value: string }) =>
            typeof s === "string" ? s : s.value
          ) || [],
      });

      // Store temp blob data for later permanent storage during save
      setTempBlobData(tempUploadResult);
      setUpdateProgress(100);

      setStatusMessage(
        "Resume uploaded and processed! Please review the extracted data and save when ready."
      );
      setShowUpdateResumeDialog(false);
      setIsEditing(true); // Enable editing mode to review extracted data

      setTimeout(() => {
        setStatusMessage("");
        setUpdateProgress(0);
      }, 3000);
    } catch (error) {
      console.error("Resume update error:", error);
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to update resume"
      );
      setSaveStatus("error");
    } finally {
      setIsUpdatingResume(false);
    }
  };

  const handleFileChange = async () => {
    if (tempBlobData) {
      try {
        await blobService.deleteFromBlob(
          tempBlobData.blobPath,
          true,
          accessToken
        );
        setTempBlobData(null);
      } catch (error) {
        console.error("Error cleaning up temp file:", error);
      }
    }

    setFormData({
      firstName: applicant.firstName || "",
      lastName: applicant.lastName || "",
      email: applicant.email || "",
      phone: applicant.phone || "",
      address: applicant.address || "",
      education: applicant.education || "",
      experienced: applicant.experienced || false,
      experienceDetails: applicant.experienceDetails || "",
      skills: applicant.skills?.map((s) => s.value) || [],
    });
    setValidationErrors({});
  };
  // Reset form data to original applicant data
  const handleResetToOriginal = async () => {
    // Clean up temp files if they exist
    if (tempBlobData) {
      try {
        await blobService.deleteFromBlob(
          tempBlobData.blobPath,
          true,
          accessToken
        );
        setTempBlobData(null);
      } catch (error) {
        console.error("Error cleaning up temp file:", error);
      }
    }

    setFormData({
      firstName: applicant.firstName || "",
      lastName: applicant.lastName || "",
      email: applicant.email || "",
      phone: applicant.phone || "",
      address: applicant.address || "",
      education: applicant.education || "",
      experienced: applicant.experienced || false,
      experienceDetails: applicant.experienceDetails || "",
      skills: applicant.skills?.map((s) => s.value) || [],
    });
    setValidationErrors({});
    setSaveStatus("idle");
    setStatusMessage("Form reset to original data.");
    setShowResetDialog(false);
    setSelectedFile(null);

    setTimeout(() => setStatusMessage(""), 2000);
  };

  const handleReprocessWithAI = async () => {
    if (!canManageResume()) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            You don't have permission to reprocess resumes
          </ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }
    try {
      setIsReprocessing(true);
      setStatusMessage("Reprocessing resume with AI...");

      // Reprocess the existing resume file
      const extractedData = await aiService.extractResumeData(
        applicant.blobUrl,
        applicant.fileName,
        accessToken
      );

      // Update form data with reprocessed information
      setFormData({
        firstName: extractedData.firstName || "",
        lastName: extractedData.lastName || "",
        email: extractedData.email || "",
        phone: extractedData.phone || "",
        address: extractedData.address || "",
        education: extractedData.education || "",
        experienced: extractedData.experienced || false,
        experienceDetails: extractedData.experienceDetails || "",
        skills:
          extractedData.skills?.map((s: string | { value: string }) =>
            typeof s === "string" ? s : s.value
          ) || [],
      });

      setStatusMessage("Resume successfully reprocessed with AI!");
      setShowReprocessDialog(false);
      setIsEditing(true); // Enable editing mode to review reprocessed data

      setTimeout(() => {
        setStatusMessage("");
      }, 3000);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Failed to reprocess resume with AI"
      );
    } finally {
      setIsReprocessing(false);
    }
  };

  const getFieldValidationState = (field: keyof ValidationErrors) => {
    return validationErrors[field] ? "error" : "none";
  };

  const getStatusIcon = () => {
    switch (saveStatus) {
      case "saving":
        return <Spinner size="tiny" />;
      case "saved":
        return (
          <CheckmarkCircleRegular
            style={{ color: tokens.colorPaletteGreenForeground1 }}
          />
        );
      case "error":
        return (
          <ErrorCircleRegular
            style={{ color: tokens.colorPaletteRedForeground1 }}
          />
        );
      default:
        return null;
    }
  };

  const getStatusMessageBarIntent = () => {
    switch (saveStatus) {
      case "saved":
        return "success";
      case "error":
        return "error";
      case "saving":
        return "info";
      default:
        return "info";
    }
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDeleteConfirm = async () => {
    if (!applicant.ID) return;

    try {
      setIsDeleting(true);
      const result = await deleteApplicant(applicant.ID);

      if (result.success) {
        // Remove from local state

        dispatchToast(
          <Toast>
            <ToastTitle>Applicant deleted successfully</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else {
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to delete applicant</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      }
    } catch (error) {
      console.error("Error deleting applicant:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Error deleting applicant</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Add this tab state near your other useState declarations
  const [selectedTab, setSelectedTab] = useState<string>("basic");

  // Add this tab configuration after your styles and before the return statement
  const tabs = [
    {
      id: "basic",
      label: "Basic Information",
      icon: <PersonRegular style={{ height: "22px", width: "22px" }} />,
      component: (
        <div className={styles.fieldGroup}>
          <Field
            orientation="vertical"
            label="First Name"
            required
            validationState={getFieldValidationState("firstName")}
            validationMessage={validationErrors.firstName}
          >
            <Input
              value={formData.firstName}
              onChange={(e) => handleInputChange("firstName", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter first name"
              className={`${
                !isEditing ? "bg-gray-50" : "bg-white"
              } transition-colors`}
            />
          </Field>

          <Field
            orientation="vertical"
            label="Last Name"
            validationState={getFieldValidationState("lastName")}
            validationMessage={validationErrors.lastName}
          >
            <Input
              value={formData.lastName}
              onChange={(e) => handleInputChange("lastName", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter last name"
              className={`${
                !isEditing ? "bg-gray-50" : "bg-white"
              } transition-colors`}
            />
          </Field>

          <Field
            orientation="vertical"
            label="Email Address"
            required
            validationState={getFieldValidationState("email")}
            validationMessage={validationErrors.email}
          >
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter email address"
              className={`${
                !isEditing ? "bg-gray-50" : "bg-white"
              } transition-colors`}
            />
          </Field>

          <Field
            orientation="vertical"
            label="Phone Number"
            required
            validationState={getFieldValidationState("phone")}
            validationMessage={validationErrors.phone}
          >
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter phone number"
              className={`${
                !isEditing ? "bg-gray-50" : "bg-white"
              } transition-colors`}
            />
          </Field>

          <Field
            orientation="vertical"
            label="Address"
            className={styles.fullWidthField}
          >
            <Input
              value={formData.address ?? ""}
              onChange={(e) => handleInputChange("address", e.target.value)}
              disabled={!isEditing}
              placeholder="Enter full address"
              className={`${
                !isEditing ? "bg-gray-50" : "bg-white"
              } transition-colors`}
            />
          </Field>
        </div>
      ),
    },
    {
      id: "education",
      label: "Education",
      icon: <BookRegular style={{ height: "22px", width: "22px" }} />,
      component: (
        <div className="space-y-4">
          <Field
            orientation="vertical"
            label="Education Details"
            hint="Include your degrees, institutions, graduation years, and relevant coursework"
            validationState={getFieldValidationState("education")}
            validationMessage={validationErrors.education}
          >
            <Textarea
              value={formData.education}
              onChange={(e) => handleInputChange("education", e.target.value)}
              disabled={!isEditing}
              resize="vertical"
              rows={4}
              placeholder="e.g., Bachelor of Science in Computer Science, XYZ University, 2020-2024"
              className={`${
                !isEditing ? "bg-gray-50" : "bg-white"
              } transition-colors`}
            />
          </Field>
        </div>
      ),
    },
    {
      id: "skills",
      label: "Technical Skills",
      icon: <Certificate20Regular style={{ height: "22px", width: "22px" }} />,
      component: (
        <div className="space-y-4">
          <Field
            orientation="vertical"
            label="Skills"
            hint={
              isEditing
                ? "Click on skills to remove them. Add relevant technical and soft skills."
                : ""
            }
            validationState={getFieldValidationState("skills")}
            validationMessage={validationErrors.skills}
          >
            <div
              className={`${styles.skillsContainer} ${
                isEditing ? styles.skillsContainerActive : ""
              }`}
            >
              <div className="flex flex-wrap gap-[12px] mb-3">
                {formData.skills && formData.skills.length > 0 ? (
                  formData.skills.map((skill: string, index: number) => (
                    <Badge
                      key={index}
                      color="brand"
                      size="medium"
                      style={{
                        padding: "17px 15px",
                        backgroundColor: "#EEF2FF",
                        border: "1px solid #C7D2FE",
                        color: "#0078D4",
                      }}
                      className={isEditing ? styles.skillBadge : ""}
                      onClick={isEditing ? () => removeSkill(skill) : undefined}
                      title={isEditing ? `Click to remove ${skill}` : skill}
                    >
                      {skill} {isEditing && "×"}
                    </Badge>
                  ))
                ) : (
                  <Text size={300} className="text-gray-500 italic">
                    No skills added yet
                  </Text>
                )}
              </div>

              {isEditing && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                  <Input
                    placeholder="Add a skill (e.g., JavaScript, Project Management)"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={addSkill}
                    appearance="primary"
                    disabled={!newSkill.trim()}
                  >
                    Add Skill
                  </Button>
                </div>
              )}
            </div>
          </Field>
        </div>
      ),
    },
    {
      id: "experience",
      label: "Experience",
      icon: <BriefcaseRegular style={{ height: "22px", width: "22px" }} />,
      component: (
        <div className="space-y-4">
          <Field orientation="vertical" label="Experience Status">
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.experienced || false}
                onChange={(e) =>
                  handleInputChange("experienced", e.currentTarget.checked)
                }
                disabled={!isEditing}
              />
              <Text className="text-gray-700">
                I have professional work experience
              </Text>
            </div>
          </Field>

          {formData.experienced && (
            <Field
              orientation="vertical"
              label="Experience Details"
              hint="Describe your work experience, roles, responsibilities, and key achievements"
              validationState={getFieldValidationState("experienceDetails")}
              validationMessage={validationErrors.experienceDetails}
            >
              <Textarea
                value={formData.experienceDetails || ""}
                onChange={(e) =>
                  handleInputChange("experienceDetails", e.target.value)
                }
                disabled={!isEditing}
                resize="vertical"
                rows={5}
                placeholder="e.g., Software Developer at ABC Company (2022-2024): Developed web applications using React and Node.js, led a team of 3 developers..."
                className={`${
                  !isEditing ? "bg-gray-50" : "bg-white"
                } transition-colors`}
              />
            </Field>
          )}
        </div>
      ),
    },
  ];

  if (!hasApplicantAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 h-full">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
          <PersonRegular className="w-10 h-10 text-blue-600" />
        </div>
        <Text weight="semibold" size={500} className="mb-3 text-gray-700">
          No Access
        </Text>
        <Text className="text-gray-500 max-w-md mx-auto text-center">
          You don't have permission to view or edit applicant details. Please
          contact your administrator to request access.
        </Text>
      </div>
    );
  }

  return (
    <FluentProvider style={{ background: "transparent" }} theme={lightTheme}>
      <div className={styles.container}>
        {/* Status Message */}
        {statusMessage && (
          <MessageBar
            intent={getStatusMessageBarIntent()}
            className={styles.statusMessage}
          >
            <MessageBarBody>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                {statusMessage}
                {isUpdatingResume && (
                  <ProgressBar
                    value={updateProgress / 100}
                    className="ml-4 w-32"
                  />
                )}
              </div>
            </MessageBarBody>
          </MessageBar>
        )}

        {/* File Metadata Card */}
        <Card className={styles.metadataCard}>
          <CardHeader
            header={
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  {/* <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg">
                  <DocumentArrowUpRegular className="text-blue-600" />
                </div> */}
                  <Text weight="semibold" size={400}>
                    Resume File Information
                  </Text>
                </div>
                <div className="flex gap-2">
                  {canManageResume() ? (
                    <>
                      {/* Update Resume Button */}
                      <Dialog
                        open={showUpdateResumeDialog}
                        onOpenChange={(_, data) =>
                          setShowUpdateResumeDialog(data.open)
                        }
                      >
                        <DialogTrigger disableButtonEnhancement>
                          <Button
                            appearance="outline"
                            icon={<CloudArrowUpRegular />}
                            disabled={isUpdatingResume}
                          >
                            Update Resume File
                          </Button>
                        </DialogTrigger>
                        <DialogSurface>
                          <DialogBody>
                            <DialogTitle>Update Resume File</DialogTitle>
                            <DialogContent>
                              <div className="space-y-4">
                                <Text>
                                  Upload a new resume file to replace the
                                  current one. This will:
                                </Text>
                                {/* <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            <li>Delete the current resume file from storage</li>
                            <li>Upload and process the new resume with AI</li>
                            <li>
                              Extract and populate form fields with new data
                            </li>
                            <li>
                              Update file metadata (name, size, upload date)
                            </li>
                          </ul> */}
                                <Field
                                  orientation="vertical"
                                  label="Select New Resume File"
                                >
                                  <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={(e) => {
                                      handleFileChange();
                                      const file = e.target.files?.[0];
                                      setSelectedFile(file || null);
                                    }}
                                    style={{
                                      padding: "8px",
                                      border: "1px solid #d1d5db",
                                      borderRadius: "4px",
                                      width: "100%",
                                    }}
                                  />
                                </Field>
                                {selectedFile && (
                                  <div
                                    style={{
                                      padding: "12px",
                                      backgroundColor: "#eff6ff",
                                      borderRadius: "8px",
                                    }}
                                  >
                                    <Text size={300} weight="medium">
                                      Selected: {selectedFile.name}
                                    </Text>
                                    <br />
                                    <Text
                                      size={200}
                                      style={{ color: "#6b7280" }}
                                    >
                                      Size:{" "}
                                      {formatFileSize(
                                        selectedFile.size.toString()
                                      )}
                                    </Text>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                            <DialogActions>
                              <DialogTrigger disableButtonEnhancement>
                                <Button appearance="secondary">Cancel</Button>
                              </DialogTrigger>
                              <Button
                                appearance="primary"
                                onClick={handleUpdateResume}
                                disabled={!selectedFile || isUpdatingResume}
                                icon={
                                  isUpdatingResume ? (
                                    <Spinner size="tiny" />
                                  ) : (
                                    <CloudArrowUpRegular />
                                  )
                                }
                              >
                                {isUpdatingResume
                                  ? "Updating..."
                                  : "Update Resume"}
                              </Button>
                            </DialogActions>
                          </DialogBody>
                        </DialogSurface>
                      </Dialog>

                      {/* Reprocess with AI Button */}
                      <Dialog
                        open={showReprocessDialog}
                        onOpenChange={(_, data) =>
                          setShowReprocessDialog(data.open)
                        }
                      >
                        <DialogTrigger disableButtonEnhancement>
                          <Button
                            appearance="outline"
                            icon={<FireRegular />}
                            disabled={isReprocessing}
                          >
                            <div className="!bg-gradient-to-r !from-[#0066ff] !to-[#ff0501] !bg-clip-text !text-transparent !border-gradient-to-r ">
                              Generate
                            </div>
                          </Button>
                        </DialogTrigger>
                        <DialogSurface>
                          <DialogBody>
                            <DialogTitle>Reprocess Resume with AI</DialogTitle>
                            <DialogContent>
                              <Text>
                                This will reprocess the current resume file
                                using AI to re-extract and update the
                                information. Any unsaved changes will be lost.
                                Continue?
                              </Text>
                            </DialogContent>
                            <DialogActions>
                              <DialogTrigger disableButtonEnhancement>
                                <Button appearance="secondary">Cancel</Button>
                              </DialogTrigger>
                              <Button
                                appearance="primary"
                                onClick={handleReprocessWithAI}
                                disabled={isReprocessing}
                                icon={
                                  isReprocessing ? (
                                    <Spinner size="tiny" />
                                  ) : (
                                    <FireRegular />
                                  )
                                }
                              >
                                {isReprocessing ? "Processing..." : "Reprocess"}
                              </Button>
                            </DialogActions>
                          </DialogBody>
                        </DialogSurface>
                      </Dialog>
                    </>
                  ) : (
                    <></>
                  )}
                </div>
              </div>
            }
          />
          <CardPreview>
            <div className="grid grid-cols-2 gap-4 px-4 pb-2 ">
              <a
                href={applicant.blobUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                
                <div className={styles.uploadedFile}>
                  <div className="flex w-full justify-between">
                    <div className="flex gap-5">
                  <div className="bg-[#0078D4] p-3 rounded-[5px]">
                    <DocumentBulletList20Regular className={styles.fileIcon} />
                  </div>
                  <div className="flex flex-col">
                    <span className={styles.fileName}>
                      {applicant.fileName?.length > 15
                        ? applicant.fileName.slice(0, 15)
                        : applicant.fileName}
                    </span>
                    <Caption2 className="text-gray-500 text-xs">
                      Uploaded on{" "}
                      {new Date(applicant.uploadDate).toLocaleDateString()}
                    </Caption2>
                  </div>
                  </div>
                  {/* <Button
                                      appearance="subtle"
                                      className={styles.removeFileButton}
                                      icon={<ArrowDownloadRegular />}
                                      onClick={() =>
                                        downloadResume(selectedApplication.application.ID)
                                      }
                                    /> */}
                  <Button appearance="subtle" icon={<Eye20Filled />}/>
                </div>
                </div>

                
              </a>
            </div>
          </CardPreview>
        </Card>

        {/* Resume Form */}
        <Card className={styles.formContainer}>
          <CardHeader
            header={
              <div className="flex justify-between items-center w-full">
                {/* <div className="flex items-center gap-3"> */}
                {/* <div className="p-2 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg">
                  <PersonRegular className="text-green-600" />
                </div> */}
                <div>
                  {/* <Text weight="semibold" size={400}>
                    Applicant Details
                  </Text> */}
                  {/* <div className="flex items-center gap-2"> */}
                  {/* <Caption1 className="text-gray-600">
                      Last modified:{" "}
                      {applicant.ModifiedAt
                        ? new Date(applicant.ModifiedAt).toLocaleDateString()
                        : "Never"}
                    </Caption1> */}
                  {saveStatus === "saved" && (
                    <Badge size="small" color="success">
                      Saved
                    </Badge>
                  )}
                  {/* </div> */}
                  {/* </div> */}
                </div>
                <div className="flex gap-2">
                  {/* Reset Button */}
                  {isEditing && (
                    <Dialog
                      open={showResetDialog}
                      onOpenChange={(_, data) => setShowResetDialog(data.open)}
                    >
                      <DialogTrigger disableButtonEnhancement>
                        <Button
                          appearance="outline"
                          icon={<ArrowResetRegular />}
                          className="hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        >
                          Reset
                        </Button>
                      </DialogTrigger>
                      <DialogSurface>
                        <DialogBody>
                          <DialogTitle>Reset Form Data</DialogTitle>
                          <DialogContent>
                            <Text>
                              This will reset all form fields to their original
                              values from the database. Any unsaved changes will
                              be lost. Continue?
                            </Text>
                          </DialogContent>
                          <DialogActions>
                            <DialogTrigger disableButtonEnhancement>
                              <Button appearance="secondary">Cancel</Button>
                            </DialogTrigger>
                            <Button
                              appearance="primary"
                              onClick={handleResetToOriginal}
                              icon={<ArrowResetRegular />}
                            >
                              Reset Form
                            </Button>
                          </DialogActions>
                        </DialogBody>
                      </DialogSurface>
                    </Dialog>
                  )}
                  {canEditApplicant() && (
                    <Button
                      appearance="outline"
                      icon={isEditing ? <DismissRegular /> : <EditRegular />}
                      onClick={
                        isEditing ? handleCancel : () => setIsEditing(true)
                      }
                      disabled={saveStatus === "saving"}
                      className={`${styles.actionButton} ${
                        isEditing
                          ? "hover:bg-red-50 hover:text-red-600"
                          : "hover:bg-blue-50 hover:text-blue-600"
                      } transition-colors`}
                    >
                      {isEditing ? "Cancel" : "Edit"}
                    </Button>
                  )}

                  {isEditing && canEditApplicant() && (
                    <Button
                      appearance="primary"
                      icon={
                        saveStatus === "saving" ? (
                          <Spinner size="tiny" />
                        ) : (
                          <SaveRegular />
                        )
                      }
                      onClick={handleSave}
                      disabled={saveStatus === "saving"}
                    >
                      {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                    </Button>
                  )}
                </div>
              </div>
            }
          />

          <CardPreview>
            <div className="space-y-6">
              {/* Tab Navigation */}
              <TabList
                selectedValue={selectedTab}
                onTabSelect={(_, data) => setSelectedTab(data.value as string)}
                style={
                  {
                    "--colorBrandForeground1": "#0078D4", // overrides selected color
                  } as React.CSSProperties
                }
              >
                {tabs.map((tab) => (
                  <Tab
                    key={tab.id}
                    value={tab.id}
                    className={`!text-[#4B5563] ${
                      selectedTab === tab.id
                        ? "!text-[#0078D4] border-b-[2px] border-[#0078D4]"
                        : "border-b-[2px] border-transparent"
                    }`}
                  >
                    <span
                      className={`${
                        selectedTab === tab.id
                          ? "text-[#0078D4] h-[25px]"
                          : "text-[#4B5563] h-[25px]"
                      }`}
                    >
                      {tab.icon}
                    </span>
                    <span
                      className={`${
                        selectedTab === tab.id
                          ? "text-[#0078D4]"
                          : "text-[#4B5563]"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </Tab>
                ))}
              </TabList>

              {/* Tab Content */}
              <div className="pt-4">
                {tabs.find((tab) => tab.id === selectedTab)?.component}
              </div>
            </div>
          </CardPreview>
        </Card>

        <FluentProvider style={{ background: "transparent" }}>
          <Dialog
            open={deleteDialogOpen}
            onOpenChange={(event, data) => setDeleteDialogOpen(data.open)}
          >
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                  <div className="space-y-4">
                    <Text>
                      Are you sure you want to delete this Applicant "
                      {applicant.ID
                        ? `${applicant.firstName} ${applicant.lastName}`
                        : ""}
                      "?
                    </Text>
                    <div className="p-3 my-2 bg-red-50 border border-red-200 rounded-md">
                      <Text className="text-red-800 text-sm">
                        This action will mark the Applicant as deleted and it
                        will no longer be available. This action cannot be
                        undone.
                      </Text>
                    </div>
                  </div>
                </DialogContent>
                <DialogActions>
                  <Button
                    appearance="secondary"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    appearance="primary"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
          <Toaster toasterId={toasterId} />
        </FluentProvider>
      </div>
    </FluentProvider>
  );
};
