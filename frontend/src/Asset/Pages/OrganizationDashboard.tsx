import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Text,
  Badge,
  Spinner,
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableBody,
  TableCell,
  Drawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Field,
  Dropdown,
  Option,
  Toast,
  ToastTitle,
  Toaster,
  useToastController,
  useId,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  AddRegular,
  Dismiss24Regular,
  BuildingRegular,
  BoxRegular,
  PeopleTeamRegular,
  LocationRegular,
  ShieldCheckmarkRegular,
  ArrowTrendingRegular,
  CheckmarkCircleRegular,
} from "@fluentui/react-icons";
import { useAuth } from "../../Auth/AuthProvider";
import { useThemedMountNode } from "../../Common/useThemedMountNode";
import { getAssetCategories, AssetCategoryRecord } from "../Services/AssetInventoryService";
import {
  getAssetHRRequests,
  getEligibleHRApplicants,
  createAssetHRRequest,
  AssetHRRequestRecord,
  EligibleApplicant,
  HRRequestStatus,
} from "../Services/AssetHRRequestService";

const STATUS_COLOR: Record<HRRequestStatus, "warning" | "informative" | "success" | "danger"> = {
  Pending: "warning",
  InProgress: "informative",
  Completed: "success",
  Rejected: "danger",
  Draft: "warning",
};

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

const DEPARTMENT_FLEET = [
  { name: "Engineering & Tech", total: 580, inUse: 520, value: "₹2.15 Cr", percent: 40, color: "#007ED5" },
  { name: "Product & UI/UX Design", total: 240, inUse: 215, value: "₹92.4 L", percent: 16.5, color: "#8764B8" },
  { name: "Sales & Account Mgmt", total: 260, inUse: 230, value: "₹88.5 L", percent: 18, color: "#10B981" },
  { name: "Operations & HR", total: 210, inUse: 185, value: "₹74.0 L", percent: 14.5, color: "#F59E0B" },
  { name: "Finance & Legal", total: 160, inUse: 140, value: "₹54.1 L", percent: 11, color: "#0284C7" },
];

const BRANCH_ALLOCATIONS = [
  { branch: "Chennai Corporate HQ", total: 820, inUse: 740, buffer: 80, address: "OMR IT Corridor, Chennai" },
  { branch: "Bangalore Innovation Center", total: 380, inUse: 330, buffer: 50, address: "Whitefield Tech Park, Bangalore" },
  { branch: "Hyderabad Development Hub", total: 150, inUse: 125, buffer: 25, address: "HITEC City, Hyderabad" },
  { branch: "Remote & Distributed Workforce", total: 100, inUse: 95, buffer: 5, address: "PAN-India Remote Deployments" },
];

const OrganizationDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { mountNode, portal } = useThemedMountNode();
  const toasterId = useId("organization-dashboard-toaster");
  const { dispatchToast } = useToastController(toasterId);

  const [requests, setRequests] = useState<AssetHRRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [categories, setCategories] = useState<AssetCategoryRecord[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [eligibleApplicants, setEligibleApplicants] = useState<EligibleApplicant[]>([]);
  const [selectedApplicantIds, setSelectedApplicantIds] = useState<string[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAssetHRRequests();
      setRequests(data);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load HR requests"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openForm = async () => {
    setFormOpen(true);
    setSelectedCategoryIds([]);
    setSelectedApplicantIds([]);
    setEligibleApplicants([]);
    try {
      const cats = await getAssetCategories("IT");
      setCategories(cats);
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to load categories"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    }
  };

  useEffect(() => {
    if (!formOpen) return;
    if (selectedCategoryIds.length === 0) {
      setEligibleApplicants([]);
      setSelectedApplicantIds([]);
      return;
    }
    setLoadingApplicants(true);
    getEligibleHRApplicants(selectedCategoryIds)
      .then((applicants) => {
        setEligibleApplicants(applicants);
        setSelectedApplicantIds((prev) => prev.filter((id) => applicants.some((a) => a.ApplicantID === id)));
      })
      .catch((error) => {
        dispatchToast(
          <Toast>
            <ToastTitle>{error instanceof Error ? error.message : "Failed to load eligible employees"}</ToastTitle>
          </Toast>,
          { intent: "error" }
        );
      })
      .finally(() => setLoadingApplicants(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryIds, formOpen]);

  const canSubmit = selectedCategoryIds.length > 0 && selectedApplicantIds.length > 0;

  const handleSubmit = async () => {
    if (!currentUser?.userID || !canSubmit) return;
    setSubmitting(true);
    try {
      const applicants = eligibleApplicants
        .filter((a) => selectedApplicantIds.includes(a.ApplicantID))
        .map((a) => ({
          ApplicantID: a.ApplicantID,
          ApplicantName: a.ApplicantName,
          ApplicantMailID: a.ApplicantMailID,
          JoiningDate: a.JoiningDate,
        }));

      const result = await createAssetHRRequest({
        requestedByUserId: currentUser.userID,
        requestedByName: currentUser.displayName,
        requestedByMail: currentUser.email,
        applicants,
        categoryIds: selectedCategoryIds,
      });

      dispatchToast(
        <Toast>
          <ToastTitle>Request {result.HRRequestID} submitted successfully</ToastTitle>
        </Toast>,
        { intent: "success" }
      );
      setFormOpen(false);
      await loadData();
    } catch (error) {
      dispatchToast(
        <Toast>
          <ToastTitle>{error instanceof Error ? error.message : "Failed to submit request"}</ToastTitle>
        </Toast>,
        { intent: "error" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Toaster toasterId={toasterId} />
      {portal}
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
        {/* Header with Navigation & New Requisition */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <button
                onClick={() => navigate("/Asset/hr")}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748B",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                }}
              >
                <ArrowLeftRegular style={{ fontSize: "18px" }} />
              </button>
              <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 700, color: "#0F172A" }}>
                Organization Fleet & Operations
              </h1>
            </div>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748B" }}>
              Enterprise-level overview of hardware deployment, department distribution, and facility allocations
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => navigate("/Asset/reports")}
              style={{
                background: "#FFFFFF",
                border: "1px solid #CBD5E1",
                borderRadius: "9999px",
                padding: "8px 18px",
                fontSize: "13.5px",
                fontWeight: 600,
                color: "#1E293B",
                cursor: "pointer",
              }}
            >
              Detailed Reports
            </button>
            <button
              onClick={openForm}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#007ED5",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "9999px",
                padding: "8px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0, 126, 213, 0.25)",
              }}
            >
              <AddRegular style={{ fontSize: "16px" }} />
              <span>New Organization Request</span>
            </button>
          </div>
        </div>

        {/* Top 4 Organization Executive Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          {/* Card 1: Total Fleet */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "20px 24px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                Total Fleet Units
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#EFF6FF", color: "#007ED5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BoxRegular />
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
              1,450
            </div>
            <div style={{ fontSize: "12px", color: "#10B981", fontWeight: 600, marginTop: "4px" }}>
              +65 units added this quarter
            </div>
          </div>

          {/* Card 2: Active Utilization */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "20px 24px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                Active Deployed Fleet
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#ECFDF5", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckmarkCircleRegular />
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
              1,210 <span style={{ fontSize: "16px", color: "#64748B", fontWeight: 500 }}>/ 83.4%</span>
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
              Assigned to active employees
            </div>
          </div>

          {/* Card 3: Reserve Stock */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "20px 24px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                Onboarding Buffer
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#FFFBEB", color: "#D97706", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheckmarkRegular />
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#D97706", marginTop: "8px" }}>
              165 <span style={{ fontSize: "16px", color: "#64748B", fontWeight: 500 }}>units</span>
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
              Ready in IT reserve depots
            </div>
          </div>

          {/* Card 4: Book Valuation */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "16px",
              padding: "20px 24px",
              border: "1px solid #E2E8F0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
                Total Fleet Book Value
              </span>
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#FAF5FF", color: "#9333EA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowTrendingRegular />
              </div>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#0F172A", marginTop: "8px" }}>
              ₹5.24 Cr
            </div>
            <div style={{ fontSize: "12px", color: "#64748B", marginTop: "4px" }}>
              Current corporate asset valuation
            </div>
          </div>
        </div>

        {/* Section 2: Department-wise Fleet Distribution & Branch Allocations */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))", gap: "20px" }}>
          {/* Department Fleet Breakdown */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              border: "1px solid #E2E8F0",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0F172A" }}>
                  Department-Wise Fleet Allocation
                </h2>
                <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "2px" }}>
                  Hardware distribution across corporate departments
                </div>
              </div>
              <PeopleTeamRegular style={{ fontSize: "20px", color: "#007ED5" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {DEPARTMENT_FLEET.map((dept) => (
                <div key={dept.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "13px" }}>
                    <span style={{ fontWeight: 600, color: "#1E293B" }}>{dept.name}</span>
                    <span style={{ color: "#64748B" }}>
                      <strong>{dept.inUse}</strong> / {dept.total} units ({dept.percent}%) • <span style={{ color: "#0F172A", fontWeight: 600 }}>{dept.value}</span>
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "#F1F5F9", borderRadius: "9999px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${dept.percent * 2}%`,
                        background: dept.color,
                        borderRadius: "9999px",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Branch & Facility Allocations */}
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: "20px",
              border: "1px solid #E2E8F0",
              padding: "24px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0F172A" }}>
                  Branch & Campus Allocations
                </h2>
                <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "2px" }}>
                  Physical office facilities and remote workforce deployment
                </div>
              </div>
              <BuildingRegular style={{ fontSize: "20px", color: "#007ED5" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {BRANCH_ALLOCATIONS.map((branch) => (
                <div
                  key={branch.branch}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    background: "#F8FAFC",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#0F172A" }}>
                      {branch.branch}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748B", marginTop: "2px" }}>
                      {branch.address}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: "#007ED5" }}>
                      {branch.total} assets
                    </div>
                    <div style={{ fontSize: "11.5px", color: "#10B981" }}>
                      {branch.inUse} deployed • {branch.buffer} buffer
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: Organization Requisitions & Onboarding Pipeline */}
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: "20px",
            border: "1px solid #E2E8F0",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#0F172A" }}>
                Active Onboarding Requisitions & Batches
              </h2>
              <div style={{ fontSize: "12.5px", color: "#64748B", marginTop: "2px" }}>
                Cohort hardware requisitions submitted for incoming hires and department expansions
              </div>
            </div>
            <Badge appearance="tint" color="informative">
              {requests.length} Requests Logged
            </Badge>
          </div>

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
              <Spinner label="Loading organization requisitions..." />
            </div>
          ) : requests.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
              No organization requests logged yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Request ID</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Requested By</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Applicants</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Requested Date</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "#64748B", fontSize: "12px", textTransform: "uppercase" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.ID} style={{ borderBottom: "1px solid #F1F5F9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0F172A" }}>{r.HRRequestID}</td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>{r.RequestedUserName ?? "HR Department"}</td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>{r.ApplicantCount} employee{r.ApplicantCount === 1 ? "" : "s"}</td>
                      <td style={{ padding: "12px 16px", color: "#64748B" }}>{formatDate(r.CreatedAt)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            background: r.Status === "Completed" ? "#ECFDF5" : "#EFF6FF",
                            color: r.Status === "Completed" ? "#10B981" : "#2563EB",
                            borderRadius: "9999px",
                            padding: "3px 12px",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {r.Status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => navigate(`/Asset/hr-requests/${r.ID}`)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#007ED5",
                            fontWeight: 600,
                            cursor: "pointer",
                            fontSize: "13px",
                          }}
                        >
                          View Batch Details →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add New Request Drawer */}
      <Drawer
        type="overlay"
        separator
        open={formOpen}
        position="end"
        onOpenChange={(_, data) => setFormOpen(data.open)}
        style={{ width: "50vw", minWidth: "480px" }}
      >
        <DrawerHeader>
          <DrawerHeaderTitle
            action={
              <Button appearance="subtle" aria-label="Close" icon={<Dismiss24Regular />} onClick={() => setFormOpen(false)} />
            }
          >
            Create Organization Asset Request
          </DrawerHeaderTitle>
        </DrawerHeader>
        <DrawerBody>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", paddingTop: "12px" }}>
            <Field label="Categories to Request" required hint="Select one or more hardware categories">
              <Dropdown
                multiselect
                placeholder="Select categories"
                mountNode={mountNode}
                selectedOptions={selectedCategoryIds}
                onOptionSelect={(_, d) => setSelectedCategoryIds(d.selectedOptions)}
              >
                {categories.map((c) => (
                  <Option key={c.ID} value={c.ID}>
                    {c.CategoryName}
                  </Option>
                ))}
              </Dropdown>
            </Field>

            <Field label="Eligible Cohort Employees" required hint="Employees awaiting asset assignment">
              {loadingApplicants ? (
                <Spinner size="small" label="Checking eligible employees..." />
              ) : eligibleApplicants.length === 0 ? (
                <Text style={{ color: "#64748B", fontSize: "13px" }}>
                  {selectedCategoryIds.length === 0 ? "Select categories above first" : "No unassigned employees found for these categories."}
                </Text>
              ) : (
                <Dropdown
                  multiselect
                  placeholder="Select employees"
                  mountNode={mountNode}
                  selectedOptions={selectedApplicantIds}
                  onOptionSelect={(_, d) => setSelectedApplicantIds(d.selectedOptions)}
                >
                  {eligibleApplicants.map((a) => (
                    <Option key={a.ApplicantID} value={a.ApplicantID} text={`${a.ApplicantName} (${a.ApplicantMailID})`}>
                      {a.ApplicantName} ({a.ApplicantMailID})
                    </Option>
                  ))}
                </Dropdown>
              )}
            </Field>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <Button appearance="subtle" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button
                appearance="primary"
                disabled={!canSubmit || submitting}
                onClick={handleSubmit}
                style={{ background: "#007ED5" }}
              >
                {submitting ? <Spinner size="tiny" /> : "Submit Request"}
              </Button>
            </div>
          </div>
        </DrawerBody>
      </Drawer>
    </>
  );
};

export default OrganizationDashboard;
