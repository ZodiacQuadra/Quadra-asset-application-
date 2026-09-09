import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner, Text } from "@fluentui/react-components";
import { SearchRegular, ChevronRightRegular } from "@fluentui/react-icons";
import {
  getAssetModuleEmployees,
  AssetModuleEmployee,
} from "../Services/AssetEmployeeService";
import { getAssetInventoryList, AssetInventoryRecord } from "../Services/AssetInventoryService";

const EmployeesAssetList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AssetModuleEmployee[]>([]);
  const [inventory, setInventory] = useState<AssetInventoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) =>
        (u.DisplayName || "").toLowerCase().includes(term) ||
        (u.JobTitle && u.JobTitle.toLowerCase().includes(term)) ||
        (u.Department && u.Department.toLowerCase().includes(term)) ||
        (u.Mail && u.Mail.toLowerCase().includes(term))
    );
  }, [users, search]);

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

      {/* Search Bar */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            left: "16px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#94a3b8",
            display: "flex",
            alignItems: "center",
            pointerEvents: "none",
          }}
        >
          <SearchRegular style={{ fontSize: "18px" }} />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees by name, title, department, email..."
          style={{
            width: "100%",
            height: "44px",
            padding: "0 44px 0 44px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            fontSize: "14px",
            color: "#0f172a",
            outline: "none",
            boxSizing: "border-box",
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.02)",
            transition: "border-color 0.2s, box-shadow 0.2s",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#007ed5";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0, 126, 213, 0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.02)";
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            style={{
              position: "absolute",
              right: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              border: "none",
              background: "transparent",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "16px",
              padding: "4px",
            }}
          >
            ×
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
          <Text style={{ color: "#64748b", fontSize: "15px" }}>No employees found matching "{search}".</Text>
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
                        fontSize: "12px",
                        color: "#94a3b8",
                      }}
                    >
                      {user.Department || "General"}
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
