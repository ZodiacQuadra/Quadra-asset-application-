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
  Combobox,
  ComboboxProps,
  Persona,
  Card,
  Subtitle2,
  Caption1,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text,
  CardFooter,
  Body1Strong,
} from "@fluentui/react-components";
import {
  Delete20Regular,
  Add20Regular,
  Alert20Regular,
  Briefcase20Regular,
  Building20Regular,
  Location20Regular,
  People20Regular,
  CalendarLtr20Regular,
  Money20Regular,
  DocumentText20Regular,
  Star20Regular,
  Info20Regular,
  ArrowExportRtlRegular,
  PersonStar20Regular,
  Person20Regular,
  LockClosed20Regular,
} from "@fluentui/react-icons";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import AdvancedEditor from "../Components/AdvancedEditor";
import axios from "axios";
import AIGenerateDialog from "../Components/AIGenerateDialog";
import {
  searchUsersWithDetails,
  UserDetails,
} from "../../Services/Offboarding";
import {
  createSuggestions,
  getAllJobPostings,
} from "../../Services/JobPosting";
import {
  createHiringPipeline,
  createJDRequest,
  getUserDetailforJd,
  getHRDepartmentUsers,
  searchUsersWithDepartmentId,
  sendCreatedJDNotification,
  sendSuggestNewJDNotification,
  searchUsersByDepartment,
} from "../../Services/JDRequests";
import { useAuth } from "../../Auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { getActiveJobPrompt } from "../../Services/JobPrompt";
import { getCombinedLocations } from "../../Services/Location";
import { getCombinedDepartments } from "../../Services/Department";

// =============================================
// INTERFACES
// =============================================

interface JobPosting {
  id: string;
  title: string;
  description: string;
  department?: string;
  status: string;
  skills: string[];
  jobCode: string;
  additionalResponsibilities: string[];
  interviewerUserId?: string;
}

interface LocationOption {
  Name: string;
  Code: string;
}

interface DepartmentOption {
  Id: string
  Name: string;
  Code: string;
}

interface FormData {
  jobId: string;
  jobRole: string;
  jobNature: string;
  jobCode: string;
  jobLevel: number;
  department: string;
  departmentCode: string;
  targetDate: Date | null | undefined;
  quarter: number;
  numPositions: number;
  minWorkExperience: number;
  maxWorkExperience: number;
  MinSalaryRange: number;
  MaxSalaryRange: number;
  jobLocation: string;
  locationCode: string;
  skills: Array<{ name: string; rating: number }>;
  jobDescription: string;
  reportingManager?: Person | null;
  departmentId: string;
  interviewer?: Person | null;
  subordinate?: Person | null;
  designation: string
}

interface FormErrors {
  jobRole: string;
  jobNature: string;
  department: string;
  designation: string
  targetDate: string;
  numPositions: string;
  internalTeam: string;
  minWorkExperience: string;
  maxWorkExperience: string;
  MinSalaryRange: string;
  MaxSalaryRange: string;
  jobLocation: string;
  skills: string;
  jobDescription: string;
  reportingManager: string;
  interviewer: string;
}

interface GeneratedDescription {
  content: string;
}

interface Person {
  id: string;
  displayName: string;
  email: string;
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
  const [filteredOptions, setFilteredOptions] = useState<string[]>(options);

  // Filter options based on query
  useEffect(() => {
    if (!query.trim()) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(opt =>
        opt.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [query, options]);

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

  // Create a unique ID for the component to use in keys
  const componentId = useId("filter-combobox");

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
        autoComplete="off"
      >
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option, index) => (
            <Option
              key={`${componentId}-${option}-${index}`} // Unique key
              text={option}
              value={option}
            >
              {option}
            </Option>
          ))
        ) : (
          <Option key={`${componentId}-no-results`} disabled text="No options found">
            No options found
          </Option>
        )}
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
  userId?: string; // Add this for direct user lookup
  handleDisableField?: () => void
  handleEnableField?: () => void
}

// =============================================
// UPDATED USER COMBOBOX - Uses Backend API
// =============================================

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
  department,
  formData,
  currentUser,
}) => {
  const [query, setQuery] = useState<string>("");
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { accessToken }: any = useAuth();
  const componentId = useId("user-combobox");

  // Clear reporting manager when department changes
  useEffect(() => {
    if (department !== formData.department) {
      setQuery("");
      setUsers([]);
      setError("");
      onUserSelect(null);
    }
  }, [department]);

  // Load department users when combobox opens
  const loadDepartmentUsers = async () => {
    if (!department || !accessToken) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Use backend API endpoint
      const departmentUsers = await searchUsersByDepartment(
        query, // Empty query to get all users
        accessToken,
        department
      );

      setUsers(departmentUsers);

      // Auto-select current user if they're in the department and no manager is set
      if (currentUser && !formData.reportingManager && departmentUsers.length > 0) {
        const currentUserInDept = departmentUsers.find(
          (user) => user.id === currentUser.userID
        );
        if (currentUserInDept) {
          onUserSelect(currentUserInDept);
          setQuery(currentUserInDept.displayName);
        }
      }
    } catch (error: any) {
      console.error("Error loading department users:", error);
      setError("Failed to load users. Please try again.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Search users with department filter
  useEffect(() => {
    const searchUsers = async () => {
      if (!department) {
        setUsers([]);
        setError("");
        return;
      }

      // If no query, load all department users when opened
      if (!query || query.length < 2) {
        if (isOpen && !query) {
          loadDepartmentUsers();
        }
        return;
      }

      setLoading(true);
      setError("");

      try {
        const results = await searchUsersByDepartment(
          query,
          accessToken,
          department
        );
        setUsers(results);

        if (results.length === 0 && query.length >= 2) {
          setError(`No users found matching "${query}" in ${department}`);
        }
      } catch (error: any) {
        console.error("Error searching users:", error);
        setError("Search failed. Please try again.");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query, department, accessToken, isOpen]);

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
      setIsOpen(true);
    }
  };

  const handleOpenChange = (e: any, data: any) => {
    setIsOpen(data.open);
    if (data.open && !query) {
      loadDepartmentUsers();
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Option key={`${componentId}-loading`} text="Loading..." disabled>
          <div className="flex items-center gap-2">
            <Spinner size="tiny" />
            Loading users from {department}...
          </div>
        </Option>
      );
    }

    if (!department) {
      return (
        <Option key={`${componentId}-no-dept`} text="Select department first" disabled>
          <div className="flex flex-col">
            <Text>Please select a department first</Text>
            <Caption1 className="text-gray-500">
              Users will be filtered by department
            </Caption1>
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
              Try adjusting your search or contact support
            </Caption1>
          </div>
        </Option>
      );
    }

    if (users.length === 0 && query.length >= 2) {
      return (
        <Option
          key={`${componentId}-no-results`}
          text={`No users found in ${department}`}
          disabled
        >
          <div className="flex flex-col">
            <Text>No users found matching "{query}"</Text>
            <Caption1 className="text-gray-500">
              in {department} department
            </Caption1>
          </div>
        </Option>
      );
    }

    if (users.length === 0) {
      return (
        <Option
          key={`${componentId}-empty`}
          text="Type to search or open to see all"
          disabled
        >
          <div className="flex flex-col">
            <Text>Open dropdown to see all users</Text>
            <Caption1 className="text-blue-500 mt-1">
              Or type to search in {department} department
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
            avatar={{ color: "colorful", "aria-hidden": true }}
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
      label={<>
        <Person20Regular /> {label}</>
      }
      required={required}
      className="flex-1 w-full"
      validationState={validationState}
      validationMessage={validationMessage}
    >
      <Combobox
        className="w-full min-w-[100px]"
        onOptionSelect={onOptionSelect}
        placeholder={
          !department
            ? "Select department first"
            : `Search or select user from ${department}...`
        }
        onChange={handleInputChange}
        value={query}
        disabled={disabled || !department}
        open={isOpen}
        onOpenChange={handleOpenChange}
      >
        {renderContent()}
      </Combobox>
    </Field>
  );
};

// =============================================
// MAIN FORM COMPONENT
// =============================================
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
        setError(`No users found matching "${query}" in TAG department`);
      } else {
        setError("");
      }
    }
  }, [query, allTagUsers]);

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
                in TAG department
              </Caption1>
            </div>
          </Option>
          <Option
            key={`${componentId}-clear-search`}
            text="Clear search and show all TAG users"
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
          placeholder={placeholder}
          onChange={handleInputChange}
          value={query}
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
        setError(`No users found matching "${query}" in ${import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"} department`);
      } else {
        setError("");
      }
    }
  }, [query, allTAGUsers]);

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
          <Option key={`${componentId}-no-results`} text="No matching TAG users found" disabled>
            <div className="flex flex-col">
              <Text>No users found matching "{query}"</Text>
              <Caption1 className="text-gray-500">
                in TAG department
              </Caption1>
            </div>
          </Option>
          <Option
            key={`${componentId}-clear-search`}
            text="Clear search and show all TAG users"
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
          disabled={disabled}
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
          />
        )}
      </div>
    </Field>
  );
};

export default function NewJDForm() {
  const navigate = useNavigate();
  const { currentUser, accessToken, refreshToken }: any = useAuth();

  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  const jobNatureOptions = [
    "Full-time",
    "Part-time",
    "Contract",
    "Freelance",
    "Internship",
    "Remote",
    "Hybrid",
  ];

  const [formData, setFormData] = useState<FormData>({
    jobRole: "",
    jobNature: jobNatureOptions[0],
    jobId: "",
    jobLevel: 1,
    jobCode: "",
    department: "",
    departmentCode: "",
    designation: "",
    // internalTeam:"",
    targetDate: null,
    quarter: 1,
    numPositions: 1,
    minWorkExperience: 0,
    maxWorkExperience: 1,
    MinSalaryRange: 1,
    MaxSalaryRange: 2,
    jobLocation: "",
    locationCode: "",
    skills: [],
    jobDescription: "",
    reportingManager: null,
    departmentId: "",
    interviewer: null,
    subordinate: null
  });

  const [errors, setErrors] = useState<FormErrors>({
    jobRole: "",
    jobNature: "",
    department: "",
    designation: "",
    internalTeam: "",
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
    interviewer: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newRating, setNewRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tempGeneratedContent, setTempGeneratedContent] = useState("");
  const [
    generatedContent,
    setGeneratedContent,
  ] = useState<GeneratedDescription | null>(null);

  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [isLoadingJobPostings, setIsLoadingJobPostings] = useState(true);

  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<
    DepartmentOption[]
  >([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(true);

  const [currentTone, setCurrentTone] = useState("");
  const [isOtherSelected, setIsOtherSelected] = useState(false)
  const [NewJobRoleName, setNewJobRole] = useState("")
  const [disableInterviewer, setDisableInterviewer] = useState(false)

  const [shouldAutoUpdateDescription, setShouldAutoUpdateDescription] = useState(false)
  const skillsUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousSkillsLengthRef = useRef<number>(0);
  const previousSkillsRef = useRef<string>("");

  const handleDisableField = () => {
    setDisableInterviewer(true)
  }

  const handleEnableField = () => {
    setDisableInterviewer(false)
  }
  // Add this useEffect to handle auto-update when skills change
  useEffect(() => {
    // Create a string representation of current skills for comparison
    const currentSkillsString = JSON.stringify(formData.skills);

    // Only auto-update if:
    // 1. Auto-update is enabled
    // 2. Job description is enabled and exists
    // 3. Skills have actually changed (not just initial load)
    // 4. We have at least 7 skills (your minimum requirement)

    const skillsHaveChanged = previousSkillsRef.current !== "" &&
      previousSkillsRef.current !== currentSkillsString;

    if (
      shouldAutoUpdateDescription &&
      formData.jobDescription &&
      formData.jobDescription.trim().length > 50 &&
      formData.skills.length >= 7 &&
      skillsHaveChanged
    ) {
      // Clear any existing timeout
      if (skillsUpdateTimeoutRef.current) {
        clearTimeout(skillsUpdateTimeoutRef.current);
      }

      // Set a debounced update (wait 2 seconds after last skill change)
      skillsUpdateTimeoutRef.current = setTimeout(async () => {
        await updateDescriptionWithSkills();
      }, 2000);
    }

    // Update the previous skills reference
    previousSkillsRef.current = currentSkillsString;

    // Cleanup timeout on unmount
    return () => {
      if (skillsUpdateTimeoutRef.current) {
        clearTimeout(skillsUpdateTimeoutRef.current);
      }
    };
  }, [formData.skills, shouldAutoUpdateDescription, formData.jobDescription]);

  // Add this function to update description with current skills
  const updateDescriptionWithSkills = async (): Promise<void> => {
    if (!isJobDescriptionEnabled || !formData.jobDescription) {
      return;
    }

    dispatchToast(
      <Toast>
        <ToastTitle>Updating job description with new skills...</ToastTitle>
      </Toast>,
      { intent: "info" }
    );

    setLoading(true);

    try {
      let postData = { ...formData };
      if (isOtherSelected) {
        postData.jobRole = NewJobRoleName;
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/openai/update-description-skills`,
        {
          jobRole: postData.jobRole,
          jobNature: postData.jobNature,
          department: postData.department,
          jobLocation: postData.jobLocation,
          skills: postData.skills,
          currentDescription: postData.jobDescription,
          minWorkExperience: postData.minWorkExperience,
          maxWorkExperience: postData.maxWorkExperience,
          MinSalaryRange: postData.MinSalaryRange,
          MaxSalaryRange: postData.MaxSalaryRange,
          numPositions: postData.numPositions,
          prompt: currentTone,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 30000,
        }
      );

      if (res.data.success && res.data.output?.content) {
        // ✅ Convert markdown to HTML before setting in editor
        const htmlContent = convertMarkdownToHtml(res.data.output.content);

        setFormData((prev) => ({
          ...prev,
          jobDescription: htmlContent,  // <-- was: res.data.output.content
        }));

        dispatchToast(
          <Toast>
            <ToastTitle>Job description updated with new skills!</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      console.error("Error updating description with skills:", err);
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to auto-update job description. You can manually regenerate.</ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
    } finally {
      setLoading(false);
    }
  };

  const jobLevels = [
    1, 2, 3, 4, 5
  ]

  const DefaultSkills = [
    {
      name: "Good Communication",
      rating: 3
    },
    {
      name: "Team Work",
      rating: 3
    }
  ]

  // const quarter = [1,2,3,4]

  const isJobDescriptionEnabled = React.useMemo(() => {
    return (
      ((isOtherSelected && NewJobRoleName) || (formData.jobRole && isOtherSelected === false)) &&
      formData.jobNature &&
      formData.department &&
      formData.targetDate &&
      formData.jobLocation &&
      formData.skills.length > 0
    );
  }, [
    NewJobRoleName,
    formData.jobRole,
    formData.jobNature,
    formData.department,
    formData.targetDate,
    formData.jobLocation,
    formData.skills.length,
  ]);

  // Add this useEffect to pre-fetch interviewer when job posting has interviewerUserId
  // Add this useEffect to pre-fetch interviewer when job posting has interviewerUserId
  useEffect(() => {
    const fetchInterviewerForSelectedJob = async () => {
      if (formData.jobId && !formData.interviewer) {
        const selectedJob = jobPostings.find(posting => posting.id === formData.jobId);
        if (selectedJob?.interviewerUserId && accessToken) {
          try {
            const interviewerUsers = await searchUsersWithDetails(
              "",
              accessToken,
              // undefined,
              // selectedJob.interviewerUserId
            );

            if (interviewerUsers && interviewerUsers.length > 0) {
              const interviewer = interviewerUsers[0];
              handleInterviewerChange({
                id: interviewer.id,
                displayName: interviewer.displayName,
                email: interviewer.email,
              });
            }
          } catch (error) {
            console.error("Error pre-fetching interviewer:", error);
          }
        }
      }
    };

    fetchInterviewerForSelectedJob();
  }, [formData.jobId, jobPostings, accessToken]);

  // =============================================
  // DATA LOADING EFFECTS
  // =============================================

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
            (res: any) => res.data.Prompt
          );
          if (storedTone) {
            setCurrentTone(storedTone);
          }
        }
      } catch (err) {
        console.error("Error loading tone:", err);
      }
    };

    loadJobPostings();
    loadLocationData();
    loadDepartmentData();
    loadTone();
  }, [accessToken, currentTone, dispatchToast]);

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      reportingManager: {
        id: currentUser.userID,
        displayName: currentUser.displayName,
        email: currentUser.email,
      },
    }));
  }, [currentUser]);

  // =============================================
  // FORM HANDLERS
  // =============================================
  const [interviewerHRDetails, setInterviewerHRDetails] = useState<any>([]);

  const populateJobRoleData = async (selectedJobRole: string) => {
    const selectedJobPosting = jobPostings.find(
      (posting) => posting.title === selectedJobRole
    );

    if (selectedJobPosting) {
      const skillsWithRating = selectedJobPosting.skills.map((skill) => ({
        name: skill,
        rating: 3,
      }));

      // Get department code if department exists in options
      let departmentCode = "";
      let departmentId = "";
      if (selectedJobPosting.department) {
        const deptOption = departmentOptions.find(
          (opt) => opt.Name === selectedJobPosting.department
        );
        departmentCode = deptOption ? deptOption.Code : "";
        departmentId = deptOption ? deptOption.Id : "";
      }

      // Auto-fill designation with the selected job role
      const baseFormDataUpdate = {
        jobRole: selectedJobRole,
        designation: selectedJobRole, // Auto-fill designation with job role
        jobId: selectedJobPosting.id,
        department: selectedJobPosting.department || "",
        departmentCode: departmentCode,
        skills: skillsWithRating,
        jobDescription: convertMarkdownToHtml(selectedJobPosting.description),
        jobCode: selectedJobPosting.jobCode,
        departmentId: departmentId,
        interviewer: null, // Initialize as null
      };

      // Set the base form data immediately
      setFormData((prevData) => ({
        ...prevData,
        ...baseFormDataUpdate,
      }));

      // Clear errors
      setErrors((prevErrors) => ({
        ...prevErrors,
        jobRole: "",
        designation: "", // Clear designation error as well
        department: "",
        skills: "",
        jobDescription: "",
        interviewer: "",
      }));

      // Check if we have interviewerUserId
      if (selectedJobPosting.interviewerUserId) {
        try {
          // Fetch interviewer details using getUserDetailforJd
          const response = await getUserDetailforJd(
            selectedJobPosting.interviewerUserId,
            accessToken
          );
          // console.log('user fetch', response);
          setInterviewerHRDetails(response.data.id);

          // Directly update formData with interviewer
          if (response && response.success && response.data) {
            const userdata = response.data;
            const interviewerPerson: Person = {
              id: userdata.id || userdata.userID || selectedJobPosting.interviewerUserId,
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

      // Enable auto-update for description when skills change
      setShouldAutoUpdateDescription(true);

      dispatchToast(
        <Toast>
          <ToastTitle>Job data populated successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    }
  };

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

  const handleDesignationChange = (value: string) => {
    setFormData((prevData) => ({
      ...prevData,
      ["designation"]: value
    }))
  }

  const handleSubordinateChange = (person: Person | null) => {
    // console.log("Setting interviewer to:", person);

    setFormData(prev => ({
      ...prev,
      subordinate: person,
    }));

    const errorMessage = validateField("interviewer", person);
    setErrors((prev) => ({
      ...prev,
      subordinateUser: errorMessage,
    }));
  };

  const handleJobRoleChange = (value: string) => {
    if (value !== "other") {
      setFormData((prevData) => ({
        ...prevData,
        jobRole: value,
      }));
      setIsOtherSelected(false);
      setNewJobRole("");
    } else {
      setIsOtherSelected(true);
      // Clear designation when "other" is selected
      setFormData((prevData) => ({
        ...prevData,
        designation: "",
      }));
    }

    setErrors((prev) => ({
      ...prev,
      jobRole: "",
      jobDescription: "",
    }));

    if (value) {
      if (value !== "other") {
        populateJobRoleData(value);
      } else {
        setFormData((prevData) => ({
          ...prevData,
          skills: [...DefaultSkills],
          designation: "", // Ensure designation is cleared
        }));
      }
    } else {
      // Clear all related fields when no job role is selected
      setFormData((prevData) => ({
        ...prevData,
        department: "",
        designation: "", // Clear designation
        skills: [],
        jobDescription: "",
      }));
    }
  };

  const generateCode = (title: string) => {
    title.toLowerCase();
    const splitted = title.split(/[\s\-_.,;:!?()&[\]{}'"\/\\|]+/).filter(Boolean);
    const code = splitted.map((word) => word.charAt(0).toUpperCase()).join("");
    return code;
  }

  const handleNewJobRoleChange = (value: string) => {
    if (value.length < 100) {
      setNewJobRole(value);
      const generatedJDCode = generateCode(value);
      setFormData((prevData) => ({
        ...prevData,
        jobCode: generatedJDCode,
        designation: value, // Auto-fill designation with new job role
      }));
    }
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

    // Clear reporting manager when department changes
    setFormData({
      ...formData,
      department: selectedName,
      departmentCode: selectedOption ? selectedOption.Code : "",
      reportingManager: null, // Clear reporting manager
      departmentId: selectedOption?.Id ?? ""
    });

    const errorMessage = validateField("department", selectedName);
    setErrors((prev) => ({
      ...prev,
      department: errorMessage,
      reportingManager: "", // Clear reporting manager error
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
      if (minValue < 1) {
        minError = "Minimum salary must be at least 1 LPA";
      } else if (maxValue && minValue >= maxValue) {
        minError = "Minimum salary cannot be greater than or equal to the maximum salary";
      }

      let maxError = "";
      if (maxValue < 1) {
        maxError = "Maximum salary must be at least 1 LPA";
      } else if (minValue && maxValue <= minValue) {
        maxError =
          "Maximum salary cannot be less than or equal to minimum salary";
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
      if (minValue < 0) {
        minError = "Minimum work experience cannot be negative";
      } else if (maxValue && minValue >= maxValue) {
        minError =
          "The minimum work experience cannot be greater than or equal to the maximum work experience.";
      }

      let maxError = "";
      if (maxValue < 0) {
        maxError = "Maximum work experience cannot be negative";
      } else if (minValue && maxValue <= minValue) {
        maxError =
          "The maximum work experience cannot be less than or equal to the minimum work experience.";
      } else if (maxValue === 0) {
        maxError = "Maximum work experience must be at least 1 years";
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

  const handleTextFieldChange = (field: keyof FormData, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
    const errorMessage = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: errorMessage,
    }));
  }

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

  const handleReportingManagerChange = (person: Person | null) => {
    setFormData({
      ...formData,
      reportingManager: person,
    });

    const errorMessage = validateField("reportingManager", person);
    setErrors((prev) => ({
      ...prev,
      reportingManager: errorMessage,
    }));
  };

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
        setErrors((prev) => ({
          ...prev, skills: "Skill already exists",
        }));
        return;
      }
      const updatedSkills = [
        ...formData.skills,
        { name: newSkill, rating: newRating },
      ];
      setFormData({
        ...formData,
        skills: updatedSkills,
      });
      setNewSkill("");
      setNewRating(0);

      const errorMessage = validateField("skills", updatedSkills);
      setErrors((prev) => ({
        ...prev,
        skills: errorMessage,
      }));

      // Enable auto-update if there's already a description
      if (formData.jobDescription && formData.jobDescription.trim().length > 50) {
        setShouldAutoUpdateDescription(true);
      }
    } else {
      setErrors((prev) => ({
        ...prev,
        skills: "Both skill name and rating are required",
      }));
    }
  };


  // Modify the removeSkill function similarly
  const removeSkill = (index: number) => {
    const updatedSkills = [...formData.skills];
    updatedSkills.splice(index, 1);
    setFormData({
      ...formData,
      skills: updatedSkills,
    });

    const errorMessage = validateField("skills", updatedSkills);
    setErrors((prev) => ({
      ...prev,
      skills: errorMessage,
    }));

    // Enable auto-update if there's already a description
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

    const errorMessage = validateField("skills", updatedSkills);
    setErrors((prev) => ({
      ...prev,
      skills: errorMessage,
    }));
  };

  // =============================================
  // VALIDATION FUNCTIONS
  // =============================================

  const validateField = (field: keyof FormData, value: any): string => {
    let error = "";

    // console.log("validation", (isOtherSelected && !NewJobRoleName) || !value)
    switch (field) {
      // FIXED
      case "jobRole":
        if (!isOtherSelected && !value) {
          error = "Please select a Position Title from the options, or choose 'Other'";
        }
        if (isOtherSelected && !NewJobRoleName) {
          error = "Please enter a new job posting name";
        }
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
        if (!value) {
          error = "Nature of job is required";
        }
        break;

      case "department":
        if (!value) {
          error = "Department is required";
        }
        break;

      case "interviewer":
        if (!value) {
          error = "Primary HR is required"
        }
        break;

      case "targetDate":
        if (!value) {
          error = "Target date is required";
        } else {
          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);

          const selectedDate = value instanceof Date ? value : new Date(value);
          selectedDate.setHours(0, 0, 0, 0);

          if (selectedDate < currentDate) {
            error = "Target date cannot be in the past";
          }
        }
        break;

      case "numPositions":
        if (value < 1) {
          error = "At least one position is required";
        }
        break;

      case "minWorkExperience":
        if (value < 0) {
          error = "Minimum work experience must be at least 0 year";
        } else if (
          formData.maxWorkExperience &&
          value > formData.maxWorkExperience
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
          value < formData.minWorkExperience
        ) {
          error =
            "The maximum work experience cannot be less than or equal to the minimum work experience.";
        }
        break;

      case "MinSalaryRange":
        if (value < 1) {
          error = "Minimum salary must be at least 1 LPA";
        } else if (formData.MaxSalaryRange && value > formData.MaxSalaryRange) {
          error = "Minimum salary cannot be greater than or equal to the maximum salary";
        }
        break;

      case "MaxSalaryRange":
        if (value < 1) {
          error = "Maximum salary must be at least 1 LPA";
        } else if (formData.MinSalaryRange && value < formData.MinSalaryRange) {
          error = "Maximum salary cannot be less than minimum salary";
        }
        break;

      case "jobLocation":
        if (!value) {
          error = "Job location is required";
        }
        break;

      case "skills":
        if (!Array.isArray(value) || value.length === 0) {
          error = "At least 7 skills are required";
        } else if (value.length < 7) {
          error = "At least 7 skills are required";
        }
        break;

      case "jobDescription":
        if (!value || value.trim().length < 50) {
          error = "Job description must be at least 50 characters";
        }
        break;

      case "reportingManager":
        if (!value) {
          error = "Reporting manager is required";
        }
        break;

      default:
        break;
    }

    return error;
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      jobRole: "",
      jobNature: "",
      department: "",
      targetDate: "",
      designation: "",
      internalTeam: "",
      numPositions: "",
      minWorkExperience: "",
      maxWorkExperience: "",
      MinSalaryRange: "",
      MaxSalaryRange: "",
      jobLocation: "",
      skills: "",
      jobDescription: "",
      reportingManager: "",
      interviewer: "",
    };

    let isValid = true;
    // for (const field in formData) {
    //   const errorMessage = validateField(
    //     field as keyof FormData,
    //     formData[field as keyof FormData]
    //   );

    //   newErrors[field as keyof FormErrors] = errorMessage;

    //   if (errorMessage) {
    //     isValid = false;
    //   }
    // }


    // ✅ Explicit jobRole check (since isOtherSelected is outside formData)
    if (!isOtherSelected && !formData.jobRole) {
      newErrors.jobRole = "Please select a Position Title from the options, or choose 'Other'";
      isValid = false;
    } else if (isOtherSelected && !NewJobRoleName) {
      newErrors.jobRole = "Please enter a new job posting name";
      isValid = false;
    }

    // ✅ Explicit interviewer check
    if (!formData.interviewer) {
      newErrors.interviewer = "Primary HR is required";
      isValid = false;
    }

    for (const field in formData) {
      // Skip jobRole and interviewer — already handled above
      if (field === "jobRole" || field === "interviewer") continue;

      // Skip jobDescription when Position Title is invalid — the editor is disabled in that state
      // so formData.jobDescription is empty regardless of what the user visually typed
      if (field === "jobDescription" && newErrors.jobRole) continue;

      const errorMessage = validateField(
        field as keyof FormData,
        formData[field as keyof FormData]
      );

      if (errorMessage) {
        newErrors[field as keyof FormErrors] = errorMessage;
        isValid = false;
      }
    }


    setErrors(newErrors);
    return isValid;
  };

  // =============================================
  // AI DESCRIPTION GENERATION
  // =============================================

  const generateDescription = async (): Promise<string> => {
    if (!isJobDescriptionEnabled) {
      dispatchToast(
        <Toast>
          <ToastTitle>
            Please fill all required fields before generating job description
          </ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
      return "";
    }

    setLoading(true);
    try {
      let postData = { ...formData };
      if (isOtherSelected) {
        postData["jobRole"] = NewJobRoleName;
      }

      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/openai/generate-description`,
        { ...postData, prompt: currentTone },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            timeout: 30000,
          },
        }
      );

      const output = res.data.output;
      const { content } = output;

      // Convert markdown to HTML for both preview and final use
      const htmlContent = convertMarkdownToHtml(content);

      setTempGeneratedContent(htmlContent);   // was: content
      setGeneratedContent({ content: htmlContent });  // was: { content }
      setLoading(false);
      return htmlContent;  // was: content
    } catch (err) {
      console.error("Error generating description:", err);
      setTempGeneratedContent("");
      setLoading(false);

      dispatchToast(
        <Toast>
          <ToastTitle>Failed to generate job description</ToastTitle>
        </Toast>,
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
      // Convert markdown to HTML before setting in editor
      const htmlContent = convertMarkdownToHtml(tempGeneratedContent);

      setFormData({
        ...formData,
        jobDescription: htmlContent,  // was: tempGeneratedContent
      });

      const errorMessage = validateField("jobDescription", htmlContent);
      setErrors((prev) => ({
        ...prev,
        jobDescription: errorMessage,
      }));
      setIsAIDialogOpen(false);
      setTempGeneratedContent("");

      dispatchToast(
        <Toast>
          <ToastTitle>Content applied successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    }
  };

  // =============================================
  // FORM SUBMISSION
  // =============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateForm();

    if (isValid) {
      try {
        // if (!formData.reportingManager) {
        //   setErrors((prev) => ({
        //     ...prev,
        //     reportingManager: "Reporting manager is required",
        //   }));
        //   setIsSubmitting(false);
        //   return;
        // }

        if (!formData.targetDate) {
          setErrors((prev) => ({
            ...prev,
            targetDate: "Target date is required",
          }));
          setIsSubmitting(false);
          return;
        }

        // Use current user as reporting manager if not explicitly set
        const reportingManager = formData.reportingManager || {
          id: currentUser.userID,
          displayName: currentUser.displayName,
          email: currentUser.email,
        };

        const jdRequestPayload = {
          jobId: formData.jobId,
          jobRole: formData.jobRole,
          jobNature: formData.jobNature,
          jobCode: formData.jobCode,
          // jobLevel:formData.jobLevel,
          // internalTeam:formData.internalTeam,
          // quarter:formData.quarter,
          department: formData.department,
          departmentCode: formData.departmentCode,
          targetDate: formData.targetDate,
          numPositions: formData.numPositions,
          minWorkExperience: formData.minWorkExperience,
          maxWorkExperience: formData.maxWorkExperience,
          MinSalaryRange: formData.MinSalaryRange,
          MaxSalaryRange: formData.MaxSalaryRange,
          jobLocation: formData.jobLocation,
          locationCode: formData.locationCode,
          skills: formData.skills,
          jobDescription: formData.jobDescription,
          status: "Active",
          createdByUserId: currentUser.userID,
          // reportingManager: formData.reportingManager,
          isOtherSelected,
          newJobRoleName: NewJobRoleName,
          reportingManager: reportingManager,
          departmentId: formData.departmentId,
          interviewer: formData.interviewer,
          subordinate: formData.subordinate,
          designation: formData.designation
        };

        setIsSubmitting(true);


        const JDResponse = await createJDRequest(jdRequestPayload, accessToken);

        if (!JDResponse.success || !JDResponse.data) {
          throw new Error(
            "Failed to create JD request. Please check the backend logs."
          );
        }

        const createdJD = JDResponse.data;

        try {
          const notificationPayload = {
            ID: createdJD.ID,
            JDCode: createdJD.JDCode,
            JobRole: createdJD.JobRole,
            Department: createdJD.Department,
            JobLocation: createdJD.JobLocation,
            JobNature: createdJD.JobNature,
            JobDescription: formData.jobDescription,
            NumPositions: createdJD.NumPositions,
            minWorkExperience: createdJD.minWorkExperience,
            maxWorkExperience: createdJD.maxWorkExperience,
            MinSalaryRange: createdJD.MinSalaryRange,
            MaxSalaryRange: createdJD.MaxSalaryRange,
            TargetDate: createdJD.TargetDate,
            Status: createdJD.Status,
            Skills: createdJD.Skills,
          };

          await sendCreatedJDNotification(
            notificationPayload,
            {
              userID: currentUser.userID,
              displayName: currentUser.displayName,
              email: currentUser.email,
            },
            accessToken
          );
        } catch (notificationError) {
          console.warn(
            "Notification failed but JD was created:",
            notificationError
          );
        }

        try {
          await createHiringPipeline(
            createdJD.ID,
            currentUser.userID,
            accessToken
          );
        } catch (pipelineError) {
          console.warn(
            "Pipeline creation failed but JD was created:",
            pipelineError
          );
        }

        dispatchToast(
          <Toast>
            <ToastTitle>JD Request created successfully</ToastTitle>
          </Toast>,
          { intent: "success" }
        );

        await new Promise((resolve) => setTimeout(resolve, 1000));
        navigate("/recruit");
      } catch (error) {
        console.error("Error submitting form:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Failed to create JD request</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      }
    } else {
      dispatchToast(
        <Toast>
          <ToastTitle>
            Validation failed. Please check the form for errors.
          </ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
    }

    setIsSubmitting(false);
  };

  const handleNewRatingChange = (event: any, data: { value?: number }) => {
    if (data.value !== undefined) {
      setNewRating(data.value);
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

  const handleUpdateJD = async (content: string) => {
    try {
      const result = await createSuggestions(accessToken, {
        jobPostingId: formData.jobId,
        suggestedDescription: content,
        suggestedByUserId: currentUser.userID,
      });
      await refreshToken();
      await sendSuggestNewJDNotification(
        {
          ...formData,
          status: "Active",
          createdByUserId: currentUser.userID,
          reportingManager: formData.reportingManager,
        },
        currentUser,
        content,
        accessToken
      );

      if (!result.success) {
        throw new Error("Failed to update job description");
      }
    } catch (error) {
      throw error;
    }
  };

  const getValidationState = (field: keyof FormErrors): "error" | "none" => {
    return errors[field] ? "error" : "none";
  };

  // Add this helper function to strip code fences and clean up AI response
  const cleanMarkdownResponse = (content: string): string => {
    let cleaned = content;
    // Remove ```html ... ``` or ``` ... ``` code fences
    cleaned = cleaned.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/, "");
    // Remove empty bullet lines (lines that are just "* " or "- " with nothing after)
    cleaned = cleaned.replace(/^[*\-]\s*$/gm, "");
    // Remove multiple consecutive blank lines (keep max 1)
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

      // Handle empty lines
      if (!trimmed) {
        if (inList) {
          result.push("</ul>");
          inList = false;
        }
        // Skip <br/> if last thing added was a heading or already a <br/>
        if (!lastWasHeading && !lastWasBr) {
          result.push("<br/>");
          lastWasBr = true;
        }
        lastWasHeading = false;
        continue;
      }

      // Convert **heading** lines
      if (/^\*\*(.+)\*\*\s*$/.test(trimmed)) {
        if (inList) {
          result.push("</ul>");
          inList = false;
        }
        // Remove trailing <br/> before heading if it exists
        if (result[result.length - 1] === "<br/>") {
          result.pop();
        }
        const text = trimmed.replace(/^\*\*(.+)\*\*\s*$/, "$1");
        result.push(`<p><strong>${text}</strong></p>`);
        lastWasHeading = true;
        lastWasBr = false;
        continue;
      }

      // Bullet point lines
      if (/^[•\-\*]\s+/.test(trimmed)) {
        if (!inList) {
          result.push("<ul>");
          inList = true;
        }
        const text = trimmed
          .replace(/^[•\-\*]\s+/, "")
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.+?)\*/g, "<em>$1</em>");
        result.push(`<li>${text}</li>`);
        lastWasHeading = false;
        lastWasBr = false;
        continue;
      }

      // Regular paragraph text
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
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

  // =============================================
  // RENDER
  // =============================================

  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-8 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Submitting form...</Body1Strong>
      </div>
    )
  }

  return (
    <FluentProvider
      style={{ background: "transparent" }}
      className="flex flex-col gap-5"
    >

      <div className="flex flex-col gap-6 overflow-y-auto p-1">
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
                options={[...jobPostings.map((posting) => posting.title), "other"]}
                value={formData.jobRole}
                onChange={handleJobRoleChange}
                placeholder={
                  isLoadingJobPostings
                    ? "Loading..."
                    : "Select or type job"
                }
                required
                disabled={isLoadingJobPostings}
                validationState={getValidationState("jobRole")}
                validationMessage={errors.jobRole}
                icon={<Briefcase20Regular />}
              />




              {isOtherSelected && <Field
                label={
                  <>
                    <Briefcase20Regular /> New Job posting
                  </>
                }
                validationState={getValidationState("jobRole")}
                required={isOtherSelected}
              >
                <Input
                  placeholder="New Job posting"
                  value={NewJobRoleName}
                  onChange={(e) => handleNewJobRoleChange(e.target.value)}

                />
              </Field>}

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
                />
              </Field>


              {/* <Field
                orientation="vertical"
                label={
                  <>
                    <Briefcase20Regular /> Job Level
                  </>
                }
                validationState={getValidationState("jobNature")}
                validationMessage={errors.jobNature}
                required
              >
                <Dropdown
                  placeholder="Select job nature"
                  value={`Level ${formData.jobLevel.toString()}`}
                  onOptionSelect={(_, data) =>
                    handleDropdownChange("jobLevel", data.optionValue || "")
                  }
                >
                  {jobLevels.map((option) => (
                    <Option text={`Level ${option}`} key={option} value={`${option}`}>
                      Level {option}
                    </Option>
                  ))}
                </Dropdown>
              </Field> */}

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
                disabled={isLoadingDepartments}
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
                disabled={isLoadingLocations}
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
                disabled={false}
                validationState={getValidationState("reportingManager")}
                validationMessage={errors.reportingManager}
                icon={<People20Regular />}
                department={formData.department}
                formData={formData}
                currentUser={currentUser}
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
                disabled={disableInterviewer}
                validationState={getValidationState("interviewer")}
                validationMessage={errors.interviewer}
                icon={<PersonStar20Regular />}
                department={formData.departmentId}
                formData={formData}
                currentUser={currentUser}
                userId={interviewerHRDetails} // Pass the specific user ID
                handleDisableField={handleDisableField}
                handleEnableField={handleEnableField}
              />

              <SubordinateUserCombobox
                label="Secondary HR"
                placeholder="Select HR"
                value={formData.interviewer?.displayName || ""}
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
                handleDisableField={handleDisableField}
                handleEnableField={handleEnableField}
              />
            </div>


            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">



              <Field
                orientation="vertical"
                label={
                  <>
                    <CalendarLtr20Regular /> Quarter
                  </>
                }
                validationState={getValidationState("jobNature")}
                validationMessage={errors.jobNature}
                required
              >
                <Dropdown
                  placeholder="Select job nature"
                  value={`${formData.quarter.toString()}`}
                  onOptionSelect={(_, data) =>
                    handleDropdownChange("quarter", data.optionValue || "")
                  }
                >
                  {quarter.map((option) => (
                    <Option text={`${option}`} key={option} value={`${option}`}>
                      {option}
                    </Option>
                  ))}
                </Dropdown>
              </Field>

             
            </div> */}


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

          <div className="p-4 ">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

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
                <Input
                  type="number"
                  value={formData.numPositions?.toString() || ""}
                  onChange={(e, data) => {
                    const numValue = parseInt(data.value, 10);
                    if (!isNaN(numValue) && numValue >= 1) {
                      handleSliderChange("numPositions", numValue);
                    } else if (data.value === "") {
                      handleSliderChange("numPositions", 1);
                    }
                  }}
                  min={1}
                  step={1}
                />
              </Field>

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
                />
              </Field>

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
                />
              </Field>
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
                Add at least 7 skills (5 + 2) with proficiency ratings
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
                />
                <div className="flex items-center w-full lg:w-[49%] gap-2">
                  <Rating
                    color="marigold"
                    max={5}
                    value={newRating}
                    onChange={handleNewRatingChange}
                  />
                  <span className="ml-2">{newRating}/5</span>
                </div>
              </div>

              <Button
                size="small"
                className="!text-[#2563EB] !font-semibold w-fit"
                appearance="subtle"
                icon={<Add20Regular />}
                onClick={addSkill}
              >
                Add New Skill
              </Button>

              {formData.skills.map((skill, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center w-full bg-[#F9FAFB] border-[#E5E7EB] border rounded-lg px-2 py-1"
                >
                  <div className="flex gap-3">
                    {
                      isOtherSelected && index < 2 && <LockClosed20Regular />
                    }
                    <span className="font-semibold">{skill.name}</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex items-center cursor-default">
                      <Rating
                        color="marigold"
                        value={skill.rating}
                        className="pointer-events-none opacity-60"
                        aria-disabled={true}
                      />
                      <span className="ml-2">{skill.rating}/5</span>
                    </div>
                    {((isOtherSelected && index > 1) || !isOtherSelected) && (
                      <Tooltip content="Remove Skill" relationship="label">
                        <Button
                          icon={<Delete20Regular />}
                          appearance="subtle"
                          className="!bg-transparent !text-[#DC2626]"
                          onClick={() => removeSkill(index)}
                        />
                      </Tooltip>
                    )}
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
                      Fill Mandatory Fields to generate Job Description
                    </MessageBarTitle>
                    <Text className="!text-yellow-700 !text-xs">
                      Fill in job Posting, nature, department, target date,
                      location, and at least 7 skills
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
                onUpdateJD={handleUpdateJD}
                newJobRoleName={NewJobRoleName}
                isOtherSelected={isOtherSelected}
              />
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
              accessToken={accessToken}
            />
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between bg-white w-full items-center p-4">
          <div>
            <Button
              appearance="subtle"
              onClick={() => window.history.back()}
              disabled={isSubmitting}
              icon={<ArrowExportRtlRegular />}
              type="button"
            >
              Back
            </Button>
          </div>
          <CardFooter>
            <div className="flex justify-end gap-2">
              {isSubmitting ? (
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={isSubmitting}
                  className="!bg-gray-200 !text-gray-100 !rounded-3xl !border-0 !w-[170px] !h-[44px]"
                >
                  Submitting...
                </Button>
              ) : (
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="!bg-gradient-to-r !from-[#0153A5] !to-[#2FC2FE] !text-white !rounded-3xl !border-0 !w-[170px] !h-[44px]"
                >
                  Submit
                </Button>
              )}
            </div>
          </CardFooter>
        </div>
      </div>

      <Toaster toasterId={toasterId} />
    </FluentProvider>
  );
}
