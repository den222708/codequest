import React, { useState } from 'react';
import { Notification } from '../types';

interface Props {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
}

const Notifications: React.FC<Props> = ({ notifications, onMarkRead, onClearAll }) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'all' 
    ? notifications 
    : notifications.filter(n => !n.read);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return 'check_circle';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'assessment': return 'assignment';
      case 'submission': return 'grading';
      case 'system': return 'settings';
      default: return 'info';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'error': return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      case 'warning': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
      case 'assessment': return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
      case 'submission': return 'text-teal-500 bg-teal-100 dark:bg-teal-900/30';
      case 'system': return 'text-slate-500 bg-slate-100 dark:bg-slate-700/30';
      default: return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={onClearAll}
            className="px-4 py-2 text-primary hover:bg-primary/10 rounded-lg font-medium flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">done_all</span>
            Mark all as read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'all' 
              ? 'bg-white dark:bg-background-card shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
            filter === 'unread' 
              ? 'bg-white dark:bg-background-card shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Unread
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-primary text-white text-xs rounded-full">{unreadCount}</span>
          )}
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl text-slate-300">notifications_off</span>
            </div>
            <h3 className="font-bold text-lg mb-1">No notifications</h3>
            <p className="text-slate-500">
              {filter === 'unread' ? 'All caught up! No unread notifications.' : 'You have no notifications yet.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`bg-white dark:bg-background-card rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer ${
                notification.read 
                  ? 'border-slate-200 dark:border-slate-800' 
                  : 'border-primary/30 bg-primary/5 dark:bg-primary/10'
              }`}
              onClick={() => !notification.read && onMarkRead(notification.id)}
            >
              <div className="flex gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(notification.type)}`}>
                  <span className="material-symbols-outlined text-xl">{getIcon(notification.type)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className={`font-bold ${notification.read ? '' : 'text-primary'}`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-500">{formatTime(notification.createdAt)}</span>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  </div>
                  {notification.link && (
                    <button className="mt-3 text-sm font-medium text-primary hover:underline flex items-center gap-1">
                      View details
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
