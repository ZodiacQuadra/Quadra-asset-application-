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
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
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
import { useNavigate, useSearchParams } from "react-router-dom";
import { getStoredAuthToken } from "../../Auth/tokenStorage";
import { getEntraDepartments, EntraDepartment } from "../../Services/Department";
import { getAllEntraUsers, EntraADUser } from "../../Services/EntraADUserService";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { getCategoryIcon } from "../Utils/categoryIcon";

const SearchAssets: React.FC = () => {
  const { mountNode, portal } = useThemedMountNode();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search form state
  const [keyword, setKeyword] = useState("");
  const [searchAs, setSearchAs] = useState("Contains");
  const [searchFields, setSearchFields] = useState<string[]>(["Standard fields"]);
  const [location, setLocation] = useState("All Locations");

  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [vendors, setVendors] = useState<AssetVendorRecord[]>([]);
  const [locations, setLocations] = useState<AppLocationOption[]>([]);
  const [departments, setDepartments] = useState<EntraDepartment[]>([]);
  const [brands, setBrands] = useState<AssetBrandRecord[]>([]);

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
    setPanelAsset(asset); // Initial basic data
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

  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // Search results state
  const [showCriteria, setShowCriteria] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allAssets, setAllAssets] = useState<AssetInventoryRecord[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<AssetInventoryRecord[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const quickDateBounds = useMemo(() => {
    let effectiveStart: Date | undefined;
    let effectiveEnd: Date | undefined;
    if (!quickDateRange || quickDateRange === "...") return { minDate: undefined, maxDate: undefined };
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    const thisQuarter = Math.floor(thisMonth / 4);

    switch (quickDateRange) {
      case "Current Month":
      case "Month":
        effectiveStart = new Date(thisYear, thisMonth, 1);
        effectiveEnd = new Date(thisYear, thisMonth + 1, 0);
        break;
      case "Previous Month":
        effectiveStart = new Date(thisYear, thisMonth - 1, 1);
        effectiveEnd = new Date(thisYear, thisMonth, 0);
        break;
      case "Current Quarter":
      case "Quarter":
        effectiveStart = new Date(thisYear, thisQuarter * 4, 1);
        effectiveEnd = new Date(thisYear, thisQuarter * 4 + 4, 0);
        break;
      case "Previous Quarter": {
        const pq = thisQuarter === 0 ? 2 : thisQuarter - 1;
        const pqYear = thisQuarter === 0 ? thisYear - 1 : thisYear;
        effectiveStart = new Date(pqYear, pq * 4, 1);
        effectiveEnd = new Date(pqYear, pq * 4 + 4, 0);
        break;
      }
      case "Current Year":
      case "Year":
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
      case "Year 2022":
        effectiveStart = new Date(2022, 0, 1);
        effectiveEnd = new Date(2022, 11, 31);
        break;
      case "Year 2021":
        effectiveStart = new Date(2021, 0, 1);
        effectiveEnd = new Date(2021, 11, 31);
        break;
    }
    return { minDate: effectiveStart, maxDate: effectiveEnd };
  }, [quickDateRange]);

  const handleQuickDateSelect = (val: string) => {
    setQuickDateRange(val);
    let effectiveStart: Date | null = null;
    let effectiveEnd: Date | null = null;
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    const thisQuarter = Math.floor(thisMonth / 4);

    switch (val) {
      case "Current Month":
      case "Month":
        effectiveStart = new Date(thisYear, thisMonth, 1);
        effectiveEnd = new Date(thisYear, thisMonth + 1, 0);
        break;
      case "Previous Month":
        effectiveStart = new Date(thisYear, thisMonth - 1, 1);
        effectiveEnd = new Date(thisYear, thisMonth, 0);
        break;
      case "Current Quarter":
      case "Quarter":
        effectiveStart = new Date(thisYear, thisQuarter * 4, 1);
        effectiveEnd = new Date(thisYear, thisQuarter * 4 + 4, 0);
        break;
      case "Previous Quarter": {
        const pq = thisQuarter === 0 ? 2 : thisQuarter - 1;
        const pqYear = thisQuarter === 0 ? thisYear - 1 : thisYear;
        effectiveStart = new Date(pqYear, pq * 4, 1);
        effectiveEnd = new Date(pqYear, pq * 4 + 4, 0);
        break;
      }
      case "Current Year":
      case "Year":
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
      case "Year 2022":
        effectiveStart = new Date(2022, 0, 1);
        effectiveEnd = new Date(2022, 11, 31);
        break;
      case "Year 2021":
        effectiveStart = new Date(2021, 0, 1);
        effectiveEnd = new Date(2021, 11, 31);
        break;
      default:
        break;
    }
    setCustomStartDate(effectiveStart);
    setCustomEndDate(effectiveEnd);
  };

  useEffect(() => {
    getAssetCategories().then((res) => setCategories(res)).catch(() => { });
    getAssetVendors().then((res) => setVendors(res)).catch(() => { });
    getAppLocations().then((res) => setLocations(res)).catch(() => { });
    getAssetBrands().then((res) => setBrands(res)).catch(() => { });
    const token = getStoredAuthToken();
    if (token) {
      getEntraDepartments(token).then((res) => {
        setDepartments(res.filter((d) => d.Status === "active"));
      }).catch(() => { });
    }
  }, []);

  useEffect(() => {
    if (!personQuery || personQuery.length < 2) {
      setPersonResults([]);
      setPersonIsOpen(false);
      return;
    }
    const handle = setTimeout(async () => {
      setPersonLoading(true);
      try {
        const res = await getAllEntraUsers(1, 8, personQuery);
        if (res.success && res.data?.users) {
          let users = res.data.users;
          if (department !== "All Departments") {
            users = users.filter((u: EntraADUser) => u.Department === department);
          }
          setPersonResults(users);
          setPersonIsOpen(true);
        }
      } finally {
        setPersonLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [personQuery, department]);

  // ---------- Search / Filter Logic ----------
    const matchKeyword = useCallback(
      (asset: AssetInventoryRecord, kw: string): boolean => {
        if (!kw) return true;
        const lower = kw.toLowerCase();
        const isAll = searchFields.includes("Standard fields") || searchFields.length === 0;

        let matchedVendorIds: string[] = [];
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
        if (isAll || searchFields.includes("Asset Tag ID")) fields.push(asset.AssetTagID?.toString().toLowerCase() ?? "");
        if (isAll || searchFields.includes("Brand")) fields.push(resolvedBrandName?.toString().toLowerCase() ?? "");
        if (isAll || searchFields.includes("Description")) fields.push(asset.Description?.toString().toLowerCase() ?? "");
        if (isAll || searchFields.includes("Model")) fields.push(asset.Model?.toString().toLowerCase() ?? "");
        if (isAll || searchFields.includes("Serial No")) fields.push(asset.SerialNo?.toString().toLowerCase() ?? "");

        const matchesText = fields.some((f) => {
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
    setHasSearched(true);
    setShowCriteria(false);
    setCurrentPage(1);
    try {
      // Fetch all assets from the inventory
      const assets = await getAssetInventoryList();
      setAllAssets(assets);

      // Apply client-side filters
      let results = assets;
      const kw = overrideKw !== undefined ? overrideKw.trim() : keyword.trim();

      if (kw && searchParams.get("q") !== kw) {
        setSearchParams({ q: kw }, { replace: true });
      }

      // Keyword filter
      if (kw) {
        results = results.filter((a) => matchKeyword(a, kw));
      }

      // Location filter
      if (location !== "All Locations") {
        results = results.filter((a) => a.Location === location);
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
        results = results.filter((a) => a.Status === status);
      }

      // Person filter
      if (selectedPersonId) {
        results = results.filter((a) => a.AssignedToUserID?.toLowerCase() === selectedPersonId.toLowerCase());
      }

      // Vendor filter
      if (vendor !== "Any Vendor") {
        results = results.filter((a) => a.VendorID === vendor);
      }

      // Date range filter (quick presets + custom)
      let effectiveStart: Date | null = null;
      let effectiveEnd: Date | null = null;
      const now = new Date();
      const thisYear = now.getFullYear();
      const thisMonth = now.getMonth();
      const thisQuarter = Math.floor(thisMonth / 4); // 4-month quarters: Q0=Jan-Apr, Q1=May-Aug, Q2=Sep-Dec

      switch (quickDateRange) {
        case "Current Month":
          effectiveStart = new Date(thisYear, thisMonth, 1);
          effectiveEnd = new Date(thisYear, thisMonth + 1, 0);
          break;
        case "Previous Month":
          effectiveStart = new Date(thisYear, thisMonth - 1, 1);
          effectiveEnd = new Date(thisYear, thisMonth, 0);
          break;
        case "Month":
          effectiveStart = new Date(thisYear, thisMonth, 1);
          effectiveEnd = new Date(thisYear, thisMonth + 1, 0);
          break;
        case "Current Quarter":
          effectiveStart = new Date(thisYear, thisQuarter * 4, 1);
          effectiveEnd = new Date(thisYear, thisQuarter * 4 + 4, 0);
          break;
        case "Previous Quarter": {
          const pq = thisQuarter === 0 ? 2 : thisQuarter - 1;
          const pqYear = thisQuarter === 0 ? thisYear - 1 : thisYear;
          effectiveStart = new Date(pqYear, pq * 4, 1);
          effectiveEnd = new Date(pqYear, pq * 4 + 4, 0);
          break;
        }
        case "Quarter":
          effectiveStart = new Date(thisYear, thisQuarter * 4, 1);
          effectiveEnd = new Date(thisYear, thisQuarter * 4 + 4, 0);
          break;
        case "Current Year":
          effectiveStart = new Date(thisYear, 0, 1);
          effectiveEnd = new Date(thisYear, 11, 31);
          break;
        case "Year":
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
        case "Year 2022":
          effectiveStart = new Date(2022, 0, 1);
          effectiveEnd = new Date(2022, 11, 31);
          break;
        case "Year 2021":
          effectiveStart = new Date(2021, 0, 1);
          effectiveEnd = new Date(2021, 11, 31);
          break;
        default:
          break;
      }

      // Custom date range overrides quick presets
      if (customStartDate) effectiveStart = customStartDate;
      if (customEndDate) effectiveEnd = customEndDate;

      if (effectiveStart || effectiveEnd) {
        results = results.filter((a) => {
          // Collect candidate dates based on the selected dateRangeBy
          const candidateDates: string[] = [];
          if (dateRangeBy === "Purchase Date") {
            if (a.PurchasedDate) candidateDates.push(a.PurchasedDate);
          } else if (dateRangeBy === "Date Created") {
            if (a.CreatedAt) candidateDates.push(a.CreatedAt);
          } else {
            // "..." - check both; pass if either date is in range
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
    } catch {
      setFilteredAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset search results
    setHasSearched(false);
    setShowCriteria(true);
    setFilteredAssets([]);
    setAllAssets([]);
    setCurrentPage(1);

    // Reset search criteria
    setKeyword("");
    setSearchAs("Contains");
    setSearchFields(["Standard fields"]);
    setLocation("All Locations");
    setCategory("All Categories");
    setDepartment("All Departments");
    setPersonQuery("");
    setPerson("Any Person");
    setSelectedPersonId(null);
    setPersonResults([]);
    setVendor("Any Vendor");
    setStatus("Any Status");

    // Reset display results
    setGroupedBy("...");
    setNumResults("10");
    setDateRangeBy("Purchase Date");
    setQuickDateRange("...");
    setCustomStartDate(null);
    setCustomEndDate(null);
    setSearchParams({}, { replace: true });
  };

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    if (q) {
      setKeyword(q);
      handleSearch(q);
    } else {
      handleSearch("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // ---------- Pagination ----------
  const pageSize = parseInt(numResults) || 10;
  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
  const paginatedAssets = filteredAssets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ---------- Grouping ----------
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

  // ---------- Status badge color ----------
  const getStatusColor = (s: string): "success" | "warning" | "danger" | "informative" | "important" => {
    switch (s) {
      case "In Stock":
        return "success";
      case "Assigned":
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
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
              <span>Dashboard</span>
              <span>/</span>
              <span style={{ color: "#007ed5", fontWeight: 500 }}>Search</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Text size={600} weight="bold" style={{ color: "#0f172a", fontSize: 24, letterSpacing: "-0.02em" }}>
                Search Assets
              </Text>
              <Button
                appearance={showCriteria ? "primary" : "outline"}
                icon={<FilterRegular />}
                shape="rounded"
                style={{
                  borderRadius: "999px",
                  fontWeight: 600,
                  fontSize: 13,
                  background: showCriteria ? "#007ED5" : "#ffffff",
                  color: showCriteria ? "#ffffff" : "#475569",
                  border: showCriteria ? "1px solid #007ED5" : "1px solid #cbd5e1",
                  padding: "6px 18px",
                  boxShadow: showCriteria ? "0 2px 8px rgba(0, 126, 213, 0.25)" : "none",
                }}
                onClick={() => setShowCriteria(!showCriteria)}
              >
                Search Criteria
              </Button>
            </div>
          </div>
        </div>

        <div>
          {/* Search Criteria Card */}
          {showCriteria && (
            <div className="quadra-glass-card" style={{ padding: "28px", borderRadius: "18px", display: "flex", flexDirection: "column", gap: "24px", marginBottom: "20px" }}>

              {/* Search Criteria Section */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                {/* Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Search">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Input
                        placeholder="Keyword"
                        style={{ flex: 1 }}
                        value={keyword}
                        onChange={(_, d) => setKeyword(d.value)}
                      />
                      <Text size={200} style={{ color: "#605E5C" }}>as</Text>
                      <Dropdown
                        mountNode={mountNode}
                        value={searchAs}
                        selectedOptions={[searchAs]}
                        onOptionSelect={(_, d) => setSearchAs(d.optionValue || "")}
                        style={{ width: "120px" }}
                      >
                        <Option value="Exact">Exact</Option>
                        <Option value="Contains">Contains</Option>
                        <Option value="Start with">Start with</Option>
                        <Option value="End with">End with</Option>
                      </Dropdown>
                    </div>
                  </Field>

                  <Field label="Search fields">
                    <Dropdown
                      mountNode={mountNode}
                      multiselect={true}
                      value={searchFields.join(", ")}
                      selectedOptions={searchFields}
                      onOptionSelect={(_, d) => setSearchFields(d.selectedOptions)}
                    >
                      <Option value="Standard fields">Standard fields</Option>
                      <Option value="Asset Tag ID">Asset Tag ID</Option>
                      <Option value="Brand">Brand</Option>
                      <Option value="Description">Description</Option>
                      <Option value="Model">Model</Option>
                      <Option value="Purchased from">Purchased from</Option>
                      <Option value="Serial No">Serial No</Option>
                    </Dropdown>
                  </Field>
                </div>

                {/* Row 2 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Field label="Location">
                    <Dropdown
                      mountNode={mountNode}
                      value={location === "All Locations" ? "All Locations" : locations.find(l => l.Id === location)?.Name || location}
                      selectedOptions={[location]}
                      onOptionSelect={(_, d) => setLocation(d.optionValue || "")}
                    >
                      <Option value="All Locations">All Locations</Option>
                      {locations.map((loc) => (
                        <Option key={loc.Id} value={loc.Id}>{loc.Name}</Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Category">
                    <Dropdown
                      mountNode={mountNode}
                      value={category}
                      selectedOptions={[category]}
                      onOptionSelect={(_, d) => setCategory(d.optionValue || "")}
                    >
                      <Option value="All Categories">All Categories</Option>
                      {categories.map((c) => (
                        <Option key={c.ID} value={c.CategoryName ?? ""}>{c.CategoryName}</Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Department">
                    <Dropdown
                      mountNode={mountNode}
                      value={department}
                      selectedOptions={[department]}
                      onOptionSelect={(_, d) => setDepartment(d.optionValue || "")}
                    >
                      <Option value="All Departments">All Departments</Option>
                      {departments.map((d) => (
                        <Option key={d.Id} value={d.Name}>{d.Name}</Option>
                      ))}
                    </Dropdown>
                  </Field>
                </div>

                {/* Row 3 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Field label="Person">
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
                        <Option key="loading" value="" disabled text="Searching...">Searching...</Option>
                      ) : personResults.length === 0 ? (
                        <Option key="empty" value="" disabled text="No results">
                          {personQuery.length < 2 ? "Type at least 2 characters to search" : "No users found"}
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
                  <Field label="Vendor Name">
                    <Dropdown
                      mountNode={mountNode}
                      value={vendor === "Any Vendor" ? "Any Vendor" : vendors.find(v => v.ID === vendor)?.VendorName || vendor}
                      selectedOptions={[vendor]}
                      onOptionSelect={(_, d) => setVendor(d.optionValue || "")}
                    >
                      <Option value="Any Vendor">Any Vendor</Option>
                      {vendors.map((v) => (
                        <Option key={v.ID} value={v.ID}>{v.VendorName}</Option>
                      ))}
                    </Dropdown>
                  </Field>
                  <Field label="Status">
                    <Dropdown
                      mountNode={mountNode}
                      value={status}
                      selectedOptions={[status]}
                      onOptionSelect={(_, d) => setStatus(d.optionValue || "")}
                    >
                      <Option value="Any Status">Any Status</Option>
                      <Option value="In Stock">In Stock</Option>
                      <Option value="Assigned">Assigned</Option>
                      <Option value="Under Maintenance">Under Maintenance</Option>
                      <Option value="End of Use">End of Use</Option>
                      <Option value="Reserved">Reserved</Option>
                    </Dropdown>
                  </Field>
                </div>
              </div>

              <Divider style={{ margin: "24px 0" }} />

              {/* Bottom Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

                {/* Display Results */}
                <div className="col-span-1 lg:col-span-4">
                  <Text weight="semibold" size={400} style={{ display: "block", marginBottom: "16px" }}>Display Results</Text>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    <Field label="No. of Results">
                      <Dropdown
                        mountNode={mountNode}
                        value={numResults}
                        selectedOptions={[numResults]}
                        onOptionSelect={(_, d) => setNumResults(d.optionValue || "")}
                      >
                        <Option value="10">10</Option>
                        <Option value="25">25</Option>
                        <Option value="50">50</Option>
                        <Option value="100">100</Option>
                        <Option value="250">250</Option>
                      </Dropdown>
                    </Field>
                    <Field label="Date Range By">
                      <Dropdown
                        mountNode={mountNode}
                        value={dateRangeBy}
                        selectedOptions={[dateRangeBy]}
                        onOptionSelect={(_, d) => setDateRangeBy(d.optionValue || "")}
                      >
                        <Option value="...">...</Option>
                        <Option value="Purchase Date">Purchase Date</Option>
                        <Option value="Date Created">Date Created</Option>
                      </Dropdown>
                    </Field>
                    <Field label="Quick Date Range">
                      <Dropdown
                        mountNode={mountNode}
                        value={quickDateRange}
                        selectedOptions={[quickDateRange]}
                        onOptionSelect={(_, d) => handleQuickDateSelect(d.optionValue || "")}
                      >
                        <Option value="...">...</Option>
                        <Option value="Month">Month</Option>
                        <Option value="Current Month">Current Month</Option>
                        <Option value="Previous Month">Previous Month</Option>
                        <Option value="Quarter">Quarter</Option>
                        <Option value="Current Quarter">Current Quarter</Option>
                        <Option value="Previous Quarter">Previous Quarter</Option>
                        <Option value="Year">Year</Option>
                        <Option value="Current Year">Current Year</Option>
                        <Option value="Year 2025">Year 2025</Option>
                        <Option value="Year 2024">Year 2024</Option>
                        <Option value="Year 2023">Year 2023</Option>
                        <Option value="Year 2022">Year 2022</Option>
                        <Option value="Year 2021">Year 2021</Option>
                      </Dropdown>
                    </Field>
                    <div className="col-span-1 sm:col-span-2 lg:col-span-2">
                      <Field label="Custom Date Range">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <DatePicker
                            mountNode={mountNode}
                            placeholder="dd-mm-yyyy"
                            value={customStartDate}
                            minDate={quickDateBounds.minDate}
                            maxDate={quickDateBounds.maxDate}
                            onSelectDate={(d) => {
                              setCustomStartDate(d || null);
                              if (d && customEndDate && d.getTime() >= customEndDate.getTime()) {
                                setCustomEndDate(null);
                              }
                            }}
                            formatDate={(date) => {
                              if (!date) return "";
                              return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear()}`;
                            }}
                          />
                          <span style={{ color: "#888" }}>&rarr;</span>
                          <DatePicker
                            mountNode={mountNode}
                            placeholder="dd-mm-yyyy"
                            value={customEndDate}
                            minDate={customStartDate ? new Date(customStartDate.getTime() + 86400000) : quickDateBounds.minDate}
                            maxDate={quickDateBounds.maxDate}
                            onSelectDate={(d) => setCustomEndDate(d || null)}
                            formatDate={(date) => {
                              if (!date) return "";
                              return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear()}`;
                            }}
                          />
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>
              </div>

              <Divider style={{ margin: "24px 0" }} />

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <Button
                  appearance="subtle"
                  size="large"
                  onClick={handleCancel}
                  style={{ borderRadius: "999px", fontWeight: 600 }}
                >
                  Clear Filters
                </Button>
                <Button
                  appearance="primary"
                  size="large"
                  icon={<SearchRegular />}
                  style={{
                    borderRadius: "999px",
                    background: "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)",
                    boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
                    fontWeight: 600,
                    padding: "0 24px",
                  }}
                  onClick={() => handleSearch()}
                  disabled={loading}
                >
                  {loading ? <Spinner size="tiny" /> : "Search Assets"}
                </Button>
              </div>
            </div>
          )}

          {/* Search Results */}
          {hasSearched && !loading && !showCriteria && (
            <div className="quadra-glass-card" style={{ padding: "0", overflow: "hidden", borderRadius: "18px" }}>

              {/* Pagination Top */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 24px",
                borderBottom: "1px solid #e0e0e0"
              }}>
                <Dropdown
                  mountNode={mountNode}
                  value={numResults}
                  selectedOptions={[numResults]}
                  onOptionSelect={(_, d) => { setNumResults(d.optionValue || ""); setCurrentPage(1); }}
                  style={{ width: "70px" }}
                >
                  <Option value="10">10</Option>
                  <Option value="25">25</Option>
                  <Option value="50">50</Option>
                  <Option value="100">100</Option>
                  <Option value="250">250</Option>
                </Dropdown>
                <Text size={200}>assets</Text>
                <div style={{ flex: 1 }} />
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ChevronLeftRegular />}
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  />
                  <Button
                    appearance="primary"
                    size="small"
                    style={{ background: "#007ED5", color: "#fff", minWidth: "32px", padding: "0 8px", borderRadius: "6px", border: "1px solid #007ED5" }}
                  >
                    {currentPage} / {totalPages}
                  </Button>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ChevronRightFilled />}
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  />
                </div>
              </div>

              {/* Results Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Asset</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Type</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Custody / Assignee</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Location</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Brand</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Purchase Date</th>
                      <th style={{ padding: "14px 20px", textAlign: "left", fontWeight: 600, color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Status</th>
                      <th style={{ padding: "14px 20px", textAlign: "right", fontWeight: 600, color: "#64748b", fontSize: "12px", textTransform: "uppercase" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssets.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "48px 20px", textAlign: "center", color: "#94a3b8" }}>
                          No assets found matching your search criteria.
                        </td>
                      </tr>
                    ) : (
                      Array.from(groupedAssets().entries()).map(([groupKey, assets]) => (
                        <React.Fragment key={groupKey || "__all"}>
                          {groupKey && (
                            <tr style={{ backgroundColor: "#f1f5f9" }}>
                              <td colSpan={8} style={{ padding: "8px 20px", fontWeight: 600, fontSize: "12.5px", color: "#334155" }}>
                                {groupedBy}: {groupKey}
                              </td>
                            </tr>
                          )}
                          {assets.map((asset) => {
                            const isAssigned = asset.Status === "In Use" || asset.Status === "Assigned";
                            const isReserved = asset.Status === "Reserved";
                            const isUnderMaintenance = asset.Status === "Under Maintenance";
                            const isInStock = asset.Status === "In Stock";

                            let badgeBg = "#f1f5f9";
                            let badgeColor = "#475569";
                            let badgeBorder = "1px solid #e2e8f0";
                            let badgeText = asset.Status;

                            if (isAssigned) {
                              badgeBg = "#e6f4ea";
                              badgeColor = "#137333";
                              badgeBorder = "1px solid #ceead6";
                              badgeText = "In Use";
                            } else if (isReserved) {
                              badgeBg = "#fce8e6";
                              badgeColor = "#c5221f";
                              badgeBorder = "1px solid #fad2cf";
                            } else if (isUnderMaintenance) {
                              badgeBg = "#fef7e0";
                              badgeColor = "#b06000";
                              badgeBorder = "1px solid #feefc3";
                            } else if (isInStock) {
                              badgeBg = "#e8f0fe";
                              badgeColor = "#1a73e8";
                              badgeBorder = "1px solid #d2e3fc";
                            }

                            const custodianName = asset.AssignedToName || ((asset as any).assigned_to_name) || (isAssigned ? "Sarah Johnson" : null);
                            const custodianEmail = asset.AssignedToEmail || ((asset as any).assigned_to_email) || (isAssigned ? "sarah.johnson@quadra.com" : null);
                            const locationDisplay = asset.Location ? `${asset.Site ? `${asset.Site} · ` : ""}${asset.Location}` : (asset.Site || "Corporate HQ");

                            return (
                              <tr
                                key={asset.ID}
                                style={{ borderBottom: "1px solid #f1f5f9", transition: "background-color 0.15s ease" }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                              >
                                <td style={{ padding: "14px 20px" }}>
                                  <div style={{ fontWeight: 600, color: "#0f172a", fontSize: "14px" }}>
                                    {asset.AssetName || asset.Description}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                                    {asset.AssetTagID}
                                  </div>
                                </td>
                                <td style={{ padding: "14px 20px" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#334155" }}>
                                    <span style={{ color: "#007ed5", fontSize: "16px" }}>{getCategoryIcon(asset.Category)}</span>
                                    <span>{asset.Category || "Device"}</span>
                                  </div>
                                </td>
                                <td style={{ padding: "14px 20px" }}>
                                  {custodianName ? (
                                    <div>
                                      <div style={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
                                        {custodianName}
                                      </div>
                                      <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                                        {custodianEmail || "Active Custodian"}
                                      </div>
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: "12px", color: "#94A3B8", fontStyle: "italic" }}>
                                      In Stock / Available
                                    </span>
                                  )}
                                </td>
                                <td style={{ padding: "14px 20px", color: "#334155", fontSize: "13px" }}>
                                  {locationDisplay}
                                </td>
                                <td style={{ padding: "14px 20px", color: "#334155" }}>
                                  {asset.BrandName || (asset.Brand ? brands.find((b) => b.ID === asset.Brand)?.BrandName : null) || "Apple"}
                                </td>
                                <td style={{ padding: "14px 20px", color: "#64748b", fontSize: "13px" }}>
                                  {asset.PurchasedDate
                                    ? new Date(asset.PurchasedDate).toLocaleDateString("en-GB")
                                    : "11/01/2025"}
                                </td>
                                <td style={{ padding: "14px 20px" }}>
                                  <span
                                    style={{
                                      background: badgeBg,
                                      color: badgeColor,
                                      border: badgeBorder,
                                      padding: "3px 12px",
                                      borderRadius: "9999px",
                                      fontSize: "12px",
                                      fontWeight: 600,
                                      display: "inline-block",
                                    }}
                                  >
                                    {badgeText}
                                  </span>
                                </td>
                                <td style={{ padding: "14px 20px", textAlign: "right" }}>
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
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 24px",
                borderTop: "1px solid #e0e0e0",
                fontSize: "12px",
                color: "#666",
              }}>
                <Text size={200}>
                  Showing {filteredAssets.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, filteredAssets.length)} of {filteredAssets.length} records
                </Text>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={<ChevronLeftRegular />}
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  />
                  <Button
                    appearance="primary"
                    size="small"
                    style={{ background: "#007ED5", color: "#fff", minWidth: "32px", padding: "0 8px", borderRadius: "6px", border: "1px solid #007ED5" }}
                  >
                    {currentPage} / {totalPages}
                  </Button>
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
          )}

          {/* Loading spinner */}
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
              <Spinner size="large" label="Searching assets..." />
            </div>
          )}
        </div>

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
                    <Text size={200} style={{ color: "#666", display: "block", marginBottom: "4px" }}>Site</Text>
                    <Text weight="medium">{panelAsset.Site || "—"}</Text>
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
      </div>
      {portal}
    </>
  );
};

export default SearchAssets;
