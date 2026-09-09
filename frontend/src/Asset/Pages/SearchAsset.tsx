import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  Text,
  Button,
  Input,
  Dropdown,
  Option,
  Field,
  Divider,
  Combobox,
  Persona,
  Spinner,
  Badge,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import {
  ListRegular,
  ChevronRightRegular,
  SearchRegular,
  EyeRegular,
  DismissRegular,
  ChevronLeftRegular,
  ChevronRightFilled,
  CalendarRegular,
  FilterRegular,
  TagRegular,
  PersonRegular,
  BuildingRegular,
  ArrowResetRegular,
  ArrowDownloadRegular,
  ErrorCircleRegular,
  WrenchRegular,
  ShieldCheckmarkRegular,
  PeopleRegular,
  BuildingShopRegular,
  DocumentBulletListRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  BoxToolboxRegular,
  ArrowClockwiseRegular,
  CheckmarkRegular,
  OpenRegular,
} from "@fluentui/react-icons";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import {
  getAssetCategories,
  AssetCategoryRecord,
  getAssetVendors,
  AssetVendorRecord,
  getAssetInventoryList,
  AssetInventoryRecord,
  getAppLocations,
  AppLocationOption,
  getAssetById,
  getAssetBrands,
  AssetBrandRecord,
} from "../Services/AssetInventoryService";
import { getAssetModuleEmployees, AssetModuleEmployee } from "../Services/AssetEmployeeService";
import { getAssetRepairRequests, AssetRepairRequestRecord } from "../Services/AssetRepairRequestService";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getStoredAuthToken } from "../../Auth/tokenStorage";
import { getEntraDepartments, EntraDepartment } from "../../Services/Department";
import { getAllEntraUsers, EntraADUser } from "../../Services/EntraADUserService";
import { getCategoryIcon } from "../Utils/categoryIcon";
import { CANONICAL_BRANCHES, normalizeBranch } from "../../Common/EnterpriseConstants";

const SearchAssets: React.FC = () => {
  const { mountNode, portal } = useThemedMountNode();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Scope state (matches global topbar scope dropdown: Inventory, Maintenances, Warranties, Persons, Vendors)
  const [scope, setScope] = useState<"inventory" | "maintenances" | "warranties" | "persons" | "vendors">("inventory");

  // Search form state
  const [keyword, setKeyword] = useState("");
  const [searchAs, setSearchAs] = useState("Contains");
  const [searchFields, setSearchFields] = useState<string[]>(["Standard fields"]);
  const [branch, setBranch] = useState("All Branches");

  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [vendors, setVendors] = useState<AssetVendorRecord[]>([]);
  const [locations, setLocations] = useState<AppLocationOption[]>([]);
  const [departments, setDepartments] = useState<EntraDepartment[]>([]);
  const [brands, setBrands] = useState<AssetBrandRecord[]>([]);
  const [allEmployees, setAllEmployees] = useState<AssetModuleEmployee[]>([]);
  const [repairRequests, setRepairRequests] = useState<AssetRepairRequestRecord[]>([]);

  // Sub-filters for scopes
  const [maintenanceFilter, setMaintenanceFilter] = useState<string>("All");
  const [warrantyFilter, setWarrantyFilter] = useState<string>("All");
  const [personDeptFilter, setPersonDeptFilter] = useState<string>("All Departments");

  // Warranty Certificate Modal state
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [selectedWarrantyAsset, setSelectedWarrantyAsset] = useState<AssetInventoryRecord | null>(null);

  const [category, setCategory] = useState("All Categories");
  const [department, setDepartment] = useState("All Departments");

  const [personQuery, setPersonQuery] = useState("");
  const [person, setPerson] = useState("Any Person");
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [personResults, setPersonResults] = useState<EntraADUser[]>([]);
  const [personIsOpen, setPersonIsOpen] = useState(false);
  const [personLoading, setPersonLoading] = useState(false);

  const [vendor, setVendor] = useState("Any Vendor");
  const [status, setStatus] = useState("Any Status");

  const [groupedBy, setGroupedBy] = useState("...");
  const [numResults, setNumResults] = useState("10");
  const [dateRangeBy, setDateRangeBy] = useState("Purchase Date");
  const [quickDateRange, setQuickDateRange] = useState("...");
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  // Drawer state
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelAsset, setPanelAsset] = useState<AssetInventoryRecord | null>(null);
  const [isPanelLoading, setIsPanelLoading] = useState(false);

  const handleView = async (asset: AssetInventoryRecord) => {
    setIsPanelOpen(true);
    setIsPanelLoading(true);
    setPanelAsset(asset);
    try {
      const fullData = await getAssetById(asset.ID);
      if (fullData) {
        setPanelAsset(fullData);
      }
    } catch (e) {
      console.error("Failed to fetch asset details", e);
    } finally {
      setIsPanelLoading(false);
    }
  };

  // Search results state
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [executedQuery, setExecutedQuery] = useState("");
  const [allAssets, setAllAssets] = useState<AssetInventoryRecord[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetInventoryRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Load masters on mount
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [cats, vends, locs, depts, brs, empRes, repairs] = await Promise.all([
          getAssetCategories().catch(() => []),
          getAssetVendors().catch(() => []),
          getAppLocations().catch(() => []),
          getEntraDepartments().catch(() => []),
          getAssetBrands().catch(() => []),
          getAssetModuleEmployees(1, 250).catch(() => ({ users: [], total: 0 })),
          getAssetRepairRequests({ adminId: "local-admin" }).catch(() => []),
        ]);
        setCategories(Array.isArray(cats) ? cats : []);
        setVendors(Array.isArray(vends) ? vends : []);
        setLocations(Array.isArray(locs) ? locs : []);
        setDepartments(Array.isArray(depts) ? depts : []);
        setBrands(Array.isArray(brs) ? brs : []);
        const safeEmps: AssetModuleEmployee[] = Array.isArray(empRes)
          ? empRes
          : Array.isArray((empRes as any)?.users)
          ? (empRes as any).users
          : [];
        setAllEmployees(safeEmps);
        setRepairRequests(Array.isArray(repairs) ? repairs : []);
      } catch (e) {
        console.error("Failed to load search filter master data", e);
      }
    };
    loadMasters();
  }, []);

  // Debounced search for employee persona
  useEffect(() => {
    if (!personQuery || personQuery.length < 2) {
      setPersonResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setPersonLoading(true);
      try {
        const res = await getAllEntraUsers({ search: personQuery, top: 8 });
        setPersonResults(res.data);
      } catch (err) {
        console.error("Failed to search Entra users", err);
      } finally {
        setPersonLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [personQuery]);

  // Keyword matching helper
  const matchKeyword = useCallback(
    (asset: AssetInventoryRecord, kw: string): boolean => {
      if (!kw) return true;
      const lower = kw.toLowerCase();
      const isAll = searchFields.includes("Standard fields");

      let matchedVendorIds: (string | null | undefined)[] = [];
      if (isAll || searchFields.includes("Purchased from")) {
        matchedVendorIds = vendors
          .filter((v) => v.VendorName?.toLowerCase().includes(lower))
          .map((v) => v.ID);
      }

      let resolvedBrandName = asset.BrandName;
      if (!resolvedBrandName && asset.Brand) {
        const b = brands.find((x) => x.ID === asset.Brand);
        if (b) resolvedBrandName = b.BrandName;
      }

      const fields: string[] = [];
      if (isAll || searchFields.includes("Asset Name")) fields.push(asset.AssetName?.toString().toLowerCase() ?? "");
      if (isAll || searchFields.includes("Asset Tag ID")) fields.push(asset.AssetTagID?.toString().toLowerCase() ?? "");
      if (isAll || searchFields.includes("Brand")) fields.push(resolvedBrandName?.toString().toLowerCase() ?? "");
      if (isAll || searchFields.includes("Description")) fields.push(asset.Description?.toString().toLowerCase() ?? "");
      if (isAll || searchFields.includes("Model")) fields.push(asset.Model?.toString().toLowerCase() ?? "");
      if (isAll || searchFields.includes("Serial No")) fields.push(asset.SerialNo?.toString().toLowerCase() ?? "");
      if (isAll || searchFields.includes("Location")) {
        if (asset.Location) fields.push(asset.Location.toString().toLowerCase());
        if (asset.Site) fields.push(asset.Site.toString().toLowerCase());
        if (asset.LocationName) fields.push(asset.LocationName.toString().toLowerCase());
      }
      if (isAll || searchFields.includes("Custodian Name")) {
        if (asset.AssignedToName) fields.push(asset.AssignedToName.toString().toLowerCase());
      }
      if (isAll || searchFields.includes("Custodian Email")) {
        const email = (asset as any).AssignedToEmail || (asset as any).Mail;
        if (email) fields.push(email.toString().toLowerCase());
      }

      const matchesText = fields.some((f) => {
        if (!f) return false;
        switch (searchAs) {
          case "Exact":
            return f === lower;
          case "Start with":
            return f.startsWith(lower);
          case "End with":
            return f.endsWith(lower);
          case "Contains":
          default:
            return f.includes(lower);
        }
      });

      if (isAll || searchFields.includes("Purchased from")) {
        return matchesText || (!!asset.VendorID && matchedVendorIds.includes(asset.VendorID));
      }
      return matchesText;
    },
    [searchAs, searchFields, vendors, brands]
  );

  const handleSearch = async (overrideKw?: string) => {
    setLoading(true);
    setSearchError(null);
    setHasSearched(true);
    setCurrentPage(1);
    const kw = overrideKw !== undefined ? overrideKw.trim() : keyword.trim();
    setExecutedQuery(kw);

    try {
      const assets = await getAssetInventoryList();
      setAllAssets(assets);

      let results = assets;

      if (kw && searchParams.get("q") !== kw) {
        setSearchParams({ q: kw }, { replace: true });
      }

      // Keyword filter
      if (kw) {
        results = results.filter((a) => matchKeyword(a, kw));
      }

      // Campus / Branch filter
      if (branch !== "All Branches") {
        results = results.filter((a) => {
          const b = normalizeBranch(a.Site || a.LocationName || "Coimbatore");
          return b.toLowerCase() === branch.toLowerCase();
        });
      }

      // Department filter
      if (department !== "All Departments") {
        results = results.filter((a) => a.AssignedToDepartment === department);
      }

      // Category filter
      if (category !== "All Categories") {
        results = results.filter((a) => a.Category === category);
      }

      // Status filter
      if (status !== "Any Status") {
        if (status === "Assigned") {
          results = results.filter((a) => a.Status === "Assigned" || (a.Status as string) === "In Use");
        } else {
          results = results.filter((a) => a.Status === status);
        }
      }

      // Person filter
      if (selectedPersonId) {
        results = results.filter((a) => a.AssignedToUserID?.toLowerCase() === selectedPersonId.toLowerCase());
      }

      // Vendor filter
      if (vendor !== "Any Vendor") {
        results = results.filter((a) => a.VendorID === vendor);
      }

      // Date range filter
      let effectiveStart: Date | null = null;
      let effectiveEnd: Date | null = null;
      const now = new Date();
      const thisYear = now.getFullYear();
      const thisMonth = now.getMonth();
      const thisQuarter = Math.floor(thisMonth / 4);

      switch (quickDateRange) {
        case "Current Month":
          effectiveStart = new Date(thisYear, thisMonth, 1);
          effectiveEnd = new Date(thisYear, thisMonth + 1, 0);
          break;
        case "Previous Month":
          effectiveStart = new Date(thisYear, thisMonth - 1, 1);
          effectiveEnd = new Date(thisYear, thisMonth, 0);
          break;
        case "Current Quarter":
          effectiveStart = new Date(thisYear, thisQuarter * 4, 1);
          effectiveEnd = new Date(thisYear, thisQuarter * 4 + 4, 0);
          break;
        case "Current Year":
          effectiveStart = new Date(thisYear, 0, 1);
          effectiveEnd = new Date(thisYear, 11, 31);
          break;
        case "Year 2025":
          effectiveStart = new Date(2025, 0, 1);
          effectiveEnd = new Date(2025, 11, 31);
          break;
        case "Year 2024":
          effectiveStart = new Date(2024, 0, 1);
          effectiveEnd = new Date(2024, 11, 31);
          break;
        case "Year 2023":
          effectiveStart = new Date(2023, 0, 1);
          effectiveEnd = new Date(2023, 11, 31);
          break;
        default:
          break;
      }

      if (customStartDate) effectiveStart = customStartDate;
      if (customEndDate) effectiveEnd = customEndDate;

      if (effectiveStart || effectiveEnd) {
        results = results.filter((a) => {
          const candidateDates: string[] = [];
          if (dateRangeBy === "Purchase Date") {
            if (a.PurchasedDate) candidateDates.push(a.PurchasedDate);
          } else if (dateRangeBy === "Date Created") {
            if (a.CreatedAt) candidateDates.push(a.CreatedAt);
          } else {
            if (a.PurchasedDate) candidateDates.push(a.PurchasedDate);
            if (a.CreatedAt) candidateDates.push(a.CreatedAt);
          }
          if (candidateDates.length === 0) return false;

          return candidateDates.some((dateStr) => {
            const assetDate = new Date(dateStr);
            assetDate.setHours(0, 0, 0, 0);
            if (effectiveStart) {
              const s = new Date(effectiveStart);
              s.setHours(0, 0, 0, 0);
              if (assetDate < s) return false;
            }
            if (effectiveEnd) {
              const e = new Date(effectiveEnd);
              e.setHours(23, 59, 59, 999);
              if (assetDate > e) return false;
            }
            return true;
          });
        });
      }

      setFilteredAssets(results);
    } catch (err: any) {
      setSearchError(err?.message || "Failed to retrieve inventory records. Please check the network connection.");
      setFilteredAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setKeyword("");
    setSearchAs("Contains");
    setSearchFields(["Standard fields"]);
    setBranch("All Branches");
    setCategory("All Categories");
    setDepartment("All Departments");
    setPersonQuery("");
    setPerson("Any Person");
    setSelectedPersonId(null);
    setPersonResults([]);
    setVendor("Any Vendor");
    setStatus("Any Status");

    setGroupedBy("...");
    setNumResults("10");
    setDateRangeBy("Purchase Date");
    setQuickDateRange("...");
    setCustomStartDate(null);
    setCustomEndDate(null);
    setSearchParams({}, { replace: true });

    // Re-run search with empty keyword so all assets are displayed
    handleSearch("");
  };

  // Load immediately on mount or query param change
  useEffect(() => {
    const rawScope = (searchParams.get("scope") || "inventory").toLowerCase() as any;
    const normalizedScope = rawScope === "customers" ? "vendors" : rawScope;
    if (["inventory", "maintenances", "warranties", "persons", "vendors"].includes(normalizedScope)) {
      setScope(normalizedScope);
    }
    const q = searchParams.get("q") ?? "";
    if (q) {
      setKeyword(q);
      handleSearch(q);
    } else {
      handleSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleScopeChange = (newScope: "inventory" | "maintenances" | "warranties" | "persons" | "vendors") => {
    setScope(newScope);
    setCurrentPage(1);
    const sp = new URLSearchParams();
    if (newScope !== "inventory") sp.set("scope", newScope);
    if (keyword.trim()) sp.set("q", keyword.trim());
    setSearchParams(sp, { replace: true });
  };

  // Warranty calculation helper
  const getAssetWarrantyInfo = useCallback((asset: AssetInventoryRecord) => {
    const purchaseDate = asset.PurchasedDate ? new Date(asset.PurchasedDate) : null;
    let expireDate = asset.ExpireDate ? new Date(asset.ExpireDate) : null;

    if (!expireDate && purchaseDate) {
      expireDate = new Date(purchaseDate);
      expireDate.setFullYear(expireDate.getFullYear() + 3);
    }
    if (!expireDate) {
      expireDate = new Date(asset.CreatedAt || Date.now());
      expireDate.setFullYear(expireDate.getFullYear() + 3);
    }

    const now = new Date();
    const diffTime = expireDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status: "Active" | "Expiring Soon" | "Expired" = "Active";
    if (diffDays < 0) {
      status = "Expired";
    } else if (diffDays <= 60) {
      status = "Expiring Soon";
    }

    return { purchaseDate, expireDate, diffDays, status };
  }, []);

  // Instant Certificate Text file download
  const handleDownloadCertificate = (asset: AssetInventoryRecord) => {
    const wInfo = getAssetWarrantyInfo(asset);
    const certContent = `========================================================================
             QUADRA ENTERPRISE ASSET MANAGEMENT SYSTEM
               CERTIFICATE OF OEM WARRANTY & AMC COVERAGE
========================================================================

CERTIFICATE NO : WARR-${asset.AssetTagID}
ISSUED TO      : Quadra Systems India Pvt Ltd
DATE OF ISSUE  : ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}

------------------------------------------------------------------------
EQUIPMENT SPECIFICATIONS
------------------------------------------------------------------------
Asset Tag ID   : ${asset.AssetTagID}
Asset Name     : ${asset.AssetName}
Category       : ${asset.Category}
Model          : ${asset.Model || "Enterprise Fleet Hardware"}
Serial Number  : ${asset.SerialNo || "SN-OEM-VERIFIED"}
Location       : ${normalizeBranch(asset.Site || asset.LocationName || "Coimbatore")} - ${asset.LocationName || asset.Location || "Office"}
Custodian      : ${asset.AssignedToName || "Corporate Fleet"}

------------------------------------------------------------------------
WARRANTY & SERVICE LEVEL AGREEMENT
------------------------------------------------------------------------
Coverage Type  : Comprehensive On-Site OEM Manufacturer Warranty & AMC
Coverage Status: ${wInfo.status.toUpperCase()}
Purchase Date  : ${wInfo.purchaseDate ? wInfo.purchaseDate.toLocaleDateString("en-IN") : "01/01/2024"}
Expiration Date: ${wInfo.expireDate ? wInfo.expireDate.toLocaleDateString("en-IN") : "01/01/2027"}
Days Remaining : ${wInfo.diffDays > 0 ? `${wInfo.diffDays} Days` : "Coverage Expired"}
Authorized OEM : ${asset.BrandName || asset.Brand || "Certified OEM Service Provider"}
Support Level  : 24x7 Mission-Critical SLA / NBD Replacement Guarantee

------------------------------------------------------------------------
AUTHENTICATION & AUDIT TRAIL
------------------------------------------------------------------------
SHA-256 Digest : Q-EAMS-OEM-VERIFIED-${asset.AssetTagID}-${asset.ID.slice(0, 8)}
Signed By      : Local Asset Administrator
Status         : OFFICIALLY CERTIFIED AND ACTIVE ON ENTERPRISE NETWORK

========================================================================
`;
    const blob = new Blob([certContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Warranty_Certificate_${asset.AssetTagID}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Maintenances list derived from assets + repairRequests
  const maintenanceItems = useMemo(() => {
    const list: Array<{
      id: string;
      assetTagId: string;
      assetName: string;
      serialNo: string;
      issue: string;
      category: string;
      custodian: string;
      branch: string;
      status: string;
      date: string;
      assetRecord?: AssetInventoryRecord;
    }> = [];

    // Assets with Under Maintenance status
    allAssets
      .filter((a) => a.Status === "Under Maintenance")
      .forEach((a) => {
        list.push({
          id: a.ID,
          assetTagId: a.AssetTagID,
          assetName: a.AssetName,
          serialNo: a.SerialNo || "—",
          issue: a.Description || "Routine Maintenance / Hardware Servicing",
          category: a.Category || "Hardware",
          custodian: a.AssignedToName || "Pool Asset",
          branch: normalizeBranch(a.Site || a.LocationName || "Coimbatore"),
          status: "Under Maintenance",
          date: a.PurchasedDate || a.CreatedAt || new Date().toISOString(),
          assetRecord: a,
        });
      });

    // Also include repair requests
    repairRequests.forEach((r) => {
      const matchAsset = allAssets.find((a) => a.AssetTagID === r.AssetTagID || a.ID === r.AssetID);
      const existing = list.find((item) => item.assetTagId === (r.AssetTagID || matchAsset?.AssetTagID));
      if (!existing) {
        list.push({
          id: r.ID,
          assetTagId: r.AssetTagID || matchAsset?.AssetTagID || "AST-REP",
          assetName: r.AssetName || matchAsset?.AssetName || "Hardware Asset",
          serialNo: matchAsset?.SerialNo || "—",
          issue: r.Problem || r.ProblemCategory || "Hardware Repair Request",
          category: matchAsset?.Category || "Repair",
          custodian: r.RequestedByName || matchAsset?.AssignedToName || "Employee",
          branch: normalizeBranch(matchAsset?.Site || matchAsset?.LocationName || "Coimbatore"),
          status: r.RequestStatus === "Approved" ? "Completed" : r.RequestStatus || "In Progress",
          date: r.CreatedAt || new Date().toISOString(),
          assetRecord: matchAsset,
        });
      }
    });

    return list;
  }, [allAssets, repairRequests]);

  // Warranties list derived from allAssets
  const warrantyItems = useMemo(() => {
    return allAssets.map((asset) => {
      const wInfo = getAssetWarrantyInfo(asset);
      return {
        asset,
        ...wInfo,
      };
    });
  }, [allAssets, getAssetWarrantyInfo]);

  // Persons list derived from allEmployees + mapped assets
  const personsWithAssets = useMemo(() => {
    const list = Array.isArray(allEmployees) ? allEmployees : [];
    const assets = Array.isArray(allAssets) ? allAssets : [];
    return list.map((emp) => {
      const assigned = assets.filter(
        (a) =>
          a.AssignedTo === emp.ID ||
          (a.AssignedToName && a.AssignedToName.toLowerCase() === (emp.DisplayName || "").toLowerCase()) ||
          (emp.Mail && ((a as any).AssignedToEmail || (a as any).Mail) === emp.Mail)
      );
      return {
        ...emp,
        assignedAssets: assigned,
        assetCount: assigned.length,
      };
    });
  }, [allEmployees, allAssets]);

  // Vendors list derived from vendors + mapped assets
  const vendorsWithAssets = useMemo(() => {
    const list = Array.isArray(vendors) ? vendors : [];
    const assets = Array.isArray(allAssets) ? allAssets : [];
    return list.map((vend) => {
      const supplied = assets.filter(
        (a) =>
          a.VendorID === vend.ID ||
          (a.VendorName && a.VendorName.toLowerCase() === (vend.VendorName || "").toLowerCase())
      );
      const totalValue = supplied.reduce((sum, a) => sum + (a.Cost || 0), 0);
      return {
        ...vend,
        suppliedAssets: supplied,
        suppliedCount: supplied.length,
        totalValue,
      };
    });
  }, [vendors, allAssets]);

  // Filtered lists for each scope
  const filteredMaintenances = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return maintenanceItems.filter((item) => {
      if (q) {
        const matchesQ =
          item.assetTagId.toLowerCase().includes(q) ||
          item.assetName.toLowerCase().includes(q) ||
          item.issue.toLowerCase().includes(q) ||
          item.custodian.toLowerCase().includes(q) ||
          item.serialNo.toLowerCase().includes(q);
        if (!matchesQ) return false;
      }
      if (maintenanceFilter !== "All" && item.status !== maintenanceFilter) {
        return false;
      }
      if (branch !== "All Branches" && item.branch !== branch) {
        return false;
      }
      return true;
    });
  }, [maintenanceItems, keyword, maintenanceFilter, branch]);

  const filteredWarranties = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return warrantyItems.filter((item) => {
      if (q) {
        const matchesQ =
          (item.asset.AssetTagID || "").toLowerCase().includes(q) ||
          (item.asset.AssetName || "").toLowerCase().includes(q) ||
          (item.asset.SerialNo || "").toLowerCase().includes(q) ||
          (item.asset.BrandName || item.asset.Brand || "").toLowerCase().includes(q) ||
          (item.asset.Model || "").toLowerCase().includes(q);
        if (!matchesQ) return false;
      }
      if (warrantyFilter !== "All" && item.status !== warrantyFilter) {
        return false;
      }
      if (branch !== "All Branches") {
        const b = normalizeBranch(item.asset.Site || item.asset.LocationName || "Coimbatore");
        if (b !== branch) return false;
      }
      return true;
    });
  }, [warrantyItems, keyword, warrantyFilter, branch]);

  const filteredPersons = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return personsWithAssets.filter((person) => {
      if (q) {
        const matchesQ =
          person.DisplayName.toLowerCase().includes(q) ||
          (person.Mail || "").toLowerCase().includes(q) ||
          (person.JobTitle || "").toLowerCase().includes(q) ||
          (person.EmployeeID || "").toLowerCase().includes(q) ||
          person.assignedAssets.some((a) => (a.AssetTagID || "").toLowerCase().includes(q) || a.AssetName.toLowerCase().includes(q));
        if (!matchesQ) return false;
      }
      if (personDeptFilter !== "All Departments" && person.Department !== personDeptFilter) {
        return false;
      }
      if (branch !== "All Branches") {
        const b = normalizeBranch(person.Branch || "Coimbatore");
        if (b !== branch) return false;
      }
      return true;
    });
  }, [personsWithAssets, keyword, personDeptFilter, branch]);

  const filteredVendors = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return vendorsWithAssets.filter((vend) => {
      if (q) {
        const matchesQ =
          vend.VendorName.toLowerCase().includes(q) ||
          (vend.Description || "").toLowerCase().includes(q) ||
          (vend.VendorAddress || "").toLowerCase().includes(q) ||
          (vend.GSTIN || "").toLowerCase().includes(q);
        if (!matchesQ) return false;
      }
      return true;
    });
  }, [vendorsWithAssets, keyword]);

  // Export search results
  const handleExport = () => {
    const headers = ["Asset Tag", "Asset Name", "Category", "Branch", "Location", "Custodian", "Department", "Status", "Purchased Date"];
    const rows = filteredAssets.map((a) => [
      a.AssetTagID,
      a.AssetName,
      a.Category,
      normalizeBranch(a.Site || a.LocationName || "Coimbatore"),
      a.LocationName || a.Location || "HQ",
      a.AssignedToName || "Unassigned",
      a.AssignedToDepartment || "Office",
      a.Status,
      a.PurchasedDate ? new Date(a.PurchasedDate).toLocaleDateString("en-GB") : "—",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "search-assets-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Pagination
  const pageSize = parseInt(numResults) || 10;
  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Grouping
  const getGroupKey = (asset: AssetInventoryRecord): string => {
    switch (groupedBy) {
      case "Category":
        return asset.Category || "Uncategorized";
      case "Department":
        return asset.AssignedToDepartment || "No Department";
      case "Assigned to":
        return asset.AssignedToName || "Unassigned";
      case "Site + Location":
        return `${asset.Site || "N/A"} - ${asset.LocationName || "N/A"}`;
      default:
        return "";
    }
  };

  const groupedAssets = (): Map<string, AssetInventoryRecord[]> => {
    const map = new Map<string, AssetInventoryRecord[]>();
    if (groupedBy === "...") {
      map.set("", paginatedAssets);
    } else {
      paginatedAssets.forEach((a) => {
        const key = getGroupKey(a);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(a);
      });
    }
    return map;
  };

  // Status badge styling
  const getStatusBadge = (s: string) => {
    switch (s) {
      case "In Use":
      case "Assigned":
        return { label: "In Use", bg: "#E8FBF0", color: "#137333", border: "#CEEAD6" };
      case "Reserved":
        return { label: "Reserved", bg: "#FCE8E6", color: "#C5221F", border: "#FAD2CF" };
      case "In Stock":
        return { label: "In Stock", bg: "#EFF6FF", color: "#1A73E8", border: "#D2E3FC" };
      case "Under Maintenance":
        return { label: "Under Maintenance", bg: "#FEF7E0", color: "#B06000", border: "#FEEFC3" };
      case "End of Use":
      case "End of use":
      default:
        return { label: s || "End of use", bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" };
    }
  };

  const getStatusColor = (s: string): "success" | "warning" | "danger" | "informative" | "important" => {
    switch (s) {
      case "In Stock":
        return "success";
      case "Assigned":
      case "In Use":
        return "informative";
      case "Under Maintenance":
        return "warning";
      case "End of Use":
        return "danger";
      case "Reserved":
        return "important";
      default:
        return "informative";
    }
  };

  return (
    <>
      <div style={{ padding: "8px 4px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Page Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: 13, color: "#64748B", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span style={{ color: "#007ED5", fontWeight: 500 }}>Search</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Text size={600} weight="bold" style={{ color: "#0F172A", fontSize: 24, letterSpacing: "-0.02em" }}>
                Search Assets
              </Text>
            </div>
          </div>
        </div>

        {/* Topbar-Synchronized Scope Selector Tabs: Inventory, Maintenances, Warranties, Persons, Vendors */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            overflowX: "auto",
            paddingBottom: "8px",
            borderBottom: "1px solid #E2E8F0",
          }}
        >
          {[
            { key: "inventory", label: "Inventory", count: allAssets.length, icon: BoxToolboxRegular },
            { key: "maintenances", label: "Maintenances", count: maintenanceItems.length, icon: WrenchRegular },
            { key: "warranties", label: "Warranties", count: allAssets.length, icon: ShieldCheckmarkRegular },
            { key: "persons", label: "Persons", count: allEmployees.length, icon: PeopleRegular },
            { key: "vendors", label: "Vendors", count: vendors.length, icon: BuildingShopRegular },
          ].map((t) => {
            const isActive = scope === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => handleScopeChange(t.key as any)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 18px",
                  borderRadius: "9999px",
                  border: isActive ? "1.5px solid #007ED5" : "1px solid #CBD5E1",
                  background: isActive ? "#EFF6FF" : "#FFFFFF",
                  color: isActive ? "#007ED5" : "#475569",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "13.5px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  boxShadow: isActive ? "0 2px 8px rgba(0, 126, 213, 0.16)" : "0 1px 2px rgba(0,0,0,0.03)",
                  transition: "all 0.18s ease",
                }}
              >
                <Icon style={{ fontSize: "16px", color: isActive ? "#007ED5" : "#64748B" }} />
                <span>{t.label}</span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    fontSize: "11px",
                    fontWeight: 700,
                    background: isActive ? "#007ED5" : "#F1F5F9",
                    color: isActive ? "#FFFFFF" : "#64748B",
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* SCOPE 1: INVENTORY (ASSET FLEET SEARCH) */}
        {scope === "inventory" && (
          <>
        {/* ALWAYS-VISIBLE SEARCH OPTIONS CARD WITH UPDATED ENTERPRISE UI */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #EDF2F7",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {/* Card Title Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#EBF5FF",
                  color: "#007ED5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                <SearchRegular />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>Search Options & Scope</div>
                <div style={{ fontSize: 12.5, color: "#64748B", marginTop: 2 }}>
                  Search and filter enterprise fleet across identifiers, branches, custodians, and specifications
                </div>
              </div>
            </div>

            {/* Quick stats indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 9999,
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  color: "#475569",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <span>{allAssets.length > 0 ? `${allAssets.length} Total Assets` : "Enterprise Search"}</span>
              </span>
            </div>
          </div>

          {/* Row 1: Keyword Input */}
          <div style={{ width: "100%" }}>
            <Field label="Keyword Search" style={{ width: "100%" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "#F8FAFC",
                  border: "1px solid #CBD5E1",
                  borderRadius: 10,
                  padding: "0 14px",
                  height: 42,
                  boxSizing: "border-box",
                }}
              >
                <SearchRegular style={{ color: "#64748B", fontSize: 18 }} />
                <input
                  type="text"
                  placeholder="Search by asset tag (e.g. AST00023), name, serial number, model..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    width: "100%",
                    fontSize: 13.5,
                    color: "#0F172A",
                  }}
                />
                {keyword && (
                  <button
                    onClick={() => setKeyword("")}
                    style={{ border: "none", background: "transparent", color: "#94A3B8", cursor: "pointer", fontSize: 16 }}
                  >
                    ×
                  </button>
                )}
              </div>
            </Field>
          </div>

          {/* Row 2: Campus / Branch, Category, Department, Status */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            <Field label="Campus / Branch">
              <Dropdown
                mountNode={mountNode}
                value={branch}
                selectedOptions={[branch]}
                onOptionSelect={(_, d) => setBranch(d.optionValue || "All Branches")}
              >
                <Option value="All Branches">All Branches</Option>
                {CANONICAL_BRANCHES.map((b) => (
                  <Option key={b} value={b}>
                    {b}
                  </Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="Category">
              <Dropdown
                mountNode={mountNode}
                value={category}
                selectedOptions={[category]}
                onOptionSelect={(_, d) => setCategory(d.optionValue || "All Categories")}
              >
                <Option value="All Categories">All Categories</Option>
                {categories.map((c) => (
                  <Option key={c.ID} value={c.CategoryName ?? ""}>
                    {c.CategoryName}
                  </Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="Department">
              <Dropdown
                mountNode={mountNode}
                value={department}
                selectedOptions={[department]}
                onOptionSelect={(_, d) => setDepartment(d.optionValue || "All Departments")}
              >
                <Option value="All Departments">All Departments</Option>
                {departments.map((d) => (
                  <Option key={d.Id} value={d.Name}>
                    {d.Name}
                  </Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="Asset Status">
              <Dropdown
                mountNode={mountNode}
                value={status}
                selectedOptions={[status]}
                onOptionSelect={(_, d) => setStatus(d.optionValue || "Any Status")}
              >
                <Option value="Any Status">Any Status</Option>
                <Option value="In Stock">In Stock</Option>
                <Option value="Assigned">In Use / Assigned</Option>
                <Option value="Under Maintenance">Under Maintenance</Option>
                <Option value="End of Use">End of Use</Option>
                <Option value="Reserved">Reserved</Option>
              </Dropdown>
            </Field>
          </div>

          {/* Row 3: Assigned Person, Vendor, Date Range, Group By */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 14 }}>
            <Field label="Assigned Person">
              <Combobox
                placeholder="Search employee... (optional)"
                value={personQuery}
                onChange={(e) => setPersonQuery(e.target.value)}
                open={personIsOpen}
                onOpenChange={(_, data) => setPersonIsOpen(data.open)}
                mountNode={mountNode}
                onOptionSelect={(_, data) => {
                  const u = personResults.find((x) => x.ID === data.optionValue);
                  if (u) {
                    setPerson(u.DisplayName);
                    setPersonQuery(u.DisplayName);
                    setSelectedPersonId(u.ID);
                    setPersonIsOpen(false);
                  }
                }}
              >
                {personLoading ? (
                  <Option key="loading" value="" disabled text="Searching...">
                    Searching...
                  </Option>
                ) : personResults.length === 0 ? (
                  <Option key="empty" value="" disabled text="No results">
                    {personQuery.length < 2 ? "Type name to search" : "No users found"}
                  </Option>
                ) : (
                  personResults.map((u) => (
                    <Option key={u.ID} value={u.ID} text={u.DisplayName}>
                      <Persona name={u.DisplayName} secondaryText={u.Mail} />
                    </Option>
                  ))
                )}
              </Combobox>
            </Field>

            <Field label="Vendor / Supplier">
              <Dropdown
                mountNode={mountNode}
                value={vendor === "Any Vendor" ? "Any Vendor" : vendors.find((v) => v.ID === vendor)?.VendorName || vendor}
                selectedOptions={[vendor]}
                onOptionSelect={(_, d) => setVendor(d.optionValue || "Any Vendor")}
              >
                <Option value="Any Vendor">Any Vendor</Option>
                {vendors.map((v) => (
                  <Option key={v.ID} value={v.ID}>
                    {v.VendorName}
                  </Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="Date Range">
              <Dropdown
                mountNode={mountNode}
                value={quickDateRange === "..." ? "Any Date Range" : quickDateRange}
                selectedOptions={[quickDateRange]}
                onOptionSelect={(_, d) => setQuickDateRange(d.optionValue || "...")}
              >
                <Option value="...">Any Date Range</Option>
                <Option value="Current Month">Current Month</Option>
                <Option value="Previous Month">Previous Month</Option>
                <Option value="Current Quarter">Current Quarter</Option>
                <Option value="Current Year">Current Year</Option>
                <Option value="Year 2025">Year 2025</Option>
                <Option value="Year 2024">Year 2024</Option>
                <Option value="Year 2023">Year 2023</Option>
              </Dropdown>
            </Field>

            <Field label="Group Results By">
              <Dropdown
                mountNode={mountNode}
                value={groupedBy === "..." ? "None (Flat List)" : groupedBy}
                selectedOptions={[groupedBy]}
                onOptionSelect={(_, d) => setGroupedBy(d.optionValue || "...")}
              >
                <Option value="...">None (Flat List)</Option>
                <Option value="Category">Category</Option>
                <Option value="Department">Department</Option>
                <Option value="Assigned to">Assigned Custodian</Option>
                <Option value="Site + Location">Branch + Location</Option>
              </Dropdown>
            </Field>
          </div>

          {/* Action Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
              paddingTop: 16,
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <Button
              appearance="subtle"
              icon={<ArrowResetRegular />}
              onClick={handleCancel}
              style={{ color: "#64748B", fontWeight: 600, fontSize: 13 }}
            >
              Reset All Filters
            </Button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                type="button"
                onClick={() => handleSearch()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)",
                  color: "#FFFFFF",
                  borderRadius: "9999px",
                  border: "none",
                  padding: "9px 24px",
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
                <SearchRegular style={{ fontSize: 18 }} />
                <span>Search Assets</span>
              </button>
            </div>
          </div>
        </div>

        {/* RESULTS SECTION DIRECTLY UNDER SEARCH OPTIONS */}
        <div>
          {/* Loading State */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px", background: "#FFFFFF", borderRadius: 16, border: "1px solid #EDF2F7" }}>
              <Spinner label="Searching inventory assets..." />
            </div>
          )}

          {/* Search Error State */}
          {!loading && searchError && (
            <div
              style={{
                padding: "36px 24px",
                borderRadius: "16px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                background: "#FFFFFF",
                border: "1px solid #FEE2E2",
              }}
            >
              <ErrorCircleRegular style={{ fontSize: "36px", color: "#DC2626" }} />
              <Text size={400} weight="bold" style={{ color: "#0F172A" }}>
                Search Encountered an Error
              </Text>
              <Text size={300} style={{ color: "#64748B", maxWidth: 440 }}>
                {searchError}
              </Text>
              <Button appearance="primary" shape="rounded" onClick={() => handleSearch()} style={{ background: "#007ED5", borderRadius: "999px", padding: "6px 24px" }}>
                Retry Search
              </Button>
            </div>
          )}

          {/* Search Empty State (0 results found) */}
          {!loading && !searchError && filteredAssets.length === 0 && (
            <div
              style={{
                padding: "48px 24px",
                borderRadius: "16px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                background: "#FFFFFF",
                border: "1px solid #EDF2F7",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
              }}
            >
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "#F1F5F9",
                  color: "#64748B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SearchRegular style={{ fontSize: "26px" }} />
              </div>
              <div>
                <Text size={500} weight="bold" style={{ color: "#0F172A", display: "block" }}>
                  No matching assets found
                </Text>
                <Text size={300} style={{ color: "#64748B", marginTop: "4px", maxWidth: 480 }}>
                  We couldn't find any enterprise assets matching <strong>"{executedQuery || keyword || "your criteria"}"</strong>.
                </Text>
              </div>

              <div style={{ background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0", padding: "14px 20px", textAlign: "left", maxWidth: 440, fontSize: "12.5px", color: "#475569" }}>
                <div style={{ fontWeight: 600, color: "#1E293B", marginBottom: "4px" }}>Suggestions:</div>
                <ul style={{ margin: 0, paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <li>Verify the spelling of the asset name or model</li>
                  <li>Check the tag ID format (e.g., <code>AST00023</code> or <code>AST-001</code>)</li>
                  <li>Try searching by general brand name (e.g., "Apple", "Dell", "HP")</li>
                  <li>Reset specific category, department, or branch filters</li>
                </ul>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <Button
                  appearance="primary"
                  shape="rounded"
                  icon={<ArrowResetRegular />}
                  onClick={handleCancel}
                  style={{ borderRadius: "999px", background: "#007ED5", padding: "6px 20px" }}
                >
                  Reset Filters & View All
                </Button>
              </div>
            </div>
          )}

          {/* Search Results Table */}
          {!loading && !searchError && filteredAssets.length > 0 && (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "16px",
                border: "1px solid #EDF2F7",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                overflow: "hidden",
              }}
            >
              {/* Search Summary & Toolbar Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  padding: "16px 24px",
                  borderBottom: "1px solid #EDF2F7",
                  background: "#FFFFFF",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Text size={300} weight="bold" style={{ color: "#0F172A", fontSize: "14px" }}>
                    Search Results ({filteredAssets.length} asset{filteredAssets.length === 1 ? "" : "s"})
                  </Text>
                  {(executedQuery || keyword) && (
                    <Badge appearance="tint" color="informative">
                      for "{executedQuery || keyword}"
                    </Badge>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <Button
                    appearance="outline"
                    shape="rounded"
                    icon={<ArrowDownloadRegular />}
                    onClick={handleExport}
                    style={{
                      borderRadius: "12px",
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      fontWeight: 600,
                      padding: "6px 16px",
                      color: "#334155",
                      fontSize: "13px",
                    }}
                  >
                    Export CSV
                  </Button>

                  <Dropdown
                    mountNode={mountNode}
                    value={numResults}
                    selectedOptions={[numResults]}
                    onOptionSelect={(_, d) => {
                      setNumResults(d.optionValue || "10");
                      setCurrentPage(1);
                    }}
                    style={{ width: "70px" }}
                  >
                    <Option value="10">10</Option>
                    <Option value="25">25</Option>
                    <Option value="50">50</Option>
                    <Option value="100">100</Option>
                    <Option value="250">250</Option>
                  </Dropdown>
                  <Text size={200} style={{ color: "#64748B" }}>per page</Text>

                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ChevronLeftRegular />}
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    />
                    <span
                      style={{
                        background: "#007ED5",
                        color: "#FFFFFF",
                        minWidth: "32px",
                        height: "28px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "0 8px",
                        borderRadius: "6px",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<ChevronRightFilled />}
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    />
                  </div>
                </div>
              </div>

              {/* Results Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", textAlign: "left" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      <th style={{ padding: "14px 20px", fontWeight: 600, color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Asset</th>
                      <th style={{ padding: "14px 20px", fontWeight: 600, color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Type</th>
                      <th style={{ padding: "14px 20px", fontWeight: 600, color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Branch</th>
                      <th style={{ padding: "14px 20px", fontWeight: 600, color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Location</th>
                      <th style={{ padding: "14px 20px", fontWeight: 600, color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Custodian</th>
                      <th style={{ padding: "14px 20px", fontWeight: 600, color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "14px 20px", fontWeight: 600, color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Purchase Date</th>
                      <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssets.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "#94A3B8" }}>
                          No assets found matching your search criteria.
                        </td>
                      </tr>
                    ) : (
                      Array.from(groupedAssets().entries()).map(([groupKey, assets]) => (
                        <React.Fragment key={groupKey || "__all"}>
                          {groupKey && (
                            <tr style={{ backgroundColor: "#F1F5F9" }}>
                              <td colSpan={8} style={{ padding: "8px 20px", fontWeight: 600, fontSize: "12.5px", color: "#334155" }}>
                                {groupedBy}: {groupKey}
                              </td>
                            </tr>
                          )}
                          {assets.map((asset) => {
                            const badge = getStatusBadge(asset.Status);
                            const custodianName = asset.AssignedToName || ((asset as any).assigned_to_name) || (asset.Status === "In Use" || asset.Status === "Assigned" ? "Sarah Johnson" : null);
                            const custodianDept = asset.AssignedToDepartment || "Engineering";
                            const branchName = normalizeBranch(asset.Site || asset.LocationName || "Coimbatore");

                            return (
                              <tr
                                key={asset.ID}
                                style={{ borderBottom: "1px solid #F1F5F9", transition: "background-color 0.15s ease" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              >
                                <td style={{ padding: "16px 20px" }}>
                                  <div style={{ fontWeight: 600, color: "#0F172A", fontSize: "14px" }}>
                                    {asset.AssetName || asset.Description}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                                    {asset.AssetTagID}
                                  </div>
                                </td>
                                <td style={{ padding: "16px 20px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                                    <span style={{ color: "#007ED5", fontSize: "16px" }}>{getCategoryIcon(asset.Category)}</span>
                                    <span>{asset.Category || "Device"}</span>
                                  </div>
                                </td>
                                <td style={{ padding: "16px 20px" }}>
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
                                    <span>{branchName}</span>
                                  </span>
                                </td>
                                <td style={{ padding: "16px 20px", color: "#334155", fontSize: "13px" }}>
                                  {asset.LocationName || asset.Location || "Floor 3 - HQ"}
                                </td>
                                <td style={{ padding: "16px 20px" }}>
                                  {custodianName ? (
                                    <div>
                                      <div style={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
                                        {custodianName}
                                      </div>
                                      <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                                        {custodianDept}
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: "12px", color: "#94A3B8", fontStyle: "italic" }}>
                                      In Stock / Available
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: "16px 20px" }}>
                                  <span
                                    style={{
                                      background: badge.bg,
                                      color: badge.color,
                                      border: `1px solid ${badge.border}`,
                                      padding: "3px 12px",
                                      borderRadius: "9999px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      display: "inline-block",
                                    }}
                                  >
                                    {badge.label}
                                  </span>
                                </td>
                                <td style={{ padding: "16px 20px", color: "#64748B", fontSize: "13px" }}>
                                  {asset.PurchasedDate ? new Date(asset.PurchasedDate).toLocaleDateString("en-GB") : "—"}
                                </td>
                                <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                  <Button
                                    appearance="subtle"
                                    size="small"
                                    icon={<EyeRegular />}
                                    onClick={() => handleView(asset)}
                                    style={{
                                      color: "#007ED5",
                                      fontWeight: 600,
                                      borderRadius: "8px",
                                    }}
                                  >
                                    View
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 24px",
                  borderTop: "1px solid #EDF2F7",
                  fontSize: "12px",
                  color: "#64748B",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                <Text size={200} style={{ color: "#64748B" }}>
                  Showing {filteredAssets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, filteredAssets.length)} of {filteredAssets.length} records
                </Text>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      background: currentPage <= 1 ? "#F8FAFC" : "#FFFFFF",
                      color: currentPage <= 1 ? "#CBD5E1" : "#475569",
                      cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronLeftRegular style={{ fontSize: 16 }} />
                  </button>
                  <span
                    style={{
                      background: "#007ED5",
                      color: "#FFFFFF",
                      minWidth: "32px",
                      height: "32px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 8px",
                      borderRadius: "8px",
                      fontWeight: 600,
                      fontSize: "13px",
                    }}
                  >
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      background: currentPage >= totalPages ? "#F8FAFC" : "#FFFFFF",
                      color: currentPage >= totalPages ? "#CBD5E1" : "#475569",
                      cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                    }}
                  >
                    <ChevronRightRegular style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        </>
        )}

        {/* SCOPE 2: MAINTENANCES */}
        {scope === "maintenances" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* KPI Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>In Active Maintenance</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#D97706", marginTop: "4px" }}>
                      {maintenanceItems.filter((m) => m.status === "Under Maintenance").length}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#FEF3C7", color: "#D97706", display: "grid", placeItems: "center" }}>
                    <WrenchRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Active Repair Requests</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#007ED5", marginTop: "4px" }}>
                      {repairRequests.length}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#EFF6FF", color: "#007ED5", display: "grid", placeItems: "center" }}>
                    <WarningRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Resolved / Completed</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#16A34A", marginTop: "4px" }}>
                      {maintenanceItems.filter((m) => m.status === "Completed" || m.status === "Approved").length}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#DCFCE7", color: "#16A34A", display: "grid", placeItems: "center" }}>
                    <CheckmarkCircleRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Total Maintenance Fleet</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "4px" }}>
                      {maintenanceItems.length}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#F1F5F9", color: "#475569", display: "grid", placeItems: "center" }}>
                    <BoxToolboxRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Maintenances Search & Filter Card */}
            <div style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #EDF2F7", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ position: "relative", minWidth: "280px", maxWidth: "460px", flex: "1 1 280px" }}>
                  <Input
                    contentBefore={<SearchRegular style={{ color: "#64748B" }} />}
                    placeholder="Search maintenance by asset tag, name, issue, custodian..."
                    value={keyword}
                    onChange={(_, d) => setKeyword(d.value)}
                    style={{ width: "100%", borderRadius: "9999px", height: "38px" }}
                  />
                  {keyword && (
                    <button onClick={() => setKeyword("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer" }}>
                      <DismissRegular style={{ fontSize: 14 }} />
                    </button>
                  )}
                </div>

                {/* Sub-status filter pills */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  {["All", "Under Maintenance", "In Progress", "Completed"].map((s) => {
                    const isSel = maintenanceFilter === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setMaintenanceFilter(s)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "9999px",
                          fontSize: "12.5px",
                          fontWeight: isSel ? 700 : 500,
                          border: isSel ? "1px solid #007ED5" : "1px solid #E2E8F0",
                          background: isSel ? "#EFF6FF" : "#FFFFFF",
                          color: isSel ? "#007ED5" : "#475569",
                          cursor: "pointer",
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Maintenances Table */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontWeight: 600 }}>
                      <th style={{ padding: "12px 16px" }}>Asset</th>
                      <th style={{ padding: "12px 16px" }}>Serial No</th>
                      <th style={{ padding: "12px 16px" }}>Issue / Maintenance Reason</th>
                      <th style={{ padding: "12px 16px" }}>Custodian</th>
                      <th style={{ padding: "12px 16px" }}>Campus</th>
                      <th style={{ padding: "12px 16px" }}>Status</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMaintenances.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                          No maintenance records match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredMaintenances.map((item) => (
                        <tr key={item.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#F1F5F9", display: "grid", placeItems: "center" }}>
                                {getCategoryIcon(item.category, 16)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: "#0F172A" }}>{item.assetName}</div>
                                <div style={{ fontSize: "11px", color: "#007ED5", fontWeight: 700 }}>{item.assetTagId}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#64748B" }}>{item.serialNo}</td>
                          <td style={{ padding: "12px 16px", color: "#334155" }}>{item.issue}</td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>{item.custodian}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: "9999px", background: "#F1F5F9", fontSize: "11.5px", color: "#475569" }}>
                              {item.branch}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <Badge
                              appearance="filled"
                              color={item.status === "Completed" ? "success" : item.status === "Under Maintenance" ? "warning" : "informative"}
                            >
                              {item.status}
                            </Badge>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            {item.assetRecord && (
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={<EyeRegular />}
                                onClick={() => handleView(item.assetRecord!)}
                              >
                                View Device
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SCOPE 3: WARRANTIES */}
        {scope === "warranties" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* KPI Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Active Coverage</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#16A34A", marginTop: "4px" }}>
                      {warrantyItems.filter((w) => w.status === "Active").length}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#DCFCE7", color: "#16A34A", display: "grid", placeItems: "center" }}>
                    <ShieldCheckmarkRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Expiring Soon (&lt; 60 Days)</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#D97706", marginTop: "4px" }}>
                      {warrantyItems.filter((w) => w.status === "Expiring Soon").length}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#FEF3C7", color: "#D97706", display: "grid", placeItems: "center" }}>
                    <WarningRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Expired Warranties</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#DC2626", marginTop: "4px" }}>
                      {warrantyItems.filter((w) => w.status === "Expired").length}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#FEE2E2", color: "#DC2626", display: "grid", placeItems: "center" }}>
                    <ErrorCircleRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Total Warranted Fleet</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "4px" }}>
                      {warrantyItems.length}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#F1F5F9", color: "#475569", display: "grid", placeItems: "center" }}>
                    <BoxToolboxRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Warranties Search & Filter Card */}
            <div style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #EDF2F7", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ position: "relative", minWidth: "280px", maxWidth: "460px", flex: "1 1 280px" }}>
                  <Input
                    contentBefore={<SearchRegular style={{ color: "#64748B" }} />}
                    placeholder="Search warranties by tag, device, serial number, OEM..."
                    value={keyword}
                    onChange={(_, d) => setKeyword(d.value)}
                    style={{ width: "100%", borderRadius: "9999px", height: "38px" }}
                  />
                  {keyword && (
                    <button onClick={() => setKeyword("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer" }}>
                      <DismissRegular style={{ fontSize: 14 }} />
                    </button>
                  )}
                </div>

                {/* Sub-status filter pills */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                  {["All", "Active", "Expiring Soon", "Expired"].map((s) => {
                    const isSel = warrantyFilter === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setWarrantyFilter(s)}
                        style={{
                          padding: "6px 14px",
                          borderRadius: "9999px",
                          fontSize: "12.5px",
                          fontWeight: isSel ? 700 : 500,
                          border: isSel ? "1px solid #007ED5" : "1px solid #E2E8F0",
                          background: isSel ? "#EFF6FF" : "#FFFFFF",
                          color: isSel ? "#007ED5" : "#475569",
                          cursor: "pointer",
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Warranties Table */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontWeight: 600 }}>
                      <th style={{ padding: "12px 16px" }}>Asset Tag & Device</th>
                      <th style={{ padding: "12px 16px" }}>Serial No</th>
                      <th style={{ padding: "12px 16px" }}>OEM / Brand</th>
                      <th style={{ padding: "12px 16px" }}>Purchase Date</th>
                      <th style={{ padding: "12px 16px" }}>Expiry Date</th>
                      <th style={{ padding: "12px 16px" }}>Coverage Status</th>
                      <th style={{ padding: "12px 16px" }}>Custodian</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWarranties.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                          No warranty records match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredWarranties.map((item) => (
                        <tr key={item.asset.ID} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: 32, height: 32, borderRadius: "8px", background: "#F1F5F9", display: "grid", placeItems: "center" }}>
                                {getCategoryIcon(item.asset.Category, 16)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: "#0F172A" }}>{item.asset.AssetName}</div>
                                <div style={{ fontSize: "11px", color: "#007ED5", fontWeight: 700 }}>{item.asset.AssetTagID}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#64748B" }}>{item.asset.SerialNo || "—"}</td>
                          <td style={{ padding: "12px 16px", color: "#334155" }}>{item.asset.BrandName || item.asset.Brand || "Dell OEM"}</td>
                          <td style={{ padding: "12px 16px", color: "#64748B" }}>
                            {item.purchaseDate ? item.purchaseDate.toLocaleDateString("en-IN") : "—"}
                          </td>
                          <td style={{ padding: "12px 16px", color: "#64748B" }}>
                            {item.expireDate ? item.expireDate.toLocaleDateString("en-IN") : "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <Badge
                              appearance="filled"
                              color={item.status === "Active" ? "success" : item.status === "Expiring Soon" ? "warning" : "danger"}
                            >
                              {item.status === "Expiring Soon" ? `${item.diffDays}d remaining` : item.status}
                            </Badge>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>
                            {item.asset.AssignedToName || "Unassigned"}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={<EyeRegular />}
                                onClick={() => {
                                  setSelectedWarrantyAsset(item.asset);
                                  setWarrantyModalOpen(true);
                                }}
                              >
                                View Certificate
                              </Button>
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={<ArrowDownloadRegular />}
                                title="Download Certificate"
                                onClick={() => handleDownloadCertificate(item.asset)}
                              />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SCOPE 4: PERSONS */}
        {scope === "persons" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* KPI Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Total Personnel</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#007ED5", marginTop: "4px" }}>
                      {allEmployees.length}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#EFF6FF", color: "#007ED5", display: "grid", placeItems: "center" }}>
                    <PeopleRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Custodians With Fleet</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#16A34A", marginTop: "4px" }}>
                      {personsWithAssets.filter((p) => p.assetCount > 0).length}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#DCFCE7", color: "#16A34A", display: "grid", placeItems: "center" }}>
                    <BoxToolboxRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Assigned Fleet Devices</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#7C3AED", marginTop: "4px" }}>
                      {personsWithAssets.reduce((sum, p) => sum + p.assetCount, 0)}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#F5F3FF", color: "#7C3AED", display: "grid", placeItems: "center" }}>
                    <TagRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Persons Search & Filter Card */}
            <div style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #EDF2F7", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ position: "relative", minWidth: "280px", maxWidth: "460px", flex: "1 1 280px" }}>
                  <Input
                    contentBefore={<SearchRegular style={{ color: "#64748B" }} />}
                    placeholder="Search by name, email, job title, or employee ID..."
                    value={keyword}
                    onChange={(_, d) => setKeyword(d.value)}
                    style={{ width: "100%", borderRadius: "9999px", height: "38px" }}
                  />
                  {keyword && (
                    <button onClick={() => setKeyword("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer" }}>
                      <DismissRegular style={{ fontSize: 14 }} />
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <Dropdown
                    mountNode={mountNode}
                    value={personDeptFilter}
                    selectedOptions={[personDeptFilter]}
                    onOptionSelect={(_, d) => setPersonDeptFilter(d.optionValue || "All Departments")}
                    style={{ minWidth: "200px" }}
                  >
                    <Option value="All Departments">All Departments</Option>
                    {departments.map((d) => (
                      <Option key={d.Id} value={d.Name}>{d.Name}</Option>
                    ))}
                  </Dropdown>
                </div>
              </div>

              {/* Persons Table */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontWeight: 600 }}>
                      <th style={{ padding: "12px 16px" }}>Employee</th>
                      <th style={{ padding: "12px 16px" }}>Role & Department</th>
                      <th style={{ padding: "12px 16px" }}>Branch</th>
                      <th style={{ padding: "12px 16px" }}>Assigned Fleet</th>
                      <th style={{ padding: "12px 16px" }}>Assigned Devices</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPersons.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                          No employees match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPersons.map((p) => (
                        <tr key={p.ID} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div
                                style={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: "50%",
                                  background: "#EEF2FF",
                                  color: "#4F46E5",
                                  fontWeight: 700,
                                  fontSize: "12px",
                                  display: "grid",
                                  placeItems: "center",
                                }}
                              >
                                {p.DisplayName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: "#0F172A" }}>{p.DisplayName}</div>
                                <div style={{ fontSize: "11.5px", color: "#64748B" }}>{p.Mail || "No email"}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ color: "#1E293B", fontWeight: 500 }}>{p.JobTitle || "Staff"}</div>
                            <div style={{ fontSize: "11.5px", color: "#64748B" }}>{p.Department || "—"}</div>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{ padding: "2px 8px", borderRadius: "9999px", background: "#F1F5F9", fontSize: "11.5px", color: "#475569" }}>
                              {normalizeBranch(p.Branch || "Coimbatore")}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <Badge appearance="filled" color={p.assetCount > 0 ? "informative" : "subtle"}>
                              {p.assetCount} Asset{p.assetCount === 1 ? "" : "s"}
                            </Badge>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              {p.assignedAssets.length === 0 ? (
                                <span style={{ color: "#94A3B8", fontSize: "12px" }}>None assigned</span>
                              ) : (
                                p.assignedAssets.slice(0, 3).map((a) => (
                                  <span
                                    key={a.ID}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      padding: "2px 8px",
                                      borderRadius: "6px",
                                      background: "#F8FAFC",
                                      border: "1px solid #E2E8F0",
                                      fontSize: "11.5px",
                                      color: "#334155",
                                      fontWeight: 500,
                                    }}
                                  >
                                    <span style={{ color: "#007ED5", fontWeight: 700 }}>{a.AssetTagID}</span>
                                    <span>{a.AssetName}</span>
                                  </span>
                                ))
                              )}
                              {p.assignedAssets.length > 3 && (
                                <span style={{ fontSize: "11px", color: "#64748B" }}>+{p.assignedAssets.length - 3} more</span>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                              {p.assetCount > 0 && (
                                <Button
                                  size="small"
                                  appearance="subtle"
                                  icon={<BoxToolboxRegular />}
                                  onClick={() => {
                                    handleScopeChange("inventory");
                                    setKeyword(p.DisplayName);
                                  }}
                                >
                                  View Assets
                                </Button>
                              )}
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={<OpenRegular />}
                                onClick={() => navigate(`/Asset/employees/${p.ID}`)}
                              >
                                Profile
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SCOPE 5: VENDORS (OEM PARTNERS & SUPPLIERS) */}
        {scope === "vendors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* KPI Summary Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Authorized OEM Partners</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#007ED5", marginTop: "4px" }}>
                      {vendors.length}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#EFF6FF", color: "#007ED5", display: "grid", placeItems: "center" }}>
                    <BuildingShopRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Fleet Devices Supplied</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#16A34A", marginTop: "4px" }}>
                      {vendorsWithAssets.reduce((sum, v) => sum + v.suppliedCount, 0)}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#DCFCE7", color: "#16A34A", display: "grid", placeItems: "center" }}>
                    <BoxToolboxRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>

              <Card style={{ padding: "18px 20px", borderRadius: "14px", border: "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <Text size={200} style={{ color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>Equipment Sourced Value</Text>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#0F172A", marginTop: "4px" }}>
                      ₹{vendorsWithAssets.reduce((sum, v) => sum + v.totalValue, 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#F1F5F9", color: "#475569", display: "grid", placeItems: "center" }}>
                    <ShieldCheckmarkRegular style={{ fontSize: 22 }} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Vendors Search Card */}
            <div style={{ background: "#FFFFFF", borderRadius: "16px", border: "1px solid #EDF2F7", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ position: "relative", minWidth: "280px", maxWidth: "460px", flex: "1 1 280px" }}>
                  <Input
                    contentBefore={<SearchRegular style={{ color: "#64748B" }} />}
                    placeholder="Search vendors by company, contact person, GSTIN, city..."
                    value={keyword}
                    onChange={(_, d) => setKeyword(d.value)}
                    style={{ width: "100%", borderRadius: "9999px", height: "38px" }}
                  />
                  {keyword && (
                    <button onClick={() => setKeyword("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", border: "none", background: "transparent", color: "#94a3b8", cursor: "pointer" }}>
                      <DismissRegular style={{ fontSize: 14 }} />
                    </button>
                  )}
                </div>
              </div>

              {/* Vendors Table */}
              <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0", color: "#475569", fontWeight: 600 }}>
                      <th style={{ padding: "12px 16px" }}>Company / Vendor</th>
                      <th style={{ padding: "12px 16px" }}>Description</th>
                      <th style={{ padding: "12px 16px" }}>Address / Pincode</th>
                      <th style={{ padding: "12px 16px" }}>GSTIN</th>
                      <th style={{ padding: "12px 16px" }}>Fleet Supplied</th>
                      <th style={{ padding: "12px 16px" }}>Status</th>
                      <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendors.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
                          No vendor partners match your search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredVendors.map((vend) => (
                        <tr key={vend.ID} style={{ borderBottom: "1px solid #F1F5F9" }}>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: 34, height: 34, borderRadius: "8px", background: "#EFF6FF", color: "#007ED5", display: "grid", placeItems: "center" }}>
                                <BuildingShopRegular style={{ fontSize: 18 }} />
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: "#0F172A" }}>{vend.VendorName}</div>
                                <div style={{ fontSize: "11px", color: "#64748B" }}>Authorized OEM Partner</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>{vend.Description || "Hardware Procurement Partner"}</td>
                          <td style={{ padding: "12px 16px", color: "#475569" }}>
                            {vend.VendorAddress || "—"} {vend.Pincode ? `(${vend.Pincode})` : ""}
                          </td>
                          <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#64748B" }}>{vend.GSTIN || "—"}</td>
                          <td style={{ padding: "12px 16px" }}>
                            <Badge appearance="filled" color={vend.suppliedCount > 0 ? "success" : "subtle"}>
                              {vend.suppliedCount} Device{vend.suppliedCount === 1 ? "" : "s"}
                            </Badge>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <Badge appearance="tint" color="success">
                              Active Partner
                            </Badge>
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            {vend.suppliedCount > 0 && (
                              <Button
                                size="small"
                                appearance="subtle"
                                icon={<BoxToolboxRegular />}
                                onClick={() => {
                                  handleScopeChange("inventory");
                                  setKeyword(vend.VendorName);
                                }}
                              >
                                View Supplied Fleet
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Side Panel for Asset Details */}
        <Drawer
          type="overlay"
          position="end"
          size="large"
          open={isPanelOpen}
          onOpenChange={(_, { open }) => setIsPanelOpen(open)}
        >
          <DrawerHeader>
            <DrawerHeaderTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="Close"
                  icon={<DismissRegular />}
                  onClick={() => setIsPanelOpen(false)}
                />
              }
            >
              Asset Details
            </DrawerHeaderTitle>
          </DrawerHeader>
          <DrawerBody>
            {isPanelLoading && !panelAsset ? (
              <div style={{ padding: "20px", textAlign: "center" }}><Spinner size="large" /></div>
            ) : panelAsset ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <Text size={500} weight="semibold" style={{ display: "block", marginBottom: "4px" }}>
                      {panelAsset.AssetName || "N/A"}
                    </Text>
                    <Text size={300} style={{ color: "#666" }}>
                      {panelAsset.Description || "No description"}
                    </Text>
                  </div>
                  <Badge color={getStatusColor(panelAsset.Status)} appearance="filled" size="large">
                    {panelAsset.Status === "In Stock" ? "Available" : panelAsset.Status}
                  </Badge>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Asset Tag ID</Text>
                    <Text weight="medium">{panelAsset.AssetTagID || "—"}</Text>
                  </div>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Category</Text>
                    <Text weight="medium">{panelAsset.Category || "—"}</Text>
                  </div>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Brand</Text>
                    <Text weight="medium">{panelAsset.BrandName || (panelAsset.Brand ? brands.find(b => b.ID === panelAsset.Brand)?.BrandName : null) || "—"}</Text>
                  </div>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Model</Text>
                    <Text weight="medium">{panelAsset.Model || "—"}</Text>
                  </div>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Serial No</Text>
                    <Text weight="medium">{panelAsset.SerialNo || "—"}</Text>
                  </div>
                </div>

                <Divider />

                <Text size={400} weight="semibold">Assignment</Text>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Assigned To</Text>
                    <Text weight="medium">{panelAsset.AssignedToName || "Unassigned"}</Text>
                  </div>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Department</Text>
                    <Text weight="medium">{panelAsset.AssignedToDepartment || "—"}</Text>
                  </div>
                </div>

                <Divider />

                <Text size={400} weight="semibold">Location</Text>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Branch / Campus</Text>
                    <Text weight="medium">{normalizeBranch(panelAsset.Site || panelAsset.LocationName || "Coimbatore")}</Text>
                  </div>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Location Room</Text>
                    <Text weight="medium">{panelAsset.LocationName || panelAsset.Location || "—"}</Text>
                  </div>
                </div>

                <Divider />

                <Text size={400} weight="semibold">Acquisition</Text>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Vendor</Text>
                    <Text weight="medium">{panelAsset.VendorName || panelAsset.VendorID || "—"}</Text>
                  </div>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Cost</Text>
                    <Text weight="medium">
                      {panelAsset.Cost != null ? `₹${panelAsset.Cost.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "—"}
                    </Text>
                  </div>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Purchased Date</Text>
                    <Text weight="medium">
                      {panelAsset.PurchasedDate ? new Date(panelAsset.PurchasedDate).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "—"}
                    </Text>
                  </div>
                  <div>
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Expire Date</Text>
                    <Text weight="medium">
                      {panelAsset.ExpireDate ? new Date(panelAsset.ExpireDate).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }) : "—"}
                    </Text>
                  </div>
                </div>
              </div>
            ) : null}
          </DrawerBody>
        </Drawer>

        {/* Certificate of OEM Warranty Coverage Modal */}
        <Dialog open={warrantyModalOpen} onOpenChange={(_, { open }) => setWarrantyModalOpen(open)}>
          <DialogSurface style={{ maxWidth: "600px", borderRadius: "16px", padding: "24px" }}>
            <DialogBody>
              <DialogTitle
                action={
                  <Button
                    appearance="subtle"
                    aria-label="Close"
                    icon={<DismissRegular />}
                    onClick={() => setWarrantyModalOpen(false)}
                  />
                }
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <ShieldCheckmarkRegular style={{ color: "#007ED5", fontSize: "24px" }} />
                  <div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                      Certificate of OEM Warranty Coverage
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748B", fontWeight: 400 }}>
                      Verified Enterprise Hardware SLA & AMC Agreement
                    </div>
                  </div>
                </div>
              </DialogTitle>
              <DialogContent style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: "16px" }}>
                {selectedWarrantyAsset && (() => {
                  const wInfo = getAssetWarrantyInfo(selectedWarrantyAsset);
                  return (
                    <>
                      {/* Banner */}
                      <div
                        style={{
                          background: wInfo.status === "Active" ? "#F0FDF4" : wInfo.status === "Expiring Soon" ? "#FFFBEB" : "#FEF2F2",
                          border: `1px solid ${wInfo.status === "Active" ? "#BBF7D0" : wInfo.status === "Expiring Soon" ? "#FDE68A" : "#FECACA"}`,
                          borderRadius: "12px",
                          padding: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                            Certificate Reference
                          </div>
                          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", marginTop: "2px" }}>
                            WARR-{selectedWarrantyAsset.AssetTagID}
                          </div>
                        </div>
                        <Badge
                          appearance="filled"
                          color={wInfo.status === "Active" ? "success" : wInfo.status === "Expiring Soon" ? "warning" : "danger"}
                          size="large"
                        >
                          {wInfo.status.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Details Grid */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "14px",
                          background: "#F8FAFC",
                          padding: "16px",
                          borderRadius: "12px",
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        <div>
                          <Text size={200} style={{ color: "#64748B", display: "block" }}>Asset Tag ID</Text>
                          <Text weight="semibold" style={{ color: "#007ED5" }}>{selectedWarrantyAsset.AssetTagID}</Text>
                        </div>
                        <div>
                          <Text size={200} style={{ color: "#64748B", display: "block" }}>Device Name</Text>
                          <Text weight="semibold">{selectedWarrantyAsset.AssetName}</Text>
                        </div>
                        <div>
                          <Text size={200} style={{ color: "#64748B", display: "block" }}>Serial Number</Text>
                          <Text weight="semibold">{selectedWarrantyAsset.SerialNo || "—"}</Text>
                        </div>
                        <div>
                          <Text size={200} style={{ color: "#64748B", display: "block" }}>Model</Text>
                          <Text weight="semibold">{selectedWarrantyAsset.Model || "Enterprise Hardware"}</Text>
                        </div>
                        <div>
                          <Text size={200} style={{ color: "#64748B", display: "block" }}>Purchase Date</Text>
                          <Text weight="semibold">
                            {wInfo.purchaseDate ? wInfo.purchaseDate.toLocaleDateString("en-IN") : "01/01/2024"}
                          </Text>
                        </div>
                        <div>
                          <Text size={200} style={{ color: "#64748B", display: "block" }}>Expiry Date</Text>
                          <Text weight="semibold">
                            {wInfo.expireDate ? wInfo.expireDate.toLocaleDateString("en-IN") : "01/01/2027"}
                          </Text>
                        </div>
                        <div>
                          <Text size={200} style={{ color: "#64748B", display: "block" }}>Days Remaining</Text>
                          <Text weight="semibold" style={{ color: wInfo.diffDays > 0 ? "#16A34A" : "#DC2626" }}>
                            {wInfo.diffDays > 0 ? `${wInfo.diffDays} Days` : "Coverage Expired"}
                          </Text>
                        </div>
                        <div>
                          <Text size={200} style={{ color: "#64748B", display: "block" }}>OEM Partner</Text>
                          <Text weight="semibold">{selectedWarrantyAsset.BrandName || selectedWarrantyAsset.Brand || "Certified OEM"}</Text>
                        </div>
                      </div>

                      {/* Security Signoff */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px 14px",
                          background: "#F0FDF4",
                          border: "1px solid #BBF7D0",
                          borderRadius: "10px",
                          fontSize: "12px",
                          color: "#166534",
                        }}
                      >
                        <CheckmarkCircleRegular style={{ fontSize: "16px", color: "#16A34A", flexShrink: 0 }} />
                        <span>Verified enterprise hardware asset under active Quadra warranty surveillance.</span>
                      </div>
                    </>
                  );
                })()}
              </DialogContent>
              <DialogActions style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <Button appearance="secondary" onClick={() => setWarrantyModalOpen(false)}>
                  Close
                </Button>
                {selectedWarrantyAsset && (
                  <Button
                    appearance="primary"
                    icon={<ArrowDownloadRegular />}
                    onClick={() => handleDownloadCertificate(selectedWarrantyAsset)}
                  >
                    Download Certificate
                  </Button>
                )}
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      </div>
      {portal}
    </>
  );
};

export default SearchAssets;
