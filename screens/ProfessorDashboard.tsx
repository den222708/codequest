import React from 'react';
import { View } from '../types';

interface Props {
  onNavigate: (view: View) => void;
}

const ProfessorDashboard: React.FC<Props> = ({ onNavigate }) => {
  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <h2 className="text-lg font-bold">University Analytics Overview</h2>
        <div className="flex gap-4">
          <label className="relative hidden md:block">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><span className="material-symbols-outlined">search</span></span>
            <input type="text" placeholder="Search analytics..." className="pl-10 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-transparent focus:ring-2 focus:ring-primary w-64 text-sm" />
          </label>
          <div className="flex gap-2">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Active Students', value: '12,450', icon: 'school', change: '+12%', changeColor: 'green' },
          { label: 'Total Professors', value: '340', icon: 'person_apron', change: '+5%', changeColor: 'green' },
          { label: 'Assessments Conducted', value: '1,205', icon: 'quiz', change: '+8%', changeColor: 'green' },
          { label: 'Average Pass Rate', value: '76.4%', icon: 'trending_up', change: '-2%', changeColor: 'red' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-background-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-primary/10 text-primary rounded-lg">
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${kpi.changeColor === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                {kpi.change} vs last month
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{kpi.label}</p>
              <p className="text-3xl font-bold mt-1 tracking-tight">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Line Chart Area */}
        <div className="xl:col-span-2 bg-white dark:bg-background-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[300px]">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold">Student Performance Trends</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Monthly average scores across all departments</p>
            </div>
            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded">Year 2023</span>
          </div>
          {/* Visual SVG Chart */}
          <div className="flex-1 relative w-full h-full flex items-end">
             <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
               <defs>
                 <linearGradient id="chartGradientProf" x1="0" y1="0" x2="0" y2="1">
                   <stop offset="0%" stopColor="#0d8ea5" stopOpacity={0.2}/>
                   <stop offset="100%" stopColor="#0d8ea5" stopOpacity={0}/>
                 </linearGradient>
               </defs>
               <path d="M0,40 Q10,38 20,30 T40,25 T60,20 T80,15 T100,10 V50 H0 Z" fill="url(#chartGradientProf)" />
               <path d="M0,40 Q10,38 20,30 T40,25 T60,20 T80,15 T100,10" fill="none" stroke="#0d8ea5" strokeWidth="1" />
               <circle cx="20" cy="30" r="1.5" fill="#fff" stroke="#0d8ea5" strokeWidth="1"/>
               <circle cx="40" cy="25" r="1.5" fill="#fff" stroke="#0d8ea5" strokeWidth="1"/>
               <circle cx="60" cy="20" r="1.5" fill="#fff" stroke="#0d8ea5" strokeWidth="1"/>
               <circle cx="80" cy="15" r="1.5" fill="#fff" stroke="#0d8ea5" strokeWidth="1"/>
             </svg>
             {/* X-Axis labels mocked via absolute positioning or flex would be cleaner in HTML, keeping SVG simple */}
          </div>
          <div className="flex justify-between mt-4 text-xs font-medium text-slate-400 uppercase tracking-wide">
            <span>Jan</span><span>Mar</span><span>May</span><span>Jul</span><span>Sep</span><span>Nov</span>
          </div>
        </div>

        {/* Department Bar Chart */}
        <div className="bg-white dark:bg-background-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-lg font-bold">Departmental Comparison</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Engagement Score (0-10)</p>
          </div>
          <div className="flex-1 flex items-end justify-between gap-4 px-2 min-h-[200px]">
            {/* Bars */}
            {[
              { label: 'CS', h: '85%', val: '8.5' },
              { label: 'IT', h: '70%', val: '7.0', opacity: '60' },
              { label: 'ECE', h: '55%', val: '5.5', opacity: '40' },
              { label: 'MECH', h: '60%', val: '6.0', opacity: '30' },
            ].map((bar, i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer h-full justify-end">
                <div className={`w-full rounded-t-lg bg-primary hover:bg-primary-dark transition-all relative group`} style={{ height: bar.h, opacity: bar.opacity ? Number(bar.opacity)/100 : 1 }}>
                   <span className="absolute -top-6 w-full text-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{bar.val}</span>
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">{bar.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h3 className="font-bold">System Health</h3>
            <span className="material-symbols-outlined text-slate-400">dns</span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-medium">Main Server Status</span>
              </div>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">Online (99.9%)</span>
            </div>
            {/* ... other metrics ... */}
          </div>
        </div>

        {/* Plagiarism Alerts */}
        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h3 className="font-bold">Latest Plagiarism Alerts</h3>
            <span className="material-symbols-outlined text-orange-500">warning</span>
          </div>
          <div className="space-y-0">
            <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors flex gap-3">
              <span className="material-symbols-outlined text-red-500 mt-0.5 text-lg">error</span>
              <div>
                <p className="text-sm font-bold">High similarity (92%) detected</p>
                <p className="text-xs text-slate-500">Intro to Python • Student #4402</p>
              </div>
            </div>
            <div className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer transition-colors flex gap-3">
              <span className="material-symbols-outlined text-yellow-500 mt-0.5 text-lg">warning</span>
              <div>
                <p className="text-sm font-bold">Medium similarity (45%) detected</p>
                <p className="text-xs text-slate-500">Data Structures Final • Student #9102</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recently Created */}
        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h3 className="font-bold">Recently Created</h3>
            <span className="material-symbols-outlined text-slate-400">post_add</span>
          </div>
          <div className="space-y-0">
             <div className="p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors">
               <div className="flex gap-3 items-center">
                 <div className="bg-primary/10 p-2 rounded text-primary"><span className="material-symbols-outlined text-lg">code</span></div>
                 <div>
                   <p className="text-sm font-bold">Advanced Java OOP</p>
                   <p className="text-xs text-slate-500">Prof. Sarah Jenkins</p>
                 </div>
               </div>
               <span className="text-xs text-slate-400">2m ago</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessorDashboard;