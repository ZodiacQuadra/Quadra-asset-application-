

interface CacheEntry {
  data: unknown;
  ts: number;
}

const store = new Map<string, CacheEntry>();


export const CACHE_TTL = {
  status: 30_000, // 30s
  month: 5 * 60_000, // 5m
  holidays: 5 * 60_000, // 5m
  account: 60_000, // 1m 
} as const;

export function getCached<T>(key: string, ttlMs: number): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCached(key: string, data: unknown): void {
  store.set(key, { data, ts: Date.now() });
}

export function invalidate(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

export const cacheKeys = {
  status: (userId: string) => `status:${userId}`,
  month: (userId: string, year: number, month: number) => `month:${userId}:${year}:${month}`,
  holidays: (year: number, location: string | null | undefined) => `holidays:${year}:${location ?? ""}`,
  account: (userId: string) => `account:${userId}`,
};
