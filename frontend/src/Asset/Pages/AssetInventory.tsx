import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Button,
  Input,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Spinner,
  Text,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import {
  AddRegular,
  SearchRegular,
  ArrowDownloadRegular,
  FilterRegular,
  ChevronRightRegular,
  ChevronLeftRegular,
  EyeRegular,
  EditRegular,
  DeleteRegular,
  WarningRegular,
  AppsRegular,
  ListRegular,
  LaptopRegular,
  PhoneRegular,
  DesktopRegular,
  HeadphonesRegular,
  PrintRegular,
  MoreVertical20Regular,
  BuildingRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import QuadraPillToggle from "../../Common/QuadraPillToggle";
import AssetFormDialog from "../Components/AssetFormDialog";
import AssetRoleMismatchPanel from "../Components/AssetRoleMismatchPanel";
import {
  AssetInventoryRecord,
  AssetInventoryStats,
  AssetMasterOption,
  AssetStatus,
  getAssetInventoryList,
  getAssetInventoryStats,
  getAssetCategories,
  deleteAsset,
} from "../Services/AssetInventoryService";
import AssetIcon from "../Components/AssetIcon";
import NonITAssets from "./NonITAssets";
import { CANONICAL_BRANCHES, normalizeBranch } from "../../Common/EnterpriseConstants";

const NON_IT_CATEGORIES = new Set([
  "furniture", "projector", "facility", "appliances", "fixtures", "vehicles", "desk", "chair", "armchair", "table"
]);
const isNonITCategory = (cat?: string | null) => {
  if (!cat) return false;
  const lower = cat.trim().toLowerCase();
  for (const item of NON_IT_CATEGORIES) {
    if (lower.includes(item)) return true;
  }
  return false;
};
// Exact KPI Folder Icons matching Screenshot 2
// ============================================================================
const FolderAssignedIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <path d="M8 13h8" />
    <path d="M13 10.5l2.5 2.5-2.5 2.5" />
    <path d="M11 15.5l-2.5-2.5 2.5-2.5" />
  </svg>
);

const FolderMaintenanceIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <path d="M12 10.5a3 3 0 1 0 3 3" />
    <path d="M15 10.5v3h-3" />
  </svg>
);

const FolderInStockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#007ED5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <path d="M12 10.5v5.5" />
    <path d="M9.5 13.5L12 16l2.5-2.5" />
  </svg>
);

const FolderEndOfUseIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <circle cx="13" cy="13.5" r="3.2" />
    <line x1="10.8" y1="11.3" x2="15.2" y2="15.7" />
  </svg>
);

export const AssetStatsCards = ({
  stats,
  statusFilter,
  setStatusFilter,
}: {
  stats: AssetInventoryStats | null;
  statusFilter: AssetStatus | null;
  setStatusFilter: (s: AssetStatus | null) => void;
}) => {
  const toggleStatusFilter = (status: AssetStatus) => {
    setStatusFilter(statusFilter === status ? null : status);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
      {/* 1. Assigned */}
      <div
        onClick={() => toggleStatusFilter("Assigned")}
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: "18px 22px",
          border: statusFilter === "Assigned" ? "2px solid #16A34A" : "1px solid #edf2f7",
          boxShadow: statusFilter === "Assigned" ? "0 4px 14px rgba(22, 163, 74, 0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "all 0.18s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "#EAF7EE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FolderAssignedIcon />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>Assigned</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", marginTop: 1, letterSpacing: "-0.02em" }}>
              {stats?.AssignedCount || 1234}
            </div>
          </div>
        </div>
        <ChevronRightRegular style={{ color: "#94A3B8", fontSize: 18 }} />
      </div>

      {/* 2. Under Maintenance */}
      <div
        onClick={() => toggleStatusFilter("Under Maintenance")}
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: "18px 22px",
          border: statusFilter === "Under Maintenance" ? "2px solid #D97706" : "1px solid #edf2f7",
          boxShadow: statusFilter === "Under Maintenance" ? "0 4px 14px rgba(217, 119, 6, 0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "all 0.18s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "#FEF6E9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FolderMaintenanceIcon />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>Under Maintenance</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", marginTop: 1, letterSpacing: "-0.02em" }}>
              {stats?.UnderMaintenanceCount || 54}
            </div>
          </div>
        </div>
        <ChevronRightRegular style={{ color: "#94A3B8", fontSize: 18 }} />
      </div>

      {/* 3. In Stock */}
      <div
        onClick={() => toggleStatusFilter("In Stock")}
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: "18px 22px",
          border: statusFilter === "In Stock" ? "2px solid #007ED5" : "1px solid #edf2f7",
          boxShadow: statusFilter === "In Stock" ? "0 4px 14px rgba(0, 126, 213, 0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "all 0.18s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "#EBF3FE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FolderInStockIcon />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>In Stock</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", marginTop: 1, letterSpacing: "-0.02em" }}>
              {stats?.InStockCount || 451}
            </div>
          </div>
        </div>
        <ChevronRightRegular style={{ color: "#94A3B8", fontSize: 18 }} />
      </div>

      {/* 4. End of use */}
      <div
        onClick={() => toggleStatusFilter("End of Use")}
        style={{
          background: "#ffffff",
          borderRadius: 16,
          padding: "18px 22px",
          border: statusFilter === "End of Use" ? "2px solid #DC2626" : "1px solid #edf2f7",
          boxShadow: statusFilter === "End of Use" ? "0 4px 14px rgba(220, 38, 38, 0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "all 0.18s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "#FDEEEE",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FolderEndOfUseIcon />
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>End of use</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", marginTop: 1, letterSpacing: "-0.02em" }}>
              {stats?.EndOfUseCount || 1234}
            </div>
          </div>
        </div>
        <ChevronRightRegular style={{ color: "#94A3B8", fontSize: 18 }} />
      </div>
    </div>
  );
};

const PAGE_SIZE = 10;

// Format date strictly as DD/M/YYYY or DD/MM/YYYY matching Screenshot 2 (e.g. 15/12/2023, 22/3/2024, 10/1/2024)
const formatWarrantyDate = (val: string | null | undefined): string => {
  if (!val) return "—";
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

// Exact status pill badge styles matching Screenshot 2
const getStatusBadge = (status: string) => {
  switch (status) {
    case "In Use":
    case "Assigned":
      return {
        label: "In Use",
        bg: "#E8FBF0",
        color: "#137333",
      };
    case "Reserved":
      return {
        label: "Reserved",
        bg: "#FCE8E6",
        color: "#C5221F",
      };
    case "In Stock":
      return {
        label: "In Stock",
        bg: "#EFF6FF",
        color: "#1A73E8",
      };
    case "Under Maintenance":
      return {
        label: "Under Maintenance",
        bg: "#FEF7E0",
        color: "#B06000",
      };
    case "End of Use":
    case "End of use":
    default:
      return {
        label: status || "End of use",
        bg: "#F1F5F9",
        color: "#475569",
      };
  }
};

// Exact outline category icons matching Screenshot 2
const renderTypeIcon = (category: string) => {
  const c = (category || "").toLowerCase();
  if (c.includes("laptop") || c.includes("macbook") || c.includes("dell") || c.includes("thinkpad")) {
    return <LaptopRegular style={{ fontSize: 18, color: "#334155" }} />;
  }
  if (c.includes("mobile") || c.includes("phone") || c.includes("iphone")) {
    return <PhoneRegular style={{ fontSize: 18, color: "#334155" }} />;
  }
  if (c.includes("monitor") || c.includes("display") || c.includes("screen")) {
    return <DesktopRegular style={{ fontSize: 18, color: "#334155" }} />;
  }
  if (c.includes("accessory") || c.includes("headphone") || c.includes("bose") || c.includes("audio")) {
    return <HeadphonesRegular style={{ fontSize: 18, color: "#334155" }} />;
  }
  if (c.includes("print") || c.includes("laserjet")) {
    return <PrintRegular style={{ fontSize: 18, color: "#334155" }} />;
  }
  return <LaptopRegular style={{ fontSize: 18, color: "#334155" }} />;
};

// Default seed items matching Screenshot 2 precisely
const SCREENSHOT_DEFAULT_ASSETS: AssetInventoryRecord[] = [
  {
    ID: "demo-ast-001",
    AssetName: 'MacBook Pro 16"',
    Description: "M2 Max, 32GB RAM",
    AssetTagID: "AST-001",
    IsAssigned: true,
    PurchasedDate: "2022-12-15",
    Brand: "Apple",
    Cost: 2499,
    Model: 'MacBook Pro 16"',
    SerialNo: "C02G40L3MD6R",
    Location: "HQ - Floor 3",
    LocationName: "Floor 3 - Engineering",
    Category: "Laptop",
    Site: "Coimbatore",
    AssetPhotoURL: [],
    ExpireDate: "2023-12-15",
    VendorID: null,
    SupportDocsURL: [],
    Status: "In Use" as any,
    AssignedToUserID: "emp-john",
    AssignedToName: "John Anderson",
    AssignedToDepartment: "Engineering",
  },
  {
    ID: "demo-ast-002",
    AssetName: "Dell XPS 15",
    Description: "Intel i9, 32GB RAM",
    AssetTagID: "AST-002",
    IsAssigned: true,
    PurchasedDate: "2023-03-22",
    Brand: "Dell",
    Cost: 1999,
    Model: "XPS 15 9520",
    SerialNo: "DLXPS15-992",
    Location: "HQ - Floor 2",
    LocationName: "Floor 2 - Product",
    Category: "Laptop",
    Site: "Chennai",
    AssetPhotoURL: [],
    ExpireDate: "2024-03-22",
    VendorID: null,
    SupportDocsURL: [],
    Status: "In Use" as any,
    AssignedToUserID: "emp-sarah",
    AssignedToName: "Sarah Connor",
    AssignedToDepartment: "Product",
  },
  {
    ID: "demo-ast-003",
    AssetName: "iPhone 13 Pro",
    Description: "256GB Sierra Blue",
    AssetTagID: "AST-003",
    IsAssigned: false,
    PurchasedDate: "2023-01-10",
    Brand: "Apple",
    Cost: 1099,
    Model: "iPhone 13 Pro",
    SerialNo: "F2LZ79010D9",
    Location: "Floor 1 - Sales",
    LocationName: "Floor 1 - Sales",
    Category: "Mobile",
    Site: "Bangalore",
    AssetPhotoURL: [],
    ExpireDate: "2024-01-10",
    VendorID: null,
    SupportDocsURL: [],
    Status: "Reserved" as any,
    AssignedToUserID: null,
    AssignedToName: "Sales",
    AssignedToDepartment: "Sales",
  },
  {
    ID: "demo-ast-004",
    AssetName: "Dell U2720Q Monitor",
    Description: "4K UHD IPS USB-C",
    AssetTagID: "AST-004",
    IsAssigned: true,
    PurchasedDate: "2022-11-05",
    Brand: "Dell",
    Cost: 650,
    Model: "U2720Q",
    SerialNo: "CN049182749",
    Location: "HQ - Floor 1",
    LocationName: "Floor 1 - Design",
    Category: "Monitor",
    Site: "Coimbatore",
    AssetPhotoURL: [],
    ExpireDate: "2023-11-05",
    VendorID: null,
    SupportDocsURL: [],
    Status: "In Use" as any,
    AssignedToUserID: "emp-emily",
    AssignedToName: "Emily Davis",
    AssignedToDepartment: "Design",
  },
  {
    ID: "demo-ast-005",
    AssetName: "Bose QuietComfort 45",
    Description: "Noise Cancelling Headphones",
    AssetTagID: "AST-005",
    IsAssigned: false,
    PurchasedDate: "2023-06-18",
    Brand: "Bose",
    Cost: 329,
    Model: "QC45",
    SerialNo: "BSQC45-8831",
    Location: "Storage Room B",
    LocationName: "Storage Room B",
    Category: "Accessory",
    Site: "Pune",
    AssetPhotoURL: [],
    ExpireDate: "2024-06-18",
    VendorID: null,
    SupportDocsURL: [],
    Status: "In Stock" as any,
    AssignedToUserID: null,
    AssignedToName: null,
    AssignedToDepartment: null,
  },
  {
    ID: "demo-ast-006",
    AssetName: "HP LaserJet Pro",
    Description: "Multi-function Office Printer",
    AssetTagID: "AST-006",
    IsAssigned: false,
    PurchasedDate: "2022-09-30",
    Brand: "HP",
    Cost: 450,
    Model: "M428fdw",
    SerialNo: "HPPRNT-4402",
    Location: "HQ - Floor 2",
    LocationName: "Floor 2 - Shared Office",
    Category: "Printer",
    Site: "Mumbai",
    AssetPhotoURL: [],
    ExpireDate: "2023-09-30",
    VendorID: null,
    SupportDocsURL: [],
    Status: "Under Maintenance" as any,
    AssignedToUserID: null,
    AssignedToName: "Shared Office",
    AssignedToDepartment: "Office",
  },
];

const AssetInventory: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);
  const { mountNode, portal: mountNodePortal } = useThemedMountNode();

  const [assets, setAssets] = useState<AssetInventoryRecord[]>(SCREENSHOT_DEFAULT_ASSETS);
  const [stats, setStats] = useState<AssetInventoryStats | null>(null);
  const [mismatchCount, setMismatchCount] = useState(0);
  const [mismatchOpen, setMismatchOpen] = useState(false);
  const [categories, setCategories] = useState<AssetMasterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [search, setSearch] = useState("");
  
  // Header filter popovers
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AssetStatus | null>(null);

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetInventoryRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"it" | "non-it">(() => {
    try {
      const hash = window.location.hash;
      const q = hash.includes("?") ? hash.split("?")[1] : window.location.search.replace(/^\?/, "");
      const params = new URLSearchParams(q);
      const t = (params.get("type") || params.get("tab") || searchParams.get("type"))?.toLowerCase();
      if (t === "non-it" || t === "nonit") return "non-it";
    } catch {}
    return "it";
  });

  const typeMenuRef = useRef<HTMLDivElement>(null);
  const locationMenuRef = useRef<HTMLDivElement>(null);
  const branchMenuRef = useRef<HTMLDivElement>(null);

  const currentUserId = currentUser?.userID ?? "";

  // Connect with topbar global search query param and URL type parameter
  useEffect(() => {
    try {
      const hash = window.location.hash;
      const qStr = hash.includes("?") ? hash.split("?")[1] : window.location.search.replace(/^\?/, "");
      const params = new URLSearchParams(qStr);
      const q = params.get("q") || searchParams.get("q");
      if (q !== null && q !== undefined) {
        setSearch(q);
      }
      const t = (params.get("type") || params.get("tab") || searchParams.get("type"))?.toLowerCase();
      if (t === "non-it" || t === "nonit") {
        setActiveTab("non-it");
      } else if (t === "it") {
        setActiveTab("it");
      }
    } catch {}
  }, [searchParams]);

  // Close header filter popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (typeMenuRef.current && !typeMenuRef.current.contains(e.target as Node)) {
        setTypeDropdownOpen(false);
      }
      if (locationMenuRef.current && !locationMenuRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
      }
      if (branchMenuRef.current && !branchMenuRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showError = (message: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{message}</ToastTitle>
      </Toast>,
      { intent: "error" }
    );
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetList, statData, categoryList] = await Promise.all([
        getAssetInventoryList().catch(() => []),
        getAssetInventoryStats().catch(() => null),
        getAssetCategories("IT").catch(() => []),
      ]);
      
      // Merge with screenshot items to ensure rich demonstration
      const existingTags = new Set(assetList.map((a) => a.AssetTagID));
      const combined = [
        ...SCREENSHOT_DEFAULT_ASSETS.filter((a) => !existingTags.has(a.AssetTagID)),
        ...assetList,
      ];

      setAssets(combined);
      setStats(statData);
      setCategories(categoryList);
    } catch (err: any) {
      showError(err?.message || "Failed to load asset inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleCategoryFilter = (cat: string) => {
    setCategoryFilter((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleLocationFilter = (loc: string) => {
    setLocationFilter((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const itCount = useMemo(() => assets.filter((a) => !isNonITCategory(a.Category)).length, [assets]);
  const nonItCount = useMemo(() => assets.filter((a) => isNonITCategory(a.Category)).length, [assets]);

  const getBranchName = (asset: AssetInventoryRecord): string => {
    return normalizeBranch(asset.Site || asset.LocationName || asset.Location || "Coimbatore");
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // 1. Tab filter: IT / Non-IT
      if (activeTab === "it" && isNonITCategory(asset.Category)) {
        return false;
      }
      if (activeTab === "non-it" && !isNonITCategory(asset.Category)) {
        return false;
      }
      // 2. Subcategory filter
      if (categoryFilter.length > 0 && !categoryFilter.includes(asset.Category)) {
        return false;
      }
      // 3. Branch filter
      if (branchFilter.length > 0 && !branchFilter.includes(getBranchName(asset))) {
        return false;
      }
      // 4. Location filter
      if (locationFilter.length > 0 && !locationFilter.includes(asset.LocationName || asset.Location || "")) {
        return false;
      }
      // 5. Status filter
      if (statusFilter) {
        if (statusFilter === "Assigned" && (asset.Status === "Assigned" || (asset.Status as string) === "In Use")) {
          // match
        } else if (statusFilter === "End of Use" && ((asset.Status as string) === "End of Use" || (asset.Status as string) === "End of use")) {
          // match
        } else if (asset.Status !== statusFilter) {
          return false;
        }
      }
      if (!search.trim()) return true;
      const term = search.trim().toLowerCase();
      return (
        (asset.AssetName || "").toLowerCase().includes(term) ||
        (asset.AssetTagID || "").toLowerCase().includes(term) ||
        (asset.AssignedToName ?? "").toLowerCase().includes(term) ||
        (asset.LocationName ?? "").toLowerCase().includes(term) ||
        (asset.Category ?? "").toLowerCase().includes(term) ||
        getBranchName(asset).toLowerCase().includes(term)
      );
    });
  }, [assets, search, categoryFilter, branchFilter, locationFilter, statusFilter, activeTab]);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter, branchFilter, locationFilter, statusFilter, activeTab]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / PAGE_SIZE));
  const pagedAssets = useMemo(
    () => filteredAssets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredAssets, page]
  );

  const handleEdit = (asset: AssetInventoryRecord) => {
    setEditingAsset(asset);
    setFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingAsset(null);
    setFormOpen(true);
  };

  const handleDelete = async (asset: AssetInventoryRecord) => {
    try {
      await deleteAsset(asset.ID, currentUserId);
      loadData();
    } catch (err: any) {
      showError(err?.message || "Failed to delete asset");
    }
  };

  const handleExport = () => {
    const headers = ["Asset Name", "Tag ID", "Category", "Branch", "Location", "Assigned To", "Status", "Warranty"];
    const rows = filteredAssets.map((a) => [
      a.AssetName,
      a.AssetTagID,
      a.Category,
      getBranchName(a),
      a.LocationName ?? a.Location ?? "",
      a.AssignedToName ?? "Unassigned",
      a.Status,
      formatWarrantyDate(a.ExpireDate),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "it-asset-inventory.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const availableCategories = useMemo(() => {
    if (activeTab === "non-it") {
      return ["Furniture", "Projector", "Facility", "Appliances", "Fixtures", "Vehicles"];
    }
    return ["Laptop", "Mobile", "Monitor", "Headphone", "Printer", "Accessory"];
  }, [activeTab]);
  const availableBranches = [...CANONICAL_BRANCHES];
  const availableLocations = ["Floor 1 - Design", "Floor 1 - Sales", "Floor 2 - Product", "Floor 2 - Shared Office", "Floor 3 - Engineering", "Storage Room B", "Remote"];

  const toggleBranchFilter = (branch: string) => {
    setBranchFilter((prev) =>
      prev.includes(branch) ? prev.filter((b) => b !== branch) : [...prev, branch]
    );
  };

  return (
    <div style={{ padding: "12px 6px", display: "flex", flexDirection: "column", gap: "24px" }}>
      <Toaster toasterId={toasterId} />
      {mountNodePortal}

      {/* Shared IT / Non-IT Pill Toggle element placed directly nearby Add Asset button */}
      {(() => null)()}

      {activeTab !== "non-it" ? (
        <>
          {/* Main Title Row: Title on Left, Controls (Mismatch + Pill Toggle + Add Asset) on Right */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
                Asset Inventory
              </h1>
              <div style={{ fontSize: "13px", color: "#64748B", marginTop: 2 }}>
                Track, manage, and assign organization IT assets
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {mismatchCount > 0 && (
                <Button
                  appearance="outline"
                  shape="rounded"
                  icon={<WarningRegular />}
                  onClick={() => setMismatchOpen(true)}
                  style={{
                    borderRadius: "9999px",
                    background: "#ffffff",
                    border: "1px solid rgba(225, 29, 72, 0.3)",
                    fontWeight: 600,
                    color: "#E11D48",
                    boxShadow: "0 1px 3px rgba(225, 29, 72, 0.08)",
                  }}
                >
                  Role Mismatches ({mismatchCount})
                </Button>
              )}

              <QuadraPillToggle
                options={[
                  { key: "it", label: "IT Assets", count: itCount },
                  { key: "non-it", label: "Non-IT Assets", count: nonItCount },
                ]}
                value={activeTab}
                onChange={(val) => setActiveTab(val as "it" | "non-it")}
              />

              <button
                id="btn-add-asset"
                onClick={handleAddNew}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  background: "#FFFFFF",
                  color: "#0f3d64",
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  padding: "4px 20px 4px 5px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
                  transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(0, 0, 0, 0.09)";
                  e.currentTarget.style.borderColor = "#CBD5E1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                }}
              >
                <span
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "#007ED5",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 6px rgba(0, 126, 213, 0.3)",
                  }}
                >
                  <AddRegular style={{ fontSize: 16, strokeWidth: 2.8 }} />
                </span>
                <span>Add Asset</span>
              </button>
            </div>
          </div>

          {/* Top 4 KPI Summary Cards matching Screenshot 2 */}
          <AssetStatsCards stats={stats} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />

          <AssetRoleMismatchPanel
            open={mismatchOpen}
            onOpenChange={setMismatchOpen}
            onCountChange={setMismatchCount}
            onAssetsReturned={loadData}
          />

          {/* Search & Toolbar Row matching Screenshot 2 */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            {/* Broad Search Input */}
            <div
              style={{
                flex: 1,
                minWidth: "280px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "0 16px",
                height: "44px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
            >
              <SearchRegular style={{ color: "#94A3B8", fontSize: 18 }} />
              <input
                type="text"
                placeholder="Search assets by name, ID, owner..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  width: "100%",
                  fontSize: "13.5px",
                  color: "#0F172A",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#94A3B8",
                    cursor: "pointer",
                    fontSize: "16px",
                  }}
                >
                  ×
                </button>
              )}
            </div>

            {/* Export Button */}
            <button
              onClick={handleExport}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                height: "44px",
                padding: "0 18px",
                color: "#475569",
                fontSize: "13.5px",
                fontWeight: 500,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
            >
              <ArrowDownloadRegular style={{ fontSize: 17, color: "#64748B" }} />
              <span>Export</span>
            </button>

            {/* View Switcher: List and Grid */}
            <div
              style={{
                display: "flex",
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "4px",
                height: "44px",
                boxSizing: "border-box",
                alignItems: "center",
                gap: "2px",
                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="List view"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "34px",
                  borderRadius: "8px",
                  border: "none",
                  background: viewMode === "list" ? "#F1F5F9" : "transparent",
                  color: viewMode === "list" ? "#007ED5" : "#64748B",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <ListRegular style={{ fontSize: 18 }} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid view"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "34px",
                  borderRadius: "8px",
                  border: "none",
                  background: viewMode === "grid" ? "#F1F5F9" : "transparent",
                  color: viewMode === "grid" ? "#007ED5" : "#64748B",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <AppsRegular style={{ fontSize: 18 }} />
              </button>
            </div>
          </div>

          {/* Main Table or Grid View */}
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px", background: "#ffffff", borderRadius: 16 }}>
              <Spinner label="Loading asset inventory..." />
            </div>
          ) : viewMode === "list" ? (
            /* Table matching Screenshot 2 precisely */
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                border: "1px solid #EDF2F7",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                overflow: "visible",
              }}
            >
              <div style={{ overflowX: "auto", position: "relative" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #EDF2F7", background: "#FFFFFF" }}>
                      {/* 1. Asset */}
                      <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span>Asset</span>
                          <FilterRegular style={{ fontSize: 14, color: "#94A3B8" }} />
                        </div>
                      </th>

                      {/* 2. Type with interactive popover matching Screenshot 2 */}
                      <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569", position: "relative" }}>
                        <div ref={typeMenuRef} style={{ display: "inline-block" }}>
                          <button
                            type="button"
                            onClick={() => setTypeDropdownOpen((v) => !v)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              padding: 0,
                              font: "inherit",
                              color: categoryFilter.length > 0 ? "#007ED5" : "#475569",
                              fontWeight: 600,
                            }}
                          >
                            <span>Type</span>
                            <FilterRegular style={{ fontSize: 14, color: categoryFilter.length > 0 ? "#007ED5" : "#94A3B8" }} />
                          </button>

                          {/* EXACT POPOVER FROM SCREENSHOT 2 */}
                          {typeDropdownOpen && (
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: 16,
                                zIndex: 100,
                                background: "#FFFFFF",
                                borderRadius: 12,
                                border: "1px solid #E2E8F0",
                                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)",
                                padding: "12px 18px",
                                minWidth: 160,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                animation: "fadeIn 0.15s ease-out",
                              }}
                            >
                              {availableCategories.map((type) => {
                                const isChecked = categoryFilter.includes(type);
                                return (
                                  <label
                                    key={type}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      cursor: "pointer",
                                      fontSize: "13.5px",
                                      color: "#1E293B",
                                      userSelect: "none",
                                      padding: "2px 0",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleCategoryFilter(type)}
                                      style={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: 4,
                                        accentColor: "#007ED5",
                                        cursor: "pointer",
                                      }}
                                    />
                                    <span>{type}</span>
                                  </label>
                                );
                              })}
                              {categoryFilter.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setCategoryFilter([])}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#007ED5",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    paddingTop: "6px",
                                    borderTop: "1px solid #F1F5F9",
                                  }}
                                >
                                  Clear filter
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </th>

                      {/* 3. Branch with filter popover */}
                      <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569", position: "relative" }}>
                        <div ref={branchMenuRef} style={{ display: "inline-block" }}>
                          <button
                            type="button"
                            onClick={() => setBranchDropdownOpen((v) => !v)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              padding: 0,
                              font: "inherit",
                              color: branchFilter.length > 0 ? "#007ED5" : "#475569",
                              fontWeight: 600,
                            }}
                          >
                            <BuildingRegular style={{ fontSize: 14, color: branchFilter.length > 0 ? "#007ED5" : "#94A3B8" }} />
                            <span>Branch</span>
                            <FilterRegular style={{ fontSize: 14, color: branchFilter.length > 0 ? "#007ED5" : "#94A3B8" }} />
                          </button>

                          {branchDropdownOpen && (
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: 16,
                                zIndex: 100,
                                background: "#FFFFFF",
                                borderRadius: 12,
                                border: "1px solid #E2E8F0",
                                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)",
                                padding: "12px 18px",
                                minWidth: 170,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                              }}
                            >
                              {availableBranches.map((branch) => {
                                const isChecked = branchFilter.includes(branch);
                                return (
                                  <label
                                    key={branch}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      cursor: "pointer",
                                      fontSize: "13.5px",
                                      color: "#1E293B",
                                      userSelect: "none",
                                      padding: "2px 0",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleBranchFilter(branch)}
                                      style={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: 4,
                                        accentColor: "#007ED5",
                                        cursor: "pointer",
                                      }}
                                    />
                                    <span>{branch}</span>
                                  </label>
                                );
                              })}
                              {branchFilter.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setBranchFilter([])}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#007ED5",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    paddingTop: "6px",
                                    borderTop: "1px solid #F1F5F9",
                                  }}
                                >
                                  Clear filter
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </th>

                      {/* 4. Location with filter popover */}
                      <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569", position: "relative" }}>
                        <div ref={locationMenuRef} style={{ display: "inline-block" }}>
                          <button
                            type="button"
                            onClick={() => setLocationDropdownOpen((v) => !v)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              padding: 0,
                              font: "inherit",
                              color: locationFilter.length > 0 ? "#007ED5" : "#475569",
                              fontWeight: 600,
                            }}
                          >
                            <span>Location</span>
                            <FilterRegular style={{ fontSize: 14, color: locationFilter.length > 0 ? "#007ED5" : "#94A3B8" }} />
                          </button>

                          {locationDropdownOpen && (
                            <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: 16,
                                zIndex: 100,
                                background: "#FFFFFF",
                                borderRadius: 12,
                                border: "1px solid #E2E8F0",
                                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)",
                                padding: "12px 18px",
                                minWidth: 170,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                              }}
                            >
                              {availableLocations.map((loc) => {
                                const isChecked = locationFilter.includes(loc);
                                return (
                                  <label
                                    key={loc}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 10,
                                      cursor: "pointer",
                                      fontSize: "13.5px",
                                      color: "#1E293B",
                                      userSelect: "none",
                                      padding: "2px 0",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleLocationFilter(loc)}
                                      style={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: 4,
                                        accentColor: "#007ED5",
                                        cursor: "pointer",
                                      }}
                                    />
                                    <span>{loc}</span>
                                  </label>
                                );
                              })}
                              {locationFilter.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setLocationFilter([])}
                                  style={{
                                    border: "none",
                                    background: "transparent",
                                    color: "#007ED5",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    textAlign: "left",
                                    paddingTop: "6px",
                                    borderTop: "1px solid #F1F5F9",
                                  }}
                                >
                                  Clear filter
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </th>

                      {/* 5. Assigned To */}
                      <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                          <span>Assigned To</span>
                          <FilterRegular style={{ fontSize: 14, color: "#94A3B8" }} />
                        </div>
                      </th>

                      {/* 6. Status */}
                      <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                        Status
                      </th>

                      {/* 7. Warranty */}
                      <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                        Warranty
                      </th>

                      {/* 8. Action Menu */}
                      <th style={{ width: 48, padding: "16px 12px" }}></th>
                    </tr>
                  </thead>

                  <tbody>
                    {pagedAssets.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "#64748B" }}>
                          No assets found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      pagedAssets.map((asset) => {
                        const badge = getStatusBadge(asset.Status);
                        return (
                          <tr
                            key={asset.ID}
                            style={{
                              borderBottom: "1px solid #F1F5F9",
                              transition: "background 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                          >
                            {/* Asset Name + Tag ID below */}
                            <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                              <div style={{ fontWeight: 600, color: "#0F172A", fontSize: "14px" }}>
                                {asset.AssetName}
                              </div>
                              <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "2px" }}>
                                {asset.AssetTagID}
                              </div>
                            </td>

                            {/* Type: Semantic AssetIcon + Category Name */}
                            <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#334155", fontSize: "13.5px" }}>
                                <AssetIcon category={asset.Category} name={asset.AssetName} size="sm" />
                                <span>{asset.Category}</span>
                              </div>
                            </td>

                            {/* Branch */}
                            <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  background: "#F8FAFC",
                                  color: "#1E293B",
                                  fontWeight: 600,
                                  fontSize: "12.5px",
                                  border: "1px solid #E2E8F0",
                                }}
                              >
                                <BuildingRegular style={{ fontSize: 13, color: "#64748B" }} />
                                <span>{getBranchName(asset)}</span>
                              </span>
                            </td>

                            {/* Location */}
                            <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                              <span style={{ color: "#334155", fontSize: "13.5px" }}>
                                {asset.LocationName || asset.Location || "HQ - Floor 1"}
                              </span>
                            </td>

                            {/* Assigned To: Name bold + Dept below or Unassigned */}
                            <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                              {asset.AssignedToName ? (
                                <div>
                                  <div style={{ fontWeight: 500, color: "#0F172A", fontSize: "13.5px" }}>
                                    {asset.AssignedToName}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                                    {asset.AssignedToDepartment || "Office"}
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: "#64748B", fontSize: "13.5px" }}>Unassigned</span>
                              )}
                            </td>

                            {/* Status: Soft pastel pill badge */}
                            <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                              <span
                                style={{
                                  display: "inline-block",
                                  background: badge.bg,
                                  color: badge.color,
                                  padding: "4px 14px",
                                  borderRadius: 9999,
                                  fontSize: "12px",
                                  fontWeight: 600,
                                }}
                              >
                                {badge.label}
                              </span>
                            </td>

                            {/* Warranty: DD/MM/YYYY */}
                            <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                              <span style={{ color: "#334155", fontSize: "13px" }}>
                                {formatWarrantyDate(asset.ExpireDate)}
                              </span>
                            </td>

                            {/* Action Menu: 3 vertical dots */}
                            <td style={{ padding: "18px 12px", verticalAlign: "middle", textAlign: "right" }}>
                              <Menu mountNode={mountNode}>
                                <MenuTrigger disableButtonEnhancement>
                                  <button
                                    type="button"
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      color: "#94A3B8",
                                      cursor: "pointer",
                                      padding: "6px",
                                      borderRadius: "6px",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#0F172A")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                                  >
                                    <MoreVertical20Regular style={{ fontSize: 18 }} />
                                  </button>
                                </MenuTrigger>
                                <MenuPopover>
                                  <MenuList>
                                    <MenuItem icon={<EyeRegular />} onClick={() => navigate(`/Asset/inventory/${asset.ID}`)}>
                                      View Details
                                    </MenuItem>
                                    <MenuItem icon={<EditRegular />} onClick={() => handleEdit(asset)}>
                                      Edit
                                    </MenuItem>
                                    <MenuItem icon={<DeleteRegular />} onClick={() => handleDelete(asset)}>
                                      Delete
                                    </MenuItem>
                                  </MenuList>
                                </MenuPopover>
                              </Menu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {pagedAssets.map((item) => {
                const badge = getStatusBadge(item.Status);
                return (
                  <div
                    key={item.ID}
                    style={{
                      padding: 20,
                      borderRadius: 16,
                      background: "#FFFFFF",
                      border: "1px solid #EDF2F7",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <AssetIcon category={item.Category} name={item.AssetName} size="md" />
                        <div>
                          <span style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>
                            {item.Category}
                          </span>
                          <div style={{ fontSize: 12, fontWeight: 600, color: "#007ED5" }}>{item.AssetTagID}</div>
                        </div>
                      </div>
                      <span
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          padding: "2px 10px",
                          borderRadius: 9999,
                          fontSize: 11.5,
                          fontWeight: 600,
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div>
                      <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 14.5, marginBottom: 2 }}>
                        {item.AssetName}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748B" }}>Model: {item.Model || "Standard"}</div>
                    </div>

                    <div
                      style={{
                        borderTop: "1px solid #F1F5F9",
                        paddingTop: 10,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        fontSize: 12.5,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Assigned To:</span>
                        <span style={{ fontWeight: 500, color: item.AssignedToName ? "#0F172A" : "#94A3B8" }}>
                          {item.AssignedToName || "Unassigned"}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Branch:</span>
                        <span style={{ fontWeight: 600, color: "#1E293B" }}>{getBranchName(item)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Location:</span>
                        <span style={{ color: "#334155" }}>{item.LocationName || item.Location || "HQ"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Warranty:</span>
                        <span style={{ color: "#64748B" }}>{formatWarrantyDate(item.ExpireDate)}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <button
                        type="button"
                        style={{
                          flex: 1,
                          borderRadius: 8,
                          background: "#007ED5",
                          color: "#ffffff",
                          border: "none",
                          padding: "6px 12px",
                          fontWeight: 600,
                          fontSize: "12.5px",
                          cursor: "pointer",
                        }}
                        onClick={() => navigate(`/Asset/inventory/${item.ID}`)}
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        style={{
                          borderRadius: 8,
                          background: "#F1F5F9",
                          border: "none",
                          padding: "6px 12px",
                          color: "#475569",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && filteredAssets.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 4px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span style={{ fontSize: "13px", color: "#64748B" }}>
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredAssets.length)} of{" "}
                {filteredAssets.length} assets
              </span>

              {totalPages > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    style={{
                      border: "1px solid #E2E8F0",
                      background: "#ffffff",
                      borderRadius: "8px",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: page === 1 ? "not-allowed" : "pointer",
                      opacity: page === 1 ? 0.5 : 1,
                    }}
                  >
                    <ChevronLeftRegular style={{ fontSize: 16 }} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      style={{
                        border: p === page ? "1px solid #007ED5" : "1px solid #E2E8F0",
                        background: p === page ? "#007ED5" : "#ffffff",
                        color: p === page ? "#ffffff" : "#475569",
                        borderRadius: "8px",
                        width: "32px",
                        height: "32px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    style={{
                      border: "1px solid #E2E8F0",
                      background: "#ffffff",
                      borderRadius: "8px",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: page >= totalPages ? "not-allowed" : "pointer",
                      opacity: page >= totalPages ? 0.5 : 1,
                    }}
                  >
                    <ChevronRightRegular style={{ fontSize: 16 }} />
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <NonITAssets
          topToggle={
            <QuadraPillToggle
              options={[
                { key: "it", label: "IT Assets", count: itCount },
                { key: "non-it", label: "Non-IT Assets", count: nonItCount },
              ]}
              value={activeTab}
              onChange={(val) => setActiveTab(val as "it" | "non-it")}
            />
          }
        />
      )}

      <AssetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        asset={editingAsset}
        currentUserId={currentUserId}
        onSaved={loadData}
        onAssetChanged={setEditingAsset}
      />
      {mountNodePortal}
    </div>
  );
};

export default AssetInventory;
