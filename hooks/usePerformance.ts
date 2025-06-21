import { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  apiCallTime: number;
  cacheHitRate: number;
}

export function usePerformance(componentName: string) {
  const startTime = performance.now();

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms`);
    }

    // Report to analytics if needed
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'timing_complete', {
        name: componentName,
        value: Math.round(renderTime),
        event_category: 'Performance',
      });
    }
  }, [componentName, startTime]);

  const measureApiCall = useCallback(async <T,>(
    apiCall: () => Promise<T>,
    callName: string
  ): Promise<T> => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const duration = performance.now() - start;

      if (process.env.NODE_ENV === 'development') {
        console.log(`[API] ${callName} completed in ${duration.toFixed(2)}ms`);
      }

      return result;
    } catch (error) {
      const duration = performance.now() - start;
      console.error(`[API] ${callName} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }, []);

  return { measureApiCall };
}