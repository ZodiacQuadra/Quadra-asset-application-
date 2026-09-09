import React, { useState, useEffect, useCallback, useMemo } from "react";
import { displayLeaveLabel } from "../Utils/leaveUtils";
import {
  Text,
  Button,
  makeStyles,
  tokens,
  Toast,
  ToastTitle,
  ToastBody,
  Toaster,
  useToastController,
  useId,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogTrigger,
  Radio,
  Badge,
  mergeClasses,
  Field,
  Textarea,
  Input,
  Spinner,
} from "@fluentui/react-components";
import {
  Clock24Regular,
  History24Regular,
  Location24Filled,
  DocumentText24Regular,
  BuildingCheckmarkFilled,
  Warning24Filled,
  CheckmarkCircle24Filled,
  CheckmarkCircle48Filled,
  QuestionCircle24Filled,
  DismissRegular,
  DocumentAdd24Regular,
  CalendarEdit24Regular,
  Location20Regular,
  ArrowExit20Regular,
} from "@fluentui/react-icons";
import {
  CheckCircle2,
  AlertTriangle,
  Trophy,
  TrendingDown,
  Lightbulb,
  AlertCircle,
  Hourglass,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../Auth/AuthProvider";
import { getEntraUserById, EntraADUser } from "../../Services/EntraADUserService";
import CustomStatsCard from "../../Recruit/Components/CustomStatsCard";
import { checkIn, checkOut, getAttendanceHistory, getPermissionHistory, createPermissionRequest, getTodayPermissionStatus, PermissionRequest, getAttendanceSummary, AttendanceSummary, AttendanceRecord } from "../Services/AttendanceService";
import { getLocation, formatCoordinates, reverseGeocode } from "../../Services/GeoLocationService";
import { calculateDistance, parseCoordinates } from "../../Services/GeoUtils";
import AttendanceCalendar from "../Components/AttendanceCalendar";
import { getHolidaysByYear, Holiday } from "../../Services/HolidayService";
import { submitLeaveRequest, getLeaveHistory, LeaveRequestRecord, getLeaveBalances, LeaveBalance, withdrawLeaveRequest } from "../../Services/LeaveRequestService";
import { useNavigate } from "react-router-dom";
import { useConfigurations } from "../../Context/ConfigurationsContext";
import { getCached, setCached, invalidate, cacheKeys, CACHE_TTL } from "../Utils/attendanceCache";
import { isEarlyCheckout as evaluateEarlyCheckout } from "../Utils/shift";

// This is just a scratchpad for building the JSX and styles

const useStyles = makeStyles({
  dashboardRoot: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    padding: "24px",
    minHeight: "100vh",
    paddingTop: '0',
    backgroundColor: "transparent",
    boxSizing: "border-box",
    "@media (max-width: 1100px)": {
      padding: "16px",
    }
  },
  dashboardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "20px",
    "@media (max-width: 768px)": {
      flexDirection: "column",
      alignItems: "flex-start",
      gap: "12px",
    }
  },
  greetingTitle: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-1px",
    lineHeight: "1.15",
    "@media (max-width: 600px)": {
      fontSize: "24px",
    }
  },
  greetingSubtitle: {
    fontSize: "14px",
    color: "#475569",
    marginTop: "6px",
    display: "block",
    "@media (max-width: 600px)": {
      fontSize: "12px",
    }
  },
  contentWrapper: {
    display: "flex",
    gap: "24px",
    width: "100%",
    "@media (max-width: 1100px)": {
      flexDirection: "column",
    }
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    minWidth: 0,
  },
  rightPanel: {
    width: "340px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    "@media (max-width: 1100px)": {
      width: "100%",
    }
  },
  greetingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "4px"
  },
  heroStatusPill: {
    backgroundColor: "transparent",
    padding: "6px 16px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
    fontSize: "12px",
    fontWeight: 600,
    "@media (max-width: 600px)": {
      padding: "4px 12px",
      fontSize: "11px",
      marginBottom: "8px",
    }
  },
  heroClock: {
    fontSize: "56px",
    fontWeight: 800,
    color: "#1e293b",
    lineHeight: 1.1,
    letterSpacing: "-1px",
    marginBottom: "4px",
    "@media (max-width: 600px)": {
      fontSize: "36px",
    }
  },
  heroDate: {
    color: "#334155",
    fontSize: "14px",
    fontWeight: 500,
    marginBottom: "16px",
  },
  heroShiftBadge: {
    backgroundColor: "transparent",
    padding: "6px 16px",
    borderRadius: "20px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    fontWeight: 500,
    color: "#334155",
    marginBottom: "24px",
  },
  checkInBtn: {
    backgroundColor: "#22c55e",
    color: "white",
    borderRadius: "24px",
    padding: "0 40px",
    height: "48px",
    fontSize: "16px",
    fontWeight: 600,
    border: "none",
    boxShadow: "0 4px 12px rgba(34, 197, 94, 0.3)",
    transition: "transform 0.2s, box-shadow 0.2s",
    ":hover": {
      backgroundColor: "#16a34a",
      transform: "translateY(-1px)",
      color: 'white',
      boxShadow: "0 6px 16px rgba(34, 197, 94, 0.4)",
    },
    ":disabled": {
      backgroundColor: "#94a3b8",
      boxShadow: "none",
      transform: "none",
    },
    "@media (max-width: 600px)": {
      padding: "0 24px",
      height: "44px",
      fontSize: "14px",
      width: "100%",
    }
  },
  checkoutBtn: {
    backgroundColor: "#ef4444",
    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
    ":hover": {
      backgroundColor: "#dc2626",
      boxShadow: "0 6px 16px rgba(239, 68, 68, 0.4)",
    }
  },
  checkoutPendingBtn: {
    backgroundColor: "#eab308 !important", // Yellow
    color: "#000 !important",
    boxShadow: "0 4px 12px rgba(234, 179, 8, 0.3) !important",
    opacity: "1 !important",
    ":hover": {
      backgroundColor: "#ca8a04 !important",
    }
  },
  geofenceMsg: {
    marginTop: "16px",
    fontSize: "12px",
    fontWeight: 500,
    color: "#475569",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
    border: "1px solid rgba(0,0,0,0.05)",
  },
  leaveItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "20px",
    ":last-child": { marginBottom: 0 }
  },
  leaveHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leaveName: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#1e293b",
  },
  leaveCount: {
    fontSize: "14px",
    fontWeight: "700",
  },
  leaveBarTrack: {
    height: "10px",
    width: "100%",
    backgroundColor: "#e2e8f0",
    borderRadius: "10px",
    overflow: "hidden",
  },
  leaveBarFill: {
    height: "100%",
    borderRadius: "10px",
    transition: "width 1s ease-out",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
  },
  cardTitle: {
    fontSize: "16px",
    fontWeight: 700,
    color: "#1e293b",
  },
  linkText: {
    color: "#3b82f6",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    textDecoration: "none",
    ":hover": {
      textDecoration: "underline",
    }
  },
  timelineRow: {
    display: "flex",
    justifyContent: "space-between",
    position: "relative",
    paddingTop: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #f1f5f9",
    marginBottom: "12px",
  },
  timelineLine: {
    position: "absolute",
    top: "28px",
    left: "20px",
    right: "20px",
    height: "2px",
    backgroundColor: "#e2e8f0",
    zIndex: 1,
  },
  timelineNode: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    zIndex: 2,
    background: "white",
    padding: "0 8px",
  },
  timelineDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: "#cbd5e1",
    marginBottom: "8px",
  },
  timelineDotActive: {
    backgroundColor: "#3b82f6",
    boxShadow: "0 0 0 4px rgba(59, 130, 246, 0.2)",
  },
  timelineTime: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#1e293b",
  },
  timelineLabel: {
    fontSize: "10px",
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: 600,
    position: "absolute",
    top: "-20px",
    whiteSpace: "nowrap",
  },
  timelineInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    "@media (max-width: 600px)": {
      gridTemplateColumns: "1fr",
      gap: "8px"
    }
  },

  timelineInfoGrid2Col: {
    display: "grid",
    gridTemplateColumns: "1fr 200px",
    gap: "12px",
    "@media (max-width: 600px)": {
      gridTemplateColumns: "1fr",
      gap: "8px"
    }
  },
  infoChip: {
    backgroundColor: "#f8fafc",
    padding: "12px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  dayChipsContainer: {
    display: "flex",
    gap: "8px",
    justifyContent: "space-between",
    marginBottom: "16px",
    overflowX: "auto",
    paddingBottom: "4px",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    "::-webkit-scrollbar": {
      display: "none"
    }
  },
  dayChipBox: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "12px 0",
    borderRadius: "12px",
    color: "white",
    "@media (max-width: 600px)": {
      minWidth: "42px",
      flexShrink: 0
    }
  },
  dayChipDay: { fontSize: "11px", fontWeight: 700, textTransform: "uppercase" },
  dayChipDate: { fontSize: "20px", fontWeight: 800 },
  legendRow: {
    display: "flex",
    gap: "16px",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  legendItem: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: 600,
    color: "#64748b",
  },
  legendDot: { width: "8px", height: "8px", borderRadius: "2px" },
  quickActionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    "@media (max-width: 600px)": {
      gridTemplateColumns: "repeat(2, 1fr)",
    }
  },
  quickActionBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    backgroundColor: "white",
    color: "#1e293b",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "border-color 0.2s, background-color 0.2s",
    ":hover": {
      border: "1px solid #cbd5e1",
      backgroundColor: "#f8fafc",
    }
  },
  requestRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #f1f5f9",
    ":last-child": { borderBottom: "none", paddingBottom: 0 }
  },
  requestIcon: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "12px",
    marginRight: "12px",
    flexShrink: 0,
  },
  requestDetails: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  requestTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "2px",
  },
  requestName: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#1e293b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  requestSub: {
    fontSize: "11px",
    color: "#64748b",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  overviewGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "12px",
    marginBottom: "16px",
  },
  overviewTile: {
    flex: 1,
    padding: "16px",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    transition: "all 0.2s ease",
    cursor: "default",
    ":hover": {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 16px rgba(0,0,0,0.06)",
    }
  },
  tileBigNum: {
    fontSize: "36px",
    fontWeight: "800",
    lineHeight: "1",
    marginBottom: "8px",
  },
  tileLabel: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#64748b",
    lineHeight: "1.2",
    marginBottom: "12px",
    minHeight: "32px",
  },
  tileMiniBarTrack: {
    height: "6px",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "8px",
  },
  tileMiniBarFill: {
    height: "100%",
    borderRadius: "10px",
    transition: "width 1s ease-out",
  },
  tileFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "11px",
    fontWeight: "700",
  },
  overviewTileLabel: {
    fontSize: "12px",
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: "16px",
  },
  overviewTileTop: {
    display: "flex",
    alignItems: "baseline",
    gap: "6px",
  },
  overviewTileNum: {
    fontSize: "36px",
    fontWeight: "800",
    lineHeight: "1",
  },
  overviewTileUnit: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
  },
  overviewTileSub: {
    fontSize: "11px",
    fontWeight: "600",
    marginTop: "12px",
  },
  insightBox: {
    display: "flex",
    gap: "12px",
    padding: "16px",
    borderRadius: "16px",
    marginBottom: "12px",
    fontSize: "12px",
    color: "#334155",
    lineHeight: "1.5",
    border: "1px solid rgba(0,0,0,0.02)",
    ":last-child": { marginBottom: 0 }
  },
  insightIcon: {
    width: "28px",
    height: "28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    backgroundColor: "white",
    flexShrink: 0,
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    fontSize: "16px",
  },
  quickLinkChip: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    fontSize: "12px",
    fontWeight: 500,
    color: "#1e293b",
    marginRight: "8px",
    marginBottom: "8px",
    cursor: "pointer",
    ":hover": { backgroundColor: "#f8fafc" }
  },
  // Reusing some classes for the Dialogs from previous implementation
  drawerBody: {
    padding: "0",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    height: "100%",
  },
  drawerFormSection: {
    padding: "16px 24px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    flexShrink: 0,
  },
  drawerScrollSection: {
    flex: 1,
    overflowY: "auto",
    padding: "16px 24px",
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  submitButton: {
    marginTop: "16px",
    height: "44px",
    fontWeight: "bold",
    borderRadius: "8px",
  },
  warningBox: {
    backgroundColor: "#FEF2F2",
    border: "1px solid #FCA5A5",
    padding: "12px 16px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },
  warningText: {
    fontSize: "13px",
    color: "#991B1B",
    lineHeight: "1.4",
  },
  locationDisplayBox: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  detectedCoordsText: {
    wordBreak: 'break-all',
  },
  geofenceStatus: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    fontWeight: "bold",
    marginTop: "8px"
  },
  timelineProgressWrapper: {
    position: "relative",
    width: "100%",
    height: "10px",
    backgroundColor: "#f1f5f9",
    borderRadius: "5px",
    margin: "12px 0 24px 0",
    overflow: "hidden",
  },
  timelineProgressPseudo: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    backgroundColor: "#e2e8f0",
    transition: "width 0.3s ease",
  },
  timelineProgressActive: {
    position: "absolute",
    left: 0,
    top: 0,
    height: "100%",
    backgroundColor: "#3b82f6",
    transition: "width 0.3s ease",
    zIndex: 2,
  },
  timelineLabelsTop: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "4px",
  },
  timelineTimeLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#94a3b8",
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: 700,
    textTransform: "uppercase",
    marginTop: "4px",
  },
  statusOnTime: {
    backgroundColor: "#ecfdf5",
    color: "#059669",
  },
  statusLate: {
    backgroundColor: "#fffbeb",
    color: "#d97706",
  },
  statusEarly: {
    backgroundColor: "#fef2f2",
    color: "#dc2626",
  },
  statusEarlyIn: {
    backgroundColor: "#e0f2fe",
    color: "#0284c7",
  },
  rippleBox: {
    height: "180px",
    width: "100%",
    backgroundColor: "#EFF6FF",
    borderRadius: "16px",
    position: "relative",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid #DBEAFE",
    marginTop: "16px",
  },
  rippleOuter: {
    position: "absolute",
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    border: "1px solid #2563EB",
    animationName: {
      "0%": { transform: "scale(1)", opacity: 0.8 },
      "100%": { transform: "scale(8)", opacity: 0 },
    },
    animationDuration: "2.5s",
    animationIterationCount: "infinite",
    animationTimingFunction: "cubic-bezier(0, 0.2, 0.8, 1)",
  },
  rippleCenter: {
    width: "24px",
    height: "24px",
    backgroundColor: "#2563EB",
    borderRadius: "50%",
    zIndex: 2,
    boxShadow: "0 0 20px rgba(37, 99, 235, 0.4)",
    animationName: {
      "0%": { transform: "scale(1)" },
      "50%": { transform: "scale(1.1)" },
      "100%": { transform: "scale(1)" },
    },
    animationDuration: "2s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
  },
  floatingPill: {
    position: "absolute",
    backgroundColor: "white",
    padding: "4px 12px",
    borderRadius: "20px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    fontSize: "11px",
    fontWeight: "600",
    color: "#1E40AF",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    zIndex: 3,
  },
  heroCard: {
    width: "100%",
    background: "#FFFF",
    borderRadius: "28px",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: "16px",
    position: "relative",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.8)",
    overflow: "hidden",
    "@media (max-width: 600px)": {
      padding: "24px 16px",
      borderRadius: "20px",
      gap: "12px",
    }
  },
  
  heroSubtitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
  },
  heroBadgeWhite: {
    padding: "8px 20px",
    borderRadius: "20px",
    backgroundColor: "white",
    border: "1.5px solid #e2e8f0",
    fontSize: "12px",
    fontWeight: "700",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginTop: "8px",
    "@media (max-width: 600px)": {
      padding: "6px 12px",
      fontSize: "11px",
      gap: "6px",
    }
  },
  heroSubtextWarning: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#d97706",
    marginTop: "8px",
  },
  heroSubtextInfo: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#94a3b8",
    marginTop: "8px",
  },
  heroSuccessBar: {
    width: "100%",
    padding: "16px",
    borderRadius: "16px",
    backgroundColor: "#22c55e",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontSize: "14px",
    fontWeight: "800",
    marginTop: "20px",
    boxShadow: "0 10px 20px -5px rgba(34, 197, 94, 0.3)",
  },
  radioCard: {
    border: "1.5px solid #E2E8F0",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    cursor: "pointer",
    // transition: "all 0.2s ease",
    ":hover": {
      borderTopColor: "#3B82F6",
      borderRightColor: "#3B82F6",
      borderBottomColor: "#3B82F6",
      borderLeftColor: "#3B82F6",
      backgroundColor: "#F8FAFC",
    }
  },
  radioCardSelected: {
    borderTopColor: "#3B82F6",
      borderRightColor: "#3B82F6",
      borderBottomColor: "#3B82F6",
      borderLeftColor: "#3B82F6",
    backgroundColor: "#EFF6FF",
    boxShadow: "0 0 0 1px #2563EB",
  },
  dotsContainer: {
    display: "flex",
    gap: "4px",
    justifyContent: "center",
    marginTop: "24px",
  },
  dot: {
    width: "6px",
    height: "6px",
    backgroundColor: "#2563EB",
    borderRadius: "50%",
    animationName: {
      "0%": { opacity: 0.3, transform: "scale(0.8)" },
      "50%": { opacity: 1, transform: "scale(1.2)" },
      "100%": { opacity: 0.3, transform: "scale(0.8)" },
    },
    animationDuration: "1s",
    animationIterationCount: "infinite",
  }
});


const getAvailableMonths = () => {
  const months = [];
  const date = new Date();
  // Generate last 12 months + current
  for (let i = 0; i < 15; i++) {
    const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
    months.push({
      month: d.getMonth(),
      year: d.getFullYear(),
      label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    });
  }
  return months;
};

const AVAILABLE_MONTHS = getAvailableMonths();

const AttendanceDashboard: React.FC<{isGreetingVisible:boolean}> = (props:{isGreetingVisible:boolean}) => {
  const navigate = useNavigate();
  const styles = useStyles();
  const { currentUser, accessToken, refreshToken, logout } = useAuth();
  const { holidays, shifts, leavePolicies, locations, attendanceConfigs } = useConfigurations();
  const maxGeofenceMeters = useMemo(
    () => parseInt(attendanceConfigs.find(c => c.ConfigurationKey === 'MAX_GEO')?.Value ?? '100'),
    [attendanceConfigs]
  );
  const [userData, setUserData] = useState<EntraADUser | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckInLoading, setIsCheckInLoading] = useState(false);
  const [activeRecord, setActiveRecord] = useState<any>(null);
  // Latest attendance record (checked-in or completed). Kept in state so that
  // "Shift Completed" can be derived at render time and re-evaluate as the clock ticks.
  const [latestRecord, setLatestRecord] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isEarlyCheckoutDialogOpen, setIsEarlyCheckoutDialogOpen] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Modal States
  const [selectedWorkLocation, setSelectedWorkLocation] = useState<string>("");
  const [detectedCoords, setDetectedCoords] = useState<string | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [detectedAccuracy, setDetectedAccuracy] = useState<number | null>(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean | null>(null);
  // 'select_type' → user picks work type; 'locating' → GPS running (Office path); 'geofence_result' → show result / confirmation
  const [checkInPhase, setCheckInPhase] = useState<'select_type' | 'locating' | 'geofence_result'>('select_type');
  const [checkInOnBehalf, setCheckInOnBehalf] = useState<string>("self");

  // Permission States
  const [isPermissionDrawerOpen, setIsPermissionDrawerOpen] = useState(false);
  const [permissionReason, setPermissionReason] = useState("");
  const [permissionDate, setPermissionDate] = useState("");


  const [permissionStartTime, setPermissionStartTime] = useState("");
  const [permissionEndTime, setPermissionEndTime] = useState("");
  const [permissionHistory, setPermissionHistory] = useState<PermissionRequest[]>([]);
  const [isSubmittingPermission, setIsSubmittingPermission] = useState(false);
  const [isEarlyCheckout, setIsEarlyCheckoutState] = useState(false);
  const [hasApprovedPermission, setHasApprovedPermission] = useState(false);
  const [allYearHolidays, setAllYearHolidays] = useState<Holiday[]>([]);

  // Leave States
  const [isLeaveDrawerOpen, setIsLeaveDrawerOpen] = useState(false);
  const [leaveName, setLeaveName] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const [calculatedLeaveDays, setCalculatedLeaveDays] = useState(0);
  const [leaveHistory, setLeaveHistory] = useState<LeaveRequestRecord[]>([]);
  const [liveLeaveBalances, setLiveLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveBalancesLoading, setLeaveBalancesLoading] = useState(true);
  const [checkInConflict, setCheckInConflict] = useState<{ type: 'Holiday' | 'Leave', name?: string } | null>(null);
  const [withdrawConfirmId, setWithdrawConfirmId] = useState<string | null>(null);

  // ── Weekend check-in state ────────────────────────────────────────────────
  const [isWeekendDialogOpen, setIsWeekendDialogOpen] = useState(false);
  const [weekendCheckinReason, setWeekendCheckinReason] = useState("");


  // Late checkin reason
  const [IsLateCheckinDialogOpen,setIsLateCheckinDialogOpen] = useState(false)
  const [lateCheckinReason,setLateCheckingReason] = useState("")
  const [pendingWeekendOverride, setPendingWeekendOverride] = useState<{ isWeekend: boolean; weekendReason: string } | undefined>(undefined);
  const [pendingLateOverride, setPendingLateOverride] = useState<{ isLate: boolean; lateCheckinReason: string } | undefined>(undefined);


  // Early checkout
  const [earlyCheckoutReason,setEarlyCheckOutReason] = useState("")
  // Approved 2nd-half leave covering today — waives the early checkout reason
  const [halfDayLeaveToday, setHalfDayLeaveToday] = useState<LeaveRequestRecord | null>(null);

  






  const handleEarlyCheckoutReasonChange=(value:string)=>{
    if(earlyCheckoutReason.length<200){
      setEarlyCheckOutReason(value)
    }
  }


  const handleEarlyCheckoutDialogClose=()=>{
    setIsEarlyCheckoutDialogOpen(false)
    setEarlyCheckOutReason("")
  }


  useEffect(() => {
    if (currentUser?.userID) {
      getLeaveHistory(currentUser.userID).then(res => {
        if (res.success && res.data) {
          setLeaveHistory(res.data);
        }
      });
      setLeaveBalancesLoading(true);
      getLeaveBalances(currentUser.userID).then(res => {
        if (res.success && res.data) {
          setLiveLeaveBalances(res.data);
        }
        setLeaveBalancesLoading(false);
      });
    }
  }, [currentUser?.userID]);

  const calculateLeaveDays = useCallback(() => {
    if (!leaveStartDate || !leaveEndDate) return 0;
    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    if (end < start) return 0;

    let totalDays = 0;
    const is24x7 = userData?.User_24_7 === true;
    const holidaySet = new Set(allYearHolidays.map(h => {
      // Safe mapping to standard YYYY-MM-DD
      const dateObj = new Date(h.HolidayDate);
      return dateObj.toISOString().split('T')[0];
    }));

    let currentDate = new Date(start);
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      const dateStr = currentDate.toISOString().split('T')[0];
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidaySet.has(dateStr);

      if (is24x7) {
        if (!isHoliday) totalDays++;
      } else {
        if (!isWeekend && (!isHoliday)) totalDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return totalDays;
  }, [leaveStartDate, leaveEndDate, userData?.User_24_7, allYearHolidays]);

  const isDateInvalidForUser = useCallback((dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = allYearHolidays.some(h => new Date(h.HolidayDate).toISOString().split('T')[0] === dateStr);

    if (userData?.User_24_7 === true) {
      return isHoliday;
    }
    return isWeekend || isHoliday;
  }, [allYearHolidays, userData?.User_24_7]);

  const dateBoundariesInvalid = isDateInvalidForUser(leaveStartDate) || isDateInvalidForUser(leaveEndDate);

  useEffect(() => {
    setCalculatedLeaveDays(calculateLeaveDays());
  }, [calculateLeaveDays]);

  const handleSubmitLeave = async () => {
    if (!currentUser?.userID || !userData) {
      dispatchToast(<Toast><ToastTitle>Error</ToastTitle><ToastBody>User data not found</ToastBody></Toast>, { intent: "error" });
      return;
    }
    if (!leaveName || !leaveStartDate || !leaveEndDate) {
      dispatchToast(<Toast><ToastTitle>Validation</ToastTitle><ToastBody>Please fill all required fields.</ToastBody></Toast>, { intent: "error" });
      return;
    }
    const days = calculateLeaveDays();
    // Frontend validation only checks for basic completion; 
    // internal business rules (holidays/weekends) are now enforced by the backend.

    // Check overlap with APPROVED requests
    const hasApprovedOverlap = leaveHistory.some(req => {
      if (req.ApprovalStatus !== "Approved") return false;
      const existingStart = new Date(req.Start_Date).setHours(0, 0, 0, 0);
      const existingEnd = new Date(req.End_Date).setHours(23, 59, 59, 999);
      const requestedStart = new Date(leaveStartDate).setHours(0, 0, 0, 0);
      const requestedEnd = new Date(leaveEndDate).setHours(23, 59, 59, 999);
      return (requestedStart <= existingEnd && requestedEnd >= existingStart);
    });

    if (hasApprovedOverlap) {
      dispatchToast(
        <Toast>
          <ToastTitle>Validation Error</ToastTitle>
          <ToastBody>You already have an approved leave that overlaps with these dates. Please check your leave history.</ToastBody>
        </Toast>,
        { intent: "error" }
      );
      return;
    }

    // Check overlap with PENDING requests
    const hasPendingOverlap = leaveHistory.some(req => {
      if (req.ApprovalStatus !== "Pending") return false;
      const existingStart = new Date(req.Start_Date).setHours(0, 0, 0, 0);
      const existingEnd = new Date(req.End_Date).setHours(23, 59, 59, 999);
      const requestedStart = new Date(leaveStartDate).setHours(0, 0, 0, 0);
      const requestedEnd = new Date(leaveEndDate).setHours(23, 59, 59, 999);
      return (requestedStart <= existingEnd && requestedEnd >= existingStart);
    });

    if (hasPendingOverlap) {
      dispatchToast(
        <Toast>
          <ToastTitle>Validation Error</ToastTitle>
          <ToastBody>You already have a pending leave request for these dates. Please wait for it to be reviewed.</ToastBody>
        </Toast>,
        { intent: "warning" }
      );
      return;
    }
    try {
      setIsSubmittingLeave(true);
      const res = await submitLeaveRequest({
        RequestorID: currentUser.userID,
        RequestorName: userData.DisplayName,
        Start_Date: leaveStartDate,
        End_Date: leaveEndDate,
        LeaveNameType: leaveName, // Dropdown now maps ID into leaveName state
        Reason: leaveReason,
        ManagerID: userData.ManagerID || undefined,
        ManagerName: userData.ManagerDisplayName || undefined,
        ManagerEmail: userData.ManagerEmail || undefined
      }, currentUser.userID);

      if (res.success) {
        dispatchToast(<Toast><ToastTitle>Success</ToastTitle><ToastBody>Leave request for {days} day(s) submitted for approval.</ToastBody></Toast>, { intent: "success" });
        setLeaveName("");
        setLeaveReason("");
        setLeaveStartDate("");
        setLeaveEndDate("");

        getLeaveHistory(currentUser.userID).then(historyRes => {
          if (historyRes.success && historyRes.data) {
            setLeaveHistory(historyRes.data);
          }
        });
      } else {
        dispatchToast(<Toast><ToastTitle>Error</ToastTitle><ToastBody>{res.message}</ToastBody></Toast>, { intent: "error" });
      }
    } catch (e: any) {
      dispatchToast(<Toast><ToastTitle>Error</ToastTitle><ToastBody>Failed to submit.</ToastBody></Toast>, { intent: "error" });
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  // Selection State
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summaryData, setSummaryData] = useState<AttendanceSummary | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [prevMonthHistory, setPrevMonthHistory] = useState<AttendanceRecord[]>([]);

  // ── Initial page-load gate ────────────────────────────────────────────────
  // Track completion of the core first-load fetchers so we can show a single
  // full-page loader until the dashboard's essential data is ready. These only
  // ever flip true→stay-true, so re-runs of the fetchers (e.g. month change)
  // are harmless. Leave loading is tracked separately via leaveBalancesLoading.
  const [statusLoaded, setStatusLoaded] = useState(false);
  const [monthLoaded, setMonthLoaded] = useState(false);
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  
  const toasterId = useId("attendance-toaster");
  const { dispatchToast } = useToastController(toasterId);
  const nav = useNavigate()

  useEffect(() => {
    const checkSession = async () => {
      if (!accessToken) return;
      try {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const expired = Date.now() > payload.exp * 1000;
        if (!expired) return;
      } catch {
        // Malformed token — treat as expired
      }
      const fresh = await refreshToken();
      if (!fresh) {
        logout();
        navigate("/");
      }
    };
    checkSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Concern-scoped fetchers ───────────────────────────────────────────────
  // The dashboard data is split into three independent fetchers, each keyed on
  // its REAL dependencies, so (a) nothing self-invalidates (the old single
  // callback both read and wrote allYearHolidays, causing a double-fetch), and
  // (b) changing the month picker only refetches that month's stats — not the
  // profile, checked-in status or holidays. Each is backed by a short-lived TTL
  // cache (see attendanceCache.ts) so returning to the tab within the window
  // fires zero backend calls. Pass `force: true` to bypass the cache after a
  // mutation.

  // 1a. User profile + checked-in status — depends only on the signed-in user.
  const fetchUserAndStatus = useCallback(async (force = false) => {
    const userId = currentUser?.userID;
    if (!userId) return;

    const applyStatus = (latest: any) => {
      if (latest) {
        const checkInTime = new Date(latest.CheckIn).getTime();
        const nowTime = new Date().getTime();
        const isRecent = (nowTime - checkInTime) < (24 * 60 * 60 * 1000);
        const isActive = !!(isRecent && latest.CheckIn && !latest.CheckOut);
        setIsCheckedIn(isActive);
        setActiveRecord(isActive ? latest : null);
        setLatestRecord(latest);
      } else {
        setIsCheckedIn(false);
        setActiveRecord(null);
        setLatestRecord(null);
      }
    };

    const key = cacheKeys.status(userId);
    if (!force) {
      const cached = getCached<{ user: EntraADUser | null; latest: any }>(key, CACHE_TTL.status);
      if (cached) {
        if (cached.user) setUserData(cached.user);
        applyStatus(cached.latest);
        setStatusLoaded(true);
        return;
      }
    }

    try {
      setIsCheckInLoading(true);
      const response = await getEntraUserById(userId);
      const user = response.success && response.data ? response.data : null;
      if (user) setUserData(user);

      const latestHistory = await getAttendanceHistory(userId, undefined, undefined, 1, 1);
      const latest = latestHistory && latestHistory.length > 0 ? latestHistory[0] : null;
      applyStatus(latest);

      setCached(key, { user, latest });
    } catch (error) {
      console.error("Dashboard error (user/status):", error);
    } finally {
      setIsCheckInLoading(false);
      setStatusLoaded(true);
    }
  }, [currentUser?.userID]);

  // 1b. Monthly summary + history — depends on user + selected month/year.
  const fetchMonthlyData = useCallback(async (force = false) => {
    const userId = currentUser?.userID;
    if (!userId) return;

    const key = cacheKeys.month(userId, selectedYear, selectedMonth);
    if (!force) {
      const cached = getCached<{ summary: any; history: any; prevHistory: any }>(key, CACHE_TTL.month);
      if (cached) {
        setSummaryData(cached.summary);
        setAttendanceHistory(cached.history);
        setPrevMonthHistory(cached.prevHistory ?? []);
        setMonthLoaded(true);
        return;
      }
    }

    try {
      const today = new Date();
      const isCurrentMonthView = selectedMonth === today.getMonth() && selectedYear === today.getFullYear();
      const needsPrevMonth = isCurrentMonthView && today.getDate() <= 6;

      const fetchPromises: Promise<any>[] = [
        getAttendanceSummary(userId, selectedMonth + 1, selectedYear),
        getAttendanceHistory(userId, selectedMonth + 1, selectedYear, 1, 31),
      ];
      if (needsPrevMonth) {
        const prevMonth = selectedMonth === 0 ? 12 : selectedMonth;
        const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
        fetchPromises.push(getAttendanceHistory(userId, prevMonth, prevYear, 1, 6));
      }

      const [summary, history, prevHistory] = await Promise.all(fetchPromises);

      setSummaryData(summary);
      setAttendanceHistory(history);
      setPrevMonthHistory(prevHistory ?? []);

      setCached(key, { summary, history, prevHistory: prevHistory ?? [] });
    } catch (error) {
      console.error("Dashboard error (monthly):", error);
    } finally {
      setMonthLoaded(true);
    }
  }, [currentUser?.userID, selectedMonth, selectedYear]);

  // 1c. Holidays for the selected year, filtered to the user's office location.
  // Waits for the profile so filtering always uses the correct location (the
  // old code fetched holidays only after the profile resolved).
  const fetchHolidays = useCallback(async (force = false) => {
    if (!userData) return;
    const userLocation = userData.Office_Location ?? null;
    const key = cacheKeys.holidays(selectedYear, userLocation);

    if (!force) {
      const cached = getCached<Holiday[]>(key, CACHE_TTL.holidays);
      if (cached) {
        setAllYearHolidays(cached);
        return;
      }
    }

    try {
      const hRes = await getHolidaysByYear(selectedYear);
      if (hRes.success && hRes.data) {
        const filtered = hRes.data.filter(h => {
          if (!h.IsLocationSpecific) return true;
          if (!userLocation || !h.Locations?.length) return false;
          return h.Locations.some(l => l.Name.trim().toLowerCase() === userLocation.trim().toLowerCase());
        });
        setAllYearHolidays(filtered);
        setCached(key, filtered);
      }
    } catch (error) {
      console.error("Dashboard error (holidays):", error);
    }
  }, [selectedYear, userData]);

  useEffect(() => {
    fetchUserAndStatus();
  }, [fetchUserAndStatus]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Safety net: never trap the user behind the loader if a fetch stalls/fails.
  useEffect(() => {
    const t = setTimeout(() => setLoadTimedOut(true), 12000);
    return () => clearTimeout(t);
  }, []);

  // Full-page loader stays up until the core data (profile/status, monthly
  // stats and leave balances) has resolved — or the safety timeout fires.
  const isPageLoading =
    !loadTimedOut && (!statusLoaded || !monthLoaded || leaveBalancesLoading);

  // Update current time every minute for the progress bar
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // ── Automatic Geofence Detection ──
  useEffect(() => {
    const autoDetect = async () => {
      try {
        const pos = await getLocation();
        const coords = formatCoordinates(pos);
        setDetectedCoords(coords);
        setDetectedAccuracy(pos.accuracy);
        reverseGeocode(pos.lat, pos.lng).then(setDetectedAddress);

        if (userData?.Office_Location_Coordinates) {
          const office = parseCoordinates(userData.Office_Location_Coordinates);
          const current = parseCoordinates(coords);
          if (office && current) {
            const dist = calculateDistance(current.lat, current.lng, office.lat, office.lng);
            setIsWithinGeofence(dist <= maxGeofenceMeters);
          }
        }
      } catch (err) {
        console.warn("[Auto-Geofence] Detection failed:", err);
      }
    };

    if (userData && !detectedCoords) {
      autoDetect();
    }
  }, [userData, detectedCoords, maxGeofenceMeters]);

  const formatTime = (timeStr: string | null | undefined) => {
    if (!timeStr) return "Not Assigned";
    try {
      // Handle ISO strings (e.g. "1970-01-01T09:00:00.000Z")
      if (timeStr.includes("T")) {
        const timePart = timeStr.split("T")[1];
        const [hours, minutes] = timePart.split(":");
        const h = parseInt(hours);
        const ampm = h >= 12 ? "PM" : "AM";
        const displayHours = h % 12 || 12;
        return `${displayHours}:${minutes} ${ampm}`;
      }

      // Handle simple HH:mm:ss strings
      const [hours, minutes] = timeStr.split(":");
      const h = parseInt(hours);
      const ampm = h >= 12 ? "PM" : "AM";
      const displayHours = h % 12 || 12;
      return `${displayHours}:${minutes} ${ampm}`;
    } catch {
      return "09:00 AM";
    }
  };

  // Robust helper to parse "HH:mm:ss", ISO strings, or Date objects into today's Date object
  const parseTimeToDate = (timeStr: any) => {
    if (!timeStr) return null;
    const d = new Date();

    try {
      // If it's already a Date object (e.g. from SQL TIME field)
      if (timeStr instanceof Date) {
        d.setHours(timeStr.getHours(), timeStr.getMinutes(), timeStr.getSeconds(), 0);
        return d;
      }

      // If it's an ISO string or HH:mm:ss string
      const t = typeof timeStr === 'string' && timeStr.includes("T")
        ? timeStr.split("T")[1]
        : String(timeStr);

      const parts = t.split(":");
      if (parts.length >= 2) {
        d.setHours(parseInt(parts[0]), parseInt(parts[1]), parts[2] ? parseInt(parts[2]) : 0, 0);
        return d;
      }
    } catch (e) {
      console.warn("Failed to parse time:", timeStr, e);
    }
    return null;
  };

  const getShiftProgress = () => {
    if (!userData?.StartTime || !userData?.EndTime) return { worked: "0h 0m", total: "9h 00m", percent: 0 };

    try {
      const now = new Date();

      // Helper to calculate start, end and total for a specific day offset
      const getWindow = (dayOffset: number) => {
        const start = parseTimeToDate(userData.StartTime);
        const end = parseTimeToDate(userData.EndTime);
        if (!start || !end) return null;

        start.setDate(start.getDate() + dayOffset);
        end.setDate(end.getDate() + dayOffset);

        // Adjust for overnight shifts
        if (end < start) {
          end.setDate(end.getDate() + 1);
        }

        return { start, end, totalMs: end.getTime() - start.getTime() };
      };

      const today = getWindow(0);
      const yesterday = getWindow(-1);

      if (!today || !yesterday) return { worked: "0h 0m", total: "9h 00m", percent: 0 };

      // Determine which window to track
      let target = today;

      // Logic: If we are currently IN the yesterday-started shift, use that.
      // Or if we are between shifts, pick the one we are closest to.
      if (now >= yesterday.start && now <= yesterday.end) {
        target = yesterday;
      } else if (now < today.start) {
        // We are between shifts. If closer to yesterday's end than today's start, 
        // show yesterday's status (which will be 100%).
        const distToPrev = now.getTime() - yesterday.end.getTime();
        const distToNext = today.start.getTime() - now.getTime();
        if (distToPrev < distToNext) {
          target = yesterday;
        }
      }

      const { start, end, totalMs } = target;
      let workedMs = now.getTime() - start.getTime();

      if (now < start) workedMs = 0;
      if (now > end) workedMs = totalMs;

      const totalHours = Math.floor(totalMs / 3600000);
      const totalMins = Math.round((totalMs % 3600000) / 60000);

      const workedHours = Math.floor(workedMs / 3600000);
      const workedMins = Math.floor((workedMs % 3600000) / 60000);

      const percent = (workedMs / totalMs) * 100;

      return {
        worked: `${workedHours}h ${workedMins}m`,
        total: `${totalHours}h ${totalMins.toString().padStart(2, '0')}m`,
        percent: Math.min(Math.max(percent, 0), 100)
      };
    } catch (err) {
      console.error("Error calculating shift progress:", err);
      return { worked: "0h 0m", total: "9h 00m", percent: 0 };
    }
  };

  const shiftProgress = getShiftProgress();

  // ── Conditional Checkout Logic ──
  const getCheckOutStatus = () => {
    if (!isCheckedIn || !activeRecord) return { disabled: false, label: "Check In", status: "normal" };

    const isEscalated = activeRecord.IsLocationChanged;
    const approvalStatus = activeRecord.ManagerApprovalStatus;

    // Check if shift has ended (regardless of approval status)
    if (userData?.EndTime) {
      const shiftEnd = parseTimeToDate(userData.EndTime);
      if (shiftEnd && currentTime < shiftEnd) {
        // Still early checkout scenario
      }
    }

    // Standard record (no escalation) or Approved record
    if (!isEscalated || approvalStatus === "Approved") {
      return { disabled: false, label: "Check Out", status: "normal" };
    }

    if (approvalStatus === "Rejected") {
      return {
        disabled: true,
        label: "Day marked as Absent",
        status: "absent",
        message: "Day marked as Absent. Kindly appeal to your manager if you think that there is a discrepancy."
      };
    }

    // Pending state
    if (approvalStatus === "Pending") {
      // Check if shift has ended
      if (userData?.EndTime) {
        const shiftEnd = parseTimeToDate(userData.EndTime);

        if (shiftEnd && currentTime >= shiftEnd) {
          return {
            disabled: true,
            label: "Day marked as Absent",
            status: "absent",
            message: "Day marked as Absent. Kindly appeal to your manager if you think that there is a discrepancy."
          };
        }
      }

      return {
        disabled: true,
        label: "Awaiting Manager Approval",
        status: "pending"
      };
    }

    return { disabled: false, label: "Check Out", status: "normal" };
  };

  const checkoutStatus = getCheckOutStatus();

  const parseLocalDate = (dateStr: string) => {
    if (!dateStr) return { year: 0, month: 0, day: 0 };
    // Handle both YYYY-MM-DD and ISO strings
    const datePart = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const [year, month, day] = datePart.split('-').map(Number);
    return { year, month: month - 1, day }; // Month is 0-indexed in JS
  };

  // Calendar highlight map for the selected month, derived from the cached
  // yearly holidays. Kept as derived state (not a setState in the fetch) so it
  // recomputes on a month switch without re-fetching holidays.
  const currentMonthHolidays = useMemo(() => {
    const map: Record<number, "holiday"> = {};
    allYearHolidays.forEach((h) => {
      const { year: hYear, month: hMonth, day: hDay } = parseLocalDate(h.HolidayDate);
      if (hMonth === selectedMonth && hYear === selectedYear) {
        map[hDay] = "holiday";
      }
    });
    return map;
  }, [allYearHolidays, selectedMonth, selectedYear]);

  // ── Action Handlers ──
  const fetchPermissionHistory = useCallback(async () => {
    if (currentUser?.userID) {
      const history = await getPermissionHistory(currentUser.userID);
      setPermissionHistory(history || []);
    }
  }, [currentUser?.userID]);


  const getBadgeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "government":
        return { bg: "#ecfdf5", text: "#059669" };
      case "festival":
        return { bg: "#fffbeb", text: "#d97706" };
      case "company":
        return { bg: "#eff6ff", text: "#2563eb" };
      default:
        return { bg: "#f8fafc", text: "#64748b" };
    }
  };


  const getLeaveColor = (name: string) => {
    switch (name.toLowerCase()) {
      case "casual leave":
        return "#ff9800"; // Orange
      case "sick leave":
        return "#f44336"; // Red
      case "earned leave":
      case "privilege leave":
        return "#4caf50"; // Green
      case "maternity leave":
      case "paternity leave":
        return "#9c27b0"; // Purple
      default:
        return "#007ed5"; // Standard Blue
    }
  };


  // Helper function to safely check permissions
  const checkPermission = (permissionPath: string) => {
    const paths = permissionPath.split(".");
    let current: any = currentUser?.permissions;

    for (const path of paths) {
      if (!current || current[path] === undefined) {
        return false;
      }
      current = current[path];
    }

    return current === true;
  };


  useEffect(()=>{
    if(checkPermission("attendance.dashboard.manager_dashboard")){
        nav("/Attendance")
    }
    else if(checkPermission("attendance.dashboard.admin_dashboard")){
      nav("/Attendance")
    }
  },[])
 

  const handleSubmitPermission = async () => {
    if (!permissionReason || !permissionDate || !permissionStartTime || !permissionEndTime) {
      dispatchToast(<Toast><ToastTitle>Error</ToastTitle><ToastBody>Please fill all fields.</ToastBody></Toast>, { intent: "error", timeout: 3000 });
      return;
    }
    setIsSubmittingPermission(true);
    try {
      if (currentUser?.userID) {
        await createPermissionRequest({
          empId: currentUser.userID,
          reason: permissionReason,
          date: permissionDate,
          startTime: permissionStartTime,
          endTime: permissionEndTime,
          createdBy: currentUser.userID
        });

        // PARALLEL CHECKOUT: If this was triggered during an early checkout, check out now
        if (isEarlyCheckout) {
          await executeCheckInOut();
          dispatchToast(
            <Toast>
              <ToastTitle>Permission Sent & Checked Out ✓</ToastTitle>
              <ToastBody>Your early checkout has been recorded and manager notified.</ToastBody>
            </Toast>,
            { intent: "success", timeout: 5000 }
          );
        } else {
          dispatchToast(
            <Toast>
              <ToastTitle>Success</ToastTitle>
              <ToastBody>Permission request submitted and manager notified.</ToastBody>
            </Toast>,
            { intent: "success", timeout: 3000 }
          );
        }

        setPermissionReason("");
        setPermissionDate("");
        setPermissionStartTime("");
        setPermissionEndTime("");
        setIsPermissionDrawerOpen(false); // Close drawer after success
        fetchPermissionHistory();
      }
    } catch (e: any) {
      dispatchToast(<Toast><ToastTitle>Error</ToastTitle><ToastBody>{e.message}</ToastBody></Toast>, { intent: "error", timeout: 5000 });
    } finally {
      setIsSubmittingPermission(false);
    }
  };

  const executeCheckInOut = useCallback(async (weekendOverride?: { isWeekend: boolean; weekendReason: string },lateCheckinOvverRide?:{isLate:boolean,lateCheckinReason:string}) => {
    if (!currentUser?.userID) return;
    setIsCheckInLoading(true);
    setIsConfirmDialogOpen(false);

    try {
      if (!isCheckedIn) {
        // ── CHECK IN ──

        const geofenceStatus = (selectedWorkLocation === "Office" && isWithinGeofence === false) ? " - Outside Geofence" : "";
        const result = await checkIn({
          userId: currentUser.userID,
          createdBy: currentUser.userID,
          currentCoordinates: detectedCoords,
          currentLocation: detectedCoords
            ? `${detectedAddress ?? "Detected"} (±${Math.round(detectedAccuracy || 0)}m accuracy)${geofenceStatus}`
            : (locationError ? `Error: ${locationError}` : "GPS Unavailable"),
          workLocation: selectedWorkLocation,
          isWeekend: weekendOverride?.isWeekend ?? false,
          weekendReason: weekendOverride?.weekendReason,
          isLate: lateCheckinOvverRide?.isLate ?? false,
          lateReason: lateCheckinOvverRide?.lateCheckinReason ?? null
        },setIsLateCheckinDialogOpen,setIsWeekendDialogOpen);

        // Immediately update state with the new record from backend
        if (result.success && result.data) {
          setActiveRecord(result.data);
          setIsCheckedIn(true);
          // Bust the cache and pull fresh status + this month's stats so the new
          // record is reflected (holidays are unaffected by a check-in).
          invalidate(cacheKeys.status(currentUser.userID));
          invalidate(`month:${currentUser.userID}:`);
          fetchUserAndStatus(true);
          fetchMonthlyData(true);
        }

        if (result.isLocationChanged) {
          let title = "Attendance Alert";
          let message = "Your check-in has been flagged for manager approval.";

          if (result.violationType === 'Late' && !result.isPermission) {
            title = "Late Arrival Recorded";
            message = "You have checked in after the grace period. Your manager has been notified.";
          } else if (result.violationType === 'Location') {
            title = "Outside Office Perimeter";
            message = "You checked in from outside your assigned office. Your manager has been notified.";
          } else if (result.violationType === 'Both') {
            title = "Late & Off-site Check-in";
            message = "Your check-in is both late and outside the assigned office. Manager notification sent.";
          }

          dispatchToast(
            <Toast>
              <ToastTitle>{title}</ToastTitle>
              <ToastBody>{message}</ToastBody>
            </Toast>,
            { intent: "warning", timeout: 6000 }
          );
        } else if (result.violationType === 'Early') {
          dispatchToast(
            <Toast>
              <ToastTitle>Early Check-in Recorded</ToastTitle>
              <ToastBody>You have checked in before your shift starts. Your attendance has been recorded.</ToastBody>
            </Toast>,
            { intent: "info", timeout: 4000 }
          );
        } else {
          dispatchToast(
            <Toast>
              <ToastTitle>Checked In ✓</ToastTitle>
              <ToastBody>Your attendance has been recorded successfully.</ToastBody>
            </Toast>,
            { intent: "success", timeout: 4000 }
          );
        }
      } else {
        // ── CHECK OUT ──
        await checkOut({
          userId: currentUser.userID,
          modifiedBy: currentUser.userID,
          isEarlyCheckOut:  isEarlyCheckout || false,
          earlyCheckoutReason: earlyCheckoutReason || undefined,
        });
        setIsCheckedIn(false);
        setIsEarlyCheckoutState(false);
        setEarlyCheckOutReason("");
        setHasApprovedPermission(false);
        setHalfDayLeaveToday(null);
        // Bust the cache and pull fresh status + this month's stats.
        invalidate(cacheKeys.status(currentUser.userID));
        invalidate(`month:${currentUser.userID}:`);
        fetchUserAndStatus(true);
        fetchMonthlyData(true);
        dispatchToast(
          <Toast>
            <ToastTitle>Checked Out ✓</ToastTitle>
            <ToastBody>Your shift has ended. Have a great day!</ToastBody>
          </Toast>,
          { intent: "success", timeout: 4000 }
        );
      }
    } catch (error: any) {
      console.log("weekend check",error)
      if (error?.response?.data?.isWeekend || error?.isWeekend) {
        setIsWeekendDialogOpen(true);
        return;
      }
      if(error?.response?.data?.isLate || error?.isLate){
        setIsLateCheckinDialogOpen(true)
        return
      }
      dispatchToast(
        <Toast>
          <ToastTitle>Error</ToastTitle>
          <ToastBody>{error?.response?.data?.message || error.message || "An error occurred. Please try again."}</ToastBody>
        </Toast>,
        { intent: "error", timeout: 5000 }
      );
    } finally {
      setIsCheckInLoading(false);
    }
  }, [
    currentUser?.userID,
    isCheckedIn,
    dispatchToast,
    detectedCoords,
    detectedAddress,
    detectedAccuracy,
    locationError,
    selectedWorkLocation,
    isWithinGeofence,
    isEarlyCheckout,
    earlyCheckoutReason,
    fetchUserAndStatus,
    fetchMonthlyData
  ]);

  // ── Confirmation Trigger ──────────────────────────────────────────────
  const handleCheckInOut = useCallback(async () => {
    if (isCheckedIn) {
      // Check for early checkout and permission status
      let earlyCheckoutCheck = false;
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      const todayAttendance = attendanceHistory.find(
        item => item.CheckIn?.split('T')[0] === today
      );

      const isWeekend = todayAttendance?.IsWeekend === true;

      // Weekend: skip all dialogs and checkout immediately
      if (isWeekend) {
        executeCheckInOut();
        return;
      }

      if (userData?.EndTime) {
        earlyCheckoutCheck = evaluateEarlyCheckout(
          parseTimeToDate(userData.EndTime),
          activeRecord?.CheckIn,
          now
        );
      }

      if (earlyCheckoutCheck) {
        setIsEarlyCheckoutState(true);

        // An approved half-day leave for the 2nd session already covers today's
        // early exit — no permission or reason is required. Matched the same way
        // as the full-day leave check in the check-in flow below.
        const halfDayLeave = leaveHistory.find(l => {
          if (!l.Halfday || l.HalfSession !== "2") return false;
          if (l.ApprovalStatus !== 'Approved') return false;
          const stStr = new Date(l.Start_Date).toISOString().split('T')[0];
          const enStr = new Date(l.End_Date).toISOString().split('T')[0];
          return today >= stStr && today <= enStr;
        }) || null;

        setHalfDayLeaveToday(halfDayLeave);

        if (halfDayLeave) {
          setHasApprovedPermission(false);
          setEarlyCheckOutReason("");
          setIsConfirmDialogOpen(true);
          setIsEarlyCheckoutState(false)
          return;
        }

        try {
          setIsCheckInLoading(true);
          const status = await getTodayPermissionStatus(currentUser?.userID || "");
          const permStart = parseTimeToDate(status?.StartTime);
          const permEnd = parseTimeToDate(status?.EndTime);

          if (
            status?.ApprovalStatus === "Approved" &&
            permStart && permEnd &&
            now >= permStart && now <= permEnd
          ) {
            setHasApprovedPermission(true);
            setIsConfirmDialogOpen(true);
          } else {
            setHasApprovedPermission(false);
            setIsEarlyCheckoutDialogOpen(true);
            setIsEarlyCheckoutState(true)
          }
        } catch (e) {
          console.error("Failed to fetch today permission", e);
          setHasApprovedPermission(false);
          setIsEarlyCheckoutDialogOpen(true);
        } finally {
          setIsCheckInLoading(false);
        }
        return;
      } else {
        setIsEarlyCheckoutState(false);
        setHasApprovedPermission(false);
        setHalfDayLeaveToday(null);
      }

      setIsConfirmDialogOpen(true);
    } else {
      // Guard: verify location permission before opening check-in flow
      if (!navigator.geolocation) {
        dispatchToast(
          <Toast>
            <ToastTitle>Location Not Supported</ToastTitle>
            <ToastBody>Geolocation is not supported by your browser. Check-in is unavailable.</ToastBody>
          </Toast>,
          { intent: "error", timeout: 6000 }
        );
        return;
      }

      if (navigator.permissions) {
        const permStatus = await navigator.permissions.query({ name: "geolocation" });
        if (permStatus.state === "denied") {
          dispatchToast(
            <Toast>
              <ToastTitle>Location Access Denied</ToastTitle>
              <ToastBody>Location permission is blocked. Please enable it in your browser or Teams settings to check in.</ToastBody>
            </Toast>,
            { intent: "error", timeout: 6000 }
          );
          return;
        }
      }

      // ── CHECK IN: Reset dialog to selection phase ──
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Check Holiday
      const userLocation = userData?.Office_Location;
      const holidayToday = allYearHolidays.find(h => {
                const d = new Date(h.HolidayDate);
                const isToday = d.toISOString().split("T")[0] === todayStr;
                const isNotOptional = h.HolidayType?.trim()?.toLowerCase() !== 'optional';
                const isApplicable = !h.IsLocationSpecific
                  || (!!userLocation && h.Locations?.some(l => l.Name.trim().toLowerCase() === userLocation.trim().toLowerCase()));
                return isToday && isNotOptional && isApplicable;
            });

      if (holidayToday) {
        // setCheckInConflict({ type: 'Holiday', name: holidayToday.HolidayName });
        setCheckInConflict(null)
        console.log("Today Holiday",holidayToday)
      } else {
        // Check Approved Leave
        const leaveToday = leaveHistory.filter(item=>!(item.Halfday)).find(l => {
          if (l.ApprovalStatus !== 'Approved') return false;
          const start = new Date(l.Start_Date);
          const end = new Date(l.End_Date);
          const stStr = start.toISOString().split('T')[0];
          const enStr = end.toISOString().split('T')[0];
          return todayStr >= stStr && todayStr <= enStr;
        });

        if (leaveToday) {
          setCheckInConflict({ type: 'Leave', name: leaveToday.LeaveName });
        } else {
          setCheckInConflict(null);
        }
      }

      // Reset state, open dialog in locating phase, then decide flow based on geofence
      setSelectedWorkLocation('');
      setIsWithinGeofence(null);
      setDetectedCoords(null);
      setDetectedAccuracy(null);
      setLocationError(null);
      setCheckInPhase('locating');
      setIsConfirmDialogOpen(true);

      // Auto-detect location first
      setIsCheckInLoading(true);
      try {
        const pos = await getLocation();
        const coords = formatCoordinates(pos);
        setDetectedCoords(coords);
        setDetectedAccuracy(pos.accuracy);
        reverseGeocode(pos.lat, pos.lng).then(setDetectedAddress);

        if (userData?.Office_Location_Coordinates) {
          const office = parseCoordinates(userData.Office_Location_Coordinates);
          const current = parseCoordinates(coords);
          if (office && current) {
            const dist = calculateDistance(current.lat, current.lng, office.lat, office.lng);
            if (dist <= maxGeofenceMeters) {
              setSelectedWorkLocation('Office');
              setIsWithinGeofence(true);
              setCheckInPhase('geofence_result');
            } else {
              // Outside geofence — send user to work-type selection with Office pre-selected as default
              setSelectedWorkLocation('Office');
              setIsWithinGeofence(false);
              setCheckInPhase('select_type');
            }
          } else {
            // Coordinates unparseable — location unknown, block check-in (offer retry)
            setIsWithinGeofence(null);
            setCheckInPhase('geofence_result');
          }
        } else {
          // No office coordinates configured — auto-select Office and proceed
          setSelectedWorkLocation('Office');
          setIsWithinGeofence(true);
          setCheckInPhase('geofence_result');
        }
      } catch (err: any) {
        console.error("Geo error during auto-detection:", err);
        setLocationError(err.message);
        setIsWithinGeofence(null);
        // Location could not be determined — block check-in and offer a retry
        setCheckInPhase('geofence_result');
      } finally {
        setIsCheckInLoading(false);
      }
    }
  }, [
    isCheckedIn,
    userData,
    setIsConfirmDialogOpen,
    getTodayPermissionStatus,
    dispatchToast,
    currentUser?.userID,
    allYearHolidays,
    leaveHistory,
    earlyCheckoutReason,
    maxGeofenceMeters
  ]);

  // ── Called when user taps "Next" after picking their work type ──────────────
  const handleWorkTypeNext = useCallback(async () => {
    if (!selectedWorkLocation) return;

    if (selectedWorkLocation === 'Office') {
      // Run geofence detection
      setCheckInPhase('locating');
      setIsCheckInLoading(true);
      try {
        const pos = await getLocation();
        const coords = formatCoordinates(pos);
        setDetectedCoords(coords);
        setDetectedAccuracy(pos.accuracy);
        setLocationError(null);
        reverseGeocode(pos.lat, pos.lng).then(setDetectedAddress);

        if (userData?.Office_Location_Coordinates) {
          const office = parseCoordinates(userData.Office_Location_Coordinates);
          const current = parseCoordinates(coords);
          if (office && current) {
            const dist = calculateDistance(current.lat, current.lng, office.lat, office.lng);
            setIsWithinGeofence(dist <= maxGeofenceMeters);
          } else {
            // Can't parse coords — treat as unknown (inside by default)
            setIsWithinGeofence(null);
          }
        } else {
          // No office coords configured — skip geofence, allow check-in
          setIsWithinGeofence(true);
        }
      } catch (err: any) {
        console.error("Geo error:", err);
        setLocationError(err.message);
        setIsWithinGeofence(null);
      } finally {
        setIsCheckInLoading(false);
        setCheckInPhase('geofence_result');
      }
    } else {
      // WFH / CustomerSite / Other — skip geofence, go straight to confirmation
      setCheckInPhase('geofence_result');
    }
  }, [selectedWorkLocation, userData, maxGeofenceMeters]);

  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getLiveTime = () => {
    return currentTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).toUpperCase();
  };

  // Dynamic personal insights derived from live attendance and leave data
  const personalInsights = useMemo(() => {
    const insights: { icon: React.ReactNode; text: React.ReactNode; bg: string; border: string }[] = [];

    if (summaryData) {
      if (summaryData.LateArrivals === 0 && summaryData.PresentDays > 0) {
        insights.push({
          icon: <CheckCircle2 size={16} color="#10b981" />,
          text: <><strong>No late arrivals</strong> this month — <strong>great punctuality!</strong></>,
          bg: "#F0FDF4",
          border: "#DCFCE7",
        });
      } else if (summaryData.LateArrivals > 0) {
        insights.push({
          icon: <AlertTriangle size={16} color="#f59e0b" />,
          text: <>You had <strong>{summaryData.LateArrivals} late arrival{summaryData.LateArrivals > 1 ? "s" : ""}</strong> this month.</>,
          bg: "#FFFBEB",
          border: "#FDE68A",
        });
      }
    }

    if (summaryData && summaryData.TotalDays > 0) {
      const rate = Math.round((summaryData.PresentDays / summaryData.TotalDays) * 100);
      if (rate >= 90) {
        insights.push({
          icon: <Trophy size={16} color="#eab308" />,
          text: <>Your attendance rate is <strong>{rate}%</strong> — <strong>excellent</strong> this month!</>,
          bg: "#F0FDF4",
          border: "#DCFCE7",
        });
      } else if (rate < 75) {
        insights.push({
          icon: <TrendingDown size={16} color="#ef4444" />,
          text: <>Attendance is at <strong>{rate}%</strong> this month. Consider <strong>regularising</strong> any missed days.</>,
          bg: "#FFF1F2",
          border: "#FECDD3",
        });
      }
    }

    if (liveLeaveBalances.length > 0) {
      const totalAvail = liveLeaveBalances.reduce((s, b) => s + b.AvailableDays, 0);
      const totalQuota = liveLeaveBalances.reduce((s, b) => s + b.TotalDays, 0);
      const pct = totalQuota > 0 ? totalAvail / totalQuota : 0;
      if (pct >= 0.5) {
        insights.push({
          icon: <Lightbulb size={16} color="#3b82f6" />,
          text: <>Leave balance is <strong>healthy</strong> — <strong>{totalAvail} day{totalAvail !== 1 ? "s" : ""} remaining</strong> across all types.</>,
          bg: "#EFF6FF",
          border: "#DBEAFE",
        });
      } else if (pct < 0.2) {
        insights.push({
          icon: <AlertCircle size={16} color="#ef4444" />,
          text: <>Only <strong>{totalAvail} leave day{totalAvail !== 1 ? "s" : ""} remaining</strong>. Plan time off <strong>carefully</strong>.</>,
          bg: "#FFF1F2",
          border: "#FECDD3",
        });
      }
    }

    // if (summaryData && summaryData.PendingApprovals > 0) {
    //   insights.push({
    //     icon: <Hourglass size={16} color="#f59e0b" />,
    //     text: <>You have <strong>{summaryData.PendingApprovals} attendance record{summaryData.PendingApprovals > 1 ? "s" : ""}</strong> awaiting <strong>manager approval</strong>.</>,
    //     bg: "#FFFBEB",
    //     border: "#FDE68A",
    //   });
    // }

    if (insights.length === 0) {
      insights.push({
        icon: <Sparkles size={16} color="#64748b" />,
        text: <><strong>Mark your attendance</strong> to start seeing <strong>personalised insights</strong>.</>,
        bg: "#F8FAFC",
        border: "#E2E8F0",
      });
    }

    return insights;
  }, [summaryData, liveLeaveBalances]);

  // Real data for Summary Cards
  const summaryStats = [
    { label: "Present Days", value: summaryData?.PresentDays?.toString() || "0", color: "#059669", icon: <BuildingCheckmarkFilled /> },
    { label: "Absent Days", value: summaryData?.AbsentDays?.toString() || "0", color: "#e11d48", icon: <Warning24Filled /> },
    { label: "Late Arrivals", value: summaryData?.LateArrivals?.toString() || "0", color: "#d97706", icon: <Clock24Regular /> },
    { label: "Leave Balance", value: "12", color: "#2563eb", icon: <DocumentText24Regular /> },
  ];

  const getCalendarData = () => {
    const data: Record<number, "present" | "early" | "absent" | "late" | "holiday" | "requested_leave" | "approved_leave"> = { ...currentMonthHolidays as any };

    // 1. Map Leaves (Lower Priority than Presence but Higher than Holiday?) 
    // Actually User wants: Leave/Holiday > Presence (Presence blocked).
    // Mapping Leaves first, then Holidays (might overwrite requested leave), then Presence (overwrites all).

    leaveHistory.forEach(leave => {
      const start = new Date(leave.Start_Date);
      const end = new Date(leave.End_Date);

      let curr = new Date(start);
      while (curr <= end) {
        if (curr.getMonth() === selectedMonth && curr.getFullYear() === selectedYear) {
          const d = curr.getDate();
          const status = leave.ApprovalStatus === 'Approved' ? 'approved_leave' : 'requested_leave';

          // Only set if not already a holiday (Holiday takes priority visually if it's both?)
          // Or if it's already an approved leave, don't downgrade to requested.
          if (data[d] !== 'holiday' && data[d] !== 'approved_leave') {
            data[d] = status;
          }
        }
        curr.setDate(curr.getDate() + 1);
      }
    });

    attendanceHistory.forEach(record => {
      if (!record.CheckIn) return;
      const date = new Date(record.CheckIn).getUTCDate();
      // IsPresent=1 → completed session, IsPresent=null → active session (checked in, not yet out)
      const isCheckedIn = record.IsPresent || (record.IsPresent == null && record.CheckIn);
      if (isCheckedIn) {
        if (record.ViolationType === 'Late' || record.ViolationType === 'Both') {
          data[date] = 'late';
        } else if (record.ViolationType === 'Early') {
          data[date] = 'early';
        } else {
          data[date] = 'present';
        }
      } else if (record.IsPresent === false) {
        data[date] = 'absent';
      }
    });
    return data;
  };

  // ── TIMELINE CALCULATION ──
  let shiftStartTimeParsed = parseTimeToDate(userData?.StartTime) || parseTimeToDate("09:00:00");
  let shiftEndTimeParsed = parseTimeToDate(userData?.EndTime) || parseTimeToDate("18:00:00");

  // Night shift correction: if shift end < shift start, the shift crosses midnight.
  // Adjust the reference frame so all times fall on the correct calendar day.
  if (shiftStartTimeParsed && shiftEndTimeParsed && shiftEndTimeParsed < shiftStartTimeParsed) {
    if (currentTime < shiftStartTimeParsed) {
      // Post-midnight: we are past midnight but before the next shift start (e.g. 2 AM).
      // Move shift start to yesterday so timeline positions are correct.
      shiftStartTimeParsed.setDate(shiftStartTimeParsed.getDate() - 1);
    } else {
      // Pre-midnight: shift has just started (e.g. 11 PM).
      // Move shift end to tomorrow.
      shiftEndTimeParsed.setDate(shiftEndTimeParsed.getDate() + 1);
    }
  }

  // parseTimeToDate strips the date and anchors to today. Correct for overnight shifts:
  // - check-in in the future means it belongs to yesterday (post-midnight portion).
  // - check-out before check-in means it crossed midnight into today.
  let checkInTimeDate = activeRecord?.CheckIn ? parseTimeToDate(activeRecord.CheckIn) : null;
  if (checkInTimeDate && checkInTimeDate > currentTime) {
    checkInTimeDate.setDate(checkInTimeDate.getDate() - 1);
  }
  let checkOutTimeDate = activeRecord?.CheckOut ? parseTimeToDate(activeRecord.CheckOut) : null;
  if (checkOutTimeDate && checkInTimeDate && checkOutTimeDate < checkInTimeDate) {
    checkOutTimeDate.setDate(checkOutTimeDate.getDate() + 1);
  }

  const totalShiftDurationMs = (shiftEndTimeParsed && shiftStartTimeParsed)
    ? (shiftEndTimeParsed.getTime() - shiftStartTimeParsed.getTime())
    : (9 * 3600000);

  const getTimelinePercent = (date: Date | null) => {
    if (!date || !shiftStartTimeParsed || !shiftEndTimeParsed) return 0;
    const ms = date.getTime() - shiftStartTimeParsed.getTime();
    return Math.min(Math.max((ms / totalShiftDurationMs) * 100, 0), 100);
  };

  const activeFillPercent = getTimelinePercent(shiftEndTimeParsed && currentTime < shiftEndTimeParsed ? currentTime : shiftEndTimeParsed);

  const timelineGracePeriod = 15;
  const checkInDisplayTime = checkInTimeDate;
  const isArrivalEarly = checkInDisplayTime && shiftStartTimeParsed && (checkInDisplayTime.getTime() < shiftStartTimeParsed.getTime());
  const isArrivalLate = checkInDisplayTime && shiftStartTimeParsed && (checkInDisplayTime.getTime() > shiftStartTimeParsed.getTime() + (timelineGracePeriod * 60000));
  const isDepartureEarly = checkOutTimeDate && shiftEndTimeParsed && (checkOutTimeDate.getTime() < shiftEndTimeParsed.getTime() - (5 * 60000));

  // ── DURATION CALCULATIONS ──────────────────────────────────────
  const getDurationStrings = () => {
    const now = currentTime;
    const stats = {
      lateStr: "",
      workingStr: "",
      remainingStr: "",
      isLate: false
    };

    if (userData?.StartTime && !isCheckedIn) {
      const shiftStart = parseTimeToDate(userData.StartTime);
      if (shiftStart && now > shiftStart) {
        const diff = now.getTime() - shiftStart.getTime();
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        stats.lateStr = `${h}h ${m}m late`;
        stats.isLate = true;
      }
    }

    if (activeRecord?.CheckIn) {
      const checkIn = new Date(activeRecord.CheckIn);
      const diff = now.getTime() - checkIn.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      stats.workingStr = `${h}h ${m}m`;
    }

    if (userData?.EndTime) {
      const shiftEnd = parseTimeToDate(userData.EndTime);
      if (shiftEnd) {
        // Night shift: if shiftEnd < shiftStart the shift crosses midnight.
        // When in the pre-midnight portion (now >= shiftStart), push shiftEnd to tomorrow.
        const shiftStart = parseTimeToDate(userData.StartTime);
        if (shiftStart && shiftEnd < shiftStart && now >= shiftStart) {
          shiftEnd.setDate(shiftEnd.getDate() + 1);
        }
        if (now < shiftEnd) {
          const diff = shiftEnd.getTime() - now.getTime();
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          stats.remainingStr = `${h}h ${m}m`;
        }
      }
    }

    return stats;
  };

  const durStats = getDurationStrings();

  
  const CHECKIN_COOLDOWN_HOURS = parseInt(import.meta.env.VITE_CHECKIN_WINDOW || "8");
  const checkInReopensAt = useMemo(() => {
    const raw = latestRecord?.CheckOut;
    if (typeof raw !== "string" || !raw.includes("T")) return null;
    const local = new Date(raw.replace(/(?:Z|[+-]\d{2}:\d{2})$/i, ""));
    if (isNaN(local.getTime())) return null;
    return new Date(local.getTime() + CHECKIN_COOLDOWN_HOURS * 60 * 60 * 1000);
  }, [latestRecord, CHECKIN_COOLDOWN_HOURS]);

  // Inside the cooldown window → shift is "completed" and re-check-in is blocked.
  const isShiftCompleted = !!checkInReopensAt && currentTime.getTime() < checkInReopensAt.getTime();
  const canCheckInNow = !isShiftCompleted;

  return (
    <div className={styles.dashboardRoot}>
      <Toaster toasterId={toasterId} position="top-end" />

      {/* Full-page loader shown until core dashboard data has loaded */}
      {isPageLoading && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(2px)",
          }}
        >
          <Spinner  labelPosition="below" size="large" label="Loading..." />
        </div>
      )}

      {/* 1. Greeting Header */}
      <div className={styles.dashboardHeader}>
        {
          props.isGreetingVisible && (
            <div>
              <Text className={styles.greetingTitle}>
                {getGreeting()}, {userData?.DisplayName?.split(" ")[0] || "User"}
              </Text>
              <Text block className={styles.greetingSubtitle}>
                Here's what your day looks like.
              </Text>
            </div>
          )
        }
        
        {/* <div>
          <Text size={300} weight="semibold" style={{ color: "#475569" }}>
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · {getLiveTime()}
          </Text>
        </div> */}
      </div>

      <div className={styles.contentWrapper}>
        {/* MAIN CONTENT */}
        <div className={styles.mainContent}>

          {/* 2. Hero Check-In Card */}
          <div className={styles.heroCard}>
            {isCheckedIn ? (
              /* STATE: WORKING / CHECKED IN */
              <>
                <div className={styles.heroStatusPill} style={{ backgroundColor: "#eff6ff" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#3b82f6" }} />
                  <span style={{ color: "#3b82f6" }}>Working{activeRecord?.CheckIn ? ` - ${(() => { const checkInDate = parseTimeToDate(activeRecord.CheckIn); if (!checkInDate) return ""; const ms = currentTime.getTime() - checkInDate.getTime(); if (ms <= 0) return ""; const h = Math.floor(ms / 3600000); const m = Math.floor((ms % 3600000) / 60000); return h > 0 ? `${h}h ${m}m` : `${m}m`; })()}` : ""}</span>
                </div>

                <div className={styles.heroClock}>{getLiveTime()}</div>

                <div className={styles.heroSubtitle}>
                  {isCheckInLoading ? "Updating status..." : (
                    <>Checked in at {activeRecord?.CheckIn ? formatTime(activeRecord.CheckIn) : "—"} - {activeRecord?.Employee_CurrentLocation || userData?.Office_Location || "Office"}</>
                  )}
                </div>

                <div className={styles.heroBadgeWhite}>
                  <Clock24Regular style={{ fontSize: "16px", color: "#3b82f6" }} />
                  Shift · {userData?.StartTime ? formatTime(userData.StartTime) : "--:--"} – {userData?.EndTime ? formatTime(userData.EndTime) : "--:--"}
                </div>

                <Button
                  className={mergeClasses(
                    styles.checkInBtn,
                    styles.checkoutBtn,
                    // checkoutStatus.status === 'pending' && styles.checkoutPendingBtn
                  )}
                  onClick={handleCheckInOut}
                  disabled={isCheckInLoading}
                >
                  {isCheckInLoading ? "Wait..." : (
                    // checkoutStatus.status === 'pending'
                    //   ? <><Warning24Filled style={{ marginRight: '8px' }} /> Awaiting Manager's Approval</>
                    //   : checkoutStatus.status === 'absent'
                    //     ? <><Warning24Filled style={{ marginRight: '8px' }} /> Day marked as Absent</>
                    //     : 
                    <><ArrowExit20Regular style={{ marginRight: '8px' }} /> Check Out</>
                  )}
                </Button>

                <div className={styles.heroSubtextInfo}>
                  Est. remaining today - {durStats.remainingStr || "0h 0m"}
                </div>
              </>
            ) : (
              /* STATE: IDLE (NOT CHECKED IN) or SHIFT COMPLETED */
              <>
                <div className={styles.heroStatusPill} style={isShiftCompleted ? { backgroundColor: "#f0fdf4" } : undefined}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: isShiftCompleted ? "#22c55e" : "#cbd5e1" }} />
                  <span style={{ color: isShiftCompleted ? "#16a34a" : "#64748b" }}>{isShiftCompleted ? "Shift Completed" : "Not Checked In"}</span>
                </div>

                <div className={styles.heroClock}>{getLiveTime()}</div>

                <div className={styles.heroSubtitle}>
                  {isShiftCompleted
                    ? `Shift completed please come back tomorrow.`
                    : "Please check-in to start your day!"}
                </div>

                <div className={styles.heroBadgeWhite}>
                  Shift · {userData?.StartTime ? formatTime(userData.StartTime) : "--:--"} – {userData?.EndTime ? formatTime(userData.EndTime) : "--:-- PM"}
                  {!isShiftCompleted && durStats.isLate && <span style={{ color: "#f59e0b", marginLeft: '4px' }}>· {durStats.lateStr}</span>}
                </div>

                {isShiftCompleted ? (
                  <>
                    <div style={{color:'green'}}>
                      <CheckmarkCircle24Filled style={{ fontSize: "20px" }} /> Shift Completed
                    </div>
                    {checkInReopensAt && (
                      <div className={styles.heroSubtextInfo}>
                        
                      </div>
                    )}
                  </>
                ) : (
                  userData?.StartTime && userData.EndTime?
                  <>
                    <Button
                      className={styles.checkInBtn}
                      onClick={handleCheckInOut}
                      disabled={isCheckInLoading || !canCheckInNow}
                    >
                      {isCheckInLoading ? "Locating..." : "Check In"}
                    </Button>
                  </>
                  :

                  <div style={{color:'red'}}>
                    <CheckmarkCircle24Filled style={{ fontSize: "20px" }} /> Seems you have no assigned shifts please contact your manager
                  </div>

                )}

                {!isShiftCompleted && durStats.isLate ? (
                  <div className={styles.heroSubtextWarning}>
                    ⚠️ Late check-in will be recorded. Please check in on time going forward.
                  </div>
                ) : !isShiftCompleted ? (
                  <div className={styles.heroSubtextInfo}>
                    Ready for a productive day?
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* 3. Today's Timeline */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Today's Timeline</div>
              {/* <div className={styles.linkText} onClick={() => navigate('/Attendance/History')}>View details →</div> */}
            </div>

            <div style={{ padding: "10px 0" }}>
              {/* Top Labels */}
              <div className={styles.timelineLabelsTop}>
                <Text className={styles.timelineTimeLabel}>{userData?.StartTime ? formatTime(userData.StartTime) : "09:00 AM"}</Text>
                <Text className={styles.timelineTimeLabel}>{userData?.EndTime ? formatTime(userData.EndTime) : "06:00 PM"}</Text>
              </div>

              {/* Progress Bar */}
              <div className={styles.timelineProgressWrapper}>
                {/* Progress Fill (synchronized with clock) */}
                <div
                  className={styles.timelineProgressActive}
                  style={{
                    left: '0%',
                    width: `${activeFillPercent}%`
                  }}
                />
              </div>

              {/* Bottom Labels and Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <Text size={100} weight="semibold" style={{ color: "#64748b", textTransform: 'uppercase' }}>Check-In</Text>
                  <Text size={400} weight="bold">{activeRecord?.CheckIn ? formatTime(activeRecord.CheckIn) : "—"}</Text>
                  {activeRecord?.CheckIn && (() => {
                    const vt = activeRecord.ViolationType;
                    if (vt === "Early" || isArrivalEarly) return <div className={`${styles.statusBadge} ${styles.statusEarlyIn}`}>Early</div>;
                    if (vt === "Late" || vt === "Both") return <div className={`${styles.statusBadge} ${styles.statusLate}`}>Late</div>;
                    return !isArrivalLate && <div className={`${styles.statusBadge} ${styles.statusOnTime}`}>On Time</div>;
                  })()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <Text size={100} weight="semibold" style={{ color: "#64748b", textTransform: 'uppercase' }}>Est. Check-Out</Text>
                  <Text size={400} weight="bold">{userData?.EndTime ? formatTime(userData.EndTime) : "06:00 PM"}</Text>
                  {activeRecord?.CheckOut && isDepartureEarly && (
                    <div className={`${styles.statusBadge} ${styles.statusEarly}`}>
                      Early Out
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={attendanceConfigs.find((item)=>item.ConfigurationKey === "GRACE_PERIOD")?.Value && parseInt(attendanceConfigs.find((item)=>item.ConfigurationKey === "GRACE_PERIOD")?.Value as string) > 10 ?styles.timelineInfoGrid : styles.timelineInfoGrid2Col} style={{ marginTop: '24px' }}>
              <div className={styles.infoChip}>
                <Text size={100} style={{ color: "#64748b", fontWeight: 600 }}>LOCATION</Text>
                <Text size={200} style={{ color: "#1e293b", fontWeight: 600 }}>
                  {activeRecord?.Employee_CurrentLocation || userData?.Office_Location || "—"}
                </Text>
              </div>

              {
                attendanceConfigs.find((item)=>item.ConfigurationKey === "GRACE_PERIOD")?.Value && parseInt(attendanceConfigs.find((item)=>item.ConfigurationKey === "GRACE_PERIOD")?.Value as string) > 10 
                &&
                <div className={styles.infoChip}>
                  <Text size={100} style={{ color: "#64748b", fontWeight: 600 }}>GRACE PERIOD</Text>
                  <Text size={200} style={{ color: "#1e293b", fontWeight: 600 }}>{attendanceConfigs.find((item)=>item.ConfigurationKey === "GRACE_PERIOD")?.Value || "-"}</Text>
                </div>
              }
              
              <div className={styles.infoChip}>
                <Text size={100} style={{ color: "#64748b", fontWeight: 600 }}>SHIFT TYPE</Text>
                <Text size={200} style={{ color: "#1e293b", fontWeight: 600 }}>{userData?.ShiftName || "General"}</Text>
              </div>
            </div>
          </div>

          {/* 4. Last 7 Days */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>Last 7 Days</div>
              <div className={styles.linkText} onClick={() => navigate('/Attendance/History')}>Attendance Log →</div>
            </div>
            <div className={styles.dayChipsContainer}>
              {(() => {
                // 1. Generate the last 7 calendar days (including today)
                const last7Dates: Date[] = [];
                for (let i = 6; i >= 0; i--) {
                  const d = new Date(currentTime);
                  d.setDate(d.getDate() - i);
                  d.setHours(0, 0, 0, 0); // Normalize to midnight
                  last7Dates.push(d);
                }

                // 2. Map Attendance Log for quick lookup (merge prev month data for first-week cross-month coverage)
                const historyMap = new Map<number, any>();
                [...attendanceHistory, ...prevMonthHistory].forEach(rec => {
                  if (!rec.CheckIn) return;
                  const d = new Date(rec.CheckIn);
                  d.setHours(0, 0, 0, 0);
                  const key = d.getTime();
                  // Prioritize records where the user was present
                  if (!historyMap.has(key) || rec.AttendanceStatus === 'PRESENT') {
                    historyMap.set(key, rec);
                  }
                });

                return last7Dates.map((dateObj, i) => {
                  const dayStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                  const dateNum = dateObj.getDate();
                  const isWeekend = [0, 6].includes(dateObj.getDay());
                  const rec = historyMap.get(dateObj.getTime());
                  const isHoliday = allYearHolidays.some(h => {
                    const hd = new Date(h.HolidayDate);
                    hd.setHours(0, 0, 0, 0);
                    return hd.getTime() === dateObj.getTime() && h.HolidayType !== 'Optional';
                  });

                  // localDateStr in YYYY-MM-DD
                  const y = dateObj.getFullYear();
                  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                  const dNum = String(dateObj.getDate()).padStart(2, '0');
                  const localDateStr = `${y}-${m}-${dNum}`;

                  const leaveToday = leaveHistory.find(l => {
                    if (l.ApprovalStatus !== 'Approved') return false;
                    // Ensure we only compare the date part
                    const start = l.Start_Date.split('T')[0];
                    const end = l.End_Date.split('T')[0];
                    return localDateStr >= start && localDateStr <= end;
                  });

                  let bg = "#f1f5f9";
                  let col = "#64748b";

                  if (leaveToday) {
                    bg = "#f3e8ff"; col = "#9333ea"; // Leave Purple
                  } else if (isHoliday) {
                    bg = "#f3e8ff"; col = "#9333ea"; // Holiday shown as Leave (Purple)
                  } else if (rec) {
                    // Record exists → user checked in (covers Office, WFH, CustomerSite, etc.)
                    if (rec.ViolationType === 'Late' || rec.ViolationType === 'Both') {
                      bg = "#fef3c7"; col = "#d97706"; // Late Yellow
                    } else if (rec.ViolationType === 'Early') {
                      bg = "#ecfdf5"; col = "#059669"; // Early Blue
                    } else if (rec.AttendanceStatus === 'ABSENT') {
                      bg = "#fee2e2"; col = "#e11d48"; // Absent Red
                    } else {
                      bg = "#ecfdf5"; col = "#059669"; // Present Green (Early treated as Present)
                    }
                  } else if (isWeekend) {
                    bg = "#f8fafc"; col = "#94a3b8"; // Week Off Grey
                  } else {
                    // Past weekday with no record = Absent
                    bg = "#fee2e2"; col = "#e11d48";
                  }

                  return (
                    <div key={i} className={styles.dayChipBox} style={{ backgroundColor: bg }}>
                      <div className={styles.dayChipDay} style={{ color: col }}>{dayStr}</div>
                      <div className={styles.dayChipDate} style={{ color: col }}>{dateNum}</div>
                    </div>
                  );
                });
              })()}
            </div>
            <div className={styles.legendRow}>
              <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: "#059669" }} /> Present</div>
              <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: "#d97706" }} /> Late</div>
              <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: "#e11d48" }} /> Absent</div>
              <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: "#9333ea" }} /> Leave</div>
              <div className={styles.legendItem}><div className={styles.legendDot} style={{ background: "#94a3b8" }} /> Week Off</div>
            </div>
          </div>

          {/* 5. Quick Actions */}
          <div className={styles.quickActionsGrid}>
            <div className={styles.quickActionBox} onClick={() => navigate('/Attendance/MyRequests?tab=leave&action=create')}>
              <DocumentAdd24Regular style={{ color: "#3b82f6" }} /> Request Leave
            </div>
            <div className={styles.quickActionBox} onClick={() => navigate('/Attendance/MyRequests?tab=permission&action=create')}>
              <Clock24Regular style={{ color: "#10b981" }} /> Request Permission
            </div>
            <div className={styles.quickActionBox} onClick={() => navigate('/Attendance/MyRequests?tab=regularization&action=create')}>
              <CalendarEdit24Regular style={{ color: "#f59e0b" }} /> Fix My Attendance
            </div>
            {/* <div className={styles.quickActionBox} onClick={() => navigate('/Attendance/History')}>
              <History24Regular style={{ color: "#8b5cf6" }} /> View History
            </div> */}
          </div>

          {/* 6. My Requests */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>My Requests</div>
              <div className={styles.linkText} onClick={() => navigate('/Attendance/MyRequests')}>View All →</div>
            </div>
            <div>
              {(() => {
                const combined = [
                  ...leaveHistory.map(l => ({ id: "LV-" + l.ID, type: 'Leave', title: displayLeaveLabel(l.LeaveName || (l as any).LeaveType || (l as any).LeaveNameType) || "Leave", dateStr: `${new Date(l.Start_Date).toLocaleDateString()} to ${new Date(l.End_Date).toLocaleDateString()}`, status: l.ApprovalStatus, timestamp: new Date(l.CreatedOn || l.Start_Date).getTime() })),
                  ...permissionHistory.map(p => ({
                    id: "PR-" + p.ID,
                    type: 'Permission',
                    title: "Permission",
                    dateStr: `${new Date(p.Date).toLocaleDateString()} (${formatTime(p.StartTime)} - ${formatTime(p.EndTime)})`,
                    status: p.ApprovalStatus,
                    timestamp: new Date(p.CreatedOn || p.Date).getTime()
                  }))
                ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);

                if (combined.length === 0) return <Text style={{ color: "#64748b" }}>No recent requests found.</Text>;

                return combined.map((req, i) => (
                  <div key={i} className={styles.requestRow}>
                    <div className={styles.requestIcon} style={{
                      backgroundColor: req.type === 'Leave' ? "#fdf2f8" : "#f5f3ff",
                      color: req.type === 'Leave' ? "#db2777" : "#8b5cf6"
                    }}>
                      {req.type === 'Leave' ? 'LV' : 'PR'}
                    </div>
                    <div className={styles.requestDetails}>
                      <div className={styles.requestTitleRow}>
                        <div className={styles.requestName}>{req.title}</div>
                        <Badge appearance="filled" color={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'danger' : 'warning'} style={{ transform: 'scale(0.9)', transformOrigin: 'right' }}>
                          {req.status}
                        </Badge>
                      </div>
                      <div className={styles.requestSub}>{req.dateStr}</div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

        </div>

        {/* RIGHT PANEL */}
        <div className={styles.rightPanel}>

          <div className={styles.card}>
            <div className={styles.cardTitle} style={{ marginBottom: "20px" }}>Leave Balance</div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {leaveBalancesLoading ? (
                <>
                  {[0, 1].map(i => (
                    <div key={i} style={{ flex: '1 1 calc(50% - 6px)', minWidth: '120px', height: '110px', borderRadius: '12px', background: 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                  ))}
                </>
              ) : liveLeaveBalances.filter(b => !b.IsDisabled).length === 0 ? (
                <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No leave types assigned</span>
              ) : (
                (() => {
                  const palette = [
                    { bg: "#FFF7ED", border: "#FFEDD5", color: "#F97316" },
                    { bg: "#F5F3FF", border: "#EDE9FE", color: "#8B5CF6" },
                    { bg: "#F0FDF4", border: "#DCFCE7", color: "#16a34a" },
                    { bg: "#EFF6FF", border: "#DBEAFE", color: "#0078D4" },
                    { bg: "#FFF1F2", border: "#FFE4E6", color: "#e11d48" },
                    { bg: "#FFFBEB", border: "#FEF3C7", color: "#d97706" },
                  ];
                  return liveLeaveBalances.filter(b => !b.IsDisabled && !b.IsOptional).map((b, i) => {
                    const { bg, border, color } = palette[i % palette.length];
                    const used = b.UsedDays ?? 0;
                    const total = b.TotalDays ?? 1;
                    const available = b.AvailableDays ?? (total - used);
                    const percent = Math.min((used / (total || 1)) * 100, 100);
                    const displayName = displayLeaveLabel(b.LeaveType) || b.LeaveType || "Leave";
                    const cleanName = displayName.toLowerCase().includes("leave") ? displayName.replace(/leave/i, "").trim() : displayName;
                    return (
                      <div key={b.LeaveNameType} className={styles.overviewTile} style={{ backgroundColor: bg, border: `1px solid ${border}`, flex: '1 1 calc(50% - 6px)', minWidth: '120px' }}>
                        <div className={styles.tileBigNum} style={{ color }}>{available}</div>
                        <div className={styles.tileLabel} style={{ color }}>{cleanName}<br />Leave</div>
                        <div className={styles.tileMiniBarTrack}>
                          <div className={styles.tileMiniBarFill} style={{ width: `${percent}%`, backgroundColor: color }} />
                        </div>
                        <div className={styles.tileFooter} style={{ color, opacity: 0.8 }}>
                          <div>{used} of {total}</div>
                          <div>{available} Left</div>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
          </div>

          {/* Personal insights portion */}
          <div className={styles.card}>
            <div className={styles.cardTitle} style={{ marginBottom: "20px" }}>Personal Insights</div>
            {personalInsights.map((insight: { icon: React.ReactNode; text: React.ReactNode; bg: string; border: string }, i: number) => (
              <div key={i} className={styles.insightBox} style={{ backgroundColor: insight.bg, border: `1px solid ${insight.border}` }}>
                <div className={styles.insightIcon}>{insight.icon}</div>
                <div style={{ flex: 1 }}>{insight.text}</div>
              </div>
            ))}
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle} style={{ marginBottom: "16px" }}>Upcoming Holidays</div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {(() => {
                const upcoming = allYearHolidays
                  .filter(h => {
                    const hd = new Date(h.HolidayDate);
                    hd.setHours(0, 0, 0, 0);
                    const ct = new Date(currentTime);
                    ct.setHours(0, 0, 0, 0);
                    return hd >= ct;
                  })
                  .sort((a, b) => new Date(a.HolidayDate).getTime() - new Date(b.HolidayDate).getTime())
                  .slice(0, 5);

                if (upcoming.length === 0) return <Text size={200} style={{ color: "#64748b", padding: "10px 0" }}>No upcoming holidays</Text>;

                return upcoming.map((h, i) => {
                  const date = new Date(h.HolidayDate);
                  return (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 0',
                      borderBottom: i < upcoming.length - 1 ? '1px solid #f1f5f9' : 'none'
                    }}>
                      <div style={{
                        backgroundColor: '#f0fdfa',
                        color: '#0d9488',
                        padding: '6px',
                        borderRadius: '8px',
                        minWidth: '42px',
                        textAlign: 'center',
                        border: '1px solid #ccfbf1'
                      }}>
                        <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 800 }}>
                          {date.getDate()}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>
                              {h.HolidayName}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                              {date.toLocaleDateString('en-US', { weekday: 'long' })}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge appearance="tint" color={h.HolidayType === "Optional" ? "warning" : "success"}>{h.HolidayType}</Badge>
                            {h.HolidayType === "Optional" && <Text style={{color: '#64748b'}} size={100}>On approval basis</Text>}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          
        </div>
      </div>

      {/* 
      <OverlayDrawer
        open={isLeaveDrawerOpen}
        onOpenChange={(_, { open }) => setIsLeaveDrawerOpen(open)}
        position="end"
        size="medium"
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button appearance="subtle" aria-label="Close" icon={<DismissRegular />} onClick={() => setIsLeaveDrawerOpen(false)} />
            }
          >
            Request Leave
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody className={styles.drawerBody}>
          <div className={styles.drawerFormSection}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Submit a leave request. The number of applicable days takes into account weekends and holidays based on your shift schedule.
            </Text>

            <Field label="Leave Type (Policy)" required>
              <Select value={leaveName} onChange={(_, d) => setLeaveName(d.value)}>
                 <option value="">Select a policy...</option>
                 {liveLeaveBalances.map((leave, i) => (
                   <option key={i} value={leave.LeaveNameType}>
                     {displayLeaveLabel(leave.LeaveType)} ({leave.AvailableDays} days left)
                   </option>
                 ))}
              </Select>
            </Field>
            
            <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
              <Field label="Start Date" required style={{ flex: '1 1 150px' }}>
                <Input type="date" value={leaveStartDate} max={leaveEndDate || undefined} onChange={(_, d) => setLeaveStartDate(d.value)} style={{ width: '100%' }} />
              </Field>
              <Field label="End Date" required style={{ flex: '1 1 150px' }}>
                <Input type="date" value={leaveEndDate} min={leaveStartDate || undefined} onChange={(_, d) => setLeaveEndDate(d.value)} style={{ width: '100%' }} />
              </Field>
            </div>

            <Card style={{ backgroundColor: "#F9FAFB", padding: "12px", border: "1px solid #E5E7EB", boxShadow: "none", flexShrink: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <Text weight="semibold">Calculated Leave Days:</Text>
                 <Badge color={calculatedLeaveDays > 0 && !dateBoundariesInvalid ? "brand" : "danger"} size="large">{calculatedLeaveDays} Day(s)</Badge>
              </div>
            </Card>

            {(calculatedLeaveDays === 0 || dateBoundariesInvalid) && leaveStartDate && leaveEndDate && (
              <div className={styles.warningBox}>
                <Warning24Filled style={{ color: "#991B1B", flexShrink: 0 }} />
                <Text className={styles.warningText}>
                  {calculatedLeaveDays === 0 
                    ? "Your selected date range falls entirely on non-working days. Regular shift users cannot book leaves for these days."
                    : "Your leave cannot begin or end on a weekend/holiday. Please select working days for your start and end dates."}
                </Text>
              </div>
            )}

            <Field label="Reason">
              <Textarea value={leaveReason} onChange={(_, d) => setLeaveReason(d.value)} placeholder="Provide specific reason (optional)..." rows={3} />
            </Field>

            <Button 
                appearance="primary" 
                onClick={handleSubmitLeave} 
                disabled={isSubmittingLeave || !leaveStartDate || !leaveEndDate || !leaveName} 
                className={styles.submitButton}
            >
              {isSubmittingLeave ? "Submitting..." : "Submit Leave Request"}
            </Button>
          </div>

          <div className={styles.drawerScrollSection}>
             <Text weight="bold" size={400} block style={{ marginBottom: '12px' }}>Recent Leaves</Text>
             {leaveHistory.length === 0 ? (
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>No recent leave requests found.</Text>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {leaveHistory.map((req) => (
                    <Card key={req.ID} style={{ padding: '12px', border: "1px solid #f1f5f9" }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Text weight="semibold">{displayLeaveLabel(req.LeaveName)}</Text>
                        <Badge
                          appearance="filled"
                          color={req.ApprovalStatus === "Approved" ? "success" : req.ApprovalStatus === "Rejected" ? "danger" : "warning"}
                        >
                          {req.ApprovalStatus}
                        </Badge>
                      </div>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {new Date(req.Start_Date).toLocaleDateString()} to {new Date(req.End_Date).toLocaleDateString()}
                      </Text>
                      {req.ApprovalStatus === "Pending" && (
                        <Button
                          size="small"
                          appearance="outline"
                          style={{ marginTop: '8px', color: tokens.colorPaletteRedForeground1, borderColor: tokens.colorPaletteRedForeground1 }}
                          onClick={() => setWithdrawConfirmId(req.ID)}
                        >
                          Withdraw
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
             )}
          </div>

          {/* Withdraw Confirmation Dialog *
          <Dialog open={!!withdrawConfirmId} onOpenChange={(_, { open }) => { if (!open) setWithdrawConfirmId(null); }}>
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Withdraw Leave Request?</DialogTitle>
                <DialogContent>
                  <Text>Are you sure you want to withdraw this leave request? This action cannot be undone.</Text>
                </DialogContent>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <Button appearance="secondary" onClick={() => setWithdrawConfirmId(null)}>Cancel</Button>
                  <Button
                    appearance="primary"
                    style={{ backgroundColor: '#d13438', border: 'none' }}
                    onClick={async () => {
                      if (!withdrawConfirmId || !currentUser?.userID) return;
                      const id = withdrawConfirmId;
                      setWithdrawConfirmId(null);
                      try {
                        const res = await withdrawLeaveRequest(id, currentUser.userID);
                        if (res.success) {
                          dispatchToast(<Toast><ToastTitle>Withdrawn</ToastTitle><ToastBody>Your leave request has been withdrawn successfully.</ToastBody></Toast>, { intent: "success" });
                          getLeaveHistory(currentUser.userID).then(r => { if (r.success && r.data) setLeaveHistory(r.data); });
                          getLeaveBalances(currentUser.userID).then(r => { if (r.success && r.data) setLiveLeaveBalances(r.data); });
                        } else {
                          dispatchToast(<Toast><ToastTitle>Error</ToastTitle><ToastBody>{res.message}</ToastBody></Toast>, { intent: "error" });
                        }
                      } catch {
                        dispatchToast(<Toast><ToastTitle>Error</ToastTitle><ToastBody>Failed to withdraw leave request.</ToastBody></Toast>, { intent: "error" });
                      }
                    }}
                  >
                    Yes, Withdraw
                  </Button>
                </div>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </DrawerBody>
      </OverlayDrawer>

      <OverlayDrawer
        open={isPermissionDrawerOpen}
        onOpenChange={(_, { open }) => setIsPermissionDrawerOpen(open)}
        position="end"
        size="medium"
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<DismissRegular />}
                onClick={() => setIsPermissionDrawerOpen(false)}
              />
            }
          >
            Request Permission
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody className={styles.drawerBody}>
          <div className={styles.drawerFormSection}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Submit a permission request to checkout early or for other short-term absences.
            </Text>

            <Field label="Date" required>
              <Input type="date" value={permissionDate} onChange={(_, d) => setPermissionDate(d.value)} />
            </Field>

            <div style={{ display: 'flex', gap: '12px', width: '100%', flexWrap: 'wrap' }}>
              <Field label="Start Time" required style={{ flex: '1 1 120px' }}>
                <Input type="time" value={permissionStartTime} onChange={(_, d) => setPermissionStartTime(d.value)} style={{ width: '100%' }} />
              </Field>
              <Field label="End Time" required style={{ flex: '1 1 120px' }}>
                <Input type="time" value={permissionEndTime} onChange={(_, d) => setPermissionEndTime(d.value)} style={{ width: '100%' }} />
              </Field>
            </div>

            <Field label="Reason" required>
              <Textarea value={permissionReason} onChange={(_, d) => setPermissionReason(d.value)} placeholder="Provide specific reason..." rows={3} />
            </Field>

            <Button 
                appearance="primary" 
                onClick={handleSubmitPermission} 
                disabled={isSubmittingPermission} 
                className={styles.submitButton}
            >
              {isSubmittingPermission ? "Submitting..." : "Submit Request"}
            </Button>
          </div>

          <div className={styles.drawerScrollSection}>
             <Text weight="bold" size={400} block style={{ marginBottom: '12px' }}>Recent Requests</Text>
             {permissionHistory.length === 0 ? (
                <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>No recent requests found.</Text>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {permissionHistory.map((req) => (
                    <Card key={req.ID} style={{ padding: '12px', border: "1px solid #f1f5f9" }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Text weight="semibold">Permission</Text>
                        <Badge
                          appearance="filled"
                          color={req.ApprovalStatus === "Approved" ? "success" : req.ApprovalStatus === "Rejected" ? "danger" : "warning"}
                        >
                          {req.ApprovalStatus}
                        </Badge>
                      </div>
                      <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        {new Date(req.Date).toLocaleDateString()} | {formatTime(req.StartTime)} to {formatTime(req.EndTime)}
                      </Text>
                    </Card>
                  ))}
                </div>
             )}
          </div>
        </DrawerBody>
      </OverlayDrawer>
      */}

      <Dialog open={isConfirmDialogOpen} onOpenChange={(_, data) => setIsConfirmDialogOpen(data.open)}>
        <DialogSurface
          style={{
            maxWidth: '420px',
            width: 'calc(100vw - 32px)',
            boxSizing: 'border-box',
            borderRadius: '28px',
            padding: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}
        >
          <DialogBody>
            <DialogTitle>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ backgroundColor: '#2563EB', color: 'white', borderRadius: '10px', padding: '8px', display: 'flex' }}>
                    <Location24Filled />
                  </div>
                  <Text weight="bold" size={500}>{isCheckedIn ? "Check Out" : "Check In"}</Text>
                </div>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="transparent" icon={<DismissRegular />} />
                </DialogTrigger>
              </div>
            </DialogTitle>

            <DialogContent>
              {/* --- CHECK IN FLOW --- */}
              {!isCheckedIn && (
                <div style={{ marginTop: '12px' }}>

                  {/* BLOCKED: Holiday / Leave */}
                  {checkInConflict ? (
                    <div className={styles.warningBox} style={{ backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }}>
                      <Warning24Filled style={{ color: '#DC2626', fontSize: '24px', flexShrink: 0 }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <Text weight="bold" style={{ color: '#991B1B' }}>Attendance Blocked</Text>
                        <Text size={200} style={{ color: '#B91C1C' }}>
                          {checkInConflict.type === 'Holiday'
                            ? `Today is a public holiday (${checkInConflict.name}).`
                            : `You have an approved leave today (${checkInConflict.name}).`}
                        </Text>
                      </div>
                    </div>

                  ) : checkInPhase === 'select_type' ? (
                    /* ── PHASE 0: WORK TYPE SELECTION ── */
                    <div style={{ padding: '4px' }}>
                      <div style={{ marginBottom: '20px' }}>
                        <Text size={500} weight="bold" block style={{ color: '#111827' }}>Where are you working from?</Text>
                        <Text size={200} style={{ color: '#6B7280' }}>Select your work location type for today.</Text>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div
                          className={`${styles.radioCard} ${selectedWorkLocation === 'Office' ? styles.radioCardSelected : ''}`}
                          onClick={() => setSelectedWorkLocation('Office')}
                        >
                          <Radio checked={selectedWorkLocation === 'Office'} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text weight="bold" style={{ color: '#1E293B' }}>Office</Text>
                            <Text size={100} style={{ color: '#64748B' }}>Checking in from your assigned office location</Text>
                          </div>
                        </div>

                        <div
                          className={`${styles.radioCard} ${selectedWorkLocation === 'WorkFromHome' ? styles.radioCardSelected : ''}`}
                          onClick={() => setSelectedWorkLocation('WorkFromHome')}
                        >
                          <Radio checked={selectedWorkLocation === 'WorkFromHome'} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text weight="bold" style={{ color: '#1E293B' }}>Work From Home</Text>
                            <Text size={100} style={{ color: '#64748B' }}>Approved via WFH policy (max 2 days/week)</Text>
                          </div>
                        </div>

                        <div
                          className={`${styles.radioCard} ${selectedWorkLocation === 'CustomerSite' ? styles.radioCardSelected : ''}`}
                          onClick={() => setSelectedWorkLocation('CustomerSite')}
                        >
                          <Radio checked={selectedWorkLocation === 'CustomerSite'} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text weight="bold" style={{ color: '#1E293B' }}>Customer Site Visit</Text>
                            <Text size={100} style={{ color: '#64748B' }}>Working from a client or partner location</Text>
                          </div>
                        </div>

                        <div
                          className={`${styles.radioCard} ${selectedWorkLocation === 'Other' ? styles.radioCardSelected : ''}`}
                          onClick={() => setSelectedWorkLocation('Other')}
                        >
                          <Radio checked={selectedWorkLocation === 'Other'} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <Text weight="bold" style={{ color: '#1E293B' }}>Other</Text>
                            <Text size={100} style={{ color: '#64748B' }}>Any other work arrangement</Text>
                          </div>
                        </div>
                      </div>
                    </div>

                  ) : checkInPhase === 'locating' ? (
                    /* ── PHASE 1: LOCATING (Office path only) ── */
                    <div style={{ padding: '4px' }}>
                      <div style={{ marginBottom: '24px' }}>
                        <Text size={500} weight="bold" block style={{ color: '#111827' }}>Locating you...</Text>
                        <Text size={200} style={{ color: '#6B7280' }}>We're checking whether you're inside the office geofence.</Text>
                      </div>

                      <div className={styles.rippleBox}>
                        <div className={styles.rippleOuter} style={{ animationDelay: '0s' }} />
                        <div className={styles.rippleOuter} style={{ animationDelay: '0.8s' }} />
                        <div className={styles.rippleOuter} style={{ animationDelay: '1.6s' }} />
                        <div className={styles.rippleCenter} />
                        <div className={styles.floatingPill} style={{ top: '20px', left: '20px', maxWidth: 'calc(50% - 8px)', overflow: 'hidden' }}>
                          <Location20Regular style={{ color: '#2563EB', flexShrink: 0 }} />
                          <Text style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userData?.Office_Location || "Main Office"}</Text>
                        </div>
                        <div className={styles.floatingPill} style={{ bottom: '20px', right: '20px', maxWidth: 'calc(50% - 8px)', overflow: 'hidden' }}>
                          <Location20Regular style={{ color: '#EF4444', flexShrink: 0 }} />
                          <Text style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>±{detectedAccuracy ? Math.round(detectedAccuracy) : "…"}m</Text>
                        </div>
                      </div>

                      <div className={styles.dotsContainer}>
                        <div className={styles.dot} style={{ animationDelay: '0s' }} />
                        <div className={styles.dot} style={{ animationDelay: '0.2s' }} />
                        <div className={styles.dot} style={{ animationDelay: '0.4s' }} />
                      </div>
                      <Text size={200} weight="semibold" block style={{ color: '#2563EB', marginTop: '12px', textAlign: 'center' }}>
                        Getting your location...
                      </Text>
                    </div>

                  ) : checkInPhase === 'geofence_result' ? (
                    /* ── PHASE 2: RESULT SCREEN ── */
                    <>
                      {/* --- Office: Inside geofence --- */}
                      {selectedWorkLocation === 'Office' && isWithinGeofence === true && (
                        <div style={{ textAlign: 'center', padding: '24px 0 16px 0' }}>
                          <div style={{ backgroundColor: '#F0FDF4', color: '#16A34A', borderRadius: '50%', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.1)' }}>
                            <CheckmarkCircle48Filled style={{ fontSize: '40px' }} />
                          </div>
                          <Text size={600} weight="bold" block style={{ color: '#111827', lineHeight: '1.3', fontSize: 'clamp(16px, 4.5vw, 20px)', wordBreak: 'break-word' }}>You're at {userData?.Office_Location || "the Office"}</Text>
                          <Text size={300} block style={{ color: '#6B7280', marginTop: '12px', lineHeight: '1.5' }}>Everything looks good. You can proceed to check in.</Text>
                          <div style={{ marginTop: '32px', backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0' }}>
                            <Text size={100} weight="bold" block style={{ color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.02em' }}>ACCURACY</Text>
                            <Text weight="bold" size={300} style={{ color: '#1E293B' }}>±{detectedAccuracy ? Math.round(detectedAccuracy) : "18"}m · Coordinates Captured</Text>
                          </div>
                        </div>
                      )}

                      {/* --- Office: Outside geofence --- */}
                      {selectedWorkLocation === 'Office' && isWithinGeofence === false && (

                        detectedAccuracy && detectedAccuracy > 200?
                        <div style={{ padding: '4px' }}>
                          <div className={styles.warningBox} style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', marginBottom: '16px' }}>
                            <Warning24Filled style={{ color: '#D97706', fontSize: '24px', flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                              <Text weight="bold" style={{ color: '#92400E' }}>Low Accuracy</Text>
                              <Text size={200} style={{ color: '#78350F', wordBreak: 'break-word' }}>
                                Looks like your location accuracy is too low, try again after turning on the wifi
                              </Text>
                            </div>
                          </div>
                          
                        </div>
                        :
                        <div style={{ padding: '4px' }}>
                          <div className={styles.warningBox} style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', marginBottom: '16px' }}>
                            <Warning24Filled style={{ color: '#D97706', fontSize: '24px', flexShrink: 0 }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                              <Text weight="bold" style={{ color: '#92400E' }}>Outside Office Perimeter</Text>
                              <Text size={200} style={{ color: '#78350F', wordBreak: 'break-word' }}>
                                You are not within your assigned office geofence. Checking in will flag your attendance for manager review unless you are in an authorized Quadra office.
                              </Text>
                            </div>
                          </div>
                          
                        </div>
                      )}

                      {/* --- Office: GPS failed / unknown geofence --- */}
                      { isWithinGeofence === null && (
                        <div className={styles.warningBox} style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                          <QuestionCircle24Filled style={{ color: '#64748B', fontSize: '24px', flexShrink: 0 }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                            <Text weight="bold" style={{ color: '#1E293B' }}>Location Unavailable</Text>
                            <Text size={200} style={{ color: '#64748B', wordBreak: 'break-word' }}>
                              {locationError ? `GPS Error: ${locationError}` : 'Could not determine your location.'}
                            </Text>
                          </div>
                        </div>
                      )}

                      {/* --- WFH Confirmation --- */}
                      {selectedWorkLocation === 'WorkFromHome' && isWithinGeofence !== null && (
                        <div style={{ padding: '4px' }}>
                          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏠</div>
                            <Text size={500} weight="bold" block style={{ color: '#111827' }}>Work From Home</Text>
                            <Text size={200} block style={{ color: '#6B7280', marginTop: '8px' }}>
                              Your check-in will be logged as Work From Home. Your manager will be notified and their approval is required.
                            </Text>
                          </div>
                        </div>
                      )}

                      {/* --- Customer Site Confirmation --- */}
                      {selectedWorkLocation === 'CustomerSite'&& isWithinGeofence !== null && (
                        <div style={{ padding: '4px' }}>
                          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏢</div>
                            <Text size={500} weight="bold" block style={{ color: '#111827' }}>Customer Site Visit</Text>
                            <Text size={200} block style={{ color: '#6B7280', marginTop: '8px' }}>
                              Your check-in will be recorded as a Customer Site Visit. No additional action is required at this time.
                            </Text>
                          </div>
                        </div>
                      )}

                      {/* --- Other Confirmation --- */}
                      {selectedWorkLocation === 'Other'&& isWithinGeofence !== null && (
                        <div style={{ padding: '4px' }}>
                          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ fontSize: '48px', marginBottom: '12px' }}></div>
                            <Text size={500} weight="bold" block style={{ color: '#111827' }}>Other Location</Text>
                            <Text size={200} block style={{ color: '#6B7280', marginTop: '8px' }}>
                              Your check-in will be recorded. No additional action is required at this time.
                            </Text>
                          </div>
                        </div>
                      )}
                    </>
                  ) : null}

                  {/* ── ACTION BUTTONS ── */}
                  <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: checkInPhase === 'locating' ? 'center' : 'stretch' }}>
                    {/* Cancel — hidden during locating */}
                    {checkInPhase !== 'locating' && (
                      <DialogTrigger disableButtonEnhancement>
                        <Button appearance="outline" shape="circular" style={{ flex: 1, height: '44px' }}>
                          Cancel
                        </Button>
                      </DialogTrigger>
                    )}

                    {/* Phase 0: Next button (disabled until a type is selected) */}
                    {checkInPhase === 'select_type' && !checkInConflict && (
                      <Button
                        appearance="primary"
                        shape="circular"
                        style={{ flex: 1, backgroundColor: '#2563EB', height: '44px', fontWeight: 'bold' }}
                        disabled={!selectedWorkLocation}
                        onClick={handleWorkTypeNext}
                      >
                        Next →
                      </Button>
                    )}

                    {/* Phase 2: Retry (location unknown) or Check In / Continue Anyway buttons */}
                    {checkInPhase === 'geofence_result' && !checkInConflict && (
                      isWithinGeofence === null ? (
                        <Button
                          appearance="primary"
                          shape="circular"
                          style={{ flex: 1, height: '44px', fontWeight: 'bold', backgroundColor: '#2563EB' }}
                          onClick={handleCheckInOut}
                        >
                          Retry
                        </Button>
                      ) : (
                        <Button
                          appearance="primary"
                          shape="circular"
                          style={{
                            flex: 1,
                            height: '44px',
                            fontWeight: 'bold',
                            backgroundColor: (selectedWorkLocation === 'Office' && isWithinGeofence === false) ? '#D97706' : '#2563EB'
                          }}
                          onClick={() => executeCheckInOut()}
                        >
                          {selectedWorkLocation === 'Office' && isWithinGeofence === false
                            ? 'Continue Anyway'
                            : 'Check In Now'}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* --- CHECK OUT FLOW --- */}
              {isCheckedIn && (
                <div style={{ padding: '8px 0' }}>
                  {isEarlyCheckout ? (
                    halfDayLeaveToday ? (
                      <div style={{ backgroundColor: '#F0FDF4', padding: '14px', borderRadius: '12px', border: '1px solid #BBF7D0', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <CheckmarkCircle24Filled style={{ color: '#16A34A', fontSize: "22px", flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ minWidth: 0 }}>
                          <Text weight="bold" block style={{ color: '#166534', marginBottom: '4px' }}>Half Day Leave Approved</Text>
                          <Text size={200} style={{ color: '#166534', wordBreak: 'break-word' }}>
                            You have an approved second half leave today{halfDayLeaveToday.LeaveName ? ` (${displayLeaveLabel(halfDayLeaveToday.LeaveName)})` : ''}. No early checkout reason is required.
                          </Text>
                        </div>
                      </div>
                    ) : hasApprovedPermission ? (
                      <div style={{ backgroundColor: '#F0FDF4', padding: '14px', borderRadius: '12px', border: '1px solid #BBF7D0', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <CheckmarkCircle24Filled style={{ color: '#16A34A', fontSize: "22px", flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ minWidth: 0 }}>
                          <Text weight="bold" block style={{ color: '#166534', marginBottom: '4px' }}>Permission Approved</Text>
                          <Text size={200} style={{ color: '#166534', wordBreak: 'break-word' }}>Your early checkout permission is approved. You can proceed.</Text>
                        </div>
                      </div>
                    ) : (
                      <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', padding: '14px', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                        <Warning24Filled style={{ color: "#D13438", fontSize: "22px", flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ minWidth: 0 }}>
                          <Text weight="bold" block style={{ color: '#991B1B', marginBottom: '4px' }}>Early Checkout</Text>
                          <Text size={200} style={{ color: '#B91C1C', wordBreak: 'break-word' }}>{earlyCheckoutReason}</Text>
                        </div>
                      </div>
                    )
                  ) : (
                    <div style={{ textAlign: 'center', padding: '12px 0' }}>
                      <Text size={400} weight="semibold">Are you sure you want to check out?</Text>
                      <Text size={200} block style={{ color: '#6B7280', marginTop: '4px' }}>This will complete your attendance period for today.</Text>
                    </div>
                  )}

                  <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Button
                      appearance="primary"
                      shape="circular"
                      style={{ width: '100%', backgroundColor: '#2563EB', height: '44px', fontWeight: 'bold' }}
                      onClick={() => executeCheckInOut()}
                    >
                      Confirm Check Out
                    </Button>

                    <DialogTrigger disableButtonEnhancement>
                      <Button appearance="secondary" shape="circular" style={{ width: '100%', height: '40px' }}>Cancel</Button>
                    </DialogTrigger>
                  </div>
                </div>
              )}
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>


      {/* Late check-in reason */}

      <Dialog open={IsLateCheckinDialogOpen} onOpenChange={(_, data) => { setIsLateCheckinDialogOpen(data.open); if (!data.open) setLateCheckingReason(""); }}>
        <DialogSurface style={{ maxWidth: "400px", width: "calc(100vw - 32px)", boxSizing: "border-box", borderRadius: "24px", padding: "16px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
          <DialogBody>
            <DialogTitle>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ backgroundColor: "#F59E0B", color: "white", borderRadius: "8px", padding: "6px", display: "flex" }}>
                  <Warning24Filled />
                </div>
                <Text weight="bold" size={400}>Late Check-in</Text>
              </div>
            </DialogTitle>
            <DialogContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                <div style={{ display: "flex", gap: "12px", padding: "12px", borderRadius: "8px", backgroundColor: "#FFFBE6", border: "1px solid #FFE58F", alignItems: "flex-start" }}>
                  <Warning24Filled style={{ color: "#FAAD14", fontSize: "20px", flexShrink: 0 }} />
                  <Text style={{ color: "#856404", fontSize: "12px", lineHeight: "1.4", wordBreak: "break-word", flex: 1, minWidth: 0 }}>
                    You checked in late after your shift start time; please provide a valid reason.
                  </Text>
                </div>
                <Field label="Reason" required>
                  <Textarea
                    value={lateCheckinReason}
                    onChange={(_, d) => lateCheckinReason?.length<150? setLateCheckingReason(d.value):null}
                    rows={3}
                  />
                </Field>
                <div style={{ display: "flex", gap: "12px" }}>
                  <Button
                    appearance="primary"
                    shape="circular"
                    style={{ flex: 1, height: "44px", fontWeight: "600", minWidth: 0, whiteSpace: "nowrap" }}
                    disabled={!lateCheckinReason.trim()}
                    onClick={() => {
                      const capturedLateOverride = { isLate: true, lateCheckinReason: lateCheckinReason?.trim() };
                      setPendingLateOverride(capturedLateOverride);
                      setIsLateCheckinDialogOpen(false);
                      executeCheckInOut(
                        pendingWeekendOverride ?? { isWeekend: false, weekendReason: "" },
                        capturedLateOverride
                      );
                      setLateCheckingReason("");
                      setPendingWeekendOverride(undefined);
                    }}
                  >
                    Confirm Check In
                  </Button>
                  <Button
                    appearance="secondary"
                    shape="circular"
                    style={{ flex: 1, height: "44px" }}
                    onClick={() => { setIsLateCheckinDialogOpen(false); setLateCheckingReason(""); setPendingWeekendOverride(undefined); setPendingLateOverride(undefined); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* ── Weekend Check-in Reason Dialog ── */}
      <Dialog open={isWeekendDialogOpen} onOpenChange={(_, data) => { setIsWeekendDialogOpen(data.open); if (!data.open) setWeekendCheckinReason(""); }}>
        <DialogSurface style={{ maxWidth: "400px", width: "calc(100vw - 32px)", boxSizing: "border-box", borderRadius: "24px", padding: "16px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
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
                <div style={{ display: "flex", gap: "12px", padding: "12px", borderRadius: "8px", backgroundColor: "#FFFBE6", border: "1px solid #FFE58F", alignItems: "flex-start" }}>
                  <Warning24Filled style={{ color: "#FAAD14", fontSize: "20px", flexShrink: 0 }} />
                  <Text style={{ color: "#856404", fontSize: "12px", lineHeight: "1.4", wordBreak: "break-word", flex: 1, minWidth: 0 }}>
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
                <div style={{ display: "flex", gap: "12px" }}>
                  <Button
                    appearance="primary"
                    shape="circular"
                    style={{ flex: 1, height: "44px", fontWeight: "600", minWidth: 0, whiteSpace: "nowrap" }}
                    disabled={!weekendCheckinReason.trim()}
                    onClick={() => {
                      const override = { isWeekend: true, weekendReason: weekendCheckinReason.trim() };
                      setPendingWeekendOverride(override);
                      setIsWeekendDialogOpen(false);
                      executeCheckInOut(override, pendingLateOverride);
                      setWeekendCheckinReason("");
                      setPendingLateOverride(undefined);
                    }}
                  >
                    Confirm Check In
                  </Button>
                  <Button
                    appearance="secondary"
                    shape="circular"
                    style={{ flex: 1, height: "44px" }}
                    onClick={() => { setIsWeekendDialogOpen(false); setWeekendCheckinReason(""); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Early Checkout Warning Dialog */}
      <Dialog open={isEarlyCheckoutDialogOpen} onOpenChange={(_, { open }) => handleEarlyCheckoutDialogClose()}>
        <DialogSurface style={{ maxWidth: "600px", width: "calc(100vw - 32px)", boxSizing: "border-box" }}>
          <DialogBody>
            <DialogTitle style={{ color: "#D13438", fontSize: "clamp(16px, 4vw, 20px)" }}>
              Early Checkout Alert
              </DialogTitle>
            <DialogContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', padding: '14px', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Warning24Filled style={{ color: "#D13438", fontSize: "22px", flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ minWidth: 0 }}>
                    <Text weight="bold" block style={{ color: '#991B1B', marginBottom: '4px' }}>Shift Not Completed</Text>
                    <Text size={200} style={{ color: '#B91C1C', wordBreak: 'break-word' }}>
                      You are checking out before your shift ends. You are expected to provide an early checkout reason for manager approval.
                    </Text>
                  </div>

                  
                </div>

                <Textarea
                  placeholder="Enter your reason for early checkout..."
                  value={earlyCheckoutReason}
                  onChange={(e) => handleEarlyCheckoutReasonChange(e.target.value)}
                  resize="vertical"
                  style={{ width: '100%' }}
                />
              </div>
            </DialogContent>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <Button
                appearance="secondary"
                shape="circular"
                style={{ flex: 1, height: '40px', minWidth: 0 }}
                onClick={() => setIsEarlyCheckoutDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                shape="circular"
                style={{ flex: 2, height: '40px', backgroundColor: '#D13438', fontWeight: 600, minWidth: 0, whiteSpace: 'nowrap' }}
                disabled={!earlyCheckoutReason.trim()}
                onClick={() => {
                  setIsEarlyCheckoutDialogOpen(false);
                  executeCheckInOut();
                }}
              >
                Confirm Checkout
              </Button>
            </div>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default AttendanceDashboard;
