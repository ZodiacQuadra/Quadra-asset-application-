import React, { useEffect, useRef, useState, useCallback } from "react"
import { makeStyles, tokens, Text, Button, Select, Spinner } from "@fluentui/react-components"
import { displayLeaveLabel } from "../Utils/leaveUtils"
import MyAttendancePanel from "./MyAttendancePanel"
import {
    PeopleRegular, CheckmarkCircleRegular, DismissCircleRegular, ClockRegular,
    Search20Regular, ArrowDownload20Regular,
    ChevronLeft20Regular, ChevronRight20Regular,
    Eye20Regular, CalendarCheckmark20Regular, Clock20Regular, Warning20Regular,
    People20Regular, CalendarCancel20Regular, LockClosed20Regular,
    Lightbulb20Regular,
} from "@fluentui/react-icons"
import { getAttendanceInsights } from "../../Services/AiInsights"
import { AttendanceInsightsData } from "../../Types/aiInsights"
import { VerticalBarChart, IVerticalBarChartDataPoint, GroupedVerticalBarChart, IGroupedVerticalBarChartData } from "@fluentui/react-charting"
import {
    getOrgAttendance, getAdminReportFilters,
    OrgAttendanceRow, OrgAttendanceCounts, OrgAttendanceStatus,
} from "../Services/AdminAttendanceReportService"
import { useNavigate } from "react-router-dom"
import AttendanceDashboard from "./AttendanceDashboard"
import { useAuth } from "../../Auth/AuthProvider"
import { getStoredAuthToken } from "../../Auth/tokenStorage"

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
    mainContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        padding: "25px",
        "@media (max-width: 768px)": {
            padding: "10px"
        }
    },
    topRow: {
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "auto auto",
        gap: "20px",
        alignItems: "stretch",
    },
    pageTopBar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
    },
    pageTabStrip: {
        display: "flex",
        gap: "4px",
        background: "#f3f4f6",
        borderRadius: "10px",
        padding: "4px",
    },
    pageTab: {
        padding: "8px 18px",
        border: "none",
        background: "none",
        fontSize: "13px",
        fontWeight: "500",
        color: "#6b7280",
        cursor: "pointer",
        borderRadius: "8px",
    },
    pageTabActive: {
        background: "#fff",
        color: "#0078D4",
        fontWeight: "600",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
    statsSection: {
        backgroundImage: "linear-gradient(135deg, #0078D4 0%, #106EBE 50%, #005A9E 100%)",
        borderRadius: "20px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    filterBar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        flexWrap: "wrap",
    },
    filterControls: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
        flexWrap: "wrap",
    },
    filterLabel: {
        color: "#302f2f",
        fontSize: "12px",
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
    },
    filterInput: {
        paddingTop: "6px",
        paddingBottom: "6px",
        paddingLeft: "10px",
        paddingRight: "10px",
        borderRadius: "8px",
        border: "1px solid rgba(123, 123, 123, 0.3)",
        fontSize: "13px",
        color: "#4d4c4c",
        backgroundColor: "rgb(255, 255, 255)",
        outlineStyle: "none",
    },
    statsGrid: {
        gridColumn: "1 / -1",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "14px",
        "@media (max-width: 900px)": { gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" },
        "@media (max-width: 500px)": { gridTemplateColumns: "1fr" },
    },
    twoColLayout: {
        display: 'grid',
        gridTemplateColumns: "repeat(2,1fr)",
        gap:'14px',
        "@media (max-width: 1200px)": { gridTemplateColumns: "1fr" },
    },
    tableSection: {
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: "14px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
    },
    tableTabStrip: {
        display: "flex",
        gap: "0",
        borderBottom: "2px solid #f1f5f9",
        overflowX: "auto",
        paddingLeft: "16px",
        paddingRight: "16px",
    },
    tab: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        paddingTop: "10px",
        paddingBottom: "10px",
        paddingLeft: "14px",
        paddingRight: "14px",
        cursor: "pointer",
        backgroundColor: "transparent",
        border: "0",
        borderBottom: "2px solid transparent",
        marginBottom: "-2px",
        fontSize: "13px",
        fontWeight: "500",
        color: "#6b7280",
        whiteSpace: "nowrap",
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
        paddingTop: "1px",
        paddingBottom: "1px",
        paddingLeft: "7px",
        paddingRight: "7px",
        borderRadius: "20px",
        backgroundColor: "#f3f4f6",
        color: "#6b7280",
        minWidth: "22px",
        textAlign: "center",
    },
    tabCountActive: {
        backgroundColor: "#EFF6FF",
        color: "#007ED5",
    },
    tableFilterBar: {
        display: "flex",
        gap: "10px",
        alignItems: "center",
        paddingTop: "12px",
        paddingBottom: "12px",
        paddingLeft: "16px",
        paddingRight: "16px",
        borderBottom: "1px solid #f1f5f9",
        flexWrap: "wrap",
    },
    searchWrap: {
        position: "relative",
        flex: "1 1 180px",
        minWidth: "160px",
    },
    searchIcon: {
        position: "absolute",
        left: "10px",
        top: "50%",
        transform: "translateY(-50%)",
        color: "#9ca3af",
        pointerEvents: "none",
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
    },
    searchInput: {
        width: "100%",
        paddingLeft: "34px",
        paddingRight: "10px",
        paddingTop: "7px",
        paddingBottom: "7px",
        fontSize: "13px",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        outlineStyle: "none",
        backgroundColor: "#f9fafb",
        color: "#111827",
        boxSizing: "border-box",
        ":focus": {
            border: "1px solid #007ED5",
            backgroundColor: "#fff",
        },
    },
    exportBtn: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        paddingTop: "7px",
        paddingBottom: "7px",
        paddingLeft: "14px",
        paddingRight: "14px",
        fontSize: "13px",
        fontWeight: "600",
        border: "1px solid #e5e7eb",
       
        borderRadius: "8px",
        backgroundColor: "#fff",
        color: "#374151",
        cursor: "pointer",
        whiteSpace: "nowrap",
        ":hover": { border: "1px solid #007ED5", color: "#007ED5" },
    },
    table: {
        width: "100%",
        borderCollapse: "collapse",
    },
    thead: {
        backgroundColor: "#f8fafc",
        borderBottom: "1px solid #f1f5f9",
    },
    th: {
        textAlign: "left",
        paddingTop: "11px",
        paddingBottom: "11px",
        paddingLeft: "14px",
        paddingRight: "14px",
        fontSize: "11px",
        fontWeight: "700",
        color: "#9ca3af",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        whiteSpace: "nowrap",
    },
    tr: {
        borderBottom: "1px solid #f8fafc",
        ":hover": { backgroundColor: "#f9fafb" },
    },
    td: {
        paddingTop: "12px",
        paddingBottom: "12px",
        paddingLeft: "14px",
        paddingRight: "14px",
        fontSize: "13px",
        color: "#374151",
        verticalAlign: "middle",
    },
    empCell: {
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
        fontWeight: "700",
        color: "#fff",
        flexShrink: 0,
    },
    badge: {
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        paddingTop: "3px",
        paddingBottom: "3px",
        paddingLeft: "9px",
        paddingRight: "9px",
        borderRadius: "20px",
        fontSize: "12px",
        fontWeight: "600",
        whiteSpace: "nowrap",
    },
    pagination: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "10px",
        paddingBottom: "10px",
        paddingLeft: "16px",
        paddingRight: "16px",
        borderTop: "1px solid #f1f5f9",
        flexWrap: "wrap",
        gap: "8px",
    },
    pageBtn: {
        width: "30px",
        height: "30px",
        borderRadius: "7px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#fff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "13px",
        fontWeight: "500",
        color: "#374151",
        ":hover": { border: "1px solid #007ED5", color: "#007ED5" },
    },
    pageBtnActive: {
        backgroundColor: "#007ED5",
        color: "#fff",
        border: "1px solid #007ED5",
    },
    pageBtnDisabled: {
        opacity: "0.4",
        cursor: "not-allowed",
    },
    insightsCard: {
        background: "#fff",
        borderRadius: "14px",
        padding: "22px 26px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        minHeight:'50vh'
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
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ["#6366f1","#0078D4","#16a34a","#ca8a04","#dc2626","#7c3aed","#0891b2","#c026d3"]
function avatarColor(name: string) {
    let n = 0; for (const c of name) n += c.charCodeAt(0)
    return AVATAR_COLORS[n % AVATAR_COLORS.length]
}
function getInitials(name: string) {
    const p = name.trim().split(/\s+/)
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}

function fmtTime(ts: string | null): string {
    if (!ts) return "—"
    const d = new Date(ts.replace(/Z$/, ""))
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function fmtShiftTime(t: string | null): string {
    if (!t) return ""
    if (t.includes("T")) {
        const d = new Date(t.replace(/Z$/, ""))
        if (!isNaN(d.getTime()))
            return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    }
    const parts = t.split(":")
    if (parts.length < 2) return t
    const h = parseInt(parts[0], 10), m = parseInt(parts[1], 10)
    return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
}

function fmtDuration(mins: number | null): string {
    if (mins === null || mins === undefined) return "—"
    return `${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`
}

function getActionStyle(severity: "high" | "medium" | "low"): { icon: string; bg: string; border: string } {
    if (severity === "high")   return { icon: "🔴", bg: "#FFF1F2", border: "#FECDD3" }
    if (severity === "medium") return { icon: "⚠️", bg: "#FFFBEB", border: "#FDE68A" }
    return { icon: "💡", bg: "#EFF6FF", border: "#DBEAFE" }
}

function locationLabel(row: OrgAttendanceRow): string {
    const t = row.workLocationType
    if (!t) return "—"
    if (t === "Office") return `Office${row.officeLocation ? " · " + row.officeLocation : ""}`
    if (t === "WFH" || t === "Remote") return "WFH"
    return `Field${row.currentLocation ? " · " + row.currentLocation : ""}`
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; bg: string; color: string; dot: string; icon: React.ReactNode }> = {
    on_time:   { label: "On-time",   bg: "#ecfdf5", color: "#059669", dot: "#10b981", icon: <CalendarCheckmark20Regular style={{ fontSize: 13 }} /> },
    late:      { label: "Late",      bg: "#fff7ed", color: "#ea580c", dot: "#f97316", icon: <Clock20Regular style={{ fontSize: 13 }} /> },
    exception: { label: "Escalated", bg: "#fff7ed", color: "#b45309", dot: "#f59e0b", icon: <Warning20Regular style={{ fontSize: 13 }} /> },
    on_leave:  { label: "On Leave",  bg: "#f0f9ff", color: "#0284c7", dot: "#38bdf8", icon: <People20Regular style={{ fontSize: 13 }} /> },
    absent:    { label: "Absent",    bg: "#fff1f2", color: "#dc2626", dot: "#ef4444", icon: <CalendarCancel20Regular style={{ fontSize: 13 }} /> },
    blocked:   { label: "Blocked",   bg: "#111827", color: "#fff",    dot: "#6b7280", icon: <LockClosed20Regular style={{ fontSize: 13 }} /> },
}

type TabKey = "all" | OrgAttendanceStatus
const TABS: { key: TabKey; label: string }[] = [
    { key: "all",       label: "All" },
    { key: "on_time",   label: "On-time" },
    { key: "late",      label: "Late" },
    { key: "exception", label: "Exception" },
    { key: "on_leave",  label: "On Leave" },
    { key: "absent",    label: "Absent" },
    { key: "blocked",   label: "Blocked" },
]

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps { label: string; value: number | string; subtext?: string; accentColor: string; icon: React.ReactNode; onClick?: () => void; isActive?: boolean }
const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, accentColor, icon, onClick, isActive }) => (
    <div onClick={onClick} style={{
        background: "rgba(255,255,255,0.12)",
        backdropFilter: "blur(16px)",
        borderRadius: "16px",
        padding: "20px 22px",
        border: isActive ? `2px solid ${accentColor}` : "1px solid rgba(255,255,255,0.22)",
        boxShadow: isActive ? `0 4px 32px rgba(0,0,0,0.22), 0 0 0 2px ${accentColor}44` : "0 4px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.2)",
        display: "flex", flexDirection: "column", gap: "10px",
        position: "relative", overflow: "hidden",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s, border 0.15s, transform 0.12s",
        transform: isActive ? "translateY(-2px)" : "none",
    }}>
        <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "80px", height: "80px", borderRadius: "50%", backgroundColor: accentColor, opacity: 0.18, filter: "blur(20px)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "#5b5a5a", borderRadius: "8px", padding: "6px", display: "flex", fontSize: "16px" }}>{icon}</div>
            <Text size={100} weight="semibold" style={{ color: "rgba(61,61,61,0.7)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</Text>
        </div>
        <Text weight="bold" style={{ color: "#1d1d1d", lineHeight: "1", fontSize: "clamp(22px, 2.4vw, 38px)" }}>{value}</Text>
        {subtext && <Text size={100} style={{ color: "rgba(108,108,108,0.6)" }}>{subtext}</Text>}
    </div>
)

// ─── Donut Summary ────────────────────────────────────────────────────────────

interface DonutSummaryProps { present: number; absent: number; leave: number; total: number }
const DonutSummary: React.FC<DonutSummaryProps> = ({ present, absent, leave, total }) => {
    const size = 200   // fixed px — no scaling issues
    const cx = size / 2
    const cy = size / 2
    const R = 72
    const strokeW = 28
    const gap = 2
    const C = 2 * Math.PI * R

    const presentFrac = total > 0 ? present / total : 0
    const absentFrac  = total > 0 ? absent  / total : 0
    const leaveFrac   = total > 0 ? leave   / total : 0

    // Exact percentages, rounded to 2 decimals so small non-zero categories stay visible.
    const round2 = (n: number) => Math.round(n * 100) / 100
    const presentPct = total > 0 ? round2(presentFrac * 100) : 0
    const absentPct  = total > 0 ? round2(absentFrac  * 100) : 0
    const leavePct   = total > 0 ? round2(leaveFrac   * 100) : 0

    const gapLen = (gap / 360) * C
    const presentLen = Math.max(0, C * presentFrac - gapLen)
    const absentLen  = Math.max(0, C * absentFrac  - gapLen)
    const leaveLen   = Math.max(0, C * leaveFrac   - gapLen)
    const presentAngle = presentFrac * 360
    const absentAngle  = absentFrac  * 360

    const seg = (len: number, color: string, rotDeg: number) =>
        len > 0 ? (
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth={strokeW}
                strokeDasharray={`${len} ${C - len}`} strokeDashoffset={0} strokeLinecap="butt"
                transform={`rotate(${rotDeg} ${cx} ${cy})`} />
        ) : null

    const statCard = (label: string, pct: number, color: string, gradFrom: string, gradTo: string) => (
        <div style={{
            background: `linear-gradient(135deg, ${gradFrom} 0%, ${gradTo} 100%)`,
            border: "1px solid rgba(0,0,0,0.05)",
            borderRadius: "12px",
            padding: "12px 16px",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "3px",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>{label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "1px" }}>
                <span style={{ fontSize: "26px", fontWeight: "700", color: "#111827", lineHeight: 1 }}>{pct}</span>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "#9ca3af" }}> %</span>
            </div>
        </div>
    )

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "16px", height: "100%" }}>
            {/* Donut — 60% width, SVG fills container */}
            <div style={{ flex: "0 0 40%", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <svg width="100%" style={{ maxHeight: "280px" }} viewBox={`0 0 ${size} ${size}`}>
                    <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f0f0f0" strokeWidth={strokeW} />
                    {seg(presentLen, "#22c55e", -90)}
                    {seg(absentLen,  "#ef4444", -90 + presentAngle)}
                    {seg(leaveLen,   "#3b82f6", -90 + presentAngle + absentAngle)}
                    <text x={cx} y={cy - 11} textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: "22px", fontWeight: 800, fill: "#111827" }}>
                        {total.toLocaleString("en-IN")}
                    </text>
                    <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
                        style={{ fontSize: "10px", fill: "#9ca3af" }}>
                        Total Employees
                    </text>
                </svg>
            </div>

            {/* Stat cards — remaining 40%, vertically centred */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: 0, justifyContent: "center" }}>
                {statCard("Present", presentPct, "#22c55e", "rgba(220,252,231,0.6)", "rgba(240,253,244,0.2)")}
                {statCard("Absent",  absentPct,  "#ef4444", "rgba(254,226,226,0.6)", "rgba(255,241,242,0.2)")}
                {statCard("Leave",   leavePct,   "#3b82f6", "rgba(219,234,254,0.6)", "rgba(239,246,255,0.2)")}
            </div>
        </div>
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20
const CHART_PAGE_SIZE = 8

const AttendanceAdminDashboard = () => {
    const styles = useStyles()
    const navigate = useNavigate()

    const todayStr = () => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    }

    // ── Filters ──────────────────────────────────────────────────────────────
    const [selectedDept, setSelectedDept] = useState("All")
    const [departments, setDepartments] = useState<string[]>([])
    const [selectedDate, setSelectedDate] = useState<string>(todayStr)

    // ── Page-level tab (Dashboard vs My Attendance) ──────────────────────────
    const [activeView, setActiveView] = useState<"dashboard" | "myAttendance">("myAttendance")

    // ── Table state ───────────────────────────────────────────────────────────
    const tableRef = useRef<HTMLDivElement>(null)
    const [activeTab, setActiveTab] = useState<TabKey>("all")
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [page, setPage] = useState(1)
    const [chartPage, setChartPage] = useState(1)
    const [rows, setRows] = useState<OrgAttendanceRow[]>([])
    const [counts, setCounts] = useState<OrgAttendanceCounts>({ all: 0, on_time: 0, late: 0, exception: 0, on_leave: 0, absent: 0, blocked: 0 })
    const [total, setTotal] = useState(0)
    const [tableLoading, setTableLoading] = useState(false)
    const {currentUser} = useAuth()
    // ── All-data state (for stat cards + donut) ───────────────────────────────
    const [allRows, setAllRows] = useState<OrgAttendanceRow[]>([])

    // ── Load departments ──────────────────────────────────────────────────────
    useEffect(() => {
        getAdminReportFilters().then(f => setDepartments(f.departments)).catch(() => {})
    }, [])

    // ── Debounce search ───────────────────────────────────────────────────────
    const handleSearch = (val: string) => {
        setSearchInput(val)
        if (searchTimer.current) clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => { setSearch(val); setPage(1) }, 400)
    }

    // ── Fetch paginated table data ────────────────────────────────────────────
    const fetchTable = useCallback(async () => {
        setTableLoading(true)
        try {
            const res = await getOrgAttendance({
                date:       selectedDate,
                department: selectedDept !== "All" ? selectedDept : undefined,
                status:     activeTab !== "all" ? activeTab : undefined,
                search:     search || undefined,
                page,
                pageSize:   PAGE_SIZE,
            })
            setRows(res.rows)
            setCounts(res.counts)
            setTotal(res.pagination.total)
        } catch {
            setRows([])
        } finally {
            setTableLoading(false)
        }
    }, [selectedDate, selectedDept, activeTab, search, page])

    useEffect(() => { fetchTable() }, [fetchTable])

    // ── Fetch all rows for stat cards + donut (no status/search filter) ───────
    useEffect(() => {
        getOrgAttendance({
            date:       selectedDate,
            department: selectedDept !== "All" ? selectedDept : undefined,
            pageSize:   5000,
        }).then(res => setAllRows(res.rows)).catch(() => setAllRows([]))
    }, [selectedDate, selectedDept])

    // ── Filter handlers ───────────────────────────────────────────────────────
    const handleClear = () => {
        setSelectedDate(todayStr())
        setSelectedDept("All")
        setActiveTab("all")
        setSearchInput("")
        setSearch("")
        setPage(1)
        setChartPage(1)
    }

    const handleStatCardClick = (tab: TabKey) => {
        setActiveTab(tab)
        setPage(1)
        setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50)
    }

    // ── Counts derived from allRows (unfiltered) — keeps stat cards & tab badges consistent with the graph ──
    const derivedCounts = allRows.reduce<OrgAttendanceCounts>(
        (acc, r) => {
            acc.all++
            if (r.status in acc) (acc as unknown as Record<string, number>)[r.status]++
            return acc
        },
        { all: 0, on_time: 0, late: 0, exception: 0, on_leave: 0, absent: 0, blocked: 0 }
    )

    // ── Stat card values from unfiltered derivedCounts ────────────────────────
    const totalEmployees = derivedCounts.all
    const noOfPresent    = derivedCounts.on_time + derivedCounts.late + derivedCounts.exception
    const noOfLate       = derivedCounts.late
    const noOfAbsent     = derivedCounts.absent
    const presentPct     = totalEmployees > 0 ? Math.round((noOfPresent / totalEmployees) * 100) : 0

    // ── Chart data from allRows ───────────────────────────────────────────────
    const isDeptFiltered = selectedDept !== "All"

    // Dept-filtered: status breakdown vertical bar chart
    const STATUS_COLOURS: Record<string, string> = {
        on_time: "#059669", late: "#f97316", exception: "#f59e0b",
        on_leave: "#0284c7", absent: "#dc2626", blocked: "#6b7280",
    }
    const STATUS_LABELS: Record<string, string> = {
        on_time: "On-time", late: "Late", exception: "Exception",
        on_leave: "On Leave", absent: "Absent", blocked: "Blocked",
    }
    const statusBarData: IVerticalBarChartDataPoint[] = isDeptFiltered
        ? (["on_time","late","exception","on_leave","absent","blocked"] as const)
              .map(s => ({ x: STATUS_LABELS[s], y: allRows.filter(r => r.status === s).length, color: STATUS_COLOURS[s] }))
              .filter(d => d.y > 0)
        : []

    // All-org: Present, Absent, & Leave counts per department grouped bar chart
    const deptGroupedData: IGroupedVerticalBarChartData[] = !isDeptFiltered
        ? Object.entries(
              allRows.reduce<Record<string, { present: number; absent: number; leave: number; total: number }>>((acc, r) => {
                  const dept = r.department || "Unknown"
                  if (departments.length > 0 && !departments.includes(dept)) return acc
                  if (!acc[dept]) acc[dept] = { present: 0, absent: 0, leave: 0, total: 0 }
                  acc[dept].total++
                  if (r.status === "on_leave") acc[dept].leave++
                  else if (r.status === "absent") acc[dept].absent++
                  else if (r.status === "on_time" || r.status === "late" || r.status === "exception") acc[dept].present++
                  return acc
              }, {})
          )
              .sort((a, b) => b[1].total - a[1].total)
              .map(([dept, { present, absent, leave, total }]) => ({
                  name: dept,
                  series: [
                      { key: "present", data: present, color: "#107C10", legend: "Present" },
                      { key: "absent",  data: absent, color: "#D13438", legend: "Absent"  },
                      { key: "leave",   data: leave, color: "#0078D4", legend: "Leave"   },
                  ].filter(s => s.data > 0),
              }))
        : []

    // ── Pagination ────────────────────────────────────────────────────────────
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const pageStart  = (page - 1) * PAGE_SIZE + 1
    const pageEnd    = Math.min(page * PAGE_SIZE, total)

    function renderPageBtns() {
        const btns: React.ReactNode[] = []
        const btn = (p: number) => (
            <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>{p}</button>
        )
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) btns.push(btn(i)) }
        else {
            btns.push(btn(1))
            if (page > 3) btns.push(<span key="e1" style={{ padding: "0 4px", color: "#9ca3af" }}>…</span>)
            for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) btns.push(btn(i))
            if (page < totalPages - 2) btns.push(<span key="e2" style={{ padding: "0 4px", color: "#9ca3af" }}>…</span>)
            btns.push(btn(totalPages))
        }
        return btns
    }

    // ── AI Insights ───────────────────────────────────────────────────────────
    const [insights, setInsights] = useState<AttendanceInsightsData | null>(null)
    const [insightsLoading, setInsightsLoading] = useState(false)

    useEffect(() => {
        const token = getStoredAuthToken()
        if (!token) return
        setInsightsLoading(true)
        getAttendanceInsights(token)
            .then((res) => { if (res.success) setInsights(res.data) })
            .catch(() => {})
            .finally(() => setInsightsLoading(false))
    }, [])

    // ── Export CSV ────────────────────────────────────────────────────────────
    const [exporting, setExporting] = useState(false)
    const exportCSV = async () => {
        setExporting(true)
        try {
            const all = await getOrgAttendance({
                date:       selectedDate,
                
                department: selectedDept !== "All" ? selectedDept : undefined,
                status:     activeTab !== "all" ? activeTab : undefined,
                search:     search || undefined,
                pageSize:   5000,
            })
            const headers = ["Name","Department","Manager","Shift","Status","Check-in","Check-out","Location","Hours"]
            const data = all.rows.map(r => [
                r.name, r.department, r.managerName ?? "", r.shiftName ?? "",
                STATUS_CFG[r.status]?.label ?? r.status,
                fmtTime(r.checkIn), fmtTime(r.checkOut),
                locationLabel(r), fmtDuration(r.durationMinutes),
            ])
            const csv = "\uFEFF" + [headers, ...data].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a"); a.href = url; a.download = `attendance-${selectedDate}.csv`; a.click()
            URL.revokeObjectURL(url)
        } catch { } finally { setExporting(false) }
    }

    function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}


const greeting = getGreeting();

 const today = new Date();
    const todayLabel = today.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

        const displayName = currentUser?.displayName || currentUser?.email || "Manager";


    return (
        <div className={styles.mainContainer}>

            {/* ── Page top bar: title + tab strip ── */}
            <div className={styles.pageTopBar}>
                <div className={styles.greetingBlock}>
                                    <Text className={styles.greetingText}>
                                        {greeting}, {displayName.split(" ")[0]}
                                    </Text>
                                    <Text className={styles.greetingMeta}>
                                        {todayLabel}
                                    </Text>
                                </div>
                <div className={styles.pageTabStrip}>
                    <button
                        className={`${styles.pageTab} ${activeView === "dashboard" ? styles.pageTabActive : ""}`}
                        onClick={() => setActiveView("dashboard")}
                    >
                        Org Attendance
                    </button>
                    <button
                        className={`${styles.pageTab} ${activeView === "myAttendance" ? styles.pageTabActive : ""}`}
                        onClick={() => setActiveView("myAttendance")}
                    >
                        My Attendance
                    </button>
                </div>
            </div>

            {/* ── My Attendance tab ── */}
            {activeView === "myAttendance" && <AttendanceDashboard isGreetingVisible={false}/>}

            {/* ── Dashboard tab ── */}
            {activeView === "dashboard" && <>

            {/* ── Filter bar ── */}
            <div className={styles.filterBar}>
                <div className={styles.filterControls}>
                    <Text className={styles.filterLabel}>Department</Text>
                    <Select
                        appearance="filled-lighter"
                        style={{ minWidth: "150px", borderRadius: "8px" }}
                        value={selectedDept}
                        onChange={(_, d) => { setSelectedDept(d.value); setPage(1); setChartPage(1) }}
                    >
                        <option value="All">All</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </Select>

                    <Text className={styles.filterLabel}>Date</Text>
                    <input
                        type="date"
                        className={styles.filterInput}
                        value={selectedDate}
                        max={todayStr()}
                        onChange={e => { setSelectedDate(e.target.value); setPage(1); setChartPage(1) }}
                    />

                    <Button appearance="subtle" style={{ color: "rgba(241,56,56,0.8)" }} onClick={handleClear}>Clear</Button>
                </div>
            </div>

            {/* ── Top row: Stat cards + Donut + CheckIn ── */}
            <div className={styles.topRow}>
                <div className={styles.statsGrid}>
                    <StatCard label="Total Employees" value={totalEmployees} subtext="For selected date" accentColor="#60CDFF" icon={<PeopleRegular style={{ fontSize: 18 }} />} onClick={() => handleStatCardClick("all")} isActive={activeTab === "all"} />
                    <StatCard label="Present" value={noOfPresent} subtext={`${presentPct}% attendance rate`} accentColor="#6FCF97" icon={<CheckmarkCircleRegular style={{ fontSize: 18 }} />} onClick={() => handleStatCardClick("on_time")} isActive={activeTab === "on_time"} />
                    <StatCard label="Absent" value={noOfAbsent} subtext={totalEmployees > 0 ? `${100 - presentPct}% not checked in` : "No records"} accentColor="#FF8BA0" icon={<DismissCircleRegular style={{ fontSize: 18 }} />} onClick={() => handleStatCardClick("absent")} isActive={activeTab === "absent"} />
                    <StatCard label="Late Check-ins" value={noOfLate} subtext={noOfPresent > 0 ? `${Math.round((noOfLate / noOfPresent) * 100)}% of present` : "No data"} accentColor="#FFD166" icon={<ClockRegular style={{ fontSize: 18 }} />} onClick={() => handleStatCardClick("late")} isActive={activeTab === "late"} />
                </div>


                 {/* ── Department Attendance Chart ── */}
            <div>
            <div className={styles.twoColLayout}>


            <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                padding: "20px",
                border: "1px solid rgba(0,0,0,0.05)",
            }}>
                <Text className="text-lg" style={{fontWeight:600}}>Today’s Attendance Stats</Text>
                <DonutSummary
                    present={noOfPresent}
                    absent={noOfAbsent}
                    leave={derivedCounts.on_leave}
                    total={totalEmployees}
                />
            </div>
                {/* <div style={{ borderTop: "1px solid #f1f5f9", margin: "4px 0 12px" }} />
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
                    <Text weight="semibold" size={400} style={{ flex: "1 1 auto", minWidth: 0 }}>
                        {isDeptFiltered ? `Attendance Breakdown — ${selectedDept}` : "Dept-wise Attendance"}
                    </Text>
                    {!isDeptFiltered && (
                        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexShrink: 0 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#374151" }}>
                                <span style={{ width: 12, height: 12, borderRadius: 2, background: "#107C10", display: "inline-block" }} /> Present
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#374151" }}>
                                <span style={{ width: 12, height: 12, borderRadius: 2, background: "#D13438", display: "inline-block" }} /> Absent
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#374151" }}>
                                <span style={{ width: 12, height: 12, borderRadius: 2, background: "#0078D4", display: "inline-block" }} /> Leave
                            </span>
                        </div>
                    )}
                </div>
                {isDeptFiltered ? (
                    statusBarData.length === 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", minHeight: "200px" }}>
                            <CheckmarkCircleRegular style={{ fontSize: 40, color: "#6FCF97" }} />
                            <Text size={200} style={{ color: "#6B7280" }}>No records for this department</Text>
                        </div>
                    ) : (
                        <div style={{ width: "100%", overflowX: "auto" }}>
                            <VerticalBarChart
                                data={statusBarData}
                                height={300}
                                width={Math.max(480, statusBarData.length * 100)}
                                barWidth={40}
                                hideLegend={true}
                                showYAxisLables={true}
                                yAxisTickCount={4}
                                rotateXAxisLables={true}
                                showXAxisLablesTooltip={true}
                                noOfCharsToTruncate={8}
                            />
                        </div>
                    )
                ) : (
                    deptGroupedData.length === 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", minHeight: "200px" }}>
                            <CheckmarkCircleRegular style={{ fontSize: 40, color: "#6FCF97" }} />
                            <Text size={200} style={{ color: "#6B7280" }}>No attendance data available</Text>
                        </div>
                    ) : (() => {
                        const chartTotalPages = Math.ceil(deptGroupedData.length / CHART_PAGE_SIZE)
                        const visibleDeptData = deptGroupedData.slice((chartPage - 1) * CHART_PAGE_SIZE, chartPage * CHART_PAGE_SIZE)
                        return (
                            <>
                                <GroupedVerticalBarChart
                                    data={visibleDeptData}
                                    height={260}
                                    barwidth={20}
                                    hideLegend={true}
                                    showYAxisLables={true}
                                    yAxisTickCount={5}
                                    rotateXAxisLables={true}
                                    showXAxisLablesTooltip={true}
                                    noOfCharsToTruncate={10}
                                />
                                {chartTotalPages > 1 && (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", padding: "0 4px" }}>
                                        <Button
                                            appearance="subtle"
                                            size="small"
                                            icon={<ChevronLeft20Regular />}
                                            disabled={chartPage === 1}
                                            onClick={() => setChartPage(p => p - 1)}
                                        >Prev</Button>
                                        <Text size={200} style={{ color: "#6B7280" }}>
                                            {chartPage} / {chartTotalPages} &nbsp;·&nbsp; {deptGroupedData.length} departments
                                        </Text>
                                        <Button
                                            appearance="subtle"
                                            size="small"
                                            icon={<ChevronRight20Regular />}
                                            iconPosition="after"
                                            disabled={chartPage === chartTotalPages}
                                            onClick={() => setChartPage(p => p + 1)}
                                        >Next</Button>
                                    </div>
                                )}
                            </>
                        )
                    })()
                )} */}

            {/* ── AI Insights ── */}
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
                            const { icon, bg, border } = getActionStyle(item.severity)
                            return (
                                <div key={i} className={styles.insightBox} style={{ backgroundColor: bg, borderColor: border }}>
                                    <div className={styles.insightIcon}>{icon}</div>
                                    <div className={styles.insightText}>{item.action}</div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {!insights && !insightsLoading && (
                    <div style={{
                        position: "relative",
                        borderRadius: "10px",
                        overflow: "hidden",
                        minHeight: "80px",
                    }}>
                        <div style={{
                            position: "absolute",
                            inset: 0,
                            backdropFilter: "blur(6px)",
                            backgroundColor: "rgba(255,255,255,0.6)",
                            borderRadius: "10px",
                        }} />
                        <div style={{
                            position: "relative",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px",
                            padding: "24px 16px",
                            color: "#9ca3af",
                            fontSize: "13px",
                            fontWeight: 500,
                        }}>
                            <Lightbulb20Regular style={{ opacity: 0.4, width: 24, height: 24 }} />
                            No insights available
                        </div>
                    </div>
                )}
            </div>
            </div>
            </div>

            </div>

            

            {/* ── Org Attendance Table ── */}
            <div ref={tableRef} className={styles.tableSection}>

                {/* Status tab strip */}
                <div className={styles.tableTabStrip}>
                    {TABS.map(tab => {
                        const cnt = tab.key === "all" ? derivedCounts.all : derivedCounts[tab.key as OrgAttendanceStatus]
                        return (
                            <button key={tab.key} className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
                                onClick={() => { setActiveTab(tab.key); setPage(1) }}>
                                {tab.label}
                                <span className={`${styles.tabCount} ${activeTab === tab.key ? styles.tabCountActive : ""}`}>{cnt ?? 0}</span>
                            </button>
                        )
                    })}
                </div>

                {/* Table filter bar: search + export */}
                <div className={styles.tableFilterBar}>
                    <div className={styles.searchWrap}>
                        <Search20Regular className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Search employees or department…"
                            value={searchInput}
                            onChange={e => handleSearch(e.target.value)}
                        />
                    </div>
                    <div style={{ flex: 1 }} />
                    <button className={styles.exportBtn} onClick={exportCSV} disabled={exporting}>
                        <ArrowDownload20Regular />
                        {exporting ? "Exporting…" : "Export CSV"}
                    </button>
                </div>

                {/* Table */}
                {tableLoading ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "50px" }}>
                        <Spinner label="Loading attendance…" />
                    </div>
                ) : rows.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "50px", color: "#9ca3af", fontSize: "14px" }}>
                        No attendance records found for the selected filters.
                    </div>
                ) : (
                    <>
                        <div style={{ overflowX: "auto" }}>
                            <table className={styles.table}>
                                <thead className={styles.thead}>
                                    <tr>
                                        <th className={styles.th}>Employee</th>
                                        <th className={styles.th}>Department</th>
                                        <th className={styles.th}>Shift</th>
                                        <th className={styles.th}>Status</th>
                                        <th className={styles.th}>Location</th>
                                        {/* <th className={styles.th}>Hours</th> */}
                                        <th className={styles.th}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(row => {
                                        const cfg = STATUS_CFG[row.status] ?? STATUS_CFG.absent
                                        return (
                                            <tr key={row.employeeId} className={styles.tr}>
                                                <td className={styles.td}>
                                                    <div className={styles.empCell}>
                                                        <div className={styles.avatar} style={{ background: avatarColor(row.name) }}>{getInitials(row.name)}</div>
                                                        <div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#111827" }}>{row.name}</div>
                                                                {row.status === "blocked" && (
                                                                    <LockClosed20Regular style={{ color: "#f87171", flexShrink: 0, fontSize: "13px" }} title="App access blocked" />
                                                                )}
                                                            </div>
                                                            <div style={{ fontSize: "11px", color: "#9ca3af" }}>{row.managerName ? `Reports to ${row.managerName}` : row.department}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className={styles.td} style={{ color: "#6b7280" }}>{row.department}</td>
                                                <td className={styles.td}>
                                                    {row.shiftName ? (
                                                        <div>
                                                            <div style={{ fontWeight: 600 }}>{row.shiftName}</div>
                                                            {row.shiftStart && row.shiftEnd && (
                                                                <div style={{ fontSize: "11px", color: "#9ca3af" }}>{fmtShiftTime(row.shiftStart)} – {fmtShiftTime(row.shiftEnd)}</div>
                                                            )}
                                                        </div>
                                                    ) : <span style={{ color: "#d1d5db" }}>—</span>}
                                                </td>
                                                <td className={styles.td}>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "3px", alignItems: "flex-start" }}>
                                                        <span className={styles.badge} style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                                                            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: cfg.dot, display: "inline-block" }} />
                                                            {cfg.label}
                                                        </span>
                                                        {row.leaveName && row.status === "on_leave" && (
                                                            <span style={{ fontSize: "11px", color: "#0284c7" }}>{displayLeaveLabel(row.leaveName)}</span>
                                                        )}
                                                        { row.checkIn && (
                                                            <span style={{ fontSize: "11px", color:row.status === "late"? "#ea580c" : "#28a001" }}>In at {fmtTime(row.checkIn)}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className={styles.td}>
                                                    {row.workLocationType ? (
                                                        <span style={{
                                                            display: "inline-flex", alignItems: "center", gap: "4px",
                                                            padding: "3px 9px", borderRadius: "12px", fontSize: "12px", fontWeight: 600,
                                                            backgroundColor: row.workLocationType === "Office" ? "#EFF6FF" : row.workLocationType === "WFH" || row.workLocationType === "Remote" ? "#F0FDF4" : "#FFF7ED",
                                                            color: row.workLocationType === "Office" ? "#1D4ED8" : row.workLocationType === "WFH" || row.workLocationType === "Remote" ? "#16A34A" : "#EA580C",
                                                        }}>
                                                            {row.workLocationType === "Office" ? "Office" : row.workLocationType === "WFH" || row.workLocationType === "Remote" ? "WFH" : "Field"}
                                                        </span>
                                                    ) : <span style={{ color: "#d1d5db" }}>—</span>}
                                                </td>
                                                {/* <td className={styles.td}>
                                                    {row.durationMinutes !== null ? (
                                                        <div>
                                                            <span style={{ fontWeight: 700, color: "#111827" }}>{fmtDuration(row.durationMinutes)}</span>
                                                            {!row.checkOut && row.checkIn && <div style={{ fontSize: "11px", color: "#6366f1" }}>In progress</div>}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: row.checkIn && !row.checkOut ? "#6366f1" : "#d1d5db" }}>
                                                            {row.checkIn && !row.checkOut ? "In progress" : "0h 00m"}
                                                        </span>
                                                    )}
                                                </td> */}
                                                <td className={styles.td}>
                                                    <div style={{ display: "flex", gap: "6px" }}>
                                                        <button title="View history"
                                                            onClick={() => navigate("/Attendance/History",{
                                                                state:{
                                                                    type:"admin",
                                                                    userId:row.employeeId
                                                                }
                                                            })}
                                                            style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "7px", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                                                            <Eye20Regular />
                                                        </button>
                                                        {/* <button title="Attendance Log"
                                                            onClick={() => navigate("/Attendance/History")}
                                                            style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "7px", width: "30px", height: "30px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}>
                                                            <History20Regular />
                                                        </button> */}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className={styles.pagination}>
                            <Text size={200} style={{ color: "#6b7280" }}>
                                Showing {pageStart}–{pageEnd} of {total.toLocaleString()} employees
                            </Text>
                            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                <button className={`${styles.pageBtn} ${page === 1 ? styles.pageBtnDisabled : ""}`}
                                    onClick={() => page > 1 && setPage(p => p - 1)} disabled={page === 1}>
                                    <ChevronLeft20Regular />
                                </button>
                                {renderPageBtns()}
                                <button className={`${styles.pageBtn} ${page === totalPages ? styles.pageBtnDisabled : ""}`}
                                    onClick={() => page < totalPages && setPage(p => p + 1)} disabled={page === totalPages}>
                                    <ChevronRight20Regular />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            </> }
        </div>
    )
}

export default AttendanceAdminDashboard
