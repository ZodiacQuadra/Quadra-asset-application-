import type React from "react";
import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  Body1Strong,
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
  TabList,
  Tab,
  Select,
} from "@fluentui/react-components";
import {
  PersonRegular,
  EditRegular,
  SaveRegular,
  DismissRegular,
  DeleteRegular,
  WarningRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  BriefcaseRegular,
  BookRegular,
  Certificate20Regular,
} from "@fluentui/react-icons";

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  education?: string;
  experienceDetails?: string;
  skills?: string;
}

interface ResumeFormProps {
  resumeData: any;
  onSave: (data: any) => void;
  onDelete: () => Promise<void> | void;
  isEditing: boolean;
  onToggleEdit: (data:any) => void;
  isLoading?: boolean;
  onStatusChange?: (status: "idle" | "saving" | "saved" | "error") => void;
  mode : string;
  onDirtyChange?: (isDirty: boolean) => void;
}

const useStyles = makeStyles({
  formContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    boxShadow: tokens.shadow8,
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
    backgroundColor: "transparent",
    padding: "0",
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    transition: "all 0.2s ease",
  },

  skillsContainerActive: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
  },

  skillBadge: {
    cursor: "pointer",
    transition: "all 0.2s ease",
    backgroundColor: "#EEF2FF",
    color: "#0078D4",
    border: "1px solid #C7D2FE",
    "&:hover": {
      backgroundColor: "#E4EBFF",
    },
  },

  actionButton: {
    minWidth: "120px",
    fontWeight: tokens.fontWeightSemibold,
  },

  saveButton: {
    background: `linear-gradient(135deg, ${tokens.colorCompoundBrandBackground} 0%, ${tokens.colorCompoundBrandBackgroundHover} 100%)`,
    border: "none",
    boxShadow: tokens.shadow8,
    transition: "all 0.3s ease",
    "&:hover": {
      transform: "translateY(-1px)",
      boxShadow: tokens.shadow16,
    },
  },

  deleteButton: {
    color: tokens.colorPaletteRedForeground1,
    "&:hover": {
      backgroundColor: tokens.colorPaletteRedBackground1,
      color: tokens.colorPaletteRedForeground1,
    },
  },

  statusMessage: {
    marginBottom: tokens.spacingVerticalM,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },

  loadingOverlay: {
    position: "relative",
    "&::after": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...shorthands.borderRadius(tokens.borderRadiusMedium),
      zIndex: 10,
    },
  },
});

const ResumeForm: React.FC<ResumeFormProps> = ({
  resumeData,
  onSave,
  onDelete,
  isEditing,
  onToggleEdit,
  isLoading = false,
  onStatusChange,
  mode,
  onDirtyChange,
}) => {
  const styles = useStyles();
  const [formData, setFormData] = useState(resumeData);
  const [newSkill, setNewSkill] = useState("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("basic");

  // Store the original data when editing starts so cancel can revert
  const originalDataRef = useRef(resumeData);

  // Track whether the user has actually made edits (non-portal mode)
  const [isDirty, setIsDirty] = useState(false);
  const hasUnsavedChanges = isEditing && mode !== "portal" && isDirty;

  useEffect(() => {
    if (mode === "career") {
      onDirtyChange?.(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, mode]);

  // Enhanced validation patterns
  const validationPatterns = {
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    phone: /^[\+]?[1-9][\d\s\-\(\)]{7,15}$/,
    name: /^[a-zA-Z\s\-']{1,50}$/,
  };

  // Capture original data when editing starts (for cancel/revert)
  useEffect(() => {
    if (isEditing) {
      originalDataRef.current = resumeData;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // Warn on browser/tab close if there are unsaved changes (non-portal mode)
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Update form data when resumeData prop changes, but only when NOT editing
  // to prevent overwriting in-progress edits
  useEffect(() => {
    if (!isEditing) {
      setFormData(resumeData);
      setValidationErrors({});
    }
  }, [resumeData, isEditing]);

  // Enhanced validation with more comprehensive rules
  const validateField = (field: string, value: string): string | undefined => {
    if (!value || value.trim().length === 0) {
      if (["firstName", "lastName", "email", "phone"].includes(field)) {
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
        if (trimmedValue.length < 1) {
          return "Name must be at least 1 character long";
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

      default:
        return undefined;
    }
    return undefined;
  };

  const handleSourceChange = (value:string) =>{
        const updatedData = { ...formData, source: value };
        setFormData(updatedData);
        setIsDirty(true);
        if (mode === "portal") {
          onSave(updatedData);
        }
  }


  useEffect(()=>{
            setFormData((prev: any) => ({ ...prev, ["source"]: "Referral" }));

  },[])

  const handleInputChange = (field: string, value: string | boolean) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    setIsDirty(true);

    // Propagate changes to parent immediately in portal mode
    if (mode === "portal") {
      onSave(updatedData);
    }

    // Clear save status when editing
    if (saveStatus === "saved") {
      setSaveStatus("idle");
      setStatusMessage("");
    }

    // Real-time validation
    if (typeof value === "string") {
      const error = validateField(field, value);
      setValidationErrors((prev) => ({
        ...prev,
        [field]: error,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    let isValid = true;

    // Required fields validation
    const requiredFields = ["firstName", "email", "phone"];
    requiredFields.forEach((field) => {
      const error = validateField(field, formData[field] || "");
      if (error) {
        errors[field as keyof ValidationErrors] = error;
        isValid = false;
      }
    });

    // Optional fields validation (if they have content)
    const optionalFields = ["lastName", "education"];
    optionalFields.forEach((field) => {
      if (formData[field]) {
        const error = validateField(field, formData[field]);
        if (error) {
          errors[field as keyof ValidationErrors] = error;
          isValid = false;
        }
      }
    });

    // Experience validation
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

    // Skills validation
    if (formData.skills && formData.skills.length === 0) {
      errors.skills = "Please add at least one skill";
      isValid = false;
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

      const updatedData = {
        ...formData,
        skills: [...formData.skills, trimmedSkill],
      };
      setFormData(updatedData);
      setNewSkill("");
      setIsDirty(true);

      if (mode === "portal") {
        onSave(updatedData);
      }

      // Clear skills validation error
      setValidationErrors((prev) => {
        const { skills, ...rest } = prev;
        return rest;
      });
    }
  };

  const removeSkill = (skillToRemove: string) => {
    const updatedData = {
      ...formData,
      skills: formData.skills.filter((skill: string) => skill !== skillToRemove),
    };
    setFormData(updatedData);
    setIsDirty(true);

    if (mode === "portal") {
      onSave(updatedData);
    }

    // Clear save status when editing
    if (saveStatus === "saved") {
      setSaveStatus("idle");
      setStatusMessage("");
    }
  };

 

  const handleSave = async () => {
    if (!validateForm()) {
      setSaveStatus("error");
      setStatusMessage("Please fix the validation errors before saving.");
      return;
    }

    try {
      setSaveStatus("saving");
      setStatusMessage("Saving resume...");
      onStatusChange?.("saving");

      setSaveStatus("saved");
      setStatusMessage("Resume saved successfully!");
      setIsDirty(false);
      onStatusChange?.("saved");
      if(mode === "portal"){
        onSave(formData)
      }
      onToggleEdit(formData);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSaveStatus("idle");
        setStatusMessage("");
        onStatusChange?.("idle");
      }, 3000);
    } catch (error) {
      setSaveStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to save resume"
      );
      onStatusChange?.("error");
    }
  };

  const handleCancel = () => {
    const original = originalDataRef.current;
    setFormData(original);
    setValidationErrors({});
    setSaveStatus("idle");
    setStatusMessage("");
    setIsDirty(false);

    // Revert parent state to original data (undo in-progress edits)
    if (mode === "portal") {
      onSave(original);
    }
    onToggleEdit(original);
  };

  const handleDelete = async () => {
    try {
      await onDelete();
      setShowDeleteDialog(false);
    } catch (error) {
      setSaveStatus("error");
      setStatusMessage(
        error instanceof Error ? error.message : "Failed to delete resume"
      );
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

  // Tab configuration
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
              value={formData.firstName || ""}
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
              value={formData.lastName || ""}
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
              value={formData.email || ""}
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
              value={formData.phone || ""}
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
            <Textarea
              rows={3}
              value={formData.address || ""}
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
              value={formData.education || ""}
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
              {isEditing && (
                <div className="flex gap-2">
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
                    className="flex-1 h-[45px]"
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
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.skills && formData.skills.length > 0 ? (
                  formData.skills.map((skill: string, index: number) => (
                    <Badge
                      key={index}
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

  return (
    <Card
      className={`${styles.formContainer} ${
        isLoading ? styles.loadingOverlay : ""
      }`}
      style={{ boxShadow: "none" ,padding:"0px", paddingBlock:"12px"}}
    >
      {/* Unsaved Changes Warning (non-portal mode) */}
      {hasUnsavedChanges && (
        <MessageBar intent="warning" className={styles.statusMessage}>
          <MessageBarBody>
            <div className="flex items-center gap-2">
              <WarningRegular />
              You have unsaved changes. Please save or cancel before leaving.
            </div>
          </MessageBarBody>
        </MessageBar>
      )}

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
            </div>
          </MessageBarBody>
        </MessageBar>
      )}

      <CardHeader
        header={
          <div className="flex justify-between items-end w-full">
            <div className="flex items-center gap-3">
             {mode === 'portal' && <Field label="Source" required className="min-w-[300px]">
                <Select 
                value={formData.source || ""}
                onChange={(e)=>handleSourceChange(e.target.value)}
                disabled={!isEditing}
                required
                >
                  <option disabled value="">Select Source</option>
<option>LinkedIn</option>
<option>Naukri</option>
<option>Monster</option>
<option>Indeed</option>
<option>Referral</option>
</Select>
              </Field>}
              <div>
                {saveStatus === "saved" && (
                  <Badge size="small" color="success">
                    Saved
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
            {mode === 'portal' &&  <Button
                appearance="outline"
                icon={isEditing ? <DismissRegular /> : <EditRegular />}
                onClick={isEditing ? handleCancel : onToggleEdit}
                disabled={saveStatus === "saving"}
                className={`${styles.actionButton} ${
                  isEditing
                    ? "hover:bg-red-50 hover:text-red-600"
                    : "hover:bg-blue-50 hover:text-blue-600"
                } transition-colors`}
              >
                {isEditing ? "Cancel" : "Edit"}
              </Button>}
              {isEditing && (
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
                  className={`${styles.actionButton} ${styles.saveButton}`}
                >
                  {saveStatus === "saving" ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </div>
        }
      />

      <CardPreview>
        <div className="space-y-6 p-5">
          {/* Tab Navigation */}
          <TabList
            selectedValue={selectedTab}
            onTabSelect={(_, data) => setSelectedTab(data.value as string)}
            style={
              {
                "--colorBrandForeground1": "#0078D4",
                margin: "0",
                backgroundColor: "#F9FAFB",
                border: "1px solid #E5E7EB",
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
                    selectedTab === tab.id ? "text-[#0078D4]" : "text-[#4B5563]"
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

      {/* Delete Dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(_, data) => setShowDeleteDialog(data.open)}
      >
        <DialogTrigger disableButtonEnhancement>
          <Button
            appearance="subtle"
            icon={<DeleteRegular style={{ color: "#DC2626" }} />}
            className={styles.deleteButton}
            style={{ padding: "10px 12px", width: "175px" }}
          >
            Delete Resume
          </Button>
        </DialogTrigger>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              <div className="flex items-center gap-2">
                <WarningRegular className="text-red-500" />
                Confirm Deletion
              </div>
            </DialogTitle>
            <DialogContent>
              <Text>
                Are you sure you want to delete this resume? This action cannot
                be undone.
              </Text>
              <Text weight="semibold" className="mt-2">
                Resume: {formData.fileName}
              </Text>
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary">Cancel</Button>
              </DialogTrigger>
              <Button
                appearance="primary"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Loading overlay */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8 h-full">
          <Spinner />
          <Body1Strong className="mt-2">Loading...</Body1Strong>
        </div>
      )}
    </Card>
  );
};

export default ResumeForm;
