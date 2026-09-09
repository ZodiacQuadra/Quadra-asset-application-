import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Badge,
  Spinner,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Checkbox,
} from "@fluentui/react-components";
import {
  AddRegular,
  Dismiss24Regular,
  SearchRegular,
  BuildingMultipleRegular,
  PersonRegular,
  CheckmarkRegular,
  BoxRegular,
  PeopleTeamRegular,
  ClockRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { getAssetHRRequests, AssetHRRequestRecord } from "../Services/AssetHRRequestService";
import { getAssetInventoryList, AssetInventoryRecord, assignAssetToUser } from "../Services/AssetInventoryService";
import { getCategoryIcon } from "../Utils/categoryIcon";

interface CandidateRequisition {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "Pending" | "Completed";
  comboName: string;
  items: { category: string; assigned: boolean; assetName?: string; assetTag?: string }[];
}

const INITIAL_CANDIDATES: CandidateRequisition[] = [
  {
    id: "cand-1",
    name: "Rahul Sharma",
    role: "Software Engineering",
    department: "Engineering",
    status: "Pending",
    comboName: "Company Asset combo",
    items: [
      { category: "Laptop", assigned: true, assetName: "MacBook Pro 14", assetTag: "AST-092" },
      { category: "Mouse", assigned: true, assetName: "Logitech MX Master 3S", assetTag: "AST-104" },
      { category: "Monitor", assigned: false },
      { category: "Keyboard", assigned: false },
    ],
  },
  {
    id: "cand-2",
    name: "Santhosh Kumar",
    role: "Software Development",
    department: "Engineering",
    status: "Completed",
    comboName: "Company Asset combo",
    items: [
      { category: "Laptop", assigned: true, assetName: "ThinkPad T14s", assetTag: "AST-041" },
      { category: "Mouse", assigned: true, assetName: "Logitech B100", assetTag: "AST-055" },
      { category: "Monitor", assigned: true, assetName: "Dell UltraSharp 27", assetTag: "AST-082" },
      { category: "Keyboard", assigned: true, assetName: "Logitech K120", assetTag: "AST-063" },
    ],
  },
  {
    id: "cand-3",
    name: "Ananya Iyer",
    role: "Product Designer",
    department: "Design",
    status: "Pending",
    comboName: "Design Specialist Kit",
    items: [
      { category: "Laptop", assigned: true, assetName: "MacBook Pro 16", assetTag: "AST-018" },
      { category: "Monitor", assigned: false },
      { category: "Mouse", assigned: false },
      { category: "Headphone", assigned: false },
    ],
  },
];

const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("hr-dashboard-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [hrRequests, setHrRequests] = useState<AssetHRRequestRecord[]>([]);
  const [candidates, setCandidates] = useState<CandidateRequisition[]>(INITIAL_CANDIDATES);
  const [loading, setLoading] = useState(true);

  // Assign Drawer state matching HR Requests-assign.png
  const [assignDrawerOpen, setAssignDrawerOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<CandidateRequisition | null>(null);
  const [activeItemCategory, setActiveItemCategory] = useState<string | null>(null);
  const [inStockAssets, setInStockAssets] = useState<AssetInventoryRecord[]>([]);
  const [searchAsset, setSearchAsset] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getAssetHRRequests(currentUser?.userID).catch(() => []),
      getAssetInventoryList().catch(() => []),
    ])
      .then(([reqs, inventory]) => {
        setHrRequests(reqs);
        setInStockAssets(inventory.filter((a) => a.Status === "In Stock"));
      })
      .finally(() => setLoading(false));
  }, [currentUser?.userID]);

  const openAssignModal = (cand: CandidateRequisition, category: string) => {
    setActiveCandidate(cand);
    setActiveItemCategory(category);
    setSelectedAssetId(null);
    setSearchAsset("");
    setAssignDrawerOpen(true);
  };

  const filteredAssets = useMemo(() => {
    let list = inStockAssets;
    if (activeItemCategory) {
      list = list.filter((a) => a.Category.toLowerCase().includes(activeItemCategory.toLowerCase()));
      if (list.length === 0) list = inStockAssets; // fallback if specific category has no in-stock items
    }
    if (searchAsset.trim()) {
      const term = searchAsset.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.AssetName.toLowerCase().includes(term) ||
          a.AssetTagID.toLowerCase().includes(term) ||
          a.Category.toLowerCase().includes(term)
      );
    }
    return list;
  }, [inStockAssets, activeItemCategory, searchAsset]);

  const handleConfirmAssign = async () => {
    if (!selectedAssetId || !activeCandidate || !activeItemCategory) return;
    setAssigning(true);
    try {
      const chosen = inStockAssets.find((a) => a.ID === selectedAssetId);
      // Attempt backend assignment if valid user
      if (currentUser?.userID) {
        await assignAssetToUser(selectedAssetId, currentUser.userID, currentUser.userID).catch(() => {});
      }

      // Update local state
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.id !== activeCandidate.id) return c;
          const updatedItems = c.items.map((it) =>
            it.category === activeItemCategory
              ? { ...it, assigned: true, assetName: chosen?.AssetName || "Assigned Device", assetTag: chosen?.AssetTagID || "AST-099" }
              : it
          );
          const allDone = updatedItems.every((it) => it.assigned);
          return {
            ...c,
            items: updatedItems,
            status: allDone ? "Completed" : "Pending",
          };
        })
      );

      dispatchToast(
        <Toast>
          <ToastTitle>Asset assigned to {activeCandidate.name} successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setAssignDrawerOpen(false);
    } catch (err) {
      dispatchToast(
        <Toast>
          <ToastTitle>{err instanceof Error ? err.message : "Failed to assign asset"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setAssigning(false);
    }
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
      {portal}
      <div
        style={{
          padding: "28px 36px",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        {/* Header with Greeting, Subtitle, and Quick Navigation Actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#0F172A" }}>
              HR Asset Command Center
            </h1>
            <div style={{ fontSize: "14px", color: "#64748B", marginTop: "4px" }}>
              Manage employee onboarding equipment, bulk assignments, and department requisitions.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => navigate("/Asset/hr/my-dashboard")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                color: "#1E293B",
                borderRadius: "9999px",
                padding: "8px 20px",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
            >
              <PersonRegular style={{ fontSize: "16px", color: "#CA5010" }} />
              <span>My Dashboard</span>
            </button>

            <button
              onClick={() => navigate("/Asset/organization")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                color: "#1E293B",
                borderRadius: "9999px",
                padding: "8px 20px",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
            >
              <BuildingMultipleRegular style={{ fontSize: "16px", color: "#0B8484" }} />
              <span>Organization View</span>
            </button>

            <button
              onClick={() => navigate("/Asset/new-request")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#007ED5",
                border: "none",
                color: "#FFFFFF",
                borderRadius: "9999px",
                padding: "8px 22px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#006bb8")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#007ED5")}
            >
              <AddRegular style={{ fontSize: "16px" }} />
              <span>New Requisition</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "18px" }}>
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "16px",
              padding: "20px 24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Pending Requisitions</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#FEF3C7", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ClockRegular style={{ fontSize: "18px" }} />
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0F172A", marginTop: "12px" }}>
              {candidates.filter((c) => c.status === "Pending").length}
            </div>
            <div style={{ fontSize: "12px", color: "#D97706", marginTop: "4px", fontWeight: 600 }}>
              Requires device allocation
            </div>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "16px",
              padding: "20px 24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Total Onboardings</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PeopleTeamRegular style={{ fontSize: "18px" }} />
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0F172A", marginTop: "12px" }}>
              14
            </div>
            <div style={{ fontSize: "12px", color: "#2563EB", marginTop: "4px", fontWeight: 600 }}>
              New hires this month
            </div>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "16px",
              padding: "20px 24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>Completed Packages</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ECFDF5", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckmarkRegular style={{ fontSize: "18px" }} />
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0F172A", marginTop: "12px" }}>
              {candidates.filter((c) => c.status === "Completed").length + 2}
            </div>
            <div style={{ fontSize: "12px", color: "#10B981", marginTop: "4px", fontWeight: 600 }}>
              Ready for handover
            </div>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "16px",
              padding: "20px 24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>In-Stock Hardware</span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#FAF5FF", color: "#9333EA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BoxRegular style={{ fontSize: "18px" }} />
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0F172A", marginTop: "12px" }}>
              {inStockAssets.length}
            </div>
            <div style={{ fontSize: "12px", color: "#9333EA", marginTop: "4px", fontWeight: 600 }}>
              Available to assign immediately
            </div>
          </div>
        </div>

        {/* Onboarding Requisitions Queue matching HR Requests-assign.png */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700, color: "#0F172A" }}>
              Recent Onboarding Requisitions
            </h2>
            <span style={{ fontSize: "13px", color: "#64748B" }}>
              {candidates.length} active onboarding requisitions
            </span>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
              <Spinner label="Loading HR requests..." />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {candidates.map((cand) => {
                const isPending = cand.status === "Pending";

                return (
                  <div
                    key={cand.id}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: "18px",
                      padding: "24px",
                      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.02)",
                      display: "flex",
                      flexDirection: "column",
                      gap: "18px",
                    }}
                  >
                    {/* Top Row: Candidate Avatar, Name, Role, Status */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            background: isPending ? "#EFF6FF" : "#ECFDF5",
                            color: isPending ? "#2563EB" : "#10B981",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "20px",
                            fontWeight: 700,
                          }}
                        >
                          <PersonRegular />
                        </div>
                        <div>
                          <div style={{ fontSize: "16.5px", fontWeight: 700, color: "#0F172A" }}>
                            {cand.name}
                          </div>
                          <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
                            {cand.role} • {cand.department}
                          </div>
                        </div>
                      </div>

                      <Badge
                        appearance="tint"
                        color={isPending ? "warning" : "success"}
                        size="large"
                        style={{ borderRadius: "9999px", padding: "4px 14px" }}
                      >
                        {cand.status}
                      </Badge>
                    </div>

                    {/* Company Asset Combo container matching HR Requests-assign.png */}
                    <div
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #F1F5F9",
                        borderRadius: "14px",
                        padding: "18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#1E293B", fontSize: "14.5px", fontWeight: 700 }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "8px",
                            background: "#EEF2FF",
                            color: "#4F46E5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <BoxRegular />
                        </div>
                        <span>{cand.comboName}</span>
                      </div>

                      {/* Combo Items */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                          gap: "10px",
                          marginTop: "4px",
                        }}
                      >
                        {cand.items.map((item) => (
                          <div
                            key={item.category}
                            style={{
                              background: "#FFFFFF",
                              border: item.assigned ? "1px solid #A7F3D0" : "1px dashed #CBD5E1",
                              borderRadius: "12px",
                              padding: "10px 14px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "8px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                              <div style={{ fontSize: "18px", color: item.assigned ? "#10B981" : "#94A3B8" }}>
                                {getCategoryIcon(item.category)}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                                  {item.category}
                                </div>
                                {item.assigned ? (
                                  <div style={{ fontSize: "11.5px", color: "#059669", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {item.assetName} ({item.assetTag})
                                  </div>
                                ) : (
                                  <div style={{ fontSize: "11.5px", color: "#94A3B8" }}>
                                    Not assigned yet
                                  </div>
                                )}
                              </div>
                            </div>

                            {!item.assigned && (
                              <button
                                onClick={() => openAssignModal(cand, item.category)}
                                style={{
                                  background: "#007ED5",
                                  border: "none",
                                  color: "#FFFFFF",
                                  borderRadius: "9999px",
                                  padding: "4px 12px",
                                  fontSize: "11.5px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Assign
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Assign Asset Slide-over Drawer - Exactly matching HR Requests-assign.png */}
      <Drawer
        open={assignDrawerOpen}
        onOpenChange={(_, d) => setAssignDrawerOpen(d.open)}
        position="end"
        size="medium"
        mountNode={mountNode}
      >
        <DrawerHeader style={{ borderBottom: "1px solid #E2E8F0", padding: "20px 24px" }}>
          <DrawerHeaderTitle
            action={
              <button
                onClick={() => setAssignDrawerOpen(false)}
                style={{ background: "transparent", border: "none", color: "#64748B", cursor: "pointer" }}
              >
                <Dismiss24Regular />
              </button>
            }
          >
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
              Assign Asset
            </span>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Search for asset * input matching HR Requests-assign.png */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#1E293B", marginBottom: "8px" }}>
              Search for asset <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                border: "1px solid #E2E8F0",
                borderRadius: "10px",
                padding: "10px 14px",
                background: "#FFFFFF",
              }}
            >
              <SearchRegular style={{ color: "#94A3B8", fontSize: "18px" }} />
              <input
                type="text"
                placeholder="Search assets by name, ID, owner..."
                value={searchAsset}
                onChange={(e) => setSearchAsset(e.target.value)}
                style={{ border: "none", outline: "none", width: "100%", fontSize: "13.5px" }}
              />
            </div>
          </div>

          {/* List of In-Stock Assets matching HR Requests-assign.png */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", borderTop: "1px solid #F1F5F9" }}>
            {filteredAssets.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#64748B", fontSize: "13.5px" }}>
                No available in-stock assets found.
              </div>
            ) : (
              filteredAssets.slice(0, 15).map((asset) => {
                const isChecked = selectedAssetId === asset.ID;

                return (
                  <div
                    key={asset.ID}
                    onClick={() => setSelectedAssetId(asset.ID)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 12px",
                      borderBottom: "1px solid #F1F5F9",
                      cursor: "pointer",
                      background: isChecked ? "#F0F7FF" : "transparent",
                      borderRadius: "8px",
                      transition: "background 0.15s ease",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <Checkbox checked={isChecked} onChange={() => setSelectedAssetId(asset.ID)} />
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1E293B" }}>
                          {asset.AssetName}
                        </div>
                        <div style={{ fontSize: "12px", color: "#94A3B8" }}>
                          {asset.AssetTagID}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        background: "#ECFDF5",
                        color: "#10B981",
                        border: "1px solid #A7F3D0",
                        borderRadius: "9999px",
                        padding: "3px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      Available
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Submit Button */}
          <div style={{ marginTop: "auto", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={handleConfirmAssign}
              disabled={!selectedAssetId || assigning}
              style={{
                background: "#007ED5",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "9999px",
                padding: "10px 32px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: !selectedAssetId || assigning ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
                opacity: !selectedAssetId || assigning ? 0.6 : 1,
                transition: "all 0.15s ease",
              }}
            >
              {assigning ? <Spinner size="tiny" /> : "Submit"}
            </button>
          </div>
        </DrawerBody>
      </Drawer>
    </>
  );
};

export default HRDashboard;
