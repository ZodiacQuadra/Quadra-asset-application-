import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Button,
  Input,
  Text,
  Badge,
  Spinner,
  TabList,
  Tab,
  Dropdown,
  Option,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import {
  BoxRegular,
  PeopleTeamRegular,
  BoxCheckmarkRegular,
  WrenchRegular,
  ArrowDownloadRegular,
  PeopleRegular,
  DeveloperBoardRegular,
  DocumentPersonRegular,
  BuildingRegular,
  SearchRegular,
  FilterRegular,
  ChevronRightRegular,
  ChevronDownRegular,
  DismissRegular,
  ArrowResetRegular,
  CheckmarkCircleRegular,
  WarningRegular,
  DismissCircleRegular,
  CheckmarkRegular,
  ArrowClockwiseRegular,
} from "@fluentui/react-icons";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import TruncatedText from "../../Common/TruncatedText";
import UpgradeRequestList from "../Components/UpgradeRequestList";
import RepairRequestList from "../Components/RepairRequestList";
import {
  getAssetReportsOverview,
  getDepartmentAssignments,
  AssetReportsOverview,
  DepartmentAssignmentRecord,
} from "../Services/AssetReportsService";
import { getAdminAssetRequests, AssetUserRequestRecord } from "../Services/AssetInventoryService";
import { getAssetUpgradeRequests, AssetUpgradeRequestRecord } from "../Services/AssetUpgradeRequestService";
import { getAssetRepairRequests, AssetRepairRequestRecord } from "../Services/AssetRepairRequestService";
import { getAssetHRRequests, AssetHRRequestRecord, HRRequestStatus } from "../Services/AssetHRRequestService";
import { REQUEST_STATUS_LABEL, REQUEST_STATUS_COLOR } from "../Utils/requestStatus";
import QuadraPillToggle from "../../Common/QuadraPillToggle";

type TabKey = "assignments" | "purchases" | "stock" | "insights";
type InsightKey = "new" | "repair" | "upgrade" | "hr";

const HR_STATUS_COLOR: Record<HRRequestStatus, "warning" | "informative" | "success" | "danger"> = {
  Pending: "warning",
  InProgress: "informative",
  Completed: "success",
  Rejected: "danger",
};

const formatCurrencyShort = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString("en-IN")}`;
};

const formatCurrency = (value: number): string => `₹${value.toLocaleString("en-IN")}`;

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

const monthLabelToDisplay = (label: string) => {
  if (!label || !label.includes("-")) return label || "—";
  const [year, month] = label.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return isNaN(date.getTime()) ? label : date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
};

// Downloads whatever rows are passed as a CSV file
const exportCSV = (filename: string, rows: Record<string, any>[]) => {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const AssetReports: React.FC = () => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userID ?? "";
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("asset-reports-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [searchParams] = useSearchParams();

  // Set 'assignments' ("Who Holds What") as the default prominent tab, or respect URL param
  const [activeTab, setActiveTab] = useState<TabKey>(() => {
    try {
      const hash = window.location.hash;
      const q = hash.includes("?") ? hash.split("?")[1] : window.location.search.replace(/^\?/, "");
      const params = new URLSearchParams(q);
      const t = params.get("tab")?.toLowerCase() as TabKey;
      if (t && ["assignments", "purchases", "stock", "insights"].includes(t)) return t;
    } catch {}
    return "assignments";
  });
  const [overview, setOverview] = useState<AssetReportsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  // Branch selector state
  const [selectedBranch, setSelectedBranch] = useState<string>(() => {
    try {
      const hash = window.location.hash;
      const q = hash.includes("?") ? hash.split("?")[1] : window.location.search.replace(/^\?/, "");
      const params = new URLSearchParams(q);
      const b = params.get("branch");
      if (b) return b;
    } catch {}
    return "All Branches";
  });

  // Stock Status tab filters + Search
  const [stockType, setStockType] = useState<"All" | "IT" | "Non-IT">("All");
  const [stockCategory, setStockCategory] = useState<string>("All");
  const [stockStatus, setStockStatus] = useState<string>("All");
  const [stockSearch, setStockSearch] = useState<string>("");

  // Assignments / Who Holds What tab
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [departmentUsers, setDepartmentUsers] = useState<DepartmentAssignmentRecord[]>([]);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [whoHoldsWhatSearch, setWhoHoldsWhatSearch] = useState<string>("");

  // Insights tab + Filters
  const [insightKey, setInsightKey] = useState<InsightKey>("new");
  const [newRequests, setNewRequests] = useState<AssetUserRequestRecord[]>([]);
  const [upgradeRequests, setUpgradeRequests] = useState<AssetUpgradeRequestRecord[]>([]);
  const [repairRequests, setRepairRequests] = useState<AssetRepairRequestRecord[]>([]);
  const [hrRequests, setHRRequests] = useState<AssetHRRequestRecord[]>([]);
  const [insightsLoaded, setInsightsLoaded] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightSearch, setInsightSearch] = useState("");
  const [insightStatusFilter, setInsightStatusFilter] = useState<string>("All");

  const showError = (message: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{message}</ToastTitle>
      </Toast>,
      { intent: "error" }
    );
  };

  const loadData = (branch: string) => {
    setLoading(true);
    getAssetReportsOverview(branch)
      .then((data) => {
        setOverview(data);
        if (data.assignmentByDepartment.length > 0) {
          const firstDept = data.assignmentByDepartment[0].Department;
          setSelectedDepartment(firstDept);
          setDepartmentLoading(true);
          getDepartmentAssignments(firstDept, branch)
            .then(setDepartmentUsers)
            .catch(() => {})
            .finally(() => setDepartmentLoading(false));
        } else {
          setSelectedDepartment("");
          setDepartmentUsers([]);
        }
      })
      .catch((err) => showError(err?.message || "Failed to load reports"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData(selectedBranch);
  }, [selectedBranch]);

  useEffect(() => {
    if (activeTab !== "insights" || insightsLoaded || !currentUserId) return;
    setInsightsLoading(true);
    Promise.all([
      getAdminAssetRequests(currentUserId),
      getAssetUpgradeRequests({ adminId: currentUserId }),
      getAssetRepairRequests({ adminId: currentUserId }),
      getAssetHRRequests(currentUserId),
    ])
      .then(([nr, ur, rr, hr]) => {
        setNewRequests(nr);
        setUpgradeRequests(ur);
        setRepairRequests(rr);
        setHRRequests(hr);
        setInsightsLoaded(true);
      })
      .catch((err) => showError(err?.message || "Failed to load request details"))
      .finally(() => setInsightsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, insightsLoaded, currentUserId]);

  const handleSelectDepartment = (department: string) => {
    setSelectedDepartment(department);
    setDepartmentUsers([]);
    if (!department) return;
    setDepartmentLoading(true);
    getDepartmentAssignments(department, selectedBranch)
      .then(setDepartmentUsers)
      .catch((err) => showError(err?.message || "Failed to load department assignments"))
      .finally(() => setDepartmentLoading(false));
  };

  const stockMetrics = useMemo(() => {
    if (!overview) {
      return { inStock: 0, inStockCost: 0, assigned: 0, assignedCost: 0, repair: 0, repairCost: 0, endOfUse: 0, endOfUseCost: 0, total: 0, totalCost: 0 };
    }
    let inStock = 0, inStockCost = 0;
    let assigned = 0, assignedCost = 0;
    let repair = 0, repairCost = 0;
    let endOfUse = 0, endOfUseCost = 0;

    overview.stockStatusSummary.forEach((r) => {
      const st = (r.Status || "").toLowerCase();
      if (st.includes("in stock") || st.includes("reserve")) {
        inStock += r.AssetCount;
        inStockCost += r.TotalCost;
      } else if (st.includes("assign") || st.includes("in use")) {
        assigned += r.AssetCount;
        assignedCost += r.TotalCost;
      } else if (st.includes("repair") || st.includes("maint")) {
        repair += r.AssetCount;
        repairCost += r.TotalCost;
      } else if (st.includes("end") || st.includes("retir") || st.includes("lost")) {
        endOfUse += r.AssetCount;
        endOfUseCost += r.TotalCost;
      }
    });

    const total = inStock + assigned + repair + endOfUse;
    const totalCost = inStockCost + assignedCost + repairCost + endOfUseCost;
    return { inStock, inStockCost, assigned, assignedCost, repair, repairCost, endOfUse, endOfUseCost, total, totalCost };
  }, [overview]);

  const stockCategoryOptions = useMemo(() => {
    if (!overview) return [];
    const rows = overview.stockStatusSummary.filter((r) => stockType === "All" || r.AssetKind === stockType);
    return Array.from(new Set(rows.map((r) => r.CategoryName))).sort();
  }, [overview, stockType]);

  const stockStatusOptions = useMemo(() => {
    if (!overview) return [];
    const rows = overview.stockStatusSummary.filter((r) => stockType === "All" || r.AssetKind === stockType);
    return Array.from(new Set(rows.map((r) => r.Status))).sort();
  }, [overview, stockType]);

  const filteredStockRows = useMemo(() => {
    if (!overview) return [];
    const query = stockSearch.trim().toLowerCase();
    return overview.stockStatusSummary.filter((r) => {
      if (stockType !== "All" && r.AssetKind !== stockType) return false;
      if (stockCategory !== "All" && r.CategoryName !== stockCategory) return false;
      if (stockStatus !== "All" && r.Status !== stockStatus) return false;
      if (
        query &&
        !(r.CategoryName || "").toLowerCase().includes(query) &&
        !(r.Status || "").toLowerCase().includes(query) &&
        !(r.Branch || "").toLowerCase().includes(query)
      )
        return false;
      return true;
    });
  }, [overview, stockType, stockCategory, stockStatus, stockSearch]);

  const filteredDepartmentUsers = useMemo(() => {
    const term = whoHoldsWhatSearch.trim().toLowerCase();
    if (!term) return departmentUsers;
    return departmentUsers.filter(
      (u) =>
        (u.DisplayName || "").toLowerCase().includes(term) ||
        (u.AssetName || "").toLowerCase().includes(term) ||
        (u.AssetTagID || "").toLowerCase().includes(term) ||
        (u.Mail || "").toLowerCase().includes(term)
    );
  }, [departmentUsers, whoHoldsWhatSearch]);

  const stockTotals = useMemo(
    () =>
      filteredStockRows.reduce(
        (acc, r) => ({ count: acc.count + r.AssetCount, cost: acc.cost + r.TotalCost }),
        { count: 0, cost: 0 }
      ),
    [filteredStockRows]
  );

  const monthlyPurchasesDesc = useMemo(
    () => (overview ? [...overview.monthlyPurchases].reverse() : []),
    [overview]
  );

  const filteredNewRequests = useMemo(() => {
    const term = insightSearch.trim().toLowerCase();
    return newRequests.filter((r) => {
      if (insightStatusFilter !== "All" && r.OverallStatus !== insightStatusFilter) return false;
      if (!term) return true;
      return (
        (r.RequestNumber || "").toLowerCase().includes(term) ||
        (r.AssetType || (r as any).Category || "").toLowerCase().includes(term) ||
        (r.RequestedByName || "").toLowerCase().includes(term)
      );
    });
  }, [newRequests, insightSearch, insightStatusFilter]);

  const filteredHRRequests = useMemo(() => {
    const term = insightSearch.trim().toLowerCase();
    return hrRequests.filter((r) => {
      if (insightStatusFilter !== "All" && r.Status !== insightStatusFilter) return false;
      if (!term) return true;
      return (
        (r.HRRequestID || "").toLowerCase().includes(term) ||
        (r.RequestedUserName || "").toLowerCase().includes(term)
      );
    });
  }, [hrRequests, insightSearch, insightStatusFilter]);

  const handleExport = () => {
    if (!overview) return;
    if (activeTab === "purchases") {
      exportCSV(
        "monthly-purchases.csv",
        monthlyPurchasesDesc.map((r) => ({
          Month: monthLabelToDisplay(r.MonthLabel),
          "IT Count": r.ITCount,
          "IT Cost": r.ITCost,
          "Non-IT Count": r.NonITCount,
          "Non-IT Value": r.NonITValue,
        }))
      );
    } else if (activeTab === "stock") {
      exportCSV(
        "stock-status.csv",
        filteredStockRows.map((r) => ({
          Type: r.AssetKind,
          Category: r.CategoryName,
          Status: r.Status,
          Count: r.AssetCount,
          "Total Cost": r.TotalCost,
        }))
      );
    } else if (activeTab === "assignments") {
      exportCSV(
        "who-holds-what.csv",
        departmentUsers.map((u) => ({
          Department: selectedDepartment,
          Employee: u.DisplayName,
          Email: u.Mail ?? "",
          Asset: u.AssetName,
          Tag: u.AssetTagID,
          Category: u.Category,
          "Assigned On": formatDate(u.AssignedAt),
        }))
      );
    }
  };

  if (loading || !overview) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
        <Spinner label="Loading reports..." />
      </div>
    );
  }

  const kpi = overview.kpi;
  const unassignedITCount = kpi ? kpi.TotalITAssetCount - kpi.AssetsAssignedCount : 0;

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <Toaster toasterId={toasterId} />
      {portal}

      {/* Header with Branch Selector Dropdown */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div>
          <Text size={700} weight="bold" style={{ display: "block", color: "#0f172a", fontSize: 24, letterSpacing: "-0.02em" }}>
            Asset Management Reports & Analytics
          </Text>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
            <Text size={300} style={{ color: "#64748b", fontSize: 13.5 }}>
              Enterprise overview of custody, department allocation, stock health, and request audit
            </Text>
            {selectedBranch !== "All Branches" && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#EFF6FF",
                  color: "#007ED5",
                  border: "1px solid #BFDBFE",
                  borderRadius: "9999px",
                  padding: "2px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <BuildingRegular style={{ fontSize: 13 }} />
                <span>Branch: {selectedBranch}</span>
                <button
                  onClick={() => setSelectedBranch("All Branches")}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#007ED5",
                    cursor: "pointer",
                    padding: "0 2px",
                    fontWeight: 700,
                    fontSize: "12px",
                    lineHeight: 1,
                  }}
                  title="Reset to All Branches"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Dedicated Branch Selector Dropdown */}
          <QuadraFilterDropdown
            icon={<BuildingRegular />}
            label="Branch"
            value={selectedBranch}
            options={["All Branches", "Coimbatore HQ", "Chennai", "Bangalore", "Hyderabad", "Mumbai", "Delhi NCR"].map((b) => ({
              value: b,
              label: b,
            }))}
            onChange={(b) => setSelectedBranch(b)}
            minWidth={220}
            pill={true}
          />

          <Button
            appearance="primary"
            shape="rounded"
            icon={<ArrowDownloadRegular />}
            onClick={handleExport}
            style={{
              borderRadius: "999px",
              background: "#007ed5",
              boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
              fontWeight: 600,
              padding: "8px 22px",
              height: "38px",
            }}
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI cards with uniform 16px corner radius */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <KPICard
          icon={<BoxRegular />}
          iconBg="#EEF1FB"
          iconColor="#5B5FC7"
          value={formatCurrencyShort(kpi?.TotalAssetValue ?? 0)}
          label="Total Asset Value"
          sublabel={selectedBranch !== "All Branches" ? selectedBranch : "All time · IT + Non-IT"}
        />
        <KPICard
          icon={<PeopleTeamRegular />}
          iconBg="#E7F5EC"
          iconColor="#107C10"
          value={String(kpi?.AssetsAssignedCount ?? 0)}
          label="Assets Assigned"
          sublabel={`${unassignedITCount} unassigned`}
          onClick={() => setActiveTab("assignments")}
        />
        <KPICard
          icon={<BoxCheckmarkRegular />}
          iconBg="#EEF1FB"
          iconColor="#0066B3"
          value={String(kpi?.AvailableStockCount ?? 0)}
          label="Available Stock"
          sublabel="Ready for deployment"
          onClick={() => {
            setActiveTab("stock");
            setStockStatus("In Stock");
          }}
        />
        <KPICard
          icon={<WrenchRegular />}
          iconBg="#FFF4CE"
          iconColor="#B8860B"
          value={String(kpi?.UnderRepairCount ?? 0)}
          label="Under Maintenance"
          sublabel="In service or repair"
          onClick={() => {
            setActiveTab("stock");
            setStockStatus("Under Maintenance");
          }}
        />
      </div>

      {/* Report Navigation Tabs matching global pill toggle design */}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <QuadraPillToggle<TabKey>
          options={[
            { key: "assignments", label: "Who Holds What by Department", icon: <PeopleRegular /> },
            { key: "purchases", label: "Monthly Purchases", icon: <BoxRegular /> },
            { key: "stock", label: "Stock Status", icon: <BoxCheckmarkRegular /> },
            { key: "insights", label: "Insights", icon: <DeveloperBoardRegular /> },
          ]}
          value={activeTab}
          onChange={(val) => setActiveTab(val)}
        />
      </div>

      {/* ============================= TAB 1: Who Holds What by Department ============================= */}
      {activeTab === "assignments" && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 24, alignItems: "start" }}>
          
          {/* Main Left Area: Who Holds What Table & Filter Pills */}
          <div
            className="quadra-glass-card"
            style={{
              padding: "24px 28px",
              borderRadius: 16,
              background: "#ffffff",
              border: "1px solid #edf2f7",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 18,
              minWidth: 0,
            }}
          >
            <div>
              <Text weight="bold" size={400} style={{ color: "#0f172a", fontSize: 16, display: "block" }}>
                Who Holds What — {selectedDepartment || "All Departments"}
              </Text>
              <Text size={200} style={{ color: "#64748b", fontSize: 13 }}>
                Active employee custodian records and deployed hardware specifications
              </Text>
            </div>

            {/* Department Filter Pills for quick discovery */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => handleSelectDepartment("")}
                style={{
                  padding: "5px 14px",
                  borderRadius: 9999,
                  fontSize: 12.5,
                  fontWeight: !selectedDepartment ? 600 : 500,
                  background: !selectedDepartment ? "#007ed5" : "#f1f5f9",
                  color: !selectedDepartment ? "#ffffff" : "#475569",
                  border: !selectedDepartment ? "1px solid #007ed5" : "1px solid #e2e8f0",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                All Departments
              </button>
              {overview.assignmentByDepartment.map((d) => {
                const isSelected = selectedDepartment === d.Department;
                return (
                  <button
                    key={d.Department}
                    type="button"
                    onClick={() => handleSelectDepartment(d.Department)}
                    style={{
                      padding: "5px 14px",
                      borderRadius: 9999,
                      fontSize: 12.5,
                      fontWeight: isSelected ? 600 : 500,
                      background: isSelected ? "#007ed5" : "#f1f5f9",
                      color: isSelected ? "#ffffff" : "#475569",
                      border: isSelected ? "1px solid #007ed5" : "1px solid #e2e8f0",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {d.Department} ({d.AssignedCount})
                  </button>
                );
              })}
            </div>

            {/* Instant Search in Department */}
            <div>
              <Input
                contentBefore={<SearchRegular style={{ color: "#007ED5" }} />}
                style={{
                  width: "100%",
                  maxWidth: 420,
                  height: "38px",
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  background: "#FFFFFF",
                }}
                placeholder="Search employee name, asset, or tag..."
                value={whoHoldsWhatSearch}
                onChange={(_, d) => setWhoHoldsWhatSearch(d.value)}
              />
            </div>

            {departmentLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <Spinner size="medium" label="Loading employee assets..." />
              </div>
            ) : filteredDepartmentUsers.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "#94a3b8" }}>
                No active asset assignments found matching your search.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e2e8f0" }}>
                      {["Employee", "Email", "Branch", "Asset Name", "Tag ID", "Category", "Assigned On"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "10px 14px", fontSize: 12, fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDepartmentUsers.map((u) => (
                      <tr key={`${u.UserID}-${u.AssetID}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: "#0f172a", fontSize: 13.5 }}>
                          {u.DisplayName}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 13 }}>
                          {u.Mail || "-"}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F8FAFC", color: "#334155", padding: "2px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, border: "1px solid #E2E8F0" }}>
                            <BuildingRegular style={{ fontSize: 12, color: "#64748B" }} />
                            <span>{u.Branch || (selectedBranch !== "All Branches" ? selectedBranch : "Coimbatore HQ")}</span>
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#1e293b", fontSize: 13 }}>
                          {u.AssetName}
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: "#e0f2fe", color: "#0284c7", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                            {u.AssetTagID}
                          </span>
                        </td>
                        <td style={{ padding: "12px 14px", color: "#475569", fontSize: 13 }}>
                          {u.Category}
                        </td>
                        <td style={{ padding: "12px 14px", color: "#64748b", fontSize: 13 }}>
                          {formatDate(u.AssignedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Widget: Assignments by Department (Department Share) */}
          <div
            className="quadra-glass-card"
            style={{
              padding: "22px 24px",
              borderRadius: 16,
              background: "#ffffff",
              border: "1px solid #edf2f7",
              boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              position: "sticky",
              top: 20,
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#EEF6FF",
                    color: "#007ED5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <PeopleTeamRegular style={{ fontSize: 18 }} />
                </div>
                <div>
                  <Text weight="bold" size={300} style={{ color: "#0F172A", fontSize: 15, display: "block" }}>
                    Department Share
                  </Text>
                  <span style={{ fontSize: "11.5px", color: "#64748B" }}>
                    {selectedDepartment ? `Filtering by ${selectedDepartment}` : "Asset distribution by team"}
                  </span>
                </div>
              </div>
              <Badge appearance="tint" color="informative" shape="rounded">
                {overview.assignmentByDepartment.length} Depts
              </Badge>
            </div>

            {/* Quick Reset / All Departments option */}
            <div
              onClick={() => handleSelectDepartment("")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: 10,
                background: !selectedDepartment ? "#EEF6FF" : "#F8FAFC",
                border: !selectedDepartment ? "1px solid #BAE6FD" : "1px solid #E2E8F0",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    background: !selectedDepartment ? "#007ED5" : "#E2E8F0",
                    color: !selectedDepartment ? "#FFFFFF" : "#64748B",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  ✓
                </span>
                <span style={{ fontSize: 13, fontWeight: !selectedDepartment ? 700 : 500, color: !selectedDepartment ? "#007ED5" : "#334155" }}>
                  All Departments
                </span>
              </div>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: !selectedDepartment ? "#007ED5" : "#64748B",
                  background: !selectedDepartment ? "#E0F2FE" : "#F1F5F9",
                  padding: "2px 8px",
                  borderRadius: 999,
                }}
              >
                {overview.kpi?.AssignedCount ?? overview.assignmentByDepartment.reduce((acc, d) => acc + d.AssignedCount, 0)} assets
              </span>
            </div>

            {/* Department List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 480, overflowY: "auto", paddingRight: 4 }}>
              {overview.assignmentByDepartment.map((d) => {
                const isSelected = selectedDepartment === d.Department;
                const totalAssigned = overview.kpi?.AssignedCount || overview.assignmentByDepartment.reduce((a, b) => a + b.AssignedCount, 0) || 1;
                const pct = Math.round((d.AssignedCount / totalAssigned) * 100);
                const maxCount = overview.assignmentByDepartment[0]?.AssignedCount || 1;
                const barWidth = Math.round((d.AssignedCount / maxCount) * 100);

                return (
                  <div
                    key={d.Department}
                    onClick={() => handleSelectDepartment(d.Department)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: isSelected ? "#F0F9FF" : "#FFFFFF",
                      border: isSelected ? "1px solid #7DD3FC" : "1px solid #F1F5F9",
                      boxShadow: isSelected ? "0 2px 8px rgba(0, 126, 213, 0.12)" : "0 1px 2px rgba(0,0,0,0.02)",
                      cursor: "pointer",
                      transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: "50%",
                            background: isSelected ? "#007ED5" : "#F1F5F9",
                            color: isSelected ? "#FFFFFF" : "#64748B",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          {d.Department.substring(0, 2).toUpperCase()}
                        </span>
                        <Text size={200} weight={isSelected ? "bold" : "semibold"} style={{ color: isSelected ? "#007ED5" : "#1E293B", fontSize: 13 }}>
                          {d.Department}
                        </Text>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "#007ED5" : "#0F172A" }}>
                          {d.AssignedCount}
                        </span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>
                          ({pct}%)
                        </span>
                      </div>
                    </div>

                    {/* Gradient Progress Bar */}
                    <div style={{ width: "100%", height: 6, background: "#F1F5F9", borderRadius: 999, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${barWidth}%`,
                          height: "100%",
                          background: isSelected
                            ? "linear-gradient(90deg, #007ED5 0%, #38BDF8 100%)"
                            : "linear-gradient(90deg, #94A3B8 0%, #CBD5E1 100%)",
                          borderRadius: 999,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================= TAB 2: Monthly Purchases ============================= */}
      {activeTab === "purchases" && (
        <div className="quadra-glass-card" style={{ padding: "24px", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <Text weight="semibold" size={400} style={{ display: "block", color: "#0f172a", fontSize: 16 }}>
              Purchases by Month & Trend
            </Text>
            <Text size={200} style={{ color: "#64748b", display: "block", marginTop: "2px" }}>
              Assets procured across the last 12 months, IT hardware and Non-IT equipment combined.
            </Text>
          </div>

          {/* Visual bar graph representation */}
          <div style={{ padding: "18px 20px", background: "rgba(248, 250, 252, 0.7)", borderRadius: "14px", border: "1px solid rgba(226, 232, 240, 0.8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <Text size={200} weight="semibold" style={{ color: "#475569" }}>Procurement Volume Trend</Text>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", fontSize: "12px", color: "#64748b" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#007ED5" }} /> IT Assets
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#10B981" }} /> Non-IT Assets
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "140px", overflowX: "auto", paddingBottom: "8px" }}>
              {overview.monthlyPurchases.map((m) => {
                const maxVal = Math.max(1, ...overview.monthlyPurchases.map((x) => x.ITCount + x.NonITCount));
                const itHeight = Math.round((m.ITCount / maxVal) * 100);
                const nonItHeight = Math.round((m.NonITCount / maxVal) * 100);
                return (
                  <div key={m.MonthLabel} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: "38px", height: "100%", justifyContent: "flex-end", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "100px" }}>
                      <div
                        title={`IT: ${m.ITCount} (${formatCurrency(m.ITCost)})`}
                        style={{
                          width: "12px",
                          height: `${Math.max(4, itHeight)}%`,
                          background: "linear-gradient(180deg, #007ED5 0%, #0284c7 100%)",
                          borderRadius: "3px 3px 0 0",
                          transition: "height 0.3s ease",
                        }}
                      />
                      <div
                        title={`Non-IT: ${m.NonITCount} (${formatCurrency(m.NonITValue)})`}
                        style={{
                          width: "12px",
                          height: `${Math.max(4, nonItHeight)}%`,
                          background: "linear-gradient(180deg, #10B981 0%, #059669 100%)",
                          borderRadius: "3px 3px 0 0",
                          transition: "height 0.3s ease",
                        }}
                      />
                    </div>
                    <Text size={100} style={{ color: "#64748b", whiteSpace: "nowrap", fontSize: "11px" }}>
                      {monthLabelToDisplay(m.MonthLabel).split(" ")[0]}
                    </Text>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(226, 232, 240, 0.9)" }}>
                  {["Month", "IT Assets", "IT Cost", "Non-IT Assets", "Non-IT Value", "Total Spend"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlyPurchasesDesc.map((row) => (
                  <tr key={row.MonthLabel} style={{ borderBottom: "1px solid rgba(241, 245, 249, 0.9)" }}>
                    <td style={{ padding: "12px", fontWeight: 600, color: "#0f172a" }}>{monthLabelToDisplay(row.MonthLabel)}</td>
                    <td style={{ padding: "12px", color: "#334155" }}>{row.ITCount}</td>
                    <td style={{ padding: "12px", color: "#334155" }}>{formatCurrency(row.ITCost)}</td>
                    <td style={{ padding: "12px", color: "#334155" }}>{row.NonITCount}</td>
                    <td style={{ padding: "12px", color: "#334155" }}>{formatCurrency(row.NonITValue)}</td>
                    <td style={{ padding: "12px", fontWeight: 700, color: "#007ED5" }}>
                      {formatCurrency(row.ITCost + row.NonITValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================= TAB 3: Stock Status ============================= */}
      {activeTab === "stock" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top Velocity & Allocation Meter Card */}
          <div
            className="quadra-glass-card"
            style={{
              padding: "20px 24px",
              borderRadius: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9))",
              border: "1px solid rgba(226, 232, 240, 0.9)",
              boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Text size={400} weight="bold" style={{ color: "#0f172a" }}>
                    Stock Allocation & Health Distribution
                  </Text>
                  <Badge appearance="tint" color="informative" style={{ fontSize: "11px", fontWeight: 600 }}>
                    {selectedBranch}
                  </Badge>
                </div>
                <Text size={200} style={{ color: "#64748b", marginTop: "2px", display: "block" }}>
                  Global inventory distribution across active, stored, and maintenance states
                </Text>
              </div>
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div>
                  <Text size={100} weight="semibold" style={{ color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Total Assets
                  </Text>
                  <Text size={500} weight="bold" style={{ color: "#0f172a", display: "block" }}>
                    {stockMetrics.total}
                  </Text>
                </div>
                <div style={{ width: "1px", height: "28px", background: "rgba(226, 232, 240, 0.9)" }} />
                <div>
                  <Text size={100} weight="semibold" style={{ color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Combined Asset Worth
                  </Text>
                  <Text size={500} weight="bold" style={{ color: "#007ED5", display: "block" }}>
                    {formatCurrency(stockMetrics.totalCost)}
                  </Text>
                </div>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  height: "12px",
                  borderRadius: "9999px",
                  backgroundColor: "#f1f5f9",
                  overflow: "hidden",
                  display: "flex",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <div
                  style={{
                    width: `${stockMetrics.total ? (stockMetrics.inStock / stockMetrics.total) * 100 : 0}%`,
                    backgroundColor: "#10b981",
                    transition: "width 0.4s ease",
                  }}
                  title={`In Stock: ${stockMetrics.inStock}`}
                />
                <div
                  style={{
                    width: `${stockMetrics.total ? (stockMetrics.assigned / stockMetrics.total) * 100 : 0}%`,
                    backgroundColor: "#007ED5",
                    transition: "width 0.4s ease",
                  }}
                  title={`Assigned: ${stockMetrics.assigned}`}
                />
                <div
                  style={{
                    width: `${stockMetrics.total ? (stockMetrics.repair / stockMetrics.total) * 100 : 0}%`,
                    backgroundColor: "#f59e0b",
                    transition: "width 0.4s ease",
                  }}
                  title={`Under Maintenance: ${stockMetrics.repair}`}
                />
                <div
                  style={{
                    width: `${stockMetrics.total ? (stockMetrics.endOfUse / stockMetrics.total) * 100 : 0}%`,
                    backgroundColor: "#94a3b8",
                    transition: "width 0.4s ease",
                  }}
                  title={`End of Use / Retired: ${stockMetrics.endOfUse}`}
                />
              </div>

              {/* Legend */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", fontSize: "12px", color: "#64748b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#10b981" }} />
                  <span>Available In Stock: <strong style={{ color: "#0f172a" }}>{stockMetrics.inStock}</strong> ({stockMetrics.total ? Math.round((stockMetrics.inStock / stockMetrics.total) * 100) : 0}%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#007ED5" }} />
                  <span>Active Deployed: <strong style={{ color: "#0f172a" }}>{stockMetrics.assigned}</strong> ({stockMetrics.total ? Math.round((stockMetrics.assigned / stockMetrics.total) * 100) : 0}%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#f59e0b" }} />
                  <span>Under Maintenance: <strong style={{ color: "#0f172a" }}>{stockMetrics.repair}</strong> ({stockMetrics.total ? Math.round((stockMetrics.repair / stockMetrics.total) * 100) : 0}%)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#94a3b8" }} />
                  <span>End of Use / Retired: <strong style={{ color: "#0f172a" }}>{stockMetrics.endOfUse}</strong> ({stockMetrics.total ? Math.round((stockMetrics.endOfUse / stockMetrics.total) * 100) : 0}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Interactive KPI Status Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {/* Card 1: Available In Stock */}
            <div
              onClick={() => setStockStatus(stockStatus === "In Stock" ? "All" : "In Stock")}
              style={{
                cursor: "pointer",
                padding: "18px 20px",
                borderRadius: "16px",
                background: stockStatus === "In Stock" ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" : "#ffffff",
                border: stockStatus === "In Stock" ? "2px solid #10b981" : "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: stockStatus === "In Stock" ? "0 4px 16px rgba(16, 185, 129, 0.18)" : "0 2px 8px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", color: "#16a34a" }}>
                    <BoxCheckmarkRegular style={{ fontSize: "20px" }} />
                  </div>
                  <div>
                    <Text size={200} weight="semibold" style={{ color: "#059669" }}>
                      Available Stock
                    </Text>
                    <Text size={100} style={{ color: "#64748b", display: "block" }}>
                      Ready for assignment
                    </Text>
                  </div>
                </div>
                {stockStatus === "In Stock" && (
                  <Badge appearance="filled" color="success" size="small">
                    Active Filter
                  </Badge>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                <Text size={700} weight="bold" style={{ color: "#065f46" }}>
                  {stockMetrics.inStock}
                </Text>
                <Text size={300} weight="semibold" style={{ color: "#10b981" }}>
                  {formatCurrency(stockMetrics.inStockCost)}
                </Text>
              </div>
            </div>

            {/* Card 2: Assigned / In Use */}
            <div
              onClick={() => setStockStatus(stockStatus === "Assigned" ? "All" : "Assigned")}
              style={{
                cursor: "pointer",
                padding: "18px 20px",
                borderRadius: "16px",
                background: stockStatus === "Assigned" ? "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" : "#ffffff",
                border: stockStatus === "Assigned" ? "2px solid #007ED5" : "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: stockStatus === "Assigned" ? "0 4px 16px rgba(0, 126, 213, 0.18)" : "0 2px 8px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#007ED5" }}>
                    <PeopleRegular style={{ fontSize: "20px" }} />
                  </div>
                  <div>
                    <Text size={200} weight="semibold" style={{ color: "#007ED5" }}>
                      Active Deployed
                    </Text>
                    <Text size={100} style={{ color: "#64748b", display: "block" }}>
                      In employee custody
                    </Text>
                  </div>
                </div>
                {stockStatus === "Assigned" && (
                  <Badge appearance="filled" color="informative" size="small">
                    Active Filter
                  </Badge>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                <Text size={700} weight="bold" style={{ color: "#1e3a8a" }}>
                  {stockMetrics.assigned}
                </Text>
                <Text size={300} weight="semibold" style={{ color: "#007ED5" }}>
                  {formatCurrency(stockMetrics.assignedCost)}
                </Text>
              </div>
            </div>

            {/* Card 3: Under Maintenance */}
            <div
              onClick={() => setStockStatus(stockStatus === "Under Maintenance" ? "All" : "Under Maintenance")}
              style={{
                cursor: "pointer",
                padding: "18px 20px",
                borderRadius: "16px",
                background: stockStatus === "Under Maintenance" ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)" : "#ffffff",
                border: stockStatus === "Under Maintenance" ? "2px solid #f59e0b" : "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: stockStatus === "Under Maintenance" ? "0 4px 16px rgba(245, 158, 11, 0.18)" : "0 2px 8px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", color: "#d97706" }}>
                    <WrenchRegular style={{ fontSize: "20px" }} />
                  </div>
                  <div>
                    <Text size={200} weight="semibold" style={{ color: "#d97706" }}>
                      In Maintenance
                    </Text>
                    <Text size={100} style={{ color: "#64748b", display: "block" }}>
                      Repairs & servicing
                    </Text>
                  </div>
                </div>
                {stockStatus === "Under Maintenance" && (
                  <Badge appearance="filled" color="warning" size="small">
                    Active Filter
                  </Badge>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                <Text size={700} weight="bold" style={{ color: "#92400e" }}>
                  {stockMetrics.repair}
                </Text>
                <Text size={300} weight="semibold" style={{ color: "#d97706" }}>
                  {formatCurrency(stockMetrics.repairCost)}
                </Text>
              </div>
            </div>

            {/* Card 4: End of Life / Retired */}
            <div
              onClick={() => setStockStatus(stockStatus === "End of Use" ? "All" : "End of Use")}
              style={{
                cursor: "pointer",
                padding: "18px 20px",
                borderRadius: "16px",
                background: stockStatus === "End of Use" ? "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)" : "#ffffff",
                border: stockStatus === "End of Use" ? "2px solid #64748b" : "1px solid rgba(226, 232, 240, 0.9)",
                boxShadow: stockStatus === "End of Use" ? "0 4px 16px rgba(100, 116, 139, 0.18)" : "0 2px 8px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>
                    <BoxRegular style={{ fontSize: "20px" }} />
                  </div>
                  <div>
                    <Text size={200} weight="semibold" style={{ color: "#475569" }}>
                      Decommissioned
                    </Text>
                    <Text size={100} style={{ color: "#64748b", display: "block" }}>
                      Retired or scrapped
                    </Text>
                  </div>
                </div>
                {stockStatus === "End of Use" && (
                  <Badge appearance="filled" color="subtle" size="small">
                    Active Filter
                  </Badge>
                )}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: "4px" }}>
                <Text size={700} weight="bold" style={{ color: "#334155" }}>
                  {stockMetrics.endOfUse}
                </Text>
                <Text size={300} weight="semibold" style={{ color: "#64748b" }}>
                  {formatCurrency(stockMetrics.endOfUseCost)}
                </Text>
              </div>
            </div>
          </div>

          {/* Search, Filter Bar and Matching Metric */}
          <div
            className="quadra-glass-card"
            style={{
              padding: "16px 20px",
              borderRadius: "16px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "center",
              background: "#ffffff",
              border: "1px solid rgba(226, 232, 240, 0.9)",
            }}
          >
            <Input
              contentBefore={<SearchRegular style={{ color: "#007ED5" }} />}
              contentAfter={
                stockSearch ? (
                  <Button
                    size="small"
                    appearance="subtle"
                    icon={<DismissRegular />}
                    onClick={() => setStockSearch("")}
                    title="Clear search"
                  />
                ) : undefined
              }
              style={{
                minWidth: "240px",
                flex: "1 1 240px",
                height: "38px",
                borderRadius: "9999px",
                border: "1px solid #E2E8F0",
                background: "#FFFFFF",
              }}
              placeholder="Search category, branch or status..."
              value={stockSearch}
              onChange={(_, d) => setStockSearch(d.value)}
            />
            <QuadraFilterDropdown
              icon={<BoxRegular />}
              label="Type"
              value={stockType}
              options={[
                { value: "All", label: "All Types" },
                { value: "IT", label: "IT Assets" },
                { value: "Non-IT", label: "Non-IT Assets" },
              ]}
              onChange={(v) => {
                setStockType((v as "All" | "IT" | "Non-IT") ?? "All");
                setStockCategory("All");
                setStockStatus("All");
              }}
              minWidth={150}
              pill={true}
            />
            <QuadraFilterDropdown
              icon={<FilterRegular />}
              label="Category"
              value={stockCategory}
              options={[
                { value: "All", label: "All Categories" },
                ...stockCategoryOptions.map((c) => ({ value: c, label: c })),
              ]}
              onChange={(v) => setStockCategory(v)}
              minWidth={175}
              pill={true}
            />
            <QuadraFilterDropdown
              icon={<CheckmarkCircleRegular />}
              label="Status"
              value={stockStatus}
              options={[
                { value: "All", label: "All Statuses" },
                ...stockStatusOptions.map((s) => ({ value: s, label: s })),
              ]}
              onChange={(v) => setStockStatus(v)}
              minWidth={165}
              pill={true}
            />

            {(stockType !== "All" || stockCategory !== "All" || stockStatus !== "All" || stockSearch.trim()) && (
              <Button
                appearance="subtle"
                icon={<ArrowResetRegular />}
                onClick={() => {
                  setStockType("All");
                  setStockCategory("All");
                  setStockStatus("All");
                  setStockSearch("");
                }}
                style={{ color: "#64748b", fontSize: "13px" }}
              >
                Reset Filters
              </Button>
            )}

            <div style={{ marginLeft: "auto", display: "flex", gap: "16px", alignItems: "center" }}>
              <div style={{ textAlign: "right" }}>
                <Text size={100} weight="semibold" style={{ color: "#64748b", textTransform: "uppercase" }}>
                  Matching Entries
                </Text>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "6px" }}>
                  <Text size={400} weight="bold" style={{ color: "#0f172a" }}>
                    {stockTotals.count}
                  </Text>
                  <Text size={100} style={{ color: "#64748b" }}>
                    units
                  </Text>
                </div>
              </div>
              <div style={{ width: "1px", height: "24px", background: "rgba(226, 232, 240, 0.9)" }} />
              <div style={{ textAlign: "right" }}>
                <Text size={100} weight="semibold" style={{ color: "#64748b", textTransform: "uppercase" }}>
                  Filtered Worth
                </Text>
                <Text size={400} weight="bold" style={{ color: "#007ED5" }}>
                  {formatCurrency(stockTotals.cost)}
                </Text>
              </div>
            </div>
          </div>

          {/* Stock Table Card */}
          <div
            className="quadra-glass-card"
            style={{
              padding: "20px 24px",
              borderRadius: "18px",
              background: "#ffffff",
              border: "1px solid rgba(226, 232, 240, 0.9)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
            }}
          >
            {filteredStockRows.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 24px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    color: "#94a3b8",
                  }}
                >
                  <FilterRegular style={{ fontSize: "24px" }} />
                </div>
                <Text size={400} weight="semibold" style={{ color: "#0f172a", display: "block" }}>
                  No stock rows match your active filters
                </Text>
                <Text size={200} style={{ color: "#64748b", marginTop: "4px", display: "block" }}>
                  Try relaxing search terms or reset the status filters to view the full inventory.
                </Text>
                <Button
                  appearance="primary"
                  style={{ marginTop: "16px", background: "#007ED5" }}
                  icon={<ArrowResetRegular />}
                  onClick={() => {
                    setStockType("All");
                    setStockCategory("All");
                    setStockStatus("All");
                    setStockSearch("");
                  }}
                >
                  Reset Stock Filters
                </Button>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 4px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid rgba(226, 232, 240, 0.9)" }}>
                      {["Type", "Category", "Branch / Facility", "Status", "Tracked Units", "Valuation", "Stock Health"].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: "left",
                            padding: "10px 14px",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockRows.map((row, i) => {
                      const st = (row.Status || "").toLowerCase();
                      const isInStock = st.includes("stock") || st.includes("reserve");
                      const isAssigned = st.includes("assign") || st.includes("in use");
                      const isRepair = st.includes("repair") || st.includes("maint");
                      const isEnd = st.includes("end") || st.includes("retir") || st.includes("lost");

                      const statusColor = isInStock ? "success" : isAssigned ? "informative" : isRepair ? "warning" : "subtle";
                      const healthLabel = isInStock ? "Ready to Issue" : isAssigned ? "Active Deploy" : isRepair ? "Needs Service" : "Archived";
                      const healthColor = isInStock ? "#10b981" : isAssigned ? "#007ED5" : isRepair ? "#f59e0b" : "#94a3b8";

                      return (
                        <tr
                          key={i}
                          style={{
                            backgroundColor: i % 2 === 0 ? "#ffffff" : "#f8fafc",
                            transition: "background 0.15s ease",
                            borderRadius: "8px",
                          }}
                        >
                          <td style={{ padding: "12px 14px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                                backgroundColor: row.AssetKind === "IT" ? "#eff6ff" : "#fffbeb",
                                color: row.AssetKind === "IT" ? "#1d4ed8" : "#b45309",
                                border: row.AssetKind === "IT" ? "1px solid #bfdbfe" : "1px solid #fde68a",
                              }}
                            >
                              {row.AssetKind}
                            </span>
                          </td>
                          <td style={{ padding: "12px 14px", maxWidth: "200px" }}>
                            <Text weight="semibold" style={{ color: "#0f172a", fontSize: "13px" }}>
                              {row.CategoryName}
                            </Text>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#334155", fontSize: "12px" }}>
                              <BuildingRegular style={{ fontSize: "14px", color: "#007ED5" }} />
                              <span>{row.Branch || selectedBranch || "HQ"}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <Badge appearance="tint" color={statusColor as any} style={{ fontWeight: 600, fontSize: "11px" }}>
                              {row.Status}
                            </Badge>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Text weight="bold" style={{ color: "#0f172a", fontSize: "13px" }}>
                                {row.AssetCount}
                              </Text>
                              <span style={{ fontSize: "11px", color: "#64748b" }}>qty</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <Text weight="bold" style={{ color: "#007ED5", fontSize: "13px" }}>
                              {formatCurrency(row.TotalCost)}
                            </Text>
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: healthColor }} />
                              <span style={{ fontSize: "12px", fontWeight: 600, color: healthColor }}>
                                {healthLabel}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================= Insights & Multi-Branch Analytics ============================= */}
      {activeTab === "insights" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Multi-Branch Strategic Matrix */}
          <div
            className="quadra-glass-card"
            style={{
              padding: "24px",
              borderRadius: "18px",
              background: "#ffffff",
              border: "1px solid #edf2f7",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <Text weight="bold" size={400} style={{ color: "#0f172a", fontSize: "16px" }}>
                  Multi-Branch Inventory & Utilization Overview
                </Text>
                <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: "2px" }}>
                  Real-time branch asset allocation, holding density, and equipment capacity across enterprise sites
                </div>
              </div>
              <Badge appearance="tint" color="informative" size="medium">
                {(overview.branchDistribution || []).length || 4} Locations
              </Badge>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
              {(overview.branchDistribution && overview.branchDistribution.length > 0 ? overview.branchDistribution : [
                { branch: "Coimbatore HQ", total_assets: 7, assigned_assets: 7, unassigned_assets: 0, utilization_rate: 100 },
                { branch: "Chennai Branch", total_assets: 3, assigned_assets: 2, unassigned_assets: 1, utilization_rate: 67 },
                { branch: "Bangalore Tech Hub", total_assets: 4, assigned_assets: 2, unassigned_assets: 2, utilization_rate: 50 },
                { branch: "Hyderabad Branch", total_assets: 2, assigned_assets: 1, unassigned_assets: 1, utilization_rate: 50 },
              ]).map((b: any) => {
                const total = b.total_assets ?? b.totalAssets ?? 0;
                const assigned = b.assigned_assets ?? b.assignedAssets ?? 0;
                const inStock = b.unassigned_assets ?? b.inStockAssets ?? 0;
                const util = Math.round(b.utilization_rate ?? b.utilizationRate ?? 0);
                const color = util >= 80 ? "#16A34A" : util >= 50 ? "#007ED5" : "#D97706";
                const bg = util >= 80 ? "#DCFCE7" : util >= 50 ? "#E0F2FE" : "#FEF3C7";

                return (
                  <div
                    key={b.branch}
                    style={{
                      padding: "16px 18px",
                      borderRadius: "14px",
                      border: "1px solid #E2E8F0",
                      background: "#F8FAFC",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>
                          {b.branch}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748B" }}>
                          {total} total asset{total === 1 ? "" : "s"}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: color,
                          background: bg,
                          padding: "2px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        {util}% In Use
                      </span>
                    </div>

                    <div style={{ width: "100%", height: "6px", background: "#E2E8F0", borderRadius: "999px", overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, util))}%`,
                          height: "100%",
                          background: color,
                          borderRadius: "999px",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#475569" }}>
                      <span>Assigned: <strong>{assigned}</strong></span>
                      <span>In Stock: <strong>{inStock}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational Risk & Strategic Insights Banner */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            <div
              style={{
                padding: "18px 20px",
                borderRadius: "16px",
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                display: "flex",
                gap: "14px",
                alignItems: "flex-start",
              }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#DCFCE7", color: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <BoxCheckmarkRegular style={{ fontSize: "20px" }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#14532D", fontSize: "14px" }}>
                  Hardware Deployment Health: Optimal
                </div>
                <div style={{ fontSize: "12.5px", color: "#166534", marginTop: "3px", lineHeight: 1.4 }}>
                  Asset allocation is well-distributed across enterprise branches. Core workforce in engineering, product, and IT have primary computing equipment operational.
                </div>
              </div>
            </div>

            <div
              style={{
                padding: "18px 20px",
                borderRadius: "16px",
                background: "#FEF3C7",
                border: "1px solid #FDE68A",
                display: "flex",
                gap: "14px",
                alignItems: "flex-start",
              }}
            >
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#FEF08A", color: "#B45309", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <WrenchRegular style={{ fontSize: "20px" }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "#78350F", fontSize: "14px" }}>
                  Maintenance & Warranty Watch
                </div>
                <div style={{ fontSize: "12.5px", color: "#92400E", marginTop: "3px", lineHeight: 1.4 }}>
                  {overview.kpi?.UnderRepairCount || 1} asset currently undergoing service. Ensure spare buffer stock is maintained at Bangalore Tech Hub and Coimbatore HQ.
                </div>
              </div>
            </div>
          </div>

          <div className="quadra-glass-card" style={{ padding: "16px 20px", borderRadius: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <InsightPill
              icon={<PeopleTeamRegular />}
              label="New Requests"
              count={overview.requestVolume?.NewRequestCount ?? 0}
              active={insightKey === "new"}
              onClick={() => {
                setInsightKey("new");
                setInsightStatusFilter("All");
              }}
            />
            <InsightPill
              icon={<WrenchRegular />}
              label="Repair Requests"
              count={overview.requestVolume?.RepairRequestCount ?? 0}
              active={insightKey === "repair"}
              onClick={() => {
                setInsightKey("repair");
                setInsightStatusFilter("All");
              }}
            />
            <InsightPill
              icon={<DeveloperBoardRegular />}
              label="Upgrade Requests"
              count={overview.requestVolume?.UpgradeRequestCount ?? 0}
              active={insightKey === "upgrade"}
              onClick={() => {
                setInsightKey("upgrade");
                setInsightStatusFilter("All");
              }}
            />
            <InsightPill
              icon={<DocumentPersonRegular />}
              label="HR Requests"
              count={overview.requestVolume?.HRRequestCount ?? 0}
              active={insightKey === "hr"}
              onClick={() => {
                setInsightKey("hr");
                setInsightStatusFilter("All");
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            {(insightKey === "new" || insightKey === "hr") && (
              <Input
                contentBefore={<SearchRegular style={{ color: "#007ED5" }} />}
                placeholder={insightKey === "new" ? "Search new requests..." : "Search HR requests..."}
                value={insightSearch}
                onChange={(_, d) => setInsightSearch(d.value)}
                style={{
                  borderRadius: "9999px",
                  border: "1px solid #E2E8F0",
                  height: "38px",
                  minWidth: "260px",
                  flex: "1 1 260px",
                  background: "#FFFFFF",
                }}
              />
            )}
            {insightKey === "new" && (
              <QuadraFilterDropdown
                icon={<FilterRegular />}
                label="Status"
                value={insightStatusFilter}
                options={[
                  { value: "All", label: "All Statuses" },
                  { value: "Pending", label: "Pending" },
                  { value: "Approved", label: "Approved" },
                  { value: "Rejected", label: "Rejected" },
                  { value: "Completed", label: "Completed" },
                ]}
                onChange={(v) => setInsightStatusFilter(v)}
                minWidth={170}
                pill={true}
              />
            )}
            {insightKey === "hr" && (
              <QuadraFilterDropdown
                icon={<FilterRegular />}
                label="Status"
                value={insightStatusFilter}
                options={[
                  { value: "All", label: "All Statuses" },
                  { value: "Draft", label: "Draft" },
                  { value: "Submitted", label: "Submitted" },
                  { value: "Assigned", label: "Assigned" },
                ]}
                onChange={(v) => setInsightStatusFilter(v)}
                minWidth={170}
                pill={true}
              />
            )}
          </div>

          <div className="quadra-glass-card" style={{ padding: "24px", borderRadius: "18px" }}>
            {insightsLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                <Spinner label="Loading request details..." />
              </div>
            ) : insightKey === "upgrade" ? (
              <UpgradeRequestList requests={upgradeRequests} role="employee" onActionComplete={() => {}} />
            ) : insightKey === "repair" ? (
              <RepairRequestList requests={repairRequests} role="employee" onActionComplete={() => {}} />
            ) : insightKey === "new" ? (
              filteredNewRequests.length === 0 ? (
                <Text style={{ color: "#64748b", padding: "16px 0", display: "block" }}>No new asset requests found.</Text>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                  {filteredNewRequests.map((r) => (
                    <div key={r.ID} className="quadra-chip-pill" style={{ padding: "18px", borderRadius: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <TruncatedText text={r.AssetType} weight="semibold" />
                          <TruncatedText
                            text={`${r.RequestNumber} · ${r.RequestedByName ?? "Unknown"}`}
                            size={200}
                            color="#64748b"
                          />
                        </div>
                        <Badge appearance="tint" color={REQUEST_STATUS_COLOR[r.OverallStatus]}>
                          {REQUEST_STATUS_LABEL[r.OverallStatus]}
                        </Badge>
                      </div>
                      <Text size={200} style={{ display: "block", marginTop: "10px", color: "#334155" }}>
                        {r.PurposeOfRequest}
                      </Text>
                      <TruncatedText
                        text={`Manager: ${r.AssignedManagerName ?? "-"}`}
                        size={200}
                        color="#64748b"
                        style={{ marginTop: "8px" }}
                      />
                      <Text size={200} style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
                        Created {formatDate(r.CreatedAt)}
                      </Text>
                    </div>
                  ))}
                </div>
              )
            ) : filteredHRRequests.length === 0 ? (
              <Text style={{ color: "#64748b", padding: "16px 0", display: "block" }}>No HR requests found.</Text>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
                {filteredHRRequests.map((r) => (
                  <div key={r.ID} className="quadra-chip-pill" style={{ padding: "18px", borderRadius: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <TruncatedText text={r.HRRequestID} weight="semibold" />
                        <TruncatedText text={`Raised by ${r.RequestedUserName ?? "Unknown"}`} size={200} color="#64748b" />
                      </div>
                      <Badge appearance="tint" color={HR_STATUS_COLOR[r.Status]}>
                        {r.Status}
                      </Badge>
                    </div>
                    <Text size={200} style={{ color: "#64748b", display: "block", marginTop: "10px" }}>
                      {r.ApplicantCount} applicant{r.ApplicantCount === 1 ? "" : "s"} · {formatDate(r.CreatedAt)}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const KPICard = ({
  icon,
  iconBg,
  iconColor,
  value,
  label,
  sublabel,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  value: string;
  label: string;
  sublabel: string;
  onClick?: () => void;
}) => (
  <div
    className="quadra-glass-card"
    onClick={onClick}
    style={{
      padding: "20px 22px",
      borderRadius: "16px",
      cursor: onClick ? "pointer" : "default",
      transition: "transform 0.15s ease, box-shadow 0.15s ease",
    }}
  >
    <div style={{ background: iconBg, color: iconColor, borderRadius: "12px", width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
      {icon}
    </div>
    <Text size={700} weight="bold" style={{ display: "block", marginTop: "14px", color: "#0f172a" }}>
      {value}
    </Text>
    <Text weight="semibold" style={{ display: "block", color: "#1e293b", fontSize: "14px" }}>
      {label}
    </Text>
    <Text size={200} style={{ color: "#64748b" }}>
      {sublabel}
    </Text>
  </div>
);

const InsightPill = ({
  icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: JSX.Element;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      borderRadius: "999px",
      padding: "6px 16px",
      fontSize: "13px",
      fontWeight: active ? 600 : 500,
      background: active ? "#007ED5" : "rgba(255, 255, 255, 0.75)",
      color: active ? "#ffffff" : "#475569",
      border: active ? "1px solid #007ED5" : "1px solid rgba(226, 232, 240, 0.8)",
      boxShadow: active ? "0 4px 12px rgba(0, 126, 213, 0.25)" : "none",
      cursor: "pointer",
      transition: "all 0.15s ease",
    }}
  >
    {icon}
    <span>{label} ({count})</span>
  </button>
);

interface QuadraFilterDropdownOption {
  value: string;
  label: string;
  count?: number;
}

interface QuadraFilterDropdownProps {
  icon?: React.ReactNode;
  label?: string;
  value: string;
  displayValue?: string;
  options: QuadraFilterDropdownOption[];
  onChange: (value: string) => void;
  minWidth?: number | string;
  pill?: boolean;
  style?: React.CSSProperties;
}

const QuadraFilterDropdown = ({
  icon,
  label,
  value,
  displayValue,
  options,
  onChange,
  minWidth = 140,
  pill = true,
  style,
}: QuadraFilterDropdownProps) => {
  const [open, setOpen] = useState(false);
  const currentOption = options.find((o) => o.value === value);
  const selectedLabel = displayValue ?? currentOption?.label ?? value;

  return (
    <Menu open={open} onOpenChange={(_, d) => setOpen(d.open)}>
      <MenuTrigger disableButtonEnhancement>
        <button
          type="button"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            background: "#FFFFFF",
            border: open ? "1px solid #007ED5" : "1px solid #E2E8F0",
            borderRadius: pill ? "9999px" : "10px",
            padding: pill ? "7px 16px" : "8px 14px",
            boxShadow: open
              ? "0 0 0 3px rgba(0, 126, 213, 0.15), 0 2px 6px rgba(0, 0, 0, 0.04)"
              : "0 1px 3px rgba(0, 0, 0, 0.04)",
            cursor: "pointer",
            transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
            minWidth,
            height: "38px",
            outline: "none",
            userSelect: "none",
            boxSizing: "border-box",
            ...style,
          }}
          onMouseEnter={(e) => {
            if (!open) {
              e.currentTarget.style.borderColor = "#007ED5";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 126, 213, 0.12)";
              e.currentTarget.style.background = "#F8FAFC";
            }
          }}
          onMouseLeave={(e) => {
            if (!open) {
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.04)";
              e.currentTarget.style.background = "#FFFFFF";
            }
          }}
        >
          {icon && (
            <span style={{ display: "inline-flex", alignItems: "center", color: "#007ED5", fontSize: "15px", flexShrink: 0 }}>
              {icon}
            </span>
          )}
          {label && (
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.03em", flexShrink: 0 }}>
              {label}:
            </span>
          )}
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#0F172A",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              textAlign: "left",
            }}
          >
            {selectedLabel}
          </span>
          <ChevronDownRegular
            style={{
              color: open ? "#007ED5" : "#64748B",
              fontSize: "14px",
              flexShrink: 0,
              transition: "transform 0.2s ease",
              transform: open ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
      </MenuTrigger>
      <MenuPopover
        style={{
          borderRadius: "14px",
          border: "1px solid #E2E8F0",
          boxShadow: "0 12px 32px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.04)",
          padding: "6px",
          background: "#FFFFFF",
          minWidth: typeof minWidth === "number" ? Math.max(minWidth, 180) : 180,
          maxHeight: "320px",
          overflowY: "auto",
          zIndex: 1000,
        }}
      >
        <MenuList>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <MenuItem
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  background: isSelected ? "#EEF6FF" : "transparent",
                  color: isSelected ? "#007ED5" : "#1E293B",
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                  margin: "1px 0",
                }}
              >
                <span>{opt.label}</span>
                {isSelected ? (
                  <CheckmarkRegular style={{ color: "#007ED5", fontSize: "14px", marginLeft: "8px" }} />
                ) : opt.count !== undefined ? (
                  <span style={{ fontSize: "11px", color: "#94A3B8", background: "#F1F5F9", padding: "1px 6px", borderRadius: "999px" }}>
                    {opt.count}
                  </span>
                ) : null}
              </MenuItem>
            );
          })}
        </MenuList>
      </MenuPopover>
    </Menu>
  );
};

export default AssetReports;
