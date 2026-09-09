import React, { useMemo, useState } from "react";
import {
  Input,
  Text,
  Badge,
  Spinner,
  Button,
  Divider,
  Dropdown,
  Option,
  Textarea,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import {
  SearchRegular,
  AppsRegular,
  ListRegular,
  WarningRegular,
  CalendarRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  DismissRegular,
  BoxRegular,
  ChevronDownRegular,
  ChevronUpRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../../Auth/AuthProvider";
import {
  AssetLostRequestRecord,
  AssetLostRequestItemRecord,
  LostRequestStatus,
  getAssetLostRequestById,
  adminActionOnLostRequestItem,
  assignReplacementForLostItem,
} from "../../Services/AssetLostRequestService";
import {
  getAvailableAssetsForCategory,
  AvailableAssetOption,
} from "../../Services/AssetInventoryService";

const PAGE_SIZE = 8;

const getInitials = (name?: string | null) => {
  if (!name) return "LA";
  const parts = name.trim().split(" ");
  return parts.length > 1
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : name.slice(0, 2).toUpperCase();
};

const formatDate = (val: string | null | undefined) => {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return val;
  }
};

const getPageNumbers = (current: number, total: number): (number | string)[] => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "...", total];
  if (current >= total - 2) return [1, "...", total - 2, total - 1, total];
  return [1, "...", current, "...", total];
};

type LostFilterTab = "All" | "Pending" | "InProgress" | "Completed";

interface AdminLostSubScreenProps {
  requests: AssetLostRequestRecord[];
  loading: boolean;
  onRefresh: () => void;
}

export const AdminLostSubScreen: React.FC<AdminLostSubScreenProps> = ({
  requests,
  loading,
  onRefresh,
}) => {
  const { currentUser } = useAuth();
  const toasterId = useId("admin-lost-subscreen-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [filterTab, setFilterTab] = useState<LostFilterTab>("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [page, setPage] = useState(1);

  // Expanded items state
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null);
  const [itemsByRequest, setItemsByRequest] = useState<Record<string, AssetLostRequestItemRecord[]>>({});
  const [itemsLoading, setItemsLoading] = useState(false);

  // Item action state
  const [actioningItemId, setActioningItemId] = useState<string | null>(null);
  const [replacementAssetId, setReplacementAssetId] = useState<string>("");
  const [availableAssets, setAvailableAssets] = useState<AvailableAssetOption[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingItemId, setRejectingItemId] = useState<string | null>(null);

  // Tab count calculations
  const counts = useMemo(() => {
    return {
      All: requests.length,
      Pending: requests.filter((r) => r.RequestStatus === "Pending" || r.PendingItemCount > 0).length,
      InProgress: requests.filter((r) => r.RequestStatus === "InProgress").length,
      Completed: requests.filter((r) => r.RequestStatus === "Completed").length,
    };
  }, [requests]);

  // Filtered requests
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const isPending = r.RequestStatus === "Pending" || r.PendingItemCount > 0;
      const isInProgress = r.RequestStatus === "InProgress";
      const isCompleted = r.RequestStatus === "Completed";

      if (filterTab === "Pending" && !isPending) return false;
      if (filterTab === "InProgress" && !isInProgress) return false;
      if (filterTab === "Completed" && !isCompleted) return false;

      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matches =
          r.RequestNumber?.toLowerCase().includes(term) ||
          (r.EmployeeName || "").toLowerCase().includes(term) ||
          (r.ReportedByName || "").toLowerCase().includes(term) ||
          (r.HowLost || "").toLowerCase().includes(term) ||
          (r.AdditionalDetails || "").toLowerCase().includes(term);
        if (!matches) return false;
      }
      return true;
    });
  }, [requests, filterTab, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const loadItems = async (reqId: string) => {
    if (itemsByRequest[reqId]) {
      setExpandedRequestId((prev) => (prev === reqId ? null : reqId));
      return;
    }
    setItemsLoading(true);
    setExpandedRequestId(reqId);
    try {
      const res = await getAssetLostRequestById(reqId);
      setItemsByRequest((prev) => ({ ...prev, [reqId]: res.items }));
    } catch {
      dispatchToast(
        <Toast>
          <ToastTitle>Failed to load incident asset items</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setItemsLoading(false);
    }
  };

  const handleLoadAvailableAssets = (cat: string | null) => {
    if (!cat) return;
    getAvailableAssetsForCategory(cat)
      .then(setAvailableAssets)
      .catch(() => {});
  };

  const handleApproveItem = async (item: AssetLostRequestItemRecord, reqId: string) => {
    if (!currentUser?.userID) return;
    setActioningItemId(item.ID);
    try {
      await adminActionOnLostRequestItem(
        item.ID,
        "Approve",
        currentUser.userID,
        currentUser.displayName || "Admin",
        replacementAssetId || null,
        undefined,
        false
      );
      dispatchToast(
        <Toast>
          <ToastTitle>Item marked approved for replacement</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      // reload items
      const res = await getAssetLostRequestById(reqId);
      setItemsByRequest((prev) => ({ ...prev, [reqId]: res.items }));
      onRefresh();
    } catch (err) {
      dispatchToast(
        <Toast>
          <ToastTitle>{err instanceof Error ? err.message : "Failed to approve item"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setActioningItemId(null);
    }
  };

  const handleAssignReplacement = async (item: AssetLostRequestItemRecord, reqId: string) => {
    if (!currentUser?.userID || !replacementAssetId) return;
    setActioningItemId(item.ID);
    try {
      await assignReplacementForLostItem(
        item.ID,
        replacementAssetId,
        currentUser.userID,
        currentUser.displayName || "Admin"
      );
      dispatchToast(
        <Toast>
          <ToastTitle>Replacement asset assigned successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setReplacementAssetId("");
      const res = await getAssetLostRequestById(reqId);
      setItemsByRequest((prev) => ({ ...prev, [reqId]: res.items }));
      onRefresh();
    } catch (err) {
      dispatchToast(
        <Toast>
          <ToastTitle>{err instanceof Error ? err.message : "Failed to assign replacement"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setActioningItemId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <Toaster toasterId={toasterId} />

    {/* Toolbar: Two-row layout — tabs on top, search+view below */}
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

      {/* Row 1: Status Pill Tabs — full width */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          background: "#F8FAFC",
          padding: "4px 6px",
          borderRadius: "999px",
          border: "1px solid #E2E8F0",
          gap: "4px",
          flexWrap: "wrap",
          maxWidth: "100%",
          alignSelf: "flex-start",
        }}
      >
        {[
          { id: "All", label: "All", count: counts.All },
          { id: "Pending", label: "Action Required", count: counts.Pending },
          { id: "InProgress", label: "In Investigation", count: counts.InProgress },
          { id: "Completed", label: "Resolved", count: counts.Completed },
        ].map((tab) => {
          const isActive = filterTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setFilterTab(tab.id as LostFilterTab);
                setPage(1);
              }}
              style={{
                border: "none",
                borderRadius: "999px",
                padding: "7px 18px",
                background: isActive ? "#FFFFFF" : "transparent",
                color: isActive ? "#007ED5" : "#475569",
                fontWeight: isActive ? 700 : 500,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                boxShadow: isActive ? "0 2px 8px rgba(0, 0, 0, 0.08)" : "none",
                transition: "all 0.18s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span>{tab.label}</span>
              <span
                style={{
                  background: isActive ? "#EFF6FF" : "#F1F5F9",
                  color: isActive ? "#007ED5" : "#64748B",
                  borderRadius: "999px",
                  fontSize: "12px",
                  fontWeight: 700,
                  padding: "2px 8px",
                  minWidth: "18px",
                  textAlign: "center",
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Search + View Switcher */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 280px", minWidth: "280px" }}>
          <Input
            contentBefore={<SearchRegular style={{ color: "#94A3B8" }} />}
            placeholder="Search lost incident, employee, notes..."
            value={search}
            onChange={(_, d) => {
              setSearch(d.value);
              setPage(1);
            }}
            style={{
              width: "100%",
              borderRadius: "12px",
              height: "40px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                color: "#94A3B8",
                cursor: "pointer",
              }}
            >
              <DismissRegular style={{ fontSize: "14px" }} />
            </button>
          )}
        </div>

        {/* View Switcher: Cards vs List */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#F1F5F9",
            padding: "3px",
            borderRadius: "10px",
            border: "1px solid #E2E8F0",
          }}
        >
          <button
            type="button"
            title="Cards View"
            onClick={() => setViewMode("cards")}
            style={{
              border: "none",
              background: viewMode === "cards" ? "#FFFFFF" : "transparent",
              color: viewMode === "cards" ? "#007ED5" : "#64748B",
              borderRadius: "8px",
              padding: "6px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              boxShadow: viewMode === "cards" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <AppsRegular style={{ fontSize: "18px" }} />
          </button>
          <button
            type="button"
            title="List View"
            onClick={() => setViewMode("list")}
            style={{
              border: "none",
              background: viewMode === "list" ? "#FFFFFF" : "transparent",
              color: viewMode === "list" ? "#007ED5" : "#64748B",
              borderRadius: "8px",
              padding: "6px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              boxShadow: viewMode === "list" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <ListRegular style={{ fontSize: "18px" }} />
          </button>
        </div>
      </div>
    </div>

      {/* Body: Loading / Empty / Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
          <Spinner label="Loading lost asset incidents..." />
        </div>
      ) : filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "#FFFFFF",
            borderRadius: "16px",
            border: "1px solid #E2E8F0",
          }}
        >
          <Text size={300} style={{ color: "#64748B" }}>
            No lost asset incidents found matching this filter or search query.
          </Text>
        </div>
      ) : viewMode === "cards" ? (
        /* ================= CARDS VIEW (Matching Employee Request Design) ================= */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
            gap: "20px",
          }}
        >
          {paged.map((r) => {
            const isPending = r.RequestStatus === "Pending";
            const isInProgress = r.RequestStatus === "InProgress";
            const isCompleted = r.RequestStatus === "Completed";
            const isExpanded = expandedRequestId === r.ID;
            const items = itemsByRequest[r.ID] || [];

            const accentColor = isPending
              ? "#DC2626"
              : isInProgress
              ? "#D97706"
              : "#16A34A";

            return (
              <div
                key={r.ID}
                style={{
                  background: "#FFFFFF",
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  borderLeft: `4px solid ${accentColor}`,
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.04)",
                  padding: "22px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  {/* Header: Avatar, Name, Reporter, Status Pill */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "14px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "50%",
                          background: "#FEE2E2",
                          color: "#DC2626",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "15px",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(r.EmployeeName || r.ReportedByName)}
                      </div>
                      <div>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "16px",
                            color: "#0F172A",
                            lineHeight: 1.2,
                          }}
                        >
                          {r.EmployeeName || "Employee Incident"}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748B", marginTop: "3px" }}>
                          Reported by {r.ReportedByName || "Staff"} ({r.ReportedByRole || "Employee"})
                        </div>
                      </div>
                    </div>

                    {/* Status Badge Pills - Mutually Exclusive */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      {isPending && (
                        <span
                          style={{
                            background: "#FEF2F2",
                            color: "#DC2626",
                            borderRadius: "999px",
                            padding: "4px 14px",
                            fontSize: "12px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Action Required
                        </span>
                      )}
                      {isInProgress && (
                        <span
                          style={{
                            background: "#FEF3C7",
                            color: "#B45309",
                            borderRadius: "999px",
                            padding: "4px 14px",
                            fontSize: "12px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          In Investigation
                        </span>
                      )}
                      {isCompleted && (
                        <span
                          style={{
                            background: "#DCFCE7",
                            color: "#15803D",
                            borderRadius: "999px",
                            padding: "4px 14px",
                            fontSize: "12px",
                            fontWeight: 600,
                            whiteSpace: "nowrap",
                          }}
                        >
                          Resolved / Replaced
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata Row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      marginBottom: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#64748B",
                        fontSize: "13px",
                      }}
                    >
                      <WarningRegular style={{ fontSize: "16px", color: "#DC2626" }} />
                      <span style={{ color: "#334155", fontWeight: 600 }}>
                        {r.ItemCount} Asset{r.ItemCount === 1 ? "" : "s"} Reported Lost
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: "#64748B",
                        fontSize: "13px",
                      }}
                    >
                      <CalendarRegular style={{ fontSize: "16px", color: "#64748B" }} />
                      <span style={{ color: "#334155", fontWeight: 500 }}>
                        Lost Date: {formatDate(r.LostDate)}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        background: "#F1F5F9",
                        color: "#475569",
                        borderRadius: "6px",
                        padding: "2px 8px",
                      }}
                    >
                      {r.RequestNumber || "LOST-INC"}
                    </span>
                  </div>

                  {/* How Lost Summary */}
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#334155",
                      lineHeight: 1.45,
                      minHeight: "36px",
                      marginBottom: "16px",
                    }}
                  >
                    <strong>Circumstances: </strong>
                    {r.HowLost || "No detailed circumstance provided."}
                    {r.AdditionalDetails && ` — ${r.AdditionalDetails}`}
                  </div>
                </div>

                <div>
                  {/* Divider */}
                  <div style={{ borderTop: "1px solid #F1F5F9", marginBottom: "14px" }} />

                  {/* Bottom Action Section */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: isPending ? "#FEE2E2" : "#DCFCE7",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isPending ? "#DC2626" : "#16A34A",
                        }}
                      >
                        {isPending ? <ClockRegular style={{ fontSize: "15px" }} /> : <CheckmarkCircleRegular style={{ fontSize: "15px" }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                          {r.PendingItemCount > 0
                            ? `${r.PendingItemCount} item(s) pending replacement`
                            : "Incident Processed"}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748B" }}>
                          Reported: {formatDate(r.CreatedAt)}
                        </div>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => loadItems(r.ID)}
                        style={{
                          background: isPending ? "#DC2626" : "#FFFFFF",
                          border: isPending ? "none" : "1.5px solid #DC2626",
                          borderRadius: "999px",
                          padding: "7px 20px",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: isPending ? "#FFFFFF" : "#DC2626",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: isPending ? "0 2px 6px rgba(220, 38, 38, 0.25)" : "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                      >
                        <span>{isExpanded ? "Hide Incident Assets" : "Manage Incident Assets"}</span>
                        {isExpanded ? <ChevronUpRegular /> : <ChevronDownRegular />}
                      </button>
                    </div>
                  </div>

                  {/* Expandable Incident Items Section */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: "16px",
                        background: "#F8FAFC",
                        borderRadius: "12px",
                        padding: "16px",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      <Text weight="semibold" style={{ display: "block", marginBottom: "12px", color: "#0F172A", fontSize: "13.5px" }}>
                        Reported Lost Assets ({items.length}):
                      </Text>

                      {itemsLoading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
                          <Spinner size="small" label="Loading lost items..." />
                        </div>
                      ) : items.length === 0 ? (
                        <Text size={200} style={{ color: "#64748B" }}>No item records found for this incident.</Text>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {items.map((item) => (
                            <div
                              key={item.ID}
                              style={{
                                background: "#FFFFFF",
                                borderRadius: "8px",
                                border: "1px solid #E2E8F0",
                                padding: "12px 14px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "12px",
                              }}
                            >
                              <div>
                                <div style={{ fontWeight: 600, color: "#1E293B", fontSize: "13px" }}>
                                  {item.AssetName} ({item.AssetTagID})
                                </div>
                                <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px" }}>
                                  Category: {item.Category || "Asset"} · Status: <strong>{item.ItemStatus}</strong>
                                </div>
                                {item.ReplacementAssetName && (
                                  <div style={{ fontSize: "11.5px", color: "#16A34A", marginTop: "2px" }}>
                                    Replacement: {item.ReplacementAssetName} ({item.ReplacementAssetTagID})
                                  </div>
                                )}
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                {item.ItemStatus === "Pending" && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleLoadAvailableAssets(item.Category);
                                        handleApproveItem(item, r.ID);
                                      }}
                                      disabled={actioningItemId === item.ID}
                                      style={{
                                        background: "#16A34A",
                                        color: "#FFFFFF",
                                        border: "none",
                                        borderRadius: "6px",
                                        padding: "5px 12px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Approve
                                    </button>
                                  </>
                                )}

                                {item.ItemStatus === "AwaitingReplacement" && (
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <button
                                      type="button"
                                      onClick={() => handleLoadAvailableAssets(item.Category)}
                                      style={{
                                        background: "#007ED5",
                                        color: "#FFFFFF",
                                        border: "none",
                                        borderRadius: "6px",
                                        padding: "5px 12px",
                                        fontSize: "12px",
                                        fontWeight: 600,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Find Replacements
                                    </button>
                                  </div>
                                )}

                                <Badge
                                  appearance="tint"
                                  color={
                                    item.ItemStatus === "Pending"
                                      ? "warning"
                                      : item.ItemStatus === "Replaced"
                                      ? "success"
                                      : item.ItemStatus === "Rejected"
                                      ? "danger"
                                      : "informative"
                                  }
                                >
                                  {item.ItemStatus}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= LIST VIEW (Table Representation) ================= */
        <div
          style={{
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid #E2E8F0",
            background: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Employee</th>
                  <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Incident #</th>
                  <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Reported By</th>
                  <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Lost Items</th>
                  <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Lost Date</th>
                  <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600, textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((r) => (
                  <tr
                    key={r.ID}
                    style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.15s ease" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                  >
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                          style={{
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "#FEE2E2",
                            color: "#DC2626",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "12px",
                          }}
                        >
                          {getInitials(r.EmployeeName || r.ReportedByName)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#0F172A" }}>
                            {r.EmployeeName || "Employee"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748B" }}>
                            {r.EmployeeMail || "Staff Member"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "#1E293B" }}>
                      {r.RequestNumber || "LOST-INC"}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#334155" }}>
                      {r.ReportedByName} ({r.ReportedByRole})
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          background: "#FEE2E2",
                          color: "#DC2626",
                          borderRadius: "6px",
                          padding: "2px 8px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {r.ItemCount} Asset{r.ItemCount === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", color: "#64748B" }}>
                      {formatDate(r.LostDate)}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <Badge
                        appearance="tint"
                        color={
                          r.RequestStatus === "Pending" || r.PendingItemCount > 0
                            ? "danger"
                            : r.RequestStatus === "Completed"
                            ? "success"
                            : "warning"
                        }
                      >
                        {r.RequestStatus}
                      </Badge>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => {
                          setViewMode("cards");
                          loadItems(r.ID);
                        }}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #CBD5E1",
                          borderRadius: "8px",
                          padding: "6px 14px",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#DC2626",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {filtered.length > PAGE_SIZE && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            padding: "8px 4px",
          }}
        >
          <Text size={200} style={{ color: "#64748B" }}>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} requests
          </Text>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Button
              appearance="subtle"
              icon={<ChevronLeftRegular />}
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            />
            {getPageNumbers(page, totalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "#64748B" }}>
                  …
                </span>
              ) : (
                <Button
                  key={p}
                  appearance={p === page ? "primary" : "subtle"}
                  style={
                    p === page
                      ? { minWidth: "28px", borderRadius: "6px", background: "#007ED5", borderColor: "#007ED5" }
                      : { minWidth: "28px", borderRadius: "6px" }
                  }
                  onClick={() => setPage(p as number)}
                >
                  {p}
                </Button>
              )
            )}
            <Button
              appearance="subtle"
              icon={<ChevronRightRegular />}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLostSubScreen;
