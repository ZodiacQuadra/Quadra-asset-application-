import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Badge,
  Text,
  Caption1,
  TabList,
  Tab,
  Spinner,
  Persona,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  EditRegular,
  TagRegular,
  DocumentRegular,
  BarcodeScannerRegular,
  LocationRegular,
  CalendarRegular,
  CurrencyDollarRupeeRegular,
  BuildingRegular,
  ShieldRegular,
  NoteRegular,
  DismissRegular,
  HistoryRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import TruncatedText from "../../Common/TruncatedText";
import AssetIcon from "../Components/AssetIcon";
import AssetFormDialog from "../Components/AssetFormDialog";
import {
  AssetInventoryRecord,
  AssetItemHistoryRecord,
  AssetStatus,
  getAssetById,
  getAssetItemHistory,
  returnAssetFromUser,
} from "../Services/AssetInventoryService";

const STATUS_BADGE_COLOR: Record<AssetStatus, "success" | "danger" | "informative" | "warning" | "subtle"> = {
  Assigned: "success",
  "In Stock": "informative",
  "Under Maintenance": "warning",
  "End of Use": "subtle",
  Reserved: "danger",
  Lost: "danger",
};

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-IN");
};

const formatDateTime = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  return isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
};

const formatCost = (value: number | null): string => (value == null ? "—" : `₹${value.toLocaleString("en-IN")}`);

type TabKey = "overview" | "maintenance" | "documents" | "history";

const HISTORY_PAGE_SIZE = 10;

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

const AssetDetail = () => {
  const { id, assetId } = useParams<{ id?: string; assetId?: string }>();
  const effectiveId = id || assetId;
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userID ?? "";

  const [asset, setAsset] = useState<AssetInventoryRecord | null>(null);
  const [history, setHistory] = useState<AssetItemHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [formOpen, setFormOpen] = useState(false);
  const [returning, setReturning] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  const totalHistoryPages = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE));
  const pagedHistory = useMemo(
    () => history.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE),
    [history, historyPage]
  );

  const loadData = async () => {
    if (!effectiveId) {
      setLoading(false);
      setError("Asset ID not provided.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [assetData, historyData] = await Promise.all([getAssetById(effectiveId), getAssetItemHistory(effectiveId)]);
      setAsset(assetData);
      setHistory(historyData);
      setHistoryPage(1);
    } catch (err: any) {
      setError(err?.message || "Failed to load asset details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveId]);

  const handleRemoveAssignment = async () => {
    if (!asset) return;
    setReturning(true);
    try {
      await returnAssetFromUser(asset.ID, currentUserId);
      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to remove assignment.");
    } finally {
      setReturning(false);
    }
  };

  const maintenanceHistory = history.filter(
    (h) => h.EventType === "StatusChange" && (h.OldStatus === "Under Maintenance" || h.NewStatus === "Under Maintenance")
  );

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
        <Spinner label="Loading asset..." />
      </div>
    );
  }

  if (!asset) {
    return (
      <div style={{ padding: "16px" }}>
        <Text style={{ color: "var(--colorPaletteRedForeground1)" }}>{error || "Asset not found."}</Text>
        <div style={{ marginTop: "12px" }}>
          <Button appearance="secondary" icon={<ArrowLeftRegular />} onClick={() => navigate("/Asset")}>
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "8px 4px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <Button
          appearance="subtle"
          icon={<ArrowLeftRegular />}
          onClick={() => navigate("/Asset")}
          style={{
            borderRadius: "999px",
            background: "rgba(255, 255, 255, 0.75)",
            border: "1px solid rgba(226, 232, 240, 0.8)",
            fontWeight: 600,
          }}
        >
          Back to Inventory
        </Button>
        <Button
          appearance="primary"
          icon={<EditRegular />}
          onClick={() => setFormOpen(true)}
          style={{
            borderRadius: "999px",
            background: "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)",
            boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
            fontWeight: 600,
          }}
        >
          Edit Asset
        </Button>
      </div>

      <div className="quadra-glass-card" style={{ padding: "24px", borderRadius: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <Text size={700} weight="bold" style={{ color: "#0f172a", fontSize: "24px", letterSpacing: "-0.01em" }}>
                {asset.AssetName}
              </Text>
              <span
                style={{
                  background: "rgba(0, 126, 213, 0.08)",
                  color: "#007ED5",
                  border: "1px solid rgba(0, 126, 213, 0.2)",
                  borderRadius: "6px",
                  padding: "2px 8px",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                }}
              >
                {asset.AssetTagID}
              </span>
            </div>
            <Text size={200} style={{ color: "#64748b", display: "block", marginTop: "4px" }}>
              Category: {asset.Category} · Added on {formatDate(asset.PurchasedDate)}
            </Text>
          </div>
          <Badge appearance="filled" color={STATUS_BADGE_COLOR[asset.Status] ?? "informative"} size="large">
            {asset.Status}
          </Badge>
        </div>

        {error && <Text style={{ color: "var(--colorPaletteRedForeground1)", display: "block", marginBottom: "16px" }}>{error}</Text>}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div
              style={{
                position: "relative",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                background: "linear-gradient(180deg, #F8FAFC 0%, #EEF2F6 100%)",
                height: "220px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <AssetIcon category={asset.Category} name={asset.AssetName} size="xl" />
              <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748B" }}>
                {asset.Category} · {asset.Brand || "Standard Asset"}
              </span>
            </div>

            <div className="quadra-chip-pill" style={{ padding: "18px", borderRadius: "14px" }}>
              <Text weight="semibold" size={300} style={{ display: "block", marginBottom: "12px", color: "#1e293b" }}>
                Current Custody & Assignment
              </Text>
              {asset.AssignedToUserID ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    background: "rgba(255, 255, 255, 0.8)",
                    border: "1px solid rgba(226, 232, 240, 0.9)",
                    borderRadius: "12px",
                  }}
                >
                  <Persona
                    name={asset.AssignedToName ?? "Unknown"}
                    secondaryText={asset.AssignedToDepartment ?? undefined}
                  />
                  <div style={{ flex: 1 }} />
                  <Button
                    appearance="subtle"
                    size="small"
                    icon={returning ? <Spinner size="tiny" /> : <DismissRegular />}
                    disabled={returning}
                    onClick={handleRemoveAssignment}
                    style={{ color: "#D13438", borderRadius: "8px" }}
                  >
                    Release Custody
                  </Button>
                </div>
              ) : (
                <div style={{ padding: "12px", background: "rgba(241, 245, 249, 0.6)", borderRadius: "10px", textAlign: "center" }}>
                  <Text size={200} style={{ color: "#64748b" }}>Device is currently unassigned and in stock.</Text>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {(["overview", "maintenance", "documents", "history"] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  style={{
                    borderRadius: "999px",
                    padding: "6px 16px",
                    fontSize: "13px",
                    fontWeight: activeTab === tab ? 600 : 500,
                    background: activeTab === tab ? "#007ED5" : "rgba(255, 255, 255, 0.75)",
                    color: activeTab === tab ? "#ffffff" : "#475569",
                    border: activeTab === tab ? "1px solid #007ED5" : "1px solid rgba(226, 232, 240, 0.8)",
                    boxShadow: activeTab === tab ? "0 4px 12px rgba(0, 126, 213, 0.25)" : "none",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 0.15s ease",
                  }}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {activeTab === "overview" && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                    <div className="quadra-chip-pill" style={{ padding: "16px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <Text weight="semibold" size={300} style={{ color: "#0f172a" }}>Hardware Specs</Text>
                      <InfoRow icon={<TagRegular />} label="Category" value={asset.Category} />
                      <InfoRow icon={<DocumentRegular />} label="Model" value={asset.Model || "—"} />
                      <InfoRow icon={<BarcodeScannerRegular />} label="Serial Number" value={asset.SerialNo || "—"} />
                      <InfoRow icon={<LocationRegular />} label="Location" value={asset.LocationName || "—"} />
                    </div>
                    <div className="quadra-chip-pill" style={{ padding: "16px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <Text weight="semibold" size={300} style={{ color: "#0f172a" }}>Procurement Info</Text>
                      <InfoRow icon={<CalendarRegular />} label="Purchase Date" value={formatDate(asset.PurchasedDate)} />
                      <InfoRow icon={<CurrencyDollarRupeeRegular />} label="Purchase Price" value={formatCost(asset.Cost)} />
                      <InfoRow icon={<BuildingRegular />} label="Vendor" value={asset.VendorName || "—"} />
                      <InfoRow icon={<ShieldRegular />} label="Warranty Expiry" value={formatDate(asset.ExpireDate)} />
                    </div>
                  </div>

                  {asset.Description && (
                    <div className="quadra-chip-pill" style={{ padding: "16px", borderRadius: "14px" }}>
                      <Text weight="semibold" size={300} style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                        <NoteRegular />
                        Device Description & Notes
                      </Text>
                      <Text block size={200} style={{ marginTop: "8px", color: "#334155", lineHeight: 1.5 }}>
                        {asset.Description}
                      </Text>
                    </div>
                  )}
                </>
              )}

              {activeTab === "maintenance" &&
                (maintenanceHistory.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>No maintenance records yet.</div>
                ) : (
                  <HistoryList items={maintenanceHistory} />
                ))}

              {activeTab === "documents" &&
                (asset.SupportDocsURL.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>No documents uploaded yet.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {asset.SupportDocsURL.map((f) => (
                      <div
                        key={f.relativePath}
                        className="quadra-chip-pill"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "12px 14px",
                          borderRadius: "10px",
                        }}
                      >
                        <DocumentRegular style={{ color: "#007ED5", fontSize: "20px", flexShrink: 0 }} />
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noreferrer"
                          title={f.fileName}
                          style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#007ED5", fontWeight: 500 }}
                        >
                          {f.fileName}
                        </a>
                      </div>
                    ))}
                  </div>
                ))}

              {activeTab === "history" &&
                (history.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>No history recorded yet.</div>
                ) : (
                  <>
                    <HistoryList items={pagedHistory} />
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px", flexWrap: "wrap", gap: "8px" }}>
                      <Text size={200} style={{ color: "#64748b" }}>
                        Showing {(historyPage - 1) * HISTORY_PAGE_SIZE + 1}–
                        {Math.min(historyPage * HISTORY_PAGE_SIZE, history.length)} of {history.length} events
                      </Text>
                      {totalHistoryPages > 1 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Button
                            appearance="subtle"
                            icon={<ChevronLeftRegular />}
                            disabled={historyPage === 1}
                            onClick={() => setHistoryPage((p) => p - 1)}
                          />
                          {getPageNumbers(historyPage, totalHistoryPages).map((p, i) =>
                            p === "..." ? (
                              <span
                                key={`ellipsis-${i}`}
                                style={{ padding: "0 4px", color: "#64748b", lineHeight: "32px" }}
                              >
                                …
                              </span>
                            ) : (
                              <Button
                                key={p}
                                appearance={p === historyPage ? "primary" : "subtle"}
                                style={
                                  p === historyPage
                                    ? { minWidth: "32px", borderRadius: "8px", background: "#007ED5", borderColor: "#007ED5" }
                                    : { minWidth: "32px", borderRadius: "8px" }
                                }
                                onClick={() => setHistoryPage(p as number)}
                              >
                                {p}
                              </Button>
                            )
                          )}
                          <Button
                            appearance="subtle"
                            icon={<ChevronRightRegular />}
                            disabled={historyPage >= totalHistoryPages}
                            onClick={() => setHistoryPage((p) => p + 1)}
                          />
                        </div>
                      )}
                    </div>
                  </>
                ))}
            </div>
          </div>
        </div>
      </div>

      <AssetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        asset={asset}
        currentUserId={currentUserId}
        onSaved={loadData}
        onAssetChanged={setAsset}
      />
    </div>
  );
};

const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", minWidth: 0 }}>
    <div style={{ color: "#007ED5", marginTop: "2px", flexShrink: 0, fontSize: "16px" }}>{icon}</div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <Caption1 style={{ color: "#64748b", display: "block" }}>{label}</Caption1>
      <TruncatedText text={value} weight="semibold" color="#1e293b" />
    </div>
  </div>
);

const HistoryList = ({ items }: { items: AssetItemHistoryRecord[] }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
    {items.map((h) => (
      <div
        key={h.ID}
        className="quadra-chip-pill"
        style={{
          display: "flex",
          gap: "12px",
          padding: "12px 14px",
          borderRadius: "12px",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(0, 126, 213, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#007ED5",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          <HistoryRegular fontSize={16} />
        </div>
        <div>
          <Text weight="semibold" size={300} style={{ color: "#0f172a" }}>
            {h.EventType}
            {h.OldStatus && h.NewStatus ? `: ${h.OldStatus} → ${h.NewStatus}` : ""}
          </Text>
          <br />
          <Caption1 style={{ color: "#64748b" }}>
            {formatDateTime(h.CreatedAt)}
            {h.PerformedBy ? ` · by ${h.PerformedBy}` : ""}
          </Caption1>
        </div>
      </div>
    ))}
  </div>
);

export default AssetDetail;
