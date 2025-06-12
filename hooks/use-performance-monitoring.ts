'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface PerformanceMetrics {
  memoryUsage: number; // MB
  renderTime: number; // ms
  processingSpeed: number; // rows per minute
  errorRate: number; // percentage
  totalRows: number;
  processedRows: number;
  startTime: number;
  lastUpdateTime: number;
  frameRate: number; // FPS
  networkRequests: number;
  failedRequests: number;
}

export interface PerformanceThresholds {
  maxMemoryUsage: number; // MB
  maxRenderTime: number; // ms
  minProcessingSpeed: number; // rows per minute
  maxErrorRate: number; // percentage
  minFrameRate: number; // FPS
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxMemoryUsage: 500, // 500MB
  maxRenderTime: 100, // 100ms
  minProcessingSpeed: 1000, // 1000 rows per minute
  maxErrorRate: 5, // 5%
  minFrameRate: 30 // 30 FPS
};

export function usePerformanceMonitoring(thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: 0,
    renderTime: 0,
    processingSpeed: 0,
    errorRate: 0,
    totalRows: 0,
    processedRows: 0,
    startTime: Date.now(),
    lastUpdateTime: Date.now(),
    frameRate: 0,
    networkRequests: 0,
    failedRequests: 0
  });

  const [alerts, setAlerts] = useState<string[]>([]);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(Date.now());
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  // Memory monitoring
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsageMB = memory.usedJSHeapSize / 1024 / 1024;
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage: Math.round(memoryUsageMB),
        lastUpdateTime: Date.now()
      }));

      // Check memory threshold
      if (memoryUsageMB > thresholds.maxMemoryUsage) {
        setAlerts(prev => {
          const alert = `High memory usage: ${Math.round(memoryUsageMB)}MB (threshold: ${thresholds.maxMemoryUsage}MB)`;
          return prev.includes(alert) ? prev : [...prev, alert];
        });
      }
    }
  }, [thresholds.maxMemoryUsage]);

  // Frame rate monitoring
  const measureFrameRate = useCallback(() => {
    frameCountRef.current++;
    const now = Date.now();
    const timeDiff = now - lastFrameTimeRef.current;

    if (timeDiff >= 1000) { // Update every second
      const fps = Math.round((frameCountRef.current * 1000) / timeDiff);
      
      setMetrics(prev => ({
        ...prev,
        frameRate: fps,
        lastUpdateTime: now
      }));

      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;

      // Check frame rate threshold
      if (fps < thresholds.minFrameRate) {
        setAlerts(prev => {
          const alert = `Low frame rate: ${fps}fps (threshold: ${thresholds.minFrameRate}fps)`;
          return prev.includes(alert) ? prev : [...prev, alert];
        });
      }
    }

    requestAnimationFrame(measureFrameRate);
  }, [thresholds.minFrameRate]);

  // Render time monitoring
  const measureRenderTime = useCallback((componentName: string, startTime: number) => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    setMetrics(prev => ({
      ...prev,
      renderTime: Math.round(renderTime),
      lastUpdateTime: Date.now()
    }));

    // Check render time threshold
    if (renderTime > thresholds.maxRenderTime) {
      setAlerts(prev => {
        const alert = `Slow render: ${componentName} took ${Math.round(renderTime)}ms (threshold: ${thresholds.maxRenderTime}ms)`;
        return prev.includes(alert) ? prev : [...prev, alert];
      });
    }

    return renderTime;
  }, [thresholds.maxRenderTime]);

  // Processing speed monitoring
  const updateProcessingMetrics = useCallback((totalRows: number, processedRows: number, errors: number = 0) => {
    const now = Date.now();
    const elapsedMinutes = (now - metrics.startTime) / 60000;
    const processingSpeed = elapsedMinutes > 0 ? Math.round(processedRows / elapsedMinutes) : 0;
    const errorRate = totalRows > 0 ? Math.round((errors / totalRows) * 100) : 0;

    setMetrics(prev => ({
      ...prev,
      totalRows,
      processedRows,
      processingSpeed,
      errorRate,
      lastUpdateTime: now
    }));

    // Check processing speed threshold
    if (processingSpeed > 0 && processingSpeed < thresholds.minProcessingSpeed) {
      setAlerts(prev => {
        const alert = `Slow processing: ${processingSpeed} rows/min (threshold: ${thresholds.minProcessingSpeed} rows/min)`;
        return prev.includes(alert) ? prev : [...prev, alert];
      });
    }

    // Check error rate threshold
    if (errorRate > thresholds.maxErrorRate) {
      setAlerts(prev => {
        const alert = `High error rate: ${errorRate}% (threshold: ${thresholds.maxErrorRate}%)`;
        return prev.includes(alert) ? prev : [...prev, alert];
      });
    }
  }, [metrics.startTime, thresholds.minProcessingSpeed, thresholds.maxErrorRate]);

  // Network monitoring
  const trackNetworkRequest = useCallback((success: boolean = true) => {
    setMetrics(prev => ({
      ...prev,
      networkRequests: prev.networkRequests + 1,
      failedRequests: success ? prev.failedRequests : prev.failedRequests + 1,
      lastUpdateTime: Date.now()
    }));
  }, []);

  // Performance observer for detailed metrics
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry) => {
          if (entry.entryType === 'measure') {
            const renderTime = entry.duration;
            
            setMetrics(prev => ({
              ...prev,
              renderTime: Math.round(renderTime),
              lastUpdateTime: Date.now()
            }));

            if (renderTime > thresholds.maxRenderTime) {
              setAlerts(prev => {
                const alert = `Performance measure "${entry.name}" took ${Math.round(renderTime)}ms`;
                return prev.includes(alert) ? prev : [...prev, alert];
              });
            }
          }
        });
      });

      performanceObserverRef.current.observe({ 
        entryTypes: ['measure', 'navigation', 'resource'] 
      });
    }

    return () => {
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, [thresholds.maxRenderTime]);

  // Regular monitoring intervals
  useEffect(() => {
    const memoryInterval = setInterval(measureMemoryUsage, 2000); // Every 2 seconds
    
    // Start frame rate monitoring
    requestAnimationFrame(measureFrameRate);

    return () => {
      clearInterval(memoryInterval);
    };
  }, [measureMemoryUsage, measureFrameRate]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      memoryUsage: 0,
      renderTime: 0,
      processingSpeed: 0,
      errorRate: 0,
      totalRows: 0,
      processedRows: 0,
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      frameRate: 0,
      networkRequests: 0,
      failedRequests: 0
    });
    setAlerts([]);
  }, []);

  // Clear specific alert
  const clearAlert = useCallback((alertToRemove: string) => {
    setAlerts(prev => prev.filter(alert => alert !== alertToRemove));
  }, []);

  // Clear all alerts
  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Get performance status
  const getPerformanceStatus = useCallback(() => {
    const issues = [];
    
    if (metrics.memoryUsage > thresholds.maxMemoryUsage) {
      issues.push('memory');
    }
    if (metrics.renderTime > thresholds.maxRenderTime) {
      issues.push('render');
    }
    if (metrics.processingSpeed > 0 && metrics.processingSpeed < thresholds.minProcessingSpeed) {
      issues.push('processing');
    }
    if (metrics.errorRate > thresholds.maxErrorRate) {
      issues.push('errors');
    }
    if (metrics.frameRate > 0 && metrics.frameRate < thresholds.minFrameRate) {
      issues.push('framerate');
    }

    if (issues.length === 0) return 'good';
    if (issues.length <= 2) return 'warning';
    return 'critical';
  }, [metrics, thresholds]);

  // Export metrics for analysis
  const exportMetrics = useCallback(() => {
    const exportData = {
      metrics,
      thresholds,
      alerts,
      timestamp: new Date().toISOString(),
      performanceStatus: getPerformanceStatus()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [metrics, thresholds, alerts, getPerformanceStatus]);

  return {
    metrics,
    alerts,
    thresholds,
    measureRenderTime,
    updateProcessingMetrics,
    trackNetworkRequest,
    resetMetrics,
    clearAlert,
    clearAllAlerts,
    getPerformanceStatus,
    exportMetrics
  };
}
