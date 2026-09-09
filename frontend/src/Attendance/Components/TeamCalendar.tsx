import React, { useEffect, useState, useCallback } from "react";
import { makeStyles, Text, Spinner, Tooltip } from "@fluentui/react-components";
import {
    ChevronLeft20Regular,
    ChevronRight20Regular,
} from "@fluentui/react-icons";
import {
    getTeamCalendar,
    TeamCalendarData,
    TeamCalendarAttendanceRow,
    TeamCalendarLeaveRow,
} from "../Services/TeamViewService";

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
    },
    toolbar: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 20px",
        borderBottom: "1px solid #e5e7eb",
        flexWrap: "wrap",
        flexShrink: 0,
    },
    navGroup: { display: "flex", alignItems: "center", gap: "4px" },
    navBtn: {
        background: "none",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        padding: "5px",
        borderRadius: "6px",
        color: "#374151",
    },
    rangeLabel: {
        fontSize: "17px",
        fontWeight: "700",
        color: "#111827",
        minWidth: "160px",
    },
    todayBtn: {
        padding: "5px 14px",
        borderRadius: "8px",
        border: "1.5px solid #d1d5db",
        fontSize: "13px",
        color: "#374151",
        cursor: "pointer",
        fontWeight: "500",
    },
    viewToggle: {
        display: "flex",
        borderRadius: "8px",
        border: "1.5px solid #e5e7eb",
        overflow: "hidden",
    },
    viewBtn: {
        padding: "5px 16px",
        border: "none",
        background: "none",
        fontSize: "13px",
        color: "#6b7280",
        cursor: "pointer",
        fontWeight: "500",
    },
    viewBtnActive: { background: "#0078D4", color: "#fff" },
    legendRow: {
        display: "flex",
        gap: "14px",
        alignItems: "center",
        flexWrap: "wrap",
        marginLeft: "auto",
    },
    legendItem: {
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "11px",
        color: "#374151",
    },
    legendDot: {
        width: "12px",
        height: "12px",
        borderRadius: "3px",
        display: "inline-block",
        flexShrink: 0,
    },
    memberCount: {
        fontSize: "12px",
        color: "#6b7280",
        whiteSpace: "nowrap",
    },
    spinnerWrap: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "80px 0",
    },
    emptyState: {
        textAlign: "center",
        padding: "60px",
        color: "#6b7280",
        fontSize: "14px",
    },

    // ── WEEK VIEW ──────────────────────────────────────────────────────────
    weekWrap: {
        flex: "1",
        overflowX: "auto",
        overflowY: "auto",
    },
    weekGrid: {
        display: "grid",
        minWidth: "max-content",
        // gridTemplateColumns set inline
    },
    weekCorner: {
        padding: "10px 16px",
        borderBottom: "2px solid #e5e7eb",
        borderRight: "1px solid #e5e7eb",
        position: "sticky",
        left: 0,
        top: 0,
        zIndex: 3,
        display: "flex",
        alignItems: "center",
        minWidth: "180px",
    },
    weekDayHeader: {
        padding: "10px 8px",
        textAlign: "center",
        borderBottom: "2px solid #e5e7eb",
        borderRight: "1px solid #f3f4f6",
        backgroundColor: "#f9fafb",
        position: "sticky",
        top: 0,
        zIndex: 2,
        minWidth: "110px",
    },
    weekDayHeaderToday: { backgroundColor: "#eff6ff" },
    weekMemberCell: {
        padding: "10px 16px",
        borderBottom: "2px solid #e5e7eb",
        borderRight: "1px solid #e5e7eb",
        backgroundColor: "#fff",
        position: "sticky",
        left: 0,
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        minWidth: "180px",
    },
    weekDayCell: {
        padding: "6px",
        borderBottom: "2px solid #e5e7eb",
        borderRight: "1px solid #f3f4f6",
        minWidth: "110px",
        minHeight: "60px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    weekChip: {
        borderRadius: "8px",
        padding: "5px 8px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
        fontSize: "12px",
        fontWeight: "600",
        lineHeight: "1.3",
        textAlign: "center",
    },

    // ── MONTH VIEW ─────────────────────────────────────────────────────────
    monthWrap: {
        flex: "1",
        overflowX: "auto",
        overflowY: "auto",
    },
    monthTable: {
        borderCollapse: "collapse" as const,
        minWidth: "max-content",
        width: "100%",
    },
    monthCornerTh: {
        padding: "8px 14px",
        borderBottom: "2px solid #e5e7eb",
        borderRight: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        position: "sticky" as const,
        left: 0,
        top: 0,
        zIndex: 3,
        minWidth: "160px",
        textAlign: "left" as const,
        fontSize: "12px",
        fontWeight: "600",
        color: "#6b7280",
    },
    monthDayTh: {
        padding: "6px 2px",
        borderBottom: "2px solid #e5e7eb",
        borderRight: "1px solid #f3f4f6",
        backgroundColor: "#f9fafb",
        position: "sticky" as const,
        top: 0,
        zIndex: 2,
        width: "36px",
        minWidth: "36px",
        maxWidth: "36px",
        textAlign: "center" as const,
        fontSize: "10px",
        fontWeight: "600",
        color: "#6b7280",
    },
    monthMemberTd: {
        padding: "6px 14px",
        borderBottom: "2px solid #e5e7eb",
        borderRight: "1px solid #e5e7eb",
        backgroundColor: "#fff",
        position: "sticky" as const,
        left: 0,
        zIndex: 1,
        minWidth: "160px",
    },
    monthDayTd: {
        width: "36px",
        minWidth: "36px",
        maxWidth: "36px",
        height: "44px",
        borderBottom: "2px solid #e5e7eb",
        borderRight: "1px solid #f3f4f6",
        padding: "2px",
        textAlign: "center" as const,
        verticalAlign: "middle" as const,
        position: "relative" as const,
    },

    // Avatar shared
    avatar: {
        width: "30px",
        height: "30px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: "600",
        color: "#fff",
        flexShrink: 0,
    },
    memberNameText: {
        fontSize: "13px",
        fontWeight: "500",
        color: "#111827",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    memberSubText: {
        fontSize: "10px",
        color: "#9ca3af",
        whiteSpace: "nowrap",
    },
});

// ─── Constants ───────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    "#0078D4", "#107C10", "#D83B01", "#8764B8",
    "#038387", "#C19C00", "#881798", "#00B294",
];

const LOC_CONFIG: Record<string, { label: string; short: string; bg: string; color: string }> = {
    Office:       { label: "Office",      short: "O", bg: "#dcfce7", color: "#15803d" },
    Home:         { label: "WFH",         short: "W", bg: "#dbeafe", color: "#1d4ed8" },
    WorkFromHome: { label: "WFH",         short: "W", bg: "#dbeafe", color: "#1d4ed8" },
    CustomerLoc:  { label: "Client site", short: "C", bg: "#fef9c3", color: "#a16207" },
    Other:        { label: "Other",       short: "X", bg: "#f3f4f6", color: "#6b7280" },
};

const LEAVE_COLORS = [
    { bg: "#fee2e2", color: "#dc2626" }, // Sick
    { bg: "#fef9c3", color: "#ca8a04" }, // Casual
    { bg: "#dcfce7", color: "#16a34a" }, // Earned
    { bg: "#ede9fe", color: "#7c3aed" }, // Other
];

const MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
];

const DAY_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function fmtDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatShiftRange(start: string | null, end: string | null): string {
    if (!start || !end) return "";
    return `${start.slice(0, 5)}–${end.slice(0, 5)}`;
}

function isWeekend(d: Date): boolean { const day = d.getDay(); return day === 0 || day === 6; }

function isToday(d: Date): boolean {
    const n = new Date();
    return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function buildWeekDays(anchor: Date): Date[] {
    const start = new Date(anchor);
    start.setDate(anchor.getDate() - anchor.getDay()); // Sunday
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start); d.setDate(start.getDate() + i); return d;
    });
}

function buildMonthDays(anchor: Date): Date[] {
    const y = anchor.getFullYear(), m = anchor.getMonth();
    const last = new Date(y, m + 1, 0).getDate();
    return Array.from({ length: last }, (_, i) => new Date(y, m, i + 1));
}

function rangeLabel(mode: "week" | "month", anchor: Date): string {
    if (mode === "month") return `${MONTH_NAMES[anchor.getMonth()]} ${anchor.getFullYear()}`;
    const days = buildWeekDays(anchor);
    const s = days[0], e = days[6];
    if (s.getMonth() === e.getMonth())
        return `${s.getDate()}–${e.getDate()} ${MONTH_NAMES[s.getMonth()]} ${s.getFullYear()}`;
    return `${s.getDate()} ${MONTH_NAMES[s.getMonth()]} – ${e.getDate()} ${MONTH_NAMES[e.getMonth()]} ${e.getFullYear()}`;
}

function navigateAnchor(mode: "week" | "month", anchor: Date, dir: -1 | 1): Date {
    const d = new Date(anchor);
    if (mode === "week") { d.setDate(d.getDate() + dir * 7); return d; }
    d.setMonth(d.getMonth() + dir);
    return d;
}

function getLeaveConfig(name: string | null): { bg: string; color: string; short: string } {
    if (!name) return { ...LEAVE_COLORS[3], short: "L" };
    const l = name.toLowerCase();
    if (l.includes("sick"))                          return { ...LEAVE_COLORS[0], short: "S"  };
    if (l.includes("casual"))                        return { ...LEAVE_COLORS[1], short: "Ca" };
    if (l.includes("earn") || l.includes("annual"))  return { ...LEAVE_COLORS[2], short: "E"  };
    return { ...LEAVE_COLORS[3], short: "L" };
}

// Returns the leave covering this employee+date, or null
function findLeave(
    employeeId: string,
    date: Date,
    leaves: TeamCalendarLeaveRow[]
): TeamCalendarLeaveRow | null {
    return leaves.find(l => {
        if (l.employeeId !== employeeId) return false;
        const s = new Date(l.leaveStartDate); s.setHours(0, 0, 0, 0);
        const e = new Date(l.leaveEndDate);   e.setHours(23, 59, 59, 999);
        return date >= s && date <= e;
    }) ?? null;
}

// Is this date the FIRST day of this leave span (within the displayed range)?
function isLeaveFirstDay(leave: TeamCalendarLeaveRow, date: Date, rangeStart: Date): boolean {
    const s = new Date(leave.leaveStartDate); s.setHours(0, 0, 0, 0);
    const rs = new Date(rangeStart);          rs.setHours(0, 0, 0, 0);
    // First day in view = whichever is later: leave start or range start
    const effectiveStart = s >= rs ? s : rs;
    return fmtDate(effectiveStart) === fmtDate(date);
}

// How many days does a leave span cover from this date to end of leave or end of displayed range?
function leaveSpanCols(leave: TeamCalendarLeaveRow, fromDate: Date, rangeEnd: Date): number {
    const e = new Date(leave.leaveEndDate); e.setHours(0, 0, 0, 0);
    const re = new Date(rangeEnd);          re.setHours(0, 0, 0, 0);
    const effectiveEnd = e <= re ? e : re;
    const from = new Date(fromDate); from.setHours(0, 0, 0, 0);
    const diff = Math.round((effectiveEnd.getTime() - from.getTime()) / 86400000) + 1;
    return Math.max(1, diff);
}

// ─── Shared Avatar + Member label ────────────────────────────────────────────

interface MemberLabelProps {
    name: string;
    subText: string;
    styles: ReturnType<typeof useStyles>;
}
const MemberLabel: React.FC<MemberLabelProps> = ({ name, subText, styles }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
        <div className={styles.avatar} style={{ background: getAvatarColor(name) }}>
            {getInitials(name)}
        </div>
        <div style={{ minWidth: 0 }}>
            <div className={styles.memberNameText}>{name}</div>
            {subText && <div className={styles.memberSubText}>{subText}</div>}
        </div>
    </div>
);

// ─── Week View ────────────────────────────────────────────────────────────────

interface WeekViewProps {
    days: Date[];
    data: TeamCalendarData;
    attMap: Map<string, TeamCalendarAttendanceRow>;
    styles: ReturnType<typeof useStyles>;
}
const WeekView: React.FC<WeekViewProps> = ({ days, data, attMap, styles }) => {
    const colTemplate = `180px repeat(${days.length}, minmax(110px, 1fr))`;

    return (
        <div className={styles.weekWrap}>
            <div className={styles.weekGrid} style={{ gridTemplateColumns: colTemplate }}>

                {/* Header */}
                <div className={styles.weekCorner}>
                    <Text style={{ fontSize: "12px", fontWeight: "600", color: "#6b7280" }}>Team member</Text>
                </div>
                {days.map(d => (
                    <div
                        key={fmtDate(d)}
                        className={`${styles.weekDayHeader} ${isToday(d) ? styles.weekDayHeaderToday : ""}`}
                        style={isWeekend(d) ? { background: "#f3f4f6" } : undefined}
                    >
                        <div style={{ fontSize: "11px", color: isToday(d) ? "#0078D4" : "#9ca3af", fontWeight: "600" }}>
                            {DAY_SHORT[d.getDay()]}
                        </div>
                        <div style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            color: isToday(d) ? "#0078D4" : "#111827",
                            lineHeight: "1.2",
                        }}>
                            {d.getDate()}
                        </div>
                        <div style={{ fontSize: "10px", color: "#9ca3af" }}>
                            {MONTH_NAMES[d.getMonth()].slice(0, 3)}
                        </div>
                    </div>
                ))}

                {/* Member rows */}
                {data.members.map(member => {
                    const subText = formatShiftRange(member.shiftStartTime, member.shiftEndTime) || member.department || "";
                    return (
                        <React.Fragment key={member.employeeId}>
                            <div className={styles.weekMemberCell}>
                                <MemberLabel name={member.name} subText={subText} styles={styles} />
                            </div>
                            {days.map(d => {
                                const dateKey = fmtDate(d);
                                const att = attMap.get(`${member.employeeId}|${dateKey}`);
                                const leave = findLeave(member.employeeId, d, data.leaves);
                                const weekend = isWeekend(d);
                                const todayCell = isToday(d);

                                return (
                                    <div
                                        key={dateKey}
                                        className={styles.weekDayCell}
                                        style={{
                                            background: todayCell ? "#eff6ff" : weekend ? "#fafafa" : undefined,
                                        }}
                                    >
                                        {leave && (() => {
                                            const lc = getLeaveConfig(leave.leaveTypeName);
                                            const isPending = leave.approvalStatus === "Pending";
                                            const shortName = (leave.leaveTypeName ?? "Leave").replace(" Leave", "");
                                            return (
                                                <Tooltip
                                                    relationship="description"
                                                    content={
                                                        <div style={{ fontSize: "12px", lineHeight: "1.7" }}>
                                                            <div style={{ fontWeight: "600" }}>{leave.leaveTypeName ?? "Leave"}</div>
                                                            <div style={{ color: "#d1d5db" }}>Status: {leave.approvalStatus}</div>
                                                        </div>
                                                    }
                                                >
                                                    <div
                                                        className={styles.weekChip}
                                                        style={{
                                                            background: isPending ? "#fff" : lc.bg,
                                                            color: isPending ? "#9ca3af" : lc.color,
                                                            border: isPending ? "1.5px dashed #d1d5db" : `1px solid ${lc.color}40`,
                                                        }}
                                                    >
                                                        <span>{isPending ? "Pending" : shortName}</span>
                                                        <span style={{ fontSize: "9px", opacity: 0.75 }}>Full day</span>
                                                    </div>
                                                </Tooltip>
                                            );
                                        })()}

                                        {!leave && att && att.checkIn && (() => {
                                            const loc = att.workLocationType ?? "Office";
                                            const cfg = LOC_CONFIG[loc] ?? LOC_CONFIG.Other;
                                            const violation = att.violationType === "Location" || att.violationType === "Both";
                                            return (
                                                <Tooltip
                                                    relationship="description"
                                                    content={
                                                        <div style={{ fontSize: "12px", lineHeight: "1.7" }}>
                                                            <div style={{ fontWeight: "600" }}>{cfg.label}{violation ? " · Location Violation" : ""}</div>
                                                            {att.checkIn && <div>Check-in: {formatTime(att.checkIn)}</div>}
                                                            {att.checkOut && <div>Check-out: {formatTime(att.checkOut)}</div>}
                                                            {att.checkIn && !att.checkOut && <div style={{ color: "#d1d5db" }}>Not checked out</div>}
                                                        </div>
                                                    }
                                                >
                                                    <div
                                                        className={styles.weekChip}
                                                        style={{
                                                            background: violation ? "#ede9fe" : cfg.bg,
                                                            color: violation ? "#7c3aed" : cfg.color,
                                                            border: violation ? "1px solid #c4b5fd" : `1px solid ${cfg.color}40`,
                                                        }}
                                                    >
                                                        <span>{violation ? `${cfg.short}!` : cfg.label}</span>
                                                        {att.checkIn && (
                                                            <span style={{ fontSize: "10px", opacity: 0.8 }}>
                                                                {formatTime(att.checkIn)}
                                                                {att.checkOut ? `–${formatTime(att.checkOut)}` : ""}
                                                            </span>
                                                        )}
                                                    </div>
                                                </Tooltip>
                                            );
                                        })()}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Month View — proper calendar grid ───────────────────────────────────────
// Layout: 7-column grid (Sun–Sat), each cell = one day, shows team member chips

interface MonthViewProps {
    days: Date[];
    data: TeamCalendarData;
    attMap: Map<string, TeamCalendarAttendanceRow>;
    styles: ReturnType<typeof useStyles>;
}

const MonthView: React.FC<MonthViewProps> = ({ days, data, attMap, styles }) => {
    return (
        <div className={styles.monthWrap}>
            <table className={styles.monthTable}>
                <thead>
                    <tr>
                        <th className={styles.monthCornerTh}>Team member</th>
                        {days.map(d => (
                            <th
                                key={fmtDate(d)}
                                className={styles.monthDayTh}
                                style={{
                                    backgroundColor: isToday(d) ? "#eff6ff" : isWeekend(d) ? "#f3f4f6" : undefined,
                                    color: isToday(d) ? "#0078D4" : isWeekend(d) ? "#9ca3af" : undefined,
                                }}
                            >
                                <div style={{ fontSize: "9px", lineHeight: "1" }}>
                                    {DAY_SHORT[d.getDay()]}
                                </div>
                                <div style={{ fontSize: "11px", fontWeight: "700", lineHeight: "1.4" }}>
                                    {d.getDate()}
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.members.map(member => (
                        <tr key={member.employeeId}>
                            <td className={styles.monthMemberTd}>
                                <MemberLabel name={member.name} subText={member.department ?? ""} styles={styles} />
                            </td>
                            {days.map(d => {
                                const dateKey  = fmtDate(d);
                                const att      = attMap.get(`${member.employeeId}|${dateKey}`);
                                const leave    = findLeave(member.employeeId, d, data.leaves);
                                const weekend  = isWeekend(d);
                                const todayCol = isToday(d);

                                let chip: React.ReactNode = null;

                                if (leave) {
                                    const lc        = getLeaveConfig(leave.leaveTypeName);
                                    const isPending = leave.approvalStatus === "Pending";
                                    const initial   = lc.short;
                                    chip = (
                                        <Tooltip
                                            withArrow
                                            relationship="description"
                                            content={
                                                <div style={{ fontSize: "12px", lineHeight: "1.7" }}>
                                                    <div style={{ fontWeight: "600" }}>{leave.leaveTypeName ?? "Leave"}</div>
                                                    <div style={{ color: "#d1d5db" }}>Status: {leave.approvalStatus}</div>
                                                </div>
                                            }
                                        >
                                            <span
                                                tabIndex={0}
                                                style={{
                                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                                    width: "28px", height: "28px", borderRadius: "4px",
                                                    background: isPending ? "#fff" : lc.bg,
                                                    color: isPending ? "#9ca3af" : lc.color,
                                                    border: isPending ? "1px dashed #d1d5db" : `1px solid ${lc.color}50`,
                                                    fontSize: "9px", fontWeight: "700", cursor: "default",
                                                }}
                                            >
                                                {isPending ? "P" : initial}
                                            </span>
                                        </Tooltip>
                                    );
                                } else if (att && att.checkIn) {
                                    const loc       = att.workLocationType ?? "Office";
                                    const cfg       = LOC_CONFIG[loc] ?? LOC_CONFIG.Other;
                                    const violation = att.violationType === "Location" || att.violationType === "Both";
                                    chip = (
                                        <Tooltip
                                            withArrow
                                            relationship="description"
                                            content={
                                                <div style={{ fontSize: "12px", lineHeight: "1.7" }}>
                                                    <div style={{ fontWeight: "600" }}>{cfg.label}{violation ? " · Location Violation" : ""}</div>
                                                    {att.checkIn && <div>Check-in:&nbsp;&nbsp;{formatTime(att.checkIn)}</div>}
                                                    {att.checkOut && <div>Check-out: {formatTime(att.checkOut)}</div>}
                                                    {att.checkIn && !att.checkOut && <div style={{ color: "#d1d5db" }}>Not checked out</div>}
                                                </div>
                                            }
                                        >
                                            <span
                                                tabIndex={0}
                                                style={{
                                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                                    width: "28px", height: "28px", borderRadius: "4px",
                                                    background: violation ? "#ede9fe" : cfg.bg,
                                                    color: violation ? "#7c3aed" : cfg.color,
                                                    border: violation ? "1px solid #c4b5fd" : `1px solid ${cfg.color}40`,
                                                    fontSize: "9px", fontWeight: "700", cursor: "default",
                                                }}
                                            >
                                                {violation ? "!" : cfg.short}
                                            </span>
                                        </Tooltip>
                                    );
                                }

                                return (
                                    <td
                                        key={dateKey}
                                        className={styles.monthDayTd}
                                        style={{ background: todayCol ? "#eff6ff" : weekend ? "#fafafa" : undefined }}
                                    >
                                        {chip}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props { managerId: string; }
type ViewMode = "week" | "month";

const TeamCalendar: React.FC<Props> = ({ managerId }) => {
    const styles = useStyles();

    const [viewMode, setViewMode]   = useState<ViewMode>("month");
    const [anchor, setAnchor]       = useState<Date>(new Date());
    const [data, setData]           = useState<TeamCalendarData | null>(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);

    const days      = viewMode === "week" ? buildWeekDays(anchor) : buildMonthDays(anchor);
    const startDate = days[0];
    const endDate   = days[days.length - 1];

    const load = useCallback(async () => {
        if (!managerId) return;
        setLoading(true);
        setError(null);
        try {
            setData(await getTeamCalendar(managerId, startDate, endDate));
        } catch {
            setError("Failed to load Team Attendance Calendar.");
        } finally {
            setLoading(false);
        }
    }, [managerId, fmtDate(startDate), fmtDate(endDate)]);

    useEffect(() => { load(); }, [load]);

    // Build attendance lookup map (normalize date to strip any time component)
    const attMap = new Map<string, TeamCalendarAttendanceRow>();
    data?.attendance.forEach(r => attMap.set(`${r.employeeId}|${r.date?.split("T")[0]}`, r));

    return (
        <div className={styles.root}>

            {/* ── Toolbar ──────────────────────────────────────────── */}
            <div className={styles.toolbar}>
                <div className={styles.navGroup}>
                    <button className={styles.navBtn} onClick={() => setAnchor(a => navigateAnchor(viewMode, a, -1))}>
                        <ChevronLeft20Regular />
                    </button>
                    <Text className={styles.rangeLabel}>{rangeLabel(viewMode, anchor)}</Text>
                    <button className={styles.navBtn} onClick={() => setAnchor(a => navigateAnchor(viewMode, a, 1))}>
                        <ChevronRight20Regular />
                    </button>
                </div>

                <div className={styles.viewToggle}>
                    {(["week", "month"] as ViewMode[]).map(v => (
                        <button
                            key={v}
                            className={`${styles.viewBtn} ${viewMode === v ? styles.viewBtnActive : ""}`}
                            onClick={() => setViewMode(v)}
                        >
                            {v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Legend */}
                <div className={styles.legendRow}>
                    {[
                        { short: "O",  label: "Office",       bg: LOC_CONFIG.Office.bg,      color: LOC_CONFIG.Office.color },
                        { short: "W",  label: "WFH",          bg: LOC_CONFIG.Home.bg,         color: LOC_CONFIG.Home.color },
                        { short: "C",  label: "Client site",  bg: LOC_CONFIG.CustomerLoc.bg,  color: LOC_CONFIG.CustomerLoc.color },
                        { short: "X",  label: "Other",        bg: LOC_CONFIG.Other.bg,        color: LOC_CONFIG.Other.color },
                        { short: "S",  label: "Sick leave",   bg: LEAVE_COLORS[0].bg,         color: LEAVE_COLORS[0].color },
                        { short: "Ca", label: "Casual leave", bg: LEAVE_COLORS[1].bg,         color: LEAVE_COLORS[1].color },
                        { short: "E",  label: "Earned leave", bg: LEAVE_COLORS[2].bg,         color: LEAVE_COLORS[2].color },
                        { short: "P",  label: "Pending",      bg: "#fff",                     color: "#9ca3af", border: "1px dashed #d1d5db" },
                        { short: "!",  label: "Violation",    bg: "#ede9fe",                  color: "#7c3aed", border: "1px solid #c4b5fd" },
                    ].map(l => (
                        <span key={l.label} className={styles.legendItem}>
                            <span style={{
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                width: "16px", height: "16px", borderRadius: "3px",
                                background: l.bg,
                                border: l.border ?? `1px solid ${l.color}40`,
                                color: l.color, fontSize: "8px", fontWeight: "700", flexShrink: 0,
                            }}>
                                {l.short}
                            </span>
                            {l.label}
                        </span>
                    ))}
                </div>

                {data && (
                    <Text className={styles.memberCount}>
                        {data.members.length} member{data.members.length !== 1 ? "s" : ""}
                    </Text>
                )}
            </div>

            {/* ── Content ──────────────────────────────────────────── */}
            {loading ? (
                <div className={styles.spinnerWrap}><Spinner label="Loading calendar…" /></div>
            ) : error ? (
                <div className={styles.emptyState} style={{ color: "#dc2626" }}>{error}</div>
            ) : !data || data.members.length === 0 ? (
                <div className={styles.emptyState}>No team members found.</div>
            ) : viewMode === "week" ? (
                <WeekView days={days} data={data} attMap={attMap} styles={styles} />
            ) : (
                <MonthView days={days} data={data} attMap={attMap} styles={styles} />
            )}
        </div>
    );
};

export default TeamCalendar;
