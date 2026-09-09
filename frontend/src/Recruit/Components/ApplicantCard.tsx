import React, { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  CardFooter,
  Button,
  Checkbox,
  Badge,
  Caption1,
  Body1Strong,
  Persona,
  Divider,
  Tooltip,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Textarea,
  Field,
  Input,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
  Toaster,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Body1,
  AvatarGroup,
  AvatarGroupItem,
  AvatarGroupPopover,
  partitionAvatarGroupItems,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  FluentProvider,
  OverlayDrawer,
  Avatar,
  Subtitle1,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  InputOnChangeData,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  makeStyles,
  tokens,
  TableCell,
  Tag,
  SpinButton,
  Dropdown, Option,
  TagPicker,
  TagPickerControl,
  TagPickerGroup,
  TagPickerInput,
  TagPickerList,
  TagPickerOption,
  TagPickerProps,
  Label,
  Text,
  Combobox,
  ComboboxProps,
  Radio,
  RadioGroup,
  Switch,
} from "@fluentui/react-components";
import {
  CalendarClock24Regular,
  ChevronRight20Regular,
  CheckmarkCircle20Filled,
  Clock20Regular,
  Edit20Regular,
  PersonAvailable20Regular,
  BriefcaseSearch20Regular,
  Add20Regular,
  Dismiss20Regular,
  DismissCircle20Filled,
  Video20Regular,
  Phone20Regular,
  Building20Regular,
  Warning20Regular,
  ChevronDown20Regular,
  ChevronUp20Regular,
  DismissCircle20Regular,
  PhoneCheckmark20Filled,
  Link24Regular,
  Copy24Regular,
  Send24Regular,
  DocumentRegular,
  LocationRegular,
  PeopleCommunityRegular,
  DismissRegular,
  XboxConsoleFilled,
  Settings20Regular,
  Mail20Regular,
  Send20Regular,
  ChevronRight20Filled,
  CheckmarkCircle32Filled,
  Calendar16Filled,
  CalendarClock24Filled,
  Briefcase20Regular,
  Shield20Regular,
  Person20Regular,
  Person24Regular,
  Shield24Regular,
  ShieldCheckmark20Regular,
  ShieldCheckmark20Filled,
} from "@fluentui/react-icons";
import { useId } from "react";
import { Applicant, InterviewStage } from "../../Types/interview";
import {
  generateBGVToken,
  BGVTokenData,
  generateBGVTokenForApplicant,
  checkExistingBGVToken,
  ExistingTokenData,
} from "../../Services/BGVServices";
import { ApplicantDrawer } from "../Pages/ApplicantDrawer";
import { useAuth } from "../../Auth/AuthProvider";
import { fetchSkipInterviewStatus, getFaxNumbers, markCandidateAsHired, markCandidateAsHiredWithoutAd, saveSkipInterviewStatus } from "../../Services/Applicant";
import { acquireAdminToken } from "../../Auth/adminAuth";
import { ApiResponse } from "../../Services/UserAssignments";
import inductionAPI, { InductionTask } from "../../Services/EmployeeInduction";
import { ConfirmationDialog } from "./Interview Schedular/ConfirmationDialog";
import { FaxNumbersType } from "../../Types/applicants";
import { fetchAllActiveLiscense } from "../../Services/GraphAPI";
import { ActiveLicense } from "../../Types/license";
import LicenseList from '../../Common/License.json'
import { AuthError } from "@azure/msal-browser";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { getAssetRoleTemplates, getAssetRoleTemplateDetail, AssetRoleTemplateRecord } from "../../Asset/Services/AssetRoleTemplateService";
import { createAssetHRRequest } from "../../Asset/Services/AssetHRRequestService";
import { getUsersByDepartment, searchUsersWithoutDetails } from "../../Services/JDRequests";
import { UserDetails } from "../../Services/Offboarding";
import { getAppLocations, AppLocation } from "../../Services/Location";

const useStyles = makeStyles({
  truncatedText: {
    overflowX: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    backgroundColor: tokens.colorNeutralBackground1,
    borderRadius: "8px",
    border: "1px solid #E5E7EB",
    paddingBottom: "15px",
  },
  table: {
    width: "100%",
    minWidth: "600px",
  },
  formRow: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    "@media (min-width: 768px)": {
      flexDirection: "row",
    },
  },
  cell: {
    padding: "8px",
    verticalAlign: "top",
  },
  formField: {
    flex: 1,
    width: "100%",
    "@media (min-width: 768px)": {
      minWidth: "0",
    },
  },
  buttonContainer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "20px",
  },
  input: {
    width: "100%",
    minWidth: "100px",
  },
  mobileRow: {
    display: "flex",
    flexDirection: "column",
    borderBottom: "1px solid #ccc",
    padding: "10px 0",
  },
  mobileCell: {
    display: "flex",
    padding: "5px 0",
  },
  mobileLabel: {
    fontWeight: "bold",
    marginRight: "10px",
    minWidth: "40%",
  },
  mobileContent: {
    flex: 1,
  },
  mobileButtonContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "1rem",
  },
  error: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
    marginTop: "4px",
  },
  loadingOverlay: {
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    backdropFilter: "blur(2px)",
  },
  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "400px",
    flexDirection: "column",
    gap: "16px",
  },
  fields: {
    padding: "0px",
    border: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  combobox: {
    width: "100%",
    "& input": {
      width: "100%",
      backgroundColor: tokens.colorNeutralBackground1,
    },
  },
  comboboxListbox: {
    maxHeight: "300px",
    zIndex: 1000,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: "4px",
    boxShadow: tokens.shadow16,
  },
});

interface ApplicantCardProps {
  jobRole: string
  stages: InterviewStage[];
  jobId: string;
  applicant: Applicant;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  onSchedule?: () => void;
  onNavigate?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReschedule?: (interviewId: string) => void;
  onCancelInterview?: (interviewId: string) => void;
  isDraggable?: boolean;
  showActions?: boolean;
  compact?: boolean;
  onApprove?: (applicant: Applicant, feedback: string, salary: string, shouldSaveFeedback: boolean) => void;
  onReject?: (applicant: Applicant, reason: string) => void;
  isManualStage?: boolean;
  currentStage?: {
    name: string;
    description?: string;
  } | null;
  refreshData?: () => void;
  showTriggerNotification: boolean
  isSubordinate: boolean;
  designation?: string | null
  departmentId?: string | null
}



interface SkippedData {
  stageId: string;
  isActive: boolean
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






const ApplicantCard: React.FC<ApplicantCardProps> = ({
  jobRole,
  stages,
  jobId,
  applicant,
  isSelected = false,
  onSelect,
  onSchedule,
  onNavigate,
  onDragStart,
  onEdit,
  onReschedule,
  onCancelInterview,
  onApprove,
  onReject,
  isDraggable = false,
  showActions = true,
  compact = true,
  isManualStage = false,
  currentStage = null,
  refreshData,
  showTriggerNotification = false,
  isSubordinate = false,
  designation,
  departmentId
}) => {
  const [showAllInterviews, setShowAllInterviews] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [isApproving, setIsApproving] = useState(false);



  const styles = useStyles();

  // BGV Token Generator States
  const [showBGVDialog, setShowBGVDialog] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);
  const [dateOfJoining, setDateOfJoining] = useState(new Date())
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<BGVTokenData | null>(
    null
  );
  const [
    selectedApplicant,
    setSelectedApplicant,
  ]: any = useState<Applicant | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [bgvRequestId, setBgvRequestId] = useState<string>("");
  const [isSkipItemChanged, setIsSkiItemChanged] = useState<boolean>(false);
  const [bgvStatusInfo, setBgvStatusInfo] = useState<{
    hasSubmittedBGV: boolean;
    submissionDate?: string;
    bgvRequestId?: string;
    status?: string;
  } | null>(null);
  const [skippedStages, setSkippedStages] = useState<SkippedData[]>([]);
  const [LoadingSkipStatus, setLoadingSkipStatus] = useState<boolean>(false);
  const toastId = useId();
  const { currentUser, accessToken }: any = useAuth();
  const { dispatchToast } = useToastController(toastId);
  const [
    existingTokenData,
    setExistingTokenData,
  ] = useState<ExistingTokenData | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(false);

  // For joining date
  const [OpenJoiningDate, setOpenJoinoingDate] = useState(false)
  const [IsLoadingMarkAsHired, setIsLoadingMarkAsHired] = useState(false)

  const [tasks, setTasks] = useState<InductionTask[]>([]);

  const [IsFetchingTasks, setIsFetchingTasks] = useState(false)
  const [designationContext, setDesignationContext] = useState("")
  const [createAssetOnConfirm, setCreateAssetOnConfirm] = useState(false)
  const [assetRoles, setAssetRoles] = useState<AssetRoleTemplateRecord[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [selectedRoleCategoryNames, setSelectedRoleCategoryNames] = useState<string[]>([])
  const [selectedRoleCategoryIds, setSelectedRoleCategoryIds] = useState<string[]>([])
  const { mountNode: assetMountNode, portal: assetMountNodePortal } = useThemedMountNode();


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
  }) => {
    const [query, setQuery] = useState<string>(value);
    const [users, setUsers] = useState<UserDetails[]>([]);
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
          const results = await searchUsersWithoutDetails(query, accessToken);
          if (results) {
            setUsers(results);
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
      const selectedUser = users.find((u) => u.id === data.optionValue);
      if (selectedUser) {
        setQuery(selectedUser.displayName);
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

  // Hiring action chosen in the drawer. Permitted users may still pick "Confirm Hire Only"
  // (e.g. late joiners) and create the User ID later during onboarding; users without the
  // create_ad permission always follow the hire-only path as before.
  const [hireMode, setHireMode] = useState<"hire-and-create" | "hire-only">("hire-and-create");
  const shouldCreateEntraUser = canAddEntra && hireMode === "hire-and-create";


  useEffect(() => {
    if (designation) {
      setDesignationContext(designation)
    }
  }, [designation]);


  // Add these new state variables after existing state declarations
  const [firstName, setFirstName] = useState(applicant.firstName || "");
  const [lastName, setLastName] = useState(applicant.lastName || "");
  const [displayName, setDisplayName] = useState(`${applicant.firstName} ${applicant.lastName}` || "");
  const [department, setDepartment] = useState("");
  const [subDepartment, setSubDepartment] = useState("")
  const [jobTitle, setJobTitle] = useState("");
  const [departments, setDepartments] = useState<{ Name: string, Id: string }[]>([]);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const ORGANIZATION_DOMAIN =
    (import.meta.env.VITE_EMAIL_DOMAIN as string) ||
    "quadrasystems.net";
  const [organizationEmail, setOrganizationEmail] = useState(""); // NEW: Organization email
  const [SubDepartments, setSubDepartments] = useState<string[]>([]);
  const [IsSubDepartmentLoading, setIsSubDepartmentLoading] = useState(false);
  const [SelectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [OpenApproveDialog, setOpenApproveDialog] = useState(false)
  const [ApproveFeedback, setApproveFeedback] = useState("")
  const [PropposedSalary, setPropposedSalary] = useState("0")
  // Add this state after other state declarations
  const [showADConfirmDialog, setShowADConfirmDialog] = useState(false);
  const [managerId, setManagerId] = useState("");
  const [managerName, setManagerName] = useState("");
  const drawerRef = React.useRef<HTMLDivElement>(null);

  const [isLoadingFaxNumbers, setIsLoadingFaxNumber] = useState(false)
  const [FaxNumbers, setFaxNumbers] = useState<FaxNumbersType[]>([])
  const [selectedFaxNumberId, setSelectedFaxNumberId] = useState("")
  const [selectedFaxNumber, setSelectedFaxNumber] = useState("")
  const [assignLicense, setAssignLicense] = useState(false)

  const [isLoadingLocations, setIsLoadingLocations] = useState(false)
  const [officeLocations, setOfficeLocations] = useState<AppLocation[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState("")
  const [selectedLocationName, setSelectedLocationName] = useState("")
  const [mobileNumber, setMobileNumber] = useState(applicant.phone || "")

  const [availableLiscense, setAvailabelLiscense] = useState<ActiveLicense[]>([])
  const [selectedLiscense, setSelectedLicense] = useState<string[]>([])


  const onOptionSelect: TagPickerProps["onOptionSelect"] = (e, data) => {
    if (data.value === "no-options") {
      return;
    }
    setSelectedLicense(data.selectedOptions);
  };
  const tagPickerOptions = availableLiscense?.filter(
    (option) => !selectedLiscense.includes(option.skuId)
  );

  // AD Confirmation dialog
  const [OpenConfirmation, setOpenConfirmation] = useState(false);


  useEffect(() => {
    const mandatorySkuIds = (
      (import.meta.env.VITE_MANDATORY_SKU_IDS as string) ||
      "7e31c0d9-9551-471d-836f-32ee72be4a01,18a4bd3f-0b5b-4887-b04f-61dd0ee15f5e"
    )
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    let mandatoryLicenses = availableLiscense.filter((item) => mandatorySkuIds.includes(item.skuId))
    if (mandatoryLicenses.length > 0) {
      setSelectedLicense([...mandatoryLicenses.map((item) => item.skuId)])
    }
  }, [availableLiscense])


  const handleConfirmationOpen = () => {
    setOpenConfirmation(true)
  }

  const handleConfirmationClose = () => {
    setOpenConfirmation(false)
    setTimeout(() => {
      drawerRef.current?.focus();
    }, 0);
  }


  const handleCloseADConfirmDialog = () => {
    setShowADConfirmDialog(false);

    setTimeout(() => {
      drawerRef.current?.focus();
    }, 0);
  }





  // Add this useEffect to fetch departments when dialog opens
  useEffect(() => {
    const fetchDepartments = async () => {
      if (OpenJoiningDate) {
        setIsLoadingDepartments(true);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/department/entra-departmentswithactivecode`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const result = await response.json();
          if (result.success) {
            setDepartments(result.data);
            if (result.data.length > 0) {
              if (departmentId) {
                const matchedDept = result.data.find((dept: { Name: string; Id: string }) => dept.Id === departmentId);
                if (matchedDept) {
                  setDepartment(matchedDept.Name);
                  setSelectedDepartmentId(matchedDept.Id);
                }

              }
            }
          }
        } catch (error) {
          console.error("Error fetching departments:", error);
        } finally {
          setIsLoadingDepartments(false);
        }
      }
    };
    fetchDepartments();
  }, [OpenJoiningDate]);

  // Fetch office locations (same list shown in the Configuration Hub) when drawer opens
  useEffect(() => {
    const fetchLocations = async () => {
      if (OpenJoiningDate) {
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
      }
    };
    fetchLocations();
  }, [OpenJoiningDate]);

  // Add this constant OUTSIDE the component
  const MANUAL_LICENSES: ActiveLicense[] = [
    {
      skuId: "7e31c0d9-9551-471d-836f-32ee72be4a01",
      skuPartNumber: "Microsoft_Teams_Enterprise_New",
      consumedUnits: 0,
      enabledUnits: 9999,
      availableUnits: 9999,
      capabilityStatus: "Enabled",
    },
    {
      skuId: "18a4bd3f-0b5b-4887-b04f-61dd0ee15f5e",
      skuPartNumber: "Microsoft_365_E5_(no_Teams)",
      consumedUnits: 0,
      enabledUnits: 9999,
      availableUnits: 9999,
      capabilityStatus: "Enabled",
    },
  ];

  // Replace your existing useEffect that loads licenses:
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetchAllActiveLiscense(accessToken);
        if (response.success) {
          const filtered = response.data.filter(
            (item: ActiveLicense) => item.availableUnits > 0
          );

          // Only add manual licenses if they are NOT already present in the API response
          const existingSkuIds = new Set(filtered.map((item: ActiveLicense) => item.skuId));
          const missingManual = MANUAL_LICENSES.filter(
            (item) => !existingSkuIds.has(item.skuId)
          );

          const merged = [...filtered, ...missingManual];
          setAvailabelLiscense(merged);

          // Auto-select the 2 manual license skuIds (whether from API or manually added)
          const MANUAL_SKU_IDS = MANUAL_LICENSES.map((l) => l.skuId);
          const defaultSelected = merged
            .filter((item) => MANUAL_SKU_IDS.includes(item.skuId))
            .map((item) => item.skuId);

          setSelectedLicense((prev) => {
            const combined = [...new Set([...prev, ...defaultSelected])];
            return combined;
          });
        }
      } catch (error) {
        // console.log(error);
      }
    };

    if (assignLicense && OpenJoiningDate) {
      loadData();
    }
  }, [OpenJoiningDate, assignLicense]);

  useEffect(() => {
    const fetchSubDepartments = async () => {
      if (department && SelectedDepartmentId) {
        setIsSubDepartmentLoading(true);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/graphapi/get-sub-departments?department=${department}`, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
          const result = await response.json();
          if (result.success) {
            setSubDepartments(result.data);
          }
        } catch (error) {
          console.error("Error fetching sub-departments:", error);
        } finally {
          setIsSubDepartmentLoading(false);
        }
      }
    };
    fetchSubDepartments();
  }, [SelectedDepartmentId, accessToken]);

  useEffect(() => {
    const loadFaxNumbers = async () => {
      try {
        const data = await getFaxNumbers(accessToken)
        if (data) {
          setFaxNumbers(data)
        }

      }
      catch (error) {
        // console.log(error)
      }
    }

    loadFaxNumbers()
  }, [])


  // Auto-generate organization email when firstName or lastName changes
  useEffect(() => {
    if (OpenJoiningDate && firstName && lastName) {
      const generatedEmail = `${firstName?.toLowerCase()?.trim()?.split(" ")?.join("")}.${lastName?.toLowerCase()?.trim()?.split(" ")?.join("")}@${ORGANIZATION_DOMAIN}`;
      setOrganizationEmail(generatedEmail);

      setDisplayName(`${firstName?.trim()} ${lastName?.trim()}`);
    }
  }, [firstName, lastName, OpenJoiningDate]);

  // Update useEffect to set initial values when dialog opens
  useEffect(() => {
    if (OpenJoiningDate) {
      setFirstName(applicant.firstName || "");
      setLastName(applicant.lastName || "");
      setDisplayName(`${applicant.firstName || ""} ${applicant.lastName || ""}`.trim());
      setJobTitle(designationContext || "");
      setMobileNumber(applicant.phone || "");
      setHireMode("hire-and-create");
      // Generate initial organization email
      if (applicant.firstName && applicant.lastName) {

        setOrganizationEmail(`${applicant.firstName.toLowerCase()?.trim()?.split(" ")?.join("")}.${applicant.lastName.toLowerCase()?.trim()?.split(" ")?.join("")}@${ORGANIZATION_DOMAIN}`);
      }
    }
  }, [OpenJoiningDate, applicant]);





  useEffect(() => {
    if (!OpenJoiningDate) {
      setCreateAssetOnConfirm(false);
      setSelectedRoleId("");
      setSelectedRoleCategoryIds([]);
      setSelectedRoleCategoryNames([]);
      return;
    }
    getAssetRoleTemplates()
      .then(setAssetRoles)
      .catch((error) => console.error("Error fetching asset roles:", error));
  }, [OpenJoiningDate]);

  // Selecting a Role auto-resolves its categories — no manual category
  // picking. The role choice can't be persisted to this applicant's own
  // EntraADUsers row from here (their AD identity may not exist/be synced
  // yet at this point) — an admin assigns the actual Asset Role from the
  // Employees Asset List once the account is synced; this only drives what
  // gets requested now.
  useEffect(() => {
    if (!selectedRoleId) {
      setSelectedRoleCategoryIds([]);
      setSelectedRoleCategoryNames([]);
      return;
    }
    getAssetRoleTemplateDetail(selectedRoleId)
      .then((detail) => {
        setSelectedRoleCategoryIds(detail.items.map((i) => i.CategoryID));
        setSelectedRoleCategoryNames(detail.items.map((i) => `${i.CategoryName} x${i.Quantity}`));
      })
      .catch((error) => console.error("Error fetching role details:", error));
  }, [selectedRoleId]);

  const submitAssetRequestForApplicant = async () => {
    if (!createAssetOnConfirm || selectedRoleCategoryIds.length === 0) return;
    try {
      await createAssetHRRequest({
        requestedByUserId: currentUser?.userID || currentUser?.id,
        requestedByName: currentUser?.name || currentUser?.displayName,
        requestedByMail: currentUser?.email,
        applicants: [
          {
            ApplicantID: applicant.ID,
            ApplicantName: `${applicant.firstName} ${applicant.lastName}`,
            ApplicantMailID: applicant.email || "",
            JoiningDate: dateOfJoining ? dateOfJoining.toISOString().slice(0, 10) : null,
          },
        ],
        categoryIds: selectedRoleCategoryIds,
      });
      dispatchToast(
        <Toast>
          <ToastTitle>Asset request submitted</ToastTitle>
          <ToastBody>The asset request for {applicant.firstName} {applicant.lastName} has been raised.</ToastBody>
        </Toast>,
        { intent: "success" }
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unable to submit asset request";
      dispatchToast(
        <Toast>
          <ToastTitle>Joining confirmed, but asset request failed</ToastTitle>
          <ToastBody>{errorMessage}. Please raise the asset request separately.</ToastBody>
        </Toast>,
        { intent: "warning" }
      );
    }
  };

  // Modify handleMarkAsHired to include new fields
  const handleMarkAsHired = async () => {
    if (!dateOfJoining) {
      dispatchToast(
        <Toast>
          <ToastTitle>Missing Information</ToastTitle>
          <ToastBody>Date of joining is required to approve.</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    if (!designationContext && !jobTitle) {
      dispatchToast(
        <Toast>
          <ToastTitle>Missing Information</ToastTitle>
          <ToastBody>Candidate designation is required</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    if (shouldCreateEntraUser) {
      // Validate new AD user fields
      if (!firstName || !lastName || !displayName || !department || !managerId || !selectedLocationId || !mobileNumber?.trim()) {
        dispatchToast(
          <Toast>
            <ToastTitle>Missing Information</ToastTitle>
            <ToastBody>First Name, Last Name, Display Name, Manager, Department, Location and Mobile Number are required for AD user creation.</ToastBody>
          </Toast>,
          { intent: "error" }
        );
        return;
      }
    }



    try {
      setIsLoadingMarkAsHired(true);

      const filteredTasks = tasks.filter((task) => task.isRequired);



      // Include AD user data in the request
      const adUserData = {
        firstName,
        lastName,
        displayName,
        department,
        jobTitle: jobTitle || designationContext,
        personalEmail: applicant.email,
        organizationEmail: organizationEmail,
        faxNumber: selectedFaxNumber,
        faxNumberId: selectedFaxNumberId,
        subDepartmentId: null,
        division: subDepartment,
        departmentId: SelectedDepartmentId,
        managerId: managerId || undefined,
        managerName: managerName || undefined,
        officeLocation: selectedLocationName || undefined,
        mobilePhone: mobileNumber?.trim() || undefined,
      };


      if (shouldCreateEntraUser) {
        let adminToken: string;
        try {
          adminToken = await acquireAdminToken(currentUser?.email);
        } catch (adminAuthError: any) {
          if (adminAuthError?.message?.includes("Redirecting")) {
            // acquireTokenRedirect was triggered — page will reload after login, user must resubmit
            dispatchToast(
              <Toast>
                <ToastTitle>Authentication Required</ToastTitle>
                <ToastBody>Signing in to admin account. Please re-submit after the page reloads.</ToastBody>
              </Toast>,
              { intent: "info" }
            );
            return;
          }
          throw adminAuthError;
        }
        const response: ApiResponse<any> = await markCandidateAsHired(
          applicant.ID,
          accessToken,
          dateOfJoining,
          filteredTasks,
          designationContext,
          adUserData,
          assignLicense,
          selectedLiscense,
          currentUser?.userID || currentUser?.id,
          adminToken
        );

        if (response.data && !response.data?.success) {
          dispatchToast(
            <Toast>
              <ToastTitle>Error</ToastTitle>
              <ToastBody>Unable to mark candidate as hired</ToastBody>
            </Toast>,
            { intent: "error" }
          );
          return;
        }

        dispatchToast(
          <Toast>
            <ToastTitle>Success</ToastTitle>
            <ToastBody>Candidate marked as hired and AD user created successfully</ToastBody>
          </Toast>,
          { intent: "success" }
        );

        await submitAssetRequestForApplicant();
        setOpenJoinoingDate(false);
        setDateOfJoining(new Date());
        // Reset new fields
        setFirstName("");
        setLastName("");
        setDisplayName("");
        setDepartment("");
        setJobTitle("");
        setOrganizationEmail("");
        setSelectedLicense([]);
        setManagerId("");
        setManagerName("");
        setSelectedLocationId("");
        setSelectedLocationName("");
        setMobileNumber("");

        if (refreshData) refreshData();
      }
      else {
        const response: ApiResponse<any> = await markCandidateAsHiredWithoutAd(
          applicant.ID,
          accessToken,
          dateOfJoining,
          filteredTasks,
          designation = jobTitle || designationContext,
          adUserData,
          currentUser?.userID || currentUser?.id
        );

        if (response.data && !response.data?.success) {
          dispatchToast(
            <Toast>
              <ToastTitle>Error</ToastTitle>
              <ToastBody>Unable to mark candidate as hired</ToastBody>
            </Toast>,
            { intent: "error" }
          );
          return;
        }

        dispatchToast(
          <Toast>
            <ToastTitle>Success</ToastTitle>
            <ToastBody>Candidate marked as hired and AD user created successfully</ToastBody>
          </Toast>,
          { intent: "success" }
        );

        await submitAssetRequestForApplicant();
        setOpenJoinoingDate(false);
        setDateOfJoining(new Date());
        // Reset new fields
        setFirstName("");
        setLastName("");
        setDisplayName("");
        setDepartment("");
        setJobTitle("");
        setOrganizationEmail("");
        setSelectedLicense([]);
        setManagerId("");
        setManagerName("");
        setSelectedLocationId("");
        setSelectedLocationName("");
        setMobileNumber("");
        if (refreshData) refreshData();
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Unable to update applicant details";

      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>{errorMessage}</ToastBody>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsLoadingMarkAsHired(false);
    }
  };




  // Rename existing handleMarkAsHired to handleConfirmAndCreateAD
  const handleConfirmAndCreateAD = async () => {
    if (!dateOfJoining) {
      dispatchToast(
        <Toast>
          <ToastTitle>Missing Information</ToastTitle>
          <ToastBody>Date of joining is required to approve.</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    if (!designationContext && !jobTitle) {
      dispatchToast(
        <Toast>
          <ToastTitle>Missing Information</ToastTitle>
          <ToastBody>Candidate designation is required</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    if (shouldCreateEntraUser && !selectedFaxNumberId) {
      dispatchToast(
        <Toast>
          <ToastTitle>Missing Information</ToastTitle>
          <ToastBody>Security Group is required</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    if (shouldCreateEntraUser && !selectedLocationId) {
      dispatchToast(
        <Toast>
          <ToastTitle>Missing Information</ToastTitle>
          <ToastBody>Location is required</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    if (shouldCreateEntraUser && !mobileNumber?.trim()) {
      dispatchToast(
        <Toast>
          <ToastTitle>Missing Information</ToastTitle>
          <ToastBody>Mobile Number is required</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    if (shouldCreateEntraUser && assignLicense && selectedLiscense.length < 1) {
      dispatchToast(
        <Toast>
          <ToastTitle>Validation Error</ToastTitle>
          <ToastBody>Please add atleast 1 license to proceed</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    if (!firstName || !lastName || !displayName || !department) {
      dispatchToast(
        <Toast>
          <ToastTitle>Missing Information</ToastTitle>
          <ToastBody>First Name, Last Name, Display Name, and Department are required for AD user creation.</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    if (shouldCreateEntraUser) {
      // Validate new AD user fields


      if (!organizationEmail) {
        dispatchToast(
          <Toast>
            <ToastTitle>Missing Information</ToastTitle>
            <ToastBody>Organization Email is required for AD user creation.</ToastBody>
          </Toast>,
          { intent: "error" }
        );
        return;
      }
    }

    if (shouldCreateEntraUser) {
      // Show confirmation dialog
      setShowADConfirmDialog(true);
    }
    else {
      if (applicant.firstName !== firstName || applicant.lastName !== lastName) {
        handleConfirmationOpen()
        return;
      }

      handleMarkAsHired();
    }

  };




  const handleDesignationChange = (
    _e: React.ChangeEvent<HTMLInputElement>,
    data: InputOnChangeData
  ) => {
    // data.value is a string from the input
    // convert to Date if you want a Date in state
    setDesignationContext(data.value);
  };

  const handleDateChange = (
    _e: React.ChangeEvent<HTMLInputElement>,
    data: InputOnChangeData
  ) => {
    // data.value is a string from the input
    // convert to Date if you want a Date in state
    setDateOfJoining(new Date(data.value as string));
  };

  // Check if applicant is hired or rejected
  const isHired = applicant.currentPipeline?.stage?.stageName === "Hired";
  const isOffboarded = applicant.applicantStatus === 'Offboarded'
  const isRejected =
    applicant.applicantStatus === "Rejected" ||
    applicant.currentPipeline?.status === "Rejected";

  // Determine the order/sequence of the applicant's current stage (for disabling earlier stages)
  const currentStageOrder =
    applicant.currentPipeline?.stage?.stageOrder ??
    applicant.currentPipeline?.stage?.stageSequence ??
    -1;

  const isLastStage = (index: number) => index === stages.filter(item => item.Show).length - 1;


  // Check for existing token when BGV dialog opens
  useEffect(() => {
    if (showBGVDialog && !existingTokenData) {
      checkForExistingToken();
    }
  }, [showBGVDialog]);

  useEffect(() => {
    handleGetSkipInterviewStatus();
  }, [applicant.ID, jobId]);


  useEffect(() => {
    const fetchData = async () => {
      setIsFetchingTasks(true);
      try {


        // Fetch tasks using the API
        const tasksData = await inductionAPI.getInductionTasks(accessToken);

        setTasks(
          tasksData.map((task: any) => ({
            id: task.id,
            taskDescription: task.taskDescription,
            isQuantity: task.quantity,
            quantity: task.quantity ? 1 : 0,
            isRequired: true,
            completed: false,
            remarks: shouldCreateEntraUser && task.isConfiguration ? "Completed" : "",
            isConfiguration: task.isConfiguration ?? false,
            configurationType: task.configurationType ?? null,
            assignedTo: task.assignedTo || "",
            emailID: task.emailID || "",
            assignedUsers: task.assignedUsers || [],
            remainderDate: null,
            remainderCount: task.days,
            completedByName: "",
            completedByEmailID: "",
            completedByUserID: "",
            completedAt: null,
            isConfigured: task.isConfigured ?? false
          }))
        );

        // Fetch departments, locations, and designations in parallel


        // setDepartmentsContext(departments);
        // setDesignationsContext(designations);
      } catch (error) {
        console.error("Error fetching data:", error);
        dispatchToast(
          <Toast>
            <ToastTitle>Error</ToastTitle>
            <ToastBody>Failed to load data</ToastBody>
          </Toast>,
          { intent: "error" }
        );
      } finally {
        setIsFetchingTasks(false);
      }
    };

    if (accessToken && OpenJoiningDate && (!tasks || tasks.length === 0)) {
      fetchData();
    }
  }, [accessToken, OpenJoiningDate]);


  const handleLicenseChange = (state: boolean) => {
    setAssignLicense(state)
  }

  const handleSaveSkipInterviewStatus = async () => {
    try {
      setLoadingSkipStatus(true);
      const result = await saveSkipInterviewStatus(
        applicant.ID,
        accessToken,
        jobId,
        currentUser?.userID || "",
        applicant.currentPipeline?.pipelineId || "",
        skippedStages
      )
      // console.log("Save skip interview status result:", result);
      if (result.success) {
        setIsSkiItemChanged(false);
        handleGetSkipInterviewStatus();
        if (refreshData) {
          refreshData();
        }
      }
    }
    catch (error) {
      console.error("Error saving skip interview status:", error);
    }
    finally {
      setLoadingSkipStatus(false);
    }
  }

  // const handleGetSkipInterviewStatus = async () => {
  //   try {
  //     setLoadingSkipStatus(true);
  //     const result = await fetchSkipInterviewStatus(applicant.ID, accessToken, jobId);
  //     console.log("Skip interview status data:", result);
  //     if (result.success) {
  //       const skippedData: SkippedData[] = [];
  //       result.data.forEach((stage: any) => {
  //         skippedData.push({ stageId: stage.stageId, isActive: stage.isActive });
  //       });
  //       setSkippedStages(skippedData);
  //     }

  //   } catch (error) {
  //     console.error("Error fetching skip interview status:", error);
  //   }
  //   finally {
  //     setLoadingSkipStatus(false);
  //   }
  // }

  // console.log("Skipped stages state:", skippedStages);

  // const handleToggleSkipStage = (stageId: string) => {
  //   setIsSkiItemChanged(true);
  //   setSkippedStages((prev) => {
  //     const existing = prev.find((s) => s.stageId === stageId);
  //     if (existing) {
  //       return prev.map((s) =>
  //         s.stageId === stageId ? { ...s, isActive: !s.isActive } : s
  //       );
  //     } else {
  //       return [...prev, { stageId, isActive: true }];
  //     }
  //   });
  // };

  // const handleMarkAsHired = async () => {
  //   if (!dateOfJoining) {
  //     dispatchToast(
  //       <Toast>
  //         <ToastTitle>Missing Information</ToastTitle>
  //         <ToastBody>
  //           Date of joining is required to approve.
  //         </ToastBody>
  //       </Toast>,
  //       { intent: "error" }
  //     );
  //     return
  //   }

  //   if (!designationContext) {
  //     dispatchToast(
  //       <Toast>
  //         <ToastTitle>Missing Information</ToastTitle>
  //         <ToastBody>
  //           Candidate designation is required
  //         </ToastBody>
  //       </Toast>,
  //       { intent: "error" }
  //     );
  //     return
  //   }

  //   try {
  //     setIsLoadingMarkAsHired(true)

  //     const filteredTasks = tasks.filter((task) => task.isRequired);
  //     const response: ApiResponse<any> = await markCandidateAsHired(applicant.ID, accessToken, dateOfJoining, filteredTasks, designationContext)

  //     console.log("response", response)
  //     if (response.data && !response.data?.success) {
  //       dispatchToast(
  //         <Toast>
  //           <ToastTitle>Error</ToastTitle>
  //           <ToastBody>
  //             Unable to mark candidate as hired
  //           </ToastBody>
  //         </Toast>,
  //         { intent: "error" }
  //       );

  //       return;
  //     }

  //     dispatchToast(
  //       <Toast>
  //         <ToastTitle>Success</ToastTitle>
  //         <ToastBody>
  //           Candidate marked as hired successfully
  //         </ToastBody>
  //       </Toast>,
  //       { intent: "success" }
  //     );
  //     setOpenJoinoingDate(false)
  //     setDateOfJoining(new Date())
  //     if (refreshData)
  //       refreshData()
  //   }
  //   catch (error: unknown) {
  //     console.log("error", error)
  //     const errorMessage = error instanceof Error
  //       ? error.message
  //       : "Unable to update applicant details";

  //     dispatchToast(
  //       <Toast>
  //         <ToastTitle>Error</ToastTitle>
  //         <ToastBody>
  //           {errorMessage}
  //         </ToastBody>
  //       </Toast>,
  //       { intent: "error" }
  //     );
  //   }
  //   finally {
  //     setIsLoadingMarkAsHired(false)
  //   }
  // }

  const checkBGVStatusForHired = async () => {
    try {
      const result = await checkExistingBGVToken(applicant.ID, accessToken);
      if (result.success && result.data?.tokenData) {
        const tokenData = result.data.tokenData;
        setBgvStatusInfo({
          hasSubmittedBGV: tokenData.IsUsed || tokenData.TokenStatus === "USED",
          submissionDate: tokenData.UsedDate,
          bgvRequestId: tokenData.BGVFormattedID,
          status: tokenData.BGVStatus,
        });
      }
    } catch (error) {
      console.error("Error checking BGV status for hired candidate:", error);
    }
  };

  // console.log("IsSkipItemChanged:", isSkipItemChanged);

  // console.log("allStages", stages)

  useEffect(() => {
    if (isHired && !bgvStatusInfo) {
      checkBGVStatusForHired();
    }
  }, [isHired]);



  //   const handleSaveSkipInterviewStatus = async () => {
  //     try {
  //       setLoadingSkipStatus(true);
  //       const result = await saveSkipInterviewStatus(
  //         applicant.ID,
  //         accessToken,
  //         jobId,
  //         currentUser?.userID || "",
  //         applicant.currentPipeline?.pipelineId || "",
  //         skippedStages
  //       )
  //       console.log("Save skip interview status result:", result);
  //       if (result.success) {
  //         setIsSkiItemChanged(false);
  //         handleGetSkipInterviewStatus();
  //         if (refreshData) {
  //           refreshData();
  //         }
  //       }
  //   }
  //       catch (error) {
  //       console.error("Error saving skip interview status:", error);
  //       }
  //       finally{
  //         setLoadingSkipStatus(false);
  //       }
  // }


  const handleGetSkipInterviewStatus = async () => {
    try {
      setLoadingSkipStatus(true);
      const result = await fetchSkipInterviewStatus(applicant.ID, accessToken, jobId);
      // console.log("Skip interview status data:", result);
      if (result.success) {
        const skippedData: SkippedData[] = [];
        result.data.forEach((stage: any) => {
          skippedData.push({ stageId: stage.stageId, isActive: stage.isActive });
        });
        setSkippedStages(skippedData);
      }

    } catch (error) {
      console.error("Error fetching skip interview status:", error);
    }
    finally {
      setLoadingSkipStatus(false);
    }
  }

  // Check to assign license
  useEffect(() => {
    if (shouldCreateEntraUser) {
      setAssignLicense(true)
    }
    else {
      setAssignLicense(false)
    }
  }, [shouldCreateEntraUser])

  // Configuration tasks are auto-marked completed only when the user ID is created now;
  // in "Confirm Hire Only" mode they stay pending so the ID can be created during onboarding.
  useEffect(() => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.isConfiguration
          ? { ...task, remarks: shouldCreateEntraUser ? "Completed" : "" }
          : task
      )
    );
  }, [shouldCreateEntraUser])

  // console.log("Skipped stages state:", skippedStages);

  useEffect(() => {
    handleGetSkipInterviewStatus();
  }, [applicant.ID, jobId]);

  const checkForExistingToken = async () => {
    setIsCheckingToken(true);
    try {
      const result = await checkExistingBGVToken(applicant.ID, accessToken);
      if (result.success) {
        setExistingTokenData(result.data || null);
      }
    } catch (error) {
      console.error("Error checking existing token:", error);
    } finally {
      setIsCheckingToken(false);
    }
  };

  const handleTaskChange = (
    index: number,
    field: keyof InductionTask,
    value: string | number | boolean
  ) => {
    setTasks((prevTasks) => {
      const updatedTasks = [...prevTasks];
      const updatedTask = { ...updatedTasks[index] };
      // console.log(field);
      // console.log(currentUser);
      if (field === "quantity") {
        updatedTask.quantity = Math.max(0, Number(value));
      } else if (field === "completed") {
        updatedTask.completed = value as boolean;
        if (updatedTask.completed) {
          updatedTask.completedByName = currentUser.displayName;
          updatedTask.completedByEmailID = currentUser.email;
          updatedTask.completedByUserID = currentUser.userID;
          updatedTask.completedAt = new Date();
        } else {
          updatedTask.completedByName = "";
          updatedTask.completedByEmailID = "";
          updatedTask.completedByUserID = "";
          updatedTask.completedAt = null;
        }
      } else {
        (updatedTask[field] as any) = value;
      }

      updatedTasks[index] = updatedTask;
      return updatedTasks;
    });
  };


  const handleGenerateBGVToken = async (forceRegenerate: boolean = false) => {
    if (!applicant.firstName || !applicant.lastName || !applicant.email) {
      dispatchToast(
        <Toast>
          <ToastTitle>Missing Information</ToastTitle>
          <ToastBody>
            Applicant must have first name, last name, and email to generate BGV
            form.
          </ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    // console.log(applicant);
    setIsGenerating(true);
    try {
      const result = await generateBGVTokenForApplicant(
        applicant.ID,
        applicant.firstName,
        applicant.lastName,
        applicant.email,
        expiryDays,
        forceRegenerate,
        accessToken
      );

      if (result.success && result.data) {
        setGeneratedToken(result.data);
        setExistingTokenData(null);

        const title = result.isExtended
          ? "BGV Token Extended"
          : "BGV Token Generated";

        dispatchToast(
          <Toast>
            <ToastTitle>{title}</ToastTitle>
            <ToastBody>
              {result.isExtended
                ? `Expired token has been extended successfully. New expiry: ${new Date(
                  result.data.ExpiryDate
                ).toLocaleDateString()}`
                : `BGV form URL has been generated successfully. BGV Request ID: ${result.data.BGVFormattedID}`}
            </ToastBody>
          </Toast>,
          { intent: "success" }
        );
      } else {
        throw new Error(result.message || "Failed to generate token");
      }
    } catch (error) {
      console.error("Error generating BGV token:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Generation Failed</ToastTitle>
          <ToastBody>
            {error instanceof Error ? error.message : "An error occurred"}
          </ToastBody>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSkipStage = (stageId: string) => {
    setIsSkiItemChanged(true);
    setSkippedStages((prev) => {
      const existing = prev.find((s) => s.stageId === stageId);
      if (existing) {
        return prev.map((s) =>
          s.stageId === stageId ? { ...s, isActive: !s.isActive } : s
        );
      } else {
        return [...prev, { stageId, isActive: true }];
      }
    });
  };

  const handleViewDetails = (applicant: Applicant) => {
    // console.log(applicant);
    setSelectedApplicant(applicant);
    setIsDrawerOpen(true);
  };

  const resetBGVDialog = () => {
    setGeneratedToken(null);
    setExistingTokenData(null);
    setExpiryDays(30);
  };

  const getExistingTokenUrl = (token: string) => {
    const baseUrl = window.location.origin;
    return `${import.meta.env.VITE_FRONTEND_URL}/index_Public.html#/BGV/${token}`;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""
      }`.toUpperCase();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return { date: "N/A", time: "N/A" };

    try {
      const date = new Date(dateString);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const isTomorrow =
        new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString() ===
        date.toDateString();

      let dateDisplay = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });

      if (isToday) dateDisplay = "Today";
      else if (isTomorrow) dateDisplay = "Tomorrow";

      return {
        date: dateDisplay,
        time: date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        isUpcoming: date > now,
        isPast: date < now,
      };
    } catch (error) {
      console.warn("Invalid date format:", dateString);
      return {
        date: "Invalid Date",
        time: "",
        isUpcoming: false,
        isPast: false,
      };
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone20Regular className="w-4 h-4" />;
      case "virtual":
        return <Video20Regular className="w-4 h-4" />;
      case "in-person":
        return <Building20Regular className="w-4 h-4" />;
      default:
        return <CalendarClock24Regular className="w-4 h-4" />;
    }
  };

  const getOverallInterviewStatus = () => {
    const status = applicant.applicantStatus || "Pending";

    // Check if applicant is rejected
    if (isRejected) {
      return {
        badge: (
          <Badge
            color="danger"
            icon={<DismissCircle20Filled />}
            className="!border-0 !rounded-lg !px-4 !py-4 !bg-[#FEE2E2] !text-[#991B1B]"
          >
            Rejected
          </Badge>
        ),
        priority: 10,
      };
    }

    if (status === "Hired") {
      return {
        badge: (
          <Badge
            appearance="filled"
            color="success"
            icon={<PhoneCheckmark20Filled />}
          >
            Hired
          </Badge>
        ),
        priority: 0,
      };
    }

    if (status === "Offboarded") {
      return {
        badge: (
          <Badge
            appearance="filled"
            color="danger"
            icon={<Dismiss20Regular />}
          >
            Offboarded
          </Badge>
        ),
        priority: 0,
      };
    }

    if (isManualStage) {
      if (status === "Completed") {
        return {
          badge: (
            <Badge
              appearance="filled"
              color="success"
              icon={<CheckmarkCircle20Filled />}
            >
              Approved
            </Badge>
          ),
          priority: 1,
        };
      }

      if (status === "Rejected") {
        return {
          badge: (
            <Badge
              appearance="filled"
              color="danger"
              className="!border-0 !rounded-lg !px-4 !py-4 !bg-[#FEE2E2] !text-[#991B1B]"
            >
              Rejected
            </Badge>
          ),
          priority: 3,
        };
      }

      return {
        badge: (
          <Badge appearance="outline" color="warning">
            Pending Review
          </Badge>
        ),
        priority: 2,
      };
    }

    // For interview stages, only consider CURRENT stage interviews
    const scheduled = applicant.scheduledInterviews?.length || 0;
    const cancelled = applicant.cancelledInterviews?.length || 0;

    // Show status based on current stage interviews only
    if (scheduled > 0) {
      const upcomingCount =
        applicant.scheduledInterviews?.filter(
          (interview) => new Date(interview.scheduledDateTime) > new Date()
        ).length || 0;

      return {
        badge: (
          <Badge appearance="filled" color="brand">
            {upcomingCount > 0
              ? `${upcomingCount} Interview${upcomingCount > 1 ? "s" : ""} Scheduled`
              : `${scheduled} Past Due`}
          </Badge>
        ),
        priority: upcomingCount > 0 ? 2 : 4,
      };
    }

    if (cancelled > 0) {
      return {
        badge: (
          <Badge appearance="outline" color="danger">
            {cancelled} Cancelled
          </Badge>
        ),
        priority: 5,
      };
    }

    // If pipeline status is Pending and no interviews scheduled, show "No Interviews"
    return {
      badge: (
        <Badge appearance="outline" color="informative">
          No Interviews
        </Badge>
      ),
      priority: 6,
    };
  };

  const getAllInterviews = () => {
    if (isRejected) {
      const all = [
        ...(applicant.scheduledInterviews || []).map((interview) => ({
          ...interview,
          status: "Rejected",
        })),
        ...(applicant.completedInterviews || []).map((interview) => ({
          ...interview,
          status: "Rejected",
        })),
        ...(applicant.cancelledInterviews || []).map((interview) => ({
          ...interview,
          status: "Cancelled",
        })),
      ].sort(
        (a, b) =>
          new Date(b.scheduledDateTime).getTime() -
          new Date(a.scheduledDateTime).getTime()
      );
      return all;
    }

    // For active applicants, only show scheduled interviews
    const all = [
      ...(applicant.scheduledInterviews || []).map((interview) => ({
        ...interview,
        status: "Scheduled",
      })),
      // Remove completed interviews - they're from previous stages
      ...(applicant.cancelledInterviews || []).map((interview) => ({
        ...interview,
        status: "Cancelled",
      })),
    ].sort(
      (a, b) =>
        new Date(b.scheduledDateTime).getTime() -
        new Date(a.scheduledDateTime).getTime()
    );

    return all;
  };

  const handleCopyBGVUrl = async () => {
    if (!generatedToken) return;

    try {
      await navigator.clipboard.writeText(generatedToken.bgvUrl);
      dispatchToast(
        <Toast>
          <ToastTitle>URL Copied</ToastTitle>
          <ToastBody>BGV form URL has been copied to clipboard.</ToastBody>
        </Toast>,
        { intent: "success" }
      );
    } catch (error) {
      console.error("Error copying URL:", error);
      dispatchToast(
        <Toast>
          <ToastTitle>Copy Failed</ToastTitle>
          <ToastBody>Failed to copy URL to clipboard.</ToastBody>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  const handleSendBGVEmail = () => {
    if (!generatedToken || !applicant.email) return;

    const subject = encodeURIComponent("BGV Form - Action Required");
    const body = encodeURIComponent(`
Dear ${applicant.firstName} ${applicant.lastName},

Congratulations on your successful selection! Please complete your Background Verification form by clicking the link below:

${generatedToken.bgvUrl}

Important Notes:
- This link will expire on ${new Date(
      generatedToken.ExpiryDate
    ).toLocaleDateString()}
- The form can only be submitted once
- Please ensure all information is accurate before submitting

If you have any questions, please contact HR.

Best regards,
HR Team
    `);

    const mailtoUrl = `mailto:${applicant.email}?subject=${subject}&body=${body}`;
    window.open(mailtoUrl);
  };

  const handleBGVClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowBGVDialog(true);
  };

  const handleJoiningClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenJoinoingDate(true);
  }

  const getCardClasses = () => {
    const baseClasses = [
      "transition-all duration-300 ease-out cursor-pointer !shadow-none !border-none",
      " hover:-translate-y-1",
      "w-full",
    ];

    if (isSelected) {
      baseClasses.push(
        "bg-gradient-to-br from-blue-50 to-indigo-50",
        "border-2 border-blue-500",
        "shadow-lg shadow-blue-500/20"
      );
    } else {
      baseClasses.push("border border-gray-200 bg-white");
    }

    return baseClasses.filter(Boolean).join(" ");
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;

    if (
      target.closest("button") ||
      target.closest('input[type="checkbox"]') ||
      target.closest('[role="checkbox"]') ||
      target.closest('[role="menuitem"]') ||
      target.closest("a") ||
      target.closest("[tabindex]")
    ) {
      return;
    }

    if (onSelect) {
      onSelect(!isSelected);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", applicant.ID);
    onDragStart?.(e);
  };

  const handleScheduleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // console.log("Schedule clicked, onSchedule prop:", onSchedule); 
    onSchedule?.();
  };


  const handleOpenApproveDialog = (e: React.MouseEvent) => {
    if (!showTriggerNotification) {

      setOpenApproveDialog(true)
    }
    else {
      e.preventDefault();
      e.stopPropagation();
      onApprove?.(applicant, ApproveFeedback, PropposedSalary, false);
    }
  }

  const handleApproveClick = async (e: React.MouseEvent) => {

    const feedbackText = ApproveFeedback.replace(/<[^>]*>/g, '').trim();
    if (!feedbackText) {
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>
            Please enter feedback.
          </ToastBody>
        </Toast>,
        { intent: "error" }
      );

      return
    }
    if (feedbackText.length < 50) {
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>
            Please enter atleast 50 characters.
          </ToastBody>
        </Toast>,
        { intent: "error" }
      );

      return
    }

    // if (ApproveFeedback && ApproveFeedback?.length > 500) {
    //   dispatchToast(
    //     <Toast>
    //       <ToastTitle>Error</ToastTitle>
    //       <ToastBody>
    //         Please enter less than 500 characters.
    //       </ToastBody>
    //     </Toast>,
    //     { intent: "error" }
    //   );

    //   return
    // }

    if (isNaN(parseInt(PropposedSalary))) {
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>
            Please enter a valid salary
          </ToastBody>
        </Toast>,
        { intent: "error" }
      );

      return
    }

    if (!PropposedSalary?.trim() || parseInt(PropposedSalary) <= 0) {
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>
            Please recommend a salary greater than 0
          </ToastBody>
        </Toast>,
        { intent: "error" }
      );

      return
    }
    e.preventDefault();
    e.stopPropagation();
    setIsApproving(true);
    try {
      await onApprove?.(applicant, ApproveFeedback, PropposedSalary, true);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    onReject?.(applicant, rejectReason);
    setShowRejectDialog(false);
    setRejectReason("");
  };

  const handleRescheduleClick = (interviewId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onReschedule?.(interviewId);
  };

  const handleCancelClick = (interviewId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onCancelInterview?.(interviewId);
  };

  const allInterviews = getAllInterviews();
  const statusInfo = getOverallInterviewStatus();
  const visibleInterviews = showAllInterviews
    ? allInterviews
    : allInterviews.slice(0, 2);

  const renderInterviewCard = (interview: any, index: number) => {
    const dateTimeInfo = formatDateTime(interview.scheduledDateTime);
    const isScheduled = interview.status === "Scheduled";
    const isCompleted = interview.status === "Completed";
    const isCancelled = interview.status === "Cancelled";
    const isInterviewRejected = interview.status === "Rejected";
    // console.log("adsasda  d111111111111111111");
    return (
      <div
        key={interview.interviewId || index}
        className={`rounded-lg p-3 border ${isInterviewRejected
          ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
          : isCompleted
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
            : isCancelled
              ? "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
              : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
          }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Body1Strong
              className={`font-semibold ${isInterviewRejected
                ? "text-red-900"
                : isCompleted
                  ? "text-green-900"
                  : isCancelled
                    ? "text-red-900"
                    : "text-blue-900"
                }`}
            >
              {interview.title || `Interview ${index + 1}`}
            </Body1Strong>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              appearance="tint"
              color={
                isInterviewRejected
                  ? "danger"
                  : isCompleted
                    ? "success"
                    : isCancelled
                      ? "danger"
                      : "brand"
              }
              style={{ zIndex: 1 }}
              size="small"
            >
              {interview.status}
            </Badge>
            <Tooltip
              content={interview.type || "Cancelled"}
              relationship="label"
            >
              {getInterviewTypeIcon(interview.type)}
            </Tooltip>
          </div>
        </div>

        <div className="space-y-2 ">
          <div className="flex items-center gap-3">
            <CalendarClock24Regular
              className={`w-4 h-4 shrink-0 ${isInterviewRejected
                ? "text-red-600"
                : isCompleted
                  ? "text-green-600"
                  : isCancelled
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
            />
            <div className="flex items-center gap-2">
              <Caption1 className="text-gray-700 font-medium">
                {dateTimeInfo.date}{" "}
                <Caption1 className="text-gray-600">
                  at {dateTimeInfo.time}
                </Caption1>
              </Caption1>

              {dateTimeInfo.isPast && isScheduled && (
                <Warning20Regular
                  className="w-4 h-4 text-orange-500"
                  title="Past due"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock20Regular
              className={`w-4 h-4 shrink-0 ${isInterviewRejected
                ? "text-red-600"
                : isCompleted
                  ? "text-green-600"
                  : isCancelled
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
            />
            <Caption1 className="text-gray-600">
              {interview.duration} minutes
            </Caption1>
          </div>

          {interview.location && (
            <div className="flex items-center gap-3">
              <LocationRegular
                className={`w-4 h-4 shrink-0 ${isInterviewRejected
                  ? "text-red-600"
                  : isCompleted
                    ? "text-green-600"
                    : isCancelled
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
              />
              <Caption1 className="text-gray-600 ">
                {interview.location}
              </Caption1>
            </div>
          )}

          {interview.interviewers && interview.interviewers.length > 0 && (
            <div className="flex items-center gap-3">
              <PeopleCommunityRegular
                className={`w-4 h-4 shrink-0 ${isInterviewRejected
                  ? "text-red-600"
                  : isCompleted
                    ? "text-green-600"
                    : isCancelled
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
              />
              <div className="flex items-center gap-3">
                {(() => {
                  const interviewerNames = interview.interviewers.map(
                    (i: {
                      id: string;
                      displayName: string;
                      email: string;
                      isPrimary: boolean;
                      role: string;
                    }) => i.displayName
                  );

                  const {
                    inlineItems,
                    overflowItems,
                  }: any = partitionAvatarGroupItems({
                    items: interviewerNames,
                    layout: "stack",
                  });

                  return (
                    <AvatarGroup size={24} layout="stack" key="interviewers">
                      {inlineItems.map((name: string) => (
                        <AvatarGroupItem name={name} key={name} />
                      ))}
                      {overflowItems && (
                        <AvatarGroupPopover>
                          {overflowItems.map((name: string) => (
                            <AvatarGroupItem name={name} key={name} />
                          ))}
                        </AvatarGroupPopover>
                      )}
                    </AvatarGroup>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {!isManualStage &&
          !isHired &&
          !isRejected &&
          isScheduled &&
          (onReschedule || onCancelInterview) && (
            <div className="flex gap-2 pt-2 mt-3 border-t border-gray-200">
              {onReschedule && (
                <Button
                  size="small"
                  appearance="outline"
                  onClick={(e) =>
                    handleRescheduleClick(interview.interviewId, e)
                  }
                  icon={<Edit20Regular />}
                >
                  Reschedule
                </Button>
              )}
              {onCancelInterview && isSubordinate === false && (
                <Button
                  size="small"
                  appearance="subtle"
                  onClick={(e) => handleCancelClick(interview.interviewId, e)}
                  icon={<Dismiss20Regular />}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
      </div>
    );
  };

  const renderRejectedContent = () => {
    // console.log(applicant.currentPipeline);
    return (
      <div className="rounded-lg p-4 mb-4 border bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <DismissCircle20Filled className="w-4 h-4 shrink-0 text-red-600" />
            <Caption1 className="text-red-700 font-medium">
              This application has been rejected
            </Caption1>
          </div>

          <div className="flex items-center gap-3">
            <CalendarClock24Regular className="w-4 h-4 shrink-0 text-red-600" />
            <Caption1 className="text-gray-600">
              Rejected on:{" "}
              {new Date(
                applicant.currentPipeline?.modifiedAt || applicant.ModifiedAt
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Caption1>
          </div>

          {/* {applicant.currentPipeline?.stage && (
            <div className="flex items-center gap-3">
              <Caption1 className="text-gray-600">
                Rejected at stage: {applicant.currentPipeline.stage.stageName}
              </Caption1>
            </div>
          )} */}

          {applicant.currentPipeline?.rejectedReason && (
            <div className="pt-2 border-t border-red-200">
              <Caption1 className="text-gray-700 font-medium mb-1">
                Rejection Reason:
              </Caption1>
              <Caption1 className="text-gray-600">
                {applicant.currentPipeline.rejectedReason}
              </Caption1>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderHiredContent = () => {
    if (applicant.applicantStatus === "Hired") {
      return (
        <div className="rounded-lg p-4 mb-4 border bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between mb-3">
            <Body1Strong className="text-green-900 font-semibold">
              🎉 Congratulations! Candidate Hired
            </Body1Strong>
          </div>

          <div className="space-y-2">
            {/* <div className="flex items-center gap-3">
              <PhoneCheckmark20Filled className="w-4 h-4 shrink-0 text-green-600" />
              <Caption1 className="text-green-700 font-medium">
                Successfully completed the hiring process
              </Caption1>
            </div> */}

            <div className="flex items-center gap-3">
              <CalendarClock24Filled className="w-4 h-4 shrink-0 text-green-600" />
              <Caption1 className="text-gray-600">
                Hired on:{" "}
                {new Date(
                  applicant.currentPipeline?.createdAt || applicant.ModifiedAt
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Caption1>
            </div>

            <div className="flex items-center gap-3">
              <Calendar16Filled className="w-4 h-4 shrink-0 text-green-600" />
              <Caption1 className="text-gray-600">
                Date of Joining:{" "}
                {applicant.DateOfJoining ? new Date(applicant.DateOfJoining).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
                  :
                  "N/A"
                }
              </Caption1>
            </div>

            {currentStage?.name && (
              <div className="flex items-center gap-3">
                <Caption1 className="text-gray-600">
                  Final Stage: {currentStage.name}
                </Caption1>
              </div>
            )}

            {bgvStatusInfo?.hasSubmittedBGV && bgvStatusInfo.submissionDate ? (
              <div className="pt-2 border-t border-green-200 ">
                <div className="rounded-lg p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckmarkCircle20Filled className="w-4 h-4 text-blue-600" />
                    <Body1Strong className="text-blue-900">
                      BGV Form Submitted
                    </Body1Strong>
                    {bgvStatusInfo.bgvRequestId && (
                      <Badge appearance="tint" color="brand" size="small">
                        {bgvStatusInfo.bgvRequestId}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <CalendarClock24Regular className="w-4 h-4 shrink-0 text-blue-600" />
                      <Caption1 className="text-blue-700 font-medium">
                        Submitted on:{" "}
                        {new Date(
                          bgvStatusInfo.submissionDate
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </Caption1>
                    </div>

                    {bgvStatusInfo.status && (
                      <div className="flex items-center gap-3">
                        <DocumentRegular className="w-4 h-4 shrink-0 text-blue-600" />
                        <Caption1 className="text-blue-700">
                          Status: {bgvStatusInfo.status}
                        </Caption1>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              isSubordinate === false && <div className="pt-2 border-t border-green-200">
                <Button
                  size="small"
                  appearance="primary"
                  onClick={handleBGVClick}
                  icon={<DocumentRegular />}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Generate BGV Form
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }
    else if (applicant.applicantStatus === "hiring-pending") {
      return (
        <div className="rounded-lg p-4 mb-4 border bg-gradient-to-r from-yellow-50 to-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between mb-3">
            <Body1Strong className="text-green-900 font-semibold">
              Congratulations! Candidate cleared all the interviews
            </Body1Strong>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Warning20Regular className="w-4 h-4 shrink-0 text-gray-600" />
              <Caption1 className="text-gray-700 font-medium">
                Candidate completed the interview process, Confirmation is required for joining date
              </Caption1>
            </div>

            <div className="flex items-center gap-3">
              <CalendarClock24Regular className="w-4 h-4 shrink-0 text-gray-600" />
              <Caption1 className="text-gray-600">
                Confirmed on:{" "}
                {new Date(
                  applicant.currentPipeline?.createdAt || applicant.ModifiedAt
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Caption1>
            </div>

            {currentStage?.name && (
              <div className="flex items-center gap-3">
                <Caption1 className="text-gray-600">
                  Final Stage: {currentStage.name}
                </Caption1>
              </div>
            )}

            {(
              isSubordinate === false && <div className="pt-2 border-t border-yellow-200">
                <Button
                  size="small"
                  appearance="primary"
                  onClick={handleJoiningClick}
                  icon={<CheckmarkCircle20Filled />}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {canAddEntra ? 'Confirm Hire & Create User ID' : 'Confirm Hire'}
                </Button>
              </div>
            )}
          </div>
        </div>
      )
    }
    else {
      return (
        <div className="rounded-lg p-4 mb-4 border bg-gradient-to-r from-yellow-50 to-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between mb-3">
            <Body1Strong className="text-green-900 font-semibold">
              Congratulations! Candidate cleared all the interviews
            </Body1Strong>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Warning20Regular className="w-4 h-4 shrink-0 text-gray-600" />
              <Caption1 className="text-gray-700 font-medium">
                Candidate completed the interview process, waiting for onboarding
              </Caption1>
            </div>

            <div className="flex items-center gap-3">
              <CalendarClock24Regular className="w-4 h-4 shrink-0 text-gray-600" />
              <Caption1 className="text-gray-600">
                Confirmed on:{" "}
                {new Date(
                  applicant.currentPipeline?.createdAt || applicant.ModifiedAt
                ).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Caption1>
            </div>

            {currentStage?.name && (
              <div className="flex items-center gap-3">
                <Caption1 className="text-gray-600">
                  Final Stage: {currentStage.name}
                </Caption1>
              </div>
            )}


          </div>
        </div>
      )
    }

  };

  const renderManualStageContent = () => {
    // console.log(applicant.currentPipeline);

    return (
      <div className="rounded-lg p-4 border bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
        <div className="flex items-center justify-between mb-3">
          <Body1Strong className="text-amber-900 font-semibold">
            Manual Review Required
          </Body1Strong>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <CalendarClock24Regular className="w-4 h-4 shrink-0 text-gray-500" />
            <Caption1 className="text-gray-600">
              In stage since:{" "}
              {new Date(
                applicant.currentPipeline?.createdAt || applicant.CreatedAt
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Caption1>
          </div>

          {currentStage?.description && (
            <div className="flex items-center gap-3">
              <Caption1 className="text-gray-600">
                {currentStage.description}
              </Caption1>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOffboardedContent = () => {
    return (
      <div className="rounded-lg p-4 mb-4 border bg-gradient-to-r from-red-50 to-red-50 border-red-200">
        <div className="flex items-center justify-between mb-3">
          <Body1Strong className="text-amber-900 font-semibold">
            Employee Offboarded
          </Body1Strong>
        </div>

        <div className="space-y-2">


          <div className="flex items-center gap-3">
            <CalendarClock24Regular className="w-4 h-4 shrink-0 text-gray-500" />
            <Caption1 className="text-gray-600">
              In stage since:{" "}
              {new Date(
                applicant.currentPipeline?.createdAt || applicant.CreatedAt
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Caption1>
          </div>

          {currentStage?.description && (
            <div className="flex items-center gap-3">
              <Caption1 className="text-gray-600">
                {currentStage.description}
              </Caption1>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Card
        draggable={!isHired && !isRejected && isDraggable}
        onDragStart={handleDragStart}
        onClick={handleCardClick}
        className={getCardClasses()}

        style={{ borderRadius: "10px", width: "100%" }}
      >
        <CardHeader
          image={
            <>
              {isHired || isRejected ? (
                <></>
              ) : (
                <>
                  {onSelect && (
                    <div className="flex items-center">
                      <Checkbox
                        checked={isSelected}
                        onChange={(e, data) => {
                          e.stopPropagation();
                          onSelect(!!data.checked);
                        }}
                        className="transition-transform hover:scale-110"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          }
          header={
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-3 w-full flex-1">
                <div className="flex gap-2 items-center">
                  <Avatar
                    size={40}
                    color="colorful"
                    name={`${applicant.firstName} ${applicant.lastName}`}
                  ></Avatar>
                  <div className="flex flex-col justify-between">
                    <div className="flex items-center gap-2">
                      <Subtitle1 className="!text-sm">
                        {applicant.firstName} {applicant.lastName}
                      </Subtitle1>
                      <Caption1 className="!text-gray-400 !text-xs">
                        {applicant.ApplicantCode}
                      </Caption1>
                    </div>
                    <Caption1 className="!text-gray-500 !text-xs">
                      {applicant.email}
                    </Caption1>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">

                {
                  !isSubordinate && !isHired && !isRejected && <Menu persistOnItemClick positioning={{ autoSize: true }}>
                    <MenuTrigger disableButtonEnhancement>
                      <Button
                        size="small"
                        appearance="subtle"
                      >
                        <Settings20Regular />


                      </Button>

                    </MenuTrigger>

                    <MenuPopover >
                      {
                        LoadingSkipStatus ?
                          <div className="p-4"><Spinner size="small" /></div>
                          :
                          <MenuList>
                            {
                              stages.filter(item => item.Show).map((stage, index) => (
                                <MenuItem key={stage.ID}>
                                  <div className="flex gap-2 items-center">
                                    <Checkbox
                                      disabled={
                                        isHired ||
                                        isRejected ||
                                        LoadingSkipStatus ||
                                        isLastStage(index) ||
                                        (typeof stage.Order === "number" && currentStageOrder >= 0
                                          ? stage.Order < currentStageOrder
                                          : false)
                                      }
                                      checked={
                                        skippedStages.some(
                                          (s) => s.stageId === stage.ID && s.isActive
                                        )
                                      }
                                      onChange={() => {
                                        handleToggleSkipStage(stage.ID);
                                      }} />
                                    <span>{stage.InterviewName}</span>
                                  </div>
                                </MenuItem>
                              ))
                            }

                            <MenuItem disabled={skippedStages.length === 0 || !isSkipItemChanged}>
                              <Button
                                size="small"
                                appearance="primary"
                                onClick={() => {
                                  handleSaveSkipInterviewStatus();
                                }}
                                className="w-full"
                                disabled={skippedStages.length === 0 || isSkipItemChanged === false}
                              >
                                Skip
                              </Button>
                            </MenuItem>

                          </MenuList>
                      }

                    </MenuPopover>
                  </Menu>
                }
                <div className="flex flex-col gap-1 items-center">
                  <Caption1 className="!text-gray-400 !text-sm text-right">
                    In stage since
                  </Caption1>
                  <Subtitle1 className="!text-sm text-right">
                    {new Date(
                      applicant.currentPipeline?.createdAt ||
                      applicant.CreatedAt
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Subtitle1>
                </div>
                {statusInfo.badge}
                <Button
                  onClick={() => handleViewDetails(applicant)}
                  size="small"
                  appearance="transparent"
                >
                  <ChevronRight20Filled />
                </Button>
              </div>

            </div>
          }
        />

        <CardPreview className="px-4">
          {isRejected ? (
            renderRejectedContent()
          )
            :
            isOffboarded ? (
              renderOffboardedContent()
            )
              : isHired ? (
                renderHiredContent()
              ) : isManualStage ? (
                renderManualStageContent()
              ) : allInterviews.length > 0 ? (
                <div className="space-y-3">
                  {visibleInterviews.map((interview, index) =>
                    renderInterviewCard(interview, index)
                  )}

                  {allInterviews.length > 2 && (
                    <div className="flex justify-center pt-2">
                      <Button
                        appearance="subtle"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllInterviews(!showAllInterviews);
                        }}
                        icon={
                          showAllInterviews ? (
                            <ChevronUp20Regular />
                          ) : (
                            <ChevronDown20Regular />
                          )
                        }
                      >
                        {showAllInterviews
                          ? `Show Less`
                          : `Show ${allInterviews.length - 2} More Interviews`}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg p-4 border bg-gradient-to-r from-gray-50 to-slate-50 border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <Body1Strong className="text-gray-900 font-semibold">
                      Application Details
                    </Body1Strong>
                    <Badge appearance="tint" color="informative">
                      <Caption1>New Application</Caption1>
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <BriefcaseSearch20Regular className="w-4 h-4 shrink-0 text-blue-600" />
                      <Caption1 className="text-gray-700">
                        {applicant.experienced ? "Experienced" : "Fresher"}
                      </Caption1>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarClock24Regular className="w-4 h-4 shrink-0 text-gray-500" />
                      <Caption1 className="text-gray-600">
                        Applied:{" "}
                        {new Date(applicant.CreatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </Caption1>
                    </div>

                    {applicant.currentPipeline?.stage && (
                      <div className="flex items-center gap-3">
                        <PersonAvailable20Regular className="w-4 h-4 shrink-0 text-green-600" />
                        <Caption1 className="text-gray-600">
                          Stage: {applicant.currentPipeline.stage.stageName}
                        </Caption1>
                      </div>
                    )}
                  </div>
                </div>
              )}
        </CardPreview>

        {showActions && !isHired && !isRejected && (
          <CardFooter className="px-1 pb-2 flex gap-2 items-end justify-end">
            <div className="flex gap-2 items-end">
              {/* Always show approve/reject for manual stages, not just when isManualStage is true */}
              {(isManualStage && !isSubordinate) ? (
                <>
                  <Button
                    size="small"
                    appearance="primary"
                    onClick={handleOpenApproveDialog}
                    icon={<CheckmarkCircle20Filled />}
                    disabled={applicant.currentPipeline?.status === "Completed"}
                  >
                    Approve
                  </Button>
                  <Button
                    size="small"
                    appearance="outline"
                    onClick={handleRejectClick}
                    disabled={applicant.currentPipeline?.status === "Rejected"}
                  >
                    Reject
                  </Button>
                </>
              ) : !isSubordinate && allInterviews.every((inteview) => inteview.status?.toLowerCase() !== 'rescheduled' && inteview.status?.toLowerCase() !== 'scheduled' && inteview.scheduledDateTime) && (
                <Button
                  size="small"
                  appearance="primary"
                  onClick={handleScheduleClick}
                  icon={<Add20Regular />}
                >
                  Schedule New
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>

      {/* Joining date confirmation dialog */}
      {/* Joining Confirmation Drawer */}
      <OverlayDrawer
        open={OpenJoiningDate}
        ref={drawerRef}

        onOpenChange={(_, { open }) => {
          setOpenJoinoingDate(open);
          setSelectedLicense([])

          if (!open) {
            resetBGVDialog();
            setSelectedLicense([])
          }
        }}
        position="end"
        size="full"
        style={{ width: "90vw" }}
      >
        {assetMountNodePortal}
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<DismissRegular />}
                onClick={() => {
                  setOpenJoinoingDate(false);
                  resetBGVDialog();
                  setSelectedLicense([])
                }}
              />
            }
          >
            <div className="flex items-center gap-3">
              <span>{shouldCreateEntraUser ? 'Confirm Hire & Create User ID' : 'Confirm Hire'}</span>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ marginBottom: "50px", backgroundColor: "#F8FAFC", padding: "20px" }}>
          <div className="space-y-6">
            {/* Candidate Info Card */}
            <div className="rounded-xl p-4 shadow-md bg-white">
              <div className="flex items-start gap-5 justify-start">
                <Persona
                  textAlignment="start"
                  primaryText={`${applicant.firstName} ${applicant.lastName}`}
                  presence={{ status: "available" }}
                  secondaryText={applicant.email || "Not provided"}
                  tertiaryText={applicant.ApplicantCode}
                  avatar={{ color: "colorful" }}
                  size="large"
                />
                <Badge style={{ backgroundColor: "#cafad0" }} appearance="ghost" color="success">
                  Ready for Onboarding
                </Badge>
              </div>
            </div>

            {/* Hiring Action — only users with the create_ad permission get a choice */}
            {canAddEntra && (
              <div className="rounded-xl p-4 border border-gray-200 bg-white">
                <Field label="Hiring Action" required>
                  <RadioGroup
                    layout="horizontal"
                    value={hireMode}
                    onChange={(_e, data) => setHireMode(data.value as "hire-and-create" | "hire-only")}
                  >
                    <Radio value="hire-and-create" label="Confirm Hire & Create User ID" />
                    <Radio value="hire-only" label="Confirm Hire Only" />
                  </RadioGroup>
                </Field>
                {hireMode === "hire-only" && (
                  <Caption1 className="text-gray-500">
                    No User ID will be created now. It can be created later from the pending configuration task in the employee's onboarding.
                  </Caption1>
                )}
              </div>
            )}

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Employee Details */}
              <div className="space-y-4 col-span-2" >
                {/* AD User Creation Section */}

                {/* Personal Details */}
                <div className="rounded-xl p-4  border border-gray-200 bg-white" >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex justify-center items-center bg-[#EFF6FF] text-[#2563EB] rounded-lg">
                      <PersonAvailable20Regular />
                    </div>
                    <Body1Strong className="text-gray-900  flex items-center gap-2">

                      Employee Information
                    </Body1Strong>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                      <Field label="First Name" required>
                        <Input
                          type="text"
                          value={firstName}
                          onChange={(e, data) => setFirstName(data.value)}
                          placeholder="Enter first name"
                        />
                      </Field>

                      <Field label="Last Name" required>
                        <Input
                          type="text"
                          value={lastName}
                          onChange={(e, data) => setLastName(data.value)}
                          placeholder="Enter last name"
                        />
                      </Field>
                    </div>

                    <Field label="Full Name" required>
                      <Input
                        type="text"
                        value={displayName}
                        onChange={(e, data) => setDisplayName(data.value)}
                        placeholder="Enter display name"
                        disabled={shouldCreateEntraUser ? false : true}
                      />
                    </Field>

                    <Field
                      label="Personal Email Address(for reference)"
                      hint="Applicant's personal email, stored for reference"
                    >
                      <Input
                        type="email"
                        value={applicant.email || ""}
                        disabled
                        readOnly
                      />
                    </Field>

                    <Field
                      label="Mobile Number"
                      hint="Prefilled from the application, edit if required"
                      required={shouldCreateEntraUser}
                    >
                      <Input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e, data) => setMobileNumber(data.value)}
                        placeholder="Enter mobile number"
                      />
                    </Field>

                    <Field
                      label="Date of Joining"
                      hint="Tentative joining date of candidate"
                      required
                    >
                      <Input
                        type="date"
                        value={dateOfJoining ? dateOfJoining.toISOString().slice(0, 10) : ""}
                        onChange={handleDateChange}
                        min={new Date().toISOString().slice(0, 10)}
                      />
                    </Field>

                    <Field label="Create Asset Request" hint="Raise an IT asset request for this employee along with joining confirmation">
                      <Switch
                        checked={createAssetOnConfirm}
                        onChange={(_, data) => {
                          setCreateAssetOnConfirm(data.checked);
                          if (!data.checked) setSelectedRoleId("");
                        }}
                        label={createAssetOnConfirm ? "On" : "Off"}
                      />
                    </Field>

                    {createAssetOnConfirm && (
                      <>
                        <Field
                          label="Asset Role"
                          required
                          hint="The role's categories and quantities are requested automatically"
                        >
                          <Dropdown
                            placeholder="Select a role"
                            mountNode={assetMountNode}
                            selectedOptions={selectedRoleId ? [selectedRoleId] : []}
                            value={assetRoles.find((r) => r.ID === selectedRoleId)?.RoleName ?? ""}
                            onOptionSelect={(_, data) => setSelectedRoleId(data.optionValue ?? "")}
                          >
                            {assetRoles.length === 0 ? (
                              <Option key="none" value="" disabled>
                                No Asset Roles configured
                              </Option>
                            ) : (
                              assetRoles.map((r) => (
                                <Option key={r.ID} value={r.ID} text={r.RoleName}>
                                  {r.RoleName}
                                </Option>
                              ))
                            )}
                          </Dropdown>
                        </Field>
                        {selectedRoleCategoryNames.length > 0 && (
                          <Text size={200} style={{ color: "#605E5C" }}>
                            Will request: {selectedRoleCategoryNames.join(", ")}
                          </Text>
                        )}
                      </>
                    )}




                    {/* {canAddEntra && organizationEmail && (
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <Caption1 className="text-blue-800">
                          <strong>Preview:</strong> User will login with: <code>{organizationEmail}</code>
                        </Caption1>
                      </div>
                    )} */}
                  </div>
                </div>

                {/* Job specific info */}
                <div className="rounded-xl p-4  border border-gray-200 bg-white" >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex justify-center items-center bg-[#FAF5FF] text-[#9333EA] rounded-lg">
                      <Briefcase20Regular />
                    </div>
                    <Body1Strong className="text-gray-900  flex items-center gap-2">

                      Department & Role
                    </Body1Strong>
                  </div>
                  <div className="space-y-4">

                    <Field label="Designation">
                      <Input
                        type="text"
                        value={jobTitle || designationContext}
                        onChange={(e, data) => setJobTitle(data.value)}
                        placeholder="Enter job title"
                      />
                    </Field>

                    <Field label="Department" required>
                      {isLoadingDepartments ? (
                        <Spinner size="tiny" label="Loading departments..." />
                      ) : (
                        <Dropdown
                          placeholder="Select department"
                          value={department}
                          onOptionSelect={(e, data) => {
                            const selectedDeptId = data.optionValue || "";
                            const dept = departments.find((d) => d.Id === selectedDeptId);
                            setDepartment(dept?.Name || "");
                            setSelectedDepartmentId(selectedDeptId);
                            setSubDepartment("")
                          }}

                        >
                          {departments.map((dept) => (
                            <Option key={dept.Id} value={dept.Id}>
                              {dept.Name}
                            </Option>
                          ))}
                        </Dropdown>
                      )}
                    </Field>

                    {
                      shouldCreateEntraUser && (
                        <Field label="Sub Department" >
                          {IsSubDepartmentLoading ? (
                            <Spinner size="tiny" label="Loading sub departments..." />
                          ) : (
                            <Dropdown
                              placeholder="Select sub department"
                              value={subDepartment}
                              defaultValue={subDepartment}
                              onOptionSelect={(e, data) => {
                                setSubDepartment(data.optionValue || "");
                              }}
                              disabled={SubDepartments.length === 0}
                            >
                              {SubDepartments.map((dept) => (
                                <Option key={dept} value={dept} text={dept}>
                                  {dept}
                                </Option>
                              ))}
                            </Dropdown>
                          )}
                        </Field>
                      )
                    }

                    {
                      shouldCreateEntraUser && (
                        <Field>
                          <UserCombobox
                            label="Manager"
                            placeholder="Enter Employee Name"
                            value={managerName}
                            onUserSelect={(user) => {
                              setManagerId(user?.id || "");
                              setManagerName(user?.displayName || "");
                            }}
                            disabled={false}
                          />
                        </Field>
                      )
                    }





                    {
                      shouldCreateEntraUser && (
                    <Field label="Location" required>
                      {isLoadingLocations ? (
                        <Spinner size="tiny" label="Loading locations..." />
                      ) : (
                        <Dropdown
                          placeholder="Select location"
                          value={selectedLocationName}
                          onOptionSelect={(e, data) => {
                            const selectedLoc = officeLocations.find((loc) => loc.Id === data.optionValue);
                            setSelectedLocationId(data.optionValue || "");
                            setSelectedLocationName(selectedLoc?.Name || "");
                          }}
                          disabled={officeLocations.length === 0}
                        >
                          {officeLocations.map((loc) => (
                            <Option key={loc.Id} value={loc.Id} text={loc.Name}>
                              {loc.Name}
                            </Option>
                          ))}
                        </Dropdown>
                      )}
                    </Field>
                      )
                    }



                    {/* {canAddEntra && organizationEmail && (
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <Caption1 className="text-blue-800">
                          <strong>Preview:</strong> User will login with: <code>{organizationEmail}</code>
                        </Caption1>
                      </div>
                    )} */}
                  </div>
                </div>

                {/* Entra Setup */}
                <div hidden={shouldCreateEntraUser ? false : true} className="rounded-xl p-4  border border-gray-200 bg-white" >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex justify-center items-center bg-[#FFEDD5] text-[#EA580C] rounded-lg">
                      <Shield20Regular />
                    </div>
                    <Body1Strong className="text-gray-900  flex items-center gap-2">

                      Account Details
                    </Body1Strong>
                  </div>
                  <div className="space-y-4">

                    <Field label="Security Group" required>
                      {isLoadingFaxNumbers ? (
                        <Spinner size="tiny" label="Loading Security Group..." />
                      ) : (
                        <Dropdown
                          placeholder="Select Security Group"
                          value={FaxNumbers.find(dept => dept.id === selectedFaxNumberId)?.costCenter}
                          defaultValue={FaxNumbers.find(dept => dept.id === selectedFaxNumberId)?.costCenter}
                          onOptionSelect={(e, data) => {
                            const selecteNumber = FaxNumbers.find(fax => fax.id === data.optionValue);
                            setSelectedFaxNumberId(data.optionValue || "");
                            setSelectedFaxNumber(selecteNumber?.costCenter || "");
                          }}
                          disabled={FaxNumbers.length === 0}

                        >
                          {FaxNumbers.map((fax) => (
                            <Option key={fax.id} value={fax.id} text={fax.costCenter}>
                              {fax.costCenter}
                            </Option>
                          ))}
                        </Dropdown>
                      )}
                    </Field>


                    <Field
                      label="Organization Email Address(Login ID)"
                      required
                      hint={`User's login email ending with @${ORGANIZATION_DOMAIN}`}

                    >
                      <Input
                        type="email"
                        value={organizationEmail}
                        onChange={(e, data) => setOrganizationEmail(data.value.toLowerCase())}
                        placeholder={`firstname.lastname@${ORGANIZATION_DOMAIN}`}
                        disabled={!shouldCreateEntraUser}
                      />
                    </Field>

                    {
                      shouldCreateEntraUser &&
                      <div className="border-1 border-gray-200 rounded-xl p-5 flex flex-col gap-5 justify-center items-center">
                        <div className={`w-full p-3 bg-[#D1FAE5] ${shouldCreateEntraUser ? "text-green-700" : "text-gray-700"} flex justify-between items-center rounded-lg`}>
                          <div className="flex gap-2 items-center">
                            <div className="w-5 h-5 bg-green-800 flex items-center justify-center rounded-sm p-1">
                              <ShieldCheckmark20Filled className="w-4 h-4 text-white" />
                            </div>
                            <Body1Strong>Assign License</Body1Strong>
                          </div>
                          <Checkbox
                            checked={assignLicense}
                            onChange={(e, data) => {
                              handleLicenseChange(!assignLicense);
                              setSelectedLicense([]);
                            }}
                            disabled={!shouldCreateEntraUser}
                            indicator={{
                              style: { backgroundColor: assignLicense ? "#016630" : "#fff" }
                            }}
                          />



                        </div>

                        <Field className="w-full" aria-placeholder="Select License" label="License">
                          <TagPicker
                            onOptionSelect={onOptionSelect}
                            selectedOptions={selectedLiscense}
                            disabled={assignLicense ? false : true}
                          >
                            <TagPickerControl>
                              <TagPickerGroup aria-label="License">
                                {selectedLiscense.map((skuId) => {
                                  const item = availableLiscense.find((license) => license.skuId === skuId);
                                  return (
                                    <Tag
                                      key={skuId}
                                      shape="rounded"
                                      media={<Avatar aria-hidden name={item?.skuPartNumber && LicenseList[item.skuPartNumber as keyof typeof LicenseList] ? LicenseList[item.skuPartNumber as keyof typeof LicenseList] : item?.skuPartNumber || skuId} color="colorful" />}
                                      value={skuId}
                                      size="small"
                                    >
                                      {item?.skuPartNumber && LicenseList[item.skuPartNumber as keyof typeof LicenseList] ? LicenseList[item.skuPartNumber as keyof typeof LicenseList] : item?.skuPartNumber || skuId}
                                    </Tag>
                                  );
                                })}
                              </TagPickerGroup>
                              <TagPickerInput aria-label="Select Employees" />
                            </TagPickerControl>
                            <TagPickerList>
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
                </div>

              </div>

              {/* Right Column - Induction Tasks */}
              <div className="rounded-xl border border-gray-200 overflow-hidden col-span-1 p-5 bg-white">
                <Body1Strong className="flex items-center gap-2">
                  Onboarding Tasks
                </Body1Strong>

                <div className=" overflow-y-auto h-full">
                  {/* <Table size="small" className={styles.table}>
                    <TableHeader
                      style={{
                        background: "linear-gradient(90deg, #F9FAFB 0%, #F3F4F6 100%)",
                        position: "sticky",
                        top: 0,
                        zIndex: 1,
                      }}
                    >
                      <TableRow>
                        <TableHeaderCell style={{ width: "35%" }} className={styles.cell}>
                          <Body1Strong>Task Description</Body1Strong>
                        </TableHeaderCell>
                        <TableHeaderCell style={{ width: "25%" }} className={styles.cell}>
                          <Body1Strong>Task Owner</Body1Strong>
                        </TableHeaderCell>
                        <TableHeaderCell style={{ width: "12%" }} className={styles.cell}>
                          <Body1Strong>Qty</Body1Strong>
                        </TableHeaderCell>
                        <TableHeaderCell style={{ width: "10%" }} className={styles.cell}>
                          <Body1Strong>Required</Body1Strong>
                        </TableHeaderCell>
                        <TableHeaderCell style={{ width: "18%" }} className={styles.cell}>
                          <Body1Strong>Remarks</Body1Strong>
                        </TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {IsFetchingTasks ? (
                        <TableRow>
                          <TableCell colSpan={5} style={{ textAlign: "center", padding: "40px" }}>
                            <Spinner label="Loading tasks..." />
                          </TableCell>
                        </TableRow>
                      ) : tasks.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} style={{ textAlign: "center", padding: "40px" }}>
                            <Caption1>No induction tasks available</Caption1>
                          </TableCell>
                        </TableRow>
                      ) : (
                        tasks.map((task, index) => (
                          <TableRow key={task.id}>
                            <TableCell className={styles.cell}>
                              <Body1Strong style={{ fontSize: "12px" }}>{task.taskDescription}</Body1Strong>
                            </TableCell>
                            <TableCell className={styles.cell}>
                              <div className="flex gap-1 flex-wrap">
                                {task.assignedUsers && task.assignedUsers.length > 0
                                  ? task.assignedUsers.map((user: any) => (
                                    <Tag
                                      key={user.id}
                                      size="small"
                                      shape="rounded"
                                      style={{ backgroundColor: "transparent", height: "auto" }}
                                      media={
                                        <Avatar
                                          aria-hidden
                                          name={user.name}
                                          color="colorful"
                                          size={20}
                                        />
                                      }
                                    >
                                      <span style={{ fontSize: "10px" }}>{user.name}</span>
                                    </Tag>
                                  ))
                                  : task.assignedTo
                                    .split(";")
                                    .filter((name: string) => name.trim())
                                    .slice(0, 2)
                                    .map((name: string) => (
                                      <Tag
                                        key={name}
                                        size="small"
                                        shape="rounded"
                                        style={{ backgroundColor: "transparent", height: "auto" }}
                                        media={
                                          <Avatar
                                            aria-hidden
                                            name={name}
                                            color="colorful"
                                            size={20}
                                          />
                                        }
                                      >
                                        <span style={{ fontSize: "10px" }}>{name}</span>
                                      </Tag>
                                    ))}
                              </div>
                            </TableCell>
                            <TableCell className={styles.cell}>
                              <SpinButton
                                value={task.quantity}
                                min={1}
                                step={1}
                                size="small"
                                disabled={!task.isQuantity}
                                onChange={(e, data) =>
                                  handleTaskChange(index, "quantity", Number(data.value) || 0)
                                }
                                style={{ width: "70px" }}
                              />
                            </TableCell>
                            <TableCell className={styles.cell}>
                              <Checkbox
                                checked={task.isRequired}
                                onChange={(e, data) =>
                                  handleTaskChange(index, "isRequired", data.checked)
                                }
                                disabled={task.isConfiguration?true:false}
                              />
                            </TableCell>
                            <TableCell className={styles.cell}>
                              <Textarea
                                value={task.remarks}
                                placeholder="Comments"
                                size="small"
                                resize="vertical"
                                onChange={(e) =>
                                  handleTaskChange(index, "remarks", e.target.value)
                                }
                                disabled={shouldCreateEntraUser && task.isConfiguration?true:false}
                                style={{ minHeight: "32px", fontSize: "11px" ,width:"100%"}}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table> */}

                  <div className="flex flex-col gap-5 justify-center items-center mt-5">
                    {IsFetchingTasks ? (
                      <div>
                        <div style={{ textAlign: "center", padding: "40px" }}>
                          <Spinner label="Loading tasks..." />
                        </div>
                      </div>
                    ) : tasks.length === 0 ? (
                      <div>
                        <div style={{ textAlign: "center", padding: "40px" }}>
                          <Caption1>No induction tasks available</Caption1>
                        </div>
                      </div>
                    ) : (
                      tasks.map((task, index) => (
                        <div className="border-1 border-[#E2E8F0] rounded-lg  w-full p-5" key={task.id}>
                          <div className="flex w-full gap-5 items-center">
                            <div>
                              <Checkbox
                                checked={task.isRequired}
                                onChange={(e, data) =>
                                  handleTaskChange(index, "isRequired", data.checked)
                                }
                                disabled={task.isConfiguration ? true : false}
                              />
                            </div>
                            <div className="flex flex-col gap-3">
                              <Body1Strong style={{ fontSize: "14px" }}>{task.taskDescription}</Body1Strong>
                              <div className="flex gap-3 w-fit">

                                {task.assignedUsers && task.assignedUsers.length > 0 && (
                                  <div>
                                    {(() => {
                                      // Extract display names for avatars
                                      const assignedUsers = task.assignedUsers.map(
                                        (i) => i.name
                                      );

                                      const {
                                        inlineItems,
                                        overflowItems,
                                      }: any = partitionAvatarGroupItems({
                                        items: assignedUsers,
                                        layout: "stack",
                                      });

                                      return (
                                        <FluentProvider className="!bg-transparent">
                                          <div className="flex flex-col gap-2 text-xs">
                                            <AvatarGroup
                                              size={24}
                                              layout="stack"
                                              key="interviewers"
                                            >
                                              {inlineItems.map((name: string) => (
                                                <Tooltip content={name} relationship="label" key={name}>
                                                  <AvatarGroupItem name={name} />
                                                </Tooltip>
                                              ))}
                                              {overflowItems && (
                                                <AvatarGroupPopover>
                                                  {overflowItems.map((name: string) => (
                                                    <AvatarGroupItem
                                                      name={name}
                                                      key={name}
                                                    />
                                                  ))}
                                                </AvatarGroupPopover>
                                              )}
                                            </AvatarGroup>
                                          </div>
                                        </FluentProvider>
                                      );
                                    })()}


                                  </div>
                                )}

                                <Divider vertical />

                                <SpinButton
                                  value={task.quantity}
                                  min={1}
                                  step={1}
                                  size="small"
                                  disabled={true}
                                  onChange={(e, data) =>
                                    handleTaskChange(index, "quantity", Number(data.value) || 0)
                                  }
                                  style={{ width: "70px" }}
                                />



                                {/* <Divider vertical />

                                <SpinButton
                                  value={task.quantity}
                                  min={1}
                                  step={1}
                                  size="small"
                                  disabled={!task.isQuantity}
                                  onChange={(e, data) =>
                                    handleTaskChange(index, "quantity", Number(data.value) || 0)
                                  }
                                  style={{ width: "70px" }}
                                /> */}
                              </div>
                            </div>
                          </div>
                          {/* <TableCell className={styles.cell}>
                            </TableCell>
                            <TableCell className={styles.cell}>
                              <div className="flex gap-1 flex-wrap">
                                {task.assignedUsers && task.assignedUsers.length > 0
                                  ? task.assignedUsers.map((user: any) => (
                                    <Tag
                                      key={user.id}
                                      size="small"
                                      shape="rounded"
                                      style={{ backgroundColor: "transparent", height: "auto" }}
                                      media={
                                        <Avatar
                                          aria-hidden
                                          name={user.name}
                                          color="colorful"
                                          size={20}
                                        />
                                      }
                                    >
                                      <span style={{ fontSize: "10px" }}>{user.name}</span>
                                    </Tag>
                                  ))
                                  : task.assignedTo
                                    .split(";")
                                    .filter((name: string) => name.trim())
                                    .slice(0, 2)
                                    .map((name: string) => (
                                      <Tag
                                        key={name}
                                        size="small"
                                        shape="rounded"
                                        style={{ backgroundColor: "transparent", height: "auto" }}
                                        media={
                                          <Avatar
                                            aria-hidden
                                            name={name}
                                            color="colorful"
                                            size={20}
                                          />
                                        }
                                      >
                                        <span style={{ fontSize: "10px" }}>{name}</span>
                                      </Tag>
                                    ))}
                              </div>
                            </TableCell>
                            <TableCell className={styles.cell}>
                              
                            </TableCell>
                            <TableCell className={styles.cell}>
                             
                            </TableCell>
                            <TableCell className={styles.cell}>
                              <Textarea
                                value={task.remarks}
                                placeholder="Comments"
                                size="small"
                                resize="vertical"
                                onChange={(e) =>
                                  handleTaskChange(index, "remarks", e.target.value)
                                }
                                disabled={shouldCreateEntraUser && task.isConfiguration?true:false}
                                style={{ minHeight: "32px", fontSize: "11px" ,width:"100%"}}
                              />
                            </TableCell> */}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DrawerBody>

        {/* Fixed Footer with Actions */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 24px",
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#fff",
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            zIndex: '1',
          }}
        >
          <Button
            appearance="secondary"
            onClick={() => {
              setOpenJoinoingDate(false);
              resetBGVDialog();
              setSelectedLicense([])

            }}
          >
            Cancel
          </Button>
          <Button
            appearance="primary"
            disabled={IsLoadingMarkAsHired || !dateOfJoining || IsFetchingTasks || (createAssetOnConfirm && selectedRoleCategoryIds.length === 0)}
            onClick={() => handleConfirmAndCreateAD()}
            icon={IsLoadingMarkAsHired ? <Spinner size="tiny" /> : <CheckmarkCircle20Filled />}
          >
            {IsLoadingMarkAsHired ? "Processing..." : shouldCreateEntraUser ? "Create User" : "Proceed"}
          </Button>
        </div>
      </OverlayDrawer>


      {/* BGV Token Generator Dialog */}
      <Dialog
        open={showBGVDialog}
        onOpenChange={(_, data) => {
          setShowBGVDialog(!!data?.open);
          if (!data?.open) {
            resetBGVDialog();
          }
        }}
      >
        <DialogSurface style={{ maxWidth: "700px", width: "90vw" }}>
          <DialogTitle>
            <div className="flex items-center gap-3">
              <Link24Regular className="text-blue-600" />
              BGV Form Management
            </div>
          </DialogTitle>
          <DialogBody>
            <DialogContent>
              <div className="space-y-4">
                <div className="rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                  <div className="space-y-1">
                    <Persona
                      textAlignment="start"
                      name={`${applicant.firstName} ${applicant.lastName}`}
                      presence={{ status: "available" }}
                      secondaryText={applicant.email || "Not provided "}
                      tertiaryText={applicant.ApplicantCode}
                      avatar={{ color: "colorful" }}
                      size="large"
                    />
                  </div>
                </div>

                {isCheckingToken && (
                  <div className="flex flex-col items-center justify-center py-8 h-full">
                    <Spinner />
                    <Body1Strong className="mt-2">
                      Checking existing BGV tokens...
                    </Body1Strong>
                  </div>
                )}

                {!isCheckingToken &&
                  existingTokenData?.hasExistingToken &&
                  existingTokenData.tokenData && (
                    <div className="rounded-lg p-4 mb-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
                      <div className="flex items-center justify-between mb-3">
                        <Body1Strong className="text-orange-900">
                          BGV Status
                        </Body1Strong>
                        <Badge
                          appearance="filled"
                          color={
                            existingTokenData.tokenData.TokenStatus === "VALID"
                              ? "success"
                              : existingTokenData.tokenData.TokenStatus ===
                                "USED"
                                ? "informative"
                                : existingTokenData.tokenData.TokenStatus ===
                                  "EXPIRED"
                                  ? "danger"
                                  : "warning"
                          }
                        >
                          {existingTokenData.tokenData.TokenStatus === "USED"
                            ? "BGV Submitted"
                            : existingTokenData.tokenData.TokenStatus}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Caption1 className="text-orange-800">
                            <strong>BGV Request ID:</strong>{" "}
                            {existingTokenData.tokenData.BGVFormattedID}
                          </Caption1>
                          <Caption1 className="text-orange-800">
                            <strong>BGV Status:</strong>{" "}
                            {existingTokenData.tokenData.BGVStatus}
                          </Caption1>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Caption1 className="text-orange-800">
                            <strong>Created:</strong>{" "}
                            {new Date(
                              existingTokenData.tokenData.CreatedDate
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Caption1>
                          <Caption1 className="text-orange-800">
                            <strong>Expires:</strong>{" "}
                            {new Date(
                              existingTokenData.tokenData.ExpiryDate
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Caption1>
                        </div>

                        {existingTokenData.tokenData.IsUsed &&
                          existingTokenData.tokenData.UsedDate && (
                            <div className="pt-2 border-t border-orange-200">
                              <div className="flex items-center gap-2">
                                <CheckmarkCircle20Filled className="w-4 h-4 text-green-600" />
                                <Caption1 className="text-green-800 font-medium">
                                  <strong>BGV Submitted on:</strong>{" "}
                                  {new Date(
                                    existingTokenData.tokenData.UsedDate
                                  ).toLocaleDateString("en-US", {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </Caption1>
                              </div>
                            </div>
                          )}
                      </div>

                      {existingTokenData.tokenData.TokenStatus === "VALID" && (
                        <div className="space-y-3">
                          <Field label="BGV Form URL">
                            <div className="flex gap-2">
                              <Input
                                value={getExistingTokenUrl(
                                  existingTokenData.tokenData.Token
                                )}
                                readOnly
                                className="flex-1"
                              />
                              <Tooltip content="Copy URL" relationship="label">
                                <Button
                                  icon={<Copy24Regular />}
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(
                                        getExistingTokenUrl(
                                          existingTokenData.tokenData!.Token
                                        )
                                      );
                                      dispatchToast(
                                        <Toast>
                                          <ToastTitle>URL Copied</ToastTitle>
                                          <ToastBody>
                                            BGV form URL copied to clipboard.
                                          </ToastBody>
                                        </Toast>,
                                        { intent: "success" }
                                      );
                                    } catch (error) {
                                      console.error(
                                        "Error copying URL:",
                                        error
                                      );
                                    }
                                  }}
                                  appearance="outline"
                                />
                              </Tooltip>
                            </div>
                          </Field>

                          <div className="flex gap-2">
                            {applicant.email && (
                              <Button
                                appearance="outline"
                                icon={<Send24Regular />}
                                onClick={() => {
                                  const subject = encodeURIComponent(
                                    "BGV Form - Action Required"
                                  );
                                  const body = encodeURIComponent(`
Dear ${applicant.firstName} ${applicant.lastName},

Please complete your Background Verification form by clicking the link below:

${getExistingTokenUrl(existingTokenData.tokenData!.Token)}

Important Notes:
- This link will expire on ${new Date(
                                    existingTokenData.tokenData!.ExpiryDate
                                  ).toLocaleDateString()}
- The form can only be submitted once
- Your BGV Reference ID: ${existingTokenData.tokenData!.BGVFormattedID}

Best regards,
HR Team
                                `);

                                  const mailtoUrl = `mailto:${applicant.email}?subject=${subject}&body=${body}`;
                                  window.open(mailtoUrl);
                                }}
                                className="flex-1"
                              >
                                Send Reminder Email
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {existingTokenData.tokenData.TokenStatus === "USED" && (
                        <div className="pt-3 border-t border-orange-200">
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
                            <CheckmarkCircle20Filled className="w-5 h-5 text-green-600" />
                            <div>
                              <Body1Strong className="text-green-800">
                                BGV Form Successfully Submitted
                              </Body1Strong>
                              <Caption1 className="text-green-700 block">
                                The candidate has completed their background
                                verification form.
                              </Caption1>
                            </div>
                          </div>
                        </div>
                      )}

                      {existingTokenData?.tokenData?.TokenStatus ===
                        "EXPIRED" && (
                          <div className="pt-3 border-t border-orange-200">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
                              <DismissCircle20Filled className="w-5 h-5 text-red-600" />
                              <div className="flex-1">
                                <Body1Strong className="text-red-800">
                                  BGV Token Expired
                                </Body1Strong>
                                <div>
                                  <Caption1 className="text-red-700 block">
                                    This token expired on{" "}
                                    {new Date(
                                      existingTokenData.tokenData.ExpiryDate
                                    ).toLocaleDateString()}
                                  </Caption1>
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 space-y-2">
                              <Field label="Extend Token Validity (Days)">
                                <Input
                                  type="number"
                                  value={expiryDays.toString()}
                                  onChange={(e) =>
                                    setExpiryDays(parseInt(e.target.value) || 30)
                                  }
                                  min="1"
                                  max="365"
                                />
                              </Field>

                              <div className="flex gap-2">
                                <Button
                                  appearance="primary"
                                  size="small"
                                  onClick={() => handleGenerateBGVToken(false)}
                                  disabled={isGenerating}
                                  icon={
                                    isGenerating ? (
                                      <Spinner size="tiny" />
                                    ) : (
                                      <Link24Regular />
                                    )
                                  }
                                  className="flex-1"
                                >
                                  {isGenerating
                                    ? "Extending Token..."
                                    : "Extend Expired Token"}
                                </Button>
                              </div>

                              <Caption1 className="text-gray-600 block text-center">
                                💡 Extending will keep the same token URL and just
                                update the expiry date
                              </Caption1>
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                {(!applicant.firstName ||
                  !applicant.lastName ||
                  !applicant.email) && (
                    <MessageBar intent="warning">
                      <MessageBarBody>
                        <MessageBarTitle>
                          Missing Required Information
                        </MessageBarTitle>
                        Please ensure the candidate has first name, last name, and
                        email before generating BGV form.
                      </MessageBarBody>
                    </MessageBar>
                  )}

                {!isCheckingToken &&
                  (!existingTokenData?.hasExistingToken ||
                    !existingTokenData.tokenData) &&
                  !generatedToken && (
                    <>
                      <Field
                        label="Link Expiry (Days)"
                        hint="Number of days the BGV form link will remain valid"
                      >
                        <Input
                          type="number"
                          value={expiryDays.toString()}
                          onChange={(e) =>
                            setExpiryDays(parseInt(e.target.value) || 30)
                          }
                          min="1"
                          max="365"
                        />
                      </Field>

                      <div className="rounded-lg p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                        <Body1Strong className="text-indigo-900 mb-2 block">
                          New BGV Request Creation
                        </Body1Strong>
                        <div className="space-y-1">
                          <ol type="1">
                            <li>
                              <Caption1 className="text-indigo-800">
                                A new BGV request will be automatically created
                                for this candidate
                              </Caption1>
                            </li>
                            <li>
                              <Caption1 className="text-indigo-800">
                                Only one active BGV token is allowed per
                                applicant
                              </Caption1>
                            </li>
                            <li>
                              <Caption1 className="text-indigo-800">
                                The candidate will receive a unique, secure form
                                link
                              </Caption1>
                            </li>
                          </ol>
                        </div>
                      </div>

                      <div className="py-4">
                        <Button
                          appearance="primary"
                          onClick={() => handleGenerateBGVToken(false)}
                          disabled={
                            isGenerating ||
                            !applicant.firstName ||
                            !applicant.lastName ||
                            !applicant.email
                          }
                          icon={
                            isGenerating ? (
                              <Spinner size="tiny" />
                            ) : (
                              <Link24Regular />
                            )
                          }
                          className="w-full"
                        >
                          {isGenerating
                            ? "Creating BGV Request & Generating URL..."
                            : "Generate BGV Form URL"}
                        </Button>
                      </div>
                    </>
                  )}

                {generatedToken && (
                  <>
                    <Field label="Generated BGV Form URL">
                      <div className="flex gap-2">
                        <Input
                          value={generatedToken.bgvUrl}
                          readOnly
                          className="flex-1"
                        />
                        <Tooltip content="Copy URL" relationship="label">
                          <Button
                            icon={<Copy24Regular />}
                            onClick={handleCopyBGVUrl}
                            appearance="outline"
                          />
                        </Tooltip>
                      </div>
                    </Field>

                    <div className="rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                      <div className="space-y-1">
                        <Caption1 className="text-green-800 !block">
                          <strong>BGV Request ID:</strong>{" "}
                          {generatedToken.BGVFormattedID}
                        </Caption1>

                        <Caption1 className="text-green-800 !block">
                          <strong>Created:</strong>{" "}
                          {new Date().toLocaleString()}
                        </Caption1>
                        <Caption1 className="text-green-800 !block">
                          <strong>Expires:</strong>{" "}
                          {new Date(generatedToken.ExpiryDate).toLocaleString()}
                        </Caption1>
                      </div>
                    </div>

                    <div className="flex gap-3 my-4">
                      {applicant.email && (
                        <Button
                          appearance="secondary"
                          icon={<Send24Regular />}
                          onClick={handleSendBGVEmail}
                          className="flex-1"
                        >
                          Send Email
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </DialogContent>
          </DialogBody>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Close</Button>
            </DialogTrigger>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={showRejectDialog}
        onOpenChange={(_, data) => setShowRejectDialog(!!data?.open)}
      >
        <DialogSurface>
          <DialogTitle>Reject Applicant</DialogTitle>
          <DialogBody>
            <DialogContent>
              <div className="space-y-4 py-4">
                <div>
                  <Field label={"Reason for rejection:"}>
                    <Textarea
                      id="reject-reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Please provide a reason for rejection..."
                      rows={3}
                    />
                  </Field>
                </div>
              </div>
            </DialogContent>
          </DialogBody>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleRejectConfirm}
              icon={<DismissCircle20Regular />}
            >
              Reject Applicant
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog
        open={OpenApproveDialog}
        onOpenChange={(_, data) => setOpenApproveDialog(!!data?.open)}
      >

        <DialogSurface>

          <DialogTitle>
            Approve Candidate
          </DialogTitle>


          <DialogBody>
            <DialogContent>
              <div className="space-y-4 py-4">
                <div className="flex flex-col gap-3">


                  <Field label="Recommended Salary (eg. 300000)" required>
                    <Input
                      id="reject-reason"
                      value={PropposedSalary}
                      onChange={(e) => {
                        setPropposedSalary(e.target.value)
                      }}
                      placeholder="Please provide feedback"
                    />
                  </Field>


                  <Field label="Feedback" required hint={ApproveFeedback?.length}>
                    <Textarea
                      id="reject-reason"
                      value={ApproveFeedback}
                      onChange={(e) => {
                        const normalized = e.target.value
                          .replace(/\r\n/g, '\n')
                          .replace(/\r/g, '\n')
                          .replace(/\u2028/g, '\n')
                          .replace(/\u2029/g, '\n\n');
                        setApproveFeedback(normalized);
                      }}
                      placeholder="Please provide feedback"
                      rows={5}

                    />
                  </Field>


                </div>
              </div>
            </DialogContent>
          </DialogBody>
          <DialogActions>
            <DialogTrigger disableButtonEnhancement>
              <Button appearance="secondary">Cancel</Button>
            </DialogTrigger>
            <Button
              appearance="primary"
              onClick={handleApproveClick}
              disabled={isApproving}
              icon={isApproving ? <Spinner size="tiny" /> : undefined}
            >
              Approve
            </Button>
          </DialogActions>
        </DialogSurface>
      </Dialog>

      <FluentProvider>
        <OverlayDrawer
          open={isDrawerOpen}
          onOpenChange={(_, { open }) => setIsDrawerOpen(open)}
          position="end"
          size="large"
        >
          <DrawerHeader>
            <DrawerHeaderTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="Close"
                  icon={<DismissRegular />}
                  onClick={() => setIsDrawerOpen(false)}
                />
              }
            >
              <span className="flex flex-row items-start gap-5">
                <Persona
                  size="huge"
                  name={`${selectedApplicant?.firstName} ${selectedApplicant?.lastName}`}
                  secondaryText={`${selectedApplicant?.ApplicantCode}`}
                  avatar={{ color: "colorful" }}
                />
                <Badge className="mt-1">
                  {selectedApplicant?.currentPipeline?.stage.stageName}
                </Badge>
              </span>
            </DrawerHeaderTitle>
          </DrawerHeader>

          <DrawerBody>
            {selectedApplicant && (
              <ApplicantDrawer jobId={jobId} applicant={selectedApplicant} />
            )}
          </DrawerBody>
        </OverlayDrawer>
      </FluentProvider>

      <ConfirmationDialog open={OpenConfirmation} handleClose={handleConfirmationClose} handleSubmit={handleMarkAsHired} />

      {/* AD User Confirmation Dialog */}
      {showADConfirmDialog && (
        <Dialog
          open={showADConfirmDialog}
          onOpenChange={(_, data) => {
            if (!IsLoadingMarkAsHired) {
              handleCloseADConfirmDialog()
            }
          }}
          modalType="modal"
        >
          <DialogSurface style={{ maxWidth: '75%', height: 'fit-content', maxHeight: '90vh' }}>

            <DialogTitle>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 text-green-600 flex justify-center items-center rounded-lg">
                  <Person24Regular />
                </div>
                <div className="flex flex-col gap-2">
                  <Text size={400} weight="semibold">Create User Account</Text>
                  <Text size={200} weight="medium" className="text-gray-400">Please review the details below before creating this account</Text>
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
                    (applicant.firstName?.trim() !== firstName?.trim() ||
                      applicant.lastName?.trim() !== lastName?.trim()) &&
                    <MessageBar intent="warning">
                      <MessageBarBody>
                        <MessageBarTitle>Verify User Details Before Proceeding</MessageBarTitle>
                        There is a mismatch between the applicant's name and the  user details. This will update the applicant's name in the system.                      </MessageBarBody>
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
                          <Body1Strong className="block">{displayName}</Body1Strong>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <Caption1 className="text-gray-500">Personal Email Address(Reference)</Caption1>
                          <Body1Strong className="block text-gray-600">{applicant.email}</Body1Strong>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <Caption1 className="text-gray-500">Mobile Number</Caption1>
                          <Body1Strong className="block">{mobileNumber || "-"}</Body1Strong>
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
                          <Body1Strong className="block">{department}</Body1Strong>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <Caption1 className="text-gray-500">Sub Department</Caption1>
                          <Body1Strong className="block">{subDepartment ? subDepartment : "-"}</Body1Strong>
                        </div>

                      </div>
                      {/* <Divider /> */}


                      <div className="grid grid-cols-2 gap-3">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <Caption1 className="text-gray-500">Designation</Caption1>
                          <Body1Strong className="block">{jobTitle || designationContext}</Body1Strong>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <Caption1 className="text-gray-500">Security Group</Caption1>
                          <Body1Strong className="block">{selectedFaxNumber}</Body1Strong>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <Caption1 className="text-gray-500">Manager</Caption1>
                          <Body1Strong className="block">{managerName || "-"}</Body1Strong>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <Caption1 className="text-gray-500">Location</Caption1>
                          <Body1Strong className="block">{selectedLocationName || "-"}</Body1Strong>
                        </div>

                      </div>


                    </div>
                  </div>


                  <div className=" overflow-hidden">
                    <div className="p-3 border-b border-gray-200">
                      <Body1Strong className="text-gray-700 flex items-center gap-2">
                        <Settings20Regular />
                        Account & Joining
                      </Body1Strong>
                    </div>

                    <div className="p-4 space-y-3 bg-white">




                      {/* <Divider /> */}



                      {/* <Divider /> */}
                      <div className="grid grid-cols-1 md:grid-cols-2">

                        <div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                            <Caption1 className="text-gray-500">Organization Email Address(Login ID)</Caption1>
                            <Body1Strong className="block">{organizationEmail}</Body1Strong>

                          </div>


                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <Caption1 className="text-gray-400">Date of Joining</Caption1>
                          <Body1Strong className="block">
                            {dateOfJoining?.toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </Body1Strong>
                        </div>


                        {
                          shouldCreateEntraUser && assignLicense && selectedLiscense.length > 0 ?

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
                onClick={() => handleCloseADConfirmDialog()}
                disabled={IsLoadingMarkAsHired}
              >
                Go Back & Edit
              </Button>
              <Button
                appearance="primary"
                onClick={handleMarkAsHired}
                disabled={IsLoadingMarkAsHired || (createAssetOnConfirm && selectedRoleCategoryIds.length === 0)}
                icon={IsLoadingMarkAsHired ? <Spinner size="tiny" /> : <CheckmarkCircle20Filled />}
              >
                {IsLoadingMarkAsHired ? "Creating User..." : "Confirm & Create User"}
              </Button>
            </DialogActions>
          </DialogSurface>
        </Dialog>
      )}

      {/* Toast Container */}
      <Toaster toasterId={toastId} />


    </div>
  );
};

export default ApplicantCard;

// BGVStatusBadge Component
interface BGVStatusBadgeProps {
  status: "VALID" | "USED" | "EXPIRED" | "INACTIVE";
  size?: "small" | "medium" | "large";
}

export const BGVStatusBadge: React.FC<BGVStatusBadgeProps> = ({
  status,
  size = "small",
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "VALID":
        return {
          color: "success" as const,
          icon: <CheckmarkCircle20Filled />,
          text: "Active",
        };
      case "USED":
        return {
          color: "informative" as const,
          icon: <CheckmarkCircle20Filled />,
          text: "BGV Submitted",
        };
      case "EXPIRED":
        return {
          color: "danger" as const,
          icon: <DismissCircle20Filled />,
          text: "Expired",
        };
      case "INACTIVE":
        return {
          color: "warning" as const,
          icon: <Warning20Regular />,
          text: "Inactive",
        };
      default:
        return {
          color: "subtle" as const,
          icon: <Clock20Regular />,
          text: "Unknown",
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Badge
      appearance="filled"
      color={config.color}
      icon={config.icon}
      size={size}
    >
      {config.text}
    </Badge>
  );
};
