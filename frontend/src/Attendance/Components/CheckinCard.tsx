import {
    Badge, Button, Text, tokens, Card,
    Toast, ToastTitle, ToastBody, Toaster, useToastController, useId,
    Dialog, DialogSurface, DialogTitle, DialogContent, DialogBody, DialogTrigger,
    Radio, Field,
    OverlayDrawer, DrawerBody, DrawerHeader, DrawerHeaderTitle,
    Input, Textarea, makeStyles,
} from "@fluentui/react-components";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../Auth/AuthProvider";
import { EntraADUser, getEntraUserById } from "../../Services/EntraADUserService";
import {
    Clock12Regular, ArrowRight12Regular,
    Location24Filled, Warning24Filled, BuildingCheckmarkFilled, History24Filled,
    DismissRegular, QuestionCircle24Filled, CheckmarkCircle48Filled,
    Location20Regular,
    CheckmarkCircle24Filled,
    DismissCircle24Filled,
} from "@fluentui/react-icons";
import {
    AttendanceRecord, getAttendanceHistory, checkIn, checkOut,
    getTodayPermissionStatus, PermissionRequest,
    createPermissionRequest, getPermissionHistory,
} from "../Services/AttendanceService";
import { getLocation, formatCoordinates } from "../../Services/GeoLocationService";
import { calculateDistance, parseCoordinates } from "../../Services/GeoUtils";
import { getLeaveHistory, LeaveRequestRecord } from "../../Services/LeaveRequestService";
import { getHolidaysByYear, Holiday } from "../../Services/HolidayService";
import { useNavigate } from "react-router-dom";
import { isEarlyCheckout as evaluateEarlyCheckout } from "../Utils/shift";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatShiftTime = (timeStr: string | null | undefined): string => {
    if (!timeStr) return "--:--";
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return "--:--";
    return date
        .toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: "UTC" })
        .toUpperCase();
};

const parseTimeToDate = (timeStr: any): Date | null => {
    if (!timeStr) return null;
    const d = new Date();
    try {
        if (timeStr instanceof Date) {
            d.setHours(timeStr.getHours(), timeStr.getMinutes(), timeStr.getSeconds(), 0);
            return d;
        }
        const t = typeof timeStr === "string" && timeStr.includes("T")
            ? timeStr.split("T")[1]
            : String(timeStr);
        const parts = t.split(":");
        if (parts.length >= 2) {
            d.setHours(parseInt(parts[0]), parseInt(parts[1]), parts[2] ? parseInt(parts[2]) : 0, 0);
            return d;
        }
    } catch {
        // ignore
    }
    return null;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
    warningBox: {
        backgroundColor: "#FEF2F2",
        border: "1px solid #FCA5A5",
        padding: "12px 16px",
        borderRadius: "8px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
    },
    radioCard: {
        border: "1.5px solid #E2E8F0",
        borderRadius: "12px",
        padding: "16px",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        ":hover": {
            borderTopColor: "#3B82F6",
            borderRightColor: "#3B82F6",
            borderBottomColor: "#3B82F6",
            borderLeftColor: "#3B82F6",
            backgroundColor: "#F8FAFC",
        },
    },
    radioCardSelected: {
        borderTopColor: "#3B82F6",
        borderRightColor: "#3B82F6",
        borderBottomColor: "#3B82F6",
        borderLeftColor: "#3B82F6",
        backgroundColor: "#EFF6FF",
        boxShadow: "0 0 0 1px #2563EB",
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
    },
});

// ─── Component ───────────────────────────────────────────────────────────────

const CheckInCard = () => {
    const styles = useStyles();
    const { currentUser } = useAuth();
    const toasterId = useId("checkin-card-toaster");
    const { dispatchToast } = useToastController(toasterId);

    // ── Attendance state ──────────────────────────────────────────────────────
    const [userData, setUserData] = useState<EntraADUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [activeRecord, setActiveRecord] = useState<AttendanceRecord | null>(null);
    const [isCheckInLoading, setIsCheckInLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // ── Dialog / location state ───────────────────────────────────────────────
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [checkInPhase, setCheckInPhase] = useState<'select_type' | 'locating' | 'geofence_result'>('select_type');
    const [selectedWorkLocation, setSelectedWorkLocation] = useState<string>("");
    const [detectedCoords, setDetectedCoords] = useState<string | null>(null);
    const [detectedAccuracy, setDetectedAccuracy] = useState<number | null>(null);
    const [isWithinGeofence, setIsWithinGeofence] = useState<boolean | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [checkInConflict, setCheckInConflict] = useState<{ type: "Holiday" | "Leave"; name?: string } | null>(null);

    // ── Early checkout state ──────────────────────────────────────────────────
    const [isEarlyCheckout, setIsEarlyCheckoutState] = useState(false);
    const [hasPermissionRequest, setHasPermissionRequest] = useState(false);
    const [isEarlyCheckoutRejected, setIsEarlyCheckoutRejected] = useState(false);
    const [isEarlyCheckoutPending, setIsEarlyCheckoutPending] = useState(false);
    const [isEarlyCheckoutDialogOpen, setIsEarlyCheckoutDialogOpen] = useState(false);

    // ── Permission drawer state ───────────────────────────────────────────────
    const [isPermissionDrawerOpen, setIsPermissionDrawerOpen] = useState(false);
    const [permissionReason, setPermissionReason] = useState("");
    const [permissionDate, setPermissionDate] = useState("");
    const [permissionStartTime, setPermissionStartTime] = useState("");
    const [permissionEndTime, setPermissionEndTime] = useState("");
    const [permissionHistory, setPermissionHistory] = useState<PermissionRequest[]>([]);
    const [isSubmittingPermission, setIsSubmittingPermission] = useState(false);

    // ── Holiday / Leave conflict state ────────────────────────────────────────
    const [allYearHolidays, setAllYearHolidays] = useState<Holiday[]>([]);
    const [leaveHistory, setLeaveHistory] = useState<LeaveRequestRecord[]>([]);

    // ── Weekend check-in state ────────────────────────────────────────────────
    const [isWeekendDialogOpen, setIsWeekendDialogOpen] = useState(false);
    const [weekendCheckinReason, setWeekendCheckinReason] = useState("");
    

    // Late checkin reason
    const [openLateCheckIn,setOpenLateCheckin] = useState(false)
    // Geocoding api

   const navigate = useNavigate()

    // ── Clock tick ────────────────────────────────────────────────────────────
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // ── Load user + today's attendance + holidays + leaves ────────────────────
    const reloadCardData = useCallback(async () => {
        if (!currentUser?.userID) return;
        try {
            setIsLoading(true);
            const [userResp, history, holidays, leaves] = await Promise.all([
                getEntraUserById(currentUser.userID),
                getAttendanceHistory(currentUser.userID, undefined, undefined, 1, 1),
                getHolidaysByYear(new Date().getFullYear()),
                getLeaveHistory(currentUser.userID),
            ]);
            if (userResp.success && userResp.data) setUserData(userResp.data);
            if (holidays) setAllYearHolidays(Array.isArray(holidays) ? holidays : (holidays as any).data ?? []);
            if (leaves?.success && leaves.data) setLeaveHistory(leaves.data);
            if (history && history.length > 0) {
                const latest = history[0];
                const checkInTime = new Date(latest.CheckIn).getTime();
                const isRecent = (Date.now() - checkInTime) < 24 * 60 * 60 * 1000;
                const isActive = !!(isRecent && latest.CheckIn && !latest.CheckOut);
                setIsCheckedIn(isActive);
                setActiveRecord(isActive ? latest : null);
            } else {
                setIsCheckedIn(false);
                setActiveRecord(null);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [currentUser?.userID]);

    useEffect(() => {
        reloadCardData();
    }, [reloadCardData]);

    // ── Auto geofence detection ───────────────────────────────────────────────
    useEffect(() => {
        const autoDetect = async () => {
            try {
                const pos = await getLocation();
                const coords = formatCoordinates(pos);
                setDetectedCoords(coords);
                setDetectedAccuracy(pos.accuracy);
                if (userData?.Office_Location_Coordinates) {
                    const office = parseCoordinates(userData.Office_Location_Coordinates);
                    const current = parseCoordinates(coords);
                    // console.log("offic:",office,"current:",current)
                    if (office && current) {
                        const dist = calculateDistance(current.lat, current.lng, office.lat, office.lng);
                        setIsWithinGeofence(dist <= 200);
                    }
                }
            } catch {
                // silent
            }
        };
        if (userData && !detectedCoords) autoDetect();
    }, [userData, detectedCoords]);

    // ── Checkout status (controls main button) ────────────────────────────────
    const getCheckOutStatus = () => {
        if (activeRecord?.CheckOut) return { disabled: true, label: "Checked Out", status: "completed", message: undefined };
        if (!isCheckedIn || !activeRecord) return { disabled: false, label: "Check In", status: "normal", message: undefined };

        const isEscalated = activeRecord.IsLocationChanged || activeRecord.ViolationType
        const approvalStatus = activeRecord.ManagerApprovalStatus;

        if (!isEscalated || approvalStatus === "Approved") {
            return { disabled: false, label: "Check Out", status: "normal", message: undefined };
        }

        if (approvalStatus === "Rejected") {
            return {
                disabled: true,
                label: "Day marked as Absent",
                status: "absent",
                message: "Day marked as Absent. Kindly appeal to your manager if you think that there is a discrepancy.",
            };
        }

        if (approvalStatus === "Pending") {
            if (userData?.EndTime) {
                const shiftEnd = parseTimeToDate(userData.EndTime);
                if (shiftEnd && currentTime >= shiftEnd) {
                    return {
                        disabled: true,
                        label: "Day marked as Absent",
                        status: "absent",
                        message: "Day marked as Absent. Kindly appeal to your manager if you think that there is a discrepancy.",
                    };
                }
            }
            return { disabled: true, label: "Awaiting Manager Approval", status: "pending", message: undefined };
        }

        return { disabled: false, label: "Check Out", status: "normal", message: undefined };
    };

    const checkoutStatus = getCheckOutStatus();

    // ── Permission drawer helpers ─────────────────────────────────────────────
    const fetchPermissionHistory = useCallback(async () => {
        if (!currentUser?.userID) return;
        const history = await getPermissionHistory(currentUser.userID);
        setPermissionHistory(history || []);
    }, [currentUser?.userID]);

    const navigateUser = useCallback(() => {
        navigate("/Attendance/MyRequests?tab=permission&action=create")
    }, [fetchPermissionHistory]);

    const handleOpenPermissionDrawer = useCallback(() => {
        setIsPermissionDrawerOpen(true);
        fetchPermissionHistory();
    }, [fetchPermissionHistory]);

    // ── Submit permission request ─────────────────────────────────────────────
    const handleSubmitPermission = async () => {
        if ( !permissionReason || !permissionDate || !permissionStartTime || !permissionEndTime) {
            dispatchToast(
                <Toast><ToastTitle>Error</ToastTitle><ToastBody>Please fill all fields.</ToastBody></Toast>,
                { intent: "error", timeout: 3000 }
            );
            return;
        }
        setIsSubmittingPermission(true);
        try {
            if (currentUser?.userID) {
                await createPermissionRequest({
                    empId: currentUser.userID,
                    // subject: permissionSubject,
                    reason: permissionReason,
                    date: permissionDate,
                    startTime: permissionStartTime,
                    endTime: permissionEndTime,
                    createdBy: currentUser.userID,
                });

                // Auto-checkout after submitting permission during early checkout
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
                        <Toast><ToastTitle>Permission Submitted ✓</ToastTitle><ToastBody>Your request has been sent to your manager.</ToastBody></Toast>,
                        { intent: "success", timeout: 4000 }
                    );
                }

                setIsPermissionDrawerOpen(false);
                setPermissionReason("");
                setPermissionDate("");
                setPermissionStartTime("");
                setPermissionEndTime("");
                fetchPermissionHistory();
            }
        } catch (err: any) {
            dispatchToast(
                <Toast><ToastTitle>Error</ToastTitle><ToastBody>{err?.message || "Failed to submit request."}</ToastBody></Toast>,
                { intent: "error", timeout: 4000 }
            );
        } finally {
            setIsSubmittingPermission(false);
        }
    };

    // ── Execute check-in / check-out ──────────────────────────────────────────
    const executeCheckInOut = useCallback(async (weekendOverride?: { isWeekend: boolean; weekendReason: string }) => {
        if (!currentUser?.userID) return;
        setIsCheckInLoading(true);
        setIsConfirmDialogOpen(false);

        try {
            if (!isCheckedIn) {
                if (activeRecord?.CheckOut) return;
                const geofenceStatus =
                    selectedWorkLocation === "Office" && isWithinGeofence === false
                        ? " - Outside Geofence"
                        : "";
                const result = await checkIn({
                    userId: currentUser.userID,
                    createdBy: currentUser.userID,
                    currentCoordinates: detectedCoords,
                    currentLocation: detectedCoords
                        ? `Detected (±${Math.round(detectedAccuracy || 0)}m accuracy)${geofenceStatus}`
                        : locationError
                        ? `Error: ${locationError}`
                        : "GPS Unavailable",
                    workLocation: selectedWorkLocation,
                    isWeekend: weekendOverride?.isWeekend ?? false,
                    weekendReason: weekendOverride?.weekendReason,
                },setOpenLateCheckin,setIsWeekendDialogOpen);

                if (result.success && result.data) {
                    setActiveRecord(result.data);
                    setIsCheckedIn(true);
                    reloadCardData();
                }

                if (result.isLocationChanged) {
                    let title = "Attendance Alert";
                    let message = "Your check-in has been flagged for manager approval.";
                    if (result.violationType === "Late") {
                        title = "Late Arrival Recorded";
                        message = "You have checked in after the grace period.";
                    } else if (result.violationType === "Location") {
                        title = "Outside Office Perimeter";
                        message = "You checked in from outside your assigned office. Your manager has been notified.";
                    } else if (result.violationType === "Both") {
                        title = "Late & Off-site Check-in";
                        message = "Your check-in is both late and outside the assigned office. Manager notification sent.";
                    }
                    dispatchToast(
                        <Toast><ToastTitle>{title}</ToastTitle><ToastBody>{message}</ToastBody></Toast>,
                        { intent: "warning", timeout: 6000 }
                    );
                } else {
                    dispatchToast(
                        <Toast><ToastTitle>Checked In ✓</ToastTitle><ToastBody>Your attendance has been recorded successfully.</ToastBody></Toast>,
                        { intent: "success", timeout: 4000 }
                    );
                }
            } else {
                await checkOut({ userId: currentUser.userID, modifiedBy: currentUser.userID });
                setIsCheckedIn(false);
                reloadCardData();
                dispatchToast(
                    <Toast><ToastTitle>Checked Out ✓</ToastTitle><ToastBody>Your shift has ended. Have a great day!</ToastBody></Toast>,
                    { intent: "success", timeout: 4000 }
                );
            }
        } catch (error: any) {
            if (error?.response?.data?.isWeekend || error?.isWeekend) {
                setIsWeekendDialogOpen(true);
                return;
            }

            dispatchToast(
                <Toast>
                    <ToastTitle>Error</ToastTitle>
                    <ToastBody>{error?.response?.data?.message || error.message || "An error occurred."}</ToastBody>
                </Toast>,
                { intent: "error", timeout: 5000 }
            );
        } finally {
            setIsCheckInLoading(false);
        }
    }, [
        currentUser?.userID, isCheckedIn, dispatchToast,
        detectedCoords, detectedAccuracy, locationError,
        selectedWorkLocation, isWithinGeofence, activeRecord, reloadCardData,
    ]);

    // ── Handle button click ───────────────────────────────────────────────────
    const handleCheckInOut = useCallback(async () => {
        if (isCheckedIn) {
            // Check for early checkout
            let earlyCheckout = false;
            if (userData?.EndTime) {
                earlyCheckout = evaluateEarlyCheckout(
                    parseTimeToDate(userData.EndTime),
                    activeRecord?.CheckIn,
                    new Date()
                );
            }

            if (earlyCheckout) {
                setIsEarlyCheckoutState(true);
                try {
                    setIsCheckInLoading(true);
                    const status: PermissionRequest | null = await getTodayPermissionStatus(currentUser?.userID || "");
                    if (!status) {
                        setIsEarlyCheckoutDialogOpen(true);
                        return;
                    }
                    setHasPermissionRequest(true);
                    setIsEarlyCheckoutRejected(status.ApprovalStatus === "Rejected");
                    setIsEarlyCheckoutPending(status.ApprovalStatus === "Pending");
                } catch {
                    setHasPermissionRequest(false);
                } finally {
                    setIsCheckInLoading(false);
                }
            } else {
                setIsEarlyCheckoutState(false);
                setIsEarlyCheckoutRejected(false);
                setIsEarlyCheckoutPending(false);
                setHasPermissionRequest(false);
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

            // Check-in: detect holiday / approved leave conflicts
            const todayStr = new Date().toISOString().split("T")[0];

            const holidayToday = allYearHolidays.find(h => {
                const d = new Date(h.HolidayDate);
                return d.toISOString().split("T")[0] === todayStr && h.HolidayType?.trim()?.toLowerCase() !== 'optional';
            });

            if (holidayToday) {
                setCheckInConflict({ type: "Holiday", name: holidayToday.HolidayName });
            } else {
                const leaveToday = leaveHistory.find(l => {
                    if (l.ApprovalStatus !== "Approved") return false;
                    const stStr = new Date(l.Start_Date).toISOString().split("T")[0];
                    const enStr = new Date(l.End_Date).toISOString().split("T")[0];
                    return todayStr >= stStr && todayStr <= enStr;
                });
                setCheckInConflict(leaveToday ? { type: "Leave", name: leaveToday.LeaveName } : null);
            }

            // Reset to Phase 0: work type selection
            setCheckInPhase('select_type');
            setSelectedWorkLocation('');
            setIsWithinGeofence(null);
            setDetectedCoords(null);
            setDetectedAccuracy(null);
            setLocationError(null);
            setIsConfirmDialogOpen(true);
        }
    }, [
        isCheckedIn, userData, currentUser?.userID, dispatchToast,
        navigateUser, allYearHolidays, leaveHistory,
    ]);

    // ── Called when user taps "Next" after picking their work type ────────────
    const handleWorkTypeNext = useCallback(async () => {
        if (!selectedWorkLocation) return;

        if (selectedWorkLocation === 'Office') {
            setCheckInPhase('locating');
            setIsCheckInLoading(true);
            try {
                const pos = await getLocation();
                const coords = formatCoordinates(pos);
                setDetectedCoords(coords);
                setDetectedAccuracy(pos.accuracy);
                setLocationError(null);
                if (userData?.Office_Location_Coordinates) {
                    const office = parseCoordinates(userData.Office_Location_Coordinates);
                    const current = parseCoordinates(coords);
                    if (office && current) {
                        setIsWithinGeofence(calculateDistance(current.lat, current.lng, office.lat, office.lng) <= 200);
                    } else {
                        console.error("[Geofence] Failed to parse coordinates — office:", userData.Office_Location_Coordinates, "current:", coords);
                        setIsWithinGeofence(null);
                        setLocationError("Could not parse your office location coordinates. Contact your administrator.");
                    }
                } else {
                    setIsWithinGeofence(null);
                    setLocationError("Office location coordinates are not configured for your profile. Contact your administrator.");
                }
            } catch (err: any) {
                setLocationError(err.message);
                setIsWithinGeofence(null);
            } finally {
                setIsCheckInLoading(false);
                setCheckInPhase('geofence_result');
            }
        } else {
            setCheckInPhase('geofence_result');
        }
    }, [selectedWorkLocation, userData]);

    const getLiveTime = () =>
        currentTime
            .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
            .toUpperCase();

    if (isLoading) {
        return (
            <div
                className="flex items-center justify-center rounded-2xl shadow-sm"
                style={{
                    padding: "32px 28px",
                    minWidth: "320px",
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    background:
                        "radial-gradient(120% 160% at 10% 10%, rgba(195,184,245,0.4) 0%, rgba(184,198,242,0.3) 35%, rgba(227,212,243,0.3) 70%, rgba(243,228,242,0.4) 100%)",
                }}
            >
                <Text style={{ color: "#475569" }}>Loading...</Text>
            </div>
        );
    }

    return (
        <>
            <Toaster toasterId={toasterId} position="top-end" />

            {/* ── Main card ── */}
            <div
                className="flex items-center justify-center rounded-2xl shadow-sm"
                style={{
                    padding: "32px 28px",
                    minWidth: "320px",
                    width: "100%",
                    height: "100%",
                    boxSizing: "border-box",
                    background:
                        "radial-gradient(120% 160% at 10% 10%, rgba(195,184,245,0.4) 0%, rgba(184,198,242,0.3) 35%, rgba(227,212,243,0.3) 70%, rgba(243,228,242,0.4) 100%)",
                }}
            >
                <div className="flex flex-col items-center" style={{ gap: "20px", width: "100%" }}>
                    {/* Status badge */}
                    <Badge
                        className={`!bg-[rgba(255,255,255,0.8)] ${activeRecord && !activeRecord.CheckOut ? "!text-[#1848a8]" : "!text-[#334155]"} flex items-center gap-1.5 !px-5 !py-2.5`}
                        style={{ fontSize: "13px", fontWeight: 600 }}
                    >
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-current" />
                        </span>
                        {activeRecord ? (activeRecord.CheckOut ? "Checked Out" : "Working") : "Not Checked In"}
                    </Badge>

                    {/* Live clock */}
                    <div className="flex flex-col items-center gap-2 text-center">
                        <Text weight="bold" style={{ color: tokens.colorNeutralForeground1, fontSize: "48px", lineHeight: 1, letterSpacing: "-1px" }}>
                            {getLiveTime()}
                        </Text>
                        <Text style={{ fontSize: "14px", color: "#475569", fontWeight: 500 }}>
                            {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                        </Text>
                    </div>

                    {/* Shift time range */}
                    <Badge className="!bg-[rgba(255,255,255,0.8)] flex items-center gap-2 !px-5 !py-2.5 !border !border-white/20 !text-[#334155]">
                        <Clock12Regular color="#334155" />
                        <Text style={{ color: "#334155", fontSize: "13px", fontWeight: 500 }}>{formatShiftTime(activeRecord?.CheckIn)}</Text>
                        <ArrowRight12Regular color="#334155" />
                        <Text style={{ fontSize: "13px", color: "#334155", fontWeight: 500 }}>{formatShiftTime(activeRecord?.CheckOut)}</Text>
                    </Badge>

                    {/* ── Single action button ── */}
                    <Button
                        appearance="primary"
                        onClick={handleCheckInOut}
                        disabled={isCheckInLoading || checkoutStatus.disabled}
                        style={{
                            borderRadius: "50px",
                            padding: "14px 40px",
                            fontWeight: 700,
                            fontSize: "15px",
                            minWidth: "180px",
                            ...(isCheckedIn
                                ? {
                                        background: "linear-gradient(180deg,#E94F4F,#CF3F3F)",
                                        boxShadow: "0 10px 20px rgba(233, 79, 79, .35), inset 0 -2px 0 rgba(0, 0, 0, .08)",
                                        color:"#FFFF"
                                    }
                                : {
                                    background: "linear-gradient(180deg, #25B45E, #1FA452)",
                                    boxShadow: "0 10px 20px rgba(31, 169, 113, .35), inset 0 -2px 0 rgba(0, 0, 0, .08)"
                                }),
                        }}
                    >
                        {isCheckInLoading
                            ? (isCheckedIn ? "Checking Out..." : "Getting Location...")
                            : checkoutStatus.label}
                    </Button>

                    {/* Absent warning message */}
                    {checkoutStatus.status === "absent" && checkoutStatus.message && (
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                padding: "12px",
                                borderRadius: "8px",
                                backgroundColor: "#FEF2F2",
                                border: "1px solid #FEE2E2",
                                maxWidth: "280px",
                            }}
                        >
                            <Warning24Filled style={{ color: "#D13438", fontSize: "16px", flexShrink: 0 }} />
                            <Text style={{ color: "#991B1B", fontSize: "12px", lineHeight: 1.4, fontWeight: 600 }}>
                                {checkoutStatus.message}
                            </Text>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Confirmation Dialog ── */}
            <Dialog open={isConfirmDialogOpen} onOpenChange={(_, data) => setIsConfirmDialogOpen(data.open)}>
                <DialogSurface style={{ maxWidth: "400px", borderRadius: "24px", padding: "16px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                    <DialogBody>
                        <DialogTitle>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ backgroundColor: "#007ED5", color: "white", borderRadius: "8px", padding: "6px", display: "flex" }}>
                                        <Location24Filled />
                                    </div>
                                    <Text weight="bold" size={400}>{isCheckedIn ? "Check Out" : "Check In"}</Text>
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
                                                <div className={styles.floatingPill} style={{ top: '20px', left: '20px' }}>
                                                    <Location20Regular style={{ color: '#2563EB' }} />
                                                    <Text>{(userData as any)?.Office_Location || "Main Office"}</Text>
                                                </div>
                                                <div className={styles.floatingPill} style={{ bottom: '20px', right: '20px' }}>
                                                    <Location20Regular style={{ color: '#EF4444' }} />
                                                    <Text>accuracy ±{detectedAccuracy ? Math.round(detectedAccuracy) : "…"}m</Text>
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
                                            {/* Office: Inside geofence */}
                                            {selectedWorkLocation === 'Office' && isWithinGeofence === true && (
                                                <div style={{ textAlign: 'center', padding: '24px 0 16px 0' }}>
                                                    <div style={{ backgroundColor: '#F0FDF4', color: '#16A34A', borderRadius: '50%', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.1)' }}>
                                                        <CheckmarkCircle48Filled style={{ fontSize: '40px' }} />
                                                    </div>
                                                    <Text size={600} weight="bold" block style={{ color: '#111827', lineHeight: '1.3',textAlign:'center' }}>You're at {(userData as any)?.Office_Location || "the Office"}</Text>
                                                    <Text size={300} block style={{ color: '#6B7280', marginTop: '12px', lineHeight: '1.5',textAlign:'center' }}>Everything looks good. You can proceed to check in.</Text>
                                                    <div style={{ marginTop: '32px', backgroundColor: '#F8FAFC', borderRadius: '16px', padding: '16px', border: '1px solid #E2E8F0' }}>
                                                        <Text size={100} weight="bold" block style={{ color: '#64748B', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.02em' }}>ACCURACY</Text>
                                                        <Text weight="bold" size={300} style={{ color: '#1E293B' }}>±{detectedAccuracy ? Math.round(detectedAccuracy) : "18"}m · Coordinates Captured</Text>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Office: Outside geofence */}
                                            {selectedWorkLocation === 'Office' && isWithinGeofence === false && (
                                                <div style={{ padding: '4px' }}>
                                                    <div className={styles.warningBox} style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A', marginBottom: '16px' }}>
                                                        <Warning24Filled style={{ color: '#D97706', fontSize: '24px', flexShrink: 0 }} />
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            <Text weight="bold" style={{ color: '#92400E' }}>Outside Office Perimeter</Text>
                                                            <Text size={200} style={{ color: '#78350F' }}>
                                                                You are not within your assigned office geofence. Checking in will flag your attendance for manager review and approval.
                                                            </Text>
                                                        </div>
                                                    </div>
                                                    <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '12px', border: '1px solid #E2E8F0' }}>
                                                        <Text size={100} weight="bold" block style={{ color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>DETECTED ACCURACY</Text>
                                                        <Text size={200} style={{ color: '#1E293B' }}>±{detectedAccuracy ? Math.round(detectedAccuracy) : "?"}m</Text>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Office: GPS failed / unknown */}
                                            {selectedWorkLocation === 'Office' && isWithinGeofence === null && (
                                                <div className={styles.warningBox} style={{ backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' }}>
                                                    <QuestionCircle24Filled style={{ color: '#64748B', fontSize: '24px', flexShrink: 0 }} />
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <Text weight="bold" style={{ color: '#1E293B' }}>Location Unavailable</Text>
                                                        <Text size={200} style={{ color: '#64748B' }}>
                                                            {locationError ?? 'Could not determine your location. You may still check in, and it will be flagged for review.'}
                                                        </Text>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Work From Home */}
                                            {selectedWorkLocation === 'WorkFromHome' && (
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

                                            {/* Customer Site */}
                                            {selectedWorkLocation === 'CustomerSite' && (
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

                                            {/* Other */}
                                            {selectedWorkLocation === 'Other' && (
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
                                                    {checkInConflict ? 'Back to Dashboard' : 'Cancel'}
                                                </Button>
                                            </DialogTrigger>
                                        )}

                                        {/* Phase 0: Next button */}
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

                                        {/* Phase 2: Check In button */}
                                        {checkInPhase === 'geofence_result' && !checkInConflict && (
                                            <Button
                                                appearance="primary"
                                                shape="circular"
                                                style={{
                                                    flex: 1,
                                                    height: '44px',
                                                    fontWeight: 'bold',
                                                    backgroundColor: (selectedWorkLocation === 'Office' && isWithinGeofence === false) ? '#D97706' : '#2563EB',
                                                }}
                                                onClick={() => executeCheckInOut()}
                                            >
                                                {selectedWorkLocation === 'Office' && isWithinGeofence === false ? 'Continue Anyway' : 'Check In Now'}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- CHECK OUT FLOW --- */}
                            {isCheckedIn && (
                                <div style={{ padding: '8px 0' }}>
                                    {isEarlyCheckout ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {!hasPermissionRequest ? (
                                                <div className={styles.warningBox}>
                                                    <Warning24Filled style={{ color: "#D13438", fontSize: "24px", flexShrink: 0 }} />
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <Text weight="bold" style={{ color: '#991B1B' }}>Permission Required</Text>
                                                        <Text size={200} style={{ color: '#B91C1C' }}>
                                                            You are checking out early. This requires an authorized permission request.
                                                        </Text>
                                                    </div>
                                                </div>
                                            ) : isEarlyCheckoutRejected ? (
                                                <div className={styles.warningBox}>
                                                    <DismissCircle24Filled style={{ color: "#D13438", fontSize: "24px", flexShrink: 0 }} />
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <Text weight="bold" style={{ color: '#991B1B' }}>Request Rejected</Text>
                                                        <Text size={200} style={{ color: '#B91C1C' }}>
                                                            Your early checkout request was rejected. You cannot proceed at this time.
                                                        </Text>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{ backgroundColor: '#F0FDF4', padding: '16px', borderRadius: '12px', border: '1px solid #BBF7D0', display: 'flex', gap: '12px' }}>
                                                    <CheckmarkCircle24Filled style={{ color: '#16A34A' }} />
                                                    <Text style={{ color: '#166534' }}>
                                                        Your early checkout {isEarlyCheckoutPending ? "request is pending" : "was approved"}. You can proceed now.
                                                    </Text>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                            <Text size={400} weight="semibold">Are you sure you want to check out?</Text>
                                            <Text size={200} block style={{ color: '#6B7280', marginTop: '4px' }}>This will complete your attendance period for today.</Text>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                                        <Button
                                            appearance="primary"
                                            shape="circular"
                                            style={{ flex: 1, backgroundColor: '#2563EB', height: '44px', fontWeight: 'bold' }}
                                            onClick={() => executeCheckInOut()}
                                            disabled={isEarlyCheckout && (!hasPermissionRequest || isEarlyCheckoutRejected)}
                                        >
                                            Confirm Check Out
                                        </Button>

                                        {isEarlyCheckout && !hasPermissionRequest && (
                                            <Button
                                                appearance="outline"
                                                shape="circular"
                                                style={{ flex: 1, height: '44px' }}
                                                onClick={() => { setIsConfirmDialogOpen(false); handleOpenPermissionDrawer(); }}
                                            >
                                                Request Permission
                                            </Button>
                                        )}

                                        <DialogTrigger disableButtonEnhancement>
                                            <Button appearance="secondary" shape="circular" style={{ flex: 1, height: '44px' }}>Cancel</Button>
                                        </DialogTrigger>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            {/* ── Early Checkout Alert Dialog ── */}
            <Dialog open={isEarlyCheckoutDialogOpen} onOpenChange={(_, { open }) => setIsEarlyCheckoutDialogOpen(open)}>
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle style={{ color: "#D13438" }}>Early Checkout Alert</DialogTitle>
                        <DialogContent>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px' }}>
                                    <Warning24Filled style={{ color: "#D13438", fontSize: "28px" }} />
                                    <div>
                                        <Text weight="bold" block style={{ color: '#991B1B', marginBottom: '4px' }}>Shift Not Completed</Text>
                                        <Text size={200} style={{ color: '#B91C1C' }}>
                                            You are checking out before your shift ends. You are expected to provide an early checkout reason for manager approval.
                                        </Text>
                                    </div>
                                </div>
                                <Text>Please request an official permission for this early departure to avoid being marked as absent or having a policy violation.</Text>
                            </div>
                        </DialogContent>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <Button appearance="secondary" shape="circular" onClick={() => setIsEarlyCheckoutDialogOpen(false)}>Cancel</Button>
                            <Button
                                appearance="primary"
                                shape="circular"
                                style={{ backgroundColor: '#D13438' }}
                                onClick={() => {
                                    setIsEarlyCheckoutDialogOpen(false);
                                    navigate("/Attendance/MyRequests?tab=permission&action=create");
                                }}
                            >
                                Request Permission
                            </Button>
                        </div>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            {/* ── Permission Request Drawer ── */}
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

                <DrawerBody style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                        Submit a permission request to checkout early or for other short-term absences.
                    </Text>

                    {/* <Field label="Subject" required>
                        <Input value={permissionSubject} onChange={(_, d) => setPermissionSubject(d.value)} placeholder="E.g., Doctor Appointment" />
                    </Field> */}

                    <Field label="Date" required>
                        <Input type="date" value={permissionDate} onChange={(_, d) => setPermissionDate(d.value)} />
                    </Field>

                    <div style={{ display: "flex", gap: "12px" }}>
                        <Field label="Start Time" required style={{ flex: 1 }}>
                            <Input type="time" value={permissionStartTime} onChange={(_, d) => setPermissionStartTime(d.value)} />
                        </Field>
                        <Field label="End Time" required style={{ flex: 1 }}>
                            <Input type="time" value={permissionEndTime} onChange={(_, d) => setPermissionEndTime(d.value)} />
                        </Field>
                    </div>

                    <Field label="Reason" required>
                        <Textarea value={permissionReason} onChange={(_, d) => setPermissionReason(d.value)} placeholder="Provide specific reason..." rows={4} />
                    </Field>

                    <Button
                        appearance="primary"
                        onClick={handleSubmitPermission}
                        disabled={isSubmittingPermission}
                        style={{ marginTop: "8px" }}
                    >
                        {isSubmittingPermission ? "Submitting..." : "Submit Request"}
                    </Button>

                    <div style={{ marginTop: "24px" }}>
                        <Text weight="bold" size={400} block style={{ marginBottom: "12px" }}>Recent Requests</Text>
                        {permissionHistory.length === 0 ? (
                            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>No recent requests found.</Text>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {permissionHistory.map((req) => (
                                    <Card key={req.ID} style={{ padding: "12px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                            <Text weight="semibold">Permission Request</Text>
                                            <Badge
                                                appearance="filled"
                                                color={req.ApprovalStatus === "Approved" ? "success" : req.ApprovalStatus === "Rejected" ? "danger" : "warning"}
                                            >
                                                {req.ApprovalStatus}
                                            </Badge>
                                        </div>
                                        <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                                            {req.Date} · {req.StartTime} – {req.EndTime}
                                        </Text>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </DrawerBody>
            </OverlayDrawer>

            {/* ── Weekend Check-in Reason Dialog ── */}
            <Dialog open={isWeekendDialogOpen} onOpenChange={(_, data) => { setIsWeekendDialogOpen(data.open); if (!data.open) setWeekendCheckinReason(""); }}>
                <DialogSurface style={{ maxWidth: "400px", borderRadius: "24px", padding: "16px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
                    <DialogBody>
                        <DialogTitle>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <div style={{ backgroundColor: "#F59E0B", color: "white", borderRadius: "8px", padding: "6px", display: "flex" }}>
                                        <Warning24Filled />
                                    </div>
                                    <Text weight="bold" size={400}>Weekend Check-in</Text>
                                </div>
                                <DialogTrigger disableButtonEnhancement>
                                    <Button appearance="transparent" icon={<DismissRegular />} />
                                </DialogTrigger>
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
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <Button
                                        appearance="primary"
                                        style={{ flex: 1, height: "44px", fontWeight: "600", borderRadius: "12px" }}
                                        disabled={!weekendCheckinReason.trim()}
                                        onClick={() => {
                                            setIsWeekendDialogOpen(false);
                                            executeCheckInOut({ isWeekend: true, weekendReason: weekendCheckinReason.trim() });
                                            setWeekendCheckinReason("");
                                        }}
                                    >
                                        Confirm Check In
                                    </Button>
                                    <DialogTrigger disableButtonEnhancement>
                                        <Button appearance="secondary" style={{ flex: 1, height: "44px", borderRadius: "12px" }}>Cancel</Button>
                                    </DialogTrigger>
                                </div>
                            </div>
                        </DialogContent>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </>
    );
};

export default CheckInCard;
