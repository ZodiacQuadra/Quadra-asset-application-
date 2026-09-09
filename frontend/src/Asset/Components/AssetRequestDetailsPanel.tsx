import React, { useEffect, useState } from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Text,
  Badge,
  Divider,
  Avatar,
  Field,
  Textarea,
  Dropdown,
  Option,
  Spinner,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  MailRegular,
  BuildingRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ChatRegular,
  CheckmarkCircleFilled,
  HistoryRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import TruncatedText from "../../Common/TruncatedText";
import {
  AssetUserRequestRecord,
  AssetRequestReprogressRecord,
  AssetRequestAdminReprogressRecord,
  AvailableAssetOption,
  getAvailableAssetsForCategory,
  getAssetRequestReprogressHistory,
  getAssetRequestAdminReprogressHistory,
  managerActionOnRequest,
  managerReprogressRequest,
  adminActionOnRequest,
  adminReprogressRequest,
  respondToReprogress,
  respondToAdminReprogress,
  getRequestComponentSpecs,
  AssetComponentSpec,
} from "../Services/AssetInventoryService";
import { REQUEST_STATUS_LABEL, REQUEST_STATUS_COLOR } from "../Utils/requestStatus";

const formatDateTime = (value: string | null | undefined) => (value ? new Date(value).toLocaleString("en-IN") : "-");

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", gap: "16px" }}>
    <Text size={200} style={{ color: "#605E5C", flexShrink: 0 }}>
      {label}
    </Text>
    <TruncatedText text={value} size={200} weight="medium" maxWidth="280px" style={{ textAlign: "right" }} />
  </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text weight="semibold" style={{ display: "block", marginTop: "18px", marginBottom: "4px" }}>
    {children}
  </Text>
);

type DecisionKind = "Approve" | "Override" | "Reject" | "Reprogress";

interface DecisionOptionDef {
  kind: DecisionKind;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}

const OptionCard: React.FC<{
  def: DecisionOptionDef;
  selected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}> = ({ def, selected, onClick, children }) => (
  <div
    onClick={onClick}
    style={{
      border: selected ? `2px solid ${def.accent}` : "1px solid #E1DFDD",
      background: selected ? `${def.accent}0D` : "#FFFFFF",
      borderRadius: "8px",
      padding: "12px 14px",
      cursor: "pointer",
      position: "relative",
      transition: "all 0.15s ease",
    }}
  >
    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
      <div style={{ color: def.accent, fontSize: "20px", marginTop: "2px" }}>{def.icon}</div>
      <div style={{ flex: 1 }}>
        <Text weight="semibold" style={{ color: selected ? def.accent : undefined }}>
          {def.label}
        </Text>
        <br />
        <Text size={200} style={{ color: "#605E5C" }}>
          {def.description}
        </Text>
      </div>
      {selected && <CheckmarkCircleFilled style={{ color: def.accent, fontSize: "18px" }} />}
    </div>
    {selected && children && (
      // Fluent's Dropdown popup is portaled to document.body (via mountNode),
      // but React still bubbles its click events up through the *component*
      // tree, not the DOM tree — so without stopping propagation here,
      // selecting an option also re-fires this card's own onClick above,
      // which calls handleSelect again and immediately resets the selection.
      <div style={{ marginTop: "12px" }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    )}
  </div>
);

interface AssetRequestDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AssetUserRequestRecord | null;
  role: "manager" | "admin" | "employee";
  initialDecision?: DecisionKind | null;
  onActionComplete: () => void;
}

const AssetRequestDetailsPanel: React.FC<AssetRequestDetailsPanelProps> = ({
  open,
  onOpenChange,
  request,
  role,
  initialDecision,
  onActionComplete,
}) => {
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("asset-request-decision-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [selected, setSelected] = useState<DecisionKind | null>(null);
  const [reason, setReason] = useState("");
  const [availableAssets, setAvailableAssets] = useState<AvailableAssetOption[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [reprogressHistory, setReprogressHistory] = useState<AssetRequestReprogressRecord[]>([]);
  const [adminReprogressHistory, setAdminReprogressHistory] = useState<AssetRequestAdminReprogressRecord[]>([]);
  const [employeeResponse, setEmployeeResponse] = useState("");
  const [employeeSubmitting, setEmployeeSubmitting] = useState(false);
  const [historyDialogType, setHistoryDialogType] = useState<"manager" | "admin" | null>(null);
  const [componentSpecs, setComponentSpecs] = useState<AssetComponentSpec[]>([]);

  // Reset decision state and (re)load reprogress history whenever a
  // different request is opened.
  useEffect(() => {
    setSelected(null);
    setReason("");
    setSelectedAssetId(null);
    setAvailableAssets([]);
    setEmployeeResponse("");
    setHistoryDialogType(null);
    setReprogressHistory([]);
    setAdminReprogressHistory([]);
    setComponentSpecs([]);

    if (open && request?.ID) {
      if (initialDecision) {
        const kind = role === "admin" && request.ManagerApprovalStatus !== "Approved" && initialDecision === "Approve" ? "Override" : initialDecision;
        handleSelect(kind);
      }
      Promise.all([getAssetRequestReprogressHistory(request.ID), getAssetRequestAdminReprogressHistory(request.ID)])
        .then(([history, adminHistory]) => {
          setReprogressHistory(history);
          setAdminReprogressHistory(adminHistory);
        })
        .catch(() => {
          // Non-fatal — the rest of the panel still renders without history.
        });
      getRequestComponentSpecs(request.ID)
        .then(setComponentSpecs)
        .catch(() => {
          // Non-fatal — older requests (or categories with no components) just have none.
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request?.ID, initialDecision]);

  const managerApproved = request?.ManagerApprovalStatus === "Approved";
  const isActionable =
    role === "manager"
      ? request?.ManagerApprovalStatus === "Pending"
      : role === "admin"
      ? request?.AdminApprovalStatus === "Pending"
      : false;

  const pendingReprogress = reprogressHistory.find((r) => r.ReprogressStatus === "Pending");
  const pendingAdminReprogress = adminReprogressHistory.find((r) => r.ReprogressStatus === "Pending");

  const approveKind: DecisionKind = role === "admin" && !managerApproved ? "Override" : "Approve";

  const options: DecisionOptionDef[] =
    role === "manager"
      ? [
          { kind: "Approve", label: "Approve", description: "Grant this request", icon: <CheckmarkCircleRegular />, accent: "#107C10" },
          { kind: "Reject", label: "Reject", description: "Decline this request", icon: <DismissCircleRegular />, accent: "#D13438" },
          { kind: "Reprogress", label: "Need More Info", description: "Request clarification from the employee", icon: <ChatRegular />, accent: "#0066B3" },
        ]
      : [
          {
            kind: approveKind,
            label: approveKind === "Override" ? "Override & Complete" : "Approve",
            description:
              approveKind === "Override"
                ? `Bypass Manager approval (status: ${request?.ManagerApprovalStatus}) and issue an asset`
                : "Grant this request and issue an asset",
            icon: <CheckmarkCircleRegular />,
            accent: "#107C10",
          },
          { kind: "Reject", label: "Reject", description: "Decline this request", icon: <DismissCircleRegular />, accent: "#D13438" },
          { kind: "Reprogress", label: "Need More Info", description: "Request clarification from the employee", icon: <ChatRegular />, accent: "#0066B3" },
        ];

  const handleSelect = async (kind: DecisionKind) => {
    setSelected(kind);
    setReason("");
    if ((kind === "Approve" || kind === "Override") && request) {
      try {
        const cat = request.AssetType || (request as any).Category || (request as any).CategoryName || "";
        const assets = await getAvailableAssetsForCategory(cat);
        setAvailableAssets(assets);
        setSelectedAssetId(null);
      } catch (error) {
        dispatchToast(
          <Toast>
            <ToastTitle>{error instanceof Error ? error.message : "Failed to load available assets"}</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      }
    }
  };

  const reasonRequired = selected === "Reject" || selected === "Reprogress";
  const assetRequired = role === "admin" && (selected === "Approve" || selected === "Override");
  const canSubmit = !!selected && (!reasonRequired || reason.trim().length > 0) && (!assetRequired || !!selectedAssetId);

  const handleSubmit = async () => {
    if (!request || !selected || !currentUser?.userID || !canSubmit) return;
    setSubmitting(true);
    try {
      const actor = {
        actedByUserId: currentUser.userID,
        actedByName: currentUser.displayName,
        actedByMail: currentUser.email,
      };

      if (role === "manager") {
        if (selected === "Reprogress") {
          await managerReprogressRequest(request.ID, { reason: reason.trim(), ...actor });
        } else {
          await managerActionOnRequest(request.ID, {
            action: selected as "Approve" | "Reject",
            reason: reason.trim() || undefined,
            ...actor,
          });
        }
      } else if (role === "admin") {
        if (selected === "Reprogress") {
          await adminReprogressRequest(request.ID, { reason: reason.trim(), ...actor });
        } else {
          await adminActionOnRequest(request.ID, {
            action: selected as "Approve" | "Override" | "Reject",
            AssetID: selectedAssetId || undefined,
            reason: reason.trim() || undefined,
            ...actor,
          });
        }
      }

      dispatchToast(
        <Toast>
          <ToastTitle>Decision submitted</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      onActionComplete();
      onOpenChange(false);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to submit decision"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmployeeRespond = async () => {
    if (!request || !currentUser?.userID) return;
    if (!employeeResponse.trim()) {
      dispatchToast(
        <Toast>
          <ToastTitle>Please provide a response before submitting</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }
    setEmployeeSubmitting(true);
    try {
      if (pendingReprogress) {
        await respondToReprogress(pendingReprogress.ID, {
          EmployeeResponse: employeeResponse.trim(),
          respondedByUserId: currentUser.userID,
        });
        dispatchToast(
          <Toast>
            <ToastTitle>Response submitted — sent back to your manager</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else if (pendingAdminReprogress) {
        await respondToAdminReprogress(pendingAdminReprogress.ID, {
          EmployeeResponse: employeeResponse.trim(),
          respondedByUserId: currentUser.userID,
        });
        dispatchToast(
          <Toast>
            <ToastTitle>Response submitted — sent back to Admin</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      }
      onActionComplete();
      onOpenChange(false);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to submit response"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setEmployeeSubmitting(false);
    }
  };

  const renderDecisionSummary = () => {
    if (!request) return null;
    const status = role === "manager" ? request.ManagerApprovalStatus : request.AdminApprovalStatus;
    const decidedBy = role === "manager" ? request.ApprovedManagerName : request.ApprovedAdminName;
    const decidedDate = role === "manager" ? request.ManagerApprovedDate : request.AdminApprovedDate;
    const decidedReason = role === "manager" ? request.ManagerApprovedReason : request.AdminApprovedReason;

    if (status === "Re-Progress") {
      return (
        <Text size={200} style={{ color: "#B8860B" }}>
          Sent back to the requestor for more information — awaiting their response.
        </Text>
      );
    }
    if (status === "Approved") {
      return (
        <>
          <Text size={200} style={{ color: "#107C10" }}>
            Approved{decidedBy ? ` by ${decidedBy}` : ""} on {formatDateTime(decidedDate)}.
          </Text>
          {role === "admin" && request.AssignedAssetName && (
            <Text size={200} style={{ display: "block", marginTop: "4px" }}>
              Issued: {request.AssignedAssetName} ({request.AssignedAssetTagID})
            </Text>
          )}
        </>
      );
    }
    if (status === "Rejected") {
      return (
        <>
          <Text size={200} style={{ color: "#D13438" }}>
            Rejected{decidedBy ? ` by ${decidedBy}` : ""} on {formatDateTime(decidedDate)}.
          </Text>
          {decidedReason && (
            <Text size={200} style={{ display: "block", marginTop: "4px", color: "#605E5C" }}>
              Reason: {decidedReason}
            </Text>
          )}
        </>
      );
    }
    return <Text size={200} style={{ color: "#605E5C" }}>Not yet actionable at this stage.</Text>;
  };

  const renderEmployeeStatus = () => {
    if (!request) return null;
    switch (request.OverallStatus) {
      case "ManagerPending":
        return <Text size={200} style={{ color: "#605E5C" }}>Waiting on your manager's approval.</Text>;
      case "ManagerRejected":
        return (
          <>
            <Text size={200} style={{ color: "#D13438" }}>
              Your manager rejected this request.
            </Text>
            {request.ManagerApprovedReason && (
              <Text size={200} style={{ display: "block", marginTop: "4px", color: "#605E5C" }}>
                Reason: {request.ManagerApprovedReason}
              </Text>
            )}
          </>
        );
      case "AdminApprovalPending":
        return <Text size={200} style={{ color: "#605E5C" }}>Manager approved — waiting on Admin approval.</Text>;
      case "AdminApproved":
        return (
          <>
            <Text size={200} style={{ color: "#107C10" }}>
              Approved{request.AssignedAssetName ? " — asset issued." : "."}
            </Text>
            {request.AssignedAssetName && (
              <Text size={200} style={{ display: "block", marginTop: "4px" }}>
                {request.AssignedAssetName} ({request.AssignedAssetTagID})
              </Text>
            )}
          </>
        );
      case "AdminRejected":
        return (
          <>
            <Text size={200} style={{ color: "#D13438" }}>
              Admin rejected this request.
            </Text>
            {request.AdminApprovedReason && (
              <Text size={200} style={{ display: "block", marginTop: "4px", color: "#605E5C" }}>
                Reason: {request.AdminApprovedReason}
              </Text>
            )}
          </>
        );
      default:
        return null;
    }
  };

  const historyEntries: { key: string; who: string; reason: string | null; date: string | null; status: string; response: string | null }[] =
    historyDialogType === "manager"
      ? reprogressHistory.map((item) => ({
          key: item.ID,
          who: item.ReprogressedManagerName ?? "-",
          reason: item.ManagerReason,
          date: item.ReprogressedDate,
          status: item.ReprogressStatus,
          response: item.EmployeeResponse,
        }))
      : historyDialogType === "admin"
      ? adminReprogressHistory.map((item) => ({
          key: item.ID,
          who: item.ReprogressedAdminName ?? "-",
          reason: item.AdminReason,
          date: item.ReprogressedDate,
          status: item.ReprogressStatus,
          response: item.EmployeeResponse,
        }))
      : [];

  return (
    <>
    <Drawer
      type="overlay"
      separator
      open={open}
      position="end"
      onOpenChange={(_, data) => onOpenChange(data.open)}
      style={{
        width: "min(880px, 80vw)",
        maxWidth: "80vw",
        backgroundColor: "#FFFFFF",
        background: "#FFFFFF",
        boxShadow: "-10px 0 40px rgba(15, 23, 42, 0.18)",
      }}
    >
      <Toaster toasterId={toasterId} />
      {portal}
      <DrawerHeader style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
        <DrawerHeaderTitle
          action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onOpenChange(false)} />}
        >
          Request Details
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody style={{ backgroundColor: "#FFFFFF" }}>
        {request && (
          <div style={{ paddingTop: "8px", paddingBottom: "24px" }}>
            {/* Requestor summary card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
                padding: "18px 20px",
                border: "1px solid #E1DFDD",
                borderRadius: "12px",
                background: "#FAFAFA",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                <Avatar name={request.RequestedByName ?? "?"} size={56} />
                <div style={{ minWidth: 0 }}>
                  <TruncatedText text={request.RequestedByName ?? "Unknown"} weight="semibold" size={500} maxWidth="220px" />
                  <TruncatedText text={request.RequestedByJobTitle} fallback="—" size={200} color="#605E5C" maxWidth="220px" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <div style={{ background: "#EEF1FB", borderRadius: "6px", padding: "6px", color: "#5B5FC7", flexShrink: 0 }}>
                    <MailRegular />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Text size={100} style={{ color: "#605E5C", display: "block" }}>
                      Email
                    </Text>
                    <TruncatedText text={request.RequestedByMail} fallback="-" size={200} weight="medium" maxWidth="200px" />
                  </div>
                </div>
                {request.RequestedByDepartment && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <div style={{ background: "#F3E9FB", borderRadius: "6px", padding: "6px", color: "#8764B8", flexShrink: 0 }}>
                      <BuildingRegular />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <Text size={100} style={{ color: "#605E5C", display: "block" }}>
                        Group
                      </Text>
                      <TruncatedText text={request.RequestedByDepartment} size={200} weight="medium" maxWidth="160px" />
                    </div>
                  </div>
                )}
              </div>
              <Badge appearance="tint" color={REQUEST_STATUS_COLOR[request.OverallStatus]} size="large">
                {REQUEST_STATUS_LABEL[request.OverallStatus]}
              </Badge>
            </div>

            {request.IsAdminOverride && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "10px 12px",
                  borderRadius: "6px",
                  background: "#FFF4CE",
                  border: "1px solid #F2C811",
                }}
              >
                <Text size={200} weight="semibold" style={{ color: "#7A5D00" }}>
                  ⚠ This request was completed by Admin override — the Admin bypassed the normal Manager
                  approval gate (Manager status at the time: {request.ManagerApprovalStatus}).
                </Text>
              </div>
            )}

            {/* Two-column layout: details (left) + decision/response (right) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 360px",
                gap: "28px",
                marginTop: "20px",
                alignItems: "start",
              }}
            >
              {/* Left column */}
              <div>
                <Text size={400} weight="semibold">
                  Asset Request Details
                </Text>
                <SectionTitle>Requested Asset</SectionTitle>
                <Text size={300} style={{ color: "#1E293B", fontWeight: 500 }}>
                  {request.AssetType || (request as any).Category || (request as any).CategoryName || "General IT Asset"}
                </Text>
                <SectionTitle>Purpose of Request</SectionTitle>
                <Text size={300} style={{ display: "block", whiteSpace: "pre-wrap", color: "#334155" }}>
                  {request.PurposeOfRequest || (request as any).Description || "Standard request"}
                </Text>

                {componentSpecs.length > 0 && (
                  <>
                    <SectionTitle>Requested Specifications</SectionTitle>
                    {componentSpecs.map((spec) => (
                      <InfoRow key={spec.ComponentID} label={spec.ComponentName} value={spec.SpecValue ?? "-"} />
                    ))}
                  </>
                )}

                <Divider style={{ margin: "18px 0" }} />

                <Text size={400} weight="semibold">
                  Manager Approval
                </Text>
                <InfoRow label="Assigned Manager" value={request.AssignedManagerName ?? "-"} />
                <InfoRow label="Status" value={request.ManagerApprovalStatus} />
                <InfoRow label="Decided By" value={request.ApprovedManagerName ?? "-"} />
                <InfoRow label="Decision Date" value={formatDateTime(request.ManagerApprovedDate)} />
                {request.ManagerApprovedReason && <InfoRow label="Reason" value={request.ManagerApprovedReason} />}

                <Divider style={{ margin: "18px 0" }} />

                <Text size={400} weight="semibold">
                  Admin Approval
                </Text>
                <InfoRow label="Assigned Admin(s)" value={request.AssignedAdminApproverName ?? "-"} />
                <InfoRow label="Status" value={request.AdminApprovalStatus} />
                <InfoRow label="Decided By" value={request.ApprovedAdminName ?? "-"} />
                <InfoRow label="Decision Date" value={formatDateTime(request.AdminApprovedDate)} />
                {request.AdminApprovedReason && <InfoRow label="Reason" value={request.AdminApprovedReason} />}
                {request.AssignedAssetName && (
                  <InfoRow label="Asset Issued" value={`${request.AssignedAssetName} (${request.AssignedAssetTagID})`} />
                )}
                <InfoRow label="Override Used" value={request.IsAdminOverride ? "Yes" : "No"} />
              </div>

              {/* Right column — Re-progress History (if any) + Make Decision / Resubmit / Status */}
              <div style={{ position: "sticky", top: 0 }}>
                {(reprogressHistory.length > 0 || adminReprogressHistory.length > 0) && (
                  <div style={{ marginBottom: "18px" }}>
                    <Text size={400} weight="semibold" style={{ display: "block", marginBottom: "10px" }}>
                      Re-progress History
                    </Text>
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {reprogressHistory.length > 0 && (
                        <Button
                          appearance="outline"
                          icon={<HistoryRegular />}
                          onClick={() => setHistoryDialogType("manager")}
                        >
                          Reprogressed By Manager
                          <Badge appearance="filled" color="brand" size="small" style={{ marginLeft: "8px" }}>
                            {reprogressHistory.length}
                          </Badge>
                        </Button>
                      )}
                      {adminReprogressHistory.length > 0 && (
                        <Button
                          appearance="outline"
                          icon={<HistoryRegular />}
                          onClick={() => setHistoryDialogType("admin")}
                        >
                          Reprogressed By Admin
                          <Badge appearance="filled" color="brand" size="small" style={{ marginLeft: "8px" }}>
                            {adminReprogressHistory.length}
                          </Badge>
                        </Button>
                      )}
                    </div>
                    <Divider style={{ margin: "18px 0 0" }} />
                  </div>
                )}
                {role === "employee" ? (
                  pendingReprogress || pendingAdminReprogress ? (
                    <>
                      <Text size={400} weight="semibold" style={{ display: "block", marginBottom: "12px", color: "#B8860B" }}>
                        {pendingReprogress ? "Your manager needs more information" : "Admin needs more information"}
                      </Text>
                      <div style={{ border: "1px solid #F2C811", background: "#FFF4CE", borderRadius: "8px", padding: "12px" }}>
                        <Text size={200}>
                          Reason: {pendingReprogress ? pendingReprogress.ManagerReason : pendingAdminReprogress?.AdminReason}
                        </Text>
                      </div>
                      <Field label="Your Response" required style={{ marginTop: "14px" }}>
                        <Textarea
                          placeholder={`Provide clarification or updated details for ${pendingReprogress ? "your manager" : "Admin"}...`}
                          value={employeeResponse}
                          onChange={(_, d) => setEmployeeResponse(d.value)}
                          rows={5}
                        />
                      </Field>
                      <Text size={100} style={{ display: "block", marginTop: "6px", color: "#605E5C" }}>
                        {pendingReprogress
                          ? "Resubmitting sends this back to your Manager for approval."
                          : "Resubmitting sends this straight back to Admin — no need to go through Manager approval again."}
                      </Text>
                      <Button
                        appearance="primary"
                        style={{ width: "100%", marginTop: "12px" }}
                        disabled={employeeSubmitting}
                        onClick={handleEmployeeRespond}
                      >
                        {employeeSubmitting ? <Spinner size="tiny" /> : "Resubmit Request"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Text size={400} weight="semibold" style={{ display: "block", marginBottom: "12px" }}>
                        Status
                      </Text>
                      <div style={{ border: "1px solid #E1DFDD", borderRadius: "8px", padding: "14px" }}>{renderEmployeeStatus()}</div>
                    </>
                  )
                ) : (
                  <>
                    <Text size={400} weight="semibold" style={{ display: "block", marginBottom: "12px" }}>
                      {isActionable ? "Make Decision" : "Decision"}
                    </Text>

                    {!isActionable ? (
                      <div style={{ border: "1px solid #E1DFDD", borderRadius: "8px", padding: "14px" }}>{renderDecisionSummary()}</div>
                    ) : (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {options.map((opt) => (
                            <OptionCard key={opt.kind} def={opt} selected={selected === opt.kind} onClick={() => handleSelect(opt.kind)}>
                              {role === "admin" && (opt.kind === "Approve" || opt.kind === "Override") && (
                                <Dropdown
                                  placeholder="Choose an available asset"
                                  mountNode={mountNode}
                                  value={availableAssets.find((a) => a.ID === selectedAssetId)?.AssetName ?? ""}
                                  onOptionSelect={(_, d) => setSelectedAssetId(d.optionValue ?? null)}
                                >
                                  {availableAssets.length === 0 ? (
                                    <Option key="none" value="" disabled>
                                      No in-stock assets available for this category
                                    </Option>
                                  ) : (
                                    availableAssets.map((asset) => (
                                      <Option key={asset.ID} value={asset.ID} text={asset.AssetName}>
                                        {asset.AssetName} ({asset.AssetTagID})
                                      </Option>
                                    ))
                                  )}
                                </Dropdown>
                              )}
                            </OptionCard>
                          ))}
                        </div>

                        {selected && (
                          <Field
                            label={selected === "Reject" ? "Reason for rejection" : selected === "Reprogress" ? "What information is needed?" : "Notes (optional)"}
                            required={reasonRequired}
                            style={{ marginTop: "14px" }}
                          >
                            <Textarea value={reason} onChange={(_, d) => setReason(d.value)} rows={4} />
                          </Field>
                        )}

                        <Divider style={{ margin: "16px 0" }} />

                        <Button appearance="primary" style={{ width: "100%" }} disabled={!canSubmit || submitting} onClick={handleSubmit}>
                          {submitting ? <Spinner size="tiny" /> : "Submit Decision"}
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </DrawerBody>
    </Drawer>

    <Dialog open={!!historyDialogType} onOpenChange={(_, d) => !d.open && setHistoryDialogType(null)}>
      <DialogSurface mountNode={mountNode}>
        <DialogBody>
          <DialogTitle>
            {historyDialogType === "manager" ? "Reprogressed By Manager" : "Reprogressed By Admin"}
            {historyEntries.length > 1 ? ` (${historyEntries.length} times)` : ""}
          </DialogTitle>
          <DialogContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {historyEntries.map((entry, index) => (
                <div
                  key={entry.key}
                  style={{
                    border: "1px solid #E1DFDD",
                    borderRadius: "8px",
                    padding: "14px",
                    background: entry.status === "Pending" ? "#FFF9EE" : "#FAFAFA",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <Text weight="semibold">
                      #{historyEntries.length - index} — {entry.who}
                    </Text>
                    <Badge appearance="tint" color={entry.status === "Pending" ? "warning" : "success"} size="small">
                      {entry.status === "Pending" ? "Awaiting Response" : "Responded"}
                    </Badge>
                  </div>
                  <InfoRow label="Date" value={formatDateTime(entry.date)} />
                  <InfoRow label="Reason" value={entry.reason ?? "-"} />
                  {entry.response ? (
                    <InfoRow label="Employee Response" value={entry.response} />
                  ) : (
                    <InfoRow label="Employee Response" value="Not yet responded" />
                  )}
                </div>
              ))}
              {historyEntries.length === 0 && <Text size={200} style={{ color: "#605E5C" }}>No history found.</Text>}
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => setHistoryDialogType(null)}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
    </>
  );
};

export default AssetRequestDetailsPanel;
