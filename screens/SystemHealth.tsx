import React, { useState, useEffect } from 'react';
import { SystemHealth as SystemHealthType, SystemLog } from '../types';

interface SystemHealthProps {
  health: SystemHealthType;
  onRefresh: () => void;
  onServiceRestart?: (serviceName: string) => void;
}

const SystemHealth: React.FC<SystemHealthProps> = ({
  health,
  onRefresh,
  onServiceRestart,
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
        return 'bg-emerald-500';
      case 'degraded':
        return 'bg-amber-500';
      case 'unhealthy':
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
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
        return 'bg-gray-500/10 border-gray-500/30 text-gray-400';
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

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateString));
  };

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
      <div className="bg-[#0d0d0d] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-400 text-sm">{label}</span>
          <span className={`text-lg font-bold ${color}`}>{value.toFixed(1)}{unit}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${bgColor} transition-all duration-500`}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500">
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
          <h1 className="text-2xl font-bold text-white">System Health</h1>
          <p className="text-gray-400 mt-1">Monitor system performance and service status</p>
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
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
            </label>
            <span className="text-gray-400 text-sm">Auto-refresh</span>
          </div>
          
          {autoRefresh && (
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
            >
              <option value={10}>10s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          )}

          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2"
          >
            🔄 Refresh
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
                Uptime: {formatUptime(health.uptime)} • Last checked: {formatDate(health.lastChecked)}
              </p>
            </div>
          </div>
          <div className="text-4xl">
            {health.status === 'healthy' ? '✓' : health.status === 'degraded' ? '⚠' : '✗'}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <span>💻</span> Resource Usage
          </h3>
          <div className="space-y-4">
            <MetricGauge
              value={health.metrics.cpuUsage}
              label="CPU Usage"
              unit="%"
              warning={70}
              critical={90}
            />
            <MetricGauge
              value={health.metrics.memoryUsage}
              label="Memory Usage"
              unit="%"
              warning={80}
              critical={95}
            />
            <MetricGauge
              value={health.metrics.diskUsage}
              label="Disk Usage"
              unit="%"
              warning={75}
              critical={90}
            />
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <span>📊</span> Performance Metrics
          </h3>
          <div className="space-y-4">
            <div className="bg-[#0d0d0d] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Active Connections</span>
                <span className="text-white font-bold text-lg">{health.metrics.activeConnections}</span>
              </div>
            </div>
            <div className="bg-[#0d0d0d] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Requests/min</span>
                <span className="text-white font-bold text-lg">{health.metrics.requestsPerMinute}</span>
              </div>
            </div>
            <div className="bg-[#0d0d0d] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Avg Response Time</span>
                <span className={`font-bold text-lg ${
                  health.metrics.averageResponseTime < 200 ? 'text-emerald-400' :
                  health.metrics.averageResponseTime < 500 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {health.metrics.averageResponseTime}ms
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
          <h3 className="text-white font-medium mb-4 flex items-center gap-2">
            <span>🔧</span> Services Status
          </h3>
          <div className="space-y-3">
            {health.services.map((service) => (
              <div
                key={service.name}
                className="bg-[#0d0d0d] rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(service.status)}`} />
                  <span className="text-white">{service.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">{service.responseTime}ms</span>
                  {onServiceRestart && service.status !== 'up' && (
                    <button
                      onClick={() => onServiceRestart(service.name)}
                      className="px-2 py-1 text-xs bg-teal-500/20 text-teal-400 rounded hover:bg-teal-500/30 transition-colors"
                    >
                      Restart
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <span>⚠️</span> Recent Errors
          {health.recentErrors.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
              {health.recentErrors.length}
            </span>
          )}
        </h3>
        
        {health.recentErrors.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✓</div>
            <p className="text-gray-400">No recent errors. System running smoothly!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {health.recentErrors.slice(0, 5).map((error) => (
              <div
                key={error.id}
                className="bg-[#0d0d0d] rounded-lg p-3 border-l-4 border-red-500"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-red-400 font-medium">{error.category}</span>
                  <span className="text-gray-500 text-sm">{formatDate(error.timestamp)}</span>
                </div>
                <p className="text-gray-300 text-sm">{error.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Info */}
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
        <h3 className="text-white font-medium mb-4 flex items-center gap-2">
          <span>ℹ️</span> System Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0d0d0d] rounded-lg p-3">
            <div className="text-gray-400 text-sm">Platform Version</div>
            <div className="text-white font-medium mt-1">CodeQuest v1.0.0</div>
          </div>
          <div className="bg-[#0d0d0d] rounded-lg p-3">
            <div className="text-gray-400 text-sm">Node.js Version</div>
            <div className="text-white font-medium mt-1">v20.10.0</div>
          </div>
          <div className="bg-[#0d0d0d] rounded-lg p-3">
            <div className="text-gray-400 text-sm">Database</div>
            <div className="text-white font-medium mt-1">PostgreSQL 15.2</div>
          </div>
          <div className="bg-[#0d0d0d] rounded-lg p-3">
            <div className="text-gray-400 text-sm">Cache</div>
            <div className="text-white font-medium mt-1">Redis 7.2</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
