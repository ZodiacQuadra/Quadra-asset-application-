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
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  ArrowSwapRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  WarningRegular,
  ArrowUndoRegular,
  BoxRegular,
  DocumentCheckmarkRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import HandoverItemsTable from "./HandoverItemsTable";
import {
  getAssetHandoverRequestDetail,
  updateAssetHandoverRequestItem,
  adminActionOnHandoverRequest,
  adminReprogressHandoverRequest,
  AssetHandoverRequestDetail,
  HandoverItemStatus,
  HandoverRequestStatus,
} from "../Services/AssetHandoverRequestService";
import {
  DrawerTopIdentityCard,
  InfoCardGroup,
  InfoRow,
  OptionCard,
  DecisionContainer,
  DecisionSummaryCard,
  DecisionOptionDef,
} from "./RequestDrawerComponents";

const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

type HandoverDecisionChoice = "Accept" | "Clarification" | "Reject";

const HANDOVER_DECISION_OPTIONS: Record<HandoverDecisionChoice, DecisionOptionDef> = {
  Accept: {
    kind: "Accept",
    label: "Accept Custody & Check In",
    description: "Verify returned equipment and return into active central IT inventory stock",
    icon: <CheckmarkCircleRegular />,
    accent: "#059669",
    iconBg: "#ECFDF5",
    activeBg: "#F0FDF4",
    activeBorder: "#10B981",
  },
  Clarification: {
    kind: "Clarification",
    label: "Request Clarification from Employee",
    description: "Flag missing accessories, power bricks, or unreturned items to employee",
    icon: <ArrowUndoRegular />,
    accent: "#D97706",
    iconBg: "#FFFBEB",
    activeBg: "#FFFBEB",
    activeBorder: "#F59E0B",
  },
  Reject: {
    kind: "Reject",
    label: "Reject Custody Return",
    description: "Decline handover submission due to discrepancy or disputed asset tags",
    icon: <DismissCircleRegular />,
    accent: "#DC2626",
    iconBg: "#FEF2F2",
    activeBg: "#FEF2F2",
    activeBorder: "#EF4444",
  },
};

interface HandoverRequestDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handoverRequestId: string | null;
  onActionComplete: () => void;
}

const HandoverRequestDetailsPanel: React.FC<HandoverRequestDetailsPanelProps> = ({
  open,
  onOpenChange,
  handoverRequestId,
  onActionComplete,
}) => {
  const { currentUser } = useAuth();
  const toasterId = useId("handover-request-details-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [detail, setDetail] = useState<AssetHandoverRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);

  // Decision state
  const [selectedDecision, setSelectedDecision] = useState<HandoverDecisionChoice>("Accept");
  const [acceptanceNotes, setAcceptanceNotes] = useState("");
  const [clarificationReason, setClarificationReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDetail = async () => {
    if (!handoverRequestId) return;
    setLoading(true);
    try {
      const data = await getAssetHandoverRequestDetail(handoverRequestId);
      setDetail(data);
    } catch (error: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error?.message || "Failed to load request details"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && handoverRequestId) {
      setSelectedDecision("Accept");
      setAcceptanceNotes("");
      setClarificationReason("");
      setRejectionReason("");
      loadDetail();
    }
  }, [open, handoverRequestId]);

  const handleActionItem = async (itemId: string, status: Exclude<HandoverItemStatus, "Pending">, remarks: string) => {
    if (!currentUser?.userID) return;
    try {
      await updateAssetHandoverRequestItem(itemId, { status, remarks, actionedByUserId: currentUser.userID });
      await loadDetail();
      onActionComplete();
      dispatchToast(
        <Toast>
          <ToastTitle>Asset condition updated</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
    } catch (error: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error?.message || "Failed to update item"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  const req = detail?.request || (detail as any);
  const items = detail?.items || [];
  const acceptedCount = items.filter((i: any) => i.Status !== "Pending").length;
  const pendingCount = items.filter((i: any) => i.Status === "Pending").length;
  const isCompleted = req?.Status === "Completed";
  const isActionable = !isCompleted && !!req;

  const handleDecisionSubmit = async () => {
    if (!currentUser?.userID || !req) return;
    setIsSubmitting(true);

    try {
      if (selectedDecision === "Accept") {
        // Bulk accept any remaining pending items as Good Condition
        const pendingItems = items.filter((i: any) => i.Status === "Pending");
        for (const item of pendingItems) {
          await updateAssetHandoverRequestItem(item.ID, {
            status: "Good condition",
            remarks: acceptanceNotes || "Accepted & verified into central IT inventory stock",
            actionedByUserId: currentUser.userID,
          });
        }
        await adminActionOnHandoverRequest(
          req.ID,
          "Approve",
          currentUser.userID,
          currentUser.displayName,
          currentUser.email,
          acceptanceNotes || "Handover accepted and inventory updated"
        );
        dispatchToast(
          <Toast>
            <ToastTitle>Handover accepted! All assets returned to stock.</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else if (selectedDecision === "Clarification") {
        await adminReprogressHandoverRequest(
          req.ID,
          clarificationReason,
          currentUser.userID,
          currentUser.displayName,
          currentUser.email
        );
        dispatchToast(
          <Toast>
            <ToastTitle>Clarification request sent to employee</ToastTitle>
          </Toast>,
          { intent: "info" }
        );
      } else if (selectedDecision === "Reject") {
        await adminActionOnHandoverRequest(
          req.ID,
          "Reject",
          currentUser.userID,
          currentUser.displayName,
          currentUser.email,
          rejectionReason
        );
        dispatchToast(
          <Toast>
            <ToastTitle>Handover submission declined</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      }

      onActionComplete();
      onOpenChange(false);
    } catch (error: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error?.message || "Failed to process handover decision"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    (selectedDecision === "Clarification" && !clarificationReason.trim()) ||
    (selectedDecision === "Reject" && !rejectionReason.trim());

  const currentOptionDef = HANDOVER_DECISION_OPTIONS[selectedDecision];

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
              <ArrowSwapRegular style={{ fontSize: 18 }} />
            </div>
            <div>
              <Text weight="bold" style={{ color: "#0F172A", fontSize: "15px", display: "block" }}>
                Asset Handover Request
              </Text>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Custody return & inventory verification for {req?.RequestedUserName || "Employee"}
              </span>
            </div>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      {/* Body */}
      <DrawerBody style={{ backgroundColor: "#FFFFFF", padding: "20px 24px" }}>
        {loading || !detail ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Spinner label="Loading handover request details..." />
          </div>
        ) : (
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
                name={req?.RequestedUserName || "Employee"}
                jobTitle={req?.HandoverRequestID ? `Requisition ${req.HandoverRequestID}` : "Asset Handover"}
                email={req?.RequestedUserMailID}
                dateLabel={`Submitted on ${formatDate(req?.CreatedAt)}`}
                status={req?.Status || "Pending"}
                statusColor={req?.Status === "Completed" ? "success" : "warning"}
              />

              {/* Custody Transfer Pathway */}
              <InfoCardGroup title="Custody Transfer Pathway">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto 1fr",
                    alignItems: "center",
                    gap: "14px",
                    padding: "10px 0",
                  }}
                >
                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                      Current Custodian
                    </span>
                    <div style={{ fontWeight: 600, color: "#0F172A", fontSize: "13.5px", marginTop: "2px" }}>
                      {req?.RequestedUserName || "Employee"}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                      {req?.RequestedUserMailID || "Staff User"}
                    </div>
                  </div>

                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#EFF6FF",
                      color: "#007ED5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    →
                  </div>

                  <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block" }}>
                      Receiving Repository
                    </span>
                    <div style={{ fontWeight: 600, color: "#0F172A", fontSize: "13.5px", marginTop: "2px" }}>
                      {req?.AssignedAdminName || "Central IT Stock"}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                      {req?.AssignedAdminMailID || "Central IT Stock / Staging"}
                    </div>
                  </div>
                </div>
              </InfoCardGroup>

              {/* Handover Parameters & Offboarding Context */}
              <InfoCardGroup title="Handover Parameters & Notes">
                <InfoRow label="Reason for Return" value={req?.Reason || "Standard Asset Handover"} />
                <InfoRow label="Submission Date" value={formatDate(req?.CreatedAt)} />
                {req?.AdditionalNotes && (
                  <InfoRow label="Employee Notes" value={req.AdditionalNotes} />
                )}
                {req?.ExitID && (
                  <InfoRow
                    label="Offboarding Case"
                    value={<Badge appearance="tint" color="warning">Linked to Exit #{req.ExitID}</Badge>}
                    hasDivider={false}
                  />
                )}
              </InfoCardGroup>

              {/* Asset Inventory Inspection */}
              <InfoCardGroup title={`Hardware Assets for Custody Return (${items.length})`}>
                <div style={{ padding: "8px 0" }}>
                  <HandoverItemsTable
                    items={items}
                    disabled={isCompleted}
                    onActionItem={handleActionItem}
                  />
                </div>
              </InfoCardGroup>

              {/* If completed, show Left Side Decision Record */}
              {isCompleted && (
                <DecisionSummaryCard
                  status="Completed"
                  decidedBy={req?.AssignedAdminName || "Central IT Admin"}
                  decidedDate={req?.ModifiedAt || req?.CreatedAt}
                  decidedReason="All assets received, verified, and checked into central inventory repository."
                  extraDetails={[
                    { label: "Assets Checked In", value: `${items.length} Units` },
                  ]}
                />
              )}
            </div>

            {/* Right Column (~35%): Make Decision or Custody Summary */}
            <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
              {isActionable ? (
                <DecisionContainer
                  isActionable={true}
                  title="Make Decision"
                  subtitle="Verify condition and accept return to inventory"
                  badgeLabel="Action Required"
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Option 1: Accept */}
                    <OptionCard
                      def={HANDOVER_DECISION_OPTIONS.Accept}
                      selected={selectedDecision === "Accept"}
                      onClick={() => setSelectedDecision("Accept")}
                    />

                    {/* Option 2: Clarification / Missing Items */}
                    <OptionCard
                      def={HANDOVER_DECISION_OPTIONS.Clarification}
                      selected={selectedDecision === "Clarification"}
                      onClick={() => setSelectedDecision("Clarification")}
                    />

                    {/* Option 3: Reject */}
                    <OptionCard
                      def={HANDOVER_DECISION_OPTIONS.Reject}
                      selected={selectedDecision === "Reject"}
                      onClick={() => setSelectedDecision("Reject")}
                    />

                    {/* Contextual Input Area */}
                    <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      {selectedDecision === "Accept" && (
                        <>
                          <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#065F46" }}>
                            Custody Receipt Notes <span style={{ fontWeight: 400, color: "#64748B" }}>(Optional)</span>
                          </label>
                          <Textarea
                            placeholder="e.g. Received in good order at IT service desk, chargers and peripherals intact..."
                            value={acceptanceNotes}
                            onChange={(_, d) => setAcceptanceNotes(d.value)}
                            rows={2}
                          />
                        </>
                      )}

                      {selectedDecision === "Clarification" && (
                        <>
                          <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#92400E" }}>
                            Missing Item / Clarification Prompt <span style={{ color: "#DC2626" }}>*</span>
                          </label>
                          <Textarea
                            placeholder="e.g. Power adapter and HDMI dongle are missing from the laptop bag..."
                            value={clarificationReason}
                            onChange={(_, d) => setClarificationReason(d.value)}
                            rows={3}
                          />
                        </>
                      )}

                      {selectedDecision === "Reject" && (
                        <>
                          <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#B91C1C" }}>
                            Rejection Reason <span style={{ color: "#DC2626" }}>*</span>
                          </label>
                          <Textarea
                            placeholder="Explain reason for rejecting this handover submission..."
                            value={rejectionReason}
                            onChange={(_, d) => setRejectionReason(d.value)}
                            rows={3}
                          />
                        </>
                      )}
                    </div>
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
                    {isSubmitting ? (
                      <Spinner size="tiny" />
                    ) : (
                      <>
                        {currentOptionDef.icon}
                        <span>Confirm {currentOptionDef.label.split(" ")[0]}</span>
                      </>
                    )}
                  </button>
                </DecisionContainer>
              ) : (
                /* Completed Summary Card */
                <DecisionSummaryCard
                  status="Completed"
                  decidedBy={req?.AssignedAdminName || "Central IT Admin"}
                  decidedDate={req?.ModifiedAt || req?.CreatedAt}
                  decidedReason="All assets received, verified, and checked into central inventory repository."
                  extraDetails={[
                    { label: "Assets Checked In", value: `${items.length} Units` },
                  ]}
                />
              )}
            </div>
          </div>
        )}
      </DrawerBody>
    </Drawer>
  );
};

export default HandoverRequestDetailsPanel;
