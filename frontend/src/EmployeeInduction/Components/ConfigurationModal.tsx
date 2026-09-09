import * as React from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogTrigger,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Field,
  Input,
  Spinner,
  Caption2,
  Caption1,
  Text,
  Combobox,
  Dropdown,
  Option,
  Persona,
  useId,
  ComboboxProps,
  PopoverSurface,
  FluentProvider,
  webLightTheme,
  Select,
  Checkbox,
  Body1Strong,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  TagPicker,
  TagPickerControl,
  TagPickerGroup,
  Tag,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  Avatar,
  TagPickerProps,
  Label,
  Divider,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
} from "@fluentui/react-components";
import inductionAPI, { InductionTaskDetail } from "../../Services/EmployeeInduction";
import { searchUsersWithoutDetails } from "../../Services/JDRequests";
import { getCombinedDepartments } from "../../Services/Department";
import { useAuth } from "../../Auth/AuthProvider";
import { searchUsersWithDetails, UserDetails } from "../../Services/Offboarding";
import { Briefcase20Regular, CheckmarkCircle20Filled, Dismiss24Regular, Person20Regular, Person24Regular, PersonAvailable20Regular, Settings20Regular, Shield20Regular, Warning20Regular } from "@fluentui/react-icons";
import { useState } from "react";
import { getApplicantDetails } from "../../Services/Applicant";
import { set } from "date-fns";
import { ActiveLicense } from "../../Types/license";
import { fetchAllActiveLiscense } from "../../Services/GraphAPI";
import LicenseList from '../../Common/License.json'
import { getAllShifts, Shift } from "../../Services/ShiftService";
import { getAppLocations, AppLocation } from "../../Services/Location";

interface ConfigDialogType {
  open: boolean;
  task: InductionTaskDetail | null;
  handleSubmit: (value: any) => void;
  handleClose: () => void;
  isLoading: boolean;
  applicantId?: string;
  editMode?: boolean;  // edit details of an already-created User ID
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
  currentUser?: any;
  userId?: string;
}


// Custom Portal Component that wraps content in FluentProvider
const PortalWithProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <FluentProvider theme={webLightTheme}>
      {children}
    </FluentProvider>,
    document.body
  );
};

const UserCombobox: React.FC<UserComboboxProps> = ({
  label,
  placeholder,
  value,
  onUserSelect,
  required = false,
  disabled = false,
  validationState = "none",
  validationMessage,
  icon,
  currentUser,
}) => {
  const [query, setQuery] = React.useState<string>("");
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { accessToken }: any = useAuth();
  const componentId = useId("user-combobox");
  const comboboxRef = React.useRef<HTMLDivElement>(null);

  // Reflect programmatic value changes (e.g. edit-mode prefill) in the input.
  // Only while the dropdown is closed, so the user's typing is never clobbered.
  React.useEffect(() => {
    if (!isOpen && (value || "") !== query) {
      setQuery(value || "");
    }
  }, [value]);


  // Fix z-index when dropdown opens - SIMPLIFIED VERSION
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        const listboxes = document.querySelectorAll('.fui-Combobox__listbox');
        listboxes.forEach((listbox: any) => {
          listbox.style.zIndex = '1000000';
          listbox.style.backgroundColor = 'white';
          listbox.style.border = '1px solid #d1d1d1';
          listbox.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        });
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const loadDepartmentUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const departmentUsers = await searchUsersWithoutDetails(
        query,
        accessToken
      );

      setUsers(departmentUsers);

      if (currentUser && departmentUsers.length > 0) {
        const currentUserInDept = departmentUsers.find(
          (user) => user.id === currentUser.userID
        );
        if (currentUserInDept) {
          onUserSelect(currentUserInDept);
          setQuery(currentUserInDept.email);
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

  React.useEffect(() => {
    const searchUsers = async () => {
      if (!query || query.length < 2) {
        if (isOpen && !query) {
          loadDepartmentUsers();
        }
        return;
      }

      setLoading(true);
      setError("");

      try {
        const results = await searchUsersWithDetails(query, accessToken);
        setUsers(results);

        if (results.length === 0 && query.length >= 2) {
          setError(`No users found matching "${query}"`);
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

  const onOptionSelect: ComboboxProps["onOptionSelect"] = (e, data) => {
    const selectedUser = users.find((u) => u.id === data.optionValue);
    if (selectedUser) {
      setQuery(selectedUser.email);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}>
            <Text>Loading users...</Text>
          </div>
        </Option>
      );
    }

    if (error) {
      return (
        <Option key={`${componentId}-error`} text={error} disabled>
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8px' }}>
            <Text style={{ color: '#d13438' }}>{error}</Text>
            <Caption1 style={{ color: '#6e6e6e' }}>
              Try adjusting your search or contact support
            </Caption1>
          </div>
        </Option>
      );
    }

    if (users?.length === 0 && query?.length >= 2) {
      return (
        <Option
          key={`${componentId}-no-results`}
          text={`No users found`}
          disabled
        >
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8px' }}>
            <Text>No users found matching "{query}"</Text>
          </div>
        </Option>
      );
    }

    if (users?.length === 0) {
      return (
        <Option
          key={`${componentId}-empty`}
          text="Type to search or open to see all"
          disabled
        >
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8px' }}>
            <Text>Open dropdown to see all users</Text>
            <Caption1 style={{ color: '#0078d4', marginTop: '4px' }}>
              Or type to search
            </Caption1>
          </div>
        </Option>
      );
    }

    return users.map((user, index) => {
      // Generate initials from name
      const initials = user.displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

      // Generate a consistent color based on user ID
      const colors = ['#D13438', '#CA5010', '#8764B8', '#0078D4', '#00CC6A', '#498205'];
      const colorIndex = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
      const avatarColor = colors[colorIndex];

      return (
        <Option
          key={`${componentId}-${user.id}-${index}`}
          value={user.id}
          text={user.displayName}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 4px' }}>
            {/* Custom Avatar */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: avatarColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                flexShrink: 0
              }}
            >
              {initials}
            </div>
            {/* User Info */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <Text weight="semibold" style={{ fontSize: '14px' }}>{user.displayName}</Text>
              <Caption1 style={{ color: '#6e6e6e' }}>{user.email}</Caption1>
              {user.department && (
                <Caption1 style={{ color: '#0078d4', marginTop: '2px' }}>
                  {user.department}
                </Caption1>
              )}
            </div>
          </div>
        </Option>
      );
    });
  };

  return (
    <div ref={comboboxRef}>
      <Field
        orientation="vertical"
        label={
          <>
            <Person20Regular /> {label}
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
          placeholder="Search or select user..."
          onChange={handleInputChange}
          value={query}
          disabled={disabled}
          open={isOpen}
          onOpenChange={handleOpenChange}
          mountNode={document.body}
        >
          {renderContent()}
        </Combobox>
      </Field>
    </div>
  );
};

export const ConfigurationDialog = ({
  open,
  task,
  handleSubmit,
  handleClose,
  isLoading,
  applicantId,
  editMode = false
}: ConfigDialogType) => {
  const ORGANIZATION_DOMAIN =
    (import.meta.env.VITE_EMAIL_DOMAIN as string) ||
    "quadrasystems.net";
  const [value, setValue] = React.useState("");
  const [ApplicantData, setApplicantData] = useState<any | null>(null);
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");
  const [departmentName, setDepartmentName] = React.useState<string>("");
  const [subDepartmentName, setSubDepartmentName] = React.useState<string>("");
  const [isCustomSubDept, setIsCustomSubDept] = React.useState(false);
  const [departmentId, setDepartmentId] = React.useState<string>("");
  const [departmentOptions, setDepartmentOptions] = React.useState<any[]>([]);
  const [SubDepartments, setSubDepartments] = React.useState<string[]>([]);
  const [IsSubDepartmentLoading, setIsSubDepartmentLoading] = React.useState(false);
  const [faxNumberId, setFaxNumberId] = React.useState("")
  const [faxNumberName, setFaxNumberName] = React.useState("")
  const [managerId, setManagerId] = useState<string>("");
  const [managerName, setManagerName] = useState<string>("");
  const [workEmail, setWorkEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [personalMail, setPersonalMail] = useState<string>("");
  const [jobTitle, setJobTitle] = useState<string>("");
  const { accessToken } = useAuth()
  const [errorMessage, setErrorMessage] = React.useState(
    {
      firstName: "",
      lastName: "",
      workEmail: "",
      fullName: "",
      jobTitle: "",
      faxNumber: "",
      department: "",
      license: "",
      managerId:"",
      location: "",
      mobile: ""
    }
  );
  const [assignLicense, setAssignLicense] = useState(true)
  const [availableLiscense, setAvailabelLiscense] = useState<ActiveLicense[]>([])
  const [selectedLiscense, setSelectedLicense] = useState<string[]>([])
  // Edit mode: the login ID as it currently exists, to detect and warn on a change
  const [originalWorkEmail, setOriginalWorkEmail] = useState<string>("")
  // Office location + mobile — parity with the Confirm Hire drawer
  const [officeLocations, setOfficeLocations] = useState<AppLocation[]>([])
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [officeLocationName, setOfficeLocationName] = useState<string>("")
  const [mobileNumber, setMobileNumber] = useState<string>("")
  const {currentUser} = useAuth();

  const [availableShifts,setAvailableShifts] = useState<Shift[]>([])

  const [showADConfirmDialog,setShowAdConfirmDialog] = useState(false)
  const [selectedShift,setSelectedShift]=useState<Shift|null>(null)



  const handleSelectShift=(id:string)=>{
    let selected = availableShifts.filter((item)=>item.ID===parseInt(id))
    if(selected.length>0){

      setSelectedShift(selected[0])
    }
  }


  const checkPermission = (permissionPath: any) => {
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

    const canAddEntra = checkPermission("recruit.create_ad")

  const drawerRef = React.useRef<HTMLDivElement>(null);
  

  const handleCloseADConfirm = () =>{
    setShowAdConfirmDialog(false)
    setTimeout(() => {
      drawerRef.current?.focus();
    }, 0);
  }

  const onLicenseOptionSelect: TagPickerProps["onOptionSelect"] = (e, data) => {
    if (data.value === "no-options") {
      return;
    }
    setSelectedLicense(data.selectedOptions);
  };
  const tagPickerOptions = availableLiscense?.filter(
    (option) => !selectedLiscense.includes(option.skuId)
  );


  // console.log("availabeLicense",availableLiscense)
  // console.log("tagPickerOptions",tagPickerOptions)

  React.useEffect(() => {
    const loadData = async () => {
      try {
        if (accessToken) {
          const response = await fetchAllActiveLiscense(accessToken)
          if (response.success) {
            const filtered = response.data.filter((item: ActiveLicense) => item.availableUnits > 0)
            setAvailabelLiscense(filtered)
          }
        }
      }
      catch (error) {
        console.log(error)
      }
    }
    if (assignLicense && open) {
      loadData()
    }
  }, [open, assignLicense])

  // Load office locations (same Configuration Hub list the Confirm Hire drawer uses)
  React.useEffect(() => {
    const loadLocations = async () => {
      if(!accessToken) return
      setIsLoadingLocations(true);
      try {
        const data = await getAppLocations(accessToken);
        if (data) {
          setOfficeLocations(data.filter((loc) => loc.Status === "active"));
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setIsLoadingLocations(false);
      }
    };
    if (open && task?.configurationType?.toLowerCase() === "email") {
      loadLocations();
    }
  }, [open, task])

  React.useEffect(()=>{

    const loadShifts=async()=>{
      try{
        const response = await getAllShifts()
        if(response.success && response.data){
          setAvailableShifts(response.data as Shift[])
          if(response.data?.length>0){
            setSelectedShift(response.data[0])
          }
        }
      }
      catch(error){
        alert("Unable to fetch shifts")
        handleClose()
      }
    }

    if(task?.configurationType?.toLowerCase() === "shift"){
      loadShifts()
    }
  },[open,task])


  // Ensure tag picker listbox appears above the drawer (fix clipping)
  React.useEffect(() => {
    const adjustListbox = () => {
      const listboxes = document.querySelectorAll('.fui-TagPicker__listbox, .fui-Combobox__listbox, [role="listbox"]');
      listboxes.forEach((listbox: any) => {
        listbox.style.zIndex = '1000000';
        listbox.style.backgroundColor = 'white';
        listbox.style.border = '1px solid #d1d1d1';
        listbox.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
      });
    };

    const timer = setTimeout(adjustListbox, 10);
    return () => clearTimeout(timer);
  }, [assignLicense, selectedLiscense, tagPickerOptions.length]);



  const handleLicenseChange = (state: boolean) => {
    setAssignLicense(state)
  }

  const canSubmit = () => {
    if (task?.configurationType === "email") {
      if (!firstName) {
        setErrorMessage(prev => ({ ...prev, firstName: "First name is required" }));
        return false;
      }
      if (!lastName) {
        setErrorMessage(prev => ({ ...prev, lastName: "Last name is required" }));
        return false;
      }
      if (!workEmail) {
        setErrorMessage(prev => ({ ...prev, workEmail: "Work Email Address is required" }));
        return false;
      }
      if (canAddEntra && workEmail && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(workEmail.concat(`@${ORGANIZATION_DOMAIN}`))) {
        setErrorMessage(prev => ({ ...prev, workEmail: "Invalid Email format" }));
        return false;
      }
      if(!canAddEntra && workEmail && !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(workEmail)){
        setErrorMessage(prev => ({ ...prev, workEmail: "Invalid Email format" }));
        return false;
      }
      if (!fullName) {
        setErrorMessage(prev => ({ ...prev, fullName: "Full name is required" }));
        return false;
      }
      if (!jobTitle) {
        setErrorMessage(prev => ({ ...prev, jobTitle: "Job title is required" }));
        return false;
      }
      if (!personalMail) {
        setErrorMessage(prev => ({ ...prev, personalMail: "Personal email is required" }));
        return false;
      }
      if (canAddEntra&&!faxNumberId) {
        setErrorMessage(prev => ({ ...prev, faxNumber: "Security Group is required" }));
        return false;
      }

      if (canAddEntra&&assignLicense && selectedLiscense.length < 1) {
        setErrorMessage(prev => ({ ...prev, license: "Please add atleast one license" }))
        return false;
      }

      if (canAddEntra&&!managerId){
          setErrorMessage(prev => ({ ...prev, managerId: "Please select Manager" }))
        return false;
      }

      if (canAddEntra && !officeLocationName) {
        setErrorMessage(prev => ({ ...prev, location: "Location is required" }))
        return false;
      }

      if (canAddEntra && !mobileNumber?.trim()) {
        setErrorMessage(prev => ({ ...prev, mobile: "Mobile number is required" }))
        return false;
      }

      return true;
    }
  }

  const handleOpenADConfirmDialog = () =>{
    if(canSubmit()){

      setShowAdConfirmDialog(true)
    }
  }

  React.useEffect(() => {
    if (!open) {
      setFirstName("");
      setLastName("");
      setDepartmentName("");
      setSubDepartmentName("");
      setIsCustomSubDept(false);
      setDepartmentId("");
      setSubDepartments([]);
      setWorkEmail("");
      setFullName("");
      setPersonalMail("");
      setJobTitle("");
      setFaxNumberId("");
      setFaxNumberName("")
      setManagerId("");
      setManagerName("");
      setOriginalWorkEmail("");
      setOfficeLocationName("");
      setMobileNumber("");
      setErrorMessage({
        firstName: "",
        lastName: "",
        workEmail: "",
        fullName: "",
        jobTitle: "",
        faxNumber: "",
        department: "",
        license: "",
        managerId:"",
        location: "",
        mobile:""
      });
    }
  }, [open])

  const handleProceedSubmit = () => {
    const valid = canSubmit();

    if (!valid) return;

    handleSubmit({
      firstName,
      lastName,
      fullName,
      departmentName,
      workEmail:canAddEntra? workEmail.concat(`@${ORGANIZATION_DOMAIN}`):workEmail,
      subDepartmentId: null,
      subDepartmentName,
      personalMail,
      jobTitle,
      faxNumberId,
      faxNumberName,
      ...(task?.configurationType?.toLowerCase() === "email" && {
        managerId: managerId || undefined,
        managerName: managerName || undefined,
      }),
      officeLocation: officeLocationName || undefined,
      mobilePhone: mobileNumber?.trim() || undefined,
      assignLicense,
      selectedLiscense
    });
  };

  React.useEffect(() => {
    const loadDataForAD = async () => {
      try {
        if (applicantId && accessToken) {
          const response = await getApplicantDetails(applicantId, accessToken)
          setApplicantData(response.data)
          // initialize local form state so inputs are controlled and show values
          const user = response.data?.user || {};
          setFirstName(user.firstName ?? "");
          setLastName(user.lastName ?? "");
          setDepartmentName(user.departmentName ?? "");
          setDepartmentId(user.departmentId ?? user.DepartmentId ?? "");
          setSubDepartmentName(user.subDepartmentName ?? "");
          setFullName(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim());
          setPersonalMail(user.email ?? "");
          setJobTitle(user.Designation ?? "");
          setFaxNumberId(user.FaxNumberId ?? "")
          setFaxNumberName(user.faxNumberName ?? "")
          const generatedEmail = `${user.firstName?.toLowerCase()?.trim()?.split(" ")?.join("")}.${user.lastName?.toLowerCase()?.trim()?.split(" ")?.join("")}`;
          setWorkEmail(generatedEmail);
          if (user.email) setValue(user.email);
          setMobileNumber(user.phone ?? "");

          // Edit mode: override the applicant prefill with the created user's CURRENT details
          if (editMode && task?.taskDetailId) {
            const detailsResponse = await inductionAPI.getConfiguredADUserDetails(task.taskDetailId, accessToken);
            if (detailsResponse.success && detailsResponse.data) {
              const current = detailsResponse.data;
              setFirstName(current.firstName ?? "");
              setLastName(current.lastName ?? "");
              setFullName(current.fullName ?? `${current.firstName ?? ""} ${current.lastName ?? ""}`.trim());
              setJobTitle(current.jobTitle ?? "");
              if (current.departmentName) setDepartmentName(current.departmentName);
              if (current.subDepartmentName) setSubDepartmentName(current.subDepartmentName);
              if (current.personalMail) setPersonalMail(current.personalMail);
              if (current.faxNumberId) setFaxNumberId(current.faxNumberId);
              // Manager may come back flat (managerName/managerId), under
              // alternate casing, or as a nested Graph `manager` object.
              const mgr = current.manager ?? {};
              setManagerId(
                current.managerId ??
                  current.ManagerID ??
                  mgr.id ??
                  ""
              );
              setManagerName(
                current.managerName ??
                  current.managerDisplayName ??
                  mgr.displayName ??
                  ""
              );
              const existingEmail = current.workEmail ?? "";
              setOriginalWorkEmail(existingEmail);
              const emailForInput = canAddEntra ? existingEmail.split("@")[0] : existingEmail;
              setWorkEmail(emailForInput);
              setValue(emailForInput);
              const assigned: string[] = Array.isArray(current.assignedLicenses) ? current.assignedLicenses : [];
              setAssignLicense(assigned.length > 0);
              setSelectedLicense(assigned);
              setOfficeLocationName(current.officeLocation ?? "");
              if (current.mobilePhone) setMobileNumber(current.mobilePhone);
            }
          }
        }
      }
      catch (error) {
        console.error("Error loading AD user data:", error);
      }
    }
    if ((task?.configurationType?.toLowerCase() === "email" || task?.configurationType?.toLowerCase() === "shift") && applicantId) {
      loadDataForAD()
    }
  }, [applicantId, accessToken, task, editMode])


  const handleWorkEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const email = e.target.value;
    setWorkEmail(email);
    setValue(email);
    setErrorMessage(prev => ({ ...prev, workEmail: "" }));
  }

  const handleUserSelect = (user: UserDetails | null) => {
  if (!user) {
    setWorkEmail("");
    setValue("");
    return;
  }

  // If you want to use email
  setWorkEmail(user.email || "");
  setValue(user.email || "");
};

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fName = e.target.value;
    setFirstName(fName);
    setFullName(`${fName} ${lastName}`.trim());
    // In edit mode the login ID must not silently change when the name is corrected
    if (!editMode) {
      const generatedEmail = `${fName.toLowerCase()?.split(" ").join("").trim()}.${lastName.toLowerCase()?.split(" ").join("").trim()}`
      setWorkEmail(generatedEmail);
      setValue(generatedEmail);
    }
    setErrorMessage(prev => ({ ...prev, firstName: "" }));
  }

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const lName = e.target.value;
    setLastName(lName);
    setFullName(`${firstName} ${lName}`.trim());
    if (!editMode) {
      const generatedEmail = `${firstName.toLowerCase()?.split(" ").join("").trim()}.${lName.toLowerCase()?.split(" ").join("").trim()}`
      setWorkEmail(generatedEmail);
      setValue(generatedEmail);
    }
    setErrorMessage(prev => ({ ...prev, lastName: "" }));
  }


  const handleSubmitShift=()=>{
    if(!selectedShift){
      alert("Please select a shift")
      return
    }
    handleSubmit({shiftId:selectedShift.ID})
  }


  const handleProceedSubmitting=()=>{
    
    switch (task?.configurationType?.toLowerCase()) {
      case 'email':
        handleOpenADConfirmDialog();
        break;
      case 'shift':
        handleSubmitShift();
        break;
      default:
        break;
    }
  }

  React.useEffect(()=>{
    if(!open){
      setSelectedLicense([])
      setShowAdConfirmDialog(false)
    }
  },[open])

   React.useEffect(()=>{
      // In edit mode the selection is prefilled from the user's ACTUAL assigned licences
      if (editMode) return;
      const mandatorySkuIds = (
        (import.meta.env.VITE_MANDATORY_SKU_IDS as string) ||
        "dcb1a3ae-b33f-4487-846a-a640262fadf4,f30db892-07e9-47e9-837c-80727f46fd3d"
      )
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      let mandatoryLicenses = availableLiscense.filter((item)=>mandatorySkuIds.includes(item.skuId))
      if(mandatoryLicenses.length>0){
        setSelectedLicense([...mandatoryLicenses.map((item)=>item.skuId)])
      }
    },[availableLiscense, editMode])


  React.useEffect(() => {
    const loadDepartments = async () => {
      if (!accessToken) return;
      try {
        const data = await getCombinedDepartments(accessToken);
        if (data) setDepartmentOptions(data);
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    };
    loadDepartments();
  }, [accessToken]);

  React.useEffect(() => {
    const fetchSubDepartments = async () => {
      if (!departmentId || !accessToken) return;
      setIsSubDepartmentLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/graphapi/get-sub-departments?department=${departmentName}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const result = await response.json();
        if (result.success) {
          setSubDepartments(result.data);
        }
      } catch (error) {
        console.error("Error fetching sub-departments:", error);
      } finally {
        setIsSubDepartmentLoading(false);
      }
    };
    fetchSubDepartments();
  }, [departmentId, accessToken,departmentName]);

  // console.log("ApplicantData", ApplicantData);


    const renderEmailConfigurationForm = () =>{
      return (
        <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ overflow: "visible" }}>

                  <Field
                    label="First Name"
                    required
                    validationState={errorMessage.firstName ? "error" : "none"}
                    validationMessage={errorMessage.firstName}
                  >
                    <Input
                      placeholder="First name"
                      value={firstName}
                      onChange={handleFirstNameChange}
                      disabled={isLoading}
                    />
                  </Field>

                  <Field
                    label="Last Name"
                    required
                    validationState={errorMessage.lastName ? "error" : "none"}
                    validationMessage={errorMessage.lastName}
                  >
                    <Input
                      placeholder="Last name"
                      value={lastName}
                      onChange={handleLastNameChange}
                      disabled={isLoading}
                    />
                  </Field>



                </div>

                <div className="grid grid-cols-1 mt-2 gap-4">

                  <Field
                    label="Full name"
                    required
                    validationState={errorMessage.fullName ? "error" : "none"}
                    validationMessage={errorMessage.fullName}

                  >
                    <Input
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />


                  </Field>

                  <Field
                    label="Designation"
                    required
                    validationState={errorMessage.jobTitle ? "error" : "none"}
                    validationMessage={errorMessage.jobTitle}

                  >
                    <Input
                      placeholder="Job Title"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                    />


                  </Field>



                  <Field
                    label="Department"
                    required
                    validationState={errorMessage.department ? "error" : "none"}
                    validationMessage={errorMessage.department}
                  >
                    <Dropdown
                      placeholder="Select department"
                      value={departmentName}
                      selectedOptions={departmentId ? [departmentId] : []}
                      onOptionSelect={(_, data) => {
                        const dept = departmentOptions.find(
                          (d) => d.Id === data.optionValue
                        );
                        setDepartmentName(dept?.Name || "");
                        setDepartmentId(data.optionValue || "");
                        // Reset the department-scoped sub department
                        setSubDepartmentName("");
                        setSubDepartments([]);
                      }}
                    >
                      {departmentOptions.map((dept) => (
                        <Option key={dept.Id} value={dept.Id}>
                          {dept.Name}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>

                  {IsSubDepartmentLoading ? (
                    <Spinner size="tiny" label="Loading sub departments..." />
                  ) : SubDepartments.length > 0 ? (
                    <Field label="Sub Department">
                      <Select
                        value={isCustomSubDept ? "Others" : subDepartmentName}
                        onChange={(_, data) => {
                          if (data.value === "Others") {
                            setIsCustomSubDept(true);
                            setSubDepartmentName("");
                          } else {
                            setIsCustomSubDept(false);
                            setSubDepartmentName(data.value as string);
                          }
                        }}
                        disabled={isLoading}
                      >
                        <option value="">Select sub department</option>
                        {SubDepartments.map((dept: string) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                        <option value="Others">Others</option>
                      </Select>
                      {isCustomSubDept && (
                        <Input
                          placeholder="Enter sub department"
                          value={subDepartmentName}
                          onChange={(e) => setSubDepartmentName(e.target.value)}
                          style={{ marginTop: 4 }}
                        />
                      )}
                    </Field>
                  ) : departmentId ? (
                    <Field label="Sub Department">
                      <Input
                        placeholder="Enter sub department"
                        value={subDepartmentName}
                        onChange={(e) => setSubDepartmentName(e.target.value)}
                        disabled={isLoading}
                      />
                    </Field>
                  ) : null}

                  {
                   canAddEntra && ApplicantData && ApplicantData.faxNumbers && Array.isArray(ApplicantData.faxNumbers) && ApplicantData.faxNumbers.length > 0 &&
                    <Field
                      label="Security Group"
                      required
                      validationState={errorMessage.faxNumber ? "error" : "none"}
                      validationMessage={errorMessage.faxNumber}
                    >
                      <Select
                        value={faxNumberId}
                        onChange={(_, data) => {
                          setFaxNumberId(data.value as string);

                          const faxNumbers = ApplicantData?.faxNumbers;

                          if (Array.isArray(faxNumbers)) {
                            const foundItem = faxNumbers.find(
                              (item: any) => item.id === data.value || item.Id === data.value
                            );

                            const name = foundItem?.costCenter || "";
                            // console.log("changedName", name);
                            setFaxNumberName(name);
                            setErrorMessage({ ...errorMessage, faxNumber: "" })
                          }
                        }}

                        disabled={isLoading}
                      >
                        <option disabled key="placeholder" value="">Select Security Group</option>
                        {
                          ApplicantData && ApplicantData.faxNumbers && Array.isArray(ApplicantData.faxNumbers) && ApplicantData.faxNumbers.map((fax: any) => (
                            <option key={fax.id ?? fax.id} value={fax.id ?? fax.id}>{(fax.costCenter ?? "").toString().trim()}</option>
                          ))
                        }
                      </Select>
                    </Field>
                  }

                  {
                    canAddEntra?

                     <div className="grid grid-cols-2 items-center gap-2">
                    <Field
                      label="Organization Email Address"
                      required
                      validationState={errorMessage.workEmail ? "error" : "none"}
                      validationMessage={errorMessage.workEmail}
                      hint="Enter username only (e.g., jdoe)"

                    >
                      <Input
                        placeholder="Work Email"
                        value={workEmail}
                        onChange={handleWorkEmailChange}
                      />
                    </Field>
                    <Text className="mb-0">@{ORGANIZATION_DOMAIN}</Text>
                  </div>

                    :

                    <UserCombobox
                      label="Organization Email Address"
                      placeholder="Select user"
                      value={workEmail}
                      onUserSelect={handleUserSelect}
                    />
                  }
                 

                  <Field
                    label="Personal Email Address"

                  >
                    <Input
                      placeholder="Personal Email"
                      value={personalMail}
                      disabled
                    />


                  </Field>

                  <Field
                    label="Mobile Number"
                    required={canAddEntra}
                    validationState={errorMessage.mobile ? "error" : "none"}
                    validationMessage={errorMessage.mobile}
                  >
                    <Input
                      type="tel"
                      placeholder="Mobile number"
                      value={mobileNumber}
                      onChange={(e) => {
                        setMobileNumber(e.target.value);
                        setErrorMessage(prev => ({ ...prev, mobile: "" }));
                      }}
                      disabled={isLoading}
                    />
                  </Field>

                  <Field
                    label="Location"
                    required={canAddEntra}
                    validationState={errorMessage.location ? "error" : "none"}
                    validationMessage={errorMessage.location}
                  >
                    {isLoadingLocations ? (
                      <Spinner size="tiny" label="Loading locations..." />
                    ) : (
                      <Select
                        value={officeLocationName}
                        onChange={(_, data) => {
                          setOfficeLocationName(data.value as string);
                          setErrorMessage(prev => ({ ...prev, location: "" }));
                        }}
                        disabled={isLoading || officeLocations.length === 0}
                      >
                        <option disabled key="placeholder" value="">Select location</option>
                        {officeLocations.map((loc) => (
                          <option key={loc.Id} value={loc.Name}>{loc.Name}</option>
                        ))}
                        {/* Keep an unknown current value selectable in edit mode */}
                        {officeLocationName && !officeLocations.some((loc) => loc.Name === officeLocationName) && (
                          <option key="current" value={officeLocationName}>{officeLocationName}</option>
                        )}
                      </Select>
                    )}
                  </Field>

                  <UserCombobox
                    label="Manager"
                    placeholder="Search for manager"
                    value={managerName}
                    onUserSelect={(user) => {
                      setManagerId(user?.id || "");
                      setManagerName(user?.displayName || "");
                      setErrorMessage((prev)=>({
                        ...prev,
                        managerId:""
                      }))
                    }}
                    required
                    validationState={errorMessage.managerId?"error":"none"}
                    validationMessage={errorMessage.managerId}
                    disabled={isLoading}
                  />


                  <div hidden={canAddEntra?false:true} className={`p-3 bg-blue-100  flex gap-3 items-center rounded-lg`}>
                    <Checkbox
                      checked={assignLicense}
                      onChange={(e, data) =>
                        handleLicenseChange(!assignLicense)
                      }
                    />

                    <Body1Strong>Assign License</Body1Strong>
                  </div>
                </div>

                {
               canAddEntra && assignLicense && <div className="mt-1" style={{  zIndex:  1000000}}>
                    <Field 
                    validationState={errorMessage.license?"error":"none"}
                    validationMessage={errorMessage.license}
                    aria-placeholder="Select License" label="License">
                      <TagPicker
                        onOptionSelect={onLicenseOptionSelect}
                        selectedOptions={selectedLiscense}
                        inline
                        
                      >
                        <TagPickerControl>
                          <TagPickerGroup aria-label="License">
                            {selectedLiscense.map((skuId) => {
                              const item = availableLiscense.find((license) => license.skuId === skuId);
                              return (
                                <Tag
                                  key={skuId}
                                  shape="rounded"
                                  media={<Avatar aria-hidden name={item?.skuPartNumber && LicenseList[item.skuPartNumber as keyof typeof LicenseList] ? LicenseList[item.skuPartNumber as keyof typeof LicenseList] : item?.skuPartNumber  || skuId} color="colorful" />}
                                  value={skuId}
                                >
                                  {item?.skuPartNumber && LicenseList[item.skuPartNumber as keyof typeof LicenseList] ? LicenseList[item.skuPartNumber as keyof typeof LicenseList] : item?.skuPartNumber  || skuId}
                                </Tag>
                              );
                            })}
                          </TagPickerGroup>
                          <TagPickerInput aria-label="Select Employees" />
                        </TagPickerControl>
                        <TagPickerList  style={{  zIndex: 1000000 }}>
                          {tagPickerOptions.length > 0 ? (
                            tagPickerOptions.map((option) => (
                              <TagPickerOption
                                value={option.skuId}
                                key={option.skuId}
                              >
                                {option?.skuPartNumber && LicenseList[option.skuPartNumber as keyof typeof LicenseList] ? LicenseList[option.skuPartNumber as keyof typeof LicenseList] : option?.skuPartNumber}
                              </TagPickerOption>
                            ))
                          ) : (
                            <TagPickerOption value="no-options">
                              No options available
                            </TagPickerOption>
                          )}
                        </TagPickerList>
                      </TagPicker>
                    </Field>
                  </div>
                }


              </div>
      )
    }

    const renderShiftConfigurationForm = () =>{
      return (
        
        <div>
          <div className="p-5 rounded-xl bg-green-100 border-1 border-green-400 text-green-400">
            <Persona
              title={fullName}
              size="extra-large"
              textAlignment="center"
              primaryText={fullName}
              secondaryText={ApplicantData?.user?.WorkEmail}
              tertiaryText={departmentName?.concat(' | ')?.concat(jobTitle)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <Field
                      label="Shift"
                    >
                      <Select
                        value={selectedShift?.ID}
                        onChange={(_, data) => {
                          handleSelectShift(data.value)
                        }}
                        
                      >
                        <option disabled key="placeholder" value="">Select Shift</option>
                        {
                          availableShifts  && Array.isArray(availableShifts) && availableShifts.map((dept: Shift) => (
                            <option key={dept.ID ?? dept.ID} value={dept.ID ?? dept.ID}>{(dept.ShiftName ?? dept.ShiftName ?? "").toString().trim()}</option>
                          ))
                        }
                      </Select>
                    </Field>
                    <div></div>

                    <Field
                    label="Shift start time"
                    required
                    validationState={errorMessage.fullName ? "error" : "none"}
                    validationMessage={errorMessage.fullName}

                  >
                    <Input
                      placeholder="Shift start time"
                      value={selectedShift?.StartTime ? selectedShift.StartTime.slice(11, 19) : ""}
                      disabled
                    />


                  </Field>

                   <Field
                    label="Shift end time"
                    required
                    validationState={errorMessage.fullName ? "error" : "none"}
                    validationMessage={errorMessage.fullName}

                  >
                    <Input
                      placeholder="Shift start time"
                      value={selectedShift?.EndTime ? selectedShift.EndTime.slice(11, 19) : ""}
                      disabled
                    />


                  </Field>
          </div>
        </div>
      )
    }


  return (
    <>
    <OverlayDrawer
      open={open}
      onOpenChange={(event, data) => handleClose()}
      position="end"
      size="large"
      ref={drawerRef}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={() => handleClose()}
            />
          }
        >
          {editMode ? "Edit User Details" : "Please fill the required fields to complete"}
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className="!w-full" style={{ overflow: "auto"}}>
        <div className="flex flex-col gap-1">
          {
            task?.configurationType?.toLowerCase() === "email" ?
                renderEmailConfigurationForm()
              :
              task?.configurationType?.toLowerCase() === 'shift'?
                renderShiftConfigurationForm()
              :
              null

          }

        </div>
      </DrawerBody>

      <DrawerFooter className="flex w-full items-center !justify-end overflow-visible pb-[200px] mt-5">
        <Button
          appearance="primary"
          disabled={isLoading || !value}
          onClick={() => handleProceedSubmitting()}
        >
          {isLoading ? <Spinner size="tiny" /> : "Submit"}
        </Button>
        <DialogTrigger disableButtonEnhancement>
          <Button appearance="secondary">Close</Button>
        </DialogTrigger>
      </DrawerFooter>

    </OverlayDrawer>
    {showADConfirmDialog && (
        <Dialog
          open={showADConfirmDialog}
          onOpenChange={(_, data) => {
            if (!isLoading) {
              handleCloseADConfirm()
            }
          }}
          modalType="modal"
        >
          <DialogSurface style={{ maxWidth: '75%', overflow: 'auto', height: 'fit-content' }}>
            <DialogTitle>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-100 text-green-600 flex justify-center items-center rounded-lg">
                              <Person24Regular />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Text size={400} weight="semibold">{editMode ? "Update User Account" : canAddEntra?"Create User Account":"Complete onboarding task"}</Text>
                              <Text size={200} weight="medium" className="text-gray-400">{editMode ? "Please review the details below before updating this account" : canAddEntra?"Please review the details below before creating this account":"Please confirm that the details below are accurate."}</Text>
                            </div>
                          </div>
                        </DialogTitle>
                        <DialogBody style={{ overflow: 'auto', maxHeight: 'calc(90vh - 180px)' }}>
            
                          <DialogContent>
                            <div className="space-y-4">
                              {/* Warning Message */}
                              {/* <MessageBar >
                                <MessageBarBody>
                                  <MessageBarTitle>Please verify the details below</MessageBarTitle>
                                  A new user account will be created in Active Directory with the following information.
                                  This action cannot be easily undone.
                                </MessageBarBody>
                              </MessageBar> */}
            
                              {/* <div className="w-full flex gap-3 justify-start items-start p-3 rounded-xl border-1 border-[#DBEAFE] bg-[#EFF6FFCC]">
                                <Shield20Regular className="text-[#2563EB]" />
                                <div className="flex flex-col gap-2">
                                  <Text size={300} weight="semibold" className="text-blue-800">Active Directory Creation</Text>
                                  <Text size={200} weight="medium" className="text-gray-400">A new Entra ID will be created in Active Directory with the following information. This action cannot be easily undone</Text>
                                </div>
                              </div> */}
            
                              {
                                (ApplicantData?.user?.firstName?.trim() !== firstName?.trim() ||
                                  ApplicantData?.user?.lastName?.trim() !== lastName?.trim()) &&
                                <MessageBar intent="warning">
                                  <MessageBarBody>
                                    <MessageBarTitle>Verify User Details Before Proceeding</MessageBarTitle>
                                    There is a mismatch between the applicant's name and the  user details. This will update the applicant's name in the system.                      </MessageBarBody>
                                </MessageBar>
                              }

                              {
                                editMode && originalWorkEmail &&
                                (canAddEntra ? workEmail?.trim().toLowerCase() !== originalWorkEmail.split("@")[0]?.trim().toLowerCase()
                                  : workEmail?.trim().toLowerCase() !== originalWorkEmail.trim().toLowerCase()) &&
                                <MessageBar intent="warning">
                                  <MessageBarBody>
                                    <MessageBarTitle>Login ID Will Be Changed</MessageBarTitle>
                                    The Organisation Email (Login ID) is being changed from <strong>{originalWorkEmail}</strong>. The user will no longer be able to sign in with the old ID and must use the new one.
                                  </MessageBarBody>
                                </MessageBar>
                              }
            
                              {/* AD User Details Card */}
                              <div className=" overflow-hidden">
                                <div className="p-3 border-b border-gray-200">
                                  <Body1Strong className="text-gray-700 flex items-center gap-2">
                                    <PersonAvailable20Regular />
                                    Employee Information
                                  </Body1Strong>
                                </div>
            
                                <div className="p-4 space-y-3 bg-white">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <Caption1 className="text-gray-500">First Name</Caption1>
                                      <Body1Strong className="block">{firstName}</Body1Strong>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <Caption1 className="text-gray-500">Last Name</Caption1>
                                      <Body1Strong className="block">{lastName}</Body1Strong>
                                    </div>
                                  </div>
                                  {/* <Divider /> */}
            
                                  <div className="grid grid-cols-2 gap-3">
            
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <Caption1 className="text-gray-500">Full Name</Caption1>
                                      <Body1Strong className="block">{fullName}</Body1Strong>
                                    </div>
            
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <Caption1 className="text-gray-500">Personal Email Address(Reference)</Caption1>
                                      <Body1Strong className="block text-gray-600">{ApplicantData?.user?.email}</Body1Strong>
                                    </div>
            
            
                                  </div>
            
                                  {/* <Divider /> */}
            
            
            
                                </div>
                              </div>
            
                              <div className=" overflow-hidden">
                                <div className="p-3 border-b border-gray-200">
                                  <Body1Strong className="text-gray-700 flex items-center gap-2">
                                    <Briefcase20Regular />
                                    Department & Role
                                  </Body1Strong>
                                </div>
            
                                <div className="p-4 space-y-3 bg-white">
            
            
            
            
                                  {/* <Divider /> */}
            
                                  <div className="grid grid-cols-2 gap-3">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <Caption1 className="text-gray-500">Department</Caption1>
                                      <Body1Strong className="block">{departmentName}</Body1Strong>
                                    </div>
            
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <Caption1 className="text-gray-500">Sub Department</Caption1>
                                      <Body1Strong className="block">{subDepartmentName ? subDepartmentName : "-"}</Body1Strong>
                                    </div>
            
                                  </div>
                                  {/* <Divider /> */}
            
            
                                  <div className="grid grid-cols-2 gap-3">
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <Caption1 className="text-gray-500">Designation</Caption1>
                                      <Body1Strong className="block">{jobTitle}</Body1Strong>
                                    </div>

                                    <div hidden={canAddEntra?false:true} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <Caption1 className="text-gray-500">Security Group</Caption1>
                                      <Body1Strong className="block">{faxNumberName}</Body1Strong>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <Caption1 className="text-gray-500">Manager</Caption1>
                                      <Body1Strong className="block">{managerName || "-"}</Body1Strong>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <Caption1 className="text-gray-500">Location</Caption1>
                                      <Body1Strong className="block">{officeLocationName || "-"}</Body1Strong>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <Caption1 className="text-gray-500">Mobile Number</Caption1>
                                      <Body1Strong className="block">{mobileNumber || "-"}</Body1Strong>
                                    </div>



                                  </div>
            
            
                                </div>
                              </div>
            
            
                              <div   className=" overflow-hidden">
                                <div className="p-3 border-b border-gray-200">
                                  <Body1Strong className="text-gray-700 flex items-center gap-2">
                                    <Settings20Regular />
                                    Account Details
                                  </Body1Strong>
                                </div>
            
                                <div className="p-4 space-y-3 bg-white">
            
            
            
            
                                  {/* <Divider /> */}
            
            
            
                                  {/* <Divider /> */}
                                  <div className="grid grid-cols-1 md:grid-cols-2">
            
                                    <div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                        <Caption1 className="text-gray-500">Organization Email Address(Login ID)</Caption1>
                                        <Body1Strong className="block">{workEmail}</Body1Strong>
            
                                      </div>
            
            
                                    </div>
            
                                    {/* <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                      <Caption1 className="text-gray-400">Date of Joining</Caption1>
                                      <Body1Strong className="block">
                                        {dateOfJoining?.toLocaleDateString("en-US", {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                      </Body1Strong>
                                    </div> */}
            
            
                                    {
                                      canAddEntra && assignLicense && selectedLiscense.length > 0 ?
            
                                        <div className="flex flex-col gap-3 mt-2">
                                          <Caption1 className="text-gray-500">License</Caption1>
                                          {selectedLiscense.map((skuId) => {
                                            const item = availableLiscense.find((license) => license.skuId === skuId);
                                            return (
                                              <Tag
                                                key={skuId}
                                                shape="rounded"
                                                media={<Avatar aria-hidden name={item?.skuPartNumber && LicenseList[item.skuPartNumber as keyof typeof LicenseList] ? LicenseList[item.skuPartNumber as keyof typeof LicenseList] : item?.skuPartNumber || skuId} color="colorful" />}
                                                value={skuId}
                                              >
                                                {item?.skuPartNumber && LicenseList[item.skuPartNumber as keyof typeof LicenseList] ? LicenseList[item.skuPartNumber as keyof typeof LicenseList] : item?.skuPartNumber || skuId}
                                              </Tag>
                                            );
                                          })}
                                        </div>
                                        :
                                        null
                                    }
                                  </div>
            
            
                                </div>
                              </div>
            
            
            
                              {/* Tasks Summary */}
                              {/* <div className="rounded-lg p-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200">
                        <div className="flex items-center justify-between">
                          <Caption1 className="text-gray-600">Induction Tasks to be assigned:</Caption1>
                          <Badge appearance="filled" color="brand">
                            {tasks.filter((t) => t.isRequired).length} tasks
                          </Badge>
                        </div>
                      </div> */}
            
                              {/* Final Confirmation Text */}
            
                              {/* <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <Caption1 className="text-blue-800">
                                  <strong>Note:</strong> By clicking "Confirm & Create User", the following actions will be performed:
                                </Caption1>
                                <ul className="mt-2 space-y-1 text-blue-700">
                                  <li className="flex items-center gap-2">
                                    <CheckmarkCircle20Filled className="text-blue-500 w-4 h-4" />
                                    <Caption1>Create new user in Active Directory</Caption1>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckmarkCircle20Filled className="text-blue-500 w-4 h-4" />
                                    <Caption1>Mark candidate as hired in the system</Caption1>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <CheckmarkCircle20Filled className="text-blue-500 w-4 h-4" />
                                    <Caption1>Assign induction tasks to respective owners</Caption1>
                                  </li>
                                </ul>
                              </div> */}
                            </div>
                          </DialogContent>
                        </DialogBody>
            <DialogActions style={{ paddingTop: '3%' }}>
              <Button
                appearance="secondary"
                onClick={() => handleCloseADConfirm()}
                disabled={isLoading}
              >
                Go Back & Edit
              </Button>
              <Button
                appearance="primary"
                onClick={handleProceedSubmit}
                disabled={isLoading}
                icon={isLoading ? <Spinner size="tiny" /> : <CheckmarkCircle20Filled />}
              >
                {isLoading ? (editMode ? "Updating User..." : canAddEntra? "Creating User..." : "Processing...") : editMode ? "Confirm & Update User" : canAddEntra ? "Confirm & Create User" : "Mark as Complete"}
              </Button>
            </DialogActions>
          </DialogSurface>
        </Dialog>
      )}

    </>

          
  );
};