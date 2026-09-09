import * as React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  makeStyles,
  Combobox,
  Field,
  Option,
  useId,
  ComboboxProps,
  Spinner,
  Text,
  Caption1,
  Persona,
  Select
} from "@fluentui/react-components";
import { UserDetails } from "../../../Services/Offboarding";
import { useAuth } from "../../../Auth/AuthProvider";
import { EntraDepartment, getEntraDepartments, getEntraDepartmentsWithoutHr } from "../../../Services/Department";
import { Multiselect } from "./TagPicker";
import { searchUsersByDepartment } from "../../../Services/JDRequests";

interface DataType {
  user: UserDetails | null,
  department: string | null,
  departments: EntraDepartment[],
  isActive: boolean,
  accessType: string,
}
interface DialogTypes {
  open: boolean,
  handleClose: () => void,
  data: DataType,
  handleDataChange: (field: string, value: UserDetails | string | boolean | null | EntraDepartment | EntraDepartment[]) => void,
  isSubmitting: boolean;
  handleSubmit: () => void
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
  department?: string;
  formData: any;
  currentUser?: any;
  userId?: string; // Add this for direct user lookup
}

const useStyles = makeStyles({
  content: {
    display: "flex",
    flexDirection: "column",
    rowGap: "10px",
  },
});

const UserCombobox: React.FC<UserComboboxProps> = ({
  label,
  placeholder,
  onUserSelect,
  required = false,
  disabled = false,
  validationState = "none",
  validationMessage,
  formData,
  currentUser,
}) => {
  const [query, setQuery] = React.useState<string>("");
  const [users, setUsers] = React.useState<UserDetails[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>("");
  const { accessToken }: any = useAuth();
  const componentId = useId("user-combobox");

  // Clear reporting manager when department changes


  // Load department users when combobox opens
  const loadDepartmentUsers = async () => {


    try {
      setLoading(true);
      setError("");

      // Use backend API endpoint
      const departmentUsers = await searchUsersByDepartment(
        query,
        accessToken,
        import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"

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
  React.useEffect(() => {
    const searchUsers = async () => {


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
          import.meta.env.VITE_APP_HR_DEPT || "Talent Acquisition"
        );
        setUsers(results);

        if (results.length === 0 && query.length >= 2) {
          setError(`No users found matching "${query}" `);
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
  }, [query, accessToken, isOpen]);

  const onOptionSelect: ComboboxProps["onOptionSelect"] = (_e, data) => {
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

  const handleOpenChange = (_e: any, data: any) => {
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
            Loading users ...
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
          text={`No users found `}
          disabled
        >
          <div className="flex flex-col">
            <Text>No users found matching "{query}"</Text>

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
      label={
        label
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
        onOpenChange={handleOpenChange}
      >
        {renderContent()}
      </Combobox>
    </Field>
  );
};

export const CreateMappingForm = ({ open, handleClose, data, handleDataChange, isSubmitting, handleSubmit }: DialogTypes) => {

  const [Departments, setDepartments] = React.useState<EntraDepartment[]>([])
  const { accessToken } = useAuth()

  const AccessType = ["Primary", "Subordinate"]

  React.useEffect(() => {
    const loadDepartment = async () => {
      if (accessToken) {
        try {
          const response = await getEntraDepartmentsWithoutHr(accessToken)
          // console.log("Departments1", response)

          const filteredDepartment = response.filter((item) => item.Status === "active" && item.Code)
          // console.log("Departments2", filteredDepartment)

          setDepartments(filteredDepartment)
        }
        catch (error) {
          console.log("unable to fetch departments", error)
        }

      }
    }

    loadDepartment()
  }, [])
  const styles = useStyles();
  const handleFormSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    handleSubmit()
  };

  const handleUserSelect = (user: UserDetails | null) => {
    handleDataChange("user", user)
  }

  const validateForm = () => {
    return data.departments && data.departments.length > 0 && data.user
  }

  const handleDepartmentSelection = (selectedDepartments: EntraDepartment[]) => {
    handleDataChange("departments", selectedDepartments);
  }

  return (
    <Dialog onOpenChange={handleClose} open={open} modalType="non-modal">

      <DialogSurface aria-describedby={undefined}>
        <form onSubmit={handleFormSubmit} noValidate>
          <DialogBody>
            <DialogTitle>Create Mapping</DialogTitle>
            <DialogContent className={styles.content}>
              <UserCombobox
                label="Name"
                placeholder="Name of the HR"
                value={data.user?.displayName ?? ""}
                formData={data.user?.displayName ?? ""}
                onUserSelect={handleUserSelect}
                required
              />

              <Field
                label="Department"
                required
                validationState={data.departments && data.departments.length > 0 ? "success" : "error"}
                validationMessage={data.departments && data.departments.length > 0 ? "" : "Please select at least one department"}
              >
                <Multiselect
                  options={Departments}
                  onSelectionChange={handleDepartmentSelection}
                  selectedValues={data.departments.map(d => d.Id)}
                />
              </Field>

              <Field
                label="Access Type"
                required
                hidden
              >
                <Select
                  value={data.accessType ? data.accessType : ""}
                  onChange={(e) => handleDataChange("accessType", e.target.value)}
                >
                  <option disabled value={""}>select department</option>
                  {
                    AccessType.map((type) => (
                      <option value={type}>{type}</option>
                    ))
                  }
                </Select>
              </Field>
            </DialogContent>
            <DialogActions>
              <Button disabled={!validateForm() || isSubmitting} type="submit" appearance="primary">
                {isSubmitting ? <Spinner size="tiny" /> : "Submit"}
              </Button>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" onClick={handleClose}>Close</Button>
              </DialogTrigger>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
};