import React, { useState } from 'react';
import { View, Assessment } from '../types';

interface Props {
  assessments: Assessment[];
  onNavigate: (view: View, assessmentId?: string) => void;
  onStartAssessment: (id: string) => void;
  userRole: 'student' | 'professor';
}

const AllAssessments: React.FC<Props> = ({ assessments, onNavigate, onStartAssessment, userRole }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'difficulty'>('date');

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || a.type === filterType;
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    // Students should not see draft assessments
    const canSeeStatus = userRole === 'student' ? a.status !== 'draft' : true;
    return matchesSearch && matchesType && matchesStatus && canSeeStatus;
  }).sort((a, b) => {
    if (sortBy === 'date') return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    if (sortBy === 'name') return a.title.localeCompare(b.title);
    return 0;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-bold">Active</span>;
      case 'published':
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full text-xs font-bold">Upcoming</span>;
      case 'draft':
        return <span className="px-2.5 py-1 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 rounded-full text-xs font-bold">Draft</span>;
      case 'completed':
        return <span className="px-2.5 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-full text-xs font-bold">Completed</span>;
      default:
        return null;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-500';
      case 'intermediate': return 'text-yellow-500';
      case 'advanced': return 'text-red-500';
      default: return 'text-slate-500';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">All Assessments</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {filteredAssessments.length} assessments available
          </p>
        </div>
        {userRole === 'professor' && (
          <button
            onClick={() => onNavigate('create-assessment')}
            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Create Assessment
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <span className="material-symbols-outlined">search</span>
            </span>
            <input
              type="text"
              placeholder="Search assessments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
            >
              <option value="all">All Types</option>
              <option value="quiz">Quiz</option>
              <option value="exam">Exam</option>
              <option value="assignment">Assignment</option>
              <option value="practice">Practice</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="published">Upcoming</option>
              {userRole === 'professor' && <option value="draft">Draft</option>}
              <option value="completed">Completed</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="difficulty">Sort by Difficulty</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssessments.map(assessment => (
          <div
            key={assessment.id}
            className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-all group"
          >
            {/* Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-start mb-3">
                {getStatusBadge(assessment.status)}
                <span className={`text-xs font-bold capitalize ${getDifficultyColor(assessment.difficulty)}`}>
                  {assessment.difficulty}
                </span>
              </div>
              <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors">
                {assessment.title}
              </h3>
              <p className="text-sm text-slate-500 line-clamp-2">
                {assessment.description}
              </p>
            </div>

            {/* Meta */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-slate-400 text-lg">schedule</span>
                  <span>{assessment.duration > 0 ? `${assessment.duration} mins` : 'Unlimited'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-slate-400 text-lg">quiz</span>
                  <span>{assessment.questions.length} questions</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-slate-400 text-lg">event</span>
                  <span>{formatDate(assessment.startDate)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="material-symbols-outlined text-slate-400 text-lg">stars</span>
                  <span>{assessment.totalPoints} pts</span>
                </div>
              </div>

              {assessment.courseCode && (
                <div className="text-xs text-slate-500 mb-4">
                  {assessment.courseCode} • {assessment.professorName}
                </div>
              )}

              {/* Actions */}
              {userRole === 'student' ? (
                <button
                  onClick={() => {
                    onStartAssessment(assessment.id);
                    onNavigate('instructions', assessment.id);
                  }}
                  disabled={assessment.status === 'draft' || assessment.status === 'completed'}
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {assessment.status === 'completed' ? (
                    <>
                      <span className="material-symbols-outlined text-lg">visibility</span>
                      View Results
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">play_arrow</span>
                      Start Assessment
                    </>
                  )}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button className="flex-1 py-2 border border-slate-300 dark:border-slate-600 rounded-lg font-medium hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-lg">edit</span>
                    Edit
                  </button>
                  <button
                    onClick={() => onNavigate('live-monitor')}
                    className="flex-1 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-lg">monitoring</span>
                    Monitor
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredAssessments.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-4xl text-slate-300">assignment</span>
          </div>
          <h3 className="font-bold text-lg mb-1">No assessments found</h3>
          <p className="text-slate-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default AllAssessments;
