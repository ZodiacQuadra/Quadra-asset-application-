import React from "react";
import { Card, Checkbox, Badge } from "@fluentui/react-components";
import AssetIcon from "./AssetIcon";
import TruncatedText from "../../Common/TruncatedText";
import { UserAssignedAsset } from "../Services/AssetEmployeeService";

interface AssetCardGridProps {
  assets: UserAssignedAsset[];
  onSelect: (asset: UserAssignedAsset) => void;
  cardHeight?: string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (asset: UserAssignedAsset) => void;
  pendingLostAssetIds?: Set<string>;
}

const AssetCardGrid: React.FC<AssetCardGridProps> = ({
  assets,
  onSelect,
  cardHeight = "140px",
  selectable = false,
  selectedIds,
  onToggleSelect,
  pendingLostAssetIds,
}) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "18px" }}>
    {assets.map((asset) => {
      const isSelected = selectedIds?.has(asset.AssetID) ?? false;
      const isPendingLost = pendingLostAssetIds?.has(asset.AssetID) ?? false;
      return (
        <div
          key={asset.MappingID}
          className="quadra-glass-card"
          style={{
            padding: 0,
            borderRadius: "16px",
            overflow: "hidden",
            cursor: "pointer",
            border: isSelected ? "2px solid #007ED5" : "1px solid rgba(226, 232, 240, 0.85)",
            position: "relative",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 14px 28px -6px rgba(0, 126, 213, 0.16), 0 8px 12px -4px rgba(0, 0, 0, 0.04)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 20px -2px rgba(0, 0, 0, 0.05)";
          }}
          onClick={() => onSelect(asset)}
        >
          {selectable && (
            <div style={{ position: "absolute", top: "10px", left: "10px", zIndex: 2, background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(4px)", borderRadius: "6px", padding: "2px" }}>
              <Checkbox checked={isSelected} onChange={() => onToggleSelect?.(asset)} onClick={(e) => e.stopPropagation()} />
            </div>
          )}
          <div
            style={{
              width: "100%",
              height: cardHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(180deg, #F8FAFC 0%, #EEF2F6 100%)",
              borderBottom: "1px solid #E2E8F0",
            }}
          >
            <AssetIcon category={asset.Category} name={asset.AssetName} size="lg" />
          </div>
          <div style={{ padding: "16px", minWidth: 0, background: "rgba(255, 255, 255, 0.7)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <TruncatedText text={asset.Category} weight="semibold" size={400} color="#0f172a" />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#007ED5", background: "rgba(0, 126, 213, 0.08)", padding: "2px 6px", borderRadius: "4px" }}>
                {asset.AssetTagID}
              </span>
            </div>
            <TruncatedText
              text={asset.Description || asset.Model || asset.AssetName}
              size={200}
              color="#64748b"
              style={{ marginTop: "4px" }}
            />
            {isPendingLost && (
              <Badge appearance="tint" color="warning" style={{ marginTop: "8px" }}>
                Reported Lost — Pending Review
              </Badge>
            )}
          </div>
        </div>
      );
    })}
  </div>
);

export default AssetCardGrid;
