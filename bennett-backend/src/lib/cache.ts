import NodeCache from "node-cache";

const cache = new NodeCache({
  stdTTL: Number(process.env.CACHE_TTL_DEFAULT) || 300,
  checkperiod: 60,
  useClones: false,
});

export function cacheGet<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function cacheSet<T>(key: string, value: T, ttl?: number): void {
  if (ttl !== undefined) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
}

export function cacheDel(key: string): void {
  cache.del(key);
}

export function cacheFlushPattern(pattern: string): void {
  const keys = cache.keys();
  for (const key of keys) {
    if (key.startsWith(pattern)) {
      cache.del(key);
    }
  }
}

export function cacheStats() {
  return cache.getStats();
}
