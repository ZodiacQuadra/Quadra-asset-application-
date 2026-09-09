import { FC, useContext, useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import {
  DialogTrigger,
  DialogContent,
  DialogActions,
  Button,
  Input,
  Label,
  Textarea,
  Text,
  Tag,
  Field,
  FluentProvider,
  Spinner,
  Tooltip,
  MessageBar,
  MessageBarTitle,
  MessageBarBody,
  Switch,
  OverlayDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  ComboboxProps,
  Option,
  Persona,
  useComboboxFilter,
  Combobox,
  DrawerFooter,
  Tab,
  TabList,
} from "@fluentui/react-components";
import {
  Briefcase24Regular,
  Delete24Regular,
  Edit24Regular,
  CalendarCancel24Regular,
  Save24Regular,
  FlashSparkleFilled,
  LockClosed16Regular,
  DismissRegular,
  Dismiss20Filled,
  Building20Regular,
  Dismiss12Filled,
  Dismiss16Filled,
  Add20Regular,
  Delete20Regular,
} from "@fluentui/react-icons";
import { toneContext } from "../../Pages/JobPosting";
import axios, { AxiosError } from "axios";
import { checkJobCodeExist, createJobPosting, getUserDepartmentMappings, UserDepartmentMapping } from "../../../Services/JobPosting";
import { useAuth } from "../../../Auth/AuthProvider";
import { searchUsersWithDetails, UserDetails } from "../../../Services/Offboarding";
// Add import at the top
import { getCombinedDepartments } from "../../../Services/Department"; // Adjust path as needed
import { Action, Entity, getAllUserRoles, getUserRoleDetails, Module, UserRole } from "../../../Services/UserAssignments";

interface ModuleWithSubmodules extends Module {
  submodules?: Array<{
    name: string;
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
  }>;
}

// Add this interface near the top with other interfaces
interface UserPermissionInfo {
  user: string;
  email: string;
  userId: string;
  role: string;
  isCustomRole: boolean;
  departmentRestricted: boolean;
  departmentMappings?: {
    DepartmentId: string;
    IsActive: boolean;
  }[];
}

export interface PreparationMaterial {
  id: string
  name: string;
  url: string
}

interface InterviewerComboboxProps {
  label: string;
  placeholder: string;
  value: string;
  onInterviewerSelect: (userEmail: string | null, userId?: string) => void; // Add userId
  required?: boolean;
  disabled?: boolean;
  validationState?: "error" | "warning" | "success" | "none";
  validationMessage?: string;
  icon?: React.ReactNode;
  selectedDepartmentId?: string;
  userPermissions: UserPermissionsData[];
}

const InterviewerCombobox: FC<InterviewerComboboxProps> = ({
  label,
  placeholder,
  value,
  onInterviewerSelect,
  required = false,
  disabled = false,
  validationState = "none",
  validationMessage,
  icon,
  selectedDepartmentId,
  userPermissions,
}) => {
  const [query, setQuery] = useState<string>(value);
  const [filteredUsers, setFilteredUsers] = useState<UserPermissionInfo[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Filter users based on selected department and permissions
  useEffect(() => {
    if (!userPermissions || userPermissions.length === 0) {
      setFilteredUsers([]);
      return;
    }

    // Filter users who have permissions to view job postings
    const eligibleUsers = userPermissions.filter((user) => {
      // Check if user has Recruit module access
      const recruitModule = user.permissions.find(
        (perm: any) => perm.name === "Recruit"
      );

      if (!recruitModule || !recruitModule.checked) return false;

      // Check if user has Job Posting entity access
      const jobPostingEntity = recruitModule.entities?.find(
        (entity: any) => entity.name === "Job Posting"
      );

      if (!jobPostingEntity || !jobPostingEntity.checked) return false;

      // Check if user has View Job Posting action
      const viewJobPostingAction = jobPostingEntity.actions?.find(
        (action: any) => action.name === "View Job Posting"
      );

      if (!viewJobPostingAction || !viewJobPostingAction.checked) return false;

      // Check if user can view all job postings (not just "View My")
      const viewAllSubAction = viewJobPostingAction.subActions?.find(
        (sub: any) => sub.name === "View All"
      );

      if (!viewAllSubAction || !viewAllSubAction.checked) return false;

      // If department is selected, check department restrictions
      if (selectedDepartmentId && selectedDepartmentId.trim() !== "") {
        // If user is not department restricted, they can access all departments
        if (!user.departmentRestricted) return true;

        // If user is department restricted, check if they have access to this department
        if (user.departmentMappings && user.departmentMappings.length > 0) {
          const hasDepartmentAccess = user.departmentMappings.some(
            (mapping) =>
              mapping.DepartmentId === selectedDepartmentId &&
              mapping.IsActive === true
          );
          return hasDepartmentAccess;
        }

        // No department mappings means no access to any specific departments
        return false;
      }

      return true; // If no department selected, show all eligible users
    });

    setFilteredUsers(eligibleUsers);
  }, [userPermissions, selectedDepartmentId]);

  // Update query when value changes externally
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const comboOptions = filteredUsers.map((user) => ({
    children: user.user,
    value: user.email,
    text: user.user,
  }));

  const children = useComboboxFilter(query, comboOptions, {
    noOptionsMessage: "No eligible interviewers found",
  });



  const onOptionSelect: ComboboxProps["onOptionSelect"] = (e, data) => {
    const selectedEmail = data.optionValue ?? "";
    const selectedUser = filteredUsers.find(u => u.email === selectedEmail);

    if (selectedUser) {
      setQuery(selectedUser.user);
      // You need to get the userId - we'll need to modify UserPermissionsData interface
      // For now, assuming we have userId in userPermissions
      onInterviewerSelect(selectedUser.email, selectedUser.userId); // Pass userId
      setIsOpen(false);
    }
  };

  const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = ev.target.value;
    setQuery(newValue);

    if (!newValue) {
      onInterviewerSelect(null);
    }
  };

  const renderContent = () => {
    if (disabled) {
      return (
        <Option text="Field is disabled" disabled>
          Field is disabled
        </Option>
      );
    }

    if (!userPermissions || userPermissions.length === 0) {
      return (
        <Option text="Loading user permissions..." disabled>
          Loading user permissions...
        </Option>
      );
    }

    if (selectedDepartmentId && selectedDepartmentId.trim() === "") {
      return (
        <Option text="Please select a department first" disabled>
          Please select a department first to see eligible interviewers
        </Option>
      );
    }

    if (filteredUsers.length === 0) {
      const message = selectedDepartmentId
        ? "No users with access to selected department"
        : "No eligible interviewers found";
      return <Option text={message} disabled>{message}</Option>;
    }

    return children;
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
        open={isOpen}
        onOpenChange={(e, data) => setIsOpen(data.open)}
      >
        {renderContent()}
      </Combobox>
    </Field>
  );
};

// Update the interface
interface UserPermissionsData {
  userId: string; // ADD THIS LINE
  user: string;
  email: string;
  role: string;
  isCustomRole: boolean;
  departmentRestricted: boolean;
  assignedAt: string;
  assignedBy: string;
  totalModules: number;
  permissions: any[];
  departmentMappings?: UserDepartmentMapping[];
}

interface JobPosting {
  id: string;
  title: string;
  description: string;
  skills: string[];
  additionalResponsibilities: string[];
  status: "active" | "draft";
  createdAt: Date;
  modifiedAt: Date;
  createdByUserId: string;
  modifiedByUserId: string;
  department?: string;
  interviewer?: string;
}

// Add DepartmentOption interface
interface DepartmentOption {
  Id: string,
  Name: string;
  Code: string;
}

// Add department to the form data state
interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (job: Omit<JobPosting, "id" | "createdAt" | "modifiedAt">) => void;
  onJobCreated?: (job: JobPosting) => void;
}

// Add department options (you can fetch these from API later)
const DEPARTMENT_OPTIONS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
];

// =============================================
// FILTER COMBOBOX COMPONENT FOR CREATE JOB MODAL
// =============================================

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

interface FilterDepartmentComboboxProps {
  label: string;
  options: { name: string, id: string }[];
  value: string;
  onChange: (value: string, name: string) => void;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  validationState?: "error" | "warning" | "success" | "none";
  validationMessage?: string;
  icon?: React.ReactNode;
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
  icon,
}) => {
  const [query, setQuery] = useState<string>(value || "");

  // Update query when value changes externally (like when formData.department changes)
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

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
      >
        {children}
      </Combobox>
    </Field>
  );
};

const FilterDepartmentCombobox: FC<FilterDepartmentComboboxProps> = ({
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
  const [query, setQuery] = useState<string>("");

  // Update query when value changes externally
  useEffect(() => {
    if (value) {
      const matchingOption = options.find(opt => opt.id === value);
      if (matchingOption) {
        setQuery(matchingOption.name);
      }
    } else {
      setQuery("");
    }
  }, [value, options]);

  const comboOptions = useMemo(() =>
    options.map((opt) => ({
      children: opt.name,
      value: opt.name,
    })),
    [options]
  );

  const children = useComboboxFilter(query, comboOptions, {
    noOptionsMessage: "No options found",
  });

  const onOptionSelect: ComboboxProps["onOptionSelect"] = (e, data) => {
    const selectedName = data.optionText ?? "";

    // Find the matching option to get its id
    const selectedOption = options.find(opt => opt.name === selectedName);
    if (selectedOption) {
      // Set local state first
      setQuery(selectedName);
      // Then call parent onChange
      onChange(selectedOption.id, selectedOption.name);
    }
  };

  const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = ev.target.value;
    setQuery(newValue);

    // Only clear the parent state if input is completely empty
    if (!newValue) {
      onChange("", "");
    }
    // Don't call onChange for partial input to avoid clearing on typing
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
      >
        {children}
      </Combobox>
    </Field>
  );
};


interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (job: Omit<JobPosting, "id" | "createdAt" | "modifiedAt">) => void;
  onJobCreated?: (job: JobPosting) => void;
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

// Define mandatory skills that cannot be deleted
const MANDATORY_SKILLS = ["Good Communication", "Team Work"];

const debouncedCHeckJobCodeExist = (() => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (code: string, delay: number, accessToken: string, callback: (state: boolean) => void) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      const exists = await checkJobCodeExist(code, accessToken);
      callback(exists);
    }, delay);
  };
})();

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
  const { currentUser, accessToken }: any = useAuth();

  useEffect(() => {
    setQuery(value);
    // console.log('curent user permissions are ', currentUser);

  }, [value]);

  useEffect(() => {
    const searchUsers = async () => {
      if (query.length < 2 || disabled) {
        setUsers([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      setIsOpen(true);
      try {
        const results = await searchUsersWithDetails(query, accessToken);
        setUsers(results);
        setIsOpen(true);
      } catch (error) {
        console.error("Error searching users:", error);
        setUsers([]);
        setIsOpen(true);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query, disabled, accessToken]);

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
        open={isOpen}
        onOpenChange={(e, data) => setIsOpen(data.open)}
      >
        {renderContent()}
      </Combobox>
    </Field>
  );
};

// Helper function to recursively extract permission details
const extractPermissionDetails = (modules: Module[]): any[] => {
  return modules.map((module: Module) => {
    const moduleDetails: any = {
      name: module.name,
      checked: module.checked,
      expanded: module.expanded,
      entities: []
    };

    // Process entities
    if (module.entities && module.entities.length > 0) {
      module.entities.forEach((entity: Entity) => {
        const entityDetails: any = {
          name: entity.name,
          checked: entity.checked,
          expanded: entity.expanded,
          actions: []
        };

        // Process actions
        if (entity.actions && entity.actions.length > 0) {
          entity.actions.forEach((action: Action) => {
            const actionDetails: any = {
              name: action.name,
              checked: action.checked,
              expanded: action.expanded,
              subActions: []
            };

            // Process sub-actions
            if (action.subActions && action.subActions.length > 0) {
              actionDetails.subActions = action.subActions.map((subAction: any) => ({
                name: subAction.name,
                checked: subAction.checked,
                value: subAction.value
              }));
            }

            entityDetails.actions.push(actionDetails);
          });
        }

        // Process entity-level subActions (if they exist at entity level)
        if (entity.subActions && entity.subActions.length > 0) {
          entityDetails.subActions = entity.subActions.map((subAction: any) => ({
            name: subAction.name,
            checked: subAction.checked,
            value: subAction.value
          }));
        }

        moduleDetails.entities.push(entityDetails);
      });
    }

    return moduleDetails;
  });
};

export const CreateJobModal = ({
  isOpen,
  onClose,
  onSubmit,
  onJobCreated,
}: CreateJobModalProps) => {
  const { currentUser, accessToken }: any = useAuth();

  // Initialize with mandatory skills
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    code: "",
    department: "",
    departmentId: "",
    interviewer: "",
    skills: [...MANDATORY_SKILLS] as string[],
    additionalResponsibilities: [] as string[],
    status: "active" as "active" | "draft",
    OptionalUser: "",
    preparationMaterial: [{ name: "", url: "" }] as PreparationMaterial[]
  });
  // Add department options state
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);

  const tone = useContext(toneContext);

  const [skillInput, setSkillInput] = useState("");
  const [responsibilityInput, setResponsibilityInput] = useState("");
  const [editResponsibilityIdx, setEditResponsibilityIdx] = useState<
    number | null
  >(null);
  const [editResponsibilityValue, setEditResponsibilityValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isJobCodeDisabled, setIsJobCodeDisabled] = useState(true);
  const [isJobCodeExisting, setIsJobCodeExisting] = useState(false);
  const [SelectedOptionalUser, setSelectedOptionalUser] = useState<UserDetails | null>(null);

  const [isRefining, setIsRefining] = useState(false);
  const [showRefinementDrawer, setShowRefinementDrawer] = useState(false);
  const [refinedDescription, setRefinedDescription] = useState("");
  const [isRefinementLoading, setIsRefinementLoading] = useState(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [originalDescription, setOriginalDescription] = useState("");
  const [descriptionSnapshot, setDescriptionSnapshot] = useState("");

  const [hasGenerated, setHasGenerated] = useState(false);
  const [formSnapshot, setFormSnapshot] = useState({
    title: "",
    department: "",
    skills: [] as string[],
    additionalResponsibilities: [] as string[],
  });
  // Function to check if form fields have changed since last generation
  const hasFormChanged = useMemo(() => {
    if (!hasGenerated) return false; // No generation yet, so no changes
    // Compare current form state with snapshot
    return (
      formData.title !== formSnapshot.title ||
      formData.department !== formSnapshot.department ||
      JSON.stringify(formData.skills) !== JSON.stringify(formSnapshot.skills) ||
      JSON.stringify(formData.additionalResponsibilities) !== JSON.stringify(formSnapshot.additionalResponsibilities)
    );
  }, [formData, formSnapshot, hasGenerated]);

  const [hasRefined, setHasRefined] = useState(false);
  const [descriptionSnapshotForRefine, setDescriptionSnapshotForRefine] = useState("");
  // Function to check if description has changed since last refinement
  const hasDescriptionChangedForRefine = useMemo(() => {
    if (!hasRefined) return false; // No refinement yet, so no changes  
    // Compare current description with snapshot
    return formData.description !== descriptionSnapshotForRefine;
  }, [formData.description, descriptionSnapshotForRefine, hasRefined]);

  const [isDescriptionEditMode, setIsDescriptionEditMode] = useState(false);
  // Function to convert **text** to HTML with styling
  const formatDescriptionForDisplay = (text: string) => {
    if (!text) return '';
    // Replace **text** with styled spans
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong style="font-size: 1.125rem; font-weight: 700; display: block; color: #1a1a1a; line-height: 1.5;">$1</strong>');
    // Replace bullet points
    formatted = formatted.replace(/^• (.+)$/gm, '<div>• $1</div>');
    // Replace line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
  };

  const handleRefineClick = async () => {
    if (!formData.description.trim()) {
      setSubmitError("Please add a description first to refine it");
      return;
    }

    setIsRefinementLoading(true);
    setRefinementError(null);

    try {
      // Check if we have an original description to compare against
      const hasOriginal = originalDescription && originalDescription.trim() !== "";

      // Prepare the payload based on whether we can detect changes
      const payload: {
        content: string;
        title: string;
        originalContent?: string;
        changedContent?: string;
      } = {
        content: formData.description,
        title: formData.title,
      };

      // If we have original and current descriptions are different, send both
      if (hasOriginal && formData.description !== originalDescription) {
        payload.originalContent = originalDescription;
        payload.changedContent = formData.description;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/openai/refine-description`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            timeout: 30000,
          },
        }
      );

      const content = response.data?.output?.content;

      if (content) {
        // If this is the first refinement after generation, update original
        if (!originalDescription && formData.description) {
          setOriginalDescription(formData.description);
        }

        // Update the form data with refined description
        setFormData((prev) => ({
          ...prev,
          description: content,
        }));

        // Update the refine snapshot with the newly applied description
        setDescriptionSnapshotForRefine(content);
        setHasRefined(true);

        // console.log("Refined description applied:", content);
      } else {
        throw new Error("No refined content received");
      }
    } catch (err) {
      console.error("Error refining description:", err);

      let errorMessage = "Failed to refine description. Please try again.";

      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        (err as any).response?.data?.error
      ) {
        errorMessage = (err as any).response.data.error;
      } else if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as any).message === "string"
      ) {
        errorMessage = `Refinement failed: ${(err as any).message}`;
      }

      setRefinementError(errorMessage);
    } finally {
      setIsRefinementLoading(false);
    }
  };

  // Update handleUseRefinedDescription to also update the refine snapshot
  const handleUseRefinedDescription = () => {
    // If this is the first refinement after generation, update original
    if (!originalDescription && formData.description) {
      setOriginalDescription(formData.description);
    }

    // Update the form data with refined description
    setFormData((prev) => ({
      ...prev,
      description: refinedDescription,
    }));

    // Update the refine snapshot with the newly applied description
    setDescriptionSnapshotForRefine(refinedDescription);

    setShowRefinementDrawer(false);
    setRefinedDescription("");
  };

  // Update handleDescriptionChange to track changes for refine button
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;

    // If this is the first manual edit after generation, save original
    if (originalDescription && !descriptionSnapshot) {
      setDescriptionSnapshot(originalDescription);
    }

    setFormData((prev) => ({
      ...prev,
      description: newValue,
    }));
  };

  // Add tooltip content for refine button
  const getRefineTooltipContent = () => {
    if (!formData.description.trim()) {
      return "Please add a description first to refine it";
    }

    if (hasRefined && !hasDescriptionChangedForRefine) {
      return "Refine is disabled until you modify the description";
    }

    return "AI refine and format description";
  };

  // Check if refine button should be enabled
  const canRefine = formData.description.trim() !== "" &&
    (!hasRefined || hasDescriptionChangedForRefine);


  // Add function to cancel refinement
  const handleCancelRefinement = () => {
    setShowRefinementDrawer(false);
    setRefinedDescription("");
    setRefinementError(null);
  };

  // Check if a skill is mandatory
  const isMandatorySkill = (skill: string) => MANDATORY_SKILLS.includes(skill);

  // Count non-mandatory skills
  const nonMandatorySkillsCount = formData.skills.filter(
    (skill) => !isMandatorySkill(skill)
  ).length;



  // Check if generate button should be enabled - requires at least 3 non-mandatory skills
  const canGenerate =
    formData.title.trim() !== "" &&
    formData.department.trim() !== "" &&
    nonMandatorySkillsCount >= 5 &&
    (!hasGenerated || hasFormChanged);

  // Add tooltip content that explains why generate is disabled
  const getGenerateTooltipContent = () => {
    if (!formData.title.trim() || !formData.department.trim()) {
      return "Please fill in job title and department to generate description";
    }
    if (nonMandatorySkillsCount < 5) {
      return "Please add at least 5 skills to generate description";
    }
    if (hasGenerated && !hasFormChanged) {
      return "Generate is disabled until you modify Title, department, or skills";
    }
    return "AI generate description";
  };

  // Check if form can be submitted - requires at least 3 non-mandatory skills
  const canSubmit =
    formData.title.trim() !== "" &&
    formData.department.trim() !== "" &&
    formData.description.trim() !== "" &&
    formData.code.trim() !== "" &&
    formData.code.trim().length >= 2 &&
    nonMandatorySkillsCount >= 5 &&
    formData.preparationMaterial?.every(mat => !((mat.name.trim() === "" && mat.url.trim() !== "")||(mat.name.trim() !== "" && mat.url.trim() === ""))) &&
    !isJobCodeExisting &&
    !isSubmitting;

  // Reset form data when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: "",
        description: "",
        code: "",
        department: "",
        departmentId: "",
        interviewer: "",
        skills: [...MANDATORY_SKILLS],
        additionalResponsibilities: [],
        status: "active" as "active",
        OptionalUser: "",
        preparationMaterial: [{ id: "", name: "", url: "" }]
      });
      setOriginalDescription(""); // Reset original description
      setDescriptionSnapshot(""); // Reset snapshot
      setSkillInput("");
      setResponsibilityInput("");
      setEditResponsibilityIdx(null);
      setEditResponsibilityValue("");
      setSubmitError(null);
      setHasRefined(false);
      setDescriptionSnapshotForRefine("");
    }
  }, [isOpen]);

  const handlePreparationMaterialChange = (
    field: 'name' | 'url',
    value: string,
    index: number
  ) => {
    setFormData((prevData) => {
      const updatedMaterial = [...prevData.preparationMaterial];
      updatedMaterial[index] = {
        ...updatedMaterial[index],
        [field]: value
      };

      return {
        ...prevData,
        preparationMaterial: updatedMaterial
      };
    });
  };

  const handleRemovePreparationMaterial = (index: number) => {
    setFormData((prevData) => ({
      ...prevData,
      preparationMaterial: prevData.preparationMaterial.filter((_, i) => i !== index)
    }));
  };

  // In JSX, add delete button (show only if more than 1 row):


  const handleAddPreparationMaterial = () => {
    if (formData.preparationMaterial && formData.preparationMaterial.length > 0) {
      const lastRow = formData.preparationMaterial[formData.preparationMaterial.length - 1];

      if (!lastRow.name || !lastRow.url) {
        alert("Please fill in both name and URL for the current row before adding a new one.");
        return;
      }
    }

    const newRow: PreparationMaterial = { id:"",name: "", url: "" };
    setFormData((prevData) => ({
      ...prevData,
      preparationMaterial: [...prevData.preparationMaterial, newRow]
    }));
  };

  const [userPermissions, setUserPermissions] = useState<UserPermissionsData[]>([]);

  // Update the logAllUserPermissions function
  const logAllUserPermissions = async () => {
    try {
      console.clear();
      // console.log('🚀 FETCHING ALL USER PERMISSIONS & DEPARTMENT MAPPINGS...\n');

      const response = await getAllUserRoles();

      if (response.success && response.data) {
        // console.log(`✅ Found ${response.data.length} user roles\n`);

        const allUsersData: UserPermissionsData[] = [];

        for (const userRole of response.data) {
          console.group(`👤 USER: ${userRole.userName} (${userRole.userEmail})`);

          try {
            const details = await getUserRoleDetails(userRole.userRoleId);
            let departmentMappings: UserDepartmentMapping[] = [];

            if (details.success) {
              const { IsDepartmentRestricted }: any = details.data;

              if (IsDepartmentRestricted && accessToken) {
                const mappingsResponse = await getUserDepartmentMappings(
                  userRole.userId,
                  accessToken
                );

                if (mappingsResponse.success && mappingsResponse.data) {
                  departmentMappings = mappingsResponse.data;
                }
              }
            }

            if (details.success) {
              const {
                userRole: userRoleDetails,
                baseRolePermissions,
                customPermissions,
                IsDepartmentRestricted
              }: any = details.data;

              const permissions = customPermissions || baseRolePermissions || [];
              const structuredPermissions = extractPermissionDetails(permissions);

              const userData: UserPermissionsData = {
                userId: userRole.userId, // ADD THIS LINE
                user: userRole.userName,
                email: userRole.userEmail,
                role: userRole.roleName,
                isCustomRole: userRole.isCustomRole,
                departmentRestricted: IsDepartmentRestricted,
                assignedAt: new Date(userRole.assignedAt).toLocaleDateString(),
                assignedBy: userRole.assignedByName,
                totalModules: permissions.length,
                permissions: structuredPermissions,
                departmentMappings: departmentMappings
              };

              allUsersData.push(userData);

              // Log user info
              // console.log(`📋 Role: ${userRole.roleName} ${userRole.isCustomRole ? '(Custom)' : ''}`);
              // console.log(`📍 Department Restricted: ${IsDepartmentRestricted}`);

              // Log department mappings if they exist
              if (departmentMappings.length > 0) {
                // console.log(`🏢 Department Access (${departmentMappings.length} departments):`);
                departmentMappings.forEach((mapping, index) => {
                  // console.log(`  ${index + 1}. Department ID: ${mapping.DepartmentId}`);
                  // console.log(`     Active: ${mapping.IsActive ? '✅' : '❌'}`);
                  // console.log(`     Created: ${new Date(mapping.CreatedAt).toLocaleDateString()}`);
                });
              } else if (IsDepartmentRestricted) {
                console.log(`🏢 Department Access: Restricted but no specific departments mapped`);
              } else {
                console.log(`🏢 Department Access: Not restricted (access to all departments)`);
              }

              // console.log(`📅 Assigned: ${new Date(userRole.assignedAt).toLocaleDateString()} by ${userRole.assignedByName}`);
              // console.log(`📦 Total Modules: ${permissions.length}`);

              // Log each module with its entities and actions
              structuredPermissions.forEach((module: any, moduleIndex: number) => {
                console.groupCollapsed(`📁 Module ${moduleIndex + 1}: ${module.name} (${module.checked ? 'Enabled' : 'Disabled'})`);

                if (module.entities && module.entities.length > 0) {
                  module.entities.forEach((entity: any, entityIndex: number) => {
                    console.groupCollapsed(`  📄 Entity ${entityIndex + 1}: ${entity.name} (${entity.checked ? 'Enabled' : 'Disabled'})`);

                    if (entity.actions && entity.actions.length > 0) {
                      entity.actions.forEach((action: any, actionIndex: number) => {
                        const subActionsText = action.subActions && action.subActions.length > 0
                          ? ` [${action.subActions.filter((sa: any) => sa.checked).map((sa: any) => sa.name).join(', ')}]`
                          : '';

                        // console.log(`    ⚙️ Action ${actionIndex + 1}: ${action.name} (${action.checked ? '✓' : '✗'}${subActionsText})`);
                      });
                    }

                    // Log entity-level subActions if present
                    if (entity.subActions && entity.subActions.length > 0) {
                      const checkedSubActions = entity.subActions.filter((sa: any) => sa.checked);
                      if (checkedSubActions.length > 0) {
                        // console.log(`    📌 Entity Sub-Actions: ${checkedSubActions.map((sa: any) => sa.name).join(', ')}`);
                      }
                    }

                    console.groupEnd();
                  });
                } else {
                  console.log('  No entities configured');
                }

                console.groupEnd();
              });

            } else {
              console.log('❌ Failed to fetch permission details for this user');
            }

          } catch (error) {
            console.error(`❌ Error fetching details for ${userRole.userName}:`, error);
          }

          console.groupEnd();
          // console.log('\n' + '─'.repeat(80) + '\n');
        }

        // Log complete structured data as JSON
        // console.log('📊 COMPLETE USER PERMISSIONS DATA WITH DEPARTMENT MAPPINGS (as JSON):');
        // console.log(allUsersData);

        // Log summary table
        // console.log('\n📋 USER PERMISSIONS SUMMARY WITH DEPARTMENT ACCESS:');
        // console.table(
        //   allUsersData.map((user) => ({
        //     'User': user.user,
        //     'Role': user.role,
        //     'Custom': user.isCustomRole ? 'Yes' : 'No',
        //     'Dept Restricted': user.departmentRestricted ? 'Yes' : 'No',
        //     'Dept Mappings': user.departmentMappings?.length || 0,
        //     'Active Depts': user.departmentMappings?.filter(d => d.IsActive).length || 0,
        //     'Modules': user.totalModules,
        //     'Assigned': user.assignedAt
        //   }))
        // );

        return allUsersData;
      } else {
        console.log('❌ Failed to fetch user roles');
      }
    } catch (error) {
      console.error('❌ Error logging permissions:', error);
    }
  };

  // Check study material
  // Check documents are named without attachments
  const hasDocumentsWithoutAttachments = formData.preparationMaterial.some(
    (item) => item.name && !item.url
  );

  const hasUrlsWithoutNames = formData.preparationMaterial.some(
    (item) => item.url && !item.name
  );

  const handleRemoveEmptyPreparationMaterials = () => {
    setFormData((prevData) => ({
      ...prevData,
      preparationMaterial: prevData.preparationMaterial.filter(
        (item) => item.name || item.url
      )
    }));
  };

  // Call the permissions logging function when component mounts or when modal opens
  useEffect(() => {
    if (isOpen) {
      // Choose which logging function to use
      const fetchPermissions = async () => {
        const permissions = await logAllUserPermissions();
        if (permissions) {
          setUserPermissions(permissions);
        }
      };
      fetchPermissions();
    }
  }, [isOpen]);



  useEffect(() => {
    const loadDepartmentData = async () => {
      if (!isOpen || !accessToken) return;

      try {
        setIsLoadingDepartments(true);
        setSubmitError(null);
        const data = await getCombinedDepartments(accessToken);
        if (data) {
          setDepartmentOptions(data);
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    if (isOpen) {
      loadDepartmentData();
    }
  }, [isOpen, accessToken]);

  // Handler to save edited responsibility
  const handleSaveResponsibility = (idx: number) => {
    if (
      editResponsibilityValue.trim() &&
      !formData.additionalResponsibilities.includes(
        editResponsibilityValue.trim()
      )
    ) {
      setFormData((prev) => ({
        ...prev,
        additionalResponsibilities: prev.additionalResponsibilities.map(
          (item, i) => (i === idx ? editResponsibilityValue.trim() : item)
        ),
      }));
      setEditResponsibilityIdx(null);
      setEditResponsibilityValue("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Find the selected department to get its code
      const selectedDept = departmentOptions.find(
        (dept) => dept.Name === formData.department
      );

      if (!selectedDept) {
        setSubmitError("Please select a valid department");
        setIsSubmitting(false);
        return;
      }

      // Get interviewer user ID from userPermissions
      let interviewerUserId = null;
      if (formData.interviewer) {
        const interviewerData = userPermissions.find(
          (user) => user.email === formData.interviewer
        );
        if (interviewerData) {
          // You need to add userId to UserPermissionsData interface
          // Assuming the user ID is available in the permissions data
          interviewerUserId = interviewerData.userId || null;
        }
      }

      // Check documents are named without attachments
      if (hasDocumentsWithoutAttachments) {
        alert("Please provide URLs for all named learning plans.");
        return;
      }

      if (hasUrlsWithoutNames) {
        alert("Please provide names for all learning plan URLs.");
        return;
      }

      handleRemoveEmptyPreparationMaterials()

      // Call the API service to create the job posting
      const payload = {
        ...formData,
        department: formData.department,
        departmentID: formData.departmentId,
        departmentCode: selectedDept.Code,
        createdByUserId: currentUser?.userID ?? "",
        modifiedByUserId: currentUser?.userID ?? "",
        interviewerUserId: interviewerUserId, // Add interviewer user ID
      };

      if (SelectedOptionalUser && SelectedOptionalUser.id) {
        payload["OptionalUser"] = SelectedOptionalUser.id;
      }

      const result = await createJobPosting(payload, accessToken);

      if (result.success && result.data) {
        const createdJob: JobPosting = {
          id: result.data.id,
          title: result.data.title,
          description: result.data.description,
          department: formData.department,
          interviewer: formData.interviewer || "",
          skills: result.data.skills || [],
          additionalResponsibilities:
            result.data.additionalResponsibilities ||
            result.data.responsibilities ||
            [],
          status: result.data.status,
          createdAt: new Date(result.data.createdAt || new Date()),
          modifiedAt: new Date(result.data.modifiedAt || new Date()),
          createdByUserId:
            result.data.createdByUserId || currentUser?.userID || "",
          modifiedByUserId:
            result.data.modifiedByUserId || currentUser?.userID || "",
        };

        if (onJobCreated) {
          onJobCreated(createdJob);
        } else {
          onSubmit({
            ...formData,
            createdByUserId: currentUser?.userID ?? "",
            modifiedByUserId: currentUser?.userID ?? "",
          });
        }

        onClose();
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Error creating job posting:", error);
      if (error instanceof AxiosError) {
        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          error.message ||
          "Failed to create job posting";

        setSubmitError(errorMessage);
      } else if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError("An unexpected error occurred");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateClick = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setSubmitError(null);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/openai/generate-JD`,
        {
          ...formData,
          prompt: tone,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            timeout: 30000,
          },
        }
      );

      const content = response.data?.output?.content;

      if (content) {
        setFormData((prev) => ({
          ...prev,
          description: content,
        }));
        setOriginalDescription(content); // Save as original
        setDescriptionSnapshot(content); // Save snapshot
        // Save snapshot of form fields after generation
        setFormSnapshot({
          title: formData.title,
          department: formData.department,
          skills: [...formData.skills],
          additionalResponsibilities: [...formData.additionalResponsibilities],
        });
        // Mark that generation has been performed
        setHasGenerated(true);

        // console.log("Generated description:", content);
      } else {
        throw new Error("No content received from generation service");
      }
    } catch (err) {
      console.error("Error generating description:", err);
      // ... error handling
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectedUser = (user: UserDetails | null) => {

    setSelectedOptionalUser(user)

  }


  const addSkill = () => {
    const specialCharRegex = /[^a-zA-Z0-9\s\-\+\#\.]/;
  if (specialCharRegex.test(skillInput.trim())) {
    // You can use setSubmitError or add a dedicated skill error state
    setSubmitError("Skill name cannot contain special characters");
    return;
  }

    if (skillInput.trim() && !formData.skills.find((skill) => skill.toLowerCase() === skillInput.trim().toLowerCase())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

  const handleEnableJocCodeEdit = () => {
    setIsJobCodeDisabled(false)
  }

  const removeSkill = (skillToRemove: string) => {
    // Prevent removal of mandatory skills
    if (isMandatorySkill(skillToRemove)) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  const addResponsibility = () => {
    if (
      responsibilityInput.trim() &&
      !formData.additionalResponsibilities.includes(responsibilityInput.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        additionalResponsibilities: [
          ...prev.additionalResponsibilities,
          responsibilityInput.trim(),
        ],
      }));
      setResponsibilityInput("");
    }
  };

  const removeResponsibility = (respToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      additionalResponsibilities: prev.additionalResponsibilities.filter(
        (resp) => resp !== respToRemove
      ),
    }));
  };

  const handleResponsibilityKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addResponsibility();
    }
  };

  const handleStatusChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      status: checked ? "active" : "draft",
    }));
  };

  const generateCode = (title: string) => {
    title.toLowerCase();
    const splitted = title.split(/[\s\-_.,;:!?()&[\]{}'"\/\\|]+/).filter(Boolean);
    const code = splitted.map((word) => word.charAt(0).toUpperCase()).join("");
    return code;
  }




  const handleJobRoleChnage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = generateCode(e.target.value)

    setFormData((prev) => ({
      ...prev,
      title: e.target.value,
      code: code
    }))
    if (formData.code && formData.code.length >= 2) {
      debouncedCHeckJobCodeExist(code, 1000, accessToken, setIsJobCodeExisting);
    }

  }

  const handleJobCodeChnage = async (code: string) => {
    const upperCaseCode = code.toUpperCase().replace(/\s+/g, '');
    setFormData((prev) => ({
      ...prev,
      code: upperCaseCode
    }))
    if (upperCaseCode && upperCaseCode.length >= 2) {
      await checkJobCodeExist(upperCaseCode, accessToken).then((res) => {
        // console.log("isExistingCode",res);
        setIsJobCodeExisting(res);
      });
    }
  }

  const handleRemoveOptionalUser = () => {
    setSelectedOptionalUser(null)
  }

  const getJdCodeValidationState = () => {
    if (formData.code.trim() === "") {
      return "error";
    }
    if (formData.code.trim().length < 2) {
      return "error";
    }
    if (isJobCodeExisting) {
      return "error";
    }

    return "none";
  }

  const getJdCodeValidationMessage = () => {
    if (formData.code.trim() === "") {
      return "Job code is required";
    }
    if (formData.code.trim().length < 2) {
      return "Job code must be at least 2 characters";
    }
    if (isJobCodeExisting) {
      return "Job code already exists. Please choose a different code.";
    }
    return "";
  }

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <OverlayDrawer
        open={isOpen}
        // modalType="alert"
        onOpenChange={(event, data) => !data.open && onClose()}
        position="end"
        size="large"
        style={{ maxWidth: '80%', width: '80vw' }}
        className="!rounded-xl"
      >
        <DrawerBody className="!m-0 !p-0">
          <DialogContent className="p-0">
            {/* Header */}
            <div>
              {/* <Text className="font-bold text-gray-900 mb-2">
                  Create New Job Role
                </Text> */}
              {submitError && (
                <MessageBar intent="error" className="mb-4">
                  <MessageBarBody>
                    <MessageBarTitle>Error</MessageBarTitle>
                    {submitError}
                  </MessageBarBody>
                </MessageBar>
              )}
            </div>
            <DrawerHeader className="!bg-gradient-to-br !from-[#EEF2FF] !to-[#FFFFFF]">
              <DrawerHeaderTitle
                action={
                  <Button
                    appearance="subtle"
                    icon={<DismissRegular />}
                    onClick={() => onClose()}
                  />
                }
              >
                Create Job Role
              </DrawerHeaderTitle>
            </DrawerHeader>

            {/* Form */}
            <div className="space-y-8 flex flex-col mt-4">

              <div className="rounded-lg p-6 pt-0 space-y-6 ">
                {/* Job Title */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <Field
                      required
                      label={
                        <>
                          <Text className="!text-xs !font-semibold">
                            Title
                          </Text>
                        </>
                      }
                      validationState={
                        formData.title.trim() === "" ? "error" : "none"
                      }
                      validationMessage={
                        formData.title.trim() === ""
                          ? "Title is required"
                          : ""
                      }
                    >
                      <Input
                        value={formData.title}
                        onChange={(e) =>
                          handleJobRoleChnage(e)
                        }
                        placeholder="e.g., Senior Frontend Developer"
                        className="text-base flex-1"
                        required
                        disabled={isSubmitting}
                      />
                    </Field>
                  </div>

                  {/* Job role code */}

                  <div className="space-y-3">
                    <Field
                      required
                      label={
                        <>
                          <Text className="!text-xs !font-semibold">
                            Code
                          </Text>
                        </>
                      }
                      validationState={
                        getJdCodeValidationState()
                      }
                      validationMessage={
                        getJdCodeValidationMessage()

                      }
                    >
                      <div className="flex items-center space-x-3 w-full">

                        <Input
                          value={formData.code}
                          onChange={(e) =>
                            handleJobCodeChnage(e.target.value)
                          }
                          className="text-base flex-1"
                          required
                          disabled={isSubmitting || isJobCodeDisabled}
                        />


                        <Button
                          type="button"
                          onClick={handleEnableJocCodeEdit}
                          appearance="outline"
                          className="!rounded-2xl !px-2 !py-1 !h-fit !font-semibold"
                          disabled={isSubmitting || !isJobCodeDisabled}
                          size="small"
                        >
                          Edit
                        </Button>
                      </div>
                    </Field>
                  </div>


                  {/* Department Field - ADD THIS SECTION */}
                  <div className="space-y-3">
                    <FilterDepartmentCombobox
                      label="Department"
                      options={departmentOptions.map((opt) => {
                        return { name: opt.Name, id: opt.Id };
                      })} value={formData.department}
                      onChange={(value, name) =>
                        setFormData((prev) => ({
                          ...prev,
                          department: name,
                          departmentId: value
                        }))
                      }
                      placeholder={
                        isLoadingDepartments ? "Loading..." : "Select or type department"
                      }
                      required
                      disabled={isLoadingDepartments || isSubmitting}
                      validationState={formData.department.trim() === "" ? "error" : "none"}
                      validationMessage={
                        formData.department.trim() === "" ? "Department is required" : ""
                      }
                      icon={<Building20Regular />} // You may need to import this icon
                    />
                  </div>

                  <Field
                    required
                    label={
                      <>
                        <Text className="!text-xs !font-semibold">
                          Required Skills
                        </Text>
                      </>
                    }
                    validationState={
                      nonMandatorySkillsCount < 5 ? "error" : "none"
                    }
                    validationMessage={
                      nonMandatorySkillsCount < 5
                        ? `Please add at least 5 skills (${nonMandatorySkillsCount} of 5 added)`
                        : ""
                    }
                  >
                    <div className="flex space-x-3 items-center">
                      <Input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a skill (e.g., React, Python, etc.)"
                        className="text-base flex-1"
                        disabled={isSubmitting}
                      />
                      <Button
                        type="button"
                        onClick={addSkill}
                        appearance="outline"
                        className="!rounded-2xl !px-2 !py-1 !h-fit !font-semibold"
                        disabled={isSubmitting}
                        size="small"
                      >
                        Add
                      </Button>
                    </div>
                  </Field>


                </div>

                {/* Skills */}

                <div className="grid grid-cols-1">
                  {/* Skills */}
                  <div className="space-y-4">


                    {formData.skills.length > 0 && (
                      <div className="rounded-lg border p-4">
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map((skill) => {
                            const isMandatory = isMandatorySkill(skill);
                            return (
                              <div key={skill} className="relative">
                                {isMandatory ? (
                                  <Tooltip
                                    content="This is a mandatory skill and cannot be removed"
                                    relationship="label"
                                  >
                                    <Tag
                                      appearance="filled"
                                      className="bg-blue-100"
                                    >
                                      <LockClosed16Regular className="mr-1" />
                                      {skill}
                                    </Tag>
                                  </Tooltip>
                                ) : (
                                  <Tag
                                    dismissible
                                    dismissIcon={{
                                      onClick: () => removeSkill(skill),
                                    }}
                                  >
                                    {skill}
                                  </Tag>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-gray-500">
                            {nonMandatorySkillsCount} of 5 required skills added
                            {MANDATORY_SKILLS.length > 0 &&
                              ` (+ ${MANDATORY_SKILLS.length} mandatory)`}
                          </p>
                          {/* {nonMandatorySkillsCount < 3 && (
                            <p className="text-xs text-red-600 font-semibold">
                              {3 - nonMandatorySkillsCount} more skill(s) needed
                            </p>
                          )} */}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Responsibilities */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700 flex items-center">
                    <Text className="!text-xs !font-semibold">
                      Key Responsibilities
                    </Text>
                  </Label>

                  <div className="flex space-x-3">
                    <Input
                      value={responsibilityInput}
                      onChange={(e) => setResponsibilityInput(e.target.value)}
                      onKeyPress={handleResponsibilityKeyPress}
                      placeholder="Type a responsibility (e.g., Mentor junior devs)"
                      className="text-base flex-1"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      onClick={addResponsibility}
                      appearance="outline"
                      className="!rounded-2xl !px-2 !py-1 !h-fit !font-semibold"
                      disabled={isSubmitting}
                      size="small"
                    >
                      Add
                    </Button>
                  </div>

                  {formData.additionalResponsibilities.length > 0 && (
                    <div>
                      <div className="space-y-2">
                        {formData.additionalResponsibilities.map(
                          (resp, idx) => (
                            <div
                              key={resp}
                              className="flex items-center rounded-sm space-x-2 p-2 odd:bg-[var(--colorNeutralBackground1Hover)]"
                            >
                              {editResponsibilityIdx === idx ? (
                                <>
                                  <Input
                                    value={editResponsibilityValue}
                                    onChange={(e) =>
                                      setEditResponsibilityValue(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        handleSaveResponsibility(idx);
                                      } else if (e.key === "Escape") {
                                        setEditResponsibilityIdx(null);
                                      }
                                    }}
                                    className="flex-1"
                                    autoFocus
                                    disabled={isSubmitting}
                                  />
                                  <Button
                                    onClick={() =>
                                      handleSaveResponsibility(idx)
                                    }
                                    className="px-2"
                                    icon={<Save24Regular />}
                                    disabled={isSubmitting}
                                  />
                                  <Button
                                    appearance="subtle"
                                    onClick={() =>
                                      setEditResponsibilityIdx(null)
                                    }
                                    className="px-2"
                                    icon={<CalendarCancel24Regular />}
                                    disabled={isSubmitting}
                                  />
                                </>
                              ) : (
                                <>
                                  <Text className="flex-1">{resp}</Text>
                                  <Button
                                    appearance="subtle"
                                    onClick={() => {
                                      setEditResponsibilityIdx(idx);
                                      setEditResponsibilityValue(resp);
                                    }}
                                    className="p2"
                                    icon={<Edit24Regular />}
                                    disabled={isSubmitting}
                                  />
                                  <Button
                                    appearance="subtle"
                                    onClick={() => removeResponsibility(resp)}
                                    icon={<Delete24Regular />}
                                    className="p2 text-red-500"
                                    disabled={isSubmitting}
                                  />
                                </>
                              )}
                            </div>
                          )
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {formData.additionalResponsibilities.length}{" "}
                        responsibilit
                        {formData.additionalResponsibilities.length !== 1
                          ? "ies"
                          : "y"}{" "}
                        added
                      </p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="grid grid-cols-1">
                  <div className="space-y-4">
                    <Field
                      label={
                        <div className="flex items-center justify-between space-x-2 w-full">
                          <div className="flex items-center gap-2">
                            <Text className="!text-xs !font-semibold">
                              Description{" "}
                              <span className="font-thin light text-[var(--colorPaletteRedForeground3)]">
                                *
                              </span>
                            </Text>
                            <Button
                              appearance="subtle"
                              size="small"
                              onClick={() => setIsDescriptionEditMode(!isDescriptionEditMode)}
                              disabled={isSubmitting}
                            >
                              {isDescriptionEditMode ? 'Preview' : 'Edit'}
                            </Button>
                          </div>

                          <div className="flex gap-2">
                            <Tooltip
                              content={getRefineTooltipContent()}
                              relationship="label"
                            >
                              <Button
                                icon={
                                  isRefinementLoading ? null : (
                                    <Edit24Regular />
                                  )
                                }
                                appearance="outline"
                                className={`!border-gray-300 ${!canRefine ? 'opacity-50' : ''}`}
                                onClick={handleRefineClick}
                                disabled={
                                  !canRefine ||
                                  isRefinementLoading ||
                                  isSubmitting
                                }
                              >
                                {isRefinementLoading ? (
                                  <Spinner size="tiny" />
                                ) : (
                                  "Refine"
                                )}
                              </Button>
                            </Tooltip>
                            <Tooltip
                              content={getGenerateTooltipContent()}
                              relationship="label"
                            >
                              <Button
                                icon={
                                  isGenerating ? null : (
                                    <FlashSparkleFilled primaryFill={canGenerate ? "#0066ff" : "#cccccc"} />
                                  )
                                }
                                appearance="outline"
                                className={`!outline-gradient-to-r ${canGenerate ? '!from-[#0066ff] !to-[#ff0501]' : '!from-gray-300 !to-gray-300'}`}
                                onClick={handleGenerateClick}
                                disabled={!canGenerate || isGenerating || isSubmitting}
                              >
                                {isGenerating ? (
                                  <Spinner size="tiny" />
                                ) : (
                                  <div className={`${canGenerate ? '!bg-gradient-to-r !from-[#0066ff] !to-[#ff0501]' : '!bg-gradient-to-r !from-gray-300 !to-gray-300'} !bg-clip-text !text-transparent !border-gradient-to-r`}>
                                    {hasGenerated ? 'Regenerate' : 'Generate'}
                                  </div>
                                )}
                              </Button>
                            </Tooltip>
                          </div>
                        </div>
                      }
                      validationState={
                        formData.description.trim() === "" || formData.description.trim().length < 200 ? "error" : "none"
                      }
                      validationMessage={
                        formData.description.trim() === ""
                          ? "Job description is required"
                          : formData.description.trim().length < 200
                            ? "Job Description should have at least 200 characters"
                            : ""
                      }
                    >
                      {isDescriptionEditMode ? (
                        <Textarea
                          value={formData.description}
                          onChange={handleDescriptionChange}
                          placeholder="Job description will appear here..."
                          // rows={28}
                          className="text-base resize-none min-h-[275px] font-mono text-sm"
                          required
                          disabled={isSubmitting}
                        />
                      ) : (
                        // In the preview mode div, update the style attribute:
                        <div
                          className="border rounded-lg p-6 min-h-[300px] max-h-[320px] overflow-y-auto bg-white shadow-sm"
                          style={{
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            lineHeight: '1.4',
                            color: '#333',
                            // Add these CSS properties for spacing:
                            whiteSpace: 'pre-wrap', // Preserves spaces and line breaks
                            wordWrap: 'break-word', // Breaks long words if needed
                          }}
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(formData.description
                              ? formatDescriptionForDisplay(formData.description)
                              : '<p style="color: #999; font-style: italic;">Job description will appear here after generation...</p>')
                          }}
                        />
                      )}
                    </Field>
                  </div>
                </div>


                <div className="grid grid-cols-2 gap-5 items-start">
                  {/* Optional User to handle job posting */}
                  {/* <div className="space-y-3">
                    <InterviewerCombobox
                      label="Interviewer"
                      placeholder={
                        !formData.departmentId
                          ? "Select department first"
                          : "Select interviewer"
                      }
                      value={formData.interviewer}
                      onInterviewerSelect={(email) =>
                        setFormData((prev) => ({
                          ...prev,
                          interviewer: email || ""
                        }))
                      }
                      selectedDepartmentId={formData.departmentId}
                      userPermissions={userPermissions}
                      disabled={!formData.departmentId || isSubmitting}
                      validationState={
                        formData.interviewer.trim() === "" ? "warning" : "none"
                      }
                      validationMessage={
                        formData.interviewer.trim() === ""
                          ? "Interviewer is optional but recommended"
                          : ""
                      }
                    />
                  </div>

                  <div className="flex gap-3 items-end">
                    <UserCombobox
                      label="Subordinate User"
                      placeholder="Select subordinate user"
                      onUserSelect={handleSelectedUser}
                      value={SelectedOptionalUser ? SelectedOptionalUser.displayName : ""}
                    />
                    <Button
                      size="small"
                      onClick={() => handleRemoveOptionalUser()}
                      appearance="outline"
                      className="!rounded-2xl !px-2 !py-1 !h-fit !font-semibold"
                    >
                      <Dismiss16Filled />
                    </Button>
                  </div> */}


                  {/* Status */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-gray-700">
                      <Text weight="semibold">Status</Text>
                    </Label>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={formData.status === "active"}
                        onChange={(e, data) => handleStatusChange(data.checked)}
                        disabled={isSubmitting}
                      />
                      <Text>
                        {formData.status === "active" ? "Active" : "Draft"}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 w-full">
                  <div className="flex justify-between w-full items-center">
                    <Text className="!text-xs !font-semibold">Training Resources</Text>
                  </div>

                  <div className="p-2 space-y-3">
                    {
                      formData.preparationMaterial.map((item, index) => (
                        <div key={index} className="grid grid-cols-3 gap-3">
                          <Field>
                            <Input
                              value={item.name}
                              onChange={(e) =>
                                handlePreparationMaterialChange("name", e.target.value, index)
                              }
                              placeholder="Resource Title"
                              className="text-base flex-1"
                              required
                              disabled={isSubmitting}
                            />
                          </Field>

                          <Field>
                            <Input
                              value={item.url}
                              onChange={(e) =>
                                handlePreparationMaterialChange("url", e.target.value, index)
                              }
                              placeholder="Resource Link"
                              className="text-base flex-1"
                              required
                              disabled={isSubmitting}
                            />
                          </Field>



                          {/* Only show Add button on the last row */}
                          {index === formData.preparationMaterial.length - 1 ? (
                            <Button
                              type="button"
                              onClick={handleAddPreparationMaterial}
                              appearance="transparent"
                              className="!rounded-2xl !px-2 !py-1 !h-fit !font-semibold"
                              disabled={isSubmitting || !isJobCodeDisabled}
                              size="small"
                            >
                              <Add20Regular />
                            </Button>
                          )
                            :
                            (
                              <Button
                                type="button"
                                onClick={() => handleRemovePreparationMaterial(index)}
                                appearance="transparent"
                                size="small"
                              >
                                <Delete20Regular />
                              </Button>
                            )
                          }
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>

          {/* Actions */}
          <DrawerFooter className="!flex w-max p-2 !justify-end">
            <DialogTrigger disableButtonEnhancement>
              <Button
                appearance="secondary"
                disabled={isSubmitting}
                shape="circular"
              >
                Cancel
              </Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={!canSubmit}
              shape="circular"
              className={
                !canSubmit
                  ? " !bg-gray-300 cursor-not-allowed"
                  : " !bg-gradient-to-br !from-[#045AAB] !to-[#23A5E6]"
              }
            >
              {isSubmitting ? (
                <Spinner size="tiny" className="mr-2" />
              ) : (
                <Briefcase24Regular className="mr-2" />
              )}
              {isSubmitting ? "Creating..." : "Create Job Role"}
            </Button>
          </DrawerFooter>
        </DrawerBody>

        {/* Add Refinement Drawer */}
        <OverlayDrawer
          open={showRefinementDrawer}
          onOpenChange={(event, data) => !data.open && handleCancelRefinement()}
          position="end"
          size="large"
          className="!rounded-xl"
        >
          <DrawerBody className="!m-0 !p-0">
            <DialogContent className="p-0">
              <DrawerHeader className="!bg-gradient-to-br !from-[#EEF2FF] !to-[#FFFFFF]">
                <DrawerHeaderTitle
                  action={
                    <Button
                      appearance="subtle"
                      icon={<DismissRegular />}
                      onClick={handleCancelRefinement}
                    />
                  }
                >
                  Refined Description
                </DrawerHeaderTitle>
              </DrawerHeader>

              {refinementError && (
                <MessageBar intent="error" className="m-4">
                  <MessageBarBody>
                    <MessageBarTitle>Error</MessageBarTitle>
                    {refinementError}
                  </MessageBarBody>
                </MessageBar>
              )}

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700">
                    Original Description Preview
                  </Label>
                  <div className="rounded-lg border p-4 bg-gray-50 max-h-40 overflow-y-auto">
                    <Text className="text-sm text-gray-600 line-clamp-4">
                      {formData.description.substring(0, 500)}
                      {formData.description.length > 500 ? "..." : ""}
                    </Text>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700">
                    Refined Description
                  </Label>

                  {isRefinementLoading ? (
                    <div className="flex justify-center items-center h-64">
                      <Spinner size="large" label="Refining description..." />
                    </div>
                  ) : (
                    <div className="rounded-lg border">
                      <div className="p-4 bg-gray-50 border-b">
                        <div className="flex items-center justify-between">
                          <Text className="text-sm font-semibold">Preview</Text>
                          <Text className="text-xs text-gray-500">
                            {refinedDescription.length} characters
                          </Text>
                        </div>
                      </div>
                      <div className="p-4 max-h-96 overflow-y-auto">
                        {refinedDescription ? (
                          <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap font-sans text-sm">
                              {refinedDescription}
                            </pre>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Text>No refined description available</Text>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-600 mt-1">
                    <Edit24Regular />
                  </div>
                  <div>
                    <Text className="text-sm font-semibold text-blue-800">
                      What changed?
                    </Text>
                    <Text className="text-sm text-blue-700 mt-1">
                      The refined version has been formatted with proper markdown syntax,
                      organized into clear sections, and structured professionally while
                      keeping all your original content intact.
                    </Text>
                  </div>
                </div>
              </div> */}
              </div>
            </DialogContent>

            <DrawerFooter className="!flex w-max p-2 !justify-end">
              <Button
                appearance="secondary"
                disabled={isRefinementLoading}
                shape="circular"
                onClick={handleCancelRefinement}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleUseRefinedDescription}
                disabled={!refinedDescription || isRefinementLoading}
                shape="circular"
                className="!bg-gradient-to-br !from-[#045AAB] !to-[#23A5E6]"
              >
                <Save24Regular className="mr-2" />
                Use New Description
              </Button>
            </DrawerFooter>
          </DrawerBody>
        </OverlayDrawer>

      </OverlayDrawer>

    </FluentProvider>
  );
};
