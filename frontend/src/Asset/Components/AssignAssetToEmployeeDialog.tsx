import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogActions,
  Button,
  Input,
  Text,
  Spinner,
  Avatar,
  Badge,
} from "@fluentui/react-components";
import {
  SearchRegular,
  Dismiss24Regular,
  Person20Regular,
  CheckmarkCircle20Filled,
  Location20Regular,
  Building20Regular,
} from "@fluentui/react-icons";
import AssetIcon from "./AssetIcon";
import {
  AssetInventoryRecord,
  getAssetInventoryList,
  assignAssetToEmployee,
} from "../Services/AssetInventoryService";
import {
  AssetModuleEmployee,
  getAssetModuleEmployees,
} from "../Services/AssetEmployeeService";

interface AssignAssetToEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AssignAssetToEmployeeDialog: React.FC<AssignAssetToEmployeeDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [employees, setEmployees] = useState<AssetModuleEmployee[]>([]);
  const [assets, setAssets] = useState<AssetInventoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<AssetModuleEmployee | null>(null);

  const [assetSearch, setAssetSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<AssetInventoryRecord | null>(null);

  const [notes, setNotes] = useState("Standard hardware allocation for employee onboarding/upgrade");

  useEffect(() => {
    if (!open) {
      setSelectedEmployee(null);
      setSelectedAsset(null);
      setEmployeeSearch("");
      setAssetSearch("");
      setError(null);
      return;
    }

    const loadOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const [empData, inventoryData] = await Promise.all([
          getAssetModuleEmployees(1, 100, null, null),
          getAssetInventoryList(),
        ]);
        setEmployees(empData.users || []);
        // Only show In Stock assets
        const inStock = (inventoryData || []).filter(
          (a) => a.Status === "In Stock" || (!a.IsAssigned && a.Status !== "Under Maintenance" && a.Status !== "End of Use")
        );
        setAssets(inStock);
      } catch (err: any) {
        setError(err?.message || "Failed to load employees or stock assets");
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [open]);

  const filteredEmployees = useMemo(() => {
    const term = employeeSearch.trim().toLowerCase();
    if (!term) return employees.slice(0, 10);
    return employees.filter(
      (e) =>
        (e.DisplayName || "").toLowerCase().includes(term) ||
        (e.Department || "").toLowerCase().includes(term) ||
        (e.Mail || "").toLowerCase().includes(term) ||
        (e.EmployeeId || "").toLowerCase().includes(term)
    );
  }, [employees, employeeSearch]);

  const filteredAssets = useMemo(() => {
    const term = assetSearch.trim().toLowerCase();
    if (!term) return assets.slice(0, 10);
    return assets.filter(
      (a) =>
        (a.AssetName || "").toLowerCase().includes(term) ||
        (a.AssetTagID || "").toLowerCase().includes(term) ||
        (a.Category || "").toLowerCase().includes(term) ||
        (a.LocationName || a.Location || "").toLowerCase().includes(term)
    );
  }, [assets, assetSearch]);

  const handleAssign = async () => {
    if (!selectedEmployee) {
      setError("Please select an employee to receive the asset");
      return;
    }
    if (!selectedAsset) {
      setError("Please select an available asset to assign");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await assignAssetToEmployee(selectedAsset.ID, {
        employeeId: selectedEmployee.ID,
        notes: notes.trim(),
      });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || "Failed to complete asset assignment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface
        style={{
          maxWidth: "720px",
          width: "95vw",
          borderRadius: "20px",
          padding: "28px",
          background: "#FFFFFF",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        <DialogTitle
          action={
            <Button
              appearance="subtle"
              aria-label="close"
              icon={<Dismiss24Regular />}
              onClick={() => onOpenChange(false)}
            />
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "#E0F2FE",
                color: "#007ED5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Person20Regular />
            </div>
            <div>
              <Text weight="bold" size={500} style={{ color: "#0F172A" }}>
                Add Asset to Employee
              </Text>
              <div style={{ fontSize: "13px", color: "#64748B", marginTop: "2px" }}>
                Directly allocate inventory to an employee with immediate system synchronization
              </div>
            </div>
          </div>
        </DialogTitle>

        <DialogBody style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "10px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#DC2626",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <Spinner label="Loading employee and asset directories..." />
            </div>
          ) : (
            <>
              {/* Step 1: Select Employee */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B" }}>
                    1. Select Recipient Employee
                  </label>
                  {selectedEmployee && (
                    <span
                      onClick={() => setSelectedEmployee(null)}
                      style={{ fontSize: "12px", color: "#007ED5", cursor: "pointer", fontWeight: 600 }}
                    >
                      Change Employee
                    </span>
                  )}
                </div>

                {selectedEmployee ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background: "#F0FDF4",
                      border: "1px solid #86EFAC",
                    }}
                  >
                    <Avatar name={selectedEmployee.DisplayName} size={40} color="colorful" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#0F172A", fontSize: "14px" }}>
                        {selectedEmployee.DisplayName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B" }}>
                        {selectedEmployee.Department || "General"} • {selectedEmployee.Mail}
                      </div>
                    </div>
                    <CheckmarkCircle20Filled style={{ color: "#16A34A", fontSize: "22px" }} />
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search employee by name, department, or email..."
                      contentBefore={<SearchRegular style={{ color: "#94A3B8" }} />}
                      value={employeeSearch}
                      onChange={(_, data) => setEmployeeSearch(data.value)}
                      style={{ width: "100%" }}
                    />
                    <div
                      style={{
                        maxHeight: "150px",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        padding: "4px",
                        background: "#F8FAFC",
                        borderRadius: "10px",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      {filteredEmployees.length === 0 ? (
                        <div style={{ padding: "12px", textAlign: "center", fontSize: "12.5px", color: "#64748B" }}>
                          No matching employees found
                        </div>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <div
                            key={emp.ID}
                            onClick={() => setSelectedEmployee(emp)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              background: "#FFFFFF",
                              border: "1px solid #EDF2F7",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#007ED5")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#EDF2F7")}
                          >
                            <Avatar name={emp.DisplayName} size={28} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                                {emp.DisplayName}
                              </div>
                              <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                                {emp.Department || "General"} • {emp.Mail}
                              </div>
                            </div>
                            <Badge appearance="tint" color="informative" size="small">
                              Select
                            </Badge>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Step 2: Select In-Stock Asset */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B" }}>
                    2. Select Available Asset (In Stock: {assets.length})
                  </label>
                  {selectedAsset && (
                    <span
                      onClick={() => setSelectedAsset(null)}
                      style={{ fontSize: "12px", color: "#007ED5", cursor: "pointer", fontWeight: 600 }}
                    >
                      Change Asset
                    </span>
                  )}
                </div>

                {selectedAsset ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 16px",
                      borderRadius: "12px",
                      background: "#F0FDF4",
                      border: "1px solid #86EFAC",
                    }}
                  >
                    <AssetIcon category={selectedAsset.Category} name={selectedAsset.AssetName} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#0F172A", fontSize: "14px" }}>
                        {selectedAsset.AssetName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B" }}>
                        Tag: {selectedAsset.AssetTagID} • {selectedAsset.Category} • {selectedAsset.LocationName || selectedAsset.Location || "HQ"}
                      </div>
                    </div>
                    <CheckmarkCircle20Filled style={{ color: "#16A34A", fontSize: "22px" }} />
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search available asset by name, tag, category, or branch..."
                      contentBefore={<SearchRegular style={{ color: "#94A3B8" }} />}
                      value={assetSearch}
                      onChange={(_, data) => setAssetSearch(data.value)}
                      style={{ width: "100%" }}
                    />
                    <div
                      style={{
                        maxHeight: "170px",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        padding: "4px",
                        background: "#F8FAFC",
                        borderRadius: "10px",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      {filteredAssets.length === 0 ? (
                        <div style={{ padding: "12px", textAlign: "center", fontSize: "12.5px", color: "#64748B" }}>
                          No in-stock assets available to allocate
                        </div>
                      ) : (
                        filteredAssets.map((asset) => (
                          <div
                            key={asset.ID}
                            onClick={() => setSelectedAsset(asset)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "8px 12px",
                              borderRadius: "8px",
                              background: "#FFFFFF",
                              border: "1px solid #EDF2F7",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#007ED5")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#EDF2F7")}
                          >
                            <AssetIcon category={asset.Category} name={asset.AssetName} size="sm" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "13px", fontWeight: 600, color: "#1E293B" }}>
                                {asset.AssetName}
                              </div>
                              <div style={{ fontSize: "11.5px", color: "#64748B" }}>
                                {asset.AssetTagID} • {asset.Category} • {asset.LocationName || asset.Location || "Warehouse"}
                              </div>
                            </div>
                            <span
                              style={{
                                background: "#EFF6FF",
                                color: "#1D4ED8",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              Allocate
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Step 3: Assignment Note */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B" }}>
                  3. Assignment Purpose / Handover Notes
                </label>
                <Input
                  value={notes}
                  onChange={(_, data) => setNotes(data.value)}
                  placeholder="Optional assignment or handover note..."
                  style={{ width: "100%" }}
                />
              </div>
            </>
          )}
        </DialogBody>

        <DialogActions style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <Button appearance="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            appearance="primary"
            onClick={handleAssign}
            disabled={!selectedEmployee || !selectedAsset || submitting || loading}
            style={{
              background: "#007ED5",
              color: "#FFFFFF",
              fontWeight: 600,
              minWidth: "140px",
            }}
          >
            {submitting ? "Assigning..." : "Confirm Assignment"}
          </Button>
        </DialogActions>
      </DialogSurface>
    </Dialog>
  );
};

export default AssignAssetToEmployeeDialog;
