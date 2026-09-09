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
  Input,
  Spinner,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { Dismiss24Regular, AddCircleRegular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { getAssetCategoryComponents, AssetCategoryComponentRecord } from "../Services/AssetCategoryComponentService";
import { createAssetUpgradeRequest, getAssetUpgradeRequests } from "../Services/AssetUpgradeRequestService";
import { getAssetComponentSpecs } from "../Services/AssetInventoryService";

interface RequestHardwareUpgradePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  categoryId: string;
  categoryName: string;
  onSubmitted: () => void;
}

const RequestHardwareUpgradePanel: React.FC<RequestHardwareUpgradePanelProps> = ({
  open,
  onOpenChange,
  assetId,
  categoryId,
  categoryName,
  onSubmitted,
}) => {
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("request-hardware-upgrade-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [components, setComponents] = useState<AssetCategoryComponentRecord[]>([]);
  const [loadingComponents, setLoadingComponents] = useState(false);
  const [currentSpecsByComponent, setCurrentSpecsByComponent] = useState<Record<string, string>>({});
  const [pendingComponentIds, setPendingComponentIds] = useState<Set<string>>(new Set());
  const [componentId, setComponentId] = useState("");
  const [currentSpec, setCurrentSpec] = useState("");
  const [currentSpecLocked, setCurrentSpecLocked] = useState(false);
  const [requiredSpec, setRequiredSpec] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !currentUser?.userID) return;
    setComponentId("");
    setCurrentSpec("");
    setCurrentSpecLocked(false);
    setRequiredSpec("");
    setReason("");
    setError(null);
    setLoadingComponents(true);
    Promise.all([
      getAssetCategoryComponents(categoryId),
      getAssetComponentSpecs(assetId),
      getAssetUpgradeRequests({ userId: currentUser.userID }),
    ])
      .then(([componentData, specData, myRequests]) => {
        setComponents(componentData);
        const map: Record<string, string> = {};
        specData.forEach((s) => {
          if (s.SpecValue) map[s.ComponentID] = s.SpecValue;
        });
        setCurrentSpecsByComponent(map);
        setPendingComponentIds(
          new Set(
            myRequests
              .filter((r) => r.ReqStatus === "Pending" || r.ReqStatus === "AdminApprovalPending")
              .map((r) => r.ComponentName)
          )
        );
      })
      .catch((err) => {
        dispatchToast(
          <Toast>
            <ToastTitle>{err instanceof Error ? err.message : "Failed to load components"}</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      })
      .finally(() => setLoadingComponents(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, categoryId, assetId, currentUser?.userID]);

  const handleComponentSelect = (selectedComponentId: string) => {
    setComponentId(selectedComponentId);
    setError(null);
    const knownValue = currentSpecsByComponent[selectedComponentId];
    if (knownValue) {
      setCurrentSpec(knownValue);
      setCurrentSpecLocked(true);
    } else {
      setCurrentSpec("");
      setCurrentSpecLocked(false);
    }
  };

  const hasPendingRequestForSelected = componentId ? pendingComponentIds.has(componentId) : false;

  const handleSubmit = async () => {
    if (!componentId) {
      setError("Please select a component to upgrade.");
      return;
    }
    if (hasPendingRequestForSelected) {
      setError("You already have a pending upgrade request for this component. Wait for it to be decided first.");
      return;
    }
    if (!currentSpec.trim() || !requiredSpec.trim()) {
      setError("Current and Requested Specification are required.");
      return;
    }
    if (!currentUser?.userID) return;

    setSubmitting(true);
    setError(null);
    try {
      await createAssetUpgradeRequest({
        CategoryID: categoryId,
        ComponentID: componentId,
        CurrentSpecification: currentSpec.trim(),
        RequiredSpecfication: requiredSpec.trim(),
        ReasonForUpgrade: reason.trim() || undefined,
        requestedByUserId: currentUser.userID,
        AssetID: assetId,
      });
      dispatchToast(
        <Toast>
          <ToastTitle>Upgrade request submitted</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      onOpenChange(false);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer type="overlay" separator open={open} position="end" onOpenChange={(_, data) => onOpenChange(data.open)} style={{ width: "min(480px, 90vw)" }}>
      <Toaster toasterId={toasterId} />
      {portal}
      <DrawerHeader>
        <DrawerHeaderTitle
          action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onOpenChange(false)} />}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "#E7F5EC", borderRadius: "8px", padding: "8px", color: "#107C10" }}>
              <AddCircleRegular />
            </div>
            Request Hardware Upgrade
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "8px" }}>
          <Field label="Component to Upgrade" required>
            <Dropdown
              placeholder={loadingComponents ? "Loading..." : "Select Component"}
              mountNode={mountNode}
              disabled={loadingComponents}
              value={components.find((c) => c.ID === componentId)?.ComponentName ?? ""}
              onOptionSelect={(_, d) => handleComponentSelect(d.optionValue ?? "")}
            >
              {components.length === 0 ? (
                <Option key="none" value="" disabled>
                  {loadingComponents ? "Loading..." : `No components configured for ${categoryName}`}
                </Option>
              ) : (
                components.map((c) => (
                  <Option key={c.ID} value={c.ID} text={c.ComponentName}>
                    {c.ComponentName}
                    {pendingComponentIds.has(c.ID) ? " (request pending)" : ""}
                  </Option>
                ))
              )}
            </Dropdown>
          </Field>

          {hasPendingRequestForSelected && (
            <Text style={{ color: "#B8860B" }}>
              You already have a pending upgrade request for this component. Wait for it to be decided before submitting another.
            </Text>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <Field
              label="Current Specification"
              required
              // hint={currentSpecLocked ? "Auto-filled from the asset's recorded specs" : undefined}
            >
              <Input
                placeholder="e.g., 16GB DDR4"
                value={currentSpec}
                disabled={currentSpecLocked}
                onChange={(_, d) => setCurrentSpec(d.value)}
              />
            </Field>
            <Field label="Requested Specification" required>
              <Input placeholder="e.g., 32GB DDR4" value={requiredSpec} onChange={(_, d) => setRequiredSpec(d.value)} />
            </Field>
          </div>

          <Field label="Reason for Upgrade">
            <Textarea
              placeholder="Please explain why you need this upgrade and how it will improve your productivity..."
              resize="vertical"
              rows={5}
              value={reason}
              onChange={(_, d) => setReason(d.value)}
            />
          </Field>

          {error && <Text style={{ color: "var(--colorPaletteRedForeground1)" }}>{error}</Text>}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <Button appearance="primary" onClick={handleSubmit} disabled={submitting || hasPendingRequestForSelected}>
              {submitting ? <Spinner size="tiny" /> : "Submit Request"}
            </Button>
          </div>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default RequestHardwareUpgradePanel;
