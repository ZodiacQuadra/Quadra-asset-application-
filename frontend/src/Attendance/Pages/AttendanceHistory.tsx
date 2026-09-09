import React, { useState, useEffect, useCallback, useRef } from "react";
import { displayLeaveLabel } from "../Utils/leaveUtils";
import {
  Text,
  makeStyles,
  shorthands,
  tokens,
  Badge,
  Spinner,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  OverlayDrawer,
  Button,
  Input,
  Select,
} from "@fluentui/react-components";
import {
  ChevronLeft24Regular,
  ChevronRight24Regular,
  CalendarMonth24Regular,
  Timeline24Regular,
  Dismiss24Regular,
  CheckmarkCircle20Filled,
  Clock20Regular,
  CalendarCancel20Regular,
  WeatherMoon20Regular,
  CalendarCheckmark20Regular,
  ExpandUpRightRegular,
  Warning24Filled,
} from "@fluentui/react-icons";
import AttendanceCalendar, { CalendarEvent } from "../Components/AttendanceCalendar";
import AttendanceDayCard from "../Components/AttendanceDayCard";
import { useAuth } from "../../Auth/AuthProvider";
import { getEntraUserById, EntraADUser, getUserWeekOffConfigs, WeekOffConfig } from "../../Services/EntraADUserService";
import { getAttendanceHistory, AttendanceRecord, getPermissionHistory, PermissionRequest } from "../Services/AttendanceService";
import { getHolidaysByYear, Holiday } from "../../Services/HolidayService";
import { getLeaveHistory, LeaveRequestRecord } from "../../Services/LeaveRequestService";
import {
  getTeamView, getEmployeeCalendar,
  TeamViewMember, CalendarAttendanceRecord, CalendarLeaveRecord,
} from "../Services/TeamViewService";
import {
  getAllEmployeesForAdmin, getAdminReportFilters,
  AdminEmployeeListItem,
} from "../Services/AdminAttendanceReportService";
import { useLocation, useNavigate } from "react-router-dom";

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const useStyles = makeStyles({
  page: {
    padding: "24px",
    minHeight: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    "@media (max-width: 600px)": { padding: "12px" },
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shiftBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    ...shorthands.padding("6px", "14px"),
    ...shorthands.borderRadius("8px"),
    fontSize: "13px",
    fontWeight: "600",
    border: "1px solid #BFDBFE",
  },

  // ── Week Selector Calendar ─────────────────
  calendarContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius("16px"),
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    ...shorthands.padding("16px", "20px"),
  },
  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  navBtn: {
    background: "none",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: tokens.colorNeutralForeground2,
    transition: "all 0.15s ease",
    ":hover": { backgroundColor: "#f1f5f9", color: tokens.colorBrandForeground1 },
  },
  calendarGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px",
  },
  calDayName: {
    textAlign: "center",
    fontSize: "11px",
    fontWeight: "700",
    color: tokens.colorNeutralForeground4,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    paddingBottom: "4px",
  },
  calDay: {
    textAlign: "center",
    fontSize: "13px",
    fontWeight: "500",
    ...shorthands.borderRadius("8px"),
    ...shorthands.padding("6px", "4px"),
    cursor: "pointer",
    transition: "all 0.15s ease",
    ":hover": { backgroundColor: "#f1f5f9" },
  },
  calDayToday: {
    backgroundColor: "#007ED5",
    color: "#ffffff",
    fontWeight: "700",
    ":hover": { backgroundColor: "#0066b3" },
  },
  calDayInWeek: {
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    fontWeight: "600",
  },
  calDayOtherMonth: {
    color: tokens.colorNeutralForeground4,
    opacity: "0.5",
  },

  // ── Timeline ───────────────────────────────
  timelineContainer: {
    backgroundColor: tokens.colorNeutralBackground1,
    ...shorthands.borderRadius("16px"),
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    overflow: "hidden",
  },
  timelineHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    ...shorthands.padding("16px", "20px"),
    borderBottom: "1px solid #f1f5f9",
    flexWrap: "wrap",
    gap: "8px",
  },
  weekNav: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  weekLabelBtn: {
    fontSize: "14px",
    fontWeight: "600",
    color: tokens.colorNeutralForeground1,
    minWidth: "200px",
    textAlign: "center",
    background: "none",
    border: "1px solid transparent",
    ...shorthands.padding("4px", "12px"),
    ...shorthands.borderRadius("6px"),
    cursor: "pointer",
    transition: "all 0.15s ease",
    ":hover": { backgroundColor: "#f1f5f9", ...shorthands.borderColor("#e2e8f0") },
  },
  calendarDropdown: {
    position: "absolute" as const,
    top: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 1000,
    boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
    ...shorthands.borderRadius("16px"),
    backgroundColor: tokens.colorNeutralBackground1,
    minWidth: "320px",
  },
  timelineScroll: {
    overflowX: "auto",
    ...shorthands.padding("0", "0", "8px", "0"),
  },
  timelineInner: {
    minWidth: "700px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingTop: "12px", // Add some space at the top
    paddingBottom: "12px", // Add some space at the bottom
  },
  timeAxis: {
    display: "flex",
    marginLeft: "110px",
    paddingRight: "100px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "6px",
    marginBottom: "8px", // Added margin to space out from first row
  },
  timeLabel: {
    fontSize: "10px",
    color: tokens.colorNeutralForeground4,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  dayRow: {
    display: "flex",
    alignItems: "center",
    ...shorthands.padding("4px", "0"), // Added slight vertical padding
    borderBottom: "1px solid #f1f5f9", // Kept a very subtle border
    minHeight: "64px", // Slightly increased height
    ":last-child": { borderBottom: "none" },
  },
  dayLabel: {
    minWidth: "110px",
    paddingLeft: "20px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: "22px",
    fontWeight: "700",
    lineHeight: "1.1",
    color: tokens.colorNeutralForeground1,
  },
  dayNumberToday: {
    color: "#007ED5",
  },
  todayBadge: {
    fontSize: "10px",
    fontWeight: "700",
    backgroundColor: "#007ED5",
    color: "white",
    ...shorthands.padding("1px", "6px"),
    ...shorthands.borderRadius("4px"),
    display: "inline-block",
    marginBottom: "2px",
  },
  barTrack: {
    flex: 1,
    position: "relative",
    height: "56px",
    display: "flex",
    alignItems: "center",
    paddingRight: "12px",
  },
  hoursLabel: {
    minWidth: "90px",
    paddingRight: "20px",
    textAlign: "right",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "1px",
  },

  // ── Legend ─────────────────────────────────
  legend: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap",
    alignItems: "center",
    ...shorthands.padding("12px", "20px"),
    borderTop: "1px solid #f1f5f9",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: tokens.colorNeutralForeground3,
  },
  legendDot: {
    width: "10px",
    height: "10px",
    borderRadius: "3px",
  },
  // ── Day Detail Icon ────────────────────────
  detailIconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    height: '30px',
    width: '30px',
    padding: "4px",
    borderRadius: "6px",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    flexShrink: 0,
    marginLeft: "8px",
    marginRight: '8px',
    ":hover": { background: "#f1f5f9", color: "#007ED5" },
  },
  // ── Day Detail Drawer ──────────────────────
  drawerBanner: {
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginBottom: "20px",
  },
  drawerDate: {
    fontSize: "13px",
    fontWeight: "600",
    opacity: 0.75,
  },
  drawerStatusLabel: {
    fontSize: "20px",
    fontWeight: "800",
    lineHeight: "1.1",
  },
  drawerSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginBottom: "20px",
  },
  drawerSectionTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "4px",
  },
  drawerRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    background: "#f9fafb",
    borderRadius: "10px",
  },
  drawerRowIcon: {
    width: "34px",
    height: "34px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  drawerRowLabel: {
    fontSize: "12px",
    color: "#6b7280",
    fontWeight: "500",
  },
  drawerRowValue: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#111827",
  },
  drawerRowSub: {
    fontSize: "11px",
    color: "#9ca3af",
  },
  // ── Page-level tabs (My History / Team History) ──
  pageTabStrip: {
    display: "flex",
    gap: "4px",
    background: "#f3f4f6",
    borderRadius: "10px",
    padding: "4px",
    alignSelf: "flex-start",
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
    color: "#007ED5",
    fontWeight: "600",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  // ── Team History layout ────────────────────
  teamWrap: {
    display: "grid",
    gridTemplateColumns: "260px 1fr",
    gap: "16px",
    alignItems: "start",
  },
  membersList: {
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  membersListHeader: {
    padding: "14px 16px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#374151",
    borderBottom: "1px solid #f3f4f6",
  },
  memberItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    borderBottom: "1px solid #f9fafb",
    ":hover": { background: "#f9fafb" },
    ":last-child": { borderBottom: "none" },
  },
  memberItemActive: {
    background: "#eff6ff",
    ":hover": { background: "#eff6ff" },
  },
  memberAvatar: {
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
  memberItemName: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#111827",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  memberItemSub: {
    fontSize: "11px",
    color: "#9ca3af",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  viewToggle: {
    display: "flex",
    backgroundColor: "#F1F5F9",
    ...shorthands.padding("4px"),
    ...shorthands.borderRadius("12px"),
    gap: "4px",
  },
  toggleBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    ...shorthands.padding("6px", "16px"),
    ...shorthands.borderRadius("8px"),
    cursor: "pointer",
    border: "none",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },
  toggleBtnActive: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: "#007ED5",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },
  toggleBtnInactive: {
    backgroundColor: "transparent",
    color: tokens.colorNeutralForeground3,
    ":hover": { color: tokens.colorNeutralForeground2 },
  },
});

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/**
 * Parse a time string → fractional hours for bar positioning (e.g. 9.5 = 9:30 AM).
 * For full ISO timestamps, strips Z so the local-time digits (IST) are read.
 * For "HH:mm:ss" time-only strings, reads the raw digits directly.
 */
function timeStrToHours(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null;
  try {
    let t: string;
    if (timeStr.includes("T")) {
      // Strip Z → parse as local time, then read local hours/minutes
      const normalized = timeStr.replace(/Z$/, "");
      const d = new Date(normalized);
      if (isNaN(d.getTime())) return null;
      t = `${d.getHours()}:${d.getMinutes()}:00`;
    } else {
      t = timeStr;
    }
    const parts = t.split(":");
    return parseInt(parts[0]) + parseInt(parts[1]) / 60;
  } catch {
    return null;
  }
}

function fmtHoursMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.floor(totalMinutes % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Lifts an overnight check-out hour onto a continuous timeline.
 * When the check-out clock-hour reads earlier than the check-in it belongs to the
 * following day, so 24 is added (e.g. in 22:00, out 06:00 → 30). Day shifts, where
 * the check-out always reads later than the check-in, are unaffected.
 */
function normalizeOutHour(inH: number, outH: number): number {
  return outH < inH ? outH + 24 : outH;
}

/**
 * Parses an attendance timestamp to a local Date, mirroring timeStrToHours:
 * full ISO values have a trailing Z stripped (read as local IST digits); bare
 * "HH:mm:ss" times are anchored to a fixed date so only the clock matters.
 */
function toLocalDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const normalized = s.includes("T") ? s.replace(/Z$/, "") : `1970-01-01T${s}`;
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Returns the check-out expressed in fractional hours on a timeline anchored to the
 * check-in's clock hour, accounting for overnight spans. Uses the real calendar-date
 * difference when both are full timestamps (e.g. out on 16th, in on 15th → +24); if the
 * dates are equal (or unavailable) but the clock wrapped past midnight, still adds a day.
 * Day shifts return the plain check-out hour. Returns null if either value is unparseable.
 */
function continuousOutHour(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
): number | null {
  const inH = timeStrToHours(checkIn);
  const outH = timeStrToHours(checkOut);
  if (inH === null || outH === null) return null;
  let offset = 0;
  const inD = toLocalDate(checkIn);
  const outD = toLocalDate(checkOut);
  if (inD && outD) {
    const dayMs = 24 * 3600 * 1000;
    const inMid = new Date(inD.getFullYear(), inD.getMonth(), inD.getDate()).getTime();
    const outMid = new Date(outD.getFullYear(), outD.getMonth(), outD.getDate()).getTime();
    const dd = Math.round((outMid - inMid) / dayMs);
    if (dd > 0) offset = dd;
  }
  if (offset === 0 && outH < inH) offset = 1; // same stored date but clock crossed midnight
  return outH + offset * 24;
}

/** True when a completed session spans past midnight (its work window crosses 24:00). */
function isOvernightSession(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
): boolean {
  const outC = continuousOutHour(checkIn, checkOut);
  return outC !== null && outC > 24;
}

/**
 * Formats a fractional clock-hour to a short axis label (e.g. 9 → "9AM", 26 → "2AM").
 * Wraps hours past 24 so overnight timelines label the next-day portion correctly.
 */
function axisHourLabel(h: number): string {
  const hh = ((Math.round(h) % 24) + 24) % 24;
  if (hh === 0) return "12AM";
  if (hh === 12) return "12PM";
  return hh < 12 ? `${hh}AM` : `${hh - 12}PM`;
}

/**
 * Builds the timeline axis bounds (fractional hours) for a week of sessions,
 * widening past 24:00 for overnight shifts so the work bar stays visible.
 * `pairs` hold each session's check-in hour and its overnight-normalised check-out hour.
 */
function computeTimelineAxis(
  pairs: { inH: number | null; outH: number | null }[],
  shiftStartH: number,
  shiftEndH: number,
): { axisStart: number; axisEnd: number } {
  const overnightShift = shiftEndH < shiftStartH;
  const effShiftEndH = overnightShift ? shiftEndH + 24 : shiftEndH;
  const inHrs = pairs.map(p => p.inH).filter((h): h is number => h !== null);
  const outHrs = pairs.map(p => p.outH).filter((h): h is number => h !== null);
  const earliestIn = inHrs.length ? Math.min(...inHrs) : shiftStartH;
  const latestOut = outHrs.length ? Math.max(...outHrs) : effShiftEndH;
  const overnight = overnightShift || latestOut > 24;
  const axisStart = overnight
    ? Math.max(0, Math.floor(earliestIn - 0.5))
    : Math.max(0, Math.min(shiftStartH - 1, Math.floor(earliestIn - 0.5)));
  const axisEnd = overnight
    ? Math.min(48, Math.max(effShiftEndH + 1, Math.ceil(latestOut + 0.5)))
    : Math.min(24, Math.max(shiftEndH + 1, Math.ceil(latestOut + 0.5)));
  return { axisStart, axisEnd };
}

function lateDelta(checkIn: string, shiftStart: string | null | undefined): string | null {
  if (!shiftStart) return null;
  const ciH = timeStrToHours(checkIn);
  const ssH = timeStrToHours(shiftStart);
  if (ciH === null || ssH === null) return null;
  const diffMins = Math.round((ciH - ssH) * 60);
  if (diffMins <= 0) return null;
  return `Late by ${fmtHoursMinutes(diffMins)}`;
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).replace(/ /g, "-");
}

function getWeekRange(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
}

function formatWeekLabel(mon: Date, sun: Date) {
  const monDay = mon.getDate();
  const sunDay = sun.getDate();
  const monMonth = mon.toLocaleDateString("en-US", { month: "short" });
  const sunMonth = sun.toLocaleDateString("en-US", { month: "short" });
  const sunYear = sun.getFullYear();
  if (mon.getMonth() === sun.getMonth()) {
    return `${monDay} – ${sunDay} ${sunMonth} ${sunYear}`.toUpperCase();
  }
  return `${monDay} ${monMonth} – ${sunDay} ${sunMonth} ${sunYear}`.toUpperCase();
}

/** Get the Sunday of the week containing `date` */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // 0 = Sunday
  return d;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─────────────────────────────────────────────
// Approved-permission timeline helpers
// ─────────────────────────────────────────────

/** Date-only (YYYY-MM-DD) portion of a permission's stored Date. */
function permissionStartYMD(p: PermissionRequest): string {
  return p.Date.includes("T") ? p.Date.split("T")[0] : p.Date;
}

type PermissionSegment = {
  key: string;
  startH: number;      // segment start hour on this day's axis
  endH: number;        // segment end hour on this day's axis
  part: "full" | "start" | "end";
  fullStartH: number;  // the permission's real StartTime hour (for the tooltip)
  fullEndH: number;    // the permission's real EndTime hour (for the tooltip)
  p: PermissionRequest;
};

/**
 * Splits an approved permission into the timeline segment(s) it contributes to `ymd`.
 * Overnight permissions — where EndTime reads earlier than StartTime — span two dates:
 * StartTime→midnight renders on the request date, midnight→EndTime on the following date.
 */
function getPermissionSegmentsForDay(p: PermissionRequest, ymd: string): PermissionSegment[] {
  const startH = timeStrToHours(p.StartTime);
  const endH = timeStrToHours(p.EndTime);
  if (startH === null || endH === null) return [];
  const pDate = permissionStartYMD(p);
  const overnight = endH < startH;
  if (!overnight) {
    return pDate === ymd
      ? [{ key: p.ID, startH, endH, part: "full", fullStartH: startH, fullEndH: endH, p }]
      : [];
  }
  const nextYMD = toYMD(addDays(new Date(pDate + "T00:00:00"), 1));
  const segs: PermissionSegment[] = [];
  if (pDate === ymd) segs.push({ key: `${p.ID}-start`, startH, endH: 24, part: "start", fullStartH: startH, fullEndH: endH, p });
  if (nextYMD === ymd) segs.push({ key: `${p.ID}-end`, startH: 0, endH, part: "end", fullStartH: startH, fullEndH: endH, p });
  return segs;
}

/**
 * Axis pairs contributed by approved overnight permissions falling in the visible week,
 * so the shared timeline axis widens to keep both split halves (before and after
 * midnight) on-screen: the start half needs the axis to reach 24:00, the end half needs
 * it to reach 00:00.
 */
function overnightPermissionAxisPairs(
  permissions: PermissionRequest[],
  weekStartYMD: string,
  weekEndYMD: string,
): { inH: number | null; outH: number | null }[] {
  const pairs: { inH: number | null; outH: number | null }[] = [];
  permissions.forEach(p => {
    if (p.ApprovalStatus !== "Approved") return;
    const startH = timeStrToHours(p.StartTime);
    const endH = timeStrToHours(p.EndTime);
    if (startH === null || endH === null || endH >= startH) return; // not overnight
    const pDate = permissionStartYMD(p);
    const nextYMD = toYMD(addDays(new Date(pDate + "T00:00:00"), 1));
    if (pDate >= weekStartYMD && pDate <= weekEndYMD) pairs.push({ inH: startH, outH: 24 });
    if (nextYMD >= weekStartYMD && nextYMD <= weekEndYMD) pairs.push({ inH: 0, outH: endH });
  });
  return pairs;
}

// ─────────────────────────────────────────────
// Shared constants & helpers
// ─────────────────────────────────────────────
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

/**
 * Format a time string to "hh:mm AM/PM" (IST-aware).
 * For full ISO timestamps, strips trailing Z before parsing so JS treats the
 * value as local time — same trick used by formatHHMM in My History.
 * For "HH:mm:ss" time-only strings, reads the raw digits directly.
 */
function fmtTimeStr(t: string | null | undefined): string {
  if (!t) return "—";
  if (t.includes("T")) {
    const normalized = t.replace(/Z$/, "");
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  }
  const h = timeStrToHours(t);
  if (h === null) return "—";
  const totalH = Math.floor(h);
  const totalM = Math.round((h - totalH) * 60);
  const ampm = totalH >= 12 ? "PM" : "AM";
  return `${totalH % 12 || 12}:${String(totalM).padStart(2, "0")} ${ampm}`;
}

const LUNCH_BREAK_MINS = 60;
const LUNCH_THRESHOLD_MINS = 4 * 60; // skip deduction for sessions under 4 hours

/**
 * Subtracts 1 hour lunch break from a day-total duration.
 * Skipped for active sessions and for totals under 4 hours.
 */
function applyLunchDeduction(totalMins: number | null, isActive: boolean): number | null {
  if (totalMins === null || isActive) return totalMins;
  if (totalMins < LUNCH_THRESHOLD_MINS) return totalMins;
  return Math.max(0, totalMins - LUNCH_BREAK_MINS);
}

/**
 * Returns approved permission minutes that overlap with the employee's work window [workStartH, workEndH].
 * If no work window provided, falls back to full permission duration.
 * Use this for deduction — only the hours within the actual work window are deducted.
 */
function getOverlappingPermissionMins(
  ymd: string,
  permissions: PermissionRequest[],
  workStartH: number | null,
  workEndH: number | null,
): number {
  return permissions
    .filter(p => {
      const pDate = p.Date.includes("T") ? p.Date.split("T")[0] : p.Date;
      return pDate === ymd && p.ApprovalStatus === "Approved";
    })
    .reduce((sum, p) => {
      const startH = timeStrToHours(p.StartTime);
      const endH = timeStrToHours(p.EndTime);
      if (startH === null || endH === null) return sum;
      if (workStartH === null || workEndH === null) {
        return sum + Math.max(0, Math.round((endH - startH) * 60));
      }
      const overlapStart = Math.max(startH, workStartH);
      const overlapEnd = Math.min(endH, workEndH);
      const overlapMins = Math.round((overlapEnd - overlapStart) * 60);
      return sum + Math.max(0, overlapMins);
    }, 0);
}

/** Returns per-permission overlap minutes for display purposes. */
function permissionOverlapMins(p: PermissionRequest, workStartH: number | null, workEndH: number | null): number {
  const startH = timeStrToHours(p.StartTime);
  const endH = timeStrToHours(p.EndTime);
  if (startH === null || endH === null) return 0;
  if (workStartH === null || workEndH === null) return Math.max(0, Math.round((endH - startH) * 60));
  const overlapStart = Math.max(startH, workStartH);
  const overlapEnd = Math.min(endH, workEndH);
  return Math.max(0, Math.round((overlapEnd - overlapStart) * 60));
}

/** Kept for calendar display (full permission duration, not overlap). */
function getApprovedPermissionMins(ymd: string, permissions: PermissionRequest[]): number {
  return getOverlappingPermissionMins(ymd, permissions, null, null);
}

/**
 * Deducts approved permission minutes from a day total.
 * Only applied after checkout (not for active sessions).
 */
function applyPermissionDeduction(totalMins: number | null, permMins: number, isActive: boolean): number | null {
  if (totalMins === null || isActive || permMins <= 0) return totalMins;
  return Math.max(0, totalMins - permMins);
}

/**
 * Returns the checkout time to display.
 * If checkout > shiftEndTime, caps at shiftEndTime.
 * If checkout is null, returns null (no change to existing behavior).
 */
function effectiveCheckOut(
  checkOut: string | null | undefined,
  shiftEndTime: string | null | undefined,
): string | null {
  if (!checkOut) return null;
  if (!shiftEndTime) return checkOut;
  const coH = timeStrToHours(checkOut);
  const seH = timeStrToHours(shiftEndTime);
  if (coH === null || seH === null) return checkOut;
  return  checkOut;
}

/**
 * Computes duration in minutes from checkIn to effectiveCheckOut(checkOut, shiftEndTime).
 * Uses timeStrToHours so it handles both ISO and time-only strings (mixed formats are safe).
 * Returns null when checkout is null (active session — caller handles that separately).
 */
function effectiveDurationMins(
  checkIn: string | null | undefined,
  checkOut: string | null | undefined,
  shiftEndTime: string | null | undefined,
): number | null {
  if (!checkIn || !checkOut) return null;
  const effOut = effectiveCheckOut(checkOut, shiftEndTime);
  if (!effOut) return null;
  const inH = timeStrToHours(checkIn);
  const outCont = continuousOutHour(checkIn, effOut);
  if (inH === null || outCont === null) return null;
  // Overnight shift: continuousOutHour lifts a next-day check-out past 24:00.
  const mins = Math.round((outCont - inH) * 60);
  return mins > 0 ? mins : null;
}

/** Compute worked minutes from two time strings (time-only or ISO). */
function durationFromTimes(checkIn: string | null, checkOut: string | null): number | null {
  if (!checkIn || !checkOut) return null;
  // If either value uses the 1900-01-01 sentinel (backend time-only storage), use time portion only
  const isSentinel = (s: string) => s.startsWith("1900-01-01");
  const extractTime = (s: string) => s.includes("T") ? s.split("T")[1].replace(/Z$/, "") : s;
  const parseLocal = (s: string) => {
    const timeOnly = isSentinel(s) || isSentinel(checkIn!) || isSentinel(checkOut!);
    const t = timeOnly ? extractTime(s) : (s.includes("T") ? s.replace(/Z$/, "") : `1970-01-01T${s}`);
    return new Date(timeOnly ? `1970-01-01T${t}` : t);
  };
  const inD = parseLocal(checkIn); const outD = parseLocal(checkOut);
  if (isNaN(inD.getTime()) || isNaN(outD.getTime())) return null;
  const mins = Math.round((outD.getTime() - inD.getTime()) / 60000);
  // Overnight shift: time-only checkout parsed on the same base date reads negative → add a day.
  return mins < 0 ? mins + 24 * 60 : mins;
}

const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Attendance data collection began on this date (YYYY-MM-DD). Days before this have no
// records, so a "no record" day should render as nothing rather than an "Absent" marker.
const ATTENDANCE_DATA_START = "2026-07-09";
function isBeforeDataStart(ymd: string): boolean {
  return ymd < ATTENDANCE_DATA_START;
}

function getOffDaysForDate(ymd: string, configs: WeekOffConfig[]): string[] {
  const cfg = configs.find(c => c.startDate <= ymd && (c.endDate === null || c.endDate >= ymd));
  if (!cfg || !cfg.isRotationalOff) return ["Saturday", "Sunday"];
  return cfg.offDays?.split(",").map(d => d.trim()).filter(Boolean) ?? ["Saturday", "Sunday"];
}

function isWeekoffDay(day: Date, ymd: string, configs: WeekOffConfig[]): boolean {
  return getOffDaysForDate(ymd, configs).includes(DAY_FULL[day.getDay()]);
}

const AVATAR_COLORS = ["#6366f1", "#0078D4", "#16a34a", "#ca8a04", "#dc2626", "#7c3aed", "#0891b2", "#c026d3"];
function avatarColor(name: string) {
  let n = 0; for (const c of name) n += c.charCodeAt(0);
  return AVATAR_COLORS[n % AVATAR_COLORS.length];
}
function getInitialsTH(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─────────────────────────────────────────────
// TeamHistoryPanel
// ─────────────────────────────────────────────
interface TeamHistoryPanelProps {
  managerId: string;
  holidays: Holiday[];
  styles: ReturnType<typeof useStyles>;
}

const TeamHistoryPanel: React.FC<TeamHistoryPanelProps> = ({ managerId, holidays, styles }) => {
  const [team, setTeam] = useState<TeamViewMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamViewMember | null>(null);

  // Calendar data for selected member
  const [calData, setCalData] = useState<{ attendance: CalendarAttendanceRecord[]; leaves: CalendarLeaveRecord[] } | null>(null);
  const [loadedKey, setLoadedKey] = useState(""); // "employeeId-month-year"
  const [calLoading, setCalLoading] = useState(false);

  // Week / view state (mirrors My History)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [viewMode, setViewMode] = useState<"timeline" | "calendar">("timeline");
  const [calMonth, setCalMonth] = useState<Date>(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  // Drawer
  const [drawerDay, setDrawerDay] = useState<Date | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [weekOffConfigs, setWeekOffConfigs] = useState<WeekOffConfig[]>([]);
  const [permissionHistory, setPermissionHistory] = useState<PermissionRequest[]>([]);

  const [teamSearchQuery, setTeamSearchQuery] = useState("")
  const [teamDeptFilter, setTeamDeptFilter] = useState("all")

  // Close mini calendar on outside click
  useEffect(() => {
    if (!isCalendarOpen) return;
    const h = (e: MouseEvent) => { if (calRef.current && !calRef.current.contains(e.target as Node)) setIsCalendarOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [isCalendarOpen]);

  const weekEnd = addDays(weekStart, 6);

  // Load team members once — deduplicate by employeeId (SP returns one row per session)
  useEffect(() => {
    setTeamLoading(true);
    getTeamView(managerId, new Date())
      .then(members => {
        const seen = new Set<string>();
        const unique = members.filter(m => {
          if (seen.has(m.employeeId)) return false;
          seen.add(m.employeeId);
          return true;
        });
        setTeam(unique);
        if (unique.length > 0) setSelectedMember(unique[0]);
      })
      .finally(() => setTeamLoading(false));
  }, [managerId]);

  // Load calendar data when member/month changes
  const fetchCalData = useCallback(async (member: TeamViewMember, month: number, year: number) => {
    const key = `${member.employeeId}-${month}-${year}`;
    if (key === loadedKey) return;
    setCalLoading(true);
    try {
      const data = await getEmployeeCalendar(managerId, member.employeeId, month, year);
      setCalData(data);
      setLoadedKey(key);
    } finally {
      setCalLoading(false);
    }
  }, [managerId, loadedKey]);

  useEffect(() => {
    if (!selectedMember) return;
    if (viewMode === "timeline") {
      // Fetch month of weekStart; if week crosses months, fetch both
      const m1 = weekStart.getMonth() + 1; const y1 = weekStart.getFullYear();
      fetchCalData(selectedMember, m1, y1);
      // If week crosses month boundary, also prefetch next month (best-effort)
      if (weekEnd.getMonth() !== weekStart.getMonth()) {
        // We just make sure current month is loaded; crossing handled by lookup below
      }
    } else {
      fetchCalData(selectedMember, calMonth.getMonth() + 1, calMonth.getFullYear());
    }
  }, [selectedMember, weekStart, calMonth, viewMode]);

  // Fetch weekoff configs for selected member + visible week
  useEffect(() => {
    if (!selectedMember?.employeeId) return;
    const start = toYMD(weekStart);
    const end = toYMD(weekEnd);
    getUserWeekOffConfigs(selectedMember.employeeId, start, end)
      .then(setWeekOffConfigs)
      .catch(() => setWeekOffConfigs([]));
  }, [selectedMember?.employeeId, weekStart]);

  // Fetch permission history for selected member
  useEffect(() => {
    if (!selectedMember?.employeeId) return;
    getPermissionHistory(selectedMember.employeeId)
      .then(data => setPermissionHistory(Array.isArray(data) ? data : []))
      .catch(() => setPermissionHistory([]));
  }, [selectedMember?.employeeId]);

  // ── Derived lookups ──────────────────────────────────────────────────────
  const attMap = new Map<string, CalendarAttendanceRecord>();
  const attMapAll = new Map<string, CalendarAttendanceRecord[]>();
  (calData?.attendance ?? []).forEach(r => {
    if (!r.date) return;
    const key = r.date.includes("T") ? r.date.split("T")[0] : r.date;
    attMap.set(key, r);
    if (!attMapAll.has(key)) attMapAll.set(key, []);
    attMapAll.get(key)!.push(r);
  });

  const leaveRanges = calData?.leaves ?? [];

  const holidaySet = new Set(
    holidays.filter(item => item.HolidayType !== 'Optional').map(h => h.HolidayDate.includes("T") ? h.HolidayDate.split("T")[0] : h.HolidayDate)
  );
  function getHolidayName(ymd: string) {
    return holidays.find(h => {
      const d = h.HolidayDate.includes("T") ? h.HolidayDate.split("T")[0] : h.HolidayDate;
      return d === ymd;
    })?.HolidayName;
  }

  // ── Shift info from selected member ─────────────────────────────────────
  const shiftStartH = timeStrToHours(selectedMember?.shiftStartTime) ?? 9;
  const shiftEndH = timeStrToHours(selectedMember?.shiftEndTime) ?? 18;
  const overnightShift = shiftEndH < shiftStartH;
  const effShiftEndH = overnightShift ? shiftEndH + 24 : shiftEndH;
  // Axis auto-adjusts to the earliest check-in / latest check-out of the week (across all sessions),
  // with overnight check-outs lifted onto a continuous timeline so the axis can extend past midnight.
  const teamAxisPairs = [
    ...Array.from(attMapAll.values()).flat().map(r => ({
      inH: r.checkIn ? timeStrToHours(r.checkIn) : null,
      outH: r.checkIn && r.checkOut ? continuousOutHour(r.checkIn, r.checkOut) : null,
    })),
    // Widen the axis for overnight permissions so both split halves stay visible.
    ...overnightPermissionAxisPairs(permissionHistory, toYMD(weekStart), toYMD(weekEnd)),
  ];
  const { axisStart, axisEnd } = computeTimelineAxis(teamAxisPairs, shiftStartH, shiftEndH);
  const axisDuration = axisEnd - axisStart;
  function pct(h: number) { return Math.min(100, Math.max(0, ((h - axisStart) / axisDuration) * 100)); }
  const axisLabels: number[] = [];
  for (let h = Math.ceil(axisStart); h <= Math.floor(axisEnd); h++) axisLabels.push(h);
  const hourLabel = axisHourLabel;

  // ── Day row renderer ─────────────────────────────────────────────────────
  function renderTeamDayRow(day: Date) {
    const ymd = toYMD(day);
    const isToday = sameDay(day, today);
    const isFuture = day > today;
    const dow = day.getDay();
    const isWeekend = isWeekoffDay(day, ymd, weekOffConfigs);
    const isHoliday = holidaySet.has(ymd);
    const rec = attMap.get(ymd) ?? null;
    const recs = attMapAll.get(ymd) ?? (rec ? [rec] : []);
    const lastRec = recs[recs.length - 1] ?? null;
    const normalizeDate = (s: string) => s.includes("T") ? s.split("T")[0] : s;
    const leaveToday = leaveRanges.find(l => ymd >= normalizeDate(l.leaveStartDate) && ymd <= normalizeDate(l.leaveEndDate));

    let status = "absent";
    if (isHoliday) status = "holiday";
    else if (recs.some(r => r.checkIn)) status = (lastRec?.checkIn && !lastRec?.checkOut) ? "active" : "present";
    else if (leaveToday) status = leaveToday.approvalStatus === "Approved" ? "approved_leave" : "pending_leave";
    else if (isWeekend) status = "weekend";
    else if (isFuture) status = "future";
    // No record before the data-collection start date → show nothing instead of "Absent".
    if (status === "absent" && isBeforeDataStart(ymd)) status = "nodata";

    const rawDayDurationMins = recs.reduce((sum, r) => sum + (effectiveDurationMins(r.checkIn, r.checkOut, selectedMember?.shiftEndTime) ?? 0), 0) || null;
    const teamWorkStartH = recs.length > 0 ? timeStrToHours(recs[0].checkIn) : null;
    const teamLastRec = recs[recs.length - 1];
    const teamWorkEndH = teamLastRec?.checkOut
      ? timeStrToHours(effectiveCheckOut(teamLastRec.checkOut, selectedMember?.shiftEndTime))
      : timeStrToHours(selectedMember?.shiftEndTime);
    const permMinsTeam = getOverlappingPermissionMins(ymd, permissionHistory, teamWorkStartH, teamWorkEndH);
    const afterLunchTeam = applyLunchDeduction(rawDayDurationMins, status === "active");
    const totalDurationMins = applyPermissionDeduction(afterLunchTeam, permMinsTeam, status === "active");
    const lateLabel = (rec && (rec.violationType === "Late" || rec.violationType === "Both"))
      ? lateDelta(rec.checkIn!, selectedMember?.shiftStartTime ?? null)
      : (rec && rec.violationType === "Early") ? "Early arrival" : null;

    // Bar styling (same colour logic as My History)
    const PRESENT_GRADIENT = "linear-gradient(135deg, #6366F1 0%, #38BDF8 100%)";
    const ACTIVE_GRADIENT = "linear-gradient(135deg, #6366F1 0%, #22D3EE 100%)";
    const showFullBar = status !== "present" && status !== "active" && status !== "nodata";
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;

    const BG: Record<string, string> = {
      future: "rgba(226, 232, 240, 0.2)",
      weekend: "repeating-linear-gradient(45deg,rgba(245,158,11,0.02),rgba(245,158,11,0.02) 10px,rgba(245,158,11,0.06) 10px,rgba(245,158,11,0.06) 20px)",
      holiday: "rgba(16, 185, 129, 0.12)",
      approved_leave: "rgba(139, 92, 246, 0.12)",
      pending_leave: "repeating-linear-gradient(45deg,rgba(245,158,11,0.05),rgba(245,158,11,0.05) 10px,rgba(245,158,11,0.12) 10px,rgba(245,158,11,0.12) 20px)",
      absent: "rgba(239, 68, 68, 0.08)",
    };
    const BORDER: Record<string, string> = {
      future: "1.5px solid rgba(226,232,240,0.8)", weekend: "1.5px dashed rgba(245,158,11,0.3)",
      holiday: "1.5px solid #10B981", approved_leave: "1.5px solid #8B5CF6",
      pending_leave: "1.5px solid rgba(245,158,11,0.5)", absent: "1.5px solid rgba(239,68,68,0.4)",
    };
    const CENTER_LABEL: Record<string, string> = {
      weekend: "Weekend", holiday: getHolidayName(ymd) || "Holiday",
      approved_leave: displayLeaveLabel(leaveToday?.leaveTypeName) || "Approved Leave",
      pending_leave: (displayLeaveLabel(leaveToday?.leaveTypeName) || "Pending Leave") + " (Pending)",
      absent: "Absent",
    };
    const TEXT_COLOR: Record<string, string> = {
      weekend: "#D97706", holiday: "#047857", approved_leave: "#7C3AED",
      pending_leave: "#B45309", absent: "#DC2626",
    };
    // const nowH = new Date().getHours() + new Date().getMinutes() / 60;

    return (
      <div key={ymd} className={styles.dayRow}>
        <div className={styles.dayLabel} style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: "6px", minWidth: "110px" }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: isToday ? "#007ED5" : tokens.colorNeutralForeground4 }}>{DAY_NAMES[dow]}</span>
            <span style={{ fontSize: "20px", fontWeight: 800, color: tokens.colorNeutralForeground1, lineHeight: "1" }}>{day.getDate()}</span>
            {lateLabel && <span style={{ fontSize: "10px", color: lateLabel === "Early arrival" ? "#13a929" : "#EF4444", fontWeight: 600 }}>{lateLabel}</span>}
          </div>
          <button className={styles.detailIconBtn} title="View day details" onClick={e => { e.stopPropagation(); setDrawerDay(day); setDrawerOpen(true); }}>
            <ExpandUpRightRegular style={{ height: '90%', width: '90%' }} />
          </button>
        </div>

        <div className={styles.barTrack}>
          {/* Shift shading */}
          <div style={{ position: "absolute", left: `${pct(shiftStartH)}%`, width: `${pct(effShiftEndH) - pct(shiftStartH)}%`, top: "8px", bottom: "8px", backgroundColor: "rgba(0,126,213,0.04)", borderLeft: "1px dashed rgba(0,126,213,0.2)", borderRight: "1px dashed rgba(0,126,213,0.2)", borderRadius: "2px" }} />

          {showFullBar ? (
            <div style={{ position: "absolute", left: "2px", right: "2px", height: "28px", top: "calc(50% - 14px)", background: BG[status] ?? PRESENT_GRADIENT, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", border: BORDER[status] ?? "none" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: TEXT_COLOR[status] ?? tokens.colorNeutralForeground1, textTransform: "uppercase", letterSpacing: "0.03em" }}>{CENTER_LABEL[status] ?? ""}</span>
            </div>
          ) : (
            recs.map((session, idx) => {
              const inH = session.checkIn ? timeStrToHours(session.checkIn) : null;
              const isLastActive = idx === recs.length - 1 && status === "active";
              const effOut = session.checkOut ? effectiveCheckOut(session.checkOut, selectedMember?.shiftEndTime) : null;
              if (inH === null) return null;
              // Overnight: lift a next-day check-out onto the continuous axis (past 24:00).
              const outH = effOut
                ? continuousOutHour(session.checkIn, effOut)
                : (isLastActive ? normalizeOutHour(inH, nowH) : null);
              const left = pct(inH);
              const right = outH !== null ? pct(outH) : 100;
              const width = Math.max(0, right - left);
              const barGrad = isLastActive ? ACTIVE_GRADIENT : PRESENT_GRADIENT;
              return (
                <React.Fragment key={idx}>
                  <div style={{ position: "absolute", left: `${left}%`, width: `${width}%`, height: "4px", top: "calc(50% - 2px)", background: barGrad, borderRadius: "4px", minWidth: "6px", boxShadow: "0 1px 6px rgba(99,102,241,0.35)" }} />
                  <div style={{ position: "absolute", left: `calc(${left}% - 5px)`, top: "calc(50% - 5px)", width: "10px", height: "10px", borderRadius: "50%", background: "#6366F1", zIndex: 3, boxShadow: "0 0 0 3px rgba(99,102,241,0.15)" }} />
                  {outH !== null && <div style={{ position: "absolute", left: `calc(${right}% - 5px)`, top: "calc(50% - 5px)", width: "10px", height: "10px", borderRadius: "50%", background: "#6366F1", border: isLastActive ? "2px solid #38BDF8" : "none", zIndex: 3 }} />}
                </React.Fragment>
              );
            })
          )}

          {/* Approved permission blocks (overnight permissions split across dates) */}
          {permissionHistory
            .filter(p => p.ApprovalStatus === "Approved")
            .flatMap(p => getPermissionSegmentsForDay(p, ymd))
            .map(seg => {
              const pl = pct(seg.startH);
              const pr = pct(seg.endH);
              const pw = Math.max(0, pr - pl);
              const fmt = (h: number) => {
                const hr = Math.floor(h);
                const mn = Math.round((h - hr) * 60);
                return `${hr % 12 || 12}:${String(mn).padStart(2, "0")} ${hr >= 12 ? "PM" : "AM"}`;
              };
              const rangeLabel = `${fmt(seg.fullStartH)} – ${fmt(seg.fullEndH)}`;
              const title = seg.part === "full"
                ? `Permission: ${seg.p.Reason} (${rangeLabel})`
                : `Permission: ${seg.p.Reason} (${rangeLabel} · overnight, ${seg.part === "start" ? "continues next day" : "continued from previous day"})`;
              const radius = seg.part === "start" ? "4px 0 0 4px" : seg.part === "end" ? "0 4px 4px 0" : "4px";
              return (
                <div
                  key={seg.key}
                  title={title}
                  style={{
                    position: "absolute",
                    left: `${pl}%`, width: `${pw}%`,
                    height: "12px", top: "calc(50% - 6px)",
                    background: "linear-gradient(90deg, #0EA5E9, #38BDF8)",
                    borderRadius: radius,
                    opacity: 0.85,
                    zIndex: 4,
                    boxShadow: "0 1px 4px rgba(14,165,233,0.4)",
                    minWidth: "6px",
                  }}
                />
              );
            })}

          {isToday && <div style={{ position: "absolute", left: `${pct(axisEnd > 24 && nowH < axisStart ? nowH + 24 : nowH)}%`, top: 0, bottom: 0, width: "2px", borderLeft: "2px dashed #3B82F6", zIndex: 2 }} />}
        </div>

        <div className={styles.hoursLabel}>
          <Text weight="bold" size={300} style={{ color: totalDurationMins ? tokens.colorNeutralForeground1 : tokens.colorNeutralForeground4 }}>
            {totalDurationMins !== null ? fmtHoursMinutes(totalDurationMins) : "00:00"}
          </Text>
          <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>Hrs worked</Text>
        </div>
      </div>
    );
  }

  // ── Calendar data for AttendanceCalendar component ───────────────────────
  function getTeamCalendarData(): Record<number, CalendarEvent[]> {
    const data: Record<number, CalendarEvent[]> = {};
    const selMonth = calMonth.getMonth(); const selYear = calMonth.getFullYear();

    holidays.forEach(h => {
      const dStr = h.HolidayDate.includes("T") ? h.HolidayDate.split("T")[0] : h.HolidayDate;
      const [y, m, d] = dStr.split("-").map(Number);
      if (y === selYear && m === selMonth + 1) {
        if (!data[d]) data[d] = [];
        data[d].push({ type: "holiday", title: "Holiday", subtitle: h.HolidayName, color: "#eff6ff", textColor: "#2563eb" });
      }
    });

    leaveRanges.forEach(leave => {
      if (!leave.leaveStartDate || !leave.leaveEndDate) return;
      const startStr = leave.leaveStartDate.includes("T") ? leave.leaveStartDate.split("T")[0] : leave.leaveStartDate;
      const endStr = leave.leaveEndDate.includes("T") ? leave.leaveEndDate.split("T")[0] : leave.leaveEndDate;
      const start = new Date(startStr + "T00:00:00");
      const end = new Date(endStr + "T00:00:00");
      let curr = new Date(start);
      while (curr <= end) {
        if (curr.getMonth() === selMonth && curr.getFullYear() === selYear) {
          const d = curr.getDate();
          if (!data[d]) data[d] = [];
          data[d].push({ type: "leave", title: displayLeaveLabel(leave.leaveTypeName) || "Leave", subtitle: leave.approvalStatus, color: leave.approvalStatus === "Approved" ? "#f5f3ff" : "#f0fdfa", textColor: leave.approvalStatus === "Approved" ? "#7c3aed" : "#0d9488" });
        }
        curr.setDate(curr.getDate() + 1);
      }
    });

    (calData?.attendance ?? []).forEach(rec => {
      if (!rec.date) return;
      const dateKey = rec.date.includes("T") ? rec.date.split("T")[0] : rec.date;
      const [y, m, d] = dateKey.split("-").map(Number);
      if (y === selYear && m === selMonth + 1) {
        if (!data[d]) data[d] = [];
        if (rec.checkIn) {
          const isLate = rec.violationType === "Late" || rec.violationType === "Both";
          const isEarly = rec.violationType === "Early";
          data[d].push({ type: "attendance", title: "Check-in", subtitle: fmtTimeStr(rec.checkIn), color: isEarly ? "#e0f2fe" : isLate ? "#fffbeb" : "#ecfdf5", textColor: isEarly ? "#0284c7" : isLate ? "#d97706" : "#059669" });
          if (rec.checkOut) {
            const dispOut = effectiveCheckOut(rec.checkOut, selectedMember?.shiftEndTime);
            data[d].push({ type: "attendance", title: "Check-out", subtitle: fmtTimeStr(dispOut), color: "#ecfdf5", textColor: "#059669" });
          }
        } else if (rec.attendanceStatus === 'ABSENT' && !isBeforeDataStart(dateKey)) {
          data[d].push({ type: "absent", title: "Absent", subtitle: "No record", color: "#fff1f2", textColor: "#e11d48" });
        }
      }
    });

    permissionHistory
      .filter(p => p.ApprovalStatus === "Approved")
      .forEach(p => {
        const _pdo = new Date(p.Date);
        const py = _pdo.getFullYear(), pm = _pdo.getMonth() + 1, pd = _pdo.getDate();
        if (py === selYear && pm === selMonth + 1) {
          const startH = timeStrToHours(p.StartTime);
          const endH = timeStrToHours(p.EndTime);
          if (startH === null || endH === null) return;
          const mins = Math.round((endH - startH) * 60);
          if (!data[pd]) data[pd] = [];
          data[pd].push({ type: "attendance", title: "Permission", subtitle: `${fmtTimeStr(p.StartTime)} – ${fmtTimeStr(p.EndTime)} · ${fmtHoursMinutes(mins)}`, color: "#e0f2fe", textColor: "#0284c7" });
        }
      });

    return data;
  }

  // ── Mini calendar picker ─────────────────────────────────────────────────
  function renderMiniCalendar() {
    const year = weekStart.getFullYear(); const month = weekStart.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const cells: { date: Date; isCurrent: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, daysInPrev - i), isCurrent: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), isCurrent: true });
    let t = 1; while (cells.length < 42) cells.push({ date: new Date(year, month + 1, t++), isCurrent: false });
    const weekStartYMD = toYMD(weekStart); const weekEndYMD = toYMD(weekEnd); const todayYMD = toYMD(today);
    const miniCalMonth = new Date(year, month, 1);
    return (
      <div className={styles.calendarContainer}>
        <div className={styles.calendarHeader}>
          <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, -28))}><ChevronLeft24Regular style={{ fontSize: "16px" }} /></button>
          <Text weight="semibold" size={300}>{MONTH_NAMES[month]} {year}</Text>
          <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, 28))}><ChevronRight24Regular style={{ fontSize: "16px" }} /></button>
        </div>
        <div className={styles.calendarGrid}>
          {DAY_NAMES.map(d => <div key={d} className={styles.calDayName}>{d}</div>)}
          {cells.map(({ date, isCurrent }, i) => {
            const ymd = toYMD(date);
            const isT = ymd === todayYMD; const inWeek = ymd >= weekStartYMD && ymd <= weekEndYMD;
            return (
              <div key={i} className={`${styles.calDay} ${isT ? styles.calDayToday : inWeek ? styles.calDayInWeek : !isCurrent ? styles.calDayOtherMonth : ""}`}
                onClick={() => { setWeekStart(getWeekStart(date)); setIsCalendarOpen(false); }}>
                {date.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Departments present in this manager's team (drives the dropdown)
  const teamAvailableDepts = Array.from(
    new Set(team.map(m => m.department).filter((d): d is string => Boolean(d)))
  ).sort();

  // Apply search + dept filter for the member sidebar list
  const filteredTeam = team.filter(m => {
    const matchName = !teamSearchQuery?.trim() ||
      m.name?.toLowerCase().includes(teamSearchQuery.trim().toLowerCase());
    const matchDept = teamDeptFilter === "all" || (m.department ?? "") === teamDeptFilter;
    return matchName && matchDept;
  });

  if (teamLoading) return <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}><Spinner label="Loading team…" /></div>;

  return (
    <div className={styles.teamWrap}>
      {/* ── Left: Member list ───────────────────────────────────────── */}
      <div className={styles.membersList}>
        <div className={styles.membersListHeader}>Team Members ({filteredTeam.length})</div>
        <div style={{ padding: '5px', display: "flex", flexDirection: "column", gap: "4px" }}>
          <Input
            size="small"
            value={teamSearchQuery}
            onChange={(e) => setTeamSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full"
          />
          {teamAvailableDepts.length > 0 && (
            <Select
              size="small"
              value={teamDeptFilter}
              onChange={(_, d) => setTeamDeptFilter(d.value)}
              style={{ width: "100%" }}
            >
              <option value="all">All Departments</option>
              {teamAvailableDepts.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </Select>
          )}
        </div>
        <div style={{ overflowY: "auto", maxHeight: "600px" }}>
          {filteredTeam.length === 0 && <div style={{ padding: "20px", fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>No team members found.</div>}
          {filteredTeam.map(m => (
            <div
              key={m.employeeId}
              className={`${styles.memberItem} ${selectedMember?.employeeId === m.employeeId ? styles.memberItemActive : ""}`}
              onClick={() => { setSelectedMember(m); setLoadedKey(""); }}
            >
              <div className={styles.memberAvatar} style={{ background: avatarColor(m.name) }}>{getInitialsTH(m.name)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
                <span className={styles.memberItemName}>{m.name}</span>
                <span className={styles.memberItemSub}>{m.department ?? m.shiftName ?? ""}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: History view ─────────────────────────────────────── */}
      <div>
        {!selectedMember ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px", color: "#9ca3af", fontSize: "13px" }}>Select a team member to view their history.</div>
        ) : (
          <div className={styles.timelineContainer}>
            {/* Header */}
            <div className={styles.timelineHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: avatarColor(selectedMember.name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {getInitialsTH(selectedMember.name)}
                </div>
                <div>
                  <Text weight="semibold" size={300}>{selectedMember.name}</Text>
                  {selectedMember.shiftName && <Text size={100} style={{ color: tokens.colorNeutralForeground4, display: "block" }}>{selectedMember.shiftName} · {fmtTimeStr(selectedMember.shiftStartTime)} – {fmtTimeStr(selectedMember.shiftEndTime)}</Text>}
                </div>
              </div>

              {viewMode === "timeline" ? (
                <div className={styles.weekNav}>
                  <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, -7))}><ChevronLeft24Regular style={{ fontSize: "16px" }} /></button>
                  <div ref={calRef} style={{ position: "relative" }}>
                    <button className={styles.weekLabelBtn} onClick={() => setIsCalendarOpen(o => !o)}>{formatDateLabel(weekStart)} – {formatDateLabel(weekEnd)}</button>
                    {isCalendarOpen && <div className={styles.calendarDropdown}>{renderMiniCalendar()}</div>}
                  </div>
                  <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, 7))} disabled={weekEnd >= today} style={{ opacity: weekEnd >= today ? 0.4 : 1 }}><ChevronRight24Regular style={{ fontSize: "16px" }} /></button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button className={styles.navBtn} onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ChevronLeft24Regular style={{ fontSize: "16px" }} /></button>
                  <Text weight="semibold" size={300} style={{ minWidth: "130px", textAlign: "center" }}>{calMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</Text>
                  <button className={styles.navBtn} onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ChevronRight24Regular style={{ fontSize: "16px" }} /></button>
                </div>
              )}

              <div className={styles.viewToggle}>
                <button className={`${styles.toggleBtn} ${viewMode === "timeline" ? styles.toggleBtnActive : styles.toggleBtnInactive}`} onClick={() => setViewMode("timeline")}><Timeline24Regular style={{ fontSize: "18px" }} />Timeline</button>
                <button className={`${styles.toggleBtn} ${viewMode === "calendar" ? styles.toggleBtnActive : styles.toggleBtnInactive}`} onClick={() => setViewMode("calendar")}><CalendarMonth24Regular style={{ fontSize: "18px" }} />Calendar</button>
              </div>
            </div>

            {calLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}><Spinner label="Loading…" /></div>
            ) : viewMode === "timeline" ? (
              <>
                <div className={styles.timelineScroll}>
                  <div className={styles.timelineInner}>
                    {/* Time axis */}
                    <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                      <div style={{ minWidth: "110px", flexShrink: 0 }} />
                      <div style={{ flex: 1, position: "relative", height: "20px", paddingRight: "12px" }}>
                        {axisLabels.map(h => (
                          <span key={h} style={{ position: "absolute", left: `${pct(h)}%`, transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: "10px", color: tokens.colorNeutralForeground4, fontWeight: 600, textTransform: "uppercase" }}>{hourLabel(h)}</span>
                        ))}
                      </div>
                      <div style={{ minWidth: "90px", paddingRight: "20px", flexShrink: 0 }} />
                    </div>
                    {weekDays.map(day => renderTeamDayRow(day))}
                  </div>
                </div>
                <div className={styles.legend}>
                  {[
                    { label: "Present", gradient: "linear-gradient(90deg, #6366F1, #38BDF8)" },
                    { color: "#EF4444", label: "Absent" },
                    { color: "#F59E0B", label: "Weekend / Pending Leave" },
                    { color: "#10B981", label: "Holiday" },
                    { color: "#8B5CF6", label: "Approved Leave" },
                  ].map(({ color, label, gradient }: any) => (
                    <div key={label} className={styles.legendItem}>
                      <div className={styles.legendDot} style={gradient ? { background: gradient, width: "24px", height: "4px", borderRadius: "4px" } : { backgroundColor: color }} />{label}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: "16px" }}>
                <AttendanceCalendar
                  month={calMonth.getMonth()}
                  year={calMonth.getFullYear()}
                  attendanceData={getTeamCalendarData()}
                  isCompact={true}
                  onDateClick={(day) => { setDrawerDay(day); setDrawerOpen(true); }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Day detail drawer ──────────────────────────────────────── */}
      {drawerDay && (() => {
        const ymd = toYMD(drawerDay);
        const isHoliday = holidaySet.has(ymd);
        const rec = attMap.get(ymd) ?? null;
        const allRecs = attMapAll.get(ymd) ?? (rec ? [rec] : []);
        const normalizeDate = (s: string) => s.includes("T") ? s.split("T")[0] : s;
        const leaveToday = leaveRanges.find(l => ymd >= normalizeDate(l.leaveStartDate) && ymd <= normalizeDate(l.leaveEndDate));
        const holidayName = getHolidayName(ymd);
        const isWeekend = isWeekoffDay(drawerDay, ymd, weekOffConfigs);
        const isFuture = drawerDay > today;
        const dayPermissions = permissionHistory.filter(p => {
          const pDate = p.Date.includes("T") ? p.Date.split("T")[0] : p.Date;
          return pDate === ymd && p.ApprovalStatus === "Approved";
        });

        const lastRec = allRecs[allRecs.length - 1] ?? null;
        let status = "absent";
        if (isHoliday) status = "holiday";
        else if (allRecs.some(r => r.checkIn)) status = (lastRec?.checkIn && !lastRec?.checkOut) ? "active" : "present";
        else if (leaveToday) status = leaveToday.approvalStatus === "Approved" ? "approved_leave" : "pending_leave";
        else if (isWeekend) status = "weekend";
        else if (isFuture) status = "future";
        // No record before the data-collection start date → show "No data" instead of "Absent".
        if (status === "absent" && isBeforeDataStart(ymd)) status = "nodata";

        const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
          present: { label: "Present", color: "#059669", bg: "#ecfdf5", icon: <CheckmarkCircle20Filled style={{ color: "#059669" }} /> },
          active: { label: "Checked In", color: "#6366f1", bg: "#eff0ff", icon: <Clock20Regular style={{ color: "#6366f1" }} /> },
          absent: { label: "Absent", color: "#dc2626", bg: "#fff1f2", icon: <CalendarCancel20Regular style={{ color: "#dc2626" }} /> },
          holiday: { label: "Holiday", color: "#047857", bg: "#ecfdf5", icon: <CalendarCheckmark20Regular style={{ color: "#047857" }} /> },
          approved_leave: { label: "Approved Leave", color: "#7c3aed", bg: "#f5f3ff", icon: <CalendarCheckmark20Regular style={{ color: "#7c3aed" }} /> },
          pending_leave: { label: "Pending Leave", color: "#b45309", bg: "#fffbeb", icon: <CalendarCancel20Regular style={{ color: "#b45309" }} /> },
          weekend: { label: "Weekend", color: "#d97706", bg: "#fffbeb", icon: <WeatherMoon20Regular style={{ color: "#d97706" }} /> },
          future: { label: "Upcoming", color: "#6b7280", bg: "#f9fafb", icon: <CalendarMonth24Regular style={{ color: "#6b7280" }} /> },
          nodata: { label: "No Record", color: "#6b7280", bg: "#f9fafb", icon: <CalendarMonth24Regular style={{ color: "#6b7280" }} /> },
        };
        const meta = STATUS_META[status] ?? STATUS_META.absent;
        const rawTotalDurMins = allRecs.reduce((s, r) => s + (effectiveDurationMins(r.checkIn, r.checkOut, selectedMember?.shiftEndTime) ?? 0), 0) || null;
        const drawerTeamWorkStartH = allRecs.length > 0 ? timeStrToHours(allRecs[0].checkIn) : null;
        const drawerTeamLastRec = allRecs[allRecs.length - 1];
        const drawerTeamWorkEndH = drawerTeamLastRec?.checkOut
          ? timeStrToHours(effectiveCheckOut(drawerTeamLastRec.checkOut, selectedMember?.shiftEndTime))
          : timeStrToHours(selectedMember?.shiftEndTime);
        const drawerPermMins = getOverlappingPermissionMins(ymd, permissionHistory, drawerTeamWorkStartH, drawerTeamWorkEndH);
        const afterLunchTotal = applyLunchDeduction(rawTotalDurMins, status === "active");
        const totalDurMins = applyPermissionDeduction(afterLunchTotal, drawerPermMins, status === "active");
        const lunchDeductedTotal = status !== "active" && rawTotalDurMins !== null && rawTotalDurMins >= LUNCH_THRESHOLD_MINS;

        return (
          <OverlayDrawer open={drawerOpen} onOpenChange={(_, s) => setDrawerOpen(s.open)} position="end" size="medium">
            <DrawerHeader>
              <DrawerHeaderTitle action={<Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setDrawerOpen(false)} />}>
                {drawerDay.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </DrawerHeaderTitle>
            </DrawerHeader>
            <DrawerBody style={{ padding: 0, overflow: "auto" }}>
              {selectedMember?.name && (
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#9ca3af", padding: "12px 24px 0" }}>{selectedMember.name}</div>
              )}
              <AttendanceDayCard
                date={drawerDay}
                status={status as any}
                sessions={allRecs.map((session) => {
                  const effOut = session.checkOut ? effectiveCheckOut(session.checkOut, selectedMember?.shiftEndTime) : null;
                  const rawDur = effectiveDurationMins(session.checkIn, session.checkOut, selectedMember?.shiftEndTime);
                  if (allRecs.length === 1) {
                    const afterLunchDur = applyLunchDeduction(rawDur, !session.checkOut);
                    return {
                      checkIn: session.checkIn || undefined,
                      checkOut: effOut || undefined,
                      durationMinutes: applyPermissionDeduction(afterLunchDur, drawerPermMins, !session.checkOut),
                      workLocationType: session.workLocationType || undefined,
                      violationType: session.violationType || undefined,
                    };
                  }
                  return {
                    checkIn: session.checkIn || undefined,
                    checkOut: effOut || undefined,
                    durationMinutes: rawDur,
                    workLocationType: session.workLocationType || undefined,
                    violationType: session.violationType || undefined,
                  };
                })}
                permissions={dayPermissions.map(p => {
                  const startH = timeStrToHours(p.StartTime);
                  const endH = timeStrToHours(p.EndTime);
                  const fullMins = (startH !== null && endH !== null) ? Math.max(0, Math.round((endH - startH) * 60)) : 0;
                  return { startTime: p.StartTime, endTime: p.EndTime, reason: p.Reason, durationMinutes: fullMins, effectiveMinutes: permissionOverlapMins(p, drawerTeamWorkStartH, drawerTeamWorkEndH) };
                })}
                leaveTypeName={(displayLeaveLabel(leaveToday?.leaveTypeName) || leaveToday?.leaveTypeName) ?? undefined}
                leaveStart={leaveToday?.leaveStartDate}
                leaveEnd={leaveToday?.leaveEndDate}
                leaveApprovalStatus={leaveToday?.approvalStatus}
                holidayName={holidayName || undefined}
                shiftStart={selectedMember?.shiftStartTime || undefined}
                shiftEnd={selectedMember?.shiftEndTime || undefined}
              />
            </DrawerBody>
          </OverlayDrawer>
        );
      })()}
    </div>
  );
};

// ─────────────────────────────────────────────
// AdminHistoryPanel
// ─────────────────────────────────────────────
interface AdminHistoryPanelProps {
  adminId: string;
  holidays: Holiday[];
  styles: ReturnType<typeof useStyles>;
}

const AdminHistoryPanel: React.FC<AdminHistoryPanelProps> = ({ adminId, holidays, styles }) => {
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [employees, setEmployees] = useState<AdminEmployeeListItem[]>([]);
  const [empLoading, setEmpLoading] = useState(true);
  const [selectedEmp, setSelectedEmp] = useState<AdminEmployeeListItem | null>(null);
  const [empSearch, setEmpSearch] = useState("");

  // Calendar data for selected employee
  const [calData, setCalData] = useState<{ attendance: CalendarAttendanceRecord[]; leaves: CalendarLeaveRecord[] } | null>(null);
  const [loadedKey, setLoadedKey] = useState("");
  const [calLoading, setCalLoading] = useState(false);

  // View / week / month state — mirrors TeamHistoryPanel
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [viewMode, setViewMode] = useState<"timeline" | "calendar">("timeline");
  const [calMonth, setCalMonth] = useState<Date>(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  // Drawer
  const [drawerDay, setDrawerDay] = useState<Date | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [weekOffConfigs, setWeekOffConfigs] = useState<WeekOffConfig[]>([]);
  const [permissionHistory, setPermissionHistory] = useState<PermissionRequest[]>([]);

  const weekEnd = addDays(weekStart, 6);

  const location = useLocation()

  // Close mini calendar on outside click
  useEffect(() => {
    if (!isCalendarOpen) return;
    const h = (e: MouseEvent) => { if (calRef.current && !calRef.current.contains(e.target as Node)) setIsCalendarOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [isCalendarOpen]);

  // Load departments once
  useEffect(() => {
    getAdminReportFilters()
      .then(f => setDepartments(f.departments))
      .catch(() => { });
  }, []);

  useEffect(() => {
    if (location && location.state && location.state?.userId && employees.length > 0) {
      const filtered = employees.filter((emp) => emp.employeeId === location.state.userId)
      if (filtered.length > 0) setSelectedEmp(filtered[0])
    }
  }, [location.state, employees])

  // Load employees when department changes
  useEffect(() => {
    setEmpLoading(true);
    setSelectedEmp(null);
    setCalData(null);
    setLoadedKey("");
    setEmpSearch("");
    getAllEmployeesForAdmin(selectedDept || undefined)
      .then(list => {
        setEmployees(list);
        const preselect = location.state?.userId ? list.find(e => e.employeeId === location.state.userId) : null;
        if (preselect) setSelectedEmp(preselect);
        else if (list.length > 0) setSelectedEmp(list[0]);
      })
      .finally(() => setEmpLoading(false));
  }, [selectedDept]);

  // Load calendar data when employee / month changes
  const fetchCalData = useCallback(async (emp: AdminEmployeeListItem, month: number, year: number) => {
    const key = `${emp.employeeId}-${month}-${year}`;
    if (key === loadedKey) return;
    setCalLoading(true);
    try {
      const data = await getEmployeeCalendar(adminId, emp.employeeId, month, year);
      setCalData(data);
      setLoadedKey(key);
    } finally {
      setCalLoading(false);
    }
  }, [adminId, loadedKey]);

  useEffect(() => {
    if (!selectedEmp) return;
    if (viewMode === "timeline") {
      const startMonth = weekStart.getMonth() + 1;
      const startYear = weekStart.getFullYear();
      const endMonth = weekEnd.getMonth() + 1;
      const endYear = weekEnd.getFullYear();

      if (startMonth === endMonth && startYear === endYear) {
        fetchCalData(selectedEmp, startMonth, startYear);
      } else {
        // Week crosses a month boundary — fetch both months and merge
        const key = `${selectedEmp.employeeId}-${startMonth}-${startYear}-${endMonth}-${endYear}`;
        if (key === loadedKey) return;
        setCalLoading(true);
        Promise.all([
          getEmployeeCalendar(adminId, selectedEmp.employeeId, startMonth, startYear),
          getEmployeeCalendar(adminId, selectedEmp.employeeId, endMonth, endYear),
        ]).then(([d1, d2]) => {
          setCalData({
            attendance: [...d1.attendance, ...d2.attendance],
            leaves: [...d1.leaves, ...d2.leaves],
          });
          setLoadedKey(key);
        }).finally(() => setCalLoading(false));
      }
    } else {
      fetchCalData(selectedEmp, calMonth.getMonth() + 1, calMonth.getFullYear());
    }
  }, [selectedEmp, weekStart, calMonth, viewMode]);

  // Fetch weekoff configs for selected employee + visible week
  useEffect(() => {
    if (!selectedEmp?.employeeId) return;
    const start = toYMD(weekStart);
    const end = toYMD(weekEnd);
    getUserWeekOffConfigs(selectedEmp.employeeId, start, end)
      .then(setWeekOffConfigs)
      .catch(() => setWeekOffConfigs([]));
  }, [selectedEmp?.employeeId, weekStart]);

  // Fetch permission history for selected employee
  useEffect(() => {
    if (!selectedEmp?.employeeId) return;
    getPermissionHistory(selectedEmp.employeeId)
      .then(data => setPermissionHistory(Array.isArray(data) ? data : []))
      .catch(() => setPermissionHistory([]));
  }, [selectedEmp?.employeeId]);

  // ── Derived lookups ──────────────────────────────────────────────────────
  const attMap = new Map<string, CalendarAttendanceRecord>();
  const attMapAll = new Map<string, CalendarAttendanceRecord[]>();
  (calData?.attendance ?? []).forEach(r => {
    if (!r.date) return;
    const key = r.date.includes("T") ? r.date.split("T")[0] : r.date;
    attMap.set(key, r);
    if (!attMapAll.has(key)) attMapAll.set(key, []);
    attMapAll.get(key)!.push(r);
  });
  const leaveRanges = calData?.leaves ?? [];

  const holidaySet = new Set(holidays.filter(h => h.HolidayType !== 'Optional').map(h => h.HolidayDate.includes("T") ? h.HolidayDate.split("T")[0] : h.HolidayDate));
  function getHolidayNameA(ymd: string) {
    return holidays.filter((item)=>item.HolidayType !=='Optional').find(h => {
      const d = h.HolidayDate.includes("T") ? h.HolidayDate.split("T")[0] : h.HolidayDate;
      return d === ymd;
    })?.HolidayName;
  }

  // ── Shift info (no shift-start data for admin view — use default; overnight inferred from data) ──
  const shiftStartH = 9; const shiftEndH = 18;
  // Axis auto-adjusts to the earliest check-in / latest check-out of the week (across all sessions),
  // with overnight check-outs lifted onto a continuous timeline so the axis can extend past midnight.
  const adminAxisPairs = [
    ...Array.from(attMapAll.values()).flat().map(r => ({
      inH: r.checkIn ? timeStrToHours(r.checkIn) : null,
      outH: r.checkIn && r.checkOut ? continuousOutHour(r.checkIn, r.checkOut) : null,
    })),
    // Widen the axis for overnight permissions so both split halves stay visible.
    ...overnightPermissionAxisPairs(permissionHistory, toYMD(weekStart), toYMD(weekEnd)),
  ];
  const { axisStart, axisEnd } = computeTimelineAxis(adminAxisPairs, shiftStartH, shiftEndH);
  const effShiftEndH = shiftEndH;
  const axisDuration = axisEnd - axisStart;
  function pct(h: number) { return Math.min(100, Math.max(0, ((h - axisStart) / axisDuration) * 100)); }
  const axisLabels: number[] = [];
  for (let h = Math.ceil(axisStart); h <= Math.floor(axisEnd); h++) axisLabels.push(h);
  const hourLabel = axisHourLabel;

  // ── Day row renderer (reuses same logic as TeamHistoryPanel) ──────────────
  function renderAdminDayRow(day: Date) {
    const ymd = toYMD(day);
    const isToday = sameDay(day, today);
    const isFuture = day > today;
    const dow = day.getDay();
    const isWeekend = isWeekoffDay(day, ymd, weekOffConfigs);
    const isHoliday = holidaySet.has(ymd);
    const rec = attMap.get(ymd) ?? null;
    const recs = attMapAll.get(ymd) ?? (rec ? [rec] : []);
    const lastRec = recs[recs.length - 1] ?? null;
    const normalizeDate = (s: string) => s.includes("T") ? s.split("T")[0] : s;
    const leaveToday = leaveRanges.find(l => ymd >= normalizeDate(l.leaveStartDate) && ymd <= normalizeDate(l.leaveEndDate));

    let status = "absent";
    if (isHoliday) status = "holiday";
    else if (recs.some(r => r.checkIn)) status = (lastRec?.checkIn && !lastRec?.checkOut) ? "active" : "present";
    else if (leaveToday) status = leaveToday.approvalStatus === "Approved" ? "approved_leave" : "pending_leave";
    else if (isWeekend) status = "weekend";
    else if (isFuture) status = "future";
    // No record before the data-collection start date → show nothing instead of "Absent".
    if (status === "absent" && isBeforeDataStart(ymd)) status = "nodata";

    const rawDayDurationMins = recs.reduce((sum, r) => sum + (effectiveDurationMins(r.checkIn, r.checkOut, selectedEmp?.shiftEndTime) ?? 0), 0) || null;
    const adminWorkStartH = recs.length > 0 ? timeStrToHours(recs[0].checkIn) : null;
    const adminLastRec = recs[recs.length - 1];
    const adminWorkEndH = adminLastRec?.checkOut
      ? timeStrToHours(effectiveCheckOut(adminLastRec.checkOut, selectedEmp?.shiftEndTime))
      : timeStrToHours(selectedEmp?.shiftEndTime);
    const permMinsAdmin = getOverlappingPermissionMins(ymd, permissionHistory, adminWorkStartH, adminWorkEndH);
    const afterLunchAdmin = applyLunchDeduction(rawDayDurationMins, status === "active");
    const totalDurationMins = applyPermissionDeduction(afterLunchAdmin, permMinsAdmin, status === "active");

    const PRESENT_GRADIENT = "linear-gradient(135deg, #6366F1 0%, #38BDF8 100%)";
    const ACTIVE_GRADIENT = "linear-gradient(135deg, #6366F1 0%, #22D3EE 100%)";
    const showFullBar = status !== "present" && status !== "active" && status !== "nodata";

    const BG: Record<string, string> = {
      future: "rgba(226,232,240,0.2)",
      weekend: "repeating-linear-gradient(45deg,rgba(245,158,11,0.02),rgba(245,158,11,0.02) 10px,rgba(245,158,11,0.06) 10px,rgba(245,158,11,0.06) 20px)",
      holiday: "rgba(16,185,129,0.12)",
      approved_leave: "rgba(139,92,246,0.12)",
      pending_leave: "repeating-linear-gradient(45deg,rgba(245,158,11,0.05),rgba(245,158,11,0.05) 10px,rgba(245,158,11,0.12) 10px,rgba(245,158,11,0.12) 20px)",
      absent: "rgba(239,68,68,0.08)",
    };
    const BORDER: Record<string, string> = {
      future: "1.5px solid rgba(226,232,240,0.8)", weekend: "1.5px dashed rgba(245,158,11,0.3)",
      holiday: "1.5px solid #10B981", approved_leave: "1.5px solid #8B5CF6",
      pending_leave: "1.5px solid rgba(245,158,11,0.5)", absent: "1.5px solid rgba(239,68,68,0.4)",
    };
    const CENTER_LABEL: Record<string, string> = {
      weekend: "Weekend", holiday: getHolidayNameA(ymd) || "Holiday",
      approved_leave: displayLeaveLabel(leaveToday?.leaveTypeName) || "Approved Leave",
      pending_leave: (displayLeaveLabel(leaveToday?.leaveTypeName) || "Pending Leave") + " (Pending)",
      absent: "Absent",
    };
    const TEXT_COLOR: Record<string, string> = {
      weekend: "#D97706", holiday: "#047857", approved_leave: "#7C3AED",
      pending_leave: "#B45309", absent: "#DC2626",
    };
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;

    return (
      <div key={ymd} className={styles.dayRow}>
        <div className={styles.dayLabel} style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: "6px", minWidth: "110px" }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: isToday ? "#007ED5" : tokens.colorNeutralForeground4 }}>{DAY_NAMES[dow]}</span>
            <span style={{ fontSize: "20px", fontWeight: 800, color: tokens.colorNeutralForeground1, lineHeight: "1" }}>{day.getDate()}</span>
          </div>
        </div>

        <div className={styles.barTrack}>
          <div style={{ position: "absolute", left: `${pct(shiftStartH)}%`, width: `${pct(effShiftEndH) - pct(shiftStartH)}%`, top: "8px", bottom: "8px", backgroundColor: "rgba(0,126,213,0.04)", borderLeft: "1px dashed rgba(0,126,213,0.2)", borderRight: "1px dashed rgba(0,126,213,0.2)", borderRadius: "2px" }} />
          {showFullBar ? (
            <div style={{ position: "absolute", left: "2px", right: "2px", height: "28px", top: "calc(50% - 14px)", background: BG[status] ?? PRESENT_GRADIENT, borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", border: BORDER[status] ?? "none" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: TEXT_COLOR[status] ?? tokens.colorNeutralForeground1, textTransform: "uppercase", letterSpacing: "0.03em" }}>{CENTER_LABEL[status] ?? ""}</span>
            </div>
          ) : (
            recs.map((session, idx) => {
              const inH = session.checkIn ? timeStrToHours(session.checkIn) : null;
              const isLastActive = idx === recs.length - 1 && status === "active";
              const effOut = session.checkOut ? effectiveCheckOut(session.checkOut, selectedEmp?.shiftEndTime) : null;
              if (inH === null) return null;
              // Overnight: lift a next-day check-out onto the continuous axis (past 24:00).
              const outH = effOut
                ? continuousOutHour(session.checkIn, effOut)
                : (isLastActive ? normalizeOutHour(inH, nowH) : null);
              const left = pct(inH);
              const right = outH !== null ? pct(outH) : 100;
              const width = Math.max(0, right - left);
              const barGrad = isLastActive ? ACTIVE_GRADIENT : PRESENT_GRADIENT;
              return (
                <React.Fragment key={idx}>
                  <div style={{ position: "absolute", left: `${left}%`, width: `${width}%`, height: "4px", top: "calc(50% - 2px)", background: barGrad, borderRadius: "4px", minWidth: "6px", boxShadow: "0 1px 6px rgba(99,102,241,0.35)" }} />
                  <div style={{ position: "absolute", left: `calc(${left}% - 5px)`, top: "calc(50% - 5px)", width: "10px", height: "10px", borderRadius: "50%", background: "#6366F1", zIndex: 3, boxShadow: "0 0 0 3px rgba(99,102,241,0.15)" }} />
                  {outH !== null && <div style={{ position: "absolute", left: `calc(${right}% - 5px)`, top: "calc(50% - 5px)", width: "10px", height: "10px", borderRadius: "50%", background: "#6366F1", border: isLastActive ? "2px solid #38BDF8" : "none", zIndex: 3 }} />}
                </React.Fragment>
              );
            })
          )}
          {/* Approved permission blocks (overnight permissions split across dates) */}
          {permissionHistory
            .filter(p => p.ApprovalStatus === "Approved")
            .flatMap(p => getPermissionSegmentsForDay(p, ymd))
            .map(seg => {
              const pl = pct(seg.startH);
              const pr = pct(seg.endH);
              const pw = Math.max(0, pr - pl);
              const fmt = (h: number) => {
                const hr = Math.floor(h);
                const mn = Math.round((h - hr) * 60);
                return `${hr % 12 || 12}:${String(mn).padStart(2, "0")} ${hr >= 12 ? "PM" : "AM"}`;
              };
              const rangeLabel = `${fmt(seg.fullStartH)} – ${fmt(seg.fullEndH)}`;
              const title = seg.part === "full"
                ? `Permission: ${seg.p.Reason} (${rangeLabel})`
                : `Permission: ${seg.p.Reason} (${rangeLabel} · overnight, ${seg.part === "start" ? "continues next day" : "continued from previous day"})`;
              const radius = seg.part === "start" ? "4px 0 0 4px" : seg.part === "end" ? "0 4px 4px 0" : "4px";
              return (
                <div
                  key={seg.key}
                  title={title}
                  style={{
                    position: "absolute",
                    left: `${pl}%`, width: `${pw}%`,
                    height: "12px", top: "calc(50% - 6px)",
                    background: "linear-gradient(90deg, #0EA5E9, #38BDF8)",
                    borderRadius: radius,
                    opacity: 0.85,
                    zIndex: 4,
                    boxShadow: "0 1px 4px rgba(14,165,233,0.4)",
                    minWidth: "6px",
                  }}
                />
              );
            })}

          {isToday && <div style={{ position: "absolute", left: `${pct(axisEnd > 24 && nowH < axisStart ? nowH + 24 : nowH)}%`, top: 0, bottom: 0, width: "2px", borderLeft: "2px dashed #3B82F6", zIndex: 2 }} />}
        </div>

        <div className={styles.hoursLabel}>
          <Text weight="bold" size={300} style={{ color: totalDurationMins ? tokens.colorNeutralForeground1 : tokens.colorNeutralForeground4 }}>
            {totalDurationMins !== null ? fmtHoursMinutes(totalDurationMins) : "00:00"}
          </Text>
          <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>Hrs worked</Text>
        </div>

        <button className={styles.detailIconBtn} title="View day details" onClick={e => { e.stopPropagation(); setDrawerDay(day); setDrawerOpen(true); }}>
          <ExpandUpRightRegular style={{ height: '90%', width: '90%' }} />
        </button>
      </div>
    );
  }

  // ── Calendar data for AttendanceCalendar ─────────────────────────────────
  function getAdminCalendarData(): Record<number, CalendarEvent[]> {
    const data: Record<number, CalendarEvent[]> = {};
    const selMonth = calMonth.getMonth(); const selYear = calMonth.getFullYear();
    holidays.filter((item)=>item.HolidayType !== 'Optional').forEach(h => {
      const dStr = h.HolidayDate.includes("T") ? h.HolidayDate.split("T")[0] : h.HolidayDate;
      const [y, m, d] = dStr.split("-").map(Number);
      if (y === selYear && m === selMonth + 1) {
        if (!data[d]) data[d] = [];
        data[d].push({ type: "holiday", title: "Holiday", subtitle: h.HolidayName, color: "#eff6ff", textColor: "#2563eb" });
      }
    });
    leaveRanges.forEach(leave => {
      if (!leave.leaveStartDate || !leave.leaveEndDate) return;
      const startStr = leave.leaveStartDate.includes("T") ? leave.leaveStartDate.split("T")[0] : leave.leaveStartDate;
      const endStr = leave.leaveEndDate.includes("T") ? leave.leaveEndDate.split("T")[0] : leave.leaveEndDate;
      const start = new Date(startStr + "T00:00:00");
      const end = new Date(endStr + "T00:00:00");
      let curr = new Date(start);
      while (curr <= end) {
        if (curr.getMonth() === selMonth && curr.getFullYear() === selYear) {
          const d = curr.getDate();
          if (!data[d]) data[d] = [];
          data[d].push({ type: "leave", title: displayLeaveLabel(leave.leaveTypeName) || "Leave", subtitle: leave.approvalStatus, color: leave.approvalStatus === "Approved" ? "#f5f3ff" : "#f0fdfa", textColor: leave.approvalStatus === "Approved" ? "#7c3aed" : "#0d9488" });
        }
        curr.setDate(curr.getDate() + 1);
      }
    });
    (calData?.attendance ?? []).forEach(rec => {
      if (!rec.date) return;
      const dateKey = rec.date.includes("T") ? rec.date.split("T")[0] : rec.date;
      const [y, m, d] = dateKey.split("-").map(Number);
      if (y === selYear && m === selMonth + 1) {
        if (!data[d]) data[d] = [];
        if (rec.checkIn) {
          const isLate = rec.violationType === "Late" || rec.violationType === "Both";
          const isEarly = rec.violationType === "Early";
          data[d].push({ type: "attendance", title: "Check-in", subtitle: fmtTimeStr(rec.checkIn), color: isEarly ? "#e0f2fe" : isLate ? "#fffbeb" : "#ecfdf5", textColor: isEarly ? "#0284c7" : isLate ? "#d97706" : "#059669" });
          if (rec.checkOut) {
            const dispOut = effectiveCheckOut(rec.checkOut, selectedEmp?.shiftEndTime);
            data[d].push({ type: "attendance", title: "Check-out", subtitle: fmtTimeStr(dispOut), color: "#ecfdf5", textColor: "#059669" });
          }
        } else if (rec.attendanceStatus === 'ABSENT' && !isBeforeDataStart(dateKey)) {
          data[d].push({ type: "absent", title: "Absent", subtitle: "No record", color: "#fff1f2", textColor: "#e11d48" });
        }
      }
    });
    permissionHistory
      .filter(p => p.ApprovalStatus === "Approved")
      .forEach(p => {
        const _pdo = new Date(p.Date);
        const py = _pdo.getFullYear(), pm = _pdo.getMonth() + 1, pd = _pdo.getDate();
        if (py === selYear && pm === selMonth + 1) {
          const startH = timeStrToHours(p.StartTime);
          const endH = timeStrToHours(p.EndTime);
          if (startH === null || endH === null) return;
          const mins = Math.round((endH - startH) * 60);
          if (!data[pd]) data[pd] = [];
          data[pd].push({ type: "attendance", title: "Permission", subtitle: `${fmtTimeStr(p.StartTime)} – ${fmtTimeStr(p.EndTime)} · ${fmtHoursMinutes(mins)}`, color: "#e0f2fe", textColor: "#0284c7" });
        }
      });
    return data;
  }

  // ── Mini calendar picker ─────────────────────────────────────────────────
  function renderAdminMiniCalendar() {
    const year = weekStart.getFullYear(); const month = weekStart.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const cells: { date: Date; isCurrent: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ date: new Date(year, month - 1, daysInPrev - i), isCurrent: false });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d), isCurrent: true });
    let t = 1; while (cells.length < 42) cells.push({ date: new Date(year, month + 1, t++), isCurrent: false });
    const weekStartYMD = toYMD(weekStart); const weekEndYMD = toYMD(weekEnd); const todayYMD = toYMD(today);
    return (
      <div className={styles.calendarContainer}>
        <div className={styles.calendarHeader}>
          <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, -28))}><ChevronLeft24Regular style={{ fontSize: "16px" }} /></button>
          <Text weight="semibold" size={300}>{MONTH_NAMES[month]} {year}</Text>
          <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, 28))}><ChevronRight24Regular style={{ fontSize: "16px" }} /></button>
        </div>
        <div className={styles.calendarGrid}>
          {DAY_NAMES.map(d => <div key={d} className={styles.calDayName}>{d}</div>)}
          {cells.map(({ date, isCurrent }, i) => {
            const ymd = toYMD(date);
            const isT = ymd === todayYMD; const inWeek = ymd >= weekStartYMD && ymd <= weekEndYMD;
            return (
              <div key={i} className={`${styles.calDay} ${isT ? styles.calDayToday : inWeek ? styles.calDayInWeek : !isCurrent ? styles.calDayOtherMonth : ""}`}
                onClick={() => { setWeekStart(getWeekStart(date)); setIsCalendarOpen(false); }}>
                {date.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // ── Day detail drawer data ────────────────────────────────────────────────
  const drawerContent = drawerDay ? (() => {
    const ymd = toYMD(drawerDay);
    const isHoliday = holidaySet.has(ymd);
    const rec = attMap.get(ymd) ?? null;
    const allRecs = attMapAll.get(ymd) ?? (rec ? [rec] : []);
    const normalizeDate = (s: string) => s.includes("T") ? s.split("T")[0] : s;
    const leaveToday = leaveRanges.find(l => ymd >= normalizeDate(l.leaveStartDate) && ymd <= normalizeDate(l.leaveEndDate));
    const holidayName = getHolidayNameA(ymd);
    const isWeekend = isWeekoffDay(drawerDay, ymd, weekOffConfigs);
    const isFuture = drawerDay > today;
    const lastRec = allRecs[allRecs.length - 1] ?? null;
    let status = "absent";
    if (isHoliday) status = "holiday";
    else if (allRecs.some(r => r.checkIn)) status = (lastRec?.checkIn && !lastRec?.checkOut) ? "active" : "present";
    else if (leaveToday) status = leaveToday.approvalStatus === "Approved" ? "approved_leave" : "pending_leave";
    else if (isWeekend) status = "weekend";
    else if (isFuture) status = "future";
    // No record before the data-collection start date → show "No data" instead of "Absent".
    if (status === "absent" && isBeforeDataStart(ymd)) status = "nodata";
    const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
      present: { label: "Present", color: "#059669", bg: "#ecfdf5", icon: <CheckmarkCircle20Filled style={{ color: "#059669" }} /> },
      active: { label: "Checked In", color: "#6366f1", bg: "#eff0ff", icon: <Clock20Regular style={{ color: "#6366f1" }} /> },
      absent: { label: "Absent", color: "#dc2626", bg: "#fff1f2", icon: <CalendarCancel20Regular style={{ color: "#dc2626" }} /> },
      holiday: { label: "Holiday", color: "#047857", bg: "#ecfdf5", icon: <CalendarCheckmark20Regular style={{ color: "#047857" }} /> },
      approved_leave: { label: "Approved Leave", color: "#7c3aed", bg: "#f5f3ff", icon: <CalendarCheckmark20Regular style={{ color: "#7c3aed" }} /> },
      pending_leave: { label: "Pending Leave", color: "#b45309", bg: "#fffbeb", icon: <CalendarCancel20Regular style={{ color: "#b45309" }} /> },
      weekend: { label: "Weekend", color: "#d97706", bg: "#fffbeb", icon: <WeatherMoon20Regular style={{ color: "#d97706" }} /> },
      future: { label: "Upcoming", color: "#6b7280", bg: "#f9fafb", icon: <CalendarMonth24Regular style={{ color: "#6b7280" }} /> },
      nodata: { label: "No Record", color: "#6b7280", bg: "#f9fafb", icon: <CalendarMonth24Regular style={{ color: "#6b7280" }} /> },
    };
    const meta = STATUS_META[status] ?? STATUS_META.absent;
    const rawTotalDurMins = allRecs.reduce((s, r) => s + (effectiveDurationMins(r.checkIn ?? null, r.checkOut ?? null, selectedEmp?.shiftEndTime) ?? 0), 0) || null;
    const drawerAdminWorkStartH = allRecs.length > 0 ? timeStrToHours(allRecs[0].checkIn) : null;
    const drawerAdminLastRec = allRecs[allRecs.length - 1];
    const drawerAdminWorkEndH = drawerAdminLastRec?.checkOut
      ? timeStrToHours(effectiveCheckOut(drawerAdminLastRec.checkOut ?? null, selectedEmp?.shiftEndTime))
      : timeStrToHours(selectedEmp?.shiftEndTime);
    const drawerPermMinsAdmin = getOverlappingPermissionMins(ymd, permissionHistory, drawerAdminWorkStartH, drawerAdminWorkEndH);
    const afterLunchAdmin2 = applyLunchDeduction(rawTotalDurMins, status === "active");
    const totalDurMins = applyPermissionDeduction(afterLunchAdmin2, drawerPermMinsAdmin, status === "active");
    const lunchDeductedTotal = status !== "active" && rawTotalDurMins !== null && rawTotalDurMins >= LUNCH_THRESHOLD_MINS;
    const dayPermissions = permissionHistory.filter(p => {
      const pDate = p.Date.includes("T") ? p.Date.split("T")[0] : p.Date;
      return pDate === ymd && p.ApprovalStatus === "Approved";
    });
    return { rec, allRecs, leaveToday, holidayName, isHoliday, isWeekend, isFuture, meta, status, totalDurMins, lunchDeductedTotal, dayPermissions, drawerPermMinsAdmin, drawerAdminWorkStartH, drawerAdminWorkEndH };
  })() : null;

  return (
    <div className={styles.teamWrap}>
      {/* ── Left: Department filter + Employee list ──────────────────────── */}
      <div className={styles.membersList}>
        {/* Department dropdown */}
        <div style={{ padding: "12px 14px", borderBottom: "1px solid #f3f4f6" }}>
          <select
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            style={{
              width: "100%", padding: "7px 10px", fontSize: "13px", fontWeight: 500,
              border: "1px solid #e5e7eb", borderRadius: "8px", background: "#fff",
              color: "#374151", cursor: "pointer", outline: "none",
            }}
          >
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {/* Employee search */}
        <div style={{ padding: "8px 14px", borderBottom: "1px solid #f3f4f6" }}>
          <input
            type="text"
            placeholder="Search employees..."
            value={empSearch}
            onChange={e => setEmpSearch(e.target.value)}
            style={{
              width: "100%", padding: "6px 10px", fontSize: "13px",
              border: "1px solid #e5e7eb", borderRadius: "8px",
              background: "#f9fafb", color: "#374151", outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div className={styles.membersListHeader}>
          {(() => {
            const filtered = employees.filter(e => !empSearch.trim() || e.name.toLowerCase().includes(empSearch.toLowerCase()) || (e.department ?? "").toLowerCase().includes(empSearch.toLowerCase()));
            const label = selectedDept ? selectedDept : "All Employees";
            return `${label} (${filtered.length})`;
          })()}
        </div>
        <div style={{ overflowY: "auto", maxHeight: "520px" }}>
          {empLoading && <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}><Spinner size="small" /></div>}
          {!empLoading && employees.filter(e => !empSearch.trim() || e.name.toLowerCase().includes(empSearch.toLowerCase()) || (e.department ?? "").toLowerCase().includes(empSearch.toLowerCase())).length === 0 && (
            <div style={{ padding: "20px", fontSize: "13px", color: "#9ca3af", textAlign: "center" }}>No employees found.</div>
          )}
          {!empLoading && employees.filter(e => !empSearch.trim() || e.name.toLowerCase().includes(empSearch.toLowerCase()) || (e.department ?? "").toLowerCase().includes(empSearch.toLowerCase())).map(emp => (
            <div
              key={emp.employeeId}
              className={`${styles.memberItem} ${selectedEmp?.employeeId === emp.employeeId ? styles.memberItemActive : ""}`}
              onClick={() => { setSelectedEmp(emp); setLoadedKey(""); }}
            >
              <div className={styles.memberAvatar} style={{ background: avatarColor(emp.name) }}>{getInitialsTH(emp.name)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px", minWidth: 0 }}>
                <span className={styles.memberItemName}>{emp.name}</span>
                <span className={styles.memberItemSub}>{emp.department ?? emp.jobTitle ?? ""}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: History view ──────────────────────────────────────────── */}
      <div>
        {!selectedEmp ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px", color: "#9ca3af", fontSize: "13px" }}>Select an employee to view their Attendance Log.</div>
        ) : (
          <div className={styles.timelineContainer}>
            {/* Header */}
            <div className={styles.timelineHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: avatarColor(selectedEmp.name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {getInitialsTH(selectedEmp.name)}
                </div>
                <div>
                  <Text weight="semibold" size={300}>{selectedEmp.name}</Text>
                  {selectedEmp.department && <Text size={100} style={{ color: tokens.colorNeutralForeground4, display: "block" }}>{selectedEmp.department}{selectedEmp.jobTitle ? ` · ${selectedEmp.jobTitle}` : ""}</Text>}
                </div>
              </div>

              {viewMode === "timeline" ? (
                <div className={styles.weekNav}>
                  <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, -7))}><ChevronLeft24Regular style={{ fontSize: "16px" }} /></button>
                  <div ref={calRef} style={{ position: "relative" }}>
                    <button className={styles.weekLabelBtn} onClick={() => setIsCalendarOpen(o => !o)}>{formatDateLabel(weekStart)} – {formatDateLabel(weekEnd)}</button>
                    {isCalendarOpen && <div className={styles.calendarDropdown}>{renderAdminMiniCalendar()}</div>}
                  </div>
                  <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, 7))} disabled={weekEnd >= today} style={{ opacity: weekEnd >= today ? 0.4 : 1 }}><ChevronRight24Regular style={{ fontSize: "16px" }} /></button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button className={styles.navBtn} onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}><ChevronLeft24Regular style={{ fontSize: "16px" }} /></button>
                  <Text weight="semibold" size={300} style={{ minWidth: "130px", textAlign: "center" }}>{calMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</Text>
                  <button className={styles.navBtn} onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}><ChevronRight24Regular style={{ fontSize: "16px" }} /></button>
                </div>
              )}

              <div className={styles.viewToggle}>
                <button className={`${styles.toggleBtn} ${viewMode === "timeline" ? styles.toggleBtnActive : styles.toggleBtnInactive}`} onClick={() => setViewMode("timeline")}><Timeline24Regular style={{ fontSize: "18px" }} />Timeline</button>
                <button className={`${styles.toggleBtn} ${viewMode === "calendar" ? styles.toggleBtnActive : styles.toggleBtnInactive}`} onClick={() => setViewMode("calendar")}><CalendarMonth24Regular style={{ fontSize: "18px" }} />Calendar</button>
              </div>
            </div>

            {calLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}><Spinner label="Loading…" /></div>
            ) : viewMode === "timeline" ? (
              <>
                <div className={styles.timelineScroll}>
                  <div className={styles.timelineInner}>
                    <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                      <div style={{ minWidth: "110px", flexShrink: 0 }} />
                      <div style={{ flex: 1, position: "relative", height: "20px", paddingRight: "12px" }}>
                        {axisLabels.map(h => (
                          <span key={h} style={{ position: "absolute", left: `${pct(h)}%`, transform: "translateX(-50%)", whiteSpace: "nowrap", fontSize: "10px", color: tokens.colorNeutralForeground4, fontWeight: 600, textTransform: "uppercase" }}>{hourLabel(h)}</span>
                        ))}
                      </div>
                      <div style={{ minWidth: "90px", paddingRight: "20px", flexShrink: 0 }} />
                    </div>
                    {weekDays.map(day => renderAdminDayRow(day))}
                  </div>
                </div>
                <div className={styles.legend}>
                  {[
                    { label: "Present", gradient: "linear-gradient(90deg, #6366F1, #38BDF8)" },
                    { color: "#EF4444", label: "Absent" },
                    { color: "#F59E0B", label: "Weekend / Pending Leave" },
                    { color: "#10B981", label: "Holiday" },
                    { color: "#8B5CF6", label: "Approved Leave" },
                  ].map(({ color, label, gradient }: any) => (
                    <div key={label} className={styles.legendItem}>
                      <div className={styles.legendDot} style={gradient ? { background: gradient, width: "24px", height: "4px", borderRadius: "4px" } : { backgroundColor: color }} />{label}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: "16px" }}>
                <AttendanceCalendar
                  month={calMonth.getMonth()}
                  year={calMonth.getFullYear()}
                  attendanceData={getAdminCalendarData()}
                  isCompact={true}
                  onDateClick={(day) => { setDrawerDay(day); setDrawerOpen(true); }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Day detail drawer ──────────────────────────────────────────── */}
      {drawerContent && (
        <OverlayDrawer open={drawerOpen} onOpenChange={(_, s) => setDrawerOpen(s.open)} position="end" size="medium">
          <DrawerHeader>
            <DrawerHeaderTitle action={<Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => setDrawerOpen(false)} />}>
              {drawerDay!.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </DrawerHeaderTitle>
          </DrawerHeader>
          <DrawerBody style={{ padding: 0, overflow: "auto" }}>
            {selectedEmp?.name && (
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#9ca3af", padding: "12px 24px 0" }}>{selectedEmp.name}</div>
            )}
            <AttendanceDayCard
              date={drawerDay!}
              status={drawerContent.status as any}
              sessions={drawerContent.allRecs.map((session) => {
                const effOut = session.checkOut ? effectiveCheckOut(session.checkOut ?? null, selectedEmp?.shiftEndTime) : null;
                const rawDur = effectiveDurationMins(session.checkIn ?? null, session.checkOut ?? null, selectedEmp?.shiftEndTime);
                if (drawerContent.allRecs.length === 1) {
                  const afterLunchDur = applyLunchDeduction(rawDur, !session.checkOut);
                  return {
                    checkIn: session.checkIn || undefined,
                    checkOut: effOut || undefined,
                    durationMinutes: applyPermissionDeduction(afterLunchDur, drawerContent.drawerPermMinsAdmin, !session.checkOut),
                    workLocationType: session.workLocationType || undefined,
                    violationType: session.violationType || undefined,
                  };
                }
                return {
                  checkIn: session.checkIn || undefined,
                  checkOut: effOut || undefined,
                  durationMinutes: rawDur,
                  workLocationType: session.workLocationType || undefined,
                  violationType: session.violationType || undefined,
                };
              })}
              permissions={drawerContent.dayPermissions.map(p => {
                const startH = timeStrToHours(p.StartTime);
                const endH = timeStrToHours(p.EndTime);
                const fullMins = (startH !== null && endH !== null) ? Math.max(0, Math.round((endH - startH) * 60)) : 0;
                return { startTime: p.StartTime, endTime: p.EndTime, reason: p.Reason, durationMinutes: fullMins, effectiveMinutes: permissionOverlapMins(p, drawerContent.drawerAdminWorkStartH, drawerContent.drawerAdminWorkEndH) };
              })}
              leaveTypeName={(displayLeaveLabel(drawerContent.leaveToday?.leaveTypeName) || drawerContent.leaveToday?.leaveTypeName) ?? undefined}
              leaveStart={drawerContent.leaveToday?.leaveStartDate}
              leaveEnd={drawerContent.leaveToday?.leaveEndDate}
              leaveApprovalStatus={drawerContent.leaveToday?.approvalStatus}
              holidayName={drawerContent.holidayName || undefined}
              shiftEnd={selectedEmp?.shiftEndTime || undefined}
            />
          </DrawerBody>
        </OverlayDrawer>
      )}
    </div>
  );
};

const AttendanceHistory: React.FC = () => {
  const styles = useStyles();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // ── Permission check ───────────────────────
  const isManager = (() => {
    try {
      const perms: any = currentUser?.permissions;
      return perms?.attendance?.dashboard?.manager_dashboard === true;
    } catch { return false; }
  })();

  const isAdmin = (() => {
    try {
      const perms: any = currentUser?.permissions;
      return perms?.attendance?.dashboard?.admin_dashboard === true;
    } catch { return false; }
  })();

  const [activeTab, setActiveTab] = useState<"myHistory" | "teamHistory" | "adminView">("myHistory");

  const [userData, setUserData] = useState<EntraADUser | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequestRecord[]>([]);
  const [permissionHistory, setPermissionHistory] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffConfigs, setWeekOffConfigs] = useState<WeekOffConfig[]>([]);



  const location = useLocation()



  // Check if it is from dashboard 

  useEffect(() => {
    if (location && location.state && location.state?.type === "admin") {
      setActiveTab("adminView")


    }
  }, [location])

  // ── Day detail drawer ──────────────────────
  const [drawerDay, setDrawerDay] = useState<Date | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDrawer = (day: Date) => { setDrawerDay(day); setDrawerOpen(true); };

  // Week cursor: the Sunday of the currently displayed week
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [viewMode, setViewMode] = useState<"timeline" | "calendar">("timeline");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close calendar on outside click
  useEffect(() => {
    if (!isCalendarOpen) return;
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isCalendarOpen]);

  // Calendar month state (for the mini calendar above)
  const [calMonth, setCalMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekEnd = addDays(weekStart, 6);

  // ── Fetch user + holidays + leaves ────────
  const fetchStaticData = useCallback(async () => {
    if (!currentUser?.userID) return;
    const [userRes, holidayRes, leaveRes, permRes] = await Promise.all([
      getEntraUserById(currentUser.userID),
      getHolidaysByYear(new Date().getFullYear()),
      getLeaveHistory(currentUser.userID),
      getPermissionHistory(currentUser.userID),
    ]);
    if (userRes.success && userRes.data) setUserData(userRes.data);

    if (holidayRes.success && holidayRes.data) {
      // Filter out location-specific holidays that don't belong to the user's office
      const userLocation = userRes.success && userRes.data ? userRes.data.Office_Location : null;
      const filteredHolidays = holidayRes.data.filter(h => {
        if (!h.IsLocationSpecific) return true;
        if (!userLocation || !h.LocationNames) return false;
        const locs = h.LocationNames.split(',').map(l => l.trim().toLowerCase());
        return locs.includes(userLocation.trim().toLowerCase());
      });
      setHolidays(filteredHolidays);
    }

    if (leaveRes.success && leaveRes.data) setLeaveHistory(leaveRes.data);
    if (Array.isArray(permRes)) setPermissionHistory(permRes);
  }, [currentUser?.userID]);

  useEffect(() => { fetchStaticData(); }, [fetchStaticData]);

  // ── Fetch attendance for the visible week ──
  const fetchWeekData = useCallback(async () => {
    if (!currentUser?.userID) return;
    setLoading(true);
    try {
      if (viewMode === "calendar") {
        const m = calMonth.getMonth() + 1;
        const year = calMonth.getFullYear();
        const data = await getAttendanceHistory(currentUser.userID, m, year, 1, 31);
        setRecords(data ?? []);
      } else {
        // Fetch the month(s) that overlap the selected week
        const months = new Set([weekStart.getMonth() + 1, weekEnd.getMonth() + 1]);
        const year = weekStart.getFullYear();
        const fetched: AttendanceRecord[] = [];
        for (const m of months) {
          const data = await getAttendanceHistory(currentUser.userID, m, year, 1, 31);
          if (data) fetched.push(...data);
        }
        setRecords(fetched);
      }
    } finally {
      setLoading(false);
    }
  }, [currentUser?.userID, weekStart, viewMode, calMonth]);

  useEffect(() => { fetchWeekData(); }, [fetchWeekData]);

  // ── Fetch weekoff configs for the visible week ──
  useEffect(() => {
    if (!currentUser?.userID) return;
    const start = toYMD(weekStart);
    const end = toYMD(weekEnd);
    getUserWeekOffConfigs(currentUser.userID, start, end)
      .then(setWeekOffConfigs)
      .catch(() => setWeekOffConfigs([]));
  }, [currentUser?.userID, weekStart]);

  // ── Derived helpers ────────────────────────
  const holidaySet = new Set(
    holidays.filter(h => h.HolidayType !== 'Optional').map(h => {
      const d = h.HolidayDate.includes("T") ? h.HolidayDate.split("T")[0] : h.HolidayDate;
      return d;
    })
  );

  const formatHHMM = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    // The DB stores IST times via SWITCHOFFSET(), but mssql serializes DATETIME2
    // as "YYYY-MM-DDTHH:mm:ss.sssZ" — the trailing 'Z' is wrong (it's IST, not UTC).
    // Stripping the 'Z' forces JS to parse it as local time, giving the correct display.
    const normalized = typeof dateStr === "string" ? dateStr.replace(/Z$/, "") : dateStr;
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
  };

  const getCalendarData = () => {
    const data: Record<number, CalendarEvent[]> = {};
    const selMonth = calMonth.getMonth();
    const selYear = calMonth.getFullYear();

    // 1. Map Holidays
    holidays.filter((item)=>item.HolidayType !== 'Optional').forEach(h => {
      const dStr = h.HolidayDate.includes("T") ? h.HolidayDate.split("T")[0] : h.HolidayDate;
      const [y, m, d] = dStr.split("-").map(Number);
      if (y === selYear && m === selMonth + 1) {
        if (!data[d]) data[d] = [];
        data[d].push({
          type: "holiday",
          title: "Holiday",
          subtitle: h.HolidayName,
          color: "#eff6ff",
          textColor: "#2563eb",
          borderColor: "#3b82f633"
        });
      }
    });

    // 2. Map Leaves
    leaveHistory.forEach(leave => {
      const start = new Date(leave.Start_Date);
      const end = new Date(leave.End_Date);
      let curr = new Date(start);
      while (curr <= end) {
        if (curr.getMonth() === selMonth && curr.getFullYear() === selYear) {
          const d = curr.getDate();
          if (!data[d]) data[d] = [];
          const isApproved = leave.ApprovalStatus === "Approved";
          data[d].push({
            type: "leave",
            title: displayLeaveLabel(leave.LeaveName) || "Leave",
            subtitle: leave.ApprovalStatus,
            color: isApproved ? "#f5f3ff" : "#f0fdfa",
            textColor: isApproved ? "#7c3aed" : "#0d9488",
            borderColor: isApproved ? "#8b5cf633" : "#2dd4bf33"
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    });

    // 3. Map Attendance
    records.forEach(record => {
      if (!record.CheckIn) {
        // Absent record with no CheckIn — use CreatedOn date string for the calendar date
        if (record.AttendanceStatus === 'ABSENT' && record.CreatedOn && typeof record.CreatedOn === 'string') {
          const rawStr = String(record.CreatedOn);
          const dateStr = rawStr.includes("T") ? rawStr.split("T")[0] : rawStr;
          const parts = dateStr.split("-").map(Number);
          if (parts.length === 3 && parts[0] === selYear && parts[1] === selMonth + 1 && !isBeforeDataStart(dateStr)) {
            if (!data[parts[2]]) data[parts[2]] = [];
            data[parts[2]].push({ type: "absent", title: "Absent", subtitle: "No record", color: "#fff1f2", textColor: "#e11d48" });
          }
        }
        return;
      }
      const dObj = new Date(record.CheckIn);
      if (dObj.getUTCMonth() === selMonth && dObj.getUTCFullYear() === selYear) {
        const d = dObj.getUTCDate();
        if (!data[d]) data[d] = [];

        // A record that has a CheckIn is a real attendance entry — show it as checked-in,
        // matching the timeline/drawer (which key off CheckIn presence). Genuinely absent
        // days carry CheckIn=null and are handled by the no-CheckIn branch above.
        const isCheckedIn = !!record.CheckIn;
        if (isCheckedIn) {
          const isLate = record.ViolationType === "Late" || record.ViolationType === "Both";
          const isEarly = record.ViolationType === "Early";

          data[d].push({
            type: "attendance",
            title: "Check-in",
            subtitle: formatHHMM(record.CheckIn),
            color: isEarly ? "#e0f2fe" : isLate ? "#fffbeb" : "#ecfdf5",
            textColor: isEarly ? "#0284c7" : isLate ? "#d97706" : "#059669"
          });

          if (record.CheckOut) {
            const dispOut = effectiveCheckOut(record.CheckOut, record.ShiftEndTime);
            data[d].push({
              type: "attendance",
              title: "Check-out",
              subtitle: dispOut ? fmtTimeStr(dispOut) : formatHHMM(record.CheckOut),
              color: "#ecfdf5",
              textColor: "#059669"
            });
          }
        } else if (record.AttendanceStatus === 'ABSENT' && !isBeforeDataStart(`${selYear}-${String(selMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`)) {
          data[d].push({
            type: "absent",
            title: "Absent",
            subtitle: "No record",
            color: "#fff1f2",
            textColor: "#e11d48"
          });
        }
      }
    });

    // 4. Map approved permissions
    permissionHistory
      .filter(p => p.ApprovalStatus === "Approved")
      .forEach(p => {
        const _pdo = new Date(p.Date);
        const py = _pdo.getFullYear(), pm = _pdo.getMonth() + 1, pd = _pdo.getDate();
        if (py === selYear && pm === selMonth + 1) {
          const startH = timeStrToHours(p.StartTime);
          const endH = timeStrToHours(p.EndTime);
          if (startH === null || endH === null) return;
          const mins = Math.round((endH - startH) * 60);
          if (!data[pd]) data[pd] = [];
          data[pd].push({
            type: "attendance",
            title: "Permission",
            subtitle: `${fmtTimeStr(p.StartTime)} – ${fmtTimeStr(p.EndTime)} · ${fmtHoursMinutes(mins)}`,
            color: "#e0f2fe",
            textColor: "#0284c7",
          });
        }
      });

    // 5. Mark absent for past working days that have no events at all
    const daysInMonth = new Date(selYear, selMonth + 1, 0).getDate();
    const todayYMD = toYMD(today);
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dayDate = new Date(selYear, selMonth, dayNum);
      const ymd = toYMD(dayDate);
      if (ymd >= todayYMD) continue;
      if (isBeforeDataStart(ymd)) continue;
      if (data[dayNum] && data[dayNum].length > 0) continue;
      if (holidaySet.has(ymd)) continue;
      if (isWeekoffDay(dayDate, ymd, weekOffConfigs)) continue;
      if (!data[dayNum]) data[dayNum] = [];
      data[dayNum].push({ type: "absent", title: "Absent", subtitle: "No record", color: "#fff1f2", textColor: "#e11d48" });
    }

    return data;
  };

  function getHolidayName(dateStr: string): string | undefined {
    return holidays.find(h => {
      const d = h.HolidayDate.includes("T") ? h.HolidayDate.split("T")[0] : h.HolidayDate;
      return d === dateStr;
    })?.HolidayName;
  }

  function getRecord(day: Date): AttendanceRecord | undefined {
    const dayStr = toYMD(day);
    return records.find(r => r.CheckIn && r.CheckIn.startsWith(dayStr));
  }

  function getRecords(day: Date): AttendanceRecord[] {
    const dayStr = toYMD(day);
    return records.filter(r => r.CheckIn && r.CheckIn.startsWith(dayStr));
  }

  // ── Shift / time-axis ──────────────────────
  // Axis spans from the earliest actual check-in (or shift start-1h) to
  // the latest actual check-out (or shift end+1h) for the current week.
  const shiftStartH = timeStrToHours(userData?.StartTime) ?? 9;
  const shiftEndH = timeStrToHours(userData?.EndTime) ?? 18;
  const weekStartYMD = toYMD(weekStart);
  const weekEndYMD = toYMD(weekEnd);
  const weekRecords = records.filter(r => {
    if (!r.CheckIn) return false;
    const d = r.CheckIn.split("T")[0];
    return d >= weekStartYMD && d <= weekEndYMD;
  });
  const overnightShift = shiftEndH < shiftStartH;
  const effShiftEndH = overnightShift ? shiftEndH + 24 : shiftEndH;
  // Pair each session's check-in with its overnight-normalised check-out so the axis
  // can extend past midnight for night shifts.
  const weekAxisPairs = [
    ...weekRecords.map(r => ({
      inH: timeStrToHours(r.CheckIn),
      outH: r.CheckOut ? continuousOutHour(r.CheckIn, r.CheckOut) : null,
    })),
    // Widen the axis for overnight permissions so both split halves stay visible.
    ...overnightPermissionAxisPairs(permissionHistory, weekStartYMD, weekEndYMD),
  ];
  const { axisStart, axisEnd } = computeTimelineAxis(weekAxisPairs, shiftStartH, shiftEndH);
  const axisDuration = axisEnd - axisStart; // hours

  function pct(hoursFraction: number): number {
    return Math.min(100, Math.max(0, ((hoursFraction - axisStart) / axisDuration) * 100));
  }

  // Build time axis labels (every hour)
  const axisLabels: number[] = [];
  for (let h = Math.ceil(axisStart); h <= Math.floor(axisEnd); h++) {
    axisLabels.push(h);
  }

  const hourLabel = axisHourLabel;

  // ── Week row rendering ─────────────────────
  function renderDayRow(day: Date) {
    const ymd = toYMD(day);
    const isToday = sameDay(day, today);
    const isFuture = day > today;
    const dayOfWeek = day.getDay();
    const isWeekend = isWeekoffDay(day, ymd, weekOffConfigs);
    const isHoliday = holidaySet.has(ymd);
    const dayRecords = getRecords(day);
    const record = dayRecords[0];
    const lastRecord = dayRecords[dayRecords.length - 1];

    // Determine status — sync EXACTLY with AttendanceDashboard logic:
    // Priority: Holiday > Attendance Record > Approved/Pending Leave > Future > Weekend > Absent
    let status: "present" | "absent" | "weekend" | "holiday" | "approved_leave" | "pending_leave" | "future" | "active" | "nodata" = "absent";

    // Matching string for day (YYYY-MM-DD)
    const dayYMD = toYMD(day);

    // Helper to get normalized date only string from DB strings
    const normalizeDBDate = (s: string) => s.includes("T") ? s.split("T")[0] : s;

    if (isHoliday) {
      status = "holiday";
    } else if (record && record.CheckIn) {
      // 1. Attendance Record (Direct from DB) — active if the last session has no checkout
      status = lastRecord?.CheckOut ? "present" : "active";
    } else {
      // 2. Leave History (Show leaves even for future/weekends)
      const leaveToday = leaveHistory.find(l => {
        const s = normalizeDBDate(l.Start_Date);
        const e = normalizeDBDate(l.End_Date);
        return dayYMD >= s && dayYMD <= e;
      });

      if (leaveToday) {
        // Case-sensitive match with dashboard logic
        if (leaveToday.ApprovalStatus === "Approved") status = "approved_leave";
        else if (leaveToday.ApprovalStatus === "Pending") status = "pending_leave";
        else if (leaveToday.ApprovalStatus === "Requested") status = "pending_leave";
      }

      // 3. Status fallbacks (only if no leave)
      if (status === "absent") {
        if (isWeekend) status = "weekend";
        else if (isFuture) status = "future";
      }
    }
    // No record before the data-collection start date → show nothing instead of "Absent".
    if (status === "absent" && isBeforeDataStart(dayYMD)) status = "nodata";

    // Times — first record's check-in used for late label display
    const checkInH = record?.CheckIn ? timeStrToHours(record.CheckIn) : null;

    // Duration — sum across all sessions for the day
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    // Overnight: lift early-morning "now" onto the continuous axis so the marker sits correctly.
    const nowPct = pct(axisEnd > 24 && nowH < axisStart ? nowH + 24 : nowH);
    const rawDurationMins = dayRecords.length === 0 ? null : (() => {
      let total = 0;
      dayRecords.forEach((r, idx) => {
        const hasSentinelCheckout = r.CheckOut?.startsWith("1900-01-01");
        const effOut = r.CheckOut ? effectiveCheckOut(r.CheckOut, r.ShiftEndTime) : null;
        const isCapped = effOut !== null && effOut !== r.CheckOut;
        // Overnight sessions: the backend DurationMinutes is unreliable (it can go
        // negative when the check-out clock reads before the check-in) — always recompute.
        const isOvernight = isOvernightSession(r.CheckIn, r.CheckOut);
        if (isCapped || isOvernight) {
          // Checkout capped at shift end, or the session crossed midnight — recompute from time-of-day.
          total += effectiveDurationMins(r.CheckIn, r.CheckOut, r.ShiftEndTime)
            ?? durationFromTimes(r.CheckIn, r.CheckOut) ?? 0;
        } else if (r.DurationMinutes != null && !hasSentinelCheckout) {
          total += r.DurationMinutes;
        } else if (status === "active" && idx === dayRecords.length - 1) {
          const ciH = timeStrToHours(r.CheckIn);
          if (ciH !== null) total += Math.round((normalizeOutHour(ciH, nowH) - ciH) * 60);
        } else if (r.CheckIn && r.CheckOut) {
          // Compute from timestamps — handles 1900-01-01 sentinel checkout
          total += durationFromTimes(r.CheckIn, r.CheckOut) ?? 0;
        }
      });
      return total > 0 ? total : null;
    })();
    const isInvalidDuration = rawDurationMins !== null && rawDurationMins > 24 * 60;
    const myWorkStartH = dayRecords.length > 0 ? timeStrToHours(dayRecords[0].CheckIn) : null;
    const myLastRec = dayRecords[dayRecords.length - 1];
    const myWorkEndH = myLastRec?.CheckOut
      ? timeStrToHours(effectiveCheckOut(myLastRec.CheckOut, myLastRec.ShiftEndTime))
      : shiftEndH;
    const permMins = getOverlappingPermissionMins(dayYMD, permissionHistory, myWorkStartH, myWorkEndH);
    const afterLunch = applyLunchDeduction(isInvalidDuration ? null : rawDurationMins, status === "active");
    const durationMins = applyPermissionDeduction(afterLunch, permMins, status === "active");

    const lateLabel = (record && (record.ViolationType === "Late" || record.ViolationType === "Both"))
      ? lateDelta(record.CheckIn, userData?.StartTime)
      : (record && record.ViolationType === "Early") ? "Early arrival" : null;

    // Bar color / gradient / label
    const PRESENT_GRADIENT = "linear-gradient(135deg, #6366F1 0%, #38BDF8 100%)";
    const ACTIVE_GRADIENT = "linear-gradient(135deg, #6366F1 0%, #22D3EE 100%)";
    const APPROVED_BG = "rgba(139, 92, 246, 0.12)";
    const APPROVED_BORDER = "#8B5CF6";
    const PENDING_PATTERN = "repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.05) 10px, rgba(245, 158, 11, 0.12) 10px, rgba(245, 158, 11, 0.12) 20px)";
    const PENDING_BORDER = "rgba(245, 158, 11, 0.5)";
    const HOLIDAY_BG = "rgba(16, 185, 129, 0.12)";
    const HOLIDAY_BORDER = "#10B981";
    const WEEKEND_PATTERN = "repeating-linear-gradient(45deg, rgba(245, 158, 11, 0.02), rgba(245, 158, 11, 0.02) 10px, rgba(245, 158, 11, 0.06) 10px, rgba(245, 158, 11, 0.06) 20px)";
    const WEEKEND_BORDER = "rgba(245, 158, 11, 0.3)";
    const ABSENT_BG = "rgba(239, 68, 68, 0.08)";
    const ABSENT_BORDER = "rgba(239, 68, 68, 0.4)";
    const FUTURE_BG = "rgba(226, 232, 240, 0.2)";
    const FUTURE_BORDER = "rgba(226, 232, 240, 0.8)";
    const DOT_COLOR = "#6366F1";

    let barBackground: string = PRESENT_GRADIENT;
    let barBorder: string = "none";
    let textColor: string = tokens.colorNeutralForeground1;
    let centerLabel = "";
    let shadow = "none";
    let barOpacity = 1;
    let isPattern = false;

    if (status === "future") {
      barBackground = FUTURE_BG; barBorder = `1.5px solid ${FUTURE_BORDER}`; centerLabel = "";
    } else if (status === "weekend") {
      barBackground = WEEKEND_PATTERN; barBorder = `1.5px dashed ${WEEKEND_BORDER}`; textColor = "#D97706"; centerLabel = "Weekend"; isPattern = true;
    } else if (status === "holiday") {
      barBackground = HOLIDAY_BG; barBorder = `1.5px solid ${HOLIDAY_BORDER}`; textColor = "#047857"; centerLabel = getHolidayName(dayYMD) || "Holiday";
    } else if (status === "approved_leave") {
      barBackground = APPROVED_BG; barBorder = `1.5px solid ${APPROVED_BORDER}`; textColor = "#7C3AED";
      const lv = leaveHistory.find(l => {
        const s = normalizeDBDate(l.Start_Date);
        const e = normalizeDBDate(l.End_Date);
        return dayYMD >= s && dayYMD <= e;
      });
      centerLabel = displayLeaveLabel(lv?.LeaveName) || "Approved Leave";
      shadow = "0 2px 8px rgba(139, 92, 246, 0.15)";
    } else if (status === "pending_leave") {
      barBackground = PENDING_PATTERN; barBorder = `1.5px solid ${PENDING_BORDER}`; textColor = "#B45309";
      const lv = leaveHistory.find(l => {
        const s = normalizeDBDate(l.Start_Date);
        const e = normalizeDBDate(l.End_Date);
        return dayYMD >= s && dayYMD <= e;
      });
      centerLabel = (displayLeaveLabel(lv?.LeaveName) || "Pending Leave") + " (Pending)";
      isPattern = true;
    } else if (status === "absent") {
      barBackground = ABSENT_BG; barBorder = `1.5px solid ${ABSENT_BORDER}`; textColor = "#DC2626"; centerLabel = "Absent";
    } else if (status === "active") {
      barBackground = ACTIVE_GRADIENT;
    } else {
      barBackground = PRESENT_GRADIENT;
    }

    const showFullBar = status !== "present" && status !== "active" && status !== "nodata";

    return (
      <div key={ymd} className={styles.dayRow}>
        {/* Day label — click info icon to open drawer */}
        <div className={styles.dayLabel} style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: "6px", minWidth: "110px" }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: "14px", fontWeight: 700, color: isToday ? "#007ED5" : tokens.colorNeutralForeground4 }}>
              {DAY_NAMES[dayOfWeek]}
            </span>
            <span style={{ fontSize: "20px", fontWeight: 800, color: tokens.colorNeutralForeground1, lineHeight: "1" }}>
              {day.getDate()}
            </span>
            {lateLabel && (
              <span style={{ fontSize: "10px", color: lateLabel === "Early arrival" ? "#13a929" : "#EF4444", fontWeight: 600 }}>{lateLabel}</span>
            )}
            {status === "active" && !lateLabel && (
              <span style={{ fontSize: "10px", color: "#6366F1", fontWeight: 600 }}>
                {record?.CheckIn ? (() => {
                  const ciH = timeStrToHours(record.CheckIn);
                  if (ciH === null) return "";
                  const totalH = Math.floor(ciH);
                  const totalM = Math.round((ciH - totalH) * 60);
                  const ampm = totalH >= 12 ? "PM" : "AM";
                  return `${totalH % 12 || 12}:${String(totalM).padStart(2, "0")} ${ampm}`;
                })() : ""}
              </span>
            )}
          </div>

          {/* <button
            className={styles.detailIconBtn}
            title="View day details"
            onClick={e => { e.stopPropagation(); openDrawer(day); }}
          >
            <Info20Regular />
          </button> */}
        </div>

        {/* Bar track */}
        <div className={styles.barTrack}>
          {/* Shift boundary shading */}
          <div style={{
            position: "absolute",
            left: `${pct(shiftStartH)}%`,
            width: `${pct(effShiftEndH) - pct(shiftStartH)}%`,
            top: "8px", bottom: "8px",
            backgroundColor: "rgba(0,126,213,0.04)",
            borderLeft: "1px dashed rgba(0,126,213,0.2)",
            borderRight: "1px dashed rgba(0,126,213,0.2)",
            borderRadius: "2px",
          }} />

          {/* Bar — thin line for present/active; full-width bar for other statuses */}
          {showFullBar ? (
            <div style={{
              position: "absolute", left: "2px", right: "2px", height: "28px",
              top: "calc(50% - 14px)",
              background: barBackground,
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: barBorder,
              boxShadow: shadow,
              zIndex: (status === "approved_leave" || status === "pending_leave") ? 5 : 1,
              backdropFilter: "blur(4px)",
            }}>
              <span style={{
                fontSize: "11px",
                fontWeight: 700,
                color: textColor,
                textTransform: "uppercase",
                letterSpacing: "0.03em",
                opacity: 0.9,
              }}>
                {centerLabel}
              </span>
            </div>
          ) : (
            dayRecords.map((rec, idx) => {
              const ciH = timeStrToHours(rec.CheckIn);
              if (ciH === null) return null;
              const isLastRec = idx === dayRecords.length - 1;
              const isActiveBar = status === "active" && isLastRec;
              const effRecOut = rec.CheckOut ? effectiveCheckOut(rec.CheckOut, rec.ShiftEndTime) : null;
              // Overnight: lift a next-day check-out onto the continuous axis (past 24:00).
              const coH = effRecOut
                ? continuousOutHour(rec.CheckIn, effRecOut)
                : (isActiveBar ? normalizeOutHour(ciH, nowH) : null);
              const bl = pct(ciH);
              const br = coH !== null ? pct(coH) : bl;
              const bw = Math.max(0, br - bl);
              return (
                <React.Fragment key={idx}>
                  <div style={{
                    position: "absolute",
                    left: `${bl}%`, width: `${bw}%`,
                    height: "4px", top: "calc(50% - 2px)",
                    background: isActiveBar ? ACTIVE_GRADIENT : PRESENT_GRADIENT,
                    borderRadius: "4px", opacity: barOpacity,
                    transition: "width 0.4s ease", minWidth: "6px",
                    boxShadow: "0 1px 6px rgba(99,102,241,0.35)",
                  }} />
                  <div style={{
                    position: "absolute",
                    left: `calc(${bl}% - 5px)`, top: "calc(50% - 5px)",
                    width: "10px", height: "10px",
                    borderRadius: "50%", background: DOT_COLOR, zIndex: 3,
                    boxShadow: "0 0 0 3px rgba(99,102,241,0.15)",
                  }} />
                  {coH !== null && (
                    <div style={{
                      position: "absolute",
                      left: `calc(${br}% - 5px)`, top: "calc(50% - 5px)",
                      width: "10px", height: "10px",
                      borderRadius: "50%", background: DOT_COLOR,
                      border: isActiveBar ? "2px solid #38BDF8" : "none",
                      zIndex: 3,
                      boxShadow: "0 0 0 3px rgba(56,189,248,0.2)",
                    }} />
                  )}
                </React.Fragment>
              );
            })
          )}

          {/* Approved permission blocks (overnight permissions split across dates) */}
          {permissionHistory
            .filter(p => p.ApprovalStatus === "Approved")
            .flatMap(p => getPermissionSegmentsForDay(p, ymd))
            .map(seg => {
              const pl = pct(seg.startH);
              const pr = pct(seg.endH);
              const pw = Math.max(0, pr - pl);
              const fmt = (h: number) => {
                const hr = Math.floor(h);
                const mn = Math.round((h - hr) * 60);
                const ampm = hr >= 12 ? "PM" : "AM";
                return `${hr % 12 || 12}:${String(mn).padStart(2, "0")} ${ampm}`;
              };
              const rangeLabel = `${fmt(seg.fullStartH)} – ${fmt(seg.fullEndH)}`;
              const title = seg.part === "full"
                ? `Permission: ${seg.p.Reason} (${rangeLabel})`
                : `Permission: ${seg.p.Reason} (${rangeLabel} · overnight, ${seg.part === "start" ? "continues next day" : "continued from previous day"})`;
              const radius = seg.part === "start" ? "4px 0 0 4px" : seg.part === "end" ? "0 4px 4px 0" : "4px";
              return (
                <div
                  key={seg.key}
                  title={title}
                  style={{
                    position: "absolute",
                    left: `${pl}%`, width: `${pw}%`,
                    height: "12px", top: "calc(50% - 6px)",
                    background: "linear-gradient(90deg, #0EA5E9, #38BDF8)",
                    borderRadius: radius,
                    opacity: 0.85,
                    zIndex: 4,
                    boxShadow: "0 1px 4px rgba(14,165,233,0.4)",
                    minWidth: "6px",
                  }}
                />
              );
            })}

          {/* Current-time dashed line (today only) */}
          {isToday && (
            <div style={{
              position: "absolute",
              left: `${nowPct}%`,
              top: 0, bottom: 0, width: "2px",
              borderLeft: "2px dashed #3B82F6",
              zIndex: 2,
            }} />
          )}
        </div>

        {/* Hours worked */}
        <div className={styles.hoursLabel}>
          {isInvalidDuration ? (
            <>
              <Warning24Filled style={{ color: "#d97706", width: 18, height: 18 }} />
              <Text size={100} style={{ color: "#d97706" }}>Data error</Text>
            </>
          ) : (
            <>
              <Text weight="bold" size={300} style={{ color: durationMins ? tokens.colorNeutralForeground1 : tokens.colorNeutralForeground4 }}>
                {durationMins !== null ? fmtHoursMinutes(durationMins) : "00:00"}
              </Text>
              <Text size={100} style={{ color: tokens.colorNeutralForeground4 }}>
                {status === "active" ? "Hrs" : "Hrs worked"}
              </Text>
            </>
          )}
        </div>

        {/* Detail icon */}
        <button
          className={styles.detailIconBtn}
          title="View day details"
          onClick={e => { e.stopPropagation(); openDrawer(day); }}
        >
          <ExpandUpRightRegular style={{ height: '90%', width: '90%' }} />
        </button>
      </div>
    );
  }



  // ── Calendar helpers ───────────────────────
  function renderCalendar() {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // Sunday=0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { date: Date; isCurrentMonth: boolean }[] = [];

    // Leading days from prev month
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false });
    }
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    // Trailing days to fill 6 rows (42 cells)
    let trailing = 1;
    while (cells.length < 42) {
      cells.push({ date: new Date(year, month + 1, trailing++), isCurrentMonth: false });
    }

    const weekStartYMD = toYMD(weekStart);
    const weekEndYMD = toYMD(weekEnd);
    const todayYMD = toYMD(today);

    return (
      <div className={styles.calendarContainer}>
        <div className={styles.calendarHeader}>
          <button className={styles.navBtn} onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>
            <ChevronLeft24Regular style={{ fontSize: "16px" }} />
          </button>
          <Text weight="semibold" size={300}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <button className={styles.navBtn} onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>
            <ChevronRight24Regular style={{ fontSize: "16px" }} />
          </button>
        </div>

        <div className={styles.calendarGrid}>
          {DAY_NAMES.map(d => <div key={d} className={styles.calDayName}>{d}</div>)}
          {cells.map(({ date, isCurrentMonth }, i) => {
            const ymd = toYMD(date);
            const isToday2 = ymd === todayYMD;
            const isInWeek = ymd >= weekStartYMD && ymd <= weekEndYMD;
            return (
              <div
                key={i}
                className={`${styles.calDay} ${isToday2 ? styles.calDayToday : isInWeek ? styles.calDayInWeek : !isCurrentMonth ? styles.calDayOtherMonth : ""}`}
                onClick={() => {
                  const ws = getWeekStart(date);
                  setWeekStart(ws);
                  setCalMonth(new Date(ws.getFullYear(), ws.getMonth(), 1));
                  setIsCalendarOpen(false);
                }}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Week days ──────────────────────────────
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // ── Render ─────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <Text block size={700} weight="bold" style={{ color: "#0f172a", letterSpacing: "-0.5px", padding: "10px 0" }}>
            Attendance Log
          </Text>
          {/* <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            {activeTab === "myHistory" ? "Weekly breakdown of your check-in and check-out records"
              : activeTab === "teamHistory" ? "View Attendance Log for your team members"
                : "Organisation-wide Attendance Log — filter by department"}
          </Text> */}
        </div>
        {/* Tab strip — shown for managers and/or admins */}
        {(isManager || isAdmin) && (
          <div className={styles.pageTabStrip}>
            <button className={`${styles.pageTab} ${activeTab === "myHistory" ? styles.pageTabActive : ""}`} onClick={() => setActiveTab("myHistory")}>My Attendance</button>
            {isManager && <button className={`${styles.pageTab} ${activeTab === "teamHistory" ? styles.pageTabActive : ""}`} onClick={() => setActiveTab("teamHistory")}>Team Attendance</button>}
            {isAdmin && <button className={`${styles.pageTab} ${activeTab === "adminView" ? styles.pageTabActive : ""}`} onClick={() => setActiveTab("adminView")}>Admin View</button>}
          </div>
        )}
        {/* {userData?.ShiftName && activeTab === "myHistory" && (
          <div className={styles.shiftBadge}>
            <Clock24Regular style={{ fontSize: "16px" }} />
            {userData.ShiftName}
            {userData.StartTime && userData.EndTime && (
              <span style={{ fontWeight: 400, marginLeft: "4px", opacity: 0.8 }}>
                [{" "}
                {(() => {
                  const h = timeStrToHours(userData.StartTime);
                  if (!h) return "";
                  const hr = Math.floor(h); const mn = Math.round((h - hr) * 60);
                  return `${hr % 12 || 12}:${String(mn).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
                })()} –{" "}
                {(() => {
                  const h = timeStrToHours(userData.EndTime);
                  if (!h) return "";
                  const hr = Math.floor(h); const mn = Math.round((h - hr) * 60);
                  return `${hr % 12 || 12}:${String(mn).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
                })()}]
              </span>
            )}
          </div>
        )} */}
        {(
          <div style={{ visibility: activeTab === "myHistory" ? 'visible' : 'hidden' }} className={styles.viewToggle}>
            <button className={`${styles.toggleBtn} ${viewMode === "timeline" ? styles.toggleBtnActive : styles.toggleBtnInactive}`} onClick={() => setViewMode("timeline")}>
              <Timeline24Regular style={{ fontSize: "18px" }} />Timeline
            </button>
            <button className={`${styles.toggleBtn} ${viewMode === "calendar" ? styles.toggleBtnActive : styles.toggleBtnInactive}`} onClick={() => setViewMode("calendar")}>
              <CalendarMonth24Regular style={{ fontSize: "18px" }} />Calendar
            </button>
          </div>
        )

        }
      </div>

      {/* Team History tab */}
      {activeTab === "teamHistory" && currentUser?.userID && (
        <TeamHistoryPanel managerId={currentUser.userID} holidays={holidays} styles={styles} />
      )}

      {/* Admin View tab */}
      {activeTab === "adminView" && currentUser?.userID && (
        <AdminHistoryPanel adminId={currentUser.userID} holidays={holidays} styles={styles} />
      )}

      {/* My History — UI Content */}
      {activeTab === "myHistory" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {viewMode === "timeline" ? (
            <div className={styles.timelineContainer}>
              <div className={styles.timelineHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CalendarMonth24Regular style={{ color: tokens.colorNeutralForeground3 }} />
                  <Text weight="semibold" size={300}>Weekly Work Timeline</Text>
                </div>

                {/* Week navigator */}
                <div className={styles.weekNav}>
                  <button className={styles.navBtn} onClick={() => setWeekStart(d => addDays(d, -7))}>
                    <ChevronLeft24Regular style={{ fontSize: "16px" }} />
                  </button>
                  <div ref={calendarRef} style={{ position: "relative" }}>
                    <button
                      className={styles.weekLabelBtn}
                      onClick={() => setIsCalendarOpen(o => !o)}
                    >
                      {formatDateLabel(weekStart)} – {formatDateLabel(weekEnd)}
                    </button>
                    {isCalendarOpen && (
                      <div className={styles.calendarDropdown}>
                        {renderCalendar()}
                      </div>
                    )}
                  </div>
                  <button
                    className={styles.navBtn}
                    onClick={() => setWeekStart(d => addDays(d, 7))}
                    disabled={weekEnd >= today}
                    style={{ opacity: weekEnd >= today ? 0.4 : 1, cursor: weekEnd >= today ? "not-allowed" : "pointer" }}
                  >
                    <ChevronRight24Regular style={{ fontSize: "16px" }} />
                  </button>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <Badge appearance="outline" size="medium" style={{ padding: "4px 10px", height: "auto" }}>
                    {loading ? "Loading..." : `${weekDays.filter(d => {
                      const r = getRecord(d); return r && r.CheckIn;
                    }).length} of 7 days worked`}
                  </Badge>
                  {!loading && (
                    <button
                      style={{ fontSize: "12px", color: "#007ED5", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
                      onClick={() => { setWeekStart(getWeekStart(new Date())); setCalMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); }}
                    >
                      This Week
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
                  <Spinner label="Loading attendance..." />
                </div>
              ) : (
                <div className={styles.timelineScroll}>
                  <div className={styles.timelineInner}>
                    {/* Time axis */}
                    <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
                      <div style={{ minWidth: "110px", flexShrink: 0 }} />
                      <div style={{ flex: 1, position: "relative", height: "20px", paddingRight: "12px" }}>
                        {axisLabels.map(h => (
                          <span
                            key={h}
                            style={{
                              position: "absolute",
                              left: `${pct(h)}%`,
                              transform: "translateX(-50%)",
                              whiteSpace: "nowrap",
                              fontSize: "10px",
                              color: tokens.colorNeutralForeground4,
                              fontWeight: 600,
                              textTransform: "uppercase",
                            }}
                          >
                            {hourLabel(h)}
                          </span>
                        ))}
                      </div>
                      <div style={{ minWidth: "90px", paddingRight: "20px", flexShrink: 0 }} />
                    </div>

                    {/* Day rows */}
                    {weekDays.map(day => renderDayRow(day))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Calendar Header with navigation */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "transparent"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <CalendarMonth24Regular style={{ color: "#007ED5" }} />
                  <Text weight="bold" size={400}>Monthly Attendance Overview</Text>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <button
                    className={styles.navBtn}
                    onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  >
                    <ChevronLeft24Regular />
                  </button>
                  <Text weight="semibold" size={400} style={{ minWidth: "150px", textAlign: "center" }}>
                    {calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </Text>
                  <button
                    className={styles.navBtn}
                    onClick={() => setCalMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  >
                    <ChevronRight24Regular />
                  </button>
                </div>
              </div>

              <div style={{ maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
                <AttendanceCalendar
                  month={calMonth.getMonth()}
                  year={calMonth.getFullYear()}
                  attendanceData={getCalendarData()}
                  isCompact={true}
                  onDateClick={openDrawer}
                />
              </div>
            </div>
          )}

          {/* Legend */}
          { 
            viewMode === "timeline" &&
            <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div style={{ width: "2px", height: "14px", borderLeft: "2px dashed #3B82F6", display: "inline-block" }} />
              Current time
            </div>
            {[
              
              { color: "#6366F1", label: "Present", gradient: "linear-gradient(90deg, #6366F1, #38BDF8)" },
              { color: "#F59E0B", label: "Weekend / Pending Leave", gradient: "linear-gradient(90deg, #F59E0B, #D97706)" },
              { color: "#8B5CF6", label: "Approved Leave", gradient: "linear-gradient(90deg, #8B5CF6, #6366F1)" },
              { color: "#0EA5E9", label: "Approved Permission", gradient: "linear-gradient(90deg, #0EA5E9, #38BDF8)" },
              { color: "#10B981", label: "Holiday" },
              { color: "#EF4444", label: "Absent" },
              { color: "#E2E8F0", label: "Future" },
            ].map(({ color, label, gradient }) => (
              <div key={label} className={styles.legendItem}>
                <div
                  className={styles.legendDot}
                  style={gradient
                    ? { background: gradient, width: "24px", height: "4px", borderRadius: "4px" }
                    : { backgroundColor: color }}
                />
                {label}
              </div>
            ))}
            
          </div>
          }
          
        </div>
      )}

      {/* ── Day Detail Drawer ─────────────────── */}
      {drawerDay && (() => {
        const ymd = toYMD(drawerDay);
        const isHoliday = holidaySet.has(ymd);
        const allDrawerRecs = getRecords(drawerDay);
        const record = allDrawerRecs[0] ?? undefined;
        const lastRecord = allDrawerRecs[allDrawerRecs.length - 1] ?? undefined;
        const normalizeDBDate = (s: string) => s.includes("T") ? s.split("T")[0] : s;
        const leaveToday = leaveHistory.find(l => ymd >= normalizeDBDate(l.Start_Date) && ymd <= normalizeDBDate(l.End_Date));
        const holidayName = getHolidayName(ymd);
        const isWeekend = isWeekoffDay(drawerDay, ymd, weekOffConfigs);
        const isFuture = drawerDay > today;

        // Status — uses all sessions
        let status = "absent";
        if (isHoliday) status = "holiday";
        else if (allDrawerRecs.some(r => r.CheckIn)) status = (lastRecord?.CheckIn && !lastRecord?.CheckOut) ? "active" : "present";
        else if (leaveToday) status = leaveToday.ApprovalStatus === "Approved" ? "approved_leave" : "pending_leave";
        else if (isWeekend) status = "weekend";
        else if (isFuture) status = "future";
        // No record before the data-collection start date → show "No data" instead of "Absent".
        if (status === "absent" && isBeforeDataStart(ymd)) status = "nodata";

        const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
          present: { label: "Present", color: "#059669", bg: "#ecfdf5", icon: <CheckmarkCircle20Filled style={{ color: "#059669" }} /> },
          active: { label: "Checked In", color: "#6366f1", bg: "#eff0ff", icon: <Clock20Regular style={{ color: "#6366f1" }} /> },
          absent: { label: "Absent", color: "#dc2626", bg: "#fff1f2", icon: <CalendarCancel20Regular style={{ color: "#dc2626" }} /> },
          holiday: { label: "Holiday", color: "#047857", bg: "#ecfdf5", icon: <CalendarCheckmark20Regular style={{ color: "#047857" }} /> },
          approved_leave: { label: "Approved Leave", color: "#7c3aed", bg: "#f5f3ff", icon: <CalendarCheckmark20Regular style={{ color: "#7c3aed" }} /> },
          pending_leave: { label: "Pending Leave", color: "#b45309", bg: "#fffbeb", icon: <CalendarCancel20Regular style={{ color: "#b45309" }} /> },
          weekend: { label: "Weekend", color: "#d97706", bg: "#fffbeb", icon: <WeatherMoon20Regular style={{ color: "#d97706" }} /> },
          future: { label: "Upcoming", color: "#6b7280", bg: "#f9fafb", icon: <CalendarMonth24Regular style={{ color: "#6b7280" }} /> },
          nodata: { label: "No Record", color: "#6b7280", bg: "#f9fafb", icon: <CalendarMonth24Regular style={{ color: "#6b7280" }} /> },
        };
        const meta = STATUS_META[status] ?? STATUS_META.absent;

        // Total duration across all sessions
        const totalDrawerDurMins = allDrawerRecs.reduce((sum, r) => {
          const d = r.DurationMinutes ?? null;
          return sum + (d !== null && d <= 24 * 60 ? d : 0);
        }, 0) || null;

        // Week Summary Calculations for Weekend Card
        const { monday, sunday } = getWeekRange(drawerDay);
        let totalMinutes = 0;
        let daysWorked = 0;
        let daysOff = 0;

        for (let i = 0; i < 5; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          const recs = getRecords(d);
          if (recs.some(r => r.CheckIn)) {
            daysWorked++;
            const lastRec = recs[recs.length - 1];
            const isDayActive = !!(lastRec?.CheckIn && !lastRec?.CheckOut);
            let dayRawMins = 0;
            recs.forEach(r => {
              const hasSentinelCheckout = r.CheckOut?.startsWith("1900-01-01");
              // Overnight / sentinel checkouts: recompute — the backend DurationMinutes is unreliable.
              const rawDur = hasSentinelCheckout || isOvernightSession(r.CheckIn, r.CheckOut)
                ? durationFromTimes(r.CheckIn, r.CheckOut)
                : (r.DurationMinutes ?? null);
              dayRawMins += (rawDur && rawDur <= 24 * 60) ? rawDur : 0;
            });
            totalMinutes += applyLunchDeduction(dayRawMins > 0 ? dayRawMins : null, isDayActive) ?? 0;
          }
        }
        for (let i = 5; i < 7; i++) {
          const d = new Date(monday);
          d.setDate(monday.getDate() + i);
          if (!getRecords(d).some(r => r.CheckIn)) {
            daysOff++;
          }
        }

        const weekSummary = {
          totalMinutes,
          daysWorked,
          daysOff,
          weekLabel: formatWeekLabel(monday, sunday)
        };

        return (
          <OverlayDrawer
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
                {drawerDay.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </DrawerHeaderTitle>
            </DrawerHeader>
            <DrawerBody style={{ padding: 0, overflow: "auto" }}>
              <AttendanceDayCard
                date={drawerDay}
                status={status as any}
                sessions={allDrawerRecs.map(r => {
                  const effOut = r.CheckOut ? effectiveCheckOut(r.CheckOut, r.ShiftEndTime) : null;
                  const isCapped = effOut !== null && effOut !== r.CheckOut;
                  // Overnight: session crosses midnight — recompute so duration isn't "--".
                  const rawDur: any = isCapped || isOvernightSession(r.CheckIn, r.CheckOut)
                    ? effectiveDurationMins(r.CheckIn, r.CheckOut, r.ShiftEndTime)
                    : (r.DurationMinutes ?? effectiveDurationMins(r.CheckIn, r.CheckOut, r.ShiftEndTime));
                  const isSingleSession = allDrawerRecs.length === 1;
                  if (isSingleSession) {
                    const afterLunchDur = applyLunchDeduction(rawDur, !r.CheckOut);
                    const drawerWorkStartH = timeStrToHours(r.CheckIn);
                    const drawerWorkEndH = r.CheckOut
                      ? timeStrToHours(effectiveCheckOut(r.CheckOut, r.ShiftEndTime))
                      : shiftEndH;
                    const drawerPermMins = getOverlappingPermissionMins(ymd, permissionHistory, drawerWorkStartH, drawerWorkEndH);
                    return {
                      checkIn: r.CheckIn || undefined,
                      checkOut: effOut || undefined,
                      durationMinutes: applyPermissionDeduction(afterLunchDur, drawerPermMins, !r.CheckOut),
                      workLocationType: r.WorkLocationType || undefined,
                      violationType: r.ViolationType || undefined,
                    };
                  }
                  return {
                    checkIn: r.CheckIn || undefined,
                    checkOut: effOut || undefined,
                    durationMinutes: rawDur,
                    workLocationType: r.WorkLocationType || undefined,
                    violationType: r.ViolationType || undefined,
                  };
                })}
                permissions={(() => {
                  const firstRec = allDrawerRecs[0];
                  const lastRec2 = allDrawerRecs[allDrawerRecs.length - 1];
                  const cardWorkStartH = firstRec ? timeStrToHours(firstRec.CheckIn) : null;
                  const cardWorkEndH = lastRec2?.CheckOut
                    ? timeStrToHours(effectiveCheckOut(lastRec2.CheckOut, lastRec2.ShiftEndTime))
                    : shiftEndH;
                  return permissionHistory
                    .filter(p => {
                      const pDate = p.Date.includes("T") ? p.Date.split("T")[0] : p.Date;
                      return pDate === ymd && p.ApprovalStatus === "Approved";
                    })
                    .map(p => {
                      const startH = timeStrToHours(p.StartTime);
                      const endH = timeStrToHours(p.EndTime);
                      const fullMins = (startH !== null && endH !== null) ? Math.max(0, Math.round((endH - startH) * 60)) : 0;
                      const effectiveMins = permissionOverlapMins(p, cardWorkStartH, cardWorkEndH);
                      return { startTime: p.StartTime, endTime: p.EndTime, reason: p.Reason, durationMinutes: fullMins, effectiveMinutes: effectiveMins };
                    });
                })()}
                leaveTypeName={leaveToday?.LeaveName}
                leaveStart={leaveToday?.Start_Date}
                leaveEnd={leaveToday?.End_Date}
                leaveAppliedOn={leaveToday?.CreatedOn}
                leaveApprovalStatus={leaveToday?.ApprovalStatus}
                holidayName={holidayName}
                shiftStart={userData?.StartTime || undefined}
                shiftEnd={userData?.EndTime || undefined}
                weekSummary={weekSummary}
                onFixAttendance={() => navigate('/Attendance/MyRequests?tab=regularization&action=create')}
              />
            </DrawerBody>
          </OverlayDrawer>
        );
      })()}
    </div>
  );
};

export default AttendanceHistory;
