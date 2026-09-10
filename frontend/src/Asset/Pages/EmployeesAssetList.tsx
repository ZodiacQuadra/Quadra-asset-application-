import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Spinner,
  Text,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
} from "@fluentui/react-components";
import {
  SearchRegular,
  ChevronRightRegular,
  BuildingRegular,
  PeopleTeamRegular,
  ChevronDownRegular,
  DismissRegular,
} from "@fluentui/react-icons";
import {
  getAssetModuleEmployees,
  AssetModuleEmployee,
} from "../Services/AssetEmployeeService";
import { getAssetInventoryList, AssetInventoryRecord } from "../Services/AssetInventoryService";
import { CANONICAL_BRANCHES, CANONICAL_DEPARTMENTS } from "../../Common/EnterpriseConstants";

const EmployeesAssetList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AssetModuleEmployee[]>([]);
  const [inventory, setInventory] = useState<AssetInventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDept, setSelectedDept] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [empResult, assets] = await Promise.all([
        getAssetModuleEmployees(1, 100, null, null),
        getAssetInventoryList(),
      ]);
      setUsers(empResult.users);
      setInventory(assets);
    } catch (err) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const employeeAssetCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    inventory.forEach((asset) => {
      if (asset.AssignedToUserID) {
        counts[asset.AssignedToUserID] = (counts[asset.AssignedToUserID] || 0) + 1;
      }
    });
    return counts;
  }, [inventory]);

  // Derive unique branches and departments for dropdowns
  const branchOptions = useMemo(() => {
    const fromUsers = users.map((u) => u.Branch).filter(Boolean) as string[];
    const combined = Array.from(new Set([...CANONICAL_BRANCHES, ...fromUsers]));
    return combined;
  }, [users]);

  const deptOptions = useMemo(() => {
    const fromUsers = users.map((u) => u.Department).filter(Boolean) as string[];
    const combined = Array.from(new Set([...CANONICAL_DEPARTMENTS, ...fromUsers]));
    return combined;
  }, [users]);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (selectedBranch) {
      const branchLower = selectedBranch.toLowerCase();
      list = list.filter((u) => {
        const uBranch = (u.Branch || "Coimbatore").toLowerCase();
        return uBranch === branchLower;
      });
    }
    if (selectedDept) {
      const deptLower = selectedDept.toLowerCase();
      list = list.filter((u) => {
        const uDept = (u.Department || "").toLowerCase();
        return uDept === deptLower;
      });
    }
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (u) =>
          (u.DisplayName || "").toLowerCase().includes(term) ||
          (u.JobTitle && u.JobTitle.toLowerCase().includes(term)) ||
          (u.Department && u.Department.toLowerCase().includes(term)) ||
          (u.Branch && u.Branch.toLowerCase().includes(term)) ||
          (u.Mail && u.Mail.toLowerCase().includes(term))
      );
    }
    return list;
  }, [users, search, selectedBranch, selectedDept]);

  return (
    <div style={{ width: "100%", padding: "4px 0 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Page Header */}
      <div>
        <h1
          style={{
            margin: 0,
            fontSize: "26px",
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.02em",
          }}
        >
          Employee List
        </h1>
        <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "#64748b" }}>
          Browse and manage employee asset assignments across corporate branches and departments
        </p>
      </div>

      {/* Search Bar with Integrated Branch & Department Dropdown Buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "14px",
          padding: "4px 8px 4px 16px",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        {/* Search input section */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 240px", minWidth: "200px" }}>
          <SearchRegular style={{ color: "#94a3b8", fontSize: "18px", flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employees by name, title, department, email..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              width: "100%",
              fontSize: "13.5px",
              color: "#0f172a",
              height: "40px",
            }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              style={{
                border: "none",
                background: "transparent",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "16px",
                padding: "2px 6px",
              }}
            >
              ×
            </button>
          )}
        </div>

        <div style={{ width: "1px", height: "24px", background: "#e2e8f0", flexShrink: 0 }} />

        {/* Branch Selection Dropdown Button */}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: selectedBranch ? "#EFF6FF" : "#F8FAFC",
                border: `1px solid ${selectedBranch ? "#007ED5" : "#E2E8F0"}`,
                borderRadius: "10px",
                height: "36px",
                padding: "0 12px",
                fontSize: "13px",
                fontWeight: 500,
                color: selectedBranch ? "#007ED5" : "#475569",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#93C5FD")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = selectedBranch ? "#007ED5" : "#E2E8F0")}
            >
              <BuildingRegular style={{ fontSize: "15px", color: selectedBranch ? "#007ED5" : "#64748B" }} />
              <span>{selectedBranch || "All Branches"}</span>
              <ChevronDownRegular style={{ fontSize: "12px", opacity: 0.7 }} />
            </button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList style={{ maxHeight: "300px", overflowY: "auto", minWidth: "180px" }}>
              <MenuItem onClick={() => setSelectedBranch("")}>
                All Branches
              </MenuItem>
              {branchOptions.map((b) => (
                <MenuItem key={b} onClick={() => setSelectedBranch(b)}>
                  {b}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>

        {/* Dept Selection Dropdown Button */}
        <Menu>
          <MenuTrigger disableButtonEnhancement>
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                background: selectedDept ? "#EFF6FF" : "#F8FAFC",
                border: `1px solid ${selectedDept ? "#007ED5" : "#E2E8F0"}`,
                borderRadius: "10px",
                height: "36px",
                padding: "0 12px",
                fontSize: "13px",
                fontWeight: 500,
                color: selectedDept ? "#007ED5" : "#475569",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#93C5FD")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = selectedDept ? "#007ED5" : "#E2E8F0")}
            >
              <PeopleTeamRegular style={{ fontSize: "15px", color: selectedDept ? "#007ED5" : "#64748B" }} />
              <span style={{ maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis" }}>
                {selectedDept || "All Departments"}
              </span>
              <ChevronDownRegular style={{ fontSize: "12px", opacity: 0.7 }} />
            </button>
          </MenuTrigger>
          <MenuPopover>
            <MenuList style={{ maxHeight: "300px", overflowY: "auto", minWidth: "240px" }}>
              <MenuItem onClick={() => setSelectedDept("")}>
                All Departments
              </MenuItem>
              {deptOptions.map((d) => (
                <MenuItem key={d} onClick={() => setSelectedDept(d)}>
                  {d}
                </MenuItem>
              ))}
            </MenuList>
          </MenuPopover>
        </Menu>

        {/* Reset filters button */}
        {(selectedBranch || selectedDept) && (
          <button
            type="button"
            onClick={() => {
              setSelectedBranch("");
              setSelectedDept("");
            }}
            title="Reset branch & department filters"
            style={{
              border: "none",
              background: "#F1F5F9",
              color: "#64748B",
              borderRadius: "8px",
              height: "36px",
              padding: "0 10px",
              fontSize: "12px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <DismissRegular style={{ fontSize: "12px" }} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Employee Cards List */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <Spinner label="Loading employee directory..." />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "48px 24px",
            textAlign: "center",
            border: "1px solid #e2e8f0",
          }}
        >
          <Text style={{ color: "#64748b", fontSize: "15px" }}>No employees found matching the filter criteria.</Text>
          {(search || selectedBranch || selectedDept) && (
            <div style={{ marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedBranch("");
                  setSelectedDept("");
                }}
                style={{
                  background: "#007ED5",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filteredUsers.map((user) => {
            const count = employeeAssetCounts[user.ID] || 0;
            return (
              <div
                key={user.ID}
                onClick={() => navigate(`/Asset/employees/${user.ID}`)}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #f1f5f9",
                  padding: "18px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(0, 0, 0, 0.06)";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.02)";
                  e.currentTarget.style.borderColor = "#f1f5f9";
                }}
              >
                {/* Left: Avatar + Details */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      width: "52px",
                      height: "52px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #4F80E1 0%, #9B72CF 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 2px 8px rgba(79, 128, 225, 0.25)",
                      color: "#ffffff",
                      fontSize: "18px",
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {user.DisplayName.trim().split(/\s+/).map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "15.5px",
                        fontWeight: 600,
                        color: "#0f172a",
                        marginBottom: "3px",
                      }}
                    >
                      {user.DisplayName}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#64748b",
                        marginBottom: "2px",
                      }}
                    >
                      {user.JobTitle || "Team Member"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12px",
                        color: "#64748b",
                        marginTop: "2px",
                      }}
                    >
                      <span
                        style={{
                          background: "#F1F5F9",
                          padding: "1px 7px",
                          borderRadius: "4px",
                          fontWeight: 500,
                          color: "#475569",
                          fontSize: "11.5px",
                        }}
                      >
                        {user.Branch || "Coimbatore"}
                      </span>
                      <span>•</span>
                      <span>{user.Department || "General"}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Asset Count Pill + Chevron */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div
                    style={{
                      background: "#eff6ff",
                      color: "#2563eb",
                      fontSize: "12.5px",
                      fontWeight: 600,
                      padding: "6px 14px",
                      borderRadius: "9999px",
                      letterSpacing: "0.01em",
                    }}
                  >
                    {count} {count === 1 ? "Asset" : "Assets"}
                  </div>
                  <ChevronRightRegular style={{ fontSize: "16px", color: "#94a3b8" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeesAssetList;
