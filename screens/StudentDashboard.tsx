import React from 'react';
import { View, Assessment } from '../types';
import { useApp } from '../store/AppContext';

interface Props {
  onNavigate: (view: View, assessmentId?: string) => void;
  assessments: Assessment[];
}

const StudentDashboard: React.FC<Props> = ({ onNavigate, assessments }) => {
  const { currentUser } = useApp();

  const studentAssessments = [...assessments]
    .filter(a => a.status !== 'draft')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 4);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') return 'bg-amber-500/90';
    if (status === 'completed') return 'bg-purple-500/90';
    return 'bg-emerald-500/90';
  };

  const getActionLabel = (status: string) => {
    if (status === 'active') return 'Resume';
    if (status === 'completed') return 'View';
    return 'Start';
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {currentUser?.name || 'Student'}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Here are your upcoming assessments</p>
        </div>
        <button onClick={() => onNavigate('all-assessments')} className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-sm">assignment</span>
          All Assessments
        </button>
      </div>

      {/* Assessments */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">My Assessments</h2>
          <button onClick={() => onNavigate('all-assessments')} className="text-primary text-sm font-bold hover:underline">View All</button>
        </div>

        {studentAssessments.length === 0 && (
          <div className="bg-white dark:bg-background-card p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">assignment</span>
            <p className="text-slate-500">No assessments available yet.</p>
            <button onClick={() => onNavigate('all-assessments')} className="mt-3 text-primary text-sm font-bold hover:underline">Browse Assessments</button>
          </div>
        )}

        {studentAssessments.map((assessment, idx) => (
          <div key={assessment.id} className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-background-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
            <div className="w-full sm:w-48 h-32 rounded-lg relative overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
              <span className="material-symbols-outlined text-white/80 text-4xl">{idx % 2 === 0 ? 'code' : 'data_object'}</span>
              <div className={`absolute top-2 left-2 ${getStatusBadge(assessment.status)} text-white text-[10px] font-bold px-2 py-1 rounded uppercase`}>
                {assessment.status === 'active' ? 'IN PROGRESS' : assessment.status}
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-3">
                  <h3 className="text-lg font-bold line-clamp-1">{assessment.title}</h3>
                  <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded whitespace-nowrap">{assessment.duration} Mins</span>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{assessment.courseCode || 'Course'} • {assessment.professorName || 'Professor'}</p>
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-slate-500">Due: {formatDate(assessment.endDate)}</span>
                <button
                  onClick={() => onNavigate('instructions', assessment.id)}
                  className="bg-primary text-white text-sm font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                  {getActionLabel(assessment.status)}
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default StudentDashboard;
