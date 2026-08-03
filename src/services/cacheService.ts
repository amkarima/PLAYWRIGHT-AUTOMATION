interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000;
  private useLocalStorage: boolean = true;
  private storagePrefix: string = 'gitlab_cache_';

  constructor() {
    this.cleanExpiredFromStorage();
  }

  private getStorageKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }

  private saveToStorage(key: string, entry: CacheEntry<any>): void {
    if (!this.useLocalStorage) return;

    try {
      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }

  private loadFromStorage(key: string): CacheEntry<any> | null {
    if (!this.useLocalStorage) return null;

    try {
      const storageKey = this.getStorageKey(key);
      const item = localStorage.getItem(storageKey);
      if (!item) return null;

      const entry = JSON.parse(item) as CacheEntry<any>;

      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(storageKey);
        return null;
      }

      return entry;
    } catch (e) {
      console.warn('Failed to load from localStorage:', e);
      return null;
    }
  }

  private removeFromStorage(key: string): void {
    if (!this.useLocalStorage) return;

    try {
      const storageKey = this.getStorageKey(key);
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.warn('Failed to remove from localStorage:', e);
    }
  }

  private cleanExpiredFromStorage(): void {
    if (!this.useLocalStorage) return;

    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.storagePrefix)) {
          const item = localStorage.getItem(key);
          if (item) {
            try {
              const entry = JSON.parse(item) as CacheEntry<any>;
              if (Date.now() > entry.expiresAt) {
                keysToRemove.push(key);
              }
            } catch (e) {
              keysToRemove.push(key);
            }
          }
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.warn('Failed to clean expired cache:', e);
    }
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt
    };

    this.memoryCache.set(key, entry);
    this.saveToStorage(key, entry);
  }

  get<T>(key: string): T | null {
    let entry = this.memoryCache.get(key);

    if (!entry) {
      entry = this.loadFromStorage(key);
      if (entry) {
        this.memoryCache.set(key, entry);
      }
    }

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      this.removeFromStorage(key);
      return null;
    }

    return entry.data as T;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key);
    this.removeFromStorage(key);
  }

  invalidatePattern(pattern: string): void {
    const memoryKeys = Array.from(this.memoryCache.keys());
    memoryKeys.forEach(key => {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    });

    if (this.useLocalStorage) {
      try {
        const storageKeysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.storagePrefix) && key.includes(pattern)) {
            storageKeysToRemove.push(key);
          }
        }
        storageKeysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        console.warn('Failed to invalidate pattern from storage:', e);
      }
    }
  }

  clear(): void {
    this.memoryCache.clear();

    if (this.useLocalStorage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.storagePrefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        console.warn('Failed to clear storage cache:', e);
      }
    }
  }

  getAge(key: string): number | null {
    const entry = this.memoryCache.get(key) || this.loadFromStorage(key);

    if (!entry) {
      return null;
    }

    return Date.now() - entry.timestamp;
  }

  getRemainingTTL(key: string): number | null {
    const entry = this.memoryCache.get(key) || this.loadFromStorage(key);

    if (!entry) {
      return null;
    }

    const remaining = entry.expiresAt - Date.now();
    return remaining > 0 ? remaining : null;
  }

  getCacheSize(): { memory: number; storage: number } {
    let storageCount = 0;

    if (this.useLocalStorage) {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.storagePrefix)) {
            storageCount++;
          }
        }
      } catch (e) {
        console.warn('Failed to count storage cache:', e);
      }
    }

    return {
      memory: this.memoryCache.size,
      storage: storageCount
    };
  }
}

export const cacheService = new CacheService();
