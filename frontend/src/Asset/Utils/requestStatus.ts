import { RequestOverallStatus } from "../Services/AssetInventoryService";

export type RequestStatusTabValue = RequestOverallStatus | "All";

// Single source of truth for the request-status taxonomy shown across
// My Requests, Manager Approval, and Admin Approval — every request sits in
// exactly one of these seven buckets (mutually exclusive), so the same tab
// set and labels apply consistently everywhere.
export const REQUEST_STATUS_TABS: { label: string; value: RequestStatusTabValue }[] = [
  { label: "All", value: "All" },
  { label: "Manager Pending", value: "ManagerPending" },
  { label: "Manager Reprogress", value: "ManagerReprogress" },
  { label: "Manager Rejected", value: "ManagerRejected" },
  { label: "Admin Pending (Manager Approved)", value: "AdminApprovalPending" },
  { label: "Admin Reprogress", value: "AdminReprogress" },
  { label: "Admin Approved", value: "AdminApproved" },
  { label: "Admin Rejected", value: "AdminRejected" },
];

export const REQUEST_STATUS_LABEL: Record<RequestOverallStatus, string> = {
  ManagerPending: "Manager Pending",
  ManagerReprogress: "Manager Reprogress",
  ManagerRejected: "Manager Rejected",
  AdminApprovalPending: "Admin Pending (Manager Approved)",
  AdminReprogress: "Admin Reprogress",
  AdminApproved: "Admin Approved",
  AdminRejected: "Admin Rejected",
  PendingManagerApproval: "Manager Pending",
  PendingAdminApproval: "Admin Pending (Manager Approved)",
  Completed: "Admin Approved",
};

export const REQUEST_STATUS_COLOR: Record<RequestOverallStatus, "success" | "warning" | "danger" | "informative"> = {
  ManagerPending: "warning",
  ManagerReprogress: "warning",
  ManagerRejected: "danger",
  AdminApprovalPending: "informative",
  AdminReprogress: "warning",
  AdminApproved: "success",
  AdminRejected: "danger",
  PendingManagerApproval: "warning",
  PendingAdminApproval: "informative",
  Completed: "success",
};

// Live per-tab counts for the status filter row — "All" is the total, every
// other tab is however many of the given requests currently sit in that
// bucket. Used identically on My Requests, Manager Approval, and Admin
// Approval so the same requests array always produces the same counts.
export const getStatusTabCounts = (
  requests: { OverallStatus: RequestOverallStatus }[]
): Record<RequestStatusTabValue, number> => {
  const counts = { All: requests.length } as Record<RequestStatusTabValue, number>;
  REQUEST_STATUS_TABS.forEach((tab) => {
    if (tab.value === "All") return;
    counts[tab.value] = requests.filter((r) => r.OverallStatus === tab.value).length;
  });
  return counts;
};
