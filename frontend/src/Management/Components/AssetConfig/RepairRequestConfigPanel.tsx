import React, { useEffect, useState } from "react";
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
  RepairMasterRecord,
  RepairIssueTypeService,
  RepairProblemCategoryService,
} from "../../../Asset/Services/RepairRequestMasterService";

interface MasterListSectionProps {
  title: string;
  addLabel: string;
  service: {
    list: () => Promise<RepairMasterRecord[]>;
    create: (name: string, createdByUserId: string) => Promise<RepairMasterRecord>;
    update: (id: string, name: string, updatedByUserId: string) => Promise<RepairMasterRecord>;
    remove: (id: string, updatedByUserId: string) => Promise<void>;
  };
}

const MasterListSection: React.FC<MasterListSectionProps> = ({ title, addLabel, service }) => {
  const { currentUser } = useAuth();
  const currentUserId = currentUser?.userID ?? "";
  const toasterId = useId();
  const { dispatchToast } = useToastController(toasterId);

  const [items, setItems] = useState<RepairMasterRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RepairMasterRecord | null>(null);
  const [name, setName] = useState("");
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

  const loadItems = async () => {
    setLoading(true);
    try {
      setItems(await service.list());
    } catch (err: any) {
      showError(err?.message || `Failed to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAdd = () => {
    setEditingItem(null);
    setName("");
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (item: RepairMasterRecord) => {
    setEditingItem(item);
    setName(item.Name);
    setError(null);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingItem) {
        await service.update(editingItem.ID, name.trim(), currentUserId);
      } else {
        await service.create(name.trim(), currentUserId);
      }
      setFormOpen(false);
      loadItems();
    } catch (err: any) {
      setError(err?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: RepairMasterRecord) => {
    setDeletingId(item.ID);
    try {
      await service.remove(item.ID, currentUserId);
      loadItems();
    } catch (err: any) {
      showError(err?.message || "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1, minWidth: "320px" }}>
      <Toaster toasterId={toasterId} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Text weight="semibold">{title}</Text>
        <Button appearance="primary" size="small" icon={<Add20Regular />} onClick={openAdd}>
          {addLabel}
        </Button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
          <Spinner size="tiny" />
        </div>
      ) : items.length === 0 ? (
        <Text style={{ color: "var(--colorNeutralForeground3)" }}>None added yet.</Text>
      ) : (
        <Table size="small">
          <TableHeader>
            <TableRow>
              <TableHeaderCell>Name</TableHeaderCell>
              <TableHeaderCell style={{ width: "90px" }}>Actions</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.ID}>
                <TableCell>
                  <TruncatedText text={item.Name} />
                </TableCell>
                <TableCell>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <Button appearance="subtle" size="small" icon={<Edit20Regular />} onClick={() => openEdit(item)} aria-label="Edit" />
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Delete20Regular />}
                      onClick={() => handleDelete(item)}
                      disabled={deletingId === item.ID}
                      aria-label="Delete"
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
            <DialogTitle>{editingItem ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
            <DialogContent>
              <Field label="Name" required>
                <Input value={name} onChange={(_, d) => setName(d.value)} />
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
    </div>
  );
};

type SubTab = "issueType" | "problemCategory";

const RepairRequestConfigPanel = () => {
  const [subTab, setSubTab] = useState<SubTab>("issueType");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px" }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <Button appearance={subTab === "issueType" ? "primary" : "outline"} shape="rounded" onClick={() => setSubTab("issueType")}>
          Issue Type
        </Button>
        <Button
          appearance={subTab === "problemCategory" ? "primary" : "outline"}
          shape="rounded"
          onClick={() => setSubTab("problemCategory")}
        >
          Problem Category
        </Button>
      </div>

      {subTab === "issueType" ? (
        <MasterListSection title="Issue Type" addLabel="Add Issue Type" service={RepairIssueTypeService} />
      ) : (
        <MasterListSection title="Problem Category" addLabel="Add Problem Category" service={RepairProblemCategoryService} />
      )}
    </div>
  );
};

export default RepairRequestConfigPanel;
