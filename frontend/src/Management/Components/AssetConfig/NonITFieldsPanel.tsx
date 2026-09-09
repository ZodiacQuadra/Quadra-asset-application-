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
  NonITCategoryFieldRecord,
  NonITFieldType,
  getNonITCategoryFields,
  createNonITCategoryField,
  updateNonITCategoryField,
  deleteNonITCategoryField,
} from "../../../Asset/Services/NonITCategoryFieldService";

const FIELD_TYPES: NonITFieldType[] = ["Text", "Number", "Date"];

interface FieldGroup {
  key: string;
  fieldName: string;
  fieldType: NonITFieldType;
  categoryIds: string[];
  categoryNames: string[];
  rows: NonITCategoryFieldRecord[];
}

const groupFields = (fields: NonITCategoryFieldRecord[]): FieldGroup[] => {
  const map = new Map<string, FieldGroup>();
  fields.forEach((f) => {
    const key = f.FieldName.trim().toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.categoryIds.push(f.CategoryID);
      existing.categoryNames.push(f.CategoryName);
      existing.rows.push(f);
    } else {
      map.set(key, {
        key,
        fieldName: f.FieldName,
        fieldType: f.FieldType,
        categoryIds: [f.CategoryID],
        categoryNames: [f.CategoryName],
        rows: [f],
      });
    }
  });
  return Array.from(map.values()).sort((a, b) => a.fieldName.localeCompare(b.fieldName));
};

const NonITFieldsPanel = () => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userID ?? "";
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [fields, setFields] = useState<NonITCategoryFieldRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategoryId, setFilterCategoryId] = useState<string>("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FieldGroup | null>(null);
  const [formCategoryIds, setFormCategoryIds] = useState<string[]>([]);
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState<NonITFieldType>("Text");
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
      const [categoryData, fieldData] = await Promise.all([getAssetCategories("Non-IT"), getNonITCategoryFields()]);
      setCategories(categoryData);
      setFields(fieldData);
    } catch (err: any) {
      showError(err?.message || "Failed to load Non-IT fields");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const groups = useMemo(() => groupFields(fields), [fields]);

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
    setFieldName("");
    setFieldType("Text");
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (group: FieldGroup) => {
    setEditingGroup(group);
    setFormCategoryIds(group.categoryIds);
    setFieldName(group.fieldName);
    setFieldType(group.fieldType);
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
    if (!fieldName.trim()) {
      setError("Field Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const name = fieldName.trim();
    try {
      if (editingGroup) {
        // Reconcile: rows whose category was deselected are removed, rows
        // whose category stays are updated (name/type may have changed), and
        // newly selected categories are created — same shape as Category
        // Components' Edit reconciliation.
        const toRemove = editingGroup.rows.filter((r) => !formCategoryIds.includes(r.CategoryID));
        const toKeep = editingGroup.rows.filter((r) => formCategoryIds.includes(r.CategoryID));
        const existingCategoryIds = editingGroup.rows.map((r) => r.CategoryID);
        const toAddCategoryIds = formCategoryIds.filter((id) => !existingCategoryIds.includes(id));

        await Promise.all([
          ...toRemove.map((r) => deleteNonITCategoryField(r.ID, currentUserId)),
          ...toKeep.map((r) => updateNonITCategoryField(r.ID, r.CategoryID, name, fieldType, currentUserId)),
          toAddCategoryIds.length
            ? createNonITCategoryField(toAddCategoryIds, name, fieldType, currentUserId)
            : Promise.resolve([]),
        ]);
      } else {
        await createNonITCategoryField(formCategoryIds, name, fieldType, currentUserId);
      }
      setFormOpen(false);
      loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to save field.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (group: FieldGroup) => {
    setDeletingKey(group.key);
    try {
      await Promise.all(group.rows.map((r) => deleteNonITCategoryField(r.ID, currentUserId)));
      loadAll();
    } catch (err: any) {
      showError(err?.message || "Failed to delete field");
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
          Add Field
        </Button>
      </div>

      {categories.length === 0 && !loading && (
        <Text style={{ color: "var(--colorNeutralForeground3)" }}>
          No Non-IT categories exist yet — create one from the Category tab first (set its Type to "Non-IT").
        </Text>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
          <Spinner label="Loading fields..." />
        </div>
      ) : filteredGroups.length === 0 ? (
        <Text style={{ color: "var(--colorNeutralForeground3)" }}>No fields added yet.</Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Field Name</TableHeaderCell>
              <TableHeaderCell style={{ width: "100px" }}>Type</TableHeaderCell>
              <TableHeaderCell>Categories</TableHeaderCell>
              <TableHeaderCell style={{ width: "120px" }}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGroups.map((group) => (
              <TableRow key={group.key}>
                <TableCell>
                  <TruncatedText text={group.fieldName} />
                </TableCell>
                <TableCell>
                  <Badge appearance="outline">{group.fieldType}</Badge>
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
                      aria-label="Edit field"
                    />
                    <Button
                      appearance="subtle"
                      icon={<Delete20Regular />}
                      onClick={() => handleDeleteGroup(group)}
                      disabled={deletingKey === group.key}
                      aria-label="Delete field"
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
            <DialogTitle>{editingGroup ? "Edit Field" : "Add Field"}</DialogTitle>
            <DialogContent style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Field
                label="Categories"
                required
                hint="Select one or more Non-IT categories — the same field can apply to as many categories as needed."
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
              <Field label="Field Name" required>
                <Input value={fieldName} onChange={(_, d) => setFieldName(d.value)} />
              </Field>
              <Field label="Field Type" required>
                <Dropdown
                  mountNode={mountNode}
                  value={fieldType}
                  selectedOptions={[fieldType]}
                  onOptionSelect={(_, d) => setFieldType((d.optionValue as NonITFieldType) ?? "Text")}
                >
                  {FIELD_TYPES.map((t) => (
                    <Option key={t} value={t} text={t}>
                      {t}
                    </Option>
                  ))}
                </Dropdown>
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

export default NonITFieldsPanel;
