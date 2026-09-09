import axios, { AxiosError } from "axios";
import { authEvents, getRegisteredRefreshFn } from "./authEvents";
import { getStoredAuthToken } from "./tokenStorage";

export function setupAxiosInterceptors(): void {
  axios.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as typeof error.config & { _retryAttempted?: boolean };

      if (error.response?.status === 401 && !config?._retryAttempted) {
        config!._retryAttempted = true;
        const refreshFn = getRegisteredRefreshFn();
        if (refreshFn) {
          try {
            const newToken = await refreshFn();
            if (newToken) {
              const token = getStoredAuthToken() ?? newToken;
              config!.headers!.Authorization = `Bearer ${token}`;
              return axios.request(config!);
            }
          } catch {
            // refresh failed — fall through to session-timeout
          }
        }
        authEvents.emit("session-timeout");
      }
      return Promise.reject(error);
    }
  );
}
