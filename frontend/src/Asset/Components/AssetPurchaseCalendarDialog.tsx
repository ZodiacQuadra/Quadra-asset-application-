import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Button,
  Text,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  ChevronLeftRegular,
  ChevronRightRegular,
  CalendarRegular,
} from "@fluentui/react-icons";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import AssetDetailPopup from "./AssetDetailPopup";
import { AssetInventoryRecord } from "../Services/AssetInventoryService";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const toDateKey = (year: number, month: number, day: number) => {
  const d = new Date(year, month, day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

interface AssetPurchaseCalendarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assets: AssetInventoryRecord[];
}

const AssetPurchaseCalendarDialog: React.FC<AssetPurchaseCalendarDialogProps> = ({ open, onOpenChange, assets }) => {
  const { mountNode, portal } = useThemedMountNode();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [dayListDate, setDayListDate] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<AssetInventoryRecord | null>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  // Group assets by PurchasedDate or CreatedAt (YYYY-MM-DD)
  const assetsByDate = useMemo(() => {
    const map = new Map<string, AssetInventoryRecord[]>();
    assets.forEach((asset) => {
      const dateStr = asset.PurchasedDate || asset.CreatedAt;
      if (!dateStr) return;
      const key = dateStr.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(asset);
      map.set(key, list);
    });
    return map;
  }, [assets]);

  const weeks = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startOffset = firstOfMonth.getDay(); // 0 = Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { day: number; month: number; year: number; inCurrentMonth: boolean }[] = [];
    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({ day: daysInPrevMonth - i, month: month - 1, year, inCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, month, year, inCurrentMonth: true });
    }
    let nextMonthDay = 1;
    while (cells.length % 7 !== 0 || cells.length < 42) {
      cells.push({ day: nextMonthDay++, month: month + 1, year, inCurrentMonth: false });
    }

    const rows: typeof cells[] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [month, year]);

  const goToToday = () => {
    setMonth(today.getMonth());
    setYear(today.getFullYear());
  };

  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const dayListAssets = dayListDate ? assetsByDate.get(dayListDate) ?? [] : [];

  if (!open) return null;

  return createPortal(
    <div
      className="quadra-slideover-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.45)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
        animation: "quadraFadeIn 0.2s ease-out",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        className="quadra-slideover-panel"
        style={{
          width: "min(1100px, 85vw)",
          maxWidth: "85vw",
          height: "100vh",
          background: "#FFFFFF",
          boxShadow: "-10px 0 40px rgba(15, 23, 42, 0.16)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          animation: "quadraSlideLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {portal}

        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#FFFFFF",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "#EFF6FF",
                color: "#007ED5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              <CalendarRegular />
            </div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 700, color: "#0F172A" }}>
                Asset Purchase Calendar
              </div>
              <div style={{ fontSize: "12.5px", color: "#64748B" }}>
                Chronological record of corporate asset procurement
              </div>
            </div>
          </div>

          <Button
            appearance="subtle"
            aria-label="Close"
            icon={<Dismiss24Regular />}
            onClick={() => onOpenChange(false)}
            style={{ borderRadius: "8px" }}
          />
        </div>

        {/* Drawer Body */}
        <div
          style={{
            padding: "24px",
            overflowY: "auto",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {/* Month / Year Navigator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              padding: "10px 16px",
            }}
          >
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#007ED5" }}>
              {MONTH_NAMES[month]} {year}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Button
                appearance="subtle"
                icon={<ChevronLeftRegular />}
                onClick={goPrev}
                aria-label="Previous month"
                style={{ borderRadius: "8px" }}
              />
              <Button
                appearance="subtle"
                icon={<ChevronRightRegular />}
                onClick={goNext}
                aria-label="Next month"
                style={{ borderRadius: "8px" }}
              />
              <Button
                appearance="outline"
                onClick={goToToday}
                style={{
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  borderColor: "#CBD5E1",
                }}
              >
                Today
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              border: "1px solid #E2E8F0",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#FFFFFF",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
            }}
          >
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                style={{
                  padding: "10px",
                  textAlign: "center",
                  background: "#F1F5F9",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  color: "#475569",
                  borderBottom: "1px solid #E2E8F0",
                }}
              >
                {wd}
              </div>
            ))}

            {weeks.map((row, ri) =>
              row.map((cell, ci) => {
                const key = toDateKey(cell.year, cell.month, cell.day);
                const dayAssets = assetsByDate.get(key) ?? [];
                const isCurrentDay =
                  cell.inCurrentMonth &&
                  cell.day === today.getDate() &&
                  cell.month === today.getMonth() &&
                  cell.year === today.getFullYear();

                return (
                  <div
                    key={`${ri}-${ci}`}
                    style={{
                      minHeight: "95px",
                      padding: "8px",
                      borderTop: ri > 0 ? "1px solid #F1F5F9" : "none",
                      borderLeft: ci > 0 ? "1px solid #F1F5F9" : "none",
                      background: isCurrentDay
                        ? "#EFF6FF"
                        : cell.inCurrentMonth
                        ? "#FFFFFF"
                        : "#F8FAFC",
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: isCurrentDay ? 700 : 500,
                          color: isCurrentDay
                            ? "#007ED5"
                            : cell.inCurrentMonth
                            ? "#1E293B"
                            : "#94A3B8",
                          width: isCurrentDay ? "22px" : "auto",
                          height: isCurrentDay ? "22px" : "auto",
                          borderRadius: isCurrentDay ? "50%" : "none",
                          background: isCurrentDay ? "#DBEAFE" : "transparent",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {cell.day}
                      </span>
                      {dayAssets.length > 0 && (
                        <span
                          style={{
                            fontSize: "10.5px",
                            fontWeight: 700,
                            color: "#007ED5",
                            background: "#EFF6FF",
                            padding: "1px 6px",
                            borderRadius: "10px",
                          }}
                        >
                          {dayAssets.length}
                        </span>
                      )}
                    </div>

                    {dayAssets.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px", marginTop: "2px" }}>
                        <button
                          type="button"
                          style={{
                            minWidth: 0,
                            textAlign: "left",
                            fontSize: "11px",
                            fontWeight: 600,
                            padding: "3px 7px",
                            borderRadius: "6px",
                            background: "#007ED5",
                            color: "#FFFFFF",
                            border: "none",
                            cursor: "pointer",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            boxShadow: "0 1px 3px rgba(0, 126, 213, 0.25)",
                          }}
                          onClick={() => setSelectedAsset(dayAssets[0])}
                          title={`${dayAssets[0].AssetTagID} - ${dayAssets[0].AssetName}`}
                        >
                          {dayAssets[0].AssetTagID}
                        </button>
                        {dayAssets.length > 1 && (
                          <button
                            type="button"
                            style={{
                              minWidth: 0,
                              fontSize: "10.5px",
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: "6px",
                              background: "#E0F2FE",
                              color: "#0369A1",
                              border: "none",
                              cursor: "pointer",
                            }}
                            onClick={() => setDayListDate(key)}
                          >
                            +{dayAssets.length - 1} more
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Day-level asset list popup */}
      <Dialog open={!!dayListDate} onOpenChange={(_, d) => !d.open && setDayListDate(null)}>
        <DialogSurface mountNode={mountNode}>
          <DialogBody>
            <DialogTitle>Assets purchased on {dayListDate}</DialogTitle>
            <DialogContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                {dayListAssets.map((asset) => (
                  <Button
                    key={asset.ID}
                    appearance="outline"
                    style={{ justifyContent: "flex-start", borderRadius: "8px", padding: "10px 14px" }}
                    onClick={() => {
                      setSelectedAsset(asset);
                      setDayListDate(null);
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "#007ED5", marginRight: "8px" }}>
                      {asset.AssetTagID}
                    </span>
                    <span style={{ color: "#334155" }}>— {asset.AssetName}</span>
                  </Button>
                ))}
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      <AssetDetailPopup
        open={!!selectedAsset}
        onOpenChange={(isOpen) => !isOpen && setSelectedAsset(null)}
        asset={selectedAsset}
      />
    </div>,
    document.body
  );
};

export default AssetPurchaseCalendarDialog;
