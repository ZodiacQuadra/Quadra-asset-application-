import React, { useMemo, useState } from "react";
import {
  Input,
  Text,
  Badge,
  Spinner,
  Button,
} from "@fluentui/react-components";
import {
  SearchRegular,
  AppsRegular,
  ListRegular,
  DocumentPersonRegular,
  CalendarRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  CheckmarkCircleRegular,
  ClockRegular,
  DismissRegular,
} from "@fluentui/react-icons";
import {
  AssetHRRequestRecord,
  HRRequestCategorySummary,
  HRRequestStatus,
} from "../../Services/AssetHRRequestService";

const PAGE_SIZE = 8;

const getInitials = (name?: string | null) => {
  if (!name) return "HR";
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

type HRFilterCategory = "All" | "Pending" | "InProgress" | "Completed" | "Rejected";

interface AdminHRRequestSubScreenProps {
  requests: AssetHRRequestRecord[];
  loading: boolean;
  categorySummary?: HRRequestCategorySummary[];
  categorySummaryLoading?: boolean;
  onSelectRequest: (id: string) => void;
  onRefresh?: () => void;
}

export const AdminHRRequestSubScreen: React.FC<AdminHRRequestSubScreenProps> = ({
  requests,
  loading,
  categorySummary = [],
  categorySummaryLoading = false,
  onSelectRequest,
}) => {
  const [filterTab, setFilterTab] = useState<HRFilterCategory>("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [page, setPage] = useState(1);

  // Tab count calculations
  const counts = useMemo(() => {
    return {
      All: requests.length,
      Pending: requests.filter((r) => r.Status === "Pending" || r.Status === "Draft").length,
      InProgress: requests.filter((r) => r.Status === "InProgress").length,
      Completed: requests.filter((r) => r.Status === "Completed").length,
      Rejected: requests.filter((r) => r.Status === "Rejected").length,
    };
  }, [requests]);

  // Filtered requests
  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (filterTab === "Pending" && !(r.Status === "Pending" || r.Status === "Draft")) return false;
      if (filterTab === "InProgress" && r.Status !== "InProgress") return false;
      if (filterTab === "Completed" && r.Status !== "Completed") return false;
      if (filterTab === "Rejected" && r.Status !== "Rejected") return false;

      if (search.trim()) {
        const term = search.trim().toLowerCase();
        const matches =
          r.HRRequestID?.toLowerCase().includes(term) ||
          (r.RequestedUserName || "").toLowerCase().includes(term) ||
          (r.Role || "").toLowerCase().includes(term) ||
          (r.RoleTitle || "").toLowerCase().includes(term) ||
          (r.Department || "").toLowerCase().includes(term);
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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Category Summary Chips (Optional preview of category counts requested) */}
      {!categorySummaryLoading && categorySummary.length > 0 && (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "16px",
            padding: "16px 20px",
            border: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <Text size={200} weight="semibold" style={{ color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Requisition Breakdown:
          </Text>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {categorySummary.map((c) => (
              <span
                key={c.CategoryName}
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "999px",
                  padding: "4px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#1E293B",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{c.CategoryName}:</span>
                <span style={{ color: "#007ED5" }}>{c.TotalCount}</span>
                {c.PendingCount > 0 && (
                  <span style={{ color: "#D97706", fontSize: "11px" }}>({c.PendingCount} pend)</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Toolbar replicating Employee Request sub-screen */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* Status Pill Tabs */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#F8FAFC",
            padding: "4px 6px",
            borderRadius: "999px",
            border: "1px solid #E2E8F0",
            gap: "4px",
            flexWrap: "nowrap",
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          {[
            { id: "All", label: "All", count: counts.All },
            { id: "Pending", label: "Pending", count: counts.Pending },
            { id: "InProgress", label: "In Progress", count: counts.InProgress },
            { id: "Completed", label: "Completed", count: counts.Completed },
            { id: "Rejected", label: "Rejected", count: counts.Rejected },
          ].map((tab) => {
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilterTab(tab.id as HRFilterCategory);
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

        {/* Search & View Switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "280px" }}>
            <Input
              contentBefore={<SearchRegular style={{ color: "#94A3B8" }} />}
              placeholder="Search HR request, role, specialist..."
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
          <Spinner label="Loading HR requests..." />
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
            No HR requests found matching this filter or search query.
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
            const isPending = r.Status === "Pending" || r.Status === "Draft";
            const isInProgress = r.Status === "InProgress";
            const isCompleted = r.Status === "Completed";
            const isRejected = r.Status === "Rejected";

            const accentColor = isPending
              ? "#EA580C"
              : isInProgress
              ? "#2563EB"
              : isCompleted
              ? "#16A34A"
              : "#DC2626";

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
                  {/* Header: Avatar, Name, Role & Dept, Status Pill */}
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
                          background: "#EFF6FF",
                          color: "#007ED5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "15px",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(r.RequestedUserName)}
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
                          {r.RequestedUserName || "HR Specialist"}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748B", marginTop: "3px" }}>
                          {r.Department || "Human Resources"} · {r.Role || r.RoleTitle || "Talent Team"}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge Pills */}
                    {isPending && (
                      <span
                        style={{
                          background: "#FEF3C7",
                          color: "#B45309",
                          borderRadius: "999px",
                          padding: "4px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        Pending Review
                      </span>
                    )}
                    {isInProgress && (
                      <span
                        style={{
                          background: "#DBEAFE",
                          color: "#1D4ED8",
                          borderRadius: "999px",
                          padding: "4px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        In Progress
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
                        }}
                      >
                        Allocated
                      </span>
                    )}
                    {isRejected && (
                      <span
                        style={{
                          background: "#FEE2E2",
                          color: "#DC2626",
                          borderRadius: "999px",
                          padding: "4px 14px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        Rejected
                      </span>
                    )}
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
                      <DocumentPersonRegular style={{ fontSize: "16px", color: "#007ED5" }} />
                      <span style={{ color: "#334155", fontWeight: 600 }}>
                        {r.ApplicantCount || 1} Applicant{r.ApplicantCount === 1 ? "" : "s"}
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
                        {formatDate(r.CreatedAt)}
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
                      {r.HRRequestID || "HR-REQ"}
                    </span>
                  </div>

                  {/* Reason / Purpose / Details */}
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#334155",
                      lineHeight: 1.45,
                      minHeight: "36px",
                      marginBottom: "16px",
                    }}
                  >
                    {r.Notes || r.RoleDescription || `Requisition for onboarding assets for candidate batch (${r.ApplicantCount || 1} candidates).`}
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
                      {isPending ? (
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "#FEF3C7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#D97706",
                          }}
                        >
                          <ClockRegular style={{ fontSize: "15px" }} />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "#DCFCE7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#16A34A",
                          }}
                        >
                          <CheckmarkCircleRegular style={{ fontSize: "15px" }} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                          {isPending
                            ? "Awaiting Asset Allocation"
                            : isCompleted
                            ? "Batch Processed & Allocated"
                            : `Status: ${r.Status}`}
                        </div>
                        <div style={{ fontSize: "11px", color: "#64748B" }}>
                          {r.ApplicantCount || 1} Candidate profile(s) ready
                        </div>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => onSelectRequest(r.ID)}
                        style={{
                          background: isPending ? "#007ED5" : "#FFFFFF",
                          border: isPending ? "none" : "1.5px solid #007ED5",
                          borderRadius: "999px",
                          padding: "7px 20px",
                          fontSize: "13px",
                          fontWeight: 600,
                          color: isPending ? "#FFFFFF" : "#007ED5",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: isPending ? "0 2px 6px rgba(0, 126, 213, 0.25)" : "none",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.9";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                      >
                        {isPending ? "Review & Allocate Assets" : "View Details"}
                      </button>
                    </div>
                  </div>
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
                  <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>HR Specialist</th>
                  <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Request #</th>
                  <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Role & Dept</th>
                  <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Applicants</th>
                  <th style={{ padding: "14px 18px", color: "#64748B", fontWeight: 600 }}>Date</th>
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
                            background: "#EFF6FF",
                            color: "#007ED5",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "12px",
                          }}
                        >
                          {getInitials(r.RequestedUserName)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#0F172A" }}>
                            {r.RequestedUserName || "HR Specialist"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748B" }}>
                            {r.Department || "HR"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", fontWeight: 600, color: "#1E293B" }}>
                      {r.HRRequestID}
                    </td>
                    <td style={{ padding: "14px 18px", color: "#334155" }}>
                      {r.Role || r.RoleTitle || "General Role"}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span
                        style={{
                          background: "#EFF6FF",
                          color: "#007ED5",
                          borderRadius: "6px",
                          padding: "2px 8px",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}
                      >
                        {r.ApplicantCount || 1} Candidate{r.ApplicantCount === 1 ? "" : "s"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px", color: "#64748B" }}>
                      {formatDate(r.CreatedAt)}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <Badge
                        appearance="tint"
                        color={
                          r.Status === "Pending" || r.Status === "Draft"
                            ? "warning"
                            : r.Status === "Completed"
                            ? "success"
                            : r.Status === "Rejected"
                            ? "danger"
                            : "informative"
                        }
                      >
                        {r.Status}
                      </Badge>
                    </td>
                    <td style={{ padding: "14px 18px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => onSelectRequest(r.ID)}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #CBD5E1",
                          borderRadius: "8px",
                          padding: "6px 14px",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "#007ED5",
                          cursor: "pointer",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
                      >
                        Review
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

export default AdminHRRequestSubScreen;
