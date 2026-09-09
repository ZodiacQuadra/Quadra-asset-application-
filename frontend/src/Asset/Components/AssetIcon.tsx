import React from "react";
import {
  Laptop,
  Monitor,
  Headphones,
  Smartphone,
  Tablet,
  Keyboard,
  Mouse,
  Printer,
  Armchair,
  Projector,
  Server,
  HardDrive,
  Camera,
  Network,
  Box,
} from "lucide-react";

export type AssetIconSize = "xs" | "sm" | "md" | "lg" | "xl";

interface AssetIconProps {
  category?: string | null;
  name?: string | null;
  size?: AssetIconSize;
  className?: string;
  style?: React.CSSProperties;
  showContainer?: boolean;
}

interface CategoryConfig {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number; color?: string }>;
  bg: string;
  color: string;
  border?: string;
}

function resolveConfig(category?: string | null, name?: string | null): CategoryConfig {
  const text = `${category || ""} ${name || ""}`.toLowerCase().trim();

  if (text.includes("laptop") || text.includes("macbook") || text.includes("thinkpad") || text.includes("notebook")) {
    return { icon: Laptop, bg: "#E8F5E9", color: "#1B5E20", border: "#C8E6C9" };
  }
  if (text.includes("monitor") || text.includes("display") || text.includes("screen") || text.includes("desktop") || text.includes("imac")) {
    return { icon: Monitor, bg: "#E3F2FD", color: "#0D47A1", border: "#BBDEFB" };
  }
  if (text.includes("headphone") || text.includes("headset") || text.includes("audio") || text.includes("earphone") || text.includes("bose") || text.includes("jabra")) {
    return { icon: Headphones, bg: "#F3E5F5", color: "#4A148C", border: "#E1BEE7" };
  }
  if (text.includes("mobile") || text.includes("iphone") || text.includes("smartphone") || text.includes("galaxy") || text.includes("pixel")) {
    return { icon: Smartphone, bg: "#FFF3E0", color: "#E65100", border: "#FFE0B2" };
  }
  if (text.includes("tablet") || text.includes("ipad")) {
    return { icon: Tablet, bg: "#FFF8E1", color: "#F57F17", border: "#FFECB3" };
  }
  if (text.includes("keyboard")) {
    return { icon: Keyboard, bg: "#FCE4EC", color: "#880E4F", border: "#F8BBD0" };
  }
  if (text.includes("mouse") || text.includes("cursor") || text.includes("trackpad") || text.includes("accessory")) {
    return { icon: Mouse, bg: "#EDE7F6", color: "#311B92", border: "#D1C4E9" };
  }
  if (text.includes("printer") || text.includes("scanner") || text.includes("laserjet")) {
    return { icon: Printer, bg: "#FFFDE7", color: "#F57F17", border: "#FFF9C4" };
  }
  if (text.includes("chair") || text.includes("furniture") || text.includes("desk") || text.includes("seating") || text.includes("aeron") || text.includes("steelcase")) {
    return { icon: Armchair, bg: "#ECEFF1", color: "#263238", border: "#CFD8DC" };
  }
  if (text.includes("projector")) {
    return { icon: Projector, bg: "#E0F7FA", color: "#006064", border: "#B2EBF2" };
  }
  if (text.includes("server") || text.includes("switch") || text.includes("cisco") || text.includes("nas") || text.includes("rack")) {
    return { icon: Server, bg: "#E0F2F1", color: "#004D40", border: "#B2DFDB" };
  }
  if (text.includes("hard drive") || text.includes("ssd") || text.includes("storage")) {
    return { icon: HardDrive, bg: "#E8EAF6", color: "#1A237E", border: "#C5CAE9" };
  }
  if (text.includes("camera") || text.includes("webcam")) {
    return { icon: Camera, bg: "#FFEBEE", color: "#B71C1C", border: "#FFCDD2" };
  }
  if (text.includes("router") || text.includes("network") || text.includes("wifi")) {
    return { icon: Network, bg: "#E1F5FE", color: "#01579B", border: "#B3E5FC" };
  }

  // Default fallback
  return { icon: Box, bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" };
}

const SIZE_CONFIG = {
  xs: { box: 24, icon: 13, radius: 6 },
  sm: { box: 32, icon: 16, radius: 8 },
  md: { box: 40, icon: 20, radius: 12 },
  lg: { box: 52, icon: 26, radius: 14 },
  xl: { box: 72, icon: 36, radius: 18 },
};

export const AssetIcon: React.FC<AssetIconProps> = ({
  category,
  name,
  size = "md",
  className = "",
  style = {},
  showContainer = true,
}) => {
  const config = resolveConfig(category, name);
  const sizeDef = SIZE_CONFIG[size] || SIZE_CONFIG.md;
  const IconComponent = config.icon;

  if (!showContainer) {
    return <IconComponent size={sizeDef.icon} color={config.color} strokeWidth={2} className={className} />;
  }

  return (
    <div
      className={className}
      style={{
        width: sizeDef.box,
        height: sizeDef.box,
        minWidth: sizeDef.box,
        minHeight: sizeDef.box,
        borderRadius: sizeDef.radius,
        background: config.bg,
        border: `1px solid ${config.border || "transparent"}`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: config.color,
        flexShrink: 0,
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        ...style,
      }}
    >
      <IconComponent size={sizeDef.icon} color={config.color} strokeWidth={2} />
    </div>
  );
};

export default AssetIcon;
