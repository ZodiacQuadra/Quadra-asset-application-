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
  Input,
  Textarea,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { Add20Regular, Edit20Regular, Delete20Regular } from "@fluentui/react-icons";
import { useAuth } from "../../../Auth/AuthProvider";
import TruncatedText from "../../../Common/TruncatedText";
import {
  AssetVendorRecord,
  AssetVendorFormData,
  getAssetVendors,
  createAssetVendor,
  updateAssetVendor,
  deleteAssetVendor,
} from "../../../Asset/Services/AssetInventoryService";

const emptyForm: AssetVendorFormData = {
  VendorName: "",
  VendorAddress: "",
  Pincode: "",
  GSTIN: "",
  Description: "",
};

const AssetVendorPanel = () => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userID ?? "";
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const [vendors, setVendors] = useState<AssetVendorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<AssetVendorRecord | null>(null);
  const [form, setForm] = useState<AssetVendorFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const showError = (message: string) => {
    dispatchToast(
      <Toast>
        <ToastTitle>{message}</ToastTitle>
      </Toast>,
      { intent: "error" }
    );
  };

  const loadVendors = async () => {
    setLoading(true);
    try {
      const data = await getAssetVendors();
      setVendors(data);
    } catch (err: any) {
      showError(err?.message || "Failed to load vendors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleChange = (field: keyof AssetVendorFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openAdd = () => {
    setEditingVendor(null);
    setForm(emptyForm);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (vendor: AssetVendorRecord) => {
    setEditingVendor(vendor);
    setForm({
      VendorName: vendor.VendorName,
      VendorAddress: vendor.VendorAddress ?? "",
      Pincode: vendor.Pincode ?? "",
      GSTIN: vendor.GSTIN ?? "",
      Description: vendor.Description ?? "",
    });
    setError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.VendorName.trim()) {
      setError("Vendor Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingVendor) {
        await updateAssetVendor(editingVendor.ID, form, currentUserId);
      } else {
        await createAssetVendor(form, currentUserId);
      }
      setFormOpen(false);
      loadVendors();
    } catch (err: any) {
      setError(err?.message || "Failed to save vendor.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (vendor: AssetVendorRecord) => {
    setDeletingId(vendor.ID);
    try {
      await deleteAssetVendor(vendor.ID, currentUserId);
      loadVendors();
    } catch (err: any) {
      showError(err?.message || "Failed to delete vendor");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px" }}>
      <Toaster toasterId={toasterId} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button appearance="primary" icon={<Add20Regular />} onClick={openAdd}>
          Add Vendor
        </Button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spinner label="Loading vendors..." />
        </div>
      ) : vendors.length === 0 ? (
        <Text style={{ color: "var(--colorNeutralForeground3)" }}>No vendors added yet.</Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Vendor Name</TableHeaderCell>
              <TableHeaderCell>Pincode</TableHeaderCell>
              <TableHeaderCell>GSTIN</TableHeaderCell>
              <TableHeaderCell>Description</TableHeaderCell>
              <TableHeaderCell style={{ width: "120px" }}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendors.map((vendor) => (
              <TableRow key={vendor.ID}>
                <TableCell>
                  <TruncatedText text={vendor.VendorName} />
                </TableCell>
                <TableCell>{vendor.Pincode ?? "—"}</TableCell>
                <TableCell>{vendor.GSTIN ?? "—"}</TableCell>
                <TableCell>
                  <TruncatedText text={vendor.Description} maxWidth="220px" />
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <Button
                      appearance="subtle"
                      icon={<Edit20Regular />}
                      onClick={() => openEdit(vendor)}
                      aria-label="Edit vendor"
                    />
                    <Button
                      appearance="subtle"
                      icon={<Delete20Regular />}
                      onClick={() => handleDelete(vendor)}
                      disabled={deletingId === vendor.ID}
                      aria-label="Delete vendor"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={formOpen} onOpenChange={(_, data) => setFormOpen(data.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{editingVendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
            <DialogContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
                <Field label="Vendor Name" required>
                  <Input value={form.VendorName} onChange={(_, d) => handleChange("VendorName", d.value)} />
                </Field>
                <Field label="Vendor Address">
                  <Textarea
                    value={form.VendorAddress}
                    onChange={(_, d) => handleChange("VendorAddress", d.value)}
                    resize="vertical"
                  />
                </Field>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <Field label="Pincode">
                    <Input value={form.Pincode} onChange={(_, d) => handleChange("Pincode", d.value)} />
                  </Field>
                  <Field label="GSTIN">
                    <Input value={form.GSTIN} onChange={(_, d) => handleChange("GSTIN", d.value)} />
                  </Field>
                </div>
                <Field label="Description">
                  <Textarea
                    value={form.Description}
                    onChange={(_, d) => handleChange("Description", d.value)}
                    resize="vertical"
                  />
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

export default AssetVendorPanel;
