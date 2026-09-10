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
  WarningRegular,
  PersonRegular,
  DocumentTextRegular,
  BoxRegular,
  CheckmarkCircleRegular,
  DismissCircleRegular,
  ArrowUndoRegular,
  LaptopRegular,
  ShieldDismissRegular,
  SearchRegular,
  CheckmarkRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import {
  AssetLostRequestRecord,
  AssetLostRequestItemRecord,
  getAssetLostRequestById,
  adminActionOnLostRequestItem,
  adminActionOnLostRequest,
  adminReprogressLostRequest,
} from "../Services/AssetLostRequestService";
import {
  getAvailableAssetsForCategory,
  AvailableAssetOption,
} from "../Services/AssetInventoryService";
import {
  DrawerTopIdentityCard,
  InfoCardGroup,
  InfoRow,
  OptionCard,
  DecisionContainer,
  DecisionSummaryCard,
  DecisionOptionDef,
} from "./RequestDrawerComponents";

const formatDate = (val: string | null | undefined) => {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return val;
  }
};

type LostDecisionChoice = "ApproveReplacement" | "ApproveWriteOff" | "RequestFIR" | "Reject";

const LOST_DECISION_OPTIONS: Record<LostDecisionChoice, DecisionOptionDef> = {
  ApproveReplacement: {
    kind: "ApproveReplacement",
    label: "Approve & Dispatch Replacement",
    description: "Approve incident claim and allocate an in-stock replacement device",
    icon: <CheckmarkCircleRegular />,
    accent: "#059669",
    iconBg: "#ECFDF5",
    activeBg: "#F0FDF4",
    activeBorder: "#10B981",
  },
  ApproveWriteOff: {
    kind: "ApproveWriteOff",
    label: "Approve & Decommission (No Replacement)",
    description: "Accept incident report and write off asset from inventory without hardware reissuance",
    icon: <BoxRegular />,
    accent: "#007ED5",
    iconBg: "#EFF6FF",
    activeBg: "#EFF6FF",
    activeBorder: "#007ED5",
  },
  RequestFIR: {
    kind: "RequestFIR",
    label: "Request Police FIR / Affidavit",
    description: "Send back requesting police complaint acknowledgement or notarized loss declaration",
    icon: <ArrowUndoRegular />,
    accent: "#D97706",
    iconBg: "#FFFBEB",
    activeBg: "#FFFBEB",
    activeBorder: "#F59E0B",
  },
  Reject: {
    kind: "Reject",
    label: "Reject Incident Claim",
    description: "Decline lost asset claim due to violation of asset care policy or negligence",
    icon: <DismissCircleRegular />,
    accent: "#DC2626",
    iconBg: "#FEF2F2",
    activeBg: "#FEF2F2",
    activeBorder: "#EF4444",
  },
};

interface LostIncidentDetailsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: AssetLostRequestRecord | null;
  onActionComplete?: () => void;
}

export const LostIncidentDetailsPanel: React.FC<LostIncidentDetailsPanelProps> = ({
  open,
  onOpenChange,
  request,
  onActionComplete,
}) => {
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("lost-incident-panel-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [items, setItems] = useState<AssetLostRequestItemRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableAssetsByCategory, setAvailableAssetsByCategory] = useState<Record<string, AvailableAssetOption[]>>({});
  const [selectedReplacement, setSelectedReplacement] = useState<Record<string, string>>({});

  // Decision State
  const [selectedDecision, setSelectedDecision] = useState<LostDecisionChoice>("ApproveReplacement");
  const [selectedTargetItemId, setSelectedTargetItemId] = useState<string>("");
  const [assetSearchQuery, setAssetSearchQuery] = useState("");
  const [writeOffNotes, setWriteOffNotes] = useState("");
  const [firRequestReason, setFirRequestReason] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadItems = async (reqId: string) => {
    setLoading(true);
    try {
      const res = await getAssetLostRequestById(reqId);
      setItems(res.items || []);
      if (res.items?.length > 0) {
        setSelectedTargetItemId(res.items[0].ID);
        // Preload available assets for the primary category
        if (res.items[0].Category) {
          ensureCategoryAssets(res.items[0].Category);
        }
      }
    } catch {
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to load incident asset records</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && request?.ID) {
      setSelectedDecision("ApproveReplacement");
      setSelectedReplacement({});
      setWriteOffNotes("");
      setFirRequestReason("");
      setRejectionReason("");
      loadItems(request.ID);
    }
  }, [open, request?.ID]);

  const ensureCategoryAssets = async (category: string) => {
    if (availableAssetsByCategory[category]) return;
    try {
      const list = await getAvailableAssetsForCategory(category);
      setAvailableAssetsByCategory((prev) => ({ ...prev, [category]: list }));
    } catch {
      // non-blocking
    }
  };

  if (!request) return null;

  const isResolved = request.RequestStatus === "Resolved" || request.RequestStatus === "Closed";
  const isActionable = !isResolved;
  const pendingItems = items.filter((i) => i.ItemStatus === "Pending");
  const currentTargetItem = items.find((i) => i.ID === selectedTargetItemId) || items[0];

  const handleDecisionSubmit = async () => {
    if (!currentUser?.userID || !request) return;
    setIsSubmitting(true);

    try {
      if (selectedDecision === "ApproveReplacement") {
        if (!currentTargetItem) {
          throw new Error("Please select an item to approve replacement for.");
        }
        await adminActionOnLostRequestItem(
          currentTargetItem.ID,
          "Approve",
          currentUser.userID,
          currentUser.displayName || "Admin",
          selectedReplacement[currentTargetItem.ID] || null,
          "Replacement approved and assigned",
          false
        );
        dispatchToast(
          <Toast>
            <ToastTitle>Replacement approved for {currentTargetItem.AssetName}</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else if (selectedDecision === "ApproveWriteOff") {
        if (!currentTargetItem) {
          throw new Error("Please select an item to write off.");
        }
        await adminActionOnLostRequestItem(
          currentTargetItem.ID,
          "Approve",
          currentUser.userID,
          currentUser.displayName || "Admin",
          null,
          writeOffNotes || "Asset written off from inventory without replacement",
          false
        );
        dispatchToast(
          <Toast>
            <ToastTitle>Asset write-off approved and decommissioned</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      } else if (selectedDecision === "RequestFIR") {
        await adminReprogressLostRequest(
          request.ID,
          firRequestReason,
          currentUser.userID,
          currentUser.displayName
        );
        dispatchToast(
          <Toast>
            <ToastTitle>FIR / Affidavit request sent to employee</ToastTitle>
          </Toast>,
          { intent: "info" }
        );
      } else if (selectedDecision === "Reject") {
        if (currentTargetItem) {
          await adminActionOnLostRequestItem(
            currentTargetItem.ID,
            "Reject",
            currentUser.userID,
            currentUser.displayName || "Admin",
            null,
            rejectionReason || "Lost asset claim rejected",
            false
          );
        }
        await adminActionOnLostRequest(
          request.ID,
          "Reject",
          currentUser.userID,
          currentUser.displayName,
          rejectionReason
        );
        dispatchToast(
          <Toast>
            <ToastTitle>Lost asset incident claim rejected</ToastTitle>
          </Toast>,
          { intent: "success" }
        );
      }

      onActionComplete?.();
      onOpenChange(false);
    } catch (err: any) {
      dispatchToast(
        <Toast>
          <ToastTitle>{err?.message || "Failed to process decision"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitDisabled =
    isSubmitting ||
    (selectedDecision === "ApproveReplacement" && !selectedReplacement[currentTargetItem?.ID || ""]) ||
    (selectedDecision === "RequestFIR" && !firRequestReason.trim()) ||
    (selectedDecision === "Reject" && !rejectionReason.trim());

  const currentOptionDef = LOST_DECISION_OPTIONS[selectedDecision];

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
                background: "#FEF2F2",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                flexShrink: 0,
              }}
            >
              <WarningRegular style={{ fontSize: 18 }} />
            </div>
            <div>
              <Text weight="bold" style={{ color: "#0F172A", fontSize: "15px", display: "block" }}>
                Lost Asset Incident Details
              </Text>
              <span style={{ fontSize: "12px", color: "#64748B" }}>
                Incident investigation & replacement resolution ({request.RequestNumber || "Lost Claim"})
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
              name={request.EmployeeName || "Employee"}
              jobTitle={request.RequestNumber ? `Incident ${request.RequestNumber}` : "Lost Asset Requisition"}
              department={request.Department}
              dateLabel={`Loss Date: ${formatDate(request.LostDate)} · Reported ${formatDate(request.CreatedAt)}`}
              status={request.RequestStatus}
              statusColor={
                request.RequestStatus === "Approved" || request.RequestStatus === "Resolved"
                  ? "success"
                  : request.RequestStatus === "Rejected"
                  ? "danger"
                  : "warning"
              }
              icon={<WarningRegular style={{ color: "#DC2626" }} />}
            />

            {/* Incident Summary & Official Police Verification */}
            <InfoCardGroup title="Incident Summary & Police Verification">
              <InfoRow label="Incident Number" value={request.RequestNumber || "—"} />
              <InfoRow label="Loss Date" value={formatDate(request.LostDate)} />
              <InfoRow label="Reported On" value={formatDate(request.CreatedAt)} />
              <InfoRow
                label="Police Report (FIR)"
                value={
                  request.PoliceReportFiled ? (
                    <Badge appearance="filled" color="danger">FIR Filed on Record</Badge>
                  ) : (
                    <span style={{ color: "#64748B", fontSize: "12.5px" }}>No Police Report Filed</span>
                  )
                }
              />
              <InfoRow label="Reported By" value={request.ReportedByName || "Self-reported by staff"} hasDivider={false} />
            </InfoCardGroup>

            {/* Circumstances & Location Narrative */}
            <InfoCardGroup title="Incident Circumstances & Last Known Location">
              <div
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: 10,
                  padding: "14px 16px",
                  fontSize: "13.5px",
                  color: "#334155",
                  lineHeight: 1.6,
                  margin: "8px 0",
                }}
              >
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Circumstances of Loss
                </span>
                {request.HowLost || "No description provided."}
              </div>
              {request.AdditionalDetails && (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 10,
                    padding: "12px 14px",
                    fontSize: "13px",
                    color: "#334155",
                    lineHeight: 1.5,
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                    Additional Location & Tracking Details
                  </span>
                  {request.AdditionalDetails}
                </div>
              )}
            </InfoCardGroup>

            {/* Reported Lost Assets */}
            <InfoCardGroup title={`Reported Lost Hardware (${items.length})`}>
              {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
                  <Spinner label="Loading incident asset items..." />
                </div>
              ) : items.length === 0 ? (
                <div style={{ padding: "16px", color: "#64748B", fontSize: "13px" }}>
                  No item records attached to this incident.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "8px 0" }}>
                  {items.map((item) => (
                    <div
                      key={item.ID}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "10px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 700, color: "#0F172A", fontSize: "13.5px" }}>
                            {item.AssetName}
                          </span>
                          <span style={{ fontSize: "11px", color: "#64748B", background: "#F1F5F9", padding: "2px 6px", borderRadius: "4px" }}>
                            {item.AssetTagID || "No Tag"}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                          Category: <strong>{item.Category || "Hardware"}</strong>
                          {item.ResolutionNotes && (
                            <span style={{ marginLeft: "8px", color: "#059669" }}>
                              · {item.ResolutionNotes}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        appearance="tint"
                        color={
                          item.ItemStatus === "Approved"
                            ? "success"
                            : item.ItemStatus === "Rejected"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {item.ItemStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </InfoCardGroup>

            {/* If resolved, show Left Side Decision Record */}
            {isResolved && (
              <DecisionSummaryCard
                status={request.RequestStatus}
                decidedReason="Lost asset report reviewed, security MDM remote wipe confirmed, and hardware status closed."
                extraDetails={[
                  { label: "Reported Assets", value: `${items.length} Assets` },
                  { label: "Police FIR Status", value: request.PoliceReportFiled ? "FIR on file" : "None" },
                ]}
              />
            )}
          </div>

          {/* Right Column (~35%): Make Decision or Security Audit */}
          <div style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
            {isActionable ? (
              <DecisionContainer
                isActionable={true}
                title="Make Decision"
                subtitle="Review incident and determine replacement outcome"
                badgeLabel="Action Required"
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {/* Option 1: Approve Replacement */}
                  <OptionCard
                    def={LOST_DECISION_OPTIONS.ApproveReplacement}
                    selected={selectedDecision === "ApproveReplacement"}
                    onClick={() => setSelectedDecision("ApproveReplacement")}
                  />

                  {/* Option 2: Approve Write Off */}
                  <OptionCard
                    def={LOST_DECISION_OPTIONS.ApproveWriteOff}
                    selected={selectedDecision === "ApproveWriteOff"}
                    onClick={() => setSelectedDecision("ApproveWriteOff")}
                  />

                  {/* Option 3: Request FIR / Clarification */}
                  <OptionCard
                    def={LOST_DECISION_OPTIONS.RequestFIR}
                    selected={selectedDecision === "RequestFIR"}
                    onClick={() => setSelectedDecision("RequestFIR")}
                  />

                  {/* Option 4: Reject */}
                  <OptionCard
                    def={LOST_DECISION_OPTIONS.Reject}
                    selected={selectedDecision === "Reject"}
                    onClick={() => setSelectedDecision("Reject")}
                  />

                  {/* Contextual Input Area */}
                  <div style={{ marginTop: "4px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {selectedDecision === "ApproveReplacement" && (
                      <div>
                        {items.length > 1 && (
                          <div style={{ marginBottom: "8px" }}>
                            <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#065F46", display: "block", marginBottom: "4px" }}>
                              Target Lost Asset
                            </label>
                            <Dropdown
                              mountNode={mountNode}
                              style={{ width: "100%" }}
                              value={currentTargetItem?.AssetName ?? ""}
                              onOptionSelect={(_, d) => {
                                setSelectedTargetItemId(d.optionValue ?? "");
                                const it = items.find((x) => x.ID === d.optionValue);
                                if (it?.Category) ensureCategoryAssets(it.Category);
                              }}
                            >
                              {items.map((it) => (
                                <Option key={it.ID} value={it.ID} text={it.AssetName}>
                                  {it.AssetName} ({it.AssetTagID})
                                </Option>
                              ))}
                            </Dropdown>
                          </div>
                        )}

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#065F46" }}>
                            Select In-Stock Replacement ({currentTargetItem?.Category || "Asset"}) <span style={{ color: "#DC2626" }}>*</span>
                          </label>
                          <span style={{ fontSize: "11px", color: "#64748B" }}>
                            {(availableAssetsByCategory[currentTargetItem?.Category || ""] || []).length} available
                          </span>
                        </div>

                        {/* Search bar */}
                        <div style={{ position: "relative", marginBottom: "6px" }}>
                          <SearchRegular style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748B", fontSize: "14px" }} />
                          <input
                            type="text"
                            placeholder={`Search ${currentTargetItem?.Category || "hardware"} by tag, name, location...`}
                            value={assetSearchQuery}
                            onChange={(e) => setAssetSearchQuery(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "7px 10px 7px 30px",
                              fontSize: "12px",
                              border: "1px solid #CBD5E1",
                              borderRadius: "8px",
                              outline: "none",
                              boxSizing: "border-box",
                            }}
                          />
                        </div>

                        {/* List of matching available assets */}
                        {(() => {
                          const categoryAssets = availableAssetsByCategory[currentTargetItem?.Category || ""] || [];
                          const filtered = categoryAssets.filter(
                            (a) =>
                              (a.AssetName || "").toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                              (a.AssetTagID || "").toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                              (a.Model || "").toLowerCase().includes(assetSearchQuery.toLowerCase()) ||
                              (a.Location || "").toLowerCase().includes(assetSearchQuery.toLowerCase())
                          );
                          const currentSelectedId = selectedReplacement[currentTargetItem?.ID || ""];

                          if (categoryAssets.length === 0) {
                            return (
                              <div style={{ padding: "12px", textAlign: "center", fontSize: "12px", color: "#64748B", background: "#F8FAFC", borderRadius: "8px", border: "1px dashed #CBD5E1" }}>
                                No in-stock replacements found for {currentTargetItem?.Category || "this category"}
                              </div>
                            );
                          }

                          if (filtered.length === 0) {
                            return (
                              <div style={{ padding: "10px", textAlign: "center", fontSize: "12px", color: "#64748B", background: "#F8FAFC", borderRadius: "8px" }}>
                                No matching assets found for "{assetSearchQuery}"
                              </div>
                            );
                          }

                          return (
                            <div style={{ maxHeight: "170px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
                              {filtered.map((asset) => {
                                const isSelected = currentSelectedId === asset.ID;
                                return (
                                  <div
                                    key={asset.ID}
                                    onClick={() => currentTargetItem && setSelectedReplacement((prev) => ({ ...prev, [currentTargetItem.ID]: asset.ID }))}
                                    style={{
                                      padding: "8px 10px",
                                      borderRadius: "8px",
                                      border: isSelected ? "1.5px solid #007ED5" : "1px solid #E2E8F0",
                                      background: isSelected ? "#EFF6FF" : "#FFFFFF",
                                      cursor: "pointer",
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "3px",
                                      transition: "all 0.15s ease",
                                    }}
                                  >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#0F172A" }}>
                                        {asset.AssetName}
                                      </span>
                                      <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", background: "#ECFDF5", color: "#059669" }}>
                                        In Stock
                                      </span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#64748B" }}>
                                      <span style={{ fontFamily: "monospace", fontWeight: 600, color: "#2563EB", background: "#F1F5F9", padding: "1px 5px", borderRadius: "4px" }}>
                                        {asset.AssetTagID}
                                      </span>
                                      <span>•</span>
                                      <span>{asset.Location || "Central Stock"}</span>
                                      {asset.Model && (
                                        <>
                                          <span>•</span>
                                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.Model}</span>
                                        </>
                                      )}
                                      {isSelected && (
                                        <CheckmarkRegular style={{ marginLeft: "auto", color: "#007ED5", fontSize: "14px" }} />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {selectedDecision === "ApproveWriteOff" && (
                      <>
                        <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#1D4ED8" }}>
                          Decommission / Write-Off Justification <span style={{ fontWeight: 400, color: "#64748B" }}>(Optional)</span>
                        </label>
                        <Textarea
                          placeholder="e.g. Asset tag decommissioned from active directory. User already has secondary device..."
                          value={writeOffNotes}
                          onChange={(_, d) => setWriteOffNotes(d.value)}
                          rows={3}
                        />
                      </>
                    )}

                    {selectedDecision === "RequestFIR" && (
                      <>
                        <label style={{ fontSize: "11.5px", fontWeight: 700, color: "#92400E" }}>
                          FIR / Document Requirements <span style={{ color: "#DC2626" }}>*</span>
                        </label>
                        <Textarea
                          placeholder="e.g. Company policy requires an official police FIR acknowledgement for laptops before replacement dispatch..."
                          value={firRequestReason}
                          onChange={(_, d) => setFirRequestReason(d.value)}
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
                          placeholder="Explain reason for rejecting this lost asset claim..."
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
              /* Resolved Summary Card */
              <DecisionSummaryCard
                status={request.RequestStatus}
                decidedReason="Lost asset report reviewed, security MDM remote wipe confirmed, and hardware status closed."
                extraDetails={[
                  { label: "Reported Assets", value: `${items.length} Assets` },
                  { label: "Police FIR Status", value: request.PoliceReportFiled ? "FIR on file" : "None" },
                ]}
              />
            )}

            {/* Security Protocol Box */}
            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                fontSize: "12px",
                color: "#991B1B",
                lineHeight: 1.5,
              }}
            >
              🔒 <strong>Security Protocol:</strong> Ensure remote lock & wipe via Microsoft Intune has been initiated for all lost portable assets.
            </div>
          </div>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default LostIncidentDetailsPanel;
