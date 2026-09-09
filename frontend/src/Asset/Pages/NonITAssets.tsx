import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Spinner,
  Text,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import {
  AddRegular,
  EditRegular,
  DeleteRegular,
  ArrowDownloadRegular,
  SearchRegular,
  BuildingRegular,
  WeatherSnowRegular,
  DrinkCoffeeRegular,
  PlugConnectedRegular,
  BoxToolboxRegular,
  ChevronRightRegular,
  ChevronLeftRegular,
  FilterRegular,
  ListRegular,
  AppsRegular,
  MoreVertical20Regular,
  EyeRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { AssetCategoryRecord, AssetStatus, getAssetCategories } from "../Services/AssetInventoryService";
import { NonITAssetRecord, getNonITAssets, deleteNonITAsset } from "../Services/NonITAssetService";
import NonITAssetFormDialog from "../Components/NonITAssetFormDialog";
import { CANONICAL_BRANCHES, normalizeBranch } from "../../Common/EnterpriseConstants";

// ============================================================================
// KPI Folder Icons matching IT Asset List Design
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

const getNonITCategoryIcon = (category: string) => {
  const c = (category || "").toLowerCase();
  if (c.includes("hvac") || c.includes("ac") || c.includes("purifier") || c.includes("cool")) {
    return <WeatherSnowRegular style={{ color: "#0284c7" }} />;
  }
  if (c.includes("pantry") || c.includes("coffee") || c.includes("vending") || c.includes("water")) {
    return <DrinkCoffeeRegular style={{ color: "#b45309" }} />;
  }
  if (c.includes("electric") || c.includes("generator") || c.includes("ups") || c.includes("battery")) {
    return <PlugConnectedRegular style={{ color: "#eab308" }} />;
  }
  return <BoxToolboxRegular style={{ color: "#8b5cf6" }} />;
};

const formatLakhs = (val: number): string => {
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(1)} L`;
  }
  return `₹${val.toLocaleString("en-IN")}`;
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "numeric", year: "numeric" }) : "—";

const formatValue = (value: number | null) =>
  value != null ? `₹${value.toLocaleString("en-IN")}` : "—";

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

const PAGE_SIZE = 10;

interface NonITAssetsProps {
  topToggle?: React.ReactNode;
}

const NonITAssets: React.FC<NonITAssetsProps> = ({ topToggle }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userID ?? "";
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [assets, setAssets] = useState<NonITAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // View mode
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Search & in-table filter states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<AssetStatus | null>(null);

  // In-table popover open states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);

  const categoryMenuRef = useRef<HTMLDivElement>(null);
  const branchMenuRef = useRef<HTMLDivElement>(null);
  const locationMenuRef = useRef<HTMLDivElement>(null);

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<NonITAssetRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Close header popovers on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
      if (branchMenuRef.current && !branchMenuRef.current.contains(e.target as Node)) {
        setBranchDropdownOpen(false);
      }
      if (locationMenuRef.current && !locationMenuRef.current.contains(e.target as Node)) {
        setLocationDropdownOpen(false);
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

  const loadAll = async () => {
    setLoading(true);
    try {
      const [categoryData, assetData] = await Promise.all([getAssetCategories("Non-IT"), getNonITAssets()]);
      setCategories(categoryData);
      setAssets(assetData);
    } catch (err: any) {
      showError(err?.message || "Failed to load Non-IT assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const availableCategories = useMemo(() => {
    const unique = Array.from(new Set(categories.map((c) => c.CategoryName).filter(Boolean)));
    if (unique.length > 0) return unique;
    return ["HVAC & Climate", "Pantry & Appliances", "Electrical & Power", "Office Fixtures", "Furniture", "Security / CCTV"];
  }, [categories]);

  const availableBranches = useMemo(() => [...CANONICAL_BRANCHES], []);
  const availableLocations = useMemo(
    () => ["Main Floor", "Floor 1", "Floor 2", "Floor 3", "Floor 4", "Floor 5", "Basement", "Cafeteria"],
    []
  );

  const toggleCategoryFilter = (cat: string) => {
    setCategoryFilter((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const toggleBranchFilter = (b: string) => {
    setBranchFilter((prev) => (prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b]));
  };

  const toggleLocationFilter = (loc: string) => {
    setLocationFilter((prev) => (prev.includes(loc) ? prev.filter((item) => item !== loc) : [...prev, loc]));
  };

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      // 1. Branch filter
      if (branchFilter.length > 0) {
        const off = normalizeBranch(a.LocationName || "Coimbatore");
        if (!branchFilter.includes(off)) return false;
      }
      // 2. Category filter
      if (categoryFilter.length > 0 && !categoryFilter.includes(a.CategoryName)) {
        return false;
      }
      // 3. Location filter
      if (locationFilter.length > 0) {
        const locStr = a.Floor ? `Floor ${a.Floor}` : "Main Floor";
        if (!locationFilter.includes(locStr)) return false;
      }
      // 4. Status filter
      if (filterStatus) {
        if (filterStatus === "Assigned" && (a.Status === "Assigned" || (a.Status as string) === "In Use")) {
          // match
        } else if (filterStatus === "End of Use" && ((a.Status as string) === "End of Use" || (a.Status as string) === "End of use")) {
          // match
        } else if (a.Status !== filterStatus) {
          return false;
        }
      }
      // 5. Search
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const branchStr = normalizeBranch(a.LocationName || "Coimbatore").toLowerCase();
        const match =
          (a.AssetTag || "").toLowerCase().includes(term) ||
          (a.CategoryName || "").toLowerCase().includes(term) ||
          (a.LocationName || "").toLowerCase().includes(term) ||
          (a.VendorName || "").toLowerCase().includes(term) ||
          branchStr.includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [assets, branchFilter, categoryFilter, locationFilter, filterStatus, search]);

  useEffect(() => {
    setPage(1);
  }, [branchFilter, categoryFilter, locationFilter, filterStatus, search]);

  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / PAGE_SIZE));
  const pagedAssets = useMemo(() => {
    return filteredAssets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredAssets, page]);

  // Metric stats for Folder KPI cards
  const statsCounts = useMemo(() => {
    const assigned = assets.filter((a) => a.Status === "Assigned" || (a.Status as string) === "In Use").length;
    const inStock = assets.filter((a) => a.Status === "In Stock").length;
    const maintenance = assets.filter((a) => a.Status === "Under Maintenance").length;
    const endOfUse = assets.filter((a) => a.Status === "End of Use" || (a.Status as string) === "End of use").length;
    return { assigned, inStock, maintenance, endOfUse };
  }, [assets]);

  const totalBookValue = useMemo(() => {
    return filteredAssets.reduce((acc, a) => acc + (a.Value || 0), 0);
  }, [filteredAssets]);

  const toggleStatusFilter = (status: AssetStatus) => {
    setFilterStatus((prev) => (prev === status ? null : status));
  };

  const openAdd = () => {
    setEditingAsset(null);
    setFormOpen(true);
  };

  const openEdit = (asset: NonITAssetRecord) => {
    setEditingAsset(asset);
    setFormOpen(true);
  };

  const handleDelete = async (asset: NonITAssetRecord) => {
    setDeletingId(asset.ID);
    try {
      await deleteNonITAsset(asset.ID, currentUserId);
      loadAll();
    } catch (err: any) {
      showError(err?.message || "Failed to delete Non-IT asset");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = () => {
    const headers = ["Asset Tag", "Category", "Branch", "Location / Floor", "Custodian", "Status", "AMC Expiry", "Book Value"];
    const rows = filteredAssets.map((a) => [
      a.AssetTag,
      a.CategoryName,
      normalizeBranch(a.LocationName || "Coimbatore"),
      a.Floor ? `Floor ${a.Floor}` : "Main Floor",
      a.VendorName || "Facilities",
      a.Status,
      formatDate(a.AMCExpiryDate),
      a.Value || 0,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "non-it-assets.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Toaster toasterId={toasterId} />
      {portal}

      {/* Main Title Row matching IT Asset Inventory (NO export button here) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
            Non-IT Asset Inventory
          </h1>
          <div style={{ fontSize: "13px", color: "#64748B", marginTop: 2 }}>
            Facility & physical assets · Total: <strong style={{ color: "#0F172A" }}>{formatLakhs(totalBookValue)}</strong>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {topToggle}

          <button
            onClick={openAdd}
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

      {/* 4 KPI Folder Summary Cards matching IT Assets */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {/* 1. Assigned / In Use */}
        <div
          onClick={() => toggleStatusFilter("Assigned")}
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "18px 22px",
            border: filterStatus === "Assigned" ? "2px solid #16A34A" : "1px solid #edf2f7",
            boxShadow: filterStatus === "Assigned" ? "0 4px 14px rgba(22, 163, 74, 0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
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
                background: "#E8FBF0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FolderAssignedIcon />
            </div>
            <div>
              <div style={{ fontSize: 13, color: "#64748B", fontWeight: 500 }}>In Use</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", marginTop: 1, letterSpacing: "-0.02em" }}>
                {statsCounts.assigned}
              </div>
            </div>
          </div>
          <ChevronRightRegular style={{ color: "#94A3B8", fontSize: 18 }} />
        </div>

        {/* 2. In Stock */}
        <div
          onClick={() => toggleStatusFilter("In Stock")}
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "18px 22px",
            border: filterStatus === "In Stock" ? "2px solid #007ED5" : "1px solid #edf2f7",
            boxShadow: filterStatus === "In Stock" ? "0 4px 14px rgba(0, 126, 213, 0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
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
                background: "#EFF6FF",
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
                {statsCounts.inStock}
              </div>
            </div>
          </div>
          <ChevronRightRegular style={{ color: "#94A3B8", fontSize: 18 }} />
        </div>

        {/* 3. Under Maintenance */}
        <div
          onClick={() => toggleStatusFilter("Under Maintenance")}
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "18px 22px",
            border: filterStatus === "Under Maintenance" ? "2px solid #D97706" : "1px solid #edf2f7",
            boxShadow: filterStatus === "Under Maintenance" ? "0 4px 14px rgba(217, 119, 6, 0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
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
                background: "#FFF7E6",
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
                {statsCounts.maintenance}
              </div>
            </div>
          </div>
          <ChevronRightRegular style={{ color: "#94A3B8", fontSize: 18 }} />
        </div>

        {/* 4. End of Use */}
        <div
          onClick={() => toggleStatusFilter("End of Use")}
          style={{
            background: "#ffffff",
            borderRadius: 16,
            padding: "18px 22px",
            border: filterStatus === "End of Use" ? "2px solid #DC2626" : "1px solid #edf2f7",
            boxShadow: filterStatus === "End of Use" ? "0 4px 14px rgba(220, 38, 38, 0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
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
                {statsCounts.endOfUse}
              </div>
            </div>
          </div>
          <ChevronRightRegular style={{ color: "#94A3B8", fontSize: 18 }} />
        </div>
      </div>

      {/* Search & Toolbar Row matching IT Asset Inventory EXACTLY */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        {/* Search Input */}
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
            placeholder="Search Non-IT assets by tag, category, vendor, branch..."
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

        {/* Export Button placed beside Search Bar */}
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

      {/* Main Table or Grid View matching IT Asset List Design */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", background: "#ffffff", borderRadius: 16 }}>
          <Spinner label="Loading Non-IT assets..." />
        </div>
      ) : viewMode === "list" ? (
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

                  {/* 2. Type with interactive popover */}
                  <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569", position: "relative" }}>
                    <div ref={categoryMenuRef} style={{ display: "inline-block" }}>
                      <button
                        type="button"
                        onClick={() => setCategoryDropdownOpen((v) => !v)}
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

                      {categoryDropdownOpen && (
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

                  {/* 3. Branch with dedicated column and popover */}
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

                  {/* 4. Location with interactive popover */}
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

                  {/* 5. Custodian / Vendor */}
                  <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    Custodian / Vendor
                  </th>

                  {/* 6. Status */}
                  <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    Status
                  </th>

                  {/* 7. AMC Expiry */}
                  <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    AMC Expiry
                  </th>

                  {/* 8. Book Value */}
                  <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569", textAlign: "right" }}>
                    Book Value
                  </th>

                  {/* 9. Actions */}
                  <th style={{ width: 48, padding: "16px 12px" }}></th>
                </tr>
              </thead>

              <tbody>
                {pagedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: "48px 20px", textAlign: "center", color: "#64748B" }}>
                      No Non-IT assets found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  pagedAssets.map((asset) => {
                    const badge = getStatusBadge(asset.Status);

                    let amcStatus: "active" | "expired" | "soon" | "none" = "none";
                    let daysLeft = 0;
                    if (asset.AMCExpiryDate) {
                      const expiry = new Date(asset.AMCExpiryDate).getTime();
                      const diffDays = Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
                      if (diffDays < 0) {
                        amcStatus = "expired";
                      } else if (diffDays <= 60) {
                        amcStatus = "soon";
                        daysLeft = diffDays;
                      } else {
                        amcStatus = "active";
                      }
                    }

                    return (
                      <tr
                        key={asset.ID}
                        style={{
                          borderBottom: "1px solid #F1F5F9",
                          transition: "background 0.15s ease",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                        onClick={() => navigate(`/Asset/non-it-assets/${asset.ID}`)}
                      >
                        {/* Asset: Icon container + Category Name + Tag ID */}
                        <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                background: "#F0F7FF",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 18,
                                flexShrink: 0,
                              }}
                            >
                              {getNonITCategoryIcon(asset.CategoryName)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: "#0F172A", fontSize: "14px" }}>
                                {asset.CategoryName || "Asset"}
                              </div>
                              <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "2px" }}>
                                {asset.AssetTag}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                          <span style={{ color: "#334155", fontSize: "13.5px", fontWeight: 500 }}>
                            {asset.CategoryName}
                          </span>
                        </td>

                        {/* Branch (Dedicated Column) */}
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
                            <span>{normalizeBranch(asset.LocationName || "Coimbatore")}</span>
                          </span>
                        </td>

                        {/* Location / Floor */}
                        <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                          <div style={{ color: "#334155", fontSize: "13.5px" }}>
                            {asset.Floor ? `Floor ${asset.Floor}` : "Main Floor"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>General Area</div>
                        </td>

                        {/* Custodian / Vendor */}
                        <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: 500, color: "#0F172A", fontSize: "13.5px" }}>
                            {asset.VendorName || "Facilities"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>Admin Team</div>
                        </td>

                        {/* Status: Soft pastel pill badge matching IT assets */}
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

                        {/* AMC Expiry */}
                        <td style={{ padding: "18px 20px", verticalAlign: "middle" }}>
                          <div style={{ color: "#334155", fontSize: "13px" }}>{formatDate(asset.AMCExpiryDate)}</div>
                          {amcStatus === "expired" && (
                            <span style={{ display: "inline-block", color: "#DC2626", fontSize: "11px", fontWeight: 600, marginTop: "2px" }}>
                              Expired
                            </span>
                          )}
                          {amcStatus === "soon" && (
                            <span style={{ display: "inline-block", color: "#D97706", fontSize: "11px", fontWeight: 600, marginTop: "2px" }}>
                              {daysLeft} days left
                            </span>
                          )}
                        </td>

                        {/* Book Value */}
                        <td style={{ padding: "16px 20px", verticalAlign: "middle", textAlign: "right", fontWeight: 700, color: "#0F172A", fontSize: "13.5px" }}>
                          {formatValue(asset.Value)}
                        </td>

                        {/* Actions matching IT Asset 3-dot Menu */}
                        <td style={{ padding: "18px 12px", verticalAlign: "middle", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
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
                                <MenuItem icon={<EyeRegular />} onClick={() => navigate(`/Asset/non-it-assets/${asset.ID}`)}>
                                  View Details
                                </MenuItem>
                                <MenuItem icon={<EditRegular />} onClick={() => openEdit(asset)}>
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
        /* Grid View matching IT Asset Inventory */
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
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "#F0F7FF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {getNonITCategoryIcon(item.CategoryName)}
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", fontWeight: 600 }}>
                        {item.CategoryName}
                      </span>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#007ED5" }}>{item.AssetTag}</div>
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
                    {item.CategoryName}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>Vendor: {item.VendorName || "Facilities"}</div>
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
                    <span style={{ color: "#64748B" }}>Branch:</span>
                    <span style={{ fontWeight: 600, color: "#1E293B" }}>{normalizeBranch(item.LocationName || "Coimbatore")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Location:</span>
                    <span style={{ color: "#334155" }}>{item.Floor ? `Floor ${item.Floor}` : "Main Floor"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>AMC Expiry:</span>
                    <span style={{ color: "#64748B" }}>{formatDate(item.AMCExpiryDate)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Book Value:</span>
                    <span style={{ fontWeight: 700, color: "#0F172A" }}>{formatValue(item.Value)}</span>
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
                    onClick={() => navigate(`/Asset/non-it-assets/${item.ID}`)}
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
                    onClick={() => openEdit(item)}
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination matching IT Assets */}
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
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  background: page === 1 ? "#F8FAFC" : "#FFFFFF",
                  color: page === 1 ? "#CBD5E1" : "#475569",
                  cursor: page === 1 ? "not-allowed" : "pointer",
                }}
              >
                <ChevronLeftRegular style={{ fontSize: 16 }} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setPage(num)}
                  style={{
                    minWidth: "32px",
                    height: "32px",
                    padding: "0 8px",
                    borderRadius: "8px",
                    border: num === page ? "1px solid #007ED5" : "1px solid #E2E8F0",
                    background: num === page ? "#007ED5" : "#FFFFFF",
                    color: num === page ? "#FFFFFF" : "#475569",
                    fontWeight: num === page ? 600 : 400,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  {num}
                </button>
              ))}

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  border: "1px solid #E2E8F0",
                  background: page === totalPages ? "#F8FAFC" : "#FFFFFF",
                  color: page === totalPages ? "#CBD5E1" : "#475569",
                  cursor: page === totalPages ? "not-allowed" : "pointer",
                }}
              >
                <ChevronRightRegular style={{ fontSize: 16 }} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Form Dialog */}
      <NonITAssetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editingAsset={editingAsset}
        onSaved={loadAll}
      />
    </div>
  );
};

export default NonITAssets;
