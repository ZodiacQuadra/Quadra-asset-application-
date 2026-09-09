import React from "react";

export interface PillOption<T extends string = string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface QuadraPillToggleProps<T extends string = string> {
  options: (PillOption<T> | string)[];
  value: T;
  onChange: (val: T) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
  style?: React.CSSProperties;
}

export function QuadraPillToggle<T extends string = string>({
  options,
  value,
  onChange,
  size = "md",
  className = "",
  style = {},
}: QuadraPillToggleProps<T>) {
  const sizeClass = size === "sm" ? "quadra-pill-toggle-sm" : size === "lg" ? "quadra-pill-toggle-lg" : "";

  return (
    <div
      role="tablist"
      className={`quadra-pill-toggle-container ${sizeClass} ${className}`}
      style={style}
    >
      {options.map((opt) => {
        const key = typeof opt === "string" ? (opt as T) : opt.key;
        const label = typeof opt === "string" ? opt : opt.label;
        const icon = typeof opt === "string" ? null : opt.icon;
        const count = typeof opt === "string" ? undefined : opt.count;
        const isActive = value === key;

        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`quadra-pill-toggle-item ${isActive ? "quadra-pill-toggle-item-active" : ""}`}
            onClick={() => onChange(key)}
          >
            {icon && <span style={{ display: "inline-flex", fontSize: 16 }}>{icon}</span>}
            <span>{label}</span>
            {count !== undefined && (
              <span
                style={{
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 9999,
                  fontWeight: 700,
                  background: isActive ? "#EBF3FE" : "#E2E8F0",
                  color: isActive ? "#007ED5" : "#64748B",
                  marginLeft: 4,
                  lineHeight: "14px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "18px",
                  transition: "all 0.18s ease",
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default QuadraPillToggle;
