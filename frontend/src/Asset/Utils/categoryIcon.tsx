import React from "react";
import {
  LaptopRegular,
  DesktopRegular,
  PhoneRegular,
  CursorRegular,
  KeyboardRegular,
  PrintRegular,
  HeadphonesRegular,
  AppsListRegular,
} from "@fluentui/react-icons";

// Shared Fluent-icon mapping for asset categories, used anywhere a category
// needs a compact icon (New Request form, Employee Asset List cards, ...).
const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  Laptop: <LaptopRegular />,
  Mobile: <PhoneRegular />,
  Accessory: <CursorRegular />,
  Printer: <PrintRegular />,
  Monitor: <DesktopRegular />,
  Keyboard: <KeyboardRegular />,
  Headphone: <HeadphonesRegular />,
};

export const getCategoryIcon = (name: string): React.ReactNode => {
  if (!name) return <AppsListRegular />;
  if (CATEGORY_ICON_MAP[name]) return CATEGORY_ICON_MAP[name];
  const lower = name.toLowerCase();
  if (lower.includes("laptop") || lower.includes("macbook") || lower.includes("notebook")) return <LaptopRegular />;
  if (lower.includes("mobile") || lower.includes("phone") || lower.includes("iphone")) return <PhoneRegular />;
  if (lower.includes("monitor") || lower.includes("display") || lower.includes("screen") || lower.includes("desktop")) return <DesktopRegular />;
  if (lower.includes("headphone") || lower.includes("audio") || lower.includes("headset")) return <HeadphonesRegular />;
  if (lower.includes("keyboard")) return <KeyboardRegular />;
  if (lower.includes("mouse") || lower.includes("cursor") || lower.includes("accessory")) return <CursorRegular />;
  if (lower.includes("print")) return <PrintRegular />;
  return <AppsListRegular />;
};
