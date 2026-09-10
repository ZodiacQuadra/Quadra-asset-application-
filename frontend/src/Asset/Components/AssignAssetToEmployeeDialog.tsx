import React, { useEffect, useMemo, useState } from "react";
import {
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Input,
  Text,
  Spinner,
  Avatar,
  Badge,
  Dropdown,
  Option,
} from "@fluentui/react-components";
import {
  SearchRegular,
  Dismiss24Regular,
  Person20Regular,
  CheckmarkCircle20Filled,
  DismissCircleRegular,
  FilterRegular,
} from "@fluentui/react-icons";
import AssetIcon from "./AssetIcon";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import {
  AssetInventoryRecord,
  getAssetInventoryList,
  assignAssetToEmployee,
} from "../Services/AssetInventoryService";
import {
  AssetModuleEmployee,
  getAssetModuleEmployees,
} from "../Services/AssetEmployeeService";
import {
  CANONICAL_BRANCHES,
  CANONICAL_DEPARTMENTS,
} from "../../Common/EnterpriseConstants";

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
  const { mountNode, portal } = useThemedMountNode();

  const [employees, setEmployees] = useState<AssetModuleEmployee[]>([]);
  const [assets, setAssets] = useState<AssetInventoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Employee Selection & Filtering
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState<AssetModuleEmployee | null>(null);

  // Asset Selection & Filtering
  const [assetSearch, setAssetSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<AssetInventoryRecord | null>(null);

  const [notes, setNotes] = useState("Standard hardware allocation for employee onboarding/upgrade");

  useEffect(() => {
    if (!open) {
      setSelectedEmployee(null);
      setSelectedAsset(null);
      setEmployeeSearch("");
      setBranchFilter("All");
      setDepartmentFilter("All");
      setAssetSearch("");
      setError(null);
      return;
    }

    const loadOptions = async () => {
      setLoading(true);
      setError(null);
      try {
        const [empData, inventoryData] = await Promise.all([
          getAssetModuleEmployees(1, 200, null, null),
          getAssetInventoryList(),
        ]);
        setEmployees(empData.users || []);
        // Only show In Stock / unassigned assets
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

  // Combined Branch + Department + Search Employee Filter
  const filteredEmployees = useMemo(() => {
    let list = employees;

    if (branchFilter !== "All") {
      const bLower = branchFilter.toLowerCase();
      list = list.filter((e) => ((e as any).Branch || (e as any).Site || "").toLowerCase().includes(bLower));
    }

    if (departmentFilter !== "All") {
      const dLower = departmentFilter.toLowerCase();
      list = list.filter((e) => (e.Department || "").toLowerCase() === dLower);
    }

    if (employeeSearch.trim()) {
      const term = employeeSearch.trim().toLowerCase();
      list = list.filter(
        (e) =>
          (e.DisplayName || "").toLowerCase().includes(term) ||
          (e.Department || "").toLowerCase().includes(term) ||
          (e.Mail || "").toLowerCase().includes(term) ||
          (e.EmployeeId || "").toLowerCase().includes(term)
      );
    }

    return list;
  }, [employees, employeeSearch, branchFilter, departmentFilter]);

  const hasActiveFilters = employeeSearch.trim() !== "" || branchFilter !== "All" || departmentFilter !== "All";

  const handleResetFilters = () => {
    setEmployeeSearch("");
    setBranchFilter("All");
    setDepartmentFilter("All");
  };

  const filteredAssets = useMemo(() => {
    const term = assetSearch.trim().toLowerCase();
    if (!term) return assets.slice(0, 15);
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
    <>
      <Drawer
        type="overlay"
        position="end"
        open={open}
        onOpenChange={(_, data) => onOpenChange(data.open)}
        style={{
          width: "min(640px, 92vw)",
          backgroundColor: "#FFFFFF",
          background: "#FFFFFF",
          boxShadow: "-10px 0 40px rgba(15, 23, 42, 0.18)",
        }}
      >
        <DrawerHeader style={{ borderBottom: "1px solid #E2E8F0", padding: "16px 24px" }}>
          <DrawerHeaderTitle
            action={
              <Button
                appearance="subtle"
                aria-label="close"
                icon={<Dismiss24Regular />}
                onClick={() => onOpenChange(false)}
              />
            }
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: 34,
                  height: 34,
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
                <Person20Regular />
              </div>
              <div>
                <Text weight="bold" style={{ color: "#0F172A", fontSize: "15px", display: "block" }}>
                  Assign Asset to Employee
                </Text>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  Allocate in-stock inventory directly to staff
                </span>
              </div>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        <DrawerBody style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#DC2626",
                fontSize: "13px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>⚠️</span> {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
              <Spinner label="Loading employee and inventory directories..." />
            </div>
          ) : (
            <>
              {/* Step 1: Select Employee */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A" }}>
                    1. Select Recipient Employee
                  </span>
                  {selectedEmployee && (
                    <button
                      type="button"
                      onClick={() => setSelectedEmployee(null)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "12px",
                        color: "#007ED5",
                        cursor: "pointer",
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      Change Employee
                    </button>
                  )}
                </div>

                {selectedEmployee ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: "#EFF6FF",
                      border: "1px solid #BFDBFE",
                    }}
                  >
                    <Avatar name={selectedEmployee.DisplayName} size={40} color="colorful" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>
                        {selectedEmployee.DisplayName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                        {selectedEmployee.EmployeeId ? `${selectedEmployee.EmployeeId} · ` : ""}
                        {selectedEmployee.Department || "General"} · {selectedEmployee.Mail}
                      </div>
                    </div>
                    <CheckmarkCircle20Filled style={{ color: "#007ED5", fontSize: "22px" }} />
                  </div>
                ) : (
                  <>
                    {/* Search Field */}
                    <Input
                      placeholder="Search by name, employee ID, or email..."
                      contentBefore={<SearchRegular style={{ color: "#94A3B8" }} />}
                      value={employeeSearch}
                      onChange={(_, data) => setEmployeeSearch(data.value)}
                      style={{ width: "100%", borderRadius: "8px" }}
                    />

                    {/* Filters: Branch and Department */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                          Branch
                        </span>
                        <Dropdown
                          mountNode={mountNode}
                          placeholder="All Branches"
                          value={branchFilter === "All" ? "All Branches" : branchFilter}
                          selectedOptions={[branchFilter]}
                          onOptionSelect={(_, d) => setBranchFilter(d.optionValue || "All")}
                          style={{ width: "100%" }}
                        >
                          <Option key="all" value="All" text="All Branches">
                            All Branches
                          </Option>
                          {CANONICAL_BRANCHES.map((b) => (
                            <Option key={b} value={b} text={b}>
                              {b}
                            </Option>
                          ))}
                        </Dropdown>
                      </div>

                      <div>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: "#64748B", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                          Department
                        </span>
                        <Dropdown
                          mountNode={mountNode}
                          placeholder="All Departments"
                          value={departmentFilter === "All" ? "All Departments" : departmentFilter}
                          selectedOptions={[departmentFilter]}
                          onOptionSelect={(_, d) => setDepartmentFilter(d.optionValue || "All")}
                          style={{ width: "100%" }}
                        >
                          <Option key="all-dept" value="All" text="All Departments">
                            All Departments
                          </Option>
                          {CANONICAL_DEPARTMENTS.map((d) => (
                            <Option key={d} value={d} text={d}>
                              {d}
                            </Option>
                          ))}
                        </Dropdown>
                      </div>
                    </div>

                    {/* Filter Active Notice & Clear */}
                    {hasActiveFilters && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                        <span style={{ color: "#64748B" }}>
                          Showing {filteredEmployees.length} matching {filteredEmployees.length === 1 ? "employee" : "employees"}
                        </span>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#007ED5",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}

                    {/* Employee List */}
                    <div
                      style={{
                        maxHeight: "180px",
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
                        <div style={{ padding: "20px 12px", textAlign: "center" }}>
                          <span style={{ display: "block", fontSize: "13px", color: "#64748B", fontWeight: 500 }}>
                            No employees match these filters.
                          </span>
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            style={{
                              marginTop: "8px",
                              background: "#EFF6FF",
                              color: "#007ED5",
                              border: "1px solid #BFDBFE",
                              borderRadius: "16px",
                              padding: "4px 14px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Reset All Filters
                          </button>
                        </div>
                      ) : (
                        filteredEmployees.slice(0, 20).map((emp) => (
                          <div
                            key={emp.ID}
                            onClick={() => setSelectedEmployee(emp)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              background: "#FFFFFF",
                              border: "1px solid #EDF2F7",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#007ED5")}
                            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#EDF2F7")}
                          >
                            <Avatar name={emp.DisplayName} size={32} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A" }}>
                                {emp.DisplayName}
                              </div>
                              <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "1px" }}>
                                {emp.EmployeeId ? <span style={{ fontWeight: 600 }}>{emp.EmployeeId} · </span> : null}
                                {emp.Department || "General"}
                                {(emp as any).Branch ? ` · ${(emp as any).Branch}` : ""}
                                {` · ${emp.Mail}`}
                              </div>
                            </div>
                            <span
                              style={{
                                background: "#EFF6FF",
                                color: "#007ED5",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "3px 10px",
                                borderRadius: "12px",
                              }}
                            >
                              Select
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Step 2: Select In-Stock Asset */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A" }}>
                    2. Select Available Asset (In Stock: {assets.length})
                  </span>
                  {selectedAsset && (
                    <button
                      type="button"
                      onClick={() => setSelectedAsset(null)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "12px",
                        color: "#007ED5",
                        cursor: "pointer",
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      Change Asset
                    </button>
                  )}
                </div>

                {selectedAsset ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      background: "#EFF6FF",
                      border: "1px solid #BFDBFE",
                    }}
                  >
                    <AssetIcon category={selectedAsset.Category} name={selectedAsset.AssetName} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>
                        {selectedAsset.AssetName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                        Tag: <strong>{selectedAsset.AssetTagID}</strong> · {selectedAsset.Category} · {selectedAsset.LocationName || selectedAsset.Location || "HQ IT Bay"}
                      </div>
                    </div>
                    <CheckmarkCircle20Filled style={{ color: "#007ED5", fontSize: "22px" }} />
                  </div>
                ) : (
                  <>
                    <Input
                      placeholder="Search available asset by name, tag, category, or branch..."
                      contentBefore={<SearchRegular style={{ color: "#94A3B8" }} />}
                      value={assetSearch}
                      onChange={(_, data) => setAssetSearch(data.value)}
                      style={{ width: "100%", borderRadius: "8px" }}
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
                        <div style={{ padding: "16px", textAlign: "center", fontSize: "12.5px", color: "#64748B" }}>
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
                              padding: "10px 12px",
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
                              <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                                {asset.AssetName}
                              </div>
                              <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "1px" }}>
                                {asset.AssetTagID} · {asset.Category} · {asset.LocationName || asset.Location || "Main Bay"}
                              </div>
                            </div>
                            <span
                              style={{
                                background: "#EFF6FF",
                                color: "#007ED5",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "3px 10px",
                                borderRadius: "12px",
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
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                  3. Assignment Purpose / Handover Notes
                </span>
                <Input
                  value={notes}
                  onChange={(_, data) => setNotes(data.value)}
                  placeholder="Optional assignment or handover note..."
                  style={{ width: "100%", borderRadius: "8px" }}
                />
              </div>
            </>
          )}
        </DrawerBody>

        {/* Footer Action Area */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #E2E8F0",
            background: "#FFFFFF",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            bottom: 0,
            zIndex: 10,
          }}
        >
          <button
            type="button"
            id="btn-cancel-assign-asset"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
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
            id="btn-submit-assign-asset"
            onClick={handleAssign}
            disabled={!selectedEmployee || !selectedAsset || submitting || loading}
            style={{
              background: "#007ED5",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "20px",
              padding: "8px 28px",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: !selectedEmployee || !selectedAsset || submitting || loading ? "not-allowed" : "pointer",
              opacity: !selectedEmployee || !selectedAsset ? 0.6 : 1,
              boxShadow: "0 2px 6px rgba(0, 126, 213, 0.25)",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.15s ease",
            }}
          >
            {submitting ? <Spinner size="tiny" /> : "Assign Asset"}
          </button>
        </div>
      </Drawer>
      {portal}
    </>
  );
};

export default AssignAssetToEmployeeDialog;
