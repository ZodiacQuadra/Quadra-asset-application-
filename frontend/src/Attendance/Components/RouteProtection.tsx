import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../Auth/AuthProvider";
import { getUserAccountStatus } from "../../Services/EntraADUserService";
import { authEvents } from "../../Auth/authEvents";
import { getCached, setCached, cacheKeys, CACHE_TTL } from "../Utils/attendanceCache";
import { Spinner } from "@fluentui/react-components";

// Traverse a dot-path into a nested object and return true only when the
// resolved leaf value is strictly true.
function resolvePath(obj: any, path: string): boolean {
  return path.split(".").reduce((cur, key) => (cur != null ? cur[key] : undefined), obj) === true;
}

const RouteProtection: React.FC<{
  children: React.ReactNode;
  // Single dot-path ("attendance.dashboard.manager_dashboard") or an array of
  // dot-paths where access is granted when ANY one resolves to true (OR logic).
  requiredPermission?: string | string[];
}> = ({ children, requiredPermission }) => {
  const { currentUser, accessToken, refreshToken } = useAuth();
  const location = useLocation();

  const [accountEnabled, setAccountEnabled] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Catch session-timeout events emitted by AuthProvider (e.g. InteractionRequiredAuthError)
  useEffect(() => {
    const handler = () => setSessionExpired(true);
    authEvents.on("session-timeout", handler);
    return () => authEvents.off("session-timeout", handler);
  }, []);

  useEffect(() => {
    // Guard early — no point proceeding without a user or token
    if (!currentUser || !accessToken) {
      setIsLoading(false);
      return;
    }

    // Don't re-run the check if we already know the session is expired
    if (sessionExpired) return;

    const triggerSessionExpired = () => {
      setSessionExpired(true);
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
      }, 3000);
    };

    const fetchAccountStatus = async () => {
      // Serve from the short-lived cache when available. RouteProtection re-runs on
      // every route change (location.pathname), so without this a fresh /status call
      // (plus token refresh) fires on each navigation. Cache is keyed by user and
      // expires after CACHE_TTL.account, so a disabled account is still caught promptly.
      // Only definitive boolean statuses are cached (unknown/null is never stored).
      const cacheKey = currentUser.userID ? cacheKeys.account(currentUser.userID) : null;
      if (cacheKey) {
        const cached = getCached<boolean>(cacheKey, CACHE_TTL.account);
        if (cached !== null) {
          setAccountEnabled(cached);
          setIsLoading(false);
          return;
        }
      }

      setIsLoading(true);

      try {
        const freshToken = await refreshToken();

        // refreshToken returns null when the session is expired (InteractionRequiredAuthError).
        // AuthProvider already emits "session-timeout" in that case, but we guard here too
        // so we never proceed to call getUserAccountStatus with a stale token.
        if (!freshToken) {
          triggerSessionExpired();
          return;
        }

        const response = await getUserAccountStatus(freshToken);
        // console.log("Account Status Response:", response);

        if (response.success) {
          const enabled = response.data?.AccountEnabled ?? null;
          setAccountEnabled(enabled);
          // Cache only definitive booleans so remounts within the TTL skip the call.
          if (cacheKey && typeof enabled === "boolean") setCached(cacheKey, enabled);
        } else {
          // getUserAccountStatus catches internally and returns success:false.
          // Check if the failure message indicates an auth/token issue.
          const errMsg = ((response.message ?? "") + JSON.stringify(response.error ?? "")).toLowerCase();
          const isAuthFailure =
            errMsg.includes("401") ||
            errMsg.includes("403") ||
            errMsg.includes("unauthorized") ||
            errMsg.includes("token") ||
            errMsg.includes("session");

          if (isAuthFailure) {
            triggerSessionExpired();
          } else {
            setAccountEnabled(null);
          }
        }
      } catch (error: any) {
        console.error("Error fetching account status:", error);
        setAccountEnabled(null);

        const isAuthError =
          error?.response?.status === 401 ||
          error?.response?.status === 403 ||
          error?.name === "InteractionRequiredAuthError" ||
          error?.message?.toLowerCase().includes("session") ||
          error?.message?.toLowerCase().includes("token") ||
          error?.message?.toLowerCase().includes("login") ||
          error?.message?.toLowerCase().includes("interaction");

        if (isAuthError) {
          triggerSessionExpired();
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountStatus();
  // location.pathname re-runs the check on every route change (e.g. direct URL paste)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, location.pathname]);

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p className="text-gray-600">You must be logged in to access this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Spinner label="Checking account status..." />
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold text-amber-600">Session Expired</h2>
        <p className="text-gray-600 mt-2">Your session has expired. Redirecting to login...</p>
        <Spinner className="mt-4" />
      </div>
    );
  }

  if (accountEnabled === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold">Account Disabled</h2>
        <p className="text-gray-600">
          Your account is currently disabled. Please contact your administrator for assistance.
        </p>
      </div>
    );
  }

  // Role gate — only evaluated when requiredPermission is explicitly provided.
  // Permissions are always server-fetched (never trusted from storage) so this
  // check is backed by the server's authorisation decision.
  if (requiredPermission) {
    const paths = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    const permitted = paths.some((p) => resolvePath(currentUser.permissions, p));
    if (!permitted) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to view this page.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default RouteProtection;