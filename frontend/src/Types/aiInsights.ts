
export interface ImmediateAction {
  action: string;
  severity: "high" | "medium" | "low";
}

export interface AttendanceInsights {
  immediateActions: ImmediateAction[];
}

// ── Raw Data ─────────────────────────────────────────────────────────

export interface OverallSummary {
  TotalEmployees: number;
  WorkingDays: number;
  AvgAttendancePct: number;
  TotalPresentRecords: number;
  TotalLateArrivals: number;
  TotalGeoFenceViolations: number;
  OnTimePct: number;
  LatePct: number;
  OnLeavePct: number;
  AbsentPct: number;
  TotalApprovedLeaves: number;
  TotalPermissions: number;
  TotalRegularize: number;
}

export interface DepartmentSummary {
  Department: string;
  HeadCount: number;
  PresentDays: number;
  LateArrivals: number;
  GeoFenceViolations: number;
  ApprovedLeaves: number;
  AttendancePct: number;
}

export interface LateAnomaly {
  EmployeeName: string;
  Department: string;
  TotalLateCount: number;
  LateCountLastMonth: number;
  Approved: number;
  Rejected: number;
  Pending: number;
  FirstOccurrence: string;
  LastOccurrence: string;
}

export interface GeofenceAnomaly {
  EmployeeName: string;
  Department: string;
  TotalViolations: number;
  Approved: number;
  Rejected: number;
  Pending: number;
  LastOccurrence: string;
}

export interface LeaveAnomaly {
  EmployeeName: string;
  Department: string;
  TotalLeaves: number;
  Approved: number;
  Rejected: number;
  Pending: number;
  MondayLeaves: number;
  FridayLeaves: number;
}

export interface PermissionAnomaly {
  EmployeeName: string;
  Department: string;
  TotalPermissions: number;
  Approved: number;
  Rejected: number;
  Pending: number;
  LastOccurrence: string;
}

export interface RegularizationAnomaly {
  EmployeeName: string;
  Department: string;
  TotalRegularize: number;
  Approved: number;
  Rejected: number;
  Pending: number;
  LastOccurrence: string;
}

export interface RawData {
  summary: OverallSummary;
  departments: DepartmentSummary[];
  employeeCount: number;
  lateAnomalies: LateAnomaly[];
  geofenceAnomalies: GeofenceAnomaly[];
  leaveAnomalies: LeaveAnomaly[];
  permAnomalies: PermissionAnomaly[];
  regAnomalies: RegularizationAnomaly[];
}

// ── Top-level Response ────────────────────────────────────────────────

export interface AttendanceInsightsData {
  period: { startDate: string; endDate: string };
  scope: "team" | "organisation";
  insights: AttendanceInsights;
  rawData: RawData;
  cached: boolean;
  cachedAt: string | null;
}

export interface AttendanceInsightsResponse {
  success: boolean;
  data: AttendanceInsightsData;
}
