import React, { useEffect, useState } from "react";
import { makeStyles, mergeClasses, Text, Spinner } from "@fluentui/react-components";
import { displayLeaveLabel } from "../Utils/leaveUtils";
import MyAttendancePanel from "./MyAttendancePanel";
import {
    CheckmarkCircle20Filled,
    CalendarLtr20Regular,
    ClockAlarm20Regular,
    CalendarCheckmark20Regular,
    LockClosed20Regular,
    Lightbulb20Regular,
} from "@fluentui/react-icons";
import { getAttendanceInsights } from "../../Services/AiInsights";
import { AttendanceInsightsData } from "../../Types/aiInsights";
import { useAuth } from "../../Auth/AuthProvider";
import { getStoredAuthToken } from "../../Auth/tokenStorage";
import { useNavigate } from "react-router-dom";
import {
    getManagerDashboard,
    TeamMember,
    PendingCounts,
} from "../Services/ManagerDashboardService";
import {
    getPendingApprovals,
    getPendingPermissionRequests,
} from "../Services/AttendanceService";
import { getPendingLeaveApprovals } from "../../Services/LeaveRequestService";
import { getPendingRegularizationRequests } from "../Services/RegularizationService";
import AttendanceDashboard from "./AttendanceDashboard";

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
    page: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "28px 32px",
        minHeight: "100%",
        "@media (max-width: 768px)": {
            padding: "12px"
        }
    },
    topBar: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
    },
    greetingBlock: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    greetingText: {
        fontSize: "26px",
        fontWeight: "700",
        color: "#1a1a1a",
        lineHeight: "1.2",
    },
    greetingMeta: {
        fontSize: "13px",
        color: "#6b7280",
        marginTop: "2px",
    },
    pendingCard: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 16px",
        borderRadius: "10px",
        border: "1.5px solid #e5e7eb",
        background: "#fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        whiteSpace: "nowrap",
    },
    pendingCardLeft: {
        display: "flex",
        flexDirection: "column" as const,
        gap: "1px",
    },
    pendingCardLabel: {
        fontSize: "11px",
        color: "#6b7280",
        fontWeight: "500",
    },
    pendingCardCount: {
        fontSize: "20px",
        fontWeight: "700",
        color: "#111827",
        lineHeight: "1",
    },
    pendingDivider: {
        width: "1px",
        height: "32px",
        background: "#e5e7eb",
    },
    viewAllBtn: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#0078D4",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0",
    },
    statsRow: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "14px",
        "@media (max-width: 900px)": { gridTemplateColumns: "repeat(2, 1fr)" },
        "@media (max-width: 600px)": { gridTemplateColumns: "1fr" },
    },
    twoCol: {
        display: "grid",
        gridTemplateColumns: "repeat(2,1fr)",
        gap:"14px",
        "@media (max-width: 600px)": { gridTemplateColumns: "1fr" },
    },
    statCard: {
        background: "#fff",
        borderRadius: "14px",
        padding: "20px 22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
    },
    statCardHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    statIconBox: {
        width: "38px",
        height: "38px",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    statLabel: {
        fontSize: "13px",
        color: "#6b7280",
        fontWeight: "400",
    },
    statValue: {
        fontSize: "28px",
        fontWeight: "700",
        color: "#111827",
        lineHeight: "1",
    },
    statMeta: {
        fontSize: "12px",
        color: "#6b7280",
    },
    statMetaGreen: {
        fontSize: "12px",
        color: "#16a34a",
        fontWeight: "500",
    },
    statMetaRed: {
        fontSize: "12px",
        color: "#dc2626",
        fontWeight: "500",
    },
    mainRow: {
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: "16px",
        alignItems: "start",
        "@media (max-width: 900px)": { gridTemplateColumns: "1fr" },
    },
    card: {
        background: "#fff",
        borderRadius: "14px",
        padding: "22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    cardHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
    },
    cardTitle: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#111827",
    },
    legendRow: {
        display: "flex",
        gap: "16px",
        alignItems: "center",
        flexWrap: "wrap",
    },
    legendItem: {
        display: "flex",
        gap: "5px",
        alignItems: "center",
        fontSize: "12px",
        color: "#6b7280",
    },
    dot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        display: "inline-block",
    },
    teamGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
        "@media (max-width: 600px)": { gridTemplateColumns: "1fr" },
    },
    memberRow: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1.5px solid #e5e7eb",
        background: "#fafafa",
    },
    memberInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "1px",
        minWidth: "0",
    },
    memberName: {
        fontSize: "13px",
        fontWeight: "500",
        color: "#111827",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    memberStatus: {
        fontSize: "11px",
        color: "#6b7280",
    },
    approvalsCard: {
        background: "#fff",
        borderRadius: "14px",
        padding: "22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    approvalGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "10px",
    },
    approvalCell: {
        background: "#f9fafb",
        borderRadius: "10px",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    approvalCellLabel: {
        fontSize: "12px",
        color: "#6b7280",
    },
    approvalCellCount: {
        fontSize: "22px",
        fontWeight: "700",
        color: "#111827",
    },
    reviewBtn: {
        width: "100%",
        padding: "12px",
        borderRadius: "10px",
        border: "none",
        background: "#0078D4",
        color: "#fff",
        fontSize: "14px",
        fontWeight: "600",
        cursor: "pointer",
    },
    spinnerWrap: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "60px 0",
    },
    tabStrip: {
        display: "flex",
        gap: "4px",
        background: "#f3f4f6",
        borderRadius: "10px",
        padding: "4px",
    },
    tab: {
        padding: "8px 18px",
        border: "none",
        background: "none",
        fontSize: "13px",
        fontWeight: "500",
        color: "#6b7280",
        cursor: "pointer",
        borderRadius: "8px",
    },
    tabActive: {
        background: "#fff",
        color: "#0078D4",
        fontWeight: "600",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    emptyState: {
        textAlign: "center",
        padding: "24px",
        color: "#6b7280",
        fontSize: "13px",
    },
    // ── Team Availability (new design)
    availCard: {
        background: "#fff",
        borderRadius: "14px",
        padding: "24px 26px 0 26px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        justifyContent:"space-between",
        gap: "0",
    },
    availHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "10px",
    },
    availHeaderOuter: {
        display: "flex",
        flexDirection: "column",
        gap:"3px"
    },
    availLegendRow: {
        display: "flex",
        gap: "14px",
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: "18px",
        paddingBottom: "14px",
        borderBottom: "1px solid #f3f4f6",
    },
    availLegendItem: {
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "11px",
        color: "#6b7280",
        fontWeight: "500",
    },
    availLegendDot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        flexShrink: 0,
    },
    availTitleRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    availTitle: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#111827",
    },
    livePill: {
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "12px",
        fontWeight: "500",
        color: "#16a34a",
    },
    liveDot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: "#16a34a",
    },
    asOfTime: {
        fontSize: "12px",
        color: "#9ca3af",
    },
    availSection: {
        paddingBottom: "20px",
    },
    availSectionHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "14px",
    },
    availSectionLeft: {
        display: "flex",
        alignItems: "center",
        gap: "7px",
    },
    sectionIndicator: {
        width: "9px",
        height: "9px",
        borderRadius: "50%",
        flexShrink: 0,
    },
    availSectionLabel: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#374151",
    },
    availSectionCount: {
        fontSize: "12px",
        color: "#9ca3af",
    },
    avatarScroll: {
        display: "flex",
        gap: "20px",
        overflowX: "auto",
        paddingBottom: "8px",
        paddingTop: "2px",
    },
    avatarCard: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        minWidth: "100px",
        flexShrink: 0,
        justifyContent:'space-between'
    },
    avatarWrap: {
        position: "relative",
        width: "52px",
        height: "52px",
        flexShrink: 0,
    },
    avatarCircle: {
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
        fontWeight: "700",
        color: "#fff",
    },
    avatarStatusDot: {
        position: "absolute",
        bottom: "1px",
        right: "1px",
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        border: "2px solid #fff",
    },
    avatarName: {
        fontSize: "12px",
        fontWeight: "500",
        color: "#111827",
        textAlign: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "68px",
    },
    avatarStatusText: {
        fontSize: "11px",
        color: "#6b7280",
        textAlign: "center",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "68px",
    },
    availDivider: {
        height: "1px",
        background: "#f3f4f6",
        margin: "0 -26px 20px -26px",
    },
    availFooter: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderTop: "1px solid #f3f4f6",
        margin: "0 -26px",
        padding: "14px 26px",
    },
    moreLabel: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        color: "#6b7280",
    },
    viewFullTeam: {
        fontSize: "13px",
        fontWeight: "600",
        color: "#0078D4",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "0",
    },
    errorBanner: {
        background: "#fef2f2",
        border: "1px solid #fecaca",
        borderRadius: "10px",
        padding: "12px 16px",
        fontSize: "13px",
        color: "#dc2626",
    },
    insightsCard: {
        background: "#fff",
        borderRadius: "14px",
        padding: "22px 26px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    insightsHeader: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    insightsTitle: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#111827",
    },
    insightsBadge: {
        fontSize: "11px",
        fontWeight: "600",
        color: "#6d28d9",
        background: "#ede9fe",
        borderRadius: "8px",
        padding: "2px 8px",
    },
    insightBox: {
        display: "flex",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "10px",
        alignItems: "flex-start",
        border: "1px solid transparent",
    },
    insightIcon: {
        fontSize: "18px",
        lineHeight: "1",
        flexShrink: 0,
        marginTop: "1px",
    },
    insightText: {
        fontSize: "13px",
        color: "#374151",
        lineHeight: "1.55",
        flex: "1",
    },
    teamAvatarGrid: {
        display: "flex",
        flexWrap: "wrap",
        gap: "16px 20px",
        paddingBottom: "8px",
    },
    pageDotsRow: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "6px",
        paddingBottom: "16px",
    },
    pageDot: {
        width: "7px",
        height: "7px",
        borderRadius: "50%",
        background: "#d1d5db",
        border: "none",
        padding: "0",
        cursor: "pointer",
        flexShrink: 0,
        transition: "background 0.2s, transform 0.2s",
    },
    pageDotActive: {
        background: "#0078D4",
        transform: "scale(1.3)",
    },
    needAttentionCard: {
        background: "#fff",
        borderRadius: "14px",
        padding: "22px 26px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
    },
    needAttentionHeader: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    needAttentionTitle: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#111827",
    },
    needAttentionCount: {
        fontSize: "12px",
        color: "#fff",
        background: "#ef4444",
        borderRadius: "10px",
        padding: "1px 8px",
        fontWeight: "600",
    },
    attentionList: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    attentionItem: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "10px 14px",
        borderRadius: "10px",
        border: "1.5px solid #fee2e2",
        background: "#fff8f8",
    },
    attentionAvatarWrap: {
        position: "relative",
        width: "38px",
        height: "38px",
        flexShrink: 0,
    },
    attentionAvatarCircle: {
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: "700",
        color: "#fff",
    },
    attentionAvatarDot: {
        position: "absolute",
        bottom: "1px",
        right: "1px",
        width: "10px",
        height: "10px",
        borderRadius: "50%",
        border: "2px solid #fff8f8",
    },
    attentionInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
        flex: "1",
        minWidth: "0",
    },
    attentionName: {
        fontSize: "13px",
        fontWeight: "500",
        color: "#111827",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    attentionReason: {
        fontSize: "11px",
        color: "#6b7280",
    },
    attentionReasonBadge: {
        fontSize: "11px",
        fontWeight: "600",
        padding: "2px 10px",
        borderRadius: "6px",
        whiteSpace: "nowrap",
        flexShrink: 0,
    },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    "#0078D4", "#107C10", "#D83B01", "#8764B8",
    "#038387", "#C19C00", "#881798", "#00B294",
];

function getActionStyle(severity: "high" | "medium" | "low"): { icon: string; bg: string; border: string } {
    if (severity === "high")   return { icon: "🔴", bg: "#FFF1F2", border: "#FECDD3" };
    if (severity === "medium") return { icon: "⚠️", bg: "#FFFBEB", border: "#FDE68A" };
    return { icon: "💡", bg: "#EFF6FF", border: "#DBEAFE" };
}

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

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

// Short name: "Sneha Krishnamurthy" → "Sneha K."
function shortName(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length < 2) return name;
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

// Status dot colour for the flat team grid
function getMemberDotColor(m: TeamMember): string {
    if (m.isOnLeave) return "#f97316";
    if (!m.checkIn) return "#9ca3af";
    if (m.violationType === "Location" || m.violationType === "Both") return "#8764B8";
    if (m.violationType === "Late") return "#ca8a04";
    if (m.violationType === "Early") return "#0284c7";
    return "#16a34a";
}

// Short status label under avatar in flat grid
function getMemberStatusText(m: TeamMember): string {
    if (m.isOnLeave) return displayLeaveLabel(m.leaveType) ?? "On leave";
    if (!m.checkIn && hasShiftStarted(m.startTime)) return "Absent";
    if (m.violationType === "Both") return "Late · Loc";
    if (m.violationType === "Late") return "Late";
    if (m.violationType === "Location") return "Loc Exc.";
    if (m.violationType === "Early") return "Early";
    return formatTime(m.checkIn);
}


function shiftStartMinutes(t: string | null): number | null {
    if (!t) return null;
    if (t.includes("T")) {
        const d = new Date(t);
        return d.getUTCHours() * 60 + d.getUTCMinutes();
    }
    const [h, m] = t.split(":");
    return parseInt(h, 10) * 60 + parseInt(m, 10);
}


function hasShiftStarted(startTime: string | null): boolean {
    const startMins = shiftStartMinutes(startTime);
    if (startMins === null) return true;
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes() >= startMins;
}


function isNeedAttention(m: TeamMember): boolean {
    if (m.isOnLeave) return true;
    if (!m.checkIn) return hasShiftStarted(m.startTime);
    return false;
}

type AttentionReason = "unannounced" | "on-leave";

function getAttentionReason(m: TeamMember): AttentionReason {
    if (m.isOnLeave) return "on-leave";
    return "unannounced";
}

// ─── Component ───────────────────────────────────────────────────────────────

const ManagerDashboard: React.FC = () => {
    const styles = useStyles();
    const { currentUser } = useAuth();
    const nav = useNavigate();

    const [activeTab, setActiveTab] = useState<"dashboard" | "myAttendance">("dashboard");
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [pendingCounts, setPendingCounts] = useState<PendingCounts>({
        PendingLeaveCount: 0,
        PendingPermissionCount: 0,
        PendingLocationCount: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [asOfTime, setAsOfTime] = useState("");
    const [realPendingTotal, setRealPendingTotal] = useState(0);
    const [insights, setInsights] = useState<AttendanceInsightsData | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);
    const [teamPage, setTeamPage] = useState(0);

    const TEAM_PAGE_SIZE = 10;

    const managerId = currentUser?.userID ?? "";
    const displayName = currentUser?.displayName || currentUser?.email || "Manager";
    const greeting = getGreeting();
    const today = new Date();
    const todayLabel = today.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    useEffect(() => {
        if (!managerId) return;
        setLoading(true);
        setError(null);
        getManagerDashboard(managerId)
            .then((data) => {
                setTeam(data.team);
                setPendingCounts(data.pendingCounts);
                setAsOfTime(new Date().toLocaleTimeString("en-IN", {
                    hour: "2-digit", minute: "2-digit", hour12: true,
                }));
            })
            .catch(() => setError("Failed to load dashboard data. Please try again."))
            .finally(() => setLoading(false));
    }, [managerId]);

    useEffect(() => {
        if (!managerId) return;

        const fetchPendingTotal = () => {
            Promise.allSettled([
                // getPendingApprovals(managerId),
                getPendingPermissionRequests(managerId),
                getPendingLeaveApprovals(managerId),
                getPendingRegularizationRequests(managerId),
            ]).then(([
                // locRes, 
                permRes, leaveRes, regRes]) => {
                let total = 0;
                // if (locRes.status === "fulfilled") total += (locRes.value ?? []).length;
                if (permRes.status === "fulfilled") total += (permRes.value ?? []).length;
                if (leaveRes.status === "fulfilled") total += (leaveRes.value ?? []).length;
                if (regRes.status === "fulfilled") total += ((regRes.value as any)?.data ?? []).length;
                setRealPendingTotal(total);
            });
        };

        fetchPendingTotal();
        const interval = setInterval(fetchPendingTotal, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, [managerId]);

    useEffect(() => {
        if (!managerId) return;
        const token = getStoredAuthToken();
        if (!token) return;
        setInsightsLoading(true);
        getAttendanceInsights(token, { managerId })
            .then((res) => { if (res.success) setInsights(res.data); })
            .catch(() => {})
            .finally(() => setInsightsLoading(false));
    }, [managerId]);

    // ── Derived stats ────────────────────────────────────────────────────────
    const totalTeam = team.length;
    const presentCount = team.filter((m) => m.checkIn !== null).length;

    return (
        <div className={styles.page}>

            {/* ── Top bar ─────────────────────────────────────────────────── */}
            <div className={styles.topBar}>
                <div className={styles.greetingBlock}>
                    <Text className={styles.greetingText}>
                        {greeting}, {displayName.split(" ")[0]}
                    </Text>
                    <Text className={styles.greetingMeta}>
                        {todayLabel}
                        {totalTeam > 0 && ` · ${totalTeam} team member${totalTeam !== 1 ? "s" : ""}`}
                    </Text>
                </div>

                {/* ── Tab strip (inline) ─────────────────────────────────── */}
                <div className={styles.tabStrip}>
                    <button
                        className={`${styles.tab} ${activeTab === "dashboard" ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab("dashboard")}
                    >
                        Dashboard
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === "myAttendance" ? styles.tabActive : ""}`}
                        onClick={() => setActiveTab("myAttendance")}
                    >
                        My Attendance
                    </button>
                </div>

                <div className={styles.pendingCard}>
                    <CalendarCheckmark20Regular style={{ color: "#0078D4", flexShrink: 0 }} />
                    <div className={styles.pendingCardLeft}>
                        <span className={styles.pendingCardLabel}>Pending Requests</span>
                        <span className={styles.pendingCardCount}>
                            {realPendingTotal}
                            {realPendingTotal > 0 && (
                                <span style={{ fontSize: "11px", color: "#dc2626", fontWeight: "600", marginLeft: "5px" }}>
                                    new
                                </span>
                            )}
                        </span>
                    </div>
                    <span className={styles.pendingDivider} />
                    <button
                        className={styles.viewAllBtn}
                        onClick={() => nav("/Attendance/Approvals")}
                    >
                        View all →
                    </button>
                </div>
            </div>

            {/* ── My Attendance tab ───────────────────────────────────────── */}
            {activeTab === "myAttendance" && <AttendanceDashboard isGreetingVisible={false} />}

            {/* ── Dashboard tab ───────────────────────────────────────────── */}
            {activeTab === "dashboard" && <>

            {/* ── Error ───────────────────────────────────────────────────── */}
            {error && <div className={styles.errorBanner}>{error}</div>}

            {/* ── Loading ─────────────────────────────────────────────────── */}
            {loading ? (
                <div className={styles.spinnerWrap}>
                    <Spinner label="Loading dashboard…" />
                </div>
            ) : (
                <>
                    {/* ── Stat cards (3) ───────────────────────────────────── */}
                    <div className={styles.statsRow}>

                        <div className={styles.statCard}>
                            <div className={styles.statCardHeader}>
                                <Text className={styles.statLabel}>Present Today</Text>
                                <div className={styles.statIconBox} style={{ background: "#dcfce7" }}>
                                    <CheckmarkCircle20Filled style={{ color: "#16a34a" }} />
                                </div>
                            </div>
                            <Text className={styles.statValue}>
                                {presentCount}
                                {totalTeam > 0 && (
                                    <span style={{ fontSize: "16px", color: "#6b7280", fontWeight: "500" }}>
                                        /{totalTeam}
                                    </span>
                                )}
                            </Text>
                            {totalTeam > 0 && presentCount > 0 && (
                                <Text className={styles.statMetaGreen}>
                                    ▲ {Math.round((presentCount / totalTeam) * 100)}% attendance rate
                                </Text>
                            )}
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statCardHeader}>
                                <Text className={styles.statLabel}>Permission</Text>
                                <div className={styles.statIconBox} style={{ background: "#fef9c3" }}>
                                    <ClockAlarm20Regular style={{ color: "#ca8a04" }} />
                                </div>
                            </div>
                            <Text className={styles.statValue}>{pendingCounts.PendingPermissionCount}</Text>
                            <Text className={styles.statMeta}>Awaiting your approval</Text>
                        </div>

                        <div className={styles.statCard}>
                            <div className={styles.statCardHeader}>
                                <Text className={styles.statLabel}>Leave</Text>
                                <div className={styles.statIconBox} style={{ background: "#fff7ed" }}>
                                    <CalendarLtr20Regular style={{ color: "#f97316" }} />
                                </div>
                            </div>
                            <Text className={styles.statValue}>{pendingCounts.PendingLeaveCount}</Text>
                            <Text className={styles.statMeta}>Awaiting your approval</Text>
                        </div>

                    </div>

                    <div className={styles.twoCol}>

                   

                    {/* ── Team availability (flat — all members) ────────────── */}
                    <div className={styles.availCard}>
                        {/* Header */}
                        <div className={styles.availHeaderOuter}>
                        <div className={styles.availHeader}>
                            <div className={styles.availTitleRow}>
                                <Text className={styles.availTitle}>Live Team Status</Text>
                                <span className={styles.livePill}>
                                    <span className={styles.liveDot} />
                                    Live
                                </span>
                            </div>
                            {asOfTime && (
                                <span className={styles.asOfTime}>As of {asOfTime}</span>
                            )}
                        </div>
                        

                        {/* Legend */}
                        <div className={styles.availLegendRow}>
                            {[
                                { color: "#16a34a", label: "Checked in" },
                                { color: "#ca8a04", label: "Late" },
                                // { color: "#f97316", label: "On leave" },
                                { color: "#8764B8", label: "Loc exception" },
                                // { color: "#9ca3af", label: "Absent" },
                            ].map(({ color, label }) => (
                                <span key={label} className={styles.availLegendItem}>
                                    <span className={styles.availLegendDot} style={{ background: color }} />
                                    {label}
                                </span>
                            ))}
                        </div>

                        </div>

                        {team.length === 0 ? (
                            <div className={styles.emptyState}>No team members found for today.</div>
                        ) : (
                            <>
                                {/* All team members flat */}
                                {(() => {
                                    const sortedMembers = [...new Map(team.map(m => [m.userId ?? m.name, m])).values()]
                                        .sort((a, b) => {
                                            if (a.checkIn && b.checkIn) return new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime();
                                            if (a.checkIn) return -1;
                                            if (b.checkIn) return 1;
                                            return 0;
                                        })
                                        .filter((item) => item.userId !== null);
                                    const totalPages = Math.ceil(sortedMembers.length / TEAM_PAGE_SIZE);
                                    const safePage = Math.min(teamPage, totalPages - 1);
                                    const pageMembers = sortedMembers.slice(safePage * TEAM_PAGE_SIZE, (safePage + 1) * TEAM_PAGE_SIZE);
                                    return (
                                        <div className={styles.availSection}>
                                            <div className={styles.teamAvatarGrid}>
                                                {pageMembers.map((m, i) => (
                                                    <div key={m.userId ?? i} className={styles.avatarCard}>
                                                        <div className={styles.avatarWrap}>
                                                            <div
                                                                className={styles.avatarCircle}
                                                                style={{ background: getAvatarColor(m.name) }}
                                                            >
                                                                {getInitials(m.name)}
                                                            </div>
                                                            <span
                                                                className={styles.avatarStatusDot}
                                                                style={{ background: getMemberDotColor(m) }}
                                                            />
                                                        </div>
                                                        <span className={styles.avatarName} style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                                                            {shortName(m.name)}
                                                            {m.accountEnabled === false && (
                                                                <LockClosed20Regular style={{ color: "#f87171", flexShrink: 0, fontSize: "11px" }} title="App access blocked" />
                                                            )}
                                                        </span>
                                                        <span className={styles.avatarStatusText}>{getMemberStatusText(m)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {totalPages > 1 && (
                                                <div className={styles.pageDotsRow}>
                                                    {Array.from({ length: totalPages }).map((_, idx) => (
                                                        <button
                                                            key={idx}
                                                            className={mergeClasses(styles.pageDot, safePage === idx && styles.pageDotActive)}
                                                            onClick={() => setTeamPage(idx)}
                                                            aria-label={`Page ${idx + 1}`}
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}

                                {/* Footer */}
                                <div className={styles.availFooter}>
                                    <span className={styles.moreLabel}>
                                        <CheckmarkCircle20Filled style={{ color: "#9ca3af", width: "16px" }} />
                                        {team.length} team member{team.length !== 1 ? "s" : ""}
                                    </span>
                                    <button
                                        className={styles.viewFullTeam}
                                        onClick={() => nav("/Attendance/TeamView")}
                                    >
                                        View full team →
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                     {(insightsLoading || insights) && (
                        <div className={styles.insightsCard}>
                            <div className={styles.insightsHeader}>
                                <Lightbulb20Regular style={{ color: "#7c3aed" }} />
                                <Text className={styles.insightsTitle}>AI Attendance Insights</Text>
                                <span className={styles.insightsBadge}>AI</span>
                                {insightsLoading && <Spinner size="tiny" style={{ marginLeft: "auto" }} />}
                            </div>

                            {insights && !insightsLoading && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {insights.insights.immediateActions.map((item, i) => {
                                        const { icon, bg, border } = getActionStyle(item.severity);
                                        return (
                                            <div key={i} className={styles.insightBox} style={{ backgroundColor: bg, borderColor: border }}>
                                                <div className={styles.insightIcon}>{icon}</div>
                                                <div className={styles.insightText}>{item.action}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    </div>

                    {/* ── Need Attention list ───────────────────────────────── */}
                    {(() => {
                        const attentionMembers = team.filter(isNeedAttention);
                        if (attentionMembers.length === 0) return null;

                        return (
                            <div className={styles.needAttentionCard}>
                                <div className={styles.needAttentionHeader}>
                                    <Text className={styles.needAttentionTitle}>Need attention</Text>
                                    <span className={styles.needAttentionCount}>{attentionMembers.length}</span>
                                </div>

                                <div className={styles.attentionList}>
                                    {attentionMembers.map((m, i) => {
                                        const reason = getAttentionReason(m);
                                        const isLeave = reason === "on-leave";
                                        const badgeLabel = isLeave
                                            ? (displayLeaveLabel(m.leaveType) ?? "On Leave")
                                            : "Unannounced Absence";
                                        const badgeBg = isLeave ? "#fff7ed" : "#fef2f2";
                                        const badgeColor = isLeave ? "#c2410c" : "#dc2626";
                                        const dotColor = isLeave ? "#f97316" : "#9ca3af";
                                        const subText = isLeave
                                            ? "Leave on record — may exceed threshold"
                                            : "Not checked in · No leave on record";

                                        return (
                                            <div key={i} className={styles.attentionItem}>
                                                <div className={styles.attentionAvatarWrap}>
                                                    <div
                                                        className={styles.attentionAvatarCircle}
                                                        style={{ background: getAvatarColor(m.name) }}
                                                    >
                                                        {getInitials(m.name)}
                                                    </div>
                                                    <span
                                                        className={styles.attentionAvatarDot}
                                                        style={{ background: dotColor }}
                                                    />
                                                </div>
                                                <div className={styles.attentionInfo}>
                                                    <span className={styles.attentionName}>{m.name}</span>
                                                    <span className={styles.attentionReason}>{subText}</span>
                                                </div>
                                                <span
                                                    className={styles.attentionReasonBadge}
                                                    style={{ background: badgeBg, color: badgeColor }}
                                                >
                                                    {badgeLabel}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                    
                </>
            )}

            </>}
        </div>
    );
};

export default ManagerDashboard;
