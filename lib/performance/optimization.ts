// Debounce function for search and input handlers
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle function for scroll and resize handlers
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastFunc: NodeJS.Timeout;
  let lastRan: number;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

// Memoize expensive computations
export function memoize<T extends (...args: any[]) => any>(
  func: T
): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);

    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  }) as T;
}

// Batch API requests
export class RequestBatcher<T> {
  private queue: Array<{
    key: string;
    resolve: (value: T) => void;
    reject: (error: any) => void;
  }> = [];
  private timeout: NodeJS.Timeout | null = null;

  constructor(
    private batchProcessor: (keys: string[]) => Promise<Map<string, T>>,
    private delay: number = 10
  ) {}

  request(key: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ key, resolve, reject });

      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.timeout = setTimeout(() => this.processBatch(), this.delay);
    });
  }

  private async processBatch() {
    const batch = [...this.queue];
    this.queue = [];
    this.timeout = null;

    if (batch.length === 0) return;

    try {
      const keys = batch.map(item => item.key);
      const results = await this.batchProcessor(keys);

      batch.forEach(({ key, resolve, reject }) => {
        if (results.has(key)) {
          resolve(results.get(key)!);
        } else {
          reject(new Error(`No result for key: ${key}`));
        }
      });
    } catch (error) {
      batch.forEach(({ reject }) => reject(error));
    }
  }
}

// Virtual scrolling helper
export function getVisibleItems<T>(
  items: T[],
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  overscan: number = 3
): { visible: T[]; offset: number } {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  return {
    visible: items.slice(startIndex, endIndex),
    offset: startIndex * itemHeight,
  };
}