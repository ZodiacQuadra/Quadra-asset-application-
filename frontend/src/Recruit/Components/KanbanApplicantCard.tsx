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
  TableBody,
  TableRow,
  TableCell,
  Table,
  Tag,
  TableHeader,
  TableHeaderCell,
  tokens,
  InputOnChangeData,
  makeStyles,
  SpinButton,
  Switch,
  Dropdown,
  Option,
  Text,
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
  ReOrderDotsVertical20Filled,
  Settings20Regular,
  CallAdd16Filled,
  Calendar16Filled,
  Calendar24Filled,
  CalendarClock24Filled,
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
import { fetchSkipInterviewStatus, markCandidateAsHired, saveSkipInterviewStatus } from "../../Services/Applicant";
import inductionAPI, { InductionTask } from "../../Services/EmployeeInduction";
import { ApiResponse } from "../../Services/UserAssignments";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { getAssetRoleTemplates, getAssetRoleTemplateDetail, AssetRoleTemplateRecord } from "../../Asset/Services/AssetRoleTemplateService";
import { createAssetHRRequest } from "../../Asset/Services/AssetHRRequestService";




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

interface SkippedData {
  stageId: string;
  isActive: boolean
}

interface ApplicantCardProps {
  jobId: string;
  applicant: Applicant;
  stages: InterviewStage[];
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
  onApprove?: (applicant: Applicant,feedback:string,salary:string,shouldSaveFeedback:boolean) => void;
  onReject?: (applicant: Applicant, reason: string) => void;
  isManualStage?: boolean;
  currentStage?: {
    name: string;
    description?: string;
  } | null;
  refreshData?: () => void;
  isSubordinate:boolean;
  designation?:string | null
}

const KanbanApplicantCard: React.FC<ApplicantCardProps> = ({
  jobId,
  applicant,
  stages,
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
  isSubordinate,
  designation
}) => {
  const [showAllInterviews, setShowAllInterviews] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // BGV Token Generator States
  const [showBGVDialog, setShowBGVDialog] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);
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
  const [LoadingSkipStatus, setLoadingSkipStatus] = useState<boolean>(false);
    const [skippedStages, setSkippedStages] = useState<SkippedData[]>([]);
    const [isSkipItemChanged, setIsSkipItemChanged] = useState<boolean>(false);
  
  const isLastStage = (index: number) => index === stages.length - 1;

  const [bgvStatusInfo, setBgvStatusInfo] = useState<{
    hasSubmittedBGV: boolean;
    submissionDate?: string;
    bgvRequestId?: string;
    status?: string;
  } | null>(null);
  const toastId = useId();
  const { currentUser,accessToken }: any = useAuth();
  const { dispatchToast } = useToastController(toastId);
  const [
    existingTokenData,
    setExistingTokenData,
  ] = useState<ExistingTokenData | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState(false);

  const styles = useStyles();
  // For joining confirmation
    const [OpenJoiningDate, setOpenJoinoingDate] = useState(false)
    const [tasks, setTasks] = useState<InductionTask[]>([]);
    const [dateOfJoining, setDateOfJoining] = useState(new Date())
    const [designationContext, setDesignationContext] = useState("")
    const [IsFetchingTasks,setIsFetchingTasks] = useState(false)
    const [IsLoadingMarkAsHired,setIsLoadingMarkAsHired] = useState(false)
    const [createAssetOnConfirm, setCreateAssetOnConfirm] = useState(false)
    const [assetRoles, setAssetRoles] = useState<AssetRoleTemplateRecord[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState("")
    const [selectedRoleCategoryNames, setSelectedRoleCategoryNames] = useState<string[]>([])
    const [selectedRoleCategoryIds, setSelectedRoleCategoryIds] = useState<string[]>([])
    const { mountNode: assetMountNode, portal: assetMountNodePortal } = useThemedMountNode();


  // Check if applicant is hired or rejected
  const isHired = applicant.currentPipeline?.stage?.stageName === "Hired";
  const isRejected =
    applicant.applicantStatus === "Rejected" ||
    applicant.currentPipeline?.status === "Rejected";

  // Check for existing token when BGV dialog opens
  useEffect(() => {
    if (showBGVDialog && !existingTokenData) {
      checkForExistingToken();
    }
  }, [showBGVDialog]);

  useEffect(()=>{
    if(designation){
      setDesignationContext(designation)
    }
  },[designation])

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
                remarks: "",
                isConfiguration: task.isConfiguration ?? false,
                configurationType:task.configurationType ?? null,
                assignedTo: task.assignedTo || "",
                emailID: task.emailID || "",
                assignedUsers: task.assignedUsers || [],
                remainderDate: null,
                remainderCount: task.days,
                completedByName: "",
                completedByEmailID: "",
                completedByUserID: "",
                completedAt: null,
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
    
        if (accessToken && OpenJoiningDate && (!tasks||tasks.length === 0)) {
          fetchData();
        }
      }, [accessToken,OpenJoiningDate]);

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
  // picking. The role choice can't be persisted to this applicant's
  // EntraADUsers row here, since this simpler Kanban confirm flow doesn't
  // create an AD account itself (unlike ApplicantCard.tsx's fuller flow) —
  // an admin assigns the actual Asset Role from the Employees Asset List
  // once the account is synced; this only drives what gets requested now.
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

  const handleDateChange = (
      _e: React.ChangeEvent<HTMLInputElement>,
      data: InputOnChangeData
    ) => {
      // data.value is a string from the input
      // convert to Date if you want a Date in state
      setDateOfJoining(new Date(data.value as string));
    };

    const handleDesignationChange = (
      _e: React.ChangeEvent<HTMLInputElement>,
      data: InputOnChangeData
    ) => {
      // data.value is a string from the input
      // convert to Date if you want a Date in state
      setDesignationContext(data.value);
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

     const handleMarkAsHired = async () => {
        if (!dateOfJoining) {
          dispatchToast(
            <Toast>
              <ToastTitle>Missing Information</ToastTitle>
              <ToastBody>
                Date of joining is required to approve.
              </ToastBody>
            </Toast>,
            { intent: "error" }
          );
          return
        }

        if (!designationContext) {
          dispatchToast(
            <Toast>
              <ToastTitle>Missing Information</ToastTitle>
              <ToastBody>
                Designation of the candidate is required.
              </ToastBody>
            </Toast>,
            { intent: "error" }
          );
          return
        }
    
        try {
          setIsLoadingMarkAsHired(true)
    
          const filteredTasks = tasks.filter((task) => task.isRequired);
          const response:ApiResponse<any> = await markCandidateAsHired(applicant.ID, accessToken, dateOfJoining, filteredTasks,designationContext)
    
          // console.log("response",response)
          if (response.data && !response.data?.success) {
            dispatchToast(
              <Toast>
                <ToastTitle>Error</ToastTitle>
                <ToastBody>
                  Unable to mark candidate as hired
                </ToastBody>
              </Toast>,
              { intent: "error" }
            );
    
            return;
          }
    
          dispatchToast(
              <Toast>
                <ToastTitle>Success</ToastTitle>
                <ToastBody>
                  Candidate marked as hired successfully
                </ToastBody>
              </Toast>,
              { intent: "success" }
            );
          await submitAssetRequestForApplicant()
          setOpenJoinoingDate(false)
          setDateOfJoining(new Date())
          if(refreshData)
          refreshData()
        }
        catch (error: unknown) {
          // console.log("error",error)
          const errorMessage = error instanceof Error
            ? error.message
            : "Unable to update applicant details";
    
          dispatchToast(
            <Toast>
              <ToastTitle>Error</ToastTitle>
              <ToastBody>
                {errorMessage}
              </ToastBody>
            </Toast>,
            { intent: "error" }
          );
        }
        finally{
          setIsLoadingMarkAsHired(false)
        }
      }

  const currentStageOrder =
    applicant.currentPipeline?.stage?.stageOrder ??
    applicant.currentPipeline?.stage?.stageSequence ??
    -1;

  const handleGetSkipInterviewStatus = async () =>{
      try {
        setLoadingSkipStatus(true);
        const result=await fetchSkipInterviewStatus(applicant.ID, accessToken, jobId);
        // console.log("Skip interview status data:", result);
        if(result.success){
          const skippedData:SkippedData[]=[];
          result.data.forEach((stage:any) =>{
            skippedData.push({stageId:stage.stageId, isActive:stage.isActive});
          });
          setSkippedStages(skippedData);
        }
  
      } catch (error) {
        console.error("Error fetching skip interview status:", error);
      }
      finally{
        setLoadingSkipStatus(false);
      }
    }

    const handleJoiningClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setOpenJoinoingDate(true);
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
          setIsSkipItemChanged(false);
          handleGetSkipInterviewStatus();
          if (refreshData) {
            refreshData();
          }
        }
    }
        catch (error) {
        console.error("Error saving skip interview status:", error);
        }
        finally{
          setLoadingSkipStatus(false);
        }
  }

  const handleToggleSkipStage = (stageId: string) => {
    setIsSkipItemChanged(true);
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

    useEffect(()=>{
        handleGetSkipInterviewStatus();
      }, [applicant.ID, jobId]);

  useEffect(() => {
    if (isHired && !bgvStatusInfo) {
      checkBGVStatusForHired();
    }
  }, [isHired]);

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
    return `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
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
            color="success"
            icon={<PhoneCheckmark20Filled />}
            className="!border-0 !rounded-lg !px-4 !py-4 !bg-[#DCFCE7] !text-[#15803D]"
          >
            Hired
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
              color="success"
              icon={<CheckmarkCircle20Filled />}
              className="!border-0 !rounded-lg !px-4 !py-4 !bg-[#DCFCE7] !text-[#15803D]"
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
          <Badge
            color="warning"
            className="!border-0 !rounded-lg !px-4 !py-4 !bg-[#FEF9C3] !text-[#A16207]"
          >
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
          <Badge className="!border-0 !rounded-lg !px-4 !py-4" color="brand">
            {upcomingCount > 0
              ? `${upcomingCount} Scheduled`
              : `${scheduled} Past Due`}
          </Badge>
        ),
        priority: upcomingCount > 0 ? 2 : 4,
      };
    }

    if (cancelled > 0) {
      return {
        badge: (
          <Badge
            color="danger"
            className="!border-0 !rounded-lg !px-4 !py-4 !bg-red-100 !text-red-800"
          >
            {cancelled} Cancelled
          </Badge>
        ),
        priority: 5,
      };
    }

    // If pipeline status is Pending and no interviews scheduled, show "No Interviews"
    return {
      badge: (
        <Badge
          color="informative"
          className="!border !border-gray-300 !rounded-lg !px-4 !py-4 !bg-transparent !text-gray-500"
        >
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

  const getCardClasses = () => {
    const baseClasses = [
      "transition-all duration-300 ease-out cursor-pointer",
      "hover:-translate-y-1 hover:shadow-md",
      "w-full",
    ];

    if (isSelected) {
      baseClasses.push(
        "bg-gradient-to-br from-blue-50 to-indigo-50",
        "border-2 border-blue-500",
        "shadow-lg shadow-blue-500/20"
      );
    } else {
      baseClasses.push("border border-gray-200 bg-white shadow-sm");
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
    onSchedule?.();
  };

  const handleApproveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onApprove?.(applicant,"","0",false);
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

    return (
      <div
        key={interview.interviewId || index}
        className={`rounded-lg p-3 border ${
          isInterviewRejected
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
              className={`font-semibold ${
                isInterviewRejected
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

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <CalendarClock24Regular
              className={`w-4 h-4 shrink-0 ${
                isInterviewRejected
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
              className={`w-4 h-4 shrink-0 ${
                isInterviewRejected
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
                className={`w-4 h-4 shrink-0 ${
                  isInterviewRejected
                    ? "text-red-600"
                    : isCompleted
                    ? "text-green-600"
                    : isCancelled
                    ? "text-red-600"
                    : "text-blue-600"
                }`}
              />
              <Caption1 className="text-gray-600">
                {interview.location}
              </Caption1>
            </div>
          )}

          {interview.interviewers && interview.interviewers.length > 0 && (
            <div className="flex items-center gap-3">
              <PeopleCommunityRegular
                className={`w-4 h-4 shrink-0 ${
                  isInterviewRejected
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
              {onCancelInterview && !isSubordinate &&(
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
    if(applicant.applicantStatus === "Hired"){
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
                        <Calendar24Filled className="w-4 h-4 shrink-0 text-green-600" />
                        <Caption1 className="text-gray-600">
                          Date of Joining:{" "}
                          {applicant.DateOfJoining ?new Date(applicant.DateOfJoining).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                          :"N/A"
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
            <div className="pt-2 border-t border-green-200">
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
            <div className="pt-2 border-t border-green-200">
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

    else if(applicant.applicantStatus === "hiring-pending") {
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
                      Confirm Joining
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        }

    else{
       return(
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
    return (
      <div className="rounded-lg p-4 border bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 h-full">
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

  return (
    <>
      <Card
        draggable={!isHired && !isRejected && isDraggable}
        onDragStart={handleDragStart}
        onClick={handleCardClick}
        className={getCardClasses()}
        appearance="filled"
        size="medium"
        style={{ borderRadius: "12px", marginBottom: "12px" }}
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
                        className="transition-transform hover:scale-110 !border-0"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          }
          header={
            <div className="flex items-center justify-between w-full min-w-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-full flex justify-between">
                  <div className="flex gap-2 items-center">
                    <Avatar
                      size={40}
                      color="neutral"
                      name={`${applicant.firstName} ${applicant.lastName}`}
                    ></Avatar>
                    <div className="flex flex-col justify-between">
                      <div className="flex items-center gap-2">
                        <Subtitle1 className="!text-sm">
                          {applicant.firstName} {applicant.lastName}
                        </Subtitle1>
                      </div>
                      <Caption1 className="!text-gray-500 !text-xs">
                        {applicant.email}
                      </Caption1>
                    </div>
                  </div>
                  {!isHired && !isRejected  && !isSubordinate &&(
                    <Menu persistOnItemClick positioning={{autoSize:true}}>
                                      <MenuTrigger disableButtonEnhancement>
                                    <Button
                                      size="small"
                                      appearance="subtle"
                                      >
                                          <Settings20Regular/>
                                        
                                        
                                      </Button>
                                      
                                      </MenuTrigger>
                    
                                      <MenuPopover >
                                        {
                                          LoadingSkipStatus ? 
                                            <div className="p-4"><Spinner size="small" /></div> 
                                            : 
                                            <MenuList>
                                            {
                                              stages.map((stage,index) => (
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
                                                    }}/>
                                                    <span>{stage.InterviewName}</span>
                                                  </div>
                                                </MenuItem>
                                              ))
                                            }
                    
                                            <MenuItem disabled={skippedStages.length === 0|| !isSkipItemChanged}>
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
                  )}
                </div>
              </div>
            </div>
          }
        />

        <CardPreview className="!px-4 !py-3 !pb-4">
          {isRejected ? (
            renderRejectedContent()
          ) : isHired ? (
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
            <div className="rounded-lg p-4 border bg-gradient-to-r from-gray-50 to-slate-50 border-gray-100 h-full">
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
          <>
            <Divider />
            <CardFooter className="px-1 pb-2 flex gap-2 justify-between">
              {
                !isSubordinate && (
                  <div className="flex gap-2">
                {isManualStage ? (
                  <>
                    <Button
                      size="small"
                      appearance="primary"
                      onClick={handleApproveClick}
                      icon={<CheckmarkCircle20Filled />}
                      disabled={
                        applicant.currentPipeline?.status === "Completed"
                      }
                    >
                      Approve
                    </Button>
                    <Button
                      size="small"
                      appearance="outline"
                      onClick={handleRejectClick}
                      disabled={
                        applicant.currentPipeline?.status === "Rejected"
                      }
                    >
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button
                    size="small"
                    onClick={handleScheduleClick}
                    icon={<Add20Regular />}
                    className="!px-3 !py-2 !rounded-xl !bg-gradient-to-br !from-[#0153A5] !to-[#2FC2FE] !text-white "
                    appearance="primary"
                  >
                    Schedule New
                  </Button>
                )}
              </div>
                )
              }
              

              <Button
                appearance="subtle"
                className="!text-[#4F46E5] !font-medium"
                size="small"
                onClick={() => handleViewDetails(applicant)}
              >
                View Details
              </Button>
            </CardFooter>
          </>
        )}

        {(isHired || isRejected) && (
          <>
            <Divider />
            <CardFooter className="px-1 pb-2 flex gap-2 justify-end">
              <Button
                appearance="subtle"
                className="!text-[#4F46E5] !font-medium"
                size="small"
                onClick={() => handleViewDetails(applicant)}
              >
                View Details
              </Button>
            </CardFooter>
          </>
        )}
      </Card>

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

                      <div className="pt-4">
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


      {/* Joining date confirmation dialog */}
            <Dialog
              open={OpenJoiningDate}
              onOpenChange={(_, data) => {
                setOpenJoinoingDate(!!data?.open);
                if (!data?.open) {
                  resetBGVDialog();
                }
              }}
              
              modalType="modal"
            
            >
              <DialogSurface className="!min-w-[90vw] !min-h-[70vh]">
                <DialogTitle>
                  <div className="flex items-center gap-3">
                    Joining Confirmation
                  </div>
                </DialogTitle>
                <DialogBody>
                  <DialogContent>
                    <div className="grid grid-cols-6">
                    <div className="space-y-4 col-span-2">
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

                      <div className="grid grid-cols-2 gap-3">
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

                      <Field
                        label="Designation"
                        hint="Designation of the candidate"
                        required
                      >
                        <Input
                          type="text"
                          value={designationContext ? designationContext : ""}
                          onChange={handleDesignationChange}
                        />
                      </Field>
                      </div>

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
                    </div>
      
                    <div className="flex justify-center align-center col-span-4">
                       <div
                                  className="w-[97%] rounded-[8px] mb-[10px] !max-h-[65vh] !overflow-y-scroll"
                                  style={{ border: "1px solid #e5e7eb" }}
                                >
                                  <Table size="small" className={styles.table}>
                                    <TableHeader
                                      style={{
                                        background:
                                          "linear-gradient(90deg, #F9FAFB 0%, #F3F4F6 100%)",
                                        borderRadius: "8px",
                                      }}
                                      
                                    >
                                      <TableRow>
                                        <TableHeaderCell
                                          style={{ width: "200px" }}
                                          className={styles.cell}
                                        >
                                          <Body1Strong>Task Description</Body1Strong>
                                        </TableHeaderCell>
                                        <TableHeaderCell
                                          style={{ width: "200px" }}
                                          className={styles.cell}
                                        >
                                          <Body1Strong>Task Owner</Body1Strong>
                                        </TableHeaderCell>
                                        <TableHeaderCell
                                          style={{ width: "80px" }}
                                          className={styles.cell}
                                        >
                                          <Body1Strong>Quantity</Body1Strong>
                                        </TableHeaderCell>
                                        <TableHeaderCell
                                          style={{ width: "70px" }}
                                          className={styles.cell}
                                        >
                                          <Body1Strong>Required</Body1Strong>
                                        </TableHeaderCell>
                                       
                                        <TableHeaderCell
                                          style={{ width: "200px" }}
                                          className={styles.cell}
                                        >
                                          <Body1Strong>Remarks</Body1Strong>
                                        </TableHeaderCell>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody className="">
                                      
                                      {
                                        IsFetchingTasks?
                                        <TableCell colSpan={5}><Spinner/></TableCell>
                                        :
                                      tasks.map((task, index) => (
                                        <TableRow key={task.id}>
                                          <TableCell
                                            style={{ width: "200px" }}
                                            className={styles.cell}
                                          >
                                            <Body1Strong>{task.taskDescription}</Body1Strong>
                                          </TableCell>
                                          <TableCell
                                            style={{ width: "200px" }}
                                            className={styles.cell}
                                          >
                                            <div className="flex gap-3 flex-col">
                                              {task.assignedUsers && task.assignedUsers.length > 0
                                                ? task.assignedUsers.map((user: any) => (
                                                  <Tag
                                                    // size="small"
                                                    key={user.id}
                                                    shape="rounded"
                                                    style={{
                                                      backgroundColor: "transparent",
                                                      height: "auto",
                                                    }}
                                                    media={
                                                      <Avatar
                                                        aria-hidden
                                                        name={user.name}
                                                        color="colorful"
                                                        style={{
                                                          borderRadius: "50%",
                                                          height: "28px",
                                                          width: "28px",
                                                        }}
                                                      />
                                                    }
                                                    value={user.name}
                                                  >
                                                    <span style={{ fontSize: "smaller" }}>
                                                      {user.name}
                                                    </span>
                                                  </Tag>
                                                ))
                                                : task.assignedTo
                                                  .split(";")
                                                  .filter((name: string) => name.trim())
                                                  .map((name: string) => (
                                                    <Tag
                                                      // size="small"
                                                      key={name}
                                                      shape="rounded"
                                                      style={{
                                                        backgroundColor: "transparent",
                                                        height: "auto",
                                                      }}
                                                      media={
                                                        <Avatar
                                                          aria-hidden
                                                          name={name}
                                                          color="colorful"
                                                          style={{
                                                            borderRadius: "50%",
                                                            height: "28px",
                                                            width: "28px",
                                                          }}
                                                        />
                                                      }
                                                      value={name}
                                                    >
                                                      <span style={{ fontSize: "smaller" }}>
                                                        {name}
                                                      </span>
                                                    </Tag>
                                                  ))}
                                            </div>
                                          </TableCell>
                                          <TableCell
                                            style={{ width: "80px" }}
                                            className={styles.cell}
                                          >
                                            <SpinButton
                                              value={task.quantity}
                                              min={1}
                                              step={1}
                                              disabled={!task.isQuantity }
                                              onChange={(e, data) =>
                                                handleTaskChange(
                                                  index,
                                                  "quantity",
                                                  Number(data.value) || 0
                                                )
                                              }
                                            />
                                          </TableCell>
                                          <TableCell
                                            style={{ width: "70px" }}
                                            className={styles.cell}
                                          >
                                            <Checkbox
                                              checked={task.isRequired}
                                              disabled={task.isConfiguration?true:false}
                                              onChange={(e, data) =>
                                                handleTaskChange(index, "isRequired", data.checked)
                                              }
                                            />
                                          </TableCell>
                                         
                                          <TableCell
                                            style={{ width: "200px" }}
                                            className={styles.cell}
                                          >
                                            <Textarea
                                              className={styles.input}
                                              value={task.remarks}
                                              placeholder="Comments"
                                              disabled={false}
                                              onChange={(e) =>
                                                handleTaskChange(index, "remarks", e.target.value)
                                              }
                                            />
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                    </div>
                    </div>
                  </DialogContent>
                </DialogBody>
                <DialogActions>
                  <DialogTrigger disableButtonEnhancement>
      
                    <Button appearance="secondary">Close</Button>
                  </DialogTrigger>
                  <Button  disabled={IsLoadingMarkAsHired || !dateOfJoining || IsFetchingTasks || (createAssetOnConfirm && selectedRoleCategoryIds.length === 0)} appearance="primary" onClick={() => handleMarkAsHired()}>{IsLoadingMarkAsHired?`Loading...`:"Mark as Confirmed"}</Button>
                </DialogActions>
              </DialogSurface>
            </Dialog>
            {assetMountNodePortal}

      {/* Toast Container */}
      <Toaster toasterId={toastId} />
    </>
  );
};

export default KanbanApplicantCard;

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
