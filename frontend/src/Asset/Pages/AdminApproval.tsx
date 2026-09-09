import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Button,
  Input,
  Text,
  Badge,
  Spinner,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import {
  SearchRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  ArrowLeftRegular,
  PeopleTeamRegular,
  WrenchRegular,
  DocumentPersonRegular,
  DeveloperBoardRegular,
  ArrowSwapRegular,
  WarningRegular,
  ClockRegular,
  CalendarRegular,
  LaptopRegular,
  DesktopRegular,
  CheckmarkCircleRegular,
  AppsRegular,
  ListRegular,
  BoxRegular,
  DismissRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import TruncatedText from "../../Common/TruncatedText";
import QuadraPillToggle from "../../Common/QuadraPillToggle";
import AssetRequestDetailsPanel from "../Components/AssetRequestDetailsPanel";
import RequestTypeSelector from "../Components/RequestTypeSelector";
import HRRequestDetailsPanel from "../Components/HRRequestDetailsPanel";
import HandoverRequestDetailsPanel from "../Components/HandoverRequestDetailsPanel";
import UpgradeRequestDetailsPanel from "../Components/UpgradeRequestDetailsPanel";
import RepairRequestDetailsPanel from "../Components/RepairRequestDetailsPanel";
import AdminHRRequestSubScreen from "../Components/AdminSubScreens/AdminHRRequestSubScreen";
import AdminUpgradeSubScreen from "../Components/AdminSubScreens/AdminUpgradeSubScreen";
import AdminRepairSubScreen from "../Components/AdminSubScreens/AdminRepairSubScreen";
import AdminHandoverSubScreen from "../Components/AdminSubScreens/AdminHandoverSubScreen";
import AdminLostSubScreen from "../Components/AdminSubScreens/AdminLostSubScreen";
import { getAdminAssetRequests, AssetUserRequestRecord } from "../Services/AssetInventoryService";
import { getAssetLostRequests, AssetLostRequestRecord } from "../Services/AssetLostRequestService";
import {
  getAssetHRRequests,
  getAssetHRRequestCategorySummary,
  AssetHRRequestRecord,
  HRRequestStatus,
  HRRequestCategorySummary,
} from "../Services/AssetHRRequestService";
import { getAssetUpgradeRequests, AssetUpgradeRequestRecord } from "../Services/AssetUpgradeRequestService";
import { getAssetRepairRequests, AssetRepairRequestRecord } from "../Services/AssetRepairRequestService";
import {
  getAssetHandoverRequests,
  AssetHandoverRequestRecord,
  HandoverRequestStatus,
} from "../Services/AssetHandoverRequestService";
import { REQUEST_STATUS_TABS, REQUEST_STATUS_LABEL, REQUEST_STATUS_COLOR, RequestStatusTabValue, getStatusTabCounts } from "../Utils/requestStatus";

const HR_STATUS_TABS: { label: string; value: HRRequestStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "In Progress", value: "InProgress" },
  { label: "Completed", value: "Completed" },
  { label: "Rejected", value: "Rejected" },
];

const HR_STATUS_COLOR: Record<HRRequestStatus, "warning" | "informative" | "success" | "danger"> = {
  Pending: "warning",
  InProgress: "informative",
  Completed: "success",
  Rejected: "danger",
};

type RequestType = "select" | "employee" | "repair" | "hr" | "hardware" | "handover" | "lost";

const HANDOVER_STATUS_TABS: { label: string; value: HandoverRequestStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "In Progress", value: "InProgress" },
  { label: "Completed", value: "Completed" },
];

const HANDOVER_STATUS_COLOR: Record<HandoverRequestStatus, "warning" | "informative" | "success"> = {
  Pending: "warning",
  InProgress: "informative",
  Completed: "success",
};

const PAGE_SIZE = 10;

const getPageNumbers = (current: number, total: number): (number | "...")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

const formatShortDate = (value: string | null) => {
  if (!value) return "15/6/2026";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "15/6/2026";
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

const getInitials = (name: string | null) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const INITIAL_DEMO_REQUESTS: AssetUserRequestRecord[] = [
  {
    ID: "req-demo-john",
    RequestNumber: "REQ-2026-001",
    AssetType: "Laptop",
    CategoryID: "cat-laptop",
    PurposeOfRequest: "Current laptop is slow and affecting productivity",
    AssignedManagerID: "mgr-mani",
    AssignedManagerMail: "manikandan@quadra.com",
    AssignedManagerName: "Manikandan R",
    AssignedManagerDate: "2026-06-12T09:00:00.000Z",
    ApprovedManagerID: null,
    ApprovedManagerMail: null,
    ApprovedManagerName: null,
    ManagerApprovalStatus: "Pending",
    ManagerApprovedReason: null,
    ManagerApprovedDate: null,
    AdminAssignedDate: null,
    AssignedAdminApproverID: null,
    AssignedAdminApproverName: null,
    AssignedAdminApproverMail: null,
    AdminApprovedDate: null,
    ApprovedAdminMail: null,
    ApprovedAdminID: null,
    ApprovedAdminName: null,
    AdminApprovalStatus: "Pending",
    AdminApprovedReason: null,
    IsAdminOverride: false,
    AssignedAssetID: null,
    AssignedAssetName: null,
    AssignedAssetTagID: null,
    RequestedByName: "John Smith",
    RequestedByMail: "john.smith@quadra.com",
    RequestedByJobTitle: "Marketing Lead",
    RequestedByDepartment: "Marketing",
    OverallStatus: "PendingManagerApproval",
    CreatedAt: "2026-06-15T09:00:00.000Z",
    CreatedBy: "John Smith",
    ModifiedAt: null,
    ModifiedBy: null,
  },
  {
    ID: "req-demo-sarah",
    RequestNumber: "REQ-2026-002",
    AssetType: "Laptop",
    CategoryID: "cat-laptop",
    PurposeOfRequest: "Field device replacement needed for site audit",
    AssignedManagerID: "mgr-mani",
    AssignedManagerMail: "manikandan@quadra.com",
    AssignedManagerName: "Manikandan R",
    AssignedManagerDate: "2026-06-12T09:00:00.000Z",
    ApprovedManagerID: null,
    ApprovedManagerMail: null,
    ApprovedManagerName: null,
    ManagerApprovalStatus: "Pending",
    ManagerApprovedReason: null,
    ManagerApprovedDate: null,
    AdminAssignedDate: null,
    AssignedAdminApproverID: null,
    AssignedAdminApproverName: null,
    AssignedAdminApproverMail: null,
    AdminApprovedDate: null,
    ApprovedAdminMail: null,
    ApprovedAdminID: null,
    ApprovedAdminName: null,
    AdminApprovalStatus: "Pending",
    AdminApprovedReason: null,
    IsAdminOverride: false,
    AssignedAssetID: null,
    AssignedAssetName: null,
    AssignedAssetTagID: null,
    RequestedByName: "Sarah Connor",
    RequestedByMail: "sarah.connor@quadra.com",
    RequestedByJobTitle: "Operations Analyst",
    RequestedByDepartment: "Operations",
    OverallStatus: "PendingManagerApproval",
    CreatedAt: "2026-06-14T10:30:00.000Z",
    CreatedBy: "Sarah Connor",
    ModifiedAt: null,
    ModifiedBy: null,
  },
  {
    ID: "req-demo-dravid",
    RequestNumber: "REQ-2026-003",
    AssetType: "Monitor",
    CategoryID: "cat-monitor",
    PurposeOfRequest: "Need dual monitor setup for design work",
    AssignedManagerID: "mgr-mani",
    AssignedManagerMail: "manikandan@quadra.com",
    AssignedManagerName: "Manikandan R",
    AssignedManagerDate: "2026-06-12T09:00:00.000Z",
    ApprovedManagerID: "mgr-mani",
    ApprovedManagerMail: "manikandan@quadra.com",
    ApprovedManagerName: "Manikandan R",
    ManagerApprovalStatus: "Approved",
    ManagerApprovedReason: "Approved for design workload",
    ManagerApprovedDate: "2026-06-15T09:00:00.000Z",
    AdminAssignedDate: null,
    AssignedAdminApproverID: null,
    AssignedAdminApproverName: null,
    AssignedAdminApproverMail: null,
    AdminApprovedDate: null,
    ApprovedAdminMail: null,
    ApprovedAdminID: null,
    ApprovedAdminName: null,
    AdminApprovalStatus: "Pending",
    AdminApprovedReason: null,
    IsAdminOverride: false,
    AssignedAssetID: null,
    AssignedAssetName: null,
    AssignedAssetTagID: null,
    RequestedByName: "Dravid",
    RequestedByMail: "dravid@quadra.com",
    RequestedByJobTitle: "UI/UX Designer",
    RequestedByDepartment: "Design",
    OverallStatus: "PendingAdminApproval",
    CreatedAt: "2026-06-15T11:00:00.000Z",
    CreatedBy: "Dravid",
    ModifiedAt: null,
    ModifiedBy: null,
  },
  {
    ID: "req-demo-alex",
    RequestNumber: "REQ-2026-004",
    AssetType: "Laptop",
    CategoryID: "cat-laptop",
    PurposeOfRequest: "MacBook Pro required for iOS mobile build compilation",
    AssignedManagerID: "mgr-mani",
    AssignedManagerMail: "manikandan@quadra.com",
    AssignedManagerName: "Manikandan R",
    AssignedManagerDate: "2026-06-10T09:00:00.000Z",
    ApprovedManagerID: "mgr-mani",
    ApprovedManagerMail: "manikandan@quadra.com",
    ApprovedManagerName: "Manikandan R",
    ManagerApprovalStatus: "Approved",
    ManagerApprovedReason: "Approved for engineering mobile dev",
    ManagerApprovedDate: "2026-06-13T10:00:00.000Z",
    AdminAssignedDate: null,
    AssignedAdminApproverID: null,
    AssignedAdminApproverName: null,
    AssignedAdminApproverMail: null,
    AdminApprovedDate: null,
    ApprovedAdminMail: null,
    ApprovedAdminID: null,
    ApprovedAdminName: null,
    AdminApprovalStatus: "Pending",
    AdminApprovedReason: null,
    IsAdminOverride: false,
    AssignedAssetID: null,
    AssignedAssetName: null,
    AssignedAssetTagID: null,
    RequestedByName: "Alex Rivera",
    RequestedByMail: "alex.rivera@quadra.com",
    RequestedByJobTitle: "Mobile Developer",
    RequestedByDepartment: "Engineering",
    OverallStatus: "PendingAdminApproval",
    CreatedAt: "2026-06-13T14:15:00.000Z",
    CreatedBy: "Alex Rivera",
    ModifiedAt: null,
    ModifiedBy: null,
  },
  {
    ID: "req-demo-priya",
    RequestNumber: "REQ-2026-005",
    AssetType: "Headphone",
    CategoryID: "cat-audio",
    PurposeOfRequest: "Noise-cancelling headset for talent interview calls",
    AssignedManagerID: "mgr-mani",
    AssignedManagerMail: "manikandan@quadra.com",
    AssignedManagerName: "Manikandan R",
    AssignedManagerDate: "2026-06-08T09:00:00.000Z",
    ApprovedManagerID: "mgr-mani",
    ApprovedManagerMail: "manikandan@quadra.com",
    ApprovedManagerName: "Manikandan R",
    ManagerApprovalStatus: "Approved",
    ManagerApprovedReason: "Approved",
    ManagerApprovedDate: "2026-06-09T09:00:00.000Z",
    AdminAssignedDate: "2026-06-10T12:00:00.000Z",
    AssignedAdminApproverID: "admin-1",
    AssignedAdminApproverName: "Admin User",
    AssignedAdminApproverMail: "admin@quadra.com",
    AdminApprovedDate: "2026-06-10T12:00:00.000Z",
    ApprovedAdminMail: "admin@quadra.com",
    ApprovedAdminID: "admin-1",
    ApprovedAdminName: "Admin User",
    AdminApprovalStatus: "Approved",
    AdminApprovedReason: "Dispatched from stock",
    IsAdminOverride: false,
    AssignedAssetID: "ast-42",
    AssignedAssetName: "Jabra Evolve2 65",
    AssignedAssetTagID: "AST00042",
    RequestedByName: "Priya Sharma",
    RequestedByMail: "priya.sharma@quadra.com",
    RequestedByJobTitle: "Talent Acquisition",
    RequestedByDepartment: "HR",
    OverallStatus: "Completed",
    CreatedAt: "2026-06-10T16:00:00.000Z",
    CreatedBy: "Priya Sharma",
    ModifiedAt: "2026-06-10T16:00:00.000Z",
    ModifiedBy: "Admin User",
  },
  {
    ID: "req-demo-michael",
    RequestNumber: "REQ-2026-006",
    AssetType: "Desktop",
    CategoryID: "cat-desktop",
    PurposeOfRequest: "Ergonomic desktop workstation setup",
    AssignedManagerID: "mgr-mani",
    AssignedManagerMail: "manikandan@quadra.com",
    AssignedManagerName: "Manikandan R",
    AssignedManagerDate: "2026-06-06T09:00:00.000Z",
    ApprovedManagerID: "mgr-mani",
    ApprovedManagerMail: "manikandan@quadra.com",
    ApprovedManagerName: "Manikandan R",
    ManagerApprovalStatus: "Approved",
    ManagerApprovedReason: "Approved",
    ManagerApprovedDate: "2026-06-07T09:00:00.000Z",
    AdminAssignedDate: "2026-06-08T10:00:00.000Z",
    AssignedAdminApproverID: "admin-1",
    AssignedAdminApproverName: "Admin User",
    AssignedAdminApproverMail: "admin@quadra.com",
    AdminApprovedDate: "2026-06-08T10:00:00.000Z",
    ApprovedAdminMail: "admin@quadra.com",
    ApprovedAdminID: "admin-1",
    ApprovedAdminName: "Admin User",
    AdminApprovalStatus: "Approved",
    AdminApprovedReason: "Setup completed",
    IsAdminOverride: false,
    AssignedAssetID: "ast-88",
    AssignedAssetName: "Dell OptiPlex 7090",
    AssignedAssetTagID: "AST00088",
    RequestedByName: "Michael Chen",
    RequestedByMail: "michael.chen@quadra.com",
    RequestedByJobTitle: "Financial Analyst",
    RequestedByDepartment: "Finance",
    OverallStatus: "Completed",
    CreatedAt: "2026-06-08T09:45:00.000Z",
    CreatedBy: "Michael Chen",
    ModifiedAt: "2026-06-08T09:45:00.000Z",
    ModifiedBy: "Admin User",
  },
];

type EmployeeCategoryFilter = "All" | "AwaitingManager" | "ReadyToAssign" | "Completed";

const AdminApproval: React.FC = () => {
  const { currentUser } = useAuth();
  const toasterId = useId("admin-approval-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [layoutMode, setLayoutMode] = useState<"tabs" | "hub">(() => {
    return (localStorage.getItem("quadra_admin_request_layout_mode") as "tabs" | "hub") || "tabs";
  });
  const [view, setView] = useState<RequestType>(() => {
    const saved = localStorage.getItem("quadra_admin_request_layout_mode");
    return saved === "hub" ? "select" : "employee";
  });
  const [selectedUpgradeRequest, setSelectedUpgradeRequest] = useState<AssetUpgradeRequestRecord | null>(null);
  const [selectedRepairRequest, setSelectedRepairRequest] = useState<AssetRepairRequestRecord | null>(null);
  const [requests, setRequests] = useState<AssetUserRequestRecord[]>(INITIAL_DEMO_REQUESTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [hrSearch, setHRSearch] = useState("");
  const [handoverSearch, setHandoverSearch] = useState("");
  const [activeTab, setActiveTab] = useState<RequestStatusTabValue>("All");
  const [categoryTab, setCategoryTab] = useState<EmployeeCategoryFilter>("All");
  const [employeeViewMode, setEmployeeViewMode] = useState<"cards" | "list">("cards");
  const [departmentFilter, setDepartmentFilter] = useState("All departments");
  const [teamFilter, setTeamFilter] = useState("");
  const [page, setPage] = useState(1);

  const [detailsRequest, setDetailsRequest] = useState<AssetUserRequestRecord | null>(null);
  const [detailsDecision, setDetailsDecision] = useState<"Approve" | "Override" | "Reject" | "Reprogress" | null>(null);

  const [hrRequests, setHRRequests] = useState<AssetHRRequestRecord[]>([]);
  const [hrLoading, setHRLoading] = useState(true);
  const [hrActiveTab, setHRActiveTab] = useState<HRRequestStatus | "All">("All");
  const [hrDetailsId, setHRDetailsId] = useState<string | null>(null);
  const [hrCategorySummary, setHRCategorySummary] = useState<HRRequestCategorySummary[]>([]);
  const [hrCategorySummaryLoading, setHRCategorySummaryLoading] = useState(true);

  const [upgradeRequests, setUpgradeRequests] = useState<AssetUpgradeRequestRecord[]>([]);
  const [upgradeLoading, setUpgradeLoading] = useState(true);

  const [repairRequests, setRepairRequests] = useState<AssetRepairRequestRecord[]>([]);
  const [repairLoading, setRepairLoading] = useState(true);

  const [handoverRequests, setHandoverRequests] = useState<AssetHandoverRequestRecord[]>([]);
  const [handoverLoading, setHandoverLoading] = useState(true);
  const [handoverActiveTab, setHandoverActiveTab] = useState<HandoverRequestStatus | "All">("All");
  const [handoverDetailsId, setHandoverDetailsId] = useState<string | null>(null);

  const [lostRequests, setLostRequests] = useState<AssetLostRequestRecord[]>([]);
  const [lostLoading, setLostLoading] = useState(true);

  const loadHandoverRequests = async () => {
    if (!currentUser?.userID) return;
    setHandoverLoading(true);
    try {
      const data = await getAssetHandoverRequests(currentUser.userID);
      setHandoverRequests(data);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load handover requests"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setHandoverLoading(false);
    }
  };

  const loadLostRequests = async () => {
    if (!currentUser?.userID) return;
    setLostLoading(true);
    try {
      const data = await getAssetLostRequests({ adminId: currentUser.userID });
      setLostRequests(data);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load lost asset requests"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setLostLoading(false);
    }
  };

  const loadRepairRequests = async () => {
    if (!currentUser?.userID) return;
    setRepairLoading(true);
    try {
      const data = await getAssetRepairRequests({ adminId: currentUser.userID });
      setRepairRequests(data);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load repair requests"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setRepairLoading(false);
    }
  };

  const loadUpgradeRequests = async () => {
    if (!currentUser?.userID) return;
    setUpgradeLoading(true);
    try {
      const data = await getAssetUpgradeRequests({ adminId: currentUser.userID });
      setUpgradeRequests(data);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load upgrade requests"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setUpgradeLoading(false);
    }
  };

  const loadData = async () => {
    if (!currentUser?.userID) return;
    setLoading(true);
    try {
      const data = await getAdminAssetRequests(currentUser.userID);
      const combined = [...(data || [])];
      INITIAL_DEMO_REQUESTS.forEach((demo) => {
        if (!combined.some((r) => r.ID === demo.ID || (r.RequestedByName === demo.RequestedByName && r.AssetType === demo.AssetType))) {
          combined.push(demo);
        }
      });
      setRequests(combined);
    } catch (error) {
      setRequests(INITIAL_DEMO_REQUESTS);
    } finally {
      setLoading(false);
    }
  };

  const loadHRRequests = async () => {
    if (!currentUser?.userID) return;
    setHRLoading(true);
    try {
      const data = await getAssetHRRequests(currentUser.userID);
      setHRRequests(data);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load HR requests"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setHRLoading(false);
    }
  };

  const loadHRCategorySummary = async () => {
    setHRCategorySummaryLoading(true);
    try {
      const data = await getAssetHRRequestCategorySummary();
      setHRCategorySummary(data);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load category summary"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setHRCategorySummaryLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadHRRequests();
    loadHRCategorySummary();
    loadUpgradeRequests();
    loadRepairRequests();
    loadHandoverRequests();
    loadLostRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.userID]);

  useEffect(() => {
    setPage(1);
  }, [search, activeTab, categoryTab]);

  const employeeCategoryCounts = useMemo(() => {
    return {
      All: requests.length,
      AwaitingManager: requests.filter((r) => r.ManagerApprovalStatus === "Pending" || r.OverallStatus === "PendingManagerApproval").length,
      ReadyToAssign: requests.filter((r) => (r.ManagerApprovalStatus === "Approved" || r.OverallStatus === "PendingAdminApproval") && r.AdminApprovalStatus !== "Approved").length,
      Completed: requests.filter((r) => r.OverallStatus === "Completed" || r.AdminApprovalStatus === "Approved").length,
    };
  }, [requests]);

  const employeeFiltered = useMemo(() => {
    return requests.filter((r) => {
      if (categoryTab === "AwaitingManager") {
        if (!(r.ManagerApprovalStatus === "Pending" || r.OverallStatus === "PendingManagerApproval")) return false;
      } else if (categoryTab === "ReadyToAssign") {
        if (!((r.ManagerApprovalStatus === "Approved" || r.OverallStatus === "PendingAdminApproval") && r.AdminApprovalStatus !== "Approved")) return false;
      } else if (categoryTab === "Completed") {
        if (!(r.OverallStatus === "Completed" || r.AdminApprovalStatus === "Approved")) return false;
      }

      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matches =
          r.RequestNumber?.toLowerCase().includes(term) ||
          r.AssetType.toLowerCase().includes(term) ||
          r.PurposeOfRequest.toLowerCase().includes(term) ||
          r.RequestedByName?.toLowerCase().includes(term) ||
          (r.RequestedByDepartment || "").toLowerCase().includes(term) ||
          (r.AssignedManagerName || "").toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [requests, categoryTab, search]);

  const employeeTotalPages = Math.max(1, Math.ceil(employeeFiltered.length / PAGE_SIZE));
  const employeePaged = useMemo(() => employeeFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [employeeFiltered, page]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (activeTab !== "All" && r.OverallStatus !== activeTab) return false;
      if (departmentFilter !== "All departments" && (r.RequestedByDepartment || "Unknown") !== departmentFilter) return false;
      if (teamFilter.trim() && !(r.AssignedManagerName || "").toLowerCase().includes(teamFilter.trim().toLowerCase())) return false;
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matches =
          r.RequestNumber?.toLowerCase().includes(term) ||
          r.AssetType.toLowerCase().includes(term) ||
          r.PurposeOfRequest.toLowerCase().includes(term) ||
          r.RequestedByName?.toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [requests, activeTab, search, departmentFilter, teamFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

  const statusTabCounts = useMemo(() => getStatusTabCounts(requests), [requests]);

  const hrStatusTabCounts = useMemo(() => {
    const counts = { All: hrRequests.length } as Record<HRRequestStatus | "All", number>;
    HR_STATUS_TABS.forEach((tab) => {
      if (tab.value === "All") return;
      counts[tab.value] = hrRequests.filter((r) => r.Status === tab.value).length;
    });
    return counts;
  }, [hrRequests]);

  const filteredHRRequests = useMemo(() => {
    return hrRequests.filter((r) => {
      if (hrActiveTab !== "All" && r.Status !== hrActiveTab) return false;
      if (hrSearch.trim()) {
        const term = hrSearch.trim().toLowerCase();
        const matches =
          r.HRRequestID?.toLowerCase().includes(term) ||
          (r.RequestedUserName || "").toLowerCase().includes(term) ||
          (r.Role || "").toLowerCase().includes(term) ||
          (r.Department || "").toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [hrRequests, hrActiveTab, hrSearch]);

  const pendingEmployeeCount = useMemo(
    () => requests.filter((r) => r.AdminApprovalStatus === "Pending").length,
    [requests]
  );

  const pendingHRCount = useMemo(
    () => hrRequests.filter((r) => r.Status === "Pending" || r.Status === "InProgress").length,
    [hrRequests]
  );

  const pendingUpgradeCount = useMemo(
    () => upgradeRequests.filter((r) => r.AdminApprovalStatus === "Pending" && r.ManagerApprovalStatus === "Approved").length,
    [upgradeRequests]
  );

  const pendingRepairCount = useMemo(
    () => repairRequests.filter((r) => r.RequestStatus === "Pending").length,
    [repairRequests]
  );

  const handoverStatusTabCounts = useMemo(() => {
    const counts = { All: handoverRequests.length } as Record<HandoverRequestStatus | "All", number>;
    HANDOVER_STATUS_TABS.forEach((tab) => {
      if (tab.value === "All") return;
      counts[tab.value] = handoverRequests.filter((r) => r.Status === tab.value).length;
    });
    return counts;
  }, [handoverRequests]);

  const filteredHandoverRequests = useMemo(() => {
    return handoverRequests.filter((r) => {
      if (handoverActiveTab !== "All" && r.Status !== handoverActiveTab) return false;
      if (handoverSearch.trim()) {
        const term = handoverSearch.trim().toLowerCase();
        const matches =
          r.HandoverRequestID?.toLowerCase().includes(term) ||
          (r.RequestedUserName || "").toLowerCase().includes(term) ||
          (r.Reason || "").toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [handoverRequests, handoverActiveTab, handoverSearch]);

  const pendingHandoverCount = useMemo(
    () => handoverRequests.filter((r) => r.Status === "Pending" || r.Status === "InProgress").length,
    [handoverRequests]
  );

  const pendingLostCount = useMemo(
    () => lostRequests.filter((r) => r.RequestStatus === "Pending" || r.RequestStatus === "InProgress").length,
    [lostRequests]
  );

  const currentCategoryKPIs = useMemo(() => {
    switch (view) {
      case "employee": {
        const total = requests.length;
        const pending = requests.filter((r) => r.AdminApprovalStatus === "Pending").length;
        const approved = requests.filter((r) => r.AdminApprovalStatus === "Approved" || r.OverallStatus === "Completed").length;
        const rejected = requests.filter((r) => r.AdminApprovalStatus === "Rejected").length;
        return { total, pending, approved, rejected, pendingLabel: "Pending Approval", approvedLabel: "Approved & Ready", rejectedLabel: "Rejected" };
      }
      case "hr": {
        const total = hrRequests.length;
        const pending = hrRequests.filter((r) => r.Status === "Pending" || r.Status === "InProgress").length;
        const approved = hrRequests.filter((r) => r.Status === "Completed").length;
        const rejected = hrRequests.filter((r) => r.Status === "Rejected").length;
        return { total, pending, approved, rejected, pendingLabel: "Pending Review", approvedLabel: "Fulfilled / Complete", rejectedLabel: "Rejected" };
      }
      case "hardware": {
        const total = upgradeRequests.length;
        const pending = upgradeRequests.filter((r) => r.AdminApprovalStatus === "Pending" || r.OverallStatus === "PendingAdminApproval").length;
        const approved = upgradeRequests.filter((r) => r.AdminApprovalStatus === "Approved" || r.OverallStatus === "Completed").length;
        const rejected = upgradeRequests.filter((r) => r.AdminApprovalStatus === "Rejected").length;
        return { total, pending, approved, rejected, pendingLabel: "Pending Admin", approvedLabel: "Approved / Complete", rejectedLabel: "Rejected" };
      }
      case "repair": {
        const total = repairRequests.length;
        const pending = repairRequests.filter((r) => r.RequestStatus === "Pending" || r.RequestStatus === "Re-Progress").length;
        const approved = repairRequests.filter((r) => r.RequestStatus === "Approved").length;
        const rejected = repairRequests.filter((r) => r.RequestStatus === "Rejected" || r.RequestStatus === "Unrepairable").length;
        return { total, pending, approved, rejected, pendingLabel: "In Repair / Pending", approvedLabel: "Repaired & Returned", rejectedLabel: "Rejected / Closed" };
      }
      case "handover": {
        const total = handoverRequests.length;
        const pending = handoverRequests.filter((r) => r.Status === "Pending" || r.Status === "InProgress").length;
        const approved = handoverRequests.filter((r) => r.Status === "Completed").length;
        const rejected = 0;
        return { total, pending, approved, rejected, pendingLabel: "Pending Handover", approvedLabel: "Completed Handover", rejectedLabel: "Cancelled / Other" };
      }
      case "lost": {
        const total = lostRequests.length;
        const pending = lostRequests.filter((r) => r.RequestStatus === "Pending" || r.RequestStatus === "InProgress").length;
        const approved = lostRequests.filter((r) => r.RequestStatus === "Completed").length;
        const rejected = 0;
        return { total, pending, approved, rejected, pendingLabel: "Open Incident Reports", approvedLabel: "Resolved / Replaced", rejectedLabel: "Closed" };
      }
      default:
        return { total: 0, pending: 0, approved: 0, rejected: 0, pendingLabel: "Pending", approvedLabel: "Approved", rejectedLabel: "Rejected" };
    }
  }, [view, requests, hrRequests, upgradeRequests, repairRequests, handoverRequests, lostRequests]);

  return (
    <>
      <Toaster toasterId={toasterId} />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* <Text size={600} weight="semibold">
          Admin Approval
        </Text> */}

        {/* Header with Title and Layout Mode Switcher */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#0F172A" }}>
              Admin Approvals & Requests
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "13.5px", color: "#64748B" }}>
              Review and process employee asset requisitions, HR allocations, hardware upgrades, repairs, and custody transfers
            </p>
          </div>

          {/* Toggle option to switch between Tabbed Executive View and Category Hub */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                background: "#F1F5F9",
                padding: "3px",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
              }}
            >
              <button
                type="button"
                title="Switch to Tabbed Executive View"
                onClick={() => {
                  setLayoutMode("tabs");
                  if (view === "select") setView("employee");
                  localStorage.setItem("quadra_admin_request_layout_mode", "tabs");
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: layoutMode === "tabs" ? 600 : 500,
                  color: layoutMode === "tabs" ? "#007ED5" : "#64748B",
                  background: layoutMode === "tabs" ? "#FFFFFF" : "transparent",
                  boxShadow: layoutMode === "tabs" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <ListRegular style={{ fontSize: "16px" }} />
                <span>Tabbed View</span>
              </button>
              <button
                type="button"
                title="Switch to Category Hub"
                onClick={() => {
                  setLayoutMode("hub");
                  setView("select");
                  localStorage.setItem("quadra_admin_request_layout_mode", "hub");
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: layoutMode === "hub" ? 600 : 500,
                  color: layoutMode === "hub" ? "#007ED5" : "#64748B",
                  background: layoutMode === "hub" ? "#FFFFFF" : "transparent",
                  boxShadow: layoutMode === "hub" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <AppsRegular style={{ fontSize: "16px" }} />
                <span>Category Hub</span>
              </button>
            </div>
          </div>
        </div>

        {/* TABBED EXECUTIVE VIEW: Pill Switcher + 4 Top KPI Cards */}
        {layoutMode === "tabs" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", overflowX: "auto", paddingBottom: "2px" }}>
              <QuadraPillToggle<RequestType>
                options={[
                  { key: "employee", label: `Asset Requests (${requests.length})`, icon: <PeopleTeamRegular /> },
                  { key: "hr", label: `HR Requests (${hrRequests.length})`, icon: <DocumentPersonRegular /> },
                  { key: "hardware", label: `Hardware Upgrade (${upgradeRequests.length})`, icon: <DeveloperBoardRegular /> },
                  { key: "repair", label: `Repair Requests (${repairRequests.length})`, icon: <WrenchRegular /> },
                  { key: "handover", label: `Asset Handover (${handoverRequests.length})`, icon: <ArrowSwapRegular /> },
                  { key: "lost", label: `Lost Assets (${lostRequests.length})`, icon: <WarningRegular /> },
                ]}
                value={view === "select" ? "employee" : view}
                onChange={(val) => setView(val)}
              />
            </div>

            {/* Top KPI Summary Cards with Numbers (Executive layout) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              {/* Card 1: Total Requisitions */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "18px 22px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#EFF6FF",
                    color: "#007ED5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  <BoxRegular />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Requests
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: 700, color: "#0F172A", marginTop: "2px" }}>
                    {currentCategoryKPIs.total}
                  </div>
                </div>
              </div>

              {/* Card 2: Pending Review / Action */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "18px 22px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#FFFBEB",
                    color: "#D97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  <ClockRegular />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {currentCategoryKPIs.pendingLabel}
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: 700, color: "#D97706", marginTop: "2px" }}>
                    {currentCategoryKPIs.pending}
                  </div>
                </div>
              </div>

              {/* Card 3: Approved / Fulfilled */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "18px 22px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#ECFDF5",
                    color: "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  <CheckmarkCircleRegular />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {currentCategoryKPIs.approvedLabel}
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: 700, color: "#10B981", marginTop: "2px" }}>
                    {currentCategoryKPIs.approved}
                  </div>
                </div>
              </div>

              {/* Card 4: Rejected / Closed */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "18px 22px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#FEF2F2",
                    color: "#EF4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  <DismissRegular />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {currentCategoryKPIs.rejectedLabel}
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: 700, color: "#EF4444", marginTop: "2px" }}>
                    {currentCategoryKPIs.rejected}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* CATEGORY HUB VIEW: 5 Pending Counters Strip + RequestTypeSelector 6-Card Grid */}
        {layoutMode === "hub" && view === "select" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* 5-Metric Pending Summary Strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
              {[
                { label: "Employee Pending", value: pendingEmployeeCount, barColor: "#007ED5" },
                { label: "HR Pending", value: pendingHRCount, barColor: "#8764B8" },
                { label: "Upgrade Pending", value: pendingUpgradeCount, barColor: "#B8860B" },
                { label: "Repair Pending", value: pendingRepairCount, barColor: "#107C10" },
                { label: "Handover / Lost", value: pendingHandoverCount + pendingLostCount, barColor: "#D13438" },
              ].map((stat) => (
                <Card
                  key={stat.label}
                  style={{
                    padding: "16px 20px",
                    borderRadius: "16px",
                    border: "1px solid #E2E8F0",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    background: "#FFFFFF",
                  }}
                >
                  <Text size={200} style={{ color: "#64748B", fontWeight: 500 }}>
                    {stat.label}
                  </Text>
                  <Text size={600} weight="semibold" style={{ display: "block", marginTop: "4px", color: "#0F172A", fontSize: "24px" }}>
                    {stat.value}
                  </Text>
                  <div style={{ height: "4px", marginTop: "10px", borderRadius: "999px", background: stat.barColor }} />
                </Card>
              ))}
            </div>

            {/* Category Grid Selector */}
            <RequestTypeSelector
              cards={[
                {
                  key: "employee",
                  label: "Employee Request",
                  icon: <PeopleTeamRegular />,
                  iconBg: "#F3E9FB",
                  iconColor: "#8764B8",
                  count: pendingEmployeeCount,
                },
                {
                  key: "hr",
                  label: "HR Request",
                  icon: <DocumentPersonRegular />,
                  iconBg: "#EEF1FB",
                  iconColor: "#0066B3",
                  count: pendingHRCount,
                },
                {
                  key: "hardware",
                  label: "Hardware Upgrade",
                  icon: <DeveloperBoardRegular />,
                  iconBg: "#FFF4CE",
                  iconColor: "#B8860B",
                  count: pendingUpgradeCount,
                },
                {
                  key: "repair",
                  label: "Repair Request",
                  icon: <WrenchRegular />,
                  iconBg: "#E7F5EC",
                  iconColor: "#107C10",
                  count: pendingRepairCount,
                },
                {
                  key: "handover",
                  label: "Asset Handover",
                  icon: <ArrowSwapRegular />,
                  iconBg: "#E7F5EC",
                  iconColor: "#107C10",
                  count: pendingHandoverCount,
                },
                {
                  key: "lost",
                  label: "Lost Assets",
                  icon: <WarningRegular />,
                  iconBg: "#FDE7E9",
                  iconColor: "#D13438",
                  count: pendingLostCount,
                },
              ]}
              onSelect={(key) => setView(key as RequestType)}
            />
          </div>
        )}

        {/* Back to Categories Button & 4 KPI Summary Cards when drilled into a category inside Hub Mode */}
        {layoutMode === "hub" && view !== "select" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <button
                type="button"
                onClick={() => setView("select")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "9999px",
                  padding: "8px 18px",
                  fontSize: "13.5px",
                  fontWeight: 600,
                  color: "#0F172A",
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#94A3B8";
                  e.currentTarget.style.background = "#F8FAFC";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.background = "#FFFFFF";
                }}
              >
                <ArrowLeftRegular style={{ fontSize: "16px" }} />
                <span>Back to Categories Hub</span>
              </button>
            </div>

            {/* 4 Executive KPI Summary Cards for active category */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              {/* Card 1: Total */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "18px 22px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#EFF6FF",
                    color: "#007ED5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  <BoxRegular />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Requests
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: 700, color: "#0F172A", marginTop: "2px" }}>
                    {currentCategoryKPIs.total}
                  </div>
                </div>
              </div>

              {/* Card 2: Pending */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "18px 22px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#FFFBEB",
                    color: "#D97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  <ClockRegular />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {currentCategoryKPIs.pendingLabel}
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: 700, color: "#D97706", marginTop: "2px" }}>
                    {currentCategoryKPIs.pending}
                  </div>
                </div>
              </div>

              {/* Card 3: Approved */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "18px 22px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#ECFDF5",
                    color: "#10B981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  <CheckmarkCircleRegular />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {currentCategoryKPIs.approvedLabel}
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: 700, color: "#10B981", marginTop: "2px" }}>
                    {currentCategoryKPIs.approved}
                  </div>
                </div>
              </div>

              {/* Card 4: Rejected */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "18px 22px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#FEF2F2",
                    color: "#EF4444",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  <DismissRegular />
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {currentCategoryKPIs.rejectedLabel}
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: 700, color: "#EF4444", marginTop: "2px" }}>
                    {currentCategoryKPIs.rejected}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Screens Recreated Matching Employee Request */}
        {view === "hr" && (
          <AdminHRRequestSubScreen
            requests={hrRequests}
            loading={hrLoading}
            categorySummary={hrCategorySummary}
            categorySummaryLoading={hrCategorySummaryLoading}
            onSelectRequest={(id) => setHRDetailsId(id)}
            onRefresh={() => {
              loadHRRequests();
              loadHRCategorySummary();
            }}
          />
        )}

        {view === "hardware" && (
          <AdminUpgradeSubScreen
            requests={upgradeRequests}
            loading={upgradeLoading}
            onSelectRequest={(req) => setSelectedUpgradeRequest(req)}
            onRefresh={loadUpgradeRequests}
          />
        )}

        {view === "repair" && (
          <AdminRepairSubScreen
            requests={repairRequests}
            loading={repairLoading}
            onSelectRequest={(req) => setSelectedRepairRequest(req)}
            onRefresh={loadRepairRequests}
          />
        )}

        {view === "handover" && (
          <AdminHandoverSubScreen
            requests={handoverRequests}
            loading={handoverLoading}
            onSelectRequest={(id) => setHandoverDetailsId(id)}
            onRefresh={loadHandoverRequests}
          />
        )}

        {view === "lost" && (
          <AdminLostSubScreen
            requests={lostRequests}
            loading={lostLoading}
            onRefresh={loadLostRequests}
          />
        )}

        {view === "employee" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Redesigned Toolbar matching Screenshot */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              {/* Category Pill Switcher (All 6, Awaiting Manager 2, Ready to Assign 2, Completed 2) */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#F8FAFC",
                  padding: "4px 6px",
                  borderRadius: "999px",
                  border: "1px solid #E2E8F0",
                  gap: "4px",
                }}
              >
                {[
                  { id: "All", label: "All", count: employeeCategoryCounts.All },
                  { id: "AwaitingManager", label: "Awaiting Manager", count: employeeCategoryCounts.AwaitingManager },
                  { id: "ReadyToAssign", label: "Ready to Assign", count: employeeCategoryCounts.ReadyToAssign },
                  { id: "Completed", label: "Completed", count: employeeCategoryCounts.Completed },
                ].map((tab) => {
                  const isActive = categoryTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setCategoryTab(tab.id as EmployeeCategoryFilter)}
                      style={{
                        border: "none",
                        borderRadius: "999px",
                        padding: "7px 18px",
                        background: isActive ? "#FFFFFF" : "transparent",
                        color: isActive ? "#007ED5" : "#475569",
                        fontWeight: isActive ? 700 : 500,
                        fontSize: "14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        cursor: "pointer",
                        boxShadow: isActive ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <span>{tab.label}</span>
                      <span
                        style={{
                          background: isActive ? "#EFF6FF" : "#F1F5F9",
                          color: isActive ? "#007ED5" : "#64748B",
                          borderRadius: "999px",
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          minWidth: "18px",
                          textAlign: "center",
                        }}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search & View Switcher */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div style={{ position: "relative", minWidth: "280px" }}>
                  <Input
                    contentBefore={<SearchRegular style={{ color: "#94A3B8" }} />}
                    placeholder="Search employee, asset type..."
                    value={search}
                    onChange={(_, d) => setSearch(d.value)}
                    style={{
                      width: "100%",
                      borderRadius: "12px",
                      height: "40px",
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                    }}
                  />
                </div>

                {/* View Switcher: Cards vs List */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: "#F1F5F9",
                    padding: "3px",
                    borderRadius: "10px",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <button
                    type="button"
                    title="Cards View"
                    onClick={() => setEmployeeViewMode("cards")}
                    style={{
                      border: "none",
                      background: employeeViewMode === "cards" ? "#FFFFFF" : "transparent",
                      color: employeeViewMode === "cards" ? "#007ED5" : "#64748B",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      boxShadow: employeeViewMode === "cards" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <AppsRegular style={{ fontSize: "18px" }} />
                  </button>
                  <button
                    type="button"
                    title="List View"
                    onClick={() => setEmployeeViewMode("list")}
                    style={{
                      border: "none",
                      background: employeeViewMode === "list" ? "#FFFFFF" : "transparent",
                      color: employeeViewMode === "list" ? "#007ED5" : "#64748B",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      boxShadow: employeeViewMode === "list" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <ListRegular style={{ fontSize: "18px" }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Body: Loading / Empty / Content */}
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <Spinner label="Loading requests..." />
              </div>
            ) : employeeFiltered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px 24px",
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                }}
              >
                <Text size={300} style={{ color: "#64748B" }}>
                  No requests matching this filter or search query.
                </Text>
              </div>
            ) : employeeViewMode === "cards" ? (
              /* ================= CARDS VIEW (Matching Screenshot 1:1) ================= */
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
                  gap: "20px",
                }}
              >
                {employeeFiltered.map((request) => {
                  const isAwaitingManager =
                    request.ManagerApprovalStatus === "Pending" ||
                    request.OverallStatus === "PendingManagerApproval";
                  const isReadyToAssign =
                    (request.ManagerApprovalStatus === "Approved" ||
                      request.OverallStatus === "PendingAdminApproval") &&
                    request.AdminApprovalStatus !== "Approved";
                  const isCompleted =
                    request.OverallStatus === "Completed" || request.AdminApprovalStatus === "Approved";

                  const accentColor = isAwaitingManager
                    ? "#EA580C"
                    : isReadyToAssign
                    ? "#2563EB"
                    : "#16A34A";

                  const isMonitor = (request.AssetType || "").toLowerCase().includes("monitor");

                  return (
                    <div
                      key={request.ID}
                      style={{
                        background: "#FFFFFF",
                        borderRadius: "16px",
                        border: "1px solid #E2E8F0",
                        borderLeft: `4px solid ${accentColor}`,
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
                        padding: "22px 24px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div>
                        {/* Header: Avatar, Name, Dept, Status Pill */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: "14px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "50%",
                                background: "#EFF6FF",
                                color: "#2563EB",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "15px",
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(request.RequestedByName)}
                            </div>
                            <div>
                              <div
                                style={{
                                  fontWeight: 700,
                                  fontSize: "16px",
                                  color: "#0F172A",
                                  lineHeight: 1.2,
                                }}
                              >
                                {request.RequestedByName || "Employee"}
                              </div>
                              <div style={{ fontSize: "13px", color: "#64748B", marginTop: "3px" }}>
                                {request.RequestedByDepartment || "General"}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge Pills matching screenshot */}
                          {isAwaitingManager && (
                            <span
                              style={{
                                background: "#FEF3C7",
                                color: "#B45309",
                                borderRadius: "999px",
                                padding: "4px 14px",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              Awaiting Manager
                            </span>
                          )}
                          {isReadyToAssign && (
                            <span
                              style={{
                                background: "#DBEAFE",
                                color: "#1D4ED8",
                                borderRadius: "999px",
                                padding: "4px 14px",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              Ready to Assign
                            </span>
                          )}
                          {isCompleted && (
                            <span
                              style={{
                                background: "#DCFCE7",
                                color: "#15803D",
                                borderRadius: "999px",
                                padding: "4px 14px",
                                fontSize: "12px",
                                fontWeight: 600,
                              }}
                            >
                              Completed
                            </span>
                          )}
                        </div>

                        {/* Metadata Row: Asset type icon + date icon */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "20px",
                            marginBottom: "12px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              color: "#64748B",
                              fontSize: "13px",
                            }}
                          >
                            {isMonitor ? (
                              <DesktopRegular style={{ fontSize: "16px", color: "#64748B" }} />
                            ) : (
                              <LaptopRegular style={{ fontSize: "16px", color: "#64748B" }} />
                            )}
                            <span style={{ color: "#334155", fontWeight: 500 }}>{request.AssetType}</span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              color: "#64748B",
                              fontSize: "13px",
                            }}
                          >
                            <CalendarRegular style={{ fontSize: "16px", color: "#64748B" }} />
                            <span style={{ color: "#334155", fontWeight: 500 }}>
                              {formatShortDate(request.CreatedAt)}
                            </span>
                          </div>
                        </div>

                        {/* Reason / Purpose */}
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#334155",
                            lineHeight: 1.45,
                            minHeight: "36px",
                            marginBottom: "16px",
                          }}
                        >
                          {request.PurposeOfRequest}
                        </div>
                      </div>

                      <div>
                        {/* Divider */}
                        <div style={{ borderTop: "1px solid #F1F5F9", marginBottom: "14px" }} />

                        {/* Bottom Action Section */}
                        {isAwaitingManager && (
                          <div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#1E293B",
                                marginBottom: "8px",
                              }}
                            >
                              Approval status
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "10px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                  style={{
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "50%",
                                    background: "#FEF3C7",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#D97706",
                                    flexShrink: 0,
                                  }}
                                >
                                  <ClockRegular style={{ fontSize: "15px" }} />
                                </div>
                                <div>
                                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                                    Pending with {request.AssignedManagerName || "Manikandan R"}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#64748B" }}>
                                    Waiting 3 days · SLA 48 hrs
                                  </div>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    dispatchToast(
                                      <Toast>
                                        <ToastTitle>
                                          Reminder sent to {request.AssignedManagerName || "Manikandan R"}
                                        </ToastTitle>
                                      </Toast>,
                                      { intent: "success" }
                                    );
                                  }}
                                  style={{
                                    background: "#FFFFFF",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "8px",
                                    padding: "7px 16px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#334155",
                                    cursor: "pointer",
                                    transition: "background 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                                >
                                  Remind
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDetailsDecision("Approve");
                                    setDetailsRequest(request);
                                  }}
                                  style={{
                                    background: "#15803D",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "7px 16px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#FFFFFF",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    transition: "opacity 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
                                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                                >
                                  <CheckmarkCircleRegular style={{ fontSize: "16px" }} />
                                  <span>Approve as Admin</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {isReadyToAssign && (
                          <div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#1E293B",
                                marginBottom: "8px",
                              }}
                            >
                              Approved by
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "10px",
                              }}
                            >
                              <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>
                                {request.ApprovedManagerName || request.AssignedManagerName || "Manikandan R"}
                              </div>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDetailsDecision("Approve");
                                    setDetailsRequest(request);
                                  }}
                                  style={{
                                    background: "#FFFFFF",
                                    border: "1.5px solid #2563EB",
                                    borderRadius: "999px",
                                    padding: "7px 22px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#2563EB",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#EFF6FF";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "#FFFFFF";
                                  }}
                                >
                                  Select Asset
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {isCompleted && (
                          <div>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 700,
                                color: "#1E293B",
                                marginBottom: "8px",
                              }}
                            >
                              Assigned Asset
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "10px",
                              }}
                            >
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "#16A34A" }}>
                                {request.AssignedAssetName || "Asset Dispatched"} (
                                {request.AssignedAssetTagID || "AST00042"})
                              </div>
                              <div>
                                <button
                                  type="button"
                                  onClick={() => setDetailsRequest(request)}
                                  style={{
                                    background: "#FFFFFF",
                                    border: "1px solid #CBD5E1",
                                    borderRadius: "8px",
                                    padding: "6px 14px",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    color: "#334155",
                                    cursor: "pointer",
                                  }}
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ================= LIST VIEW (Table Representation) ================= */
              <div
                className="quadra-glass-card"
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #E2E8F0",
                  background: "#FFFFFF",
                }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                        <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Employee</th>
                        <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Request #</th>
                        <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Asset</th>
                        <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Purpose</th>
                        <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Date</th>
                        <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Status</th>
                        <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600, textAlign: "right" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employeePaged.map((request) => {
                        const isAwaiting =
                          request.ManagerApprovalStatus === "Pending" ||
                          request.OverallStatus === "PendingManagerApproval";
                        const isReady =
                          (request.ManagerApprovalStatus === "Approved" ||
                            request.OverallStatus === "PendingAdminApproval") &&
                          request.AdminApprovalStatus !== "Approved";

                        return (
                          <tr
                            key={request.ID}
                            style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                          >
                            <td style={{ padding: "14px 18px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    background: "#EFF6FF",
                                    color: "#2563EB",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontWeight: 700,
                                    fontSize: "12px",
                                  }}
                                >
                                  {getInitials(request.RequestedByName)}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600, color: "#0F172A" }}>
                                    {request.RequestedByName || "Employee"}
                                  </div>
                                  <div style={{ fontSize: "11px", color: "#64748B" }}>
                                    {request.RequestedByDepartment || "General"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "14px 18px", fontWeight: 600, color: "#334155" }}>
                              {request.RequestNumber || request.ID.slice(0, 8)}
                            </td>
                            <td style={{ padding: "14px 18px", color: "#334155" }}>
                              {request.AssetType}
                            </td>
                            <td style={{ padding: "14px 18px", color: "#64748B", maxWidth: "260px" }}>
                              <TruncatedText text={request.PurposeOfRequest} />
                            </td>
                            <td style={{ padding: "14px 18px", color: "#64748B" }}>
                              {formatShortDate(request.CreatedAt)}
                            </td>
                            <td style={{ padding: "14px 18px" }}>
                              {isAwaiting && (
                                <span
                                  style={{
                                    background: "#FEF3C7",
                                    color: "#B45309",
                                    borderRadius: "999px",
                                    padding: "3px 10px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                  }}
                                >
                                  Awaiting Manager
                                </span>
                              )}
                              {isReady && (
                                <span
                                  style={{
                                    background: "#DBEAFE",
                                    color: "#1D4ED8",
                                    borderRadius: "999px",
                                    padding: "3px 10px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                  }}
                                >
                                  Ready to Assign
                                </span>
                              )}
                              {!isAwaiting && !isReady && (
                                <span
                                  style={{
                                    background: "#DCFCE7",
                                    color: "#15803D",
                                    borderRadius: "999px",
                                    padding: "3px 10px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                  }}
                                >
                                  Completed
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "14px 18px", textAlign: "right" }}>
                              <Button
                                size="small"
                                appearance={isReady ? "primary" : "subtle"}
                                style={
                                  isReady
                                    ? { background: "#007ED5", borderColor: "#007ED5", borderRadius: "6px" }
                                    : { color: "#007ED5", borderRadius: "6px" }
                                }
                                onClick={() => {
                                  if (isReady) setDetailsDecision("Approve");
                                  else setDetailsDecision(null);
                                  setDetailsRequest(request);
                                }}
                              >
                                {isReady ? "Select Asset" : "View"}
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {employeeTotalPages > 1 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 18px",
                      background: "#F8FAFC",
                      borderTop: "1px solid #E2E8F0",
                    }}
                  >
                    <Text size={200} style={{ color: "#64748B" }}>
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, employeeFiltered.length)} of{" "}
                      {employeeFiltered.length} requests
                    </Text>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Button
                        appearance="subtle"
                        icon={<ChevronLeftRegular />}
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                      />
                      {getPageNumbers(page, employeeTotalPages).map((p, i) =>
                        p === "..." ? (
                          <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "#64748B" }}>
                            …
                          </span>
                        ) : (
                          <Button
                            key={p}
                            appearance={p === page ? "primary" : "subtle"}
                            style={
                              p === page
                                ? { minWidth: "28px", borderRadius: "6px", background: "#007ED5", borderColor: "#007ED5" }
                                : { minWidth: "28px", borderRadius: "6px" }
                            }
                            onClick={() => setPage(p as number)}
                          >
                            {p}
                          </Button>
                        )
                      )}
                      <Button
                        appearance="subtle"
                        icon={<ChevronRightRegular />}
                        disabled={page >= employeeTotalPages}
                        onClick={() => setPage((p) => p + 1)}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <AssetRequestDetailsPanel
        open={!!detailsRequest}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setDetailsRequest(null);
            setDetailsDecision(null);
          }
        }}
        request={detailsRequest}
        role="admin"
        initialDecision={detailsDecision}
        onActionComplete={loadData}
      />

      <HRRequestDetailsPanel
        open={!!hrDetailsId}
        onOpenChange={(isOpen) => !isOpen && setHRDetailsId(null)}
        hrRequestId={hrDetailsId}
        onActionComplete={() => {
          loadHRRequests();
          loadHRCategorySummary();
        }}
      />

      <HandoverRequestDetailsPanel
        open={!!handoverDetailsId}
        onOpenChange={(isOpen) => !isOpen && setHandoverDetailsId(null)}
        handoverRequestId={handoverDetailsId}
        onActionComplete={loadHandoverRequests}
      />

      <UpgradeRequestDetailsPanel
        open={!!selectedUpgradeRequest}
        onOpenChange={(isOpen) => !isOpen && setSelectedUpgradeRequest(null)}
        request={selectedUpgradeRequest}
        role="admin"
        onActionComplete={() => {
          loadUpgradeRequests();
          setSelectedUpgradeRequest(null);
        }}
      />

      <RepairRequestDetailsPanel
        open={!!selectedRepairRequest}
        onOpenChange={(isOpen) => !isOpen && setSelectedRepairRequest(null)}
        request={selectedRepairRequest}
        role="admin"
        onRespondComplete={() => {
          loadRepairRequests();
          setSelectedRepairRequest(null);
        }}
      />
    </>
  );
};

export default AdminApproval;
