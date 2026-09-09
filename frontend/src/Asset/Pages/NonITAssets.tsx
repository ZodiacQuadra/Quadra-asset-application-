import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Spinner,
  Text,
  Dropdown,
  Option,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
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
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { AssetCategoryRecord, AssetStatus, getAssetCategories } from "../Services/AssetInventoryService";
import { NonITAssetRecord, getNonITAssets, deleteNonITAsset } from "../Services/NonITAssetService";
import NonITAssetFormDialog from "../Components/NonITAssetFormDialog";

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
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

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

  // Filters state
  const [selectedBranch, setSelectedBranch] = useState("All Branches");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterStatus, setFilterStatus] = useState<AssetStatus | null>(null);
  const [filterAMC, setFilterAMC] = useState("All");

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<NonITAssetRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Filtered assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      // Branch filter
      if (selectedBranch !== "All Branches") {
        const off = a.LocationName || "Coimbatore HQ";
        if (!off.toLowerCase().includes(selectedBranch.toLowerCase())) return false;
      }
      // Category filter
      if (filterCategory !== "All Categories" && a.CategoryName !== filterCategory) {
        return false;
      }
      // Status filter
      if (filterStatus) {
        if (filterStatus === "Assigned" && (a.Status === "Assigned" || (a.Status as string) === "In Use")) {
          // match
        } else if (filterStatus === "End of Use" && ((a.Status as string) === "End of Use" || (a.Status as string) === "End of use")) {
          // match
        } else if (a.Status !== filterStatus) {
          return false;
        }
      }
      // AMC filter
      if (filterAMC !== "All") {
        if (!a.AMCExpiryDate) return false;
        const now = Date.now();
        const expiry = new Date(a.AMCExpiryDate).getTime();
        if (filterAMC === "Expired" && expiry >= now) return false;
        if (filterAMC === "Due soon" && (expiry < now || expiry > now + 60 * 86400000)) return false;
        if (filterAMC === "Active" && expiry < now) return false;
      }
      // Search
      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const match =
          a.AssetTag.toLowerCase().includes(term) ||
          a.CategoryName.toLowerCase().includes(term) ||
          (a.LocationName && a.LocationName.toLowerCase().includes(term)) ||
          (a.VendorName && a.VendorName.toLowerCase().includes(term));
        if (!match) return false;
      }
      return true;
    });
  }, [assets, selectedBranch, filterCategory, filterStatus, filterAMC, search]);

  useEffect(() => {
    setPage(1);
  }, [selectedBranch, filterCategory, filterStatus, filterAMC, search]);

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
      a.LocationName || "Coimbatore HQ",
      `Floor ${a.Floor || 1}`,
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

  const availableBranches = ["All Branches", "Coimbatore HQ", "Chennai", "Bangalore", "Hyderabad", "Mumbai", "Delhi NCR"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <Toaster toasterId={toasterId} />
      {portal}

      {/* Main Title Row matching IT Asset Inventory */}
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
          <Button
            appearance="outline"
            shape="rounded"
            icon={<ArrowDownloadRegular />}
            onClick={handleExport}
            style={{
              borderRadius: "9999px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              fontWeight: 600,
              padding: "8px 20px",
              color: "#334155",
            }}
          >
            Export
          </Button>

          {topToggle}

          <button
            onClick={openAdd}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)",
              color: "#FFFFFF",
              borderRadius: "9999px",
              border: "none",
              padding: "9px 22px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 3px 12px rgba(0, 126, 213, 0.32)",
              transition: "all 0.18s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 5px 16px rgba(0, 126, 213, 0.42)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 3px 12px rgba(0, 126, 213, 0.32)";
            }}
          >
            <AddRegular style={{ fontSize: 18, strokeWidth: 2 }} />
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

      {/* Search & Filter Toolbar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "14px",
          flexWrap: "wrap",
          background: "#FFFFFF",
          padding: "16px 20px",
          borderRadius: 16,
          border: "1px solid #EDF2F7",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        {/* Search Input */}
        <div
          style={{
            flex: "1 1 280px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "0 16px",
            height: "42px",
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
        </div>

        {/* Branch Filter Dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Dropdown
            mountNode={mountNode}
            value={selectedBranch}
            selectedOptions={[selectedBranch]}
            onOptionSelect={(_, d) => setSelectedBranch(d.optionValue ?? "All Branches")}
            style={{ minWidth: 170 }}
          >
            {availableBranches.map((b) => (
              <Option key={b} value={b}>
                {b}
              </Option>
            ))}
          </Dropdown>
        </div>

        {/* Category Dropdown */}
        <Dropdown
          mountNode={mountNode}
          value={filterCategory}
          selectedOptions={[filterCategory]}
          onOptionSelect={(_, d) => setFilterCategory(d.optionValue ?? "All Categories")}
          style={{ minWidth: 160 }}
        >
          <Option value="All Categories">All Categories</Option>
          {categories.map((c) => (
            <Option key={c.ID} value={c.CategoryName ?? ""}>
              {c.CategoryName}
            </Option>
          ))}
        </Dropdown>

        {/* Status Dropdown */}
        <Dropdown
          mountNode={mountNode}
          value={filterStatus ? filterStatus : "All Status"}
          selectedOptions={[filterStatus ? filterStatus : "All Status"]}
          onOptionSelect={(_, d) => {
            const val = d.optionValue;
            setFilterStatus(val === "All Status" ? null : (val as AssetStatus));
          }}
          style={{ minWidth: 150 }}
        >
          <Option value="All Status">All Status</Option>
          <Option value="In Stock">In Stock</Option>
          <Option value="Assigned">In Use</Option>
          <Option value="Under Maintenance">Under Maintenance</Option>
          <Option value="End of Use">End of Use</Option>
        </Dropdown>

        {/* AMC Dropdown */}
        <Dropdown
          mountNode={mountNode}
          value={filterAMC}
          selectedOptions={[filterAMC]}
          onOptionSelect={(_, d) => setFilterAMC(d.optionValue ?? "All")}
          style={{ minWidth: 140 }}
        >
          <Option value="All">AMC · Any</Option>
          <Option value="Active">AMC · Active</Option>
          <Option value="Due soon">AMC · Due soon</Option>
          <Option value="Expired">AMC · Expired</Option>
        </Dropdown>

        {/* Reset Filters */}
        {(selectedBranch !== "All Branches" || filterCategory !== "All Categories" || filterStatus !== null || filterAMC !== "All" || search.trim() !== "") && (
          <Button
            appearance="subtle"
            onClick={() => {
              setSelectedBranch("All Branches");
              setFilterCategory("All Categories");
              setFilterStatus(null);
              setFilterAMC("All");
              setSearch("");
            }}
            style={{ color: "#007ED5", fontWeight: 600, fontSize: "13px" }}
          >
            Reset Filters
          </Button>
        )}
      </div>

      {/* Main Table matching IT Asset List Design */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px", background: "#ffffff", borderRadius: 16 }}>
          <Spinner label="Loading Non-IT assets..." />
        </div>
      ) : (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            border: "1px solid #EDF2F7",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            overflow: "visible",
          }}
        >
          <div style={{ overflowX: "auto" }}>
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

                  {/* 2. Category */}
                  <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    Category
                  </th>

                  {/* 3. Branch with dedicated column and Building icon */}
                  <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <BuildingRegular style={{ fontSize: 14, color: "#007ED5" }} />
                      <span>Branch</span>
                    </div>
                  </th>

                  {/* 4. Location / Floor */}
                  <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    Location
                  </th>

                  {/* 5. Custodian / Vendor */}
                  <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    Custodian / Vendor
                  </th>

                  {/* 6. Status */}
                  <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    Status
                  </th>

                  {/* 7. AMC */}
                  <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    AMC Expiry
                  </th>

                  {/* 8. Book Value */}
                  <th style={{ padding: "16px 20px", fontSize: "13px", fontWeight: 600, color: "#475569", textAlign: "right" }}>
                    Book Value
                  </th>

                  {/* 9. Actions */}
                  <th style={{ width: 80, padding: "16px 16px", textAlign: "right" }}>Actions</th>
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
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
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
                              <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                                {asset.AssetTag}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          <span style={{ color: "#334155", fontSize: "13.5px", fontWeight: 500 }}>
                            {asset.CategoryName}
                          </span>
                        </td>

                        {/* Branch (Dedicated Column) */}
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
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
                            <span>{asset.LocationName || "Coimbatore HQ"}</span>
                          </span>
                        </td>

                        {/* Location / Floor */}
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          <div style={{ color: "#334155", fontSize: "13.5px" }}>
                            {asset.Floor ? `Floor ${asset.Floor}` : "Main Floor"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>General Area</div>
                        </td>

                        {/* Custodian / Vendor */}
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
                          <div style={{ fontWeight: 500, color: "#0F172A", fontSize: "13.5px" }}>
                            {asset.VendorName || "Facilities"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>Admin Team</div>
                        </td>

                        {/* Status: Soft pastel pill badge matching IT assets */}
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
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
                        <td style={{ padding: "16px 20px", verticalAlign: "middle" }}>
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

                        {/* Actions */}
                        <td style={{ padding: "16px 16px", verticalAlign: "middle", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                            <Button
                              appearance="subtle"
                              icon={<EditRegular style={{ fontSize: 16, color: "#64748B" }} />}
                              onClick={() => openEdit(asset)}
                              title="Edit"
                            />
                            <Button
                              appearance="subtle"
                              icon={<DeleteRegular style={{ fontSize: 16, color: "#EF4444" }} />}
                              onClick={() => handleDelete(asset)}
                              disabled={deletingId === asset.ID}
                              title="Delete"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination matching IT Assets */}
          {!loading && filteredAssets.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderTop: "1px solid #EDF2F7",
                flexWrap: "wrap",
                gap: "12px",
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
        </div>
      )}

      <NonITAssetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        asset={editingAsset}
        currentUserId={currentUserId}
        onSaved={loadAll}
        onAssetChanged={(updated) => setEditingAsset(updated)}
      />
    </div>
  );
};

export default NonITAssets;
