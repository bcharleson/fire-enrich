'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  MemoryStick, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Download,
  RefreshCw,
  Monitor,
  Zap,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { usePerformanceMonitoring, PerformanceMetrics } from '@/hooks/use-performance-monitoring';

interface PerformanceDashboardProps {
  className?: string;
  compact?: boolean;
  showAlerts?: boolean;
}

export function PerformanceDashboard({ 
  className = '', 
  compact = false, 
  showAlerts = true 
}: PerformanceDashboardProps) {
  const {
    metrics,
    alerts,
    thresholds,
    resetMetrics,
    clearAllAlerts,
    getPerformanceStatus,
    exportMetrics
  } = usePerformanceMonitoring();

  const [expanded, setExpanded] = useState(!compact);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${Math.round(bytes / (1024 * 1024))}MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 dark:text-green-400';
      case 'warning': return 'text-yellow-600 dark:text-yellow-400';
      case 'critical': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const performanceStatus = getPerformanceStatus();

  if (compact && !expanded) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(true)}
          className={`flex items-center gap-2 ${getStatusColor(performanceStatus)}`}
        >
          {getStatusIcon(performanceStatus)}
          <span className="text-xs">
            {metrics.memoryUsage}MB | {metrics.processingSpeed}/min
          </span>
        </Button>
        {alerts.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {alerts.length}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Performance Monitor</h3>
          <div className={`flex items-center gap-1 ${getStatusColor(performanceStatus)}`}>
            {getStatusIcon(performanceStatus)}
            <span className="text-sm capitalize">{performanceStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(false)}
            >
              Minimize
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={resetMetrics}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={exportMetrics}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Memory Usage */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MemoryStick className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Memory</span>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {metrics.memoryUsage}MB
            </div>
            <Progress 
              value={(metrics.memoryUsage / thresholds.maxMemoryUsage) * 100} 
              className="h-2"
            />
            <div className="text-xs text-gray-500">
              Limit: {thresholds.maxMemoryUsage}MB
            </div>
          </div>
        </Card>

        {/* Processing Speed */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Speed</span>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {metrics.processingSpeed}
            </div>
            <div className="text-xs text-gray-500">
              rows/minute
            </div>
            <div className="text-xs text-gray-500">
              Target: {thresholds.minProcessingSpeed}/min
            </div>
          </div>
        </Card>

        {/* Render Time */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Render</span>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {metrics.renderTime}ms
            </div>
            <Progress 
              value={(metrics.renderTime / thresholds.maxRenderTime) * 100} 
              className="h-2"
            />
            <div className="text-xs text-gray-500">
              Target: <{thresholds.maxRenderTime}ms
            </div>
          </div>
        </Card>

        {/* Frame Rate */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">FPS</span>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {metrics.frameRate}
            </div>
            <Progress 
              value={(metrics.frameRate / 60) * 100} 
              className="h-2"
            />
            <div className="text-xs text-gray-500">
              Target: >{thresholds.minFrameRate}fps
            </div>
          </div>
        </Card>
      </div>

      {/* Processing Progress */}
      {metrics.totalRows > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Processing Progress</span>
            <span className="text-sm text-gray-500">
              {metrics.processedRows} / {metrics.totalRows} rows
            </span>
          </div>
          <Progress 
            value={(metrics.processedRows / metrics.totalRows) * 100} 
            className="h-3 mb-2"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              {Math.round((metrics.processedRows / metrics.totalRows) * 100)}% complete
            </span>
            <span>
              Error rate: {metrics.errorRate}%
            </span>
          </div>
        </Card>
      )}

      {/* Network Stats */}
      {metrics.networkRequests > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-medium">Network Activity</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{metrics.networkRequests}</div>
              <div className="text-xs text-gray-500">Total Requests</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-500">{metrics.failedRequests}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-500">
                {Math.round(((metrics.networkRequests - metrics.failedRequests) / metrics.networkRequests) * 100)}%
              </div>
              <div className="text-xs text-gray-500">Success Rate</div>
            </div>
          </div>
        </Card>
      )}

      {/* Alerts */}
      {showAlerts && alerts.length > 0 && (
        <Card className="p-4 border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Performance Alerts ({alerts.length})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllAlerts}
              className="text-red-600 hover:text-red-700"
            >
              Clear All
            </Button>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded"
              >
                {alert}
              </div>
            ))}
            {alerts.length > 5 && (
              <div className="text-xs text-gray-500">
                ... and {alerts.length - 5} more alerts
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Performance Tips */}
      {performanceStatus !== 'good' && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Performance Tips
            </span>
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
            {metrics.memoryUsage > thresholds.maxMemoryUsage && (
              <div>• Consider processing data in smaller batches to reduce memory usage</div>
            )}
            {metrics.renderTime > thresholds.maxRenderTime && (
              <div>• Large datasets may benefit from virtual scrolling or pagination</div>
            )}
            {metrics.processingSpeed > 0 && metrics.processingSpeed < thresholds.minProcessingSpeed && (
              <div>• Try reducing the number of concurrent API requests</div>
            )}
            {metrics.errorRate > thresholds.maxErrorRate && (
              <div>• Check your API keys and network connection</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
