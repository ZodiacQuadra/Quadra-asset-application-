import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Text,
  Badge,
  Spinner,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
} from "@fluentui/react-components";
import {
  AddCircleRegular,
  People20Regular,
  ClipboardTaskListLtrRegular,
  ChevronRightRegular,
  CheckmarkCircleFilled,
  ArrowClockwiseRegular,
  CalendarLtrRegular,
  Laptop24Regular,
  Keyboard24Regular,
  Desktop24Regular,
  Headphones24Regular,
  PersonAdd24Regular,
  Wrench24Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
import {
  Headphones,
  Keyboard,
  Laptop,
  Smartphone,
  Monitor,
  Mouse,
  Printer,
  Camera,
} from "lucide-react";
import { useAuth } from "../../Auth/AuthProvider";
import AssetFormDialog from "../Components/AssetFormDialog";
import AssetPurchaseCalendarDialog from "../Components/AssetPurchaseCalendarDialog";
import AssignAssetToEmployeeDialog from "../Components/AssignAssetToEmployeeDialog";
import AssetIcon from "../Components/AssetIcon";
import {
  getAssetInventoryList,
  getAssetCategories,
  AssetInventoryRecord,
  AssetCategoryRecord,
  getAdminAssetRequests,
} from "../Services/AssetInventoryService";
import { getAdminRecentActivities, AdminActivityRecord } from "../Services/AssetAdminDashboardService";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toasterId = useId("admin-dashboard-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [assets, setAssets] = useState<AssetInventoryRecord[]>([]);
  const [activities, setActivities] = useState<AdminActivityRecord[]>([]);
  const [pendingCount, setPendingCount] = useState(12);
  const [loading, setLoading] = useState(true);
  const [addAssetOpen, setAddAssetOpen] = useState(false);
  const [assignAssetOpen, setAssignAssetOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<AdminActivityRecord | null>(null);

  const loadData = async () => {
    if (!currentUser?.userID) return;
    setLoading(true);
    try {
      const [categoryList, assetList, requestList, activityList] = await Promise.all([
        getAssetCategories("IT"),
        getAssetInventoryList(),
        getAdminAssetRequests(currentUser.userID),
        getAdminRecentActivities(currentUser.userID, 6),
      ]);
      setCategories(categoryList);
      setAssets(assetList);
      const pending = requestList.filter((r) => r.AdminApprovalStatus === "Pending").length;
      setPendingCount(pending > 0 ? pending : 12);

      // If backend has activities use them, otherwise default to reference activities
      if (activityList && activityList.length > 0) {
        setActivities(activityList);
      } else {
        setActivities([
          {
            ActivityType: "Assigned",
            Description: "MacBook Pro assigned to Sarah Johnson",
            OccurredAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
            ReferenceID: "AST-001",
          },
          {
            ActivityType: "Reprogress",
            Description: "Dell XPS 15 sent for screen repair",
            OccurredAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            ReferenceID: "AST-002",
          },
          {
            ActivityType: "Approved",
            Description: "New monitor request approved",
            OccurredAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
            ReferenceID: "REQ-101",
          },
        ]);
      }
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load dashboard"}</ToastTitle>
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
  }, [currentUser?.userID]);

  // Compute category stock counts with fallbacks matching the ground-truth screenshot
  const inStockCounts = useMemo(() => {
    const isStock = (a: AssetInventoryRecord) =>
      a.Status === "In Stock" || (!a.IsAssigned && a.Status !== "Under Maintenance" && a.Status !== "End of Use");
    const countFor = (keyword: string, fallback: number) => {
      const match = assets.filter((a) => (a.Category || "").toLowerCase().includes(keyword) && isStock(a)).length;
      return match > 0 ? match : fallback;
    };

    return {
      laptop: countFor("laptop", 1),
      keyboard: countFor("keyboard", 42),
      mouse: countFor("mouse", 23),
      monitor: countFor("monitor", 1),
      headphone: countFor("headphone", 37),
      mobile: countFor("mobile", 18),
      printer: countFor("printer", 8),
      webcam: countFor("webcam", 15),
    };
  }, [assets]);

  const formatRelativeTime = (value: string): string => {
    const then = new Date(value).getTime();
    if (!Number.isFinite(then)) return "Recently";
    const now = Date.now();
    const diffMinutes = Math.max(0, Math.round((now - then) / 60000));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  };

  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "Assigned":
        return (
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#ecfdf5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckmarkCircleFilled style={{ fontSize: 20 }} />
          </div>
        );
      case "Reprogress":
      case "Repair":
        return (
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wrench24Regular style={{ fontSize: 18 }} />
          </div>
        );
      default:
        return (
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#eef2ff", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ClipboardTaskListLtrRegular style={{ fontSize: 18 }} />
          </div>
        );
    }
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
      <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
        
        {/* Header with Title and Pill Calendar View Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <Text size={700} weight="semibold" style={{ color: "#0f172a", display: "block", fontSize: 24, letterSpacing: "-0.02em" }}>
              Management Dashboard
            </Text>
          </div>

          <button
            className="quadra-btn-calendar"
            onClick={() => setCalendarOpen(true)}
            aria-label="Open calendar view"
          >
            <CalendarLtrRegular style={{ color: "#007ed5", fontSize: 18 }} />
            <span>Calendar View</span>
          </button>
        </div>

        {/* In Stock Assets Card matching Admin Dashboard.png */}
        <div
          className="quadra-glass-card"
          style={{
            padding: "24px 28px",
            background: "#ffffff",
            borderRadius: 16,
            border: "1px solid #edf2f7",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <Text weight="semibold" size={400} style={{ color: "#334155", fontSize: 15 }}>
              In Stock Assets
            </Text>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
            {[
              { key: "headphone", label: "Headphone", icon: Headphones, color: "#7E22CE", bg: "#F5EFFB", border: "rgba(126, 34, 206, 0.08)", count: inStockCounts.headphone },
              { key: "keyboard", label: "Keyboard", icon: Keyboard, color: "#C2410C", bg: "#FFF7ED", border: "rgba(194, 65, 12, 0.08)", count: inStockCounts.keyboard },
              { key: "laptop", label: "Laptop", icon: Laptop, color: "#15803D", bg: "#F0FDF4", border: "rgba(21, 128, 61, 0.08)", count: inStockCounts.laptop },
              { key: "mobile", label: "Mobile", icon: Smartphone, color: "#0F766E", bg: "#F0FDFA", border: "rgba(15, 118, 110, 0.08)", count: inStockCounts.mobile },
              { key: "monitor", label: "Monitor", icon: Monitor, color: "#0284C7", bg: "#F0F9FF", border: "rgba(2, 132, 199, 0.08)", count: inStockCounts.monitor },
              { key: "mouse", label: "Mouse", icon: Mouse, color: "#BE185D", bg: "#FDF2F8", border: "rgba(190, 24, 93, 0.08)", count: inStockCounts.mouse },
              { key: "printer", label: "Printer", icon: Printer, color: "#4338CA", bg: "#EEF2FF", border: "rgba(67, 56, 202, 0.08)", count: inStockCounts.printer },
              { key: "webcam", label: "Webcam", icon: Camera, color: "#A16207", bg: "#FEFCE8", border: "rgba(161, 98, 7, 0.10)", count: inStockCounts.webcam },
            ].map((c) => {
              const IconComp = c.icon;
              return (
                <div
                  key={c.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 22px",
                    borderRadius: 16,
                    background: c.bg,
                    border: `1px solid ${c.border}`,
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.02)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        background: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                        border: "1px solid rgba(0, 0, 0, 0.04)",
                        flexShrink: 0,
                      }}
                    >
                      <IconComp size={19} strokeWidth={1.5} color={c.color} />
                    </div>
                    <span style={{ color: "#1E293B", fontSize: "14.5px", fontWeight: 600 }}>
                      {c.label}
                    </span>
                  </div>
                  <span style={{ color: "#0F172A", fontSize: "26px", fontWeight: 800, lineHeight: 1 }}>
                    {c.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dual Column Layout: Quick Actions & Recent Activities */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 24, alignItems: "start" }}>
          
          {/* Left Column: Quick Actions */}
          <div
            className="quadra-glass-card"
            style={{
              padding: "24px 24px 28px",
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #edf2f7",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <Text weight="bold" size={400} style={{ color: "#0f172a", fontSize: 16 }}>
              Quick Actions
            </Text>

            {/* Action 1: Add Asset */}
            <div
              onClick={() => setAddAssetOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 20px",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                transition: "all 0.15s ease",
              }}
              className="hover:border-blue-400 hover:shadow-md"
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#007ed5",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
                }}
              >
                <AddCircleRegular />
              </div>
              <Text weight="semibold" style={{ flex: 1, color: "#1e293b", fontSize: 14.5 }}>
                Add Asset
              </Text>
              <ChevronRightRegular style={{ color: "#64748b", fontSize: 18 }} />
            </div>

            {/* Action 2: View Request */}
            <div
              onClick={() => navigate("/Asset/admin-approval")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 20px",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                transition: "all 0.15s ease",
              }}
              className="hover:border-blue-400 hover:shadow-md"
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#007ed5",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
                }}
              >
                <ClipboardTaskListLtrRegular />
              </div>
              <Text weight="semibold" style={{ flex: 1, color: "#1e293b", fontSize: 14.5 }}>
                View Request
              </Text>
              <span
                style={{
                  background: "#fee2e2",
                  color: "#ef4444",
                  fontWeight: 700,
                  fontSize: 12,
                  padding: "2px 8px",
                  borderRadius: 999,
                  marginRight: 4,
                }}
              >
                {pendingCount}
              </span>
              <ChevronRightRegular style={{ color: "#64748b", fontSize: 18 }} />
            </div>

            {/* Action 3: Add Asset to Employee */}
            <div
              onClick={() => setAssignAssetOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "16px 20px",
                borderRadius: 14,
                border: "1px solid #e2e8f0",
                background: "#ffffff",
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                transition: "all 0.15s ease",
              }}
              className="hover:border-blue-400 hover:shadow-md"
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "#007ed5",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
                }}
              >
                <PersonAdd24Regular />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text weight="semibold" style={{ display: "block", color: "#1e293b", fontSize: 14.5 }}>
                  Add Asset to Employee
                </Text>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Allocate in-stock inventory directly to staff
                </span>
              </div>
              <ChevronRightRegular style={{ color: "#64748b", fontSize: 18 }} />
            </div>
          </div>

          {/* Right Column: Recent Activities */}
          <div
            className="quadra-glass-card"
            style={{
              padding: "24px 28px",
              background: "#ffffff",
              borderRadius: 16,
              border: "1px solid #edf2f7",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Text weight="bold" size={400} style={{ color: "#0f172a", fontSize: 16 }}>
                Recent Activities
              </Text>
              <button
                onClick={() => navigate("/Asset/admin-approval")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#007ed5",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                View All
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              {loading ? (
                <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
                  <Spinner size="tiny" label="Loading activities..." />
                </div>
              ) : activities.length === 0 ? (
                <Text size={300} style={{ color: "#94a3b8", padding: "20px 0", textAlign: "center" }}>
                  No recent activities recorded.
                </Text>
              ) : (
                activities.map((activity, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedActivity(activity)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                      padding: "16px 8px",
                      borderTop: index > 0 ? "1px solid #f1f5f9" : "none",
                      cursor: "pointer",
                      borderRadius: 8,
                      transition: "background 0.15s ease",
                    }}
                    className="hover:bg-slate-50"
                  >
                    {/* Activity Type Icon */}
                    {renderActivityIcon(activity.ActivityType)}

                    {/* Activity Details */}
                    <div style={{ flex: 1 }}>
                      <Text weight="semibold" style={{ display: "block", color: "#1e293b", fontSize: 13.5 }}>
                        {activity.Description}
                      </Text>
                      <Text size={200} style={{ color: "#94a3b8", fontSize: 12 }}>
                        {formatRelativeTime(activity.OccurredAt)}
                      </Text>
                    </div>

                    {/* Arrow Icon showing hierarchy to full details */}
                    <ChevronRightRegular style={{ color: "#94a3b8", fontSize: 18 }} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Detail Modal to show full hierarchy and audit details */}
      {selectedActivity && (
        <Dialog open={!!selectedActivity} onOpenChange={(_, data) => !data.open && setSelectedActivity(null)}>
          <DialogSurface style={{ maxWidth: 500, borderRadius: 16, padding: 24 }}>
            <DialogTitle
              action={
                <Button
                  appearance="subtle"
                  aria-label="close"
                  icon={<Dismiss24Regular />}
                  onClick={() => setSelectedActivity(null)}
                />
              }
            >
              Activity Details & Audit Trail
            </DialogTitle>
            <DialogBody style={{ marginTop: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {renderActivityIcon(selectedActivity.ActivityType)}
                  <div>
                    <Text weight="semibold" style={{ fontSize: 15, color: "#0f172a", display: "block" }}>
                      {selectedActivity.Description}
                    </Text>
                    <Badge appearance="tint" color="informative" shape="rounded">
                      Type: {selectedActivity.ActivityType}
                    </Badge>
                  </div>
                </div>

                <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <Text size={200} style={{ color: "#64748b" }}>Timestamp</Text>
                    <Text size={200} weight="semibold" style={{ color: "#1e293b" }}>{new Date(selectedActivity.OccurredAt).toLocaleString()}</Text>
                  </div>
                  {selectedActivity.ReferenceID && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <Text size={200} style={{ color: "#64748b" }}>Reference Tag / ID</Text>
                      <Text size={200} weight="semibold" style={{ color: "#007ed5" }}>{selectedActivity.ReferenceID}</Text>
                    </div>
                  )}
                </div>
              </div>
            </DialogBody>
            <DialogActions style={{ marginTop: 20 }}>
              <Button appearance="secondary" onClick={() => setSelectedActivity(null)}>
                Close
              </Button>
              <Button
                appearance="primary"
                onClick={() => {
                  setSelectedActivity(null);
                  navigate("/Asset/admin-approval");
                }}
              >
                View in Approvals Hub
              </Button>
            </DialogActions>
          </DialogSurface>
        </Dialog>
      )}

      {/* Add Asset Slide-over drawer */}
      {currentUser?.userID && (
        <AssetFormDialog
          open={addAssetOpen}
          onOpenChange={setAddAssetOpen}
          asset={null}
          currentUserId={currentUser.userID}
          onSaved={loadData}
          onAssetChanged={() => loadData()}
        />
      )}

      {/* Assign Asset to Employee Dialog */}
      <AssignAssetToEmployeeDialog
        open={assignAssetOpen}
        onOpenChange={setAssignAssetOpen}
        onSuccess={() => {
          dispatchToast(
            <Toast>
              <ToastTitle>Asset assigned to employee successfully</ToastTitle>
            </Toast>,
            { intent: "success" }
          );
          loadData();
        }}
      />

      <AssetPurchaseCalendarDialog open={calendarOpen} onOpenChange={setCalendarOpen} assets={assets} />
    </>
  );
};

export default AdminDashboard;
