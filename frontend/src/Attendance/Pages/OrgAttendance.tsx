import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Text, makeStyles, shorthands, tokens, Spinner,
} from "@fluentui/react-components";
import { displayLeaveLabel } from "../Utils/leaveUtils";
import {
  Eye20Regular, ArrowDownload20Regular, ChevronLeft20Regular, ChevronRight20Regular,
  Search20Regular, People20Regular, Clock20Regular, Warning20Regular,
  CalendarCancel20Regular, CalendarCheckmark20Regular, LockClosed20Regular,
  History20Regular,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";
import {
  getOrgAttendance, getAdminReportFilters,
  OrgAttendanceRow, OrgAttendanceCounts, OrgAttendanceStatus,
} from "../Services/AdminAttendanceReportService";

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const useStyles = makeStyles({
  page: {
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    minHeight: "100%",
    "@media (max-width: 640px)": { padding: "12px" },
  },
  // ── Header ────────────────────────────────
  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: "12px",
  },
  // ── Status tab strip ──────────────────────
  tabStrip: {
    display: "flex",
    gap: "0",
    borderBottom: "2px solid #f1f5f9",
    overflowX: "auto",
  },
  tab: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "10px 16px",
    cursor: "pointer",
    background: "none",
    border: "none",
    borderBottom: "2px solid transparent",
    marginBottom: "-2px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#6b7280",
    whiteSpace: "nowrap",
    transition: "all 0.15s ease",
    ":hover": { color: "#007ED5" },
  },
  tabActive: {
    color: "#007ED5",
    fontWeight: "700",
    borderBottomColor: "#007ED5",
  },
  tabCount: {
    fontSize: "11px",
    fontWeight: "600",
    padding: "1px 7px",
    borderRadius: "20px",
    background: "#f3f4f6",
    color: "#6b7280",
    minWidth: "22px",
    textAlign: "center",
  },
  tabCountActive: {
    background: "#EFF6FF",
    color: "#007ED5",
  },
  // ── Filter bar ────────────────────────────
  filterBar: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    alignItems: "center",
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius("12px"),
    ...shorthands.padding("12px", "16px"),
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  searchWrap: {
    position: "relative",
    flex: "1 1 200px",
    minWidth: "180px",
  },
  searchIcon: {
    position: "absolute",
    left: "10px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    paddingLeft: "34px",
    paddingRight: "10px",
    paddingTop: "8px",
    paddingBottom: "8px",
    fontSize: "13px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    outline: "none",
    background: "#f9fafb",
    color: "#111827",
    boxSizing: "border-box",
    ":focus": { borderColor: "#007ED5", background: "#fff" },
  },
  filterSelect: {
    padding: "8px 12px",
    fontSize: "13px",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    background: "#f9fafb",
    color: "#374151",
    cursor: "pointer",
    outline: "none",
    fontWeight: "500",
    ":focus": { borderColor: "#007ED5", background: "#fff" },
  },
  dateInput: {
    padding: "7px 10px",
    fontSize: "13px",
    border: "1.5px solid #007ED5",
    borderRadius: "8px",
    background: "#EFF6FF",
    color: "#1D4ED8",
    cursor: "pointer",
    outline: "none",
    fontWeight: "600",
  },
  exportBtn: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: "600",
    border: "1.5px solid #e5e7eb",
    borderRadius: "8px",
    background: "#fff",
    color: "#374151",
    cursor: "pointer",
    ":hover": { borderColor: "#007ED5", color: "#007ED5" },
  },
  // ── Table ─────────────────────────────────
  tableWrap: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius("14px"),
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  thead: {
    backgroundColor: "#f8fafc",
    borderBottom: "1px solid #f1f5f9",
  },
  th: {
    textAlign: "left" as const,
    padding: "12px 16px",
    fontSize: "11px",
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    whiteSpace: "nowrap" as const,
  },
  tr: {
    borderBottom: "1px solid #f8fafc",
    ":hover": { backgroundColor: "#f9fafb" },
  },
  td: {
    padding: "14px 16px",
    fontSize: "13px",
    color: "#374151",
    verticalAlign: "middle" as const,
  },
  // ── Employee cell ──────────────────────────
  empCell: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "700",
    color: "#fff",
    flexShrink: 0,
  },
  empName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#111827",
  },
  empSub: {
    fontSize: "11px",
    color: "#9ca3af",
    marginTop: "1px",
  },
  // ── Status badge ──────────────────────────
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "4px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap" as const,
  },
  badgeDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
  },
  // ── Pagination ────────────────────────────
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    borderTop: "1px solid #f1f5f9",
    flexWrap: "wrap",
    gap: "8px",
  },
  pageBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "500",
    color: "#374151",
    ":hover": { borderColor: "#007ED5", color: "#007ED5" },
  },
  pageBtnActive: {
    background: "#007ED5",
    color: "#fff",
    borderColor: "#007ED5",
  },
  pageBtnDisabled: {
    opacity: "0.4",
    cursor: "not-allowed",
  },
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const AVATAR_COLORS = ["#6366f1","#0078D4","#16a34a","#ca8a04","#dc2626","#7c3aed","#0891b2","#c026d3"];
function avatarColor(name: string) {
  let n = 0; for (const c of name) n += c.charCodeAt(0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toLocalYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function fmtTime(ts: string | null): string {
  if (!ts) return "—";
  const normalized = ts.replace(/Z$/, "");
  const d = new Date(normalized);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function fmtShiftTime(t: string | null): string {
  if (!t) return "";
  // SQL time columns come as ISO strings, e.g. "1970-01-01T09:30:00.000Z"
  if (t.includes("T")) {
    const normalized = t.replace(/Z$/, "");
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    }
  }
  // Plain "HH:mm:ss" fallback
  const parts = t.split(":");
  if (parts.length < 2) return t;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDuration(mins: number | null): string {
  if (mins === null || mins === undefined) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function locationLabel(row: OrgAttendanceRow): string {
  const type = row.workLocationType;
  if (!type) return "—";
  if (type === "Office") return `Office${row.officeLocation ? " · " + row.officeLocation : ""}`;
  if (type === "WFH" || type === "Remote") return "WFH";
  if (type === "Field" || type === "Customer") return `Customer Site${row.currentLocation ? " · " + row.currentLocation : ""}`;
  return type;
}

// ─────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────
interface StatusConfig { label: string; bg: string; color: string; dot: string; icon: React.ReactNode; }
const STATUS_CFG: Record<string, StatusConfig> = {
  on_time:   { label: "On-time",   bg: "#ecfdf5", color: "#059669", dot: "#10b981", icon: <CalendarCheckmark20Regular style={{ fontSize: 14 }} /> },
  late:      { label: "Late",      bg: "#fff7ed", color: "#ea580c", dot: "#f97316", icon: <Clock20Regular style={{ fontSize: 14 }} /> },
  exception: { label: "Escalated", bg: "#fff7ed", color: "#b45309", dot: "#f59e0b", icon: <Warning20Regular style={{ fontSize: 14 }} /> },
  on_leave:  { label: "On Leave",  bg: "#f0f9ff", color: "#0284c7", dot: "#38bdf8", icon: <People20Regular style={{ fontSize: 14 }} /> },
  absent:    { label: "Absent",    bg: "#fff1f2", color: "#dc2626", dot: "#ef4444", icon: <CalendarCancel20Regular style={{ fontSize: 14 }} /> },
  blocked:   { label: "Blocked",   bg: "#111827", color: "#fff",    dot: "#6b7280", icon: <LockClosed20Regular style={{ fontSize: 14 }} /> },
};

// ─────────────────────────────────────────────
// Tab config
// ─────────────────────────────────────────────
type TabKey = "all" | OrgAttendanceStatus;
const TABS: { key: TabKey; label: string }[] = [
  { key: "all",       label: "All employees" },
  { key: "on_time",   label: "On-time" },
  { key: "late",      label: "Late" },
  { key: "exception", label: "Exception" },
  { key: "on_leave",  label: "On leave" },
  { key: "absent",    label: "Absent" },
  { key: "blocked",   label: "Blocked" },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const PAGE_SIZE = 20;

const OrgAttendance: React.FC = () => {
  const styles = useStyles();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(toLocalYMD(new Date()));
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [rows, setRows] = useState<OrgAttendanceRow[]>([]);
  const [counts, setCounts] = useState<OrgAttendanceCounts>({ all: 0, on_time: 0, late: 0, exception: 0, on_leave: 0, absent: 0, blocked: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Load departments once
  useEffect(() => {
    getAdminReportFilters().then(f => setDepartments(f.departments)).catch(() => {});
  }, []);

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(val); setPage(1); }, 400);
  };

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOrgAttendance({
        date:       selectedDate,
        department: selectedDept || undefined,
        status:     activeTab !== "all" ? activeTab : undefined,
        search:     search || undefined,
        page,
        pageSize:   PAGE_SIZE,
      });
      setRows(res.rows);
      setCounts(res.counts);
      setTotal(res.pagination.total);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, selectedDept, activeTab, search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset page when filters change
  const changeTab  = (t: TabKey) => { setActiveTab(t); setPage(1); };
  const changeDept = (d: string) => { setSelectedDept(d); setPage(1); };
  const changeDate = (d: string) => { setSelectedDate(d); setPage(1); };

  // Export CSV — fetches all records (ignores current page)
  const [exporting, setExporting] = useState(false);
  const exportCSV = async () => {
    setExporting(true);
    try {
      const all = await getOrgAttendance({
        date:       selectedDate,
        department: selectedDept || undefined,
        status:     activeTab !== "all" ? activeTab : undefined,
        search:     search || undefined,
        page:       1,
        pageSize:   5000,
      });
      const headers = ["Name", "Department", "Manager", "Shift", "Status", "Check-in", "Check-out", "Location", "Hours"];
      const dataRows = all.rows.map(r => [
        r.name,
        r.department,
        r.managerName ?? "",
        r.shiftName ?? "",
        STATUS_CFG[r.status]?.label ?? r.status,
        fmtTime(r.checkIn),
        fmtTime(r.checkOut),
        locationLabel(r),
        fmtDuration(r.durationMinutes),
      ]);
      // UTF-8 BOM (\uFEFF) ensures Excel renders special characters correctly
      const csv = "\uFEFF" + [headers, ...dataRows]
        .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `org-attendance-${selectedDate}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent — user will notice the download didn't happen
    } finally {
      setExporting(false);
    }
  };

  // Pagination
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageStart  = (page - 1) * PAGE_SIZE + 1;
  const pageEnd    = Math.min(page * PAGE_SIZE, total);

  function renderPageButtons() {
    const btns: React.ReactNode[] = [];
    const addBtn = (p: number) => (
      <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>{p}</button>
    );
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) btns.push(addBtn(i));
    } else {
      btns.push(addBtn(1));
      if (page > 3) btns.push(<span key="e1" style={{ padding: "0 4px", color: "#9ca3af" }}>…</span>);
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) btns.push(addBtn(i));
      if (page < totalPages - 2) btns.push(<span key="e2" style={{ padding: "0 4px", color: "#9ca3af" }}>…</span>);
      btns.push(addBtn(totalPages));
    }
    return btns;
  }

  return (
    <div className={styles.page}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <Text block size={500} weight="bold" style={{ color: "#004578", letterSpacing: "0.02em" }}>Org Attendance</Text>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Organisation-wide attendance for {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </Text>
        </div>
      </div>

      {/* ── Status Tab Strip ────────────────────────────────────────────── */}
      <div className={styles.tabStrip}>
        {TABS.map(tab => {
          const cnt = tab.key === "all" ? counts.all : counts[tab.key as OrgAttendanceStatus];
          return (
            <button key={tab.key} className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`} onClick={() => changeTab(tab.key)}>
              {tab.label}
              <span className={`${styles.tabCount} ${activeTab === tab.key ? styles.tabCountActive : ""}`}>{cnt ?? 0}</span>
            </button>
          );
        })}
      </div>

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <div className={styles.filterBar}>
        {/* Search */}
        <div className={styles.searchWrap}>
          <Search20Regular className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search employees or department…"
            value={searchInput}
            onChange={e => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Date */}
        <input
          type="date"
          className={styles.dateInput}
          value={selectedDate}
          max={toLocalYMD(new Date())}
          onChange={e => changeDate(e.target.value)}
        />

        {/* Department */}
        <select className={styles.filterSelect} value={selectedDept} onChange={e => changeDept(e.target.value)}>
          <option value="">All departments</option>
          {departments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <div style={{ flex: 1 }} />

        {/* Export CSV */}
        <button className={styles.exportBtn} onClick={exportCSV} disabled={exporting}>
          <ArrowDownload20Regular />
          {exporting ? "Exporting…" : "Export CSV"}
        </button>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <Spinner label="Loading attendance…" />
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#9ca3af", fontSize: "14px" }}>
            No attendance records found for the selected filters.
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Employee</th>
                  <th className={styles.th}>Department</th>
                  <th className={styles.th}>Shift</th>
                  <th className={styles.th}>Status</th>
                  <th className={styles.th}>Location</th>
                  <th className={styles.th}>Hours</th>
                  <th className={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const cfg = STATUS_CFG[row.status] ?? STATUS_CFG.absent;
                  return (
                    <tr key={row.employeeId} className={styles.tr}>
                      {/* Employee */}
                      <td className={styles.td}>
                        <div className={styles.empCell}>
                          <div className={styles.avatar} style={{ background: avatarColor(row.name) }}>
                            {getInitials(row.name)}
                          </div>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <div className={styles.empName}>{row.name}</div>
                              {row.status === "blocked" && (
                                <LockClosed20Regular style={{ color: "#f87171", flexShrink: 0, fontSize: "13px" }} title="App access blocked" />
                              )}
                            </div>
                            <div className={styles.empSub}>
                              {row.managerName ? `Reports to ${row.managerName}` : row.department}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className={styles.td} style={{ color: "#6b7280" }}>{row.department}</td>

                      {/* Shift */}
                      <td className={styles.td}>
                        {row.shiftName ? (
                          <div>
                            <div style={{ fontWeight: 600, color: "#374151" }}>{row.shiftName}</div>
                            {row.shiftStart && row.shiftEnd && (
                              <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                                {fmtShiftTime(row.shiftStart)} – {fmtShiftTime(row.shiftEnd)}
                              </div>
                            )}
                          </div>
                        ) : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>

                      {/* Status */}
                      <td className={styles.td}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
                          <span className={styles.badge} style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                            <span className={styles.badgeDot} style={{ backgroundColor: row.status === "blocked" ? "#6b7280" : cfg.dot }} />
                            {cfg.label}
                            {row.status === "late" && row.violationType && (
                              <span style={{ fontWeight: 400, opacity: 0.8 }}>
                                {/* Late delta shown inline */}
                              </span>
                            )}
                          </span>
                          {row.leaveName && row.status === "on_leave" && (
                            <span style={{ fontSize: "11px", color: "#0284c7" }}>{displayLeaveLabel(row.leaveName)}</span>
                          )}
                          {row.status === "late" && row.checkIn && (
                            <span style={{ fontSize: "11px", color: "#ea580c" }}>In at {fmtTime(row.checkIn)}</span>
                          )}
                        </div>
                      </td>

                      {/* Location */}
                      <td className={styles.td}>
                        {row.workLocationType ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: "5px",
                              padding: "3px 9px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                              backgroundColor:
                                row.workLocationType === "Office" ? "#EFF6FF" :
                                row.workLocationType === "WFH" || row.workLocationType === "Remote" ? "#F0FDF4" : "#FFF7ED",
                              color:
                                row.workLocationType === "Office" ? "#1D4ED8" :
                                row.workLocationType === "WFH" || row.workLocationType === "Remote" ? "#16A34A" : "#EA580C",
                            }}>
                              {row.workLocationType === "Office" ? "Office" : row.workLocationType === "WFH" || row.workLocationType === "Remote" ? "WFH" : "Field"}
                            </span>
                            {(row.officeLocation || row.currentLocation) && (
                              <span style={{ fontSize: "11px", color: "#9ca3af" }}>{row.officeLocation ?? row.currentLocation}</span>
                            )}
                          </div>
                        ) : <span style={{ color: "#d1d5db" }}>—</span>}
                      </td>

                      {/* Hours */}
                      <td className={styles.td}>
                        {row.durationMinutes !== null ? (
                          <div>
                            <span style={{ fontWeight: 700, color: "#111827" }}>{fmtDuration(row.durationMinutes)}</span>
                            {!row.checkOut && row.checkIn && (
                              <div style={{ fontSize: "11px", color: "#6366f1" }}>In progress</div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: row.checkIn ? "#6366f1" : "#d1d5db" }}>
                            {row.checkIn && !row.checkOut ? "In progress" : "0h 0m"}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className={styles.td}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            title="View Attendance Log"
                            onClick={() => navigate("/Attendance/History")}
                            style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
                          >
                            <Eye20Regular />
                          </button>
                          <button
                            title="View history"
                            onClick={() => navigate("/Attendance/History")}
                            style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "8px", width: "32px", height: "32px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
                          >
                            <History20Regular />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination */}
            <div className={styles.pagination}>
              <Text size={200} style={{ color: "#6b7280" }}>
                Showing {pageStart}–{pageEnd} of {total.toLocaleString()} employees
              </Text>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <button
                  className={`${styles.pageBtn} ${page === 1 ? styles.pageBtnDisabled : ""}`}
                  onClick={() => page > 1 && setPage(p => p - 1)}
                  disabled={page === 1}
                >
                  <ChevronLeft20Regular />
                </button>
                {renderPageButtons()}
                <button
                  className={`${styles.pageBtn} ${page === totalPages ? styles.pageBtnDisabled : ""}`}
                  onClick={() => page < totalPages && setPage(p => p + 1)}
                  disabled={page === totalPages}
                >
                  <ChevronRight20Regular />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrgAttendance;
