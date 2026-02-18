import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend } from 'recharts';

interface Props {
  role: 'professor' | 'admin';
}

const Analytics: React.FC<Props> = ({ role }) => {
  const [timeRange, setTimeRange] = useState('30d');

  const performanceData = [
    { month: 'Jan', avgScore: 72, submissions: 450 },
    { month: 'Feb', avgScore: 75, submissions: 520 },
    { month: 'Mar', avgScore: 71, submissions: 480 },
    { month: 'Apr', avgScore: 78, submissions: 590 },
    { month: 'May', avgScore: 82, submissions: 620 },
    { month: 'Jun', avgScore: 79, submissions: 540 },
  ];

  const difficultyData = [
    { name: 'Easy', value: 45, color: '#22c55e' },
    { name: 'Medium', value: 35, color: '#eab308' },
    { name: 'Hard', value: 20, color: '#ef4444' },
  ];

  const topicData = [
    { topic: 'Arrays', solved: 850, total: 1000 },
    { topic: 'Linked Lists', solved: 620, total: 800 },
    { topic: 'Trees', solved: 480, total: 700 },
    { topic: 'Graphs', solved: 320, total: 600 },
    { topic: 'DP', solved: 280, total: 500 },
    { topic: 'Strings', solved: 720, total: 900 },
  ];

  const leaderboardData = [
    { rank: 1, name: 'Alex Johnson', score: 2450, solved: 156, avatar: 'AJ' },
    { rank: 2, name: 'Priya Sharma', score: 2380, solved: 149, avatar: 'PS' },
    { rank: 3, name: 'David Kim', score: 2290, solved: 142, avatar: 'DK' },
    { rank: 4, name: 'Jessica Lee', score: 2150, solved: 138, avatar: 'JL' },
    { rank: 5, name: 'Marcus Chen', score: 2080, solved: 131, avatar: 'MC' },
  ];

  const recentActivity = [
    { type: 'submission', user: 'Alex J.', action: 'solved Two Sum', time: '2m ago', status: 'success' },
    { type: 'submission', user: 'Priya S.', action: 'failed Graph DFS', time: '5m ago', status: 'error' },
    { type: 'assessment', user: 'Prof. Turing', action: 'created new quiz', time: '12m ago', status: 'info' },
    { type: 'submission', user: 'David K.', action: 'solved Binary Search', time: '18m ago', status: 'success' },
    { type: 'user', user: 'Admin', action: 'added 5 new students', time: '1h ago', status: 'info' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {role === 'admin' ? 'University-wide performance metrics' : 'Your class performance overview'}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">download</span>
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Submissions', value: '12,450', change: '+12%', icon: 'upload_file', color: 'blue' },
          { label: 'Average Score', value: '78.5%', change: '+3.2%', icon: 'grade', color: 'green' },
          { label: 'Active Students', value: '1,240', change: '+8%', icon: 'groups', color: 'purple' },
          { label: 'Completion Rate', value: '85.2%', change: '-2.1%', icon: 'task_alt', color: 'amber', negative: true },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg bg-${kpi.color}-500/10 text-${kpi.color}-500`}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                kpi.negative 
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                  : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              }`}>
                {kpi.change}
              </span>
            </div>
            <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
            <p className="text-3xl font-bold mt-1">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold">Performance Trend</h3>
              <p className="text-sm text-slate-500">Average scores over time</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d8ea5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0d8ea5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[60, 90]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a2c30', border: 'none', borderRadius: '8px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="avgScore" stroke="#0d8ea5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Distribution */}
        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold mb-6">Difficulty Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {difficultyData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-sm text-slate-500">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Topic Performance & Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Performance */}
        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold mb-6">Topic-wise Performance</h3>
          <div className="space-y-4">
            {topicData.map((topic, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{topic.topic}</span>
                  <span className="text-slate-500">{Math.round((topic.solved / topic.total) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${(topic.solved / topic.total) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Top Performers</h3>
            <button className="text-primary text-sm font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-3">
            {leaderboardData.map((user, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  i === 0 ? 'bg-yellow-100 text-yellow-600' :
                  i === 1 ? 'bg-slate-200 text-slate-600' :
                  i === 2 ? 'bg-orange-100 text-orange-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {user.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {user.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-bold">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.solved} problems solved</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{user.score}</p>
                  <p className="text-xs text-slate-500">points</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">Recent Activity</h3>
          <button className="text-primary text-sm font-medium hover:underline">View All</button>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activity.status === 'success' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                activity.status === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                <span className="material-symbols-outlined text-lg">
                  {activity.status === 'success' ? 'check_circle' :
                   activity.status === 'error' ? 'cancel' : 'info'}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="font-bold">{activity.user}</span>
                  {' '}{activity.action}
                </p>
              </div>
              <span className="text-xs text-slate-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
