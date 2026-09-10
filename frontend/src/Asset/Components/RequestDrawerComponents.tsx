import React from "react";
import { Avatar, Badge, Text } from "@fluentui/react-components";
import {
  BuildingRegular,
  CheckmarkCircleFilled,
  ClockRegular,
  DismissCircleRegular,
  MailRegular,
  ShieldCheckmarkRegular,
} from "@fluentui/react-icons";
import TruncatedText from "../../Common/TruncatedText";

// Semantic status color definitions
export const REQUEST_STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Pending: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  "In Progress": { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  InProgress: { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  Approved: { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" },
  Completed: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  Resolved: { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  Rejected: { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" },
  Cancelled: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
  Open: { bg: "#FEF3C7", text: "#92400E", border: "#FDE68A" },
  Closed: { bg: "#F1F5F9", text: "#475569", border: "#CBD5E1" },
  Unrepairable: { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" },
  "Re-Progress": { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
  Reprogress: { bg: "#FFFBEB", text: "#B45309", border: "#FDE68A" },
};

export const RequestStatusBadge: React.FC<{ status?: string | null }> = ({ status }) => {
  const norm = status || "Pending";
  const colors = REQUEST_STATUS_COLORS[norm] || { bg: "#F1F5F9", text: "#475569", border: "#E2E8F0" };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        lineHeight: "1.2",
        whiteSpace: "nowrap",
      }}
    >
      {norm}
    </span>
  );
};

export const RequestSectionHeader: React.FC<{
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, icon, action }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: "16px",
      marginBottom: "10px",
      paddingBottom: "6px",
      borderBottom: "1px solid #F1F5F9",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      {icon && <span style={{ color: "#007ED5", display: "flex", fontSize: "16px" }}>{icon}</span>}
      <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
        {title}
      </span>
    </div>
    {action}
  </div>
);

export const DetailField: React.FC<{
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}> = ({ label, value, icon, fullWidth }) => {
  const displayValue =
    value === undefined || value === null || value === "" ? (
      <span style={{ color: "#94A3B8" }}>—</span>
    ) : (
      value
    );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        gridColumn: fullWidth ? "1 / -1" : undefined,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontSize: "11.5px",
          fontWeight: 600,
          color: "#64748B",
          textTransform: "uppercase",
          letterSpacing: "0.03em",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {icon}
        {label}
      </span>
      <div
        style={{
          fontSize: "13.5px",
          fontWeight: 500,
          color: "#0F172A",
          wordBreak: "break-word",
          lineHeight: "1.4",
        }}
      >
        {displayValue}
      </div>
    </div>
  );
};

export const DetailGrid: React.FC<{ children: React.ReactNode; columns?: 1 | 2 | 3 }> = ({
  children,
  columns = 2,
}) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: columns === 1 ? "1fr" : columns === 3 ? "1fr 1fr 1fr" : "1fr 1fr",
      gap: "14px 18px",
      alignItems: "start",
    }}
  >
    {children}
  </div>
);

export const InfoRow: React.FC<{ label: string; value: React.ReactNode; hasDivider?: boolean }> = ({
  label,
  value,
  hasDivider = true,
}) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "7px 0",
      gap: "16px",
      borderBottom: hasDivider ? "1px dashed #E2E8F0" : "none",
    }}
  >
    <Text size={200} style={{ color: "#64748B", flexShrink: 0 }}>
      {label}
    </Text>
    {typeof value === "string" ? (
      <TruncatedText text={value} size={200} weight="medium" maxWidth="280px" style={{ textAlign: "right", color: "#0F172A" }} />
    ) : (
      <div style={{ textAlign: "right", color: "#0F172A", fontWeight: 500, fontSize: "13px" }}>{value ?? "—"}</div>
    )}
  </div>
);

export const InfoCardGroup: React.FC<{ title?: string; children: React.ReactNode; padding?: string | number }> = ({
  title,
  children,
  padding = "4px 16px",
}) => (
  <div>
    {title && (
      <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>
        {title}
      </div>
    )}
    <div
      style={{
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        borderRadius: 12,
        padding,
      }}
    >
      {children}
    </div>
  </div>
);

export const DrawerTopIdentityCard: React.FC<{
  name?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  department?: string | null;
  status?: string | null;
  statusColor?: "warning" | "informative" | "success" | "danger";
  avatarSize?: 48 | 40;
  requestNumber?: string | null;
  dateLabel?: string | null;
  icon?: React.ReactNode;
}> = ({
  name,
  jobTitle,
  email,
  department,
  status,
  statusColor = "informative",
  avatarSize = 48,
  requestNumber,
  dateLabel,
  icon,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "16px",
      padding: "16px 18px",
      border: "1px solid #E2E8F0",
      borderRadius: "14px",
      background: "#F8FAFC",
      marginBottom: "6px",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
      {icon ? (
        <div
          style={{
            width: avatarSize,
            height: avatarSize,
            borderRadius: "12px",
            background: "#EFF6FF",
            color: "#007ED5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      ) : (
        <Avatar name={name ?? "?"} size={avatarSize} />
      )}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <TruncatedText text={name ?? "Unknown"} weight="semibold" size={400} maxWidth="260px" style={{ color: "#0F172A" }} />
          {requestNumber && (
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#007ED5",
                background: "#EFF6FF",
                padding: "2px 8px",
                borderRadius: "6px",
                border: "1px solid #BFDBFE",
              }}
            >
              {requestNumber}
            </span>
          )}
        </div>
        <TruncatedText text={jobTitle} fallback="—" size={200} color="#64748B" maxWidth="260px" />
        {dateLabel && (
          <div style={{ fontSize: "11.5px", color: "#94A3B8", marginTop: "2px" }}>
            {dateLabel}
          </div>
        )}
      </div>
    </div>
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" }}>
      {email && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <div style={{ background: "#EFF6FF", borderRadius: "6px", padding: "6px", color: "#007ED5", flexShrink: 0 }}>
            <MailRegular />
          </div>
          <div style={{ minWidth: 0 }}>
            <Text size={100} style={{ color: "#64748B", display: "block" }}>
              Email
            </Text>
            <Text size={200} weight="medium" style={{ color: "#1E293B" }}>
              {email}
            </Text>
          </div>
        </div>
      )}
      {department && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <div style={{ background: "#EFF6FF", borderRadius: "6px", padding: "6px", color: "#007ED5", flexShrink: 0 }}>
            <BuildingRegular />
          </div>
          <div style={{ minWidth: 0 }}>
            <Text size={100} style={{ color: "#64748B", display: "block" }}>
              Department
            </Text>
            <Text size={200} weight="medium" style={{ color: "#1E293B" }}>
              {department}
            </Text>
          </div>
        </div>
      )}
      {status && (
        <Badge appearance="tint" color={statusColor} size="medium">
          {status}
        </Badge>
      )}
    </div>
  </div>
);

export interface DecisionOptionDef {
  kind: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
  iconBg: string;
  activeBg: string;
  activeBorder: string;
}

export const OptionCard: React.FC<{
  def: DecisionOptionDef;
  selected: boolean;
  onClick: () => void;
  children?: React.ReactNode;
}> = ({ def, selected, onClick, children }) => (
  <div
    onClick={onClick}
    style={{
      border: selected ? `2px solid ${def.activeBorder}` : "1.5px solid #E2E8F0",
      background: selected ? def.activeBg : "#FFFFFF",
      borderRadius: "14px",
      padding: "14px 16px",
      cursor: "pointer",
      position: "relative",
      boxShadow: selected ? `0 4px 16px ${def.accent}1F` : "0 1px 3px rgba(0, 0, 0, 0.02)",
      transition: "all 0.18s cubic-bezier(0.4, 0, 0.2, 1)",
    }}
  >
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "10px",
          background: selected ? def.accent : def.iconBg,
          color: selected ? "#FFFFFF" : def.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          flexShrink: 0,
          transition: "all 0.15s ease",
        }}
      >
        {def.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <Text weight="bold" size={300} style={{ color: selected ? def.accent : "#1E293B" }}>
            {def.label}
          </Text>
          {selected ? (
            <CheckmarkCircleFilled style={{ color: def.accent, fontSize: "18px", flexShrink: 0 }} />
          ) : (
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                border: "1.5px solid #CBD5E1",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
          )}
        </div>
        <Text size={200} style={{ color: "#64748B", display: "block", marginTop: "3px", lineHeight: 1.35 }}>
          {def.description}
        </Text>
      </div>
    </div>
    {selected && children && (
      <div
        style={{
          marginTop: "12px",
          paddingTop: "12px",
          borderTop: `1px dashed ${def.accent}40`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    )}
  </div>
);

export const DecisionContainer: React.FC<{
  isActionable: boolean;
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  children: React.ReactNode;
}> = ({
  isActionable,
  title = isActionable ? "Make Decision" : "Decision Record",
  subtitle = isActionable ? "Review & resolve request" : "Official determination summary",
  badgeLabel = "Action Required",
  children,
}) => (
  <div
    style={{
      background: "#F8FAFC",
      border: "1px solid #E2E8F0",
      borderRadius: "16px",
      padding: "20px 22px",
      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            background: isActionable ? "#EEF6FF" : "#F1F5F9",
            color: isActionable ? "#007ED5" : "#64748B",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 19,
            flexShrink: 0,
          }}
        >
          <ShieldCheckmarkRegular />
        </div>
        <div>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", lineHeight: 1.2 }}>
            {title}
          </div>
          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
            {subtitle}
          </div>
        </div>
      </div>
      {isActionable && (
        <span
          style={{
            background: "#FEF3C7",
            color: "#B45309",
            border: "1px solid #FDE68A",
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: 999,
            textTransform: "uppercase",
            letterSpacing: "0.4px",
          }}
        >
          {badgeLabel}
        </span>
      )}
    </div>
    {children}
  </div>
);

export const DecisionSummaryCard: React.FC<{
  status: string;
  decidedBy?: string | null;
  decidedDate?: string | null;
  decidedReason?: string | null;
  issuedAsset?: string | null;
  extraDetails?: { label: string; value: React.ReactNode }[];
  isApproved?: boolean;
  isRejected?: boolean;
}> = ({
  status,
  decidedBy,
  decidedDate,
  decidedReason,
  issuedAsset,
  extraDetails = [],
  isApproved = status === "Approved" || status === "Completed",
  isRejected = status === "Rejected",
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        background: isApproved ? "#F0FDF4" : isRejected ? "#FEF2F2" : "#FFFBEB",
        border: isApproved ? "1.5px solid #BBF7D0" : isRejected ? "1.5px solid #FECACA" : "1.5px solid #FDE68A",
        borderRadius: "14px",
        padding: "16px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: isApproved ? "#16A34A" : isRejected ? "#DC2626" : "#D97706",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              flexShrink: 0,
            }}
          >
            {isApproved ? <CheckmarkCircleFilled /> : isRejected ? <DismissCircleRegular /> : <ClockRegular />}
          </div>
          <div>
            <span
              style={{
                fontWeight: 700,
                fontSize: "14.5px",
                color: isApproved ? "#166534" : isRejected ? "#991B1B" : "#92400E",
                display: "block",
                lineHeight: 1.2,
              }}
            >
              {isApproved ? "Approved & Fulfillable" : isRejected ? "Request Rejected" : "Pending Action / In Progress"}
            </span>
            <span style={{ fontSize: "11.5px", color: "#64748B" }}>
              {isApproved ? "Determination recorded" : isRejected ? "Formal rejection recorded" : "Pending administrator resolution"}
            </span>
          </div>
        </div>
        <Badge appearance="filled" color={isApproved ? "success" : isRejected ? "danger" : "warning"} size="medium">
          {status}
        </Badge>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
        {decidedBy && (
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" }}>
            <span style={{ color: "#64748B" }}>Decided By</span>
            <span style={{ fontWeight: 600, color: "#1E293B" }}>{decidedBy}</span>
          </div>
        )}
        {decidedDate && (
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" }}>
            <span style={{ color: "#64748B" }}>Decision Date</span>
            <span style={{ fontWeight: 500, color: "#1E293B" }}>{new Date(decidedDate).toLocaleString("en-IN")}</span>
          </div>
        )}
        {issuedAsset && (
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" }}>
            <span style={{ color: "#64748B" }}>Issued Hardware</span>
            <span style={{ fontWeight: 700, color: "#15803D" }}>{issuedAsset}</span>
          </div>
        )}
        {extraDetails.map((item, idx) => (
          <div key={idx} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #E2E8F0", paddingBottom: "6px" }}>
            <span style={{ color: "#64748B" }}>{item.label}</span>
            <span style={{ fontWeight: 600, color: "#1E293B" }}>{item.value}</span>
          </div>
        ))}
        {decidedReason && (
          <div style={{ marginTop: "4px", padding: "10px 12px", borderRadius: "8px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}>
            <span style={{ display: "block", fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Official Resolution Notes
            </span>
            <span style={{ color: "#334155", fontSize: "12.5px", marginTop: "3px", display: "block", lineHeight: 1.4 }}>
              {decidedReason}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

