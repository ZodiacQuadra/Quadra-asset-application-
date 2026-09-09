import { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Field,
  Input,
  Dropdown,
  Option,
  Spinner,
  Divider,
  Text,
} from "@fluentui/react-components";
import { Dismiss24Regular, BoxToolboxRegular } from "@fluentui/react-icons";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import AssetFileUploadSection from "./AssetFileUploadSection";
import { AssetCategoryRecord, AssetVendorRecord, AssetStatus, getAssetCategories, getAssetVendors } from "../Services/AssetInventoryService";
import { AppLocation, getAppLocations } from "../../Services/Location";
import { getNonITCategoryFields, NonITCategoryFieldRecord } from "../Services/NonITCategoryFieldService";
import {
  NonITAssetRecord,
  NonITAssetFormData,
  createNonITAsset,
  createNonITAssetsBulk,
  updateNonITAsset,
  getNextNonITAssetTagPreview,
  uploadNonITAssetAttachments,
  deleteNonITAssetAttachment,
  getNonITAssetById,
  getNonITAssets,
} from "../Services/NonITAssetService";

const STATUS_OPTIONS: AssetStatus[] = ["In Stock", "Assigned", "Under Maintenance", "End of Use", "Reserved"];

interface NonITAssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: NonITAssetRecord | null;
  currentUserId: string;
  onSaved: () => void;
  onAssetChanged: (asset: NonITAssetRecord) => void;
}

const NonITAssetFormDialog: React.FC<NonITAssetFormDialogProps> = ({
  open,
  onOpenChange,
  asset,
  currentUserId,
  onSaved,
  onAssetChanged,
}) => {
  const isEdit = !!asset;
  const { mountNode, portal } = useThemedMountNode();

  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [vendors, setVendors] = useState<AssetVendorRecord[]>([]);
  const [locations, setLocations] = useState<AppLocation[]>([]);
  const [allAssets, setAllAssets] = useState<NonITAssetRecord[]>([]);
  const [fields, setFields] = useState<NonITCategoryFieldRecord[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const [form, setForm] = useState<NonITAssetFormData>({
    AssetCategoryID: "",
    Location: null,
    Floor: null,
    VendorID: null,
    Status: "In Stock",
    AMCExpiryDate: null,
    Value: null,
  });

  const [nextTagPreview, setNextTagPreview] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [pendingAttachments, setPendingAttachments] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    Promise.all([getAssetCategories("Non-IT"), getAssetVendors(), getAppLocations(), getNonITAssets()])
      .then(([c, v, l, assets]) => {
        setCategories(c);
        setVendors(v);
        setLocations(l);
        setAllAssets(assets);
      })
      .catch(() => {
        // Dropdown options are best-effort.
      });

    setPendingAttachments([]);
    setQuantity(1);
    setError(null);

    if (asset) {
      setForm({
        AssetCategoryID: asset.AssetCategoryID,
        Location: asset.Location,
        Floor: asset.Floor,
        VendorID: asset.VendorID,
        Status: asset.Status,
        AMCExpiryDate: asset.AMCExpiryDate,
        Value: asset.Value,
      });
    } else {
      setForm({ AssetCategoryID: "", Location: null, Floor: null, VendorID: null, Status: "In Stock", AMCExpiryDate: null, Value: null });
      setNextTagPreview("");
      getNextNonITAssetTagPreview()
        .then(setNextTagPreview)
        .catch(() => {
          // Display-only.
        });
    }
  }, [open, asset]);

  // Dynamic per-category field definitions + (in edit mode) the asset's
  // existing saved values — same pattern as AssetFormDialog's component
  // specification section.
  useEffect(() => {
    if (!open || !form.AssetCategoryID) {
      setFields([]);
      setFieldValues({});
      return;
    }
    getNonITCategoryFields(form.AssetCategoryID)
      .then(setFields)
      .catch(() => setFields([]));

    if (asset && asset.AssetCategoryID === form.AssetCategoryID) {
      getNonITAssetById(asset.ID)
        .then((full) => {
          const map: Record<string, string> = {};
          (full.FieldValues ?? []).forEach((fv) => {
            if (fv.FieldValue) map[fv.FieldID] = fv.FieldValue;
          });
          setFieldValues(map);
        })
        .catch(() => setFieldValues({}));
    } else {
      setFieldValues({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, form.AssetCategoryID, asset]);

  const handleChange = (field: keyof NonITAssetFormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // One Non-IT asset per (Location, Floor) — a floor already used by another
  // asset is excluded from that location's Floor options, and a location
  // with every floor already used (or with no floor count configured at
  // all) is excluded from the Location dropdown entirely.
  const occupiedByLocation = useMemo(() => {
    const map: Record<string, Set<number>> = {};
    allAssets.forEach((a) => {
      if (asset && a.ID === asset.ID) return; // exclude the asset being edited from its own occupancy
      if (!a.Location || a.Floor == null) return;
      if (!map[a.Location]) map[a.Location] = new Set();
      map[a.Location].add(a.Floor);
    });
    return map;
  }, [allAssets, asset]);

  const availableFloorsFor = (locationId: string): number[] => {
    const location = locations.find((l) => l.Id === locationId);
    if (!location?.NumberOfFloors) return [];
    const occupied = occupiedByLocation[locationId] ?? new Set<number>();
    return Array.from({ length: location.NumberOfFloors }, (_, i) => i + 1).filter((f) => !occupied.has(f));
  };

  const availableLocations = useMemo(() => {
    const qualifying = locations.filter((l) => l.NumberOfFloors && availableFloorsFor(l.Id).length > 0);
    // Always keep the asset's own current Location selectable, even if it no
    // longer qualifies (e.g. its floor count was cleared after this asset
    // was saved) — otherwise editing silently loses the field's value.
    if (asset?.Location && !qualifying.some((l) => l.Id === asset.Location)) {
      const current = locations.find((l) => l.Id === asset.Location);
      if (current) return [...qualifying, current];
    }
    return qualifying;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locations, occupiedByLocation, asset]);

  const floorOptions = form.Location ? availableFloorsFor(form.Location) : [];

  // Location/Floor are single-slot (one asset per floor) so they're
  // meaningless for a bulk create — force them clear the moment quantity
  // goes above 1, and the fields disable in the UI below.
  const handleQuantityChange = (value: number) => {
    setQuantity(value);
    if (value > 1) {
      setForm((prev) => ({ ...prev, Location: null, Floor: null }));
    }
  };

  const handleLocationChange = (locationId: string | null) => {
    const floors = locationId ? availableFloorsFor(locationId) : [];
    setForm((prev) => ({
      ...prev,
      Location: locationId,
      Floor: prev.Floor != null && floors.includes(prev.Floor) ? prev.Floor : null,
    }));
  };

  const buildFieldValuesPayload = () =>
    Object.entries(fieldValues)
      .filter(([, value]) => value.trim().length > 0)
      .map(([fieldId, value]) => ({ FieldID: fieldId, FieldValue: value.trim() }));

  const handleSave = async () => {
    if (!form.AssetCategoryID) {
      setError("Category is required.");
      return;
    }
    setSaving(true);
    setError(null);

    // Bulk create — quantity > 1 only ever applies to a brand-new Add
    // (never Edit, which is always exactly one existing row). Location/Floor
    // are already forced null once quantity > 1 (one asset per floor slot
    // makes them meaningless for a batch), same shape as the IT side's
    // Assign Employee restriction.
    //
    // The N rows themselves are created in ONE network round trip
    // (sp_CreateNonITAssetBulk reserves the tag sequence once for the whole
    // batch) instead of N sequential create calls. Attachments still apply
    // per asset — inherently one call per file per asset — but the slow
    // part (N separate creates) is now a single call.
    if (!isEdit && quantity > 1) {
      try {
        const payload: NonITAssetFormData = { ...form, FieldValues: buildFieldValuesPayload() };
        const createdRows = await createNonITAssetsBulk(payload, quantity, currentUserId);
        let processedCount = 0;
        try {
          for (const row of createdRows) {
            if (pendingAttachments.length) {
              await uploadNonITAssetAttachments(row.ID, pendingAttachments);
            }
            processedCount++;
          }
          onSaved();
          onOpenChange(false);
        } catch (postErr: any) {
          onSaved();
          setError(
            `${createdRows.length} assets were created (tags ${createdRows[0]?.AssetTag}–${createdRows[createdRows.length - 1]?.AssetTag}), but attaching files failed after ${processedCount} of ${createdRows.length}: ${postErr?.message || "unknown error"}. Edit the remaining assets individually to retry.`
          );
        }
      } catch (err: any) {
        setError(err?.message || "Failed to create assets.");
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      const payload: NonITAssetFormData = { ...form, FieldValues: buildFieldValuesPayload() };

      const savedAsset = isEdit && asset ? await updateNonITAsset(asset.ID, payload, currentUserId) : await createNonITAsset(payload, currentUserId);

      try {
        if (pendingAttachments.length) {
          savedAsset.Attachments = await uploadNonITAssetAttachments(savedAsset.ID, pendingAttachments);
        }
        onSaved();
        onOpenChange(false);
      } catch (uploadErr: any) {
        onSaved();
        onAssetChanged(savedAsset);
        setError(uploadErr?.message || "Asset was saved, but uploading attachments failed. You can retry below.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to save Non-IT asset.");
    } finally {
      setSaving(false);
    }
  };

  const renderFieldInput = (f: NonITCategoryFieldRecord) => {
    const value = fieldValues[f.ID] ?? "";
    const onChange = (v: string) => setFieldValues((prev) => ({ ...prev, [f.ID]: v }));
    if (f.FieldType === "Date") {
      return <Input type="date" value={value} onChange={(_, d) => onChange(d.value)} />;
    }
    if (f.FieldType === "Number") {
      return <Input type="number" value={value} onChange={(_, d) => onChange(d.value)} />;
    }
    return <Input value={value} onChange={(_, d) => onChange(d.value)} />;
  };

  return (
    <>
      <Drawer
        type="overlay"
        separator
        open={open}
        position="end"
        style={{ width: "min(680px, 94vw)", background: "#ffffff" }}
        onOpenChange={(_, data) => onOpenChange(data.open)}
      >
        <DrawerHeader style={{ borderBottom: "1px solid #e2e8f0", padding: "16px 24px" }}>
          <DrawerHeaderTitle
            action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onOpenChange(false)} />}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)",
                  color: "#D97706",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(217, 119, 6, 0.12)",
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                <BoxToolboxRegular />
              </div>
              <div>
                <Text weight="semibold" style={{ color: "#0f172a", fontSize: 17, display: "block", lineHeight: "22px" }}>
                  {isEdit ? "Edit Non-IT Asset" : "Add Non-IT Asset"}
                </Text>
                <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: 2, fontWeight: 400 }}>
                  Configure physical facilities, furniture, fixtures, and location details
                </div>
              </div>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: "4px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", alignItems: "start" }}>
              <Field label="Asset Tag" hint={isEdit ? undefined : "Assigned automatically when you save"}>
                <Input disabled value={isEdit && asset ? asset.AssetTag : nextTagPreview} />
              </Field>
              {!isEdit && (
                <Field label="Quantity" hint="Purchased more than one of the same asset? Create them all at once.">
                  <Input
                    type="number"
                    min={1}
                    value={String(quantity)}
                    onChange={(_, d) => {
                      const parsed = parseInt(d.value, 10);
                      handleQuantityChange(Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
                    }}
                  />
                </Field>
              )}
              <Field label="Category" required>
                <Dropdown
                  mountNode={mountNode}
                  value={categories.find((c) => c.ID === form.AssetCategoryID)?.CategoryName ?? ""}
                  selectedOptions={form.AssetCategoryID ? [form.AssetCategoryID] : []}
                  onOptionSelect={(_, d) => handleChange("AssetCategoryID", d.optionValue ?? "")}
                >
                  {categories.length === 0 ? (
                    <Option key="none" value="" disabled>
                      No Non-IT categories configured yet
                    </Option>
                  ) : (
                    categories.map((c) => (
                      <Option key={c.ID} value={c.ID} text={c.CategoryName}>
                        {c.CategoryName}
                      </Option>
                    ))
                  )}
                </Dropdown>
              </Field>

              <Field
                label="Location"
                hint={
                  quantity > 1
                    ? "Not available when creating more than one asset — assign a location individually after creation."
                    : availableLocations.length === 0
                    ? "No locations with available floors"
                    : undefined
                }
              >
                <Dropdown
                  mountNode={mountNode}
                  placeholder="Select location"
                  disabled={quantity > 1}
                  value={locations.find((l) => l.Id === form.Location)?.Name ?? ""}
                  selectedOptions={form.Location ? [form.Location] : []}
                  onOptionSelect={(_, d) => handleLocationChange(d.optionValue ?? null)}
                >
                  {availableLocations.length === 0 ? (
                    <Option key="none" value="" disabled>
                      No locations with available floors
                    </Option>
                  ) : (
                    availableLocations.map((l) => (
                      <Option key={l.Id} value={l.Id} text={l.Name}>
                        {l.Name}
                      </Option>
                    ))
                  )}
                </Dropdown>
              </Field>
              <Field
                label="Floor"
                hint={
                  quantity > 1
                    ? "Not available when creating more than one asset."
                    : form.Location && floorOptions.length === 0
                    ? "No floors available at this location"
                    : undefined
                }
              >
                <Dropdown
                  mountNode={mountNode}
                  placeholder={form.Location ? "Select floor" : "Select a location first"}
                  disabled={quantity > 1 || !form.Location}
                  value={form.Floor != null ? `Floor ${form.Floor}` : ""}
                  selectedOptions={form.Floor != null ? [String(form.Floor)] : []}
                  onOptionSelect={(_, d) => handleChange("Floor", d.optionValue ? Number(d.optionValue) : null)}
                >
                  {floorOptions.map((f) => (
                    <Option key={f} value={String(f)} text={`Floor ${f}`}>
                      {`Floor ${f}`}
                    </Option>
                  ))}
                </Dropdown>
              </Field>

              <Field label="Vendor">
                <Dropdown
                  mountNode={mountNode}
                  value={vendors.find((v) => v.ID === form.VendorID)?.VendorName ?? ""}
                  selectedOptions={form.VendorID ? [form.VendorID] : []}
                  onOptionSelect={(_, d) => handleChange("VendorID", d.optionValue ?? null)}
                >
                  {vendors.map((v) => (
                    <Option key={v.ID} value={v.ID} text={v.VendorName ?? ""}>
                      {v.VendorName ?? ""}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Status" required>
                <Dropdown
                  mountNode={mountNode}
                  value={form.Status}
                  selectedOptions={[form.Status]}
                  onOptionSelect={(_, d) => handleChange("Status", (d.optionValue as AssetStatus) ?? "In Stock")}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <Option key={s} value={s} text={s}>
                      {s}
                    </Option>
                  ))}
                </Dropdown>
              </Field>

              <Field label="AMC Expiry Date">
                <Input
                  type="date"
                  value={form.AMCExpiryDate ? form.AMCExpiryDate.substring(0, 10) : ""}
                  onChange={(_, d) => handleChange("AMCExpiryDate", d.value || null)}
                />
              </Field>
              <Field label="Value">
                <Input
                  type="number"
                  value={form.Value != null ? String(form.Value) : ""}
                  onChange={(_, d) => handleChange("Value", d.value === "" ? null : Number(d.value))}
                />
              </Field>
            </div>

            {fields.length > 0 && (
              <>
                <Divider />
                <div>
                  <Text weight="semibold" style={{ display: "block", marginBottom: "10px" }}>
                    Category Fields
                  </Text>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", alignItems: "start" }}>
                    {fields.map((f) => (
                      <Field key={f.ID} label={f.FieldName}>
                        {renderFieldInput(f)}
                      </Field>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Divider />

            <AssetFileUploadSection
              title="Attachments"
              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
              existingFiles={asset?.Attachments ?? []}
              pendingFiles={pendingAttachments}
              onFilesSelected={(files) => setPendingAttachments((prev) => [...prev, ...files])}
              onRemovePending={(index) => setPendingAttachments((prev) => prev.filter((_, i) => i !== index))}
              onDeleteExisting={async (relativePath) => {
                if (!asset) return;
                const updated = await deleteNonITAssetAttachment(asset.ID, relativePath);
                onAssetChanged({ ...asset, Attachments: updated });
              }}
            />

            {error && <Text style={{ color: "var(--colorPaletteRedForeground1)", fontSize: "13px" }}>{error}</Text>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
              <Button appearance="secondary" onClick={() => onOpenChange(false)} disabled={saving} style={{ borderRadius: "9999px", padding: "8px 22px" }}>
                {isEdit ? "Close" : "Cancel"}
              </Button>
              <Button
                appearance="primary"
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)",
                  borderRadius: "9999px",
                  padding: "8px 28px",
                  fontWeight: 600,
                  boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
                }}
              >
                {saving ? <Spinner size="tiny" /> : isEdit ? "Save Changes" : quantity > 1 ? `Add ${quantity} Assets` : "Add Asset"}
              </Button>
            </div>
          </div>
        </DrawerBody>
      </Drawer>
      {portal}
    </>
  );
};

export default NonITAssetFormDialog;
