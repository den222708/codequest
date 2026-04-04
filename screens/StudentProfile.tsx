import React, { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { api } from '../services/apiClient';
import { getInitials } from '../utils/formatters';

const StudentProfile: React.FC = () => {
  const { currentUser, submissions, assessments } = useApp();
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

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        email: currentUser.email || '',
        department: currentUser.department || '',
      });
    }
  }, [currentUser]);

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

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${currentUser?.name}'s CodeQuest Profile`,
        text: `Check out my coding progress on CodeQuest!`,
        url: window.location.href,
      }).catch(() => {
        // Fallback to copy modal if share was cancelled/failed
        setShowShareModal(true);
      });
    } else {
      setShowShareModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-primary-dark">
        <div className="relative p-6 md:p-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative group">
                <div className="relative w-28 h-28 rounded-full bg-white/15 border-4 border-white/30 shadow-sm overflow-hidden">
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-white text-4xl font-bold">
                    {getInitials(currentUser?.name)}
                  </div>
                </div>
                <div className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-500 border-4 border-white/30 rounded-full flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-white text-sm">check</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-white">{currentUser?.name || 'Student'}</h1>
                </div>
                <p className="text-white/70 flex items-center gap-2 text-lg">
                  <span className="material-symbols-outlined text-xl">school</span>
                  {currentUser?.department || 'Department'}
                </p>
                {currentUser?.enrollmentId && (
                  <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold">
                    {currentUser.enrollmentId}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(true)}
                className="px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined">edit</span>
                Edit Profile
              </button>
              <button
                onClick={handleShare}
                className="px-5 py-2.5 bg-white text-primary hover:bg-white/90 rounded-xl font-semibold transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined">share</span>
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-10 max-w-7xl mx-auto -mt-6 relative z-10 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Assessments', value: stats.assessmentsCompleted, icon: 'assignment_turned_in', color: 'blue' },
            { label: 'Problems Solved', value: stats.problemsSolved, icon: 'check_circle', color: 'emerald' },
            { label: 'Average Score', value: `${stats.averageScore}%`, icon: 'trending_up', color: 'purple' },
            { label: 'Current Streak', value: `${stats.streak} days`, icon: 'local_fire_department', color: 'orange' },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-background-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${
                  stat.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                  stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                  stat.color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
                  'bg-orange-500/10 text-orange-500'
                }`}>
                  <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Settings */}
        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">settings</span>
            Profile Settings
          </h3>
          {saveSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-green-500">check_circle</span>
              <span className="text-green-700 dark:text-green-400 font-medium">Changes saved successfully!</span>
            </div>
          )}
          <div className="space-y-4 max-w-lg">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent"
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
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              onClick={async () => {
                if (currentUser) {
                  await api.put(`/users/${currentUser.id}`, formData);
                  setSaveSuccess(true);
                  setTimeout(() => setSaveSuccess(false), 3000);
                }
              }}
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-semibold transition-all shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-title"
          onClick={() => setIsEditing(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setIsEditing(false); }}
        >
          <div className="bg-white dark:bg-background-card rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 id="edit-profile-title" className="text-2xl font-bold">Edit Profile</h3>
              <button
                onClick={() => setIsEditing(false)}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <span className="material-symbols-outlined" aria-hidden="true">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (currentUser) {
                      try {
                        await api.put(`/users/${currentUser.id}`, formData);
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 3000);
                      } catch {
                        // Show error inline - save failed
                      }
                    }
                    setIsEditing(false);
                  }}
                  className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowShareModal(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowShareModal(false); }}
        >
          <div className="bg-white dark:bg-background-card rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
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
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setShowShareModal(false);
                }}
                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-semibold"
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
