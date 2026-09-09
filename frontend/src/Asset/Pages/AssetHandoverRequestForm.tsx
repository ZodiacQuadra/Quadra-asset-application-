import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Text,
  Spinner,
  Field,
  Dropdown,
  Option,
  Textarea,
  Checkbox,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { ArrowLeftRegular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import TruncatedText from "../../Common/TruncatedText";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import AssetIcon from "../Components/AssetIcon";
import { getUserAssignedAssets, UserAssignedAsset } from "../Services/AssetEmployeeService";
import { createAssetHandoverRequest, HANDOVER_REASON_OPTIONS } from "../Services/AssetHandoverRequestService";

const AssetHandoverRequestForm: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toasterId = useId("asset-handover-request-toaster");
  const { dispatchToast } = useToastController(toasterId);
  const { mountNode, portal } = useThemedMountNode();

  const [assets, setAssets] = useState<UserAssignedAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [reason, setReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.userID) return;
    setLoading(true);
    getUserAssignedAssets(currentUser.userID)
      .then(setAssets)
      .catch((err) => {
        dispatchToast(
          <Toast>
            <ToastTitle>{err instanceof Error ? err.message : "Failed to load your assets"}</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.userID]);

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedAssetIds.size === 0) {
      setError("Select at least one asset to hand over.");
      return;
    }
    if (!reason) {
      setError("Please select a reason for handover.");
      return;
    }
    if (reason === "Other" && !additionalNotes.trim()) {
      setError("Please describe the reason in Additional Notes.");
      return;
    }
    if (!currentUser?.userID) return;

    setSubmitting(true);
    setError(null);
    try {
      const result = await createAssetHandoverRequest({
        requestedByUserId: currentUser.userID,
        requestedByName: currentUser.displayName,
        requestedByMail: currentUser.email,
        reason,
        additionalNotes: additionalNotes.trim() || undefined,
        assetIds: Array.from(selectedAssetIds),
      });
      dispatchToast(
        <Toast>
          <ToastTitle>Handover request {result.HandoverRequestID} submitted</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      navigate("/Asset/my-assets");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit handover request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px", maxWidth: "1100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Button appearance="subtle" icon={<ArrowLeftRegular />} onClick={() => navigate("/Asset/my-assets")} />
          <Text size={600} weight="semibold">
            Request Asset Handover
          </Text>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Spinner label="Loading your assets..." />
          </div>
        ) : assets.length === 0 ? (
          <Card style={{ padding: "40px", textAlign: "center" }}>
            <Text style={{ color: "#605E5C" }}>No assets are currently assigned to you.</Text>
          </Card>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {assets.map((asset) => {
                const selected = selectedAssetIds.has(asset.AssetID);
                return (
                  <Card
                    key={asset.MappingID}
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px",
                      cursor: "pointer",
                      border: selected ? "1.5px solid #007ED5" : "1px solid #E1DFDD",
                    }}
                    onClick={() => toggleAsset(asset.AssetID)}
                  >
                    <Checkbox checked={selected} onChange={() => toggleAsset(asset.AssetID)} onClick={(e) => e.stopPropagation()} />
                    <AssetIcon category={asset.Category} name={asset.AssetName} size="md" />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <TruncatedText text={asset.AssetName || asset.Category} weight="semibold" size={300} />
                      <TruncatedText text={asset.Description || asset.Model} size={200} color="#605E5C" style={{ marginTop: "2px" }} />
                    </div>
                  </Card>
                );
              })}
            </div>

            <Field label="Reason for Handover" required>
              <Dropdown
                placeholder="Select a reason"
                mountNode={mountNode}
                value={reason}
                selectedOptions={reason ? [reason] : []}
                onOptionSelect={(_, data) => setReason(data.optionValue ?? "")}
              >
                {HANDOVER_REASON_OPTIONS.map((r) => (
                  <Option key={r} value={r}>
                    {r}
                  </Option>
                ))}
              </Dropdown>
            </Field>

            <Field label={reason === "Other" ? "Additional Notes" : "Additional Notes (Optional)"} required={reason === "Other"}>
              <Textarea
                placeholder={reason === "Other" ? "Please describe the reason for this handover..." : "Add any additional information..."}
                resize="vertical"
                rows={5}
                value={additionalNotes}
                onChange={(_, data) => setAdditionalNotes(data.value)}
              />
            </Field>

            {error && <Text style={{ color: "var(--colorPaletteRedForeground1)" }}>{error}</Text>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <Button appearance="secondary" onClick={() => navigate("/Asset/my-assets")} disabled={submitting}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Spinner size="tiny" /> : "Submit Request"}
              </Button>
            </div>
          </>
        )}
      </div>
      {portal}
    </>
  );
};

export default AssetHandoverRequestForm;
