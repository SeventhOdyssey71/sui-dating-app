interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class BlockchainCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 30000; // 30 seconds default

  /**
   * Set a value in the cache with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Get a value from the cache if not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Clear specific key or entire cache
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Invalidate a specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Get or fetch data with caching
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }
}

// Singleton instance
export const blockchainCache = new BlockchainCache();

// Expose cache globally for invalidation from components
if (typeof window !== 'undefined') {
  (window as any).blockchainCache = blockchainCache;
}

// Cache keys
export const CACHE_KEYS = {
  GAME_STATS: (gameType: string) => `game:stats:${gameType}`,
  TRIVIA_QUESTION: 'trivia:current-question',
  TRIVIA_LEADERBOARD: 'trivia:leaderboard',
  USER_NFTS: (address: string) => `nfts:${address}`,
  USER_BALANCE: (address: string) => `balance:${address}`,
  MESSAGES: (address: string) => `messages:${address}`,
  GROUP_INFO: (groupId: string) => `group:${groupId}`,
} as const;