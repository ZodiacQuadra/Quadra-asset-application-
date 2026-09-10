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
  ShieldCheckmarkRegular,
  BoxRegular,
  ClockRegular,
  WarningRegular,
  ClipboardTaskListLtrRegular,
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
  iconBg: string;
  activeBg: string;
  activeBorder: string;
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
      border: selected ? `2px solid ${def.activeBorder}` : "1.5px solid #E2E8F0",
      background: selected ? def.activeBg : "#FFFFFF",
      borderRadius: "14px",
      padding: "14px 16px",
      cursor: "pointer",
      position: "relative",
      boxShadow: selected ? `0 4px 16px ${def.accent}1F` : "0 1px 3px rgba(0, 0, 0, 0.02)",
      transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
    }}
  >
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          background: selected ? def.accent : def.iconBg,
          color: selected ? "#FFFFFF" : def.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          flexShrink: 0,
          transition: "all 0.15s ease",
        }}
      >
        {def.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <Text weight="bold" size={300} style={{ color: selected ? def.accent : "#1E293B" }}>
            {def.label}
          </Text>
          {selected ? (
            <CheckmarkCircleFilled style={{ color: def.accent, fontSize: "18px", flexShrink: 0 }} />
          ) : (
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "1.5px solid #CBD5E1",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
          )}
        </div>
        <Text size={200} style={{ color: "#64748B", display: "block", marginTop: "3px", lineHeight: 1.35 }}>
          {def.description}
        </Text>
      </div>
    </div>
    {selected && children && (
      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: `1px dashed ${def.accent}40`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
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
          {
            kind: "Approve",
            label: "Approve Request",
            description: "Grant approval and forward to IT Admin for hardware fulfillment",
            icon: <CheckmarkCircleRegular />,
            accent: "#059669",
            iconBg: "#ECFDF5",
            activeBg: "#F0FDF4",
            activeBorder: "#10B981",
          },
          {
            kind: "Reject",
            label: "Reject Requisition",
            description: "Decline this request with official justification",
            icon: <DismissCircleRegular />,
            accent: "#DC2626",
            iconBg: "#FEF2F2",
            activeBg: "#FEF2F2",
            activeBorder: "#EF4444",
          },
          {
            kind: "Reprogress",
            label: "Request Information",
            description: "Ask the employee for more specifications or justification",
            icon: <ChatRegular />,
            accent: "#D97706",
            iconBg: "#FFFBEB",
            activeBg: "#FFFBEB",
            activeBorder: "#F59E0B",
          },
        ]
      : [
          {
            kind: approveKind,
            label: approveKind === "Override" ? "Admin Override & Issue" : "Approve & Issue Asset",
            description:
              approveKind === "Override"
                ? `Bypass Manager review (currently ${request?.ManagerApprovalStatus}) and allocate equipment immediately`
                : "Approve request and allocate in-stock equipment from inventory",
            icon: <CheckmarkCircleRegular />,
            accent: approveKind === "Override" ? "#007ED5" : "#059669",
            iconBg: approveKind === "Override" ? "#EFF6FF" : "#ECFDF5",
            activeBg: approveKind === "Override" ? "#EFF6FF" : "#F0FDF4",
            activeBorder: approveKind === "Override" ? "#007ED5" : "#10B981",
          },
          {
            kind: "Reject",
            label: "Reject Requisition",
            description: "Decline this request and notify custodian",
            icon: <DismissCircleRegular />,
            accent: "#DC2626",
            iconBg: "#FEF2F2",
            activeBg: "#FEF2F2",
            activeBorder: "#EF4444",
          },
          {
            kind: "Reprogress",
            label: "Request Information",
            description: "Send questions back to employee before deciding",
            icon: <ChatRegular />,
            accent: "#D97706",
            iconBg: "#FFFBEB",
            activeBg: "#FFFBEB",
            activeBorder: "#F59E0B",
          },
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

    const isApproved = status === "Approved";
    const isRejected = status === "Rejected";

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          background: isApproved ? "#F0FDF4" : isRejected ? "#FEF2F2" : "#FFFBEB",
          border: isApproved ? "1.5px solid #BBF7D0" : isRejected ? "1.5px solid #FECACA" : "1.5px solid #FDE68A",
          borderRadius: "14px",
          padding: "16px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: isApproved ? "#16A34A" : isRejected ? "#DC2626" : "#D97706",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "16px",
                flexShrink: 0,
              }}
            >
              {isApproved ? <CheckmarkCircleFilled /> : isRejected ? <DismissCircleRegular /> : <ClockRegular />}
            </div>
            <div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "14.5px",
                  color: isApproved ? "#166534" : isRejected ? "#991B1B" : "#92400E",
                  display: "block",
                  lineHeight: 1.2,
                }}
              >
                {isApproved ? "Approved & Fulfillable" : isRejected ? "Request Rejected" : "Awaiting Clarification"}
              </span>
              <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                {isApproved ? "Inventory allocation confirmed" : isRejected ? "Formal rejection recorded" : "Pending employee response"}
              </span>
            </div>
          </div>
          <Badge appearance="filled" color={isApproved ? "success" : isRejected ? "danger" : "warning"} size="medium">
            {status}
          </Badge>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
          {decidedBy && (
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" }}>
              <span style={{ color: "#64748B" }}>Decided By</span>
              <span style={{ fontWeight: 600, color: "#1E293B" }}>{decidedBy}</span>
            </div>
          )}
          {decidedDate && (
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" }}>
              <span style={{ color: "#64748B" }}>Decision Date</span>
              <span style={{ fontWeight: 500, color: "#1E293B" }}>{formatDateTime(decidedDate)}</span>
            </div>
          )}
          {request.AssignedAssetName && (
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" }}>
              <span style={{ color: "#64748B" }}>Issued Hardware</span>
              <span style={{ fontWeight: 700, color: "#15803D" }}>
                {request.AssignedAssetName} ({request.AssignedAssetTagID})
              </span>
            </div>
          )}
          {request.IsAdminOverride && (
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" }}>
              <span style={{ color: "#64748B" }}>Admin Override</span>
              <span style={{ fontWeight: 700, color: "#007ED5" }}>Yes (Manager Bypassed)</span>
            </div>
          )}
          {decidedReason && (
            <div style={{ marginTop: "4px", padding: "10px 12px", borderRadius: "8px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
              <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Official Resolution Notes
              </span>
              <span style={{ color: "#334155", fontSize: "12.5px", marginTop: "3px", display: "block", lineHeight: 1.4 }}>
                {decidedReason}
              </span>
            </div>
          )}
        </div>
      </div>
    );
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
                width: 32,
                height: 32,
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
              <ClipboardTaskListLtrRegular style={{ fontSize: 18 }} />
            </div>
            <div>
              <Text weight="bold" style={{ color: "#0F172A", fontSize: "15px" }}>
                Request Details
              </Text>
            </div>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody style={{ backgroundColor: "#FFFFFF", padding: "20px 24px" }}>
        {request && (
          <div style={{ paddingTop: "4px", paddingBottom: "24px" }}>
            {/* Requestor summary card */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
                padding: "16px 18px",
                border: "1px solid #E2E8F0",
                borderRadius: "14px",
                background: "#F8FAFC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                <Avatar name={request.RequestedByName ?? "?"} size={48} />
                <div style={{ minWidth: 0 }}>
                  <TruncatedText text={request.RequestedByName ?? "Unknown"} weight="semibold" size={400} maxWidth="260px" />
                  <TruncatedText text={request.RequestedByJobTitle} fallback="—" size={200} color="#605E5C" maxWidth="260px" />
                </div>
              </div>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                  <div style={{ background: "#EFF6FF", borderRadius: "6px", padding: "6px", color: "#007ED5", flexShrink: 0 }}>
                    <MailRegular />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <Text size={100} style={{ color: "#605E5C", display: "block" }}>
                      Email
                    </Text>
                    <Text size={200} weight="medium" style={{ color: "#1E293B" }}>
                      {request.RequestedByMail || "-"}
                    </Text>
                  </div>
                </div>
                {request.RequestedByDepartment && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <div style={{ background: "#EFF6FF", borderRadius: "6px", padding: "6px", color: "#007ED5", flexShrink: 0 }}>
                      <BuildingRegular />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <Text size={100} style={{ color: "#605E5C", display: "block" }}>
                        Group
                      </Text>
                      <Text size={200} weight="medium" style={{ color: "#1E293B" }}>
                        {request.RequestedByDepartment}
                      </Text>
                    </div>
                  </div>
                )}
                <Badge appearance="tint" color={REQUEST_STATUS_COLOR[request.OverallStatus]} size="medium">
                  {REQUEST_STATUS_LABEL[request.OverallStatus]}
                </Badge>
              </div>
            </div>

            {request.IsAdminOverride && (
              <div
                style={{
                  marginTop: "14px",
                  padding: "10px 14px",
                  borderRadius: "8px",
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

            {/* Split Info (~65%) + Decision (~35%) layout */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1.65fr) minmax(360px, 1fr)",
                gap: "24px",
                marginTop: "18px",
                alignItems: "start",
              }}
            >
              {/* Asset Details — card grouped */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                {/* Requested Asset */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>Requested Asset</div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 16px", fontSize: "13.5px", color: "#1E293B", fontWeight: 500 }}>
                    {request.AssetType || (request as any).Category || (request as any).CategoryName || "General IT Asset"}
                  </div>
                </div>

                {/* Purpose of Request */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>Purpose of Request</div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "12px 16px", fontSize: "13.5px", color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {request.PurposeOfRequest || (request as any).Description || "Standard request"}
                  </div>
                </div>

                {/* Requested Specifications */}
                {componentSpecs.length > 0 && (
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "10px" }}>Requested Specifications</div>
                    <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "4px 16px" }}>
                      {componentSpecs.map((spec) => (
                        <InfoRow key={spec.ComponentID} label={spec.ComponentName} value={spec.SpecValue ?? "-"} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Manager Approval */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "10px" }}>Manager Approval</div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "4px 16px" }}>
                    <InfoRow label="Assigned Manager" value={request.AssignedManagerName ?? "-"} />
                    <InfoRow label="Status" value={request.ManagerApprovalStatus} />
                    <InfoRow label="Decided By" value={request.ApprovedManagerName ?? "-"} />
                    <InfoRow label="Decision Date" value={formatDateTime(request.ManagerApprovedDate)} />
                    {request.ManagerApprovedReason && <InfoRow label="Reason" value={request.ManagerApprovedReason} />}
                  </div>
                </div>

                {/* Admin Approval */}
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "10px" }}>Admin Approval</div>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: "4px 16px" }}>
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
                </div>

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
                  <div
                    style={{
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                      borderRadius: "16px",
                      padding: "20px 22px",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: "10px",
                            background: isActionable ? "#EEF6FF" : "#F1F5F9",
                            color: isActionable ? "#007ED5" : "#64748B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 19,
                            flexShrink: 0,
                          }}
                        >
                          <ShieldCheckmarkRegular />
                        </div>
                        <div>
                          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
                            {isActionable ? "Make Decision" : "Decision Record"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                            {isActionable
                              ? role === "admin"
                                ? "Allocate equipment & resolve request"
                                : "Review & approve request"
                              : "Official determination summary"}
                          </div>
                        </div>
                      </div>
                      {isActionable && (
                        <span
                          style={{
                            background: "#FEF3C7",
                            color: "#B45309",
                            border: "1px solid #FDE68A",
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: 999,
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                          }}
                        >
                          Action Required
                        </span>
                      )}
                    </div>

                    {!isActionable ? (
                      renderDecisionSummary()
                    ) : (
                      <>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {options.map((opt) => (
                            <OptionCard
                              key={opt.kind}
                              def={opt}
                              selected={selected === opt.kind}
                              onClick={() => handleSelect(opt.kind)}
                            >
                              {role === "admin" && (opt.kind === "Approve" || opt.kind === "Override") && (
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                      Assign From Inventory
                                    </span>
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        fontWeight: 600,
                                        background: availableAssets.length > 0 ? "#DCFCE7" : "#FEE2E2",
                                        color: availableAssets.length > 0 ? "#15803D" : "#B91C1C",
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                      }}
                                    >
                                      {availableAssets.length} In Stock
                                    </span>
                                  </div>

                                  <Dropdown
                                    placeholder="Choose an available asset..."
                                    mountNode={mountNode}
                                    value={
                                      availableAssets.find((a) => a.ID === selectedAssetId)
                                        ? `${availableAssets.find((a) => a.ID === selectedAssetId)?.AssetName} (${availableAssets.find((a) => a.ID === selectedAssetId)?.AssetTagID})`
                                        : ""
                                    }
                                    onOptionSelect={(_, d) => setSelectedAssetId(d.optionValue ?? null)}
                                    style={{ width: "100%" }}
                                  >
                                    {availableAssets.length === 0 ? (
                                      <Option key="none" value="" disabled>
                                        No in-stock assets available for this category
                                      </Option>
                                    ) : (
                                      availableAssets.map((asset) => (
                                        <Option key={asset.ID} value={asset.ID} text={`${asset.AssetName} (${asset.AssetTagID})`}>
                                          {asset.AssetName} · {asset.AssetTagID}
                                        </Option>
                                      ))
                                    )}
                                  </Dropdown>

                                  {selectedAssetId && (
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "11.5px", color: "#059669", fontWeight: 500 }}>
                                      <CheckmarkCircleRegular style={{ fontSize: 14 }} />
                                      <span>Hardware selected and ready for dispatch</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </OptionCard>
                          ))}
                        </div>

                        {selected && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                            <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#334155" }}>
                              {selected === "Reject"
                                ? "Reason for Rejection *"
                                : selected === "Reprogress"
                                ? "Information Needed from Employee *"
                                : "Decision Notes & Dispatch Instructions"}
                            </label>
                            <Textarea
                              placeholder={
                                selected === "Reject"
                                  ? "Provide a formal reason for declining this request..."
                                  : selected === "Reprogress"
                                  ? "Specify what details or specifications are required..."
                                  : "Optional delivery notes or configuration instructions..."
                              }
                              value={reason}
                              onChange={(_, d) => setReason(d.value)}
                              rows={3}
                              style={{ width: "100%", borderRadius: "8px" }}
                            />
                          </div>
                        )}

                        <Divider style={{ margin: "4px 0" }} />

                        <Button
                          appearance="primary"
                          style={{
                            width: "100%",
                            height: "44px",
                            borderRadius: "25px",
                            fontWeight: 700,
                            fontSize: "14px",
                            background: !selected
                              ? "#94A3B8"
                              : selected === "Approve"
                              ? "#059669"
                              : selected === "Override"
                              ? "#007ED5"
                              : selected === "Reprogress"
                              ? "#D97706"
                              : "#DC2626",
                            borderColor: "transparent",
                            color: "#FFFFFF",
                            boxShadow: selected ? "0 4px 14px rgba(0, 0, 0, 0.12)" : "none",
                            transition: "all 0.15s ease",
                            cursor: canSubmit ? "pointer" : "not-allowed",
                          }}
                          disabled={!canSubmit || submitting}
                          onClick={handleSubmit}
                        >
                          {submitting ? (
                            <Spinner size="tiny" />
                          ) : !selected ? (
                            "Select a Decision Above"
                          ) : selected === "Approve" ? (
                            "Confirm & Issue Asset"
                          ) : selected === "Override" ? (
                            "Override & Issue Asset"
                          ) : selected === "Reprogress" ? (
                            "Send Inquiry to Employee"
                          ) : (
                            "Confirm Rejection"
                          )}
                        </Button>

                        {!canSubmit && selected && (
                          <div style={{ fontSize: "11.5px", color: "#DC2626", textAlign: "center", marginTop: "-4px" }}>
                            {selected === "Approve" || selected === "Override"
                              ? "Please select an available asset to issue."
                              : reasonRequired && !reason.trim()
                              ? "Please enter a reason to proceed."
                              : ""}
                          </div>
                        )}
                      </>
                    )}
                  </div>
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
