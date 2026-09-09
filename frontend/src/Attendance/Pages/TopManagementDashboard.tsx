import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  makeStyles,
  Text,
  Spinner,
  SearchBox,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  MessageBar,
  MessageBarBody,
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
} from "@fluentui/react-components";
import { CalendarLtr20Regular, DismissRegular, ChevronLeft24Regular, ChevronRight24Regular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import CustomPagination from "../../Recruit/Components/CustomPagination";
import {
  getManagementDashboardReport,
  ManagementDashboardRow,
  getPresetRange,
  formatDisplayDate,
  DatePreset,
  DateRange,
  getPresentDetails,
  getAbsentDetails,
  getLeaveDetails,
  getPermissionDetails,
  getRegularizeDetails,
  PresentDetailRow,
  AbsentDetailRow,
  LeaveDetailRow,
  PermissionDetailRow,
  RegularizeDetailRow,
  ManagementDashboardSortField,
} from "../Services/ManagementDashboardService";
import { getAdminReportFilters } from "../Services/AdminAttendanceReportService";
import AttendanceCalendar, { CalendarEvent } from "../Components/AttendanceCalendar";
import { getEmployeeCalendar, EmployeeCalendarData } from "../Services/TeamViewService";
import { getHolidaysByYear, Holiday } from "../../Services/HolidayService";
import { getPermissionHistory, PermissionRequest } from "../Services/AttendanceService";
import { displayLeaveLabel } from "../Utils/leaveUtils";

type DrawerType = "present" | "absent" | "leave" | "permission" | "regularize";

const DRAWER_TITLES: Record<DrawerType, string> = {
  present: "Present Days",
  absent: "Absent Days",
  leave: "Leave Records",
  permission: "Permission Records",
  regularize: "Regularize Records",
};

const SORT_FIELD_LABELS: Record<ManagementDashboardSortField, string> = {
  displayName: "employee name",
  email: "email",
  department: "department",
  expectedDays: "total working days",
  presentDays: "present",
  absentDays: "absent",
  leaveDays: "leave",
  permissionDays: "permission",
  regularizeDays: "regularize",
  attendancePct: "overall attendance %",
};

function fmtDateOnly(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return formatDisplayDate(d);
}

function fmtTimeOnly(value: string | null | undefined): string {
  if (!value) return "—";
  // SQL `time`/`datetime2` values arrive as either "HH:MM:SS" or a full ISO string —
  // handle both without assuming which one the driver serialized.
  const isoMatch = /T(\d{2}):(\d{2})/.exec(value);
  const plainMatch = /^(\d{2}):(\d{2})/.exec(value);
  const match = isoMatch ?? plainMatch;
  if (!match) return value;
  const hour = parseInt(match[1], 10);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return `${formatDisplayDate(d)}, ${fmtTimeOnly(value)}`;
}

// ─── Drawer column config + generic filter/sort/CSV helpers ─────────────────

interface DrawerColumn {
  key: string;
  label: string;
  getText: (row: any) => string; // used for display, search matching, and CSV export
  sortValue: (row: any) => string | number;
}

function compareValues(a: string | number, b: string | number): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

function downloadCSV(filename: string, columns: DrawerColumn[], rows: any[]) {
  const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = columns.map((c) => escape(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => escape(c.getText(r))).join(",")).join("\n");
  const csv = `${header}\n${body}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "0",
    minHeight: "100%",
    backgroundColor: "transparent",
  },
  header: {
    padding: "20px 28px 16px 28px",
    "@media (max-width: 768px)": {
      padding: "14px 16px 12px 16px",
    },
  },
  headerBanner: {
    padding: "24px 28px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    "@media (max-width: 768px)": {
      padding: "18px 16px",
    },
  },
  headerBannerDate: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#000",
    background: "rgba(255,255,255,0.18)",
    padding: "6px 14px",
    borderRadius: "999px",
  },
  pageTitle: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#000",
  },
  filterCard: {
    margin: "5px 28px 0 28px",
    background: "#fff",
    borderRadius: "14px",
    padding: "18px 24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    display: "flex",
    alignItems: "flex-end",
    gap: "20px",
    flexWrap: "wrap",
    "@media (max-width: 768px)": {
      margin: "12px 12px 0 12px",
      padding: "14px 16px",
      gap: "12px",
    },
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  filterLabel: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  selectBox: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1.5px solid #d1d5db",
    background: "#fff",
    fontSize: "13px",
    color: "#111827",
    cursor: "pointer",
    outline: "none",
    minWidth: "140px",
    maxWidth: "100%",
    boxSizing: "border-box",
  },
  dateInput: {
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1.5px solid #d1d5db",
    background: "#fff",
    fontSize: "13px",
    color: "#111827",
    outline: "none",
  },
  dateDisplay: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1.5px solid #d1d5db",
    background: "#f9fafb",
    fontSize: "13px",
    color: "#374151",
    minWidth: "200px",
  },
  customDateRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
  },
  content: {
    padding: "20px 28px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    "@media (max-width: 768px)": {
      padding: "12px 12px",
      gap: "12px",
    },
  },
  tableCard: {
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    overflow: "hidden",
  },
  tableCardHead: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid #e5e7eb",
    flexWrap: "wrap",
    gap: "10px",
  },
  sortLabel: {
    fontSize: "12px",
    color: "#6b7280",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  sortLabelIcon: {
    fontSize: "11px",
    color: "#9ca3af",
  },
  tableScroll: {
    overflowX: "auto",
  },
  table: {
    minWidth: "920px",
  },
  headerRow: {
    backgroundColor: "#f9fafb",
  },
  headerCell: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  headerCellCenter: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    textAlign: "center",
  },
  headerCellSortable: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: "1.4",
    verticalAlign: "bottom",
    "&:hover": {
      color: "#111827",
    },
  },
  headerCellCenterSortable: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    textAlign: "center",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "normal",
    wordBreak: "break-word",
    lineHeight: "1.4",
    verticalAlign: "bottom",
    "&:hover": {
      color: "#111827",
    },
  },
  bodyRow: {
    transition: "background-color 0.12s ease",
    "&:nth-child(even)": {
      backgroundColor: "#fafafa",
    },
    "&:hover": {
      backgroundColor: "#f0f6ff",
    },
  },
  cellCenter: {
    textAlign: "center",
  },
  countValue: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#111827",
  },
  countZero: {
    color: "#c1c5cb",
    fontWeight: "400",
  },
  absentPositive: {
    color: "#dc2626",
  },
  countPill: {
    display: "inline-block",
    minWidth: "28px",
    padding: "3px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  },
  pillPresent: {
    background: "#dcfce7",
    color: "#16a34a",
  },
  pillAbsent: {
    background: "#fee2e2",
    color: "#dc2626",
  },
  pillLeave: {
    background: "#fef3c7",
    color: "#b45309",
  },
  pillPermission: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  clickableCount: {
    cursor: "pointer",
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
    textUnderlineOffset: "3px",
    "&:hover": {
      opacity: 0.75,
    },
  },
  drawerEmployeeHeader: {
    padding: "0 0 12px 0",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  drawerEmployeeName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
  },
  drawerEmployeeMeta: {
    fontSize: "12px",
    color: "#6b7280",
  },
  drawerSpinnerWrap: {
    display: "flex",
    justifyContent: "center",
    padding: "30px",
  },
  drawerEmptyState: {
    padding: "30px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "13px",
  },
  calendarMonthNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    padding: "8px 0 20px 0",
  },
  presentTabs: {
    display: "flex",
    gap: "8px",
    padding: "4px 0 12px 0",
    flexWrap: "wrap",
  },
  presentTabInactive: {
    padding: "7px 16px",
    borderRadius: "999px",
    border: "1.5px solid #d1d5db",
    background: "#fff",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    "&:hover": {
      background: "#f3f4f6",
    },
  },
  presentTabActive: {
    padding: "7px 16px",
    borderRadius: "999px",
    border: "1.5px solid #0078D4",
    background: "#0078D4",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  drawerToolbar: {
    display: "flex",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "14px",
    padding: "14px 16px",
    marginBottom: "16px",
    background: "#f9fafb",
    borderRadius: "12px",
    border: "1px solid #eef0f2",
  },
  drawerToolbarGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  drawerToolbarSpacer: {
    flex: "1 1 auto",
  },
  drawerSelectBox: {
    padding: "7px 10px",
    borderRadius: "8px",
    border: "1.5px solid #d1d5db",
    background: "#fff",
    fontSize: "13px",
    color: "#111827",
    cursor: "pointer",
    outline: "none",
  },
  drawerClearBtn: {
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1.5px solid #d1d5db",
    background: "#fff",
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    alignSelf: "flex-end",
  },
  drawerExportBtn: {
    padding: "8px 18px",
    borderRadius: "8px",
    border: "1.5px solid #0078D4",
    background: "#0078D4",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap",
    alignSelf: "flex-end",
    transition: "opacity 0.15s ease",
    "&:disabled": {
      opacity: 0.4,
      cursor: "not-allowed",
    },
  },
  drawerTableCard: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #eef0f2",
    overflow: "hidden",
  },
  drawerTable: {
    minWidth: "100%",
  },
  drawerHeaderCellSortable: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    "&:hover": {
      color: "#111827",
    },
  },
  drawerSortIcon: {
    marginLeft: "6px",
    fontSize: "10px",
    color: "#c1c5cb",
  },
  drawerSortIconActive: {
    marginLeft: "6px",
    fontSize: "10px",
    color: "#0078D4",
  },
  drawerCellText: {
    fontSize: "13px",
    color: "#111827",
  },
  drawerTableWrap: {
    overflowX: "auto",
  },
  employeeCell: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
    width: "100%",
  },
  employeeRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
    maxWidth: "230px",
  },
  employeeAvatar: {
    width: "34px",
    height: "34px",
    minWidth: "34px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "700",
  },
  calendarLink: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    fontWeight: "600",
    color: "#0078D4",
    cursor: "pointer",
    marginTop: "2px",
    width: "fit-content",
    "&:hover": {
      textDecoration: "underline",
    },
  },
  employeeName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#111827",
    display: "block",
    width: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  employeeEmail: {
    fontSize: "12px",
    color: "#6b7280",
    display: "block",
    width: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  pctBadge: {
    display: "inline-block",
    minWidth: "56px",
    textAlign: "center",
    padding: "4px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  },
  pctCell: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    justifyContent: "center",
  },
  pctDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  pctBarTrack: {
    width: "48px",
    height: "6px",
    borderRadius: "999px",
    background: "#e5e7eb",
    overflow: "hidden",
    flexShrink: 0,
  },
  pctBarFill: {
    height: "100%",
    borderRadius: "999px",
    transition: "width 0.2s ease",
  },
  tableFooter: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    padding: "12px 20px 4px 20px",
  },
  tableFooterText: {
    fontSize: "12px",
    color: "#6b7280",
  },
  legend: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#6b7280",
  },
  legendDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
  },
  spinnerWrap: {
    display: "flex",
    justifyContent: "center",
    padding: "40px",
  },
  emptyState: {
    padding: "40px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "13px",
  },
});

// Thresholds: 80%+ green, 50-79% amber, below 50% red — matches the legend shown at
// the bottom of the table.
function attColor(pct: number): string {
  if (pct >= 80) return "#16a34a";
  if (pct >= 50) return "#d97706";
  return "#dc2626";
}

function attBg(pct: number): string {
  if (pct >= 80) return "#dcfce7";
  if (pct >= 50) return "#fef3c7";
  return "#fee2e2";
}

const AVATAR_COLORS = ["#6366f1", "#0078D4", "#16a34a", "#ca8a04", "#dc2626", "#7c3aed", "#0891b2", "#c026d3"];
function avatarColor(name: string): string {
  let n = 0;
  for (const c of name) n += c.charCodeAt(0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

const DEFAULT_PRESET: DatePreset = "thisMonth";
const PAGE_SIZE = 20;

const ManagementDashboard: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const checkPermission = (permissionPath: string) => {
    const paths = permissionPath.split(".");
    let current: any = currentUser?.permissions;
    for (const path of paths) {
      if (!current || current[path] === undefined) return false;
      current = current[path];
    }
    return current === true;
  };

  useEffect(() => {
    if (checkPermission("attendance.dashboard.admin_dashboard") === false) {
      navigate("/Attendance");
    }
  }, []);

  const [preset, setPreset] = useState<DatePreset>(DEFAULT_PRESET);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [appliedRange, setAppliedRange] = useState<DateRange>(getPresetRange(DEFAULT_PRESET));

  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("All");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [rows, setRows] = useState<ManagementDashboardRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const [sortBy, setSortBy] = useState<ManagementDashboardSortField>("displayName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  function handleSortClick(field: ManagementDashboardSortField) {
    if (sortBy === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir("asc");
    }
    setPage(1);
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Load department list once
  useEffect(() => {
    getAdminReportFilters()
      .then((f) => setDepartments(f.departments))
      .catch(() => setDepartments([]));
  }, []);

  // Reset to page 1 whenever a filter changes
  useEffect(() => {
    setPage(1);
  }, [appliedRange, selectedDept, debouncedSearch, pageSize]);

  // Fetch report rows — sortBy/sortDir are sent to the backend, which sorts
  // the full filtered dataset BEFORE slicing into pages, so page N always
  // shows the correct globally-sorted slice.
  useEffect(() => {
    if (!appliedRange.startDate || isNaN(appliedRange.startDate.getTime())) return;
    setLoading(true);
    setError(null);
    getManagementDashboardReport({
      startDate: appliedRange.startDate,
      endDate: appliedRange.endDate,
      department: selectedDept !== "All" ? selectedDept : undefined,
      search: debouncedSearch || undefined,
      sortBy,
      sortDir,
      page,
      pageSize,
    })
      .then((res) => {
        setRows(res.rows);
        setTotal(res.pagination.total);
      })
      .catch(() => setError("Failed to load management dashboard report. Please try again."))
      .finally(() => setLoading(false));
  }, [appliedRange, selectedDept, debouncedSearch, sortBy, sortDir, page, pageSize]);

  function handlePresetChange(val: DatePreset) {
    setPreset(val);
    if (val !== "custom") {
      setAppliedRange(getPresetRange(val));
    }
  }

  useEffect(() => {
    if (preset !== "custom" || !customStart || !customEnd) return;
    const start = new Date(customStart + "T00:00:00");
    const end = new Date(customEnd + "T00:00:00");
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return;
    setAppliedRange({ startDate: start, endDate: end });
  }, [customStart, customEnd]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // ── Drill-down drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<DrawerType | null>(null);
  const [drawerEmployee, setDrawerEmployee] = useState<ManagementDashboardRow | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState<string | null>(null);
  const [presentRows, setPresentRows] = useState<PresentDetailRow[]>([]);
  const [absentRows, setAbsentRows] = useState<AbsentDetailRow[]>([]);
  const [leaveRows, setLeaveRows] = useState<LeaveDetailRow[]>([]);
  const [permissionRows, setPermissionRows] = useState<PermissionDetailRow[]>([]);
  const [regularizeRows, setRegularizeRows] = useState<RegularizeDetailRow[]>([]);

  // Drawer-local filter/sort/pagination state — shared across panel types
  // since only one drawer is open at a time; all reset on open/close.
  const [drawerSearch, setDrawerSearch] = useState("");
  const [drawerFilterStart, setDrawerFilterStart] = useState("");
  const [drawerFilterEnd, setDrawerFilterEnd] = useState("");
  const [drawerSortKey, setDrawerSortKey] = useState<string | null>(null);
  const [drawerSortDir, setDrawerSortDir] = useState<"asc" | "desc">("asc");
  const [drawerPage, setDrawerPage] = useState(1);
  const [drawerPageSize, setDrawerPageSize] = useState(10);

  // Present-panel-only tabs: All / Late / Geo-Fence / No Violation.
  const [presentTab, setPresentTab] = useState<"All" | "Late" | "GeoFence" | "NoViolation">("All");

  function resetDrawerControls() {
    setDrawerSearch("");
    setDrawerFilterStart("");
    setDrawerFilterEnd("");
    setDrawerSortKey(null);
    setDrawerSortDir("asc");
    setDrawerPage(1);
    setDrawerPageSize(10);
    setPresentTab("All");
  }

  // Each row's own date (or date range, for Leave) used for the drawer's
  // Start Date / End Date filter — independent of how a column formats it.
  function getRowDateRange(type: DrawerType, row: any): [Date, Date] {
    if (type === "leave") return [new Date(row.startDate), new Date(row.endDate)];
    return [new Date(row.date), new Date(row.date)];
  }

  function openDrawer(type: DrawerType, row: ManagementDashboardRow) {
    setDrawerType(type);
    setDrawerEmployee(row);
    setDrawerOpen(true);
    setDrawerError(null);
    setDrawerLoading(true);
    resetDrawerControls();

    const params = { employeeId: row.employeeId, startDate: appliedRange.startDate, endDate: appliedRange.endDate };
    const fetcher =
      type === "present"
        ? getPresentDetails(params).then(setPresentRows)
        : type === "absent"
          ? getAbsentDetails(params).then(setAbsentRows)
          : type === "leave"
            ? getLeaveDetails(params).then(setLeaveRows)
            : type === "permission"
              ? getPermissionDetails(params).then(setPermissionRows)
              : getRegularizeDetails(params).then(setRegularizeRows);

    fetcher
      .catch(() => setDrawerError("Failed to load details. Please try again."))
      .finally(() => setDrawerLoading(false));
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setDrawerType(null);
    setDrawerEmployee(null);
    setDrawerError(null);
    resetDrawerControls();
  }

  function getColumnsFor(type: DrawerType): DrawerColumn[] {
    const employeeName = drawerEmployee?.displayName ?? "";
    switch (type) {
      case "present":
        return [
          { key: "employee", label: "Employee", getText: () => employeeName, sortValue: () => employeeName },
          {
            key: "date",
            label: "Present Date",
            getText: (r: PresentDetailRow) => fmtDateOnly(r.date),
            sortValue: (r: PresentDetailRow) => new Date(r.date).getTime(),
          },
          {
            key: "checkIn",
            label: "Check-in Time",
            getText: (r: PresentDetailRow) => fmtDateTime(r.checkIn),
            sortValue: (r: PresentDetailRow) => (r.checkIn ? new Date(r.checkIn).getTime() : 0),
          },
          {
            key: "checkOut",
            label: "Check-out Time",
            getText: (r: PresentDetailRow) => fmtDateTime(r.checkOut),
            sortValue: (r: PresentDetailRow) => (r.checkOut ? new Date(r.checkOut).getTime() : 0),
          },
          {
            key: "isLate",
            label: "Shift Time - Check-in Time",
            getText: (r: PresentDetailRow) => `${fmtTimeOnly(r.shiftStartTime)} - ${fmtTimeOnly(r.checkIn)} (${r.isLate})`,
            sortValue: (r: PresentDetailRow) => r.isLate,
          },
          {
            key: "isGeoFence",
            label: "Assigned Location - Fetched Location",
            getText: (r: PresentDetailRow) =>
              `${r.assignedLocation ?? "—"} - ${r.fetchedLocation ?? "—"} (${r.isGeoFence})`,
            sortValue: (r: PresentDetailRow) => r.isGeoFence,
          },
        ];
      case "absent":
        return [
          { key: "employee", label: "Employee", getText: () => employeeName, sortValue: () => employeeName },
          {
            key: "date",
            label: "Date",
            getText: (r: AbsentDetailRow) => fmtDateOnly(r.date),
            sortValue: (r: AbsentDetailRow) => new Date(r.date).getTime(),
          },
        ];
      case "leave":
        return [
          { key: "employee", label: "Employee", getText: () => employeeName, sortValue: () => employeeName },
          {
            key: "date",
            label: "Date",
            getText: (r: LeaveDetailRow) => `${fmtDateOnly(r.startDate)} - ${fmtDateOnly(r.endDate)}`,
            sortValue: (r: LeaveDetailRow) => new Date(r.startDate).getTime(),
          },
          { key: "reason", label: "Reason / Remarks", getText: (r: LeaveDetailRow) => r.reason ?? "—", sortValue: (r: LeaveDetailRow) => r.reason ?? "" },
          {
            key: "approvedBy",
            label: "Approved By",
            getText: (r: LeaveDetailRow) => r.approvedBy ?? "—",
            sortValue: (r: LeaveDetailRow) => r.approvedBy ?? "",
          },
        ];
      case "permission":
        return [
          { key: "employee", label: "Employee", getText: () => employeeName, sortValue: () => employeeName },
          {
            key: "date",
            label: "Date",
            getText: (r: PermissionDetailRow) => fmtDateOnly(r.date),
            sortValue: (r: PermissionDetailRow) => new Date(r.date).getTime(),
          },
          {
            key: "time",
            label: "Time",
            getText: (r: PermissionDetailRow) => `${fmtTimeOnly(r.startTime)} - ${fmtTimeOnly(r.endTime)}`,
            sortValue: (r: PermissionDetailRow) => r.startTime ?? "",
          },
          {
            key: "reason",
            label: "Reason / Remarks",
            getText: (r: PermissionDetailRow) => r.reason ?? "—",
            sortValue: (r: PermissionDetailRow) => r.reason ?? "",
          },
          {
            key: "approvedBy",
            label: "Approved By",
            getText: (r: PermissionDetailRow) => r.approvedBy ?? "—",
            sortValue: (r: PermissionDetailRow) => r.approvedBy ?? "",
          },
        ];
      case "regularize":
        return [
          { key: "employee", label: "Employee", getText: () => employeeName, sortValue: () => employeeName },
          {
            key: "date",
            label: "Date",
            getText: (r: RegularizeDetailRow) => fmtDateOnly(r.date),
            sortValue: (r: RegularizeDetailRow) => new Date(r.date).getTime(),
          },
          { key: "type", label: "Type", getText: (r: RegularizeDetailRow) => r.type, sortValue: (r: RegularizeDetailRow) => r.type },
          {
            key: "reason",
            label: "Remarks",
            getText: (r: RegularizeDetailRow) => r.reason ?? "—",
            sortValue: (r: RegularizeDetailRow) => r.reason ?? "",
          },
          {
            key: "approvedBy",
            label: "Approved By",
            getText: (r: RegularizeDetailRow) => r.approvedBy ?? "—",
            sortValue: (r: RegularizeDetailRow) => r.approvedBy ?? "",
          },
        ];
    }
  }

  function getRawRowsFor(type: DrawerType): any[] {
    switch (type) {
      case "present":
        return presentRows;
      case "absent":
        return absentRows;
      case "leave":
        return leaveRows;
      case "permission":
        return permissionRows;
      case "regularize":
        return regularizeRows;
    }
  }

  // Search + date filtering only (no tab, no sort) — shared by the full
  // processed-rows pipeline below AND the Present tab counts, so counts always
  // reflect whatever search/date filters are currently active.
  function getSearchDateFiltered(type: DrawerType, columns: DrawerColumn[]): any[] {
    let filtered = getRawRowsFor(type);

    if (drawerSearch.trim()) {
      const term = drawerSearch.trim().toLowerCase();
      filtered = filtered.filter((r) => columns.some((c) => c.getText(r).toLowerCase().includes(term)));
    }

    if (drawerFilterStart || drawerFilterEnd) {
      const filterStart = drawerFilterStart ? new Date(drawerFilterStart + "T00:00:00") : null;
      const filterEnd = drawerFilterEnd ? new Date(drawerFilterEnd + "T23:59:59") : null;
      filtered = filtered.filter((r) => {
        const [rowStart, rowEnd] = getRowDateRange(type, r);
        if (filterStart && rowEnd < filterStart) return false;
        if (filterEnd && rowStart > filterEnd) return false;
        return true;
      });
    }

    return filtered;
  }

  function getPresentTabCounts(columns: DrawerColumn[]) {
    const base: PresentDetailRow[] = getSearchDateFiltered("present", columns);
    return {
      All: base.length,
      Late: base.filter((r) => r.isLate === "Yes").length,
      GeoFence: base.filter((r) => r.isGeoFence === "Yes").length,
      NoViolation: base.filter((r) => r.isLate === "No" && r.isGeoFence === "No").length,
    };
  }

  function getProcessedDrawerRows() {
    if (!drawerType) return { columns: [] as DrawerColumn[], pagedRows: [] as any[], allFilteredRows: [] as any[], totalFiltered: 0 };

    const columns = getColumnsFor(drawerType);
    let filtered = getSearchDateFiltered(drawerType, columns);

    if (drawerType === "present" && presentTab !== "All") {
      filtered = filtered.filter((r: PresentDetailRow) => {
        if (presentTab === "Late") return r.isLate === "Yes";
        if (presentTab === "GeoFence") return r.isGeoFence === "Yes";
        return r.isLate === "No" && r.isGeoFence === "No"; // NoViolation
      });
    }

    let sorted = filtered;
    if (drawerSortKey) {
      const col = columns.find((c) => c.key === drawerSortKey);
      if (col) {
        sorted = [...filtered].sort((a, b) => {
          const cmp = compareValues(col.sortValue(a), col.sortValue(b));
          return drawerSortDir === "asc" ? cmp : -cmp;
        });
      }
    }

    const totalFiltered = sorted.length;
    const startIdx = (drawerPage - 1) * drawerPageSize;
    const pagedRows = sorted.slice(startIdx, startIdx + drawerPageSize);

    return { columns, pagedRows, allFilteredRows: sorted, totalFiltered };
  }

  function handleDrawerSortClick(key: string) {
    if (drawerSortKey === key) {
      setDrawerSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setDrawerSortKey(key);
      setDrawerSortDir("asc");
    }
    setDrawerPage(1);
  }

  function handleDrawerExport() {
    if (!drawerType || !drawerEmployee) return;
    const { columns, allFilteredRows } = getProcessedDrawerRows();
    downloadCSV(`${drawerType}-${drawerEmployee.displayName}.csv`, columns, allFilteredRows);
  }

  // ── Employee attendance calendar drawer — separate from the count drill-down
  // drawer above, opened by clicking the Employee cell instead of a count.
  // Reuses the same AttendanceCalendar component and data sources as the
  // existing Attendance Log page's admin view (getEmployeeCalendar,
  // getHolidaysByYear, getPermissionHistory), so it looks and behaves
  // consistently with that page.
  const [calendarDrawerOpen, setCalendarDrawerOpen] = useState(false);
  const [calendarEmployee, setCalendarEmployee] = useState<ManagementDashboardRow | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [calData, setCalData] = useState<EmployeeCalendarData | null>(null);
  const [calHolidays, setCalHolidays] = useState<Holiday[]>([]);
  const [calPermissions, setCalPermissions] = useState<PermissionRequest[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [calError, setCalError] = useState<string | null>(null);

  function openCalendarDrawer(row: ManagementDashboardRow) {
    setCalendarEmployee(row);
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    setCalendarMonth(d);
    setCalendarDrawerOpen(true);
  }

  function closeCalendarDrawer() {
    setCalendarDrawerOpen(false);
    setCalendarEmployee(null);
    setCalData(null);
    setCalError(null);
  }

  // Fetch the month's attendance + leave data whenever the employee or month changes.
  useEffect(() => {
    if (!calendarDrawerOpen || !calendarEmployee || !currentUser?.userID) return;
    setCalLoading(true);
    setCalError(null);
    getEmployeeCalendar(currentUser.userID, calendarEmployee.employeeId, calendarMonth.getMonth() + 1, calendarMonth.getFullYear())
      .then(setCalData)
      .catch(() => setCalError("Failed to load attendance calendar. Please try again."))
      .finally(() => setCalLoading(false));
  }, [calendarDrawerOpen, calendarEmployee, calendarMonth]);

  // Holidays are fetched per-year (re-fetches only when the visible month crosses a year boundary).
  useEffect(() => {
    if (!calendarDrawerOpen) return;
    getHolidaysByYear(calendarMonth.getFullYear())
      .then((res) => setCalHolidays(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCalHolidays([]));
  }, [calendarDrawerOpen, calendarMonth.getFullYear()]);

  // Permission history is per-employee (not month-scoped by the endpoint itself).
  useEffect(() => {
    if (!calendarDrawerOpen || !calendarEmployee) return;
    getPermissionHistory(calendarEmployee.employeeId)
      .then((data) => setCalPermissions(Array.isArray(data) ? data : []))
      .catch(() => setCalPermissions([]));
  }, [calendarDrawerOpen, calendarEmployee]);

  // Builds the day -> events map AttendanceCalendar expects, mirroring the existing
  // Attendance Log page's admin-view mapper (AttendanceHistory.tsx, getAdminCalendarData).
  function getCalendarEvents(): Record<number, CalendarEvent[]> {
    const data: Record<number, CalendarEvent[]> = {};
    const selMonth = calendarMonth.getMonth();
    const selYear = calendarMonth.getFullYear();

    calHolidays
      .filter((h) => h.HolidayType !== "Optional")
      .forEach((h) => {
        const dStr = h.HolidayDate.includes("T") ? h.HolidayDate.split("T")[0] : h.HolidayDate;
        const [y, m, d] = dStr.split("-").map(Number);
        if (y === selYear && m === selMonth + 1) {
          if (!data[d]) data[d] = [];
          data[d].push({ type: "holiday", title: "Holiday", subtitle: h.HolidayName, color: "#eff6ff", textColor: "#2563eb" });
        }
      });

    (calData?.leaves ?? []).forEach((leave) => {
      if (!leave.leaveStartDate || !leave.leaveEndDate) return;
      const startStr = leave.leaveStartDate.includes("T") ? leave.leaveStartDate.split("T")[0] : leave.leaveStartDate;
      const endStr = leave.leaveEndDate.includes("T") ? leave.leaveEndDate.split("T")[0] : leave.leaveEndDate;
      const start = new Date(startStr + "T00:00:00");
      const end = new Date(endStr + "T00:00:00");
      const curr = new Date(start);
      while (curr <= end) {
        if (curr.getMonth() === selMonth && curr.getFullYear() === selYear) {
          const d = curr.getDate();
          if (!data[d]) data[d] = [];
          data[d].push({
            type: "leave",
            title: displayLeaveLabel(leave.leaveTypeName) || "Leave",
            subtitle: leave.approvalStatus,
            color: leave.approvalStatus === "Approved" ? "#f5f3ff" : "#f0fdfa",
            textColor: leave.approvalStatus === "Approved" ? "#7c3aed" : "#0d9488",
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    });

    (calData?.attendance ?? []).forEach((rec) => {
      if (!rec.date) return;
      const dateKey = rec.date.includes("T") ? rec.date.split("T")[0] : rec.date;
      const [y, m, d] = dateKey.split("-").map(Number);
      if (y !== selYear || m !== selMonth + 1) return;
      if (!data[d]) data[d] = [];
      if (rec.checkIn) {
        const isLate = rec.violationType === "Late" || rec.violationType === "Both";
        const isEarly = rec.violationType === "Early";
        data[d].push({
          type: "attendance",
          title: "Check-in",
          subtitle: fmtTimeOnly(rec.checkIn),
          color: isEarly ? "#e0f2fe" : isLate ? "#fffbeb" : "#ecfdf5",
          textColor: isEarly ? "#0284c7" : isLate ? "#d97706" : "#059669",
        });
        if (rec.checkOut) {
          data[d].push({ type: "attendance", title: "Check-out", subtitle: fmtTimeOnly(rec.checkOut), color: "#ecfdf5", textColor: "#059669" });
        }
      } else if (rec.attendanceStatus === "ABSENT") {
        data[d].push({ type: "absent", title: "Absent", subtitle: "No record", color: "#fff1f2", textColor: "#e11d48" });
      }
    });

    calPermissions
      .filter((p) => p.ApprovalStatus === "Approved")
      .forEach((p) => {
        const pDate = new Date(p.Date);
        if (pDate.getFullYear() !== selYear || pDate.getMonth() + 1 !== selMonth + 1) return;
        const d = pDate.getDate();
        if (!data[d]) data[d] = [];
        data[d].push({
          type: "attendance",
          title: "Permission",
          subtitle: `${fmtTimeOnly(p.StartTime)} - ${fmtTimeOnly(p.EndTime)}`,
          color: "#e0f2fe",
          textColor: "#0284c7",
        });
      });

    return data;
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerBanner}>
        <Text className={styles.pageTitle}>Management Dashboard</Text>
        <div className={styles.headerBannerDate}>
          <CalendarLtr20Regular />
          {formatDisplayDate(appliedRange.startDate)} → {formatDisplayDate(appliedRange.endDate)}
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Date Range</span>
          <select
            className={styles.selectBox}
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value as DatePreset)}
          >
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="thisQuarter">This Quarter</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {preset !== "custom" ? (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Selected Period</span>
            <div className={styles.dateDisplay}>
              <CalendarLtr20Regular style={{ color: "#6b7280" }} />
              {formatDisplayDate(appliedRange.startDate)} → {formatDisplayDate(appliedRange.endDate)}
            </div>
          </div>
        ) : (
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Custom Date Range</span>
            <div className={styles.customDateRow}>
              <input
                max={new Date().toISOString().split("T")[0]}
                type="date"
                className={styles.dateInput}
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <span style={{ color: "#6b7280", fontSize: "13px" }}>→</span>
              <input
                max={new Date().toISOString().split("T")[0]}
                min={customStart ? new Date(customStart).toISOString().split("T")[0] : undefined}
                type="date"
                className={styles.dateInput}
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Department</span>
          <select
            className={styles.selectBox}
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="All">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Search</span>
          <SearchBox
            placeholder="Search by name or email…"
            value={searchTerm}
            onChange={(_, data) => setSearchTerm(data.value)}
            style={{ minWidth: "220px" }}
          />
        </div>
      </div>

      {/* Table */}
      <div className={styles.content}>
        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}

        <div className={styles.tableCard}>
          <div className={styles.tableCardHead}>
            <Text weight="semibold">Employees ({total})</Text>
            <span className={styles.sortLabel}>
              Sorted by {SORT_FIELD_LABELS[sortBy]} ({sortDir}) <span className={styles.sortLabelIcon}>⇅</span>
            </span>
          </div>

          {loading ? (
            <div className={styles.spinnerWrap}>
              <Spinner label="Loading report…" />
            </div>
          ) : rows.length === 0 ? (
            <div className={styles.emptyState}>No employees found for the selected filters.</div>
          ) : (
            <div className={styles.tableScroll}>
              <Table aria-label="Management dashboard attendance report" className={styles.table}>
                <TableHeader>
                  <TableRow className={styles.headerRow}>
                    {(
                      [
                        { field: "displayName", label: "Employee", center: false },
                        { field: "expectedDays", label: "Total Working Days", center: true },
                        { field: "presentDays", label: "Present", center: true },
                        { field: "absentDays", label: "Absent", center: true },
                        { field: "leaveDays", label: "Leave", center: true },
                        { field: "permissionDays", label: "Permission", center: true },
                        { field: "regularizeDays", label: "Regularize", center: true },
                        { field: "attendancePct", label: "Overall Attendance %", center: true },
                      ] as { field: ManagementDashboardSortField; label: string; center: boolean }[]
                    ).map((col) => (
                      <TableHeaderCell
                        key={col.field}
                        className={col.center ? styles.headerCellCenterSortable : styles.headerCellSortable}
                        style={{ whiteSpace: "normal" }}
                        onClick={() => handleSortClick(col.field)}
                      >
                        {col.label}
                        <span className={sortBy === col.field ? styles.drawerSortIconActive : styles.drawerSortIcon}>
                          {sortBy === col.field ? (sortDir === "asc" ? "▲" : "▼") : "⇅"}
                        </span>
                      </TableHeaderCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.employeeId} className={styles.bodyRow}>
                      <TableCell>
                        <div className={styles.employeeRow}>
                          <div className={styles.employeeAvatar} style={{ background: avatarColor(row.displayName) }}>
                            {getInitials(row.displayName)}
                          </div>
                          <div className={styles.employeeCell}>
                            <span className={styles.employeeName} title={row.displayName}>
                              {row.displayName}
                            </span>
                            <span className={styles.employeeEmail} title={row.email}>
                              {row.email}
                            </span>
                            <span className={styles.calendarLink} onClick={() => openCalendarDrawer(row)}>
                              <CalendarLtr20Regular style={{ fontSize: "14px" }} />
                              Calendar
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={styles.cellCenter}>
                        <span className={styles.countValue}>{row.expectedDays}</span>
                      </TableCell>
                      <TableCell className={styles.cellCenter}>
                        <span
                          className={
                            row.presentDays === 0
                              ? `${styles.countValue} ${styles.countZero}`
                              : `${styles.countPill} ${styles.pillPresent} ${styles.clickableCount}`
                          }
                          onClick={row.presentDays > 0 ? () => openDrawer("present", row) : undefined}
                        >
                          {row.presentDays}
                        </span>
                      </TableCell>
                      <TableCell className={styles.cellCenter}>
                        <span
                          className={
                            row.absentDays === 0
                              ? `${styles.countValue} ${styles.countZero}`
                              : `${styles.countPill} ${styles.pillAbsent} ${styles.clickableCount}`
                          }
                          onClick={row.absentDays > 0 ? () => openDrawer("absent", row) : undefined}
                        >
                          {row.absentDays}
                        </span>
                      </TableCell>
                      <TableCell className={styles.cellCenter}>
                        <span
                          className={
                            row.leaveDays === 0
                              ? `${styles.countValue} ${styles.countZero}`
                              : `${styles.countPill} ${styles.pillLeave} ${styles.clickableCount}`
                          }
                          onClick={row.leaveDays > 0 ? () => openDrawer("leave", row) : undefined}
                        >
                          {row.leaveDays}
                        </span>
                      </TableCell>
                      <TableCell className={styles.cellCenter}>
                        <span
                          className={
                            row.permissionDays === 0
                              ? `${styles.countValue} ${styles.countZero}`
                              : `${styles.countPill} ${styles.pillPermission} ${styles.clickableCount}`
                          }
                          onClick={row.permissionDays > 0 ? () => openDrawer("permission", row) : undefined}
                        >
                          {row.permissionDays}
                        </span>
                      </TableCell>
                      <TableCell className={styles.cellCenter}>
                        <span
                          className={`${styles.countValue} ${
                            row.regularizeDays === 0 ? styles.countZero : styles.clickableCount
                          }`}
                          onClick={row.regularizeDays > 0 ? () => openDrawer("regularize", row) : undefined}
                        >
                          {row.regularizeDays}
                        </span>
                      </TableCell>
                      <TableCell className={styles.cellCenter}>
                        <div className={styles.pctCell}>
                          <span className={styles.pctDot} style={{ background: attColor(row.attendancePct) }} />
                          <div className={styles.pctBarTrack}>
                            <div
                              className={styles.pctBarFill}
                              style={{ width: `${Math.min(100, row.attendancePct)}%`, background: attColor(row.attendancePct) }}
                            />
                          </div>
                          <span className={styles.pctBadge} style={{ color: attColor(row.attendancePct), background: attBg(row.attendancePct) }}>
                            {row.attendancePct}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && rows.length > 0 && (
            <>
              <div className={styles.tableFooter}>
                <span className={styles.tableFooterText}>
                  Showing {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total} employees
                </span>
                <div className={styles.legend}>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: "#16a34a" }} /> 80%+
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: "#d97706" }} /> 50–79%
                  </span>
                  <span className={styles.legendItem}>
                    <span className={styles.legendDot} style={{ background: "#dc2626" }} /> Below 50%
                  </span>
                </div>
              </div>
              <CustomPagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
                itemsPerPage={pageSize}
                onItemsPerPageChange={setPageSize}
                pageSizeOptions={[10, 20, 50, 100]}
              />
            </>
          )}
        </div>
      </div>

      {/* Drill-down drawer */}
      <OverlayDrawer
        position="end"
        open={drawerOpen}
        onOpenChange={(_, { open }) => !open && closeDrawer()}
        style={{ width: drawerType === "present" ? "90%" : "75%" }}
      >
        <DrawerHeader>
          <DrawerHeaderTitle action={<Button appearance="subtle" aria-label="Close" icon={<DismissRegular />} onClick={closeDrawer} />}>
            {drawerType ? DRAWER_TITLES[drawerType] : ""}
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          {drawerEmployee && (
            <div style={{ marginBottom: "8px", width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className={styles.drawerEmployeeHeader}>
                <span className={styles.drawerEmployeeName}>{drawerEmployee.displayName}</span>
                <span className={styles.drawerEmployeeMeta}>
                  {formatDisplayDate(appliedRange.startDate)} → {formatDisplayDate(appliedRange.endDate)}
                </span>
              </div>
              {drawerType === "present" &&
                (() => {
                  const counts = getPresentTabCounts(getColumnsFor("present"));
                  return (
                    <div className={styles.presentTabs}>
                      {(
                        [
                          { key: "All", label: "All" },
                          { key: "Late", label: "Late" },
                          { key: "GeoFence", label: "Geo-Fence" },
                          { key: "NoViolation", label: "No Violation" },
                        ] as { key: typeof presentTab; label: string }[]
                      ).map((tab) => (
                        <button
                          key={tab.key}
                          className={presentTab === tab.key ? styles.presentTabActive : styles.presentTabInactive}
                          onClick={() => {
                            setPresentTab(tab.key);
                            setDrawerPage(1);
                          }}
                        >
                          {tab.label} ({counts[tab.key]})
                        </button>
                      ))}
                    </div>
                  );
                })()}
            </div>
          )}

          {drawerError && (
            <MessageBar intent="error">
              <MessageBarBody>{drawerError}</MessageBarBody>
            </MessageBar>
          )}

          {drawerLoading ? (
            <div className={styles.drawerSpinnerWrap}>
              <Spinner label="Loading…" />
            </div>
          ) : (
            (() => {
              const { columns, pagedRows, totalFiltered } = getProcessedDrawerRows();
              const totalDrawerPages = Math.max(1, Math.ceil(totalFiltered / drawerPageSize));

              return (
                <>


                  <div className={styles.drawerToolbar}>
                    <div className={styles.drawerToolbarGroup}>
                      <span className={styles.filterLabel}>Search</span>
                      <SearchBox
                        placeholder="Search reason, approver…"
                        value={drawerSearch}
                        onChange={(_, data) => {
                          setDrawerSearch(data.value);
                          setDrawerPage(1);
                        }}
                        style={{ minWidth: "200px" }}
                      />
                    </div>

                    <div className={styles.drawerToolbarGroup}>
                      <span className={styles.filterLabel}>Start Date</span>
                      <input
                        type="date"
                        className={styles.dateInput}
                        value={drawerFilterStart}
                        max={drawerFilterEnd || undefined}
                        onChange={(e) => {
                          setDrawerFilterStart(e.target.value);
                          setDrawerPage(1);
                        }}
                      />
                    </div>
                    <div className={styles.drawerToolbarGroup}>
                      <span className={styles.filterLabel}>End Date</span>
                      <input
                        type="date"
                        className={styles.dateInput}
                        value={drawerFilterEnd}
                        min={drawerFilterStart || undefined}
                        onChange={(e) => {
                          setDrawerFilterEnd(e.target.value);
                          setDrawerPage(1);
                        }}
                      />
                    </div>
                    {(drawerFilterStart || drawerFilterEnd) && (
                      <button
                        className={styles.drawerClearBtn}
                        onClick={() => {
                          setDrawerFilterStart("");
                          setDrawerFilterEnd("");
                          setDrawerPage(1);
                        }}
                      >
                        Clear dates
                      </button>
                    )}

                    <div className={styles.drawerToolbarSpacer} />

                    <button className={styles.drawerExportBtn} onClick={handleDrawerExport} disabled={totalFiltered === 0}>
                      Export CSV
                    </button>
                  </div>

                  <div className={styles.drawerTableCard}>
                    {totalFiltered === 0 ? (
                      <div className={styles.drawerEmptyState}>No records found for the selected filters.</div>
                    ) : (
                      <>
                        <div className={styles.drawerTableWrap}>
                          <Table size="small" className={styles.drawerTable}>
                            <TableHeader>
                              <TableRow className={styles.headerRow}>
                                {columns.map((col) => (
                                  <TableHeaderCell
                                    key={col.key}
                                    className={styles.drawerHeaderCellSortable}
                                    onClick={() => handleDrawerSortClick(col.key)}
                                  >
                                    {col.label}
                                    <span className={drawerSortKey === col.key ? styles.drawerSortIconActive : styles.drawerSortIcon}>
                                      {drawerSortKey === col.key ? (drawerSortDir === "asc" ? "▲" : "▼") : "⇅"}
                                    </span>
                                  </TableHeaderCell>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pagedRows.map((r, i) => (
                                <TableRow key={i} className={styles.bodyRow}>
                                  {columns.map((col) => (
                                    <TableCell key={col.key} className={styles.drawerCellText}>
                                      {col.getText(r)}
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>

                        <CustomPagination
                          currentPage={drawerPage}
                          totalPages={totalDrawerPages}
                          onPageChange={setDrawerPage}
                          itemsPerPage={drawerPageSize}
                          onItemsPerPageChange={(n) => {
                            setDrawerPageSize(n);
                            setDrawerPage(1);
                          }}
                          pageSizeOptions={[10, 20, 50, 100]}
                        />
                      </>
                    )}
                  </div>
                </>
              );
            })()
          )}
        </DrawerBody>
      </OverlayDrawer>

      {/* Employee attendance calendar drawer */}
      <OverlayDrawer
        position="end"
        open={calendarDrawerOpen}
        onOpenChange={(_, { open }) => !open && closeCalendarDrawer()}
        style={{ width: "75%" }}
      >
        <DrawerHeader>
          <DrawerHeaderTitle action={<Button appearance="subtle" aria-label="Close" icon={<DismissRegular />} onClick={closeCalendarDrawer} />}>
            Attendance Calendar
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody style={{ marginBottom: '10px' }}>
          {calError && (
            <MessageBar intent="error">
              <MessageBarBody>{calError}</MessageBarBody>
            </MessageBar>
          )}

          <div style={{ width: '100%', display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
            {calendarEmployee && (
              <div className={styles.drawerEmployeeHeader}>
                <span className={styles.drawerEmployeeName}>{calendarEmployee.displayName}</span>
                <span className={styles.drawerEmployeeMeta}>{calendarEmployee.email}</span>
              </div>
            )}
            <div className={styles.calendarMonthNav}>
              <button className={styles.drawerClearBtn} style={{ padding: "6px" }} onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
                <ChevronLeft24Regular style={{ fontSize: "12px", minHeight: "18px", maxHeight: "18px" }} />
              </button>
              <Text weight="semibold" size={400} style={{ minWidth: "160px", textAlign: "center" }}>
                {calendarMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </Text>
              <button className={styles.drawerClearBtn} style={{ padding: "6px" }} onClick={() => setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
                <ChevronRight24Regular style={{ fontSize: "12px", minHeight: "18px", maxHeight: "18px" }} />
              </button>
            </div>
          </div>

          {calLoading ? (
            <div className={styles.drawerSpinnerWrap}>
              <Spinner label="Loading…" />
            </div>
          ) : (
            <AttendanceCalendar
              month={calendarMonth.getMonth()}
              year={calendarMonth.getFullYear()}
              attendanceData={getCalendarEvents()}
              isCompact
            />
          )}
        </DrawerBody>
      </OverlayDrawer>
    </div>
  );
};

export default ManagementDashboard;
