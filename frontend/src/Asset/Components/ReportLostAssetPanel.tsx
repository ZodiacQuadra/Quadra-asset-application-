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
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                background: "#FEF2F2",
                color: "#EF4444",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
                flexShrink: 0,
              }}
            >
              <WarningRegular />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                Report Lost Hardware
              </div>
              <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 400 }}>
                Notify IT & Facilities of missing or lost company assets
              </div>
            </div>
          </div>
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Employee Card */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "16px",
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "11.5px", color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Affected Employee
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", marginTop: "2px" }}>
                {employeeName}
              </div>
            </div>
            <span
              style={{
                fontSize: "11.5px",
                fontWeight: 700,
                background: "#FEF2F2",
                color: "#EF4444",
                padding: "4px 12px",
                borderRadius: "9999px",
                border: "1px solid #FECACA",
              }}
            >
              {assets.length} Asset{assets.length === 1 ? "" : "s"} Affected
            </span>
          </div>

          {/* Assets Section Card */}
          <div
            style={{
              background: "#F8FAFC",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Text weight="bold" style={{ color: "#0F172A", fontSize: 13.5 }}>
                Selected Hardware
              </Text>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748B" }}>
                To be marked Lost
              </span>
            </div>

            {assets.map((asset) => (
              <div
                key={asset.MappingID}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  padding: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 600, fontSize: "14px", color: "#0F172A" }}>
                    {asset.AssetName}
                  </div>
                  <span
                    style={{
                      fontSize: "11.5px",
                      background: "#F1F5F9",
                      color: "#475569",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      fontWeight: 600,
                    }}
                  >
                    {asset.AssetTagID}
                  </span>
                </div>
                <div style={{ fontSize: "12.5px", color: "#64748B" }}>
                  Category: {asset.Category}
                </div>
                {reportedByRole === "Admin" && (
                  <div style={{ marginTop: "4px" }}>
                    <Dropdown
                      placeholder="Assign replacement now (optional)"
                      mountNode={mountNode}
                      size="small"
                      style={{ width: "100%", borderRadius: "8px" }}
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
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Incident Details Card */}
          <div
            style={{
              background: "#F8FAFC",
              borderRadius: "16px",
              border: "1px solid #E2E8F0",
              padding: "18px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Text weight="bold" style={{ color: "#0F172A", fontSize: 13.5 }}>
                Incident Information
              </Text>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#EF4444", background: "#FEF2F2", padding: "2px 8px", borderRadius: 9999 }}>
                Required
              </span>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Date Lost <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <Input
                type="date"
                style={{ width: "100%", borderRadius: 10, background: "#FFFFFF" }}
                value={lostDate}
                onChange={(_, d) => setLostDate(d.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                How was it lost? <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <Input
                style={{ width: "100%", borderRadius: 10, background: "#FFFFFF" }}
                placeholder="e.g. Left in a cab, stolen from bag, misplaced while traveling..."
                value={howLost}
                onChange={(_, d) => setHowLost(d.value)}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Additional Details (Optional)
              </label>
              <Textarea
                style={{ width: "100%", borderRadius: 10, background: "#FFFFFF" }}
                placeholder="Any other relevant information (police report, transit details, etc.)..."
                resize="vertical"
                rows={3}
                value={additionalDetails}
                onChange={(_, d) => setAdditionalDetails(d.value)}
              />
            </div>
          </div>

          {reportedByRole === "Admin" && (
            <div style={{ padding: "12px 14px", borderRadius: "12px", background: "#FFFBEB", border: "1px solid #FDE68A", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <WarningRegular style={{ color: "#D97706", fontSize: "18px", flexShrink: 0, marginTop: "2px" }} />
              <Text size={200} style={{ color: "#92400E", lineHeight: 1.4 }}>
                This will immediately mark the selected asset(s) as Lost. Assets left without a replacement chosen will wait
                here until stock is available.
              </Text>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "12px", paddingTop: "16px", borderTop: "1px solid #E2E8F0" }}>
            <Button appearance="secondary" onClick={() => onOpenChange(false)} disabled={submitting} style={{ borderRadius: "25px", padding: "8px 22px" }}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              style={{
                background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)",
                borderRadius: "25px",
                padding: "8px 24px",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(239, 68, 68, 0.25)",
              }}
              onClick={handleSubmit}
              disabled={submitting || assets.length === 0}
              icon={submitting ? <Spinner size="tiny" /> : undefined}
            >
              {submitting ? "Submitting..." : "Report Lost"}
            </Button>
          </div>
        </div>
      </DrawerBody>
    </Drawer>
  );
};

export default ReportLostAssetPanel;
