import React, { ReactNode, useMemo, useState, useRef, useEffect } from "react";
import { Avatar, Button, FluentProvider, Text, teamsLightTheme } from "@fluentui/react-components";
import {
  ApprovalsApp24Filled,
  ApprovalsApp24Regular,
  BoxToolboxFilled,
  BoxToolboxRegular,
  Checkmark20Filled,
  ChevronDown16Regular,
  ChevronUp16Regular,
  ChevronDown20Regular,
  DocumentAdd24Filled,
  DocumentAdd24Regular,
  Grid20Filled,
  Grid20Regular,
  GridDotsFilled,
  ChartMultiple20Filled,
  ChartMultiple20Regular,
  PanelLeftRegular,
  PanelRightRegular,
  People20Filled,
  People20Regular,
  Search20Filled,
  Search20Regular,
  Search24Regular,
  Person20Regular,
  Briefcase20Regular,
  ShieldCheckmark20Regular,
  VehicleCarProfileRtl20Regular,
} from "@fluentui/react-icons";
import { useLocation, useNavigate } from "react-router-dom";
import BackgroundWrapper from "./dashboards/BackgroundWrapper";
import { useAuth, AppRole, ROLE_PROFILES } from "./Auth/AuthProvider";
import ErrorBoundary from "./Common/ErrorBoundary";

const customTeamsTheme = {
  ...teamsLightTheme,
  colorBrandBackground: "#007ED5",
  colorBrandBackgroundHover: "#0066B3",
  colorBrandBackground2Hover: "#B4E0FF",
  colorBrandBackground2Pressed: "#E6F4FF",
  colorBrandForeground1: "#007ED5",
};

type IconType = React.ComponentType<{ primaryFill?: string; className?: string }>;
type NavItem = { label: string; path: string; icon: IconType; activeIcon: IconType };

const roleNavItems: Record<AppRole, NavItem[]> = {
  admin: [
    { label: "Dashboard", path: "/Asset/dashboard", icon: Grid20Regular, activeIcon: Grid20Filled },
    { label: "Asset Inventory", path: "/Asset/inventory", icon: BoxToolboxRegular, activeIcon: BoxToolboxFilled },
    { label: "Request", path: "/Asset/admin-approval", icon: ApprovalsApp24Regular, activeIcon: ApprovalsApp24Filled },
    { label: "Employee List", path: "/Asset/employees", icon: People20Regular, activeIcon: People20Filled },
    { label: "Report", path: "/Asset/reports", icon: ChartMultiple20Regular, activeIcon: ChartMultiple20Filled },
  ],
  manager: [
    { label: "Dashboard", path: "/Asset/manager-dashboard", icon: Grid20Regular, activeIcon: Grid20Filled },
    { label: "Approvals", path: "/Asset/manager-approval", icon: ApprovalsApp24Regular, activeIcon: ApprovalsApp24Filled },
    { label: "My Request", path: "/Asset/my-requests", icon: DocumentAdd24Regular, activeIcon: DocumentAdd24Filled },
  ],
  hr: [
    { label: "Dashboard", path: "/Asset/hr", icon: Grid20Regular, activeIcon: Grid20Filled },
    { label: "My Request", path: "/Asset/my-requests", icon: DocumentAdd24Regular, activeIcon: DocumentAdd24Filled },
  ],
  employee: [
    { label: "Dashboard", path: "/Asset/my-assets", icon: Grid20Regular, activeIcon: Grid20Filled },
    { label: "My Request", path: "/Asset/my-requests", icon: DocumentAdd24Regular, activeIcon: DocumentAdd24Filled },
  ],
};

const assetTheme = {
  ...customTeamsTheme,
  fontSizeBase300: "14px",
  lineHeightBase300: "19px",
  fontSizeBase400: "15px",
  lineHeightBase400: "20px",
  fontSizeBase600: "18px",
  lineHeightBase600: "24px",
};

function isActivePath(currentPath: string, itemPath: string) {
  if (currentPath === itemPath) return true;
  if (
    itemPath === "/Asset/dashboard" ||
    itemPath === "/Asset/manager-dashboard" ||
    itemPath === "/Asset/hr" ||
    itemPath === "/Asset/my-assets" ||
    itemPath === "/Asset/search"
  ) {
    return currentPath === itemPath;
  }
  return currentPath.startsWith(`${itemPath}/`);
}

const SEARCH_SCOPES = [
  { key: "inventory", label: "Inventory" },
  { key: "maintenances", label: "Maintenances" },
  { key: "warranties", label: "Warranties" },
  { key: "persons", label: "Persons" },
  { key: "vendors", label: "Vendors" },
] as const;

export type SearchScopeKey = (typeof SEARCH_SCOPES)[number]["key"];

export default function AssetShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, activeRole, setActiveRole } = useAuth();

  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [appLauncherOpen, setAppLauncherOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchScope, setSearchScope] = useState<SearchScopeKey>("inventory");
  const [searchScopeOpen, setSearchScopeOpen] = useState(false);

  const roleMenuRef = useRef<HTMLDivElement>(null);
  const appLauncherRef = useRef<HTMLDivElement>(null);
  const searchScopeRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setRoleMenuOpen(false);
      }
      if (appLauncherRef.current && !appLauncherRef.current.contains(event.target as Node)) {
        setAppLauncherOpen(false);
      }
      if (searchScopeRef.current && !searchScopeRef.current.contains(event.target as Node)) {
        setSearchScopeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keep globalSearch and searchScope synced with query params when on /Asset/search
  useEffect(() => {
    if (location.pathname === "/Asset/search") {
      const sp = new URLSearchParams(location.search);
      const q = sp.get("q") || sp.get("keyword") || "";
      if (q !== globalSearch) {
        setGlobalSearch(q);
      }
      const raw = (sp.get("scope") || "inventory").toLowerCase();
      const rawScope = (raw === "customers" ? "vendors" : raw) as SearchScopeKey;
      if (SEARCH_SCOPES.some((s) => s.key === rawScope) && rawScope !== searchScope) {
        setSearchScope(rawScope);
      }
    }
  }, [location.pathname, location.search]);

  const currentNavItems = useMemo(() => roleNavItems[activeRole] || roleNavItems.admin, [activeRole]);

  const roleDashboardPath = useMemo(() => {
    switch (activeRole) {
      case "admin":
        return "/Asset/dashboard";
      case "manager":
        return "/Asset/manager-dashboard";
      case "hr":
        return "/Asset/hr";
      case "employee":
        return "/Asset/my-assets";
      default:
        return "/Asset/dashboard";
    }
  }, [activeRole]);

  const currentPage = useMemo(() => {
    const matched = currentNavItems.find((item) => isActivePath(location.pathname, item.path));
    return matched?.label ?? "Dashboard";
  }, [location.pathname, currentNavItems]);

  const go = (path: string) => {
    navigate(path);
    setMobileOpen(false);
    setAppLauncherOpen(false);
  };

  const handleRoleSelect = (newRole: AppRole) => {
    setActiveRole(newRole);
    setRoleMenuOpen(false);
    switch (newRole) {
      case "admin":
        navigate("/Asset/dashboard");
        break;
      case "manager":
        navigate("/Asset/manager-dashboard");
        break;
      case "hr":
        navigate("/Asset/hr");
        break;
      case "employee":
        navigate("/Asset/my-assets");
        break;
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sp = new URLSearchParams();
    if (searchScope && searchScope !== "inventory") {
      sp.set("scope", searchScope);
    }
    if (globalSearch.trim()) {
      sp.set("q", globalSearch.trim());
    }
    const qStr = sp.toString();
    navigate(`/Asset/search${qStr ? `?${qStr}` : ""}`);
    setSearchScopeOpen(false);
  };

  const handleGoToSearch = () => {
    if (location.pathname !== "/Asset/search") {
      const sp = new URLSearchParams();
      if (searchScope && searchScope !== "inventory") {
        sp.set("scope", searchScope);
      }
      if (globalSearch.trim()) {
        sp.set("q", globalSearch.trim());
      }
      const qStr = sp.toString();
      navigate(`/Asset/search${qStr ? `?${qStr}` : ""}`);
    }
  };

  const handleSelectScope = (scopeKey: SearchScopeKey) => {
    setSearchScope(scopeKey);
    setSearchScopeOpen(false);
    const sp = new URLSearchParams();
    if (scopeKey !== "inventory") {
      sp.set("scope", scopeKey);
    }
    if (globalSearch.trim()) {
      sp.set("q", globalSearch.trim());
    }
    const qStr = sp.toString();
    navigate(`/Asset/search${qStr ? `?${qStr}` : ""}`);
  };

  const modules = [
    { name: "Asset Management", path: roleDashboardPath, icon: "🖥️", active: true },
    { name: "Recruit", path: "/recruit", icon: "👥", active: false },
    { name: "BGV", path: "/BGV", icon: "🛡️", active: false },
    { name: "Onboarding", path: "/Induction", icon: "📋", active: false },
    { name: "Offboarding", path: "/offboard", icon: "🚪", active: false },
    { name: "Attendance", path: "/Attendance", icon: "⏰", active: false },
    { name: "Configuration Hub", path: "/ManagementHub", icon: "⚙️", active: false },
  ];

  return (
    <FluentProvider theme={assetTheme} className="asset-app-root">
      {mobileOpen && <div className="asset-mobile-backdrop" onClick={() => setMobileOpen(false)} />}
      <BackgroundWrapper variant="asset">
        <div className="asset-shell">
          <aside className={`asset-sidebar ${expanded || mobileOpen ? "asset-sidebar-expanded" : ""} ${mobileOpen ? "asset-sidebar-mobile" : ""}`}>
          <button className="asset-brand" onClick={() => go(roleDashboardPath)} aria-label="Go to asset dashboard">
            <img src="/QPeopleIcon.png" alt="Quadra People" />
            {(expanded || mobileOpen) && <span>Quadra People</span>}
          </button>
          <div className="asset-sidebar-label">{expanded || mobileOpen ? "ASSET MANAGEMENT" : "ASSET"}</div>
          <nav className="asset-nav" aria-label="Asset management navigation">
            {currentNavItems.map((item) => {
              const active = isActivePath(location.pathname, item.path);
              const Icon = active ? item.activeIcon : item.icon;
              return (
                <button
                  key={`${item.path}-${item.label}`}
                  className={`asset-nav-item ${active ? "asset-nav-item-active" : ""}`}
                  onClick={() => go(item.path)}
                  title={!expanded && !mobileOpen ? item.label : undefined}
                >
                  <Icon className="asset-nav-icon" primaryFill={active ? "#007ED5" : "#424242"} />
                  {(expanded || mobileOpen) && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="asset-main">
          <header className="asset-header">
              <Button
                appearance="subtle"
                icon={expanded ? <PanelRightRegular /> : <PanelLeftRegular />}
                onClick={() => {
                  setExpanded((value) => !value);
                  setMobileOpen(false);
                }}
                aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
                className="asset-sidebar-toggle"
              />
              <button className="asset-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
                ☰
              </button>

              <div className="asset-breadcrumb">
                <Text
                  size={300}
                  weight="medium"
                  style={{ color: "#64748b", cursor: "pointer" }}
                  onClick={() => navigate(roleDashboardPath)}
                >
                  Dashboard
                </Text>
                {currentPage && currentPage !== "Dashboard" && (
                  <>
                    <span>/</span>
                    <Text size={500} weight="semibold" style={{ color: "#0f172a" }}>
                      {currentPage}
                    </Text>
                  </>
                )}
              </div>

              {/* Connected Global Search Tab in Topbar - Admin Only */}
              {activeRole === "admin" && (
                <div className="asset-topbar-center">
                  <form className="asset-topbar-search-box" onSubmit={handleSearchSubmit}>
                    <Search20Regular
                      style={{ color: "#64748B", fontSize: 16, marginLeft: 2, flexShrink: 0, cursor: "pointer" }}
                      onClick={handleGoToSearch}
                    />
                    <input
                      type="text"
                      className="asset-topbar-search-input"
                      placeholder="Search"
                      value={globalSearch}
                      onChange={(e) => setGlobalSearch(e.target.value)}
                      onClick={handleGoToSearch}
                      onFocus={handleGoToSearch}
                    />
                    <div className="asset-topbar-scope-wrapper" ref={searchScopeRef}>
                      <button
                        type="button"
                        className="asset-topbar-scope-btn"
                        onClick={() => setSearchScopeOpen((prev) => !prev)}
                        aria-expanded={searchScopeOpen}
                        title="Search Category"
                      >
                        <span>
                          {searchScope === "inventory"
                            ? "Asset"
                            : SEARCH_SCOPES.find((s) => s.key === searchScope)?.label || "Asset"}
                        </span>
                        {searchScopeOpen ? (
                          <ChevronUp16Regular style={{ fontSize: 13, color: "#64748B" }} />
                        ) : (
                          <ChevronDown16Regular style={{ fontSize: 13, color: "#64748B" }} />
                        )}
                      </button>

                      {searchScopeOpen && (
                        <div className="asset-topbar-scope-menu">
                          {SEARCH_SCOPES.map((s) => {
                            const isSelected = searchScope === s.key;
                            return (
                              <button
                                key={s.key}
                                type="button"
                                className={`asset-topbar-scope-item ${isSelected ? "active" : ""}`}
                                onClick={() => handleSelectScope(s.key)}
                              >
                                <span>{s.label}</span>
                                {isSelected && <Checkmark20Filled style={{ fontSize: 14, color: "#007ED5" }} />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </form>
                </div>
              )}

              <div className="asset-header-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {/* 9-Dots App Launcher Popover */}
                <div style={{ position: "relative" }} ref={appLauncherRef}>
                  <button
                    type="button"
                    onClick={() => setAppLauncherOpen((prev) => !prev)}
                    title="Quadra People Apps"
                    style={{
                      background: appLauncherOpen ? "#E2E8F0" : "transparent",
                      border: "none",
                      borderRadius: "8px",
                      width: "36px",
                      height: "36px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      color: "#384959",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <GridDotsFilled style={{ fontSize: "20px", color: "#384959" }} />
                  </button>

                  {appLauncherOpen && (
                    <div
                      style={{
                        position: "absolute",
                        top: "44px",
                        right: "0",
                        width: "320px",
                        background: "#FFFFFF",
                        border: "1px solid #E2E8F0",
                        borderRadius: "14px",
                        boxShadow: "0 12px 28px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)",
                        zIndex: 9999,
                        padding: "16px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#64748B",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "12px",
                        }}
                      >
                        Quadra People Modules
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                        {modules.map((m) => (
                          <div
                            key={m.name}
                            onClick={() => go(m.path)}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: "6px",
                              padding: "10px 4px",
                              borderRadius: "10px",
                              background: m.active ? "#EBF3FE" : "#F8FAFC",
                              border: m.active ? "1px solid #B4E0FF" : "1px solid transparent",
                              cursor: "pointer",
                              textAlign: "center",
                              transition: "all 0.15s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!m.active) e.currentTarget.style.background = "#F1F5F9";
                            }}
                            onMouseLeave={(e) => {
                              if (!m.active) e.currentTarget.style.background = "#F8FAFC";
                            }}
                          >
                            <span style={{ fontSize: "22px" }}>{m.icon}</span>
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: m.active ? 700 : 500,
                                color: m.active ? "#007ED5" : "#334155",
                                lineHeight: "1.2",
                              }}
                            >
                              {m.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Role Switcher Dropdown */}
                <div className="asset-role-switcher-container" ref={roleMenuRef}>
                  <button
                    className="asset-role-btn"
                    onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                    title="Change Role"
                  >
                    <span>Role:</span>
                    <span className={`asset-role-badge role-badge-${activeRole}`}>
                      {currentUser.roleName}
                    </span>
                    <ChevronDown20Regular style={{ width: 14, height: 14 }} />
                  </button>

                  {roleMenuOpen && (
                    <div className="asset-role-menu">
                      <div style={{ padding: "6px 8px 4px", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                        Switch User Role
                      </div>
                      {(["admin", "manager", "hr", "employee"] as AppRole[]).map((r) => {
                        const profile = ROLE_PROFILES[r];
                        const isSelected = activeRole === r;
                        return (
                          <button
                            key={r}
                            className={`asset-role-menu-item ${isSelected ? "active" : ""}`}
                            onClick={() => handleRoleSelect(r)}
                          >
                            <div className="asset-role-item-info">
                              <strong>{profile.roleName}</strong>
                              <small>{profile.displayName} ({profile.department})</small>
                            </div>
                            {isSelected && <Checkmark20Filled primaryFill="#007ed5" style={{ width: 16, height: 16 }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div onClick={() => setUserPopupOpen((prev) => !prev)} style={{ cursor: "pointer" }} title="My Profile">
                  <Avatar name={currentUser.displayName} color="brand" size={32} />
                </div>
              </div>
            </header>

            <main className="asset-content">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
        </section>
      </div>
      </BackgroundWrapper>
    </FluentProvider>
  );
}
