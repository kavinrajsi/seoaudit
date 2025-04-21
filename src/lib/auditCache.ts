/**
 * Cache modules for SEO Audit results and history.
 * - auditCache: stores the latest audit result per URL.
 * - historyCache: stores all audit runs (timestamped) per URL for trend analysis.
 */
export interface CacheEntry {
  timestamp: number;
  data: Record<string, unknown>;
}

export const auditCache: Map<string, CacheEntry> = new Map();
export const historyCache: Map<string, CacheEntry[]> = new Map();
