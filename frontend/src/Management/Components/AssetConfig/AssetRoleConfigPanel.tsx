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
  Badge,
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
  SpinButton,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import { Add20Regular, Edit20Regular, Delete20Regular, DismissRegular } from "@fluentui/react-icons";
import { useAuth } from "../../../Auth/AuthProvider";
import TruncatedText from "../../../Common/TruncatedText";
import { useThemedMountNode } from "../../../Common/useThemedMountNode";
import { AssetCategoryRecord, getAssetCategories } from "../../../Asset/Services/AssetInventoryService";
import {
  AssetRoleTemplateRecord,
  getAssetRoleTemplates,
  getAssetRoleTemplateDetail,
  createAssetRoleTemplate,
  updateAssetRoleTemplate,
  deleteAssetRoleTemplate,
} from "../../../Asset/Services/AssetRoleTemplateService";

interface RoleItemDraft {
  categoryId: string;
  quantity: number;
}

const AssetRoleConfigPanel = () => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userID ?? "";
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [roles, setRoles] = useState<AssetRoleTemplateRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<AssetRoleTemplateRecord | null>(null);
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<RoleItemDraft[]>([{ categoryId: "", quantity: 1 }]);
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

  const loadAll = async () => {
    setLoading(true);
    try {
      const [categoryData, roleData] = await Promise.all([getAssetCategories("IT"), getAssetRoleTemplates()]);
      setCategories(categoryData);
      setRoles(roleData);
    } catch (err: any) {
      showError(err?.message || "Failed to load asset roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const openAdd = () => {
    setEditingRole(null);
    setRoleName("");
    setDescription("");
    setItems([]);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = async (role: AssetRoleTemplateRecord) => {
    setEditingRole(role);
    setError(null);
    try {
      const detail = await getAssetRoleTemplateDetail(role.ID);
      setRoleName(detail.template.RoleName);
      setDescription(detail.template.Description ?? "");
      setItems(detail.items.map((i) => ({ categoryId: i.CategoryID, quantity: i.Quantity })));
      setFormOpen(true);
    } catch (err: any) {
      showError(err?.message || "Failed to load role details");
    }
  };

  const updateItem = (index: number, patch: Partial<RoleItemDraft>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const removeItemRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  // Single multiselect: pick as many categories as needed in one interaction
  // (each newly checked category is added as a row defaulting to quantity 1,
  // unchecking one removes its row) instead of adding one category at a time
  // via repeated "Add Category" clicks. Quantities are then adjusted inline
  // in the same rows below, in the same view.
  const selectedCategoryIds = items.filter((i) => i.categoryId).map((i) => i.categoryId);
  const handleCategoriesSelect = (selectedIds: string[]) => {
    setItems((prev) => {
      const existingByCategory = new Map(prev.filter((i) => i.categoryId).map((i) => [i.categoryId, i]));
      return selectedIds.map((categoryId) => existingByCategory.get(categoryId) ?? { categoryId, quantity: 1 });
    });
  };

  const handleSave = async () => {
    if (!roleName.trim()) {
      setError("Role Name is required.");
      return;
    }
    const validItems = items.filter((i) => i.categoryId && i.quantity > 0);
    if (!validItems.length) {
      setError("Add at least one category with a quantity.");
      return;
    }
    const categoryIds = validItems.map((i) => i.categoryId);
    if (new Set(categoryIds).size !== categoryIds.length) {
      setError("Each category can only be added once per role.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payloadItems = validItems.map((i) => ({ CategoryID: i.categoryId, Quantity: i.quantity }));
      if (editingRole) {
        await updateAssetRoleTemplate(editingRole.ID, {
          roleName: roleName.trim(),
          description: description.trim() || undefined,
          items: payloadItems,
          modifiedBy: currentUserId,
        });
      } else {
        await createAssetRoleTemplate({
          roleName: roleName.trim(),
          description: description.trim() || undefined,
          items: payloadItems,
          createdBy: currentUserId,
        });
      }
      setFormOpen(false);
      loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to save role.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: AssetRoleTemplateRecord) => {
    setDeletingId(role.ID);
    try {
      await deleteAssetRoleTemplate(role.ID, currentUserId);
      loadAll();
    } catch (err: any) {
      showError(err?.message || "Failed to delete role");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px" }}>
      <Toaster toasterId={toasterId} />
      {portal}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button appearance="primary" icon={<Add20Regular />} onClick={openAdd}>
          Add Role
        </Button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spinner label="Loading asset roles..." />
        </div>
      ) : roles.length === 0 ? (
        <Text style={{ color: "var(--colorNeutralForeground3)" }}>No asset roles configured yet.</Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Role Name</TableHeaderCell>
              <TableHeaderCell>Categories</TableHeaderCell>
              <TableHeaderCell style={{ width: "160px" }}>Assigned Employees</TableHeaderCell>
              <TableHeaderCell style={{ width: "120px" }}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <TableRow key={role.ID}>
                <TableCell>
                  <TruncatedText text={role.RoleName} weight="semibold" />
                  {role.Description && <TruncatedText text={role.Description} size={200} color="#605E5C" />}
                </TableCell>
                <TableCell>
                  <Badge appearance="tint" color="informative">
                    {role.CategoryCount} categor{role.CategoryCount === 1 ? "y" : "ies"}
                  </Badge>
                </TableCell>
                <TableCell>{role.AssignedEmployeeCount}</TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <Button appearance="subtle" icon={<Edit20Regular />} onClick={() => openEdit(role)} aria-label="Edit role" />
                    <Button
                      appearance="subtle"
                      icon={<Delete20Regular />}
                      onClick={() => handleDelete(role)}
                      disabled={deletingId === role.ID || role.AssignedEmployeeCount > 0}
                      aria-label="Delete role"
                      title={role.AssignedEmployeeCount > 0 ? "Reassign all employees off this role before deleting" : undefined}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={formOpen} onOpenChange={(_, data) => setFormOpen(data.open)}>
        <DialogSurface mountNode={mountNode}>
          <DialogBody>
            <DialogTitle>{editingRole ? "Edit Asset Role" : "Add Asset Role"}</DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Field label="Role Name" required>
                <Input placeholder="e.g., Developer" value={roleName} onChange={(_, d) => setRoleName(d.value)} />
              </Field>
              <Field label="Description">
                <Input placeholder="Optional" value={description} onChange={(_, d) => setDescription(d.value)} />
              </Field>

              <Field label="Categories" required hint="Select as many categories as needed in one go, then set each one's quantity below.">
                <Dropdown
                  multiselect
                  placeholder="Select categories"
                  mountNode={mountNode}
                  selectedOptions={selectedCategoryIds}
                  value={items.map((i) => categories.find((c) => c.ID === i.categoryId)?.CategoryName).filter(Boolean).join(", ")}
                  onOptionSelect={(_, d) => handleCategoriesSelect(d.selectedOptions)}
                >
                  {categories.map((c) => (
                    <Option key={c.ID} value={c.ID} text={c.CategoryName}>
                      {c.CategoryName}
                    </Option>
                  ))}
                </Dropdown>
              </Field>

              {items.length > 0 && (
                <Field label="Quantities">
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {items.map((item, index) => (
                      <div key={item.categoryId} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <Text style={{ flex: 1 }}>{categories.find((c) => c.ID === item.categoryId)?.CategoryName}</Text>
                        <SpinButton
                          value={item.quantity}
                          min={1}
                          step={1}
                          style={{ width: "90px" }}
                          onChange={(_, d) => updateItem(index, { quantity: d.value ?? 1 })}
                        />
                        <Button
                          appearance="subtle"
                          icon={<DismissRegular />}
                          onClick={() => removeItemRow(index)}
                          aria-label={`Remove ${categories.find((c) => c.ID === item.categoryId)?.CategoryName ?? "category"}`}
                        />
                      </div>
                    ))}
                  </div>
                </Field>
              )}

              {error && <Text style={{ color: "var(--colorPaletteRedForeground1)", fontSize: "13px" }}>{error}</Text>}
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

export default AssetRoleConfigPanel;
