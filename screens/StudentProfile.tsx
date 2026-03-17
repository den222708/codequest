import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';

const StudentProfile: React.FC = () => {
  const { currentUser, submissions, assessments, updateUser } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'activity' | 'settings'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
  });
  const [stats, setStats] = useState({
    assessmentsCompleted: 0,
    problemsSolved: 0,
    averageScore: 0,
    streak: 0,
  });

  // Initialize form data when user changes
  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        department: currentUser.department || '',
      });
    }
  }, [currentUser]);

  // Calculate stats from submissions
  useEffect(() => {
    if (submissions && submissions.length > 0) {
      const completed = submissions.filter(s => s.status === 'passed').length;
      const totalScore = submissions.reduce((sum, s) => sum + s.score, 0);
      const maxScore = submissions.reduce((sum, s) => sum + s.maxScore, 0);

      const completedAssessmentIds = new Set(
        submissions.filter(s => s.status === 'passed').map(s => s.assessmentId)
      );
      setStats({
        assessmentsCompleted: completedAssessmentIds.size,
        problemsSolved: completed,
        averageScore: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
        streak: 0,
      });
    }
  }, [submissions, assessments]);

  const skills = [
    { name: 'Algorithms', level: 85, color: 'teal' },
    { name: 'Data Structures', level: 78, color: 'blue' },
    { name: 'Web Development', level: 72, color: 'purple' },
    { name: 'Databases', level: 68, color: 'amber' },
    { name: 'DevOps', level: 55, color: 'pink' },
  ];

  const languages = [
    { name: 'Python', proficiency: 90, problems: 45, color: '#3776ab' },
    { name: 'JavaScript', proficiency: 85, problems: 38, color: '#f7df1e' },
    { name: 'Java', proficiency: 75, problems: 28, color: '#ed8b00' },
    { name: 'C++', proficiency: 70, problems: 22, color: '#00599c' },
  ];

  const achievements = [
    { id: 1, title: 'First Steps', description: 'Complete your first assessment', icon: 'emoji_events', earned: true, date: '2024-01-15' },
    { id: 2, title: 'Perfect Score', description: 'Score 100% on an assessment', icon: 'stars', earned: true, date: '2024-02-20' },
    { id: 3, title: 'Week Warrior', description: 'Solve 7 problems in a week', icon: 'local_fire_department', earned: true, date: '2024-03-10' },
    { id: 4, title: 'Speed Demon', description: 'Solve a problem in under 5 minutes', icon: 'bolt', earned: true, date: '2024-03-25' },
    { id: 5, title: 'Centurion', description: 'Solve 100 problems', icon: 'military_tech', earned: false, date: null },
    { id: 6, title: 'Master Coder', description: 'Achieve 90%+ average score', icon: 'workspace_premium', earned: false, date: null },
  ];

  const recentActivity = [
    { type: 'submission', title: 'Solved "Two Sum"', description: 'Python • Accepted', time: '2 hours ago', icon: 'check_circle', color: 'emerald' },
    { type: 'assessment', title: 'Completed Data Structures Quiz', description: 'Score: 95/100', time: '1 day ago', icon: 'assignment_turned_in', color: 'blue' },
    { type: 'achievement', title: 'Earned "Speed Demon" badge', description: 'Solved problem in 4:32', time: '2 days ago', icon: 'emoji_events', color: 'amber' },
    { type: 'submission', title: 'Solved "Reverse Linked List"', description: 'Java • Accepted', time: '3 days ago', icon: 'check_circle', color: 'emerald' },
  ];

  const handleShare = () => {
    setShowShareModal(true);
    if (navigator.share) {
      navigator.share({
        title: `${currentUser?.name}'s CodeQuest Profile`,
        text: `Check out my coding progress on CodeQuest!`,
        url: window.location.href,
      }).catch(() => { });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-500 via-teal-600 to-teal-700 dark:from-teal-600 dark:via-teal-700 dark:to-teal-800">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative p-6 md:p-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* Avatar with animation */}
              <div className="relative group">
                <div className="absolute inset-0 bg-teal-400 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-teal-300 to-teal-600 border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden transform group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-4xl font-bold">
                    {currentUser?.name?.charAt(0) || 'A'}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 border-4 border-white dark:border-slate-800 rounded-full flex items-center justify-center shadow-lg">
                  <span className="material-symbols-outlined text-white text-sm">check</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-black text-white">{currentUser?.name || 'Arjun Sharma'}</h1>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">verified</span>
                    Verified
                  </span>
                </div>
                <p className="text-teal-100 flex items-center gap-2 text-lg">
                  <span className="material-symbols-outlined text-xl">school</span>
                  {currentUser?.department || 'Computer Science Department'}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold">
                    {currentUser?.enrollmentId || 'EN2024001'}
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">local_fire_department</span>
                    {stats.streak} day streak
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span className="material-symbols-outlined">edit</span>
                Edit Profile
              </button>
              <button
                onClick={handleShare}
                className="px-6 py-3 bg-white text-teal-600 hover:bg-teal-50 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <span className="material-symbols-outlined">share</span>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-10 max-w-7xl mx-auto -mt-8 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              label: 'Assessments',
              value: stats.assessmentsCompleted,
              icon: 'assignment_turned_in',
              color: 'blue',
              change: '+12%',
              trend: 'up'
            },
            {
              label: 'Problems Solved',
              value: stats.problemsSolved,
              icon: 'check_circle',
              color: 'emerald',
              change: '+8',
              trend: 'up'
            },
            {
              label: 'Average Score',
              value: `${stats.averageScore}%`,
              icon: 'trending_up',
              color: 'purple',
              change: '+5%',
              trend: 'up'
            },
            {
              label: 'Current Streak',
              value: `${stats.streak} days`,
              icon: 'local_fire_department',
              color: 'orange',
              change: 'Keep it up!',
              trend: 'neutral'
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all group hover:scale-105 cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${stat.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                    stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                      stat.color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
                        'bg-orange-500/10 text-orange-500'
                  }`}>
                  <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                </div>
                {stat.trend === 'up' && (
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    {stat.change}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden mb-8">
          <div className="border-b border-slate-200 dark:border-slate-700 flex overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: 'dashboard' },
              { id: 'achievements', label: 'Achievements', icon: 'emoji_events' },
              { id: 'activity', label: 'Activity', icon: 'history' },
              { id: 'settings', label: 'Settings', icon: 'settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'text-teal-600 dark:text-teal-400 border-b-2 border-teal-600 dark:border-teal-400 bg-teal-50 dark:bg-teal-900/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 md:p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Skills Progress */}
                <div>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-500">psychology</span>
                    Skill Mastery
                  </h3>
                  <div className="space-y-4">
                    {skills.map((skill, i) => (
                      <div key={i} className="group">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{skill.name}</span>
                          <span className="text-sm font-bold text-teal-600 dark:text-teal-400">{skill.level}%</span>
                        </div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-1000 ease-out group-hover:shadow-lg group-hover:shadow-teal-500/50`}
                            style={{ width: `${skill.level}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Language Proficiency */}
                <div>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-500">code</span>
                    Language Proficiency
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {languages.map((lang, i) => (
                      <div
                        key={i}
                        className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-all group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg"
                              style={{ backgroundColor: lang.color }}
                            >
                              {lang.name.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white">{lang.name}</h4>
                              <p className="text-xs text-slate-500">{lang.problems} problems solved</p>
                            </div>
                          </div>
                          <span className="text-lg font-black text-teal-600 dark:text-teal-400">{lang.proficiency}%</span>
                        </div>
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${lang.proficiency}%`, backgroundColor: lang.color }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skill Radar Chart */}
                <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-600">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-teal-500">radar</span>
                    Skill Radar
                  </h3>
                  <div className="flex items-center justify-center min-h-[300px]">
                    <div className="relative w-64 h-64">
                      <svg className="w-full h-full" viewBox="0 0 200 200">
                        {/* Grid circles */}
                        {[40, 60, 80, 100].map((r, i) => (
                          <circle
                            key={i}
                            cx="100"
                            cy="100"
                            r={r}
                            fill="none"
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            className="dark:stroke-slate-600"
                          />
                        ))}
                        {/* Grid lines */}
                        {[0, 72, 144, 216, 288].map((deg, i) => {
                          const x = 100 + 100 * Math.cos((deg * Math.PI) / 180);
                          const y = 100 + 100 * Math.sin((deg * Math.PI) / 180);
                          return (
                            <line
                              key={i}
                              x1="100"
                              y1="100"
                              x2={x}
                              y2={y}
                              stroke="#e2e8f0"
                              strokeWidth="1"
                              className="dark:stroke-slate-600"
                            />
                          );
                        })}
                        {/* Data polygon */}
                        <polygon
                          points="100,20 180,60 160,160 40,140 20,80"
                          fill="rgba(20, 184, 166, 0.2)"
                          stroke="#14b8a6"
                          strokeWidth="3"
                        />
                        {/* Data points */}
                        {[
                          { x: 100, y: 20 },
                          { x: 180, y: 60 },
                          { x: 160, y: 160 },
                          { x: 40, y: 140 },
                          { x: 20, y: 80 },
                        ].map((point, i) => (
                          <circle
                            key={i}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#14b8a6"
                            className="animate-pulse"
                          />
                        ))}
                      </svg>
                      {/* Labels */}
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        Algorithms
                      </span>
                      <span className="absolute top-1/4 -right-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        Web Dev
                      </span>
                      <span className="absolute bottom-0 right-1/4 text-xs font-bold text-slate-600 dark:text-slate-400">
                        Databases
                      </span>
                      <span className="absolute bottom-4 left-1/4 text-xs font-bold text-slate-600 dark:text-slate-400">
                        DevOps
                      </span>
                      <span className="absolute top-1/4 -left-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                        Data Structures
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submission Heatmap */}
                <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-700 dark:to-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-teal-500">calendar_today</span>
                        Submission Activity
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">365 submissions in the last year</p>
                    </div>
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-2">
                    {Array.from({ length: 52 }).map((_, col) => (
                      <div key={col} className="grid grid-rows-7 gap-1">
                        {Array.from({ length: 7 }).map((_, row) => {
                          const intensity = Math.random();
                          const opacity =
                            intensity > 0.7
                              ? 'bg-teal-500'
                              : intensity > 0.4
                                ? 'bg-teal-400'
                                : intensity > 0.2
                                  ? 'bg-teal-300'
                                  : 'bg-slate-200 dark:bg-slate-700';
                          return (
                            <div
                              key={row}
                              className={`w-3 h-3 rounded-sm ${opacity} hover:ring-2 hover:ring-teal-500 transition-all cursor-pointer`}
                              title={`${col + 1} weeks ago, ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][row]}`}
                            ></div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>Less</span>
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-sm bg-slate-200 dark:bg-slate-700"></div>
                      <div className="w-3 h-3 rounded-sm bg-teal-300"></div>
                      <div className="w-3 h-3 rounded-sm bg-teal-400"></div>
                      <div className="w-3 h-3 rounded-sm bg-teal-500"></div>
                    </div>
                    <span>More</span>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === 'achievements' && (
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-500">emoji_events</span>
                  Your Achievements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-6 rounded-xl border-2 transition-all ${achievement.earned
                          ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-700 hover:shadow-xl hover:scale-105'
                          : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 opacity-60'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`p-3 rounded-xl ${achievement.earned
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-300 dark:bg-slate-600 text-slate-500'
                            }`}
                        >
                          <span className="material-symbols-outlined text-2xl">{achievement.icon}</span>
                        </div>
                        {achievement.earned && (
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                            Earned
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{achievement.title}</h4>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{achievement.description}</p>
                      {achievement.earned && achievement.date && (
                        <p className="text-xs text-slate-500 dark:text-slate-500">
                          Earned on {new Date(achievement.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-500">history</span>
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {recentActivity.map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all group"
                    >
                      <div
                        className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${activity.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                            activity.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-amber-500/10 text-amber-500'
                          }`}
                      >
                        <span className="material-symbols-outlined text-2xl">{activity.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{activity.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{activity.description}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-teal-500">settings</span>
                  Profile Settings
                </h3>
                {saveSuccess && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-green-500">check_circle</span>
                    <span className="text-green-700 dark:text-green-400 font-medium">Changes saved successfully!</span>
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (currentUser) {
                        updateUser(currentUser.id, formData);
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 3000);
                      }
                    }}
                    className="w-full px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Edit Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  defaultValue={currentUser?.name || ''}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Bio</label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600"
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Share Profile</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setShowShareModal(false);
                }}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg font-semibold"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
