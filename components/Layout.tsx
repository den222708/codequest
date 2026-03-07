import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Role, Notification } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  role: Role;
  onLogout: () => void;
  darkMode: boolean;
  toggleTheme: () => void;
  notifications?: Notification[];
  userName?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  role,
  onLogout,
  darkMode,
  toggleTheme,
  notifications = [],
  userName = ''
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const unreadCount = notifications.filter(n => !n.read).length;

  const studentLinks = [
    { icon: 'dashboard', label: 'Dashboard', path: '/student/dashboard' },
    { icon: 'assignment', label: 'Assessments', path: '/student/assessments' },
    { icon: 'history', label: 'Submissions', path: '/student/submissions' },
    { icon: 'leaderboard', label: 'Leaderboard', path: '/student/leaderboard' },
    { icon: 'person', label: 'Profile', path: '/student/profile' },
  ];

  const profLinks = [
    { icon: 'dashboard', label: 'Dashboard', path: '/professor/dashboard' },
    { icon: 'assignment', label: 'Assessments', path: '/professor/assessments' },
    { icon: 'cast_for_education', label: 'Live Monitor', path: '/professor/live-monitor' },
    { icon: 'analytics', label: 'Analytics', path: '/professor/analytics' },
    { icon: 'leaderboard', label: 'Leaderboard', path: '/professor/leaderboard' },
    { icon: 'group', label: 'Group Setup', path: '/professor/group-setup' },
    { icon: 'warning', label: 'Plagiarism', path: '/professor/plagiarism' },
  ];

  const adminLinks = [
    { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
    { icon: 'school', label: 'Courses', path: '/admin/courses' },
    { icon: 'group', label: 'User Management', path: '/admin/users' },
    { icon: 'analytics', label: 'Analytics', path: '/admin/analytics' },
    { icon: 'monitoring', label: 'System Health', path: '/admin/system/health' },
    { icon: 'description', label: 'System Logs', path: '/admin/system/logs' },
    { icon: 'settings', label: 'Settings', path: '/admin/settings' },
  ];

  // Sub Admin - limited user management, view-only access to certain admin features
  const subadminLinks = [
    { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
    { icon: 'school', label: 'Courses', path: '/admin/courses' },
    { icon: 'group', label: 'User Management', path: '/admin/users' },
    { icon: 'analytics', label: 'Analytics', path: '/admin/analytics' },
    { icon: 'monitoring', label: 'System Health', path: '/admin/system/health' },
    { icon: 'description', label: 'System Logs', path: '/admin/system/logs' },
  ];

  // Super Admin - full system access including admin management
  const superadminLinks = [
    { icon: 'dashboard', label: 'Dashboard', path: '/admin/dashboard' },
    { icon: 'school', label: 'Courses', path: '/admin/courses' },
    { icon: 'group', label: 'User Management', path: '/admin/users' },
    { icon: 'admin_panel_settings', label: 'Admin Management', path: '/admin/admins' },
    { icon: 'analytics', label: 'Analytics', path: '/admin/analytics' },
    { icon: 'quiz', label: 'Question Bank', path: '/professor/questions' },
    { icon: 'assignment', label: 'Assessments', path: '/professor/assessments' },
    { icon: 'monitoring', label: 'System Health', path: '/admin/system/health' },
    { icon: 'description', label: 'System Logs', path: '/admin/system/logs' },
    { icon: 'settings', label: 'Settings', path: '/admin/settings' },
  ];

  const getLinks = () => {
    switch (role) {
      case 'student': return studentLinks;
      case 'professor': return profLinks;
      case 'subadmin': return subadminLinks;
      case 'superadmin': return superadminLinks;
      default: return adminLinks; // admin
    }
  };

  const links = getLinks();

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-background-card flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined">code_blocks</span>
          </div>
          {!sidebarCollapsed && <span className="font-bold text-lg">CodeQuest</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + '/');
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                title={sidebarCollapsed ? link.label : undefined}
              >
                <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>
                  {link.icon}
                </span>
                {!sidebarCollapsed && link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">
              {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
            {!sidebarCollapsed && 'Collapse'}
          </button>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
            {!sidebarCollapsed && (darkMode ? 'Light Mode' : 'Dark Mode')}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            {!sidebarCollapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-card flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold capitalize">
              {location.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:block relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <span className="material-symbols-outlined text-xl">search</span>
              </span>
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 relative"
              >
                <span className="material-symbols-outlined">notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-white dark:bg-background-card rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50">
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold">Notifications</h3>
                    <button
                      onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                      className="text-sm text-primary font-medium"
                    >
                      View All
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.slice(0, 5).map(n => (
                      <div
                        key={n.id}
                        className={`p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${!n.read ? 'bg-primary/5' : ''
                          }`}
                      >
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{n.message}</p>
                      </div>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-8 text-center text-slate-500">
                        <span className="material-symbols-outlined text-3xl mb-2">notifications_off</span>
                        <p className="text-sm">No notifications</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
              <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                {(userName || role).substring(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">
                  {userName || role}
                </p>
                <p className="text-xs text-slate-500 capitalize">{role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  );
};

export default Layout;
