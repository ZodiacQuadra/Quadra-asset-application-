import React, { useEffect, useState } from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Text,
  Badge,
  Textarea,
  Spinner,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  WrenchRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  WarningRegular,
  ArrowUndoRegular,
  DocumentBulletListRegular,
  AttachRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import {
  AssetRepairRequestRecord,
  getRepairReprogressHistory,
  respondToRepairReprogress,
  adminActionOnRepairRequest,
  adminReprogressRepairRequest,
  RepairAdminReprogressRecord,
} from "../Services/AssetRepairRequestService";
import {
  DrawerTopIdentityCard,
  InfoCardGroup,
  InfoRow,
  OptionCard,
  DecisionContainer,
  DecisionSummaryCard,
  DecisionOptionDef,
} from "./RequestDrawerComponents";

const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

type RepairDecisionChoice = "Approve" | "Unrepairable" | "Reject" | "Reprogress";

const REPAIR_DECISION_OPTIONS: Record<RepairDecisionChoice, DecisionOptionDef> = {
  Approve: {
    kind: "Approve",
    label: "Approve & Authorize Maintenance",
    description: "Approve repair and authorize maintenance service or technician handling",
    icon: <CheckmarkCircleRegular />,
    accent: "#059669",
    iconBg: "#ECFDF5",
    activeBg: "#F0FDF4",
    activeBorder: "#10B981",
  },
  Unrepairable: {
    kind: "Unrepairable",
    label: "Mark Beyond Repair (Unrepairable)",
    description: "Decommission damaged device and automatically generate replacement request",
    icon: <WarningRegular />,
    accent: "#7C3AED",
    iconBg: "#F5F3FF",
    activeBg: "#FAF5FF",
    activeBorder: "#8B5CF6",
  },
  Reject: {
    kind: "Reject",
    label: "Reject Service Request",
    description: "Decline repair requisition with a mandatory audit explanation",
    icon: <DismissCircleRegular />,
    accent: "#DC2626",
    iconBg: "#FEF2F2",
    activeBg: "#FEF2F2",
    activeBorder: "#EF4444",
  },
  Reprogress: {
    kind: "Reprogress",
    label: "Request Information (Reprogress)",
    description: "Send back to employee requesting additional diagnostic clarification or photos",
    icon: <ArrowUndoRegular />,
    accent: "#D97706",
    iconBg: "#FFFBEB",
    activeBg: "#FFFBEB",
    activeBorder: "#F59E0B",
  },
};

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
  onActionComplete?: () => void;
}

const RepairRequestDetailsPanel: React.FC<RepairRequestDetailsPanelProps> = ({
  open,
  onOpenChange,
  request,
  role = "admin",
  acting: externalActing,
  onApprove,
  onReject,
  onUnrepairable,
  onReprogress,
  onRespondComplete,
  onActionComplete,
}) => {
  const { currentUser } = useAuth();
  const toasterId = useId("repair-request-details-toaster");
  const { dispatchToast } = useToastController(toasterId);

  // Decision State
  const [selectedDecision, setSelectedDecision] = useState<RepairDecisionChoice>("Approve");
  const [vendorNote, setVendorNote] = useState("");
  const [unrepairableNote, setUnrepairableNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [reprogressReason, setReprogressReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Employee Reprogress State
  const needsEmployeeResponse = role === "employee" && request?.RequestStatus === "Re-Progress";
  const [pendingReprogress, setPendingReprogress] = useState<RepairAdminReprogressRecord | null>(null);
  const [problem, setProblem] = useState("");
  const [employeeResponse, setEmployeeResponse] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedDecision("Approve");
      setVendorNote("");
      setUnrepairableNote("");
      setRejectionReason("");
      setReprogressReason("");
      setPendingReprogress(null);
      setEmployeeResponse("");
    }
    if (open && request && needsEmployeeResponse) {
      setProblem(request.Problem);
      getRepairReprogressHistory(request.ID)
        .then((history) => setPendingReprogress(history.find((h) => h.ReprogressStatus === "Pending") ?? null))
        .catch(() => {});
    }
  }, [open, request?.ID, request?.RequestStatus, needsEmployeeResponse]);

  if (!request) return null;

  const isPending = request.RequestStatus === "Pending" || request.RequestStatus === "Re-Progress";
  const isActionable = role === "admin" && isPending;
  const isActing = externalActing || isSubmitting;
  const attachmentFiles = Array.isArray(request.AttachmentURL) ? request.AttachmentURL : [];

  const handleDecisionSubmit = async () => {
    if (!currentUser?.userID) return;
    setIsSubmitting(true);

    try {
      if (selectedDecision === "Approve") {
        if (onApprove) {
          onApprove();
        } else {
          await adminActionOnRepairRequest(
            request.ID,
            "Approve",
            currentUser.userID,
            currentUser.displayName,
            currentUser.email,
            vendorNote || undefined
          );
        }
        dispatchToast(
          <Toast>
            <ToastTitle>Repair request authorized successfully</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else if (selectedDecision === "Unrepairable") {
        if (onUnrepairable) {
          onUnrepairable(unrepairableNote);
        } else {
          await adminActionOnRepairRequest(
            request.ID,
            "Unrepairable",
            currentUser.userID,
            currentUser.displayName,
            currentUser.email,
            unrepairableNote
          );
        }
        dispatchToast(
          <Toast>
            <ToastTitle>Asset marked unrepairable. Replacement requested.</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else if (selectedDecision === "Reject") {
        if (onReject) {
          onReject(rejectionReason);
        } else {
          await adminActionOnRepairRequest(
            request.ID,
            "Reject",
            currentUser.userID,
            currentUser.displayName,
            currentUser.email,
            rejectionReason
          );
        }
        dispatchToast(
          <Toast>
            <ToastTitle>Repair request rejected</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else if (selectedDecision === "Reprogress") {
        if (onReprogress) {
          onReprogress(reprogressReason);
        } else {
          await adminReprogressRepairRequest(
            request.ID,
            reprogressReason,
            currentUser.userID,
            currentUser.displayName,
            currentUser.email
          );
        }
        dispatchToast(
          <Toast>
            <ToastTitle>Requisition sent back for clarification</ToastTitle>
          </Toast>,
          { intent: "info" }
        );
      }

      onActionComplete?.();
      onRespondComplete?.();
      onOpenChange(false);
    } catch (error: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error?.message || "Failed to record repair decision"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmployeeSubmitResponse = async () => {
    if (!request || !currentUser?.userID || !pendingReprogress) return;
    setSubmittingResponse(true);
    try {
      await respondToRepairReprogress(pendingReprogress.ID, currentUser.userID, {
        EmployeeResponse: employeeResponse || undefined,
        Problem: problem,
      });
      dispatchToast(
        <Toast>
          <ToastTitle>Response submitted successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      onRespondComplete?.();
      onActionComplete?.();
      onOpenChange(false);
    } catch (error: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error?.message || "Failed to submit response"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setSubmittingResponse(false);
    }
  };

  const isSubmitDisabled =
    isActing ||
    (selectedDecision === "Unrepairable" && !unrepairableNote.trim()) ||
    (selectedDecision === "Reject" && !rejectionReason.trim()) ||
    (selectedDecision === "Reprogress" && !reprogressReason.trim());

  const currentOptionDef = REPAIR_DECISION_OPTIONS[selectedDecision];

  return (
    <Drawer
      type="overlay"
      separator
      open={open}
      position="end"
      onOpenChange={(_, data) => onOpenChange(data.open)}
      style={{
        width: "min(1140px, 96vw)",
        maxWidth: "96vw",
        backgroundColor: "#FFFFFF",
        background: "#FFFFFF",
        boxShadow: "-10px 0 40px rgba(15, 23, 42, 0.18)",
      }}
    >
      <Toaster toasterId={toasterId} />

      {/* Header */}
      <DrawerHeader style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0", padding: "16px 24px" }}>
        <DrawerHeaderTitle
          action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onOpenChange(false)} />}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "#EFF6FF",
                color: "#007ED5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              <WrenchRegular style={{ fontSize: 18 }} />
            </div>
            <div>
              <Text weight="bold" style={{ color: "#0F172A", fontSize: "15px", display: "block" }}>
                Repair Request Details
              </Text>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Review repair requisition {request.RequestNumber || "REP-REQ"}
              </span>
            </div>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      {/* Body */}
      <DrawerBody style={{ backgroundColor: "#FFFFFF", padding: "20px 24px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.65fr) minmax(360px, 1fr)",
            gap: "24px",
            alignItems: "start",
            paddingBottom: "24px",
          }}
        >
          {/* Left Column (~65%): Information Card Groups */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {/* Requester Identity Card */}
            <DrawerTopIdentityCard
              name={request.RequestedByName || "Employee"}
              jobTitle={request.RequestNumber ? `Requisition ${request.RequestNumber}` : "Hardware Service Requisition"}
              email={request.RequestedByEmail}
              dateLabel={`Requested on ${formatDateTime(request.CreatedAt)}`}
              status={request.RequestStatus}
              statusColor={
                request.RequestStatus === "Approved"
                  ? "success"
                  : request.RequestStatus === "Rejected" || request.RequestStatus === "Unrepairable"
                  ? "danger"
                  : "warning"
              }
            />

            {/* Asset Under Maintenance */}
            <InfoCardGroup title="Asset Under Maintenance">
              <InfoRow label="Asset Name" value={request.AssetName || "—"} />
              <InfoRow label="Asset Tag ID" value={request.AssetTagID || "—"} />
              <InfoRow label="Issue Category" value={request.ProblemCategory || "—"} />
              <InfoRow label="Issue Classification" value={request.IssueType || "Standard Maintenance"} hasDivider={false} />
            </InfoCardGroup>

            {/* Problem Description & Symptoms */}
            <InfoCardGroup title="Problem Description & Diagnostic Symptoms">
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "14px 16px",
                  fontSize: "13.5px",
                  color: "#334155",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  margin: "8px 0",
                }}
              >
                {request.Problem || "No problem description submitted."}
              </div>
            </InfoCardGroup>

            {/* Diagnostic Attachments */}
            {attachmentFiles.length > 0 && (
              <InfoCardGroup title={`Diagnostic Attachments (${attachmentFiles.length})`}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "8px 0" }}>
                  {attachmentFiles.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: "#FFFFFF",
                        border: "1px solid #BFDBFE",
                        color: "#007ED5",
                        textDecoration: "none",
                        fontSize: "13px",
                        fontWeight: 500,
                      }}
                    >
                      <AttachRegular style={{ fontSize: 16 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.fileName || `Attachment ${idx + 1}`}
                      </span>
                    </a>
                  ))}
                </div>
              </InfoCardGroup>
            )}

            {/* If Request is already resolved / unrepairable, show Left Side Decision Record */}
            {!isPending && (
              <DecisionSummaryCard
                status={request.RequestStatus}
                decidedBy={request.ApprovedAdminName}
                decidedDate={request.ApprovedDate}
                decidedReason={request.AdminRejectionReason}
                extraDetails={
                  request.RequestStatus === "Unrepairable" && request.ReplacementRequestNumber
                    ? [{ label: "Replacement Requisition", value: request.ReplacementRequestNumber }]
                    : []
                }
              />
            )}
          </div>

          {/* Right Column (~35%): Make Decision or Employee Response */}
          <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Admin Decision Container */}
            {isActionable ? (
              <DecisionContainer
                isActionable={true}
                title="Make Decision"
                subtitle="Review & authorize repair or record outcome"
                badgeLabel="Action Required"
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* Option 1: Approve */}
                  <OptionCard
                    def={REPAIR_DECISION_OPTIONS.Approve}
                    selected={selectedDecision === "Approve"}
                    onClick={() => setSelectedDecision("Approve")}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#065F46" }}>
                        Service / Vendor Instructions <span style={{ fontWeight: 400, color: "#64748B" }}>(Optional)</span>
                      </label>
                      <Textarea
                        placeholder="e.g. Authorized for internal workshop battery replacement..."
                        value={vendorNote}
                        onChange={(_, d) => setVendorNote(d.value)}
                        rows={2}
                      />
                    </div>
                  </OptionCard>

                  {/* Option 2: Mark Beyond Repair */}
                  <OptionCard
                    def={REPAIR_DECISION_OPTIONS.Unrepairable}
                    selected={selectedDecision === "Unrepairable"}
                    onClick={() => setSelectedDecision("Unrepairable")}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#6D28D9" }}>
                        Decommissioning Rationale <span style={{ color: "#DC2626" }}>*</span>
                      </label>
                      <Textarea
                        placeholder="Detail why motherboard/screen is unfixable and replacement is needed..."
                        value={unrepairableNote}
                        onChange={(_, d) => setUnrepairableNote(d.value)}
                        rows={3}
                      />
                    </div>
                  </OptionCard>

                  {/* Option 3: Reject */}
                  <OptionCard
                    def={REPAIR_DECISION_OPTIONS.Reject}
                    selected={selectedDecision === "Reject"}
                    onClick={() => setSelectedDecision("Reject")}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#B91C1C" }}>
                        Rejection Reason <span style={{ color: "#DC2626" }}>*</span>
                      </label>
                      <Textarea
                        placeholder="Explain reason for rejecting this repair request..."
                        value={rejectionReason}
                        onChange={(_, d) => setRejectionReason(d.value)}
                        rows={3}
                      />
                    </div>
                  </OptionCard>

                  {/* Option 4: Reprogress */}
                  <OptionCard
                    def={REPAIR_DECISION_OPTIONS.Reprogress}
                    selected={selectedDecision === "Reprogress"}
                    onClick={() => setSelectedDecision("Reprogress")}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#92400E" }}>
                        Information Needed from Employee <span style={{ color: "#DC2626" }}>*</span>
                      </label>
                      <Textarea
                        placeholder="e.g. Please provide photos of the physical damage or error logs..."
                        value={reprogressReason}
                        onChange={(_, d) => setReprogressReason(d.value)}
                        rows={3}
                      />
                    </div>
                  </OptionCard>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="button"
                  disabled={isSubmitDisabled}
                  onClick={handleDecisionSubmit}
                  style={{
                    width: "100%",
                    marginTop: "6px",
                    background: currentOptionDef.accent,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "22px",
                    padding: "11px 24px",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    cursor: isSubmitDisabled ? "not-allowed" : "pointer",
                    opacity: isSubmitDisabled ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: isSubmitDisabled ? "none" : `0 3px 10px ${currentOptionDef.accent}40`,
                    transition: "all 0.15s ease",
                  }}
                >
                  {isActing ? (
                    <Spinner size="tiny" />
                  ) : (
                    <>
                      {currentOptionDef.icon}
                      <span>Confirm {currentOptionDef.label.split(" ")[0]}</span>
                    </>
                  )}
                </button>
              </DecisionContainer>
            ) : needsEmployeeResponse ? (
              /* Employee Reprogress Clarification Form */
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "16px",
                  padding: "20px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                  Provide Clarification
                </div>
                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#FFFBEB",
                    border: "1px solid #FDE68A",
                  }}
                >
                  <Text size={200} weight="semibold" style={{ color: "#92400E", display: "block" }}>
                    ⚠ Admin requested more diagnostic information:
                  </Text>
                  {pendingReprogress?.AdminReason && (
                    <Text size={200} style={{ color: "#7A5D00", display: "block", marginTop: "4px" }}>
                      {pendingReprogress.AdminReason}
                    </Text>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A", display: "block", marginBottom: "6px" }}>
                    Updated Problem Statement
                  </label>
                  <Textarea value={problem} onChange={(_, d) => setProblem(d.value)} rows={3} style={{ width: "100%" }} />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A", display: "block", marginBottom: "6px" }}>
                    Your Clarification Response
                  </label>
                  <Textarea
                    placeholder="Describe symptoms, attachments, or error codes..."
                    value={employeeResponse}
                    onChange={(_, d) => setEmployeeResponse(d.value)}
                    rows={3}
                    style={{ width: "100%" }}
                  />
                </div>

                <button
                  type="button"
                  disabled={submittingResponse || !pendingReprogress}
                  onClick={handleEmployeeSubmitResponse}
                  style={{
                    width: "100%",
                    background: "#007ED5",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "22px",
                    padding: "10px 24px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: submittingResponse ? "not-allowed" : "pointer",
                    boxShadow: "0 2px 8px rgba(0,126,213,0.25)",
                  }}
                >
                  {submittingResponse ? <Spinner size="tiny" /> : "Submit Clarification"}
                </button>
              </div>
            ) : (
              /* Already Resolved Decision Card */
              <DecisionSummaryCard
                status={request.RequestStatus}
                decidedBy={request.ApprovedAdminName}
                decidedDate={request.ApprovedDate}
                decidedReason={request.AdminRejectionReason}
                extraDetails={
                  request.RequestStatus === "Unrepairable" && request.ReplacementRequestNumber
                    ? [{ label: "Replacement Requisition", value: request.ReplacementRequestNumber }]
                    : []
                }
              />
            )}
          </div>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default RepairRequestDetailsPanel;
