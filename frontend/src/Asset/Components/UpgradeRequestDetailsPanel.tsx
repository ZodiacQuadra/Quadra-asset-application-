import React, { useEffect, useState } from "react";
import { Drawer, DrawerHeader, DrawerHeaderTitle, DrawerBody, Button, Text, Badge, Divider, Spinner, Textarea, Toast, ToastTitle, Toaster, useToastController, useId } from "@fluentui/react-components";
import { Dismiss24Regular, DeveloperBoardRegular, CheckmarkCircleRegular, DismissCircleRegular, ArrowUndoRegular } from "@fluentui/react-icons";
import TruncatedText from "../../Common/TruncatedText";
import { useAuth } from "../../Auth/AuthProvider";
import {
  AssetUpgradeRequestRecord,
  getUpgradeReprogressHistory,
  getUpgradeAdminReprogressHistory,
  respondToUpgradeReprogress,
  respondToUpgradeAdminReprogress,
  UpgradeManagerReprogressRecord,
  UpgradeAdminReprogressRecord,
} from "../Services/AssetUpgradeRequestService";

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

interface UpgradeRequestDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AssetUpgradeRequestRecord | null;
  role?: "employee" | "manager" | "admin";
  acting?: boolean;
  onDecision?: (action: "Approve" | "Reject") => void;
  onReprogress?: (reason: string) => void;
  onRespondComplete?: () => void;
  onActionComplete?: () => void;
}

// Detail view for a Hardware Upgrade Request — same InfoRow/SectionTitle
// layout convention as AssetRequestDetailsPanel (the Employee Request panel).
// Manager/Admin can also decide (or send back for more info) directly from
// here — the card's own Approve/Reject/Send Back actions in
// UpgradeRequestList are unchanged and kept as-is, this is just an
// additional place to act from. The employee's own response to a
// reprogressed request is handled entirely within this panel (fetches its
// own reprogress history, submits directly), since it's the only surface
// that needs it.
const UpgradeRequestDetailsPanel: React.FC<UpgradeRequestDetailsPanelProps> = ({
  open,
  onOpenChange,
  request,
  role,
  acting,
  onDecision,
  onReprogress,
  onRespondComplete,
}) => {
  const { currentUser } = useAuth();
  const toasterId = useId("upgrade-request-details-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const canManagerAct = role === "manager" && request?.ManagerApprovalStatus === "Pending";
  const canAdminAct = role === "admin" && request?.AdminApprovalStatus === "Pending";
  const isOverrideNeeded = canAdminAct && request?.ManagerApprovalStatus !== "Approved";
  const canAct = canManagerAct || canAdminAct;
  const canReprogress = canManagerAct || canAdminAct;

  const [reprogressMode, setReprogressMode] = useState(false);
  const [reprogressReason, setReprogressReason] = useState("");

  const isManagerReprogress = request?.ReqStatus === "ManagerReprogress";
  const isAdminReprogress = request?.ReqStatus === "AdminReprogress";
  const needsEmployeeResponse = role === "employee" && (isManagerReprogress || isAdminReprogress);

  const [pendingReprogress, setPendingReprogress] = useState<UpgradeManagerReprogressRecord | UpgradeAdminReprogressRecord | null>(null);
  const [requiredSpec, setRequiredSpec] = useState("");
  const [reasonForUpgrade, setReasonForUpgrade] = useState("");
  const [employeeResponse, setEmployeeResponse] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    setReprogressMode(false);
    setReprogressReason("");
    setPendingReprogress(null);
    setEmployeeResponse("");
    if (!open || !request || !needsEmployeeResponse) return;
    setRequiredSpec(request.RequiredSpecfication);
    setReasonForUpgrade(request.ReasonForUpgrade ?? "");
    const loader = isManagerReprogress ? getUpgradeReprogressHistory : getUpgradeAdminReprogressHistory;
    loader(request.ID)
      .then((history) => setPendingReprogress(history.find((h) => h.ReprogressStatus === "Pending") ?? null))
      .catch(() => {
        /* non-blocking — the reason banner just won't show if this fails */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request?.ID, request?.ReqStatus]);

  const handleSubmitResponse = async () => {
    if (!request || !currentUser?.userID || !pendingReprogress) return;
    setSubmittingResponse(true);
    try {
      const payload = { EmployeeResponse: employeeResponse || undefined, RequiredSpecfication: requiredSpec, ReasonForUpgrade: reasonForUpgrade };
      if (isManagerReprogress) {
        await respondToUpgradeReprogress(pendingReprogress.ID, currentUser.userID, payload);
      } else {
        await respondToUpgradeAdminReprogress(pendingReprogress.ID, currentUser.userID, payload);
      }
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
          Upgrade Request Details
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
                    background: "#FFF4CE",
                    color: "#B8860B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <DeveloperBoardRegular fontSize={20} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <TruncatedText text={request.RequestNumber} weight="semibold" size={400} maxWidth="260px" />
                  <Text size={200} style={{ color: "#605E5C" }}>
                    Requested on {formatDateTime(request.RequestedDate ?? request.CreatedAt)}
                  </Text>
                </div>
              </div>
              <Badge appearance="tint" color={STATUS_COLOR[request.ReqStatus]} size="large">
                {STATUS_LABEL[request.ReqStatus] ?? request.ReqStatus}
              </Badge>
            </div>

            {request.IsAdminOverride && (
              <div style={{ marginTop: "16px", padding: "10px 12px", borderRadius: "8px", background: "#FFF4CE", border: "1px solid #F2C811" }}>
                <Text size={200} weight="semibold" style={{ color: "#7A5D00" }}>
                  ⚠ This request was completed by Admin override, bypassing the normal Manager approval gate.
                </Text>
              </div>
            )}

            <SectionTitle>Component</SectionTitle>
            <TruncatedText text={`${request.CategoryName} — ${request.ComponentDisplayName}`} size={300} />

            <SectionTitle>Specification Change</SectionTitle>
            <InfoRow label="Current" value={request.CurrentSpecification} />
            <InfoRow label="Requested" value={request.RequiredSpecfication} />

            {request.ReasonForUpgrade && (
              <>
                <SectionTitle>Reason for Upgrade</SectionTitle>
                <Text size={300} style={{ display: "block", whiteSpace: "pre-wrap" }}>
                  {request.ReasonForUpgrade}
                </Text>
              </>
            )}

            <Divider style={{ margin: "20px 0" }} />

            <Text size={400} weight="semibold">
              Manager Approval
            </Text>
            <InfoRow label="Assigned Manager" value={request.ManagerName ?? "-"} />
            <InfoRow label="Status" value={request.ManagerApprovalStatus} />
            <InfoRow label="Decision Date" value={formatDateTime(request.ManagerApprovedDate)} />

            <Divider style={{ margin: "20px 0" }} />

            <Text size={400} weight="semibold">
              Admin Approval
            </Text>
            <InfoRow label="Assigned Admin(s)" value={request.AssignedAdminName ?? "-"} />
            <InfoRow label="Status" value={request.AdminApprovalStatus} />
            <InfoRow label="Decided By" value={request.ApprovedAdminName ?? "-"} />
            <InfoRow label="Decision Date" value={formatDateTime(request.ApprovedAdminDate)} />
            <InfoRow label="Override Used" value={request.IsAdminOverride ? "Yes" : "No"} />

            {canAct && !reprogressMode && (
              <>
                <Divider style={{ margin: "20px 0" }} />
                {isOverrideNeeded && (
                  <div style={{ marginBottom: "12px", padding: "10px 12px", borderRadius: "8px", background: "#FFF4CE", border: "1px solid #F2C811" }}>
                    <Text size={200} weight="semibold" style={{ color: "#7A5D00" }}>
                      ⚠ Manager has not approved this request yet. Approving now will override that gate.
                    </Text>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                  {canReprogress && (
                    <Button
                      appearance="outline"
                      icon={<ArrowUndoRegular />}
                      disabled={acting}
                      onClick={() => {
                        setReprogressMode(true);
                        setReprogressReason("");
                      }}
                    >
                      Send Back
                    </Button>
                  )}
                  <Button
                    appearance="outline"
                    icon={<DismissCircleRegular />}
                    disabled={acting}
                    onClick={() => onDecision?.("Reject")}
                  >
                    Reject
                  </Button>
                  <Button
                    appearance="primary"
                    style={{ background: "#007ED5", borderColor: "#007ED5" }}
                    icon={acting ? <Spinner size="tiny" /> : <CheckmarkCircleRegular />}
                    disabled={acting}
                    onClick={() => onDecision?.("Approve")}
                  >
                    {isOverrideNeeded ? "Override & Approve" : "Approve"}
                  </Button>
                </div>
              </>
            )}

            {canReprogress && reprogressMode && (
              <>
                <Divider style={{ margin: "20px 0" }} />
                <Text weight="semibold" style={{ display: "block", marginBottom: "8px" }}>
                  Send Back for More Information
                </Text>
                <Textarea
                  placeholder="What additional information is needed from the requestor?"
                  value={reprogressReason}
                  onChange={(_, d) => setReprogressReason(d.value)}
                  rows={3}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "8px" }}>
                  <Button appearance="secondary" size="small" disabled={acting} onClick={() => setReprogressMode(false)}>
                    Cancel
                  </Button>
                  <Button
                    appearance="primary"
                    size="small"
                    style={{ background: "#007ED5", borderColor: "#007ED5" }}
                    disabled={acting || !reprogressReason.trim()}
                    icon={acting ? <Spinner size="tiny" /> : undefined}
                    onClick={() => {
                      onReprogress?.(reprogressReason.trim());
                      setReprogressMode(false);
                    }}
                  >
                    Send Back
                  </Button>
                </div>
              </>
            )}

            {needsEmployeeResponse && (
              <>
                <Divider style={{ margin: "20px 0" }} />
                <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#FFF4CE", border: "1px solid #F2C811", marginBottom: "12px" }}>
                  <Text size={200} weight="semibold" style={{ color: "#7A5D00", display: "block" }}>
                    {isManagerReprogress ? "Your Manager" : "Admin"} needs more information before deciding on this request.
                  </Text>
                  {pendingReprogress && (
                    <Text size={200} style={{ color: "#7A5D00", display: "block", marginTop: "4px" }}>
                      {isManagerReprogress
                        ? (pendingReprogress as UpgradeManagerReprogressRecord).ManagerReason
                        : (pendingReprogress as UpgradeAdminReprogressRecord).AdminReason}
                    </Text>
                  )}
                </div>

                <Text weight="semibold" style={{ display: "block", marginBottom: "6px" }}>
                  Required Specification
                </Text>
                <Textarea value={requiredSpec} onChange={(_, d) => setRequiredSpec(d.value)} rows={2} />

                <Text weight="semibold" style={{ display: "block", marginTop: "12px", marginBottom: "6px" }}>
                  Reason for Upgrade
                </Text>
                <Textarea value={reasonForUpgrade} onChange={(_, d) => setReasonForUpgrade(d.value)} rows={2} />

                <Text weight="semibold" style={{ display: "block", marginTop: "12px", marginBottom: "6px" }}>
                  Your Response (Optional)
                </Text>
                <Textarea
                  placeholder="Add any context for your Manager/Admin..."
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

export default UpgradeRequestDetailsPanel;
