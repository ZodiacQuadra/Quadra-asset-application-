import React, { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Text,
  Badge,
  Spinner,
  Dropdown,
  Option,
  Textarea,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  PersonRegular,
  DocumentTextRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  WarningRegular,
  ArrowUndoRegular,
  BoxRegular,
  LaptopRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { getAvailableAssetsForCategory, AvailableAssetOption } from "../Services/AssetInventoryService";
import {
  getAssetHRRequestDetail,
  assignHRRequestItem,
  adminActionOnHRRequest,
  adminReprogressHRRequest,
  AssetHRRequestDetail,
  AssetHRRequestItemDetail,
} from "../Services/AssetHRRequestService";
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
const formatDateTime = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

type HRDecisionChoice = "Complete" | "Clarification" | "Reject";

const HR_DECISION_OPTIONS: Record<HRDecisionChoice, DecisionOptionDef> = {
  Complete: {
    kind: "Complete",
    label: "Finalize & Complete Requisition",
    description: "Conclude provisioning and mark requisition ready for onboarding handoff",
    icon: <CheckmarkCircleRegular />,
    accent: "#007ED5",
    iconBg: "#EFF6FF",
    activeBg: "#EFF6FF",
    activeBorder: "#007ED5",
  },
  Clarification: {
    kind: "Clarification",
    label: "Request Clarification from HR",
    description: "Query HR regarding start date changes, role specifications, or Entra IDs",
    icon: <ArrowUndoRegular />,
    accent: "#D97706",
    iconBg: "#FFFBEB",
    activeBg: "#FFFBEB",
    activeBorder: "#F59E0B",
  },
  Reject: {
    kind: "Reject",
    label: "Reject Requisition",
    description: "Decline onboarding requisition due to hiring freeze or duplicate submission",
    icon: <DismissCircleRegular />,
    accent: "#DC2626",
    iconBg: "#FEF2F2",
    activeBg: "#FEF2F2",
    activeBorder: "#EF4444",
  },
};

interface HRRequestDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hrRequestId: string | null;
  onActionComplete: () => void;
}

const HRRequestDetailsPanel: React.FC<HRRequestDetailsPanelProps> = ({
  open,
  onOpenChange,
  hrRequestId,
  onActionComplete,
}) => {
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("hr-request-details-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [detail, setDetail] = useState<AssetHRRequestDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [assetsByCategory, setAssetsByCategory] = useState<Record<string, AvailableAssetOption[]>>({});
  const [selectedAssetByItem, setSelectedAssetByItem] = useState<Record<string, string>>({});
  const [assigningItemId, setAssigningItemId] = useState<string | null>(null);

  // Decision state
  const [selectedDecision, setSelectedDecision] = useState<HRDecisionChoice>("Complete");
  const [clarificationReason, setClarificationReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick allocation state inside the decision card
  const [quickAllocationItemId, setQuickAllocationItemId] = useState<string>("");

  const loadDetail = async () => {
    if (!hrRequestId) return;
    setLoading(true);
    try {
      const data = await getAssetHRRequestDetail(hrRequestId);
      setDetail(data);
    } catch (error: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error?.message || "Failed to load HR request details"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && hrRequestId) {
      setSelectedDecision("Complete");
      setClarificationReason("");
      setRejectionReason("");
      setCompletionNotes("");
      setSelectedAssetByItem({});
      setQuickAllocationItemId("");
      loadDetail();
    }
  }, [open, hrRequestId]);

  const itemsByApplicant = useMemo(() => {
    const map: Record<string, AssetHRRequestItemDetail[]> = {};
    (detail?.items ?? []).forEach((item) => {
      const list = map[item.ApplicantAssetHRReqID] ?? [];
      list.push(item);
      map[item.ApplicantAssetHRReqID] = list;
    });
    return map;
  }, [detail]);

  const ensureAssetsLoaded = async (categoryName: string) => {
    if (assetsByCategory[categoryName]) return;
    try {
      const assets = await getAvailableAssetsForCategory(categoryName);
      setAssetsByCategory((prev) => ({ ...prev, [categoryName]: assets }));
    } catch {
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to load available assets</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  const handleAssign = async (item: AssetHRRequestItemDetail, resolvedUserId: string) => {
    const assetId = selectedAssetByItem[item.ID];
    if (!assetId || !currentUser?.userID) return;
    setAssigningItemId(item.ID);
    try {
      await assignHRRequestItem(item.ID, { assetId, resolvedUserId, actionedByUserId: currentUser.userID });
      dispatchToast(
        <Toast>
          <ToastTitle>Asset allocated successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      await loadDetail();
      onActionComplete();
    } catch (error: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error?.message || "Failed to allocate asset"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setAssigningItemId(null);
    }
  };

  const isCompleted = detail?.request.Status === "Completed";
  const isActionable = !isCompleted && !!detail?.request;
  const pendingItems = (detail?.items ?? []).filter((i) => i.Status === "Pending");
  const fulfilledCount = (detail?.items ?? []).filter((i) => i.Status === "Completed" || i.Status === "Assigned").length;

  const handleDecisionSubmit = async () => {
    if (!currentUser?.userID || !detail?.request) return;
    setIsSubmitting(true);

    try {
      if (selectedDecision === "Complete") {
        await adminActionOnHRRequest(
          detail.request.ID,
          "Approve",
          currentUser.userID,
          currentUser.displayName,
          currentUser.email,
          completionNotes || "All onboarding assets allocated and verified"
        );
        dispatchToast(
          <Toast>
            <ToastTitle>HR Requisition finalized and marked Completed</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else if (selectedDecision === "Clarification") {
        await adminReprogressHRRequest(
          detail.request.ID,
          clarificationReason,
          currentUser.userID,
          currentUser.displayName,
          currentUser.email
        );
        dispatchToast(
          <Toast>
            <ToastTitle>Clarification inquiry dispatched to HR</ToastTitle>
          </Toast>,
          { intent: "info" }
        );
      } else if (selectedDecision === "Reject") {
        await adminActionOnHRRequest(
          detail.request.ID,
          "Reject",
          currentUser.userID,
          currentUser.displayName,
          currentUser.email,
          rejectionReason
        );
        dispatchToast(
          <Toast>
            <ToastTitle>HR Requisition rejected</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      }

      onActionComplete();
      onOpenChange(false);
    } catch (error: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error?.message || "Failed to process HR decision"}</ToastTitle>
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

  const currentOptionDef = HR_DECISION_OPTIONS[selectedDecision];

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
              <PersonRegular style={{ fontSize: 18 }} />
            </div>
            <div>
              <Text weight="bold" style={{ color: "#0F172A", fontSize: "15px", display: "block" }}>
                HR Asset Request Details
              </Text>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                New hire onboarding and staff asset provisioning ({detail?.request.HRRequestID || "HR Requisition"})
              </span>
            </div>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      {/* Body */}
      <DrawerBody style={{ backgroundColor: "#FFFFFF", padding: "20px 24px" }}>
        {loading || !detail ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Spinner label="Loading HR request details..." />
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
                name={detail.request.RequestedUserName || "HR Specialist"}
                jobTitle={detail.request.HRRequestID ? `Requisition ${detail.request.HRRequestID}` : "HR Onboarding Requisition"}
                email={detail.request.RequestedUserMailID}
                dateLabel={`Submitted on ${formatDate(detail.request.CreatedAt)}`}
                status={detail.request.Status}
                statusColor={
                  detail.request.Status === "Completed"
                    ? "success"
                    : detail.request.Status === "Rejected"
                    ? "danger"
                    : "warning"
                }
              />

              {/* Requisition Overview */}
              <InfoCardGroup title="Requisition Overview">
                <InfoRow label="Request ID" value={detail.request.HRRequestID} />
                <InfoRow label="Status" value={detail.request.Status} />
                <InfoRow label="Assigned IT Admin" value={detail.request.AssignedAdminName || "Central IT"} />
                <InfoRow label="Admin Contact" value={detail.request.AssignedAdminMailID || "it@quadrasystems.net"} />
                <InfoRow label="Submission Date" value={formatDateTime(detail.request.CreatedAt)} />
                <InfoRow label="Last Modified" value={formatDateTime(detail.request.ModifiedAt)} hasDivider={false} />
              </InfoCardGroup>

              {/* Applicants & Equipment Breakdown */}
              <InfoCardGroup title={`Applicants & Hardware Allocation (${detail.applicants.length})`}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "8px 0" }}>
                  {detail.applicants.map((applicant) => {
                    const items = itemsByApplicant[applicant.ID] ?? [];
                    return (
                      <div
                        key={applicant.ID}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E2E8F0",
                          borderRadius: "10px",
                          padding: "14px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                          <div>
                            <Text weight="semibold" style={{ color: "#0F172A", fontSize: "14px", display: "block" }}>
                              {applicant.ApplicantName}
                            </Text>
                            <span style={{ fontSize: "12px", color: "#64748B" }}>
                              {applicant.ApplicantMailID} {applicant.JoiningDate && `· Joining ${formatDate(applicant.JoiningDate)}`}
                            </span>
                          </div>
                          <Badge appearance="tint" color={applicant.Status === "Completed" ? "success" : "warning"}>
                            {applicant.Status}
                          </Badge>
                        </div>

                        {!applicant.HasEntraIdentity && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              padding: "8px 12px",
                              background: "#FEF3C7",
                              border: "1px solid #FDE68A",
                              borderRadius: "8px",
                              marginBottom: "10px",
                              fontSize: "12px",
                              color: "#92400E",
                            }}
                          >
                            <WarningRegular style={{ color: "#B45309", fontSize: 16, flexShrink: 0 }} />
                            <span>
                              Pending Entra ID creation. Assets can be allocated once account is active.
                            </span>
                          </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {items.map((item) => {
                            const isPending = item.Status === "Pending";
                            const canAssign = isPending && applicant.HasEntraIdentity;
                            return (
                              <div
                                key={item.ID}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  gap: "10px",
                                  padding: "8px 12px",
                                  background: "#F8FAFC",
                                  border: "1px solid #E2E8F0",
                                  borderRadius: "6px",
                                  flexWrap: "wrap",
                                }}
                              >
                                <div>
                                  <span style={{ fontWeight: 600, color: "#0F172A", fontSize: "13px" }}>
                                    {item.CategoryName}
                                  </span>
                                  <div style={{ fontSize: "11px", color: "#64748B" }}>
                                    Status: <strong>{item.Status}</strong>
                                    {item.ApprovedDate && ` · Allocated ${formatDate(item.ApprovedDate)}`}
                                  </div>
                                </div>

                                {canAssign ? (
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
                                    <Dropdown
                                      placeholder="Select available asset"
                                      mountNode={mountNode}
                                      style={{ minWidth: "190px" }}
                                      value={
                                        assetsByCategory[item.CategoryName]?.find((a) => a.ID === selectedAssetByItem[item.ID])
                                          ?.AssetName ?? ""
                                      }
                                      onOpenChange={(_, d) => d.open && ensureAssetsLoaded(item.CategoryName)}
                                      onOptionSelect={(_, d) =>
                                        setSelectedAssetByItem((prev) => ({ ...prev, [item.ID]: d.optionValue ?? "" }))
                                      }
                                    >
                                      {(assetsByCategory[item.CategoryName] ?? []).length === 0 ? (
                                        <Option key="none" value="" disabled>
                                          No in-stock assets available
                                        </Option>
                                      ) : (
                                        assetsByCategory[item.CategoryName].map((asset) => (
                                          <Option key={asset.ID} value={asset.ID} text={asset.AssetName}>
                                            {asset.AssetName} ({asset.AssetTagID})
                                          </Option>
                                        ))
                                      )}
                                    </Dropdown>
                                    <button
                                      type="button"
                                      disabled={!selectedAssetByItem[item.ID] || assigningItemId === item.ID}
                                      onClick={() => handleAssign(item, applicant.ResolvedUserID as string)}
                                      style={{
                                        background: "#007ED5",
                                        color: "#FFFFFF",
                                        border: "none",
                                        borderRadius: "16px",
                                        padding: "6px 16px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        cursor: !selectedAssetByItem[item.ID] || assigningItemId === item.ID ? "not-allowed" : "pointer",
                                        opacity: !selectedAssetByItem[item.ID] ? 0.6 : 1,
                                      }}
                                    >
                                      {assigningItemId === item.ID ? <Spinner size="tiny" /> : "Assign"}
                                    </button>
                                  </div>
                                ) : (
                                  <Badge appearance="tint" color={item.Status === "Completed" ? "success" : "warning"}>
                                    {item.Status}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </InfoCardGroup>

              {/* If completed, show Left Side Decision Record */}
              {isCompleted && (
                <DecisionSummaryCard
                  status="Completed"
                  decidedBy={detail.request.AssignedAdminName || "Central IT"}
                  decidedDate={detail.request.ModifiedAt || detail.request.CreatedAt}
                  decidedReason="All requested hardware allocated and confirmed for onboarding."
                  extraDetails={[
                    { label: "Fulfilled Assets", value: `${fulfilledCount} Assets` },
                    { label: "Applicants", value: `${detail.applicants.length} Staff` },
                  ]}
                />
              )}
            </div>

            {/* Right Column (~35%): Make Decision or Fulfillment Summary */}
            <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
              {isActionable ? (
                <DecisionContainer
                  isActionable={true}
                  title="Make Decision"
                  subtitle="Allocate inventory or resolve requisition"
                  badgeLabel="Action Required"
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {/* Fulfillment Progress Card */}
                    <div
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "12px",
                        padding: "12px 14px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: "#0F172A" }}>
                          Hardware Allocation Status
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: pendingItems.length === 0 ? "#DCFCE7" : "#FEF3C7",
                            color: pendingItems.length === 0 ? "#15803D" : "#B45309",
                          }}
                        >
                          {fulfilledCount} of {detail.items.length} Allocated
                        </span>
                      </div>

                      <div style={{ width: "100%", height: "6px", background: "#F1F5F9", borderRadius: "999px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${detail.items.length > 0 ? (fulfilledCount / detail.items.length) * 100 : 0}%`,
                            height: "100%",
                            background: pendingItems.length === 0 ? "#10B981" : "#007ED5",
                            borderRadius: "999px",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>

                      <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                        {pendingItems.length > 0
                          ? `Assign remaining ${pendingItems.length} requirement(s) in the left panel before finalizing.`
                          : "All applicant equipment assigned and ready for onboarding."}
                      </div>
                    </div>

                    {/* Option 1: Complete */}
                    <OptionCard
                      def={HR_DECISION_OPTIONS.Complete}
                      selected={selectedDecision === "Complete"}
                      onClick={() => setSelectedDecision("Complete")}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#1D4ED8" }}>
                          Fulfillment / Dispatch Notes <span style={{ fontWeight: 400, color: "#64748B" }}>(Optional)</span>
                        </label>
                        <Textarea
                          placeholder="e.g. All hardware tagged, imaged, and staged for courier dispatch..."
                          value={completionNotes}
                          onChange={(_, d) => setCompletionNotes(d.value)}
                          rows={2}
                        />
                        {pendingItems.length > 0 && (
                          <div style={{ fontSize: "11px", color: "#D97706", marginTop: "2px" }}>
                            Notice: {pendingItems.length} item(s) are still pending inventory allocation.
                          </div>
                        )}
                      </div>
                    </OptionCard>

                    {/* Option 2: Clarification */}
                    <OptionCard
                      def={HR_DECISION_OPTIONS.Clarification}
                      selected={selectedDecision === "Clarification"}
                      onClick={() => setSelectedDecision("Clarification")}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#92400E" }}>
                          Clarification Prompt for HR <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <Textarea
                          placeholder="e.g. Please confirm applicant joining date delay or department change..."
                          value={clarificationReason}
                          onChange={(_, d) => setClarificationReason(d.value)}
                          rows={3}
                        />
                      </div>
                    </OptionCard>

                    {/* Option 3: Reject */}
                    <OptionCard
                      def={HR_DECISION_OPTIONS.Reject}
                      selected={selectedDecision === "Reject"}
                      onClick={() => setSelectedDecision("Reject")}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#B91C1C" }}>
                          Rejection Reason <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <Textarea
                          placeholder="Explain reason for rejecting this HR onboarding requisition..."
                          value={rejectionReason}
                          onChange={(_, d) => setRejectionReason(d.value)}
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
                  decidedBy={detail.request.AssignedAdminName || "Central IT"}
                  decidedDate={detail.request.ModifiedAt || detail.request.CreatedAt}
                  decidedReason="All requested hardware allocated and confirmed for onboarding."
                  extraDetails={[
                    { label: "Fulfilled Assets", value: `${fulfilledCount} Assets` },
                    { label: "Applicants", value: `${detail.applicants.length} Staff` },
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

export default HRRequestDetailsPanel;
