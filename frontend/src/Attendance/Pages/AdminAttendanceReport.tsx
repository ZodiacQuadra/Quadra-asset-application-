import React, { useEffect, useRef, useState } from "react";
import { makeStyles, Text, Spinner } from "@fluentui/react-components";
import { displayLeaveLabel } from "../Utils/leaveUtils";
import {
    CalendarLtr20Regular,
    Clock20Regular,
    Location20Regular,
    ShieldTask20Regular,
    DocumentBulletListRegular,
    Mail20Regular,
    CheckmarkCircle20Regular,
    DismissCircle20Regular,
    Dismiss20Regular,
    ChevronLeft20Regular,
    ChevronRight20Regular,
    ArrowDownload20Regular,
    ArrowUpload20Regular,
} from "@fluentui/react-icons";
import {
    getAdminDashboardSummary,
    shareAdminReport,
    exportAdminReport,
    getAdminRequestDetails,
    getPresetRange,
    formatDisplayDate,
    DatePreset,
    DateRange,
    AdminDashboardSummaryData,
    StatusCounts,
    DepartmentStat,
    EmployeeStat,
    RequestType,
} from "../Services/AdminAttendanceReportService";
import AttendanceBulkUploadDialog from "../Components/AdminDashboard/AdminBulkupload";
import { useAuth } from "../../Auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import RegularizeBulkUploadDialog from "../Components/AdminDashboard/ReguarizeBulkUpload";

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
        backgroundColor: "transparent",
        // borderBottom: "1px solid #e5e7eb",
        "@media (max-width: 768px)": {
            padding: "14px 16px 12px 16px",
        },
    },
    pageTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#111827",
    },
    // ── Filter card
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
    dateInput: {
        padding: "8px 10px",
        borderRadius: "8px",
        border: "1.5px solid #d1d5db",
        background: "#fff",
        fontSize: "13px",
        color: "#111827",
        outline: "none",
        maxWidth: "100%",
        boxSizing: "border-box",
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
    // ── Content
    content: {
        padding: "20px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        "@media (max-width: 768px)": {
            padding: "12px 12px",
            gap: "14px",
        },
    },
    periodLabel: {
        fontSize: "13px",
        color: "#6b7280",
        fontWeight: "500",
    },
    // ── Total employees card
    totalCard: {
        background: "linear-gradient(135deg, #0078D4 0%, #005a9e 100%)",
        borderRadius: "16px",
        padding: "24px 28px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
        boxShadow: "0 4px 12px rgba(0,120,212,0.25)",
        flexShrink: 0,
        "@media (max-width: 768px)": {
            padding: "18px 20px",
            width: "100%",
            boxSizing: "border-box",
        },
    },
    totalIconWrap: {
        width: "56px",
        height: "56px",
        borderRadius: "14px",
        background: "rgba(255,255,255,0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    totalInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    totalLabel: {
        fontSize: "13px",
        color: "rgba(255,255,255,0.8)",
        fontWeight: "500",
    },
    totalValue: {
        fontSize: "40px",
        fontWeight: "800",
        color: "#fff",
        lineHeight: "1",
    },
    totalSub: {
        fontSize: "12px",
        color: "rgba(255,255,255,0.65)",
    },
    // ── Request cards grid
    cardsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: "16px",
        flex: 1,
        "@media (max-width: 1100px)": { gridTemplateColumns: "repeat(2, 1fr)" },
        "@media (max-width: 768px)": { gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" },
        "@media (max-width: 480px)": { gridTemplateColumns: "1fr" },
    },
    // ── Individual request card
    reqCard: {
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    reqCardHeader: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "14px 18px 12px 18px",
        borderBottom: "1px solid #f3f4f6",
    },
    reqCardIcon: {
        width: "30px",
        height: "30px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    reqCardTitle: {
        fontSize: "0.88em",
        fontWeight: "700",
        color: "#111827",
    },
    // ── New body layout: total box + bullet list
    reqCardBody: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "12px 15px",
        flex: 1,
    },
    reqTotalBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f3f4f6",
        borderRadius: "12px",
        minWidth: "72px",
        minHeight: "72px",
        padding: "10px 12px",
        flexShrink: 0,
        gap: "4px",
    },
    reqTotalNum: {
        fontSize: "large",
        fontWeight: "700",
        color: "#374151",
        lineHeight: "1",
    },
    reqTotalLabel: {
        fontSize: "x-small",
        fontWeight: "600",
        color: "#9ca3af",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
    },
    reqBulletList: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        flex: 1,
    },
    reqBulletRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    reqBulletDot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        flexShrink: 0,
    },
    reqBulletText: {
        fontSize: "smaller",
        fontWeight: "500",
        lineHeight: "1",
    },
    // kept for legacy usage, not used in new card
    statusRow: { display: "none" },
    statusBlock: { display: "none" },
    statusCount: { display: "none" },
    statusLabel: { display: "none" },
    statusDot: { display: "none" },
    reqCardTotal: { display: "none" },
    // ── Chart card
    chartCard: {
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        padding: "20px 24px 24px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    chartHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px",
    },
    chartTitle: {
        fontSize: "15px",
        fontWeight: "700",
        color: "#111827",
    },
    chartLegend: {
        display: "flex",
        gap: "16px",
    },
    legendItem: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        color: "#6b7280",
        fontWeight: "500",
    },
    legendDot: {
        width: "12px",
        height: "12px",
        borderRadius: "3px",
    },
    chartWrap: {
        overflowX: "auto",
        overflowY: "hidden",
    },
    // ── Misc
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
    // ── Bottom row: employee panel + chart
    bottomRow: {
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
        "@media (max-width: 900px)": {
            flexDirection: "column",
        },
    },
    // ── Employee panel card
    empCard: {
        background: "#fff",
        borderRadius: "16px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        flex: "0 0 330px",
        overflow: "hidden",
        "@media (max-width: 900px)": {
            flex: "1 1 auto",
            width: "100%",
        },
    },
    empCardHead: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 16px 12px 16px",
        borderBottom: "1px solid #f3f4f6",
        gap: "8px",
    },
    empCardTitle: {
        fontSize: "14px",
        fontWeight: "700",
        color: "#111827",
        flexShrink: 0,
    },
    empPageSelect: {
        fontSize: "12px",
        padding: "4px 8px",
        borderRadius: "6px",
        border: "1.5px solid #d1d5db",
        background: "#fff",
        color: "#374151",
        cursor: "pointer",
        outline: "none",
    },
    empListWrap: {
        overflowY: "auto",
        flex: "1",
    },
    empRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "9px 14px",
        borderBottom: "1px solid #f9fafb",
    },
    empAvatar: {
        width: "34px",
        height: "34px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "700",
        color: "#fff",
        flexShrink: 0,
    },
    empMeta: {
        display: "flex",
        flexDirection: "column",
        gap: "1px",
        flex: "1",
        minWidth: 0,
    },
    empName: {
        fontSize: "13px",
        fontWeight: "500",
        color: "#111827",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    empDeptTag: {
        fontSize: "11px",
        color: "#6b7280",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    empPctSection: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "4px",
        flexShrink: 0,
    },
    empBarTrack: {
        width: "60px",
        height: "5px",
        borderRadius: "3px",
        background: "#e5e7eb",
        overflow: "hidden",
    },
    empBarFill: {
        height: "100%",
        borderRadius: "3px",
    },
    empPctBadge: {
        fontSize: "11px",
        fontWeight: "700",
        padding: "1px 7px",
        borderRadius: "10px",
    },
    empCardFooter: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "9px 14px",
        borderTop: "1px solid #f3f4f6",
        background: "#fafafa",
    },
    empPagerInfo: {
        fontSize: "11px",
        color: "#9ca3af",
    },
    empPagerBtns: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
    },
    empPagerBtn: {
        width: "26px",
        height: "26px",
        borderRadius: "6px",
        border: "1.5px solid #d1d5db",
        background: "#fff",
        fontSize: "15px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#374151",
        padding: "0",
    },
    empPagerNum: {
        fontSize: "12px",
        color: "#374151",
        minWidth: "44px",
        textAlign: "center",
    },
});

// ─── Config ──────────────────────────────────────────────────────────────────

const CARD_CONFIG = [
    {
        key: "leaveRequests" as const,
        title: "Leave Requests",
        icon: CalendarLtr20Regular,
        iconBg: "#fef9c3",
        iconColor: "#ca8a04",
    },
    {
        key: "permissionRequests" as const,
        title: "Permission Requests",
        icon: ShieldTask20Regular,
        iconBg: "#ede9fe",
        iconColor: "#7c3aed",
    },
    {
        key: "regularizeRequests" as const,
        title: "Regularize Requests",
        icon: DocumentBulletListRegular,
        iconBg: "#dcfce7",
        iconColor: "#16a34a",
    },
    {
        key: "lateArrivals" as const,
        title: "Late Arrivals",
        icon: Clock20Regular,
        iconBg: "#fee2e2",
        iconColor: "#dc2626",
    },
    {
        key: "geoFencing" as const,
        title: "Geo-Fencing",
        icon: Location20Regular,
        iconBg: "#dbeafe",
        iconColor: "#1d4ed8",
    },
    
] as const;

// ─── Sub-component: Employee Panel ───────────────────────────────────────────
interface EmployeePanelProps {
    employees: EmployeeStat[];
    styles: ReturnType<typeof useStyles>;
}

const AVATAR_PALETTE = ["#0078D4", "#7c3aed", "#059669", "#d97706", "#e11d48", "#0891b2", "#db2777"];
const avatarColor = (name: string) => AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
const initials = (name: string) => {
    const p = name.trim().split(/\s+/);
    return (p.length >= 2 ? p[0][0] + p[p.length - 1][0] : name.slice(0, 2)).toUpperCase();
};
const attColor = (pct: number) => pct >= 85 ? "#16a34a" : pct >= 65 ? "#d97706" : "#dc2626";
const attBg = (pct: number) => pct >= 85 ? "#f0fdf4" : pct >= 65 ? "#fffbeb" : "#fef2f2";

// Fixed height for ~10 rows (each row ≈ 54px) so list is scrollable
const EMP_LIST_H = 540;

const EmployeePanel: React.FC<EmployeePanelProps> = ({ employees, styles }) => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchedEmployee,setSearchedEmployee] = useState("")
    const [sortByPct, setSortByPct] = useState<"none" | "desc" | "asc">("none");

    // Reset to page 1 whenever the filtered list, search or sort changes
    useEffect(() => { setPage(1); }, [employees, searchedEmployee, sortByPct]);

    const searchFiltered = searchedEmployee.trim()
        ? employees.filter(emp =>
            emp.displayName.toLowerCase().includes(searchedEmployee.toLowerCase()) ||
            emp.department.toLowerCase().includes(searchedEmployee.toLowerCase())
          )
        : employees;

    const filtered = sortByPct === "none"
        ? searchFiltered
        : [...searchFiltered].sort((a, b) =>
            sortByPct === "desc"
                ? b.attendancePct - a.attendancePct
                : a.attendancePct - b.attendancePct
          );

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paged = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

    return (
        <div className={styles.empCard}>
            {/* Header */}
            <div className={styles.empCardHead}>
                <span className={styles.empCardTitle}>
                    Employee Attendance
                    <span style={{ fontSize: "12px", fontWeight: 400, color: "#6b7280", marginLeft: "6px" }}>
                        ({employees.length})
                    </span>
                </span>
                <select
                    className={styles.empPageSelect}
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                >
                    {[10, 20, 50, 100].map(n => (
                        <option key={n} value={n}>{n} / page</option>
                    ))}
                </select>
            </div>


            <div style={{padding:'5px', display:'flex', gap:'6px'}}>
                <input
                    className={styles.empPageSelect}
                    style={{flex:1, cursor:'text'}}
                    type="text"
                    placeholder="Search by name or department…"
                    value={searchedEmployee}
                    onChange={e => setSearchedEmployee(e.target.value)}
                />
                <button
                    className={styles.empPageSelect}
                    style={{
                        cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex',
                        alignItems: 'center', gap: '4px',
                        fontWeight: sortByPct === "none" ? 400 : 600,
                        color: sortByPct === "none" ? "#6b7280" : "#0078D4",
                    }}
                    onClick={() => setSortByPct(prev =>
                        prev === "none" ? "desc" : prev === "desc" ? "asc" : "none"
                    )}
                    title="Toggle sort by attendance %"
                >
                    Attendance %
                    <span style={{ fontSize: '13px' }}>
                        {sortByPct === "desc" ? "↓" : sortByPct === "asc" ? "↑" : "⇅"}
                    </span>
                </button>
            </div>

            {/* Scrollable employee list */}
            <div className={styles.empListWrap} style={{ maxHeight: `${EMP_LIST_H}px` }}>
                {paged.map(emp => (
                    <div key={emp.employeeId} className={styles.empRow}>
                        {/* Avatar */}
                        <div
                            className={styles.empAvatar}
                            style={{ background: avatarColor(emp.displayName) }}
                        >
                            {initials(emp.displayName)}
                        </div>

                        {/* Name + dept */}
                        <div className={styles.empMeta}>
                            <span className={styles.empName}>{emp.displayName}</span>
                            <span className={styles.empDeptTag}>{emp.department}</span>
                        </div>

                        {/* Bar + badge */}
                        <div className={styles.empPctSection}>
                            <div className={styles.empBarTrack}>
                                <div
                                    className={styles.empBarFill}
                                    style={{
                                        width: `${emp.attendancePct}%`,
                                        background: attColor(emp.attendancePct),
                                    }}
                                />
                            </div>
                            <span
                                className={styles.empPctBadge}
                                style={{
                                    color: attColor(emp.attendancePct),
                                    background: attBg(emp.attendancePct),
                                }}
                            >
                                {emp.attendancePct}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination footer */}
            <div className={styles.empCardFooter}>
                <span className={styles.empPagerInfo}>
                    {filtered.length === 0
                        ? "No employees"
                        : `${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} of ${filtered.length}`}
                </span>
                <div className={styles.empPagerBtns}>
                    <button
                        className={styles.empPagerBtn}
                        disabled={safePage <= 1}
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                    >‹</button>
                    <span className={styles.empPagerNum}>{safePage} / {totalPages}</span>
                    <button
                        className={styles.empPagerBtn}
                        disabled={safePage >= totalPages}
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >›</button>
                </div>
            </div>
        </div>
    );
};

// ─── Sub-component: Employee % by Status Card ────────────────────────────────

const STATUS_BARS = [
    { key: "good"     as const, label: "Good",     subLabel: "≥ 75%",   color: "#22c55e" },
    { key: "average"  as const, label: "Average",  subLabel: "50–74%",  color: "#f59e0b" },
    { key: "critical" as const, label: "Critical", subLabel: "< 50%",   color: "#ef4444" },
];

type StatusTierKey = typeof STATUS_BARS[number]["key"];
type TierBreakdown = Record<StatusTierKey, { count: number; pct: number }>;

function computeTierBreakdown(employees: EmployeeStat[]): TierBreakdown {
    const total = employees.length;
    const counts: Record<StatusTierKey, number> = { good: 0, average: 0, critical: 0 };
    for (const emp of employees) {
        if (emp.attendancePct >= 75)      counts.good++;
        else if (emp.attendancePct >= 50) counts.average++;
        else                              counts.critical++;
    }
    const result = {} as TierBreakdown;
    for (const { key } of STATUS_BARS) {
        result[key] = {
            count: counts[key],
            pct: total > 0 ? parseFloat(((counts[key] / total) * 100).toFixed(1)) : 0,
        };
    }
    return result;
}

interface EmployeeStatusCardProps {
    employees: EmployeeStat[];
    periodLabel: string;
}

// Zone definitions ordered Critical → Average → Good (left to right on the progress bar)
const PERF_ZONES = [
    { key: "critical" as const, label: "Critical", range: "< 50%",  color: "#ef4444", bgColor: "#fef2f2", from: 0,  to: 50,  widthPct: 50 },
    { key: "average"  as const, label: "Average",  range: "50–74%", color: "#f59e0b", bgColor: "#fffbeb", from: 50, to: 75,  widthPct: 25 },
    { key: "good"     as const, label: "Good",     range: "≥ 75%",  color: "#22c55e", bgColor: "#f0fdf4", from: 75, to: 100, widthPct: 25 },
];

const EmployeeStatusCard: React.FC<EmployeeStatusCardProps> = ({ employees, periodLabel }) => {
    const breakdown = computeTierBreakdown(employees);
    const total = employees.length;

    const avgPct = total > 0
        ? parseFloat((employees.reduce((sum, e) => sum + e.attendancePct, 0) / total).toFixed(1))
        : 0;

    const avgZone = avgPct >= 75 ? PERF_ZONES[2] : avgPct >= 50 ? PERF_ZONES[1] : PERF_ZONES[0];

    return (
        <div style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            width: "100%",
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>
                    Attendance Performance
                </span>
                <span style={{ fontSize: "12px", color: "#9ca3af", fontWeight: "500" }}>
                    {periodLabel}
                </span>
            </div>

            {/* Overall average badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: avgZone.bgColor,
                    border: `2px solid ${avgZone.color}40`,
                    borderRadius: "14px",
                    padding: "10px 18px",
                    minWidth: "88px",
                }}>
                    <span style={{ fontSize: "30px", fontWeight: "800", color: avgZone.color, lineHeight: 1 }}>
                        {avgPct}%
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: "600", color: avgZone.color, marginTop: "3px" }}>
                        {avgZone.label}
                    </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                        Overall Average Attendance
                    </span>
                    <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                        {total} employee{total !== 1 ? "s" : ""} · based on applied filters
                    </span>
                </div>
            </div>

            {/* Segmented progress bar with needle */}
            <div>
                {/* Zone bar */}
                <div style={{ position: "relative" }}>
                    <div style={{
                        display: "flex",
                        height: "22px",
                        borderRadius: "11px",
                        overflow: "hidden",
                        background: "#f1f5f9",
                    }}>
                        {PERF_ZONES.map(z => (
                            <div
                                key={z.key}
                                style={{
                                    width: `${z.widthPct}%`,
                                    height: "100%",
                                    background: z.color,
                                    opacity: 0.22,
                                }}
                            />
                        ))}
                    </div>

                    {/* Filled progress overlay up to avg */}
                    <div style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        height: "22px",
                        width: `${avgPct}%`,
                        borderRadius: "11px",
                        background: `linear-gradient(90deg, #ef4444 0%, #ef4444 ${(50 / Math.max(avgPct, 0.1)) * 100}%, #f59e0b ${(50 / Math.max(avgPct, 0.1)) * 100}%, #f59e0b ${(75 / Math.max(avgPct, 0.1)) * 100}%, #22c55e ${(75 / Math.max(avgPct, 0.1)) * 100}%)`,
                        opacity: 0.75,
                        transition: "width 0.7s ease",
                        overflow: "hidden",
                    }} />

                    {/* Needle/indicator */}
                    {total > 0 && (
                        <div style={{
                            position: "absolute",
                            top: "-4px",
                            left: `calc(${avgPct}% - 3px)`,
                            width: "6px",
                            height: "30px",
                            background: avgZone.color,
                            borderRadius: "3px",
                            boxShadow: `0 0 0 2px #fff, 0 0 0 4px ${avgZone.color}60`,
                            transition: "left 0.7s ease",
                        }} />
                    )}
                </div>

                {/* X-axis zone labels */}
                <div style={{ display: "flex", marginTop: "10px" }}>
                    {PERF_ZONES.map(z => (
                        <div
                            key={z.key}
                            style={{
                                width: `${z.widthPct}%`,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "1px",
                            }}
                        >
                            <span style={{ fontSize: "11px", fontWeight: "700", color: z.color }}>
                                {z.label}
                            </span>
                            <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                                {z.range}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tier summary cards
            <div style={{ display: "flex", gap: "10px" }}>
                {PERF_ZONES.map(z => {
                    const entry = breakdown[z.key];
                    const isActive = z.key === avgZone.key;
                    return (
                        <div
                            key={z.key}
                            style={{
                                flex: 1,
                                background: z.bgColor,
                                border: `1.5px solid ${isActive ? z.color : z.color + "30"}`,
                                borderRadius: "12px",
                                padding: "10px 12px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "2px",
                            }}
                        >
                            <span style={{ fontSize: "20px", fontWeight: "800", color: z.color, lineHeight: 1 }}>
                                {entry?.count ?? 0}
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#374151" }}>
                                {z.label}
                            </span>
                            <span style={{ fontSize: "10px", color: "#9ca3af" }}>
                                {(entry?.pct ?? 0).toFixed(1)}% of team
                            </span>
                        </div>
                    );
                })}
            </div> */}
        </div>
    );
};

// ─── Sub-component: Department Bar Chart ─────────────────────────────────────

interface DeptBarChartProps {
    data: DepartmentStat[];
    styles: ReturnType<typeof useStyles>;
}

const CHART_H = 220;
const AXIS_H = 36;
const AXIS_W = 44;
const PAD_TOP = 16;
const DEPT_PAGE_SIZE = 7;
const INNER_GAP = 5;

const DeptBarChart: React.FC<DeptBarChartProps> = ({ data, styles }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerW, setContainerW] = useState(700);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            setContainerW(entries[0].contentRect.width);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    if (!data.length) return null;

    const totalPages = Math.ceil(data.length / DEPT_PAGE_SIZE);
    const safePage = Math.min(page, totalPages);
    const pageData = data.slice((safePage - 1) * DEPT_PAGE_SIZE, safePage * DEPT_PAGE_SIZE);

    // SVG always fills the full container; bars are centred within the usable area
    const svgTotalW = Math.max(containerW, 300);
    const usableW   = Math.max(svgTotalW - AXIS_W - 8, 200);
    const MAX_BAR_W    = 24;
    const MIN_GROUP_GAP = 24;
    const MAX_GROUP_GAP = 80;
    const idealBarW = Math.floor((usableW / pageData.length - 2 * INNER_GAP - MIN_GROUP_GAP) / 3);
    const BAR_W     = Math.max(8, Math.min(MAX_BAR_W, idealBarW));
    const ACTUAL_GW = 3 * BAR_W + 2 * INNER_GAP;
    const rawGap    = Math.floor((usableW - pageData.length * ACTUAL_GW) / (pageData.length + 1));
    const GROUP_GAP = Math.max(MIN_GROUP_GAP, Math.min(MAX_GROUP_GAP, rawGap));
    const contentW  = pageData.length * (ACTUAL_GW + GROUP_GAP) + GROUP_GAP;
    // Offset so bar groups are centred within the usable width
    const xOffset   = AXIS_W + Math.max(0, Math.floor((usableW - contentW) / 2));

    const svgH = PAD_TOP + CHART_H + AXIS_H;
    const gridLines = [0, 25, 50, 75, 100];

    const TT_W = 178;
    const TT_H = 112;

    return (
        <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
                <span className={styles.chartTitle}>Department-wise Attendance — Present, Absent &amp; Leave %</span>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div className={styles.chartLegend}>
                        <span className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: "#22c55e" }} />
                            Present
                        </span>
                        <span className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: "#ef4444" }} />
                            Absent
                        </span>
                        <span className={styles.legendItem}>
                            <span className={styles.legendDot} style={{ background: "#0078D4" }} />
                            Leave
                        </span>
                    </div>
                    {/* Pagination controls */}
                    {totalPages > 1 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                                disabled={safePage <= 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                style={{
                                    width: 26, height: 26, borderRadius: "6px",
                                    border: "1.5px solid #d1d5db", background: "#fff",
                                    cursor: safePage <= 1 ? "not-allowed" : "pointer",
                                    fontSize: "15px", color: "#374151",
                                    opacity: safePage <= 1 ? 0.4 : 1,
                                    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                                }}
                            >‹</button>
                            <span style={{ fontSize: "12px", color: "#374151", minWidth: 52, textAlign: "center" }}>
                                {safePage} / {totalPages}
                            </span>
                            <button
                                disabled={safePage >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                style={{
                                    width: 26, height: 26, borderRadius: "6px",
                                    border: "1.5px solid #d1d5db", background: "#fff",
                                    cursor: safePage >= totalPages ? "not-allowed" : "pointer",
                                    fontSize: "15px", color: "#374151",
                                    opacity: safePage >= totalPages ? 0.4 : 1,
                                    display: "flex", alignItems: "center", justifyContent: "center", padding: 0,
                                }}
                            >›</button>
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.chartWrap} ref={containerRef}>
                <svg
                    width={svgTotalW}
                    height={svgH}
                    style={{ display: "block", fontFamily: "inherit", overflow: "visible", width: "100%" }}
                >
                    {/* Y-axis grid lines + labels */}
                    {gridLines.map(pct => {
                        const y = PAD_TOP + CHART_H - (pct / 100) * CHART_H;
                        return (
                            <g key={pct}>
                                <line
                                    x1={AXIS_W} y1={y} x2={svgTotalW} y2={y}
                                    stroke={pct === 0 ? "#9ca3af" : "#e5e7eb"}
                                    strokeWidth={pct === 0 ? 1.5 : 1}
                                    strokeDasharray={pct === 0 ? undefined : "4 3"}
                                />
                                <text x={AXIS_W - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
                                    {pct}%
                                </text>
                            </g>
                        );
                    })}

                    {/* ── Bar groups */}
                    {pageData.map((dept, i) => {
                        const groupX = xOffset + GROUP_GAP + i * (ACTUAL_GW + GROUP_GAP);
                        const presentH = Math.max((dept.presentPct / 100) * CHART_H, dept.presentPct > 0 ? 3 : 0);
                        const absentH = Math.max((dept.absentPct / 100) * CHART_H, dept.absentPct > 0 ? 3 : 0);
                        const leavePct = dept.leavePct ?? 0;
                        const leaveH = Math.max((leavePct / 100) * CHART_H, leavePct > 0 ? 3 : 0);
                        const isHov = hoveredIdx === i;

                        // Label fits full group width — truncate only if truly too long
                        const fontSize = Math.max(9, Math.min(11, BAR_W * 0.55));
                        const maxChars = Math.max(6, Math.floor(ACTUAL_GW / (fontSize * 0.58)));
                        const labelText = dept.department.length > maxChars
                            ? dept.department.slice(0, maxChars - 1) + "…"
                            : dept.department;

                        return (
                            <g
                                key={dept.department}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                style={{ cursor: "default" }}
                            >
                                {/* Transparent hover target */}
                                <rect
                                    x={groupX - 4} y={PAD_TOP}
                                    width={ACTUAL_GW + 8} height={CHART_H + AXIS_H}
                                    fill="transparent"
                                />

                                {/* Present bar */}
                                <rect
                                    x={groupX} y={PAD_TOP + CHART_H - presentH}
                                    width={BAR_W} height={presentH}
                                    rx={5} ry={5}
                                    fill={isHov ? "#16a34a" : "#22c55e"}
                                />
                                {presentH >= 18 && (
                                    <text
                                        x={groupX + BAR_W / 2}
                                        y={PAD_TOP + CHART_H - presentH / 2 + 4}
                                        textAnchor="middle" fontSize={9} fontWeight="700" fill="#fff"
                                    >
                                        {dept.presentPct}%
                                    </text>
                                )}

                                {/* Absent bar */}
                                <rect
                                    x={groupX + BAR_W + INNER_GAP} y={PAD_TOP + CHART_H - absentH}
                                    width={BAR_W} height={absentH}
                                    rx={5} ry={5}
                                    fill={isHov ? "#dc2626" : "#ef4444"}
                                />
                                {absentH >= 18 && (
                                    <text
                                        x={groupX + BAR_W + INNER_GAP + BAR_W / 2}
                                        y={PAD_TOP + CHART_H - absentH / 2 + 4}
                                        textAnchor="middle" fontSize={9} fontWeight="700" fill="#fff"
                                    >
                                        {dept.absentPct}%
                                    </text>
                                )}

                                {/* Leave bar */}
                                <rect
                                    x={groupX + 2 * (BAR_W + INNER_GAP)} y={PAD_TOP + CHART_H - leaveH}
                                    width={BAR_W} height={leaveH}
                                    rx={5} ry={5}
                                    fill={isHov ? "#005a9e" : "#0078D4"}
                                />
                                {leaveH >= 18 && (
                                    <text
                                        x={groupX + 2 * (BAR_W + INNER_GAP) + BAR_W / 2}
                                        y={PAD_TOP + CHART_H - leaveH / 2 + 4}
                                        textAnchor="middle" fontSize={9} fontWeight="700" fill="#fff"
                                    >
                                        {leavePct}%
                                    </text>
                                )}

                                {/* Department label — straight, centred, uses full group width */}
                                <text
                                    x={groupX + ACTUAL_GW / 2}
                                    y={PAD_TOP + CHART_H + 20}
                                    textAnchor="middle"
                                    fontSize={fontSize}
                                    fill={isHov ? "#111827" : "#4b5563"}
                                    fontWeight={isHov ? "700" : "400"}
                                >
                                    {labelText}
                                </text>
                            </g>
                        );
                    })}

                    {/* ── Tooltip layer — rendered last so it always appears on top */}
                    {hoveredIdx !== null && (() => {
                        const dept = pageData[hoveredIdx];
                        const svgW = svgTotalW;
                        const groupX = xOffset + GROUP_GAP + hoveredIdx * (ACTUAL_GW + GROUP_GAP);
                        let ttX = groupX + ACTUAL_GW + 12;
                        if (ttX + TT_W > svgW - 4) ttX = groupX - TT_W - 12;
                        if (ttX < AXIS_W) ttX = AXIS_W;
                        const ttY = PAD_TOP + 4;

                        return (
                            <g style={{ pointerEvents: "none" }}>
                                {/* Shadow */}
                                <rect
                                    x={ttX + 3} y={ttY + 3}
                                    width={TT_W} height={TT_H}
                                    rx={8} ry={8} fill="rgba(0,0,0,0.13)"
                                />
                                {/* Box */}
                                <rect
                                    x={ttX} y={ttY}
                                    width={TT_W} height={TT_H}
                                    rx={8} ry={8} fill="#1f2937"
                                />
                                {/* Full dept name */}
                                <text x={ttX + 12} y={ttY + 20} fontSize={12} fontWeight="700" fill="#f9fafb">
                                    {dept.department.length > 24
                                        ? dept.department.slice(0, 23) + "…"
                                        : dept.department}
                                </text>
                                {/* Divider */}
                                <line
                                    x1={ttX + 12} y1={ttY + 28}
                                    x2={ttX + TT_W - 12} y2={ttY + 28}
                                    stroke="rgba(255,255,255,0.12)" strokeWidth={1}
                                />
                                {/* Present */}
                                <rect x={ttX + 12} y={ttY + 36} width={8} height={8} rx={2} fill="#22c55e" />
                                <text x={ttX + 26} y={ttY + 44} fontSize={11} fill="#bbf7d0">
                                    {`Present  ${dept.presentPct}%`}
                                </text>
                                {/* Absent */}
                                <rect x={ttX + 12} y={ttY + 52} width={8} height={8} rx={2} fill="#ef4444" />
                                <text x={ttX + 26} y={ttY + 60} fontSize={11} fill="#fecaca">
                                    {`Absent   ${dept.absentPct}%`}
                                </text>
                                {/* Leave */}
                                <rect x={ttX + 12} y={ttY + 68} width={8} height={8} rx={2} fill="#0078D4" />
                                <text x={ttX + 26} y={ttY + 76} fontSize={11} fill="#bfdbfe">
                                    {`Leave    ${dept.leavePct ?? 0}%`}
                                </text>
                                {/* Footer */}
                                <text x={ttX + 12} y={ttY + 99} fontSize={10} fill="rgba(255,255,255,0.45)">
                                    {`${dept.empCount} employees · ${dept.presentDays} days present`}
                                </text>
                            </g>
                        );
                    })()}
                </svg>
            </div>
        </div>
    );
};

// ─── Request Detail Drawer ────────────────────────────────────────────────────

const CARD_KEY_TO_TYPE: Record<string, RequestType> = {
    leaveRequests:      "leave",
    permissionRequests: "permission",
    lateArrivals:       "late",
    geoFencing:         "geofence",
    regularizeRequests: "regularize",
};

type DrawerStatus = "All" | "Pending" | "Approved" | "Rejected";
const DRAWER_TABS: DrawerStatus[] = ["All", "Pending", "Approved", "Rejected"];
const DRAWER_STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
    Pending:  { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
    Approved: { bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" },
    Rejected: { bg: "#fef2f2", color: "#dc2626", dot: "#ef4444" },
};

const DRAWER_PAGE_SIZE = 15;

function fmtDateStr(d: string | Date | null | undefined): string {
    if (!d) return "—";
    try { return new Date(String(d)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return String(d); }
}

function fmtTimeStr(t: string | null | undefined): string {
    if (!t) return "—";
    const d = new Date(String(t).replace(/Z$/, ""));
    if (isNaN(d.getTime())) return String(t);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

const DRAWER_TH: React.CSSProperties = {
    textAlign: "left", padding: "10px 14px", fontSize: "11px", fontWeight: 700,
    color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em",
    whiteSpace: "nowrap", background: "#f8fafc",
};
const DRAWER_TD: React.CSSProperties = {
    padding: "11px 14px", fontSize: "13px", color: "#374151", verticalAlign: "middle",
};

const DRAWER_AVATAR_PALETTE = ["#0078D4","#7c3aed","#059669","#d97706","#e11d48","#0891b2","#db2777"];
function drawerAvatarColor(name: string) { return DRAWER_AVATAR_PALETTE[name.charCodeAt(0) % DRAWER_AVATAR_PALETTE.length]; }
function drawerInitials(name: string) {
    const p = name.trim().split(/\s+/);
    return (p.length >= 2 ? p[0][0] + p[p.length - 1][0] : name.slice(0, 2)).toUpperCase();
}

function DrawerStatusBadge({ status }: { status: string }) {
    const cfg = DRAWER_STATUS_STYLE[status] ?? { bg: "#f3f4f6", color: "#6b7280", dot: "#9ca3af" };
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 600,
            backgroundColor: cfg.bg, color: cfg.color, whiteSpace: "nowrap",
        }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
            {status || "—"}
        </span>
    );
}

function EmpCell({ name }: { name: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
                width: 30, height: 30, borderRadius: "50%", background: drawerAvatarColor(name),
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 700, color: "#fff", flexShrink: 0,
            }}>
                {drawerInitials(name)}
            </div>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{name}</span>
        </div>
    );
}

interface RequestDetailDrawerProps {
    cardKey: string;
    title: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    appliedRange: DateRange;
    department: string;
    onClose: () => void;
}

const RequestDetailDrawer: React.FC<RequestDetailDrawerProps> = ({
    cardKey, title, icon: Icon, iconBg, iconColor, appliedRange, department, onClose,
}) => {
    const type = CARD_KEY_TO_TYPE[cardKey] ?? "leave";
    // Late & Geo Fence are violation records without an approval lifecycle —
    // hide the status tabs and show all data unfiltered.
    const hideStatusTabs = ["late", "geofence"].includes(type);
    const [status, setStatus] = useState<DrawerStatus>("Pending");
    const [page, setPage]     = useState(1);
    const [rows, setRows]     = useState<any[]>([]);
    const [total, setTotal]   = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getAdminRequestDetails({
            type,
            startDate:  appliedRange.startDate,
            endDate:    appliedRange.endDate,
            status:     (!hideStatusTabs && status !== "All") ? status : undefined,
            department: department !== "All" ? department : undefined,
            page,
            pageSize:   DRAWER_PAGE_SIZE,
        }).then(res => {
            if (!cancelled) { setRows(res.rows); setTotal(res.total); }
        }).catch(() => { if (!cancelled) setRows([]); })
          .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [type, status, page, appliedRange, department]);

    const totalPages = Math.max(1, Math.ceil(total / DRAWER_PAGE_SIZE));
    const pageStart  = (page - 1) * DRAWER_PAGE_SIZE + 1;
    const pageEnd    = Math.min(page * DRAWER_PAGE_SIZE, total);

    const renderHead = () => {
        const ths = (cols: string[]) => (
            <tr>{cols.map(c => <th key={c} style={DRAWER_TH}>{c}</th>)}</tr>
        );
        switch (type) {
            case "leave":       return ths(["Employee", "Department", "Leave Type", "Start Date", "End Date", "Days", "Reason", "Status"]);
            case "permission":  return ths(["Employee", "Department", "Date", "From", "To", "Subject", "Reason", "Status"]);
            case "late":        return ths(["Employee", "Department", "Date", "Check-in", "Shift Start", "Violation", "Reason"]);
            case "geofence":    return ths(["Employee", "Department", "Date", "Check-in", "Work Type", "Violation", "Recorded Location", "Assigned Location"]);
            case "regularize":  return ths(["Employee", "Department", "Date", "Type", "Reason", "Status"]);
        }
    };

    const renderRow = (row: any, idx: number) => {
        const bg = idx % 2 === 0 ? "#fff" : "#fafbfc";
        const rowStyle: React.CSSProperties = { borderBottom: "1px solid #f1f5f9", background: bg };
        const emp  = <EmpCell name={row.employeeName ?? "Unknown"} />;
        const dept = <span style={{ fontSize: "13px", color: "#6b7280" }}>{row.department || "—"}</span>;
        const badge = <DrawerStatusBadge status={row.status} />;

        switch (type) {
            case "leave": return (
                <tr key={row.id ?? idx} style={rowStyle}>
                    <td style={DRAWER_TD}>{emp}</td>
                    <td style={DRAWER_TD}>{dept}</td>
                    <td style={DRAWER_TD}>
                        <span style={{ fontSize: "12px", background: "#f3f4f6", padding: "2px 8px", borderRadius: "10px", color: "#374151" }}>
                            {displayLeaveLabel(row.leaveType) || "Leave"}
                        </span>
                    </td>
                    <td style={DRAWER_TD}>{fmtDateStr(row.startDate)}</td>
                    <td style={DRAWER_TD}>{fmtDateStr(row.endDate)}</td>
                    <td style={DRAWER_TD}><span style={{ fontWeight: 700, color: "#111827" }}>{row.days ?? "—"}</span></td>
                    <td style={DRAWER_TD}>
                        <span style={{ fontSize: "12px", color: "#374151", maxWidth: 240, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.reason ?? ""}>
                            {row.reason || "—"}
                        </span>
                    </td>
                    <td style={DRAWER_TD}>{badge}</td>
                </tr>
            );
            case "permission": return (
                <tr key={row.id ?? idx} style={rowStyle}>
                    <td style={DRAWER_TD}>{emp}</td>
                    <td style={DRAWER_TD}>{dept}</td>
                    <td style={DRAWER_TD}>{fmtDateStr(row.date)}</td>
                    <td style={DRAWER_TD}>{row.startTime || "—"}</td>
                    <td style={DRAWER_TD}>{row.endTime || "—"}</td>
                    <td style={DRAWER_TD}>
                        <span style={{ fontSize: "12px", color: "#374151", maxWidth: 180, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.subject}>
                            {row.subject || "—"}
                        </span>
                    </td>
                    <td style={DRAWER_TD}>
                        <span style={{ fontSize: "12px", color: "#374151", maxWidth: 220, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.reason ?? ""}>
                            {row.reason || "NA"}
                        </span>
                    </td>
                    <td style={DRAWER_TD}>{badge}</td>
                </tr>
            );
            case "late": return (
                <tr key={row.id ?? idx} style={rowStyle}>
                    <td style={DRAWER_TD}>{emp}</td>
                    <td style={DRAWER_TD}>{dept}</td>
                    <td style={DRAWER_TD}>{fmtDateStr(row.date)}</td>
                    <td style={DRAWER_TD}><span style={{ fontWeight: 600, color: "#ea580c" }}>{fmtTimeStr(row.checkInTime)}</span></td>
                    <td style={DRAWER_TD}>{fmtTimeStr(row.shiftStart)}</td>
                    <td style={DRAWER_TD}>
                        <span style={{ fontSize: "12px", background: row.violationType === "Early" ? "#e0f2fe" : "#fff7ed", color: row.violationType === "Early" ? "#0284c7" : "#ea580c", padding: "2px 8px", borderRadius: "10px" }}>
                            {row.violationType || "Late"}
                        </span>
                    </td>
                    <td style={DRAWER_TD}>
                        <span style={{ fontSize: "12px", color: "#374151", maxWidth: 220, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.reason ?? ""}>
                            {row.reason || "NA"}
                        </span>
                    </td>
                </tr>
            );
            case "geofence": return (
                <tr key={row.id ?? idx} style={rowStyle}>
                    <td style={DRAWER_TD}>{emp}</td>
                    <td style={DRAWER_TD}>{dept}</td>
                    <td style={DRAWER_TD}>{fmtDateStr(row.date)}</td>
                    <td style={DRAWER_TD}>{fmtTimeStr(row.checkInTime)}</td>
                    <td style={DRAWER_TD}>{row.workLocationType || "—"}</td>
                    <td style={DRAWER_TD}>
                        <span style={{ fontSize: "12px", background: "#dbeafe", color: "#1d4ed8", padding: "2px 8px", borderRadius: "10px" }}>
                            {row.violationType || "Location"}
                        </span>
                    </td>
                    <td style={DRAWER_TD}>
                        <span
                            title={row.currentLocation || ""}
                            style={{ fontSize: "12px", color: "#374151", maxWidth: 160, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                            {row.currentLocation || "—"}
                        </span>
                    </td>
                    <td style={DRAWER_TD}>
                        <span
                            title={row.officeLocation || ""}
                            style={{ fontSize: "12px", color: "#374151", maxWidth: 160, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                            {row.officeLocation || "—"}
                        </span>
                    </td>
                </tr>
            );
            case "regularize": {
                const regType = (row.isLeave === true || row.isLeave === 1)
                    ? "Check-out"
                    : (row.isCheckIn === true || row.isCheckIn === 1)
                    ? "Check-in"
                    : "Other";
                return (
                    <tr key={row.id ?? idx} style={rowStyle}>
                        <td style={DRAWER_TD}>{emp}</td>
                        <td style={DRAWER_TD}>{dept}</td>
                        <td style={DRAWER_TD}>{fmtDateStr(row.date)}</td>
                        <td style={DRAWER_TD}>
                            <span style={{ fontSize: "12px", background: "#dcfce7", color: "#16a34a", padding: "2px 8px", borderRadius: "10px" }}>
                                {regType}
                            </span>
                        </td>
                        <td style={DRAWER_TD}>
                            <span style={{ fontSize: "12px", color: "#374151", maxWidth: 220, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={row.reason ?? ""}>
                                {row.reason || "—"}
                            </span>
                        </td>
                        <td style={DRAWER_TD}>{badge}</td>
                    </tr>
                );
            }
            default: return null;
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "#ffffffb5", zIndex: 1000 }}
            />

            {/* Drawer panel */}
            <div style={{
                position: "fixed", top: 0, right: 0,
                width: type === "geofence" ? "min(1200px, 98vw)" : ["leave", "permission", "late", "regularize"].includes(type) ? "min(1080px, 97vw)" : "min(920px, 96vw)", height: "100vh",
                background: "#fff", zIndex: 1001,
                display: "flex", flexDirection: "column",
                boxShadow: "-6px 0 32px rgba(0,0,0,0.14)",
                overflow: "hidden",
            }}>
                {/* Header */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "18px 22px", borderBottom: "1px solid #e5e7eb", flexShrink: 0,
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            background: iconBg, borderRadius: "10px",
                            width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <Icon style={{ color: iconColor, width: 18, height: 18 }} />
                        </div>
                        <div>
                            <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827" }}>{title}</div>
                            <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: 1 }}>
                                {formatDisplayDate(appliedRange.startDate)} – {formatDisplayDate(appliedRange.endDate)}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "#f3f4f6", border: "none", borderRadius: "8px",
                            width: 34, height: 34, cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#6b7280",
                        }}
                    >
                        <Dismiss20Regular />
                    </button>
                </div>

                {/* Status filter tabs */}
                <div style={{
                    display: "flex", alignItems: "center", gap: 0,
                    padding: "0 22px", borderBottom: "2px solid #f1f5f9", flexShrink: 0,
                }}>
                    {!hideStatusTabs && DRAWER_TABS.map(s => (
                        <button
                            key={s}
                            onClick={() => { setStatus(s); setPage(1); }}
                            style={{
                                padding: "10px 16px", background: "none", border: "none",
                                borderBottom: s === status ? "2px solid #0078D4" : "2px solid transparent",
                                marginBottom: "-2px",
                                fontSize: "13px", fontWeight: s === status ? 700 : 500,
                                color: s === status ? "#0078D4" : "#6b7280",
                                cursor: "pointer", whiteSpace: "nowrap",
                            }}
                        >
                            {s}
                        </button>
                    ))}
                    <span style={{ marginLeft: "auto", fontSize: "12px", color: "#9ca3af", paddingRight: 4 }}>
                        {total} record{total !== 1 ? "s" : ""}
                    </span>
                </div>

                {/* Table body — scrollable */}
                <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", width: '100%' }}>
                    {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
                            <Spinner label="Loading requests…" />
                        </div>
                    ) : rows.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "50px", color: "#9ca3af", fontSize: "14px" }}>
                            No {(hideStatusTabs || status === "All") ? "" : status.toLowerCase() + " "}records found for this period.
                        </div>
                    ) : (
                        <table style={{ width: "100%", minWidth: type === "geofence" ? "1100px" : ["leave", "permission", "late", "regularize"].includes(type) ? "960px" : "700px", borderCollapse: "collapse", margin: '10px 0', border: '1px solid #e5e5e5' }}>
                            <thead style={{ position: "sticky", top: 0, zIndex: 1 }}>
                                {renderHead()}
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => renderRow(row, idx))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination footer */}
                {!loading && rows.length > 0 && (
                    <div style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "10px 22px", borderTop: "1px solid #f1f5f9",
                        background: "#fafafa", flexShrink: 0,
                    }}>
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>
                            Showing {pageStart}–{pageEnd} of {total.toLocaleString()}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                style={{
                                    width: 30, height: 30, borderRadius: "7px", border: "1px solid #e5e7eb",
                                    background: "#fff", cursor: page === 1 ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#374151", opacity: page === 1 ? 0.4 : 1,
                                }}
                            >
                                <ChevronLeft20Regular />
                            </button>
                            <span style={{ fontSize: "13px", color: "#374151", minWidth: 60, textAlign: "center" }}>
                                {page} / {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                style={{
                                    width: 30, height: 30, borderRadius: "7px", border: "1px solid #e5e7eb",
                                    background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: "#374151", opacity: page >= totalPages ? 0.4 : 1,
                                }}
                            >
                                <ChevronRight20Regular />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

// ─── Sub-component: Request Card ─────────────────────────────────────────────

interface RequestCardProps {
    cardKey: string;
    title: string;
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    counts: StatusCounts;
    styles: ReturnType<typeof useStyles>;
    onClick: () => void;
}

const BULLET_STYLE = {
    Pending: { color: "#d97706", dot: "#f59e0b" },
    Approved: { color: "#16a34a", dot: "#22c55e" },
    Rejected: { color: "#dc2626", dot: "#ef4444" },
};

const PENDING_ONLY_KEYS = new Set(["lateArrivals", "geoFencing"]);

const RequestCard: React.FC<RequestCardProps> = ({
    cardKey, title, icon: Icon, iconBg, iconColor, counts, styles, onClick,
}) => {
    const pendingOnly = PENDING_ONLY_KEYS.has(cardKey);
    const total = pendingOnly ? counts.Pending : counts.Pending + counts.Approved + counts.Rejected;
    return (
        <div
            className={styles.reqCard}
            onClick={onClick}
            style={{ cursor: "pointer", transition: "box-shadow 0.15s, transform 0.15s" }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,120,212,0.15)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "";
                (e.currentTarget as HTMLDivElement).style.transform = "";
            }}
        >
            {/* Header: icon + title */}
            <div className={styles.reqCardHeader}>
                <div className={styles.reqCardIcon} style={{ background: iconBg }}>
                    <Icon style={{ color: iconColor, width: "15px", height: "15px" }} />
                </div>
                <Text className={styles.reqCardTitle}>{title}</Text>
            </div>

            {/* Body: grey total box + bullet list */}
            <div className={styles.reqCardBody}>
                <div className={styles.reqTotalBox}>
                    <span className={styles.reqTotalNum}>{total}</span>
                    <span className={styles.reqTotalLabel}>Total</span>
                </div>

                <div className={styles.reqBulletList}>
                    {(pendingOnly
                        ? ([] as const)
                        : (["Pending", "Approved", "Rejected"] as const)
                    ).map(status => {
                        const s = BULLET_STYLE[status];
                        return (
                            <div key={status} className={styles.reqBulletRow}>
                                <span className={styles.reqBulletDot} style={{ background: s.dot }} />
                                <span className={styles.reqBulletText} style={{ color: s.color }}>
                                    {counts[status]} {status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────── ──────────

const DEFAULT_PRESET: DatePreset = "thisMonth";

const AdminAttendanceReport: React.FC = () => {
    const styles = useStyles();

    // ── Filter state — all derived from DEFAULT_PRESET so dropdown & period are always in sync
    const [preset, setPreset] = useState<DatePreset>(DEFAULT_PRESET);
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");
    const [appliedRange, setAppliedRange] = useState<DateRange>(getPresetRange(DEFAULT_PRESET));

    // ── Data state
    const [data, setData] = useState<AdminDashboardSummaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);

    // ── Drawer state
    const [drawerCardKey, setDrawerCardKey] = useState<string | null>(null);

    // ── Share Mail state
    const [shareStatus, setShareStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");


    // upload record state
    const [openUploadData,setOpenuploadData] = useState (false)
    const[openRegularizeUpload, setOpenRegularizaUpload] = useState(false)
    const {currentUser} = useAuth()
    const navigate = useNavigate()



    const handleOpenRegularizeUpload = () =>{
        setOpenRegularizaUpload(true)
    }

    const handleCloseRegularizeUpload = () =>{
        setOpenRegularizaUpload(false)
    }


    const handleOpenuploadDialog = () =>{
        setOpenuploadData(true)
    }

    const handleCloseuploadDialog = () =>{
        setOpenuploadData(false)
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
        const isPermitted = checkPermission("attendance.dashboard.admin_dashboard")
    
        if(isPermitted === false){
            navigate("/Attendance")
        }
      },[])


    const handleShareMail = async () => {
        setShareStatus("sending");
        try {
            await shareAdminReport(appliedRange.startDate, appliedRange.endDate);
            setShareStatus("sent");
            setTimeout(() => setShareStatus("idle"), 4000);
        } catch {
            setShareStatus("error");
            setTimeout(() => setShareStatus("idle"), 4000);
        }
    };

    // ── Download Excel state
    const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "error">("idle");
    const handleDownloadExcel = async () => {
        setDownloadStatus("downloading");
        try {
            await exportAdminReport(
                appliedRange.startDate,
                appliedRange.endDate,
                selectedDept !== "All" ? selectedDept : undefined,
            );
            setDownloadStatus("idle");
        } catch {
            setDownloadStatus("error");
            setTimeout(() => setDownloadStatus("idle"), 4000);
        }
    };

    // ── Department filter
    const [selectedDept, setSelectedDept] = useState<string>("All");
    // Keeps the full dept list intact even after filtering by a specific dept
    const [allDepartments, setAllDepartments] = useState<string[]>([]);

    // Core load function — re-fetches everything from the API
    function triggerLoad(range: DateRange, dept: string = "All") {
        if (!range.startDate || isNaN(range.startDate.getTime())) return;
        setAppliedRange(range);
        setLoading(true);
        setError(null);
        setHasGenerated(true);
        getAdminDashboardSummary(range.startDate, range.endDate, dept !== "All" ? dept : undefined)
            .then(res => {
                setData(res);
                // Only update the master dept list when fetching all departments,
                // so the dropdown never loses options when a dept filter is active.
                if (dept === "All") {
                    setAllDepartments(res.departmentStats.map(d => d.department));
                }
            })
            .catch(() => setError("Failed to load report. Please try again."))
            .finally(() => setLoading(false));
    }

    // Department change — re-fetch with new dept, keep current date range
    function handleDeptChange(dept: string) {
        setSelectedDept(dept);
        triggerLoad(appliedRange, dept);
    }

    // Auto-load on mount — uses same DEFAULT_PRESET so dropdown matches period on first render
    useEffect(() => {
        triggerLoad(getPresetRange(DEFAULT_PRESET), "All");
    }, []);

    // Auto-reload when preset changes (non-custom) — reset dept
    function handlePresetChange(val: DatePreset) {
        setPreset(val);
        setSelectedDept("All");
        if (val !== "custom") {
            triggerLoad(getPresetRange(val), "All");
        }
    }

    // Auto-reload when both custom dates are set and valid — reset dept
    useEffect(() => {
        if (preset !== "custom" || !customStart || !customEnd) return;
        const start = new Date(customStart + "T00:00:00");
        const end = new Date(customEnd + "T00:00:00");
        if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) return;
        setSelectedDept("All");
        triggerLoad({ startDate: start, endDate: end }, "All");
    }, [customStart, customEnd]);

    return (
        <div className={styles.page}>
            <AttendanceBulkUploadDialog open={openUploadData} handleClose={handleCloseuploadDialog}/>
            <RegularizeBulkUploadDialog open={openRegularizeUpload} handleClose={handleCloseRegularizeUpload}/>
            {/* ── Header */}
            <div className={styles.header} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                <Text className={styles.pageTitle}>Admin Report Dashboard</Text>
                {hasGenerated && data && (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <button
                        onClick={handleDownloadExcel}
                        disabled={downloadStatus === "downloading"}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "9px 20px",
                            border: downloadStatus === "error" ? "1.5px solid #dc2626" : "1.5px solid #c0c2c1",
                            borderRadius: "20px",
                            background: downloadStatus === "error" ? "#fef2f2"
                                      : downloadStatus === "downloading" ? "#f0fdf4"
                                      : "#f4f7f5",
                            color: downloadStatus === "error" ? "#dc2626"
                                 : downloadStatus === "downloading" ? "#dce7e0c4"
                                 : "#575656",
                            fontSize: "13px", fontWeight: "600",
                            cursor: downloadStatus === "downloading" ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        {downloadStatus === "downloading" ? <Spinner size="extra-tiny" /> : downloadStatus === "error" ? <DismissCircle20Regular /> : <ArrowDownload20Regular />}
                        {downloadStatus === "downloading" ? "Downloading…" : downloadStatus === "error" ? "Failed — Retry" : "Download Excel"}
                    </button>
                    <button
                        onClick={handleShareMail}
                        disabled={shareStatus === "sending"}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "9px 20px",
                            border: shareStatus === "sent" ? "1.5px solid #16a34a"
                                  : shareStatus === "error" ? "1.5px solid #dc2626"
                                  : "1.5px solid #0078D4",
                            borderRadius: "20px",
                            background: shareStatus === "sent" ? "#f0fdf4"
                                      : shareStatus === "error" ? "#fef2f2"
                                      : shareStatus === "sending" ? "#f0f7ff"
                                      : "#0078D4",
                            color: shareStatus === "sent" ? "#16a34a"
                                 : shareStatus === "error" ? "#dc2626"
                                 : shareStatus === "sending" ? "#0078D4"
                                 : "#fff",
                            fontSize: "13px", fontWeight: "600", cursor: shareStatus === "sending" ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        {shareStatus === "sending" && <Spinner size="extra-tiny" />}
                        {shareStatus === "sent"    && <CheckmarkCircle20Regular />}
                        {shareStatus === "error"   && <DismissCircle20Regular />}
                        {shareStatus === "idle"    && <Mail20Regular />}
                        {shareStatus === "sending" ? "Sending…"
                       : shareStatus === "sent"    ? "Email Sent!"
                       : shareStatus === "error"   ? "Failed — Retry"
                       : "Share Mail"}
                    </button>

                    <button
                        onClick={handleOpenuploadDialog}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "9px 20px",
                            border:  "1.5px solid #c0c2c1",
                            borderRadius: "20px",
                            background: "#f4f7f5",
                            color: "#575656",
                            fontSize: "13px", fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        { <ArrowUpload20Regular />}
                        { "Upload Record"}
                    </button>


                    <button
                        onClick={handleOpenRegularizeUpload}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "9px 20px",
                            border:  "1.5px solid #c0c2c1",
                            borderRadius: "20px",
                            background: "#f4f7f5",
                            color: "#575656",
                            fontSize: "13px", fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        { <ArrowUpload20Regular />}
                        { "Upload Regularization"}
                    </button>
                    </div>
                )}
            </div>

            {/* ── Filter */}
            <div className={styles.filterCard}>
                <div className={styles.filterGroup}>
                    <span className={styles.filterLabel}>Date Range</span>
                    <select
                        className={styles.selectBox}
                        value={preset}
                        onChange={e => handlePresetChange(e.target.value as DatePreset)}
                    >
                        <option value="thisDay">Today</option>
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
                            <input max={new Date().toISOString().split('T')[0]} type="date" className={styles.dateInput} value={customStart} onChange={e => setCustomStart(e.target.value)} />
                            <span style={{ color: "#6b7280", fontSize: "13px" }}>→</span>
                            <input max={new Date().toISOString().split('T')[0]} min={customStart?new Date(customStart)?.toISOString().split('T')[0]:new Date().toISOString().split('T')[0]} type="date" className={styles.dateInput} value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                        </div>
                    </div>
                )}

                {/* Department filter — visible after first load */}
                {allDepartments.length > 0 && (
                    <div className={styles.filterGroup}>
                        <span className={styles.filterLabel}>Department</span>
                        <select
                            className={styles.selectBox}
                            value={selectedDept}
                            onChange={e => handleDeptChange(e.target.value)}
                        >
                            <option value="All">All Departments</option>
                            {allDepartments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                )}

            </div>

            {/* ── Request Detail Drawer */}
            {drawerCardKey && data && (() => {
                const cfg = CARD_CONFIG.find(c => c.key === drawerCardKey);
                if (!cfg) return null;
                return (
                    <RequestDetailDrawer
                        cardKey={drawerCardKey}
                        title={cfg.title}
                        icon={cfg.icon}
                        iconBg={cfg.iconBg}
                        iconColor={cfg.iconColor}
                        appliedRange={appliedRange}
                        department={selectedDept}
                        onClose={() => setDrawerCardKey(null)}
                    />
                );
            })()}

            {/* ── Content */}
            <div className={styles.content}>
                {error && <div className={styles.errorBanner}>{error}</div>}

                {loading ? (
                    <div className={styles.spinnerWrap}><Spinner label="Loading report…" /></div>
                ) : hasGenerated && data ? (
                    <>
                        <Text className={styles.periodLabel}>
                            Report period: {formatDisplayDate(appliedRange.startDate)} – {formatDisplayDate(appliedRange.endDate)}
                        </Text>

                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                            {/* Total Employees card */}
                            {/* <div className={styles.totalCard}>
                                <div className={styles.totalIconWrap}>
                                    <PeopleTeamRegular style={{ width: "28px", height: "28px", color: "#fff" }} />
                                </div>
                                <div className={styles.totalInfo}>
                                    <Text className={styles.totalLabel}>Total Employees</Text>
                                    <Text className={styles.totalValue}>{data.totalEmployees}</Text>
                                    <Text className={styles.totalSub}>Active employees in the organisation</Text>
                                </div>
                            </div> */}

                            {/* 5 request type cards */}
                            <div className={styles.cardsGrid}>
                                {CARD_CONFIG.map(cfg => (
                                    <RequestCard
                                        key={cfg.key}
                                        cardKey={cfg.key}
                                        title={cfg.title}
                                        icon={cfg.icon}
                                        iconBg={cfg.iconBg}
                                        iconColor={cfg.iconColor}
                                        counts={data[cfg.key]}
                                        styles={styles}
                                        onClick={() => setDrawerCardKey(cfg.key)}
                                    />
                                ))}
                            </div>
                        </div>



                        {/* Employee panel + Department chart */}
                        <div className={styles.bottomRow}>
                            <EmployeePanel employees={data?.employees ?? []} styles={styles} />

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, minWidth: 0 }}>
                                {(data?.employees?.length > 0) && (
                                    <EmployeeStatusCard
                                        employees={data.employees}
                                        periodLabel={`${formatDisplayDate(appliedRange.startDate)} – ${formatDisplayDate(appliedRange.endDate)}`}
                                    />
                                )}
                                {data.departmentStats?.length > 0 && (
                                    <div style={{ flex: 1, width: '100%' }}>
                                        <DeptBarChart data={data.departmentStats} styles={styles} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default AdminAttendanceReport;
