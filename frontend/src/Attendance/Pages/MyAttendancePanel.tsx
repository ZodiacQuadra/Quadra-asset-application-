import React, { useEffect, useState, useCallback } from "react";
import { displayLeaveLabel } from "../Utils/leaveUtils";
import {
    makeStyles, Text, Spinner,
    Dialog, DialogSurface, DialogTitle, DialogContent, DialogBody, DialogActions,
    RadioGroup, Radio, Field, Textarea,
    Toast, ToastTitle, ToastBody, Toaster, useToastController, useId,
    Button,
} from "@fluentui/react-components";
import {
    LocationRegular,
    CalendarLtr20Regular,
    ClockRegular,
    ArrowSync20Regular,
    History20Regular,
    Warning24Filled,
} from "@fluentui/react-icons";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Auth/AuthProvider";
import {
    checkIn, checkOut,
    getAttendanceHistory,
    getRecentAttendance,
    AttendanceRecord,
    RecentAttendanceDay,
} from "../Services/AttendanceService";
import { getLeaveBalances, LeaveBalance } from "../../Services/LeaveRequestService";
import { getEntraUserById, EntraADUser } from "../../Services/EntraADUserService";
import { getLocation, formatCoordinates } from "../../Services/GeoLocationService";
import { calculateDistance, parseCoordinates } from "../../Services/GeoUtils";
import CheckInCard from "../Components/CheckinCard";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtTime(dt: string | null): string {
    if (!dt) return "—";
    const d = new Date(dt);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

// Shift times come from the DB as plain time values (e.g. "09:00:00" or ISO
// "1900-01-01T09:00:00.000Z"). The DB value already represents local (IST) time,
// so we must read UTC hours/minutes to avoid the +5:30 double-conversion.
function parseShiftMinutes(t: string): number {
    if (t.includes("T")) {
        const d = new Date(t);
        return d.getUTCHours() * 60 + d.getUTCMinutes();
    }
    const [h, m] = t.split(":");
    return parseInt(h, 10) * 60 + parseInt(m, 10);
}

function fmtShift(t: string | null): string {
    if (!t) return "";
    const mins = parseShiftMinutes(t);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getShiftHours(startTime: string | null, endTime: string | null): number {
    if (!startTime || !endTime) return 9;
    return Math.max(1, (parseShiftMinutes(endTime) - parseShiftMinutes(startTime)) / 60);
}

function getWeekHours(records: AttendanceRecord[]): { worked: number; expected: number; hasInvalidData: boolean } {
    const today = new Date();
    const mon = new Date(today);
    mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    mon.setHours(0, 0, 0, 0);

    const weekRecs = records.filter(r => {
        const d = new Date(r.CreatedOn);
        return d >= mon && d <= today;
    });

    const MAX_DAY_MINS = 24 * 60; // 1440 — anything above is erroneous
    const hasInvalidData = weekRecs.some(r => (r.DurationMinutes ?? 0) > MAX_DAY_MINS);
    const validRecs = weekRecs.filter(r => (r.DurationMinutes ?? 0) <= MAX_DAY_MINS);
    const workedMins = validRecs.reduce((sum, r) => sum + (r.DurationMinutes ?? 0), 0);

    // Count weekdays Mon–today
    let workdays = 0;
    const cur = new Date(mon);
    while (cur <= today) {
        const dow = cur.getDay();
        if (dow !== 0 && dow !== 6) workdays++;
        cur.setDate(cur.getDate() + 1);
    }

    return {
        worked: Math.round(workedMins / 60 * 10) / 10,
        expected: workdays * 9,
        hasInvalidData,
    };
}

function classifyDay(day: RecentAttendanceDay): {
    label: string;
    color: string;
    bg: string;
    abbr: string;
} {
    if (!day.CheckIn) {
        return { label: "Absent", color: "#b91c1c", bg: "#fee2e2", abbr: "A" };
    }
    if (day.WorkLocationType === "WFH" || day.WorkLocationType === "Home") {
        return { label: "WFH", color: "#4338ca", bg: "#ede9fe", abbr: "W" };
    }
    if (day.WorkLocationType === "CustomerLoc") {
        return { label: "Customer Site", color: "#c2410c", bg: "#ffedd5", abbr: "C" };
    }
    if (day.ViolationType === "Early") {
        return { label: "Early", color: "#0284c7", bg: "#e0f2fe", abbr: "E" };
    }
    if (day.ViolationType === "Late" || day.ViolationType === "Both") {
        return { label: "Late", color: "#92400e", bg: "#fef9c3", abbr: "L" };
    }
    if (day.ManagerApprovalStatus === "Approved" && !day.CheckIn) {
        return { label: "Regularised", color: "#374151", bg: "#f3f4f6", abbr: "R" };
    }
    return { label: "Present", color: "#15803d", bg: "#dcfce7", abbr: "P" };
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
    panel: {
        display: "flex",
        flexDirection: "column",
        gap: "20px",
    },
    mainGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        gap: "20px",
        alignItems: "start",
    },
    leftCol: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    // Hero card
    heroCard: {
        background: "linear-gradient(135deg, #c4b5fd 0%, #93c5fd 50%, #e9d5ff 100%)",
        borderRadius: "20px",
        padding: "25px 32px 16px 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: 'center',
        alignItems: 'center',
        gap: "8px",
        boxShadow: "0 4px 20px rgba(139,92,246,0.2)",
    },
    heroStatusRow: {
        display: "flex",
        justifyContent: "center",
    },
    heroStatusBadge: {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "4px 14px",
        borderRadius: "20px",
        background: "rgba(255,255,255,0.5)",
        fontSize: "13px",
        fontWeight: "600",
        color: "#374151",
    },
    heroStatusDot: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: "#9ca3af",
    },
    heroStatusDotGreen: {
        width: "8px",
        height: "8px",
        borderRadius: "50%",
        background: "#16a34a",
    },
    heroClock: {
        fontSize: "xxx-large",
        fontWeight: "800",
        color: "#1e1b4b",
        textAlign: "center",
        lineHeight: "1",
        letterSpacing: "-2px",
        fontVariantNumeric: "tabular-nums",
    },
    heroDate: {
        fontSize: "15px",
        color: "#3730a3",
        textAlign: "center",
        fontWeight: "500",
    },
    heroShift: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        fontSize: "13px",
        color: "#4338ca",
        padding: "6px 16px",
        background: "rgba(255,255,255,0.4)",
        borderRadius: "20px",
        alignSelf: "center",
        marginTop: "4px",
    },
    heroBtn: {
        marginTop: "4px",
        padding: "12px 30px",
        borderRadius: "50px",
        fontSize: "small",
        fontWeight: "700",
        cursor: "pointer",
        border: "none",
        width: "100%",
        maxWidth: 'max-content',

    },
    heroBtnCheckIn: {
        background: "#16a34a",
        color: "#fff",
    },
    heroBtnCheckOut: {
        background: "#dc2626",
        color: "#fff",
    },
    heroLocation: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        fontSize: "12px",
        color: "#4338ca",
        marginTop: "2px",
    },
    // Timeline card
    timelineCard: {
        background: "#fff",
        borderRadius: "16px",
        padding: "20px 24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    },
    timelineTitle: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#111827",
        marginBottom: "16px",
    },
    timelineRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "0",
    },
    timelineCell: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "0 16px",
        borderRight: "1px solid #f3f4f6",
        ":first-child": { paddingLeft: "0" },
        ":last-child": { paddingRight: "0", borderRight: "none" },
    },
    timelineCellLabel: {
        fontSize: "11px",
        color: "#9ca3af",
        fontWeight: "500",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
    },
    timelineCellValue: {
        fontSize: "18px",
        fontWeight: "700",
        color: "#111827",
    },
    timelineCellSub: {
        fontSize: "11px",
        color: "#9ca3af",
    },
    // Last 7 days card
    recentCard: {
        background: "#fff",
        borderRadius: "16px",
        padding: "20px 24px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    },
    recentHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "16px",
    },
    recentTitle: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#111827",
    },
    recentTiles: {
        display: "flex",
        gap: "8px",
        overflowX: "auto",
    },
    recentTile: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "6px",
        minWidth: "72px",
        flexShrink: 0,
    },
    recentTileBox: {
        width: "56px",
        height: "56px",
        borderRadius: "12px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px",
    },
    recentTileDay: {
        fontSize: "10px",
        fontWeight: "600",
        color: "#6b7280",
    },
    recentTileDate: {
        fontSize: "16px",
        fontWeight: "700",
    },
    recentTileLabel: {
        fontSize: "10px",
        color: "#6b7280",
        textAlign: "center",
    },
    // Actions row
    actionsRow: {
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "12px",
    },
    actionBtn: {
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "16px 12px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        transition: "box-shadow 0.15s",
        ":hover": { boxShadow: "0 2px 8px rgba(0,0,0,0.1)" },
    },
    actionBtnIcon: {
        width: "40px",
        height: "40px",
        borderRadius: "12px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    actionBtnLabel: {
        fontSize: "12px",
        fontWeight: "500",
        color: "#374151",
        textAlign: "center",
    },
    // Right: Leave overview
    leaveCard: {
        background: "#fff",
        borderRadius: "16px",
        padding: "20px 22px",
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        height: 'stretch'
    },
    leaveCardTitle: {
        fontSize: "15px",
        fontWeight: "600",
        color: "#111827",
    },
    leaveHighlightRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: "10px",
    },
    leaveHighlight: {
        borderRadius: "12px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    leaveHighlightCount: {
        fontSize: "24px",
        fontWeight: "800",
    },
    leaveHighlightType: {
        fontSize: "11px",
        fontWeight: "600",
        color: "#6b7280",
    },
    leaveHighlightBar: {
        marginTop: "6px",
        height: "4px",
        borderRadius: "4px",
        background: "rgba(0,0,0,0.1)",
        overflow: "hidden",
    },
    leaveHighlightFill: {
        height: "100%",
        borderRadius: "4px",
    },
    leaveHighlightMeta: {
        display: "flex",
        justifyContent: "space-between",
        marginTop: "4px",
        fontSize: "10px",
        color: "#9ca3af",
    },
    leaveItem: {
        display: "flex",
        flexDirection: "column",
        gap: "6px",
    },
    leaveItemRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    leaveItemName: {
        fontSize: "13px",
        color: "#374151",
        fontWeight: "500",
    },
    leaveItemCount: {
        fontSize: "13px",
        color: "#374151",
        fontWeight: "600",
    },
    leaveBar: {
        height: "6px",
        background: "#f3f4f6",
        borderRadius: "4px",
        overflow: "hidden",
    },
    leaveBarFill: {
        height: "100%",
        borderRadius: "4px",
        background: "#0078D4",
    },
    spinnerWrap: {
        display: "flex",
        justifyContent: "center",
        padding: "40px",
    },
    dialogWorkLocOption: {
        display: "flex",
        flexDirection: "column",
        gap: "12px",
    },
    locationBox: {
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        textAlign: "center",
        fontSize: "12px",
        color: "#6b7280",
        marginTop: "8px",
    },
});

// ─── Leave colour map ──────────────────────────────────────────────────── ─────

const LEAVE_COLORS = ["#f97316", "#8b5cf6", "#0078D4", "#16a34a", "#ec4899", "#ca8a04"];

// ─── Component ────────────────────────────────────────────────────────────────

const MyAttendancePanel: React.FC = () => {
    const styles = useStyles();
    const { currentUser } = useAuth();
    const nav = useNavigate();
    const toasterId = useId("toaster");
    const { dispatchToast } = useToastController(toasterId);

    const userId = currentUser?.userID ?? "";

    // ── State ────────────────────────────────────────────────────────────────
    const [userData, setUserData] = useState<EntraADUser | null>(null);
    const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
    const [monthRecords, setMonthRecords] = useState<AttendanceRecord[]>([]);
    const [recentDays, setRecentDays] = useState<RecentAttendanceDay[]>([]);
    const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Check-in dialog
    const [dialogOpen, setDialogOpen] = useState(false);
    const [workLocation, setWorkLocation] = useState("Office");
    const [detectedCoords, setDetectedCoords] = useState<string | null>(null);
    const [detectedAddr, setDetectedAddr] = useState<string | null>(null);
    const [isWithinGeofence, setIsWithinGeofence] = useState<boolean | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [checkInLoading, setCheckInLoading] = useState(false);
    const [checkOutLoading, setCheckOutLoading] = useState(false);

    // ── Weekend check-in state ────────────────────────────────────────────────
    const [isWeekendDialogOpen, setIsWeekendDialogOpen] = useState(false);
    const [weekendCheckinReason, setWeekendCheckinReason] = useState("");

    const isCheckedIn = !!(todayRecord?.CheckIn && !todayRecord?.CheckOut && todayRecord?.IsActive);

    // ── Clock ────────────────────────────────────────────────────────────────
    useEffect(() => {
        const id = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    // ── Load data ────────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        if (!userId) return;
        setLoading(true);
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        try {
            const [userRes, histRes, recentRes, balRes] = await Promise.all([
                getEntraUserById(userId),
                getAttendanceHistory(userId, now.getMonth() + 1, now.getFullYear()),
                getRecentAttendance(userId, 7),
                getLeaveBalances(userId),
            ]);
            if (userRes.success && userRes.data) setUserData(userRes.data);
            const recs = histRes ?? [];
            setMonthRecords(recs);
            const active = recs.find(r => {
                const rDate = new Date(r.CreatedOn).toISOString().split("T")[0];
                return rDate === todayStr && r.IsActive;
            }) ?? null;
            setTodayRecord(active);
            setRecentDays(recentRes ?? []);
            if (balRes.success && balRes.data) setLeaveBalances(balRes.data);
        } catch {
            // silently fail individual failures
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Geolocation detect ───────────────────────────────────────────────────
    const detectLocation = useCallback(async () => {
        setLocationLoading(true);
        setDetectedCoords(null);
        setDetectedAddr(null);
        setIsWithinGeofence(null);
        try {
            const pos = await getLocation();
            const coordStr = formatCoordinates(pos);
            setDetectedCoords(coordStr);
            setDetectedAddr(`${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);

            if (userData?.Office_Location_Coordinates) {
                const office = parseCoordinates(userData.Office_Location_Coordinates);
                if (office) {
                    const dist = calculateDistance(pos.lat, pos.lng, office.lat, office.lng);
                    const radius = 300;
                    setIsWithinGeofence(dist <= radius);
                }
            }
        } catch (e: any) {
            setDetectedAddr("Could not detect location");
        } finally {
            setLocationLoading(false);
        }
    }, [userData]);

    const handleOpenCheckIn = useCallback(() => {
        setDialogOpen(true);
        detectLocation();
    }, [detectLocation]);

    // ── Check-in ─────────────────────────────────────────────────────────────
    const handleCheckIn = async (weekendOverride?: { isWeekend: boolean; weekendReason: string }) => {
        if (!userId) return;
        setCheckInLoading(true);
        try {
            await checkIn({
                userId,
                createdBy: userId,
                currentCoordinates: detectedCoords,
                currentLocation: detectedAddr,
                workLocation,
                isWeekend: weekendOverride?.isWeekend ?? false,
                weekendReason: weekendOverride?.weekendReason,
            },setIsWeekendDialogOpen);
            setDialogOpen(false);
            dispatchToast(
                <Toast><ToastTitle>Checked in successfully</ToastTitle></Toast>,
                { intent: "success" }
            );
            await loadData();
        } catch (e: any) {
            if (e?.response?.data?.isWeekend || e?.isWeekend) {
                setIsWeekendDialogOpen(true);
                return;
            }
            dispatchToast(
                <Toast><ToastTitle>Check-in failed</ToastTitle><ToastBody>{e.message}</ToastBody></Toast>,
                { intent: "error" }
            );
        } finally {
            setCheckInLoading(false);
        }
    };

    // ── Check-out ────────────────────────────────────────────────────────────
    const handleCheckOut = async () => {
        if (!userId) return;
        setCheckOutLoading(true);
        try {
            await checkOut({ userId, modifiedBy: userId });
            dispatchToast(
                <Toast><ToastTitle>Checked out successfully</ToastTitle></Toast>,
                { intent: "success" }
            );
            await loadData();
        } catch (e: any) {
            dispatchToast(
                <Toast><ToastTitle>Check-out failed</ToastTitle><ToastBody>{e.message}</ToastBody></Toast>,
                { intent: "error" }
            );
        } finally {
            setCheckOutLoading(false);
        }
    };

    // ── Derived ──────────────────────────────────────────────────────────────
    const weekHrs = getWeekHours(monthRecords);
    const shiftLabel = userData?.StartTime && userData?.EndTime
        ? `${fmtShift(userData.StartTime)} – ${fmtShift(userData.EndTime)}`
        : userData?.ShiftName ?? "";

    // Leave highlight (first 2 balances)
    const highlightBalances = leaveBalances.slice(0, 2);
    const otherBalances = leaveBalances.slice(2);

    // 7-day tiles — build full 7-day array (most recent first)
    const sevenDayTiles: Array<{ dateStr: string; day: RecentAttendanceDay | null }> = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0];
        const found = recentDays.find(r => r.AttDate === ds) ?? null;
        sevenDayTiles.push({ dateStr: ds, day: found });
    }

    if (loading) {
        return <div className={styles.spinnerWrap}><Spinner label="Loading attendance…" /></div>;
    }

    return (
        <div className={styles.panel}>
            <Toaster toasterId={toasterId} position="top-end" />

            {/* ── Main grid ─────────────────────────────────────────────── */}
            <div className={styles.mainGrid}>

                {/* Left column */}
                <div className={styles.leftCol}>

                 

                    <CheckInCard/>

                    {/* Today's Timeline */}
                    <div className={styles.timelineCard}>
                        <div className={styles.timelineTitle}>Today's Timeline</div>
                        <div className={styles.timelineRow}>
                            <div className={styles.timelineCell}>
                                <span className={styles.timelineCellLabel}>Check-In</span>
                                <span className={styles.timelineCellValue}>
                                    {todayRecord?.CheckIn ? fmtTime(todayRecord.CheckIn) : "—"}
                                </span>
                                <span className={styles.timelineCellSub}>
                                    {todayRecord?.CheckIn
                                        ? (todayRecord.ViolationType === "Early"
                                            ? "Early arrival"
                                            : todayRecord.ViolationType === "Late" || todayRecord.ViolationType === "Both"
                                            ? "Late arrival"
                                            : "On time")
                                        : "Pending"}
                                </span>
                            </div>
                            <div className={styles.timelineCell}>
                                <span className={styles.timelineCellLabel}>Check-Out</span>
                                <span className={styles.timelineCellValue}>
                                    {todayRecord?.CheckOut ? fmtTime(todayRecord.CheckOut) : "—"}
                                </span>
                                <span className={styles.timelineCellSub}>
                                    {todayRecord?.CheckOut
                                        ? "Completed"
                                        : userData?.EndTime
                                            ? `Est. ${fmtShift(userData.EndTime)}`
                                            : "—"}
                                </span>
                            </div>
                            <div className={styles.timelineCell}>
                                <span className={styles.timelineCellLabel}>Week Hours</span>
                                <span className={styles.timelineCellValue} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    {weekHrs.hasInvalidData
                                        ? <Warning24Filled style={{ color: "#d97706", width: 18, height: 18 }} />
                                        : `${weekHrs.worked}h`}
                                </span>
                                <span className={styles.timelineCellSub}>
                                    {weekHrs.hasInvalidData
                                        ? "Data error — check records"
                                        : `of ${weekHrs.expected}h expected`}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column — Leave Overview */}
                <div className={styles.leaveCard}>
                    <div className={styles.leaveCardTitle}>Leave Overview</div>

                    {/* Highlights: first 2 leave types */}
                    {highlightBalances.length > 0 && (
                        <div className={styles.leaveHighlightRow}>
                            {highlightBalances.map((lb, i) => {
                                const color = LEAVE_COLORS[i % LEAVE_COLORS.length];
                                const pct = lb.TotalDays > 0 ? (lb.AvailableDays / lb.TotalDays) * 100 : 0;
                                return (
                                    <div
                                        key={lb.LeaveType}
                                        className={styles.leaveHighlight}
                                        style={{ background: `${color}18` }}
                                    >
                                        <span className={styles.leaveHighlightCount} style={{ color }}>
                                            {lb.AvailableDays}
                                        </span>
                                        <span className={styles.leaveHighlightType}>{displayLeaveLabel(lb.LeaveType)}</span>
                                        <div className={styles.leaveHighlightBar}>
                                            <div
                                                className={styles.leaveHighlightFill}
                                                style={{ width: `${pct}%`, background: color }}
                                            />
                                        </div>
                                        <div className={styles.leaveHighlightMeta}>
                                            <span>{lb.UsedDays} of {lb.TotalDays} Used</span>
                                            <span>{lb.AvailableDays} Left</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Other leave types as bars */}
                    {otherBalances.map((lb, i) => {
                        const color = LEAVE_COLORS[(i + 2) % LEAVE_COLORS.length];
                        const pct = lb.TotalDays > 0 ? (lb.UsedDays / lb.TotalDays) * 100 : 0;
                        return (
                            <div key={lb.LeaveType} className={styles.leaveHighlight}>
                                <div className={styles.leaveItemRow}>
                                    <span className={styles.leaveItemName}>{displayLeaveLabel(lb.LeaveType)}</span>
                                    <span className={styles.leaveItemCount}>{lb.UsedDays} / {lb.TotalDays}</span>
                                </div>
                                <div className={styles.leaveBar}>
                                    <div
                                        className={styles.leaveBarFill}
                                        style={{ width: `${pct}%`, background: color }}
                                    />
                                </div>
                            </div>
                        );
                    })}

                    {leaveBalances.length === 0 && (
                        <Text style={{ fontSize: "13px", color: "#9ca3af" }}>No leave data available.</Text>
                    )}
                    </div>
            </div>

            {/* ── Last 7 Days ───────────────────────────────────────────── */}
            <div className={styles.recentCard}>
                <div className={styles.recentHeader}>
                    <span className={styles.recentTitle}>Last 7 Days</span>
                    <button
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "13px", color: "#0078D4", fontWeight: "500" }}
                        onClick={() => nav("/Attendance/History")}
                    >
                        Attendance Log
                    </button>
                </div>

                {/* Legend */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", justifyContent: "start", gap: "4px 16px", marginBottom: "4px" }}>
                    {[
                        { color: "#dcfce7", label: "Present", border: "#86efac" },
                        { color: "#fef9c3", label: "Late", border: "#fde047" },
                        { color: "#ede9fe", label: "WFH", border: "#c4b5fd" },
                        { color: "#ffedd5", label: "Customer Site", border: "#fdba74" },
                        { color: "#fee2e2", label: "Absent", border: "#fca5a5" },
                        { color: "#dbeafe", label: "Today", border: "#93c5fd" },
                        { color: "#f3f4f6", label: "Regularised", border: "#d1d5db" },
                        { color: "#f3f4f6", label: "Weekend", border: "#d1d5db" },
                    ].map(({ color, label, border }) => (
                        <span key={label} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b7280" }}>
                            <span style={{ width: 9, height: 9, borderRadius: 2, background: color, border: border ? `1px solid ${border}` : "none", flexShrink: 0, display: "inline-block" }} />
                            {label}
                        </span>
                    ))}
                </div>

                <div className={styles.recentTiles}>
                    {sevenDayTiles.map(({ dateStr, day }) => {
                        const d = new Date(dateStr + "T00:00:00");
                        const dow = d.getDay();
                        const isWeekend = dow === 0 || dow === 6;
                        const isToday = dateStr === new Date().toISOString().split("T")[0];
                        const dayLabel = d.toLocaleDateString("en-IN", { weekday: "short" }).toUpperCase();
                        const dateNum = d.getDate();
                        const monthLabel = d.toLocaleDateString("en-IN", { month: "short" });

                        let bg = "#f3f4f6";
                        let textColor = "#6b7280";
                        let labelText = isWeekend ? "Weekend" : "—";
                        let tileBorder = "none";

                        if (isWeekend) {
                            bg = "#f3f4f6"; textColor = "#9ca3af"; tileBorder = "1px solid #d1d5db";
                        } else if (isToday && !day) {
                            bg = "#dbeafe"; textColor = "#1d4ed8"; labelText = "Today";
                        } else if (day) {
                            const cls = classifyDay(day);
                            bg = cls.bg; textColor = cls.color; labelText = cls.label;
                        } else {
                            // Past weekday, no record
                            bg = "#fee2e2"; textColor = "#b91c1c"; labelText = "Absent";
                        }

                        return (
                            <div key={dateStr} className={styles.recentTile}>
                                <div
                                    className={styles.recentTileBox}
                                    style={{ background: bg, border: tileBorder }}
                                >
                                    <span style={{ fontSize: "10px", fontWeight: "600", color: textColor, opacity: 0.85 }}>
                                        {dayLabel}
                                    </span>
                                    <span style={{ fontSize: "20px", fontWeight: "800", color: textColor, lineHeight: "1" }}>
                                        {dateNum}
                                    </span>
                                </div>
                                <span className={styles.recentTileDay}>{monthLabel}</span>
                                <span className={styles.recentTileLabel} style={{ color: isWeekend ? "#d1d5db" : "#6b7280" }}>
                                    {labelText}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Quick actions ─────────────────────────────────────────── */}
            <div className={styles.actionsRow}>
                {[
                    { label: "Request Leave", icon: <CalendarLtr20Regular />, bg: "#fef9c3", color: "#ca8a04", path: "/Attendance/MyRequests?tab=leave&action=create" },
                    { label: "Request Permission", icon: <ClockRegular style={{ width: 20, height: 20 }} />, bg: "#ede9fe", color: "#7c3aed", path: "/Attendance/MyRequests?tab=permission&action=create" },
                    { label: "Fix My Attendance", icon: <ArrowSync20Regular />, bg: "#dbeafe", color: "#1d4ed8", path: "/Attendance/MyRequests?tab=regularization&action=create" },
                    // { label: "View History", icon: <History20Regular />, bg: "#dcfce7", color: "#16a34a", path: "/Attendance/MyRequests?tab=permission&action=create" },
                ].map(({ label, icon, bg, color, path }) => (
                    <button key={label} className={styles.actionBtn} onClick={() => nav(path)}>
                        <div className={styles.actionBtnIcon} style={{ background: bg, color }}>
                            {icon}
                        </div>
                        <span className={styles.actionBtnLabel}>{label}</span>
                    </button>
                ))}
            </div>

            {/* ── Check-in dialog ───────────────────────────────────────── */}
            <Dialog open={dialogOpen} onOpenChange={(_, d) => setDialogOpen(d.open)}>
                <DialogSurface style={{ maxWidth: "420px" }}>
                    <DialogBody>
                        <DialogTitle>Check In</DialogTitle>
                        <DialogContent>
                            <div className={styles.dialogWorkLocOption}>
                                <Field label="Work location">
                                    <RadioGroup
                                        value={workLocation}
                                        onChange={(_, d) => setWorkLocation(d.value)}
                                        layout="horizontal"
                                    >
                                        <Radio value="Office" label="Office" />
                                        <Radio value="WFH" label="WFH" />
                                        <Radio value="CustomerLoc" label="Customer Site" />
                                    </RadioGroup>
                                </Field>
                                <div className={styles.locationBox}>
                                    {locationLoading ? (
                                        <Spinner size="tiny" label="Detecting location…" />
                                    ) : detectedAddr ? (
                                        <>
                                            <LocationRegular style={{ color: isWithinGeofence === false ? "#dc2626" : "#16a34a", width: 20, height: 20 }} />
                                            <span style={{ fontSize: "12px", color: "#374151", fontWeight: "500" }}>
                                                {detectedAddr}
                                            </span>
                                            {isWithinGeofence !== null && (
                                                <span style={{ fontSize: "11px", color: isWithinGeofence ? "#16a34a" : "#dc2626", fontWeight: "600" }}>
                                                    {isWithinGeofence ? "✓ Within geofence" : "⚠ Outside geofence"}
                                                    {userData?.Office_Location ? ` · ${userData.Office_Location}` : ""}
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span style={{ fontSize: "12px", color: "#9ca3af" }}>Location not detected</span>
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button
                                appearance="primary"
                                onClick={() => handleCheckIn()}
                                disabled={checkInLoading}
                            >
                                {checkInLoading ? "Checking in…" : "Confirm Check In"}
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            {/* ── Weekend Check-in Reason Dialog ── */}
            <Dialog open={isWeekendDialogOpen} onOpenChange={(_, data) => { setIsWeekendDialogOpen(data.open); if (!data.open) setWeekendCheckinReason(""); }}>
                <DialogSurface style={{ maxWidth: "400px", borderRadius: "24px", padding: "16px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                    <DialogBody>
                        <DialogTitle>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ backgroundColor: "#F59E0B", color: "white", borderRadius: "8px", padding: "6px", display: "flex" }}>
                                    <Warning24Filled />
                                </div>
                                <Text weight="bold" size={400}>Weekend Check-in</Text>
                            </div>
                        </DialogTitle>
                        <DialogContent>
                            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                                <div style={{ display: "flex", gap: "12px", padding: "12px", borderRadius: "8px", backgroundColor: "#FFFBE6", border: "1px solid #FFE58F" }}>
                                    <Warning24Filled style={{ color: "#FAAD14", fontSize: "20px", flexShrink: 0 }} />
                                    <Text style={{ color: "#856404", fontSize: "12px", lineHeight: "1.4" }}>
                                        Today is a weekend. Please provide a reason to proceed with check-in.
                                    </Text>
                                </div>
                                <Field label="Reason" required>
                                    <Textarea
                                        value={weekendCheckinReason}
                                        onChange={(_, d) => setWeekendCheckinReason(d.value)}
                                        placeholder="E.g., Project deadline, client requirement..."
                                        rows={3}
                                    />
                                </Field>
                            </div>
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" onClick={() => { setIsWeekendDialogOpen(false); setWeekendCheckinReason(""); }}>
                                Cancel
                            </Button>
                            <Button
                                appearance="primary"
                                disabled={!weekendCheckinReason.trim()}
                                onClick={() => {
                                    setIsWeekendDialogOpen(false);
                                    handleCheckIn({ isWeekend: true, weekendReason: weekendCheckinReason.trim() });
                                    setWeekendCheckinReason("");
                                }}
                            >
                                Confirm Check In
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </div>
    );
};

export default MyAttendancePanel;
