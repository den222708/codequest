import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  role: Role;
  onLogout: () => void;
  darkMode: boolean;
  toggleTheme: () => void;
  userName?: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  role,
  onLogout,
  darkMode,
  toggleTheme,
  userName = ''
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

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
    { icon: 'school', label: 'Courses', path: '/admin/courses' },
    { icon: 'group', label: 'User Management', path: '/admin/users' },
    { icon: 'analytics', label: 'Analytics', path: '/admin/analytics' },
  ];

  const getLinks = () => {
    switch (role) {
      case 'student': return studentLinks;
      case 'professor': return profLinks;
      case 'admin': return adminLinks;
      default: return adminLinks;
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
            <span className="material-symbols-outlined min-w-[24px] flex-shrink-0">
              {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined min-w-[24px] flex-shrink-0">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
            {!sidebarCollapsed && <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <span className="material-symbols-outlined min-w-[24px] flex-shrink-0">logout</span>
            {!sidebarCollapsed && <span>Sign Out</span>}
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

    </div>
  );
};

export default Layout;
