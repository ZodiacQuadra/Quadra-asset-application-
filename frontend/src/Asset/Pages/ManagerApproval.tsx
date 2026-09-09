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
  DeveloperBoardRegular,
  WarningRegular,
  WrenchRegular,
  MailRegular,
  BuildingRegular,
  CheckmarkCircleFilled,
  CalendarRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import TruncatedText from "../../Common/TruncatedText";
import QuadraPillToggle from "../../Common/QuadraPillToggle";
import UpgradeRequestList from "../Components/UpgradeRequestList";
import LostAssetManagerReviewList from "../Components/LostAssetManagerReviewList";
import RepairRequestList from "../Components/RepairRequestList";
import {
  getManagerAssetRequests,
  AssetUserRequestRecord,
  managerActionOnRequest,
  managerReprogressRequest,
} from "../Services/AssetInventoryService";
import { getAssetUpgradeRequests, AssetUpgradeRequestRecord } from "../Services/AssetUpgradeRequestService";
import { getAssetLostRequests, AssetLostRequestRecord } from "../Services/AssetLostRequestService";
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

  const loadLostRequests = async () => {
    if (!currentUser?.userID) return;
    setLostLoading(true);
    try {
      const data = await getAssetLostRequests({ managerId: currentUser.userID });
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
  }, [search, activeTab]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [filtered, page]);

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
  const pendingLostCount = useMemo(
    () => lostRequests.filter((r) => r.ManagerApprovalStatus === "Pending").length,
    [lostRequests]
  );
  const pendingRepairCount = useMemo(
    () => repairRequests.filter((r) => r.RequestStatus === "Pending").length,
    [repairRequests]
  );

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
              ManagerApprovedReason: decisionReason.trim() || undefined,
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
          actedByMail: currentUser.mail || undefined,
        });
      } else {
        await managerReprogressRequest(reviewingRequest.ID, {
          reason: decisionReason.trim() || "Need more information to review this request",
          actedByUserId: currentUser.userID,
          actedByName: currentUser.displayName || undefined,
          actedByMail: currentUser.mail || undefined,
        });
      }
      loadData(false);
    } catch {}
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
        {/* If a request is being reviewed, show full screen decision view matching Approvals.png */}
        {reviewingRequest ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Back link */}
            <button
              onClick={() => setReviewingRequest(null)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "none",
                border: "none",
                color: "#64748B",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
                width: "fit-content",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#007ED5")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
            >
              <ArrowLeftRegular style={{ fontSize: "16px" }} />
              <span>Back to approvals</span>
            </button>

            {/* Requester Profile Hero Card */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "20px",
                padding: "32px 36px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                {/* 88px Gradient Avatar Circle */}
                <div
                  style={{
                    width: "88px",
                    height: "88px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4F80E1 0%, #9B72CF 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    fontSize: "28px",
                    fontWeight: 700,
                    boxShadow: "0 8px 16px rgba(79, 128, 225, 0.25)",
                    flexShrink: 0,
                  }}
                >
                  {(reviewingRequest.RequestedByName || "U").charAt(0).toUpperCase()}
                </div>

                <div>
                  <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.02em" }}>
                    {reviewingRequest.RequestedByName || "Miracle Bergson"}
                  </h1>
                  <div style={{ fontSize: "15px", color: "#64748B", marginTop: "4px", fontWeight: 500 }}>
                    {reviewingRequest.RequestedByJobTitle || "Associate Developer"}
                  </div>
                </div>
              </div>

              {/* Right Side Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#F8FAFC",
                    border: "1px solid #F1F5F9",
                    padding: "10px 16px",
                    borderRadius: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    <MailRegular />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>
                      Email
                    </div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1E293B" }}>
                      {reviewingRequest.RequestedByMail || "amanda.white@quadrasystems.net"}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#F8FAFC",
                    border: "1px solid #F1F5F9",
                    padding: "10px 16px",
                    borderRadius: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#FAF5FF",
                      color: "#9333EA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    <BuildingRegular />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase" }}>
                      Group
                    </div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1E293B" }}>
                      {reviewingRequest.RequestedByDepartment || "CAISG"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-Column Decision Layout matching Approvals.png */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 1fr",
                gap: "36px",
                alignItems: "flex-start",
                marginTop: "12px",
              }}
            >
              {/* Left Column: Asset Request Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#0F172A" }}>
                  Asset Request Details
                </h2>

                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "4px" }}>
                    Requested Asset
                  </div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>
                    {reviewingRequest.AssetType}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                    {reviewingRequest.RequestNumber}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#64748B", marginBottom: "8px" }}>
                    Purpose of request
                  </div>
                  <div
                    style={{
                      fontSize: "14.5px",
                      color: "#334155",
                      lineHeight: 1.6,
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "14px",
                      padding: "20px",
                    }}
                  >
                    {reviewingRequest.PurposeOfRequest ||
                      "Current laptop (Dell Latitude 5420) is experiencing frequent performance issues and overheating. The development environment requires significant resources for running multiple containers, IDEs, and testing environments simultaneously. This is impacting project delivery timelines for Q4 product release. Critical for meeting upcoming deadlines."}
                  </div>
                </div>
              </div>

              {/* Right Column: Make Decision */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#0F172A" }}>
                  Make Decision
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {/* Option 1: Approve */}
                  <div
                    onClick={() => setSelectedDecision("Approve")}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "14px",
                      border: selectedDecision === "Approve" ? "2px solid #007ED5" : "1px solid #E2E8F0",
                      background: selectedDecision === "Approve" ? "#F0F7FF" : "#FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: selectedDecision === "Approve" ? "#007ED5" : "#1E293B" }}>
                        Approve
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
                        Grant this request
                      </div>
                    </div>
                    {selectedDecision === "Approve" && (
                      <CheckmarkCircleFilled style={{ color: "#007ED5", fontSize: "20px" }} />
                    )}
                  </div>

                  {/* Option 2: Reject */}
                  <div
                    onClick={() => setSelectedDecision("Reject")}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "14px",
                      border: selectedDecision === "Reject" ? "2px solid #EF4444" : "1px solid #E2E8F0",
                      background: selectedDecision === "Reject" ? "#FEF2F2" : "#FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: selectedDecision === "Reject" ? "#EF4444" : "#1E293B" }}>
                        Reject
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
                        Decline this request
                      </div>
                    </div>
                    {selectedDecision === "Reject" && (
                      <CheckmarkCircleFilled style={{ color: "#EF4444", fontSize: "20px" }} />
                    )}
                  </div>

                  {/* Option 3: Need More Info */}
                  <div
                    onClick={() => setSelectedDecision("Reprogress")}
                    style={{
                      padding: "16px 20px",
                      borderRadius: "14px",
                      border: selectedDecision === "Reprogress" ? "2px solid #F59E0B" : "1px solid #E2E8F0",
                      background: selectedDecision === "Reprogress" ? "#FFFBEB" : "#FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: selectedDecision === "Reprogress" ? "#D97706" : "#1E293B" }}>
                        Need More Info
                      </div>
                      <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
                        Request clarification
                      </div>
                    </div>
                    {selectedDecision === "Reprogress" && (
                      <CheckmarkCircleFilled style={{ color: "#D97706", fontSize: "20px" }} />
                    )}
                  </div>
                </div>

                {/* Reason / Clarification input if not simply Approve */}
                {selectedDecision !== "Approve" && (
                  <div>
                    <label style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B", display: "block", marginBottom: "6px" }}>
                      {selectedDecision === "Reject" ? "Rejection Reason" : "Information Required"}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={
                        selectedDecision === "Reject"
                          ? "Please specify why this request is declined..."
                          : "Please specify what details or clarification you need..."
                      }
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "12px",
                        border: "1px solid #CBD5E1",
                        borderRadius: "10px",
                        fontSize: "13.5px",
                        boxSizing: "border-box",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                )}

                {/* Submit Decision Green Pill Button matching Approvals.png */}
                <button
                  onClick={handleSubmitDecision}
                  disabled={submittingDecision}
                  style={{
                    marginTop: "12px",
                    background: "#16A34A",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "9999px",
                    padding: "14px 28px",
                    fontSize: "15px",
                    fontWeight: 700,
                    cursor: submittingDecision ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#15803D")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#16A34A")}
                >
                  {submittingDecision ? <Spinner size="tiny" /> : "Submit Decision"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Normal List View matching screenshot 1:1 */
          <>
            {/* Clean Approvals Header matching screenshot 1:1 */}
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

            {view === "hardware" && (
              <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "24px", border: "1px solid #E2E8F0" }}>
                <UpgradeRequestList requests={upgradeRequests} role="manager" onActionComplete={loadUpgradeRequests} />
              </div>
            )}

            {view === "repair" && (
              <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "24px", border: "1px solid #E2E8F0" }}>
                <RepairRequestList requests={repairRequests} role="manager" onActionComplete={loadRepairRequests} />
              </div>
            )}

            {view === "lost" && (
              <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "24px", border: "1px solid #E2E8F0" }}>
                <LostAssetManagerReviewList requests={lostRequests} onActionComplete={loadLostRequests} />
              </div>
            )}

            {view === "employee" && (
              <>
                {/* Search Bar matching screenshot */}
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
                    placeholder="Search by request ID, asset name, or purpose..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "13px 18px 13px 48px",
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "14px",
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
                      { key: "All", label: "All", count: requests.length },
                      { key: "Pending", label: "Pending", count: pendingEmployeeCount },
                      { key: "Approved", label: "Approved", count: approvedEmployeeCount },
                    ]}
                    value={activeTab}
                    onChange={(tab) => setActiveTab(tab)}
                  />
                </div>

                {/* Approvals Cards Grid matching screenshot 1:1 */}
                {loading && requests.length === 0 ? (
                  <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                    <Spinner label="Loading approvals..." />
                  </div>
                ) : filtered.length === 0 ? (
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
                      {filtered.map((request) => {
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
                                  {/* Solid Black Avatar matching Screenshot 1:1 */}
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
                              style={{ minWidth: "32px", borderRadius: "8px" }}
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
                          onClick={() => setPage((p) => p + 1)}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ManagerApproval;
