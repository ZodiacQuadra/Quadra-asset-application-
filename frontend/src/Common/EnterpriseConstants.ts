/**
 * Enterprise Single Source of Truth Constants for Q-EAMS
 * Quadra Enterprise Asset Management System
 */

// Canonical 6 Branches
export const CANONICAL_BRANCHES = [
  "Coimbatore",
  "Chennai",
  "Bangalore",
  "Pune",
  "Mumbai",
  "Kochin",
] as const;

export type CanonicalBranch = (typeof CANONICAL_BRANCHES)[number];

// Canonical 11 Departments
export const CANONICAL_DEPARTMENTS = [
  "Operations",
  "Intelligent Secure Productivity Group",
  "Hybrid Cloud & Digital Work",
  "Google SBU",
  "Executive Management",
  "Enterprise AI & Cloud Group",
  "Cyber Security Solution Group",
  "Corporate Services",
  "AWS SBU",
  "Azure SBU",
  "Accelerated Intelligence Group",
] as const;

export type CanonicalDepartment = (typeof CANONICAL_DEPARTMENTS)[number];

// Core Asset Lifecycle Statuses
export const ASSET_STATUSES = [
  "In Stock",
  "Assigned",
  "In Use",
  "Under Maintenance",
  "Reserved",
  "End of Use",
  "Lost",
] as const;

export type AssetLifecycleStatus = (typeof ASSET_STATUSES)[number];

// Asset Categories (IT vs Non-IT)
export const IT_CATEGORIES = [
  "Laptop",
  "Desktop",
  "Monitor",
  "Keyboard",
  "Mouse",
  "Headphone",
  "Mobile",
  "Tablet",
  "Printer",
  "Network Equipment",
  "Server",
  "Docking Station",
  "UPS",
  "Accessory",
] as const;

export const NON_IT_CATEGORIES = [
  "Furniture",
  "Office Chair",
  "Desk",
  "Cabinet",
  "Projector",
  "Meeting Room Equipment",
  "Facility Equipment",
] as const;

// Request Statuses & Types
export const REQUEST_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "In Progress",
  "Completed",
] as const;

export const REQUEST_TYPES = [
  "New Asset",
  "Allocation",
  "Repair",
  "Upgrade",
  "Handover",
  "Lost Asset",
] as const;

/**
 * Branch Normalization Function
 * Resolves any legacy, demo, or headquarters string variation to one of the 6 canonical branches.
 */
export function normalizeBranch(branch?: string | null): CanonicalBranch {
  if (!branch || typeof branch !== "string") return "Coimbatore";
  const lower = branch.trim().toLowerCase();

  if (lower.includes("coimbatore") || lower === "hq") return "Coimbatore";
  if (lower.includes("chennai")) return "Chennai";
  if (lower.includes("bangalore") || lower.includes("bengaluru")) return "Bangalore";
  if (lower.includes("pune") || lower.includes("hyderabad")) return "Pune";
  if (lower.includes("mumbai") || lower.includes("delhi")) return "Mumbai";
  if (lower.includes("kochin") || lower.includes("cochin") || lower.includes("kerala")) return "Kochin";

  return "Coimbatore";
}

/**
 * Department Normalization Function
 * Resolves legacy demo departments (e.g. IT, Engineering, Sales) into official canonical departments.
 */
export function normalizeDepartment(dept?: string | null): CanonicalDepartment {
  if (!dept || typeof dept !== "string") return "Operations";
  const trimmed = dept.trim();
  const lower = trimmed.toLowerCase();

  // 1. Exact match against canonical departments FIRST
  const exact = CANONICAL_DEPARTMENTS.find((d) => d.toLowerCase() === lower);
  if (exact) return exact;

  // 2. Specific prefix / keyword mapping for legacy and alternate names
  if (lower.includes("accelerat") || lower.includes("aig")) {
    return "Accelerated Intelligence Group";
  }
  if (lower.includes("enterprise ai") || lower.includes("ai & cloud") || lower.includes("eaic")) {
    return "Enterprise AI & Cloud Group";
  }
  if (lower.includes("hybrid") || lower.includes("digital work") || lower.includes("hcdw") || lower.includes("devops")) {
    return "Hybrid Cloud & Digital Work";
  }
  if (lower.includes("cyber") || lower.includes("security") || lower.includes("infosec") || lower.includes("soc")) {
    return "Cyber Security Solution Group";
  }
  if (lower.includes("google") || lower.includes("gcp")) {
    return "Google SBU";
  }
  if (lower.includes("aws") || lower.includes("amazon")) {
    return "AWS SBU";
  }
  if (lower.includes("azure") || lower.includes("microsoft")) {
    return "Azure SBU";
  }
  if (lower.includes("executive") || lower.includes("leadership") || lower.includes("cxo") || lower.includes("director")) {
    return "Executive Management";
  }
  if (lower.includes("productivity") || lower.includes("ispg") || lower.includes("engineering") || lower.includes("software")) {
    return "Intelligent Secure Productivity Group";
  }
  if (lower.includes("corporate") || lower.includes("finance") || lower.includes("legal") || lower.includes("admin")) {
    return "Corporate Services";
  }
  if (lower.includes("operation") || lower.includes("ops") || lower.includes("facility") || lower.includes("sales") || lower.includes("marketing")) {
    return "Operations";
  }

  return "Operations";
}
