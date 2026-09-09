import React, { useMemo, useState } from "react";
import { Card, Button, Text, Badge, Spinner, Textarea, Toast, ToastTitle, Toaster, useToastController, useId } from "@fluentui/react-components";
import { CheckmarkCircleRegular, DismissCircleRegular, WrenchRegular, WarningRegular, ArrowUndoRegular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import TruncatedText from "../../Common/TruncatedText";
import {
  AssetRepairRequestRecord,
  RepairRequestStatus,
  adminActionOnRepairRequest,
  adminReprogressRepairRequest,
} from "../Services/AssetRepairRequestService";
import RepairRequestDetailsPanel from "./RepairRequestDetailsPanel";

const STATUS_COLOR: Record<string, "warning" | "success" | "danger"> = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
  Unrepairable: "danger",
  "Re-Progress": "warning",
};

const STATUS_TABS_ALL: { label: string; value: RepairRequestStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "Re-Progress", value: "Re-Progress" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
  { label: "Unrepairable", value: "Unrepairable" },
];

const EMPLOYEE_STATUS_TABS: { label: string; value: string }[] = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
];

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

interface RepairRequestListProps {
  requests: AssetRepairRequestRecord[];
  role: "admin" | "manager" | "employee";
  onActionComplete: () => void;
}

const RepairRequestList: React.FC<RepairRequestListProps> = ({ requests, role, onActionComplete }) => {
  const { currentUser } = useAuth();
  const toasterId = useId("repair-request-list-toaster");
  const { dispatchToast } = useToastController(toasterId);
  const [actingId, setActingId] = useState<string | null>(null);
  const [noteActionId, setNoteActionId] = useState<string | null>(null);
  const [noteActionType, setNoteActionType] = useState<"Reject" | "Unrepairable" | "Reprogress" | null>(null);
  const [noteText, setNoteText] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");
  const [detailsRequest, setDetailsRequest] = useState<AssetRepairRequestRecord | null>(null);

  const tabs = role === "employee" ? EMPLOYEE_STATUS_TABS : STATUS_TABS_ALL;

  const statusTabCounts = useMemo(() => {
    const counts = { All: requests.length } as Record<string, number>;
    if (role === "employee") {
      counts["Pending"] = requests.filter((r) => ["Pending", "Re-Progress"].includes(r.RequestStatus)).length;
      counts["Approved"] = requests.filter((r) => r.RequestStatus === "Approved").length;
      counts["Rejected"] = requests.filter((r) => ["Rejected", "Unrepairable"].includes(r.RequestStatus)).length;
    } else {
      STATUS_TABS_ALL.forEach((tab) => {
        if (tab.value === "All") return;
        counts[tab.value] = requests.filter((r) => r.RequestStatus === tab.value).length;
      });
    }
    return counts;
  }, [requests, role]);

  const filteredRequests = useMemo(() => {
    if (activeTab === "All") return requests;
    if (role === "employee") {
      if (activeTab === "Pending") return requests.filter((r) => ["Pending", "Re-Progress"].includes(r.RequestStatus));
      if (activeTab === "Approved") return requests.filter((r) => r.RequestStatus === "Approved");
      if (activeTab === "Rejected") return requests.filter((r) => ["Rejected", "Unrepairable"].includes(r.RequestStatus));
    }
    return requests.filter((r) => r.RequestStatus === activeTab);
  }, [requests, activeTab, role]);

  const handleApprove = async (request: AssetRepairRequestRecord) => {
    if (!currentUser?.userID) return;
    setActingId(request.ID);
    try {
      await adminActionOnRepairRequest(request.ID, "Approve", currentUser.userID, currentUser.displayName, currentUser.email);
      dispatchToast(
        <Toast>
          <ToastTitle>Request approved</ToastTitle>
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

  const handleConfirmReject = async (request: AssetRepairRequestRecord, reason: string) => {
    if (!currentUser?.userID) return;
    if (!reason.trim()) return;
    setActingId(request.ID);
    try {
      await adminActionOnRepairRequest(
        request.ID,
        "Reject",
        currentUser.userID,
        currentUser.displayName,
        currentUser.email,
        reason.trim()
      );
      dispatchToast(
        <Toast>
          <ToastTitle>Request rejected</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setNoteActionId(null);
      setNoteActionType(null);
      setNoteText("");
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

  const handleConfirmUnrepairable = async (request: AssetRepairRequestRecord, note: string) => {
    if (!currentUser?.userID) return;
    if (!note.trim()) return;
    setActingId(request.ID);
    try {
      const result = await adminActionOnRepairRequest(
        request.ID,
        "Unrepairable",
        currentUser.userID,
        currentUser.displayName,
        currentUser.email,
        note.trim()
      );
      dispatchToast(
        <Toast>
          <ToastTitle>
            {result?.replacementRequestNumber
              ? `Asset retired — replacement request ${result.replacementRequestNumber} raised`
              : "Asset marked unrepairable"}
          </ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setNoteActionId(null);
      setNoteActionType(null);
      setNoteText("");
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

  const handleReprogress = async (request: AssetRepairRequestRecord, reason: string) => {
    if (!currentUser?.userID || !reason.trim()) return;
    setActingId(request.ID);
    try {
      await adminReprogressRepairRequest(request.ID, reason.trim(), currentUser.userID, currentUser.displayName, currentUser.email);
      dispatchToast(
        <Toast>
          <ToastTitle>Request sent back for re-progress</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setNoteActionId(null);
      setNoteActionType(null);
      setNoteText("");
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
    return <Text style={{ color: "#605E5C", padding: "20px 0" }}>No repair requests found.</Text>;
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
        <Text style={{ color: "#605E5C", padding: "20px 0" }}>No requests match this filter.</Text>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {filteredRequests.map((request) => {
            const canAct = role === "admin" && request.RequestStatus === "Pending";
            const acting = actingId === request.ID;
            const takingNote = noteActionId === request.ID;

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
                          background: "#E7F5EC",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <WrenchRegular fontSize={18} style={{ color: "#107C10" }} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <TruncatedText text={request.RequestNumber} weight="semibold" />
                        <TruncatedText text={`${request.AssetName} (${request.AssetTagID})`} size={200} color="#64748b" />
                      </div>
                    </div>
                    <Badge appearance="tint" color={STATUS_COLOR[request.RequestStatus]}>
                      {request.RequestStatus}
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
                      {formatDate(request.CreatedAt)}
                    </Text>
                    {request.RequestStatus === "Re-Progress" ? (
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
                    background: "#E7F5EC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <WrenchRegular fontSize={18} style={{ color: "#107C10" }} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <TruncatedText text={request.RequestNumber} weight="semibold" />
                  <TruncatedText text={`${request.AssetName} (${request.AssetTagID})`} size={200} color="#605E5C" />
                </div>
              </div>
              <Badge appearance="tint" color={STATUS_COLOR[request.RequestStatus]}>
                {request.RequestStatus}
              </Badge>
            </div>

            <TruncatedText
              text={`Requested by ${request.RequestedByName ?? "Unknown"} on ${formatDate(request.CreatedAt)}`}
              size={200}
              color="#605E5C"
              style={{ marginTop: "10px" }}
            />
            <TruncatedText
              text={`${request.IssueType} · ${request.ProblemCategory}`}
              size={200}
              style={{ marginTop: "6px" }}
            />
            <Text size={200} style={{ color: "#605E5C", display: "block", marginTop: "6px", whiteSpace: "pre-wrap" }}>
              {request.Problem}
            </Text>
            {request.AttachmentURL.length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "8px" }}>
                {request.AttachmentURL.map((f) => (
                  <a
                    key={f.relativePath}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    title={f.fileName}
                    style={{ fontSize: "12px", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {f.fileName}
                  </a>
                ))}
              </div>
            )}
            {(request.RequestStatus === "Rejected" || request.RequestStatus === "Unrepairable") && request.AdminRejectionReason && (
              <Text size={200} style={{ color: "#D13438", display: "block", marginTop: "8px" }}>
                {request.RequestStatus === "Unrepairable" ? "Note" : "Reason"}: {request.AdminRejectionReason}
              </Text>
            )}
            {request.RequestStatus === "Unrepairable" && request.ReplacementRequestNumber && (
              <Text size={200} style={{ color: "#107C10", display: "block", marginTop: "6px" }}>
                Replacement requested: {request.ReplacementRequestNumber}
              </Text>
            )}

            {!takingNote && (
              <div
                style={{
                  display: "flex",
                  justifyContent: canAct ? "space-between" : "flex-end",
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
                {canAct && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      appearance="outline"
                      icon={<ArrowUndoRegular />}
                      disabled={acting}
                      onClick={() => {
                        setNoteActionId(request.ID);
                        setNoteActionType("Reprogress");
                        setNoteText("");
                      }}
                    >
                      Send Back
                    </Button>
                    <Button
                      appearance="outline"
                      icon={<WarningRegular />}
                      disabled={acting}
                      onClick={() => {
                        setNoteActionId(request.ID);
                        setNoteActionType("Unrepairable");
                        setNoteText("");
                      }}
                    >
                      Unrepairable
                    </Button>
                    <Button
                      appearance="outline"
                      icon={<DismissCircleRegular />}
                      disabled={acting}
                      onClick={() => {
                        setNoteActionId(request.ID);
                        setNoteActionType("Reject");
                        setNoteText("");
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      appearance="primary"
                      icon={acting ? <Spinner size="tiny" /> : <CheckmarkCircleRegular />}
                      disabled={acting}
                      onClick={() => handleApprove(request)}
                    >
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            )}

            {canAct && takingNote && (
              <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #F3F2F1", display: "flex", flexDirection: "column", gap: "8px" }}>
                <Textarea
                  placeholder={
                    noteActionType === "Unrepairable"
                      ? "Explain why this asset can't be repaired — a replacement will be auto-requested..."
                      : noteActionType === "Reprogress"
                        ? "What additional information is needed from the requestor?"
                        : "Reason for rejecting this repair request..."
                  }
                  value={noteText}
                  onChange={(_, d) => setNoteText(d.value)}
                  rows={3}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  <Button
                    appearance="secondary"
                    size="small"
                    disabled={acting}
                    onClick={() => {
                      setNoteActionId(null);
                      setNoteActionType(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    appearance="primary"
                    size="small"
                    disabled={acting || !noteText.trim()}
                    icon={acting ? <Spinner size="tiny" /> : undefined}
                    onClick={() =>
                      noteActionType === "Unrepairable"
                        ? handleConfirmUnrepairable(request, noteText)
                        : noteActionType === "Reprogress"
                          ? handleReprogress(request, noteText)
                          : handleConfirmReject(request, noteText)
                    }
                  >
                    {noteActionType === "Unrepairable" ? "Confirm Unrepairable" : noteActionType === "Reprogress" ? "Send Back" : "Confirm Reject"}
                  </Button>
                </div>
              </div>
            )}
              </div>
            );
          })}
        </div>
      )}

      <RepairRequestDetailsPanel
        open={!!detailsRequest}
        onOpenChange={(isOpen) => !isOpen && setDetailsRequest(null)}
        request={detailsRequest}
        role={role}
        acting={!!detailsRequest && actingId === detailsRequest.ID}
        onApprove={async () => {
          if (!detailsRequest) return;
          await handleApprove(detailsRequest);
          setDetailsRequest(null);
        }}
        onReject={async (reason) => {
          if (!detailsRequest) return;
          await handleConfirmReject(detailsRequest, reason);
          setDetailsRequest(null);
        }}
        onUnrepairable={async (note) => {
          if (!detailsRequest) return;
          await handleConfirmUnrepairable(detailsRequest, note);
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

export default RepairRequestList;
