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
  Dropdown,
  Option,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { Add20Regular, Edit20Regular, Delete20Regular } from "@fluentui/react-icons";
import { useAuth } from "../../../Auth/AuthProvider";
import TruncatedText from "../../../Common/TruncatedText";
import { useThemedMountNode } from "../../../Common/useThemedMountNode";
import {
  AssetBrandRecord,
  AssetBrandFormData,
  AssetCategoryRecord,
  getAssetBrands,
  createAssetBrand,
  updateAssetBrand,
  deleteAssetBrand,
  getAssetCategories,
} from "../../../Asset/Services/AssetInventoryService";

const emptyForm: AssetBrandFormData = {
  BrandName: "",
  CategoryID: null,
};

const AssetBrandPanel = () => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userID ?? "";
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);
  const { mountNode, portal: mountNodePortal } = useThemedMountNode();

  const [brands, setBrands] = useState<AssetBrandRecord[]>([]);
  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<AssetBrandRecord | null>(null);
  const [form, setForm] = useState<AssetBrandFormData>(emptyForm);
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

  const loadBrands = async () => {
    setLoading(true);
    try {
      const data = await getAssetBrands();
      setBrands(data);
    } catch (err: any) {
      showError(err?.message || "Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getAssetCategories("IT");
      setCategories(data);
    } catch (err: any) {
      showError(err?.message || "Failed to load categories");
    }
  };

  useEffect(() => {
    loadBrands();
    loadCategories();
  }, []);

  const openAdd = () => {
    setEditingBrand(null);
    setForm(emptyForm);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (brand: AssetBrandRecord) => {
    setEditingBrand(brand);
    setForm({ BrandName: brand.BrandName, CategoryID: brand.CategoryID });
    setError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.BrandName.trim()) {
      setError("Brand Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: AssetBrandFormData = { BrandName: form.BrandName.trim(), CategoryID: form.CategoryID || null };
      if (editingBrand) {
        await updateAssetBrand(editingBrand.ID, payload, currentUserId);
      } else {
        await createAssetBrand(payload, currentUserId);
      }
      setFormOpen(false);
      loadBrands();
    } catch (err: any) {
      setError(err?.message || "Failed to save brand.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (brand: AssetBrandRecord) => {
    setDeletingId(brand.ID);
    try {
      await deleteAssetBrand(brand.ID, currentUserId);
      loadBrands();
    } catch (err: any) {
      showError(err?.message || "Failed to delete brand");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px" }}>
      <Toaster toasterId={toasterId} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button appearance="primary" icon={<Add20Regular />} onClick={openAdd}>
          Add Brand
        </Button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spinner label="Loading brands..." />
        </div>
      ) : brands.length === 0 ? (
        <Text style={{ color: "var(--colorNeutralForeground3)" }}>No brands added yet.</Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Brand Name</TableHeaderCell>
              <TableHeaderCell>Category</TableHeaderCell>
              <TableHeaderCell style={{ width: "120px" }}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands.map((brand) => (
              <TableRow key={brand.ID}>
                <TableCell>
                  <TruncatedText text={brand.BrandName} />
                </TableCell>
                <TableCell>
                  <TruncatedText text={brand.CategoryName} />
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <Button
                      appearance="subtle"
                      icon={<Edit20Regular />}
                      onClick={() => openEdit(brand)}
                      aria-label="Edit brand"
                    />
                    <Button
                      appearance="subtle"
                      icon={<Delete20Regular />}
                      onClick={() => handleDelete(brand)}
                      disabled={deletingId === brand.ID}
                      aria-label="Delete brand"
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
            <DialogTitle>{editingBrand ? "Edit Brand" : "Add Brand"}</DialogTitle>
            <DialogContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
                <Field label="Brand Name" required>
                  <Input value={form.BrandName} onChange={(_, d) => setForm((prev) => ({ ...prev, BrandName: d.value }))} />
                </Field>
                <Field label="Category">
                  <Dropdown
                    value={categories.find((c) => c.ID === form.CategoryID)?.CategoryName ?? ""}
                    selectedOptions={form.CategoryID ? [form.CategoryID] : []}
                    onOptionSelect={(_, d) => setForm((prev) => ({ ...prev, CategoryID: d.optionValue ?? null }))}
                    mountNode={mountNode}
                  >
                    {categories.map((c) => (
                      <Option key={c.ID} value={c.ID} text={c.CategoryName}>
                        {c.CategoryName}
                      </Option>
                    ))}
                  </Dropdown>
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
      {mountNodePortal}
    </div>
  );
};

export default AssetBrandPanel;
