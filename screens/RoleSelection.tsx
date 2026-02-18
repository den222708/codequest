import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Role } from '../types';
import { useApp } from '../store/AppContext';

const RoleSelection: React.FC = () => {
  const navigate = useNavigate();
  const { setRole } = useApp();

  const handleRoleSelect = (role: Role) => {
    setRole(role);
    const dashboardPath =
      role === 'student' ? '/student/dashboard' :
      role === 'professor' ? '/professor/dashboard' :
      '/admin/dashboard';
    navigate(dashboardPath, { replace: true });
  };
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 text-slate-900 dark:text-white">
      <div className="max-w-4xl w-full flex flex-col gap-10">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            Welcome! Please select your role
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
            Choose the profile that matches your university credentials to access your personalized dashboard.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student */}
          <button
            onClick={() => handleRoleSelect('student')}
            className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-white dark:bg-background-card border-2 border-transparent hover:border-primary hover:shadow-2xl transition-all duration-300"
          >
            <div className="mb-6 rounded-full bg-primary p-5 text-white shadow-lg group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-4xl">school</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Student</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Take coding assessments, practice problems, and track your ranking against peers.
            </p>
          </button>

          {/* Professor */}
          <button
            onClick={() => handleRoleSelect('professor')}
            className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-white dark:bg-background-card border-2 border-transparent hover:border-primary hover:shadow-2xl transition-all duration-300"
          >
            <div className="mb-6 rounded-full bg-primary/10 text-primary p-5 group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-4xl">co_present</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Professor</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Create exams, manage courses, grade submissions, and monitor class performance.
            </p>
          </button>

          {/* Admin */}
          <button
            onClick={() => handleRoleSelect('admin')}
            className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-white dark:bg-background-card border-2 border-transparent hover:border-primary hover:shadow-2xl transition-all duration-300"
          >
            <div className="mb-6 rounded-full bg-primary/10 text-primary p-5 group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined text-4xl">admin_panel_settings</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Administrator</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Manage platform users, configure system settings, and generate university reports.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;