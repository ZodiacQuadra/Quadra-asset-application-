import React, { useEffect, useState } from "react";
import { Drawer, DrawerHeader, DrawerHeaderTitle, DrawerBody, Button, Text, Badge, Divider, Textarea, Spinner, Toast, ToastTitle, Toaster, useToastController, useId } from "@fluentui/react-components";
import { Dismiss24Regular, WrenchRegular, CheckmarkCircleRegular, DismissCircleRegular, WarningRegular, ArrowUndoRegular } from "@fluentui/react-icons";
import TruncatedText from "../../Common/TruncatedText";
import { useAuth } from "../../Auth/AuthProvider";
import {
  AssetRepairRequestRecord,
  getRepairReprogressHistory,
  respondToRepairReprogress,
  RepairAdminReprogressRecord,
} from "../Services/AssetRepairRequestService";

const STATUS_COLOR: Record<string, "warning" | "success" | "danger"> = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
  Unrepairable: "danger",
  "Re-Progress": "warning",
};

const formatDateTime = (value: string | null | undefined) => (value ? new Date(value).toLocaleString("en-IN") : "-");

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", gap: "16px" }}>
    <Text size={200} style={{ color: "#605E5C", flexShrink: 0 }}>
      {label}
    </Text>
    <TruncatedText text={value} size={200} weight="medium" maxWidth="260px" style={{ textAlign: "right" }} />
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text weight="semibold" style={{ display: "block", marginTop: "20px", marginBottom: "6px" }}>
    {children}
  </Text>
);

interface RepairRequestDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AssetRepairRequestRecord | null;
  role?: "employee" | "admin";
  acting?: boolean;
  onApprove?: () => void;
  onReject?: (reason: string) => void;
  onUnrepairable?: (note: string) => void;
  onReprogress?: (reason: string) => void;
  onRespondComplete?: () => void;
}

// Detail view for a Repair Request — same InfoRow/SectionTitle layout
// convention as AssetRequestDetailsPanel (the Employee Request panel).
// Repair Requests go straight to Admin (no Manager stage). When Admin opens
// this from a Pending request, the same Approve/Reject/Send Back actions
// available on the card also appear here — the card's own buttons are
// unchanged and kept as-is, this is just an additional place to act from.
// The employee's own response to a reprogressed request is handled entirely
// within this panel (fetches its own reprogress history, submits directly).
const RepairRequestDetailsPanel: React.FC<RepairRequestDetailsPanelProps> = ({
  open,
  onOpenChange,
  request,
  role,
  acting,
  onApprove,
  onReject,
  onUnrepairable,
  onReprogress,
  onRespondComplete,
}) => {
  const { currentUser } = useAuth();
  const toasterId = useId("repair-request-details-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [noteMode, setNoteMode] = useState<"Reject" | "Unrepairable" | "Reprogress" | null>(null);
  const [noteText, setNoteText] = useState("");

  const needsEmployeeResponse = role === "employee" && request?.RequestStatus === "Re-Progress";
  const [pendingReprogress, setPendingReprogress] = useState<RepairAdminReprogressRecord | null>(null);
  const [problem, setProblem] = useState("");
  const [employeeResponse, setEmployeeResponse] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    if (open) {
      setNoteMode(null);
      setNoteText("");
      setPendingReprogress(null);
      setEmployeeResponse("");
    }
    if (open && request && needsEmployeeResponse) {
      setProblem(request.Problem);
      getRepairReprogressHistory(request.ID)
        .then((history) => setPendingReprogress(history.find((h) => h.ReprogressStatus === "Pending") ?? null))
        .catch(() => {
          /* non-blocking — the reason banner just won't show if this fails */
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request?.ID, request?.RequestStatus]);

  const handleSubmitResponse = async () => {
    if (!request || !currentUser?.userID || !pendingReprogress) return;
    setSubmittingResponse(true);
    try {
      await respondToRepairReprogress(pendingReprogress.ID, currentUser.userID, {
        EmployeeResponse: employeeResponse || undefined,
        Problem: problem,
      });
      dispatchToast(
        <Toast>
          <ToastTitle>Response submitted</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      onRespondComplete?.();
      onOpenChange(false);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to submit response"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setSubmittingResponse(false);
    }
  };

  const canAct = role === "admin" && request?.RequestStatus === "Pending";

  return (
    <Drawer
      type="overlay"
      separator
      open={open}
      position="end"
      onOpenChange={(_, data) => onOpenChange(data.open)}
      style={{ width: "min(700px, 90vw)", backgroundColor: "#FFFFFF", background: "#FFFFFF", boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.15)" }}
    >
      <Toaster toasterId={toasterId} />
      <DrawerHeader style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
        <DrawerHeaderTitle action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onOpenChange(false)} />}>
          Repair Request Details
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody style={{ backgroundColor: "#FFFFFF" }}>
        {request && (
          <div style={{ paddingTop: "8px", paddingBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
                padding: "16px 18px",
                border: "1px solid #E1DFDD",
                borderRadius: "12px",
                background: "#FAFAFA",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "#E7F5EC",
                    color: "#107C10",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <WrenchRegular fontSize={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <TruncatedText text={request.RequestNumber} weight="semibold" size={400} maxWidth="260px" />
                  <Text size={200} style={{ color: "#605E5C" }}>
                    Requested on {formatDateTime(request.CreatedAt)}
                  </Text>
                </div>
              </div>
              <Badge appearance="tint" color={STATUS_COLOR[request.RequestStatus]} size="large">
                {request.RequestStatus}
              </Badge>
            </div>

            <SectionTitle>Asset</SectionTitle>
            <TruncatedText text={`${request.AssetName} (${request.AssetTagID})`} size={300} />

            <SectionTitle>Issue</SectionTitle>
            <InfoRow label="Issue Type" value={request.IssueType} />
            <InfoRow label="Problem Category" value={request.ProblemCategory} />

            <SectionTitle>Problem Description</SectionTitle>
            <Text size={300} style={{ display: "block", whiteSpace: "pre-wrap" }}>
              {request.Problem}
            </Text>

            {request.AttachmentURL.length > 0 && (
              <>
                <SectionTitle>Attachments</SectionTitle>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {request.AttachmentURL.map((f) => (
                    <a
                      key={f.relativePath}
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      title={f.fileName}
                      style={{
                        fontSize: "13px",
                        color: "#007ED5",
                        display: "block",
                        maxWidth: "100%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {f.fileName}
                    </a>
                  ))}
                </div>
              </>
            )}

            <Divider style={{ margin: "20px 0" }} />

            <Text size={400} weight="semibold">
              Admin Decision
            </Text>
            <InfoRow label="Assigned Admin(s)" value={request.AssignedAdminName ?? "-"} />
            <InfoRow label="Status" value={request.RequestStatus} />
            <InfoRow label="Decided By" value={request.ApprovedAdminName ?? "-"} />
            <InfoRow label="Decision Date" value={formatDateTime(request.ApprovedDate)} />
            {(request.RequestStatus === "Rejected" || request.RequestStatus === "Unrepairable") && request.AdminRejectionReason && (
              <InfoRow
                label={request.RequestStatus === "Unrepairable" ? "Unrepairable Note" : "Rejection Reason"}
                value={request.AdminRejectionReason}
              />
            )}
            {request.RequestStatus === "Unrepairable" && request.ReplacementRequestNumber && (
              <InfoRow label="Replacement Requested" value={request.ReplacementRequestNumber} />
            )}

            {canAct && (
              <>
                <Divider style={{ margin: "20px 0" }} />
                {!noteMode ? (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <Button
                      appearance="outline"
                      icon={<ArrowUndoRegular />}
                      disabled={acting}
                      onClick={() => {
                        setNoteMode("Reprogress");
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
                        setNoteMode("Unrepairable");
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
                        setNoteMode("Reject");
                        setNoteText("");
                      }}
                    >
                      Reject
                    </Button>
                    <Button
                      appearance="primary"
                      style={{ background: "#007ED5", borderColor: "#007ED5" }}
                      icon={acting ? <Spinner size="tiny" /> : <CheckmarkCircleRegular />}
                      disabled={acting}
                      onClick={() => onApprove?.()}
                    >
                      Approve
                    </Button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <Textarea
                      placeholder={
                        noteMode === "Unrepairable"
                          ? "Explain why this asset can't be repaired — a replacement will be auto-requested..."
                          : noteMode === "Reprogress"
                            ? "What additional information is needed from the requestor?"
                            : "Reason for rejecting this repair request..."
                      }
                      value={noteText}
                      onChange={(_, d) => setNoteText(d.value)}
                      rows={3}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <Button appearance="secondary" size="small" disabled={acting} onClick={() => setNoteMode(null)}>
                        Cancel
                      </Button>
                      <Button
                        appearance="primary"
                        size="small"
                        style={{ background: "#007ED5", borderColor: "#007ED5" }}
                        disabled={acting || !noteText.trim()}
                        icon={acting ? <Spinner size="tiny" /> : undefined}
                        onClick={() =>
                          noteMode === "Unrepairable"
                            ? onUnrepairable?.(noteText)
                            : noteMode === "Reprogress"
                              ? onReprogress?.(noteText)
                              : onReject?.(noteText)
                        }
                      >
                        {noteMode === "Unrepairable" ? "Confirm Unrepairable" : noteMode === "Reprogress" ? "Send Back" : "Confirm Reject"}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {needsEmployeeResponse && (
              <>
                <Divider style={{ margin: "20px 0" }} />
                <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#FFF4CE", border: "1px solid #F2C811", marginBottom: "12px" }}>
                  <Text size={200} weight="semibold" style={{ color: "#7A5D00", display: "block" }}>
                    Admin needs more information before deciding on this request.
                  </Text>
                  {pendingReprogress?.AdminReason && (
                    <Text size={200} style={{ color: "#7A5D00", display: "block", marginTop: "4px" }}>
                      {pendingReprogress.AdminReason}
                    </Text>
                  )}
                </div>

                <Text weight="semibold" style={{ display: "block", marginBottom: "6px" }}>
                  Problem Description
                </Text>
                <Textarea value={problem} onChange={(_, d) => setProblem(d.value)} rows={3} />

                <Text weight="semibold" style={{ display: "block", marginTop: "12px", marginBottom: "6px" }}>
                  Your Response (Optional)
                </Text>
                <Textarea
                  placeholder="Add any context for the Admin..."
                  value={employeeResponse}
                  onChange={(_, d) => setEmployeeResponse(d.value)}
                  rows={2}
                />

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
                  <Button
                    appearance="primary"
                    style={{ background: "#007ED5", borderColor: "#007ED5" }}
                    disabled={submittingResponse || !pendingReprogress}
                    icon={submittingResponse ? <Spinner size="tiny" /> : undefined}
                    onClick={handleSubmitResponse}
                  >
                    Submit Response
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DrawerBody>
    </Drawer>
  );
};

export default RepairRequestDetailsPanel;
