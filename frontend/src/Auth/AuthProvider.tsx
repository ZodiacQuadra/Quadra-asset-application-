import React, { createContext, useContext, useMemo, useState } from "react";

export type AppRole = "admin" | "manager" | "hr" | "employee";

export interface LocalUser {
  userID: string;
  displayName: string;
  email: string;
  roleName: string;
  baseRoleName: string;
  department?: string;
  permissions: Record<string, boolean>;
  group: string | null;
}

export const ROLE_PROFILES: Record<AppRole, LocalUser> = {
  admin: {
    userID: "local-admin",
    displayName: "Local Asset Administrator",
    email: "admin@quadrasystems.net",
    roleName: "Administrator",
    baseRoleName: "Administrator",
    department: "IT Infrastructure",
    permissions: { asset: true, admin: true, manager: true, employee: true, hr: true },
    group: "IT Operations",
  },
  manager: {
    userID: "manager-mani",
    displayName: "Manikandan R",
    email: "manikandan.r@quadrasystems.net",
    roleName: "Manager",
    baseRoleName: "Manager",
    department: "Engineering",
    permissions: { asset: true, admin: false, manager: true, employee: true, hr: false },
    group: "CAISG",
  },
  hr: {
    userID: "hr-praveen",
    displayName: "Praveen Kumar R",
    email: "praveen.hr@quadrasystems.net",
    roleName: "HR",
    baseRoleName: "HR",
    department: "Human Resources",
    permissions: { asset: true, admin: false, manager: false, employee: true, hr: true },
    group: "People Operations",
  },
  employee: {
    userID: "emp-sarah",
    displayName: "Sarah Johnson",
    email: "sarah.j@quadrasystems.net",
    roleName: "Employee",
    baseRoleName: "Employee",
    department: "Frontend Engineering",
    permissions: { asset: true, admin: false, manager: false, employee: true, hr: false },
    group: "CAISG",
  },
};

export interface LocalAuthContext {
  currentUser: LocalUser;
  activeRole: AppRole;
  setActiveRole: (role: AppRole) => void;
  accessToken: string;
  isInitialized: boolean;
  isLoading: boolean;
  isUserDataLoading: boolean;
  isTeamsContext: boolean;
  isGroupLoading: boolean;
  isRefreshingToken: boolean;
  error: null;
  login: () => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<string>;
  getAccessToken: () => Promise<string>;
  refreshPermissions: () => Promise<void>;
  refreshGroup: () => Promise<void>;
  refreshCalendar: () => Promise<void>;
}

const localToken = "local-development-token";

const defaultContext: LocalAuthContext = {
  currentUser: ROLE_PROFILES.admin,
  activeRole: "admin",
  setActiveRole: () => undefined,
  accessToken: localToken,
  isInitialized: true,
  isLoading: false,
  isUserDataLoading: false,
  isTeamsContext: false,
  isGroupLoading: false,
  isRefreshingToken: false,
  error: null,
  login: async () => undefined,
  logout: () => undefined,
  refreshToken: async () => localToken,
  getAccessToken: async () => localToken,
  refreshPermissions: async () => undefined,
  refreshGroup: async () => undefined,
  refreshCalendar: async () => undefined,
};

const AuthContext = createContext<LocalAuthContext>(defaultContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRoleState] = useState<AppRole>(() => {
    try {
      const saved = localStorage.getItem("quadra_active_role") as AppRole;
      if (saved && ROLE_PROFILES[saved]) return saved;
    } catch {
      // ignore
    }
    return "admin";
  });

  const setActiveRole = (role: AppRole) => {
    try {
      localStorage.setItem("quadra_active_role", role);
    } catch {
      // ignore
    }
    setActiveRoleState(role);
  };

  const currentUser = useMemo(() => ROLE_PROFILES[activeRole], [activeRole]);

  const value = useMemo<LocalAuthContext>(
    () => ({
      ...defaultContext,
      currentUser,
      activeRole,
      setActiveRole,
    }),
    [currentUser, activeRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

