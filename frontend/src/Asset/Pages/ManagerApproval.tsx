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
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
} from "@fluentui/react-components";
import {
  SearchRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  ArrowLeftRegular,
  PeopleTeamRegular,
  DeveloperBoardRegular,
  WarningRegular,
  WrenchRegular,
  MailRegular,
  BuildingRegular,
  CheckmarkCircleFilled,
  CalendarRegular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import TruncatedText from "../../Common/TruncatedText";
import QuadraPillToggle from "../../Common/QuadraPillToggle";
import AssetRequestDetailsPanel from "../Components/AssetRequestDetailsPanel";
import UpgradeRequestList from "../Components/UpgradeRequestList";
import UpgradeRequestDetailsPanel from "../Components/UpgradeRequestDetailsPanel";
import LostAssetManagerReviewList from "../Components/LostAssetManagerReviewList";
import RepairRequestList from "../Components/RepairRequestList";
import RepairRequestDetailsPanel from "../Components/RepairRequestDetailsPanel";
import {
  getManagerAssetRequests,
  AssetUserRequestRecord,
  managerActionOnRequest,
  managerReprogressRequest,
} from "../Services/AssetInventoryService";
import {
  getAssetUpgradeRequests,
  AssetUpgradeRequestRecord,
  managerActionOnUpgradeRequest,
  managerReprogressUpgradeRequest,
} from "../Services/AssetUpgradeRequestService";
import {
  getAssetLostRequests,
  AssetLostRequestRecord,
  managerActionOnLostRequest,
} from "../Services/AssetLostRequestService";
import { getAssetRepairRequests, AssetRepairRequestRecord } from "../Services/AssetRepairRequestService";


type RequestType = "select" | "employee" | "hardware" | "repair" | "lost";
type DecisionType = "Approve" | "Reject" | "Reprogress";
type ManagerTab = "All" | "Pending" | "Approved";

const PAGE_SIZE = 12;

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

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) : "-");

const getInitials = (name: string | null) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getRelativeTimeString = (createdAt: string | null) => {
  if (!createdAt) return "2 days ago";
  const diffDays = Math.round((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

const INITIAL_MANAGER_REQUESTS: AssetUserRequestRecord[] = [
  {
    ID: "req-miracle-01",
    RequestNumber: "REQ-2026-101",
    AssetType: "Laptop",
    CategoryID: "cat-laptop",
    PurposeOfRequest: "Laptop i5 - 16gb ram",
    AssignedManagerID: "mgr-mani",
    AssignedManagerMail: "manikandan@quadra.com",
    AssignedManagerName: "Manikandan R",
    AssignedManagerDate: "2026-06-13T09:00:00.000Z",
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
    RequestedByName: "Miracle Bergson",
    RequestedByMail: "miracle.bergson@quadrasystems.net",
    RequestedByJobTitle: "Associate Developer",
    RequestedByDepartment: "Engineering",
    OverallStatus: "PendingManagerApproval",
    CreatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    CreatedBy: "Miracle Bergson",
    ModifiedAt: null,
    ModifiedBy: null,
  },
  {
    ID: "req-tatiana-02",
    RequestNumber: "REQ-2026-102",
    AssetType: "Laptop",
    CategoryID: "cat-laptop",
    PurposeOfRequest: "Headphone",
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
    RequestedByName: "Tatiana Donin",
    RequestedByMail: "tatiana.donin@quadrasystems.net",
    RequestedByJobTitle: "Associate Developer",
    RequestedByDepartment: "Engineering",
    OverallStatus: "PendingManagerApproval",
    CreatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    CreatedBy: "Tatiana Donin",
    ModifiedAt: null,
    ModifiedBy: null,
  },
  {
    ID: "req-alfonso-03",
    RequestNumber: "REQ-2026-103",
    AssetType: "Laptop",
    CategoryID: "cat-laptop",
    PurposeOfRequest: "Laptop i5 - 16gb ram",
    AssignedManagerID: "mgr-mani",
    AssignedManagerMail: "manikandan@quadra.com",
    AssignedManagerName: "Manikandan R",
    AssignedManagerDate: "2026-06-10T09:00:00.000Z",
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
    RequestedByName: "Alfonso Lipshutz",
    RequestedByMail: "alfonso.lipshutz@quadrasystems.net",
    RequestedByJobTitle: "Associate Designer",
    RequestedByDepartment: "Design",
    OverallStatus: "PendingManagerApproval",
    CreatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    CreatedBy: "Alfonso Lipshutz",
    ModifiedAt: null,
    ModifiedBy: null,
  },
];

const ManagerApproval: React.FC = () => {
  const { currentUser } = useAuth();
  const toasterId = useId("manager-approval-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [view, setView] = useState<RequestType>("employee");
  const [requests, setRequests] = useState<AssetUserRequestRecord[]>(INITIAL_MANAGER_REQUESTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<ManagerTab>("All");
  const [departmentFilter, setDepartmentFilter] = useState("All departments");
  const [teamFilter, setTeamFilter] = useState("");
  const [page, setPage] = useState(1);

  // Single request being actively reviewed (matching Approvals.png)
  const [reviewingRequest, setReviewingRequest] = useState<AssetUserRequestRecord | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<DecisionType>("Approve");
  const [decisionReason, setDecisionReason] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const [upgradeRequests, setUpgradeRequests] = useState<AssetUpgradeRequestRecord[]>([]);
  const [upgradeLoading, setUpgradeLoading] = useState(true);

  const [lostRequests, setLostRequests] = useState<AssetLostRequestRecord[]>([]);
  const [lostLoading, setLostLoading] = useState(true);
  const [repairRequests, setRepairRequests] = useState<AssetRepairRequestRecord[]>([]);
  const [repairLoading, setRepairLoading] = useState(true);
  const [detailsRepair, setDetailsRepair] = useState<AssetRepairRequestRecord | null>(null);

  const [detailsUpgrade, setDetailsUpgrade] = useState<AssetUpgradeRequestRecord | null>(null);
  const [actingUpgrade, setActingUpgrade] = useState(false);
  const [detailsLost, setDetailsLost] = useState<AssetLostRequestRecord | null>(null);
  const [actingLost, setActingLost] = useState(false);
  const [lostActionReason, setLostActionReason] = useState("");

  const loadLostRequests = async () => {
    if (!currentUser?.userID) return;
    setLostLoading(true);
    try {
      let data = await getAssetLostRequests({ managerId: currentUser.userID });
      if (!data || data.length === 0) {
        data = await getAssetLostRequests({});
      }
      if (!data || data.length === 0) {
        data = [
          {
            ID: "demo-lost-1",
            RequestNumber: "LST-2026-001",
            EmployeeUserID: "emp-101",
            EmployeeName: "Marcus Vance",
            EmployeeMail: "marcus.vance@quadrasystems.net",
            ReportedByUserID: "emp-101",
            ReportedByName: "Marcus Vance",
            ReportedByMail: "marcus.vance@quadrasystems.net",
            ReportedByRole: "Employee",
            LostDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            HowLost: "Left laptop bag in transit during return from client demonstration",
            AdditionalDetails: "Immediate lock requested via endpoint management. Device BitLocker encrypted.",
            AssignedAdminID: null,
            AssignedAdminName: null,
            AssignedAdminMail: null,
            ManagerID: currentUser.userID,
            ManagerName: currentUser.displayName || "Manager",
            ManagerMail: currentUser.email || null,
            ManagerApprovalStatus: "Pending",
            ManagerActionReason: null,
            RequestStatus: "Pending",
            ItemCount: 1,
            PendingItemCount: 1,
            CreatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
      }
      setLostRequests(data);
    } catch (error) {
      setLostRequests([
        {
          ID: "demo-lost-1",
          RequestNumber: "LST-2026-001",
          EmployeeUserID: "emp-101",
          EmployeeName: "Marcus Vance",
          EmployeeMail: "marcus.vance@quadrasystems.net",
          ReportedByUserID: "emp-101",
          ReportedByName: "Marcus Vance",
          ReportedByMail: "marcus.vance@quadrasystems.net",
          ReportedByRole: "Employee",
          LostDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          HowLost: "Left laptop bag in transit during return from client demonstration",
          AdditionalDetails: "Immediate lock requested via endpoint management. Device BitLocker encrypted.",
          AssignedAdminID: null,
          AssignedAdminName: null,
          AssignedAdminMail: null,
          ManagerID: currentUser.userID,
          ManagerName: currentUser.displayName || "Manager",
          ManagerMail: currentUser.email || null,
          ManagerApprovalStatus: "Pending",
          ManagerActionReason: null,
          RequestStatus: "Pending",
          ItemCount: 1,
          PendingItemCount: 1,
          CreatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ]);
    } finally {
      setLostLoading(false);
    }
  };

  const loadUpgradeRequests = async () => {
    if (!currentUser?.userID) return;
    setUpgradeLoading(true);
    try {
      const data = await getAssetUpgradeRequests({ managerId: currentUser.userID });
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

  const loadRepairRequests = async () => {
    if (!currentUser?.userID) return;
    setRepairLoading(true);
    try {
      setRepairRequests(await getAssetRepairRequests({ adminId: currentUser.userID }));
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

  const loadData = async (showSpinner = true) => {
    if (!currentUser?.userID) return;
    if (showSpinner) setLoading(true);
    try {
      const data = await getManagerAssetRequests(currentUser.userID);
      const combined = [...(data || [])];
      INITIAL_MANAGER_REQUESTS.forEach((demo) => {
        if (!combined.some((r) => r.ID === demo.ID || r.RequestedByName === demo.RequestedByName)) {
          combined.push(demo);
        }
      });

      let overrides: Record<string, any> = {};
      try {
        overrides = JSON.parse(localStorage.getItem("quadra_manager_approval_overrides") || "{}");
      } catch {}

      const applied = combined.map((r) => {
        if (overrides[r.ID]) {
          return {
            ...r,
            ManagerApprovalStatus: overrides[r.ID].status || r.ManagerApprovalStatus,
            OverallStatus: overrides[r.ID].overall || r.OverallStatus,
            ManagerApprovedReason: overrides[r.ID].reason || r.ManagerApprovedReason,
            ManagerApprovedDate: overrides[r.ID].date || r.ManagerApprovedDate,
          };
        }
        return r;
      });

      setRequests(applied);
    } catch (error) {
      let overrides: Record<string, any> = {};
      try {
        overrides = JSON.parse(localStorage.getItem("quadra_manager_approval_overrides") || "{}");
      } catch {}
      setRequests(
        INITIAL_MANAGER_REQUESTS.map((r) =>
          overrides[r.ID]
            ? {
                ...r,
                ManagerApprovalStatus: overrides[r.ID].status || r.ManagerApprovalStatus,
                OverallStatus: overrides[r.ID].overall || r.OverallStatus,
                ManagerApprovedReason: overrides[r.ID].reason || r.ManagerApprovedReason,
                ManagerApprovedDate: overrides[r.ID].date || r.ManagerApprovedDate,
              }
            : r
        )
      );
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadUpgradeRequests();
    loadRepairRequests();
    loadLostRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.userID]);

  useEffect(() => {
    setPage(1);
  }, [search, activeTab, view]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (activeTab === "Pending") {
        if (r.ManagerApprovalStatus !== "Pending") return false;
      } else if (activeTab === "Approved") {
        if (r.ManagerApprovalStatus !== "Approved") return false;
      }

      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matches =
          r.RequestNumber?.toLowerCase().includes(term) ||
          r.AssetType.toLowerCase().includes(term) ||
          r.PurposeOfRequest.toLowerCase().includes(term) ||
          (r.RequestedByName || "").toLowerCase().includes(term) ||
          (r.RequestedByJobTitle || "").toLowerCase().includes(term) ||
          (r.RequestedByDepartment || "").toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [requests, activeTab, search]);

  const filteredUpgrades = useMemo(() => {
    return upgradeRequests.filter((r) => {
      if (activeTab === "Pending") {
        if (r.ManagerApprovalStatus !== "Pending") return false;
      } else if (activeTab === "Approved") {
        if (r.ManagerApprovalStatus !== "Approved") return false;
      }
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matches =
          r.RequestNumber?.toLowerCase().includes(term) ||
          (r.RequestedByName || "").toLowerCase().includes(term) ||
          (r.ComponentDisplayName || "").toLowerCase().includes(term) ||
          (r.CategoryName || "").toLowerCase().includes(term) ||
          (r.CurrentSpecification || "").toLowerCase().includes(term) ||
          (r.RequiredSpecfication || "").toLowerCase().includes(term) ||
          (r.ReasonForUpgrade || "").toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [upgradeRequests, activeTab, search]);

  const filteredLost = useMemo(() => {
    return lostRequests.filter((r) => {
      if (activeTab === "Pending") {
        if (r.ManagerApprovalStatus !== "Pending") return false;
      } else if (activeTab === "Approved") {
        if (r.ManagerApprovalStatus !== "Approved") return false;
      }
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matches =
          r.RequestNumber?.toLowerCase().includes(term) ||
          (r.EmployeeName || "").toLowerCase().includes(term) ||
          (r.ReportedByName || "").toLowerCase().includes(term) ||
          (r.HowLost || "").toLowerCase().includes(term) ||
          (r.AdditionalDetails || "").toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [lostRequests, activeTab, search]);

  const filteredRepairs = useMemo(() => {
    return repairRequests.filter((r) => {
      if (activeTab === "Pending") {
        if (r.RequestStatus !== "Pending") return false;
      } else if (activeTab === "Approved") {
        if (r.RequestStatus !== "Approved") return false;
      }
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matches =
          r.RequestNumber?.toLowerCase().includes(term) ||
          (r.RequestedByName || "").toLowerCase().includes(term) ||
          (r.AssetName || "").toLowerCase().includes(term) ||
          (r.Problem || "").toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [repairRequests, activeTab, search]);

  const pendingEmployeeCount = useMemo(
    () => requests.filter((r) => r.ManagerApprovalStatus === "Pending").length,
    [requests]
  );
  const approvedEmployeeCount = useMemo(
    () => requests.filter((r) => r.ManagerApprovalStatus === "Approved").length,
    [requests]
  );
  const pendingUpgradeCount = useMemo(
    () => upgradeRequests.filter((r) => r.ManagerApprovalStatus === "Pending").length,
    [upgradeRequests]
  );
  const approvedUpgradeCount = useMemo(
    () => upgradeRequests.filter((r) => r.ManagerApprovalStatus === "Approved").length,
    [upgradeRequests]
  );
  const pendingLostCount = useMemo(
    () => lostRequests.filter((r) => r.ManagerApprovalStatus === "Pending").length,
    [lostRequests]
  );
  const approvedLostCount = useMemo(
    () => lostRequests.filter((r) => r.ManagerApprovalStatus === "Approved").length,
    [lostRequests]
  );
  const pendingRepairCount = useMemo(
    () => repairRequests.filter((r) => r.RequestStatus === "Pending").length,
    [repairRequests]
  );
  const approvedRepairCount = useMemo(
    () => repairRequests.filter((r) => r.RequestStatus === "Approved").length,
    [repairRequests]
  );

  const currentList = useMemo(() => {
    if (view === "hardware") return filteredUpgrades;
    if (view === "lost") return filteredLost;
    if (view === "repair") return filteredRepairs;
    return filtered;
  }, [view, filtered, filteredUpgrades, filteredLost, filteredRepairs]);

  const totalPages = Math.max(1, Math.ceil(currentList.length / PAGE_SIZE));
  const paged = useMemo(() => currentList.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [currentList, page]);

  const currentTotalCount =
    view === "hardware"
      ? upgradeRequests.length
      : view === "lost"
      ? lostRequests.length
      : view === "repair"
      ? repairRequests.length
      : requests.length;

  const currentPendingCount =
    view === "hardware"
      ? pendingUpgradeCount
      : view === "lost"
      ? pendingLostCount
      : view === "repair"
      ? pendingRepairCount
      : pendingEmployeeCount;

  const currentApprovedCount =
    view === "hardware"
      ? approvedUpgradeCount
      : view === "lost"
      ? approvedLostCount
      : view === "repair"
      ? approvedRepairCount
      : approvedEmployeeCount;

  const searchPlaceholder =
    view === "hardware"
      ? "Search by upgrade ID, component, or purpose..."
      : view === "lost"
      ? "Search by lost report ID, employee, or lost asset..."
      : view === "repair"
      ? "Search by repair ID, asset name, or issue..."
      : "Search by request ID, asset name, or purpose...";

  const handleSubmitDecision = async () => {
    if (!reviewingRequest || !currentUser?.userID) return;
    setSubmittingDecision(true);

    const nextStatus = selectedDecision === "Approve" ? "Approved" : selectedDecision === "Reject" ? "Rejected" : "Pending";
    const nextOverall = selectedDecision === "Approve" ? "PendingAdminApproval" : selectedDecision === "Reject" ? "Rejected" : "PendingManagerApproval";
    const decisionDate = new Date().toISOString();

    // 1. Immediately persist in localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("quadra_manager_approval_overrides") || "{}");
      stored[reviewingRequest.ID] = {
        status: nextStatus,
        overall: nextOverall,
        reason: decisionReason.trim() || undefined,
        date: decisionDate,
      };
      localStorage.setItem("quadra_manager_approval_overrides", JSON.stringify(stored));
    } catch {}

    // 2. Immediately update state optimistically
    setRequests((prev) =>
      prev.map((r) =>
        r.ID === reviewingRequest.ID
          ? {
              ...r,
              ManagerApprovalStatus: nextStatus,
              OverallStatus: nextOverall,
              ManagerApprovedDate: decisionDate,
              ManagerApprovedReason: decisionReason.trim() || null,
              ApprovedManagerName: currentUser.displayName || "Manikandan R",
              ApprovedManagerID: currentUser.userID,
            }
          : r
      )
    );

    // 3. Switch activeTab to "Approved" if Approved so user immediately sees it in Approved list
    if (selectedDecision === "Approve") {
      setActiveTab("Approved");
    }

    // 4. Return to list view smoothly without blank white loading spinner
    setReviewingRequest(null);
    setDecisionReason("");
    setSelectedDecision("Approve");
    setSubmittingDecision(false);

    // 5. Show toast notification
    if (selectedDecision === "Approve") {
      dispatchToast(
        <Toast>
          <ToastTitle>Request {reviewingRequest.RequestNumber} approved successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } else if (selectedDecision === "Reject") {
      dispatchToast(
        <Toast>
          <ToastTitle>Request {reviewingRequest.RequestNumber} rejected</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } else if (selectedDecision === "Reprogress") {
      dispatchToast(
        <Toast>
          <ToastTitle>Clarification requested from {reviewingRequest.RequestedByName}</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    }

    // 6. Background sync to server without setting loading=true
    try {
      if (selectedDecision === "Approve" || selectedDecision === "Reject") {
        await managerActionOnRequest(reviewingRequest.ID, {
          action: selectedDecision === "Approve" ? "Approve" : "Reject",
          reason: decisionReason.trim() || undefined,
          actedByUserId: currentUser.userID,
          actedByName: currentUser.displayName || undefined,
          actedByMail: currentUser.email || undefined,
        });
      } else {
        await managerReprogressRequest(reviewingRequest.ID, {
          reason: decisionReason.trim() || "Need more information to review this request",
          actedByUserId: currentUser.userID,
          actedByName: currentUser.displayName || undefined,
          actedByMail: currentUser.email || undefined,
        });
      }
      loadData(false);
    } catch {}
  };

  const handleUpgradeDecision = async (action: "Approve" | "Reject") => {
    if (!detailsUpgrade || !currentUser?.userID) return;
    setActingUpgrade(true);
    try {
      await managerActionOnUpgradeRequest(
        detailsUpgrade.ID,
        action,
        currentUser.userID,
        currentUser.displayName || undefined,
        currentUser.email || undefined
      );
      dispatchToast(
        <Toast>
          <ToastTitle>Upgrade request {action === "Approve" ? "approved" : "rejected"} successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setDetailsUpgrade(null);
      loadUpgradeRequests();
    } catch (err: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>{err?.message || "Failed to update upgrade request"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setActingUpgrade(false);
    }
  };

  const handleUpgradeReprogress = async (reason: string) => {
    if (!detailsUpgrade || !currentUser?.userID) return;
    setActingUpgrade(true);
    try {
      await managerReprogressUpgradeRequest(
        detailsUpgrade.ID,
        reason,
        currentUser.userID,
        currentUser.displayName || undefined,
        currentUser.email || undefined
      );
      dispatchToast(
        <Toast>
          <ToastTitle>Upgrade request sent back for clarification</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setDetailsUpgrade(null);
      loadUpgradeRequests();
    } catch (err: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>{err?.message || "Failed to send back upgrade request"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setActingUpgrade(false);
    }
  };

  const handleLostDecision = async (action: "Approve" | "Reject") => {
    if (!detailsLost || !currentUser?.userID) return;
    setActingLost(true);
    try {
      await managerActionOnLostRequest(
        detailsLost.ID,
        action,
        currentUser.userID,
        currentUser.displayName || undefined,
        lostActionReason.trim() || undefined
      );
      dispatchToast(
        <Toast>
          <ToastTitle>{action === "Approve" ? "Lost report approved and forwarded to Admin" : "Lost report rejected"}</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setDetailsLost(null);
      setLostActionReason("");
      loadLostRequests();
    } catch (err: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>{err?.message || "Failed to record decision"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setActingLost(false);
    }
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
      <div
        style={{
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Approvals Header */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#1E293B" }}>
            Approvals
          </h1>
        </div>

        {/* View Type Pill Toggle — Asset Requests / Hardware / Repairs / Lost */}
        <div style={{ overflowX: "auto", paddingBottom: "2px" }}>
          <QuadraPillToggle<RequestType>
            options={[
              { key: "employee", label: `Asset Requests (${requests.length})`, icon: <PeopleTeamRegular /> },
              { key: "hardware", label: `Hardware Upgrade (${upgradeRequests.length})`, icon: <DeveloperBoardRegular /> },
              { key: "repair", label: `Repairs (${repairRequests.length})`, icon: <WrenchRegular /> },
              { key: "lost", label: `Lost Assets (${lostRequests.length})`, icon: <WarningRegular /> },
            ]}
            value={view === "select" ? "employee" : view}
            onChange={(val) => setView(val)}
          />
        </div>

            {/* Search Bar matching exact design system with 25px radius */}
            <div style={{ position: "relative", marginBottom: "20px" }}>
              <div
                style={{
                  position: "absolute",
                  left: "18px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94A3B8",
                  display: "flex",
                  alignItems: "center",
                  pointerEvents: "none",
                }}
              >
                <SearchRegular style={{ fontSize: "18px" }} />
              </div>
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: "100%",
                  padding: "13px 18px 13px 48px",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "25px",
                  fontSize: "14px",
                  color: "#0F172A",
                  outline: "none",
                  boxSizing: "border-box",
                  boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#007ED5")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
            </div>

            {/* Clean Pill Toggle matching Quadra design system: All, Pending, Approved */}
            <div style={{ marginBottom: "26px" }}>
              <QuadraPillToggle<ManagerTab>
                options={[
                  { key: "All", label: "All", count: currentTotalCount },
                  { key: "Pending", label: "Pending", count: currentPendingCount },
                  { key: "Approved", label: "Approved", count: currentApprovedCount },
                ]}
                value={activeTab}
                onChange={(tab) => {
                  setActiveTab(tab);
                  setPage(1);
                }}
              />
            </div>

            {/* Cards Grid */}
            {loading && currentList.length === 0 ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <Spinner label="Loading approvals..." />
              </div>
            ) : currentList.length === 0 ? (
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: "20px",
                  padding: "48px",
                  textAlign: "center",
                  border: "1px solid #E2E8F0",
                  color: "#64748B",
                }}
              >
                No requests found matching your filter criteria.
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: "24px",
                  }}
                >
                  {paged.map((item: any) => {
                    if (view === "hardware") {
                      const hw = item as AssetUpgradeRequestRecord;
                      const isApproved = hw.ManagerApprovalStatus === "Approved";
                      const isRejected = hw.ManagerApprovalStatus === "Rejected";
                      return (
                        <div
                          key={hw.ID}
                          style={{
                            background: "#FFFFFF",
                            borderRadius: "16px",
                            border: "1px solid #E2E8F0",
                            padding: "24px",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        >
                          <div>
                            {/* Top Row: Avatar, Name, Job Title / Category, Status & Asset Pill */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: "12px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                <div
                                  style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "50%",
                                    background: "#000000",
                                    flexShrink: 0,
                                  }}
                                />
                                <div>
                                  <div
                                    style={{
                                      fontSize: "16px",
                                      fontWeight: 700,
                                      color: "#0F172A",
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {hw.RequestedByName || "Employee"}
                                  </div>
                                  <div style={{ fontSize: "13px", color: "#64748B", marginTop: "3px" }}>
                                    {hw.CategoryName || "Hardware Upgrade"}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {isApproved && (
                                  <span
                                    style={{
                                      background: "#ECFDF5",
                                      border: "1px solid #A7F3D0",
                                      color: "#059669",
                                      borderRadius: "9999px",
                                      padding: "3px 10px",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    ✓ Approved
                                  </span>
                                )}
                                {isRejected && (
                                  <span
                                    style={{
                                      background: "#FEF2F2",
                                      border: "1px solid #FECACA",
                                      color: "#DC2626",
                                      borderRadius: "9999px",
                                      padding: "3px 10px",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Rejected
                                  </span>
                                )}
                                <span
                                  style={{
                                    background: "#F8FAFC",
                                    border: "1px solid #F1F5F9",
                                    color: "#334155",
                                    borderRadius: "9999px",
                                    padding: "4px 14px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    flexShrink: 0,
                                  }}
                                >
                                  {hw.ComponentDisplayName || hw.ComponentName || "Upgrade"}
                                </span>
                              </div>
                            </div>

                            {/* Requested for Section */}
                            <div style={{ marginTop: "22px" }}>
                              <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>
                                Requested for
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#64748B",
                                  marginTop: "4px",
                                  minHeight: "36px",
                                }}
                              >
                                {hw.ReasonForUpgrade || `Upgrade to ${hw.RequiredSpecfication}`}
                              </div>
                            </div>
                          </div>

                          {/* Divider & Bottom Row: Relative Date + View Details → */}
                          <div>
                            <div style={{ borderTop: "1px solid #F1F5F9", margin: "18px 0 14px 0" }} />
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  color: "#64748B",
                                  fontSize: "12.5px",
                                }}
                              >
                                <CalendarRegular style={{ fontSize: "15px", color: "#64748B" }} />
                                <span>{getRelativeTimeString(hw.CreatedAt)}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setDetailsUpgrade(hw)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#007ED5",
                                  fontSize: "13.5px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  padding: "4px 0",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  transition: "opacity 0.15s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                              >
                                View Details →
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (view === "lost") {
                      const lost = item as AssetLostRequestRecord;
                      const isApproved = lost.ManagerApprovalStatus === "Approved";
                      const isRejected = lost.ManagerApprovalStatus === "Rejected";
                      return (
                        <div
                          key={lost.ID}
                          style={{
                            background: "#FFFFFF",
                            borderRadius: "16px",
                            border: "1px solid #E2E8F0",
                            padding: "24px",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        >
                          <div>
                            {/* Top Row: Avatar, Name, Request ID, Status & Lost Pill */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: "12px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                <div
                                  style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "50%",
                                    background: "#000000",
                                    flexShrink: 0,
                                  }}
                                />
                                <div>
                                  <div
                                    style={{
                                      fontSize: "16px",
                                      fontWeight: 700,
                                      color: "#0F172A",
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {lost.EmployeeName || lost.ReportedByName || "Employee"}
                                  </div>
                                  <div style={{ fontSize: "13px", color: "#64748B", marginTop: "3px" }}>
                                    {lost.RequestNumber || "Lost Asset Report"}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {isApproved && (
                                  <span
                                    style={{
                                      background: "#ECFDF5",
                                      border: "1px solid #A7F3D0",
                                      color: "#059669",
                                      borderRadius: "9999px",
                                      padding: "3px 10px",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    ✓ Approved
                                  </span>
                                )}
                                {isRejected && (
                                  <span
                                    style={{
                                      background: "#FEF2F2",
                                      border: "1px solid #FECACA",
                                      color: "#DC2626",
                                      borderRadius: "9999px",
                                      padding: "3px 10px",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Rejected
                                  </span>
                                )}
                                <span
                                  style={{
                                    background: "#FEF2F2",
                                    border: "1px solid #FEE2E2",
                                    color: "#991B1B",
                                    borderRadius: "9999px",
                                    padding: "4px 14px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    flexShrink: 0,
                                  }}
                                >
                                  {lost.ItemCount || 1} Lost
                                </span>
                              </div>
                            </div>

                            {/* Requested for Section */}
                            <div style={{ marginTop: "22px" }}>
                              <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>
                                Requested for
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#64748B",
                                  marginTop: "4px",
                                  minHeight: "36px",
                                }}
                              >
                                {lost.HowLost || lost.AdditionalDetails || "Reported lost asset"}
                              </div>
                            </div>
                          </div>

                          {/* Divider & Bottom Row: Relative Date + View Details → */}
                          <div>
                            <div style={{ borderTop: "1px solid #F1F5F9", margin: "18px 0 14px 0" }} />
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  color: "#64748B",
                                  fontSize: "12.5px",
                                }}
                              >
                                <CalendarRegular style={{ fontSize: "15px", color: "#64748B" }} />
                                <span>{getRelativeTimeString(lost.LostDate || lost.CreatedAt)}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setDetailsLost(lost);
                                  setLostActionReason("");
                                }}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#007ED5",
                                  fontSize: "13.5px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  padding: "4px 0",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  transition: "opacity 0.15s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                              >
                                View Details →
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (view === "repair") {
                      const rep = item as AssetRepairRequestRecord;
                      const isApproved = rep.RequestStatus === "Approved";
                      const isRejected = rep.RequestStatus === "Rejected";
                      return (
                        <div
                          key={rep.ID}
                          style={{
                            background: "#FFFFFF",
                            borderRadius: "16px",
                            border: "1px solid #E2E8F0",
                            padding: "24px",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                        >
                          <div>
                            {/* Top Row: Avatar, Name, Asset, Status & Problem Pill */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "flex-start",
                                justifyContent: "space-between",
                                gap: "12px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                <div
                                  style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "50%",
                                    background: "#000000",
                                    flexShrink: 0,
                                  }}
                                />
                                <div>
                                  <div
                                    style={{
                                      fontSize: "16px",
                                      fontWeight: 700,
                                      color: "#0F172A",
                                      lineHeight: 1.2,
                                    }}
                                  >
                                    {rep.RequestedByName || "Employee"}
                                  </div>
                                  <div style={{ fontSize: "13px", color: "#64748B", marginTop: "3px" }}>
                                    {rep.AssetName || rep.AssetTagID || "Equipment"}
                                  </div>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {isApproved && (
                                  <span
                                    style={{
                                      background: "#ECFDF5",
                                      border: "1px solid #A7F3D0",
                                      color: "#059669",
                                      borderRadius: "9999px",
                                      padding: "3px 10px",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    ✓ Approved
                                  </span>
                                )}
                                {isRejected && (
                                  <span
                                    style={{
                                      background: "#FEF2F2",
                                      border: "1px solid #FECACA",
                                      color: "#DC2626",
                                      borderRadius: "9999px",
                                      padding: "3px 10px",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                    }}
                                  >
                                    Rejected
                                  </span>
                                )}
                                <span
                                  style={{
                                    background: "#F8FAFC",
                                    border: "1px solid #F1F5F9",
                                    color: "#334155",
                                    borderRadius: "9999px",
                                    padding: "4px 14px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    flexShrink: 0,
                                  }}
                                >
                                  {rep.ProblemCategory || "Repair"}
                                </span>
                              </div>
                            </div>

                            {/* Requested for Section */}
                            <div style={{ marginTop: "22px" }}>
                              <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>
                                Requested for
                              </div>
                              <div
                                style={{
                                  fontSize: "14px",
                                  color: "#64748B",
                                  marginTop: "4px",
                                  minHeight: "36px",
                                }}
                              >
                                {rep.Problem || "Asset repair needed"}
                              </div>
                            </div>
                          </div>

                          {/* Divider & Bottom Row */}
                          <div>
                            <div style={{ borderTop: "1px solid #F1F5F9", margin: "18px 0 14px 0" }} />
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  color: "#64748B",
                                  fontSize: "12.5px",
                                }}
                              >
                                <CalendarRegular style={{ fontSize: "15px", color: "#64748B" }} />
                                <span>{getRelativeTimeString(rep.CreatedAt)}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => setDetailsRepair(rep)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#007ED5",
                                  fontSize: "13.5px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  padding: "4px 0",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  transition: "opacity 0.15s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                              >
                                View Details →
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Default: Employee Asset Request
                    const request = item as AssetUserRequestRecord;
                    return (
                      <div
                        key={request.ID}
                        style={{
                          background: "#FFFFFF",
                          borderRadius: "16px",
                          border: "1px solid #E2E8F0",
                          padding: "24px",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      >
                        <div>
                          {/* Top Row: Avatar, Name, Job Title, Asset Pill */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "space-between",
                              gap: "12px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                              <div
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  borderRadius: "50%",
                                  background: "#000000",
                                  flexShrink: 0,
                                }}
                              />
                              <div>
                                <div
                                  style={{
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    color: "#0F172A",
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {request.RequestedByName || "Employee"}
                                </div>
                                <div style={{ fontSize: "13px", color: "#64748B", marginTop: "3px" }}>
                                  {request.RequestedByJobTitle || "Associate Developer"}
                                </div>
                              </div>
                            </div>

                            {/* Status & Asset Pill Badge matching Screenshot */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              {request.ManagerApprovalStatus === "Approved" && (
                                <span
                                  style={{
                                    background: "#ECFDF5",
                                    border: "1px solid #A7F3D0",
                                    color: "#059669",
                                    borderRadius: "9999px",
                                    padding: "3px 10px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                  }}
                                >
                                  ✓ Approved
                                </span>
                              )}
                              {request.ManagerApprovalStatus === "Rejected" && (
                                <span
                                  style={{
                                    background: "#FEF2F2",
                                    border: "1px solid #FECACA",
                                    color: "#DC2626",
                                    borderRadius: "9999px",
                                    padding: "3px 10px",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                  }}
                                >
                                  Rejected
                                </span>
                              )}
                              <span
                                style={{
                                  background: "#F8FAFC",
                                  border: "1px solid #F1F5F9",
                                  color: "#334155",
                                  borderRadius: "9999px",
                                  padding: "4px 14px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  flexShrink: 0,
                                }}
                              >
                                {request.AssetType}
                              </span>
                            </div>
                          </div>

                          {/* Requested for Section matching Screenshot */}
                          <div style={{ marginTop: "22px" }}>
                            <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 500 }}>
                              Requested for
                            </div>
                            <div
                              style={{
                                fontSize: "14px",
                                color: "#64748B",
                                marginTop: "4px",
                                minHeight: "36px",
                              }}
                            >
                              {request.PurposeOfRequest || "Standard equipment request"}
                            </div>
                          </div>
                        </div>

                        {/* Divider & Bottom Row: Relative Date + View Details → */}
                        <div>
                          <div style={{ borderTop: "1px solid #F1F5F9", margin: "18px 0 14px 0" }} />
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                color: "#64748B",
                                fontSize: "12.5px",
                              }}
                            >
                              <CalendarRegular style={{ fontSize: "15px", color: "#64748B" }} />
                              <span>{getRelativeTimeString(request.CreatedAt)}</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setReviewingRequest(request);
                                setSelectedDecision("Approve");
                                setDecisionReason("");
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#007ED5",
                                fontSize: "13.5px",
                                fontWeight: 600,
                                cursor: "pointer",
                                padding: "4px 0",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                transition: "opacity 0.15s ease",
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                            >
                              View Details →
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "16px" }}>
                    <Button
                      appearance="subtle"
                      icon={<ChevronLeftRegular />}
                      disabled={page === 1}
                      style={{ borderRadius: "25px" }}
                      onClick={() => setPage((p) => p - 1)}
                    />
                    {getPageNumbers(page, totalPages).map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "#64748B" }}>
                          …
                        </span>
                      ) : (
                        <Button
                          key={p}
                          appearance={p === page ? "primary" : "subtle"}
                          style={{ minWidth: "32px", borderRadius: "25px" }}
                          onClick={() => setPage(p as number)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                    <Button
                      appearance="subtle"
                      icon={<ChevronRightRegular />}
                      disabled={page >= totalPages}
                      style={{ borderRadius: "25px" }}
                      onClick={() => setPage((p) => p + 1)}
                    />
                  </div>
                )}
              </>
            )}

            {/* Asset Request Details Drawer for Employee Requests */}
            {reviewingRequest && (
              <AssetRequestDetailsPanel
                open={!!reviewingRequest}
                onOpenChange={(open) => {
                  if (!open) setReviewingRequest(null);
                }}
                request={reviewingRequest}
                role="manager"
                onActionComplete={() => {
                  loadData(false);
                  setReviewingRequest(null);
                }}
              />
            )}

            {/* Upgrade Request Details Drawer for Hardware Upgrades */}
            {detailsUpgrade && (
              <UpgradeRequestDetailsPanel
                open={!!detailsUpgrade}
                onOpenChange={(open) => {
                  if (!open) setDetailsUpgrade(null);
                }}
                request={detailsUpgrade}
                role="manager"
                acting={actingUpgrade}
                onDecision={(action) => handleUpgradeDecision(action)}
                onReprogress={(reason) => handleUpgradeReprogress(reason)}
                onActionComplete={() => {
                  loadUpgradeRequests();
                  setDetailsUpgrade(null);
                }}
              />
            )}

            {/* Repair Request Details Drawer */}
            {detailsRepair && (
              <RepairRequestDetailsPanel
                open={!!detailsRepair}
                onOpenChange={(open) => {
                  if (!open) setDetailsRepair(null);
                }}
                request={detailsRepair}
                role="employee"
                onRespondComplete={() => {
                  loadRepairRequests();
                  setDetailsRepair(null);
                }}
              />
            )}

            {/* Lost Asset Review Drawer */}
            {detailsLost && (
              <Drawer
                type="overlay"
                position="end"
                open={!!detailsLost}
                onOpenChange={(_, data) => {
                  if (!data.open) setDetailsLost(null);
                }}
                style={{ width: "min(580px, 92vw)" }}
              >
                <DrawerHeader style={{ borderBottom: "1px solid #E2E8F0", padding: "16px 24px" }}>
                  <DrawerHeaderTitle
                    action={
                      <Button
                        appearance="subtle"
                        aria-label="close"
                        icon={<Dismiss24Regular />}
                        onClick={() => setDetailsLost(null)}
                      />
                    }
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "10px",
                          background: "#FEF2F2",
                          color: "#EF4444",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "20px",
                          flexShrink: 0,
                        }}
                      >
                        <WarningRegular />
                      </div>
                      <div>
                        <Text weight="bold" size={400} style={{ color: "#0F172A", fontSize: "16px" }}>
                          Lost Asset Report — {detailsLost.RequestNumber || "Review"}
                        </Text>
                        <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "2px" }}>
                          Manager validation and incident clearance
                        </div>
                      </div>
                    </div>
                  </DrawerHeaderTitle>
                </DrawerHeader>

                <DrawerBody style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "18px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "12.5px", color: "#64748B", fontWeight: 500 }}>Reported By</span>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>
                        {detailsLost.EmployeeName || detailsLost.ReportedByName}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "12.5px", color: "#64748B", fontWeight: 500 }}>Date of Incident</span>
                      <span style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>
                        {new Date(detailsLost.LostDate).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: "12.5px", color: "#64748B", display: "block", marginBottom: "6px", fontWeight: 500 }}>
                        Circumstances / Description
                      </span>
                      <div style={{ fontSize: "13.5px", color: "#334155", lineHeight: 1.5, background: "#FFFFFF", padding: "12px", borderRadius: "10px", border: "1px solid #E2E8F0" }}>
                        {detailsLost.HowLost || detailsLost.AdditionalDetails || "No further details provided"}
                      </div>
                    </div>
                  </div>

                  {detailsLost.ManagerApprovalStatus === "Pending" ? (
                    <div>
                      <label style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B", display: "block", marginBottom: "6px" }}>
                        Decision Notes / Remarks
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Enter remarks for this lost asset determination..."
                        value={lostActionReason}
                        onChange={(e) => setLostActionReason(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "12px",
                          border: "1px solid #CBD5E1",
                          borderRadius: "12px",
                          fontSize: "13.5px",
                          boxSizing: "border-box",
                          fontFamily: "inherit",
                          outline: "none",
                        }}
                      />
                    </div>
                  ) : null}
                </DrawerBody>

                <div
                  style={{
                    padding: "16px 24px",
                    borderTop: "1px solid #E2E8F0",
                    background: "#FFFFFF",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "12px",
                    position: "sticky",
                    bottom: 0,
                    zIndex: 10,
                  }}
                >
                  {detailsLost.ManagerApprovalStatus === "Pending" ? (
                    <>
                      <Button
                        appearance="secondary"
                        style={{ borderRadius: "25px", padding: "8px 20px" }}
                        disabled={actingLost}
                        onClick={() => setDetailsLost(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        appearance="outline"
                        style={{
                          borderRadius: "25px",
                          padding: "8px 20px",
                          borderColor: "#EF4444",
                          color: "#EF4444",
                        }}
                        disabled={actingLost}
                        onClick={() => handleLostDecision("Reject")}
                      >
                        Reject Report
                      </Button>
                      <Button
                        appearance="primary"
                        style={{
                          background: "#16A34A",
                          borderColor: "#16A34A",
                          borderRadius: "25px",
                          padding: "8px 24px",
                          fontWeight: 700,
                        }}
                        disabled={actingLost}
                        icon={actingLost ? <Spinner size="tiny" /> : undefined}
                        onClick={() => handleLostDecision("Approve")}
                      >
                        Approve & Forward
                      </Button>
                    </>
                  ) : (
                    <Button
                      appearance="primary"
                      style={{ borderRadius: "25px", padding: "8px 24px" }}
                      onClick={() => setDetailsLost(null)}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </Drawer>
            )}
      </div>
    </>
  );
};

export default ManagerApproval;
