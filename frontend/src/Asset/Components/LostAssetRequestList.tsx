import React, { useMemo, useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
  Button,
  Text,
  Badge,
  Spinner,
  Textarea,
  Dropdown,
  Option,
  Divider,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { CheckmarkCircleRegular, DismissCircleRegular, WarningRegular } from "@fluentui/react-icons";
import TruncatedText from "../../Common/TruncatedText";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import {
  AssetLostRequestRecord,
  AssetLostRequestItemRecord,
  LostRequestStatus,
  getAssetLostRequestById,
  adminActionOnLostRequestItem,
  assignReplacementForLostItem,
} from "../Services/AssetLostRequestService";
import { getAvailableAssetsForCategory, AvailableAssetOption } from "../Services/AssetInventoryService";
import { useAuth } from "../../Auth/AuthProvider";

const STATUS_COLOR: Record<LostRequestStatus, "warning" | "informative" | "success"> = {
  Pending: "warning",
  InProgress: "informative",
  Completed: "success",
};

const ITEM_STATUS_COLOR: Record<string, "warning" | "informative" | "success" | "danger"> = {
  PendingManagerApproval: "warning",
  Pending: "warning",
  AwaitingReplacement: "informative",
  Replaced: "success",
  Rejected: "danger",
};

const STATUS_TABS: { label: string; value: LostRequestStatus | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Pending", value: "Pending" },
  { label: "In Progress", value: "InProgress" },
  { label: "Completed", value: "Completed" },
];

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

interface ItemRowProps {
  item: AssetLostRequestItemRecord;
  onChanged: () => void;
}

const ItemRow: React.FC<ItemRowProps> = ({ item, onChanged }) => {
  const { currentUser } = useAuth();
  const { mountNode } = useThemedMountNode();
  const toasterId = useId("lost-item-row-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [acting, setActing] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [overriding, setOverriding] = useState(false);
  const [reason, setReason] = useState("");
  const [replacementAssetId, setReplacementAssetId] = useState<string>("");
  const [availableAssets, setAvailableAssets] = useState<AvailableAssetOption[]>([]);
  const isOverride = item.ItemStatus === "PendingManagerApproval";
  const decidable = item.ItemStatus === "Pending" || (isOverride && overriding);

  const loadAvailable = () => {
    if (!item.Category) return;
    getAvailableAssetsForCategory(item.Category)
      .then(setAvailableAssets)
      .catch(() => {});
  };

  const notify = (message: string, intent: "success" | "error") =>
    dispatchToast(
      <Toast>
        <ToastTitle>{message}</ToastTitle>
      </Toast>,
      { intent }
    );

  const handleApprove = async () => {
    if (!currentUser?.userID) return;
    setActing(true);
    try {
      await adminActionOnLostRequestItem(
        item.ID,
        "Approve",
        currentUser.userID,
        currentUser.displayName,
        replacementAssetId || null,
        undefined,
        isOverride
      );
      notify("Item approved", "success");
      onChanged();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to record decision", "error");
    } finally {
      setActing(false);
    }
  };

  const handleReject = async () => {
    if (!currentUser?.userID || !reason.trim()) return;
    setActing(true);
    try {
      await adminActionOnLostRequestItem(
        item.ID,
        "Reject",
        currentUser.userID,
        currentUser.displayName,
        null,
        reason.trim(),
        isOverride
      );
      notify("Item rejected", "success");
      onChanged();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to record decision", "error");
    } finally {
      setActing(false);
    }
  };

  const handleAssignReplacement = async () => {
    if (!currentUser?.userID || !replacementAssetId) return;
    setActing(true);
    try {
      await assignReplacementForLostItem(item.ID, replacementAssetId, currentUser.userID, currentUser.displayName);
      notify("Replacement assigned", "success");
      onChanged();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Failed to assign replacement", "error");
    } finally {
      setActing(false);
    }
  };

  return (
    <div style={{ padding: "12px 0", borderBottom: "1px solid #F3F2F1" }}>
      <Toaster toasterId={toasterId} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <TruncatedText text={`${item.Category ?? "Unknown"} — ${item.AssetName} (${item.AssetTagID})`} weight="medium" size={200} />
        <Badge appearance="tint" color={ITEM_STATUS_COLOR[item.ItemStatus] ?? "informative"}>
          {item.ItemStatus === "AwaitingReplacement"
            ? "Awaiting Replacement"
            : item.ItemStatus === "PendingManagerApproval"
              ? "Awaiting Manager Approval"
              : item.ItemStatus}
        </Badge>
      </div>

      {item.ItemStatus === "Rejected" && item.RejectionReason && (
        <Text size={200} style={{ color: "#D13438", display: "block", marginTop: "4px" }}>
          Reason: {item.RejectionReason}
        </Text>
      )}
      {item.ItemStatus === "Replaced" && item.ReplacementAssetName && (
        <Text size={200} style={{ color: "#107C10", display: "block", marginTop: "4px" }}>
          Replaced with: {item.ReplacementAssetName} ({item.ReplacementAssetTagID})
          {item.IsAdminOverride && " — Admin Override"}
        </Text>
      )}

      {isOverride && !overriding && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
          <Button appearance="outline" size="small" icon={<WarningRegular />} onClick={() => setOverriding(true)}>
            Override & Decide
          </Button>
        </div>
      )}

      {isOverride && overriding && (
        <Text size={200} style={{ color: "#B8860B", display: "block", marginTop: "8px" }}>
          ⚠ Manager hasn't approved this report yet. Deciding now will override that step.
        </Text>
      )}

      {decidable && !rejecting && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <Dropdown
            placeholder="Assign replacement now (optional)"
            mountNode={mountNode}
            size="small"
            value={availableAssets.find((o) => o.ID === replacementAssetId)?.AssetName ?? ""}
            onOpenChange={(_, d) => d.open && loadAvailable()}
            onOptionSelect={(_, d) => setReplacementAssetId(d.optionValue ?? "")}
          >
            {availableAssets.length === 0 ? (
              <Option key="none" value="" text="No in-stock assets available" disabled>
                No in-stock assets available
              </Option>
            ) : (
              availableAssets.map((option) => (
                <Option key={option.ID} value={option.ID} text={option.AssetName}>
                  {option.AssetName} ({option.AssetTagID})
                </Option>
              ))
            )}
          </Dropdown>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Button appearance="outline" size="small" icon={<DismissCircleRegular />} disabled={acting} onClick={() => setRejecting(true)}>
              Reject
            </Button>
            <Button
              appearance="primary"
              size="small"
              style={{ background: "#007ED5", borderColor: "#007ED5" }}
              icon={acting ? <Spinner size="tiny" /> : <CheckmarkCircleRegular />}
              disabled={acting}
              onClick={handleApprove}
            >
              Approve
            </Button>
          </div>
        </div>
      )}

      {decidable && rejecting && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
          <Textarea placeholder="Reason for rejecting this item..." value={reason} onChange={(_, d) => setReason(d.value)} rows={2} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Button appearance="secondary" size="small" disabled={acting} onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              size="small"
              disabled={acting || !reason.trim()}
              icon={acting ? <Spinner size="tiny" /> : undefined}
              onClick={handleReject}
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      )}

      {item.ItemStatus === "AwaitingReplacement" && (
        <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
          <Dropdown
            placeholder="Select an in-stock asset..."
            mountNode={mountNode}
            size="small"
            style={{ flex: 1 }}
            value={availableAssets.find((o) => o.ID === replacementAssetId)?.AssetName ?? ""}
            onOpenChange={(_, d) => d.open && loadAvailable()}
            onOptionSelect={(_, d) => setReplacementAssetId(d.optionValue ?? "")}
          >
            {availableAssets.length === 0 ? (
              <Option key="none" value="" text="No in-stock assets available" disabled>
                No in-stock assets available
              </Option>
            ) : (
              availableAssets.map((option) => (
                <Option key={option.ID} value={option.ID} text={option.AssetName}>
                  {option.AssetName} ({option.AssetTagID})
                </Option>
              ))
            )}
          </Dropdown>
          <Button
            appearance="primary"
            size="small"
            style={{ background: "#007ED5", borderColor: "#007ED5" }}
            disabled={acting || !replacementAssetId}
            icon={acting ? <Spinner size="tiny" /> : undefined}
            onClick={handleAssignReplacement}
          >
            Assign
          </Button>
        </div>
      )}
    </div>
  );
};

interface LostAssetRequestListProps {
  requests: AssetLostRequestRecord[];
  onActionComplete: () => void;
}

const LostAssetRequestList: React.FC<LostAssetRequestListProps> = ({ requests, onActionComplete }) => {
  const toasterId = useId("lost-asset-request-list-toaster");
  const { dispatchToast } = useToastController(toasterId);
  const [activeTab, setActiveTab] = useState<LostRequestStatus | "All">("All");
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [itemsByRequest, setItemsByRequest] = useState<Record<string, AssetLostRequestItemRecord[]>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const statusTabCounts = useMemo(() => {
    const counts = { All: requests.length } as Record<LostRequestStatus | "All", number>;
    STATUS_TABS.forEach((tab) => {
      if (tab.value === "All") return;
      counts[tab.value] = requests.filter((r) => r.RequestStatus === tab.value).length;
    });
    return counts;
  }, [requests]);

  const filteredRequests = useMemo(
    () => (activeTab === "All" ? requests : requests.filter((r) => r.RequestStatus === activeTab)),
    [requests, activeTab]
  );

  const loadItems = (requestId: string) => {
    setLoadingId(requestId);
    getAssetLostRequestById(requestId)
      .then(({ items }) => setItemsByRequest((prev) => ({ ...prev, [requestId]: items })))
      .catch((error) =>
        dispatchToast(
          <Toast>
            <ToastTitle>{error instanceof Error ? error.message : "Failed to load request items"}</ToastTitle>
          </Toast>,
          { intent: "error" }
        )
      )
      .finally(() => setLoadingId(null));
  };

  const handleToggle = (_: unknown, data: { value: unknown; openItems: string[] }) => {
    setOpenItems(data.openItems);
    const value = data.value as string;
    if (data.openItems.includes(value) && !itemsByRequest[value]) {
      loadItems(value);
    }
  };

  const handleItemChanged = (requestId: string) => {
    loadItems(requestId);
    onActionComplete();
  };

  if (requests.length === 0) {
    return <Text style={{ color: "#605E5C", padding: "20px 0" }}>No lost asset requests found.</Text>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Toaster toasterId={toasterId} />
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {STATUS_TABS.map((tab) => (
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
        <Text style={{ color: "#64748b", padding: "20px 0" }}>No requests match this filter.</Text>
      ) : (
        <Accordion collapsible openItems={openItems} onToggle={handleToggle}>
          {filteredRequests.map((request) => (
            <AccordionItem key={request.ID} value={request.ID}>
              <AccordionHeader>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: "10px", paddingRight: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                    <WarningRegular style={{ color: "#D13438", flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <TruncatedText text={request.RequestNumber ?? request.ID} weight="semibold" size={300} />
                      <Text size={200} style={{ color: "#605E5C" }}>
                        {request.EmployeeName ?? "Unknown"} · reported by {request.ReportedByName ?? "Unknown"} (
                        {request.ReportedByRole}) · {formatDate(request.LostDate)}
                      </Text>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Badge appearance="tint" color="danger">
                      {request.ItemCount} asset{request.ItemCount === 1 ? "" : "s"}
                    </Badge>
                    <Badge appearance="tint" color={STATUS_COLOR[request.RequestStatus]}>
                      {request.RequestStatus === "InProgress" ? "In Progress" : request.RequestStatus}
                    </Badge>
                  </div>
                </div>
              </AccordionHeader>
              <AccordionPanel>
                <div style={{ paddingBottom: "8px" }}>
                  <Text size={200} style={{ color: "#605E5C", display: "block", marginBottom: "8px" }}>
                    How lost: {request.HowLost}
                  </Text>
                  {request.AdditionalDetails && (
                    <Text size={200} style={{ color: "#605E5C", display: "block", marginBottom: "8px", whiteSpace: "pre-wrap" }}>
                      {request.AdditionalDetails}
                    </Text>
                  )}
                  <Divider style={{ margin: "8px 0" }} />
                  {loadingId === request.ID ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
                      <Spinner size="small" label="Loading items..." />
                    </div>
                  ) : (
                    (itemsByRequest[request.ID] ?? []).map((item) => (
                      <ItemRow key={item.ID} item={item} onChanged={() => handleItemChanged(request.ID)} />
                    ))
                  )}
                </div>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default LostAssetRequestList;
