import { useEffect, useState } from "react";
import {
  Button,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableBody,
  TableCell,
  Spinner,
  Text,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogTrigger,
  Field,
  Textarea,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { Edit20Regular } from "@fluentui/react-icons";
import { useAuth } from "../../../Auth/AuthProvider";
import {
  AssetConfigurationRecord,
  getAssetConfigurations,
  updateAssetConfigurationValue,
} from "../../../Asset/Services/AssetInventoryService";

const formatDate = (value: string) => new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const AssetConfigurationPanel = () => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userID ?? "";
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const [rows, setRows] = useState<AssetConfigurationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRow, setEditingRow] = useState<AssetConfigurationRecord | null>(null);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showError = (message: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{message}</ToastTitle>
      </Toast>,
      { intent: "error" }
    );
  };

  const loadRows = async () => {
    setLoading(true);
    try {
      const data = await getAssetConfigurations();
      setRows(data);
    } catch (err: any) {
      showError(err?.message || "Failed to load configuration");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  const openEdit = (row: AssetConfigurationRecord) => {
    setEditingRow(row);
    setValue(row.Value);
    setError(null);
  };

  const handleSave = async () => {
    if (!editingRow) return;
    if (!value.trim()) {
      setError("Value is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateAssetConfigurationValue(editingRow.ID, value.trim(), currentUserId);
      setEditingRow(null);
      loadRows();
    } catch (err: any) {
      setError(err?.message || "Failed to update value.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px" }}>
      <Toaster toasterId={toasterId} />

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spinner label="Loading configuration..." />
        </div>
      ) : rows.length === 0 ? (
        <Text style={{ color: "var(--colorNeutralForeground3)" }}>No configuration rows found.</Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Title</TableHeaderCell>
              <TableHeaderCell>TitleKey</TableHeaderCell>
              <TableHeaderCell>Value</TableHeaderCell>
              <TableHeaderCell>Created On</TableHeaderCell>
              <TableHeaderCell style={{ width: "100px" }}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.ID}>
                <TableCell>{row.Title}</TableCell>
                <TableCell>{row.TitleKey}</TableCell>
                <TableCell>
                  <Text truncate style={{ maxWidth: "320px", display: "block" }}>
                    {row.Value}
                  </Text>
                </TableCell>
                <TableCell>{formatDate(row.CreatedAt)}</TableCell>
                <TableCell>
                  <Button
                    appearance="subtle"
                    icon={<Edit20Regular />}
                    onClick={() => openEdit(row)}
                    aria-label="Edit value"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!editingRow} onOpenChange={(_, data) => !data.open && setEditingRow(null)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Edit {editingRow?.Title}</DialogTitle>
            <DialogContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
                <Field label="TitleKey">
                  <Text>{editingRow?.TitleKey}</Text>
                </Field>
                <Field label="Value" required>
                  <Textarea value={value} onChange={(_, d) => setValue(d.value)} rows={3} resize="vertical" />
                </Field>
              </div>
              {error && (
                <Text style={{ color: "var(--colorPaletteRedForeground1)", marginTop: "8px", fontSize: "13px" }}>
                  {error}
                </Text>
              )}
            </DialogContent>
            <DialogActions>
              <DialogTrigger disableButtonEnhancement>
                <Button appearance="secondary" disabled={saving}>
                  Cancel
                </Button>
              </DialogTrigger>
              <Button appearance="primary" onClick={handleSave} disabled={saving}>
                {saving ? <Spinner size="tiny" /> : "Save"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
};

export default AssetConfigurationPanel;
