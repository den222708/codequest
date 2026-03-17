import React, { useState, useEffect } from 'react';
import { Question, TestCase, QuestionType, MCQOption } from '../types';

interface Props {
  onBack: () => void;
  onSave: (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  editingQuestion?: Question | null;
  onUpdate?: (id: string, updates: Partial<Question>) => void;
}

const CreateQuestion: React.FC<Props> = ({ onBack, onSave, editingQuestion, onUpdate }) => {
  const isEditing = !!editingQuestion;
  const [questionType, setQuestionType] = useState<QuestionType>('coding');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [topic, setTopic] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [points, setPoints] = useState(50);
  const [timeLimit, setTimeLimit] = useState(2);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [testCases, setTestCases] = useState<TestCase[]>([
    { id: 'tc-1', input: '', expectedOutput: '', isHidden: false, points: 25, timeLimit: 2000 },
    { id: 'tc-2', input: '', expectedOutput: '', isHidden: true, points: 25, timeLimit: 2000 },
  ]);
  const [boilerplate, setBoilerplate] = useState({
    python: `def solution():\n    # Write your code here\n    pass`,
    javascript: `function solution() {\n    // Write your code here\n}`,
    java: `class Solution {\n    public void solve() {\n        // Write your code here\n    }\n}`,
    cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    return 0;\n}`,
  });
  const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'java' | 'cpp'>('python');
  const [activeTab, setActiveTab] = useState<'details' | 'testcases' | 'code' | 'options' | 'answer'>('details');
  const [mcqOptions, setMcqOptions] = useState<MCQOption[]>([
    { id: 'opt-1', text: '', isCorrect: true },
    { id: 'opt-2', text: '', isCorrect: false },
  ]);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');

  // Populate form when editing
  useEffect(() => {
    if (editingQuestion) {
      setQuestionType(editingQuestion.questionType || 'coding');
      setTitle(editingQuestion.title);
      setDescription(editingQuestion.description);
      setDifficulty(editingQuestion.difficulty);
      setTopic(editingQuestion.topic);
      setTags(editingQuestion.tags);
      setPoints(editingQuestion.points);
      setTimeLimit(editingQuestion.timeLimit);
      setMemoryLimit(editingQuestion.memoryLimit);
      setTestCases(editingQuestion.testCases);
      if (editingQuestion.boilerplateCode) {
        setBoilerplate({
          python: editingQuestion.boilerplateCode.python || boilerplate.python,
          javascript: editingQuestion.boilerplateCode.javascript || boilerplate.javascript,
          java: editingQuestion.boilerplateCode.java || boilerplate.java,
          cpp: editingQuestion.boilerplateCode.cpp || boilerplate.cpp,
        });
      }
      if (editingQuestion.options) setMcqOptions(editingQuestion.options);
      if (editingQuestion.correctAnswer) setCorrectAnswer(editingQuestion.correctAnswer);
    }
  }, [editingQuestion]);

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput.toLowerCase())) {
      setTags([...tags, tagInput.toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleAddTestCase = () => {
    setTestCases([
      ...testCases,
      {
        id: `tc-${Date.now()}`,
        input: '',
        expectedOutput: '',
        isHidden: true,
        points: Math.floor(100 / (testCases.length + 1)),
        timeLimit: 2000,
      },
    ]);
  };

  const handleRemoveTestCase = (id: string) => {
    if (testCases.length > 1) {
      setTestCases(testCases.filter(tc => tc.id !== id));
    }
  };

  const handleUpdateTestCase = (id: string, field: keyof TestCase, value: any) => {
    setTestCases(testCases.map(tc => tc.id === id ? { ...tc, [field]: value } : tc));
  };

  const handleSave = () => {
    const questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> = {
      title,
      description,
      difficulty,
      questionType,
      topic,
      tags,
      points,
      timeLimit,
      memoryLimit,
      testCases: questionType === 'coding' ? testCases : [],
      boilerplateCode: questionType === 'coding' ? boilerplate : {},
      createdBy: editingQuestion?.createdBy || 'current-user',
      isVisible: editingQuestion?.isVisible ?? true,
      solution: editingQuestion?.solution,
      hints: editingQuestion?.hints,
      options: questionType === 'mcq' ? mcqOptions : null,
      correctAnswer: questionType === 'true_false' || questionType === 'short_answer' ? correctAnswer : null,
    };
    
    if (isEditing && editingQuestion && onUpdate) {
      onUpdate(editingQuestion.id, questionData);
    } else {
      onSave(questionData);
      onBack();
    }
  };

  const topics = ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming', 'Stacks', 'Queues', 'Binary Search', 'Sorting', 'Strings', 'Math', 'Design'];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-background-card border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold">{isEditing ? 'Edit Question' : 'Create New Question'}</h1>
              <p className="text-sm text-slate-500">{isEditing ? 'Modify your question' : 'Add a question to your question bank'}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onBack}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title || !description || !topic}
              className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">save</span>
              Save Question
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-background-card">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-1">
            {[
              { id: 'details', label: 'Details', icon: 'description', show: true },
              { id: 'testcases', label: 'Test Cases', icon: 'checklist', show: questionType === 'coding' },
              { id: 'code', label: 'Boilerplate Code', icon: 'code', show: questionType === 'coding' },
              { id: 'options', label: 'Options', icon: 'list', show: questionType === 'mcq' },
              { id: 'answer', label: 'Answer', icon: 'check_circle', show: questionType === 'true_false' || questionType === 'short_answer' },
            ].filter(tab => tab.show).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-6">
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Question Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Two Sum"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Problem Description * (Markdown supported)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the problem, provide examples, and list constraints..."
                    rows={12}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm flex items-center gap-1"
                      >
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      placeholder="Add a tag..."
                      className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">Question Type *</label>
                  <select
                    value={questionType}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType;
                      setQuestionType(newType);
                      setActiveTab('details');
                    }}
                    disabled={isEditing}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 disabled:opacity-60"
                  >
                    <option value="coding">Coding</option>
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="true_false">True / False</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Topic *</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="">Select a topic</option>
                    {topics.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Difficulty</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['easy', 'medium', 'hard'] as const).map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`py-2 px-3 rounded-lg font-medium capitalize text-sm transition-all ${
                          difficulty === d
                            ? d === 'easy'
                              ? 'bg-green-500 text-white'
                              : d === 'medium'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Points</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                {questionType === 'coding' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Time Limit (s)</label>
                    <input
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Memory (MB)</label>
                    <input
                      type="number"
                      value={memoryLimit}
                      onChange={(e) => setMemoryLimit(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'testcases' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Test Cases</h2>
                <p className="text-sm text-slate-500">Define input/output pairs for validation</p>
              </div>
              <button
                onClick={handleAddTestCase}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add Test Case
              </button>
            </div>

            {testCases.map((tc, index) => (
              <div
                key={tc.id}
                className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-5"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold">Test Case #{index + 1}</span>
                    <button
                      onClick={() => handleUpdateTestCase(tc.id, 'isHidden', !tc.isHidden)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        tc.isHidden
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {tc.isHidden ? 'visibility_off' : 'visibility'}
                      </span>
                      {tc.isHidden ? 'Hidden' : 'Visible'}
                    </button>
                  </div>
                  {testCases.length > 1 && (
                    <button
                      onClick={() => handleRemoveTestCase(tc.id)}
                      className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Input</label>
                    <textarea
                      value={tc.input}
                      onChange={(e) => handleUpdateTestCase(tc.id, 'input', e.target.value)}
                      placeholder="[2,7,11,15]\n9"
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Expected Output</label>
                    <textarea
                      value={tc.expectedOutput}
                      onChange={(e) => handleUpdateTestCase(tc.id, 'expectedOutput', e.target.value)}
                      placeholder="[0,1]"
                      rows={4}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Points</label>
                    <input
                      type="number"
                      value={tc.points}
                      onChange={(e) => handleUpdateTestCase(tc.id, 'points', Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Time Limit (ms)</label>
                    <input
                      type="number"
                      value={tc.timeLimit}
                      onChange={(e) => handleUpdateTestCase(tc.id, 'timeLimit', Number(e.target.value))}
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              {(['python', 'javascript', 'java', 'cpp'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => setSelectedLanguage(lang)}
                  className={`px-5 py-3 font-medium capitalize ${
                    selectedLanguage === lang
                      ? 'bg-primary/10 text-primary border-b-2 border-primary'
                      : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {lang === 'cpp' ? 'C++' : lang}
                </button>
              ))}
            </div>
            <div className="p-4">
              <p className="text-sm text-slate-500 mb-3">
                This code will be provided to students as a starting point.
              </p>
              <textarea
                value={boilerplate[selectedLanguage]}
                onChange={(e) => setBoilerplate({ ...boilerplate, [selectedLanguage]: e.target.value })}
                rows={15}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {activeTab === 'options' && questionType === 'mcq' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">Answer Options</h2>
                <p className="text-sm text-slate-500">Define the choices. Exactly one must be marked as correct.</p>
              </div>
              <button
                onClick={() => setMcqOptions([...mcqOptions, { id: `opt-${Date.now()}`, text: '', isCorrect: false }])}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Add Option
              </button>
            </div>

            {mcqOptions.map((opt, index) => (
              <div
                key={opt.id}
                className={`bg-white dark:bg-background-card rounded-xl border-2 p-5 flex items-start gap-4 ${
                  opt.isCorrect
                    ? 'border-green-500 dark:border-green-400'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <button
                  onClick={() => setMcqOptions(mcqOptions.map(o => ({ ...o, isCorrect: o.id === opt.id })))}
                  className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    opt.isCorrect
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-green-400'
                  }`}
                >
                  {opt.isCorrect && <span className="material-symbols-outlined text-sm">check</span>}
                </button>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Option {String.fromCharCode(65 + index)}</label>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => setMcqOptions(mcqOptions.map(o => o.id === opt.id ? { ...o, text: e.target.value } : o))}
                    placeholder={`Enter option ${String.fromCharCode(65 + index)}...`}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                {mcqOptions.length > 2 && (
                  <button
                    onClick={() => {
                      const filtered = mcqOptions.filter(o => o.id !== opt.id);
                      // If we removed the correct answer, mark the first one as correct
                      if (opt.isCorrect && filtered.length > 0) filtered[0].isCorrect = true;
                      setMcqOptions(filtered);
                    }}
                    className="mt-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                )}
              </div>
            ))}

            {mcqOptions.filter(o => o.isCorrect).length === 0 && mcqOptions.length > 0 && (
              <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                Please select one correct answer by clicking the circle next to an option.
              </p>
            )}
          </div>
        )}

        {activeTab === 'answer' && questionType === 'true_false' && (
          <div className="max-w-xl">
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold mb-2">Correct Answer</h2>
              <p className="text-sm text-slate-500 mb-6">Select whether the statement in the description is true or false.</p>
              <div className="flex gap-4">
                {(['true', 'false'] as const).map(val => (
                  <button
                    key={val}
                    onClick={() => setCorrectAnswer(val)}
                    className={`flex-1 py-4 px-6 rounded-xl font-bold text-lg capitalize border-2 transition-all ${
                      correctAnswer === val
                        ? val === 'true'
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                          : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'answer' && questionType === 'short_answer' && (
          <div className="max-w-xl">
            <div className="bg-white dark:bg-background-card rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <h2 className="text-lg font-bold mb-2">Correct Answer</h2>
              <p className="text-sm text-slate-500 mb-4">Enter the expected answer. Matching is case-insensitive and whitespace-trimmed.</p>
              <input
                type="text"
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="Enter the correct answer..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateQuestion;
