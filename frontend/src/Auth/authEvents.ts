type AuthEvent = "session-timeout" | "access-denied";

const listeners = new Map<AuthEvent, Set<(message?: string) => void>>();

export const authEvents = {
  on(event: AuthEvent, handler: (message?: string) => void) {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(handler);
  },
  off(event: AuthEvent, handler: (message?: string) => void) {
    listeners.get(event)?.delete(handler);
  },
  emit(event: AuthEvent, message?: string) {
    listeners.get(event)?.forEach((handler) => handler(message));
  },
};

// Allows non-React modules (e.g. StageMaster.ts axios interceptor) to trigger
// a token refresh without importing AuthProvider directly (avoids circular deps).
let _refreshFn: (() => Promise<string | null>) | null = null;

export function registerRefreshFn(fn: () => Promise<string | null>) {
  _refreshFn = fn;
}

export function getRegisteredRefreshFn() {
  return _refreshFn;
}
