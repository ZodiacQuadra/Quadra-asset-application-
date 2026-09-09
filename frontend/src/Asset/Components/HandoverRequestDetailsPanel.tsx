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
  Spinner,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { Dismiss24Regular, ArrowSwapRegular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import TruncatedText from "../../Common/TruncatedText";
import HandoverItemsTable from "./HandoverItemsTable";
import {
  getAssetHandoverRequestDetail,
  updateAssetHandoverRequestItem,
  AssetHandoverRequestDetail,
  HandoverItemStatus,
  HandoverRequestStatus,
} from "../Services/AssetHandoverRequestService";

const STATUS_COLOR: Record<HandoverRequestStatus, "warning" | "informative" | "success"> = {
  Pending: "warning",
  InProgress: "informative",
  Completed: "success",
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

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

  const loadDetail = async () => {
    if (!handoverRequestId) return;
    setLoading(true);
    try {
      const data = await getAssetHandoverRequestDetail(handoverRequestId);
      setDetail(data);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load request details"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && handoverRequestId) {
      loadDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, handoverRequestId]);

  const handleActionItem = async (itemId: string, status: Exclude<HandoverItemStatus, "Pending">, remarks: string) => {
    if (!currentUser?.userID) return;
    try {
      await updateAssetHandoverRequestItem(itemId, { status, remarks, actionedByUserId: currentUser.userID });
      await loadDetail();
      onActionComplete();
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to update item"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  return (
    <Drawer
      type="overlay"
      separator
      open={open}
      position="end"
      size="large"
      onOpenChange={(_, data) => onOpenChange(data.open)}
      style={{ backgroundColor: "#FFFFFF", background: "#FFFFFF", boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.15)" }}
    >
      <Toaster toasterId={toasterId} />
      <DrawerHeader style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E2E8F0" }}>
        <DrawerHeaderTitle action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onOpenChange(false)} />}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "#E7F5EC", borderRadius: "8px", padding: "8px", color: "#107C10" }}>
              <ArrowSwapRegular />
            </div>
            Asset Handover Request
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody style={{ backgroundColor: "#FFFFFF" }}>
        {loading || !detail ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Spinner label="Loading request details..." />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
              <div style={{ minWidth: 0 }}>
                <TruncatedText text={detail.request.HandoverRequestID} weight="semibold" size={400} />
                <TruncatedText
                  text={`${detail.request.RequestedUserName ?? "Unknown"} · ${detail.request.RequestedUserMailID ?? ""}`}
                  size={200}
                  color="#605E5C"
                />
              </div>
              <Badge appearance="tint" color={STATUS_COLOR[detail.request.Status]}>
                {detail.request.Status}
              </Badge>
            </div>

            <Text size={200} style={{ color: "#605E5C" }}>
              Reason: {detail.request.Reason} · Submitted {formatDate(detail.request.CreatedAt)}
            </Text>
            {detail.request.AdditionalNotes && (
              <Text size={200} style={{ color: "#605E5C" }}>
                Notes: {detail.request.AdditionalNotes}
              </Text>
            )}
            {detail.request.ExitID && (
              <Badge appearance="outline" color="warning" size="small" style={{ alignSelf: "flex-start" }}>
                Linked to an active Offboarding case
              </Badge>
            )}

            <Divider />

            <Text weight="semibold">Assets ({detail.items.length})</Text>
            <HandoverItemsTable
              items={detail.items}
              disabled={detail.request.Status === "Completed"}
              onActionItem={handleActionItem}
            />
          </div>
        )}
      </DrawerBody>
    </Drawer>
  );
};

export default HandoverRequestDetailsPanel;
