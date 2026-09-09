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
  Badge,
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
  AssetCategoryRecord,
  AssetCategoryType,
  getAssetCategories,
  createAssetCategory,
  updateAssetCategory,
  deleteAssetCategory,
} from "../../../Asset/Services/AssetInventoryService";

const CATEGORY_TYPES: AssetCategoryType[] = ["IT", "Non-IT"];

const AssetCategoryPanel = () => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userID ?? "";
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);
  const { mountNode, portal } = useThemedMountNode();

  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AssetCategoryRecord | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<AssetCategoryType>("IT");
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

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getAssetCategories();
      setCategories(data);
    } catch (err: any) {
      showError(err?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAdd = () => {
    setEditingCategory(null);
    setCategoryName("");
    setCategoryType("IT");
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (category: AssetCategoryRecord) => {
    setEditingCategory(category);
    setCategoryName(category.CategoryName);
    setCategoryType(category.CategoryType);
    setError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      setError("Category Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingCategory) {
        await updateAssetCategory(editingCategory.ID, categoryName.trim(), categoryType, currentUserId);
      } else {
        await createAssetCategory(categoryName.trim(), categoryType, currentUserId);
      }
      setFormOpen(false);
      loadCategories();
    } catch (err: any) {
      setError(err?.message || "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: AssetCategoryRecord) => {
    setDeletingId(category.ID);
    try {
      await deleteAssetCategory(category.ID, currentUserId);
      loadCategories();
    } catch (err: any) {
      showError(err?.message || "Failed to delete category");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px" }}>
      <Toaster toasterId={toasterId} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button appearance="primary" icon={<Add20Regular />} onClick={openAdd}>
          Add Category
        </Button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spinner label="Loading categories..." />
        </div>
      ) : categories.length === 0 ? (
        <Text style={{ color: "var(--colorNeutralForeground3)" }}>No categories added yet.</Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Category Name</TableHeaderCell>
              <TableHeaderCell style={{ width: "120px" }}>Type</TableHeaderCell>
              <TableHeaderCell style={{ width: "120px" }}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.ID}>
                <TableCell>
                  <TruncatedText text={category.CategoryName} />
                </TableCell>
                <TableCell>
                  <Badge appearance="tint" color={category.CategoryType === "IT" ? "informative" : "warning"}>
                    {category.CategoryType}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <Button
                      appearance="subtle"
                      icon={<Edit20Regular />}
                      onClick={() => openEdit(category)}
                      aria-label="Edit category"
                    />
                    <Button
                      appearance="subtle"
                      icon={<Delete20Regular />}
                      onClick={() => handleDelete(category)}
                      disabled={deletingId === category.ID}
                      aria-label="Delete category"
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
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogContent>
              <Field label="Category Name" required>
                <Input value={categoryName} onChange={(_, d) => setCategoryName(d.value)} />
              </Field>
              <Field label="Type" required style={{ marginTop: "12px" }}>
                <Dropdown
                  value={categoryType}
                  selectedOptions={[categoryType]}
                  mountNode={mountNode}
                  onOptionSelect={(_, d) => setCategoryType((d.optionValue as AssetCategoryType) ?? "IT")}
                >
                  {CATEGORY_TYPES.map((t) => (
                    <Option key={t} value={t} text={t}>
                      {t}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
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
      {portal}
    </div>
  );
};

export default AssetCategoryPanel;
