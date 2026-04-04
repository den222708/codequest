import React, { useState } from 'react';
import { Backup } from '../types';
import { formatDateTime } from '../utils/formatters';

interface BackupManagementProps {
  backups: Backup[];
  onCreateBackup: (options: {
    name: string;
    type: 'full' | 'incremental' | 'differential';
    includes: ('users' | 'assessments' | 'questions' | 'submissions' | 'logs')[];
  }) => void;
  onRestoreBackup?: (backupId: string) => void;
  onDeleteBackup: (backupId: string) => void;
  onDownloadBackup?: (backupId: string) => void;
}

const BackupManagement: React.FC<BackupManagementProps> = ({
  backups,
  onCreateBackup,
  onRestoreBackup,
  onDeleteBackup,
  onDownloadBackup,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newBackup, setNewBackup] = useState({
    name: '',
    type: 'full' as 'full' | 'incremental' | 'differential',
    includes: ['users', 'assessments', 'questions', 'submissions', 'logs'] as ('users' | 'assessments' | 'questions' | 'submissions' | 'logs')[],
  });

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'scheduled': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-500 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full': return <span className="material-symbols-outlined">inventory_2</span>;
      case 'incremental': return <span className="material-symbols-outlined">trending_up</span>;
      case 'differential': return <span className="material-symbols-outlined">bar_chart</span>;
      default: return <span className="material-symbols-outlined">save</span>;
    }
  };

  const handleCreateBackup = () => {
    if (newBackup.name.trim()) {
      onCreateBackup({
        name: newBackup.name,
        type: newBackup.type,
        includes: [...newBackup.includes],
      });
      setShowCreateModal(false);
      setNewBackup({
        name: '',
        type: 'full',
        includes: ['users', 'assessments', 'questions', 'submissions', 'logs'],
      });
    }
  };

  const toggleInclude = (item: typeof newBackup.includes[number]) => {
    setNewBackup(prev => ({
      ...prev,
      includes: prev.includes.includes(item)
        ? prev.includes.filter(i => i !== item)
        : [...prev.includes, item],
    }));
  };

  const stats = {
    total: backups.length,
    completed: backups.filter(b => b.status === 'completed').length,
    totalSize: backups.reduce((acc, b) => acc + b.size, 0),
    lastBackup: backups.length > 0
      ? backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
      : null,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Backup Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Create and manage system backups</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined">add</span> Create Backup
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-sm">Total Backups</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
              <span className="material-symbols-outlined text-xs">check</span>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-sm">Completed</div>
              <div className="text-xl font-bold text-emerald-400">{stats.completed}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">
              <span className="material-symbols-outlined">save</span>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-sm">Total Size</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{formatSize(stats.totalSize)}</div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
              <span className="material-symbols-outlined">schedule</span>
            </div>
            <div>
              <div className="text-slate-500 dark:text-slate-400 text-sm">Last Backup</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {stats.lastBackup ? formatDate(stats.lastBackup.createdAt) : 'Never'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-slate-900 dark:text-white font-medium">Backup History</h3>
        </div>

        {backups.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4"><span className="material-symbols-outlined">save</span></div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No backups yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Create your first backup to protect your data</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Create First Backup
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {backups.map((backup) => (
              <div key={backup.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">{getTypeIcon(backup.type)}</div>
                    <div>
                      <h4 className="text-slate-900 dark:text-white font-medium">{backup.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                        <span className={`px-2 py-0.5 rounded text-xs border ${getStatusColor(backup.status)}`}>
                          {backup.status.replace('_', ' ')}
                        </span>
                        <span className="capitalize">{backup.type}</span>
                        <span>•</span>
                        <span>{formatSize(backup.size)}</span>
                        <span>•</span>
                        <span>{formatDate(backup.createdAt)}</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        {backup.includes.map((item) => (
                          <span
                            key={item}
                            className="px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded capitalize"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {backup.status === 'completed' && (
                      <>
                        <button
                          onClick={() => onDownloadBackup?.(backup.id)}
                          className="p-2 hover:bg-primary/20 rounded-lg transition-colors text-primary"
                          title="Download"
                        >
                          <span className="material-symbols-outlined">download</span>
                        </button>
                        <button
                          onClick={() => setShowRestoreConfirm(backup.id)}
                          className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors text-blue-400"
                          title="Restore"
                        >
                          <span className="material-symbols-outlined">restore</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowDeleteConfirm(backup.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Backup</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-sm mb-2">Backup Name</label>
                <input
                  type="text"
                  value={newBackup.name}
                  onChange={(e) => setNewBackup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter backup name..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-sm mb-2">Backup Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['full', 'incremental', 'differential'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewBackup(prev => ({ ...prev, type }))}
                      className={`p-3 rounded-lg border transition-colors capitalize ${
                        newBackup.type === type
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}
                    >
                      <div className="text-2xl mb-1">{getTypeIcon(type)}</div>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 text-sm mb-2">Include Data</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['users', 'assessments', 'questions', 'submissions', 'logs'] as const).map((item) => (
                    <label
                      key={item}
                      className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors capitalize ${
                        newBackup.includes.includes(item)
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={newBackup.includes.includes(item)}
                        onChange={() => toggleInclude(item)}
                        className="sr-only"
                      />
                      <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                        newBackup.includes.includes(item) ? 'bg-primary border-primary' : 'border-slate-400 dark:border-slate-600'
                      }`}>
                        {newBackup.includes.includes(item) && <span className="material-symbols-outlined text-xs">check</span>}
                      </span>
                      {item}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBackup}
                disabled={!newBackup.name.trim() || newBackup.includes.length === 0}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Backup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Confirm Restore</h2>
            </div>
            <div className="p-4">
              <p className="text-slate-700 dark:text-slate-300">
                Are you sure you want to restore from this backup? This will overwrite current data.
              </p>
              <p className="text-amber-400 text-sm mt-2 flex items-center gap-1">
                <span className="material-symbols-outlined">warning</span> This action cannot be undone. Make sure you have a current backup before proceeding.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowRestoreConfirm(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRestoreBackup?.(showRestoreConfirm);
                  setShowRestoreConfirm(null);
                }}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-md">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Backup</h2>
            </div>
            <div className="p-4">
              <p className="text-slate-700 dark:text-slate-300">
                Are you sure you want to delete this backup? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteBackup(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManagement;
