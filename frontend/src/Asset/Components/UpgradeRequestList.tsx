import React, { useMemo, useState } from "react";
import { Card, Button, Text, Badge, Spinner, Textarea, Toast, ToastTitle, Toaster, useToastController, useId } from "@fluentui/react-components";
import { CheckmarkCircleRegular, DismissCircleRegular, DeveloperBoardRegular, ArrowUndoRegular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import TruncatedText from "../../Common/TruncatedText";
import {
  AssetUpgradeRequestRecord,
  UpgradeReqStatus,
  managerActionOnUpgradeRequest,
  adminActionOnUpgradeRequest,
  managerReprogressUpgradeRequest,
  adminReprogressUpgradeRequest,
} from "../Services/AssetUpgradeRequestService";
import UpgradeRequestDetailsPanel from "./UpgradeRequestDetailsPanel";

const STATUS_COLOR: Record<string, "warning" | "informative" | "success" | "danger"> = {
  Pending: "warning",
  ManagerRejected: "danger",
  ManagerReprogress: "warning",
  AdminApprovalPending: "informative",
  AdminReprogress: "warning",
  Completed: "success",
  Rejected: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  Pending: "Pending Manager Approval",
  ManagerRejected: "Rejected by Manager",
  ManagerReprogress: "Manager Reprogress",
  AdminApprovalPending: "Pending Admin Approval",
  AdminReprogress: "Admin Reprogress",
  Completed: "Completed",
  Rejected: "Rejected by Admin",
};

// Every hardware upgrade request sits in exactly one of these buckets — same
// taxonomy as the Employee Request filter tabs, just for ReqStatus.
const STATUS_TABS_ALL: { label: string; value: UpgradeReqStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "Manager Reprogress", value: "ManagerReprogress" },
  { label: "Manager Rejected", value: "ManagerRejected" },
  { label: "Admin Pending", value: "AdminApprovalPending" },
  { label: "Admin Reprogress", value: "AdminReprogress" },
  { label: "Completed", value: "Completed" },
  { label: "Rejected", value: "Rejected" },
];

const EMPLOYEE_STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "In Progress", value: "InProgress" },
  { label: "Completed", value: "Completed" },
  { label: "Rejected", value: "Rejected" },
];

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

interface UpgradeRequestListProps {
  requests: AssetUpgradeRequestRecord[];
  role: "manager" | "admin" | "employee";
  onActionComplete: () => void;
}

const UpgradeRequestList: React.FC<UpgradeRequestListProps> = ({ requests, role, onActionComplete }) => {
  const { currentUser } = useAuth();
  const toasterId = useId("upgrade-request-list-toaster");
  const { dispatchToast } = useToastController(toasterId);
  const [actingId, setActingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");
  const [detailsRequest, setDetailsRequest] = useState<AssetUpgradeRequestRecord | null>(null);
  const [reprogressId, setReprogressId] = useState<string | null>(null);
  const [reprogressReason, setReprogressReason] = useState("");

  const tabs = role === "employee" ? EMPLOYEE_STATUS_TABS : STATUS_TABS_ALL;

  const statusTabCounts = useMemo(() => {
    const counts = { All: requests.length } as Record<string, number>;
    if (role === "employee") {
      counts["Pending"] = requests.filter((r) => r.ReqStatus === "Pending").length;
      counts["InProgress"] = requests.filter((r) => ["AdminApprovalPending", "ManagerReprogress", "AdminReprogress"].includes(r.ReqStatus)).length;
      counts["Completed"] = requests.filter((r) => r.ReqStatus === "Completed").length;
      counts["Rejected"] = requests.filter((r) => ["ManagerRejected", "Rejected"].includes(r.ReqStatus)).length;
    } else {
      STATUS_TABS_ALL.forEach((tab) => {
        if (tab.value === "All") return;
        counts[tab.value] = requests.filter((r) => r.ReqStatus === tab.value).length;
      });
    }
    return counts;
  }, [requests, role]);

  const filteredRequests = useMemo(() => {
    if (activeTab === "All") return requests;
    if (role === "employee") {
      if (activeTab === "Pending") return requests.filter((r) => r.ReqStatus === "Pending");
      if (activeTab === "InProgress") return requests.filter((r) => ["AdminApprovalPending", "ManagerReprogress", "AdminReprogress"].includes(r.ReqStatus));
      if (activeTab === "Completed") return requests.filter((r) => r.ReqStatus === "Completed");
      if (activeTab === "Rejected") return requests.filter((r) => ["ManagerRejected", "Rejected"].includes(r.ReqStatus));
    }
    return requests.filter((r) => r.ReqStatus === activeTab);
  }, [requests, activeTab, role]);

  const handleAction = async (request: AssetUpgradeRequestRecord, action: "Approve" | "Reject") => {
    if (!currentUser?.userID) return;
    setActingId(request.ID);
    try {
      if (role === "manager") {
        await managerActionOnUpgradeRequest(request.ID, action, currentUser.userID, currentUser.displayName, currentUser.email);
      } else {
        const isOverride = action === "Approve" && request.ManagerApprovalStatus !== "Approved";
        await adminActionOnUpgradeRequest(
          request.ID,
          action,
          currentUser.userID,
          currentUser.displayName,
          currentUser.email,
          isOverride
        );
      }
      dispatchToast(
        <Toast>
          <ToastTitle>Request {action === "Approve" ? "approved" : "rejected"}</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      onActionComplete();
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to record decision"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setActingId(null);
    }
  };

  const handleReprogress = async (request: AssetUpgradeRequestRecord, reason: string) => {
    if (!currentUser?.userID || !reason.trim()) return;
    setActingId(request.ID);
    try {
      if (role === "manager") {
        await managerReprogressUpgradeRequest(request.ID, reason.trim(), currentUser.userID, currentUser.displayName, currentUser.email);
      } else {
        await adminReprogressUpgradeRequest(request.ID, reason.trim(), currentUser.userID, currentUser.displayName, currentUser.email);
      }
      dispatchToast(
        <Toast>
          <ToastTitle>Request sent back for re-progress</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setReprogressId(null);
      setReprogressReason("");
      onActionComplete();
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to send request back"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setActingId(null);
    }
  };

  if (requests.length === 0) {
    return <Text style={{ color: "#605E5C", padding: "20px 0" }}>No hardware upgrade requests found.</Text>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Toaster toasterId={toasterId} />
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            style={{
              borderRadius: "999px",
              padding: "6px 16px",
              fontSize: "13px",
              fontWeight: activeTab === tab.value ? 600 : 500,
              background: activeTab === tab.value ? "#007ED5" : "rgba(255, 255, 255, 0.75)",
              color: activeTab === tab.value ? "#ffffff" : "#475569",
              border: activeTab === tab.value ? "1px solid #007ED5" : "1px solid rgba(226, 232, 240, 0.8)",
              boxShadow: activeTab === tab.value ? "0 4px 12px rgba(0, 126, 213, 0.25)" : "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onClick={() => setActiveTab(tab.value)}
          >
            {tab.label} ({statusTabCounts[tab.value]})
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <Text style={{ color: "#64748b", padding: "20px 0" }}>No requests match this filter.</Text>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))", gap: "20px" }}>
            {filteredRequests.map((request) => {
              const canManagerAct = role === "manager" && request.ManagerApprovalStatus === "Pending";
              const canAdminAct = role === "admin" && request.AdminApprovalStatus === "Pending";
              const isOverrideNeeded = canAdminAct && request.ManagerApprovalStatus !== "Approved";
              const acting = actingId === request.ID;
              const reprogressing = reprogressId === request.ID;

              if (role === "employee") {
                return (
                  <div
                    key={request.ID}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "20px",
                      padding: "22px 24px",
                      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: "16px",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.07)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.03)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "12px",
                            background: "#FEF3C7",
                            color: "#D97706",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            flexShrink: 0,
                          }}
                        >
                          <DeveloperBoardRegular />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: "15.5px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
                            {request.RequestNumber}
                          </div>
                          <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px", fontWeight: 500 }}>
                            {request.CategoryName} · {request.ComponentDisplayName}
                          </div>
                        </div>
                      </div>
                      <Badge
                        appearance="tint"
                        color={STATUS_COLOR[request.ReqStatus]}
                        style={{ borderRadius: "25px", padding: "4px 12px", fontWeight: 600, fontSize: "12px" }}
                      >
                        {STATUS_LABEL[request.ReqStatus] ?? request.ReqStatus}
                      </Badge>
                    </div>

                    {/* Spec comparison box */}
                    <div
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #F1F5F9",
                        borderRadius: "14px",
                        padding: "12px 16px",
                        fontSize: "13px",
                        color: "#334155",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ color: "#64748B" }}>Current:</span>
                        <span style={{ fontWeight: 600, color: "#1E293B" }}>{request.CurrentSpecification}</span>
                        <span style={{ color: "#007ED5", fontWeight: 700 }}>→</span>
                        <span style={{ color: "#64748B" }}>Requested:</span>
                        <span style={{ fontWeight: 700, color: "#007ED5" }}>{request.RequiredSpecfication}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingTop: "14px",
                        borderTop: "1px solid #F1F5F9",
                      }}
                    >
                      <Text size={200} style={{ color: "#64748b", fontWeight: 500 }}>
                        {formatDate(request.RequestedDate ?? request.CreatedAt)}
                      </Text>
                      {request.ReqStatus === "ManagerReprogress" || request.ReqStatus === "AdminReprogress" ? (
                        <Button
                          appearance="primary"
                          style={{
                            background: "#007ED5",
                            borderColor: "#007ED5",
                            borderRadius: "25px",
                            padding: "6px 20px",
                            fontWeight: 600,
                          }}
                          onClick={() => setDetailsRequest(request)}
                        >
                          Respond →
                        </Button>
                      ) : (
                        <Button
                          appearance="subtle"
                          style={{ color: "#007ED5", borderRadius: "25px", fontWeight: 600 }}
                          onClick={() => setDetailsRequest(request)}
                        >
                          View Details →
                        </Button>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={request.ID}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: "20px",
                    padding: "22px 24px",
                    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "16px",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0, 0, 0, 0.07)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.03)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {/* Header Row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "12px",
                            background: "#FEF3C7",
                            color: "#D97706",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "22px",
                            flexShrink: 0,
                          }}
                        >
                          <DeveloperBoardRegular />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
                            {request.RequestNumber}
                          </div>
                          <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px", fontWeight: 500 }}>
                            {request.CategoryName} · {request.ComponentDisplayName}
                          </div>
                        </div>
                      </div>
                      <Badge
                        appearance="tint"
                        color={STATUS_COLOR[request.ReqStatus]}
                        style={{ borderRadius: "25px", padding: "4px 12px", fontWeight: 600, fontSize: "12px", whiteSpace: "nowrap" }}
                      >
                        {STATUS_LABEL[request.ReqStatus] ?? request.ReqStatus}
                      </Badge>
                    </div>

                    {/* Requester & Date Bar */}
                    <div style={{ fontSize: "13px", color: "#64748B", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                      <span>Requested by</span>
                      <strong style={{ color: "#1E293B" }}>{request.RequestedByName ?? "Unknown"}</strong>
                      <span>•</span>
                      <span>{formatDate(request.RequestedDate ?? request.CreatedAt)}</span>
                    </div>

                    {/* Spec Change Box */}
                    <div
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #F1F5F9",
                        borderRadius: "14px",
                        padding: "12px 16px",
                        fontSize: "13px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ color: "#64748B", fontSize: "12px", textTransform: "uppercase", fontWeight: 600 }}>Current:</span>
                        <span style={{ fontWeight: 600, color: "#1E293B" }}>{request.CurrentSpecification}</span>
                        <span style={{ color: "#007ED5", fontWeight: 700 }}>→</span>
                        <span style={{ color: "#64748B", fontSize: "12px", textTransform: "uppercase", fontWeight: 600 }}>Requested:</span>
                        <span style={{ fontWeight: 700, color: "#007ED5" }}>{request.RequiredSpecfication}</span>
                      </div>
                    </div>

                    {request.ReasonForUpgrade && (
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#475569",
                          lineHeight: 1.5,
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "12px",
                          padding: "10px 14px",
                        }}
                      >
                        <strong style={{ color: "#1E293B" }}>Reason: </strong>
                        {request.ReasonForUpgrade}
                      </div>
                    )}

                    {request.IsAdminOverride && (
                      <Badge appearance="outline" color="warning" size="small" style={{ borderRadius: "25px", alignSelf: "flex-start" }}>
                        Manager Approval Overridden
                      </Badge>
                    )}

                    {isOverrideNeeded && (
                      <div style={{ fontSize: "12px", color: "#B8860B", background: "#FEF9C3", padding: "8px 12px", borderRadius: "10px" }}>
                        Manager status: {request.ManagerApprovalStatus === "Pending" ? "not yet decided" : request.ManagerApprovalStatus}. Approving now will override the Manager gate.
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  {!reprogressing && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "10px",
                        paddingTop: "14px",
                        borderTop: "1px solid #F1F5F9",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setDetailsRequest(request)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#007ED5",
                          fontSize: "13.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: "6px 4px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        View Details →
                      </button>

                      {(canManagerAct || canAdminAct) && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => {
                              setReprogressId(request.ID);
                              setReprogressReason("");
                            }}
                            style={{
                              background: "#FFFFFF",
                              border: "1px solid #CBD5E1",
                              borderRadius: "25px",
                              padding: "7px 16px",
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#475569",
                              cursor: acting ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                          >
                            <ArrowUndoRegular style={{ fontSize: "14px" }} />
                            <span>Send Back</span>
                          </button>

                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => handleAction(request, "Reject")}
                            style={{
                              background: "#FEF2F2",
                              border: "1px solid #FECACA",
                              borderRadius: "25px",
                              padding: "7px 16px",
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#DC2626",
                              cursor: acting ? "not-allowed" : "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#FEE2E2")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#FEF2F2")}
                          >
                            <DismissCircleRegular style={{ fontSize: "14px" }} />
                            <span>Reject</span>
                          </button>

                          <button
                            type="button"
                            disabled={acting}
                            onClick={() => handleAction(request, "Approve")}
                            style={{
                              background: "#16A34A",
                              border: "none",
                              borderRadius: "25px",
                              padding: "7px 20px",
                              fontSize: "13px",
                              fontWeight: 600,
                              color: "#FFFFFF",
                              cursor: acting ? "not-allowed" : "pointer",
                              boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#15803D")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#16A34A")}
                          >
                            {acting ? <Spinner size="tiny" /> : <CheckmarkCircleRegular style={{ fontSize: "14px" }} />}
                            <span>{isOverrideNeeded ? "Override & Approve" : "Approve"}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {(canManagerAct || canAdminAct) && reprogressing && (
                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #F1F5F9", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <Textarea
                        placeholder="What additional information is needed from the requestor?"
                        value={reprogressReason}
                        onChange={(_, d) => setReprogressReason(d.value)}
                        rows={3}
                        style={{ borderRadius: "12px" }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          type="button"
                          disabled={acting}
                          onClick={() => setReprogressId(null)}
                          style={{
                            background: "#FFFFFF",
                            border: "1px solid #CBD5E1",
                            borderRadius: "25px",
                            padding: "6px 18px",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#475569",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={acting || !reprogressReason.trim()}
                          onClick={() => handleReprogress(request, reprogressReason)}
                          style={{
                            background: "#007ED5",
                            border: "none",
                            borderRadius: "25px",
                            padding: "6px 20px",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#FFFFFF",
                            cursor: acting || !reprogressReason.trim() ? "not-allowed" : "pointer",
                            boxShadow: "0 2px 6px rgba(0, 126, 213, 0.25)",
                          }}
                        >
                          {acting ? <Spinner size="tiny" /> : "Send Back"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
      )}

      <UpgradeRequestDetailsPanel
        open={!!detailsRequest}
        onOpenChange={(isOpen) => !isOpen && setDetailsRequest(null)}
        request={detailsRequest}
        role={role}
        acting={!!detailsRequest && actingId === detailsRequest.ID}
        onDecision={async (action) => {
          if (!detailsRequest) return;
          await handleAction(detailsRequest, action);
          setDetailsRequest(null);
        }}
        onReprogress={async (reason) => {
          if (!detailsRequest) return;
          await handleReprogress(detailsRequest, reason);
          setDetailsRequest(null);
        }}
        onRespondComplete={onActionComplete}
      />
    </div>
  );
};

export default UpgradeRequestList;
