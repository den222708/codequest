import React from 'react';

interface Props {
  role: 'professor' | 'admin';
}

const Analytics: React.FC<Props> = ({ role }) => {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          {role === 'admin' ? 'University-wide performance metrics' : 'Your class performance overview'}
        </p>
      </div>

      {/* Empty State */}
      <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-16 text-center">
        <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">analytics</span>
        <h2 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">No Analytics Data Yet</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Analytics will appear here once students begin submitting assessments and activity is recorded on the platform.
        </p>
      </div>
    </div>
  );
};

export default Analytics;
