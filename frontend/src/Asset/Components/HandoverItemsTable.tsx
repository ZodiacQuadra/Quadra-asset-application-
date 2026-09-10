import React, { useState } from "react";
import {
  Input,
  Button,
  Badge,
  Spinner,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import {
  CheckmarkCircleRegular,
  WarningRegular,
  DismissCircleRegular,
  BoxRegular,
  CheckmarkRegular,
} from "@fluentui/react-icons";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import {
  AssetHandoverRequestItem,
  HANDOVER_ITEM_STATUS_OPTIONS,
  HandoverItemStatus,
} from "../Services/AssetHandoverRequestService";

const STATUS_CONFIG: Record<
  HandoverItemStatus,
  { label: string; color: "success" | "danger" | "warning" | "informative" | "subtle"; bg: string; border: string; text: string }
> = {
  Pending: {
    label: "Pending Inspection",
    color: "warning",
    bg: "#FEF3C7",
    border: "#FDE68A",
    text: "#B45309",
  },
  "Good condition": {
    label: "Good Condition",
    color: "success",
    bg: "#DCFCE7",
    border: "#BBF7D0",
    text: "#15803D",
  },
  Damaged: {
    label: "Damaged / Defective",
    color: "danger",
    bg: "#FEE2E2",
    border: "#FECACA",
    text: "#B91C1C",
  },
  "Not Applicable": {
    label: "Not Applicable",
    color: "subtle",
    bg: "#F1F5F9",
    border: "#E2E8F0",
    text: "#64748B",
  },
  Removed: {
    label: "Missing / Removed",
    color: "informative",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1D4ED8",
  },
  Collected: {
    label: "Collected & Stored",
    color: "success",
    bg: "#DCFCE7",
    border: "#BBF7D0",
    text: "#15803D",
  },
};

interface HandoverItemsTableProps {
  items: AssetHandoverRequestItem[];
  disabled?: boolean;
  onActionItem: (itemId: string, status: Exclude<HandoverItemStatus, "Pending">, remarks: string) => Promise<void>;
}

export const HandoverItemsTable: React.FC<HandoverItemsTableProps> = ({
  items,
  disabled,
  onActionItem,
}) => {
  const [draftStatus, setDraftStatus] = useState<Record<string, Exclude<HandoverItemStatus, "Pending"> | "">>({});
  const [draftRemarks, setDraftRemarks] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const { mountNode, portal } = useThemedMountNode();

  const handleSave = async (item: AssetHandoverRequestItem) => {
    const status = draftStatus[item.ID] || (item.Status !== "Pending" ? item.Status : "Good condition");
    if (!status) return;
    setSavingId(item.ID);
    try {
      await onActionItem(
        item.ID,
        status as Exclude<HandoverItemStatus, "Pending">,
        draftRemarks[item.ID] !== undefined ? draftRemarks[item.ID] : item.Remarks ?? ""
      );
    } finally {
      setSavingId(null);
    }
  };

  const handleMarkAllGood = async () => {
    const pending = items.filter((i) => i.Status === "Pending");
    if (pending.length === 0) return;
    setBulkSaving(true);
    try {
      for (const item of pending) {
        await onActionItem(item.ID, "Good condition", draftRemarks[item.ID] || "Verified in good condition");
      }
    } finally {
      setBulkSaving(false);
    }
  };

  const pendingCount = items.filter((i) => i.Status === "Pending").length;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {/* Quick Bulk Action Bar */}
        {!disabled && items.length > 1 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "10px",
              padding: "8px 14px",
              fontSize: "12px",
            }}
          >
            <span style={{ color: "#64748B" }}>
              {pendingCount > 0 ? (
                <><strong>{pendingCount}</strong> item(s) awaiting verification</>
              ) : (
                <span style={{ color: "#15803D", fontWeight: 600 }}>✓ All hardware items verified</span>
              )}
            </span>
            {pendingCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllGood}
                disabled={bulkSaving}
                style={{
                  background: "#ECFDF5",
                  color: "#059669",
                  border: "1px solid #A7F3D0",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  cursor: bulkSaving ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {bulkSaving ? <Spinner size="tiny" /> : <CheckmarkRegular />}
                <span>Mark All Good Condition</span>
              </button>
            )}
          </div>
        )}

        {/* Item Cards */}
        {items.map((item) => {
          const cfg = STATUS_CONFIG[item.Status] || STATUS_CONFIG.Pending;
          const currentStatus = (draftStatus[item.ID] !== undefined ? draftStatus[item.ID] : item.Status !== "Pending" ? item.Status : "") as Exclude<HandoverItemStatus, "Pending"> | "";
          const isDirty = draftStatus[item.ID] !== undefined || draftRemarks[item.ID] !== undefined;

          return (
            <div
              key={item.ID}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "14px 16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                transition: "all 0.15s ease",
              }}
            >
              {/* Card Header: Asset Name & Status Badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "#EFF6FF",
                      color: "#007ED5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                      flexShrink: 0,
                    }}
                  >
                    <BoxRegular />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "13.5px", color: "#0F172A", lineHeight: 1.2 }}>
                      {item.AssetName}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                      Tag ID: <span style={{ fontWeight: 600, color: "#334155" }}>{item.AssetTagID}</span>
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "999px",
                    background: cfg.bg,
                    color: cfg.text,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  {cfg.label}
                </span>
              </div>

              {/* Inspection Controls Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                  paddingTop: "10px",
                  borderTop: "1px dashed #E2E8F0",
                }}
              >
                {/* Condition Selector */}
                <div style={{ width: "170px", flexShrink: 0, minWidth: "140px" }}>
                  <select
                    value={currentStatus || (item.Status !== "Pending" ? item.Status : "")}
                    disabled={disabled}
                    onChange={(e) =>
                      setDraftStatus((prev) => ({
                        ...prev,
                        [item.ID]: (e.target.value as Exclude<HandoverItemStatus, "Pending">) || "",
                      }))
                    }
                    style={{
                      width: "100%",
                      height: "36px",
                      padding: "0 30px 0 12px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      background: "#FFFFFF",
                      fontSize: "12.5px",
                      color: currentStatus || (item.Status !== "Pending" ? item.Status : "") ? "#0F172A" : "#64748B",
                      fontWeight: 500,
                      outline: "none",
                      cursor: disabled ? "not-allowed" : "pointer",
                      appearance: "none",
                      backgroundImage: `url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2214%22%20height%3D%2214%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 10px center",
                      backgroundSize: "14px",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="" disabled>Select condition</option>
                    {HANDOVER_ITEM_STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Remarks Input */}
                <div style={{ flex: 1, minWidth: "190px" }}>
                  <input
                    type="text"
                    placeholder="Condition notes / observations..."
                    disabled={disabled}
                    value={draftRemarks[item.ID] !== undefined ? draftRemarks[item.ID] : item.Remarks ?? ""}
                    onChange={(e) => setDraftRemarks((prev) => ({ ...prev, [item.ID]: e.target.value }))}
                    style={{
                      width: "100%",
                      height: "36px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: "1px solid #CBD5E1",
                      background: "#FFFFFF",
                      fontSize: "12.5px",
                      color: "#0F172A",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                {/* Action Save Button */}
                {!disabled && (
                  <button
                    type="button"
                    disabled={disabled || savingId === item.ID}
                    onClick={() => handleSave(item)}
                    style={{
                      height: "36px",
                      padding: "0 18px",
                      borderRadius: "8px",
                      background: isDirty ? "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)" : "#F1F5F9",
                      color: isDirty ? "#FFFFFF" : "#334155",
                      border: isDirty ? "none" : "1px solid #CBD5E1",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      cursor: disabled || savingId === item.ID ? "not-allowed" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      boxShadow: isDirty ? "0 2px 6px rgba(0, 126, 213, 0.25)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {savingId === item.ID ? (
                      <Spinner size="tiny" />
                    ) : (
                      <span>{isDirty ? "Save" : "Update"}</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {portal}
    </>
  );
};

export default HandoverItemsTable;
