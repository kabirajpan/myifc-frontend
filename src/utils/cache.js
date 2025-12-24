/**
 * Simple in-memory cache with TTL (Time To Live)
 */
class DataCache {
  constructor(ttl = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  /**
   * Set cache entry
   */
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get cache entry (returns null if expired or not found)
   */
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Invalidate all entries matching a pattern
   */
  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
}

// Export singleton instances for different data types
export const chatCache = new DataCache(5 * 60 * 1000); // 5 minutes
export const userCache = new DataCache(2 * 60 * 1000); // 2 minutes
export const messageCache = new DataCache(10 * 60 * 1000); // 10 minutes

// Export the class for creating custom caches
export default DataCache;
