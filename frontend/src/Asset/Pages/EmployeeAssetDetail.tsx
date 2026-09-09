import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Button,
  Text,
  Spinner,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Combobox,
  Option,
  Checkbox,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  MailRegular,
  BuildingRegular,
  BoxRegular,
  AddRegular,
  DeleteRegular,
  WarningRegular,
  ArrowRightRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { getCategoryIcon } from "../Utils/categoryIcon";
import {
  getAssetModuleEmployeeById,
  getAssetModuleEmployees,
  getUserAssignedAssets,
  AssetModuleEmployee,
  UserAssignedAsset,
} from "../Services/AssetEmployeeService";
import {
  getAssetInventoryList,
  assignAssetToUser,
  returnAssetFromUser,
  AssetInventoryRecord,
} from "../Services/AssetInventoryService";
import { getAssetRoleMismatchesForUser } from "../Services/AssetRoleTemplateService";
import { getPendingLostItemsForUser } from "../Services/AssetLostRequestService";
import ReportLostAssetPanel from "../Components/ReportLostAssetPanel";
import QuadraPillToggle from "../../Common/QuadraPillToggle";

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

const getCategoryTheme = (category: string) => {
  const c = (category || "").toLowerCase();
  if (c.includes("laptop") || c.includes("macbook") || c.includes("thinkpad")) {
    return { bg: "#E8FBF0", color: "#10B981" };
  }
  if (c.includes("headphone") || c.includes("audio") || c.includes("earphone")) {
    return { bg: "#F5E8FB", color: "#A855F7" };
  }
  if (c.includes("monitor") || c.includes("display") || c.includes("screen")) {
    return { bg: "#E6F0FF", color: "#3B82F6" };
  }
  if (c.includes("mobile") || c.includes("phone")) {
    return { bg: "#FFF7ED", color: "#F97316" };
  }
  return { bg: "#F1F5F9", color: "#64748B" };
};

const EmployeeAssetDetail: React.FC = () => {
  const params = useParams<{ userId?: string; id?: string }>();
  const userId = params.userId || params.id;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("employee-asset-detail-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [employee, setEmployee] = useState<AssetModuleEmployee | null>(null);
  const [assets, setAssets] = useState<UserAssignedAsset[]>([]);
  const [assetTypeFilter, setAssetTypeFilter] = useState<"All" | "IT" | "Non-IT">("All");
  const [loading, setLoading] = useState(true);
  const [mismatchedCategories, setMismatchedCategories] = useState<Set<string>>(new Set());

  const [addOpen, setAddOpen] = useState(false);
  const [inStockAssets, setInStockAssets] = useState<AssetInventoryRecord[]>([]);
  const [assetQuery, setAssetQuery] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const [removeTarget, setRemoveTarget] = useState<UserAssignedAsset | null>(null);
  const [removing, setRemoving] = useState(false);

  const [targetLostAsset, setTargetLostAsset] = useState<UserAssignedAsset | null>(null);
  const [pendingLostAssetIds, setPendingLostAssetIds] = useState<Set<string>>(new Set());
  const [reportLostOpen, setReportLostOpen] = useState(false);

  const loadData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Resilient employee profile fetch
      let emp = await getAssetModuleEmployeeById(userId).catch(() => null);
      if (!emp) {
        const listRes = await getAssetModuleEmployees(1, 100).catch(() => null);
        emp = listRes?.users?.find((u) => u.ID === userId) || null;
      }
      if (!emp) {
        emp = {
          ID: userId,
          DisplayName:
            userId
              .replace(/^emp-|^local-/, "")
              .replace(/-/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()) || "Employee Profile",
          Mail: `${userId}@quadra.example`,
          EmployeeId: `QRA-${userId.slice(-4).toUpperCase()}`,
          JobTitle: "Team Member",
          Department: "General",
          AssetRole: "Employee",
          AssetRoleName: "Employee",
        };
      }

      const [userAssets, mismatches, pendingLost] = await Promise.all([
        getUserAssignedAssets(userId).catch(() => []),
        getAssetRoleMismatchesForUser(userId).catch(() => []),
        getPendingLostItemsForUser(userId).catch(() => []),
      ]);

      setEmployee(emp);
      setAssets(userAssets || []);
      setMismatchedCategories(new Set((mismatches || []).map((m) => m.CategoryName.trim().toLowerCase())));
      setPendingLostAssetIds(
        new Set(
          (pendingLost || [])
            .filter((p) => p.ItemStatus === "Pending" || p.ItemStatus === "PendingManagerApproval")
            .map((p) => p.AssetID)
        )
      );
    } catch (error) {
      console.error("Failed to load employee asset details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleReportLost = (asset: UserAssignedAsset) => {
    setTargetLostAsset(asset);
    setReportLostOpen(true);
  };

  const visibleAssets = assets.filter((asset) => {
    if (assetTypeFilter === "All") return true;
    const nonIt = /non|furniture|chair|desk|vehicle|stationery/i.test(asset.Category);
    return assetTypeFilter === "Non-IT" ? nonIt : !nonIt;
  });

  const openAddDialog = async () => {
    setAddOpen(true);
    setSelectedAssetId(null);
    setAssetQuery("");
    try {
      const all = await getAssetInventoryList();
      setInStockAssets(all.filter((a) => a.Status === "In Stock"));
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load in-stock assets"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  const filteredInStock = useMemo(() => {
    const term = assetQuery.trim().toLowerCase();
    if (!term) return inStockAssets;
    return inStockAssets.filter(
      (a) =>
        a.AssetName.toLowerCase().includes(term) ||
        a.AssetTagID.toLowerCase().includes(term) ||
        a.Category.toLowerCase().includes(term)
    );
  }, [inStockAssets, assetQuery]);

  const handleAssign = async () => {
    if (!userId || !selectedAssetId || !currentUser?.userID) return;
    setAssigning(true);
    try {
      await assignAssetToUser(selectedAssetId, userId, currentUser.userID);
      dispatchToast(
        <Toast>
          <ToastTitle>Asset assigned successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setAddOpen(false);
      await loadData();
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to assign asset"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget || !currentUser?.userID) return;
    setRemoving(true);
    try {
      await returnAssetFromUser(removeTarget.AssetID, currentUser.userID);
      dispatchToast(
        <Toast>
          <ToastTitle>Asset removed from employee</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setRemoveTarget(null);
      await loadData();
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to remove asset"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setRemoving(false);
    }
  };

  // Get initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
      {portal}
      <div style={{ padding: "24px 32px", display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Back Link */}
        <button
          onClick={() => navigate("/Asset/employees")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "none",
            border: "none",
            color: "#64748b",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            padding: 0,
            width: "fit-content",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#007ED5")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
        >
          <ArrowLeftRegular style={{ fontSize: "16px" }} />
          <span>Back to Employee List</span>
        </button>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
            <Spinner label="Loading employee profile..." />
          </div>
        ) : !employee ? (
          <div style={{ textAlign: "center", padding: "60px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid #E2E8F0" }}>
            <Text size={400} weight="semibold" style={{ color: "#0F172A", display: "block" }}>Employee profile could not be found.</Text>
            <div style={{ marginTop: "16px" }}>
              <Button appearance="primary" onClick={loadData}>Retry</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Hero Profile Card - Matching Employee List-2.png */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #E2E8F0",
                borderRadius: "20px",
                padding: "32px 36px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                {/* 88px Gradient Avatar Circle */}
                <div
                  style={{
                    width: "88px",
                    height: "88px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #4F80E1 0%, #9B72CF 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "28px",
                    fontWeight: 700,
                    boxShadow: "0 8px 16px rgba(79, 128, 225, 0.25)",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(employee.DisplayName)}
                </div>

                <div>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: "26px",
                      fontWeight: 700,
                      color: "#0F172A",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {employee.DisplayName}
                  </h1>
                  <div style={{ fontSize: "15px", color: "#64748B", marginTop: "4px", fontWeight: 500 }}>
                    {employee.JobTitle || "Frontend Developer"}
                  </div>
                </div>
              </div>

              {/* Right Side Info Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                {/* Email Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#F8FAFC",
                    border: "1px solid #F1F5F9",
                    padding: "10px 16px",
                    borderRadius: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#EFF6FF",
                      color: "#2563EB",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    <MailRegular />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Email
                    </div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1E293B" }}>
                      {employee.Mail || "—"}
                    </div>
                  </div>
                </div>

                {/* Group Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#F8FAFC",
                    border: "1px solid #F1F5F9",
                    padding: "10px 16px",
                    borderRadius: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#FAF5FF",
                      color: "#9333EA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    <BuildingRegular />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Group
                    </div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1E293B" }}>
                      {employee.Department || "CAISG"}
                    </div>
                  </div>
                </div>

                {/* Total Assets Badge */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "#F8FAFC",
                    border: "1px solid #F1F5F9",
                    padding: "10px 16px",
                    borderRadius: "14px",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "12px",
                      background: "#ECFDF5",
                      color: "#059669",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                    }}
                  >
                    <BoxRegular />
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Total Assets
                    </div>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#1E293B" }}>
                      {assets.length} items
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Header with + Add Asset Pill Button */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginTop: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700, color: "#0F172A" }}>
                  Assigned Assets
                </h2>
                <button
                  onClick={openAddDialog}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#ffffff",
                    border: "1.5px solid #007ED5",
                    color: "#007ED5",
                    borderRadius: "9999px",
                    padding: "7px 18px",
                    fontSize: "13.5px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0, 126, 213, 0.1)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#007ED5";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#ffffff";
                    e.currentTarget.style.color = "#007ED5";
                  }}
                >
                  <AddRegular style={{ fontSize: "15px" }} />
                  <span>Add Asset</span>
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* Filter Pills matching Screenshot 1 pill toggle */}
                <QuadraPillToggle<"All" | "IT" | "Non-IT">
                  size="sm"
                  options={[
                    { key: "All", label: "All assets" },
                    { key: "IT", label: "IT" },
                    { key: "Non-IT", label: "Non-IT" },
                  ]}
                  value={assetTypeFilter}
                  onChange={setAssetTypeFilter}
                />
              </div>
            </div>

            {/* Assigned Assets Grid - 2 columns matching Employee List-2.png */}
            {visibleAssets.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  padding: "48px",
                  textAlign: "center",
                  border: "1px solid #E2E8F0",
                  color: "#64748B",
                }}
              >
                No assets currently assigned to this employee.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(440px, 1fr))",
                  gap: "20px",
                }}
              >
                {visibleAssets.map((asset) => {
                  const categoryKey = (asset.Category || "").trim().toLowerCase();
                  const isMismatched = mismatchedCategories.has(categoryKey);
                  const isPendingLost = pendingLostAssetIds.has(asset.AssetID);
                  const theme = getCategoryTheme(asset.Category);

                  return (
                    <div
                      key={asset.MappingID}
                      onClick={() =>
                        navigate(`/Asset/my-assets/${asset.AssetID || asset.MappingID}`, {
                          state: {
                            asset,
                            fromEmployee: userId,
                            employeeName: employee?.DisplayName,
                            employeeId: userId,
                          },
                        })
                      }
                      style={{
                        background: "#ffffff",
                        border: "1px solid #E2E8F0",
                        borderRadius: "16px",
                        padding: "24px",
                        position: "relative",
                        boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.borderColor = "#93C5FD";
                        e.currentTarget.style.boxShadow = "0 12px 24px -4px rgba(0, 126, 213, 0.12)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = "#E2E8F0";
                        e.currentTarget.style.boxShadow = "0 2px 10px rgba(0, 0, 0, 0.02)";
                      }}
                    >
                      {/* Top Row: Icon squircle + Asset Name + Active Badge */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                          {/* Pastel Icon Squircle */}
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "14px",
                              background: theme.bg,
                              color: theme.color,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "22px",
                              flexShrink: 0,
                            }}
                          >
                            {getCategoryIcon(asset.Category)}
                          </div>

                          <div>
                            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B", lineHeight: 1.3 }}>
                              {asset.AssetName}
                            </div>
                            <div style={{ fontSize: "12px", color: "#94A3B8", marginTop: "2px" }}>
                              {asset.AssetTagID}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isPendingLost ? (
                            <span
                              style={{
                                background: "#FEF2F2",
                                color: "#DC2626",
                                border: "1px solid #FECACA",
                                borderRadius: "9999px",
                                padding: "4px 12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                display: "inline-block",
                              }}
                            >
                              Reported Lost
                            </span>
                          ) : isMismatched ? (
                            <span
                              style={{
                                background: "#FFFBEB",
                                color: "#D97706",
                                border: "1px solid #FDE68A",
                                borderRadius: "9999px",
                                padding: "4px 12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                display: "inline-block",
                              }}
                            >
                              Role Mismatch
                            </span>
                          ) : (
                            <span
                              style={{
                                background: "#ECFDF5",
                                color: "#10B981",
                                border: "1px solid #A7F3D0",
                                borderRadius: "9999px",
                                padding: "4px 12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                display: "inline-block",
                              }}
                            >
                              Active
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Middle Details */}
                      <div
                        style={{
                          marginTop: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "5px",
                          fontSize: "13px",
                          color: "#64748B",
                        }}
                      >
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{ color: "#94A3B8", width: "70px" }}>Type:</span>
                          <span style={{ color: "#334155", fontWeight: 500 }}>{asset.Category}</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{ color: "#94A3B8", width: "70px" }}>Serial:</span>
                          <span style={{ color: "#334155", fontWeight: 500 }}>{asset.SerialNo ?? asset.AssetTagID}</span>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <span style={{ color: "#94A3B8", width: "70px" }}>Assigned:</span>
                          <span style={{ color: "#334155", fontWeight: 500 }}>{formatDate(asset.AssignedAt)}</span>
                        </div>
                      </div>

                      {/* Bottom Row: Location & Details link + Action buttons */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "16px",
                          paddingTop: "12px",
                          borderTop: "1px solid #F1F5F9",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#007ED5", fontSize: "12.5px", fontWeight: 600 }}>
                          <span>View Full Details</span>
                          <ArrowRightRegular style={{ fontSize: "13px" }} />
                        </div>

                        {/* Action Buttons: Report Lost nearby Delete */}
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {/* Report Lost Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReportLost(asset);
                            }}
                            title={isPendingLost ? "Report already pending review" : "Report this asset as lost"}
                            disabled={isPendingLost}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              background: isPendingLost ? "#F8FAFC" : "#FFFFFF",
                              border: isPendingLost ? "1px solid #E2E8F0" : "1px solid #FCA5A5",
                              color: isPendingLost ? "#94A3B8" : "#DC2626",
                              borderRadius: "8px",
                              padding: "5px 12px",
                              fontSize: "12.5px",
                              fontWeight: 600,
                              cursor: isPendingLost ? "not-allowed" : "pointer",
                              transition: "all 0.15s ease",
                              boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
                            }}
                            onMouseEnter={(e) => {
                              if (!isPendingLost) {
                                e.currentTarget.style.background = "#FEF2F2";
                                e.currentTarget.style.borderColor = "#EF4444";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isPendingLost) {
                                e.currentTarget.style.background = "#FFFFFF";
                                e.currentTarget.style.borderColor = "#FCA5A5";
                              }
                            }}
                          >
                            <WarningRegular style={{ fontSize: "15px" }} />
                            <span>{isPendingLost ? "Reported Lost" : "Report Lost"}</span>
                          </button>

                          {/* Red Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRemoveTarget(asset);
                            }}
                            title="Unassign / Return Asset"
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#EF4444",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#FEF2F2";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <DeleteRegular style={{ fontSize: "18px" }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Asset dialog */}
      <Dialog open={addOpen} onOpenChange={(_, d) => setAddOpen(d.open)}>
        <DialogSurface mountNode={mountNode}>
          <DialogBody>
            <DialogTitle>Add Asset</DialogTitle>
            <DialogContent>
              <Combobox
                placeholder="Search in-stock assets by name, tag, or category..."
                mountNode={mountNode}
                value={assetQuery}
                onChange={(e) => setAssetQuery(e.target.value)}
                onOptionSelect={(_, d) => {
                  setSelectedAssetId(d.optionValue ?? null);
                  const picked = inStockAssets.find((a) => a.ID === d.optionValue);
                  if (picked) setAssetQuery(`${picked.AssetName} (${picked.AssetTagID})`);
                }}
              >
                {filteredInStock.length === 0 ? (
                  <Option key="none" value="" disabled>
                    No in-stock assets found
                  </Option>
                ) : (
                  filteredInStock.map((asset) => (
                    <Option key={asset.ID} value={asset.ID} text={`${asset.AssetName} (${asset.AssetTagID})`}>
                      {asset.AssetName} — {asset.Category} ({asset.AssetTagID})
                    </Option>
                  ))
                )}
              </Combobox>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setAddOpen(false)} disabled={assigning}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleAssign} disabled={!selectedAssetId || assigning}>
                {assigning ? <Spinner size="tiny" /> : "Assign Asset"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {/* Remove confirmation dialog */}
      <Dialog open={!!removeTarget} onOpenChange={(_, d) => !d.open && setRemoveTarget(null)}>
        <DialogSurface mountNode={mountNode}>
          <DialogBody>
            <DialogTitle>Remove Asset</DialogTitle>
            <DialogContent>
              <Text>
                Are you sure you want to remove <strong>{removeTarget?.AssetName}</strong> from {employee?.DisplayName}? This
                will return the asset to stock.
              </Text>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setRemoveTarget(null)} disabled={removing}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={handleRemove} disabled={removing}>
                {removing ? <Spinner size="tiny" /> : "Yes, Remove"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>

      {employee && currentUser?.userID && (
        <ReportLostAssetPanel
          open={reportLostOpen}
          onOpenChange={setReportLostOpen}
          employeeUserId={employee.ID}
          employeeName={employee.DisplayName}
          reportedByUserId={currentUser.userID}
          reportedByRole="Admin"
          assets={targetLostAsset ? [targetLostAsset] : []}
          onCreated={() => {
            setTargetLostAsset(null);
            loadData();
          }}
        />
      )}
    </>
  );
};

export default EmployeeAssetDetail;
