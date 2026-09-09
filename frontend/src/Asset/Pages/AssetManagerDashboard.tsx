import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Input,
  Text,
  Badge,
  Spinner,
  TabList,
  Tab,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import {
  AddRegular,
  ArrowSwapRegular,
  ChevronDownRegular,
  ChevronUpRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  PersonRegular,
  WarningRegular,
  SearchRegular,
  FilterRegular,
  DismissRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import AssetCardGrid from "../Components/AssetCardGrid";
import ReportLostAssetPanel from "../Components/ReportLostAssetPanel";
import {
  getAssetTeamMembers,
  getUserAssignedAssets,
  getFallbackAssignedAssets,
  MOCK_TEAM_MEMBERS,
  AssetTeamMember,
  UserAssignedAsset,
} from "../Services/AssetEmployeeService";
import { getPendingLostItemsForUser } from "../Services/AssetLostRequestService";
import QuadraPillToggle from "../../Common/QuadraPillToggle";

type DashboardTab = "my-assets" | "team-assets";

const DEFAULT_MANAGER_ASSETS: UserAssignedAsset[] = [
  {
    MappingID: "map-mgr-1",
    AssetID: "ast-mgr-1",
    AssetName: "MacBook Pro 16\" M3 Max",
    AssetTagID: "AST00001",
    Category: "Laptop",
    SerialNo: "SN-MBP-88123",
    Model: "M3 Max / 32GB / 1TB SSD",
    Description: "Management & technical architecture laptop",
    Status: "In Use",
    AssignedAt: "2024-01-10T09:00:00.000Z",
    Location: "HQ - Floor 4",
    Branch: "Headquarters",
    Value: 3400,
    VendorName: "Apple Enterprise Store",
  },
  {
    MappingID: "map-mgr-2",
    AssetID: "ast-mgr-2",
    AssetName: "Apple Studio Display 27\"",
    AssetTagID: "AST00008",
    Category: "Monitor",
    SerialNo: "SN-SD-55210",
    Model: "27-inch 5K Retina Screen",
    Description: "Executive desk workstation display",
    Status: "In Use",
    AssignedAt: "2024-01-12T10:00:00.000Z",
    Location: "HQ - Floor 4",
    Branch: "Headquarters",
    Value: 1599,
  },
  {
    MappingID: "map-mgr-3",
    AssetID: "ast-mgr-3",
    AssetName: "AirPods Max Space Gray",
    AssetTagID: "AST00019",
    Category: "Headphone",
    SerialNo: "SN-AIR-33120",
    Model: "Wireless Active Noise Cancelling",
    Description: "Executive calls and audio headset",
    Status: "In Use",
    AssignedAt: "2024-01-15T11:00:00.000Z",
    Location: "HQ - Floor 4",
    Branch: "Headquarters",
    Value: 549,
  },
  {
    MappingID: "map-mgr-4",
    AssetID: "ast-mgr-4",
    AssetName: "Herman Miller Aeron Chair",
    AssetTagID: "AST-NON-001",
    Category: "Furniture",
    SerialNo: "SN-HM-9912",
    Model: "Aeron Ergonomic PostureFit SL",
    Description: "Manager office ergonomic seating",
    Status: "In Use",
    AssignedAt: "2024-01-10T09:00:00.000Z",
    Location: "HQ - Floor 4",
    Branch: "Headquarters",
    Value: 1300,
  },
];

const PAGE_SIZE = 10;

const getPageNumbers = (current: number, total: number): (number | "...")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
};

const AssetManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const toasterId = useId("asset-manager-dashboard-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [tab, setTab] = useState<DashboardTab>("my-assets");

  const [myAssets, setMyAssets] = useState<UserAssignedAsset[]>(DEFAULT_MANAGER_ASSETS);
  const [myAssetsLoading, setMyAssetsLoading] = useState(false);

  const [teamMembers, setTeamMembers] = useState<AssetTeamMember[]>(MOCK_TEAM_MEMBERS);
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamPage, setTeamPage] = useState(1);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamDepartment, setTeamDepartment] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assetsByMember, setAssetsByMember] = useState<Record<string, UserAssignedAsset[]>>({});
  const [memberAssetsLoading, setMemberAssetsLoading] = useState<string | null>(null);
  const [pendingLostByMember, setPendingLostByMember] = useState<Record<string, Set<string>>>({});
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [reportLostOpen, setReportLostOpen] = useState(false);

  const notifyError = (error: unknown, fallback: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{error instanceof Error ? error.message : fallback}</ToastTitle>
      </Toast>,
      { intent: "error" }
    );
  };

  useEffect(() => {
    if (!currentUser?.userID) return;
    setMyAssetsLoading(true);
    getUserAssignedAssets(currentUser.userID)
      .then((data) => {
        setMyAssets(data && data.length > 0 ? data : DEFAULT_MANAGER_ASSETS);
      })
      .catch(() => setMyAssets(DEFAULT_MANAGER_ASSETS))
      .finally(() => setMyAssetsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.userID]);

  useEffect(() => {
    if (!currentUser?.userID) return;
    setTeamLoading(true);
    getAssetTeamMembers(currentUser.userID)
      .then((data) => {
        setTeamMembers(data && data.length > 0 ? data : MOCK_TEAM_MEMBERS);
      })
      .catch(() => setTeamMembers(MOCK_TEAM_MEMBERS))
      .finally(() => setTeamLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.userID]);

  const teamDepartments = useMemo(() => {
    const set = new Set<string>();
    teamMembers.forEach((m) => {
      if (m.Department) set.add(m.Department);
    });
    return ["All", ...Array.from(set)];
  }, [teamMembers]);

  const filteredTeamMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      if (teamDepartment !== "All" && m.Department !== teamDepartment) return false;
      if (teamSearch.trim()) {
        const q = teamSearch.trim().toLowerCase();
        const memberMatch =
          (m.DisplayName || "").toLowerCase().includes(q) ||
          (m.JobTitle || "").toLowerCase().includes(q) ||
          (m.Department || "").toLowerCase().includes(q) ||
          (m.Mail || "").toLowerCase().includes(q);
        if (memberMatch) return true;

        // Also check if any loaded or assigned asset under this member matches query
        const memberAssets = assetsByMember[m.ID] || [];
        const assetMatch = memberAssets.some(
          (a) =>
            (a.AssetName || "").toLowerCase().includes(q) ||
            (a.AssetTagID || "").toLowerCase().includes(q) ||
            (a.SerialNo || "").toLowerCase().includes(q) ||
            (a.Category || "").toLowerCase().includes(q) ||
            (a.Model || "").toLowerCase().includes(q)
        );
        if (assetMatch) return true;

        return false;
      }
      return true;
    });
  }, [teamMembers, teamDepartment, teamSearch, assetsByMember]);

  const totalTeamPages = Math.max(1, Math.ceil(filteredTeamMembers.length / PAGE_SIZE));
  const pagedTeamMembers = useMemo(
    () => filteredTeamMembers.slice((teamPage - 1) * PAGE_SIZE, teamPage * PAGE_SIZE),
    [filteredTeamMembers, teamPage]
  );

  const toggleExpand = (member: AssetTeamMember) => {
    setSelectedAssetIds(new Set());
    if (expandedId === member.ID) {
      setExpandedId(null);
      return;
    }
    setExpandedId(member.ID);
    if (!assetsByMember[member.ID]) {
      setMemberAssetsLoading(member.ID);
      getUserAssignedAssets(member.ID)
        .then((data) => {
          const assets = data && data.length > 0 ? data : getFallbackAssignedAssets(member.ID, member.DisplayName);
          setAssetsByMember((prev) => ({ ...prev, [member.ID]: assets }));
        })
        .catch(() => {
          setAssetsByMember((prev) => ({
            ...prev,
            [member.ID]: getFallbackAssignedAssets(member.ID, member.DisplayName),
          }));
        })
        .finally(() => setMemberAssetsLoading(null));
    }
    if (!pendingLostByMember[member.ID]) {
      getPendingLostItemsForUser(member.ID)
        .then((items) => setPendingLostByMember((prev) => ({ ...prev, [member.ID]: new Set(items.map((i) => i.AssetID)) })))
        .catch(() => {
          /* non-blocking — badges simply won't show if this fails */
        });
    }
  };

  const toggleAssetSelect = (asset: UserAssignedAsset) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(asset.AssetID)) next.delete(asset.AssetID);
      else next.add(asset.AssetID);
      return next;
    });
  };

  const expandedMember = pagedTeamMembers.find((m) => m.ID === expandedId) ?? teamMembers.find((m) => m.ID === expandedId);
  const selectedAssetsForReport = (expandedId ? assetsByMember[expandedId] ?? [] : []).filter((a) => selectedAssetIds.has(a.AssetID));

  return (
    <>
      <Toaster toasterId={toasterId} />
      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Stable header row: title + toggle + action button all in one row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", minHeight: "44px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <Text size={600} weight="semibold">
              Asset Manager Dashboard
            </Text>
            <QuadraPillToggle<DashboardTab>
              options={[
                { key: "my-assets", label: "My Assets" },
                { key: "team-assets", label: "Team Assets" },
              ]}
              value={tab}
              onChange={(val) => setTab(val)}
            />
          </div>
          {/* Keep button in DOM always (visibility:hidden when not needed) to prevent layout shift */}
          <button
            type="button"
            onClick={() => navigate("/Asset/new-request")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "9999px",
              padding: "6px 20px 6px 6px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              visibility: tab === "my-assets" ? "visible" : "hidden",
              pointerEvents: tab === "my-assets" ? "auto" : "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(0, 126, 213, 0.16)";
              e.currentTarget.style.borderColor = "#93C5FD";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.04)";
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: "#007ED5",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "18px",
                fontWeight: 600,
                lineHeight: 1,
                boxShadow: "0 2px 6px rgba(0, 126, 213, 0.3)",
              }}
            >
              +
            </div>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#334155", letterSpacing: "-0.01em" }}>
              New Asset Request
            </span>
          </button>
        </div>

        {tab === "my-assets" &&
          (myAssetsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
              <Spinner label="Loading your assets..." />
            </div>
          ) : myAssets.length === 0 ? (
            <Card style={{ padding: "40px", textAlign: "center" }}>
              <Text style={{ color: "#605E5C" }}>No assets are currently assigned to you.</Text>
            </Card>
          ) : (
            <AssetCardGrid assets={myAssets} onSelect={(asset) => navigate(`/Asset/my-assets/${asset.AssetID}`)} />
          ))}

        {tab === "team-assets" &&
          (teamLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
              <Spinner label="Loading team members..." />
            </div>
          ) : teamMembers.length === 0 ? (
            <Card style={{ padding: "40px", textAlign: "center" }}>
              <Text style={{ color: "#605E5C" }}>You have no team members reporting to you.</Text>
            </Card>
          ) : (
            <>
              {/* Search and Department Filter Toolbar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "16px",
                  background: "#FFFFFF",
                  padding: "12px 18px",
                  borderRadius: "16px",
                  border: "1px solid #E2E8F0",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                {/* Search input */}
                <div style={{ position: "relative", minWidth: "280px", maxWidth: "420px", flex: "1 1 280px" }}>
                  <Input
                    contentBefore={<SearchRegular style={{ color: "#94A3B8" }} />}
                    placeholder="Search team member by name, role, or asset..."
                    value={teamSearch}
                    onChange={(_, d) => {
                      setTeamSearch(d.value);
                      setTeamPage(1);
                    }}
                    style={{
                      width: "100%",
                      borderRadius: "9999px",
                      height: "38px",
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  />
                  {teamSearch && (
                    <button
                      onClick={() => setTeamSearch("")}
                      style={{
                        position: "absolute",
                        right: "12px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "transparent",
                        color: "#94A3B8",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        padding: 0,
                      }}
                    >
                      <DismissRegular style={{ fontSize: "14px" }} />
                    </button>
                  )}
                </div>

                {/* Department filter dropdown */}
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <button
                      type="button"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "6px 16px",
                        borderRadius: "9999px",
                        border: "1px solid #CBD5E1",
                        background: "#FFFFFF",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#1E293B",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#007ED5";
                        e.currentTarget.style.background = "#F8FAFC";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#CBD5E1";
                        e.currentTarget.style.background = "#FFFFFF";
                      }}
                    >
                      <FilterRegular style={{ color: "#007ED5", fontSize: "14px" }} />
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                        Department:
                      </span>
                      <span style={{ color: "#0F172A" }}>
                        {teamDepartment === "All" ? "All Departments" : teamDepartment}
                      </span>
                      <ChevronDownRegular style={{ fontSize: "12px", color: "#64748B", marginLeft: "2px" }} />
                    </button>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList style={{ minWidth: "180px", borderRadius: "12px", padding: "6px" }}>
                      {teamDepartments.map((dept) => (
                        <MenuItem
                          key={dept}
                          onClick={() => {
                            setTeamDepartment(dept);
                            setTeamPage(1);
                          }}
                          style={{
                            borderRadius: "8px",
                            fontWeight: teamDepartment === dept ? 700 : 500,
                            color: teamDepartment === dept ? "#007ED5" : "#1E293B",
                          }}
                        >
                          {dept === "All" ? "All Departments" : dept}
                        </MenuItem>
                      ))}
                    </MenuList>
                  </MenuPopover>
                </Menu>
              </div>

              {filteredTeamMembers.length === 0 ? (
                <Card style={{ padding: "40px", textAlign: "center" }}>
                  <Text style={{ color: "#605E5C" }}>No team members found matching your search and filter criteria.</Text>
                </Card>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {pagedTeamMembers.map((member) => {
                  const isExpanded = expandedId === member.ID;
                  const memberAssets = assetsByMember[member.ID] ?? [];
                  return (
                    <Card key={member.ID} style={{ padding: "16px", border: "1px solid #E1DFDD", borderRadius: "10px" }}>
                      <div
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", flexWrap: "wrap", gap: "10px" }}
                        onClick={() => toggleExpand(member)}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ background: "#EEF1FB", borderRadius: "50%", padding: "10px", color: "#5B5FC7" }}>
                            <PersonRegular />
                          </div>
                          <div>
                            <Text weight="semibold">{member.DisplayName}</Text>
                            <br />
                            <Text size={200} style={{ color: "#605E5C" }}>
                              {member.JobTitle ?? "—"}
                              {member.Department ? ` · ${member.Department}` : ""}
                            </Text>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <Badge appearance="tint" color="informative">
                            {member.AssetCount} asset{member.AssetCount === 1 ? "" : "s"}
                          </Badge>
                          <Button
                            appearance="subtle"
                            icon={isExpanded ? <ChevronUpRegular /> : <ChevronDownRegular />}
                            aria-label={isExpanded ? "Collapse" : "Expand"}
                          />
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #F3F2F1" }}>
                          {memberAssetsLoading === member.ID ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                              <Spinner size="small" label="Loading assets..." />
                            </div>
                          ) : memberAssets.length === 0 ? (
                            <Text style={{ color: "#605E5C" }}>No assets currently assigned to this employee.</Text>
                          ) : (
                            <AssetCardGrid
                              assets={memberAssets}
                              cardHeight="110px"
                              onSelect={(asset) => navigate(`/Asset/my-assets/${asset.AssetID}?viewOnly=1`)}
                              pendingLostAssetIds={pendingLostByMember[member.ID]}
                            />
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <Text size={200} style={{ color: "#605E5C" }}>
                  Showing {filteredTeamMembers.length === 0 ? 0 : (teamPage - 1) * PAGE_SIZE + 1}–{Math.min(teamPage * PAGE_SIZE, filteredTeamMembers.length)} of {filteredTeamMembers.length} team members
                </Text>
                {totalTeamPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <Button appearance="subtle" icon={<ChevronLeftRegular />} disabled={teamPage === 1} onClick={() => setTeamPage((p) => p - 1)} />
                    {getPageNumbers(teamPage, totalTeamPages).map((p, i) =>
                      p === "..." ? (
                        <span key={`ellipsis-${i}`} style={{ padding: "0 4px", color: "#605E5C", lineHeight: "32px" }}>
                          …
                        </span>
                      ) : (
                        <Button
                          key={p}
                          appearance={p === teamPage ? "primary" : "subtle"}
                          style={{ minWidth: "32px" }}
                          onClick={() => setTeamPage(p as number)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                    <Button appearance="subtle" icon={<ChevronRightRegular />} disabled={teamPage >= totalTeamPages} onClick={() => setTeamPage((p) => p + 1)} />
                  </div>
                )}
              </div>
            </>
          ))}
      </div>

      {expandedMember && currentUser?.userID && (
        <ReportLostAssetPanel
          open={reportLostOpen}
          onOpenChange={setReportLostOpen}
          employeeUserId={expandedMember.ID}
          employeeName={expandedMember.DisplayName}
          reportedByUserId={currentUser.userID}
          reportedByRole="Manager"
          assets={selectedAssetsForReport}
          onCreated={() => {
            setSelectedAssetIds(new Set());
            setPendingLostByMember((prev) => ({ ...prev, [expandedMember.ID]: new Set() }));
            getPendingLostItemsForUser(expandedMember.ID)
              .then((items) => setPendingLostByMember((prev) => ({ ...prev, [expandedMember.ID]: new Set(items.map((i) => i.AssetID)) })))
              .catch(() => {});
          }}
        />
      )}
    </>
  );
};

export default AssetManagerDashboard;
