import React, { useState, useEffect } from 'react';
import { Question, Assessment, AssessmentSettings } from '../types';

interface Props {
  onBack: () => void;
  onSave: (assessment: Omit<Assessment, 'id' | 'createdAt'>) => void;
  questions: Question[];
  editingAssessment?: Assessment | null;
  onUpdate?: (id: string, updates: Partial<Assessment>) => void;
}

const CreateAssessment: React.FC<Props> = ({ onBack, onSave, questions, editingAssessment, onUpdate }) => {
  const isEditing = !!editingAssessment;
  const [step, setStep] = useState(1);
  
  // Step 1: Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'quiz' | 'exam' | 'assignment' | 'practice'>('quiz');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [duration, setDuration] = useState(60);
  const [passingScore, setPassingScore] = useState(70);
  
  // Step 2: Questions
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  
  // Step 3: Settings
  const [settings, setSettings] = useState<AssessmentSettings>({
    randomizeQuestions: false,
    showCorrectAnswers: true,
    showScoreImmediately: true,
    allowRetakes: true,
    maxAttempts: 3,
    ipRestriction: false,
    allowedIPs: [],
    plagiarismSensitivity: 'medium',
    proctoring: false,
  });
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  // Populate form when editing
  useEffect(() => {
    if (editingAssessment) {
      setTitle(editingAssessment.title);
      setDescription(editingAssessment.description);
      setType(editingAssessment.type);
      setDifficulty(editingAssessment.difficulty);
      setDuration(editingAssessment.duration);
      setPassingScore(editingAssessment.passingScore);
      setSelectedQuestions(editingAssessment.questions.map(q => q.id));
      setSettings(editingAssessment.settings);
      
      // Parse dates
      if (editingAssessment.startDate) {
        const start = new Date(editingAssessment.startDate);
        setStartDate(start.toISOString().split('T')[0]);
        setStartTime(start.toTimeString().slice(0, 5));
      }
      if (editingAssessment.endDate) {
        const end = new Date(editingAssessment.endDate);
        setEndDate(end.toISOString().split('T')[0]);
        setEndTime(end.toTimeString().slice(0, 5));
      }
      
      setStatus(editingAssessment.status === 'draft' ? 'draft' : 'published');
    }
  }, [editingAssessment]);

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = filterDifficulty === 'all' || q.difficulty === filterDifficulty;
    return matchesSearch && matchesDifficulty && q.isVisible;
  });

  const selectedQuestionObjects = questions.filter(q => selectedQuestions.includes(q.id));
  const totalPoints = selectedQuestionObjects.reduce((sum, q) => sum + q.points, 0);

  const handleToggleQuestion = (id: string) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    const assessmentData: Omit<Assessment, 'id' | 'createdAt'> = {
      title,
      description,
      type,
      difficulty,
      duration,
      passingScore,
      totalPoints,
      questions: selectedQuestionObjects,
      startDate: `${startDate}T${startTime}:00Z`,
      endDate: `${endDate}T${endTime}:00Z`,
      status,
      settings,
      createdBy: editingAssessment?.createdBy || 'current-user',
      courseCode: editingAssessment?.courseCode,
      courseName: editingAssessment?.courseName,
      professorName: editingAssessment?.professorName,
    };
    
    if (isEditing && editingAssessment && onUpdate) {
      onUpdate(editingAssessment.id, assessmentData);
    } else {
      onSave(assessmentData);
    onBack();
    }
  };

  const canProceed = () => {
    if (step === 1) return title && description;
    if (step === 2) return selectedQuestions.length > 0;
    if (step === 3) return startDate && startTime && endDate && endTime;
    return false;
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'hard': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-background-card border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold">{isEditing ? 'Edit Assessment' : 'Create Assessment'}</h1>
              <p className="text-sm text-slate-500">Step {step} of 3</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            {step === 3 && (
              <button
                onClick={handleSave}
                disabled={!canProceed()}
                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-sm disabled:opacity-50"
              >
                {status === 'draft' ? 'Save as Draft' : 'Publish Assessment'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white dark:bg-background-card border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Assessment Details', icon: 'description' },
              { num: 2, label: 'Add Questions', icon: 'quiz' },
              { num: 3, label: 'Settings & Publish', icon: 'settings' },
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => s.num < step && setStep(s.num)}
                  className={`flex items-center gap-3 ${s.num <= step ? 'text-primary' : 'text-slate-400'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    s.num < step ? 'bg-primary text-white' :
                    s.num === step ? 'bg-primary/10 text-primary border-2 border-primary' :
                    'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {s.num < step ? (
                      <span className="material-symbols-outlined">check</span>
                    ) : (
                      <span className="material-symbols-outlined">{s.icon}</span>
                    )}
                  </div>
                  <span className="hidden md:block font-medium">{s.label}</span>
                </button>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 mx-4 ${s.num < step ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-6">
        {/* Step 1: Details */}
        {step === 1 && (
          <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-1">Assessment Details</h2>
              <p className="text-slate-500">Provide basic information about your assessment</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Assessment Name *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Data Structures Midterm"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this assessment covers..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="quiz">Quiz</option>
                  <option value="exam">Exam</option>
                  <option value="assignment">Assignment</option>
                  <option value="practice">Practice</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Passing Score (%)</label>
                <input
                  type="number"
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceed()}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                Next: Add Questions
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Questions */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Select Questions</h2>
                  <p className="text-slate-500">Choose questions from your question bank</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Selected</p>
                  <p className="text-2xl font-bold text-primary">{selectedQuestions.length}</p>
                  <p className="text-xs text-slate-500">{totalPoints} total points</p>
                </div>
              </div>

              {/* Search & Filter */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <span className="material-symbols-outlined">search</span>
                  </span>
                  <input
                    type="text"
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
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
              </div>

              {/* Questions List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredQuestions.map(question => (
                  <div
                    key={question.id}
                    onClick={() => handleToggleQuestion(question.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedQuestions.includes(question.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        selectedQuestions.includes(question.id)
                          ? 'bg-primary border-primary text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}>
                        {selectedQuestions.includes(question.id) && (
                          <span className="material-symbols-outlined text-sm">check</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold">{question.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                          <span>{question.topic}</span>
                          <span>{question.points} pts</span>
                          <span>{question.testCases.length} test cases</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Summary */}
            {selectedQuestions.length > 0 && (
              <div className="bg-primary/5 dark:bg-primary/10 rounded-xl border border-primary/20 p-4">
                <h4 className="font-bold mb-3">Selected Questions ({selectedQuestions.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedQuestionObjects.map(q => (
                    <span key={q.id} className="px-3 py-1.5 bg-white dark:bg-background-card rounded-lg text-sm flex items-center gap-2 shadow-sm">
                      {q.title}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleQuestion(q.id); }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceed()}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                Next: Settings
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Settings */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Schedule */}
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">event</span>
                Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">End Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">End Time *</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                Options
              </h3>
              <div className="space-y-4">
                {[
                  { key: 'randomizeQuestions', label: 'Randomize question order', desc: 'Questions will appear in random order for each student' },
                  { key: 'showCorrectAnswers', label: 'Show correct answers after submission', desc: 'Students can view correct solutions after submitting' },
                  { key: 'showScoreImmediately', label: 'Show score immediately', desc: 'Display score right after submission' },
                  { key: 'allowRetakes', label: 'Allow re-attempts', desc: 'Students can retake the assessment' },
                  { key: 'proctoring', label: 'Enable proctoring', desc: 'Monitor students during the assessment' },
                ].map(option => (
                  <label key={option.key} className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(settings as any)[option.key]}
                      onChange={(e) => setSettings({ ...settings, [option.key]: e.target.checked })}
                      className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary mt-0.5"
                    />
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-slate-500">{option.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              {settings.allowRetakes && (
                <div className="mt-4 ml-9">
                  <label className="block text-sm font-medium mb-2">Maximum Attempts</label>
                  <input
                    type="number"
                    value={settings.maxAttempts}
                    onChange={(e) => setSettings({ ...settings, maxAttempts: Number(e.target.value) })}
                    min={1}
                    className="w-32 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              )}
            </div>

            {/* Security */}
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">security</span>
                Security
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Plagiarism Detection Sensitivity</label>
                  <select
                    value={settings.plagiarismSensitivity}
                    onChange={(e) => setSettings({ ...settings, plagiarismSensitivity: e.target.value as any })}
                    className="w-full md:w-64 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Publish Status */}
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h3 className="text-lg font-bold mb-4">Publish Status</h3>
              <div className="flex gap-4">
                <label className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  status === 'draft' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="status"
                    value="draft"
                    checked={status === 'draft'}
                    onChange={() => setStatus('draft')}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl">draft</span>
                    <div>
                      <p className="font-bold">Save as Draft</p>
                      <p className="text-sm text-slate-500">Edit before publishing</p>
                    </div>
                  </div>
                </label>
                <label className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  status === 'published' ? 'border-primary bg-primary/5' : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="status"
                    value="published"
                    checked={status === 'published'}
                    onChange={() => setStatus('published')}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-green-500">publish</span>
                    <div>
                      <p className="font-bold">Publish Now</p>
                      <p className="text-sm text-slate-500">Make visible to students</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={!canProceed()}
                className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">check</span>
                {status === 'draft' ? 'Save Draft' : 'Publish Assessment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateAssessment;
