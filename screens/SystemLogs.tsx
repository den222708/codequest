import React, { useState, useMemo } from 'react';
import { SystemLog, User } from '../types';
import { formatDateTime } from '../utils/formatters';

interface SystemLogsProps {
  logs: SystemLog[];
  users: User[];
  onExport?: (format: 'csv' | 'json') => void;
  onClearLogs?: () => void;
}

const SystemLogs: React.FC<SystemLogsProps> = ({
  logs,
  users,
  onExport,
  onClearLogs,
}) => {
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 50;

  const getUser = (userId?: string) => users.find(u => u.id === userId);

  // Derive unique action types for filter dropdown
  const actionTypes = useMemo(() => {
    const types = new Set(logs.map(log => log.action));
    return Array.from(types).sort();
  }, [logs]);

  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Apply action filter
    if (actionFilter !== 'all') {
      result = result.filter(log => log.action === actionFilter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(log =>
        log.action.toLowerCase().includes(query) ||
        log.userName?.toLowerCase().includes(query) ||
        log.userEmail?.toLowerCase().includes(query) ||
        log.ipAddress?.includes(query)
      );
    }

    // Apply date range
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      result = result.filter(log => new Date(log.createdAt) >= startDate);
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(log => new Date(log.createdAt) <= endDate);
    }

    // Sort by createdAt descending
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [logs, actionFilter, searchQuery, dateRange]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * logsPerPage;
    return filteredLogs.slice(start, start + logsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const getActionColor = (action: string) => {
    const a = action.toLowerCase();
    if (a.includes('login') || a.includes('logout') || a.includes('auth'))
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (a.includes('error') || a.includes('fail'))
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    if (a.includes('create') || a.includes('submit'))
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (a.includes('update') || a.includes('change'))
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (a.includes('delete') || a.includes('remove'))
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/30';
  };

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = logs.filter(log => new Date(log.createdAt) >= today);

    return {
      total: logs.length,
      today: todayLogs.length,
      authEvents: logs.filter(log => log.action.toLowerCase().includes('login') || log.action.toLowerCase().includes('auth')).length,
      uniqueUsers: new Set(logs.filter(l => l.userId).map(l => l.userId)).size,
      uniqueIPs: new Set(logs.filter(l => l.ipAddress).map(l => l.ipAddress)).size,
    };
  }, [logs]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Logs</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Monitor and analyze system activity</p>
        </div>
        <div className="flex gap-3">
          {onExport && (
            <>
              <button
                onClick={() => onExport('csv')}
                className="px-4 py-2 bg-white dark:bg-background-card border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg hover:border-primary transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">bar_chart</span> Export CSV
              </button>
              <button
                onClick={() => onExport('json')}
                className="px-4 py-2 bg-white dark:bg-background-card border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-lg hover:border-primary transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">folder</span> Export JSON
              </button>
            </>
          )}
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined">delete</span> Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">bar_chart</span>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-sm">Total Logs</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.total.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
              <span className="material-symbols-outlined">calendar_today</span>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-sm">Today</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.today.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
              <span className="material-symbols-outlined">person</span>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-sm">Unique Users</div>
              <div className="text-xl font-bold text-purple-400">{stats.uniqueUsers.toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined">security</span>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-sm">Auth Events</div>
              <div className="text-xl font-bold text-amber-400">{stats.authEvents.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2"><span className="material-symbols-outlined text-slate-500 dark:text-slate-400">search</span></span>
              <input
                type="text"
                placeholder="Search logs by message, user, or IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
          >
            <option value="all">All Actions</option>
            {actionTypes.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>

          {/* Date Range */}
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
            />
            <span className="text-slate-500 dark:text-slate-400 self-center">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-sm font-medium border-b border-slate-200 dark:border-slate-800">
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2">Action</div>
          <div className="col-span-3">User</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">IP Address</div>
        </div>

        {/* Table Body */}
        {paginatedLogs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4"><span className="material-symbols-outlined text-4xl">receipt_long</span></div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No logs found</h3>
            <p className="text-slate-500 dark:text-slate-400">No logs match your current filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedLogs.map((log) => (
              <div
                key={log.id}
                className="grid grid-cols-12 gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors items-center"
                onClick={() => setSelectedLog(log)}
              >
                <div className="col-span-2 text-slate-500 dark:text-slate-400 text-sm">
                  {formatDate(log.createdAt)}
                </div>
                <div className="col-span-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </div>
                <div className="col-span-3 text-slate-900 dark:text-white truncate">
                  {log.userName || '-'}
                </div>
                <div className="col-span-3 text-slate-500 dark:text-slate-400 text-sm truncate">
                  {log.userEmail || '-'}
                </div>
                <div className="col-span-2 text-slate-500 dark:text-slate-400 text-sm font-mono">
                  {log.ipAddress}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-slate-500 dark:text-slate-400 text-sm">
              Showing {((currentPage - 1) * logsPerPage) + 1} - {Math.min(currentPage * logsPerPage, filteredLogs.length)} of {filteredLogs.length} logs
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">first_page</span>
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <span className="px-4 py-1 text-slate-900 dark:text-white">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-sm">last_page</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-xs font-medium border ${getActionColor(selectedLog.action)}`}>
                  {selectedLog.action}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              <div>
                <label className="text-slate-500 dark:text-slate-400 text-sm">Action</label>
                <p className="text-slate-900 dark:text-white mt-1">{selectedLog.action}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-500 dark:text-slate-400 text-sm">Timestamp</label>
                  <p className="text-slate-900 dark:text-white mt-1">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div>
                  <label className="text-slate-500 dark:text-slate-400 text-sm">IP Address</label>
                  <p className="text-slate-900 dark:text-white font-mono mt-1">{selectedLog.ipAddress}</p>
                </div>
              </div>

              {selectedLog.userId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 text-sm">User</label>
                    <p className="text-slate-900 dark:text-white mt-1">{selectedLog.userName || '-'}</p>
                  </div>
                  <div>
                    <label className="text-slate-500 dark:text-slate-400 text-sm">Email</label>
                    <p className="text-slate-900 dark:text-white mt-1">{selectedLog.userEmail || '-'}</p>
                  </div>
                </div>
              )}

              {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                <div>
                  <label className="text-slate-500 dark:text-slate-400 text-sm">Details</label>
                  <pre className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 mt-1 text-sm text-slate-700 dark:text-slate-300 overflow-x-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemLogs;
