import React, { useState, useEffect } from 'react';
import { SystemHealth as SystemHealthType } from '../types';
import { formatDateTime } from '../utils/formatters';

interface SystemHealthProps {
  health: SystemHealthType;
  onRefresh: () => void;
}

const SystemHealth: React.FC<SystemHealthProps> = ({
  health,
  onRefresh,
}) => {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(onRefresh, refreshInterval * 1000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
      case 'connected':
        return 'bg-emerald-500';
      case 'degraded':
        return 'bg-amber-500';
      case 'unhealthy':
      case 'down':
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-slate-500';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'degraded':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'unhealthy':
      case 'down':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      default:
        return 'bg-gray-500/10 border-gray-500/30 text-slate-500 dark:text-slate-400';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = formatDateTime;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const memoryUsagePercent = health.memory
    ? Math.round((health.memory.heapUsed / health.memory.heapTotal) * 100)
    : 0;

  const getMetricStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'healthy';
  };

  const MetricGauge: React.FC<{ value: number; label: string; unit: string; warning: number; critical: number }> = ({
    value,
    label,
    unit,
    warning,
    critical,
  }) => {
    const status = getMetricStatus(value, { warning, critical });
    const color = status === 'critical' ? 'text-red-400' : status === 'warning' ? 'text-amber-400' : 'text-emerald-400';
    const bgColor = status === 'critical' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500';

    return (
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 dark:text-slate-400 text-sm">{label}</span>
          <span className={`text-lg font-bold ${color}`}>{value.toFixed(1)}{unit}</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${bgColor} transition-all duration-500`}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-slate-500 dark:text-slate-400">
          <span>0{unit}</span>
          <span>100{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Health</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor system performance and service status</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
            <span className="text-slate-500 dark:text-slate-400 text-sm">Auto-refresh</span>
          </div>

          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-white dark:bg-background-card border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          )}

          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <div className={`rounded-xl p-6 border ${getStatusBgColor(health.status)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-4 h-4 rounded-full ${getStatusColor(health.status)} animate-pulse`} />
            <div>
              <h2 className="text-xl font-bold capitalize">System {health.status}</h2>
              <p className="text-sm opacity-75">
                Uptime: {formatUptime(health.uptime)} | Last checked: {formatDate(health.timestamp)} | Node {health.nodeVersion}
              </p>
            </div>
          </div>
          <div>
            {health.status === 'healthy' ? (
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            ) : health.status === 'degraded' ? (
              <span className="material-symbols-outlined text-4xl">warning</span>
            ) : (
              <span className="material-symbols-outlined text-4xl">error</span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Memory Usage */}
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <h3 className="text-slate-900 dark:text-white font-medium mb-4 flex items-center gap-2">
            Memory Usage
          </h3>
          <div className="space-y-4">
            <MetricGauge
              value={memoryUsagePercent}
              label="Heap Usage"
              unit="%"
              warning={80}
              critical={95}
            />
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Heap Used</span>
                <span className="text-slate-900 dark:text-white font-medium">{formatBytes(health.memory?.heapUsed ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Heap Total</span>
                <span className="text-slate-900 dark:text-white font-medium">{formatBytes(health.memory?.heapTotal ?? 0)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm">RSS</span>
                <span className="text-slate-900 dark:text-white font-medium">{formatBytes(health.memory?.rss ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Status */}
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <h3 className="text-slate-900 dark:text-white font-medium mb-4 flex items-center gap-2">
            Services Status
          </h3>
          <div className="space-y-3">
            {/* Database */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(health.database?.connected ? 'healthy' : 'down')}`} />
                <span className="text-slate-900 dark:text-white">Database</span>
              </div>
              <span className="text-slate-500 dark:text-slate-400 text-sm">
                {health.database?.connected ? 'Connected' : 'Disconnected'}
                {health.database?.responseTime != null && ` (${health.database.responseTime}ms)`}
              </span>
            </div>
            {/* Code Execution */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(health.codeExecution?.status || 'unknown')}`} />
                <span className="text-slate-900 dark:text-white">Code Execution</span>
              </div>
              <span className="text-slate-500 dark:text-slate-400 text-sm">
                {health.codeExecution?.provider ?? 'N/A'} ({health.codeExecution?.status ?? 'unknown'})
              </span>
            </div>
          </div>
        </div>

        {/* Cache Stats */}
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <h3 className="text-slate-900 dark:text-white font-medium mb-4 flex items-center gap-2">
            Cache
          </h3>
          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Keys</span>
                <span className="text-slate-900 dark:text-white font-bold text-lg">{health.cache?.keys ?? 0}</span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Hits</span>
                <span className="text-emerald-400 font-bold text-lg">{health.cache?.hits ?? 0}</span>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Misses</span>
                <span className="text-amber-400 font-bold text-lg">{health.cache?.misses ?? 0}</span>
              </div>
            </div>
            {health.cache && (health.cache.hits + health.cache.misses) > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 text-sm">Hit Rate</span>
                  <span className="text-slate-900 dark:text-white font-bold text-lg">
                    {((health.cache.hits / (health.cache.hits + health.cache.misses)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
