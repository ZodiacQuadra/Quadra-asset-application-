import React, { useState, useEffect, useMemo } from "react";
import { displayLeaveLabel } from "../Utils/leaveUtils";
import { Clock, ClipboardList } from "lucide-react";
import {
  makeStyles,
  tokens,
  shorthands,
  Card,
  Text,
  Button,
  Tab,
  TabList,
  Field,
  Input,
  Select,
  Textarea,
  Badge,
  ProgressBar,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  useToastController,
  useId,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  DrawerFooter,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Option,
  Spinner,
} from "@fluentui/react-components";
import {
  CalendarMonthRegular,
  ClockRegular,
  HistoryRegular,
  InfoRegular,
  WarningRegular,
  SendRegular,
  ArrowLeftRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  Eye20Regular,
  DismissCircle24Regular,
  CheckmarkCircle24Regular,
  Clock24Regular,
  DeleteRegular,
  Dismiss24Regular,
  AddCircleRegular,
} from "@fluentui/react-icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../Auth/AuthProvider";
import {
  submitLeaveRequest,
  getLeaveHistory,
  getLeaveBalances,
  LeaveBalance,
  LeaveRequestRecord,
  withdrawLeaveRequest
} from "../../Services/LeaveRequestService";
import {
  createPermissionRequest,
  getPermissionHistory,
  getAttendanceHistory,
  PermissionRequest
} from "../Services/AttendanceService";
import { getHolidaysByYear, Holiday } from "../../Services/HolidayService";
import { getEntraUserById, EntraADUser } from "../../Services/EntraADUserService";
import {
  submitRegularizationRequest,
  getRegularizationHistory,
  RegularizationRecord,
} from "../Services/RegularizationService";
import { useConfigurations } from "../../Context/ConfigurationsContext";
import { CompOffRequest, getUserCompOffRequests } from "../Services/CompOffService";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    padding: "24px",
    minHeight: "100%",
    backgroundColor: "transparent",
    "@media (max-width: 768px)": {
      padding: "14px",
      gap: "16px",
    },
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingTop: "12px",
    paddingBottom: "12px",
  },
  title: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#092464ff",
    letterSpacing: "-1px",
    "@media (max-width: 768px)": {
      fontSize: "22px",
      letterSpacing: "-0.5px",
    },
  },
  tabList: {
    marginBottom: "8px",
    flexWrap: "wrap" as any,
  },
  container: {
    display: "grid",
    gridTemplateColumns: "1fr 380px",
    gap: "24px",
    "@media (max-width: 1100px)": {
      gridTemplateColumns: "1fr",
    },
  },
  // Responsive grid for the Leave tab (main list + right panel)
  leaveTabGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 340px",
    gap: "24px",
    alignItems: "start",
    "@media (max-width: 1100px)": {
      gridTemplateColumns: "1fr",
    },
  },
  // Responsive header row for each list card (title + new button)
  listHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    gap: "12px",
    "@media (max-width: 520px)": {
      flexDirection: "column",
      alignItems: "flex-start",
    },
  },
  // Responsive grid for leave dialog (form + impact panel)
  leaveDialogGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 260px",
    gap: "28px",
    alignItems: "start",
    "@media (max-width: 700px)": {
      gridTemplateColumns: "1fr",
    },
  },
  // Responsive grid for drawer request details
  drawerDetailsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
    "@media (max-width: 480px)": {
      gridTemplateColumns: "1fr",
    },
  },
  leftPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  rightPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formCard: {
    borderRadius: "24px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
    backgroundColor: "#ffffff",
    border: "none",
    "@media (max-width: 768px)": {
      borderRadius: "16px",
    },
  },
  formSection: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  gridTwo: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    "@media (max-width: 480px)": {
      gridTemplateColumns: "1fr",
    },
  },
  balanceChip: {
    backgroundColor: "#f0fdf4",
    color: "#16a34a",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  impactCard: {
    padding: "20px",
    borderRadius: "16px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
  },
  impactStats: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px",
    marginBottom: "20px",
  },
  statBox: {
    padding: "12px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    textAlign: "center",
  },
  statValue: {
    fontSize: "18px",
    fontWeight: "bold",
    color: "#1e293b",
    display: "block",
  },
  statLabel: {
    fontSize: "11px",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.02em",
  },
  conflictWarning: {
    backgroundColor: "#fff7ed",
    border: "1px solid #ffedd5",
    padding: "16px",
    borderRadius: "12px",
    display: "flex",
    gap: "12px",
    alignItems: "flex-start",
  },
  balanceItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
    ":last-child": { borderBottom: "none" },
  },
  balanceHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "1px solid #f1f5f9",
  },
  progressBar: {
    height: "8px",
    borderRadius: "4px",
  },
  historySection: {
    marginTop: "32px",
    paddingTop: "32px",
    borderTop: `1px dashed ${tokens.colorNeutralStroke2}`,
  },
  paginationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "16px",
    padding: "8px 12px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    flexWrap: "wrap" as any,
    gap: "8px",
    "@media (max-width: 480px)": {
      flexDirection: "column",
      alignItems: "flex-start",
    },
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #0153A5, #2FC2FE)",
    color: "#ffffff",
    fontWeight: "600",
    ...shorthands.borderRadius("9999px"),
    ...shorthands.padding("8px", "24px"),
    transition: "background 0.2s ease, transform 0.1s ease",
    ":hover": {
      background: "linear-gradient(135deg, #014a8f, #1aaee8)",
      ...shorthands.borderColor("#005a9e"),
      color: "#ffffff",
    },
    ":active": {
      transform: "scale(0.98)",
    },
    ":disabled": {
      background: "#f3f4f6",
      ...shorthands.borderColor("#e5e7eb"),
      color: "#9ca3af",
      cursor: "not-allowed",
    }
  },
  secondaryBlueBtn: {
    backgroundColor: "transparent",
    color: "#0078d4",
    ...shorthands.border("1.5px", "solid", "#0078d4"),
    fontWeight: "600",
    ...shorthands.borderRadius("9999px"),
    ...shorthands.padding("8px", "20px"),
    transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.1s ease",
    ":hover": {
      backgroundColor: "#f0f7ff",
      color: "#005a9e",
      ...shorthands.borderColor("#005a9e"),
    },
    ":active": {
      transform: "scale(0.98)",
    },
    "@media (max-width: 520px)": {
      ...shorthands.padding("6px", "12px"),
      fontSize: "12px",
    },
  },
  secondaryGreyBtn: {
    backgroundColor: "transparent",
    color: "#475569",
    ...shorthands.border("1.5px", "solid", "#cbd5e1"),
    fontWeight: "600",
    ...shorthands.borderRadius("9999px"),
    ...shorthands.padding("8px", "24px"),
    transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.1s ease",
    ":hover": {
      backgroundColor: "#f8fafc",
      color: "#1e293b",
      ...shorthands.borderColor("#94a3b8"),
    },
    ":active": {
      transform: "scale(0.98)",
    }
  },
  dangerBtn: {
    backgroundColor: "transparent",
    color: "#ef4444",
    ...shorthands.border("1.5px", "solid", "#fca5a5"),
    fontWeight: "600",
    ...shorthands.borderRadius("9999px"),
    ...shorthands.padding("8px", "24px"),
    transition: "background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.1s ease",
    ":hover": {
      backgroundColor: "#fef2f2",
      ...shorthands.borderColor("#ef4444"),
      color: "#ef4444",
    },
    ":active": {
      transform: "scale(0.98)",
    }
  },
  impactPanelCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  impactPanelHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  impactStatGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  impactStatCard: {
    backgroundColor: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "14px 12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  impactStatLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  impactStatNumber: {
    fontSize: "32px",
    fontWeight: "800",
    lineHeight: "1",
  },
  impactStatSubtitle: {
    fontSize: "11px",
    color: "#94a3b8",
  },
  approverRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  approverAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    backgroundColor: "#6366f1",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
    flexShrink: 0,
  },
  statusBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid",
  },
});



// ─── Mobile responsive hook ───────────────────────────────────────────────
const useIsMobile = (breakpoint = 520) => {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth <= breakpoint);
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [breakpoint]);
  return isMobile;
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return "--:--";
  try {
    // Extract HH:mm directly from ISO strings (e.g. "1970-01-01T17:00:00Z") to avoid
    // UTC→IST conversion that shifts the displayed time by 5h30m.
    const timePart = timeStr.includes('T')
      ? timeStr.split('T')[1].replace(/Z$|[+-]\d{2}:\d{2}$/, "").slice(0, 5)
      : timeStr.slice(0, 5);
    const [h, m] = timePart.split(':');
    const hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${m} ${ampm}`;
  } catch (e) {
    return timeStr;
  }
};

const MyRequests: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();
  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  // Tabs State
  const initialTab = searchParams.get("tab") || "leave";
  const [selectedTab, setSelectedTab] = useState<string>(initialTab);

  // Shared Data
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [compOffs,setCompOffs] = useState<CompOffRequest[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<EntraADUser | null>(null);

  // Leave Form State
  const [leaveType, setLeaveType] = useState("");
  const [leaveStart, setLeaveStart] = useState("");
  const [halfLeave, setHalfLeave] = useState(false);
  const [halfLeaveSession, setHalfLeaveSession] = useState("1");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequestRecord[]>([]);

  // Permission Form State
  const [permDate, setPermDate] = useState("");
  const [isNightShift,setIsNightShift] = useState(false)
  const [permStart, setPermStart] = useState("");
  const [permEnd, setPermEnd] = useState("");
  const [permReason, setPermReason] = useState("");
  const [permissionHistory, setPermissionHistory] = useState<PermissionRequest[]>([]);

  // Pagination State
  const [leavePage, setLeavePage] = useState(1);
  const [permPage, setPermPage] = useState(1);
  const [leavePageSize, setLeavePageSize] = useState<number>(5);
  const [permPageSize, setPermPageSize] = useState<number>(5);

  // Permission Logic
  const [permDuration, setPermDuration] = useState("0");

  // Regularization State
  const [regularizationHistory, setRegularizationHistory] = useState<RegularizationRecord[]>([]);
  const [regPage, setRegPage] = useState(1);
  const [regPageSize, setRegPageSize] = useState<number>(5);
  const [createRegOpen, setCreateRegOpen] = useState(false);
  const [regType, setRegType] = useState<'IsCheckIn' | 'IsLeave' | ''>('');
  const [regDate, setRegDate] = useState('');
  const [regActualTime, setRegActualTime] = useState('');
  const [regActualOutTime, setRegActualOutTime] = useState('');
  const [regReason, setRegReason] = useState('');
  const [loading,setIsLoading] = useState(false)

  // Drawer & Status State
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestRecord | PermissionRequest | RegularizationRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"leave" | "permission" | "regularization" | null>(null);

  // Create Dialog State
  const [createLeaveOpen, setCreateLeaveOpen] = useState(false);
  const [createPermissionOpen, setCreatePermissionOpen] = useState(false);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);

  const { attendanceConfigs } = useConfigurations()

  const maxPermissionHrs = attendanceConfigs.find((item) => item.ConfigurationKey === "MAX_PERM_REQ_HRS")?.Value || 1
  const maxRegularizationLimit = attendanceConfigs.find((item) => item.ConfigurationKey === "MAX_REG")?.Value || 1



  // Duration in minutes, aware of overnight (night shift) permissions where end can be on the next day.
  const getPermDurationMinutes = (start: string, end: string, nightShift: boolean) => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    const startMin = sH * 60 + sM;
    let durationMin = (eH * 60 + eM) - startMin;
    // For night shifts, an end time at or before the start means it rolls over past midnight.
    if (durationMin <= 0 && nightShift) durationMin += 24 * 60;
    return durationMin;
  };

  const calculateDuration = (start: string, end: string) => {
    const durationMin = getPermDurationMinutes(start, end, isNightShift);
    if (durationMin <= 0) return "0";
    return (durationMin / 60).toFixed(1).replace(/\.0$/, "");
  };

  useEffect(() => {
    if (regType === "IsCheckIn") {
      setRegActualOutTime("")

    }
    else {
      if (regDate === new Date(Date.now()).toISOString().split('T')[0]) {
        setRegDate("")
      }
    }
  }, [regType])

  const calculateEndTime = (start: string, durationStr: string) => {
    if (!start || !durationStr) return "";
    const duration = parseFloat(durationStr);
    if (isNaN(duration) || duration <= 0) return "";
    const [sH, sM] = start.split(":").map(Number);
    const startMin = sH * 60 + sM;
    const endMin = startMin + Math.round(duration * 60);
    const hours = Math.floor(endMin / 60) % 24;
    const mins = endMin % 60;
    return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const handlePermTimeChange = (start: string, end: string) => {
    const dur = calculateDuration(start, end);
    setPermDuration(dur);
  };

  const fetchHistoryAndBalances = React.useCallback(async () => {
    if (!currentUser?.userID) return;
    try {
      setIsLoading(true)
      const [leaveHistRes, permHistData, balanceRes, regHistRes, compOffs] = await Promise.all([
        getLeaveHistory(currentUser.userID),
        getPermissionHistory(currentUser.userID),
        getLeaveBalances(currentUser.userID),
        getRegularizationHistory(currentUser.userID),
        getUserCompOffRequests(currentUser.userID)
      ]);

      if (leaveHistRes.success && leaveHistRes.data) setLeaveHistory(leaveHistRes.data);
      if (permHistData) setPermissionHistory(permHistData);
      if (balanceRes.success && balanceRes.data) setBalances(balanceRes.data);
      if (regHistRes.success && regHistRes.data) setRegularizationHistory(regHistRes.data);
      if (compOffs) setCompOffs(compOffs)
    } catch (error) {
      console.error("Error fetching history/balances:", error);
    }
    finally{
      setIsLoading(false)
    }
  }, [currentUser?.userID]);

  useEffect(() => {
    if (!createPermissionOpen) {
      setPermDate("")
      setPermStart("")
      setPermEnd("")
      setPermReason("")
      setPermDuration("")
      setIsNightShift(false)
    }
  }, [createPermissionOpen])

  useEffect(() => {
    if (currentUser?.userID) {
      fetchHistoryAndBalances();
      getEntraUserById(currentUser.userID).then(res => {
        if (res.success && res.data) {
          setUserData(res.data);
        }
      });
    }

    getHolidaysByYear(new Date().getFullYear()).then(res => {
      if (res.success && res.data) {
        setHolidays(res.data);
      }
    });
  }, [currentUser?.userID, fetchHistoryAndBalances]);

  // Sync tab from URL if it changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && (tab === "leave" || tab === "permission" || tab === "regularization")) {
      setSelectedTab(tab);
    }
  }, [searchParams]);

  // Handle deep-linking actions (e.g. auto-opening "Create" Permission/Leave/Regularization from Dashboard) FIX: REDIRECTING TO ACTIONS FROM MANAGER DASHBOARD
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "create") {
      if (selectedTab === "permission") setCreatePermissionOpen(true);
      else if (selectedTab === "leave") setCreateLeaveOpen(true);
      else if (selectedTab === "regularization") setCreateRegOpen(true);

      // Clean up the URL after opening so it doesn't re-open on refresh or tab switch
      const newParams = new URLSearchParams(searchParams);
      setTimeout(() => {
        newParams.delete("action");
        navigate({ search: newParams.toString() }, { replace: true });
      }, 1500)

    }
  })

  // Derived Values
  const selectedBalance = useMemo(() =>
    balances.find(b => b.LeaveNameType === leaveType),
    [balances, leaveType]
  );

  // Comp offs that are approved and not yet consumed by an approved leave.
  const approvedUnconsumedCompOffs = useMemo(
    () => compOffs.filter(c => c.Status === "Approved" && c.IsConsumed === false).length,
    [compOffs]
  );

  const calculatedDays = useMemo(() => {
    const isWorkingDay = (date: Date) => {
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isHoliday = holidays.some(h => {
        const hString = typeof h.HolidayDate === 'string' ? h.HolidayDate.split('T')[0] : '';
        if (!hString) return false;
        const [hY, hM, hD] = hString.split('-').map(Number);
        return new Date(hY, hM - 1, hD).toDateString() === date.toDateString();
      });
      return !isWeekend && !isHoliday;
    };

    if (halfLeave) {
      if (!leaveStart) return 0;
      const [sY, sM, sD] = leaveStart.split('-').map(Number);
      return isWorkingDay(new Date(sY, sM - 1, sD)) ? 0.5 : 0;
    }

    if (!leaveStart || !leaveEnd) return 0;

    // Robust parsing for YYYY-MM-DD as Local Midnight
    const [sY, sM, sD] = leaveStart.split('-').map(Number);
    const [eY, eM, eD] = leaveEnd.split('-').map(Number);

    const start = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);

    if (end < start) return 0;

    let days = 0;
    let curr = new Date(start);
    while (curr <= end) {
      if (isWorkingDay(curr)) days++;
      curr.setDate(curr.getDate() + 1);
    }

    return Math.max(0, days);
  }, [leaveStart, leaveEnd, holidays, halfLeave]);


  const handleSelectHalfLeave = () => {
    setHalfLeave(!halfLeave)
    if (halfLeave === false) {
      setLeaveStart("")
      setLeaveEnd("")
    }
  }

  const handleHalfDateSelect = (value: string) => {
    setLeaveStart(value)
    setLeaveEnd(value)
  }

  const handleSubmitLeave = async () => {
    if (!currentUser?.userID || !leaveType || !leaveStart || !leaveEnd || !leaveReason) return;

    const [sY, sM, sD] = leaveStart.split('-').map(Number);
    const [eY, eM, eD] = leaveEnd.split('-').map(Number);
    const start = new Date(sY, sM - 1, sD);
    const end = new Date(eY, eM - 1, eD);

    if (end < start) {
      dispatchToast(
        <Toast><ToastTitle>Validation Error</ToastTitle><ToastBody>From date cannot be greater than To date.</ToastBody></Toast>,
        { intent: "error" }
      );
      return;
    }



    setIsSubmitting(true);
    try {
      const res = await submitLeaveRequest({
        RequestorID: currentUser.userID,
        RequestorName: currentUser.displayName || "User",
        Start_Date: leaveStart,
        End_Date: leaveEnd,
        LeaveNameType: leaveType,
        Reason: leaveReason || "",
        ManagerID: userData?.ManagerID || undefined,
        ManagerName: userData?.ManagerDisplayName || undefined,
        HalfDay: halfLeave ? halfLeave : false,
        HalfSession: halfLeaveSession?.toString()
      }, currentUser.userID);

      if (res.success) {
        dispatchToast(
          <Toast><ToastTitle>Success</ToastTitle><ToastBody>Leave request submitted successfully.</ToastBody></Toast>,
          { intent: "success" }
        );
        fetchHistoryAndBalances();
        setLeaveStart("");
        setLeaveEnd("");
        setLeaveReason("");
        setLeaveType("");
        setLeavePage(1);
        setCreateLeaveOpen(false);
      } else {
        dispatchToast(
          <Toast><ToastTitle>Error</ToastTitle><ToastBody>{res.message}</ToastBody></Toast>,
          { intent: "error" }
        );
      }
    } catch (err) {
      dispatchToast(
        <Toast><ToastTitle>Error</ToastTitle><ToastBody>Failed to submit request.</ToastBody></Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const toIST = (date: string | Date): Date => {
    return new Date(new Date(date).getTime() + 5.5 * 60 * 60 * 1000);
  };

  const handleSubmitPermission = async () => {
    if (!currentUser?.userID || !permDate || !permStart || !permEnd) return;

    const durationMins = getPermDurationMinutes(permStart, permEnd, isNightShift);
    if (durationMins <= 0) {
      dispatchToast(
        <Toast><ToastTitle>Validation Error</ToastTitle><ToastBody>{isNightShift ? "To time must differ from From time." : "From time must be before To time."}</ToastBody></Toast>,
        { intent: "error" }
      );
      return;
    }
    const maxMins = (parseFloat(maxPermissionHrs?.toString() || "0") || 0) * 60;
    if (maxMins > 0 && durationMins > maxMins) {
      dispatchToast(
        <Toast><ToastTitle>Validation Error</ToastTitle><ToastBody>{`Permission duration cannot exceed ${maxPermissionHrs?.toString()} hours.`}</ToastBody></Toast>,
        { intent: "error" }
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPermissionRequest({
        empId: currentUser.userID,
        reason: permReason || "",
        date: permDate,
        startTime: permStart,
        endTime: permEnd,
        createdBy: currentUser.userID,
        isNightShift: isNightShift,
      });
      if (res) {
        dispatchToast(
          <Toast><ToastTitle>Success</ToastTitle><ToastBody>Permission request submitted.</ToastBody></Toast>,
          { intent: "success" }
        );
        fetchHistoryAndBalances();
        setPermDate("");
        setPermStart("");
        setPermEnd("");
        setPermReason("");
        setPermPage(1);
        setCreatePermissionOpen(false);
      }
    } catch (err: any) {
      dispatchToast(
        <Toast><ToastTitle>Error</ToastTitle><ToastBody>{err.message || "Failed to submit request."}</ToastBody></Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!currentUser?.userID || !selectedRequest || drawerType !== 'leave') return;
    setIsSubmitting(true);
    try {
      const res = await withdrawLeaveRequest(selectedRequest.ID, currentUser.userID);
      if (res.success) {
        dispatchToast(
          <Toast><ToastTitle>Withdrawn</ToastTitle><ToastBody>Leave request has been withdrawn.</ToastBody></Toast>,
          { intent: "success" }
        );
        setDrawerOpen(false);
        setWithdrawConfirmOpen(false);
        fetchHistoryAndBalances();
      } else {
        dispatchToast(
          <Toast><ToastTitle>Error</ToastTitle><ToastBody>{res.message}</ToastBody></Toast>,
          { intent: "error" }
        );
      }
    } catch (err) {
      dispatchToast(
        <Toast><ToastTitle>Error</ToastTitle><ToastBody>Failed to withdraw request.</ToastBody></Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMobile = useIsMobile(520);

  // ---- Permission time validation (overnight / night-shift aware) ----
  const permDurationMins = getPermDurationMinutes(permStart, permEnd, isNightShift);
  const permMaxMins = (parseFloat(maxPermissionHrs?.toString() || "0") || 0) * 60;
  const hasPermTimes = !!(permStart && permEnd);
  const permOrderInvalid = hasPermTimes && permDurationMins <= 0; // end not after start (rollover accounted for)
  const permExceedsMax = hasPermTimes && permMaxMins > 0 && permDurationMins > permMaxMins;
  const permTimeError = permOrderInvalid || permExceedsMax;
  // Night-shift permission where end time is earlier than start rolls over past midnight into the next day.
  const permOvernight = hasPermTimes && isNightShift && permEnd < permStart;
  const nextDayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  if(loading){
    return(
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center space-y-4">
            <Spinner/>
            <Text>Loading...</Text>

      </div>
    )
  }

  return (
    <div className={styles.root}>
      <Toaster toasterId={toasterId} />

      {/* PAGE HEADER */}
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button icon={<ArrowLeftRegular />} appearance="subtle" onClick={() => navigate("/Attendance")} />
          <Text className={styles.title}>My Requests</Text>
        </div>
      </div>

      <TabList
        className={styles.tabList}
        selectedValue={selectedTab}
        onTabSelect={(_, d) => setSelectedTab(d.value as string)}
        style={{ flexWrap: 'wrap' }}
      >
        <Tab value="leave" icon={<CalendarMonthRegular />}>Leave</Tab>
        <Tab value="permission" icon={<ClockRegular />}>Permission</Tab>
        <Tab value="regularization" icon={<HistoryRegular />}>Fix My Attendance</Tab>
      </TabList>

      {/* LEAVE TAB */}
      {selectedTab === 'leave' && (
        <div className={styles.leaveTabGrid}>

          {/* Main column: history */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card className={styles.formCard} style={{ padding: isMobile ? '16px' : '24px' }}>
              {/* History header */}
              <div className={styles.listHeader}>
                <div>
                  <Text weight="bold" size={500}>Leave Requests</Text>
                  <Text size={200} style={{ color: '#64748b', display: 'block', marginTop: '2px' }}>
                    {leaveHistory.length} request{leaveHistory.length !== 1 ? 's' : ''} found
                  </Text>
                </div>
                <Button
                  className={styles.secondaryBlueBtn}
                  icon={<AddCircleRegular />}
                  onClick={() => setCreateLeaveOpen(true)}
                >
                  {isMobile ? 'New Leave' : 'New Leave Request'}
                </Button>
              </div>

              {/* Leave history list */}
              {leaveHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
                  <CalendarMonthRegular style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }} />
                  <Text size={300} style={{ display: 'block', color: '#94a3b8' }}>No leave requests yet</Text>
                  <Text size={200} style={{ color: '#cbd5e1', marginTop: '4px' }}>Click "Create Leave Request" to get started</Text>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {leaveHistory.slice((leavePage - 1) * leavePageSize, leavePage * leavePageSize).map((req) => (
                    <Card key={req.ID} style={{ padding: '14px 18px', border: '1px solid #f1f5f9', boxShadow: 'none', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <Text weight="semibold" size={300}>{displayLeaveLabel(req.LeaveName)}</Text>
                          <Text size={100} style={{ color: '#64748b' }}>
                            {new Date(req.Start_Date).toLocaleDateString()} &ndash; {new Date(req.End_Date).toLocaleDateString() + " " + (req.Halfday ? req.HalfSession === "1" ? "1st Half" : "2nd half" : "")}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <Badge
                            appearance="filled"
                            color={req.ApprovalStatus === 'Approved' ? 'success' : req.ApprovalStatus === 'Rejected' ? 'danger' : 'warning'}
                          >
                            {req.ApprovalStatus}
                          </Badge>
                          <Button
                            size="small"
                            appearance="subtle"
                            icon={<Eye20Regular />}
                            onClick={() => { setSelectedRequest(req); setDrawerType('leave'); setDrawerOpen(true); }}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}

                  {leaveHistory.length > 5 && (
                    <div className={styles.paginationRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Text size={100} style={{ color: '#64748b' }}>Show:</Text>
                        <select
                          value={leavePageSize}
                          onChange={(e) => {
                            setLeavePageSize(Number(e.target.value));
                            setLeavePage(1);
                          }}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            background: '#fff',
                            cursor: 'pointer'
                          }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={15}>15</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Button size="small" appearance="subtle" icon={<ChevronLeftRegular />} disabled={leavePage === 1} onClick={() => setLeavePage(p => Math.max(1, p - 1))}>Prev</Button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Text size={100} weight="semibold">Page</Text>
                          <select
                            value={leavePage}
                            onChange={(e) => setLeavePage(Number(e.target.value))}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              fontSize: '12px',
                              background: '#fff',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            {Array.from({ length: Math.ceil(leaveHistory.length / leavePageSize) }, (_, i) => (
                              <option key={i + 1} value={i + 1}>{i + 1}</option>
                            ))}
                          </select>
                          <Text size={100} weight="semibold">of {Math.ceil(leaveHistory.length / leavePageSize)}</Text>
                        </div>
                        <Button size="small" appearance="subtle" icon={<ChevronRightRegular />} iconPosition="after" disabled={leavePage >= Math.ceil(leaveHistory.length / leavePageSize)} onClick={() => setLeavePage(p => p + 1)}>Next</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Right column: balances + policy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card className={styles.formCard} style={{ padding: '20px' }}>
              <Text weight="bold" size={400} block style={{ marginBottom: '12px' }}>My balances</Text>
              <div>
                {balances.filter(b=>b.IsDisabled === false).map(b => {
                  const used = b.UsedDays || 0;
                  const total = b.TotalDays || 1;
                  const percent = (used / total) * 100;
                  return (
                    <div key={b.LeaveNameType} className={styles.balanceItem}>
                      <div className={styles.balanceHeader}>
                        <Text size={200} weight="semibold">{displayLeaveLabel(b.LeaveType)}</Text>
                        <Text size={200} weight="bold">{b.AvailableDays}/{total}</Text>
                      </div>
                      <ProgressBar className={styles.progressBar} value={used} max={total} color={percent > 80 ? 'error' : percent > 50 ? 'warning' : 'brand'} />
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className={styles.formCard} style={{ padding: '20px', backgroundColor: '#fdfcfe', border: '1px solid #f3e8ff' }}>
              <Text weight="bold" size={400} block style={{ marginBottom: '8px', color: '#6b21a8' }}>Leave policy at a glance</Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Badge size="small" appearance="outline" color="brand">Tip</Badge>
                  <Text size={200} style={{ color: '#4c1d95' }}>Casual leave must be applied 2 days in advance.</Text>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <Badge size="small" appearance="outline" color="brand">Tip</Badge>
                  <Text size={200} style={{ color: '#4c1d95' }}>Sick leave can be applied on the same day.</Text>
                </div>
                {/* <Text size={100} weight="semibold" style={{ color: '#7c3aed', cursor: 'pointer', marginTop: '4px' }}>Read full policy &rarr;</Text> */}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* PERMISSION TAB */}
      {selectedTab === 'permission' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card className={styles.formCard} style={{ padding: isMobile ? '16px' : '24px' }}>
            <div className={styles.listHeader}>
              <div>
                <Text weight="bold" size={500}>Permission Requests</Text>
                <Text size={200} style={{ color: '#64748b', display: 'block', marginTop: '2px' }}>
                  {permissionHistory.length} request{permissionHistory.length !== 1 ? 's' : ''} found
                </Text>
              </div>
              <Button
                className={styles.secondaryBlueBtn}
                icon={<AddCircleRegular />}
                onClick={() => setCreatePermissionOpen(true)}
              >
                {isMobile ? 'New Permission' : 'New Permission Request'}
              </Button>
            </div>

            {permissionHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <ClockRegular style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }} />
                <Text size={300} style={{ display: 'block', color: '#94a3b8' }}>No permission requests yet</Text>
                <Text size={200} style={{ color: '#cbd5e1', marginTop: '4px' }}>Click "Create Permission Request" to get started</Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {permissionHistory.slice((permPage - 1) * permPageSize, permPage * permPageSize).map((req) => (
                  <Card key={req.ID} style={{ padding: '14px 18px', border: '1px solid #f1f5f9', boxShadow: 'none', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <Text weight="semibold" size={300}>Permission</Text>
                        <Text size={100} style={{ color: '#64748b' }}>
                          {new Date(req.Date).toLocaleDateString()} | {formatTime(req.StartTime)} &ndash; {formatTime(req.EndTime)}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Badge
                          appearance="filled"
                          color={req.ApprovalStatus === 'Approved' ? 'success' : req.ApprovalStatus === 'Rejected' ? 'danger' : 'warning'}
                        >
                          {req.ApprovalStatus}
                        </Badge>
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<Eye20Regular />}
                          onClick={() => { setSelectedRequest(req); setDrawerType('permission'); setDrawerOpen(true); }}
                        />
                      </div>
                    </div>
                  </Card>
                ))}

                {permissionHistory.length > 5 && (
                  <div className={styles.paginationRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text size={100} style={{ color: '#64748b' }}>Show:</Text>
                      <select
                        value={permPageSize}
                        onChange={(e) => {
                          setPermPageSize(Number(e.target.value));
                          setPermPage(1);
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          background: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Button size="small" appearance="subtle" icon={<ChevronLeftRegular />} disabled={permPage === 1} onClick={() => setPermPage(p => Math.max(1, p - 1))}>Prev</Button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Text size={100} weight="semibold">Page</Text>
                        <select
                          value={permPage}
                          onChange={(e) => setPermPage(Number(e.target.value))}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            background: '#fff',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          {Array.from({ length: Math.ceil(permissionHistory.length / permPageSize) }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                        <Text size={100} weight="semibold">of {Math.ceil(permissionHistory.length / permPageSize)}</Text>
                      </div>
                      <Button size="small" appearance="subtle" icon={<ChevronRightRegular />} iconPosition="after" disabled={permPage >= Math.ceil(permissionHistory.length / permPageSize)} onClick={() => setPermPage(p => p + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* REGULARIZATION TAB */}
      {selectedTab === 'regularization' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card className={styles.formCard} style={{ padding: isMobile ? '16px' : '24px' }}>
            <div className={styles.listHeader}>
              <div>
                <Text weight="bold" size={500}>Regularization Requests</Text>
                <Text size={200} style={{ color: '#64748b', display: 'block', marginTop: '2px' }}>
                  {regularizationHistory.length} request{regularizationHistory.length !== 1 ? 's' : ''} found
                </Text>
              </div>
              <Button
                className={styles.secondaryBlueBtn}
                icon={<AddCircleRegular />}
                onClick={() => { setRegType(''); setRegDate(''); setRegActualTime(''); setRegReason(''); setCreateRegOpen(true); }}
              >
                {isMobile ? 'Fix Attendance' : 'Fix My Attendance'}
              </Button>
            </div>

            {regularizationHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <HistoryRegular style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }} />
                <Text size={200} style={{ color: '#cbd5e1', marginTop: '4px' }}>Click "Create Regularization" to get started</Text>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {regularizationHistory.slice((regPage - 1) * regPageSize, regPage * regPageSize).map((req) => (
                  <Card key={req.ID} style={{ padding: '14px 18px', border: '1px solid #f1f5f9', boxShadow: 'none', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {req.IsCheckIn ? (
                            <Clock size={14} style={{ color: '#7c3aed', flexShrink: 0 }} />
                          ) : (
                            <ClipboardList size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                          )}
                          <Text weight="semibold" size={300}>
                            {req.IsCheckIn ? 'Late Check-In' : 'Forgot to Check-In & Check-Out'}
                          </Text>
                        </div>
                        <Text size={100} style={{ color: '#64748b' }}>
                          {toIST(req.RegularizeDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          {req.ActualStartTime && ` · Claimed: ${formatTime(toIST(req.ActualStartTime).toISOString())}`}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Badge
                          appearance="filled"
                          color={req.ManagerApprovalStatus === 'Approved' ? 'success' : req.ManagerApprovalStatus === 'Rejected' ? 'danger' : 'warning'}
                        >
                          {req.ManagerApprovalStatus}
                        </Badge>
                        <Button
                          size="small"
                          appearance="subtle"
                          icon={<Eye20Regular />}
                          onClick={() => { setSelectedRequest(req); setDrawerType('regularization'); setDrawerOpen(true); }}
                        />
                      </div>
                    </div>
                    {req.Reason && (
                      <Text size={100} style={{ color: '#94a3b8', marginTop: '6px', display: 'block' }}>
                        {req.Reason}
                      </Text>
                    )}
                  </Card>
                ))}

                {regularizationHistory.length > 5 && (
                  <div className={styles.paginationRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Text size={100} style={{ color: '#64748b' }}>Show:</Text>
                      <select
                        value={regPageSize}
                        onChange={(e) => {
                          setRegPageSize(Number(e.target.value));
                          setRegPage(1);
                        }}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          fontSize: '12px',
                          background: '#fff',
                          cursor: 'pointer'
                        }}
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Button size="small" appearance="subtle" icon={<ChevronLeftRegular />} disabled={regPage === 1} onClick={() => setRegPage(p => Math.max(1, p - 1))}>Prev</Button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Text size={100} weight="semibold">Page</Text>
                        <select
                          value={regPage}
                          onChange={(e) => setRegPage(Number(e.target.value))}
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            fontSize: '12px',
                            background: '#fff',
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                        >
                          {Array.from({ length: Math.ceil(regularizationHistory.length / regPageSize) }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                        <Text size={100} weight="semibold">of {Math.ceil(regularizationHistory.length / regPageSize)}</Text>
                      </div>
                      <Button size="small" appearance="subtle" icon={<ChevronRightRegular />} iconPosition="after" disabled={regPage >= Math.ceil(regularizationHistory.length / regPageSize)} onClick={() => setRegPage(p => p + 1)}>Next</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* CREATE REGULARIZATION DIALOG */}
      <Dialog open={createRegOpen} onOpenChange={(_, d) => setCreateRegOpen(d.open)} modalType="modal">
        <DialogSurface style={{ maxWidth: '560px', width: '90vw', borderRadius: '20px', padding: 0 }}>
          <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <DialogTitle style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text size={600} weight="bold" style={{ display: 'block' }}>New Regularization Request</Text>
                <Text size={200} style={{ color: '#64748b' }}>Select type and fill in the details to submit for approval</Text>
              </div>
              <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setCreateRegOpen(false)} />
            </DialogTitle>

            <DialogContent style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Type Selector */}
                <Field label="What do you want to fix?" required>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                    <div
                      onClick={() => setRegType('IsCheckIn')}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${regType === 'IsCheckIn' ? '#7c3aed' : '#e2e8f0'}`,
                        background: regType === 'IsCheckIn' ? '#faf5ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Clock size={16} color={regType === 'IsCheckIn' ? '#7c3aed' : '#64748b'} style={{ flexShrink: 0 }} />
                      <Text weight="semibold" size={300} style={{ color: regType === 'IsCheckIn' ? '#7c3aed' : '#1e293b' }}>Forgot to Check-In</Text>
                      {/* <Text size={100} style={{ color: '#64748b', marginTop: '4px' }}>I have a check-in but arrived late</Text> */}
                    </div>
                    <div
                      onClick={() => setRegType('IsLeave')}
                      style={{
                        padding: '16px',
                        borderRadius: '12px',
                        border: `2px solid ${regType === 'IsLeave' ? '#7c3aed' : '#e2e8f0'}`,
                        background: regType === 'IsLeave' ? '#faf5ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <ClipboardList size={16} color={regType === 'IsLeave' ? '#7c3aed' : '#64748b'} style={{ flexShrink: 0 }} />
                      <Text weight="semibold" size={300} style={{ color: regType === 'IsLeave' ? '#7c3aed' : '#1e293b' }}>Forgot to Check-In & Out</Text>
                      {/* <Text size={100} style={{ color: '#64748b', marginTop: '4px' }}>I forgot to mark attendance for a day</Text> */}
                    </div>
                  </div>
                </Field>

                {/* Date to Regularize */}
                <Field label="Attendance Date" required hint="Must be a past date">
                  <Input
                    type="date"
                    value={regDate}
                    max={regType === 'IsLeave' ? new Date(Date.now() - 86400000).toISOString().split('T')[0] : new Date(Date.now()).toISOString().split('T')[0]}
                    onChange={(_, d) => setRegDate(d.value)}
                  />
                </Field>

                {/* Actual Check-In Time */}
                <Field label="Claimed Check-In Time" required hint="What time did you (or should have) started work?">
                  <Input
                    type="time"
                    value={regActualTime}
                    onChange={(_, d) => setRegActualTime(d.value)}
                  />
                </Field>

                {/* Actual Check-out Time */}
                <Field label="Claimed Check-Out Time" required={regType !== "IsCheckIn"} hint="What time did you (or should have) finished work?">
                  <Input
                    type="time"
                    value={regActualOutTime}
                    disabled={regType === "IsCheckIn"}
                    onChange={(_, d) => setRegActualOutTime(d.value)}
                  />
                </Field>

                {/* Reason */}
                <Field label="Reason" required>
                  <Textarea
                    placeholder="Briefly explain why you are regularizing attendance..."
                    value={regReason}
                    onChange={(_, d) => setRegReason(d.value)}
                    rows={3}
                  />
                </Field>

              </div>
            </DialogContent>

            <DialogActions style={{ padding: '0 28px 24px', justifyContent: 'flex-end', gap: '10px' }}>
              <Button className={styles.secondaryGreyBtn} onClick={() => setCreateRegOpen(false)}>Cancel</Button>
              <Button
                className={styles.primaryBtn}
                disabled={isSubmitting || !regType || !regDate || !regActualTime || !regReason.trim() || (regType === "IsLeave" && (!regActualOutTime || regActualOutTime?.trim() === ""))}
                icon={<SendRegular />}
                onClick={async () => {
                  if (!currentUser?.userID || !regType || !regDate || !regActualTime || !regReason.trim()) return;
                  setIsSubmitting(true);
                  try {
                    // ── Validate: Late Check-In requires an existing check-in for that date ──
                    if (regType === 'IsCheckIn') {
                      const [y, m] = regDate.split('-').map(Number);
                      const history = await getAttendanceHistory(currentUser.userID, m, y);
                      const recordForDate = (history ?? []).find(r => {
                        const recDate = r.CheckIn
                          ? (r.CheckIn.includes('T') ? r.CheckIn.split('T')[0] : r.CheckIn)
                          : null;
                        return recDate === regDate;
                      });
                      if (!recordForDate?.CheckIn) {
                        dispatchToast(
                          <Toast>
                            <ToastTitle>No check-in found</ToastTitle>
                            <ToastBody>You have no check-in record for {new Date(regDate + 'T00:00:00').toLocaleDateString('en-IN', { dateStyle: 'medium' })}. If you were absent, use "Forgot Check-In &amp; Out" instead.</ToastBody>
                          </Toast>,
                          { intent: 'error' }
                        );
                        setIsSubmitting(false);
                        return;
                      }
                    }

                    // Build datetime string with explicit IST offset to preserve the user-entered time
                    const actualStartTimeISO = `${regDate}T${regActualTime}:00+05:30`;
                    const actualEndTimeISO = regActualOutTime ? `${regDate}T${regActualOutTime}:00+05:30` : null;

                    if (regType === "IsLeave") {
                      if (!actualEndTimeISO || new Date(actualEndTimeISO) <= new Date(actualStartTimeISO)) {
                        dispatchToast(
                          <Toast>
                            <ToastTitle>Validation</ToastTitle>
                            <ToastBody>Invalid Check-In &amp; Check-Out time provided</ToastBody>
                          </Toast>,
                          { intent: 'error' }
                        );
                        setIsSubmitting(false);
                        return;
                      }
                    }
                    const result = await submitRegularizationRequest({
                      userID: currentUser.userID,
                      userName: userData?.DisplayName || currentUser.userID,
                      isCheckIn: regType === 'IsCheckIn',
                      isLeave: regType === 'IsLeave',
                      regularizeDate: regDate,
                      reason: regReason.trim(),
                      actualStartTime: actualStartTimeISO,
                      actualEndTime: regActualOutTime ? actualEndTimeISO : null

                    });
                    if (result.success) {
                      setCreateRegOpen(false);
                      setRegType('');
                      setRegDate('');
                      setRegActualTime('');
                      setRegReason('');
                      fetchHistoryAndBalances();
                      dispatchToast(
                        <Toast><ToastTitle>Request submitted!</ToastTitle><ToastBody>Your regularization request has been sent to your manager for approval.</ToastBody></Toast>,
                        { intent: 'success' }
                      );
                    } else {
                      dispatchToast(
                        <Toast><ToastTitle>Submission failed</ToastTitle><ToastBody>{result.message || 'An error occurred.'}</ToastBody></Toast>,
                        { intent: 'error' }
                      );
                    }
                  } catch (err: any) {
                    dispatchToast(
                      <Toast><ToastTitle>Error</ToastTitle><ToastBody>{err.message || 'Unexpected error.'}</ToastBody></Toast>,
                      { intent: 'error' }
                    );
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* CREATE LEAVE DIALOG */}
      <Dialog open={createLeaveOpen} onOpenChange={(_, d) => setCreateLeaveOpen(d.open)} modalType="modal">
        <DialogSurface style={{ maxWidth: '860px', width: '90vw', borderRadius: '20px', padding: 0 }}>
          <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {/* Dialog header */}
            <DialogTitle style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text size={600} weight="bold" style={{ display: 'block' }}>New Leave Request</Text>
                <Text size={200} style={{ color: '#64748b' }}>Fill in the details and submit for approval</Text>
              </div>
              <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setCreateLeaveOpen(false)} />
            </DialogTitle>

            <DialogContent style={{ padding: '20px 24px' }}>
              <div className={styles.leaveDialogGrid}>

                {/* Form fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className={styles.gridTwo}>
                    <Field label="Leave Category" required>
                      <Select value={leaveType} onChange={(_, d) => setLeaveType(d.value)}>
                        <option value="">Select leave type...</option>
                        {balances.map(b => {
                          // Pending leaves applied specifically against THIS comp-off category
                          // (matched by the comp off's own LeaveNameType — not all pending leaves).
                          // IsConsumed only flips true on approval, so subtract these to stop re-applying.
                          const pendingCompOffLeaves = leaveHistory.filter(
                            l => l.LeaveNameType === b.LeaveNameType && l.ApprovalStatus === "Pending" && b.IsDisabled
                          ).length;
                          const noSelectableCompOff = approvedUnconsumedCompOffs - pendingCompOffLeaves <= 0;
                          return (
                            <option
                              hidden={b.IsDisabled && noSelectableCompOff}
                              key={b.LeaveNameType}
                              value={b.LeaveNameType}
                            >
                              {displayLeaveLabel(b.LeaveType)}
                            </option>
                          );
                        })}
                      </Select>
                    </Field>
                    <Field label="Available Balance">
                      <div className={styles.balanceChip}>
                        {selectedBalance ? `${selectedBalance.AvailableDays} days remaining` : '--'}
                        <InfoRegular height={16} />
                      </div>
                    </Field>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                      {/* <Text size={200} weight="semibold" style={{ color: '#475569' }}>Date Selection</Text> */}
                      <Checkbox
                        label="Half Day"
                        checked={halfLeave}
                        onChange={() => handleSelectHalfLeave()}
                        disabled={selectedBalance?.IsDisabled}
                      />
                    </div>

                    {halfLeave ? (
                      <div className={styles.gridTwo}>
                        <Field
                          label="Date"
                          required
                        >
                          <Input
                            type="date"
                            value={leaveStart}
                            onChange={(_, d) => handleHalfDateSelect(d.value)}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </Field>
                        <Field label="Session">
                          <Select
                            value={halfLeaveSession}
                            onChange={(e) => setHalfLeaveSession(e.target.value)}
                          >
                            <option value="1">1st Half</option>
                            <option value="2">2nd Half</option>
                          </Select>
                        </Field>
                      </div>
                    ) : (
                      <div className={styles.gridTwo}>
                        <Field
                          label="Start Date"
                          required
                          validationState={leaveStart && leaveEnd && new Date(leaveStart) > new Date(leaveEnd) ? 'error' : 'none'}
                        >
                          <Input
                            type="date"
                            value={leaveStart}
                            onChange={(_, d) =>{
                              if(selectedBalance?.IsDisabled){
                                setLeaveStart(d.value)
                                setLeaveEnd(d.value)
                              }
                              else{
                                setLeaveStart(d.value)
                              }
                               
                              }}
                            min={new Date().toISOString().split('T')[0]}
                          />
                        </Field>
                        <Field
                          label="End Date"
                          required
                          validationState={leaveStart && leaveEnd && new Date(leaveStart) > new Date(leaveEnd) ? 'error' : 'none'}
                          validationMessage={leaveStart && leaveEnd && new Date(leaveStart) > new Date(leaveEnd) ? 'To date cannot be earlier than From date' : ''}
                          
                        >
                          <Input 
                              type="date" value={leaveEnd} 
                              onChange={(_, d) => setLeaveEnd(d.value)} 
                              min={leaveStart}
                              disabled={selectedBalance?.IsDisabled} 
                              />
                        </Field>
                      </div>
                    )}
                  </div>



                  <Field required label="Reason for leave">
                    <Textarea value={leaveReason} onChange={(_, d) => setLeaveReason(d.value)} placeholder="Provide specific reason..." rows={4} />
                  </Field>
                </div>

                {/* Live impact preview */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className={styles.impactPanelCard}>

                    {/* Header */}
                    <div className={styles.impactPanelHeader}>
                      <CalendarMonthRegular style={{ color: '#6366f1', fontSize: 18 }} />
                      <Text weight="semibold" size={300} style={{ color: '#1e293b' }}>Leave Impact Summary</Text>
                    </div>

                    {/* Stat grid */}
                    <div className={styles.impactStatGrid}>
                      <div className={styles.impactStatCard}>
                        <span className={styles.impactStatLabel}>Days Requested</span>
                        <span className={styles.impactStatNumber} style={{ color: '#6366f1' }}>{calculatedDays}</span>
                        <span className={styles.impactStatSubtitle}>Working Days</span>
                      </div>
                      <div className={styles.impactStatCard}>
                        <span className={styles.impactStatLabel}>Remaining Balance</span>
                        <span className={styles.impactStatNumber} style={{ color: '#16a34a' }}>
                          {selectedBalance ? selectedBalance.AvailableDays - calculatedDays : '–'}
                        </span>
                        <span className={styles.impactStatSubtitle}>Days Left</span>
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, backgroundColor: '#f1f5f9' }} />

                    {/* Approver */}
                    <div>
                      <Text size={200} style={{ color: '#64748b', fontWeight: 500, marginBottom: '8px', display: 'block' }}>
                        Approver
                      </Text>
                      <div className={styles.approverRow}>
                        <div className={styles.approverAvatar}>
                          {(userData?.ManagerDisplayName || 'NA')
                            .split(' ')
                            .map((n: string) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Text weight="semibold" size={300} style={{ color: '#1e293b' }}>
                            {userData?.ManagerDisplayName || 'Not assigned'}
                          </Text>
                          <Text size={100} style={{ color: '#64748b' }}>Reporting Manager</Text>
                        </div>
                      </div>
                    </div>

                    {/* Status banners - only one shown at a time */}

                    {/* Weekends/holidays only */}
                    {calculatedDays === 0 && (leaveStart || leaveEnd) && (
                      <div className={styles.statusBanner} style={{ backgroundColor: '#fff7ed', borderColor: '#fed7aa' }}>
                        <WarningRegular style={{ color: '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                        <Text size={200} style={{ color: '#92400e' }}>
                          Selected range contains only holidays or weekends.
                        </Text>
                      </div>
                    )}

                    {/* Exceeds balance */}
                    {selectedBalance && calculatedDays > selectedBalance.AvailableDays && (
                      <div className={styles.statusBanner} style={{ backgroundColor: '#fef2f2', borderColor: '#fca5a5' }}>
                        <WarningRegular style={{ color: '#DC2626', flexShrink: 0, marginTop: 1 }} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <Text size={200} weight="bold" style={{ color: '#991B1B' }}>Extended Leave Warning</Text>
                          <Text size={200} style={{ color: '#991B1B' }}>
                            Exceeds balance by <b>{calculatedDays - selectedBalance.AvailableDays} day(s)</b>. Excess will be flagged as Extended Leave.
                          </Text>
                        </div>
                      </div>
                    )}

                    {/* Sufficient balance */}
                    {selectedBalance && calculatedDays > 0 && calculatedDays <= selectedBalance.AvailableDays && (
                      <div className={styles.statusBanner} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                        <CheckmarkCircle24Regular style={{ color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                        <Text size={200} style={{ color: '#166534' }}>
                          You have enough leave balance for this request.
                        </Text>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </DialogContent>

            <DialogActions style={{ padding: '16px 28px 24px', borderTop: '1px solid #f1f5f9', justifyContent: 'flex-end', gap: '10px' }}>
              <Button className={styles.secondaryGreyBtn} onClick={() => setCreateLeaveOpen(false)}>Cancel</Button>
              <Button
                className={styles.primaryBtn}
                icon={<SendRegular />}
                disabled={isSubmitting || !leaveType || !leaveStart || !leaveEnd || (new Date(leaveStart) > new Date(leaveEnd) || !leaveReason)}
                onClick={handleSubmitLeave}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* CREATE PERMISSION DIALOG */}
      <Dialog open={createPermissionOpen} onOpenChange={(_, d) => setCreatePermissionOpen(d.open)} modalType="modal">
        <DialogSurface style={{ maxWidth: '640px', width: '90vw', borderRadius: '20px', padding: 0 }}>
          <DialogBody style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <DialogTitle style={{ padding: '24px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text size={600} weight="bold" style={{ display: 'block' }}>New Permission Request</Text>
                <Text size={200} style={{ color: '#64748b' }}>Fill in the details and submit for approval</Text>
              </div>
              <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setCreatePermissionOpen(false)} />
            </DialogTitle>

            <DialogContent style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>


                      

                <div className={styles.gridTwo}>
                  <Field label="Date" required>
                    <Input type="date" min={new Date().toISOString().split("T")[0]} value={permDate} onChange={(_, d) => setPermDate(d.value)} />
                  </Field>
                  <Field label="Total Duration (Hrs)" required>
                    <Input
                      type="number"
                      value={permDuration}
                      disabled
                      onChange={(_, d) => {
                        setPermDuration(d.value);
                        const newEnd = calculateEndTime(permStart, d.value);
                        if (newEnd) setPermEnd(newEnd);
                      }}
                    />
                  </Field>
                </div>

              <div className={styles.gridTwo} style={{background:"#f3f3f3", borderRadius:"10px", padding:'3px'}}>
                      <Field>
                        <Checkbox
                          label="Night Shift"
                          checked={isNightShift}
                          onChange={()=>setIsNightShift((prev)=>!prev)}
                          />
                      </Field>
                </div>

                <div className={styles.gridTwo}>
                  <Field
                    label="Start Time"
                    required
                    validationState={permOrderInvalid ? 'error' : 'none'}
                  >
                    <Input type="time" value={permStart} onChange={(_, d) => { setPermStart(d.value); const maxEnd = calculateEndTime(d.value, maxPermissionHrs?.toString()); const clampedEnd = !isNightShift && maxEnd && permEnd > maxEnd ? maxEnd : permEnd; if (clampedEnd !== permEnd) setPermEnd(clampedEnd); handlePermTimeChange(d.value, clampedEnd); }} />
                  </Field>
                  <Field
                    label="End Time"
                    required
                    validationState={permTimeError ? 'error' : 'none'}
                    validationMessage={
                      permOrderInvalid
                        ? (isNightShift ? 'To time must differ from From time' : 'From time must be before To time')
                        : permExceedsMax
                          ? `Permission duration cannot exceed ${maxPermissionHrs?.toString()} hours`
                          : ''
                    }
                  >
                    <Input type="time" input={isNightShift ? {} : { min: permStart, max: calculateEndTime(permStart, maxPermissionHrs?.toString()) }} value={permEnd} onChange={(_, d) => { setPermEnd(d.value); handlePermTimeChange(permStart, d.value); }} />
                  </Field>
                </div>

                {permOvernight && (
                  <div style={{ color: '#d49434', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    ⚠ Overnight permission — spans midnight{permDate ? ` from ${permDate} to ${nextDayDate(permDate)}` : ' into the next day'}.
                  </div>
                )}

                <Field label="Reason" required>
                  <Textarea value={permReason} onChange={(_, d) => setPermReason(d.value)} placeholder="Provide specific reason..." rows={3} />
                </Field>
              </div>
            </DialogContent>

            <DialogActions style={{ padding: '16px 28px 24px', borderTop: '1px solid #f1f5f9', justifyContent: 'flex-end', gap: '10px' }}>
              <Button className={styles.secondaryGreyBtn} onClick={() => setCreatePermissionOpen(false)}>Cancel</Button>
              <Button
                className={styles.primaryBtn}
                icon={<SendRegular />}
                disabled={isSubmitting || !permReason || !permDate || !permStart || !permEnd || permTimeError}
                onClick={handleSubmitPermission}
              >
                {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* WITHDRAWAL CONFIRMATION DIALOG */}
      <Dialog open={withdrawConfirmOpen} onOpenChange={(_, d) => setWithdrawConfirmOpen(d.open)} modalType="modal">
        <DialogSurface style={{ maxWidth: '400px', borderRadius: '16px' }}>
          <DialogBody>
            <DialogTitle>Confirm Withdrawal</DialogTitle>
            <DialogContent>
              <div style={{ marginTop: '12px' }}>
                <Text>Are you sure you want to withdraw this leave request? This action cannot be undone.</Text>
              </div>
            </DialogContent>
            <DialogActions style={{ marginTop: '24px' }}>
              <Button className={styles.secondaryGreyBtn} onClick={() => setWithdrawConfirmOpen(false)}>Cancel</Button>
              <Button
                className={styles.dangerBtn}
                disabled={isSubmitting}
                onClick={handleWithdraw}
              >
                {isSubmitting ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>


      {/*
          REQUEST STATUS DRAWER (eye icon)
      */}
      <Drawer
        type="overlay"
        separator
        open={drawerOpen}
        onOpenChange={(_, d) => setDrawerOpen(d.open)}
        position="end"
        size="medium"
        style={{ borderLeft: `1px solid ${tokens.colorNeutralStroke2}` }}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => setDrawerOpen(false)} />
            }
          >
            Request Details
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '24px' }}>
          {selectedRequest && (() => {
            const requestStatus = (selectedRequest as any).ApprovalStatus || (selectedRequest as any).ManagerApprovalStatus;
            return (
              <>
                {/* Horizontal Stepper */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
                  <Text weight="semibold">Status Progress</Text>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginTop: '20px', marginBottom: '20px' }}>
                    <div style={{ position: 'absolute', top: '12px', left: '20px', right: '20px', height: '2px', backgroundColor: tokens.colorNeutralStroke2, zIndex: 0 }} />

                    {/* Step 1: Submitted */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, zIndex: 1 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckmarkCircle24Regular style={{ fontSize: '16px' }} />
                      </div>
                      <Text size={100} weight="semibold">Submitted</Text>
                    </div>

                    {/* Step 2: Under Review */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, zIndex: 1 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: requestStatus === 'Pending' ? '#f59e0b' : '#22c55e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {requestStatus === 'Pending' ? <Clock24Regular style={{ fontSize: '16px' }} /> : <CheckmarkCircle24Regular style={{ fontSize: '16px' }} />}
                      </div>
                      <Text size={100} weight="semibold">Under Review</Text>
                    </div>

                    {/* Step 3: Decision */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, zIndex: 1 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: requestStatus === 'Approved' ? '#22c55e' : requestStatus === 'Rejected' ? '#ef4444' : tokens.colorNeutralStroke2, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {requestStatus === 'Approved' ? <CheckmarkCircle24Regular style={{ fontSize: '16px' }} /> : requestStatus === 'Rejected' ? <DismissCircle24Regular style={{ fontSize: '16px' }} /> : null}
                      </div>
                      <Text size={100} weight="semibold">Decision</Text>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className={styles.drawerDetailsGrid}>
                  <div>
                    <Text size={100} weight="semibold" style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Type</Text>
                    <Text weight="semibold">
                      {drawerType === 'leave' ? displayLeaveLabel((selectedRequest as LeaveRequestRecord).LeaveName) :
                        drawerType === 'permission' ? 'Permission' :
                          (selectedRequest as RegularizationRecord).IsCheckIn ? 'Late Check-In' : 'Forgot Attendance'}
                    </Text>
                  </div>
                  <div>
                    <Text size={100} weight="semibold" style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Status</Text>
                    <Badge appearance="filled" color={requestStatus === 'Approved' ? 'success' : requestStatus === 'Rejected' ? 'danger' : 'warning'}>
                      {requestStatus}
                    </Badge>
                  </div>
                  {drawerType === 'leave' ? (
                    <>
                      <div>
                        <Text size={100} weight="semibold" style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>From</Text>
                        <Text>{new Date((selectedRequest as LeaveRequestRecord).Start_Date).toLocaleDateString()}</Text>
                      </div>
                      <div>
                        <Text size={100} weight="semibold" style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>To</Text>
                        <Text>{new Date((selectedRequest as LeaveRequestRecord).End_Date).toLocaleDateString()}</Text>
                      </div>
                      {(selectedRequest as LeaveRequestRecord).Halfday && (
                        <div>
                          <Text size={100} weight="semibold" style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Session</Text>
                          <Text>{(selectedRequest as LeaveRequestRecord).HalfSession === '1' ? 'First Half' : 'Second Half'}</Text>
                        </div>
                      )}
                    </>
                  ) : drawerType === 'permission' ? (
                    <>
                      <div>
                        <Text size={100} weight="semibold" style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Date</Text>
                        <Text>{new Date((selectedRequest as PermissionRequest).Date).toLocaleDateString()}</Text>
                      </div>
                      <div>
                        <Text size={100} weight="semibold" style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Time</Text>
                        <Text>{formatTime((selectedRequest as PermissionRequest).StartTime)} &ndash; {formatTime((selectedRequest as PermissionRequest).EndTime)}</Text>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Text size={100} weight="semibold" style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Date</Text>
                        <Text>{new Date((selectedRequest as RegularizationRecord).RegularizeDate).toLocaleDateString()}</Text>
                      </div>
                      <div>
                        <Text size={100} weight="semibold" style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Claimed Time</Text>
                        <Text>{(() => {
                          const reg = selectedRequest as RegularizationRecord;
                          if (reg.IsCheckIn) {
                            return reg.ActualStartTime ? formatTime(toIST(reg.ActualStartTime).toISOString()) : 'N/A';
                          } else {
                            const start = reg.ActualStartTime ? formatTime(toIST(reg.ActualStartTime).toISOString()) : 'N/A';
                            const end = reg.ActualEndTime ? formatTime(toIST(reg.ActualEndTime).toISOString()) : 'N/A';
                            return `${start} - ${end}`;
                          }
                        })()}</Text>
                      </div>
                    </>
                  )}
                  <div style={{ gridColumn: 'span 2' }}>
                    <Text size={100} weight="semibold" style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Reason</Text>
                    <Text style={{ whiteSpace: 'pre-wrap' }}>{(selectedRequest as any).Reason || 'No reason provided.'}</Text>
                  </div>
                </div>
              </>
            );
          })()}
        </DrawerBody>

        <DrawerFooter style={{ borderTop: `1px solid ${tokens.colorNeutralStroke2}`, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {drawerType === 'leave' && (selectedRequest as LeaveRequestRecord)?.ApprovalStatus === 'Pending' && (
              <Button
                className={styles.dangerBtn}
                icon={<DeleteRegular />}
                disabled={isSubmitting}
                onClick={() => setWithdrawConfirmOpen(true)}
              >
                {isSubmitting ? 'Withdrawing...' : 'Withdraw Request'}
              </Button>
            )}
            <Button className={styles.secondaryGreyBtn} onClick={() => setDrawerOpen(false)} style={{ marginLeft: 'auto' }}>Close</Button>
          </div>
        </DrawerFooter>
      </Drawer>
    </div>
  );
};

export default MyRequests;
