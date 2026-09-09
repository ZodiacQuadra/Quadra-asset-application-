import React, { useState, useEffect, useId, useRef } from "react";
import {
  Button,
  CardPreview,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Body1Strong,
  Toast,
  ToastTitle,
  ToastBody,
  useToastController,
  Toaster,
  Spinner,
  Text,
  Subtitle2,
  Caption1,
  FluentProvider,
  SearchBox,
  Select,
  Tooltip,
  MessageBar,
  MessageBarTitle,
  MessageBarBody,
  Checkbox,
  Avatar,
  Dropdown,
  Option,
  Field,
  Switch,
  OverlayDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerFooter,
  Label,
  Badge,
  Card,
  CardHeader,
  Input,
} from "@fluentui/react-components";
import {
  PersonRegular,
  ArrowSyncRegular,
  CheckmarkCircle20Regular,
  ErrorCircle20Regular,
  BriefcaseRegular,
  EditRegular,
  SaveRegular,
  DismissRegular,
  TimerRegular,
  PlayCircle20Regular,
  People16Regular,
  Clock16Regular,
  Filter20Regular,
  BuildingRegular,
  ArrowSortRegular,
  ArrowSortUpRegular,
  ArrowSortDownRegular,
  LockClosedRegular,
  Eye20Regular,
  Globe20Regular,
  Search20Regular,
  Dismiss20Regular,
  MyLocation20Regular,
} from "@fluentui/react-icons";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { useAuth } from "../../Auth/AuthProvider";
import {
  getAllEntraUsers,
  syncEntraUsers,
  bulkUpdateUserShifts,
  bulkUpdateUserLocations,
  bulkUpdateUserWeekOff,
  upsertAdditionalApprovers,
  bulkUpdateUserLeaveRole,
  EntraADUser,
  EntraADUserStats,
  AdditionalApprover,
  EscalationReviewer,
  updateUserStatus,
} from "../../Services/EntraADUserService";
import { GetEmployeeLeavePolicies, EmpLeavePolicyItem } from "../../Services/EmployeeLeavePolicyService";
import { getAllShifts, Shift } from "../../Services/ShiftService";
import { getAppLocations, AppLocation } from "../../Services/Location";
import CustomStatsCard from "../../Recruit/Components/CustomStatsCard";
import CustomPagination from "../../Recruit/Components/CustomPagination";
import { StatusUpdateDialog } from "../Components/StatusUpdateDialog";
import { useNavigate } from "react-router-dom";
import { DatePicker } from "@fluentui/react-datepicker-compat";

// =============================================
// Map helpers
// =============================================

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

const FlyToLocation: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.flyTo(center, 15, { animate: true, duration: 1 }); }, [center, map]);
  return null;
};

const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({ click(e) { onMapClick(e.latlng.lat, e.latlng.lng); } });
  return null;
};

const InvalidateSize: React.FC = () => {
  const map = useMap();
  useEffect(() => { map.invalidateSize(); }, [map]);
  return null;
};

// =============================================
// Component
// =============================================

const formatTime = (timeStr?: any): string => {
  if (!timeStr) return "—";

  let h: number, m: number;

  if (typeof timeStr === "string" && !timeStr.includes("T")) {
    const parts = timeStr.split(":").map(Number);
    h = parts[0];
    m = parts[1];
  } else {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return "—";
    h = date.getUTCHours();
    m = date.getUTCMinutes();
  }

  if (isNaN(h) || isNaN(m)) return "—";

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

// Location codes that let the user capture custom coordinates via the map picker
const CUSTOM_COORDINATE_CODES = ["wfh", "cs"];
const usesCustomCoordinates = (code?: string | null) =>
  !!code && CUSTOM_COORDINATE_CODES.includes(code.toLowerCase());

function ShiftManagement() {
  // State
  const [users, setUsers] = useState<EntraADUser[]>([]);
  const [stats, setStats] = useState<EntraADUserStats | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [appLocations, setAppLocations] = useState<AppLocation[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("all");
  const [selectedCardFilter, setSelectedCardFilter] = useState<string>("all");

  // Bulk Edit State
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [bulkShiftId, setBulkShiftId] = useState<string>("");
  const [assignNow,setAssignNow] = useState(false)
  const [shiftEffectiveDate,setShiftEffectiveDate] = useState<null|string>(null)
  const [bulkLocation, setBulkLocation] = useState<string>("");
  const [bulkIsRotationalOff, setIsBulkRotationalOff] = useState<boolean>(false)
  const [bulkRotationalOffTouched, setBulkRotationalOffTouched] = useState<boolean>(false)
  const [bulkIncludeSelfEscalation, setBulkIncludeSelfEscalation] = useState<boolean>(false)
  const [bulkOffDay, setBulkOffDay] = useState<string[]>([])
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isBulkDrawerOpen, setIsBulkDrawerOpen] = useState(false);
  const [shiftIsMixed, setShiftIsMixed] = useState(false);
  const [locationIsMixed, setLocationIsMixed] = useState(false);

  // Additional Approvers State
  const [additionalApprovers, setAdditionalApprovers] = useState<EntraADUser[]>([]);
  const [approverRequestType, setApproverRequestType] = useState<string>("");
  const [approverPickerSearch, setApproverPickerSearch] = useState<string>("");
  const [approverPickerResults, setApproverPickerResults] = useState<EntraADUser[]>([]);
  const [isApproverPickerOpen, setIsApproverPickerOpen] = useState<boolean>(false);
  const [isSavingApprovers, setIsSavingApprovers] = useState<boolean>(false);

  // Escalation Reviewer State (people picker, max 3)
  const [escalationReviewers, setEscalationReviewers] = useState<EntraADUser[]>([]);
  const [escalationReviewerSearch, setEscalationReviewerSearch] = useState<string>("");
  const [escalationReviewerResults, setEscalationReviewerResults] = useState<EntraADUser[]>([]);
  const [isEscalationReviewerPickerOpen, setIsEscalationReviewerPickerOpen] = useState<boolean>(false);
  const [bulkLeaveRole, setBulkLeaveRole] = useState<string>("");
  const [leaveRoleIsMixed, setLeaveRoleIsMixed] = useState(false);
  const [empLeaveRoles, setEmpLeaveRoles] = useState<{ empRoleID: string; employeeRole: string }[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalFilteredRows, setTotalFilteredRows] = useState(0);

  // Status Update Dialog State
  const [UserStatusUpdate, setUserStatusUpdate] = useState<{ user: EntraADUser | null; newStatus: boolean; open: boolean }>({ user: null, newStatus: false, open: false });
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Sort state (client-side, current page only)
  const [sortColumn, setSortColumn] = useState<string>("DisplayName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const totalPages = Math.ceil(totalFilteredRows / pageSize) || 1;

  const toastId = useId();
  const { dispatchToast } = useToastController(toastId);
  const { currentUser, accessToken } = useAuth() as any;


  const [pickFromMap,setPickFromMap] = useState(false)

  const [mapData, setMapData] = useState({ lat: "", lng: "", name: "" });

  // Map picker state
  const [showMap, setShowMap] = useState(false);
  const [markerPos, setMarkerPos] = useState<[number, number] | null>(null);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const defaultCenter: [number, number] = [20.5937, 78.9629];
  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser?.accessToken) {
      fetchShifts();
      fetchAppLocations();
      fetchEmpLeaveRoles();
    } else {
      // Fallback to localStorage if context not ready
      fetchShifts();
      fetchAppLocations();
      fetchEmpLeaveRoles();
    }
  }, [currentUser?.accessToken]);

  // Fetch data when page, size, search, department, shift or card filter changes
  useEffect(() => {
    fetchData();
  }, [currentPage, pageSize, debouncedSearch, selectedDepartment, selectedShift, selectedCardFilter]);

  // Pre-fill bulk drawer with existing values when it opens
  useEffect(() => {
    if (!isBulkDrawerOpen) return;

    const selectedUsers = Array.from(selectedUserIds)
      .map((id) => users.find((u) => u.ID === id))
      .filter(Boolean) as EntraADUser[];

    if (selectedUsers.length === 0) return;

    // Shift pre-fill
    const shiftIds = selectedUsers.map((u) => u.ShiftID);
    const allSameShift = shiftIds.every((id) => id === shiftIds[0]);
    if (allSameShift) {
      // null means unassigned — leave bulkShiftId as "" so user must explicitly pick
      setBulkShiftId(shiftIds[0] === null ? "" : String(shiftIds[0]));
      setShiftIsMixed(false);
    } else {
      setBulkShiftId("__mixed__");
      setShiftIsMixed(true);
    }

    // Location pre-fill
    const locations = selectedUsers.map((u) => u.Office_Location ?? null);
    const allSameLocation = locations.every((loc) => loc === locations[0]);
    if (allSameLocation) {
      // null/empty means unassigned — leave bulkLocation as "" so user must explicitly pick
      const prefilledLocation = locations[0] ? locations[0] : "";
      setBulkLocation(prefilledLocation);
      setLocationIsMixed(false);

      // If the pre-filled location captures custom coordinates (WFH / CS),
      // open the map and pre-populate coordinates
      if (prefilledLocation) {
        const matchedAppLocation = appLocations.find((loc) => loc.Name === prefilledLocation);
        if (usesCustomCoordinates(matchedAppLocation?.Code)) {
          setPickFromMap(true);
          const coordStr = selectedUsers[0].Office_Location_Coordinates ?? "";
          if (coordStr) {
            const parts = coordStr.split(",").map((s) => s.trim());
            const lat = parseFloat(parts[0]);
            const lng = parseFloat(parts[1]);
            if (!isNaN(lat) && !isNaN(lng)) {
              setMapData({ lat: parts[0], lng: parts[1], name: "" });
              setMarkerPos([lat, lng]);
              setFlyTo([lat, lng]);
              setShowMap(true);
            }
          } else {
            setShowMap(true);
          }
        } else {
          setPickFromMap(false);
          setMapData({ lat: "", lng: "", name: "" });
          setMarkerPos(null);
          setFlyTo(null);
          setShowMap(false);
        }
      }
    } else {
      setBulkLocation("__mixed__");
      setLocationIsMixed(true);
    }

    // Rotational Off — pre-fill based on User_24_7 (same logic as shift/location)
    const rotationalValues = selectedUsers.map((u) => u.User_24_7);
    const allSameRotational = rotationalValues.every((v) => v === rotationalValues[0]);
    setIsBulkRotationalOff(allSameRotational ? (rotationalValues[0] ?? false) : false);
    setBulkRotationalOffTouched(false);

    // Include self while escalation — pre-fill only when a single user is selected
    if (selectedUsers.length === 1) {
      setBulkIncludeSelfEscalation(!!selectedUsers[0].IncludeInEscalation);
    } else {
      setBulkIncludeSelfEscalation(false);
    }

    // Off Days — pre-fill if all selected users are 24/7 and share the same OffDays
    if (allSameRotational && rotationalValues[0] === true) {
      const offDayValues = selectedUsers.map((u) => u.OffDays ?? null);
      const allSameOffDays = offDayValues.every((v) => v === offDayValues[0]);
      if (allSameOffDays && offDayValues[0]) {
        const parsed = offDayValues[0].split(",").map((d) => d.trim()).filter(Boolean);
        setBulkOffDay(parsed);
      } else {
        setBulkOffDay([]);
      }
    } else {
      setBulkOffDay([]);
    }

    // Additional Approvers — pre-fill only when a single user is selected
    if (selectedUsers.length === 1 && selectedUsers[0].AdditionalApprovers) {
      try {
        const parsed: AdditionalApprover[] = JSON.parse(selectedUsers[0].AdditionalApprovers);
        if (parsed.length > 0) {
          setApproverRequestType(parsed[0].RequestType);
          setAdditionalApprovers(
            parsed.map((a) => ({
              ID: a.ApproverId,
              DisplayName: a.DisplayName || a.ApproverId,
              Mail: "", JobTitle: "", Department: "",
              AccountEnabled: true, ADAccountEnabled: true,
              ShiftID: null, ShiftName: null,
              User_24_7: false, LastSyncedAt: "",
            } as EntraADUser))
          );
        }
      } catch { /* ignore malformed JSON */ }
    } else {
      setAdditionalApprovers([]);
      setApproverRequestType("");
    }

    // Escalation Reviewers — pre-fill only when a single user is selected
    if (selectedUsers.length === 1 && selectedUsers[0].EscalationReviewers) {
      try {
        const parsed: EscalationReviewer[] = JSON.parse(selectedUsers[0].EscalationReviewers);
        setEscalationReviewers(
          parsed.map((r) => ({
            ID: r.ReviewerId,
            DisplayName: r.DisplayName || r.ReviewerId,
            Mail: "", JobTitle: "", Department: "",
            AccountEnabled: true, ADAccountEnabled: true,
            ShiftID: null, ShiftName: null,
            User_24_7: false, LastSyncedAt: "",
          } as EntraADUser))
        );
      } catch { /* ignore malformed JSON */ }
    } else {
      setEscalationReviewers([]);
    }

    // Leave Role pre-fill
    const leaveRoles = selectedUsers.map((u) => u.EmpLeaveTypeID ?? null);
    const allSameLeaveRole = leaveRoles.every((r) => r === leaveRoles[0]);
    if (allSameLeaveRole) {
      setBulkLeaveRole(leaveRoles[0] ? leaveRoles[0] : "");
      setLeaveRoleIsMixed(false);
    } else {
      setBulkLeaveRole("__mixed__");
      setLeaveRoleIsMixed(true);
    }
  }, [isBulkDrawerOpen]);

  // Handle Search Debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to first page on new search
    }, 500);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Debounced approver picker search
  useEffect(() => {
    if (!approverPickerSearch || approverPickerSearch.length < 2) {
      setApproverPickerResults([]);
      setIsApproverPickerOpen(false);
      return;
    }
    const handler = setTimeout(async () => {
      const res = await getAllEntraUsers(1, 8, approverPickerSearch);
      if (res.success && res.data?.users) {
        setApproverPickerResults(res.data.users);
        setIsApproverPickerOpen(true);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [approverPickerSearch]);

  // Debounced escalation reviewer picker search
  useEffect(() => {
    if (!escalationReviewerSearch || escalationReviewerSearch.length < 2) {
      setEscalationReviewerResults([]);
      setIsEscalationReviewerPickerOpen(false);
      return;
    }
    const handler = setTimeout(async () => {
      const res = await getAllEntraUsers(1, 8, escalationReviewerSearch);
      if (res.success && res.data?.users) {
        setEscalationReviewerResults(res.data.users);
        setIsEscalationReviewerPickerOpen(true);
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [escalationReviewerSearch]);

  // Client-side filtering removed in favor of Server-side

  // Determine scope / permissions explicitly at component level to use in renders
  const entraPermissions = currentUser?.permissions?.attendance?.entra_ad_users;
  const viewAll = entraPermissions?.view_all;
  const viewMy = entraPermissions?.view_my;
  const isAuthorized = viewAll || viewMy;

  // =============================================
  // Data Fetching
  // =============================================

  const fetchData = async () => {
    if (!isAuthorized) {
      setUsers([]);
      setStats(null);
      setTotalFilteredRows(0);
      setIsLoading(false);
      return; // Denied access
    }

    setIsLoading(true);
    setError(null);
    try {
      let managerId: string | null = null;
      if (!viewAll && viewMy) {
        managerId = currentUser?.userId || currentUser?.userID; // Ensure we get the GUID
      }

      let shiftIdParam: string | null = null;
      if (selectedShift === "unassigned") shiftIdParam = "-1";
      else if (selectedShift !== "all") shiftIdParam = selectedShift;

      const res = await getAllEntraUsers(currentPage, pageSize, debouncedSearch, managerId, selectedDepartment || null, shiftIdParam, selectedCardFilter === "all" ? null : selectedCardFilter);
      if (res.success && res.data) {
        setUsers(res.data.users);
        setStats(res.data.stats);
        setTotalFilteredRows(res.data.filteredCount);
      } else {
        setError(res.message || "Failed to load users");
        showToast("error", "Failed to load users", res.message);
      }
    } catch (e) {
      setError("Could not fetch Entra users.");
      showToast("error", "Error", "Could not fetch Entra users.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await getAllShifts();
      if (res.success && res.data) {
        setShifts(res.data.filter(s => s.IsActive));
      }
    } catch (e) {
      console.error("Error fetching shifts:", e);
    }
  };

  const fetchAppLocations = async () => {
    try {
      const data = await getAppLocations(currentUser?.accessToken || "");
      setAppLocations(data.filter(loc => loc.Status === "active"));
    } catch (e) {
      console.error("Error fetching app locations:", e);
    }
  };

  const fetchEmpLeaveRoles = async () => {
    try {
      const token = currentUser?.accessToken || accessToken || "";
      if (!token) return;
      const res = await GetEmployeeLeavePolicies(token);
      if (res.success && res.data) {
        // Deduplicate to distinct roles
        const seen = new Set<string>();
        const distinct = res.data
          .filter((item) => {
            if (seen.has(item.empRoleID)) return false;
            seen.add(item.empRoleID);
            return true;
          })
          .map((item) => ({ empRoleID: item.empRoleID, employeeRole: item.employeeRole }));
        setEmpLeaveRoles(distinct);
      }
    } catch (e) {
      console.error("Error fetching employee leave roles:", e);
    }
  };

  // =============================================
  // Actions
  // =============================================

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncEntraUsers(currentUser?.userID || "UNKNOWN");
      if (res.success && res.data) {
        // Sync API also returns data for page 1
        setUsers(res.data.users);
        setStats(res.data.stats);
        setTotalFilteredRows(res.data.filteredCount);
        setCurrentPage(1);
        showToast("success", "Sync Completed", res.message);
      } else {
        showToast("error", "Sync Failed", res.message);
      }
    } catch (e) {
      showToast("error", "Error", "Could not sync users.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkUpdate = async () => {
    console.log("called function")
    if (selectedUserIds.size === 0) {
      showToast("error", "No Selection", "Please select at least one user.");
      return;
    }

    if(bulkIsRotationalOff && bulkOffDay.length<1){
      showToast("error", "No days selected for rotational off");
      return;
    }

    if(bulkIsRotationalOff && bulkOffDay.length<1){
      showToast("error", "Week off should be of at least 1 day");
      return;
    }

    if(pickFromMap && (!mapData.lat || !mapData.lng)){
      showToast("error","Please select a location")
      return
    }
    console.log("shift effective date",shiftEffectiveDate)
    if(!assignNow && shiftEffectiveDate === null){
      showToast("error","Please select an effective date for shift assignment")
      return
    }

    setIsBulkUpdating(true);
    try {
      console.log("inside try.....")
      const userIds = Array.from(selectedUserIds);

      // Update Shifts if a value was selected (skip "" = leave unchanged, "__mixed__" = leave unchanged)
      if (bulkShiftId !== "" && bulkShiftId !== "__mixed__") {
          console.log("inside shift.....")
        const sId = bulkShiftId === "null" ? null : parseInt(bulkShiftId, 10);
        const shiftRes = await bulkUpdateUserShifts(userIds, sId, currentUser?.userID || "UNKNOWN", bulkIncludeSelfEscalation,assignNow, shiftEffectiveDate);
        if (!shiftRes.success) {
          showToast("error", "Shift Update Failed", shiftRes.message);
        }
      }

      // Update Locations if a map location was picked OR a dropdown value was explicitly selected
      if (pickFromMap || (bulkLocation !== "" && bulkLocation !== "__mixed__")) {
        let locValue: string | null;

       
          locValue = bulkLocation === "null" ? null : bulkLocation;
        
        console.log("inside location.....")
        const locRes = await bulkUpdateUserLocations(userIds, locValue, currentUser?.userID || "UNKNOWN", pickFromMap, (mapData?.lat && mapData?.lng ? `${mapData?.lat},${mapData?.lng}` : ""));
        if (!locRes.success) {
          showToast("error", "Location Update Failed", locRes.message);
        }
      }

      // Update Week Off if rotational off was explicitly toggled, or days were selected
      if (bulkRotationalOffTouched || bulkOffDay.length > 0) {
        console.log("inside weekoff.....")
        const weekOffRes = await bulkUpdateUserWeekOff(userIds, bulkIsRotationalOff, bulkOffDay, currentUser?.userID || "UNKNOWN");
        if (!weekOffRes.success) {
          showToast("error", "Week Off Update Failed", weekOffRes.message);
        }
      }

      // Update Additional Approvers / Escalation Reviewers for each selected user
      // if either is provided (empty arrays = clear all). When only escalation
      // reviewers are chosen (no request type), requestType is sent as null.
      if (approverRequestType || escalationReviewers.length > 0) {
        setIsSavingApprovers(true);
        const approverIds = additionalApprovers.map((a) => a.ID);
        const escalationReviewerIds = escalationReviewers.map((r) => r.ID);
        for (const sourceId of userIds) {
          const approverRes = await upsertAdditionalApprovers(
            sourceId,
            approverRequestType || null,
            approverIds,
            escalationReviewerIds,
            currentUser?.userID || "UNKNOWN"
          );
          if (!approverRes.success) {
            showToast("error", "Approver Update Failed", approverRes.message);
          }
        }
        setIsSavingApprovers(false);
      }

      // Update Leave Role if a value was selected (skip "" = leave unchanged, "__mixed__" = leave unchanged)
      if (bulkLeaveRole !== "" && bulkLeaveRole !== "__mixed__") {
        const roleValue = bulkLeaveRole === "null" ? null : bulkLeaveRole;
        const leaveRes = await bulkUpdateUserLeaveRole(userIds, roleValue, currentUser?.userID || "UNKNOWN");
        if (!leaveRes.success) {
          showToast("error", "Leave Role Update Failed", leaveRes.message);
        }
      }

      showToast("success", "Update Completed", "User assignments updated successfully.");
      setIsEditMode(false);
      setSelectedUserIds(new Set());
      setBulkShiftId("");
      setAssignNow(false)
      setShiftEffectiveDate(null)
      setBulkLocation("");
      setBulkLeaveRole("");
      setBulkIncludeSelfEscalation(false);
      setShiftIsMixed(false);
      setLocationIsMixed(false);
      setAdditionalApprovers([]);
      setApproverRequestType("");
      setApproverPickerSearch("");
      setEscalationReviewers([]);
      setEscalationReviewerSearch("");
      setLeaveRoleIsMixed(false);
      setIsBulkDrawerOpen(false);
      setPickFromMap(false)
      setMapData({
        lat:"",
        lng:"",
        name:""
      })
      fetchData();
    } catch (e) {
      showToast("error", "Error", "Could not perform bulk update.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUserIds);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUserIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === users.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(users.map(u => u.ID)));
    }
  };

  // =============================================
  // Map Handlers
  // =============================================

  // Fix Leaflet default marker icons
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const handleMapClick = (lat: number, lng: number) => {
    setMarkerPos([lat, lng]);
    setMapData({ lat: lat.toFixed(6), lng: lng.toFixed(6), name: mapData.name });
    setSearchResults([]);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError("");
    setSearchResults([]);
    const normalised = searchQuery.trim()
      .replace(/^#?\d+[\w-]*[,\s]*/i, "")
      .replace(/#\d*\s*/g, "")
      .replace(/\bNo\.?\s*\d+[,\s]*/gi, "")
      .replace(/-(\d{5,6})\b/g, ", $1")
      .replace(/\s{2,}/g, " ").trim();
    try {
      const params = new URLSearchParams({ q: normalised, format: "json", limit: "5", countrycodes: "in", addressdetails: "1" });
      const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
        headers: { "Accept-Language": "en", "User-Agent": "QuadraPeople/1.0 (quadrasystems.net)" },
      });
      const data: NominatimResult[] = await res.json();
      if (data.length === 0) setSearchError("No results found. Try a shorter term — e.g. 'Tatabad, Coimbatore'.");
      else setSearchResults(data);
    } catch {
      setSearchError("Search failed. Check your internet connection.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMarkerPos([lat, lng]);
    setFlyTo([lat, lng]);
    setMapData({ lat: lat.toFixed(6), lng: lng.toFixed(6), name: result.display_name.split(",")[0] });
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",")[0]);
  };

  const handleClearCoordinates = () => {
    setMarkerPos(null);
    setFlyTo(null);
    setMapData({ lat: "", lng: "", name: "" });
    setSearchQuery("");
    setSearchResults([]);
  };

  // =============================================
  // Helpers
  // =============================================


  // Check ViewAll or View My permission for users
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
    const isPermitted = checkPermission("attendance.entra_ad_users.view_all") || checkPermission("attendance.entra_ad_users.view_my") 
    if(isPermitted === false){
      navigate("/Attendance")
    }
  },[])

  const handleOpenStatusUpdateConfirmation = (user: EntraADUser, status: boolean) => {
    setUserStatusUpdate({ user, newStatus: status, open: true });
  }

  const handleCloseStatusUpdateConfirmation = () => {
    setUserStatusUpdate({ user: null, newStatus: false, open: false });
  }


  const handleSubmitStatusUpdate = async () => {
    if (!UserStatusUpdate.user) return;
    try {
      setIsUpdatingStatus(true);
      const res = await updateUserStatus(UserStatusUpdate.user.ID, UserStatusUpdate.newStatus, accessToken);
      if (res.success) {
        showToast("success", "Status Updated", res.message);
        fetchData();
        handleCloseStatusUpdateConfirmation()
      }
    } catch (error) {
      showToast("error", "Error", "Failed to update user status.");
    } finally {
      setIsUpdatingStatus(false);
    }

  }


  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sortColumn !== col) return <ArrowSortRegular style={{ fontSize: "13px", opacity: 0.4 }} />;
    return sortDirection === "asc"
      ? <ArrowSortUpRegular style={{ fontSize: "13px", color: "#0078D4" }} />
      : <ArrowSortDownRegular style={{ fontSize: "13px", color: "#0078D4" }} />;
  };

  const sortedUsers = [...users].sort((a, b) => {
    let aVal = "", bVal = "";
    switch (sortColumn) {
      case "DisplayName": aVal = a.DisplayName || ""; bVal = b.DisplayName || ""; break;
      case "JobTitle": aVal = a.JobTitle || ""; bVal = b.JobTitle || ""; break;
      case "ShiftName": aVal = a.ShiftName || ""; bVal = b.ShiftName || ""; break;
      case "Office_Location": aVal = a.Office_Location || ""; bVal = b.Office_Location || ""; break;
      case "AccountEnabled": aVal = String(a.AccountEnabled); bVal = String(b.AccountEnabled); break;
    }
    const cmp = aVal.localeCompare(bVal, undefined, { sensitivity: "base" });
    return sortDirection === "asc" ? cmp : -cmp;
  });

  const isViewAll = checkPermission("attendance.entra_ad_users.view_all");

  const showToast = (intent: "success" | "error", title: string, body?: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle media={intent === "success" ? <CheckmarkCircle20Regular /> : <ErrorCircle20Regular />}>
          {title}
        </ToastTitle>
        {body && <ToastBody>{body}</ToastBody>}
      </Toast>,
      { intent, toastId, timeout: 5000 }
    );
  };

  // totalPages now comes from state

  // =============================================
  // Render
  // =============================================

  if (isLoading && users.length === 0 && isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 h-full">
        <Spinner />
        <Body1Strong className="mt-2">Loading Staff Directory & Shift Setup...</Body1Strong>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <FluentProvider style={{ background: "transparent" }}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <ErrorCircle20Regular className="text-red-500 mb-4" style={{ fontSize: "64px" }} />
          <Subtitle2 className="text-[#1D4586] font-bold text-2xl mb-2">Unauthorized Access Denied</Subtitle2>
          <Text className="text-gray-500 text-center max-w-md">
            You do not have the required permissions to view the Staff Directory & Shift Setup module.
            If you believe this is an error, please contact your administrator.
          </Text>
        </div>
      </FluentProvider>
    );
  }

  return (
    <FluentProvider style={{ background: "transparent" }}>
      <StatusUpdateDialog isLoading={isUpdatingStatus} user={UserStatusUpdate.user} open={UserStatusUpdate.open} onClose={handleCloseStatusUpdateConfirmation} newStatus={UserStatusUpdate.newStatus} onSubmit={handleSubmitStatusUpdate} />
      <div className="mx-auto space-y-4">
        <Toaster toasterId={toastId} />

        {/* ---- Header ---- */}
        <div className="flex justify-between items-center">
          <div>
            <Subtitle2 className="text-[#063762]">
              Staff Directory & Shift Setup
            </Subtitle2>
          </div>
          <div className="flex gap-3 items-center">
            {stats?.summary.LastSyncTime && (
              <Caption1 className="text-white-400 mr-2">
                Last Sync: {new Date(stats.summary.LastSyncTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </Caption1>
            )}
            <Button
              appearance={isEditMode ? "primary" : "outline"}
              shape="circular"
              onClick={() => {
                if (isEditMode) {
                  setIsEditMode(false);
                  setSelectedUserIds(new Set());
                } else {
                  setIsEditMode(true);
                }
              }}
              style={{
                color: isEditMode ? "#FFF" : "#626262",
                backgroundColor: isEditMode ? "#f57c00" : "#FFFFFF4F",
                border: isEditMode ? "none" : "1px solid #fff",
                fontWeight: 500,
                padding: "6px 15px",
                display: "flex",
                gap: "6px",
              }}
              icon={
                <div
                  className="rounded-full flex items-center justify-center p-1"
                  style={{ background: isEditMode ? "#e65100" : "linear-gradient(90deg, #f57c00 0%, #ff9800 100%)" }}
                >
                  <EditRegular style={{ color: "#FFF", width: "16px", height: "16px" }} />
                </div>
              }
            >
              {isEditMode ? "Cancel Edit" : "Edit Assignments"}
            </Button>

            {viewAll && (
              <Button
                appearance="outline"
                shape="circular"
                onClick={handleSync}
                disabled={isSyncing}
                style={{
                  color: "#626262",
                  backgroundColor: "#FFFFFF4F",
                  border: "1px solid #fff",
                  fontWeight: 500,
                  padding: "6px 15px",
                  display: "flex",
                  gap: "6px",
                }}
                icon={
                  <div
                    className="rounded-full flex items-center justify-center p-1"
                    style={{ background: "linear-gradient(90deg, #045AAB 0%, #23A5E6 100%)" }}
                  >
                    {isSyncing ? (
                      <Spinner size="tiny" style={{ color: "#FFF" }} />
                    ) : (
                      <ArrowSyncRegular style={{ color: "#FFF", width: "16px", height: "16px" }} />
                    )}
                  </div>
                }
              >
                {isSyncing ? "Syncing..." : "Sync Now"}
              </Button>
            )}
          </div>
        </div>

        {/* ---- Stats Cards ---- */}
        {
          stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-7">
              {/* Card 1 - Total Users */}
              <CustomStatsCard
                onClick={() => { setSelectedCardFilter("all"); setCurrentPage(1); }}
                style={selectedCardFilter === "all" ? "ring-2 ring-[#0078D4] !bg-white/70" : ""}
              >
                <CardPreview className="py-[17px] px-[20px]">
                  <div className="!flex flex-row items-center justify-between">
                    <div className="flex flex-col gap-[11px]">
                      <div>
                        <Text size={300} weight="semibold" className="text-2xl font-bold">Total Users</Text>
                      </div >
                      <div>
                        <Text size={600} weight="semibold" className="text-2xl font-bold">{stats.summary.TotalUsers}</Text>
                      </div>
                    </div>
                    <div className="bg-[#F1F9FF] rounded-full p-[15px]">
                      <People16Regular style={{ height: "30px", width: "30px", color: "#0078D4" }} />
                    </div>
                  </div>
                </CardPreview>
              </CustomStatsCard>

              {/* Card 2 - Active Users */}
              <CustomStatsCard
                onClick={() => { setSelectedCardFilter(f => f === "active" ? "all" : "active"); setCurrentPage(1); }}
                style={selectedCardFilter === "active" ? "ring-2 ring-[#00C448] !bg-white/70" : ""}
              >
                <CardPreview className="py-[17px] px-[20px]">
                  <div className="!flex flex-row items-center justify-between">
                    <div className="flex flex-col gap-[11px]">
                      <div>
                        <Text size={300} weight="semibold" className="text-2xl font-bold">Active Users</Text>
                      </div>
                      <div>
                        <Text size={600} weight="semibold" className="text-2xl font-bold">{stats.summary.ActiveUsers}</Text>
                      </div>
                    </div>
                    <div className="bg-[#EFF6FF] rounded-full p-[15px]">
                      <PlayCircle20Regular style={{ height: "30px", width: "30px", color: "#00C448" }} />
                    </div>
                  </div>
                </CardPreview>
              </CustomStatsCard>

              {/* Card 3 - Disabled */}
              <CustomStatsCard
                onClick={() => { setSelectedCardFilter(f => f === "disabled" ? "all" : "disabled"); setCurrentPage(1); }}
                style={selectedCardFilter === "disabled" ? "ring-2 ring-[#E73550] !bg-white/70" : ""}
              >
                <CardPreview className="py-[17px] px-[20px]">
                  <div className="!flex flex-row items-center justify-between">
                    <div className="flex flex-col gap-[11px]">
                      <div>
                        <Text size={300} weight="semibold" className="text-2xl font-bold">Disabled</Text>
                      </div>
                      <div>
                        <Text size={600} weight="semibold" className="text-2xl font-bold">{stats.summary.DisabledUsers}</Text>
                      </div>
                    </div>
                    <div className="bg-[#FFFEFE] rounded-full p-[15px]">
                      <ErrorCircle20Regular style={{ height: "30px", width: "30px", color: "#E73550" }} />
                    </div>
                  </div>
                </CardPreview>
              </CustomStatsCard>

              {/* Card 5 - Unassigned */}
              <CustomStatsCard
                onClick={() => { setSelectedCardFilter(f => f === "unassigned" ? "all" : "unassigned"); setCurrentPage(1); }}
                style={selectedCardFilter === "unassigned" ? "ring-2 ring-[#A855F7] !bg-white/70" : ""}
              >
                <CardPreview className="py-[17px] px-[20px]">
                  <div className="!flex flex-row items-center justify-between">
                    <div className="flex flex-col gap-[11px]">
                      <div>
                        <Text size={300} weight="semibold" className="text-2xl font-bold">Unassigned</Text>
                      </div>
                      <div>
                        <Text size={600} weight="semibold" className="text-2xl font-bold">{stats.summary.ShiftsUnassigned}</Text>
                      </div>
                    </div>
                    <div className="bg-[#FEF2F2] rounded-full p-[15px]">
                      <TimerRegular style={{ height: "30px", width: "30px", color: "#A855F7" }} />
                    </div>
                  </div>
                </CardPreview>
              </CustomStatsCard>
            </div>
          )
        }

        {
          error && (
            <MessageBar intent="error" className="mb-6 rounded-xl shadow-sm">
              <MessageBarTitle>Error</MessageBarTitle>
              <MessageBarBody>{error}</MessageBarBody>
            </MessageBar>
          )
        }



        {/* ---- Table ---- */}
        {/* ---- Table Container ---- */}
        <div className="bg-white rounded-[20px] shadow-sm overflow-hidden border border-gray-100">
          {/* ---- Search & Filter (Inside Card) ---- */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 gap-4 border-b border-gray-50">
            <div className="w-full md:w-[40%]">
              <SearchBox
                className={`w-full transition-all duration-200 ${isTransitioning ? "opacity-70 scale-[0.99]" : "opacity-100 scale-100"} !border-gray-200 after:!border-0 !bg-gray-50/50 hover:!bg-white focus-within:!bg-white`}
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(_, data) => {
                  setSearchTerm(data.value);
                  setIsTransitioning(true);
                  setTimeout(() => setIsTransitioning(false), 150);
                }}
                style={{ fontSize: "13px" }}
              />
            </div>
            <div className="w-full md:w-[45%] flex gap-2">
              <Dropdown
                size="medium"
                placeholder="All Departments"
                value={selectedDepartment === "" ? "All Departments" : selectedDepartment}
                selectedOptions={[selectedDepartment]}
                onOptionSelect={(_, data) => {
                  setSelectedDepartment(data.optionValue === "" ? "" : data.optionValue || "");
                  setCurrentPage(1);
                }}
                className="w-1/2 !border-gray-200 !bg-gray-50/50 hover:!bg-white"
              >
                <Option value="" text="All Departments">All Departments</Option>
                {stats?.departmentBreakdown?.filter(d => d.Department !== 'Unassigned').map((dept) => (
                  <Option key={dept.Department} value={dept.Department} text={`${dept.Department} (${dept.UserCount})`}>
                    {dept.Department} ({dept.UserCount})
                  </Option>
                ))}
                {stats?.departmentBreakdown?.some(d => d.Department === 'Unassigned') && (
                  <Option value="Unassigned" text="Unassigned">Unassigned</Option>
                )}
              </Dropdown>

              <Dropdown
                size="medium"
                placeholder="All Shifts"
                value={selectedShift === "all" ? "All Shifts" : selectedShift === "unassigned" ? "Not Assigned" : shifts.find(s => s.ID.toString() === selectedShift)?.ShiftName}
                selectedOptions={[selectedShift]}
                onOptionSelect={(_, data) => {
                  setSelectedShift(data.optionValue || "all");
                  setCurrentPage(1);
                }}
                className="w-1/2 !border-gray-200 !bg-gray-50/50 hover:!bg-white"
              >
                <Option value="all" text="All Shifts">All Shifts</Option>
                <Option value="unassigned" text="Not Assigned">Not Assigned</Option>
                {shifts.map((shift) => (
                  <Option key={shift.ID} value={shift.ID.toString()}>
                    {shift.ShiftName}
                  </Option>
                ))}
              </Dropdown>

              <Button
                appearance="subtle"
                icon={<Filter20Regular />}
                onClick={() => {
                  setSearchTerm("");
                  setSelectedDepartment("");
                  setSelectedShift("all");
                  setSelectedCardFilter("all");
                  setCurrentPage(1);
                }}
                disabled={!searchTerm && !selectedDepartment && selectedShift === "all" && selectedCardFilter === "all"}
                className="!text-red-500 disabled:!text-gray-400"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="px-5 pt-3">
            <div className="overflow-x-auto">
              <Table sortable className="w-full table-fixed">
                <TableHeader>
                  <TableRow className="border-b border-gray-100">
                    {isEditMode && (
                      <TableHeaderCell className="!py-4 !px-5 w-[50px]">
                        <Checkbox
                          checked={users.length > 0 && selectedUserIds.size === users.length}
                          onChange={toggleSelectAll}
                        />
                      </TableHeaderCell>
                    )}
                    <TableHeaderCell className="!py-4 !px-5 w-[30%] cursor-pointer select-none" onClick={() => handleSort("DisplayName")}>
                      <div className="flex items-center gap-1">
                        <Text size={200} className="text-[#8b95a5] font-medium">Applicant</Text>
                        <SortIcon col="DisplayName" />
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-4 !px-5 w-[24%] cursor-pointer select-none" onClick={() => handleSort("JobTitle")}>
                      <div className="flex items-center gap-1">
                        <Text size={200} className="text-[#8b95a5] font-medium">Job Role</Text>
                        <SortIcon col="JobTitle" />
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-4 !px-5 w-[20%] cursor-pointer select-none" onClick={() => handleSort("ShiftName")}>
                      <div className="flex items-center gap-1">
                        <Text size={200} className="text-[#8b95a5] font-medium">Shift</Text>
                        <SortIcon col="ShiftName" />
                      </div>
                    </TableHeaderCell>
                    <TableHeaderCell className="!py-4 !px-5 w-[16%] cursor-pointer select-none" onClick={() => handleSort("Office_Location")}>
                      <div className="flex items-center gap-1">
                        <Text size={200} className="text-[#8b95a5] font-medium">Work Location</Text>
                        <SortIcon col="Office_Location" />
                      </div>
                    </TableHeaderCell>

                    <TableHeaderCell className="!py-4 !px-5 w-[16%] cursor-pointer select-none" onClick={() => handleSort("Office_Location")}>
                      <div className="flex items-center gap-1">
                        <Text size={200} className="text-[#8b95a5] font-medium">Rotational off</Text>
                        <SortIcon col="Office_Location" />
                      </div>
                    </TableHeaderCell>

                    <TableHeaderCell className="!py-4 !px-5 w-[170px]">
                      <Text size={200} className="text-[#8b95a5] font-medium">Week Off</Text>
                    </TableHeaderCell>

                    <TableHeaderCell className="!py-4 !px-5 w-[180px]">
                      <Text size={200} className="text-[#8b95a5] font-medium">Add. Approvers</Text>
                    </TableHeaderCell>

                    <TableHeaderCell className="!py-4 !px-5 w-[15%]">
                      <Text size={200} className="text-[#8b95a5] font-medium">Leave</Text>
                    </TableHeaderCell>

                    <TableHeaderCell className="!py-4 !px-5 w-[10%] cursor-pointer select-none" onClick={() => handleSort("AccountEnabled")}>
                      <div className="flex items-center gap-1">
                        <Text size={200} className="text-[#8b95a5] font-medium">Status</Text>
                        <SortIcon col="AccountEnabled" />
                      </div>
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedUsers.map((user) => (
                    <TableRow
                      key={user.ID}
                      className={`border-b border-gray-50 bg-white ${selectedUserIds.has(user.ID) ? "!bg-blue-50/50" : ""}`}
                      onClick={() => isEditMode && toggleUserSelection(user.ID)}
                    >
                      {isEditMode && (
                        <TableCell className="!px-5 !py-5">
                          <Checkbox
                            checked={selectedUserIds.has(user.ID)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleUserSelection(user.ID);
                            }}
                          />
                        </TableCell>
                      )}
                      <TableCell className="!px-5 !py-5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            name={user.DisplayName}
                            color="colorful"
                            size={28}
                            className="shrink-0"
                          />
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <Text block weight="semibold" className="text-[#007ed5] text-sm truncate">
                                {user.DisplayName}
                              </Text>
                              {!user.AccountEnabled && (
                                <Tooltip content="App access blocked" relationship="label">
                                  <LockClosedRegular className="text-red-400 shrink-0" fontSize={13} />
                                </Tooltip>
                              )}
                            </div>
                            <Tooltip content={user.Mail || "Not Set"} relationship="label">
                              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "11px", color: "#9ca3af", marginTop: "2px" }}>
                                {user.Mail || <span style={{ fontStyle: "italic" }}>Not Set</span>}
                              </div>
                            </Tooltip>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="!px-5 !py-5 truncate">
                        <div className="flex flex-col">
                          <Text block weight="semibold" className="text-gray-800 text-sm truncate">{user.JobTitle || "—"}</Text>
                          <Text block className="text-gray-400 text-xs mt-0.5 truncate">{user.Department || ""}</Text>
                        </div>
                      </TableCell>
                      <TableCell className="!px-5 !py-5 truncate">
                        <Text block className={`text-xs font-semibold truncate ${user.ExpiryDate && new Date(user.ExpiryDate) < new Date() ? 'text-red-500' : 'text-purple-600'}`}>
                          {user.ShiftName || "Not Assigned"}
                          {user.ExpiryDate && new Date(user.ExpiryDate) < new Date() && (
                            <span className="ml-1 text-[10px] uppercase tracking-wider font-bold animate-pulse">
                              (Expired)
                            </span>
                          )}
                        </Text>
                      </TableCell>
                      <TableCell className="!px-5 !py-5 truncate">
                        <div className="flex items-center gap-2">
                          <BuildingRegular className="text-gray-400 text-sm shrink-0" />
                          <Text block className="text-[#5d677a] text-xs truncate min-w-0 flex-1">
                            {user.Office_Location || <span className="italic text-gray-400">Not Assigned</span>}
                          </Text>
                        </div>
                      </TableCell>

                      <TableCell className="!px-5 !py-5">
                          <Badge appearance="tint">{user.User_24_7?"Y":"N"}</Badge>
                      </TableCell>

                      <TableCell className="!px-5 !py-5">
                        {(() => {
                          const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                          const DAY_INIT = ["S", "M", "T", "W", "T", "F", "S"];
                          const offDays = user.User_24_7
                            ? (user.OffDays?.split(",").map((d) => d.trim()).filter(Boolean) || [])
                            : ["Saturday", "Sunday"];
                          const renderDot = (day: string, i: number) => {
                            const isOff = offDays.includes(day);
                            return (
                              <Tooltip key={i} content={day} relationship="label">
                                <span
                                  style={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: "50%",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 9,
                                    fontWeight: 700,
                                    backgroundColor: isOff ? "#fee2e2" : "#f3f4f6",
                                    color: isOff ? "#ef4444" : "#9ca3af",
                                    border: isOff ? "1px solid #fca5a5" : "1px solid #e5e7eb",
                                    flexShrink: 0,
                                  }}
                                >
                                  {DAY_INIT[i]}
                                </span>
                              </Tooltip>
                            );
                          };
                          return (
                            <div className="flex flex-col gap-[3px]">
                              <div className="flex items-center gap-[3px]">
                                {DAY_FULL.slice(0, 4).map((day, i) => renderDot(day, i))}
                              </div>
                              <div className="flex items-center gap-[3px]">
                                {DAY_FULL.slice(4).map((day, i) => renderDot(day, i + 4))}
                              </div>
                            </div>
                          );
                        })()}
                      </TableCell>

                      <TableCell className="!px-5 !py-5">
                        {(() => {
                          if (!user.AdditionalApprovers) {
                            return <span className="text-gray-300 text-xs italic">—</span>;
                          }
                          try {
                            const approvers: AdditionalApprover[] = JSON.parse(user.AdditionalApprovers);
                            if (!approvers.length) return <span className="text-gray-300 text-xs italic">—</span>;
                            const grouped = approvers.reduce<Record<string, AdditionalApprover[]>>((acc, a) => {
                              (acc[a.RequestType] = acc[a.RequestType] || []).push(a);
                              return acc;
                            }, {});
                            const tooltipContent = (
                              <div className="flex flex-col gap-2 py-1">
                                {Object.entries(grouped).map(([type, list]) => (
                                  <div key={type} className="flex flex-col gap-1">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-300">{type}</span>
                                    {list.map((a) => (
                                      <div key={a.ApproverId} className="flex items-center gap-1.5">
                                        <Avatar name={a.DisplayName || a.ApproverId} size={16} color="colorful" />
                                        <span className="text-xs">{a.DisplayName || a.ApproverId}</span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            );
                            return (
                              <Tooltip content={tooltipContent} relationship="description" positioning="before">
                                <div className="flex items-center gap-1.5 cursor-default w-fit">
                                  <Eye20Regular className="text-blue-400" />
                                  <span className="text-xs font-semibold text-blue-500">{approvers.length} approver{approvers.length > 1 ? "s" : ""}</span>
                                </div>
                              </Tooltip>
                            );
                          } catch {
                            return <span className="text-gray-300 text-xs italic">—</span>;
                          }
                        })()}
                      </TableCell>

                      <TableCell className="!px-5 !py-5">
                        {user.EmpRoleName ? (
                          <Badge appearance="tint" color="success" size="medium" className="truncate max-w-[120px]">
                            {user.EmpRoleName}
                          </Badge>
                        ) : (
                          <span className="italic text-gray-400 text-xs">Not Assigned</span>
                        )}
                      </TableCell>

                      <TableCell className="!px-5 !py-5">
                        {
                          isViewAll ? (
                            <Field>
                              <Switch
                                checked={user.AccountEnabled}
                                indicator={{ style: { backgroundColor: user.AccountEnabled ? "#4dae32" : "#f13333", color: "#FFFF" } }}
                                size="small"
                                onChange={(e) => handleOpenStatusUpdateConfirmation(user, e.target.checked)}
                              />
                            </Field>
                          )

                            :

                            <span className={`inline-flex px-3 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${user.AccountEnabled ? 'bg-white text-green-500 border-green-200' : 'bg-white text-red-500 border-red-200'}`}>
                              {user.AccountEnabled ? "Active" : "Disabled"}
                            </span>

                        }

                      </TableCell>
                    </TableRow>
                  ))}
                  {users.length === 0 && !isLoading && (
                    <TableRow>
                      <TableCell colSpan={isEditMode ? 6 : 5}>
                        <div className="py-20 text-center flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
                            <BriefcaseRegular className="text-gray-400 text-3xl" />
                          </div>
                          <Subtitle2 className="text-gray-700">No employees found</Subtitle2>
                          <Caption1 className="text-gray-400 mt-1">Try a different search or click Sync Now to update.</Caption1>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* ---- Pagination ---- */}
          <div className="flex items-center justify-between border-t border-gray-50 bg-white">
            <Text className="text-[#2aa198] text-xs font-medium pl-6">
              Showing {totalFilteredRows > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {((currentPage - 1) * pageSize) + users.length} of {totalFilteredRows} requests
            </Text>
            <CustomPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={pageSize}
              pageSizeOptions={[10, 20, 30]}
              onItemsPerPageChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      {
        isEditMode && selectedUserIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 animate-slide-up">
            <div className="bg-[#0f172a] text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-4 border border-gray-700">
              {/* Avatars Pile */}
              <div className="flex -space-x-2">
                {Array.from(selectedUserIds)
                  .slice(0, 4)
                  .map((id, index) => {
                    const u = users.find((u) => u.ID === id);
                    return (
                      <Avatar
                        key={id}
                        name={u?.DisplayName}
                        size={24}
                        className="border-2 border-[#0f172a]"
                      />
                    );
                  })}
                {selectedUserIds.size > 4 && (
                  <div className="w-6 h-6 rounded-full bg-gray-600 border-2 border-[#0f172a] flex items-center justify-center text-[10px] font-bold text-white">
                    +{selectedUserIds.size - 4}
                  </div>
                )}
              </div>

              <Text className="text-sm font-medium text-gray-200">
                {selectedUserIds.size} {selectedUserIds.size === 1 ? 'user' : 'users'} selected
              </Text>

              <Button
                appearance="primary"
                shape="circular"
                size="small"
                onClick={() => setIsBulkDrawerOpen(true)}
                style={{
                  backgroundColor: "#0078d4",
                  fontWeight: 500,
                  padding: "4px 16px",
                }}
              >
                Assign Shift & Location
              </Button>

              <div className="h-4 w-[1px] bg-gray-600 mx-1"></div>

              <Button
                appearance="transparent"
                icon={<DismissRegular className="text-gray-400 hover:text-white" />}
                onClick={() => setSelectedUserIds(new Set())}
                size="small"
              />
            </div>
          </div>
        )
      }

      {/* Bulk Assign Drawer */}
      <OverlayDrawer
        position="end"
        open={isBulkDrawerOpen}
        onOpenChange={(_, { open }) => {
          setIsBulkDrawerOpen(open);
          if (!open) {
            setShiftIsMixed(false);
            setLocationIsMixed(false);
            setBulkShiftId("");
            setBulkLocation("");
            setShiftEffectiveDate(null)
            setAssignNow(false)
            setIsBulkRotationalOff(false);
            setBulkIncludeSelfEscalation(false);
            setBulkOffDay([]);
            setAdditionalApprovers([]);
            setApproverRequestType("");
            setApproverPickerSearch("");
            setIsApproverPickerOpen(false);
            setBulkLeaveRole("");
            setLeaveRoleIsMixed(false);
            setPickFromMap(false)
            setMapData({
              lat:"",
              lng:"",
              name:""
            })
          }
        }}
        style={{ width: "480px" }}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close"
                icon={<DismissRegular />}
                onClick={() => {
                  setIsBulkDrawerOpen(false);
                  setShiftIsMixed(false);
                  setLocationIsMixed(false);
                  setBulkShiftId("");
                  setBulkLocation("");
                  setIsBulkRotationalOff(false);
                  setBulkIncludeSelfEscalation(false);
                  setBulkOffDay([]);
                  setAdditionalApprovers([]);
                  setApproverRequestType("");
                  setApproverPickerSearch("");
                  setIsApproverPickerOpen(false);
                  setBulkLeaveRole("");
                  setLeaveRoleIsMixed(false);
                  setPickFromMap(false);
                  setMapData({ lat: "", lng: "", name: "" });
                }}
              />
            }
          >
            Bulk Assign
          </DrawerHeaderTitle>
          <Text className="text-gray-500 text-sm">
            Update shift and/or location for {selectedUserIds.size} {selectedUserIds.size === 1 ? 'user' : 'users'}
          </Text>
        </DrawerHeader>

        <DrawerBody className="mt-6 flex flex-col gap-6">
          {/* Applying to */}
          <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <People16Regular /> Applying to
            </Text>
            <div className="flex flex-wrap gap-2 mt-1 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">
              {Array.from(selectedUserIds).map((id) => {
                const u = users.find((user) => user.ID === id);
                return (
                  <div key={id} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-full border border-gray-200 shadow-sm text-xs">
                    <Avatar name={u?.DisplayName} size={16} />
                    <span className="truncate max-w-[120px] font-medium">{u?.DisplayName}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pending next shift (single selection) */}
          {(() => {
            if (selectedUserIds.size !== 1) return null;
            const u = users.find((user) => user.ID === Array.from(selectedUserIds)[0]);
            if (!u?.NextShiftName || !u?.EffectiveDate) return null;
            return (
              <div className="flex flex-col gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <Text className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-2">
                  <Clock16Regular /> Next Scheduled Shift
                </Text>
                <Text className="text-sm text-amber-900">
                  <span className="font-semibold">{u.NextShiftName}</span>
                  {u.NextShiftStartTime && u.NextShiftEndTime && (
                    <span> ({formatTime(u.NextShiftStartTime)} - {formatTime(u.NextShiftEndTime)})</span>
                  )}
                  {" "}effective from{" "}
                  <span className="font-semibold">
                    {new Date(u.EffectiveDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </Text>
              </div>
            );
          })()}

          <div className="flex flex-col gap-4">
            <Field label="Assign Shift">
              <Select
                value={bulkShiftId}
                onChange={(_, data) => {
                  setBulkShiftId(data.value);
                  if (data.value !== "__mixed__") setShiftIsMixed(false);
                }}
              >
                <option value="" disabled>Select a shift</option>
                {shiftIsMixed && (
                  <option value="__mixed__" disabled>Multiple shifts (varies) — leave unchanged</option>
                )}
                {shifts.map(s => (
                  <option key={s.ID} value={s.ID}>
                    {s.ShiftName} ({formatTime(s.StartTime)} - {formatTime(s.EndTime)})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Assign Now">
              <Checkbox
                label="Assign Now"
                checked={assignNow}
                onChange={()=>setAssignNow(!assignNow)}
                />
            </Field>


            {
              !assignNow && (
                <Field label="Effective Date">
                  <DatePicker
                    value={shiftEffectiveDate?new Date(shiftEffectiveDate):null}
                    onSelectDate={(date)=>{
                      if (!date) {
                        setShiftEffectiveDate(null);
                        return;
                      }
                      const y = date.getFullYear();
                      const m = String(date.getMonth() + 1).padStart(2, "0");
                      const d = String(date.getDate()).padStart(2, "0");
                      setShiftEffectiveDate(`${y}-${m}-${d}`);
                    }}
                    minDate={new Date()}
                    placeholder="Select a date from which shift should be assigned"
                    />
                </Field>
              )
            }

            

            <Field label="Setup Location">
              <Select
                value={bulkLocation}
                onChange={(_, data) => {
                  setBulkLocation(data.value);
                  if (data.value !== "__mixed__") setLocationIsMixed(false);
                  const selected = appLocations.find((item) => item.Name === data.value);
                  if (usesCustomCoordinates(selected?.Code)) {
                    setPickFromMap(true);
                  } else {
                    setPickFromMap(false);
                    setMapData({ lat: "", lng: "", name: "" });
                    setMarkerPos(null);
                    setFlyTo(null);
                    setShowMap(false);
                  }
                }}
              >
                <option value="" disabled>Select a location</option>
                {locationIsMixed && (
                  <option value="__mixed__" disabled>Multiple locations (varies) — leave unchanged</option>
                )}
                {appLocations.map(loc => (
                  <option key={loc.Id} value={loc.Name}>
                    {loc.Name} {loc.Code ? `(${loc.Code})` : ""}
                  </option>
                ))}
              </Select>
            </Field>


            {
              pickFromMap && (
                <Card style={{ border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                                <CardHeader
                                  header={
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <Globe20Regular style={{ color: "#9333ea" }} />
                                      <Text weight="semibold">Coordinates</Text>
                                    </div>
                                  }
                                />
                                <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                
                                  {/* Coordinates text field + action buttons */}
                                  <Field label="Location Coordinates (Optional)"
                                    hint={mapData.lat && mapData.lng ? "" : "Type manually or use the map picker below"}>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                      <Input
                                        style={{ flex: 1 }}
                                        value={mapData.lat && mapData.lng ? `${mapData.lat}, ${mapData.lng}` : ""}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const parts = val.split(",").map(s => s.trim());
                                          setMapData({ lat: parts[0] || "", lng: parts[1] || "", name: mapData.name });
                                        }}
                                        placeholder="e.g., 11.0168, 76.9558"
                                        disabled={isLoading}
                                      />
                                      {(mapData.lat || mapData.lng) && (
                                        <Button
                                          appearance="subtle"
                                          icon={<Dismiss20Regular />}
                                          onClick={handleClearCoordinates}
                                          title="Clear coordinates"
                                          style={{ minWidth: 0, padding: "0 6px" }}
                                        />
                                      )}
                                      <Button
                                        appearance={showMap ? "primary" : "outline"}
                                        icon={<MyLocation20Regular />}
                                        onClick={() => setShowMap((v) => !v)}
                                        style={{
                                          whiteSpace: "nowrap",
                                          backgroundColor: showMap ? "#9333ea" : undefined,
                                          borderColor: showMap ? "#9333ea" : "#d1d5db",
                                          color: showMap ? "white" : "#374151",
                                        }}
                                        disabled={isLoading}
                                      >
                                        {showMap ? "Hide Map" : "Pick on Map"}
                                      </Button>
                                    </div>
                                  </Field>
                
                                  {/* Map picker panel */}
                                  {showMap && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                
                                      {/* Nominatim search */}
                                      <div style={{ display: "flex", gap: "6px" }}>
                                        <Input
                                          style={{ flex: 1 }}
                                          placeholder="Search for a city or address..."
                                          value={searchQuery}
                                          onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                                          }}
                                          onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                                        />
                                        <Button
                                          appearance="primary"
                                          icon={isSearching ? <Spinner size="tiny" /> : <Search20Regular />}
                                          onClick={handleSearch}
                                          disabled={isSearching || !searchQuery.trim()}
                                          style={{ backgroundColor: "#7c3aed" }}
                                        >
                                          Search
                                        </Button>
                                      </div>
                
                                      {/* Search results dropdown */}
                                      {searchResults.length > 0 && (
                                        <div style={{
                                          border: "1px solid #d1d5db",
                                          borderRadius: "6px",
                                          overflow: "hidden",
                                          backgroundColor: "white",
                                          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                        }}>
                                          {searchResults.map((r, i) => (
                                            <button
                                              key={i}
                                              onClick={() => handleResultSelect(r)}
                                              style={{
                                                display: "block",
                                                width: "100%",
                                                textAlign: "left",
                                                padding: "10px 14px",
                                                border: "none",
                                                borderBottom: i < searchResults.length - 1 ? "1px solid #f3f4f6" : "none",
                                                backgroundColor: "white",
                                                cursor: "pointer",
                                                fontSize: "13px",
                                                color: "#374151",
                                                lineHeight: "1.4",
                                              }}
                                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f3ff")}
                                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "white")}
                                            >
                                              <span style={{ fontWeight: 500 }}>{r.display_name.split(",")[0]}</span>
                                              <br />
                                              <span style={{ color: "#6b7280", fontSize: "11px" }}>
                                                {r.display_name.split(",").slice(1, 4).join(",").trim()}
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                
                                      {searchError && (
                                        <Text style={{ color: "#dc2626", fontSize: "13px" }}>{searchError}</Text>
                                      )}
                
                                      {/* Instruction */}
                                      <Text style={{ fontSize: "12px", color: "#6b7280" }}>
                                        🖱️ You can also click anywhere on the map to drop a pin.
                                      </Text>
                
                                      {/* Leaflet map */}
                                      <div style={{
                                        height: "280px",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        border: "2px solid #e5e7eb",
                                        position: "relative",
                                      }}>
                                        <MapContainer
                                          center={markerPos ?? defaultCenter}
                                          zoom={markerPos ? 15 : 5}
                                          style={{ height: "100%", width: "100%" }}
                                          zoomControl={true}
                                        >
                                          <TileLayer
                                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                          />
                                          <InvalidateSize />
                                          <MapClickHandler onMapClick={handleMapClick} />
                                          {flyTo && <FlyToLocation center={flyTo} />}
                                          {markerPos && <Marker position={markerPos} />}
                                        </MapContainer>
                                      </div>
                
                                      {markerPos && (
                                        <div style={{
                                          backgroundColor: "#f5f3ff",
                                          border: "1px solid #ddd6fe",
                                          borderRadius: "6px",
                                          padding: "8px 12px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "8px",
                                        }}>
                                          <Globe20Regular style={{ color: "#7c3aed", flexShrink: 0 }} />
                                          <Text style={{ fontSize: "13px", color: "#5b21b6", fontFamily: "monospace" }}>
                                            {mapData.lat}, {mapData.lng}
                                          </Text>
                                          <Text style={{ fontSize: "12px", color: "#7c3aed", marginLeft: "auto" }}>
                                            ✓ Coordinates captured
                                          </Text>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </Card>
              )
            }

            <Field>
              <Checkbox
                label="Rotational Off"
                checked={bulkIsRotationalOff}
                onChange={(e) => { setIsBulkRotationalOff(!bulkIsRotationalOff); setBulkRotationalOffTouched(true); }}
              />
            </Field>

            <Field>
              <Checkbox
                label="Include in escalations"
                checked={bulkIncludeSelfEscalation}
                onChange={(_, data) => setBulkIncludeSelfEscalation(!!data.checked)}
              />
            </Field>

            {
              bulkIsRotationalOff && (
                <Field label="Week Off" hint="Select up to 2 days">
                  <Dropdown
                    multiselect
                    placeholder="Select week off day(s)"
                    selectedOptions={bulkOffDay}
                    value={bulkOffDay.join(", ")}
                    onOptionSelect={(_, data) => {
                      const selected = data.selectedOptions as string[];
                      if (selected.length <= 2) setBulkOffDay(selected);
                    }}
                  >
                    {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                      <Option
                        key={day}
                        value={day}
                        disabled={bulkOffDay.length >= 2 && !bulkOffDay.includes(day)}
                      >
                        {day}
                      </Option>
                    ))}
                  </Dropdown>
                </Field>
              )
            }

          </div>

          {/* Additional Approvers Section */}
          <div className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
            <Text className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <People16Regular /> Additional Approvers
            </Text>
            <Text className="text-xs text-gray-400">
              Assign up to 3 additional approvers for the selected {selectedUserIds.size === 1 ? "user's" : "users'"} requests.
            </Text>

            <Field label="Request Type">
              <Select
                value={approverRequestType}
                onChange={(_, data) => setApproverRequestType(data.value)}
              >
                <option value="" disabled>Select request type</option>
                <option value="Leave">Leave only</option>
                {/* <option value="Permission">Permission</option> */}
                <option value="Both">Both Leave & Permission</option>
              </Select>
            </Field>

            <Field label={`Approvers${additionalApprovers.length > 0 ? ` (${additionalApprovers.length}/3)` : ""}`} hint="Search by name or email — max 3">
              {/* Selected approver chips */}
              {additionalApprovers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {additionalApprovers.map((approver) => (
                    <div
                      key={approver.ID}
                      className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full text-xs"
                    >
                      <Avatar name={approver.DisplayName} size={16} />
                      <span className="font-medium truncate max-w-[110px]">
                        {approver.DisplayName}
                      </span>
                      <Button
                        appearance="transparent"
                        size="small"
                        icon={<DismissRegular style={{ fontSize: 10 }} />}
                        style={{ minWidth: 0, padding: "0 2px", height: 16 }}
                        onClick={() =>
                          setAdditionalApprovers((prev) =>
                            prev.filter((x) => x.ID !== approver.ID)
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Search input — dropdown opens upward to stay fully visible */}
              {additionalApprovers.length < 3 && (
                <div className="relative">
                  <SearchBox
                    placeholder="Search users..."
                    value={approverPickerSearch}
                    onChange={(_, data) => setApproverPickerSearch(data.value)}
                    size="small"
                    className="w-full"
                  />

                  {isApproverPickerOpen && approverPickerResults.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
                      {approverPickerResults
                        .filter(
                          (u) =>
                            !additionalApprovers.some((a) => a.ID === u.ID) &&
                            !Array.from(selectedUserIds).includes(u.ID)
                        )
                        .slice(0, 6)
                        .map((u) => (
                          <div
                            key={u.ID}
                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                            onClick={() => {
                              setAdditionalApprovers((prev) => [...prev, u]);
                              setApproverPickerSearch("");
                              setIsApproverPickerOpen(false);
                            }}
                          >
                            <Avatar name={u.DisplayName} size={24} color="colorful" />
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-gray-800 truncate">
                                {u.DisplayName}
                              </span>
                              <span className="text-xs text-gray-400 truncate">
                                {u.Department || u.JobTitle || u.Mail}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </Field>
            <Field label="Assign Leave Role">
              <Select
                value={bulkLeaveRole}
                onChange={(_, data) => {
                  setBulkLeaveRole(data.value);
                  if (data.value !== "__mixed__") setLeaveRoleIsMixed(false);
                }}
              >
                <option value="" disabled>Select a leave role</option>
                {leaveRoleIsMixed && (
                  <option value="__mixed__" disabled>Multiple roles (varies) — leave unchanged</option>
                )}
                <option value="null">Unassign</option>
                {empLeaveRoles.map((role) => (
                  <option key={role.empRoleID} value={role.empRoleID}>
                    {role.employeeRole} ({role.empRoleID})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label={`Escalation Reviewer${escalationReviewers.length > 0 ? ` (${escalationReviewers.length}/3)` : ""}`} hint="Search by name or email — max 3">
             
              {escalationReviewers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {escalationReviewers.map((reviewer) => (
                    <div
                      key={reviewer.ID}
                      className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2 py-1 rounded-full text-xs"
                    >
                      <Avatar name={reviewer.DisplayName} size={16} />
                      <span className="font-medium truncate max-w-[110px]">
                        {reviewer.DisplayName}
                      </span>
                      <Button
                        appearance="transparent"
                        size="small"
                        icon={<DismissRegular style={{ fontSize: 10 }} />}
                        style={{ minWidth: 0, padding: "0 2px", height: 16 }}
                        onClick={() =>
                          setEscalationReviewers((prev) =>
                            prev.filter((x) => x.ID !== reviewer.ID)
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {escalationReviewers.length < 3 && (
                <div className="relative">
                  <SearchBox
                    placeholder="Search users..."
                    value={escalationReviewerSearch}
                    onChange={(_, data) => setEscalationReviewerSearch(data.value)}
                    size="small"
                    className="w-full"
                  />

                  {isEscalationReviewerPickerOpen && escalationReviewerResults.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 bottom-full mb-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
                      {escalationReviewerResults
                        .filter(
                          (u) =>
                            !escalationReviewers.some((a) => a.ID === u.ID) &&
                            !Array.from(selectedUserIds).includes(u.ID)
                        )
                        .slice(0, 6)
                        .map((u) => (
                          <div
                            key={u.ID}
                            className="flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-50 last:border-0"
                            onClick={() => {
                              setEscalationReviewers((prev) => [...prev, u]);
                              setEscalationReviewerSearch("");
                              setIsEscalationReviewerPickerOpen(false);
                            }}
                          >
                            <Avatar name={u.DisplayName} size={24} color="colorful" />
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-gray-800 truncate">
                                {u.DisplayName}
                              </span>
                              <span className="text-xs text-gray-400 truncate">
                                {u.Department || u.JobTitle || u.Mail}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </Field>

          </div>
        </DrawerBody>

        <DrawerFooter className="border-t border-gray-100 pt-4 pb-4">
          <Button appearance="subtle" onClick={() => { setIsBulkDrawerOpen(false); setShiftIsMixed(false); setLocationIsMixed(false); setBulkShiftId(""); setBulkLocation(""); setIsBulkRotationalOff(false); setBulkRotationalOffTouched(false); setBulkIncludeSelfEscalation(false); setBulkOffDay([]); setAdditionalApprovers([]); setApproverRequestType(""); setApproverPickerSearch(""); setIsApproverPickerOpen(false); setEscalationReviewers([]); setEscalationReviewerSearch(""); setIsEscalationReviewerPickerOpen(false); }}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            onClick={handleBulkUpdate}
            disabled={isBulkUpdating || (
              (bulkShiftId === "" || bulkShiftId === "__mixed__") &&
              (bulkLocation === "" || bulkLocation === "__mixed__") &&
              (bulkLeaveRole === "" || bulkLeaveRole === "__mixed__") &&
              !bulkRotationalOffTouched && bulkOffDay.length === 0 &&
              !approverRequestType && additionalApprovers.length === 0 &&
              escalationReviewers.length === 0
            )}
            icon={isBulkUpdating ? <Spinner size="tiny" /> : undefined}
          >
            {(isBulkUpdating || isSavingApprovers) ? "Applying..." : `Apply to ${selectedUserIds.size} ${selectedUserIds.size === 1 ? 'user' : 'users'}`}
          </Button>
        </DrawerFooter>
      </OverlayDrawer>
    </FluentProvider>
  );
}

export default ShiftManagement;
