import {
  Button,
  Text,
  FluentProvider,
  teamsLightTheme,
  Avatar,
  Popover,
  PopoverSurface,
  PopoverTrigger,
  Persona,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Tooltip,
} from "@fluentui/react-components";
import {
  DocumentText24Regular,
  DocumentText24Filled,
  Settings24Regular,
  Settings24Filled,
  PanelLeftRegular,
  PanelRightRegular,
  SignOutRegular,
  DocumentAdd24Regular,
  DocumentAdd24Filled,
  Edit24Regular,
  Edit24Filled,
  Options20Regular,
  Options20Filled,
  BookTemplateRegular,
  BookTemplateFilled,
  GlobeLocationRegular,
  GlobeLocationFilled,
  BuildingCheckmarkFilled,
  BuildingDesktopRegular,
  AccessibilityCheckmarkFilled,
  AccessibilityCheckmarkRegular,
  TaskListLtrRegular,
  BoxMultipleFilled,
  BoxMultipleRegular,
  CurrencyDollarRupeeFilled,
  CurrencyDollarRupeeRegular,
  LaptopFilled,
  LaptopRegular,
  DocumentBulletListFilled,
  DocumentBulletListRegular,
  ApprovalsApp24Filled,
  ApprovalsApp24Regular,
  PersonKeyFilled,
  PersonKeyRegular,
  TableSimpleInclude24Filled,
  TableSimpleInclude24Regular,
  ArrowExit24Regular,
  ArrowExit24Filled,
  GridDotsFilled,
  Briefcase20Regular, Briefcase20Filled,
  Grid20Regular,
  Grid20Filled,
  PeopleList20Regular,
  PeopleList20Filled,
  PeopleTeamRegular,
  History24Regular,
  History24Filled,
  PersonSearchRegular,
  PersonSearchFilled,
  Accessibility20Regular,
  People20Regular,
  People20Filled,
  BoxToolboxRegular,
  BoxToolboxFilled,
  Search24Regular,
  Search24Filled,
  SearchRegular
} from "@fluentui/react-icons";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Privacy from "../Privacy";
import TermsOfUse from "../TermsOfUse";
import { useAuth } from "../Auth/AuthProvider";
import { getPendingApprovals, getPendingPermissionRequests } from "../Attendance/Services/AttendanceService";
import { getPendingLeaveApprovals } from "../Services/LeaveRequestService";
import { getPendingRegularizationRequests } from "../Attendance/Services/RegularizationService";

import NewJDForm from "../Recruit/Pages/newJDForm";
import RecruitDashboard from "../Recruit/Pages/RecruitDashboard";
import React, { useEffect, useState } from "react";
import ManagementHub from "../Management/Pages/ManagementHub";
import JobPosting from "../Management/Pages/JobPosting";
import EditJDForm from "../Recruit/Pages/EditJDForm";
import JDPreviewPage from "../Recruit/Pages/PreviewJDForm";
import JDOverview from "../Recruit/Pages/JDOverview";
import HiringDashboard from "../Recruit/Pages/HiringDashboard";
import InterviewStageManager from "../Management/Pages/InterviewStageManager";
import Location from "../Management/Pages/Location";
import Department from "../Management/Pages/Department";
import PermissionMatrix from "../Management/Pages/PermissionMatrix";
import InductionTasks from "../Management/Pages/InductionTasks";

import EmployeeBGVForm from "../BackgroundVerification/Pages/EmployeeBGVForm";
import DocumentManagement from "../Management/Pages/DocumentManagement";
import ITActivitiesManagement from "../Management/Pages/ITActivitiesManagement";
import AdminActivityManagement from "../Management/Pages/AdminActivityManagement";
import FinanceActivityManagement from "../Management/Pages/FinanceActivityManagement";
import EmployeeDashboard from "../BackgroundVerification/Pages/EmployeeDashboard";
import EmployeeInductionForm from "../EmployeeInduction/EmployeeInductionForm";
import UserRoleManagement from "../Management/Pages/UserRoleManagement";
import EmployeeInductionDashboard from "../EmployeeInduction/EmployeeInductionDashboard";
import ExistingInductionForm from "../EmployeeInduction/ExistingInductionForm";
import EmployeeManagement from "../EmployeeInduction/EmployeeManagement";
import EmployeePreview from "../EmployeeInduction/EmployeePreview";
import OffboardingForm from "../Offboarding/Pages/OffboardingForm";
import EmployeeOffboardingDashboard from "../Offboarding/Pages/EmployeeOffboardingDashboard";
import ExistingOffboardingClearance from "../Offboarding/Pages/ExistingOffboardingClearance";
import LeadClearance from "../Offboarding/Pages/LeadClearance";
import LeadClearanceDashboard from "../Offboarding/Pages/LeadClearanceDashboard";
import AdminClearanceDashboard from "../Offboarding/Pages/AdminClearanceDashboard";
import FinanceClearanceDashboard from "../Offboarding/Pages/FinanceClearanceDashboard";
import ITClearanceDashboard from "../Offboarding/Pages/ITClearanceDashboard";
import ClearanceFromAdmin from "../Offboarding/Pages/AdminClearance";
import ClearanceFromFinance from "../Offboarding/Pages/FinanceClearance";
import ClearanceFromITHead from "../Offboarding/Pages/ITHeadClearance";
import BackgroundWrapper from "./BackgroundWrapper";
import LeadKtClearenceDashboard from "../Offboarding/Pages/LeadKtClearenceDashboard";
import LeadKtClearance from "../Offboarding/Pages/LeadKtClearence";
import AdminDashboard from "../Recruit/Pages/AdminDashboard";
import HRInfoDashboard from "../Recruit/Pages/HRInfoDashboard";
import HrMapping from "../Management/Pages/HrMapping";
import ShiftManagement from "../Management/Pages/ShiftManagement";
import AttendanceMonitoring from "../Attendance/Pages/AttendanceMonitoring";
import AttendanceDashboard from "../Attendance/Pages/AttendanceDashboard";
import AttendanceApprovals from "../Attendance/Pages/AttendanceApprovals";
import HolidayManagement from "../Management/Pages/HolidayManagement";
import LeavePlolicy from "../Management/Pages/LeavePolicy";
import AttendanceConfigSettings from "../Management/Pages/AttendanceConfigSettings";
import AssetConfiguration from "../Management/Pages/AssetConfiguration";
import AssetSLAConfiguration from "../Management/Pages/AssetSLAConfiguration";
import AttendanceAdminDashboard from "../Attendance/Pages/AdminDashboard";
import ManagerDashboard from "../Attendance/Pages/ManagerDashboard";
import TeamView from "../Attendance/Pages/TeamView";
import ManagerReport from "../Attendance/Pages/ManagerReport";
import AdminAttendanceReport from "../Attendance/Pages/AdminAttendanceReport";
import ManagementDashboard from "../Attendance/Pages/TopManagementDashboard";
import AttendanceHistory from "../Attendance/Pages/AttendanceHistory";
import MyRequests from "../Attendance/Pages/MyRequests";
import RouteProtection from "../Attendance/Components/RouteProtection";
import PrimaryDashboard from "../Attendance/Pages/PrimaryDashboard";
import AssetInventory from "../Asset/Pages/AssetInventory";

import NonITAssetDetail from "../Asset/Pages/NonITAssetDetail";
import AssetReports from "../Asset/Pages/AssetReports";
import AssetDetail from "../Asset/Pages/AssetDetail";
import MyAssetRequests from "../Asset/Pages/MyAssetRequests";
import EmployeesAssetList from "../Asset/Pages/EmployeesAssetList";
import AssetAdminDashboard from "../Asset/Pages/AdminDashboard";
import HRDashboard from "../Asset/Pages/HRDashboard";
import HRMyDashboard from "../Asset/Pages/HRMyDashboard";
import OrganizationDashboard from "../Asset/Pages/OrganizationDashboard";
import EmployeeAssetDetail from "../Asset/Pages/EmployeeAssetDetail";
import NewAssetRequest from "../Asset/Pages/NewAssetRequest";
import ManagerApproval from "../Asset/Pages/ManagerApproval";
import AdminApproval from "../Asset/Pages/AdminApproval";
import HRRequestFullDetail from "../Asset/Pages/HRRequestFullDetail";
import EmployeeMyAssets from "../Asset/Pages/EmployeeMyAssets";
import EmployeeMyAssetDetail from "../Asset/Pages/EmployeeMyAssetDetail";
import AssetManagerDashboard from "../Asset/Pages/AssetManagerDashboard";
import AssetHandoverRequestForm from "../Asset/Pages/AssetHandoverRequestForm";
import SearchAssets from "../Asset/Pages/SearchAsset";
import { PopupThemeContext } from "../Common/useThemedMountNode";

// Custom theme with your brand colors
const customTeamsTheme = {
  ...teamsLightTheme,
  colorBrandBackground: "#007ED5",
  colorBrandBackground2Hover: "#B4E0FF",
  colorBrandBackground2Pressed: "#E6F4FF",
  colorBrandForeground1: "#007ED5",
  colorBrandBackgroundHover: "#0066B3",
};

// Asset module text runs noticeably larger than the rest of the app, which
// is what pushes content below the fold and forces scrolling on most Asset
// pages. Rather than editing the ~210 individual `size={...}` props across
// ~34 Asset files (error-prone, hard to review, easy to miss one), the
// font-size + matching line-height tokens are scaled once here and applied
// via a single nested FluentProvider wrapped ONLY around the /Asset route
// subtree (see AssetSectionLayout below) — colors/spacing tokens are
// untouched (spread from customTeamsTheme first), and every other module
// (Recruit, Attendance, Offboarding, etc.) keeps the original scale.
//
// Mapped to the four sizes requested for the Asset module specifically:
//   - Page headings (Text size={600}, always paired with weight="semibold"
//     in this codebase's page titles) -> 18px bold.
//   - Table headers / section-heading text (TableHeaderCell, Body1Strong,
//     Text size={400} — Fluent's "medium-large" tier) -> 15px bold.
//   - Everything Fluent treats as its default/"most important" reading size
//     (unstyled Text, Body1, TableCell content, Fluent's base300 tier) ->
//     14px.
//   - Secondary/meta text (Text size={200}, the size already used
//     throughout Asset pages for captions and helper text) -> 12px — this
//     is already the Fluent default at base200, so no override is needed.
const assetCompactTheme = {
  ...customTeamsTheme,
  fontSizeBase300: "14px",
  lineHeightBase300: "19px",
  fontSizeBase400: "15px",
  lineHeightBase400: "20px",
  fontSizeBase500: "16px",
  lineHeightBase500: "22px",
  fontSizeBase600: "18px",
  lineHeightBase600: "24px",
  fontSizeHero700: "20px",
  lineHeightHero700: "26px",
  fontSizeHero800: "22px",
  lineHeightHero800: "28px",
  fontSizeHero900: "26px",
  lineHeightHero900: "32px",
  fontSizeHero1000: "36px",
  lineHeightHero1000: "44px",
};

// TableHeaderCell's own text is `font-size: inherit` (it takes whatever its
// parent Table/TableRow size variant sets — base300 for a default Table,
// base200 for `size="small"`) and is regular weight unless the call site
// happens to wrap its content in <Body1Strong>, which not every table in
// this module does. Targeting Fluent's own stable "fui-TableHeaderCell"
// class (a documented, versioned public class name — not an internal
// implementation detail) guarantees every table header in the Asset module
// reads at 15px bold consistently, regardless of which Table size variant
// or header markup each page happens to use.
//
// Shared by every wrapper below (AssetSectionLayout and the standalone
// Asset config pages under /ManagementHub) so all of it lives in one place:
// the compact theme for regular text, the table-header CSS override, AND
// PopupThemeContext so Dropdown/Tooltip popups opened from any of these
// pages (which portal out to document.body via useThemedMountNode) pick up
// the same compact sizing instead of the app-wide default.
const AssetCompactScope: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <FluentProvider theme={assetCompactTheme} style={{ background: "transparent", height: "100%" }}>
    <PopupThemeContext.Provider value={assetCompactTheme}>
      <style>{`.fui-TableHeaderCell { font-size: 15px; font-weight: 600; }`}</style>
      {children}
    </PopupThemeContext.Provider>
  </FluentProvider>
);

// Wraps the /Asset route subtree in the compact theme above. A plain
// functional wrapper around <Outlet/> — no behavior, data-fetching, or
// routing logic of its own, so it can't affect anything the existing
// Asset pages already do.
const AssetSectionLayout: React.FC = () => (
  <AssetCompactScope>
    <Outlet />
  </AssetCompactScope>
);

// Define navigation items with activeIcons for children
const navItems = [
  // {
  //   name: "Home",
  //   icon: Home24Regular,
  //   activeIcon: Home24Filled,
  //   path: "/Home",
  //   title: "Dashboard",
  //   background: "plane",
  // },
  {
    name: "Recruitment Dashboard",
    icon: Grid20Regular,
    activeIcon: Grid20Filled,
    path: "/recruit/managementdashboard",
    title: "Recruitment Dashboard",
    background: "recruit-bg",
    module: "Recruit"
  },
  {
    name: "HR Dashboard",
    icon: Grid20Regular,
    activeIcon: Grid20Filled,
    path: "/recruit/hrinfodashboard",
    title: "HR Dashboard",
    background: "recruit-bg",
    module: "Recruit"
  },
  {
    name: "Requisition Dashboard",
    icon: Briefcase20Regular,
    activeIcon: Briefcase20Filled,
    path: "/recruit",
    title: "Recruit",
    background: "recruit-bg",
    module: "Recruit"
  },
  {
    name: "Create Requisition",
    path: "/recruit/newJDForm",
    title: "Create Requisition",
    background: "plain",
    icon: DocumentAdd24Regular,
    activeIcon: DocumentAdd24Filled,
    module: "Recruit"
  },
  {
    name: "Hiring Dashboard",
    icon: PeopleList20Regular,
    activeIcon: PeopleList20Filled,
    path: "/recruit/HiringDashboard",
    title: "Hiring Dashboard",
    background: "recruit-bg",
    module: "Recruit"
  },

  {
    name: "BGV Dashboard",
    icon: ApprovalsApp24Regular,
    activeIcon: ApprovalsApp24Filled,
    path: "/BGV",
    title: "BGV Dashboard",
    background: "bgv-bg",
    module: "BGV"
  },
  {
    name: "Initiate Background Check",
    path: "/BGV/BGVForm",
    title: "Initiate Background Check",
    background: "plain",
    icon: DocumentAdd24Regular,
    activeIcon: DocumentAdd24Filled,
    module: "BGV"
  },

  {
    name: "Onboarding",
    icon: TableSimpleInclude24Regular,
    activeIcon: TableSimpleInclude24Filled,
    path: "/Induction",
    title: "Onboarding Dashboard",
    background: "onboarding",
    module: "Onboarding"
  },
  {
    name: "Initiate Onboarding",
    path: "/Induction/NewInductionForm",
    title: "Initiate Onboarding",
    background: "plain",
    icon: DocumentAdd24Regular,
    activeIcon: DocumentAdd24Filled,
    module: "Onboarding"
  },
  {
    name: "Employee Management",
    path: "/Induction/EmployeeManagement",
    title: "Employee Management",
    background: "onboarding",
    icon: People20Regular,
    activeIcon: People20Filled,
    module: "Onboarding"
  },

  {
    name: "Offboarding",
    icon: ArrowExit24Regular,
    activeIcon: ArrowExit24Filled,
    path: "/offboard",
    title: "Offboarding Dashboard",
    background: "offboarding",
    module: "Offboarding"
  },
  {
    name: "Initiate Exit Process",
    path: "/offboard/offboardForm",
    title: "Initiate Exit Process",
    background: "gradient",
    icon: DocumentAdd24Regular,
    activeIcon: DocumentAdd24Filled,
    module: "Offboarding"
  },
  {
    name: "Manager Clearance",
    path: "/offboard/LeadClearance",
    title: "Manager Clearance Dashboard",
    background: "offboarding",
    icon: PersonKeyRegular,
    activeIcon: PersonKeyFilled,
    module: "Offboarding"
  },
  {
    name: "IT Clearance",
    path: "/offboard/ITClearance",
    title: "IT Clearance Dashboard",
    background: "offboarding",
    icon: LaptopRegular,
    activeIcon: LaptopFilled,
    module: "Offboarding"
  },
  {
    name: "Admin Clearance",
    path: "/offboard/AdminClearance",
    title: "Admin Clearance Dashboard",
    background: "offboarding",
    icon: BuildingDesktopRegular,
    activeIcon: BuildingCheckmarkFilled,
    module: "Offboarding"
  },
  {
    name: "Finance Clearance",
    path: "/offboard/FinanceClearance",
    title: "Finance Clearance Dashboard",
    background: "offboarding",
    icon: CurrencyDollarRupeeRegular,
    activeIcon: CurrencyDollarRupeeFilled,
    module: "Offboarding"
  },
  {
    name: "Knowledge Transfer Clearance",
    path: "/offboard/LeadKtClearance",
    title: "Knowledge Transfer Clearance",
    background: "offboarding",
    icon: BuildingDesktopRegular,
    activeIcon: BuildingCheckmarkFilled,
    module: "Offboarding"
  },

  {
    name: "Configuration Hub",
    icon: Settings24Regular,
    activeIcon: Settings24Filled,
    path: "/ManagementHub",
    title: "Configuration Hub",
    background: "Management",
    module: "Configuration Hub"
  },
  {
    name: "Job Postings",
    path: "/ManagementHub/JobPosting",
    title: "Job Postings",
    background: "Management",
    icon: Options20Regular,
    activeIcon: Options20Filled,
    module: "Configuration Hub"
  },
  {
    name: "Hiring Template",
    path: "/ManagementHub/HiringTemplate",
    title: "Hiring Template",
    background: "Management",
    icon: BookTemplateRegular,
    activeIcon: BookTemplateFilled,
    module: "Configuration Hub"
  },
  {
    name: "Location",
    path: "/ManagementHub/Location",
    title: "Location",
    background: "Management",
    icon: GlobeLocationRegular,
    activeIcon: GlobeLocationFilled,
    module: "Configuration Hub"
  },
  {
    name: "Department",
    path: "/ManagementHub/Department",
    title: "Department",
    background: "Management",
    icon: BuildingDesktopRegular,
    activeIcon: BuildingCheckmarkFilled,
    module: "Configuration Hub"
  },
  {
    name: "HR Mapping",
    path: "/ManagementHub/hr_mapping",
    title: "HR Mapping",
    background: "Management",
    icon: PeopleTeamRegular,
    activeIcon: PeopleTeamRegular,
    module: "Configuration Hub"
  },
  {
    name: "Permission Matrix",
    path: "/ManagementHub/PermissionMatrix",
    title: "Permission Matrix",
    background: "Management",
    icon: AccessibilityCheckmarkRegular,
    activeIcon: AccessibilityCheckmarkFilled,
    module: "Configuration Hub"
  },
  {
    name: "User Role Management",
    path: "/ManagementHub/UserRoleManagement",
    title: "UserRole Management",
    background: "Management",
    icon: PersonKeyRegular,
    activeIcon: PersonKeyFilled,
    module: "Configuration Hub"
  },
  {
    name: "Induction Tasks",
    path: "/ManagementHub/InductionTasks",
    title: "InductionTasks",
    background: "Management",
    icon: TaskListLtrRegular,
    activeIcon: TaskListLtrRegular,
    module: "Configuration Hub"
  },
  {
    name: "Document Management",
    path: "/ManagementHub/DocumentManagement",
    title: "DocumentManagement",
    background: "Management",
    icon: DocumentBulletListRegular,
    activeIcon: DocumentBulletListFilled,
    module: "Configuration Hub"
  },
  {
    name: "IT Activity Management",
    path: "/ManagementHub/ITActivitiesManagement",
    title: "ITActivitiesManagement",
    background: "Management",
    icon: BoxMultipleRegular,
    activeIcon: BoxMultipleFilled,
    module: "Configuration Hub"
  },
  {
    name: "Admin Activity Management",
    path: "/ManagementHub/AdminActivityManagement",
    title: "AdminActivityManagement",
    background: "Management",
    icon: LaptopRegular,
    activeIcon: LaptopFilled,
    module: "Configuration Hub"
  },
  {
    name: "Finance Activity Management",
    path: "/ManagementHub/FinanceActivityManagement",
    title: "FinanceActivityManagement",
    background: "Management",
    icon: CurrencyDollarRupeeRegular,
    activeIcon: CurrencyDollarRupeeFilled,
    module: "Configuration Hub"
  },
  {
    name: "Shift Template",
    path: "/ManagementHub/ShiftTemplate",
    title: "Shift Template",
    background: "Management",
    icon: Options20Regular,
    activeIcon: Options20Filled,
    module: "Configuration Hub"
  },
  {
    name: "Leave Policy",
    path: "/ManagementHub/LeavePolicy",
    title: "Leave Policy",
    background: "Management",
    icon: Accessibility20Regular,
    activeIcon: Accessibility20Regular,
    module: "Configuration Hub"
  },
  {
    name: "Holiday Management",
    path: "/ManagementHub/HolidayManagement",
    title: "Holiday Management",
    background: "Management",
    icon: Options20Regular,
    activeIcon: Options20Filled,
    module: "Configuration Hub"
  },
  {
    name: "Attendance Config",
    path: "/ManagementHub/AttendanceConfig",
    title: "Attendance Configuration Settings",
    background: "Management",
    icon: Options20Regular,
    activeIcon: Options20Filled,
    module: "Configuration Hub"
  },
  {
    name: "Asset Configuration",
    path: "/ManagementHub/AssetConfiguration",
    title: "Asset Configuration",
    background: "Management",
    icon: BoxToolboxRegular,
    activeIcon: BoxToolboxFilled,
    module: "Configuration Hub"
  },
  {
    name: "Dashboard",
    icon: Grid20Regular,
    activeIcon: Grid20Filled,
    path: "/Attendance",
    title: "Attendance Dashboard",
    background: "attendance",
    module: "Attendance"
  },
  // {
  //   name: "Manager Dashboard",
  //   icon: Grid20Regular,
  //   activeIcon: Grid20Filled,
  //   path: "/Attendance/ManagerDashboard",
  //   title: "Attendance Dashboard",
  //   background: "attendance",
  //   module: "Attendance"
  // },
  {
    name: "Team Attendance List",
    icon: PeopleList20Regular,
    activeIcon: PeopleList20Filled,
    path: "/Attendance/TeamView",
    title: "Team Attendance List",
    background: "attendance",
    module: "Attendance"
  },

  {
    name: "Team Attendance Report",
    icon: DocumentBulletListRegular,
    activeIcon: DocumentBulletListFilled,
    path: "/Attendance/ManagerReport",
    title: "Team Attendance Report",
    background: "attendance",
    module: "Attendance"
  },
  // {
  //   name: "Admin Dashboard",
  //   icon: Grid20Regular,
  //   activeIcon: Grid20Filled,
  //   path: "/Attendance/AdminDashboard",
  //   title: "Attendance Dashboard",
  //   background: "attendance",
  //   module: "Attendance"
  // },
  {
    name: "Admin Report Dashboard",
    icon: DocumentBulletListRegular,
    activeIcon: DocumentBulletListFilled,
    path: "/Attendance/AdminAttendanceReport",
    title: "Admin Report Dashboard",
    background: "attendance",
    module: "Attendance"
  },
  {
    name: "Management Dashboard",
    icon: Grid20Regular,
    activeIcon: Grid20Filled,
    path: "/Attendance/ManagementDashboard",
    title: "Management Dashboard",
    background: "attendance",
    module: "Attendance"
  },
  {
    name: "Staff Directory & Shift Setup",
    icon: People20Regular,
    activeIcon: People20Filled,
    path: "/Attendance/Management",
    title: "Attendance Management",
    background: "attendance",
    module: "Attendance"
  },
  {
    name: "Approvals",
    icon: ApprovalsApp24Regular,
    activeIcon: ApprovalsApp24Filled,
    path: "/Attendance/Approvals",
    title: "Attendance Approvals",
    background: "attendance",
    module: "Attendance"
  },
  {
    name: "Attendance Log",
    icon: History24Regular,
    activeIcon: History24Filled,
    path: "/Attendance/History",
    title: "Attendance Log",
    background: "attendance",
    module: "Attendance"
  },
  {
    name: "My Requests",
    icon: DocumentAdd24Regular,
    activeIcon: DocumentAdd24Filled,
    path: "/Attendance/MyRequests",
    title: "My Requests",
    background: "attendance",
    module: "Attendance"
  },
  {
    name: "Admin Dashboard",
    icon: Grid20Regular,
    activeIcon: Grid20Filled,
    path: "/Asset/admin-dashboard",
    title: "Admin Dashboard",
    background: "asset",
    module: "Asset"
  },
  {
    name: "Asset Reports",
    icon: Grid20Regular,
    activeIcon: Grid20Filled,
    path: "/Asset/reports",
    title: "Asset Reports",
    background: "asset",
    module: "Asset"
  },
  {
    name: "Search Assets",
    icon: Search24Regular,
    activeIcon: Search24Filled,
    path: "/Asset/search",
    title: "Search Assets",
    background: "asset",
    module: "Asset"
  },
  {
    name: "Asset HR Dashboard",
    icon: Grid20Regular,
    activeIcon: Grid20Filled,
    path: "/Asset/hr-dashboard",
    title: "Asset HR Dashboard",
    background: "asset",
    module: "Asset"
  },
  {
    name: "Asset Inventory",
    icon: BoxToolboxRegular,
    activeIcon: BoxToolboxFilled,
    path: "/Asset",
    title: "Asset Inventory",
    background: "asset",
    module: "Asset"
  },
  {
    name: "My Assets",
    icon: LaptopRegular,
    activeIcon: LaptopFilled,
    path: "/Asset/my-assets",
    title: "My Assets",
    background: "asset",
    module: "Asset"
  },
  {
    name: "My Requests",
    icon: DocumentAdd24Regular,
    activeIcon: DocumentAdd24Filled,
    path: "/Asset/my-requests",
    title: "My Asset Requests",
    background: "asset",
    module: "Asset"
  },
  {
    name: "Manager Approval",
    icon: ApprovalsApp24Regular,
    activeIcon: ApprovalsApp24Filled,
    path: "/Asset/manager-approval",
    title: "Manager Approval",
    background: "asset",
    module: "Asset"
  },
  {
    name: "Asset Manager Dashboard",
    icon: Grid20Regular,
    activeIcon: Grid20Filled,
    path: "/Asset/manager-dashboard",
    title: "Asset Manager Dashboard",
    background: "asset",
    module: "Asset"
  },
  {
    name: "Admin Approval",
    icon: ApprovalsApp24Regular,
    activeIcon: ApprovalsApp24Filled,
    path: "/Asset/admin-approval",
    title: "Admin Approval",
    background: "asset",
    module: "Asset"
  },
  {
    name: "Employees Asset List",
    icon: People20Regular,
    activeIcon: People20Filled,
    path: "/Asset/employees",
    title: "Employees Asset List",
    background: "asset",
    module: "Asset"
  },
];

// Navigation sidebar component - separated from router logic
const SidebarContent = () => {
  const {
    currentUser,
    login,
    logout,
    isInitialized,
    isLoading,
    isTeamsContext,
  } = useAuth();

  const [selectedModule, setSelectedModule] = useState('/attendance'); // Add this state

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [pendingApprovalsTotal, setPendingApprovalsTotal] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const managerId = currentUser?.userID ?? "";

  useEffect(() => {
    if (!managerId) return;
    if (checkPermission("attendance.manager_approvals")) {
      const fetchPendingTotal = () => {
        Promise.allSettled([
          // getPendingApprovals(managerId),
          getPendingPermissionRequests(managerId),
          getPendingLeaveApprovals(managerId),
          getPendingRegularizationRequests(managerId),
        ]).then(([
          // locRes, 
          permRes, leaveRes, regRes]) => {
          let total = 0;
          // if (locRes.status === "fulfilled") total += (locRes.value ?? []).length;
          if (permRes.status === "fulfilled") total += (permRes.value ?? []).length;
          if (leaveRes.status === "fulfilled") total += (leaveRes.value ?? []).length;
          if (regRes.status === "fulfilled") total += ((regRes.value as any)?.data ?? []).length;
          setPendingApprovalsTotal(total);
        });
      };

      fetchPendingTotal();
      const interval = setInterval(fetchPendingTotal, 2 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [managerId]);

  // Re-fetch when navigating away from Approvals page so the dot reflects the latest state
  const prevPathRef = React.useRef(location.pathname);
  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = location.pathname;
    if (prev === "/Attendance/Approvals" && location.pathname !== "/Attendance/Approvals" && managerId) {
      Promise.allSettled([
        // getPendingApprovals(managerId),
        getPendingPermissionRequests(managerId),
        getPendingLeaveApprovals(managerId),
        getPendingRegularizationRequests(managerId),
      ]).then(([
        // locRes, 
        permRes, leaveRes, regRes]) => {
        let total = 0;
        // if (locRes.status === "fulfilled") total += (locRes.value ?? []).length;
        if (permRes.status === "fulfilled") total += (permRes.value ?? []).length;
        if (leaveRes.status === "fulfilled") total += (leaveRes.value ?? []).length;
        if (regRes.status === "fulfilled") total += ((regRes.value as any)?.data ?? []).length;
        setPendingApprovalsTotal(total);
      });
    }
  }, [location.pathname]);

  // Helper function to safely check permissions
  const checkPermission = (permissionPath: string) => {
    const paths = permissionPath.split(".");
    let current: any = currentUser?.permissions;

    for (const path of paths) {
      if (!current || current[path] === undefined) {
        return false;
      }
      current = current[path];
    }

    return current === true;
  };

  // const filterNavItemsByPermissions = (items: any) => {
  //   return items
  //     .filter((item: any) => {
  //       // Always show Home
  //       if (item.name === "Home") return true;

  //       // Check Recruit permissions
  //       if (item.name === "Recruit") {
  //         return (
  //           checkPermission("recruit.job_posting.view_job.view_all") ||
  //           checkPermission("recruit.job_posting.view_job.view_my") ||
  //           checkPermission("recruit.job_posting.create_job") ||
  //           checkPermission("recruit.job_posting.edit_job") ||
  //           checkPermission("recruit.job_posting.delete_job") ||
  //           checkPermission("recruit.candidate_app.manage_app") ||
  //           checkPermission("recruit.candidate_app.approve_reject_app") ||
  //           checkPermission("recruit.interview_schedule.create_interview") ||
  //           checkPermission("recruit.interview_schedule.modify_interview") ||
  //           checkPermission("recruit.interview_feedback.view_all_feedback") ||
  //           checkPermission("recruit.interview_feedback.view_my_feedback")
  //         );
  //       }

  //       // Check BGV permissions
  //       if (item.name === "BGV") {
  //         return (
  //           checkPermission("background_verification.bgv_view.view_all_bgv") ||
  //           checkPermission("background_verification.bgv_view.view_my_bgv") ||
  //           checkPermission("background_verification.bgv_manage.create_bgv") ||
  //           checkPermission("background_verification.bgv_manage.edit_bgv") ||
  //           checkPermission("background_verification.bgv_manage.delete_bgv") ||
  //           checkPermission("background_verification.bgv_approve") ||
  //           checkPermission("background_verification.bgv_close")
  //         );
  //       }

  //       // Check Onboarding permissions
  //       if (item.name === "Onboarding") {
  //         return (
  //           checkPermission("onboarding.onboarding_tasks.view_all_tasks") ||
  //           checkPermission("onboarding.onboarding_tasks.view_my_tasks") ||
  //           checkPermission("onboarding.manage_onboarding.create_onboarding") ||
  //           checkPermission("onboarding.manage_onboarding.edit_onboarding") ||
  //           checkPermission("onboarding.manage_onboarding.delete_onboarding")
  //         );
  //       }

  //       // Check Offboarding permissions
  //       if (item.name === "Offboarding") {
  //         return (
  //           checkPermission(
  //             "offboarding.offboarding_view.view_all_offboarding"
  //           ) ||
  //           checkPermission(
  //             "offboarding.offboarding_view.view_my_offboarding"
  //           ) ||
  //           checkPermission(
  //             "offboarding.offboarding_manage.create_offboarding"
  //           ) ||
  //           checkPermission(
  //             "offboarding.offboarding_manage.edit_offboarding"
  //           ) ||
  //           checkPermission(
  //             "offboarding.offboarding_manage.delete_offboarding"
  //           ) ||
  //           checkPermission("offboarding.lead_clearance") ||
  //           checkPermission("offboarding.it_clearance") ||
  //           checkPermission("offboarding.asset_clearance") ||
  //           checkPermission("offboarding.finance_clearance")
  //         );
  //       }
  //       console.log("item.name",item.name)
  //       // Check Management Hub permissions
  //       if (item.name === "Management Hub") {
  //         return (
  //           checkPermission("permissions.permission_matrix") ||
  //           checkPermission("permissions.user_role_management") ||
  //           checkPermission("recruit.job_role") ||
  //           checkPermission("recruit.hiring_template") ||
  //           checkPermission("recruit.location") ||
  //           checkPermission("recruit.department") ||
  //           checkPermission("recruit.recruit_dashboard") ||
  //           checkPermission("recruit.hr_mapping") ||
  //           checkPermission("background_verification.document_management") ||
  //           checkPermission("onboarding.induction_tasks") ||
  //           checkPermission("offboarding.it_activity_management") ||
  //           checkPermission("offboarding.admin_activity_management") ||
  //           checkPermission("offboarding.finance_activity_management")
  //         );
  //       }

  //       // Show other items by default
  //       return true;
  //     })
  //     .map((item: any) => {
  //       // Filter children based on permissions for Recruit
  //       if (item.name === "Recruit" && item.children) {
  //         const filteredChildren = item.children.filter((child: any) => {
  //           switch (child.name) {
  //             case "New Job Request":
  //               return checkPermission("recruit.job_posting.create_job");
  //             case "Hiring Dashboard":
  //               return (
  //                 checkPermission("recruit.candidate_app.manage_app") ||
  //                 checkPermission("recruit.candidate_app.approve_reject_app") ||
  //                 checkPermission(
  //                   "recruit.interview_schedule.create_interview"
  //                 ) ||
  //                 checkPermission(
  //                   "recruit.interview_schedule.modify_interview"
  //                 ) ||
  //                 checkPermission(
  //                   "recruit.interview_feedback.view_all_feedback"
  //                 ) ||
  //                 checkPermission("recruit.interview_feedback.view_my_feedback")
  //               );
  //             default:
  //               return true;
  //           }
  //         });
  //         return { ...item, children: filteredChildren };
  //       }

  //       // Filter children based on permissions for BGV
  //       if (item.name === "BGV" && item.children) {
  //         const filteredChildren = item.children.filter((child: any) => {
  //           switch (child.name) {
  //             case "New BGV Form":
  //               return checkPermission(
  //                 "background_verification.bgv_manage.create_bgv"
  //               );
  //             default:
  //               return true;
  //           }
  //         });
  //         return { ...item, children: filteredChildren };
  //       }

  //       // Filter children based on permissions for Onboarding
  //       if (item.name === "Onboarding" && item.children) {
  //         const filteredChildren = item.children.filter((child: any) => {
  //           switch (child.name) {
  //             case "New Onboarding Form":
  //               return checkPermission(
  //                 "onboarding.manage_onboarding.create_onboarding"
  //               );
  //             default:
  //               return true;
  //           }
  //         });
  //         return { ...item, children: filteredChildren };
  //       }

  //       // Filter children based on permissions for Offboarding
  //       if (item.name === "Offboarding" && item.children) {
  //         const filteredChildren = item.children.filter((child: any) => {
  //           switch (child.name) {
  //             case "New Offboarding Form":
  //               return checkPermission(
  //                 "offboarding.offboarding_manage.create_offboarding"
  //               );
  //             case "Lead Clearance":
  //               return checkPermission("offboarding.lead_clearance");
  //             case "Lead KT Clearence ":
  //               return checkPermission("offboarding.lead_clearance");
  //             case "IT Clearance":
  //               return checkPermission("offboarding.it_clearance");
  //             case "Admin Clearance":
  //               return checkPermission("offboarding.asset_clearance");
  //             case "Finance Clearance":
  //               return checkPermission("offboarding.finance_clearance");
  //             default:
  //               return true;
  //           }
  //         });
  //         return { ...item, children: filteredChildren };
  //       }

  //       // Filter children based on permissions for Management Hub
  //       if (item.name === "Management Hub" && item.children) {
  //         const filteredChildren = item.children.filter((child: any) => {
  //           switch (child.name) {
  //             case "Job Postings":
  //               return checkPermission("recruit.job_role");
  //             case "Hiring Template":
  //               return checkPermission("recruit.hiring_template");
  //             case "Location":
  //               return checkPermission("recruit.location");
  //             case "Department":
  //               return checkPermission("recruit.department");
  //             case "HR Mapping":
  //               return checkPermission("recruit.hr_mapping");
  //             case "Permission Matrix":
  //               return checkPermission("permissions.permission_matrix");
  //             case "User Role Management":
  //               return checkPermission("permissions.user_role_management");
  //             case "Induction Tasks":
  //               return checkPermission("onboarding.induction_tasks");
  //             case "Document Management":
  //               return checkPermission(
  //                 "background_verification.document_management"
  //               );
  //             case "IT Activity Management":
  //               return checkPermission("offboarding.it_activity_management");
  //             case "Admin Activity Management":
  //               return checkPermission("offboarding.admin_activity_management");
  //             case "Finance Activity Management":
  //               return checkPermission(
  //                 "offboarding.finance_activity_management"
  //               );
  //             default:
  //               return true;
  //           }
  //         });
  //         return { ...item, children: filteredChildren };
  //       }
  //       return item;
  //     });
  // };

  // Test
  const filterNavItemsByPermissions = (items: any) => {
    return items.filter((item: any) => {
      // Always show Home
      if (item.name === "Home") return true;

      // ==================== RECRUIT ====================
      // Check Recruit main menu permissions
      if (item.name === "Recruit") {
        return (
          checkPermission("recruit.job_posting.view_job.view_all") ||
          checkPermission("recruit.job_posting.view_job.view_my") ||
          checkPermission("recruit.job_posting.create_job") ||
          checkPermission("recruit.job_posting.edit_job") ||
          checkPermission("recruit.job_posting.delete_job") ||
          checkPermission("recruit.candidate_app.manage_app") ||
          checkPermission("recruit.candidate_app.approve_reject_app") ||
          checkPermission("recruit.interview_schedule.create_interview") ||
          checkPermission("recruit.interview_schedule.modify_interview") ||
          checkPermission("recruit.interview_feedback.view_all_feedback") ||
          checkPermission("recruit.interview_feedback.view_my_feedback") ||
          checkPermission("recruit.recruit_dashboard.view_my") ||
          checkPermission("recruit.recruit_dashboard.view_all")
        );
      }

      // Check Recruit child menu permissions
      if (item.name === "Requisition Dashboard") {
        return checkPermission("recruit.job_posting.view_job.view_all") ||
          checkPermission("recruit.job_posting.view_job.view_my")
        // checkPermission("recruit.job_posting.create_job") ||
        // checkPermission("recruit.job_posting.edit_job") ||
        // checkPermission("recruit.job_posting.delete_job")
      }

      if (item.name === "Create Requisition") {
        return checkPermission("recruit.job_posting.create_job");
      }
      if (item.name === "Hiring Dashboard") {
        return (
          checkPermission("recruit.candidate_app.manage_app") ||
          checkPermission("recruit.candidate_app.approve_reject_app") ||
          checkPermission("recruit.interview_schedule.create_interview") ||
          checkPermission("recruit.interview_schedule.modify_interview") ||
          checkPermission("recruit.interview_feedback.view_all_feedback") ||
          checkPermission("recruit.interview_feedback.view_my_feedback")
        );
      }

      // ==================== BGV ====================
      // Check BGV main menu permissions
      if (item.name === "BGV Dashboard") {
        return (
          checkPermission("background_verification.bgv_view.view_all_bgv") ||
          checkPermission("background_verification.bgv_view.view_my_bgv") ||
          checkPermission("background_verification.bgv_manage.create_bgv") ||
          checkPermission("background_verification.bgv_manage.edit_bgv") ||
          checkPermission("background_verification.bgv_manage.delete_bgv") ||
          checkPermission("background_verification.bgv_approve") ||
          checkPermission("background_verification.bgv_close")
        );
      }

      // Check BGV child menu permissions
      if (item.name === "Initiate Background Check") {
        return checkPermission("background_verification.bgv_manage.create_bgv");
      }
      if (item.name === "BGV Dashboard") {
        return (
          checkPermission("background_verification.bgv_view.view_all_bgv") ||
          checkPermission("background_verification.bgv_view.view_my_bgv")
        );
      }

      // ==================== ONBOARDING ====================
      // Check Onboarding main menu permissions
      if (item.name === "Onboarding") {
        return (
          checkPermission("onboarding.onboarding_tasks.view_all_tasks") ||
          checkPermission("onboarding.onboarding_tasks.view_my_tasks") ||
          checkPermission("onboarding.manage_onboarding.create_onboarding") ||
          checkPermission("onboarding.manage_onboarding.edit_onboarding") ||
          checkPermission("onboarding.manage_onboarding.delete_onboarding") ||
          checkPermission("onboarding.employee_management")
        );
      }

      // Check Onboarding child menu permissions
      if (item.name === "Initiate Onboarding") {
        return checkPermission("onboarding.manage_onboarding.create_onboarding");
      }
      if (item.name === "Onboarding Dashboard") {
        return (
          checkPermission("onboarding.onboarding_tasks.view_all_tasks") ||
          checkPermission("onboarding.onboarding_tasks.view_my_tasks")
        );
      }
      if (item.name === "Employee Management") {
        const canManage =
          import.meta.env.VITE_CAN_MANAGE_EMPLOYEE === "True" ? true : false;
        return canManage && checkPermission("recruit.create_ad");
      }

      // ==================== OFFBOARDING ====================
      // Check Offboarding main menu permissions
      if (item.name === "Offboarding") {
        return (
          checkPermission("offboarding.offboarding_view.view_all_offboarding") ||
          checkPermission("offboarding.offboarding_view.view_my_offboarding")
        );
      }

      // Check Offboarding child menu permissions
      if (item.name === "Initiate Exit Process") {
        return checkPermission("offboarding.offboarding_manage.create_offboarding");
      }
      if (item.name === "Offboarding Dashboard") {
        return (
          checkPermission("offboarding.offboarding_view.view_all_offboarding") ||
          checkPermission("offboarding.offboarding_view.view_my_offboarding")
        );
      }
      if (item.name === "Manager Clearance") {
        return checkPermission("offboarding.lead_clearance");
      }
      if (item.name === "Knowledge Transfer Clearance" || item.name === "Lead KT Clearance") {
        return checkPermission("offboarding.lead_clearance");
      }
      if (item.name === "IT Clearance") {
        return checkPermission("offboarding.it_clearance");
      }
      if (item.name === "Admin Clearance") {
        return checkPermission("offboarding.asset_clearance");
      }
      if (item.name === "Finance Clearance") {
        return checkPermission("offboarding.finance_clearance");
      }

      // ==================== MANAGEMENT HUB ====================
      // Check Management Hub main menu permissions
      if (item.name === "Configuration Hub") {
        return (
          checkPermission("permissions.permission_matrix") ||
          checkPermission("permissions.user_role_management") ||
          checkPermission("recruit.job_role") ||
          checkPermission("recruit.hiring_template") ||
          checkPermission("recruit.location") ||
          checkPermission("recruit.department") ||
          checkPermission("recruit.recruit_dashboard") ||
          checkPermission("recruit.hr_mapping") ||
          checkPermission("background_verification.document_management") ||
          checkPermission("onboarding.induction_tasks") ||
          checkPermission("offboarding.it_activity_management") ||
          checkPermission("offboarding.admin_activity_management") ||
          checkPermission("offboarding.finance_activity_management")
        );
      }

      // Check Management Hub child menu permissions - Recruit Section
      if (item.name === "Job Postings") {
        return checkPermission("recruit.job_role");
      }
      if (item.name === "Hiring Template") {
        return checkPermission("recruit.hiring_template");
      }
      if (item.name === "Location") {
        return checkPermission("recruit.location");
      }
      if (item.name === "Department") {
        return checkPermission("recruit.department");
      }
      if (item.name === "HR Mapping") {
        return checkPermission("recruit.hr_mapping");
      }
      if (item.name === "Recruit Dashboard") {
        return checkPermission("recruit.recruit_dashboard");
      }

      if (item.name === "Recruitment Dashboard") {
        return checkPermission("recruit.recruit_dashboard.view_all")
      }

      if (item.name === "HR Dashboard") {
        return checkPermission("recruit.recruit_dashboard.view_my")
      }

      // Check Management Hub child menu permissions - Permissions Section
      if (item.name === "Permission Matrix") {
        return checkPermission("permissions.permission_matrix");
      }
      if (item.name === "User Role Management") {
        return checkPermission("permissions.user_role_management");
      }

      // Check Management Hub child menu permissions - Onboarding Section
      if (item.name === "Induction Tasks") {
        return checkPermission("onboarding.induction_tasks");
      }

      // Check Management Hub child menu permissions - BGV Section
      if (item.name === "Document Management") {
        return checkPermission("background_verification.document_management");
      }

      // Check Management Hub child menu permissions - Offboarding Section
      if (item.name === "IT Activity Management") {
        return checkPermission("offboarding.it_activity_management");
      }
      if (item.name === "Admin Activity Management") {
        return checkPermission("offboarding.admin_activity_management");
      }
      if (item.name === "Finance Activity Management") {
        return checkPermission("offboarding.finance_activity_management");
      }

      // ==================== ATTENDANCE ====================
      // Check Attendance permissions
      if (item.name === "Staff Directory & Shift Setup") {
        return (
          checkPermission("attendance.entra_ad_users.view_all") ||
          checkPermission("attendance.entra_ad_users.view_my")
        );
      }

      if (item.name === "Dashboard" || item.name === "Attendance Log" || item.name === "My Requests") {
        return checkPermission("attendance.dashboard.employee_dashboard") || checkPermission("attendance.dashboard.manager_dashboard") || checkPermission("attendance.dashboard.admin_dashboard")
      }

      // if (item.name === "Manager Dashboard") {
      //   return checkPermission("attendance.dashboard.manager_dashboard")
      // }

      // if (item.name === "Admin Dashboard") {
      //   return checkPermission("attendance.dashboard.admin_dashboard")
      // }

      if (item.name === "Admin Report Dashboard") {
        return checkPermission("attendance.dashboard.admin_dashboard")
      }

      if (item.name === "Management Dashboard") {
        return checkPermission("attendance.dashboard.admin_dashboard")
      }



      if (item.name === "Approvals") {
        return checkPermission("attendance.manager_approvals")
      }

      if (item.name === "Team Attendance List") {
        return checkPermission("attendance.dashboard.manager_dashboard")
      }

      if (item.name === "Team Attendance Report") {
        return checkPermission("attendance.dashboard.manager_dashboard")
      }

      if (item.name === "Shift Template") {
        return checkPermission("attendance.shift_template")
      }
      if (item.name === "Holiday Management") {
        return checkPermission("attendance.holiday_management")
      }

      if (item.name === "Leave Policy") {

        return checkPermission("attendance.leave_policy")
      }

      // Show other items by default
      return true;
    });
  };
  const filteredNavItems = filterNavItemsByPermissions(navItems);

  // Determine active items based on current path (parent and child)
  const getActiveItems = () => {
    const path = location.pathname;

    // First check for direct match
    let activeParent = filteredNavItems.find((item: any) => item.path === path);
    let activeChild = null;

    // If no direct match, check for child routes
    if (!activeParent) {
      for (const item of filteredNavItems) {
        if (item.children) {
          const matchingChild = item.children.find(
            (child: any) => child.path === path
          );
          if (matchingChild) {
            activeParent = item;
            activeChild = matchingChild;
            break;
          }
        }
      }
    }

    // Special handling for editJD route (not in sidebar but needs breadcrumb)
    if (!activeParent && path.startsWith("/recruit/editJD/")) {
      activeParent = filteredNavItems.find(
        (item: any) => item.name === "Recruit"
      );
      activeChild = {
        name: "Edit Job Opening",
        path: path,
        title: "Edit Job Opening",
        background: "plain",
        icon: Edit24Regular,
        activeIcon: Edit24Filled,
      };
    }
    // Special handling for Staff Directory & Shift Setup
    if (!activeParent && path.startsWith("/Attendance/ad-users")) {
      activeParent = filteredNavItems.find(
        (item: any) => item.name === "Attendance"
      );
      activeChild = {
        name: "Staff Directory & Shift Setup",
        path: "/Attendance",
        title: "Staff Directory & Shift Setup",
        icon: PersonSearchRegular,
        activeIcon: PersonSearchFilled,
      };
    }

    // Special handling for preview and overview routes
    if (
      !activeParent &&
      (path.startsWith("/recruit/previewJD/") ||
        path.startsWith("/recruit/jdoverview/"))
    ) {
      activeParent = filteredNavItems.find(
        (item: any) => item.name === "Recruit"
      );
      activeChild = {
        name: path.startsWith("/recruit/previewJD/")
          ? "Preview Job Description"
          : "Job Overview",
        path: path,
        title: path.startsWith("/recruit/previewJD/")
          ? "Preview Job Description"
          : "Job Overview",
        icon: DocumentText24Regular,
        activeIcon: DocumentText24Filled,
      };
    }

    // If still no match, check if path starts with any nav item path
    if (!activeParent) {
      activeParent = filteredNavItems.find((item: any) =>
        path.startsWith(item.path + "/")
      );

      // If parent found, see if there's a matching child
      if (activeParent?.children) {
        activeChild = activeParent.children.find(
          (child: any) =>
            path.startsWith(child.path + "/") || child.path === path
        );
      }
    }

    return {
      parent: activeParent || filteredNavItems[0], // Default to Home if no match
      child: activeChild,
    };
  };

  const { parent: activeParent, child: activeChild } = getActiveItems();

  // Build breadcrumb navigation based on active items
  const breadcrumbs = [];
  if (activeParent) {
    breadcrumbs.push(activeParent);
    if (activeChild) {
      breadcrumbs.push(activeChild);
    }
  }

  const toggleSidebar = () => {
    if (window.innerWidth <= 1024) {
      setIsMobileNavOpen(!isMobileNavOpen);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleNavItemClick = (name: string, path: any) => {
    navigate(path);
    if (window.innerWidth <= 1024) {
      setIsMobileNavOpen(false);
    }
  };

  const findBackgroundType = () => {
    const navItem = navItems.find((item) => item.path === location.pathname);
    if (navItem) {
      return navItem.background || "plane";
    }

    // Check children
    for (const item of filteredNavItems) {
      if (item.children) {
        const matchingChild = item.children.find(
          (child: any) => child.path === location.pathname
        );
        if (matchingChild) {
          return matchingChild.background || "plane";
        }
      }
    }

    // Special handling for specific routes
    if (location.pathname.startsWith("/recruit/jdOverview")) {
      return "recruit-bg";
    }

    if (location.pathname.startsWith("/Attendance")) {
      return "attendance";
    }

    if (location.pathname.startsWith("/Asset")) {
      return "asset";
    }

    return "plane";
  };

  // First, add state to track the current page for highlighting
  const [currentPage, setCurrentPage] = useState("/Home");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false); // Add state for popover

  // // Update currentPage when location changes
  // useEffect(() => {
  //   setCurrentPage(location.pathname);
  // }, [location.pathname]);

  // Update currentPage when location changes and set selected module
  useEffect(() => {
    setCurrentPage(location.pathname);

    // Determine which module based on path
    if (location.pathname.startsWith('/recruit')) {
      setSelectedModule('Recruit');
    } else if (location.pathname.startsWith('/BGV')) {
      setSelectedModule('BGV');
    } else if (location.pathname.startsWith('/Induction')) {
      setSelectedModule('Onboarding');
    } else if (location.pathname.startsWith('/offboard')) {
      setSelectedModule('Offboarding');
    } else if (location.pathname.startsWith('/Attendance')) {
      setSelectedModule('Attendance');
    } else if (location.pathname.startsWith('/Asset')) {
      setSelectedModule('Asset');
    } else if (location.pathname.startsWith('/ManagementHub')) {
    } else {
      setSelectedModule('Asset');
    }
  }, [location.pathname, currentUser]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Function to handle navigation and close popover
  // const handleImageClick = (path: string) => {
  //   setIsPopoverOpen(false); // Close the popover
  //   navigate(path); // Navigate to the page
  // };
  const handleImageClick = (path: string) => {

    // console.log("path to navigate", path)
    setIsPopoverOpen(false);

    // Map path to module name
    const moduleMap: any = {
      '/recruit': 'Recruit',
      'recruit/hrinfodashboard': 'Recruit/hrinfodashboard',
      'recruit/managementdashboard': 'Recruit/managementdashboard',
      '/BGV': 'BGV',
      '/Induction': 'Onboarding',
      '/offboard': 'Offboarding',
      '/Attendance': 'Attendance',
      '/Asset': 'Asset',
      '/ManagementHub': 'Configuration Hub'  // ⚠️ Path is /ManagementHub but module name is "Configuration Hub"
    };

    setSelectedModule(moduleMap[path] || 'Asset');
    navigate(path);
  };


  // console.log("Filtered nav items", filteredNavItems)

  const getFilteredNavByModule = () => {
    // Get all items for the selected module
    const moduleItems = filteredNavItems.filter((item: any) =>
      item.module === selectedModule || item.path === selectedModule
    );

    return moduleItems;
  };

  const displayNavItems = getFilteredNavByModule();



  // Function to get background color based on current page
  const getImageBackgroundColor = (pagePath: string) => {
    // Check if current page starts with this path (for sub-routes)
    if (currentPage.startsWith(pagePath)) {
      return "#F6F6F6"; // Light gray background for current page
    }

    // Special handling for specific cases
    if (pagePath === "/recruit" && currentPage.startsWith("/recruit")) {
      return "#F6F6F6";
    }
    if (pagePath === "/BGV" && currentPage.startsWith("/BGV")) {
      return "#F6F6F6";
    }
    if (pagePath === "/Induction" && currentPage.startsWith("/Induction")) {
      return "#F6F6F6";
    }
    if (pagePath === "/offboard" && currentPage.startsWith("/offboard")) {
      return "#F6F6F6";
    }
    if (pagePath === "/ManagementHub" && currentPage.startsWith("/ManagementHub")) {
      return "#F6F6F6";
    }

    return "transparent"; // Default transparent
  };

  // Render nav item for collapsed sidebar
  const renderCollapsedNavItem = (item: any, index: number) => {
    const Icon = activeParent.name === item.name ? item.activeIcon : item.icon;
    const isParentActive = activeParent.name === item.name;

    if (item.children && item.children.length > 0) {
      return (
        <FluentProvider key={index} theme={customTeamsTheme}>
          <Menu key={item.name} positioning="after-top" hoverDelay={100}>
            <MenuTrigger disableButtonEnhancement>
              <Tooltip
                content={item.name}
                relationship="label"
                positioning="after"
              >
                <div
                  className={`flex items-center justify-center py-3 px-2 mx-2 my-1 cursor-pointer rounded-lg transition-all duration-200 hover:bg-[var(--colorBrandBackground2Pressed)] hover:shadow-sm ${isParentActive
                    ? "bg-[var(--colorBrandBackground2Hover)] border border-[var(--colorBrandBackground)]"
                    : ""
                    }`}
                >
                  <Icon
                    className="w-5 h-5"
                    primaryFill={
                      isParentActive ? "var(--colorBrandBackground)" : "#424242"
                    }
                  />
                </div>
              </Tooltip>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => navigate(item.path)}>
                  <div className="flex items-center">
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </div>
                </MenuItem>
                {item.children.map((child: any) => {
                  const ChildIcon =
                    activeChild &&
                      activeChild.path === child.path &&
                      child.activeIcon
                      ? child.activeIcon
                      : child.icon || DocumentText24Regular;

                  return (
                    <MenuItem
                      key={child.path}
                      onClick={() => navigate(child.path)}
                    >
                      <div className="flex items-center">
                        {child.icon && <ChildIcon className="w-4 h-4 mr-2" />}
                        {child.name}
                      </div>
                    </MenuItem>
                  );
                })}
              </MenuList>
            </MenuPopover>
          </Menu>
        </FluentProvider>
      );
    }

    return (
      <FluentProvider>
        <Tooltip
          key={item.name}
          content={item.name}
          relationship="label"
          positioning="after"
        >
          <div
            className={`relative flex items-center justify-center py-3 px-2 mx-2 my-1 cursor-pointer rounded-lg transition-all duration-200 hover:bg-[var(--colorBrandBackground2Pressed)] hover:shadow-sm ${isParentActive
              ? "bg-[var(--colorBrandBackground2Hover)] border border-[var(--colorBrandBackground)]"
              : ""
              }`}
            onClick={() => handleNavItemClick(item.name, item.path)}
          >
            <Icon
              className="w-5 h-5"
              primaryFill={
                isParentActive ? "var(--colorBrandBackground)" : "#424242"
              }
            />
            {item.name === "Approvals" && pendingApprovalsTotal > 0 && location.pathname !== "/Attendance/Approvals" && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </div>
        </Tooltip>
      </FluentProvider>
    );
  };

  return (
    <FluentProvider theme={customTeamsTheme}>
      <div className="flex flex-grow overflow-hidden relative">
        {/* Mobile Backdrop */}
        {isMobileNavOpen && (
          <div
            className="fixed inset-0 bg-black/35 z-20 lg:hidden"
            onClick={() => setIsMobileNavOpen(false)}
          />
        )}
        {/* Sidebar */}
        <div
          className={`flex flex-col h-screen transition-all duration-300 ease-in-out border-r border-gray-200 shadow-sm z-30 bg-white ${isExpanded || isMobileNavOpen ? "max-w-56" : "w-0 lg:w-16"
            } ${isMobileNavOpen ? "absolute h-screen top-0" : "lg:relative"
            }`}
        >
          {/* Logo/Brand */}
          <div
            className={`flex items-center px-4 h-14 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${!isExpanded && !isMobileNavOpen ? "justify-center px-2" : ""
              }`}
            style={{ padding: '0 10px' }}
            onClick={() => navigate("/Asset/dashboard")}
          >
            {/* <PeopleCommunity32Color /> */}
            <img src="/QPeopleIcon.png"
              alt="icon1"
              className="border-1 border-white rounded-xl"
              style={{
                height: "40px",
                // width: "40px",
              }} />
            {(isExpanded || isMobileNavOpen) && (
              <div className="ml-3 font-bold text-lg text-[var(--colorNeutralForeground1)] whitespace-nowrap overflow-hidden text-ellipsis transition-all duration-300 ease-in-out">
                Quadra People
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex flex-col flex-grow overflow-y-auto overflow-x-hidden py-2">
            {displayNavItems.map((item: any, index: number) => {
              if (!isExpanded && !isMobileNavOpen) {
                return renderCollapsedNavItem(item, index);
              }

              const Icon = activeParent.name === item.name ? item.activeIcon : item.icon;
              const isActive = location.pathname === item.path;

              return (
                <div key={index} className="px-2">
                  <div
                    className={`flex items-center py-3 px-3 my-1 cursor-pointer rounded-lg transition-all duration-200 hover:bg-[var(--colorBrandBackground2Pressed)] group ${isActive
                      ? "bg-[var(--colorBrandBackground2Hover)] text-[var(--colorBrandBackground)] shadow-sm"
                      : "text-[var(--colorNeutralForeground1)]"
                      }`}
                    onClick={() => handleNavItemClick(item.name, item.path)}
                  >
                    <Icon
                      className="w-5 h-5 flex-shrink-0"
                      primaryFill={
                        isActive ? "var(--colorBrandBackground)" : "#424242"
                      }
                    />
                    <Text style={{ fontSize: "12px" }} className="ml-3 font-medium whitespace-nowrap overflow-hidden text-ellipsis flex-grow">
                      <p className="truncate">{item.name}</p>
                    </Text>
                    {item.name === "Approvals" && pendingApprovalsTotal > 0 && (
                      <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 ml-1" />
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-grow overflow-hidden">
          {/* <BackgroundWrapper varient={findBackgroundType() ? 'gradient' : 'plane'}> */}
          <BackgroundWrapper variant={findBackgroundType()}>
            {/* Header */}
            <div className="flex items-center min-h-14 px-4 border-b border-gray-200 shadow-sm z-20">
              <Button
                appearance="subtle"
                icon={isExpanded ? <PanelRightRegular /> : <PanelLeftRegular />}
                onClick={toggleSidebar}
                aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
                className="hover:bg-gray-100 transition-colors duration-200"
              />

              {/* Breadcrumb navigation in header */}
              <div className="flex items-center ml-4">
                {breadcrumbs.map((item, index) => {
                  const BreadcrumbIcon =
                    index === breadcrumbs.length - 1 && item.activeIcon
                      ? item.activeIcon
                      : item.icon;

                  return (
                    <React.Fragment key={item.path || index}>
                      {index > 0 && (
                        <span className="mx-3 text-gray-300 font-light">/</span>
                      )}
                      <div
                        className={`flex items-center cursor-pointer transition-colors duration-200 hover:text-[var(--colorBrandBackground)] ${index === breadcrumbs.length - 1
                          ? "text-xl text-[var(--colorNeutralForeground1)]"
                          : "text-sm text-gray-500"
                          }`}
                        onClick={() => navigate(item.path)}
                      >
                        <Text
                          className={`font-semibold ${index === breadcrumbs.length - 1
                            ? "text-xl text-[var(--colorNeutralForeground1)]"
                            : "text-sm text-gray-500"
                            }`}
                        >
                          {item.module}
                        </Text>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* User Avatar and Menu (for expanded sidebar) */}
              {!isTeamsContext ? (
                <>
                  <div className="ml-auto flex items-center gap-2">

                    {location.pathname.toLowerCase().startsWith('/asset') && (
                      <div
                        onClick={() => navigate('/Asset/search')}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: 'white',
                          border: '1px solid #ccc',
                          borderRadius: '20px',
                          padding: '6px 14px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          marginRight: '8px',
                          gap: '6px'
                        }}
                      >
                        <SearchRegular style={{ color: '#666', fontSize: '16px' }} />
                        <span style={{ color: '#666', fontSize: '13px', fontWeight: '500' }}>Search Asset</span>
                      </div>
                    )}

                    <FluentProvider className="!rounded-full flex items-center gap-3 !bg-transparent" style={{ border: 'none' }}>
                      <Popover
                        withArrow
                        open={isPopoverOpen}
                        onOpenChange={(event, data) => setIsPopoverOpen(data.open)}
                        positioning="below-end"
                      >
                        <PopoverTrigger>
                          <div style={{ border: 'none', backgroundColor: 'transparent' }}>
                            <GridDotsFilled
                              style={{ border: 'none', backgroundColor: 'transparent' }}
                              color="#384959"
                              className="h-5 w-5 cursor-pointer"
                              onClick={() => setIsPopoverOpen(!isPopoverOpen)} // Toggle popover on icon click
                            />
                          </div>
                        </PopoverTrigger>
                        <PopoverSurface className="grid grid-cols-3 gap-3">
                          {
                            (checkPermission("recruit.job_posting.view_job.view_all") ||
                              checkPermission("recruit.job_posting.view_job.view_my") ||
                              checkPermission("recruit.job_posting.create_job") ||
                              checkPermission("recruit.job_posting.edit_job") ||
                              checkPermission("recruit.job_posting.delete_job") ||
                              checkPermission("recruit.candidate_app.manage_app") ||
                              checkPermission("recruit.candidate_app.approve_reject_app") ||
                              checkPermission("recruit.interview_schedule.create_interview") ||
                              checkPermission("recruit.interview_schedule.modify_interview") ||
                              checkPermission("recruit.interview_feedback.view_all_feedback") ||
                              checkPermission("recruit.interview_feedback.view_my_feedback") ||
                              checkPermission("recruit.recruit_dashboard.view_my") ||
                              checkPermission("recruit.recruit_dashboard.view_all")) &&
                            <div
                              onClick={() => handleImageClick(checkPermission("recruit.recruit_dashboard.view_my") ? 'recruit/hrinfodashboard' : checkPermission("recruit.recruit_dashboard.view_all") ? 'recruit/managementdashboard' : 'recruit')}
                              style={{
                                backgroundColor: getImageBackgroundColor("/recruit"),
                                borderRadius: "12px",
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                                padding: '10px 5px',
                                cursor: 'pointer',
                                transition: "background-color 0.3s ease",
                              }}
                            >
                              <img
                                src="RecruitIcon.png"
                                alt="icon1"
                                style={{
                                  height: "40px",
                                  width: "40px",
                                }}
                              />
                              <span>Recruit</span>
                            </div>
                          }

                          {
                            (checkPermission("background_verification.bgv_view.view_all_bgv") ||
                              checkPermission("background_verification.bgv_view.view_my_bgv") ||
                              checkPermission("background_verification.bgv_manage.create_bgv") ||
                              checkPermission("background_verification.bgv_manage.edit_bgv") ||
                              checkPermission("background_verification.bgv_manage.delete_bgv") ||
                              checkPermission("background_verification.bgv_approve") ||
                              checkPermission("background_verification.bgv_close")) &&

                            <div
                              onClick={() => handleImageClick('/BGV')}
                              style={{
                                backgroundColor: getImageBackgroundColor("/BGV"),
                                borderRadius: "12px",
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                                padding: '10px 5px',
                                cursor: 'pointer',
                                transition: "background-color 0.3s ease",
                              }}
                            >
                              <img
                                src="BGVIcon.png"
                                alt="icon2"
                                style={{
                                  height: "40px",
                                  width: "40px",
                                }}
                              />
                              <span>BGV</span>
                            </div>
                          }
                          {
                            (checkPermission("onboarding.onboarding_tasks.view_all_tasks") ||
                              checkPermission("onboarding.onboarding_tasks.view_my_tasks") ||
                              checkPermission("onboarding.manage_onboarding.create_onboarding") ||
                              checkPermission("onboarding.manage_onboarding.edit_onboarding") ||
                              checkPermission("onboarding.manage_onboarding.delete_onboarding") ||
                              checkPermission("onboarding.employee_management")) &&
                            <div
                              onClick={() => handleImageClick('/Induction')}
                              style={{
                                backgroundColor: getImageBackgroundColor("/Induction"),
                                borderRadius: "12px",
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                                padding: '10px 5px',
                                cursor: 'pointer',
                                transition: "background-color 0.3s ease",
                              }}
                            >
                              <img
                                src="InductionIcon.png"
                                alt="icon3"
                                style={{
                                  height: "40px",
                                  width: "40px",
                                }}
                              />
                              <span>Onboarding</span>
                            </div>
                          }

                          {
                            (checkPermission("offboarding.offboarding_view.view_all_offboarding") ||
                              checkPermission("offboarding.offboarding_view.view_my_offboarding") ||
                              checkPermission("offboarding.offboarding_manage.create_offboarding") ||
                              checkPermission("offboarding.offboarding_manage.edit_offboarding") ||
                              checkPermission("offboarding.offboarding_manage.delete_offboarding") ||
                              checkPermission("offboarding.lead_clearance") ||
                              checkPermission("offboarding.it_clearance") ||
                              checkPermission("offboarding.asset_clearance") ||
                              checkPermission("offboarding.finance_clearance"))
                            &&
                            <div
                              onClick={() => handleImageClick('/offboard')}
                              style={{
                                backgroundColor: getImageBackgroundColor("/offboard"),
                                borderRadius: "12px",
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                                padding: '10px 5px',
                                cursor: 'pointer',
                                transition: "background-color 0.3s ease",
                              }}
                            >
                              <img
                                src="OffboardingIcon.png"
                                alt="icon4"
                                style={{
                                  height: "40px",
                                  width: "40px",
                                }}
                              />
                              <span>Offboarding</span>
                            </div>
                          }

                          {
                            (checkPermission("attendance.entra_ad_users.view_all") ||
                              checkPermission("attendance.entra_ad_users.view_my") ||
                              checkPermission("attendance.dashboard.employee_dashboard") ||
                              checkPermission("attendance.dashboard.manager_dashboard") ||
                              checkPermission("attendance.dashboard.admin_dashboard") ||
                              checkPermission("attendance.manager_approvals") ||
                              checkPermission("attendance.shift_template") ||
                              checkPermission("attendance.holiday_management") ||
                              checkPermission("attendance.leave_policy")
                            ) &&
                            <div
                              onClick={() => handleImageClick('/Attendance')}
                              style={{
                                backgroundColor: getImageBackgroundColor("/Attendance"),
                                borderRadius: "12px",
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                                padding: '10px 5px',
                                cursor: 'pointer',
                                transition: "background-color 0.3s ease",
                              }}
                            >
                              <img
                                src="attendance.png"
                                alt="iconAttendance"
                                style={{
                                  height: "40px",
                                  width: "40px",
                                }}
                              />
                              <span>Attendance</span>
                            </div>
                          }

                          <div
                            onClick={() => handleImageClick('/Asset')}
                            style={{
                              backgroundColor: getImageBackgroundColor("/Asset"),
                              borderRadius: "12px",
                              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                              padding: '10px 5px',
                              cursor: 'pointer',
                              transition: "background-color 0.3s ease",
                            }}
                          >
                            <img
                              src="Asset.png"
                              alt="iconAsset"
                              style={{
                                height: "40px",
                                width: "40px",
                              }}
                            />
                            <span>Asset</span>
                          </div>

                          {

                            (checkPermission("permissions.permission_matrix") ||
                              checkPermission("permissions.user_role_management") ||
                              checkPermission("recruit.job_role") ||
                              checkPermission("recruit.hiring_template") ||
                              checkPermission("recruit.location") ||
                              checkPermission("recruit.department") ||
                              checkPermission("recruit.recruit_dashboard") ||
                              checkPermission("recruit.hr_mapping") ||
                              checkPermission("background_verification.document_management") ||
                              checkPermission("onboarding.induction_tasks") ||
                              checkPermission("offboarding.it_activity_management") ||
                              checkPermission("offboarding.admin_activity_management") ||
                              checkPermission("offboarding.finance_activity_management")) &&

                            <div
                              onClick={() => handleImageClick('/ManagementHub')}
                              style={{
                                backgroundColor: getImageBackgroundColor("/ManagementHub"),
                                borderRadius: "12px",
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                                padding: '10px 5px',
                                cursor: 'pointer',
                                transition: "background-color 0.3s ease",
                              }}
                            >
                              <img
                                src="ManagementIcon.png"
                                alt="icon5"
                                style={{
                                  height: "40px",
                                  width: "40px",
                                }}
                              />
                              <span>Configuration Hub</span>
                            </div>

                          }
                        </PopoverSurface>
                      </Popover>

                      <Popover withArrow>
                        <PopoverTrigger disableButtonEnhancement>
                          <Avatar
                            className="hover:cursor-pointer hover:shadow-md transition-shadow duration-200"
                            name={currentUser.displayName}
                            image={{
                              src: currentUser.image,
                            }}
                          />
                        </PopoverTrigger>

                        <PopoverSurface>
                          <div className="flex flex-col gap-4 p-2">
                            <Persona
                              name={currentUser.displayName}
                              secondaryText={currentUser.email}
                              avatar={{
                                image: {
                                  src: currentUser.image,
                                },
                              }}
                            />
                            <Button
                              onClick={logout}
                              appearance="transparent"
                              icon={<SignOutRegular className="text-red-500" />}
                            >
                              <span className="text-red-500">Sign Out</span>
                            </Button>
                          </div>
                        </PopoverSurface>
                      </Popover>
                    </FluentProvider>
                  </div>
                </>
              ) : (
                <></>
              )}
            </div>

            {/* Main Content Area */}
            <FluentProvider className="flex-grow overflow-auto !bg-transparent">
              <div className="max-w-full   mx-auto h-[91vh]  flex justify-center items-end">
                <div
                  id="mainContainer"
                  style={{
                    padding: "16px",
                    width: "100%",
                    height: "100%",
                    overflowY: "auto",
                  }}
                >
                  <Routes>
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/termsofuse" element={<TermsOfUse />} />
                    {/* <Route path="/Home" element={<Dashboard />} /> */}
                    <Route path="/recruit" element={<RecruitDashboard />} />

                    <Route path="/recruit">
                      <Route index element={<RecruitDashboard />} />
                      <Route path="managementdashboard" element={<AdminDashboard />} />
                      <Route path="hrinfodashboard" element={<HRInfoDashboard />} />
                      <Route path="newJDForm" element={<NewJDForm />} />
                      <Route path="editJD/:Id" element={<EditJDForm />} />
                      <Route path="previewJD/:Id" element={<JDPreviewPage />} />
                      <Route path="jdoverview/:Id" element={<JDOverview />} />
                      <Route
                        path="HiringDashboard"
                        element={<HiringDashboard />}
                      />
                    </Route>
                    <Route path="/Induction">
                      <Route index element={<EmployeeInductionDashboard />} />
                      <Route
                        path="NewInductionForm"
                        element={<EmployeeInductionForm />}
                      />
                      <Route
                        path="ExistingInductionForm/:Id"
                        element={<ExistingInductionForm />}
                      />
                      <Route
                        path="EmployeeManagement"
                        element={<RouteProtection requiredPermission="recruit.create_ad"><EmployeeManagement /></RouteProtection>}
                      />
                      <Route
                        path="EmployeeManagement/preview/:employeeId"
                        element={<RouteProtection requiredPermission="recruit.create_ad"><EmployeePreview /></RouteProtection>}
                      />
                    </Route>
                    <Route path="/offboard">
                      <Route index element={<EmployeeOffboardingDashboard />} />
                      <Route
                        path="offboardForm"
                        element={<OffboardingForm />}
                      />
                      <Route
                        path=":Id"
                        element={<ExistingOffboardingClearance />}
                      />
                      <Route
                        path="LeadClearance"
                        element={<LeadClearanceDashboard />}
                      />
                      <Route
                        path="LeadClearance/:Id"
                        element={<LeadClearance />}
                      />
                      <Route
                        path="ITClearance"
                        element={<ITClearanceDashboard />}
                      />
                      <Route
                        path="ITClearance/:Id"
                        element={<ClearanceFromITHead />}
                      />
                      <Route
                        path="AdminClearance"
                        element={<AdminClearanceDashboard />}
                      />
                      <Route
                        path="AdminClearance/:Id"
                        element={<ClearanceFromAdmin />}
                      />
                      <Route
                        path="LeadKtClearance"
                        element={<LeadKtClearenceDashboard />}
                      />
                      <Route
                        path="LeadKtClearance/:Id"
                        element={<LeadKtClearance />}
                      />
                      <Route
                        path="FinanceClearance"
                        element={<FinanceClearanceDashboard />}
                      />
                      <Route
                        path="FinanceClearance/:Id"
                        element={<ClearanceFromFinance />}
                      />
                    </Route>

                    <Route path="/BGV">
                      <Route index element={<EmployeeDashboard />} />
                      <Route path="NewBGVForm" element={<EmployeeBGVForm />} />
                      <Route path=":Id" element={<EmployeeBGVForm />} />
                      <Route path=":Id/view" element={<EmployeeBGVForm />} />
                    </Route>

                    <Route path="/Attendance">
                      <Route index element={<RouteProtection><PrimaryDashboard /></RouteProtection>} />
                      {/* <Route path="ManagerDashboard" element={<RouteProtection><ManagerDashboard /></RouteProtection>} /> */}
                      <Route path="TeamView" element={<RouteProtection requiredPermission="attendance.dashboard.manager_dashboard"><TeamView /></RouteProtection>} />
                      <Route path="ManagerReport" element={<RouteProtection requiredPermission="attendance.dashboard.manager_dashboard"><ManagerReport /></RouteProtection>} />
                      {/* <Route index path="AdminDashboard" element={<RouteProtection><AttendanceAdminDashboard /></RouteProtection>} /> */}
                      <Route path="AdminAttendanceReport" element={<RouteProtection requiredPermission="attendance.dashboard.admin_dashboard"><AdminAttendanceReport /></RouteProtection>} />
                      <Route path="ManagementDashboard" element={<RouteProtection requiredPermission="attendance.dashboard.admin_dashboard"><ManagementDashboard /></RouteProtection>} />
                      <Route path="Management" element={<RouteProtection requiredPermission={["attendance.entra_ad_users.view_all", "attendance.entra_ad_users.view_my"]}><AttendanceMonitoring /></RouteProtection>} />
                      <Route path="ShiftManagement" element={<RouteProtection requiredPermission={["attendance.entra_ad_users.view_all", "attendance.entra_ad_users.view_my"]}><AttendanceMonitoring /></RouteProtection>} />
                      <Route path="Approvals" element={<RouteProtection requiredPermission="attendance.manager_approvals"><AttendanceApprovals /></RouteProtection>} />
                      <Route path="History" element={<RouteProtection><AttendanceHistory /></RouteProtection>} />
                      <Route path="MyRequests" element={<RouteProtection><MyRequests /></RouteProtection>} />
                    </Route>

                    <Route path="/Asset" element={<AssetSectionLayout />}>
                      <Route index element={<AssetInventory />} />

                      <Route path="non-it-assets/:id" element={<NonITAssetDetail />} />
                      <Route path="my-requests" element={<MyAssetRequests />} />
                      <Route path="new-request" element={<NewAssetRequest />} />
                      <Route path="manager-approval" element={<ManagerApproval />} />
                      <Route path="admin-approval" element={<AdminApproval />} />
                      <Route path="employees" element={<EmployeesAssetList />} />
                      <Route path="employees/:userId" element={<EmployeeAssetDetail />} />
                      <Route path="admin-dashboard" element={<AssetAdminDashboard />} />
                      <Route path="reports" element={<AssetReports />} />
                      <Route path="hr-dashboard" element={<HRDashboard />} />
                      <Route path="hr-my-dashboard" element={<HRMyDashboard />} />
                      <Route path="organization-dashboard" element={<OrganizationDashboard />} />
                      <Route path="hr-requests/:id" element={<HRRequestFullDetail />} />
                      <Route path="my-assets" element={<EmployeeMyAssets />} />
                      <Route path="my-assets/handover" element={<AssetHandoverRequestForm />} />
                      <Route path="my-assets/:assetId" element={<EmployeeMyAssetDetail />} />
                      <Route path="manager-dashboard" element={<AssetManagerDashboard />} />
                      <Route path=":id" element={<AssetDetail />} />
                      <Route path="search" element={<SearchAssets />} />
                    </Route>

                    <Route path="/ManagementHub">
                      <Route index element={<ManagementHub />} />
                      <Route path="JobPosting" element={<RouteProtection requiredPermission="recruit.job_role"><JobPosting /></RouteProtection>} />
                      <Route
                        path="HiringTemplate"
                        element={<RouteProtection requiredPermission="recruit.hiring_template"><InterviewStageManager /></RouteProtection>}
                      />
                      <Route path="Location" element={<RouteProtection requiredPermission="recruit.location"><Location /></RouteProtection>} />
                      <Route path="Department" element={<RouteProtection requiredPermission="recruit.department"><Department /></RouteProtection>} />
                      <Route path="hr_mapping" element={<RouteProtection requiredPermission="recruit.hr_mapping"><HrMapping /></RouteProtection>} />
                      <Route path="ShiftTemplate" element={<RouteProtection requiredPermission="attendance.shift_template"><ShiftManagement /></RouteProtection>} />
                      <Route
                        path="PermissionMatrix"
                        element={<RouteProtection requiredPermission="permissions.permission_matrix"><PermissionMatrix /></RouteProtection>}
                      />
                      <Route
                        path="UserRoleManagement"
                        element={<RouteProtection requiredPermission="permissions.user_role_management"><UserRoleManagement /></RouteProtection>}
                      />

                      <Route
                        path="LeavePolicy"
                        element={<RouteProtection requiredPermission="attendance.leave_policy"><LeavePlolicy /></RouteProtection>}
                      />

                      <Route
                        path="InductionTasks"
                        element={<RouteProtection requiredPermission="onboarding.induction_tasks"><InductionTasks /></RouteProtection>}
                      />
                      <Route
                        path="DocumentManagement"
                        element={<RouteProtection requiredPermission="background_verification.document_management"><DocumentManagement /></RouteProtection>}
                      />
                      <Route
                        path="ITActivitiesManagement"
                        element={<RouteProtection requiredPermission="offboarding.it_activity_management"><ITActivitiesManagement /></RouteProtection>}
                      />
                      <Route
                        path="AdminActivityManagement"
                        element={<RouteProtection requiredPermission="offboarding.admin_activity_management"><AdminActivityManagement /></RouteProtection>}
                      />

                      <Route
                        path="FinanceActivityManagement"
                        element={<RouteProtection requiredPermission="offboarding.finance_activity_management"><FinanceActivityManagement /></RouteProtection>}
                      />
                      <Route
                        path="HolidayManagement"
                        element={<RouteProtection requiredPermission="attendance.holiday_management"><HolidayManagement /></RouteProtection>}
                      />
                      <Route
                        path="AttendanceConfig"
                        element={<RouteProtection requiredPermission="attendance.leave_policy"><AttendanceConfigSettings /></RouteProtection>}
                      />
                      <Route path="AssetConfiguration" element={<AssetCompactScope><AssetConfiguration /></AssetCompactScope>} />
                      <Route path="AssetSLAConfiguration" element={<AssetCompactScope><AssetSLAConfiguration /></AssetCompactScope>} />
                    </Route>

                    <Route path="*" element={<Navigate to={(checkPermission("attendance.dashboard.employee_dashboard") || checkPermission("attendance.dashboard.admin_dashboard") || checkPermission("attendance.dashboard.manager_dashboard")) ? "/Attendance" : checkPermission("recruit.recruit_dashboard.view_all") ? "/recruit/managementdashboard" : checkPermission("recruit.recruit_dashboard.view_my") ? "/recruit/hrinfodashboard" : "/Attendance"} />} />
                  </Routes>
                </div>
              </div>
            </FluentProvider>
          </BackgroundWrapper>
        </div>
      </div>
    </FluentProvider>
  );
};

// Main component that wraps everything with the router
const ResponsiveSidebar = () => {
  return (
    <FluentProvider
      theme={teamsLightTheme}
      className="flex flex-col h-screen w-full bg-[var(--colorBrandBackground2Pressed)] text-[var(--colorNeutralForeground1)]"
    >
      <Router>
        <SidebarContent />
      </Router>
    </FluentProvider>
  );
};

export default ResponsiveSidebar;
