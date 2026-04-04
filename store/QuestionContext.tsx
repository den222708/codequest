import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Question } from '../types';
import { questionService } from '../services/questionService';
import { useAuth } from './AuthContext';

export interface QuestionContextType {
  questions: Question[];
  editingQuestion: Question | null;
  addQuestion: (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<void>;
  updateQuestion: (id: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  setEditingQuestion: (question: Question | null) => void;
  /** Internal: set questions directly (used by demo mode / bridge) */
  _setQuestions: (questions: Question[]) => void;
}

const QuestionContext = createContext<QuestionContextType | undefined>(undefined);

export const QuestionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const { _onLoginSuccess, _addNotification } = useAuth();

  // Register data loader for post-login
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await questionService.getAll();
        setQuestions(data);
      } catch { /* ignore */ }
    };
    const handler = () => { loadQuestions(); };
    _onLoginSuccess.current.push(handler);
    return () => {
      _onLoginSuccess.current = _onLoginSuccess.current.filter(h => h !== handler);
    };
  }, [_onLoginSuccess]);

  const addQuestion = useCallback(async (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    try {
      const created = await questionService.create(question);
      setQuestions(prev => [...prev, created]);
      _addNotification.current?.({ type: 'success', title: 'Question Created', message: `"${created.title}" added.` });
    } catch (err) {
      console.error('Failed to create question:', err);
      const newQuestion: Question = { ...question, id: `q-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), usageCount: 0 };
      setQuestions(prev => [...prev, newQuestion]);
    }
  }, [_addNotification]);

  const updateQuestion = useCallback(async (id: string, updates: Partial<Question>) => {
    try {
      const updated = await questionService.update(id, updates);
      setQuestions(prev => prev.map(q => q.id === id ? updated : q));
    } catch (err) {
      console.error('Failed to update question:', err);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q));
    }
  }, []);

  const deleteQuestion = useCallback(async (id: string) => {
    try {
      await questionService.delete(id);
      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (err) {
      console.error('Failed to delete question:', err);
      _addNotification.current?.({ type: 'error', title: 'Delete Failed', message: 'Could not delete the question.' });
    }
  }, [_addNotification]);

  const _setQuestions = useCallback((q: Question[]) => setQuestions(q), []);

  return (
    <QuestionContext.Provider value={{
      questions,
      editingQuestion,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      setEditingQuestion,
      _setQuestions,
    }}>
      {children}
    </QuestionContext.Provider>
  );
};

export const useQuestions = () => {
  const context = useContext(QuestionContext);
  if (!context) throw new Error('useQuestions must be used within QuestionProvider');
  return context;
};
