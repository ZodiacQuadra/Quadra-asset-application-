import React, { useEffect, useState } from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Text,
  Field,
  Input,
  Textarea,
  Dropdown,
  Option,
  Spinner,
  Divider,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { Dismiss24Regular, WarningRegular } from "@fluentui/react-icons";
import TruncatedText from "../../Common/TruncatedText";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { UserAssignedAsset } from "../Services/AssetEmployeeService";
import { getAvailableAssetsForCategory, AvailableAssetOption } from "../Services/AssetInventoryService";
import { createAssetLostRequest, LostRequestReportedByRole } from "../Services/AssetLostRequestService";

interface ReportLostAssetPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeUserId: string;
  employeeName: string;
  reportedByUserId: string;
  reportedByRole: LostRequestReportedByRole;
  assets: UserAssignedAsset[];
  onCreated: () => void;
}

const todayISO = () => new Date().toISOString().substring(0, 10);

// Shared creation form for Asset Lost Requests — used both by a Manager
// (from Asset Manager Dashboard's Team Assets tab, where the Admin decides
// per item afterward) and directly by an Admin (from EmployeeAssetDetail.tsx,
// where there's no separate reviewer, so a replacement can be picked here
// and the whole thing is resolved immediately). Same panel either way; the
// per-item replacement dropdown only appears for the Admin path.
const ReportLostAssetPanel: React.FC<ReportLostAssetPanelProps> = ({
  open,
  onOpenChange,
  employeeUserId,
  employeeName,
  reportedByUserId,
  reportedByRole,
  assets,
  onCreated,
}) => {
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("report-lost-asset-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [lostDate, setLostDate] = useState(todayISO());
  const [howLost, setHowLost] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [replacementByAsset, setReplacementByAsset] = useState<Record<string, string>>({});
  const [availableByCategory, setAvailableByCategory] = useState<Record<string, AvailableAssetOption[]>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLostDate(todayISO());
    setHowLost("");
    setAdditionalDetails("");
    setReplacementByAsset({});

    if (reportedByRole === "Admin") {
      const categories = Array.from(new Set(assets.map((a) => a.Category)));
      categories.forEach((category) => {
        getAvailableAssetsForCategory(category)
          .then((options) => setAvailableByCategory((prev) => ({ ...prev, [category]: options })))
          .catch(() => {
            /* leave that category's dropdown empty on failure — non-blocking */
          });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, assets, reportedByRole]);

  const handleSubmit = async () => {
    if (!howLost.trim()) {
      dispatchToast(
        <Toast>
          <ToastTitle>Please describe how the asset was lost</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
      return;
    }
    setSubmitting(true);
    try {
      const result = await createAssetLostRequest({
        employeeUserId,
        reportedByUserId,
        reportedByRole,
        lostDate,
        howLost: howLost.trim(),
        additionalDetails: additionalDetails.trim() || undefined,
        items: assets.map((a) => ({
          assetId: a.AssetID,
          replacementAssetId: replacementByAsset[a.AssetID] || null,
        })),
      });
      dispatchToast(
        <Toast>
          <ToastTitle>Lost asset request {result.RequestNumber} submitted</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      onOpenChange(false);
      onCreated();
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to submit lost asset request"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
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
      style={{ width: "min(560px, 92vw)" }}
    >
      {portal}
      <Toaster toasterId={toasterId} />
      <DrawerHeader>
        <DrawerHeaderTitle action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onOpenChange(false)} />}>
          Report Lost Asset{assets.length > 1 ? "s" : ""}
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <div style={{ paddingTop: "8px", paddingBottom: "24px", display: "flex", flexDirection: "column", gap: "4px" }}>
          <Text size={300} style={{ color: "#605E5C" }}>
            For <strong>{employeeName}</strong>
          </Text>

          <div
            style={{
              marginTop: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              padding: "12px",
              border: "1px solid #E1DFDD",
              borderRadius: "10px",
              background: "#FAFAFA",
            }}
          >
            {assets.map((asset) => (
              <div key={asset.MappingID} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                  <TruncatedText text={`${asset.Category} — ${asset.AssetName} (${asset.AssetTagID})`} weight="medium" size={200} />
                </div>
                {reportedByRole === "Admin" && (
                  <Dropdown
                    placeholder="Assign replacement now (optional)"
                    mountNode={mountNode}
                    size="small"
                    value={
                      availableByCategory[asset.Category]?.find((o) => o.ID === replacementByAsset[asset.AssetID])?.AssetName ?? ""
                    }
                    onOptionSelect={(_, d) =>
                      setReplacementByAsset((prev) => ({ ...prev, [asset.AssetID]: d.optionValue ?? "" }))
                    }
                  >
                    {(availableByCategory[asset.Category] ?? []).length === 0 ? (
                      <Option key="none" value="" text={`No in-stock assets available for ${asset.Category}`} disabled>
                        No in-stock assets available for {asset.Category}
                      </Option>
                    ) : (
                      availableByCategory[asset.Category].map((option) => (
                        <Option key={option.ID} value={option.ID} text={option.AssetName}>
                          {option.AssetName} ({option.AssetTagID})
                        </Option>
                      ))
                    )}
                  </Dropdown>
                )}
              </div>
            ))}
          </div>

          <Divider style={{ margin: "16px 0" }} />

          <Field label="Date Lost" required>
            <Input type="date" value={lostDate} onChange={(_, d) => setLostDate(d.value)} />
          </Field>

          <Field label="How was it lost?" required style={{ marginTop: "12px" }}>
            <Input placeholder="e.g. Left in a cab, stolen from bag, misplaced while traveling..." value={howLost} onChange={(_, d) => setHowLost(d.value)} />
          </Field>

          <Field label="Additional Details (Optional)" style={{ marginTop: "12px" }}>
            <Textarea
              placeholder="Any other relevant information..."
              resize="vertical"
              rows={4}
              value={additionalDetails}
              onChange={(_, d) => setAdditionalDetails(d.value)}
            />
          </Field>

          {reportedByRole === "Admin" && (
            <div style={{ marginTop: "12px", padding: "10px 12px", borderRadius: "8px", background: "#FFF4CE", border: "1px solid #F2C811", display: "flex", gap: "8px" }}>
              <WarningRegular style={{ color: "#7A5D00", flexShrink: 0 }} />
              <Text size={200} style={{ color: "#7A5D00" }}>
                This will immediately mark the selected asset(s) as Lost. Assets left without a replacement chosen will wait
                here until stock is available.
              </Text>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
            <Button appearance="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              style={{ background: "#007ED5", borderColor: "#007ED5" }}
              onClick={handleSubmit}
              disabled={submitting || assets.length === 0}
              icon={submitting ? <Spinner size="tiny" /> : undefined}
            >
              Submit
            </Button>
          </div>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default ReportLostAssetPanel;
