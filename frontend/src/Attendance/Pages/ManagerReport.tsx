import React, { useEffect, useState } from "react";
import { makeStyles, Text, Spinner, Badge } from "@fluentui/react-components";
import {
    CheckmarkCircle20Filled,
    CalendarLtr20Regular,
    Location20Regular,
    Clock20Regular,
    People20Regular,
    LockClosed20Regular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import {
    getManagerReport,
    getPresetRange, 
    fmtDate,
    formatDisplayDate,
    DatePreset,
    DateRange,
    ManagerReportData,
    EmployeeReportRow,
} from "../Services/ManagerReportService";
import { useNavigate } from "react-router-dom";

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
    page: {
        display: "flex",
        flexDirection: "column",
        gap: "0",
        minHeight: "100%",
    },
    header: {
        padding: "20px 28px 0 28px",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    pageTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#111827",
    },
    // ── Build Your Report card
    builderCard: {
        margin: "20px 28px 0 28px",
        background: "#fff",
        borderRadius: "14px",
        padding: "20px 24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    builderTitle: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#111827",
    },
    builderRow: {
        display: "flex",
        alignItems: "flex-end",
        gap: "20px",
        flexWrap: "wrap",
    },
    filterGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        minWidth: "200px",
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
        minWidth: "200px",
    },
    dateRangeDisplay: {
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
    },
    dateInput: {
        padding: "8px 10px",
        borderRadius: "8px",
        border: "1.5px solid #d1d5db",
        background: "#fff",
        fontSize: "13px",
        color: "#111827",
        cursor: "pointer",
        outline: "none",
    },
    generateBtn: {
        padding: "9px 22px",
        borderRadius: "8px",
        border: "none",
        background: "#0078D4",
        color: "#fff",
        fontSize: "13px",
        fontWeight: "600",
        cursor: "pointer",
        whiteSpace: "nowrap",
        alignSelf: "flex-end",
    },
    // ── Content area
    content: {
        padding: "20px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    previewLabel: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    previewTitle: {
        fontSize: "16px",
        fontWeight: "700",
        color: "#111827",
    },
    previewMeta: {
        fontSize: "12px",
        color: "#6b7280",
    },
    exportRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
    },
    exportBtns: {
        display: "flex",
        gap: "8px",
    },
    exportBtn: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "7px 16px",
        borderRadius: "8px",
        border: "1.5px solid #d1d5db",
        background: "#fff",
        fontSize: "13px",
        color: "#374151",
        cursor: "pointer",
        fontWeight: "500",
    },
    // ── Summary cards
    statsRow: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "14px",
        "@media (max-width: 1100px)": { gridTemplateColumns: "repeat(2, 1fr)" },
        "@media (max-width: 600px)": { gridTemplateColumns: "1fr" },
    },
    statCard: {
        background: "#fff",
        borderRadius: "14px",
        padding: "20px 22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    statTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    statIcon: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    statLabel: { fontSize: "13px", color: "#6b7280" },
    statValue: { fontSize: "28px", fontWeight: "700", color: "#111827", lineHeight: "1" },
    statMeta: { fontSize: "12px", color: "#6b7280" },
    statMetaGreen: { fontSize: "12px", color: "#16a34a", fontWeight: "500" },
    // ── Table
    tableCard: {
        background: "#fff",
        borderRadius: "14px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        overflow: "hidden",
    },
    tableWrap: { overflowX: "auto" },
    table: {
        width: "100%",
        borderCollapse: "collapse" as const,
    },
    th: {
        padding: "12px 16px",
        textAlign: "left" as const,
        fontSize: "12px",
        fontWeight: "600",
        color: "#6b7280",
        background: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
        whiteSpace: "nowrap",
    },
    td: {
        padding: "14px 16px",
        fontSize: "13px",
        color: "#111827",
        borderBottom: "1px solid #f3f4f6",
        whiteSpace: "nowrap",
    },
    memberCell: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    avatar: {
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "600",
        color: "#fff",
        flexShrink: 0,
    },
    spinnerWrap: {
        display: "flex",
        justifyContent: "center",
        padding: "60px 0",
    },
    errorBanner: {
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "10px",
        padding: "12px 16px",
        fontSize: "13px",
        color: "#dc2626",
    },
    emptyState: {
        textAlign: "center",
        padding: "48px",
        color: "#6b7280",
        fontSize: "14px",
    },
    // ── Analytical split layout
    splitLayout: {
        display: "flex",
        gap: "16px",
        alignItems: "flex-start",
    },
    tableSection: {
        flex: "0 0 100%",
        minWidth: 0,
    },
    chartSection: {
        flex: "1 1 0",
        minWidth: 0,
    },
    chartCard: {
        background: "#fff",
        borderRadius: "14px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        padding: "20px 20px 16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    chartTitle: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#374151",
    },
    chartSubtitle: {
        fontSize: "11px",
        color: "#9ca3af",
    },
    barRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    barLabel: {
        width: "110px",
        fontSize: "11px",
        color: "#374151",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        flexShrink: 0,
    },
    barTrack: {
        flex: 1,
        background: "#f3f4f6",
        borderRadius: "4px",
        height: "18px",
        overflow: "hidden",
    },
    barValue: {
        width: "44px",
        fontSize: "11px",
        fontWeight: "600",
        color: "#374151",
        textAlign: "right",
        flexShrink: 0,
    },
    // ── Pagination
    paginationRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderTop: "1px solid #f3f4f6",
        background: "#fff",
        flexWrap: "wrap",
        gap: "8px",
    },
    pageInfo: {
        fontSize: "12px",
        color: "#6b7280",
    },
    pageControls: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
    },
    pageBtn: {
        padding: "4px 10px",
        borderRadius: "6px",
        border: "1.5px solid #d1d5db",
        background: "#fff",
        fontSize: "12px",
        color: "#374151",
        cursor: "pointer",
    },
    pageBtnActive: {
        padding: "4px 10px",
        borderRadius: "6px",
        border: "1.5px solid #0078D4",
        background: "#0078D4",
        fontSize: "12px",
        color: "#fff",
        cursor: "pointer",
        fontWeight: "600",
    },
    pageSizeRow: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        color: "#6b7280",
    },
    pageSizeSelect: {
        padding: "3px 6px",
        borderRadius: "6px",
        border: "1.5px solid #d1d5db",
        background: "#fff",
        fontSize: "12px",
        color: "#374151",
        cursor: "pointer",
    },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    "#0078D4","#107C10","#D83B01","#8764B8",
    "#038387","#C19C00","#881798","#00B294",
];

function getInitials(name: string): string {
    const p = name.trim().split(/\s+/);
    if (p.length === 1) return p[0][0]?.toUpperCase() ?? "?";
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function formatDuration(minutes: number | null): string {
    if (minutes === null || minutes === undefined || minutes <= 0) return "—";
    const total = Math.round(minutes);
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${h}h ${String(m).padStart(2, "0")}m`;
}

function attendancePctColor(pct: number): { bg: string; color: string } {
    if (pct >= 95) return { bg: "#dcfce7", color: "#16a34a" };
    if (pct >= 80) return { bg: "#fef9c3", color: "#ca8a04" };
    return { bg: "#fee2e2", color: "#dc2626" };
}

const STATUS_FILTERS = ["All", "Active", "Late", "On Leave", "WFH", "Exception"] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

function filterEmployee(row: EmployeeReportRow, status: StatusFilter): boolean {
    if (status === "All") return true;
    if (status === "On Leave") return row.leaveDays > 0;
    if (status === "Late") return row.lateDays > 0;
    if (status === "WFH") return row.wfhDays > 0;
    if (status === "Exception") return row.locationExceptions > 0;
    if (status === "Active") return row.attendancePct >= 95;
    return true;
}

// ─── Component ───────────────────────────────────────────────────────────────

const ManagerReport: React.FC = () => {
    const styles = useStyles();
    const { currentUser } = useAuth();
    const managerId = currentUser?.userID ?? "";
    const navigate = useNavigate()

    // ── Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize]       = useState(10);

    // ── Filter state
    const [preset, setPreset] = useState<DatePreset>("thisMonth");
    const [customStart, setCustomStart] = useState<string>("");
    const [customEnd,   setCustomEnd]   = useState<string>("");
    const [appliedRange, setAppliedRange] = useState<DateRange>(getPresetRange("thisMonth"));
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
    const [departmentFilter, setDepartmentFilter] = useState<string>("All");

    // ── Data state
    const [reportData, setReportData] = useState<ManagerReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);

    // Auto-generate on mount with default range
    useEffect(() => {
        if (managerId) handleGenerate(getPresetRange("thisMonth"));
    }, [managerId]);

    // Recompute range and re-fetch when preset changes (except custom)
    function handlePresetChange(value: DatePreset) {
        setPreset(value);
        if (value !== "custom") {
            const range = getPresetRange(value);
            handleGenerate(range);
        }
    }

    function handleGenerate(rangeOverride?: DateRange) {
        const range = rangeOverride ?? (
            preset === "custom"
                ? { startDate: new Date(customStart + "T00:00:00"), endDate: new Date(customEnd + "T00:00:00") }
                : getPresetRange(preset)
        );
        if (!range.startDate || !range.endDate || isNaN(range.startDate.getTime())) return;
        setAppliedRange(range);
        setCurrentPage(1);
        setDepartmentFilter("All");
        setLoading(true);
        setError(null);
        setHasGenerated(true);
        getManagerReport(managerId, range.startDate, range.endDate)
            .then(data => setReportData(data))
            .catch(() => setError("Failed to load report data. Please try again."))
            .finally(() => setLoading(false));
    }

    // ── CSV Export
    function exportCSV() {
        if (!allEmployees.length) return;
        const headers = ["Employee","Department","Total no of working days","No of days worked","Leave availed","Attendance %","Avg Hours"];
        const rows = allEmployees.map(e => [
            e.name,
            e.department ?? "",
            e.expectedDays,
            e.daysWorked,
            e.leaveDays,
            `${e.attendancePct.toFixed(1)}%`,
            e.avgDurationMinutes ? formatDuration(e.avgDurationMinutes) : "0h 00m",
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `manager-report-${fmtDate(appliedRange.startDate)}-${fmtDate(appliedRange.endDate)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const summary        = reportData?.summary ?? null;
    const departments    = Array.from(new Set((reportData?.employees ?? []).map(e => e.department ?? "").filter(Boolean))).sort();
    const allEmployees   = (reportData?.employees ?? [])
        .filter(e => filterEmployee(e, statusFilter))
        .filter(e => departmentFilter === "All" || (e.department ?? "") === departmentFilter);
    const totalRows      = allEmployees.length;
    const totalPages     = Math.max(1, Math.ceil(totalRows / pageSize));
    const safePage       = Math.min(currentPage, totalPages);
    const employees      = allEmployees.slice((safePage - 1) * pageSize, safePage * pageSize);

    // Derived summary computed from filtered rows so tiles react to filter changes
    const filteredSummary = summary && allEmployees.length > 0 ? {
        TotalMembers:            allEmployees.length,
        TotalExpectedDays:       allEmployees.reduce((s, e) => s + e.expectedDays, 0),
        TotalPresentDays:        allEmployees.reduce((s, e) => s + e.daysWorked, 0),
        AvgAttendancePct:        (() => { const exp = allEmployees.reduce((s, e) => s + e.expectedDays, 0); const wrk = allEmployees.reduce((s, e) => s + e.daysWorked, 0); return exp > 0 ? (wrk / exp) * 100 : 0; })(),
        TotalLocationExceptions: allEmployees.reduce((s, e) => s + e.locationExceptions, 0),
        WFHDays:                 allEmployees.reduce((s, e) => s + e.wfhDays, 0),
        TotalLateArrivals:       allEmployees.reduce((s, e) => s + e.lateDays, 0),
    } : null;

    const workingDays = filteredSummary ? Math.round(filteredSummary.TotalExpectedDays / Math.max(filteredSummary.TotalMembers, 1)) : 0;
    const totalExpectedRecords = filteredSummary ? filteredSummary.TotalExpectedDays : 0;

    function handlePageSizeChange(val: number) {
        setPageSize(val);
        setCurrentPage(1);
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
          
          
          
            useEffect(()=>{
              const isPermitted = checkPermission("attendance.dashboard.manager_dashboard")
          
              if(isPermitted === false){
                  navigate("/Attendance")
              }
            },[])

    return (
        <div className={styles.page}>

            {/* ── Header ────────────────────────────────────────────── */}
            <div className={styles.header}>
                <Text className={styles.pageTitle}>Team Attendance Report</Text>
            </div>

            {/* ── Build Your Report ────────────────────────────────────── */}
            <div className={styles.builderCard}>
                <Text className={styles.builderTitle}>Build Your Report</Text>

                <div className={styles.builderRow}>
                    {/* Date Range preset */}
                    <div className={styles.filterGroup}>
                        <span className={styles.filterLabel}>Date Range</span>
                        <select
                            className={styles.selectBox}
                            value={preset}
                            onChange={e => handlePresetChange(e.target.value as DatePreset)}
                        >
                            <option value="thisWeek">This Week</option>
                            <option value="thisMonth">This Month</option>
                            <option value="thisQuarter">This Quarter</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    {/* Show date range label or custom pickers */}
                    {preset !== "custom" ? (
                        <div className={styles.filterGroup}>
                            <span className={styles.filterLabel}>Selected Period</span>
                            
                            <div className={styles.dateRangeDisplay}>
                                <CalendarLtr20Regular style={{ color: "#6b7280" }} />
                                {formatDisplayDate(appliedRange.startDate)} → {formatDisplayDate(appliedRange.endDate)}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.filterGroup}>
                            <span className={styles.filterLabel}>Custom Date Range</span>
                            <div className={styles.customDateRow}>
                                <input
                                    type="date"
                                    className={styles.dateInput}
                                    value={customStart}
                                    onChange={e => setCustomStart(e.target.value)}
                                />
                                <span style={{ color: "#6b7280", fontSize: "13px" }}>→</span>
                                <input
                                    type="date"
                                    className={styles.dateInput}
                                    value={customEnd}
                                    onChange={e => setCustomEnd(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Status Filter */}
                    <div className={styles.filterGroup}>
                        <span className={styles.filterLabel}>Status Filter</span>
                        <select
                            className={styles.selectBox}
                            value={statusFilter}
                            onChange={e => { setStatusFilter(e.target.value as StatusFilter); setCurrentPage(1); }}
                        >
                            {STATUS_FILTERS.map(s => (
                                <option key={s} value={s}>{s === "All" ? "All status" : s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Department Filter */}
                    <div className={styles.filterGroup}>
                        <span className={styles.filterLabel}>Department</span>
                        <select
                            className={styles.selectBox}
                            value={departmentFilter}
                            onChange={e => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
                            disabled={departments.length<2}
                        >
                            <option value="All">All departments</option>
                            {departments.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                    </div>

                    {/* Generate button — only needed for custom date range */}
                    {preset === "custom" && (
                        <button className={styles.generateBtn} onClick={() => handleGenerate()}>
                            Generate report
                        </button>
                    )}
                </div>
            </div>

            {/* ── Content ───────────────────────────────────────────── */}
            <div className={styles.content}>

                {error && <div className={styles.errorBanner}>{error}</div>}

                {loading ? (
                    <div className={styles.spinnerWrap}><Spinner label="Generating report…" /></div>
                ) : hasGenerated && reportData ? (
                    <>
                        {/* Preview header */}
                        <div className={styles.exportRow}>
                            <div className={styles.previewLabel}>
                                <Text className={styles.previewTitle}>
                                    Report Review  {/* · {formatDisplayDate(appliedRange.startDate)} – {formatDisplayDate(appliedRange.endDate)} */}
                                </Text>
                                {/* {filteredSummary && (
                                    <Text className={styles.previewMeta}>
                                        {filteredSummary.TotalMembers} team member{filteredSummary.TotalMembers !== 1 ? "s" : ""} · {workingDays} working days · {totalExpectedRecords} expected day-records
                                    </Text>
                                )} */}
                            </div>
                            <div className={styles.exportBtns}>
                                <button className={styles.exportBtn} onClick={exportCSV}>
                                    Export CSV
                                </button>
                            </div>
                        </div>

                        {/* Summary cards */}
                        {filteredSummary && (
                            <div className={styles.statsRow}>
                                {/* Avg Attendance */}
                                <div className={styles.statCard}>
                                    <div className={styles.statTop}>
                                        <Text className={styles.statLabel}>Avg attendance</Text>
                                        <div className={styles.statIcon} style={{ background: "#dcfce7" }}>
                                            <CheckmarkCircle20Filled style={{ color: "#16a34a" }} />
                                        </div>
                                    </div>
                                    <Text className={styles.statValue}>{filteredSummary.AvgAttendancePct.toFixed(1)}%</Text>
                                    <Text className={styles.statMeta}>
                                        {filteredSummary.TotalPresentDays} of {filteredSummary.TotalExpectedDays} expected days
                                    </Text>
                                </div>

                                {/* Total Resources */}
                                <div className={styles.statCard}>
                                    <div className={styles.statTop}>
                                        <Text className={styles.statLabel}>Total resources</Text>
                                        <div className={styles.statIcon} style={{ background: "#dbeafe" }}>
                                            <People20Regular style={{ color: "#1d4ed8" }} />
                                        </div>
                                    </div>
                                    <Text className={styles.statValue}>{filteredSummary.TotalMembers}</Text>
                                    {/* <Text className={styles.statMeta}>Team members in this period</Text> */}
                                </div>

                                {/* Location Exceptions */}
                                <div className={styles.statCard}>
                                    <div className={styles.statTop}>
                                        <Text className={styles.statLabel}>Location exceptions</Text>
                                        <div className={styles.statIcon} style={{ background: "#ede9fe" }}>
                                            <Location20Regular style={{ color: "#7c3aed" }} />
                                        </div>
                                    </div>
                                    <Text className={styles.statValue}>{filteredSummary.TotalLocationExceptions}</Text>
                                    <Text className={styles.statMeta}>
                                        {filteredSummary.WFHDays > 0 && `WFH - ${filteredSummary.WFHDays}`}
                                    </Text>
                                </div>

                                {/* Late Arrivals */}
                                <div className={styles.statCard}>
                                    <div className={styles.statTop}>
                                        <Text className={styles.statLabel}>Late arrivals</Text>
                                        <div className={styles.statIcon} style={{ background: "#fee2e2" }}>
                                            <Clock20Regular style={{ color: "#dc2626" }} />
                                        </div>
                                    </div>
                                    <Text className={styles.statValue}>{filteredSummary.TotalLateArrivals}</Text>
                                </div>
                            </div>
                        )}

                        {/* ── 60/40 split: Table + Analytical chart */}
                        <div className={styles.splitLayout}>

                            {/* ── 60% Table with pagination */}
                            <div className={styles.tableSection}>
                                <div className={styles.tableCard}>
                                    <div className={styles.tableWrap}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th className={styles.th}>Employee</th>
                                                    <th className={styles.th}>Department</th>
                                                    <th className={styles.th}>Days worked</th>
                                                    <th className={styles.th}>Leave</th>
                                                    <th className={styles.th}>Late</th>
                                                    <th className={styles.th}>WFH</th>
                                                    <th className={styles.th}>Attendance %</th>
                                                    <th className={styles.th}>Avg hours</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {employees.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={8} className={styles.td} style={{ textAlign: "center", color: "#6b7280" }}>
                                                            No employees match the selected filter.
                                                        </td>
                                                    </tr>
                                                ) : employees.map(emp => {
                                                    const pctStyle = attendancePctColor(emp.attendancePct);
                                                    return (
                                                        <tr key={emp.employeeId}>
                                                            <td className={styles.td}>
                                                                <div className={styles.memberCell}>
                                                                    <div className={styles.avatar} style={{ background: getAvatarColor(emp.name) }}>
                                                                        {getInitials(emp.name)}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: "500" }}>
                                                                            {emp.name}
                                                                            {emp.accountEnabled === false && (
                                                                                <LockClosed20Regular style={{ color: "#f87171", flexShrink: 0, fontSize: "13px" }} title="App access blocked" />
                                                                            )}
                                                                        </div>
                                                                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>{emp.department ?? ""}</div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className={styles.td}>{emp.department ?? "—"}</td>
                                                            <td className={styles.td}>{emp.daysWorked}</td>
                                                            <td className={styles.td}>{emp.leaveDays}</td>
                                                            <td className={styles.td}>{emp.lateDays}</td>
                                                            <td className={styles.td}>{emp.wfhDays}</td>
                                                            <td className={styles.td}>
                                                                <Badge
                                                                    appearance="filled"
                                                                    size="medium"
                                                                    style={{
                                                                        background: pctStyle.bg,
                                                                        color: pctStyle.color,
                                                                        fontWeight: "600",
                                                                        fontSize: "12px",
                                                                        padding: "2px 10px",
                                                                        borderRadius: "20px",
                                                                    }}
                                                                >
                                                                    {emp.attendancePct.toFixed(1)}%
                                                                </Badge>
                                                            </td>
                                                            <td className={styles.td}>{formatDuration(emp.avgDurationMinutes)}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination footer */}
                                    <div className={styles.paginationRow}>
                                        <div className={styles.pageSizeRow}>
                                            Rows per page:
                                            <select
                                                className={styles.pageSizeSelect}
                                                value={pageSize}
                                                onChange={e => handlePageSizeChange(Number(e.target.value))}
                                            >
                                                {[10, 20, 50, 100].map(n => (
                                                    <option key={n} value={n}>{n}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <span className={styles.pageInfo}>
                                            {totalRows === 0 ? "0 records" : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, totalRows)} of ${totalRows}`}
                                        </span>
                                        <div className={styles.pageControls}>
                                            <button
                                                className={styles.pageBtn}
                                                disabled={safePage === 1}
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                style={{ opacity: safePage === 1 ? 0.4 : 1 }}
                                            >‹ Prev</button>
                                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                                const start = Math.max(1, Math.min(safePage - 2, totalPages - 4));
                                                const page  = start + i;
                                                return (
                                                    <button
                                                        key={page}
                                                        className={page === safePage ? styles.pageBtnActive : styles.pageBtn}
                                                        onClick={() => setCurrentPage(page)}
                                                    >{page}</button>
                                                );
                                            })}
                                            <button
                                                className={styles.pageBtn}
                                                disabled={safePage === totalPages}
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                style={{ opacity: safePage === totalPages ? 0.4 : 1 }}
                                            >Next ›</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── 40% Analytical chart */}
                            {/*<div className={styles.chartSection}>
                                <div className={styles.chartCard}>
                                    <Text className={styles.chartTitle}>Attendance % — Current Page</Text>
                                    <Text className={styles.chartSubtitle}>Horizontal bar chart · colour coded by threshold</Text>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "6px" }}>
                                        {employees.length === 0 ? (
                                            <span style={{ fontSize: "13px", color: "#9ca3af" }}>No data to display.</span>
                                        ) : employees.map(emp => {
                                            const pct = Math.min(emp.attendancePct, 100);
                                            const clr = pct >= 95 ? "#16a34a" : pct >= 80 ? "#ca8a04" : "#dc2626";
                                            const bg  = pct >= 95 ? "#dcfce7" : pct >= 80 ? "#fef9c3" : "#fee2e2";
                                            return (
                                                <div key={emp.employeeId} className={styles.barRow}>
                                                    <span className={styles.barLabel} title={emp.name}>
                                                        {emp.name.split(" ")[0]}
                                                    </span>
                                                    <div className={styles.barTrack}>
                                                        <div style={{
                                                            width: `${pct}%`,
                                                            background: clr,
                                                            height: "100%",
                                                            borderRadius: "4px",
                                                            transition: "width 0.4s ease",
                                                        }} />
                                                    </div>
                                                    <span className={styles.barValue} style={{ color: clr }}>{pct.toFixed(1)}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div style={{ display: "flex", gap: "16px", marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #f3f4f6" }}>
                                        {[
                                            { label: "≥ 95%", color: "#16a34a", bg: "#dcfce7" },
                                            { label: "80–94%", color: "#ca8a04", bg: "#fef9c3" },
                                            { label: "< 80%", color: "#dc2626", bg: "#fee2e2" },
                                        ].map(l => (
                                            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: l.color }} />
                                                <span style={{ fontSize: "11px", color: "#6b7280" }}>{l.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div> */}  

                        </div>
                    </>
                ) : !hasGenerated ? null : (
                    <div className={styles.emptyState}>No data found for the selected period.</div>
                )}
            </div>
        </div>
    );
};

export default ManagerReport;
