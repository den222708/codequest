import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Question, Assessment } from '../types';
import { useApp } from '../store/AppContext';
import { formatDateShort, getAssessmentStatusBadge, getDifficultyBadge as getDifficultyBadgeUtil } from '../utils/formatters';

type TabType = 'assessments' | 'questions' | 'submissions';

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
    const { hasPermission } = useApp();
    const [activeTab, setActiveTab] = useState<TabType>('assessments');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterDifficulty, setFilterDifficulty] = useState('all');
    const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const canCreateAssessments = hasPermission('canCreateAssessment');
    const canManageQuestions = hasPermission('canManageQuestionBank');

    const tabs = [
        { id: 'assessments' as const, label: 'My Assessments', icon: 'assignment', count: assessments.length },
        { id: 'questions' as const, label: 'Question Bank', icon: 'quiz', count: questions.length },
        { id: 'submissions' as const, label: 'Submissions', icon: 'history', count: null },
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
        const badge = getAssessmentStatusBadge(status as 'active' | 'published' | 'draft' | 'completed');
        return <span className={`px-2.5 py-1 ${badge.bg} rounded-full text-xs font-medium capitalize`}>{badge.label}</span>;
    };

    const getDifficultyBadge = (diff: string) => {
        const cls = getDifficultyBadgeUtil(diff);
        return <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${cls}`}>{diff}</span>;
    };

    const formatDate = formatDateShort;

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
                            className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center gap-2 shadow-sm"
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
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            {tab.label}
                            {tab.count !== null && tab.count > 0 && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
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
                                    className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all"
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

        </div>
    );
};

export default ProfessorAssessmentHub;
