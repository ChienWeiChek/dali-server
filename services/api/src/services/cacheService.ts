import { LRUCache } from "lru-cache";

export interface CacheConfig {
  ttlMinutes: number;
  maxEntries: number;
  excludedRoutes: string[];
}

export class CacheService {
  private cache: LRUCache<string, any>;
  private ttlMs: number;
  private excludedRoutes: Set<string>;

  constructor(config: CacheConfig) {
    this.ttlMs = config.ttlMinutes * 60 * 1000;
    this.excludedRoutes = new Set(config.excludedRoutes);

    this.cache = new LRUCache<string, any>({
      max: config.maxEntries,
      ttl: this.ttlMs,
      updateAgeOnGet: false, // Don't reset TTL on access
    });
  }

  /**
   * Check if a route path should bypass caching
   */
  isExcluded(path: string): boolean {
    return this.excludedRoutes.has(path);
  }

  /**
   * Get a cached value by key
   */
  get(key: string): any | undefined {
    return this.cache.get(key);
  }

  /**
   * Set a cached value (only caches successful responses)
   */
  set(key: string, value: any): void {
    this.cache.set(key, value);
  }

  /**
   * Build a cache key for history endpoints
   * Format: history:{controller}:{guid}:{property}:{range}
   */
  buildHistoryKey(
    controller: string,
    guid: string,
    property: string,
    range: string,
  ): string {
    return `history:${controller}:${guid}:${property}:${range}`;
  }

  /**
   * Build a cache key for energy endpoints (monthly/weekly/daily)
   * Format: energy:{type}:{controller}:{guid}
   */
  buildEnergyKey(type: string, controller: string, guid: string): string {
    return `energy:${type}:${controller}:${guid}`;
  }

  /**
   * Build a cache key with normalized query parameters
   * Handles multi-value params like guids, types, properties
   */
  buildQueryKey(prefix: string, params: Record<string, any>): string {
    const parts = [prefix];

    // Normalize and sort array/comma-separated params
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        parts.push(`${key}=none`);
      } else if (Array.isArray(value)) {
        // Array params (e.g., type[])
        const sorted = [...value].sort().join(",");
        parts.push(`${key}=${sorted}`);
      } else if (typeof value === "string" && value.includes(",")) {
        // Comma-separated params (e.g., guids=abc,def,xyz)
        const sorted = value.split(",").map((v) => v.trim()).sort().join(",");
        parts.push(`${key}=${sorted}`);
      } else {
        parts.push(`${key}=${value}`);
      }
    }

    return parts.join(":");
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.cache.max,
      ttlMinutes: this.ttlMs / (60 * 1000),
    };
  }
}
