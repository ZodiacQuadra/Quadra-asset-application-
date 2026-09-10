import React, { useEffect, useState } from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Text,
  Badge,
  Spinner,
  Textarea,
  Field,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  DeveloperBoardRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ChatRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import {
  AssetUpgradeRequestRecord,
  getUpgradeReprogressHistory,
  getUpgradeAdminReprogressHistory,
  respondToUpgradeReprogress,
  respondToUpgradeAdminReprogress,
  adminActionOnUpgradeRequest,
  managerActionOnUpgradeRequest,
  adminReprogressUpgradeRequest,
  managerReprogressUpgradeRequest,
  UpgradeManagerReprogressRecord,
  UpgradeAdminReprogressRecord,
} from "../Services/AssetUpgradeRequestService";
import {
  DecisionContainer,
  DecisionOptionDef,
  DecisionSummaryCard,
  DrawerTopIdentityCard,
  InfoCardGroup,
  InfoRow,
  OptionCard,
} from "./RequestDrawerComponents";

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

type DecisionKind = "Approve" | "Override" | "Reject" | "Reprogress";

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

export const UpgradeRequestDetailsPanel: React.FC<UpgradeRequestDetailsPanelProps> = ({
  open,
  onOpenChange,
  request,
  role = "admin",
  onRespondComplete,
  onActionComplete,
}) => {
  const { currentUser } = useAuth();
  const { portal } = useThemedMountNode();
  const toasterId = useId("upgrade-request-details-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const canManagerAct = role === "manager" && request?.ManagerApprovalStatus === "Pending";
  const canAdminAct =
    role === "admin" &&
    (request?.AdminApprovalStatus === "Pending" ||
      request?.ReqStatus === "Pending" ||
      request?.ReqStatus === "AdminApprovalPending");
  const isActionable = canManagerAct || canAdminAct;
  const isOverrideNeeded = canAdminAct && request?.ManagerApprovalStatus !== "Approved";

  const [selected, setSelected] = useState<DecisionKind | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isManagerReprogress = request?.ReqStatus === "ManagerReprogress";
  const isAdminReprogress = request?.ReqStatus === "AdminReprogress";
  const needsEmployeeResponse = role === "employee" && (isManagerReprogress || isAdminReprogress);

  const [pendingReprogress, setPendingReprogress] = useState<UpgradeManagerReprogressRecord | UpgradeAdminReprogressRecord | null>(null);
  const [employeeResponse, setEmployeeResponse] = useState("");
  const [submittingResponse, setSubmittingResponse] = useState(false);

  useEffect(() => {
    setSelected(null);
    setReason("");
    setPendingReprogress(null);
    setEmployeeResponse("");
    if (!open || !request) return;

    if (needsEmployeeResponse) {
      const loader = isManagerReprogress ? getUpgradeReprogressHistory : getUpgradeAdminReprogressHistory;
      loader(request.ID)
        .then((history) => setPendingReprogress(history.find((h) => h.ReprogressStatus === "Pending") ?? null))
        .catch(() => {});
    }
  }, [open, request?.ID, request?.ReqStatus, needsEmployeeResponse, isManagerReprogress]);

  const approveKind: DecisionKind = isOverrideNeeded ? "Override" : "Approve";

  const options: DecisionOptionDef[] = [
    {
      kind: approveKind,
      label: approveKind === "Override" ? "Admin Override & Approve" : "Approve Hardware Upgrade",
      description:
        approveKind === "Override"
          ? `Bypass Manager review (currently ${request?.ManagerApprovalStatus}) and authorize hardware upgrade`
          : "Authorize component installation and mark request as approved",
      icon: <CheckmarkCircleRegular />,
      accent: approveKind === "Override" ? "#007ED5" : "#059669",
      iconBg: approveKind === "Override" ? "#EFF6FF" : "#ECFDF5",
      activeBg: approveKind === "Override" ? "#EFF6FF" : "#F0FDF4",
      activeBorder: approveKind === "Override" ? "#007ED5" : "#10B981",
    },
    {
      kind: "Reject",
      label: "Reject Requisition",
      description: "Decline upgrade request with official justification",
      icon: <DismissCircleRegular />,
      accent: "#DC2626",
      iconBg: "#FEF2F2",
      activeBg: "#FEF2F2",
      activeBorder: "#EF4444",
    },
    {
      kind: "Reprogress",
      label: "Request Information",
      description: "Send inquiry back to custodian before making a determination",
      icon: <ChatRegular />,
      accent: "#D97706",
      iconBg: "#FFFBEB",
      activeBg: "#FFFBEB",
      activeBorder: "#F59E0B",
    },
  ];

  const reasonRequired = selected === "Reject" || selected === "Reprogress";
  const canSubmit = !!selected && (!reasonRequired || reason.trim().length > 0);

  const handleSubmit = async () => {
    if (!request || !selected || !currentUser?.userID || !canSubmit) return;
    setSubmitting(true);
    try {
      if (role === "admin") {
        if (selected === "Reprogress") {
          await adminReprogressUpgradeRequest(request.ID, reason.trim(), currentUser.userID, currentUser.displayName, currentUser.email);
        } else {
          await adminActionOnUpgradeRequest(
            request.ID,
            selected === "Override" ? "Approve" : selected,
            currentUser.userID,
            currentUser.displayName,
            currentUser.email,
            reason.trim() || undefined,
            selected === "Override"
          );
        }
      } else if (role === "manager") {
        if (selected === "Reprogress") {
          await managerReprogressUpgradeRequest(request.ID, reason.trim(), currentUser.userID, currentUser.displayName, currentUser.email);
        } else {
          await managerActionOnUpgradeRequest(
            request.ID,
            selected as "Approve" | "Reject",
            currentUser.userID,
            currentUser.displayName,
            currentUser.email,
            reason.trim() || undefined
          );
        }
      }

      dispatchToast(
        <Toast>
          <ToastTitle>Upgrade decision recorded successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      onActionComplete?.();
      onOpenChange(false);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to record decision"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEmployeeResponse = async () => {
    if (!request || !currentUser?.userID || !pendingReprogress || !employeeResponse.trim()) return;
    setSubmittingResponse(true);
    try {
      const payload = {
        EmployeeResponse: employeeResponse.trim(),
        RequiredSpecfication: request.RequiredSpecfication,
        ReasonForUpgrade: request.ReasonForUpgrade ?? "",
      };
      if (isManagerReprogress) {
        await respondToUpgradeReprogress(pendingReprogress.ID, currentUser.userID, payload);
      } else {
        await respondToUpgradeAdminReprogress(pendingReprogress.ID, currentUser.userID, payload);
      }
      dispatchToast(
        <Toast>
          <ToastTitle>Clarification submitted successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      onRespondComplete?.();
      onActionComplete?.();
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
      style={{
        width: "min(1140px, 96vw)",
        maxWidth: "96vw",
        backgroundColor: "#FFFFFF",
        background: "#FFFFFF",
        boxShadow: "-10px 0 40px rgba(15, 23, 42, 0.18)",
      }}
    >
      <Toaster toasterId={toasterId} />
      {portal}

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
              <DeveloperBoardRegular style={{ fontSize: 18 }} />
            </div>
            <div>
              <Text weight="bold" style={{ color: "#0F172A", fontSize: "15px", display: "block" }}>
                Upgrade Request Details
              </Text>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Component specification upgrade review and authorization
              </span>
            </div>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody style={{ backgroundColor: "#FFFFFF", padding: "20px 24px" }}>
        {request && (
          <div style={{ paddingTop: "4px", paddingBottom: "24px" }}>
            <DrawerTopIdentityCard
              name={request.RequestedByName || "Employee Custodian"}
              jobTitle={request.CategoryName ? `${request.CategoryName} Custodian` : "Staff Member"}
              email={request.RequestedByEmail}
              department={request.RequestedByDepartment || "Engineering"}
              status={STATUS_LABEL[request.ReqStatus] ?? request.ReqStatus}
              statusColor={STATUS_COLOR[request.ReqStatus] || "informative"}
            />

            {request.IsAdminOverride && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#FFF4CE",
                  border: "1px solid #F2C811",
                }}
              >
                <Text size={200} weight="semibold" style={{ color: "#7A5D00" }}>
                  ⚠ This request was completed by Admin override — Manager approval was bypassed.
                </Text>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.65fr) minmax(360px, 1fr)",
                gap: "24px",
                marginTop: "18px",
                alignItems: "start",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <InfoCardGroup title="Hardware Component Target">
                  <div style={{ padding: "8px 0" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                      {request.CategoryName} — {request.ComponentDisplayName}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                      Requisition: <strong>{request.RequestNumber || request.ID}</strong>
                    </div>
                  </div>
                </InfoCardGroup>

                <InfoCardGroup title="Specification Change">
                  <InfoRow label="Current Specification" value={request.CurrentSpecification || "Standard base configuration"} />
                  <InfoRow label="Requested Specification" value={request.RequiredSpecfication || "Enhanced hardware upgrade"} />
                  <InfoRow label="Requested Date" value={formatDateTime(request.RequestedDate ?? request.CreatedAt)} hasDivider={false} />
                </InfoCardGroup>

                {request.ReasonForUpgrade && (
                  <InfoCardGroup title="Reason for Upgrade">
                    <div style={{ padding: "8px 0", fontSize: "13.5px", color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {request.ReasonForUpgrade}
                    </div>
                  </InfoCardGroup>
                )}

                <InfoCardGroup title="Manager Review Gate">
                  <InfoRow label="Assigned Manager" value={request.ManagerName ?? "Engineering Lead"} />
                  <InfoRow label="Manager Status" value={<Badge appearance="tint" color={request.ManagerApprovalStatus === "Approved" ? "success" : request.ManagerApprovalStatus === "Rejected" ? "danger" : "warning"}>{request.ManagerApprovalStatus}</Badge>} />
                  <InfoRow label="Decision Date" value={formatDateTime(request.ManagerApprovedDate)} hasDivider={false} />
                </InfoCardGroup>

                <InfoCardGroup title="Admin Fulfillment Gate">
                  <InfoRow label="Assigned Admin" value={request.AssignedAdminName ?? "Local Asset Administrator"} />
                  <InfoRow label="Admin Status" value={<Badge appearance="tint" color={request.AdminApprovalStatus === "Approved" ? "success" : request.AdminApprovalStatus === "Rejected" ? "danger" : "warning"}>{request.AdminApprovalStatus}</Badge>} />
                  <InfoRow label="Approved By" value={request.ApprovedAdminName ?? "-"} />
                  <InfoRow label="Decision Date" value={formatDateTime(request.ApprovedAdminDate)} />
                  <InfoRow label="Admin Override Used" value={request.IsAdminOverride ? "Yes" : "No"} hasDivider={false} />
                </InfoCardGroup>
              </div>

              <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                {needsEmployeeResponse ? (
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "16px", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#92400E" }}>
                      Clarification Required
                    </div>
                    <div style={{ border: "1px solid #FDE68A", background: "#FFFBEB", borderRadius: "10px", padding: "12px", fontSize: "13px", color: "#92400E" }}>
                      Reviewer Reason: {pendingReprogress?.ManagerReason || (pendingReprogress as any)?.AdminReason || "Please provide additional specification justification."}
                    </div>
                    <Field label="Your Response" required>
                      <Textarea
                        placeholder="Provide details or updated justification..."
                        value={employeeResponse}
                        onChange={(_, d) => setEmployeeResponse(d.value)}
                        rows={4}
                      />
                    </Field>
                    <Button
                      appearance="primary"
                      disabled={submittingResponse || !employeeResponse.trim()}
                      onClick={handleSubmitEmployeeResponse}
                      style={{ background: "#007ED5", borderRadius: "20px", height: "38px" }}
                    >
                      {submittingResponse ? <Spinner size="tiny" /> : "Resubmit Upgrade Request"}
                    </Button>
                  </div>
                ) : (
                  <DecisionContainer
                    isActionable={isActionable}
                    title={isActionable ? "Make Decision" : "Decision Record"}
                    subtitle={
                      isActionable
                        ? role === "admin"
                          ? "Authorize upgrade & resolve requisition"
                          : "Review & approve team hardware upgrade"
                        : "Official determination summary"
                    }
                  >
                    {!isActionable ? (
                      <DecisionSummaryCard
                        status={STATUS_LABEL[request.ReqStatus] ?? request.ReqStatus}
                        decidedBy={request.ApprovedAdminName || request.ManagerName}
                        decidedDate={request.ApprovedAdminDate || request.ManagerApprovedDate}
                        isApproved={request.ReqStatus === "Completed" || request.AdminApprovalStatus === "Approved"}
                        isRejected={request.ReqStatus === "Rejected" || request.AdminApprovalStatus === "Rejected"}
                        extraDetails={[
                          { label: "Target Component", value: `${request.CategoryName} · ${request.ComponentDisplayName}` },
                          { label: "New Specification", value: request.RequiredSpecfication },
                        ]}
                      />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {isOverrideNeeded && (
                          <div style={{ padding: "10px 12px", borderRadius: "8px", background: "#FFFBEB", border: "1px solid #FDE68A", fontSize: "12px", color: "#92400E" }}>
                            ⚠ Manager review is currently {request.ManagerApprovalStatus}. Approving will execute an Admin override.
                          </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {options.map((opt) => (
                            <OptionCard
                              key={opt.kind}
                              def={opt}
                              selected={selected === opt.kind}
                              onClick={() => {
                                setSelected(opt.kind);
                                setReason("");
                              }}
                            />
                          ))}
                        </div>

                        {selected && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "2px" }}>
                            <label style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>
                              {selected === "Reject"
                                ? "Rejection Justification *"
                                : selected === "Reprogress"
                                ? "Specification Inquiry to Custodian *"
                                : "Installation / Fulfillment Notes (Optional)"}
                            </label>
                            <Textarea
                              placeholder={
                                selected === "Reject"
                                  ? "Provide official reason for declining hardware upgrade..."
                                  : selected === "Reprogress"
                                  ? "Enter questions regarding specifications or workload justification..."
                                  : "e.g. Authorized upgrade. Hardware staged in local IT inventory..."
                              }
                              value={reason}
                              onChange={(_, d) => setReason(d.value)}
                              rows={selected === "Reject" || selected === "Reprogress" ? 3 : 2}
                            />
                          </div>
                        )}

                        <Button
                          appearance="primary"
                          disabled={!canSubmit || submitting}
                          onClick={handleSubmit}
                          style={{
                            width: "100%",
                            borderRadius: "20px",
                            height: "40px",
                            fontSize: "14px",
                            fontWeight: 600,
                            background: selected === "Reject" ? "#DC2626" : selected === "Reprogress" ? "#D97706" : "#007ED5",
                            borderColor: selected === "Reject" ? "#DC2626" : selected === "Reprogress" ? "#D97706" : "#007ED5",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
                            marginTop: "6px",
                          }}
                        >
                          {submitting ? (
                            <Spinner size="tiny" />
                          ) : selected === "Reject" ? (
                            "Reject Upgrade"
                          ) : selected === "Reprogress" ? (
                            "Send Back for Inquiry"
                          ) : approveKind === "Override" ? (
                            "Confirm Admin Override"
                          ) : (
                            "Approve Upgrade"
                          )}
                        </Button>
                      </div>
                    )}
                  </DecisionContainer>
                )}
              </div>
            </div>
          </div>
        )}
      </DrawerBody>
    </Drawer>
  );
};

export default UpgradeRequestDetailsPanel;

