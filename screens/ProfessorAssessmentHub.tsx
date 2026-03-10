import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question, Assessment, PlagiarismResult } from '../types';
import { useApp } from '../store/AppContext';

type TabType = 'assessments' | 'questions' | 'submissions' | 'analytics' | 'plagiarism' | 'live-monitor';

interface Props {
    assessments: Assessment[];
    questions: Question[];
    onCreateAssessment: () => void;
    onEditAssessment: (id: string) => void;
    onDeleteAssessment: (id: string) => void;
    onCreateQuestion: () => void;
    onEditQuestion: (id: string) => void;
    onDeleteQuestion: (id: string) => void;
    onToggleQuestionVisibility: (id: string, visible: boolean) => void;
}

const ProfessorAssessmentHub: React.FC<Props> = ({
    assessments,
    questions,
    onCreateAssessment,
    onEditAssessment,
    onDeleteAssessment,
    onCreateQuestion,
    onEditQuestion,
    onDeleteQuestion,
    onToggleQuestionVisibility,
}) => {
    const navigate = useNavigate();
    const { hasPermission, plagiarismResults } = useApp();
    const [activeTab, setActiveTab] = useState<TabType>('assessments');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [selectedAssessmentForMonitor, setSelectedAssessmentForMonitor] = useState<string | null>(null);

    const canCreateAssessments = hasPermission('canCreateAssessment');
    const canManageQuestions = hasPermission('canManageQuestionBank');

    const tabs = [
        { id: 'assessments' as const, label: 'My Assessments', icon: 'assignment', count: assessments.length },
        { id: 'questions' as const, label: 'Question Bank', icon: 'quiz', count: questions.length },
        { id: 'submissions' as const, label: 'Submissions', icon: 'history', count: null },
        { id: 'analytics' as const, label: 'Analytics', icon: 'analytics', count: null },
        { id: 'plagiarism' as const, label: 'Plagiarism', icon: 'warning', count: plagiarismResults?.filter(p => p.status === 'pending').length || 0 },
        { id: 'live-monitor' as const, label: 'Live Monitor', icon: 'cast_for_education', count: null },
    ];

    // Filter assessments
    const filteredAssessments = assessments.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Filter questions
    const filteredQuestions = questions.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.topic.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
        return matchesSearch && matchesDifficulty;
    });

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            published: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            draft: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
            completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${styles[status] || styles.draft}`}>{status}</span>;
    };

    const getDifficultyBadge = (diff: string) => {
        const styles: Record<string, string> = {
            beginner: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            easy: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            intermediate: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            hard: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        };
        return <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${styles[diff] || styles.medium}`}>{diff}</span>;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleSelectQuestion = (id: string) => {
        setSelectedQuestions(prev =>
            prev.includes(id) ? prev.filter(q => q !== id) : [...prev, id]
        );
    };

    const handleSelectAllQuestions = () => {
        if (selectedQuestions.length === filteredQuestions.length) {
            setSelectedQuestions([]);
        } else {
            setSelectedQuestions(filteredQuestions.map(q => q.id));
        }
    };

    const handleDeleteAssessment = (id: string) => {
        if (deleteConfirm === id) {
            onDeleteAssessment(id);
            setDeleteConfirm(null);
        } else {
            setDeleteConfirm(id);
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    };

    const handleDeleteQuestion = (id: string) => {
        if (deleteConfirm === id) {
            onDeleteQuestion(id);
            setDeleteConfirm(null);
        } else {
            setDeleteConfirm(id);
            setTimeout(() => setDeleteConfirm(null), 3000);
        }
    };

    // Mock live monitor data
    const liveStudents = [
        { id: '1', name: 'Sarah Jenkins', initials: 'SJ', problem: 'P3: Binary Trees', time: '45m 12s', status: 'active', progress: 75 },
        { id: '2', name: 'David Kim', initials: 'DK', problem: 'P2: LinkedLists', time: '22m 18s', status: 'warning', progress: 40 },
        { id: '3', name: 'Maria Garcia', initials: 'MG', problem: 'P4: Hash Tables', time: '31m 45s', status: 'active', progress: 60 },
        { id: '4', name: 'James Wilson', initials: 'JW', problem: 'P1: Arrays', time: '52m 30s', status: 'completed', progress: 100 },
    ];

    const liveSubmissions = [
        { student: 'Arjun S.', action: 'passed Problem 1', time: 'Just now', type: 'success' },
        { student: 'Lisa M.', action: 'failed compilation P2', time: '2 mins ago', type: 'error' },
        { student: 'John D.', action: 'submitted Problem 3', time: '5 mins ago', type: 'info' },
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Assessment Management</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Create, manage assessments and track student progress
                    </p>
                </div>
                <div className="flex gap-3">
                    {activeTab === 'questions' && canManageQuestions && (
                        <button
                            onClick={onCreateQuestion}
                            className="px-4 py-2 border border-primary text-primary hover:bg-primary/5 rounded-lg font-bold flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Add Question
                        </button>
                    )}
                    {activeTab === 'assessments' && canCreateAssessments && (
                        <button
                            onClick={onCreateAssessment}
                            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Create Assessment
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-1.5">
                <div className="flex gap-1 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            {tab.label}
                            {tab.count !== null && tab.count > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-white/20' : tab.id === 'plagiarism' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search & Filters */}
            {(activeTab === 'assessments' || activeTab === 'questions') && (
                <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <span className="material-symbols-outlined">search</span>
                            </span>
                            <input
                                type="text"
                                placeholder={`Search ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                            />
                        </div>
                        {activeTab === 'assessments' && (
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                            </select>
                        )}
                        {activeTab === 'questions' && (
                            <select
                                value={filterDifficulty}
                                onChange={(e) => setFilterDifficulty(e.target.value)}
                                className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                            >
                                <option value="all">All Difficulty</option>
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        )}
                    </div>
                </div>
            )}

            {/* Tab Content: Assessments */}
            {activeTab === 'assessments' && (
                <div className="space-y-4">
                    {filteredAssessments.length === 0 ? (
                        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">assignment</span>
                            <h3 className="text-xl font-bold mb-2">No assessments yet</h3>
                            <p className="text-slate-500 mb-4">Create your first assessment to get started</p>
                            {canCreateAssessments && (
                                <button
                                    onClick={onCreateAssessment}
                                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold"
                                >
                                    Create Assessment
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {filteredAssessments.map(assessment => (
                                <div
                                    key={assessment.id}
                                    className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-bold">{assessment.title}</h3>
                                                {getStatusBadge(assessment.status)}
                                                {getDifficultyBadge(assessment.difficulty)}
                                            </div>
                                            <p className="text-slate-500 text-sm mb-3">{assessment.description}</p>
                                            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-base">schedule</span>
                                                    {assessment.duration} mins
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-base">help</span>
                                                    {assessment.questions.length} questions
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-base">star</span>
                                                    {assessment.totalPoints} points
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-base">calendar_today</span>
                                                    {formatDate(assessment.startDate)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedAssessmentForMonitor(assessment.id);
                                                    setActiveTab('live-monitor');
                                                }}
                                                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                                                title="Live Monitor"
                                            >
                                                <span className="material-symbols-outlined text-lg">cast_for_education</span>
                                            </button>
                                            <button
                                                onClick={() => onEditAssessment(assessment.id)}
                                                className="px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-2"
                                                title="Edit"
                                            >
                                                <span className="material-symbols-outlined text-lg">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAssessment(assessment.id)}
                                                className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-all ${deleteConfirm === assessment.id
                                                        ? 'bg-red-500 text-white'
                                                        : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                    }`}
                                                title={deleteConfirm === assessment.id ? 'Click again to confirm' : 'Delete'}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {deleteConfirm === assessment.id ? 'check' : 'delete'}
                                                </span>
                                                {deleteConfirm === assessment.id && <span className="text-sm">Confirm?</span>}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tab Content: Questions */}
            {activeTab === 'questions' && (
                <div className="space-y-4">
                    {selectedQuestions.length > 0 && (
                        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
                            <span className="font-medium">{selectedQuestions.length} questions selected</span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium">
                                    Add to Assessment
                                </button>
                                <button
                                    onClick={() => {
                                        selectedQuestions.forEach(id => onDeleteQuestion(id));
                                        setSelectedQuestions([]);
                                    }}
                                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium"
                                >
                                    Delete Selected
                                </button>
                            </div>
                        </div>
                    )}

                    {filteredQuestions.length === 0 ? (
                        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">quiz</span>
                            <h3 className="text-xl font-bold mb-2">No questions in your bank</h3>
                            <p className="text-slate-500 mb-4">Add questions to build your assessment library</p>
                            {canManageQuestions && (
                                <button
                                    onClick={onCreateQuestion}
                                    className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold"
                                >
                                    Add Question
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <th className="p-4 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                                                onChange={handleSelectAllQuestions}
                                                className="w-4 h-4 rounded border-slate-300"
                                            />
                                        </th>
                                        <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Question</th>
                                        <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Topic</th>
                                        <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Difficulty</th>
                                        <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Points</th>
                                        <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Visibility</th>
                                        <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredQuestions.map(question => (
                                        <tr key={question.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="p-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedQuestions.includes(question.id)}
                                                    onChange={() => handleSelectQuestion(question.id)}
                                                    className="w-4 h-4 rounded border-slate-300"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <p className="font-bold">{question.title}</p>
                                                <p className="text-sm text-slate-500 truncate max-w-xs">{question.description}</p>
                                            </td>
                                            <td className="p-4 text-sm">{question.topic}</td>
                                            <td className="p-4">{getDifficultyBadge(question.difficulty)}</td>
                                            <td className="p-4 font-bold">{question.points}</td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => onToggleQuestionVisibility(question.id, !question.isVisible)}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm ${question.isVisible
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {question.isVisible ? 'visibility' : 'visibility_off'}
                                                    </span>
                                                    {question.isVisible ? 'Visible' : 'Hidden'}
                                                </button>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => onEditQuestion(question.id)}
                                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                                                        title="Edit"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteQuestion(question.id)}
                                                        className={`p-2 rounded-lg ${deleteConfirm === question.id
                                                                ? 'bg-red-500 text-white'
                                                                : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500'
                                                            }`}
                                                        title={deleteConfirm === question.id ? 'Click again to confirm' : 'Delete'}
                                                    >
                                                        <span className="material-symbols-outlined text-lg">
                                                            {deleteConfirm === question.id ? 'check' : 'delete'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Tab Content: Submissions */}
            {activeTab === 'submissions' && (
                <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                    <div className="text-center py-8">
                        <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">history</span>
                        <h3 className="text-xl font-bold mb-2">Student Submissions</h3>
                        <p className="text-slate-500">View and grade submissions from your students</p>
                        <button
                            onClick={() => navigate('/professor/assessments')}
                            className="mt-4 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold"
                        >
                            View All Submissions
                        </button>
                    </div>
                </div>
            )}

            {/* Tab Content: Analytics */}
            {activeTab === 'analytics' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Students', value: '156', icon: 'groups', color: 'bg-teal-500/10 text-teal-500' },
                            { label: 'Avg. Score', value: '78%', icon: 'trending_up', color: 'bg-green-500/10 text-green-500' },
                            { label: 'Submissions', value: '1,247', icon: 'assignment_turned_in', color: 'bg-blue-500/10 text-blue-500' },
                            { label: 'Pass Rate', value: '85%', icon: 'check_circle', color: 'bg-purple-500/10 text-purple-500' },
                        ].map(stat => (
                            <div key={stat.label} className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">{stat.label}</p>
                                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.color}`}>
                                        <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => navigate('/professor/analytics')}
                        className="w-full py-4 bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">analytics</span>
                        View Detailed Analytics
                    </button>
                </div>
            )}

            {/* Tab Content: Plagiarism */}
            {activeTab === 'plagiarism' && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold">Plagiarism Detection</h3>
                                <p className="text-slate-500 text-sm mt-1">Review flagged submissions with high similarity</p>
                            </div>
                            <div className="flex gap-2">
                                <span className="px-3 py-1.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">warning</span>
                                    {plagiarismResults?.filter(p => p.status === 'pending').length || 0} Pending Review
                                </span>
                            </div>
                        </div>

                        {(!plagiarismResults || plagiarismResults.length === 0) ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-5xl text-green-400 mb-4">verified</span>
                                <h3 className="text-xl font-bold mb-2">All Clear!</h3>
                                <p className="text-slate-500">No plagiarism cases detected</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {plagiarismResults.map(result => (
                                    <div
                                        key={result.id}
                                        className={`p-4 rounded-xl border ${result.status === 'pending'
                                                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                                                : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${result.similarityScore >= 80 ? 'bg-red-500 text-white' :
                                                        result.similarityScore >= 50 ? 'bg-yellow-500 text-white' :
                                                            'bg-green-500 text-white'
                                                    }`}>
                                                    {result.similarityScore}%
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg">{result.studentName} — {result.matchedSubmissions?.length || 0} match(es)</h4>
                                                    <p className="text-sm text-slate-500">Submission: {result.submissionId?.slice(0, 8)}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${result.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                                result.status === 'confirmed' ? 'bg-red-100 text-red-700' :
                                                                    'bg-green-100 text-green-700'
                                                            }`}>
                                                            {result.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg font-medium">
                                                    View Details
                                                </button>
                                                {result.status === 'pending' && (
                                                    <>
                                                        <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium">
                                                            Clear
                                                        </button>
                                                        <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium">
                                                            Confirm
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab Content: Live Monitor */}
            {activeTab === 'live-monitor' && (
                <div className="space-y-4">
                    {/* Assessment Selector */}
                    <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-primary">cast_for_education</span>
                            <select
                                value={selectedAssessmentForMonitor || ''}
                                onChange={(e) => setSelectedAssessmentForMonitor(e.target.value)}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                            >
                                <option value="">Select an assessment to monitor</option>
                                {assessments.filter(a => a.status === 'active').map(a => (
                                    <option key={a.id} value={a.id}>{a.title}</option>
                                ))}
                            </select>
                            {selectedAssessmentForMonitor && (
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    <span className="text-sm font-medium text-red-500">LIVE</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {!selectedAssessmentForMonitor ? (
                        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">cast_for_education</span>
                            <h3 className="text-xl font-bold mb-2">Select an Assessment</h3>
                            <p className="text-slate-500">Choose an active assessment to start monitoring students in real-time</p>
                        </div>
                    ) : (
                        <>
                            {/* Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-slate-500">Active Students</p>
                                            <p className="text-3xl font-bold mt-1">42<span className="text-lg text-slate-400 font-normal">/50</span></p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-green-500/10">
                                            <span className="material-symbols-outlined text-2xl text-green-500">groups</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '84%' }}></div>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-slate-500">Avg. Progress</p>
                                            <p className="text-3xl font-bold mt-1">65%</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-teal-500/10">
                                            <span className="material-symbols-outlined text-2xl text-teal-500">trending_up</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mt-3">
                                        <div className="bg-teal-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                                    </div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm text-red-500">Critical Alerts</p>
                                            <p className="text-3xl font-bold mt-1 text-red-600">2</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-red-500/20">
                                            <span className="material-symbols-outlined text-2xl text-red-500">warning</span>
                                        </div>
                                    </div>
                                    <button className="mt-3 text-sm font-bold text-red-600 hover:text-red-700">
                                        Review Now →
                                    </button>
                                </div>
                            </div>

                            {/* Student Progress Table */}
                            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="font-bold">Student Progress Monitor</h3>
                                    <div className="flex gap-2">
                                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                            <span className="material-symbols-outlined">filter_list</span>
                                        </button>
                                        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                            <span className="material-symbols-outlined">refresh</span>
                                        </button>
                                    </div>
                                </div>
                                <table className="w-full">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Student</th>
                                            <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Current Problem</th>
                                            <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Time Spent</th>
                                            <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Progress</th>
                                            <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                                            <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {liveStudents.map(student => (
                                            <tr key={student.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${student.status === 'warning' ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                                                }`}>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${student.status === 'warning' ? 'bg-red-100 text-red-600' :
                                                                student.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                                    'bg-teal-100 text-teal-600'
                                                            }`}>
                                                            {student.initials}
                                                        </div>
                                                        <span className="font-medium">{student.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{student.problem}</td>
                                                <td className="p-4 text-sm font-mono">{student.time}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-24 bg-slate-200 dark:bg-slate-700 h-2 rounded-full">
                                                            <div
                                                                className={`h-2 rounded-full ${student.status === 'completed' ? 'bg-green-500' : 'bg-teal-500'
                                                                    }`}
                                                                style={{ width: `${student.progress}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-sm font-medium">{student.progress}%</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${student.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            student.status === 'warning' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${student.status === 'active' ? 'bg-green-500 animate-pulse' :
                                                                student.status === 'warning' ? 'bg-red-500' :
                                                                    'bg-blue-500'
                                                            }`}></span>
                                                        {student.status === 'warning' ? 'Flagged' : student.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-primary">
                                                        <span className="material-symbols-outlined">visibility</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Live Feed */}
                            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="font-bold flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                        </span>
                                        Live Submissions
                                    </h3>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Real-time</span>
                                </div>
                                <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
                                    {liveSubmissions.map((sub, i) => (
                                        <div key={i} className={`flex gap-3 items-start p-3 rounded-lg border ${sub.type === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
                                                sub.type === 'error' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800' :
                                                    'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                            }`}>
                                            <span className={`material-symbols-outlined text-lg ${sub.type === 'success' ? 'text-green-500' :
                                                    sub.type === 'error' ? 'text-red-500' :
                                                        'text-blue-500'
                                                }`}>
                                                {sub.type === 'success' ? 'check_circle' : sub.type === 'error' ? 'cancel' : 'info'}
                                            </span>
                                            <div>
                                                <p className="text-sm"><span className="font-bold">{sub.student}</span> {sub.action}</p>
                                                <span className="text-xs text-slate-500">{sub.time}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProfessorAssessmentHub;
