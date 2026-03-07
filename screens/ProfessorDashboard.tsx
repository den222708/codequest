import React from 'react';
import { useNavigate } from 'react-router-dom';
import { View } from '../types';
import { useApp } from '../store/AppContext';

interface Props {
  onNavigate: (view: View) => void;
}

const ProfessorDashboard: React.FC<Props> = ({ onNavigate }) => {
  const { currentUser } = useApp();
  const navigate = useNavigate();

  const quickActions = [
    { label: 'Assessments', icon: 'quiz', path: '/professor/assessments', desc: 'Create & manage assessments' },
    { label: 'Question Bank', icon: 'database', path: '/professor/questions', desc: 'Browse & create questions' },
    { label: 'Analytics', icon: 'bar_chart', path: '/professor/analytics', desc: 'View performance analytics' },
    { label: 'Leaderboard', icon: 'leaderboard', path: '/professor/leaderboard', desc: 'Student rankings' },
    { label: 'Live Monitor', icon: 'monitor_heart', path: '/professor/live-monitor', desc: 'Monitor live assessments' },
    { label: 'Plagiarism', icon: 'shield', path: '/professor/plagiarism', desc: 'Review plagiarism reports' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {currentUser?.name || 'Professor'}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">What would you like to do today?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="bg-white dark:bg-background-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/40 transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
              <span className="material-symbols-outlined">{action.icon}</span>
            </div>
            <h3 className="font-bold text-lg">{action.label}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{action.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfessorDashboard;
