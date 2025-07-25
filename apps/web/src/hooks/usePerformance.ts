'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { PerformanceMonitor, MemoryManager } from '@/lib/performance';

/**
 * Hook for measuring component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number>(0);

  useEffect(() => {
    renderCountRef.current += 1;
    const now = performance.now();
    
    if (lastRenderTimeRef.current > 0) {
      const timeSinceLastRender = now - lastRenderTimeRef.current;
      PerformanceMonitor.startMeasure(`${componentName}-render-${renderCountRef.current}`);
      
      // Log performance in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render #${renderCountRef.current} - Time since last: ${timeSinceLastRender.toFixed(2)}ms`);
      }
    }
    
    lastRenderTimeRef.current = now;
  });

  return {
    renderCount: renderCountRef.current,
    measureRenderEnd: useCallback(() => {
      return PerformanceMonitor.endMeasure(`${componentName}-render-${renderCountRef.current}`);
    }, [componentName]),
  };
}

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttling function calls
 */
export function useThrottle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): T {
  const inThrottle = useRef<boolean>(false);

  const throttledFunc = useCallback((...args: Parameters<T>) => {
    if (!inThrottle.current) {
      func.apply(null, args);
      inThrottle.current = true;
      setTimeout(() => {
        inThrottle.current = false;
      }, limit);
    }
  }, [func, limit]) as T;

  return throttledFunc;
}

/**
 * Hook for lazy loading with intersection observer
 */
export function useLazyLoad(options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoaded) {
          setIsIntersecting(true);
          setIsLoaded(true);
          observer.unobserve(element);
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [isLoaded, options]);

  return { targetRef, isIntersecting, isLoaded };
}

/**
 * Hook for monitoring memory usage
 */
export function useMemoryMonitor(interval: number = 5000) {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('memory' in window.performance)) {
      return;
    }

    const updateMemoryInfo = () => {
      const memory = MemoryManager.getMemoryUsage();
      setMemoryInfo(memory);
    };

    updateMemoryInfo(); // Initial measurement
    const intervalId = setInterval(updateMemoryInfo, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [interval]);

  return memoryInfo;
}

/**
 * Hook for measuring page load performance
 */
export function usePageLoadPerformance() {
  const [metrics, setMetrics] = useState<{
    loadTime?: number;
    domContentLoaded?: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
  }>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const measurePerformance = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      const newMetrics: typeof metrics = {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      };

      paint.forEach((entry) => {
        if (entry.name === 'first-paint') {
          newMetrics.firstPaint = entry.startTime;
        } else if (entry.name === 'first-contentful-paint') {
          newMetrics.firstContentfulPaint = entry.startTime;
        }
      });

      setMetrics(newMetrics);
    };

    if (document.readyState === 'complete') {
      measurePerformance();
    } else {
      window.addEventListener('load', measurePerformance);
      return () => window.removeEventListener('load', measurePerformance);
    }
  }, []);

  return metrics;
}

/**
 * Hook for image lazy loading with performance monitoring
 */
export function useImageLazyLoad(src: string, options: IntersectionObserverInit = {}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { targetRef, isIntersecting } = useLazyLoad(options);

  useEffect(() => {
    if (isIntersecting && !isLoaded && !isLoading) {
      setIsLoading(true);
      setError(null);

      const img = new Image();
      const startTime = performance.now();

      img.onload = () => {
        const loadTime = performance.now() - startTime;
        console.log(`Image loaded in ${loadTime.toFixed(2)}ms:`, src);
        
        setImageSrc(src);
        setIsLoaded(true);
        setIsLoading(false);
      };

      img.onerror = () => {
        setError('Failed to load image');
        setIsLoading(false);
      };

      img.src = src;
    }
  }, [isIntersecting, isLoaded, isLoading, src]);

  return {
    imageSrc,
    isLoading,
    isLoaded,
    error,
    targetRef,
  };
}

/**
 * Hook for virtual scrolling performance
 */
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    handleScroll,
  };
}

/**
 * Hook for connection monitoring
 */
export function useConnectionMonitor() {
  const [connectionInfo, setConnectionInfo] = useState<{
    online: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  }>({
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateConnectionInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      
      setConnectionInfo({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
      });
    };

    const handleOnline = () => setConnectionInfo(prev => ({ ...prev, online: true }));
    const handleOffline = () => setConnectionInfo(prev => ({ ...prev, online: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor connection changes if supported
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
    }

    updateConnectionInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (connection) {
        connection.removeEventListener('change', updateConnectionInfo);
      }
    };
  }, []);

  return connectionInfo;
}

/**
 * Hook for prefetching resources
 */
export function usePrefetch() {
  const prefetchedResources = useRef<Set<string>>(new Set());

  const prefetchLink = useCallback((href: string) => {
    if (prefetchedResources.current.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    
    prefetchedResources.current.add(href);
  }, []);

  const preloadLink = useCallback((href: string, as: string = 'fetch') => {
    if (prefetchedResources.current.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    document.head.appendChild(link);
    
    prefetchedResources.current.add(href);
  }, []);

  return { prefetchLink, preloadLink };
}