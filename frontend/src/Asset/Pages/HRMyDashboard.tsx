import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Spinner } from "@fluentui/react-components";
import { ArrowLeftRegular, BuildingMultipleRegular, ClipboardTaskRegular } from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { AssetHRRequestRecord, getAssetHRRequests, HRRequestStatus } from "../Services/AssetHRRequestService";

const statusColor: Record<HRRequestStatus, "warning" | "informative" | "success" | "danger"> = {
  Pending: "warning",
  InProgress: "informative",
  Completed: "success",
  Rejected: "danger",
};

const HRMyDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<AssetHRRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAssetHRRequests(currentUser?.userID)
      .then((data) => active && setRequests(data))
      .catch(() => active && setRequests([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [currentUser?.userID]);

  const counts = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.Status === "Pending").length,
      inProgress: requests.filter((r) => r.Status === "InProgress").length,
      completed: requests.filter((r) => r.Status === "Completed").length,
    }),
    [requests]
  );

  return (
    <div
      style={{
        padding: "28px 36px",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        maxWidth: "1280px",
        margin: "0 auto",
      }}
    >
      <button
        onClick={() => navigate("/Asset/hr")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          color: "#64748B",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          padding: 0,
          width: "fit-content",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#007ED5")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
      >
        <ArrowLeftRegular style={{ fontSize: "16px" }} />
        <span>Back to HR Command Center</span>
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#0F172A" }}>
            My HR Dashboard
          </h1>
          <div style={{ fontSize: "14px", color: "#64748B", marginTop: "4px" }}>
            Track organization requests assigned to you and their current progress.
          </div>
        </div>

        <button
          onClick={() => navigate("/Asset/organization")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#FFFFFF",
            border: "1px solid #CBD5E1",
            color: "#1E293B",
            borderRadius: "9999px",
            padding: "8px 20px",
            fontSize: "13.5px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F1F5F9")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#FFFFFF")}
        >
          <BuildingMultipleRegular style={{ fontSize: "16px", color: "#0B8484" }} />
          <span>Organization View</span>
        </button>
      </div>

      {/* 4 Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {[
          { label: "Total Requests", value: counts.total, bg: "#EFF6FF", color: "#2563EB" },
          { label: "Pending", value: counts.pending, bg: "#FEF3C7", color: "#D97706" },
          { label: "In Progress", value: counts.inProgress, bg: "#F3E8FF", color: "#9333EA" },
          { label: "Completed", value: counts.completed, bg: "#ECFDF5", color: "#10B981" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: "#FFFFFF",
              border: "1px solid #E2E8F0",
              borderRadius: "16px",
              padding: "20px 24px",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
            }}
          >
            <div style={{ fontSize: "13px", color: "#64748B", fontWeight: 600 }}>{item.label}</div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
              {item.value}
            </div>
            <div
              style={{
                height: "4px",
                width: "36px",
                borderRadius: "9999px",
                background: item.color,
                marginTop: "12px",
              }}
            />
          </div>
        ))}
      </div>

      {/* Table of requests */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "20px",
          padding: "24px 28px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "#F1F5F9",
              color: "#334155",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
            }}
          >
            <ClipboardTaskRegular />
          </div>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#0F172A" }}>
            Assigned HR Requisitions
          </h2>
        </div>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <Spinner label="Loading HR requests..." />
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#64748B", fontSize: "14px" }}>
            No HR requests are currently assigned to you.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {requests.map((request) => (
              <div
                key={request.ID || request.HRRequestID}
                onClick={() => navigate(`/Asset/hr-requests/${request.ID || request.HRRequestID}`)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.4fr 1fr 1fr auto",
                  gap: "16px",
                  alignItems: "center",
                  borderBottom: "1px solid #F1F5F9",
                  padding: "16px 8px",
                  cursor: "pointer",
                  borderRadius: "10px",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F8FAFC")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div>
                  <div style={{ fontSize: "14.5px", fontWeight: 700, color: "#1E293B" }}>
                    {request.HRRequestID}
                  </div>
                  <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "2px" }}>
                    {request.RequestedUserName || "Organization Onboarding Request"}
                  </div>
                </div>

                <div style={{ fontSize: "13px", color: "#475569" }}>
                  {request.ApplicantCount} applicant{request.ApplicantCount === 1 ? "" : "s"}
                </div>

                <div style={{ fontSize: "12.5px", color: "#94A3B8" }}>
                  {request.CreatedAt ? new Date(request.CreatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </div>

                <Badge appearance="tint" color={statusColor[request.Status] || "informative"} style={{ borderRadius: "9999px" }}>
                  {request.Status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRMyDashboard;
