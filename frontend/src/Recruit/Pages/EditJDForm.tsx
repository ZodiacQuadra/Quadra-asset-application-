import React, { FC, useEffect, useRef, useState } from "react";
import {
  Input,
  Dropdown,
  Rating,
  Button,
  Field,
  FluentProvider,
  Option,
  Tooltip,
  useId,
  useToastController,
  Toaster,
  Toast,
  ToastTitle,
  Spinner,
  Radio,
  RadioGroup,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Text,
  Combobox,
  ComboboxProps,
  useComboboxFilter,
  Persona,
  SpinButton,
  Card,
  Subtitle2,
  Body1,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  CardFooter,
  Caption1,
  Body1Strong,
} from "@fluentui/react-components";
import {
  Delete20Regular,
  Add20Regular,
  Alert20Regular,
  ArrowExportRtlRegular,
  DeleteRegular,
  Briefcase20Regular,
  Building20Regular,
  Location20Regular,
  People20Regular,
  CalendarLtr20Regular,
  Money20Regular,
  DocumentText20Regular,
  Star20Regular,
  Info20Regular,
  Settings20Regular,
  PersonStar20Regular,
  LockClosedRegular,
  Person20Regular,
} from "@fluentui/react-icons";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import AdvancedEditor from "../Components/AdvancedEditor";
import axios from "axios";
import AIGenerateDialog from "../Components/AIGenerateDialog";
import {
  createSuggestions,
  getAllJobPostings,
} from "../../Services/JobPosting";
import {
  getJDRequestById,
  updateJDRequest,
  deleteJDRequest,
  sendSuggestEditJDNotification,
  getHRDepartmentUsers,
  searchUsersWithDepartmentId,
  getUserDetailforJd,
} from "../../Services/JDRequests";
import { useAuth } from "../../Auth/AuthProvider";
import { Person } from "../Components/PeoplePicker";
import {
  searchUsersWithDetails,
  UserDetails,
} from "../../Services/Offboarding";
import { useParams, useNavigate } from "react-router-dom";
import { getActiveJobPrompt } from "../../Services/JobPrompt";
import { getCombinedLocations } from "../../Services/Location";
import { getCombinedDepartments } from "../../Services/Department";

// =============================================
// INTERFACES
// =============================================

// Add to existing interfaces section
export interface UserPermissions {
  recruit?: {
    job_posting?: {
      view_job?: {
        view_all?: boolean;
        view_my?: boolean;
      };
      create_job?: boolean;
      edit_job?: boolean;
      delete_job?: boolean;
    };
    hiring_template?: boolean;
    location?: boolean;
    department?: boolean;
    candidate_app?: {
      manage_app?: boolean;
      approve_reject_app?: boolean;
    };
    interview_schedule?: {
      create_interview?: boolean;
      modify_interview?: boolean;
    };
    interview_feedback?: {
      view_all_feedback?: boolean;
      view_my_feedback?: boolean;
    };
  };
  onboarding?: {
    manage_onboarding?: {
      create_onboarding?: boolean;
      edit_onboarding?: boolean;
      delete_onboarding?: boolean;
    };
    onboarding_tasks?: {
      view_all_tasks?: boolean;
      view_my_tasks?: boolean;
    };
    induction_tasks?: boolean;
  };
  background_verification?: {
    bgv_view?: {
      view_all_bgv?: boolean;
      view_my_bgv?: boolean;
    };
    bgv_manage?: {
      create_bgv?: boolean;
      edit_bgv?: boolean;
      delete_bgv?: boolean;
    };
    bgv_approve?: boolean;
    bgv_close?: boolean;
    document_management?: boolean;
  };
  offboarding?: {
    offboarding_manage?: {
      create_offboarding?: boolean;
      edit_offboarding?: boolean;
      delete_offboarding?: boolean;
    };
    offboarding_view?: {
      view_all_offboarding?: boolean;
      view_my_offboarding?: boolean;
    };
    lead_clearance?: boolean;
    it_clearance?: boolean;
    asset_clearance?: boolean;
    finance_clearance?: boolean;
    it_activity_management?: boolean;
    admin_activity_management?: boolean;
    finance_activity_management?: boolean;
  };
  permissions?: {
    permission_matrix?: boolean;
    user_role_management?: boolean;
  };
}

// Add permission helper functions

interface JobPosting {
  id: string;
  title: string;
  description: string;
  status: string;
  skills: string[];
  additionalResponsibilities: string[];
}

interface LocationOption {
  Name: string;
  Code: string;
}

interface DepartmentOption {
  Name: string;
  Code: string;
}

interface FormData {
  jobId: string;
  jobRole: string;
  jobNature: string;
  department: string;
  departmentCode: string;
  targetDate: Date | null | undefined;
  numPositions: number;
  minWorkExperience?: number;
  maxWorkExperience?: number;
  MinSalaryRange?: number;
  MaxSalaryRange?: number;
  jobLocation: string;
  locationCode: string;
  status: string;
  skills: Array<{ name: string; rating: number }>;
  jobDescription: string;
  reportingManager: Person | null;
  createdByUserID?: string;
  isActive: boolean;
  isPublished: boolean;
  inActiveReason: string;
  designation: string;
  departmentId?: string;
  interviewer?: Person | null;
  subordinate?: Person | null;
}

interface FormErrors {
  jobRole: string;
  jobNature: string;
  department: string;
  targetDate: string;
  numPositions: string;
  minWorkExperience: string;
  maxWorkExperience: string;
  MinSalaryRange: string;
  MaxSalaryRange: string;
  jobLocation: string;
  skills: string;
  jobDescription: string;
  reportingManager: string;
  designation: string;
  interviewer: string;
}

interface GeneratedDescription {
  content: string;
}

// =============================================
// FILTER COMBOBOX COMPONENT
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

// =============================================
// USER COMBOBOX COMPONENT
// =============================================

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
  department?: string;
  formData: any;
  currentUser?: any;
  handleDisableField?: () => void
  handleEnableField?: () => void
  userId?: string;
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


const InterviewUserCombobox: FC<UserComboboxProps> = ({
  label,
  placeholder,
  value,
  onUserSelect,
  required = false,
  disabled = false,
  validationState = "none",
  validationMessage,
  icon,
  department,
  formData,
  currentUser,
  userId, // NEW: specific user ID to load
  handleDisableField,
  handleEnableField
}) => {
  const [query, setQuery] = useState<string>("");
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [allTagUsers, setAllTagUsers] = useState<UserDetails[]>([]); // Store all TAG users
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [hrFoundForDepartment, setHrFoundForDepartment] = useState<boolean>(true);
  const { accessToken }: any = useAuth();
  const componentId = useId("interviewer-combobox");

  // Load all TAG users once when component mounts
  useEffect(() => {
    const loadAllTagUsers = async () => {
      if (!accessToken) return;

      try {
        setLoading(true);
        const hrUsers = await getHRDepartmentUsers(accessToken);
        setAllTagUsers(hrUsers);
      } catch (error: any) {
        console.error("Error loading TAG department users:", error);
        setAllTagUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllTagUsers();
  }, [accessToken]);

  // Filter TAG users based on search query
  useEffect(() => {
    if (!query.trim()) {
      setUsers(allTagUsers);
      setError("");
    } else {
      const lowerQuery = query.toLowerCase();
      const filteredUsers = allTagUsers.filter(
        (user) =>
          user?.displayName?.toLowerCase().includes(lowerQuery) ||
          user?.email?.toLowerCase().includes(lowerQuery)
      );
      setUsers(filteredUsers);

      if (filteredUsers.length === 0) {
        setError(`No users found matching "${query}" in ${import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"} department`);
      } else {
        setError("");
      }
    }
  }, [query, allTagUsers]);

  // Set initial value from props
  useEffect(() => {
    if (value) {
      setQuery(value);
    }
  }, [value]);

  // Load user by department ID when department changes
  useEffect(() => {
    const loadUserByDepartmentId = async () => {
      if (department) {
        try {
          setLoading(true);

          const response = await searchUsersWithDepartmentId(department, accessToken);
          // console.log("department based response", response);

          if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
            const mappedData = response.data.map((item) => ({
              id: item.userId,
              displayName: item.name,
              email: item.email
            }));

            // Check if the user exists in TAG users list
            const tagUser = allTagUsers.find(tagUser =>
              tagUser.id === mappedData[0].id ||
              tagUser.email === mappedData[0].email
            );

            if (tagUser) {
              setUsers([tagUser]);
              setQuery(tagUser.displayName);
              onUserSelect(tagUser);
              setHrFoundForDepartment(true);
              if (handleDisableField) {
                handleDisableField();
              }
            } else {
              // User from department mapping is not in TAG team
              setHrFoundForDepartment(false);
              setQuery("");
              onUserSelect(null);
              if (handleEnableField) {
                handleEnableField();
              }
            }
          } else {
            setHrFoundForDepartment(false);
            setQuery("");
            onUserSelect(null);
            if (handleEnableField) {
              handleEnableField();
            }
          }
        } catch (error) {
          // console.log("unable to fetch user", error);
          setHrFoundForDepartment(false);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUserByDepartmentId();
  }, [department, accessToken, allTagUsers]);

  const onOptionSelect: ComboboxProps["onOptionSelect"] = (e, data) => {
    const selectedUser = users.find((u) => u.id === data.optionValue);
    if (selectedUser) {
      setQuery(selectedUser.displayName);
      onUserSelect(selectedUser);
      setIsOpen(false);
      setError("");
    }
  };

  const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = ev.target.value;
    setQuery(newValue);
    setError("");

    if (!newValue) {
      onUserSelect(null);
      setUsers(allTagUsers);
    }

    setIsOpen(true);
  };

  const handleOpenChange = (e: any, data: any) => {
    setIsOpen(data.open);
    if (data.open && !query) {
      setUsers(allTagUsers);
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setUsers(allTagUsers);
    setError("");
    onUserSelect(null);
    setIsOpen(true);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Option key={`${componentId}-loading`} text="Loading..." disabled>
          <div className="flex items-center gap-2">
            <Spinner size="tiny" />
            Loading {import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"} department users...
          </div>
        </Option>
      );
    }

    if (error) {
      return (
        <Option key={`${componentId}-error`} text={error} disabled>
          <div className="flex flex-col">
            <Text className="text-red-600">{error}</Text>
            <Caption1 className="text-gray-500">
              Please try a different search term
            </Caption1>
          </div>
        </Option>
      );
    }

    if (users.length === 0 && query && query.length >= 2) {
      return (
        <>
          <Option key={`${componentId}-no-results`} text="No matching TAG users found" disabled>
            <div className="flex flex-col">
              <Text>No users found matching "{query}"</Text>
              <Caption1 className="text-gray-500">
                in {import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"} department
              </Caption1>
            </div>
          </Option>
          <Option
            key={`${componentId}-clear-search`}
            text={`Clear search and show all ${import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"} users`}
            onClick={handleClearSearch}
          >
            <div className="flex flex-col text-blue-600">
              <Text>Clear search</Text>
              <Caption1>Show all {import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"} department users</Caption1>
            </div>
          </Option>
        </>
      );
    }

    if (users.length === 0 && !query) {
      return (
        <Option key={`${componentId}-empty`} text="No TAG users available" disabled>
          <div className="flex flex-col">
            <Text>No users found in TAG department</Text>
            <Caption1 className="text-gray-500">
              Contact system administrator
            </Caption1>
          </div>
        </Option>
      );
    }

    return users.map((user, index) => (
      <Option
        key={`${componentId}-${user.id}-${index}`}
        value={user.id}
        text={user.displayName}
      >
        <div className="flex flex-col py-1">
          <Persona
            avatar={{ color: "colorful" }}
            aria-hidden="true"
            name={user.displayName}
            secondaryText={user.email}
          />
          {user.department && (
            <Caption1 className="text-blue-600 mt-0.5 ml-10">
              {user.department}
            </Caption1>
          )}
        </div>
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
      <div className="relative">
        <Combobox
          className="w-full min-w-[100px]"
          onOptionSelect={onOptionSelect}
          placeholder={placeholder}
          onChange={handleInputChange}
          value={query}
          open={isOpen}
          onOpenChange={handleOpenChange}
          disabled={!hrFoundForDepartment || disabled}
        >
          {renderContent()}
        </Combobox>
        {query && (
          <Button
            disabled={!hrFoundForDepartment || disabled}
            appearance="transparent"
            icon={<Delete20Regular />}
            size="small"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={handleClearSearch}
            aria-label="Clear search"
          />
        )}
      </div>
    </Field>
  );
};

const SubordinateUserCombobox: FC<UserComboboxProps> = ({
  label,
  placeholder,
  value,
  onUserSelect,
  required = false,
  disabled = false,
  validationState = "none",
  validationMessage,
  icon,
  department,
  formData,
  currentUser,
}) => {
  const [query, setQuery] = useState<string>("");
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [allTAGUsers, setAllTAGUsers] = useState<UserDetails[]>([]); // Store all TAG users
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { accessToken }: any = useAuth();
  const componentId = useId("subordinate-combobox");

  // Load all TAG department users once when component mounts
  useEffect(() => {
    const loadAllTAGUsers = async () => {
      if (!accessToken) return;

      try {
        setLoading(true);
        setError("");

        // Load all TAG department users
        const hrUsers = await getHRDepartmentUsers(accessToken);
        setAllTAGUsers(hrUsers);
        setUsers(hrUsers); // Initially show all users
      } catch (error: any) {
        console.error("Error loading TAG department users:", error);
        setError("Could not load TAG department users");
        setAllTAGUsers([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllTAGUsers();
  }, [accessToken]);

  // Filter users based on search query
  useEffect(() => {
    if (!query.trim()) {
      // If query is empty, show all TAG users
      setUsers(allTAGUsers);
      setError("");
    } else {
      // Filter users based on query
      const lowerQuery = query.toLowerCase();
      const filteredUsers = allTAGUsers.filter(
        (user) =>
          user?.displayName?.toLowerCase().includes(lowerQuery) ||
          user?.email?.toLowerCase().includes(lowerQuery)
      );
      setUsers(filteredUsers);

      // Set error if no matches found
      if (filteredUsers.length === 0) {
        setError(`No users found matching "${query}" in TAG department`);
      } else {
        setError("");
      }
    }
  }, [query, allTAGUsers]);

  // Set initial value from props
  useEffect(() => {
    if (value) {
      setQuery(value);
    }
  }, [value]);

  const onOptionSelect: ComboboxProps["onOptionSelect"] = (e, data) => {
    const selectedUser = users.find((u) => u.id === data.optionValue);
    if (selectedUser) {
      setQuery(selectedUser.displayName);
      onUserSelect(selectedUser);
      setIsOpen(false);
      setError("");
    }
  };

  const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = ev.target.value;
    setQuery(newValue);

    // Clear selection if input is cleared
    if (!newValue) {
      onUserSelect(null);
      setError("");
    }

    setIsOpen(true);
  };

  const handleOpenChange = (e: any, data: any) => {
    setIsOpen(data.open);
    if (data.open && !query) {
      // Reset to show all users when dropdown opens with empty query
      setUsers(allTAGUsers);
      setError("");
    }
  };

  const handleClearSearch = () => {
    setQuery("");
    setUsers(allTAGUsers);
    setError("");
    onUserSelect(null);
    setIsOpen(true);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Option key={`${componentId}-loading`} text="Loading..." disabled>
          <div className="flex items-center gap-2">
            <Spinner size="tiny" />
            Loading TAG department users...
          </div>
        </Option>
      );
    }

    if (error) {
      return (
        <Option key={`${componentId}-error`} text={error} disabled>
          <div className="flex flex-col">
            <Text className="text-red-600">{error}</Text>
            <Caption1 className="text-gray-500">
              Try a different search term or clear your search
            </Caption1>
          </div>
        </Option>
      );
    }

    if (users.length === 0 && query && query.length >= 2) {
      return (
        <>
          <Option key={`${componentId}-no-results`} text={`No matching ${import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"} users found`} disabled>
            <div className="flex flex-col">
              <Text>No users found matching "{query}"</Text>
              <Caption1 className="text-gray-500">
                in {import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"} department
              </Caption1>
            </div>
          </Option>
          <Option
            key={`${componentId}-clear-search`}
            text={`Clear search and show all ${import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"} users`}
            onClick={handleClearSearch}
          >
            <div className="flex flex-col text-blue-600">
              <Text>Clear search</Text>
              <Caption1>Show all TAG department users</Caption1>
            </div>
          </Option>
        </>
      );
    }

    if (users.length === 0 && !query) {
      return (
        <Option key={`${componentId}-empty`} text="No TAG users available" disabled>
          <div className="flex flex-col">
            <Text>No users found in TAG department</Text>
            <Caption1 className="text-gray-500">
              Contact system administrator
            </Caption1>
          </div>
        </Option>
      );
    }

    return users.map((user, index) => (
      <Option
        key={`${componentId}-${user.id}-${index}`}
        value={user.id}
        text={user.displayName}
      >
        <div className="flex flex-col py-1">
          <Persona
            avatar={{ color: "colorful" }}
            aria-hidden="true"
            name={user.displayName}
            secondaryText={user.email}
          />
          {user.department && (
            <Caption1 className="text-blue-600 mt-0.5 ml-10">
              {user.department}
            </Caption1>
          )}
        </div>
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
      <div className="relative">
        <Combobox
          className="w-full min-w-[100px]"
          onOptionSelect={onOptionSelect}
          placeholder="Search or select user from TAG department..."
          onChange={handleInputChange}
          value={query}
          disabled={!users || users.length === 0 || disabled}
          open={isOpen}

          onOpenChange={handleOpenChange}
        >
          {renderContent()}
        </Combobox>
        {query && (
          <Button
            appearance="transparent"
            icon={<Delete20Regular />}
            size="small"
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={handleClearSearch}
            aria-label="Clear search"
            disabled={!users || users.length === 0 || disabled}
          />
        )}
      </div>
    </Field>
  );
};

const checkRecruitPermission = (
  permissions: UserPermissions | undefined,
  permissionPath: string
): boolean => {
  if (!permissions) return false;

  const paths = permissionPath.split(".");
  let current: any = permissions;

  for (const path of paths) {
    if (!current || current[path] === undefined) {
      return false;
    }
    current = current[path];
  }

  return current === true;
};

const getViewPermissionType = (
  permissions: UserPermissions | undefined
): "view_all" | "view_my" | "none" => {
  if (!permissions?.recruit?.job_posting?.view_job) return "none";

  const viewJob = permissions.recruit.job_posting.view_job;

  if (viewJob.view_all) return "view_all";
  if (viewJob.view_my) return "view_my";

  return "none";
};
// =============================================
// MAIN EDIT FORM COMPONENT
// =============================================

export default function EditJDForm() {
  const [tempGeneratedContent, setTempGeneratedContent] = useState("");
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    jobRole: "",
    jobNature: "",
    jobId: "",
    department: "",
    departmentCode: "",
    departmentId: "",
    targetDate: null,
    numPositions: 1,
    minWorkExperience: 0,
    maxWorkExperience: 1,
    MinSalaryRange: 10,
    MaxSalaryRange: 20,
    jobLocation: "",
    locationCode: "",
    skills: [],
    status: "Active",
    jobDescription: "",
    reportingManager: null,
    interviewer: null,
    subordinate: null,
    createdByUserID: "",
    isActive: true,
    isPublished: false,
    inActiveReason: "",
    designation: "",
  });

  const [errors, setErrors] = useState<FormErrors>({
    jobRole: "",
    jobNature: "",
    department: "",
    targetDate: "",
    numPositions: "",
    minWorkExperience: "",
    maxWorkExperience: "",
    MinSalaryRange: "",
    MaxSalaryRange: "",
    jobLocation: "",
    skills: "",
    jobDescription: "",
    reportingManager: "",
    designation: "",
    interviewer: "",
  });

  const { Id } = useParams();
  const navigate = useNavigate();
  const { currentUser, accessToken, refreshToken }: any = useAuth();

  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentTone, setCurrentTone] = useState("");

  const [newSkill, setNewSkill] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [loading, setLoading] = useState(false);

  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoadingJobPostings, setIsLoadingJobPostings] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [inActiveReason, setInActiveReason] = useState("");
  const [shouldUpdateForm, setShouldUpdateForm] = useState(false);
  const [shouldDisableFromPublish, setShouldDisableFromPublish] = useState(false);

  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    DepartmentOption[]
  >([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);


  const [interviewerHRDetails, setInterviewerHRDetails] = useState<any>([]);


  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);
  const viewPermissionType = getViewPermissionType(currentUser?.permissions);
  const canViewJobs = viewPermissionType !== "none";
  const canEditJob = checkRecruitPermission(
    currentUser?.permissions,
    "recruit.job_posting.edit_job"
  );
  const canDeleteJob = checkRecruitPermission(
    currentUser?.permissions,
    "recruit.job_posting.delete_job"
  );

  const [ExistingSkills, setExistingSkills] = useState<Array<{ name: string; rating: number }>>([])
  const [isJDRegenerated, setIsJDRegenerated] = useState<boolean>(false)
  const [
    generatedContent,
    setGeneratedContent,
  ] = useState<GeneratedDescription | null>(null);


  const [shouldAutoUpdateDescription, setShouldAutoUpdateDescription] = useState(false);
  const skillsUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousSkillsRef = useRef<string>("");

  const jobNatureOptions = [
    "Full-time",
    "Part-time",
    "Contract",
    "Freelance",
    "Internship",
    "Remote",
    "Hybrid",
  ];

  // REPLACE the canEditOrDelete function with this:
  const canEditOrDelete = (): boolean => {
    // Simply check if user has edit permission
    return canEditJob;
  };

  const canUserDelete = (): boolean => {
    // Simply check if user has delete permission
    return canDeleteJob;
  };

  const handleSubordinateChange = (person: Person | null) => {
    // console.log("Setting interviewer to:", person);

    setFormData(prev => ({
      ...prev,
      subordinate: person,
    }));


  };

  const canPerformDelete = canUserDelete();

  const isFormDisabled = () => {
    // If user does not have edit permission, disable form
    if (!canEditJob) return true;
    // If status is Published, disable form fields (but allow status change)
    if ((isPublished && !shouldUpdateForm) || shouldDisableFromPublish)
      return true;
    // If Inactive and has edit access, allow editing
    // If Active and has edit access, allow editing
    return false;
  };

  const isJobDescriptionEnabled = React.useMemo(() => {
    return (
      formData.jobRole &&
      formData.jobNature &&
      formData.department &&
      formData.targetDate &&
      formData.jobLocation &&
      formData.skills.length > 0
    );
  }, [
    formData.jobRole,
    formData.jobNature,
    formData.department,
    formData.targetDate,
    formData.jobLocation,
    formData.skills.length,
  ]);

  // =============================================
  // DATA LOADING EFFECTS
  // =============================================

  useEffect(() => {
    if (
      !Id &&
      !formData.reportingManager &&
      currentUser &&
      !initialDataLoaded
    ) {
      setFormData((prevData) => ({
        ...prevData,
        reportingManager: {
          id: currentUser.userID,
          displayName: currentUser.displayName,
          email: currentUser.email,
        },
      }));
    }
  }, [currentUser, Id, initialDataLoaded, formData.reportingManager]);

  useEffect(() => {
    const currentSkillsString = JSON.stringify(formData.skills);

    const skillsHaveChanged = previousSkillsRef.current !== "" &&
      previousSkillsRef.current !== currentSkillsString;

    if (
      shouldAutoUpdateDescription &&
      formData.jobDescription &&
      formData.jobDescription.trim().length > 50 &&
      formData.skills.length >= 3 &&
      skillsHaveChanged
    ) {
      if (skillsUpdateTimeoutRef.current) {
        clearTimeout(skillsUpdateTimeoutRef.current);
      }
      skillsUpdateTimeoutRef.current = setTimeout(async () => {
        await updateDescriptionWithSkills();
      }, 2000);
    }

    previousSkillsRef.current = currentSkillsString;

    return () => {
      if (skillsUpdateTimeoutRef.current) {
        clearTimeout(skillsUpdateTimeoutRef.current);
      }
    };
  }, [formData.skills, shouldAutoUpdateDescription, formData.jobDescription]);

  const loadJDRequestData = async () => {
    if (Id && !initialDataLoaded) {
      try {
        const result = await getJDRequestById(Id, accessToken);

        if (result.success && result.data) {
          let determinedStatus = result.data.Status || "Active";
          let determinedIsActive = result.data.isActive ?? true;
          let determinedIsPublished = result.data.isPublished ?? false;
          let determinedSkills = Array.isArray(result.data.Skills)
            ? result.data.Skills.map((skill: any) => ({
              name: skill.Name || "",
              rating: skill.Rating || 0,
            }))
            : []
          setExistingSkills(determinedSkills)
          if (result.data.Status === "Inactive") {
            determinedIsActive = false;
            determinedIsPublished = false;
          } else if (result.data.Status === "Published") {
            determinedIsActive = true;
            determinedIsPublished = true;
            setShouldDisableFromPublish(true)
          } else if (result.data.Status === "Active") {
            determinedIsActive = true;
            determinedIsPublished = false;
          }

          const selectedDept = departmentOptions.find(
            (d) => d.Name === result.data.Department
          );
          const selectedLoc = locationOptions.find(
            (l) => l.Name === result.data.JobLocation
          );

          setFormData({
            jobId: result.data.JobID || "",
            jobRole: result.data.JobRole || "",
            jobNature: result.data.JobNature || "",
            department: result.data.Department || "",
            departmentCode: selectedDept?.Code || "",
            targetDate: result.data.TargetDate
              ? new Date(result.data.TargetDate)
              : null,
            numPositions: result.data.NumPositions || 1,
            minWorkExperience: result.data.minWorkExperience || 0,
            maxWorkExperience: result.data.maxWorkExperience || 1,
            MinSalaryRange: result.data.MinSalaryRange || 1,
            MaxSalaryRange: result.data.MaxSalaryRange || 2,
            jobLocation: result.data.JobLocation || "",
            locationCode: selectedLoc?.Code || "",
            jobDescription: result.data.JobDescription || "",
            status: determinedStatus,
            skills: Array.isArray(result.data.Skills)
              ? result.data.Skills.map((skill: any) => ({
                name: skill.Name || "",
                rating: skill.Rating || 0,
              }))
              : [],
            reportingManager: result.data.reportingManager
              ? {
                id: result.data.reportingManager.id,
                displayName: result.data.reportingManager.displayName,
                email: result.data.reportingManager.email,
              }
              : null,

            interviewer: result.data.interviewer
              ? {
                id: result.data.interviewer.id,
                displayName: result.data.interviewer.displayName,
                email: result.data.interviewer.email,
              }
              :
              null,
            subordinate: result.data.subordinate
              ? {
                id: result.data.subordinate.id,
                displayName: result.data.subordinate.displayName,
                email: result.data.subordinate.email,
              }
              :
              null,
            createdByUserID:
              result.data.CreatedByUserID || result.data.createdBy?.userID,
            isActive: determinedIsActive,
            isPublished: determinedIsPublished,
            inActiveReason: result.data.InActiveReason || "",
            designation: result.data.Designation || ""
          });

          setInterviewerHRDetails(result.data.interviewerHRDetails || []);

          setIsActive(determinedIsActive);
          setIsPublished(determinedIsPublished);
          setInActiveReason(result.data.InActiveReason || "");
          setInitialDataLoaded(true);
        }
      } catch (error) {
        console.error("Error loading JD request:", error);
        throw error; // Re-throw to be caught in loadAll
      }
    }
  };

  useEffect(() => {
    const loadJobPostings = async () => {
      try {
        setIsLoadingJobPostings(true);
        const response = await getAllJobPostings({}, accessToken);
        if (response.success && Array.isArray(response.data)) {
          setJobPostings(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch job postings:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to load jobs</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setIsLoadingJobPostings(false);
      }
    };

    const loadLocationData = async () => {
      try {
        setIsLoadingLocations(true);
        const data = await getCombinedLocations(accessToken);
        if (data) {
          setLocationOptions(data);
        }
      } catch (error) {
        console.error("Failed to fetch locations:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to load locations</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setIsLoadingLocations(false);
      }
    };

    const loadDepartmentData = async () => {
      try {
        setIsLoadingDepartments(true);
        const data = await getCombinedDepartments(accessToken);
        if (data) {
          setDepartmentOptions(data);
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to load departments</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    const loadTone = async () => {
      try {
        if (!currentTone) {
          const storedTone = await getActiveJobPrompt(accessToken).then(
            (res: any) => res.data.Prompt || ""
          );
          if (storedTone) {
            setCurrentTone(storedTone);
          }
        }
      } catch (err) {
        console.error("Error loading tone:", err);
      }
    };

    const loadAll = async () => {
      try {
        setLoading(true);
        await Promise.all([
          loadJobPostings(),
          loadLocationData(),
          loadDepartmentData(),
          loadTone(),
        ]);
        // Load JD data if editing existing
        if (Id) {
          await loadJDRequestData();
        }
      } catch (error) {
        // console.log("Error while loading data", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to load data</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [dispatchToast, accessToken, currentTone]);

  // =============================================
  // FORM HANDLERS
  // =============================================


  const handleInterviewerChange = (person: Person | null) => {
    // console.log("Setting interviewer to:", person);

    setFormData(prev => ({
      ...prev,
      interviewer: person,
    }));

    const errorMessage = validateField("interviewer", person);
    setErrors((prev) => ({
      ...prev,
      interviewer: errorMessage,
    }));
  };


  const populateJobRoleData = async (selectedJobRole: string) => {
    try {
      setLoading(true);
      const selectedJobPosting = jobPostings.find(
        (posting) => posting.title === selectedJobRole
      );
      if (selectedJobPosting) {
        const skillsWithRating = selectedJobPosting.skills.map((skill) => ({
          name: skill,
          rating: 3,
        }));

        setFormData((prevData) => ({
          ...prevData,
          jobRole: selectedJobRole,
          jobId: selectedJobPosting.id,
          skills: skillsWithRating,
          jobDescription: selectedJobPosting.description,
        }));

        // Check if we have interviewerUserId
        if (formData.interviewer?.id) {
          try {
            // Fetch interviewer details using getUserDetailforJd
            const response = await getUserDetailforJd(
              formData.interviewer.id,
              accessToken
            );
            // console.log('user fetch', response);
            setInterviewerHRDetails(response.data.id);

            // Directly update formData with interviewer
            if (response && response.success && response.data) {
              const userdata = response.data;
              const interviewerPerson: Person = {
                id: userdata.id || userdata.userID || formData.interviewer?.id,
                displayName:
                  userdata.displayName ||
                  userdata.name ||
                  `${userdata.firstName || ""} ${userdata.lastName || ""}`.trim() ||
                  userdata.email?.split("@")[0] ||
                  "Unknown User",
                email: userdata.email || userdata.userPrincipalName || userdata.mail,
              };

              // Set interviewer in formData DIRECTLY
              setFormData((prev) => ({
                ...prev,
                interviewer: interviewerPerson,
              }));

              // console.log("Interviewer set from API:", interviewerPerson);
            }
          } catch (error) {
            console.error("Error fetching interviewer details:", error);
            dispatchToast(
              <Toast>
                <ToastTitle>Could not load interviewer details</ToastTitle>
              </Toast>,
              { intent: "warning" }
            );
          }
        } else {
          // console.log("No interviewerUserId found in job posting");
        }

        setErrors((prevErrors) => ({
          ...prevErrors,
          jobRole: "",
          skills: "",
          jobDescription: "",
        }));

        dispatchToast(
          <Toast>
            <ToastTitle>Job data populated successfully</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const validateInActiveReason = (active: boolean, reason: string): string => {
    if (!active && (!reason || reason.trim().length < 10)) {
      return "Please provide a reason for making this JD request inactive (minimum 10 characters)";
    }
    return "";
  };

  const handleJobRoleChange = (value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      jobRole: value,
    }));

    setErrors((prev) => ({
      ...prev,
      jobRole: "",
    }));

    if (value) {
      populateJobRoleData(value);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        skills: [],
        jobDescription: "",
      }));
    }
  };

  const validateField = (field: keyof FormData, value: any): string => {
    let error = "";

    switch (field) {
      case "jobRole":
        if (!value) error = "Position Title is required";
        break;
      case "designation":
        if (!value) {
          error = "Designation is required"
        }
        else if (value && value.length < 5) {
          error = "Minimum of 5 characters is required"
        }
        break;
      case "jobNature":
        if (!value) error = "Nature of job is required";
        break;

      case "department":
        if (!value) error = "Department is required";
        break;
      case "targetDate":
        if (!value) {
          error = "Target date is required";
        }
        break;
      case "numPositions":
        if (value < 1) error = "At least one position is required";
        break;
      case "minWorkExperience":
        if (value < 0) {
          error = "Minimum work experience must be at least 0 year";
        } else if (
          formData.maxWorkExperience &&
          value >= formData.maxWorkExperience
        ) {
          error =
            "The minimum work experience cannot be greater than or equal to the maximum work experience.";
        }
        break;
      case "maxWorkExperience":
        if (value < 1) {
          error = "Maximum work experience must be at least 1 year";
        } else if (
          formData.minWorkExperience &&
          value <= formData.minWorkExperience
        ) {
          error =
            "The maximum work experience cannot be less than or equal to the minimum work experience.";
        }
        break;
      case "MinSalaryRange":
        if (value < 1) {
          error = "Minimum salary must be at least 1 LPA";
        } else if (
          formData.MaxSalaryRange &&
          value >= formData.MaxSalaryRange
        ) {
          error = "Minimum salary cannot be greater than or equal to the maximum salary";
        }
        break;
      case "MaxSalaryRange":
        if (value < 1) {
          error = "Maximum salary must be at least 1 LPA";
        } else if (
          formData.MinSalaryRange &&
          value <= formData.MinSalaryRange
        ) {
          error = "Maximum salary cannot be less than minimum salary";
        }
        break;
      case "jobLocation":
        if (!value) error = "Job location is required";
        break;
      case "skills":
        if (!Array.isArray(value) || value.length === 0) {
          error = "At least one skill is required";
        } else if (value.length < 3) {
          error = "At least 3 skills are required";
        }
        break;
      case "jobDescription":
        if (!value || value.trim().length < 50) {
          error = "Job description must be at least 50 characters";
        }
        break;
      case "reportingManager":
        if (!value) error = "Reporting manager is required";
        break;
      case "interviewer":
        if (!value) error = "Primary HR is required";
        break;
      default:
        break;
    }

    return error;
  };

  const handleDropdownChange = (field: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    const errorMessage = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: errorMessage,
    }));
  };

  const handleLocationChange = (selectedName: string) => {
    const selectedOption = locationOptions.find(
      (opt) => opt.Name === selectedName
    );
    setFormData({
      ...formData,
      jobLocation: selectedName,
      locationCode: selectedOption ? selectedOption.Code : "",
    });
    const errorMessage = validateField("jobLocation", selectedName);
    setErrors((prev) => ({
      ...prev,
      jobLocation: errorMessage,
    }));
  };

  const handleDepartmentChange = (selectedName: string) => {
    const selectedOption = departmentOptions.find(
      (opt) => opt.Name === selectedName
    );
    setFormData({
      ...formData,
      department: selectedName,
      departmentCode: selectedOption ? selectedOption.Code : "",
    });
    const errorMessage = validateField("department", selectedName);
    setErrors((prev) => ({
      ...prev,
      department: errorMessage,
    }));
  };

  const handleDateChange = (date: Date | null | undefined) => {
    setFormData({
      ...formData,
      targetDate: date ?? null,
    });
    const errorMessage = validateField("targetDate", date);
    setErrors((prev) => ({
      ...prev,
      targetDate: errorMessage,
    }));
  };

  const handleSliderChange = (field: keyof FormData, value: number) => {
    const updatedFormData = {
      ...formData,
      [field]: value,
    };

    setFormData(updatedFormData);

    if (field === "MinSalaryRange" || field === "MaxSalaryRange") {
      const minValue =
        field === "MinSalaryRange" ? value : formData.MinSalaryRange;
      const maxValue =
        field === "MaxSalaryRange" ? value : formData.MaxSalaryRange;

      let minError = "";
      if ((minValue ?? 0) < 1) {
        minError = "Minimum salary must be at least 1 LPA";
      } else if (maxValue && (minValue ?? 0) >= maxValue) {
        minError = "Minimum salary cannot be greater than or equal to maximum salary";
      }

      let maxError = "";
      if ((maxValue ?? 0) < 1) {
        maxError = "Maximum salary must be at least 1 LPA";
      } else if (minValue && (maxValue ?? 0) <= minValue) {
        maxError = "Maximum salary cannot be less than or equal to minimum salary";
      }

      setErrors((prev) => ({
        ...prev,
        MinSalaryRange: minError,
        MaxSalaryRange: maxError,
      }));
    } else if (field === "minWorkExperience" || field === "maxWorkExperience") {
      const minValue =
        field === "minWorkExperience" ? value : formData.minWorkExperience;
      const maxValue =
        field === "maxWorkExperience" ? value : formData.maxWorkExperience;

      let minError = "";
      if ((minValue ?? 0) < 0) {
        minError = "Minimum work experience must be at least 0 year";
      } else if (maxValue && (minValue ?? 0) >= maxValue) {
        minError =
          "The minimum work experience cannot be greater than or equal to the maximum work experience.";
      }

      let maxError = "";
      if ((maxValue ?? 0) < 1) {
        maxError = "Maximum work experience must be at least 1 year";
      } else if ((minValue ?? 0) >= (maxValue ?? 0) && (maxValue ?? 0) >= 1) {
        maxError =
          "The maximum work experience cannot be less than or equal to the minimum work experience.";
      }

      setErrors((prev) => ({
        ...prev,
        minWorkExperience: minError,
        maxWorkExperience: maxError,
      }));
    } else {
      const errorMessage = validateField(field, value);
      setErrors((prev) => ({
        ...prev,
        [field]: errorMessage,
      }));
    }
  };

  const handleEditorChange = (value: string) => {
    if (!isJobDescriptionEnabled) {
      return;
    }

    setFormData({
      ...formData,
      jobDescription: value,
    });
    const errorMessage = validateField("jobDescription", value);
    setErrors((prev) => ({
      ...prev,
      jobDescription: errorMessage,
    }));
  };

  const handleReportingManagerChange = React.useCallback(
    (person: Person | null) => {
      setFormData((prevData) => ({
        ...prevData,
        reportingManager: person,
      }));

      const errorMessage = validateField("reportingManager", person);
      setErrors((prev) => ({
        ...prev,
        reportingManager: errorMessage,
      }));
    },
    [validateField]
  );

  const addSkill = () => {
    if (newSkill && newRating > 0) {
             const specialCharRegex = /[^a-zA-Z0-9\s\-\+\#\.]/;
    if (specialCharRegex.test(newSkill)) {
      setErrors((prev) => ({
        ...prev,
        skills: "Skill name cannot contain special characters",
      }));
      return;
    }
      if (formData.skills.find(skill => skill.name.toLowerCase() === newSkill.toLowerCase())) {
        setErrors((prev) => ({ ...prev, skills: "Skill already exists" }));
        return;
      }
      const updatedSkills = [
        ...formData.skills,
        { name: newSkill, rating: newRating },
      ];
      setFormData({ ...formData, skills: updatedSkills });
      setNewSkill("");
      setNewRating(0);
      setIsJDRegenerated(false);

      const errorMessage = validateField("skills", updatedSkills);
      setErrors((prev) => ({ ...prev, skills: errorMessage }));

      if (formData.jobDescription && formData.jobDescription.trim().length > 50) {
        setShouldAutoUpdateDescription(true);
      }
    } else {
      setErrors((prev) => ({ ...prev, skills: "Both skill name and rating are required" }));
    }
  };

  const removeSkill = (index: number) => {
    const updatedSkills = [...formData.skills];
    updatedSkills.splice(index, 1);
    setFormData({ ...formData, skills: updatedSkills });
    setIsJDRegenerated(false);

    const errorMessage = validateField("skills", updatedSkills);
    setErrors((prev) => ({ ...prev, skills: errorMessage }));

    if (formData.jobDescription && formData.jobDescription.trim().length > 50) {
      setShouldAutoUpdateDescription(true);
    }
  };

  const updateSkill = (
    index: number,
    field: "name" | "rating",
    value: string | number
  ) => {
    const updatedSkills = [...formData.skills];
    updatedSkills[index] = {
      ...updatedSkills[index],
      [field]: field === "name" ? value : Number(value),
    };

    setFormData({
      ...formData,
      skills: updatedSkills,
    });

    setIsJDRegenerated(false)


    const errorMessage = validateField("skills", updatedSkills);
    setErrors((prev) => ({
      ...prev,
      skills: errorMessage,
    }));
  };

  // =============================================
  // VALIDATION FUNCTIONS
  // =============================================

  const getValidationState = (field: keyof FormErrors): "error" | "none" => {
    return errors[field] ? "error" : "none";
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      jobRole: "",
      jobNature: "",
      department: "",
      targetDate: "",
      numPositions: "",
      minWorkExperience: "",
      maxWorkExperience: "",
      MinSalaryRange: "",
      MaxSalaryRange: "",
      jobLocation: "",
      skills: "",
      jobDescription: "",
      reportingManager: "",
      designation: "",
      interviewer: "",
    };

    let isValid = true;
    for (const field in formData) {
      const errorMessage = validateField(
        field as keyof FormData,
        formData[field as keyof FormData]
      );
      newErrors[field as keyof FormErrors] = errorMessage;
      if (errorMessage) {
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // =============================================
  // AI DESCRIPTION GENERATION
  // =============================================
  const cleanMarkdownResponse = (content: string): string => {
    let cleaned = content;
    cleaned = cleaned.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/, "");
    cleaned = cleaned.replace(/^[*\-]\s*$/gm, "");
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
    return cleaned.trim();
  };

  const convertMarkdownToHtml = (markdown: string): string => {
    if (!markdown) return "";

    const cleaned = cleanMarkdownResponse(markdown);
    const lines = cleaned.split("\n");
    const result: string[] = [];
    let inList = false;
    let lastWasHeading = false;
    let lastWasBr = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        if (inList) { result.push("</ul>"); inList = false; }
        if (!lastWasHeading && !lastWasBr) {
          result.push("<br/>");
          lastWasBr = true;
        }
        lastWasHeading = false;
        continue;
      }

      if (/^\*\*(.+)\*\*\s*$/.test(trimmed)) {
        if (inList) { result.push("</ul>"); inList = false; }
        if (result[result.length - 1] === "<br/>") result.pop();
        const text = trimmed.replace(/^\*\*(.+)\*\*\s*$/, "$1");
        result.push(`<p><strong>${text}</strong></p>`);
        lastWasHeading = true;
        lastWasBr = false;
        continue;
      }

      if (/^[•\-\*]\s+/.test(trimmed)) {
        if (!inList) { result.push("<ul>"); inList = true; }
        const text = trimmed
          .replace(/^[•\-\*]\s+/, "")
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.+?)\*/g, "<em>$1</em>");
        result.push(`<li>${text}</li>`);
        lastWasHeading = false;
        lastWasBr = false;
        continue;
      }

      if (inList) { result.push("</ul>"); inList = false; }
      const text = trimmed
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>");
      result.push(`<p>${text}</p>`);
      lastWasHeading = false;
      lastWasBr = false;
    }

    if (inList) result.push("</ul>");
    return result.join("");
  };

  const generateDescription = async (): Promise<string> => {
    if (!isJobDescriptionEnabled) {
      dispatchToast(
        <Toast><ToastTitle>Please fill all required fields before generating job description</ToastTitle></Toast>,
        { intent: "warning" }
      );
      return "";
    }

    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/openai/generate-description`,
        { ...formData, prompt: currentTone },
        { headers: { Authorization: `Bearer ${accessToken}`, timeout: 30000 } }
      );

      const { content } = res.data.output;

      // Convert markdown to HTML before storing
      const htmlContent = convertMarkdownToHtml(content);

      setTempGeneratedContent(htmlContent);
      setGeneratedContent({ content: htmlContent });
      setLoading(false);
      return htmlContent;
    } catch (err) {
      console.error("Error generating description:", err);
      setTempGeneratedContent("");
      setLoading(false);
      dispatchToast(
        <Toast><ToastTitle>Failed to generate job description</ToastTitle></Toast>,
        { intent: "error" }
      );
      return "";
    }
  };

  const handleGenerateClick = async () => {
    if (!isJobDescriptionEnabled) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            Please fill all required fields before generating job description
          </ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
      return;
    }

    setIsAIDialogOpen(true);
    await generateDescription();
  };

  const handleUseGeneratedContent = () => {
    if (tempGeneratedContent) {
      const htmlContent = convertMarkdownToHtml(tempGeneratedContent);

      setFormData({ ...formData, jobDescription: htmlContent });

      const errorMessage = validateField("jobDescription", htmlContent);
      setErrors((prev) => ({ ...prev, jobDescription: errorMessage }));
      setIsAIDialogOpen(false);
      setTempGeneratedContent("");
      setIsJDRegenerated(true);
      setExistingSkills([...formData.skills]);
      setShouldUpdateForm(true);
      setShouldAutoUpdateDescription(true); // ← enable auto-update going forward

      dispatchToast(
        <Toast><ToastTitle>Content applied successfully</ToastTitle></Toast>,
        { intent: "success" }
      );
    }
  };

  const handleDeleteConfirm = () => {
    setShowDeleteDialog(true);
  };

  const handleDesignationChange = (value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      ["designation"]: value
    }))
  }


  // Check skills updated 

  const isSkillsChanged = (): boolean => {
    if (ExistingSkills.length !== formData.skills.length) {
      return true;
    }
    for (let i = 0; i < ExistingSkills.length; i++) {
      if (
        ExistingSkills[i].name !== formData.skills[i].name ||
        ExistingSkills[i].rating !== formData.skills[i].rating
      ) {
        return true;
      }
    }
    return false;
  }

  // =============================================
  // FORM SUBMISSION
  // =============================================

  const handleUpdate = async (e: React.FormEvent) => {
    if (isSkillsChanged() && !isJDRegenerated) {
      dispatchToast(
        <Toast>
          <ToastTitle>Skills have been changed please regenerate the Job Description Accordingly</ToastTitle>
        </Toast>,
        { intent: "error" }
      );

      return;
    }
    try {
      e.preventDefault();
      setIsUpdating(true);

      let isFormValid = isActive ? validateForm() : true;

      const inActiveReasonError = validateInActiveReason(
        isActive,
        inActiveReason
      );
      if (inActiveReasonError) {
        isFormValid = false;
      }

      if (!formData.targetDate) {
        setErrors((prev) => ({
          ...prev,
          targetDate: "Target date is required",
        }));
        isFormValid = false;
      }

      // if (isPublished && formData.targetDate) {
      //   const currentDate = new Date();
      //   currentDate.setHours(0, 0, 0, 0);
      //   const selectedDate = new Date(formData.targetDate);
      //   selectedDate.setHours(0, 0, 0, 0);
      //   if (selectedDate < currentDate) {
      //     setErrors((prev) => ({
      //       ...prev,
      //       targetDate: "Target date cannot be in the past when publishing",
      //     }));
      //     isFormValid = false;
      //   }
      // }

      if (!formData.reportingManager) {
        setErrors((prev) => ({
          ...prev,
          reportingManager: "Reporting manager is required",
        }));
        isFormValid = false;
      }

      if (!formData.interviewer) {
        setErrors((prev) => ({
          ...prev,
          interviewer: "Primary HR is required",
        }));
        isFormValid = false;
      }

      if (formData.interviewer?.id === formData.subordinate?.id) {
        setErrors((prev) => ({
          ...prev,
          interviewer: "Primary HR and Subordinate cannot be the same person",
          subordinate: "Primary HR and Subordinate cannot be the same person"
        }))

        isFormValid = false;
      }

      if (
        isFormValid &&
        Id &&
        formData.reportingManager &&
        formData.interviewer &&
        formData.targetDate
      ) {
        try {
          let currentStatus = "Active";
          if (!isActive) {
            currentStatus = "Inactive";
          } else if (isPublished) {
            currentStatus = "Published";
          }

          const updatePayload = {
            jobId: formData.jobId,
            jobRole: formData.jobRole,
            jobNature: formData.jobNature,
            department: formData.department,
            departmentCode: formData.departmentCode,
            targetDate: formData.targetDate.toISOString(),
            numPositions: formData.numPositions,
            minWorkExperience: formData.minWorkExperience,
            maxWorkExperience: formData.maxWorkExperience,
            MinSalaryRange: formData.MinSalaryRange,
            MaxSalaryRange: formData.MaxSalaryRange,
            jobLocation: formData.jobLocation,
            locationCode: formData.locationCode,
            jobDescription: formData.jobDescription,
            modifiedByUserId: currentUser.userID,
            skills: formData.skills,
            updateSkills: true,
            reportingManager: formData.reportingManager,
            status: currentStatus,
            isActive: isActive,
            isPublished: isPublished,
            inActiveReason: !isActive ? inActiveReason : null,
            designation: formData.designation,
            interviewerId: formData.interviewer ? formData.interviewer.id : null,
            subordinateId: formData.subordinate ? formData.subordinate.id : null
          };

          await updateJDRequest(Id, updatePayload, accessToken);
          await refreshToken();

          // Update the existing skills to reflect the new saved state
          setExistingSkills([...formData.skills]);
          setIsJDRegenerated(true);

          let statusMessage = "updated";
          if (!isActive) {
            statusMessage = "set to inactive";
          } else if (isPublished) {
            statusMessage = "published";
          } else {
            statusMessage = "set to active";
          }

          dispatchToast(
            <Toast>
              <ToastTitle>JD Request {statusMessage} successfully</ToastTitle>
            </Toast>,
            { intent: "success" }
          );

          setTimeout(() => {
            navigate("/recruit");
          }, 1500);
        } catch (error) {
          console.error("Error updating JD request:", error);
          dispatchToast(
            <Toast>
              <ToastTitle>Failed to update JD request</ToastTitle>
            </Toast>,
            { intent: "error" }
          );
        }
      } else {
        if (inActiveReasonError) {
          dispatchToast(
            <Toast>
              <ToastTitle>{inActiveReasonError}</ToastTitle>
            </Toast>,
            { intent: "error" }
          );
        } else {
          dispatchToast(
            <Toast>
              <ToastTitle>
                Validation failed. Please review the form for errors.
              </ToastTitle>
            </Toast>,
            { intent: "warning" }
          );
        }
      }

      setIsUpdating(false);
    } catch (err) {
      // console.log(err);
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!Id) return;

    const currentStatus = !isActive
      ? "Inactive"
      : isPublished
        ? "Published"
        : "Active";

    // if (currentStatus !== "Inactive") {
    //   dispatchToast(
    //     <Toast>
    //       <ToastTitle>
    //         JD request must be set to Inactive status before deletion
    //       </ToastTitle>
    //     </Toast>,
    //     { intent: "error" }
    //   );
    //   setShowDeleteDialog(false);
    //   return;
    // }

    setIsDeleting(true);

    try {
      await refreshToken();
      const response = await deleteJDRequest(Id, true, currentUser.userID, accessToken);

      if (!response.success) {
        throw new Error(response.message ? response.message : "Failed to delete JD request");
      }
      dispatchToast(
        <Toast>
          <ToastTitle>JD Request deleted successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );

      setShowDeleteDialog(false);

      setTimeout(() => {
        navigate("/recruit");
      }, 1500);
    } catch (error) {
      console.error("Error deleting JD request:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to delete JD request</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }

    setIsDeleting(false);
  };

  const handleNewRatingChange = (event: any, data: { value?: number }) => {
    if (data.value !== undefined) {
      setNewRating(data.value);
    }
  };

  const handleUpdateJD = async (content: string) => {
    try {
      if (!formData.targetDate) {
        dispatchToast(
          <Toast>
            <ToastTitle>Target date is required</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
        throw new Error("Target date is required");
      }

      if (!formData.reportingManager) {
        dispatchToast(
          <Toast>
            <ToastTitle>Reporting manager is required</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
        throw new Error("Reporting manager is required");
      }

      await refreshToken();

      const notificationPayload = {
        jobId: formData.jobId,
        jobRole: formData.jobRole,
        jobNature: formData.jobNature,
        department: formData.department,
        departmentCode: formData.departmentCode,
        targetDate: formData.targetDate.toISOString(),
        numPositions: formData.numPositions,
        minWorkExperience: formData.minWorkExperience,
        maxWorkExperience: formData.maxWorkExperience,
        MinSalaryRange: formData.MinSalaryRange,
        MaxSalaryRange: formData.MaxSalaryRange,
        jobLocation: formData.jobLocation,
        locationCode: formData.locationCode,
        jobDescription: formData.jobDescription,
        modifiedByUserId: currentUser.userID,
        skills: formData.skills,
        updateSkills: true,
        reportingManager: formData.reportingManager,
        status: formData.status,
        isActive: isActive,
        isPublished: isPublished,
        inActiveReason: inActiveReason,
      };

      await sendSuggestEditJDNotification(
        notificationPayload,
        currentUser,
        content,
        accessToken
      );

      const result = await createSuggestions(accessToken, {
        jobPostingId: formData.jobId,
        suggestedDescription: content,
        suggestedByUserId: currentUser.userID,
      });

      if (!result.success) {
        throw new Error("Failed to update job description");
      }

      // console.log("Job description updated successfully", result.data);
    } catch (error) {
      throw error;
    }
  };

  const updateDescriptionWithSkills = async (): Promise<void> => {
    if (!isJobDescriptionEnabled || !formData.jobDescription) return;

    dispatchToast(
      <Toast><ToastTitle>Updating job description with new skills...</ToastTitle></Toast>,
      { intent: "info" }
    );

    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/openai/update-description-skills`,
        {
          jobRole: formData.jobRole,
          jobNature: formData.jobNature,
          department: formData.department,
          jobLocation: formData.jobLocation,
          skills: formData.skills,
          currentDescription: formData.jobDescription,
          minWorkExperience: formData.minWorkExperience,
          maxWorkExperience: formData.maxWorkExperience,
          MinSalaryRange: formData.MinSalaryRange,
          MaxSalaryRange: formData.MaxSalaryRange,
          numPositions: formData.numPositions,
          prompt: currentTone,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 30000,
        }
      );

      if (res.data.success && res.data.output?.content) {
        const htmlContent = convertMarkdownToHtml(res.data.output.content);
        setFormData((prev) => ({ ...prev, jobDescription: htmlContent }));
        setIsJDRegenerated(true);
        setExistingSkills([...formData.skills]);

        dispatchToast(
          <Toast><ToastTitle>Job description updated with new skills!</ToastTitle></Toast>,
          { intent: "success" }
        );
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Error updating description with skills:", err);
      dispatchToast(
        <Toast><ToastTitle>Failed to auto-update job description. You can manually regenerate.</ToastTitle></Toast>,
        { intent: "warning" }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSkillRatingChange = (
    index: number,
    event: React.SyntheticEvent,
    data: { value?: number }
  ) => {
    if (data.value !== undefined) {
      updateSkill(index, "rating", data.value);
    }
  };

  const isProcessing = isUpdating || isDeleting;

  // =============================================
  // RENDER
  // =============================================

  if (!canViewJobs) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <LockClosedRegular
          className="text-red-600"
          style={{ fontSize: "64px" }}
        />
        <Body1Strong className="mt-4 text-center">No Access</Body1Strong>
        <Body1 className="mt-2 text-center text-gray-600">
          You don't have permission to view or edit job opening.
        </Body1>
        <Button
          appearance="primary"
          onClick={() => navigate("/recruit")}
          className="mt-4"
        >
          Back to Recruit Dashboard
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading...</Body1Strong>
      </div>
    );
  }

  return (
    <FluentProvider
      style={{ background: "transparent" }}
      className="flex flex-col gap-5"
    >
      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-8 h-full">
          <Spinner />
          <Body1Strong className="mt-2">
            {isUpdating ? "Updating..." : "Deleting..."}
          </Body1Strong>
        </div>
      )}
      <div className="flex flex-col gap-6 overflow-y-auto  p-1">
        {!canEditJob && (
          <MessageBar
            intent="info"
            className="!bg-blue-100/30 !p-3 !rounded-xl !border-1 !border-blue-200"
          >
            <MessageBarBody className="flex flex-row gap-2">
              <Info20Regular className="!text-blue-800" />
              <MessageBarTitle className="!text-blue-800 !text-sm">
                You don't have permission to edit JD requests. Please contact
                your administrator.
              </MessageBarTitle>
            </MessageBarBody>
          </MessageBar>
        )}

        {/* Basic Job Information */}
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0 !gap-0">
          <div className="flex gap-2 p-4 bg-[#E9F3FF] border-b-2 border-b-[#E5E7EB]">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0C59A4] text-white rounded-full">
              <Briefcase20Regular />
            </div>
            <div className="flex flex-col">
              <Subtitle2 className="text-gray-900">
                Position Details
              </Subtitle2>
              <Caption1 className="text-gray-500">
                Essential details about the job position
              </Caption1>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <FilterCombobox
                label="Position Title"
                options={jobPostings.map((posting) => posting.title)}
                disabled
                value={formData.jobRole}
                onChange={handleJobRoleChange}
                placeholder={
                  isLoadingJobPostings
                    ? "Loading..."
                    : "Select or type job"
                }
                required
                // disabled={isLoadingJobPostings || isFormDisabled()}
                validationState={getValidationState("jobRole")}
                validationMessage={errors.jobRole}
                icon={<Briefcase20Regular />}
              />

              <Field
                required
                label={
                  <>
                    <Person20Regular /> Designation
                  </>
                }

                validationState={getValidationState("designation")}
                validationMessage={errors.designation}
              >
                <Input
                  required
                  value={formData.designation}
                  onChange={(e) => handleDesignationChange(e.target.value)}
                  placeholder="eg. Associate Developer"
                  disabled={isFormDisabled()}
                />
              </Field>

              <Field
                orientation="vertical"
                label={
                  <>
                    <Briefcase20Regular /> Nature of Job
                  </>
                }
                validationState={getValidationState("jobNature")}
                validationMessage={errors.jobNature}
                required
              >
                <Dropdown
                  placeholder="Select job nature"
                  value={formData.jobNature}
                  onOptionSelect={(_, data) =>
                    handleDropdownChange("jobNature", data.optionValue || "")
                  }
                  disabled={isFormDisabled()}
                >
                  {jobNatureOptions.map((option) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <FilterCombobox
                label="Department"
                options={departmentOptions.map((opt) => opt.Name)}
                value={formData.department}
                onChange={handleDepartmentChange}
                placeholder={
                  isLoadingDepartments
                    ? "Loading..."
                    : "Select or type department"
                }
                required
                disabled={isLoadingDepartments || isFormDisabled()}
                validationState={getValidationState("department")}
                validationMessage={errors.department}
                icon={<Building20Regular />}
              />

              <FilterCombobox
                label="Job Location"
                options={locationOptions.map((opt) => opt.Name)}
                value={formData.jobLocation}
                onChange={handleLocationChange}
                placeholder={
                  isLoadingLocations ? "Loading..." : "Select or type location"
                }
                required
                disabled={isLoadingLocations || isFormDisabled()}
                validationState={getValidationState("jobLocation")}
                validationMessage={errors.jobLocation}
                icon={<Location20Regular />}
              />

              <Field
                orientation="vertical"
                label={
                  <>
                    <CalendarLtr20Regular /> Target Hire Date
                  </>
                }
                validationState={getValidationState("targetDate")}
                validationMessage={errors.targetDate}
                required
              >
                <DatePicker
                  placeholder="Select target date"
                  value={formData.targetDate}
                  onSelectDate={handleDateChange}
                  minDate={new Date()}
                  disabled={isFormDisabled()}
                />
              </Field>
              <UserCombobox
                label="Reporting Manager"
                placeholder="Search for Reporting Manager..."
                value={formData.reportingManager?.displayName || ""}
                onUserSelect={(user) => {
                  if (user) {
                    handleReportingManagerChange({
                      id: user.id,
                      displayName: user.displayName,
                      email: user.email,
                    });
                  } else {
                    handleReportingManagerChange(null);
                  }
                }}
                required={true}
                disabled={isFormDisabled()}
                validationState={getValidationState("reportingManager")}
                validationMessage={errors.reportingManager}
                icon={<People20Regular />}
                formData={formData}
              />


              <InterviewUserCombobox
                label="Primary HR"
                placeholder="Select HR"
                value={formData.interviewer?.displayName || ""}
                onUserSelect={(user) => {
                  if (user) {
                    handleInterviewerChange({
                      id: user.id,
                      displayName: user.displayName,
                      email: user.email,
                    });
                  } else {
                    handleInterviewerChange(null);
                  }
                }}
                required={true}
                disabled={isFormDisabled()}
                icon={<PersonStar20Regular />}
                department={formData.departmentId}
                formData={formData}
                currentUser={currentUser}
                userId={interviewerHRDetails} // Pass the specific user ID
                validationState={getValidationState("interviewer")}
                validationMessage={errors.interviewer}

              />

              <SubordinateUserCombobox
                label="Secondary HR"
                placeholder="Select HR"
                value={formData.subordinate?.displayName || ""}
                onUserSelect={(user) => {
                  if (user) {
                    handleSubordinateChange({
                      id: user.id,
                      displayName: user.displayName,
                      email: user.email,
                    });
                  } else {
                    handleSubordinateChange(null);
                  }
                }}
                required={false}
                icon={<PersonStar20Regular />}
                department={formData.departmentId}
                formData={formData}
                currentUser={currentUser}
                userId={interviewerHRDetails} // Pass the specific user ID
                disabled={isFormDisabled()}
              />

            </div>




          </div>
        </Card>

        {/* Experience & Salary Requirements */}
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0 !gap-0">
          <div className="flex gap-2 p-4 bg-[#E9F3FF] border-b-2 border-b-[#E5E7EB]">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0C59A4] text-white rounded-full">
              <Money20Regular />
            </div>
            <div className="flex flex-col">
              <Subtitle2 className="text-gray-900">
                Experience & Compensation
              </Subtitle2>
              <Caption1 className="text-gray-500">
                Required experience and salary range for the position
              </Caption1>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field
                orientation="vertical"
                label={
                  <>
                    <People20Regular /> Number of Positions
                  </>
                }
                validationState={getValidationState("numPositions")}
                validationMessage={errors.numPositions}
                required
              >
                <SpinButton
                  value={formData.numPositions}
                  disabled
                  onChange={(e, data) => {
                    if (data.value !== undefined && data.value !== null) {
                      handleSliderChange("numPositions", data.value);
                    }
                  }}
                  min={1}
                  step={1}
                // disabled={isFormDisabled()}
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field
                  orientation="vertical"
                  label={
                    <>
                      <PersonStar20Regular /> Min Experience (Years)
                    </>
                  }
                  validationState={getValidationState("minWorkExperience")}
                  validationMessage={errors.minWorkExperience}
                  required
                >
                  <Input
                    type="number"
                    value={formData.minWorkExperience?.toString() || ""}
                    onChange={(e, data) => {
                      const numValue = parseFloat(data.value);
                      if (!isNaN(numValue) && numValue >= 0) {
                        handleSliderChange("minWorkExperience", numValue);
                      } else if (data.value === "") {
                        handleSliderChange("minWorkExperience", 0);
                      }
                    }}
                    min={0}
                    step={0.5}
                    disabled={isFormDisabled()}
                  />
                </Field>

                <Field
                  orientation="vertical"
                  label={
                    <>
                      <PersonStar20Regular /> Max Experience (Years)
                    </>
                  }
                  validationState={getValidationState("maxWorkExperience")}
                  validationMessage={errors.maxWorkExperience}
                  required
                >
                  <Input
                    type="number"
                    value={formData.maxWorkExperience?.toString() || ""}
                    onChange={(e, data) => {
                      const numValue = parseFloat(data.value);
                      if (!isNaN(numValue) && numValue >= 1) {
                        handleSliderChange("maxWorkExperience", numValue);
                      } else if (data.value === "") {
                        handleSliderChange("maxWorkExperience", 1);
                      }
                    }}
                    min={1}
                    step={0.5}
                    disabled={isFormDisabled()}
                  />
                </Field>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field
                  orientation="vertical"
                  label={
                    <>
                      <Money20Regular /> Min Salary Range (LPA)
                    </>
                  }
                  validationState={getValidationState("MinSalaryRange")}
                  validationMessage={errors.MinSalaryRange}
                  required
                >
                  <Input
                    type="number"
                    value={formData.MinSalaryRange?.toString() || ""}
                    onChange={(e, data) => {
                      const numValue = parseFloat(data.value);
                      if (!isNaN(numValue) && numValue >= 1) {
                        handleSliderChange("MinSalaryRange", numValue);
                      } else if (data.value === "") {
                        handleSliderChange("MinSalaryRange", 1);
                      }
                    }}
                    min={1}
                    step={0.5}
                    disabled={isFormDisabled()}
                  />
                </Field>
                <Field
                  orientation="vertical"
                  label={
                    <>
                      <Money20Regular /> Max Salary Range (LPA)
                    </>
                  }
                  validationState={getValidationState("MaxSalaryRange")}
                  validationMessage={errors.MaxSalaryRange}
                  required
                >
                  <Input
                    type="number"
                    value={formData.MaxSalaryRange?.toString() || ""}
                    onChange={(e, data) => {
                      const numValue = parseFloat(data.value);
                      if (!isNaN(numValue) && numValue >= 1) {
                        handleSliderChange("MaxSalaryRange", numValue);
                      } else if (data.value === "") {
                        handleSliderChange("MaxSalaryRange", 1);
                      }
                    }}
                    min={1}
                    step={0.5}
                    disabled={isFormDisabled()}
                  />
                </Field>
              </div>
              <div></div>
            </div>
          </div>
        </Card>

        {/* Skills & Competencies */}
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0 !gap-0">
          <div className="flex gap-2 p-4 bg-[#E9F3FF] border-b-2 border-b-[#E5E7EB]">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0C59A4] text-white rounded-full">
              <Star20Regular />
            </div>
            <div className="flex flex-col">
              <Subtitle2 className="text-gray-900">
                Required Competencies
              </Subtitle2>
              <Caption1 className="text-gray-500">
                Add at least 3 skills with proficiency ratings
              </Caption1>
            </div>
          </div>
          <div className="p-4">
            {errors.skills && (
              <MessageBar
                icon={null}
                shape="rounded"
                className="!bg-red-100/30 !mb-4 !p-3 !rounded-xl !border-1 !border-red-200"
              >
                <MessageBarBody className="flex flex-row gap-2">
                  <Alert20Regular className="!text-red-800" />
                  <div className="flex flex-col gap-1">
                    <MessageBarTitle className="!text-red-800 !text-sm">
                      {errors.skills}
                    </MessageBarTitle>
                  </div>
                </MessageBarBody>
              </MessageBar>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex flex-col lg:flex-row gap-4 items-start justify-between w-full">
                <Input
                  placeholder="Skill Name"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  className="w-full lg:w-[49%]"
                  // disabled={isFormDisabled()}
                />
                <div className="flex items-center w-full lg:w-[49%] gap-2">
                  <Rating
                    color="marigold"
                    max={5}
                    value={newRating}
                    onChange={handleNewRatingChange}
                    // aria-disabled={isFormDisabled()}
                  />
                  <span className="ml-2">{newRating}/5</span>
                </div>
              </div>

              <Button
                size="small"
                className={`${isFormDisabled() ? "!text-gray-400" : "!text-[#2563EB]"} !font-semibold w-fit`}
                appearance="subtle"
                icon={<Add20Regular />}
                onClick={addSkill}
                // disabled={isFormDisabled()}
              >
                Add New Skill
              </Button>

              {formData.skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center w-full bg-[#F9FAFB] border-[#E5E7EB] border rounded-lg px-2 py-1"
                >
                  <span className="font-semibold">{skill.name}</span>
                  <div className="flex gap-3 items-center">
                    <Rating
                      color="marigold"
                      value={skill.rating}
                      onChange={(e: any, data) => handleSkillRatingChange(index, e, data)}
                    />
                    <span className="ml-2">{skill.rating}/5</span>
                    <Tooltip content="Remove Skill" relationship="label">
                      <Button
                        icon={<Delete20Regular />}
                        appearance="subtle"
                        className="!bg-transparent !text-[#DC2626]"
                        onClick={() => removeSkill(index)}
                      />
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Job Description */}
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0 !gap-0">
          <div className="flex gap-2 p-4 bg-[#E9F3FF] border-b-2 border-b-[#E5E7EB]">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0C59A4] text-white rounded-full">
              <DocumentText20Regular />
            </div>
            <div className="flex flex-col">
              <Subtitle2 className="text-gray-900">Requisition Details</Subtitle2>
              <Caption1 className="text-gray-500">
                Detailed description of the role and responsibilities
              </Caption1>
            </div>
          </div>
          <div className="p-4">
            {!isJobDescriptionEnabled && (
              <MessageBar
                icon={null}
                shape="rounded"
                className="!bg-yellow-100/30 !mb-4 !p-3 !rounded-xl !border-1 !border-yellow-200"
              >
                <MessageBarBody className="flex flex-row gap-2">
                  <Info20Regular className="!text-yellow-800" />
                  <div className="flex flex-col gap-1">
                    <MessageBarTitle className="!text-yellow-800 !text-sm">
                      Complete required fields above to enable job description
                    </MessageBarTitle>
                    <Text className="!text-yellow-700 !text-xs">
                      Fill in job posting, nature, department, target date,
                      location, and at least 3 skills
                    </Text>
                  </div>
                </MessageBarBody>
              </MessageBar>
            )}

            <Field
              orientation="vertical"
              // label="Job Description"
              validationState={getValidationState("jobDescription")}
              validationMessage={errors.jobDescription}
              required
            >
              <AdvancedEditor
                value={formData.jobDescription}
                onChange={handleEditorChange}
                placeholder="Write your Job Description here..."
                generateDescription={handleGenerateClick}
                loading={loading}
                formdata={formData}
                disabled={false}
                onUpdateJD={handleUpdateJD} isOtherSelected={false} />
            </Field>

            <AIGenerateDialog
              isOpen={isAIDialogOpen}
              onOpenChange={setIsAIDialogOpen}
              content={tempGeneratedContent}
              isLoading={loading}
              onRegenerate={async () => {
                await generateDescription();
              }}
              onUseContent={handleUseGeneratedContent}
            />
          </div>
        </Card>

        {/* Job Status Control */}
        <Card className="shadow-lg !rounded-xl border-0 overflow-hidden bg-white !p-0 !gap-0">
          <div className="flex gap-2 p-4 bg-[#E9F3FF] border-b-2 border-b-[#E5E7EB]">
            <div className="flex h-10 w-10 items-center justify-center bg-[#0C59A4] text-white rounded-full">
              <Settings20Regular />
            </div>
            <div className="flex flex-col">
              <Subtitle2 className="text-gray-900">
                Job Status & Actions
              </Subtitle2>
              <Caption1 className="text-gray-500">
                Control the visibility and status of this job request
              </Caption1>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <Field label="Status" required>
              <RadioGroup
                value={
                  isPublished ? "published" : isActive ? "active" : "inactive"
                }
                onChange={(_, data) => {
                  const value = data.value;

                  if (value === "active") {

                    setIsActive(true);
                    setIsPublished(false);
                    setShouldUpdateForm(true);
                  } else if (value === "inactive") {

                    setIsActive(false);
                    setIsPublished(false);
                    setShouldUpdateForm(true);
                  } else if (value === "published") {
                    setIsActive(true);
                    setIsPublished(true);
                    setShouldUpdateForm(true);
                  }
                }}
                layout="horizontal"
                disabled={!canEditOrDelete()}
              >
                <Radio value="active" label="Active" />
                <Radio value="inactive" label="Inactive" />
                <Radio value="published" label="Published" />
              </RadioGroup>
            </Field>

            {!isActive && (
              <Field
                label="Reason for Inactive Status"
                validationState={
                  validateInActiveReason(isActive, inActiveReason)
                    ? "error"
                    : "none"
                }
                validationMessage={validateInActiveReason(
                  isActive,
                  inActiveReason
                )}
                required
              >
                <Input
                  value={inActiveReason}
                  onChange={(e) => setInActiveReason(e.target.value)}
                  placeholder="Please provide a detailed reason for marking this JD request as inactive..."
                  className="w-full"
                  disabled={!canEditOrDelete()}
                />
              </Field>
            )}

            {isActive && !isPublished && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Info20Regular className="text-blue-600" />
                  <span className="text-sm text-blue-800 !text-center">
                    This job request is active but not yet published. Select
                    "Published" to make it available.
                  </span>
                </div>
              </div>
            )}

            {isActive && isPublished && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Info20Regular className="text-green-600" />
                  <span className="text-sm text-green-800">
                    {shouldUpdateForm
                      ? "This job request will be published and available for applications"
                      : "This job request is published and available for applications"}
                  </span>
                </div>
              </div>
            )}

            {!isActive && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2">
                  <Alert20Regular className="text-yellow-600" />
                  <span className="text-sm text-yellow-800">
                    This job request is inactive and not accepting applications.
                    It can be deleted if needed.
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between bg-white w-full items-center p-4 sticky bottom-0">
          <div>
            <Button
              appearance="subtle"
              onClick={() => window.history.back()}
              disabled={isProcessing}
              icon={<ArrowExportRtlRegular />}
              type="button"
            >
              Back
            </Button>
          </div>
          <CardFooter>
            <div className="flex justify-end gap-2">
              {/* Show delete button only if user has delete permission and JD is inactive */}
              {canDeleteJob && (
                <Button
                  appearance="secondary"
                  onClick={handleDeleteConfirm}
                  className="!rounded-3xl"
                  disabled={isProcessing}
                  icon={<DeleteRegular />}
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              )}

              {/* Show update button only if user has edit permission */}
              {canEditJob && (
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={
                    isProcessing
                  }
                  onClick={handleUpdate}
                  className="!bg-gradient-to-r !from-[#0153A5] !to-[#2FC2FE] !text-white !rounded-3xl !border-0"
                >
                  {isUpdating ? "Updating..." : "Update JD"}
                </Button>
              )}
            </div>
          </CardFooter>
        </div>
      </div>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(event, data) => setShowDeleteDialog(data.open)}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogContent>
              <div className="space-y-4">
                <Text>
                  Are you sure you want to delete this JD request for{" "}
                  <strong>{formData.jobRole || "this position"}</strong>?
                </Text>
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <Text className="text-red-800 text-sm">
                    This action will permanently delete the JD request. This
                    action cannot be undone.
                  </Text>
                </div>
                {inActiveReason && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <Text className="text-yellow-800 text-sm font-semibold">
                      Inactive Reason:
                    </Text>
                    <Text className="text-yellow-800 text-sm mt-1">
                      {inActiveReason}
                    </Text>
                  </div>
                )}
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleDelete}
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
  );
}
