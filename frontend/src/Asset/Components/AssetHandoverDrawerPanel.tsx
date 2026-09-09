import React, { useEffect, useState } from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Text,
  Field,
  Dropdown,
  Option,
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
  ArrowSwapRegular,
  CheckmarkCircleRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { createAssetHandoverRequest } from "../Services/AssetHandoverRequestService";

const HANDOVER_REASONS = [
  "Device Upgrade / Replacement",
  "Role Change / Department Transfer",
  "Resignation / Offboarding",
  "Hardware Damaged / Defective",
  "No Longer Required",
  "Other",
];

interface AssetHandoverDrawerPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  assetName: string;
  assetTagId: string;
  category?: string;
  onSubmitted?: () => void;
}

export const AssetHandoverDrawerPanel: React.FC<AssetHandoverDrawerPanelProps> = ({
  open,
  onOpenChange,
  assetId,
  assetName,
  assetTagId,
  category,
  onSubmitted,
}) => {
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("handover-drawer-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [reason, setReason] = useState<string>("Device Upgrade / Replacement");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("Device Upgrade / Replacement");
      setAdditionalNotes("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!currentUser?.userID) {
      setError("User session not found. Please log in again.");
      return;
    }
    if (!reason) {
      setError("Please choose a reason for the handover.");
      return;
    }
    if (reason === "Other" && !additionalNotes.trim()) {
      setError("Please describe the reason in Additional Notes.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await createAssetHandoverRequest({
        requestedByUserId: currentUser.userID,
        requestedByName: currentUser.displayName ?? undefined,
        requestedByMail: currentUser.mailID ?? undefined,
        reason,
        additionalNotes: additionalNotes.trim() || undefined,
        assetIds: [assetId],
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Handover request submitted successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );

      onOpenChange(false);
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to submit asset handover request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      type="overlay"
      separator
      open={open}
      position="end"
      onOpenChange={(_, data) => onOpenChange(data.open)}
      style={{ width: "min(560px, 92vw)", background: "#FFFFFF" }}
    >
      <Toaster toasterId={toasterId} />
      {portal}

      <DrawerHeader style={{ borderBottom: "1px solid #E2E8F0", padding: "16px 24px" }}>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={() => onOpenChange(false)}
            />
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#EFF6FF",
                color: "#007ED5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
              }}
            >
              <ArrowSwapRegular />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                Request Asset Handover
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 400 }}>
                Initiate return or replacement handover for your hardware
              </div>
            </div>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Selected Asset Summary Card */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#007ED5",
                background: "#EBF3FE",
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              {category || "Hardware Asset"}
            </span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748B" }}>
              Tag: {assetTagId}
            </span>
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
              {assetName}
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
              Registered Asset ID: {assetId}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              color: "#10B981",
              fontWeight: 600,
              paddingTop: "6px",
              borderTop: "1px dashed #CBD5E1",
            }}
          >
            <CheckmarkCircleRegular style={{ fontSize: "15px" }} />
            Ready for physical handover inspection by IT / Facilities
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "12px 14px",
              background: "#FEF2F2",
              border: "1px solid #FCA5A5",
              borderRadius: "10px",
              color: "#B91C1C",
              fontSize: "13px",
              lineHeight: 1.4,
            }}
          >
            {error}
          </div>
        )}

        {/* Handover Reason */}
        <Field label="Reason for Handover" required>
          <Dropdown
            mountNode={mountNode}
            placeholder="Select reason"
            value={reason}
            selectedOptions={[reason]}
            onOptionSelect={(_, d) => setReason(d.optionValue ?? "Device Upgrade / Replacement")}
            style={{ width: "100%", borderRadius: "8px" }}
          >
            {HANDOVER_REASONS.map((r) => (
              <Option key={r} value={r} text={r}>
                {r}
              </Option>
            ))}
          </Dropdown>
        </Field>

        {/* Additional Notes */}
        <Field
          label="Additional Details & Asset Condition"
          hint="Mention charger, accessories returned, and physical condition of the device."
        >
          <Textarea
            rows={4}
            resize="vertical"
            placeholder="e.g. Returned with original 65W Dell USB-C adapter and laptop bag. Minor cosmetic scratches on outer lid."
            value={additionalNotes}
            onChange={(_, d) => setAdditionalNotes(d.value)}
            style={{ borderRadius: "8px", width: "100%" }}
          />
        </Field>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "auto",
            paddingTop: "16px",
            borderTop: "1px solid #E2E8F0",
          }}
        >
          <Button appearance="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            disabled={submitting}
            onClick={handleSubmit}
            style={{
              background: "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)",
              fontWeight: 600,
              padding: "8px 20px",
            }}
          >
            {submitting ? <Spinner size="tiny" label="Submitting..." /> : "Submit Handover Request"}
          </Button>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default AssetHandoverDrawerPanel;
