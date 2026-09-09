import { useState, useEffect, useContext, FC } from "react";
import DOMPurify from "dompurify";
import {
  DialogActions,
  Button,
  Input,
  Label,
  Textarea,
  Text,
  Field,
  Tag,
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
  Persona,
  Combobox,
  useComboboxFilter,
  Option,
  DrawerFooter,
  DialogContent,
} from "@fluentui/react-components";
import {
  Save24Regular,
  CalendarCancel24Regular,
  Delete24Regular,
  Edit24Regular,
  FlashSparkleFilled,
  LockClosed16Regular,
  DismissRegular,
  Dismiss20Filled,
  Building20Regular,
  Add20Regular,
  Delete20Regular,
} from "@fluentui/react-icons";
import { toneContext, type JobPosting } from "../../Pages/JobPosting";
import axios from "axios";
import { checkJobCodeExist, updateJobPosting } from "../../../Services/JobPosting";
import { useAuth } from "../../../Auth/AuthProvider";
import { searchUsersWithDetails, UserDetails } from "../../../Services/Offboarding";
import { getCombinedDepartments } from "../../../Services/Department";

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobPosting;
  onSubmit: (job: JobPosting) => void;
  onJobUpdated?: (job: JobPosting) => void;
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

// Add DepartmentOption interface
interface DepartmentOption {
  Name: string;
  Code: string;
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
  const { accessToken }: any = useAuth();

  useEffect(() => {
    setQuery(value);
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

export const EditJobModal = ({
  isOpen,
  onClose,
  job,
  onSubmit,
  onJobUpdated,
}: EditJobModalProps) => {
  const { currentUser, accessToken }: any = useAuth();
  const [formData, setFormData] = useState(job);
  const [skillInput, setSkillInput] = useState("");
  const tone = useContext(toneContext);
  const [responsibilityInput, setResponsibilityInput] = useState("");
  const [editResponsibilityIdx, setEditResponsibilityIdx] = useState<
    number | null
  >(null);
  const [editResponsibilityValue, setEditResponsibilityValue] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [SelectedOptionalUser, setSelectedOptionalUser] = useState<UserDetails | null>(null)
  const [isJobCodeExisting, setIsJobCodeExisting] = useState(false)
  const [isJobCodeDisabled, setIsJobCodeDisabled] = useState(true);

  // In EditJobModal component, add these state variables:

  const [isDescriptionEditMode, setIsDescriptionEditMode] = useState(false);
  const [isRefinementLoading, setIsRefinementLoading] = useState(false);
  const [refinementError, setRefinementError] = useState<string | null>(null);
  const [originalDescription, setOriginalDescription] = useState("");
  const [descriptionSnapshot, setDescriptionSnapshot] = useState("");
  const [hasRefined, setHasRefined] = useState(false);
  const [descriptionSnapshotForRefine, setDescriptionSnapshotForRefine] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [formSnapshot, setFormSnapshot] = useState({
    title: "",
    department: "",
    skills: [] as string[],
    additionalResponsibilities: [] as string[],
  });
  const [showRefinementDrawer, setShowRefinementDrawer] = useState(false);
  const [refinedDescription, setRefinedDescription] = useState("");

  // Add this function in EditJobModal component
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
  // Add these functions in EditJobModal component

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

  const handleCancelRefinement = () => {
    setShowRefinementDrawer(false);
    setRefinedDescription("");
    setRefinementError(null);
  };

  const canRefine = formData.description.trim() !== "" &&
    (!hasRefined || formData.description !== descriptionSnapshotForRefine) && isDescriptionEditMode;
  // Update the existing useEffect that sets formData:

  useEffect(() => {
    // When job changes, ensure mandatory skills are present
    const updatedSkills = [...job.skills];
    MANDATORY_SKILLS.forEach(mandatorySkill => {
      if (!updatedSkills.includes(mandatorySkill)) {
        updatedSkills.unshift(mandatorySkill);
      }
    });

    if (job.optionalUser && job.optionalUserId) {
      setSelectedOptionalUser({ id: job.optionalUserId, displayName: job.optionalUser } as UserDetails)
    }

    setFormData({
      ...job,
      skills: updatedSkills,
      department: job.department || "",
    });
    setDepartmentQuery(job.department || "");
    setSubmitError(null);

    // Set original description from the job
    setOriginalDescription(job.description || "");
    setDescriptionSnapshotForRefine(job.description || "");
  }, [job]);








  // console.log("editjob", job)
  // Add department states
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);
  const [departmentQuery, setDepartmentQuery] = useState<string>(job.department || "");

  // Check if a skill is mandatory
  const isMandatorySkill = (skill: string) => MANDATORY_SKILLS.includes(skill);

  // Count non-mandatory skills
  const nonMandatorySkillsCount = formData.skills.filter(
    skill => !isMandatorySkill(skill)
  ).length;

  // Check if generate button should be enabled - requires at least 3 non-mandatory skills
  const canGenerate = formData.title.trim() !== "" && formData.department?.trim() !== "" && nonMandatorySkillsCount >= 3;

  // Check if form can be submitted - requires at least 3 non-mandatory skills
  const canSubmit = formData.title.trim() !== "" &&
    formData.description.trim() !== "" &&
    formData.department?.trim() !== "" &&
    nonMandatorySkillsCount >= 3 &&
    formData.preparationMaterial?.every(mat => !((mat.name.trim() === "" && mat.url.trim() !== "") || (mat.name.trim() !== "" && mat.url.trim() === ""))) &&
    !isSubmitting;

  useEffect(() => {
    // When job changes, ensure mandatory skills are present
    const updatedSkills = [...job.skills];
    MANDATORY_SKILLS.forEach(mandatorySkill => {
      if (!updatedSkills.includes(mandatorySkill)) {
        updatedSkills.unshift(mandatorySkill);
      }
    });

    if (job.optionalUser && job.optionalUserId) {
      setSelectedOptionalUser({ id: job.optionalUserId, displayName: job.optionalUser } as UserDetails)
    }

    setFormData({
      ...job,
      skills: updatedSkills,
      department: job.department || "",
      preparationMaterial:
        job.preparationMaterial && job.preparationMaterial.length > 0
          ? job.preparationMaterial
          : [{ id: "", name: "", url: "" }],
    });
    setDepartmentQuery(job.department || "");
    setSubmitError(null);
  }, [job]);

  // Load department data
  useEffect(() => {
    const loadDepartmentData = async () => {
      if (!isOpen || !accessToken) return;

      try {
        setIsLoadingDepartments(true);
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


  const handlePreparationMaterialChange = (
    field: 'name' | 'url',
    value: string,
    index: number
  ) => {
    setFormData((prevData) => {
      const updatedMaterial = [...(prevData.preparationMaterial || [])];
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
    setFormData((prevData) => {
      const newArr = (prevData.preparationMaterial || []).filter((_, i) => i !== index);
      return {
        ...prevData,
        preparationMaterial: newArr.length > 0 ? newArr : [{ id: "", name: "", url: "" }],
      };
    });
  };

  // In JSX, add delete button (show only if more than 1 row):


  const handleAddPreparationMaterial = () => {
    if (formData.preparationMaterial && formData.preparationMaterial.length > 0) {
      const lastRow = formData.preparationMaterial[formData.preparationMaterial.length - 1];

      if (!lastRow.name || !lastRow.url) {
        alert("Please fill in both name and URL for the current row before adding a new one.");
        return;
      }

      else {
        setFormData((prevData) => ({
          ...prevData,
          preparationMaterial: [
            ...(prevData.preparationMaterial || []),
            { id: "", name: "", url: "" }
          ]
        }));
      }
    }
  }

  // Reset error when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSubmitError(null);
      setSkillInput("");
      setResponsibilityInput("");
      setEditResponsibilityIdx(null);
      setEditResponsibilityValue("");
    }
  }, [isOpen]);


  const handleSelectedUser = (user: UserDetails | null) => {

    setSelectedOptionalUser(user)

  }


  const handleJobCodeChnage = async (code: string) => {
    const upperCaseCode = code.toUpperCase().replace(/\s+/g, '');
    setFormData((prev) => ({
      ...prev,
      jobCode: upperCaseCode
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


  const handleEnableJobCodeEdit = () => {
    setIsJobCodeDisabled(false)
  }


  const generateCode = (title: string) => {
    title.toLowerCase();
    const splitted = title.split(/[\s\-_.,;:!?()&[\]{}'"\/\\|]+/).filter(Boolean);
    const code = splitted.map((word) => word.charAt(0).toUpperCase()).join("");
    return code;
  }

  const getJdCodeValidationState = () => {
    if (formData.jobCode && formData.jobCode?.trim() === "") {
      return "error";
    }
    if (formData.jobCode && formData.jobCode.trim().length < 2) {
      return "error";
    }
    if (isJobCodeExisting) {
      return "error";
    }

    return "none";
  }

  const getJdCodeValidationMessage = () => {
    if (formData.jobCode && formData?.jobCode.trim() === "") {
      return "Job code is required";
    }
    if (formData.jobCode && formData.jobCode.trim().length < 2) {
      return "Job code must be at least 2 characters";
    }
    if (isJobCodeExisting) {
      return "Job code already exists. Please choose a different code.";
    }
    return "";
  }


  const handleJobRoleChnage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = generateCode(e.target.value)

    setFormData((prev) => ({
      ...prev,
      title: e.target.value,
      jobCode: code
    }))
    if (formData.jobCode && formData.jobCode.length >= 2) {
      debouncedCHeckJobCodeExist(code, 1000, accessToken, setIsJobCodeExisting);
    }

  }

  const FilterCombobox: React.FC<{
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
  }> = ({
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

      const onOptionSelect: any = (e: any, data: any) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Call the API service to update the job posting
      const result = await updateJobPosting(
        job.id,
        {
          ...formData,
          code: formData.jobCode ? formData.jobCode : "",
          department: formData.department || "",
          departmentCode: formData.departmentCode || "",
          modifiedByUserId: currentUser?.userID ?? job.createdByUserId,
          createdByUserId: job.createdByUserId ?? "",
          OptionalUser: SelectedOptionalUser ? SelectedOptionalUser.id : "",
          departmentId: formData.departmentId ?? "",
          preparationMaterial: formData.preparationMaterial || [{ id: "", name: "", url: "" }],
        },
        "Job posting updated via edit modal", accessToken
      );

      if (result.success && result.data) {
        // Transform the API response to match the local interface
        const updatedJob: JobPosting = {
          ...formData,
          id: job.id,
          createdAt: job.createdAt,
          modifiedAt: new Date(),
          createdByUserId: job.createdByUserId,
          modifiedByUserId: currentUser?.userID ?? job.createdByUserId,
          skills: result.data.skills || formData.skills,
          additionalResponsibilities: result.data.responsibilities ||
            result.data.additionalResponsibilities ||
            formData.additionalResponsibilities,
          department: formData.department || job.department,
        };

        // Call the callback to update the parent component
        if (onJobUpdated) {
          onJobUpdated(updatedJob);
        } else {
          onSubmit({
            ...formData,
            modifiedAt: new Date(),
          });
        }

        onClose();
      } else {
        setSubmitError(typeof result.error === "string" ? result.error : "Failed to update job posting");
      }
    } catch (error) {
      console.error("Error updating job posting:", error);

      let errorMessage = "An unexpected error occurred. Please try again.";

      if (typeof error === "object" && error !== null) {
        if ("response" in error && (error as any).response?.data?.message) {
          errorMessage = (error as any).response.data.message;
        } else if ("message" in error && typeof (error as any).message === "string") {
          errorMessage = (error as any).message;
        }
      }

      setSubmitError(errorMessage);
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
        { ...formData, prompt: tone },
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
        // console.log("Generated description:", content);
      } else {
        throw new Error("No content received from generation service");
      }
    } catch (err) {
      console.error("Error generating description:", err);

      let errorMessage = "Failed to generate description. Please try again.";

      if (typeof err === "object" && err !== null) {
        if ("response" in err && (err as any).response?.data?.message) {
          errorMessage = (err as any).response.data.message;
        } else if ("message" in err && typeof (err as any).message === "string") {
          if ((err as any).message.includes("timeout")) {
            errorMessage = "Generation timed out. Please try again.";
          } else {
            errorMessage = `Generation failed: ${(err as any).message}`;
          }
        }
      }

      setSubmitError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const addSkill = () => {
    const specialCharRegex = /[^a-zA-Z0-9\s\-\+\#\.]/;
    if (specialCharRegex.test(skillInput.trim())) {
      // You can use setSubmitError or add a dedicated skill error state
      setSubmitError("Skill name cannot contain special characters");
      return;
    }

    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput("");
    }
  };

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

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <OverlayDrawer
        open={isOpen}
        onOpenChange={(_, data) => data.open || onClose()}
        position="end"
        size="large"
        style={{ maxWidth: '80%', width: '80vw' }}
        className="!rounded-l-xl"
      >
        <DrawerHeader className="!bg-gradient-to-br !from-[#EEF2FF] !to-[#FFFFFF]" >
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                onClick={() => onClose()}
              />
            }
          >
            Edit Job Role
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody className="!m-0 !p-0">
          <div>
            <div>
              {/* <DialogTitle className="text-2xl font-bold text-gray-900">
                  Edit Job Posting
                </DialogTitle> */}

              {/* Status Messages */}
              {submitError && (
                <MessageBar intent="error" className="mb-4">
                  <MessageBarBody>
                    <MessageBarTitle>Error</MessageBarTitle>
                    {submitError}
                  </MessageBarBody>
                </MessageBar>
              )}
            </div>

            <div className="space-y-8">
              <div className=" p-6 space-y-6">
                {/* Job Title */}
                <div className="space-y-3">
                  <Field
                    required
                    label={
                      <>
                        <Text className="!text-xs !font-semibold">Title</Text>
                      </>
                    }
                    validationState={formData.title.trim() === "" ? "error" : "none"}
                    validationMessage={formData.title.trim() === "" ? "Title is required" : ""}
                  >
                    <Input
                      value={formData.title}
                      onChange={(e) => handleJobRoleChnage(e)}
                      placeholder="e.g., Senior Frontend Developer"
                      className="text-base"
                      disabled={isSubmitting}
                      size="large"
                    />
                  </Field>
                </div>

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
                        value={formData.jobCode}
                        onChange={(e) =>
                          handleJobCodeChnage(e.target.value)
                        }
                        className="text-base flex-1"
                        required
                        disabled={isSubmitting || isJobCodeDisabled}
                      />


                      <Button
                        type="button"
                        onClick={handleEnableJobCodeEdit}
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
                  <FilterCombobox
                    label="Department"
                    options={departmentOptions.map((opt) => opt.Name)}
                    value={formData.department || ""}
                    onChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        department: value,
                      }))
                    }
                    placeholder={
                      isLoadingDepartments ? "Loading..." : "Select or type department"
                    }
                    required
                    disabled={isLoadingDepartments || isSubmitting}
                    validationState={formData.department?.trim() === "" ? "error" : "none"}
                    validationMessage={
                      formData.department?.trim() === "" ? "Department is required" : ""
                    }
                    icon={<Building20Regular />}
                  />
                </div>

                {/* Skills */}
                <div className="space-y-4">
                  <Field
                    required
                    label={
                      <>
                        <Text className="!text-xs !font-semibold">Required Skills</Text>
                      </>
                    }
                    validationState={nonMandatorySkillsCount < 3 ? "error" : "none"}
                    validationMessage={
                      nonMandatorySkillsCount < 3
                        ? `Please add at least 3 skills (${nonMandatorySkillsCount} of 3 added)`
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
                        size="large"
                      />
                      <Button
                        type="button"
                        onClick={addSkill}
                        appearance="outline"
                        className="px-6 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 !rounded-xl"
                        disabled={isSubmitting}
                        size="small"
                      >
                        Add Skill
                      </Button>
                    </div>
                  </Field>

                  {formData.skills.length > 0 && (
                    <div className=" rounded-lg border-1 border-[#D1D5DB4F] p-4">
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
                                    className="!bg-[#F1F8FC] !rounded-xl !text-[#007ED5]"
                                    size="small"
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
                          {nonMandatorySkillsCount} of 3 required skills added
                          {MANDATORY_SKILLS.length > 0 &&
                            ` (+ ${MANDATORY_SKILLS.length} mandatory)`
                          }
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

                {/* Additional Responsibilities */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold text-gray-700 flex items-center">
                    <Text className="!text-xs !font-semibold">Key Responsibilities</Text>
                  </Label>

                  <div className="flex space-x-3">
                    <Input
                      value={responsibilityInput}
                      onChange={(e) => setResponsibilityInput(e.target.value)}
                      onKeyPress={handleResponsibilityKeyPress}
                      placeholder="Type a responsibility (e.g., Mentor junior devs)"
                      className="text-base flex-1"
                      disabled={isSubmitting}
                      size="large"
                    />
                    <Button
                      type="button"
                      onClick={addResponsibility}
                      appearance="outline"
                      className="px-6 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 !rounded-xl"
                      disabled={isSubmitting}
                      size="small"
                    >
                      Add Responsibility
                    </Button>
                  </div>

                  {formData.additionalResponsibilities.length > 0 && (
                    <div>
                      <div className="space-y-2">
                        {formData.additionalResponsibilities.map(
                          (resp, idx) => (
                            <div
                              key={resp}
                              className="flex items-center rounded-sm space-x-2 p-2 odd:bg-[#C7E3F640] bg-[#EDEDED40]"
                            >
                              {editResponsibilityIdx === idx ? (
                                <>
                                  <Input
                                    value={editResponsibilityValue}
                                    onChange={(e) =>
                                      setEditResponsibilityValue(
                                        e.target.value
                                      )
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
                {/* Description */}
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
                            content={
                              !formData.description.trim()
                                ? "Please add a description first to refine it"
                                : hasRefined && formData.description === descriptionSnapshotForRefine
                                  ? "Refine is disabled until you modify the description"
                                  : "AI refine and format description"
                            }
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
                            content={
                              !canGenerate
                                ? "Please fill in Title and add at least 3 skills to generate description"
                                : "AI generate description"
                            }
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
                      formData.description.trim() === "" ? "error" : "none"
                    }
                    validationMessage={
                      formData.description.trim() === ""
                        ? "Job description is required"
                        : ""
                    }
                  >
                    {isDescriptionEditMode ? (
                      <Textarea
                        value={formData.description}
                        onChange={handleDescriptionChange}
                        placeholder="Job description will appear here..."
                        rows={6}
                        className="text-base resize-none min-h-[150px]"
                        required
                        disabled={isSubmitting}
                      />
                    ) : (
                      // In the preview mode div, update the style attribute:
                      <div
                        className="border rounded-lg p-4 min-h-[150px] max-h-[200px] overflow-y-auto bg-white shadow-sm"
                        style={{
                          fontFamily: 'system-ui, -apple-system, sans-serif',
                          lineHeight: '1.4',
                          color: '#333',
                          whiteSpace: 'pre-wrap', // Preserves spaces and line breaks
                          wordWrap: 'break-word', // Breaks long words if needed
                        }}
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(formData.description
                            ? formatDescriptionForDisplay(formData.description)
                            : '<p style="color: #999; font-style: italic;">Job description will appear here...</p>')
                        }}
                      />
                    )}
                  </Field>
                </div>

                {/* Learning plan  */}

                <div className="grid grid-cols-1 w-full">
                  <div className="flex justify-between w-full items-center">
                    <Text className="!text-xs !font-semibold">Training Resources</Text>
                  </div>

                  <div className="p-2 space-y-3">
                    {
                      (formData.preparationMaterial || []).map((item, index) => (
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
                          {index === (formData.preparationMaterial || []).length - 1 ? (
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

                {/* Status */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-gray-700">
                    <Text weight="semibold">Status</Text>
                  </Label>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.status === "active"}
                      onChange={(e: any, data: any) => handleStatusChange(data.checked)}
                      disabled={isSubmitting}
                    />
                    <Text>
                      {formData.status === "active" ? "Active" : "Draft"}
                    </Text>
                  </div>
                </div>
              </div>
            </div>


            <DialogActions className="flex w-max p-5">
              <Button
                appearance="outline"
                onClick={onClose}
                className="px-8 text-base !rounded-2xl"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                appearance="primary"
                className={canSubmit ?
                  "px-8 text-base bg-green-600 hover:bg-green-700 shadow-lg !rounded-2xl !bg-gradient-to-br !from-[#045AAB] !to-[#23A5E6] !text-white"
                  :
                  "px-8 text-base bg-gray-300 hover:bg-gray-400 shadow-lg !rounded-2xl !text-gray-700"
                }
                icon={isSubmitting ? null : <Save24Regular />}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="tiny" className="mr-2" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogActions>
          </div>

        </DrawerBody>

      </OverlayDrawer>




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
    </FluentProvider>
  );
};