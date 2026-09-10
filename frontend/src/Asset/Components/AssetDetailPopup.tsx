import React from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, Button, Text, Badge, Divider } from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { getCategoryIcon } from "../Utils/categoryIcon";
import { AssetInventoryRecord, AssetStatus } from "../Services/AssetInventoryService";

const STATUS_COLOR: Record<AssetStatus, "success" | "warning" | "informative" | "danger" | "brand"> = {
  "In Stock": "success",
  Assigned: "informative",
  "In Use": "informative",
  "Under Maintenance": "warning",
  "End of Use": "danger",
  Reserved: "brand",
  Lost: "danger",
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", gap: "16px", borderBottom: "1px solid #F3F2F1" }}>
    <Text size={300} style={{ color: "#605E5C" }}>
      {label}
    </Text>
    <Text size={300} weight="medium" style={{ textAlign: "right" }}>
      {value}
    </Text>
  </div>
);

interface AssetDetailPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: AssetInventoryRecord | null;
}

// 750px modal popup matching Sample Screenshot 1, opened from the Purchase Date calendar.
const AssetDetailPopup: React.FC<AssetDetailPopupProps> = ({ open, onOpenChange, asset }) => {
  const navigate = useNavigate();

  if (!asset) return null;

  const handleViewFullDetails = () => {
    onOpenChange(false);
    if (asset.Category === "Furniture" || asset.Category === "Projector") {
      navigate(`/Asset/non-it-assets/${asset.ID}`);
    } else {
      navigate(`/Asset/inventory/${asset.ID}`);
    }
  };

  const getStatusBadgeStyle = (status: AssetStatus) => {
    switch (status) {
      case "Lost":
        return { background: "#FFF1F2", color: "#E11D48", border: "1px solid #FFE4E6" };
      case "In Stock":
        return { background: "#ECFDF5", color: "#059669", border: "1px solid #A7F3D0" };
      case "Assigned":
        return { background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE" };
      case "Under Maintenance":
        return { background: "#FFFBEB", color: "#D97706", border: "1px solid #FDE68A" };
      default:
        return { background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0" };
    }
  };

  const badgeStyle = getStatusBadgeStyle(asset.Status);

  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      <DialogSurface
        style={{
          width: "min(780px, 94vw)",
          maxWidth: "780px",
          borderRadius: "16px",
          padding: "24px 30px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <DialogBody style={{ padding: 0 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, fontSize: "19px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
              Asset Details
            </h3>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              style={{
                background: "transparent",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "#64748B",
              }}
              aria-label="Close dialog"
            >
              <Dismiss24Regular style={{ fontSize: "16px" }} />
            </button>
          </div>

          <DialogContent style={{ padding: 0 }}>
            {/* Hero Row matching Screenshot 1 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "10px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    color: "#007ED5",
                  }}
                >
                  {getCategoryIcon(asset.Category)}
                </div>
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                    {asset.AssetName}
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
                    {asset.AssetTagID}
                  </div>
                </div>
              </div>

              {/* Status Pill Badge matching Screenshot 1 */}
              <div
                style={{
                  ...badgeStyle,
                  padding: "4px 14px",
                  borderRadius: "20px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  display: "inline-block",
                }}
              >
                {asset.Status}
              </div>
            </div>

            <Divider style={{ margin: "0 0 8px" }} />

            {/* 2-Column Info Grid matching Screenshot 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 36px" }}>
              <div>
                <InfoRow label="Category" value={asset.Category} />
                <InfoRow label="Model" value={asset.Model ?? "-"} />
                <InfoRow label="Purchased Date" value={formatDate(asset.PurchasedDate)} />
                <InfoRow label="Cost" value={asset.Cost != null ? `₹${asset.Cost.toLocaleString("en-IN")}` : "-"} />
                <InfoRow label="Location" value={asset.LocationName ?? asset.Location ?? "-"} />
                <InfoRow label="Assigned To" value={asset.AssignedToName ?? "Unassigned"} />
              </div>
              <div>
                <InfoRow label="Brand" value={asset.BrandName ?? asset.Brand ?? "-"} />
                <InfoRow label="Serial No." value={asset.SerialNo ?? "-"} />
                <InfoRow label="Expiry Date" value={formatDate(asset.ExpireDate)} />
                <InfoRow label="Vendor" value={asset.VendorName ?? "-"} />
                <InfoRow label="Site" value={asset.Site ?? "-"} />
                <InfoRow label="Department" value={asset.AssignedToDepartment ?? "-"} />
              </div>
            </div>

            {asset.Description && (
              <div style={{ marginTop: "16px", background: "#F8FAFC", padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748B", display: "block" }}>Description</span>
                <span style={{ fontSize: "13px", color: "#334155" }}>{asset.Description}</span>
              </div>
            )}

            {/* Action Bar matching Screenshot 1 */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
              <Button
                appearance="primary"
                onClick={handleViewFullDetails}
                style={{
                  background: "#007ED5",
                  color: "#FFFFFF",
                  borderRadius: "6px",
                  fontWeight: 600,
                  fontSize: "13.5px",
                  padding: "8px 20px",
                }}
              >
                View Full Details
              </Button>
            </div>
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default AssetDetailPopup;
