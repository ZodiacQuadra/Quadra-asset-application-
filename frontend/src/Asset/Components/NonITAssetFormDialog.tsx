import { useEffect, useMemo, useRef, useState } from "react";
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
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  DialogContent,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  BoxToolboxRegular,
  CalendarRegular,
  ArrowUploadRegular,
  DocumentRegular,
  DeleteRegular,
} from "@fluentui/react-icons";
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

  // Contextual Add New Category
  const [customNonITCategories, setCustomNonITCategories] = useState<AssetCategoryRecord[]>([]);
  const [addNewModal, setAddNewModal] = useState<{
    open: boolean;
    field: "Category";
    title: string;
    value: string;
  } | null>(null);

  const allCategoryOptions = useMemo(() => {
    return [...categories, ...customNonITCategories];
  }, [categories, customNonITCategories]);

  const handleCreateCategory = () => {
    if (!addNewModal || !addNewModal.value.trim()) return;
    const catName = addNewModal.value.trim();
    const newCatId = `custom-nonit-${Date.now()}`;
    const newCatRecord: AssetCategoryRecord = {
      ID: newCatId,
      CategoryName: catName,
      CategoryType: "Non-IT",
      Description: catName,
      AssetType: "Non-IT",
      CreatedAt: new Date().toISOString(),
      CreatedBy: "admin",
      ModifiedAt: null,
      ModifiedBy: null,
    };
    setCustomNonITCategories((prev) => [...prev, newCatRecord]);
    handleChange("AssetCategoryID", newCatId);
    setAddNewModal(null);
  };
  const [error, setError] = useState<string | null>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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
    const inputStyle = { width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1", height: 38 };
    if (f.FieldType === "Date") {
      return <Input type="date" style={inputStyle} value={value} onChange={(_, d) => onChange(d.value)} />;
    }
    if (f.FieldType === "Number") {
      return <Input type="number" style={inputStyle} value={value} onChange={(_, d) => onChange(d.value)} />;
    }
    return <Input style={inputStyle} value={value} onChange={(_, d) => onChange(d.value)} />;
  };

  return (
    <>
      <Drawer
        type="overlay"
        separator
        open={open}
        position="end"
        style={{ width: "min(860px, 94vw)", background: "#ffffff" }}
        onOpenChange={(_, data) => onOpenChange(data.open)}
      >
        <DrawerHeader style={{ borderBottom: "1px solid #E2E8F0", padding: "16px 24px" }}>
          <DrawerHeaderTitle
            action={<Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => onOpenChange(false)} />}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "#EFF6FF",
                  color: "#007ED5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                <CalendarRegular />
              </div>
              <div>
                <Text weight="bold" style={{ color: "#0F172A", fontSize: "15px" }}>
                  {isEdit ? "Edit Non-IT Asset" : "Add Non-IT Asset"}
                </Text>
              </div>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        {/* Drawer Body - Scrollable matching design language */}
        <DrawerBody
          style={{
            flex: 1,
            padding: "24px",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            gap: "28px",
          }}
        >
          {/* Section 1: Asset Details */}
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "16px" }}>
              Asset Details
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Asset Tag & Quantity */}
              <div style={{ display: "grid", gridTemplateColumns: isEdit ? "1fr" : "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                    Asset Tag ID <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <Input
                    style={{ width: "100%", borderRadius: 8, background: "#FAFAFA", border: "1px solid #CBD5E1", color: "#475569", height: 38 }}
                    disabled
                    value={isEdit && asset ? asset.AssetTag : nextTagPreview || "QNonIT-000001"}
                  />
                </div>

                {!isEdit && (
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                      Quantity
                    </label>
                    <Input
                      type="number"
                      min={1}
                      style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1", height: 38 }}
                      value={String(quantity)}
                      onChange={(_, d) => {
                        const parsed = parseInt(d.value, 10);
                        handleQuantityChange(Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Category & Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 500, color: "#334155" }}>
                      Category <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAddNewModal({ open: true, field: "Category", title: "Add New Non-IT Category", value: "" })}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#007ED5",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      + Add New
                    </button>
                  </div>
                  <Dropdown
                    mountNode={mountNode}
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1" }}
                    placeholder="Select Category"
                    value={allCategoryOptions.find((c) => c.ID === form.AssetCategoryID)?.CategoryName ?? ""}
                    selectedOptions={form.AssetCategoryID ? [form.AssetCategoryID] : []}
                    onOptionSelect={(_, d) => {
                      if (d.optionValue === "__ADD_NEW__") {
                        setAddNewModal({ open: true, field: "Category", title: "Add New Non-IT Category", value: "" });
                        return;
                      }
                      handleChange("AssetCategoryID", d.optionValue ?? "");
                    }}
                  >
                    <Option value="__ADD_NEW__" text="+ Add New Category...">
                      <span style={{ color: "#007ED5", fontWeight: 600 }}>+ Add New Category...</span>
                    </Option>
                    {allCategoryOptions.length === 0 ? (
                      <Option key="none" value="" disabled>
                        No Non-IT categories configured yet
                      </Option>
                    ) : (
                      allCategoryOptions.map((c) => (
                        <Option key={c.ID} value={c.ID} text={c.CategoryName}>
                          {c.CategoryName}
                        </Option>
                      ))
                    )}
                  </Dropdown>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                    Status <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <Dropdown
                    mountNode={mountNode}
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1" }}
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
                </div>
              </div>

              {/* Value / Cost & AMC Expiry Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                    Cost / Value (₹)
                  </label>
                  <Input
                    id="input-nonit-cost"
                    type="number"
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1", height: 38 }}
                    value={form.Value != null ? String(form.Value) : ""}
                    onChange={(_, d) => handleChange("Value", d.value === "" ? null : Number(d.value))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                    AMC Expiry Date
                  </label>
                  <Input
                    type="date"
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1", height: 38 }}
                    value={form.AMCExpiryDate ? form.AMCExpiryDate.substring(0, 10) : ""}
                    onChange={(_, d) => handleChange("AMCExpiryDate", d.value || null)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Location and Vendor Details */}
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "16px" }}>
              Location and Vendor Details
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                    Location
                  </label>
                  <Dropdown
                    mountNode={mountNode}
                    placeholder="Select Location"
                    disabled={quantity > 1}
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1" }}
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
                  {quantity > 1 && (
                    <div style={{ fontSize: "11px", color: "#94A3B8", marginTop: "4px" }}>
                      Assign location individually after batch creation
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                    Floor
                  </label>
                  <Dropdown
                    mountNode={mountNode}
                    placeholder={form.Location ? "Select Floor" : "Select location first"}
                    disabled={quantity > 1 || !form.Location}
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1" }}
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
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                  Select Vendor
                </label>
                <Dropdown
                  mountNode={mountNode}
                  placeholder="Select Vendor"
                  style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1" }}
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
              </div>
            </div>
          </div>

          {/* Section 3: Custom Category Fields (if any) */}
          {fields.length > 0 && (
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "16px" }}>
                Custom Specifications
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {fields.map((f) => (
                  <div key={f.ID}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                      {f.FieldName}
                    </label>
                    {renderFieldInput(f)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Attachments */}
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "12px" }}>
              Attachments & Documentation
            </div>
            <input
              type="file"
              ref={docInputRef}
              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files) {
                  setPendingAttachments((prev) => [...prev, ...Array.from(e.target.files || [])]);
                }
              }}
              multiple
            />
            <div
              onClick={() => docInputRef.current?.click()}
              style={{
                border: "1px dashed #CBD5E1",
                borderRadius: 8,
                padding: "24px 16px",
                textAlign: "center",
                background: "#FAFAFA",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#007ED5")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#CBD5E1")}
            >
              <ArrowUploadRegular style={{ fontSize: 26, color: "#94A3B8" }} />
              <div style={{ fontSize: 13, color: "#334155", marginTop: 4 }}>
                <span style={{ fontWeight: 700, color: "#0F172A" }}>Click to upload</span> or drag and drop
              </div>
              <div style={{ fontSize: 11, color: "#94A3B8" }}>
                Only (JPG, GIF, PNG, PDF, DOCX) are allowed
              </div>
            </div>

            {/* List of existing & pending attachments */}
            {((asset?.Attachments && asset.Attachments.length > 0) || pendingAttachments.length > 0) && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {asset?.Attachments?.map((att, i) => (
                  <span
                    key={`existing-${i}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#F1F5F9",
                      padding: "5px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#334155",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <DocumentRegular style={{ fontSize: 14, color: "#007ED5" }} />
                    <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {att.FileName || att.RelativePath || `Attachment ${i + 1}`}
                    </span>
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const updated = await deleteNonITAssetAttachment(asset.ID, att.RelativePath);
                        onAssetChanged({ ...asset, Attachments: updated });
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#EF4444",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <DeleteRegular style={{ fontSize: 13 }} />
                    </button>
                  </span>
                ))}
                {pendingAttachments.map((f, i) => (
                  <span
                    key={`pending-${i}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#FFFFFF",
                      padding: "5px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "#334155",
                      border: "1px solid #E2E8F0",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    <DocumentRegular style={{ fontSize: 14, color: "#64748B" }} />
                    <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingAttachments((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#EF4444",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <DeleteRegular style={{ fontSize: 13 }} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                color: "#ef4444",
                fontSize: 13,
                background: "#fef2f2",
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #fee2e2",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>⚠️</span> {error}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              paddingTop: "16px",
              marginTop: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid #F1F5F9",
            }}
          >
            <button
              type="button"
              id="btn-cancel-non-it-asset"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              style={{
                background: "transparent",
                color: "#64748B",
                border: "none",
                borderRadius: "20px",
                padding: "8px 20px",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#0F172A";
                e.currentTarget.style.background = "#F1F5F9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#64748B";
                e.currentTarget.style.background = "transparent";
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-submit-non-it-asset"
              onClick={handleSave}
              disabled={saving}
              style={{
                background: "#007ED5",
                color: "#ffffff",
                border: "none",
                borderRadius: "20px",
                padding: "8px 30px",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 2px 6px rgba(0, 126, 213, 0.25)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s ease",
              }}
            >
              {saving ? <Spinner size="tiny" /> : isEdit ? "Save Changes" : quantity > 1 ? `Add ${quantity} Assets` : "Submit"}
            </button>
          </div>
        </DrawerBody>
      </Drawer>

      {/* Contextual Add New Category Modal */}
      {addNewModal && (
        <Dialog open={addNewModal.open} onOpenChange={(_, data) => !data.open && setAddNewModal(null)}>
          <DialogSurface style={{ maxWidth: "420px", borderRadius: "14px", padding: "20px" }}>
            <DialogBody>
              <DialogTitle style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", marginBottom: "12px" }}>
                {addNewModal.title}
              </DialogTitle>
              <DialogContent>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                  New Category Name
                </label>
                <Input
                  autoFocus
                  style={{ width: "100%", borderRadius: 8, height: 38, border: "1px solid #CBD5E1" }}
                  placeholder="Enter category name..."
                  value={addNewModal.value}
                  onChange={(_, d) => setAddNewModal((prev) => (prev ? { ...prev, value: d.value } : null))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateCategory();
                    }
                  }}
                />
              </DialogContent>
              <DialogActions style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                <Button appearance="secondary" onClick={() => setAddNewModal(null)} style={{ borderRadius: "8px" }}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  onClick={handleCreateCategory}
                  disabled={!addNewModal.value.trim()}
                  style={{ background: "#007ED5", borderRadius: "8px" }}
                >
                  Add & Select
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}

      {portal}
    </>
  );
};

export default NonITAssetFormDialog;
