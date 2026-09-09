import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Input,
  Dropdown,
  Option,
  Spinner,
  Text,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  BoxToolboxRegular,
  ArrowUploadRegular,
  DocumentRegular,
  DeleteRegular,
  ImageRegular,
} from "@fluentui/react-icons";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import {
  AssetInventoryFormData,
  AssetInventoryRecord,
  AssetBrandRecord,
  AssetVendorRecord,
  AssetCategoryRecord,
  AppLocationOption,
  AssetStatus,
  createAsset,
  updateAsset,
  getAssetBrands,
  getAssetVendors,
  getAssetCategories,
  getAppLocations,
  getNextAssetTagPreview,
  uploadAssetPhotos,
  uploadAssetDocuments,
} from "../Services/AssetInventoryService";

const DEFAULT_SITES = [
  "Coimbatore HQ",
  "Chennai",
  "Bangalore",
  "Hyderabad",
  "Mumbai",
  "Delhi NCR",
];

const DEFAULT_LOCATIONS = [
  "Floor 1 - IT Bay",
  "Floor 2 - Engineering",
  "Floor 3 - Executive",
  "Server Room",
  "IT Staging Room",
  "Main Office",
  "Storage Room B",
];

const DEFAULT_DEPARTMENTS = [
  "Engineering",
  "IT Infrastructure",
  "Product",
  "Sales",
  "Human Resources",
  "Finance",
  "Design",
  "Customer Success",
];

const DEFAULT_CATEGORIES = [
  "Laptop",
  "Desktop",
  "Monitor",
  "Keyboard",
  "Accessories",
  "Mobile Phone",
  "Headphones",
  "Printer",
  "Server",
  "Network Device",
  "Other",
];

const DEFAULT_BRANDS = [
  "Apple",
  "Dell",
  "Lenovo",
  "HP",
  "Logitech",
  "Acer",
  "Canon",
  "Samsung",
  "Asus",
  "Cisco",
  "Bose",
];

const emptyForm: AssetInventoryFormData = {
  AssetName: "",
  Description: "",
  PurchasedDate: null,
  Brand: "Dell",
  Cost: null,
  Model: "",
  SerialNo: "",
  Location: "Floor 1 - IT Bay",
  Category: "Laptop",
  Site: "Coimbatore HQ",
  ExpireDate: null,
  VendorID: null,
  Status: "In Stock",
  Department: "Engineering",
};

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: AssetInventoryRecord | null;
  currentUserId: string;
  onSaved: () => void;
  onAssetChanged: (asset: AssetInventoryRecord) => void;
}

const AssetFormDialog: React.FC<AssetFormDialogProps> = ({
  open,
  onOpenChange,
  asset,
  currentUserId,
  onSaved,
  onAssetChanged,
}) => {
  const [form, setForm] = useState<AssetInventoryFormData>(emptyForm);
  const [brands, setBrands] = useState<AssetBrandRecord[]>([]);
  const [vendors, setVendors] = useState<AssetVendorRecord[]>([]);
  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [locations, setLocations] = useState<AppLocationOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<File[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<File[]>([]);
  const [nextTagPreview, setNextTagPreview] = useState<string>("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const { mountNode, portal: mountNodePortal } = useThemedMountNode();
  const isEdit = Boolean(asset);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      getAssetBrands().catch(() => []),
      getAssetVendors().catch(() => []),
      getAssetCategories("IT").catch(() => []),
      getAppLocations().catch(() => []),
      getNextAssetTagPreview().catch(() => "AST00001"),
    ]).then(([b, v, c, l, nextTag]) => {
      setBrands(b);
      setVendors(v);
      setCategories(c);
      setLocations(l);
      setNextTagPreview(nextTag || "AST00001");
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (asset) {
      setForm({
        AssetName: asset.AssetName || "",
        Description: asset.Description || asset.AssetName || "",
        PurchasedDate: asset.PurchasedDate || null,
        Brand: asset.Brand || null,
        Cost: asset.Cost ?? null,
        Model: asset.Model || "",
        SerialNo: asset.SerialNo || "",
        Location: asset.Location || "Floor 1 - IT Bay",
        Category: asset.Category || "Laptop",
        Site: asset.Site || "Coimbatore HQ",
        ExpireDate: asset.ExpireDate || null,
        VendorID: asset.VendorID || null,
        Status: asset.Status || "In Stock",
        Department: asset.AssignedToDepartment || "Engineering",
      });
    } else {
      setForm({
        ...emptyForm,
        AssetName: "",
        Description: "",
      });
    }
    setPendingPhotos([]);
    setPendingDocuments([]);
    setError(null);
  }, [open, asset]);

  const allCategoryOptions = useMemo(() => {
    const list = new Set<string>(DEFAULT_CATEGORIES);
    categories.forEach((c) => {
      if (c.CategoryName) list.add(c.CategoryName);
    });
    if (form.Category) list.add(form.Category);
    return Array.from(list);
  }, [categories, form.Category]);

  const allBrandOptions = useMemo(() => {
    const list = new Set<string>(DEFAULT_BRANDS);
    brands.forEach((b) => {
      if (b.BrandName) list.add(b.BrandName);
    });
    if (form.Brand) list.add(form.Brand);
    return Array.from(list);
  }, [brands, form.Brand]);

  const handleChange = <K extends keyof AssetInventoryFormData>(
    field: K,
    value: AssetInventoryFormData[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const desc = form.Description?.trim() || form.AssetName?.trim();
    if (!desc) {
      setError("Asset Description / Name is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload: AssetInventoryFormData = {
      ...form,
      AssetName: desc,
      Description: desc,
      Category: form.Category || "Laptop",
    };

    try {
      const savedAsset =
        isEdit && asset
          ? await updateAsset(asset.ID, payload, currentUserId)
          : await createAsset(payload, currentUserId);

      try {
        if (pendingPhotos.length > 0) {
          await uploadAssetPhotos(savedAsset.ID, pendingPhotos);
        }
        if (pendingDocuments.length > 0) {
          await uploadAssetDocuments(savedAsset.ID, pendingDocuments);
        }
      } catch (uploadErr) {
        console.warn("Attachment upload warning:", uploadErr);
      }

      onSaved();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.message || "Failed to save asset.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const dialogContent = (
    <div
      id="asset-form-dialog-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        zIndex: 100000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 16px",
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        id="asset-form-dialog-card"
        style={{
          width: "min(740px, 95vw)",
          maxHeight: "calc(100vh - 80px)",
          background: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 60px -12px rgba(15, 23, 42, 0.45)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #EBF3FE 0%, #DBEAFE 100%)",
                color: "#007ED5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 6px rgba(0, 126, 213, 0.12)",
              }}
            >
              <BoxToolboxRegular style={{ fontSize: 22 }} />
            </div>
            <div>
              <Text
                weight="semibold"
                style={{ color: "#0f172a", fontSize: 17, display: "block", lineHeight: "22px" }}
              >
                {isEdit ? "Edit IT Asset" : "Add IT Asset"}
              </Text>
              <div style={{ fontSize: "12.5px", color: "#64748b", marginTop: 2 }}>
                Configure hardware specifications, procurement details, and department assignment
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close dialog"
            onClick={() => onOpenChange(false)}
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              cursor: "pointer",
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#fee2e2";
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.borderColor = "#fca5a5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#f8fafc";
              e.currentTarget.style.color = "#64748b";
              e.currentTarget.style.borderColor = "#e2e8f0";
            }}
          >
            <Dismiss24Regular style={{ fontSize: 16 }} />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "22px 28px",
            background: "#ffffff",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          {/* Section 1: Asset Hardware Details */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Text weight="bold" style={{ color: "#0f172a", fontSize: 14 }}>
                Asset Details
              </Text>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#007ED5",
                  background: "#EBF3FE",
                  padding: "2px 8px",
                  borderRadius: 9999,
                }}
              >
                Hardware Info
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Asset Description / Name * */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                  Description / Asset Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <Input
                  id="input-asset-desc"
                  style={{ width: "100%", borderRadius: 6 }}
                  value={form.Description || form.AssetName}
                  onChange={(_, d) => {
                    handleChange("Description", d.value);
                    handleChange("AssetName", d.value);
                  }}
                  placeholder="e.g. Dell Latitude 5440 14'' (Intel i7, 16GB RAM, 512GB SSD)"
                />
              </div>

              {/* Tag ID & Category Dropdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Asset Tag ID <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <Input
                    style={{ width: "100%", borderRadius: 6, background: "#f8fafc" }}
                    disabled
                    value={isEdit && asset ? asset.AssetTagID : nextTagPreview || "AST00001"}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Category <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <Dropdown
                    id="dropdown-asset-category"
                    style={{ width: "100%", borderRadius: 6 }}
                    value={form.Category || "Laptop"}
                    selectedOptions={form.Category ? [form.Category] : ["Laptop"]}
                    onOptionSelect={(_, d) => handleChange("Category", d.optionValue ?? "Laptop")}
                    mountNode={mountNode}
                    placeholder="Select Category"
                  >
                    {allCategoryOptions.map((cat) => (
                      <Option key={cat} value={cat} text={cat}>
                        {cat}
                      </Option>
                    ))}
                  </Dropdown>
                </div>
              </div>

              {/* Brand & Model */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Brand
                  </label>
                  <Input
                    id="input-asset-brand"
                    list="brand-suggestions-list"
                    style={{ width: "100%", borderRadius: 6 }}
                    value={form.Brand || ""}
                    onChange={(_, d) => handleChange("Brand", d.value)}
                    placeholder="e.g. Dell, Apple, Lenovo, HP"
                  />
                  <datalist id="brand-suggestions-list">
                    {allBrandOptions.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Model
                  </label>
                  <Input
                    id="input-asset-model"
                    style={{ width: "100%", borderRadius: 6 }}
                    value={form.Model || ""}
                    onChange={(_, d) => handleChange("Model", d.value)}
                    placeholder="e.g. Latitude 5440 / MacBook Pro 16"
                  />
                </div>
              </div>

              {/* Serial No & Cost */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Serial No
                  </label>
                  <Input
                    id="input-asset-serial"
                    style={{ width: "100%", borderRadius: 6 }}
                    value={form.SerialNo || ""}
                    onChange={(_, d) => handleChange("SerialNo", d.value)}
                    placeholder="e.g. SN-9948201"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Cost (₹)
                  </label>
                  <Input
                    id="input-asset-cost"
                    type="number"
                    style={{ width: "100%", borderRadius: 6 }}
                    value={form.Cost != null ? String(form.Cost) : ""}
                    onChange={(_, d) => handleChange("Cost", d.value === "" ? null : Number(d.value))}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Purchased From & Purchase Date */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Purchased From (Vendor)
                  </label>
                  <Dropdown
                    id="dropdown-asset-vendor"
                    style={{ width: "100%", borderRadius: 6 }}
                    value={vendors.find((v) => v.ID === form.VendorID)?.VendorName || (form.VendorID || "")}
                    selectedOptions={form.VendorID ? [form.VendorID] : []}
                    onOptionSelect={(_, d) => handleChange("VendorID", d.optionValue ?? null)}
                    mountNode={mountNode}
                    placeholder="Select Vendor"
                  >
                    {vendors.map((v) => (
                      <Option key={v.ID} value={v.ID} text={v.VendorName ?? ""}>
                        {v.VendorName ?? ""}
                      </Option>
                    ))}
                  </Dropdown>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                    Purchase Date
                  </label>
                  <Input
                    type="date"
                    style={{ width: "100%", borderRadius: 6 }}
                    value={form.PurchasedDate ? form.PurchasedDate.slice(0, 10) : ""}
                    onChange={(_, d) => handleChange("PurchasedDate", d.value || null)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "#f1f5f9" }} />

          {/* Section 2: Deployment, Site, Location & Department */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Text weight="bold" style={{ color: "#0f172a", fontSize: 14 }}>
                Site, Location & Department
              </Text>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#059669",
                  background: "#ECFDF5",
                  padding: "2px 8px",
                  borderRadius: 9999,
                }}
              >
                Deployment
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Site */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                  Site / Branch
                </label>
                <Dropdown
                  style={{ width: "100%", borderRadius: 6 }}
                  value={form.Site || "Coimbatore HQ"}
                  selectedOptions={form.Site ? [form.Site] : ["Coimbatore HQ"]}
                  onOptionSelect={(_, d) => handleChange("Site", d.optionValue ?? "Coimbatore HQ")}
                  mountNode={mountNode}
                  placeholder="Select Site"
                >
                  {DEFAULT_SITES.map((site) => (
                    <Option key={site} value={site} text={site}>
                      {site}
                    </Option>
                  ))}
                </Dropdown>
              </div>

              {/* Location */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                  Specific Location
                </label>
                <Dropdown
                  style={{ width: "100%", borderRadius: 6 }}
                  value={form.Location || "Floor 1 - IT Bay"}
                  selectedOptions={form.Location ? [form.Location] : ["Floor 1 - IT Bay"]}
                  onOptionSelect={(_, d) => handleChange("Location", d.optionValue ?? null)}
                  mountNode={mountNode}
                  placeholder="Select Location"
                >
                  {DEFAULT_LOCATIONS.map((loc) => (
                    <Option key={loc} value={loc} text={loc}>
                      {loc}
                    </Option>
                  ))}
                </Dropdown>
              </div>

              {/* Department */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                  Department
                </label>
                <Dropdown
                  style={{ width: "100%", borderRadius: 6 }}
                  value={form.Department || "Engineering"}
                  selectedOptions={form.Department ? [form.Department] : ["Engineering"]}
                  onOptionSelect={(_, d) => handleChange("Department", d.optionValue ?? "Engineering")}
                  mountNode={mountNode}
                  placeholder="Select Department"
                >
                  {DEFAULT_DEPARTMENTS.map((dept) => (
                    <Option key={dept} value={dept} text={dept}>
                      {dept}
                    </Option>
                  ))}
                </Dropdown>
              </div>

              {/* Status */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                  Status
                </label>
                <Dropdown
                  style={{ width: "100%", borderRadius: 6 }}
                  value={form.Status || "In Stock"}
                  selectedOptions={form.Status ? [form.Status] : ["In Stock"]}
                  onOptionSelect={(_, d) => handleChange("Status", (d.optionValue as AssetStatus) ?? "In Stock")}
                  mountNode={mountNode}
                  placeholder="Select Status"
                >
                  {["In Stock", "Assigned", "Under Maintenance", "Reserved", "End of Use"].map((st) => (
                    <Option key={st} value={st} text={st}>
                      {st}
                    </Option>
                  ))}
                </Dropdown>
              </div>
            </div>
          </div>

          <div style={{ height: 1, background: "#f1f5f9" }} />

          {/* Section 3: Warranty & AMC Details */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Text weight="bold" style={{ color: "#0f172a", fontSize: 14 }}>
                Warranty & Support
              </Text>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#D97706",
                  background: "#FFFBEB",
                  padding: "2px 8px",
                  borderRadius: 9999,
                }}
              >
                Coverage
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                  Warranty / AMC Expiry Date
                </label>
                <Input
                  type="date"
                  style={{ width: "100%", borderRadius: 6 }}
                  value={form.ExpireDate ? form.ExpireDate.slice(0, 10) : ""}
                  onChange={(_, d) => handleChange("ExpireDate", d.value || null)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 5 }}>
                  Support Provider / Vendor
                </label>
                <Dropdown
                  style={{ width: "100%", borderRadius: 6 }}
                  value={vendors.find((v) => v.ID === form.VendorID)?.VendorName || (form.VendorID || "")}
                  selectedOptions={form.VendorID ? [form.VendorID] : []}
                  onOptionSelect={(_, d) => handleChange("VendorID", d.optionValue ?? null)}
                  mountNode={mountNode}
                  placeholder="Select Vendor"
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

          <div style={{ height: 1, background: "#f1f5f9" }} />

          {/* Section 4: Asset Photos */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Asset Photos
            </label>
            <input
              type="file"
              ref={photoInputRef}
              accept="image/png,image/jpeg,image/gif,image/webp"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files) {
                  setPendingPhotos((prev) => [...prev, ...Array.from(e.target.files || [])]);
                }
              }}
              multiple
            />
            <div
              onClick={() => photoInputRef.current?.click()}
              style={{
                border: "1.5px dashed #cbd5e1",
                borderRadius: 10,
                padding: "20px 16px",
                textAlign: "center",
                background: "#f8fafc",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#007ED5";
                e.currentTarget.style.background = "#F0F7FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.background = "#f8fafc";
              }}
            >
              <ImageRegular style={{ fontSize: 28, color: "#007ED5" }} />
              <div style={{ fontSize: 13, color: "#334155" }}>
                <span style={{ fontWeight: 600, color: "#007ED5" }}>Click to upload photos</span> or drag & drop
              </div>
              <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                Supports PNG, JPG, GIF up to 5MB
              </div>
            </div>

            {pendingPhotos.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {pendingPhotos.map((f, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#f1f5f9",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#334155",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <ImageRegular style={{ fontSize: 14, color: "#64748b" }} />
                    <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingPhotos((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
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

          {/* Section 5: Documents (Invoices, Warranty Cards, Handover receipts) */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Invoices & Documentation
            </label>
            <input
              type="file"
              ref={docInputRef}
              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files) {
                  setPendingDocuments((prev) => [...prev, ...Array.from(e.target.files || [])]);
                }
              }}
              multiple
            />
            <div
              onClick={() => docInputRef.current?.click()}
              style={{
                border: "1.5px dashed #cbd5e1",
                borderRadius: 10,
                padding: "20px 16px",
                textAlign: "center",
                background: "#f8fafc",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#007ED5";
                e.currentTarget.style.background = "#F0F7FF";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#cbd5e1";
                e.currentTarget.style.background = "#f8fafc";
              }}
            >
              <DocumentRegular style={{ fontSize: 28, color: "#007ED5" }} />
              <div style={{ fontSize: 13, color: "#334155" }}>
                <span style={{ fontWeight: 600, color: "#007ED5" }}>Click to upload documents</span> or drag & drop
              </div>
              <div style={{ fontSize: 11.5, color: "#94a3b8" }}>
                Supports PDF, DOCX, XLSX, images up to 10MB
              </div>
            </div>

            {pendingDocuments.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                {pendingDocuments.map((f, i) => (
                  <span
                    key={i}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "#f1f5f9",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      color: "#334155",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <DocumentRegular style={{ fontSize: 14, color: "#64748b" }} />
                    <span style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.name}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDocuments((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
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
                color: "#dc2626",
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
        </div>

        {/* Modal Footer with Cancel & Submit Buttons */}
        <div
          style={{
            padding: "16px 28px",
            background: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            style={{
              background: "#ffffff",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "9999px",
              padding: "9px 24px",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#ffffff")}
          >
            Cancel
          </button>

          <button
            type="button"
            id="btn-submit-asset"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              padding: "9px 30px",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 3px 12px rgba(0, 126, 213, 0.35)",
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => !saving && (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => !saving && (e.currentTarget.style.transform = "translateY(0)")}
          >
            {saving ? <Spinner size="tiny" /> : isEdit ? "Save Changes" : "Create Asset"}
          </button>
        </div>
      </div>
      {mountNodePortal}
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(dialogContent, document.body)
    : dialogContent;
};

export default AssetFormDialog;
