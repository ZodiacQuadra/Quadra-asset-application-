import { useEffect, useMemo, useState } from "react";
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
import { AssetCategoryRecord, getAssetCategories } from "../../../Asset/Services/AssetInventoryService";
import {
  AssetCategoryComponentRecord,
  getAssetCategoryComponents,
  createAssetCategoryComponent,
  updateAssetCategoryComponent,
  deleteAssetCategoryComponent,
} from "../../../Asset/Services/AssetCategoryComponentService";

interface ComponentGroup {
  key: string;
  componentName: string;
  categoryIds: string[];
  categoryNames: string[];
  rows: AssetCategoryComponentRecord[];
}

const groupComponents = (components: AssetCategoryComponentRecord[]): ComponentGroup[] => {
  const map = new Map<string, ComponentGroup>();
  components.forEach((c) => {
    const key = c.ComponentName.trim().toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.categoryIds.push(c.CategoryID);
      existing.categoryNames.push(c.CategoryName);
      existing.rows.push(c);
    } else {
      map.set(key, {
        key,
        componentName: c.ComponentName,
        categoryIds: [c.CategoryID],
        categoryNames: [c.CategoryName],
        rows: [c],
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => a.componentName.localeCompare(b.componentName));
};

const AssetCategoryComponentPanel = () => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userID ?? "";
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [components, setComponents] = useState<AssetCategoryComponentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ComponentGroup | null>(null);
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);
  const [componentName, setComponentName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);

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
      const [categoryData, componentData] = await Promise.all([getAssetCategories("IT"), getAssetCategoryComponents()]);
      setCategories(categoryData);
      setComponents(componentData);
    } catch (err: any) {
      showError(err?.message || "Failed to load category components");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const groups = useMemo(() => groupComponents(components), [components]);

  const filteredGroups = useMemo(
    () => (filterCategoryId ? groups.filter((g) => g.categoryIds.includes(filterCategoryId)) : groups),
    [groups, filterCategoryId]
  );

  const selectedCategoryNames = useMemo(
    () => categories.filter((c) => formCategoryIds.includes(c.ID)).map((c) => c.CategoryName),
    [categories, formCategoryIds]
  );

  const openAdd = () => {
    setEditingGroup(null);
    setFormCategoryIds([]);
    setComponentName("");
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (group: ComponentGroup) => {
    setEditingGroup(group);
    setFormCategoryIds(group.categoryIds);
    setComponentName(group.componentName);
    setError(null);
    setFormOpen(true);
  };

  const handleSelectAllCategories = () => {
    setFormCategoryIds(categories.map((c) => c.ID));
  };

  const handleSave = async () => {
    if (!formCategoryIds.length) {
      setError("Select at least one category.");
      return;
    }
    if (!componentName.trim()) {
      setError("Component Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const name = componentName.trim();
    try {
      if (editingGroup) {
        // Reconcile: rows whose category was deselected are removed, rows
        // whose category stays are renamed (in case the name changed), and
        // newly selected categories are created — same schema, no new rows
        // for categories that were already there and are still selected.
        const toRemove = editingGroup.rows.filter((r) => !formCategoryIds.includes(r.CategoryID));
        const toKeep = editingGroup.rows.filter((r) => formCategoryIds.includes(r.CategoryID));
        const existingCategoryIds = editingGroup.rows.map((r) => r.CategoryID);
        const toAddCategoryIds = formCategoryIds.filter((id) => !existingCategoryIds.includes(id));

        await Promise.all([
          ...toRemove.map((r) => deleteAssetCategoryComponent(r.ID, currentUserId)),
          ...toKeep.map((r) => updateAssetCategoryComponent(r.ID, r.CategoryID, name, currentUserId)),
          toAddCategoryIds.length ? createAssetCategoryComponent(toAddCategoryIds, name, currentUserId) : Promise.resolve([]),
        ]);
      } else {
        await createAssetCategoryComponent(formCategoryIds, name, currentUserId);
      }
      setFormOpen(false);
      loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to save component.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (group: ComponentGroup) => {
    setDeletingKey(group.key);
    try {
      await Promise.all(group.rows.map((r) => deleteAssetCategoryComponent(r.ID, currentUserId)));
      loadAll();
    } catch (err: any) {
      showError(err?.message || "Failed to delete component");
    } finally {
      setDeletingKey(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px" }}>
      <Toaster toasterId={toasterId} />
      {portal}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <Dropdown
          placeholder="Filter by category"
          mountNode={mountNode}
          style={{ minWidth: "220px" }}
          value={categories.find((c) => c.ID === filterCategoryId)?.CategoryName ?? "All Categories"}
          onOptionSelect={(_, d) => setFilterCategoryId(d.optionValue === "all" ? "" : d.optionValue ?? "")}
        >
          <Option key="all" value="all">
            All Categories
          </Option>
          {categories.map((c) => (
            <Option key={c.ID} value={c.ID}>
              {c.CategoryName}
            </Option>
          ))}
        </Dropdown>
        <Button appearance="primary" icon={<Add20Regular />} onClick={openAdd}>
          Add Component
        </Button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spinner label="Loading components..." />
        </div>
      ) : filteredGroups.length === 0 ? (
        <Text style={{ color: "var(--colorNeutralForeground3)" }}>No components added yet.</Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Component Name</TableHeaderCell>
              <TableHeaderCell>Categories</TableHeaderCell>
              <TableHeaderCell style={{ width: "120px" }}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.map((group) => (
              <TableRow key={group.key}>
                <TableCell>
                  <TruncatedText text={group.componentName} />
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                    {group.categoryNames.length === categories.length && categories.length > 0 ? (
                      <Badge appearance="tint" color="informative">
                        All Categories
                      </Badge>
                    ) : (
                      group.categoryNames.map((name, i) => (
                        <Badge key={`${group.key}-${i}`} appearance="outline">
                          {name}
                        </Badge>
                      ))
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <Button
                      appearance="subtle"
                      icon={<Edit20Regular />}
                      onClick={() => openEdit(group)}
                      aria-label="Edit component"
                    />
                    <Button
                      appearance="subtle"
                      icon={<Delete20Regular />}
                      onClick={() => handleDeleteGroup(group)}
                      disabled={deletingKey === group.key}
                      aria-label="Delete component"
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
            <DialogTitle>{editingGroup ? "Edit Component" : "Add Component"}</DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Field
                label="Categories"
                required
                hint="Select one or more categories — the same component can apply to as many categories as needed."
              >
                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <Dropdown
                    multiselect
                    placeholder="Select categories"
                    mountNode={mountNode}
                    style={{ flex: 1 }}
                    selectedOptions={formCategoryIds}
                    value={selectedCategoryNames.join(", ")}
                    onOptionSelect={(_, d) => setFormCategoryIds(d.selectedOptions)}
                  >
                    {categories.map((c) => (
                      <Option key={c.ID} value={c.ID} text={c.CategoryName}>
                        {c.CategoryName}
                      </Option>
                    ))}
                  </Dropdown>
                  <Button appearance="secondary" onClick={handleSelectAllCategories}>
                    Select All
                  </Button>
                </div>
              </Field>
              <Field label="Component Name" required>
                <Input value={componentName} onChange={(_, d) => setComponentName(d.value)} />
              </Field>
              {error && (
                <Text style={{ color: "var(--colorPaletteRedForeground1)", fontSize: "13px" }}>{error}</Text>
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

export default AssetCategoryComponentPanel;
