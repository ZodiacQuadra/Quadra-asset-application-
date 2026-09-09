import { useAuth } from "../Auth/AuthProvider";
import { authEvents } from "../Auth/authEvents";

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL as string;

/**
 * React hook that provides a typed API client with automatic token management.
 *
 * - Calls getAccessToken() before every request — returns cached token if fresh,
 *   refreshes via OBO/MSAL if near expiry.
 * - On 401: attempts one token refresh and retries the request.
 * - On second consecutive 401: emits session-timeout and throws.
 *
 * Usage:
 *   const api = useApiClient();
 *   const data = await api.get<Applicant[]>("/applicant");
 */
export const useApiClient = () => {
  const { getAccessToken } = useAuth();

  const makeRequest = async (
    endpoint: string,
    options: RequestInit = {},
  ): Promise<Response> => {
    let token = await getAccessToken();
    if (!token) {
      authEvents.emit("session-timeout");
      throw new Error("Authentication required — no token available");
    }

    const buildHeaders = (t: string): Record<string, string> => ({
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
      Authorization: `Bearer ${t}`,
    });

    const url = `${BACKEND_URL}${endpoint}`;
    let response = await fetch(url, { ...options, headers: buildHeaders(token) });

    // 401: attempt one refresh and retry
    if (response.status === 401) {
      const freshToken = await getAccessToken();
      if (freshToken && freshToken !== token) {
        response = await fetch(url, { ...options, headers: buildHeaders(freshToken) });
      } else {
        // Refresh returned same or no token — session is truly expired
        authEvents.emit("session-timeout");
        throw new Error("Session expired");
      }
    }

    // 403: user is authenticated but blocked — guest or foreign-tenant account.
    // Do NOT redirect to login (that creates a loop). Surface the error message instead.
    if (response.status === 403) {
      const body = await response.json().catch(() => ({}));
      const message = (body as any)?.message ?? "Access denied. You do not have permission to use this application.";
      authEvents.emit("access-denied", message);
      throw new Error(message);
    }

    return response;
  };

  const handleResponse = async <T>(response: Response): Promise<T> => {
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(
        (body as any)?.message ?? `Request failed: ${response.status}`,
      );
    }
    return response.json() as Promise<T>;
  };

  return {
    get<T = unknown>(endpoint: string): Promise<T> {
      return makeRequest(endpoint, { method: "GET" }).then((r) =>
        handleResponse<T>(r),
      );
    },
    post<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
      return makeRequest(endpoint, {
        method: "POST",
        body: data !== undefined ? JSON.stringify(data) : undefined,
      }).then((r) => handleResponse<T>(r));
    },
    put<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
      return makeRequest(endpoint, {
        method: "PUT",
        body: data !== undefined ? JSON.stringify(data) : undefined,
      }).then((r) => handleResponse<T>(r));
    },
    delete<T = unknown>(endpoint: string, data?: unknown): Promise<T> {
      return makeRequest(endpoint, {
        method: "DELETE",
        body: data !== undefined ? JSON.stringify(data) : undefined,
      }).then((r) => handleResponse<T>(r));
    },
  };
};
