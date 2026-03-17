import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { Assessment, AssessmentAttempt, Question } from '../types';
import { assessmentService } from '../services/assessmentService';
import { demoAssessment, demoQuestions } from '../data/demoModeData';
import { useAuth } from './AuthContext';

export interface AssessmentContextType {
  assessments: Assessment[];
  currentAssessment: Assessment | null;
  currentAttempt: AssessmentAttempt | null;
  currentQuestionIndex: number;
  editingAssessment: Assessment | null;
  attempts: AssessmentAttempt[];
  addAssessment: (assessment: Omit<Assessment, 'id' | 'createdAt'>) => Promise<void>;
  updateAssessment: (id: string, updates: Partial<Assessment>) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  cloneAssessment: (assessmentId: string) => Promise<void>;
  startAssessment: (assessmentId: string) => Promise<void>;
  submitAssessment: () => Promise<void>;
  setEditingAssessment: (assessment: Assessment | null) => void;
  setCurrentQuestionIndex: (index: number) => void;
  /** Internal: set assessments directly (used by demo mode / bridge) */
  _setAssessments: (assessments: Assessment[]) => void;
  _setCurrentAssessment: (a: Assessment | null) => void;
  _setCurrentAttempt: (a: AssessmentAttempt | null) => void;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<AssessmentAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [attempts, setAttempts] = useState<AssessmentAttempt[]>([]);

  const { currentUser, isDemoMode, _onLoginSuccess, _addNotification } = useAuth();
  const isDemoModeRef = useRef(isDemoMode);

  useEffect(() => { isDemoModeRef.current = isDemoMode; }, [isDemoMode]);

  // Load assessments on login
  useEffect(() => {
    const handler = () => {
      assessmentService.getAll().then(data => setAssessments(data)).catch(() => {});
    };
    _onLoginSuccess.current.push(handler);
    return () => {
      _onLoginSuccess.current = _onLoginSuccess.current.filter(h => h !== handler);
    };
  }, [_onLoginSuccess]);

  // Bootstrap demo data
  useEffect(() => {
    if (isDemoMode) {
      const assessment: Assessment = { ...demoAssessment, questions: demoQuestions };
      setAssessments([assessment]);
      setAttempts([]);
      setCurrentAssessment(null);
      setCurrentAttempt(null);
      setCurrentQuestionIndex(0);
    }
  }, [isDemoMode]);

  const addAssessment = useCallback(async (assessment: Omit<Assessment, 'id' | 'createdAt'>) => {
    try {
      const created = await assessmentService.create({
        ...assessment,
        questionIds: assessment.questions?.map(q => q.id),
      });
      setAssessments(prev => [...prev, created]);
      _addNotification.current?.({ type: 'success', title: 'Assessment Created', message: `"${assessment.title}" has been created successfully.` });
    } catch (err) {
      console.error('Failed to create assessment:', err);
      const newAssessment: Assessment = { ...assessment, id: `assess-${Date.now()}`, createdAt: new Date().toISOString() };
      setAssessments(prev => [...prev, newAssessment]);
      _addNotification.current?.({ type: 'success', title: 'Assessment Created', message: `"${assessment.title}" created (offline).` });
    }
  }, [_addNotification]);

  const updateAssessment = useCallback(async (id: string, updates: Partial<Assessment>) => {
    try {
      const updated = await assessmentService.update(id, updates);
      setAssessments(prev => prev.map(a => a.id === id ? updated : a));
    } catch (err) {
      console.error('Failed to update assessment:', err);
      setAssessments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    }
  }, []);

  const deleteAssessment = useCallback(async (id: string) => {
    try {
      await assessmentService.delete(id);
      setAssessments(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to delete assessment:', err);
      _addNotification.current?.({ type: 'error', title: 'Delete Failed', message: 'Could not delete the assessment.' });
    }
  }, [_addNotification]);

  const cloneAssessment = useCallback(async (assessmentId: string) => {
    const original = assessments.find(a => a.id === assessmentId);
    if (!original) return;
    try {
      const cloned = await assessmentService.clone(assessmentId);
      setAssessments(prev => [...prev, cloned]);
      _addNotification.current?.({ type: 'success', title: 'Assessment Cloned', message: `"${cloned.title}" has been created.` });
    } catch (err) {
      console.error('Failed to clone assessment:', err);
      if (isDemoModeRef.current) {
        const cloned: Assessment = { ...original, id: `assess-${Date.now()}`, title: `${original.title} (Copy)`, status: 'draft', createdAt: new Date().toISOString() };
        setAssessments(prev => [...prev, cloned]);
        _addNotification.current?.({ type: 'success', title: 'Assessment Cloned', message: `"${cloned.title}" has been created.` });
      } else {
        _addNotification.current?.({ type: 'error', title: 'Clone Failed', message: 'Could not clone the assessment.' });
      }
    }
  }, [assessments, _addNotification]);

  const startAssessment = useCallback(async (assessmentId: string) => {
    try {
      if (isDemoModeRef.current) {
        const demoAssessmentData = assessments.find(a => a.id === assessmentId);
        if (!demoAssessmentData || !currentUser) return;
        const existingAttempt = attempts.find(
          a => a.assessmentId === assessmentId && a.studentId === currentUser.id && a.status === 'in-progress'
        );
        const attempt: AssessmentAttempt = existingAttempt || {
          id: `demo-attempt-${Date.now()}`,
          assessmentId,
          studentId: currentUser.id,
          startedAt: new Date().toISOString(),
          timeSpent: 0,
          score: 0,
          maxScore: demoAssessmentData.totalPoints,
          status: 'in-progress',
          submissions: [],
        };
        setCurrentAssessment(demoAssessmentData);
        setCurrentAttempt(attempt);
        setCurrentQuestionIndex(0);
        if (!existingAttempt) setAttempts(prev => [...prev, attempt]);
        return;
      }

      const assessment = await assessmentService.getById(assessmentId).catch(() =>
        assessments.find(a => a.id === assessmentId)
      );
      if (!assessment || !currentUser) return;
      const backendAttempt = await assessmentService.startAttempt(assessmentId).catch(() => null);
      const attempt: AssessmentAttempt = {
        id: backendAttempt?.id || `attempt-${Date.now()}`,
        assessmentId,
        studentId: currentUser.id,
        startedAt: backendAttempt?.startedAt || new Date().toISOString(),
        timeSpent: 0,
        score: 0,
        maxScore: assessment.totalPoints,
        status: 'in-progress',
        submissions: [],
      };
      setCurrentAssessment(assessment);
      setCurrentAttempt(attempt);
      setCurrentQuestionIndex(0);
      setAttempts(prev => [...prev, attempt]);
    } catch (err) {
      console.error('Failed to start assessment:', err);
    }
  }, [assessments, attempts, currentUser, _addNotification]);

  const submitAssessment = useCallback(async () => {
    // This will be wired by the bridge to access submissions
    // For now, handle the attempt completion
    if (!currentAttempt) return;
    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - new Date(currentAttempt.startedAt).getTime()) / 1000));
    const updatedAttempt = {
      ...currentAttempt,
      submittedAt: new Date().toISOString(),
      timeSpent: elapsedSeconds,
      status: 'submitted' as const,
    };
    setAttempts(prev => prev.map(a => a.id === updatedAttempt.id ? updatedAttempt : a));
    setCurrentAttempt(null);
    setCurrentAssessment(null);
    _addNotification.current?.({ type: 'success', title: 'Assessment Submitted', message: 'Your assessment has been submitted successfully!' });
  }, [currentAttempt, _addNotification]);

  return (
    <AssessmentContext.Provider value={{
      assessments,
      currentAssessment,
      currentAttempt,
      currentQuestionIndex,
      editingAssessment,
      attempts,
      addAssessment,
      updateAssessment,
      deleteAssessment,
      cloneAssessment,
      startAssessment,
      submitAssessment,
      setEditingAssessment,
      setCurrentQuestionIndex,
      _setAssessments: setAssessments,
      _setCurrentAssessment: setCurrentAssessment,
      _setCurrentAttempt: setCurrentAttempt,
    }}>
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessments = () => {
  const context = useContext(AssessmentContext);
  if (!context) throw new Error('useAssessments must be used within AssessmentProvider');
  return context;
};
