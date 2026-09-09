import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Badge, Text, Caption1, TabList, Tab, Spinner, tokens } from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  EditRegular,
  TagRegular,
  DocumentRegular,
  LocationRegular,
  CurrencyDollarRupeeRegular,
  BuildingRegular,
  ShieldRegular,
  HistoryRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import TruncatedText from "../../Common/TruncatedText";
import NonITAssetFormDialog from "../Components/NonITAssetFormDialog";
import { AssetStatus } from "../Services/AssetInventoryService";
import {
  NonITAssetRecord,
  NonITAssetHistoryRecord,
  getNonITAssetById,
  getNonITAssetHistory,
} from "../Services/NonITAssetService";

const STATUS_BADGE_COLOR: Record<AssetStatus, "success" | "danger" | "informative" | "warning" | "subtle"> = {
  Assigned: "success",
  "In Use": "success",
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

const formatValue = (value: number | null): string => (value == null ? "—" : `₹${value.toLocaleString("en-IN")}`);

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

const NonITAssetDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userID ?? "";

  const [asset, setAsset] = useState<NonITAssetRecord | null>(null);
  const [history, setHistory] = useState<NonITAssetHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [formOpen, setFormOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  const totalHistoryPages = Math.max(1, Math.ceil(history.length / HISTORY_PAGE_SIZE));
  const pagedHistory = useMemo(
    () => history.slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE),
    [history, historyPage]
  );

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [assetData, historyData] = await Promise.all([getNonITAssetById(id), getNonITAssetHistory(id)]);
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
  }, [id]);

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
          <Button appearance="secondary" icon={<ArrowLeftRegular />} onClick={() => navigate("/Asset/non-it-assets")}>
            Back to Non-IT Assets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
        <Button appearance="transparent" icon={<ArrowLeftRegular />} onClick={() => navigate("/Asset/non-it-assets")}>
          Back to Non-IT Assets
        </Button>
        <Button appearance="primary" shape="circular" icon={<EditRegular />} onClick={() => setFormOpen(true)}>
          Edit
        </Button>
      </div>

      <div style={{ minWidth: 0 }}>
        <TruncatedText text={asset.CategoryName} size={600} weight="bold" style={{ fontSize: "24px" }} />
        <Caption1 style={{ color: "var(--colorNeutralForeground3)" }}>Asset Tag: {asset.AssetTag}</Caption1>
      </div>

      {error && <Text style={{ color: "var(--colorPaletteRedForeground1)" }}>{error}</Text>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px", alignItems: "start" }}>
        <div
          style={{
            position: "relative",
            borderRadius: "12px",
            overflow: "hidden",
            background: "var(--colorNeutralBackground3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "220px",
          }}
        >
          <TagRegular fontSize={64} style={{ color: "var(--colorNeutralForeground3)" }} />
          <div style={{ position: "absolute", top: "12px", right: "12px" }}>
            <Badge appearance="filled" color={STATUS_BADGE_COLOR[asset.Status] ?? "informative"} size="large">
              {asset.Status}
            </Badge>
          </div>
        </div>

        <div>
          <TabList selectedValue={activeTab} onTabSelect={(_, data) => setActiveTab(data.value as TabKey)}>
            <Tab value="overview">Overview</Tab>
            <Tab value="maintenance">Maintenance</Tab>
            <Tab value="documents">Documents</Tab>
            <Tab value="history">History</Tab>
          </TabList>

          <div style={{ paddingTop: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {activeTab === "overview" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <Text weight="semibold">Asset Information</Text>
                    <InfoRow icon={<TagRegular />} label="Category" value={asset.CategoryName} />
                    <InfoRow icon={<LocationRegular />} label="Location" value={asset.LocationName ?? "—"} />
                    <InfoRow
                      icon={<LocationRegular />}
                      label="Floor"
                      value={asset.Floor != null ? `Floor ${asset.Floor}` : "—"}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <Text weight="semibold">Purchase Information</Text>
                    <InfoRow icon={<CurrencyDollarRupeeRegular />} label="Value" value={formatValue(asset.Value)} />
                    <InfoRow icon={<BuildingRegular />} label="Vendor" value={asset.VendorName ?? "—"} />
                    <InfoRow icon={<ShieldRegular />} label="AMC Expiry" value={formatDate(asset.AMCExpiryDate)} />
                  </div>
                </div>

                {asset.FieldValues && asset.FieldValues.length > 0 && (
                  <div>
                    <Text weight="semibold">Category Fields</Text>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginTop: "12px" }}>
                      {asset.FieldValues.map((fv) => (
                        <InfoRow key={fv.FieldID} icon={<TagRegular />} label={fv.FieldName} value={fv.FieldValue || "—"} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === "maintenance" &&
              (maintenanceHistory.length === 0 ? (
                <Text style={{ color: "var(--colorNeutralForeground3)" }}>No maintenance records yet.</Text>
              ) : (
                <HistoryList items={maintenanceHistory} />
              ))}

            {activeTab === "documents" &&
              (asset.Attachments.length === 0 ? (
                <Text style={{ color: "var(--colorNeutralForeground3)" }}>No documents uploaded yet.</Text>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {asset.Attachments.map((f) => (
                    <div
                      key={f.relativePath}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                        border: "1px solid var(--colorNeutralStroke2)",
                        borderRadius: "6px",
                      }}
                    >
                      <DocumentRegular style={{ flexShrink: 0 }} />
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        title={f.fileName}
                        style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                      >
                        {f.fileName}
                      </a>
                    </div>
                  ))}
                </div>
              ))}

            {activeTab === "history" &&
              (history.length === 0 ? (
                <Text style={{ color: "var(--colorNeutralForeground3)" }}>No history yet.</Text>
              ) : (
                <>
                  <HistoryList items={pagedHistory} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "14px" }}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      Showing {(historyPage - 1) * HISTORY_PAGE_SIZE + 1}–
                      {Math.min(historyPage * HISTORY_PAGE_SIZE, history.length)} of {history.length} updates
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
                              style={{ padding: "0 4px", color: tokens.colorNeutralForeground3, lineHeight: "32px" }}
                            >
                              …
                            </span>
                          ) : (
                            <Button
                              key={p}
                              appearance={p === historyPage ? "primary" : "subtle"}
                              style={{ minWidth: "32px" }}
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

      <NonITAssetFormDialog
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
    <div style={{ color: "var(--colorNeutralForeground3)", marginTop: "2px", flexShrink: 0 }}>{icon}</div>
    <div style={{ minWidth: 0, flex: 1 }}>
      <Caption1 style={{ color: "var(--colorNeutralForeground3)", display: "block" }}>{label}</Caption1>
      <TruncatedText text={value} weight="semibold" />
    </div>
  </div>
);

const HistoryList = ({ items }: { items: NonITAssetHistoryRecord[] }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
    {items.map((h) => (
      <div
        key={h.ID}
        style={{
          display: "flex",
          gap: "10px",
          padding: "8px 10px",
          border: "1px solid var(--colorNeutralStroke2)",
          borderRadius: "6px",
        }}
      >
        <HistoryRegular style={{ marginTop: "2px" }} />
        <div>
          <Text weight="semibold">
            {h.EventType}
            {h.OldStatus && h.NewStatus ? `: ${h.OldStatus} → ${h.NewStatus}` : ""}
          </Text>
          <br />
          <Caption1 style={{ color: "var(--colorNeutralForeground3)" }}>
            {formatDateTime(h.CreatedAt)}
            {h.PerformedBy ? ` · by ${h.PerformedBy}` : ""}
          </Caption1>
        </div>
      </div>
    ))}
  </div>
);

export default NonITAssetDetail;
