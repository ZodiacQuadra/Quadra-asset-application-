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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
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
                    className="quadra-glass-card hover:shadow-lg transition-all duration-200"
                    style={{ padding: "18px", borderRadius: "14px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            background: "#FFF4CE",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <DeveloperBoardRegular fontSize={18} style={{ color: "#B8860B" }} />
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <TruncatedText text={request.RequestNumber} weight="semibold" />
                          <TruncatedText
                            text={`${request.CategoryName} · ${request.ComponentDisplayName}`}
                            size={200}
                            color="#64748b"
                          />
                        </div>
                      </div>
                      <Badge appearance="tint" color={STATUS_COLOR[request.ReqStatus]}>
                        {STATUS_LABEL[request.ReqStatus] ?? request.ReqStatus}
                      </Badge>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "14px",
                        paddingTop: "12px",
                        borderTop: "1px solid rgba(226, 232, 240, 0.7)",
                      }}
                    >
                      <Text size={200} style={{ color: "#64748b" }}>
                        {formatDate(request.RequestedDate ?? request.CreatedAt)}
                      </Text>
                      {request.ReqStatus === "ManagerReprogress" || request.ReqStatus === "AdminReprogress" ? (
                        <Button
                          appearance="primary"
                          style={{ background: "#007ED5", borderColor: "#007ED5", borderRadius: "8px" }}
                          onClick={() => setDetailsRequest(request)}
                        >
                          Respond →
                        </Button>
                      ) : (
                        <Button appearance="subtle" style={{ color: "#007ED5", borderRadius: "8px" }} onClick={() => setDetailsRequest(request)}>
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
                  className="quadra-glass-card hover:shadow-lg transition-all duration-200"
                  style={{ padding: "18px", borderRadius: "14px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "#FFF4CE",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <DeveloperBoardRegular fontSize={18} style={{ color: "#B8860B" }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <TruncatedText text={request.RequestNumber} weight="semibold" />
                        <TruncatedText
                          text={`${request.CategoryName} · ${request.ComponentDisplayName}`}
                          size={200}
                          color="#605E5C"
                        />
                      </div>
                    </div>
                    <Badge appearance="tint" color={STATUS_COLOR[request.ReqStatus]}>
                      {STATUS_LABEL[request.ReqStatus] ?? request.ReqStatus}
                    </Badge>
                  </div>

                  <TruncatedText
                    text={`Requested by ${request.RequestedByName ?? "Unknown"} on ${formatDate(request.RequestedDate ?? request.CreatedAt)}`}
                    size={200}
                    color="#605E5C"
                    style={{ marginTop: "10px" }}
                  />
                  <Text size={200} style={{ display: "block", marginTop: "6px" }}>
                    Current: {request.CurrentSpecification} → Requested: {request.RequiredSpecfication}
                  </Text>
                  {request.ReasonForUpgrade && (
                    <Text size={200} style={{ color: "#605E5C", display: "block", marginTop: "6px" }}>
                      Reason: {request.ReasonForUpgrade}
                    </Text>
                  )}
                  {request.IsAdminOverride && (
                    <Badge appearance="outline" color="warning" size="small" style={{ marginTop: "8px" }}>
                      Manager Approval Overridden
                    </Badge>
                  )}

                  {isOverrideNeeded && (
                    <Text size={200} style={{ color: "#B8860B", display: "block", marginTop: "8px" }}>
                      Manager status: {request.ManagerApprovalStatus === "Pending" ? "not yet decided" : request.ManagerApprovalStatus}
                      . Approving now will override the Manager gate.
                    </Text>
                  )}

                  {!reprogressing && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: (canManagerAct || canAdminAct) ? "space-between" : "flex-end",
                        alignItems: "center",
                        gap: "8px",
                        marginTop: "12px",
                        paddingTop: "10px",
                        borderTop: "1px solid #F3F2F1",
                      }}
                    >
                      <Button appearance="transparent" style={{ color: "#007ED5" }} onClick={() => setDetailsRequest(request)}>
                        View Details →
                      </Button>
                      {(canManagerAct || canAdminAct) && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <Button
                            appearance="outline"
                            icon={<ArrowUndoRegular />}
                            disabled={acting}
                            onClick={() => {
                              setReprogressId(request.ID);
                              setReprogressReason("");
                            }}
                          >
                            Send Back
                          </Button>
                          <Button
                            appearance="outline"
                            icon={<DismissCircleRegular />}
                            disabled={acting}
                            onClick={() => handleAction(request, "Reject")}
                          >
                            Reject
                          </Button>
                          <Button
                            appearance="primary"
                            icon={acting ? <Spinner size="tiny" /> : <CheckmarkCircleRegular />}
                            disabled={acting}
                            onClick={() => handleAction(request, "Approve")}
                          >
                            {isOverrideNeeded ? "Override & Approve" : "Approve"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {(canManagerAct || canAdminAct) && reprogressing && (
                    <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #F3F2F1", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <Textarea
                        placeholder="What additional information is needed from the requestor?"
                        value={reprogressReason}
                        onChange={(_, d) => setReprogressReason(d.value)}
                        rows={3}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <Button appearance="secondary" size="small" disabled={acting} onClick={() => setReprogressId(null)}>
                          Cancel
                        </Button>
                        <Button
                          appearance="primary"
                          size="small"
                          disabled={acting || !reprogressReason.trim()}
                          icon={acting ? <Spinner size="tiny" /> : undefined}
                          onClick={() => handleReprogress(request, reprogressReason)}
                        >
                          Send Back
                        </Button>
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
