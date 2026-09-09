import React, { useEffect, useState, useCallback, useRef } from "react";
import { displayLeaveLabel } from "../Utils/leaveUtils";
import {
    makeStyles, Text, Spinner, Badge,
    Drawer, DrawerHeader, DrawerHeaderTitle, DrawerBody,
    Button, Input, Select
} from "@fluentui/react-components";
import {
    Dismiss24Regular,
    Search20Regular,
    ChevronLeft20Regular,
    ChevronRight20Regular,
    ChevronDown20Regular,
    CalendarMonth20Regular,
    MoreHorizontal20Regular,
    ArrowLeft20Regular,
    Warning20Filled,
    Building20Regular,
    Location20Regular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import {
    getTeamView,
    getEmployeeCalendar,
    getEmployeeDetail,
    TeamViewMember,
    CalendarAttendanceRecord,
    CalendarLeaveRecord,
    EmployeeDetailData,
    EmpEvent,
} from "../Services/TeamViewService";
import TeamCalendar from "../Components/TeamCalendar";
import { useNavigate } from "react-router-dom";

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
    page: {
        display: "flex",
        flexDirection: "column",
        gap: "0",
        minHeight: "100%",
    },
    calendarPage: {
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
    },
    // ── Tab strip
    tabStrip: {
        display: "flex",
        gap: "0",
        borderBottom: "2px solid #e5e7eb",
        padding: "0 28px",
        justifyContent: 'flex-end'
    },
    tab: {
        padding: "10px 18px",
        border: "none",
        background: "none",
        fontSize: "14px",
        fontWeight: "500",
        color: "#6b7280",
        cursor: "pointer",
        borderBottom: "2px solid transparent",
        marginBottom: "-2px",
    },
    tabActive: {
        color: "#0078D4",
        borderBottomColor: "#0078D4",
        fontWeight: "600",
    },
    // ── Header
    header: {
        padding: "20px 28px 0 28px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        backgroundColor: "#ffffff93",
        borderRadius: '8px',
        borderBottom: "1px solid #e5e7eb",
    },
    headerTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    pageTitle: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#111827",
    },
    // ── Toolbar
    toolbar: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
        paddingBottom: "14px",
    },
    searchBox: {
        minWidth: "200px",
        flex: "1 1 200px",
        maxWidth: "280px",
    },
    datePicker: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        borderRadius: "8px",
        border: "1.5px solid #0078D4",
        background: "#fff",
        fontSize: "13px",
        fontWeight: "500",
        color: "#0078D4",
        cursor: "pointer",
        userSelect: "none",
    },
    dateNavBtn: {
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        padding: "4px",
        borderRadius: "6px",
        color: "#374151",
    },
    filterBtn: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        borderRadius: "8px",
        border: "1.5px solid #e5e7eb",
        background: "#fff",
        fontSize: "13px",
        color: "#374151",
        cursor: "pointer",
        userSelect: "none",
    },
    filterBtnActive: {
        color: "#0078D4",
        background: "#eff6ff",
    },
    spacer: { flex: "1" },
    // ── List
    listContainer: {
        padding: "16px 28px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    memberCard: {
        background: "#fff",
        borderRadius: "12px",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        cursor: "pointer",
        border: "1px solid transparent",
    },
    avatarWrap: {
        position: "relative",
        width: "44px",
        height: "44px",
        flexShrink: "0",
    },
    avatar: {
        width: "44px",
        height: "44px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
        fontWeight: "600",
        color: "#fff",
    },
    memberMeta: {
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        flex: "1",
        minWidth: "0",
    },
    memberNameRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        flexWrap: "wrap",
    },
    memberName: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#111827",
    },
    memberSubtext: {
        fontSize: "12px",
        color: "#6b7280",
    },
    memberRight: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "3px",
        flexShrink: "0",
    },
    checkTime: {
        fontSize: "14px",
        fontWeight: "600",
        color: "#111827",
    },
    onTime: { fontSize: "12px", color: "#16a34a", fontWeight: "500" },
    lateArrival: { fontSize: "12px", color: "#f59e0b", fontWeight: "500" },
    needsReview: { fontSize: "12px", color: "#0078D4", fontWeight: "500" },
    escalated: { fontSize: "12px", color: "#dc2626", fontWeight: "500" },
    fullDay: { fontSize: "12px", color: "#6b7280" },
    spinnerWrap: {
        display: "flex",
        justifyContent: "center",
        padding: "60px 0",
    },
    errorBanner: {
        margin: "16px 28px",
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "10px",
        padding: "12px 16px",
        fontSize: "13px",
        color: "#dc2626",
    },
    emptyState: {
        textAlign: "center",
        padding: "60px 0",
        color: "#6b7280",
        fontSize: "14px",
    },
    // ── Drawer
    drawerContent: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "16px 0",
    },
    drawerMemberInfo: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "0 4px",
    },
    calendarNav: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 4px",
    },
    calendarMonthLabel: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#111827",
    },
    calendarGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(7, 1fr)",
        gap: "4px",
    },
    calDayHeader: {
        textAlign: "center",
        fontSize: "11px",
        fontWeight: "600",
        color: "#9ca3af",
        padding: "4px 0",
    },
    calDay: {
        borderRadius: "8px",
        padding: "6px 4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        minHeight: "52px",
        fontSize: "12px",
        position: "relative",
    },
    calDayNum: {
        fontSize: "12px",
        fontWeight: "500",
        color: "#374151",
    },
    calTimeText: {
        fontSize: "9px",
        color: "#6b7280",
        textAlign: "center",
        lineHeight: "1.2",
    },
    drawerSpinner: {
        display: "flex",
        justifyContent: "center",
        padding: "24px 0",
    },
    calLegend: {
        display: "flex",
        gap: "14px",
        flexWrap: "wrap",
        padding: "0 4px",
    },
    calLegendItem: {
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "11px",
        color: "#6b7280",
    },
    calLegendDot: {
        width: "10px",
        height: "10px",
        borderRadius: "3px",
        display: "inline-block",
    },
    // ── Detail panel icon button on member card
    detailBtn: {
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "6px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        color: "#6b7280",
        flexShrink: 0,
        ":hover": { background: "#f3f4f6", color: "#0078D4" },
    },
    // ── Employee detail panel (inside drawer)
    dpWrap: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        height: "100%",
        overflowY: "auto",
        background: "transparent",
    },
    dpProfileBanner: {
        background: "linear-gradient(135deg, #ede9fe 0%, #dbeafe 100%)",
        padding: "24px 24px 20px 24px",
        display: "flex",
        gap: "18px",
        alignItems: "flex-start",
        borderRadius: '10px'
    },
    dpAvatarCircle: {
        width: "64px",
        height: "64px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
        fontWeight: "700",
        color: "#fff",
        flexShrink: 0,
    },
    dpProfileInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        flex: "1",
    },
    dpName: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#111827",
    },
    dpSub: {
        fontSize: "13px",
        color: "#4b5563",
    },
    dpBadgeRow: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginTop: "6px",
    },
    dpBadge: {
        fontSize: "12px",
        fontWeight: "500",
        padding: "3px 10px",
        borderRadius: "20px",
        background: "rgba(255,255,255,0.7)",
        color: "#374151",
    },
    dpReportsTo: {
        fontSize: "12px",
        color: "#6b7280",
        textAlign: "right" as const,
        flexShrink: 0,
    },
    dpBody: {
        display: "flex",
        flex: "1",
        gap: "0",
        minHeight: 0,
        border: '1px solid #ddd',
        borderRadius: '10px'
    },
    dpLeft: {
        flex: "1",
        padding: "20px 20px 20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        borderRight: "1px solid #f3f4f6",
        overflowY: "auto",
    },
    dpRight: {
        width: "320px",
        flexShrink: 0,
        padding: "20px 24px 20px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        overflowY: "auto",
    },
    dpSectionTitle: {
        fontSize: "13px",
        fontWeight: "700",
        color: "#374151",
        marginBottom: "10px",
    },
    dpPeriodRow: {
        display: "flex",
        gap: "6px",
        flexWrap: "wrap",
    },
    dpPeriodBtn: {
        fontSize: "12px",
        padding: "5px 12px",
        borderRadius: "20px",
        border: "1.5px solid #d1d5db",
        background: "#fff",
        color: "#374151",
        cursor: "pointer",
    },
    dpPeriodBtnActive: {
        background: "#0078D4",
        color: "#fff",
    },
    // Events
    dpEventRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1px solid #f3f4f6",
        background: "#fafafa",
        marginBottom: "6px",
    },
    dpEventLabel: {
        fontSize: "11px",
        fontWeight: "600",
        padding: "2px 8px",
        borderRadius: "10px",
        flexShrink: 0,
    },
    dpEventDetail: {
        fontSize: "12px",
        color: "#374151",
        flex: "1",
    },
    dpEventDate: {
        fontSize: "11px",
        color: "#9ca3af",
        flexShrink: 0,
    },
    // Heatmap
    dpHeatGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(20, 2fr)",
        gap: "3px",
    },
    dpHeatCell: {
        width: "100%",
        aspectRatio: "1",
        borderRadius: "3px",
    },
    dpHeatLegend: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap",
        marginTop: "8px",
    },
    dpHeatLegendItem: {
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "10px",
        color: "#6b7280",
    },
    // Leave balance
    dpLeaveRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "10px",
    },
    dpLeaveLabel: {
        fontSize: "12px",
        color: "#374151",
        fontWeight: "500",
    },
    dpLeaveCount: {
        fontSize: "12px",
        fontWeight: "700",
        color: "#111827",
    },
    dpLeaveBarTrack: {
        height: "4px",
        borderRadius: "2px",
        background: "#e5e7eb",
        marginBottom: "10px",
        marginTop: "-6px",
    },
    dpLeaveBarFill: {
        height: "100%",
        borderRadius: "2px",
    },
    // Stats grid
    dpStatsGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
    },
    dpStatCell: {
        background: "#f9fafb",
        borderRadius: "10px",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    dpStatLabel: {
        fontSize: "11px",
        color: "#6b7280",
    },
    dpStatValue: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#111827",
    },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    "#0078D4", "#107C10", "#D83B01", "#8764B8",
    "#038387", "#C19C00", "#881798", "#00B294",
];

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatTime(isoString: string | null): string {
    if (!isoString) return "";
    const d = new Date(isoString.replace(/Z$/, ""));
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatShiftTime(timeStr: string | null): string {
    if (!timeStr) return "";
    if (timeStr.includes("T")) {
        const d = new Date(timeStr);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return timeStr.substring(0, 5);
}

function toDateOnly(isoString: string | null): string {
    if (!isoString) return "";
    return isoString.split("T")[0];
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();
}

function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
}

// Determine display status for a team member
type DisplayStatus = "active" | "early" | "late" | "location-exception" | "not-checked-in" | "on-leave" | "escalated";

function getMemberDisplayStatus(m: TeamViewMember, selectedDate: Date): DisplayStatus {
    if (m.leaveId) return "on-leave";
    if (!m.checkIn) {
        // Escalated = shift has started but still not checked in (only applicable for today)
        if (isToday(selectedDate) && m.shiftStartTime) {
            const now = new Date();
            const [sh, sm] = m.shiftStartTime.split(":").map(Number);
            const shiftStart = new Date();
            shiftStart.setHours(sh, sm, 0, 0);
            if (now > shiftStart) return "not-checked-in";
        }
        return "not-checked-in";
    }
    if (m.violationType === "Location" || m.violationType === "Both") return "location-exception";
    if (m.violationType === "Early") return "early";
    if (m.violationType === "Late") return "late";
    return "active";
}

const STATUS_CONFIG: Record<DisplayStatus, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "#16a34a", bg: "#dcfce7" },
    early: { label: "Early", color: "#0284c7", bg: "#e0f2fe" },
    late: { label: "Late", color: "#f59e0b", bg: "#fef9c3" },
    "location-exception": { label: "Location exception", color: "#7c3aed", bg: "#ede9fe" },
    "not-checked-in": { label: "Not checked in", color: "#6b7280", bg: "#f3f4f6" },
    "on-leave": { label: "On leave", color: "#f59e0b", bg: "#fef9c3" },
    escalated: { label: "Escalated", color: "#dc2626", bg: "#fee2e2" },
};

// Calendar day colors
function getCalDayStyle(
    date: Date,
    attendanceMap: Map<string, CalendarAttendanceRecord>,
    leaveRanges: CalendarLeaveRecord[]
): React.CSSProperties {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const day = date.getDay(); // 0=Sun,6=Sat

    if (day === 0 || day === 6) return { background: "#f9fafb" };

    // Check leave
    const isLeave = leaveRanges.some(l => {
        const start = new Date(l.leaveStartDate);
        const end = new Date(l.leaveEndDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return date >= start && date <= end;
    });
    if (isLeave) return { background: "#fef9c3" };

    const rec = attendanceMap.get(key);
    if (!rec) return {};
    if (rec.violationType === "Location" || rec.violationType === "Both") return { background: "#ede9fe" };
    if (rec.violationType === "Early") return { background: "#e0f2fe" };
    if (rec.violationType === "Late") return { background: "#fff3cd" };
    if (rec.checkIn) return { background: "#dcfce7" };
    return { background: "#fee2e2" };
}

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
const DAY_HEADERS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Heatmap helpers ─────────────────────────────────────────────────────────

const HEAT_COLOR: Record<string, string> = {
    Early: "#166534",
    OnTime: "#86efac",
    Late: "#fde68a",
    WFH: "#c7d2fe",
    Absent: "#fecaca",
    Weekend: "#f3f4f6",
    Leave: "#fef9c3",
    Today: "#0078D4",
};

const HEAT_LEGEND = [
    { key: "Early", label: "Early" },
    { key: "OnTime", label: "On-time" },
    { key: "Late", label: "Late" },
    { key: "WFH", label: "WFH" },
    { key: "Absent", label: "Absent" },
    { key: "Leave", label: "Leave" },
    { key: "Weekend", label: "Weekend" },
];

// Format "HH:mm:ss" → "HH:mm"
function fmtShift(t: string | null): string {
    if (!t) return "";
    if (t.includes("T")) {
        const d = new Date(t);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return t.substring(0, 5);
}

// Format decimal hours → "Xh Ym"
function fmtHours(h: number) {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (hrs === 0) return `${mins}m`;
    if (mins === 0) return `${hrs}h`;
    return `${hrs}h ${mins}m`;
}

// Event tag style
const EVENT_STYLE: Record<string, { bg: string; color: string }> = {
    Leave: { bg: "#fef9c3", color: "#ca8a04" },
    Late: { bg: "#fee2e2", color: "#dc2626" },
    WFH: { bg: "#dbeafe", color: "#1d4ed8" },
    Regularized: { bg: "#dcfce7", color: "#16a34a" },
    Permission: { bg: "#ede9fe", color: "#7c3aed" },
};

function eventStyle(type: string) {
    return EVENT_STYLE[type] ?? { bg: "#f3f4f6", color: "#374151" };
}

function fmtEventDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// Period helpers
type DetailPeriod = "thisWeek" | "thisMonth" | "thisYear" | "custom";

function periodRange(p: DetailPeriod, customStart: Date, customEnd: Date): { start: Date; end: Date } {
    const today = new Date();
    if (p === "thisWeek") {
        const dow = today.getDay();
        return { start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow), end: today };
    }
    if (p === "thisMonth") return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today };
    if (p === "thisYear") return { start: new Date(today.getFullYear(), 0, 1), end: today };
    return { start: customStart, end: customEnd };
}

// ─── EmployeeDetailPanel ──────────────────────────────────────────────────────

interface EmpDetailPanelProps {
    member: TeamViewMember;
    managerId: string;
    onClose: () => void;
    styles: ReturnType<typeof useStyles>;
}

const EmployeeDetailPanel: React.FC<EmpDetailPanelProps> = ({ member, managerId, onClose, styles }) => {
    const [period, setPeriod] = useState<DetailPeriod>("thisYear");
    const [customStart, setCustomStart] = useState<Date>(new Date(new Date().getFullYear(), 0, 1));
    const [customEnd, setCustomEnd] = useState<Date>(new Date());
    const [detail, setDetail] = useState<EmployeeDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [historyOpen, setHistoryOpen] = useState(false);

    // Load / reload when period changes
    useEffect(() => {
        const { start, end } = periodRange(period, customStart, customEnd);
        if (period === "custom" && (!customStart || !customEnd || customEnd < customStart)) return;
        setLoading(true);
        getEmployeeDetail(managerId, member.employeeId, start, end)
            .then(setDetail)
            .catch(() => setDetail(null))
            .finally(() => setLoading(false));
    }, [period, customStart, customEnd, member.employeeId, managerId]);

    // Full history items for the drawer
    const historyItems: EmpEvent[] = detail?.fullHistory ?? [];

    return (
        <div className={styles.dpWrap}>
            {/* ── Profile banner */}
            <div className={styles.dpProfileBanner}>
                <div className={styles.dpAvatarCircle} style={{ background: getAvatarColor(member.name) }}>
                    {getInitials(member.name)}
                </div>
                <div className={styles.dpProfileInfo}>
                    <span className={styles.dpName}>{member.name}</span>
                    <span className={styles.dpSub}>
                        {[detail?.profile.jobTitle, detail?.profile.department].filter(Boolean).join(" · ") || member.department}
                    </span>
                    <div className={styles.dpBadgeRow}>
                        {detail?.profile.shiftStart && (
                            <span className={styles.dpBadge}>
                                Shift {fmtShift(detail.profile.shiftStart)}–{fmtShift(detail.profile.shiftEnd)}
                            </span>
                        )}
                        {detail?.profile.officeLocation && (
                            <span className={styles.dpBadge}>{detail.profile.officeLocation}</span>
                        )}
                    </div>
                </div>
                <div className={styles.dpReportsTo}>
                    <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>Reports to</div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#374151" }}>
                        {detail?.profile.managerName ?? "—"}
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
                    <Spinner label="Loading details…" />
                </div>
            ) : !detail ? (
                <div style={{ padding: "24px", color: "#dc2626", fontSize: "13px" }}>Failed to load employee details.</div>
            ) : (
                <div className={styles.dpBody}>
                    {/* ── LEFT column */}
                    <div className={styles.dpLeft}>

                        {/* Period selector */}
                        <div>
                            <div className={styles.dpSectionTitle}>Period</div>
                            <div className={styles.dpPeriodRow}>
                                {(["thisWeek", "thisMonth", "thisYear", "custom"] as DetailPeriod[]).map(p => (
                                    <button
                                        key={p}
                                        className={`${styles.dpPeriodBtn} ${period === p ? styles.dpPeriodBtnActive : ""}`}
                                        onClick={() => setPeriod(p)}
                                    >
                                        {{ thisWeek: "This Week", thisMonth: "This Month", thisYear: "This Year", custom: "Custom" }[p]}
                                    </button>
                                ))}
                            </div>
                            {period === "custom" && (
                                <div style={{ display: "flex", gap: "8px", marginTop: "10px", alignItems: "center" }}>
                                    <input
                                        type="date"
                                        style={{ fontSize: "12px", padding: "5px 8px", borderRadius: "7px", border: "1.5px solid #d1d5db" }}
                                        value={customStart.toISOString().split("T")[0]}
                                        onChange={e => setCustomStart(new Date(e.target.value + "T00:00:00"))}
                                    />
                                    <span style={{ color: "#9ca3af", fontSize: "12px" }}>→</span>
                                    <input
                                        type="date"
                                        style={{ fontSize: "12px", padding: "5px 8px", borderRadius: "7px", border: "1.5px solid #d1d5db" }}
                                        value={customEnd.toISOString().split("T")[0]}
                                        onChange={e => setCustomEnd(new Date(e.target.value + "T00:00:00"))}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Recent exceptions & events */}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                                <span className={styles.dpSectionTitle} style={{ marginBottom: 0 }}>Recent exceptions &amp; events</span>
                                <button
                                    style={{ fontSize: "12px", fontWeight: "600", color: "#0078D4", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                    onClick={() => setHistoryOpen(true)}
                                >
                                    Full history →
                                </button>
                            </div>
                            {detail.recentEvents.length === 0 ? (
                                <div style={{ fontSize: "12px", color: "#9ca3af", padding: "12px 0" }}>No recent events.</div>
                            ) : detail.recentEvents.map((ev, i) => {
                                const es = eventStyle(ev.eventType);
                                return (
                                    <div key={i} className={styles.dpEventRow}>
                                        <span className={styles.dpEventLabel} style={{ background: es.bg, color: es.color }}>
                                            {ev.label}
                                        </span>
                                        <span className={styles.dpEventDetail}>{ev.detail}</span>
                                        <span className={styles.dpEventDate}>{fmtEventDate(ev.eventDate)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Attendance heatmap */}
                        <div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                                <span className={styles.dpSectionTitle} style={{ marginBottom: 0 }}>Attendance heatmap · Last 90 days</span>
                                {detail.stats.attendancePct > 0 && (
                                    <span style={{ fontSize: "12px", fontWeight: "600", color: "#16a34a" }}>
                                        {detail.stats.attendancePct}% on-time
                                    </span>
                                )}
                            </div>
                            <div className={styles.dpHeatGrid}>
                                {detail.heatmap.map((d, i) => (
                                    <div
                                        key={i}
                                        className={styles.dpHeatCell}
                                        title={`${d.date} · ${d.classification}`}
                                        style={{ background: HEAT_COLOR[d.classification] ?? "#e5e7eb" }}
                                    />
                                ))}
                            </div>
                            <div className={styles.dpHeatLegend}>
                                {HEAT_LEGEND.map(l => (
                                    <span key={l.key} className={styles.dpHeatLegendItem}>
                                        <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: HEAT_COLOR[l.key], display: "inline-block" }} />
                                        {l.label}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── RIGHT column */}
                    <div className={styles.dpRight}>

                        {/* Leave balance */}
                        <div>
                            <div className={styles.dpSectionTitle}>Leave balance · {new Date().getFullYear()}</div>
                            {detail.leaveBalance.length === 0 ? (
                                <div style={{ fontSize: "12px", color: "#9ca3af" }}>No leave data.</div>
                            ) : detail.leaveBalance.map(lb => (
                                <div key={lb.leaveType}>
                                    <div className={styles.dpLeaveRow}>
                                        <span className={styles.dpLeaveLabel}>{displayLeaveLabel(lb.leaveType)}</span>
                                        <span className={styles.dpLeaveCount}>{lb.used} / {lb.total > 0 ? lb.total : "—"}</span>
                                    </div>
                                    {lb.total > 0 && (
                                        <div className={styles.dpLeaveBarTrack}>
                                            <div
                                                className={styles.dpLeaveBarFill}
                                                style={{
                                                    width: `${Math.min((lb.used / lb.total) * 100, 100)}%`,
                                                    background: lb.used / lb.total > 0.85 ? "#ef4444" : lb.used / lb.total > 0.6 ? "#f59e0b" : "#0078D4",
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Stats */}
                        <div>
                            <div className={styles.dpSectionTitle}>Stats</div>
                            <div className={styles.dpStatsGrid}>
                                <div className={styles.dpStatCell}>
                                    <span className={styles.dpStatLabel}>Attendance</span>
                                    <span className={styles.dpStatValue}>{detail.stats.attendancePct}%</span>
                                </div>
                                <div className={styles.dpStatCell}>
                                    <span className={styles.dpStatLabel}>Avg hrs/day</span>
                                    <span className={styles.dpStatValue}>{fmtHours(detail.stats.avgHoursPerDay)}</span>
                                </div>
                                <div className={styles.dpStatCell}>
                                    <span className={styles.dpStatLabel}>Late arrivals</span>
                                    <span className={styles.dpStatValue}>{detail.stats.lateArrivals}</span>
                                </div>
                                <div className={styles.dpStatCell}>
                                    <span className={styles.dpStatLabel}>Regularizations</span>
                                    <span className={styles.dpStatValue}>{detail.stats.regularizations}</span>
                                </div>
                            </div>
                            <div style={{ marginTop: "10px", fontSize: "12px", color: "#9ca3af" }}>
                                {detail.stats.presentDays} present / {detail.stats.expectedDays} expected days
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Full history drawer */}
            <Drawer open={historyOpen} onOpenChange={(_, s) => setHistoryOpen(s.open)} position="end" size="small">
                <DrawerHeader>
                    <DrawerHeaderTitle
                        action={<Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setHistoryOpen(false)} />}
                    >
                        Full history · {member.name}
                    </DrawerHeaderTitle>
                </DrawerHeader>
                <DrawerBody>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "12px 0" }}>
                        {historyItems.length === 0 ? (
                            <div style={{ fontSize: "13px", color: "#9ca3af", padding: "24px 0", textAlign: "center" }}>No history found.</div>
                        ) : historyItems.map((ev, i) => {
                            const es = eventStyle(ev.eventType);
                            return (
                                <div key={i} className={styles.dpEventRow}>
                                    <span className={styles.dpEventLabel} style={{ background: es.bg, color: es.color }}>
                                        {ev.label}
                                    </span>
                                    <span className={styles.dpEventDetail}>{ev.detail}</span>
                                    <span className={styles.dpEventDate}>{fmtEventDate(ev.eventDate)}</span>
                                </div>
                            );
                        })}
                    </div>
                </DrawerBody>
            </Drawer>
        </div>
    );
};

// ─── Component ───────────────────────────────────────────────────────────────

const TeamView: React.FC = () => {
    const styles = useStyles();
    const { currentUser } = useAuth();

    const managerId = currentUser?.userID ?? "";
    const dateInputRef = useRef<HTMLInputElement>(null);

    // ── Page-level tab: "list" | "calendar"
    const [pageView, setPageView] = useState<"list" | "calendar">("list");

    // ── Team list state
    const [team, setTeam] = useState<TeamViewMember[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<DisplayStatus | "all">("all");
    const [departmentFilter, setDepartmentFilter] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // ── Calendar drawer state
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerMember, setDrawerMember] = useState<TeamViewMember | null>(null);

    // ── Detail page state (full page replacement)
    const [detailMember, setDetailMember] = useState<TeamViewMember | null>(null);
    const [calMonth, setCalMonth] = useState(new Date().getMonth()); // 0-based
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [calLoading, setCalLoading] = useState(false);
    const [calAttendance, setCalAttendance] = useState<CalendarAttendanceRecord[]>([]);
    const [calLeaves, setCalLeaves] = useState<CalendarLeaveRecord[]>([]);

    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    // ── Location-mismatch expandable card: tracks which member's card is open
    const [expandedMismatchId, setExpandedMismatchId] = useState<string | null>(null);
    const navigate = useNavigate()

    useEffect(() => {
        if (!openMenuId) return;
        const close = () => setOpenMenuId(null);
        document.addEventListener("pointerdown", close);
        return () => document.removeEventListener("pointerdown", close);
    }, [openMenuId]);

    // ── Fetch team
    const fetchTeam = useCallback(async () => {
        if (!managerId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getTeamView(managerId, selectedDate);
            setTeam(data);
        } catch {
            setError("Failed to load team data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [managerId, selectedDate]);



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

    useEffect(() => { fetchTeam(); }, [fetchTeam]);

    // Reset department filter when team data reloads (new date)
    useEffect(() => { setDepartmentFilter("all"); }, [team]);

    // Reset to first page whenever the filter set changes
    useEffect(() => { setCurrentPage(1); }, [search, statusFilter, departmentFilter, selectedDate]);

    // ── Fetch calendar when drawer opens or month changes
    useEffect(() => {
        if (!drawerOpen || !drawerMember) return;
        setCalLoading(true);
        getEmployeeCalendar(managerId, drawerMember.employeeId, calMonth + 1, calYear)
            .then((data) => {
                setCalAttendance(data.attendance);
                setCalLeaves(data.leaves);
            })
            .catch(() => {
                setCalAttendance([]);
                setCalLeaves([]);
            })
            .finally(() => setCalLoading(false));
    }, [drawerOpen, drawerMember, calMonth, calYear, managerId]);

    // ── Date navigation
    function prevDay() { setSelectedDate(d => addDays(d, -1)); }
    function nextDay() { setSelectedDate(d => addDays(d, 1)); }
    function goToday() { setSelectedDate(new Date()); }

    function formatSelectedDate(d: Date): string {
        if (isToday(d)) return `Today · ${d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
        return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
    }

    // ── Open drawer
    function openDrawer(member: TeamViewMember) {
        setDrawerMember(member);
        setCalMonth(selectedDate.getMonth());
        setCalYear(selectedDate.getFullYear());
        setDrawerOpen(true);
    }

    // ── Calendar helpers
    const attendanceMap = new Map<string, CalendarAttendanceRecord>();
    calAttendance.forEach(r => {
        const key = toDateOnly(r.date);
        attendanceMap.set(key, r);
    });

    function buildCalendarDays(): (Date | null)[] {
        const firstDay = new Date(calYear, calMonth, 1);
        const lastDay = new Date(calYear, calMonth + 1, 0);
        const cells: (Date | null)[] = [];
        for (let i = 0; i < firstDay.getDay(); i++) cells.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(calYear, calMonth, d));
        return cells;
    }

    function getLeaveForDay(date: Date): CalendarLeaveRecord | null {
        return calLeaves.find(l => {
            const start = new Date(l.leaveStartDate);
            const end = new Date(l.leaveEndDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            return date >= start && date <= end;
        }) ?? null;
    }

    // ── Departments available in current team load (drives the dropdown)
    const availableDepts = Array.from(
        new Set(team.map(m => m.department).filter((d): d is string => Boolean(d)))
    ).sort();

    // ── Filter + search
    const filtered = team.filter(m => {
        const matchSearch = search === "" ||
            m.name.toLowerCase().includes(search.toLowerCase()) ||
            (m.department ?? "").toLowerCase().includes(search.toLowerCase());
        const status = getMemberDisplayStatus(m, selectedDate);
        const matchFilter = statusFilter === "all" || status === statusFilter;
        const matchDept = departmentFilter === "all" || (m.department ?? "") === departmentFilter;
        return matchSearch && matchFilter && matchDept;
    });

    const statusCounts = {
        active: team.filter(m => getMemberDisplayStatus(m, selectedDate) === "active").length,
        early: team.filter(m => getMemberDisplayStatus(m, selectedDate) === "early").length,
        late: team.filter(m => getMemberDisplayStatus(m, selectedDate) === "late").length,
        "not-checked-in": team.filter(m => getMemberDisplayStatus(m, selectedDate) === "not-checked-in").length,
        "on-leave": team.filter(m => getMemberDisplayStatus(m, selectedDate) === "on-leave").length,
        escalated: team.filter(m => getMemberDisplayStatus(m, selectedDate) === "escalated").length,
        "location-exception": team.filter(m => getMemberDisplayStatus(m, selectedDate) === "location-exception").length,
    };

    const calDays = buildCalendarDays();

    // ── Groups + pagination (list tab)
    const PAGE_SIZE = 20;
    const groups = new Map<string, TeamViewMember[]>();
    filtered.forEach(m => {
        const key = m.name.trim().toLowerCase();
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key)!.push(m);
    });
    const groupEntries = Array.from(groups.entries());
    const totalPages = Math.max(1, Math.ceil(groupEntries.length / PAGE_SIZE));
    const pagedEntries = groupEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // ── Employee detail — full page replacement
    if (detailMember) {
        return (
            <div style={{ display: "flex", flexDirection: "column", minHeight: "100%", background: "transparent" }}>
                {/* Back bar */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "12px 28px", background: "Transparent",
                    borderBottom: "1px solid #e5e7eb",
                }}>
                    <button
                        style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: "14px", fontWeight: "500", color: "#374151", padding: "4px 0",
                        }}
                        onClick={() => setDetailMember(null)}
                    >
                        <ArrowLeft20Regular />
                        Back to Team
                    </button>
                </div>
                {/* Detail content fills remaining height */}
                <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                    <EmployeeDetailPanel
                        member={detailMember}
                        managerId={managerId}
                        onClose={() => setDetailMember(null)}
                        styles={styles}
                    />
                </div>
            </div>
        );
    }

    // ── Calendar tab — render full-page calendar
    if (pageView === "calendar") {
        return (
            <div className={styles.calendarPage}>
                {/* Tab strip */}
                <div className={styles.tabStrip}>
                    <button
                        className={`${styles.tab}`}
                        onClick={() => setPageView("list")}
                    >
                        Team Attendance List
                    </button>
                    <button
                        className={`${styles.tab} ${styles.tabActive}`}
                    >
                        Team Attendance Calendar
                    </button>
                </div>
                <TeamCalendar managerId={managerId} />
            </div>
        );
    }

    return (
        <div className={styles.page}>

            {/* ── Header ──────────────────────────────────────────────── */}
            <div className={styles.header}>
                <div className={styles.headerTop}>
                    <Text className={styles.pageTitle}>Team Attendance List</Text>
                    {/* Tab strip inside header */}
                    <div className={styles.tabStrip} style={{ border: "none", padding: "0", marginLeft: "24px" }}>
                        <button className={`${styles.tab} ${styles.tabActive}`}>
                            Team Attendance List
                        </button>
                        <button
                            className={styles.tab}
                            onClick={() => setPageView("calendar")}
                        >
                            Team Attendance Calendar
                        </button>
                    </div>
                </div>

                <div className={styles.toolbar}>
                    {/* Search */}
                    <div className={styles.searchBox}>
                        <Input
                            contentBefore={<Search20Regular />}
                            placeholder="Search employees..."
                            value={search}
                            onChange={(_, d) => setSearch(d.value)}
                            size="small"
                        />
                    </div>

                    {/* Date nav */}
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button className={styles.dateNavBtn} onClick={prevDay}>
                            <ChevronLeft20Regular />
                        </button>

                        {/* Calendar date picker trigger */}
                        <div style={{ position: "relative" }}>
                            <div
                                className={styles.datePicker}
                                onClick={() => dateInputRef.current?.showPicker()}
                            >
                                <CalendarMonth20Regular />
                                {formatSelectedDate(selectedDate)}
                            </div>
                            <input
                                ref={dateInputRef}
                                type="date"
                                value={selectedDate.toISOString().split("T")[0]}
                                onChange={(e) => {
                                    if (e.target.value) setSelectedDate(new Date(e.target.value + "T00:00:00"));
                                }}
                                style={{
                                    position: "absolute",
                                    opacity: 0,
                                    pointerEvents: "none",
                                    width: "1px",
                                    height: "1px",
                                    top: 0,
                                    left: 0,
                                }}
                            />
                        </div>

                        <button className={styles.dateNavBtn} onClick={nextDay}>
                            <ChevronRight20Regular />
                        </button>

                        {/* Today button — only visible when not on today */}
                        {!isToday(selectedDate) && (
                            <button
                                className={styles.filterBtn}
                                onClick={goToday}
                                style={{ padding: "5px 10px", fontSize: "12px", marginLeft: "4px" }}
                            >
                                Today
                            </button>
                        )}
                    </div>

                    <div className={styles.spacer} />

                    {/* Department filter */}
                    {availableDepts.length > 0 && (
                        <Select
                            size="small"
                            value={departmentFilter}
                            onChange={(_, d) => setDepartmentFilter(d.value)}
                            style={{ minWidth: "140px", maxWidth: "200px" }}
                        >
                            <option value="all">All Departments</option>
                            {availableDepts.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </Select>
                    )}

                    {/* Status filters */}
                    {(["all", "active", "late", "location-exception", "not-checked-in", "on-leave"] as const).map(f => {
                        const isActive = statusFilter === f;
                        const count = f === "all" ? team.length : statusCounts[f];
                        return (
                            <button
                                key={f}
                                className={`${styles.filterBtn} ${isActive ? styles.filterBtnActive : ""}`}
                                onClick={() => setStatusFilter(f)}
                            >
                                {f === "all" ? "All" : STATUS_CONFIG[f].label}
                                {count > 0 && (
                                    <Badge
                                        appearance="filled"
                                        size="small"
                                        style={{
                                            background: isActive ? "#0078D4" : "#e5e7eb",
                                            color: isActive ? "#fff" : "#374151",
                                        }}
                                    >
                                        {count}
                                    </Badge>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Error ───────────────────────────────────────────────── */}
            {error && <div className={styles.errorBanner}>{error}</div>}

            {/* ── List ────────────────────────────────────────────────── */}
            {loading ? (
                <div className={styles.spinnerWrap}><Spinner label="Loading team…" /></div>
            ) : filtered.length === 0 ? (
                <div className={styles.emptyState}>No employees found.</div>
            ) : (
                <div className={styles.listContainer}>
                    {pagedEntries.map(([employeeId, records]) => {
                            const member = records[0];
                            const hasMultiple = records.length > 1;
                            const bg = getAvatarColor(member.name);
                            const shiftLabel = member.shiftStartTime && member.shiftEndTime
                                ? `Shift ${formatShiftTime(member.shiftStartTime)}–${formatShiftTime(member.shiftEndTime)}`
                                : member.shiftName ?? "";
                            const subParts = [member.department, shiftLabel, member.officeLocation].filter(Boolean);
                            const status = getMemberDisplayStatus(member, selectedDate);
                            const cfg = STATUS_CONFIG[status];

                            const mismatchExpanded = status === "location-exception" && expandedMismatchId === employeeId;

                            return (
                              <div key={employeeId} style={{ display: "flex", flexDirection: "column" }}>
                                <div
                                    className={styles.memberCard}
                                    style={{
                                        cursor: 'default',
                                        alignItems: hasMultiple ? 'flex-start' : 'center',
                                        ...(mismatchExpanded ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}),
                                    }}
                                >
                                    {/* Avatar */}
                                    <div className={styles.avatarWrap}>
                                        <div className={styles.avatar} style={{ background: bg }}>
                                            {getInitials(member.name)}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className={styles.memberMeta}>
                                        <div className={styles.memberNameRow}>
                                            <Text className={styles.memberName}>{member.name}</Text>
                                            {!hasMultiple && (
                                                <Badge
                                                    appearance="filled"
                                                    size="small"
                                                    style={{ background: cfg.bg, color: cfg.color, fontWeight: 500 }}
                                                >
                                                    {cfg.label}
                                                </Badge>
                                            )}
                                            {member.workLocationType === "WFH" && !hasMultiple && (
                                                <Badge appearance="outline" size="small" style={{ color: "#0078D4" }}>
                                                    WFH
                                                </Badge>
                                            )}
                                            {member.leaveTypeName && (
                                                <Badge appearance="outline" size="small" style={{ color: "#ca8a04" }}>
                                                    {displayLeaveLabel(member.leaveTypeName)}
                                                </Badge>
                                            )}
                                        </div>
                                        <Text className={styles.memberSubtext}>{subParts.join(" · ")}</Text>

                                        {/* Multiple sessions: show each inline */}
                                        {hasMultiple && (
                                            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "5px" }}>
                                                {records.map((rec, idx) => {
                                                    const recStatus = getMemberDisplayStatus(rec, selectedDate);
                                                    const recCfg = STATUS_CONFIG[recStatus];
                                                    return (
                                                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                            <Badge
                                                                appearance="filled"
                                                                size="small"
                                                                style={{ background: recCfg.bg, color: recCfg.color, fontWeight: 500 }}
                                                            >
                                                                {recCfg.label}
                                                            </Badge>
                                                            {rec.workLocationType === "WFH" && (
                                                                <Badge appearance="outline" size="small" style={{ color: "#0078D4" }}>
                                                                    WFH
                                                                </Badge>
                                                            )}
                                                            <Text style={{ fontSize: "12px", color: "#374151" }}>
                                                                {rec.checkIn
                                                                    ? `In ${formatTime(rec.checkIn)}${rec.checkOut ? ` – Out ${formatTime(rec.checkOut)}` : ""}`
                                                                    : "—"}
                                                            </Text>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right side */}
                                    <div className={styles.memberRight}>
                                        {/* Three-dots menu */}
                                        <div style={{ position: "relative" }} onPointerDown={e => e.stopPropagation()}>
                                            <button
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    padding: "6px",
                                                    borderRadius: "8px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    color: "#6b7280",
                                                }}
                                                onClick={() => setOpenMenuId(
                                                    openMenuId === member.employeeId ? null : member.employeeId
                                                )}
                                            >
                                                <MoreHorizontal20Regular />
                                            </button>

                                            {openMenuId === member.employeeId && (
                                                <div style={{
                                                    position: "absolute",
                                                    right: 0,
                                                    top: "calc(100% + 4px)",
                                                    zIndex: 9999,
                                                    background: "#ffffff",
                                                    border: "1px solid #e5e7eb",
                                                    borderRadius: "8px",
                                                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                                                    minWidth: "172px",
                                                    overflow: "hidden",
                                                }}>
                                                    {[
                                                        { label: "View User Details", action: () => { setOpenMenuId(null); setDetailMember(member); } },
                                                        { label: "View User Calendar", action: () => { setOpenMenuId(null); openDrawer(member); } },
                                                    ].map(({ label, action }) => (
                                                        <div
                                                            key={label}
                                                            onClick={action}
                                                            style={{
                                                                padding: "10px 16px",
                                                                fontSize: "13px",
                                                                color: "#111827",
                                                                cursor: "pointer",
                                                                userSelect: "none",
                                                                whiteSpace: "nowrap",
                                                            }}
                                                            onPointerEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                                                            onPointerLeave={e => (e.currentTarget.style.background = "transparent")}
                                                        >
                                                            {label}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Single record: time/status details on the right */}
                                        {!hasMultiple && (
                                            status === "on-leave" ? (
                                                <>
                                                    <Text className={styles.checkTime}>{member?.halfDay === true ? (member?.halfSession === "1" ? "First Half" : "Second Half") : "Full day"}</Text>
                                                    {member?.halfDay === true && member?.halfSession === "1" ? (
                                                        // First-half leave: employee is back the same day for the second half
                                                        <Text className={styles.fullDay}>Returns today · Second Half</Text>
                                                    ) : (
                                                        member.leaveEndDate && !isNaN(new Date(member.leaveEndDate).getTime()) && (
                                                            <Text className={styles.fullDay}>
                                                                Returns {new Date(member.leaveEndDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                                            </Text>
                                                        )
                                                    )}
                                                </>
                                            ) : member.checkIn ? (
                                                <>
                                                    <Text className={styles.checkTime}>Check-in {formatTime(member.checkIn)}</Text>
                                                    {status === "active" && <Text className={styles.onTime}>On-time</Text>}
                                                    {status === "late" && <Text className={styles.lateArrival}>Late arrival</Text>}
                                                    {status === "location-exception" && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExpandedMismatchId(prev => prev === employeeId ? null : employeeId);
                                                            }}
                                                            style={{
                                                                display: "inline-flex", alignItems: "center", gap: "5px",
                                                                background: mismatchExpanded ? "#fef3c7" : "transparent",
                                                                border: "1px solid", borderColor: mismatchExpanded ? "#fcd34d" : "transparent",
                                                                borderRadius: "999px", padding: "2px 8px",
                                                                fontSize: "12px", fontWeight: 500, color: "#b45309",
                                                                cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
                                                            }}
                                                            onPointerEnter={e => { if (!mismatchExpanded) e.currentTarget.style.background = "#fffbeb"; }}
                                                            onPointerLeave={e => { if (!mismatchExpanded) e.currentTarget.style.background = "transparent"; }}
                                                            title="View assigned & recorded location"
                                                        >
                                                            <Warning20Filled style={{ fontSize: "14px", color: "#f59e0b" }} />
                                                            Check-in Location Mismatch
                                                            <ChevronDown20Regular
                                                                style={{ fontSize: "14px", transition: "transform 0.15s", transform: mismatchExpanded ? "rotate(180deg)" : "none" }}
                                                            />
                                                        </button>
                                                    )}
                                                </>
                                            ) : status === "escalated" ? (
                                                <>
                                                    <Text className={styles.escalated}>Escalated</Text>
                                                    {member.shiftStartTime && (
                                                        <Text className={styles.fullDay}>{formatShiftTime(member.shiftStartTime)}</Text>
                                                    )}
                                                </>
                                            ) : (
                                                <Text className={styles.fullDay}>—</Text>
                                            )
                                        )}
                                    </div>
                                </div>

                                {/* Location-mismatch expandable card */}
                                {mismatchExpanded && (
                                    <div
                                        style={{
                                            border: "1px solid #fcd34d",
                                            borderTop: "none",
                                            borderBottomLeftRadius: "12px",
                                            borderBottomRightRadius: "12px",
                                            background: "linear-gradient(180deg, #fffbeb 0%, #ffffff 100%)",
                                            padding: "14px 20px 16px",
                                            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "10px",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <Warning20Filled style={{ fontSize: "15px", color: "#f59e0b" }} />
                                            <Text style={{ fontSize: "12px", fontWeight: 600, color: "#92400e", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                                Location Mismatch at Check-in
                                            </Text>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                            {/* Assigned location */}
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px" }}>
                                                <div style={{ flexShrink: 0, width: "28px", height: "28px", borderRadius: "8px", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Building20Regular style={{ fontSize: "16px", color: "#059669" }} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <Text style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>Assigned</Text>
                                                    <Text style={{ fontSize: "13px", fontWeight: 600, color: "#065f46", wordBreak: "break-word" }}>
                                                        {member.officeLocation ?? "Not available"}
                                                    </Text>
                                                </div>
                                            </div>

                                            {/* Recorded location */}
                                            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 12px", background: "#fff1f2", border: "1px solid #fecaca", borderRadius: "10px" }}>
                                                <div style={{ flexShrink: 0, width: "28px", height: "28px", borderRadius: "8px", background: "#fee2e2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <Location20Regular style={{ fontSize: "16px", color: "#dc2626" }} />
                                                </div>
                                                <div style={{ minWidth: 0 }}>
                                                    <Text style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "#dc2626", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "2px" }}>Recorded</Text>
                                                    <Text style={{ fontSize: "13px", fontWeight: 600, color: "#991b1b", wordBreak: "break-word" }}>
                                                        {member.recordedLocation ?? "Not captured"}
                                                    </Text>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                              </div>
                            );
                    })}
                </div>
            )}

            {/* ── Pagination ───────────────────────────────────────────── */}
            {!loading && totalPages > 1 && (
                <div style={{
                    display: "flex", justifyContent: "center", alignItems: "center",
                    gap: "12px", padding: "14px 28px",
                    borderTop: "1px solid #e5e7eb", background: "rgba(255,255,255,0.7)",
                    flexShrink: 0,
                }}>
                    <button
                        className={styles.dateNavBtn}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
                    >
                        <ChevronLeft20Regular />
                    </button>
                    <span style={{ fontSize: "13px", color: "#374151" }}>
                        Page {currentPage} of {totalPages} &nbsp;·&nbsp; {groupEntries.length} employees
                    </span>
                    <button
                        className={styles.dateNavBtn}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
                    >
                        <ChevronRight20Regular />
                    </button>
                </div>
            )}

            {/* ── Calendar Drawer ──────────────────────────────────────── */}
            <Drawer
                open={drawerOpen}
                onOpenChange={(_, s) => setDrawerOpen(s.open)}
                position="end"
                size="medium"
            >
                <DrawerHeader>
                    <DrawerHeaderTitle
                        action={
                            <Button
                                appearance="subtle"
                                icon={<Dismiss24Regular />}
                                onClick={() => setDrawerOpen(false)}
                            />
                        }
                    >
                        {drawerMember?.name ?? "Employee"}
                    </DrawerHeaderTitle>
                </DrawerHeader>

                <DrawerBody>
                    {drawerMember && (
                        <div className={styles.drawerContent}>

                            {/* Member summary */}
                            <div className={styles.drawerMemberInfo}>
                                <div style={{
                                    width: "48px", height: "48px", borderRadius: "50%",
                                    background: getAvatarColor(drawerMember.name),
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "16px", fontWeight: "600", color: "#fff", flexShrink: 0,
                                }}>
                                    {getInitials(drawerMember.name)}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                    <Text style={{ fontSize: "15px", fontWeight: "600" }}>{drawerMember.name}</Text>
                                    <Text style={{ fontSize: "12px", color: "#6b7280" }}>
                                        {[drawerMember.department, drawerMember.shiftName].filter(Boolean).join(" · ")}
                                    </Text>
                                </div>
                            </div>

                            {/* Calendar nav */}
                            <div className={styles.calendarNav}>
                                <button className={styles.dateNavBtn} onClick={() => {
                                    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); }
                                    else setCalMonth(m => m - 1);
                                }}>
                                    <ChevronLeft20Regular />
                                </button>
                                <Text className={styles.calendarMonthLabel}>
                                    {MONTH_NAMES[calMonth]} {calYear}
                                </Text>
                                <button className={styles.dateNavBtn} onClick={() => {
                                    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); }
                                    else setCalMonth(m => m + 1);
                                }}>
                                    <ChevronRight20Regular />
                                </button>
                            </div>

                            {/* Legend */}
                            <div className={styles.calLegend}>
                                {[
                                    { color: "#dcfce7", label: "Present" },
                                    { color: "#fee2e2", label: "Absent" },
                                    { color: "#fef9c3", label: "Leave / Late" },
                                    { color: "#ede9fe", label: "Location exc." },
                                    { color: "#f9fafb", label: "Weekend" },
                                ].map(l => (
                                    <span key={l.label} className={styles.calLegendItem}>
                                        <span className={styles.calLegendDot} style={{ background: l.color, border: "1px solid #e5e7eb" }} />
                                        {l.label}
                                    </span>
                                ))}
                            </div>

                            {/* Calendar */}
                            {calLoading ? (
                                <div className={styles.drawerSpinner}><Spinner size="small" /></div>
                            ) : (
                                <div className={styles.calendarGrid}>
                                    {/* Day headers */}
                                    {DAY_HEADERS.map(d => (
                                        <div key={d} className={styles.calDayHeader}>{d}</div>
                                    ))}

                                    {/* Empty cells + day cells */}
                                    {calDays.map((date, idx) => {
                                        if (!date) {
                                            return <div key={`empty-${idx}`} />;
                                        }

                                        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                                        const rec = attendanceMap.get(key);
                                        const leave = getLeaveForDay(date);
                                        const dayStyle = getCalDayStyle(date, attendanceMap, calLeaves);
                                        const isCurrentDay = isToday(date);

                                        return (
                                            <div
                                                key={key}
                                                className={styles.calDay}
                                                style={{
                                                    ...dayStyle,
                                                    border: isCurrentDay ? "2px solid #0078D4" : "1px solid transparent",
                                                }}
                                            >
                                                <span
                                                    className={styles.calDayNum}
                                                    style={{ color: isCurrentDay ? "#0078D4" : undefined, fontWeight: isCurrentDay ? "700" : "500" }}
                                                >
                                                    {date.getDate()}
                                                </span>

                                                {leave && (
                                                    <span className={styles.calTimeText} style={{ color: "#ca8a04" }}>
                                                        {displayLeaveLabel(leave.leaveTypeName)?.replace(" Leave", "") ?? "Leave"}
                                                    </span>
                                                )}

                                                {!leave && rec?.checkIn && (
                                                    <span className={styles.calTimeText}>
                                                        {formatTime(rec.checkIn)}
                                                        {rec.checkOut ? `\n${formatTime(rec.checkOut)}` : ""}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </DrawerBody>
            </Drawer>
        </div>
    );
};

export default TeamView;
