import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { View, Assessment } from '../types';

interface Props {
  onNavigate: (view: View, assessmentId?: string) => void;
  assessments: Assessment[];
}

const data = [
  { name: 'Sep 1', score: 65 },
  { name: 'Sep 8', score: 70 },
  { name: 'Sep 15', score: 68 },
  { name: 'Sep 22', score: 75 },
  { name: 'Sep 29', score: 85 },
  { name: 'Oct 6', score: 82 },
  { name: 'Oct 13', score: 92 },
];

const StudentDashboard: React.FC<Props> = ({ onNavigate, assessments }) => {
  const studentAssessments = [...assessments]
    .filter(a => a.status !== 'draft')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 2);

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
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, Alex</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Computer Science • Sophomore • Semester 4</p>
        </div>
        <button onClick={() => onNavigate('all-assessments')} className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-sm">code</span>
          New Project
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Chart */}
          <section className="bg-white dark:bg-background-card rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Score Progression</h2>
              <select className="bg-transparent text-sm font-medium text-slate-500 border-none outline-none cursor-pointer">
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d8ea5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0d8ea5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#1a2c30', border: 'none', borderRadius: '8px', color: '#fff'}}
                    itemStyle={{color: '#fff'}}
                  />
                  <Area type="monotone" dataKey="score" stroke="#0d8ea5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Assessments */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">My Assessments</h2>
              <button onClick={() => onNavigate('all-assessments')} className="text-primary text-sm font-bold hover:underline">View All</button>
            </div>

            {studentAssessments.length === 0 && (
              <div className="bg-white dark:bg-background-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
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

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="bg-white dark:bg-background-card p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">bar_chart</span>
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center">
                <span className="text-xs text-slate-500 uppercase font-bold">Rank</span>
                <p className="text-2xl font-bold mt-1">#42</p>
                <span className="text-[10px] text-emerald-500">Top 5%</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-center">
                <span className="text-xs text-slate-500 uppercase font-bold">Avg Score</span>
                <p className="text-2xl font-bold mt-1">88%</p>
                <span className="text-[10px] text-emerald-500">+2.4%</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-background-card p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Recent Activity
              </h3>
              <button onClick={() => onNavigate('submission-history')} className="text-xs text-primary font-bold">View All</button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium">Failed Test Case</p>
                  <p className="text-xs text-slate-500">QuickSort.py • 2 errors found</p>
                  <span className="text-[10px] text-slate-400">10 mins ago</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                <div>
                  <p className="text-sm font-medium">Passed Submission</p>
                  <p className="text-xs text-slate-500">BinaryTree.java • 100% coverage</p>
                  <span className="text-[10px] text-slate-400">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StudentDashboard;
