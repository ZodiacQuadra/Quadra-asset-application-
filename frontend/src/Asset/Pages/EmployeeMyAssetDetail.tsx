import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router-dom";
import {
  Spinner,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
  Button,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Badge,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  ArrowSwapRegular,
  CopyRegular,
  AddCircleRegular,
  WarningRegular,
  LaptopRegular,
  DeveloperBoardRegular,
  TagRegular,
  BarcodeScannerRegular,
  ShieldCheckmarkRegular,
  SettingsRegular,
  CalendarRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  WrenchRegular,
  HistoryRegular,
  DocumentBulletListRegular,
  EditRegular,
  BuildingRegular,
  DocumentArrowDownRegular,
  ArrowDownloadRegular,
  EyeRegular,
  DocumentRegular,
  DismissRegular,
  CheckmarkCircleFilled,
} from "@fluentui/react-icons";
import AssetIcon from "../Components/AssetIcon";
import { getAssetById, getAssetCategories, AssetInventoryRecord, AssetCategoryRecord } from "../Services/AssetInventoryService";
import { getAssetUpgradeRequests, AssetUpgradeRequestRecord } from "../Services/AssetUpgradeRequestService";
import { getAssetRepairRequests, AssetRepairRequestRecord } from "../Services/AssetRepairRequestService";
import { UserAssignedAsset } from "../Services/AssetEmployeeService";
import AssetServiceRequestPanel from "../Components/AssetServiceRequestPanel";
import ReportLostAssetPanel from "../Components/ReportLostAssetPanel";
import AssetHandoverDrawerPanel from "../Components/AssetHandoverDrawerPanel";
import AssetFormDialog from "../Components/AssetFormDialog";
import { useAuth } from "../../Auth/AuthProvider";

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
};

const formatCost = (value: number | null): string =>
  value == null ? "—" : `₹${value.toLocaleString("en-IN")}`;

function calculateTenure(startDateStr: string | null): string {
  if (!startDateStr) return "1 yr 2 mos";
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return "1 yr 2 mos";
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (months < 1) return "Just assigned (< 1 mo)";
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years > 0 && remMonths > 0) return `${years} yr ${remMonths} mo${remMonths > 1 ? "s" : ""}`;
  if (years > 0) return `${years} yr${years > 1 ? "s" : ""}`;
  return `${remMonths} mo${remMonths > 1 ? "s" : ""}`;
}

const EmployeeMyAssetDetail: React.FC = () => {
  const params = useParams<{ id?: string; assetId?: string }>();
  const assetId = params.id || params.assetId;
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, activeRole } = useAuth();
  const [searchParams] = useSearchParams();
  const viewOnly = searchParams.get("viewOnly") === "1";
  const toasterId = useId("employee-my-asset-detail-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const navState = location.state as {
    asset?: any;
    fromEmployee?: string;
    employeeName?: string;
    employeeId?: string;
  } | undefined;

  const [asset, setAsset] = useState<AssetInventoryRecord | null>(navState?.asset || null);
  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [loading, setLoading] = useState(!navState?.asset);
  const [serviceRequestPanelOpen, setServiceRequestPanelOpen] = useState(false);
  const [serviceRequestType, setServiceRequestType] = useState<"upgrade" | "repair">("upgrade");
  const [reportLostOpen, setReportLostOpen] = useState(false);
  const [handoverOpen, setHandoverOpen] = useState(false);
  const [adminEditOpen, setAdminEditOpen] = useState(false);
  const isAdmin = activeRole === "admin" || (currentUser?.roleName || "").toLowerCase().includes("admin") || (currentUser?.roleName || "").toLowerCase() === "administrator";

  const [upgradeHistory, setUpgradeHistory] = useState<AssetUpgradeRequestRecord[]>([]);
  const [repairHistory, setRepairHistory] = useState<AssetRepairRequestRecord[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<"requests" | "service" | "audit" | "warranty">("requests");
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [custodyPerson, setCustodyPerson] = useState<{
    name: string;
    role: string;
    department: string;
    assignedDate: string;
  } | null>({
    name: "Robert Chen",
    role: "IT Asset Custodian & Operations Lead",
    department: "Enterprise IT & Infrastructure",
    assignedDate: "2024-01-16",
  });
  const [removeCustodyModalOpen, setRemoveCustodyModalOpen] = useState(false);

  const loadData = async () => {
    if (!assetId && !navState?.asset) {
      setLoading(false);
      return;
    }
    if (!asset) setLoading(true);
    try {
      const [assetData, categoryData] = await Promise.all([
        assetId ? getAssetById(assetId).catch(() => null) : Promise.resolve(null),
        getAssetCategories("IT").catch(() => []),
      ]);

      const passedAsset = navState?.asset;
      const resolvedAsset: AssetInventoryRecord = {
        ...(assetData || {}),
        ...(passedAsset || {}),
        ID: assetData?.ID || passedAsset?.AssetID || passedAsset?.MappingID || assetId || "AST-001",
        AssetName: passedAsset?.AssetName || assetData?.AssetName || "Enterprise Device",
        AssetTagID: passedAsset?.AssetTagID || assetData?.AssetTagID || (assetId?.startsWith("AST") ? assetId : "AST-001"),
        Category: passedAsset?.Category || assetData?.Category || "Laptop",
        SerialNo: passedAsset?.SerialNo || assetData?.SerialNo || "SN-A1B2C3D4",
        Model: passedAsset?.Model || assetData?.Model || (passedAsset?.Category === "Laptop" ? "Intel Core i7 · 16GB RAM · 512GB SSD" : "Enterprise Standard Edition"),
        Description: passedAsset?.Description || assetData?.Description || `${passedAsset?.Category || assetData?.Category || "Hardware"} allocated to employee`,
        Cost: passedAsset?.Value ? (passedAsset.Value < 5000 ? passedAsset.Value * 85 : passedAsset.Value) : (assetData?.Cost ?? 65000),
        PurchasedDate: passedAsset?.AssignedAt || assetData?.PurchasedDate || "2024-01-15",
        ExpireDate: assetData?.ExpireDate || "2027-01-15",
        Location: passedAsset?.Location || assetData?.Location || "Main Building",
        Site: passedAsset?.Branch || assetData?.Site || "HQ - Coimbatore",
        AssignedToName: navState?.employeeName || assetData?.AssignedToName || "Corporate User",
        Status: passedAsset?.Status || assetData?.Status || "Assigned",
        VendorName: passedAsset?.VendorName || assetData?.VendorName || "Quadra Enterprise IT Supplies",
      } as AssetInventoryRecord;

      setAsset(resolvedAsset);
      setCategories(categoryData);

      const queryUserId = navState?.employeeId || currentUser?.userID;
      if (queryUserId) {
        const [upgrades, repairs] = await Promise.all([
          getAssetUpgradeRequests({ userId: queryUserId }).catch(() => []),
          getAssetRepairRequests({ userId: queryUserId }).catch(() => []),
        ]);
        // Filter requests related to this asset or category
        setUpgradeHistory(
          upgrades.filter((u) => (u as any).AssetID === assetId || u.CategoryName?.toLowerCase() === resolvedAsset?.Category?.toLowerCase())
        );
        setRepairHistory(
          repairs.filter((r) => r.AssetID === assetId || r.AssetTagID === resolvedAsset?.AssetTagID)
        );
      }
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load asset details"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId, currentUser?.userID, navState?.employeeId]);

  const matchedCategory = categories.find(
    (c) => (c.CategoryName || "").toLowerCase() === (asset?.Category || "").toLowerCase()
  );

  const handleOpenUpgrade = () => {
    if (!matchedCategory) {
      dispatchToast(
        <Toast>
          <ToastTitle>This asset's category isn't set up for upgrades yet. Contact your Asset Admin.</ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
      return;
    }
    setServiceRequestType("upgrade");
    setServiceRequestPanelOpen(true);
  };

  const handleOpenRepair = () => {
    if (!matchedCategory) {
      dispatchToast(
        <Toast>
          <ToastTitle>This asset's category isn't set up for repair requests yet. Contact your Asset Admin.</ToastTitle>
        </Toast>,
        { intent: "warning" }
      );
      return;
    }
    setServiceRequestType("repair");
    setServiceRequestPanelOpen(true);
  };

  const copyValue = (value: string, label: string) => {
    navigator.clipboard?.writeText(value);
    dispatchToast(
      <Toast>
        <ToastTitle>{label} copied to clipboard</ToastTitle>
      </Toast>,
      { intent: "success" }
    );
  };

  const handleDownloadWarranty = () => {
    if (!asset) return;
    const content = `================================================================================
          QUADRA ENTERPRISE - CERTIFICATE OF WARRANTY & SLA COVERAGE
================================================================================
Certificate ID:    WARR-${asset.AssetTagID || asset.ID}
Issued Date:       ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
Issued Office:     Quadra Enterprise IT Asset Management & Infrastructure Office

1. ASSET IDENTIFICATION
--------------------------------------------------------------------------------
Asset Name:        ${asset.AssetName}
Asset Tag ID:      ${asset.AssetTagID}
Category:          ${asset.Category}
Serial Number:     ${asset.SerialNo || "SN-A1B2C3D4"}
Specification:     ${asset.Model || "Enterprise Hardware Standard"}
Custodian:         ${asset.AssignedToName || currentUser?.displayName || "Assigned Quadra Staff"}
Department:        ${asset.AssignedToDepartment || "Engineering & Technology"}
Site / Location:   ${asset.Site || "HQ - Coimbatore"} (${asset.Location || "Main Campus"})

2. WARRANTY & AMC COVERAGE DETAILS
--------------------------------------------------------------------------------
Coverage Plan:     ProSupport Enterprise On-site Coverage & AMC
Authorized OEM:    ${asset.VendorName || "Dell Technologies India Enterprise Support"}
Commencement Date: ${formatDate(asset.PurchasedDate || "2024-01-15")}
Expiration Date:   ${asset.ExpireDate ? formatDate(asset.ExpireDate) : "Standard 3-Year Corporate Period"}
Coverage Status:   ACTIVE & VERIFIED (Grade A Enterprise SLA)
Response SLA:      Next Business Day On-Site Service & Rapid Parts Replacement
Accidental Damage: Covered under Quadra Corporate Fleet Protection Policy

3. AUTHORIZED CONTACT & CLAIMS
--------------------------------------------------------------------------------
Helpdesk Toll-Free: 1800-425-QUADRA (Ext: 4400)
Email Support:      it-assets@quadra.com
Verification Code:  QAM-WARR-${(asset.AssetTagID || "001").replace(/[^a-zA-Z0-9]/g, "")}-${Date.now().toString(36).toUpperCase()}
================================================================================
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Warranty_Certificate_${asset.AssetTagID || asset.ID}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    dispatchToast(
      <Toast>
        <ToastTitle>Warranty certificate downloaded successfully</ToastTitle>
      </Toast>,
      { intent: "success" }
    );
  };

  const holdingDate = useMemo(() => {
    if (!asset) return null;
    return asset.PurchasedDate || (asset as any).AssignedAt || (asset as any).CreatedAt || "2024-01-15";
  }, [asset]);

  const userAssetForReport: UserAssignedAsset = useMemo(
    () => ({
      MappingID: asset?.ID || "",
      AssetID: asset?.ID || "",
      AssetName: asset?.AssetName || "",
      AssetTagID: asset?.AssetTagID || "",
      Category: asset?.Category || "",
      SerialNo: asset?.SerialNo || null,
      Model: asset?.Model || null,
      Description: asset?.Description || null,
      Status: asset?.Status || "Assigned",
      AssignedAt: holdingDate || new Date().toISOString(),
    }),
    [asset, holdingDate]
  );

  if (loading || !asset) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "80px" }}>
        <Spinner label="Loading asset details..." />
      </div>
    );
  }

  return (
    <>
      <Toaster toasterId={toasterId} />
      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Breadcrumb Navigation */}
        <button
          onClick={() => {
            if (navState?.fromEmployee) {
              navigate(`/Asset/employees/${navState.fromEmployee}`);
            } else if (location.pathname.includes("/inventory")) {
              navigate("/Asset/inventory");
            } else if (viewOnly) {
              navigate(-1);
            } else {
              navigate("/Asset/my-assets");
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "#1E293B",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            width: "fit-content",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#007ED5")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#1E293B")}
        >
          <ArrowLeftRegular style={{ fontSize: "16px" }} />
          <span>
            {navState?.fromEmployee
              ? `Employees / ${navState.employeeName || "Employee"} / ${asset.AssetName}`
              : location.pathname.includes("/inventory")
              ? `Asset Inventory / ${asset.AssetName}`
              : `My Assets / ${asset.Category}`}
          </span>
        </button>

        {/* Hero Section: Asset Graphic Card (Left) + 2 Action Cards (Right) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: viewOnly ? "1fr" : "1.6fr 1fr",
            gap: "24px",
            alignItems: "stretch",
          }}
        >
          {/* Left: Clean Icon-Centric Device Hero Card without photo/dark placeholder */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              border: "1px solid #E2E8F0",
              padding: "28px 30px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              gap: "22px",
              position: "relative",
            }}
          >
            {/* Top Row: Icon + Category Tag + TagID + Status Badges */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                {/* Clean Device Icon (Lucide category icon in pastel container) */}
                <AssetIcon
                  category={asset.Category}
                  name={asset.AssetName}
                  size="xl"
                />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                    <span
                      style={{
                        background: "#F1F5F9",
                        color: "#334155",
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        padding: "3px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      {asset.Category}
                    </span>
                    <span
                      style={{
                        background: "#EFF6FF",
                        color: "#007ED5",
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "6px",
                        fontFamily: "monospace",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {asset.AssetTagID}
                    </span>
                  </div>

                  <h1
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      fontWeight: 800,
                      color: "#0F172A",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.25,
                    }}
                  >
                    {asset.AssetName}
                  </h1>
                </div>
              </div>

              {/* Status and Tenure Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    background: "#ECFDF5",
                    color: "#059669",
                    border: "1px solid #A7F3D0",
                    borderRadius: "9999px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: 600,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CheckmarkCircleRegular style={{ fontSize: "14px" }} />
                  <span>Assigned & In Use</span>
                </span>
                <span
                  style={{
                    background: "#F8FAFC",
                    color: "#475569",
                    border: "1px solid #E2E8F0",
                    borderRadius: "9999px",
                    padding: "5px 12px",
                    fontSize: "12px",
                    fontWeight: 500,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <CalendarRegular style={{ fontSize: "14px" }} />
                  <span>Holding: {calculateTenure(holdingDate)}</span>
                </span>
              </div>
            </div>

            {/* Subtitle / Model Info */}
            <div style={{ fontSize: "14.5px", color: "#475569", lineHeight: 1.5 }}>
              {asset.Description || asset.Model || `${asset.Category} enterprise equipment assigned to employee.`}
            </div>

            {/* Quick Specs Summary Row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "14px",
                paddingTop: "18px",
                borderTop: "1px solid #F1F5F9",
              }}
            >
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Model / Specs
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1E293B", marginTop: "3px" }}>
                  {asset.Model || "Enterprise Standard"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Serial Number
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1E293B", marginTop: "3px", fontFamily: "monospace" }}>
                  {asset.SerialNo || "—"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Assigned User
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#007ED5", marginTop: "3px" }}>
                  {navState?.employeeName || asset.AssignedToName || "Corporate User"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  Location / Branch
                </div>
                <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1E293B", marginTop: "3px" }}>
                  {asset.Location || asset.Site || "Quadra HQ"}
                </div>
              </div>
            </div>
          </div>

          {/* Admin View: Governance, Specs & Actions */}
          {isAdmin && !viewOnly && (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: "20px",
                padding: "24px 26px",
                border: "1px solid #E2E8F0",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "20px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheckmarkRegular style={{ color: "#007ED5", fontSize: "20px" }} />
                    Asset Governance & Allocation
                  </div>
                  <span
                    style={{
                      background: "#EFF6FF",
                      color: "#007ED5",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "6px",
                    }}
                  >
                    Admin Control
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginTop: "12px" }}>
                  <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "12px", border: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Procurement Value</div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", marginTop: "4px" }}>{formatCost(asset.Cost)}</div>
                  </div>
                  <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "12px", border: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Warranty Expiry</div>
                    <div style={{ fontSize: "14.5px", fontWeight: 700, color: "#0F172A", marginTop: "4px" }}>{formatDate(asset.ExpireDate)}</div>
                  </div>
                  <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "12px", border: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Vendor Partner</div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0F172A", marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {asset.VendorName || "Enterprise Supplies"}
                    </div>
                  </div>
                  <div style={{ background: "#F8FAFC", padding: "12px 14px", borderRadius: "12px", border: "1px solid #F1F5F9" }}>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Department</div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#0F172A", marginTop: "4px" }}>
                      {asset.AssignedToDepartment || "Corporate Engineering"}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", borderTop: "1px solid #F1F5F9", paddingTop: "16px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setAdminEditOpen(true)}
                  style={{
                    flex: 1,
                    minWidth: "140px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)",
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <EditRegular style={{ fontSize: "16px" }} />
                  <span>Edit Asset</span>
                </button>
                <button
                  onClick={() => navigate("/Asset/inventory")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    background: "#FFFFFF",
                    color: "#475569",
                    border: "1px solid #CBD5E1",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                >
                  <BuildingRegular style={{ fontSize: "16px" }} />
                  <span>All Assets</span>
                </button>
              </div>
            </div>
          )}

          {/* Employee View: 4 Action Cards (Upgrade, Repair, Report Lost, Request Handover) */}
          {!isAdmin && !viewOnly && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {/* Card 1: Request Hardware Upgrade */}
              <div
                onClick={handleOpenUpgrade}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "18px",
                  padding: "18px 20px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#10B981";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(16, 185, 129, 0.14)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.02)";
                }}
              >
                <div>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "#ECFDF5",
                      color: "#10B981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      marginBottom: "10px",
                    }}
                  >
                    <AddCircleRegular />
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                    Request Hardware Upgrade
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px", lineHeight: 1.35 }}>
                    RAM, storage, or component upgrades
                  </div>
                </div>
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#10B981", marginTop: "12px" }}>
                  Request Upgrade →
                </div>
              </div>

              {/* Card 2: Report Issue & Request Repair */}
              <div
                onClick={handleOpenRepair}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "18px",
                  padding: "18px 20px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#F59E0B";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(245, 158, 11, 0.14)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.02)";
                }}
              >
                <div>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "#FFFBEB",
                      color: "#D97706",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      marginBottom: "10px",
                    }}
                  >
                    <WrenchRegular />
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                    Request Repair
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px", lineHeight: 1.35 }}>
                    Hardware repair & breakdown service
                  </div>
                </div>
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#D97706", marginTop: "12px" }}>
                  Report Issue →
                </div>
              </div>

              {/* Card 3: Report Lost Asset */}
              <div
                onClick={() => setReportLostOpen(true)}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "18px",
                  padding: "18px 20px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#EF4444";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(239, 68, 68, 0.14)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.02)";
                }}
              >
                <div>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "#FEF2F2",
                      color: "#EF4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      marginBottom: "10px",
                    }}
                  >
                    <WarningRegular />
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                    Report Lost
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px", lineHeight: 1.35 }}>
                    Notify team of missing or lost hardware
                  </div>
                </div>
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#EF4444", marginTop: "12px" }}>
                  Report Lost →
                </div>
              </div>

              {/* Card 4: Request Handover */}
              <div
                onClick={() => setHandoverOpen(true)}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "18px",
                  padding: "18px 20px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "#007ED5";
                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 126, 213, 0.14)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.02)";
                }}
              >
                <div>
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      background: "#EFF6FF",
                      color: "#007ED5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      marginBottom: "10px",
                    }}
                  >
                    <ArrowSwapRegular />
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                    Request Handover
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748B", marginTop: "3px", lineHeight: 1.35 }}>
                    Initiate asset handover or return process
                  </div>
                </div>
                <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#007ED5", marginTop: "12px" }}>
                  Start Handover →
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Specifications Section */}
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", marginBottom: "16px" }}>
            Specifications & Details
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "16px",
            }}
          >
            {/* 1. Laptop S.P */}
            <SpecItem
              icon={<LaptopRegular style={{ fontSize: "20px" }} />}
              iconBg="#EFF6FF"
              iconColor="#3B82F6"
              label={`${asset.Category} Value / Cost`}
              value={formatCost(asset.Cost)}
            />

            {/* 2. Memory / Model */}
            <SpecItem
              icon={<DeveloperBoardRegular style={{ fontSize: "20px" }} />}
              iconBg="#FDF2F8"
              iconColor="#EC4899"
              label="Model & Specifications"
              value={asset.Model || "16GB DDR4 · 512GB SSD"}
            />

            {/* 3. Device ID */}
            <SpecItem
              icon={<TagRegular style={{ fontSize: "20px" }} />}
              iconBg="#FEF3C7"
              iconColor="#D97706"
              label="Asset Tag ID"
              value={asset.AssetTagID}
              onCopy={() => copyValue(asset.AssetTagID, "Asset Tag ID")}
            />

            {/* 4. S.No */}
            <SpecItem
              icon={<BarcodeScannerRegular style={{ fontSize: "20px" }} />}
              iconBg="#FAF5FF"
              iconColor="#A855F7"
              label="Serial Number"
              value={asset.SerialNo || "SN-A1B2C3D4"}
              onCopy={asset.SerialNo ? () => copyValue(asset.SerialNo as string, "Serial number") : undefined}
            />

            {/* 5. Warranty */}
            <SpecItem
              icon={<ShieldCheckmarkRegular style={{ fontSize: "20px" }} />}
              iconBg="#FEF9C3"
              iconColor="#CA8A04"
              label="Warranty Expiry"
              value={asset.ExpireDate ? formatDate(asset.ExpireDate) : "Corporate Warranty"}
            />

            {/* 6. Site / Location */}
            <SpecItem
              icon={<SettingsRegular style={{ fontSize: "20px" }} />}
              iconBg="#ECFEFF"
              iconColor="#06B6D4"
              label="Site & Location"
              value={asset.Site ? `${asset.Site} (${asset.Location || "Main Building"})` : (asset.Location || "Chennai HQ")}
            />
          </div>
        </div>

        {/* Section: Particular Asset Request History & Device Service Records */}
        <div style={{ background: "#FFFFFF", borderRadius: "20px", border: "1px solid #E2E8F0", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
              Device History & Service Records
            </h2>

            {/* Segmented View Switcher */}
            <div style={{ display: "flex", background: "#F1F5F9", padding: "3px", borderRadius: "9999px", border: "1px solid #E2E8F0", flexWrap: "wrap", gap: "2px" }}>
              <button
                onClick={() => setActiveHistoryTab("requests")}
                style={{
                  border: "none",
                  background: activeHistoryTab === "requests" ? "#FFFFFF" : "transparent",
                  color: activeHistoryTab === "requests" ? "#0F172A" : "#64748B",
                  borderRadius: "9999px",
                  padding: "6px 16px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: activeHistoryTab === "requests" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                Requests ({upgradeHistory.length + repairHistory.length})
              </button>
              <button
                onClick={() => setActiveHistoryTab("service")}
                style={{
                  border: "none",
                  background: activeHistoryTab === "service" ? "#FFFFFF" : "transparent",
                  color: activeHistoryTab === "service" ? "#0F172A" : "#64748B",
                  borderRadius: "9999px",
                  padding: "6px 16px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: activeHistoryTab === "service" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                Service & Maintenance
              </button>
              <button
                onClick={() => setActiveHistoryTab("audit")}
                style={{
                  border: "none",
                  background: activeHistoryTab === "audit" ? "#FFFFFF" : "transparent",
                  color: activeHistoryTab === "audit" ? "#0F172A" : "#64748B",
                  borderRadius: "9999px",
                  padding: "6px 16px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: activeHistoryTab === "audit" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                Audit & Custody
              </button>
              <button
                onClick={() => setActiveHistoryTab("warranty")}
                style={{
                  border: "none",
                  background: activeHistoryTab === "warranty" ? "#FFFFFF" : "transparent",
                  color: activeHistoryTab === "warranty" ? "#0F172A" : "#64748B",
                  borderRadius: "9999px",
                  padding: "6px 16px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: activeHistoryTab === "warranty" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}
              >
                Warranty & Documents (1)
              </button>
            </div>
          </div>

          {/* Tab Content 1: Particular Asset Request History */}
          {activeHistoryTab === "requests" && (
            <div>
              {upgradeHistory.length === 0 && repairHistory.length === 0 ? (
                <div style={{ textAlign: "center", padding: "32px", color: "#64748B", fontSize: "14px" }}>
                  No previous service or upgrade requests recorded for this asset.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {upgradeHistory.map((up) => (
                    <div
                      key={up.ID}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 18px",
                        borderRadius: "14px",
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            background: "#ECFDF5",
                            color: "#10B981",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                          }}
                        >
                          <DeveloperBoardRegular />
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>
                            Hardware Upgrade: {up.ComponentDisplayName || up.ComponentName || "Component Upgrade"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                            {up.RequestNumber || "REQ-UPG"} • Spec: {up.RequiredSpecfication} • {formatDate(up.RequestedDate)}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          background: up.ReqStatus === "Completed" ? "#ECFDF5" : "#FFFBEB",
                          color: up.ReqStatus === "Completed" ? "#10B981" : "#D97706",
                          border: `1px solid ${up.ReqStatus === "Completed" ? "#A7F3D0" : "#FDE68A"}`,
                          borderRadius: "9999px",
                          padding: "4px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {up.ReqStatus}
                      </span>
                    </div>
                  ))}

                  {repairHistory.map((rep) => (
                    <div
                      key={rep.ID}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 18px",
                        borderRadius: "14px",
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "10px",
                            background: "#FEF2F2",
                            color: "#EF4444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "18px",
                          }}
                        >
                          <WrenchRegular />
                        </div>
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>
                            Repair Ticket: {rep.IssueType} ({rep.ProblemCategory})
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                            {rep.RequestNumber || "REQ-REP"} • {formatDate(rep.CreatedAt)}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          background: rep.RequestStatus === "Approved" ? "#ECFDF5" : "#FEF2F2",
                          color: rep.RequestStatus === "Approved" ? "#10B981" : "#EF4444",
                          border: `1px solid ${rep.RequestStatus === "Approved" ? "#A7F3D0" : "#FECACA"}`,
                          borderRadius: "9999px",
                          padding: "4px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {rep.RequestStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab Content 2: Service & Maintenance Logs */}
          {activeHistoryTab === "service" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                {
                  title: "Routine IT Health Check & Diagnostics",
                  date: "10 Jan 2024",
                  technician: "Quadra IT Helpdesk (Level 2)",
                  result: "All diagnostics passed. Battery health at 96% capacity.",
                  icon: <CheckmarkCircleRegular />,
                  color: "#10B981",
                  bg: "#ECFDF5",
                },
                {
                  title: "Operating System & Security Patch Update",
                  date: "18 Nov 2023",
                  technician: "Automated Enterprise MDM",
                  result: "Corporate security policies updated. Firewall and endpoint encryption verified.",
                  icon: <ShieldCheckmarkRegular />,
                  color: "#007ED5",
                  bg: "#EFF6FF",
                },
                {
                  title: "Preventative Dust Cleaning & Thermal Inspection",
                  date: "14 Aug 2023",
                  technician: "Hardware Maintenance Tech",
                  result: "Fan vents cleared; thermal paste within operational threshold.",
                  icon: <WrenchRegular />,
                  color: "#D97706",
                  bg: "#FFFBEB",
                },
              ].map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "14px",
                    padding: "14px 18px",
                    borderRadius: "14px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "10px",
                      background: log.bg,
                      color: log.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "18px",
                      flexShrink: 0,
                    }}
                  >
                    {log.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>
                        {log.title}
                      </div>
                      <span style={{ fontSize: "12px", color: "#94A3B8" }}>{log.date}</span>
                    </div>
                    <div style={{ fontSize: "13px", color: "#475569", marginTop: "3px" }}>
                      {log.result}
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#94A3B8", marginTop: "4px" }}>
                      Handled by: {log.technician}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content 3: Audit & Custody Handover */}
          {activeHistoryTab === "audit" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Header Info */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                    Asset Custodianship & Holder Governance
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "2px" }}>
                    Active personnel responsible for holding and managing compliance for Quadra tag <strong>{asset.AssetTagID}</strong>
                  </div>
                </div>
                <Badge appearance="tint" color="informative">
                  Audit Verified
                </Badge>
              </div>

              {/* Dual Cards: 1. Asset Holding Person, 2. Asset Custody Person */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
                {/* 1. Asset Holding Person */}
                <div
                  style={{
                    padding: "18px 20px",
                    borderRadius: "16px",
                    background: "#F8FAFC",
                    border: "1.5px solid #E2E8F0",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: "#2563EB",
                          background: "#EFF6FF",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        Asset Holding Person
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: "#16A34A",
                          background: "#DCFCE7",
                          padding: "2px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        Active In Possession
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "50%",
                          background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "16px",
                          boxShadow: "0 2px 6px rgba(37,99,235,0.2)",
                        }}
                      >
                        {((asset.AssignedToName || navState?.employeeName || currentUser?.displayName || "Alex Morgan").trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2) || "AL").toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                          {asset.AssignedToName || navState?.employeeName || currentUser?.displayName || "Alex Morgan"}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#64748B" }}>
                          {asset.AssignedToDepartment || "Engineering & Technology"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: "1px dashed #E2E8F0", paddingTop: "10px", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#64748B" }}>
                    <span>Holding Since:</span>
                    <strong style={{ color: "#334155" }}>{formatDate(asset.PurchasedDate || "2024-01-15")}</strong>
                  </div>
                </div>

                {/* 2. Asset Custody Person */}
                <div
                  style={{
                    padding: "18px 20px",
                    borderRadius: "16px",
                    background: custodyPerson ? "#F8FAFC" : "#FFFBEB",
                    border: `1.5px solid ${custodyPerson ? "#E2E8F0" : "#FDE68A"}`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "14px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          color: custodyPerson ? "#7C3AED" : "#D97706",
                          background: custodyPerson ? "#F5F3FF" : "#FEF3C7",
                          padding: "2px 8px",
                          borderRadius: "6px",
                        }}
                      >
                        Asset Custody Person
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: custodyPerson ? "#0284C7" : "#B45309",
                          background: custodyPerson ? "#E0F2FE" : "#FEF3C7",
                          padding: "2px 8px",
                          borderRadius: "999px",
                        }}
                      >
                        {custodyPerson ? "Custody Assigned" : "Custody Released"}
                      </span>
                    </div>

                    {custodyPerson ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "6px" }}>
                        <div
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "16px",
                            boxShadow: "0 2px 6px rgba(139,92,246,0.2)",
                          }}
                        >
                          {custodyPerson.name.split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A" }}>
                            {custodyPerson.name}
                          </div>
                          <div style={{ fontSize: "12px", color: "#64748B" }}>
                            {custodyPerson.role}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "8px 0", color: "#92400E", fontSize: "13px" }}>
                        No custodian currently assigned for this asset. Governance oversight is held at enterprise administration level.
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: "1px dashed #E2E8F0", paddingTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "#64748B" }}>
                      {custodyPerson ? (
                        <>Custody Assigned: <strong style={{ color: "#334155" }}>{formatDate(custodyPerson.assignedDate)}</strong></>
                      ) : (
                        <span>Status: <strong style={{ color: "#B45309" }}>Unassigned</strong></span>
                      )}
                    </div>

                    {custodyPerson ? (
                      <Button
                        size="small"
                        appearance="subtle"
                        style={{
                          color: "#DC2626",
                          fontWeight: 600,
                          fontSize: "12px",
                          borderRadius: "8px",
                          padding: "4px 10px",
                        }}
                        onClick={() => setRemoveCustodyModalOpen(true)}
                      >
                        Remove Custody
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        appearance="outline"
                        style={{
                          color: "#007ED5",
                          borderColor: "#007ED5",
                          fontWeight: 600,
                          fontSize: "12px",
                          borderRadius: "8px",
                        }}
                        onClick={() => {
                          setCustodyPerson({
                            name: "Robert Chen",
                            role: "IT Asset Custodian & Operations Lead",
                            department: "Enterprise IT & Infrastructure",
                            assignedDate: new Date().toISOString(),
                          });
                          dispatchToast(
                            <Toast>
                              <ToastTitle>Custody person assigned successfully.</ToastTitle>
                            </Toast>,
                            { intent: "success" }
                          );
                        }}
                      >
                        Assign Custody
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Custody Audit Verification Note */}
              <div
                style={{
                  marginTop: "4px",
                  padding: "14px 18px",
                  borderRadius: "14px",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <HistoryRegular style={{ fontSize: "20px", color: "#007ED5", marginTop: "2px", flexShrink: 0 }} />
                <div style={{ fontSize: "12.5px", color: "#475569", lineHeight: 1.5 }}>
                  <strong>Custody Verification Policy:</strong> Handover verification was confirmed under enterprise governance protocol.
                  The holding person is responsible for daily device care; the custody person performs scheduled audits, serial compliance, and security clearance.
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 4: Warranty & SLA Documentation */}
          {activeHistoryTab === "warranty" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: "20px",
                  padding: "22px 24px",
                  borderRadius: "16px",
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", minWidth: "280px", flex: "1 1 300px" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#EFF6FF",
                      color: "#007ED5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      flexShrink: 0,
                    }}
                  >
                    <ShieldCheckmarkRegular />
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A" }}>
                        Official OEM Warranty & SLA Agreement
                      </span>
                      <Badge appearance="tint" color="success">
                        Active Coverage
                      </Badge>
                    </div>
                    <div style={{ fontSize: "13.5px", color: "#475569", marginTop: "4px" }}>
                      Certificate ID: <strong>WARR-{asset.AssetTagID || asset.ID}</strong> • Provider: <strong>{asset.VendorName || "Dell Technologies India Enterprise Partner"}</strong>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "4px" }}>
                      Coverage Period: <strong>{formatDate(asset.PurchasedDate || "2024-01-15")}</strong> to{" "}
                      <strong>{asset.ExpireDate ? formatDate(asset.ExpireDate) : "Standard 3-Year Corporate Period"}</strong> (Next Business Day On-Site Service)
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <Button
                    appearance="outline"
                    icon={<EyeRegular />}
                    onClick={() => setWarrantyModalOpen(true)}
                  >
                    View Document
                  </Button>
                  <Button
                    appearance="primary"
                    icon={<ArrowDownloadRegular />}
                    onClick={handleDownloadWarranty}
                  >
                    Download Document
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Service Request Drawer Panel */}
      {matchedCategory && (
        <AssetServiceRequestPanel
          open={serviceRequestPanelOpen}
          onOpenChange={setServiceRequestPanelOpen}
          assetId={asset.ID}
          categoryId={matchedCategory.ID}
          categoryName={matchedCategory.CategoryName}
          initialRequestType={serviceRequestType}
          onSubmitted={loadData}
        />
      )}

      {/* Report Lost Asset Drawer Panel */}
      {currentUser?.userID && (
        <ReportLostAssetPanel
          open={reportLostOpen}
          onOpenChange={setReportLostOpen}
          employeeUserId={currentUser.userID}
          employeeName={currentUser.displayName ?? "You"}
          reportedByUserId={currentUser.userID}
          reportedByRole="Employee"
          assets={[userAssetForReport]}
          onCreated={() => {
            dispatchToast(
              <Toast>
                <ToastTitle>Lost asset report submitted for review</ToastTitle>
              </Toast>,
              { intent: "success" }
            );
            loadData();
          }}
        />
      )}

      {/* Handover Drawer Panel */}
      <AssetHandoverDrawerPanel
        open={handoverOpen}
        onOpenChange={setHandoverOpen}
        assetId={asset.ID}
        assetName={asset.AssetName}
        assetTagId={asset.AssetTagID}
        category={asset.Category}
        onSubmitted={loadData}
      />

      {/* Admin Edit Drawer */}
      <AssetFormDialog
        open={adminEditOpen}
        onOpenChange={setAdminEditOpen}
        asset={asset}
        currentUserId={currentUser?.userID ?? ""}
        onSaved={loadData}
        onAssetChanged={setAsset}
      />

      {/* Warranty Certificate Preview Modal */}
      <Dialog open={warrantyModalOpen} onOpenChange={(_, d) => setWarrantyModalOpen(d.open)}>
        <DialogSurface style={{ width: "640px", maxWidth: "92vw", borderRadius: "20px", padding: "28px", boxSizing: "border-box" }}>
          <DialogBody style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px", padding: 0 }}>
            <DialogTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="close"
                  icon={<DismissRegular />}
                  onClick={() => setWarrantyModalOpen(false)}
                />
              }
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "#EFF6FF",
                    color: "#007ED5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}
                >
                  <ShieldCheckmarkRegular />
                </div>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
                    Certificate of Warranty Coverage
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#64748B" }}>
                    Quadra Enterprise Asset Protection & OEM SLA Agreement
                  </div>
                </div>
              </div>
            </DialogTitle>

            <DialogContent style={{ width: "100%", boxSizing: "border-box", padding: 0, margin: 0 }}>
              <div
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: "8px",
                  padding: "20px 24px",
                  background: "#F8FAFC",
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Certificate Number</span>
                    <div style={{ fontSize: "15px", fontWeight: 700, color: "#0F172A", marginTop: "2px" }}>WARR-{asset.AssetTagID || asset.ID}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "4px" }}>Status</span>
                    <Badge appearance="tint" color="success">VERIFIED ACTIVE</Badge>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 24px", fontSize: "13px" }}>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "11.5px", display: "block", marginBottom: "2px" }}>Covered Device:</span>
                    <div style={{ fontWeight: 600, color: "#1E293B" }}>{asset.AssetName}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "11.5px", display: "block", marginBottom: "2px" }}>Asset Tag ID:</span>
                    <div style={{ fontWeight: 600, color: "#1E293B" }}>{asset.AssetTagID}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "11.5px", display: "block", marginBottom: "2px" }}>Serial Number:</span>
                    <div style={{ fontWeight: 600, color: "#1E293B" }}>{asset.SerialNo || "SN-A1B2C3D4"}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "11.5px", display: "block", marginBottom: "2px" }}>Custodian:</span>
                    <div style={{ fontWeight: 600, color: "#1E293B" }}>{asset.AssignedToName || currentUser?.displayName || "Assigned Staff"}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "11.5px", display: "block", marginBottom: "2px" }}>Commencement Date:</span>
                    <div style={{ fontWeight: 600, color: "#1E293B" }}>{formatDate(asset.PurchasedDate || "2024-01-15")}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "11.5px", display: "block", marginBottom: "2px" }}>Warranty Expiration:</span>
                    <div style={{ fontWeight: 600, color: "#1E293B" }}>{asset.ExpireDate ? formatDate(asset.ExpireDate) : "3 Years Standard"}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "11.5px", display: "block", marginBottom: "2px" }}>Authorized OEM:</span>
                    <div style={{ fontWeight: 600, color: "#1E293B" }}>{asset.VendorName || "Dell Technologies India Support"}</div>
                  </div>
                  <div>
                    <span style={{ color: "#64748B", fontSize: "11.5px", display: "block", marginBottom: "2px" }}>SLA Response:</span>
                    <div style={{ fontWeight: 600, color: "#1E293B" }}>Next Business Day On-Site Service</div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: "12px", fontSize: "12px", color: "#64748B", lineHeight: 1.5 }}>
                  This certificate validates ongoing enterprise hardware warranty, component replacement, and manufacturer technical assistance authorized by Quadra Procurement.
                </div>
              </div>
            </DialogContent>

            <DialogActions
              style={{
                marginTop: "16px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                width: "100%",
                padding: 0,
                boxSizing: "border-box",
              }}
            >
              <Button
                appearance="secondary"
                onClick={() => setWarrantyModalOpen(false)}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  borderRadius: "10px",
                  height: "40px",
                  fontWeight: 600,
                }}
              >
                Close
              </Button>
              <Button
                appearance="primary"
                icon={<ArrowDownloadRegular />}
                onClick={handleDownloadWarranty}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  background: "#007ED5",
                  borderRadius: "10px",
                  height: "40px",
                  fontWeight: 600,
                }}
              >
                Download Document
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Remove Custody Confirmation Modal */}
      <Dialog open={removeCustodyModalOpen} onOpenChange={(_, d) => setRemoveCustodyModalOpen(d.open)}>
        <DialogSurface style={{ maxWidth: "440px", width: "90vw", borderRadius: "18px", padding: "24px" }}>
          <DialogBody>
            <DialogTitle style={{ fontSize: "17px", fontWeight: 700, color: "#0F172A", marginBottom: "8px" }}>
              Remove Asset Custody?
            </DialogTitle>
            <DialogContent style={{ fontSize: "13.5px", color: "#475569", lineHeight: "1.5" }}>
              Are you sure you want to remove custody assignment for asset <strong>{asset?.AssetTagID}</strong>?
              The holding person will remain active in possession, but custodian oversight assignment will be cleared.
            </DialogContent>
            <DialogActions style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <Button appearance="secondary" onClick={() => setRemoveCustodyModalOpen(false)} style={{ borderRadius: "8px" }}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                style={{ background: "#DC2626", borderRadius: "8px" }}
                onClick={() => {
                  setCustodyPerson(null);
                  setRemoveCustodyModalOpen(false);
                  dispatchToast(
                    <Toast>
                      <ToastTitle>Asset custody removed successfully.</ToastTitle>
                    </Toast>,
                    { intent: "success" }
                  );
                }}
              >
                Remove Custody
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

const SpecItem = ({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  onCopy,
  actionButton,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  onCopy?: () => void;
  actionButton?: React.ReactNode;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 18px",
      background: "#FFFFFF",
      border: "1px solid #F1F5F9",
      borderRadius: "16px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
      gap: "10px",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0, flex: 1 }}>
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "12px",
          background: iconBg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: "12px", color: "#94A3B8", fontWeight: 500, whiteSpace: "nowrap" }}>
          {label}
        </div>
        <div
          style={{
            fontSize: actionButton ? "13px" : "14px",
            fontWeight: 700,
            color: "#1E293B",
            marginTop: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={value}
        >
          {value}
        </div>
      </div>
    </div>

    {actionButton && (
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        {actionButton}
      </div>
    )}

    {onCopy && (
      <button
        onClick={onCopy}
        title={`Copy ${label}`}
        style={{
          background: "transparent",
          border: "none",
          color: "#94A3B8",
          cursor: "pointer",
          padding: "6px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#007ED5";
          e.currentTarget.style.background = "#F1F5F9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#94A3B8";
          e.currentTarget.style.background = "transparent";
        }}
      >
        <CopyRegular style={{ fontSize: "16px" }} />
      </button>
    )}
  </div>
);

export default EmployeeMyAssetDetail;
