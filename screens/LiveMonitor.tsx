import React, { useState } from 'react';
import { useApp } from '../store/AppContext';

interface Props {
  onBack: () => void;
}

const LiveMonitor: React.FC<Props> = ({ onBack }) => {
  const { assessments } = useApp();
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null);

  // Mock data for demonstration
  const activeStudents = [
    { id: '1', name: 'Sarah Jenkins', initials: 'SJ', problem: 'P3: Binary Trees', time: '45m 12s', status: 'active', progress: 75 },
    { id: '2', name: 'David Kim', initials: 'DK', problem: 'P2: LinkedLists', time: '22m 18s', status: 'flagged', progress: 40, alert: 'High Plagiarism Risk' },
    { id: '3', name: 'Maria Garcia', initials: 'MG', problem: 'P4: Hash Tables', time: '31m 45s', status: 'active', progress: 60 },
    { id: '4', name: 'James Wilson', initials: 'JW', problem: 'P1: Arrays', time: '52m 30s', status: 'completed', progress: 100 },
    { id: '5', name: 'Emily Chen', initials: 'EC', problem: 'P2: LinkedLists', time: '18m 05s', status: 'active', progress: 35 },
  ];

  const liveSubmissions = [
    { student: 'Arjun S.', action: 'passed Problem 1', time: 'Just now', type: 'success' },
    { student: 'Lisa M.', action: 'failed compilation on P2', time: '2 mins ago', type: 'error' },
    { student: 'John D.', action: 'submitted Problem 3', time: '5 mins ago', type: 'info' },
    { student: 'Sarah J.', action: 'started Problem 4', time: '8 mins ago', type: 'info' },
  ];

  const activeAssessments = assessments?.filter(a => a.status === 'active') || [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-primary text-xs font-bold uppercase tracking-wider">Live Session</span>
          </div>
          <h1 className="text-3xl font-bold">Live Monitor</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time student activity monitoring</p>
        </div>

        <div className="flex gap-3">
          {/* Timer Display */}
          <div className="flex items-center gap-4 bg-white dark:bg-background-card px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-mono font-bold">01</span>
              <span className="text-[10px] text-slate-400 uppercase">Hrs</span>
            </div>
            <span className="text-2xl font-bold text-slate-300">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-mono font-bold">45</span>
              <span className="text-[10px] text-slate-400 uppercase">Min</span>
            </div>
            <span className="text-2xl font-bold text-slate-300">:</span>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-mono font-bold text-primary">23</span>
              <span className="text-[10px] text-primary uppercase">Sec</span>
            </div>
          </div>

          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 rounded-lg transition-all font-bold"
          >
            <span className="material-symbols-outlined">stop_circle</span>
            End Session
          </button>
        </div>
      </div>

      {/* Assessment Selector */}
      <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary">cast_for_education</span>
          <select
            value={selectedAssessment || ''}
            onChange={(e) => setSelectedAssessment(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
          >
            <option value="">Select an assessment to monitor</option>
            {activeAssessments.map(a => (
              <option key={a.id} value={a.id}>{a.title}</option>
            ))}
            {activeAssessments.length === 0 && (
              <option value="demo">Data Structures Quiz: Midterm (Demo)</option>
            )}
          </select>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-background-card rounded-xl p-5 border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-slate-500">groups</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Active Students</p>
          <h3 className="text-3xl font-bold">42<span className="text-lg text-slate-400 font-normal">/50</span></h3>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '84%' }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-background-card rounded-xl p-5 border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-primary">trending_up</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Avg. Progress</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold">65%</h3>
            <span className="text-xs text-green-500 font-medium">+5%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: '65%' }}></div>
          </div>
        </div>

        <div className="bg-white dark:bg-background-card rounded-xl p-5 border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-blue-500">assignment_turned_in</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Submissions</p>
          <h3 className="text-3xl font-bold">128</h3>
          <p className="text-xs text-slate-400 mt-2">Last: 2 min ago</p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-5 border border-red-200 dark:border-red-800/50 relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-20">
            <span className="material-symbols-outlined text-6xl text-red-500">warning</span>
          </div>
          <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-base">notifications_active</span>
            Critical Alerts
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-red-600 dark:text-red-400">2</h3>
            <span className="text-sm text-red-500 font-normal">High Plagiarism Risk</span>
          </div>
          <button className="text-xs font-bold text-red-600 hover:text-red-700 uppercase tracking-wider underline mt-2">
            Review Now
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Student Progress Table */}
        <div className="xl:col-span-2 bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-bold">Student Progress Monitor</h3>
            <div className="flex gap-2">
              <button className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              <button className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                <span className="material-symbols-outlined">search</span>
              </button>
            </div>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
                <tr>
                  {['Student', 'Current Problem', 'Time Spent', 'Progress', 'Status', 'Action'].map(h => (
                    <th key={h} className="py-3 px-5 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider border-b border-slate-200 dark:border-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {activeStudents.map(student => (
                  <tr
                    key={student.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${student.status === 'flagged' ? 'bg-red-50/50 dark:bg-red-900/10 border-l-2 border-l-red-500' : ''
                      }`}
                  >
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${student.status === 'flagged' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                            student.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                              'bg-primary/10 text-primary'
                          }`}>
                          {student.initials}
                        </div>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-sm text-slate-600 dark:text-slate-400">{student.problem}</td>
                    <td className="py-3 px-5 text-sm font-mono">{student.time}</td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-slate-200 dark:bg-slate-700 h-2 rounded-full">
                          <div
                            className={`h-2 rounded-full ${student.status === 'completed' ? 'bg-green-500' : 'bg-primary'
                              }`}
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      {student.status === 'flagged' ? (
                        <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 w-fit">
                          <span className="material-symbols-outlined text-red-500 text-sm">warning</span>
                          <span className="text-red-600 dark:text-red-400 text-xs font-bold">{student.alert}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${student.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'
                            }`}></span>
                          <span className={`text-xs font-medium capitalize ${student.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'
                            }`}>{student.status}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-5">
                      {student.status === 'flagged' ? (
                        <button className="bg-red-500 text-white hover:bg-red-600 px-3 py-1 rounded-md text-xs font-bold">
                          Investigate
                        </button>
                      ) : (
                        <button className="text-primary hover:text-primary-dark p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Feed */}
        <div className="xl:col-span-1 bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden shadow-sm h-fit max-h-[500px]">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              Live Submissions
            </h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Real-time</span>
          </div>
          <div className="overflow-y-auto flex-1 p-4 flex flex-col gap-3 relative">
            {liveSubmissions.map((sub, i) => (
              <div
                key={i}
                className={`flex gap-3 items-start p-3 rounded-lg border ${sub.type === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50' :
                    sub.type === 'error' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50' :
                      'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
              >
                <span className={`material-symbols-outlined text-lg mt-0.5 ${sub.type === 'success' ? 'text-green-500' :
                    sub.type === 'error' ? 'text-red-500' :
                      'text-blue-500'
                  }`}>
                  {sub.type === 'success' ? 'check_circle' : sub.type === 'error' ? 'cancel' : 'info'}
                </span>
                <div>
                  <p className="text-sm">
                    <span className="font-bold">{sub.student}</span> {sub.action}
                  </p>
                  <span className="text-xs text-slate-500">{sub.time}</span>
                </div>
              </div>
            ))}
            <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white dark:from-background-card to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitor;