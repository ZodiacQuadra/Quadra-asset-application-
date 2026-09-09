import React from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, Button, Text, Badge, Divider } from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { getCategoryIcon } from "../Utils/categoryIcon";
import { AssetInventoryRecord, AssetStatus } from "../Services/AssetInventoryService";

const STATUS_COLOR: Record<AssetStatus, "success" | "warning" | "informative" | "danger" | "brand"> = {
  "In Stock": "success",
  Assigned: "informative",
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

// 75-85% width / 80% height popup, opened from the Purchase Date calendar.
const AssetDetailPopup: React.FC<AssetDetailPopupProps> = ({ open, onOpenChange, asset }) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(_, d) => onOpenChange(d.open)}>
      <DialogSurface style={{ width: "80vw", maxWidth: "80vw", height: "80vh", maxHeight: "80vh" }}>
        <DialogBody style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          <DialogTitle
            action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onOpenChange(false)} />}
          >
            Asset Details
          </DialogTitle>
          <DialogContent style={{ flex: 1, overflowY: "auto" }}>
            {asset && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "10px",
                      background: "#F3F2F1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "26px",
                      color: "#5B5FC7",
                    }}
                  >
                    {getCategoryIcon(asset.Category)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text size={500} weight="semibold">
                      {asset.AssetName}
                    </Text>
                    <br />
                    <Text size={200} style={{ color: "#605E5C" }}>
                      {asset.AssetTagID}
                    </Text>
                  </div>
                  <Badge appearance="tint" color={STATUS_COLOR[asset.Status]} size="large">
                    {asset.Status}
                  </Badge>
                </div>

                <Divider style={{ margin: "20px 0" }} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                  <InfoRow label="Category" value={asset.Category} />
                  <InfoRow label="Brand" value={asset.BrandName ?? "-"} />
                  <InfoRow label="Model" value={asset.Model ?? "-"} />
                  <InfoRow label="Serial No." value={asset.SerialNo ?? "-"} />
                  <InfoRow label="Purchased Date" value={formatDate(asset.PurchasedDate)} />
                  <InfoRow label="Expiry Date" value={formatDate(asset.ExpireDate)} />
                  <InfoRow label="Cost" value={asset.Cost != null ? `₹${asset.Cost.toLocaleString("en-IN")}` : "-"} />
                  <InfoRow label="Vendor" value={asset.VendorName ?? "-"} />
                  <InfoRow label="Location" value={asset.LocationName ?? "-"} />
                  <InfoRow label="Site" value={asset.Site ?? "-"} />
                  <InfoRow label="Assigned To" value={asset.AssignedToName ?? "Unassigned"} />
                  <InfoRow label="Department" value={asset.AssignedToDepartment ?? "-"} />
                </div>

                {asset.Description && (
                  <>
                    <Text weight="semibold" style={{ display: "block", marginTop: "20px" }}>
                      Description
                    </Text>
                    <Text size={300} style={{ display: "block", marginTop: "6px" }}>
                      {asset.Description}
                    </Text>
                  </>
                )}

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                  <Button appearance="primary" onClick={() => navigate(`/Asset/inventory/${asset.ID}`)}>
                    View Full Details
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default AssetDetailPopup;
