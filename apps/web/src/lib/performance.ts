// Performance optimization utilities for the web application

/**
 * Debounce function to limit the rate of function calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Throttle function to limit function execution frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy loading hook for heavy components
 */
export function useLazyComponent<T>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const [Component, setComponent] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    importFunc()
      .then((module) => {
        setComponent(() => module.default);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { Component, loading, error };
}

/**
 * Performance measurement utilities
 */
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();

  static startMeasure(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-start`);
    }
  }

  static endMeasure(name: string): number | null {
    if (typeof window !== 'undefined' && window.performance) {
      window.performance.mark(`${name}-end`);
      window.performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = window.performance.getEntriesByName(name)[0];
      const duration = measure?.duration || 0;
      
      this.metrics.set(name, duration);
      
      // Clean up marks and measures
      window.performance.clearMarks(`${name}-start`);
      window.performance.clearMarks(`${name}-end`);
      window.performance.clearMeasures(name);
      
      return duration;
    }
    return null;
  }

  static getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  static clearMetrics(): void {
    this.metrics.clear();
  }

  static logMetrics(): void {
    if (process.env.NODE_ENV === 'development') {
      console.table(Array.from(this.metrics.entries()));
    }
  }
}

/**
 * Memory management utilities
 */
export class MemoryManager {
  private static cleanupTasks: (() => void)[] = [];

  static addCleanupTask(task: () => void): void {
    this.cleanupTasks.push(task);
  }

  static cleanup(): void {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        console.error('Cleanup task failed:', error);
      }
    });
    this.cleanupTasks = [];
  }

  static getMemoryUsage(): MemoryInfo | null {
    if (typeof window !== 'undefined' && 'memory' in window.performance) {
      return (window.performance as any).memory;
    }
    return null;
  }

  static logMemoryUsage(): void {
    const memory = this.getMemoryUsage();
    if (memory && process.env.NODE_ENV === 'development') {
      console.log('Memory Usage:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB',
      });
    }
  }
}

/**
 * Image optimization utilities
 */
export function getOptimizedImageUrl(
  src: string,
  width: number,
  height?: number,
  quality: number = 80
): string {
  if (src.startsWith('http')) {
    // For external images, you might want to use a service like Cloudinary
    return src;
  }

  // For local images, use Next.js image optimization
  const params = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: quality.toString(),
  });

  if (height) {
    params.set('h', height.toString());
  }

  return `/_next/image?${params.toString()}`;
}

/**
 * Font loading optimization
 */
export function preloadFont(fontUrl: string): void {
  if (typeof document !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = fontUrl;
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
}

/**
 * Critical resource hints
 */
export function addResourceHints(): void {
  if (typeof document !== 'undefined') {
    // DNS prefetch for external domains
    const dnsPrefetchDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com',
      'cdn.jsdelivr.net',
    ];

    dnsPrefetchDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Preconnect to critical external resources
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
}

/**
 * Bundle size analyzer helper
 */
export function analyzeBundleSize(): void {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    console.group('Bundle Analysis');
    console.log('JavaScript files:', scripts.length);
    console.log('CSS files:', styles.length);
    
    scripts.forEach((script: any) => {
      console.log(`=Ä ${script.src.split('/').pop()}`);
    });
    
    styles.forEach((style: any) => {
      console.log(`<¨ ${style.href.split('/').pop()}`);
    });
    
    console.groupEnd();
  }
}

/**
 * Intersection Observer utility for lazy loading
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options,
    });
  }
  return null;
}

/**
 * Service Worker utilities
 */
export class ServiceWorkerManager {
  static async register(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }

  static async unregister(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.unregister();
        console.log('Service Worker unregistered successfully');
        return true;
      } catch (error) {
        console.error('Service Worker unregistration failed:', error);
        return false;
      }
    }
    return false;
  }

  static async update(): Promise<void> {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        console.log('Service Worker updated successfully');
      } catch (error) {
        console.error('Service Worker update failed:', error);
      }
    }
  }
}

/**
 * Web Vitals measurement
 */
export function measureWebVitals(): void {
  if (typeof window !== 'undefined') {
    // Measure Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.startTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Measure First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        console.log('FID:', entry.processingStart - entry.startTime);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Measure Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      console.log('CLS:', clsValue);
    }).observe({ entryTypes: ['layout-shift'] });
  }
}

// React import for hooks
import React from 'react';