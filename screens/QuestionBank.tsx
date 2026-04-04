import React, { useState } from 'react';
import { View, Question } from '../types';
import { getDifficultyColor as getDifficultyColorUtil } from '../utils/formatters';

interface Props {
  questions: Question[];
  onNavigate: (view: View) => void;
  onDeleteQuestion: (id: string) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onEditQuestion?: (id: string) => void;
}

const QuestionBank: React.FC<Props> = ({ questions, onNavigate, onDeleteQuestion, onToggleVisibility, onEditQuestion }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterTopic, setFilterTopic] = useState<string>('all');
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const importInputRef = React.useRef<HTMLInputElement>(null);

  const topics = [...new Set(questions.map(q => q.topic))];
  
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    const matchesTopic = filterTopic === 'all' || q.topic === filterTopic;
    return matchesSearch && matchesDifficulty && matchesTopic;
  });

  const handleSelectAll = () => {
    if (selectedQuestions.length === filteredQuestions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(filteredQuestions.map(q => q.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const getDifficultyColor = (difficulty: string) => getDifficultyColorUtil(difficulty);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Question Bank</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {questions.length} questions • {questions.filter(q => q.isVisible).length} visible
          </p>
        </div>
        <div className="flex gap-3">
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              // Reset input so the same file can be re-selected
              e.target.value = '';
              // TODO: wire to an import handler prop when backend supports it
              console.warn('Question import not yet implemented. File selected:', file.name);
            }}
          />
          <button
            onClick={() => importInputRef.current?.click()}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 font-medium"
          >
            <span className="material-symbols-outlined text-lg">upload</span>
            Import
          </button>
          <button
            onClick={() => onNavigate('create-question')}
            className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold flex items-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Question
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <span className="material-symbols-outlined">search</span>
            </span>
            <input
              type="text"
              placeholder="Search questions by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
            >
              <option value="all">All Topics</option>
              {topics.map(topic => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>

            <div className="flex border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined text-lg">view_list</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-slate-50 dark:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined text-lg">grid_view</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedQuestions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {selectedQuestions.length} selected
            </span>
            <button
              onClick={() => { selectedQuestions.forEach(id => onToggleVisibility(id, true)); setSelectedQuestions([]); }}
              className="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">visibility</span>
              Make Visible
            </button>
            <button
              onClick={() => { selectedQuestions.forEach(id => onToggleVisibility(id, false)); setSelectedQuestions([]); }}
              className="text-sm font-medium text-primary hover:text-primary-dark flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">visibility_off</span>
              Hide
            </button>
            <button
              onClick={() => { selectedQuestions.forEach(id => onDeleteQuestion(id)); setSelectedQuestions([]); }}
              className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Questions List/Grid */}
      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.length === filteredQuestions.length && filteredQuestions.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-primary focus:ring-primary"
                  />
                </th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Question</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Difficulty</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Topic</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Points</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Usage</th>
                <th className="p-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredQuestions.map(question => (
                <tr key={question.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question.id)}
                      onChange={() => handleSelect(question.id)}
                      className="rounded border-slate-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">code</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{question.title}</p>
                        <div className="flex gap-1 mt-1">
                          {question.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getDifficultyColor(question.difficulty)}`}>
                      {question.difficulty}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{question.topic}</td>
                  <td className="p-4 font-bold">{question.points}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-400">{question.usageCount}×</td>
                  <td className="p-4">
                    <button
                      onClick={() => onToggleVisibility(question.id, !question.isVisible)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                        question.isVisible
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
                      <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-primary">
                        <span className="material-symbols-outlined text-lg">preview</span>
                      </button>
                      <button
                        onClick={() => onEditQuestion ? onEditQuestion(question.id) : onNavigate('edit-question')}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteModalId(question.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-slate-500 hover:text-red-500"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredQuestions.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-slate-400">search_off</span>
              </div>
              <h3 className="font-bold text-lg mb-1">No questions found</h3>
              <p className="text-slate-500">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuestions.map(question => (
            <div
              key={question.id}
              className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 hover:text-primary">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteModalId(question.id)}
                    className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-500 hover:text-red-500"
                  >
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-2">{question.title}</h3>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {question.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">stars</span>
                  {question.points} pts
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">folder</span>
                  {question.topic}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-lg">bar_chart</span>
                  {question.usageCount}×
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-card rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl text-red-500">warning</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">Delete Question?</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Are you sure you want to delete this question? It will be removed from all assessments using it.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModalId(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteQuestion(deleteModalId);
                  setDeleteModalId(null);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
