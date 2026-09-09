import React from "react";
import { Card, Text, Badge } from "@fluentui/react-components";
import { ChevronRightRegular } from "@fluentui/react-icons";

export interface RequestTypeCardDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  cardBg?: string;
  count?: number;
}

interface RequestTypeSelectorProps {
  cards: RequestTypeCardDef[];
  onSelect: (key: string) => void;
}

// Landing screen shown on My Requests/Manager/Admin Approval before drilling
// into a specific request type's list.
const RequestTypeSelector: React.FC<RequestTypeSelectorProps> = ({ cards, onSelect }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <Text size={500} weight="semibold" style={{ color: "#0f172a", letterSpacing: "-0.01em" }}>
          Approval Categories
        </Text>
        <Text size={200} style={{ color: "#64748b", display: "block", marginTop: "2px" }}>
          Select a category below to review pending requests and take actions
        </Text>
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "16px" }}>
      {cards.map((card) => (
        <div
          key={card.key}
          onClick={() => onSelect(card.key)}
          style={{
            padding: "22px",
            cursor: "pointer",
            borderRadius: "18px",
            background: card.cardBg || card.iconBg,
            border: "1px solid rgba(0, 0, 0, 0.05)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = `0 14px 28px -4px ${card.iconColor}2a, 0 6px 12px -2px rgba(0, 0, 0, 0.04)`;
            e.currentTarget.style.borderColor = `${card.iconColor}44`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.03)";
            e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.05)";
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "#FFFFFF",
                  color: card.iconColor,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "22px",
                  flexShrink: 0,
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)",
                }}
              >
                {card.icon}
              </div>
              {!!card.count && (
                <span
                  style={{
                    background: "#EF4444",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "999px",
                    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.35)",
                  }}
                >
                  {card.count} pending
                </span>
              )}
            </div>
            <div style={{ marginTop: "18px" }}>
              <Text weight="semibold" size={400} style={{ display: "block", color: "#0F172A", fontSize: "16px", letterSpacing: "-0.01em" }}>
                {card.label}
              </Text>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "20px",
              paddingTop: "12px",
              borderTop: "1px solid rgba(0, 0, 0, 0.06)",
            }}
          >
            <Text size={200} weight="semibold" style={{ color: card.iconColor || "#007ED5" }}>
              View & review
            </Text>
            <ChevronRightRegular fontSize={16} style={{ color: card.iconColor || "#007ED5" }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default RequestTypeSelector;
