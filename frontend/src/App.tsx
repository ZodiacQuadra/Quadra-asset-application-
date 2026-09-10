import React from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./Auth/AuthProvider";
import AssetShell from "./AssetShell";
import ErrorBoundary from "./Common/ErrorBoundary";
import AdminDashboard from "./Asset/Pages/AdminDashboard";
import AssetInventory from "./Asset/Pages/AssetInventory";
import AssetDetail from "./Asset/Pages/AssetDetail";
import EmployeeMyAssets from "./Asset/Pages/EmployeeMyAssets";
import EmployeeMyAssetDetail from "./Asset/Pages/EmployeeMyAssetDetail";
import EmployeesAssetList from "./Asset/Pages/EmployeesAssetList";
import EmployeeAssetDetail from "./Asset/Pages/EmployeeAssetDetail";
import NewAssetRequest from "./Asset/Pages/NewAssetRequest";
import MyAssetRequests from "./Asset/Pages/MyAssetRequests";
import AdminApproval from "./Asset/Pages/AdminApproval";
import ManagerApproval from "./Asset/Pages/ManagerApproval";
import AssetManagerDashboard from "./Asset/Pages/AssetManagerDashboard";
import AssetReports from "./Asset/Pages/AssetReports";
import AssetConfiguration from "./Management/Pages/AssetConfiguration";
import AssetSLAConfiguration from "./Management/Pages/AssetSLAConfiguration";
import NonITAssets from "./Asset/Pages/NonITAssets";
import NonITAssetDetail from "./Asset/Pages/NonITAssetDetail";
import AssetHandoverRequestForm from "./Asset/Pages/AssetHandoverRequestForm";
import HRDashboard from "./Asset/Pages/HRDashboard";
import HRMyDashboard from "./Asset/Pages/HRMyDashboard";
import HRRequestFullDetail from "./Asset/Pages/HRRequestFullDetail";
import OrganizationDashboard from "./Asset/Pages/OrganizationDashboard";
import SearchAsset from "./Asset/Pages/SearchAsset";
import "./App.css";

function RoleDashboardRedirect() {
  const { activeRole } = useAuth();
  switch (activeRole) {
    case "manager":
      return <Navigate to="/Asset/manager-dashboard" replace />;
    case "hr":
      return <Navigate to="/Asset/hr" replace />;
    case "employee":
      return <Navigate to="/Asset/my-assets" replace />;
    default:
      return <Navigate to="/Asset/dashboard" replace />;
  }
}

function AssetRoutes() {
  return (
    <AssetShell>
      <Routes>
        <Route path="/" element={<RoleDashboardRedirect />} />
        <Route path="/Asset" element={<RoleDashboardRedirect />} />
        <Route path="/Home" element={<RoleDashboardRedirect />} />
        <Route path="/Asset/home" element={<RoleDashboardRedirect />} />
        <Route path="/Asset/dashboard" element={<AdminDashboard />} />
        <Route path="/Asset/inventory" element={<AssetInventory />} />
        <Route path="/Asset/inventory/:id" element={<EmployeeMyAssetDetail />} />
        <Route path="/Asset/:id" element={<EmployeeMyAssetDetail />} />
        <Route path="/Asset/my-assets" element={<EmployeeMyAssets />} />
        <Route path="/Asset/my-assets/:id" element={<EmployeeMyAssetDetail />} />
        <Route path="/Asset/my-assets/:assetId" element={<EmployeeMyAssetDetail />} />
        <Route path="/Asset/my-assets/handover" element={<AssetHandoverRequestForm />} />
        <Route path="/Asset/employees" element={<EmployeesAssetList />} />
        <Route path="/Asset/employees/:userId" element={<EmployeeAssetDetail />} />
        <Route path="/Asset/employees/:id" element={<EmployeeAssetDetail />} />
        <Route path="/Asset/new-request" element={<NewAssetRequest />} />
        <Route path="/Asset/my-requests" element={<MyAssetRequests />} />
        <Route path="/Asset/admin-approval" element={<AdminApproval />} />
        <Route path="/Asset/manager-approval" element={<ManagerApproval />} />
        <Route path="/Asset/manager-dashboard" element={<AssetManagerDashboard />} />
        <Route path="/Asset/reports" element={<AssetReports />} />
        <Route path="/Asset/configuration" element={<AssetConfiguration />} />
        <Route path="/Asset/non-it-assets" element={<Navigate to="/Asset/inventory?type=non-it" replace />} />
        <Route path="/Asset/non-it-assets/:id" element={<NonITAssetDetail />} />
        <Route path="/Asset/handover" element={<AssetHandoverRequestForm />} />
        <Route path="/Asset/hr" element={<HRDashboard />} />
        <Route path="/Asset/hr/my-dashboard" element={<HRMyDashboard />} />
        <Route path="/Asset/hr-requests/:id" element={<HRRequestFullDetail />} />
        <Route path="/Asset/organization" element={<OrganizationDashboard />} />
        <Route path="/Asset/search" element={<SearchAsset />} />
        <Route path="*" element={<RoleDashboardRedirect />} />
      </Routes>
    </AssetShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <HashRouter>
          <AssetRoutes />
        </HashRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
