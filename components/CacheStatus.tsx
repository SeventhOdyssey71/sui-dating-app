'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

export function CacheStatus() {
  const [cacheHits, setCacheHits] = useState(0);
  const [cacheMisses, setCacheMisses] = useState(0);

  useEffect(() => {
    // Track cache performance
    const originalFetch = window.fetch;
    let hits = 0;
    let misses = 0;

    window.fetch = async (...args) => {
      const url = args[0] as string;
      if (url.includes('/api/')) {
        misses++;
        setCacheMisses(misses);
      }
      return originalFetch(...args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  const hitRate = cacheHits + cacheMisses > 0 
    ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1)
    : '0';

  return (
    <div className="fixed bottom-4 right-4 bg-background/95 backdrop-blur border rounded-lg p-3 text-xs space-y-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Activity className="w-3 h-3" />
        <span>Cache Performance</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span className="text-muted-foreground">Hit Rate:</span>
        <span className="font-mono">{hitRate}%</span>
        <span className="text-muted-foreground">API Calls:</span>
        <span className="font-mono">{cacheMisses}</span>
      </div>
    </div>
  );
}