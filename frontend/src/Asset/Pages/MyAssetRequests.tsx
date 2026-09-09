import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Spinner,
  Button,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
  Dialog,
  DialogSurface,
  DialogBody,
} from "@fluentui/react-components";
import {
  SearchRegular,
  CalendarRegular,
  DismissRegular,
  AddRegular,
  WrenchRegular,
  DeveloperBoardRegular,
  PeopleTeamRegular,
  InfoRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  BoxRegular,
  EyeRegular,
  ArrowClockwiseRegular,
  ArrowDownloadRegular,
  ErrorCircleRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { getMyAssetRequests, AssetUserRequestRecord } from "../Services/AssetInventoryService";
import { getAssetUpgradeRequests, AssetUpgradeRequestRecord } from "../Services/AssetUpgradeRequestService";
import { getAssetRepairRequests, AssetRepairRequestRecord } from "../Services/AssetRepairRequestService";
import { getCategoryIcon } from "../Utils/categoryIcon";
import UpgradeRequestList from "../Components/UpgradeRequestList";
import RepairRequestList from "../Components/RepairRequestList";
import QuadraPillToggle from "../../Common/QuadraPillToggle";
import { getAssetLostRequests, AssetLostRequestRecord } from "../Services/AssetLostRequestService";

type RequestTypeView = "all" | "upgrades" | "repairs" | "lost";

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatFullDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

const getCategoryTheme = (category: string) => {
  const c = (category || "").toLowerCase();
  if (c.includes("laptop") || c.includes("macbook") || c.includes("computer")) {
    return { bg: "#E8FBF0", color: "#10B981" };
  }
  if (c.includes("workstation") || c.includes("desktop") || c.includes("monitor")) {
    return { bg: "#EFF6FF", color: "#2563EB" };
  }
  if (c.includes("phone") || c.includes("mobile") || c.includes("iphone")) {
    return { bg: "#FFFBEB", color: "#D97706" };
  }
  if (c.includes("headphone") || c.includes("audio")) {
    return { bg: "#FAF5FF", color: "#9333EA" };
  }
  return { bg: "#F1F5F9", color: "#64748B" };
};

const getStatusBadgeStyle = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s.includes("approved") || s.includes("completed") || s.includes("fulfilled")) {
    return {
      bg: "#ECFDF5",
      color: "#10B981",
      border: "#A7F3D0",
      label: "Approved",
    };
  }
  if (s.includes("progress") || s.includes("assigned") || s.includes("adminapprovalpending") || s.includes("reprogress")) {
    return {
      bg: "#EFF6FF",
      color: "#2563EB",
      border: "#BFDBFE",
      label: "In Progress",
    };
  }
  if (s.includes("reject")) {
    return {
      bg: "#FEF2F2",
      color: "#EF4444",
      border: "#FECACA",
      label: "Rejected",
    };
  }
  return {
    bg: "#FFFBEB",
    color: "#D97706",
    border: "#FDE68A",
    label: "Pending",
  };
};

const MyAssetRequests: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("my-asset-requests-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [activeView, setActiveView] = useState<RequestTypeView>("all");
  const [requests, setRequests] = useState<AssetUserRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [assetKind, setAssetKind] = useState<"All" | "IT" | "Non-IT">("All");

  const [detailsRequest, setDetailsRequest] = useState<AssetUserRequestRecord | null>(null);
  const [statusTrackRequest, setStatusTrackRequest] = useState<AssetUserRequestRecord | null>(null);

  const [upgradeRequests, setUpgradeRequests] = useState<AssetUpgradeRequestRecord[]>([]);
  const [repairRequests, setRepairRequests] = useState<AssetRepairRequestRecord[]>([]);
  const [lostRequests, setLostRequests] = useState<AssetLostRequestRecord[]>([]);

  const loadData = async () => {
    if (!currentUser?.userID) return;
    setLoading(true);
    try {
      const [allReqs, upReqs, repReqs, lostReqs] = await Promise.all([
        getMyAssetRequests(currentUser.userID),
        getAssetUpgradeRequests({ userId: currentUser.userID }).catch(() => []),
        getAssetRepairRequests({ userId: currentUser.userID }).catch(() => []),
        getAssetLostRequests({ employeeId: currentUser.userID }).catch(() => []),
      ]);
      setRequests(allReqs);
      setUpgradeRequests(upReqs);
      setRepairRequests(repReqs);
      setLostRequests(lostReqs);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load requests"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.userID]);

  // Top KPI calculations
  const stats = useMemo(() => {
    const total = requests.length;
    let pending = 0;
    let approved = 0;
    let inProgress = 0;

    requests.forEach((r) => {
      const badge = getStatusBadgeStyle(r.OverallStatus);
      if (badge.label === "Pending") pending++;
      else if (badge.label === "Approved") approved++;
      else if (badge.label === "In Progress") inProgress++;
    });

    const upgradesRepairs = upgradeRequests.length + repairRequests.length;
    const lostTotal = lostRequests.length;
    return { total, pending, approved, inProgress, upgradesRepairs, lostTotal };
  }, [requests, upgradeRequests, repairRequests, lostRequests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Simplified status filter
      if (statusFilter !== "All") {
        const badge = getStatusBadgeStyle(r.OverallStatus);
        if (badge.label.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }

      // IT vs Non-IT filter
      if (assetKind !== "All") {
        const isNonIt = /non|furniture|chair|desk|vehicle|stationery/i.test(r.AssetType);
        if ((assetKind === "Non-IT") !== isNonIt) return false;
      }

      // Search query
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matches =
          r.RequestNumber?.toLowerCase().includes(term) ||
          r.AssetType.toLowerCase().includes(term) ||
          r.PurposeOfRequest.toLowerCase().includes(term);
        if (!matches) return false;
      }

      return true;
    });
  }, [requests, statusFilter, search, assetKind]);

  const handleDownloadDetails = (req: AssetUserRequestRecord) => {
    const content = `QUADRA PEOPLE ASSET REQUEST DETAILS
----------------------------------------
Request ID: ${req.RequestNumber}
Asset Type: ${req.AssetType}
Requested By: ${req.RequestedByName || currentUser?.displayName || "You"} (${req.RequestedByDepartment || "Quadra"})
Request Date: ${formatFullDate(req.CreatedAt)}
Status: ${getStatusBadgeStyle(req.OverallStatus).label}
Approved By: ${req.ApprovedByName || "Tamil Selvan L"}
Approved Date: ${req.ApprovedAt ? formatFullDate(req.ApprovedAt) : formatFullDate(req.CreatedAt)}

Purpose of Request:
${req.PurposeOfRequest}
----------------------------------------
Generated on: ${new Date().toLocaleString()}
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${req.RequestNumber}_Details.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
      {portal}
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
        {/* Header with Title and New Request Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#0F172A" }}>
              My Requests
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748B" }}>
              Track and manage all your asset requisitions, hardware upgrades, and repair tickets
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* View Switcher matching Screenshot 1 pill toggle */}
            <QuadraPillToggle<RequestTypeView>
              options={[
                { key: "all", label: `Asset Requests (${requests.length})`, icon: <PeopleTeamRegular /> },
                { key: "upgrades", label: `Upgrades (${upgradeRequests.length})`, icon: <DeveloperBoardRegular /> },
                { key: "repairs", label: `Repairs (${repairRequests.length})`, icon: <WrenchRegular /> },
                { key: "lost", label: `Lost Assets (${lostRequests.length})`, icon: <ErrorCircleRegular /> },
              ]}
              value={activeView}
              onChange={(val) => setActiveView(val)}
            />

            <button
              id="new-asset-request-btn"
              onClick={() => navigate("/Asset/new-request")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                background: "#FFFFFF",
                color: "#475569",
                border: "1px solid #E2E8F0",
                borderRadius: "9999px",
                padding: "6px 20px 6px 8px",
                fontSize: "14px",
                fontWeight: 500,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#CBD5E1";
                e.currentTarget.style.boxShadow = "0 2px 6px rgba(0, 0, 0, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
              }}
            >
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "#007ED5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  flexShrink: 0,
                }}
              >
                <AddRegular style={{ fontSize: "16px", fontWeight: 700 }} />
              </div>
              <span>New Asset Request</span>
            </button>
          </div>
        </div>

        {/* Top KPI Summary Cards with Numbers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
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
                {stats.total}
              </div>
            </div>
          </div>

          {/* Card 2: Pending Approval */}
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
                Pending Review
              </div>
              <div style={{ fontSize: "26px", fontWeight: 700, color: "#D97706", marginTop: "2px" }}>
                {stats.pending}
              </div>
            </div>
          </div>

          {/* Card 3: Approved / In Progress */}
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
                Approved & In Progress
              </div>
              <div style={{ fontSize: "26px", fontWeight: 700, color: "#10B981", marginTop: "2px" }}>
                {stats.approved + stats.inProgress}
              </div>
            </div>
          </div>

          {/* Card 4: Hardware Upgrades & Repairs */}
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
                background: "#FAF5FF",
                color: "#9333EA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                flexShrink: 0,
              }}
            >
              <WrenchRegular />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Upgrades & Repairs
              </div>
              <div style={{ fontSize: "26px", fontWeight: 700, color: "#9333EA", marginTop: "2px" }}>
                {stats.upgradesRepairs}
              </div>
            </div>
          </div>

          {/* Card 5: Lost Assets */}
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
              <ErrorCircleRegular />
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Lost Assets
              </div>
              <div style={{ fontSize: "26px", fontWeight: 700, color: "#EF4444", marginTop: "2px" }}>
                {stats.lostTotal}
              </div>
            </div>
          </div>
        </div>

        {activeView === "upgrades" ? (
          <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "24px", border: "1px solid #E2E8F0" }}>
            <UpgradeRequestList requests={upgradeRequests} role="employee" onActionComplete={loadData} />
          </div>
        ) : activeView === "repairs" ? (
          <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "24px", border: "1px solid #E2E8F0" }}>
            <RepairRequestList requests={repairRequests} role="employee" onActionComplete={loadData} />
          </div>
        ) : activeView === "lost" ? (
          <div style={{ background: "#FFFFFF", borderRadius: "20px", padding: "24px", border: "1px solid #E2E8F0" }}>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <Spinner label="Loading lost asset reports..." />
              </div>
            ) : lostRequests.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "48px",
                  color: "#64748B",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <ErrorCircleRegular style={{ fontSize: "40px", color: "#CBD5E1" }} />
                <div style={{ fontWeight: 600, fontSize: "15px" }}>No lost asset reports</div>
                <div style={{ fontSize: "13px" }}>You haven't reported any lost assets yet.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {lostRequests.map((req) => {
                  const statusColor =
                    req.RequestStatus === "Completed"
                      ? { bg: "#ECFDF5", color: "#10B981", border: "#A7F3D0", label: "Completed" }
                      : req.RequestStatus === "InProgress"
                      ? { bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE", label: "In Progress" }
                      : { bg: "#FFFBEB", color: "#D97706", border: "#FDE68A", label: "Pending" };
                  return (
                    <div
                      key={req.ID}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "16px",
                        padding: "16px 24px",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "16px",
                      }}
                    >
                      {/* Left: Icon + Request Info */}
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 300px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "46px",
                            height: "46px",
                            borderRadius: "14px",
                            background: "#FEF2F2",
                            color: "#EF4444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "22px",
                            flexShrink: 0,
                          }}
                        >
                          <ErrorCircleRegular />
                        </div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>
                              {req.RequestNumber ?? req.ID}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                background: "#FEF2F2",
                                color: "#EF4444",
                                borderRadius: "6px",
                                padding: "2px 7px",
                              }}
                            >
                              Lost Report
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", fontSize: "12.5px", color: "#64748B" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <CalendarRegular style={{ fontSize: "13px" }} />
                              Lost: {formatDate(req.LostDate)}
                            </span>
                            <span>•</span>
                            <span>Reported: {formatDate(req.CreatedAt)}</span>
                            <span>•</span>
                            <span style={{ maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {req.HowLost || "—"}
                            </span>
                          </div>
                          <div style={{ marginTop: "4px", fontSize: "12px", color: "#94A3B8" }}>
                            {req.ItemCount} asset{req.ItemCount === 1 ? "" : "s"} reported
                            {req.ManagerName ? ` · Manager: ${req.ManagerName}` : ""}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status badge */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span
                          style={{
                            background: statusColor.bg,
                            color: statusColor.color,
                            border: `1px solid ${statusColor.border}`,
                            borderRadius: "9999px",
                            padding: "4px 14px",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: statusColor.color,
                            }}
                          />
                          {statusColor.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Search and Filters Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              {/* Search Pill Input */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "9999px",
                  padding: "8px 18px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  minWidth: "320px",
                  flex: "1 1 320px",
                  maxWidth: "480px",
                }}
              >
                <SearchRegular style={{ color: "#94A3B8", fontSize: "17px", flexShrink: 0 }} />
                <input
                  type="text"
                  placeholder="Search by request ID, asset name, or purpose..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    border: "none",
                    outline: "none",
                    width: "100%",
                    fontSize: "13.5px",
                    color: "#1E293B",
                    background: "transparent",
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#94A3B8",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                    }}
                  >
                    <DismissRegular style={{ fontSize: "14px" }} />
                  </button>
                )}
              </div>

              {/* Simplified Status Filter Tabs */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                {(["All", "Pending", "In Progress", "Approved", "Rejected"] as const).map((status) => {
                  const isActive = statusFilter === status;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      style={{
                        border: "none",
                        background: isActive ? "#007ED5" : "#FFFFFF",
                        color: isActive ? "#FFFFFF" : "#64748B",
                        borderRadius: "9999px",
                        padding: "6px 16px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        boxShadow: isActive ? "0 2px 6px rgba(0, 126, 213, 0.25)" : "0 1px 2px rgba(0,0,0,0.04)",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderColor: isActive ? "#007ED5" : "#E2E8F0",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>

              {/* IT vs Non-IT pills matching Screenshot 1 */}
              <QuadraPillToggle<"All" | "IT" | "Non-IT">
                size="sm"
                options={[
                  { key: "All", label: "All Assets" },
                  { key: "IT", label: "IT Assets" },
                  { key: "Non-IT", label: "Non-IT Assets" },
                ]}
                value={assetKind}
                onChange={(val) => setAssetKind(val)}
              />
            </div>

            {/* Line-by-Line List of Requests */}
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
                <Spinner label="Loading your requests..." />
              </div>
            ) : filteredRequests.length === 0 ? (
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
                No asset requests found matching your filter criteria.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredRequests.map((req) => {
                  const theme = getCategoryTheme(req.AssetType);
                  const badge = getStatusBadgeStyle(req.OverallStatus);
                  const isNonIt = /non|furniture|chair|desk|vehicle|stationery/i.test(req.AssetType);

                  return (
                    <div
                      key={req.ID}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "16px",
                        padding: "16px 24px",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "16px",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#CBD5E1";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#E2E8F0";
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.02)";
                      }}
                    >
                      {/* Left: Icon + Asset Name + Request Number + Submission Date */}
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: "300px", flex: "1 1 300px" }}>
                        <div
                          style={{
                            width: "46px",
                            height: "46px",
                            borderRadius: "14px",
                            background: theme.bg,
                            color: theme.color,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "22px",
                            flexShrink: 0,
                          }}
                        >
                          {getCategoryIcon(req.AssetType)}
                        </div>

                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>
                              {req.AssetType}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                background: isNonIt ? "#F1F5F9" : "#EFF6FF",
                                color: isNonIt ? "#475569" : "#007ED5",
                                borderRadius: "6px",
                                padding: "2px 7px",
                              }}
                            >
                              {isNonIt ? "Non-IT" : "IT Asset"}
                            </span>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px", fontSize: "12.5px", color: "#64748B" }}>
                            <span style={{ fontWeight: 600, color: "#0F172A" }}>{req.RequestNumber}</span>
                            <span>•</span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <CalendarRegular style={{ fontSize: "13px" }} />
                              {formatDate(req.CreatedAt)}
                            </span>
                            <span>•</span>
                            <span
                              style={{
                                maxWidth: "260px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                color: "#94A3B8",
                              }}
                            >
                              {req.PurposeOfRequest || "Standard assignment"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Clean Status Pill */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            borderRadius: "9999px",
                            padding: "4px 14px",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <span
                            style={{
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: badge.color,
                            }}
                          />
                          {badge.label}
                        </span>
                      </div>

                      {/* Right: Line-by-Line Actions (Check Status & View Details side by side) */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <button
                          onClick={() => setStatusTrackRequest(req)}
                          style={{
                            background: "#F8FAFC",
                            border: "1px solid #CBD5E1",
                            borderRadius: "9999px",
                            padding: "7px 16px",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#334155",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#EFF6FF";
                            e.currentTarget.style.borderColor = "#93C5FD";
                            e.currentTarget.style.color = "#007ED5";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#F8FAFC";
                            e.currentTarget.style.borderColor = "#CBD5E1";
                            e.currentTarget.style.color = "#334155";
                          }}
                        >
                          <ClockRegular style={{ fontSize: "14px" }} />
                          <span>Check Status</span>
                        </button>

                        <button
                          onClick={() => setDetailsRequest(req)}
                          style={{
                            background: "#007ED5",
                            border: "none",
                            borderRadius: "9999px",
                            padding: "7px 18px",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#FFFFFF",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 2px 6px rgba(0, 126, 213, 0.25)",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#006bb8")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "#007ED5")}
                        >
                          <EyeRegular style={{ fontSize: "14px" }} />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Check Status Lifecycle Tracker Modal */}
      <Dialog open={!!statusTrackRequest} onOpenChange={(_, d) => !d.open && setStatusTrackRequest(null)}>
        <DialogSurface
          mountNode={mountNode}
          style={{
            borderRadius: "20px",
            padding: "24px",
            width: "440px",
            maxWidth: "95vw",
            boxSizing: "border-box",
            background: "#FFFFFF",
            boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
          }}
        >
          {statusTrackRequest && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%", boxSizing: "border-box" }}>
              {/* Tracker Modal Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
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
                    <ArrowClockwiseRegular />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                      Request Lifecycle Status
                    </h2>
                    <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "2px" }}>
                      {[statusTrackRequest.RequestNumber, statusTrackRequest.AssetType].filter(Boolean).join(" • ")}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStatusTrackRequest(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#64748B",
                    cursor: "pointer",
                    padding: "6px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <DismissRegular style={{ fontSize: "20px" }} />
                </button>
              </div>

              {/* Progress Stepper Timeline */}
              <div style={{ padding: "8px 4px", width: "100%", boxSizing: "border-box" }}>
                {(() => {
                  const badge = getStatusBadgeStyle(statusTrackRequest.OverallStatus);
                  const isApproved = badge.label === "Approved";
                  const isRejected = badge.label === "Rejected";

                  const steps = [
                    {
                      title: "1. Request Submitted",
                      description: `Submitted by ${statusTrackRequest.RequestedByName || "You"} on ${formatDate(statusTrackRequest.CreatedAt)}`,
                      status: "completed",
                    },
                    {
                      title: "2. Manager Approval",
                      description: isApproved
                        ? `Approved by ${statusTrackRequest.ApprovedByName || "Tamil Selvan L"}`
                        : isRejected
                        ? "Review rejected"
                        : "Pending manager endorsement",
                      status: isApproved ? "completed" : isRejected ? "rejected" : "current",
                    },
                    {
                      title: "3. IT Admin Allocation",
                      description: isApproved
                        ? "Asset tagged & queued for dispatch"
                        : isRejected
                        ? "Allocation cancelled"
                        : "Awaiting approval stage",
                      status: isApproved ? "completed" : "pending",
                    },
                    {
                      title: "4. Handover & In Use",
                      description: isApproved ? "Asset delivered and ready" : "Scheduled upon allocation",
                      status: isApproved ? "completed" : "pending",
                    },
                  ];

                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "22px", position: "relative", width: "100%" }}>
                      {/* Connecting vertical line */}
                      <div
                        style={{
                          position: "absolute",
                          left: "15px",
                          top: "16px",
                          bottom: "20px",
                          width: "2px",
                          background: "#E2E8F0",
                          zIndex: 0,
                        }}
                      />

                      {steps.map((step, idx) => {
                        const isDone = step.status === "completed";
                        const isCurr = step.status === "current";
                        const isRej = step.status === "rejected";

                        const circleBg = isDone
                          ? "#10B981"
                          : isRej
                          ? "#EF4444"
                          : isCurr
                          ? "#007ED5"
                          : "#F1F5F9";
                        const circleColor = isDone || isCurr || isRej ? "#FFFFFF" : "#94A3B8";

                        return (
                          <div key={idx} style={{ display: "flex", alignItems: "flex-start", gap: "16px", position: "relative", zIndex: 1 }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: circleBg,
                                color: circleColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "14px",
                                fontWeight: 700,
                                boxShadow: isCurr ? "0 0 0 4px rgba(0, 126, 213, 0.18)" : "none",
                                flexShrink: 0,
                              }}
                            >
                              {isDone ? "✓" : isRej ? "✕" : idx + 1}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                                {step.title}
                              </div>
                              <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "3px", lineHeight: 1.4 }}>
                                {step.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "12px", borderTop: "1px solid #F1F5F9", width: "100%" }}>
                <Button
                  appearance="secondary"
                  onClick={() => setStatusTrackRequest(null)}
                  style={{
                    borderRadius: "8px",
                    padding: "6px 20px",
                    fontWeight: 600,
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogSurface>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={!!detailsRequest} onOpenChange={(_, d) => !d.open && setDetailsRequest(null)}>
        <DialogSurface
          mountNode={mountNode}
          style={{
            borderRadius: "20px",
            padding: "24px",
            width: "520px",
            maxWidth: "95vw",
            boxSizing: "border-box",
            background: "#FFFFFF",
            boxShadow: "0 20px 40px rgba(0,0,0,0.12)",
          }}
        >
          {detailsRequest && (
            <div style={{ display: "flex", flexDirection: "column", gap: "18px", width: "100%", boxSizing: "border-box" }}>
              {/* Modal Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: getCategoryTheme(detailsRequest.AssetType).bg,
                      color: getCategoryTheme(detailsRequest.AssetType).color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                      flexShrink: 0,
                    }}
                  >
                    {getCategoryIcon(detailsRequest.AssetType)}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                      {detailsRequest.AssetType || "Asset Requisition"}
                    </h2>
                    <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "2px" }}>
                      {detailsRequest.RequestNumber}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      background: getStatusBadgeStyle(detailsRequest.OverallStatus).bg,
                      color: getStatusBadgeStyle(detailsRequest.OverallStatus).color,
                      border: `1px solid ${getStatusBadgeStyle(detailsRequest.OverallStatus).border}`,
                      borderRadius: "9999px",
                      padding: "4px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <InfoRegular style={{ fontSize: "13px" }} />
                    <span>{getStatusBadgeStyle(detailsRequest.OverallStatus).label}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setDetailsRequest(null)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#64748B",
                      cursor: "pointer",
                      padding: "6px",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DismissRegular style={{ fontSize: "20px" }} />
                  </button>
                </div>
              </div>

              {/* 2x2 Info Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%" }}>
                {/* Request Date */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Request Date
                  </div>
                  <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#1E293B", marginTop: "4px" }}>
                    {formatFullDate(detailsRequest.CreatedAt)}
                  </div>
                </div>

                {/* Approved Date */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Approved Date
                  </div>
                  <div
                    style={{
                      fontSize: "13.5px",
                      fontWeight: 700,
                      color: detailsRequest.ApprovedAt ? "#1E293B" : "#D97706",
                      marginTop: "4px",
                    }}
                  >
                    {detailsRequest.ApprovedAt ? formatFullDate(detailsRequest.ApprovedAt) : "Pending Review"}
                  </div>
                </div>

                {/* Requested By */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Requested By
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#E0F2FE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#0369A1",
                        flexShrink: 0,
                      }}
                    >
                      {(detailsRequest.RequestedByName || "Y")[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#1E293B" }}>
                      {detailsRequest.RequestedByName || "You"}
                    </span>
                  </div>
                </div>

                {/* Approved By */}
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ fontSize: "11px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Approved By
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#CBD5E1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "11px",
                        fontWeight: 700,
                        color: "#475569",
                        flexShrink: 0,
                      }}
                    >
                      {(detailsRequest.ApprovedByName || "T")[0].toUpperCase()}
                    </div>
                    <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#1E293B" }}>
                      {detailsRequest.ApprovedByName || "Tamil Selvan L"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Purpose of Request Box */}
              <div style={{ width: "100%" }}>
                <div style={{ fontSize: "12px", color: "#475569", fontWeight: 600, marginBottom: "6px" }}>
                  Purpose of Request
                </div>
                <div
                  style={{
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    fontSize: "13.5px",
                    color: "#334155",
                    lineHeight: 1.5,
                    minHeight: "64px",
                    boxSizing: "border-box",
                  }}
                >
                  {detailsRequest.PurposeOfRequest || "Standard asset assignment requested."}
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "10px",
                  paddingTop: "14px",
                  borderTop: "1px solid #F1F5F9",
                  width: "100%",
                }}
              >
                <Button
                  appearance="secondary"
                  onClick={() => setDetailsRequest(null)}
                  style={{
                    borderRadius: "8px",
                    fontWeight: 600,
                  }}
                >
                  Close
                </Button>
                <Button
                  appearance="primary"
                  icon={<ArrowDownloadRegular />}
                  onClick={() => handleDownloadDetails(detailsRequest)}
                  style={{
                    background: "#007ED5",
                    borderRadius: "8px",
                    fontWeight: 600,
                  }}
                >
                  Download Details
                </Button>
              </div>
            </div>
          )}
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default MyAssetRequests;
