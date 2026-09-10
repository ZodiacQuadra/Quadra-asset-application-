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
  Textarea,
} from "@fluentui/react-components";
import {
  SearchRegular,
  Dismiss24Regular,
  Person20Regular,
  CheckmarkCircle20Filled,
  DismissCircleRegular,
  CheckmarkRegular,
  ArrowRightRegular,
  ArrowLeftRegular,
  BuildingRegular,
  TagRegular,
  BoxRegular,
  CalendarRegular,
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
  normalizeBranch,
} from "../../Common/EnterpriseConstants";

interface AssignAssetToEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const ASSIGNMENT_PURPOSES = [
  "Standard Onboarding Provision",
  "Hardware Refresh / Upgrade",
  "Project / Secondary Allocation",
  "Temporary Loaner Unit",
  "Replacement for Lost / Damaged Unit",
  "Permanent Custody Transfer",
];

export const AssignAssetToEmployeeDialog: React.FC<AssignAssetToEmployeeDialogProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const { mountNode, portal } = useThemedMountNode();

  // Multi-step workflow state: 1, 2, or 3
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const [employees, setEmployees] = useState<AssetModuleEmployee[]>([]);
  const [assets, setAssets] = useState<AssetInventoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Employee Selection & Filtering
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [selectedEmployee, setSelectedEmployee] = useState<AssetModuleEmployee | null>(null);

  // Step 2: Asset Selection & Filtering
  const [assetSearch, setAssetSearch] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<AssetInventoryRecord | null>(null);

  // Step 3: Assignment Purpose & Notes
  const [purpose, setPurpose] = useState(ASSIGNMENT_PURPOSES[0]);
  const [notes, setNotes] = useState("Standard hardware allocation for employee onboarding/upgrade");

  useEffect(() => {
    if (!open) {
      setActiveStep(1);
      setSelectedEmployee(null);
      setSelectedAsset(null);
      setEmployeeSearch("");
      setBranchFilter("All");
      setDepartmentFilter("All");
      setAssetSearch("");
      setPurpose(ASSIGNMENT_PURPOSES[0]);
      setNotes("Standard hardware allocation for employee onboarding/upgrade");
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

  // Filtered employees
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

  const hasActiveEmpFilters = employeeSearch.trim() !== "" || branchFilter !== "All" || departmentFilter !== "All";

  const handleResetEmpFilters = () => {
    setEmployeeSearch("");
    setBranchFilter("All");
    setDepartmentFilter("All");
  };

  // Filtered in-stock assets
  const filteredAssets = useMemo(() => {
    const term = assetSearch.trim().toLowerCase();
    if (!term) return assets.slice(0, 25);
    return assets.filter(
      (a) =>
        (a.AssetName || "").toLowerCase().includes(term) ||
        (a.AssetTagID || "").toLowerCase().includes(term) ||
        (a.Category || "").toLowerCase().includes(term) ||
        (a.Model || "").toLowerCase().includes(term) ||
        (a.LocationName || a.Location || "").toLowerCase().includes(term)
    );
  }, [assets, assetSearch]);

  const handleAssign = async () => {
    if (!selectedEmployee) {
      setError("Please select an employee to receive the asset");
      setActiveStep(1);
      return;
    }
    if (!selectedAsset) {
      setError("Please select an available asset to assign");
      setActiveStep(2);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const combinedNotes = `[Purpose: ${purpose}] ${notes.trim()}`;
      await assignAssetToEmployee(selectedAsset.ID, {
        employeeId: selectedEmployee.ID,
        notes: combinedNotes,
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
          width: "min(680px, 94vw)",
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
                  width: 36,
                  height: 36,
                  borderRadius: 10,
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
                <Text weight="bold" style={{ color: "#0F172A", fontSize: "15.5px", display: "block" }}>
                  Assign Asset to Employee
                </Text>
                <span style={{ fontSize: "12px", color: "#64748B" }}>
                  Hardware issuance & custody allocation workflow
                </span>
              </div>
            </div>
          </DrawerHeaderTitle>
        </DrawerHeader>

        {/* Step Progress Bar Header */}
        <div
          style={{
            padding: "12px 24px",
            background: "#F8FAFC",
            borderBottom: "1px solid #E2E8F0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          {/* Step 1 Indicator */}
          <div
            onClick={() => setActiveStep(1)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              opacity: activeStep === 1 ? 1 : 0.75,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: selectedEmployee ? "#059669" : activeStep === 1 ? "#007ED5" : "#E2E8F0",
                color: selectedEmployee || activeStep === 1 ? "#FFFFFF" : "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {selectedEmployee ? <CheckmarkRegular style={{ fontSize: 14 }} /> : "1"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: activeStep === 1 ? 700 : 600, color: activeStep === 1 ? "#007ED5" : "#334155" }}>
                01 Recipient
              </div>
              <div style={{ fontSize: "10.5px", color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedEmployee ? selectedEmployee.DisplayName : "Select Staff"}
              </div>
            </div>
          </div>

          <div style={{ color: "#CBD5E1", fontSize: "14px" }}>→</div>

          {/* Step 2 Indicator */}
          <div
            onClick={() => selectedEmployee && setActiveStep(2)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: selectedEmployee ? "pointer" : "not-allowed",
              opacity: activeStep === 2 ? 1 : selectedEmployee ? 0.75 : 0.45,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: selectedAsset ? "#059669" : activeStep === 2 ? "#007ED5" : "#E2E8F0",
                color: selectedAsset || activeStep === 2 ? "#FFFFFF" : "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              {selectedAsset ? <CheckmarkRegular style={{ fontSize: 14 }} /> : "2"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: activeStep === 2 ? 700 : 600, color: activeStep === 2 ? "#007ED5" : "#334155" }}>
                02 Asset
              </div>
              <div style={{ fontSize: "10.5px", color: "#64748B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedAsset ? selectedAsset.AssetTagID : "Select In-Stock"}
              </div>
            </div>
          </div>

          <div style={{ color: "#CBD5E1", fontSize: "14px" }}>→</div>

          {/* Step 3 Indicator */}
          <div
            onClick={() => selectedEmployee && selectedAsset && setActiveStep(3)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: selectedEmployee && selectedAsset ? "pointer" : "not-allowed",
              opacity: activeStep === 3 ? 1 : selectedEmployee && selectedAsset ? 0.75 : 0.45,
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: activeStep === 3 ? "#007ED5" : "#E2E8F0",
                color: activeStep === 3 ? "#FFFFFF" : "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "12px",
                fontWeight: 700,
              }}
            >
              3
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: activeStep === 3 ? 700 : 600, color: activeStep === 3 ? "#007ED5" : "#334155" }}>
                03 Details
              </div>
              <div style={{ fontSize: "10.5px", color: "#64748B" }}>
                Purpose & Notes
              </div>
            </div>
          </div>
        </div>

        <DrawerBody style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "18px" }}>
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
            <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
              <Spinner label="Loading employee directory and stock inventory..." />
            </div>
          ) : (
            <>
              {/* ============================================================== */}
              {/* STEP 1: SELECT EMPLOYEE                                         */}
              {/* ============================================================== */}
              {activeStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "14.5px", fontWeight: 700, color: "#0F172A" }}>
                        01 — Select Recipient Employee
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                        Search and pick the employee receiving the hardware asset
                      </div>
                    </div>
                  </div>

                  {/* Active Selected Card Preview */}
                  {selectedEmployee && (
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: "#EFF6FF",
                        border: "1.5px solid #93C5FD",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                      }}
                    >
                      <Avatar name={selectedEmployee.DisplayName} size={44} color="colorful" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>
                            {selectedEmployee.DisplayName}
                          </span>
                          {selectedEmployee.EmployeeId && (
                            <span style={{ fontSize: "11px", fontWeight: 700, padding: "1px 6px", borderRadius: "4px", background: "#DBEAFE", color: "#1D4ED8" }}>
                              {selectedEmployee.EmployeeId}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px" }}>
                          {selectedEmployee.Department || "General"} · {normalizeBranch((selectedEmployee as any).Branch || (selectedEmployee as any).Site || "Coimbatore")}
                        </div>
                        <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "1px" }}>
                          {selectedEmployee.Mail}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                        <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckmarkRegular style={{ fontSize: 14 }} /> Selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedEmployee(null)}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "12px",
                            color: "#007ED5",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Search and Filters */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <Input
                      placeholder="Search employee by name, ID, department, or email..."
                      contentBefore={<SearchRegular style={{ color: "#94A3B8" }} />}
                      value={employeeSearch}
                      onChange={(_, data) => setEmployeeSearch(data.value)}
                      style={{ width: "100%", borderRadius: "8px" }}
                    />

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

                    {hasActiveEmpFilters && (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px" }}>
                        <span style={{ color: "#64748B" }}>
                          Showing {filteredEmployees.length} matching employee(s)
                        </span>
                        <button
                          type="button"
                          onClick={handleResetEmpFilters}
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
                  </div>

                  {/* Employee Cards List */}
                  <div
                    style={{
                      maxHeight: "260px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      padding: "6px",
                      background: "#F8FAFC",
                      borderRadius: "10px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    {filteredEmployees.length === 0 ? (
                      <div style={{ padding: "30px 12px", textAlign: "center" }}>
                        <span style={{ display: "block", fontSize: "13px", color: "#64748B", fontWeight: 500 }}>
                          No employees found matching these filters.
                        </span>
                        <button
                          type="button"
                          onClick={handleResetEmpFilters}
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
                          Reset Filters
                        </button>
                      </div>
                    ) : (
                      filteredEmployees.slice(0, 30).map((emp) => {
                        const isSelected = selectedEmployee?.ID === emp.ID;
                        return (
                          <div
                            key={emp.ID}
                            onClick={() => {
                              setSelectedEmployee(emp);
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              background: isSelected ? "#EFF6FF" : "#FFFFFF",
                              border: isSelected ? "1.5px solid #007ED5" : "1px solid #E2E8F0",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.borderColor = "#93C5FD";
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.borderColor = "#E2E8F0";
                            }}
                          >
                            <Avatar name={emp.DisplayName} size={36} color="colorful" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "13.5px", fontWeight: 700, color: "#0F172A" }}>
                                  {emp.DisplayName}
                                </span>
                                {emp.EmployeeId && (
                                  <span style={{ fontSize: "10.5px", fontWeight: 600, color: "#2563EB", background: "#EFF6FF", padding: "1px 5px", borderRadius: "4px" }}>
                                    {emp.EmployeeId}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "1px" }}>
                                {emp.Department || "General"} · {normalizeBranch((emp as any).Branch || (emp as any).Site || "Coimbatore")} · {emp.Mail}
                              </div>
                            </div>
                            <span
                              style={{
                                background: isSelected ? "#007ED5" : "#EFF6FF",
                                color: isSelected ? "#FFFFFF" : "#007ED5",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "4px 12px",
                                borderRadius: "14px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 2: SELECT ASSET                                            */}
              {/* ============================================================== */}
              {activeStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "14.5px", fontWeight: 700, color: "#0F172A" }}>
                        02 — Select Available Hardware Asset
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                        In-stock hardware assets available for assignment ({assets.length} total units)
                      </div>
                    </div>
                  </div>

                  {/* Recipient Context Pill */}
                  {selectedEmployee && (
                    <div
                      style={{
                        padding: "8px 12px",
                        background: "#F8FAFC",
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        fontSize: "12px",
                        color: "#475569",
                      }}
                    >
                      <span>Assigning to:</span>
                      <Avatar name={selectedEmployee.DisplayName} size={20} />
                      <strong style={{ color: "#0F172A" }}>{selectedEmployee.DisplayName}</strong>
                      <span>({selectedEmployee.Department || "General"})</span>
                    </div>
                  )}

                  {/* Active Selected Asset Preview */}
                  {selectedAsset && (
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "12px",
                        background: "#EFF6FF",
                        border: "1.5px solid #93C5FD",
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                      }}
                    >
                      <AssetIcon category={selectedAsset.Category} name={selectedAsset.AssetName} size="md" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 700, color: "#0F172A", fontSize: "14px" }}>
                            {selectedAsset.AssetName}
                          </span>
                          <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", background: "#ECFDF5", color: "#059669" }}>
                            In Stock
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#475569", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#2563EB", background: "#DBEAFE", padding: "1px 6px", borderRadius: "4px" }}>
                            {selectedAsset.AssetTagID}
                          </span>
                          <span>•</span>
                          <span>{selectedAsset.Category}</span>
                          <span>•</span>
                          <span>{selectedAsset.LocationName || selectedAsset.Location || "Central Store"}</span>
                        </div>
                        {selectedAsset.Model && (
                          <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "1px" }}>
                            Model: {selectedAsset.Model}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                        <span style={{ fontSize: "11.5px", fontWeight: 700, color: "#059669", display: "flex", alignItems: "center", gap: "4px" }}>
                          <CheckmarkRegular style={{ fontSize: 14 }} /> Selected
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedAsset(null)}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "12px",
                            color: "#007ED5",
                            fontWeight: 600,
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Search Available Assets */}
                  <Input
                    placeholder="Search in-stock asset by name, tag (e.g. AST0001), category, location..."
                    contentBefore={<SearchRegular style={{ color: "#94A3B8" }} />}
                    value={assetSearch}
                    onChange={(_, data) => setAssetSearch(data.value)}
                    style={{ width: "100%", borderRadius: "8px" }}
                  />

                  {/* Asset List */}
                  <div
                    style={{
                      maxHeight: "260px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      padding: "6px",
                      background: "#F8FAFC",
                      borderRadius: "10px",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    {filteredAssets.length === 0 ? (
                      <div style={{ padding: "30px 12px", textAlign: "center", fontSize: "13px", color: "#64748B" }}>
                        No in-stock hardware assets found matching "{assetSearch}".
                      </div>
                    ) : (
                      filteredAssets.map((asset) => {
                        const isSelected = selectedAsset?.ID === asset.ID;
                        return (
                          <div
                            key={asset.ID}
                            onClick={() => setSelectedAsset(asset)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "10px 12px",
                              borderRadius: "8px",
                              background: isSelected ? "#EFF6FF" : "#FFFFFF",
                              border: isSelected ? "1.5px solid #007ED5" : "1px solid #E2E8F0",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) e.currentTarget.style.borderColor = "#93C5FD";
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) e.currentTarget.style.borderColor = "#E2E8F0";
                            }}
                          >
                            <AssetIcon category={asset.Category} name={asset.AssetName} size="sm" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                                  {asset.AssetName}
                                </span>
                                <span style={{ fontSize: "10px", fontWeight: 700, padding: "1px 6px", borderRadius: "10px", background: "#ECFDF5", color: "#059669" }}>
                                  In Stock
                                </span>
                              </div>
                              <div style={{ fontSize: "11.5px", color: "#64748B", marginTop: "2px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#2563EB", background: "#F1F5F9", padding: "1px 5px", borderRadius: "4px" }}>
                                  {asset.AssetTagID}
                                </span>
                                <span>•</span>
                                <span>{asset.Category}</span>
                                <span>•</span>
                                <span>{asset.LocationName || asset.Location || "Main Bay"}</span>
                                {asset.Model && (
                                  <>
                                    <span>•</span>
                                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{asset.Model}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span
                              style={{
                                background: isSelected ? "#007ED5" : "#EFF6FF",
                                color: isSelected ? "#FFFFFF" : "#007ED5",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "4px 12px",
                                borderRadius: "14px",
                              }}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* STEP 3: ASSIGNMENT DETAILS & REVIEW                             */}
              {/* ============================================================== */}
              {activeStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "14.5px", fontWeight: 700, color: "#0F172A" }}>
                      03 — Assignment Details & Handover Notes
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                      Review recipient, asset pairing, and specify allocation context
                    </div>
                  </div>

                  {/* Summary Pairing Card */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "12px",
                      padding: "14px",
                      borderRadius: "12px",
                      background: "#F8FAFC",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    {/* Recipient summary */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                        Recipient Employee
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        <Avatar name={selectedEmployee?.DisplayName || "Employee"} size={28} color="colorful" />
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                            {selectedEmployee?.DisplayName}
                          </div>
                          <div style={{ fontSize: "11px", color: "#64748B" }}>
                            {selectedEmployee?.EmployeeId ? `${selectedEmployee.EmployeeId} · ` : ""}
                            {selectedEmployee?.Department}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Asset summary */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                        Allocated Hardware
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                        <AssetIcon category={selectedAsset?.Category} name={selectedAsset?.AssetName} size="sm" />
                        <div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#0F172A" }}>
                            {selectedAsset?.AssetName}
                          </div>
                          <div style={{ fontSize: "11px", color: "#2563EB", fontFamily: "monospace", fontWeight: 600 }}>
                            {selectedAsset?.AssetTagID} · {selectedAsset?.Category}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                        Assignment Purpose / Classification <span style={{ color: "#DC2626" }}>*</span>
                      </label>
                      <Dropdown
                        mountNode={mountNode}
                        value={purpose}
                        selectedOptions={[purpose]}
                        onOptionSelect={(_, d) => setPurpose(d.optionValue || ASSIGNMENT_PURPOSES[0])}
                        style={{ width: "100%" }}
                      >
                        {ASSIGNMENT_PURPOSES.map((p) => (
                          <Option key={p} value={p}>
                            {p}
                          </Option>
                        ))}
                      </Dropdown>
                    </div>

                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                        Handover & Custody Notes <span style={{ fontWeight: 400, color: "#64748B" }}>(Optional)</span>
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(_, data) => setNotes(data.value)}
                        placeholder="e.g. Issued with power adapter, HDMI cable, and laptop carrying bag. Acknowledged in good physical order..."
                        rows={3}
                        style={{ width: "100%" }}
                      />
                    </div>
                  </div>
                </div>
              )}
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
          {/* Back or Cancel */}
          {activeStep > 1 ? (
            <button
              type="button"
              onClick={() => setActiveStep((prev) => (prev - 1) as 1 | 2)}
              disabled={submitting}
              style={{
                background: "#F8FAFC",
                color: "#475569",
                border: "1px solid #CBD5E1",
                borderRadius: "20px",
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              <ArrowLeftRegular style={{ fontSize: 14 }} />
              <span>Back</span>
            </button>
          ) : (
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
                padding: "8px 18px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Cancel
            </button>
          )}

          {/* Next or Submit */}
          {activeStep === 1 ? (
            <button
              type="button"
              onClick={() => setActiveStep(2)}
              disabled={!selectedEmployee}
              style={{
                background: selectedEmployee ? "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)" : "#CBD5E1",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "20px",
                padding: "9px 22px",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: selectedEmployee ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: selectedEmployee ? "0 2px 8px rgba(0, 126, 213, 0.3)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <span>Next: Select Asset</span>
              <ArrowRightRegular style={{ fontSize: 14 }} />
            </button>
          ) : activeStep === 2 ? (
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              disabled={!selectedAsset}
              style={{
                background: selectedAsset ? "linear-gradient(135deg, #007ED5 0%, #0066B3 100%)" : "#CBD5E1",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "20px",
                padding: "9px 22px",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: selectedAsset ? "pointer" : "not-allowed",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: selectedAsset ? "0 2px 8px rgba(0, 126, 213, 0.3)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <span>Next: Assignment Details</span>
              <ArrowRightRegular style={{ fontSize: 14 }} />
            </button>
          ) : (
            <button
              type="button"
              id="btn-submit-assign-asset"
              onClick={handleAssign}
              disabled={!selectedEmployee || !selectedAsset || submitting || loading}
              style={{
                background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "20px",
                padding: "9px 26px",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: !selectedEmployee || !selectedAsset || submitting || loading ? "not-allowed" : "pointer",
                opacity: !selectedEmployee || !selectedAsset ? 0.6 : 1,
                boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s ease",
              }}
            >
              {submitting ? (
                <Spinner size="tiny" />
              ) : (
                <>
                  <CheckmarkRegular style={{ fontSize: 16 }} />
                  <span>Confirm & Assign Asset</span>
                </>
              )}
            </button>
          )}
        </div>
      </Drawer>
      {portal}
    </>
  );
};

export default AssignAssetToEmployeeDialog;
