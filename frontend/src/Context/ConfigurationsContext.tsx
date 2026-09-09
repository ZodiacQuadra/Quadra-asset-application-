import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getAllShifts, Shift } from "../Services/ShiftService";
import { GetPolicies } from "../Services/LeavePolicyService";
import { getAppLocations, AppLocation } from "../Services/Location";
import { getHolidaysByYear, Holiday } from "../Services/HolidayService";
import { LeavePolicy } from "../Types/LeavePolicyTypes";
import { getAttendanceConfigSettings, AttendanceConfigSetting } from "../Services/AttendanceConfigService";
import { useAuth } from "../Auth/AuthProvider";

interface ConfigurationsContextType {
  holidays: Holiday[];
  shifts: Shift[];
  leavePolicies: LeavePolicy[];
  locations: AppLocation[];
  attendanceConfigs: AttendanceConfigSetting[];
  isLoading: boolean;
  refreshHolidays: () => Promise<void>;
  refreshShifts: () => Promise<void>;
  refreshPolicies: () => Promise<void>;
  refreshLocations: () => Promise<void>;
  refreshAttendanceConfigs: () => Promise<void>;
}

const ConfigurationsContext = createContext<ConfigurationsContextType | null>(null);

export const ConfigurationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leavePolicies, setLeavePolicies] = useState<LeavePolicy[]>([]);
  const [locations, setLocations] = useState<AppLocation[]>([]);
  const [attendanceConfigs, setAttendanceConfigs] = useState<AttendanceConfigSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const {accessToken} = useAuth()

  const refreshHolidays = useCallback(async () => {
    const year = new Date().getFullYear();
    const result = await getHolidaysByYear(year);
    if (result.success && result.data) {
      setHolidays(result.data);
    }
  }, []);

  const refreshShifts = useCallback(async () => {
    const result = await getAllShifts();
    if (result.success && result.data) {
      setShifts(result.data);
    }
  }, []);

  const refreshPolicies = useCallback(async () => {
    if(!accessToken) return
    const result = await GetPolicies(accessToken);
    if (result.data?.data) {
      setLeavePolicies(result.data.data);
    }
  }, []);

  const refreshLocations = useCallback(async () => {
    const locations = await getAppLocations();
    setLocations(locations);
  }, []);

  const refreshAttendanceConfigs = useCallback(async () => {
    if(!accessToken) return
    const configs = await getAttendanceConfigSettings(accessToken);
    setAttendanceConfigs(configs);
  }, [accessToken]);

  useEffect(() => {
    const loadAll = async () => {
      setIsLoading(true);
      await Promise.allSettled([
        refreshHolidays(),
        refreshShifts(),
        refreshPolicies(),
        refreshLocations(),
        refreshAttendanceConfigs(),
      ]);
      setIsLoading(false);
    };

    if (accessToken) {
      loadAll();
    } else {
      // Wait for token to become available
      const interval = setInterval(() => {
        if (accessToken) {
          clearInterval(interval);
          loadAll();
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [refreshHolidays, refreshShifts, refreshPolicies, refreshLocations, refreshAttendanceConfigs,accessToken]);

  return (
    <ConfigurationsContext.Provider
      value={{
        holidays,
        shifts,
        leavePolicies,
        locations,
        attendanceConfigs,
        isLoading,
        refreshHolidays,
        refreshShifts,
        refreshPolicies,
        refreshLocations,
        refreshAttendanceConfigs,
      }}
    >
      {children}
    </ConfigurationsContext.Provider>
  );
};

export const useConfigurations = (): ConfigurationsContextType => {
  const context = useContext(ConfigurationsContext);
  if (!context) {
    throw new Error("useConfigurations must be used within a ConfigurationsProvider");
  }
  return context;
};
