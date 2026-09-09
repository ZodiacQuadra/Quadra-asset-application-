/**
 * Attendance Approvals – Unified Pending Approvals
 */
import React, { useState, useEffect, useCallback } from "react";
import { displayLeaveLabel } from "../Utils/leaveUtils";
import {
  Text, Button, Spinner, makeStyles, shorthands, tokens,
  Toast, ToastTitle, ToastBody, Toaster, useToastController, useId,
  Avatar, Menu, MenuTrigger, MenuPopover, MenuList, MenuItem,
  OverlayDrawer, DrawerBody, DrawerHeader, DrawerHeaderTitle,
  Dialog, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent,
  Textarea, Field, Checkbox, ProgressBar,
  MessageBar,
  MessageBarBody,
  DrawerFooter,
} from "@fluentui/react-components";
import {
  CheckmarkCircle24Regular, DismissCircle24Regular,
  CheckmarkCircle24Filled, DismissCircle24Filled,
  ArrowSort24Regular, PersonFilled, Dismiss24Regular,
  CalendarMonth24Regular, ClockAlarm24Regular,
  Location24Regular, RotateLeft24Regular,
  ChevronLeftRegular, ChevronRightRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import {
  getPendingApprovals, updateApprovalStatus,
  getPendingPermissionRequests, updatePermissionApprovalStatus,
  getOptionalPendingApprovals, getOptionalPendingPermissionRequests,
  getPermissionRequestsByStatus, getOptionalPermissionRequestsByStatus,
  PendingApproval, PermissionRequest,
} from "../Services/AttendanceService";
import {
  getPendingLeaveApprovals, updateLeaveApprovalStatus, LeaveRequestRecord,
  getOptionalPendingLeaveApprovals, getLeaveApprovalsByStatus, getOptionalLeaveApprovalsByStatus,
  getLeaveBalances, LeaveBalance,
  getLeaveImpact,
} from "../../Services/LeaveRequestService";
import {
  getPendingRegularizationRequests, updateRegularizationStatus, RegularizationRecord,
  getOptionalPendingRegularizationRequests,
  getRegularizationByStatus, getOptionalRegularizationByStatus,
} from "../Services/RegularizationService";
import {
  getManagerCompOffRequests, getOptionalManagerCompOffRequests,
  updateCompOffRequestStatus, CompOffRequest,
} from "../Services/CompOffService";
import { useNavigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

type RequestType = "Leave" | "Permission" | "Regularize" | "Escalation" | "Comp-off";
type SortOrder = "oldest" | "location-first";
type FilterType = "All" | RequestType;
type StatusFilter = "Pending" | "Approved" | "Rejected" | "All";

interface UnifiedRequest {
  id: string;
  type: RequestType;
  employeeId: string;
  employeeName: string;
  jobTitle?: string;
  tagLabel: string;
  dateLabel: string;
  reason: string;
  submittedAt: Date;
  refId: string;
  startDate?: string
  managerId: string | null;
  approvalStatus?: string;
  nightShiftCrossesMidnight?: boolean;
  raw: PendingApproval | PermissionRequest | LeaveRequestRecord | RegularizationRecord | CompOffRequest;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<RequestType, { border: string; bg: string; text: string; icon: React.ReactNode }> = {
  Leave:      { border: "#7c3aed", bg: "#f5f3ff", text: "#5b21b6", icon: <CalendarMonth24Regular /> },
  Permission: { border: "#2563eb", bg: "#eff6ff", text: "#1d4ed8", icon: <ClockAlarm24Regular /> },
  Regularize: { border: "#d97706", bg: "#fffbeb", text: "#92400e", icon: <RotateLeft24Regular /> },
  Escalation:   { border: "#dc2626", bg: "#fef2f2", text: "#991b1b", icon: <Location24Regular /> },
  "Comp-off": { border: "#1b7621", bg: "#f7fef2", text: "#1b9932", icon: <Location24Regular /> }
};

// ─── Bulk concurrency helper ──────────────────────────────────────────────────

// Max requests kept in-flight during a bulk action. Bounding this (vs. firing all
// N at once) keeps large batches predictable, avoids exhausting the browser's
// per-host connection budget, and caps how many requests can hit the 401 refresh
// interceptor simultaneously.
const BULK_CONCURRENCY = 6;

// Runs `worker` over `items` with at most `limit` concurrent calls. Mirrors
// Promise.allSettled semantics (never rejects; one result slot per item) and
// reports cumulative completion via `onProgress`.
async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<any>,
  onProgress?: (done: number) => void
): Promise<PromiseSettledResult<any>[]> {
  const results: PromiseSettledResult<any>[] = new Array(items.length);
  let index = 0;
  let done = 0;
  const runNext = async (): Promise<void> => {
    const i = index++;
    if (i >= items.length) return;
    try {
      results[i] = { status: "fulfilled", value: await worker(items[i]) };
    } catch (reason) {
      results[i] = { status: "rejected", reason };
    }
    onProgress?.(++done);
    return runNext();
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runNext));
  return results;
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

function formatDateShort(d: string | Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Permission & Regularize backends store IST but tag it with Z/+00:00 (incorrect UTC marker).
// Strip any timezone suffix and force-parse as IST (+05:30).
function parseAsIST(s: string): Date {
  const bare = s?.replace(/Z$|[+-]\d{2}:\d{2}$/, "");
  return new Date(bare + "+05:30");
}

// Leave backend returns actual UTC timestamps (with Z) — parse as-is.
function parseUTC(s: string): Date {
  return new Date(s);
}

function formatTimeShort(timeStr: any) {
  if (!timeStr) return "—";

  try {
    // If it's a string like "1970-01-01T15:08:00.000Z", extract just the HH:mm
    const t = typeof timeStr === 'string' && timeStr.includes("T")
      ? timeStr.split("T")[1]
      : String(timeStr);

    const parts = t.split(":");
    if (parts.length >= 2) {
      const d = new Date();
      d.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
  } catch (e) {
    console.warn("Failed to parse time:", timeStr);
  }

  return new Date(timeStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// Extract minutes-since-midnight from a stored time value ("1970-01-01T23:00:00Z" or "23:00").
function getTimeMinutes(timeStr: any): number | null {
  if (!timeStr) return null;
  const t = typeof timeStr === "string" && timeStr.includes("T")
    ? timeStr.split("T")[1]
    : String(timeStr);
  const parts = t.split(":");
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
  }
  return null;
}

// Duration between a start and end time. When the shift crosses midnight
// (start >= end), the end lands on the next day, so add a full 24h.
function formatPermissionDuration(startTime: any, endTime: any, crossesMidnight: boolean): string | null {
  const startMin = getTimeMinutes(startTime);
  const endMin = getTimeMinutes(endTime);
  if (startMin === null || endMin === null) return null;

  let diff = endMin - startMin;
  if (crossesMidnight) diff += 24 * 60;
  if (diff <= 0) return null;

  const hours = Math.floor(diff / 60);
  const mins = diff % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr${hours !== 1 ? "s" : ""}`;
  return `${hours} hr${hours !== 1 ? "s" : ""} ${mins} min`;
}

function normalizeLocation(r: PendingApproval): UnifiedRequest {
  const label = r.ViolationType === "Late" ? "Late Arrival" : r.ViolationType === "Both" ? "Late & Off-site" : "Outside Geofence";
  const checkInDate = new Date(r.CheckIn.replace(/Z$|[+-]\d{2}:\d{2}$/, ""));
  const checkInTime = checkInDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return {
    id: r.ID, type: "Escalation", employeeId: r.UserID, employeeName: r.EmployeeName,
    jobTitle: r.EmployeeJobTitle || undefined,
    tagLabel: `Location · ${label}`,
    dateLabel: `${formatDateShort(checkInDate)} · Check-in at ${checkInTime}`,
    reason: r.EscalationReason ? r.EscalationReason : r.Employee_CurrentLocation ? `Detected at: ${r.Employee_CurrentLocation}` : "Location mismatch detected",
    submittedAt: checkInDate,
    refId: `LE-${r.ID.slice(0, 8).toUpperCase()}`,
    managerId: r.ManagerID,
    raw: r,
  };
}

function normalizePermission(r: PermissionRequest): UnifiedRequest {
  // A night shift rolls over past midnight when the end time is at or before the
  // start time (StartTime >= EndTime), so the end lands on the next day.
  const startMin = getTimeMinutes(r.StartTime);
  const endMin = getTimeMinutes(r.EndTime);
  const crossesMidnight =
    !!r.IsNightShift && startMin !== null && endMin !== null && startMin >= endMin;

  const endDate = crossesMidnight
    ? new Date(new Date(r.Date).getTime() + 24 * 60 * 60 * 1000)
    : null;

  const dateLabel = crossesMidnight
    ? `${formatDateShort(r.Date)} ${formatTimeShort(r.StartTime)} – ${formatDateShort(endDate!)} ${formatTimeShort(r.EndTime)}`
    : `${formatDateShort(r.Date)} | ${formatTimeShort(r.StartTime)} – ${formatTimeShort(r.EndTime)}`;

  return {
    id: r.ID, type: "Permission", employeeId: r.EmpID, employeeName: r.EmpName,
    tagLabel: `Permission`,
    dateLabel,
    reason: r.Reason,
    submittedAt: parseAsIST(r.CreatedOn),
    refId: `PR-${r.ID.slice(0, 8).toUpperCase()}`,
    managerId: r.ManagerID,
    approvalStatus: r.ApprovalStatus,
    nightShiftCrossesMidnight: crossesMidnight,
    raw: r,
  };
}

function normalizeLeave(r: LeaveRequestRecord): UnifiedRequest {
  // console.log("normalized",r)
  const days = r.TotalDays ?? 1;
  const halfDaySuffix = r.Halfday
    ? ` · Half Day (${r.HalfSession === "1" ? "1st Half" : r.HalfSession === "2" ? "2nd Half" : r.HalfSession ?? ""})`
    : "";
  return {
    id: r.ID, type: "Leave", employeeId: r.RequestorID, employeeName: r.RequestorName,
    tagLabel: `Leave · ${displayLeaveLabel(r.LeaveName)}`,
    dateLabel: `${formatDateShort(r.Start_Date)} – ${formatDateShort(r.End_Date)} (${days} day${days !== 1 ? "s" : ""})${halfDaySuffix}`,
    reason: r.Reason || "No reason provided",
    submittedAt: parseUTC(r.CreatedOn),
    refId: `LR-${r.ID.slice(0, 8).toUpperCase()}`,
    managerId: r.ManagerID,
    startDate: r.Start_Date,
    approvalStatus: r.ApprovalStatus,
    raw: r,
  };
}

function normalizeRegularization(r: RegularizationRecord): UnifiedRequest {
  const subType = r.IsLeave ? "Missed Attendance" : "Late Checkin";
  return {
    id: r.ID, type: "Regularize", employeeId: r.UserID, employeeName: r.UserName || "Employee",
    tagLabel: `Regularize · ${subType}`,
    dateLabel: formatDateShort(r.RegularizeDate),
    reason: r.Reason || "No reason provided",
    submittedAt: parseAsIST(r.CreatedOn),
    refId: `RG-${r.ID.slice(0, 8).toUpperCase()}`,
    managerId: r.ManagerID,
    approvalStatus: r.ManagerApprovalStatus,
    raw: r,
  };
}

function normalizeCompOff(r: CompOffRequest): UnifiedRequest {
  return {
    id: r.CompOffRequestId,
    type: "Comp-off",
    employeeId: r.CreatedBy,
    employeeName: r.EmployeeName,
    jobTitle: r.EmployeeJobTitle || undefined,
    tagLabel: "Comp-off",
    dateLabel: r.WorkedDate ? `Work date: ${formatDateShort(r.WorkedDate)}` : "Weekend / Holiday Work",
    reason: r.Reason || "No reason provided",
    submittedAt: parseAsIST(r.CreatedAt),
    refId: `CO-${r.CompOffRequestId.slice(0, 8).toUpperCase()}`,
    managerId: r.ManagerID,
    approvalStatus: r.ManagerApprovalStatus,
    raw: r,
  };
}

// function normalizeCompOff(r: CompOffRequest): UnifiedRequest {
//   return {
//     id: r.CompOffRequestId,
//     type: "Comp-off",
//     employeeId: r.CreatedBy,
//     employeeName: r.EmployeeName,
//     jobTitle: r.EmployeeJobTitle || undefined,
//     tagLabel: "Comp-off",
//     dateLabel: r.WorkedDate ? `Work date: ${formatDateShort(r.WorkedDate)}` : "Weekend / Holiday Work",
//     reason: r.Reason || "No reason provided",
//     submittedAt: parseAsIST(r.CreatedAt),
//     refId: `CO-${r.CompOffRequestId.slice(0, 8).toUpperCase()}`,
//     managerId: r.ManagerID,
//     raw: r,
//   };
// }

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  container: {
    padding: "24px",
    minHeight: "100vh",
    backgroundColor: "transparent",
    "@media (max-width: 768px)": {
      padding: "12px",
    },
  },
  header: { marginBottom: "20px" },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    flexWrap: "wrap",
    "@media (max-width: 768px)": {
      flexDirection: "column",
      alignItems: "stretch",
      gap: "8px",
    },
  },
  tabToggleContainer: {
    display: "flex",
    gap: "0px",
    marginTop: "16px",
    marginBottom: "4px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
    width: "fit-content",
    "@media (max-width: 768px)": {
      marginTop: "8px",
      width: "100%",
      justifyContent: "center",
    },
  },
  tabToggleButton: {
    padding: "6px 22px",
    fontWeight: 500,
    fontSize: "13px",
    background: "#ffffff72",
    color: "#4d4d4d",
    border: "none",
    cursor: "pointer",
    transition: "all 0.15s",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    "@media (max-width: 768px)": {
      flex: 1,
      justifyContent: "center",
      padding: "8px 12px",
    },
  },
  tabToggleButtonActive: {
    background: "#ffffff",
    color: "#3d3c3c",
    fontWeight: 700,
  },
  filterRow: {
    display: "flex", alignItems: "center", gap: "8px",
    marginTop: "20px", marginBottom: "8px", flexWrap: "wrap",
  },
  pill: {
    cursor: "pointer", ...shorthands.border("1.5px", "solid", tokens.colorNeutralStroke2),
    ...shorthands.borderRadius("20px"), ...shorthands.padding("4px", "14px"),
    background: tokens.colorNeutralBackground1,
    fontSize: "13px", fontWeight: 500, color: tokens.colorNeutralForeground2,
    display: "flex", alignItems: "center", gap: "6px", userSelect: "none",
    transition: "all 0.15s",
  },
  pillActive: {
    background: "#0f172a", color: "#fff",
    ...shorthands.border("1.5px", "solid", "#0f172a"),
    fontWeight: 700,
  },
  pillCount: {
    background: "rgba(255,255,255,0.25)", color: "inherit",
    ...shorthands.borderRadius("10px"), ...shorthands.padding("0px", "7px"),
    fontSize: "12px", fontWeight: 700,
  },
  pillCountInactive: {
    background: tokens.colorNeutralBackground3, color: tokens.colorNeutralForeground3,
    ...shorthands.borderRadius("10px"), ...shorthands.padding("0px", "7px"),
    fontSize: "12px", fontWeight: 600,
  },
  sortMeta: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: "16px", marginTop: "4px",
    "@media (max-width: 480px)": {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "4px",
    },
  },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  row: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    ...shorthands.padding("16px", "20px"),
    ...shorthands.borderRadius("10px"),
    background: "rgba(255,255,255,0.75)",
    backdropFilter: "blur(12px)",
    ...shorthands.border("1px", "solid", "rgba(0,0,0,0.07)"),
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    borderLeft: "3.5px solid transparent",
    transition: "box-shadow 0.2s, opacity 0.3s",
    ":hover": { boxShadow: "0 3px 12px rgba(0,0,0,0.1)" },
    "@media (max-width: 640px)": {
      flexDirection: "column",
      gap: "12px",
      ...shorthands.padding("12px", "14px"),
    },
  },
  rowResolved: { opacity: 0.45, pointerEvents: "none", filter: "grayscale(30%)" },
  cardMainContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    flex: 1,
    width: "100%",
  },
  rowBody: { flex: 1, minWidth: 0 },
  nameLine: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "3px" },
  typeChip: {
    display: "inline-flex", alignItems: "center", gap: "4px",
    ...shorthands.padding("2px", "9px"), ...shorthands.borderRadius("12px"),
    fontSize: "12px", fontWeight: 600,
  },
  dateText: { fontSize: "14px", fontWeight: 600, color: tokens.colorNeutralForeground1, marginBottom: "3px" },
  reasonText: {
    fontSize: "13px", color: tokens.colorNeutralForeground3,
    fontStyle: "italic", marginBottom: "5px",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "560px",
    "@media (max-width: 640px)": {
      whiteSpace: "normal",
      maxWidth: "100%",
    },
  },
  metaText: { fontSize: "12px", color: tokens.colorNeutralForeground4 },
  actions: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    flexShrink: 0,
    paddingTop: "6px",
    "@media (max-width: 640px)": {
      width: "100%",
      paddingTop: "0px",
    },
  },
  actionsInner: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "8px",
    width: "100%",
    "@media (max-width: 640px)": {
      alignItems: "stretch",
    },
  },
  buttonGroup: {
    display: "flex",
    gap: "8px",
    "@media (max-width: 640px)": {
      width: "100%",
      justifyContent: "space-between",
    },
    "@media (max-width: 480px)": {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "8px",
    },
  },
  actionBtn: {
    height: "34px",
    borderRadius: "7px",
    fontWeight: 600,
    "@media (max-width: 640px)": {
      flex: 1,
    },
    "@media (max-width: 480px)": {
      gridColumn: "span 2",
      paddingLeft: "8px",
      paddingRight: "8px",
      fontSize: "12px",
    },
  },
  refId: {
    fontSize: "11px",
    color: tokens.colorNeutralForeground4,
    textAlign: "right",
    marginBottom: "8px",
    fontFamily: "monospace",
    "@media (max-width: 640px)": {
      textAlign: "left",
      marginBottom: "4px",
    },
  },
  approveBtn: {
    background: "#107c10", color: "#fff", fontWeight: 600, height: "34px",
    ...shorthands.borderRadius("7px"), ...shorthands.padding("0", "14px"),
    ":hover": { background: "#0b5a08" },
    "@media (max-width: 640px)": {
      flex: 1,
    },
    "@media (max-width: 480px)": {
      paddingLeft: "8px",
      paddingRight: "8px",
      fontSize: "12px",
    },
  },
  rejectBtn: {
    color: "#c00", fontWeight: 600, height: "34px",
    ...shorthands.borderRadius("7px"), ...shorthands.padding("0", "14px"),
    ...shorthands.border("1.5px", "solid", "#fca5a5"),
    ":hover": { background: "#fef2f2" },
    "@media (max-width: 640px)": {
      flex: 1,
    },
    "@media (max-width: 480px)": {
      paddingLeft: "8px",
      paddingRight: "8px",
      fontSize: "12px",
    },
  },
  emptyState: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "80px 24px", gap: "16px", textAlign: "center",
    "@media (max-width: 480px)": {
      padding: "40px 16px",
    },
  },
  emptyIcon: {
    width: "64px", height: "64px", ...shorthands.borderRadius("16px"),
    background: "#e6f4ea", display: "flex", alignItems: "center", justifyContent: "center",
  },
  paginationRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    padding: "10px 16px",
    backgroundColor: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #e2e8f0",
    "@media (max-width: 520px)": {
      flexDirection: "column",
      gap: "12px",
      alignItems: "center",
    },
  },
  dialogSurface: {
    maxWidth: "440px",
    width: "100%",
    borderRadius: "12px",
    "@media (max-width: 480px)": {
      maxWidth: "92vw",
      ...shorthands.padding("16px"),
    },
  },
  drawer: {
    "@media (max-width: 600px)": {
      width: "100% !important",
      maxWidth: "100% !important",
    },
  },
  drawerBody: {
    padding: "20px 24px",
    overflowY: "auto",
    "@media (max-width: 480px)": {
      padding: "16px 16px",
    },
  },
  leaveBalanceGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    "@media (max-width: 480px)": {
      gridTemplateColumns: "1fr",
    },
  },
  regTimeGrid: {
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    "@media (max-width: 480px)": {
      flexDirection: "column",
      gap: "10px",
    },
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

const AttendanceApprovals: React.FC = () => {
  const styles = useStyles();
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate()

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 480);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  const [queueTab, setQueueTab] = useState<"Direct Reports" | "Indirect Reports">("Direct Reports");
  const [allRequests, setAllRequests] = useState<UnifiedRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Pending");
  const [sortOrder, setSortOrder] = useState<SortOrder>("oldest");
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [indirectCount, setIndirectCount] = useState<number | null>(null);
  const [directCount, setDirectCount] = useState<number | null>(null);

  const [allPage, setAllPage] = useState(1);
  const [allPageSize, setAllPageSize] = useState<number>(5);
  const [leavePage, setLeavePage] = useState(1);
  const [leavePageSize, setLeavePageSize] = useState<number>(5);
  const [permPage, setPermPage] = useState(1);
  const [permPageSize, setPermPageSize] = useState<number>(5);
  const [regPage, setRegPage] = useState(1);
  const [regPageSize, setRegPageSize] = useState<number>(5);
  const [compOffPage, setCompOffPage] = useState(1);
  const [compOffPageSize, setCompOffPageSize] = useState<number>(5);

  // ── Regularize bulk-selection state (scoped to Regularize filter only) ───────
  const [selectedRegIds, setSelectedRegIds] = useState<Set<string>>(new Set());
  const [bulkDialog, setBulkDialog] = useState<{ action: "Approve" | "Reject"; comment: string } | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

  // ── Comment dialog state (Leave & Permission only) ───────────────────────
  const [confirmDialog, setConfirmDialog] = useState<{
    req: UnifiedRequest;
    action: "Approve" | "Reject";
    comment: string;
  } | null>(null);

  const openConfirmDialog = (req: UnifiedRequest, action: "Approve" | "Reject") => {
    if (req.type === "Leave" || req.type === "Permission" || req.type === "Escalation" || req.type === "Regularize" || req.type === "Comp-off") {
      setConfirmDialog({ req, action, comment: "" });
    } else {
      action === "Approve" ? handleApprove(req) : handleReject(req);
    }
  };

  const submitConfirmDialog = () => {
    if (!confirmDialog) return;
    const { req, action } = confirmDialog;
    setConfirmDialog(null);
    setDrawerReq(null);
    action === "Approve" ? handleApprove(req) : handleReject(req);
  };

  // ── Regularize bulk-selection helpers ───────────────────────────────────────
  const toggleRegSelection = (id: string) => {
    setSelectedRegIds(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  // Clear any selection whenever the viewing context changes, so a bulk action
  // can never act on requests the manager is no longer looking at.
  useEffect(() => {
    setSelectedRegIds(new Set());
  }, [activeFilter, statusFilter, queueTab]);

  // Warn before the tab is closed/reloaded while a bulk batch is still running,
  // so in-flight approvals aren't silently abandoned mid-way.
  useEffect(() => {
    if (!bulkProcessing) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [bulkProcessing]);

  // ── Drawer state ────────────────────────────────────────────────────────────
  const [drawerReq, setDrawerReq] = useState<UnifiedRequest | null>(null);
  const [drawerLeaveBalances, setDrawerLeaveBalances] = useState<LeaveBalance[]>([]);
  const [drawerLeaveImapct,setDrawerLeaveImpact] = useState<any>(null)
  const [drawerLoading, setDrawerLoading] = useState(false);



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
      
      
      
        useEffect(()=>{
          const isPermitted = checkPermission("attendance.manager_approvals")
      
          if(isPermitted === false){
              navigate("/Attendance")
          }
        },[])

  useEffect(() => {
    if (!drawerReq) return;
    if (drawerReq.type !== "Leave") {
      setDrawerLeaveBalances([]);
      return;
    }

    setDrawerLoading(true);
    getLeaveBalances(drawerReq.employeeId)
      .then(r => setDrawerLeaveBalances((r as any)?.data || []))
      .catch(() => {})
      .finally(() => setDrawerLoading(false));
    
      if(drawerReq.managerId && drawerReq.startDate){
        setDrawerLoading(true)
        getLeaveImpact(drawerReq.managerId,new Date(drawerReq.startDate).toLocaleDateString())
          .then(r => setDrawerLeaveImpact((r as any)?.data || []))
          .catch(() => {})
          .finally(() => setDrawerLoading(false));
      }
  }, [drawerReq]);

  const toasterId = useId("approvals-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const getGreeting = () => {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  };

  // ── Fetch All ──────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!currentUser?.userID) return;
    setIsLoading(true);
    try {
      const isIndirectReports = queueTab === "Indirect Reports";
      const isPending = statusFilter === "Pending";

      const [permRes, leaveRes, regRes, compOffRes] = await Promise.allSettled([
        isPending
          ? (isIndirectReports ? getOptionalPendingPermissionRequests(currentUser.userID) : getPendingPermissionRequests(currentUser.userID))
          : (isIndirectReports ? getOptionalPermissionRequestsByStatus(currentUser.userID, statusFilter) : getPermissionRequestsByStatus(currentUser.userID, statusFilter)),
        isPending
          ? (isIndirectReports ? getOptionalPendingLeaveApprovals(currentUser.userID) : getPendingLeaveApprovals(currentUser.userID))
          : (isIndirectReports ? getOptionalLeaveApprovalsByStatus(currentUser.userID, statusFilter) : getLeaveApprovalsByStatus(currentUser.userID, statusFilter)),
        isPending
          ? (isIndirectReports ? getOptionalPendingRegularizationRequests(currentUser.userID) : getPendingRegularizationRequests(currentUser.userID))
          : (isIndirectReports ? getOptionalRegularizationByStatus(currentUser.userID, statusFilter) : getRegularizationByStatus(currentUser.userID, statusFilter)),
        isIndirectReports ? getOptionalManagerCompOffRequests(currentUser.userID) : getManagerCompOffRequests(currentUser.userID),
      ]);

      const unified: UnifiedRequest[] = [];
      if (permRes.status === "fulfilled") unified.push(...(permRes.value || []).map(normalizePermission));
      if (leaveRes.status === "fulfilled") unified.push(...(leaveRes.value || []).map(normalizeLeave));
      if (regRes.status === "fulfilled") unified.push(...((regRes.value as any)?.data || []).map(normalizeRegularization));
      if (compOffRes.status === "fulfilled") unified.push(...(compOffRes.value || []).map(normalizeCompOff));

      setAllRequests(unified);
      if (isIndirectReports) setIndirectCount(unified.length);
      else setDirectCount(unified.length);
    } catch (err: any) {
      dispatchToast(<Toast><ToastTitle>Failed to load approvals</ToastTitle><ToastBody>{err?.message}</ToastBody></Toast>, { intent: "error", timeout: 4000 });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.userID, queueTab, statusFilter, dispatchToast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Reset pagination when status filter changes
  useEffect(() => {
    setAllPage(1);
    setLeavePage(1);
    setPermPage(1);
    setRegPage(1);
  }, [statusFilter]);

  // ── Background fetch of indirect count on mount ────────────────────────────
  useEffect(() => {
    if (!currentUser?.userID) return;
    Promise.allSettled([
      // getOptionalPendingApprovals(currentUser.userID),
      getOptionalPendingPermissionRequests(currentUser.userID),
      getOptionalPendingLeaveApprovals(currentUser.userID),
      getOptionalPendingRegularizationRequests(currentUser.userID),
      getOptionalManagerCompOffRequests(currentUser.userID),
    ]).then(([
      // locRes,
      permRes, leaveRes, regRes, compOffRes]) => {
      let count = 0;
      // if (locRes.status === "fulfilled") count += (locRes.value || []).length;
      if (permRes.status === "fulfilled") count += (permRes.value || []).length;
      if (leaveRes.status === "fulfilled") count += (leaveRes.value || []).length;
      if (regRes.status === "fulfilled") count += ((regRes.value as any)?.data || []).length;
      if (compOffRes.status === "fulfilled") count += (compOffRes.value || []).length;
      setIndirectCount(count);
    });
  }, [currentUser?.userID]);

  // ── Sorting & Filtering ────────────────────────────────────────────────────
  const sorted = [...allRequests].sort((a, b) => {
    if (sortOrder === "location-first") {
      if (a.type === "Escalation" && b.type !== "Escalation") return -1;
      if (b.type === "Escalation" && a.type !== "Escalation") return 1;
    }
    return a.submittedAt.getTime() - b.submittedAt.getTime();
  });

  const visible = activeFilter === "All" ? sorted : sorted.filter(r => r.type === activeFilter);

  const getPaginationState = () => {
    switch (activeFilter) {
      case "Leave":
        return { page: leavePage, pageSize: leavePageSize, setPage: setLeavePage, setPageSize: setLeavePageSize };
      case "Permission":
        return { page: permPage, pageSize: permPageSize, setPage: setPermPage, setPageSize: setPermPageSize };
      case "Regularize":
        return { page: regPage, pageSize: regPageSize, setPage: setRegPage, setPageSize: setRegPageSize };
      case "Comp-off":
        return { page: compOffPage, pageSize: compOffPageSize, setPage: setCompOffPage, setPageSize: setCompOffPageSize };
      case "All":
      default:
        return { page: allPage, pageSize: allPageSize, setPage: setAllPage, setPageSize: setAllPageSize };
    }
  };

  const { page, pageSize, setPage, setPageSize } = getPaginationState();

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(visible.length / pageSize));
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [visible.length, pageSize, page, setPage]);

  const paginatedVisible = visible.slice((page - 1) * pageSize, page * pageSize);

  // ── Regularize bulk-selection derived state ──────────────────────────────────
  const regSelectionEnabled = activeFilter === "Regularize";
  const selectableRegRows = regSelectionEnabled
    ? visible.filter(r => r.type === "Regularize" && (!r.approvalStatus || r.approvalStatus === "Pending"))
    : [];
  const selectedRegCount = selectableRegRows.filter(r => selectedRegIds.has(r.id)).length;
  const allRegSelected = selectableRegRows.length > 0 && selectedRegCount === selectableRegRows.length;
  const someRegSelected = selectedRegCount > 0 && !allRegSelected;
  const toggleSelectAllReg = () => {
    setSelectedRegIds(allRegSelected ? new Set() : new Set(selectableRegRows.map(r => r.id)));
  };

  const counts: Record<FilterType, number> = {
    All: allRequests.length - allRequests.filter(r => r.type === "Escalation").length,
    Leave: allRequests.filter(r => r.type === "Leave").length,
    Permission: allRequests.filter(r => r.type === "Permission").length,
    Regularize: allRequests.filter(r => r.type === "Regularize").length,
    "Comp-off": allRequests.filter(r=>r.type === "Comp-off").length,
    // Escalation: allRequests.filter(r => r.type === "Escalation").length,
    Escalation: 0
  };

  const todayCount = allRequests.filter(r => {
    const d = r.submittedAt;
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleApprove = async (req: UnifiedRequest) => {
    if (!currentUser?.userID) return;
    setActionLoading(p => ({ ...p, [req.id]: true }));
    try {
      if (req.type === "Escalation") {
        await updateApprovalStatus(req.id, currentUser.userID, "Approved", currentUser.userID, confirmDialog?.comment ?? null);
      } else if (req.type === "Permission") {
        await updatePermissionApprovalStatus(req.id, currentUser.userID, "Approved", currentUser.userID, confirmDialog?.comment ?? null);
      } else if (req.type === "Leave") {
        await updateLeaveApprovalStatus(req.id, currentUser.userID, "Approved", currentUser.userID, confirmDialog?.comment ?? null);
      } else if (req.type === "Comp-off") {
        await updateCompOffRequestStatus(req.id, currentUser.userID, "Approve", confirmDialog?.comment ?? null);
      } else {
        await updateRegularizationStatus(req.id, "Approved", currentUser.userID, confirmDialog?.comment ?? null);
      }
      setResolvedIds(p => new Set([...p, req.id]));
      dispatchToast(<Toast><ToastTitle>Approved ✓</ToastTitle><ToastBody>{req.employeeName}'s request has been approved.</ToastBody></Toast>, { intent: "success", timeout: 3500 });
      setTimeout(() => {
        setAllRequests(p => p.filter(r => r.id !== req.id));
        setResolvedIds(p => { const s = new Set(p); s.delete(req.id); return s; });
        if (queueTab === "Indirect Reports") setIndirectCount(p => (p !== null && p > 0) ? p - 1 : 0);
        else setDirectCount(p => (p !== null && p > 0) ? p - 1 : 0);
      }, 1200);
    } catch (err: any) {
      dispatchToast(<Toast><ToastTitle>Action Failed</ToastTitle><ToastBody>{err?.message || "Please try again."}</ToastBody></Toast>, { intent: "error", timeout: 5000 });
    } finally {
      setActionLoading(p => ({ ...p, [req.id]: false }));
    }
  };

  const handleReject = async (req: UnifiedRequest) => {
    if (!currentUser?.userID) return;
    setActionLoading(p => ({ ...p, [req.id]: true }));
    try {
      if (req.type === "Escalation") {
        await updateApprovalStatus(req.id, currentUser.userID, "Rejected", currentUser.userID, confirmDialog?.comment ?? null);
      } else if (req.type === "Permission") {
        await updatePermissionApprovalStatus(req.id, currentUser.userID, "Rejected", currentUser.userID, confirmDialog?.comment ?? null);
      } else if (req.type === "Leave") {
        await updateLeaveApprovalStatus(req.id, currentUser.userID, "Rejected", currentUser.userID, confirmDialog?.comment ?? null);
      } else if (req.type === "Comp-off") {
        await updateCompOffRequestStatus(req.id, currentUser.userID, "Reject", confirmDialog?.comment ?? null);
      } else {
        await updateRegularizationStatus(req.id, "Rejected", currentUser.userID, confirmDialog?.comment ?? null);
      }
      setResolvedIds(p => new Set([...p, req.id]));
      dispatchToast(<Toast><ToastTitle>Rejected</ToastTitle><ToastBody>{req.employeeName}'s request has been rejected.</ToastBody></Toast>, { intent: "warning", timeout: 3500 });
      setTimeout(() => {
        setAllRequests(p => p.filter(r => r.id !== req.id));
        setResolvedIds(p => { const s = new Set(p); s.delete(req.id); return s; });
        if (queueTab === "Indirect Reports") setIndirectCount(p => (p !== null && p > 0) ? p - 1 : 0);
        else setDirectCount(p => (p !== null && p > 0) ? p - 1 : 0);
      }, 1200);
    } catch (err: any) {
      dispatchToast(<Toast><ToastTitle>Action Failed</ToastTitle><ToastBody>{err?.message || "Please try again."}</ToastBody></Toast>, { intent: "error", timeout: 5000 });
    } finally {
      setActionLoading(p => ({ ...p, [req.id]: false }));
    }
  };

  // ── Bulk action handler (Regularize only) ────────────────────────────────────
  // Applies the chosen action to every selected Regularize request via the
  // existing single-request service, using a bounded concurrency pool so large
  // batches (200+) stay predictable. Failures do not roll back the ones that
  // succeeded — failed requests stay selected so a retry is a single click.
  const handleBulkAction = async () => {
    if (!bulkDialog || !currentUser?.userID) return;
    const { action, comment } = bulkDialog;
    const ids = [...selectedRegIds];
    if (ids.length === 0) { setBulkDialog(null); return; }

    setBulkDialog(null);
    setBulkProcessing(true);
    setBulkProgress({ done: 0, total: ids.length });
    const status: "Approved" | "Rejected" = action === "Approve" ? "Approved" : "Rejected";

    try {
      const results = await runWithConcurrency(
        ids,
        BULK_CONCURRENCY,
        (id) => updateRegularizationStatus(id, status, currentUser.userID!, comment.trim() || null),
        (done) => setBulkProgress({ done, total: ids.length })
      );
      const succeededIds = ids.filter((_, i) => results[i].status === "fulfilled");
      const failedIds = ids.filter((_, i) => results[i].status === "rejected");
      const failedCount = failedIds.length;

      // Keep only the failed requests selected, so the manager can retry them in
      // one tap without re-finding them across pages.
      setSelectedRegIds(new Set(failedIds));

      if (succeededIds.length > 0) {
        const succeededSet = new Set(succeededIds);
        setResolvedIds(p => new Set([...p, ...succeededIds]));
        setTimeout(() => {
          setAllRequests(p => p.filter(r => !succeededSet.has(r.id)));
          setResolvedIds(p => { const s = new Set(p); succeededIds.forEach(id => s.delete(id)); return s; });
          if (queueTab === "Indirect Reports") setIndirectCount(p => (p !== null ? Math.max(0, p - succeededIds.length) : 0));
          else setDirectCount(p => (p !== null ? Math.max(0, p - succeededIds.length) : 0));
        }, 1000);
      }

      if (failedCount === 0) {
        dispatchToast(
          <Toast><ToastTitle>{status === "Approved" ? "Approved ✓" : "Rejected"}</ToastTitle><ToastBody>{succeededIds.length} regularization request{succeededIds.length !== 1 ? "s" : ""} {status.toLowerCase()}.</ToastBody></Toast>,
          { intent: status === "Approved" ? "success" : "warning", timeout: 3500 }
        );
      } else {
        dispatchToast(
          <Toast><ToastTitle>Partially completed</ToastTitle><ToastBody>{succeededIds.length} {status.toLowerCase()}, {failedCount} failed — the failed request{failedCount !== 1 ? "s remain" : " remains"} selected. Tap {action} to retry.</ToastBody></Toast>,
          { intent: "error", timeout: 6000 }
        );
      }
    } catch (err: any) {
      dispatchToast(<Toast><ToastTitle>Action Failed</ToastTitle><ToastBody>{err?.message || "Please try again."}</ToastBody></Toast>, { intent: "error", timeout: 5000 });
    } finally {
      setBulkProcessing(false);
      setBulkProgress(null);
    }
  };

  // ── Filter Pill ────────────────────────────────────────────────────────────
  const Pill = ({ label, filter }: { label: string; filter: FilterType }) => {
    const isActive = activeFilter === filter;
    return (
      <div
        className={`${styles.pill} ${isActive ? styles.pillActive : ""}`}
        onClick={() => { if (bulkProcessing) return; setActiveFilter(filter); }}
        style={bulkProcessing ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
      >
        {label}
        <span className={isActive ? styles.pillCount : styles.pillCountInactive}>{counts[filter]}</span>
      </div>
    );
  };

  // ── Row ────────────────────────────────────────────────────────────────────
  const RequestRow = ({ req }: { req: UnifiedRequest }) => {
    const isResolved = resolvedIds.has(req.id);
    const isActing = actionLoading[req.id];
    const c = TYPE_COLORS[req.type];
    const canAct = !req.approvalStatus || req.approvalStatus === "Pending";
    const relativeTime = (() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const submitted = new Date(req.submittedAt);
      submitted.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today.getTime() - submitted.getTime()) / 86400000);
      if (diffDays === 0) return "Submitted Today";
      if (diffDays === 1) return "Submitted Yesterday";
      return `Submitted ${diffDays} days ago`;
    })();

    return (
      <div
        className={`${styles.row} ${isResolved ? styles.rowResolved : ""}`}
        style={{ borderLeftColor: c.border }}
      >
        <div className={styles.cardMainContent}>
          {regSelectionEnabled && req.type === "Regularize" && canAct && (
            <Checkbox
              checked={selectedRegIds.has(req.id)}
              onChange={() => toggleRegSelection(req.id)}
              disabled={isActing || isResolved || bulkProcessing}
              aria-label={`Select ${req.employeeName}'s regularization request`}
              style={{ marginTop: "2px" }}
            />
          )}
          <Avatar name={req.employeeName} size={40} color="brand" icon={<PersonFilled />} />

          <div className={styles.rowBody}>
            <div className={styles.nameLine}>
              <Text weight="bold" size={400}>{req.employeeName}</Text>
              <span className={styles.typeChip} style={{ background: c.bg, color: c.text }}>
                {c.icon}&nbsp;{req.tagLabel}
              </span>
            </div>
            <div className={styles.dateText} style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {req.dateLabel}
              {req.nightShiftCrossesMidnight && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe" }}>
                  Night Shift · spans next day
                </span>
              )}
              {req.type === "Leave" && (req.raw as LeaveRequestRecord).Halfday && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, background: "#fef9c3", color: "#92400e", border: "1px solid #fde68a" }}>
                  Half Day · {(req.raw as LeaveRequestRecord).HalfSession === "1" ? "1st Half" : (req.raw as LeaveRequestRecord).HalfSession === "2" ? "2nd Half" : (req.raw as LeaveRequestRecord).HalfSession ?? ""}
                </span>
              )}
            </div>
            <div className={styles.reasonText}>"{req.reason}"</div>
            <div className={styles.metaText}>{relativeTime} · {req.submittedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, {req.submittedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
        </div>

        <div className={styles.actions}>
          <div className={styles.actionsInner}>
            <span className={styles.refId}>{req.refId}</span>
            {canAct ? (
              <div className={styles.buttonGroup}>
                <Button
                  appearance="outline"
                  className={styles.actionBtn}
                  onClick={() => { setDrawerLeaveBalances([]); setDrawerReq(req); }}
                >
                  View
                </Button>
                <Button
                  appearance="outline"
                  className={styles.rejectBtn}
                  icon={isMobile ? undefined : (isResolved ? <DismissCircle24Filled /> : <DismissCircle24Regular />)}
                  disabled={isActing || isResolved}
                  onClick={() => openConfirmDialog(req, "Reject")}
                >
                  {isActing ? "…" : "Reject"}
                </Button>
                <Button
                  appearance="primary"
                  className={styles.approveBtn}
                  icon={isMobile ? undefined : (isResolved ? <CheckmarkCircle24Filled /> : <CheckmarkCircle24Regular />)}
                  disabled={isActing || isResolved}
                  onClick={() => openConfirmDialog(req, "Approve")}
                >
                  {isActing ? "…" : "Approve"}
                </Button>
              </div>
            ) : (
              <div className={styles.buttonGroup}>
                <Button
                  appearance="outline"
                  className={styles.actionBtn}
                  onClick={() => { setDrawerLeaveBalances([]); setDrawerReq(req); }}
                >
                  View
                </Button>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: "5px",
                  padding: "5px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                  background: req.approvalStatus === "Approved" ? "#dcfce7" : "#fee2e2",
                  color: req.approvalStatus === "Approved" ? "#166534" : "#991b1b",
                  border: `1px solid ${req.approvalStatus === "Approved" ? "#86efac" : "#fca5a5"}`,
                }}>
                  {req.approvalStatus === "Approved" ? <CheckmarkCircle24Filled style={{ fontSize: "16px" }} /> : <DismissCircle24Filled style={{ fontSize: "16px" }} />}
                  {req.approvalStatus}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <Toaster toasterId={toasterId} position="top-end" />

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <Text block size={500} weight="bold" style={{ color: "#0f172a", letterSpacing: "-0.01em" }}>
              {statusFilter === "Pending" ? "Pending Approvals" : statusFilter === "All" ? "All Requests" : `${statusFilter} Requests`}
            </Text>
            {/* <Text size={300} style={{ color: tokens.colorNeutralForeground3, marginTop: "2px" }}>
              {allRequests.length} {statusFilter === "All" ? "total" : statusFilter.toLowerCase()}
              {statusFilter === "Pending" && todayCount > 0 && <> · <span style={{ color: "#0078d4", fontWeight: 600 }}>{todayCount} new today</span></>}
              {" · "}{getGreeting()}, {userData?.DisplayName?.split(" ")[0] || "Manager"}
            </Text> */}
          </div>
          {/* Sort Button */}
          <Menu>
            {/* <MenuTrigger>
              <Button appearance="outline" icon={<ArrowSort24Regular />} style={{ borderRadius: "8px", fontWeight: 600 }}>
                Sort: {sortOrder === "oldest" ? "Oldest First" : "Location First"}
              </Button>
            </MenuTrigger> */}
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => setSortOrder("oldest")} style={{ fontWeight: sortOrder === "oldest" ? 700 : 400 }}>
                  Oldest Submission First
                </MenuItem>
                <MenuItem onClick={() => setSortOrder("location-first")} style={{ fontWeight: sortOrder === "location-first" ? 700 : 400 }}>
                  Location Escalations First
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>


          {/* Primary / Optional Toggle */}
        <div className={styles.tabToggleContainer}>
          {(["Direct Reports", "Indirect Reports"] as const).map(tab => (
            <button
              key={tab}
              disabled={bulkProcessing}
              onClick={() => {
                if (bulkProcessing) return;
                if (queueTab !== tab) {
                  setQueueTab(tab);
                  setActiveFilter("All");
                  setStatusFilter("Pending");
                  setAllRequests([]);
                  setAllPage(1);
                  setLeavePage(1);
                  setPermPage(1);
                  setRegPage(1);
                }
              }}
              className={`${styles.tabToggleButton} ${queueTab === tab ? styles.tabToggleButtonActive : ""}`}
            >
              {tab}
              {tab === "Direct Reports" && directCount !== null && directCount > 0 && (
                <span style={{
                  background: "#0078d4",
                  color: "#fff" ,
                  borderRadius: "10px",
                  padding: "0px 7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  lineHeight: "18px",
                }}>
                  {directCount}
                </span>
              )}
              {tab === "Indirect Reports" && indirectCount !== null && indirectCount > 0 && (
                <span style={{
                  background: "#0078d4" ,
                  color:  "#fff" ,
                  borderRadius: "10px",
                  padding: "0px 7px",
                  fontSize: "11px",
                  fontWeight: 700,
                  lineHeight: "18px",
                }}>
                  {indirectCount}
                </span>
              )}
            </button>
          ))}
        </div>
        </div>

        

        {/* Filter Pills + Status Dropdown */}
        <div className={styles.filterRow}>
          <Pill label="All" filter="All" />
          <Pill label="Leave" filter="Leave" />
          <Pill label="Permission" filter="Permission" />
          <Pill label="Regularize" filter="Regularize" />
          <Pill label="Comp-off" filter="Comp-off"/>
          {/* <Pill label="Escalations" filter="Escalation" /> */}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontWeight: 500, whiteSpace: "nowrap" }}>Status:</Text>
            <select
              value={statusFilter}
              disabled={bulkProcessing}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              style={{
                padding: "5px 10px",
                borderRadius: "8px",
                border: "1.5px solid #e2e8f0",
                fontSize: "13px",
                fontWeight: 600,
                background: "#fff",
                color: "#0f172a",
                cursor: bulkProcessing ? "not-allowed" : "pointer",
                opacity: bulkProcessing ? 0.6 : 1,
                outline: "none",
              }}
            >
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="All">All Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sort meta */}
      {!isLoading && allRequests.length > 0 && (
        <div className={styles.sortMeta}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
            Showing {visible.length} of {allRequests.length} requests
          </Text>
          {/* <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
            {sortOrder === "oldest" ? "Sorted by oldest first" : "Sorted by location escalations, then oldest"}
          </Text> */}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
          <Spinner label="Loading Pending Approvals..." />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && visible.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <CheckmarkCircle24Filled style={{ fontSize: "32px", color: "#107c10" }} />
          </div>
          <Text size={500} weight="semibold" style={{ color: tokens.colorNeutralForeground1 }}>
            {allRequests.length === 0 ? (statusFilter === "Pending" ? "All Caught Up!" : "No Records Found") : "No requests match this filter"}
          </Text>
          <Text size={300} style={{ color: tokens.colorNeutralForeground3, maxWidth: "300px" }}>
            {allRequests.length === 0
              ? (statusFilter === "Pending"
                  ? "There are no pending requests from your team right now."
                  : `There are no ${statusFilter === "All" ? "" : statusFilter.toLowerCase() + " "}requests from your team.`)
              : `Switch to "All" to see the ${allRequests.length} other requests.`}
          </Text>
          <Button appearance="subtle" onClick={fetchAll}>Refresh</Button>
        </div>
      )}

      {/* Regularize bulk action bar */}
      {!isLoading && regSelectionEnabled && selectableRegRows.length > 0 && (
        <div style={{
          display: "flex", flexDirection: "column", gap: "10px",
          padding: "10px 16px", marginBottom: "12px",
          background: selectedRegCount > 0 ? "#fffbeb" : "#f8fafc",
          border: `1.5px solid ${selectedRegCount > 0 ? "#fcd34d" : "#e2e8f0"}`,
          borderRadius: "10px",
          transition: "background 0.15s, border-color 0.15s",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <Checkbox
              checked={allRegSelected ? true : someRegSelected ? "mixed" : false}
              onChange={toggleSelectAllReg}
              disabled={bulkProcessing}
              label={
                <Text size={200} weight="semibold" style={{ color: "#0f172a" }}>
                  {selectedRegCount > 0
                    ? `${selectedRegCount} selected${selectableRegRows.length > pageSize ? " (all pages)" : ""}`
                    : "Select all"}
                </Text>
              }
            />
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
              <Button
                appearance="outline"
                className={styles.rejectBtn}
                icon={<DismissCircle24Regular />}
                disabled={selectedRegCount === 0 || bulkProcessing}
                onClick={() => setBulkDialog({ action: "Reject", comment: "" })}
              >
                Reject Selected
              </Button>
              <Button
                appearance="primary"
                className={styles.approveBtn}
                icon={<CheckmarkCircle24Regular />}
                disabled={selectedRegCount === 0 || bulkProcessing}
                onClick={() => setBulkDialog({ action: "Approve", comment: "" })}
              >
                Approve Selected
              </Button>
            </div>
          </div>

          {bulkProcessing && bulkProgress && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <ProgressBar
                value={bulkProgress.total ? bulkProgress.done / bulkProgress.total : undefined}
                thickness="medium"
              />
              <Text size={100} style={{ color: "#92400e", fontWeight: 600 }}>
                Processing {bulkProgress.done} / {bulkProgress.total}… please keep this tab open.
              </Text>
            </div>
          )}
        </div>
      )}

      {/* List */}
      {!isLoading && visible.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className={styles.list}>
            {paginatedVisible.map(req => <RequestRow key={req.id} req={req} />)}
          </div>

          {visible.length > 5 && (
            <div className={styles.paginationRow}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text size={100} style={{ color: '#64748b' }}>Show:</Text>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
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
                <Button size="small" appearance="subtle" icon={<ChevronLeftRegular />} disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Text size={100} weight="semibold">Page</Text>
                  <select
                    value={page}
                    onChange={(e) => setPage(Number(e.target.value))}
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
                    {Array.from({ length: Math.ceil(visible.length / pageSize) }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <Text size={100} weight="semibold">of {Math.ceil(visible.length / pageSize)}</Text>
                </div>
                <Button size="small" appearance="subtle" icon={<ChevronRightRegular />} iconPosition="after" disabled={page >= Math.ceil(visible.length / pageSize)} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Comment Confirmation Dialog (Leave & Permission) ─────────────── */}
      <Dialog open={!!confirmDialog} onOpenChange={(_, { open }) => { if (!open) setConfirmDialog(null); }}>
        <DialogSurface className={styles.dialogSurface}>
          {confirmDialog && (() => {
            const { req, action, comment } = confirmDialog;
            const c = TYPE_COLORS[req.type];
            const isApprove = action === "Approve";
            return (
              <>
                <DialogTitle>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Avatar name={req.employeeName} size={36} color="brand" icon={<PersonFilled />} />
                    <div>
                      <Text weight="bold" size={400} block>{req.employeeName}</Text>
                      {req.jobTitle && (
                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>{req.jobTitle}</Text>
                      )}
                    </div>
                  </div>
                </DialogTitle>
                <DialogBody>
                  <DialogContent>
                    {/* Request summary */}

                    {
                      !isApprove && (confirmDialog?.req.type === "Regularize" || confirmDialog?.req.type === "Escalation") && (
                        <MessageBar icon={null} className="bg-[#f7c2c1]! text-[#990705]! mb-2 border-0!" color="red">
                          <MessageBarBody>
                            Rejecting this will mark the user as absent for the specific date.
                          </MessageBarBody>
                        </MessageBar>
                      )
                    }
                    <div style={{
                      background: tokens.colorNeutralBackground2,
                      borderRadius: "8px",
                      padding: "12px 14px",
                      marginBottom: "16px",
                      borderLeft: `3px solid ${c.border}`,
                    }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: c.bg, color: c.text, marginBottom: "6px" }}>
                        {c.icon}&nbsp;{req.tagLabel}
                      </span>
                      <Text weight="semibold" size={300} block style={{ marginBottom: "2px" }}>{req.dateLabel}</Text>
                      {req.nightShiftCrossesMidnight && (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 600, background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", marginBottom: "6px" }}>
                          Night Shift · spans next day
                        </span>
                      )}
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3, fontStyle: "italic" }}>"{req.reason}"</Text>
                    </div>

                    {/* Comment field */}
                    <Field
                      label={
                        <Text size={300} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
                         <Text size={200} style={{ color: tokens.colorNeutralForeground4, fontWeight: 400 }}>(optional)</Text>
                        </Text>
                      }
                    >
                      <Textarea
                        resize="vertical"
                        rows={3}
                        placeholder={isApprove ? "Add a note for the employee…" : "State a reason for rejection…"}
                        value={comment}
                        onChange={(_, d) => d.value.length <= 200 ? setConfirmDialog(prev => prev ? { ...prev, comment: d.value } : prev) : null}
                        style={{ width: "100%" }}
                      />
                      <Text size={100} style={{ display: "block", textAlign: "right", color: comment.length >= 200 ? tokens.colorPaletteRedForeground1 : tokens.colorNeutralForeground4, marginTop: "2px" }}>
                        {comment.length}/200
                      </Text>
                    </Field>
                  </DialogContent>
                  <DialogActions>
                    <Button appearance="subtle" onClick={() => setConfirmDialog(null)}>Cancel</Button>
                    <Button
                      appearance={isApprove ? "primary" : "outline"}
                      style={isApprove
                        ? { background: "#107c10", color: "#fff", fontWeight: 600, borderRadius: "7px" }
                        : { color: "#c00", borderColor: "#fca5a5", fontWeight: 600, borderRadius: "7px" }}
                      icon={isApprove ? <CheckmarkCircle24Regular /> : <DismissCircle24Regular />}
                      onClick={submitConfirmDialog}
                    >
                      {action}
                    </Button>
                  </DialogActions>
                </DialogBody>
              </>
            );
          })()}
        </DialogSurface>
      </Dialog>

      {/* ── Bulk Confirmation Dialog (Regularize only) ───────────────────── */}
      <Dialog open={!!bulkDialog} onOpenChange={(_, { open }) => { if (!open) setBulkDialog(null); }}>
        <DialogSurface className={styles.dialogSurface}>
          {bulkDialog && (() => {
            const { action, comment } = bulkDialog;
            const c = TYPE_COLORS.Regularize;
            const isApprove = action === "Approve";
            return (
              <>
                <DialogTitle>
                  <Text weight="bold" size={400} block>
                    {isApprove ? "Approve" : "Reject"} {selectedRegCount} regularization request{selectedRegCount !== 1 ? "s" : ""}
                  </Text>
                </DialogTitle>
                <DialogBody>
                  <DialogContent>
                    {!isApprove && (
                      <MessageBar icon={null} className="bg-[#f7c2c1]! text-[#990705]! mb-2 border-0!" color="red">
                        <MessageBarBody>
                          Rejecting these will mark the respective users as absent for the specific dates.
                        </MessageBarBody>
                      </MessageBar>
                    )}
                    <div style={{
                      background: tokens.colorNeutralBackground2,
                      borderRadius: "8px",
                      padding: "12px 14px",
                      marginBottom: "16px",
                      borderLeft: `3px solid ${c.border}`,
                    }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: c.bg, color: c.text }}>
                        {c.icon}&nbsp;Regularize
                      </span>
                      <Text size={200} block style={{ color: tokens.colorNeutralForeground3, marginTop: "8px" }}>
                        This action will be applied to all {selectedRegCount} selected request{selectedRegCount !== 1 ? "s" : ""}. The same comment (if any) will be recorded on each.
                      </Text>
                    </div>

                    {selectedRegCount > 50 && (
                      <MessageBar intent="warning" className="mb-2">
                        <MessageBarBody>
                          Processing {selectedRegCount} requests may take up to a minute. Please keep this tab open until it finishes.
                        </MessageBarBody>
                      </MessageBar>
                    )}

                    <Field
                      label={
                        <Text size={300} weight="semibold" style={{ color: tokens.colorNeutralForeground2 }}>
                          <Text size={200} style={{ color: tokens.colorNeutralForeground4, fontWeight: 400 }}>(optional)</Text>
                        </Text>
                      }
                    >
                      <Textarea
                        resize="vertical"
                        rows={3}
                        placeholder={isApprove ? "Add a note for the employees…" : "State a reason for rejection…"}
                        value={comment}
                        onChange={(_, d) => d.value.length <= 200 ? setBulkDialog(prev => prev ? { ...prev, comment: d.value } : prev) : null}
                        style={{ width: "100%" }}
                      />
                      <Text size={100} style={{ display: "block", textAlign: "right", color: comment.length >= 200 ? tokens.colorPaletteRedForeground1 : tokens.colorNeutralForeground4, marginTop: "2px" }}>
                        {comment.length}/200
                      </Text>
                    </Field>
                  </DialogContent>
                  <DialogActions>
                    <Button appearance="subtle" onClick={() => setBulkDialog(null)}>Cancel</Button>
                    <Button
                      appearance={isApprove ? "primary" : "outline"}
                      style={isApprove
                        ? { background: "#107c10", color: "#fff", fontWeight: 600, borderRadius: "7px" }
                        : { color: "#c00", borderColor: "#fca5a5", fontWeight: 600, borderRadius: "7px" }}
                      icon={isApprove ? <CheckmarkCircle24Regular /> : <DismissCircle24Regular />}
                      onClick={handleBulkAction}
                    >
                      {action}
                    </Button>
                  </DialogActions>
                </DialogBody>
              </>
            );
          })()}
        </DialogSurface>
      </Dialog>

      {/* ── Detail Drawer ──────────────────────────────────────────────────── */}
      <OverlayDrawer
        open={!!drawerReq}
        position="end"
        size="medium"
        className={styles.drawer}
        onOpenChange={(_, { open }) => { if (!open) setDrawerReq(null); }}
      >
        {drawerReq && (() => {
          const c = TYPE_COLORS[drawerReq.type];
          const isActing = actionLoading[drawerReq.id];
          const isResolved = resolvedIds.has(drawerReq.id);
          return (
            <>
              <DrawerHeader style={{ borderBottom: `3px solid ${c.border}`, paddingBottom: "16px" }}>
                <DrawerHeaderTitle
                  action={
                    <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setDrawerReq(null)} />
                  }
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Avatar name={drawerReq.employeeName} size={40} color="brand" />
                    <div>
                      <Text weight="bold" size={400} block>{drawerReq.employeeName}</Text>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {drawerReq.jobTitle ? `${drawerReq.jobTitle} · ` : ""}
                        <span style={{ fontFamily: "monospace" }}>{drawerReq.refId}</span>
                      </Text>
                    </div>
                  </div>
                </DrawerHeaderTitle>
              </DrawerHeader>

              <DrawerBody className={styles.drawerBody}>
                {/* Request summary card */}
                <div style={{
                  background: tokens.colorNeutralBackground2,
                  borderRadius: "10px",
                  padding: "14px 16px",
                  marginBottom: "20px",
                  border: `1px solid ${tokens.colorNeutralStroke2}`,
                }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600, background: c.bg, color: c.text, marginBottom: "8px" }}>
                    {c.icon}&nbsp;{drawerReq.tagLabel}
                  </span>
                  <Text weight="bold" size={500} block style={{ marginBottom: "4px" }}>{drawerReq.dateLabel}</Text>
                  {drawerReq.nightShiftCrossesMidnight && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "2px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: "#eef2ff", color: "#3730a3", border: "1px solid #c7d2fe", marginBottom: "6px" }}>
                      Night Shift · spans next day
                    </span>
                  )}
                  {drawerReq.type === "Leave" && (drawerReq.raw as LeaveRequestRecord).Halfday && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px", padding: "2px 10px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: "#fef9c3", color: "#92400e", border: "1px solid #fde68a", marginBottom: "6px" }}>
                      Half Day · {(drawerReq.raw as LeaveRequestRecord).HalfSession === "1" ? "1st Half" : (drawerReq.raw as LeaveRequestRecord).HalfSession === "2" ? "2nd Half" : (drawerReq.raw as LeaveRequestRecord).HalfSession ?? ""}
                    </span>
                  )}
                  <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>
                    Submitted {drawerReq.submittedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}, {drawerReq.submittedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </div>

                {/* Reason */}
                <Text weight="semibold" size={300} block style={{ marginBottom: "8px", color: tokens.colorNeutralForeground2 }}>Reason provided</Text>
                <div style={{ background: tokens.colorNeutralBackground2, borderRadius: "8px", padding: "12px 16px", marginBottom: "24px", borderLeft: `3px solid ${c.border}` }}>
                  <Text size={300} style={{ lineHeight: 1.6 }}>"{drawerReq.reason}"</Text>
                </div>

                {/* Leave balance (Leave type only) */}
                {drawerReq.type === "Leave" && (
                  <div style={{ marginBottom: "24px" }}>
                    <Text weight="semibold" size={300} block style={{ marginBottom: "10px", color: tokens.colorNeutralForeground2 }}>Leave balance snapshot</Text>
                    {drawerLoading ? <Spinner size="tiny" label="Loading..." /> : (
                      <div className={styles.leaveBalanceGrid}>
                        {drawerLeaveBalances.length === 0 ? (
                          <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>No balance data available.</Text>
                        ) : drawerLeaveBalances.filter(item=>item.IsDisabled === false).map(b => (
                          <div key={b.LeaveNameType} style={{ background: tokens.colorNeutralBackground2, borderRadius: "8px", padding: "10px 14px" }}>
                            <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }} block>{displayLeaveLabel(b.LeaveType)}</Text>
                            <Text weight="bold" size={500} block>{b.AvailableDays}<Text size={200} style={{ color: tokens.colorNeutralForeground3, fontWeight: 400 }}>/{b.TotalDays}</Text></Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Leave impact (Leave type only) */}
                {drawerReq.type === "Leave" && (
                  <div style={{ marginBottom: "24px" }}>
                    {drawerLoading ? <Spinner size="tiny" label="Loading..." /> : drawerLeaveImapct ? (() => {
                      const impact = drawerLeaveImapct as { leaves: { RequestorName: string; ApprovalStatus: string; Reason: string }[]; totalEmployees: number; onLeaveCount: number; impactPercentage: number };
                      const impactColor = impact.impactPercentage >= 50 ? "#dc2626" : impact.impactPercentage >= 25 ? "#d97706" : "#107c10";
                      const strengthAfterApproval = impact.totalEmployees > 0
                        ? Math.round(((impact.totalEmployees - (impact.onLeaveCount + 1)) / impact.totalEmployees) * 100)
                        : 100;
                      const showStrengthWarning = strengthAfterApproval <= 85;
                      return (
                        <div>
                          {/* Critical strength warning */}
                          {showStrengthWarning && (
                            <div style={{
                              background: "#fef2f2",
                              border: "1.5px solid #fca5a5",
                              borderRadius: "8px",
                              padding: "10px 14px",
                              marginBottom: "10px",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "10px",
                            }}>
                              <span style={{ fontSize: "16px", flexShrink: 0 }}>⚠️</span>
                              <div>
                                <Text weight="semibold" size={300} block style={{ color: "#b91c1c", marginBottom: "2px" }}>
                                  Critical Team Availability Warning
                                </Text>
                                <Text size={200} style={{ color: "#991b1b" }}>
                                  Approving this request will reduce team strength to <strong>{strengthAfterApproval}%</strong> on the applied day ({impact.onLeaveCount + 1} of {impact.totalEmployees} members will be on leave). Consider deferring or coordinating before approving.
                                </Text>
                              </div>
                            </div>
                          )}
                          {/* Stats row */}
                          {/* <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                            <div style={{ background: tokens.colorNeutralBackground2, borderRadius: "8px", padding: "10px 14px", textAlign: "center" }}>
                              <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }} block>Team Size</Text>
                              <Text weight="bold" size={500} block>{impact.totalEmployees}</Text>
                            </div>
                            <div style={{ background: tokens.colorNeutralBackground2, borderRadius: "8px", padding: "10px 14px", textAlign: "center" }}>
                              <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }} block>On Leave</Text>
                              <Text weight="bold" size={500} block style={{ color: impact.onLeaveCount > 0 ? "#d97706" : tokens.colorNeutralForeground1 }}>{impact.onLeaveCount}</Text>
                            </div>
                            <div style={{ background: tokens.colorNeutralBackground2, borderRadius: "8px", padding: "10px 14px", textAlign: "center" }}>
                              <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }} block>Impact</Text>
                              <Text weight="bold" size={500} block style={{ color: impactColor }}>{impact.impactPercentage}%</Text>
                            </div>
                          </div> */}
                          {/* Leaves list */}
                          {/* {impact.leaves.length > 0 ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                              {impact.leaves.map((l, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: tokens.colorNeutralBackground2, borderRadius: "8px", padding: "8px 12px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <Avatar name={l.RequestorName} size={24} color="brand" />
                                    <Text size={300} weight="semibold">{l.RequestorName}</Text>
                                  </div>
                                  <span style={{
                                    fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "10px",
                                    background: l.ApprovalStatus === "Approved" ? "#dcfce7" : l.ApprovalStatus === "Pending" ? "#fef9c3" : "#fee2e2",
                                    color: l.ApprovalStatus === "Approved" ? "#166534" : l.ApprovalStatus === "Pending" ? "#854d0e" : "#991b1b",
                                  }}>{l.ApprovalStatus}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>No other team members on leave this day.</Text>
                          )} */}
                        </div>
                      );
                    })() : (
                      <Text size={200} style={{ color: tokens.colorNeutralForeground4 }}>Impact data unavailable.</Text>
                    )}
                  </div>
                )}



                {/* Regularization time detail */}
                {drawerReq.type === "Regularize" && (() => {
                  const reg = drawerReq.raw as RegularizationRecord;
                  const fmtTime = (iso: string | null) =>
                    iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—";
                  const fmtDate = (iso: string | null) =>
                    iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

                  const TimeCell = ({ label, iso }: { label: string; iso: string | null }) => (
                    <div style={{ flex: 1 }}>
                      <Text weight="semibold" size={300} block style={{ marginBottom: "8px", color: tokens.colorNeutralForeground2 }}>{label}</Text>
                      <div style={{ background: tokens.colorNeutralBackground2, borderRadius: "8px", padding: "12px 16px", border: `1px solid ${tokens.colorNeutralStroke2}` }}>
                        <Text weight="bold" size={400}>{fmtTime(iso)}</Text>
                        {iso && <Text size={200} block style={{ color: tokens.colorNeutralForeground4, marginTop: "2px" }}>{fmtDate(iso)}</Text>}
                      </div>
                    </div>
                  );

                  return (
                    <div className={styles.regTimeGrid}>
                      <TimeCell label="Actual Check-in Time" iso={reg.ActualStartTime} />
                      {reg.IsLeave && <TimeCell label="Actual Check-out Time" iso={reg.ActualEndTime} />}
                    </div>
                  );
                })()}

                {/* Permission detail */}
                {drawerReq.type === "Permission" && (() => {
                  const perm = drawerReq.raw as PermissionRequest;
                  const crossesMidnight = !!drawerReq.nightShiftCrossesMidnight;
                  const duration = formatPermissionDuration(perm.StartTime, perm.EndTime, crossesMidnight);
                  return (
                    <div style={{ marginBottom: "24px" }}>
                      <Text weight="semibold" size={300} block style={{ marginBottom: "10px", color: tokens.colorNeutralForeground2 }}>Permission details</Text>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                        <div style={{ background: tokens.colorNeutralBackground2, borderRadius: "8px", padding: "10px 14px" }}>
                          <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }} block>Start</Text>
                          <Text weight="bold" size={400} block>{formatTimeShort(perm.StartTime)}</Text>
                          <Text size={100} block style={{ color: tokens.colorNeutralForeground4, marginTop: "2px" }}>{formatDateShort(perm.Date)}</Text>
                        </div>
                        <div style={{ background: tokens.colorNeutralBackground2, borderRadius: "8px", padding: "10px 14px" }}>
                          <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }} block>End</Text>
                          <Text weight="bold" size={400} block>{formatTimeShort(perm.EndTime)}</Text>
                          {crossesMidnight && (
                            <Text size={100} block style={{ color: tokens.colorNeutralForeground4, marginTop: "2px" }}>
                              {formatDateShort(new Date(new Date(perm.Date).getTime() + 24 * 60 * 60 * 1000))}
                            </Text>
                          )}
                        </div>
                        <div style={{ background: tokens.colorNeutralBackground2, borderRadius: "8px", padding: "10px 14px" }}>
                          <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }} block>Duration</Text>
                          <Text weight="bold" size={400} block style={{ color: c.text }}>{duration ?? "—"}</Text>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Comp-off detail */}
                {drawerReq.type === "Comp-off" && (() => {
                  const co = drawerReq.raw as CompOffRequest;
                  return (
                    <div style={{ marginBottom: "24px" }}>
                      <Text weight="semibold" size={300} block style={{ marginBottom: "10px", color: tokens.colorNeutralForeground2 }}>Comp-off details</Text>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        <div style={{ background: tokens.colorNeutralBackground2, borderRadius: "8px", padding: "10px 14px" }}>
                          <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }} block>Work Date</Text>
                          <Text weight="bold" size={400} block>
                            {co.WorkedDate ? formatDateShort(co.WorkedDate) : "—"}
                          </Text>
                        </div>
                        <div style={{ background: tokens.colorNeutralBackground2, borderRadius: "8px", padding: "10px 14px" }}>
                          <Text size={100} style={{ color: tokens.colorNeutralForeground4, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }} block>Status</Text>
                          <Text weight="bold" size={400} block style={{ color: co.Status === "Pending" ? "#d97706" : co.Status === "Approved" ? "#107c10" : "#c00" }}>
                            {co.Status}
                          </Text>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Drawer footer actions */}

              </DrawerBody>

               <DrawerFooter>
                <div style={{ display: "flex", gap: "10px", paddingTop: "16px", borderTop: `1px solid ${tokens.colorNeutralStroke2}`, width:'100%', alignItems: "center" }}>
                  {(!drawerReq.approvalStatus || drawerReq.approvalStatus === "Pending") ? (
                    <>
                      <Button
                        appearance="outline"
                        className={styles.rejectBtn}
                        icon={isResolved ? <DismissCircle24Filled /> : <DismissCircle24Regular />}
                        disabled={isActing || isResolved}
                        style={{ flex: 1 }}
                        onClick={() => openConfirmDialog(drawerReq, "Reject")}
                      >Reject</Button>
                      <Button
                        appearance="primary"
                        className={styles.approveBtn}
                        icon={isResolved ? <CheckmarkCircle24Filled /> : <CheckmarkCircle24Regular />}
                        disabled={isActing || isResolved}
                        style={{ flex: 1 }}
                        onClick={() => openConfirmDialog(drawerReq, "Approve")}
                      >Approve</Button>
                    </>
                  ) : (
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "8px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: 600,
                      background: drawerReq.approvalStatus === "Approved" ? "#dcfce7" : "#fee2e2",
                      color: drawerReq.approvalStatus === "Approved" ? "#166534" : "#991b1b",
                      border: `1.5px solid ${drawerReq.approvalStatus === "Approved" ? "#86efac" : "#fca5a5"}`,
                      width: "100%", justifyContent: "center",
                    }}>
                      {drawerReq.approvalStatus === "Approved" ? <CheckmarkCircle24Filled /> : <DismissCircle24Filled />}
                      This request was {drawerReq.approvalStatus?.toLowerCase()}
                    </span>
                  )}
                </div>
                </DrawerFooter>
            </>
          );
        })()}
      </OverlayDrawer>
    </div>
  );
};

export default AttendanceApprovals;
