import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Button,
  Input,
  Dropdown,
  Option,
  Spinner,
  Text,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Field,
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
  ArrowUploadRegular,
  DocumentRegular,
  DeleteRegular,
  ImageRegular,
  CalendarRegular,
  AddRegular,
  CheckmarkRegular,
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
import {
  CANONICAL_BRANCHES,
  CANONICAL_DEPARTMENTS,
  normalizeBranch,
  normalizeDepartment,
} from "../../Common/EnterpriseConstants";

const DEFAULT_SITES = [...CANONICAL_BRANCHES];

const DEFAULT_LOCATIONS = [
  "Floor 1 - IT Bay",
  "Floor 2 - Engineering",
  "Floor 3 - Executive",
  "Server Room",
  "IT Staging Room",
  "Main Office",
  "Storage Room B",
];

const DEFAULT_DEPARTMENTS = [...CANONICAL_DEPARTMENTS];

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
  Site: "Coimbatore",
  ExpireDate: null,
  VendorID: null,
  Status: "In Stock",
  Department: "Operations",
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

  const [purchasedFrom, setPurchasedFrom] = useState<string>("");

  // Contextual Add New Options
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customLocations, setCustomLocations] = useState<string[]>([]);
  const [customDepartments, setCustomDepartments] = useState<string[]>([]);
  const [customBrands, setCustomBrands] = useState<string[]>([]);
  const [customSites, setCustomSites] = useState<string[]>([]);
  const [customVendors, setCustomVendors] = useState<string[]>([]);

  const [createdAssetInfo, setCreatedAssetInfo] = useState<AssetInventoryRecord | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const [addNewModal, setAddNewModal] = useState<{
    open: boolean;
    field: "Category" | "Location" | "Department" | "Brand" | "Site" | "Vendor";
    title: string;
    value: string;
  } | null>(null);

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
        Site: normalizeBranch(asset.Site || asset.Branch || "Coimbatore"),
        ExpireDate: asset.ExpireDate || null,
        VendorID: asset.VendorID || null,
        Status: asset.Status || "In Stock",
        Department: normalizeDepartment(asset.AssignedToDepartment || "Operations"),
      });
      setPurchasedFrom(asset.VendorName || "");
    } else {
      setForm({
        ...emptyForm,
        AssetName: "",
        Description: "",
      });
      setPurchasedFrom("");
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
    customCategories.forEach((c) => list.add(c));
    if (form.Category) list.add(form.Category);
    return Array.from(list);
  }, [categories, customCategories, form.Category]);

  const allLocationOptions = useMemo(() => {
    const list = new Set<string>(DEFAULT_LOCATIONS);
    locations.forEach((l) => {
      if (l.LocationName || l.Name) list.add(l.LocationName || l.Name);
    });
    customLocations.forEach((l) => list.add(l));
    if (form.Location) list.add(form.Location);
    return Array.from(list);
  }, [locations, customLocations, form.Location]);

  const allDepartmentOptions = useMemo(() => {
    const list = new Set<string>(DEFAULT_DEPARTMENTS);
    customDepartments.forEach((d) => list.add(d));
    if (form.Department) list.add(form.Department);
    return Array.from(list);
  }, [customDepartments, form.Department]);

  const allBrandOptions = useMemo(() => {
    const list = new Set<string>(DEFAULT_BRANDS);
    brands.forEach((b) => {
      if (b.BrandName) list.add(b.BrandName);
    });
    customBrands.forEach((b) => list.add(b));
    if (form.Brand) list.add(form.Brand);
    return Array.from(list);
  }, [brands, customBrands, form.Brand]);

  const allSiteOptions = useMemo(() => {
    const list = new Set<string>(DEFAULT_SITES);
    customSites.forEach((s) => list.add(s));
    if (form.Site) list.add(form.Site);
    return Array.from(list);
  }, [customSites, form.Site]);

  const allVendorOptions = useMemo(() => {
    const list = new Set<string>();
    vendors.forEach((v) => {
      if (v.VendorName) list.add(v.VendorName);
    });
    customVendors.forEach((v) => list.add(v));
    if (purchasedFrom) list.add(purchasedFrom);
    return Array.from(list);
  }, [vendors, customVendors, purchasedFrom]);

  const handleCreateNewOption = () => {
    if (!addNewModal || !addNewModal.value.trim()) return;
    const val = addNewModal.value.trim();
    if (addNewModal.field === "Category") {
      setCustomCategories((prev) => (prev.includes(val) ? prev : [...prev, val]));
      handleChange("Category", val);
    } else if (addNewModal.field === "Location") {
      setCustomLocations((prev) => (prev.includes(val) ? prev : [...prev, val]));
      handleChange("Location", val);
    } else if (addNewModal.field === "Department") {
      setCustomDepartments((prev) => (prev.includes(val) ? prev : [...prev, val]));
      handleChange("Department", val);
    } else if (addNewModal.field === "Brand") {
      setCustomBrands((prev) => (prev.includes(val) ? prev : [...prev, val]));
      handleChange("Brand", val);
    } else if (addNewModal.field === "Site") {
      setCustomSites((prev) => (prev.includes(val) ? prev : [...prev, val]));
      handleChange("Site", val);
    } else if (addNewModal.field === "Vendor") {
      setCustomVendors((prev) => (prev.includes(val) ? prev : [...prev, val]));
      setPurchasedFrom(val);
      const matched = vendors.find((v) => v.VendorName?.toLowerCase() === val.toLowerCase());
      handleChange("VendorID", matched ? matched.VendorID : null);
    }
    setAddNewModal(null);
  };

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

      setCreatedAssetInfo(savedAsset);
      setShowSuccessDialog(true);
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Failed to save asset.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Drawer
        type="overlay"
        separator
        open={open}
        position="end"
        onOpenChange={(_, data) => onOpenChange(data.open)}
        style={{ width: "min(860px, 94vw)", background: "#ffffff" }}
      >
        <DrawerHeader style={{ borderBottom: "1px solid #E2E8F0", padding: "16px 24px" }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Close dialog"
                icon={<Dismiss24Regular />}
                onClick={() => onOpenChange(false)}
              />
            }
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
                  flexShrink: 0,
                }}
              >
                <CalendarRegular style={{ fontSize: 18 }} />
              </div>
              <div>
                <Text weight="bold" style={{ color: "#0F172A", fontSize: "15px" }}>
                  {isEdit ? "Edit Asset" : "Add an Asset"}
                </Text>
              </div>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        {/* Drawer Body - Scrollable matching screenshot exactly */}
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
              {/* Description * */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                  Description <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <Input
                  id="input-asset-desc"
                  style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1", height: 38 }}
                  value={form.Description || form.AssetName}
                  onChange={(_, d) => {
                    handleChange("Description", d.value);
                    handleChange("AssetName", d.value);
                  }}
                  placeholder=""
                />
              </div>

              {/* Asset Tag ID * & Purchased from */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                    Asset Tag ID <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <Input
                    style={{ width: "100%", borderRadius: 8, background: "#FAFAFA", border: "1px solid #CBD5E1", color: "#475569", height: 38 }}
                    disabled
                    value={isEdit && asset ? asset.AssetTagID : nextTagPreview || "AST00001"}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 500, color: "#334155" }}>
                      Purchased from / Vendor
                    </label>
                    <button
                      type="button"
                      onClick={() => setAddNewModal({ open: true, field: "Vendor", title: "Add New Vendor", value: "" })}
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
                    id="dropdown-asset-vendor"
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1" }}
                    value={purchasedFrom || ""}
                    selectedOptions={purchasedFrom ? [purchasedFrom] : []}
                    onOptionSelect={(_, d) => {
                      if (d.optionValue === "__ADD_NEW__") {
                        setAddNewModal({ open: true, field: "Vendor", title: "Add New Vendor", value: "" });
                        return;
                      }
                      setPurchasedFrom(d.optionValue || "");
                      const matched = vendors.find((v) => v.VendorName === d.optionValue);
                      handleChange("VendorID", matched ? matched.VendorID : null);
                    }}
                    mountNode={mountNode}
                    placeholder="Select or enter Vendor"
                  >
                    <Option value="__ADD_NEW__" text="+ Add New Vendor...">
                      <span style={{ color: "#007ED5", fontWeight: 600 }}>+ Add New Vendor...</span>
                    </Option>
                    {allVendorOptions.map((v) => (
                      <Option key={v} value={v} text={v}>
                        {v}
                      </Option>
                    ))}
                  </Dropdown>
                </div>
              </div>

              {/* Purchase Date & Brand */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                    Purchase Date
                  </label>
                  <Input
                    type="date"
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1", height: 38 }}
                    value={form.PurchasedDate ? form.PurchasedDate.slice(0, 10) : ""}
                    onChange={(_, d) => handleChange("PurchasedDate", d.value || null)}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 500, color: "#334155" }}>
                      Brand
                    </label>
                    <button
                      type="button"
                      onClick={() => setAddNewModal({ open: true, field: "Brand", title: "Add New Brand", value: "" })}
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
                    id="dropdown-asset-brand"
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1" }}
                    value={form.Brand || ""}
                    selectedOptions={form.Brand ? [form.Brand] : []}
                    onOptionSelect={(_, d) => {
                      if (d.optionValue === "__ADD_NEW__") {
                        setAddNewModal({ open: true, field: "Brand", title: "Add New Brand", value: "" });
                        return;
                      }
                      handleChange("Brand", d.optionValue ?? null);
                    }}
                    mountNode={mountNode}
                    placeholder="Select Brand"
                  >
                    <Option value="__ADD_NEW__" text="+ Add New Brand...">
                      <span style={{ color: "#007ED5", fontWeight: 600 }}>+ Add New Brand...</span>
                    </Option>
                    {allBrandOptions.map((b) => (
                      <Option key={b} value={b} text={b}>
                        {b}
                      </Option>
                    ))}
                  </Dropdown>
                </div>
              </div>

              {/* Cost & Model */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                    Cost
                  </label>
                  <Input
                    id="input-asset-cost"
                    type="number"
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1", height: 38 }}
                    value={form.Cost != null ? String(form.Cost) : ""}
                    onChange={(_, d) => handleChange("Cost", d.value === "" ? null : Number(d.value))}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                    Model
                  </label>
                  <Input
                    id="input-asset-model"
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1", height: 38 }}
                    value={form.Model || ""}
                    onChange={(_, d) => handleChange("Model", d.value)}
                    placeholder=""
                  />
                </div>
              </div>

              {/* Serial No */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                  Serial No
                </label>
                <Input
                  id="input-asset-serial"
                  style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1", height: 38 }}
                  value={form.SerialNo || ""}
                  onChange={(_, d) => handleChange("SerialNo", d.value)}
                  placeholder=""
                />
              </div>
            </div>
          </div>

          {/* Section 2: Site, Location, Category and Department */}
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "16px" }}>
              Site, Location, Category and Department
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              {/* Left Column: Site & Location */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 500, color: "#334155" }}>
                      Site
                    </label>
                    <button
                      type="button"
                      onClick={() => setAddNewModal({ open: true, field: "Site", title: "Add New Site", value: "" })}
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
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1" }}
                    value={form.Site || ""}
                    selectedOptions={form.Site ? [form.Site] : []}
                    onOptionSelect={(_, d) => {
                      if (d.optionValue === "__ADD_NEW__") {
                        setAddNewModal({ open: true, field: "Site", title: "Add New Site", value: "" });
                        return;
                      }
                      handleChange("Site", d.optionValue ?? "Coimbatore");
                    }}
                    mountNode={mountNode}
                    placeholder="Select Site"
                  >
                    <Option value="__ADD_NEW__" text="+ Add New Site...">
                      <span style={{ color: "#007ED5", fontWeight: 600 }}>+ Add New Site...</span>
                    </Option>
                    {allSiteOptions.map((site) => (
                      <Option key={site} value={site} text={site}>
                        {site}
                      </Option>
                    ))}
                  </Dropdown>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 500, color: "#334155" }}>
                      Location
                    </label>
                    <button
                      type="button"
                      onClick={() => setAddNewModal({ open: true, field: "Location", title: "Add New Location", value: "" })}
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
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1" }}
                    value={form.Location || ""}
                    selectedOptions={form.Location ? [form.Location] : []}
                    onOptionSelect={(_, d) => {
                      if (d.optionValue === "__ADD_NEW__") {
                        setAddNewModal({ open: true, field: "Location", title: "Add New Location", value: "" });
                        return;
                      }
                      handleChange("Location", d.optionValue ?? null);
                    }}
                    mountNode={mountNode}
                    placeholder="Select Location"
                  >
                    <Option value="__ADD_NEW__" text="+ Add New Location...">
                      <span style={{ color: "#007ED5", fontWeight: 600 }}>+ Add New Location...</span>
                    </Option>
                    {allLocationOptions.map((loc) => (
                      <Option key={loc} value={loc} text={loc}>
                        {loc}
                      </Option>
                    ))}
                  </Dropdown>
                </div>
              </div>

              {/* Right Column: Category & Department */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 500, color: "#334155" }}>
                      Category <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setAddNewModal({ open: true, field: "Category", title: "Add New Category", value: "" })}
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
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1" }}
                    value={form.Category || "Laptop"}
                    selectedOptions={form.Category ? [form.Category] : ["Laptop"]}
                    onOptionSelect={(_, d) => {
                      if (d.optionValue === "__ADD_NEW__") {
                        setAddNewModal({ open: true, field: "Category", title: "Add New Category", value: "" });
                        return;
                      }
                      handleChange("Category", d.optionValue ?? "Laptop");
                    }}
                    mountNode={mountNode}
                    placeholder="Select Category"
                  >
                    <Option value="__ADD_NEW__" text="+ Add New Category...">
                      <span style={{ color: "#007ED5", fontWeight: 600 }}>+ Add New Category...</span>
                    </Option>
                    {allCategoryOptions.map((cat) => (
                      <Option key={cat} value={cat} text={cat}>
                        {cat}
                      </Option>
                    ))}
                  </Dropdown>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12px", fontWeight: 500, color: "#334155" }}>
                      Department
                    </label>
                    <button
                      type="button"
                      onClick={() => setAddNewModal({ open: true, field: "Department", title: "Add New Department", value: "" })}
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
                    style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1" }}
                    value={form.Department || ""}
                    selectedOptions={form.Department ? [form.Department] : []}
                    onOptionSelect={(_, d) => {
                      if (d.optionValue === "__ADD_NEW__") {
                        setAddNewModal({ open: true, field: "Department", title: "Add New Department", value: "" });
                        return;
                      }
                      handleChange("Department", d.optionValue ?? "Operations");
                    }}
                    mountNode={mountNode}
                    placeholder="Select Department"
                  >
                    <Option value="__ADD_NEW__" text="+ Add New Department...">
                      <span style={{ color: "#007ED5", fontWeight: 600 }}>+ Add New Department...</span>
                    </Option>
                    {allDepartmentOptions.map((dept) => (
                      <Option key={dept} value={dept} text={dept}>
                        {dept}
                      </Option>
                    ))}
                  </Dropdown>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Asset Photo */}
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "12px" }}>
              Asset Photo
            </div>
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
                Only (JPG, GIF, PNG) are allowed
              </div>
            </div>

            {pendingPhotos.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {pendingPhotos.map((f, i) => (
                  <span
                    key={i}
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
                    <ImageRegular style={{ fontSize: 14, color: "#64748B" }} />
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

          {/* Section 4: Warranty Details */}
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A", marginBottom: "16px" }}>
              Warranty Details
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                  Expire Date
                </label>
                <Input
                  type="date"
                  style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1", height: 38 }}
                  value={form.ExpireDate ? form.ExpireDate.slice(0, 10) : ""}
                  onChange={(_, d) => handleChange("ExpireDate", d.value || null)}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                  Select Vendor
                </label>
                <Dropdown
                  style={{ width: "100%", borderRadius: 8, background: "#FFFFFF", border: "1px solid #CBD5E1" }}
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

            <div style={{ marginTop: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                Add Documents (if any)
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
                  Only (JPG, GIF, PNG) are allowed
                </div>
              </div>

              {pendingDocuments.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                  {pendingDocuments.map((f, i) => (
                    <span
                      key={i}
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
                          setPendingDocuments((prev) => prev.filter((_, idx) => idx !== i));
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

          {/* Footer - matching reference */}
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
              id="btn-cancel-asset"
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
              id="btn-submit-asset"
              onClick={handleSave}
              disabled={saving}
              style={{
                background: "#007ED5",
                color: "#ffffff",
                border: "none",
                borderRadius: "20px",
                padding: "8px 32px",
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
              {saving ? <Spinner size="tiny" /> : isEdit ? "Save Changes" : "Submit"}
            </button>
          </div>
        </DrawerBody>
      </Drawer>

      {/* Contextual Add New Modal */}
      {addNewModal && (
        <Dialog open={addNewModal.open} onOpenChange={(_, data) => !data.open && setAddNewModal(null)}>
          <DialogSurface style={{ maxWidth: "420px", borderRadius: "14px", padding: "20px" }}>
            <DialogBody>
              <DialogTitle style={{ fontSize: "16px", fontWeight: 700, color: "#0F172A", marginBottom: "12px" }}>
                {addNewModal.title}
              </DialogTitle>
              <DialogContent>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#334155", marginBottom: "6px" }}>
                  New {addNewModal.field} Name
                </label>
                <Input
                  autoFocus
                  style={{ width: "100%", borderRadius: 8, height: 38, border: "1px solid #CBD5E1" }}
                  placeholder={`Enter ${addNewModal.field.toLowerCase()} name...`}
                  value={addNewModal.value}
                  onChange={(_, d) => setAddNewModal((prev) => (prev ? { ...prev, value: d.value } : null))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateNewOption();
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
                  onClick={handleCreateNewOption}
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

      {/* Asset Added / Saved Information Modal */}
      {showSuccessDialog && createdAssetInfo && (
        <Dialog
          open={showSuccessDialog}
          onOpenChange={(_, data) => {
            if (!data.open) {
              setShowSuccessDialog(false);
              setCreatedAssetInfo(null);
              onOpenChange(false);
            }
          }}
        >
          <DialogSurface
            style={{
              maxWidth: "540px",
              width: "92vw",
              borderRadius: "20px",
              padding: "24px 28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12)",
              border: "1px solid #E2E8F0",
            }}
          >
            <DialogBody>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "46px",
                    height: "46px",
                    borderRadius: "50%",
                    background: "#DCFCE7",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <CheckmarkRegular style={{ fontSize: "24px", color: "#16A34A" }} />
                </div>
                <div>
                  <DialogTitle style={{ fontSize: "18px", fontWeight: 700, color: "#0F172A", margin: 0 }}>
                    {isEdit ? "Asset Updated Successfully" : "Asset Added Successfully"}
                  </DialogTitle>
                  <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
                    The asset information has been registered into the enterprise inventory catalog.
                  </div>
                </div>
              </div>

              {/* Summary Card with all asset added details */}
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: "14px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#007ED5",
                      background: "#EFF6FF",
                      padding: "3px 10px",
                      borderRadius: "999px",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {createdAssetInfo.AssetTagID || "AST-NEW"}
                  </span>
                  <span
                    style={{
                      fontSize: "11.5px",
                      fontWeight: 600,
                      color: "#16A34A",
                      background: "#DCFCE7",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {createdAssetInfo.Status || "In Stock"}
                  </span>
                </div>

                <div style={{ fontWeight: 700, fontSize: "15.5px", color: "#0F172A" }}>
                  {createdAssetInfo.AssetName || createdAssetInfo.Description || "Enterprise Asset"}
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "10px",
                    paddingTop: "12px",
                    borderTop: "1px solid #E2E8F0",
                    fontSize: "12.5px",
                  }}
                >
                  <div>
                    <span style={{ color: "#64748B" }}>Category: </span>
                    <strong style={{ color: "#1E293B" }}>{createdAssetInfo.Category || "Laptop"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Brand: </span>
                    <strong style={{ color: "#1E293B" }}>{createdAssetInfo.Brand || "-"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Model: </span>
                    <strong style={{ color: "#1E293B" }}>{createdAssetInfo.Model || "-"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Serial No: </span>
                    <strong style={{ color: "#1E293B" }}>{createdAssetInfo.SerialNo || "-"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Site: </span>
                    <strong style={{ color: "#1E293B" }}>{createdAssetInfo.Site || "Coimbatore"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Location: </span>
                    <strong style={{ color: "#1E293B" }}>{createdAssetInfo.Location || "-"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Department: </span>
                    <strong style={{ color: "#1E293B" }}>{createdAssetInfo.AssignedToDepartment || "Operations"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748B" }}>Cost: </span>
                    <strong style={{ color: "#1E293B" }}>
                      {createdAssetInfo.Cost ? `₹${Number(createdAssetInfo.Cost).toLocaleString("en-IN")}` : "—"}
                    </strong>
                  </div>
                  {purchasedFrom && (
                    <div style={{ gridColumn: "span 2" }}>
                      <span style={{ color: "#64748B" }}>Vendor: </span>
                      <strong style={{ color: "#1E293B" }}>{purchasedFrom}</strong>
                    </div>
                  )}
                </div>
              </div>

              <DialogActions style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                {!isEdit && (
                  <Button
                    appearance="secondary"
                    onClick={() => {
                      setShowSuccessDialog(false);
                      setCreatedAssetInfo(null);
                      setForm({ ...emptyForm, AssetName: "", Description: "" });
                      setPurchasedFrom("");
                    }}
                    style={{ borderRadius: "10px" }}
                  >
                    Add Another Asset
                  </Button>
                )}
                <Button
                  appearance="primary"
                  onClick={() => {
                    setShowSuccessDialog(false);
                    setCreatedAssetInfo(null);
                    onOpenChange(false);
                  }}
                  style={{ background: "#007ED5", borderRadius: "10px" }}
                >
                  Done & View in Inventory
                </Button>
              </DialogActions>
            </DialogBody>
          </DialogSurface>
        </Dialog>
      )}

      {mountNodePortal}
  </>
);
};

export default AssetFormDialog;
